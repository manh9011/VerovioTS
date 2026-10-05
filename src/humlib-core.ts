/**
 * humlib-core.ts — structural humlib parser core (no rhythm/meter).
 *
 * Translated from src-cpp/src/hum/humlib.cpp + include/hum/humlib.h:
 * HumHash, HumAddress, HumdrumToken, HumdrumLine, HumdrumFileBase,
 * HumdrumFile, HumdrumFileStream, HumdrumFileSet.
 *
 * C++ ownership: HumdrumFileBase owns HumdrumLine[] (m_lines, new/delete);
 * lines own HumdrumToken[] (m_tokens). Spine links and addresses are
 * non-owning views. TS models owned arrays as plain T[] (GC frees),
 * links/owners as `| null`. Rhythm/meter/strand/strophe analysis lives in
 * HumdrumFileStructure/Content and is NOT part of this pass (ponytail: add
 * analyzeStructure/analyzeRhythm/analyzeMeter when convertHumdrum needs
 * durations; until then readString = base parse, which is exactly what
 * HumdrumFileStream::getFile calls via readNoRhythm). std::string
 * inheritance becomes an explicit text field preserving C++ semantics.
 */

import { HumNum, HumRegex, HumSignifiers } from './humlib.js';
import { Convert } from './convert.js';

/** C++ Convert::kernToDiatonicUC: upper-case pitch class of a kern token ('R' rest, 'X' none). */
export function kernToDiatonicUC(kerndata: string): string {
  for (let i = 0; i < kerndata.length; i++) {
    const c = kerndata[i];
    if (c === ' ') break;
    if (c === 'r') return 'R';
    if (c >= 'A' && c <= 'G') return c;
    if (c >= 'a' && c <= 'g') return c.toUpperCase();
  }
  return 'X';
}

/** C++ Convert::getKernPitchAttributes (humlib.cpp:1056) — the `<pitch .../>` attributes. */
export function getKernPitchAttributes(kerndata: string): string {
  const accid = kernToAccidentalCount(kerndata);
  let output = '';

  output += ` dpc="${kernToDiatonicUC(kerndata)}"`;
  output += ` numacc="${accid}"`;

  if (kerndata.indexOf('n') !== -1) {
    output += ' explicit ="true"';
  }

  output += ` oct="${kernToOctaveNumber(kerndata)}"`;

  if (Math.abs(accid) <= 2) {
    output += ` base40="${kernToBase40(kerndata)}"`;
  }

  return output;
}

export const SPLIT_TOKEN = '*^';
export const MERGE_TOKEN = '*v';
export const EXCHANGE_TOKEN = '*x';
export const TERMINATE_TOKEN = '*-';
export const ADD_TOKEN = '*+';
export const NULL_DATA = '.';
export const NULL_INTERPRETATION = '*';
export const NULL_COMMENT_LOCAL = '!';
export const NULL_COMMENT_GLOBAL = '!!';

export const OPT_PRIMARY = 0x001;
export const OPT_NOEMPTY = 0x002;
export const OPT_NONULL = 0x004;
export const OPT_NOINTERP = 0x008;
export const OPT_NOMANIP = 0x010;
export const OPT_NOCOMMENT = 0x020;
export const OPT_NOGLOBAL = 0x040;
export const OPT_NOREST = 0x080;
export const OPT_NOTIE = 0x100;
export const OPT_DATA = OPT_NOMANIP | OPT_NOCOMMENT | OPT_NOGLOBAL;
export const OPT_ATTACKS = OPT_DATA | OPT_NOREST | OPT_NOTIE | OPT_NONULL;

export type HTp = HumdrumToken | null;
export type HLp = HumdrumLine | null;

export class HumHash {
  private parameters: Map<string, Map<string, Map<string, string>>> | null = null;
  private htValues = new Map<string, HTp>();
  private origins = new Map<string, HTp>();
  private prefix = '';
  protected initializeParameters(): void { if (this.parameters === null) this.parameters = new Map(); }
  protected getKeyList(keys: string): string[] {
    const out = keys.split(':');
    return out.length === 0 ? [keys] : out;
  }
  private flatKey(ns1: string, ns2: string, key: string): string { return `${ns1}\0${ns2}\0${key}`; }
  setPrefix(value: string): void { this.prefix = value; }
  getPrefix(): string { return this.prefix; }
  getValue(key: string): string;
  getValue(ns2: string, key: string): string;
  getValue(ns1: string, ns2: string, key: string): string;
  getValue(a: string, b?: string, c?: string): string {
    if (this.parameters === null) return '';
    if (b === undefined) {
      const keys = this.getKeyList(a);
      if (keys.length <= 1) return this.getValue('', '', keys[0]);
      if (keys.length === 2) return this.getValue('', keys[0], keys[1]);
      return this.getValue(keys[0], keys[1], keys[2]);
    }
    if (c === undefined) return this.getValue('', a, b);
    const it1 = this.parameters.get(a); if (!it1) return '';
    const it2 = it1.get(b); if (!it2) return '';
    return it2.get(c) ?? '';
  }
  getValueHTp(key: string): HTp;
  getValueHTp(ns2: string, key: string): HTp;
  getValueHTp(ns1: string, ns2: string, key: string): HTp;
  getValueHTp(a: string, b?: string, c?: string): HTp {
    if (b === undefined) {
      const keys = this.getKeyList(a);
      if (keys.length <= 1) return this.getValueHTp('', '', keys[0]);
      if (keys.length === 2) return this.getValueHTp('', keys[0], keys[1]);
      return this.getValueHTp(keys[0], keys[1], keys[2]);
    }
    if (c === undefined) return this.getValueHTp('', a, b);
    return this.htValues.get(this.flatKey(a, b, c)) ?? null;
  }
  getValueInt(key: string): number;
  getValueInt(ns2: string, key: string): number;
  getValueInt(ns1: string, ns2: string, key: string): number;
  getValueInt(a: string, b?: string, c?: string): number {
    if (this.parameters === null) return 0;
    let v: string;
    if (b === undefined) {
      const keys = this.getKeyList(a);
      if (keys.length <= 1) v = this.getValue('', '', keys[0]);
      else if (keys.length === 2) v = this.getValue('', keys[0], keys[1]);
      else v = this.getValue(keys[0], keys[1], keys[2]);
    }
    else if (c === undefined) v = this.getValue('', a, b);
    else v = this.getValue(a, b, c);
    if (v.includes('/')) return new HumNum(v).getInteger();
    const n = Number.parseInt(v, 10);
    return Number.isNaN(n) ? 0 : n;
  }
  getValueFraction(key: string): HumNum;
  getValueFraction(ns2: string, key: string): HumNum;
  getValueFraction(ns1: string, ns2: string, key: string): HumNum;
  getValueFraction(a: string, b?: string, c?: string): HumNum {
    if (this.parameters === null) return new HumNum(0);
    let v: string; let defined: boolean;
    if (b === undefined) {
      const keys = this.getKeyList(a);
      if (keys.length <= 1) { defined = this.isDefined('', '', keys[0]); v = this.getValue('', '', keys[0]); }
      else if (keys.length === 2) { defined = this.isDefined('', keys[0], keys[1]); v = this.getValue('', keys[0], keys[1]); }
      else { defined = this.isDefined(keys[0], keys[1], keys[2]); v = this.getValue(keys[0], keys[1], keys[2]); }
    }
    else if (c === undefined) { defined = this.isDefined('', a, b); v = this.getValue('', a, b); }
    else { defined = this.isDefined(a, b, c); v = this.getValue(a, b, c); }
    if (!defined) return new HumNum(0);
    return new HumNum(v);
  }
  getValueFloat(key: string): number;
  getValueFloat(ns2: string, key: string): number;
  getValueFloat(ns1: string, ns2: string, key: string): number;
  getValueFloat(a: string, b?: string, c?: string): number {
    if (this.parameters === null) return 0;
    const v = b === undefined ? this.getValue(a) : c === undefined ? this.getValue(a, b) : this.getValue(a, b, c);
    if (v.includes('/')) return new HumNum(v).getFloat();
    const n = Number.parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
  }
  getValueBool(key: string): boolean;
  getValueBool(ns2: string, key: string): boolean;
  getValueBool(ns1: string, ns2: string, key: string): boolean;
  getValueBool(a: string, b?: string, c?: string): boolean {
    if (this.parameters === null) return false;
    // Two-argument form is (ns2, key): C++ HumHash::getValueBool(ns2, key)
    // forwards to getValueBool("", ns2, key). Calling getValue(a, b) here would
    // treat `a` as ns1 and look up an empty key, returning "" (truthy).
    const v = b === undefined ? this.getValue(a) : c === undefined ? this.getValue('', a, b) : this.getValue(a, b, c);
    const defined = b === undefined ? this.isDefined(a) : c === undefined ? this.isDefined('', a, b) : this.isDefined(a, b, c);
    if (!defined) return false;
    return v !== 'false' && v !== '0';
  }
  setValue(key: string, value: string | number | HTp | HumNum): void;
  setValue(ns2: string, key: string, value: string | number | HTp | HumNum): void;
  setValue(ns1: string, ns2: string, key: string, value: string | number | HTp | HumNum): void;
  setValue(a: string, b: string | number | HTp | HumNum, c?: string | number | HTp | HumNum, d?: string | number | HTp | HumNum): void {
    if (c === undefined) { this.setValue3('', '', a, b); return; }
    if (d === undefined) { this.setValue3('', a, b as string, c); return; }
    this.setValue3(a, b as string, c as string, d);
  }
  private setValue3(ns1: string, ns2: string, key: string, value: string | number | HTp | HumNum): void {
    this.initializeParameters();
    let s: string;
    if (value instanceof HumNum) s = value.toString();
    else if (typeof value === 'number') s = String(value);
    else if (value === null || typeof value === 'string') s = (value ?? '') as string;
    else { this.htValues.set(this.flatKey(ns1, ns2, key), value); s = 'HT_1'; }
    let m1 = this.parameters!.get(ns1); if (!m1) { m1 = new Map(); this.parameters!.set(ns1, m1); }
    let m2 = m1.get(ns2); if (!m2) { m2 = new Map(); m1.set(ns2, m2); }
    m2.set(key, s);
  }
  isDefined(key: string): boolean;
  isDefined(ns2: string, key: string): boolean;
  isDefined(ns1: string, ns2: string, key: string): boolean;
  isDefined(a: string, b?: string, c?: string): boolean {
    if (this.parameters === null) return false;
    if (b === undefined) {
      const keys = this.getKeyList(a);
      if (keys.length <= 1) return (this.parameters.get('')?.get('')?.has(keys[0])) ?? false;
      if (keys.length === 2) return (this.parameters.get('')?.get(keys[0])?.has(keys[1])) ?? false;
      return (this.parameters.get(keys[0])?.get(keys[1])?.has(keys[2])) ?? false;
    }
    if (c === undefined) return (this.parameters.get('')?.get(a)?.has(b)) ?? false;
    return (this.parameters.get(a)?.get(b)?.has(c)) ?? false;
  }
  deleteValue(key: string): void;
  deleteValue(ns2: string, key: string): void;
  deleteValue(ns1: string, ns2: string, key: string): void;
  deleteValue(a: string, b?: string, c?: string): void {
    if (this.parameters === null) return;
    if (b === undefined) {
      const keys = this.getKeyList(a);
      if (keys.length <= 1) { this.parameters.get('')?.get('')?.delete(keys[0]); return; }
      if (keys.length === 2) { this.parameters.get('')?.get(keys[0])?.delete(keys[1]); return; }
      this.parameters.get(keys[0])?.get(keys[1])?.delete(keys[2]); return;
    }
    if (c === undefined) { this.parameters.get('')?.get(a)?.delete(b); return; }
    this.parameters.get(a)?.get(b)?.delete(c);
  }
  getKeys(): string[];
  getKeys(ns: string): string[];
  getKeys(ns1: string, ns2: string): string[];
  getKeys(a?: string, b?: string): string[] {
    const out: string[] = [];
    if (this.parameters === null) return out;
    if (a === undefined) {
      for (const [ns1, m1] of this.parameters) for (const [ns2, m2] of m1) for (const k of m2.keys()) out.push(`${ns1}:${ns2}:${k}`);
      return out;
    }
    if (b === undefined) {
      const loc = a.indexOf(':');
      if (loc >= 0) return this.getKeys(a.slice(0, loc), a.slice(loc + 1));
      for (const [ns1, m1] of this.parameters) { const m2 = m1.get(a); if (!m2) continue; for (const k of m2.keys()) out.push(`${ns1}:${k}`); }
      const m1 = this.parameters.get(a); if (m1) for (const [ns2, m2] of m1) for (const k of m2.keys()) out.push(`${ns2}:${k}`);
      return out;
    }
    const m2 = this.parameters.get(a)?.get(b); if (!m2) return out;
    return [...m2.keys()];
  }
  getParameters(ns1: string, ns2: string): Map<string, string> {
    const out = new Map<string, string>();
    if (this.parameters === null) return out;
    for (const [k, v] of this.parameters.get(ns1)?.get(ns2) ?? []) out.set(k, v);
    return out;
  }
  hasParameters(): boolean;
  hasParameters(ns: string): boolean;
  hasParameters(ns1: string, ns2: string): boolean;
  hasParameters(a?: string, b?: string): boolean {
    if (this.parameters === null || this.parameters.size === 0) return false;
    if (a === undefined) {
      for (const m1 of this.parameters.values()) for (const m2 of m1.values()) if (m2.size > 0) return true;
      return false;
    }
    if (b === undefined) {
      const loc = a.indexOf(':');
      if (loc >= 0) return this.hasParameters(a.slice(0, loc), a.slice(loc + 1));
      for (const m1 of this.parameters.values()) { if ((m1.get(a)?.size ?? 0) > 0) return true; }
      const m1 = this.parameters.get(a); if (m1) for (const m2 of m1.values()) if (m2.size > 0) return true;
      return false;
    }
    return (this.parameters.get(a)?.get(b)?.size ?? 0) > 0;
  }
  getParameterCount(): number;
  getParameterCount(ns: string): number;
  getParameterCount(ns1: string, ns2: string): number;
  getParameterCount(a?: string, b?: string): number {
    if (this.parameters === null || this.parameters.size === 0) return 0;
    if (a === undefined) {
      let sum = 0;
      for (const m1 of this.parameters.values()) for (const m2 of m1.values()) sum += m2.size;
      return sum;
    }
    if (b === undefined) {
      const loc = a.indexOf(':');
      if (loc >= 0) return this.getParameterCount(a.slice(0, loc), a.slice(loc + 1));
      let sum = 0;
      for (const m1 of this.parameters.values()) sum += m1.get(a)?.size ?? 0;
      const m1 = this.parameters.get(a); if (m1) for (const m2 of m1.values()) sum += m2.size;
      return sum;
    }
    return this.parameters.get(a)?.get(b)?.size ?? 0;
  }
  setOrigin(key: string, tok: HTp): void;
  setOrigin(ns2: string, key: string, tok: HTp): void;
  setOrigin(ns1: string, ns2: string, key: string, tok: HTp): void;
  setOrigin(a: string, b: string | HTp, c?: string | HTp, d?: HTp): void {
    if (this.parameters === null) return;
    if (c === undefined) {
      const keys = this.getKeyList(a);
      if (keys.length <= 1) this.setOrigin('', '', keys[0], b as HTp);
      else if (keys.length === 2) this.setOrigin('', keys[0], keys[1], b as HTp);
      else this.setOrigin(keys[0], keys[1], keys[2], b as HTp);
      return;
    }
    if (d === undefined) { this.setOrigin('', a, b as string, c as HTp); return; }
    if (!this.isDefined(a, b as string, c as string)) return;
    const k = this.flatKey(a, b as string, c as string);
    if (d === null) this.origins.delete(k); else this.origins.set(k, d);
  }
  getOrigin(key: string): HTp;
  getOrigin(ns2: string, key: string): HTp;
  getOrigin(ns1: string, ns2: string, key: string): HTp;
  getOrigin(a: string, b?: string, c?: string): HTp {
    if (this.parameters === null) return null;
    if (b === undefined) {
      const keys = this.getKeyList(a);
      if (keys.length <= 1) return this.getOrigin('', '', keys[0]);
      if (keys.length === 2) return this.getOrigin('', keys[0], keys[1]);
      return this.getOrigin(keys[0], keys[1], keys[2]);
    }
    if (c === undefined) return this.getOrigin('', a, b);
    return this.origins.get(this.flatKey(a, b, c)) ?? null;
  }
  // C++ HumHash::printXml (humlib.cpp:16762) — the `<parameters>` element used by the
  // HumdrumXML dump. Namespaces and keys are emitted in insertion order (std::map in
  // C++ is alphabetical; TS keeps insertion order, which the extMeta round-trip only
  // reads as opaque metadata).
  printHashXml(level: number, indent = '\t'): string {
    if (this.parameters === null || this.parameters.size === 0) return '';

    let str = '';
    let found = false;
    level++;
    for (const [ns1, m1] of this.parameters) {
      if (m1.size === 0) continue;
      found = true;
      str += Convert.repeatString(indent, level++) + `<namespace n="1" name="${ns1}">\n`;
      for (const [ns2, m2] of m1) {
        if (m2.size === 0) continue;
        str += Convert.repeatString(indent, level++) + `<namespace n="2" name="${ns2}">\n`;
        for (const [key, value] of m2) {
          str += Convert.repeatString(indent, level);
          str += `<parameter key="${key}"`;
          str += ` value="${Convert.encodeXml(value)}"`;
          const ref = this.getOrigin(ns1, ns2, key);
          if (ref !== null) str += ` idref="${ref.getXmlId()}"`;
          str += '/>\n';
        }
        str += Convert.repeatString(indent, --level) + '</namespace>\n';
      }
      str += Convert.repeatString(indent, --level) + '</namespace>\n';
    }
    if (found) {
      str += Convert.repeatString(indent, --level) + '</parameters>\n';
      return Convert.repeatString(indent, level) + '<parameters>\n' + str;
    }
    return '';
  }

  // C++ HumHash::printXmlAsGlobal (humlib.cpp:16827) — the global variant used for
  // reference records; the anonymous namespace lands in a buffer that is only flushed
  // when it actually received parameters, and the `global=true` marker is suppressed.
  printHashXmlAsGlobal(level: number, indent = '\t'): string {
    if (this.parameters === null || this.parameters.size === 0) return '';

    let str = '';
    let str2 = '';
    let it1str = '';
    let it2str = '';
    let str2count = 0;
    let found = false;

    level++;
    for (const [ns1, m1] of this.parameters) {
      if (m1.size === 0) continue;
      str2 = '';
      it1str = ns1;
      found = true;
      if (ns1 === '') {
        str2 += Convert.repeatString(indent, level++) + `<namespace n="1" name="${ns1}">\n`;
      }
      else {
        str += Convert.repeatString(indent, level++) + `<namespace n="1" name="${ns1}">\n`;
      }
      for (const [ns2, m2] of m1) {
        if (m2.size === 0) continue;
        it2str = ns2;
        if (ns2 === '') {
          str2 += Convert.repeatString(indent, level++) + `<namespace n="2" name="${ns2}">\n`;
        }
        else {
          str += Convert.repeatString(indent, level++) + `<namespace n="2" name="${ns2}">\n`;
        }
        for (const [key, value] of m2) {
          if (ns2 === '') {
            if (key === 'global' && value === 'true') {
              // don't do anything because parameter should be removed
            }
            else {
              str2count++;
              str2 += Convert.repeatString(indent, level);
              str2 += `<parameter key="${key}"`;
              str2 += ` value="${Convert.encodeXml(value)}"`;
              const ref = this.getOrigin(ns1, ns2, key);
              if (ref !== null) str2 += ` idref="${ref.getXmlId()}"`;
              str2 += '/>\n';
            }
          }
          else {
            str += Convert.repeatString(indent, level);
            str += `<parameter key="${key}"`;
            str += ` value="${Convert.encodeXml(value)}"`;
            const ref = this.getOrigin(ns1, ns2, key);
            if (ref !== null) str += ` idref="${ref.getXmlId()}"`;
            str += '/>\n';
          }
        }
        if (it1str === '' && it2str === '') {
          if (str2count > 0) {
            str += str2;
            str += Convert.repeatString(indent, --level) + '</namespace>\n';
          }
        }
        else {
          str += Convert.repeatString(indent, --level) + '</namespace>\n';
        }
      }
      if (it1str === '' && it2str === '') {
        if (str2count > 0) str += Convert.repeatString(indent, --level) + '</namespace>\n';
      }
      else {
        str += Convert.repeatString(indent, --level) + '</namespace>\n';
      }
    }
    if (found) {
      str += Convert.repeatString(indent, --level) + '</parameters>\n';
      return Convert.repeatString(indent, level) + '<parameters global="true">\n' + str;
    }
    return '';
  }

  protected copyHashFrom(other: HumHash): void {
    this.prefix = other.prefix;
    if (other.parameters === null) { this.parameters = null; }
    else {
      this.parameters = new Map();
      for (const [ns1, m1] of other.parameters) {
        const c1 = new Map<string, Map<string, string>>();
        for (const [ns2, m2] of m1) c1.set(ns2, new Map(m2));
        this.parameters.set(ns1, c1);
      }
    }
  }
}

export class HumAddress {
  private m_fieldindex = -1;
  private m_spining = '';
  private m_track = -1;
  private m_subtrack = -1;
  private m_subtrackcount = 0;
  private m_owner: HumdrumLine | null = null;
  getLineIndex(): number { return this.m_owner === null ? -1 : this.m_owner.getLineIndex(); }
  getLineNumber(): number { return this.getLineIndex() + 1; }
  getFieldIndex(): number { return this.m_fieldindex; }
  getSpineInfo(): string { return this.m_spining; }
  getTrack(): number { return this.m_track; }
  getSubtrack(): number { return this.m_subtrackcount === 1 ? 0 : this.m_subtrack; }
  getSubtrackCount(): number { return this.m_subtrackcount; }
  getTrackString(separator = '.'): string {
    let out = String(this.getTrack());
    const sub = this.getSubtrack();
    if (sub > 0) out += separator + String(sub);
    return out;
  }
  getLine(): HLp { return this.m_owner; }
  getOwner(): HLp { return this.m_owner; }
  hasOwner(): boolean { return this.m_owner !== null; }
  getDataType(): string {
    if (this.m_owner === null) return '';
    const tok = this.m_owner.getTrackStart(this.getTrack());
    return tok === null ? '' : tok.toString();
  }
  getExclusiveInterpretation(): HumdrumToken {
    if (this.m_owner === null) return new HumdrumToken('');
    const tok = this.m_owner.getTrackStart(this.getTrack());
    return tok === null ? new HumdrumToken('') : tok;
  }
  setOwner(line: HLp): void { this.m_owner = line; }
  setFieldIndex(index: number): void { this.m_fieldindex = index; }
  setSpineInfo(info: string): void { this.m_spining = info; }
  setTrack(aTrack: number, aSubtrack?: number): void {
    if (aSubtrack !== undefined) { this.setTrack(aTrack); this.setSubtrack(aSubtrack); return; }
    this.m_track = aTrack < 0 ? -1 : aTrack > 1000 ? 1000 : aTrack;
  }
  setSubtrack(v: number): void { this.m_subtrack = v < 0 ? -1 : v > 1000 ? 1000 : v; }
  setSubtrackCount(count: number): void { this.m_subtrackcount = count; }
  copyFrom(other: HumAddress): void {
    this.m_fieldindex = other.m_fieldindex;
    this.m_track = other.m_track;
    this.m_subtrack = other.m_subtrack;
    this.m_subtrackcount = other.m_subtrackcount;
    this.m_spining = other.m_spining;
    this.m_owner = other.m_owner;
  }
}

// C++ HumParamSet (humlib.h:900): a `!LO:ns1:ns2:key=value:...` parameter set.
// Splitting mirrors HumParamSet::readString: leading '!' characters are dropped,
// then the string is split on ':', with `&colon;` unescaped inside each piece.
export class HumParamSet {
  private m_ns1 = '';
  private m_ns2 = '';
  private m_parameters: Array<[string, string]> = [];
  constructor(text = '') {
    if (text !== '') this.readString(text);
  }
  getNamespace1(): string { return this.m_ns1; }
  getNamespace2(): string { return this.m_ns2; }
  getNamespace(): string { return this.m_ns2 === '' ? this.m_ns1 : this.m_ns1 + ':' + this.m_ns2; }
  setNamespace1(name: string): void { this.m_ns1 = name; }
  setNamespace2(name: string): void { this.m_ns2 = name; }
  setNamespace(name1: string, name2 = ''): void { this.m_ns1 = name1; this.m_ns2 = name2; }
  clear(): void { this.m_ns1 = ''; this.m_ns2 = ''; this.m_parameters = []; }
  getCount(): number { return this.m_parameters.length; }
  getParameterName(index: number): string { return this.m_parameters[index]?.[0] ?? ''; }
  getParameterValue(index: number): string { return this.m_parameters[index]?.[1] ?? ''; }
  addParameter(name: string, value: string): number {
    this.m_parameters.push([name, value]);
    return this.m_parameters.length - 1;
  }
  readString(text: string): void {
    const pieces: string[] = [''];
    let bangs = true;
    for (let i = 0; i < text.length; ++i) {
      if (bangs && text[i] === '!') continue;
      bangs = false;
      if (text[i] === ':') { pieces.push(''); continue; }
      pieces[pieces.length - 1] += text[i];
    }

    if (pieces.length < 3) return;

    this.m_ns1 = pieces[0];
    this.m_ns2 = pieces[1];

    for (let i = 2; i < pieces.length; ++i) {
      const piece = pieces[i].split('&colon;').join(':');
      const loc = piece.indexOf('=');
      if (loc !== -1) {
        this.addParameter(piece.substring(0, loc), piece.substring(loc + 1));
      }
      else {
        this.addParameter(piece, 'true');
      }
    }
  }

