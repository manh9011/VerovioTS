import { VrvObject, ObjectFactory } from './object.js';
import { ClassId, FunctorCode, InterfaceId, data_DURATION, DURATION_4 } from './vrvdef.js';
import { Comparison, AttDurExtremeComparison, DurExtreme } from './comparison.js';
import { ScoreDef } from './scoredef.js';
import type { RunningElement } from './runningelement.js';
import { System } from './system.js';
import type { Score } from './score.js';
import type { Doc } from './doc.js';
import { Functor, DocFunctor } from './functor.js';
import { InitProcessingListsFunctor } from './miscfunctor.js';
import { AttNIntegerComparison, LyricElementComparison, Filters } from './comparison.js';
import { AlignHorizontallyFunctor, AlignVerticallyFunctor, AlignSystemsFunctor, AlignMeasuresFunctor } from './alignfunctor.js';
import { CalcAlignmentPitchPosFunctor } from './calcalignmentpitchposfunctor.js';
import { CalcAlignmentXPosFunctor } from './calcalignmentxposfunctor.js';
import { CalcLigatureOrNeumePosFunctor } from './calcligatureorneumeposfunctor.js';
import { CalcStemFunctor } from './calcstemfunctor.js';
import { CalcChordNoteHeadsFunctor } from './calcchordnoteheadsfunctor.js';
import { CalcDotsFunctor } from './calcdotsfunctor.js';
import { CalcArticFunctor } from './calcarticfunctor.js';
import { CalcSlurDirectionFunctor } from './calcslurdirectionfunctor.js';
import { CalcSpanningBeamSpansFunctor } from './calcspanningbeamspansfunctor.js';
import { CalcLedgerLinesFunctor } from './calcledgerlinesfunctor.js';
import { View } from './view.js';
import { CalcBBoxOverflowsFunctor } from './calcbboxoverflowsfunctor.js';
import { AdjustXRelForTranscriptionFunctor } from './adjustxrelfortranscriptionfunctor.js';
import { AdjustYRelForTranscriptionFunctor } from './adjustyrelfortranscriptionfunctor.js';
import { AdjustOssiaStaffDefFunctor } from './adjustossiastaffdeffunctor.js';
import { ResetHorizontalAlignmentFunctor, ResetVerticalAlignmentFunctor } from './resetfunctor.js';
import { AdjustArticFunctor, AdjustArticWithSlursFunctor } from './adjustarticfunctor.js';
import { AdjustLayersFunctor } from './adjustlayersfunctor.js';
import { AdjustDotsFunctor } from './adjustdotsfunctor.js';
import { AdjustNeumeXFunctor } from './adjustneumexfunctor.js';
import { AdjustAccidXFunctor } from './adjustaccidxfunctor.js';
import { AdjustXPosFunctor } from './adjustxposfunctor.js';
import { AdjustGraceXPosFunctor } from './adjustgracexposfunctor.js';
import { AdjustClefChangesFunctor } from './adjustclefchangesfunctor.js';
import { AdjustSylSpacingFunctor } from './adjustsylspacingfunctor.js';
import { AdjustHarmGrpsSpacingFunctor } from './adjustharmgrpsspacingfunctor.js';
import { AdjustArpegFunctor } from './adjustarpegfunctor.js';
import { AdjustTempoFunctor } from './adjusttempofunctor.js';
import { AdjustTupletsXFunctor } from './adjusttupletsxfunctor.js';
import { AdjustTupletsYFunctor, AdjustTupletWithSlursFunctor } from './adjusttupletsyfunctor.js';
import { AdjustXOverflowFunctor } from './adjustxoverflowfunctor.js';
import { JustifyXFunctor, JustifyYFunctor, JustifyYAdjustCrossStaffFunctor } from './justifyfunctor.js';
import { AdjustBeamsFunctor } from './adjustbeamsfunctor.js';
import { AdjustSlursFunctor } from './adjustslursfunctor.js';
import { AdjustFloatingPositionersFunctor, AdjustFloatingPositionersBetweenFunctor } from './adjustfloatingpositionerfunctor.js';
import { AdjustStaffOverlapFunctor } from './adjuststaffoverlapfunctor.js';
import { AdjustYPosFunctor, AdjustCrossStaffYPosFunctor } from './adjustyposfunctor.js';
import { CacheHorizontalLayoutFunctor } from './cachehorizontallayoutfunctor.js';
import { BBoxDeviceContext, BBOX_HORIZONTAL_ONLY } from './bboxdevicecontext.js';
import { OptionBreaks, OptionHeader, OptionFooter } from './options.js';

