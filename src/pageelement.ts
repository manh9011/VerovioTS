/**
 * Pure TypeScript translation of Verovio's `src/pageelement.cpp` / `include/vrv/pageelement.h`.
 *
 * C++ multiple inheritance (Object + AttTyped) is represented through a composed
 * attribute component; the public forwarding surface preserves the original
 * attribute API. No factory registration exists in C++ for this base class.
 */
import { VrvObject } from './object.js';
import { InstTyped } from './atts_shared.js';
import { ClassId, FunctorCode } from './vrvdef.js';

const ATT_TYPED = 224;

interface PageElementFunctorLike {
  VisitPageElement(pageElement: PageElement): FunctorCode;
  VisitPageElementEnd(pageElement: PageElement): FunctorCode;
}

function visit(functor: unknown, method: string, self: unknown): FunctorCode {
  const fn = (functor as Record<string, unknown>)[method];
  if (typeof fn !== 'function') return FunctorCode.FUNCTOR_CONTINUE;
  const result = (fn as (value: unknown) => FunctorCode).call(functor, self);
  return result ?? FunctorCode.FUNCTOR_CONTINUE;
}

export class PageElement extends VrvObject {
  protected typed?: InstTyped;

  public constructor(classId: ClassId = ClassId.PAGE_ELEMENT) {
    super(classId);
    // C++ constructs AttTyped() in the initializer list; TypeScript field
    // initializers run after super(), so the component is created here.
    this.typed = new InstTyped();
    this.RegisterAttClass(ATT_TYPED);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.typed?.ResetTyped();
  }

  // C++ AttTyped forwarding surface.
  public ResetTyped(): void { this.typed!.ResetTyped(); }
  public SetType(type: string): void { this.typed!.SetType(type); }
  public GetType(): string { return this.typed!.GetType() as string; }
  public HasType(): boolean { return this.typed!.HasType(); }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPageElement', this);
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPageElement', this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPageElementEnd', this);
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPageElementEnd', this);
  }
}