  // C++ HumParamSet::printXml (humlib.cpp:18598) — the <linked-parameter-set> element.
  printXml(level: number, indent = '\t'): string {
    if (this.getCount() === 0) return '';

    let out = Convert.repeatString(indent, level++) + '<linked-parameter-set>\n';
    out += Convert.repeatString(indent, level++) + `<namespace n="1" name="${this.getNamespace1()}">\n`;
    out += Convert.repeatString(indent, level++) + `<namespace n="2" name="${this.getNamespace2()}">\n`;

    for (let i = 0; i < this.getCount(); i++) {
      out += Convert.repeatString(indent, level);
      out += `<parameter key="${this.getParameterName(i)}"`;
      out += ` value="${Convert.encodeXml(this.getParameterValue(i))}"`;
      out += '/>\n';
    }

    out += Convert.repeatString(indent, --level) + '</namespace>\n';
    out += Convert.repeatString(indent, --level) + '</namespace>\n';
    out += Convert.repeatString(indent, --level) + '</linked-parameter-set>\n';
    return out;
  }
}

export class HumdrumToken extends HumHash {
  private text: string;
  private m_address = new HumAddress();
  private m_duration = new HumNum(-1);
  private m_rhythmAnalyzed = false;
  private m_rhycheck = 0;
  private m_nextTokens: HTp[] = [];
  private m_previousTokens: HTp[] = [];
  private m_nextNonNullTokens: HTp[] = [];
  private m_previousNonNullTokens: HTp[] = [];
  private m_linkedParameterTokens: HTp[] = [];
  private m_parameterSet: HumParamSet | null = null;
  private m_nullresolve: HTp = null;
  private m_strophe: HTp = null;
  constructor(value?: string | HumdrumToken | null, owner?: HumdrumLine | null) {
    super();
    if (value instanceof HumdrumToken) {
      this.text = value.text;
      this.copyHashFrom(value);
      this.m_address.copyFrom(value.m_address);
      this.m_address.setOwner(null);
      this.m_nextTokens = [...value.m_nextTokens];
    } else {
      this.text = value ?? '';
      this.setPrefix('!');
    }
    if (owner !== undefined) this.m_address.setOwner(owner);
  }
  toString(): string { return this.text; }
  valueOf(): string { return this.text; }
  at(i: number): string { return this.text[i] ?? ''; }
  compare(pos: number, len: number, other: string): number {
    const a = this.text.substr(pos, len);
    return a < other ? -1 : a > other ? 1 : 0;
  }
  substr(pos: number, len?: number): string { return this.text.substr(pos, len); }
  find(s: string, from = 0): number { return this.text.indexOf(s, from); }
  back(): string { return this.text.length ? this.text[this.text.length - 1] : ''; }
  equalChar(index: number, ch: string): boolean {
    if (index < 0 || index >= this.text.length) return false;
    return this.text[index] === ch;
  }
  isNull(): boolean { return this.text === NULL_DATA || this.text === NULL_INTERPRETATION || this.text === NULL_COMMENT_LOCAL; }
  isNullToken(): boolean { return this.isNull(); }
  isSplitInterpretation(): boolean { return this.text === SPLIT_TOKEN; }
  isMergeInterpretation(): boolean { return this.text === MERGE_TOKEN; }
  isExchangeInterpretation(): boolean { return this.text === EXCHANGE_TOKEN; }
  isTerminateInterpretation(): boolean { return this.text === TERMINATE_TOKEN; }
  isAddInterpretation(): boolean { return this.text === ADD_TOKEN; }
  isExclusiveInterpretation(): boolean { return this.text.substr(0, 2) === '**'; }
  isExclusive(): boolean { return this.isExclusiveInterpretation(); }
  isExInterp(): boolean { return this.isExclusiveInterpretation(); }
  isSplit(): boolean { return this.isSplitInterpretation(); }
  isMerge(): boolean { return this.isMergeInterpretation(); }
  isExchange(): boolean { return this.isExchangeInterpretation(); }
  isTerminate(): boolean { return this.isTerminateInterpretation(); }
  isTerminator(): boolean { return this.isTerminateInterpretation(); }
  isAdd(): boolean { return this.isSplitInterpretation(); }
  isManipulator(): boolean {
    return this.isSplitInterpretation() || this.isMergeInterpretation() || this.isExchangeInterpretation()
      || this.isAddInterpretation() || this.isTerminateInterpretation() || this.isExclusiveInterpretation();
  }
  isSpineManipulator(): boolean { return this.isManipulator(); }
  isBarline(): boolean { return this.text.length > 0 && this.text[0] === '='; }
  isComment(): boolean { return this.text.length > 0 && this.text[0] === '!'; }
  isCommentLocal(): boolean {
    if (!this.text.length || this.text[0] !== '!') return false;
    if (this.text.length > 1 && this.text[1] === '!') return false;
    return true;
  }
  isLocalComment(): boolean { return this.isCommentLocal(); }
  isCommentGlobal(): boolean {
    if (!this.text.length || this.text[0] !== '!') return false;
    return this.text.length > 1 && this.text[1] === '!';
  }
  isGlobalComment(): boolean { return this.isCommentGlobal(); }
  isData(): boolean {
    if (!this.text.length) return false;
    const c = this.text[0];
    return c !== '*' && c !== '!' && c !== '=';
  }
  isInterpretation(): boolean { return this.text.length > 0 && this.text[0] === '*'; }
  isNonNullData(): boolean { return this.isData() && !this.isNull(); }
  isNullData(): boolean { return this.isData() && this.isNull(); }
  isChord(separator = ' '): boolean { return this.text.indexOf(separator) !== -1; }
  isLabel(): boolean {
    if (this.text.substr(0, 2) !== '*>') return false;
    return this.text.indexOf('[') === -1;
  }
  isExpansionLabel(): boolean { return this.isLabel(); }
  isExpansionList(): boolean {
    if (this.text.substr(0, 2) !== '*>') return false;
    return this.text.indexOf('[') !== -1 && this.back() === ']';
  }
  hasRhythm(): boolean {
    const t = this.getDataType();
    return t === '**kern' || t.substr(0, 7) === '**kern-' || t === '**recip' || t === '**mens';
  }
  isRest(): boolean {
    if (this.isKernLike() || this.isMensLike()) {
      if (this.isKernLike() && this.isChord()) return false;
      if (this.text.indexOf('r') === -1) return false;
      return true;
    }
    return false;
  }
  isNote(): boolean {
    if (!this.isData() || this.isNull()) return false;
    // C++ Convert::isKernNote: false when any 'r' present, else true when
    // any pitch letter a-g present.
    if (this.isKernLike() || this.isMensLike()) {
      if (this.text.indexOf('r') !== -1) return false;
      return /[a-gA-G]/.test(this.text);
    }
    return false;
  }
  getDataType(): string { return this.m_address.getDataType(); }
  getExInterp(): string { return this.getDataType(); }
  isDataType(dtype: string): boolean {
    if (dtype.substr(0, 2) === '**') return dtype === this.getDataType();
    return this.getDataType().substr(2) === dtype;
  }
  isDataTypeLike(dtype: string): boolean {
    if (this.isDataType(dtype)) return true;
    if (dtype.substr(0, 2) === '**') return this.getDataType().substr(0, dtype.length + 1) === dtype + '-';
    return this.getDataType().substr(0, dtype.length + 3) === '**' + dtype + '-';
  }
  isKern(): boolean { return this.isDataType('**kern'); }
  isKernLike(): boolean {
    const d = this.getDataType();
    return d === '**kern' || d.substr(0, 7) === '**kern-' || d === '**kernyy';
  }
  isMens(): boolean { return this.isDataType('**mens'); }
  // C++ HumdrumToken::isKeyDesignation: *[A-Ga-g][#-n]{0,2}:... key marker.
  isKeyDesignation(): boolean {
    const t = this.text;
    if (t.length < 3) return false;
    const pos = t.indexOf(':');
    if (pos < 2 || pos > 4) return false;
    const diatonic = t[1].toLowerCase();
    if (diatonic < 'a' || diatonic > 'g') return false;
    for (let i = 2; i < pos; i++) {
      const c = t[i];
      if (c !== '#' && c !== '-' && c !== 'n') return false;
    }
    return true;
  }
  isMensLike(): boolean {
    const d = this.getDataType();
    return d === '**mens' || d.substr(0, 7) === '**mens-';
  }
  isStaffLike(): boolean { return this.isKernLike() || this.isMensLike(); }
  isStaff(): boolean { return this.isKernLike() || this.isMensLike(); }
  isKeySignature(): boolean {
    if (this.text.length < 3 || this.text.substr(0, 3) !== '*k[') return false;
    return this.back() === ']';
  }
  isTimeSignature(): boolean {
    if (this.text.length < 3 || this.text.substr(0, 2) !== '*M') return false;
    if (this.text[2] < '0' || this.text[2] > '9') return false;
    return this.text.indexOf('/') !== -1;
  }
  isMetricSymbol(): boolean {
    if (this.text.length < 6 || this.text.substr(0, 5) !== '*met(') return false;
    return this.back() === ')';
  }
  isMeterSignature(): boolean { return this.isMetricSymbol(); }
  isMeterSymbol(): boolean { return this.isMetricSymbol(); }
  isTempo(): boolean {
    if (this.text.length < 4 || this.text.substr(0, 3) !== '*MM') return false;
    return this.text[3] >= '0' && this.text[3] <= '9';
  }
  isClef(): boolean {
    if (!(this.isDataType('**kern') || this.isDataType('**mens'))) return false;
    if (!this.isInterpretation()) return false;
    return this.text.substr(0, 5) === '*clef';
  }
  allSameBarlineStyle(): boolean {
    const owner = this.getOwner();
    if (owner === null) return true;
    return owner.allSameBarlineStyle();
  }
  isFirstStrophe(): boolean {
    if (this.m_strophe === null) return true;
    const toleft = this.m_strophe.getPreviousField();
    if (toleft === null) return true;
    return this.m_strophe.getTrack() !== toleft.getTrack();
  }
  isPrimaryStrophe(): boolean { return this.isFirstStrophe(); }
  getStrophe(): HTp { return this.m_strophe; }
  noteInLowerSubtrack(): boolean {
    if (this.getSubtrack() <= 1) return false;
    const field = this.getFieldIndex();
    const track = this.getTrack();
    const owner = this.getOwner();
    if (owner === null) return false;
    for (let i = field - 1; i >= 0; i--) {
      const xtoken = owner.token(i);
      if (xtoken === null || xtoken.getTrack() !== track) return false;
      if (xtoken.isNull()) continue;
      if (xtoken.toString().indexOf('r') !== -1) continue;
      return true;
    }
    return false;
  }
  getSpineInfo(): string { return this.m_address.getSpineInfo(); }
  setSpineInfo(info: string): void { this.m_address.setSpineInfo(info); }
  getTrack(): number { return this.m_address.getTrack(); }
  getSpineIndex(): number { return this.m_address.getTrack() - 1; }
  getSubtrack(): number { return this.m_address.getSubtrack(); }
  getTrackString(separator = '.'): string { return this.m_address.getTrackString(separator); }
  setTrack(t: number, sub?: number): void { this.m_address.setTrack(t, sub); }
  setSubtrack(v: number): void { this.m_address.setSubtrack(v); }
  setSubtrackCount(c: number): void { this.m_address.setSubtrackCount(c); }
  getSubtrackCount(): number { return this.m_address.getSubtrackCount(); }
  isGrace(): boolean {
    if (!this.isDataType('**kern')) return false;
    if (!this.isData()) return false;
    return this.text.indexOf('q') !== -1;
  }
  isInvisible(): boolean {
    if (!this.isDataType('**kern')) return false;
    if (this.isBarline()) return this.text.indexOf('-') !== -1;
    if (this.isData()) return this.text.indexOf('yy') !== -1;
    return false;
  }
  isSecondaryTiedNote(): boolean {
    if (!this.isDataType('**kern') || !this.isNote()) return false;
    const s = this.text.toLowerCase();
    return s.indexOf('_') !== -1 || s.indexOf(']') !== -1;
  }
  getSlurStartElisionLevel(index = 0): number {
    if (this.isDataType('**kern') || this.isDataType('**mens')) {
      return getKernSlurStartElisionLevel(this.text, index);
    }
    return -1;
  }
  getSlurEndElisionLevel(index = 0): number {
    if (this.isDataType('**kern') || this.isDataType('**mens')) {
      return getKernSlurEndElisionLevel(this.text, index);
    }
    return -1;
  }
  getBeamStartElisionLevel(index = 0): number {
    if (this.isDataType('**kern') || this.isDataType('**mens')) {
      return getKernBeamStartElisionLevel(this.text, index);
    }
    return -1;
  }
  getBeamEndElisionLevel(index = 0): number {
    if (this.isDataType('**kern') || this.isDataType('**mens')) {
      return getKernBeamEndElisionLevel(this.text, index);
    }
    return -1;
  }
  getPhraseStartElisionLevel(index = 0): number {
    if (this.isDataType('**kern') || this.isDataType('**mens')) {
      return getKernPhraseStartElisionLevel(this.text, index);
    }
    return -1;
  }
  getPhraseEndElisionLevel(index = 0): number {
    if (this.isDataType('**kern')) {
      return getKernPhraseEndElisionLevel(this.text, index);
    }
    return -1;
  }
  hasStemDirection(): string {
    if (!this.isKernLike()) return '';
    for (let i = 0; i < this.text.length; i++) {
      const ch = this.text[i];
      if (ch === '/' || ch === '\\') return ch;
    }
    return '';
  }

  getSlurStartToken(num: number): HTp {
    let tag = 'slurStartId';
    if (num > 1) tag += String(num);
    return this.getValueHTp('auto', tag);
  }

  getSlurStartNumber(endnumber: number): number {
    let tag = 'slurStartNumber';
    if (endnumber > 1) tag += String(endnumber);
    return this.getValueInt('auto', tag);
  }

  getSlurEndToken(num: number): HTp {
    let tag = 'slurEnd';
    if (num > 1) tag += String(num);
    return this.getValueHTp('auto', tag);
  }

  getPhraseStartToken(num: number): HTp {
    let tag = 'phraseStart';
    if (num > 1) tag += String(num);
    return this.getValueHTp('auto', tag);
  }

  getPhraseEndToken(num: number): HTp {
    let tag = 'phraseEnd';
    if (num > 1) tag += String(num);
    return this.getValueHTp('auto', tag);
  }

  // C++ HumdrumToken::getSlurLayoutParameter (LO:S). Same shape as
  // getPhraseLayoutParameter: local parameter only, with @s subtoken gating.
  getSlurLayoutParameter(keyname: string, subtokenindex = -1): string {
    const testoutput = this.getValue('LO', 'S', keyname);
    if (testoutput !== '') {
      if (subtokenindex >= 0) {
        const s = this.getValueInt('LO', 'S', 's');
        if (s === subtokenindex + 1) {
          return testoutput;
        }
      } else {
        return testoutput;
      }
    }
    return '';
  }

  getPhraseLayoutParameter(keyname: string, subtokenindex = -1): string {
    const testoutput = this.getValue('LO', 'P', keyname);
    if (testoutput !== '') {
      if (subtokenindex >= 0) {
        const s = this.getValueInt('LO', 'P', 's');
        if (s === subtokenindex + 1) {
          return testoutput;
        }
      } else {
        return testoutput;
      }
    }
    return '';
  }

  getNextNonNullDataTokenCount(): number {
    return this.m_nextNonNullTokens.length;
  }

  getNextNonNullDataToken(index = 0): HTp {
    if (index < 0) index += this.m_nextNonNullTokens.length;
    if (index < 0 || index >= this.m_nextNonNullTokens.length) return null;
    return this.m_nextNonNullTokens[index];
  }

  getPreviousNonNullDataTokenCount(): number {
    return this.m_previousNonNullTokens.length;
  }

  getPreviousNonNullDataToken(index = 0): HTp {
    if (index < 0) index += this.m_previousNonNullTokens.length;
    if (index < 0 || index >= this.m_previousNonNullTokens.length) return null;
    return this.m_previousNonNullTokens[index];
  }

