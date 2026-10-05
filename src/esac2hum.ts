import { HumNum, HumRegex } from './humlib.js';
import { Convert } from './convert.js';

// C++ Tool_esac2hum (humlib.cpp:86401+, humlib.h:7921+): EsAC -> Humdrum
// string converter. Default options: embed-esac on, analyses off, no verbose.
// ponytail: UTF double-encoding fixups in cleanText, Kolberg URL table,
// analysis embeds (doAnalyses) skipped; add when DWOK/diacritic byte parity needed.
class EsacNote {
  m_errors: string[] = [];
  esac = '';
  m_dots = 0;
  m_underscores = 0;
  m_octave = 0;
  m_degree = 0;
  m_b40degree = 0;
  m_alter = 0;
  m_ticks = 0;
  m_tieBegin = false;
  m_tieEnd = false;
  m_phraseBegin = false;
  m_phraseEnd = false;
  m_humdrum = '';
  m_b40 = 0;
  m_b12 = 0;
  m_factor: HumNum = new HumNum(1);

  parseNote(note: string, factor: HumNum): boolean {
    this.esac = note;
    let minus = 0, plus = 0, b = 0, s = 0;
    this.m_degree = 0;
    this.m_dots = 0;
    this.m_underscores = 0;
    for (let i = 0; i < note.length; i++) {
      const c = note[i];
      if (c === '.') this.m_dots++;
      else if (c === '_') this.m_underscores++;
      else if (c === '-') minus++;
      else if (c === '+') plus++;
      else if (c === 'b') b++;
      else if (c === '#') s++;
      else if (c >= '0' && c <= '9') this.m_degree = note.charCodeAt(i) - 48;
      else if (c === '^') this.m_degree = -1000;
    }
    this.m_ticks = 1 << this.m_underscores;
    if (this.m_dots > 0) this.m_ticks = this.m_ticks * (2.0 - 1.0 / (1 << this.m_dots));
    this.m_alter = s - b;
    this.m_octave = plus - minus;
    this.m_factor = factor;
    return true;
  }

  generateHumdrum(minrhy: number, b40tonic: number): void {
    let pitch: string;
    if (this.m_degree !== 0) {
      this.m_b40degree = 0;
      switch (Math.abs(this.m_degree)) {
        case 2: this.m_b40degree += 6; break;
        case 3: this.m_b40degree += 12; break;
        case 4: this.m_b40degree += 17; break;
        case 5: this.m_b40degree += 23; break;
        case 6: this.m_b40degree += 29; break;
        case 7: this.m_b40degree += 35; break;
      }
      if (this.m_alter >= -2 && this.m_alter <= 2) this.m_b40degree += this.m_alter;
      else this.m_errors.push('Error: chromatic alteration on note too large');
      this.m_b40 = 40 * this.m_octave + this.m_b40degree + b40tonic;
      pitch = Convert.base40ToKern(this.m_b40);
      this.m_b12 = Convert.base40ToMidiNoteNumber(this.m_b40);
    } else {
      pitch = 'r';
      this.m_b40 = -1000;
      this.m_b40degree = -1000;
    }
    let duration = new HumNum(1, minrhy);
    duration = duration.mul(1 << this.m_underscores);
    duration = duration.mul(4);
    duration = duration.mul(this.m_factor);
    let recip = Convert.durationToRecip(duration);
    for (let i = 0; i < this.m_dots; i++) recip += '.';
    this.m_humdrum = '';
    if (this.m_phraseBegin) this.m_humdrum += '{';
    if (this.m_tieBegin && !this.m_tieEnd) this.m_humdrum += '[';
    this.m_humdrum += recip;
    this.m_humdrum += pitch;
    if (!this.m_tieBegin && this.m_tieEnd) this.m_humdrum += ']';
    else if (this.m_tieBegin && this.m_tieEnd) this.m_humdrum += '_';
    if (this.m_phraseEnd) this.m_humdrum += '}';
  }
}

class EsacMeasure {
  m_errors: string[] = [];
  esac = '';
  m_barnum = -1000;
  m_ticks = 0;
  m_tsticks = 0;
  m_measureTimeSignature = '';
  m_partialBegin = false;
  m_partialEnd = false;
  m_complete = false;
  notes: EsacNote[] = [];
  at(i: number): EsacNote { return this.notes[i]; }
  size(): number { return this.notes.length; }
  isUnassigned(): boolean { return !(this.m_complete || this.m_partialBegin || this.m_partialEnd); }
  setComplete(): void { this.m_complete = true; this.m_partialBegin = false; this.m_partialEnd = false; }
  isComplete(): boolean { return this.m_complete; }
  setPartialBegin(): void { this.m_complete = false; this.m_partialBegin = true; this.m_partialEnd = false; }
  isPartialBegin(): boolean { return this.m_partialBegin; }
  setPartialEnd(): void { this.m_complete = false; this.m_partialBegin = false; this.m_partialEnd = true; }
  isPartialEnd(): boolean { return this.m_partialEnd; }

