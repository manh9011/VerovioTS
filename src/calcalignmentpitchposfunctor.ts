/**
 * Pure TypeScript translation of Verovio's src/calcalignmentpitchposfunctor.cpp
 * / include/vrv/calcalignmentpitchposfunctor.h.
 *
 * Calculates drawing Y positions (SetDrawingYRel / SetDrawingLoc) for layer
 * elements. Unmigrated tree/layout classes (Staff, Layer, Score, Note, Rest,
 * Tuning, ...) are represented by structural contracts exposing only the
 * methods consumed by this functor; no layout algorithm is invented.
 */
import { DocFunctor } from './functor.js';
import {
  ClassId,
  DURATION_1,
  DURATION_32,
  DURATION_4,
  DURATION_8,
  DURATION_breve,
  FunctorCode,
  VRV_UNSET,
} from './vrvdef.js';
import { MEI_UNSET_OCT, PITCHNAME_c, PitchInterface, type data_OCTAVE } from './pitchinterface.js';

// Canonical libMEI ordinals from src-cpp/libmei/dist/atttypes.h.
const NOTATIONTYPE_tab_lute_french = 11;
const NOTATIONTYPE_tab_lute_italian = 12;
const NOTATIONTYPE_tab_lute_german = 13;
const NOTATIONTYPE_tab_guitar = 10;
const VERTICALALIGNMENT_bottom = 3;

/**
 * Direct port of Tuning::CalcPitchPos (src-cpp/src/tuning.cpp), kept local
 * until the Tuning unit migrates. Branch order and formulas match C++ exactly.
 */
export function CalcTabPitchPos(
  course: number,
  notationType: number,
  lines: number,
  listSize: number,
  index: number,
  loc: number,
  tabLine: number,
  tabAnchorline: number,
  topAlign: boolean,
): number {
  switch (notationType) {
    case NOTATIONTYPE_tab_lute_french:
      // All courses >= 7 are positioned above line 0.
      return (lines - Math.min(course, 7)) * 2 + 1;
    case NOTATIONTYPE_tab_lute_italian:
      // All courses >= 7 are positioned on line 7.
      return (Math.min(course, 7) - 1) * 2;
    case NOTATIONTYPE_tab_lute_german:
      if (tabLine !== 0) return (tabLine - 1) * 2;
      if (loc !== VRV_UNSET) return loc;
      if (tabAnchorline !== 0) return (Math.min(tabAnchorline - 1, lines - listSize) + index) * 2;
      if (topAlign) return (lines - listSize + index) * 2;
      return index * 2;
    case NOTATIONTYPE_tab_guitar:
    default:
      return Math.abs(course - lines) * 2;
  }
}

export class CalcAlignmentPitchPosFunctor extends DocFunctor {
  private m_octDefault: data_OCTAVE = MEI_UNSET_OCT;
  private readonly m_octDefaultForStaffN = new Map<number, data_OCTAVE>();

