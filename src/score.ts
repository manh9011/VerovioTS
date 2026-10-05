/**
 * Pure TypeScript translation of Verovio's `Score`
 * (`src-cpp/src/score.cpp` + `src-cpp/include/vrv/score.h`).
 *
 * C++ has `Score` inherit `PageElement` + `PageMilestoneInterface` +
 * `AttLabelled` + `AttNNumberLike`; TypeScript models the multiple
 * inheritance with composition. The `m_scoreDefSubtree`/`m_scoreDef`
 * ownership pair is preserved: the subtree is owned by the Score and the
 * scoreDef pointer is expected to be part of that subtree.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { PageElement } from './pageelement.js';
import { PageMilestoneInterface, PageMilestoneEnd } from './pagemilestone.js';
import { InstLabelled, InstNNumberLike } from './atts_shared.js';
import { ScoreDef } from './scoredef.js';
import { ObjectFactory, VrvObject } from './object.js';
import { Page } from './page.js';

const BOOLEAN_true = 1;
/** Canonical `CONDENSE_none`/`CONDENSE_auto`/`CONDENSE_encoded` ordinals (vrvdef.h). */
export const CONDENSE_none = 0;
export const CONDENSE_auto = 1;
export const CONDENSE_encoded = 2;

/** Structural contract for the not-yet-migrated `Doc` collaborator. */
export interface ScoreDocLike {
  GetPages(): { AddChild(child: VrvObject): unknown; GetChildCount(): number; DeleteChild(child: VrvObject): unknown } | null;
  SetDrawingPage(pageIdx: number): unknown;
  ResetDataPage(): void;
}

/** Structural contract for the not-yet-migrated `Page` collaborator. */
export interface ScorePageLike extends VrvObject {
  m_score?: unknown;
  m_scoreEnd?: unknown;
  LayOutVertically(): void;
  GetHeader(): { GetTotalHeight(doc: unknown): number } | null;
  GetFooter(): { GetTotalHeight(doc: unknown): number } | null;
}

/** Pure TypeScript translation of Verovio's `Score`. */
export class Score extends PageElement {
  /** The scoreDef member is expected to be part of the owned subtree. */
  public m_scoreDef: ScoreDef | null = null;
  /** Owned subtree (C++ `Object *m_scoreDefSubtree` owning pointer). */
  private m_scoreDefSubtree: VrvObject | null = null;

  private pageMilestoneInterface: PageMilestoneInterface | null = null;
  private attLabelled: InstLabelled | null = null;
  private attNNumberLike: InstNNumberLike | null = null;

  public m_drawingPgHeadHeight = 0;
  public m_drawingPgFootHeight = 0;
  public m_drawingPgHead2Height = 0;
  public m_drawingPgFoot2Height = 0;

  public constructor(createScoreDef: boolean = true) {
    super(ClassId.SCORE);
    this.ensureComponents();
    this.RegisterAttClass(ATT_LABELLED);
    this.RegisterAttClass(ATT_NNUMBERLIKE);

    if (createScoreDef) {
      this.m_scoreDef = new ScoreDef();
      this.m_scoreDefSubtree = this.m_scoreDef as unknown as VrvObject;
    } else {
      this.m_scoreDef = null;
      this.m_scoreDefSubtree = null;
    }

    this.Reset();
  }

  public override GetClassName(): string { return 'score'; }

  public override Reset(): void {
    // C++ Score::Reset() calls Object::Reset() (not PageElement::Reset()).
    VrvObject.prototype.Reset.call(this);
    this.pageMilestoneInterface?.Reset();
    this.attLabelled?.ResetLabelled();
    this.attNNumberLike?.ResetNNumberLike();

    this.m_drawingPgHeadHeight = 0;
    this.m_drawingPgFootHeight = 0;
    this.m_drawingPgHead2Height = 0;
    this.m_drawingPgFoot2Height = 0;
  }

  private ensureComponents(): void {
    this.pageMilestoneInterface ??= new PageMilestoneInterface();
    this.attLabelled ??= new InstLabelled();
    this.attNNumberLike ??= new InstNNumberLike();
  }

