import { HumNum } from './humlib';
import { Convert } from './convert';

export interface HumdrumTokenLike {
  getXmlId(): string;
}

export class HumParameter {
  value: string;
  origin: HumdrumTokenLike | null = null;
  constructor(str = '') { this.value = str; }
  toString(): string { return this.value; }
}

type ParamMap = Map<string, Map<string, Map<string, HumParameter>>>;

export class HumHash {
  private parameters: ParamMap | null = null;
  private prefix = '';

  private initializeParameters(): void {
    if (this.parameters === null) this.parameters = new Map();
  }
  private ns1(ns1: string): Map<string, Map<string, HumParameter>> {
    this.initializeParameters();
    let a = this.parameters!.get(ns1);
    if (!a) { a = new Map(); this.parameters!.set(ns1, a); }
    return a;
  }
  private ns2(ns1: string, ns2: string): Map<string, HumParameter> {
    const a = this.ns1(ns1);
    let b = a.get(ns2);
    if (!b) { b = new Map(); a.set(ns2, b); }
    return b;
  }
  private keyParts(keys: string): string[] { return keys.split(':'); }

  getValue(key: string): string;
  getValue(ns2: string, key: string): string;
  getValue(ns1: string, ns2: string, key: string): string;
  getValue(a: string, b?: string, c?: string): string {
    if (arguments.length === 1) {
      if (this.parameters === null) return '';
      const keys = this.keyParts(a);
      if (keys.length === 1) return this.getValue('', '', keys[0]);
      if (keys.length === 2) return this.getValue('', keys[0], keys[1]);
      return this.getValue(keys[0], keys[1], keys[2]);
    }
    if (arguments.length === 2) return this.getValue('', a, b!);
    if (this.parameters === null) return '';
    return this.parameters.get(a)?.get(b!)?.get(c!)?.value ?? '';
  }

  getValueHTp(key: string): HumdrumTokenLike | null;
  getValueHTp(ns2: string, key: string): HumdrumTokenLike | null;
  getValueHTp(ns1: string, ns2: string, key: string): HumdrumTokenLike | null;
  getValueHTp(a: string, b?: string, c?: string): HumdrumTokenLike | null {
    if (arguments.length === 1) {
      if (this.parameters === null) return null;
      const keys = this.keyParts(a);
      // Preserve upstream indexing behavior for the one-key overload.
      if (keys.length === 1) return this.getValueHTp('', '', keys[2] as string);
      if (keys.length === 2) return this.getValueHTp(keys[0], keys[1]);
      return this.getValueHTp(keys[0], keys[1], keys[2]);
    }
    if (arguments.length === 2) return this.getValueHTp('', a, b!);
    if (this.parameters === null) return null;
    const value = this.getValue(a, b!, c!);
    if (!value.startsWith('HT_')) return null;
    const n = Number.parseInt(value.slice(3), 10);
    return Number.isFinite(n) ? ({ getXmlId: () => String(n) } as HumdrumTokenLike) : null;
  }

  getValueInt(key: string): number;
  getValueInt(ns2: string, key: string): number;
  getValueInt(ns1: string, ns2: string, key: string): number;
  getValueInt(a: string, b?: string, c?: string): number {
    if (arguments.length === 1) {
      if (this.parameters === null) return 0;
      const keys = this.keyParts(a);
      if (keys.length === 1) return this.getValueInt('', '', keys[2] as string);
      if (keys.length === 2) return this.getValueInt(keys[0], keys[1]);
      return this.getValueInt(keys[0], keys[1], keys[2]);
    }
    if (arguments.length === 2) return this.getValueInt('', a, b!);
    if (this.parameters === null) return 0;
    const value = this.getValue(a, b!, c!);
    if (value.includes('/')) return new HumNum(value).getInteger();
    const m = value.match(/^\s*([+-]?\d+)/);
    return m ? Number.parseInt(m[1], 10) : 0;
  }

