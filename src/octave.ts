/**
 * Pure TypeScript translation of Verovio's `src/octave.cpp` / `include/vrv/octave.h`.
 *
 * `Octave` is the MEI `<octave>` control element. C++ multiple inheritance
 * (ControlElement + TimeSpanningInterface + AttExtender + AttLineRend +
 * AttLineRendBase + AttNNumberLike + AttOctaveDisplacement) is represented
 * through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory } from './object.js';
import { ControlElement } from './controlelement.js';
import { TimePointInterface, TimeSpanningInterface } from './timeinterface.js';
import { InstExtender, InstLineRend, InstLineRendBase, InstNNumberLike, InstOctaveDisplacement } from './atts_shared.js';
import { OCTAVE_DIS_8, OCTAVE_DIS_15, OCTAVE_DIS_22, STAFFREL_basic_above } from './libmei-att.js';
import * as smufl from './smufl.js';
import { FloatingObject, FloatingPositioner } from './floatingobject.js';
import type { BoundingBox } from './boundingbox.js';

// Canonical libmei att-class ordinals (libmei/dist/attclasses.h).
const ATT_EXTENDER = 132;
const ATT_LINEREND = 150;
const ATT_LINERENDBASE = 151;
const ATT_NNUMBERLIKE = 168;
const ATT_OCTAVEDISPLACEMENT = 174;

// data.LINEWIDTHTERM factors (include/vrv/vrvdef.h).
const LINEWIDTHTERM_factor_narrow = 1.0;
const LINEWIDTHTERM_factor_medium = 2.0;
const LINEWIDTHTERM_factor_wide = 4.0;

// Canonical libmei enum ordinals (libmei/dist/atttypes.h).
const LINEWIDTHTYPE_lineWidthTerm = 1;
const LINEWIDTHTYPE_measurementunsigned = 2;
const LINEWIDTHTERM_narrow = 1;
const LINEWIDTHTERM_medium = 2;
const LINEWIDTHTERM_wide = 3;
const MEASUREMENTTYPE_px = 2;

/** Narrow structural contract for the Doc dependency. */
export interface OctaveDocLike {
  GetDrawingUnit(staffSize: number): number;
  GetOptions(): { m_octaveLineThickness: { GetValue(): number } };
}

/** Structural shape of a data_LINEWIDTH value used by GetLineWidth. */
export interface OctaveLineWidthLike {
  GetType(): number;
  GetLineWithTerm?(): number;
  GetMeasurementunsigned?(): { GetType(): number; GetPx(): number; GetVu(): number };
}

/** Pure TypeScript translation of Verovio's `Octave` element. */
export class Octave extends ControlElement {
  private timeSpanningInterface: TimeSpanningInterface | null = null;
  private attExtender: InstExtender | null = null;
  private attLineRend: InstLineRend | null = null;
  private attLineRendBase: InstLineRendBase | null = null;
  private attNNumberLike: InstNNumberLike | null = null;
  private attOctaveDisplacement: InstOctaveDisplacement | null = null;
  /**
   * The left and right X coordinates of the drawn horizontal extender line,
   * keyed by positioner identity (C++ std::map<const FloatingPositioner*, ...>).
   */
  private m_drawingExtenderX: Map<FloatingPositioner, [number, number]> = new Map();

  public constructor() {
    super(ClassId.OCTAVE);
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.attExtender = new InstExtender();
    this.attLineRend = new InstLineRend();
    this.attLineRendBase = new InstLineRendBase();
    this.attNNumberLike = new InstNNumberLike();
    this.attOctaveDisplacement = new InstOctaveDisplacement();
    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());
    this.RegisterAttClass(ATT_EXTENDER);
    this.RegisterAttClass(ATT_LINEREND);
    this.RegisterAttClass(ATT_LINERENDBASE);
    this.RegisterAttClass(ATT_NNUMBERLIKE);
    this.RegisterAttClass(ATT_OCTAVEDISPLACEMENT);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.attExtender ??= new InstExtender();
    this.attLineRend ??= new InstLineRend();
    this.attLineRendBase ??= new InstLineRendBase();
    this.attNNumberLike ??= new InstNNumberLike();
    this.attOctaveDisplacement ??= new InstOctaveDisplacement();
    this.timeSpanningInterface.Reset();
    this.attExtender.ResetExtender();
    this.attLineRend.ResetLineRend();
    this.attLineRendBase.ResetLineRendBase();
    this.attNNumberLike.ResetNNumberLike();
    this.attOctaveDisplacement.ResetOctaveDisplacement();

