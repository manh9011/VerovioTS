import { HumNum } from './humlib';
import { HumGrid, GridMeasure, GridSliceLike } from './humgrid';
import { GridSlice, SliceType } from './gridstructures';
import { HumdrumFile } from './humlib-core';
import { xml_document, xml_node } from './pugixml';
import { Convert } from './convert';

interface MeiStaffDef { clef: string; keysig: string; timesig: string; midibpm: string; transpose: string; label: string; labelabbr: string; base40: number; }
const emptyStaffDef = (): MeiStaffDef => ({ clef: '', keysig: '', timesig: '', midibpm: '', transpose: '', label: '', labelabbr: '', base40: 0 });

// C++ Tool_mei2hum (humlib.cpp:104309+), minimal note path: score/section/
// measure/staff/layer/note/chord/rest/space/mRest. Linked nodes (slur/tie/
// fermata), dynamics etc. ported incrementally against WASM diffs.
export class Tool_mei2hum {
  private m_startlinks = new Map<string, xml_node[]>();
  private m_stoplinks = new Map<string, xml_node[]>();
  private m_scoreDefGlobal: MeiStaffDef = emptyStaffDef();
  private m_scoreDefStaves2: MeiStaffDef[] = [];
  private m_outdata = new HumGrid();
  private m_staffcount = 0;
  private m_tupletfactor = new HumNum(1);
  private m_currentLayer = 0;
  private m_currentStaff = 0;
  private m_currentMeasure = -1;
  private m_maxStaffInFile = 0;
  private m_currentMeterUnit: number[] = new Array(1000).fill(4);
  private m_measureDuration: HumNum[] = Array.from({ length: 1000 }, () => new HumNum(0));
  private m_maxverse: number[] = new Array(1000).fill(0);
  private m_hasDynamics: boolean[] = new Array(1000).fill(false);
  private m_hasXmlids: boolean[] = new Array(1000).fill(false);
  private m_hasHarm: boolean[] = new Array(1000).fill(false);
  private m_aboveQ = false;
  private m_belowQ = false;
  private m_editorialAccidentalQ = false;
  private m_beamPrefix = '';
  private m_beamPostfix = '';
  private m_fermata = false;
  private m_placeQ = true;
  private m_gracetime = new HumNum(0);
  private m_gracenotes: { node: xml_node; chord: xml_node; beamprefix: string; beampostfix: string }[] = [];
  private m_stemsQ = false;
  private m_systemDecoration = '';
  private m_mensuralQ = false;

  convertDocStr(data: string): { output: string; status: boolean } {
    const doc = new xml_document();
    if (!doc.load_string(data)) return { output: '', status: false };
    return this.convertDoc(doc);
  }

  convertDoc(doc: xml_document): { output: string; status: boolean } {
    let score = new xml_node();
    for (let m = doc.first_child(); !m.empty(); m = m.next_sibling()) {
      if (m.name() === 'mei') {
        for (let mu = m.first_child(); !mu.empty(); mu = mu.next_sibling()) {
          if (mu.name() === 'music') {
            for (let b = mu.first_child(); !b.empty(); b = b.next_sibling()) {
              if (b.name() === 'body') {
                for (let d = b.first_child(); !d.empty(); d = d.next_sibling()) {
                  if (d.name() === 'mdiv') {
                    for (let s = d.first_child(); !s.empty(); s = s.next_sibling()) {
                      if (s.name() === 'score') { score = s; break; }
                    }
                  }
                  if (!score.empty()) break;
                }
              }
              if (!score.empty()) break;
            }
          }
          if (!score.empty()) break;
        }
      }
      if (!score.empty()) break;
    }
    if (score.empty()) return { output: '', status: false };
    this.buildIdLinkMap(doc);
    this.m_staffcount = this.extractStaffCountByFirstMeasure(score);
    let t = new HumNum(0);
    t = this.parseScore(score, t);
    this.m_outdata.removeRedundantClefChanges();
    this.processHairpins();
    const outfile = new HumdrumFile();
    for (let i = 0; i < this.m_maxverse.length; i++) {
      if (this.m_maxverse[i]) this.m_outdata.setVerseCount(i, 0, this.m_maxverse[i]);
    }
    for (let i = 0; i < this.m_hasDynamics.length; i++) {
      if (this.m_hasDynamics[i]) this.m_outdata.setDynamicsPresent(i);
    }
    for (let i = 0; i < this.m_hasHarm.length; i++) {
      if (this.m_hasHarm[i]) this.m_outdata.setHarmonyPresent(i);
    }
    for (let i = 0; i < this.m_hasXmlids.length; i++) {
      if (this.m_hasXmlids[i]) this.m_outdata.setXmlidsPresent(i);
    }
    this.m_outdata.transferTokens(outfile, 0, '**kern');
    this.addHeaderRecords(outfile, doc);
    this.addFooterRecords(outfile, doc);
    for (let i = 0; i < outfile.getLineCount(); i++) outfile.getLine(i)?.createLineFromTokens();
    return { output: outfile.toString(), status: true };
  }

  childrenOf(parent: xml_node): xml_node[] {
    const out: xml_node[] = [];
    for (let c = parent.first_child(); !c.empty(); c = c.next_sibling()) out.push(c);
    return out;
  }

  extractStaffCountByFirstMeasure(element: xml_node): number {
    const measure = this.findDescendant(element, 'measure');
    if (measure.empty()) return 0;
    let count = 0;
    for (const c of this.childrenOf(measure)) if (c.name() === 'staff') count++;
    return count;
  }

  findDescendant(element: xml_node, name: string): xml_node {
    for (const c of this.childrenOf(element)) {
      if (c.name() === name) return c;
      const d = this.findDescendant(c, name);
      if (!d.empty()) return d;
    }
    return new xml_node();
  }

  parseScore(score: xml_node, starttime: HumNum): HumNum {
    for (const item of this.childrenOf(score)) {
      const n = item.name();
      if (n === 'scoreDef') this.parseScoreDef(item, starttime);
      else if (n === 'section') starttime = this.parseSection(item, starttime);
    }
    return starttime;
  }

  parseScoreDef(scoreDef: xml_node, starttime: HumNum): void {
    this.fillWithStaffDefAttributes(this.m_scoreDefGlobal, scoreDef, 'scoreDef');
    for (const item of this.childrenOf(scoreDef)) {
      const n = item.name();
      if (n === 'staffGrp') this.parseStaffGrp(item, starttime);
      else if (n === 'staffDef') this.parseStaffDef(item, starttime);
    }
    const deco = this.prepareSystemDecoration(scoreDef);
    if (deco) this.m_systemDecoration = deco;
  }

  prepareSystemDecoration(scoreDef: xml_node): string {
    const children = this.childrenOf(scoreDef);
    if (!children.length) return '';
    let output = '';
    for (const c of children) output += this.recursiveSDString(c);
    let newoutput = '';
    let counter = 0;
    for (let i = 0; i < output.length; i++) {
      newoutput += output[i];
      if (i < output.length - 1 && /\d/.test(output[i]) && output[i + 1] === 's') {
        newoutput += ',';
        counter++;
      }
    }
    return counter <= 1 ? '' : newoutput;
  }

