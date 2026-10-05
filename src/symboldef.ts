import { VrvObject, ObjectFactory } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { Functor, ConstFunctor } from './functor.js';

/** Structural contract for the not-yet-migrated Doc dependency used by SymbolDef. */
export interface SymbolDefDocLike {
  GetDrawingUnit(staffSize: number): number;
  GetOptions(): { m_graceFactor: { GetValue(): number } };
}

/** Structural contracts for Graphic/Svg children used only by SymbolDef sizing. */
interface SymbolDefSvgLike extends VrvObject {
  GetHeight(): number;
  GetWidth(): number;
}

interface SymbolDefGraphicLike extends VrvObject {
  GetDrawingHeight(unit: number, staffSize: number): number;
  GetDrawingWidth(unit: number, staffSize: number): number;
}

export class SymbolDef extends VrvObject {
  private m_originalParent: VrvObject | null = null;

  public constructor() {
    super(ClassId.SYMBOLDEF);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.m_originalParent = null;
  }

  public override GetClassName(): string {
    return 'symbolDef';
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    return classId === ClassId.GRAPHIC || classId === ClassId.SVG || classId === ClassId.SYMBOL;
  }

  public GetSymbolWidth(doc: SymbolDefDocLike, staffSize: number, dimin: boolean): number {
    return this.GetSymbolSize(doc, staffSize, dimin)[0];
  }

  public GetSymbolHeight(doc: SymbolDefDocLike, staffSize: number, dimin: boolean): number {
    return this.GetSymbolSize(doc, staffSize, dimin)[1];
  }

  public SetTemporaryParent(parent: VrvObject): void {
    if (!this.GetParent() || this.m_originalParent) {
      throw new Error('SymbolDef::SetTemporaryParent invariant failed');
    }
    this.m_originalParent = this.GetParent();
    this.ResetParent();
    this.SetParent(parent);
  }

  public ResetTemporaryParent(): void {
    if (!this.GetParent() || !this.m_originalParent) {
      throw new Error('SymbolDef::ResetTemporaryParent invariant failed');
    }
    this.ResetParent();
    this.SetParent(this.m_originalParent);
    this.m_originalParent = null;
  }

  private GetSymbolSize(doc: SymbolDefDocLike, staffSize: number, dimin: boolean): [number, number] {
    if (!doc) {
      throw new Error('SymbolDef::GetSymbolSize requires doc');
    }

    const unit = doc.GetDrawingUnit(staffSize);
    let height = 0;
    let width = 0;

    for (const child of this.GetChildren()) {
      if (child.Is(ClassId.SVG)) {
        const svg = child as unknown as SymbolDefSvgLike;
        height = Math.max(height, Math.trunc(svg.GetHeight() * staffSize / 100));
        width = Math.max(width, Math.trunc(svg.GetWidth() * staffSize / 100));
      } else if (child.Is(ClassId.GRAPHIC)) {
        const graphic = child as unknown as SymbolDefGraphicLike;
        height = Math.max(height, graphic.GetDrawingHeight(unit, staffSize));
        width = Math.max(width, graphic.GetDrawingWidth(unit, staffSize));
      }
    }

    if (dimin) {
      const graceFactor = doc.GetOptions().m_graceFactor.GetValue();
      height = Math.trunc(height * graceFactor);
      width = Math.trunc(width * graceFactor);
    }

    return [width, height];
  }

  public override Clone(): VrvObject {
    const clone = new SymbolDef();
    clone.AssignFrom(this);
    return clone;
  }

  public override Accept(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitSymbolDef', this);
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitSymbolDef', this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitSymbolDefEnd', this);
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitSymbolDefEnd', this);
  }
}

function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') {
    return (fn as (arg: unknown) => FunctorCode).call(functor, self);
  }
  const fallback = method.endsWith('End') ? f.VisitObjectEnd : f.VisitObject;
  if (typeof fallback === 'function') {
    return (fallback as (arg: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('symbolDef', ClassId.SYMBOLDEF, () => new SymbolDef());
