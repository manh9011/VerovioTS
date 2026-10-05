/**
 * Pure TypeScript translation of Verovio's src/calcchordnoteheadsfunctor.cpp
 * / include/vrv/calcchordnoteheadsfunctor.h.
 *
 * Sets flipped notehead positions for chord tones and adjusts tablature
 * rhythm-sign placement. Unmigrated tree/layout classes (Chord, Note, Staff,
 * TabGrp, TabDurSym, ...) are represented by structural contracts; no layout
 * algorithm is invented.
 */
import { DocFunctor } from './functor.js';
import { STEMDIRECTION_down, STEMDIRECTION_up } from './drawinginterface.js';
import { SMUFL_E0A4_noteheadBlack } from './smufl.js';
import { ClassId, FunctorCode } from './vrvdef.js';

// Canonical MEASUREMENTTYPE ordinals from src-cpp/libmei/dist/atttypes.h
// (MEASUREMENTTYPE_NONE=0, MEASUREMENTTYPE_px=0? verified below at use site).
const MEASUREMENTTYPE_vu = 1;
// StaffSearch::RESOLVE_CROSS_STAFF from src-cpp/include/vrv/layerelement.h.
const RESOLVE_CROSS_STAFF = 1;

export interface CalcChordStaffLike {
  m_drawingStaffSize: number;
  m_drawingLines: number;
  IsTabStaffLike(): boolean;
  IsTabGuitar(): boolean;
  IsTabLuteFrench(): boolean;
  IsTabLuteGerman(): boolean;
  IsTabLuteItalian(): boolean;
  GetDrawingStaffNotationSize(): number;
}

/** C++ `ChordNoteGroup` is `std::vector<Note *>`; modeled as an array (see `ChordNoteGroupLike`). */
export type CalcChordNoteGroupLike = unknown[];

export interface CalcChordChordLike {
  GetDrawingStemDir(): number;
  IsInBeam(): boolean;
  GetDrawingRadius(doc: unknown): number;
  GetBottomNote(): CalcChordNoteLike | null;
  GetActualDur(): number;
  GetDrawingCueSize(): boolean;
  GetAlignment(): { GetType(): number } | null;
  GetAncestorStaff(strategy: number): CalcChordStaffLike | null;
}

export interface CalcChordNoteLike {
  GetAncestorStaff(strategy: number): CalcChordStaffLike | null;
  IsChordTone(): boolean;
  GetDrawingRadius(doc: unknown): number;
  GetDrawingStemDir(): number;
  GetNoteGroup(): CalcChordNoteGroupLike | null;
  GetNoteGroupPosition(): number;
  GetAlignment(): { GetType(): number } | null;
  GetNoteheadGlyph(actualDur: number): number;
  GetDrawingCueSize(): boolean;
  GetDrawingXRel(): number;
  GetDrawingYRel(): number;
  SetDrawingXRel(value: number): void;
  SetFlippedNotehead(value: boolean): void;
  HasLedgerLines(linesAbove: { value: number }, linesBelow: { value: number }, staff: unknown): boolean;
}

export interface CalcChordTabDurSymLike {
  GetAncestorStaff(strategy: number): CalcChordStaffLike | null;
  GetFirstAncestor(classId: ClassId): CalcChordTabGrpLike | null;
  HasTabLine(): boolean;
  GetTabLine(): number;
  HasVo(): boolean;
  GetVo(): { GetType(): number; GetVu(): number };
  SetDrawingYRel(value: number): void;
}

export interface CalcChordTabGrpLike {
  GetAncestorStaff(strategy: number): CalcChordStaffLike | null;
  HasEmptyList(): boolean;
  GetTopNote(): CalcChordNoteLike | null;
  SetDrawingXRel(value: number): void;
}

export interface CalcChordDocLike {
  GetGlyphWidth(code: number, staffSize: number, cueSize: boolean): number;
  GetDrawingUnit(staffSize: number): number;
  GetDrawingStemWidth(staffSize: number): number;
}

function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`CalcChordNoteHeadsFunctor: ${message}`);
}

export class CalcChordNoteHeadsFunctor extends DocFunctor {
  private m_diameter = 0;
  private m_alignmentType = 0;

