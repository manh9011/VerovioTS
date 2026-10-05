/**
 * Pure TypeScript translation of Verovio's `src/text.cpp` / `include/vrv/text.h`.
 *
 * Text models CDATA content. The u32string content is represented as a
 * code-point array matching the repository-wide UTF-32 convention.
 */
import { TextElement } from './textelement.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { VrvObject } from './object.js';

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

export class Text extends TextElement {
  /** The text content (UTF-32 code points as in the C++ std::u32string). */
  private m_text?: number[];
  /** Flag indicating whether or not the text content was generated. */
  private m_isGenerated?: boolean;

  public constructor() {
    super(ClassId.TEXT);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.m_isGenerated = false;
    // C++ default-constructs the u32string empty.
    this.m_text ??= [];
  }

  public override Clone(): VrvObject {
    const clone = new Text();
    clone.AssignFrom(this as unknown as VrvObject);
    clone.m_text = this.m_text ? [...this.m_text] : [];
    clone.m_isGenerated = this.m_isGenerated === true;
    return clone;
  }

  public override GetClassName(): string { return 'text'; }

  public SetText(text: number[]): void { this.m_text = text; }
  public GetText(): number[] { return this.m_text ?? []; }

  public IsGenerated(): boolean { return this.m_isGenerated === true; }
  public SetGenerated(isGenerated: boolean): void { this.m_isGenerated = isGenerated; }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitText', this);
  }
  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitText', this);
  }
  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitTextEnd', this);
  }
  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitTextEnd', this);
  }
}

// C++ `static const ClassRegistrar<Text> s_factory("text", TEXT);`
import { ObjectFactory } from './object.js';
ObjectFactory.GetInstance().Register('text', ClassId.TEXT, () => new Text());