  parseMeasure(measure: string): boolean {
    this.esac = measure;
    const tokens: string[] = [];
    const factors: HumNum[] = [];
    let factor: HumNum = new HumNum(1);
    const length = measure.length;
    const isDigit = (c: string) => c >= '0' && c <= '9';
    for (let i = 0; i < length; i++) {
      const c = measure[i];
      if (c === '(') factor = new HumNum(2, 3);
      let marker = false;
      if (isDigit(c)) marker = true;
      else if (c === '^' || c === '(' || c === '-' || c === '+') marker = true;
      if (marker && tokens.length > 0 && tokens[tokens.length - 1].length > 0) {
        const check = tokens[tokens.length - 1].slice(-1);
        if (check === '(' || check === '-' || check === '+') marker = false;
      }
      if (marker) {
        tokens.push(c);
        factors.push(factor);
      } else {
        if (tokens.length > 0) tokens[tokens.length - 1] += c;
      }
      if (c === ')') factor = new HumNum(1);
    }
    if (tokens.length === 0) return false;
    for (let i = 0; i < tokens.length; i++) {
      const n = new EsacNote();
      n.parseNote(tokens[i], factors[i]);
      this.notes.push(n);
    }
    this.m_ticks = 0;
    for (let i = 0; i < this.notes.length; i++) this.m_ticks += this.notes[i].m_ticks;
    return true;
  }
}

class EsacPhrase {
  m_errors: string[] = [];
  m_ticks = 0;
  esac = '';
  measures: EsacMeasure[] = [];
  at(i: number): EsacMeasure { return this.measures[i]; }
  size(): number { return this.measures.length; }
  parsePhrase(phrase: string): boolean {
    this.esac = phrase;
    const hre = new HumRegex();
    const bars: string[] = [];
    hre.split(bars, Tool_esac2hum.trimSpaces(phrase), '\\s+');
    if (bars.length === 0) return false;
    for (let i = 0; i < bars.length; i++) {
      const m = new EsacMeasure();
      m.parseMeasure(bars[i]);
      this.measures.push(m);
    }
    this.m_ticks = 0;
    for (let i = 0; i < this.measures.length; i++) this.m_ticks += this.measures[i].m_ticks;
    return true;
  }
}

class EsacScore {
  m_b40tonic = 0;
  m_minrhy = 0;
  m_clef = '';
  m_keysignature = '';
  m_keydesignation = '';
  m_timesig = '';
  m_params: Record<string, string> = {};
  m_errors: string[] = [];
  m_finalBarline = false;
  phrases: EsacPhrase[] = [];
  at(i: number): EsacPhrase { return this.phrases[i]; }
  size(): number { return this.phrases.length; }
  empty(): boolean { return this.phrases.length === 0; }
  back(): EsacPhrase { return this.phrases[this.phrases.length - 1]; }
  clear(): void { this.phrases = []; }
  hasFinalBarline(): boolean { return this.m_finalBarline; }

  parseMel(mel: string): boolean {
    this.clear();
    const hre = new HumRegex();
    if (hre.search(mel, '^\\s*$')) return false;
    const lines: string[] = [];
    for (const raw of mel.split('\n')) {
      if (hre.search(raw, '^\\s*$')) continue;
      lines.push(Tool_esac2hum.trimSpaces(raw));
    }
    this.m_finalBarline = false;
    for (let i = 0; i < lines.length; i++) {
      if (i === lines.length - 1 && hre.search(lines[i], '^(.*)\\s*//\\s*$')) {
        this.m_finalBarline = true;
        lines[lines.length - 1] = hre.getMatch(1);
      }
    }
    if (lines.length > 0 && hre.search(lines[lines.length - 1], '^\\s*$')) lines.pop();
    if (lines.length === 0) return false;
    for (let i = 0; i < lines.length; i++) {
      const p = new EsacPhrase();
      p.parsePhrase(lines[i]);
      this.phrases.push(p);
    }
    this.analyzeTies();
    this.analyzePhrases();
    this.generateHumdrumNotes();
    this.calculateClef();
    this.calculateKeyInformation();
    this.calculateTimeSignatures();
    return true;
  }

  getNoteList(): EsacNote[] {
    const out: EsacNote[] = [];
    for (const ph of this.phrases) for (const m of ph.measures) for (const n of m.notes) out.push(n);
    return out;
  }
  getMeasureList(): EsacMeasure[] {
    const out: EsacMeasure[] = [];
    for (const ph of this.phrases) for (const m of ph.measures) out.push(m);
    return out;
  }
  getPhraseNoteList(index: number): EsacNote[] {
    const out: EsacNote[] = [];
    if (index < 0 || index >= this.phrases.length) return out;
    for (const m of this.phrases[index].measures) for (const n of m.notes) out.push(n);
    return out;
  }

