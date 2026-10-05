/**
 * Faithful TS port of Tool_musicxml2hum (src-cpp/src/hum/humlib.cpp
 * ~115877ff, class decl src-cpp/include/hum/humlib.h:10258ff).
 *
 * Status: parse layer (src/mxml.ts) done; converter ported incrementally
 * in convert() call order. Unported stages throw explicitly via `todo()`.
 */
import { HumdrumFile, HumdrumToken, base7ToBase40, kernToAccidentalCount, kernToBase40, kernToBase7 } from './humlib-core.js';
import { HumNum } from './humlib.js';
import { Tool_tremolo } from './tremolo.js';
import { GridMeasure, HumGrid, MeasureStyle } from './humgrid.js';
import { GridPart, GridSlice, GridStaff, GridVoice, SliceType } from './gridstructures.js';
import {
  MxmlEvent,
  MxmlMeasure,
  MxmlPart,
  SimultaneousEvents,
  attributeValue,
  childValue,
  parseIntText,
  selectNode,
  selectNodes,
} from './mxml.js';
import { xml_document, xml_node } from './pugixml.js';

export interface MusicXmlHarmonyInfo {
  token: string | null;
  timestamp: HumNum;
  partindex: number;
}

export interface MusicXmlFiguredBassInfo {
  token: string | null;
  timestamp: HumNum;
  partindex: number;
}

function todo(stage: string): never {
  throw new Error(`Tool_musicxml2hum: stage not yet ported: ${stage}`);
}

export function musicxmlNodeType(node: xml_node, testname: string): boolean {
  if (node.empty()) return false;
  return node.name() === testname;
}

export class Tool_musicxml2hum {
  private m_recipQ = false;
  private m_stemsQ = false;
  private m_slurabove = 0;
  private m_slurbelow = 0;
  private m_staffabove = false;
  private m_staffbelow = false;
  private m_hasOrnamentsQ = false;
  private m_maxstaff = 0;
  private m_lastOttavaDirection: string[][] = [];
  private m_offsetHarmony: MusicXmlHarmonyInfo[] = [];
  private m_offsetFiguredBass: MusicXmlFiguredBassInfo[] = [];
  private m_stopChar: string[] = [];
  private m_caesuraRdf = '';
  private m_software = '';
  private m_systemDecoration = '';
  private m_hasEditorial = false;
  private m_hasTransposition = false;
  private m_forceRecipQ = false;
  private m_hasTremoloQ = false;
  private m_currentDynamic: xml_node[][] = [];
  private m_currentFiguredBass: xml_node[][] = [];
  private m_currentText: Array<[number, xml_node]> = [];
  private m_deferDynamics = false;
  private m_deferText = false;
  private m_currentZeroSlice: GridSlice | null = null;
  private m_currentZeroEvent: MxmlEvent | null = null;
  private m_currentTempo: Array<[number, xml_node]> = [];
  private m_currentBrackets: xml_node[][] = [];
  private m_bracketTypeBuffer: string[] = [];
  private m_usedHairpins: xml_node[][] = [];

  constructor() {
    this.m_recipQ = false;
    this.m_stemsQ = false;
  }

  setOptions(argv: string[]): void {
    for (const a of argv) {
      if (a === '-r' || a === '--recip') this.m_recipQ = true;
      if (a === '-s' || a === '--stems') this.m_stemsQ = true;
    }
  }

  initialize(): void {
    this.m_hasOrnamentsQ = false;
    this.m_currentDynamic = [];
    this.m_usedHairpins = [];
  }

  convertToString(input: string): string {
    const doc = new xml_document();
    const res = doc.load_string(input);
    if (!res) return '';
    return this.convertDoc(doc).output;
  }

  convertDocStr(input: string): { output: string; status: boolean } {
    const doc = new xml_document();
    const res = doc.load_string(input);
    if (!res) return { output: '', status: false };
    return this.convertDoc(doc);
  }

  convertDoc(doc: xml_document): { output: string; status: boolean } {
    this.initialize();
    let status = true;
    this.setSoftwareInfo(doc);
    const partids: string[] = [];
    const partinfo = new Map<string, xml_node>();
    const partcontent = new Map<string, xml_node>();
    this.getPartInfo(partinfo, partids, doc);
    this.getPartContent(partcontent, partids, doc);
    const partdata: MxmlPart[] = partids.map(() => new MxmlPart());
    this.m_lastOttavaDirection = partids.map(() => []);
    status = this.fillPartData(partdata, partids, partinfo, partcontent) && status;
    this.m_currentDynamic = partids.map(() => []);
    this.m_currentFiguredBass = partids.map(() => []);
    this.m_currentBrackets = partids.map(() => []);
    this.m_usedHairpins = partids.map(() => []);
    this.m_stopChar = partids.map(() => '[');
    this.m_maxstaff = 0;
    for (const pd of partdata) {
      pd.prepareVoiceMapping();
      this.m_maxstaff += pd.getStaffCount();
    }
    this.reindexVoices(partdata);
    const outdata = new HumGrid();
    status = this.stitchParts(outdata, partids, partinfo, partcontent, partdata) && status;
    // fillLayoutVoices disabled: C++ initializeBySlice copies the partial
    // slice; padding layout voices here creates spurious manipulators.
    if (outdata.size() > 2) {
      if (outdata.at(0).getDuration().isZero()) {
        const m0slices = outdata.at(0).getSlices() as GridSlice[];
        const m1slices = outdata.at(1).getSlices() as GridSlice[];
        while (m0slices.length) m1slices.unshift(m0slices.pop() as never);
        outdata.deleteMeasure(0);
      }
    }
    for (const pd of partdata) {
      this.m_hasOrnamentsQ = this.m_hasOrnamentsQ || pd.hasOrnaments();
    }
    outdata.removeRedundantClefChanges();
    outdata.removeSibeliusIncipit();
    this.m_systemDecoration = this.getSystemDecoration(doc, outdata, partids);
    for (let p = 0; p < partdata.length; p++) {
      for (let s = 0; s < partdata[p].getStaffCount(); s++) {
        outdata.setVerseCount(p, s, partdata[p].getVerseCount(s));
      }
    }
    for (let p = 0; p < partdata.length; p++) {
      outdata.setHarmonyCount(p, partdata[p].getHarmonyCount());
    }
    for (let p = 0; p < partdata.length; p++) {
      if (partdata[p].hasDynamics()) outdata.setDynamicsPresent(p);
    }
    for (let p = 0; p < partdata.length; p++) {
      if (partdata[p].hasFiguredBass()) outdata.setFiguredBassPresent(p);
    }
    for (const pd of partdata) {
      if (pd.hasEditorialAccidental()) this.m_hasEditorial = true;
    }
    this.prepareRdfs(partdata);
    if (this.m_recipQ || this.m_forceRecipQ) outdata.enableRecipSpine();
    outdata.buildSingleList();
    const outfile = new HumdrumFile();
    outdata.transferTokens(outfile, 0, '**kern');
    this.addHeaderRecords(outfile, doc);
    this.addFooterRecords(outfile, doc);
    this.ruthfixRun(outfile);
    this.addMeasureOneNumber(outfile);
    if (this.m_hasOrnamentsQ) this.trillspellRun(outfile);
    new Tool_tremolo().run(outfile);
    let output = this.printResult(outfile);
    if (this.m_slurabove || this.m_staffabove) output += '!!!RDF**kern: > = above\n';
    if (this.m_slurbelow || this.m_staffbelow) output += '!!!RDF**kern: < = below\n';
    for (const pd of partdata) {
      if (pd.hasEditorialAccidental()) { output += '!!!RDF**kern: i = editorial accidental\n'; break; }
    }
    if (this.m_caesuraRdf) output += this.m_caesuraRdf + '\n';
    output += this.checkForInformation(doc);
    return { output, status };
  }

  checkForInformation(doc: xml_document): string {
    let output = '';
    const identification = selectNode(doc, '/score-partwise/identification');
    if (identification.empty()) return '!! NO IDENTIFICATION FOUND\n';
    for (let creator = identification.first_child(); !creator.empty(); creator = creator.next_sibling()) {
      if (creator.name() !== 'creator') continue;
      const typeAttr = creator.attribute('type');
      const type = typeAttr.empty() ? '' : typeAttr.value();
      if (type === 'composer') {
        let text = creator.child_value().replace(/^\s+/, '').replace(/\s+$/, '');
        if (!text) continue;
        const tokens = text.split(/\s+/);
        const last = tokens.pop() as string;
        output += '!!!COM: ' + last + (tokens.length ? ', ' + tokens.join(' ') : '') + '\n';
      }
      else if (type === 'arranger') {
        let text = creator.child_value().replace(/^\s+/, '').replace(/\s+$/, '');
        if (!text) continue;
        let tokens = text.split(/\s+/);
        let date = '';
        const lastTok = tokens[tokens.length - 1] ?? '';
        if (/^\d{4}\/\d{2}\/\d{2}$/.test(lastTok)) {
          date = lastTok;
          tokens = tokens.slice(0, -1);
        }
        let name = '';
        if (tokens.length) {
          const lastName = tokens.pop() as string;
          name = lastName + (tokens.length ? ', ' + tokens.join(' ') : '');
        }
        if (name) output += '!!!ENC: ' + name + '\n';
        if (date) output += '!!!END: ' + date + '\n';
      }
    }
    return output;
  }

  // C++ Tool_ruthfix::run/insertCrossBarTies/createTiedNote: tie an
  // invisible (yy) note at a barline start to the previous note.
  ruthfixRun(outfile: HumdrumFile): void {
    // C++ Tool_ruthfix runs on a fully analyzed file; analyze strands/links
    // first so cross-bar ties resolve (asap-127 grace [ before barline).
    (outfile as unknown as { analyzeLinks(): boolean }).analyzeLinks?.();
    if (outfile.getStrandCount() === 0) {
      const reparsed = new HumdrumFile();
      reparsed.readString(outfile.toString());
      this.ruthfixRun(reparsed);
      reparsed.createLinesFromTokens();
      const updated = new HumdrumFile();
      updated.readString(reparsed.toString());
      (outfile as unknown as { m_lines: unknown[] }).m_lines = (updated as unknown as { m_lines: unknown[] }).m_lines;
      return;
    }
    for (let i = 0; i < outfile.getStrandCount(); i++) {
      let tok = outfile.getStrandStart(i);
      if (!tok || !tok.isKern()) continue;
      this.insertCrossBarTies(outfile, i);
    }
    for (let i = 0; i < outfile.getLineCount(); i++) outfile.getLine(i)?.createLineFromTokens();
  }
  insertCrossBarTies(outfile: HumdrumFile, strand: number): void {
    const send = outfile.getStrandEnd(strand);
    let s = outfile.getStrandStart(strand);
    let lastnote: HumdrumToken | null = null;
    let barstart = true;
    while (s && s !== send) {
      if (s.isBarline()) barstart = true;
      else if (s.isNote()) {
        if (lastnote && barstart && s.getText().includes('yy')) this.createTiedNote(lastnote, s);
        barstart = false;
        lastnote = s;
      }
      // C++ only clears lastnote on rests; clefs/interpretations keep it
      // so a tie can span them (asap-127 grace [ before barline).
      else if (s.isRest()) { lastnote = null; barstart = false; }
      s = s.getNextToken();
      if (!s) break;
    }
  }
  createTiedNote(left: HumdrumToken, right: HumdrumToken): void {
    if (left.isChord() || right.isChord()) return;
    const loc = right.getText().indexOf('yy');
    if (loc !== -1) {
      left.setText('[' + left.getText());
      right.setText(right.getText().slice(0, loc) + ']' + right.getText().slice(loc + 2));
    }
  }
  // C++ Tool_trillspell::processFile (humlib.cpp:145960) edits tokens in
  // place; no reparse round-trip is involved.
  trillspellRun(outfile: HumdrumFile): void {
    // Grid transfer creates HumdrumToken objects without spine addresses.
    // Analyze before trillspell so track-based dstates use real spine tracks.
    outfile.analyzeSpines();
    outfile.analyzeLinks();
    outfile.analyzeTracks();
    this.analyzeOrnamentAccidentals(outfile);
  }

