import { LayoutInformation } from './vrvdef';

/** Minimal structural contract for the C++ Doc pointer held by I/O bases. */
export interface DocLike {}

/**
 * Base class for output implementations.
 * Mirrors vrv::Output from include/vrv/iobase.h and src/iobase.cpp.
 */
export abstract class Output {
  protected m_doc: DocLike;

  constructor(doc: DocLike, _filename?: string);
  constructor(doc?: DocLike);
  constructor(doc?: DocLike, _filename?: string) {
    if (doc === undefined || doc === null) {
      // The C++ default constructor is empty and leaves m_doc uninitialized.
      // Keep the same externally observable contract while retaining TS safety.
      this.m_doc = undefined as unknown as DocLike;
    } else {
      this.m_doc = doc;
    }
  }

  public abstract Export(): string;

  public WriteObject(_object: unknown): boolean {
    return true;
  }

  public WriteObjectEnd(_object: unknown): boolean {
    return true;
  }

  public Skip(_object: unknown): boolean {
    return false;
  }
}

/**
 * Base class for input implementations.
 * Mirrors vrv::Input from include/vrv/iobase.h and src/iobase.cpp.
 */
export class Input {
  protected m_doc: DocLike;
  protected m_layoutInformation!: LayoutInformation;
  protected m_outformat = 'mei';

  constructor(doc: DocLike) {
    if (doc === undefined || doc === null) {
      throw new Error('Input requires a document');
    }
    this.m_doc = doc;
    this.Init();
  }

  public SetOutputFormat(format: string): void {
    this.m_outformat = format;
  }

  public GetOutputFormat(): string {
    return this.m_outformat;
  }

  public Import(_data: string): boolean {
    return true;
  }

  public GetLayoutInformation(): LayoutInformation {
    return this.m_layoutInformation;
  }

  private Init(): void {
    this.m_layoutInformation = LayoutInformation.LAYOUT_NONE;
  }
}
