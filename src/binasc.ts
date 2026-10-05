/**
 * Pure TypeScript translation of the core token/binary conversion portions of
 * src/midi/Binasc.cpp.  This is intentionally byte-oriented: C++ ostream writes
 * of char/uchar become pushes into Uint8Array-compatible sinks.
 *
 * Pass 12A covers constructor/options, ASCII token processing, VLV/MIDI helper
 * encoders, and explicit endian primitive writers. File-oriented I/O and the
 * MIDI pretty-printer remain IN_PROGRESS for later sub-passes.
 */

export type ByteSink = { writeByte(value: number): void } | { push(value: number): void };

function putByte(out: ByteSink, value: number): void {
  const byte = value & 0xff;
  if ('writeByte' in out) out.writeByte(byte);
  else out.push(byte);
}

export class ByteArraySink {
  public readonly bytes: number[] = [];
  public writeByte(value: number): void { this.bytes.push(value & 0xff); }
  public toUint8Array(): Uint8Array { return Uint8Array.from(this.bytes); }
}

function isDigit(ch: string | undefined): boolean {
  return !!ch && ch >= '0' && ch <= '9';
}

function isHexDigit(ch: string | undefined): boolean {
  return !!ch && /^[0-9a-fA-F]$/.test(ch);
}

function asciiByte(ch: string | undefined): number {
  return ch && ch.length ? ch.charCodeAt(0) & 0xff : 0;
}

export class Binasc {
  // MIDI GM instrument names are public in the C++ implementation only as a
  // private static table; keep the exact spelling/order from the source.
  private static readonly GMinstrument = [
    'acoustic grand piano','bright acoustic piano','electric grand piano','honky-tonk piano','rhodes piano','chorused piano',
    'harpsichord','clavinet','celeste','glockenspiel','music box','vibraphone','marimba','xylophone','tubular bells','dulcimer',
    'hammond organ','percussive organ','rock organ','church organ','reed organ','accordion','harmonica','tango accordion',
    'nylon guitar','steel guitar','jazz guitar','clean guitar','muted guitar','overdriven guitar','distortion guitar','guitar harmonics',
    'acoustic bass','fingered electric bass','picked electric bass','fretless bass','slap bass 1','slap bass 2','synth bass 1','synth bass 2',
    'violin','viola','cello','contrabass','tremolo strings','pizzcato strings','orchestral harp','timpani','string ensemble 1','string ensemble 2',
    'synth strings 1','synth strings 1','choir aahs','voice oohs','synth voices','orchestra hit','trumpet','trombone','tuba','muted trumpet',
    'frenc horn','brass section','syn brass 1','synth brass 2','soprano sax','alto sax','tenor sax','baritone sax','oboe','english horn',
    'bassoon','clarinet','piccolo','flute','recorder','pan flute','bottle blow','shakuhachi','whistle','ocarina','square wave','saw wave',
    'calliope lead','chiffer lead','charang lead','voice lead','fifths lead','brass lead','newage pad','warm pad','polysyn pad','choir pad',
    'bowed pad','metallic pad','halo pad','sweep pad','rain','soundtrack','crystal','atmosphere','brightness','goblins','echoes','sci-fi',
    'sitar','banjo','shamisen','koto','kalimba','bagpipes','fiddle','shanai','tinkle bell','agogo','steel drums','woodblock','taiko drum',
    'melodoc tom','synth drum','reverse cymbal','guitar fret noise','breath noise','seashore','bird tweet','telephone ring','helicopter','applause','gunshot'
  ];

  protected m_bytesQ: number;
  protected m_commentsQ: number;
  protected m_midiQ: number;
  protected m_maxLineLength: number;
  protected m_maxLineBytes: number;

  public constructor() {
    this.m_bytesQ = 1;
    this.m_commentsQ = 0;
    this.m_midiQ = 0;
    this.m_maxLineLength = 75;
    this.m_maxLineBytes = 25;
  }

  public setLineLength(length: number): number {
    this.m_maxLineLength = length < 1 ? 75 : length;
    return this.m_maxLineLength;
  }

  public getLineLength(): number { return this.m_maxLineLength; }

  public setLineBytes(length: number): number {
    this.m_maxLineBytes = length < 1 ? 25 : length;
    return this.m_maxLineBytes;
  }

  // Preserve the upstream C++ implementation's behavior: this returns
  // m_maxLineLength rather than m_maxLineBytes.
  public getLineBytes(): number { return this.m_maxLineLength; }

  public setComments(state: number | boolean): void { this.m_commentsQ = state ? 1 : 0; }
  public setCommentsOn(): void { this.setComments(true); }
  public setCommentsOff(): void { this.setComments(false); }
  public getComments(): number { return this.m_commentsQ; }

