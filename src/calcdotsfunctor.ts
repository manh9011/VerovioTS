/**
 * Pure TypeScript translation of Verovio's src/calcdotsfunctor.cpp
 * / include/vrv/calcdotsfunctor.h.
 *
 * Sets drawing dot positions for notes, chords and rests. Unmigrated
 * tree/layout classes (Chord, Note, Rest, Staff, Dots, Flag, ...) are
 * represented by structural contracts; no layout algorithm is invented.
 */
import { DocFunctor } from './functor.js';
import { STEMDIRECTION_NONE, STEMDIRECTION_up } from './drawinginterface.js';
import { SMUFL_E240_flag8thUp, SMUFL_E242_flag16thUp } from './smufl.js';
import {
  ClassId,
  DURATION_2,
  DURATION_4,
  DURATION_16,
  DURATION_32,
  DURATION_64,
  DURATION_128,
  DURATION_256,
  DURATION_512,
  DURATION_1024,
  DURATION_breve,
  FunctorCode,
} from './vrvdef.js';

// StaffSearch::RESOLVE_CROSS_STAFF from src-cpp/include/vrv/layerelement.h.
const RESOLVE_CROSS_STAFF = 1;

export interface CalcDotsStaffLike {
  m_drawingStaffSize: number;
}

export interface CalcDotsDotsLike {
  GetDrawingXRel(): number;
  SetDrawingXRel(value: number): void;
  SetMapOfDotLocs(locs: Map<unknown, Set<number>>): void;
  GetFlagShift(): number;
  SetFlagShift(value: number): void;
  ModifyDotLocsForStaff(staff: unknown): Set<number>;
}

export interface CalcDotsFlagLike {
  m_drawingNbFlags: number;
  GetDrawingY(): number;
  GetFlagGlyph(stemDir: number): number;
}

export interface CalcDotsChordLike {
  IsVisible(): boolean;
  GetDots(): number;
  HasNoteWithDots(): boolean;
  FindDescendantByType(classId: ClassId, depth: number): CalcDotsDotsLike | null;
  GetDrawingX(): number;
  GetDrawingStemDir(): number;
  CalcOptimalDotLocations(): Map<unknown, Set<number>>;
  GetTopNote(): unknown;
}

export interface CalcDotsNoteLike {
  IsVisible(): boolean;
  GetDots(): number;
  GetDrawingRadius(doc: unknown): number;
  GetDrawingX(): number;
  GetDrawingY(): number;
  GetDrawingLoc(): number;
  GetDrawingDur(): number;
  GetDrawingStemDir(): number;
  GetDrawingStemLen(): number;
  GetDrawingCueSize(): boolean;
  GetDur(): number;
  GetFlippedNotehead(): boolean;
  IsChordTone(): CalcDotsChordLike | null;
  IsInBeam(): boolean;
  FindDescendantByType(classId: ClassId, depth: number): CalcDotsDotsLike | null;
  CalcOptimalDotLocations(): Map<unknown, Set<number>>;
  GetAncestorStaff(strategy: number): CalcDotsStaffLike | null;
  GetFirst(classId: ClassId): { GetFirst(classId: ClassId): CalcDotsFlagLike | null } | null;
}

export interface CalcDotsRestLike {
  IsMensuralDur(): boolean;
  GetDur(): number;
  GetDots(): number;
  GetActualDur(): number;
  GetDrawingLoc(): number;
  GetDrawingCueSize(): boolean;
  GetRestGlyph(): number;
  FindDescendantByType(classId: ClassId, depth: number): CalcDotsDotsLike | null;
  GetAncestorStaff(strategy: number): (CalcDotsStaffLike & { m_drawingStaffSize: number }) | null;
}

export interface CalcDotsDocLike {
  GetOptions(): { m_showHidden: { GetValue(): boolean } };
  GetGlyphWidth(code: number, staffSize: number, cueSize: boolean): number;
  GetGlyphHeight(code: number, staffSize: number, cueSize: boolean): number;
  GetDrawingUnit(staffSize: number): number;
  GetCueSize(value: number): number;
}

