/**
 * Pure-TypeScript port surface for Verovio's HumTransposer implementation
 * from src/hum/humlib.cpp.  It intentionally reuses the already translated
 * integer-transposition core, while exposing the HumTransposer API/semantics.
 */
import { HumPitch } from './humlib';
import { Transposer, TransPitch, INVALID_INTERVAL_CLASS } from './transposition';

export { INVALID_INTERVAL_CLASS };

export class HumTransposer extends Transposer {
  constructor() {
    super();
    // HumTransposer initializes in base-600 mode.
    this.SetBase600();
  }

  setMaxAccid(maxAccid: number): void { this.SetMaxAccid(maxAccid); }
  getMaxAccid(): number { return this.GetMaxAccid(); }
  setBase40(): void { this.SetBase40(); }
  setBase600(): void { this.SetBase600(); }
  getBase(): number { return this.GetBase(); }

  setTransposition(transVal: number): boolean;
  setTransposition(transString: string): boolean;
  setTransposition(fromPitch: HumPitch, toString: string): boolean;
  setTransposition(keyFifths: number, semitones: number | string): boolean;
  setTransposition(a: number | string | HumPitch, b?: number | string): boolean {
    if (a instanceof HumPitch) {
      if (typeof b !== 'string') return false;
      const toPitch = new HumPitch();
      if (!this.getKeyTonic(b, toPitch)) return false;
      const numSigns = toPitch.getOctave();
      this.m_transpose = this.getInterval(a, toPitch);
      if (numSigns > 0 && this.m_transpose > this.perfectOctaveClass() * numSigns) this.m_transpose -= this.perfectOctaveClass();
      else if (numSigns < 0 && this.m_transpose < this.perfectOctaveClass() * numSigns) this.m_transpose += this.perfectOctaveClass();
      else if (numSigns === 0 && this.m_transpose > this.perfectOctaveClass() / 2) this.m_transpose -= this.perfectOctaveClass();
      else if (numSigns === 0 && this.m_transpose < -this.perfectOctaveClass() / 2) this.m_transpose += this.perfectOctaveClass();
      return true;
    }
    if (typeof a === 'number' && typeof b === 'string') {
      if (!HumTransposer.isValidSemitones(b)) return false;
      return this.setTransposition(a, Number(b));
    }
    if (typeof a === 'number' && typeof b === 'number') {
      const intervalClass = this.semitonesToIntervalClass(a, b);
      return super.SetTransposition(intervalClass);
    }
    if (typeof a === 'number') return super.SetTransposition(a);
    this.m_transpose = this.GetInterval(a);
    return this.m_transpose !== INVALID_INTERVAL_CLASS;
  }

  setTranspositionDC(diatonic: number, chromatic: number): boolean {
    return this.setTransposition(this.diatonicChromaticToIntervalClass(diatonic, chromatic));
  }

  getTranspositionIntervalClass(): number { return this.GetTranspositionIntervalClass(); }
  getTranspositionIntervalName(): string { return this.GetTranspositionIntervalName(); }

  transpose(pitch: HumPitch): void;
  transpose(iPitch: number): number;
  transpose(pitch: HumPitch, transVal: number | string): void;
  transpose(pitchOrInt: HumPitch | number, transVal?: number | string): void | number {
    if (typeof pitchOrInt === 'number') return pitchOrInt + this.m_transpose;
    const ipitch = this.humHumPitchToIntegerPitch(pitchOrInt);
    const interval = transVal === undefined ? this.m_transpose : typeof transVal === 'number' ? transVal : this.getInterval(transVal);
    const out = this.integerPitchToHumPitch(ipitch + interval);
    pitchOrInt.setPitch(out.getDiatonicPC(), out.getAccid(), out.getOctave());
  }

  getIntervalName(p1: HumPitch, p2: HumPitch): string;
  getIntervalName(intervalClass: number): string;
  getIntervalName(a: HumPitch | number, b?: HumPitch): string {
    if (typeof a !== 'number') return this.GetIntervalName(this.getInterval(a, b!));
    return this.GetIntervalName(a);
  }

