/**
 * Pure TypeScript translation of include/vrv/vrv.h + src/vrv.cpp.
 *
 * Native varargs/stdio/time APIs are adapted to TypeScript while preserving
 * observable formatting, filtering, ordering, sentinel and conversion semantics.
 */
import { FileFormat, LogLevel } from './toolkitdef';
import { data_DURATION, ListOfConstObjects, VRV_UNSET } from './vrvdef';

export { FileFormat, LogLevel };
export type { data_DURATION, ListOfConstObjects };

export const STRING_FORMAT_MAX_LEN = 2048;
export const MEI_UNSET = VRV_UNSET;
export const GIT_COMMIT = '[undefined]';

export let logLevel: LogLevel | number = LogLevel.LOG_WARNING;
export let loggingToBuffer = false;
export const logBuffer: string[] = [];

let elapsedStartMs = 0;

/** Runtime sink for non-buffered logging. */
export type LogSink = (level: LogLevel | number, message: string) => void;
let logSink: LogSink = (level, message) => {
  if (typeof console === 'undefined') return;
  switch (level) {
    case LogLevel.LOG_DEBUG: console.debug(message); break;
    case LogLevel.LOG_ERROR: console.error(message); break;
    case LogLevel.LOG_WARNING: console.warn(message); break;
    case LogLevel.LOG_INFO: console.info(message); break;
    default: console.log(message); break;
  }
};

export function SetLogSink(sink: LogSink): void {
  logSink = sink;
}

export function LogElapsedTimeStart(): void {
  elapsedStartMs = monotonicNowMs();
}

export function LogElapsedTimeStop(msg = 'unspecified operation'): void {
  const elapsedTime = monotonicNowMs() - elapsedStartMs;
  LogInfo('Elapsed time (%s): %.3fs', msg, elapsedTime / 1000);
}

export function LogDebug(fmt: string, ...args: unknown[]): void {
  if (logLevel < LogLevel.LOG_DEBUG) return;
  // The C++ DEBUG macro gates the formatting/output itself. Production TS keeps
  // the call observably disabled unless debug level is enabled.
  LogString(`[Debug] ${StringFormat(fmt, ...args)}\n`, LogLevel.LOG_DEBUG);
}

export function LogError(fmt: string, ...args: unknown[]): void {
  if (logLevel < LogLevel.LOG_ERROR) return;
  LogString(`[Error] ${StringFormat(fmt, ...args)}\n`, LogLevel.LOG_ERROR);
}

export function LogInfo(fmt: string, ...args: unknown[]): void {
  if (logLevel < LogLevel.LOG_INFO) return;
  LogString(`[Info] ${StringFormat(fmt, ...args)}\n`, LogLevel.LOG_INFO);
}

export function LogWarning(fmt: string, ...args: unknown[]): void {
  if (logLevel < LogLevel.LOG_WARNING) return;
  LogString(`[Warning] ${StringFormat(fmt, ...args)}\n`, LogLevel.LOG_WARNING);
}

export function LogString(message: string, level: LogLevel | number): void {
  if (loggingToBuffer) {
    if (LogBufferContains(message)) return;
    logBuffer.push(message);
    return;
  }
  logSink(level, message);
}

export function LogBufferContains(s: string): boolean {
  return logBuffer.includes(s);
}

export function StrToLogLevel(level: string): LogLevel {
  if (level === 'off') return LogLevel.LOG_OFF;
  if (level === 'error') return LogLevel.LOG_ERROR;
  if (level === 'warning') return LogLevel.LOG_WARNING;
  if (level === 'info') return LogLevel.LOG_INFO;
  if (level === 'debug') return LogLevel.LOG_DEBUG;
  LogWarning("Unkown log level '%s' (warning is default)", level);
  return LogLevel.LOG_WARNING;
}

export function EnableLog(level: LogLevel | number): void {
  logLevel = level;
}

export function EnableLogToBuffer(value: boolean): void {
  loggingToBuffer = value;
}

export function StringFormat(fmt: string, ...args: unknown[]): string {
  return formatPrintf(fmt, args).slice(0, STRING_FORMAT_MAX_LEN - 1);
}

export function StringFormatVariable(fmt: string, args: readonly unknown[]): string {
  return StringFormat(fmt, ...args);
}

export function ApproximatelyEqual(firstVal: number, secondVal: number): boolean {
  return Math.abs(firstVal - secondVal) < 1E-3;
}

export function IsValidInteger(value: string): boolean {
  return /^\s*[+-]?\d+\.?\d*\s*$/.test(value);
}

export function IsValidDouble(value: string): boolean {
  return /^\s*[+-]?(?:\d+\.?\d*|\.\d+)\s*$/.test(value);
}

export function IsDigits(value: string): boolean {
  return /^\d+$/.test(value);
}

export function ExtractIDFragment(refID: string): string {
  const pos = refID.lastIndexOf('#');
  if (pos !== -1 && pos < refID.length - 1) return refID.slice(pos + 1);
  return refID;
}

