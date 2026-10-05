import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, VrvObject, TextListInterface } from './object.js';
import { ControlElement } from './controlelement.js';
import { TextDirInterface } from './textdirinterface.js';
import { TimePointInterface, TimeSpanningInterface } from './timeinterface.js';
import { InstExtender, InstLang, InstLineRendBase, InstVerticalGroup } from './atts_shared.js';

// Canonical libmei AttClassId ordinals (libmei/dist/attclasses.h).
const ATT_LANG = 146;
const ATT_EXTENDER = 132;
const ATT_LINERENDBASE = 151;
const ATT_VERTICALGROUP = 227;

// data_BOOLEAN ordinals from the converter layer (see attconverter.ts).
const BOOLEAN_true = 1;

/** Pure TypeScript translation of Verovio's src/dir.cpp / include/vrv/dir.h. */
export class Dir extends ControlElement {
  private textListInterface: TextListInterface | null = null;
  private textDirInterface: TextDirInterface | null = null;
  private timeSpanningInterface: TimeSpanningInterface | null = null;
  private attExtender: InstExtender | null = null;
  private attLang: InstLang | null = null;
  private attLineRendBase: InstLineRendBase | null = null;
  private attVerticalGroup: InstVerticalGroup | null = null;
  /** stageDir flag */
  private m_isStageDir = false;