  getInterval(intervalName: string): number;
  getInterval(p1: HumPitch, p2: HumPitch): number;
  getInterval(a: string | HumPitch, b?: HumPitch): number {
    if (typeof a !== 'string') return this.humHumPitchToIntegerPitch(b!) - this.humHumPitchToIntegerPitch(a);
    return this.GetInterval(a);
  }

  humHumPitchToIntegerPitch(pitch: HumPitch): number {
    return pitch.getOctave() * this.m_base + this.m_diatonicMapping[pitch.getDiatonicPC()] + pitch.getAccid();
  }

  integerPitchToHumPitch(ipitch: number): HumPitch {
    const pitch = new HumPitch();
    pitch.setOctave(Math.floor(ipitch / this.m_base));
    const chroma = ipitch - pitch.getOctave() * this.m_base;
    let mindiff = -1000;
    let mini = -1;
    const targetdiff = this.m_maxAccid;
    if (chroma > this.m_base / 2) {
      mindiff = chroma - this.m_diatonicMapping[6];
      mini = 6;
      for (let i = 5; i >= 0; i--) {
        const diff = chroma - this.m_diatonicMapping[i];
        if (Math.abs(diff) < Math.abs(mindiff)) { mindiff = diff; mini = i; }
        if (Math.abs(mindiff) <= targetdiff) break;
      }
    } else {
      mindiff = chroma - this.m_diatonicMapping[0];
      mini = 0;
      for (let i = 1; i < this.m_diatonicMapping.length; i++) {
        const diff = chroma - this.m_diatonicMapping[i];
        if (Math.abs(diff) < Math.abs(mindiff)) { mindiff = diff; mini = i; }
        if (Math.abs(mindiff) <= targetdiff) break;
      }
    }
    pitch.setDiatonicPC(mini);
    pitch.setAccid(mindiff);
    return pitch;
  }

  semitonesToIntervalName(keyFifths: number, semitones: number): string { return this.SemitonesToIntervalClass(keyFifths, semitones) === INVALID_INTERVAL_CLASS ? '' : this.GetIntervalName(this.SemitonesToIntervalClass(keyFifths, semitones)); }
  semitonesToIntervalClass(keyFifths: number, semitones: number): number { return this.SemitonesToIntervalClass(keyFifths, semitones); }
  intervalToSemitones(intervalClass: number): number;
  intervalToSemitones(intervalName: string): number;
  intervalToSemitones(v: number | string): number { return this.IntervalToSemitones(v); }

  intervalToCircleOfFifths(transString: string): number;
  intervalToCircleOfFifths(transval: number): number;
  intervalToCircleOfFifths(v: string | number): number { return this.IntervalToCircleOfFifths(v); }
  circleOfFifthsToIntervalName(fifths: number): string { return this.CircleOfFifthsToIntervalName(fifths); }
  circleOfFifthsToIntervalClass(fifths: number): number { return this.CircleOfFifthsToIntervalClass(fifths); }

  getKeyTonic(keyTonic: string, tonic: HumPitch): boolean {
    let octave = 0, pitch = 0, accid = 0, state = 0;
    for (let i = 0; i < keyTonic.length; i++) {
      const ch = keyTonic[i];
      if (state === 0) {
        if (ch === '-') octave--;
        else if (ch === '+') octave++;
        else { state++; i--; }
      } else if (state === 1) {
        state++;
        const p = 'CcDdEeFfGgAaBb'.indexOf(ch);
        if (p < 0) return false;
        pitch = Math.floor(p / 2);
      } else {
        if ('Ffb'.includes(ch)) accid--;
        else if ('Ss#'.includes(ch)) accid++;
        else return false;
      }
    }
    tonic.setPitch(pitch, accid, octave);
    return true;
  }

  circleOfFifthsToMajorTonic(fifths: number): HumPitch { return this.tonicFor(this.getCPitchClass(), fifths); }
  circleOfFifthsToMinorTonic(fifths: number): HumPitch { return this.tonicFor(this.getAPitchClass(), fifths); }
  circleOfFifthsToDorianTonic(fifths: number): HumPitch { return this.tonicFor(this.getDPitchClass(), fifths); }
  circleOfFifthsToPhrygianTonic(fifths: number): HumPitch { return this.tonicFor(this.getEPitchClass(), fifths); }
  circleOfFifthsToLydianTonic(fifths: number): HumPitch { return this.tonicFor(this.getFPitchClass(), fifths); }
  circleOfFifthsToMixolydianTonic(fifths: number): HumPitch { return this.tonicFor(this.getGPitchClass(), fifths); }
  circleOfFifthsToLocrianTonic(fifths: number): HumPitch { return this.tonicFor(this.getBPitchClass(), fifths); }