  public setBytes(state: number | boolean): void { this.m_bytesQ = state ? 1 : 0; }
  public setBytesOn(): void { this.setBytes(true); }
  public setBytesOff(): void { this.setBytes(false); }
  public getBytes(): number { return this.m_bytesQ; }

  public setMidi(state: number | boolean): void { this.m_midiQ = state ? 1 : 0; }
  public setMidiOn(): void { this.setMidi(true); }
  public setMidiOff(): void { this.setMidi(false); }
  public getMidi(): number { return this.m_midiQ; }

  public processLine(out: ByteSink, input: string, lineCount: number): number {
    let status = 1;
    let i = 0;
    const length = input.length;
    let word = '';

    while (i < length) {
      const ch = input[i];
      if (ch === ';' || ch === '#' || ch === '/') return status;
      if (ch === ' ' || ch === '\n' || ch === '\t') { i++; continue; }
      if (ch === '+') {
        [word, i] = this.getWord(input, ' \n\t', i);
        status = this.processAsciiWord(out, word, lineCount);
      } else if (ch === '"') {
        [word, i] = this.getWord(input, '"', i);
        status = this.processStringWord(out, word, lineCount);
      } else if (ch === 'v') {
        [word, i] = this.getWord(input, ' \n\t', i);
        status = this.processVlvWord(out, word, lineCount);
      } else if (ch === 'p') {
        [word, i] = this.getWord(input, ' \n\t', i);
        status = this.processMidiPitchBendWord(out, word, lineCount);
      } else if (ch === 't') {
        [word, i] = this.getWord(input, ' \n\t', i);
        status = this.processMidiTempoWord(out, word, lineCount);
      } else {
        [word, i] = this.getWord(input, ' \n\t', i);
        if (word.includes("'")) status = this.processDecimalWord(out, word, lineCount);
        else if (word.includes(',') || word.length > 2) status = this.processBinaryWord(out, word, lineCount);
        else status = this.processHexWord(out, word, lineCount);
      }
      if (!status) return 0;
    }
    return 1;
  }

  public getWord(input: string, terminators: string, index: number): [string, number] {
    let word = '';
    let i = index;
    let escape = terminators.includes('"');
    let ecount = 0;
    while (i < input.length) {
      if (escape && input[i] === '"') {
        ecount++;
        i++;
        if (ecount >= 2) break;
      }
      if (escape && i < input.length - 1 && input[i] === '\\' && input[i + 1] === '"') {
        word += input[i + 1];
        i += 2;
      } else if (!terminators.includes(input[i])) {
        word += input[i];
        i++;
      } else {
        i++;
        return [word, i];
      }
    }
    return [word, i];
  }

  public static keyToPitchName(key: number): string {
    const pc = key % 12;
    const octave = Math.trunc(key / 12) - 1;
    const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    return `${names[pc] ?? ''}${octave}`;
  }

  public static writeLittleEndianUShort(out: ByteSink, value: number): void {
    putByte(out, value); putByte(out, value >> 8);
  }
  public static writeBigEndianUShort(out: ByteSink, value: number): void {
    putByte(out, value >> 8); putByte(out, value);
  }
  public static writeLittleEndianShort(out: ByteSink, value: number): void {
    const v = value & 0xffff; putByte(out, v); putByte(out, v >> 8);
  }
  public static writeBigEndianShort(out: ByteSink, value: number): void {
    const v = value & 0xffff; putByte(out, v >> 8); putByte(out, v);
  }
  public static writeLittleEndianULong(out: ByteSink, value: number): void {
    putByte(out, value); putByte(out, value >> 8); putByte(out, value >> 16); putByte(out, value >> 24);
  }
  public static writeBigEndianULong(out: ByteSink, value: number): void {
    putByte(out, value >> 24); putByte(out, value >> 16); putByte(out, value >> 8); putByte(out, value);
  }
  public static writeLittleEndianLong(out: ByteSink, value: number): void { this.writeLittleEndianULong(out, value); }
  public static writeBigEndianLong(out: ByteSink, value: number): void { this.writeBigEndianULong(out, value); }

  public static writeLittleEndianFloat(out: ByteSink, value: number): void {
    const bytes = new Uint8Array(4); new DataView(bytes.buffer).setFloat32(0, value, true); for (const b of bytes) putByte(out, b);
  }
  public static writeBigEndianFloat(out: ByteSink, value: number): void {
    const bytes = new Uint8Array(4); new DataView(bytes.buffer).setFloat32(0, value, false); for (const b of bytes) putByte(out, b);
  }
  public static writeLittleEndianDouble(out: ByteSink, value: number): void {
    const bytes = new Uint8Array(8); new DataView(bytes.buffer).setFloat64(0, value, true); for (const b of bytes) putByte(out, b);
  }
  public static writeBigEndianDouble(out: ByteSink, value: number): void {
    const bytes = new Uint8Array(8); new DataView(bytes.buffer).setFloat64(0, value, false); for (const b of bytes) putByte(out, b);
  }

