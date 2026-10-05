/**
 * Pure TypeScript translation of Verovio's `Nc` (neume component)
 * (`src-cpp/src/nc.cpp` + `src-cpp/include/vrv/nc.h`).
 *
 * C++ has `Nc` inherit `LayerElement` + `DurationInterface` +
 * `OffsetInterface` + `PitchInterface` + `PositionInterface` + `AttColor` +
 * `AttCurvatureDirection` + `AttIntervalMelodic` + `AttNcForm`; TypeScript
 * models the multiple inheritance with composition.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { DurationInterface } from './durationinterface.js';
import { OffsetInterface } from './offsetinterface.js';
import { PitchInterface } from './pitchinterface.js';
import { PositionInterface } from './positioninterface.js';
import { InstColor } from './atts_shared.js';
import { InstCurvatureDirection } from './atts_visual.js';
import { InstIntervalMelodic } from './atts_analytical.js';
import { InstNcForm } from './atts_neumes.js';
import { ObjectFactory, VrvObject } from './object.js';

/** Nc contract used by `Neume::GetLigatureCount` (pitch/loc access). */
export interface NcLike extends VrvObject {
  GetLigated(): number;
  HasLigated(): boolean;
}

/** Pure TypeScript translation of Verovio's `Nc`. */
export class Nc extends LayerElement {
  private durationInterface: DurationInterface | null = null;
  private offsetInterface: OffsetInterface | null = null;
  private pitchInterface: PitchInterface | null = null;
  private positionInterface: PositionInterface | null = null;
  private attColor: InstColor | null = null;
  private attCurvatureDirection: InstCurvatureDirection | null = null;
  private attIntervalMelodic: InstIntervalMelodic | null = null;
  private attNcForm: InstNcForm | null = null;

  /** Drawing glyphs (std::vector<DrawingGlyph> in C++). */
  public m_drawingGlyphs: any[] = [];

