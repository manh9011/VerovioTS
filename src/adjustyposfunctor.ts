/**
 * Pure TypeScript translation of Verovio's src/adjustyposfunctor.cpp.
 *
 * The implementation preserves the canonical C++ traversal order, state
 * mutation and return codes. Classes not yet migrated are represented by
 * structural contracts only.
 */
import { DocFunctor } from './functor.js';
import { FunctorCode, ClassId } from './vrvdef.js';
import { CalcAlignmentPitchPosFunctor } from './calcalignmentpitchposfunctor.js';
import { CalcStemFunctor } from './calcstemfunctor.js';

export interface AdjustYPosDocLike {}

export interface AdjustYPosDivLike {
  AdjustRunningElementYPos(): void;
}

export interface AdjustYPosStaffAlignmentLike {
  GetMinimumSpacing(doc: AdjustYPosDocLike): number;
  CalcMinimumRequiredSpacing(doc: AdjustYPosDocLike): number;
  GetRequestedSpacing(): number;
  SetYRel(value: number): void;
  GetYRel(): number;
}

export interface AdjustYPosSystemAlignerLike {
  Process(functor: unknown): void;
}

export interface AdjustYPosSystemLike {
  ResetCachedDrawingY(): void;
  m_systemAligner: AdjustYPosSystemAlignerLike;
  GetDrawingList(): Array<AdjustYPosDrawingObjectLike>;
}

export interface AdjustYPosChordLike {
  HasCrossStaff(): boolean;
  Process(functor: unknown): void;
}

export interface AdjustYPosBeamSpanSegmentLike {
  GetLayer(): unknown;
  GetStaff(): unknown;
  CalcBeam(layer: unknown, staff: unknown, doc: AdjustYPosDocLike, beamSpan: AdjustYPosBeamSpanLike, drawingPlace: number): void;
}

export interface AdjustYPosBeamSpanLike {
  GetSegmentForSystem(system: AdjustYPosSystemLike): AdjustYPosBeamSpanSegmentLike | null;
  m_drawingPlace: number;
}

export interface AdjustYPosDrawingObjectLike {
  Is(classId: ClassId): boolean;
  AsBeamSpan?(): AdjustYPosBeamSpanLike | null;
}

/** Canonical pitch-position functor (pass 255); kept as a type boundary for collaborators. */
export type CalcAlignmentPitchPosFunctorLike = CalcAlignmentPitchPosFunctor;
/** Structural constructor contract for the unmigrated stem functor. */
export interface CalcStemFunctorLike {}

/** Factory hooks kept injectable so the migration does not invent native classes. */
export type AdjustYPosPitchFunctorFactory = (doc: AdjustYPosDocLike) => unknown;
export type AdjustYPosStemFunctorFactory = (doc: AdjustYPosDocLike) => unknown;

export class AdjustYPosFunctor extends DocFunctor {
  private m_cumulatedShift = 0;

  public constructor(doc: AdjustYPosDocLike) {
    super(doc);
    this.m_cumulatedShift = 0;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitDiv(div: AdjustYPosDivLike): FunctorCode {
    div.AdjustRunningElementYPos();
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitStaffAlignment(staffAlignment: AdjustYPosStaffAlignmentLike): FunctorCode {
    const defaultSpacing = staffAlignment.GetMinimumSpacing(this.m_doc);
    const minSpacing = Math.max(staffAlignment.GetRequestedSpacing(), staffAlignment.CalcMinimumRequiredSpacing(this.m_doc));
    if (minSpacing > defaultSpacing) {
      this.m_cumulatedShift += minSpacing - defaultSpacing;
    }
    staffAlignment.SetYRel(staffAlignment.GetYRel() - this.m_cumulatedShift);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: AdjustYPosSystemLike): FunctorCode {
    system.ResetCachedDrawingY();
    this.m_cumulatedShift = 0;
    system.m_systemAligner.Process(this);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

export class AdjustCrossStaffYPosFunctor extends DocFunctor {
  private m_cumulatedShift = 0;
  public constructor(
    doc: AdjustYPosDocLike,
    private readonly pitchFunctorFactory: AdjustYPosPitchFunctorFactory = (doc) => new CalcAlignmentPitchPosFunctor(doc),
    private readonly stemFunctorFactory: AdjustYPosStemFunctorFactory = (doc) => new CalcStemFunctor(doc as never),
  ) {
    super(doc);
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitChord(chord: AdjustYPosChordLike): FunctorCode {
    if (!chord.HasCrossStaff()) return FunctorCode.FUNCTOR_SIBLINGS;

    chord.Process(this.pitchFunctorFactory(this.m_doc));
    chord.Process(this.stemFunctorFactory(this.m_doc));
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystem(system: AdjustYPosSystemLike): FunctorCode {
    const drawingList = system.GetDrawingList();
    for (const item of drawingList) {
      if (item.Is(ClassId.BEAMSPAN)) {
        const beamSpan = item as unknown as AdjustYPosBeamSpanLike;
        const segment = beamSpan.GetSegmentForSystem(system);
        if (segment) {
          segment.CalcBeam(segment.GetLayer(), segment.GetStaff(), this.m_doc, beamSpan, beamSpan.m_drawingPlace);
        }
      }
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