  analyzeTies(): void {
    const list = this.getNoteList();
    for (let i = 1; i < list.length; i++) {
      if (list[i].m_degree < 0) {
        list[i].m_tieEnd = true;
        list[i - 1].m_tieBegin = true;
        if (list[i - 1].m_degree >= 0) {
          list[i].m_degree = -list[i - 1].m_degree;
          list[i].m_alter = list[i - 1].m_alter;
          list[i].m_octave = list[i - 1].m_octave;
        }
      }
    }
  }

  analyzePhrases(): void {
    for (let i = 0; i < this.size(); i++) {
      const list = this.getPhraseNoteList(i);
      if (list.length === 0) { this.at(i).m_errors.push('ERROR: no notes in phrase.'); return; }
      let found = false;
      for (const n of list) {
        if (n.m_degree <= 0) continue;
        found = true;
        n.m_phraseBegin = true;
        break;
      }
      if (!found) { this.at(i).m_errors.push('Error: cannot find any notes in phrase.'); continue; }
      for (let j = list.length - 1; j >= 0; j--) {
        if (list[j].m_degree <= 0) continue;
        list[j].m_phraseEnd = true;
        break;
      }
    }
  }

  generateHumdrumNotes(): void {
    const list = this.getNoteList();
    const tonic = this.m_params['_tonic'] ?? '';
    if (!tonic) {
      this.m_errors.push('Error: cannot find tonic pitch in KEY[] field: ' + (this.m_params['KEY'] ?? ''));
      return;
    }
    const letter = tonic[0].toLowerCase();
    this.m_b40tonic = 40 * 4 + 2;
    if (letter === 'd') this.m_b40tonic += 6;
    else if (letter === 'e') this.m_b40tonic += 12;
    else if (letter === 'f') this.m_b40tonic += 17;
    else if (letter === 'g') this.m_b40tonic += 23;
    else if (letter === 'a') this.m_b40tonic += 29;
    else if (letter === 'b') this.m_b40tonic += 35;
    let flats = 0, sharps = 0;
    for (let i = 1; i < tonic.length; i++) {
      if (tonic[i] === 'b') flats++;
      else if (tonic[i] === '#') sharps++;
    }
    if (flats > 0) this.m_b40tonic -= flats;
    else if (sharps > 0) this.m_b40tonic += sharps;
    const minrhy = this.m_params['_minrhy'] ?? '';
    if (!minrhy) { this.m_errors.push('Error: cannot find KEY[] minrhy'); return; }
    this.m_minrhy = parseInt(minrhy, 10);
    for (const n of list) n.generateHumdrum(this.m_minrhy, this.m_b40tonic);
  }

  calculateClef(): void {
    const list = this.getNoteList();
    let sum = 0, count = 0, min12 = 1000, max12 = -1000;
    for (const n of list) {
      const b12 = n.m_b12;
      if (b12 > 0) {
        sum += b12; count++;
        if (b12 < min12) min12 = b12;
        if (b12 > max12) max12 = b12;
      }
    }
    const average = count > 0 ? sum / count : 60.0;
    if (min12 > 54 && average >= 60.0) this.m_clef = '*clefG2';
    else if (max12 < 67 && average < 60.0) this.m_clef = '*clefF4';
    else if (min12 > 47 && min12 <= 57 && max12 < 77 && max12 >= 65) this.m_clef = '*clefGv2';
    else if (average < 60.0) this.m_clef = '*clefF2';
    else this.m_clef = '*clefG2';
  }

