/**
 * Pure TypeScript translation of Verovio's `src/timestamp.cpp` / `include/vrv/timestamp.h`.
 *
 * `TimestampAttr` models a timestamp attribute attached to a layer element.
 */
import { ClassId, FunctorCode, data_DURATION } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { Fraction } from './fraction.js';

// libmei addon macro: #define DUR_MAX 2048 (libmei/addons/attdef.h)
const DUR_MAX = 2048;

/** Pure-TypeScript translation of Verovio's `TimestampAttr` element. */
export class TimestampAttr extends LayerElement {
  private m_actualDurPos = 0.0;

  public constructor() {
    super(ClassId.TIMESTAMP_ATTR);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.m_actualDurPos = 0.0;
  }

  public override GetClassName(): string {
    return 'timestampAttr';
  }

  public override Clone(): TimestampAttr {
    const clone = new TimestampAttr();
    clone.AssignFrom(this);
    clone.SetDrawingPos(this.GetActualDurPos());
    return clone;
  }

  public GetActualDurPos(): number {
    return this.m_actualDurPos;
  }

  public SetDrawingPos(pos: number): void {
    this.m_actualDurPos = pos;
  }

  public GetTimestampAttrAlignmentDuration(meterUnit: data_DURATION): Fraction {
    const duration = Fraction.fromDuration(meterUnit);
    return duration.multiply(new Fraction(Math.trunc(this.m_actualDurPos * DUR_MAX), DUR_MAX));
  }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTimestamp');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTimestamp');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTimestampEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTimestampEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitLayerElement === 'function') return functor.VisitLayerElement(this);
    return functor.VisitObject(this);
  }
}
