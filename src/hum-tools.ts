/** External humlib CLI filter tools (filter/kernify/scordatura) have no TS port;
 * no-op stubs preserving call flow. Moved from mocks; real logic pending. */
/**
 * rule-13 mock contract for humlib's external filter/transformation tools:
 * `hum::Tool_filter`, `hum::Tool_kernify`, and `hum::Tool_scordatura`.
 *
 * In Verovio C++, these invoke external command-line filter pipelines
 * (such as `extract`, `scordatura`, `kernify`) compiled alongside the
 * native humlib library. In pure TypeScript (no WASM / no native process
 * runner), these external filter pipelines are mocked under rule 13.
 * No business logic is invented here; each tool exposes the exact C++
 * method surface used by `HumdrumInput::convertHumdrum` (iohumdrum.cpp:718-770).
 */
import type { HumdrumFile, HumdrumFileSet } from './humlib-core.js';

export interface HumToolLike {
  run(infile: HumdrumFile): boolean;
  hasHumdrumText(): boolean;
  getHumdrumText(): string;
}

export class Tool_filter implements HumToolLike {
  private m_text = '';
  public run(_infile: HumdrumFile): boolean { return true; }
  public runUniversal(_infiles: HumdrumFileSet): boolean { return true; }
  public hasHumdrumText(): boolean { return this.m_text !== ''; }
  public getHumdrumText(): string { return this.m_text; }
}

export class Tool_kernify implements HumToolLike {
  private m_text = '';
  public run(_infile: HumdrumFile): boolean { return true; }
  public hasHumdrumText(): boolean { return this.m_text !== ''; }
  public getHumdrumText(): string { return this.m_text; }
}

export class Tool_scordatura implements HumToolLike {
  private m_text = '';
  public process(_argv: string[]): boolean { return true; }
  public run(_infile: HumdrumFile): boolean { return true; }
  public hasHumdrumText(): boolean { return this.m_text !== ''; }
  public getHumdrumText(): string { return this.m_text; }
}