  recursiveSDString(current: xml_node): string {
    const name = current.name();
    if (name === 'staffDef') {
      const n = Number.parseInt(current.attribute('n').value() || '0', 10);
      if (n < 1) return '';
      return 's' + n;
    }
    if (name === 'staffGrp') {
      const children = this.childrenOf(current);
      if (!children.length) return '';
      let barthru = true;
      if (current.attribute('barthru').value() === 'false') barthru = false;
      let pre = '', post = '';
      const symbol = current.attribute('symbol').value();
      if (symbol === 'bracket') { pre = '['; post = ']'; }
      else if (symbol === 'brace') { pre = '{'; post = '}'; }
      if (barthru) { pre += '('; post = ')' + post; }
      let out = pre;
      for (const c of children) out += this.recursiveSDString(c);
      return out + post;
    }
    return '';
  }

  parseStaffGrp(staffGrp: xml_node, starttime: HumNum): void {
    for (const item of this.childrenOf(staffGrp)) {
      if (item.name() === 'staffDef') this.parseStaffDef(item, starttime);
      else if (item.name() === 'staffGrp') this.parseStaffGrp(item, starttime);
    }
  }

  parseStaffDef(staffDef: xml_node, starttime: HumNum): void {
    const num = Number.parseInt(staffDef.attribute('n').value() || '0', 10);
    if (num < 1 || num > 1000) return;
    while (this.m_scoreDefStaves2.length < num) this.m_scoreDefStaves2.push(emptyStaffDef());
    this.m_scoreDefStaves2[num - 1] = { ...this.m_scoreDefGlobal };
    this.fillWithStaffDefAttributes(this.m_scoreDefStaves2[num - 1], staffDef, 'staffDef');
    const sd = this.m_scoreDefStaves2[num - 1];
    const gm = () => {
      if (this.m_outdata.empty()) this.m_outdata.addMeasureToBack();
      return this.m_outdata.back() as unknown as GridMeasure;
    };
    const label = sd.label || this.m_scoreDefGlobal.label;
    if (label) gm().addLabelToken(label, starttime, num - 1, 0, 0, this.m_staffcount, 1);
    const labelabbr = sd.labelabbr || this.m_scoreDefGlobal.labelabbr;
    if (labelabbr) gm().addLabelAbbrToken(labelabbr, starttime, num - 1, 0, 0, this.m_staffcount, 1);
    const clef = sd.clef || this.m_scoreDefGlobal.clef;
    if (clef) gm().addClefToken(clef, starttime, num - 1, 0, 0, this.m_staffcount);
    const keysig = sd.keysig || this.m_scoreDefGlobal.keysig;
    if (keysig) gm().addKeySigToken(keysig, starttime, num - 1, 0, 0, this.m_staffcount);
    const timesig = sd.timesig || this.m_scoreDefGlobal.timesig;
    if (timesig) gm().addTimeSigToken(timesig, starttime, num - 1, 0, 0, this.m_staffcount);
  }

  fillWithStaffDefAttributes(staffinfo: MeiStaffDef, element: xml_node, nodename: string): void {
    let clefshape = '', clefline = '', clefdis = '', clefdisplace = '';
    let metercount = '', meterunit = '', keysig = '';
    let label = '';
    let labelabbr = '';
    for (let a = element.first_attribute(); !a.empty(); a = a.next_attribute()) {
      const an = a.name(), av = a.value();
      if (an === 'clef.shape') clefshape = av;
      else if (an === 'clef.line') clefline = av;
      else if (an === 'clef.dis') clefdis = av;
      else if (an === 'clef.displace') clefdisplace = av;
      else if (an === 'meter.count') metercount = av;
      else if (an === 'meter.unit') meterunit = av;
      else if (an === 'key.sig') keysig = av;
      else if (an === 'label') label = av;
      else if (an === 'label.abbr') labelabbr = av;
    }
    const labelNode = this.findDescendant(element, 'label');
    if (labelNode && labelNode.child_value()) label = labelNode.child_value();
    const labelAbbrNode = this.findDescendant(element, 'labelAbbr');
    if (labelAbbrNode && labelAbbrNode.child_value()) labelabbr = labelAbbrNode.child_value();
    if (clefshape && clefline) staffinfo.clef = Tool_mei2hum.makeHumdrumClef(clefshape, clefline, clefdis, clefdisplace);
    if (metercount && meterunit) {
      // C++ uses integer division: stoi(count) * 4 / stoi(unit) (e.g. 3/8 -> 1).
      const meterduration = new HumNum(Math.floor(Number.parseInt(metercount, 10) * 4 / Number.parseInt(meterunit, 10)));
      if (nodename === 'scoreDef') {
        for (let i = 0; i < this.m_measureDuration.length; i++) {
          this.m_measureDuration[i] = meterduration;
          this.m_currentMeterUnit[i] = Number.parseInt(meterunit, 10);
        }
      } else if (nodename === 'staffDef') {
        const n = Number.parseInt(element.attribute('n').value() || '1', 10);
        if (n > 0) {
          while (this.m_measureDuration.length < n) this.m_measureDuration.push(new HumNum(4));
          while (this.m_currentMeterUnit.length < n) this.m_currentMeterUnit.push(4);
          this.m_measureDuration[n - 1] = meterduration;
          this.m_currentMeterUnit[n - 1] = Number.parseInt(meterunit, 10);
        }
      }
      staffinfo.timesig = '*M' + metercount + '/' + meterunit;
    }
    if (keysig) {
      const count = Number.parseInt(keysig, 10);
      const sharp = keysig.includes('s'), flat = keysig.includes('f');
      const sharps = ['', '*k[f#]', '*k[f#c#]', '*k[f#c#g#]', '*k[f#c#g#d#]', '*k[f#c#g#d#a#]', '*k[f#c#g#d#a#e#]', '*k[f#c#g#d#a#e#b#]'];
      const flats = ['', '*k[b-]', '*k[b-e-]', '*k[b-e-a-]', '*k[b-e-a-d-]', '*k[b-e-a-d-g-]', '*k[b-e-a-d-g-c-]', '*k[b-e-a-d-g-c-f-]'];
      if (sharp && sharps[count]) staffinfo.keysig = sharps[count];
      else if (flat && flats[count]) staffinfo.keysig = flats[count];
    }
    if (label) staffinfo.label = '*I"' + label;
    if (labelabbr) staffinfo.labelabbr = `*I'${labelabbr}`;
  }

  static makeHumdrumClef(shape: string, line: string, clefdis: string, clefdisplace: string): string {
    let output = '*clef' + shape;
    if (clefdis) {
      const number = Number.parseInt(clefdis, 10);
      let count = 0;
      if (number === 8) count = 1;
      else if (number === 15) count = 2;
      if (clefdisplace !== 'above') count = -count;
      if (count === 1) output += '^';
      else if (count === 2) output += '^^';
      else if (count === -1) output += 'v';
      else if (count === -2) output += 'vv';
    }
    return output + line;
  }

  parseSection(section: xml_node, starttime: HumNum): HumNum {
    for (const item of this.childrenOf(section)) {
      const n = item.name();
      if (n === 'section') starttime = this.parseSection(item, starttime);
      else if (n === 'measure') starttime = this.parseMeasure(item, starttime);
      else if (n === 'scoreDef') this.parseScoreDef(item, starttime);
      else if (n === 'sb') {
        const gm = this.m_outdata.back();
        (gm as unknown as { appendGlobalLayout(t: string, ts: HumNum): void }).appendGlobalLayout('!!LO:LB', starttime);
      }
      else if (n === 'scoreDef') this.parseScoreDef(item, starttime);
    }
    return starttime;
  }