  analyzeOrnamentAccidentals(infile: HumdrumFile): void {
    const ktracks = infile.getSpineStartListFiltered('**kern');
    const rtracks = new Map<number, number>();
    ktracks.forEach((t, i) => { const tr = t?.getTrack?.() ?? -1; rtracks.set(tr, i); });
    const kcount = ktracks.length;
    const keysigs: number[][] = Array.from({ length: kcount }, () => Array(7).fill(0));
    const dstates: number[][] = Array.from({ length: kcount }, () => Array(70).fill(0));
    const resetDiatonicStates = (kindex: number): void => {
      for (let s = 0; s < dstates[kindex].length; s++) dstates[kindex][s] = keysigs[kindex][s % 7];
    };
    for (let i = 0; i < infile.getLineCount(); i++) {
      const line = infile.getLine(i);
      if (!line || !line.hasSpines()) continue;
      if (line.isInterpretation()) {
        for (let j = 0; j < line.getFieldCount(); j++) {
          const token = infile.token(i, j);
          if (!token || !token.isKern()) continue;
          const txt = token.getText();
          if (txt.startsWith('*k[')) {
            const kindex = rtracks.get(token.getTrack()) ?? -1;
            if (kindex < 0) continue;
            this.fillKeySignature(keysigs[kindex], txt);
            resetDiatonicStates(kindex);
          }
        }
      }
      else if (line.isBarline()) {
        for (let j = 0; j < line.getFieldCount(); j++) {
          const token = infile.token(i, j);
          if (!token || !token.isKern() || token.isInvisible()) continue;
          const kindex = rtracks.get(token.getTrack()) ?? -1;
          if (kindex < 0) continue;
          if ((this as unknown as { _trillNoBarReset?: boolean })._trillNoBarReset !== true) resetDiatonicStates(kindex);
        }
      }
      if (line.isBarline()) continue;
      if (!line.isData()) continue;
      for (let j = 0; j < line.getFieldCount(); j++) {
        const token = infile.token(i, j);
        if (!token || !token.isKern() || token.isNull() || token.isRest()) continue;
        const subcount = token.getSubtokenCount();
        const rindex = rtracks.get(token.getTrack()) ?? -1;
        if (rindex < 0) continue;
        for (let k = 0; k < subcount; k++) {
          const subtok = token.getSubtoken(k);
          const b40 = kernToBase40(subtok);
          const diatonic = kernToBase7(subtok);
          if (diatonic < 0) continue;
          const accid = kernToAccidentalCount(subtok);
          if (diatonic < dstates[rindex].length) dstates[rindex][diatonic] = accid;
          this.adjustOrnamentToken(token, k, subtok, b40, diatonic, dstates[rindex]);
        }
      }
    }
  }

  adjustOrnamentToken(token: HumdrumToken, k: number, subtok: string, b40: number, diatonic: number, dstates: number[]): void {
    const has = (ch: string): boolean => subtok.includes(ch);
    const marked = /[tTMmWw]x/.test(subtok);
    const getBase40 = (d: number, a: number): number => base7ToBase40(d) + a;
    let nextup: number;
    let interval: number;
    let nextdn: number;
    if (has('t') && !marked) {
      nextup = getBase40(diatonic + 1, dstates[diatonic + 1] ?? 0);
      interval = nextup - b40;
      if (interval === 6) token.replaceSubtoken(k, subtok.replace(/t/g, 'T'));
    }
    else if (subtok.includes('T') && !marked) {
      nextup = getBase40(diatonic + 1, dstates[diatonic + 1] ?? 0);
      interval = nextup - b40;
      if (interval === 5) token.replaceSubtoken(k, subtok.replace(/T/g, 't'));
    }
    else if (subtok.includes('M') && !marked) {
      nextup = getBase40(diatonic + 1, dstates[diatonic + 1] ?? 0);
      interval = nextup - b40;
      if (interval === 5) token.replaceSubtoken(k, subtok.replace(/M/g, 'm'));
    }
    else if (has('m') && !marked) {
      nextup = getBase40(diatonic + 1, dstates[diatonic + 1] ?? 0);
      interval = nextup - b40;
      if (interval === 6) token.replaceSubtoken(k, subtok.replace(/m/g, 'M'));
    }
    else if (subtok.includes('W') && !marked) {
      nextdn = getBase40(diatonic - 1, dstates[diatonic - 1] ?? 0);
      interval = b40 - nextdn;
      if (interval === 5) token.replaceSubtoken(k, subtok.replace(/W/g, 'w'));
    }
    else if (subtok.includes('w') && !marked) {
      nextdn = getBase40(diatonic - 1, dstates[diatonic - 1] ?? 0);
      interval = b40 - nextdn;
      if (interval === 6) token.replaceSubtoken(k, subtok.replace(/w/g, 'W'));
    }
  }

  fillKeySignature(states: number[], keysig: string): void {
    states.fill(0);
    if (keysig.includes('f#')) states[3] = 1;
    if (keysig.includes('c#')) states[0] = 1;
    if (keysig.includes('g#')) states[4] = 1;
    if (keysig.includes('d#')) states[1] = 1;
    if (keysig.includes('a#')) states[5] = 1;
    if (keysig.includes('e#')) states[2] = 1;
    if (keysig.includes('b#')) states[6] = 1;
    if (keysig.includes('b-')) states[6] = -1;
    if (keysig.includes('e-')) states[2] = -1;
    if (keysig.includes('a-')) states[5] = -1;
    if (keysig.includes('d-')) states[1] = -1;
    if (keysig.includes('g-')) states[4] = -1;
    if (keysig.includes('c-')) states[0] = -1;
    if (keysig.includes('f-')) states[3] = -1;
  }

  prepareRdfs(partdata: MxmlPart[]): void {
    let caesura = '';
    for (const pd of partdata) {
      const c = pd.getCaesura();
      if (c) caesura = c;
    }
    if (caesura) this.m_caesuraRdf = '!!!RDF**kern: ' + caesura + ' = caesura';
  }

  printResult(outfile: HumdrumFile): string {
    // C++ Tool_musicxml2hum::printResult (humlib.cpp:116312) uses the
    // trackstarts left by the last tool analyze (Tool_tremolo reparses
    // after expansion); it does NOT re-analyze here. Re-analyzing would
    // overwrite the partial trackstarts the C++ pipeline leaves behind.
    const kerncount = outfile.getSpineStartListFiltered('**kern').length;
    const lines: string[] = [];
    const lineCount = outfile.getLineCount();
    for (let i = 0; i < lineCount; i++) {
      const line = outfile.getLine(i);
      if (!line) continue;
      if (kerncount > 1 || !line.isInterpretation()) {
        lines.push(line.toString());
        continue;
      }
      let skip = false;
      for (let j = 0; j < line.getFieldCount(); j++) {
        const t = line.token(j)?.getText?.() ?? '';
        if (t === '*I"Piano' || t === "*I'Pno." || t === '*staff1' || t === '*part1') { skip = true; break; }
      }
      if (!skip) lines.push(line.toString());
    }
    return lines.join('\n') + '\n';
  }

  addMeasureOneNumber(outfile: HumdrumFile): void {
    for (let i = 0; i < outfile.getLineCount(); i++) {
      const line = outfile.getLine(i);
      if (!line) continue;
      if (line.isData()) break;
      if (!line.isBarline()) continue;
      const tok = outfile.token(i, 0);
      const value: string = tok?.getText?.() ?? '';
      if (/\d/.test(value)) break;
      let newvalue = '=';
      if (value.length < 2) newvalue += '1';
      else if (value[1] !== '=') newvalue += '1' + value.slice(1);
      else newvalue = value;
      tok?.setText?.(newvalue);
      for (let j = 1; j < line.getFieldCount(); j++) outfile.token(i, j)?.setText?.(newvalue);
      line.createLineFromTokens();
      break;
    }
  }

  addHeaderRecords(outfile: HumdrumFile, doc: xml_document): void {
    if (this.m_systemDecoration && this.m_systemDecoration !== 's1') {
      outfile.appendLine('!!!system-decoration: ' + this.m_systemDecoration);
    }
    const credits = selectNodes(doc, '/score-partwise/credit/credit-words');
    const keys = new Map<string, number>();
    const refs: string[] = [];
    const positions: number[] = [];
    for (const c of credits) {
      let contents = Tool_musicxml2hum.cleanSpaces(c.child_value());
      if (!contents) continue;
      if (contents[0] !== '@' && contents[0] !== '!') continue;
      positions.push(contents.length >= 3 && contents[0] === '@' && contents[1] === '@' ? -1 : 1);
      const m = /^[!@]+([^\s]+):/.exec(contents);
      if (m) {
        keys.set(m[1], 1);
        contents = contents.replace(/^[!@]+/, '!!!');
        refs.push(contents);
      }
      else refs.push(contents.replace(/^[!@]+/, '!!'));
    }
    const worktitle = Tool_musicxml2hum.cleanSpaces(selectNode(doc, '/score-partwise/work/work-title').child_value());
    let otlRecord = '';
    let omvRecord = '';
    let worktitleQ = false;
    if (worktitle && worktitle !== 'Title') {
      otlRecord = '!!!OTL: ' + worktitle;
      worktitleQ = true;
    }
    const mtitle = Tool_musicxml2hum.cleanSpaces(selectNode(doc, '/score-partwise/movement-title').child_value());
    if (mtitle) {
      if (worktitleQ) omvRecord = '!!!OMV: ' + mtitle;
      else otlRecord = '!!!OTL: ' + mtitle;
    }
    let composer = Tool_musicxml2hum.cleanSpaces(selectNode(doc, "/score-partwise/identification/creator[@type='composer']").child_value());
    let cdtRecord = '';
    if (composer) {
      const dm = /\((.*?\d.*?)\)/.exec(composer);
      if (dm) {
        const dates = dm[1];
        const loc = composer.indexOf(dates);
        if (loc >= 0) composer = composer.slice(0, Math.max(0, loc - 1)) + composer.slice(loc + dates.length + 1);
        composer = composer.replace(/^\s+/, '').replace(/\s+$/, '');
        const nm = /^([^\s]+) +([^\s]+)/.exec(composer);
        if (nm) composer = nm[2] + ', ' + nm[1];
        const ym = /\b(\d{4})\?/.exec(dates);
        if (ym && dates) {
          cdtRecord = '!!!CDT: ' + dates.replace(/\b\d{4}\?/, '~' + ym[1]);
        }
      }
    }
    for (let i = refs.length - 1; i >= 0; i--) {
      if (positions[i] > 0) outfile.insertLine(0, refs[i]);
    }
    for (let i = 0; i < refs.length; i++) {
      if (positions[i] < 0) outfile.appendLine(refs[i]);
    }
    if (omvRecord && !keys.get('OMV')) outfile.insertLine(0, omvRecord);
    if (otlRecord && !keys.get('OTL')) outfile.insertLine(0, otlRecord);
    if (cdtRecord && !keys.get('CDT')) outfile.insertLine(0, cdtRecord);
    if (composer && !keys.get('COM') && composer !== 'Composer') outfile.insertLine(0, '!!!COM: ' + composer);
  }

  addFooterRecords(outfile: HumdrumFile, doc: xml_document): void {
    const copy = selectNode(doc, '/score-partwise/identification/rights').child_value();
    let validcopy = true;
    if (!copy) validcopy = false;
    if (copy.length === 2 && copy.charCodeAt(0) === 0xc2 && copy.charCodeAt(1) === 0xa9) validcopy = false;
    if (copy.includes('opyright') && copy.length < 15) validcopy = false;
    if (validcopy) outfile.appendLine('!!!YEM: ' + Tool_musicxml2hum.cleanSpaces(copy));
  }

  getSystemDecoration(doc: xml_document, grid: HumGrid, _partids: string[]): string {
    const partlist = selectNode(doc, '/score-partwise/part-list');
    if (partlist.empty()) return '';
    const children: xml_node[] = [];
    for (let c = partlist.first_child(); !c.empty(); c = c.next_sibling()) {
      if (c.name()) children.push(c);
    }
    const pcount = grid.getPartCount();
    let scounter = 1;
    for (let i = 0; i < pcount; i++) {
      for (let j = 0; j < grid.getStaffCount(i); j++) scounter++;
    }
    let output = '';
    let pcounter = 0;
    scounter = 1;
    const typeendings: string[] = Array(100).fill('');
    for (const ch of children) {
      const name = ch.name();
      if (name === 'part-group') {
        const gtypeAttr = ch.attribute('type');
        const grouptype = gtypeAttr.empty() ? '' : gtypeAttr.value();
        const numAttr = ch.attribute('number');
        const number = numAttr.empty() ? 0 : Number.parseInt(numAttr.value(), 10);
        if (grouptype === 'start') {
          let g = '';
          for (let gc = ch.first_child(); !gc.empty(); gc = gc.next_sibling()) {
            if (gc.name() === 'group-symbol') { g = gc.child_value(); break; }
          }
          if (g === 'bracket') { output += '[('; typeendings[number] = ')]'; }
          else if (g === 'brace') { output += '{('; typeendings[number] = ')}'; }
        }
        else if (grouptype === 'stop') {
          output += typeendings[number] ?? '';
          typeendings[number] = '';
        }
      }
      else if (name === 'score-part') {
        pcounter++;
        const staffcount = grid.getStaffCount(pcounter - 1);
        if (staffcount === 1) output += 's' + (scounter++);
        else if (staffcount > 1) {
          output += '{(';
          for (let k = 0; k < staffcount; k++) output += 's' + (scounter++);
          output += ')}';
        }
      }
    }
    let newoutput = '';
    for (let i = 0; i < output.length; i++) {
      if (i > 0 && output[i] === 's' && /\d/.test(output[i - 1])) newoutput += ',';
      newoutput += output[i];
    }
    return newoutput;
  }

