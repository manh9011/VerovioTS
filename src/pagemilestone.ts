/**
 * Pure TypeScript translation of Verovio's pagemilestone.h/.cpp.
 * PageMilestoneEnd has no MEI equivalent; its state mirrors the native
 * milestone used when converting container elements to a page-based tree.
 */
import { ClassId, FunctorCode } from './vrvdef';
import { VrvObject } from './object';
import { PageElement } from './pageelement';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function visit(functor: unknown, method: string, self: unknown): FunctorCode {
  const fn = (functor as Record<string, unknown>)[method];
  if (typeof fn !== 'function') return FunctorCode.FUNCTOR_CONTINUE;
  const result = (fn as (value: unknown) => FunctorCode).call(functor, self);
  return result ?? FunctorCode.FUNCTOR_CONTINUE;
}

/** End milestone inserted into a page-based representation. */
export class PageMilestoneEnd extends PageElement {
  private m_start: VrvObject | null = null;
  private m_startClassName = '';

  public constructor(start: VrvObject) {
    super(ClassId.PAGE_MILESTONE_END);
    this.Reset();
    this.m_start = start;
    this.m_startClassName = start.GetClassName();
  }

  public override Reset(): void {
    super.Reset();
    this.m_start = null;
  }

  public override GetClassName(): string { return 'pageMilestoneEnd'; }

  public GetStart(): VrvObject | null { return this.m_start; }
  public GetStartClassName(): string { return this.m_startClassName; }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPageMilestone', this);
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPageMilestone', this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPageMilestoneEnd', this);
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPageMilestoneEnd', this);
  }
}

/** Shared interface implemented by page-milestone start elements. */
export class PageMilestoneInterface {
  private m_end: PageMilestoneEnd | null = null;

  public constructor() {
    this.Reset();
  }

  public Reset(): void {
    this.m_end = null;
  }

  public SetEnd(end: PageMilestoneEnd): void {
    invariant(this.m_end === null, 'PageMilestoneInterface::SetEnd requires no existing end milestone.');
    this.m_end = end;
  }

  public GetEnd(): PageMilestoneEnd | null { return this.m_end; }
  public IsPageMilestone(): boolean { return this.m_end !== null; }

  public ConvertToPageBasedMilestone(object: VrvObject, parent: VrvObject): void {
    invariant(Boolean(object), 'PageMilestoneInterface::ConvertToPageBasedMilestone requires object.');
    invariant(Boolean(parent), 'PageMilestoneInterface::ConvertToPageBasedMilestone requires parent.');

    const pageMilestoneEnd = new PageMilestoneEnd(object);
    this.SetEnd(pageMilestoneEnd);
    parent.AddChild(pageMilestoneEnd);

    object.ClearRelinquishedChildren();
  }
}
