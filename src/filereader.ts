import {
  decodeBase64,
  FileBytesLoader,
  ZipFileLike,
  ZipFileReaderDependencies,
  ZipInfoLike,
} from './zip.js';

/** Direct TypeScript translation of verovio::ZipFileReader. */
export class ZipFileReader {
  private m_file: ZipFileLike | null = null;
  private readonly dependencies: ZipFileReaderDependencies;

  public constructor(dependencies: ZipFileReaderDependencies) {
    this.dependencies = dependencies;
    this.m_file = null;
    this.Reset();
  }

  public destructor(): void {
    this.Reset();
  }

  public Reset(): void {
    if (this.m_file) {
      this.m_file.dispose();
      this.m_file = null;
    }
  }

  /**
   * Mirrors the two C++ Load implementations:
   * - EMSCRIPTEN receives a data/base64 string and forwards decoded bytes;
   * - native builds read the named file as binary bytes and forward them.
   *
   * TypeScript selects the former when the input has a data: prefix; all other
   * strings are delegated to the injected synchronous filesystem adapter.
   */
  public Load(filename: string): boolean {
    if (filename.startsWith('data:')) {
      const marker = filename.indexOf('base64,');
      const data = filename.substring(marker + 7);
      const bytes = decodeBase64(data);
      return this.LoadBytes(bytes);
    }

    const bytes = this.dependencies.fileLoader.readFileBytes(filename);
    if (!bytes) {
      this.dependencies.logError("File archive '%s' could not be opened.", filename);
      return false;
    }

    return this.LoadBytes(bytes);
  }

  public LoadBytes(bytes: Uint8Array): boolean {
    this.Reset();
    this.m_file = this.dependencies.createZipFile(bytes);
    return true;
  }

  public GetFileList(): string[] {
    const file = this.requireFile();
    const list: string[] = [];
    for (const member of file.infolist()) {
      list.push(member.filename);
    }
    return list;
  }

  public HasFile(filename: string): boolean {
    const file = this.requireFile();
    const fileInfoList: readonly ZipInfoLike[] = file.infolist();
    return fileInfoList.some((info) => info.filename === filename);
  }

  public ReadTextFile(filename: string): string {
    const file = this.requireFile();
    for (const member of file.infolist()) {
      if (member.filename === filename) {
        return file.read(member.filename);
      }
    }

    this.dependencies.logError("No file '%s' to read found in the archive", filename);
    return '';
  }

  private requireFile(): ZipFileLike {
    if (!this.m_file) {
      // C++ uses assert(m_file). Keep the invariant failure explicit in TS.
      throw new Error('ZipFileReader: archive is not loaded');
    }
    return this.m_file;
  }
}

/**
 * Convenience dependency type exported for application adapters.
 */
export type { FileBytesLoader };
