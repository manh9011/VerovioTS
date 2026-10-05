/**
 * Pure TypeScript translation of Verovio's `src/num.cpp` / `include/vrv/num.h`.
 */
import { TextElement } from './textelement.js';
import { Text } from './text.js';
import { VrvObject, ObjectFactory } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';

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

export class Num extends TextElement {
  // Current text for templated number (<num label="page">#</num>).
  // Filled by RunningElement::SetCurrentPageNum and used by View::DrawNum.
  // C++ owns it by value as a direct member; TS keeps it as a composed field.
  private m_currentText?: Text;

  public constructor() {
    super(ClassId.NUM);
    // C++ constructs Text m_currentText in the initializer list; TS field
    // initializers run after super(), so create it here (lazily guarded because
    // the VrvObject constructor invokes the virtual Reset() first).
    this.m_currentText = new Text();
    this.m_currentText.SetParent(this as unknown as VrvObject);
    this.m_currentText.SetText([]);
    ObjectFactory.GetInstance().Register('num', ClassId.NUM, () => new Num());
  }

  public override Reset(): void {
    super.Reset();
    if (!this.m_currentText) return;
    // C++ Num::Reset does `m_currentText.SetParent(this)`. The C++ virtual
    // dispatch inside the constructor runs the base Reset only, so SetParent
    // executes exactly once; TypeScript's VrvObject constructor dispatches the
    // overridden Reset(), so guard the single-assignment assert with the
    // parent-already-set state instead of failing on the double reset.
    if (!this.m_currentText.GetParent()) this.m_currentText.SetParent(this as unknown as VrvObject);
    this.m_currentText.SetText([]);
  }

  public override Clone(): VrvObject {
    const clone = new Num();
    clone.AssignFrom(this as unknown as VrvObject);
    // m_currentText is a value member in C++ (copy-constructed); copy its state.
    clone.GetCurrentText().SetText(this.GetCurrentText().GetText());
    return clone;
  }

  public override GetClassName(): string { return 'num'; }

  public override IsSupportedChild(classId: ClassId): boolean {
    return classId === ClassId.TEXT;
  }

  public GetCurrentText(): Text { return this.m_currentText!; }
  public GetCurrentTextConst(): Text { return this.m_currentText!; }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitNum', this);
  }
  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitNum', this);
  }
  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitNumEnd', this);
  }
  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitNumEnd', this);
  }
}
