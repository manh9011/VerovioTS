/**
 * Pure TypeScript translation of Verovio's `src/mrpt.cpp` / `include/vrv/mrpt.h`.
 *
 * `MRpt` models the MEI `<mRpt>` (measure repeat) element.
 *
 * C++ multiple inheritance (LayerElement + AttColor + AttNumbered +
 * AttNumberPlacement) is represented through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { InstColor } from './atts_shared.js';
import { InstNumbered, InstNumberPlacement } from './atts_cmn.js';
import { ObjectFactory } from './object.js';

const ATT_COLOR = 109;
const ATT_NUMBERED = 29;
const ATT_NUMBERPLACEMENT = 28;

/** Pure-TypeScript translation of Verovio's `MRpt` element. */
export class MRpt extends LayerElement {
  private color!: InstColor;
  private numbered!: InstNumbered;
  private numberPlacement!: InstNumberPlacement;

  public m_drawingMeasureCount = 0;

  public constructor() {
    super(ClassId.MRPT);
    this.color = new InstColor();
    this.numbered = new InstNumbered();
    this.numberPlacement = new InstNumberPlacement();

    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_NUMBERED);
    this.RegisterAttClass(ATT_NUMBERPLACEMENT);

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.color ??= new InstColor();
    this.numbered ??= new InstNumbered();
    this.numberPlacement ??= new InstNumberPlacement();

    this.color.ResetColor();
    this.numbered.ResetNumbered();
    this.numberPlacement.ResetNumberPlacement();
    this.m_drawingMeasureCount = 0;
  }

  public override GetClassName(): string {
    return 'mRpt';
  }

  // AttColor forwarding.
  public SetColor(value: any): void { this.color.SetColor(value); }
  public GetColor(): any { return this.color.GetColor(); }
  public HasColor(): boolean { return this.color.HasColor(); }
  public ResetColor(): void { this.color.ResetColor(); }

  // AttNumbered forwarding.
  public SetNum(value: any): void { this.numbered.SetNum(value); }
  public GetNum(): any { return this.numbered.GetNum(); }
  public HasNum(): boolean { return this.numbered.HasNum(); }
  public ResetNumbered(): void { this.numbered.ResetNumbered(); }

  // AttNumberPlacement forwarding.
  public SetNumPlace(value: any): void { this.numberPlacement.SetNumPlace(value); }
  public GetNumPlace(): any { return this.numberPlacement.GetNumPlace(); }
  public HasNumPlace(): boolean { return this.numberPlacement.HasNumPlace(); }
  public SetNumVisible(value: any): void { this.numberPlacement.SetNumVisible(value); }
  public GetNumVisible(): any { return this.numberPlacement.GetNumVisible(); }
  public HasNumVisible(): boolean { return this.numberPlacement.HasNumVisible(); }
  public ResetNumberPlacement(): void { this.numberPlacement.ResetNumberPlacement(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMRpt');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMRpt');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMRptEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMRptEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitLayerElement === 'function') return functor.VisitLayerElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): MRpt {
    const clone = new MRpt();
    clone.AssignFrom(this);
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasNum()) clone.SetNum(this.GetNum());
    if (this.HasNumPlace()) clone.SetNumPlace(this.GetNumPlace());
    if (this.HasNumVisible()) clone.SetNumVisible(this.GetNumVisible());
    clone.m_drawingMeasureCount = this.m_drawingMeasureCount;
    return clone;
  }
}

ObjectFactory.GetInstance().Register('mRpt', ClassId.MRPT, () => new MRpt());
