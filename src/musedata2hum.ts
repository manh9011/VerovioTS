import { HumNum, HumRegex } from './humlib.js';
import { Convert } from './convert.js';
import { HumGrid } from './humgrid.js';
import { HumdrumFile } from './humlib-core.js';

// C++ Tool_musedata2hum + MuseData/MuseDataSet/MuseRecord (humlib.cpp:40130+,
// 114870+; humlib.h:3048+,3124+): MuseData -> Humdrum string converter.
// Default options: group=score, stems/recip off, omv on.
// Single-part score path covered: part split, analyzeType, analyzeTpq,
// analyzeRhythm (+chord/backspace/figadv), header refs, kern notes/rests,
// clef/key/timesig/tempo, measure numbers/styles, grid transfer.
// ponytail: multi-part groups, figured harmony offsets, lyrics, dynamics,
// print/direction links, ties, cue/grace, staves/TAB/mensural, analyses
// (analyzeLayers/constructTimeSequence/analyzePitch) skipped; add when
// multi-voice MuseData byte parity needed.
const E_NOTE_REG = 'N';
const E_NOTE_CHORD = 'C';
const E_NOTE_CUE = 'c';
const E_NOTE_GRACE = 'g';
const E_PRINT = 'P';
const E_SOUND = 'S';
const E_END = '/';
const E_BACK = 'b';
const E_FIG = 'f';
const E_REST_INV = 'i';
const E_MEASURE = 'm';
const E_REST = 'r';
const E_DIR = '*';
const E_ATTR = '$';
const E_UNKNOWN = 'U';
const E_EMPTY = 'E';

function extract1(line: string, start: number, end: number): string {
  // 1-based inclusive columns; short lines pad with spaces.
  let out = '';
  for (let i = start; i <= end; i++) out += i - 1 < line.length ? line[i - 1] : ' ';
  return out;
}