  public constructor(doc: unknown) {
    super(doc);
    this.m_diameter = 0;
    this.m_alignmentType = 0;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitChord(chord: CalcChordChordLike): FunctorCode {
    const staff = chord.GetAncestorStaff(RESOLVE_CROSS_STAFF);

    this.m_diameter = 0;
    if (chord.GetDrawingStemDir() === STEMDIRECTION_up) {
      if (chord.IsInBeam()) {
        this.m_diameter = 2 * chord.GetDrawingRadius(this.m_doc);
      }
      else {
        const bottomNote = chord.GetBottomNote();
        assertInvariant(bottomNote, 'expected bottom note');
        const code = bottomNote.GetNoteheadGlyph(chord.GetActualDur());
        assertInvariant(staff, 'expected staff');
        const doc = this.m_doc as unknown as CalcChordDocLike;
        this.m_diameter = doc.GetGlyphWidth(
          code, staff.m_drawingStaffSize, chord.GetDrawingCueSize() ? bottomNote.GetDrawingCueSize() : false);
      }
      const alignment = chord.GetAlignment();
      assertInvariant(alignment, 'expected chord alignment');
      this.m_alignmentType = alignment.GetType();
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNote(note: CalcChordNoteLike): FunctorCode {
    const doc = this.m_doc as unknown as CalcChordDocLike;
    const staff = note.GetAncestorStaff(RESOLVE_CROSS_STAFF);
    assertInvariant(staff, 'expected staff');
    const staffSize = staff.m_drawingStaffSize;

    // Note in tab staff-like needs to be adjusted back from the parent TabGrp
    if (staff.IsTabStaffLike()) {
      const staffNotationSize = staff.GetDrawingStaffNotationSize();
      // C++ int division at the / 2 boundary; Math.trunc preserves it.
      const width = Math.trunc(doc.GetGlyphWidth(SMUFL_E0A4_noteheadBlack, staffNotationSize, false) / 2);
      note.SetDrawingXRel(-width);
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    // Nothing to calculate if note is not part of the chord
    if (!note.IsChordTone()) return FunctorCode.FUNCTOR_SIBLINGS;

    const diameter = 2 * note.GetDrawingRadius(this.m_doc);
    let noteheadShift = 0;
    if (note.GetDrawingStemDir() === STEMDIRECTION_up && this.m_diameter) {
      noteheadShift = this.m_diameter - diameter;
    }

    // Nothing to do for notes that are not in a note group and without base diameter for the chord
    const noteGroup = note.GetNoteGroup();
    const noteAlignment = note.GetAlignment();
    assertInvariant(noteAlignment, 'expected note alignment');
    if ((!this.m_diameter || this.m_alignmentType !== noteAlignment.GetType()) && !noteGroup) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    /************** notehead direction **************/

    let flippedNotehead = false;

    // if the note is in a note group, calculations are different
    if (noteGroup) {
      const noteGroupPosition = note.GetNoteGroupPosition();
      if (note.GetDrawingStemDir() === STEMDIRECTION_down) {
        // stem down/even note group = noteheads start on left (incorrect side)
        if (noteGroup.length % 2 === 0) {
          flippedNotehead = noteGroupPosition % 2 !== 0;
        }
        // else they start on normal side
        else {
          flippedNotehead = noteGroupPosition % 2 === 0;
        }
      }
      else {
        // flipped noteheads start on normal side no matter what
        flippedNotehead = noteGroupPosition % 2 === 0;
      }
    }

    // positions notehead
    if (flippedNotehead) {
      if (note.GetDrawingStemDir() === STEMDIRECTION_up) {
        note.SetDrawingXRel(diameter - doc.GetDrawingStemWidth(staffSize));
      }
      else {
        note.SetDrawingXRel(-diameter + doc.GetDrawingStemWidth(staffSize));
      }
    }
    note.SetDrawingXRel(note.GetDrawingXRel() + noteheadShift);

    note.SetFlippedNotehead(flippedNotehead);

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitTabDurSym(tabDurSym: CalcChordTabDurSymLike): FunctorCode {
    const doc = this.m_doc as unknown as CalcChordDocLike;
    const staff = tabDurSym.GetAncestorStaff(RESOLVE_CROSS_STAFF);
    assertInvariant(staff, 'expected staff');
    const tabGrp = tabDurSym.GetFirstAncestor(ClassId.TABGRP);
    assertInvariant(tabGrp, 'expected tabGrp ancestor');

    // adjust vertical position for tabDurSym@tab.line, tabDurSym@vo and tablature type
    // tabDurSym@tab.line takes priority over tabDurSym@vo
    if (!staff.IsTabGuitar()) {
      if (tabDurSym.HasTabLine()) {
        const yAdjust = (tabDurSym.GetTabLine() - staff.m_drawingLines) * 2;
        tabDurSym.SetDrawingYRel(yAdjust * doc.GetDrawingUnit(staff.m_drawingStaffSize));
      }
      else {
        let yAdjust = 1; // margin between staff line and rhythm sign, in half lines

        // position rhythm sign according to tablature type
        if (staff.IsTabLuteFrench() || staff.IsTabLuteGerman()) {
          yAdjust = 2;
        }
        else if (staff.IsTabLuteItalian() && staff.m_drawingLines >= 6) {
          yAdjust = 3; // allow for >= 7 course Italian tablature
        }
        else if (staff.IsTabStaffLike()) {
          yAdjust = 4; // clear A5 on treble clef

          // raise rhythm sign above ledger lines for B5 and above on treble clef
          if (!tabGrp.HasEmptyList()) {
            const topNote = tabGrp.GetTopNote();
            assertInvariant(topNote, 'expected top note');
            const linesAbove = { value: 0 };
            const linesBelow = { value: 0 };
            if (topNote.HasLedgerLines(linesAbove, linesBelow, staff) && linesAbove.value > 0) {
              yAdjust += Math.trunc(topNote.GetDrawingYRel() / doc.GetDrawingUnit(staff.m_drawingStaffSize)) - 2;
            }
          }
        }

        // adjust for tabDurSym@vo
        if (tabDurSym.HasVo() && tabDurSym.GetVo().GetType() === MEASUREMENTTYPE_vu) {
          yAdjust += Math.round(tabDurSym.GetVo().GetVu());
        }

        tabDurSym.SetDrawingYRel(yAdjust * doc.GetDrawingUnit(staff.m_drawingStaffSize));
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTabGrp(tabGrp: CalcChordTabGrpLike): FunctorCode {
    const doc = this.m_doc as unknown as CalcChordDocLike;
    const staff = tabGrp.GetAncestorStaff(RESOLVE_CROSS_STAFF);
    assertInvariant(staff, 'expected staff');
    const staffSize = staff.GetDrawingStaffNotationSize();
    const width = Math.trunc(doc.GetGlyphWidth(SMUFL_E0A4_noteheadBlack, staffSize, false) / 2);

    tabGrp.SetDrawingXRel(width);

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
