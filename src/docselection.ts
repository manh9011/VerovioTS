import { ClassIdLike, VRV_UNSET } from './core-types';
import { LogWarning } from './vrv.js';

export interface DocSelectionDocument {
  m_selectionStart: string;
  m_selectionEnd: string;
  FindAllDescendantsByType(classId: ClassIdLike, continueDepthSearchForMatches?: boolean): DocSelectionObject[];
}

export interface DocSelectionObject {
  GetID(): string;
}

/** Direct TypeScript translation of verovio::DocSelection. */
export class DocSelection {
  public m_selectionStart = '';
  public m_selectionEnd = '';
  public m_selectionRangeStart = VRV_UNSET;
  public m_selectionRangeEnd = VRV_UNSET;
  public m_measureRange = '';
  public m_isPending = false;

  public Parse(selection: string): boolean {
    this.m_isPending = true;
    this.m_selectionStart = '';
    this.m_selectionEnd = '';
    this.m_selectionRangeStart = VRV_UNSET;
    this.m_selectionRangeEnd = VRV_UNSET;
    this.m_measureRange = '';

    if (selection.length === 0) return true;

    let json: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(selection);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('selection is not an object');
      json = parsed as Record<string, unknown>;
    } catch {
      LogWarning('Cannot parse JSON string. No selection set.');
      return false;
    }

    const hasString = (key: string): boolean => typeof json[key] === 'string';
    if (!hasString('start') && !hasString('end') && !hasString('measureRange')) {
      LogWarning('Cannot extract a selection.');
      return false;
    }

    if (hasString('measureRange')) {
      this.m_measureRange = json.measureRange as string;
      if (this.m_measureRange === 'all') {
        this.m_selectionRangeStart = -1;
        this.m_selectionRangeEnd = -1;
      } else if (this.m_measureRange.includes('-')) {
        const pos = this.m_measureRange.indexOf('-');
        let startRange = this.m_measureRange.substring(0, pos);
        let endRange = this.m_measureRange.substring(pos + 1);
        if (startRange === 'start') {
          this.m_selectionRangeStart = -1;
        } else {
          startRange = startRange.replace(/[^0-9]/g, '');
          if (startRange.length > 0) this.m_selectionRangeStart = Number.parseInt(startRange, 10);
        }
        if (endRange === 'end') {
          this.m_selectionRangeEnd = -1;
        } else {
          endRange = endRange.replace(/[^0-9]/g, '');
          if (endRange.length > 0) this.m_selectionRangeEnd = Number.parseInt(endRange, 10);
        }
      } else {
        const measureRangeInt = this.m_measureRange.replace(/[^0-9]/g, '');
        if (measureRangeInt.length > 0) this.m_selectionRangeStart = Number.parseInt(measureRangeInt, 10);
        this.m_selectionRangeEnd = this.m_selectionRangeStart;
      }

      if (this.m_selectionRangeStart === VRV_UNSET || this.m_selectionRangeEnd === VRV_UNSET
        || (this.m_selectionRangeEnd !== -1 && this.m_selectionRangeStart > this.m_selectionRangeEnd)) {
        LogWarning("Selection 'measureRange' could not be parsed. No selection set.");
        this.m_selectionRangeStart = VRV_UNSET;
        this.m_selectionRangeEnd = VRV_UNSET;
        return false;
      }
    } else {
      if (!hasString('start') || !hasString('end')) {
        LogWarning("Selection requires 'start' and 'end'. No selection set.");
        return false;
      }
      this.m_selectionStart = json.start as string;
      this.m_selectionEnd = json.end as string;
    }
    return true;
  }

  public Set(doc: DocSelectionDocument): void {
    if (!doc) throw new Error('DocSelection.Set requires a document');

    this.m_isPending = false;
    doc.m_selectionStart = '';
    doc.m_selectionEnd = '';

    if (this.m_selectionRangeStart !== VRV_UNSET) {
      let selectionStartId = '';
      let selectionEndId = '';
      const measures = doc.FindAllDescendantsByType(this.getMeasureClassId(), false);

      if (measures.length === 0) {
        LogWarning(`No measure found for selection '${this.m_measureRange}'.`);
        return;
      }

      if (this.m_selectionRangeStart === -1) {
        selectionStartId = measures[0].GetID();
      } else if (this.m_selectionRangeStart > 0 && this.m_selectionRangeStart <= measures.length) {
        selectionStartId = measures[this.m_selectionRangeStart - 1].GetID();
      } else {
        LogWarning(`Measure range start for selection '${this.m_measureRange}' could not be found.`);
        return;
      }

      if (this.m_selectionRangeEnd === -1) {
        selectionEndId = measures[measures.length - 1].GetID();
      } else if (this.m_selectionRangeEnd > 0 && this.m_selectionRangeEnd <= measures.length) {
        selectionEndId = measures[this.m_selectionRangeEnd - 1].GetID();
      } else {
        LogWarning(`Measure range end for selection '${this.m_measureRange}' could not be found.`);
        return;
      }
      doc.m_selectionStart = selectionStartId;
      doc.m_selectionEnd = selectionEndId;
    } else {
      doc.m_selectionStart = this.m_selectionStart;
      doc.m_selectionEnd = this.m_selectionEnd;
    }
  }

  private getMeasureClassId(): number {
    // ClassId::MEASURE is 22 in the current ClassId table; keep this local until vrvdef.ts is ported.
    return 22;
  }
}