  diatonicChromaticToIntervalName(diatonic: number, chromatic: number): string {
    if (diatonic === 0) {
      const quality = chromatic === 0 ? 'P' : chromatic > 0 ? 'A'.repeat(chromatic) : 'd'.repeat(-chromatic);
      return `${quality}1`;
    }
    let octave = 0, direction = '';
    if (diatonic < 0) {
      direction = '-';
      octave = Math.floor(-diatonic / 7);
      diatonic = -diatonic - octave * 7;
      chromatic = -chromatic;
    } else {
      octave = Math.floor(diatonic / 7);
      diatonic -= octave * 7;
    }
    let augmented = 0, diminished = 0, quality = '';
    switch (Math.abs(diatonic)) {
      case 0: if (chromatic === 0) quality = 'P'; else if (chromatic > 0) augmented = chromatic; else diminished = chromatic; break;
      case 1: if (chromatic === 2) quality = 'M'; else if (chromatic === 1) quality = 'm'; else if (chromatic > 2) augmented = chromatic - 2; else diminished = chromatic - 1; break;
      case 2: if (chromatic === 4) quality = 'M'; else if (chromatic === 3) quality = 'm'; else if (chromatic > 4) augmented = chromatic - 4; else diminished = chromatic - 3; break;
      case 3: if (chromatic === 5) quality = 'P'; else if (chromatic > 5) augmented = chromatic - 5; else diminished = chromatic - 5; break;
      case 4: if (chromatic === 7) quality = 'P'; else if (chromatic > 7) augmented = chromatic - 7; else diminished = chromatic - 7; break;
      case 5: if (chromatic === 9) quality = 'M'; else if (chromatic === 8) quality = 'm'; else if (chromatic > 9) augmented = chromatic - 9; else diminished = chromatic - 8; break;
      case 6: if (chromatic === 11) quality = 'M'; else if (chromatic === 10) quality = 'm'; else if (chromatic > 11) augmented = chromatic - 11; else diminished = chromatic - 10; break;
    }
    augmented = Math.abs(augmented); diminished = Math.abs(diminished);
    if (!quality) quality = augmented ? 'A'.repeat(augmented) : diminished ? 'd'.repeat(diminished) : '';
    return `${direction}${quality}${octave * 7 + diatonic + 1}`;
  }

  diatonicChromaticToIntervalClass(diatonic: number, chromatic: number): number { return this.getInterval(this.diatonicChromaticToIntervalName(diatonic, chromatic)); }

