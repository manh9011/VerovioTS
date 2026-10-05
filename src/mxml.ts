/**
 * Faithful TS port of the MusicXML parse layer used by Tool_musicxml2hum
 * (src-cpp/src/hum/humlib.cpp: MxmlEvent ~49402-51664, MxmlMeasure
 * ~51671-52497, MxmlPart ~52504-53250, plus shared helpers).
 *
 * Only the XPath subset actually used by this path is supported by
 * selectNode/selectNodes below (caller passes the literal query):
 *  - "TAG", "./TAG", "mode" (first matching child)
 *  - "./measure", "figure" (all matching children)
 *  - "/score-partwise/..." absolute paths with optional [@attr='v']
 *  - "//group-symbol" (first descendant)
 */
import { Convert } from './convert.js';
import { HumNum } from './humlib.js';
import { xml_document, xml_node, xml_node_type } from './pugixml.js';

export enum MxmlEventType {
  unknown = 0,
  attributes,
  backup,
  barline,
  bookmark,
  direction,
  figured_bass,
  forward,
  grouping,
  harmony,
  link,
  note,
  print,
  sound,
  floatEvent,
}

export enum GridMeasureStyle {
  Invisible = 0,
  Plain,
  RepeatBackward,
  RepeatForward,
  RepeatBoth,
  Double,
  Final,
}

export enum GridSliceType {
  Invalid = 0,
  Notes = 1,
  GraceNotes = 2,
  Measures = 3,
  Clefs = 4,
  Transpositions = 5,
  KeyDesignations = 6,
  KeySigs = 7,
  TimeSigs = 8,
  MeterSigs = 9,
  Tempos = 10,
  Labels = 11,
  LabelAbbrs = 12,
  Ottavas = 13,
  Manipulators = 14,
  Layouts = 15,
  GlobalComments = 16,
  GlobalLayouts = 17,
  ReferenceRecords = 18,
}

export function mxmlNodeType(node: xml_node, testname: string): boolean {
  if (node.empty()) return false;
  return node.name() === testname;
}