function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`CalcDotsFunctor: ${message}`);
}

export class CalcDotsFunctor extends DocFunctor {
  private m_chordDots: CalcDotsDotsLike | null = null;
  private m_chordDrawingX = 0;
  private m_chordStemDir = STEMDIRECTION_NONE;

  public constructor(doc: unknown) {
    super(doc);
    this.m_chordDots = null;
    this.m_chordDrawingX = 0;
    this.m_chordStemDir = STEMDIRECTION_NONE;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitChord(chord: CalcDotsChordLike): FunctorCode {
    const doc = this.m_doc as unknown as CalcDotsDocLike;
    const showHidden = doc.GetOptions().m_showHidden.GetValue();

    // if the chord isn't visible, stop here
    if (!showHidden && !chord.IsVisible()) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    // if there aren't dot, stop here but only if no note has a dot
    if (chord.GetDots() < 1) {
      if (!chord.HasNoteWithDots()) {
        return FunctorCode.FUNCTOR_SIBLINGS;
      }
      else {
        return FunctorCode.FUNCTOR_CONTINUE;
      }
    }

    const dots = chord.FindDescendantByType(ClassId.DOTS, 1);
    assertInvariant(dots, 'expected dots');

    this.m_chordDots = dots;
    this.m_chordDrawingX = chord.GetDrawingX();
    this.m_chordStemDir = chord.GetDrawingStemDir();

    dots.SetMapOfDotLocs(chord.CalcOptimalDotLocations());

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNote(note: CalcDotsNoteLike): FunctorCode {
    const doc = this.m_doc as unknown as CalcDotsDocLike;
    const showHidden = doc.GetOptions().m_showHidden.GetValue();

    if (!showHidden && !note.IsVisible()) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    const staff = note.GetAncestorStaff(RESOLVE_CROSS_STAFF);
    assertInvariant(staff, 'expected staff');
    const staffSize = staff.m_drawingStaffSize;
    const drawingCueSize = note.GetDrawingCueSize();

    let dots: CalcDotsDotsLike | null = null;
    const chord = note.IsChordTone();

    // The shift to the left when a stem flag requires it
    let flagShift = 0;
    const radius = note.GetDrawingRadius(this.m_doc);

    if (chord && chord.GetDots() > 0) {
      dots = this.m_chordDots;
      assertInvariant(dots, 'expected dots');

      // Stem up, shorter than 4th and not in beam
      if (note.GetDots() > 0 && this.m_chordStemDir === STEMDIRECTION_up && note.GetDrawingDur() > DURATION_4
        && !note.IsInBeam()) {
        // Shift according to the flag width if the top note is not flipped
        if (note === (chord.GetTopNote() as unknown) && !note.GetFlippedNotehead()) {
          // HARDCODED — C++ narrows the double product to int in +=; Math.trunc preserves it.
          flagShift += Math.trunc(doc.GetGlyphWidth(SMUFL_E240_flag8thUp, staffSize, drawingCueSize) * 0.8);
        }
      }

      const xRel = note.GetDrawingX() - this.m_chordDrawingX + 2 * radius + flagShift;
      dots.SetDrawingXRel(Math.max(dots.GetDrawingXRel(), xRel));
    }
    if (note.GetDots() > 0) {
      // For single notes we need here to set the dot loc
      dots = note.FindDescendantByType(ClassId.DOTS, 1);
      assertInvariant(dots, 'expected dots');

      const dotLocs = note.CalcOptimalDotLocations();
      dots.SetMapOfDotLocs(dotLocs);

      const firstEntry = dotLocs.entries().next();
      assertInvariant(!firstEntry.done, 'expected dot locations');
      const locSet = [...firstEntry.value[1]];
      const dotLocShift = locSet[locSet.length - 1] - note.GetDrawingLoc();

      // Stem up, shorter than 4th and not in beam
      const shift = dots.GetFlagShift();
      if (shift) {
        flagShift += shift;
      }
      else if (note.GetDrawingStemDir() === STEMDIRECTION_up && !note.IsInBeam() && note.GetDrawingStemLen() < 3
        && this.IsDotOverlappingWithFlag(note, staffSize, dotLocShift)) {
        // HARDCODED
        const shiftAmount = Math.trunc(doc.GetGlyphWidth(SMUFL_E240_flag8thUp, staffSize, drawingCueSize) * 0.8);
        flagShift += shiftAmount;
        dots.SetFlagShift(shiftAmount);
      }

      const xRel = 2 * radius + flagShift;
      dots.SetDrawingXRel(Math.max(dots.GetDrawingXRel(), xRel));
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitRest(rest: CalcDotsRestLike): FunctorCode {
    const doc = this.m_doc as unknown as CalcDotsDocLike;
    // We currently have no dots object with mensural rests
    if (rest.IsMensuralDur()) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    // Nothing to do
    if (rest.GetDur() <= DURATION_breve || rest.GetDots() < 1) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    const staff = rest.GetAncestorStaff(RESOLVE_CROSS_STAFF);
    assertInvariant(staff, 'expected staff');
    const drawingCueSize = rest.GetDrawingCueSize();
    const staffSize = staff.m_drawingStaffSize;

    // For single rests we need here to set the dot loc
    const dots = rest.FindDescendantByType(ClassId.DOTS, 1);
    assertInvariant(dots, 'expected dots');

    const dotLocs = dots.ModifyDotLocsForStaff(staff);
    let loc = rest.GetDrawingLoc();

    // if it's on a staff line to start with, we need to compensate here and add a full unit like DrawDots would
    if (loc % 2 === 0) {
      loc += 1;
    }

    switch (rest.GetActualDur()) {
      case DURATION_32:
      case DURATION_64: loc += 2; break;
      case DURATION_128:
      case DURATION_256: loc += 4; break;
      case DURATION_512: loc += 6; break;
      case DURATION_1024: loc += 8; break;
      default: break;
    }

    dotLocs.add(loc);

    // HARDCODED — C++ narrows the double product to int at assignment; Math.trunc preserves it.
    let xRel = Math.trunc(doc.GetDrawingUnit(staffSize) * 2.5);
    if (drawingCueSize) xRel = doc.GetCueSize(xRel);
    if (rest.GetDur() > DURATION_2) {
      xRel = doc.GetGlyphWidth(rest.GetRestGlyph(), staff.m_drawingStaffSize, drawingCueSize);
    }
    dots.SetDrawingXRel(Math.max(dots.GetDrawingXRel(), xRel));

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  private IsDotOverlappingWithFlag(note: CalcDotsNoteLike, staffSize: number, dotLocShift: number): boolean {
    const doc = this.m_doc as unknown as CalcDotsDocLike;
    const stem = note.GetFirst(ClassId.STEM);
    if (!stem) return false;

    const flag = stem.GetFirst(ClassId.FLAG);
    if (!flag || flag.m_drawingNbFlags === 0) return false;

    // for the purposes of vertical spacing we care only up to 16th flags - shorter ones grow upwards
    let flagGlyph = SMUFL_E242_flag16thUp;
    const dur = note.GetDur();
    if (dur < DURATION_16) flagGlyph = flag.GetFlagGlyph(note.GetDrawingStemDir());
    const flagHeight = doc.GetGlyphHeight(flagGlyph, staffSize, note.GetDrawingCueSize());

    // C++ int division at the / 2 boundary; Math.trunc preserves it.
    const dotMargin = flag.GetDrawingY() - note.GetDrawingY() - flagHeight
      - Math.trunc(note.GetDrawingRadius(this.m_doc) / 2)
      - dotLocShift * doc.GetDrawingUnit(staffSize);

    return dotMargin < 0;
  }
}