  protected processStringWord(out: ByteSink, word: string, _lineNum: number): number {
    for (const ch of word) putByte(out, asciiByte(ch));
    return 1;
  }

  protected processAsciiWord(out: ByteSink, word: string, lineNum: number): number {
    if (word[0] !== '+') return this.error(lineNum, word, "character byte must start with '+' sign");
    if (word.length > 2) return this.error(lineNum, word, 'character byte word is too long -- specify only one character');
    putByte(out, word.length === 2 ? asciiByte(word[1]) : 0x20);
    return 1;
  }

  protected processHexWord(out: ByteSink, word: string, lineNum: number): number {
    if (word.length > 2) return this.error(lineNum, word, 'Size of hexadecimal number is too large.  Max is ff.');
    if (!isHexDigit(word[0]) || (word.length === 2 && !isHexDigit(word[1]))) return this.error(lineNum, word, 'Invalid character in hexadecimal number.');
    putByte(out, Number.parseInt(word, 16));
    return 1;
  }

  protected processBinaryWord(out: ByteSink, word: string, lineNum: number): number {
    let commaIndex = -1;
    for (let i = 0; i < word.length; i++) {
      if (word[i] === ',') {
        if (commaIndex !== -1) return this.error(lineNum, word, 'extra comma in binary number');
        commaIndex = i;
      } else if (word[i] !== '0' && word[i] !== '1') {
        return this.error(lineNum, word, `Invalid character in binary number (character is ${word[i]})`);
      }
    }
    if (commaIndex === 0) return this.error(lineNum, word, 'cannot start binary number with a comma');
    if (commaIndex === word.length - 1) return this.error(lineNum, word, 'cannot end binary number with a comma');

    const leftDigits = commaIndex === -1 ? -1 : commaIndex;
    const rightDigits = commaIndex === -1 ? -1 : word.length - commaIndex - 1;
    if (commaIndex === -1 && word.length > 8) return this.error(lineNum, word, 'too many digits in binary number');
    if (leftDigits > 4) return this.error(lineNum, word, 'too many digits to left of comma');
    if (rightDigits > 4) return this.error(lineNum, word, 'too many digits to right of comma');

    let output = 0;
    if (commaIndex === -1) {
      for (const ch of word) output = ((output << 1) | (ch.charCodeAt(0) - 48)) & 0xff;
    } else {
      for (let i = 0; i < leftDigits; i++) output = ((output << 1) | (word.charCodeAt(i) - 48)) & 0xff;
      output = (output << (4 - rightDigits)) & 0xff;
      for (let i = commaIndex + 1; i < commaIndex + 1 + rightDigits; i++) output = ((output << 1) | (word.charCodeAt(i) - 48)) & 0xff;
    }
    putByte(out, output);
    return 1;
  }

  protected processVlvWord(out: ByteSink, word: string, lineNum: number): number {
    if (word.length < 2 || !isDigit(word[1])) return this.error(lineNum, word, "'v' needs to be followed immediately by a decimal digit");
    const value = Number.parseInt(word.slice(1), 10) >>> 0;
    const bytes = [
      (value >>> 28) & 0x7f, (value >>> 21) & 0x7f, (value >>> 14) & 0x7f,
      (value >>> 7) & 0x7f, value & 0x7f
    ];
    let flag = 0;
    for (let i = 0; i < 4; i++) { if (bytes[i] !== 0) flag = 1; if (flag) bytes[i] |= 0x80; }
    for (let i = 0; i < 5; i++) if (bytes[i] >= 0x80 || i === 4) putByte(out, bytes[i]);
    return 1;
  }

  protected processMidiTempoWord(out: ByteSink, word: string, lineNum: number): number {
    if (word.length < 2 || !/[0-9.\-+]/.test(word[1])) return this.error(lineNum, word, "'t' needs to be followed immediately by a floating-point number");
    let value = Number.parseFloat(word.slice(1));
    if (value < 0) value = -value;
    const intval = Math.trunc(60_000_000 / value + 0.5);
    putByte(out, intval >>> 16); putByte(out, intval >>> 8); putByte(out, intval);
    return 1;
  }

  protected processMidiPitchBendWord(out: ByteSink, word: string, lineNum: number): number {
    if (word.length < 2 || !/[0-9.\-+]/.test(word[1])) return this.error(lineNum, word, "'p' needs to be followed immediately by a floating-point number");
    let value = Number.parseFloat(word.slice(1));
    if (value > 1) value = 1; if (value < -1) value = -1;
    const intval = Math.trunc(((1 << 13) - 0.5) * (value + 1) + 0.5);
    putByte(out, intval & 0x7f); putByte(out, (intval >> 7) & 0x7f);
    return 1;
  }