  calculateKeyInformation(): void {
    const list = this.getNoteList();
    const pcs = new Array(40).fill(0);
    for (const n of list) {
      const pc = n.m_b40degree;
      if (pc >= 0 && pc < 40) pcs[pc]++;
    }
    let tonic = this.m_params['_tonic'] ?? '';
    if (!tonic) return;
    let letter = tonic[0].toUpperCase();
    const majorsum = pcs[12] + pcs[29];
    const minorsum = pcs[11] + pcs[28];
    if (minorsum > majorsum) letter = letter.toLowerCase();
    let flats = '', sharps = '';
    for (let i = 1; i < tonic.length; i++) {
      if (tonic[i] === 'b') flats += '-';
      else if (tonic[i] === '#') sharps += '#';
    }
    this.m_keydesignation = '*' + letter;
    if (flats && sharps) this.m_errors.push('ERROR: tonic note cannot include both sharps and flats.');
    if (flats) this.m_keydesignation += flats;
    else this.m_keydesignation += sharps;
    this.m_keydesignation += ':';
    const kd = this.m_keydesignation;
    const up = letter === letter.toUpperCase();
    if (up) {
      if (kd === '*C:') this.m_keysignature = '*k[]';
      else if (kd === '*G:') this.m_keysignature = '*k[f#]';
      else if (kd === '*D:') this.m_keysignature = '*k[f#c#]';
      else if (kd === '*A:') this.m_keysignature = '*k[f#c#g#]';
      else if (kd === '*E:') this.m_keysignature = '*k[f#c#g#d#]';
      else if (kd === '*B:') this.m_keysignature = '*k[f#c#g#d#a#]';
      else if (kd === '*F#:') this.m_keysignature = '*k[f#c#g#d#a#e#]';
      else if (kd === '*C#:') this.m_keysignature = '*k[f#c#g#d#a#e#b#]';
      else if (kd === '*F:') this.m_keysignature = '*k[b-]';
      else if (kd === '*B-:') this.m_keysignature = '*k[b-e-]';
      else if (kd === '*E-:') this.m_keysignature = '*k[b-e-a-]';
      else if (kd === '*A-:') this.m_keysignature = '*k[b-e-a-d-]';
      else if (kd === '*D-:') this.m_keysignature = '*k[b-e-a-d-g-]';
      else if (kd === '*G-:') this.m_keysignature = '*k[b-e-a-d-g-c-]';
      else if (kd === '*C-:') this.m_keysignature = '*k[b-e-a-d-g-f-]';
      else this.m_errors.push('ERROR: invalid/exotic key signature required.');
    } else {
      if (kd === '*a:') this.m_keysignature = '*k[]';
      else if (kd === '*e:') this.m_keysignature = '*k[f#]';
      else if (kd === '*b:') this.m_keysignature = '*k[f#c#]';
      else if (kd === '*f#:') this.m_keysignature = '*k[f#c#g#]';
      else if (kd === '*c#:') this.m_keysignature = '*k[f#c#g#d#]';
      else if (kd === '*g#:') this.m_keysignature = '*k[f#c#g#d#a#]';
      else if (kd === '*d#:') this.m_keysignature = '*k[f#c#g#d#a#e#]';
      else if (kd === '*a#:') this.m_keysignature = '*k[f#c#g#d#a#e#b#]';
      else if (kd === '*d:') this.m_keysignature = '*k[b-]';
      else if (kd === '*g:') this.m_keysignature = '*k[b-e-]';
      else if (kd === '*c:') this.m_keysignature = '*k[b-e-a-]';
      else if (kd === '*f:') this.m_keysignature = '*k[b-e-a-d-]';
      else if (kd === '*b-:') this.m_keysignature = '*k[b-e-a-d-g-]';
      else if (kd === '*e-:') this.m_keysignature = '*k[b-e-a-d-g-c-]';
      else if (kd === '*a-:') this.m_keysignature = '*k[b-e-a-d-g-c-f-]';
      else this.m_errors.push('ERROR: invalid/exotic key signature required.');
    }
  }

  calculateTimeSignatures(): void {
    let ts = Tool_esac2hum.trimSpaces(this.m_params['_time'] ?? '');
    if (ts.includes('FREI')) {
      this.m_timesig = '*MX';
      this.setAllTimesigTicks(0);
      this.assignFreeMeasureNumbers();
      return;
    }
    const hre = new HumRegex();
    if (hre.search(ts, '^(\\d+)/(\\d+)$')) {
      this.m_timesig = '*M' + ts;
      const top = hre.getMatchInt(1);
      const bot = hre.getMatchInt(2);
      this.setAllTimesigTicks(top * this.m_minrhy / bot);
      this.assignSingleMeasureNumbers();
      return;
    } else if (hre.search(ts, '^(\\d+/\\d+(?:\\s+|$)){2,}$')) {
      this.prepareMultipleTimeSignatures(ts);
    }
    const timesigs: string[] = [];
    hre.split(timesigs, ts, '\\s+');
    if (timesigs.length < 2) {
      this.m_errors.push('ERROR: Cannot find time signature(s) in KEY[] field: ' + (this.m_params['KEY'] ?? ''));
      return;
    }
  }

