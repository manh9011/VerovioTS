/**
 * Pure-TypeScript migration of humlib's HumTool output/error surface.
 * Options parsing remains an explicit contract until Options is migrated.
 */
export interface HumToolOptionsContract {
  hasParseError(): boolean;
  getParseError(): string;
}

export class HumToolOptionsMock implements HumToolOptionsContract {
  private parseError = '';
  setParseError(message: string): void { this.parseError = message; }
  hasParseError(): boolean { return this.parseError.length > 0; }
  getParseError(): string { return this.parseError; }
}

export class HumTool implements HumToolOptionsContract {
  protected m_humdrum_text = '';
  protected m_json_text = '';
  protected m_free_text = '';
  protected m_warning_text = '';
  protected m_error_text = '';
  protected m_suppress = false;

  private readonly options: HumToolOptionsContract;

  constructor(options: HumToolOptionsContract = new HumToolOptionsMock()) {
    this.options = options;
  }

  protected append(target: 'humdrum' | 'json' | 'free' | 'warning' | 'error', text: string): void {
    switch (target) {
      case 'humdrum': this.m_humdrum_text += text; break;
      case 'json': this.m_json_text += text; break;
      case 'free': this.m_free_text += text; break;
      case 'warning': this.m_warning_text += text; break;
      case 'error': this.m_error_text += text; break;
    }
  }

  clearOutput(): void {
    this.m_humdrum_text = '';
    this.m_json_text = '';
    this.m_free_text = '';
    this.m_warning_text = '';
    this.m_error_text = '';
  }

  hasAnyText(): boolean {
    if (this.m_suppress) return true;
    return this.m_humdrum_text.length > 0 || this.m_free_text.length > 0 || this.m_json_text.length > 0;
  }

  getAllText(): string {
    return this.m_humdrum_text + this.m_json_text + this.m_free_text;
  }

  hasHumdrumText(): boolean { return this.m_humdrum_text.length > 0; }
  getHumdrumText(): string { return this.m_humdrum_text; }
  suppressHumdrumFileOutput(): void { this.m_suppress = true; }

  hasJsonText(): boolean { return this.m_json_text.length > 0; }
  getJsonText(): string { return this.m_json_text; }

  hasFreeText(): boolean { return this.m_free_text.length > 0; }
  getFreeText(): string { return this.m_free_text; }

  hasWarning(): boolean { return this.m_warning_text.length > 0; }
  getWarning(): string { return this.m_warning_text; }

  hasParseError(): boolean { return this.options.hasParseError(); }
  getParseError(): string { return this.options.getParseError(); }

  hasError(): boolean {
    if (this.hasParseError()) return true;
    return this.m_error_text.length > 0;
  }

  getError(): string { return this.getParseError() + this.m_error_text; }

  setError(message: string): void { this.m_error_text += `${message}\n`; }

  /** Explicit output hooks replace direct std::stringstream insertion. */
  writeHumdrum(text: string): void { this.append('humdrum', text); }
  writeJson(text: string): void { this.append('json', text); }
  writeFree(text: string): void { this.append('free', text); }
  writeWarning(text: string): void { this.append('warning', text); }
}