  parseMeasure(measure: xml_node, starttime: HumNum): HumNum {
    const n = measure.attribute('n').value();
    this.m_currentMeasure = n ? Number.parseInt(n, 10) : 0;
    const gm = this.m_outdata.addMeasureToBack() as unknown as GridMeasure & { setTimestamp(t: HumNum): void; setDuration(d: HumNum): void; setTimeSigDur(d: HumNum): void; setFinalBarlineStyle(): void; setRepeatBackwardStyle(): void; setInvisibleBarline(): void };
    gm.setTimestamp(starttime);
    const durations: HumNum[] = [];
    for (const item of this.childrenOf(measure)) {
      const iname = item.name();
      if (iname === 'staff') durations.push(this.parseStaff(item, starttime).sub(starttime));
      else if (iname === 'dir') this.parseDir(item, starttime);
      else if (iname === 'dynam') this.parseDynam(item);
      else if (iname === 'hairpin') this.parseHairpin(item);
      else if (iname === 'tempo') this.parseTempo(item, starttime);
    }
    if (!durations.length) return starttime;
    let measuredur = durations[0];
    let allequal = true;
    for (let i = 1; i < durations.length; i++) {
      if (!durations[i].equals(measuredur)) { allequal = false; break; }
    }
    if (!allequal && this.m_measureDuration.length) {
      const target = new HumNum(this.m_measureDuration[0]).div(new HumNum(4));
      measuredur = target;
      let maxdur = new HumNum(0);
      let overfilled = false;
      for (let i = 0; i < durations.length; i++) {
        if (durations[i].getFloat() > maxdur.getFloat()) maxdur = durations[i];
        if (durations[i].equals(target)) continue;
        if (durations[i].getFloat() < target.getFloat()) {
          const diff = target.sub(durations[i]);
          const spacer = Convert.durationToRecip(diff) + 'ryy';
          const message = 'Error: measure ' + this.m_currentMeasure + ', staff ' + (i + 1) + ' is underfilled: adding token ' + spacer + ' at end of measure to complete its duration.';
          (this.m_outdata.back() as unknown as { addDataToken(t: string, ts: HumNum, p: number, s: number, v: number, m: number): void })
            .addDataToken(spacer, starttime.add(durations[i]), i, 0, 0, this.m_staffcount);
          (this.m_outdata.back() as unknown as { addGlobalComment(t: string, ts: HumNum): void })
            .addGlobalComment('!!' + message, starttime);
        } else if (durations[i].getFloat() > target.getFloat()) {
          const message = 'Error: measure ' + this.m_currentMeasure + ' staff ' + (i + 1) + ' is overfilled: ' + durations[i].getFloat() + ' quarter notes instead of ' + target.getFloat() * 4 + '.';
          (this.m_outdata.back() as unknown as { addGlobalComment(t: string, ts: HumNum): void })
            .addGlobalComment('!!' + message, starttime);
          overfilled = true;
        }
      }
      if (overfilled) {
        for (let i = 0; i < durations.length; i++) {
          if (durations[i].equals(maxdur)) continue;
          const diff = maxdur.sub(durations[i]);
          const spacer = Convert.durationToRecip(diff) + 'ryy';
          const message = 'Warning: measure ' + this.m_currentMeasure + ', staff ' + (i + 1) + ' padded. adding token ' + spacer + ' at end ot measure to extend its duration.';
          (this.m_outdata.back() as unknown as { addDataToken(t: string, ts: HumNum, p: number, s: number, v: number, m: number): void })
            .addDataToken(spacer, starttime.add(durations[i]), i, 0, 0, this.m_staffcount);
          (this.m_outdata.back() as unknown as { addGlobalComment(t: string, ts: HumNum): void })
            .addGlobalComment('!!' + message, starttime);
        }
        gm.setTimestamp(starttime);
        gm.setDuration(maxdur);
        if (this.m_measureDuration.length) gm.setTimeSigDur(this.m_measureDuration[0]);
        this.applyRightStyle(measure, gm);
        return starttime.add(maxdur);
      }
    }
    gm.setTimestamp(starttime);
    gm.setDuration(measuredur);
    if (this.m_measureDuration.length) gm.setTimeSigDur(this.m_measureDuration[0]);
    this.applyRightStyle(measure, gm);
    return starttime.add(measuredur);
  }

  applyRightStyle(measure: xml_node, gm: GridMeasure & { setFinalBarlineStyle(): void; setRepeatBackwardStyle(): void; setInvisibleBarline(): void }): void {
    const rightstyle = measure.attribute('right').value();
    if (rightstyle === 'end') gm.setFinalBarlineStyle();
    else if (rightstyle === 'rptend') gm.setRepeatBackwardStyle();
    else if (rightstyle === 'invis') gm.setInvisibleBarline();
  }

  parseDynam(dynam: xml_node): void {
    let text = dynam.child_value();
    if (!text) {
      const parts: string[] = [];
      for (const c of this.childrenOf(dynam)) {
        if (c.name() === 'rend') parts.push(c.child_value());
      }
      text = parts.join(' ');
    }
    if (!text) return;
    const startid = dynam.attribute('startid').value();
    const staffnum = Number.parseInt(dynam.attribute('staff').value() || '0', 10);
    if (staffnum <= 0) return;
    const meterunit = this.m_currentMeterUnit[staffnum - 1] || 4;
    if (startid) return;
    const ts = dynam.attribute('tstamp').value();
    if (!ts) return;
    const tsd = (Number.parseFloat(ts) - 1) * 4.0 / meterunit;
    const gm = this.m_outdata.back() as unknown as GridMeasure;
    const slices = gm.getSlices() as unknown as GridSlice[];
    const tsm = (gm.getTimestamp() as HumNum).getFloat();
    let nextgs: GridSlice | null = null;
    for (const gs of slices) {
      if (!gs.isDataSlice()) continue;
      const difference = (gs.getTimestamp().getFloat() - tsm) - tsd;
      if (difference < 0.001) { nextgs = gs; break; }
      if (!(Math.abs(difference) < 0.001)) continue;
      gs.at(staffnum - 1)?.setDynamics(text);
      this.m_outdata.setDynamicsPresent(staffnum - 1);
      return;
    }
    if (nextgs) {
      nextgs.at(staffnum - 1)?.setDynamics(text);
      this.m_outdata.setDynamicsPresent(staffnum - 1);
    }
  }