  setSoftwareInfo(doc: xml_document): void {
    const software = childValue(selectNode(doc, '/score-partwise/identification/encoding/software'), '.');
    const node = selectNode(doc, '/score-partwise/identification/encoding/software');
    const value = node.empty() ? '' : node.child_value();
    void software;
    if (/sibelius/i.test(value)) this.m_software = 'sibelius';
  }

  getPartInfo(partinfo: Map<string, xml_node>, partids: string[], doc: xml_document): boolean {
    const scoreparts = selectNodes(doc, '/score-partwise/part-list/score-part');
    let output = true;
    for (const el of scoreparts) {
      const id = attributeValue(el, 'id');
      partids.push(id);
      if (partinfo.has(id)) {
        output = false;
      }
      partinfo.set(id, el);
    }
    return output;
  }

  getPartContent(partcontent: Map<string, xml_node>, partids: string[], doc: xml_document): boolean {
    const parts = selectNodes(doc, '/score-partwise/part');
    for (const n of parts) {
      const partid = attributeValue(n, 'id');
      if (!partcontent.has(partid)) partcontent.set(partid, n);
    }
    return partcontent.size === partids.length;
  }

  fillPartData(
    partdata: MxmlPart[],
    partids: string[],
    partinfo: Map<string, xml_node>,
    partcontent: Map<string, xml_node>,
  ): boolean {
    let output = true;
    for (let i = 0; i < partinfo.size; i++) {
      partdata[i].setPartNumber(i + 1);
      output = this.fillOnePartData(partdata[i], partids[i], partinfo.get(partids[i])!, partcontent.get(partids[i])!) && output;
    }
    return output;
  }

  fillOnePartData(partdata: MxmlPart, id: string, partdeclaration: xml_node, partcontent: xml_node): boolean {
    void id;
    if (this.m_stemsQ) partdata.enableStems();
    partdata.parsePartInfo(partdeclaration);
    this.m_lastOttavaDirection[partdata.getPartIndex()] = new Array(32).fill('');
    const measures = selectNodes(partcontent, './measure');
    for (const m of measures) {
      partdata.addMeasure(m);
      const count = partdata.getMeasureCount();
      if (count > 1) {
        const dur = partdata.getMeasure(count - 1)!.getTimeSigDur();
        if (dur.isZero()) {
          const prev = partdata.getMeasure(count - 2)!.getTimeSigDur();
          if (!prev.isZero()) partdata.getMeasure(count - 1)!.setTimeSigDur(prev);
        }
      }
    }
    return true;
  }

  reindexVoices(partdata: MxmlPart[]): void {
    for (const pd of partdata) {
      for (let m = 0; m < pd.getMeasureCount(); m++) {
        const measure = pd.getMeasure(m);
        if (!measure) continue;
        this.reindexMeasure(measure);
      }
    }
  }

  reindexMeasure(measure: MxmlMeasure): void {
    if (!measure) return;
    const elist = measure.getEventList();
    const staffVoiceCounts: number[][] = [];
    for (const e of elist) {
      const staff = e.getStaffIndex();
      const voice = e.getVoiceIndex();
      if (voice >= 0 && staff >= 0) {
        while (staffVoiceCounts.length <= staff) staffVoiceCounts.push([]);
        while (staffVoiceCounts[staff].length <= voice) staffVoiceCounts[staff].push(0);
        staffVoiceCounts[staff][voice]++;
      }
    }
    let needreindexing = false;
    for (const row of staffVoiceCounts) {
      if (row.length < 2) continue;
      for (let j = 1; j < row.length; j++) {
        if (row[j] === 0) { needreindexing = true; break; }
      }
      if (needreindexing) break;
    }
    if (!needreindexing) return;
    const remapping: number[][] = staffVoiceCounts.map((row) => {
      const out = new Array(row.length).fill(-1);
      if (row.length === 1) { out[0] = 0; return out; }
      let reindex = 0;
      for (let j = 0; j < row.length; j++) {
        if (row[j]) out[j] = reindex++;
        else out[j] = -1;
      }
      return out;
    });
    for (const e of elist) {
      const oldvoice = e.getVoiceIndex();
      const staff = e.getStaffIndex();
      if (oldvoice < 0) continue;
      const nw = remapping[staff]?.[oldvoice] ?? oldvoice;
      if (nw === oldvoice) continue;
      e.setVoiceIndex(nw);
    }
  }

  stitchParts(
    outdata: HumGrid,
    partids: string[],
    partinfo: Map<string, xml_node>,
    partcontent: Map<string, xml_node>,
    partdata: MxmlPart[],
  ): boolean {
    void partids;
    void partinfo;
    void partcontent;
    if (!partdata.length) return false;
    const measurecount = partdata[0].getMeasureCount();
    for (const pd of partdata) {
      if (pd.getMeasureCount() !== measurecount) return false;
    }
    const partstaves = partdata.map((pd) => pd.getStaffCount());
    let status = true;
    for (let m = 0; m < partdata[0].getMeasureCount(); m++) {
      status = this.insertMeasure(outdata, m, partdata, partstaves) && status;
    }
    // C++ humlib.cpp:117007 runs moveBreaks BEFORE insertPartNames; that
    // order decides the first slice of measure 0 (labels vs. clefs).
    this.moveBreaksToEndOfPreviousMeasure(outdata);
    this.insertPartNames(outdata, partdata);
    return status;
  }

  fillLayoutVoices(outdata: HumGrid): void {
    for (let m = 0; m < outdata.size(); m++) {
      const gm = outdata.at(m);
      if (!gm) continue;
      const slices = gm.getSlices() as unknown as GridSlice[];
      const maxv: number[][] = [];
      for (const sl of slices) {
        if (!sl.isNoteSlice()) continue;
        for (let p = 0; p < sl.length; p++) {
          while (maxv.length <= p) maxv.push([]);
          for (let s = 0; s < (sl.at(p)?.length ?? 0); s++) {
            const n = sl.at(p)?.at(s)?.length ?? 0;
            if (n > (maxv[p][s] ?? 0)) maxv[p][s] = n;
          }
        }
      }
      for (const sl of slices) {
        if (!sl.isLayoutSlice()) continue;
        for (let p = 0; p < sl.length; p++) {
          for (let s = 0; s < (sl.at(p)?.length ?? 0); s++) {
            const staff = sl.at(p)?.at(s);
            if (!staff) continue;
            const want = maxv[p]?.[s] ?? staff.length;
            while (staff.length < want) staff.push(new GridVoice());
          }
        }
      }
    }
  }

  moveBreaksToEndOfPreviousMeasure(outdata: HumGrid): void {
    for (let i = 1; i < outdata.size(); i++) {
      const gm = outdata.at(i);
      const gmlast = outdata.at(i - 1);
      if (!gm || !gmlast) continue;
      if (gm.empty()) return;
      const slices = gm.getSlices() as GridSlice[];
      if (!slices.length) continue;
      const starttime = slices[0].getTimestamp();
      for (let idx = 0; idx < slices.length; idx++) {
        if (slices[idx].getTimestamp().getFloat() > starttime.getFloat()) break;
        if (!slices[idx].isGlobalComment()) continue;
        const tok = slices[idx].at(0)?.at(0)?.[0]?.getToken()?.value ?? '';
        if (tok !== '!!linebreak:original' && tok !== '!!pagebreak:original') continue;
        const swapper = slices[idx];
        slices.splice(idx, 1);
        (gmlast.getSlices() as GridSlice[]).push(swapper as never);
        break;
      }
    }
  }

  insertPartNames(outdata: HumGrid, partdata: MxmlPart[]): void {
    let hasname = false;
    let hasabbr = false;
    for (const pd of partdata) {
      if (pd.getPartName()) { hasname = true; break; }
    }
    for (const pd of partdata) {
      if (pd.getPartAbbr()) { hasabbr = true; break; }
    }
    if (!hasabbr && !hasname) return;
    const gm = outdata.empty() ? outdata.addMeasureToBack() : outdata.at(0);
    if (hasabbr) {
      for (let i = 0; i < partdata.length; i++) {
        const abbr = partdata[i].getPartAbbr();
        if (!abbr) continue;
        const maxstaff = outdata.getStaffCount(i);
        this.addLabelAbbrToken(gm, partdata, `*I'${abbr}`, new HumNum(0), i, maxstaff - 1, 0, partdata.length, maxstaff);
      }
    }
    if (hasname) {
      for (let i = 0; i < partdata.length; i++) {
        const name = partdata[i].getPartName();
        if (!name) continue;
        if (name.includes('MusicXML') || name.includes('Part_') || name.includes('Unnamed')) continue;
        const maxstaff = outdata.getStaffCount(i);
        this.addLabelToken(gm, partdata, `*I"${name}`, new HumNum(0), i, maxstaff - 1, 0, partdata.length, maxstaff);
      }
    }
  }

  addLabelToken(gm: GridMeasure, partdata: MxmlPart[], tok: string, timestamp: HumNum, part: number, _staff: number, voice: number, _maxpart: number, maxstaff: number): void {
    const slices = gm.getSlices() as GridSlice[];
    if (!slices.length || (slices[slices.length - 1] as GridSlice).getTimestamp().getFloat() < timestamp.getFloat()) {
      const gs = new GridSlice(gm, timestamp, SliceType.Labels);
      this.initPartStaves(gs, partdata);
      gs.addToken(tok, part, maxstaff - 1, voice);
      slices.push(gs);
      return;
    }
    for (const s of slices) {
      const gs = s as GridSlice;
      if (gs.getTimestamp().equals(timestamp) && gs.isLabelSlice()) {
        gs.addToken(tok, part, maxstaff - 1, voice);
        return;
      }
    }
    const gs = new GridSlice(gm, timestamp, SliceType.Labels);
    this.initPartStaves(gs, partdata);
    gs.addToken(tok, part, maxstaff - 1, voice);
    slices.unshift(gs);
  }

  addLabelAbbrToken(gm: GridMeasure, partdata: MxmlPart[], tok: string, timestamp: HumNum, part: number, _staff: number, voice: number, _maxpart: number, maxstaff: number): void {
    const slices = gm.getSlices() as GridSlice[];
    for (const s of slices) {
      const gs = s as GridSlice;
      if (gs.getTimestamp().equals(timestamp) && gs.isLabelAbbrSlice()) {
        gs.addToken(tok, part, maxstaff - 1, voice);
        return;
      }
    }
    const gs = new GridSlice(gm, timestamp, SliceType.LabelAbbrs);
    this.initPartStaves(gs, partdata);
    gs.addToken(tok, part, maxstaff - 1, voice);
    slices.unshift(gs);
  }

  checkForDummyRests(measure: MxmlMeasure): void {
    const events = measure.getEventList();
    const owner = measure.getOwner();
    const maxstaff = owner ? owner.getStaffCount() : 1;
    const itemcounts: number[][] = Array.from({ length: maxstaff }, () => [0]);
    for (const ev of events) {
      if (ev.getElementName() !== 'note') continue;
      const voiceindex = ev.getVoiceIndex();
      const staffindex = ev.getStaffIndex();
      if (voiceindex < 0 || staffindex < 0) continue;
      while (itemcounts.length <= staffindex) itemcounts.push([]);
      while (itemcounts[staffindex].length <= voiceindex) itemcounts[staffindex].push(0);
      itemcounts[staffindex][voiceindex]++;
    }
    let dummy = false;
    for (let i = 0; i < itemcounts.length; i++) {
      for (let j = 0; j < itemcounts[i].length; j++) {
        if (itemcounts[i][j]) continue;
        measure.addDummyRest(measure.getStartTime(), measure.getDuration(), i, j);
        measure.forceLastInvisible();
        dummy = true;
      }
    }
    if (dummy) measure.sortEvents();
  }

