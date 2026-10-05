/**
 * Pure TypeScript translation of Verovio's `src/mrest.cpp` /
 * `include/vrv/mrest.h`.
 *
 * `MRest` models the MEI `<mRest>` (measure rest) element.
 *
 * C++ multiple inheritance (LayerElement + OffsetInterface + PositionInterface
 * + AttColor + AttCue + AttCutout + AttFermataPresent + AttVisibility) is
 * represented through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, VrvObject } from './object.js';
import { OffsetInterface } from './offsetinterface.js';
import { PositionInterface } from './positioninterface.js';
import { InstColor, InstCue, InstFermataPresent, InstVisibility } from './atts_shared.js';
import { InstCutout } from './atts_cmn.js';
import { PitchInterface } from './pitchinterface.js';
import { Rest } from './rest.js';

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_COLOR = 109;
const ATT_CUE = 116;
const ATT_CUTOUT = 18;
const ATT_FERMATAPRESENT = 134;
const ATT_VISIBILITY = 228;

/** Structural contract for the `Layer` collaborator. */
export interface MRestLayerLike {
  GetN(): number;
  GetLayerElementsForTimeSpanOf(element: unknown, withinMeasure?: boolean): VrvObject[];
}

/** Structural contract for the ancestor `Staff` of the mRest. */
export interface MRestStaffLike {
  GetN(): number;
  GetChildCount(classId: ClassId): number;
  FindAllDescendantsByType(classId: ClassId, continueDepthSearchForMatches: boolean): VrvObject[];
}

/**
 * Pure TypeScript translation of Verovio's `MRest`.
 */
export class MRest extends LayerElement {
  // TS constructor-phase virtual Reset() dispatch runs before field
  // initializers (established adaptation): interfaces and att components are
  // optional and lazily created on first Reset() so the observable C++
  // construction ordering is preserved.
  private offsetInterface?: OffsetInterface;
  private positionInterface?: PositionInterface;
  private color?: InstColor;
  private cue?: InstCue;
  private cutout?: InstCutout;
  private fermataPresent?: InstFermataPresent;
  private visibility?: InstVisibility;

