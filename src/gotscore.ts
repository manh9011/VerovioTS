/** Pure-TypeScript port of the initial GotScore parser/state section. */
export interface GotScoreOutput { write(text: string): void; toString(): string; }

export class StringOutput implements GotScoreOutput {
  private chunks: string[] = [];
  write(text: string): void { this.chunks.push(text); }
  toString(): string { return this.chunks.join(''); }
}

export class GotScoreTimedEvent {
  timestamp = 0;
  duration = 0;
  rhythm = '';
  pitch = '';
  isInterpretation = false;
}

export class GotScoreMeasure {
  owner: GotScore | null = null;
  barnum = '';
  linebreak = '';
  text = '';
  error: string[] = [];
  rhythms: string[][] = [];
  pitches: string[][] = [];
  splitRhythms: string[][][] = [];
  splitPitches: string[][][] = [];
  kerns: Array<Array<string | null>> = [];
  diatonic: number[][] = [];
  accid: number[][] = [];
  accidState: number[][] = [];
  voiceEvents: GotScoreTimedEvent[][] = [];

  print(out: GotScoreOutput): void {
    out.write('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n');
    out.write(`!!!BAR: ${this.barnum}\n`);
    for (const message of this.error) out.write(`!!!ERROR: ${message}\n`);
    if (this.text.length > 0) out.write(`!!!TEXT: ${this.text}\n`);
    for (let v = 0; v < this.rhythms.length; v++) {
      out.write(`!!!rhythms-voice-${v + 1}:`);
      for (const value of this.rhythms[v]) out.write(` ${value}`);
      out.write('\n');
    }
    for (let v = 0; v < this.pitches.length; v++) {
      out.write(`!!!pitches-voice-${v + 1}:`);
      for (const value of this.pitches[v]) out.write(` ${value}`);
      out.write('\n');
    }
    for (let v = 0; v < this.splitRhythms.length; v++) {
      out.write(`!!!kern-rhythms-voice-${v + 1}:`);
      for (const word of this.splitRhythms[v]) {
        out.write(' ');
        for (const token of word) out.write(` ${token}`);
      }
      out.write('\n');
    }
    for (let v = 0; v < this.splitPitches.length; v++) {
      out.write(`!!!kern-pitches-voice-${v + 1}:`);
      for (const word of this.splitPitches[v]) {
        out.write(' ');
        for (let p = 0; p < word.length; p++) {
          if (p !== 0) out.write(' ');
          out.write(word[p]);
        }
      }
      out.write('\n');
    }
    for (let i = this.error.length - 1; i >= 0; i--) {
      out.write('!!LO:TX:t=P:problem=');
      if (this.error.length > 1) out.write(`(${i + 1}) `);
      out.write(this.error[i].replaceAll(':', '&colon;'));
      out.write('\n');
    }
    for (let i = 0; i < this.pitches.length; i++) {
      if (i > 0) out.write('\t');
      out.write('2ryy');
    }
    if (this.owner?.textQ) out.write('\t.');
    out.write('\n');
    if (this.linebreak.length > 0) out.write(`!!LO:LB:g=${this.linebreak}\n`);
  }
}

export class GotScore {
  mVoices = 0;
  mPitchHist: number[][] = [];
  textQ = false;
  mLines: string[] = [];
  mCells: string[][] = [];
  mMeasures: GotScoreMeasure[] = [];
  debugQ = false;
  mError = '';
  got = '';
  cautionary = false;
  kern = '';
  noEditorialQ = false;
  cautionaryQ = false;
  modernAccQ = false;

  constructor(input?: string) { if (input !== undefined) this.loadLines(input); }

  clear(): void {
    this.mLines = [];
    this.mCells = [];
    this.mMeasures = [];
    this.got = '';
    this.kern = '';
    this.mError = '';
  }

  loadLines(input: string): void {
    this.clear();
    const raw = input.split(/\n/);
    if (raw.length > 0 && raw[raw.length - 1] === '') raw.pop();
    for (const line of raw) this.mLines.push(line.replace(/[ \n\r\t]+$/, ''));
    this.prepareCells();
  }

  private prepareCells(): void {
    this.mCells = this.mLines.map(line => line.split('\t').map(cell => this.trimSpaces(cell)));
  }

  trimSpaces(value: string): string { return value.replace(/^\s+|\s+$/g, ''); }

  printInputFile(): string {
    const out = new StringOutput();
    for (let i = 0; i < this.mLines.length; i++) out.write(`${i + 1}:\t${this.mLines[i]}\n`);
    return out.toString();
  }

  printCells(): string {
    const out = new StringOutput();
    for (let i = 0; i < this.mCells.length; i++) {
      for (let j = 0; j < this.mCells[i].length; j++) out.write(`${i},${j}:\t${this.mCells[i][j]}\n`);
    }
    return out.toString();
  }

  printMeasures(): string {
    const out = new StringOutput();
    for (const measure of this.mMeasures) measure.print(out);
    return out.toString();
  }

  /** Preflight portion of GotScore::prepareMeasures; full system processing is ported later. */
  prepareMeasures(): boolean {
    const barOnly = /^\s*bar\s*$/;
    const systemBar = /^s(\d+) bar/;
    for (let i = 0; i < this.mCells.length; i++) {
      const first = this.mCells[i]?.[0] ?? '';
      if (barOnly.test(first)) return false;
      if (!systemBar.test(first)) continue;
    }
    return true;
  }
}

export namespace GotScore {
  export const Measure = GotScoreMeasure;
  export const TimedEvent = GotScoreTimedEvent;
}