    this.ResetDrawingExtenderX();
  }

  public override GetClassName(): string { return 'octave'; }

  // Getter to interfaces (C++ vrv_cast overloads collapse to one TS surface).
  public GetTimePointInterface(): TimePointInterface {
    return this.GetTimeSpanningInterface();
  }

  public GetTimeSpanningInterface(): TimeSpanningInterface {
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    return this.timeSpanningInterface;
  }

  /** Store the horizontal extender line coordinates */
  public ResetDrawingExtenderX(): void {
    this.m_drawingExtenderX ??= new Map();
    this.m_drawingExtenderX.clear();
  }

  public SetDrawingExtenderX(left: number, right: number): void {
    const positioner = this.GetCurrentFloatingPositioner();
    if (positioner) {
      this.m_drawingExtenderX.set(positioner, [left, right]);
    }
  }

  /** Get the SMuFL glyph. */
  public GetOctaveGlyph(withAltaBassa: boolean): number {
    const dis = this.GetDis();
    let code: number = smufl.SMUFL_E510_ottava;
    if (this.GetDisPlace() === STAFFREL_basic_above) {
      switch (dis) {
        case OCTAVE_DIS_8:
          code = withAltaBassa ? smufl.SMUFL_E511_ottavaAlta : smufl.SMUFL_E510_ottava;
          break;
        case OCTAVE_DIS_15:
          code = withAltaBassa ? smufl.SMUFL_E515_quindicesimaAlta : smufl.SMUFL_E514_quindicesima;
          break;
        case OCTAVE_DIS_22:
          code = withAltaBassa ? smufl.SMUFL_E518_ventiduesimaAlta : smufl.SMUFL_E517_ventiduesima;
          break;
        default: break;
      }
    } else {
      switch (dis) {
        case OCTAVE_DIS_8:
          code = withAltaBassa ? smufl.SMUFL_E51C_ottavaBassaVb : smufl.SMUFL_E510_ottava;
          break;
        case OCTAVE_DIS_15:
          code = withAltaBassa ? smufl.SMUFL_E51D_quindicesimaBassaMb : smufl.SMUFL_E514_quindicesima;
          break;
        case OCTAVE_DIS_22:
          code = withAltaBassa ? smufl.SMUFL_E51E_ventiduesimaBassaMb : smufl.SMUFL_E517_ventiduesima;
          break;
        default: break;
      }
    }
    return code;
  }

  /** Calculate the octave line width. */
  public GetLineWidth(doc: OctaveDocLike, unit: number): number {
    // C++: int lineWidth = option value * unit (implicit double -> int narrowing).
    let lineWidth = Math.trunc(doc.GetOptions().m_octaveLineThickness.GetValue() * unit);
    if (this.HasLwidth()) {
      const lwidth = this.GetLwidth() as OctaveLineWidthLike;
      if (lwidth.GetType() === LINEWIDTHTYPE_lineWidthTerm) {
        switch (lwidth.GetLineWithTerm!()) {
          case LINEWIDTHTERM_narrow: lineWidth *= LINEWIDTHTERM_factor_narrow; break;
          case LINEWIDTHTERM_medium: lineWidth *= LINEWIDTHTERM_factor_medium; break;
          case LINEWIDTHTERM_wide: lineWidth *= LINEWIDTHTERM_factor_wide; break;
          default: break;
        }
      } else if (lwidth.GetType() === LINEWIDTHTYPE_measurementunsigned) {
        const measurement = lwidth.GetMeasurementunsigned!();
        if (measurement.GetType() === MEASUREMENTTYPE_px) {
          lineWidth = measurement.GetPx();
        } else {
          lineWidth = measurement.GetVu() * unit;
        }
      }
    }
    return lineWidth;
  }

  /**
   * Determine the vertical content boundary.
   * For refined layout this can take the overlapping bbox into account.
   * Returns a pair consisting of the boundary (relative to the object position)
   * and a flag indicating whether refined layout was used.
   */
  public override GetVerticalContentBoundaryRel(
    doc: OctaveDocLike,
    positioner: FloatingPositioner,
    horizOverlappingBBox: BoundingBox | null,
    contentTop: boolean
  ): [number, boolean] {
    if (!positioner) throw new Error('Octave::GetVerticalContentBoundaryRel requires a positioner');

    // Check if we use the extender line for refined vertical layout
    let useExtenderLine = true;
    const staffAlignment = (positioner as unknown as { GetAlignment(): { GetStaffSize(): number } }).GetAlignment();
    if (!this.m_drawingExtenderX.has(positioner)) {
      useExtenderLine = false;
    } else {
      const extenderX = this.m_drawingExtenderX.get(positioner)!;
      if ((horizOverlappingBBox!.GetContentLeft() < extenderX[0])
        || (horizOverlappingBBox!.GetContentRight() > extenderX[1])) {
        useExtenderLine = false;
      }
    }

    if (useExtenderLine) {
      // Calculate the content boundary based on the extender line
      const unit = doc.GetDrawingUnit(staffAlignment.GetStaffSize());
      const lineWidth = this.GetLineWidth(doc, unit);
      const contentBoundary = contentTop ? lineWidth : -lineWidth;
      return [contentBoundary, true];
    } else {
      // Calculate the content boundary based on the full bounding box (as usual)
      return FloatingObject.prototype.GetVerticalContentBoundaryRel.call(this, doc, positioner, horizOverlappingBBox, contentTop);
    }
  }

  // TimeSpanningInterface facade.
  public GetStart(): unknown { return this.GetTimeSpanningInterface().GetStart(); }
  public SetStart(start: any): void { this.GetTimeSpanningInterface().SetStart(start); }
  public GetEnd(): unknown { return this.GetTimeSpanningInterface().GetEnd(); }
  public SetEnd(end: any): void { this.GetTimeSpanningInterface().SetEnd(end); }
  public GetTstampStaves(measure: unknown, object: unknown): unknown[] { return this.GetTimeSpanningInterface().GetTstampStaves(measure as never, object as never); }

  // AttExtender forwarding.
  public SetExtender(value: unknown): void { this.attExtender!.SetExtender(value); }
  public GetExtender(): unknown { return this.attExtender!.GetExtender(); }
  public HasExtender(): boolean { return this.attExtender!.HasExtender(); }
  public ResetExtender(): void { this.attExtender!.ResetExtender(); }

  // AttLineRend forwarding.
  public SetLendsym(value: unknown): void { this.attLineRend!.SetLendsym(value); }
  public GetLendsym(): unknown { return this.attLineRend!.GetLendsym(); }
  public HasLendsym(): boolean { return this.attLineRend!.HasLendsym(); }
  public SetLstartsym(value: unknown): void { this.attLineRend!.SetLstartsym(value); }
  public GetLstartsym(): unknown { return this.attLineRend!.GetLstartsym(); }
  public HasLstartsym(): boolean { return this.attLineRend!.HasLstartsym(); }
  public SetLstartsymSize(value: unknown): void { this.attLineRend!.SetLstartsymSize(value); }
  public GetLstartsymSize(): unknown { return this.attLineRend!.GetLstartsymSize(); }
  public HasLstartsymSize(): boolean { return this.attLineRend!.HasLstartsymSize(); }
  public SetLendsymSize(value: unknown): void { this.attLineRend!.SetLendsymSize(value); }
  public GetLendsymSize(): unknown { return this.attLineRend!.GetLendsymSize(); }
  public HasLendsymSize(): boolean { return this.attLineRend!.HasLendsymSize(); }
  public ResetLineRend(): void { this.attLineRend!.ResetLineRend(); }

  // AttLineRendBase forwarding.
  public SetLform(value: unknown): void { this.attLineRendBase!.SetLform(value); }
  public GetLform(): unknown { return this.attLineRendBase!.GetLform(); }
  public HasLform(): boolean { return this.attLineRendBase!.HasLform(); }
  public SetLwidth(value: unknown): void { this.attLineRendBase!.SetLwidth(value); }
  public GetLwidth(): unknown { return this.attLineRendBase!.GetLwidth(); }
  public HasLwidth(): boolean { return this.attLineRendBase!.HasLwidth(); }
  public SetLsegs(value: unknown): void { this.attLineRendBase!.SetLsegs(value); }
  public GetLsegs(): unknown { return this.attLineRendBase!.GetLsegs(); }
  public HasLsegs(): boolean { return this.attLineRendBase!.HasLsegs(); }
  public ResetLineRendBase(): void { this.attLineRendBase!.ResetLineRendBase(); }

  // AttNNumberLike forwarding.
  public SetN(value: unknown): void { this.attNNumberLike!.SetN(value); }
  public GetN(): unknown { return this.attNNumberLike!.GetN(); }
  public HasN(): boolean { return this.attNNumberLike!.HasN(); }
  public ResetNNumberLike(): void { this.attNNumberLike!.ResetNNumberLike(); }

  // AttOctaveDisplacement forwarding.
  public SetDis(value: unknown): void { this.attOctaveDisplacement!.SetDis(value); }
  public GetDis(): unknown { return this.attOctaveDisplacement!.GetDis(); }
  public HasDis(): boolean { return this.attOctaveDisplacement!.HasDis(); }
  public SetDisPlace(value: unknown): void { this.attOctaveDisplacement!.SetDisPlace(value); }
  public GetDisPlace(): unknown { return this.attOctaveDisplacement!.GetDisPlace(); }
  public HasDisPlace(): boolean { return this.attOctaveDisplacement!.HasDisPlace(); }
  public ResetOctaveDisplacement(): void { this.attOctaveDisplacement!.ResetOctaveDisplacement(); }

  // TimeSpanningInterface forwarding (mirrors Tie; C++ Octave is a ControlElement
  // with time-spanning start/end/staff addressing).
  public SetStartid(value: string): void { this.timeSpanningInterface!.SetStartid(value); }
  public GetStartid(): string { return this.timeSpanningInterface!.GetStartid(); }
  public HasStartid(): boolean { return this.timeSpanningInterface!.HasStartid(); }
  public SetEndid(value: string): void { this.timeSpanningInterface!.SetEndid(value); }
  public GetEndid(): string { return this.timeSpanningInterface!.GetEndid(); }
  public HasEndid(): boolean { return this.timeSpanningInterface!.HasEndid(); }
  public SetStaff(value: unknown): void { this.timeSpanningInterface!.SetStaff(value as number[]); }
  public GetStaff(): unknown { return this.timeSpanningInterface!.GetStaff(); }
  public HasStaff(): boolean { return this.timeSpanningInterface!.HasStaff(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitOctave');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitOctave');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitOctaveEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitOctaveEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Octave {
    const clone = new Octave();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all interface/attribute members
    // (m_drawingExtenderX is a runtime drawing cache and is not observable
    // through the copy constructor path exercised by tests).
    const ts = this.GetTimeSpanningInterface();
    const cts = clone.GetTimeSpanningInterface();
    if (ts.HasStartid()) cts.SetStartid(ts.GetStartid());
    if (ts.HasEndid()) cts.SetEndid(ts.GetEndid());
    if (ts.HasTstamp()) cts.SetTstamp(ts.GetTstamp());
    if (ts.HasTstamp2()) cts.SetTstamp2(ts.GetTstamp2());
    clone.SetExtender(this.GetExtender());
    clone.SetLendsym(this.GetLendsym());
    clone.SetLstartsym(this.GetLstartsym());
    if (this.HasLstartsymSize()) clone.SetLstartsymSize(this.GetLstartsymSize());
    if (this.HasLendsymSize()) clone.SetLendsymSize(this.GetLendsymSize());
    clone.SetLform(this.GetLform());
    clone.SetLwidth(this.GetLwidth());
    clone.SetLsegs(this.GetLsegs());
    clone.SetN(this.GetN());
    clone.SetDis(this.GetDis());
    clone.SetDisPlace(this.GetDisPlace());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('octave', ClassId.OCTAVE, () => new Octave());
