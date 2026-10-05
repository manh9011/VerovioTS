/**
 * Pure TypeScript translation of Verovio's systemmilestone.h/.cpp.
 * Native ownership is represented with explicit nullable references and the
 * relinquish/attach sequence from the C++ implementation is preserved.
 */
import { ClassId, FunctorCode, VRV_UNSET } from './vrvdef';
import { VrvObject } from './object';
import { SystemElement } from './systemelement';

export interface MeasureLikeSystemMilestone extends VrvObject {}

export interface PrepareMilestonesFunctorLike {
  InsertStartMilestone(inter: SystemMilestoneInterface): void;
}

export interface ResetDataFunctorLike {}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function visit(functor: unknown, method: string, self: unknown): FunctorCode {
  const fn = (functor as Record<string, unknown>)[method];
  if (typeof fn !== 'function') return FunctorCode.FUNCTOR_CONTINUE;
  const result = (fn as (value: unknown) => FunctorCode).call(functor, self);
  return result ?? FunctorCode.FUNCTOR_CONTINUE;
}

/** End milestone inserted in the system-level/page-based representation. */
export class SystemMilestoneEnd extends SystemElement {
  private m_start: VrvObject | null = null;
  private m_startClassName = '';
  private m_drawingMeasure: MeasureLikeSystemMilestone | null = null;

  public constructor(start: VrvObject) {
    super(ClassId.SYSTEM_MILESTONE_END);
    this.Reset();
    this.m_start = start;
    this.m_startClassName = start.GetClassName();
  }

  public override Reset(): void {
    super.Reset();
    this.m_start = null;
    this.m_drawingMeasure = null;
  }

  public override GetClassName(): string { return 'systemMilestoneEnd'; }

  public SetMeasure(measure: MeasureLikeSystemMilestone | null): void { this.m_drawingMeasure = measure; }
  public GetMeasure(): MeasureLikeSystemMilestone | null { return this.m_drawingMeasure; }

  public GetStart(): VrvObject | null { return this.m_start; }
  public GetStartClassName(): string { return this.m_startClassName; }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitSystemMilestone', this);
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitSystemMilestone', this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitSystemMilestoneEnd', this);
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitSystemMilestoneEnd', this);
  }
}

/** Shared interface implemented by system-level milestone start elements. */
export class SystemMilestoneInterface {
  private m_end: SystemMilestoneEnd | null = null;
  private m_drawingMeasure: MeasureLikeSystemMilestone | null = null;

  public constructor() {
    this.Reset();
  }

  public Reset(): void {
    this.m_end = null;
    this.m_drawingMeasure = null;
  }

  public SetMeasure(measure: MeasureLikeSystemMilestone | null): void { this.m_drawingMeasure = measure; }
  public GetMeasure(): MeasureLikeSystemMilestone | null { return this.m_drawingMeasure; }

  public SetEnd(end: SystemMilestoneEnd): void {
    invariant(this.m_end === null, 'SystemMilestoneInterface::SetEnd requires no existing end milestone.');
    this.m_end = end;
  }

  public GetEnd(): SystemMilestoneEnd | null { return this.m_end; }
  public IsSystemMilestone(): boolean { return this.m_end !== null; }

  public ConvertToPageBasedMilestone(object: VrvObject, parent: VrvObject): void {
    invariant(Boolean(object), 'SystemMilestoneInterface::ConvertToPageBasedMilestone requires object.');
    invariant(Boolean(parent), 'SystemMilestoneInterface::ConvertToPageBasedMilestone requires parent.');

    const systemMilestoneEnd = new SystemMilestoneEnd(object);
    this.SetEnd(systemMilestoneEnd);
    parent.AddChild(systemMilestoneEnd);

    // Mirror C++ relinquishment semantics: the original object's relinquished
    // children are detached/cleared only after the new end milestone is owned.
    object.ClearRelinquishedChildren();
  }

  public InterfacePrepareMilestones(functor: PrepareMilestonesFunctorLike): FunctorCode {
    invariant(this.m_end !== null, 'SystemMilestoneInterface::InterfacePrepareMilestones requires an end milestone.');
    functor.InsertStartMilestone(this);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public InterfaceResetData(_functor: ResetDataFunctorLike): FunctorCode {
    this.m_drawingMeasure = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