  public constructor() {
    super(ClassId.MREST);
    this.ensureAttributes();
    this.RegisterInterface(this.offsetInterface!.GetAttClasses(), this.offsetInterface!.IsInterface());
    this.RegisterInterface(this.positionInterface!.GetAttClasses(), this.positionInterface!.IsInterface());
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_CUE);
    this.RegisterAttClass(ATT_CUTOUT);
    this.RegisterAttClass(ATT_FERMATAPRESENT);
    this.RegisterAttClass(ATT_VISIBILITY);
    this.Reset();
  }

  private ensureAttributes(): void {
    this.offsetInterface ??= new OffsetInterface();
    this.positionInterface ??= new PositionInterface();
    this.color ??= new InstColor();
    this.cue ??= new InstCue();
    this.cutout ??= new InstCutout();
    this.fermataPresent ??= new InstFermataPresent();
    this.visibility ??= new InstVisibility();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.offsetInterface!.Reset();
    this.positionInterface!.Reset();
    this.color!.ResetColor();
    this.cue!.ResetCue();
    this.cutout!.ResetCutout();
    this.fermataPresent!.ResetFermataPresent();
    this.visibility!.ResetVisibility();
  }

  public override Clone(): VrvObject {
    const clone = new MRest();
    clone.AssignFrom(this);
    // Interface composition members hold external attribute state that is
    // copied explicitly (C++ copy-constructor parity).
    if (this.HasHo()) clone.SetHo(this.GetHo());
    if (this.HasVo()) clone.SetVo(this.GetVo());
    if (this.HasPloc()) clone.SetPloc(this.GetPloc());
    if (this.HasOloc()) clone.SetOloc(this.GetOloc());
    if (this.HasLoc()) clone.SetLoc(this.GetLoc());
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasCue()) clone.SetCue(this.GetCue());
    if (this.HasCutout()) clone.SetCutout(this.GetCutout());
    if (this.HasFermata()) clone.SetFermata(this.GetFermata());
    if (this.HasVisible()) clone.SetVisible(this.GetVisible());
    return clone;
  }

  public override GetClassName(): string { return 'mRest'; }

  public override GetOffsetInterface(): OffsetInterface | null {
    this.ensureAttributes();
    return this.offsetInterface!;
  }

  public override GetPositionInterface(): PositionInterface | null {
    this.ensureAttributes();
    return this.positionInterface!;
  }

  /**
   * Get the vertical location for mRest considering other layer elements.
   */
  public GetOptimalLayerLocation(layer: MRestLayerLike | null, defaultLocation: number): number {
    if (!layer) return defaultLocation;
    const parentStaff = this.GetAncestorStaff() as unknown as MRestStaffLike | null;
    if (!parentStaff) return defaultLocation;

    // handle rest positioning for 2 layers. 3 layers and more are much more complex to solve
    if (parentStaff.GetChildCount(ClassId.LAYER) !== 2) return defaultLocation;

    const layers = parentStaff.FindAllDescendantsByType(ClassId.LAYER, false);
    const firstLayer = layers[0] as unknown as MRestLayerLike;
    const isTopLayer = firstLayer.GetN() === layer.GetN();

    const otherLayer = (isTopLayer ? layers[layers.length - 1] : layers[0]) as unknown as MRestLayerLike;
    const collidingElementsList = otherLayer.GetLayerElementsForTimeSpanOf(this);

    // find all locations for other layer
    const locations: number[] = [];
    for (const element of collidingElementsList) {
      if (element.IsAnyOf([ClassId.CHORD, ClassId.NOTE] as unknown as number[])) {
        const layerElement = element as unknown as never; // LayerElementLike via the static helper
        const loc = PitchInterface.CalcLoc(layerElement, layer as unknown as never as never, layerElement, isTopLayer);
        locations.push(loc);
      }
      else if (element.Is(ClassId.REST)) {
        const rest = element as unknown as Rest;
        locations.push(rest.GetDrawingLoc());
      }
      else if (element.Is(ClassId.MREST)) {
        locations.push(4);
      }
    }
    // if there are no other elements - just return default location
    if (locations.length === 0) return defaultLocation;

    const locAdjust = isTopLayer ? 4 : -3;
    let extremePoint = isTopLayer
      ? Math.max(...locations)
      : Math.min(...locations);
    extremePoint += locAdjust;
    if (extremePoint % 2 !== 0) {
      extremePoint += isTopLayer ? 1 : -1;
    }
    // Make sure that lower layer don't go above centre, and vice versa for upper layer.
    // Hardcoded, so for the time being this is going to properly adjust mRests only on the 5-line staves
    if (isTopLayer && (extremePoint < 6)) {
      extremePoint = 6;
    }
    else if (!isTopLayer && (extremePoint > 4)) {
      extremePoint = 4;
    }

    return extremePoint;
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitMRest');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitMRestEnd');
  }

  private visit(functor: unknown, method: string): FunctorCode {
    const f = functor as Record<string, unknown>;
    const fn = f[method];
    if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, this);
    if (typeof f['VisitObject'] === 'function') {
      return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  //---------//
  // OffsetInterface facade
  //---------//
  public SetHo(value: number): void { this.offsetInterface!.SetHo(value); }
  public GetHo(): number { return this.offsetInterface!.GetHo(); }
  public HasHo(): boolean { return this.offsetInterface!.HasHo(); }
  public SetVo(value: number): void { this.offsetInterface!.SetVo(value); }
  public GetVo(): number { return this.offsetInterface!.GetVo(); }
  public HasVo(): boolean { return this.offsetInterface!.HasVo(); }

  //---------//
  // PositionInterface facade
  //---------//
  public SetPloc(value: number): void { this.positionInterface!.SetPloc(value); }
  public GetPloc(): number { return this.positionInterface!.GetPloc(); }
  public HasPloc(): boolean { return this.positionInterface!.HasPloc(); }
  public SetOloc(value: number): void { this.positionInterface!.SetOloc(value); }
  public GetOloc(): number { return this.positionInterface!.GetOloc(); }
  public HasOloc(): boolean { return this.positionInterface!.HasOloc(); }
  public SetLoc(value: number): void { this.positionInterface!.SetLoc(value); }
  public GetLoc(): number { return this.positionInterface!.GetLoc(); }
  public HasLoc(): boolean { return this.positionInterface!.HasLoc(); }
  public SetDrawingLoc(value: number): void { this.positionInterface!.SetDrawingLoc(value); }
  public GetDrawingLoc(): number { return this.positionInterface!.GetDrawingLoc(); }
  public CalcDrawingLoc(layer: unknown, element: unknown): number { return this.positionInterface!.CalcDrawingLoc(layer as never, element as never); }
  public HasLedgerLines(above: unknown, below: unknown, staff: unknown): boolean { return this.positionInterface!.HasLedgerLines(above, below, staff); }

  //---------//
  // Attribute forwarding surfaces
  //---------//
  public ResetColor(): void { this.color!.ResetColor(); }
  public SetColor(value: string): void { this.color!.SetColor(value); }
  public GetColor(): string { return this.color!.GetColor(); }
  public HasColor(): boolean { return this.color!.GetColor() !== ''; }

  public ResetCue(): void { this.cue!.ResetCue(); }
  public SetCue(value: number): void { this.cue!.SetCue(value); }
  public GetCue(): number { return this.cue!.GetCue(); }
  public HasCue(): boolean { return this.cue!.HasCue(); }

  public ResetCutout(): void { this.cutout!.ResetCutout(); }
  public SetCutout(value: number): void { this.cutout!.SetCutout(value); }
  public GetCutout(): number { return this.cutout!.GetCutout(); }
  public HasCutout(): boolean { return this.cutout!.HasCutout(); }

  public ResetFermataPresent(): void { this.fermataPresent!.ResetFermataPresent(); }
  public SetFermata(value: number): void { this.fermataPresent!.SetFermata(value); }
  public GetFermata(): number { return this.fermataPresent!.GetFermata(); }
  public HasFermata(): boolean { return this.fermataPresent!.HasFermata(); }

  public ResetVisibility(): void { this.visibility!.ResetVisibility(); }
  public SetVisible(value: number): void { this.visibility!.SetVisible(value); }
  public GetVisible(): number { return this.visibility!.GetVisible(); }
  public HasVisible(): boolean { return this.visibility!.HasVisible(); }
}

// Factory registration (C++ `ClassRegistrar<MRest> s_factory("mRest", MREST)`).
ObjectFactory.GetInstance().Register('mRest', ClassId.MREST, () => new MRest());
