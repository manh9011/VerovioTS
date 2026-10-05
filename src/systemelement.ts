/**
 * Pure TypeScript translation of Verovio's `src/systemelement.cpp` / `include/vrv/systemelement.h`.
 *
 * C++ multiple inheritance (FloatingObject + VisibilityDrawingInterface + AttTyped)
 * is represented through composed interface/attribute components with the same
 * public forwarding surface. No factory registration exists in C++ for this base.
 */
import { FloatingObject } from './floatingobject.js';
import { VrvObject } from './object.js';
import { InstTyped } from './atts_shared.js';
import { VisibilityDrawingInterface } from './drawinginterface.js';
import { ClassId, FunctorCode, VisibilityType } from './vrvdef.js';

const ATT_TYPED = 224;

interface SystemElementFunctorLike {
  VisitSystemElement(systemElement: SystemElement): FunctorCode;
  VisitSystemElementEnd(systemElement: SystemElement): FunctorCode;
}

function visit(functor: unknown, method: string, self: unknown): FunctorCode {
  const fn = (functor as Record<string, unknown>)[method];
  if (typeof fn !== 'function') return FunctorCode.FUNCTOR_CONTINUE;
  const result = (fn as (value: unknown) => FunctorCode).call(functor, self);
  return result ?? FunctorCode.FUNCTOR_CONTINUE;
}

export class SystemElement extends FloatingObject {
  protected visibilityDrawingInterface?: VisibilityDrawingInterface;
  protected typed?: InstTyped;

  public constructor(classId: ClassId = ClassId.SYSTEM_ELEMENT) {
    super(classId);
    this.visibilityDrawingInterface = new VisibilityDrawingInterface();
    this.typed = new InstTyped();
    this.RegisterAttClass(ATT_TYPED);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.visibilityDrawingInterface?.Reset();
    this.typed?.ResetTyped();
  }

  // C++ VisibilityDrawingInterface forwarding surface.
  public override GetVisibilityDrawingInterface(): VisibilityDrawingInterface {
    return this.visibilityDrawingInterface!;
  }
  public SetVisibility(visibility: VisibilityType): void {
    this.visibilityDrawingInterface!.SetVisibility(visibility);
  }
  public IsHidden(): boolean { return this.visibilityDrawingInterface!.IsHidden(); }

  // C++ AttTyped forwarding surface.
  public ResetTyped(): void { this.typed!.ResetTyped(); }
  public SetType(type: string): void { this.typed!.SetType(type); }
  public GetType(): string { return this.typed!.GetType() as string; }
  public HasType(): boolean { return this.typed!.HasType(); }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitSystemElement', this);
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitSystemElement', this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitSystemElementEnd', this);
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitSystemElementEnd', this);
  }
}
