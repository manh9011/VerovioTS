/**
 * Pure-TypeScript migration of the foundational humlib value/regex classes.
 * This file is intentionally independent of WASM/native humlib.
 * The parent humlib.cpp migration remains IN_PROGRESS in AGENTS.md.
 */

export const INVALID_INTERVAL_CLASS = -123456789;
export const dpc_rest = -1;
export const dpc_C = 0, dpc_D = 1, dpc_E = 2, dpc_F = 3, dpc_G = 4, dpc_A = 5, dpc_B = 6;

export class HumNum {
  private top: number;
  private bot: number;
  constructor(value?: number | HumNum | string, denominator?: number) {
    this.top = 0; this.bot = 1;
    if (value instanceof HumNum) { this.top = value.top; this.bot = value.bot; }
    else if (typeof value === 'string') this.setValue(value);
    else if (typeof value === 'number' && denominator !== undefined) this.setValue(value, denominator);
    else if (typeof value === 'number') this.setValue(value);
  }
  isNegative() { return this.isFinite() && this.top < 0; }
  isPositive() { return this.isFinite() && this.top > 0; }
  isZero() { return this.isFinite() && this.top === 0; }
  isNonZero() { return this.isFinite() && this.top !== 0; }
  isNonNegative() { return this.isFinite() && this.top >= 0; }
  // Preserves the C++ implementation verbatim: it checks top >= 0.
  isNonPositive() { return this.isFinite() && this.top >= 0; }
  getFloat() { return this.top / this.bot; }
  toFloat() { return this.getFloat(); }
  getInteger(round = 0) { return this.top < 0 ? -Math.trunc(-this.top / this.bot + round) : Math.trunc(this.top / this.bot + round); }
  toInteger(round = 0) { return this.getInteger(round); }
  getNumerator() { return this.top; }
  getDenominator() { return this.bot; }
  getRemainder() { return this.sub(this.getInteger()); }
  // C++ HumNum stores 32-bit int top/bot; arithmetic below wraps with |0
  // to replicate WASM overflow behavior (ground truth).
  static wrap(v: number): number { return Math.trunc(v) | 0; }
  // ponytail: BigInt intermediates only where C++ int products can exceed 2^53
  // (long scores accumulate huge timestamps); upgrade path is none, C++ is int32.
  private static wBig(v: bigint): number { const m = v & 0xFFFFFFFFn; return m >= 0x80000000n ? Number(m - 0x100000000n) : Number(m); }
  private static mul32(a: number, b: number): number { return HumNum.wBig(BigInt(Math.trunc(a)) * BigInt(Math.trunc(b))); }
  setValue(numerator: number, denominator?: number): void;
  setValue(value: string): void;
  setValue(numeratorOrValue: number | string, denominator = 1) {
    if (typeof numeratorOrValue === 'string') {
      let n = 0, d = 0, slash = 0;
      for (let i = 0; i < numeratorOrValue.length; i++) {
        const ch = numeratorOrValue[i];
        if (ch === '/') { slash = 1; continue; }
        if (!/[0-9]/.test(ch)) break;
        if (slash) d = d * 10 + (ch.charCodeAt(0) - 48); else n = n * 10 + (ch.charCodeAt(0) - 48);
      }
      if (d === 0) d = 1;
      this.setValue(n, d);
      return;
    }
    this.top = HumNum.wrap(numeratorOrValue); this.bot = HumNum.wrap(denominator); this.reduce();
  }
  invert() { const t = this.top; this.top = this.bot; this.bot = t; }
  getAbs() { const r = new HumNum(this); if (r.isNegative()) r.setValue(-this.top, this.bot); return r; }
  makeAbs() { if (!this.isNonNegative()) this.top = -this.top; return this; }
  assign(value: HumNum | number) { if (value instanceof HumNum) this.setValue(value.top, value.bot); else this.setValue(value); return this; }
  add(value: HumNum | number) {
    if (value instanceof HumNum) {
      const ao = HumNum.wBig(BigInt(this.top) * BigInt(value.bot) + BigInt(value.top) * BigInt(this.bot));
      return new HumNum(ao, HumNum.mul32(this.bot, value.bot));
    }
    return new HumNum(HumNum.wBig(BigInt(this.top) + BigInt(Math.trunc(value)) * BigInt(this.bot)), this.bot);
  }
  sub(value: HumNum | number) {
    if (value instanceof HumNum) {
      const ao = HumNum.wBig(BigInt(this.top) * BigInt(value.bot) - BigInt(value.top) * BigInt(this.bot));
      return new HumNum(ao, HumNum.mul32(this.bot, value.bot));
    }
    return new HumNum(HumNum.wBig(BigInt(this.top) - BigInt(Math.trunc(value)) * BigInt(this.bot)), this.bot);
  }
  mul(value: HumNum | number) {
    if (value instanceof HumNum) return new HumNum(HumNum.mul32(this.top, value.top), HumNum.mul32(this.bot, value.bot));
    return new HumNum(HumNum.mul32(this.top, Math.trunc(value)), this.bot);
  }
  div(value: HumNum | number) {
    if (value instanceof HumNum) return new HumNum(HumNum.mul32(this.top, value.bot), HumNum.mul32(this.bot, value.top));
    let a = this.top, b = this.bot;
    if (value < 0) { a = -a; b = HumNum.mul32(b, -Math.trunc(value)); } else b = HumNum.mul32(b, Math.trunc(value));
    return new HumNum(a, b);
  }
  neg() { return new HumNum(-this.top, this.bot); }
  equals(value: HumNum | number) { return this.getFloat() === (value instanceof HumNum ? value.getFloat() : value); }
  /** Exact rational equality; `equals()` goes through float and can disagree on long scores. */
  equalsExact(value: HumNum | number) {
    if (typeof value === 'number' && !Number.isInteger(value)) return this.equals(value);
    const b = value instanceof HumNum ? value.bot : 1;
    const a = value instanceof HumNum ? value.top : value;
    return this.top * b === a * this.bot;
  }
  notEquals(value: HumNum | number) { return !this.equals(value); }
  less(value: HumNum | number) { return this.getFloat() < (value instanceof HumNum ? value.getFloat() : value); }
  lessOrEqual(value: HumNum | number) { return this.getFloat() <= (value instanceof HumNum ? value.getFloat() : value); }
  greater(value: HumNum | number) { return this.getFloat() > (value instanceof HumNum ? value.getFloat() : value); }
  greaterOrEqual(value: HumNum | number) { return this.getFloat() >= (value instanceof HumNum ? value.getFloat() : value); }
  isInfinite() { return this.bot === 0 && this.top !== 0; }
  isFinite() { return this.bot !== 0; }
  isNaN() { return this.bot === 0 && this.top === 0; }
  isInteger() { return this.isFinite() && this.bot === 1; }
  isPowerOfTwo() {
    if (this.top === 0) return false;
    const a = Math.abs(this.top);
    if (this.bot === 1) return (a & (a - 1)) === 0;
    if (a === 1) return (this.bot & (this.bot - 1)) === 0;
    return false;
  }
  printFraction() { return this.isInteger() ? String(this.top) : `${this.top}/${this.bot}`; }
  printMixedFraction(separator = '_') {
    if (this.isInteger()) return String(this.top);
    if (this.top > this.bot) { const i = this.getInteger(); const r = this.top - i * this.bot; return `${i}${separator}${r}/${this.bot}`; }
    return this.printFraction();
  }
  printTwoPart(spacer = '+') {
    let tnum = this.top, tden = this.bot, sign = 1;
    if (tnum < 0) { tnum = -tnum; sign = -sign; }
    if (tden < 0) { tden = -tden; sign = -sign; }
    if (tnum < tden) return this.printFraction();
    const integ = Math.trunc(tnum / tden); tnum -= tden * integ;
    let out = sign < 0 ? '-' : '';
    if (integ > 0) { out += String(integ); if (tnum > 0) out += spacer + new HumNum(tnum, tden).printFraction(); }
    else out += new HumNum(tnum, tden).printFraction();
    return out;
  }
  printList() { return `(${this.top}, ${this.bot})`; }
  private reduce() {
    let a = this.top, b = this.bot;
    if (a === 1 || b === 1) return;
    if (a === 0) { this.bot = 1; return; }
    if (b === 0) { this.top = 0; this.bot = 0; return; }
    const g = this.gcdIterative(a, b); if (g > 1) { this.top = Math.trunc(this.top / g); this.bot = Math.trunc(this.bot / g); }
  }
  private gcdIterative(a: number, b: number) { while (b) { const c = a; a = b; b = c % b; } return a < 0 ? -a : a; }
  gcdRecursive(a: number, b: number): number { if (a < 0) a = -a; return b ? this.gcdRecursive(b, a % b) : a; }
  valueOf() { return this.getFloat(); }
  toString() { return this.printFraction(); }
}