  parseDir(dir: xml_node, _starttime: HumNum): void {
    const children = this.childrenOf(dir);
    let font = 'i';
    let placement = '';
    if (dir.attribute('place').value() === 'above') placement = 'a:';
    let text = '';
    let count = 0;
    for (const c of children) {
      if (c.name() === 'rend') {
        if (count) text += ' ';
        count++;
        text += c.child_value();
        if (c.attribute('fontstyle').value() === 'normal') font = '';
        if (c.attribute('fontweight').value() === 'bold') font += 'B';
      } else if (!c.name()) {
        if (count) text += ' ';
        count++;
        text += c.value();
      }
    }
    if (!text) return;
    let message = '!LO:TX:' + placement;
    if (font) message += font + ':';
    message += 't=' + Tool_mei2hum.cleanDirText(text);
    const ts = dir.attribute('tstamp').value();
    if (!ts) return;
    const staffnum = Number.parseInt(dir.attribute('staff').value() || '0', 10);
    if (staffnum <= 0) return;
    const meterunit = this.m_currentMeterUnit[staffnum - 1] || 4;
    const tsd = (Number.parseFloat(ts) - 1) * 4.0 / meterunit;
    const gm = this.m_outdata.back() as unknown as GridMeasure;
    const slices = gm.getSlices() as unknown as GridSlice[];
    const gmts = (gm.getTimestamp() as HumNum).getFloat();
    for (let i = 0; i < slices.length; i++) {
      const gs = slices[i];
      if (!gs.isDataSlice()) continue;
      const difference = (gs.getTimestamp().getFloat() - gmts) - tsd;
      if (!(Math.abs(difference) < 0.0001)) continue;
      if (i > 0) {
        const prev = slices[i - 1];
        if (prev.isLayoutSlice()) {
          const voice = prev.at(staffnum - 1)?.at(0)?.[0];
          const tok = voice?.getToken?.() as unknown as { value?: string; isNull?(): boolean; setText?(t: string): void } | null;
          if (voice && !tok) { voice.setToken(message); break; }
          else if (tok && tok.isNull?.()) { tok.setText?.(message); break; }
        }
      }
      const ngs = new GridSlice(gm as never, gs.getTimestamp(), SliceType.Layouts, this.m_maxStaffInFile) as unknown as GridSliceLike;
      (ngs as unknown as GridSlice).addToken(message, staffnum - 1, 0, 0);
      gm.insertAt(i, ngs);
      break;
    }
  }

  parseStaff(staff: xml_node, starttime: HumNum): HumNum {
    const n = staff.attribute('n').value();
    this.m_currentStaff = n ? Number.parseInt(n, 10) : this.m_currentStaff + 1;
    if (this.m_maxStaffInFile < this.m_currentStaff) this.m_maxStaffInFile = this.m_currentStaff;
    const layerPresent: boolean[] = [];
    const durations: HumNum[] = [];
    for (const item of this.childrenOf(staff)) {
      if (item.name() === 'layer') durations.push(this.parseLayer(item, starttime, layerPresent).sub(starttime));
    }
    if (!durations.length) return starttime;
    const staffdur = durations[0];
    this.m_currentStaff = 0;
    return starttime.add(staffdur);
  }

  parseLayer(layer: xml_node, starttime: HumNum, layerPresent: boolean[]): HumNum {
    const nattr = layer.attribute('n');
    let nnum = 0;
    if (nattr.empty()) nnum = ++this.m_currentLayer;
    else nnum = Number.parseInt(nattr.value(), 10);
    if (nnum < 1 || nnum > 8) return starttime;
    this.m_currentLayer = nnum;
    while (layerPresent.length < this.m_currentLayer) layerPresent.push(false);
    if (layerPresent[this.m_currentLayer - 1]) return starttime;
    layerPresent[this.m_currentLayer - 1] = true;
    for (const item of this.childrenOf(layer)) {
      const n = item.name();
      if (n === 'note') starttime = this.parseNote(item, new xml_node(), [], starttime, 0);
      else if (n === 'chord') starttime = this.parseChord(item, starttime, 0);
      else if (n === 'rest' || n === 'space') starttime = this.parseRest(item, starttime);
      else if (n === 'mRest') starttime = this.parseMRest(item, starttime);
      else if (n === 'beam') starttime = this.parseBeam(item, starttime);
      else if (n === 'tuplet') starttime = this.parseTuplet(item, starttime);
      else if (n === 'clef') this.parseClef(item, starttime);
    }
    if (this.m_gracenotes.length) this.processGraceNotes(starttime);
    this.m_currentLayer = 0;
    return starttime;
  }

  private m_hairpins: { hairpin: xml_node; gm: unknown; mindex: number }[] = [];

  parseClef(clef: xml_node, starttime: HumNum): void {
    const tok = Tool_mei2hum.makeHumdrumClef(
      clef.attribute('shape').value(), clef.attribute('line').value(),
      clef.attribute('clef.dis').value(), clef.attribute('clef.dis.place').value());
    (this.m_outdata.back() as unknown as { addClefToken(t: string, ts: HumNum, p: number, s: number, v: number, m: number): void })
      .addClefToken(tok, starttime, this.m_currentStaff - 1, 0, 0, this.m_staffcount);
  }

  parseBeam(beam: xml_node, starttime: HumNum): HumNum {
    const children = this.childrenOf(beam);
    let isvalid = true;
    for (const c of children) {
      if (c.name() !== 'note') continue;
      if (c.attribute('grace').value()) continue;
      const dur = c.attribute('dur').value();
      if (!dur || !/\d/.test(dur[0])) { isvalid = false; break; }
      if (Number.parseInt(dur, 10) <= 4) { isvalid = false; break; }
    }
    if (isvalid) this.m_beamPrefix = 'L';
    let last: xml_node | null = null;
    for (let i = children.length - 1; i >= 0; i--) {
      const n = children[i].name();
      if (n === 'note' || n === 'rest' || n === 'chord' || n === 'tuplet') { last = children[i]; break; }
    }
    for (const c of children) {
      if (last && c === last && isvalid) this.m_beamPostfix = 'J';
      const n = c.name();
      if (n === 'note') starttime = this.parseNote(c, new xml_node(), [], starttime, 0);
      else if (n === 'rest') starttime = this.parseRest(c, starttime);
      else if (n === 'chord') starttime = this.parseChord(c, starttime, 0);
      else if (n === 'tuplet') starttime = this.parseTuplet(c, starttime);
    }
    return starttime;
  }

  parseHairpin(hairpin: xml_node): void {
    const last = this.m_outdata.at(this.m_outdata.size() - 1);
    if (last) this.m_hairpins.push({ hairpin, gm: last, mindex: this.m_currentMeterUnit.length - 1 });
  }

  processHairpins(): void {
    for (const info of this.m_hairpins) this.processHairpin(info);
  }

  processHairpin(info: { hairpin: xml_node; gm: unknown; mindex: number }): void {
    const hairpin = info.hairpin;
    let gm = info.gm as unknown as GridMeasure;
    let mindex = info.mindex;
    const tstamp = hairpin.attribute('tstamp').value();
    let tstamp2 = hairpin.attribute('tstamp2').value();
    const form = hairpin.attribute('form').value();
    const staff = hairpin.attribute('staff').value();
    if (!staff) return;
    const staffnum = Number.parseInt(staff, 10);
    let hairopen = '<';
    let hairclose = '[';
    if (form === 'dim') { hairopen = '>'; hairclose = ']'; }
    const starttime = Number.parseFloat(tstamp) - 1.0;
    let measure = 0;
    const loc = tstamp2.indexOf('m+');
    if (loc >= 0) {
      measure = Number.parseFloat(tstamp2.slice(0, loc));
      tstamp2 = tstamp2.slice(loc + 2);
    }
    const endtime = Number.parseFloat(tstamp2) - 1;
    const outdata = this.m_outdata as unknown as { size(): number; at(i: number): unknown };
    let gidx = -1;
    for (let i = 0; i < outdata.size(); i++) { if (outdata.at(i) === gm) { gidx = i; break; } }
    if (gidx < 0) return;
    const measurestart = (gm.getTimestamp() as HumNum).getFloat();
    const findSlice = (target: number): GridSlice | null => {
      const slices = gm.getSlices() as unknown as GridSlice[];
      let lastgs: GridSlice | null = null;
      for (const gs of slices) {
        if (!gs.isDataSlice()) continue;
        const mt = (gs.getTimestamp().getFloat() - measurestart) * 4 / (this.m_currentMeterUnit[mindex] || 4);
        const diff = target - mt;
        if (diff < 0.001) { lastgs = gs; break; }
        else if (diff < 0) { lastgs = gs; break; }
        lastgs = gs;
      }
      return lastgs;
    };
    const start = findSlice(starttime);
    if (start) {
      start.at(staffnum - 1)?.setDynamics(hairopen);
      this.m_outdata.setDynamicsPresent(staffnum - 1);
    }
    gidx += measure;
    mindex += measure;
    gm = outdata.at(gidx) as unknown as GridMeasure;
    if (!gm) return;
    const end = findSlice(endtime);
    if (end) {
      end.at(staffnum - 1)?.setDynamics(hairclose);
      this.m_outdata.setDynamicsPresent(staffnum - 1);
    }
  }