  insertMeasure(outdata: HumGrid, mnum: number, partdata: MxmlPart[], partstaves: number[]): boolean {
    const gm = outdata.addMeasureToBack();
    const measuredata: (MxmlMeasure | null)[] = [];
    const sevents: SimultaneousEvents[][] = [];
    for (let i = 0; i < partdata.length; i++) {
      const xmeasure = partdata[i].getMeasure(mnum);
      measuredata.push(xmeasure);
      if (i === 0 && xmeasure) {
        gm.setDuration(xmeasure.getDuration());
        gm.setTimestamp(xmeasure.getStartTime());
        gm.setTimeSigDur(xmeasure.getTimeSigDur());
      }
      if (i === 0 && xmeasure) gm.setStyle(xmeasure.getBarStyle() as unknown as MeasureStyle);
      void partstaves;
      if (xmeasure) this.checkForDummyRests(xmeasure);
      sevents.push(xmeasure ? xmeasure.getSortedEvents() : []);
    }
    for (let i = 0; i < partdata.length; i++) {
      const xmeasure = measuredata[i];
      if (!xmeasure) continue;
      const events = xmeasure.getEventList();
      let hairpin: xml_node | null = null;
      for (let j = events.length - 1; j >= 0; j--) {
        if (events[j].getElementName() === 'note') {
          if (hairpin) { events[j].setHairpinEnding(hairpin); hairpin = null; }
          break;
        }
        else if (events[j].getElementName() === 'direction') {
          const dirnode = events[j].getNode();
          const dtype = dirnode.first_child();
          if (!dtype.empty() && musicxmlNodeType(dtype, 'direction-type')) {
            const w = dtype.first_child();
            if (!w.empty() && musicxmlNodeType(w, 'wedge')) {
              const wt = w.attribute('type');
              if (!wt.empty() && wt.value() === 'stop') hairpin = dirnode;
            }
          }
        }
      }
    }
    return this.insertMeasureCont(outdata, mnum, partdata, partstaves, gm as never, measuredata, sevents);
  }

  nodeTreeContains(node: xml_node, tag: string, attrVal: string): boolean {
    if (node.empty()) return false;
    if (musicxmlNodeType(node, tag)) {
      for (let a = node.first_attribute(); !a.empty(); a = a.next_attribute()) {
        if (a.value() === attrVal) return true;
      }
    }
    for (let c = node.first_child(); !c.empty(); c = c.next_sibling()) {
      if (this.nodeTreeContains(c, tag, attrVal)) return true;
    }
    return false;
  }

  insertMeasureCont(outdata: HumGrid, mnum: number, partdata: MxmlPart[], partstaves: number[], gm: GridMeasure, measuredata: (MxmlMeasure | null)[], sevents: SimultaneousEvents[][]): boolean {
    void outdata; void mnum; void partstaves; void gm;
    const curtime: HumNum[] = partdata.map(() => new HumNum(0));
    const curindex = partdata.map(() => 0);
    let nexttime = new HumNum(-1);
    for (let i = 0; i < curtime.length; i++) {
      const se = sevents[i];
      if (se.length) curtime[i] = se[curindex[i]].starttime;
      else curtime[i] = measuredata[i] ? measuredata[i]!.getTimeSigDur() : new HumNum(0);
      if (nexttime.getFloat() < 0) nexttime = curtime[i];
      else if (curtime[i].getFloat() < nexttime.getFloat()) nexttime = curtime[i];
    }
    let allend = false;
    let status = true;
    while (!allend) {
      const nowevents: SimultaneousEvents[] = [];
      const nowparts: number[] = [];
      allend = true;
      const processtime = nexttime;
      nexttime = new HumNum(-1);
      for (let i = partdata.length - 1; i >= 0; i--) {
        if (curindex[i] >= sevents[i].length) continue;
        if (sevents[i][curindex[i]].starttime.equals(processtime)) {
          nowevents.push(sevents[i][curindex[i]]);
          nowparts.push(i);
          curindex[i]++;
        }
        if (curindex[i] < sevents[i].length) {
          allend = false;
          if (nexttime.getFloat() < 0 || sevents[i][curindex[i]].starttime.getFloat() < nexttime.getFloat()) {
            nexttime = sevents[i][curindex[i]].starttime;
          }
        }
      }
      status = this.convertNowEvents(gm, nowevents, nowparts, processtime, partdata, partstaves) && status;
      for (let i = 0; i < this.m_currentFiguredBass.length; i++) this.m_currentFiguredBass[i] = [];
    }
    if (this.m_offsetFiguredBass.length > 0) this.insertOffsetFiguredBassIntoMeasure(gm);
    return status;
  }

  insertOffsetFiguredBassIntoMeasure(gm: GridMeasure): void {
    if (!this.m_offsetFiguredBass.length) return;
    const slices = gm.getSlices() as unknown as GridSlice[];
    for (const gs of slices) {
      if (!gs.isNoteSlice()) continue;
      const timestamp = gs.getTimestamp();
      for (const fb of this.m_offsetFiguredBass) {
        if (fb.token === null) continue;
        if (fb.timestamp.equals(timestamp)) {
          gs.at(fb.partindex)?.setFiguredBass(fb.token);
          fb.token = null;
        }
      }
    }
  }

  convertNowEvents(
    outdata: unknown,
    nowevents: SimultaneousEvents[],
    nowparts: number[],
    nowtime: HumNum,
    partdata: MxmlPart[],
    partstaves: number[],
  ): boolean {
    void nowparts;
    void partstaves;
    if (!nowevents.length) return true;
    this.appendZeroEvents(outdata, nowevents, nowtime, partdata);
    let hasNonZero = false;
    for (const e of nowevents) {
      if (e.nonzerodur.length) { hasNonZero = true; break; }
    }
    if (!hasNonZero) return true;
    this.appendNonZeroEvents(outdata, nowevents, nowtime, partdata);
    this.handleFiguredBassWithoutNonZeroEvent(nowevents, nowtime);
    return true;
  }

  handleFiguredBassWithoutNonZeroEvent(nowevents: SimultaneousEvents[], nowtime: HumNum): void {
    const nonZeroParts: number[] = [];
    for (const sevent of nowevents) {
      for (const ev of sevent.nonzerodur) nonZeroParts.push(ev.getPartIndex());
    }
    for (const sevent of nowevents) {
      for (const ev of sevent.zerodur) {
        if (ev.getElementName() !== 'figured-bass') continue;
        if (nonZeroParts.includes(ev.getPartIndex())) continue;
        const fstring = this.getFiguredBassString(ev.getNode());
        this.m_offsetFiguredBass.push({ token: fstring, timestamp: new HumNum(nowtime), partindex: ev.getPartIndex() });
      }
    }
  }

  appendZeroEvents(
    outdata: unknown,
    nowevents: SimultaneousEvents[],
    nowtime: HumNum,
    partdata: MxmlPart[],
  ): void {
    const gm = outdata as GridMeasure;
    let hasclef = false;
    let haskeysig = false;
    let haskeydesignation = false;
    let hastimesig = false;
    const clefs: xml_node[][] = partdata.map(() => []);
    const keysigs: xml_node[][] = partdata.map(() => []);
    const transpositions: xml_node[][] = partdata.map(() => []);
    const stafflines: xml_node[][] = partdata.map(() => []);
    const timesigs: xml_node[][] = partdata.map(() => []);
    const gracebefore: MxmlEvent[][][][] = partdata.map(() => []);
    const graceafter: MxmlEvent[][][][] = partdata.map(() => []);
    const ottavas: xml_node[][][] = partdata.map(() => []);
    let hasottava = false;
    let hastransposition = false;
    let hasstafflines = false;
    let foundnongrace = false;
    for (const se of nowevents) {
      for (const ev of se.zerodur) {
        const element = ev.getNode();
        const pindex = ev.getPartIndex();
        if (musicxmlNodeType(element, 'attributes')) {
          for (let child = element.first_child(); !child.empty(); child = child.next_sibling()) {
            if (musicxmlNodeType(child, 'clef')) { clefs[pindex].push(child); hasclef = true; foundnongrace = true; }
            if (musicxmlNodeType(child, 'key')) { keysigs[pindex].push(child); haskeysig = true; foundnongrace = true; if (!child.child('mode').empty()) haskeydesignation = true; }
            if (musicxmlNodeType(child, 'transpose')) { transpositions[pindex].push(child); hastransposition = true; foundnongrace = true; }
            if (musicxmlNodeType(child, 'staff-details')) {
              for (let gc = child.first_child(); !gc.empty(); gc = gc.next_sibling()) {
                if (musicxmlNodeType(gc, 'staff-lines')) { stafflines[pindex].push(gc); hasstafflines = true; }
              }
            }
            if (musicxmlNodeType(child, 'time')) { timesigs[pindex].push(child); hastimesig = true; foundnongrace = true; }
          }
        }
        else if (musicxmlNodeType(element, 'note')) {
          if (foundnongrace) this.addEventToList(graceafter, ev);
          else this.addEventToList(gracebefore, ev);
        }
        else if (musicxmlNodeType(element, 'direction')) {
          const child = element.first_child();
          if (!child.empty() && musicxmlNodeType(child, 'direction-type')) {
            const grandchild = child.first_child();
            if (!grandchild.empty() && (musicxmlNodeType(grandchild, 'dynamics') || musicxmlNodeType(grandchild, 'wedge'))) {
              this.m_currentDynamic[pindex].push(element);
            }
            else if (!grandchild.empty() && musicxmlNodeType(grandchild, 'words')) {
              this.m_currentText.push([pindex, element]);
            }
            else if (!grandchild.empty() && musicxmlNodeType(grandchild, 'octave-shift')) {
              this.storeOttava(pindex, grandchild, element, ottavas);
              hasottava = true;
            }
            else if (!grandchild.empty() && musicxmlNodeType(grandchild, 'metronome')) {
              this.m_currentTempo.push([pindex, element]);
            }
            else if (!grandchild.empty() && musicxmlNodeType(grandchild, 'bracket')) {
              this.m_currentBrackets[pindex].push(element);
            }
          }
        }
        else if (musicxmlNodeType(element, 'figured-bass')) {
          this.m_currentFiguredBass[pindex].push(element);
        }
        else if (musicxmlNodeType(element, 'print')) {
          this.processPrintElement(gm, element, nowtime);
        }
      }
    }
    this.addGraceLines(gm, gracebefore, partdata, nowtime);
    if (hasstafflines) this.addStriaLine(gm, stafflines, partdata, nowtime);
    if (hasclef) this.addClefLine(gm, clefs, partdata, nowtime);
    if (hastransposition) this.addTranspositionLine(gm, transpositions, partdata, nowtime);
    if (haskeysig) this.addKeySigLine(gm, keysigs, partdata, nowtime);
    if (haskeydesignation) this.addKeyDesignationLine(gm, keysigs, partdata, nowtime);
    if (hastimesig) this.addTimeSigLine(gm, timesigs, partdata, nowtime);
    if (hasottava) this.addOttavaLine(gm, ottavas, partdata, nowtime);
    this.addGraceLines(gm, graceafter, partdata, nowtime);
  }

  addEventToList(list: MxmlEvent[][][][], event: MxmlEvent): void {
    const pindex = event.getPartIndex();
    const staffindex = event.getStaffIndex();
    const voiceindex = event.getVoiceIndex();
    while (list.length <= pindex) list.push([]);
    while (list[pindex].length <= staffindex) list[pindex].push([]);
    while (list[pindex][staffindex].length <= voiceindex) list[pindex][staffindex].push([]);
    list[pindex][staffindex][voiceindex].push(event);
  }

  addGraceLines(gm: GridMeasure, notes: MxmlEvent[][][][], partdata: MxmlPart[], nowtime: HumNum): void {
    let maxcount = 0;
    for (const a of notes) for (const b of a) for (const c of b) maxcount = Math.max(maxcount, c.length);
    if (!maxcount) return;
    const slices: GridSlice[] = [];
    const gslices = gm.getSlices() as unknown as GridSlice[];
    for (let i = 0; i < maxcount; i++) {
      const gs = new GridSlice(gm, nowtime, SliceType.GraceNotes);
      gslices.push(gs as never);
      this.initPartStaves(gs, partdata);
      slices.push(gs);
    }
    for (let i = 0; i < notes.length; i++) {
      for (let j = 0; j < (notes[i]?.length ?? 0); j++) {
        for (let k = 0; k < (notes[i][j]?.length ?? 0); k++) {
          const startm = maxcount - notes[i][j][k].length;
          for (let m = 0; m < notes[i][j][k].length; m++) {
            this.addEvent(slices[startm + m], gm, notes[i][j][k][m], nowtime);
          }
        }
      }
    }
  }

