/**
 * Pure TypeScript translation of Verovio's src/calcalignmentxposfunctor.cpp
 * / include/vrv/calcalignmentxposfunctor.h.
 *
 * Calculates Alignment X positions from time intervals. Unmigrated
 * tree/layout classes (Alignment, Measure, MeasureAligner, System, ...) are
 * represented by structural `any` contracts; no layout algorithm is invented.
 */
import { DocFunctor } from './functor.js';
import {
  ALIGNMENT_CLEF,
  ALIGNMENT_GRACENOTE,
  ALIGNMENT_MEASURE_LEFT_BARLINE,
  ALIGNMENT_MEASURE_RIGHT_BARLINE,
} from './alignfunctor.js';
import { Fraction } from './fraction.js';
import { DEFINITION_FACTOR, DURATION_1, DURATION_NONE, FunctorCode, type data_DURATION } from './vrvdef.js';

/**
 * Direct port of Alignment::HorizontalSpaceForDuration
 * (src-cpp/src/horizontalaligner.cpp). The C++ return type is int, so the
 * floating-point result is truncated toward zero at the return boundary.
 */
export function HorizontalSpaceForDuration(
  intervalTime: Fraction,
  maxActualDur: data_DURATION,
  spacingLinear: number,
  spacingNonLinear: number,
): number {
  let intervalTimeDbl = intervalTime.ToDouble();
  /* If the longest duration interval in the score is longer than semibreve, adjust spacing so
     that interval gets the space a semibreve would ordinarily get. */
  if (maxActualDur < DURATION_1) intervalTimeDbl /= Math.pow(2.0, DURATION_1 - maxActualDur);
  // numbers are experimental constants
  return Math.trunc(Math.pow(intervalTimeDbl * 1024, spacingNonLinear) * spacingLinear * 10.0);
}

export class CalcAlignmentXPosFunctor extends DocFunctor {
  private m_previousTime: Fraction = new Fraction(0);
  private m_previousXRel = 0;
  private m_longestActualDur: data_DURATION = DURATION_NONE;
  private m_estimatedJustificationRatio = 1.0;
  private m_lastNonTimestamp: any | null = null;
  private readonly m_timestamps: any[] = [];
  private m_measureAligner: any | null = null;

  public constructor(doc: unknown) {
    super(doc);
    this.m_previousTime = new Fraction(0);
    this.m_previousXRel = 0;
    this.m_longestActualDur = DURATION_NONE;
    this.m_estimatedJustificationRatio = 1.0;
    this.m_lastNonTimestamp = null;
    this.m_measureAligner = null;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public GetLongestActualDur(): data_DURATION {
    return this.m_longestActualDur;
  }

  public SetLongestActualDur(dur: data_DURATION): void {
    this.m_longestActualDur = dur;
  }

  public VisitAlignment(alignment: any): FunctorCode {
    // Do not set an x pos for anything before the barline (including it).
    if (alignment.GetType() <= ALIGNMENT_MEASURE_LEFT_BARLINE) return FunctorCode.FUNCTOR_CONTINUE;

    let intervalXRel = 0;
    let intervalTime: Fraction = alignment.GetTime().subtract(this.m_previousTime);

    if (alignment.GetType() > ALIGNMENT_MEASURE_RIGHT_BARLINE) {
      intervalTime = new Fraction(0);
    }

    // Do not move aligners that are only time-stamps at this stage but add them to the pending list.
    if (alignment.HasTimestampOnly()) {
      this.m_timestamps.push(alignment);
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (intervalTime.compare(new Fraction(0)) > 0) {
      intervalXRel = HorizontalSpaceForDuration(intervalTime, this.m_longestActualDur,
        this.m_doc.GetOptions().m_spacingLinear.GetValue(),
        this.m_doc.GetOptions().m_spacingNonLinear.GetValue());
      // LogDebug("CalcAlignmentXPos: intervalTime=%.2f intervalXRel=%d", intervalTime, intervalXRel);
    }

    const graceAligners: Map<unknown, any> = alignment.GetGraceAligners();
    for (const [, graceAligner] of graceAligners) {
      graceAligner.SetGraceAlignmentXPos(this.m_doc);
    }

    // C++ SetXRel takes int; Math.trunc reproduces the narrowing conversion.
    alignment.SetXRel(Math.trunc(this.m_previousXRel + intervalXRel * DEFINITION_FACTOR * this.m_estimatedJustificationRatio));
    this.m_previousTime = alignment.GetTime();
    this.m_previousXRel = alignment.GetXRel();

    // This is an alignment which is not timestamp only. If we have a list of pending timestamp
    // alignments, then we now need to move them appropriately.
    if (this.m_timestamps.length > 0 && this.m_lastNonTimestamp) {
      const startXRel = this.m_lastNonTimestamp.GetXRel();
      let startTime: Fraction = this.m_lastNonTimestamp.GetTime();
      const endTime: Fraction = alignment.GetTime();
      // We have timestamp alignments between the left barline and the first beat. We need
      // to use the MeasureAligner::m_initialTstampDur to calculate the time (percentage) position.
      if (this.m_lastNonTimestamp.GetType() === ALIGNMENT_MEASURE_LEFT_BARLINE) {
        startTime = this.m_measureAligner.GetInitialTstampDur();
      }
      // The duration since the last alignment and the current one.
      const duration: Fraction = endTime.subtract(startTime);
      const space = alignment.GetXRel() - this.m_lastNonTimestamp.GetXRel();
      // For each timestamp alignment, move them proportionally to the space we currently have.
      for (const tsAlignment of this.m_timestamps) {
        // Avoid division by zero (nothing to move with the alignment anyway).
        if (duration.equals(new Fraction(0))) break;
        const percent = tsAlignment.GetTime().subtract(startTime).divide(duration).ToDouble();
        tsAlignment.SetXRel(Math.trunc(startXRel + space * percent));
      }
      this.m_timestamps.length = 0;
    }

    // Do not use clef change and gracenote alignment as reference since these are not aligned at this stage.
    if (!alignment.IsOfType([ALIGNMENT_CLEF, ALIGNMENT_GRACENOTE])) this.m_lastNonTimestamp = alignment;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: any): FunctorCode {
    // We start a new Measure.
    // Reset the previous time position and x_rel to 0.
    this.m_previousTime = new Fraction(0);
    // With un-measured music we never have a left barline, so do not add a default space.
    this.m_previousXRel = measure.IsMeasuredMusic() ? this.m_doc.GetDrawingUnit(100) : 0;

    measure.m_measureAligner.Process(this);

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasureAligner(measureAligner: any): FunctorCode {
    this.m_lastNonTimestamp = measureAligner.GetLeftBarLineAlignment();
    this.m_measureAligner = measureAligner;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: any): FunctorCode {
    const ratio = system.EstimateJustificationRatio(this.m_doc);
    if ((!system.IsLastOfMdiv() && !system.IsLastOfSelection()) || ratio < this.m_estimatedJustificationRatio) {
      this.m_estimatedJustificationRatio = ratio;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
