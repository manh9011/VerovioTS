import { ObjectFactory, VrvObject } from './object.js';
import { LayerElement } from './layerelement.js';
import { OffsetInterface } from './offsetinterface.js';
import { PositionInterface } from './positioninterface.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { Functor } from './functor.js';

/** Pure-TS representation of libmei AttColor. */
class ColorAttributes {
  private color = '';
  ResetColor(): void { this.color = ''; }
  SetColor(value: string): void { this.color = value; }
  GetColor(): string { return this.color; }
  HasColor(): boolean { return this.color !== ''; }
}

/** Pure-TS representation of libmei AttDotLog. */
class DotLogAttributes {
  private form = 0;
  ResetDotLog(): void { this.form = 0; }
  SetForm(value: number): void { this.form = value; }
  GetForm(): number { return this.form; }
  HasForm(): boolean { return this.form !== 0; }
}

interface DotFunctorLike {
  VisitDot(dot: Dot): FunctorCode;
  VisitDotEnd(dot: Dot): FunctorCode;
}

/**
 * Pure-TypeScript translation of Verovio's Dot element.
 * C++: `Dot : public LayerElement, public OffsetInterface, public PositionInterface,
 *       public AttColor, public AttDotLog`.
 */
export class Dot extends LayerElement {
  private offsetInterface?: OffsetInterface;
  private positionInterface?: PositionInterface;
  private colorAttributes?: ColorAttributes;
  private dotLogAttributes?: DotLogAttributes;

  public m_drawingPreviousElement: VrvObject | null = null;
  public m_drawingNextElement: VrvObject | null = null;

  public constructor() {
    super(ClassId.DOT);
    this.ensureAttributes();
  }

  private ensureAttributes(): void {
    if (!this.offsetInterface) {
      this.offsetInterface = new OffsetInterface();
      this.RegisterInterface(this.offsetInterface.GetAttClasses(), this.offsetInterface.IsInterface());
    }
    if (!this.positionInterface) {
      this.positionInterface = new PositionInterface();
      this.RegisterInterface(this.positionInterface.GetAttClasses(), this.positionInterface.IsInterface());
    }
    if (!this.colorAttributes) {
      this.colorAttributes = new ColorAttributes();
      this.RegisterAttClass(109); // ATT_COLOR
    }
    if (!this.dotLogAttributes) {
      this.dotLogAttributes = new DotLogAttributes();
      this.RegisterAttClass(124); // ATT_DOTLOG
    }
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.offsetInterface!.Reset();
    this.positionInterface!.Reset();
    this.colorAttributes!.ResetColor();
    this.dotLogAttributes!.ResetDotLog();
    this.m_drawingPreviousElement = null;
    this.m_drawingNextElement = null;
  }

  public override Clone(): VrvObject {
    const clone = new Dot();
    clone.AssignFrom(this);
    clone.offsetInterface!.SetHo(this.GetOffsetInterface().GetHo());
    clone.offsetInterface!.SetVo(this.GetOffsetInterface().GetVo());
    clone.positionInterface!.SetLoc(this.GetPositionInterface().GetLoc());
    clone.positionInterface!.SetPloc(this.GetPositionInterface().GetPloc());
    clone.positionInterface!.SetOloc(this.GetPositionInterface().GetOloc());
    clone.positionInterface!.SetDrawingLoc(this.GetPositionInterface().GetDrawingLoc());
    clone.colorAttributes!.SetColor(this.GetColor());
    clone.dotLogAttributes!.SetForm(this.GetForm());
    clone.m_drawingPreviousElement = this.m_drawingPreviousElement;
    clone.m_drawingNextElement = this.m_drawingNextElement;
    return clone;
  }

  public override GetClassName(): string { return 'dot'; }

  public override GetOffsetInterface(): OffsetInterface { return this.offsetInterface!; }
  public GetPositionInterface(): PositionInterface { return this.positionInterface!; }

  public HasToBeAligned(): boolean { return true; }

  public ResetColor(): void { this.colorAttributes!.ResetColor(); }
  public SetColor(value: string): void { this.colorAttributes!.SetColor(value); }
  public GetColor(): string { return this.colorAttributes!.GetColor(); }
  public HasColor(): boolean { return this.colorAttributes!.HasColor(); }

  public ResetDotLog(): void { this.dotLogAttributes!.ResetDotLog(); }
  public SetForm(value: number): void { this.dotLogAttributes!.SetForm(value); }
  public GetForm(): number { return this.dotLogAttributes!.GetForm(); }
  public HasForm(): boolean { return this.dotLogAttributes!.HasForm(); }

  private visit(functor: Functor, method: string): FunctorCode {
    const f = functor as unknown as Record<string, unknown>;
    const fn = f[method];
    if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, this);
    // C++ FunctorInterface default: VisitDot -> VisitLayerElement -> ... -> VisitObject.
    if (typeof f['VisitObject'] === 'function') {
      return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public Accept(functor: Functor): FunctorCode { return this.visit(functor, 'VisitDot'); }
  public AcceptConst(functor: Functor): FunctorCode { return this.visit(functor, 'VisitDot'); }
  public AcceptEnd(functor: Functor): FunctorCode { return this.visit(functor, 'VisitDotEnd'); }
  public AcceptEndConst(functor: Functor): FunctorCode { return this.visit(functor, 'VisitDotEnd'); }
}

ObjectFactory.GetInstance().Register('dot', ClassId.DOT, () => new Dot());