  constructor(isStageDir = false) {
    super(ClassId.DIR);
    this.textListInterface = new TextListInterface();
    this.textDirInterface = new TextDirInterface();
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.attExtender = new InstExtender();
    this.attLang = new InstLang();
    this.attLineRendBase = new InstLineRendBase();
    this.attVerticalGroup = new InstVerticalGroup();
    this.RegisterInterface(this.textDirInterface.GetAttClasses(), this.textDirInterface.IsInterface());
    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());
    this.RegisterAttClass(ATT_LANG);
    this.RegisterAttClass(ATT_EXTENDER);
    this.RegisterAttClass(ATT_LINERENDBASE);
    this.RegisterAttClass(ATT_VERTICALGROUP);
    // C++ multiple inheritance: TextListInterface is mixed into the Dir; bind
    // the composed list interface to this object as its owner.
    this.textListInterface.SetInterfaceOwner(this as unknown as VrvObject);
    this.Reset();
    this.SetStageDir(isStageDir);
  }

  override Reset(): void {
    super.Reset();
    this.textDirInterface ??= new TextDirInterface();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.attExtender ??= new InstExtender();
    this.attLang ??= new InstLang();
    this.attLineRendBase ??= new InstLineRendBase();
    this.attVerticalGroup ??= new InstVerticalGroup();
    this.textDirInterface.Reset();
    this.timeSpanningInterface.Reset();
    this.attExtender.ResetExtender();
    this.attLang.ResetLang();
    this.attLineRendBase.ResetLineRendBase();
    this.attVerticalGroup.ResetVerticalGroup();
    this.m_isStageDir = false;
  }

  override GetClassName(): string { return this.IsStageDir() ? 'stageDir' : 'dir'; }

  GetTextDirInterface(): TextDirInterface {
    this.textDirInterface ??= new TextDirInterface();
    return this.textDirInterface;
  }

  GetTimePointInterface(): TimePointInterface {
    return this.GetTimeSpanningInterface();
  }

  GetTimeSpanningInterface(): TimeSpanningInterface {
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    return this.timeSpanningInterface;
  }

  GetStart() { return this.GetTimeSpanningInterface().GetStart(); }
  SetStart(start: any) { this.GetTimeSpanningInterface().SetStart(start); }
  GetEnd() { return this.GetTimeSpanningInterface().GetEnd(); }
  SetEnd(end: any) { this.GetTimeSpanningInterface().SetEnd(end); }

  IsStageDir(): boolean { return this.m_isStageDir; }
  SetStageDir(isStageDir: boolean): void { this.m_isStageDir = isStageDir; }

  override IsSupportedChild(classId: ClassId): boolean {
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

  /** See FloatingObject::IsExtenderElement */
  IsExtenderElement(): boolean { return this.GetExtender() === BOOLEAN_true; }

  // TextListInterface facade (C++ inherits the list interface; TS composes it).
  // The component is explicitly bound to this Dir as its owner.
  GetList(): any[] { return this.textListInterface!.GetList(); }
  GetListSize(): number { return this.textListInterface!.GetListSize(); }
  GetText(): string { return this.textListInterface!.GetText(); }
  GetTextLines(lines: string[]): void { this.textListInterface!.GetTextLines(lines); }

  // AttExtender forwarding
  SetExtender(value: any): void { this.attExtender!.SetExtender(value); }
  GetExtender(): any { return this.attExtender!.GetExtender(); }
  HasExtender(): boolean { return this.attExtender!.HasExtender(); }
  ResetExtender(): void { this.attExtender!.ResetExtender(); }

  // AttLang forwarding
  SetLang(value: any): void { this.attLang!.SetLang(value); }
  GetLang(): any { return this.attLang!.GetLang(); }
  HasLang(): boolean { return this.attLang!.HasLang(); }
  SetTranslit(value: any): void { this.attLang!.SetTranslit(value); }
  GetTranslit(): any { return this.attLang!.GetTranslit(); }
  HasTranslit(): boolean { return this.attLang!.HasTranslit(); }
  ResetLang(): void { this.attLang!.ResetLang(); }

  // AttLineRendBase forwarding
  SetLform(value: any): void { this.attLineRendBase!.SetLform(value); }
  GetLform(): any { return this.attLineRendBase!.GetLform(); }
  HasLform(): boolean { return this.attLineRendBase!.HasLform(); }
  SetLwidth(value: any): void { this.attLineRendBase!.SetLwidth(value); }
  GetLwidth(): any { return this.attLineRendBase!.GetLwidth(); }
  HasLwidth(): boolean { return this.attLineRendBase!.HasLwidth(); }
  SetLsegs(value: any): void { this.attLineRendBase!.SetLsegs(value); }
  GetLsegs(): any { return this.attLineRendBase!.GetLsegs(); }
  HasLsegs(): boolean { return this.attLineRendBase!.HasLsegs(); }
  ResetLineRendBase(): void { this.attLineRendBase!.ResetLineRendBase(); }

  // AttVerticalGroup forwarding
  SetVgrp(value: any): void { this.attVerticalGroup!.SetVgrp(value); }
  GetVgrp(): any { return this.attVerticalGroup!.GetVgrp(); }
  HasVgrp(): boolean { return this.attVerticalGroup!.HasVgrp(); }
  ResetVerticalGroup(): void { this.attVerticalGroup!.ResetVerticalGroup(); }

  // Interface forwardings
  SetPlace(value: any): void { this.GetTextDirInterface().SetPlace(value); }
  GetPlace(): any { return this.GetTextDirInterface().GetPlace(); }
  HasPlace(): boolean { return this.GetTextDirInterface().HasPlace(); }
  SetStartid(value: string): void { this.GetTimeSpanningInterface().SetStartid(value); }
  GetStartid(): string { return this.GetTimeSpanningInterface().GetStartid(); }
  HasStartid(): boolean { return this.GetTimeSpanningInterface().HasStartid(); }
  SetTstamp(value: number): void { this.GetTimeSpanningInterface().SetTstamp(value); }
  GetTstamp(): number { return this.GetTimeSpanningInterface().GetTstamp(); }
  HasTstamp(): boolean { return this.GetTimeSpanningInterface().HasTstamp(); }
  SetStaff(v: number[]): void { this.GetTimeSpanningInterface().SetStaff(v); }
  GetStaff(): number[] { return this.GetTimeSpanningInterface().GetStaff(); }
  HasStaff(): boolean { return this.GetTimeSpanningInterface().HasStaff(); }
  // C++ Dir : TimeSpanningInterface — complete forwarder chain (iomusxml 31a uses SetTstamp2).
  SetTstamp2(v: [number, number]): void { this.GetTimeSpanningInterface().SetTstamp2(v as never); }
  GetTstamp2(): unknown { return this.GetTimeSpanningInterface().GetTstamp2(); }
  HasTstamp2(): boolean { return this.GetTimeSpanningInterface().HasTstamp2(); }
  HasStart(): boolean { return this.GetTimeSpanningInterface().HasStart(); }
  HasStartAndEnd(): boolean { return this.GetTimeSpanningInterface().HasStartAndEnd(); }

  override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitDir');
  }

  AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitDir');
  }

  override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitDirEnd');
  }

  AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitDirEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  override Clone(): Dir {
    const clone = new Dir();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all interface/attribute members + stageDir flag.
    clone.SetStageDir(this.IsStageDir());
    const td = this.GetTextDirInterface();
    const ctd = clone.GetTextDirInterface();
    if (td.HasPlace()) ctd.SetPlace(td.GetPlace());
    const ts = this.GetTimeSpanningInterface();
    const cts = clone.GetTimeSpanningInterface();
    if (ts.HasStartid()) cts.SetStartid(ts.GetStartid());
    if (ts.HasEndid()) cts.SetEndid(ts.GetEndid());
    if (ts.HasTstamp()) cts.SetTstamp(ts.GetTstamp());
    if (ts.HasTstamp2()) cts.SetTstamp2(ts.GetTstamp2());
    clone.SetExtender(this.GetExtender());
    clone.SetLang(this.GetLang());
    clone.SetTranslit(this.GetTranslit());
    clone.SetLform(this.GetLform());
    clone.SetLwidth(this.GetLwidth());
    clone.SetLsegs(this.GetLsegs());
    clone.SetVgrp(this.GetVgrp());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('dir', ClassId.DIR, () => new Dir());
ObjectFactory.GetInstance().Register('stageDir', ClassId.FACTORY_STAGEDIR, () => new Dir(true));
