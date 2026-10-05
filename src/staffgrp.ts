/**
 * Pure TypeScript translation of Verovio's `StaffGrp`
 * (`src-cpp/src/staffgrp.cpp` + `src-cpp/include/vrv/staffgrp.h`).
 *
 * C++ has `StaffGrp` inherit `Object` + `ObjectListInterface` + seven
 * generated libMEI attribute classes; TypeScript models the multiple
 * inheritance with composition (the ObjectListInterface composition keeps
 * `GetList()` filtering to STAFFDEF children only, as in the C++
 * `FilterList` override).
 */
import { ClassId, FunctorCode, VisibilityOptimization } from './vrvdef.js';
import { ObjectFactory, ObjectListInterface, VrvObject } from './object.js';
import { InstBarring, InstBasic, InstLabelled, InstNNumberLike, InstStaffGroupingSym, InstTyped } from './atts_shared.js';
import { InstStaffGrpVis } from './atts_visual.js';
import { GrpSym } from './grpsym.js';
import { StaffDef } from './staffdef.js';
import { Label } from './label.js';
import { LabelAbbr } from './labelabbr.js';

/** Structural contract for staffDef children accessed through the list. */
interface StaffDefLike {
  GetDrawingVisibility(): VisibilityOptimization;
  SetDrawingVisibility(v: VisibilityOptimization): void;
  HasScale(): boolean;
  GetScale(): number;
}

/** ObjectListInterface composition: keep only STAFFDEF children. */
class StaffGrpListInterface extends ObjectListInterface {
  protected override FilterList(childList: VrvObject[]): void {
    // We want to keep only staffDef
    for (let i = 0; i < childList.length;) {
      if (!childList[i].Is(ClassId.STAFFDEF)) childList.splice(i, 1);
      else ++i;
    }
  }
}

/** Pure TypeScript translation of Verovio's `StaffGrp`. */
export class StaffGrp extends VrvObject {
  private readonly objectList: StaffGrpListInterface;
  private attBarring: InstBarring | null = null;
  private attBasic: InstBasic | null = null;
  private attLabelled: InstLabelled | null = null;
  private attNNumberLike: InstNNumberLike | null = null;
  private attStaffGroupingSym: InstStaffGroupingSym | null = null;
  private attStaffGrpVis: InstStaffGrpVis | null = null;
  private attTyped: InstTyped | null = null;
  private m_drawingVisibility: VisibilityOptimization = VisibilityOptimization.OPTIMIZATION_NONE;
  private m_groupSymbol: GrpSym | null = null;

  public constructor() {
    super(ClassId.STAFFGRP);
    this.objectList = new StaffGrpListInterface();
    this.objectList.SetInterfaceOwner(this as unknown as VrvObject);
    this.ensureAttributes();
    this.RegisterAttClass(ATT_BARRING);
    this.RegisterAttClass(ATT_BASIC);
    this.RegisterAttClass(ATT_LABELLED);
    this.RegisterAttClass(ATT_NNUMBERLIKE);
    this.RegisterAttClass(ATT_STAFFGROUPINGSYM);
    this.RegisterAttClass(ATT_STAFFGRPVIS);
    this.RegisterAttClass(ATT_TYPED);
    this.Reset();
  }

  public override GetClassName(): string { return 'staffGrp'; }

  public override Reset(): void {
    super.Reset();
    this.attBarring?.ResetBarring();
    this.attBasic?.ResetBasic();
    this.attLabelled?.ResetLabelled();
    this.attNNumberLike?.ResetNNumberLike();
    this.attStaffGroupingSym?.ResetStaffGroupingSym();
    this.attStaffGrpVis?.ResetStaffGrpVis();
    this.attTyped?.ResetTyped();

    this.m_drawingVisibility = VisibilityOptimization.OPTIMIZATION_NONE;
    this.m_groupSymbol = null;
  }

  private ensureAttributes(): void {
    this.attBarring ??= new InstBarring();
    this.attBasic ??= new InstBasic();
    this.attLabelled ??= new InstLabelled();
    this.attNNumberLike ??= new InstNNumberLike();
    this.attStaffGroupingSym ??= new InstStaffGroupingSym();
    this.attStaffGrpVis ??= new InstStaffGrpVis();
    this.attTyped ??= new InstTyped();
  }

