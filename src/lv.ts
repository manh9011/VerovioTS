/**
 * Pure TypeScript translation of Verovio's `src/lv.cpp` / `include/vrv/lv.h`.
 *
 * `Lv` models the MEI `<lv>` (laissez vibrer) element, deriving from `Tie`.
 */
import { ClassId, FunctorCode, SpanningType } from './vrvdef.js';
import { Tie } from './tie.js';
import { ObjectFactory } from './object.js';
import { Point } from './devicecontextbase.js';
import { LogWarning } from './vrv.js';

export class Lv extends Tie {
  public constructor() {
    super(ClassId.LV);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
  }

  public override GetClassName(): string {
    return 'lv';
  }

  public override CalculatePosition(
    doc: any,
    staff: any,
    x1: number,
    x2: number,
    spanningType: number,
    bezier: Point[]
  ): boolean {
    if (spanningType !== SpanningType.SPANNING_START_END) {
      LogWarning('Lv across systems is not supported. Use <tie> instead.');
      return false;
    }

    const start = this.GetStart();
    const end = this.GetEnd();
    if (!start || !end) {
      return false;
    }

    if (start.GetFirstAncestor?.(ClassId.MEASURE) !== end.GetFirstAncestor?.(ClassId.MEASURE)) {
      LogWarning('Lv across measures is not supported. Use <tie> instead.');
      return false;
    }

    return super.CalculatePosition(doc, staff, x1, x2, spanningType, bezier);
  }

  public override Accept(functor: any): FunctorCode {
    return this.visitLv(functor, 'VisitLv');
  }

  public override AcceptConst(functor: any): FunctorCode {
    return this.visitLv(functor, 'VisitLv');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visitLv(functor, 'VisitLvEnd');
  }

  public override AcceptEndConst(functor: any): FunctorCode {
    return this.visitLv(functor, 'VisitLvEnd');
  }

  private visitLv(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitTie === 'function') return functor.VisitTie(this);
    if (typeof functor.VisitControlElement === 'function') return functor.VisitControlElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): Lv {
    const clone = new Lv();
    clone.AssignFrom(this);

    if (this.HasCurvedir()) clone.SetCurvedir(this.GetCurvedir());
    if (this.HasLform()) clone.SetLform(this.GetLform());
    if (this.HasLwidth()) clone.SetLwidth(this.GetLwidth());
    if (this.HasLsegs()) clone.SetLsegs(this.GetLsegs());

    if (this.HasEndho()) clone.SetEndho(this.GetEndho());
    if (this.HasEndvo()) clone.SetEndvo(this.GetEndvo());
    if (this.HasStartho()) clone.SetStartho(this.GetStartho());
    if (this.HasStartvo()) clone.SetStartvo(this.GetStartvo());

    if (this.HasStartid()) clone.SetStartid(this.GetStartid());
    if (this.HasEndid()) clone.SetEndid(this.GetEndid());
    if (this.HasTstamp()) clone.SetTstamp(this.GetTstamp());
    if (this.HasTstamp2()) clone.SetTstamp2(this.GetTstamp2());
    if (this.HasStaff()) clone.SetStaff(this.GetStaff());
    if (this.HasPart()) clone.SetPart(this.GetPart());

    return clone;
  }
}

ObjectFactory.GetInstance().Register('lv', ClassId.LV, () => new Lv());