  getOwner(): HLp { return this.m_address.getOwner(); }
  getLine(): HLp { return this.m_address.getOwner(); }
  setOwner(line: HLp): void { this.m_address.setOwner(line); }
  getLineIndex(): number { return this.m_address.getLineIndex(); }
  getLineNumber(): number { return this.m_address.getLineNumber(); }
  getFieldIndex(): number { return this.m_address.getFieldIndex(); }
  getFieldNumber(): number { return this.m_address.getFieldIndex() + 1; }
  getTokenIndex(): number { return this.getFieldIndex(); }
  getTokenNumber(): number { return this.getFieldNumber(); }
  setFieldIndex(i: number): void { this.m_address.setFieldIndex(i); }
  getSubtokenCount(separator = ' '): number {
    let count = 0; let start = 0;
    while (true) { const p = this.text.indexOf(separator, start); if (p === -1) break; count++; start = p + separator.length; }
    return count + 1;
  }
  getSubtoken(index: number, separator = ' '): string {
    if (index < 0) return '';
    if (separator === '') return index < this.text.length ? this.text[index] : '';
    let pos = 0; let cur = 0;
    while (true) {
      const next = this.text.indexOf(separator, pos);
      if (cur === index) return next === -1 ? this.text.substr(pos) : this.text.substr(pos, next - pos);
      if (next === -1) return '';
      pos = next + separator.length; cur++;
    }
  }
  getSubtokens(separator = ' '): string[] {
    const out: string[] = []; const n = this.getSubtokenCount(separator);
    for (let i = 0; i < n; i++) out.push(this.getSubtoken(i, separator));
    return out;
  }
  replaceSubtoken(index: number, newsubtok: string, separator = ' '): void {
    if (index < 0) return;
    const subtokens = this.getSubtokens(separator);
    if (index >= subtokens.length) return;
    subtokens[index] = newsubtok;
    this.text = subtokens.join(separator);
    const owner = this.getOwner();
    if (owner) owner.createLineFromTokens();
  }
  getDots(separator = ' '): number {
    let count = 0;
    for (let i = 0; i < this.text.length - 1; i++) {
      if (this.text[i] === '.') count++;
      if (this.text[i] === separator) break;
    }
    return count;
  }
  analyzeDuration(): boolean {
    this.m_rhythmAnalyzed = true;
    if (this.text === NULL_DATA) { this.m_duration = new HumNum(-1); return true; }
    if (this.text.length > 0 && (this.text[0] === '!' || this.text[0] === '*' || this.text[0] === '=')) {
      this.m_duration = new HumNum(-1); return true;
    }
    if (this.hasRhythm()) {
      if (this.isData()) {
        if (!this.isNull()) {
          if (this.isKernLike()) {
            this.m_duration = this.text.indexOf('q') !== -1 ? new HumNum(0) : recipToDuration(this.text);
          } else if (this.isMensLike()) {
            // ponytail: mensToDuration needs mensuration-level analysis.
            this.m_duration = new HumNum(-1);
          } else this.m_duration = new HumNum(-1);
        } else this.m_duration = new HumNum(-1);
      } else this.m_duration = new HumNum(-1);
    } else this.m_duration = new HumNum(-1);
    return true;
  }
  getDuration(scale?: HumNum): HumNum {
    if (!this.m_rhythmAnalyzed) this.analyzeDuration();
    return scale === undefined ? new HumNum(this.m_duration) : this.m_duration.mul(scale);
  }
  getDurationNoDots(scale?: HumNum): HumNum {
    const dots = this.getDots();
    const base = scale === undefined ? this.getDuration() : this.getDuration(scale);
    if (dots === 0) return base;
    const bot = Math.pow(2, dots + 1) - 1;
    const top = Math.pow(2, dots);
    return base.mul(new HumNum(top, bot));
  }
  getTiedDuration(scale?: HumNum): HumNum {
    if (!this.m_rhythmAnalyzed) this.analyzeDuration();
    let output = new HumNum(this.m_duration);
    if (this.text.indexOf('[') === -1) return scale === undefined ? output : output.mul(scale);
    let note = this.getNextToken();
    while (note !== null) {
      if (!note.isData()) { note = note.getNextToken(); continue; }
      if (note.isNull()) { note = note.getNextToken(); continue; }
      break;
    }
    return scale === undefined ? output : output.mul(scale);
  }
  setDuration(dur: HumNum): void { this.m_duration = new HumNum(dur); }
  getState(): number { return this.m_rhycheck; }
  incrementState(): void { this.m_rhycheck++; }
  getDurationFromStart(scale?: HumNum): HumNum {
    const line = this.getLine();
    if (line === null) return new HumNum(0);
    return line.getDurationFromStart(scale);
  }
  getDurationFromStartNoAnalyze(): HumNum {
    const line = this.getLine();
    if (line === null) return new HumNum(-1);
    return line.getDurationFromStartNoAnalyze();
  }
  getDurationFromBarline(scale?: HumNum): HumNum {
    const own = this.getOwner();
    if (own === null) return new HumNum(0);
    return own.getDurationFromBarline(scale);
  }
  getDurationToBarline(scale?: HumNum): HumNum {
    const own = this.getOwner();
    if (own === null) return new HumNum(0);
    return own.getDurationToBarline(scale);
  }
  getBarlineDuration(scale?: HumNum): HumNum {
    const own = this.getOwner();
    if (own === null) return new HumNum(0);
    return own.getBarlineDuration(scale);
  }
  getExclusiveInterpretation(): HumdrumToken { return this.m_address.getExclusiveInterpretation(); }
  hasVisibleAccidental(subtokenIndex: number): number {
    const humrec = this.getOwner();
    if (humrec === null) return -1;
    const humfile = humrec.getOwner();
    if (humfile === null) return -1;
    if (this.isKern()) {
      if (!humfile.getValueBool('auto', 'accidentalAnalysis**kern')) {
        if (!humfile.analyzeKernAccidentals()) return -1;
      }
    }
    else if (this.isMens()) {
      if (!humfile.getValueBool('auto', 'accidentalAnalysis**mens')) {
        if (!humfile.analyzeKernAccidentals('**mens')) return -1;
      }
    }
    return this.getValueBool('auto', String(subtokenIndex), 'visualAccidental') ? 1 : 0;
  }
  hasCautionaryAccidental(subtokenIndex: number): number {
    // C++ HumdrumToken::hasCautionaryAccidental (humlib.cpp ~37908).
    const humrec = this.getOwner();
    if (humrec === null) return -1;
    const humfile = humrec.getOwner();
    if (humfile === null) return -1;
    if (this.isKern()) {
      if (!humfile.getValueBool('auto', 'accidentalAnalysis**kern')) {
        if (!humfile.analyzeKernAccidentals()) return -1;
      }
    }
    else if (this.isMens()) {
      if (!humfile.getValueBool('auto', 'accidentalAnalysis**mens')) {
        if (!humfile.analyzeKernAccidentals('**mens')) return -1;
      }
    }
    return this.getValueBool('auto', String(subtokenIndex), 'cautionaryAccidental') ? 1 : 0;
  }
  resolveNull(): HTp {
    if (this.m_nullresolve !== null) return this.m_nullresolve;
    return this;
  }
  setNullResolution(r: HTp): void { this.m_nullresolve = r; }
  makeForwardLink(next: HumdrumToken): void {
    this.m_nextTokens.push(next);
    next.m_previousTokens.push(this);
  }
  makeBackwardLink(prev: HumdrumToken): void {
    this.m_previousTokens.push(prev);
    prev.m_nextTokens.push(this);
  }
  getNextTokenCount(): number { return this.m_nextTokens.length; }
  getPreviousTokenCount(): number { return this.m_previousTokens.length; }
  getNextToken(i = 0): HTp { return i < 0 || i >= this.m_nextTokens.length ? null : this.m_nextTokens[i]; }
  // C++ HumdrumToken::copyStructure (humlib.cpp) — carry spine address only.
  copyStructure(other: HumdrumToken): void {
    // Keep this token's own line as address owner: copying the source token's
    // owner makes copied null tokens report the source line, which breaks
    // Tool_tremolo's duration and timestamp lookups.
    const owner = this.m_address.getOwner();
    this.copyHashFrom(other);
    this.m_address.copyFrom(other.m_address);
    this.m_address.setOwner(owner);
  }
  // C++ HumdrumToken::insertTokenAfter (humlib.cpp).
  insertTokenAfter(token: HTp): void {
    if (token === null) return;
    if (this.m_nextTokens.length === 0) {
      this.m_nextTokens.push(token);
      return;
    }
    const oldnext = this.m_nextTokens[0];
    this.m_nextTokens[0] = token;
    token.m_previousTokens = [this];
    token.m_nextTokens = oldnext ? [oldnext] : [];
    if (oldnext) {
      if (oldnext.m_previousTokens.length === 0) oldnext.m_previousTokens.push(token);
      else oldnext.m_previousTokens[0] = token;
    }
  }
  getPreviousToken(i = 0): HTp { return i < 0 || i >= this.m_previousTokens.length ? null : this.m_previousTokens[i]; }
  getNextTokens(): HTp[] { return [...this.m_nextTokens]; }
  getPreviousTokens(): HTp[] { return [...this.m_previousTokens]; }
  getNextFieldToken(): HTp {
    const line = this.getLine(); if (!line) return null;
    const f = this.getFieldIndex();
    if (f >= line.getFieldCount() - 1) return null;
    return line.token(f + 1);
  }
  getPreviousFieldToken(): HTp {
    const line = this.getLine(); if (!line) return null;
    const f = this.getFieldIndex();
    if (f < 1) return null;
    return line.token(f - 1);
  }
  getPreviousField(): HTp { return this.getPreviousFieldToken(); }
  getNextField(): HTp { return this.getNextFieldToken(); }
  clearLinkInfo(): void {
    this.m_linkedParameterTokens = [];
    this.m_nextTokens = []; this.m_previousTokens = [];
    this.m_nextNonNullTokens = []; this.m_previousNonNullTokens = [];
  }
  addNextNonNullToken(token: HumdrumToken): void {
    if (this.m_nextNonNullTokens.includes(token)) return;
    this.m_nextNonNullTokens.push(token);
  }
  m_nextNonNullTokensRef(): HTp[] { return this.m_nextNonNullTokens; }
  m_previousNonNullTokensRef(): HTp[] { return this.m_previousNonNullTokens; }
  getLinkedParameterSetCount(): number { return this.m_linkedParameterTokens.length; }
  getLinkedParameterSet(index: number): HumParamSet | null {
    const token = this.m_linkedParameterTokens[index];
    if (token === undefined || token === null) return null;
    return token.getParameterSet();
  }
  getParameterSet(): HumParamSet | null { return this.m_parameterSet; }
  // C++ HumdrumToken::storeParameterSet: parse a `!LO:`/`!!LO:` comment into a
  // HumParamSet so that other tokens can reference it as a linked set.
  storeParameterSet(): void {
    this.m_parameterSet = null;
    if ((this.isCommentLocal() || this.isCommentGlobal()) && this.find(':') !== -1) {
      this.m_parameterSet = new HumParamSet(this.text);
    }
  }
  // C++ HumdrumToken::addLinkedParameterSet: keep the sets sorted by line index and
  // drop the ones marked `:ignore` (layout commands Verovio cannot consume).
  addLinkedParameterSet(token: HTp): number {
    if (token === null || token.find(':ignore') !== -1) return -1;
    for (let i = 0; i < this.m_linkedParameterTokens.length; ++i) {
      if (this.m_linkedParameterTokens[i] === token) return i;
    }
    const lineindex = token.getLineIndex();
    const tokens = this.m_linkedParameterTokens;
    if (tokens.length === 0 || lineindex >= tokens[tokens.length - 1]!.getLineIndex()) {
      tokens.push(token);
    }
    else {
      for (let i = 0; i < tokens.length; ++i) {
        if (lineindex < tokens[i]!.getLineIndex()) { tokens.splice(i, 0, token); break; }
      }
    }
    return tokens.length - 1;
  }
  // C++ HumdrumToken::getLayoutParameter: local parameter first, then any linked
  // `!LO:<category>` set, gated on the 1-indexed subtoken selection parameter `n`.
  getLayoutParameter(category: string, keyname: string, subtokenindex = -1): string {
    // First check for any local layout parameter:
    const testoutput = this.getValue('LO', category, keyname);
    if (testoutput !== '') {
      if (subtokenindex >= 0) {
        const n = this.getValueInt('LO', category, 'n');
        if (n === subtokenindex + 1) return testoutput;
      }
      else {
        return testoutput;
      }
    }

    let output = '';
    const lcount = this.getLinkedParameterSetCount();
    if (lcount === 0) return output;

    let nparam = '';
    for (let p = 0; p < lcount; ++p) {
      const hps = this.getLinkedParameterSet(p);
      if (hps === null) continue;
      if (hps.getNamespace1() !== 'LO') continue;
      if (hps.getNamespace2() !== category) continue;

      output = '';
      for (let q = 0; q < hps.getCount(); ++q) {
        const key = hps.getParameterName(q);
        if (key === keyname) {
          output = hps.getParameterValue(q);
          if (subtokenindex < 0) return output;
        }
        if (key === 'n') {
          nparam = hps.getParameterValue(q);
        }
      }
      if (nparam === '') {
        // No subtoken selection for this parameter, so return if not empty:
        if (output !== '') return output;
      }
      else if (subtokenindex < 0) {
        if (output !== '') return output;
      }
      else {
        // There is a subtoken selection number, so return output if n matches it
        // (minus one). Currently @n requires a single value.
        const n = Number.parseInt(nparam, 10);
        if (n === subtokenindex + 1) return output;
        // not the output that is required, so suppress for end of loop:
        output = '';
      }
    }

    return output;
  }
  getVisualDuration(subtokenindex = -1): string {
    return this.getLayoutParameter('N', 'vis', subtokenindex);
  }
  getVisualDurationChord(): string {
    return this.getLayoutParameter('N', 'vis');
  }
  getVisualDurationNote(subtokenindex: number): string {
    return this.getLayoutParameter('N', 'vis', subtokenindex);
  }
  linkedParameterIsGlobal(index: number): boolean {
    const token = this.m_linkedParameterTokens[index];
    return token === undefined || token === null ? false : token.isCommentGlobal();
  }
  // C++ HumdrumToken::getXmlId (humlib.cpp:39711) — `loc<line>_<field>` with the
  // owning file's prefix.
  getXmlId(prefix = ''): string {
    let output = prefix.length > 0 ? prefix : this.getXmlIdPrefix();
    output += 'loc' + String(this.getLineIndex()) + '_';
    output += String(this.getFieldIndex());
    return output;
  }
  getXmlIdPrefix(): string {
    const own = this.getOwner();
    if (own === null) return '';
    return own.getXmlIdPrefix();
  }
  // C++ HumdrumToken::printXmlLinkedParameters (humlib.cpp:39490).
  printXmlLinkedParameters(level: number, indent = '\t'): string {
    if (this.m_parameterSet === null) return '';
    return this.m_parameterSet.printXml(level, indent);
  }
  // C++ HumdrumToken::printXmlLinkedParameterInfo (humlib.cpp:39508).
  printXmlLinkedParameterInfo(level: number, indent = '\t'): string {
    if (this.m_linkedParameterTokens.length === 0) return '';

    let out = Convert.repeatString(indent, level) + '<parameters-linked>\n';
    level++;
    for (let i = 0; i < this.m_linkedParameterTokens.length; i++) {
      const token = this.m_linkedParameterTokens[i];
      if (token === undefined || token === null) continue;
      out += Convert.repeatString(indent, level) + '<linked-parameter';
      out += ' idref="';
      const owner = token.getOwner();
      if (owner !== null && owner.isCommentGlobal()) {
        out += owner.getXmlId();
      }
      else {
        out += token.getXmlId();
      }
      out += '">\n';
    }
    level--;
    out += Convert.repeatString(indent, level) + '</parameters-linked>\n';
    return out;
  }
  // C++ HumdrumToken::printGlobalXmlParameterInfo / printXmlParameterInfo.
  printGlobalXmlParameterInfo(level: number, indent = '\t'): string {
    return this.printHashXmlAsGlobal(level, indent);
  }
  printXmlParameterInfo(level: number, indent = '\t'): string {
    return this.printHashXml(level, indent);
  }
  // C++ HumdrumToken::printXmlBaseInfo (humlib.cpp:39574).
  printXmlBaseInfo(level: number, indent = '\t'): string {
    let out = Convert.repeatString(indent, level);
    out += '<dataType>' + this.getDataType().substr(2) + '</dataType>\n';

    out += Convert.repeatString(indent, level) + '<tokenType>';
    if (this.isNull()) out += 'null';
    else if (this.isManipulator()) out += 'manipulator';
    else if (this.isCommentLocal()) out += 'local-comment';
    else if (this.isBarline()) out += 'barline';
    else if (this.isData()) out += 'data';
    else out += 'interpretation';
    out += '</tokenType>\n';

    if (this.isDataType('**kern')) {
      if (this.isNote()) {
        out += Convert.repeatString(indent, level) + '<tokenFunction>note</tokenFunction>\n';
      }
      else if (this.isRest()) {
        out += Convert.repeatString(indent, level) + '<tokenFunction>note</tokenFunction>\n';
      }
    }

    if (this.isNull()) {
      const previous = this.getPreviousNonNullDataToken(0);
      if (previous !== null) {
        out += Convert.repeatString(indent, level) + '<nullResolve';
        out += ` text="${Convert.encodeXml(previous.toString())}"`;
        out += ` idref="${previous.getXmlId()}"`;
        out += '/>\n';
      }
    }

    return out;
  }
  // C++ HumdrumToken::printXmlStructureInfo (humlib.cpp:39618).
  printXmlStructureInfo(level: number, indent = '\t'): string {
    if (this.getDuration().isNonNegative()) {
      return Convert.repeatString(indent, level) + '<duration'
        + Convert.getHumNumAttributes(this.getDuration()) + '/>\n';
    }
    return '';
  }
  // C++ HumdrumToken::printXmlContentInfo (humlib.cpp:39648).
  printXmlContentInfo(level: number, indent = '\t'): string {
    if (this.hasSlurStart()) {
      let out = Convert.repeatString(indent, level) + '<slur';
      if (this.isDefined('auto', 'hangingSlur')) {
        out += ` hanging="${this.getValue('auto', 'hangingSlur')}"`;
      }
      out += '>\n';
      out += Convert.repeatString(indent, level + 1);
      out += '<duration' + Convert.getHumNumAttributes(this.getSlurDuration()) + '/>\n';
      out += Convert.repeatString(indent, level) + '</slur>\n';
      return out;
    }
    return '';
  }
  hasSlurStart(): boolean {
    if (this.isDataType('**kern')) return this.toString().indexOf('(') !== -1;
    return false;
  }
  getSlurDuration(scale = new HumNum(1)): HumNum {
    if (!this.isDataTypeLike('**kern')) return new HumNum(0);
    if (this.isDefined('auto', 'slurDuration')) {
      return this.getValueFraction('auto', 'slurDuration');
    }
    if (this.isDefined('auto', 'slurEnd')) {
      const slurend = this.getValueHTp('auto', 'slurEnd');
      if (slurend !== null) {
        return slurend.getDurationFromStart(scale).sub(this.getDurationFromStart(scale));
      }
    }
    return new HumNum(0);
  }
  // C++ HumdrumToken::printXml (humlib.cpp:39462).
  printXml(level: number, indent = '\t'): string {
    let out = Convert.repeatString(indent, level);
    out += '<field';
    out += ` n="${this.getTokenIndex()}"`;

    out += ` track="${this.getTrack()}"`;
    if (this.getSubtrack() > 0) {
      out += ` subtrack="${this.getSubtrack()}"`;
    }
    out += ` token="${Convert.encodeXml(this.toString())}"`;
    out += ` xml:id="${this.getXmlId()}"`;
    out += '>\n';

    out += this.printXmlBaseInfo(level + 1, indent);
    out += this.printXmlStructureInfo(level + 1, indent);

    if (this.isData()) {
      if (this.isNote()) {
        out += Convert.repeatString(indent, level + 1) + '<pitch';
        out += getKernPitchAttributes(this.toString());
        out += '/>\n';
      }
    }

    out += this.printXmlContentInfo(level + 1, indent);
    out += this.printXmlParameterInfo(level + 1, indent);
    out += this.printXmlLinkedParameterInfo(level + 1, indent);
    out += this.printXmlLinkedParameters(level + 1, indent);

    out += Convert.repeatString(indent, level) + '</field>\n';
    return out;
  }
  assignText(t: string): void { this.text = t; }
  setText(t: string): void { this.text = t; }
  getText(): string { return this.text; }
}

export class HumdrumLine extends HumHash {
  private text: string;
  private m_tokens: HumdrumToken[] = [];
  private m_tabs: number[] = [];
  private m_lineindex = 0;
  private m_owner: unknown = null;
  private m_duration = new HumNum(-1);
  private m_durationFromStart = new HumNum(-1);
  private m_durationFromBarline = new HumNum(0);
  private m_durationToBarline = new HumNum(0);
  m_rhythmAnalyzed = false;
  constructor(value?: string | HumdrumLine, owner?: unknown) {
    super();
    if (value instanceof HumdrumLine) {
      this.text = value.text;
      this.m_lineindex = value.m_lineindex;
      this.m_tokens = value.m_tokens.map((t) => new HumdrumToken(t, this));
      this.m_tabs = [...value.m_tabs];
      this.m_owner = null;
    } else {
      this.text = value ?? '';
      if (this.text.length > 0 && this.text.charCodeAt(this.text.length - 1) === 0x0d) this.text = this.text.slice(0, -1);
      this.setPrefix('!!');
      if (value !== undefined) this.createTokensFromLine();
    }
    if (owner !== undefined) this.m_owner = owner;
  }
  toString(): string { return this.text; }
  valueOf(): string { return this.text; }
  at(i: number): string { return this.text[i] ?? ''; }
  substr(pos: number, len?: number): string { return this.text.substr(pos, len); }
  compare(pos: number, len: number, other: string): number {
    const a = this.text.substr(pos, len);
    return a < other ? -1 : a > other ? 1 : 0;
  }
  find(s: string, from = 0): number { return this.text.indexOf(s, from); }
  equalChar(index: number, ch: string): boolean {
    if (index < 0 || index >= this.text.length) return false;
    return this.text[index] === ch;
  }
  getChar(index: number): string { return index < 0 || index >= this.text.length ? '\0' : this.text[index]; }
  isEmpty(): boolean { return this.text.length === 0; }
  isBlank(): boolean { return this.isEmpty(); }
  isComment(): boolean { return this.equalChar(0, '!'); }
  isCommentLocal(): boolean { return this.equalChar(0, '!') && !this.equalChar(1, '!'); }
  isLocalComment(): boolean { return this.isCommentLocal(); }
  isCommentGlobal(): boolean { return this.equalChar(0, '!') && this.equalChar(1, '!'); }
  isGlobalComment(): boolean { return this.isCommentGlobal(); }
  isCommentUniversal(): boolean { return this.equalChar(0, '!') && this.equalChar(1, '!') && this.equalChar(2, '!') && this.equalChar(3, '!'); }
  isUniversalComment(): boolean { return this.isCommentUniversal(); }
  isReference(): boolean { return this.isGlobalReference() || this.isUniversalReference(); }
  isReferenceRecord(): boolean { return this.isReference(); }
  isGlobalReference(): boolean {
    if (this.text.length < 5 || this.text.substr(0, 3) !== '!!!' || this.at(3) === '!') return false;
    const colloc = this.text.indexOf(':'); if (colloc === -1) return false;
    const sp = this.text.indexOf(' '); const tb = this.text.indexOf('\t');
    if (sp !== -1 && sp < colloc) return false;
    if (tb !== -1 && tb < colloc) return false;
    return true;
  }
  isUniversalReference(): boolean {
    if (this.text.length < 5 || this.text.substr(0, 4) !== '!!!!' || this.at(4) === '!') return false;
    const colloc = this.text.indexOf(':'); if (colloc === -1) return false;
    const sp = this.text.indexOf(' '); const tb = this.text.indexOf('\t');
    if (sp !== -1 && sp < colloc) return false;
    if (tb !== -1 && tb < colloc) return false;
    return true;
  }
  private static trimRef(s: string): string { return s.replace(/^\s+|\s+$/g, ''); }
  getGlobalReferenceKey(): string {
    if (this.text.length < 5 || this.text.substr(0, 3) !== '!!!' || this.at(3) === '!') return '';
    const colloc = this.text.indexOf(':'); if (colloc === -1) return '';
    return HumdrumLine.trimRef(this.text.slice(3, colloc));
  }
  getGlobalReferenceValue(): string {
    if (this.text.length < 6 || this.text.substr(0, 3) !== '!!!' || this.at(4) === '!') return '';
    const colloc = this.text.indexOf(':'); if (colloc === -1) return '';
    return HumdrumLine.trimRef(this.text.slice(colloc + 1));
  }
  getUniversalReferenceKey(): string {
    if (this.text.length < 6 || this.text.substr(0, 4) !== '!!!!' || this.at(4) === '!') return '';
    const colloc = this.text.indexOf(':'); if (colloc === -1) return '';
    return HumdrumLine.trimRef(this.text.slice(4, colloc));
  }
  getUniversalReferenceValue(): string {
    if (this.text.length < 6 || this.text.substr(0, 4) !== '!!!!' || this.at(4) === '!') return '';
    const colloc = this.text.indexOf(':'); if (colloc === -1) return '';
    return HumdrumLine.trimRef(this.text.slice(colloc + 1));
  }
  getReferenceKey(): string {
    if (this.text.length < 4 || this.text.substr(0, 3) !== '!!!') return '';
    return this.at(3) !== '!' ? this.getGlobalReferenceKey() : this.getUniversalReferenceKey();
  }
  getReferenceValue(): string {
    if (this.text.length < 4 || this.text.substr(0, 3) !== '!!!') return '';
    return this.at(3) !== '!' ? this.getGlobalReferenceValue() : this.getUniversalReferenceValue();
  }
  isSignifier(): boolean { return this.text.length >= 9 && this.text.substr(0, 8) === '!!!RDF**'; }
  // C++ HumdrumLine::getXmlId / getXmlIdPrefix (humlib.cpp:34835, 34858).
  getXmlId(prefix = ''): string {
    let output = prefix.length > 0 ? prefix : this.getXmlIdPrefix();
    output += 'L' + String(this.getLineIndex() + 1);
    return output;
  }
  getXmlIdPrefix(): string {
    if (this.m_owner === null) return '';
    return (this.m_owner as HumdrumFileBase).getXmlIdPrefix();
  }
  // C++ HumdrumLine::printXmlParameterInfo / printGlobalXmlParameterInfo.
  printXmlParameterInfo(level: number, indent = '\t'): string { return this.printHashXml(level, indent); }
  printGlobalXmlParameterInfo(level: number, indent = '\t'): string {
    const token = this.token(0);
    return token === null ? '' : token.printGlobalXmlParameterInfo(level, indent);
  }
  // C++ HumdrumLine::printXmlGlobalLinkedParameterInfo / printXmlGlobalLinkedParameters
  // are explicit no-ops (their bodies are commented out).
  printXmlGlobalLinkedParameterInfo(_level: number, _indent = '\t'): string { return ''; }
  printXmlGlobalLinkedParameters(_level: number, _indent = '\t'): string { return ''; }
  // C++ HumdrumLine::printXml (humlib.cpp:34672) — <frame> for spine lines and
  // <metaFrame> for global comments, reference records and blank lines.
  printXml(level: number, indent = '\t'): string {
    let out = '';
    if (this.hasSpines()) {
      out += Convert.repeatString(indent, level) + '<frame';
      out += ` n="${this.getLineIndex()}"`;
      out += ` xml:id="${this.getXmlId()}"`;
      out += '>\n';
      level++;

      out += Convert.repeatString(indent, level) + '<frameInfo>\n';
      level++;

      out += Convert.repeatString(indent, level) + '<fieldCount>';
      out += String(this.getTokenCount()) + '</fieldCount>\n';

      out += Convert.repeatString(indent, level);
      out += '<frameStart';
      out += Convert.getHumNumAttributes(this.getDurationFromStart());
      out += '/>\n';

      out += Convert.repeatString(indent, level);
      out += '<frameDuration';
      out += Convert.getHumNumAttributes(this.getDuration());
      out += '/>\n';

      out += Convert.repeatString(indent, level) + '<frameType>';
      if (this.isData()) out += 'data';
      else if (this.isBarline()) out += 'barline';
      else if (this.isInterpretation()) out += 'interpretation';
      else if (this.isLocalComment()) out += 'local-comment';
      out += '</frameType>\n';

      if (this.isBarline()) {
        out += Convert.repeatString(indent, level);
        out += '<barlineDuration';
        out += Convert.getHumNumAttributes(this.getBarlineDuration());
        out += '/>\n';
      }

      // C++ writes <kernBoundary> to std::cout instead of the passed stream
      // (humlib.cpp:34722-34743) — a known upstream bug; the element never reaches
      // the XML. Kept faithful by omitting it here.

      level--;
      out += Convert.repeatString(indent, level) + '</frameInfo>\n';

      out += Convert.repeatString(indent, level) + '<fields>\n';
      level++;
      for (let i = 0; i < this.getFieldCount(); i++) {
        const token = this.token(i);
        if (token !== null) out += token.printXml(level, indent);
      }
      level--;
      out += Convert.repeatString(indent, level) + '</fields>\n';

      out += this.printGlobalXmlParameterInfo(level, indent);
      out += this.printXmlParameterInfo(level, indent);
      out += this.printXmlGlobalLinkedParameterInfo(level, indent);
      out += this.printXmlGlobalLinkedParameters(level, indent);

      level--;
      out += Convert.repeatString(indent, level) + '</frame>\n';
    }
    else {
      // global comments, reference records, or blank lines print here.
      out += Convert.repeatString(indent, level) + '<metaFrame';
      out += ` n="${this.getLineIndex()}"`;
      out += ` token="${Convert.encodeXml(this.toString())}"`;
      out += ` xml:id="${this.getXmlId()}"`;
      out += '>\n';
      level++;

      out += Convert.repeatString(indent, level) + '<frameInfo>\n';
      level++;

      out += Convert.repeatString(indent, level);
      out += '<startTime';
      out += Convert.getHumNumAttributes(this.getDurationFromStart());
      out += '/>\n';

      out += Convert.repeatString(indent, level) + '<frameType>';
      if (this.isGlobalReference()) out += 'reference';
      else if (this.isUniversalReference()) out += 'ureference';
      else if (this.isBlank()) out += 'empty';
      else out += 'global-comment';
      out += '</frameType>\n';

      if (this.isReference()) {
        out += Convert.repeatString(indent, level);
        let key = this.getReferenceKey();
        let language = '';
        let primaryLanguage = '';
        let loc = key.indexOf('@@');
        if (loc !== -1) {
          language = key.substr(loc + 2);
          key = key.substr(0, loc);
          primaryLanguage = 'true';
        }
        else {
          loc = key.indexOf('@');
          if (loc !== -1) {
            language = key.substr(loc + 1);
            key = key.substr(0, loc);
          }
        }

        out += '<referenceKey';
        if (language.length > 0) out += ` language="${Convert.encodeXml(language)}"`;
        if (primaryLanguage.length > 0) out += ` primary="${Convert.encodeXml(primaryLanguage)}"`;
        out += '>' + Convert.encodeXml(key);
        out += '</referenceKey>\n';

        out += Convert.repeatString(indent, level);
        out += '<referenceValue>' + Convert.encodeXml(this.getGlobalReferenceValue());
        out += '</referenceValue>\n';
      }

      level--;
      out += Convert.repeatString(indent, level) + '</frameInfo>\n';

      out += this.printGlobalXmlParameterInfo(level - 2, indent);
      out += this.printXmlParameterInfo(level - 2, indent);
      out += this.printXmlGlobalLinkedParameterInfo(level - 2, indent);
      out += this.printXmlGlobalLinkedParameters(level, indent);

      level--;
      out += Convert.repeatString(indent, level) + '</metaFrame>\n';
    }

    return out;
  }
  // C++ HumdrumLine::storeGlobalLinkedParameters: a `!!LO:` global comment keeps its
  // parsed parameter set on its first token, to be linked to the following tokens.
  storeGlobalLinkedParameters(): void {
    const token = this.token(0);
    if (token !== null) token.storeParameterSet();
  }
  getGlobalLinkedParameterSets(): HumdrumToken[] {
    const out: HumdrumToken[] = [];
    for (const token of this.m_tokens) {
      if (token.getParameterSet() !== null) out.push(token);
    }
    return out;
  }
  hasSpines(): boolean { return !(this.isEmpty() || this.isCommentGlobal()); }
  isGlobal(): boolean { return !this.hasSpines(); }
  isExclusive(): boolean { return this.equalChar(0, '*') && this.equalChar(1, '*'); }
  isExclusiveInterpretation(): boolean { return this.isExclusive(); }
  isInterp(): boolean { return this.equalChar(0, '*'); }
  isInterpretation(): boolean { return this.isInterp(); }
  isBarline(): boolean { return this.equalChar(0, '='); }
  isData(): boolean { return !(this.isComment() || this.isInterp() || this.isBarline() || this.isEmpty()); }
  isManipulator(): boolean { return this.m_tokens.some((t) => t.isManipulator()); }
  isAllNull(): boolean {
    if (!this.hasSpines()) return false;
    return this.m_tokens.every((t) => t.isNull());
  }
  getTokenCount(): number { return this.m_tokens.length; }
  getFieldCount(): number { return this.getTokenCount(); }
  token(index: number): HTp { return index < 0 || index >= this.m_tokens.length ? null : this.m_tokens[index]; }
  getTokens(): HumdrumToken[] { return [...this.m_tokens]; }
  getTokenString(index: number): string { const t = this.token(index); return t === null ? '' : t.toString(); }
  getLineIndex(): number { return this.m_lineindex; }
  getLineNumber(): number { return this.m_lineindex + 1; }
  getOwner(): HumdrumFile | null { return this.m_owner as HumdrumFile | null; }
  setOwner(o: unknown): void { this.m_owner = o; }
  setLineIndex(i: number): void { this.m_lineindex = i; }
  setText(t: string): void { this.text = t; }
  getText(): string { return this.text; }
  // C++ HumdrumLine::appendToken (used by GridSlice::transferTokens).
  appendToken(token: HumdrumToken | string): void {
    const t = typeof token === 'string' ? new HumdrumToken(token, this) : token;
    this.m_tokens.push(t);
    this.m_tabs.push(1);
  }
  // C++ HumdrumLine::copyStructure (humlib.cpp:35162).
  copyStructure(line: HumdrumLine, empty: string): void {
    this.m_tokens = line.m_tokens.map((t) => {
      const copy = new HumdrumToken(empty, this);
      copy.copyStructure(t);
      return copy;
    });
    this.createLineFromTokens();
    for (const t of this.m_tokens) t.setOwner(this);
    this.m_tabs = [...line.m_tabs];
    this.m_rhythmAnalyzed = line.m_rhythmAnalyzed;
    this.m_owner = line.m_owner;
  }
  getTrackStart(track: number): HTp { const o = this.getOwner(); return o === null ? null : o.getTrackStart(track); }
  getTrackEnd(track: number, sub = 0): HTp { const o = this.getOwner(); return o === null ? null : o.getTrackEnd(track, sub); }
  createTokensFromLine(): number {
    this.m_tokens = []; this.m_tabs = [];
    if (this.text.length === 0) {
      this.m_tokens.push(new HumdrumToken('', this)); this.m_tabs.push(0);
    } else if (this.text.substr(0, 2) === '!!') {
      this.m_tokens.push(new HumdrumToken(this.text, this)); this.m_tabs.push(0);
    } else {
      let tstring = ''; let ch = ''; let lastch = '';
      for (let i = 0; i < this.text.length; i++) {
        lastch = ch; ch = this.text[i];
        if (ch === '\t') {
          if (lastch !== '\t') {
            this.m_tokens.push(new HumdrumToken(tstring, this)); this.m_tabs.push(1); tstring = '';
          } else if (this.m_tabs.length > 0) this.m_tabs[this.m_tabs.length - 1]++;
        } else tstring += ch;
      }
      if (tstring.length > 0) { this.m_tokens.push(new HumdrumToken(tstring, this)); this.m_tabs.push(0); }
    }
    return this.m_tokens.length;
  }
  createLineFromTokens(): void {
    let out = '';
    const toks = this.m_tokens.filter((t) => t !== null);
    this.m_tokens = toks;
    for (let i = 0; i < toks.length; i++) {
      out += toks[i].toString();
      if (i < toks.length - 1) {
        while (this.m_tabs.length <= i) this.m_tabs.push(1);
        if (this.m_tabs[i] === 0) this.m_tabs[i] = 1;
        out += '\t'.repeat(this.m_tabs[i]);
      }
    }
    this.text = out;
  }
  generateLineFromTokens(): void { this.createLineFromTokens(); }
  removeExtraTabs(): void { this.m_tabs = this.m_tabs.map(() => 0); }
  addExtraTabs(trackWidths: number[]): void {
    if (!this.hasSpines()) return;
    this.m_tabs = this.m_tabs.map(() => 1);
    const local = new Array(trackWidths.length).fill(0);
    let lasttrack = 0; let track = 0;
    for (let j = 0; j < this.getFieldCount(); j++) {
      lasttrack = track;
      track = this.token(j)!.getTrack();
      if (track !== lasttrack && lasttrack > 0) {
        const diff = (trackWidths[lasttrack] ?? 0) - (local[lasttrack] ?? 0);
        if (diff > 0 && j > 0) this.m_tabs[j - 1] += diff;
      }
      local[track] = (local[track] ?? 0) + 1;
    }
  }
  setLineFromCsv(csv: string, separator = ','): void {
    if (csv.length < 1) return;
    let newcsv = csv;
    if (newcsv.length > 0 && newcsv.charCodeAt(newcsv.length - 1) === 0x0d) newcsv = newcsv.slice(0, -1);
    if (newcsv.length >= 2 && newcsv[0] === '!' && newcsv[1] === '!') { this.setText(newcsv); return; }
    let output = ''; let inquote = false;
    for (let i = 0; i < newcsv.length; i++) {
      if (newcsv[i] === '"' && !inquote) { inquote = true; continue; }
      if (inquote && newcsv[i] === '"' && newcsv[i + 1] === '"' && i < newcsv.length - 1) { output += '"'; i++; continue; }
      if (newcsv[i] === '"') { inquote = false; continue; }
      if (!inquote && newcsv.substr(i, separator.length) === separator) { output += '\t'; i += separator.length - 1; continue; }
      output += newcsv[i];
    }
    this.text = output;
  }
  analyzeTracks(err: { value: string }): boolean {
    if (!this.hasSpines()) return err.value.length === 0;
    let maxtrack = 0;
    for (const tok of this.m_tokens) {
      const info = tok.getSpineInfo();
      let track = 0;
      for (let j = 0; j < info.length; j++) {
        if (info[j] < '0' || info[j] > '9') continue;
        track = info.charCodeAt(j) - 48;
        for (let k = j + 1; k < info.length; k++) {
          if (info[k] < '0' || info[k] > '9') break;
          track = track * 10 + (info.charCodeAt(k) - 48);
        }
        break;
      }
      if (maxtrack < track) maxtrack = track;
      tok.setTrack(track);
    }
    const subtracks = new Array(maxtrack + 1).fill(0);
    const cursub = new Array(maxtrack + 1).fill(0);
    for (const tok of this.m_tokens) subtracks[tok.getTrack()]++;
    for (const tok of this.m_tokens) {
      const track = tok.getTrack();
      if (subtracks[track] > 1) tok.setSubtrack(++cursub[track]);
      else tok.setSubtrack(0);
      tok.setSubtrackCount(subtracks[track]);
    }
    return err.value.length === 0;
  }
  clearTokenLinkInfo(): void {
    if (this.isEmpty()) return;
    for (let i = 0; i < this.getFieldCount(); i++) this.token(i)?.clearLinkInfo();
  }
  analyzeTokenDurations(err: { value: string } = { value: '' }): boolean {
    if (!this.hasSpines()) return err.value.length === 0;
    for (const tok of this.m_tokens) tok.analyzeDuration();
    return err.value.length === 0;
  }
  getDurationFromStartNoAnalyze(): HumNum { return new HumNum(this.m_durationFromStart); }
  getDurationNoAnalyze(): HumNum { return new HumNum(this.m_duration); }
  ensureRhythm(): void {
    if (!this.m_rhythmAnalyzed) {
      const o = this.getOwner();
      if (o !== null) o.analyzeRhythmStructure();
    }
  }
  getDuration(scale?: HumNum): HumNum {
    this.ensureRhythm();
    return scale === undefined ? new HumNum(this.m_duration) : this.m_duration.mul(scale);
  }
  setDuration(dur: HumNum): void {
    this.m_duration = dur.isNonNegative() ? new HumNum(dur) : new HumNum(0);
  }
  getDurationFromStart(scale?: HumNum): HumNum {
    this.ensureRhythm();
    return scale === undefined ? new HumNum(this.m_durationFromStart) : this.m_durationFromStart.mul(scale);
  }
  setDurationFromStart(dur: HumNum): void { this.m_durationFromStart = new HumNum(dur); }
  getDurationFromBarline(scale?: HumNum): HumNum {
    this.ensureRhythm();
    return scale === undefined ? new HumNum(this.m_durationFromBarline) : this.m_durationFromBarline.mul(scale);
  }
  setDurationFromBarline(dur: HumNum): void { this.m_durationFromBarline = new HumNum(dur); }
  getDurationToBarline(scale?: HumNum): HumNum {
    this.ensureRhythm();
    return scale === undefined ? new HumNum(this.m_durationToBarline) : this.m_durationToBarline.mul(scale);
  }
  setDurationToBarline(dur: HumNum): void { this.m_durationToBarline = new HumNum(dur); }
  getBarlineDuration(scale?: HumNum): HumNum {
    this.ensureRhythm();
    if (this.isBarline()) return this.getDurationToBarline(scale);
    const from = this.getDurationFromBarline(scale);
    const to = this.getDurationToBarline(scale);
    return from.add(to);
  }
  isAllRhythmicNull(): boolean {
    if (!this.hasSpines()) return false;
    for (const tok of this.m_tokens) {
      if (!tok.hasRhythm()) continue;
      if (!tok.isNull()) return false;
    }
    return true;
  }
  isGraceLine(): boolean {
    if (!this.isData()) return false;
    return this.getDuration().isZero();
  }
  allSameBarlineStyle(): boolean {
    // C++: return !getValueInt("auto", "barlinesDifferent") (set by HumdrumFileBase::analyzeBarlines).
    return !this.getValueInt('auto', 'barlinesDifferent');
  }
  hasDataStraddle(): boolean { return this.getValueInt('auto', 'straddlingData') ? true : false; }
}