  processPrintElement(outdata: GridMeasure, element: xml_node, timestamp: HumNum): void {
    let isPageBreak = false;
    let isSystemBreak = false;
    const pageparam = element.attribute('new-page');
    const systemparam = element.attribute('new-system');
    if (!pageparam.empty() && pageparam.value() === 'yes') isPageBreak = true;
    if (!systemparam.empty() && systemparam.value() === 'yes') isSystemBreak = true;
    if (!isPageBreak && !isSystemBreak) return;
    const slices = outdata.getSlices() as GridSlice[];
    const gs = slices.length ? slices[slices.length - 1] : null;
    let tok = '';
    if (gs && gs.length > 0 && (gs.at(0)?.length ?? 0) > 0 && (gs.at(0)?.at(0)?.length ?? 0) > 0) {
      tok = gs.at(0)?.at(0)?.[0]?.getToken()?.value ?? '';
    }
    if (isPageBreak) {
      if (tok !== '!!pagebreak:original') this.addGlobalComment(outdata, '!!pagebreak:original', timestamp);
    }
    else if (isSystemBreak) {
      if (tok !== '!!linebreak:original') this.addGlobalComment(outdata, '!!linebreak:original', timestamp);
    }
  }

  addGlobalComment(outdata: GridMeasure, tok: string, timestamp: HumNum): void {
    const slices = outdata.getSlices() as GridSlice[];
    if (!slices.length || (slices[slices.length - 1] as GridSlice).getTimestamp().getFloat() < timestamp.getFloat()) {
      const gs = new GridSlice(outdata, timestamp, SliceType.GlobalComments);
      this.initPartStaves(gs, [{ getStaffCount: () => 1 } as never]);
      gs.addToken(tok, 0, 0, 0);
      slices.push(gs);
      return;
    }
    for (let i = 0; i < slices.length; i++) {
      const gs = slices[i] as GridSlice;
      if (gs.getTimestamp().equals(timestamp)) {
        if (gs.isGlobalComment() && gs.at(0)?.at(0)?.[0]?.getToken()?.value === tok) return;
        const ngs = new GridSlice(outdata, timestamp, SliceType.GlobalComments);
        this.initPartStaves(ngs, [{ getStaffCount: () => 1 } as never]);
        ngs.addToken(tok, 0, 0, 0);
        slices.splice(i, 0, ngs as never);
        return;
      }
      if (gs.getTimestamp().getFloat() > timestamp.getFloat()) {
        const ngs = new GridSlice(outdata, timestamp, SliceType.GlobalComments);
        this.initPartStaves(ngs, [{ getStaffCount: () => 1 } as never]);
        ngs.addToken(tok, 0, 0, 0);
        slices.splice(i, 0, ngs as never);
        return;
      }
    }
  }

  addClefLine(gm: GridMeasure, clefs: xml_node[][], partdata: MxmlPart[], nowtime: HumNum): void {
    const slice = new GridSlice(gm, nowtime, SliceType.Clefs);
    gm.getSlices().push(slice);
    this.initPartStaves(slice, partdata);
    for (let i = 0; i < partdata.length; i++) {
      for (const c of clefs[i]) {
        if (!c.empty()) this.insertPartClefs(c, slice.at(i)!);
      }
    }
  }

  // C++ Tool_musicxml2hum::addStriaLine (humlib.cpp:119923).
  addStriaLine(gm: GridMeasure, stafflines: xml_node[][], partdata: MxmlPart[], nowtime: HumNum): void {
    const slice = new GridSlice(gm, nowtime, SliceType.Stria);
    gm.getSlices().push(slice);
    this.initPartStaves(slice, partdata);
    for (let i = 0; i < partdata.length; i++) {
      for (const sl of stafflines[i]) {
        if (sl.empty()) continue;
        const linecount = Number.parseInt(sl.child_value(), 10);
        if (Number.isNaN(linecount)) continue;
        slice.at(i)?.at(0)?.setTokenLayer(0, `*stria${linecount}`, new HumNum(0));
      }
    }
    this.fillEmpties(slice.at(0)!, '*');
  }

  // C++ Tool_musicxml2hum::addTranspositionLine (humlib.cpp:120079).
  addTranspositionLine(gm: GridMeasure, transpositions: xml_node[][], partdata: MxmlPart[], nowtime: HumNum): void {
    const slice = new GridSlice(gm, nowtime, SliceType.Transpositions);
    gm.getSlices().push(slice);
    this.initPartStaves(slice, partdata);
    for (let i = 0; i < partdata.length; i++) {
      for (const tr of transpositions[i]) {
        if (!tr.empty()) this.insertPartTranspositions(tr, slice.at(i)!);
      }
    }
  }

  // C++ Tool_musicxml2hum::insertPartTranspositions (humlib.cpp:120269).
  insertPartTranspositions(transposition: xml_node, part: GridPart): void {
    let tr = transposition;
    while (!tr.empty()) {
      const out = this.convertTranspositionToHumdrum(tr);
      if (!out.token) { tr = out.next; continue; }
      if (out.staffindex < 0) {
        for (let s = 0; s < part.length; s++) {
          part[s]?.setTokenLayer(0, out.token, new HumNum(0));
        }
      }
      else part[out.staffindex]?.setTokenLayer(0, out.token, new HumNum(0));
      tr = out.next;
    }
  }

  // C++ Tool_musicxml2hum::convertTranspositionToHumdrum (humlib.cpp:120397).
  convertTranspositionToHumdrum(transpose: xml_node): { token: string | null; staffindex: number; next: xml_node } {
    if (transpose.empty()) return { token: null, staffindex: -1, next: transpose };
    let staffindex = -1;
    const sn = transpose.attribute('number');
    if (!sn.empty()) staffindex = Number.parseInt(sn.value(), 10) - 1;
    let diatonic = 0;
    let chromatic = 0;
    for (let child = transpose.first_child(); !child.empty(); child = child.next_sibling()) {
      if (musicxmlNodeType(child, 'diatonic')) diatonic = Number.parseInt(child.child_value(), 10);
      else if (musicxmlNodeType(child, 'chromatic')) chromatic = Number.parseInt(child.child_value(), 10);
    }
    // Sounding viewpoint: negate for the written pitch.
    diatonic = -diatonic;
    chromatic = -chromatic;
    const token = `*Trd${diatonic}c${chromatic}`;
    const next = transpose.next_sibling();
    if (next.empty() || !musicxmlNodeType(next, 'transpose')) return { token, staffindex, next: new xml_node() };
    return { token, staffindex, next };
  }

  storeOttava(pindex: number, octaveShift: xml_node, direction: xml_node, ottavas: xml_node[][][]): void {
    let staffindex = 0;
    const stafftext = childValue(direction, 'staff');
    if (stafftext) {
      const staffnum = Number.parseInt(stafftext, 10);
      if (staffnum > 0) staffindex = staffnum - 1;
    }
    while (ottavas[pindex].length <= staffindex) ottavas[pindex].push([]);
    ottavas[pindex][staffindex].push(octaveShift);
  }

  addOttavaLine(gm: GridMeasure, ottavas: xml_node[][][], partdata: MxmlPart[], nowtime: HumNum): void {
    const slice = new GridSlice(gm, nowtime, SliceType.Ottavas);
    gm.getSlices().push(slice);
    this.initPartStaves(slice, partdata);
    for (let p = 0; p < ottavas.length; p++) {
      for (let s = 0; s < (ottavas[p]?.length ?? 0); s++) {
        for (const o of ottavas[p][s]) {
          if (!o.empty()) this.insertPartOttavas(o, slice.at(p)!, p, s, partdata[p].getStaffCount());
        }
      }
    }
  }

  insertPartOttavas(ottava: xml_node, part: GridPart, partindex: number, partstaffindex: number, staffcount: number): void {
    let cur = ottava;
    while (!cur.empty()) {
      const out = this.convertOttavaToHumdrum(cur, partindex, partstaffindex);
      part[partstaffindex]?.setTokenLayer(0, out.token, new HumNum(0));
      cur = out.next;
    }
    this.fillEmpties(part, '*');
  }

  convertOttavaToHumdrum(ottava: xml_node, partindex: number, staffindex: number): { token: string; next: xml_node } {
    const sizeAttr = ottava.attribute('size');
    const interval = sizeAttr.empty() ? 0 : Number.parseInt(sizeAttr.value(), 10);
    const otype = ottava.attribute('type').value();
    let lastotype = '';
    if (this.m_lastOttavaDirection[partindex] && staffindex < this.m_lastOttavaDirection[partindex].length) {
      lastotype = this.m_lastOttavaDirection[partindex][staffindex];
    }
    let ss = '*';
    if (otype === 'stop') ss += 'X';
    else {
      if (!this.m_lastOttavaDirection[partindex]) this.m_lastOttavaDirection[partindex] = [];
      this.m_lastOttavaDirection[partindex][staffindex] = otype;
    }
    if (interval === 15) {
      ss += '15';
      if (otype === 'down') ss += 'ma';
      else if (otype === 'up') ss += 'ba';
      else if (otype === 'stop') {
        if (lastotype === 'up') ss += 'ba';
        else if (lastotype === 'down') ss += 'ma';
      }
    }
    else {
      ss += interval === 8 ? '8' : '*8';
      if (otype === 'down') ss += 'va';
      else if (otype === 'up') ss += 'ba';
      else if (otype === 'stop') {
        if (lastotype === 'up') ss += 'ba';
        else if (lastotype === 'down') ss += 'va';
      }
    }
    const next = ottava.next_sibling();
    const nextOut = (!next.empty() && musicxmlNodeType(next, 'octave-shift')) ? next : new xml_node();
    return { token: ss, next: nextOut };
  }

  addKeySigLine(gm: GridMeasure, keysigs: xml_node[][], partdata: MxmlPart[], nowtime: HumNum): void {
    const slice = new GridSlice(gm, nowtime, SliceType.KeySigs);
    gm.getSlices().push(slice);
    this.initPartStaves(slice, partdata);
    for (let i = 0; i < partdata.length; i++) {
      for (const k of keysigs[i]) {
        if (!k.empty()) this.insertPartKeySigs(k, slice.at(i)!);
      }
    }
  }

  addKeyDesignationLine(gm: GridMeasure, keysigs: xml_node[][], partdata: MxmlPart[], nowtime: HumNum): void {
    const slice = new GridSlice(gm, nowtime, SliceType.KeyDesignations);
    gm.getSlices().push(slice);
    this.initPartStaves(slice, partdata);
    for (let i = 0; i < partdata.length; i++) {
      for (const k of keysigs[i]) {
        if (!k.empty()) this.insertPartKeyDesignations(k, slice.at(i)!);
      }
    }
    for (let i = 0; i < partdata.length; i++) this.fillEmpties(slice.at(i)!, '*');
  }

  insertPartKeyDesignations(keysig: xml_node, part: GridPart): void {
    let cur = keysig;
    while (!cur.empty()) {
      const out = this.convertKeySigToHumdrumKeyDesignation(cur);
      if (out.token === null) return;
      if (out.staffindex < 0) {
        for (let s = 0; s < part.length; s++) {
          if (s === 0) part[s]?.setTokenLayer(0, out.token, new HumNum(0));
          else part[s]?.setTokenLayer(0, out.token, new HumNum(0));
        }
      }
      else part[out.staffindex]?.setTokenLayer(0, out.token, new HumNum(0));
      cur = out.next;
    }
  }

  convertKeySigToHumdrumKeyDesignation(keysig: xml_node): { token: string | null; staffindex: number; next: xml_node } {
    if (keysig.empty()) return { token: '*', staffindex: 0, next: keysig };
    let staffindex = -1;
    const sn = keysig.attribute('number');
    if (!sn.empty()) staffindex = Number.parseInt(sn.value(), 10) - 1;
    let fifths = 0;
    let mode = -1;
    for (let child = keysig.first_child(); !child.empty(); child = child.next_sibling()) {
      if (musicxmlNodeType(child, 'fifths')) fifths = Number.parseInt(child.child_value(), 10);
      if (musicxmlNodeType(child, 'mode')) {
        const value = child.child_value();
        if (value === 'major') mode = 0;
        else if (value === 'minor') mode = 1;
      }
    }
    if (mode < 0) return { token: null, staffindex, next: new xml_node() };
    const majorNames: Record<number, string> = { 7: 'C#', 6: 'F#', 5: 'B', 4: 'E', 3: 'A', 2: 'D', 1: 'G', 0: 'C', '-1': 'F', '-2': 'B-', '-3': 'E-', '-4': 'A-', '-5': 'D-', '-6': 'G-', '-7': 'C-' };
    const minorNames: Record<number, string> = { 7: 'a#', 6: 'd#', 5: 'g#', 4: 'c#', 3: 'f#', 2: 'b', 1: 'e', 0: 'a', '-1': 'd', '-2': 'g', '-3': 'c', '-4': 'f', '-5': 'b-', '-6': 'e-', '-7': 'a-' };
    const name = mode === 0 ? majorNames[fifths] : minorNames[fifths];
    if (name === undefined) return { token: null, staffindex, next: new xml_node() };
    const next = keysig.next_sibling();
    const nextOut = (next.empty() || !musicxmlNodeType(next, 'key')) ? new xml_node() : next;
    return { token: '*' + name + ':', staffindex, next: nextOut };
  }