  prepareMultipleTimeSignatures(ts: string): void {
    const tss: string[] = [];
    const hre = new HumRegex();
    hre.split(tss, ts, '\\s+');
    const tsticks: number[] = new Array(tss.length).fill(0);
    for (let i = 0; i < tss.length; i++) {
      if (!hre.search(tss[i], '^(\\d+)/(\\d+)$')) continue;
      tsticks[i] = hre.getMatchInt(1) * this.m_minrhy / hre.getMatchInt(2);
    }
    for (let i = 0; i < this.size(); i++) {
      const phrase = this.at(i);
      for (let j = 1; j < phrase.size() - 1; j++) {
        const measure = phrase.at(j);
        for (let k = 0; k < tss.length; k++) {
          if (tsticks[k] === measure.m_ticks) {
            measure.m_measureTimeSignature = '*M' + tss[k];
            measure.setComplete();
          }
        }
      }
    }
    for (let i = 0; i < this.size() - 1; i++) {
      const phrase = this.at(i);
      const nextphrase = this.at(i + 1);
      if (phrase.size() < 2 || nextphrase.size() < 2) continue;
      const measure = phrase.at(phrase.size() - 1);
      const nextmeasure = nextphrase.at(0);
      let found1 = -1, found2 = -1;
      for (let j = tss.length - 1; j >= 0; j--) {
        if (tsticks[j] === measure.m_ticks) found1 = j;
        if (tsticks[j] === nextmeasure.m_ticks) found2 = j;
      }
      if (found1 >= 0 && found2 >= 0) {
        measure.m_measureTimeSignature = '*M' + tss[found1];
        nextmeasure.m_measureTimeSignature = '*M' + tss[found2];
        measure.setComplete();
        nextmeasure.setComplete();
      } else {
        const ticksum = measure.m_ticks + nextmeasure.m_ticks;
        for (let z = 0; z < tsticks.length; z++) {
          if (tsticks[z] === ticksum) {
            nextmeasure.m_barnum = -1;
            measure.m_measureTimeSignature = '*M' + tss[z];
            nextmeasure.m_measureTimeSignature = '*M' + tss[z];
            measure.setPartialBegin();
            nextmeasure.setPartialEnd();
          }
        }
      }
    }
    if (this.empty()) return;
    if (this.size() === 1 && this.at(0).size() <= 1) return;
    const firstmeasure = this.at(0).at(0);
    const lastmeasure = this.back().at(this.back().size() - 1);
    const firstticks = firstmeasure.m_ticks;
    const lastticks = lastmeasure.m_ticks;
    let foundfirst = -1, foundlast = -1;
    for (let i = tss.length - 1; i >= 0; i--) {
      if (tsticks[i] === firstticks) foundfirst = i;
      if (tsticks[i] === lastticks) foundlast = i;
    }
    if (foundfirst >= 0 && foundlast >= 0) {
      firstmeasure.m_measureTimeSignature = '*M' + tss[foundfirst];
      lastmeasure.m_measureTimeSignature = '*M' + tss[foundlast];
      firstmeasure.setComplete();
      lastmeasure.setComplete();
    } else {
      const sumticks = firstticks + lastticks;
      let sumfound = -1;
      for (let i = 0; i < tsticks.length; i++) {
        if (tsticks[i] === sumticks) { sumfound = i; break; }
      }
      if (sumfound >= 0) {
        firstmeasure.m_measureTimeSignature = '*M' + tss[sumfound];
        lastmeasure.m_measureTimeSignature = '*M' + tss[sumfound];
        firstmeasure.m_barnum = 0;
        firstmeasure.setPartialEnd();
        lastmeasure.setPartialBegin();
      } else if (foundfirst >= 0 && foundlast < 0) {
        firstmeasure.setComplete();
        lastmeasure.setPartialBegin();
      } else if (foundfirst < 0 && foundlast >= 0) {
        firstmeasure.setPartialEnd();
        lastmeasure.setComplete();
      }
    }
    const measurelist = this.getMeasureList();
    let barnum = 1;
    for (const m of measurelist) {
      if (m.size() > 0 && m === measurelist[0] && m.isPartialEnd()) { m.m_barnum = 0; continue; }
      if (m.isComplete()) m.m_barnum = barnum++;
      else if (m.isPartialBegin()) m.m_barnum = barnum++;
      else if (m.isPartialEnd()) m.m_barnum = -1;
      else m.m_errors.push('UNCATEGORIZED MEASURE');
    }
    let current = '';
    for (const m of measurelist) {
      if (m.m_measureTimeSignature === current) m.m_measureTimeSignature = '';
      else current = m.m_measureTimeSignature;
    }
  }

  setAllTimesigTicks(ticks: number): void {
    for (const m of this.getMeasureList()) m.m_tsticks = ticks;
  }

  assignFreeMeasureNumbers(): void {
    const list = this.getMeasureList();
    let barnum = 1;
    for (const m of list) {
      m.m_barnum = barnum++;
      m.m_partialBegin = false;
      m.m_partialEnd = false;
      m.m_complete = true;
    }
  }

  assignSingleMeasureNumbers(): void {
    const list = this.getMeasureList();
    if (list.length === 0) return;
    for (const m of list) {
      if (m.m_tsticks === m.m_ticks) m.setComplete();
    }
    if (list[0].m_ticks < list[0].m_tsticks) {
      list[0].setPartialEnd();
      if (list[list.length - 1].m_ticks < list[list.length - 1].m_tsticks) list[list.length - 1].setPartialBegin();
    }
    for (let i = 1; i < list.length; i++) {
      if (!list[i].isUnassigned() || !list[i - 1].isUnassigned()) continue;
      const t1 = list[i - 1].m_ticks, t2 = list[i].m_ticks;
      const s1 = list[i - 1].m_tsticks, s2 = list[i].m_tsticks;
      if (s1 !== s2) continue;
      if (t1 + t2 === s2) {
        list[i - 1].setPartialBegin();
        list[i].setPartialEnd();
      }
    }
    let barnum = 1;
    for (const m of list) {
      if (m.isComplete()) m.m_barnum = barnum++;
      else if (m.isPartialBegin()) m.m_barnum = barnum++;
      else if (m.isPartialEnd()) m.m_barnum = -1;
    }
    if (list[0].isPartialEnd()) list[0].m_barnum = 0;
  }
}