export type HumParamToken = string | null;

export class HumParamSet {
  private m_token: HumParamToken = null;
  private m_ns1 = '';
  private m_ns2 = '';
  private m_parameters: Array<[string, string]> = [];

  constructor(token?: string) {
    if (token !== undefined) this.readString(token);
  }

  getNamespace1(): string { return this.m_ns1; }
  getNamespace2(): string { return this.m_ns2; }
  getNamespace(): string { return `${this.m_ns1}:${this.m_ns2}`; }
  setNamespace1(name: string): void { this.m_ns1 = name; }
  setNamespace2(name: string): void { this.m_ns2 = name; }
  setNamespace(name: string): void {
    const loc = name.indexOf(':');
    if (loc < 0) { this.m_ns1 = ''; this.m_ns2 = name; }
    else { this.m_ns1 = name.slice(0, loc); this.m_ns2 = name.slice(loc + 1); }
  }
  setNamespacePair(name1: string, name2: string): void { this.m_ns1 = name1; this.m_ns2 = name2; }
  getToken(): HumParamToken { return this.m_token; }
  clear(): void { this.m_token = null; this.m_ns1 = ''; this.m_ns2 = ''; this.m_parameters = []; }
  getCount(): number { return this.m_parameters.length; }
  getParameterName(index: number): string {
    if (index < 0 || index >= this.m_parameters.length) throw new RangeError(`parameter index ${index} out of range`);
    return this.m_parameters[index][0];
  }
  getParameterValue(index: number): string {
    if (index < 0 || index >= this.m_parameters.length) throw new RangeError(`parameter index ${index} out of range`);
    return this.m_parameters[index][1];
  }
  addParameter(name: string, value: string): number { this.m_parameters.push([name, value]); return this.m_parameters.length - 1; }
  setParameter(name: string, value: string): number {
    for (let i = 0; i < this.m_parameters.length; i++) {
      if (this.m_parameters[i][0] === name) { this.m_parameters[i][1] = value; return i; }
    }
    this.m_parameters.push([name, value]);
    return this.m_parameters.length - 1;
  }
  readString(token: string): void {
    this.m_token = token;
    const pieces: string[] = [''];
    let bangs = true;
    for (const ch of token) {
      if (bangs && ch === '!') continue;
      bangs = false;
      if (ch === ':') pieces.push('');
      else pieces[pieces.length - 1] += ch;
    }
    if (pieces.length < 3) return;
    this.m_ns1 = pieces[0];
    this.m_ns2 = pieces[1];
    for (let i = 2; i < pieces.length; i++) {
      const piece = pieces[i].split('&colon;').join(':');
      const loc = piece.indexOf('=');
      if (loc >= 0) this.addParameter(piece.slice(0, loc), piece.slice(loc + 1));
      else this.addParameter(piece, 'true');
    }
  }
  printXml(level = 0, indent = '\t'): string {
    if (this.getCount() === 0) return '';
    const repeat = (n: number) => indent.repeat(n);
    const xml = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    let out = `${repeat(level++)}<linked-parameter-set>\n`;
    out += `${repeat(level++)}<namespace n="1" name="${xml(this.getNamespace1())}">\n`;
    out += `${repeat(level++)}<namespace n="2" name="${xml(this.getNamespace2())}">\n`;
    for (let i = 0; i < this.getCount(); i++) out += `${repeat(level)}<parameter key="${xml(this.getParameterName(i))}" value="${xml(this.getParameterValue(i))}"/>\n`;
    out += `${repeat(--level)}</namespace>\n${repeat(--level)}</namespace>\n${repeat(--level)}</linked-parameter-set>\n`;
    return out;
  }
  toString(): string {
    let out = this.getNamespace();
    for (const [name, value] of this.m_parameters) out += `:${name}==${value}`;
    return out;
  }
}