class MuseRecord {
  line = '';
  type = E_UNKNOWN;
  qstamp: HumNum = new HumNum(0);
  notedur: HumNum = new HumNum(0);
  linedur: HumNum = new HumNum(0);
  layer = 0;
  tpq = 0;
  header = -1;
  getLine(): string { return this.line; }
  getLength(): number { return this.line.length; }
  getType(): string { return this.type; }
  setType(t: string): void { this.type = t; }
  isAnyNote(): boolean { return this.type === E_NOTE_REG || this.type === E_NOTE_CHORD || this.type === E_NOTE_CUE || this.type === E_NOTE_GRACE; }
  isAnyNoteOrRest(): boolean { return this.isAnyNote() || this.type === E_REST || this.type === E_REST_INV; }
  isRegularNote(): boolean { return this.type === E_NOTE_REG; }
  isChordNote(): boolean { return this.type === E_NOTE_CHORD; }
  isCueNote(): boolean { return this.type === E_NOTE_CUE; }
  isGraceNote(): boolean { return this.type === E_NOTE_GRACE; }
  isAnyRest(): boolean { return this.type === E_REST || this.type === E_REST_INV; }
  isInvisibleRest(): boolean { return this.type === E_REST_INV; }
  isAttributes(): boolean { return this.type === E_ATTR; }
  isBarline(): boolean { return this.type === E_MEASURE; }
  isBackspace(): boolean { return this.type === E_BACK; }
  isFiguredHarmony(): boolean { return this.type === E_FIG; }
  isDirection(): boolean { return this.type === E_DIR; }
  isHeaderRecord(): boolean { return this.header > 0; }
  getLayer(): number { return this.layer; }
  setLayer(v: number): void { this.layer = v < 0 ? 0 : v; }
  getQStamp(): HumNum { return this.qstamp; }
  setQStamp(v: HumNum): void { this.qstamp = v; }
  getNoteDuration(): HumNum { return this.notedur; }
  setNoteDuration(v: HumNum): void { this.notedur = v; }
  getLineDuration(): HumNum { return this.linedur; }
  setLineDuration(v: HumNum): void { this.linedur = v; }
  getNoteField(): string {
    return this.type === E_NOTE_REG ? extract1(this.line, 1, 4) : extract1(this.line, 2, 5);
  }
  getPitchString(): string {
    let out = this.getNoteField();
    let len = out.length;
    while (len > 0 && out[len - 1] === ' ') len--;
    return out.slice(0, len);
  }
  getAccidentalString(): string {
    const f = this.getNoteField();
    let n = 0;
    for (let i = 0; i < Math.min(f.length, 16); i++) {
      if (f[i] === 'f') n--;
      else if (f[i] === '#') n++;
    }
    return n === -2 ? 'ff' : n === -1 ? 'f' : n === 1 ? '#' : n === 2 ? '##' : '';
  }
  getNotatedAccidentalField(): string { return extract1(this.line, 19, 19); }
  getTickDurationField(): string {
    if (this.type === E_FIG || this.type === E_NOTE_REG || this.type === E_NOTE_CHORD || this.type === E_REST || this.type === E_BACK) return extract1(this.line, 6, 9);
    return '    ';
  }
  getTickDurationString(): string {
    let out = this.getTickDurationField();
    let len = out.length;
    while (len > 1 && (out[len - 1] === '-' || out[len - 1] === ' ')) len--;
    out = out.slice(0, len);
    let start = 0;
    while (start < out.length && out[start] === ' ') start++;
    return out.slice(start);
  }
  getTickDuration(): number {
    const s = this.getTickDurationString();
    return s ? parseInt(s, 10) : 0;
  }
  getLineTickDuration(): number {
    if (this.type === E_NOTE_CHORD) return 0;
    const s = this.getTickDurationString();
    if (!s) return 0;
    const v = parseInt(s, 10);
    return this.type === E_BACK ? -v : v;
  }
  getNoteTickDuration(): number {
    const s = this.getTickDurationString();
    if (!s) return 0;
    const v = parseInt(s, 10);
    return this.type === E_BACK ? -v : v;
  }
  getTicks(): number { return this.getTickDuration(); }
  getTrack(): number {
    const f = extract1(this.line, 15, 15);
    if (f[0] === ' ') return 0;
    return parseInt(f, 36);
  }
  getGraphicNoteTypeField(): string { return this.line.length < 17 ? ' ' : this.line[16]; }
  getGraphicNoteType(): number {
    const c = this.getGraphicNoteTypeField();
    if (c === ' ') return 0;
    switch (c) {
      case 'M': return -2;
      case 'L': case 'B': return -1;
      case 'b': case 'A': return 0;
      case 'w': case '9': return 1;
      case 'h': case '8': return 2;
      case 'q': case '7': return 4;
      case 'e': case '6': return 8;
      case 's': case '5': return 16;
      case 't': case '4': return 32;
      case 'x': case '3': return 64;
      case 'y': case '2': return 128;
      case 'z': case '1': return 256;
      default: return 0;
    }
  }
  getDotCount(): number {
    const f = extract1(this.line, 18, 18);
    if (f[0] === ' ') return 0;
    const v = parseInt(f, 10);
    return Number.isNaN(v) ? 0 : v;
  }
  getStringProlongation(): string { return '.'.repeat(this.getDotCount()); }
  getKernNoteStyle(): string {
    if (!this.isAnyNote()) return '';
    const notetype = this.getGraphicNoteType();
    let output = String(notetype) + this.getStringProlongation();
    output += Convert.musePitchToKernPitch(this.getPitchString());
    const logicalAccidental = this.getAccidentalString();
    const notated = this.getNotatedAccidentalField();
    if (notated === ' ' && logicalAccidental) output += 'y';
    else if (logicalAccidental && 'n#'.includes(notated) === false) {
      // C++: logical==notated adds X; single-char mismatch handled via field compare.
      if ((logicalAccidental === '#' && notated === '#') || (logicalAccidental === 'f' && notated === 'f')) output += 'X';
    }
    if (notated === 'n') output += 'n';
    return output;
  }
  getKernRestStyle(): string {
    if (!this.isAnyRest()) return '';
    const logical = new HumNum(this.getTicks(), this.tpq || 1);
    let output = Convert.durationToRecip(logical) + 'r';
    if (this.isInvisibleRest()) output += 'yy';
    return output;
  }
  getKernMeasure(): string { return '='; }
  getMeasureFlags(): string { return this.line.length <= 16 ? '' : this.line.slice(16); }
  getAttributeMap(): Record<string, string> {
    const amap: Record<string, string> = {};
    const contents = this.line.slice(2);
    if (!contents) return amap;
    let i = 0, key = '', value = '', state = 0;
    while (i < contents.length) {
      const c = contents[i];
      if (state === 0) {
        if (c !== ' ' && c !== '\t') {
          if (c === ':') { key = ''; state = 2; }
          else { state = 1; key += c; }
        }
      } else if (state === 1) {
        if (c !== ' ' && c !== '\t') {
          if (c === ':') { value = ''; state = 2; }
          else key += c;
        }
      } else {
        if (key === 'D') value += c;
        else if (c === ' ' || c === '\t') { amap[key] = value; state = 0; key = ''; value = ''; }
        else value += c;
      }
      i++;
    }
    if (key && value) amap[key] = value;
    return amap;
  }
}