  getValueFraction(key: string): HumNum;
  getValueFraction(ns2: string, key: string): HumNum;
  getValueFraction(ns1: string, ns2: string, key: string): HumNum;
  getValueFraction(a: string, b?: string, c?: string): HumNum {
    if (arguments.length === 1) {
      if (this.parameters === null) return new HumNum(0);
      const keys = this.keyParts(a);
      if (keys.length === 1) return this.getValueFraction('', '', keys[0]);
      if (keys.length === 2) return this.getValueFraction('', keys[0], keys[1]);
      return this.getValueFraction(keys[0], keys[1], keys[2]);
    }
    if (arguments.length === 2) return this.getValueFraction('', a, b!);
    if (!this.isDefined(a, b!, c!)) return new HumNum(0);
    return new HumNum(this.getValue(a, b!, c!));
  }

  getValueFloat(key: string): number;
  getValueFloat(ns2: string, key: string): number;
  getValueFloat(ns1: string, ns2: string, key: string): number;
  getValueFloat(a: string, b?: string, c?: string): number {
    if (arguments.length === 1) {
      if (this.parameters === null) return 0;
      const keys = this.keyParts(a);
      if (keys.length === 1) return this.getValueFloat('', '', keys[2] as string);
      if (keys.length === 2) return this.getValueFloat(keys[0], keys[1]);
      return this.getValueFloat(keys[0], keys[1], keys[2]);
    }
    // Preserve the upstream two-argument implementation bug (it delegates to getValueInt).
    if (arguments.length === 2) return this.getValueInt('', a, b!);
    if (this.parameters === null) return 0;
    const value = this.getValue(a, b!, c!);
    if (value.includes('/')) return new HumNum(value).getFloat();
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }

  getValueBool(key: string): boolean;
  getValueBool(ns2: string, key: string): boolean;
  getValueBool(ns1: string, ns2: string, key: string): boolean;
  getValueBool(a: string, b?: string, c?: string): boolean {
    if (arguments.length === 1) {
      const keys = this.keyParts(a);
      if (keys.length === 1) return this.getValueBool('', '', keys[2] as string);
      if (keys.length === 2) return this.getValueBool(keys[0], keys[1]);
      return this.getValueBool(keys[0], keys[1], keys[2]);
    }
    if (arguments.length === 2) return this.getValueBool('', a, b!);
    if (this.parameters === null || !this.isDefined(a, b!, c!)) return false;
    const value = this.getValue(a, b!, c!);
    return value !== 'false' && value !== '0';
  }

  setValue(key: string, value: string | number | HumNum | HumdrumTokenLike): void;
  setValue(ns2: string, key: string, value: string | number | HumNum | HumdrumTokenLike): void;
  setValue(ns1: string, ns2: string, key: string, value: string | number | HumNum | HumdrumTokenLike): void;
  setValue(a: string, b?: string | number | HumNum | HumdrumTokenLike, c?: string | number | HumNum | HumdrumTokenLike, d?: string | number | HumNum | HumdrumTokenLike): void {
    let ns1: string, ns2: string, key: string, value: string | number | HumNum | HumdrumTokenLike;
    if (arguments.length === 2) {
      const keys = this.keyParts(a);
      if (keys.length === 1) { ns1 = ''; ns2 = ''; key = keys[0]; }
      else if (keys.length === 2) { ns1 = ''; ns2 = keys[0]; key = keys[1]; }
      else { ns1 = keys[0]; ns2 = keys[1]; key = keys[2]; }
      value = b!;
    } else if (arguments.length === 3) {
      ns1 = ''; ns2 = a; key = b as string; value = c!;
    } else {
      ns1 = a; ns2 = b as string; key = c as string; value = d!;
    }
    let stored: string;
    if (value instanceof HumNum) stored = value.toString();
    else if (typeof value === 'number') stored = String(value);
    else if (typeof value === 'string') stored = value;
    else stored = `HT_${String(value)}`;
    this.ns2(ns1, ns2).set(key, new HumParameter(stored));
  }

  getParameters(ns1: string, ns2: string): Map<string, string>;
  getParameters(ns1: string): Map<string, string>;
  getParameters(ns1: string, ns2?: string): Map<string, string> {
    const out = new Map<string, string>();
    if (this.parameters === null) return out;
    if (ns2 !== undefined) {
      for (const [k, p] of (this.parameters.get(ns1)?.get(ns2) ?? new Map())) out.set(k, p.value);
      return out;
    }
    const loc = ns1.indexOf(':');
    if (loc >= 0) return this.getParameters(ns1.slice(0, loc), ns1.slice(loc + 1));
    return this.getParameters('', ns1);
  }