export interface ObjectWithId { GetID(): string; }

export function ConcatenateIDs(objects: readonly ObjectWithId[]): string {
  const ids = objects.map(object => `#${object.GetID()} `);
  let uris = ids.join('');
  if (uris.length > 0) uris = uris.slice(0, -1);
  return uris;
}

export function UTF32to8(input: readonly number[]): string {
  // C++ returns UTF-8 bytes in std::string; TS strings are UTF-16 code units,
  // so return the real code-point string (serializes to identical UTF-8 bytes).
  // The old byte-wise fromCharCode produced Latin-1 chars (U+00EE...) that
  // re-encoded to wrong bytes on output.
  let out = '';
  for (const cp of input) out += String.fromCodePoint(cp);
  return out;
}

export function UTF8to32(input: string): number[] {
  const bytes = Array.from(new TextEncoder().encode(input));
  const out: number[] = [];
  for (let i = 0; i < bytes.length;) {
    let cp = bytes[i];
    if (cp <= 0x7F) { out.push(cp); i += 1; }
    else if (cp <= 0xDF) { cp = ((cp & 0x1F) << 6) | (bytes[i + 1] & 0x3F); out.push(cp); i += 2; }
    else if (cp <= 0xEF) { cp = ((cp & 0x0F) << 12) | ((bytes[i + 1] & 0x3F) << 6) | (bytes[i + 2] & 0x3F); out.push(cp); i += 3; }
    else { cp = ((cp & 0x07) << 18) | ((bytes[i + 1] & 0x3F) << 12) | ((bytes[i + 2] & 0x3F) << 6) | (bytes[i + 3] & 0x3F); out.push(cp); i += 4; }
  }
  return out;
}

export function UTF16to8(input: readonly number[] | string): string {
  const units = typeof input === 'string' ? Array.from(input, ch => ch.charCodeAt(0)) : [...input];
  let out = '';
  for (let i = 0; i < units.length;) {
    const lead = units[i++];
    let cp: number;
    if (lead >= 0xD800 && lead <= 0xDBFF) {
      if (i >= units.length) throw new Error('Incomplete UTF-16 sequence');
      const trail = units[i++];
      if (trail < 0xDC00 || trail > 0xDFFF) throw new Error('Invalid UTF-16 sequence');
      cp = ((lead - 0xD800) << 10) + (trail - 0xDC00) + 0x10000;
    } else cp = lead;
    out += UTF32to8([cp]);
  }
  return out;
}

export function GetFileVersion(vmaj: number, vmin: number, vrev: number): string {
  return StringFormat('%04d.%04d.%04d', vmaj, vmin, vrev);
}

export function GetFilename(fullpath: string): string {
  let name = fullpath;
  const lastdot = name.lastIndexOf('.');
  if (lastdot !== -1) name = name.slice(0, lastdot);
  const lastslash = name.lastIndexOf('/');
  if (lastslash !== -1) name = name.slice(lastslash + 1);
  return name;
}

export const VERSION_MAJOR = 6;
export const VERSION_MINOR = 4;
export const VERSION_REVISION = 0;
export const VERSION_DEV = true;

export function GetVersion(): string {
  const dev = VERSION_DEV ? '-dev' : '';
  return StringFormat('%d.%d.%d%s%s', VERSION_MAJOR, VERSION_MINOR, VERSION_REVISION, dev, GIT_COMMIT);
}

const base62Chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function BaseEncodeInt(value: number, base: number): string {
  if (!(base > 10 && base < 63)) throw new Error('base must satisfy 10 < base < 63');
  value = value >>> 0;
  if (value < base) return base62Chars[value];
  // ponytail: collect digits MSB-first into pre-sized array; single join.
  // Old `+=` + split/reverse/join ran per VrvObject id (185: 150ms self).
  let len = 0;
  for (let v = value; v >= base; v = Math.floor(v / base)) ++len;
  const out = new Array<string>(len + 1);
  let i = len;
  while (value >= base) {
    out[i--] = base62Chars[value % base];
    value = Math.floor(value / base);
  }
  out[0] = base62Chars[value];
  return out.join('');
}

export function FromCamelCase(s: string): string {
  let result = s.replace(/(.)([A-Z][a-z]+)/g, '$1-$2').replace(/([a-z0-9])([A-Z])/g, '$1-$2');
  return result.toLowerCase();
}

export function ToCamelCase(s: string): string {
  const tokens = s.split('-');
  let result = '';
  for (const token of tokens) {
    if (token.length === 0) {
      // Match C++'s token[0] behavior by treating empty segments as a range error.
      throw new Error('empty camel-case segment');
    }
    result += token[0].toUpperCase() + token.slice(1);
  }
  if (result.length === 0) throw new Error('empty camel-case string');
  return result[0].toLowerCase() + result.slice(1);
}

export function DurationMin(dur1: data_DURATION, dur2: data_DURATION): data_DURATION { return Math.min(dur1, dur2); }
export function DurationMax(dur1: data_DURATION, dur2: data_DURATION): data_DURATION { return Math.max(dur1, dur2); }