export class Tool_esac2hum {
  private m_score = new EsacScore();
  private m_embedEsacQ = true;
  private m_dwokQ = false;
  private m_minrhy = 0;
  private m_inputline = 0;
  private m_prevline = '';
  private m_cutline = '';
  private m_globalComments: string[] = [];
  private m_filePostfix = '.krn';

  static trimSpaces(input: string): string {
    const hre = new HumRegex();
    let out = hre.replaceDestructive(input, '', '^\\s+');
    out = hre.replaceDestructive(out, '', '\\s+$');
    return out;
  }

  convert(input: string): { output: string; status: boolean } {
    const lines = input.split('\n');
    let pos = 0;
    const eof = () => pos >= lines.length;
    const getline = (): string => (pos < lines.length ? lines[pos++] : '');
    let out = '';
    this.m_inputline = 0;
    this.m_prevline = '';
    this.m_cutline = '';
    while (!eof()) {
      const song: string[] = [];
      if (!this.getSong(song, getline, eof)) continue;
      if (song.length === 0) continue;
      if (song.length < 4) continue;
      out += this.convertSong(song);
    }
    return { output: out, status: true };
  }

  private getSong(song: string[], getline: () => string, eof: () => boolean): boolean {
    song.length = 0;
    this.m_globalComments = [];
    const hre = new HumRegex();
    if (!this.m_cutline) {
      while (!eof()) {
        const buffer = getline();
        if (hre.search(buffer, '^[!#]{2,}')) {
          hre.search(buffer, '^([!#]{2,})(.*)$');
          let prefix = hre.getMatch(1);
          const postfix = hre.getMatch(2);
          prefix = hre.replaceDestructive(prefix, '!', '#', 'g');
          this.m_globalComments.push(prefix + postfix);
          continue;
        }
        const clean = this.cleanText(buffer);
        this.m_inputline++;
        if (clean.substring(0, 4) === 'CUT[') { this.m_cutline = clean; break; }
        else { this.m_prevline = clean; continue; }
      }
    }
    if (!this.m_cutline) return false;
    if (eof()) return false;
    if (!hre.search(this.m_prevline, '^\\s*$')) song.push(this.m_prevline);
    song.push(this.m_cutline);
    this.m_prevline = '';
    this.m_cutline = '';
    let expectingCloseQ = false;
    while (!eof()) {
      const buffer = getline();
      if (hre.search(buffer, '^#{2,}')) {
        hre.search(buffer, '^(#{2,})(.*)$');
        let prefix = hre.getMatch(1);
        const postfix = hre.getMatch(2);
        prefix = hre.replaceDestructive(prefix, '!', '#', 'g');
        this.m_globalComments.push(prefix + postfix);
        continue;
      }
      const clean = this.cleanText(buffer);
      this.m_inputline++;
      if (expectingCloseQ) {
        if (clean.indexOf('[') !== -1) continue;
        else if (!hre.search(clean, '[\\[\\]]')) { song.push(clean); continue; }
        if (hre.search(clean, '^[^\\]]*\\]\\s*$')) { expectingCloseQ = false; song.push(clean); continue; }
        continue;
      }
      if (hre.search(clean, '^\\s*$')) continue;
      if (hre.search(clean, '^[A-Za-z][^\\[\\]]*$')) { this.m_prevline = clean; return true; }
      if (hre.search(clean, '^[A-Za-z]+\\s*\\[[^\\]]*\\s*$')) expectingCloseQ = true;
      song.push(clean);
    }
    return true;
  }

  private cleanText(buffer: string): string {
    let out = buffer.replace(/[]/g, '');
    if (out.endsWith('\r')) out = out.slice(0, -1);
    return out;
  }

  private convertSong(infile: string[]): string {
    this.getParameters(infile);
    this.m_score.parseMel(this.m_score.m_params['MEL'] ?? '');
    let out = '';
    out += this.printHeader();
    out += this.printScoreContents();
    out += this.printFooter(infile);
    return out;
  }

