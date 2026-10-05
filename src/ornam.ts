import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, VrvObject, TextListInterface } from './object.js';
import { ControlElement } from './controlelement.js';
import { TextDirInterface } from './textdirinterface.js';
import { TimePointInterface } from './timeinterface.js';
import { InstOrnamentAccid } from './atts_cmnornaments.js';

// Canonical libmei att-class ordinals used by the C++ RegisterAttClass calls.
const ATT_ORNAMENTACCID = 41;

/** Pure TypeScript translation of Verovio's src/ornam.cpp / include/vrv/ornam.h. */
export class Ornam extends ControlElement {
  private textListInterface: TextListInterface | null = null;
  private textDirInterface: TextDirInterface | null = null;
  private timePointInterface: TimePointInterface | null = null;
  private ornamentAccid: InstOrnamentAccid | null = null;

  public constructor() {
    super(ClassId.ORNAM);
    this.textListInterface = new TextListInterface();
    this.textDirInterface = new TextDirInterface();
    this.timePointInterface = new TimePointInterface();
    this.ornamentAccid = new InstOrnamentAccid();
    this.RegisterInterface(this.textDirInterface.GetAttClasses(), this.textDirInterface.IsInterface());
    this.RegisterInterface(this.timePointInterface.GetAttClasses(), this.timePointInterface.IsInterface());
    this.RegisterAttClass(ATT_ORNAMENTACCID);
    // C++ multiple inheritance: TextListInterface is mixed into the Ornam; bind
    // the composed list interface to this object as its owner.
    this.textListInterface.SetInterfaceOwner(this as unknown as VrvObject);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.textDirInterface ??= new TextDirInterface();
    this.timePointInterface ??= new TimePointInterface();
    this.ornamentAccid ??= new InstOrnamentAccid();
    this.textDirInterface.Reset();
    this.timePointInterface.Reset();
    this.ornamentAccid.ResetOrnamentAccid();
  }

  public override GetClassName(): string { return 'ornam'; }

  public GetTextDirInterface(): TextDirInterface {
    this.textDirInterface ??= new TextDirInterface();
    return this.textDirInterface;
  }

  public GetTimePointInterface(): TimePointInterface {
    this.timePointInterface ??= new TimePointInterface();
    return this.timePointInterface;
  }

  /** Add an element (text, rend. etc.) to a ornam. Only supported elements will be actually added to the child list. */
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
  // The component is explicitly bound to this Ornam as its owner.
  public GetList(): any[] { return this.textListInterface!.GetList(); }
  public GetListSize(): number { return this.textListInterface!.GetListSize(); }
  public GetText(): string { return this.textListInterface!.GetText(); }
  public GetTextLines(lines: string[]): void { this.textListInterface!.GetTextLines(lines); }

  // AttOrnamentAccid forwarding
  public ResetOrnamentAccid(): void { this.ornamentAccid!.ResetOrnamentAccid(); }
  public SetAccidupper(value: number): void { this.ornamentAccid!.SetAccidupper(value); }
  public GetAccidupper(): number { return this.ornamentAccid!.GetAccidupper(); }
  public HasAccidupper(): boolean { return this.ornamentAccid!.HasAccidupper(); }
  public SetAccidlower(value: number): void { this.ornamentAccid!.SetAccidlower(value); }
  public GetAccidlower(): number { return this.ornamentAccid!.GetAccidlower(); }
  public HasAccidlower(): boolean { return this.ornamentAccid!.HasAccidlower(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitOrnam');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitOrnam');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitOrnamEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitOrnamEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Ornam {
    const clone = new Ornam();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all interface/attribute members.
    const td = this.GetTextDirInterface();
    const ctd = clone.GetTextDirInterface();
    if (td.HasPlace()) ctd.SetPlace(td.GetPlace());
    const tp = this.GetTimePointInterface();
    const ctp = clone.GetTimePointInterface();
    if (tp.HasPart()) ctp.SetPart(tp.GetPart());
    if (tp.HasStaff()) ctp.SetStaff(tp.GetStaff());
    if (tp.HasStartid()) ctp.SetStartid(tp.GetStartid());
    if (tp.HasTstamp()) ctp.SetTstamp(tp.GetTstamp());
    if (this.HasAccidupper()) clone.SetAccidupper(this.GetAccidupper());
    if (this.HasAccidlower()) clone.SetAccidlower(this.GetAccidlower());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('ornam', ClassId.ORNAM, () => new Ornam());
