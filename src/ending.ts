/**
 * Pure TypeScript translation of Verovio's `Ending`
 * (`src-cpp/src/ending.cpp` + `src-cpp/include/vrv/ending.h`).
 *
 * C++ has `Ending` inherit `SystemElement` + `SystemMilestoneInterface` +
 * `AttLabelled` + `AttLineRend` + `AttLineRendBase` + `AttNNumberLike`;
 * TypeScript models the multiple inheritance with composition.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { SystemElement } from './systemelement.js';
import { SystemMilestoneInterface, SystemMilestoneEnd } from './systemmilestone.js';
import { InstLabelled } from './atts_shared.js';
import { InstLineRend, InstLineRendBase } from './atts_shared.js';
import { InstNNumberLike } from './atts_shared.js';
import { ObjectFactory, VrvObject } from './object.js';

/** Pure TypeScript translation of Verovio's `Ending`. */
export class Ending extends SystemElement {
  private systemMilestoneInterface: SystemMilestoneInterface | null = null;
  private attLabelled: InstLabelled | null = null;
  private attLineRend: InstLineRend | null = null;
  private attLineRendBase: InstLineRendBase | null = null;
  private attNNumberLike: InstNNumberLike | null = null;

  public constructor() {
    super(ClassId.ENDING);
    this.ensureComponents();
    this.RegisterAttClass(ATT_LABELLED);
    this.RegisterAttClass(ATT_LINEREND);
    this.RegisterAttClass(ATT_LINERENDBASE);
    this.RegisterAttClass(ATT_NNUMBERLIKE);
    this.Reset();
  }

  public override GetClassName(): string { return 'ending'; }

  public override Reset(): void {
    super.Reset();
    this.systemMilestoneInterface?.Reset();
    this.attLabelled?.ResetLabelled();
    this.attLineRend?.ResetLineRend();
    this.attLineRendBase?.ResetLineRendBase();
    this.attNNumberLike?.ResetNNumberLike();
  }

  private ensureComponents(): void {
    this.systemMilestoneInterface ??= new SystemMilestoneInterface();
    this.attLabelled ??= new InstLabelled();
    this.attLineRend ??= new InstLineRend();
    this.attLineRendBase ??= new InstLineRendBase();
    this.attNNumberLike ??= new InstNNumberLike();
  }

