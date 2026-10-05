/**
 * Typed contract for the external miniz-cpp zip_file dependency used by Verovio.
 *
 * This is intentionally a declaration/adapter boundary, not a ZIP implementation.
 * The real migration must supply a pure-TypeScript ZIP reader at application level;
 * the Verovio translation preserves the original ZipFileReader delegation semantics.
 */
export interface ZipInfoLike {
  filename: string;
}

export interface ZipFileLike {
  infolist(): readonly ZipInfoLike[];
  read(filename: string): string;
  dispose(): void;
}

export interface FileBytesLoader {
  readFileBytes(filename: string): Uint8Array | null;
}

export interface ZipFileReaderDependencies {
  createZipFile(bytes: Uint8Array): ZipFileLike;
  fileLoader: FileBytesLoader;
  logError(message: string, ...args: unknown[]): void;
}

/**
 * Minimal platform-independent base64 decoder used for the __EMSCRIPTEN__ path.
 * Mirrors the C++ Base64Decode role without depending on Node Buffer or Web APIs.
 */
export function decodeBase64(encoded: string): Uint8Array {
  const normalized = encoded.replace(/\s/g, '');
  if (normalized.length === 0) return new Uint8Array(0);
  if (normalized.length % 4 !== 0) throw new Error('Invalid base64 length');

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const output: number[] = [];

  for (let i = 0; i < normalized.length; i += 4) {
    const c0 = normalized[i];
    const c1 = normalized[i + 1];
    const c2 = normalized[i + 2];
    const c3 = normalized[i + 3];
    const v0 = alphabet.indexOf(c0);
    const v1 = alphabet.indexOf(c1);
    const v2 = c2 === '=' ? 0 : alphabet.indexOf(c2);
    const v3 = c3 === '=' ? 0 : alphabet.indexOf(c3);

    if (v0 < 0 || v1 < 0 || v2 < 0 || v3 < 0) throw new Error('Invalid base64 character');
    if (c2 === '=' && c3 !== '=') throw new Error('Invalid base64 padding');
    if ((c2 === '=' || c3 === '=') && i + 4 !== normalized.length) {
      throw new Error('Invalid base64 padding position');
    }

    output.push((v0 << 2) | (v1 >> 4));
    if (c2 !== '=') output.push(((v1 & 0x0f) << 4) | (v2 >> 2));
    if (c3 !== '=') output.push(((v2 & 0x03) << 6) | v3);
  }

  return Uint8Array.from(output);
}
