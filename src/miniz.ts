// Minimal pure-TypeScript ZIP reader (stored + deflate), mirroring the
// miniz-cpp subset bundled in src-cpp/include/zip used by C++ ZipFileReader.
// Provides the default ToolkitFileDeps.createZipFile so MXL import works
// without an injected dependency. CRC and extra fields are not validated
// (C++ miniz path reads the same raw bytes for text files).
import { ZipFileLike, ZipInfoLike } from './zip.js';

class BitReader {
  private pos = 0;
  private bitbuf = 0;
  private bitcnt = 0;
  constructor(private readonly data: Uint8Array) {}
  readBits(n: number): number {
    while (this.bitcnt < n) {
      if (this.pos >= this.data.length) throw new Error('Unexpected end of deflate stream');
      this.bitbuf |= this.data[this.pos++] << this.bitcnt;
      this.bitcnt += 8;
    }
    const out = this.bitbuf & ((1 << n) - 1);
    this.bitbuf >>>= n;
    this.bitcnt -= n;
    return out;
  }
}

function buildHuffman(codeLengths: number[]): { counts: number[]; offsets: number[]; symbols: number[] } {
  const maxLen = Math.max(0, ...codeLengths);
  const counts = new Array(maxLen + 1).fill(0);
  for (const len of codeLengths) if (len > 0) counts[len]++;
  const offsets = new Array(maxLen + 1).fill(0);
  let off = 0;
  for (let len = 1; len <= maxLen; len++) {
    offsets[len] = off;
    off += counts[len];
  }
  const symbols = new Array(codeLengths.length).fill(0);
  const next = offsets.slice();
  for (let sym = 0; sym < codeLengths.length; sym++) {
    const len = codeLengths[sym];
    if (len > 0) symbols[next[len]++] = sym;
  }
  return { counts, offsets, symbols };
}

function decodeSymbol(br: BitReader, h: { counts: number[]; offsets: number[]; symbols: number[] }): number {
  let code = 0;
  let first = 0;
  let index = 0;
  for (let len = 1; len < h.counts.length; len++) {
    code |= br.readBits(1);
    const count = h.counts[len] ?? 0;
    if (code - first < count) return h.symbols[index + (code - first)];
    index += count;
    first = (first + count) << 1;
    code <<= 1;
  }
  throw new Error('Invalid Huffman code');
}

const LENGTH_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
const LENGTH_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
const DIST_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
const DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
const CL_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

function fixedTables(): { lit: ReturnType<typeof buildHuffman>; dist: ReturnType<typeof buildHuffman> } {
  const litLen = new Array(288).fill(0);
  for (let i = 0; i <= 143; i++) litLen[i] = 8;
  for (let i = 144; i <= 255; i++) litLen[i] = 9;
  for (let i = 256; i <= 279; i++) litLen[i] = 7;
  for (let i = 280; i <= 287; i++) litLen[i] = 8;
  return { lit: buildHuffman(litLen), dist: buildHuffman(new Array(32).fill(5)) };
}