  addTimeSigLine(gm: GridMeasure, timesigs: xml_node[][], partdata: MxmlPart[], nowtime: HumNum): void {
    const slice = new GridSlice(gm, nowtime, SliceType.TimeSigs);
    gm.getSlices().push(slice);
    this.initPartStaves(slice, partdata);
    let status = false;
    for (let i = 0; i < partdata.length; i++) {
      for (const t of timesigs[i]) {
        if (!t.empty()) status = this.insertPartTimeSigs(t, slice.at(i)!) || status;
      }
    }
    if (!status) return;
    const mslice = new GridSlice(gm, nowtime, SliceType.MeterSigs);
    gm.getSlices().push(mslice);
    this.initPartStaves(mslice, partdata);
    for (let i = 0; i < partdata.length; i++) {
      for (const t of timesigs[i]) {
        if (!t.empty()) this.insertPartMensurations(t, mslice.at(i)!!);
      }
    }
  }

  initPartStaves(slice: GridSlice, partdata: MxmlPart[]): void {
    slice.length = 0;
    for (const pd of partdata) {
      const gp = new GridPart();
      for (let j = 0; j < pd.getStaffCount(); j++) gp.push(new GridStaff());
      slice.push(gp);
    }
  }

  fillEmpties(part: GridPart, str: string): void {
    for (let s = 0; s < part.length; s++) {
      const staff = part[s];
      if (!staff) continue;
      if (staff.length === 0) staff.setTokenLayer(0, str, new HumNum(0));
    }
  }

  insertPartClefs(clef: xml_node, part: GridPart): void {
    let cur = clef;
    while (!cur.empty()) {
      const out = this.convertClefToHumdrum(cur);
      if (out.token) part[out.staffindex]?.setTokenLayer(0, out.token, new HumNum(0));
      cur = out.next;
    }
    this.fillEmpties(part, '*');
  }

  convertClefToHumdrum(clef: xml_node): { token: string | null; staffindex: number; next: xml_node } {
    if (clef.empty()) return { token: null, staffindex: 0, next: clef };
    let staffindex = 0;
    const sn = clef.attribute('number');
    if (!sn.empty()) staffindex = Number.parseInt(sn.value(), 10) - 1;
    let sign = '';
    let line = -1000;
    let octadjust = 0;
    for (let child = clef.first_child(); !child.empty(); child = child.next_sibling()) {
      if (musicxmlNodeType(child, 'sign')) sign = child.child_value();
      else if (musicxmlNodeType(child, 'line')) line = Number.parseInt(child.child_value(), 10);
      else if (musicxmlNodeType(child, 'clef-octave-change')) octadjust = Number.parseInt(child.child_value(), 10);
    }
    if (sign === 'percussion') { sign = 'X'; line = -1000; }
    let ss = '*clef' + sign;
    if (octadjust < 0) ss += 'v'.repeat(-octadjust);
    else if (octadjust > 0) ss += '^'.repeat(octadjust);
    if (line > 0) ss += String(line);
    const next = clef.next_sibling();
    if (next.empty() || !musicxmlNodeType(next, 'clef')) return { token: ss, staffindex, next: new xml_node() };
    return { token: ss, staffindex, next };
  }

  insertPartKeySigs(keysig: xml_node, part: GridPart): void {
    let cur = keysig;
    while (!cur.empty()) {
      const out = this.convertKeySigToHumdrum(cur);
      if (out.staffindex < 0) {
        for (let s = 0; s < part.length; s++) part[s]?.setTokenLayer(0, out.token, new HumNum(0));
      }
      else part[out.staffindex]?.setTokenLayer(0, out.token, new HumNum(0));
      cur = out.next;
    }
  }

  convertKeySigToHumdrum(keysig: xml_node): { token: string; staffindex: number; next: xml_node } {
    let staffindex = -1;
    const sn = keysig.attribute('number');
    if (!sn.empty()) staffindex = Number.parseInt(sn.value(), 10) - 1;
    let fifths = 0;
    for (let child = keysig.first_child(); !child.empty(); child = child.next_sibling()) {
      if (musicxmlNodeType(child, 'fifths')) fifths = Number.parseInt(child.child_value(), 10);
    }
    let ss = '*k[';
    if (fifths > 0) {
      const sharps = ['f#', 'c#', 'g#', 'd#', 'a#', 'e#', 'b#'];
      for (let i = 0; i < fifths && i < 7; i++) ss += sharps[i];
    }
    else if (fifths < 0) {
      const flats = ['b-', 'e-', 'a-', 'd-', 'g-', 'c-', 'f-'];
      for (let i = 0; i < -fifths && i < 7; i++) ss += flats[i];
    }
    ss += ']';
    const next = keysig.next_sibling();
    if (next.empty() || !musicxmlNodeType(next, 'key')) return { token: ss, staffindex, next: new xml_node() };
    return { token: ss, staffindex, next };
  }

  insertPartTimeSigs(timesig: xml_node, part: GridPart): boolean {
    let cur = timesig;
    let hasmensuration = false;
    while (!cur.empty()) {
      hasmensuration = !cur.attribute('symbol').empty() || hasmensuration;
      const out = this.convertTimeSigToHumdrum(cur);
      if (out.token && out.staffindex < 0) {
        for (let s = 0; s < part.length; s++) part[s]?.setTokenLayer(0, out.token, new HumNum(0));
      }
      else if (out.token) part[out.staffindex]?.setTokenLayer(0, out.token, new HumNum(0));
      cur = out.next;
    }
    return hasmensuration;
  }

  convertTimeSigToHumdrum(timesig: xml_node): { token: string | null; staffindex: number; next: xml_node } {
    if (timesig.empty()) return { token: null, staffindex: -1, next: new xml_node() };
    let staffindex = -1;
    const sn = timesig.attribute('number');
    if (!sn.empty()) staffindex = Number.parseInt(sn.value(), 10) - 1;
    let beats = -1;
    let beattype = -1;
    for (let child = timesig.first_child(); !child.empty(); child = child.next_sibling()) {
      if (musicxmlNodeType(child, 'beats')) beats = Number.parseInt(child.child_value(), 10);
      else if (musicxmlNodeType(child, 'beat-type')) beattype = Number.parseInt(child.child_value(), 10);
    }
    if (beats === -1 && beattype === -1) return { token: null, staffindex, next: new xml_node() };
    const token = '*M' + beats + '/' + beattype;
    const next = timesig.next_sibling();
    if (next.empty() || !musicxmlNodeType(next, 'time')) return { token, staffindex, next: new xml_node() };
    return { token, staffindex, next };
  }

  insertPartMensurations(timesig: xml_node, part: GridPart): void {
    let cur = timesig;
    while (!cur.empty()) {
      const out = this.convertMensurationToHumdrum(cur);
      for (let s = 0; s < part.length; s++) {
        if (s === 0) part[s]?.setTokenLayer(0, out.token, new HumNum(0));
        else part[s]?.setTokenLayer(0, out.token, new HumNum(0));
      }
      cur = out.next;
    }
  }

  convertMensurationToHumdrum(timesig: xml_node): { token: string; next: xml_node } {
    const mens = timesig.attribute('symbol');
    let token = '*';
    if (!mens.empty()) {
      if (mens.value() === 'cut') token = '*met(c|)';
      else if (mens.value() === 'common') token = '*met(c)';
      else token = '*';
    }
    const next = timesig.next_sibling();
    if (next.empty() || !musicxmlNodeType(next, 'time')) return { token, next: new xml_node() };
    return { token, next };
  }

  appendNonZeroEvents(
    outdata: unknown,
    nowevents: SimultaneousEvents[],
    nowtime: HumNum,
    partdata: MxmlPart[],
  ): void {
    const gm = outdata as GridMeasure;
    const slice = new GridSlice(gm, nowtime, SliceType.Notes);
    const slices = (gm as unknown as { getSlices(): unknown[] }).getSlices();
    if (!slices.length) slices.push(slice);
    else {
      const last = slices[slices.length - 1] as GridSlice;
      if (nowtime.getFloat() >= last.getTimestamp().getFloat()) slices.push(slice);
      else {
        let idx = slices.length;
        for (let i = slices.length - 1; i >= 0; i--) {
          if (nowtime.getFloat() >= (slices[i] as GridSlice).getTimestamp().getFloat()) { idx = i + 1; break; }
          idx = i;
        }
        slices.splice(idx, 0, slice);
      }
    }
    slice.length = 0;
    for (const pd of partdata) {
      const gp = new GridPart();
      for (let j = 0; j < pd.getStaffCount(); j++) gp.push(new GridStaff());
      slice.push(gp);
    }
    // WASM ground truth: dynamics/text layout slices copy the note slice
    // after every event at this timestamp is placed, so defer the flush
    // until the slice carries its full voice structure.
    this.m_deferDynamics = true;
    this.m_deferText = true;
    const ordered: MxmlEvent[] = [];
    try {
      for (const se of nowevents) {
        for (const e of se.nonzerodur) {
          this.addEvent(slice, gm, e, nowtime);
          ordered.push(e);
        }
      }
    } finally {
      this.m_deferDynamics = false;
      this.m_deferText = false;
    }
    // Same per-event flush order as C++, but after the slice holds every
    // event at this timestamp.
    for (const e of ordered) {
      this.flushTexts(slice, gm, e, 0, 0);
      this.flushTempos(slice, gm, e, 0, 0);
      this.flushDynamics(slice, gm, e);
      this.flushHairpinEnding(slice, e);
    }
  }

  flushTempos(slice: GridSlice, outdata: unknown, event: MxmlEvent, staffindex: number, voiceindex: number): void {
    if (this.m_currentTempo.length === 0) return;
    event.setTempos(this.m_currentTempo);
    this.m_currentTempo = [];
    this.addTempos(slice, outdata as GridMeasure, staffindex, voiceindex, event);
  }

  flushTexts(slice: GridSlice, outdata: unknown, event: MxmlEvent, staffindex: number, voiceindex: number): void {
    if (this.m_currentText.length === 0) return;
    event.setTexts(this.m_currentText);
    this.m_currentText = [];
    this.addTexts(slice, outdata as GridMeasure, event.getPartIndex(), staffindex, voiceindex, event);
  }

  flushDynamics(slice: GridSlice, outdata: unknown, event: MxmlEvent): void {
    const partindex = event.getPartIndex();
    if (!(this.m_currentDynamic[partindex] && this.m_currentDynamic[partindex].length > 0)) return;
    for (const dyn of this.m_currentDynamic[partindex]) {
      event.setDynamics(dyn);
      const dparam = this.getDynamicsParameters(dyn);
      event.reportDynamicToOwner();
      this.addDynamic(slice.at(partindex)!, event, partindex);
      if (dparam !== '') {
        const gm = (outdata as GridMeasure) ?? slice.getMeasure?.();
        const fullparam = '!LO:DY' + dparam;
        if (gm) this.addDynamicsLayoutParameters(gm as GridMeasure, slice, partindex, fullparam);
      }
    }
    this.m_currentDynamic[partindex] = [];
  }