  parseTempo(tempo: xml_node, starttime: HumNum): void {
    let found = false;
    let value = 0;
    const bpm = tempo.attribute('bpm').value();
    if (bpm) { value = Number.parseFloat(bpm); if (value > 0) found = true; }
    if (!found) {
      const mspb = tempo.attribute('mspb').value();
      if (mspb) { value = Number.parseFloat(mspb) * 60.0 / 1000000.0; if (value > 0) found = true; }
    }
    if (!found) {
      const mm = tempo.attribute('mm').value();
      if (mm) {
        let recip = tempo.attribute('mm.unit').value();
        const dcount = Number.parseInt(tempo.attribute('mm.dots').value() || '0', 10) || 0;
        for (let i = 0; i < dcount; i++) recip += '.';
        value = Number.parseFloat(mm) * Convert.recipToDuration(recip).getFloat();
        if (value > 0) found = true;
      }
    }
    if (!found) {
      let text = '';
      for (const c of this.childrenOf(tempo)) {
        text += (c.name() ? c.child_value() : c.value()) + ' ';
      }
      const m = text.match(/\s*=\s*(\d+\.?\d*)/);
      if (m) { value = Number.parseFloat(m[1]); found = true; }
    }
    if (!found) return;
    const gm = this.m_outdata.back() as unknown as GridMeasure;
    const gs = new GridSlice(gm as never, starttime, SliceType.Tempos, this.m_maxStaffInFile) as unknown as GridSlice;
    const stok = '*MM' + value;
    for (let i = 0; i < this.m_maxStaffInFile; i++) gs.addToken(stok, i, 0, 0);
    const slices = gm.getSlices() as unknown as GridSlice[];
    for (let i = 0; i < slices.length; i++) {
      const it = slices[i];
      if (it.getTimestamp().getFloat() > starttime.getFloat()) { gm.insertAt(i, gs as never); return; }
      else if (it.isTimeSigSlice()) { gm.insertAt(i + 1, gs as never); return; }
      else if (it.getTimestamp().equals(starttime) && (it.isNoteSlice() || it.isGraceSlice())) { gm.insertAt(i, gs as never); return; }
    }
    (gm as unknown as { push_back(s: unknown): void }).push_back(gs as never);
  }

  parseTuplet(tuplet: xml_node, starttime: HumNum): HumNum {
    const children = this.childrenOf(tuplet);
    const num = tuplet.attribute('num').value();
    const numbase = tuplet.attribute('numbase').value();
    let newfactor = new HumNum(1);
    if (numbase) newfactor = new HumNum(Number.parseInt(numbase, 10));
    if (num) newfactor = newfactor.div(new HumNum(Number.parseInt(num, 10)));
    this.m_tupletfactor = this.m_tupletfactor.mul(newfactor);
    const stored = this.m_beamPostfix;
    if (stored) this.m_beamPostfix = '';
    let last: xml_node | null = null;
    for (let i = children.length - 1; i >= 0; i--) {
      const n = children[i].name();
      if (n === 'note' || n === 'rest' || n === 'chord') { last = children[i]; break; }
    }
    for (const c of children) {
      if (last && c === last) this.m_beamPostfix = stored;
      const n = c.name();
      if (n === 'note') starttime = this.parseNote(c, new xml_node(), [], starttime, 0);
      else if (n === 'rest') starttime = this.parseRest(c, starttime);
      else if (n === 'chord') starttime = this.parseChord(c, starttime, 0);
      else if (n === 'beam') starttime = this.parseBeam(c, starttime);
    }
    this.m_tupletfactor = this.m_tupletfactor.div(newfactor);
    return starttime;
  }

  processGraceNotes(timestamp: HumNum): void {
    void timestamp;
    const size = this.m_gracenotes.length;
    let counter = 1;
    for (let i = size - 1; i >= 0; i--) {
      const g = this.m_gracenotes[i];
      this.m_beamPrefix = g.beamprefix;
      this.m_beamPostfix = g.beampostfix;
      if (g.node.name() === 'note') this.parseNote(g.node, g.chord, [], this.m_gracetime, counter);
      else if (g.node.name() === 'chord') this.parseChord(g.node, this.m_gracetime, counter);
      counter++;
    }
    this.m_gracenotes.length = 0;
  }

  getDuration(element: xml_node): HumNum {
    let durAttr = element.attribute('dur');
    let name = element.name();
    if (durAttr.empty() && name === 'note') return new HumNum(0);
    if (durAttr.empty() && name === 'chord') {
      const first = this.findDescendant(element, 'note');
      if (first.empty()) return new HumNum(0);
      durAttr = first.attribute('dur');
      if (durAttr.empty()) return new HumNum(0);
    }
    const dur = durAttr.value();
    if (!dur) return new HumNum(0);
    let output = new HumNum(0);
    if (dur === 'breve') output = new HumNum(2);
    else if (dur === 'long') output = new HumNum(4);
    else if (dur === 'maxima') output = new HumNum(8);
    else if (/\d/.test(dur[0])) output = new HumNum(1).div(new HumNum(Number.parseInt(dur, 10)));
    else return new HumNum(0);
    const dots = element.attribute('dots').value();
    const dotcount = dots && /\d/.test(dots[0]) ? Number.parseInt(dots, 10) : 0;
    if (dotcount > 0) {
      const top = (1 << (dotcount + 1)) - 1, bot = 1 << dotcount;
      output = output.mul(new HumNum(top, bot));
    }
    if (!this.m_tupletfactor.equals(new HumNum(1))) output = output.mul(this.m_tupletfactor);
    return output;
  }

  getDotCount(node: xml_node): number {
    let n = node;
    if (n.name() === 'chord' && n.attribute('dur').empty()) n = this.findDescendant(n, 'note');
    if (n.empty()) return 0;
    const dots = n.attribute('dots').value();
    return dots ? Number.parseInt(dots, 10) : 0;
  }

  getHumdrumRecip(duration: HumNum, dotcount: number): string {
    let d = new HumNum(duration);
    if (dotcount > 0) {
      const top = (1 << (dotcount + 1)) - 1, bot = 1 << dotcount;
      d = d.mul(new HumNum(bot, top));
    }
    let output: string;
    if (d.getNumerator() === 1) output = String(d.getDenominator());
    else if (d.getNumerator() === 2 && d.getDenominator() === 1) output = '0';
    else if (d.getNumerator() === 4 && d.getDenominator() === 1) output = '00';
    else if (d.getNumerator() === 8 && d.getDenominator() === 1) output = '000';
    else output = d.getDenominator() + '%' + d.getNumerator();
    for (let i = 0; i < dotcount; i++) output += '.';
    return output;
  }

