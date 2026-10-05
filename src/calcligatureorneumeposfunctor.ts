/**
 * Pure TypeScript translation of Verovio's src/calcligatureorneumeposfunctor.cpp
 * / include/vrv/calcligatureorneumeposfunctor.h.
 *
 * Sets note positions and chant glyphs for ligatures and neumes. Unmigrated
 * tree/layout classes (Ligature, Neume, Note, Nc, Staff, ...) are represented
 * by structural contracts; no layout algorithm is invented.
 */
import { DocFunctor } from './functor.js';
import {
  SMUFL_E990_chantPunctum,
  SMUFL_E991_chantPunctumInclinatum,
  SMUFL_E994_chantAuctumAsc,
  SMUFL_E995_chantAuctumDesc,
  SMUFL_E996_chantPunctumVirga,
  SMUFL_E997_chantPunctumVirgaReversed,
  SMUFL_E99B_chantQuilisma,
  SMUFL_E9A1_chantPunctumDeminutum,
  SMUFL_E9B4_chantEntryLineAsc2nd,
  SMUFL_E9B5_chantEntryLineAsc3rd,
  SMUFL_E9B6_chantEntryLineAsc4th,
  SMUFL_E9B7_chantEntryLineAsc5th,
  SMUFL_E9B9_chantLigaturaDesc2nd,
  SMUFL_E9BA_chantLigaturaDesc3rd,
  SMUFL_E9BB_chantLigaturaDesc4th,
  SMUFL_E9BC_chantLigaturaDesc5th,
  SMUFL_E9BE_chantConnectingLineAsc3rd,
  SMUFL_EA29_medRenStrophicusCMN,
  SMUFL_EA2A_medRenOriscusCMN,
} from './smufl.js';
import {
  ClassId,
  DURATION_1,
  DURATION_breve,
  DURATION_long,
  DURATION_maxima,
  FunctorCode,
} from './vrvdef.js';

// Canonical ordinals from src-cpp/libmei/dist/atttypes.h and src-cpp/include/vrv/vrvdef.h.
const NOTATIONTYPE_mensural_black = 3;
const NOTATIONTYPE_neume_hufnagel = 7;
const LIGATUREFORM_obliqua = 2;
const LIGATURE_DEFAULT = 0;
const LIGATURE_STEM_LEFT_UP = 1;
const LIGATURE_STEM_LEFT_DOWN = 2;
const LIGATURE_STEM_RIGHT_DOWN = 8;
const LIGATURE_OBLIQUE = 16;
const LIGATURE_STACKED = 32;
const BOOLEAN_true = 1;
const COMPASSDIRECTION_n = 1;
const COMPASSDIRECTION_s = 3;
const COMPASSDIRECTION_se = 7;
const CURVE_c = 2;
const CURVE_a = 1;
const ncForm_CON_e = 3;
const VRV_UNSET = -0x7fffffff;

export interface ChantGlyph {
  m_fontNo: number;
  m_xOffset: number;
  m_yOffset: number;
}

export interface CalcLigatureNoteLike {
  GetLig(): number;
  GetActualDur(): number;
  GetDiatonicPitch(): number;
  GetDrawingRadius(doc: unknown, isMensural: boolean): number;
  SetDrawingXRel(value: number): void;
  GetDrawingXRel(): number;
}

export interface CalcLigatureLigatureLike {
  m_drawingShapes: number[];
  GetList(): CalcLigatureNoteLike[];
  GetAncestorStaff(): CalcLigatureStaffLike | null;
  GetForm(): number;
}

export interface CalcLigatureStaffLike {
  m_drawingStaffSize: number;
  m_drawingNotationType: number;
}

export interface CalcLigatureNcLike {
  m_drawingGlyphs: ChantGlyph[];
  FindDescendantByType(classId: ClassId): unknown;
  GetCon(): number;
  GetCurve(): number;
  GetLigated(): number;
  HasTilt(): boolean;
  GetTilt(): number;
  PitchOrLocDifferenceTo(other: CalcLigatureNcLike): number;
  SetDrawingXRel(value: number): void;
}

export interface CalcLigatureNeumeLike {
  FindAllDescendantsByType(classId: ClassId): CalcLigatureNcLike[];
  GetAncestorStaff(): CalcLigatureStaffLike | null;
}