/** Convert **recip rhythmic values to quarter-note durations (humlib Convert::recipToDuration). */
export function recipToDuration(recip: string, scale?: HumNum, separator = ' '): HumNum {
  const sc = scale === undefined ? new HumNum(4) : scale;
  const loc = recip.indexOf(separator);
  const subtok = loc !== -1 ? recip.substr(0, loc) : recip;
  if (recip.indexOf('q') !== -1) return new HumNum(0);
  let dotcount = 0;
  let numi = -1;
  for (let i = 0; i < subtok.length; i++) {
    if (subtok[i] === '.') dotcount++;
    if (numi < 0 && subtok[i] >= '0' && subtok[i] <= '9') numi = i;
  }
  const pct = subtok.indexOf('%');
  let numerator = 1;
  let denominator = 1;
  const output = new HumNum(0);
  if (pct !== -1) {
    numerator = 1;
    denominator = subtok.charCodeAt(numi++) - 48;
    while (numi < subtok.length && subtok[numi] >= '0' && subtok[numi] <= '9') denominator = denominator * 10 + (subtok.charCodeAt(numi++) - 48);
    if (pct + 1 < subtok.length && subtok[pct + 1] >= '0' && subtok[pct + 1] <= '9') {
      let xi = pct + 1;
      numerator = subtok.charCodeAt(xi++) - 48;
      while (xi < subtok.length && subtok[xi] >= '0' && subtok[xi] <= '9') numerator = numerator * 10 + (subtok.charCodeAt(xi++) - 48);
    }
    output.assign(new HumNum(numerator, denominator));
  } else if (numi < 0) return new HumNum(0);
  else if (subtok[numi] === '0') {
    let zerocount = 1;
    for (let i = numi + 1; i < subtok.length; i++) { if (subtok[i] === '0') zerocount++; else break; }
    output.assign(new HumNum(Math.pow(2, zerocount), 1));
  } else {
    denominator = subtok.charCodeAt(numi++) - 48;
    while (numi < subtok.length && subtok[numi] >= '0' && subtok[numi] <= '9') denominator = denominator * 10 + (subtok.charCodeAt(numi++) - 48);
    output.assign(new HumNum(1, denominator));
  }
  if (dotcount <= 0) return output.mul(sc);
  const bot = Math.pow(2, dotcount);
  const top = Math.pow(2, dotcount + 1) - 1;
  return output.mul(new HumNum(top, bot)).mul(sc);
}

/** Deduplicating push used by non-null token analysis. */
export function addUniqueTokens(list: HTp[], additions: HTp[]): void {
  for (const t of additions) if (t !== null && !list.includes(t)) list.push(t);
}

/** Same as recipToDuration() but ignore augmentation dots. */
export function recipToDurationNoDots(recip: string, scale?: HumNum, separator = ' '): HumNum {
  return recipToDuration(recip.replace(/\./g, 'Z'), scale, separator);
}

/** Convert quarter-note duration to **recip string (humlib Convert::durationToRecip). */
/**
 * humlib Convert::kernToRecip -- keep only the **recip rhythmic characters
 * from **kern data (stops at the first space).
 */
export function kernToRecip(kerndata: string): string {
  let output = '';
  for (let i = 0; i < kerndata.length; i++) {
    const ch = kerndata[i];
    if (ch === ' ') break;
    if ((ch >= '0' && ch <= '9') || ch === '.' || ch === '%' || ch === 'q') output += ch;
  }
  return output;
}

export function durationToRecip(duration: HumNum, scale?: HumNum): string {
  let d = scale === undefined ? duration : duration.mul(scale);
  if (d.getNumerator() === 1) return String(d.getDenominator());
  if (d.getDenominator() === 1) {
    if (d.getNumerator() === 2) return '0';
    if (d.getNumerator() === 3) return '0.';
    if (d.getNumerator() === 4) return '00';
    if (d.getNumerator() === 6) return '00.';
    if (d.getNumerator() === 8) return '000';
    if (d.getNumerator() === 12) return '000.';
  }
  if (d.getNumerator() === 0) return 'q';
  const test1dot = d.mul(2).div(3);
  if (test1dot.getNumerator() === 1) return String(test1dot.getDenominator()) + '.';
  const test2dot = d.mul(4).div(7);
  if (test2dot.getNumerator() === 1) return String(test2dot.getDenominator()) + '..';
  const test3dot = d.mul(8).div(15);
  if (test3dot.getNumerator() === 1) return String(test3dot.getDenominator()) + '...';
  return String(d.getDenominator()) + '%' + String(d.getNumerator());
}

export function trimWhiteSpace(s: string): string { return s.replace(/^\s+|\s+$/g, ''); }

export function kernToDiatonicPC(kerndata: string): number {
  for (let i = 0; i < kerndata.length; i++) {
    if (kerndata[i] === ' ') break;
    if (kerndata[i] === 'r') return -1000;
    switch (kerndata[i]) {
      case 'A': case 'a': return 5;
      case 'B': case 'b': return 6;
      case 'C': case 'c': return 0;
      case 'D': case 'd': return 1;
      case 'E': case 'e': return 2;
      case 'F': case 'f': return 3;
      case 'G': case 'g': return 4;
    }
  }
  return -2000;
}

export function kernToAccidentalCount(kerndata: string): number {
  let output = 0;
  for (let i = 0; i < kerndata.length; i++) {
    if (kerndata[i] === ' ') break;
    if (kerndata[i] === '-') output--;
    if (kerndata[i] === '#') output++;
  }
  return output;
}

export function kernToOctaveNumber(kerndata: string): number {
  let uc = 0;
  let lc = 0;
  if (kerndata === '.') return -1000;
  for (let i = 0; i < kerndata.length; i++) {
    if (kerndata[i] === ' ') break;
    if (kerndata[i] === 'r') return -1000;
    if (kerndata[i] >= 'A' && kerndata[i] <= 'G') uc++;
    if (kerndata[i] >= 'a' && kerndata[i] <= 'g') lc++;
  }
  if (uc > 0 && lc > 0) return -1000;
  if (uc > 0) return 4 - uc;
  if (lc > 0) return 3 + lc;
  return -1000;
}

export function kernToBase40PC(kerndata: string): number {
  const diatonic = kernToDiatonicPC(kerndata);
  if (diatonic < 0) return diatonic;
  const accid = kernToAccidentalCount(kerndata);
  let output = -1000;
  switch (diatonic) {
    case 0: output = 0; break;
    case 1: output = 6; break;
    case 2: output = 12; break;
    case 3: output = 17; break;
    case 4: output = 23; break;
    case 5: output = 29; break;
    case 6: output = 35; break;
  }
  return output + accid + 2;
}

export function kernToBase40(kerndata: string): number {
  const trimmed = trimWhiteSpace(kerndata);
  const pc = kernToBase40PC(trimmed);
  if (pc < 0) return pc;
  return pc + 40 * kernToOctaveNumber(trimmed);
}

export function base40ToDiatonic(b40: number): number {
  const chroma = ((b40 % 40) + 40) % 40;
  const octaveoffset = Math.trunc(b40 / 40) * 7;
  if (b40 < 0) return -1;
  if (chroma <= 4) return 0 + octaveoffset;
  if (chroma >= 6 && chroma <= 10) return 1 + octaveoffset;
  if (chroma >= 12 && chroma <= 16) return 2 + octaveoffset;
  if (chroma >= 17 && chroma <= 21) return 3 + octaveoffset;
  if (chroma >= 23 && chroma <= 27) return 4 + octaveoffset;
  if (chroma >= 29 && chroma <= 33) return 5 + octaveoffset;
  if (chroma >= 35 && chroma <= 39) return 6 + octaveoffset;
  return -1;
}

export function base40ToAccidental(b40: number): number {
  if (b40 < 0) return 0;
  switch (((b40 % 40) + 40) % 40) {
    case 0: case 6: case 12: case 17: case 23: case 29: case 35: return -2;
    case 1: case 7: case 13: case 18: case 24: case 30: case 36: return -1;
    case 2: case 8: case 14: case 19: case 25: case 31: case 37: return 0;
    case 3: case 9: case 15: case 20: case 26: case 32: case 38: return 1;
    case 4: case 10: case 16: case 21: case 27: case 33: case 39: return 2;
    default: return 0;
  }
}

export function kernToBase12PC(kerndata: string): number {
  const diatonic = kernToDiatonicPC(kerndata);
  if (diatonic < 0) return diatonic;
  const accid = kernToAccidentalCount(kerndata);
  let output = -1000;
  switch (diatonic) {
    case 0: output = 0; break;
    case 1: output = 2; break;
    case 2: output = 4; break;
    case 3: output = 5; break;
    case 4: output = 7; break;
    case 5: output = 9; break;
    case 6: output = 11; break;
  }
  return output + accid;
}

export function kernToMidiNoteNumber(kerndata: string): number {
  const pc = kernToBase12PC(kerndata);
  const octave = kernToOctaveNumber(kerndata);
  return pc + 12 * (octave + 1);
}

export function getKernSlurStartElisionLevel(kerndata: string, index: number): number {
  return getKernMarkElisionLevel(kerndata, index, '(');
}

export function getKernSlurEndElisionLevel(kerndata: string, index: number): number {
  return getKernMarkElisionLevel(kerndata, index, ')');
}

export function getKernMarkElisionLevel(kerndata: string, index: number, mark: string): number {
  let found = false;
  let output = 0;
  let count = 0;
  const target = index + 1;
  for (let i = 0; i < kerndata.length; i++) {
    if (kerndata[i] === mark) count++;
    if (count === target) {
      found = true;
      for (let j = i - 1; j >= 0; j--) {
        if (kerndata[j] === '&') output++;
        else break;
      }
      break;
    }
  }
  return found ? output : -1;
}

export function getKernBeamStartElisionLevel(kerndata: string, index: number): number {
  return getKernMarkElisionLevel(kerndata, index, 'L');
}

export function getKernBeamEndElisionLevel(kerndata: string, index: number): number {
  return getKernMarkElisionLevel(kerndata, index, 'J');
}

export function getKernPhraseStartElisionLevel(kerndata: string, index: number): number {
  return getKernMarkElisionLevel(kerndata, index, '{');
}

export function getKernPhraseEndElisionLevel(kerndata: string, index: number): number {
  return getKernMarkElisionLevel(kerndata, index, '}');
}

/** Convert Humdrum Toolkit transposition (`d{D}c{C}`/`*Trd`/`*ITrd`) to base-40 (humlib Convert::transToBase40). */
export function transToBase40(input: string): number {
  const parse = (re: RegExp): [number, number] | null => {
    const m = re.exec(input);
    return m === null ? null : [Number.parseInt(m[1], 10), Number.parseInt(m[2], 10)];
  };
  const vals = parse(/d(-?\d+)c(-?\d+)/) ?? parse(/\*Trd(-?\d+)c(-?\d+)/) ?? parse(/\*ITrd(-?\d+)c(-?\d+)/);
  if (vals === null) return 0;
  const [dval, cval] = vals;
  const dsign = dval < 0 ? -1 : 1;
  const doctave = Math.trunc(dsign * dval / 7);
  const table: Record<string, number> = {
    '0,0': 0, '0,1': 1, '0,2': 2, '1,0': 4, '1,1': 5, '1,2': 6, '1,3': 7, '1,4': 8,
    '2,2': 10, '2,3': 11, '2,4': 12, '2,5': 13, '2,6': 14, '3,3': 15, '3,4': 16,
    '3,5': 17, '3,6': 18, '3,7': 19, '4,5': 21, '4,6': 22, '4,7': 23, '4,8': 24,
    '4,9': 25, '5,7': 27, '5,8': 28, '5,9': 29, '5,10': 30, '5,11': 31,
    '6,9': 33, '6,10': 34, '6,11': 35, '6,12': 36, '6,13': 37, '7,10': 38,
  };
  const base = table[dval + ',' + cval] ?? 0;
  return base + 40 * doctave * dsign;
}


/** humlib Convert::tempoNameToMm. Returns -1 when no tempo name matches. */
export function tempoNameToMm(name: string, bot: number, top: number): number {
  const hre = new HumRegex();
  let output = -1;
  const table: [string, number][] = [
    ['larghissimo', 24], ['adagissimo', 35], ['all.*molto', 146], ['all.*vivace', 144],
    ['all.*moderato', 116], ['all.*fuoco', 138], ['all.*presto', 160], ['grave', 40],
    ['largo', 45], ['lento?', 50], ['larghetto', 63], ['adagio', 70], ['adagietto', 74],
    ['andantino', 90], ['marcia moderato', 85], ['andante moderato', 92], ['allegretto', 116],
    ['rasch', 128], ['vivo', 152], ['vif', 152], ['vivace', 164], ['schnell', 164],
    ['vivacissimo', 172], ['allegrissimo', 176], ['moderato', 108], ['andante', 88],
    ['presto', 180], ['allegro', 128], ['prestissimo', 208], ['bewegt', 144], ['all(?!a)', 128],
  ];
  for (const [pattern, value] of table) {
    if (hre.search(name, pattern, 'i')) { output = value; break; }
  }
  if (output <= 0) return output;
  if (hre.search(name, 'ma non troppo', 'i') || hre.search(name, 'non tanto')) {
    if (output > 100) output = Math.trunc(output * 0.93 + 0.5);
    else output = Math.trunc(output / 0.93 + 0.5);
  }
  if (bot === 2) output = Math.trunc(output * 1.75 + 0.5);
  else if (bot === 1) output = Math.trunc(output * 3.0 + 0.5);
  else if (bot === 8 && top % 3 === 0) output = Math.trunc(output * 1.5 + 0.5);
  else if (bot === 8) output = Math.trunc(output * 0.75 + 0.5);
  else if (bot === 16 && top % 3 === 0) output = Math.trunc(output * 1.5 / 2.0 + 0.5);
  else if (bot === 16) output = Math.trunc(output / 2.0 + 0.5);
  else if (bot === 32 && top % 3 === 0) output = Math.trunc(output * 1.5 / 4.0 + 0.5);
  else if (bot === 32) output = Math.trunc(output / 4.0 + 0.5);
  if (bot === 2 && top % 3 === 0) output = Math.trunc(output * 1.5 + 0.5);
  return output;
}