export const PGFUNC_NONE = 0;
export const PGFUNC_all = 1;
export const PGFUNC_first = 2;

export { DurExtreme, AttDurExtremeComparison };

export enum SlurHandling {
  Ignore = 0,
  Initialize,
  Drawing,
}

export interface PageViewLike {
  SetDoc(doc: unknown): void;
  SetPage(page: unknown, layout?: boolean): void;
  DrawCurrentPage(dc: unknown, layout?: boolean): void;
  SetSlurHandling?(handling: SlurHandling): void;
  ToLogicalX(val: number): number;
  ToLogicalY(val: number): number;
}

export class DefaultPageView implements PageViewLike {
  public SetDoc(_doc: unknown): void {}
  public SetPage(_page: unknown, _layout?: boolean): void {}
  public DrawCurrentPage(_dc: unknown, _layout?: boolean): void {}
  public SetSlurHandling?(_handling: SlurHandling): void {}
  public ToLogicalX(val: number): number { return val; }
  public ToLogicalY(val: number): number { return val; }
}

export interface InitProcessingListsFunctorLike {
  GetVerseTree(): any;
}

export interface JustifyXFunctorLike {
  SetSystemFullWidth(width: number): void;
}

export interface JustifyYFunctorLike {
  SetJustificationSum(sum: number): void;
  SetSpaceToDistribute(space: number): void;
  GetShiftForStaff(): unknown;
}

export interface JustifyYAdjustCrossStaffFunctorLike {
  SetShiftForStaff(shift: unknown): void;
}

export class DefaultInitProcessingListsFunctor extends Functor implements InitProcessingListsFunctorLike {
  public override ImplementsEndInterface(): boolean { return false; }
  public GetVerseTree(): any {
    return { child: new Map() };
  }
}

export class DefaultJustifyYFunctor extends DocFunctor implements JustifyYFunctorLike {
  private m_shifts: Map<number, number> = new Map();
  public override ImplementsEndInterface(): boolean { return false; }
  public SetJustificationSum(_sum: number): void {}
  public SetSpaceToDistribute(_space: number): void {}
  public GetShiftForStaff(): Map<number, number> { return this.m_shifts; }
}

export class DefaultJustifyYAdjustCrossStaffFunctor extends DocFunctor implements JustifyYAdjustCrossStaffFunctorLike {
  public override ImplementsEndInterface(): boolean { return false; }
  public SetShiftForStaff(_shift: unknown): void {}
}

export interface PageCollaborators {
  createView(): PageViewLike;
  createResetHorizontalAlignmentFunctor(): Functor;
  createResetVerticalAlignmentFunctor(): Functor;
  createInitProcessingListsFunctor(): Functor & InitProcessingListsFunctorLike;
  createJustifyXFunctor(doc: unknown): Functor & JustifyXFunctorLike;
  createJustifyYFunctor(doc: unknown): Functor & JustifyYFunctorLike;
  createJustifyYAdjustCrossStaffFunctor(doc: unknown): Functor & JustifyYAdjustCrossStaffFunctorLike;
}

export const DEFAULT_PAGE_COLLABORATORS: PageCollaborators = {
  createView: () => new View() as unknown as PageViewLike,
  createResetHorizontalAlignmentFunctor: () => new ResetHorizontalAlignmentFunctor(),
  createResetVerticalAlignmentFunctor: () => new ResetVerticalAlignmentFunctor(),
  createInitProcessingListsFunctor: () => new InitProcessingListsFunctor() as unknown as Functor & InitProcessingListsFunctorLike,
  createJustifyXFunctor: (doc: unknown) => new JustifyXFunctor(doc),
  createJustifyYFunctor: (doc: unknown) => new JustifyYFunctor(doc),
  createJustifyYAdjustCrossStaffFunctor: (doc: unknown) => new JustifyYAdjustCrossStaffFunctor(doc),
};