export interface CalcLigatureDocLike {
  GetOptions(): {
    m_ligatureAsBracket: { GetValue(): boolean };
    m_neumeAsNote: { GetValue(): boolean };
    m_liquescentWithoutTails: { GetValue(): boolean };
  };
  GetDrawingStemWidth(staffSize: number): number;
  GetDrawingUnit(staffSize: number): number;
  GetGlyphWidth(code: number, staffSize: number, cueSize: boolean): number;
  HasFacsimile(): boolean;
}

function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`CalcLigatureOrNeumePosFunctor: ${message}`);
}

function makeGlyph(): ChantGlyph {
  return { m_fontNo: 0, m_xOffset: 0, m_yOffset: 0 };
}

export class CalcLigatureOrNeumePosFunctor extends DocFunctor {
  public constructor(doc: unknown) {
    super(doc);
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  private SetChantLigatureGlyphs(
    nc: CalcLigatureNcLike, previousNc: CalcLigatureNcLike, pitchDifference: number, unit: number,
  ): void {
    assertInvariant(nc, 'expected nc');
    assertInvariant(previousNc, 'expected previous nc');

    nc.m_drawingGlyphs[0].m_yOffset = -pitchDifference * unit;
    previousNc.m_drawingGlyphs[0].m_yOffset = pitchDifference * unit;

    // set the glyph for both the current and previous nc
    switch (pitchDifference) {
      case -1:
        nc.m_drawingGlyphs[0].m_fontNo = SMUFL_E9B9_chantLigaturaDesc2nd;
        previousNc.m_drawingGlyphs[0].m_fontNo = SMUFL_E9B4_chantEntryLineAsc2nd;
        break;
      case -2:
        nc.m_drawingGlyphs[0].m_fontNo = SMUFL_E9BA_chantLigaturaDesc3rd;
        previousNc.m_drawingGlyphs[0].m_fontNo = SMUFL_E9B5_chantEntryLineAsc3rd;
        break;
      case -3:
        nc.m_drawingGlyphs[0].m_fontNo = SMUFL_E9BB_chantLigaturaDesc4th;
        previousNc.m_drawingGlyphs[0].m_fontNo = SMUFL_E9B6_chantEntryLineAsc4th;
        break;
      case -4:
        nc.m_drawingGlyphs[0].m_fontNo = SMUFL_E9BC_chantLigaturaDesc5th;
        previousNc.m_drawingGlyphs[0].m_fontNo = SMUFL_E9B7_chantEntryLineAsc5th;
        break;
      default: break;
    }
  }

  public VisitLigature(ligature: CalcLigatureLigatureLike): FunctorCode {
    const doc = this.m_doc as unknown as CalcLigatureDocLike;
    if (doc.GetOptions().m_ligatureAsBracket.GetValue()) return FunctorCode.FUNCTOR_CONTINUE;

    ligature.m_drawingShapes.length = 0;

    const notes = ligature.GetList();
    const lastNote = notes[notes.length - 1];
    const staff = ligature.GetAncestorStaff();

    if (notes.length < 2) return FunctorCode.FUNCTOR_SIBLINGS;

    let previousNote: CalcLigatureNoteLike | null = null;
    let previousUp = false;
    let n1 = 0;
    let n2 = 1;

    assertInvariant(staff, 'expected staff');
    const isMensuralBlack = staff.m_drawingNotationType === NOTATIONTYPE_mensural_black;
    let oblique = false;
    if (notes.length === 2 && ligature.GetForm() === LIGATUREFORM_obliqua) oblique = true;

    // For better clarity, we loop within the VisitLigature instead of implementing VisitNote.

    for (const note of notes) {
      assertInvariant(note, 'expected note');

      ligature.m_drawingShapes.push(LIGATURE_DEFAULT);

      if (!previousNote) {
        previousNote = note;
        continue;
      }

      // Look at the @lig attribute on the previous note
      if (previousNote.GetLig() === LIGATUREFORM_obliqua) oblique = true;
      let dur1 = previousNote.GetActualDur();
      let dur2 = note.GetActualDur();
      // Same treatment for Mx and LG except for positioning, which is done above
      // We still need to avoid oblique, so keep a flag.
      let isMaxima = false;
      if (dur1 === DURATION_maxima) {
        dur1 = DURATION_long;
        isMaxima = true;
      }
      if (dur2 === DURATION_maxima) dur2 = DURATION_long;

      const diatonicStep = note.GetDiatonicPitch() - previousNote.GetDiatonicPitch();
      const up = diatonicStep > 0;
      const isLastNote = note === lastNote;

      // L - L
      if (dur1 === DURATION_long && dur2 === DURATION_long) {
        if (up) {
          ligature.m_drawingShapes[n1] = LIGATURE_STEM_RIGHT_DOWN;
          ligature.m_drawingShapes[n2] = LIGATURE_STEM_RIGHT_DOWN;
        }
        else {
          // nothing to change
        }
      }
      // L - B
      else if (dur1 === DURATION_long && dur2 === DURATION_breve) {
        if (up) {
          ligature.m_drawingShapes[n1] = LIGATURE_STEM_RIGHT_DOWN;
        }
        // automatically set oblique on B, but not with Mx and only at the beginning and end
        else if (!isMaxima && (n1 === 0 || isLastNote)) {
          ligature.m_drawingShapes[n1] = LIGATURE_OBLIQUE;
          // make sure the previous one is not oblique
          if (n1 > 0) {
            ligature.m_drawingShapes[n1 - 1] &= ~LIGATURE_OBLIQUE;
          }
        }
      }
      // B - B
      else if (dur1 === DURATION_breve && dur2 === DURATION_breve) {
        if (up) {
          // nothing to change
        }
        // automatically set oblique on B only at the beginning and end
        else if (n1 === 0 || isLastNote) {
          ligature.m_drawingShapes[n1] = LIGATURE_OBLIQUE;
          // make sure the previous one is not oblique
          if (n1 > 0) {
            ligature.m_drawingShapes[n1 - 1] &= ~LIGATURE_OBLIQUE;
          }
          else {
            ligature.m_drawingShapes[n1] |= LIGATURE_STEM_LEFT_DOWN;
          }
        }
      }
      // B - L
      else if (dur1 === DURATION_breve && dur2 === DURATION_long) {
        if (up) {
          ligature.m_drawingShapes[n2] = LIGATURE_STEM_RIGHT_DOWN;
        }
        else {
          if (!isLastNote) {
            ligature.m_drawingShapes[n2] = LIGATURE_STEM_RIGHT_DOWN;
          }
          if (n1 === 0) {
            ligature.m_drawingShapes[n1] = LIGATURE_STEM_LEFT_DOWN;
          }
        }
      }
      // SB - SB
      else if (dur1 === DURATION_1 && dur2 === DURATION_1) {
        ligature.m_drawingShapes[n1] = LIGATURE_STEM_LEFT_UP;
      }
      // SB - L (this should not happen on the first two notes, but this is an encoding problem)
      else if (dur1 === DURATION_1 && dur2 === DURATION_long) {
        if (up) {
          ligature.m_drawingShapes[n2] = LIGATURE_STEM_RIGHT_DOWN;
        }
        else {
          // nothing to change
        }
      }
      // SB - B (this should not happen on the first two notes, but this is an encoding problem)
      else if (dur1 === DURATION_1 && dur2 === DURATION_breve) {
        if (up) {
          // nothing to change
        }
        // only set the oblique with the SB if the following B is not the start of an oblique
        else if (note.GetLig() !== LIGATUREFORM_obliqua) {
          ligature.m_drawingShapes[n1] = LIGATURE_OBLIQUE;
          if (n1 > 0) {
            ligature.m_drawingShapes[n1 - 1] &= ~LIGATURE_OBLIQUE;
          }
        }
      }

      // Blindly set the oblique shape without trying to deal with encoding problems
      if (oblique) {
        ligature.m_drawingShapes[n1] |= LIGATURE_OBLIQUE;
        if (n1 > 0) {
          ligature.m_drawingShapes[n1 - 1] &= ~LIGATURE_OBLIQUE;
        }
      }

      // With mensural black notation, stack longa going up
      if (isLastNote && isMensuralBlack && dur2 === DURATION_long && up) {
        // Stack only if at least a third
        let stackThreshold = 1;
        // If the previous was going down, adjust the threshold
        if (n1 > 0 && !previousUp) {
          // For oblique, stack but only from a fourth, for recta, never stack them
          stackThreshold = (ligature.m_drawingShapes[n1 - 1] & LIGATURE_OBLIQUE) ? 2 : -VRV_UNSET;
        }
        if (diatonicStep > stackThreshold) ligature.m_drawingShapes[n2] = LIGATURE_STACKED;
      }

      oblique = false;
      previousNote = note;
      previousUp = up;
      ++n1;
      ++n2;
    }

    /**** Set the xRel position for each note ****/

    let previousRight = 0;
    let prevNote: CalcLigatureNoteLike | null = null;
    n1 = 0;

    for (const note of notes) {
      assertInvariant(note, 'expected note');

      // previousRight is 0 for the first note
      const width = note.GetDrawingRadius(this.m_doc, true) * 2
        - doc.GetDrawingStemWidth(staff.m_drawingStaffSize);
      // With stacked notes, back-track the position
      if (ligature.m_drawingShapes[n1 + 1] & LIGATURE_STACKED) previousRight -= width;
      note.SetDrawingXRel(previousRight);
      previousRight += width;

      if (!prevNote) {
        prevNote = note;
        continue;
      }

      const diatonicStep = note.GetDiatonicPitch() - prevNote.GetDiatonicPitch();

      // For large interval and oblique, adjust the x position to limit the angle
      if (ligature.m_drawingShapes[n1] & LIGATURE_OBLIQUE && Math.abs(diatonicStep) > 2) {
        // angle stays the same from third onward (2 / 3 or a brevis per diatonic step)
        // C++ int arithmetic at the * 2 / 3 boundary; Math.trunc preserves it.
        const shift = Math.trunc((Math.abs(diatonicStep) - 2) * width * 2 / 3);
        note.SetDrawingXRel(note.GetDrawingXRel() + shift);
        previousRight += shift;
      }
      prevNote = note;
      ++n1;
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitNeume(neume: CalcLigatureNeumeLike): FunctorCode {
    const doc = this.m_doc as unknown as CalcLigatureDocLike;
    if (doc.GetOptions().m_neumeAsNote.GetValue()) return FunctorCode.FUNCTOR_SIBLINGS;

    const ncs = neume.FindAllDescendantsByType(ClassId.NC);

    const staff = neume.GetAncestorStaff();
    assertInvariant(staff, 'expected staff');
    const staffSize = staff.m_drawingStaffSize;
    const unit = doc.GetDrawingUnit(staffSize);

    let xRel = 0;
    let previousNc: CalcLigatureNcLike | null = null;
    let previousLig = false;
    const isHufnagel = staff.m_drawingNotationType === NOTATIONTYPE_neume_hufnagel;

    for (let i = 0; i < ncs.length; ++i) {
      const nc = ncs[i];
      assertInvariant(nc, 'expected nc');

      const nextNc = i + 1 < ncs.length ? ncs[i + 1] : null;

      const hasLiquescent = !!nc.FindDescendantByType(ClassId.LIQUESCENT);
      const hasOriscus = !!nc.FindDescendantByType(ClassId.ORISCUS);
      const hasQuilisma = !!nc.FindDescendantByType(ClassId.QUILISMA);
      const hasStrophicus = !!nc.FindDescendantByType(ClassId.STROPHICUS);

      const lineWidth = doc.GetGlyphWidth(SMUFL_E9BE_chantConnectingLineAsc3rd, staffSize, false);

      // Make sure we have at least one glyph
      while (nc.m_drawingGlyphs.length < 1) nc.m_drawingGlyphs.push(makeGlyph());

      const pitchDifference = previousNc ? nc.PitchOrLocDifferenceTo(previousNc) : 0;
      let overlapWithPrevious = pitchDifference !== 0;
      const hufnagelToPrevious = isHufnagel && !!previousNc && nc.GetCon() === ncForm_CON_e;
      const hufnagelStart = isHufnagel && !!nextNc && nextNc.GetCon() === ncForm_CON_e;

      if (hasLiquescent) {
        const gabcNoTailsOption = doc.GetOptions().m_liquescentWithoutTails.GetValue();
        if (!gabcNoTailsOption) {
          while (nc.m_drawingGlyphs.length < 3) nc.m_drawingGlyphs.push(makeGlyph());
        }

        const ncWidth = doc.GetGlyphWidth(SMUFL_E995_chantAuctumDesc, staffSize, false);
        const tailLineWidth = doc.GetGlyphWidth(SMUFL_E9BE_chantConnectingLineAsc3rd, staffSize, false);

        if (nc.GetCurve() === CURVE_c) {
          nc.m_drawingGlyphs[0].m_fontNo = SMUFL_E995_chantAuctumDesc;
          if (!gabcNoTailsOption) {
            nc.m_drawingGlyphs[1].m_fontNo = SMUFL_E9BE_chantConnectingLineAsc3rd;
            nc.m_drawingGlyphs[2].m_fontNo = SMUFL_E9BE_chantConnectingLineAsc3rd;
            nc.m_drawingGlyphs[2].m_xOffset = ncWidth - tailLineWidth;
            nc.m_drawingGlyphs[1].m_yOffset = -1.75 * unit;
            nc.m_drawingGlyphs[2].m_yOffset = -1.9 * unit;
          }
        }
        else if (nc.GetCurve() === CURVE_a) {
          nc.m_drawingGlyphs[0].m_fontNo = SMUFL_E994_chantAuctumAsc;
          if (!gabcNoTailsOption) {
            nc.m_drawingGlyphs[1].m_fontNo = SMUFL_E9BE_chantConnectingLineAsc3rd;
            nc.m_drawingGlyphs[2].m_fontNo = SMUFL_E9BE_chantConnectingLineAsc3rd;
            nc.m_drawingGlyphs[2].m_xOffset = ncWidth - tailLineWidth;
            nc.m_drawingGlyphs[1].m_yOffset = 0.5 * unit;
            nc.m_drawingGlyphs[2].m_yOffset = 0.75 * unit;
          }
        }
        else {
          nc.m_drawingGlyphs[0].m_fontNo = SMUFL_E9A1_chantPunctumDeminutum;
        }
      }
      else if (hasOriscus) {
        nc.m_drawingGlyphs[0].m_fontNo = SMUFL_EA2A_medRenOriscusCMN;
      }
      else if (hasQuilisma) {
        nc.m_drawingGlyphs[0].m_fontNo = SMUFL_E99B_chantQuilisma;
      }
      else if (hasStrophicus) {
        nc.m_drawingGlyphs[0].m_fontNo = SMUFL_EA29_medRenStrophicusCMN;
      }
      else {
        nc.m_drawingGlyphs[0].m_fontNo = SMUFL_E990_chantPunctum;

        if (hufnagelStart) {
          nc.m_drawingGlyphs[0].m_fontNo = SMUFL_E9B4_chantEntryLineAsc2nd;
        }
        else if (hufnagelToPrevious) {
          overlapWithPrevious = false;
          assertInvariant(previousNc, 'expected previous nc');
          this.SetChantLigatureGlyphs(nc, previousNc, pitchDifference, unit);
        }
        else if (nc.GetLigated() === BOOLEAN_true) {
          // This is the first nc of a ligature
          if (!previousLig) {
            // Temporarily set a second line glyph
            nc.m_drawingGlyphs[0].m_fontNo = SMUFL_E9B4_chantEntryLineAsc2nd;
            previousLig = true;
          }
          // This is the second
          else {
            // No overlap in this case since the second starts at the same position as the first
            overlapWithPrevious = false;
            assertInvariant(previousNc, 'expected previous nc');
            previousLig = false;
            this.SetChantLigatureGlyphs(nc, previousNc, pitchDifference, unit);
          }
        }
        // Check if nc is part of a ligature or is an inclinatum
        else if (nc.HasTilt() && nc.GetTilt() === COMPASSDIRECTION_se) {
          nc.m_drawingGlyphs[0].m_fontNo = SMUFL_E991_chantPunctumInclinatum;
          // No overlap with this shape
          overlapWithPrevious = false;
        }
        // If the nc is supposed to be a virga and currently is being rendered as a punctum
        // change it to a virga
        else if (nc.GetTilt() === COMPASSDIRECTION_s
          && nc.m_drawingGlyphs[0].m_fontNo === SMUFL_E990_chantPunctum) {
          nc.m_drawingGlyphs[0].m_fontNo = SMUFL_E996_chantPunctumVirga;
        }
        else if (nc.GetTilt() === COMPASSDIRECTION_n
          && nc.m_drawingGlyphs[0].m_fontNo === SMUFL_E990_chantPunctum) {
          nc.m_drawingGlyphs[0].m_fontNo = SMUFL_E997_chantPunctumVirgaReversed;
        }
      }

      // xRel remains unset with facsimile
      if (!doc.HasFacsimile()) {
        // If the nc overlaps with the previous, move it back from a line width
        if (overlapWithPrevious) {
          xRel -= lineWidth;
        }

        nc.SetDrawingXRel(xRel);
        // The first glyph set the spacing - unless we are starting a ligature, in which case no spacing should be
        // added between the two nc
        if (!previousLig && !hufnagelStart) {
          xRel += doc.GetGlyphWidth(nc.m_drawingGlyphs[0].m_fontNo, staffSize, false);
        }
      }

      previousNc = nc;
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}