  public constructor() {
    super(ClassId.NC);
    this.ensureComponents();
    this.RegisterInterface(this.durationInterface!.GetAttClasses(), this.durationInterface!.IsInterface());
    this.RegisterInterface(this.offsetInterface!.GetAttClasses(), this.offsetInterface!.IsInterface());
    this.RegisterInterface(this.pitchInterface!.GetAttClasses(), this.pitchInterface!.IsInterface());
    this.RegisterInterface(this.positionInterface!.GetAttClasses(), this.positionInterface!.IsInterface());
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_CURVATUREDIRECTION);
    this.RegisterAttClass(ATT_INTERVALMELODIC);
    this.RegisterAttClass(ATT_NCFORM);
    this.Reset();
  }

  public override GetClassName(): string { return 'nc'; }

  public override Reset(): void {
    super.Reset();
    this.durationInterface?.Reset();
    this.offsetInterface?.Reset();
    this.pitchInterface?.Reset();
    this.positionInterface?.Reset();
    this.attColor?.ResetColor();
    this.attCurvatureDirection?.ResetCurvatureDirection();
    this.attIntervalMelodic?.ResetIntervalMelodic();
    this.attNcForm?.ResetNcForm();
    this.m_drawingGlyphs = [];
  }

  private ensureComponents(): void {
    this.durationInterface ??= new DurationInterface();
    this.offsetInterface ??= new OffsetInterface();
    this.pitchInterface ??= new PitchInterface();
    this.positionInterface ??= new PositionInterface();
    this.attColor ??= new InstColor();
    this.attCurvatureDirection ??= new InstCurvatureDirection();
    this.attIntervalMelodic ??= new InstIntervalMelodic();
    this.attNcForm ??= new InstNcForm();
  }

  public override GetDurationInterface(): DurationInterface | null { return this.durationInterface; }
  public override GetOffsetInterface(): OffsetInterface | null { return this.offsetInterface; }
  public override GetPitchInterface(): PitchInterface | null { return this.pitchInterface; }

  // C++ Nc inherits PitchInterface/PositionInterface; forward like Note.
  public GetPname(): number { return this.pitchInterface!.GetPname(); }
  public SetPname(v: number): void { this.pitchInterface!.SetPname(v); }
  public HasPname(): boolean { return this.pitchInterface!.HasPname(); }
  public GetOct(): number { return this.pitchInterface!.GetOct(); }
  public SetOct(v: number): void { this.pitchInterface!.SetOct(v); }
  public HasOct(): boolean { return this.pitchInterface!.HasOct(); }
  public GetLoc(): number { return this.positionInterface!.GetLoc(); }
  public SetLoc(v: number): void { this.positionInterface!.SetLoc(v); }
  public HasLoc(): boolean { return this.positionInterface!.HasLoc(); }
  public GetDrawingLoc(): number { return this.positionInterface!.GetDrawingLoc(); }
  public SetDrawingLoc(v: number): void { this.positionInterface!.SetDrawingLoc(v); }
  public override GetPositionInterface(): PositionInterface | null { return this.positionInterface; }

  /**
   * Pitch difference to another nc, falling back to the `@loc` difference
   * when the pitch difference is zero and both elements have `@loc`.
   */
  public PitchOrLocDifferenceTo(nc: Nc): number {
    let difference = this.pitchInterface!.PitchDifferenceTo(nc.pitchInterface);
    if (difference === 0 && this.positionInterface!.HasLoc() && nc.positionInterface!.HasLoc()) {
      difference = this.positionInterface!.GetLoc() - nc.positionInterface!.GetLoc();
    }
    return difference;
  }

  //---------//
  // Children //
  //---------//

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [
      ClassId.EPISEMA,
      ClassId.LIQUESCENT,
      ClassId.ORISCUS,
      ClassId.QUILISMA,
      ClassId.STROPHICUS,
      ClassId.UNCLEAR,
    ];
    return supported.includes(classId);
  }

  //-----------//
  // AttColor  //
  //-----------//
  public ResetColor(): void { this.attColor!.ResetColor(); }
  public SetColor(v: string): void { this.attColor!.SetColor(v); }
  public GetColor(): string { return this.attColor!.GetColor(); }
  public HasColor(): boolean { return this.attColor!.HasColor(); }

  //-----------------------//
  // AttCurvatureDirection //
  //-----------------------//
  public ResetCurvatureDirection(): void { this.attCurvatureDirection!.ResetCurvatureDirection(); }
  public SetCurve(v: number): void { this.attCurvatureDirection!.SetCurve(v); }
  public GetCurve(): number { return this.attCurvatureDirection!.GetCurve(); }
  public HasCurve(): boolean { return this.attCurvatureDirection!.HasCurve(); }

  //--------------------//
  // AttIntervalMelodic //
  //--------------------//
  public ResetIntervalMelodic(): void { this.attIntervalMelodic!.ResetIntervalMelodic(); }
  public SetIntm(v: string): void { this.attIntervalMelodic!.SetIntm(v); }
  public GetIntm(): string { return this.attIntervalMelodic!.GetIntm(); }
  public HasIntm(): boolean { return this.attIntervalMelodic!.HasIntm(); }

  //-----------//
  // AttNcForm //
  //-----------//
  public ResetNcForm(): void { this.attNcForm!.ResetNcForm(); }
  // C++ Nc inherits AttNcForm (converters included); TS composes the state.
  // Expose it so AttModule resolves the NCFORM surface here, not on Nc.
  public GetNcForm(): InstNcForm { return this.attNcForm!; }
  public SetAngled(v: number): void { this.attNcForm!.SetAngled(v); }
  public GetAngled(): number { return this.attNcForm!.GetAngled(); }
  public HasAngled(): boolean { return this.attNcForm!.HasAngled(); }
  public SetCon(v: number): void { this.attNcForm!.SetCon(v); }
  public GetCon(): number { return this.attNcForm!.GetCon(); }
  public HasCon(): boolean { return this.attNcForm!.HasCon(); }
  public SetHooked(v: number): void { this.attNcForm!.SetHooked(v); }
  public GetHooked(): number { return this.attNcForm!.GetHooked(); }
  public HasHooked(): boolean { return this.attNcForm!.HasHooked(); }
  public SetLigated(v: number): void { this.attNcForm!.SetLigated(v); }
  public GetLigated(): number { return this.attNcForm!.GetLigated(); }
  public HasLigated(): boolean { return this.attNcForm!.HasLigated(); }
  public SetRellen(v: number): void { this.attNcForm!.SetRellen(v); }
  public GetRellen(): number { return this.attNcForm!.GetRellen(); }
  public HasRellen(): boolean { return this.attNcForm!.HasRellen(); }
  public SetSShape(v: string): void { this.attNcForm!.SetSShape(v); }
  public GetSShape(): string { return this.attNcForm!.GetSShape(); }
  public HasSShape(): boolean { return this.attNcForm!.HasSShape(); }
  public SetTilt(v: number): void { this.attNcForm!.SetTilt(v); }
  public GetTilt(): number { return this.attNcForm!.GetTilt(); }
  public HasTilt(): boolean { return this.attNcForm!.HasTilt(); }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitNc', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitNcEnd', this); }

  public override Clone(): VrvObject {
    const clone = new Nc();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attColor!.HasColor()) clone.attColor!.SetColor(this.attColor!.GetColor());
    if (this.attCurvatureDirection!.HasCurve()) clone.attCurvatureDirection!.SetCurve(this.attCurvatureDirection!.GetCurve());
    if (this.attIntervalMelodic!.HasIntm()) clone.attIntervalMelodic!.SetIntm(this.attIntervalMelodic!.GetIntm());
    if (this.attNcForm!.HasAngled()) clone.attNcForm!.SetAngled(this.attNcForm!.GetAngled());
    if (this.attNcForm!.HasCon()) clone.attNcForm!.SetCon(this.attNcForm!.GetCon());
    if (this.attNcForm!.HasHooked()) clone.attNcForm!.SetHooked(this.attNcForm!.GetHooked());
    if (this.attNcForm!.HasLigated()) clone.attNcForm!.SetLigated(this.attNcForm!.GetLigated());
    if (this.attNcForm!.HasRellen()) clone.attNcForm!.SetRellen(this.attNcForm!.GetRellen());
    if (this.attNcForm!.HasSShape()) clone.attNcForm!.SetSShape(this.attNcForm!.GetSShape());
    if (this.attNcForm!.HasTilt()) clone.attNcForm!.SetTilt(this.attNcForm!.GetTilt());
    clone.m_drawingGlyphs = [...this.m_drawingGlyphs];
    return clone;
  }
}

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_COLOR = 109;
const ATT_CURVATUREDIRECTION = 255;
const ATT_INTERVALMELODIC = 4;
const ATT_NCFORM = 87;

/** C++ FunctorInterface default forwarding helper (VisitNc -> VisitLayerElement -> ... -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('nc', ClassId.NC, () => new Nc());
