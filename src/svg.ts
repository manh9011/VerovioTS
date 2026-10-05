import { xml_document, xml_node } from './pugixml';
import { VrvObject, ObjectFactory } from './object';
import { ClassId, DEFINITION_FACTOR, FunctorCode } from './vrvdef';
import { Functor, ConstFunctor } from './functor.js';

/**
 * Pure-TypeScript translation of Verovio's `Svg` object from `svg.h` / `svg.cpp`.
 *
 * The embedded SVG remains an in-memory pugi-compatible XML document, matching the
 * C++ member `pugi::xml_document m_svg`; it does not use the browser DOM or WASM.
 */
export class Svg extends VrvObject {
  private m_svg = new xml_document();

  public constructor() {
    super(ClassId.SVG);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
  }

  public override GetClassName(): string {
    return 'svg';
  }

  /** Replace the stored SVG with a deep copy of the supplied node. */
  public Set(svg: xml_node): void {
    this.m_svg.reset();
    this.m_svg.append_copy(svg);
  }

  /** Return the first child of the stored SVG document, as in pugiXML. */
  public Get(): xml_node {
    return this.m_svg.first_child();
  }

  public GetWidth(): number {
    const root = this.m_svg.first_child();
    if (!root.empty()) {
      const width = root.attribute('width');
      if (!width.empty()) {
        // C++ atoi() consumes a decimal prefix; parseInt() has the same relevant behavior.
        return Number.parseInt(width.value(), 10) * DEFINITION_FACTOR;
      }
    }
    return 0;
  }

  public GetHeight(): number {
    const root = this.m_svg.first_child();
    if (!root.empty()) {
      const height = root.attribute('height');
      if (!height.empty()) {
        return Number.parseInt(height.value(), 10) * DEFINITION_FACTOR;
      }
    }
    return 0;
  }

  public override Accept(functor: Functor): FunctorCode {
    const f = functor as Functor & { VisitSvg?: (svg: Svg) => FunctorCode };
    return f.VisitSvg ? f.VisitSvg(this) : FunctorCode.FUNCTOR_CONTINUE;
  }

  public AcceptConst(functor: ConstFunctor): FunctorCode {
    const f = functor as ConstFunctor & { VisitSvg?: (svg: Svg) => FunctorCode };
    return f.VisitSvg ? f.VisitSvg(this) : FunctorCode.FUNCTOR_CONTINUE;
  }

  public override AcceptEnd(functor: Functor): FunctorCode {
    const f = functor as Functor & { VisitSvgEnd?: (svg: Svg) => FunctorCode };
    return f.VisitSvgEnd ? f.VisitSvgEnd(this) : FunctorCode.FUNCTOR_CONTINUE;
  }

  public AcceptEndConst(functor: ConstFunctor): FunctorCode {
    const f = functor as ConstFunctor & { VisitSvgEnd?: (svg: Svg) => FunctorCode };
    return f.VisitSvgEnd ? f.VisitSvgEnd(this) : FunctorCode.FUNCTOR_CONTINUE;
  }
}

ObjectFactory.GetInstance().Register('svg', ClassId.SVG, () => new Svg());