  //---------//
  // Children //
  //---------//

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [ClassId.GRPSYM, ClassId.INSTRDEF, ClassId.LABEL, ClassId.LABELABBR, ClassId.STAFFDEF, ClassId.STAFFGRP];
    if (supported.includes(classId)) return true;
    if (VrvObject.IsEditorialElement(classId)) return true;
    return false;
  }

  public override GetInsertOrderFor(classId: ClassId): number {
    // Anything else goes at the end
    const s_order: ClassId[] = [ClassId.GRPSYM, ClassId.LABEL, ClassId.LABELABBR, ClassId.INSTRDEF];
    return this.GetInsertOrderForIn(classId, s_order);
  }

  //---------------------------//
  // List facade (staffDefs)   //
  //---------------------------//

  public GetList(): VrvObject[] { return this.objectList.GetList(); }
  public GetListSize(): number { return this.objectList.GetListSize(); }
  public HasEmptyList(): boolean { return this.objectList.HasEmptyList(); }
  public GetListFront(): VrvObject { return this.objectList.GetListFront(); }
  public GetListBack(): VrvObject { return this.objectList.GetListBack(); }
  public ResetList(): void { this.objectList.ResetList(); }

  /**
   * Return the max staff size (100 when the list is empty or unset).
   * Preserves the C++ loop behavior: an unset/low scale resets the running
   * maximum to 100 (the `else` branch in the source).
   */
  public GetMaxStaffSize(): number {
    const childList = this.GetList();
    if (childList.length === 0) return 100;

    let max = 0;
    for (const child of childList) {
      const staffDef = child as unknown as StaffDefLike;
      if (staffDef.HasScale() && staffDef.GetScale() >= max) {
        max = staffDef.GetScale();
      } else {
        max = 100;
      }
    }
    return max;
  }

  /** First/last non-hidden staffDefs (null,null when none). */
  public GetFirstLastStaffDef(): [StaffDef | null, StaffDef | null] {
    const staffDefs = this.GetList();
    if (staffDefs.length === 0) return [null, null];

    let firstDef: StaffDef | null = null;
    for (const child of staffDefs) {
      const staffDef = child as unknown as StaffDefLike;
      if (staffDef.GetDrawingVisibility() !== VisibilityOptimization.OPTIMIZATION_HIDDEN) {
        firstDef = child as unknown as StaffDef;
        break;
      }
    }

    let lastDef: StaffDef | null = null;
    for (let i = staffDefs.length - 1; i >= 0; i--) {
      const staffDef = staffDefs[i] as unknown as StaffDefLike;
      if (staffDef.GetDrawingVisibility() !== VisibilityOptimization.OPTIMIZATION_HIDDEN) {
        lastDef = staffDefs[i] as unknown as StaffDef;
        break;
      }
    }

    return [firstDef, lastDef];
  }

  //---------------------------//
  // Group symbol              //
  //---------------------------//

  public SetGroupSymbol(grpSym: GrpSym | null): void {
    if (grpSym) this.m_groupSymbol = grpSym;
  }
  public GetGroupSymbol(): GrpSym | null { return this.m_groupSymbol; }

  //---------------------------//
  // Label lookup              //
  //---------------------------//

  public HasLabelInfo(): boolean {
    return Boolean(this.FindDescendantByType(ClassId.LABEL, 1));
  }

  public HasLabelAbbrInfo(): boolean {
    return Boolean(this.FindDescendantByType(ClassId.LABELABBR, 1));
  }

  public GetLabel(): Label | null {
    // Always check if HasLabelInfo() is true before asking for it
    const label = this.FindDescendantByType(ClassId.LABEL, 1) as unknown as Label | null;
    if (!label) throw new Error('StaffGrp::GetLabel: label expected (check HasLabelInfo first).');
    return label;
  }

  public GetLabelCopy(): Label {
    // Always check if HasLabelInfo() is true before asking for a clone
    const clone = this.GetLabel()!.Clone() as Label;
    clone.CloneReset();
    return clone;
  }

  public GetLabelAbbr(): LabelAbbr | null {
    // Always check if HasLabelAbbrInfo() is true before asking for it
    const labelAbbr = this.FindDescendantByType(ClassId.LABELABBR, 1) as unknown as LabelAbbr | null;
    if (!labelAbbr) throw new Error('StaffGrp::GetLabelAbbr: labelAbbr expected (check HasLabelAbbrInfo first).');
    return labelAbbr;
  }

  public GetLabelAbbrCopy(): LabelAbbr {
    // Always check if HasLabelAbbrInfo() is true before asking for a clone
    const clone = this.GetLabelAbbr()!.Clone() as LabelAbbr;
    clone.CloneReset();
    return clone;
  }

  //---------------------------//
  // Visibility                //
  //---------------------------//

  public GetDrawingVisibility(): VisibilityOptimization { return this.m_drawingVisibility; }
  public SetDrawingVisibility(v: VisibilityOptimization): void { this.m_drawingVisibility = v; }

  /** Recursively show all staffDefs and nested staffGrps. */
  public SetEverythingVisible(): void {
    this.SetDrawingVisibility(VisibilityOptimization.OPTIMIZATION_SHOW);
    for (const child of this.GetChildrenForModification()) {
      if (child.Is(ClassId.STAFFDEF)) {
        (child as unknown as StaffDefLike).SetDrawingVisibility(VisibilityOptimization.OPTIMIZATION_SHOW);
      } else if (child.Is(ClassId.STAFFGRP)) {
        (child as unknown as StaffGrp).SetEverythingVisible();
      }
    }
  }

  //---------------------------//
  // Attribute facades          //
  //---------------------------//

  public ResetBarring(): void { this.attBarring!.ResetBarring(); }
  public SetBarLen(v: number): void { this.attBarring!.SetBarLen(v); }
  public GetBarLen(): number { return this.attBarring!.GetBarLen(); }
  public HasBarLen(): boolean { return this.attBarring!.HasBarLen(); }
  public SetBarMethod(v: number): void { this.attBarring!.SetBarMethod(v); }
  public GetBarMethod(): number { return this.attBarring!.GetBarMethod(); }
  public HasBarMethod(): boolean { return this.attBarring!.HasBarMethod(); }
  public SetBarPlace(v: number): void { this.attBarring!.SetBarPlace(v); }
  public GetBarPlace(): number { return this.attBarring!.GetBarPlace(); }
  public HasBarPlace(): boolean { return this.attBarring!.HasBarPlace(); }

  public ResetBasic(): void { this.attBasic!.ResetBasic(); }
  public SetBase(v: string): void { this.attBasic!.SetBase(v); }
  public GetBase(): string { return this.attBasic!.GetBase(); }
  public HasBase(): boolean { return this.attBasic!.HasBase(); }

  public ResetLabelled(): void { this.attLabelled!.ResetLabelled(); }
  public HasLabelAttr(): boolean { return this.attLabelled!.HasLabel(); }
  public SetLabelAttr(v: string): void { this.attLabelled!.SetLabel(v); }
  public GetLabelAttr(): string { return this.attLabelled!.GetLabel(); }
  public ResetNNumberLike(): void { this.attNNumberLike!.ResetNNumberLike(); }
  public SetN(v: string): void { this.attNNumberLike!.SetN(v); }
  public GetN(): string { return this.attNNumberLike!.GetN(); }
  public HasN(): boolean { return this.attNNumberLike!.HasN(); }

  public ResetStaffGroupingSym(): void { this.attStaffGroupingSym!.ResetStaffGroupingSym(); }
  public SetSymbol(v: number): void { this.attStaffGroupingSym!.SetSymbol(v); }
  public GetSymbol(): number { return this.attStaffGroupingSym!.GetSymbol(); }
  public HasSymbol(): boolean { return this.attStaffGroupingSym!.HasSymbol(); }

  public ResetStaffGrpVis(): void { this.attStaffGrpVis!.ResetStaffGrpVis(); }
  public SetBarThru(v: number): void { this.attStaffGrpVis!.SetBarThru(v); }
  public GetBarThru(): number { return this.attStaffGrpVis!.GetBarThru(); }
  public HasBarThru(): boolean { return this.attStaffGrpVis!.HasBarThru(); }

  public ResetTyped(): void { this.attTyped!.ResetTyped(); }
  public SetType(v: string): void { this.attTyped!.SetType(v); }
  public GetType(): string | null { return this.attTyped!.GetType(); }
  public HasType(): boolean { return this.attTyped!.HasType(); }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitStaffGrp', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitStaffGrpEnd', this); }

  public override Clone(): VrvObject {
    const clone = new StaffGrp();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attBarring!.HasBarLen()) clone.attBarring!.SetBarLen(this.attBarring!.GetBarLen());
    if (this.attBarring!.HasBarMethod()) clone.attBarring!.SetBarMethod(this.attBarring!.GetBarMethod());
    if (this.attBarring!.HasBarPlace()) clone.attBarring!.SetBarPlace(this.attBarring!.GetBarPlace());
    if (this.attBasic!.HasBase()) clone.attBasic!.SetBase(this.attBasic!.GetBase());
    if (this.attLabelled!.HasLabel()) clone.attLabelled!.SetLabel(this.attLabelled!.GetLabel());
    if (this.attNNumberLike!.HasN()) clone.attNNumberLike!.SetN(this.attNNumberLike!.GetN());
    if (this.attStaffGroupingSym!.HasSymbol()) clone.attStaffGroupingSym!.SetSymbol(this.attStaffGroupingSym!.GetSymbol());
    if (this.attStaffGrpVis!.HasBarThru()) clone.attStaffGrpVis!.SetBarThru(this.attStaffGrpVis!.GetBarThru());
    if (this.attTyped!.HasType()) clone.attTyped!.SetType(this.attTyped!.GetType()!);
    clone.m_drawingVisibility = this.m_drawingVisibility;
    // m_groupSymbol is a non-owning reference (owned elsewhere in the tree).
    clone.m_groupSymbol = null;
    return clone;
  }
}

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_BARRING = 100;
const ATT_BASIC = 101;
const ATT_LABELLED = 145;
const ATT_NNUMBERLIKE = 168;
const ATT_STAFFGROUPINGSYM = 202;
const ATT_STAFFGRPVIS = 284;
const ATT_TYPED = 224;

/** C++ FunctorInterface default forwarding helper (VisitStaffGrp -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('staffGrp', ClassId.STAFFGRP, () => new StaffGrp());
