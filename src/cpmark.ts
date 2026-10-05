import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, VrvObject, TextListInterface } from './object.js';
import { ControlElement } from './controlelement.js';
import { TextDirInterface } from './textdirinterface.js';
import { TimeSpanningInterface } from './timeinterface.js';

/** Pure TypeScript translation of Verovio's src/cpmark.cpp / include/vrv/cpmark.h. */
export class CpMark extends ControlElement {
  private textListInterface: TextListInterface | null = null;
  private textDirInterface: TextDirInterface | null = null;
  private timeSpanningInterface: TimeSpanningInterface | null = null;

  public constructor() {
    super(ClassId.CPMARK);
    this.textListInterface = new TextListInterface();
    this.textDirInterface = new TextDirInterface();
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.RegisterInterface(this.textDirInterface.GetAttClasses(), this.textDirInterface.IsInterface());
    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());
    // C++ multiple inheritance: TextListInterface is mixed into the CpMark;
    // bind the composed list interface to this object as its owner.
    this.textListInterface.SetInterfaceOwner(this as unknown as VrvObject);
    // The TS base constructor dispatched the overridden Reset() before these
    // fields were initialized; run it again now that the full object exists.
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.textListInterface ??= new TextListInterface();
    this.textDirInterface ??= new TextDirInterface();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.textListInterface.SetInterfaceOwner(this as unknown as VrvObject);
    this.textDirInterface.Reset();
    this.timeSpanningInterface.Reset();
  }

  public override GetClassName(): string { return 'cpMark'; }

  public GetTextDirInterface(): TextDirInterface {
    this.textDirInterface ??= new TextDirInterface();
    return this.textDirInterface;
  }

  public GetTimeSpanningInterface(): TimeSpanningInterface {
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    return this.timeSpanningInterface;
  }

  /** TimeSpanningInterface extends TimePointInterface in C++ (and here). */
  public GetTimePointInterface(): TimeSpanningInterface {
    return this.GetTimeSpanningInterface();
  }

  /** Add an element (text, rend. etc.) to a cpMark. Only supported elements will be actually added to the child list. */
  public override IsSupportedChild(classId: ClassId): boolean {
    switch (classId) {
      case ClassId.LB:
      case ClassId.REND:
      case ClassId.SYMBOL:
      case ClassId.TEXT:
        return true;
      default:
        return VrvObject.IsEditorialElement(classId);
    }
  }

  // TextListInterface facade (C++ inherits the list interface; TS composes it).
  public GetList(): any[] { return this.textListInterface!.GetList(); }
  public GetListSize(): number { return this.textListInterface!.GetListSize(); }
  public GetText(): string { return this.textListInterface!.GetText(); }
  public GetTextLines(lines: string[]): void { this.textListInterface!.GetTextLines(lines); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitCpMark');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitCpMark');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitCpMarkEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitCpMarkEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): CpMark {
    const clone = new CpMark();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all interface members.
    const td = this.GetTextDirInterface();
    const ctd = clone.GetTextDirInterface();
    if (td.HasPlace()) ctd.SetPlace(td.GetPlace());
    const ts = this.GetTimeSpanningInterface();
    const cts = clone.GetTimeSpanningInterface();
    if (ts.HasPart()) cts.SetPart(ts.GetPart());
    if (ts.HasStaff()) cts.SetStaff(ts.GetStaff());
    if (ts.HasStartid()) cts.SetStartid(ts.GetStartid());
    if (ts.HasTstamp()) cts.SetTstamp(ts.GetTstamp());
    if (ts.HasEndid()) cts.SetEndid(ts.GetEndid());
    if (ts.HasTstamp2()) cts.SetTstamp2(ts.GetTstamp2());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('cpMark', ClassId.CPMARK, () => new CpMark());