export class Page extends VrvObject {
  public static collaborators: PageCollaborators = { ...DEFAULT_PAGE_COLLABORATORS };

  public static SetCollaborators(collabs: Partial<PageCollaborators>): void {
    Page.collaborators = { ...DEFAULT_PAGE_COLLABORATORS, ...collabs };
  }

  public static ResetCollaborators(): void {
    Page.collaborators = { ...DEFAULT_PAGE_COLLABORATORS };
  }

  public m_pageWidth = -1;
  public m_pageHeight = -1;
  public m_pageMarginBottom = 0;
  public m_pageMarginLeft = 0;
  public m_pageMarginRight = 0;
  public m_pageMarginTop = 0;
  public m_surface = '';

  public m_drawingScoreDef: ScoreDef = new ScoreDef();
  public m_score: Score | null = null;
  public m_scoreEnd: Score | null = null;
  public m_PPUFactor = 1.0;
  public m_drawingJustifiableHeight = 0;
  public m_justificationSum = 0.0;
  private m_layoutDone = false;

  public constructor() {
    super(ClassId.PAGE);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();

    this.m_drawingScoreDef ??= new ScoreDef();
    this.m_drawingScoreDef.Reset();
    this.m_score = null;
    this.m_scoreEnd = null;
    this.m_layoutDone = false;
    this.ResetID();

    this.m_pageHeight = -1;
    this.m_pageWidth = -1;
    this.m_pageMarginBottom = 0;
    this.m_pageMarginLeft = 0;
    this.m_pageMarginRight = 0;
    this.m_pageMarginTop = 0;
    this.m_surface = '';
    this.m_PPUFactor = 1.0;

    this.m_drawingJustifiableHeight = 0;
    this.m_justificationSum = 0.0;
  }