  protected processDecimalWord(out: ByteSink, word: string, lineNum: number): number {
    let byteCount = -1;
    let quoteIndex = -1;
    let signIndex = -1;
    let periodIndex = -1;
    let endianIndex = -1;

    for (let i = 0; i < word.length; i++) {
      switch (word[i]) {
        case "'":
          if (quoteIndex !== -1) return this.error(lineNum, word, 'extra quote in decimal number');
          quoteIndex = i; break;
        case '-':
          if (signIndex !== -1) return this.error(lineNum, word, 'cannot have more than two minus signs in number');
          signIndex = i;
          if (i === 0 || word[i - 1] !== "'") return this.error(lineNum, word, 'minus sign must immediately follow quote mark');
          break;
        case '.':
          if (quoteIndex === -1) return this.error(lineNum, word, 'cannot have decimal marker before quote');
          if (periodIndex !== -1) return this.error(lineNum, word, 'extra period in decimal number');
          periodIndex = i; break;
        case 'u': case 'U':
          if (quoteIndex !== -1) return this.error(lineNum, word, 'cannot have endian specified after quote');
          if (endianIndex !== -1) return this.error(lineNum, word, 'extra "u" in decimal number');
          endianIndex = i; break;
        case '8': case '1': case '2': case '3': case '4':
          if (quoteIndex === -1 && byteCount !== -1) return this.error(lineNum, word, 'invalid byte specification before quote in decimal number');
          if (quoteIndex === -1) byteCount = Number(word[i]);
          break;
        case '0': case '5': case '6': case '7': case '9':
          if (quoteIndex === -1) return this.error(lineNum, word, 'cannot have numbers before quote in decimal number');
          break;
        default:
          return this.error(lineNum, word, `Invalid character in decimal number (character number ${i})`);
      }
    }

    if (quoteIndex === -1) return this.error(lineNum, word, 'there must be a quote to signify a decimal number');
    if (quoteIndex === word.length - 1) return this.error(lineNum, word, 'there must be a decimal number after the quote');
    if (periodIndex === -1 && byteCount === 8) return this.error(lineNum, word, 'only floating-point numbers can use 8 bytes');
    if (periodIndex !== -1 && byteCount === -1) byteCount = 4;

    const numberText = word.slice(quoteIndex + 1);
    if (periodIndex !== -1) {
      const value = Number.parseFloat(numberText);
      if (byteCount === 4) {
        if (endianIndex === -1) Binasc.writeBigEndianFloat(out, value); else Binasc.writeLittleEndianFloat(out, value);
        return 1;
      }
      if (byteCount === 8) {
        if (endianIndex === -1) Binasc.writeBigEndianDouble(out, value); else Binasc.writeLittleEndianDouble(out, value);
        return 1;
      }
      return this.error(lineNum, word, 'floating-point numbers can be only 4 or 8 bytes');
    }

    if (byteCount === -1) {
      const value = Number.parseInt(numberText, 10);
      if (signIndex !== -1) {
        if (value > 127 || value < -128) return this.error(lineNum, word, 'Decimal number out of range from -128 to 127');
        putByte(out, value);
      } else {
        if (value > 255) return this.error(lineNum, word, 'Decimal number out of range from 0 to 255');
        putByte(out, value);
      }
      return 1;
    }

    const value = Number.parseInt(numberText, 10);
    switch (byteCount) {
      case 1: putByte(out, value); return 1;
      case 2:
        if (signIndex !== -1) {
          if (endianIndex === -1) Binasc.writeBigEndianShort(out, value); else Binasc.writeLittleEndianShort(out, value);
        } else {
          if (endianIndex === -1) Binasc.writeBigEndianUShort(out, value); else Binasc.writeLittleEndianUShort(out, value);
        }
        return 1;
      case 3:
        if (signIndex !== -1) return this.error(lineNum, word, 'negative decimal numbers cannot be stored in 3 bytes');
        if (endianIndex === -1) { putByte(out, value >> 16); putByte(out, value >> 8); putByte(out, value); }
        else { putByte(out, value); putByte(out, value >> 8); putByte(out, value >> 16); }
        return 1;
      case 4:
        if (signIndex !== -1) {
          if (endianIndex === -1) Binasc.writeBigEndianLong(out, value); else Binasc.writeLittleEndianLong(out, value);
        } else {
          if (endianIndex === -1) Binasc.writeBigEndianULong(out, value); else Binasc.writeLittleEndianULong(out, value);
        }
        return 1;
      default: return this.error(lineNum, word, 'invalid byte count specification for decimal number');
    }
  }

  private error(lineNum: number, word: string, message: string): 0 {
    // C++ emits diagnostics to stderr and returns 0.  The TS migration keeps
    // the status contract while avoiding a mandatory process-global logger.
    void lineNum; void word; void message;
    return 0;
  }
}

export { isDigit, isHexDigit };