  public constructor(doc: unknown) {
    super(doc);
    this.m_octDefault = MEI_UNSET_OCT;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitLayerElement(layerElement: any): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    let layerElementY = layerElement;
    let staffY = layerElement.GetAncestorStaff();
    let layerY = layerElement.GetFirstAncestor(ClassId.LAYER);
    if (!layerY) throw new Error('CalcAlignmentPitchPosFunctor::VisitLayerElement: missing layer');

    const pitchInterface = layerElement.GetPitchInterface();
    if (pitchInterface) {
      pitchInterface.SetOctDefault(this.m_octDefault);
      // Check if there is an octave default for the staff - ignore cross-staff for this and use staffY.
      if (this.m_octDefaultForStaffN.has(staffY.GetN())) {
        pitchInterface.SetOctDefault(this.m_octDefaultForStaffN.get(staffY.GetN())!);
      }
    }

    if (layerElement.m_crossStaff && layerElement.m_crossLayer) {
      layerElementY = layerElement.m_crossLayer.GetAtPos(layerElement.GetDrawingX());
      staffY = layerElement.m_crossStaff;
      layerY = layerElement.m_crossLayer;
    }

    // Adjust m_drawingYRel for notes and rests, etc.
    if (layerElement.Is(ClassId.ACCID)) {
      const accid = layerElement;
      if (!accid.GetFirstAncestor(ClassId.NOTE) && !accid.GetFirstAncestor(ClassId.CUSTOS)
        && !this.m_doc.IsNeumeLines()) {
        // do something for accid that are not children of a note - e.g., mensural?
        // skip for neume-lines mode as accid doesn't have a pitch in this case
        accid.SetDrawingYRel(staffY.CalcPitchPosYRel(this.m_doc, accid.CalcDrawingLoc(layerY, layerElementY)));
      }
      // override if staff position is set explicitly
      if (accid.HasPloc() && accid.HasOloc()) {
        accid.SetDrawingLoc(
          PitchInterface.CalcLoc(accid.GetPloc(), accid.GetOloc(), layerY.GetClefLocOffset(layerElementY)));
        accid.SetDrawingYRel(staffY.CalcPitchPosYRel(this.m_doc, accid.GetDrawingLoc()));
      } else if (accid.HasLoc()) {
        accid.SetDrawingLoc(accid.GetLoc());
        accid.SetDrawingYRel(staffY.CalcPitchPosYRel(this.m_doc, accid.GetLoc()));
      }
    } else if (layerElement.Is(ClassId.CHORD)) {
      // The y position is set to the top note one.
      const loc = PitchInterface.CalcLoc(layerElement, layerY, layerElementY, true);
      layerElement.SetDrawingYRel(staffY.CalcPitchPosYRel(this.m_doc, loc));
    } else if (layerElement.Is(ClassId.DOT)) {
      const positionInterface = layerElement.GetPositionInterface();
      if (!positionInterface) throw new Error('CalcAlignmentPitchPosFunctor::VisitLayerElement: missing position interface');
      layerElement.SetDrawingYRel(
        staffY.CalcPitchPosYRel(this.m_doc, positionInterface.CalcDrawingLoc(layerY, layerElementY)));
    } else if (layerElement.Is(ClassId.CUSTOS)) {
      const custos = layerElement;
      let loc = 0;
      if (custos.HasPname()) {
        loc = PitchInterface.CalcLoc(custos, layerY, layerElementY);
      }
      const yRel = staffY.CalcPitchPosYRel(this.m_doc, loc);
      custos.SetDrawingLoc(loc);
      custos.SetDrawingYRel(yRel);
    } else if (layerElement.Is(ClassId.NOTE)) {
      const note = layerElement;
      const chord = note.IsChordTone();
      let loc = 0;
      const tabGrp = note.IsTabGrpNote();
      if (tabGrp && staffY.IsTablature()) { // not for tab.staff-like
        if (!staffY.m_drawingStaffDef) throw new Error('CalcAlignmentPitchPosFunctor::VisitLayerElement: missing drawing staffDef');
        loc = CalcTabPitchPos(note.GetTabCourse(), staffY.m_drawingNotationType, staffY.m_drawingLines,
          tabGrp.GetListSize(), tabGrp.GetListIndex(note), note.GetLoc(), note.GetTabLine(),
          staffY.m_drawingStaffDef.GetTabAnchorline(),
          staffY.m_drawingStaffDef.GetTabAlign() !== VERTICALALIGNMENT_bottom);
      } else if (note.IsCursor()) {
        const cursor = note;
        const offset = layerY.GetClefLocOffset(cursor.HasPosition() ? cursor.GetPosition() : cursor);
        loc = PitchInterface.CalcLoc(cursor.GetPname(), cursor.GetOct(), offset);
        const locPitchC = PitchInterface.CalcLoc(PITCHNAME_c, cursor.GetOct(), offset);
        const yRelPitchC = staffY.CalcPitchPosYRel(this.m_doc, locPitchC);
        cursor.SetYRelPitchC(yRelPitchC);
      } else if ((note.HasPname() && (note.HasOct() || note.HasOctDefault())) || note.HasLoc()) {
        loc = PitchInterface.CalcLoc(note, layerY, layerElementY);
      }
      let yRel = staffY.CalcPitchPosYRel(this.m_doc, loc);
      // Make it relative to the top note one (see above) but not for cross-staff notes in chords.
      if (chord && !note.m_crossStaff) {
        yRel -= chord.GetDrawingYRel();
      }
      note.SetDrawingLoc(loc);
      note.SetDrawingYRel(yRel);
    } else if (layerElement.Is(ClassId.MREST)) {
      const mRest = layerElement;
      let loc = 0;
      if (mRest.HasPloc() && mRest.HasOloc()) {
        loc = PitchInterface.CalcLoc(mRest.GetPloc(), mRest.GetOloc(), layerY.GetClefLocOffset(layerElementY));
      } else if (mRest.HasLoc()) {
        loc = mRest.GetLoc();
      } else {
        // Automatically calculate rest position: default location is the middle of the staff.
        const staff = mRest.GetAncestorStaff();
        loc = staff.m_drawingLines - 1;
        if (loc % 2 !== 0) --loc;
        if (staff.m_drawingLines > 1) loc += 2;
        // Limitation: GetLayerCount does not take into account editorial markup; should be refined later.
        const hasMultipleLayer = staffY.GetChildCount(ClassId.LAYER) > 1;
        if (hasMultipleLayer) {
          loc = mRest.GetOptimalLayerLocation(layerY, loc);
        }
      }
      mRest.SetDrawingLoc(loc);
      mRest.SetDrawingYRel(staffY.CalcPitchPosYRel(this.m_doc, loc));
    } else if (layerElement.Is(ClassId.REST)) {
      const durInterface = layerElement.GetDurationInterface();
      if (!durInterface) throw new Error('CalcAlignmentPitchPosFunctor::VisitLayerElement: missing duration interface');
      let rest: any = null;
      let loc = VRV_UNSET;
      if (layerElement.Is(ClassId.REST)) {
        rest = layerElement;
        if (rest.HasPloc() && rest.HasOloc()) {
          loc = PitchInterface.CalcLoc(rest.GetPloc(), rest.GetOloc(), layerY.GetClefLocOffset(layerElementY));
        } else if (rest.HasLoc()) {
          loc = rest.GetLoc();
        }
      }
      // Automatically calculate rest position.
      if (loc === VRV_UNSET) {
        loc = 0;
        // set default location to the middle of the staff
        const staff = layerElement.GetAncestorStaff();
        loc = staff.m_drawingLines - 1;
        if (durInterface.GetDur() < DURATION_4 && loc % 2 !== 0) --loc;
        // Adjust special cases.
        if (durInterface.GetDur() === DURATION_1 && staff.m_drawingLines > 1) loc += 2;
        if (durInterface.GetDur() === DURATION_breve && staff.m_drawingLines < 2) loc -= 2;

        // If within a beam, calculate the rest's height based on its relationship to the notes that surround it.
        const beam = layerElement.GetFirstAncestor(ClassId.BEAM, 1);
        if (beam) {
          const beamList = beam.GetList();
          const restIndex = beam.GetListIndex(layerElement);
          if (restIndex < 0) throw new Error('CalcAlignmentPitchPosFunctor::VisitLayerElement: rest not in beam');

          let leftLoc = loc;
          // Iterate from the rest toward the beginning of the beam until a note or chord is hit.
          for (let i = restIndex - 1; i >= 0; --i) {
            const beamElement = beamList[i];
            if (beamElement.Is(ClassId.NOTE)) {
              leftLoc = PitchInterface.CalcLoc(beamElement, layerY, layerElementY);
              break;
            } else if (beamElement.Is(ClassId.CHORD)) {
              const topChordLoc = PitchInterface.CalcLoc(beamElement, layerY, layerElementY, true);
              const bottomChordLoc = PitchInterface.CalcLoc(beamElement, layerY, layerElementY, false);
              // if it's a rest, use the middle of the chord as the rest's location
              leftLoc = Math.trunc((topChordLoc + bottomChordLoc) / 2);
              break;
            }
          }

          let rightLoc = loc;
          // Iterate from the rest toward the end of the beam until a note or chord is hit.
          for (let i = restIndex; i < beamList.length; ++i) {
            const beamElement = beamList[i];
            if (beamElement.Is(ClassId.NOTE)) {
              rightLoc = PitchInterface.CalcLoc(beamElement, layerY, layerElementY);
              break;
            } else if (beamElement.Is(ClassId.CHORD)) {
              const topChordLoc = PitchInterface.CalcLoc(beamElement, layerY, layerElementY, true);
              const bottomChordLoc = PitchInterface.CalcLoc(beamElement, layerY, layerElementY, false);
              // if it's a rest, use the middle of the chord as the rest's location
              rightLoc = Math.trunc((topChordLoc + bottomChordLoc) / 2);
              break;
            }
          }

          // With a rest or space at the first / last position, use the right / left loc.
          if (restIndex === 0) {
            leftLoc = rightLoc;
            loc = rightLoc;
          } else if (restIndex === beamList.length - 1) {
            rightLoc = leftLoc;
            loc = leftLoc;
          }

          // Average the left note and right note's locations together to get our rest location.
          const locAvg = Math.trunc((rightLoc + leftLoc) / 2);
          if (Math.abs(locAvg - loc) > 3) {
            loc = locAvg;
          }

          // bottomAlignedLoc is the location where all of the rest's stems align to form a straight line.
          let bottomAlignedLoc = loc;
          // 8th note rests are aligned with the top of a 16th note rest, so to bottom align we push it down 2.
          if (durInterface.GetActualDur() === DURATION_8) bottomAlignedLoc -= 2;
          // for durations smaller than 32nd, bottomAlignedLoc decreases by 2 every iteration greater
          // than 32 (currently not implemented).

          // topAlignedLoc is the location where all of the top of the rests align to form a straight line.
          const topAlignedLoc = loc + (durInterface.GetActualDur() === DURATION_32 ? 2 : 0);
          // for smaller durations, topAlignedLoc offset increases by 2 every iteration greater than from 32
          // (currently only implemented for 32nds).

          const topOfStaffLoc = 10;
          const bottomOfStaffLoc = -4;

          // move the extrema towards center a little for aesthetic reasons
          const restAboveStaff = bottomAlignedLoc >= topOfStaffLoc;
          const restBelowStaff = topAlignedLoc <= bottomOfStaffLoc;
          if (restAboveStaff) {
            loc--;
          } else if (restBelowStaff) {
            loc++;
          }

          // if loc is odd, offset it to be even so dots do not collide with staff lines or ledger lines
          if (loc % 2 !== 0) {
            // if it's above the staff, offset downwards; if below the staff, offset upwards
            if (loc > 4) {
              loc--;
            } else {
              loc++;
            }
          }
        }

        const layer = layerElement.GetFirstAncestor(ClassId.LAYER);
        if (rest) {
          loc = rest.GetOptimalLayerLocation(staff, layer, loc);
        }
      }
      if (rest) {
        rest.SetDrawingLoc(loc);
      }
      layerElement.SetDrawingYRel(staffY.CalcPitchPosYRel(this.m_doc, loc));
    } else if (layerElement.Is(ClassId.TABDURSYM)) {
      let yRel = 0;
      if (staffY.IsTabWithStemsOutside()) {
        const spacingRatio = staffY.IsTabLuteFrench() || staffY.IsTabLuteGerman() ? 2.0 : 1.0;
        yRel += this.m_doc.GetDrawingUnit(staffY.m_drawingStaffSize) * spacingRatio;
      }
      layerElement.SetDrawingYRel(yRel);
    } else if (layerElement.Is(ClassId.NC)) {
      const nc = layerElement;
      let loc = 0;
      if (nc.HasPname() && nc.HasOct()) {
        loc = PitchInterface.CalcLoc(nc.GetPname(), nc.GetOct(), layerY.GetClefLocOffset(nc));
      } else if (nc.HasLoc()) {
        loc = nc.GetLoc();
      }
      const yRel = staffY.CalcPitchPosYRel(this.m_doc, loc);
      nc.SetDrawingLoc(loc);
      nc.SetDrawingYRel(yRel);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayer(layer: any): FunctorCode {
    if (layer.HasCursor()) {
      this.VisitCursor(layer.GetCursor());
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  // C++ FunctorInterface::VisitCursor default forwards to VisitLayerElement;
  // mirrored here at runtime (cf. cachehorizontallayoutfunctor pass 254) because
  // TS declaration merging provides the visitor surface at type level only.
  public VisitCursor(cursor: any): FunctorCode {
    return this.VisitLayerElement(cursor);
  }

  public VisitScore(score: any): FunctorCode {
    const scoreDef = score.GetScoreDef();
    if (scoreDef) {
      scoreDef.Process(this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScoreDef(scoreDef: any): FunctorCode {
    this.m_octDefaultForStaffN.clear();
    this.m_octDefault = scoreDef.GetOctDefault();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaffDef(staffDef: any): FunctorCode {
    if (staffDef.HasOctDefault() && staffDef.HasN()) {
      this.m_octDefaultForStaffN.set(staffDef.GetN(), staffDef.GetOctDefault());
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}
