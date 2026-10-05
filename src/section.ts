/**
 * Pure TypeScript translation of Verovio's `Section`
 * (`src-cpp/src/section.cpp` + `src-cpp/include/vrv/section.h`).
 *
 * C++ has `Section` inherit `SystemElement` + `SystemMilestoneInterface` +
 * `AttNNumberLike` + `AttSectionVis`; TypeScript models the multiple
 * inheritance with composition.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { SystemElement } from './systemelement.js';
import { SystemMilestoneInterface, SystemMilestoneEnd } from './systemmilestone.js';
import { InstNNumberLike } from './atts_shared.js';
import { InstSectionVis } from './atts_visual.js';
import { ObjectFactory, VrvObject } from './object.js';

/** Pure TypeScript translation of Verovio's `Section`. */
export class Section extends SystemElement {
  private systemMilestoneInterface: SystemMilestoneInterface | null = null;
  private attNNumberLike: InstNNumberLike | null = null;
  private attSectionVis: InstSectionVis | null = null;

  public constructor() {
    super(ClassId.SECTION);
    this.ensureComponents();
    this.RegisterAttClass(ATT_NNUMBERLIKE);
    this.RegisterAttClass(ATT_SECTIONVIS);
    this.Reset();
  }

  public override GetClassName(): string { return 'section'; }

  public override Reset(): void {
    super.Reset();
    this.systemMilestoneInterface?.Reset();
    this.attNNumberLike?.ResetNNumberLike();
    this.attSectionVis?.ResetSectionVis();
  }

  private ensureComponents(): void {
    this.systemMilestoneInterface ??= new SystemMilestoneInterface();
    this.attNNumberLike ??= new InstNNumberLike();
    this.attSectionVis ??= new InstSectionVis();
  }

  //---------//
  // Children //
  //---------//

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [ClassId.DIV, ClassId.MEASURE, ClassId.SCOREDEF];
    if (supported.includes(classId)) return true;
    if (VrvObject.IsSystemElement(classId)) return true;
    if (VrvObject.IsEditorialElement(classId)) return true;
    return false;
  }

  //--------------------------------//
  // SystemMilestoneInterface facade //
  //--------------------------------//

  public GetSystemMilestoneInterface(): SystemMilestoneInterface | null { return this.systemMilestoneInterface; }

  public SetEnd(end: SystemMilestoneEnd): void { this.systemMilestoneInterface!.SetEnd(end); }
  public GetEnd(): SystemMilestoneEnd | null { return this.systemMilestoneInterface!.GetEnd(); }
  public IsSystemMilestone(): boolean { return this.systemMilestoneInterface?.IsSystemMilestone() ?? false; }

  /** C++ `SystemMilestoneInterface::InterfaceResetData` static composition call. */
  public InterfaceResetData(functor: Parameters<SystemMilestoneInterface['InterfaceResetData']>[0]): FunctorCode {
    return this.systemMilestoneInterface!.InterfaceResetData(functor);
  }

  public GetDrawingMeasure(): unknown { return this.systemMilestoneInterface!.GetMeasure(); }
  public SetDrawingMeasure(measure: unknown): void { this.systemMilestoneInterface!.SetMeasure(measure as never); }
  public InterfacePrepareMilestones(functor: Parameters<SystemMilestoneInterface['InterfacePrepareMilestones']>[0]): FunctorCode {
    return this.systemMilestoneInterface!.InterfacePrepareMilestones(functor);
  }
  /** C++ `Section` inherits `SystemMilestoneInterface::ConvertToPageBasedMilestone` via multiple inheritance. */
  public ConvertToPageBasedMilestone(object: VrvObject, parent: VrvObject): void {
    this.systemMilestoneInterface!.ConvertToPageBasedMilestone(object, parent);
  }

  //---------------------------//
  // Attribute facades          //
  //---------------------------//

  public ResetNNumberLike(): void { this.attNNumberLike!.ResetNNumberLike(); }
  public SetN(v: string): void { this.attNNumberLike!.SetN(v); }
  public GetN(): string { return this.attNNumberLike!.GetN(); }
  public HasN(): boolean { return this.attNNumberLike!.HasN(); }

  public ResetSectionVis(): void { this.attSectionVis!.ResetSectionVis(); }
  public SetRestart(v: number): void { this.attSectionVis!.SetRestart(v); }
  public GetRestart(): number { return this.attSectionVis!.GetRestart(); }
  public HasRestart(): boolean { return this.attSectionVis!.HasRestart(); }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitSection', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitSectionEnd', this); }

  public override Clone(): VrvObject {
    const clone = new Section();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attNNumberLike!.HasN()) clone.attNNumberLike!.SetN(this.attNNumberLike!.GetN());
    if (this.attSectionVis!.HasRestart()) clone.attSectionVis!.SetRestart(this.attSectionVis!.GetRestart());
    return clone;
  }
}

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_NNUMBERLIKE = 168;
const ATT_SECTIONVIS = 280;

/** C++ FunctorInterface default forwarding helper (VisitSection -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('section', ClassId.SECTION, () => new Section());
