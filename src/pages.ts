import { VrvObject, ObjectFactory } from './object.js';
import { ClassId, FunctorCode, UNLIMITED_DEPTH, BACKWARD, InterfaceId } from './vrvdef.js';
import { MEI_UNSET } from './vrv.js';
import { Comparison } from './comparison.js';

function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}


export class PagesLabelledAttributes {
  private label = '';
  ResetLabelled(): void { this.label = ''; }
  SetLabel(v: string): void { this.label = v; }
  GetLabel(): string { return this.label; }
  HasLabel(): boolean { return this.label !== ''; }
}
export class PagesNNumberLikeAttributes {
  private n = MEI_UNSET;
  ResetNNumberLike(): void { this.n = MEI_UNSET; }
  SetN(v: number): void { this.n = Math.trunc(v); }
  GetN(): number { return this.n; }
  HasN(): boolean { return this.n !== MEI_UNSET; }
}

export class Pages extends VrvObject {
  private labelled?: PagesLabelledAttributes;
  private nNumberLike?: PagesNNumberLikeAttributes;

  public constructor() {
    super(ClassId.PAGES);
    this.RegisterAttClass(145); // ATT_LABELLED
    this.RegisterAttClass(168); // ATT_NNUMBERLIKE
    this.ResetPagesAttributes();
  }
  private ResetPagesAttributes(): void {
    this.labelled ??= new PagesLabelledAttributes();
    this.nNumberLike ??= new PagesNNumberLikeAttributes();
    this.labelled.ResetLabelled(); this.nNumberLike.ResetNNumberLike();
  }
  public override Reset(): void { super.Reset(); this.ResetPagesAttributes(); }
  public override GetClassName(): string { return 'pages'; }
  public IsSupportedChild(classId: ClassId): boolean { return classId === ClassId.PAGE || classId === ClassId.SCOREDEF; }
  public ConvertFrom(score: ScoreLike): void {
    if (typeof score.SwapID === 'function') score.SwapID(this);
    if (score.GetLabel) this.SetLabel(score.GetLabel());
    if (score.GetN) this.SetN(score.GetN());
  }
  public LayOutAll(): void {
    for (const child of this.GetChildrenForModification()) {
      const page = child as PageLike;
      page.LayOut();
    }
  }
  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitPages', this); }
  public AcceptConst(functor: unknown): FunctorCode { return visitor(functor, 'VisitPages', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitPagesEnd', this); }
  public AcceptEndConst(functor: unknown): FunctorCode { return visitor(functor, 'VisitPagesEnd', this); }
  public ResetLabelled(): void { this.labelled!.ResetLabelled(); }
  public SetLabel(v: string): void { this.labelled!.SetLabel(v); }
  public GetLabel(): string { return this.labelled!.GetLabel(); }
  public HasLabel(): boolean { return this.labelled!.HasLabel(); }
  public ResetNNumberLike(): void { this.nNumberLike!.ResetNNumberLike(); }
  public SetN(v: number): void { this.nNumberLike!.SetN(v); }
  public GetN(): number { return this.nNumberLike!.GetN(); }
  public HasN(): boolean { return this.nNumberLike!.HasN(); }
}

export interface TimeSpanningLike {
  GetStart(): VrvObject | null;
  GetEnd(): VrvObject | null;
}
export interface StaffLike extends VrvObject { m_timeSpanningElements: VrvObject[]; }
export interface PageLike extends VrvObject { LayOut(): void; }
export interface DocPagesLike extends VrvObject { GetPages(): Pages; }
export interface ScoreLike extends VrvObject { SwapID(other: VrvObject): void; GetLabel?(): string; GetN?(): number; }

export class PageRange extends Pages {
  private m_doc: DocPagesLike;
  private m_focusPage: PageLike | null = null;
  private m_pageBefore: PageLike[] = [];
  private m_pageAfter: PageLike[] = [];

  public constructor(doc: DocPagesLike) {
    super();
    if (!doc) throw new Error('PageRange requires a document.');
    this.m_doc = doc;
    this.Reset();
    this.SetAsReferenceObject();
  }
  public override Reset(): void { super.Reset(); this.m_focusPage = null; this.m_pageBefore = []; this.m_pageAfter = []; }
  public SetAsFocus(page: PageLike | null): void {
    if (!page) return;
    this.m_focusPage = page;
    const firstMeasure = page.FindDescendantByType(ClassId.MEASURE);
    if (firstMeasure) this.EvaluateSpanningElementsIn(firstMeasure);
    const lastMeasure = page.FindDescendantByType(ClassId.MEASURE, UNLIMITED_DEPTH, BACKWARD) as VrvObject | null;
    if (lastMeasure) {
      this.EvaluateSpanningElementsIn(lastMeasure);
      const spanning: VrvObject[] = [];
      lastMeasure.FindAllDescendantsByComparison(spanning, new Comparison((object) => object.HasInterface(InterfaceId.INTERFACE_TIME_SPANNING)));
      for (const object of spanning) this.Evaluate(object);
    }
    const pages = this.m_doc.GetPages().GetChildrenForModification() as PageLike[];
    const p1 = pages.indexOf(this.m_focusPage);
    if (p1 < 0) return;
    let furthestBefore = p1;
    for (const p of this.m_pageBefore) { const i = pages.indexOf(p); if (i >= 0 && i < furthestBefore) furthestBefore = i; }
    for (let i = furthestBefore; i < p1; i++) this.AddChild(pages[i]);
    this.AddChild(this.m_focusPage);
    let furthestAfter = p1;
    for (const p of this.m_pageAfter) { const i = pages.indexOf(p); if (i > p1 && i > furthestAfter) furthestAfter = i; }
    for (let i = p1 + 1; i <= furthestAfter; i++) this.AddChild(pages[i]);
    this.m_pageBefore = []; this.m_pageAfter = [];
  }
  private EvaluateSpanningElementsIn(measure: VrvObject): void {
    if (!measure) throw new Error('EvaluateSpanningElementsIn requires measure.');
    const staves = measure.FindAllDescendantsByType(ClassId.STAFF);
    for (const object of staves) {
      const staff = object as StaffLike;
      for (const element of staff.m_timeSpanningElements ?? []) this.Evaluate(element);
    }
  }
  private Evaluate(object: VrvObject): void {
    if (!object.HasInterface(InterfaceId.INTERFACE_TIME_SPANNING)) return;
    const iface = object.GetTimeSpanningInterface() as TimeSpanningLike | null;
    if (!iface) throw new Error('Missing time-spanning interface.');
    const start = iface.GetStart();
    if (start) {
      const page = start.GetFirstAncestor(ClassId.PAGE) as PageLike | null;
      if (page && page !== this.m_focusPage && !this.m_pageBefore.includes(page)) this.m_pageBefore.push(page);
    }
    const end = iface.GetEnd();
    if (end) {
      const page = end.GetFirstAncestor(ClassId.PAGE) as PageLike | null;
      if (page && page !== this.m_focusPage && !this.m_pageAfter.includes(page)) this.m_pageAfter.push(page);
    }
  }
}

ObjectFactory.GetInstance().Register('pages', ClassId.PAGES, () => new Pages());
