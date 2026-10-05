import { Functor } from './functor.js';
import { FunctorCode } from './vrvdef.js';

/** Structural page contract used by the page-based converter until Page is migrated. */
export interface ConvertPageLike {
  AddChild(child: any): boolean | void;
}

/**
 * Pure TypeScript translation of ConvertToPageBasedFunctor from convertfunctor.cpp.
 * Domain classes remain structural until their owning classes are migrated.
 */
export class ConvertToPageBasedFunctor extends Functor {
  private readonly m_page: ConvertPageLike;
  private m_currentSystem: any | null = null;
  private m_systemFactory: (() => any) | null = null;

  public constructor(page: ConvertPageLike) {
    super();
    if (!page) throw new Error('ConvertToPageBasedFunctor requires a page.');
    this.m_page = page;
  }

  public override VisitObject(_object: any): FunctorCode { return FunctorCode.FUNCTOR_CONTINUE; }

  public override ImplementsEndInterface(): boolean { return true; }

  public VisitDiv(div: any): FunctorCode {
    if (!this.m_currentSystem) throw new Error('ConvertToPageBasedFunctor: current system is unset.');
    div.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitEditorialElement(editorialElement: any): FunctorCode {
    if (!this.m_currentSystem) throw new Error('ConvertToPageBasedFunctor: current system is unset.');
    editorialElement.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitEditorialElementEnd(editorialElement: any): FunctorCode {
    if (!editorialElement.IsHidden()) {
      editorialElement.ConvertToPageBasedMilestone(editorialElement, this.m_currentSystem);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitEnding(ending: any): FunctorCode {
    if (!this.m_currentSystem) throw new Error('ConvertToPageBasedFunctor: current system is unset.');
    ending.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitEndingEnd(ending: any): FunctorCode {
    ending.ConvertToPageBasedMilestone(ending, this.m_currentSystem);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: any): FunctorCode {
    if (!this.m_currentSystem) throw new Error('ConvertToPageBasedFunctor: current system is unset.');
    measure.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMdiv(mdiv: any): FunctorCode {
    mdiv.MoveItselfTo(this.m_page);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMdivEnd(mdiv: any): FunctorCode {
    if (!mdiv.IsHidden()) {
      mdiv.ConvertToPageBasedMilestone(mdiv, this.m_page);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScore(score: any): FunctorCode {
    if (this.m_currentSystem) throw new Error('ConvertToPageBasedFunctor: score nesting is invalid.');
    score.MoveItselfTo(this.m_page);
    const system = this.createSystem();
    this.m_currentSystem = system;
    this.m_page.AddChild(system);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScoreEnd(score: any): FunctorCode {
    score.ConvertToPageBasedMilestone(score, this.m_page);
    this.m_currentSystem = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScoreDef(scoreDef: any): FunctorCode {
    if (!this.m_currentSystem) throw new Error('ConvertToPageBasedFunctor: current system is unset.');
    scoreDef.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSection(section: any): FunctorCode {
    if (!this.m_currentSystem) throw new Error('ConvertToPageBasedFunctor: current system is unset.');
    section.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSectionEnd(section: any): FunctorCode {
    section.ConvertToPageBasedMilestone(section, this.m_currentSystem);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemElement(systemElement: any): FunctorCode {
    if (!this.m_currentSystem) throw new Error('ConvertToPageBasedFunctor: current system is unset.');
    systemElement.MoveItselfTo(this.m_currentSystem);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public GetCurrentSystem(): any | null { return this.m_currentSystem; }

  private createSystem(): any {
    if (typeof this.m_systemFactory === 'function') return this.m_systemFactory();
    throw new Error('ConvertToPageBasedFunctor requires a System factory.');
  }

  public SetSystemFactory(factory: () => any): void {
    this.m_systemFactory = factory;
  }
}
