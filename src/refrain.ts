/**
 * Pure TypeScript translation of Verovio's `src/refrain.cpp` / `include/vrv/refrain.h`.
 *
 * `Refrain` models recurring note-attached lyrics, such as a chorus.
 *
 * C++ multiple inheritance (LyricElement + AttNNumberLike) is represented
 * through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LyricElement } from './lyricelement.js';
import { InstNNumberLike } from './atts_shared.js';
import { ObjectFactory } from './object.js';

const ATT_NNUMBERLIKE = 168;

/** Pure-TypeScript translation of Verovio's `Refrain` element. */
export class Refrain extends LyricElement {
  private attNNumberLike!: InstNNumberLike;

  public constructor() {
    super(ClassId.REFRAIN);
    this.attNNumberLike = new InstNNumberLike();
    this.RegisterAttClass(ATT_NNUMBERLIKE);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.attNNumberLike ??= new InstNNumberLike();
    this.attNNumberLike.ResetNNumberLike();
  }

  public override GetClassName(): string {
    return 'refrain';
  }

  // AttNNumberLike forwarding.
  public SetN(value: any): void { this.attNNumberLike.SetN(value); }
  public GetN(): any { return this.attNNumberLike.GetN(); }
  public HasN(): boolean { return this.attNNumberLike.HasN(); }
  public ResetNNumberLike(): void { this.attNNumberLike.ResetNNumberLike(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitRefrain');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitRefrain');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitRefrainEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitRefrainEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitLyricElement === 'function') return functor.VisitLyricElement(this);
    if (typeof functor.VisitLayerElement === 'function') return functor.VisitLayerElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): Refrain {
    const clone = new Refrain();
    clone.AssignFrom(this);
    if (this.HasN()) clone.SetN(this.GetN());
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasLang()) clone.SetLang(this.GetLang());
    if (this.HasPlace()) clone.SetPlace(this.GetPlace());
    if (this.HasVoltasym()) clone.SetVoltasym(this.GetVoltasym());
    clone.SetDrawingVerseN(this.GetDrawingVerseN());
    clone.SetDrawingLyricGroupN(this.GetDrawingLyricGroupN());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('refrain', ClassId.REFRAIN, () => new Refrain());