export function IsMensuralType(notationType: number): boolean {
  // libmei: NONE=0, cmn=1, mensural=2, mensural_black=3, mensural_white=4.
  return notationType === 2 || notationType === 3 || notationType === 4;
}
export function IsNeumeType(notationType: number): boolean {
  // libmei: neume=5, neume_square=6, neume_hufnagel=7.
  return notationType === 5 || notationType === 6 || notationType === 7;
}
export function IsTabType(notationType: number): boolean {
  // libmei: tab=8.
  return notationType === 8;
}

const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const base64Index = new Int16Array(256);
base64Index.fill(-1);
for (let i = 0; i < base64Chars.length; ++i) base64Index[base64Chars.charCodeAt(i)] = i;

export function Base64Encode(bytesToEncode: Uint8Array | readonly number[]): string {
  const bytes = bytesToEncode instanceof Uint8Array ? bytesToEncode : Uint8Array.from(bytesToEncode);
  let ret = '';
  let i = 0;
  const inLen = bytes.length;
  while (i + 2 < inLen) {
    const a = bytes[i++], b = bytes[i++], c = bytes[i++];
    ret += base64Chars[(a & 0xfc) >> 2];
    ret += base64Chars[((a & 0x03) << 4) + ((b & 0xf0) >> 4)];
    ret += base64Chars[((b & 0x0f) << 2) + ((c & 0xc0) >> 6)];
    ret += base64Chars[c & 0x3f];
  }
  const rem = inLen - i;
  if (rem) {
    const a = bytes[i++];
    const b = rem > 1 ? bytes[i++] : 0;
    const c = 0;
    ret += base64Chars[(a & 0xfc) >> 2];
    ret += base64Chars[((a & 0x03) << 4) + ((b & 0xf0) >> 4)];
    ret += rem > 1 ? base64Chars[((b & 0x0f) << 2) + ((c & 0xc0) >> 6)] : '=';
    ret += '=';
  }
  return ret;
}

export function Base64Decode(encodedString: string): Uint8Array {
  const ret: number[] = [];
  let i = 0;
  let input = 0;
  while (input < encodedString.length && encodedString[input] !== '=' && isBase64(encodedString.charCodeAt(input))) {
    const c0 = encodedString.charCodeAt(input++);
    const c1 = encodedString.charCodeAt(input++);
    const c2 = encodedString[input] && encodedString[input] !== '=' ? encodedString.charCodeAt(input++) : -1;
    const c3 = encodedString[input] && encodedString[input] !== '=' ? encodedString.charCodeAt(input++) : -1;
    if (c1 < 0) break;
    const a = base64Value(c0), b = base64Value(c1);
    const c = c2 >= 0 ? base64Value(c2) : 0;
    const d = c3 >= 0 ? base64Value(c3) : 0;
    ret.push((a << 2) | ((b & 0x30) >> 4));
    if (c2 >= 0) ret.push(((b & 0xf) << 4) | ((c & 0x3c) >> 2));
    if (c3 >= 0) ret.push(((c & 0x3) << 6) | d);
  }
  return Uint8Array.from(ret);
}

function isBase64(code: number): boolean {
  return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 43 || code === 47;
}
function base64Value(code: number): number {
  return base64Index[code] < 0 ? 0 : base64Index[code];
}
function monotonicNowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now();
  return Date.now();
}
function formatPrintf(fmt: string, args: readonly unknown[]): string {
  let index = 0;
  return fmt.replace(/%(-?)(0)?([0-9]*)(?:\.([0-9]+))?([difgsux])/g, (_, left: string, zero: string, width: string, precision: string, type: string) => {
    const value = args[index++];
    let result: string;
    switch (type) {
      case 'd':
      case 'i': result = String(Math.trunc(Number(value))); break;
      case 'f': result = Number(value).toFixed(precision ? Number(precision) : 6); break;
      case 'g': {
        const n = Number(value);
        result = precision ? n.toPrecision(Number(precision)) : String(n);
        // printf %g removes insignificant trailing zeros and a trailing dot.
        if (result.includes('e') || result.includes('E')) {
          result = result.replace(/(\d)0+(e[+-]?\d+)$/i, '$1$2');
        } else if (result.includes('.')) {
          result = result.replace(/\.?0+$/, '');
        }
        break;
      }
      case 's': result = String(value); break;
      case 'u': result = String((Number(value) >>> 0)); break;
      case 'x': result = (Number(value) >>> 0).toString(16); break;
      default: result = String(value);
    }
    if (width) {
      const target = Number(width);
      if (result.length < target) {
        const fill = zero && !left ? '0' : ' ';
        const pad = fill.repeat(target - result.length);
        if (left) result += pad;
        else if (fill === '0' && /^[+-]/.test(result)) result = result[0] + pad + result.slice(1);
        else result = pad + result;
      }
    }
    return result;
  });
}
