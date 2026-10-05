/**
 * Pure TypeScript translation of Verovio's src/adjustharmgrpsspacingfunctor.cpp.
 *
 * The implementation intentionally preserves the two-pass-per-system algorithm,
 * traversal order, overlap arithmetic and proportional-adjustment timing.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode } from './vrvdef.js';

export type AdjustmentTuple = [HarmAlignmentLike, HarmAlignmentLike, number];

export interface HarmStartLike {
  GetDrawingX(): number;
  GetAlignment(): HarmAlignmentLike;
}

export interface HarmLike {
  GetDrawingGrpId(): number;
  GetStart(): HarmStartLike | null;
  GetID(): string;
  GetClassName(): string;
  GetFirstAncestor(classId: ClassId): HarmMeasureLike | null;
}

export interface HarmFloatingPositionerLike {
  GetContentLeft(): number;
  GetContentRight(): number;
  HasContentBB(): boolean;
  GetObject(): { GetFirstAncestor(classId: ClassId): unknown } | null;
}

export interface HarmAlignmentLike {
  GetXRel(): number;
}

export interface HarmMeasureAlignerLike {
  AdjustProportionally(boundaries: AdjustmentTuple[]): void;
}

export interface HarmMeasureLike {
  m_measureAligner: HarmMeasureAlignerLike;
  GetLeftBarLine(): { GetAlignment(): HarmAlignmentLike } | null;
  GetRightBarLine(): { GetAlignment(): HarmAlignmentLike };
  GetWidth(): number;
}

export interface HarmSystemAlignerLike {
  FindAllPositionerPointingTo(out: HarmFloatingPositionerLike[], object: HarmLike): void;
}

export interface HarmSystemLike {
  m_systemAligner: HarmSystemAlignerLike;
  Process(functor: AdjustHarmGrpsSpacingFunctor): void;
}

export interface AdjustHarmDocLike {
  GetDrawingUnit(value: number): number;
}

/** Structural subset of Syl used by the original static helper. */
export interface HarmSylAdapter {
  AdjustToLyricSize(doc: AdjustHarmDocLike, wordSpace: number): number;
}

export class AdjustHarmGrpsSpacingFunctor extends DocFunctor {
  private readonly m_grpIds: number[] = [];
  private m_currentGrp = 0;
  private readonly m_overlappingHarm: AdjustmentTuple[] = [];
  private m_previousHarmPositioner: HarmFloatingPositionerLike | null = null;
  private m_previousHarmStart: HarmStartLike | null = null;
  private m_previousMeasure: HarmMeasureLike | null = null;
  private m_currentSystem: HarmSystemLike | null = null;
  private readonly syl: HarmSylAdapter;

  public constructor(doc: AdjustHarmDocLike, sylAdapter?: HarmSylAdapter) {
    super(doc);
    this.syl = sylAdapter ?? { AdjustToLyricSize: (_doc, value) => value };
  }

  public override ImplementsEndInterface(): boolean { return true; }

