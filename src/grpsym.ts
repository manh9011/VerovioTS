/**
 * Pure TypeScript translation of Verovio's `src/grpsym.cpp` / `include/vrv/grpsym.h`.
 *
 * `GrpSym` represents an MEI `<grpSym>` element (a group symbol for staff
 * grouping, e.g. a brace or bracket).
 *
 * C++ multiple inheritance (Object + AttColor + AttGrpSymLog +
 * AttStaffGroupingSym + AttStartId + AttStartEndId) is represented through
 * explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, VrvObject } from './object.js';
import { InstColor, InstGrpSymLog, InstStaffGroupingSym, InstStartId, InstStartEndId } from './atts_shared.js';

// Canonical libmei att-class ordinals (libmei/dist/attclasses.h).
const ATT_COLOR = 109;
const ATT_GRPSYMLOG = 137;
const ATT_STAFFGROUPINGSYM = 202;
const ATT_STARTID = 208;
const ATT_STARTENDID = 207;

/** Structural contract for the StaffDef collaborators of GrpSym. */
export interface StaffDefLike {
  SetGrpSymStart?(start: GrpSym): void;
  SetGrpSymEnd?(end: GrpSym): void;
  GetGrpSymStart?(): GrpSym | null;
  GetGrpSymEnd?(): GrpSym | null;
}

/** Pure TypeScript translation of Verovio's `GrpSym` element. */
export class GrpSym extends VrvObject {
  private color: InstColor | null = null;
  private grpSymLog: InstGrpSymLog | null = null;
  private staffGroupingSym: InstStaffGroupingSym | null = null;
  private startId: InstStartId | null = null;
  private startEndId: InstStartEndId | null = null;

  private m_startDef: StaffDefLike | null = null;
  private m_endDef: StaffDefLike | null = null;

  public constructor() {
    super(ClassId.GRPSYM);
    this.color = new InstColor();
    this.grpSymLog = new InstGrpSymLog();
    this.staffGroupingSym = new InstStaffGroupingSym();
    this.startId = new InstStartId();
    this.startEndId = new InstStartEndId();

    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_GRPSYMLOG);
    this.RegisterAttClass(ATT_STAFFGROUPINGSYM);
    this.RegisterAttClass(ATT_STARTID);
    this.RegisterAttClass(ATT_STARTENDID);

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.color ??= new InstColor();
    this.grpSymLog ??= new InstGrpSymLog();
    this.staffGroupingSym ??= new InstStaffGroupingSym();
    this.startId ??= new InstStartId();
    this.startEndId ??= new InstStartEndId();

    this.color.ResetColor();
    this.grpSymLog.ResetGrpSymLog();
    this.staffGroupingSym.ResetStaffGroupingSym();
    this.startId.ResetStartId();
    this.startEndId.ResetStartEndId();

    this.m_startDef = null;
    this.m_endDef = null;
  }

  public override GetClassName(): string {
    return 'grpSym';
  }

  // GrpSym drawing position (C++ hard-codes 0 for both).
  public GetDrawingX(): number {
    this.m_cachedDrawingX = 0;
    return this.m_cachedDrawingX;
  }

  public GetDrawingY(): number {
    this.m_cachedDrawingY = 0;
    return this.m_cachedDrawingX;
  }

  // startDef / endDef setters/getters.
  public SetStartDef(start: StaffDefLike | null): void {
    if (start) this.m_startDef = start;
  }

  public GetStartDef(): StaffDefLike | null {
    return this.m_startDef;
  }

  public SetEndDef(end: StaffDefLike | null): void {
    if (end) this.m_endDef = end;
  }

  public GetEndDef(): StaffDefLike | null {
    return this.m_endDef;
  }

  // AttColor forwarding.
  public SetColor(value: any): void { this.color!.SetColor(value); }
  public GetColor(): any { return this.color!.GetColor(); }
  public HasColor(): boolean { return this.color!.HasColor(); }
  public ResetColor(): void { this.color!.ResetColor(); }

  // AttGrpSymLog forwarding.
  public SetLevel(value: any): void { this.grpSymLog!.SetLevel(value); }
  public GetLevel(): any { return this.grpSymLog!.GetLevel(); }
  public HasLevel(): boolean { return this.grpSymLog!.HasLevel(); }
  public ResetGrpSymLog(): void { this.grpSymLog!.ResetGrpSymLog(); }

  // AttStaffGroupingSym forwarding.
  public SetSymbol(value: any): void { this.staffGroupingSym!.SetSymbol(value); }
  public GetSymbol(): any { return this.staffGroupingSym!.GetSymbol(); }
  public HasSymbol(): boolean { return this.staffGroupingSym!.HasSymbol(); }
  public ResetStaffGroupingSym(): void { this.staffGroupingSym!.ResetStaffGroupingSym(); }

  // AttStartId forwarding.
  public SetStartid(value: string): void { this.startId!.SetStartid(value); }
  public GetStartid(): string { return this.startId!.GetStartid(); }
  public HasStartid(): boolean { return this.startId!.HasStartid(); }
  public ResetStartId(): void { this.startId!.ResetStartId(); }

  // AttStartEndId forwarding.
  public SetEndid(value: string): void { this.startEndId!.SetEndid(value); }
  public GetEndid(): string { return this.startEndId!.GetEndid(); }
  public HasEndid(): boolean { return this.startEndId!.HasEndid(); }
  public ResetStartEndId(): void { this.startEndId!.ResetStartEndId(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitGrpSym');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitGrpSym');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitGrpSymEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitGrpSymEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public Clone(): GrpSym {
    const clone = new GrpSym();
    clone.AssignFrom(this);
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasLevel()) clone.SetLevel(this.GetLevel());
    if (this.HasSymbol()) clone.SetSymbol(this.GetSymbol());
    if (this.HasStartid()) clone.SetStartid(this.GetStartid());
    if (this.HasEndid()) clone.SetEndid(this.GetEndid());
    clone.SetStartDef(this.GetStartDef());
    clone.SetEndDef(this.GetEndDef());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('grpSym', ClassId.GRPSYM, () => new GrpSym());