export class HumPitch {
  private m_diatonicpc = -1;
  private m_accid = 0;
  private m_oct = 0;
  private static readonly lc = ['c','d','e','f','g','a','b'];
  private static readonly uc = ['C','D','E','F','G','A','B'];
  constructor(aDiatonic?: number, anAccid?: number, anOct?: number) { if (aDiatonic !== undefined) this.setPitch(aDiatonic, anAccid ?? 0, anOct ?? 0); }
  setPitch(d: number, a: number, o: number) { this.m_diatonicpc = d; this.m_accid = a; this.m_oct = o; }
  isValid(maxAccid: number) { return Math.abs(this.m_accid) <= Math.abs(maxAccid); }
  isRest() { return this.m_diatonicpc < 0; }
  makeRest() { this.m_diatonicpc = -1; this.m_accid = 0; this.m_oct = 0; }
  getOctave() { return this.m_oct; } getAccid() { return this.m_accid; }
  getDiatonicPitchClass() { return this.m_diatonicpc; } getDiatonicPC() { return this.m_diatonicpc; }
  setOctave(o: number) { this.m_oct = o; } setAccid(a: number) { this.m_accid = a; }
  makeSharp() { this.m_accid = 1; } makeFlat() { this.m_accid = -1; } makeNatural() { this.m_accid = 0; }
  setDiatonicPitchClass(v: number) { this.m_diatonicpc = v < 0 ? -1 : v < 7 ? v : v >= 65 && v <= 71 ? (v - 65 + 5) % 7 : v >= 97 && v <= 103 ? (v - 97 + 5) % 7 : -1; }
  setDiatonicPC(v: number) { this.setDiatonicPitchClass(v); }
  getKernPitch() {
    if (this.m_diatonicpc < 0) return 'r';
    let count: number, letter: string;
    if (this.m_oct < 4) { letter = HumPitch.uc[this.m_diatonicpc]; count = 4 - this.m_oct; }
    else { count = this.m_oct - 4 + 1; letter = HumPitch.lc[this.m_diatonicpc]; }
    let out = letter.repeat(count);
    if (this.m_accid < 0) out += '-'.repeat(-this.m_accid); else if (this.m_accid > 0) out += '#'.repeat(this.m_accid);
    return out;
  }
  setKernPitch(kern: string) {
    this.makeRest(); if (kern.includes('r')) return true;
    const m = kern.match(/(A+|B+|C+|D+|E+|F+|G+|a+|b+|c+|d+|e+|f+|g+)(-+|#+)?/); if (!m) return false;
    const letters = m[1], accidentals = m[2] ?? '';
    if (accidentals) { this.m_accid = accidentals.length * (accidentals[0] === '-' ? -1 : 1); }
    const lcount = letters.length; this.m_oct = /[a-g]/.test(letters[0]) ? 3 + lcount : 4 - lcount; this.m_diatonicpc = (letters[0].toLowerCase().charCodeAt(0) - 97 + 5) % 7; return true;
  }
  getScientificPitch() {
    if (this.m_diatonicpc < 0) return 'R';
    let out = HumPitch.uc[this.m_diatonicpc]; if (this.m_accid < 0) out += 'b'.repeat(-this.m_accid); else if (this.m_accid > 0) out += '#'.repeat(this.m_accid); out = String(this.m_oct); return out;
  }
  setScientificPitch(pitch: string) {
    this.makeRest(); const m = pitch.match(/([A-Ga-g])(b+|#+)?(-?\d+)/); if (!m) return false;
    const accidental = m[2] ?? ''; this.m_oct = Number(m[3]); if (accidental) { this.m_accid = accidental.length; if (accidental[0] === 'f') this.m_accid = -this.m_accid; }
    this.m_diatonicpc = (m[1].toUpperCase().charCodeAt(0) - 65 + 5) % 7; return true;
  }
  toString() { if (this.isRest()) return `R${this.m_oct}`; const a = this.m_accid > 0 ? '#'.repeat(this.m_accid) : 'b'.repeat(-this.m_accid); return HumPitch.uc[this.m_diatonicpc] + a + this.m_oct; }
}

export class HumRegex {
  private regex: RegExp = /(?:)/;
  private matches: RegExpExecArray | null = null;
  private matchInput = '';
  private matchBase = 0;
  private ignoreCase = false;
  private global = false;

  constructor(exp?: string, options = '') {
    if (exp !== undefined) {
      this.ignoreCase = this.getTemporaryRegexIgnoreCase(options);
      this.global = this.getTemporarySearchGlobal(options);
      this.compile(exp, options);
    }
  }

  setIgnoreCase() { this.ignoreCase = true; }
  getIgnoreCase() { return this.ignoreCase; }
  unsetIgnoreCase() { this.ignoreCase = false; }
  setGlobal() { this.global = true; }
  getGlobal() { return this.global; }
  unsetGlobal() { this.global = false; }

  private getTemporaryRegexIgnoreCase(options: string): boolean {
    let v = this.ignoreCase;
    for (const ch of options) {
      if (ch === 'i') v = true;
      else if (ch === 'I') v = false;
    }
    return v;
  }

  private getTemporarySearchGlobal(options: string): boolean {
    let v = this.global;
    for (const ch of options) {
      if (ch === 'g') v = true;
      else if (ch === 'G') v = false;
    }
    return v;
  }

  private compile(exp: string, options = '', replacementMode = false) {
    const icase = this.getTemporaryRegexIgnoreCase(options);
    const global = this.getTemporarySearchGlobal(options);
    const flags = `${icase ? 'i' : ''}${global || replacementMode ? 'g' : ''}`;
    this.regex = new RegExp(exp, flags);
  }

  private recordMatch(input: string, base: number, re: RegExp): boolean {
    this.matchInput = input;
    this.matchBase = base;
    const view = input.slice(base);
    re.lastIndex = 0;
    const m = re.exec(view);
    this.matches = m;
    return m !== null;
  }

  search(input: string, exp: string): number;
  search(input: string, startindex: number, exp: string): number;
  search(input: string, exp: string, options?: string): number;
  search(input: string, startindex: number, exp: string, options: string): number;
  search(input: string, startindexOrExp: number | string, expOrOptions?: string, options?: string): number {
    const start = typeof startindexOrExp === 'number' ? startindexOrExp : 0;
    const exp = typeof startindexOrExp === 'number' ? (expOrOptions ?? '') : startindexOrExp;
    const opts = typeof startindexOrExp === 'number' ? (options ?? '') : (expOrOptions ?? '');
    this.compile(exp, opts);
    if (start < 0 || start > input.length) { this.matches = null; this.matchInput = input; this.matchBase = Math.max(0, start); return 0; }
    const ok = this.recordMatch(input, start, this.regex);
    if (!ok || !this.matches || this.matches.length < 1) return 0;
    // C++ returns position()+1 relative to the search iterator for the overload with startindex.
    return (this.matches.index ?? 0) + 1;
  }

  match(input: string, exp: string, options = '') {
    this.compile(exp, options);
    this.regex.lastIndex = 0;
    return this.regex.test(input);
  }

  replaceDestructive(input: string, replacement: string, exp: string, options = ''): string {
    this.compile(exp, options, false);
    return input.replace(this.regex, replacement);
  }

  replaceCopy(input: string, replacement: string, exp: string, options = '') {
    this.compile(exp, options);
    return input.replace(this.regex, replacement);
  }

  makeSafeCopy(input: string) {
    // Matches the source's special-character class, including whitespace and '#'.
    return input.replace(/[\-\[\]{}()*+?.,\^$|#\s]/g, '\\$&');
  }

  makeSafeDestructive(inout: string) {
    return this.makeSafeCopy(inout);
  }

  tr(input: string, from: string, to: string) {
    const map = new Map<number, string>();
    const n = Math.min(from.length, to.length);
    for (let i = 0; i < n; i++) map.set(from.charCodeAt(i), to[i]);
    const chars = Array.from(input);
    for (let i = 0; i < chars.length; i++) {
      const repl = map.get(chars[i].charCodeAt(0));
      if (repl !== undefined) chars[i] = repl;
    }
    return chars.join('');
  }

  getMatchCount() { return this.matches?.length ?? 0; }
  getMatch(i: number) { return i < 0 || !this.matches || i >= this.matches.length ? '' : (this.matches[i] ?? ''); }
  getMatchInt(i: number) {
    const value = this.getMatch(i);
    if (!value || !/^[+-]?\d/.test(value)) return 0;
    const n = Number.parseInt(value, 10);
    return Number.isNaN(n) ? 0 : n;
  }
  getMatchDouble(i: number) {
    const value = this.getMatch(i);
    if (!value) return 0;
    const n = Number.parseFloat(value);
    return Number.isNaN(n) ? 0 : n;
  }
  getPrefix() {
    if (!this.matches) return '';
    return this.matchInput.slice(this.matchBase, this.matchBase + (this.matches.index ?? 0));
  }
  getSuffix() {
    if (!this.matches) return '';
    const end = this.matchBase + (this.matches.index ?? 0) + this.getMatchLength(0);
    return this.matchInput.slice(end);
  }
  getMatchStartIndex(i = 0) {
    if (!this.matches || i < 0 || i >= this.matches.length) return -1;
    // std::smatch::position(i) is relative to the iterator supplied to regex_search.
    if (i === 0) return this.matches.index ?? 0;
    const wholeStart = this.matches.index ?? 0;
    const whole = this.matches[0] ?? '';
    const sub = this.matches[i] ?? '';
    if (sub === '') return -1;
    const p = this.matchInput.slice(this.matchBase + wholeStart).indexOf(sub);
    return p >= 0 ? wholeStart + p : -1;
  }
  getMatchEndIndex(i = 0) { const start = this.getMatchStartIndex(i); return start < 0 ? -1 : start + this.getMatchLength(i); }
  getMatchLength(i = 0) { const v = this.getMatch(i); return v.length; }

  split(entries: string[], buffer: string, separator: string) {
    entries.length = 0;
    const wrapped = `(${separator})`;
    let status = this.search(buffer, wrapped);
    if (!status) {
      if (buffer.length === 0) return false;
      entries.push(buffer);
      return true;
    }
    let start = 0;
    while (status) {
      entries.push(this.getPrefix());
      start += this.getMatchEndIndex(1);
      status = this.search(buffer, start, wrapped);
    }
    entries.push(buffer.slice(start));
    return true;
  }
}

export enum SignifierType {
  SIGNIFIER_UNKNOWN = 0,
  SIGNIFIER_LINK = 1,
  SIGNIFIER_ABOVE = 2,
  SIGNIFIER_BELOW = 3,
}

export class HumSignifier {
  private m_exinterp = '';
  private m_signifier = '';
  private m_definition = '';
  private m_sigtype: SignifierType = SignifierType.SIGNIFIER_UNKNOWN;
  private m_parameters = new Map<string, string>();

  constructor(rdfline?: string) {
    if (rdfline !== undefined) this.parseSignifier(rdfline);
  }

  clear(): void {
    this.m_exinterp = '';
    this.m_signifier = '';
    this.m_definition = '';
    this.m_parameters.clear();
    this.m_sigtype = SignifierType.SIGNIFIER_UNKNOWN;
  }

  parseSignifier(rdfline: string): boolean {
    this.clear();
    const hre = new HumRegex();
    if (!hre.search(rdfline, '!!!RDF(\\*\\*[^\\s:]+)\\s*:\\s*(.*)\\s*$')) return false;
    this.m_exinterp = hre.getMatch(1);
    const value = hre.getMatch(2);
    if (!hre.search(value, '\\s*([^\\s=]+)\\s*=\\s*(.*)\\s*$')) {
      this.clear();
      return false;
    }
    this.m_signifier = hre.getMatch(1);
    this.m_definition = hre.getMatch(2);
    if (this.m_exinterp === '**kern') {
      if (this.m_definition.includes('link')) this.m_sigtype = SignifierType.SIGNIFIER_LINK;
      else if (this.m_definition.includes('above')) this.m_sigtype = SignifierType.SIGNIFIER_ABOVE;
      else if (this.m_definition.includes('below')) this.m_sigtype = SignifierType.SIGNIFIER_BELOW;
    }
    return true;
  }

  getSignifier(): string { return this.m_signifier; }
  getDefinition(): string { return this.m_definition; }
  getParameter(key: string): string { return this.m_parameters.get(key) ?? ''; }
  isKernLink(): boolean { return this.m_sigtype === SignifierType.SIGNIFIER_LINK; }
  isKernAbove(): boolean { return this.m_sigtype === SignifierType.SIGNIFIER_ABOVE; }
  isKernBelow(): boolean { return this.m_sigtype === SignifierType.SIGNIFIER_BELOW; }
}

export class HumSignifiers {
  private m_signifiers: HumSignifier[] = [];
  private m_kernLinkIndex = -1;
  private m_kernAboveIndex = -1;
  private m_kernBelowIndex = -1;

  clear(): void {
    this.m_kernLinkIndex = -1;
    this.m_kernAboveIndex = -1;
    this.m_kernBelowIndex = -1;
    this.m_signifiers = [];
  }

  addSignifier(rdfline: string): boolean {
    const humsig = new HumSignifier();
    if (!humsig.parseSignifier(rdfline)) return false;
    this.m_signifiers.push(humsig);
    const index = this.m_signifiers.length - 1;
    if (humsig.isKernLink()) this.m_kernLinkIndex = index;
    else if (humsig.isKernAbove()) this.m_kernAboveIndex = index;
    else if (humsig.isKernBelow()) this.m_kernBelowIndex = index;
    return true;
  }

  hasKernLinkSignifier(): boolean { return this.m_kernLinkIndex >= 0; }
  getKernLinkSignifier(): string { return this.m_kernLinkIndex < 0 ? '' : this.m_signifiers[this.m_kernLinkIndex].getSignifier(); }
  hasKernAboveSignifier(): boolean { return this.m_kernAboveIndex >= 0; }
  getKernAboveSignifier(): string { return this.m_kernAboveIndex < 0 ? '' : this.m_signifiers[this.m_kernAboveIndex].getSignifier(); }
  hasKernBelowSignifier(): boolean { return this.m_kernBelowIndex >= 0; }
  getKernBelowSignifier(): string { return this.m_kernBelowIndex < 0 ? '' : this.m_signifiers[this.m_kernBelowIndex].getSignifier(); }
  getSignifierCount(): number { return this.m_signifiers.length; }
  getSignifier(index: number): HumSignifier | null {
    if (index < 0 || index >= this.m_signifiers.length) return null;
    return this.m_signifiers[index];
  }
}
