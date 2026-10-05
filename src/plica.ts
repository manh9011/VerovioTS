/**
 * Pure TypeScript translation of Verovio's `Plica`
 * (`src-cpp/src/plica.cpp` + `src-cpp/include/vrv/plica.h`).
 *
 * C++ has `Plica` inherit `LayerElement` + `AttPlicaVis`; TypeScript models
 * the attribute base through composition with the generated libmei component.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { InstPlicaVis } from './atts_visual.js';
import { ObjectFactory, VrvObject } from './object.js';

/** Pure TypeScript translation of Verovio's `Plica`. */
export class Plica extends LayerElement {
  private attPlicaVis: InstPlicaVis | null = null;

  public constructor() {
    super(ClassId.PLICA);
    this.ensureAttributes();
    this.RegisterAttClass(ATT_PLICAVIS);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.attPlicaVis?.ResetPlicaVis();
  }

  public override GetClassName(): string { return 'plica'; }

  private ensureAttributes(): void {
    this.attPlicaVis ??= new InstPlicaVis();
  }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitPlica', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitPlicaEnd', this); }

  public override Clone(): VrvObject {
    const clone = new Plica();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attPlicaVis!.HasDir()) clone.attPlicaVis!.SetDir(this.attPlicaVis!.GetDir());
    return clone;
  }

  //-----------//
  // AttPlicaVis
  //-----------//
  public ResetPlicaVis(): void { this.attPlicaVis!.ResetPlicaVis(); }
  public SetDir(v: number): void { this.attPlicaVis!.SetDir(v); }
  public GetDir(): number { return this.attPlicaVis!.GetDir(); }
  public HasDir(): boolean { return this.attPlicaVis!.HasDir(); }
  public SetLen(v: unknown): void { this.attPlicaVis!.SetLen(v as never); }
  public GetLen(): unknown { return this.attPlicaVis!.GetLen(); }
  public HasLen(): boolean { return this.attPlicaVis!.HasLen(); }
}

// Canonical libmei AttClassId ordinal (attmodule.ts ATT_CLASS_IDS).
const ATT_PLICAVIS = 276;

/** C++ FunctorInterface default forwarding helper (VisitPlica -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('plica', ClassId.PLICA, () => new Plica());
