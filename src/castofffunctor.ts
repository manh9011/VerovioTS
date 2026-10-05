/**
 * Pure TypeScript translation of Verovio's src/castofffunctor.cpp
 * / include/vrv/castofffunctor.h.
 *
 * Page/system casting-off, encoded-break casting, un-casting, and
 * selection casting. Unmigrated tree classes (Page, System, Measure,
 * Score, ...) are represented by structural contracts; System/Page
 * construction is injected through factories so Doc can wire the real
 * classes once migrated.
 */
import { DocFunctor, Functor } from './functor.js';
import { ClassId, FunctorCode, VRV_UNSET } from './vrvdef.js';

const BREAKS_encoded = 4;

export interface CastOffObjectLike {
  GetIdx(): number;
  GetID(): string;
  Is(classId: ClassId): boolean;
  GetParent(): CastOffObjectLike | null;
  GetChildCount(classId?: ClassId): number;
  GetChild(index: number): CastOffObjectLike | null;
  GetLast(classId?: ClassId): CastOffObjectLike | null;
  GetNext(element: CastOffObjectLike, classId?: ClassId): CastOffObjectLike | null;
  AddChild(child: CastOffObjectLike): void;
  MoveItselfTo(parent: CastOffObjectLike): void;
  MoveChildrenFrom(source: CastOffObjectLike): void;
  Relinquish(index: number): CastOffObjectLike | null;
}

export interface CastOffMeasureLike extends CastOffObjectLike {
  HasCachedHorizontalLayout(): boolean;
  GetCachedOverflow(): number;
  GetDrawingOverflow(): number;
  GetCachedWidth(): number;
  GetWidth(): number;
  GetDrawingXRel(): number;
  GetCachedXRel(): number;
  GetDrawingX(): number;
  ResetCachedXRel(): void;
  ResetCachedWidth(): void;
  ResetCachedOverflow(): void;
}

export interface CastOffSystemLike extends CastOffObjectLike {
  GetDrawingLabelsWidth(): number;
  GetDrawingAbbrLabelsWidth(): number;
  GetDrawingWidth(): number;
  GetDrawingYRel(): number;
  GetHeight(): number;
  GetChildrenForModification(): CastOffObjectLike[];
}

export interface CastOffPageLike extends CastOffObjectLike {
  m_drawingScoreDef: { GetDrawingWidth(): number };
  GetDrawingYRel(): number;
}

export interface CastOffScoreDefLike extends CastOffObjectLike {
  GetDrawingWidth(): number;
}

export interface CastOffScoreLike extends CastOffObjectLike {
  m_drawingPgHeadHeight: number;
  m_drawingPgFootHeight: number;
  m_drawingPgHead2Height: number;
  m_drawingPgFoot2Height: number;
}

export interface CastOffFloatingObjectLike extends CastOffObjectLike {
  SetCurrentFloatingPositioner(positioner: null): void;
}

export interface CastOffStaffLike extends CastOffObjectLike {
  SetAlignment(alignment: null): void;
}

export interface CastOffDocLike {
  GetOptions(): {
    m_breaksNoWidow: { GetValue(): boolean };
    m_breaks: { GetValue(): number };
    m_breaksSmartSb: { GetValue(): number };
    m_systemMaxPerPage: { GetValue(): number };
  };
  GetDrawingUnit(staffSize: number): number;
  GetPages(): { AddChild(page: CastOffObjectLike): void } | null;
}

function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`CastOffFunctor: ${message}`);
}

export class CastOffSystemsFunctor extends DocFunctor {
  private m_contentSystem: any = null;
  private m_page: any;
  private m_currentSystem: any = null;
  private m_shift = 0;
  private m_systemWidth = 0;
  private m_currentScoreDefWidth = 0;
  private m_pendingElements: CastOffObjectLike[] = [];
  private m_smart: boolean;
  private m_leftoverSystem: any = null;
  private readonly m_systemFactory: () => any;

  public constructor(
    page: any, doc: unknown, smart: boolean,
    systemFactory?: () => any,
  ) {
    super(doc as never);
    this.m_page = page;
    this.m_smart = smart;
    this.m_systemFactory = systemFactory ?? (() => {
      throw new Error('CastOffSystemsFunctor requires a System factory.');
    });
  }