  //---------//
  // Children //
  //---------//

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [ClassId.MEASURE, ClassId.SCOREDEF];
    if (supported.includes(classId)) {
      return true;
    } else if (VrvObject.IsSystemElement(classId)) {
      // without this we would be allowing ending within ending, which is wrong
      return classId !== ClassId.ENDING;
    } else if (VrvObject.IsEditorialElement(classId)) {
      return true;
    } else {
      return false;
    }
  }

  //----------------------------------//
  // SystemMilestoneInterface facade  //
  //----------------------------------//

  public GetSystemMilestoneInterface(): SystemMilestoneInterface | null { return this.systemMilestoneInterface; }

  public IsSystemMilestone(): boolean {
    return this.systemMilestoneInterface?.IsSystemMilestone() ?? false;
  }

  /** C++ `SystemMilestoneInterface::InterfaceResetData` static composition call. */
  public InterfaceResetData(functor: Parameters<SystemMilestoneInterface['InterfaceResetData']>[0]): FunctorCode {
    return this.systemMilestoneInterface!.InterfaceResetData(functor);
  }

  public SetEnd(end: SystemMilestoneEnd): void {
    this.systemMilestoneInterface!.SetEnd(end);
  }

  public GetEnd(): SystemMilestoneEnd | null {
    return this.systemMilestoneInterface!.GetEnd();
  }

  public GetMeasure(): ReturnType<SystemMilestoneInterface['GetMeasure']> {
    return this.systemMilestoneInterface!.GetMeasure();
  }

  public GetDrawingMeasure(): unknown {
    return this.systemMilestoneInterface!.GetMeasure();
  }

  public SetDrawingMeasure(measure: unknown): void {
    this.systemMilestoneInterface!.SetMeasure(measure as never);
  }
  public InterfacePrepareMilestones(functor: Parameters<SystemMilestoneInterface['InterfacePrepareMilestones']>[0]): FunctorCode {
    return this.systemMilestoneInterface!.InterfacePrepareMilestones(functor);
  }
  public ConvertToPageBasedMilestone(object: VrvObject, parent: VrvObject): void {
    this.systemMilestoneInterface!.ConvertToPageBasedMilestone(object, parent);
  }

  //---------------------------//
  // Attribute facades          //
  //---------------------------//

  public ResetLabelled(): void { this.attLabelled!.ResetLabelled(); }
  public SetLabel(v: string): void { this.attLabelled!.SetLabel(v); }
  public GetLabel(): string { return this.attLabelled!.GetLabel(); }
  public HasLabel(): boolean { return this.attLabelled!.HasLabel(); }

  public ResetLineRend(): void { this.attLineRend!.ResetLineRend(); }
  public SetLstartsym(v: number): void { this.attLineRend!.SetLstartsym(v); }
  public GetLstartsym(): number { return this.attLineRend!.GetLstartsym(); }
  public HasLstartsym(): boolean { return this.attLineRend!.HasLstartsym(); }
  public SetLstartsymSize(v: number): void { this.attLineRend!.SetLstartsymSize(v); }
  public GetLstartsymSize(): number { return this.attLineRend!.GetLstartsymSize(); }
  public HasLstartsymSize(): boolean { return this.attLineRend!.HasLstartsymSize(); }
  public SetLendsym(v: number): void { this.attLineRend!.SetLendsym(v); }
  public GetLendsym(): number { return this.attLineRend!.GetLendsym(); }
  public HasLendsym(): boolean { return this.attLineRend!.HasLendsym(); }
  public SetLendsymSize(v: number): void { this.attLineRend!.SetLendsymSize(v); }
  public GetLendsymSize(): number { return this.attLineRend!.GetLendsymSize(); }
  public HasLendsymSize(): boolean { return this.attLineRend!.HasLendsymSize(); }

  public ResetLineRendBase(): void { this.attLineRendBase!.ResetLineRendBase(); }
  public SetLform(v: number): void { this.attLineRendBase!.SetLform(v); }
  public GetLform(): number { return this.attLineRendBase!.GetLform(); }
  public HasLform(): boolean { return this.attLineRendBase!.HasLform(); }
  public SetLwidth(v: unknown): void { this.attLineRendBase!.SetLwidth(v as never); }
  public GetLwidth(): unknown { return this.attLineRendBase!.GetLwidth(); }
  public HasLwidth(): boolean { return this.attLineRendBase!.HasLwidth(); }
  public SetLsegs(v: number): void { this.attLineRendBase!.SetLsegs(v); }
  public GetLsegs(): number { return this.attLineRendBase!.GetLsegs(); }
  public HasLsegs(): boolean { return this.attLineRendBase!.HasLsegs(); }

  public ResetNNumberLike(): void { this.attNNumberLike!.ResetNNumberLike(); }
  public SetN(v: string): void { this.attNNumberLike!.SetN(v); }
  public GetN(): string { return this.attNNumberLike!.GetN(); }
  public HasN(): boolean { return this.attNNumberLike!.HasN(); }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitEnding', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitEndingEnd', this); }

  public override Clone(): VrvObject {
    const clone = new Ending();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attLabelled!.HasLabel()) clone.attLabelled!.SetLabel(this.attLabelled!.GetLabel());
    if (this.attLineRend!.HasLstartsym()) clone.attLineRend!.SetLstartsym(this.attLineRend!.GetLstartsym());
    if (this.attLineRend!.HasLendsym()) clone.attLineRend!.SetLendsym(this.attLineRend!.GetLendsym());
    if (this.attLineRendBase!.HasLform()) clone.attLineRendBase!.SetLform(this.attLineRendBase!.GetLform());
    if (this.attLineRendBase!.HasLsegs()) clone.attLineRendBase!.SetLsegs(this.attLineRendBase!.GetLsegs());
    if (this.attNNumberLike!.HasN()) clone.attNNumberLike!.SetN(this.attNNumberLike!.GetN());
    return clone;
  }
}

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_LABELLED = 145;
const ATT_LINEREND = 150;
const ATT_LINERENDBASE = 151;
const ATT_NNUMBERLIKE = 168;

/** C++ FunctorInterface default forwarding helper (VisitEnding -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('ending', ClassId.ENDING, () => new Ending());