  getKeys(ns1: string, ns2: string): string[];
  getKeys(ns: string): string[];
  getKeys(): string[];
  getKeys(a?: string, b?: string): string[] {
    if (this.parameters === null) return [];
    if (a !== undefined && b !== undefined) return [...(this.parameters.get(a)?.get(b)?.keys() ?? [])];
    if (a !== undefined) {
      const loc = a.indexOf(':');
      if (loc >= 0) return this.getKeys(a.slice(0, loc), a.slice(loc + 1));
      const out: string[] = [];
      for (const [ns2, values] of this.parameters.get(a) ?? []) for (const key of values.keys()) out.push(`${ns2}:${key}`);
      return out;
    }
    const out: string[] = [];
    for (const [ns1, n2s] of this.parameters) for (const [ns2, values] of n2s) for (const key of values.keys()) out.push(`${ns1}:${ns2}:${key}`);
    return out;
  }

  hasParameters(ns1: string, ns2: string): boolean;
  hasParameters(ns: string): boolean;
  hasParameters(): boolean;
  hasParameters(a?: string, b?: string): boolean {
    if (this.parameters === null) return false;
    if (a !== undefined && b !== undefined) return this.parameters.get(a)?.get(b) !== undefined;
    if (a !== undefined) {
      const loc = a.indexOf(':');
      if (loc >= 0) return this.hasParameters(a.slice(0, loc), a.slice(loc + 1));
      return this.parameters.has(a);
    }
    for (const n2s of this.parameters.values()) for (const values of n2s.values()) if (values.size) return true;
    return false;
  }

  getParameterCount(ns1: string, ns2: string): number;
  getParameterCount(ns: string): number;
  getParameterCount(): number;
  getParameterCount(a?: string, b?: string): number {
    if (this.parameters === null) return 0;
    if (a !== undefined && b !== undefined) return this.parameters.get(a)?.get(b)?.size ?? 0;
    if (a !== undefined) {
      const loc = a.indexOf(':');
      if (loc >= 0) return this.getParameterCount(a.slice(0, loc), a.slice(loc + 1));
      let sum = 0; for (const values of this.parameters.get(a)?.values() ?? []) sum += values.size; return sum;
    }
    let sum = 0; for (const n2s of this.parameters.values()) for (const values of n2s.values()) sum += values.size; return sum;
  }

  isDefined(key: string): boolean;
  isDefined(ns2: string, key: string): boolean;
  isDefined(ns1: string, ns2: string, key: string): boolean;
  isDefined(a: string, b?: string, c?: string): boolean {
    if (this.parameters === null) return false;
    if (arguments.length === 1) {
      const keys = this.keyParts(a);
      if (keys.length === 1) return this.parameters.get('')?.get('')?.has(keys[0]) ?? false;
      if (keys.length === 2) return this.parameters.get('')?.get(keys[0])?.has(keys[1]) ?? false;
      return this.parameters.get(keys[0])?.get(keys[1])?.has(keys[2]) ?? false;
    }
    if (arguments.length === 2) return this.parameters.get('')?.get(a)?.has(b!) ?? false;
    return this.parameters.get(a)?.get(b!)?.has(c!) ?? false;
  }

  deleteValue(key: string): void;
  deleteValue(ns2: string, key: string): void;
  deleteValue(ns1: string, ns2: string, key: string): void;
  deleteValue(a: string, b?: string, c?: string): void {
    if (this.parameters === null) return;
    let ns1 = '', ns2 = '', key = '';
    if (arguments.length === 1) {
      const keys = this.keyParts(a); if (keys.length===1) key=keys[0]; else if(keys.length===2){ns2=keys[0];key=keys[1];} else {ns1=keys[0];ns2=keys[1];key=keys[2];}
    } else if (arguments.length === 2) { ns2=a; key=b!; }
    else { ns1=a; ns2=b!; key=c!; }
    this.parameters.get(ns1)?.get(ns2)?.delete(key);
  }