/** Convert base-40 interval to line-of-fifths offset (humlib Convert::base40IntervalToLineOfFifths). */
export function base40IntervalToLineOfFifths(base40interval: number): number {
  const table: Record<number, number> = {
    0: 0, 1: 7, 2: 14, 3: 100, 4: -12, 5: -5, 6: 2, 7: 9, 8: 16, 9: 100,
    10: -10, 11: -3, 12: 4, 13: 11, 14: 18, 15: -15, 16: -8, 17: -1, 18: 6,
    19: 13, 20: 100, 21: -13, 22: -6, 23: 1, 24: 8, 25: 15, 26: 100,
    27: -11, 28: -4, 29: 3, 30: 10, 31: 17, 32: 100, 33: -9, 34: -2,
    35: 5, 36: 12, 37: 19, 38: -14, 39: -7,
  };
  return table[((base40interval + 4000) % 40 + 40) % 40] ?? 100;
}

export function base7ToBase40(base7: number): number {
  const octave = Math.floor(base7 / 7);
  const b7pc = ((base7 % 7) + 7) % 7;
  let b40pc = 0;
  switch (b7pc) {
    case 0: b40pc = 0; break;
    case 1: b40pc = 6; break;
    case 2: b40pc = 12; break;
    case 3: b40pc = 17; break;
    case 4: b40pc = 23; break;
    case 5: b40pc = 29; break;
    case 6: b40pc = 35; break;
  }
  return octave * 40 + 2 + b40pc;
}

export function kernToBase7(kerndata: string): number {
  const diatonic = kernToDiatonicPC(kerndata);
  if (diatonic < 0) return diatonic;
  return diatonic + 7 * kernToOctaveNumber(kerndata);
}

export function kernToStaffLocation(token: string, clef: string): number {
  let offset: number;
  const m = /clef([GFC])([v^]*)(\d+)/.exec(clef);
  if (m !== null) {
    let octadj = 0;
    for (const ch of m[2]) octadj += ch === '^' ? -1 : 1;
    if (m[1] === 'F') offset = 14 + 4;
    else if (m[1] === 'C') offset = 28;
    else offset = 28 + 4;
    offset += (Number.parseInt(m[3], 10) - 1) * 2;
    offset += octadj * 7;
  } else offset = 28 + 2;
  return kernToBase7(token) - offset;
}

export class HumdrumFileBase extends HumHash {
  protected m_lines: HumdrumLine[] = [];
  protected m_trackstarts: HTp[] = [];
  protected m_trackends: HTp[][] = [];
  protected m_strand1d: Array<[HTp, HTp]> = [];
  protected m_strand2d: Array<Array<[HTp, HTp]>> = [];
  protected m_strandsAnalyzed = false;
  protected m_barlines: HumdrumLine[] = [];
  protected m_parseError = '';
  protected m_signifiers = new HumSignifiers();
  protected m_displayError = true;
  protected m_quietParse = false;
  protected m_filename = '';
  protected m_segmentLevel = 0;
  // C++ HumdrumFileBase::m_idprefix (humlib.h:2287) — prefix for HumdrumXML IDs.
  protected m_idprefix = '';