  addEvent(slice: GridSlice, outdata: unknown, event: MxmlEvent, nowtime: HumNum): void {
    void outdata;
    void nowtime;
    const partindex = event.getPartIndex();
    const staffindex = event.getStaffIndex();
    const voiceindex = event.getVoiceIndex();
    if (event.isFloating()) {
      slice.at(partindex)?.at(staffindex)?.setTokenLayer(voiceindex, '.', event.getDuration());
    }
    else {
    const recip0 = event.getRecip();
    let recip = recip0;
    const pctm = recip.match(/^(\d+)%(\d+)(\.*)$/);
    if (pctm) {
      const first = Number.parseInt(pctm[1], 10);
      const second = Number.parseInt(pctm[2], 10);
      const dots = pctm[3];
      if (!dots) {
        if (first === 1 && second === 2) recip = '0';
        else if (first === 1 && second === 4) recip = '00';
        else if (first === 1 && second === 3) recip = '0.';
        else if (first === 2 && second === 3) recip = '1.';
      }
      else {
        if (first === 1 && second === 2) recip = '0' + dots;
      }
    }
    const pitch = event.getKernPitch();
    let prefix = event.getPrefixNoteInfo();
    let postfix = event.getPostfixNoteInfo(true, recip);
    const slurdirs: number[] = [];
    const slurstarts = event.hasSlurStart(slurdirs);
    const slurstops = event.hasSlurStop();
    for (let i = 0; i < slurstarts; i++) {
      prefix = '(' + prefix;
    }
    for (let i = 0; i < slurstops; i++) postfix += ')';
    void slurdirs;
    if (event.getCrossStaffOffset() > 0) this.m_staffbelow = true;
    else if (event.getCrossStaffOffset() < 0) this.m_staffabove = true;
    let pitch2 = pitch;
    if (pitch2.includes('r')) pitch2 += event.getRestPitch();
    let token = prefix + recip + pitch2 + postfix;
    if (event.isInvisible() || this.isInvisible(event)) token += 'yy';
    if (event.isChord()) token = this.addSecondaryChordNotes(token, event, recip);
    if (event.isGrace()) {
      const mod = { v: new HumNum(1) };
      const dur = MxmlEvent.getEmbeddedDuration(mod, event.getNode()).div(new HumNum(4));
      let grec = 'q';
      if (dur.getNumerator() === 1) grec = String(dur.getDenominator()) + 'q';
      if (!event.hasGraceSlash()) grec += 'q';
      token = prefix + grec + pitch2 + postfix;
      if (event.isInvisible() || this.isInvisible(event)) token += 'yy';
      if (event.isChord()) token = this.addSecondaryChordNotes(token, event, grec);
    }
    slice.at(partindex)?.at(staffindex)?.setTokenLayer(voiceindex, token, event.getDuration());
    }
    if (this.m_currentBrackets[partindex] && this.m_currentBrackets[partindex].length > 0) {
      for (const b of this.m_currentBrackets[partindex]) event.setBracket(b);
      this.m_currentBrackets[partindex] = [];
      this.addBrackets(slice, outdata as GridMeasure, event, nowtime, partindex);
    }
    if (!this.m_deferText && this.m_currentTempo.length > 0) this.flushTempos(slice, outdata, event, staffindex, voiceindex);
    if (!this.m_deferText && this.m_currentText.length > 0) this.flushTexts(slice, outdata, event, staffindex, voiceindex);
    if (!this.m_deferDynamics) this.flushDynamics(slice, outdata, event);
    const fcount = this.addFiguredBass(slice.at(partindex)!, event, nowtime, partindex);
    if (fcount > 0) event.reportFiguredBassToOwner();
    if (!this.m_deferDynamics) this.flushHairpinEnding(slice, event);
  }

  flushHairpinEnding(slice: GridSlice, event: MxmlEvent): void {
    const partindex = event.getPartIndex();
    const enode = event.getHairpinEnding();
    if (enode && !enode.empty()) {
      event.reportDynamicToOwner();
      this.addHairpinEnding(slice.at(partindex)!, event, partindex);
    }
  }

  addBrackets(slice: GridSlice, measure: GridMeasure, event: MxmlEvent, nowtime: HumNum, partindex: number): void {
    const staffindex = 0;
    const voiceindex = 0;
    for (const bnode of event.getBrackets()) {
      const bracket = bnode.child('direction-type').child('bracket');
      if (bracket.empty()) continue;
      let linetype = bracket.attribute('line-type').value();
      const endtype = bracket.attribute('type').value();
      const number = Number.parseInt(bracket.attribute('number').value() || '1', 10);
      if (endtype === 'stop') linetype = this.m_bracketTypeBuffer[number] ?? '';
      else this.m_bracketTypeBuffer[number] = linetype;
      if (linetype === 'solid') {
        if (endtype === 'start') (measure as GridMeasure).addInterpretationBefore(slice, partindex, staffindex, voiceindex, '*lig');
        else if (endtype === 'stop') {
          const timestamp = nowtime.add(event.getDuration());
          (measure as GridMeasure).addInterpretationAfter(slice, partindex, staffindex, voiceindex, '*Xlig', timestamp);
        }
      }
      else if (linetype === 'dashed') {
        if (endtype === 'start') (measure as GridMeasure).addInterpretationBefore(slice, partindex, staffindex, voiceindex, '*col');
        else if (endtype === 'stop') {
          const timestamp = nowtime.add(event.getDuration());
          (measure as GridMeasure).addInterpretationAfter(slice, partindex, staffindex, voiceindex, '*Xcol', timestamp);
        }
      }
    }
  }

  addFiguredBass(part: GridPart, event: MxmlEvent, nowtime: HumNum, partindex: number): number {
    const list = this.m_currentFiguredBass[partindex] ?? [];
    if (!list.length) return 0;
    let dursum = 0;
    for (let i = 0; i < list.length; i++) {
      const fnode = list[i];
      if (fnode.empty()) continue;
      const fstring = this.getFiguredBassString(fnode);
      if (i === 0) part.setFiguredBass(fstring);
      else {
        const ts = new HumNum(dursum).div(new HumNum(event.getQTicks())).add(nowtime);
        this.m_offsetFiguredBass.push({ token: fstring, timestamp: ts, partindex });
      }
      if (i < list.length - 1) dursum += this.getFiguredBassDuration(fnode);
    }
    this.m_currentFiguredBass[partindex] = [];
    return 1;
  }

  getFiguredBassDuration(fnode: xml_node): number {
    if (fnode.empty()) return 0;
    for (let c = fnode.first_child(); !c.empty(); c = c.next_sibling()) {
      if (musicxmlNodeType(c, 'duration')) return parseIntText(c.child_value());
    }
    return 0;
  }

  getFiguredBassString(fnode: xml_node): string {
    let editorial = '';
    const pattr = fnode.attribute('parentheses');
    if (!pattr.empty() && pattr.value() === 'yes') editorial = 'i';
    const figs: xml_node[] = [];
    for (let c = fnode.first_child(); !c.empty(); c = c.next_sibling()) {
      if (musicxmlNodeType(c, 'figure')) figs.push(c);
    }
    let output = figs.map((f) => this.convertFiguredBassNumber(f) + editorial).join(' ');
    output = output.replace(/^\s+|\s+$/g, '');
    if (!output) output = '.';
    return output;
  }

  convertFiguredBassNumber(figure: xml_node): string {
    const child = (name: string): string => {
      const n = selectNode(figure, './' + name);
      return n.empty() ? '' : n.child_value();
    };
    const prefix = child('prefix');
    const suffix = child('suffix');
    const number = child('figure-number');
    let accidental = '';
    let slash = '';
    if (prefix === 'flat-flat') accidental = '--';
    else if (prefix === 'flat') accidental = '-';
    else if (prefix === 'double-sharp' || prefix === 'sharp-sharp') accidental = '##';
    else if (prefix === 'sharp') accidental = '#';
    else if (prefix === 'natural') accidental = 'n';
    else if (suffix === 'flat-flat') accidental = '--r';
    else if (suffix === 'flat') accidental = '-r';
    else if (suffix === 'double-sharp' || suffix === 'sharp-sharp') accidental = '##r';
    else if (suffix === 'sharp') accidental = '#r';
    else if (suffix === 'natural') accidental = 'nr';
    if (suffix === 'cross' || prefix === 'cross' || suffix === 'vertical' || prefix === 'vertical') {
      slash = '|';
      if (!accidental) accidental = '#';
    }
    else if (suffix === 'backslash' || suffix === 'back-slash' || prefix === 'backslash' || prefix === 'back-slash') {
      slash = '\\';
      if (!accidental) accidental = '#';
    }
    else if (suffix === 'slash' || prefix === 'slash') {
      slash = '/';
      if (!accidental) accidental = '-';
    }
    let extension = '';
    const ext = selectNode(figure, './extend');
    if (!ext.empty() && ext.attribute('type').value() === 'start') extension = '_';
    return accidental + number + slash + extension;
  }

  addTempos(slice: GridSlice, measure: GridMeasure, staffindex: number, voiceindex: number, event: MxmlEvent): void {
    for (const item of event.getTempos()) {
      this.addTempo(slice, measure, item[0], 0, voiceindex, item[1]);
    }
  }

  addTempo(slice: GridSlice, measure: GridMeasure, partindex: number, _staffindex: number, _voiceindex: number, node: xml_node): void {
    let placementstring = '';
    const placement = node.attribute('placement');
    if (!placement.empty()) {
      const v = placement.value();
      if (v === 'above') placementstring = ':a';
      else if (v === 'below') placementstring = ':b';
      else placementstring = ':a';
    }
    const child = node.first_child();
    if (child.empty() || !musicxmlNodeType(child, 'direction-type')) return;
    let sound: xml_node | null = null;
    for (let sib = child; !sib.empty(); sib = sib.next_sibling()) {
      if (musicxmlNodeType(sib, 'sound')) { sound = sib; break; }
    }
    let metronome: xml_node | null = null;
    for (let sib = child.first_child(); !sib.empty(); sib = sib.next_sibling()) {
      if (musicxmlNodeType(sib, 'metronome')) { metronome = sib; break; }
    }
    let beatunit: xml_node | null = null;
    let beatunitdot: xml_node | null = null;
    let perminute: xml_node | null = null;
    if (metronome) {
      for (let sib = metronome.first_child(); !sib.empty(); sib = sib.next_sibling()) {
        if (musicxmlNodeType(sib, 'beat-unit')) beatunit = sib;
        else if (musicxmlNodeType(sib, 'beat-unit-dot')) beatunitdot = sib;
        else if (musicxmlNodeType(sib, 'per-minute')) perminute = sib;
      }
    }
    let mmvalue = '';
    if (sound) mmvalue = attributeValue(sound, 'tempo');
    if (!beatunit || !perminute) return;
    let text = '[' + beatunit.child_value();
    if (beatunitdot) text += '-dot';
    text += ']=' + perminute.child_value();
    if (sound) {
      const mmv = parseFloat(mmvalue);
      const mmi = Math.floor(mmv + 0.001);
      let mmtok = '*MM' + (Math.abs(mmv - mmi) < 0.01 ? String(mmi) : mmvalue);
      measure.addTempoTokenTok(mmtok, slice.getTimestamp(), partindex, 0, 0, this.m_maxstaff);
    }
    measure.addTempoTokenText(slice as never, partindex, '!LO:TX' + placementstring + ':t=' + text);
  }

  getDynamicsParameters(element: xml_node): string {
    let output = '';
    if (!musicxmlNodeType(element, 'direction')) return output;
    const placement = element.attribute('placement');
    if (!placement.empty() && placement.value() === 'above') output = ':a';
    const child = element.first_child();
    if (child.empty() || !musicxmlNodeType(child, 'direction-type')) return output;
    const grandchild = child.first_child();
    if (grandchild.empty() || !musicxmlNodeType(grandchild, 'wedge')) return output;
    const wtype = grandchild.attribute('type');
    if (!wtype.empty() && wtype.value() === 'stop') output = '';
    return output;
  }

  addDynamicsLayoutParameters(measure: GridMeasure, slice: GridSlice, partindex: number, locomment: string): void {;
    const slices = measure.getSlices() as unknown as GridSlice[];
    if (!slices.length) return;
    let idx = -1;
    for (let i = slices.length - 1; i >= 0; i--) {
      if (slices[i] === (slice as never)) { idx = i; break; }
    }
    if (idx < 0) return;
    let i = idx - 1;
    while (i >= 0 && (slices[i] as GridSlice).isLayoutSlice()) {
      const part = (slices[i] as GridSlice).at(partindex);
      const dyn = part?.getDynamics?.();
      if (!dyn || (dyn as { value?: string }).value === '!') {
        part!.setDynamics(locomment);
        return;
      }
      i--;
    }
    const newslice = new GridSlice(measure, slice.getTimestamp(), SliceType.Layouts);
    this.initializeBySlice(newslice, slice);
    slices.splice(i + 1, 0, newslice as never);
    const npart = newslice.at(partindex);
    if (!npart) return;
    npart.setDynamics(locomment);
  }

