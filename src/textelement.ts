/**
 * Pure TypeScript translation of Verovio's `src/textelement.cpp` / `include/vrv/textelement.h`.
 *
 * C++ multiple inheritance (Object + AttLabelled + AttTyped) is represented through
 * composed attribute components; the public forwarding surface preserves the original
 * attribute API. No factory registration exists in C++ for this base class.
 */
import { VrvObject } from './object.js';
import { InstLabelled, InstTyped } from './atts_shared.js';
import { ClassId, FunctorCode } from './vrvdef.js';

const ATT_LABELLED = 145;
const ATT_TYPED = 224;

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

export class TextElement extends VrvObject {
  protected labelled?: InstLabelled;
  protected typed?: InstTyped;
  private m_drawingYRel?: number;
  private m_drawingXRel?: number;

  public constructor(classId: ClassId = ClassId.TEXT_ELEMENT) {
    super(classId);
    // C++ constructs AttLabelled()/AttTyped() in the initializer list; TypeScript
    // field initializers run after super(), so the components are created here.
    this.labelled = new InstLabelled();
    this.typed = new InstTyped();
    this.RegisterAttClass(ATT_LABELLED);
    this.RegisterAttClass(ATT_TYPED);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.labelled?.ResetLabelled();
    this.typed?.ResetTyped();
    this.m_drawingYRel = 0;
    this.m_drawingXRel = 0;
  }

  // C++ TextElement drawing position: no cache for text elements.
  public override GetDrawingX(): number {
    // First get the first TextElement parent (if any) and use its position.
    const textElement = this.GetFirstAncestorInRange(ClassId.TEXT_ELEMENT, ClassId.TEXT_ELEMENT_max);
    if (textElement) return textElement.GetDrawingX() + this.GetDrawingXRel();

    // Otherwise get the text layout element parent - no cast to TextLayoutElement
    // is necessary (structural contract at this boundary).
    const textLayoutElement = this.GetFirstAncestorInRange(ClassId.TEXT_LAYOUT_ELEMENT, ClassId.TEXT_LAYOUT_ELEMENT_max) as
      | { GetDrawingX(): number }
      | null;
    if (textLayoutElement) return textLayoutElement.GetDrawingX() + this.GetDrawingXRel();

    return super.GetDrawingX();
  }

  public override GetDrawingY(): number {
    const textElement = this.GetFirstAncestorInRange(ClassId.TEXT_ELEMENT, ClassId.TEXT_ELEMENT_max);
    if (textElement) return textElement.GetDrawingY() + this.GetDrawingYRel();

    const textLayoutElement = this.GetFirstAncestorInRange(ClassId.TEXT_LAYOUT_ELEMENT, ClassId.TEXT_LAYOUT_ELEMENT_max) as
      | { GetDrawingY(): number }
      | null;
    if (textLayoutElement) return textLayoutElement.GetDrawingY() + this.GetDrawingYRel();

    // TextElement not within RunningElement;
    return super.GetDrawingY();
  }

  public GetDrawingXRel(): number { return this.m_drawingXRel ?? 0; }
  public SetDrawingXRel(drawingXRel: number): void {
    // C++ resets the object cache before mutating the relative position.
    this.ResetCachedDrawingX();
    this.m_drawingXRel = drawingXRel;
  }
  public GetDrawingYRel(): number { return this.m_drawingYRel ?? 0; }
  public SetDrawingYRel(drawingYRel: number): void {
    this.ResetCachedDrawingY();
    this.m_drawingYRel = drawingYRel;
  }

  // C++ AttLabelled forwarding surface.
  public ResetLabelled(): void { this.labelled!.ResetLabelled(); }
  public SetLabel(label: string): void { this.labelled!.SetLabel(label); }
  public GetLabel(): string { return this.labelled!.GetLabel() as string; }
  public HasLabel(): boolean { return this.labelled!.HasLabel(); }
  // C++ AttTyped forwarding surface.
  public ResetTyped(): void { this.typed!.ResetTyped(); }
  public SetType(type: string): void { this.typed!.SetType(type); }
  public GetType(): string { return this.typed!.GetType() as string; }
  public HasType(): boolean { return this.typed!.HasType(); }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitTextElement', this);
  }
  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitTextElement', this);
  }
  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitTextElementEnd', this);
  }
  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitTextElementEnd', this);
  }
}