  //---------//
  // Children //
  //---------//

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [ClassId.ENDING, ClassId.PB, ClassId.SCOREDEF, ClassId.SB, ClassId.SECTION];
    if (supported.includes(classId)) return true;
    if (VrvObject.IsEditorialElement(classId)) return true;
    return false;
  }

  //---------------------//
  // ScoreDef ownership  //
  //---------------------//

  public GetScoreDef(): ScoreDef | null { return this.m_scoreDef; }
  public GetScoreDefSubtree(): VrvObject | null { return this.m_scoreDefSubtree; }

  /** Set an externally-owned scoreDef subtree (C++ asserts both are unset). */
  public SetScoreDefSubtree(subtree: VrvObject, scoreScoreDef: ScoreDef): void {
    if (this.m_scoreDef) throw new Error('Score::SetScoreDefSubtree: m_scoreDef must be unset.');
    if (this.m_scoreDefSubtree) throw new Error('Score::SetScoreDefSubtree: m_scoreDefSubtree must be unset.');
    this.m_scoreDefSubtree = subtree;
    this.m_scoreDef = scoreScoreDef;
  }

  /** C++ destructor deletes the owned subtree and clears the member pointers. */
  public DestroyScoreDefSubtree(): void {
    this.m_scoreDefSubtree = null;
    this.m_scoreDef = null;
  }

  //------------------------------//
  // PageMilestoneInterface facade //
  //------------------------------//

  public GetPageMilestoneInterface(): PageMilestoneInterface | null { return this.pageMilestoneInterface; }

  public SetEnd(end: PageMilestoneEnd): void { this.pageMilestoneInterface!.SetEnd(end); }
  public GetEnd(): PageMilestoneEnd | null { return this.pageMilestoneInterface!.GetEnd(); }
  public IsPageMilestone(): boolean { return this.pageMilestoneInterface?.IsPageMilestone() ?? false; }
  /** C++ `Score` inherits `PageMilestoneInterface::ConvertToPageBasedMilestone` via multiple inheritance. */
  public ConvertToPageBasedMilestone(object: VrvObject, parent: VrvObject): void {
    this.pageMilestoneInterface!.ConvertToPageBasedMilestone(object, parent);
  }

  //---------------------------//
  // Attribute facades          //
  //---------------------------//

  public ResetLabelled(): void { this.attLabelled!.ResetLabelled(); }
  public SetLabel(v: string): void { this.attLabelled!.SetLabel(v); }
  public GetLabel(): string { return this.attLabelled!.GetLabel(); }
  public HasLabel(): boolean { return this.attLabelled!.HasLabel(); }

  public ResetNNumberLike(): void { this.attNNumberLike!.ResetNNumberLike(); }
  public SetN(v: string): void { this.attNNumberLike!.SetN(v); }
  public GetN(): string { return this.attNNumberLike!.GetN(); }
  public HasN(): boolean { return this.attNNumberLike!.HasN(); }

  //--------------------------//
  // Running element heights  //
  //--------------------------//

  /**
   * Calculate the drawing heights of the running elements (pgHead/pgFoot)
   * on the first two pages by laying out temporary pages.
   */
  public CalcRunningElementHeight(doc: ScoreDocLike): void {
    if (!doc) throw new Error('Score::CalcRunningElementHeight: doc required.');

    const pages = doc.GetPages();
    if (!pages) throw new Error('Score::CalcRunningElementHeight: pages required.');
    if (pages.GetChildCount() !== 0) {
      throw new Error('Score::CalcRunningElementHeight: pages must be empty.');
    }

    const page1 = this.createTempPage();
    pages.AddChild(page1);
    doc.SetDrawingPage(0);
    page1.LayOutVertically();

    const page1Header = page1.GetHeader();
    const page1Footer = page1.GetFooter();

    this.m_drawingPgHeadHeight = page1Header ? page1Header.GetTotalHeight(doc) : 0;
    this.m_drawingPgFootHeight = page1Footer ? page1Footer.GetTotalHeight(doc) : 0;

    const page2 = this.createTempPage();
    pages.AddChild(page2);
    doc.SetDrawingPage(1);
    page2.LayOutVertically();

    const page2Header = page2.GetHeader();
    const page2Footer = page2.GetFooter();

    this.m_drawingPgHead2Height = page2Header ? page2Header.GetTotalHeight(doc) : 0;
    this.m_drawingPgFoot2Height = page2Footer ? page2Footer.GetTotalHeight(doc) : 0;

    pages.DeleteChild(page1);
    pages.DeleteChild(page2);

    doc.ResetDataPage();
  }

  private createTempPage(): ScorePageLike {
    // Page is not yet migrated; a narrow structural factory keeps this
    // orchestration testable without inventing Page layout behavior.
    const factory = Score.s_pageFactory;
    if (!factory) throw new Error('Score::CalcRunningElementHeight: Page factory not installed.');
    const page = factory();
    page.m_score = this;
    page.m_scoreEnd = this;
    return page;
  }

  /** Injectable structural factory for `Page`. Defaults to `() => new Page()`. */
  private static s_pageFactory: (() => ScorePageLike) | null = () => new Page() as unknown as ScorePageLike;
  public static SetPageFactory(factory: (() => ScorePageLike) | null): void { Score.s_pageFactory = factory; }

  /** True when the scoreDef requires optimization for the given condense option. */
  public ScoreDefNeedsOptimization(optionCondense: number): boolean {
    if (!this.m_scoreDef) throw new Error('Score::ScoreDefNeedsOptimization: m_scoreDef required.');

    if (optionCondense === CONDENSE_none) return false;
    // optimize scores only if encoded
    let optimize = this.m_scoreDef.HasOptimize() && this.m_scoreDef.GetOptimize() === BOOLEAN_true;
    // if nothing specified, do not if there is only one grpSym
    if (optionCondense === CONDENSE_auto && !this.m_scoreDef.HasOptimize()) {
      const symbols = (this.m_scoreDefSubtree ?? (this.m_scoreDef as unknown as VrvObject))
        .FindAllDescendantsByType(ClassId.GRPSYM);
      optimize = symbols.length > 1;
    }
    return optimize;
  }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitScore', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitScoreEnd', this); }

  public override Clone(): VrvObject {
    const clone = new Score(false);
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attLabelled!.HasLabel()) clone.attLabelled!.SetLabel(this.attLabelled!.GetLabel());
    if (this.attNNumberLike!.HasN()) clone.attNNumberLike!.SetN(this.attNNumberLike!.GetN());
    if (this.m_scoreDefSubtree) {
      clone.m_scoreDefSubtree = this.m_scoreDefSubtree.Clone();
      clone.m_scoreDef = (clone.m_scoreDefSubtree as unknown as ScoreDef) ?? null;
    }
    clone.m_drawingPgHeadHeight = this.m_drawingPgHeadHeight;
    clone.m_drawingPgFootHeight = this.m_drawingPgFootHeight;
    clone.m_drawingPgHead2Height = this.m_drawingPgHead2Height;
    clone.m_drawingPgFoot2Height = this.m_drawingPgFoot2Height;
    return clone;
  }
}

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_LABELLED = 145;
const ATT_NNUMBERLIKE = 168;

/** C++ FunctorInterface default forwarding helper (VisitScore -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('score', ClassId.SCORE, () => new Score());
