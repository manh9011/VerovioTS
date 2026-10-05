/**
 * Pure-TypeScript migration of HumAddress from humlib.cpp.
 *
 * The owner is intentionally modeled as a narrow interface because the full
 * HumdrumLine/HumdrumToken hierarchy remains in the humlib migration.
 */
export interface HumdrumTokenLike {
  toString(): string;
}

export interface HumdrumLineLike {
  getLineIndex(): number;
  getTrackStart(track: number): HumdrumTokenLike | null;
}

export class HumAddress {
  private m_fieldindex = -1;
  private m_spining = '';
  private m_track = -1;
  private m_subtrack = -1;
  private m_subtrackcount = 0;
  private m_owner: HumdrumLineLike | null = null;

  constructor(address?: HumAddress) {
    if (address) {
      this.m_fieldindex = address.m_fieldindex;
      this.m_spining = address.m_spining;
      this.m_track = address.m_track;
      this.m_subtrack = address.m_subtrack;
      this.m_subtrackcount = address.m_subtrackcount;
      this.m_owner = address.m_owner;
    }
  }

  /** C++ operator=. */
  assign(address: HumAddress): this {
    this.m_fieldindex = address.m_fieldindex;
    this.m_spining = address.m_spining;
    this.m_track = address.m_track;
    this.m_subtrack = address.m_subtrack;
    this.m_subtrackcount = address.m_subtrackcount;
    this.m_owner = address.m_owner;
    return this;
  }

  /** C++ destructor semantics: restore the default empty/unowned state. */
  dispose(): void {
    this.m_track = -1;
    this.m_subtrack = -1;
    this.m_fieldindex = -1;
    this.m_subtrackcount = 0;
    this.m_owner = null;
  }

  getLineIndex(): number {
    return this.m_owner === null ? -1 : this.m_owner.getLineIndex();
  }

  getLineNumber(): number {
    return this.getLineIndex() + 1;
  }

  getFieldIndex(): number {
    return this.m_fieldindex;
  }

  /** C++ returns a static empty token when there is no valid owner/track start. */
  getDataType(): HumdrumTokenLike {
    if (this.m_owner === null) return EMPTY_TOKEN;
    const token = this.m_owner.getTrackStart(this.getTrack());
    return token === null ? EMPTY_TOKEN : token;
  }

  /** C++ returns a pointer to a static empty token on failure. */
  getExclusiveInterpretation(): HumdrumTokenLike {
    if (this.m_owner === null) return EMPTY_TOKEN;
    const token = this.m_owner.getTrackStart(this.getTrack());
    return token === null ? EMPTY_TOKEN : token;
  }

  getSpineInfo(): string {
    return this.m_spining;
  }

  getTrack(): number {
    return this.m_track;
  }

  getSubtrack(): number {
    if (this.m_subtrackcount === 1) {
      return 0;
    }
    return this.m_subtrack;
  }

  getSubtrackCount(): number {
    return this.m_subtrackcount;
  }

  getTrackString(separator = '.'): string {
    let output = String(this.getTrack());
    const subtrack = this.getSubtrack();
    if (subtrack > 0) {
      output += separator + String(subtrack);
    }
    return output;
  }

  setOwner(line: HumdrumLineLike | null): void {
    this.m_owner = line;
  }

  getLine(): HumdrumLineLike | null {
    return this.m_owner;
  }

  getOwner(): HumdrumLineLike | null {
    return this.getLine();
  }

  hasOwner(): boolean {
    return this.m_owner !== null;
  }

  setFieldIndex(index: number): void {
    this.m_fieldindex = index;
  }

  setSpineInfo(spineinfo: string): void {
    this.m_spining = spineinfo;
  }

  setTrack(track: number, subtrack?: number): void {
    let aTrack = track;
    if (aTrack < 0) aTrack = -1;
    if (aTrack > 1000) aTrack = 1000;
    this.m_track = aTrack;
    if (subtrack !== undefined) this.setSubtrack(subtrack);
  }

  setSubtrack(subtrack: number): void {
    let aSubtrack = subtrack;
    if (aSubtrack < 0) aSubtrack = -1;
    if (aSubtrack > 1000) aSubtrack = 1000;
    this.m_subtrack = aSubtrack;
  }

  setSubtrackCount(count: number): void {
    this.m_subtrackcount = count;
  }
}

const EMPTY_TOKEN: HumdrumTokenLike = Object.freeze({
  toString: () => '',
});