function cleanMuseString(input: string): string {
  return input.replace(/^\s+/, '').replace(/\s+$/, '');
}

class MuseData {
  records: MuseRecord[] = [];
  append(line: string): void {
    const r = new MuseRecord();
    r.line = line;
    r.setQStamp(new HumNum(0));
    this.records.push(r);
  }
  getLineCount(): number { return this.records.length; }
  getRecord(i: number): MuseRecord { return this.records[i]; }
  getLine(i: number): string { return this.records[i].line; }

  analyzeType(): boolean {
    const hre = new HumRegex();
    let groupmemberships = -1;
    for (let i = 0; i < this.getLineCount(); i++) {
      if (hre.search(this.records[i].line, '^Group memberships:')) { groupmemberships = i; break; }
    }
    if (groupmemberships < 0) return false;
    this.records[groupmemberships].setType('A');
    let commentQ = false;
    let h = 11;
    for (let i = groupmemberships - 1; i >= 0; i--) {
      const r = this.records[i];
      if (r.line.length > 0) {
        if (r.line[0] === '@') { r.setType('@'); continue; }
        if (r.line[0] === '&') { commentQ = !commentQ; if (!commentQ) { r.setType('&'); continue; } }
        if (commentQ) { r.setType('&'); continue; }
      }
      h--;
      r.setType(String(h));
    }
    commentQ = false;
    h = 11;
    let foundattributes = false, foundend = false;
    for (let i = groupmemberships + 1; i < this.getLineCount(); i++) {
      const r = this.records[i];
      if (r.line.length > 0) {
        if (r.line[0] === '@') { r.setType('@'); continue; }
        if (r.line[0] === '&') { commentQ = !commentQ; if (!commentQ) { r.setType('&'); continue; } }
        if (commentQ) { r.setType('&'); continue; }
      }
      h++;
      if (h <= 12) { r.setType(h === 11 ? 'A' : h === 12 ? 'B' : String(h)); continue; }
      if (r.line.length === 0) { r.setType(E_EMPTY); continue; }
      if (r.line[0] !== '$' && !foundattributes) { r.setType('B'); continue; }
      if (foundend && r.line[0] !== '/') { r.setType('T'); continue; }
      switch (r.line[0]) {
        case 'A': case 'B': case 'C': case 'D': case 'E': case 'F': case 'G': r.setType(E_NOTE_REG); break;
        case ' ': r.setType(E_NOTE_CHORD); break;
        case 'c': r.setType(E_NOTE_CUE); break;
        case 'g': r.setType(E_NOTE_GRACE); break;
        case 'P': r.setType(E_PRINT); break;
        case 'S': r.setType(E_SOUND); break;
        case '/': r.setType(E_END); foundend = true; break;
        case 'b': r.setType(E_BACK); break;
        case 'f': r.setType(E_FIG); break;
        case 'i': r.setType(E_REST_INV); break;
        case 'm': r.setType(E_MEASURE); break;
        case 'r': r.setType(E_REST); break;
        case '*': r.setType(E_DIR); break;
        case '$': r.setType(E_ATTR); foundattributes = true; break;
        default: r.setType(E_UNKNOWN); break;
      }
    }
    return true;
  }

  analyzeTpq(): void {
    const hre = new HumRegex();
    let ticks = 0;
    for (const r of this.records) {
      if (!r.isAttributes()) { r.tpq = ticks; continue; }
      if (hre.search(r.line, ' Q:(\\d+)')) ticks = hre.getMatchInt(1);
      r.tpq = ticks;
    }
  }

