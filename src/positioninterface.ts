/** Pure TypeScript translation of Verovio's PositionInterface. */
import { AttClassId, FunctorCode, InterfaceId } from './vrvdef.js';
import { Interface } from './interface.js';
import { PitchInterface, data_OCTAVE, data_PITCHNAME, MEI_UNSET_OCT, PITCHNAME_NONE } from './pitchinterface.js';

export const MEI_UNSET = -0x7FFFFFFF;

// libmei AttStaffLoc / AttStaffLocPitched default state mirrors atts_shared.cpp.
export class StaffLocAttributes {
  private m_loc = MEI_UNSET;
  ResetStaffLoc(): void { this.m_loc = MEI_UNSET; }
  SetLoc(value: number): void { this.m_loc = value; }
  GetLoc(): number { return this.m_loc; }
  HasLoc(): boolean { return this.m_loc !== MEI_UNSET; }
}

export class StaffLocPitchedAttributes {
  private m_ploc: data_PITCHNAME = PITCHNAME_NONE;
  private m_oloc: data_OCTAVE = MEI_UNSET_OCT;
  ResetStaffLocPitched(): void { this.m_ploc = PITCHNAME_NONE; this.m_oloc = MEI_UNSET_OCT; }
  SetPloc(value: data_PITCHNAME): void { this.m_ploc = value; }
  GetPloc(): data_PITCHNAME { return this.m_ploc; }
  HasPloc(): boolean { return this.m_ploc !== PITCHNAME_NONE; }
  SetOloc(value: data_OCTAVE): void { this.m_oloc = value; }
  GetOloc(): data_OCTAVE { return this.m_oloc; }
  HasOloc(): boolean { return this.m_oloc !== MEI_UNSET_OCT; }
}

export interface LayerForPositionLike {
  GetClefLocOffset(element: LayerElementForPositionLike | null): number;
}

export interface LayerElementForPositionLike {}

export interface StaffForPositionLike {
  IsTabLuteFrench(): boolean;
  IsTabLuteGerman(): boolean;
  IsTabLuteItalian(): boolean;
  readonly m_drawingLines: number;
}

export interface ResetDataFunctorLike {}
export interface ResetHorizontalAlignmentFunctorLike {}

export const ATT_STAFFLOC: AttClassId = 205;
export const ATT_STAFFLOCPITCHED: AttClassId = 206;

export class PositionInterface extends Interface {
  private readonly staffLoc = new StaffLocAttributes();
  private readonly staffLocPitched = new StaffLocPitchedAttributes();
  private m_drawingLoc = 0;

  constructor() {
    super();
    this.RegisterInterfaceAttClass(ATT_STAFFLOC);
    this.RegisterInterfaceAttClass(ATT_STAFFLOCPITCHED);
    this.Reset();
  }

  override Reset(): void {
    this.staffLoc.ResetStaffLoc();
    this.staffLocPitched.ResetStaffLocPitched();
    this.m_drawingLoc = 0;
  }

  override IsInterface(): InterfaceId { return InterfaceId.INTERFACE_POSITION; }

  SetLoc(value: number): void { this.staffLoc.SetLoc(value); }
  GetLoc(): number { return this.staffLoc.GetLoc(); }
  HasLoc(): boolean { return this.staffLoc.HasLoc(); }
  ResetStaffLoc(): void { this.staffLoc.ResetStaffLoc(); }

  SetPloc(value: data_PITCHNAME): void { this.staffLocPitched.SetPloc(value); }
  GetPloc(): data_PITCHNAME { return this.staffLocPitched.GetPloc(); }
  HasPloc(): boolean { return this.staffLocPitched.HasPloc(); }
  SetOloc(value: data_OCTAVE): void { this.staffLocPitched.SetOloc(value); }
  GetOloc(): data_OCTAVE { return this.staffLocPitched.GetOloc(); }
  HasOloc(): boolean { return this.staffLocPitched.HasOloc(); }
  ResetStaffLocPitched(): void { this.staffLocPitched.ResetStaffLocPitched(); }

  SetDrawingLoc(drawingLoc: number): void { this.m_drawingLoc = drawingLoc; }
  GetDrawingLoc(): number { return this.m_drawingLoc; }

  CalcDrawingLoc(layer: LayerForPositionLike | null, element: LayerElementForPositionLike | null): number {
    if (!layer) throw new Error('PositionInterface::CalcDrawingLoc: layer is required');
    this.m_drawingLoc = 0;
    if (this.HasPloc() && this.HasOloc()) {
      this.m_drawingLoc = PitchInterface.CalcLoc(this.GetPloc(), this.GetOloc(), layer.GetClefLocOffset(element));
    } else if (this.HasLoc()) {
      this.m_drawingLoc = this.GetLoc();
    }
    return this.m_drawingLoc;
  }

  HasIdenticalPositionInterface(other: PositionInterface | null): boolean {
    if (!other) return false;
    if (this.GetLoc() !== other.GetLoc()) return false;
    if (this.GetOloc() !== other.GetOloc()) return false;
    if (this.GetPloc() !== other.GetPloc()) return false;
    return true;
  }

  HasLedgerLines(linesAboveRef: { value: number } | any, linesBelowRef: { value: number } | any, staff: StaffForPositionLike | any): boolean {
    if (!staff) return false;

    if (staff.IsTabLuteFrench?.() || staff.IsTabLuteGerman?.() || staff.IsTabLuteItalian?.()) {
      if (typeof linesAboveRef === 'object' && linesAboveRef !== null) linesAboveRef.value = 0;
      if (typeof linesBelowRef === 'object' && linesBelowRef !== null) linesBelowRef.value = 0;
      return false;
    }

    const lines = typeof staff.m_drawingLines === 'number' ? staff.m_drawingLines : 5;
    // C++ computes in 32-bit int (wraps on overflow, e.g. lines == VRV_UNSET);
    // replicate with | 0 so UNSET lines yield the same small wrapped counts.
    const loc = this.GetDrawingLoc() | 0;
    let linesAbove = Math.trunc((((loc - Math.imul(lines, 2)) | 0) + 2 | 0) / 2);
    let linesBelow = Math.trunc((-loc | 0) / 2);

    linesAbove = Math.max(linesAbove, 0);
    linesBelow = Math.max(linesBelow, 0);
    if (typeof linesAboveRef === 'object' && linesAboveRef !== null) linesAboveRef.value = linesAbove;
    if (typeof linesBelowRef === 'object' && linesBelowRef !== null) linesBelowRef.value = linesBelow;

    return (linesAbove > 0) || (linesBelow > 0);
  }

  InterfaceResetData(_functor: ResetDataFunctorLike, _object: unknown): FunctorCode {
    this.m_drawingLoc = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  InterfaceResetHorizontalAlignment(_functor: ResetHorizontalAlignmentFunctorLike, _object: unknown): FunctorCode {
    this.m_drawingLoc = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
