/**
 * Pure TypeScript translation of Verovio's src/calcslurdirectionfunctor.cpp
 * / include/vrv/calcslurdirectionfunctor.h.
 *
 * Determines the drawing curve direction for slurs. Unmigrated tree/layout
 * classes (Slur, Note, Chord, Layer, Staff, System, ...) are represented by
 * structural contracts; no layout algorithm is invented.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode } from './vrvdef.js';

// Canonical ordinals: curvature_CURVEDIR from src-cpp/libmei/dist/atttypes.h,
// STEMDIRECTION from src/drawinginterface.ts (canonical for this migration).
const CURVEDIR_NONE = 0;
const CURVEDIR_above = 1;
const CURVEDIR_below = 2;
const CURVEDIR_mixed = 3;
const STEMDIRECTION_NONE = 0;
const STEMDIRECTION_up = 1;
const STEMDIRECTION_down = 2;
const RESOLVE_CROSS_STAFF = 1;

export enum CalcSlurDir {
  Above = 1,
  Below = 2,
  AboveBelow = 3,
  BelowAbove = 4,
}

export interface CalcSlurStemmedInterfaceLike {
  GetDrawingStemDir(): number;
}

export interface CalcSlurEndpointLike {
  Is(classId: number): boolean;
  IsGraceNote(): boolean;
  GetAncestorStaff(strategy: number): { GetN(): number } | null;
  GetStemmedDrawingInterface(): CalcSlurStemmedInterfaceLike | null;
  GetDrawingY(): number;
  IsGraceNoteFn?(): never;
}

export interface CalcSlurDocLike {
  GetDrawingStaffSize(staffSize: number): number;
}

export interface CalcSlurLayerLike {
  GetDrawingStemDir(element: unknown): number;
}

export interface CalcSlurStartLike extends CalcSlurEndpointLike {
  IsChordTone(): { PositionInChord(note: unknown): number } | null;
}

export interface CalcSlurLike {
  HasCurvedir(): boolean;
  GetCurvedir(): number;
  HasBulge(): boolean;
  HasDrawingCurveDir(): boolean;
  SetDrawingCurveDir(dir: CalcSlurDir): void;
  GetStart(): CalcSlurEndpointLike | null;
  GetEnd(): CalcSlurEndpointLike | null;
  GetStartMeasure(): unknown;
  GetTstampStaves(measure: unknown, slur: unknown): CalcSlurStaffLike[];
  GetBoundaryCrossStaff(): unknown;
  GetBoundaryLayer(): [CalcSlurLayerLike | null, unknown];
}

export interface CalcSlurStaffLike {
  GetDrawingY(): number;
  m_drawingStaffSize: number;
  GetFirstAncestor(classId: number): unknown;
}

export interface CalcSlurSystemLike {
  HasMixedDrawingStemDir(start: unknown, end: unknown): boolean;
  GetPreferredCurveDirection(start: unknown, end: unknown, slur: unknown): number;
}

function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`CalcSlurDirectionFunctor: ${message}`);
}

export class CalcSlurDirectionFunctor extends DocFunctor {
  public constructor(doc: unknown) {
    super(doc);
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitLayerElement(_layerElement: unknown): FunctorCode {
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSlur(slur: CalcSlurLike): FunctorCode {
    // If curve direction is prescribed as above or below, use it
    if (slur.HasCurvedir() && slur.GetCurvedir() !== CURVEDIR_mixed) {
      slur.SetDrawingCurveDir(
        slur.GetCurvedir() === CURVEDIR_above ? CalcSlurDir.Above : CalcSlurDir.Below);
    }
    if (slur.HasDrawingCurveDir()) return FunctorCode.FUNCTOR_CONTINUE;

    // Retrieve boundary
    const start = slur.GetStart();
    const end = slur.GetEnd();
    if (!start || !end) {
      slur.SetDrawingCurveDir(CalcSlurDir.Above);
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    // If curve direction is prescribed as mixed, use it if boundary lies in different staves
    if (slur.GetCurvedir() === CURVEDIR_mixed) {
      if (slur.HasBulge()) {
        this.logWarning('Mixed curve direction is ignored for slurs with prescribed bulge.');
      }
      else if (this.isTimestamp(start) || this.isTimestamp(end)) {
        this.logWarning('Mixed curve direction is ignored for slurs with tstamp boundary.');
      }
      else {
        const startStaff = start.GetAncestorStaff(RESOLVE_CROSS_STAFF);
        const endStaff = end.GetAncestorStaff(RESOLVE_CROSS_STAFF);
        assertInvariant(startStaff && endStaff, 'expected boundary staves');
        const startStaffN = startStaff.GetN();
        const endStaffN = endStaff.GetN();
        if (startStaffN < endStaffN) {
          slur.SetDrawingCurveDir(CalcSlurDir.BelowAbove);
          return FunctorCode.FUNCTOR_CONTINUE;
        }
        else if (startStaffN > endStaffN) {
          slur.SetDrawingCurveDir(CalcSlurDir.AboveBelow);
          return FunctorCode.FUNCTOR_CONTINUE;
        }
        else {
          this.logWarning('Mixed curve direction is ignored for slurs starting and ending on the same staff.');
        }
      }
    }

    // Retrieve staves and system
    const staffList = slur.GetTstampStaves(slur.GetStartMeasure(), slur);
    if (staffList.length === 0) {
      slur.SetDrawingCurveDir(CalcSlurDir.Above);
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    const staff = staffList[0];
    // C++ calcslurdirectionfunctor.cpp:83 passes SYSTEM; 0 never matches.
    const system = staff.GetFirstAncestor(ClassId.SYSTEM) as CalcSlurSystemLike | null;
    assertInvariant(system, 'expected system');

    const isCrossStaff = slur.GetBoundaryCrossStaff() !== null;
    const isGraceToNoteSlur = !this.isTimestamp(start) && !this.isTimestamp(end)
      && start.IsGraceNote() && !end.IsGraceNote();

    if (!this.isTimestamp(start) && !this.isTimestamp(end) && !isGraceToNoteSlur
      && system.HasMixedDrawingStemDir(start, end)) {
      // Handle mixed stem direction
      if (isCrossStaff && system.GetPreferredCurveDirection(start, end, slur) === CURVEDIR_below) {
        slur.SetDrawingCurveDir(CalcSlurDir.Below);
      }
      else {
        slur.SetDrawingCurveDir(CalcSlurDir.Above);
      }
    }
    else {
      // Handle uniform stem direction, time stamp boundaries and grace note slurs
      const startStemDrawInterface = start.GetStemmedDrawingInterface();
      let startStemDir = STEMDIRECTION_NONE;
      if (startStemDrawInterface) {
        startStemDir = startStemDrawInterface.GetDrawingStemDir();
      }

      const doc = this.m_doc as unknown as CalcSlurDocLike;
      // C++ int division at the / 2 boundary; Math.trunc preserves it.
      const center = staff.GetDrawingY() - Math.trunc(doc.GetDrawingStaffSize(staff.m_drawingStaffSize) / 2);
      const isAboveStaffCenter = start.GetDrawingY() > center;
      if (this.GetPreferredCurveDirection(slur, startStemDir, isAboveStaffCenter, isGraceToNoteSlur)
        === CURVEDIR_below) {
        slur.SetDrawingCurveDir(CalcSlurDir.Below);
      }
      else {
        slur.SetDrawingCurveDir(CalcSlurDir.Above);
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  private isTimestamp(element: CalcSlurEndpointLike): boolean {
    return element.Is(ClassId.TIMESTAMP_ATTR);
  }

  private logWarning(_message: string): void {
    // C++ LogWarning has no observable effect on the functor state machine;
    // the boundary is kept explicit so future wiring can forward diagnostics.
  }

  public GetGraceCurveDirection(slur: CalcSlurLike): number {
    // Start on the notehead side
    const start = slur.GetStart();
    assertInvariant(start, 'expected slur start');
    const startStemDrawInterface = start.GetStemmedDrawingInterface();
    const isStemDown = !!startStemDrawInterface
      && startStemDrawInterface.GetDrawingStemDir() === STEMDIRECTION_down;
    return isStemDown ? CURVEDIR_above : CURVEDIR_below;
  }

  public GetPreferredCurveDirection(
    slur: CalcSlurLike, noteStemDir: number, isAboveStaffCenter: boolean, isGraceToNoteSlur: boolean,
  ): number {
    const rawStart = slur.GetStart() as CalcSlurStartLike | null;
    let startNote: unknown = null;
    let startParentChord: { PositionInChord(note: unknown): number } | null = null;
    if (rawStart && rawStart.Is(ClassId.NOTE)) {
      startNote = rawStart;
      assertInvariant(startNote, 'expected start note');
      startParentChord = rawStart.IsChordTone();
    }

    const [layer, layerElement] = slur.GetBoundaryLayer();
    let layerStemDir = STEMDIRECTION_NONE;

    let drawingCurveDir = CURVEDIR_above;
    // first should be the slur @curvedir
    if (slur.HasCurvedir()) {
      drawingCurveDir = slur.GetCurvedir() === CURVEDIR_above ? CURVEDIR_above : CURVEDIR_below;
    }
    // grace note slurs in case we have no drawing stem direction on the layer
    else if (isGraceToNoteSlur && layer && layerElement
      && layer.GetDrawingStemDir(layerElement) === STEMDIRECTION_NONE) {
      drawingCurveDir = this.GetGraceCurveDirection(slur);
    }
    // otherwise layer direction trumps note direction
    else if (layer && layerElement
      && (layerStemDir = layer.GetDrawingStemDir(layerElement)) !== STEMDIRECTION_NONE) {
      drawingCurveDir = layerStemDir === STEMDIRECTION_up ? CURVEDIR_above : CURVEDIR_below;
    }
    // look if in a chord
    else if (startParentChord) {
      if (startParentChord.PositionInChord(startNote) < 0) {
        drawingCurveDir = CURVEDIR_below;
      }
      else if (startParentChord.PositionInChord(startNote) > 0) {
        drawingCurveDir = CURVEDIR_above;
      }
      // away from the stem if odd number (center note)
      else {
        drawingCurveDir = noteStemDir !== STEMDIRECTION_up ? CURVEDIR_above : CURVEDIR_below;
      }
    }
    else if (noteStemDir === STEMDIRECTION_up) {
      drawingCurveDir = CURVEDIR_below;
    }
    else if (noteStemDir === STEMDIRECTION_NONE) {
      // no information from the note stem directions, look at the position in the notes
      drawingCurveDir = isAboveStaffCenter ? CURVEDIR_above : CURVEDIR_below;
    }

    return drawingCurveDir;
  }
}