/** Raw DEFLATE decompress (stored, fixed, dynamic). Throws on invalid data. */
export function inflateRaw(data: Uint8Array): Uint8Array {
  const br = new BitReader(data);
  const out: number[] = [];
  let fixed: { lit: ReturnType<typeof buildHuffman>; dist: ReturnType<typeof buildHuffman> } | null = null;
  for (;;) {
    const final = br.readBits(1);
    const type = br.readBits(2);
    if (type === 0) {
      // Align to byte boundary by dropping remaining bits.
      (br as unknown as { bitcnt: number; bitbuf: number }).bitcnt = 0;
      (br as unknown as { bitbuf: number }).bitbuf = 0;
      const p = (br as unknown as { pos: number }).pos;
      const len = data[p] | (data[p + 1] << 8);
      const nlen = data[p + 2] | (data[p + 3] << 8);
      if ((len ^ 0xffff) !== nlen && ((len + nlen) & 0xffff) !== 0xffff) throw new Error('Bad stored block lengths');
      (br as unknown as { pos: number }).pos += 4;
      for (let i = 0; i < len; i++) out.push(data[(br as unknown as { pos: number }).pos++]);
    }
    else {
      let lit: ReturnType<typeof buildHuffman>;
      let dist: ReturnType<typeof buildHuffman>;
      if (type === 1) {
        if (!fixed) fixed = fixedTables();
        lit = fixed.lit;
        dist = fixed.dist;
      }
      else if (type === 2) {
        const hlit = br.readBits(5) + 257;
        const hdist = br.readBits(5) + 1;
        const hclen = br.readBits(4) + 4;
        const clLens = new Array(19).fill(0);
        for (let i = 0; i < hclen; i++) clLens[CL_ORDER[i]] = br.readBits(3);
        const clTree = buildHuffman(clLens);
        const total = hlit + hdist;
        const lens: number[] = [];
        while (lens.length < total) {
          const sym = decodeSymbol(br, clTree);
          if (sym <= 15) lens.push(sym);
          else if (sym === 16) {
            const prev = lens.length ? lens[lens.length - 1] : 0;
            const rep = br.readBits(2) + 3;
            for (let i = 0; i < rep; i++) lens.push(prev);
          }
          else if (sym === 17) {
            const rep = br.readBits(3) + 3;
            for (let i = 0; i < rep; i++) lens.push(0);
          }
          else {
            const rep = br.readBits(7) + 11;
            for (let i = 0; i < rep; i++) lens.push(0);
          }
        }
        lit = buildHuffman(lens.slice(0, hlit));
        dist = buildHuffman(lens.slice(hlit, total));
      }
      else throw new Error('Invalid deflate block type');
      for (;;) {
        const sym = decodeSymbol(br, lit);
        if (sym < 256) out.push(sym);
        else if (sym === 256) break;
        else {
          const li = sym - 257;
          const len = LENGTH_BASE[li] + br.readBits(LENGTH_EXTRA[li]);
          const dsym = decodeSymbol(br, dist);
          const d = DIST_BASE[dsym] + br.readBits(DIST_EXTRA[dsym]);
          for (let i = 0; i < len; i++) out.push(out[out.length - d]);
        }
      }
    }
    if (final) break;
  }
  return Uint8Array.from(out);
}

interface ZipEntry {
  name: string;
  method: number;
  data: Uint8Array;
}

function readU16(d: Uint8Array, p: number): number { return d[p] | (d[p + 1] << 8); }
function readU32(d: Uint8Array, p: number): number {
  return (d[p] | (d[p + 1] << 8) | (d[p + 2] << 16) | (d[p + 3] << 24)) >>> 0;
}

class MinizZipFile implements ZipFileLike {
  constructor(private readonly entries: ZipEntry[]) {}
  infolist(): readonly ZipInfoLike[] { return this.entries.map((e) => ({ filename: e.name })); }
  read(filename: string): string {
    const e = this.entries.find((x) => x.name === filename);
    if (!e) return '';
    let raw: Uint8Array;
    if (e.method === 0) raw = e.data;
    else if (e.method === 8) raw = inflateRaw(e.data);
    else throw new Error('Unsupported ZIP compression method ' + e.method);
    let s = '';
    for (let i = 0; i < raw.length; i++) s += String.fromCharCode(raw[i]);
    return decodeURIComponent(escape(s));
  }
  dispose(): void {}
}

/** Parse a ZIP archive via its central directory into a ZipFileLike. */
export function createMinizZipFile(bytes: Uint8Array): ZipFileLike {
  const entries: ZipEntry[] = [];
  // Locate EOCD (PK\x05\x06), scanning back from the end.
  let eocd = -1;
  for (let q = bytes.length - 22; q >= 0; q--) {
    if (readU32(bytes, q) === 0x06054b50) { eocd = q; break; }
  }
  if (eocd < 0) throw new Error('Not a ZIP archive (EOCD missing)');
  const cdCount = readU16(bytes, eocd + 10);
  let p = readU32(bytes, eocd + 16);
  for (let n = 0; n < cdCount; n++) {
    if (readU32(bytes, p) !== 0x02014b50) throw new Error('Bad ZIP central directory');
    const method = readU16(bytes, p + 10);
    const compSize = readU32(bytes, p + 24);
    const nameLen = readU16(bytes, p + 28);
    const extraLen = readU16(bytes, p + 30);
    const commentLen = readU16(bytes, p + 32);
    const localOff = readU32(bytes, p + 42);
    const nameBytes = bytes.slice(p + 46, p + 46 + nameLen);
    let name = '';
    for (let i = 0; i < nameBytes.length; i++) name += String.fromCharCode(nameBytes[i]);
    try { name = decodeURIComponent(escape(name)); } catch { /* keep raw */ }
    // Local header: skip name/extra to reach data.
    const lhNameLen = readU16(bytes, localOff + 26);
    const lhExtraLen = readU16(bytes, localOff + 28);
    const dataStart = localOff + 30 + lhNameLen + lhExtraLen;
    entries.push({ name, method, data: bytes.slice(dataStart, dataStart + (compSize >>> 0)) });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return new MinizZipFile(entries);
}