  static accidToKern(accid: string): string {
    if (accid === 'n') return 'n';
    if (accid === 's' || accid === 'su' || accid === 'sd' || accid === 'ns') return '#';
    if (accid === 'f' || accid === 'fu' || accid === 'fd' || accid === 'nf') return '-';
    if (accid === 'ff') return '--';
    if (accid === 'ss' || accid === 'x') return '##';
    if (accid === 'xs' || accid === 'sx' || accid === 'ts') return '###';
    if (accid === 'tf') return '---';
    return '';
  }

  getEditorialAccidental(children: xml_node[]): string {
    for (const c of children) {
      if (c.name() !== 'accid') continue;
      if (c.attribute('func').value() !== 'edit') continue;
      const accid = c.attribute('accid').value();
      if (!accid) continue;
      const out = Tool_mei2hum.accidToKern(accid);
      if (out) { this.m_editorialAccidentalQ = true; return out + 'i'; }
      break;
    }
    return '';
  }

  getCautionaryAccidental(children: xml_node[]): string {
    for (const c of children) {
      if (c.name() !== 'accid') continue;
      if (c.attribute('func').value() !== 'caution') continue;
      const accid = c.attribute('accid').value();
      if (!accid) continue;
      const out = Tool_mei2hum.accidToKern(accid);
      if (out && out !== 'n') return out + 'X';
      break;
    }
    return '';
  }

  getHumdrumPitch(note: xml_node, children: xml_node[]): string {
    const pname = note.attribute('pname').value();
    const accidvis = note.attribute('accid').value();
    const accidges = note.attribute('accid.ges').value();
    let accidvischild = '', accidgeschild = '';
    for (const c of children) {
      if (c.name() !== 'accid') continue;
      const func = c.attribute('func').value();
      if (func === 'caution' || func === 'edit') continue;
      if (!accidvischild) accidvischild = c.attribute('accid').value();
      if (!accidgeschild) accidgeschild = c.attribute('accid.ges').value();
    }
    let octnum = 4;
    const oct = note.attribute('oct').value();
    if (oct && /\d/.test(oct[0])) octnum = Number.parseInt(oct, 10);
    if (!pname) return 'x';
    let output = '';
    if (octnum < 4) output = pname[0].toUpperCase().repeat(4 - octnum);
    else output = pname[0].repeat(octnum - 3);
    const pushAcc = (a: string, invisible: boolean): void => {
      if (!a) return;
      const acc = Tool_mei2hum.accidToKern(a);
      if (!acc) return;
      if (acc === 'n' && invisible) return;
      output += acc;
      if (invisible) output += 'y';
    };
    if (accidges) pushAcc(accidges, true);
    else if (accidvis) pushAcc(accidvis, false);
    else if (accidvischild) pushAcc(accidvischild, false);
    else if (accidgeschild) pushAcc(accidgeschild, true);
    if (this.m_currentStaff) {
      const base40 = 0;
      if (base40) output = Convert.base40ToKern(Convert.kernToBase40(output) + base40);
    }
    return output;
  }

  parseNote(note: xml_node, chord: xml_node, output: string[], starttime: HumNum, gracenumber = 0): HumNum {
    const children = this.childrenOf(note);
    const grace = note.attribute('grace').value();
    const graceQ = !!grace;
    if (gracenumber === 0 && graceQ) {
      if (!this.m_gracenotes.length) this.m_gracetime = starttime;
      this.m_gracenotes.push({
        node: chord.empty() ? note : chord, chord: chord.empty() ? new xml_node() : note,
        beamprefix: this.m_beamPrefix, beampostfix: this.m_beamPostfix,
      });
      this.m_beamPrefix = '';
      this.m_beamPostfix = '';
      return starttime;
    }
    this.processPreliminaryLinkedNodes(note);
    const duration = chord.empty() ? this.getDuration(note) : this.getDuration(chord);
    const dotcount = chord.empty() ? this.getDotCount(note) : this.getDotCount(chord);
    const recip = this.getHumdrumRecip(duration, dotcount);
    const humpitch = this.getHumdrumPitch(note, children);
    const editorial = this.getEditorialAccidental(children);
    const cautionary = this.getCautionaryAccidental(children);
    const articulations = this.getNoteArticulations(note, chord);
    let stemdir = '';
    if (this.m_stemsQ) {
      const sd = note.attribute('stem.dir').value();
      if (sd === 'up') stemdir = '/';
      else if (sd === 'down') stemdir = '\\';
    }
    const gracelabel = graceQ ? 'q' : '';
    const box: string[] = [recip + gracelabel + humpitch + editorial + cautionary + articulations + stemdir + this.m_beamPrefix + this.m_beamPostfix];
    this.m_beamPrefix = '';
    this.m_beamPostfix = '';
    this.m_fermata = false;
    this.processLinkedNodes(box, note);
    if (!this.m_fermata) box.push(this.fermataSuffix(note));
    const tok = box.join('');
    let dataslice: GridSliceLike | null = null;
    const gm = this.m_outdata.back() as unknown as GridMeasure & { addDataToken(t: string, ts: HumNum, p: number, s: number, v: number, m: number): GridSliceLike; addGraceToken?: (t: string, ts: HumNum, p: number, s: number, v: number, m: number, n: number) => GridSliceLike };
    if (chord.empty()) {
      if (gracenumber === 0) dataslice = gm.addDataToken(tok, starttime, this.m_currentStaff - 1, 0, this.m_currentLayer - 1, this.m_staffcount);
      else if (gm.addGraceToken) dataslice = gm.addGraceToken(tok, starttime, this.m_currentStaff - 1, 0, this.m_currentLayer - 1, this.m_staffcount, gracenumber);
      else dataslice = gm.addDataToken(tok, starttime, this.m_currentStaff - 1, 0, this.m_currentLayer - 1, this.m_staffcount);
    } else {
      output.push(tok);
    }
    if (this.m_xmlidQ() && dataslice && chord.empty()) {
      const xmlid = note.attribute('xml:id').value();
      if (xmlid) {
        const staff = (dataslice as unknown as GridSlice).at(this.m_currentStaff - 1)?.at(0);
        staff?.setXmlid?.(xmlid);
        if (!this.m_hasXmlids[this.m_currentStaff - 1]) this.m_hasXmlids[this.m_currentStaff - 1] = true;
      }
    }
    let hasverse = false;
    for (const c of children) {
      const n = c.name();
      if ((n === 'verse' || n === 'syl') && dataslice) {
        hasverse = true;
        this.parseVerseOrSyl(c, dataslice);
      }
    }
    if (!hasverse && dataslice) {
      const attsyl = note.attribute('syl').value();
      if (attsyl) this.parseSylAttribute(attsyl, dataslice);
    }
    if (!graceQ && this.m_gracenotes.length) this.processGraceNotes(starttime);
    if (graceQ) return starttime;
    return starttime.add(duration);
  }

  m_xmlidQ(): boolean { return true; }

  applyFermata(tok: string): string { return tok; }

  fermataSuffix(node: xml_node): string {
    const fermata = node.attribute('fermata').value();
    if (!fermata) return '';
    if (fermata === 'above') return ';';
    if (fermata === 'below') { this.m_belowQ = true; return ';<'; }
    return '';
  }

  processFermataAttribute(tok: string, node: xml_node): string {
    const fermata = node.attribute('fermata').value();
    if (!fermata) return tok;
    if (fermata === 'above') return tok + ';';
    if (fermata === 'below') { this.m_belowQ = true; return tok + ';<'; }
    return tok;
  }