  public override GetClassName(): string {
    return 'page';
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.SYSTEM) {
      return true;
    } else if (VrvObject.IsPageElement(classId)) {
      return true;
    } else {
      return false;
    }
  }

  public GetPPUFactor(): number {
    return this.m_PPUFactor;
  }

  public SetPPUFactor(PPUFactor: number): void {
    this.m_PPUFactor = PPUFactor;
  }

  public IsFirstOfSelection(): boolean {
    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) throw new Error('Page.IsFirstOfSelection: ancestor DOC is null');
    if (!doc.HasSelection?.()) return false;

    const parent = this.GetParent();
    if (!parent) throw new Error('Page.IsFirstOfSelection: parent is null');
    return parent.GetFirst?.() === (this as any);
  }

  public IsLastOfSelection(): boolean {
    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) throw new Error('Page.IsLastOfSelection: ancestor DOC is null');
    if (!doc.HasSelection?.()) return false;

    const parent = this.GetParent();
    if (!parent) throw new Error('Page.IsLastOfSelection: parent is null');
    return parent.GetLast?.() === (this as any);
  }

  public GetHeader(): RunningElement | null {
    if (!this.m_score) throw new Error('Page.GetHeader: m_score is null');
    const scoreDef = this.m_score.GetScoreDef();
    if (!scoreDef) throw new Error('Page.GetHeader: scoreDef is null');

    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) return null;
    const headerOption = doc.GetOptions?.().m_header?.getValue?.() ?? OptionHeader.auto;
    if (headerOption === OptionHeader.none) {
      return null;
    }

    const pages = doc.GetPages?.();
    if (!pages) throw new Error('Page.GetHeader: doc.GetPages() is null');

    const usePgHeaderForAll = doc.GetOptions?.().m_usePgHeaderForAll?.getValue?.() ?? false;
    if (usePgHeaderForAll) {
      let header = scoreDef.GetPgHead?.(PGFUNC_NONE) ?? null;
      if (!header) {
        header = scoreDef.GetPgHead?.(PGFUNC_all) ?? null;
      }
      return header as RunningElement | null;
    } else {
      let header: RunningElement | null = null;
      if (pages.GetFirst?.() === this) {
        header = scoreDef.GetPgHead?.(PGFUNC_first) ?? null;
      }
      if (!header) {
        header = scoreDef.GetPgHead?.(PGFUNC_all) ?? null;
      }
      return header as RunningElement | null;
    }
  }

  public GetFooter(): RunningElement | null {
    if (!this.m_scoreEnd) throw new Error('Page.GetFooter: m_scoreEnd is null');
    const scoreDef = this.m_scoreEnd.GetScoreDef();
    if (!scoreDef) throw new Error('Page.GetFooter: scoreDef is null');

    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) return null;
    const footerOption = doc.GetOptions?.().m_footer?.getValue?.() ?? OptionFooter.auto;
    if (footerOption === OptionFooter.none) {
      return null;
    }

    const pages = doc.GetPages?.();
    if (!pages) throw new Error('Page.GetFooter: doc.GetPages() is null');

    const usePgFooterForAll = doc.GetOptions?.().m_usePgFooterForAll?.getValue?.() ?? false;
    if (usePgFooterForAll) {
      let footer = scoreDef.GetPgFoot?.(PGFUNC_NONE) ?? null;
      if (!footer) {
        footer = scoreDef.GetPgFoot?.(PGFUNC_all) ?? null;
      }
      return footer as RunningElement | null;
    } else {
      let footer: RunningElement | null = null;
      if (pages.GetFirst?.() === this) {
        footer = scoreDef.GetPgFoot?.(PGFUNC_first) ?? null;
      }
      if (!footer) {
        footer = scoreDef.GetPgFoot?.(PGFUNC_all) ?? null;
      }
      return footer as RunningElement | null;
    }
  }

  public GetPageIdx(): number {
    return this.GetIdx();
  }

  public LayOut(): void {
    if (this.m_layoutDone) {
      const header = this.GetHeader();
      if (header) header.SetDrawingPage(this);
      const footer = this.GetFooter();
      if (footer) footer.SetDrawingPage(this);
      return;
    }

    this.LayOutHorizontally();
    this.JustifyHorizontally();
    this.LayOutVertically();
    this.JustifyVertically();

    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) throw new Error('Page.LayOut: ancestor DOC is null');

    if (doc.GetOptions().m_svgBoundingBoxes.getValue()) {
      const view = Page.collaborators.createView();
      view.SetDoc(doc);
      const bBoxDC = new BBoxDeviceContext(view as any, 0, 0);
      view.SetPage(this, false);
      view.DrawCurrentPage(bBoxDC, false);
    }

    this.m_layoutDone = true;
  }

  public DeprecateLayout(): void {
    this.m_layoutDone = false;
  }

  public LayOutTranscription(force = false): void {
    if (this.m_layoutDone && !force) {
      return;
    }

    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) throw new Error('Page.LayOutTranscription: ancestor DOC is null');
    if (!doc.CheckPageSize(this)) throw new Error('Page.LayOutTranscription: CheckPageSize failed');

    const resetHorizontalAlignment = Page.collaborators.createResetHorizontalAlignmentFunctor();
    this.process(resetHorizontalAlignment);

    const resetVerticalAlignment = Page.collaborators.createResetVerticalAlignmentFunctor();
    this.process(resetVerticalAlignment);

    const alignHorizontally = new AlignHorizontallyFunctor(doc);
    this.process(alignHorizontally);

    const alignVertically = new AlignVerticallyFunctor(doc);
    this.process(alignVertically);

    const calcAlignmentPitchPos = new CalcAlignmentPitchPosFunctor(doc);
    this.process(calcAlignmentPitchPos);

    const calcLigatureOrNeumePos = new CalcLigatureOrNeumePosFunctor(doc);
    this.process(calcLigatureOrNeumePos);

    const calcStem = new CalcStemFunctor(doc);
    this.process(calcStem);

    const calcChordNoteHeads = new CalcChordNoteHeadsFunctor(doc);
    this.process(calcChordNoteHeads);

    const calcDots = new CalcDotsFunctor(doc);
    this.process(calcDots);

    if (!this.m_layoutDone) {
      const view = Page.collaborators.createView();
      view.SetDoc(doc);
      const bBoxDC = new BBoxDeviceContext(view as any, 0, 0, BBOX_HORIZONTAL_ONLY);
      view.SetPage(this, false);
      view.DrawCurrentPage(bBoxDC, false);
    }

    const adjustXRelForTranscription = new AdjustXRelForTranscriptionFunctor();
    this.process(adjustXRelForTranscription);
    const adjustYRelForTranscription = new AdjustYRelForTranscriptionFunctor();
    this.process(adjustYRelForTranscription);

    const calcLedgerLines = new CalcLedgerLinesFunctor(doc);
    this.process(calcLedgerLines);

    this.m_layoutDone = true;
  }

  public ResetAligners(): void {
    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) throw new Error('Page.ResetAligners: ancestor DOC is null');
    if (!doc.CheckPageSize(this)) throw new Error('Page.ResetAligners: CheckPageSize failed');

    const resetHorizontalAlignment = Page.collaborators.createResetHorizontalAlignmentFunctor();
    this.process(resetHorizontalAlignment);

    const resetVerticalAlignment = Page.collaborators.createResetVerticalAlignmentFunctor();
    this.process(resetVerticalAlignment);

    const alignHorizontally = new AlignHorizontallyFunctor(doc);
    this.process(alignHorizontally);

    const alignVertically = new AlignVerticallyFunctor(doc);
    this.process(alignVertically);

    if (!doc.GetOptions().m_evenNoteSpacing.getValue()) {
      let longestActualDur: data_DURATION = DURATION_4;

      if (doc.GetOptions().m_spacingDurDetection.getValue()) {
        const durExtremeComparison = new AttDurExtremeComparison(DurExtreme.LONGEST);
        const longestDur = this.FindDescendantExtremeByComparison(durExtremeComparison);
        if (longestDur) {
          const durationInterface = longestDur.GetDurationInterface?.() ?? (longestDur as any);
          if (!durationInterface) throw new Error('Page.ResetAligners: durationInterface is null');
          longestActualDur = durationInterface.GetActualDur?.() ?? DURATION_4;
        }
      }

      const calcAlignmentXPos = new CalcAlignmentXPosFunctor(doc);
      calcAlignmentXPos.SetLongestActualDur(longestActualDur);
      this.process(calcAlignmentXPos);
    }

    const calcAlignmentPitchPos = new CalcAlignmentPitchPosFunctor(doc);
    this.process(calcAlignmentPitchPos);

    const calcLigatureOrNeumePos = new CalcLigatureOrNeumePosFunctor(doc);
    this.process(calcLigatureOrNeumePos);

    const calcStem = new CalcStemFunctor(doc);
    this.process(calcStem);

    const calcChordNoteHeads = new CalcChordNoteHeadsFunctor(doc);
    this.process(calcChordNoteHeads);

    const calcDots = new CalcDotsFunctor(doc);
    this.process(calcDots);

    const calcArtic = new CalcArticFunctor(doc);
    this.process(calcArtic);

    const calcSlurDirection = new CalcSlurDirectionFunctor(doc);
    this.process(calcSlurDirection);

    const calcSpanningBeamSpans = new CalcSpanningBeamSpansFunctor(doc);
    this.process(calcSpanningBeamSpans);
  }

  public LayOutHorizontally(): void {
    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) throw new Error('Page.LayOutHorizontally: ancestor DOC is null');
    if (!doc.CheckPageSize(this)) throw new Error('Page.LayOutHorizontally: CheckPageSize failed');

    this.ResetAligners();

    const view = Page.collaborators.createView();
    view.SetDoc(doc);
    view.SetSlurHandling?.(SlurHandling.Ignore);
    const bBoxDC = new BBoxDeviceContext(view as any, 0, 0, BBOX_HORIZONTAL_ONLY);
    view.SetPage(this as any, false);
    view.DrawCurrentPage(bBoxDC as any, false);

    const adjustOssiaStaffDef = new AdjustOssiaStaffDefFunctor(doc);
    this.process(adjustOssiaStaffDef);

    const adjustArtic = new AdjustArticFunctor(doc);
    this.process(adjustArtic);

    const adjustLayers = new AdjustLayersFunctor(doc);
    this.process(adjustLayers);

    const adjustDots = new AdjustDotsFunctor(doc);
    this.process(adjustDots);

    const adjustNeumeX = new AdjustNeumeXFunctor(doc);
    this.process(adjustNeumeX);

    const adjustLayersWithDots = new AdjustLayersFunctor(doc);
    adjustLayersWithDots.IgnoreDots(false);
    this.process(adjustLayersWithDots);

    const adjustAccidX = new AdjustAccidXFunctor(doc);
    this.process(adjustAccidX);

    const adjustXPos = new AdjustXPosFunctor(doc);
    adjustXPos.SetExcluded([ClassId.TABDURSYM]);
    this.process(adjustXPos);

    adjustXPos.ClearExcluded();
    adjustXPos.SetIncluded([ClassId.BARLINE, ClassId.KEYSIG, ClassId.METERSIG, ClassId.TABDURSYM]);
    adjustXPos.SetRightBarLinesOnly(true);
    this.process(adjustXPos);

    const adjustGraceXPos = new AdjustGraceXPosFunctor(doc);
    this.process(adjustGraceXPos);

    const adjustClefChanges = new AdjustClefChangesFunctor(doc);
    this.process(adjustClefChanges);

    const initProcessingLists = Page.collaborators.createInitProcessingListsFunctor();
    this.process(initProcessingLists);

    this.AdjustSylSpacingByVerse(initProcessingLists.GetVerseTree(), doc);

    const adjustHarmGrpsSpacing = new AdjustHarmGrpsSpacingFunctor(doc);
    this.process(adjustHarmGrpsSpacing);

    const adjustArpeg = new AdjustArpegFunctor(doc);
    this.process(adjustArpeg);

    const adjustTempo = new AdjustTempoFunctor(doc);
    this.process(adjustTempo);

    const adjustTupletsX = new AdjustTupletsXFunctor(doc);
    this.process(adjustTupletsX);

    const adjustXOverflow = new AdjustXOverflowFunctor(doc.GetDrawingUnit(100));
    this.process(adjustXOverflow);

    const alignMeasures = new AlignMeasuresFunctor(doc);
    this.process(alignMeasures);
  }

  public LayOutHorizontallyWithCache(restore = false): void {
    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) throw new Error('Page.LayOutHorizontallyWithCache: ancestor DOC is null');

    const cacheHorizontalLayout = new CacheHorizontalLayoutFunctor(doc);
    cacheHorizontalLayout.SetRestore(restore);
    this.process(cacheHorizontalLayout);
  }

  public LayOutVertically(): void {
    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) throw new Error('Page.LayOutVertically: ancestor DOC is null');
    if (!doc.CheckPageSize(this)) throw new Error('Page.LayOutVertically: CheckPageSize failed');

    const resetVerticalAlignment = Page.collaborators.createResetVerticalAlignmentFunctor();
    this.process(resetVerticalAlignment);

    const calcLedgerLines = new CalcLedgerLinesFunctor(doc);
    this.process(calcLedgerLines);

    const alignVertically = new AlignVerticallyFunctor(doc);
    this.process(alignVertically);

    const view = Page.collaborators.createView();
    const bBoxDC = new BBoxDeviceContext(view as any, 0, 0);
    view.SetDoc(doc);
    view.SetPage(this, false);
    view.DrawCurrentPage(bBoxDC, false);

    const adjustArticWithSlurs = new AdjustArticWithSlursFunctor(doc);
    this.process(adjustArticWithSlurs);

    const adjustBeams = new AdjustBeamsFunctor(doc);
    this.process(adjustBeams);

    const adjustTupletsY = new AdjustTupletsYFunctor(doc);
    this.process(adjustTupletsY);

    const adjustSlurs = new AdjustSlursFunctor(doc);
    this.process(adjustSlurs);

    view.SetSlurHandling?.(SlurHandling.Drawing);
    view.SetPage(this, false);
    view.DrawCurrentPage(bBoxDC, false);

    const adjustTupletWithSlurs = new AdjustTupletWithSlursFunctor(doc);
    this.process(adjustTupletWithSlurs);

    const calcBBoxOverflows = new CalcBBoxOverflowsFunctor(doc);
    this.process(calcBBoxOverflows);

    const adjustFloatingPositioners = new AdjustFloatingPositionersFunctor(doc);
    this.process(adjustFloatingPositioners);

    const adjustStaffOverlap = new AdjustStaffOverlapFunctor(doc);
    this.process(adjustStaffOverlap);

    const adjustYPos = new AdjustYPosFunctor(doc);
    this.process(adjustYPos);

    const adjustFloatingPositionersBetween = new AdjustFloatingPositionersBetweenFunctor(doc);
    this.process(adjustFloatingPositionersBetween);

    const adjustCrossStaffYPos = new AdjustCrossStaffYPosFunctor(doc);
    this.process(adjustCrossStaffYPos);

    if (adjustSlurs.HasCrossStaffSlurs?.()) {
      view.SetSlurHandling?.(SlurHandling.Initialize);
      view.SetPage(this, false);
      view.DrawCurrentPage(bBoxDC, false);
      this.process(adjustSlurs);
    }

    const header = this.GetHeader();
    if (header) {
      header.AdjustRunningElementYPos?.();
    }

    const footer = this.GetFooter();
    if (footer) {
      footer.AdjustRunningElementYPos?.();
    }

    const alignSystems = new AlignSystemsFunctor(doc);
    alignSystems.SetShift(doc.m_drawingPageContentHeight);
    alignSystems.SetSystemSpacing(doc.GetOptions().m_spacingSystem.getValue() * doc.GetDrawingUnit(100));
    this.process(alignSystems);
  }

  public JustifyHorizontally(): void {
    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) throw new Error('Page.JustifyHorizontally: ancestor DOC is null');

    const options = doc.GetOptions();
    if (options.m_breaks.getValue() === OptionBreaks.none || options.m_noJustification.getValue()) {
      return;
    }

    if (!doc.CheckPageSize(this)) throw new Error('Page.JustifyHorizontally: CheckPageSize failed');

    if (options.m_adjustPageWidth.getValue()) {
      doc.m_drawingPageContentWidth = this.GetContentWidth();
      doc.m_drawingPageWidth = doc.m_drawingPageContentWidth + doc.m_drawingPageMarginLeft + doc.m_drawingPageMarginRight;
    } else {
      const justifyX = Page.collaborators.createJustifyXFunctor(doc);
      justifyX.SetSystemFullWidth(doc.m_drawingPageContentWidth);
      this.process(justifyX);
    }
  }

  public JustifyVertically(): void {
    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) throw new Error('Page.JustifyVertically: ancestor DOC is null');
    if (!doc.CheckPageSize(this)) throw new Error('Page.JustifyVertically: CheckPageSize failed');

    if (this.m_drawingJustifiableHeight <= 0 || this.m_justificationSum <= 0) {
      return;
    }

    if (!doc.GetOptions().m_justifyVertically.getValue()) {
      return;
    }

    this.ReduceJustifiableHeight(doc);

    const justifyY = Page.collaborators.createJustifyYFunctor(doc);
    justifyY.SetJustificationSum(this.m_justificationSum);
    justifyY.SetSpaceToDistribute(this.m_drawingJustifiableHeight);
    this.process(justifyY);

    const shifts = justifyY.GetShiftForStaff();
    const hasShifts = shifts instanceof Map ? shifts.size > 0 : Object.keys(shifts ?? {}).length > 0;
    if (hasShifts) {
      const justifyYAdjustCrossStaff = Page.collaborators.createJustifyYAdjustCrossStaffFunctor(doc);
      justifyYAdjustCrossStaff.SetShiftForStaff(shifts);
      this.process(justifyYAdjustCrossStaff);
    }
  }

  public LayOutPitchPos(): void {
    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) throw new Error('Page.LayOutPitchPos: ancestor DOC is null');
    if (!doc.CheckPageSize(this)) throw new Error('Page.LayOutPitchPos: CheckPageSize failed');

    const calcAlignmentPitchPos = new CalcAlignmentPitchPosFunctor(doc);
    this.process(calcAlignmentPitchPos);

    const calcStem = new CalcStemFunctor(doc);
    this.process(calcStem);

    const calcLedgerLines = new CalcLedgerLinesFunctor(doc);
    this.process(calcLedgerLines);
  }

  public GetContentHeight(): number {
    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) throw new Error('Page.GetContentHeight: ancestor DOC is null');
    if (!doc.CheckPageSize(this)) throw new Error('Page.GetContentHeight: CheckPageSize failed');

    if (this.GetChildren().length === 0) {
      return 0;
    }

    const last = this.GetLast(ClassId.SYSTEM) as System | null;
    if (!last) throw new Error('Page.GetContentHeight: last SYSTEM is null');

    let height = doc.m_drawingPageContentHeight - (last.GetDrawingYRel?.() ?? 0) + (last.GetHeight?.() ?? 0);

    const footer = this.GetFooter();
    if (footer) {
      height += footer.GetTotalHeight(doc);
    }

    return height;
  }

  public GetContentWidth(): number {
    const doc = this.GetFirstAncestor(ClassId.DOC) as any;
    if (!doc) return 0;
    if (!doc.CheckPageSize(this)) throw new Error('Page.GetContentWidth: CheckPageSize failed');

    let maxWidth = 0;
    for (const child of this.GetChildren()) {
      if (child.Is(ClassId.SYSTEM)) {
        const system = child as System;
        const systemWidth = (system.m_drawingTotalWidth ?? 0) + (system.m_systemLeftMar ?? 0) + (system.m_systemRightMar ?? 0);
        maxWidth = Math.max(systemWidth, maxWidth);
      }
    }
    return maxWidth;
  }

  public override Accept(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitPage', this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitPageEnd', this);
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitPage', this);
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitPageEnd', this);
  }

  private process(functor: any): void {
    this.Process(functor as any);
  }

  private intTreeEntries(tree: any): [number, any][] {
    const child = tree?.child;
    if (!child) return [];
    // C++ IntTree.child is std::map<int, IntTree>: ascending numeric order, not insertion order.
    const list: [number, any][] = child instanceof Map ? Array.from(child.entries())
      : Array.isArray(child) ? Array.from(child)
      : Object.entries(child).map(([key, value]) => [Number(key), value]);
    list.sort((a, b) => a[0] - b[0]);
    return list;
  }

  private AdjustSylSpacingByVerse(verseTree: any, doc: any): void {
    if (!verseTree || !verseTree.child) return;

    for (const [staffN, staves] of this.intTreeEntries(verseTree)) {
      for (const [layerN, layers] of this.intTreeEntries(staves)) {
        for (const [verseN, verses] of this.intTreeEntries(layers)) {
          for (const [voltaTrack] of this.intTreeEntries(verses)) {
            // C++ builds `Filters` from four stack comparisons (page.cpp:779-781);
            // plain arrays do not satisfy Object::Process's filter contract.
            const filters = new Filters([
              new AttNIntegerComparison(ClassId.STAFF, staffN),
              new AttNIntegerComparison(ClassId.LAYER, layerN),
              new LyricElementComparison(ClassId.VERSE, verseN),
              new LyricElementComparison(ClassId.REFRAIN, verseN),
            ]);

            const adjustSylSpacing = new AdjustSylSpacingFunctor(doc, voltaTrack);
            adjustSylSpacing.SetFilters(filters);
            this.process(adjustSylSpacing);
          }
        }
      }
    }
  }

  private ReduceJustifiableHeight(doc: any): void {
    const pages = doc.GetPages();
    if (!pages) throw new Error('Page.ReduceJustifiableHeight: doc.GetPages() is null');

    let maxRatio = doc.GetOptions().m_justificationMaxVertical.getValue();
    if (pages.GetLast?.() === this) {
      const firstSystem = this.GetFirst(ClassId.SYSTEM) as System | null;
      const lastSystem = this.GetLast(ClassId.SYSTEM) as System | null;
      if (firstSystem && lastSystem) {
        const usedDrawingHeight = firstSystem.GetDrawingY() - lastSystem.GetDrawingY() + (lastSystem.GetHeight?.() ?? 0);
        maxRatio *= usedDrawingHeight / doc.m_drawingPageHeight;
      }
    }

    this.m_drawingJustifiableHeight = Math.min(
      Math.trunc(doc.m_drawingPageHeight * maxRatio),
      this.m_drawingJustifiableHeight
    );
  }
}

function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('page', ClassId.PAGE, () => new Page());