  analyzeRhythm(): void {
    const hre = new HumRegex();
    let cumulative = new HumNum(0);
    let linedur = new HumNum(0);
    let tpq = 1;
    let figadj = new HumNum(0);
    let primary = new HumNum(0);
    for (const r of this.records) {
      if (r.isAttributes() && hre.search(r.line, 'Q:(\\d+)')) tpq = hre.getMatchInt(1);
      if (r.isChordNote()) {
        r.setQStamp(cumulative.sub(primary));
        if (/\d/.test(r.getTickDurationField())) r.setNoteDuration(new HumNum(r.getNoteTickDuration(), tpq));
        else r.setNoteDuration(primary);
        r.setLineDuration(new HumNum(0));
      } else if (r.isFiguredHarmony()) {
        r.setQStamp(cumulative.add(figadj));
        const tick = r.getLineTickDuration();
        if (tick === 0) figadj = new HumNum(0);
        else figadj = figadj.add(new HumNum(tick, tpq));
      } else {
        r.setQStamp(cumulative);
        r.setNoteDuration(new HumNum(r.getNoteTickDuration(), tpq));
        r.setLineDuration(r.getNoteDuration());
        linedur = new HumNum(r.getLineTickDuration(), tpq);
        cumulative = cumulative.add(linedur);
      }
      if (r.isRegularNote()) primary = linedur;
    }
    for (let i = 1; i < this.records.length; i++) {
      const r = this.records[i];
      if (r.type === E_PRINT || r.type === E_SOUND) r.setQStamp(this.records[i - 1].getQStamp());
    }
  }

  assignHeaderBodyState(): void {
    let state = 1, foundend = false;
    for (const r of this.records) {
      if (r.type === '@' || r.type === '&') { r.header = state; continue; }
      if (state === 0) { r.header = 0; continue; }
      if (!foundend && r.type === 'B') { foundend = true; r.header = state; continue; }
      if (foundend && r.type !== 'B') { state = 0; r.header = 0; continue; }
      r.header = state;
    }
  }

  getHeaderLine(pred: (r: MuseRecord) => boolean): string {
    for (const r of this.records) {
      if (pred(r)) return cleanMuseString(r.line);
      if (r.isAnyNote()) break;
    }
    return '';
  }
  getWorkTitle(): string { return this.getHeaderLine((r) => r.type === '7'); }
  getMovementTitle(): string { return this.getHeaderLine((r) => r.type === '8'); }
  getSource(): string { return this.getHeaderLine((r) => r.type === '6'); }
  getEncoder(): string { return this.getHeaderLine((r) => r.type === '4'); }
  getCopyright(): string { return this.getHeaderLine((r) => r.type === '1'); }
  getPartName(): string { return this.getHeaderLine((r) => r.type === '9').replace(/\s+$/, ''); }
  getWorkInfo(): string { return this.getHeaderLine((r) => r.type === '5'); }
  getOpus(): string {
    const hre = new HumRegex();
    return hre.search(this.getWorkInfo(), '^\\s*WK\\s*#\\s*:\\s*(\\d+)') ? hre.getMatch(1) : '';
  }
  getNumber(): string {
    const hre = new HumRegex();
    return hre.search(this.getWorkInfo(), '^\\s*WK\\s*#\\s*:\\s*(\\d+)\\s*[,/]\\s*(\\d+)') ? hre.getMatch(2) : '';
  }
  getEncoderName(): string {
    const hre = new HumRegex();
    const e = this.getEncoder();
    return hre.search(e, '^\\s*(\\d+)/(\\d+)/(\\d+)\\s+(.*)\\s*$') ? hre.getMatch(4) : '';
  }
  getEncoderDate(): string {
    const hre = new HumRegex();
    const e = this.getEncoder();
    if (!hre.search(e, '^\\s*(\\d+)/(\\d+)/(\\d+)\\s+(.*)\\s*$')) return '';
    let [mm, dd, yy] = [hre.getMatch(1), hre.getMatch(2), hre.getMatch(3)];
    if (yy.length === 2) yy = String((parseInt(yy, 10) < 70 ? 2000 : 1900) + parseInt(yy, 10));
    if (mm.length === 1) mm = '0' + mm;
    if (dd.length === 1) dd = '0' + dd;
    return yy + '/' + mm + '/' + dd;
  }
  getFileDuration(): HumNum {
    if (!this.records.length) return new HumNum(0);
    const last = this.records[this.records.length - 1];
    return last.getQStamp().add(last.getLineDuration());
  }
}