  setPlacement(placement: string): string {
    if (!this.m_placeQ) return '';
    if (placement === 'above') { this.m_aboveQ = true; return '>'; }
    if (placement === 'below') { this.m_belowQ = true; return '<'; }
    return '';
  }

  getNoteArticulations(note: xml_node, chord: xml_node): string {
    const attrArtic = note.attribute('artic').value();
    const elArtic = this.childrenOf(note).filter((c) => c.name() === 'artic');
    const chordAttr = chord.empty() ? '' : chord.attribute('artic').value();
    const chordEl = chord.empty() ? [] : this.childrenOf(chord).filter((c) => c.name() === 'artic');
    let out = '';
    out += this.getHumdrumArticulation('\\bstacc\\b', "'", attrArtic, elArtic, chordAttr, chordEl);
    out += this.getHumdrumArticulation('\\bacc\\b', '^', attrArtic, elArtic, chordAttr, chordEl);
    out += this.getHumdrumArticulation('\\bmarc\\b', '^^', attrArtic, elArtic, chordAttr, chordEl);
    out += this.getHumdrumArticulation('\\bstacciss\\b', '`', attrArtic, elArtic, chordAttr, chordEl);
    out += this.getHumdrumArticulation('\\bten\\b', '~', attrArtic, elArtic, chordAttr, chordEl);
    return out;
  }

  getHumdrumArticulation(tag: string, humdrum: string, attrArtic: string, elArtic: xml_node[], chordAttr: string, chordEl: xml_node[]): string {
    const re = new RegExp(tag);
    if (re.test(attrArtic)) return humdrum;
    if (re.test(chordAttr)) return humdrum;
    for (const e of elArtic) {
      if (re.test(e.attribute('artic').value())) return humdrum + this.setPlacement(e.attribute('place').value());
    }
    for (const e of chordEl) {
      if (re.test(e.attribute('artic').value())) return humdrum + this.setPlacement(e.attribute('place').value());
    }
    return '';
  }

  parseVerseOrSyl(node: xml_node, dataslice: GridSliceLike): void {
    const staff = (dataslice as unknown as GridSlice).at(this.m_currentStaff - 1)?.at(0);
    if (!staff) return;
    if (node.name() === 'verse') {
      const n = Number.parseInt(node.attribute('n').value() || '1', 10);
      const parts: string[] = [];
      for (const c of this.childrenOf(node)) {
        if (c.name() === 'syl') {
          const t = this.parseSylText(c);
          if (t) parts.push(t);
        }
      }
      if (parts.length) {
        staff.setVerse(n - 1, parts.join(' '));
        while (this.m_maxverse.length <= this.m_currentStaff - 1) this.m_maxverse.push(0);
        if (this.m_maxverse[this.m_currentStaff - 1] < n) this.m_maxverse[this.m_currentStaff - 1] = n;
      }
    } else {
      const t = this.parseSylText(node);
      if (!t) return;
      staff.setVerse(0, t);
      while (this.m_maxverse.length <= this.m_currentStaff - 1) this.m_maxverse.push(0);
      if (this.m_maxverse[this.m_currentStaff - 1] < 1) this.m_maxverse[this.m_currentStaff - 1] = 1;
    }
  }

  parseSylText(syl: xml_node): string {
    let text = syl.child_value().replace(/_/g, ' ');
    const wordpos = syl.attribute('wordpos').value();
    if (wordpos === 'i') text = text + '-';
    else if (wordpos === 'm') text = '-' + text + '-';
    else if (wordpos === 't') text = '-' + text;
    return text;
  }

  parseSylAttribute(attsyl: string, dataslice: GridSliceLike): void {
    const staff = (dataslice as unknown as GridSlice).at(this.m_currentStaff - 1)?.at(0);
    if (!staff) return;
    const pieces: string[] = [''];
    if (attsyl.length === 1) pieces[0] = attsyl;
    else {
      for (let i = 0; i < attsyl.length - 2; i++) {
        if (attsyl[i] === '/' && attsyl[i + 1] === '/') { pieces.push(''); i++; }
        else pieces[pieces.length - 1] += attsyl[i];
      }
      if (attsyl[attsyl.length - 1] !== '/' && attsyl[attsyl.length - 2] !== '/') {
        pieces[pieces.length - 1] += attsyl[attsyl.length - 2] + attsyl[attsyl.length - 1];
      }
    }
    if (pieces.length === 1 && !pieces[0]) return;
    for (let i = 0; i < pieces.length; i++) {
      const t = pieces[i].replace(/[\t\n]/g, ' ').replace(/^ +/, '').replace(/ +$/, '');
      if (!t) continue;
      staff.setVerse(i, t);
      while (this.m_maxverse.length <= this.m_currentStaff - 1) this.m_maxverse.push(0);
      if (this.m_maxverse[this.m_currentStaff - 1] < i + 1) this.m_maxverse[this.m_currentStaff - 1] = i + 1;
    }
  }

  buildIdLinkMap(doc: xml_document): void {
    this.m_startlinks.clear();
    this.m_stoplinks.clear();
    const walk = (node: xml_node): void => {
      const s = node.attribute('startid').value();
      if (s) {
        const v = s.startsWith('#') ? s.slice(1) : s;
        if (v) {
          if (!this.m_startlinks.has(v)) this.m_startlinks.set(v, []);
          this.m_startlinks.get(v)!.push(node);
        }
      }
      const e = node.attribute('endid').value();
      if (e) {
        const v = e.startsWith('#') ? e.slice(1) : e;
        if (v) {
          if (!this.m_stoplinks.has(v)) this.m_stoplinks.set(v, []);
          this.m_stoplinks.get(v)!.push(node);
        }
      }
      for (const c of this.childrenOf(node)) walk(c);
    };
    walk(doc);
  }

  processPreliminaryLinkedNodes(node: xml_node): void {
    const id = node.attribute('xml:id').value();
    if (!id) return;
    const found = this.m_startlinks.get(id);
    if (found) {
      for (const link of found) {
        if (link.name() === 'tupletSpan') this.parseTupletSpanStart(link);
      }
    }
  }

  parseTupletSpanStart(tupletSpan: xml_node): void {
    if (!tupletSpan.attribute('endid').value() || !tupletSpan.attribute('startid').value()) return;
    this.m_tupletfactor = this.m_tupletfactor.mul(this.tupletSpanFactor(tupletSpan));
  }

  parseTupletSpanStop(tupletSpan: xml_node): void {
    if (!tupletSpan.attribute('endid').value() || !tupletSpan.attribute('startid').value()) return;
    this.m_tupletfactor = this.m_tupletfactor.div(this.tupletSpanFactor(tupletSpan));
  }

  tupletSpanFactor(tupletSpan: xml_node): HumNum {
    const num = tupletSpan.attribute('num').value();
    const numbase = tupletSpan.attribute('numbase').value();
    let f = new HumNum(1);
    if (numbase) f = new HumNum(Number.parseInt(numbase, 10));
    if (num) f = f.div(new HumNum(Number.parseInt(num, 10)));
    return f;
  }