function matchStep(node: xml_node, step: string): boolean {
  // step like "tag" or "tag[@attr='v']".
  const m = step.match(/^([A-Za-z_][\w.:-]*)(\[@([\w.:-]+)='([^']*)'\])?$/);
  if (!m) return false;
  if (node.name() !== m[1]) return false;
  if (m[3] !== undefined) return node.attribute(m[3]).value() === m[4];
  return true;
}

/** First node matching a minimal XPath (see module doc). */
export function selectNode(root: xml_node | xml_document, xpath: string): xml_node {
  const nodes = selectNodes(root, xpath);
  return nodes.length ? nodes[0] : new xml_node();
}

/** All nodes matching a minimal XPath (see module doc). */
export function selectNodes(root: xml_node | xml_document, xpath: string): xml_node[] {
  if (!xpath) return [];
  const docRoot: xml_node = root instanceof xml_document ? root.document_element() : root;
  if (docRoot.empty()) return [];
  if (xpath.startsWith('//')) {
    const out: xml_node[] = [];
    const step = xpath.slice(2);
    const visit = (n: xml_node): void => {
      for (const c of n.children()) {
        if (matchStep(c, step)) out.push(c);
        visit(c);
      }
    };
    visit(docRoot);
    return out;
  }
  if (xpath.startsWith('/')) {
    // Absolute path: first step names the document element.
    const steps = xpath.split('/').filter((s) => s.length > 0);
    if (!steps.length) return [];
    if (!matchStep(docRoot, steps[0])) return [];
    let cur: xml_node[] = [docRoot];
    for (const step of steps.slice(1)) {
      const next: xml_node[] = [];
      for (const n of cur) {
        for (const c of n.children()) {
          if (c.type() !== xml_node_type.node_element) continue;
          if (matchStep(c, step)) next.push(c);
        }
      }
      cur = next;
      if (!cur.length) break;
    }
    return cur;
  }
  const rel = xpath.startsWith('./') ? xpath.slice(2) : xpath;
  const out: xml_node[] = [];
  for (const c of docRoot.children()) {
    if (c.type() !== xml_node_type.node_element) continue;
    if (matchStep(c, rel)) out.push(c);
  }
  return out;
}

export function childValue(root: xml_node, xpath: string): string {
  return selectNode(root, xpath).child_value();
}

export function attributeValue(xnode: xml_node, target: string): string {
  if (xnode.empty()) return '';
  for (let at = xnode.first_attribute(); !at.empty(); at = at.next_attribute()) {
    if (at.name() === target) return at.value();
  }
  return '';
}

export function parseIntText(s: string): number {
  const n = Number.parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
}

export class SimultaneousEvents {
  starttime = new HumNum(0);
  duration = new HumNum(0);
  zerodur: MxmlEvent[] = [];
  nonzerodur: MxmlEvent[] = [];
}

let mxmlEventCounter = 0;
let mxmlDummyCounter = 0;

export class MxmlEvent {
  private m_starttime = new HumNum(0);
  private m_duration = new HumNum(0);
  private m_modification = new HumNum(1);
  private m_eventtype: MxmlEventType = MxmlEventType.unknown;
  private m_node = new xml_node();
  private m_owner: MxmlMeasure | null = null;
  private m_links: MxmlEvent[] = [];
  private m_linked = false;
  private m_sequence = -1;
  private m_staff = 0;
  private m_voice = -1;
  private m_voiceindex = -1;
  private m_hnode = new xml_node();
  private m_invisible = false;
  private m_stems = false;
  private m_dynamics: xml_node[] = [];
  private m_hairpinEnding = new xml_node();
  private m_figuredBass: xml_node[] = [];
  private m_brackets: xml_node[] = [];
  private m_text: Array<[number, xml_node]> = [];
  private m_tempo: Array<[number, xml_node]> = [];

  constructor(measure: MxmlMeasure | null) {
    this.clear();
    this.m_owner = measure;
    this.m_sequence = mxmlEventCounter++;
    this.m_stems = false;
  }

  clear(): void {
    this.m_starttime = new HumNum(0);
    this.m_duration = new HumNum(0);
    this.m_modification = new HumNum(1);
    this.m_eventtype = MxmlEventType.unknown;
    this.m_owner = null;
    this.m_linked = false;
    this.m_voice = -1;
    this.m_staff = 0;
    this.m_invisible = false;
    this.m_voiceindex = -1;
    this.m_sequence = -1;
    this.m_links = [];
  }

  enableStems(): void { this.m_stems = true; }

  makeDummyRest(owner: MxmlMeasure | null, starttime: HumNum, duration: HumNum,
    staffindex = 0, voiceindex = 0): void {
    this.m_starttime = starttime;
    this.m_duration = duration;
    this.m_eventtype = MxmlEventType.forward;
    this.m_linked = false;
    this.m_sequence = -mxmlDummyCounter++;
    this.m_voice = 1;
    this.m_voiceindex = voiceindex;
    this.m_staff = staffindex + 1;
    void owner;
  }

  setStartTime(v: HumNum): void { this.m_starttime = v; }
  setDuration(v: HumNum): void { this.m_duration = v; }
  getModification(): HumNum { return this.m_modification; }
  setModification(v: HumNum): void { this.m_modification = v; }
  getStartTime(): HumNum { return this.m_starttime; }
  getDuration(): HumNum { return this.m_duration; }
  setOwner(m: MxmlMeasure | null): void { this.m_owner = m; }
  getOwner(): MxmlMeasure | null { return this.m_owner; }

  getPartNumber(): number {
    if (!this.m_owner) return 0;
    return this.m_owner.getPartNumber();
  }
  getPartIndex(): number {
    if (!this.m_owner) return -1;
    return this.m_owner.getPartIndex();
  }

  setQTicks(value: number): number {
    if (value <= 0) return 0;
    if (this.m_owner) return this.m_owner.setQTicks(value);
    return 0;
  }
  getQTicks(): number {
    if (this.m_owner) return this.m_owner.getQTicks();
    return 0;
  }

  getIntValue(query: string): number {
    const val = childValue(this.m_node, query);
    if (val === '') return 0;
    return parseIntText(val);
  }

  setDurationByTicks(value: number, el: xml_node = new xml_node()): void {
    const ticks = this.getQTicks();
    if (ticks === 0) {
      this.setDuration(new HumNum(0));
      return;
    }
    if (this.isGrace()) {
      this.setDuration(new HumNum(0));
      return;
    }
    let val = new HumNum(value, ticks);
    const modification = { v: new HumNum(1) };
    if (!el.empty()) {
      const checkval = MxmlEvent.getEmbeddedDuration(modification, el);
      if (checkval.isZero() && this.isRest()) {
        // whole rest: keep tick duration.
      }
      else if (!checkval.equals(val)) {
        const difference = Math.abs(checkval.getFloat() - val.getFloat());
        if (difference < 0.1) val = checkval;
      }
    }
    this.setDuration(val);
    this.setModification(modification.v);
  }

  hasChild(query: string): boolean {
    return !selectNode(this.m_node, query).empty();
  }

  attachToLastEvent(): void {
    if (!this.m_owner) return;
    this.m_owner.attachLastEventToPrevious();
  }
  link(event: MxmlEvent): void {
    this.m_links.push(event);
    event.setLinked();
  }
  setLinked(): void { this.m_linked = true; }
  isLinked(): boolean { return this.m_linked; }

  isRest(): boolean {
    if (this.m_node.empty()) return false;
    for (let child = this.m_node.first_child(); !child.empty(); child = child.next_sibling()) {
      if (mxmlNodeType(child, 'rest')) return true;
    }
    return false;
  }

  isChord(): boolean {
    return this.m_links.length > 0 && mxmlNodeType(this.m_node, 'note');
  }

  isGrace(): boolean {
    const child = this.getNode();
    if (!mxmlNodeType(child, 'note')) return false;
    for (let c = child.first_child(); !c.empty(); c = c.next_sibling()) {
      if (mxmlNodeType(c, 'grace')) return true;
      if (mxmlNodeType(c, 'pitch')) return false;
    }
    return false;
  }

  hasGraceSlash(): boolean {
    const child = this.getNode();
    if (!mxmlNodeType(child, 'note')) return false;
    for (let c = child.first_child(); !c.empty(); c = c.next_sibling()) {
      if (mxmlNodeType(c, 'grace')) return c.attribute('slash').value() === 'yes';
      if (mxmlNodeType(c, 'pitch')) return false;
    }
    return false;
  }

  hasSlurStart(directions: number[]): number {
    directions.length = 0;
    let output = 0;
    const child = this.getNode();
    if (!mxmlNodeType(child, 'note')) return output;
    for (let c = child.first_child(); !c.empty(); c = c.next_sibling()) {
      if (!mxmlNodeType(c, 'notations')) continue;
      for (let g = c.first_child(); !g.empty(); g = g.next_sibling()) {
        if (!mxmlNodeType(g, 'slur')) continue;
        const slurtype = g.attribute('type');
        if (!slurtype.empty()) {
          if (slurtype.value() !== 'start') continue;
        }
        const orientation = g.attribute('orientation');
        let dir = 0;
        if (!orientation.empty()) {
          if (orientation.value() === 'over') dir = 1;
          else if (orientation.value() === 'under') dir = -1;
        }
        const placement = g.attribute('placement');
        if (!placement.empty()) {
          if (placement.value() === 'above') dir = 1;
          else if (placement.value() === 'below') dir = -1;
        }
        directions.push(dir);
        output++;
      }
    }
    return output;
  }

  hasSlurStop(): number {
    let output = 0;
    const child = this.getNode();
    if (!mxmlNodeType(child, 'note')) return output;
    for (let c = child.first_child(); !c.empty(); c = c.next_sibling()) {
      if (!mxmlNodeType(c, 'notations')) continue;
      for (let g = c.first_child(); !g.empty(); g = g.next_sibling()) {
        if (!mxmlNodeType(g, 'slur')) continue;
        const slurtype = g.attribute('type');
        if (!slurtype.empty() && slurtype.value() === 'stop') output++;
      }
    }
    return output;
  }

  isFloating(): boolean {
    return this.m_node.empty() && !this.m_hnode.empty();
  }

  getLinkedNotes(): MxmlEvent[] { return this.m_links; }
  getSequenceNumber(): number { return this.m_sequence; }
  getVoiceNumber(): number { return this.m_voice ? this.m_voice : 1; }
  setVoiceIndex(index: number): void { this.m_voiceindex = index; }

  getVoiceIndex(maxvoice = 4): number {
    if (this.m_voiceindex >= 0) return this.m_voiceindex;
    if (this.m_owner) {
      const voiceindex = this.m_owner.getVoiceIndex(this.m_voice);
      if (voiceindex >= 0) return voiceindex;
    }
    if (this.m_voiceindex < 0 && mxmlNodeType(this.m_node, 'note')) return 0;
    if (maxvoice < 1) maxvoice = 4;
    if (this.m_voice) return (this.m_voice - 1) % maxvoice;
    return 0;
  }

  forceInvisible(): void { this.m_invisible = true; }
  isInvisible(): boolean { return this.m_invisible; }

  getStaffIndex(): number {
    if (this.m_staff > 0) {
      const mapping = this.getOwner()?.getOwner()?.getVoiceMapping() ?? [];
      const vn = this.getVoiceNumber();
      // C++ guards `vn < size` but not `vn >= 0`; voice-less events
      // (m_voice=-1) hit mapping[-1] (UB, benign in practice: falls back
      // to m_staff-1). Mirror the observed behavior with a safe guard.
      if (vn >= 0 && vn < mapping.length) {
        const [mappingStaffIndex] = mapping[vn];
        if (this.m_staff - 1 !== mappingStaffIndex) return mappingStaffIndex;
      }
      return this.m_staff - 1;
    }
    if (this.m_owner) {
      const staffindex = this.m_owner.getStaffIndex(this.m_voice);
      if (staffindex >= 0) return staffindex;
    }
    if (!this.m_staff) return 0;
    return this.m_staff - 1;
  }

  getCrossStaffOffset(): number {
    if (this.m_staff > 0) {
      const mapping = this.getOwner()?.getOwner()?.getVoiceMapping() ?? [];
      const vn = this.getVoiceNumber();
      if (vn >= 0 && vn < mapping.length) {
        const [mappingStaffIndex] = mapping[vn];
        return this.m_staff - 1 - mappingStaffIndex;
      }
    }
    return 0;
  }

  setVoiceNumber(value: number): void { this.m_voice = value; }
  setStaffNumber(value: number): void { this.m_staff = value; }
  getStaffNumber(): number { return this.m_staff ? this.m_staff : 1; }
  getType(): MxmlEventType { return this.m_eventtype; }
  getNode(): xml_node { return this.m_node; }
  getHNode(): xml_node { return this.m_hnode; }
  getElementName(): string {
    if (!this.m_node.empty()) return this.m_node.name();
    return 'NULL';
  }

  reportVerseCountToOwner(count: number): void;
  reportVerseCountToOwner(staffindex: number, count: number): void;
  reportVerseCountToOwner(a: number, b?: number): void {
    if (!this.m_owner) return;
    if (b === undefined) this.m_owner.reportVerseCountToOwner(a);
    else this.m_owner.reportVerseCountToOwner(a, b);
  }
  private reportStaffNumberToOwner(staffnum: number, voicenum: number): void {
    if (!this.m_owner) return;
    this.m_owner.receiveStaffNumberFromChild(staffnum, voicenum);
  }
  private reportTimeSigDurToOwner(duration: HumNum): void {
    if (!this.m_owner) return;
    this.m_owner.receiveTimeSigDurFromChild(duration);
  }
  reportHarmonyCountToOwner(count: number): void {
    if (!this.m_owner) return;
    this.m_owner.reportHarmonyCountToOwner(count);
  }
  reportMeasureStyleToOwner(style: GridMeasureStyle): void {
    if (!this.m_owner) return;
    this.m_owner.receiveMeasureStyleFromChild(style);
  }
  reportEditorialAccidentalToOwner(): void {
    if (!this.m_owner) return;
    this.m_owner.reportEditorialAccidentalToOwner();
  }
  reportDynamicToOwner(): void {
    if (!this.m_owner) return;
    this.m_owner.reportDynamicToOwner();
  }
  reportFiguredBassToOwner(): void {
    if (!this.m_owner) return;
    this.m_owner.reportFiguredBassToOwner();
  }
  reportCaesuraToOwner(letter = 'Z'): void {
    if (!this.m_owner) return;
    this.m_owner.reportCaesuraToOwner(letter);
  }
  reportOrnamentToOwner(): void {
    if (!this.m_owner) return;
    this.m_owner.reportOrnamentToOwner();
  }

  setBarlineStyle(node: xml_node): void {
    let repeat = 0;
    let barstyle = '';
    for (let child = node.first_child(); !child.empty(); child = child.next_sibling()) {
      if (mxmlNodeType(child, 'bar-style')) barstyle = child.child_value();
      else if (mxmlNodeType(child, 'repeat')) {
        if (child.attribute('direction').value() === 'backward') repeat = -1;
        else if (child.attribute('direction').value() === 'forward') repeat = 1;
      }
    }
    if (repeat === 0 && barstyle === 'light-light') this.reportMeasureStyleToOwner(GridMeasureStyle.Double);
    else if (repeat === 0 && barstyle === 'light-heavy') this.reportMeasureStyleToOwner(GridMeasureStyle.Final);
    else if (repeat === -1 && barstyle === 'light-heavy') this.reportMeasureStyleToOwner(GridMeasureStyle.RepeatBackward);
    else if (repeat === 1) this.reportMeasureStyleToOwner(GridMeasureStyle.RepeatForward);
  }

  getTimeSigDur(): HumNum {
    if (!mxmlNodeType(this.m_node, 'attributes')) return new HumNum(0);
    let beats = 0;
    let beattype = 0;
    for (let c = this.m_node.first_child(); !c.empty(); c = c.next_sibling()) {
      if (!mxmlNodeType(c, 'time')) continue;
      for (let g = c.first_child(); !g.empty(); g = g.next_sibling()) {
        if (mxmlNodeType(g, 'beats')) beats = parseIntText(g.child_value());
        else if (mxmlNodeType(g, 'beat-type')) beattype = parseIntText(g.child_value());
      }
    }
    if (!beats || !beattype) return new HumNum(0);
    return new HumNum(beats * 4, beattype);
  }

  getDotCount(): number {
    let output = 0;
    let foundType = false;
    for (let child = this.m_node.first_child(); !child.empty(); child = child.next_sibling()) {
      if (mxmlNodeType(child, 'type')) foundType = true;
      if (output && !mxmlNodeType(child, 'dot')) return output;
      if (child.name() === 'dot') output++;
    }
    if (foundType) return output;
    return -1;
  }

  getRestPitch(): string {
    const rest = selectNode(this.m_node, './rest');
    if (rest.empty()) return '';
    const steptext = childValue(rest, './display-step');
    if (!steptext) return '';
    const octavetext = childValue(rest, './display-octave');
    if (!octavetext) return '';
    const octaveval = parseIntText(octavetext);
    let pc = steptext[0];
    let count: number;
    if (octaveval > 3) {
      pc = pc.toLowerCase();
      count = octaveval - 3;
    }
    else {
      pc = pc.toUpperCase();
      count = 4 - octaveval;
    }
    return pc.repeat(count);
  }

  getRecip(): string {
    let dur = new HumNum(this.m_duration.getNumerator(), this.m_duration.getDenominator());
    dur = dur.div(new HumNum(4));
    let n = this.getDotCount();
    if (n > 0) {
      dur = dur.mul(new HumNum(1 << n, (1 << (n + 1)) - 1));
    }
    else if (n < 0) {
      if (dur.getNumerator() !== 1) {
        const onedotdur = dur.mul(new HumNum(2, 3));
        if (onedotdur.getNumerator() === 1) {
          dur = onedotdur;
          n = 1;
        }
        else {
          const twodotdur = dur.mul(new HumNum(4, 7));
          if (twodotdur.getNumerator() === 1) {
            dur = twodotdur;
            n = 2;
          }
          else {
            const threedotdur = dur.mul(new HumNum(8, 15));
            if (threedotdur.getNumerator() === 1) {
              dur = threedotdur;
              n = 3;
            }
          }
        }
      }
    }
    let out = String(dur.getDenominator());
    if (dur.getNumerator() !== 1) out += '%' + String(dur.getNumerator());
    for (let i = 0; i < n; i++) out += '.';
    return out;
  }

  getKernPitch(): string {
    let rest = false;
    if (this.m_node.empty()) return 'r';
    let step = '';
    let alter = 0;
    let octave = 4;
    let explicitQ = false;
    let naturalQ = false;
    let editorialQ = false;
    let unpitchedQ = false;
    if (mxmlNodeType(this.m_node, 'forward')) {
      rest = true;
      this.forceInvisible();
    }
    else {
      for (let child = this.m_node.first_child(); !child.empty(); child = child.next_sibling()) {
        if (mxmlNodeType(child, 'rest')) {
          rest = true;
          break;
        }
        if (mxmlNodeType(child, 'pitch')) {
          for (let g = child.first_child(); !g.empty(); g = g.next_sibling()) {
            if (mxmlNodeType(g, 'step')) step = g.child_value();
            else if (mxmlNodeType(g, 'alter')) alter = parseIntText(g.child_value());
            else if (mxmlNodeType(g, 'octave')) octave = parseIntText(g.child_value());
          }
        }
        else if (mxmlNodeType(child, 'unpitched')) {
          unpitchedQ = true;
          for (let g = child.first_child(); !g.empty(); g = g.next_sibling()) {
            if (mxmlNodeType(g, 'display-step')) step = g.child_value();
            else if (mxmlNodeType(g, 'alter')) alter = parseIntText(g.child_value());
            else if (mxmlNodeType(g, 'display-octave')) octave = parseIntText(g.child_value());
          }
        }
        else if (mxmlNodeType(child, 'accidental')) {
          const v = child.child_value();
          if (v === 'natural') {
            naturalQ = true;
            explicitQ = true;
          }
          else if (v === 'sharp' || v === 'flat' || v === 'double-flat' || v === 'double-sharp') {
            explicitQ = true;
          }
          if (child.attribute('parentheses').value() === 'yes') {
            editorialQ = true;
            this.reportEditorialAccidentalToOwner();
          }
          if (child.attribute('cautionary').value() === 'yes') {
            editorialQ = true;
            this.reportEditorialAccidentalToOwner();
          }
        }
      }
    }
    if (rest) return 'r';
    let count = 1;
    let pc = 'X';
    if (step.length > 0) pc = step[0];
    if (octave > 3) {
      pc = pc.toLowerCase();
      count = octave - 3;
    }
    else {
      pc = pc.toUpperCase();
      count = 4 - octave;
    }
    let output = unpitchedQ ? 'R' : '';
    output += pc.repeat(count);
    if (alter > 0) output += '#'.repeat(alter);
    else if (alter < 0) output += '-'.repeat(-alter);
    if (naturalQ) output += 'n';
    else if (explicitQ) output += 'X';
    if (editorialQ) output += 'i';
    return output;
  }

  getPrefixNoteInfo(): string {
    let tiestart = 0;
    let tiestop = 0;
    for (let child = this.m_node.first_child(); !child.empty(); child = child.next_sibling()) {
      if (!mxmlNodeType(child, 'tie')) continue;
      const tietype = child.attribute('type');
      if (tietype.empty()) continue;
      if (tietype.value() === 'start') tiestart = 1;
      else if (tietype.value() === 'stop') tiestop = 1;
    }
    if (tiestart && !tiestop) return '[';
    return '';
  }

  getPostfixNoteInfo(primarynote: boolean, recip: string): string {
    let beamstarts = 0;
    let beamends = 0;
    let hookbacks = 0;
    let hookforwards = 0;
    let stem = 0;
    let tiestart = 0;
    let tiestop = 0;
    let unpitchedQ = false;
    const stemsQ = this.m_stems;
    let notations = new xml_node();
    for (let child = this.m_node.first_child(); !child.empty(); child = child.next_sibling()) {
      if (mxmlNodeType(child, 'rest')) {
        // rest = true;
      }
      else if (child.name() === 'beam') {
        const beaminfo = child.child_value();
        if (beaminfo === 'begin') beamstarts++;
        else if (beaminfo === 'end') beamends++;
        else if (beaminfo === 'forward hook') hookforwards++;
        else if (beaminfo === 'backward hook') hookbacks++;
      }
      else if (mxmlNodeType(child, 'unpitched')) unpitchedQ = true;
      else if (mxmlNodeType(child, 'stem')) {
        if (unpitchedQ || stemsQ || this.getVoiceIndex() >= 2 || this.getDuration().isZero()) {
          const stemdir = child.child_value();
          if (stemdir === 'up') stem = 1;
          else if (stemdir === 'down') stem = -1;
        }
      }
      else if (mxmlNodeType(child, 'notations')) notations = child;
      else if (mxmlNodeType(child, 'tie')) {
        const tietype = child.attribute('type');
        if (!tietype.empty()) {
          if (tietype.value() === 'start') tiestart = 1;
          else if (tietype.value() === 'stop') tiestop = 1;
        }
      }
    }
    let ss = '';
    ss += this.addNotations(notations, beamstarts, recip);
    if (primarynote) {
      if (stem === 1) ss += '/';
      else if (stem === -1) ss += '\\';
      ss += 'J'.repeat(beamends);
      ss += 'k'.repeat(hookbacks);
      ss += 'K'.repeat(hookforwards);
      ss += 'L'.repeat(beamstarts);
    }
    if (tiestart && tiestop) ss += '_';
    else if (tiestop) ss += ']';
    if (this.getCrossStaffOffset() > 0) ss += '<';
    else if (this.getCrossStaffOffset() < 0) ss += '>';
    return ss;
  }

  addNotations(notations: xml_node, beamstarts: number, recip: string): string {
    if (notations.empty()) return '';
    let staccato = false;
    let staccatissimo = false;
    let accent = false;
    let tenuto = false;
    let strongaccent = false;
    let fermata = false;
    let trill = false;
    let tremolo = 0;
    let fingered = false;
    let umordent = false;
    let lmordent = false;
    let upbow = false;
    let downbow = false;
    let harmonic = false;
    let breath = false;
    let caesura = false;
    let arpeggio = false;
    for (let child = notations.first_child(); !child.empty(); child = child.next_sibling()) {
      if (child.name() === 'articulations') {
        for (let g = child.first_child(); !g.empty(); g = g.next_sibling()) {
          if (g.name() === 'staccato') staccato = true;
          else if (g.name() === 'staccatissimo' || g.name() === 'spiccato') staccatissimo = true;
          else if (g.name() === 'accent') accent = true;
          else if (g.name() === 'tenuto') tenuto = true;
          else if (g.name() === 'breath-mark') breath = true;
          else if (g.name() === 'caesura') caesura = true;
          else if (g.name() === 'strong-accent') strongaccent = true;
          else if (g.name() === 'detached-legato') {
            tenuto = true;
            staccato = true;
          }
        }
      }
      else if (child.name() === 'technical') {
        for (let g = child.first_child(); !g.empty(); g = g.next_sibling()) {
          if (g.name() === 'up-bow') upbow = true;
          else if (g.name() === 'down-bow') downbow = true;
          else if (g.name() === 'harmonic') {
            if (selectNode(g, 'artificial').empty()) harmonic = true;
          }
        }
      }
      else if (child.name() === 'ornaments') {
        for (let g = child.first_child(); !g.empty(); g = g.next_sibling()) {
          if (g.name() === 'trill-mark') trill = true;
          if (g.name() === 'tremolo') {
            const ttype = g.attribute('type').value();
            fingered = ttype === 'start';
            if (ttype !== 'stop') tremolo = 1 << (parseIntText(g.child_value()) + 2);
          }
          if (g.name() === 'inverted-mordent') umordent = true;
          if (g.name() === 'mordent') lmordent = true;
        }
      }
      else if (child.name() === 'fermata') fermata = true;
      else if (child.name() === 'arpeggiate') arpeggio = true;
    }
    let ss = '';
    if (staccato) ss += "'";
    if (staccatissimo) ss += '`';
    if (tenuto) ss += '~';
    if (accent) ss += '^';
    if (strongaccent) ss += '^^';
    if (harmonic) ss += 'o';
    if (trill) {
      ss += 't';
      this.reportOrnamentToOwner();
    }
    if (fermata) ss += ';';
    if (upbow) ss += 'v';
    if (downbow) ss += 'u';
    if (umordent) {
      ss += 'm';
      this.reportOrnamentToOwner();
    }
    if (lmordent) {
      ss += 'w';
      this.reportOrnamentToOwner();
    }
    if (breath) ss += ',';
    if (caesura) {
      ss += 'Z';
      this.reportCaesuraToOwner();
    }
    if (arpeggio) ss += ':';
    if (tremolo >= 8) {
      let tvalue = new HumNum(tremolo);
      if (fingered) {
        if (beamstarts) tvalue = tvalue.mul(new HumNum(1 << beamstarts));
        tvalue = tvalue.mul(this.m_modification);
        ss += tvalue.isInteger() ? `@@${tvalue.getInteger()}@@`
          : `@@${tvalue.getNumerator()}%${tvalue.getDenominator()}@@`;
      }
      else {
        const duration = stringToDurationNoDots(recip);
        if (duration.getFloat() > 0 && duration.getFloat() < 1) {
          const twopow = Math.trunc(-Math.log2(duration.getFloat()));
          tvalue = tvalue.mul(new HumNum(1 << twopow));
        }
        tvalue = tvalue.mul(this.m_modification);
        ss += tvalue.isInteger() ? `@${tvalue.getInteger()}@`
          : `@${tvalue.getNumerator()}%${tvalue.getDenominator()}@`;
      }
    }
    return ss;
  }

  setTexts(nodes: Array<[number, xml_node]>): void { this.m_text = nodes; }
  getTexts(): Array<[number, xml_node]> { return this.m_text; }
  setTempos(nodes: Array<[number, xml_node]>): void { this.m_tempo = nodes; }
  getTempos(): Array<[number, xml_node]> { return this.m_tempo; }
  setDynamics(node: xml_node): void { this.m_dynamics.push(node); }
  setBracket(node: xml_node): void { this.m_brackets.push(node); }
  setHairpinEnding(node: xml_node): void { this.m_hairpinEnding = node; }
  addFiguredBass(node: xml_node): void { this.m_figuredBass.push(node); }
  getDynamics(): xml_node[] { return this.m_dynamics; }
  getBrackets(): xml_node[] { return this.m_brackets; }
  getHairpinEnding(): xml_node { return this.m_hairpinEnding; }
  getFiguredBassCount(): number { return this.m_figuredBass.length; }
  getFiguredBass(index: number): xml_node { return this.m_figuredBass[index] ?? new xml_node(); }

  parseEvent(el: xml_node, nextel: xml_node, starttime: HumNum): boolean {
    this.m_node = el;
    let floatingharmony = false;
    if (mxmlNodeType(this.m_node, 'attributes')) this.m_eventtype = MxmlEventType.attributes;
    else if (mxmlNodeType(this.m_node, 'backup')) this.m_eventtype = MxmlEventType.backup;
    else if (mxmlNodeType(this.m_node, 'barline')) {
      this.m_eventtype = MxmlEventType.barline;
      this.setBarlineStyle(this.m_node);
    }
    else if (mxmlNodeType(this.m_node, 'bookmark')) this.m_eventtype = MxmlEventType.bookmark;
    else if (mxmlNodeType(this.m_node, 'direction')) this.m_eventtype = MxmlEventType.direction;
    else if (mxmlNodeType(this.m_node, 'figured-bass')) this.m_eventtype = MxmlEventType.figured_bass;
    else if (mxmlNodeType(this.m_node, 'forward')) {
      this.m_eventtype = MxmlEventType.forward;
      this.m_staff = -1;
      this.m_voice = -1;
    }
    else if (mxmlNodeType(this.m_node, 'grouping')) this.m_eventtype = MxmlEventType.grouping;
    else if (mxmlNodeType(this.m_node, 'harmony')) {
      this.m_eventtype = MxmlEventType.harmony;
      if (!mxmlNodeType(nextel, 'note')) {
        floatingharmony = true;
        this.m_staff = -1;
        this.m_voice = -1;
      }
    }
    else if (mxmlNodeType(this.m_node, 'link')) this.m_eventtype = MxmlEventType.link;
    else if (mxmlNodeType(this.m_node, 'note')) {
      this.m_eventtype = MxmlEventType.note;
      this.m_staff = 1;
      this.m_voice = -1;
    }
    else if (mxmlNodeType(this.m_node, 'print')) this.m_eventtype = MxmlEventType.print;
    else if (mxmlNodeType(this.m_node, 'sound')) this.m_eventtype = MxmlEventType.sound;
    else this.m_eventtype = MxmlEventType.unknown;

    let tempstaff = 1;
    let tempvoice = -1;
    let tempduration = 0;
    for (let c = this.m_node.first_child(); !c.empty(); c = c.next_sibling()) {
      if (mxmlNodeType(c, 'staff')) tempstaff = parseIntText(c.child_value());
      else if (mxmlNodeType(c, 'voice')) tempvoice = parseIntText(c.child_value());
      else if (mxmlNodeType(c, 'duration')) {
        tempduration = parseIntText(c.child_value());
        if (mxmlNodeType(this.m_node, 'figured-bass')) tempduration = 0;
      }
    }

    let emptyvoice = false;
    if (!floatingharmony && tempvoice < 0) {
      emptyvoice = true;
      if (mxmlNodeType(el, 'note')) this.setVoiceIndex(0);
    }

    if (this.m_eventtype === MxmlEventType.forward) {
      const pel = el.previous_sibling();
      if (mxmlNodeType(pel, 'harmony')) {
        this.m_voice = -1;
        tempvoice = -1;
        this.m_staff = -1;
        tempstaff = -1;
      }
    }

    if (tempvoice >= 0) this.m_voice = tempvoice;
    if (tempstaff > 0) this.m_staff = tempstaff;
    if (!emptyvoice) this.reportStaffNumberToOwner(this.m_staff, this.m_voice);

    const measure = this.getOwner();
    const mst = measure ? measure.getStartTime() : new HumNum(0);
    this.setStartTime(starttime);

    const et: number = this.m_eventtype as number;
    switch (et) {
      case MxmlEventType.note as number:
        this.setDuration(new HumNum(0));
        if (this.hasChild('./chord')) {
          this.setDuration(new HumNum(0));
          this.attachToLastEvent();
        }
        else this.setDurationByTicks(tempduration, el);
        break;
      case MxmlEventType.forward as number:
        if (tempduration === 1) {
          const ticks = this.getQTicks();
          if (ticks !== 0 && tempduration / ticks < 0.0001) {
            tempduration = 0;
            this.m_eventtype = MxmlEventType.unknown;
          }
        }
        else if (tempduration < 4) {
          const ticks = this.getQTicks();
          if (ticks !== 0 && tempduration / ticks < 0.01) {
            // C++ prints a warning; TS keeps the log quiet (log verified same path).
          }
        }
        this.setDurationByTicks(tempduration);
        break;
      case MxmlEventType.backup as number: {
        this.setDurationByTicks(-tempduration);
        const dur = this.getDuration();
        const difference = starttime.sub(mst).add(dur);
        if (difference.getFloat() < 0) this.setDuration(dur.sub(difference));
        break;
      }
      case MxmlEventType.attributes as number: {
        this.setQTicks(this.getIntValue('./divisions'));
        const timesigdur = this.getTimeSigDur();
        if (timesigdur.getFloat() > 0) this.reportTimeSigDurToOwner(timesigdur);
        break;
      }
      case MxmlEventType.figured_bass as number:
      case MxmlEventType.harmony as number:
      case MxmlEventType.barline as number:
      case MxmlEventType.bookmark as number:
      case MxmlEventType.grouping as number:
      case MxmlEventType.link as number:
      case MxmlEventType.direction as number:
      case MxmlEventType.print as number:
      case MxmlEventType.sound as number:
      case MxmlEventType.unknown as number:
        this.setDuration(new HumNum(tempduration));
        break;
      case MxmlEventType.floatEvent as number:
        // assigned later for floating harmony
        break;
    }

    if (floatingharmony) {
      this.m_hnode = el;
      this.m_eventtype = MxmlEventType.floatEvent;
      this.m_duration = new HumNum(0);
      this.m_node = new xml_node();
      this.m_voice = 1;
      this.m_voiceindex = 0;
    }
    else {
      const lastsib = el.previous_sibling();
      if (lastsib.empty()) return true;
      if (mxmlNodeType(lastsib, 'harmony')) this.m_hnode = lastsib;
    }
    return true;
  }

  static getQuarterDurationFromType(type: string): HumNum {
    if (type === 'quarter') return new HumNum(1);
    if (type === 'eighth') return new HumNum(1, 2);
    if (type === 'half') return new HumNum(2);
    if (type === '16th') return new HumNum(1, 4);
    if (type === 'whole') return new HumNum(4);
    if (type === '32nd') return new HumNum(1, 8);
    if (type === '64th') return new HumNum(1, 16);
    if (type === '128th') return new HumNum(1, 32);
    if (type === '256th') return new HumNum(1, 64);
    if (type === '512th') return new HumNum(1, 128);
    if (type === '1024th') return new HumNum(1, 256);
    if (type === 'breve') return new HumNum(8);
    if (type === 'long') return new HumNum(16);
    if (type === 'maxima') return new HumNum(32);
    return new HumNum(0);
  }

  static getEmbeddedDuration(modification: { v: HumNum }, el: xml_node): HumNum {
    if (el.empty()) return new HumNum(0);
    let dots = 0;
    let type = new HumNum(0);
    let tuplet = false;
    let actualnotes = 1;
    let normalnotes = 1;
    let normaltype = new HumNum(0);
    let tupdots = 0;
    modification.v = new HumNum(1);
    for (let child = el.first_child(); !child.empty(); child = child.next_sibling()) {
      if (child.name() === 'dot') dots++;
      else if (child.name() === 'type') type = MxmlEvent.getQuarterDurationFromType(child.child_value());
      else if (child.name() === 'time-modification') {
        normaltype = type;
        tuplet = true;
        for (let g = child.first_child(); !g.empty(); g = g.next_sibling()) {
          if (g.name() === 'actual-notes') actualnotes = parseIntText(g.child_value());
          else if (g.name() === 'normal-notes') normalnotes = parseIntText(g.child_value());
        }
        break;
      }
      else if (child.name() === 'normal-dot') tupdots++;
    }
    let duration = type;
    if (dots) {
      let newdur = duration;
      for (let i = 0; i < dots; i++) newdur = newdur.add(duration.div(new HumNum(1 << (i + 1))));
      duration = newdur;
    }
    if (tuplet) {
      modification.v = new HumNum(actualnotes, normalnotes);
      duration = duration.div(modification.v);
      if (!normaltype.equals(type)) {
        // C++ warns; TS quiet.
      }
      if (tupdots !== 0) {
        // C++ warns; TS quiet.
      }
    }
    return duration;
  }
}

function stringToDurationNoDots(recip: string): HumNum {
  // C++ humlib.cpp:5236 Convert::recipToDurationNoDots() is only
  // recipToDuration() with dots masked out.
  return Convert.recipToDurationNoDots(recip);
}

export class MxmlMeasure {
  private m_starttime = new HumNum(0);
  private m_duration = new HumNum(0);
  private m_timesigdur = new HumNum(-1);
  private m_events: MxmlEvent[] = [];
  private m_sortedevents: SimultaneousEvents[] = [];
  private m_owner: MxmlPart | null = null;
  private m_previous: MxmlMeasure | null = null;
  private m_following: MxmlMeasure | null = null;
  private m_stems = false;
  private m_style: GridMeasureStyle = GridMeasureStyle.Plain;

  constructor(part: MxmlPart | null) {
    this.clear();
    this.setOwner(part);
  }

  clear(): void {
    this.m_starttime = new HumNum(0);
    this.m_duration = new HumNum(0);
    this.m_events = [];
    this.m_owner = null;
    this.m_timesigdur = new HumNum(-1);
    this.m_previous = null;
    this.m_following = null;
    this.m_style = GridMeasureStyle.Plain;
  }

  enableStems(): void { this.m_stems = true; }

  parseMeasure(mel: xml_node): boolean {
    let output = true;
    this.setStartTimeOfMeasure();
    let starttime = this.getStartTime();
    const st = new HumNum(starttime.getNumerator(), starttime.getDenominator());
    let maxst = new HumNum(starttime.getNumerator(), starttime.getDenominator());
    for (let el = mel.first_child(); !el.empty(); el = el.next_sibling()) {
      const event = new MxmlEvent(this);
      if (this.m_stems) event.enableStems();
      this.m_events.push(event);
      const nextel = el.next_sibling();
      output = event.parseEvent(el, nextel, starttime) && output;
      starttime = starttime.add(event.getDuration());
      if (starttime.getFloat() > maxst.getFloat()) maxst = starttime;
    }
    this.setDuration(maxst.sub(st));

    let needdummy = false;
    const pmeasure = this.getPreviousMeasure();
    if (this.getTimeSigDur().getFloat() <= 0 && pmeasure) {
      this.setTimeSigDur(pmeasure.getTimeSigDur());
    }
    if (this.getDuration().isZero()) {
      if (pmeasure) this.setDuration(pmeasure.getTimeSigDur());
      else this.setTimeSigDur(this.getTimeSigDur());
      needdummy = true;
    }
    if (needdummy || this.getEventCount() === 0) {
      this.setDuration(this.getTimeSigDur());
      this.addDummyRest();
    }
    this.sortEvents();
    return output;
  }

  forceLastInvisible(): void {
    if (this.m_events.length) this.m_events[this.m_events.length - 1].forceInvisible();
  }
  getEventList(): MxmlEvent[] { return this.m_events; }

  addDummyRest(): void;
  addDummyRest(starttime: HumNum, duration: HumNum, staffindex: number, voiceindex: number): void;
  addDummyRest(starttime?: HumNum, duration?: HumNum, staffindex = 0, voiceindex = 0): void {
    const event = new MxmlEvent(this);
    this.m_events.push(event);
    if (starttime === undefined || duration === undefined) {
      event.makeDummyRest(this, this.getStartTime(), this.getTimeSigDur());
    }
    else event.makeDummyRest(this, starttime, duration, staffindex, voiceindex);
  }

  setStartTimeOfMeasure(): void;
  setStartTimeOfMeasure(value: HumNum): void;
  setStartTimeOfMeasure(value?: HumNum): void {
    if (value !== undefined) {
      this.m_starttime = value;
      return;
    }
    if (!this.m_owner) {
      this.setStartTimeOfMeasure(new HumNum(0));
      return;
    }
    const previous = this.m_owner.getPreviousMeasure(this);
    if (!previous) {
      this.setStartTimeOfMeasure(new HumNum(0));
      return;
    }
    this.setStartTimeOfMeasure(previous.getStartTime().add(previous.getDuration()));
  }

  calculateDuration(): void {
    let maxdur = new HumNum(0);
    let sum = new HumNum(0);
    for (const e of this.m_events) {
      e.setStartTime(sum.add(this.getStartTime()));
      sum = sum.add(e.getDuration());
      if (sum.getFloat() > maxdur.getFloat()) maxdur = sum;
    }
    this.setDuration(maxdur);
  }

  setDuration(v: HumNum): void { this.m_duration = v; }
  getStartTime(): HumNum { return this.m_starttime; }
  getDuration(): HumNum { return this.m_duration; }
  setOwner(part: MxmlPart | null): void { this.m_owner = part; }
  getOwner(): MxmlPart | null { return this.m_owner; }

  reportVerseCountToOwner(count: number): void;
  reportVerseCountToOwner(staffindex: number, count: number): void;
  reportVerseCountToOwner(a: number, b?: number): void {
    if (!this.m_owner) return;
    if (b === undefined) this.m_owner.receiveVerseCount(a);
    else this.m_owner.receiveVerseCount(a, b);
  }
  reportHarmonyCountToOwner(count: number): void {
    if (!this.m_owner) return;
    this.m_owner.receiveHarmonyCount(count);
  }
  reportDynamicToOwner(): void {
    if (this.m_owner) this.m_owner.receiveDynamic();
  }
  reportFiguredBassToOwner(): void {
    if (this.m_owner) this.m_owner.receiveFiguredBass();
  }
  reportCaesuraToOwner(letter: string): void {
    if (this.m_owner) this.m_owner.receiveCaesura(letter);
  }
  reportOrnamentToOwner(): void {
    if (this.m_owner) this.m_owner.receiveOrnament();
  }
  reportEditorialAccidentalToOwner(): void {
    if (this.m_owner) this.m_owner.receiveEditorialAccidental();
  }

  getPartNumber(): number {
    if (!this.m_owner) return 0;
    return this.m_owner.getPartNumber();
  }
  getPartIndex(): number {
    if (!this.m_owner) return -1;
    return this.m_owner.getPartIndex();
  }
  setQTicks(value: number): number {
    if (this.m_owner) return this.m_owner.setQTicks(value);
    return 0;
  }
  getQTicks(): number {
    if (this.m_owner) return this.m_owner.getQTicks();
    return 0;
  }

  attachLastEventToPrevious(): void {
    if (this.m_events.length < 2) return;
    const event = this.m_events[this.m_events.length - 1];
    this.m_events.length = this.m_events.length - 1;
    this.m_events[this.m_events.length - 1].link(event);
  }

  getEventCount(): number { return this.m_events.length; }
  getSortedEvents(): SimultaneousEvents[] { return this.m_sortedevents; }
  getEvent(index: number): MxmlEvent | null {
    if (index < 0 || index >= this.m_events.length) return null;
    return this.m_events[index];
  }
  setNextMeasure(m: MxmlMeasure | null): void { this.m_following = m; }
  setPreviousMeasure(m: MxmlMeasure | null): void { this.m_previous = m; }
  getPreviousMeasure(): MxmlMeasure | null { return this.m_previous; }
  getNextMeasure(): MxmlMeasure | null { return this.m_following; }
  getVoiceIndex(voicenum: number): number {
    if (this.m_owner) return this.m_owner.getVoiceIndex(voicenum);
    return -1;
  }
  getStaffIndex(voicenum: number): number {
    if (this.m_owner) return this.m_owner.getStaffIndex(voicenum);
    return -1;
  }

  sortEvents(): void {
    const times: HumNum[] = [];
    for (const e of this.m_events) {
      if (!times.some((t) => t.equals(e.getStartTime()))) times.push(e.getStartTime());
    }
    times.sort((a, b) => a.getFloat() - b.getFloat());
    // Mirror C++ vector::resize semantics (humlib MxmlMeasure::sortEvents):
    // entries from a previous call are kept (not cleared), so a second call
    // (after checkForDummyRests) duplicates every event into the lists.
    while (this.m_sortedevents.length < times.length) this.m_sortedevents.push(new SimultaneousEvents());
    this.m_sortedevents.length = times.length;
    for (let i = 0; i < times.length; i++) this.m_sortedevents[i].starttime = times[i];
    const mapping = new Map<string, SimultaneousEvents>();
    for (const s of this.m_sortedevents) mapping.set(s.starttime.getFloat() + '/' + s.starttime.getInteger(), s);
    const key = (t: HumNum): string => t.getFloat() + '/' + t.getInteger();
    for (const e of this.m_events) {
      switch (e.getType()) {
        case MxmlEventType.backup:
          continue;
        case MxmlEventType.forward:
          if (!e.getDuration().equals(this.getDuration()) && e.getVoiceIndex() < 0) continue;
          break;
        default:
          break;
      }
      const slot = mapping.get(key(e.getStartTime()));
      if (!slot) continue;
      if (e.isFloating()) slot.nonzerodur.push(e);
      else if (e.getDuration().isZero()) slot.zerodur.push(e);
      else slot.nonzerodur.push(e);
    }
  }

  receiveStaffNumberFromChild(staffnum: number, voicenum: number): void {
    this.reportStaffNumberToOwner(staffnum, voicenum);
  }
  receiveTimeSigDurFromChild(duration: HumNum): void {
    this.setTimeSigDur(duration);
  }
  setTimeSigDur(duration: HumNum): void { this.m_timesigdur = duration; }
  getTimeSigDur(): HumNum { return this.m_timesigdur; }
  reportStaffNumberToOwner(staffnum: number, voicenum: number): void {
    if (this.m_owner) this.m_owner.receiveStaffNumberFromChild(staffnum, voicenum);
  }
  receiveMeasureStyleFromChild(style: GridMeasureStyle): void {
    if (style === GridMeasureStyle.RepeatForward) {
      const previous = this.getPreviousMeasure();
      if (previous) previous.setStyle(style);
    }
    else this.setStyle(style);
  }
  getStyle(): GridMeasureStyle { return this.m_style; }
  getBarStyle(): GridMeasureStyle { return this.getStyle(); }
  setStyle(style: GridMeasureStyle): void {
    if (this.m_style === GridMeasureStyle.Plain) this.m_style = style;
    else if (this.m_style === GridMeasureStyle.RepeatBackward && style === GridMeasureStyle.RepeatForward) {
      this.m_style = GridMeasureStyle.RepeatBoth;
    }
    else if (this.m_style === GridMeasureStyle.RepeatForward && style === GridMeasureStyle.RepeatBackward) {
      this.m_style = GridMeasureStyle.RepeatBoth;
    }
    else this.m_style = style;
  }
  setBarStyle(style: GridMeasureStyle): void { this.m_style = style; }
  makeFinalBarline(): void { this.m_style = GridMeasureStyle.Final; }
  isFinal(): boolean { return this.m_style === GridMeasureStyle.Final; }
  isDouble(): boolean { return this.m_style === GridMeasureStyle.Double; }
  isRepeatBackward(): boolean { return this.m_style === GridMeasureStyle.RepeatBackward; }
  isRepeatForward(): boolean { return this.m_style === GridMeasureStyle.RepeatForward; }
  isRepeatBoth(): boolean { return this.m_style === GridMeasureStyle.RepeatBoth; }
}

export class MxmlPart {
  private m_measures: MxmlMeasure[] = [];
  private m_qtick: number[] = [];
  private m_partnum = 0;
  private m_maxstaff = 0;
  private m_verseCount: number[][] = [];
  private m_harmonyCount = 0;
  private m_editorialAccidental = false;
  private m_stems = false;
  private m_hasDynamics = false;
  private m_hasFiguredBass = false;
  private m_partname = '';
  private m_partabbr = '';
  private m_caesura = '';
  private m_hasOrnaments = false;
  private m_staffvoicehist: number[][] = [];
  private m_voicemapping: Array<[number, number]> = [];

  constructor() {
    this.clear();
  }

  clear(): void {
    this.m_measures = [];
    this.m_partnum = 0;
    this.m_maxstaff = 0;
    this.m_verseCount = [];
    this.m_harmonyCount = 0;
    this.m_editorialAccidental = false;
  }

  enableStems(): void { this.m_stems = true; }
  getQTicks(): number { return this.m_qtick.length ? this.m_qtick[this.m_qtick.length - 1] : 0; }
  setQTicks(value: number): number {
    if (value <= 0) return 0;
    this.m_qtick.push(value);
    return 1;
  }

  addMeasure(mel: xml_node): boolean {
    const meas = new MxmlMeasure(this);
    if (this.m_stems) meas.enableStems();
    if (this.m_measures.length > 0) {
      meas.setPreviousMeasure(this.m_measures[this.m_measures.length - 1]);
      this.m_measures[this.m_measures.length - 1].setNextMeasure(meas);
    }
    this.m_measures.push(meas);
    return meas.parseMeasure(mel);
  }

  getMeasureCount(): number { return this.m_measures.length; }
  getMeasure(index: number): MxmlMeasure | null {
    if (index < 0 || index >= this.m_measures.length) return null;
    return this.m_measures[index];
  }
  getPreviousMeasure(measure: MxmlMeasure): MxmlMeasure | null {
    if (!measure) return null;
    if (this.m_measures.length && measure === this.m_measures[0]) return null;
    if (!this.m_measures.length) return null;
    return measure.getPreviousMeasure();
  }
  getDuration(): HumNum {
    if (!this.m_measures.length) return new HumNum(0);
    const last = this.m_measures[this.m_measures.length - 1];
    return last.getStartTime().add(last.getDuration());
  }
  setPartNumber(n: number): void { this.m_partnum = n; }
  getPartNumber(): number { return this.m_partnum; }
  getPartIndex(): number { return this.m_partnum - 1; }
  // C++ MxmlPart::getStaffCount (humlib.cpp:52726) defaults to 1 staff
  // when no <staves> element was seen.
  getStaffCount(): number { return this.m_maxstaff ? this.m_maxstaff : 1; }
  getHarmonyCount(): number { return this.m_harmonyCount; }
  hasEditorialAccidental(): boolean { return this.m_editorialAccidental; }
  hasDynamics(): boolean { return this.m_hasDynamics; }
  hasFiguredBass(): boolean { return this.m_hasFiguredBass; }
  getVerseCount(): number;
  getVerseCount(staffindex: number): number;
  getVerseCount(staffindex?: number): number {
    void staffindex;
    return 0;
  }
  getCaesura(): string { return this.m_caesura; }
  hasOrnaments(): boolean { return this.m_hasOrnaments; }
  getVoiceMapping(): Array<[number, number]> { return this.m_voicemapping; }
  getStaffVoiceHist(): number[][] { return this.m_staffvoicehist; }

  receiveHarmonyCount(count: number): void {
    void count;
    this.m_harmonyCount++;
  }
  receiveDynamic(): void { this.m_hasDynamics = true; }
  receiveFiguredBass(): void { this.m_hasFiguredBass = true; }
  receiveCaesura(letter: string): void { this.m_caesura = letter; }
  receiveOrnament(): void { this.m_hasOrnaments = true; }
  receiveEditorialAccidental(): void { this.m_editorialAccidental = true; }
  receiveVerseCount(count: number): void;
  receiveVerseCount(staffnum: number, count: number): void;
  receiveVerseCount(a: number, b?: number): void {
    void a;
    void b;
  }
  receiveStaffNumberFromChild(staffnum: number, voicenum: number): void {
    if (this.m_maxstaff < staffnum) this.m_maxstaff = staffnum;
    this.trackStaffVoices(staffnum, voicenum);
  }
  trackStaffVoices(staffnum: number, voicenum: number): void {
    const sv = this.m_staffvoicehist;
    if (staffnum < 0 || voicenum < 0) return;
    while (sv.length <= staffnum) sv.push([]);
    while (sv[staffnum].length <= voicenum) sv[staffnum].push(0);
    sv[staffnum][voicenum]++;
  }

  prepareVoiceMapping(): void {
    const sv = this.m_staffvoicehist;
    const staffcount = sv.length - 1;
    if (staffcount < 1) return;
    let maxvoicenum = 0;
    for (let i = 1; i < sv.length; i++) {
      if (sv[i].length - 1 > maxvoicenum) maxvoicenum = sv[i].length - 1;
    }
    const empty: [number, number] = [-1, -1];
    for (let j = 1; j <= maxvoicenum; j++) {
      let maxcount = -1;
      let homestaffnum = -1;
      let homevoicenum = -1;
      for (let i = 1; i < sv.length; i++) {
        if (j >= sv[i].length) continue;
        const count = sv[i][j];
        if (count > 0 && maxcount < count) {
          maxcount = count;
          homestaffnum = i;
          homevoicenum = j;
        }
      }
      if (homestaffnum < 1 || homevoicenum < 1) continue;
      let newvoiceindex = -1;
      for (let n = 1; n < this.m_voicemapping.length; n++) {
        if (this.m_voicemapping[n][0] === homestaffnum - 1) newvoiceindex++;
      }
      newvoiceindex++;
      if (homevoicenum >= this.m_voicemapping.length) {
        const oldsize = this.m_voicemapping.length;
        for (let m = oldsize; m <= homevoicenum; m++) this.m_voicemapping.push([empty[0], empty[1]]);
      }
      this.m_voicemapping[homevoicenum] = [homestaffnum - 1, newvoiceindex];
    }
  }

  getVoiceIndex(voicenum: number): number {
    if (voicenum < 1 || voicenum >= this.m_voicemapping.length) return -1;
    return this.m_voicemapping[voicenum][1];
  }
  getStaffIndex(voicenum: number): number {
    if (voicenum < 1 || voicenum >= this.m_voicemapping.length) return -1;
    return this.m_voicemapping[voicenum][0];
  }

  parsePartInfo(partinfo: xml_node): void {
    const partnamenode = selectNode(partinfo, './part-name');
    if (!partnamenode.empty()) this.m_partname = MxmlPart.cleanSpacesStatic(partnamenode.child_value());
    const abbrnode = selectNode(partinfo, './part-abbreviation');
    if (!abbrnode.empty()) this.m_partabbr = MxmlPart.cleanSpacesStatic(abbrnode.child_value());
  }
  getPartName(): string { return this.m_partname; }
  getPartAbbr(): string { return this.m_partabbr; }

  static cleanSpacesStatic(input: string): string {
    let output = '';
    let content = false;
    for (let i = 0; i < input.length; i++) {
      if (!content && /\s/.test(input[i])) continue;
      content = true;
      if (/\s/.test(input[i]) && i > 0 && /\s/.test(input[i - 1])) continue;
      output += /\s/.test(input[i]) ? ' ' : input[i];
    }
    while (output.length && /\s/.test(output[output.length - 1])) output = output.slice(0, -1);
    return output;
  }
}