function splitParts(input: string): string[][] {
  const datalines = input.split('\n').map((l) => (l.endsWith('\r') ? l.slice(0, -1) : l));
  const types: string[] = new Array(datalines.length).fill(E_UNKNOWN);
  let commentstate = false;
  for (let i = 0; i < datalines.length; i++) {
    if (datalines[i][0] === '&') { types[i] = '&'; commentstate = !commentstate; continue; }
    if (commentstate) types[i] = '@';
  }
  const groups: number[] = [];
  for (let i = 0; i < datalines.length; i++) {
    if (datalines[i].startsWith('Group memberships:') && types[i] !== '@') groups.push(i);
  }
  const starts: number[] = [];
  for (const gi of groups) {
    let found = false, headerline = 11;
    for (let j = gi - 1; j >= 0; j--) {
      if (datalines[j].startsWith('/eof')) { starts.push(j + 1); found = true; break; }
      if (types[j] === '@' || types[j] === '&') continue;
      headerline--;
      if (headerline === 0) {
        while (j >= 0 && datalines[j][0] === '@') j--;
        starts.push(j + 1); found = true; break;
      }
    }
    if (!found) starts.push(0);
  }
  const parts: string[][] = [];
  for (let i = 0; i < starts.length; i++) {
    const stop = i + 1 < starts.length ? starts[i + 1] - 1 : datalines.length - 1;
    parts.push(datalines.slice(starts[i], stop + 1));
  }
  return parts;
}