  processLinkedNodes(output: string[], node: xml_node): void {
    const id = node.attribute('xml:id').value();
    if (!id) return;
    const found = this.m_startlinks.get(id);
    if (found) {
      for (const link of found) {
        const n = link.name();
        if (n === 'fermata') { this.m_fermata = true; output.push(';'); }
        else if (n === 'slur') output.unshift('(' + this.curvedirPlacement(link));
        else if (n === 'tie') { const t = this.parseTieStart(node, link); if (t) output.unshift(t); }
        else if (n === 'trill') this.parseTrillInto(output);
        else if (n === 'arpeg') this.parseArpegInto(output, node);
      }
    }
    const found2 = this.m_stoplinks.get(id);
    if (found2) {
      for (const link of found2) {
        const n = link.name();
        if (n === 'slur') output.push(')');
        else if (n === 'tie') output.push(this.parseTieStop(node, link));
        else if (n === 'tupletSpan') this.parseTupletSpanStop(link);
      }
    }
  }

  curvedirPlacement(slur: xml_node): string {
    const cd = slur.attribute('curvedir').value();
    if (cd === 'above') { this.m_aboveQ = true; return '>'; }
    if (cd === 'below') { this.m_belowQ = true; return '<'; }
    return '';
  }

  parseTieStart(node: xml_node, tie: xml_node): string {
    const id = node.attribute('xml:id').value();
    if (id) {
      const found = this.m_stoplinks.get(id);
      if (found) {
        for (const item of found) {
          if (tie.attribute('startid').value() === item.attribute('endid').value()) return '';
        }
      }
    }
    return node.name() === 'note' ? '[' : '';
  }

  parseTieStop(node: xml_node, tie: xml_node): string {
    const id = node.attribute('xml:id').value();
    if (id) {
      const found = this.m_startlinks.get(id);
      if (found) {
        for (const item of found) {
          if (tie.attribute('endid').value() === item.attribute('startid').value()) return '_';
        }
      }
    }
    return node.name() === 'note' ? ']' : '';
  }

  parseTrillInto(output: string[]): void {
    const joined = output.join('');
    const semi = joined.indexOf(';');
    if (semi >= 0) { output.splice(0, output.length, joined.slice(0, semi) + 'T' + joined.slice(semi)); return; }
    const paren = joined.indexOf(')');
    if (paren >= 0) { output.splice(0, output.length, joined.slice(0, paren) + 'T' + joined.slice(paren)); return; }
    output.push('T');
  }

  parseArpegInto(output: string[], node: xml_node): void {
    if (node.name() === 'note') output.push(':');
    else if (node.name() === 'chord') {
      const temp = output.join('');
      output.splice(0, output.length);
      let rebuilt = '';
      for (const ch of temp) rebuilt += ch === ' ' ? ': ' : ch;
      output.push(rebuilt + ':');
    }
  }

  parseChord(chord: xml_node, starttime: HumNum, gracenumber = 0): HumNum {
    const children = this.childrenOf(chord);
    this.processPreliminaryLinkedNodes(chord);
    const duration = this.getDuration(chord);
    let tok = '';
    let counter = 0;
    for (const c of children) {
      if (c.name() !== 'note') continue;
      counter++;
      if (counter > 1) tok += ' ';
      const box: string[] = [];
      this.parseNote(c, chord, box, starttime, gracenumber);
      tok += box.join('');
    }
    const box: string[] = [tok];
    this.m_fermata = false;
    this.processLinkedNodes(box, chord);
    if (!this.m_fermata) box.push(this.fermataSuffix(chord));
    tok = box.join('');
    const gm = this.m_outdata.back() as unknown as GridMeasure & { addDataToken(t: string, ts: HumNum, p: number, s: number, v: number, m: number): GridSliceLike };
    gm.addDataToken(tok, starttime, this.m_currentStaff - 1, 0, this.m_currentLayer - 1, this.m_staffcount);
    return starttime.add(duration);
  }

  buildChordNoteToken(note: xml_node, chord: xml_node): string {
    const children = this.childrenOf(note);
    const duration = this.getDuration(chord);
    const dotcount = this.getDotCount(chord);
    const recip = this.getHumdrumRecip(duration, dotcount);
    const humpitch = this.getHumdrumPitch(note, children);
    const editorial = this.getEditorialAccidental(children);
    const cautionary = this.getCautionaryAccidental(children);
    const articulations = this.getNoteArticulations(note, chord);
    let stemdir = '';
    if (this.m_stemsQ) {
      const sd = note.attribute('stem.dir').value();
      if (sd === 'up') stemdir = '/';
      else if (sd === 'down') stemdir = '\\';
    }
    return recip + humpitch + editorial + cautionary + articulations + stemdir + this.m_beamPrefix + this.m_beamPostfix;
  }

  parseRest(rest: xml_node, starttime: HumNum): HumNum {
    this.processPreliminaryLinkedNodes(rest);
    const duration = this.getDuration(rest);
    const dotcount = this.getDotCount(rest);
    const recip = this.getHumdrumRecip(duration, dotcount);
    const invisible = rest.name() === 'space' ? 'yy' : '';
    const box: string[] = [recip + 'r' + invisible + this.m_beamPrefix + this.m_beamPostfix];
    this.m_beamPrefix = '';
    this.m_beamPostfix = '';
    this.processLinkedNodes(box, rest);
    box.push(this.fermataSuffix(rest));
    const output = box.join('');
    (this.m_outdata.back() as unknown as { addDataToken(t: string, ts: HumNum, p: number, s: number, v: number, m: number): GridSliceLike })
      .addDataToken(output, starttime, this.m_currentStaff - 1, 0, this.m_currentLayer - 1, this.m_staffcount);
    return starttime.add(duration);
  }

  parseMRest(_mrest: xml_node, starttime: HumNum): HumNum {
    let duration = this.m_measureDuration[this.m_currentStaff - 1] ?? new HumNum(4);
    duration = new HumNum(duration).div(new HumNum(4));
    let recip = this.getHumdrumRecip(duration, 0);
    if (recip.includes('%')) {
      const r1 = this.getHumdrumRecip(duration, 1);
      if (!r1.includes('%')) recip = r1;
    }
    const tok = recip + 'r';
    (this.m_outdata.back() as unknown as { addDataToken(t: string, ts: HumNum, p: number, s: number, v: number, m: number): GridSliceLike })
      .addDataToken(tok, starttime, this.m_currentStaff - 1, 0, this.m_currentLayer - 1, this.m_staffcount);
    return starttime.add(duration);
  }

  addHeaderRecords(outfile: HumdrumFile, doc: xml_document): void {
    const title = this.findDescendant(doc, 'title').child_value();
    if (this.m_systemDecoration) outfile.insertLine(0, '!!!system-decoration: ' + this.m_systemDecoration);
    if (title) outfile.insertLine(0, '!!!OTL: ' + title);
  }

  addFooterRecords(outfile: HumdrumFile, _doc: xml_document): void {
    if (this.m_aboveQ) outfile.appendLine('!!!RDF**kern: > = above');
    if (this.m_belowQ) outfile.appendLine('!!!RDF**kern: < = below');
    if (this.m_editorialAccidentalQ) outfile.appendLine('!!!RDF**kern: i = editorial accidental');
  }

  // C++ Tool_mei2hum::cleanDirText (humlib.cpp:108730): collapse
  // whitespace runs to single spaces, trim, escape colons.
  static cleanDirText(input: string): string {
    let output = '';
    let foundstart = false;
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (!foundstart && /\s/.test(ch)) continue;
      foundstart = true;
      if (ch === ':') output += '&colon;';
      else if (ch === '\t' || ch === '\n' || ch === ' ') {
        if (output.length && output[output.length - 1] !== ' ') output += ' ';
      }
      else output += ch;
    }
    while (output.endsWith(' ')) output = output.slice(0, -1);
    return output;
  }
}