  setPrefix(value: string): void { this.prefix = value; }
  getPrefix(): string { return this.prefix; }

  setOrigin(key: string, tok: HumdrumTokenLike): void;
  setOrigin(ns2: string, key: string, tok: HumdrumTokenLike): void;
  setOrigin(ns1: string, ns2: string, key: string, tok: HumdrumTokenLike): void;
  setOrigin(a: string, b: string | HumdrumTokenLike, c?: HumdrumTokenLike | string, d?: HumdrumTokenLike): void {
    if (this.parameters === null) return;
    let ns1='', ns2='', key='', tok: HumdrumTokenLike;
    if (arguments.length === 2) { const keys=this.keyParts(a); if(keys.length===1)key=keys[0]; else if(keys.length===2){ns2=keys[0];key=keys[1];} else {ns1=keys[0];ns2=keys[1];key=keys[2];} tok=b as HumdrumTokenLike; }
    else if(arguments.length===3){ns2=a;key=b as string;tok=c as HumdrumTokenLike;}
    else {ns1=a;ns2=b as string;key=c as string;tok=d!;}
    const p=this.parameters.get(ns1)?.get(ns2)?.get(key); if(p) p.origin=tok;
  }

  getOrigin(key: string): HumdrumTokenLike | null;
  getOrigin(ns2: string, key: string): HumdrumTokenLike | null;
  getOrigin(ns1: string, ns2: string, key: string): HumdrumTokenLike | null;
  getOrigin(a: string, b?: string, c?: string): HumdrumTokenLike | null {
    if(this.parameters===null)return null;
    if(arguments.length===1){const keys=this.keyParts(a);if(keys.length===1)return this.getOrigin('', '', keys[0]);if(keys.length===2)return this.getOrigin('',keys[0],keys[1]);return this.getOrigin(keys[0],keys[1],keys[2]);}
    if(arguments.length===2)return this.getOrigin('',a,b!);
    return this.parameters.get(a)?.get(b!)?.get(c!)?.origin ?? null;
  }

  printXml(level=0, indent='  '): string {
    if (!this.hasParameters()) return '';
    const lines: string[] = [];
    let current = level + 1;
    for (const [ns1, n2s] of this.parameters!) {
      if (!n2s.size) continue;
      lines.push(`${indent.repeat(current)}<namespace n="1" name="${ns1}">`); current++;
      for (const [ns2, values] of n2s) {
        if (!values.size) continue;
        lines.push(`${indent.repeat(current)}<namespace n="2" name="${ns2}">`); current++;
        for (const [key, p] of values) {
          let line = `${indent.repeat(current)}<parameter key="${key}" value="${Convert.encodeXml(p.value)}"`;
          if (p.origin) line += ` idref="${p.origin.getXmlId()}"`;
          lines.push(line + '/>');
        }
        current--; lines.push(`${indent.repeat(current)}</namespace>`);
      }
      current--; lines.push(`${indent.repeat(current)}</namespace>`);
    }
    if (!lines.length) return '';
    return `${indent.repeat(level)}<parameters>\n${lines.join('\n')}\n${indent.repeat(level)}</parameters>\n`;
  }

  printXmlAsGlobal(level=0, indent='  '): string {
    // This intentionally mirrors the unusual split of the root/root namespace in the C++ implementation.
    if (!this.hasParameters()) return '';
    const body = this.printXml(level, indent);
    return body ? body.replace('<parameters>', '<parameters global="true">') : '';
  }

  toString(): string {
    if (!this.hasParameters()) return '';
    const out: string[] = [];
    for (const [ns1, n2s] of this.parameters!) for (const [ns2, values] of n2s) {
      if (!values.size) continue;
      const suffix = [...values].map(([k,p]) => ':' + k + (p.value !== 'true' ? '=' + Convert.replaceOccurrences(p.value, ':', '&colon;') : '')).join('');
      out.push(`${this.prefix}${ns1}:${ns2}${suffix}`);
    }
    return out.join('\n') + '\n';
  }
}
