/**
 * Pure TypeScript translation of Verovio's `Episema`
 * (`src-cpp/src/episema.cpp` + `src-cpp/include/vrv/episema.h`).
 *
 * C++ has `Episema` inherit `LayerElement` + `OffsetInterface` +
 * `PitchInterface` + `PositionInterface` + `AttColor` + `AttEpisemaVis`;
 * TypeScript models the multiple inheritance with composition.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { OffsetInterface } from './offsetinterface.js';
import { PitchInterface } from './pitchinterface.js';
import { PositionInterface } from './positioninterface.js';
import { InstColor } from './atts_shared.js';
import { InstEpisemaVis } from './atts_visual.js';
import { ObjectFactory, VrvObject } from './object.js';

/** Pure TypeScript translation of Verovio's `Episema`. */
export class Episema extends LayerElement {
  private offsetInterface: OffsetInterface | null = null;
  private pitchInterface: PitchInterface | null = null;
  private positionInterface: PositionInterface | null = null;
  private attColor: InstColor | null = null;
  private attEpisemaVis: InstEpisemaVis | null = null;

  public constructor() {
    super(ClassId.EPISEMA);
    this.ensureComponents();
    this.RegisterInterface(this.offsetInterface!.GetAttClasses(), this.offsetInterface!.IsInterface());
    this.RegisterInterface(this.pitchInterface!.GetAttClasses(), this.pitchInterface!.IsInterface());
    this.RegisterInterface(this.positionInterface!.GetAttClasses(), this.positionInterface!.IsInterface());
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_EPISEMAVIS);
    this.Reset();
  }

  public override GetClassName(): string { return 'episema'; }

  public override Reset(): void {
    super.Reset();
    this.offsetInterface?.Reset();
    this.pitchInterface?.Reset();
    this.positionInterface?.Reset();
    this.attColor?.ResetColor();
    this.attEpisemaVis?.ResetEpisemaVis();
  }

  private ensureComponents(): void {
    this.offsetInterface ??= new OffsetInterface();
    this.pitchInterface ??= new PitchInterface();
    this.positionInterface ??= new PositionInterface();
    this.attColor ??= new InstColor();
    this.attEpisemaVis ??= new InstEpisemaVis();
  }

  public override GetOffsetInterface(): OffsetInterface | null { return this.offsetInterface; }
  public override GetPitchInterface(): PitchInterface | null { return this.pitchInterface; }
  public override GetPositionInterface(): PositionInterface | null { return this.positionInterface; }

  //-----------//
  // AttColor  //
  //-----------//
  public ResetColor(): void { this.attColor!.ResetColor(); }
  public SetColor(v: string): void { this.attColor!.SetColor(v); }
  public GetColor(): string { return this.attColor!.GetColor(); }
  public HasColor(): boolean { return this.attColor!.HasColor(); }

  //----------------//
  // AttEpisemaVis  //
  //----------------//
  public ResetEpisemaVis(): void { this.attEpisemaVis!.ResetEpisemaVis(); }
  public SetForm(v: number): void { this.attEpisemaVis!.SetForm(v); }
  public GetForm(): number { return this.attEpisemaVis!.GetForm(); }
  public HasForm(): boolean { return this.attEpisemaVis!.HasForm(); }
  public SetPlace(v: number): void { this.attEpisemaVis!.SetPlace(v); }
  public GetPlace(): number { return this.attEpisemaVis!.GetPlace(); }
  public HasPlace(): boolean { return this.attEpisemaVis!.HasPlace(); }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitEpisema', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitEpisemaEnd', this); }

  public override Clone(): VrvObject {
    const clone = new Episema();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attColor!.HasColor()) clone.attColor!.SetColor(this.attColor!.GetColor());
    if (this.attEpisemaVis!.HasForm()) clone.attEpisemaVis!.SetForm(this.attEpisemaVis!.GetForm());
    if (this.attEpisemaVis!.HasPlace()) clone.attEpisemaVis!.SetPlace(this.attEpisemaVis!.GetPlace());
    return clone;
  }
}

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_COLOR = 109;
const ATT_EPISEMAVIS = 256;

/** C++ FunctorInterface default forwarding helper (VisitEpisema -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('episema', ClassId.EPISEMA, () => new Episema());
