/**
 * Pure TypeScript translation of Verovio's `src/genericlayerelement.cpp` / `include/vrv/genericlayerelement.h`.
 *
 * `GenericLayerElement` holds generic elements existing within MEI `<layer>` but not supported by Verovio.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { LogError } from './vrv.js';

/** Pure-TypeScript translation of Verovio's `GenericLayerElement`. */
export class GenericLayerElement extends LayerElement {
  private m_className = '';
  private m_meiName = '';
  private m_content = '';

  public constructor(name?: string) {
    super(ClassId.GENERIC_ELEMENT);
    if (name === undefined) {
      LogError('Creating generic element without name');
      this.m_className = '[unspecified]';
    } else {
      this.m_meiName = name;
      this.m_className = name.length > 0 ? name.charAt(0).toUpperCase() + name.slice(1) : '';
    }
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
  }

  public override GetClassName(): string {
    return this.m_className;
  }

  public GetMEIName(): string {
    return this.m_meiName;
  }

  public GetContent(): string {
    return this.m_content;
  }

  public SetContent(content: string): void {
    this.m_content = content;
  }

  public override Clone(): GenericLayerElement {
    const clone = new GenericLayerElement(this.m_meiName);
    clone.AssignFrom(this);
    clone.m_className = this.m_className;
    clone.m_content = this.m_content;
    return clone;
  }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitGenericLayerElement');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitGenericLayerElement');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitGenericLayerElementEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitGenericLayerElementEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitLayerElement === 'function') return functor.VisitLayerElement(this);
    return functor.VisitObject(this);
  }
}