  public setXmlIdPrefix(value: string): void { this.m_idprefix = value; }
  public getXmlIdPrefix(): string { return this.m_idprefix; }
  constructor() { super(); this.addToTrackStarts(null); }
  clear(): void {
    this.m_lines = [];
    this.m_trackstarts = []; this.m_trackends = [];
    this.m_filename = ''; this.m_segmentLevel = 0;
  }
  read(contents: string): boolean {
    this.clear(); this.m_displayError = true;
    const rawLines = contents.split('\n');
    for (const raw of rawLines) {
      const s = new HumdrumLine(raw);
      s.setOwner(this);
      this.m_lines.push(s);
    }
    if (contents.length > 0 && contents.endsWith('\n') && this.m_lines.length > 0) {
      const last = this.m_lines[this.m_lines.length - 1];
      if (last.isEmpty()) this.m_lines.pop();
    }
    return this.analyzeBaseFromLines();
  }
  readCsv(contents: string, separator = ','): boolean {
    this.m_displayError = true;
    for (const raw of contents.split('\n')) {
      const s = new HumdrumLine();
      s.setLineFromCsv(raw, separator);
      s.setOwner(this);
      this.m_lines.push(s);
    }
    return this.analyzeBaseFromLines();
  }
  readString(contents: string): boolean { return this.read(contents); }
  readStringCsv(contents: string, separator = ','): boolean { return this.readCsv(contents, separator); }
  readNoRhythm(contents: string): boolean { return this.read(contents); }
  readStringNoRhythm(contents: string): boolean { return this.read(contents); }
  readStringNoRhythmCsv(contents: string, separator = ','): boolean { return this.readCsv(contents, separator); }
  analyzeBaseFromLines(): boolean {
    if (!this.analyzeTokens()) return this.isValid();
    if (!this.analyzeLines()) return this.isValid();
    if (!this.analyzeSpines()) return this.isValid();
    if (!this.analyzeLinks()) return this.isValid();
    if (!this.analyzeTracks()) return this.isValid();
    return this.isValid();
  }
  analyzeBaseFromTokens(): boolean {
    if (!this.analyzeLines()) return this.isValid();
    if (!this.analyzeSpines()) return this.isValid();
    if (!this.analyzeLinks()) return this.isValid();
    if (!this.analyzeTracks()) return this.isValid();
    return this.isValid();
  }
  analyzeTokens(): boolean {
    for (const line of this.m_lines) line.createTokensFromLine();
    return this.isValid();
  }
  analyzeLines(): boolean {
    for (let i = 0; i < this.m_lines.length; i++) this.m_lines[i].setLineIndex(i);
    return this.isValid();
  }
  analyzeSpines(): boolean {
    let datatype: string[] = []; let sinfo: string[] = [];
    this.m_trackstarts = []; this.m_trackends = [];
    this.addToTrackStarts(null);
    let init = false;
    for (let i = 0; i < this.getLineCount(); i++) {
      const line = this.m_lines[i];
      if (!line.hasSpines()) { line.token(0)?.setFieldIndex(0); continue; }
      if (!init && !line.isExclusive()) return this.setParseError(`Error on line: ${i + 1}:
   Data found before exclusive interpretation
   LINE: ${line.toString()}`);
      if (!init && line.isExclusive()) {
        init = true;
        datatype = []; sinfo = [];
        for (let j = 0; j < line.getTokenCount(); j++) {
          datatype.push(line.getTokenString(j));
          this.addToTrackStarts(line.token(j));
          sinfo.push(String(j + 1));
          line.token(j)?.setSpineInfo(String(j + 1));
          line.token(j)?.setFieldIndex(j);
        }
        continue;
      }
      if (datatype.length !== line.getTokenCount()) {
        return this.setParseError(`Error on line ${i + 1}:
   Expected ${datatype.length} fields,    but found ${line.getTokenCount()}
Line is: ${line.toString()}
`);
      }
      for (let j = 0; j < line.getTokenCount(); j++) {
        line.token(j)?.setSpineInfo(sinfo[j]);
        line.token(j)?.setFieldIndex(j);
      }
      if (!line.isManipulator()) continue;
      const res = this.adjustSpines(line, datatype, sinfo);
      if (!res.ok) return this.isValid();
      datatype = res.datatype; sinfo = res.sinfo;
    }
    return this.isValid();
  }
  private adjustSpines(line: HumdrumLine, datatype: string[], sinfo: string[]): { ok: boolean; datatype: string[]; sinfo: string[] } {
    const newtype: string[] = []; const newinfo: string[] = [];
    let i = 0;
    while (i < line.getTokenCount()) {
      const tok = line.token(i)!;
      if (tok.isSplitInterpretation()) {
        newtype.push(datatype[i], datatype[i]);
        newinfo.push(`(${sinfo[i]})a`, `(${sinfo[i]})b`);
      } else if (tok.isMergeInterpretation()) {
        let mergecount = 0;
        for (let j = i + 1; j < line.getTokenCount(); j++) {
          if (line.token(j)?.isMergeInterpretation()) mergecount++;
          else break;
        }
        newinfo.push(this.getMergedSpineInfo(sinfo, i, mergecount));
        newtype.push(datatype[i]);
        i += mergecount;
      } else if (tok.isAddInterpretation()) {
        newtype.push(datatype[i], '');
        newinfo.push(sinfo[i]);
        this.addToTrackStarts(null);
        newinfo.push(String(this.getMaxTrack()));
      } else if (tok.isExchangeInterpretation()) {
        if (i < line.getTokenCount() - 1) {
          if (!line.token(i + 1)?.isExchangeInterpretation()) return { ok: this.setParseError('ERROR1 in *x calculation'), datatype, sinfo };
          newtype.push(datatype[i + 1], datatype[i]);
          newinfo.push(sinfo[i + 1], sinfo[i]);
          i++;
        } else return { ok: this.setParseError(`ERROR2 in *x calculation
Index ${i} larger than allowed: ${line.getTokenCount() - 1}`), datatype, sinfo };
      } else if (tok.isTerminateInterpretation()) {
        this.m_trackends[this.m_trackstarts.length - 1].push(tok);
      } else if (tok.toString().substr(0, 2) === '**') {
        newtype.push(line.getTokenString(i));
        newinfo.push(sinfo[i]);
        if (!((this.m_trackstarts.length > 1) && (this.m_trackstarts[this.m_trackstarts.length - 1] === null))) {
          return { ok: this.setParseError(`Error: Exclusive interpretation with no preparation on line ${line.getLineIndex()} spine index ${i}
Line: ${line.toString()}`), datatype, sinfo };
        }
        if (this.m_trackstarts[this.m_trackstarts.length - 1] === null) this.addToTrackStarts(line.token(i));
      } else {
        newtype.push(datatype[i]);
        newinfo.push(sinfo[i]);
      }
      i++;
    }
    return { ok: true, datatype: newtype, sinfo: newinfo };
  }
  getMergedSpineInfo(info: string[], starti: number, extra: number): string {
    if (extra < 1) return info[starti];
    if (extra === 1) {
      const len1 = info[starti].length; const len2 = info[starti + 1].length;
      if (len1 === len2 && info[starti].substr(0, len1 - 1) === info[starti + 1].substr(0, len2 - 1)) {
        return info[starti].substr(1, len1 - 3);
      }
      return info[starti] + ' ' + info[starti + 1];
    }
    let newinfo: string[] = [];
    for (let k = 0; k <= extra; k++) newinfo.push(info[starti + k]);
    for (let pass = 0; pass < 3; pass++) {
      for (let k = 1; k < newinfo.length; k++) {
        const l1 = newinfo[k - 1].length; const l2 = newinfo[k].length;
        if (l1 !== l2) continue;
        if (newinfo[k - 1].substr(0, l1 - 1) === newinfo[k].substr(0, l2 - 1)) {
          newinfo[k - 1] = ''; newinfo[k] = newinfo[k].substr(1, l2 - 3);
        }
      }
      newinfo = newinfo.filter((s) => s !== '');
    }
    let out = newinfo[0] ?? '';
    for (let k = 1; k < newinfo.length; k++) out += ' ' + newinfo[k];
    return out;
  }
  analyzeLinks(): boolean {
    this.clearTokenLinkInfo();
    let next: HumdrumLine | null = null; let previous: HumdrumLine | null = null;
    for (const line of this.m_lines) {
      if (!line.hasSpines()) continue;
      previous = next; next = line;
      if (previous !== null && !this.stitchLinesTogether(previous, next)) return this.isValid();
    }
    return this.isValid();
  }
  stitchLinesTogether(previous: HumdrumLine, next: HumdrumLine): boolean {
    if (!previous.isInterpretation() && !next.isInterpretation()) {
      if (previous.getTokenCount() !== next.getTokenCount()) {
        return this.setParseError(`Error lines ${previous.getLineNumber()} and ${next.getLineNumber()} not same length
Line ${previous.getLineNumber()}: ${previous.toString()}
Line ${next.getLineNumber()}: ${next.toString()}
`);
      }
      for (let k = 0; k < previous.getTokenCount(); k++) previous.token(k)?.makeForwardLink(next.token(k)!);
      return true;
    }
    let ii = 0;
    let i = 0;
    while (i < previous.getTokenCount()) {
      const pt = previous.token(i)!;
      if (!pt.isManipulator()) {
        const nt = next.token(ii);
        if (nt !== null) pt.makeForwardLink(nt); ii++;
      } else if (pt.isSplitInterpretation()) {
        const a = next.token(ii); if (a !== null) pt.makeForwardLink(a); ii++;
        const b = next.token(ii); if (b !== null) pt.makeForwardLink(b); ii++;
      } else if (pt.isMergeInterpretation()) {
        while (i < previous.getTokenCount() && previous.token(i)?.isMergeInterpretation()) {
          const nt = next.token(ii); if (nt !== null) previous.token(i)?.makeForwardLink(nt);
          i++;
        }
        i--; ii++;
      } else if (pt.isExchangeInterpretation()) {
        if (previous.token(i + 1)?.isExchangeInterpretation()) {
          const a = next.token(ii); if (a !== null) previous.token(i + 1)?.makeForwardLink(a); ii++;
          const b = next.token(ii); if (b !== null) pt.makeForwardLink(b); ii++;
        }
        i++;
      } else if (pt.isTerminateInterpretation()) {
        // No link made.
      } else if (pt.isAddInterpretation()) {
        const anchor = next.token(ii + 1);
        if (!anchor?.isExclusiveInterpretation()) {
          return this.setParseError(`Error: expecting exclusive interpretation on line ${next.getLineNumber()} at token ${i} but got ${next.token(i)?.toString() ?? ''}`);
        }
        const nt = next.token(ii); if (nt !== null) pt.makeForwardLink(nt); ii++;
        ii++;
      } else if (pt.isExclusiveInterpretation()) {
        const nt = next.token(ii); if (nt !== null) pt.makeForwardLink(nt); ii++;
      } else return this.setParseError('Error: should not get here');
      i++;
    }
    if (i !== previous.getTokenCount() || ii !== next.getTokenCount()) {
      return this.setParseError(`Error: cannot stitch lines together due to alignment problem
Line ${previous.getLineNumber()}: ${previous.toString()}
Line ${next.getLineNumber()}: ${next.toString()}
I = ${i} token count ${previous.getTokenCount()}
II = ${ii} token count ${next.getTokenCount()}`);
    }
    return this.isValid();
  }
  analyzeTracks(): boolean {
    const err = { value: '' };
    for (const line of this.m_lines) {
      if (!line.analyzeTracks(err)) return false;
    }
    return this.isValid();
  }
  analyzeTokenDurations(): boolean {
    const err = { value: '' };
    for (const line of this.m_lines) if (!line.analyzeTokenDurations(err)) return this.isValid();
    return this.isValid();
  }
  getTokenDurations(line: number): { ok: boolean; durs: HumNum[] } {
    const durs: HumNum[] = [];
    for (let i = 0; i < this.m_lines[line].getTokenCount(); i++) durs.push(this.m_lines[line].token(i)!.getDuration());
    return { ok: this.cleanDurs(durs, line), durs };
  }
  cleanDurs(durs: HumNum[], line: number): boolean {
    let zero = false; let positive = false;
    for (const d of durs) {
      if (d.isPositive()) positive = true;
      else if (d.isZero()) zero = true;
    }
    if (zero && positive) {
      return this.setParseError(`Error on line ${line + 1} grace note and  regular note cannot occur on same line.\nLine: ${this.m_lines[line].toString()}\n`);
    }
    return this.isValid();
  }
  decrementDurStates(durs: HumNum[], linedur: HumNum, line: number): boolean {
    if (linedur.isZero()) return this.isValid();
    for (let i = 0; i < durs.length; i++) {
      if (!this.m_lines[line].token(i)?.hasRhythm()) continue;
      durs[i] = durs[i].sub(linedur);
      if (durs[i].isNegative()) {
        return this.setParseError(`Error: rhythmic error on line ${line + 1} field index ${i}\nDuration state is: ${durs[i].toString()}\n`);
      }
    }
    return this.isValid();
  }
  assignDurationsToTrack(starttoken: HTp, startdur: HumNum): boolean {
    if (starttoken === null || !starttoken.hasRhythm()) return this.isValid();
    return this.prepareDurations(starttoken, starttoken.getState(), startdur);
  }
  prepareDurations(token: HumdrumToken, state: number, startdur: HumNum): boolean {
    if (state !== token.getState()) return this.isValid();
    let dursum = new HumNum(startdur);
    let cur: HumdrumToken | null = token;
    cur.incrementState();
    if (!this.setLineDurationFromStart(cur, dursum)) return this.isValid();
    if (cur.getDuration().isPositive()) dursum = dursum.add(cur.getDuration());
    let tcount = cur.getNextTokenCount();
    const reservoir: HTp[] = [];
    const startdurs: HumNum[] = [];
    while (tcount > 0) {
      for (let t = 1; t < tcount; t++) { reservoir.push(cur!.getNextToken(t)); startdurs.push(new HumNum(dursum)); }
      cur = cur!.getNextToken(0);
      if (cur === null) break;
      if (state !== cur.getState()) break;
      cur.incrementState();
      if (!this.setLineDurationFromStart(cur, dursum)) return this.isValid();
      if (cur.getDuration().isPositive()) dursum = dursum.add(cur.getDuration());
      tcount = cur.getNextTokenCount();
    }
    if (cur !== null && tcount === 0 && cur.isTerminateInterpretation()) {
      if (!this.setLineDurationFromStart(cur, dursum)) return this.isValid();
    }
    for (let i = reservoir.length - 1; i >= 0; i--) {
      if (reservoir[i] !== null) this.prepareDurations(reservoir[i]!, state, startdurs[i]);
    }
    return this.isValid();
  }
  setLineDurationFromStart(token: HumdrumToken, dursum: HumNum): boolean {
    if (!token.isTerminateInterpretation() && token.getDuration().isNegative()) return this.isValid();
    const line = token.getOwner();
    if (line === null) return this.isValid();
    if (line.getDurationFromStartNoAnalyze().isNegative()) line.setDurationFromStart(dursum);
    else if (!line.getDurationFromStartNoAnalyze().equals(dursum)) {
      return this.setParseError(`Error: Inconsistent rhythm analysis occurring near line ${token.getLineNumber()}\nExpected durationFromStart to be: ${dursum.toString()} but found it to be ${line.getDurationFromStartNoAnalyze().toString()}\nLine: ${line.toString()}\n`);
    }
    return this.isValid();
  }
  analyzeRhythmOfFloatingSpine(spinestart: HTp): boolean {
    if (spinestart === null) return this.isValid();
    let dursum = new HumNum(0);
    let founddur = new HumNum(0);
    let token: HTp = spinestart;
    if (token.getDurationFromStartNoAnalyze().isNonNegative()) founddur = new HumNum(token.getLine()!.getDurationFromStartNoAnalyze());
    else {
      let tcount = token.getNextTokenCount();
      while (tcount > 0 && token !== null) {
        if (token.getDurationFromStartNoAnalyze().isNonNegative()) { founddur = new HumNum(token.getLine()!.getDurationFromStartNoAnalyze()); break; }
        if (token.getDuration().isPositive()) dursum = dursum.add(token.getDuration());
        token = token.getNextToken(0);
        if (token === null) break;
        tcount = token.getNextTokenCount();
      }
    }
    if (founddur.isZero()) return this.setParseError('Error cannot link floating spine to score.');
    return this.assignDurationsToTrack(spinestart, founddur.sub(dursum));
  }
  analyzeNullLineRhythms(): boolean {
    let nulllines: HumdrumLine[] = [];
    let previous: HLp = null; let next: HLp = null;
    for (const line of this.m_lines) {
      if (!line.hasSpines()) continue;
      if (line.isAllRhythmicNull()) { if (line.isData()) nulllines.push(line); continue; }
      const dur = line.getDurationFromStartNoAnalyze();
      if (dur.isNegative()) {
        if (line.isData()) return this.setParseError(`Error: found an unexpected negative duration on line ${line.getDurationFromStartNoAnalyze().toString()}\nLine: ${line.toString()}\n`);
        continue;
      }
      next = line;
      if (previous === null) { previous = next; nulllines = []; continue; }
      const startdur = previous.getDurationFromStartNoAnalyze();
      const enddur = next.getDurationFromStartNoAnalyze();
      const nulldur = enddur.sub(startdur).div(nulllines.length + 1);
      for (let j = 0; j < nulllines.length; j++) nulllines[j].setDurationFromStart(startdur.add(nulldur.mul(j + 1)));
      previous = next; nulllines = [];
    }
    return this.isValid();
  }
  fillInNegativeStartTimes(): void {
    let lastdur = new HumNum(-1);
    for (let i = this.m_lines.length - 1; i >= 0; i--) {
      const dur = this.m_lines[i].getDurationFromStartNoAnalyze();
      if (dur.isNegative() && lastdur.isNonNegative()) this.m_lines[i].setDurationFromStart(lastdur);
      if (dur.isNonNegative()) lastdur = new HumNum(dur);
    }
    for (const line of this.m_lines) {
      const dur = line.getDurationFromStartNoAnalyze();
      if (dur.isNonNegative()) lastdur = new HumNum(dur);
      else line.setDurationFromStart(lastdur);
    }
  }
  assignLineDurations(): void {
    for (let i = 0; i < this.m_lines.length - 1; i++) {
      this.m_lines[i].setDuration(this.m_lines[i + 1].getDurationFromStartNoAnalyze().sub(this.m_lines[i].getDurationFromStartNoAnalyze()));
    }
    if (this.m_lines.length > 0) this.m_lines[this.m_lines.length - 1].setDuration(new HumNum(0));
  }
  analyzeRhythm(): boolean {
    this.setLineRhythmAnalyzed();
    if (this.getMaxTrack() === 0) return true;
    const t1 = this.getTrackStart(1);
    if (t1 === null) return true;
    const startline = t1.getLineIndex();
    const zero = new HumNum(0);
    for (let i = 1; i <= this.getMaxTrack(); i++) {
      const st = this.getTrackStart(i);
      if (st === null || !st.hasRhythm()) continue;
      if (st.getLineIndex() === startline) { if (!this.assignDurationsToTrack(st, zero)) return false; }
    }
    for (let i = 1; i <= this.getMaxTrack(); i++) {
      const st = this.getTrackStart(i);
      if (st === null || !st.hasRhythm()) continue;
      if (st.getLineIndex() > startline) { if (!this.analyzeRhythmOfFloatingSpine(st)) return false; }
    }
    if (!this.analyzeNullLineRhythms()) return false;
    this.fillInNegativeStartTimes();
    this.assignLineDurations();
    if (!this.analyzeMeter()) return false;
    if (!this.analyzeNonNullDataTokens()) return false;
    return true;
  }
  analyzeMeter(): boolean {
    this.m_barlines = [];
    let sum = new HumNum(0);
    let foundbarline = false;
    for (const line of this.m_lines) {
      line.setDurationFromBarline(sum);
      sum = sum.add(line.getDurationNoAnalyze());
      if (line.isBarline()) { foundbarline = true; this.m_barlines.push(line); sum = new HumNum(0); }
      if (line.isData() && !foundbarline) { this.m_barlines.push(this.m_lines[0]); foundbarline = true; }
    }
    sum = new HumNum(0);
    for (let i = this.m_lines.length - 1; i >= 0; i--) {
      sum = sum.add(this.m_lines[i].getDurationNoAnalyze());
      this.m_lines[i].setDurationToBarline(sum);
      if (this.m_lines[i].isBarline()) sum = new HumNum(0);
    }
    return true;
  }
  setLineRhythmAnalyzed(): void { for (const line of this.m_lines) line.m_rhythmAnalyzed = true; }
  analyzeRhythmStructure(): boolean {
    this.setLineRhythmAnalyzed();
    if (!this.analyzeTokenDurations()) return this.isValid();
    if (!this.analyzeRhythm()) return this.isValid();
    return this.isValid();
  }
  analyzeStructure(): boolean {
    if (!this.analyzeGlobalParameters()) return this.isValid();
    if (!this.analyzeLocalParameters()) return this.isValid();
    if (!this.analyzeTokenDurations()) return this.isValid();
    const ok = this.analyzeRhythmStructure();
    this.analyzeSignifiers();
    return ok;
  }
  // C++ HumdrumFileStructure::analyzeGlobalParameters: only layout parameters are
  // collected, and they apply to the next line that carries spines.
  analyzeGlobalParameters(): boolean {
    const globals: HLp[] = [];
    for (let i = 0; i < this.m_lines.length; ++i) {
      const line = this.m_lines[i];
      if (line.isCommentGlobal() && line.find('!!LO:') !== -1) {
        line.storeGlobalLinkedParameters();
        globals.push(line);
        continue;
      }
      if (!line.hasSpines()) continue;
      if (line.isAllNull()) continue;
      if (line.isCommentLocal()) continue;
      if (globals.length === 0) continue;

      // Filter manipulators or not? At the moment allow global parameters to pass
      // through manipulators (as in C++).
      for (let j = 0; j < line.getFieldCount(); ++j) {
        const token = line.token(j);
        if (token === null) continue;
        for (const global of globals) {
          if (global === null) continue;
          const gtok = global.token(0);
          if (gtok !== null) token.addLinkedParameterSet(gtok);
        }
      }
      globals.length = 0;
    }
    return this.isValid();
  }
  // C++ HumdrumFileStructure::analyzeLocalParameters: walk each strand.
  analyzeLocalParameters(): boolean {
    if (!this.m_strandsAnalyzed) this.analyzeStrands();
    for (let i = 0; i < this.getStrandCount(); i++) {
      this.processLocalParametersForStrand(this.getStrandStart(i), this.getStrandEnd(i));
    }
    return this.isValid();
  }
  // C++ HumdrumFileStructure::analyzeStrands (humlib.cpp): split spine
  // starts into strands following next-token links. Null resolution and
  // strophes are handled elsewhere in the TS pipeline.
  analyzeStrands(): void {
    this.m_strandsAnalyzed = true;
    this.m_strand1d = [];
    this.m_strand2d = [];
    const spines = this.getSpineCount();
    for (let i = 0; i < spines; i++) {
      // C++ getSpineStart(i) == getTrackStart(i+1).
      const tok = this.getTrackStart(i + 1);
      this.m_strand2d.push([]);
      this.analyzeSpineStrands(this.m_strand2d[this.m_strand2d.length - 1], tok);
    }
    for (const ends of this.m_strand2d) {
      ends.sort((a, b) => (a[0]?.getLineIndex() ?? 0) - (b[0]?.getLineIndex() ?? 0));
      for (const e of ends) this.m_strand1d.push(e);
    }
  }
  analyzeSpineStrands(ends: Array<[HTp, HTp]>, starttok: HTp): void {
    ends.push([starttok, null]);
    const index = ends.length - 1;
    let tok = starttok;
    let lasttok = starttok;
    while (tok !== null) {
      lasttok = tok;
      if (tok.getSubtrack() > 1 && tok.isMerge()) {
        const prev = tok.getPreviousFieldToken();
        if (prev !== null && prev.isMerge()) {
          ends[index][1] = tok;
          return;
        }
        tok = tok.getNextToken();
        continue;
      }
      if (tok.isTerminator()) {
        ends[index][1] = tok;
        return;
      }
      if (tok.getNextTokenCount() > 1) {
        for (let j = 1; j < tok.getNextTokenCount(); j++) {
          this.analyzeSpineStrands(ends, tok.getNextToken(j));
        }
      }
      tok = tok.getNextToken();
    }
    ends[index][1] = lasttok;
  }
  getStrandCount(): number {
    if (!this.m_strandsAnalyzed) this.analyzeStrands();
    return this.m_strand1d.length;
  }
  getStrandStart(index: number): HTp {
    if (!this.m_strandsAnalyzed) this.analyzeStrands();
    return index >= 0 && index < this.m_strand1d.length ? this.m_strand1d[index][0] : null;
  }
  getStrandEnd(index: number): HTp {
    if (!this.m_strandsAnalyzed) this.analyzeStrands();
    return index >= 0 && index < this.m_strand1d.length ? this.m_strand1d[index][1] : null;
  }
  processLocalParametersForStrand(sstart: HTp, send: HTp): void {
    if (send === null) return;
    let tok: HTp = send;
    let dtok: HTp = null;
    while (tok !== null) {
      if (tok.isData()) {
        dtok = tok;
      }
      else if (tok.isBarline()) {
        // layout parameters allowed for barlines
        dtok = tok;
      }
      else if (tok.isInterpretation() && tok.toString() !== '*') {
        // layout parameters allowed for non-null interpretations
        dtok = tok;
      }
      else if (tok.isCommentLocal()) {
        if (tok.find('!LO:') === 0) {
          tok.storeParameterSet();
          if (dtok !== null) {
            dtok.addLinkedParameterSet(tok);
          }
        }
      }
      if (tok === sstart) break;
      tok = tok.getPreviousToken();
    }
  }
  analyzeNonNullDataTokens(): boolean {
    let ptokens: HTp[] = [];
    for (let i = 1; i <= this.getMaxTrack(); i++) {
      if (!this.processNonNullDataTokensForTrackForward(this.getTrackStart(i), ptokens)) return false;
    }
    ptokens = [];
    for (let i = 1; i <= this.getMaxTrack(); i++) {
      for (let j = 0; j < this.getTrackEndCount(i); j++) {
        if (!this.processNonNullDataTokensForTrackBackward(this.getTrackEnd(i, j), ptokens)) return false;
      }
    }
    const stops: HTp[] = [];
    this.getSpineStopList(stops);
    let nexts: HTp = null;
    for (const stop of stops) {
      if (stop === null) continue;
      let token: HTp = stop;
      if (token.isData() && !token.isNull()) nexts = token;
      token = token.getPreviousToken();
      while (token !== null) {
        if (nexts !== null) token.addNextNonNullToken(nexts);
        if (token.isData() && !token.isNull()) nexts = token;
        token = token.getPreviousToken();
      }
    }
    return true;
  }
  processNonNullDataTokensForTrackForward(starttoken: HTp, ptokens: HTp[]): boolean {
    if (starttoken === null) return true;
    let token: HTp = starttoken;
    let tcount = token.getNextTokenCount();
    while (tcount > 0 && token !== null) {
      if (token.isSplitInterpretation()) {
        for (let i = 1; i < tcount; i++) {
          if (!this.processNonNullDataTokensForTrackForward(token.getNextToken(i), ptokens)) return false;
        }
      } else if (token.isMergeInterpretation()) {
        const nexttoken = token.getNextToken();
        if (nexttoken !== null) {
          addUniqueTokens(nexttoken.m_previousNonNullTokensRef(), ptokens);
          if (token !== nexttoken.getPreviousTokens()[0]) return true;
        }
      } else {
        addUniqueTokens(token.m_previousNonNullTokensRef(), ptokens);
        if (token.isData() && !token.isNull()) { ptokens.length = 0; ptokens.push(token); }
      }
      token = token.getNextToken(0);
      tcount = token === null ? 0 : token.getNextTokenCount();
    }
    return true;
  }
  processNonNullDataTokensForTrackBackward(endtoken: HTp, ptokens: HTp[]): boolean {
    if (endtoken === null) return true;
    let token: HTp = endtoken;
    let tcount = token.getPreviousTokenCount();
    while (tcount > 0 && token !== null) {
      for (let i = 1; i < tcount; i++) {
        if (!this.processNonNullDataTokensForTrackBackward(token.getPreviousToken(i), ptokens)) return false;
      }
      const prevtoken = token.getPreviousToken();
      if (prevtoken !== null && prevtoken.isSplitInterpretation()) {
        addUniqueTokens(prevtoken.m_nextNonNullTokensRef(), ptokens);
        if (token !== prevtoken.getNextTokens()[0]) return true;
      } else if (token.isData()) {
        addUniqueTokens(token.m_nextNonNullTokensRef(), ptokens);
        if (!token.isNull()) { ptokens.length = 0; ptokens.push(token); }
      }
      token = token.getPreviousToken(0);
      tcount = token === null ? 0 : token.getPreviousTokenCount();
    }
    return true;
  }
  getSpineStopList(stops: HTp[]): void {
    stops.length = 0;
    for (const ends of this.m_trackends) for (const t of ends) stops.push(t);
  }
  getSpineStartListFiltered(exinterp: string): HTp[] {
    const nex = exinterp.substr(0, 2) === '**' ? exinterp : '**' + exinterp;
    const out: HTp[] = [];
    for (let i = 1; i < this.m_trackstarts.length; i++) {
      if (this.m_trackstarts[i] !== null && this.m_trackstarts[i]!.toString() === nex) out.push(this.m_trackstarts[i]);
    }
    return out;
  }
  getTrackSequence(track: number, options: number): HTp[][] {
    const primaryQ = (options & OPT_PRIMARY) !== 0;
    const nonullQ = (options & OPT_NONULL) !== 0;
    const noemptyQ = (options & OPT_NOEMPTY) !== 0;
    const nointerpQ = (options & OPT_NOINTERP) !== 0;
    const nomanipQ = (options & OPT_NOMANIP) !== 0;
    const nocommentQ = (options & OPT_NOCOMMENT) !== 0;
    const noglobalQ = (options & OPT_NOGLOBAL) !== 0;
    const norestQ = (options & OPT_NOREST) !== 0;
    const notieQ = (options & OPT_NOTIE) !== 0;
    const output: HTp[][] = [];
    for (let i = 0; i < this.getLineCount(); i++) {
      const line = this.m_lines[i];
      if (line.isEmpty()) continue;
      const tempout: HTp[] = [];
      if (!noglobalQ && line.isGlobal()) { tempout.push(line.token(0)); output.push(tempout); continue; }
      if (noemptyQ) {
        let allNull = true;
        for (let j = 0; j < line.getFieldCount(); j++) {
          if (line.token(j)?.getTrack() !== track) continue;
          if (!line.token(j)?.isNull()) { allNull = false; break; }
        }
        if (allNull) continue;
      }
      let foundTrack = false;
      for (let j = 0; j < line.getFieldCount(); j++) {
        const token = line.token(j);
        if (token === null || token.getTrack() !== track) continue;
        if (primaryQ && foundTrack) continue;
        foundTrack = true;
        if (nointerpQ && (token.isManipulator() || token.isTerminateInterpretation() || token.isExclusive())) continue;
        if (nomanipQ && token.isManipulator()) continue;
        if (nonullQ && token.isNull()) continue;
        if (nocommentQ && token.isComment()) continue;
        if (norestQ && token.isRest()) continue;
        if (notieQ && token.isSecondaryTiedNote()) continue;
        tempout.push(token);
      }
      if (tempout.length > 0) output.push(tempout);
    }
    return output;
  }
  getTrackSequenceFromToken(starttoken: HTp, options: number): HTp[][] {
    if (starttoken === null) return [];
    return this.getTrackSequence(starttoken.getTrack(), options);
  }
  isLinkedSlurEnd(token: HTp, index: number, pattern: string): boolean {
    if (token === null || pattern.length <= 1) return false;
    const s = token.toString();
    let counter = -1;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === ')') counter++;
      if (i === 0) continue;
      if (counter !== index) continue;
      const startindex = i - pattern.length + 1;
      return s.substr(startindex, pattern.length) === pattern;
    }
    return false;
  }
  isLinkedSlurBegin(token: HTp, index: number, pattern: string): boolean {
    if (token === null || pattern.length <= 1) return false;
    const s = token.toString();
    let counter = -1;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') counter++;
      if (i === 0) continue;
      if (counter !== index) continue;
      return s.indexOf(pattern, i - pattern.length + 1) !== -1;
    }
    return false;
  }
  linkSlurEndpoints(slurstart: HTp, slurend: HTp): void {
    if (slurstart === null || slurend === null) return;
    let durtag = 'slurDuration';
    let endtag = 'slurEndId';
    let starttag = 'slurStartId';
    let slurstartnumbertag = 'slurStartNumber';
    let slurendnumbertag = 'slurEndNumber';
    const slurStartCount = slurstart.getValueInt('auto', 'slurStartCount');
    const opencount = slurstart.toString().split('').filter((c) => c === '(').length;
    const newStartCount = slurStartCount + 1;
    const openEnumeration = opencount - newStartCount + 1;
    if (openEnumeration > 1) { endtag += String(openEnumeration); durtag += String(openEnumeration); slurendnumbertag += String(openEnumeration); }
    const slurEndNumber = slurend.getValueInt('auto', 'slurEndCount') + 1;
    if (slurEndNumber > 1) { starttag += String(slurEndNumber); slurstartnumbertag += String(slurEndNumber); }
    const duration = slurend.getDurationFromStart().sub(slurstart.getDurationFromStart());
    slurstart.setValue('auto', endtag, slurend);
    slurstart.setValue('auto', 'id', slurstart.toString());
    slurstart.setValue('auto', slurendnumbertag, String(slurEndNumber));
    slurstart.setValue('auto', durtag, duration);
    slurstart.setValue('auto', 'slurStartCount', String(newStartCount));
    slurend.setValue('auto', starttag, slurstart);
    slurend.setValue('auto', 'id', slurend.toString());
    slurend.setValue('auto', slurstartnumbertag, String(openEnumeration));
    slurend.setValue('auto', 'slurEndCount', String(slurEndNumber));
  }
  createLinkedSlurs(linkstarts: HTp[], linkends: HTp[]): void {
    const max = Math.min(linkstarts.length, linkends.length);
    for (let i = 0; i < max; i++) this.linkSlurEndpoints(linkstarts[i], linkends[i]);
  }
  analyzeKernSlurs(): boolean {
    const slurstarts: HTp[] = [];
    const slurends: HTp[] = [];
    const kernspines = this.getSpineStartListFiltered('**kern');
    const linkSignifier = this.getKernLinkSignifier();
    let output = true;
    for (const spine of kernspines) {
      if (!this.analyzeKernSlurSpine(spine, slurstarts, slurends, linkSignifier)) output = false;
    }
    this.createLinkedSlurs(slurstarts, slurends);
    return output;
  }
  analyzeKernSlurSpine(spinestart: HTp, linkstarts: HTp[], linkends: HTp[], linksig: string): boolean {
    if (spinestart === null) return true;
    const ignorebegin = linksig + '(';
    const ignoreend = linksig + ')';
    const tracktokens = this.getTrackSequenceFromToken(spinestart, OPT_DATA | OPT_NOEMPTY);
    const sluropens: HTp[][][] = [];
    for (let i = 0; i < 4; i++) { sluropens.push([]); for (let j = 0; j < 8; j++) sluropens[i].push([]); }
    for (const row of tracktokens) {
      for (let track = 0; track < row.length; track++) {
        const token = row[track];
        if (token === null || !token.isData() || token.isNull()) continue;
        const s = token.toString();
        const opencount = s.split('').filter((c) => c === '(').length;
        const closecount = s.split('').filter((c) => c === ')').length;
        for (let i = 0; i < closecount; i++) {
          if (this.isLinkedSlurEnd(token, i, ignoreend)) { linkends.push(token); continue; }
          const elision = token.getSlurEndElisionLevel(i);
          if (elision < 0) continue;
          const level = sluropens[elision] ?? sluropens[0];
          const slot = level[track] ?? [];
          if (slot.length > 0) {
            this.linkSlurEndpoints(slot[slot.length - 1], token);
            slot.pop();
          }
          else {
            // Unmatched end: search other tracks, else mark hanging.
            let found = false;
            for (const alt of level) {
              if (alt.length > 0) { this.linkSlurEndpoints(alt[alt.length - 1], token); alt.pop(); found = true; break; }
            }
            if (!found) {
              token.setValue('auto', 'hangingSlur', 'true');
              token.setValue('auto', 'slurSide', 'stop');
            }
          }
        }
        for (let i = 0; i < opencount; i++) {
          if (this.isLinkedSlurBegin(token, i, ignorebegin)) { linkstarts.push(token); continue; }
          const elision = token.getSlurStartElisionLevel(i);
          if (elision < 0) continue;
          const level = sluropens[elision] ?? sluropens[0];
          while (level.length <= track) level.push([]);
          level[track].push(token);
        }
      }
    }
    for (const level of sluropens) {
      for (const slot of level) {
        for (const tok of slot) {
          if (tok === null) continue;
          tok.setValue('auto', 'hangingSlur', 'true');
          tok.setValue('auto', 'slurSide', 'start');
        }
      }
    }
    return true;
  }
  // Generic counted-mark scan shared by beam (L/J) and phrase ({/})
  // analyzers; C++ duplicates the slur loop per mark type.
  scanCountedMarks(
    spinestart: HTp,
    openChar: string,
    closeChar: string,
    ignorebegin: string,
    ignoreend: string,
    getStartElision: (tok: HumdrumToken, i: number) => number,
    getEndElision: (tok: HumdrumToken, i: number) => number,
    isLinkedBegin: (tok: HTp, i: number, pat: string) => boolean,
    isLinkedEnd: (tok: HTp, i: number, pat: string) => boolean,
    linkEndpoints: (start: HTp, end: HTp) => void,
    linkstarts: HTp[],
    linkends: HTp[],
    hangingName: string,
  ): boolean {
    if (spinestart === null) return true;
    const tracktokens = this.getTrackSequenceFromToken(spinestart, OPT_DATA | OPT_NOEMPTY);
    const opens: HTp[][][] = [];
    for (let i = 0; i < 4; i++) { opens.push([]); for (let j = 0; j < 8; j++) opens[i].push([]); }
    for (const row of tracktokens) {
      for (let track = 0; track < row.length; track++) {
        const token = row[track];
        if (token === null || !token.isData() || token.isNull()) continue;
        const s = token.toString();
        const countChar = (c: string): number => s.split('').filter((x) => x === c).length;
        for (let i = 0; i < countChar(closeChar); i++) {
          if (isLinkedEnd.call(this, token, i, ignoreend)) { linkends.push(token); continue; }
          const elision = getEndElision(token, i);
          if (elision < 0) continue;
          const level = opens[elision] ?? opens[0];
          const slot = level[track] ?? [];
          if (slot.length > 0) {
            linkEndpoints.call(this, slot[slot.length - 1], token);
            slot.pop();
          }
          else {
            let found = false;
            for (const alt of level) {
              if (alt.length > 0) { linkEndpoints.call(this, alt[alt.length - 1], token); alt.pop(); found = true; break; }
            }
            if (!found) {
              token.setValue('auto', 'hanging' + hangingName, 'true');
              token.setValue('auto', hangingName.charAt(0).toLowerCase() + hangingName.slice(1) + 'Side', 'stop');
            }
          }
        }
        for (let i = 0; i < countChar(openChar); i++) {
          if (isLinkedBegin.call(this, token, i, ignorebegin)) { linkstarts.push(token); continue; }
          const elision = getStartElision(token, i);
          if (elision < 0) continue;
          const level = opens[elision] ?? opens[0];
          while (level.length <= track) level.push([]);
          level[track].push(token);
        }
      }
    }
    for (const level of opens) {
      for (const slot of level) {
        for (const tok of slot) {
          if (tok === null) continue;
          tok.setValue('auto', 'hanging' + hangingName, 'true');
          tok.setValue('auto', hangingName.charAt(0).toLowerCase() + hangingName.slice(1) + 'Side', 'start');
        }
      }
    }
    return true;
  }
  isLinkedBeamEnd(token: HTp, index: number, pattern: string): boolean {
    if (token === null || pattern.length <= 1) return false;
    const s = token.toString();
    let counter = -1;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === 'J') counter++;
      if (i === 0) continue;
      if (counter !== index) continue;
      return s.substr(i - pattern.length + 1, pattern.length) === pattern;
    }
    return false;
  }
  isLinkedBeamBegin(token: HTp, index: number, pattern: string): boolean {
    if (token === null || pattern.length <= 1) return false;
    const s = token.toString();
    let counter = -1;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === 'L') counter++;
      if (i === 0) continue;
      if (counter !== index) continue;
      return s.indexOf(pattern, i - pattern.length + 1) !== -1;
    }
    return false;
  }
  isLinkedPhraseEnd(token: HTp, index: number, pattern: string): boolean {
    // C++ checks ')' for phrases (likely a copy slip for '}'); match it.
    if (token === null || pattern.length <= 1) return false;
    const s = token.toString();
    let counter = -1;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === ')') counter++;
      if (i === 0) continue;
      if (counter !== index) continue;
      return s.substr(i - pattern.length + 1, pattern.length) === pattern;
    }
    return false;
  }
  isLinkedPhraseBegin(token: HTp, index: number, pattern: string): boolean {
    // C++ checks '(' for phrases (likely a copy slip for '{'); match it.
    if (token === null || pattern.length <= 1) return false;
    const s = token.toString();
    let counter = -1;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') counter++;
      if (i === 0) continue;
      if (counter !== index) continue;
      return s.indexOf(pattern, i - pattern.length + 1) !== -1;
    }
    return false;
  }
  linkBeamEndpoints(beamstart: HTp, beamend: HTp): void {
    if (beamstart === null || beamend === null) return;
    let durtag = 'beamDuration';
    let endtag = 'beamEndId';
    let starttag = 'beamStartId';
    let beamstartnumbertag = 'beamStartNumber';
    let beamendnumbertag = 'beamEndNumber';
    const beamStartCount = beamstart.getValueInt('auto', 'beamStartCount');
    const opencount = beamstart.toString().split('').filter((c) => c === 'L').length;
    const newStartCount = beamStartCount + 1;
    const openEnumeration = opencount - newStartCount + 1;
    if (openEnumeration > 1) { endtag += String(openEnumeration); durtag += String(openEnumeration); beamendnumbertag += String(openEnumeration); }
    const newEndNumber = beamend.getValueInt('auto', 'beamEndCount') + 1;
    if (newEndNumber > 1) { starttag += String(newEndNumber); beamstartnumbertag += String(newEndNumber); }
    const duration = beamend.getDurationFromStart().sub(beamstart.getDurationFromStart());
    const durToBar = beamstart.getDurationToBarline();
    if (duration.sub(durToBar).isNonNegative()) {
      // Beam spans a barline: mark span members like C++ markBeamSpanMembers.
      beamstart.setValue('auto', 'beamSpanStart', '1');
      beamend.setValue('auto', 'beamSpanEnd', '1');
      this.markBeamSpanMembers(beamstart, beamend);
    }
    beamstart.setValue('auto', endtag, beamend);
    beamstart.setValue('auto', 'id', beamstart.toString());
    beamstart.setValue('auto', beamendnumbertag, String(newEndNumber));
    beamstart.setValue('auto', durtag, duration);
    beamstart.setValue('auto', 'beamStartCount', String(newStartCount));
    beamend.setValue('auto', starttag, beamstart);
    beamend.setValue('auto', 'id', beamend.toString());
    beamend.setValue('auto', beamstartnumbertag, String(openEnumeration));
    beamend.setValue('auto', 'beamEndCount', String(newEndNumber));
  }
  markBeamSpanMembers(beamstart: HTp, beamend: HTp): void {
    if (beamstart === null || beamend === null) return;
    const endindex = beamend.getLineIndex();
    beamstart.setValue('auto', 'inBeamSpan', beamstart);
    beamend.setValue('auto', 'inBeamSpan', beamstart);
    let current = beamstart.getNextToken();
    while (current !== null) {
      if (current.getLineIndex() > endindex) break;
      if (current === beamend) break;
      if (!current.isData() || current.isNull()) { current = current.getNextToken(); continue; }
      if (current.getDuration().isZero()) { current = current.getNextToken(); continue; }
      current.setValue('auto', 'inBeamSpan', beamstart);
      current = current.getNextToken();
    }
  }
  createLinkedBeams(linkstarts: HTp[], linkends: HTp[]): void {
    const max = Math.min(linkstarts.length, linkends.length);
    for (let i = 0; i < max; i++) this.linkBeamEndpoints(linkstarts[i], linkends[i]);
  }
  analyzeKernBeams(): boolean {
    const beamstarts: HTp[] = [];
    const beamends: HTp[] = [];
    const spines = this.getSpineStartListFiltered('**kern');
    const linksig = this.getKernLinkSignifier();
    // ponytail: C++ also scans **mens spines via analyzeMensBeams;
    // add when **mens beam input exists.
    let output = true;
    for (const spine of spines) {
      const ok = this.scanCountedMarks(spine, 'L', 'J', linksig + 'L', linksig + 'J',
        (t, i) => t.getBeamStartElisionLevel(i), (t, i) => t.getBeamEndElisionLevel(i),
        this.isLinkedBeamBegin, this.isLinkedBeamEnd,
        this.linkBeamEndpoints, beamstarts, beamends, 'Beam');
      if (!ok) output = false;
    }
    this.createLinkedBeams(beamstarts, beamends);
    return output;
  }
  linkPhraseEndpoints(phrasestart: HTp, phraseend: HTp): void {
    if (phrasestart === null || phraseend === null) return;
    let durtag = 'phraseDuration';
    let endtag = 'phraseEnd';
    let phraseEndCount = phrasestart.getValueInt('auto', 'phraseEndCount') + 1;
    if (phraseEndCount > 1) { endtag += String(phraseEndCount); durtag += String(phraseEndCount); }
    let starttag = 'phraseStart';
    const phraseStartCount = phraseend.getValueInt('auto', 'phraseStartCount') + 1;
    if (phraseStartCount > 1) starttag += String(phraseStartCount);
    phrasestart.setValue('auto', endtag, phraseend);
    phrasestart.setValue('auto', 'id', phrasestart.toString());
    phraseend.setValue('auto', starttag, phrasestart);
    phraseend.setValue('auto', 'id', phraseend.toString());
    const duration = phraseend.getDurationFromStart().sub(phrasestart.getDurationFromStart());
    phrasestart.setValue('auto', durtag, duration);
    phrasestart.setValue('auto', 'phraseEndCount', String(phraseEndCount));
    phraseend.setValue('auto', 'phraseStartCount', String(phraseStartCount));
  }
  createLinkedPhrasings(linkstarts: HTp[], linkends: HTp[]): void {
    const max = Math.min(linkstarts.length, linkends.length);
    for (let i = 0; i < max; i++) this.linkPhraseEndpoints(linkstarts[i], linkends[i]);
  }
  analyzeOttavas(): void {
    const tcount = this.getTrackCount();
    const activeOttava: number[] = new Array(tcount + 1).fill(0);
    const octavestate: number[] = new Array(tcount + 1).fill(0);
    for (let i = 0; i < this.getLineCount(); i++) {
      const line = this.m_lines[i];
      if (line.isInterpretation()) {
        for (let j = 0; j < line.getFieldCount(); j++) {
          const token = line.token(j);
          if (token === null || !token.isKern()) continue;
          const track = token.getTrack();
          const s = token.toString();
          if (s === '*8va') { octavestate[track] = 1; activeOttava[track]++; }
          else if (s === '*X8va') { octavestate[track] = 0; activeOttava[track]--; }
          else if (s === '*8ba') { octavestate[track] = -1; activeOttava[track]++; }
          else if (s === '*X8ba') { octavestate[track] = 0; activeOttava[track]--; }
          else if (s === '*15ma') { octavestate[track] = 2; activeOttava[track]++; }
          else if (s === '*X15ma') { octavestate[track] = 0; activeOttava[track]--; }
          else if (s === '*15ba') { octavestate[track] = -2; activeOttava[track]++; }
          else if (s === '*X15ba') { octavestate[track] = 0; activeOttava[track]--; }
        }
      }
      else if (line.isData()) {
        for (let j = 0; j < line.getFieldCount(); j++) {
          const token = line.token(j);
          if (token === null || !token.isKern()) continue;
          const track = token.getTrack();
          if (!activeOttava[track] || octavestate[track] === 0) continue;
          if (token.isNull()) continue;
          token.setValue('auto', 'ottava', String(octavestate[track]));
        }
      }
    }
  }
  analyzeKernPhrasings(): boolean {
    const phrasestarts: HTp[] = [];
    const phraseends: HTp[] = [];
    const spines = this.getSpineStartListFiltered('**kern');
    const linksig = this.getKernLinkSignifier();
    let output = true;
    for (const spine of spines) {
      const ok = this.scanCountedMarks(spine, '{', '}', linksig + '{', linksig + '}',
        (t, i) => t.getPhraseStartElisionLevel(i), (t, i) => t.getPhraseEndElisionLevel(i),
        this.isLinkedPhraseBegin, this.isLinkedPhraseEnd,
        this.linkPhraseEndpoints, phrasestarts, phraseends, 'Phrase');
      if (!ok) output = false;
    }
    this.createLinkedPhrasings(phrasestarts, phraseends);
    return output;
  }
  getScoreDuration(): HumNum {
    if (this.m_lines.length === 0) return new HumNum(0);
    return this.m_lines[this.m_lines.length - 1].getDurationFromStart();
  }
  analyzeSignifiers(): void {
    for (const line of this.m_lines) {
      if (!line.isSignifier()) continue;
      this.m_signifiers.addSignifier(line.getText());
    }
  }
  getKernLinkSignifier(): string { return this.m_signifiers.getKernLinkSignifier(); }
  hasDataStraddleLine(line: number): boolean {
    if (line < 0 || line >= this.getLineCount()) return false;
    if (!this.m_lines[line].isBarline()) return false;
    for (let i = line + 1; i < this.getLineCount(); i++) {
      const l = this.m_lines[i];
      if (l.isInterpretation() && l.token(0)?.toString() === '*-') return false;
      if (!l.isData() || l.isGraceLine()) continue;
      for (let j = 0; j < l.getFieldCount(); j++) {
        const token = l.token(j);
        if (token === null || !token.isStaff() || !token.isNull()) continue;
        return true;
      }
      break;
    }
    return false;
  }
  protected m_analysesBarlines = false;
  protected m_analysesBarlinesDifferent = false;
  analyzeBarlines(): void {
    if (this.m_analysesBarlines) return;
    this.m_analysesBarlines = true;
    this.m_analysesBarlinesDifferent = false;
    const strip = (s: string): string => {
      let out = '';
      for (const ch of s) {
        if (ch >= '0' && ch <= '9') continue;
        if (ch === ';') continue;
        out += ch;
      }
      return out;
    };
    for (let i = 0; i < this.getLineCount(); i++) {
      const line = this.m_lines[i];
      if (!line.isBarline()) continue;
      let allSame = true;
      if (line.getFieldCount() > 1) {
        let baseQ = false;
        let baseline = '';
        for (let j = 0; j < line.getFieldCount(); j++) {
          const token = line.token(j);
          if (token === null) continue;
          if (token.getSubtrack() > 1) continue;
          if (!token.isStaff()) continue;
          if (!baseQ) { baseline = strip(token.toString()); baseQ = true; }
          else if (strip(token.toString()) !== baseline) { allSame = false; break; }
        }
      }
      line.setValue('auto', 'straddlingData', this.hasDataStraddleLine(i) ? '1' : '0');
      if (!allSame) {
        line.setValue('auto', 'barlinesDifferent', '1');
        this.m_analysesBarlinesDifferent = true;
      }
      else line.setValue('auto', 'barlinesDifferent', '0');
    }
  }
  hasDifferentBarlines(): boolean {
    if (!this.m_analysesBarlines) this.analyzeBarlines();
    return this.m_analysesBarlinesDifferent;
  }
  analyzeAccidentals(): boolean {
    return this.analyzeKernAccidentals('**kern') && this.analyzeKernAccidentals('**mens');
  }
  fillKeySignature(states: number[], keysig: string): void {
    if (states.length < 7) return;
    states.fill(0);
    if (keysig.indexOf('f#') !== -1) states[3] = 1;
    if (keysig.indexOf('c#') !== -1) states[0] = 1;
    if (keysig.indexOf('g#') !== -1) states[4] = 1;
    if (keysig.indexOf('d#') !== -1) states[1] = 1;
    if (keysig.indexOf('a#') !== -1) states[5] = 1;
    if (keysig.indexOf('e#') !== -1) states[2] = 1;
    if (keysig.indexOf('b#') !== -1) states[6] = 1;
    if (keysig.indexOf('b-') !== -1) states[6] = -1;
    if (keysig.indexOf('e-') !== -1) states[2] = -1;
    if (keysig.indexOf('a-') !== -1) states[5] = -1;
    if (keysig.indexOf('d-') !== -1) states[1] = -1;
    if (keysig.indexOf('g-') !== -1) states[4] = -1;
    if (keysig.indexOf('c-') !== -1) states[0] = -1;
    if (keysig.indexOf('f-') !== -1) states[3] = -1;
  }
  resetDiatonicStatesWithKeySignature(states: number[], signature: number[]): void {
    for (let i = 0; i < states.length; i++) states[i] = signature[i % 7];
  }
  analyzeKernAccidentals(dataType = '**kern'): boolean {
    this.analyzeOttavas();
    const ktracks: HTp[] = dataType === '**mens'
      ? this.getSpineStartListFiltered('**mens')
      : this.getSpineStartListFiltered('**kern');
    if (ktracks.length === 0) return true;
    const rtracks: number[] = new Array(this.getMaxTrack() + 1).fill(-1);
    for (let i = 0; i < ktracks.length; i++) {
      if (ktracks[i] !== null) rtracks[ktracks[i]!.getTrack()] = i;
    }
    const kcount = ktracks.length;
    const keysigs: number[][] = [];
    const dstates: number[][] = [];
    const gdstates: number[][] = [];
    for (let i = 0; i < kcount; i++) {
      keysigs.push(new Array(7).fill(0));
      dstates.push(new Array(70).fill(0));
      gdstates.push(new Array(70).fill(0));
    }
    const firstinbar: number[] = new Array(kcount).fill(0);
    const concurrentstate: number[] = new Array(70).fill(0);
    let lasttrack = -1;
    for (let i = 0; i < this.getLineCount(); i++) {
      const line = this.m_lines[i];
      if (!line.hasSpines()) continue;
      if (line.isInterpretation()) {
        for (let j = 0; j < line.getFieldCount(); j++) {
          const token = line.token(j);
          if (token === null || !token.isKern()) continue;
          if (token.compare(0, 3, '*k[') === 0) {
            const kindex = rtracks[token.getTrack()];
            if (kindex < 0) continue;
            this.fillKeySignature(keysigs[kindex], token.toString());
            this.resetDiatonicStatesWithKeySignature(dstates[kindex], keysigs[kindex]);
            this.resetDiatonicStatesWithKeySignature(gdstates[kindex], keysigs[kindex]);
          }
        }
      }
      else if (line.isBarline()) {
        for (let j = 0; j < line.getFieldCount(); j++) {
          const token = line.token(j);
          if (token === null || !token.isKern() || token.isInvisible()) continue;
          firstinbar.fill(1);
          const kindex = rtracks[token.getTrack()];
          if (kindex < 0) continue;
          this.resetDiatonicStatesWithKeySignature(dstates[kindex], keysigs[kindex]);
          this.resetDiatonicStatesWithKeySignature(gdstates[kindex], keysigs[kindex]);
        }
      }
      if (!line.isData()) continue;
      concurrentstate.fill(0);
      lasttrack = -1;
      for (let j = 0; j < line.getFieldCount(); j++) {
        const token = line.token(j);
        if (token === null || !token.isKern() || token.isNull() || token.isRest()) continue;
        const subcount = token.getSubtokenCount();
        const track = token.getTrack();
        if (lasttrack !== track) concurrentstate.fill(0);
        lasttrack = track;
        const rindex = rtracks[track];
        if (rindex < 0) continue;
        for (let k = 0; k < subcount; k++) {
          let subtok = token.getSubtoken(k);
          if (subcount > 1) subtok = subtok.replace(/r/g, 'R');
          const b40 = kernToBase40(subtok);
          let diatonic = kernToBase7(subtok);
          diatonic -= token.getValueInt('auto', 'ottava') * 7;
          if (diatonic < 0) continue;
          const graceQ = token.isGrace();
          const accid = kernToAccidentalCount(subtok);
          let hiddenQ = 0;
          if (subtok.indexOf('yy') === -1) {
            if (subtok.indexOf('ny') !== -1 || subtok.indexOf('#y') !== -1 || subtok.indexOf('-y') !== -1) hiddenQ = 1;
          }
          if (subtok.indexOf('_') !== -1 || subtok.indexOf(']') !== -1) {
            if (accid !== keysigs[rindex][((diatonic % 7) + 7) % 7] && firstinbar[rindex]) {
              dstates[rindex][diatonic] = -1000 + accid;
              gdstates[rindex][diatonic] = -1000 + accid;
            }
            const xloc = subtok.indexOf('X');
            if (xloc === -1 || xloc === 0) continue;
            const prev = subtok[xloc - 1];
            if (prev !== '#' && prev !== '-' && prev !== 'n') continue;
          }
          this.analyzeOrnamentAccidentals(token, k, subtok, b40, rindex, dstates);
          if (graceQ && accid !== gdstates[rindex][diatonic]) {
            if (!hiddenQ) {
              token.setValue('auto', String(k), 'visualAccidental', 'true');
              if (gdstates[rindex][diatonic] < -900) {
                token.setValue('auto', String(k), 'obligatoryAccidental', 'true');
                token.setValue('auto', String(k), 'cautionaryAccidental', 'true');
              }
            }
            gdstates[rindex][diatonic] = accid;
            dstates[rindex][diatonic] = -1000 + accid;
          }
          else if (!graceQ && ((concurrentstate[diatonic] !== 0 && concurrentstate[diatonic] === accid)
            || accid !== dstates[rindex][diatonic])) {
            if (!hiddenQ) {
              token.setValue('auto', String(k), 'visualAccidental', 'true');
              concurrentstate[diatonic] = accid;
              if (dstates[rindex][diatonic] < -900) {
                token.setValue('auto', String(k), 'obligatoryAccidental', 'true');
                token.setValue('auto', String(k), 'cautionaryAccidental', 'true');
              }
            }
            dstates[rindex][diatonic] = accid;
            gdstates[rindex][diatonic] = accid;
          }
          else if (accid === 0 && subtok.indexOf('n') !== -1 && !hiddenQ) {
            token.setValue('auto', String(k), 'cautionaryAccidental', 'true');
            token.setValue('auto', String(k), 'visualAccidental', 'true');
          }
          else if (subtok.indexOf('XX') === -1) {
            const xloc = subtok.indexOf('X');
            if (xloc > 0) {
              const prev = subtok[xloc - 1];
              if (prev === '#' || prev === '-' || prev === 'n') {
                token.setValue('auto', String(k), 'cautionaryAccidental', 'true');
                token.setValue('auto', String(k), 'visualAccidental', 'true');
              }
            }
          }
        }
      }
      firstinbar.fill(0);
    }
    this.setValue('auto', 'accidentalAnalysis' + dataType, 'true');
    return true;
  }
  analyzeOrnamentAccidentals(
    token: HumdrumToken, k: number, subtok: string, b40: number,
    rindex: number, dstates: number[][],
  ): void {
    const aux = (offset: number, key: string): void => {
      const note = b40 + offset;
      const d = base40ToDiatonic(note);
      const a = base40ToAccidental(note);
      if (d < 0 || d >= dstates[rindex].length) return;
      if (dstates[rindex][d] !== a) {
        token.setValue('auto', String(k), key, String(a));
        dstates[rindex][d] = -1000 + a;
      }
    };
    if (subtok.indexOf('t') !== -1) aux(5, 'trillAccidental');
    else if (subtok.indexOf('T') !== -1) aux(6, 'trillAccidental');
    else if (subtok.indexOf('M') !== -1) aux(6, 'mordentUpperAccidental');
    else if (subtok.indexOf('m') !== -1) aux(5, 'mordentUpperAccidental');
    else if (subtok.indexOf('W') !== -1) aux(-6, 'mordentLowerAccidental');
    else if (subtok.indexOf('w') !== -1) aux(-5, 'mordentLowerAccidental');
    else {
      // C++ humlib.cpp: inverted ($) vs regular (S) turns parse explicit
      // s/S accidental modifiers at different subtoken offsets; without
      // modifiers the state-derived interval reproduces the diatonic state
      // and never fires. TS must not fall back to chromatic semitones.
      const turnLoc = subtok.indexOf('$');
      const regLoc = subtok.indexOf('S');
      const loc = turnLoc !== -1 ? turnLoc : regLoc;
      const invertedQ = turnLoc !== -1;
      if (loc !== -1) {
        const turndiatonic = base40ToDiatonic(b40);
        const lowerdiatonic = turndiatonic - 1;
        const upperdiatonic = turndiatonic + 1;
        let lowerint = 0;
        let upperint = 0;
        if (invertedQ) {
          if (loc < subtok.length - 1) {
            if (subtok[loc + 1] === 's') lowerint = -5;
            else if (subtok[loc + 1] === 'S') lowerint = -6;
          }
          if (loc < subtok.length - 2) {
            if (subtok[loc + 2] === 's') upperint = 5;
            else if (subtok[loc + 2] === 'S') upperint = 6;
          }
        } else {
          if (loc < subtok.length - 1) {
            if (subtok[loc + 1] === 's') upperint = 5;
            else if (subtok[loc + 1] === 'S') upperint = 6;
          }
          if (loc < subtok.length - 2) {
            if (subtok[loc + 2] === 's') lowerint = -5;
            else if (subtok[loc + 2] === 'S') lowerint = -6;
          }
        }
        if (lowerdiatonic >= 0 && upperdiatonic < dstates[rindex].length) {
          const loweraccid = dstates[rindex][lowerdiatonic];
          let lowerb40 = base7ToBase40(lowerdiatonic) + loweraccid;
          const upperaccid = dstates[rindex][upperdiatonic];
          let upperb40 = base7ToBase40(upperdiatonic) + upperaccid;
          if (lowerint === 0) {
            lowerint = lowerb40 - b40;
            lowerb40 = b40 + lowerint;
          }
          if (upperint === 0) {
            upperint = upperb40 - b40;
            upperb40 = b40 + upperint;
          }
          const uacc = base40ToAccidental(b40 + upperint);
          const bacc = base40ToAccidental(b40 + lowerint);
          if (uacc !== upperaccid) {
            token.setValue('auto', String(k), 'turnUpperAccidental', String(uacc));
            dstates[rindex][upperdiatonic] = -1000 + uacc;
          }
          if (bacc !== loweraccid) {
            token.setValue('auto', String(k), 'turnLowerAccidental', String(bacc));
            dstates[rindex][lowerdiatonic] = -1000 + bacc;
          }
        }
      }
    }
  }
  analyzeKernTies(): boolean {
    const starts: Array<[HTp, number]> = [];
    const ends: Array<[HTp, number]> = [];
    this.analyzeKernTiesLinked(starts, ends, this.getKernLinkSignifier());
    this.createLinkedTies(starts, ends);
    return true;
  }
  analyzeTextRepetition(): boolean {
    const sstarts = this.getSpineStartList();
    let output = false;
    let ijstate: boolean;
    let startij: boolean;
    let lastword: HTp;
    for (const start of sstarts) {
      ijstate = false;
      startij = false;
      lastword = null;
      if (start === null || !(start.isDataType('**text') || start.isDataType('**sylb'))) continue;
      let current: HTp = start;
      while (current !== null) {
        if (current.isNull()) { current = current.getNextToken(); continue; }
        if (current.isInterpretation()) {
          const s = current.toString();
          if (s === '*ij' || s === '*edit' || s === '*italic') { output = true; startij = true; ijstate = true; }
          else if (s === '*Xij' || s === '*Xedit' || s === '*Xitalic') {
            output = true; startij = false; ijstate = false;
            if (lastword !== null) { lastword.setValue('auto', 'ij-end', 'true'); lastword = null; }
          }
          current = current.getNextToken();
          continue;
        }
        if (current.isData() && ijstate) {
          current.setValue('auto', 'ij', 'true');
          if (startij) { current.setValue('auto', 'ij-begin', 'true'); startij = false; }
          lastword = current;
        }
        current = current.getNextToken();
      }
    }
    return output;
  }
  analyzeRScale(): boolean {
    let active = 0;
    const rscales: HumNum[] = [];
    for (let i = 0; i <= this.getMaxTrack(); i++) rscales.push(new HumNum(1));
    const hre = new HumRegex();
    for (let i = 0; i < this.getLineCount(); i++) {
      const line = this.m_lines[i];
      if (line.isInterpretation()) {
        for (let j = 0; j < line.getFieldCount(); j++) {
          const token = line.token(j);
          if (token === null || token.compare(0, 8, '*rscale:') !== 0 || !token.isKern()) continue;
          const track = token.getTrack();
          let value = new HumNum(1);
          if (hre.search(token.toString(), '\\*rscale:(\\d+)/(\\d+)')) {
            value = new HumNum(hre.getMatchInt(1), hre.getMatchInt(2));
          }
          else if (hre.search(token.toString(), '\\*rscale:(\\d+)')) {
            value = new HumNum(hre.getMatchInt(1), 1);
          }
          if (value.getNumerator() === 1 && value.getDenominator() === 1) {
            if (!(rscales[track].getNumerator() === 1 && rscales[track].getDenominator() === 1)) {
              rscales[track] = new HumNum(1); active--;
            }
          }
          else {
            if (rscales[track].getNumerator() === 1 && rscales[track].getDenominator() === 1) active++;
            rscales[track] = value;
          }
        }
        continue;
      }
      if (!active || !line.isData()) continue;
      for (let j = 0; j < line.getFieldCount(); j++) {
        const token = line.token(j);
        if (token === null) continue;
        const track = token.getTrack();
        if (rscales[track].getNumerator() === 1 && rscales[track].getDenominator() === 1) continue;
        if (!token.isKern() || token.isNull()) continue;
        const dots = token.getDots();
        const dur = token.getDurationNoDots().mul(rscales[track]);
        let vis = durationToRecip(dur);
        for (let k = 0; k < dots; k++) vis += '.';
        token.setValue('LO', 'N', 'vis', vis);
        token.setValue('auto', 'rscale', String(rscales[track].getNumerator()) + '/' + String(rscales[track].getDenominator()));
      }
    }
    return true;
  }
  analyzeCrossStaffStemDirections(): void {
    const above = this.m_signifiers.getKernAboveSignifier();
    const below = this.m_signifiers.getKernBelowSignifier();
    if (above === '' && below === '') return;
    for (const start of this.getSpineStartListFiltered('**kern')) {
      if (start === null) continue;
      let current: HTp = start;
      while (current !== null) {
        if (current.isData()) this.checkCrossStaffStems(current, above, below);
        current = current.getNextToken();
      }
    }
  }
  checkCrossStaffStems(token: HTp, above: string, below: string): void {
    if (token === null) return;
    const track = token.getTrack();
    let current: HTp = token;
    while (current !== null) {
      if (current.getTrack() !== track) break;
      this.checkDataForCrossStaffStems(current, above, below);
      current = current.getNextFieldToken();
    }
  }
  checkDataForCrossStaffStems(token: HTp, above: string, below: string): void {
    if (token === null || token.isNull() || token.isRest()) return;
    const s = token.toString();
    if (s.indexOf('/') !== -1 || s.indexOf('\\') !== -1) return;
    const hre = new HumRegex();
    let hasaboveQ = false;
    let hasbelowQ = false;
    if (above !== '' && hre.search(s, '[A-Ga-g]+[#n-]*' + above)) hasaboveQ = true;
    if (below !== '' && hre.search(s, '[A-Ga-g]+[#n-]*' + below)) hasbelowQ = true;
    if (!hasaboveQ && !hasbelowQ) return;
    if (hasaboveQ && hasbelowQ) return;
    if (hasaboveQ) this.prepareStaffAboveNoteStems(token);
    else this.prepareStaffBelowNoteStems(token);
  }
  prepareStaffAboveNoteStems(token: HTp): void {
    if (token === null) return;
    token.setValue('auto', 'stem.dir', '-1');
    const track = token.getTrack();
    let curr = token.getNextFieldToken();
    while (curr !== null) {
      if (!curr.isKern() || curr.getTrack() === track) { curr = curr.getNextFieldToken(); continue; }
      break;
    }
    if (curr === null) return;
    const endtime = token.getDurationFromStart().add(token.getDuration());
    let curr2: HTp = curr;
    while (curr2 !== null) {
      if (curr2.getDurationFromStart().greaterOrEqual(endtime)) break;
      if (!curr2.isData() || curr2.isNull() || curr2.isRest() || !curr2.isNote()) { curr2 = curr2.getNextToken(); continue; }
      const cs = curr2.toString();
      if (cs.indexOf('/') !== -1 || cs.indexOf('\\') !== -1) { curr2 = curr2.getNextToken(); continue; }
      if (curr2.getSubtrack() !== 0) { curr2 = curr2.getNextToken(); continue; }
      curr2.setValue('auto', 'stem.dir', '1');
      curr2 = curr2.getNextToken();
    }
  }
  prepareStaffBelowNoteStems(token: HTp): void {
    if (token === null) return;
    token.setValue('auto', 'stem.dir', '1');
    const track = token.getTrack();
    let curr = token.getPreviousFieldToken();
    while (curr !== null) {
      if (!curr.isKern() || curr.getTrack() === track) { curr = curr.getPreviousFieldToken(); continue; }
      break;
    }
    if (curr === null) return;
    while (curr !== null) {
      const ptok = curr.getPreviousFieldToken();
      if (ptok === null || ptok.getTrack() !== curr.getTrack()) break;
      curr = ptok;
    }
    if (curr === null) return;
    const endtime = token.getDurationFromStart().add(token.getDuration());
    let curr2: HTp = curr;
    while (curr2 !== null) {
      if (curr2.getDurationFromStart().greaterOrEqual(endtime)) break;
      if (!curr2.isData() || curr2.isNull() || curr2.isRest() || !curr2.isNote()) { curr2 = curr2.getNextToken(); continue; }
      const cs = curr2.toString();
      if (cs.indexOf('/') !== -1 || cs.indexOf('\\') !== -1) { curr2 = curr2.getNextToken(); continue; }
      if (curr2.getSubtrack() !== 0) { curr2 = curr2.getNextToken(); continue; }
      curr2.setValue('auto', 'stem.dir', '-1');
      curr2 = curr2.getNextToken();
    }
  }
  analyzeRestPositions(): void {
    // C++ body commented out (verovio auto-positions rests); only
    // explicit vertical rest positioning is checked.
    this.checkForExplicitVerticalRestPositions();
  }
  checkForExplicitVerticalRestPositions(): void {
    // C++ HumdrumFileContent::checkForExplicitVerticalRestPositions
    // (humlib.cpp): track clef baselines, then read explicit rest pitch.
    const baselines: number[] = new Array(this.getTrackCount() + 1).fill(Convert.kernClefToBaseline('*clefG2'));
    for (let i = 0; i < this.getLineCount(); i++) {
      const line = this.m_lines[i];
      if (line.isInterpretation()) {
        for (let j = 0; j < line.getFieldCount(); j++) {
          const tok = this.token(i, j);
          if (tok === null || !tok.isKern() || !tok.isClef()) continue;
          baselines[tok.getTrack()] = Convert.kernClefToBaseline(tok.toString());
        }
      }
      if (!line.isData()) continue;
      for (let j = 0; j < line.getFieldCount(); j++) {
        const tok = this.token(i, j);
        if (tok === null || !tok.isKern() || !tok.isRest()) continue;
        this.checkRestForVerticalPositioning(tok, baselines[tok.getTrack()] ?? 0);
      }
    }
  }
  checkRestForVerticalPositioning(rest: HTp, baseline: number): boolean {
    // C++ HumdrumFileContent::checkRestForVerticalPositioning (humlib.cpp).
    if (rest === null) return false;
    const m = /([A-Ga-g]+)/.exec(rest.toString());
    if (m === null) return false;
    let b7 = kernToBase7(m[1]);
    const diff = (b7 - baseline) + 100;
    if (diff % 2 !== 0) {
      const dur = rest.getDuration();
      if (dur.greater(new HumNum(1))) b7--;
      else b7++;
    }
    const pc = ((b7 % 7) + 7) % 7;
    const oct = Math.floor(b7 / 7);
    const dnames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    rest.setValue('auto', 'ploc', dnames[pc]);
    rest.setValue('auto', 'oloc', String(oct));
    return true;
  }
  analyzeKernTiesLinked(
    linkedtiestarts: Array<[HTp, number]>, linkedtieends: Array<[HTp, number]>,
    linkSignifier: string,
  ): boolean {
    if (linkSignifier === '') return true;
    const lstart = linkSignifier + '[';
    const lmiddle = linkSignifier + '_';
    const lend = linkSignifier + ']';
    const startdatabase: Array<[HTp, number]> = new Array(400);
    for (let i = 0; i < startdatabase.length; i++) startdatabase[i] = [null, -1];
    for (let i = 0; i < this.getLineCount(); i++) {
      if (!this.m_lines[i].isData()) continue;
      for (let j = 0; j < this.m_lines[i].getFieldCount(); j++) {
        const tok = this.token(i, j);
        if (tok === null || !tok.isKern() || !tok.isData() || tok.isNull() || tok.isRest()) continue;
        const scount = tok.getSubtokenCount();
        for (let k = 0; k < scount; k++) {
          const index = scount === 1 ? -1 : k;
          const tstring = tok.getSubtoken(k);
          // C++ indexes startdatabase by raw base-40 (can exceed 400 for
          // extreme octaves); clamp the table like the fixed-size vector.
          const b40 = kernToBase40(tstring);
          const slot = ((b40 % 400) + 400) % 400;
          if (tstring.indexOf(lstart) !== -1) startdatabase[slot] = [tok, index];
          if (tstring.indexOf(lend) !== -1 && startdatabase[slot][0] !== null) {
            linkedtiestarts.push(startdatabase[slot]);
            linkedtieends.push([tok, index]);
            startdatabase[slot] = [null, -1];
          }
          if (tstring.indexOf(lmiddle) !== -1) {
            if (startdatabase[slot][0] !== null) {
              linkedtiestarts.push(startdatabase[slot]);
              linkedtieends.push([tok, index]);
            }
            startdatabase[slot] = [tok, index];
          }
        }
      }
    }
    return true;
  }
  createLinkedTies(starts: Array<[HTp, number]>, ends: Array<[HTp, number]>): void {
    const max = Math.min(starts.length, ends.length);
    for (let i = 0; i < max; i++) this.linkTieEndpoints(starts[i][0], starts[i][1], ends[i][0], ends[i][1]);
  }
  linkTieEndpoints(tiestart: HTp, startindex: number, tieend: HTp, endindex: number): void {
    if (tiestart === null || tieend === null) return;
    let durtag = 'tieDuration';
    let starttag = 'tieStart';
    let endtag = 'tieEnd';
    let startnum = 'tieStartSubtokenNumber';
    let endnum = 'tieEndSubtokenNumber';
    const startnumber = startindex + 1;
    const endnumber = endindex + 1;
    if (tiestart.isChord() && startnumber > 0) { durtag += String(startnumber); endnum += String(startnumber); endtag += String(startnumber); }
    if (tieend.isChord() && endnumber > 0) { starttag += String(endnumber); startnum += String(endnumber); }
    tiestart.setValue('auto', endtag, tieend);
    tiestart.setValue('auto', 'id', tiestart.toString());
    if (endnumber > 0) tiestart.setValue('auto', endnum, String(endnumber));
    tieend.setValue('auto', starttag, tiestart);
    tieend.setValue('auto', 'id', tieend.toString());
    if (startnumber > 0) tieend.setValue('auto', startnum, String(startnumber));
    const duration = tieend.getDurationFromStart().sub(tiestart.getDurationFromStart());
    tiestart.setValue('auto', durtag, duration);
  }
  clearTokenLinkInfo(): void {
    for (const line of this.m_lines) if (!line.isEmpty()) line.clearTokenLinkInfo();
  }
  addToTrackStarts(token: HTp): void {
    if (token === null) { this.m_trackstarts.push(null); this.m_trackends.push([]); }
    else if (this.m_trackstarts.length > 1 && this.m_trackstarts[this.m_trackstarts.length - 1] === null) {
      this.m_trackstarts[this.m_trackstarts.length - 1] = token;
    } else { this.m_trackstarts.push(token); this.m_trackends.push([]); }
  }
  setParseError(err: string): boolean { this.m_parseError = err; return !this.m_parseError.length; }
  getParseError(): string { return this.m_parseError; }
  isValid(): boolean { return this.m_parseError.length === 0; }
  isQuiet(): boolean { return this.m_quietParse; }
  setQuietParsing(): void { this.m_quietParse = true; }
  setNoisyParsing(): void { this.m_quietParse = false; }
  setFilename(v: string): void { this.m_filename = v; }
  getFilename(): string { return this.m_filename; }
  setSegmentLevel(v = 0): void { this.m_segmentLevel = v; }
  getSegmentLevel(): number { return this.m_segmentLevel; }
  getLine(index: number): HLp {
    if (index < 0 || index >= this.m_lines.length) return null;
    return this.m_lines[index];
  }
  at(index: number): HumdrumLine { return this.m_lines[index]; }
  getLineCount(): number { return this.m_lines.length; }
  // C++ HumdrumFileBase::insertNullDataLine (humlib.cpp:25207).
  insertNullDataLine(timestamp: HumNum): HLp {
    let beforet = new HumNum(-1);
    let beforei = -1;
    for (let i = 0; i < this.getLineCount(); i++) {
      const line = this.getLine(i);
      if (!line || !line.isData()) continue;
      const current = line.getDurationFromStart();
      if (current.equals(timestamp)) return line;
      if (current.less(timestamp)) { beforet = current; beforei = i; continue; }
      break;
    }
    if (beforei < 0) return null;
    const before = this.m_lines[beforei];
    const newline = new HumdrumLine();
    newline.copyStructure(before, '.');
    newline.m_rhythmAnalyzed = true;
    before.m_rhythmAnalyzed = true;
    this.insertLine(beforei + 1, newline);
    const delta = timestamp.sub(beforet);
    newline.setDurationFromStart(this.m_lines[beforei].getDurationFromStart().add(delta));
    newline.setDurationFromBarline(this.m_lines[beforei].getDurationFromBarline().add(delta));
    newline.setDurationToBarline(this.m_lines[beforei].getDurationToBarline().sub(delta));
    // C++ assigns m_duration directly (humlib.cpp:25253-25254), bypassing
    // the setDuration non-negative clamp; the last inserted line keeps a
    // negative duration so Tool_tremolo's zero-duration grace check skips nothing.
    const raw = newline as unknown as { m_duration: HumNum };
    const rawBefore = this.m_lines[beforei] as unknown as { m_duration: HumNum };
    raw.m_duration = rawBefore.m_duration.sub(delta);
    rawBefore.m_duration = new HumNum(delta);
    this.m_lines[beforei].m_rhythmAnalyzed = true;
    newline.m_rhythmAnalyzed = true;
    for (let i = 0; i < this.m_lines[beforei].getFieldCount(); i++) {
      this.m_lines[beforei].token(i)?.insertTokenAfter(newline.token(i));
    }
    return newline;
  }
  // C++ HumdrumFileBase::insertNullInterpretationLine (humlib.cpp:25291).
  insertNullInterpretationLine(timestamp: HumNum): HLp {
    let beforei = -1;
    for (let i = 0; i < this.getLineCount(); i++) {
      const line = this.getLine(i);
      if (!line || !line.isData()) continue;
      const current = line.getDurationFromStart();
      if (current.equals(timestamp)) { beforei = i; break; }
      if (current.less(timestamp)) { beforei = i; continue; }
      break;
    }
    if (beforei < 0) return null;
    const target = this.lineForInterpretationInsertion(beforei);
    target.m_rhythmAnalyzed = true;
    const newline = new HumdrumLine();
    newline.copyStructure(target, '*');
    newline.m_rhythmAnalyzed = true;
    const targeti = this.m_lines.indexOf(target);
    this.insertLine(targeti, newline);
    const after = this.m_lines[targeti + 1];
    newline.setDurationFromStart(after.getDurationFromStart());
    newline.setDurationFromBarline(after.getDurationFromBarline());
    newline.setDurationToBarline(after.getDurationToBarline());
    newline.setDuration(new HumNum(0));
    newline.m_rhythmAnalyzed = true;
    for (let i = 0; i < this.m_lines[targeti].getFieldCount(); i++) {
      this.m_lines[targeti].token(i)?.insertTokenAfter(newline.token(i));
    }
    return newline;
  }
  // C++ HumdrumFileBase::insertNullInterpretationLineAbove (humlib.cpp:25421).
  insertNullInterpretationLineAbove(timestamp: HumNum): HLp {
    let beforei = -1;
    for (let i = 0; i < this.getLineCount(); i++) {
      const current = this.m_lines[i].getDurationFromStart();
      if (current.equals(timestamp)) { beforei = i; break; }
      if (current.less(timestamp)) { beforei = i; continue; }
      if (current.greater(timestamp)) break;
    }
    if (beforei < 0) return null;
    const target = this.lineForInterpretationInsertionAbove(beforei);
    target.m_rhythmAnalyzed = true;
    const newline = new HumdrumLine();
    newline.copyStructure(target, '*');
    newline.m_rhythmAnalyzed = true;
    const targeti = this.m_lines.indexOf(target);
    this.insertLine(targeti, newline);
    const inserted = this.m_lines[targeti + 1];
    newline.setDurationFromStart(inserted.getDurationFromStart());
    newline.setDurationFromBarline(inserted.getDurationFromBarline());
    newline.setDurationToBarline(inserted.getDurationToBarline());
    newline.setDuration(new HumNum(0));
    newline.m_rhythmAnalyzed = true;
    for (let i = 0; i < this.m_lines[targeti + 1].getFieldCount(); i++) {
      this.m_lines[targeti + 1].token(i)?.insertTokenAfter(newline.token(i));
    }
    return newline;
  }
  // C++ HumdrumFileBase::getLineForInterpretationInsertion (humlib.cpp:25485).
  lineForInterpretationInsertion(index: number): HumdrumLine {
    let current = index - 1;
    let previous = index;
    while (current > 0) {
      const line = this.m_lines[current];
      if (!line || !line.hasSpines()) { current--; continue; }
      if (line.isCommentLocal()) { previous = current; current--; continue; }
      return this.m_lines[previous];
    }
    return this.m_lines[index];
  }
  // C++ HumdrumFileBase::getLineForInterpretationInsertionAbove (humlib.cpp:25512).
  lineForInterpretationInsertionAbove(index: number): HumdrumLine {
    const timestamp = this.m_lines[index].getDurationFromStart();
    let current = index - 1;
    let previous = index;
    while (current > 0) {
      const line = this.m_lines[current];
      if (!line || !line.hasSpines()) { current--; continue; }
      if (line.getDurationFromStart().equals(timestamp)) { previous = current; current--; continue; }
      return this.m_lines[previous];
    }
    return this.m_lines[index];
  }
  token(lineindex: number, fieldindex: number): HTp {
    if (lineindex < 0) lineindex += this.getLineCount();
    const line = this.getLine(lineindex); if (line === null) return null;
    return line.token(fieldindex);
  }
  getMaxTrack(): number { return this.m_trackstarts.length - 1; }
  getMaxTracks(): number { return this.getMaxTrack(); }
  getTrackCount(): number { return this.getMaxTrack(); }
  getSpineCount(): number { return this.getMaxTrack(); }
  getTrackStart(track: number): HTp {
    return track > 0 && track < this.m_trackstarts.length ? this.m_trackstarts[track] : null;
  }
  getTrackEnd(track: number, subtrack = 0): HTp {
    const t = track < 0 ? track + this.m_trackends.length : track;
    if (t < 0 || t >= this.m_trackends.length) return null;
    const s = subtrack < 0 ? subtrack + this.m_trackends[t].length : subtrack;
    if (s < 0 || s >= this.m_trackends[t].length) return null;
    return this.m_trackends[t][s];
  }
  getTrackEndCount(track: number): number {
    const t = track < 0 ? track + this.m_trackends.length : track;
    if (t < 0 || t >= this.m_trackends.length) return 0;
    return this.m_trackends[t].length;
  }
  getSpineStartList(): HTp[] {
    const out: HTp[] = [];
    for (let i = 1; i < this.m_trackstarts.length; i++) out.push(this.m_trackstarts[i]);
    return out;
  }
  getKernLikeSpineStartList(): HTp[] {
    return this.getSpineStartList().filter((t) => t !== null && (t.toString() === '**kern' || t.toString().substr(0, 7) === '**kern-'));
  }
  protected m_analysesSlurs = false;
  protected m_analysesBeams = false;
  protected m_analysesPhrases = false;
  analyzeSlurs(): boolean {
    if (this.m_analysesSlurs) return false;
    this.m_analysesSlurs = true;
    const kern = this.analyzeKernSlurs();
    // analyzeMensSlurs borrows analyzeKernSlurs; scan **mens spines too.
    const mens = this.analyzeMensMarks('slur');
    return kern && mens;
  }
  analyzeBeams(): boolean {
    if (this.m_analysesBeams) return false;
    this.m_analysesBeams = true;
    const kern = this.analyzeKernBeams();
    const mens = this.analyzeMensMarks('beam');
    return kern && mens;
  }
  analyzePhrasings(): boolean {
    if (this.m_analysesPhrases) return false;
    this.m_analysesPhrases = true;
    return this.analyzeKernPhrasings();
  }
  analyzeMensMarks(kind: 'slur' | 'beam'): boolean {
    const starts: HTp[] = [];
    const ends: HTp[] = [];
    const spines = this.getSpineStartListFiltered('**mens');
    const linksig = this.getKernLinkSignifier();
    let output = true;
    for (const spine of spines) {
      const ok = kind === 'slur'
        ? this.analyzeKernSlurSpine(spine, starts, ends, linksig)
        : this.scanCountedMarks(spine, 'L', 'J', linksig + 'L', linksig + 'J',
          (t, i) => t.getBeamStartElisionLevel(i), (t, i) => t.getBeamEndElisionLevel(i),
          this.isLinkedBeamBegin, this.isLinkedBeamEnd,
          this.linkBeamEndpoints, starts, ends, 'Beam');
      if (!ok) output = false;
    }
    if (kind === 'slur') this.createLinkedSlurs(starts, ends);
    else this.createLinkedBeams(starts, ends);
    return output;
  }
  getStaffLikeSpineStartList(): HTp[] {
    return this.getSpineStartList().filter((t) => t !== null && t.isStaffLike());
  }
  getTrackWidths(): number[] {
    const output = new Array(this.getTrackCount() + 1).fill(1);
    output[0] = 0;
    const local = new Array(this.getTrackCount() + 1).fill(0);
    for (let i = 0; i < this.getLineCount(); i++) {
      if (!this.m_lines[i].hasSpines()) continue;
      local.fill(0);
      for (let j = 0; j < this.m_lines[i].getFieldCount(); j++) {
        const track = this.token(i, j)?.getTrack() ?? 0;
        local[track] = (local[track] ?? 0) + 1;
      }
      for (let j = 1; j < local.length; j++) if (local[j] > output[j]) output[j] = local[j];
    }
    return output;
  }
  createLinesFromTokens(): void { for (const line of this.m_lines) line.createLineFromTokens(); }
  generateLinesFromTokens(): void { this.createLinesFromTokens(); }
  removeExtraTabs(): void { for (const line of this.m_lines) line.removeExtraTabs(); }
  addExtraTabs(): void {
    const w = this.getTrackWidths();
    for (const line of this.m_lines) line.addExtraTabs(w);
  }
  appendLine(line: string | HumdrumLine): void {
    const s = typeof line === 'string' ? new HumdrumLine(line) : line;
    s.setOwner(this); this.m_lines.push(s);
  }
  insertLine(index: number, line: string | HumdrumLine): void {
    const s = typeof line === 'string' ? new HumdrumLine(line) : line;
    s.setOwner(this); this.m_lines.splice(index, 0, s);
    // C++ HumdrumFileBase::insertLine (humlib.cpp:23556) reindexes the new
    // line and every following one.
    for (let i = index; i < this.m_lines.length; i++) this.m_lines[i].setLineIndex(i);
  }
  deleteLine(index: number): void { this.m_lines.splice(index, 1); }
  back(): HLp { return this.m_lines.length ? this.m_lines[this.m_lines.length - 1] : null; }
  getReferenceRecords(): HLp[] { return this.m_lines.filter((l) => l.isReference()); }
  getUniversalReferenceRecords(): HLp[] { return this.m_lines.filter((l) => l.isUniversalReference()); }
  getReferenceRecord(key: string): string {
    for (const l of this.m_lines) if (l.isReference() && l.getReferenceKey() === key) return l.getReferenceValue();
    return '';
  }
  hasGlobalFilters(): boolean {
    for (let i = 0; i < this.getLineCount(); i++) {
      if (!this.m_lines[i].isComment()) continue;
      if ((this.token(i, 0)?.toString().substr(0, 10) ?? '') === '!!!filter:') return true;
    }
    return false;
  }
  hasUniversalFilters(): boolean {
    for (const l of this.getUniversalReferenceRecords()) if (l !== null && l.getUniversalReferenceKey() === 'filter') return true;
    return false;
  }
  setFilenameFromSegment(): void {
    for (const line of this.m_lines) {
      if (line.isEmpty()) continue;
      if (!line.isCommentUniversal()) break;
      if (!line.isUniversalReference()) break;
      if (line.getUniversalReferenceKey() !== 'SEGMENT') continue;
      const v = line.getUniversalReferenceValue();
      if (v !== '') { this.setFilename(v); break; }
    }
  }
  toString(): string { return this.m_lines.map((l) => l.toString()).join('\n') + (this.m_lines.length ? '\n' : ''); }
}

