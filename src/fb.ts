/**
 * Pure TypeScript translation of Verovio's `src/fb.cpp` / `include/vrv/fb.h`.
 *
 * `Fb` models the MEI `<fb>` (figured bass) element.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, VrvObject } from './object.js';

/** Pure TypeScript translation of Verovio's `Fb` element. */
export class Fb extends VrvObject {
  public constructor() {
    super(ClassId.FB);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
  }

  public override GetClassName(): string {
    return 'fb';
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.FIGURE) {
      return true;
    } else if (VrvObject.IsEditorialElement(classId)) {
      return true;
    }
    return false;
  }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitFb');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitFb');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitFbEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitFbEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Fb {
    const clone = new Fb();
    clone.AssignFrom(this);
    return clone;
  }
}

ObjectFactory.GetInstance().Register('fb', ClassId.FB, () => new Fb());
