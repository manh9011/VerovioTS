import { VrvObject, TextListInterface, ObjectFactory } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { Functor, ConstFunctor } from './functor.js';

interface LabelFunctorLike {
  VisitLabel(label: Label): FunctorCode;
  VisitLabelEnd(label: Label): FunctorCode;
}

interface LabelConstFunctorLike {
  VisitLabel(label: Label): FunctorCode;
  VisitLabelEnd(label: Label): FunctorCode;
}

/** Pure-TypeScript translation of Verovio's `<label>` element. */
export class Label extends VrvObject {
  private readonly textList: TextListInterface;

  public constructor() {
    super(ClassId.LABEL);
    this.textList = new TextListInterface();
    // C++ multiple inheritance: TextListInterface is mixed into Label; bind the
    // composed list interface to this object as its owner (see src/cpmark.ts).
    this.textList.SetInterfaceOwner(this as unknown as VrvObject);
    this.Reset();
  }

  public override Clone(): VrvObject {
    const clone = new Label();
    clone.AssignFrom(this);
    return clone;
  }

  public override Reset(): void {
    // C++ Label::Reset() delegates to Object::Reset(); TextListInterface has no
    // reset state of its own beyond the owner's filtered child view.
    super.Reset();
  }

  public override GetClassName(): string { return 'label'; }

  public IsSupportedChild(classId: ClassId): boolean {
    return classId === ClassId.LB || classId === ClassId.REND || classId === ClassId.TEXT
      || VrvObject.IsEditorialElement(classId);
  }

  // Multiple inheritance adaptation for TextListInterface.
  public GetText(): string { return this.textList.GetText(); }
  public GetTextLines(lines: string[]): void { this.textList.GetTextLines(lines); }

  public override Accept(functor: Functor): FunctorCode { return visitor(functor, 'VisitLabel', this); }
  public AcceptConst(functor: ConstFunctor): FunctorCode { return visitor(functor, 'VisitLabel', this); }
  public override AcceptEnd(functor: Functor): FunctorCode { return visitor(functor, 'VisitLabelEnd', this); }
  public AcceptEndConst(functor: ConstFunctor): FunctorCode { return visitor(functor, 'VisitLabelEnd', this); }
}
/** C++ FunctorInterface default forwarding helper (VisitLabel -> VisitObject). */
function visitor(functor: Functor, method: string, self: unknown): FunctorCode {
  const f = functor as unknown as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}


ObjectFactory.GetInstance().Register('label', ClassId.LABEL, () => new Label());