export class Tool_musedata2hum {
  convert(input: string): { output: string; status: boolean } {
    const hre = new HumRegex();
    const parts = splitParts(input);
    const query = '^score:\\s*part\\s*(\\d+)\\s*of\\s*(\\d+)';
    const kept: string[][] = [];
    for (const p of parts) {
      let gm = false, hit = false;
      for (const l of p) {
        if (/^Group\s+memberships?\s*:/i.test(l)) gm = true;
        if (gm && hre.search(l, query)) { hit = true; break; }
      }
      if (hit) kept.push(p);
    }
    if (!kept.length) return { output: '', status: false };
    const outdata = new HumGrid();
    const grid = outdata as unknown as {
      addMeasureToBack(): {
        setDuration(v: HumNum): void; setTimestamp(v: HumNum): void; setTimeSigDur(v: HumNum): void;
        setMeasureNumber(v: number): void; setStyle(v: number): void;
        addClefToken(t: string, ts: HumNum, p: number, s: number, l: number, m: number): void;
        addKeySigToken(t: string, ts: HumNum, p: number, s: number, l: number, m: number): void;
        addTimeSigToken(t: string, ts: HumNum, p: number, s: number, l: number, m: number): void;
        addDataToken(t: string, ts: HumNum, p: number, s: number, l: number, m: number): void;
      };
    };
    let quarterDiv = 0, timesigdur = new HumNum(0);
    let lastVoiceToken: { value: string } | null = null;
    const md0 = new MuseData();
    for (const l of kept[0]) md0.append(l);
    if (!md0.analyzeType()) return { output: '', status: false };
    md0.analyzeTpq();
    md0.assignHeaderBodyState();
    md0.analyzeRhythm();
    const partName = md0.getPartName();
    if (partName) (outdata as unknown as { setPartName(i: number, n: string): void }).setPartName(0, partName);
    const gm = grid.addMeasureToBack();
    for (let i = 0; i < md0.getLineCount(); i++) {
      const r = md0.getRecord(i);
      const ts = r.getQStamp();
      if (r.isAttributes()) {
        const am = r.getAttributeMap();
        if (am['Q']) quarterDiv = parseInt(am['Q'], 10);
        if (am['C']) {
          const k = Convert.museClefToKernClef(am['C']);
          if (k && k !== '*') gm.addClefToken(k, ts, 0, 0, 0, 1);
        }
        if (am['K']) {
          const k = Convert.museKeySigToKernKeySig(am['K']);
          if (k && k !== '*') gm.addKeySigToken(k, ts, 0, 0, 0, 1);
        }
        if (am['T']) {
          const k = Convert.museTimeSigToKernTimeSig(am['T']);
          if (k) {
            gm.addTimeSigToken(k, ts, 0, 0, 0, 1);
            if (hre.search(k, '(\\d+)/(\\d+)')) {
              const top = hre.getMatchInt(1), bot = hre.getMatchInt(2);
              const vv = new HumNum(1).div(bot).mul(top);
              vv.invert();
              timesigdur = vv.mul(4);
            }
          }
        }
      } else if (r.isRegularNote()) {
        const slice = gm.addDataToken(r.getKernNoteStyle(), ts, 0, 0, 0, 1);
        lastVoiceToken = (slice as unknown as { at(p: number): Array<Array<{ getToken(): { value: string } | null }>> }).at(0)[0][0]?.getToken() ?? null;
      } else if (r.isChordNote()) {
        const tok = r.getKernNoteStyle();
        if (lastVoiceToken) lastVoiceToken.value += ' ' + tok;
      } else if (r.isAnyRest()) {
        gm.addDataToken(r.getKernRestStyle(), ts, 0, 0, 0, 1);
      } else if (r.isBarline()) {
        const flags = r.getMeasureFlags();
        if (r.line.startsWith('mdouble')) gm.setStyle(2);
        else if (r.line.startsWith('mheavy2')) gm.setStyle(flags.includes(':|') ? 5 : 6);
      }
    }
    gm.setDuration(md0.getFileDuration());
    gm.setTimestamp(new HumNum(0));
    gm.setTimeSigDur(timesigdur);
    const mnum = md0.records.find((r) => r.isBarline());
    if (mnum && /\d/.test(mnum.line)) {
      const m = mnum.line.match(/(\d+)/);
      if (m) gm.setMeasureNumber(parseInt(m[1], 10));
    }
    void quarterDiv;
    const outfile = new HumdrumFile();
    (outdata as unknown as { transferTokens(o: HumdrumFile, s: number, i: string): boolean }).transferTokens(outfile, 0, '**kern');
    outfile.generateLinesFromTokens();
    const ss: string[] = [];
    for (let i = 0; i < (outfile as unknown as { getLineCount(): number }).getLineCount(); i++) {
      ss.push((outfile as unknown as { getLine(i: number): string }).getLine(i));
    }
    let body = ss.join('\n') + '\n';
    // C++ convert() header/footer: refs from first part, data, SMS/ENC/END,
    // ONB date line. Global-comment transfer via HumGrid path covers **kern.
    let out = '';
    const refs: Array<[string, string]> = [['COM', ''], ['CDT', ''], ['OTL', md0.getWorkTitle()], ['OMV', md0.getMovementTitle()], ['OPS', md0.getOpus()], ['ONM', md0.getNumber()]];
    for (const [k, v] of refs) if (v) out += '!!!' + k + ': ' + v + '\n';
    for (let i = 0; i < md0.getLineCount(); i++) {
      if (md0.getRecord(i).isAnyNote()) break;
      const l = md0.getLine(i);
      if (l.startsWith('@@')) {
        if (l === '@@@') continue;
        out += '!' + l.slice(1) + '\n';
      }
    }
    out += body;
    if (md0.getSource()) out += '!!!SMS: ' + md0.getSource() + '\n';
    if (md0.getEncoderName()) out += '!!!ENC: ' + md0.getEncoderName() + '\n';
    if (md0.getEncoderDate()) out += '!!!END: ' + md0.getEncoderDate() + '\n';
    const d = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, ' ');
    const time = [d.getHours(), d.getMinutes(), d.getSeconds()].map((v) => String(v).padStart(2, '0')).join(':');
    out += `!!!ONB: Converted from MuseData with musedata2hum on ${days[d.getDay()]} ${months[d.getMonth()]} ${day} ${time} ${d.getFullYear()}\n`;
    if (md0.getCopyright()) out += '!!!YEM: ' + md0.getCopyright() + '\n';
    return { output: out, status: true };
  }
}