  private getParameters(infile: string[]): void {
    this.m_score.m_params = {};
    const hre = new HumRegex();
    let expectingCloseQ = false;
    let lastKey = '';
    for (let i = 0; i < infile.length; i++) {
      if (hre.search(infile[i], '^\\s*$')) continue;
      if (i === 0 && hre.search(infile[i], '^([A-Z_a-z][^\\]\\[]*)\\s*$')) {
        this.m_score.m_params['_source'] = hre.getMatch(1);
        continue;
      }
      if (expectingCloseQ) {
        if (infile[i].indexOf('[') !== -1) continue;
        else if (infile[i].indexOf(']') === -1) {
          if (lastKey) this.m_score.m_params[lastKey] += '\n' + infile[i];
        } else if (hre.search(infile[i], '^([^\\]]+)\\]\\s*$')) {
          if (lastKey) {
            this.m_score.m_params[lastKey] += '\n' + hre.getMatch(1);
            expectingCloseQ = false;
            continue;
          }
        }
        continue;
      } else if (hre.search(infile[i], '^\\s*([A-Z_a-z]+)\\s*\\[([^\\]]*)\\]\\s*$')) {
        const key = hre.getMatch(1).toUpperCase();
        this.m_score.m_params[key] = hre.getMatch(2);
        continue;
      } else if (hre.search(infile[i], '^\\s*([A-Z_a-z]+)\\s*\\[([^\\]]*)\\s*$')) {
        const key = hre.getMatch(1).toUpperCase();
        this.m_score.m_params[key] = hre.getMatch(2);
        lastKey = key;
        expectingCloseQ = true;
        continue;
      } else if (hre.search(infile[i], '^#')) continue;
    }
    const cut = this.m_score.m_params['CUT'] ?? '';
    const nl = cut.indexOf('\n');
    if (nl >= 0) {
      this.m_score.m_params['_title'] = Tool_esac2hum.trimSpaces(cut.slice(0, nl));
      this.m_score.m_params['_incipit'] = Tool_esac2hum.trimSpaces(cut.slice(nl + 1));
    } else {
      this.m_score.m_params['_title'] = Tool_esac2hum.trimSpaces(cut);
      this.m_score.m_params['_incipit'] = '';
    }
    const key = this.m_score.m_params['KEY'] ?? '';
    if (hre.search(key, '^\\s*([^\\s]+)\\s+(\\d+)\\s+([A-Gacdefg][b#]*)\\s+(.*?)\\s*$')) {
      let tonic = hre.getMatch(3);
      if (tonic.length >= 1 && tonic[0] >= 'a' && tonic[0] <= 'z' && tonic[0] !== 'b') {
        tonic = tonic[0].toUpperCase() + tonic.slice(1);
      }
      this.m_score.m_params['_id'] = hre.getMatch(1);
      this.m_score.m_params['_minrhy'] = hre.getMatch(2);
      this.m_score.m_params['_tonic'] = tonic;
      this.m_score.m_params['_time'] = hre.getMatch(4);
      this.m_minrhy = parseInt(hre.getMatch(2), 10);
    }
    const trd = this.m_score.m_params['TRD'] ?? '';
    if (hre.search(trd, '^\\s*(.*)\\ss\\.')) this.m_score.m_params['_source_trd'] = hre.getMatch(1);
    if (hre.search(trd, '\\bs(?:tr)?\\.?\\s*(\\d+)\\s*-\\s*(\\d+)?', 'i')) {
      this.m_score.m_params['_page'] = hre.getMatch(1) + '-' + hre.getMatch(2);
    } else if (hre.search(trd, '\\bs(?:tr)?\\.?\\s*(\\d+)', 'i')) {
      this.m_score.m_params['_page'] = hre.getMatch(1);
    }
    if (hre.search(this.m_score.m_params['_source_trd'] ?? '', '^\\s*(DWOK\\d+)')) this.m_dwokQ = true;
    else if (hre.search(this.m_score.m_params['_source'] ?? '', '^\\s*(DWOK\\d+)')) this.m_dwokQ = true;
  }

  private createFilename(): string {
    const source0 = this.m_score.m_params['_source'] ?? '';
    let sig = this.m_score.m_params['SIG'] ?? '';
    let title = this.m_score.m_params['_title'] ?? '';
    const id = this.m_score.m_params['_id'] ?? '';
    if (!sig) sig = id;
    const hre = new HumRegex();
    sig = hre.replaceDestructive(sig, '', '\\s+', 'g');
    let source = hre.replaceDestructive(source0, '', '\\s+', 'g');
    title = hre.replaceDestructive(title, '_', '\\s+', 'g');
    const accents: Array<[string, string]> = [
      ['a', 'á'], ['a', 'à'], ['a', 'ä'], ['a', 'â'], ['a', 'ã'], ['a', 'å'],
      ['e', 'é'], ['e', 'è'], ['e', 'ë'], ['e', 'ê'],
      ['i', 'í'], ['i', 'ì'], ['i', 'ï'], ['i', 'î'],
      ['o', 'ó'], ['o', 'ò'], ['o', 'ö'], ['o', 'ô'], ['o', 'õ'], ['o', 'ø'],
      ['u', 'ú'], ['u', 'ù'], ['u', 'ü'], ['u', 'û'],
      ['y', 'ý'], ['y', 'ÿ'], ['n', 'ñ'], ['c', 'ç'],
      ['a', 'ą'], ['c', 'ć'], ['e', 'ę'], ['l', 'ł'], ['n', 'ń'],
      ['s', 'ś'], ['z', 'ź'], ['z', 'ż'],
    ];
    for (const [rep, ch] of accents) title = title.split(ch).join(rep);
    title = hre.replaceDestructive(title, '', '[^a-zA-Z0-9-_.]', 'g');
    title = title.toLowerCase();
    let output = '';
    if (source && hre.search(source, '^DWOK(\\d+)$')) {
      let volume = hre.getMatch(1);
      if (volume.length === 1) volume = '0' + volume;
      if (sig && hre.search(sig, '^(\\d\\d)')) {
        if (volume === hre.getMatch(1)) source = 'DWOK';
      }
      output += source + '-';
    } else if (source) {
      output += source + '-';
    }
    output += sig;
    if (sig && title) output += '-';
    output += title;
    if (!output) output = 'file';
    output += this.m_filePostfix;
    return output;
  }

