import { ClassId, FunctorCode } from './vrvdef.js';
import { VrvObject } from './object.js';
import { ObjectFactory } from './object.js';
import { ControlElement } from './controlelement.js';
import { TextDirInterface } from './textdirinterface.js';
import { TimePointInterface } from './timeinterface.js';
import { InstLang, InstVerticalGroup } from './atts_shared.js';

// Canonical libmei att-class ordinals used by the C++ RegisterAttClass calls.
const ATT_LANG = 146;
const ATT_VERTICALGROUP = 227;

/** Pure TypeScript translation of Verovio's src/reh.cpp / include/vrv/reh.h. */
export class Reh extends ControlElement {
  private textDirInterface: TextDirInterface | null = null;
  private timePointInterface: TimePointInterface | null = null;
  private lang: InstLang | null = null;
  private verticalGroup: InstVerticalGroup | null = null;

  public constructor() {
    super(ClassId.REH);
    this.textDirInterface = new TextDirInterface();
    this.timePointInterface = new TimePointInterface();
    this.lang = new InstLang();
    this.verticalGroup = new InstVerticalGroup();
    this.RegisterInterface(this.textDirInterface.GetAttClasses(), this.textDirInterface.IsInterface());
    this.RegisterInterface(this.timePointInterface.GetAttClasses(), this.timePointInterface.IsInterface());
    this.RegisterAttClass(ATT_LANG);
    this.RegisterAttClass(ATT_VERTICALGROUP);
    // The TS base constructor dispatched the overridden Reset() before these
    // fields were initialized; run it again now that the full object exists.
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.textDirInterface ??= new TextDirInterface();
    this.timePointInterface ??= new TimePointInterface();
    this.lang ??= new InstLang();
    this.verticalGroup ??= new InstVerticalGroup();
    this.textDirInterface.Reset();
    this.timePointInterface.Reset();
    this.lang.ResetLang();
    this.verticalGroup.ResetVerticalGroup();
  }

  public override GetClassName(): string { return 'reh'; }

  public GetTextDirInterface(): TextDirInterface {
    this.textDirInterface ??= new TextDirInterface();
    return this.textDirInterface;
  }

  public GetTimePointInterface(): TimePointInterface {
    this.timePointInterface ??= new TimePointInterface();
    return this.timePointInterface;
  }

  // TextDirInterface facade (C++ Reh : public TextDirInterface; FloatingPositioner reads GetPlace() directly).
  public SetPlace(v: number): void { this.GetTextDirInterface().SetPlace(v as never); }
  public GetPlace(): number { return this.GetTextDirInterface().GetPlace(); }
  public HasPlace(): boolean { return this.GetTextDirInterface().HasPlace(); }
  // TimePointInterface facade (C++ Reh : public TimePointInterface).
  public SetStaff(v: number[]): void { this.GetTimePointInterface().SetStaff(v); }
  public GetStaff(): number[] { return this.GetTimePointInterface().GetStaff(); }
  public HasStaff(): boolean { return this.GetTimePointInterface().HasStaff(); }
  public SetStartid(v: string): void { this.GetTimePointInterface().SetStartid(v); }
  public GetStartid(): string { return this.GetTimePointInterface().GetStartid(); }
  public HasStartid(): boolean { return this.GetTimePointInterface().HasStartid(); }
  public SetTstamp(v: number): void { this.GetTimePointInterface().SetTstamp(v); }
  public GetTstamp(): number { return this.GetTimePointInterface().GetTstamp(); }
  public HasTstamp(): boolean { return this.GetTimePointInterface().HasTstamp(); }
  // C++ TimePointInterface::SetStart — PrepareRehPositionFunctor anchors reh to barline.
  public SetStart(v: unknown): void { this.GetTimePointInterface().SetStart(v as never); }
  public GetStart(): unknown { return this.GetTimePointInterface().GetStart(); }
  public HasStart(): boolean { return this.GetTimePointInterface().HasStart(); }
  public GetTstampStaves(measure: unknown, object: unknown): unknown[] { return this.GetTimePointInterface().GetTstampStaves(measure as never, object as never); }

  /** Add an element (text, rend. etc.) to a reh. Only supported elements will be actually added to the child list. */
  public override IsSupportedChild(classId: ClassId): boolean {
    switch (classId) {
      case ClassId.LB:
      case ClassId.REND:
      case ClassId.TEXT:
        return true;
      default:
        return VrvObject.IsEditorialElement(classId);
    }
  }

  // AttLang forwarding
  public ResetLang(): void { this.lang!.ResetLang(); }
  public SetLang(value: string): void { this.lang!.SetLang(value); }
  public GetLang(): string { return this.lang!.GetLang(); }
  public HasLang(): boolean { return this.lang!.HasLang(); }
  public SetTranslit(value: string): void { this.lang!.SetTranslit(value); }
  public GetTranslit(): string { return this.lang!.GetTranslit(); }
  public HasTranslit(): boolean { return this.lang!.HasTranslit(); }

  // AttVerticalGroup forwarding
  public ResetVerticalGroup(): void { this.verticalGroup!.ResetVerticalGroup(); }
  public SetVgrp(value: number): void { this.verticalGroup!.SetVgrp(value); }
  public GetVgrp(): number { return this.verticalGroup!.GetVgrp(); }
  public HasVgrp(): boolean { return this.verticalGroup!.HasVgrp(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitReh');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitReh');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitRehEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitRehEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Reh {
    const clone = new Reh();
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
    if (this.HasLang()) clone.SetLang(this.GetLang());
    if (this.HasTranslit()) clone.SetTranslit(this.GetTranslit());
    if (this.HasVgrp()) clone.SetVgrp(this.GetVgrp());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('reh', ClassId.REH, () => new Reh());

// Ensure the factory registration survives module tree-shaking side effects.
export const __rehRegistered = true;