  addDynamic(part: GridPart, event: MxmlEvent, partindex: number): void {
    const directions = event.getDynamics();
    if (!directions.length) return;
    let tok: string | null = null;
    for (const direction of directions) {
      const placement = direction.attribute('placement');
      let above = false;
      if (!placement.empty() && placement.value() === 'above') above = true;
      const child = direction.first_child();
      if (child.empty() || !musicxmlNodeType(child, 'direction-type')) continue;
      const grandchild = child.first_child();
      if (grandchild.empty()) continue;
      if (!(musicxmlNodeType(grandchild, 'dynamics') || musicxmlNodeType(grandchild, 'wedge'))) continue;
      if (musicxmlNodeType(grandchild, 'dynamics')) {
        const dynamic = grandchild.first_child();
        if (dynamic.empty()) continue;
        const dstring = this.getDynamicString(dynamic);
        tok = tok === null ? dstring : tok + ' ' + dstring;
      }
      else {
        if (this.isUsedHairpin(grandchild, partindex)) continue;
        const hstring = this.getHairpinString(grandchild, partindex);
        tok = tok === null ? hstring : tok + ' ' + hstring;
      }
      void above;
    }
    if (tok !== null) part.setDynamics(tok);
  }

  isUsedHairpin(hairpin: xml_node, partindex: number): boolean {
    const key = (hairpin as unknown as { _root?: unknown })._root ?? hairpin;
    for (const h of this.m_usedHairpins[partindex] ?? []) {
      const hk = (h as unknown as { _root?: unknown })._root ?? h;
      if (hk === key) return true;
    }
    return false;
  }

  getHairpinString(element: xml_node, partindex: number): string {
    if (musicxmlNodeType(element, 'wedge')) {
      const wtype = element.attribute('type');
      if (wtype.empty()) return '???';
      const wstring = wtype.value();
      if (wstring === 'diminuendo') { this.m_stopChar[partindex] = ']'; return '>'; }
      else if (wstring === 'crescendo') { this.m_stopChar[partindex] = '['; return '<'; }
      else if (wstring === 'stop') return this.m_stopChar[partindex];
      return '???';
    }
    return '???';
  }

  getDynamicString(element: xml_node): string {
    const n = element.name();
    if (n === 'rf') return 'rfz';
    if (['f','p','mf','mp','ff','pp','sf','sfp','sfpp','fp','rfz','sfz','sffz','fz','fff','ppp','ffff','pppp'].includes(n)) return n;
    return '???';
  }

  addHairpinEnding(part: GridPart, event: MxmlEvent, partindex: number): void {
    const direction = event.getHairpinEnding();
    if (!direction || direction.empty()) return;
    const child = direction.first_child();
    if (child.empty() || !musicxmlNodeType(child, 'direction-type')) return;
    const grandchild = child.first_child();
    if (grandchild.empty() || !musicxmlNodeType(grandchild, 'wedge')) return;
    let hstring = this.getHairpinString(grandchild, partindex);
    if (hstring === '[') hstring = '[[';
    else if (hstring === ']') hstring = ']]';
    (this.m_usedHairpins[partindex] ??= []).push(grandchild);
    const current = part.getDynamics() as unknown as { value?: string } | null;
    if (!current) part.setDynamics(hstring);
    else {
      let text = (current.value ?? '');
      text += ' ' + hstring;
      if (text === '< [[') text = '<[';
      else if (text === '> ]]') text = '>]';
      else if (text === '< [') text = '<[';
      else if (text === '> ]') text = '>]';
      part.setDynamics(text);
    }
  }

  addTexts(slice: GridSlice, measure: GridMeasure, _partindex: number, _staffindex: number, voiceindex: number, event: MxmlEvent): void {
    void _partindex; void _staffindex;
    for (const item of event.getTexts()) {
      this.addText(slice, measure, item[0], 0, voiceindex, item[1]);
    }
  }

  addText(slice: GridSlice, measure: GridMeasure, partindex: number, staffindex: number, voiceindex: number, node: xml_node): void {
    let placementstring = '';
    const placement = node.attribute('placement');
    if (!placement.empty()) {
      if (placement.value() === 'above') placementstring = ':a';
      else if (placement.value() === 'below') placementstring = ':b';
    }
    const child = node.first_child();
    if (child.empty() || !musicxmlNodeType(child, 'direction-type')) return;
    const grandchild = child.first_child();
    if (grandchild.empty()) return;
    let sibling = grandchild;
    let dyQ = false;
    let text = '';
    while (!sibling.empty()) {
      if (musicxmlNodeType(sibling, 'words')) {
        text += sibling.child_value();
        if (!dyQ) {
          const dy = sibling.attribute('default-y');
          if (!dy.empty()) {
            dyQ = true;
            if (Number.parseFloat(dy.value()) >= 0) placementstring = ':a';
            else placementstring = ':b';
          }
        }
      }
      sibling = sibling.next_sibling();
    }
    if (!text) return;
    text = text.replace(/\r/g, '').replace(/\n/g, '\\n').replace(/(\\n)+\s*$/, '');
    let stylestring = '';
    const fontstyle = grandchild.attribute('font-style');
    const italic = !fontstyle.empty() && fontstyle.value() === 'italic';
    const fontweight = grandchild.attribute('font-weight');
    const bold = !fontweight.empty() && fontweight.value() === 'bold';
    if (italic && bold) stylestring = ':Bi';
    else if (italic) stylestring = ':i';
    else if (bold) stylestring = ':B';
    let specialQ = false;
    let output = '';
    let interpQ = false;
    let globalQ = false;
    if (text === '!') { output = text; specialQ = true; }
    else if (text === '*') { output = text; specialQ = true; interpQ = true; }
    else if (!specialQ && text.length > 1 && text[0] === '*' && text[1] !== '*') {
      if (!['*^', '*+', '*-', '*v'].includes(text)) { specialQ = true; interpQ = true; output = text; }
    }
    else if (!specialQ && text.length > 2 && text[0] === '*' && text[1] === '*') {
      specialQ = true; interpQ = true; output = text.replace(/\*+/, '***');
    }
    else if (!specialQ && text.length > 1 && text[0] === '!' && text[1] !== '!') { specialQ = true; output = text; }
    else if (!specialQ && text.length >= 2 && text[0] === '!' && text[1] === '!') { specialQ = true; globalQ = true; output = text; }
    if (!specialQ) {
      if (text === '') return;
      text = Tool_musicxml2hum.cleanSpacesAndColons(text);
      if (placementstring === '') placementstring = ':a';
      output = '!LO:TX' + placementstring + stylestring + ':t=' + text;
    }
    else if (!output) output = text;
    if (interpQ) (measure as unknown as GridMeasure).addInterpretationBefore(slice, partindex, staffindex, voiceindex, output);
    else if (globalQ) (measure as unknown as { addGlobalComment?: (t: string, ts: HumNum) => void }).addGlobalComment?.(text, slice.getTimestamp());
    else this.addLayoutParameter(measure, slice, partindex, output);
    void staffindex;
  }

  countSlurDirections(slurdirs: number[], slurstarts: number): void {
    for (let i = 0; i < slurstarts && i < slurdirs.length; i++) {
      if (slurdirs[i] > 0) this.m_slurabove++;
      else if (slurdirs[i] < 0) this.m_slurbelow++;
    }
  }

  addLayoutParameter(measure: GridMeasure, slice: GridSlice, partindex: number, locomment: string): void {
    void slice;
    const slices = measure.getSlices() as unknown as GridSlice[];
    if (!slices.length) return;
    // C++ GridMeasure::addLayoutParameter (humlib.cpp:9629): iter starts at
    // rbegin() (the owning slice), previous = iter + 1, so the scan starts
    // on the slice before the last one.
    // Null token (`*` after null-fill) counts as empty in C++
    // (`getToken()==NULL`); reuse it instead of opening a new slice.
    let previous = slices.length - 2;
    while (previous >= 0) {
      const prev = slices[previous];
      if (!prev || !prev.isLayoutSlice()) break;
      const part = prev.at(partindex);
      const staff = part?.[0];
      if (staff) {
        if (!staff.length) staff.push(new GridVoice());
        const voice = staff[0];
        if (voice) {
          const tok = voice.getToken();
          // C++ keeps scanning older layout slices when voice 0 already
          // holds a token (no break); the new slice is inserted before the
          // trailing layout run.
          if (!tok || tok.value === '!' || (tok.isNull && tok.isNull()) || tok.value === '*') { voice.setToken(locomment); return; }
        }
      }
      previous--;
    }
    const last = slices[slices.length - 1];
    const owner = last;
    const newslice = new GridSlice(measure, owner.getTimestamp(), SliceType.Layouts);
    // C++ GridMeasure::addLayoutParameter copies geometry from *iter, the
    // last slice in the measure (humlib.cpp:9670).
    this.initializeBySlice(newslice, owner);
    slices.splice(previous + 1, 0, newslice as never);
    const npart = newslice.at(partindex);
    if (!npart || !npart.length || !npart[0]) return;
    if (!npart[0].length) npart[0].push(new GridVoice());
    const nv = npart[0][0];
    if (nv) nv.setToken(locomment);
  }

  // C++ GridSlice::initializeBySlice (humlib.cpp:11307) copies the full
  // part/staff/voice geometry of the owning slice, so layout tokens land
  // on the voice structure of the finished note slice.
  initializeBySlice(target: GridSlice, source: GridSlice): void {
    target.length = 0;
    for (let p = 0; p < source.length; p++) {
      const part = new GridPart();
      target.push(part);
      for (let s = 0; s < (source.at(p)?.length ?? 0); s++) {
        const staff = new GridStaff();
        part.push(staff);
        for (let v = 0; v < (source.at(p)?.at(s)?.length ?? 0); v++) staff.push(new GridVoice());
      }
    }
  }

  // Layout slices created after appendNonZeroEvents must copy the finished
  // note geometry. C++ addLayoutParameter copies the owning (note) slice,
  // which already holds every voice at this timestamp.
  initializeByFinishedNoteSlice(target: GridSlice, measure: GridMeasure): void {
    const slices = measure.getSlices() as unknown as GridSlice[];
    for (let i = slices.length - 1; i >= 0; i--) {
      if (slices[i].isNoteSlice()) { this.initializeBySlice(target, slices[i]); return; }
    }
    this.initializeBySlice(target, slices[slices.length - 1]);
  }

  addSecondaryChordNotes(output: string, head: MxmlEvent, recip: string): string {
    const links = head.getLinkedNotes();
    let primarynote = false;
    void primarynote;
    for (const note of links) {
      const pitch = note.getKernPitch();
      let prefix = note.getPrefixNoteInfo();
      let postfix = note.getPostfixNoteInfo(false, recip);
      const slurdirs: number[] = [];
      const slurstarts = note.hasSlurStart(slurdirs);
      const slurstops = note.hasSlurStop();
      for (let i = 0; i < slurstarts; i++) {
        prefix = '(' + prefix;
        if (slurdirs[i] > 0) { prefix = prefix.slice(0, 1) + '>' + prefix.slice(1); this.m_slurabove++; }
        else if (slurdirs[i] < 0) { prefix = prefix.slice(0, 1) + '<' + prefix.slice(1); this.m_slurbelow++; }
      }
      for (let i = 0; i < slurstops; i++) postfix += ')';
      output += ' ' + prefix + recip + pitch + postfix;
    }
    return output;
  }

  isInvisible(event: MxmlEvent): boolean {
    const node = event.getNode();
    if (!node || node.empty()) return false;
    const attr = node.attribute('print-object');
    if (!attr.empty() && attr.value() === 'no') return true;
    return false;
  }

  static cleanSpaces(input: string): string {
    let s = input.replace(/[\t\n\r\f\v ]/g, (c) => (c === ' ' ? ' ' : ' '));
    void s;
    let out = '';
    for (const ch of input) out += /\s/.test(ch) ? ' ' : ch;
    while (out.length && /\s/.test(out[out.length - 1])) out = out.slice(0, -1);
    return out;
  }

  static cleanSpacesAndColons(input: string): string {
    let output = '';
    let foundnonspace = false;
    // C stdlib isspace() in the "C" locale: ASCII only, so U+00A0 stays literal.
    const isSpace = (ch: string): boolean => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\v' || ch === '\f' || ch === '\r';
    for (const ch of input) {
      if (isSpace(ch)) {
        if (!foundnonspace) output += ' ';
      }
      if (ch === ':') {
        foundnonspace = true;
        output += '&colon;';
      }
      else {
        output += ch;
        foundnonspace = true;
      }
    }
    while (output.length && isSpace(output[output.length - 1])) output = output.slice(0, -1);
    return output;
  }

  getVoiceMappingCheck(_e: MxmlEvent): void {
    void _e;
  }
}

export { MxmlMeasure, MxmlPart, MxmlEvent };
export type { HumNum };