  private printHeader(): string {
    let out = '!!!!SEGMENT: ' + this.createFilename() + '\n';
    const title = this.m_score.m_params['_title'] ?? '';
    out += '!!!OTL:';
    if (title) out += ' ' + title;
    out += '\n';
    const incipit = this.m_score.m_params['_incipit'] ?? '';
    if (incipit) out += '!!!TIN: ' + incipit + '\n';
    const source = this.m_score.m_params['_source'] ?? '';
    out += '!!!source:';
    if (source) out += ' ' + source;
    out += '\n';
    const id = this.m_score.m_params['_id'] ?? '';
    out += '!!!id:';
    if (id) out += ' ' + id;
    out += '\n';
    const sig = this.m_score.m_params['SIG'] ?? '';
    out += '!!!signature:';
    if (sig) out += ' ' + sig;
    out += '\n';
    out += '**kern\n';
    return out;
  }

  private printScoreContents(): string {
    let out = '';
    for (const e of this.m_score.m_errors) out += '!!' + e + '\n';
    if (this.m_score.m_clef) out += this.m_score.m_clef + '\n';
    if (this.m_score.m_keysignature) out += this.m_score.m_keysignature + '\n';
    if (this.m_score.m_keydesignation) out += this.m_score.m_keydesignation + '\n';
    if (this.m_score.m_timesig) out += this.m_score.m_timesig + '\n';
    for (let i = 0; i < this.m_score.size(); i++) {
      const phrase = this.m_score.at(i);
      for (let j = 0; j < phrase.size(); j++) {
        const measure = phrase.at(j);
        if (j === 0 && i > 0) out += '!!LO:LB:g=esac\n';
        if (measure.m_barnum !== 0) {
          out += '=';
          if (measure.m_barnum > 0) out += String(measure.m_barnum);
          else if (measure.m_barnum === -1) out += '-';
          out += '\n';
        }
        for (const e of measure.m_errors) out += '!!' + e + '\n';
        if (measure.m_measureTimeSignature) out += measure.m_measureTimeSignature + '\n';
        for (let k = 0; k < measure.size(); k++) out += measure.at(k).m_humdrum + '\n';
      }
    }
    if (this.m_score.hasFinalBarline()) out += '==\n';
    else out += '=\n';
    return out;
  }

  private printFooter(infile: string[]): string {
    let out = '*-\n';
    const bem = this.m_score.m_params['BEM'] ?? '';
    if (bem) {
      const hre = new HumRegex();
      out += '!!!ONB: ' + hre.replaceDestructive(bem, ' ', '\n', 'g') + '\n';
    }
    if (this.m_dwokQ) out += '!!!URL: https://kolberg.ispan.pl/webesac Kolberg WebEsAC\n';
    else out += '!!!URL: http://webesac.pcss.pl WebEsAC\n';
    const trd = this.m_score.m_params['TRD'] ?? '';
    const hre = new HumRegex();
    if (hre.search(trd, '\\bs\\.\\s*(\\d+)\\s*-\\s*(\\d+)', 'im')) {
      out += '!!!page: ' + hre.getMatch(1) + '-' + hre.getMatch(2) + '\n';
    } else if (hre.search(trd, '\\bs\\.\\s*(\\d+)', 'im')) {
      out += '!!!page: ' + hre.getMatch(1) + '\n';
    }
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    out += '!!!ONB: Converted on ' + d.getFullYear() + '/' + mm + '/' + dd + ' with esac2hum\n';
    if (this.m_embedEsacQ) {
      out += '!!@@BEGIN: ESAC\n';
      out += '!!@CONTENTS:\n';
      for (const line of infile) out += '!!' + line + '\n';
      out += '!!@@END: ESAC\n';
    }
    for (const c of this.m_globalComments) out += c + '\n';
    return out;
  }
}