export class HumdrumFile extends HumdrumFileBase {
  constructor(contents?: string) {
    super();
    if (contents !== undefined) this.read(contents);
  }
  toString(): string {
    let out = '';
    for (let i = 0; i < this.getLineCount(); i++) out += this.m_lines[i].toString() + '\n';
    return out;
  }
}

export class HumdrumFileStream {
  private m_stringbuffer = '';
  private m_filelist: string[] = [];
  private m_curfile = -1;
  private m_universals: string[] = [];
  private m_newfilebuffer = '';
  constructor(data?: string) { if (data !== undefined) this.loadString(data); }
  loadString(data: string): void { this.m_curfile = -1; this.m_stringbuffer += data; }
  clear(): void { this.m_stringbuffer = ''; this.m_filelist = []; this.m_curfile = -1; this.m_universals = []; this.m_newfilebuffer = ''; }
  setFileList(list: string[]): number { this.m_filelist = [...list]; return this.m_filelist.length; }
  eof(): boolean {
    if (this.m_stringbuffer.length > 0) return false;
    if (this.m_filelist.length > 0 && this.m_curfile < this.m_filelist.length - 1) return false;
    if (this.m_curfile < 0) return false;
    return true;
  }
  read(infile: HumdrumFile): number { return this.getFile(infile); }
  getFile(infile: HumdrumFile): number {
    infile.clear();
    let buffer = '';
    if (this.m_newfilebuffer !== '') { buffer += this.m_newfilebuffer + '\n'; this.m_newfilebuffer = ''; }
    if (this.m_stringbuffer === '' && this.m_filelist.length === 0) return 0;
    if (this.m_stringbuffer === '') return 0;
    const lines = this.m_stringbuffer.split('\n');
    let consumed = 0;
    let starstarFoundQ = 0;
    let foundUniversalQ = this.m_universals.length > 0;
    let stopped = false;
    for (let li = 0; li < lines.length; li++) {
      const templine = lines[li];
      consumed = li + 1;
      if (templine.substr(0, 11) === '!!!!SEGMENT') {
        // C++ HumdrumFileStream::getFile: a SEGMENT line only breaks when
        // the buffer is non-empty; a leading SEGMENT falls through into the
        // buffer (the segment keeps the line, so location IDs match WASM).
        if (buffer !== '') { this.m_newfilebuffer = templine; stopped = true; break; }
        this.m_newfilebuffer = templine;
      }
      if (templine.substr(0, 2) === '**') {
        if (starstarFoundQ === 1) { this.m_newfilebuffer = templine; stopped = true; consumed = li; break; }
        starstarFoundQ = 1;
      }
      if (li === lines.length - 1 && templine === '') break;
      const len = templine.length;
      if (len > 4 && templine.substr(0, 4) === '!!!!' && templine[4] !== '!'
        && templine.substr(0, 11) !== '!!!!filter:' && templine.substr(0, 12) !== '!!!!SEGMENT:') {
        if (foundUniversalQ) this.m_universals.push(templine);
        else { this.m_universals = [templine]; foundUniversalQ = true; }
        continue;
      }
      buffer += templine + '\n';
    }
    this.m_stringbuffer = stopped ? lines.slice(consumed).join('\n') : '';
    if (buffer === '') return 0;
    let contents = '';
    for (const u of this.m_universals) {
      if (u.substr(0, 11) === '!!!!filter:') continue;
      contents += u.slice(1) + '\n';
    }
    contents += buffer;
    const oldfilename = infile.getFilename();
    infile.readNoRhythm(contents);
    if (infile.getFilename() === '' && oldfilename !== '') infile.setFilename(oldfilename);
    infile.setFilenameFromSegment();
    return 1;
  }
}

