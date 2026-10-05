import { ObjectFactory, VrvObject } from './object.js';
import { ControlElement } from './controlelement.js';
import { ClassId, FunctorCode, InterfaceId } from './vrvdef.js';
import { PlistInterface, PlistObjectLike } from './plistinterface.js';
import { TimePointInterface, TimeSpanningInterface } from './timeinterface.js';
import type { Doc } from './doc.js';

/** Pure TypeScript translation of Verovio's src/annotscore.cpp / annotscore.h. */
export class AnnotScore extends ControlElement {
  private plistInterface: PlistInterface | undefined;
  private timeSpanningInterface: TimeSpanningInterface | undefined;

  public constructor() {
    super(ClassId.ANNOTSCORE);
    this.plistInterface = new PlistInterface();
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.RegisterInterface(this.plistInterface.GetAttClasses(), this.plistInterface.IsInterface());
    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.plistInterface ??= new PlistInterface();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.plistInterface.Reset();
    this.timeSpanningInterface.Reset();
  }

  public override Clone(): AnnotScore {
    const clone = new AnnotScore();
    clone.AssignFrom(this);
    return clone;
  }

  public override GetClassName(): string { return 'annot'; }

  public GetPlistInterface(): PlistInterface {
    this.plistInterface ??= new PlistInterface();
    return this.plistInterface;
  }

  public GetTimePointInterface(): TimePointInterface {
    return this.GetTimeSpanningInterface();
  }

  public GetTimeSpanningInterface(): TimeSpanningInterface {
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    return this.timeSpanningInterface;
  }

  public GetBoxHeight(doc: Doc, unit: number): number {
    return doc.GetOptions().m_octaveLineThickness.GetValue() * unit * 10;
  }

  public GetLineWidth(doc: Doc, unit: number): number {
    return doc.GetOptions().m_octaveLineThickness.GetValue() * unit * 2;
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.ANNOTSCORE) return true;
    return VrvObject.IsTextElement(classId);
  }

  public override Accept(functor: any): FunctorCode { return functor.VisitAnnotScore(this); }
  public AcceptConst(functor: any): FunctorCode { return functor.VisitAnnotScore(this); }
  public override AcceptEnd(functor: any): FunctorCode { return functor.VisitAnnotScoreEnd(this); }
  public AcceptEndConst(functor: any): FunctorCode { return functor.VisitAnnotScoreEnd(this); }
}

ObjectFactory.GetInstance().Register('annotScore', ClassId.ANNOTSCORE, () => new AnnotScore());