  public override ImplementsEndInterface(): boolean { return true; }

  public GetLeftoverSystem(): any { return this.m_leftoverSystem; }

  public SetSystemWidth(width: number): void { this.m_systemWidth = width; }

  public VisitDiv(div: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_currentSystem, 'current system is unset');
    if (this.m_currentSystem.GetChildCount(ClassId.MEASURE) > 0
      || this.m_currentSystem.GetChildCount(ClassId.DIV) > 0) {
      this.m_currentSystem = this.m_systemFactory();
      this.m_page.AddChild(this.m_currentSystem);
    }
    div.MoveItselfTo(this.m_currentSystem);
    this.m_currentSystem = this.m_systemFactory();
    this.m_page.AddChild(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitEditorialElement(editorialElement: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_contentSystem, 'content system is unset');
    const moved = this.m_contentSystem.Relinquish(editorialElement.GetIdx());
    assertInvariant(moved, 'relinquished editorial element');
    this.m_pendingElements.push(moved);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitEnding(ending: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_contentSystem, 'content system is unset');
    const moved = this.m_contentSystem.Relinquish(ending.GetIdx());
    assertInvariant(moved, 'relinquished ending');
    this.m_pendingElements.push(moved);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasure(measure: CastOffMeasureLike): FunctorCode {
    const doc = this.m_doc as unknown as CastOffDocLike;
    assertInvariant(this.m_contentSystem, 'content system is unset');
    assertInvariant(this.m_currentSystem, 'current system is unset');
    const hasCache = measure.HasCachedHorizontalLayout();
    const overflow = hasCache ? measure.GetCachedOverflow() : measure.GetDrawingOverflow();
    const width = hasCache ? measure.GetCachedWidth() : measure.GetWidth();
    const drawingXRel = measure.GetDrawingXRel();

    const nextMeasure = this.m_contentSystem.GetNext(measure, ClassId.MEASURE);
    const isLeftoverMeasure = !nextMeasure && doc.GetOptions().m_breaksNoWidow.GetValue()
      && doc.GetOptions().m_breaks.GetValue() !== BREAKS_encoded;
    if (this.m_currentSystem.GetChildCount() > 0) {
      if (overflow > doc.GetDrawingUnit(100) * 5) {
        const moved = this.m_contentSystem.Relinquish(measure.GetIdx()) as CastOffMeasureLike | null;
        assertInvariant(moved, 'relinquished measure');
        this.m_pendingElements.push(moved);
        return FunctorCode.FUNCTOR_SIBLINGS;
      }
      else if (drawingXRel + width + this.m_currentScoreDefWidth - this.m_shift > this.m_systemWidth) {
        this.m_currentSystem = this.m_systemFactory();
        this.m_page.AddChild(this.m_currentSystem);
        this.m_shift = drawingXRel;
        if (isLeftoverMeasure) {
          this.m_leftoverSystem = this.m_currentSystem;
        }
        for (const pendingElement of this.m_pendingElements) {
          if (pendingElement.Is(ClassId.MEASURE)) {
            const firstPendingMeasure = pendingElement as unknown as CastOffMeasureLike;
            this.m_shift = firstPendingMeasure.GetCachedXRel();
            this.m_leftoverSystem = null;
            break;
          }
        }
      }
    }

    for (const pendingElement of this.m_pendingElements) {
      this.m_currentSystem.AddChild(pendingElement);
    }
    this.m_pendingElements.length = 0;

    const moved = this.m_contentSystem.Relinquish(measure.GetIdx()) as CastOffMeasureLike | null;
    assertInvariant(moved, 'relinquished measure');
    this.m_currentSystem.AddChild(moved);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitPageElement(pageElement: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_page, 'page is unset');
    pageElement.MoveItselfTo(this.m_page);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitPageMilestone(pageMilestoneEnd: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_page, 'page is unset');
    pageMilestoneEnd.MoveItselfTo(this.m_page);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSb(sb: CastOffObjectLike): FunctorCode {
    const doc = this.m_doc as unknown as CastOffDocLike;
    assertInvariant(this.m_currentSystem, 'current system is unset');
    if (this.m_smart) {
      const childCount = this.m_currentSystem.GetChildCount();
      const measure = childCount > 0
        ? this.m_currentSystem.GetChild(childCount - 1) as unknown as CastOffMeasureLike | null
        : null;
      if (measure) {
        const measureRightX = measure.GetDrawingX() + measure.GetWidth() - this.m_shift;
        const smartSbThresh = doc.GetOptions().m_breaksSmartSb.GetValue();
        if (measureRightX > this.m_systemWidth * smartSbThresh) {
          this.m_currentSystem = this.m_systemFactory();
          this.m_page.AddChild(this.m_currentSystem);
          this.m_shift += measureRightX;
        }
      }
    }
    sb.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitScoreDef(scoreDef: CastOffScoreDefLike): FunctorCode {
    assertInvariant(this.m_contentSystem, 'content system is unset');
    const moved = this.m_contentSystem.Relinquish(scoreDef.GetIdx()) as CastOffScoreDefLike | null;
    assertInvariant(moved, 'relinquished scoreDef');
    this.m_pendingElements.push(moved);
    this.m_currentScoreDefWidth = moved.GetDrawingWidth()
      + this.m_contentSystem.GetDrawingAbbrLabelsWidth();
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystem(system: CastOffSystemLike): FunctorCode {
    this.m_contentSystem = system;
    const targetSystem = this.m_systemFactory();
    this.m_page.AddChild(targetSystem);
    this.m_currentSystem = targetSystem;
    this.m_shift = -system.GetDrawingLabelsWidth();
    this.m_currentScoreDefWidth = this.m_page.m_drawingScoreDef.GetDrawingWidth()
      + system.GetDrawingAbbrLabelsWidth();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemEnd(_system: CastOffSystemLike): FunctorCode {
    if (this.m_pendingElements.length === 0) return FunctorCode.FUNCTOR_CONTINUE;
    assertInvariant(this.m_currentSystem, 'current system is unset');
    for (const pendingElement of this.m_pendingElements) {
      this.m_currentSystem.AddChild(pendingElement);
    }
    this.m_pendingElements.length = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemElement(systemElement: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_contentSystem, 'content system is unset');
    const moved = this.m_contentSystem.Relinquish(systemElement.GetIdx());
    assertInvariant(moved, 'relinquished system element');
    this.m_pendingElements.push(moved);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystemMilestone(systemMilestoneEnd: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_contentSystem, 'content system is unset');
    assertInvariant(this.m_currentSystem, 'current system is unset');
    const moved = this.m_contentSystem.Relinquish(systemMilestoneEnd.GetIdx());
    assertInvariant(moved, 'relinquished milestone');
    if (this.m_pendingElements.length === 0) {
      this.m_currentSystem.AddChild(moved);
    }
    else {
      this.m_pendingElements.push(moved);
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}

export class CastOffPagesFunctor extends DocFunctor {
  private m_contentPage: any;
  private m_currentPage: any;
  private m_firstCastOffPage = true;
  private m_shift = VRV_UNSET;
  private m_pageHeight = 0;
  private m_pgHeadHeight = 0;
  private m_pgFootHeight = 0;
  private m_pgHead2Height = 0;
  private m_pgFoot2Height = 0;
  private m_leftoverSystem: any = null;
  private m_pendingPageElements: CastOffObjectLike[] = [];
  private readonly m_pageFactory: () => any;

  public constructor(
    contentPage: any, doc: unknown, currentPage: any,
    pageFactory?: () => any,
  ) {
    super(doc as never);
    this.m_contentPage = contentPage;
    this.m_currentPage = currentPage;
    this.m_pageFactory = pageFactory ?? (() => {
      throw new Error('CastOffPagesFunctor requires a Page factory.');
    });
  }

  public override ImplementsEndInterface(): boolean { return true; }

  public SetLeftoverSystem(system: CastOffSystemLike | null): void {
    this.m_leftoverSystem = system;
  }

  public SetPageHeight(height: number): void { this.m_pageHeight = height; }

  public VisitPageEnd(_page: any): FunctorCode {
    if (this.m_pendingPageElements.length === 0) return FunctorCode.FUNCTOR_CONTINUE;
    for (const pendingElement of this.m_pendingPageElements) {
      this.m_currentPage.AddChild(pendingElement);
    }
    this.m_pendingPageElements.length = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPageElement(pageElement: CastOffObjectLike): FunctorCode {
    const moved = this.m_contentPage.Relinquish(pageElement.GetIdx());
    assertInvariant(moved, 'relinquished page element');
    this.m_pendingPageElements.push(moved);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitPageMilestone(pageMilestoneEnd: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_currentPage, 'current page is unset');
    const moved = this.m_contentPage.Relinquish(pageMilestoneEnd.GetIdx());
    assertInvariant(moved, 'relinquished page milestone');
    if (this.m_pendingPageElements.length === 0) {
      this.m_currentPage.AddChild(moved);
    }
    else {
      this.m_pendingPageElements.push(moved);
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitScore(score: CastOffScoreLike): FunctorCode {
    this.VisitPageElement(score);
    this.m_pgHeadHeight = score.m_drawingPgHeadHeight;
    this.m_pgFootHeight = score.m_drawingPgFootHeight;
    this.m_pgHead2Height = score.m_drawingPgHead2Height;
    this.m_pgFoot2Height = score.m_drawingPgFoot2Height;
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystem(system: CastOffSystemLike): FunctorCode {
    const doc = this.m_doc as unknown as CastOffDocLike;
    if (this.m_shift === VRV_UNSET) {
      this.m_shift = system.GetDrawingYRel();
    }

    const systemMaxPerPage = doc.GetOptions().m_systemMaxPerPage.GetValue();
    const systemChildCount = this.m_currentPage.GetChildCount(ClassId.SYSTEM);
    if ((systemMaxPerPage !== 0 && systemMaxPerPage === systemChildCount)
      || (systemChildCount > 0
        && this.m_shift - system.GetDrawingYRel() + system.GetHeight() > this.GetAvailableDrawingHeight())) {
      const nextSystem = this.m_contentPage.GetNext(system, ClassId.SYSTEM);
      const lastSystem = this.m_currentPage.GetLast(ClassId.SYSTEM);
      if (!nextSystem && lastSystem && system === this.m_leftoverSystem) {
        const children = system.GetChildrenForModification();
        for (const child of children) {
          child.MoveItselfTo(lastSystem);
        }
        return FunctorCode.FUNCTOR_SIBLINGS;
      }

      this.m_currentPage = this.m_pageFactory();
      const pages = doc.GetPages();
      assertInvariant(pages, 'document pages are unset');
      pages.AddChild(this.m_currentPage);
      this.m_shift = system.GetDrawingYRel();
      this.m_firstCastOffPage = false;
    }

    for (const pendingElement of this.m_pendingPageElements) {
      this.m_currentPage.AddChild(pendingElement);
    }
    this.m_pendingPageElements.length = 0;

    const moved = this.m_contentPage.Relinquish(system.GetIdx()) as CastOffSystemLike | null;
    assertInvariant(moved, 'relinquished system');
    this.m_currentPage.AddChild(moved);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  private GetAvailableDrawingHeight(): number {
    const pageHeadAndFootHeight = this.m_firstCastOffPage
      ? this.m_pgHeadHeight + this.m_pgFootHeight
      : this.m_pgHead2Height + this.m_pgFoot2Height;
    return this.m_pageHeight - pageHeadAndFootHeight;
  }
}

export class CastOffEncodingFunctor extends DocFunctor {
  private m_currentPage: any;
  private m_currentSystem: any = null;
  private m_contentSystem: any = null;
  private m_usePages: boolean;
  private readonly m_systemFactory: () => any;
  private readonly m_pageFactory: () => any;

  public constructor(
    doc: unknown, currentPage: any, usePages = true,
    factories?: { createSystem?: () => any; createPage?: () => any },
  ) {
    super(doc as never);
    this.m_currentPage = currentPage;
    this.m_usePages = usePages;
    this.m_systemFactory = factories?.createSystem ?? (() => {
      throw new Error('CastOffEncodingFunctor requires a System factory.');
    });
    this.m_pageFactory = factories?.createPage ?? (() => {
      throw new Error('CastOffEncodingFunctor requires a Page factory.');
    });
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public VisitDiv(div: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_currentSystem, 'current system is unset');
    div.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitEditorialElement(editorialElement: CastOffObjectLike): FunctorCode {
    if (editorialElement.GetParent() && editorialElement.GetParent()!.Is(ClassId.SYSTEM)) {
      assertInvariant(this.m_currentSystem, 'current system is unset');
      editorialElement.MoveItselfTo(this.m_currentSystem);
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitEnding(ending: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_currentSystem, 'current system is unset');
    ending.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasure(measure: CastOffMeasureLike): FunctorCode {
    assertInvariant(this.m_currentSystem, 'current system is unset');
    measure.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPageElement(pageElement: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_currentPage, 'current page is unset');
    pageElement.MoveItselfTo(this.m_currentPage);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitPageMilestone(pageMilestoneEnd: CastOffObjectLike & {
    GetStart(): CastOffObjectLike | null;
  }): FunctorCode {
    if (pageMilestoneEnd.GetStart() && pageMilestoneEnd.GetStart()!.Is(ClassId.SCORE)) {
      assertInvariant(this.m_currentSystem, 'current system is unset');
      this.m_currentPage.AddChild(this.m_currentSystem);
      this.m_currentSystem = null;
    }
    assertInvariant(this.m_currentPage, 'current page is unset');
    pageMilestoneEnd.MoveItselfTo(this.m_currentPage);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitPb(pb: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_currentSystem, 'current system is unset');
    if (this.m_currentSystem.GetChildCount(ClassId.PB) > 0
      || this.m_currentSystem.GetChildCount(ClassId.MEASURE) > 0
      || this.m_currentPage.GetChildCount(ClassId.SYSTEM) > 0) {
      this.m_currentPage.AddChild(this.m_currentSystem);
      this.m_currentSystem = this.m_systemFactory();
      if (this.m_usePages) {
        const doc = this.m_doc as unknown as CastOffDocLike;
        this.m_currentPage = this.m_pageFactory();
        const pages = doc.GetPages();
        assertInvariant(pages, 'document pages are unset');
        pages.AddChild(this.m_currentPage);
      }
    }
    assertInvariant(this.m_currentSystem, 'current system is unset');
    pb.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSb(sb: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_currentSystem, 'current system is unset');
    if (this.m_currentSystem.GetChildCount(ClassId.MEASURE) > 0
      || this.m_currentSystem.GetChildCount(ClassId.DIV) > 0) {
      this.m_currentPage.AddChild(this.m_currentSystem);
      this.m_currentSystem = this.m_systemFactory();
    }
    assertInvariant(this.m_currentSystem, 'current system is unset');
    sb.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitScoreDef(scoreDef: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_currentSystem, 'current system is unset');
    scoreDef.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitStaff(staff: CastOffStaffLike): FunctorCode {
    staff.SetAlignment(null);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystem(system: CastOffSystemLike): FunctorCode {
    this.m_contentSystem = system;
    assertInvariant(!this.m_currentSystem, 'current system must be unset');
    this.m_currentSystem = this.m_systemFactory();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemElement(systemElement: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_currentSystem, 'current system is unset');
    systemElement.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}

export class UnCastOffFunctor extends Functor {
  private m_page: any;
  private m_currentSystem: any = null;
  private m_resetCache = true;
  private readonly m_systemFactory: () => any;

  public constructor(page: any, systemFactory?: () => any) {
    super();
    this.m_page = page;
    this.m_systemFactory = systemFactory ?? (() => {
      throw new Error('UnCastOffFunctor requires a System factory.');
    });
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public SetResetCache(resetCache: boolean): void { this.m_resetCache = resetCache; }

  public VisitFloatingObject(floatingObject: CastOffFloatingObjectLike): FunctorCode {
    floatingObject.SetCurrentFloatingPositioner(null);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasure(measure: CastOffMeasureLike): FunctorCode {
    if (this.m_resetCache) {
      measure.ResetCachedXRel();
      measure.ResetCachedWidth();
      measure.ResetCachedOverflow();
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPageElement(pageElement: CastOffObjectLike): FunctorCode {
    pageElement.MoveItselfTo(this.m_page);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitPageMilestone(pageMilestoneEnd: CastOffObjectLike & {
    GetStart(): CastOffObjectLike | null;
  }): FunctorCode {
    if (pageMilestoneEnd.GetStart() && pageMilestoneEnd.GetStart()!.Is(ClassId.SCORE)) {
      assertInvariant(this.m_currentSystem, 'current system is unset');
      this.m_currentSystem = null;
    }
    pageMilestoneEnd.MoveItselfTo(this.m_page);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitScore(score: CastOffObjectLike): FunctorCode {
    this.VisitPageElement(score);
    assertInvariant(!this.m_currentSystem, 'current system must be unset');
    const system = this.m_systemFactory();
    this.m_currentSystem = system;
    this.m_page.AddChild(system);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystem(system: CastOffSystemLike): FunctorCode {
    assertInvariant(this.m_currentSystem, 'current system is unset');
    this.m_currentSystem.MoveChildrenFrom(system);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

export class CastOffToSelectionFunctor extends DocFunctor {
  private m_contentSystem: any = null;
  private m_page: any;
  private m_currentSystem: any = null;
  private m_start: string;
  private m_end: string;
  private m_isSelection = false;
  private readonly m_systemFactory: () => any;
  private readonly m_pageFactory: () => any;

  public constructor(
    page: any, doc: unknown, start: string, end: string,
    factories?: { createSystem?: () => any; createPage?: () => any },
  ) {
    super(doc as never);
    this.m_page = page;
    this.m_start = start;
    this.m_end = end;
    this.m_systemFactory = factories?.createSystem ?? (() => {
      throw new Error('CastOffToSelectionFunctor requires a System factory.');
    });
    this.m_pageFactory = factories?.createPage ?? (() => {
      throw new Error('CastOffToSelectionFunctor requires a Page factory.');
    });
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public VisitDiv(div: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_currentSystem, 'current system is unset');
    div.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitEditorialElement(editorialElement: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_currentSystem, 'current system is unset');
    editorialElement.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasure(measure: CastOffMeasureLike): FunctorCode {
    const doc = this.m_doc as unknown as CastOffDocLike;
    const startSelection = !this.m_isSelection && measure.GetID() === this.m_start;
    if (startSelection) {
      this.m_page = this.m_pageFactory();
      const pages = doc.GetPages();
      assertInvariant(pages, 'document pages are unset');
      pages.AddChild(this.m_page);
      this.m_currentSystem = this.m_systemFactory();
      this.m_page.AddChild(this.m_currentSystem);
      this.m_isSelection = true;
    }
    const endSelection = this.m_isSelection && measure.GetID() === this.m_end;
    assertInvariant(this.m_currentSystem, 'current system is unset');
    measure.MoveItselfTo(this.m_currentSystem);
    if (endSelection) {
      this.m_page = this.m_pageFactory();
      const pages = doc.GetPages();
      assertInvariant(pages, 'document pages are unset');
      pages.AddChild(this.m_page);
      this.m_currentSystem = this.m_systemFactory();
      this.m_page.AddChild(this.m_currentSystem);
      this.m_isSelection = false;
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitPageElement(pageElement: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_page, 'page is unset');
    pageElement.MoveItselfTo(this.m_page);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitPageMilestone(pageMilestoneEnd: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_page, 'page is unset');
    pageMilestoneEnd.MoveItselfTo(this.m_page);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitScoreDef(scoreDef: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_currentSystem, 'current system is unset');
    scoreDef.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystem(system: CastOffSystemLike): FunctorCode {
    this.m_contentSystem = system;
    const targetSystem = this.m_systemFactory();
    this.m_page.AddChild(targetSystem);
    this.m_currentSystem = targetSystem;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemElement(systemElement: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_currentSystem, 'current system is unset');
    systemElement.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystemMilestone(systemMilestoneEnd: CastOffObjectLike): FunctorCode {
    assertInvariant(this.m_currentSystem, 'current system is unset');
    systemMilestoneEnd.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}
