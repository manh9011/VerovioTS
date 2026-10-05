import { ObjectFactory, VrvObject } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { MEI_UNSET } from './vrv.js';
import type { Functor, ConstFunctor } from './functor.js';

/** Pure-TS adaptation of AttLabelled. */
export class LayerDefLabelledAttributes {
  private m_label = '';
  ResetLabelled(): void { this.m_label = ''; }
  SetLabel(v: string): void { this.m_label = v; }
  GetLabel(): string { return this.m_label; }
  HasLabel(): boolean { return this.m_label !== ''; }
}

/** Pure-TS adaptation of AttNInteger. */
export class LayerDefNIntegerAttributes {
  private m_n = MEI_UNSET;
  ResetNInteger(): void { this.m_n = MEI_UNSET; }
  SetN(v: number): void { this.m_n = Math.trunc(v); }
  GetN(): number { return this.m_n; }
  HasN(): boolean { return this.m_n !== MEI_UNSET; }
}

/** Pure-TS adaptation of AttTyped. */
export class LayerDefTypedAttributes {
  private m_type = '';
  ResetTyped(): void { this.m_type = ''; }
  SetType(v: string): void { this.m_type = v; }
  GetType(): string { return this.m_type; }
  HasType(): boolean { return this.m_type !== ''; }
}

interface LayerDefFunctorLike {
  VisitLayerDef(layerDef: LayerDef): FunctorCode;
  VisitLayerDefEnd(layerDef: LayerDef): FunctorCode;
}

interface LayerDefConstFunctorLike {
  VisitLayerDef(layerDef: LayerDef): FunctorCode;
  VisitLayerDefEnd(layerDef: LayerDef): FunctorCode;
}

const ATT_LABELLED = 145;
const ATT_NINTEGER = 167;
const ATT_TYPED = 224;

export class LayerDef extends VrvObject {
  private labelled: LayerDefLabelledAttributes | undefined;
  private nInteger: LayerDefNIntegerAttributes | undefined;
  private typed: LayerDefTypedAttributes | undefined;

  public constructor() {
    super(ClassId.LAYERDEF);
    this.RegisterAttClass(ATT_LABELLED);
    this.RegisterAttClass(ATT_NINTEGER);
    this.RegisterAttClass(ATT_TYPED);
    this.ResetLayerDefAttributes();
  }

  private ResetLayerDefAttributes(): void {
    this.labelled ??= new LayerDefLabelledAttributes();
    this.nInteger ??= new LayerDefNIntegerAttributes();
    this.typed ??= new LayerDefTypedAttributes();
    this.labelled.ResetLabelled();
    this.nInteger.ResetNInteger();
    this.typed.ResetTyped();
  }

  public override Clone(): VrvObject {
    const clone = new LayerDef();
    clone.AssignFrom(this);
    return clone;
  }

  public override Reset(): void {
    super.Reset();
    this.ResetLayerDefAttributes();
  }

  public override GetClassName(): string { return 'layerDef'; }

  public IsSupportedChild(classId: ClassId): boolean {
    return classId === ClassId.INSTRDEF || classId === ClassId.LABEL || classId === ClassId.LABELABBR;
  }

  public override Accept(functor: Functor): FunctorCode { return visitor(functor, 'VisitLayerDef', this); }

  public AcceptConst(functor: ConstFunctor): FunctorCode { return visitor(functor, 'VisitLayerDef', this); }

  public override AcceptEnd(functor: Functor): FunctorCode { return visitor(functor, 'VisitLayerDefEnd', this); }

  public AcceptEndConst(functor: ConstFunctor): FunctorCode { return visitor(functor, 'VisitLayerDefEnd', this); }

  public ResetLabelled(): void { this.labelled!.ResetLabelled(); }
  public SetLabel(v: string): void { this.labelled!.SetLabel(v); }
  public GetLabel(): string { return this.labelled!.GetLabel(); }
  public HasLabel(): boolean { return this.labelled!.HasLabel(); }

  public ResetNInteger(): void { this.nInteger!.ResetNInteger(); }
  public SetN(v: number): void { this.nInteger!.SetN(v); }
  public GetN(): number { return this.nInteger!.GetN(); }
  public HasN(): boolean { return this.nInteger!.HasN(); }

  public ResetTyped(): void { this.typed!.ResetTyped(); }
  public SetType(v: string): void { this.typed!.SetType(v); }
  public GetType(): string { return this.typed!.GetType(); }
  public HasType(): boolean { return this.typed!.HasType(); }
}

ObjectFactory.GetInstance().Register('layerDef', ClassId.LAYERDEF, () => new LayerDef());

/** C++ FunctorInterface default forwarding helper (VisitLayerDef -> VisitObject). */
function visitor(functor: Functor, method: string, self: unknown): FunctorCode {
  const f = functor as unknown as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}
