/**
 * Pure TypeScript translation of Verovio's `src/div.cpp` / `include/vrv/div.h`.
 */
import { TextLayoutElement } from './textlayoutelement.js';
import { VrvObject, ObjectFactory } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';

const ATT_LABELLED = 145;
const ATT_TYPED = 224;

function assertInvariant(cond: boolean, message: string): void {
  if (!cond) throw new Error(message);
}

function visit(functor: unknown, method: string, self: unknown): FunctorCode {
  const fn = (functor as Record<string, unknown>)[method];
  if (typeof fn !== 'function') {
    // C++ FunctorInterface forwards unknown Visit* defaults to VisitObject;
    // structural test functors expose only VisitObject.
    const fallback = (functor as Record<string, unknown>)['VisitObject'];
    if (typeof fallback === 'function') return (fallback as (value: unknown) => FunctorCode).call(functor, self);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
  return (fn as (value: unknown) => FunctorCode).call(functor, self);
}

/** Structural `Doc` contract consumed by `Div::GetTotalWidth`. */
export interface DivDocLike {
  m_drawingPageContentWidth: number;
}

export class Div extends TextLayoutElement {
  /** X drawing relative position — re-computed at draw time, not stored in MEI. */
  private m_drawingXRel?: number;
  /** Y drawing relative position — re-computed at draw time, not stored in MEI. */
  private m_drawingYRel?: number;
  /** Flag indicating the div should be displayed inline. */
  private m_drawingInline?: boolean;
  /** Cache used by CacheXRel(bool restore). */
  private m_cachedXRel?: number;
  /** Cache used by CacheYRel(bool restore). */
  private m_cachedYRel?: number;

  public constructor() {
    super(ClassId.DIV);
    // TextLayoutElement base registers ATT_LABELLED/ATT_TYPED in its ctor; the
    // TS virtual Reset() during super() runs before field init, so finalize here.
    this.m_drawingInline = false;
    this.Reset();
    ObjectFactory.GetInstance().Register('div', ClassId.DIV, () => new Div());
  }

  public override Reset(): void {
    super.Reset();
    // Guard: the VrvObject constructor dispatches the overridden Reset() before
    // subclass fields exist; the C++ ctor chain runs the base Reset() only.
    if (this.m_drawingInline === undefined) return;
    this.m_drawingInline = false;
  }

  public override GetClassName(): string { return 'div'; }

  public GetDrawingInline(): boolean { return this.m_drawingInline ?? false; }
  public SetDrawingInline(drawingInline: boolean): void { this.m_drawingInline = drawingInline; }

  public GetDrawingX(): number {
    const parent = this.GetParent();
    assertInvariant(parent !== null, 'Div requires a parent for GetDrawingX.');
    if (this.m_drawingInline) {
      return parent!.GetDrawingX() + this.GetDrawingXRel();
    }
    return parent!.GetDrawingX();
  }

  public GetDrawingY(): number {
    const parent = this.GetParent();
    assertInvariant(parent !== null, 'Div requires a parent for GetDrawingY.');
    if (this.m_drawingInline) {
      return parent!.GetDrawingY() + this.GetDrawingYRel();
    }
    return parent!.GetDrawingY();
  }

  public GetDrawingXRel(): number { return this.m_drawingXRel ?? 0; }
  public SetDrawingXRel(drawingXRel: number): void { this.m_drawingXRel = drawingXRel; }
  public CacheXRel(restore = false): void {
    if (restore) this.m_drawingXRel = this.m_cachedXRel;
    else this.m_cachedXRel = this.m_drawingXRel;
  }

  public GetDrawingYRel(): number { return this.m_drawingYRel ?? 0; }
  public SetDrawingYRel(drawingYRel: number): void { this.m_drawingYRel = drawingYRel; }
  public CacheYRel(restore = false): void {
    if (restore) this.m_drawingYRel = this.m_cachedYRel;
    else this.m_cachedYRel = this.m_drawingYRel;
  }

  public override GetTotalHeight(doc: unknown): number {
    // C++: assert(doc) — the parameter is otherwise unused.
    assertInvariant(doc !== null && doc !== undefined, 'Div::GetTotalHeight requires a document.');
    return this.GetContentHeight();
  }

  public override GetTotalWidth(doc: unknown): number {
    if (!this.m_drawingInline) {
      return (doc as DivDocLike).m_drawingPageContentWidth;
    }
    else {
      return this.GetContentWidth();
    }
  }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitDiv', this);
  }
  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitDiv', this);
  }
  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitDivEnd', this);
  }
  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitDivEnd', this);
  }
}