export class HumdrumFileSet {
  private m_data: HumdrumFile[] = [];
  constructor(contents?: string) { if (contents !== undefined) this.readString(contents); }
  clear(): void { this.m_data = []; }
  clearNoFree(): void { this.m_data = []; }
  getSize(): number { return this.m_data.length; }
  getCount(): number { return this.getSize(); }
  at(index: number): HumdrumFile { return this.m_data[index]; }
  readString(contents: string): number { this.clear(); return this.readAppendString(contents); }
  readStringCsv(contents: string): number { this.clear(); return this.readAppendStringCsv(contents); }
  readAppendString(contents: string): number {
    const instream = new HumdrumFileStream(contents);
    return this.readAppend(instream);
  }
  readAppendStringCsv(_contents: string): number { return 0; }
  readAppend(instream: HumdrumFileStream): number {
    let pfile = new HumdrumFile();
    while (instream.read(pfile)) { this.m_data.push(pfile); pfile = new HumdrumFile(); }
    return this.m_data.length;
  }
  appendHumdrumPointer(infile: HumdrumFile): number { this.m_data.push(infile); return 1; }
  hasFilters(): boolean {
    for (let i = 0; i < this.getCount(); i++) {
      for (let j = 0; j < this.m_data[i].getLineCount(); j++) {
        if (!this.m_data[i].at(j).isComment()) continue;
        const t = this.m_data[i].token(j, 0)?.toString() ?? '';
        if (t.substr(0, 11) === '!!!!filter:' || t.substr(0, 10) === '!!!filter:') return true;
      }
    }
    return false;
  }
  hasGlobalFilters(): boolean {
    for (let i = 0; i < this.getCount(); i++) if (this.m_data[i].hasGlobalFilters()) return true;
    return false;
  }
  hasUniversalFilters(): boolean {
    for (let i = 0; i < this.getCount(); i++) if (this.m_data[i].hasUniversalFilters()) return true;
    return false;
  }
  getUniversalReferenceRecords(): HLp[] {
    const out: HLp[] = [];
    for (const f of this.m_data) out.push(...f.getUniversalReferenceRecords());
    return out;
  }
}
