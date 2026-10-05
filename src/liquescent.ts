/**
 * Pure TypeScript translation of Verovio's `Liquescent`
 * (`src-cpp/src/liquescent.cpp` + `src-cpp/include/vrv/liquescent.h`).
 *
 * C++ has `Liquescent` inherit `LayerElement` + `OffsetInterface` +
 * `PitchInterface` + `PositionInterface` + `AttColor`; TypeScript models the
 * multiple inheritance with composition.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { OffsetInterface } from './offsetinterface.js';
import { PitchInterface } from './pitchinterface.js';
import { PositionInterface } from './positioninterface.js';
import { InstColor } from './atts_shared.js';
import { ObjectFactory, VrvObject } from './object.js';

/** Pure TypeScript translation of Verovio's `Liquescent`. */
export class Liquescent extends LayerElement {
  private offsetInterface: OffsetInterface | null = null;
  private pitchInterface: PitchInterface | null = null;
  private positionInterface: PositionInterface | null = null;
  private attColor: InstColor | null = null;

  public constructor() {
    super(ClassId.LIQUESCENT);
    this.ensureComponents();
    this.RegisterInterface(this.offsetInterface!.GetAttClasses(), this.offsetInterface!.IsInterface());
    this.RegisterInterface(this.pitchInterface!.GetAttClasses(), this.pitchInterface!.IsInterface());
    this.RegisterInterface(this.positionInterface!.GetAttClasses(), this.positionInterface!.IsInterface());
    this.RegisterAttClass(ATT_COLOR);
    this.Reset();
  }

  public override GetClassName(): string { return 'liquescent'; }

  public override Reset(): void {
    super.Reset();
    this.offsetInterface?.Reset();
    this.pitchInterface?.Reset();
    this.positionInterface?.Reset();
    this.attColor?.ResetColor();
  }

  private ensureComponents(): void {
    this.offsetInterface ??= new OffsetInterface();
    this.pitchInterface ??= new PitchInterface();
    this.positionInterface ??= new PositionInterface();
    this.attColor ??= new InstColor();
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

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitLiquescent', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitLiquescentEnd', this); }

  public override Clone(): VrvObject {
    const clone = new Liquescent();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attColor!.HasColor()) clone.attColor!.SetColor(this.attColor!.GetColor());
    return clone;
  }
}

// Canonical libmei AttClassId ordinal (attmodule.ts ATT_CLASS_IDS).
const ATT_COLOR = 109;

/** C++ FunctorInterface default forwarding helper (VisitLiquescent -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('liquescent', ClassId.LIQUESCENT, () => new Liquescent());