  public VisitHarm(harm: HarmLike): FunctorCode {
    const currentGrpId = harm.GetDrawingGrpId();
    if (currentGrpId === 0) return FunctorCode.FUNCTOR_SIBLINGS;

    if (this.m_currentGrp === 0) {
      if (!this.m_grpIds.includes(currentGrpId)) this.m_grpIds.push(currentGrpId);
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    if (currentGrpId !== this.m_currentGrp) return FunctorCode.FUNCTOR_SIBLINGS;

    const positioners: HarmFloatingPositionerLike[] = [];
    if (!this.m_currentSystem) throw new Error('AdjustHarmGrpsSpacingFunctor: current system invariant violated');
    this.m_currentSystem.m_systemAligner.FindAllPositionerPointingTo(positioners, harm);
    if (positioners.length === 0) return FunctorCode.FUNCTOR_SIBLINGS;

    let harmPositioner: HarmFloatingPositionerLike | null = null;
    for (const positioner of positioners) {
      if (!harmPositioner || harmPositioner.GetContentLeft() > positioner.GetContentLeft()) harmPositioner = positioner;
    }

    if (!harmPositioner || !harmPositioner.HasContentBB()) return FunctorCode.FUNCTOR_SIBLINGS;

    const start = harm.GetStart();
    if (this.m_previousHarmStart && start && this.m_previousHarmStart === start) {
      this.m_previousHarmPositioner = harmPositioner;
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    if (!start) throw new Error('AdjustHarmGrpsSpacingFunctor: Harm start invariant violated');

    if (!this.m_previousMeasure && !this.m_previousHarmPositioner) {
      const overflow = start.GetDrawingX() + harmPositioner.GetContentLeft();
      const measure = harm.GetFirstAncestor(ClassId.MEASURE);
      const leftBarline = measure?.GetLeftBarLine() ?? null;
      if (overflow < 0 && leftBarline) {
        this.m_overlappingHarm.push([
          leftBarline.GetAlignment(),
          start.GetAlignment(),
          -overflow,
        ]);
      }
    }

    if (!this.m_previousHarmPositioner) {
      this.m_previousHarmStart = start;
      this.m_previousHarmPositioner = harmPositioner;
      this.m_previousMeasure = null;
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    let xShift = 0;
    if (this.m_previousMeasure) xShift = this.m_previousMeasure.GetWidth();

    if (!this.m_previousHarmStart) throw new Error('AdjustHarmGrpsSpacingFunctor: previous harm start invariant violated');

    let overlap = this.m_previousHarmPositioner.GetContentRight() - (harmPositioner.GetContentLeft() + xShift);
    let wordSpace = 2 * (this.m_doc as AdjustHarmDocLike).GetDrawingUnit(100);
    wordSpace = this.syl.AdjustToLyricSize(this.m_doc as AdjustHarmDocLike, wordSpace);
    overlap += wordSpace;

    if (overlap > 0) {
      if (this.m_previousMeasure) {
        const rightBarline = this.m_previousMeasure.GetRightBarLine();
        this.m_overlappingHarm.push([
          this.m_previousHarmStart.GetAlignment(),
          rightBarline.GetAlignment(),
          overlap,
        ]);
        this.m_previousMeasure.m_measureAligner.AdjustProportionally(this.m_overlappingHarm);
        this.m_overlappingHarm.length = 0;
      } else {
        this.m_overlappingHarm.push([
          this.m_previousHarmStart.GetAlignment(),
          start.GetAlignment(),
          overlap,
        ]);
      }
    }

    this.m_previousHarmStart = start;
    this.m_previousHarmPositioner = harmPositioner;
    this.m_previousMeasure = null;
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasureEnd(measure: HarmMeasureLike): FunctorCode {
    this.m_previousMeasure = measure;
    measure.m_measureAligner.AdjustProportionally(this.m_overlappingHarm);
    this.m_overlappingHarm.length = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: HarmSystemLike): FunctorCode {
    this.m_currentSystem = system;
    this.m_overlappingHarm.length = 0;
    this.m_previousHarmPositioner = null;
    this.m_previousHarmStart = null;
    this.m_previousMeasure = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemEnd(system: HarmSystemLike): FunctorCode {
    if (this.m_currentGrp === 0) {
      for (const grpId of this.m_grpIds) {
        this.m_currentGrp = grpId;
        system.Process(this);
      }
      this.m_currentGrp = 0;
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (!this.m_previousMeasure) return FunctorCode.FUNCTOR_CONTINUE;

    if (this.m_previousHarmPositioner) {
      const positionerObject = this.m_previousHarmPositioner.GetObject();
      if (!positionerObject) throw new Error('AdjustHarmGrpsSpacingFunctor: positioner object invariant violated');
      if (this.m_previousMeasure === positionerObject.GetFirstAncestor(ClassId.MEASURE)) {
        const rightBarlineAlignment = this.m_previousMeasure.GetRightBarLine().GetAlignment();
        const overlap = this.m_previousHarmPositioner.GetContentRight()
          - (this.m_previousMeasure.GetRightBarLine().GetAlignment().GetXRel());
        if (overlap > 0 && this.m_previousHarmStart) {
          this.m_overlappingHarm.push([
            this.m_previousHarmStart.GetAlignment(),
            rightBarlineAlignment,
            overlap,
          ]);
        }
      }
    }

    this.m_previousMeasure.m_measureAligner.AdjustProportionally(this.m_overlappingHarm);
    this.m_overlappingHarm.length = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public GetGroupIds(): readonly number[] { return this.m_grpIds; }
  public GetCurrentGroup(): number { return this.m_currentGrp; }
  public GetPendingAdjustments(): readonly AdjustmentTuple[] { return this.m_overlappingHarm; }
}