  intervalToDiatonicChromatic(intervalClass: number): [number, number];
  intervalToDiatonicChromatic(intervalName: string): [number, number];
  intervalToDiatonicChromatic(v: number | string): [number, number] {
    const s = typeof v === 'number' ? this.getIntervalName(v) : v;
    let direction = 1, i = 0, quality = '', number = '';
    if (s[0] === '-') { direction = -1; i++; } else if (s[0] === '+') i++;
    while (i < s.length && !/[0-9]/.test(s[i])) quality += s[i++];
    while (i < s.length && /[0-9]/.test(s[i])) number += s[i++];
    if (!quality || !number || Number(number) === 0) return [INVALID_INTERVAL_CLASS, INVALID_INTERVAL_CLASS];
    let dnum = Number(number) - 1;
    const octave = Math.floor(dnum / 7); dnum -= octave * 7;
    let chromatic: number;
    switch (dnum) {
      case 0: chromatic = quality[0] === 'A' ? quality.length : quality[0] === 'd' ? -quality.length : quality === 'P' ? 0 : INVALID_INTERVAL_CLASS; break;
      case 1: chromatic = quality === 'M' ? 2 : quality === 'm' ? 1 : quality[0] === 'A' ? 2 + quality.length : quality[0] === 'd' ? 1 - quality.length : INVALID_INTERVAL_CLASS; break;
      case 2: chromatic = quality === 'M' ? 4 : quality === 'm' ? 3 : quality[0] === 'A' ? 4 + quality.length : quality[0] === 'd' ? 3 - quality.length : INVALID_INTERVAL_CLASS; break;
      case 3: chromatic = quality[0] === 'A' ? 5 + quality.length : quality[0] === 'd' ? 5 - quality.length : quality === 'P' ? 5 : INVALID_INTERVAL_CLASS; break;
      case 4: chromatic = quality[0] === 'A' ? 7 + quality.length : quality[0] === 'd' ? 7 - quality.length : quality === 'P' ? 7 : INVALID_INTERVAL_CLASS; break;
      case 5: chromatic = quality === 'M' ? 9 : quality === 'm' ? 8 : quality[0] === 'A' ? 9 + quality.length : quality[0] === 'd' ? 8 - quality.length : INVALID_INTERVAL_CLASS; break;
      default: chromatic = quality === 'M' ? 11 : quality === 'm' ? 10 : quality[0] === 'A' ? 11 + quality.length : quality[0] === 'd' ? 10 - quality.length : INVALID_INTERVAL_CLASS; break;
    }
    if (chromatic === INVALID_INTERVAL_CLASS) return [INVALID_INTERVAL_CLASS, INVALID_INTERVAL_CLASS];
    return [direction * (octave * 7 + dnum), direction * chromatic];
  }

  perfectUnisonClass(): number { return 0; }
  minorSecondClass(): number { return this.m_diatonicMapping[3] - this.m_diatonicMapping[2]; }
  majorSecondClass(): number { return this.m_diatonicMapping[1] - this.m_diatonicMapping[0]; }
  minorThirdClass(): number { return this.m_diatonicMapping[3] - this.m_diatonicMapping[1]; }
  majorThirdClass(): number { return this.m_diatonicMapping[2] - this.m_diatonicMapping[0]; }
  perfectFourthClass(): number { return this.m_diatonicMapping[3] - this.m_diatonicMapping[0]; }
  perfectFifthClass(): number { return this.m_diatonicMapping[4] - this.m_diatonicMapping[0]; }
  minorSixthClass(): number { return this.m_diatonicMapping[5] - this.m_diatonicMapping[0] - 1; }
  majorSixthClass(): number { return this.m_diatonicMapping[5] - this.m_diatonicMapping[0]; }
  minorSeventhClass(): number { return this.m_diatonicMapping[6] - this.m_diatonicMapping[0] - 1; }
  majorSeventhClass(): number { return this.m_diatonicMapping[6] - this.m_diatonicMapping[0]; }
  perfectOctaveClass(): number { return this.m_base; }

  static isValidIntervalName(name: string): boolean { return /(-|\+?)([Pp]|M|m|[aA]+|[dD]+)([1-9][0-9]*)/.test(name); }
  static isValidSemitones(name: string): boolean { return /^(-|\+?)(\d+)$/.test(name); }
  static isValidKeyTonic(name: string): boolean { return /([+]*|[-]*)([A-Ga-g])([Ss#]*|[Ffb]*)/.test(name); }
  isValidIntervalName(name: string): boolean { return HumTransposer.isValidIntervalName(name); }
  isValidSemitones(name: string): boolean { return HumTransposer.isValidSemitones(name); }
  isValidKeyTonic(name: string): boolean { return HumTransposer.isValidKeyTonic(name); }

  getCPitchClass(): number { return this.m_diatonicMapping[0]; }
  getDPitchClass(): number { return this.m_diatonicMapping[1]; }
  getEPitchClass(): number { return this.m_diatonicMapping[2]; }
  getFPitchClass(): number { return this.m_diatonicMapping[3]; }
  getGPitchClass(): number { return this.m_diatonicMapping[4]; }
  getAPitchClass(): number { return this.m_diatonicMapping[5]; }
  getBPitchClass(): number { return this.m_diatonicMapping[6]; }

  private tonicFor(base: number, fifths: number): HumPitch {
    return this.integerPitchToHumPitch((base + this.circleOfFifthsToIntervalClass(fifths)) % this.m_base);
  }
}
