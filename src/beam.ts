/**
 * Pure TypeScript translation of Verovio's beam.h / beam.cpp.
 *
 * The object hierarchy is still being migrated in dependency order, therefore
 * this unit uses structural contracts (`any`) at native-boundary points while
 * preserving the beam state machine and coordinate algorithms.
 */
import { BoundingBox } from './boundingbox.js';
import {
  ClassId, DURATION_NONE, DURATION_8, DURATION_16, DURATION_32, DURATION_64, DURATION_128,
  DURATION_256, DURATION_512, DURATION_1024, DURATION_4, VRV_UNSET,
  FunctorCode,
} from './vrvdef.js';
import {
  BeamDrawingInterface, StemmedDrawingInterface, mixinBeamDrawingInterface,
  BEAMPLACE_NONE, BEAMPLACE_above, BEAMPLACE_below, BEAMPLACE_mixed,
  STEMDIRECTION_NONE, STEMDIRECTION_up, STEMDIRECTION_down,
} from './drawinginterface.js';
import { ObjectListInterface, VrvObject } from './object.js';
import { LayerElement } from './layerelement.js';
import { InterfaceId } from './vrvdef.js';
import { InstBeamRend, InstBeamedWith } from './atts_cmn.js';
import { InstColor, InstCue } from './atts_shared.js';
import { ATT_CLASS_IDS } from './attmodule.js';

const PARTIAL_NONE = 0;
const PARTIAL_THROUGH = 1;
const PARTIAL_RIGHT = 2;
const PARTIAL_LEFT = 3;
const MAX_DURATION_PARTIALS = 16;
const SAMEAS_NONE = 0;
const SAMEAS_UNSET = 1;
const SAMEAS_PRIMARY = 2;
const SAMEAS_SECONDARY = 3;
const SPANNING_START_END = 0;
const SPANNING_START = 1;
const SPANNING_END = 2;
const SPANNING_MIDDLE = 3;
const STANDARD_STEMLENGTH = 7;
const STEMMODIFIER_sprech = 1000;

export type ArrayOfBeamElementCoords = BeamElementCoord[];

function isNoteOrChord(element: any): boolean {
  return !!element && !!element.IsAnyOf?.([ClassId.CHORD, ClassId.NOTE]);
}
function durationMin(a: number, b: number): number { return Math.min(a, b); }
function durationMax(a: number, b: number): number { return Math.max(a, b); }
function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export class BeamSegment {
  public m_nbNotesOrChords = 0;
  public m_beamSlope = 0;
  public m_verticalCenter = 0;
  public m_ledgerLinesAbove = 0;
  public m_ledgerLinesBelow = 0;
  public m_uniformStemLength = 0;
  public m_weightedPlace = BEAMPLACE_NONE;
  public m_firstNoteOrChord: BeamElementCoord | null = null;
  public m_lastNoteOrChord: BeamElementCoord | null = null;
  public m_beamElementCoordRefs: ArrayOfBeamElementCoords = [];
  public m_stemSameasRole = SAMEAS_NONE;
  public m_stemSameasReverseRole: { value: number } | null = null;

  // Derived beam drawing Y (integrated with staff alignment for parity)
  public m_drawingY: number = VRV_UNSET;

  constructor() { this.Reset(); }
  Reset(): void {
    this.ClearCoordRefs(); this.m_beamSlope = 0; this.m_verticalCenter = 0;
    this.m_ledgerLinesAbove = 0; this.m_ledgerLinesBelow = 0; this.m_uniformStemLength = 0;
    this.m_weightedPlace = BEAMPLACE_NONE; this.m_firstNoteOrChord = null; this.m_lastNoteOrChord = null;
    this.m_stemSameasRole = SAMEAS_NONE; this.m_stemSameasReverseRole = null;
    this.m_drawingY = VRV_UNSET;
  }
  GetElementCoordRefs(): ArrayOfBeamElementCoords { return this.m_beamElementCoordRefs; }
  ClearCoordRefs(): void { this.m_beamElementCoordRefs = []; }
  InitCoordRefs(coords: ArrayOfBeamElementCoords | null): void { this.m_beamElementCoordRefs = coords ? [...coords] : []; }

  StemSameas(): boolean { return this.m_stemSameasRole !== SAMEAS_NONE; }
  StemSameasIsUnset(): boolean { return this.m_stemSameasRole === SAMEAS_UNSET; }
  StemSameasIsPrimary(): boolean { return this.m_stemSameasRole === SAMEAS_PRIMARY; }
  StemSameasIsSecondary(): boolean { return this.m_stemSameasRole === SAMEAS_SECONDARY; }

  SetDrawingY(y: number): void {
    this.m_drawingY = y;
  }

  CalcBeam(layer: any, staff: any, doc: any, beamInterface: BeamDrawingInterface, place = BEAMPLACE_NONE, init = true): void {
    assertInvariant(layer && staff && doc, 'CalcBeam requires layer/staff/doc');
    assertInvariant(this.m_beamElementCoordRefs.length > 0, 'CalcBeam requires coordinates');
    if (init) this.CalcBeamInit(staff, doc, beamInterface, place);
    let horizontal = true;
    if (staff.IsTablature?.() || staff.IsTabStaffLike?.()) {
      const glyphSize = staff.GetDrawingStaffNotationSize?.() ?? staff.m_drawingStaffSize;
      beamInterface.m_fractionSize = glyphSize * 2 / 3;
      horizontal = !!staff.IsTabWithStemsOutside?.();
      this.CalcBeamPlaceTab(layer, staff, doc, beamInterface, place);
    } else {
      beamInterface.m_fractionSize = staff.m_drawingStaffSize;
      if (doc.GetOptions?.().m_beamMaxSlope?.GetValue?.()) horizontal = beamInterface.IsHorizontal();
      this.CalcBeamPlace(layer, beamInterface, place);
    }
    if (beamInterface.m_drawingPlace === BEAMPLACE_mixed) {
      this.CalcMixedBeamPlace(staff); this.CalcPartialFlagPlace();
    }
    this.CalcBeamStemLength(staff, beamInterface.m_drawingPlace, horizontal);
    this.CalcBeamPosition(doc, staff, beamInterface, horizontal);
    if (beamInterface.m_drawingPlace === BEAMPLACE_mixed && this.NeedToResetPosition(staff, doc, beamInterface)) {
      this.CalcBeamInit(staff, doc, beamInterface, place);
      this.CalcBeamStemLength(staff, beamInterface.m_drawingPlace, horizontal);
      this.CalcBeamPosition(doc, staff, beamInterface, horizontal);
    }
    if (staff.IsTablature?.() || staff.IsTabStaffLike?.()) this.CalcSetStemValuesTab(staff, doc, beamInterface);
    else this.CalcSetStemValues(staff, doc, beamInterface);
    // Ensure beam segment absolute Y matches staff Y (fix for staff line Y offset)
    this.m_drawingY = staff.GetDrawingY?.() ?? 0;
  }

  CalcSetStemValues(staff: any, doc: any, beamInterface: BeamDrawingInterface): void {
    const stemWidth = doc.GetDrawingStemWidth?.(staff.m_drawingStaffSize) ?? 0;
    for (const coord of this.m_beamElementCoordRefs) {
      const el = coord.m_element; if (!isNoteOrChord(el)) continue;
      const stemmed = coord.GetStemHolderInterface(); if (!stemmed) continue;
      if (!coord.m_closestNote) continue;
      let y1 = coord.m_yBeam; let y2 = coord.m_closestNote.GetDrawingY(); let sameas = false;
      if (this.StemSameasIsSecondary() && el.Is?.(ClassId.NOTE) && el.HasStemSameasNote?.()) {
        y1 = el.GetStemSameasNote().GetDrawingY(); sameas = true;
      }
      let stemAdjust = 0;
      if (beamInterface.m_drawingPlace === BEAMPLACE_above) {
        if (sameas) y1 += stemmed.GetStemUpSE(doc, staff.m_drawingStaffSize, beamInterface.m_cueSize).y;
        else stemAdjust = -stemWidth;
        y2 += stemmed.GetStemUpSE(doc, staff.m_drawingStaffSize, beamInterface.m_cueSize).y;
      } else if (beamInterface.m_drawingPlace === BEAMPLACE_below) {
        if (sameas) y1 += stemmed.GetStemDownNW(doc, staff.m_drawingStaffSize, beamInterface.m_cueSize).y;
        else stemAdjust = stemWidth;
        y2 += stemmed.GetStemDownNW(doc, staff.m_drawingStaffSize, beamInterface.m_cueSize).y;
      } else if (beamInterface.m_drawingPlace === BEAMPLACE_mixed) {
        let stemOffset = 0;
        const unit = doc.GetDrawingUnit?.(staff.m_drawingStaffSize) ?? 0;
        if (coord.m_partialFlagPlace === coord.m_beamRelativePlace) stemOffset = (coord.m_dur - DURATION_8) * beamInterface.m_beamWidth;
        else if (el.GetIsInBeamSpan?.() && coord.m_partialFlagPlace !== BEAMPLACE_above && coord.m_stem?.GetDrawingStemDir?.() === STEMDIRECTION_up) stemOffset = -unit / 2;
        const floating = beamInterface.GetFloatingBeamCount?.() ?? [0, 0];
        if (coord.m_stem?.GetDrawingStemDir?.() === STEMDIRECTION_down && (floating[0] > 0 || floating[1] > 0)) {
          let beamsCount = Math.max(floating[0], floating[1]); if (floating[1] <= 0) beamsCount--; stemOffset = beamsCount * beamInterface.m_beamWidth;
        }
        if (coord.m_beamRelativePlace === BEAMPLACE_below) {
          y2 += stemmed.GetStemDownNW(doc, staff.m_drawingStaffSize, beamInterface.m_cueSize).y;
          stemAdjust = -(beamInterface.m_beamWidthBlack + stemOffset);
        } else {
          y2 += stemmed.GetStemUpSE(doc, staff.m_drawingStaffSize, beamInterface.m_cueSize).y; stemAdjust = stemOffset;
        }
      }
      if (el.Is?.(ClassId.CHORD)) {
        const yMax = { value: 0 };
        const yMin = { value: 0 };
        el.GetYExtremes?.(yMax, yMin);
        // C++ beam.cpp CalcSetStemValues: for mixed beams the sign depends on the
        // coord's own side; otherwise it depends on the beam's drawing place.
        // (beamInterface.m_drawingPlace == BEAMPLACE_mixed)
        //   y2 += (coord->m_beamRelativePlace == BEAMPLACE_above) ? (yMin - yMax) : (yMax - yMin);
        // else
        //   y2 += (beamInterface->m_drawingPlace == BEAMPLACE_above) ? (yMin - yMax) : (yMax - yMin);
        if (beamInterface.m_drawingPlace === BEAMPLACE_mixed) {
          y2 += (coord.m_beamRelativePlace === BEAMPLACE_above) ? (yMin.value - yMax.value) : (yMax.value - yMin.value);
        }
        else {
          y2 += (beamInterface.m_drawingPlace === BEAMPLACE_above) ? (yMin.value - yMax.value) : (yMax.value - yMin.value);
        }
      }
      coord.UpdateStemLength(stemmed, y1, y2, stemAdjust, beamInterface.m_drawingPlace === BEAMPLACE_mixed);
    }
    if (doc.GetOptions?.().m_beamFrenchStyle?.GetValue?.() && this.m_beamElementCoordRefs.length > 2) this.AdjustBeamToFrenchStyle(beamInterface);
    this.AdjustBeamToTremolos(doc, staff, beamInterface);
  }

  CalcSetStemValuesTab(staff: any, doc: any, beamInterface: BeamDrawingInterface): void {
    for (const coord of this.m_beamElementCoordRefs) {
      const el = coord.m_element; if (!el?.Is?.(ClassId.TABGRP)) continue;
      if (!coord.m_closestNote && !coord.m_tabDurSym) continue;
      const stemmed = coord.GetStemHolderInterface(); if (!stemmed) continue;
      let y1 = coord.m_yBeam; let y2 = coord.m_closestNote ? coord.m_closestNote.GetDrawingY() : coord.m_tabDurSym.GetDrawingY();
      const stemW = doc.GetDrawingStemWidth?.(staff.m_drawingStaffSize) ?? 0;
      const unit = doc.GetDrawingUnit?.(staff.m_drawingStaffSize) ?? 0;
      if (beamInterface.m_drawingPlace === BEAMPLACE_above) { y1 -= stemW; if (coord.m_closestNote) y2 += unit; }
      else { y1 += stemW; if (coord.m_closestNote) y2 -= unit; }
      const stem = stemmed.GetDrawingStem?.(); if (!stem) continue;
      (stem as any).SetDrawingXRel?.(coord.m_x - (el.GetDrawingX?.() ?? 0));
      if (coord.m_closestNote) (stem as any).SetDrawingYRel?.(y2 - (el.GetDrawingY?.() ?? 0));
      stem.SetDrawingStemLen(y2 - y1);
    }
  }

  GetVerticalOffset(beamInterface: BeamDrawingInterface): [number, number] {
    const [top, bottom] = beamInterface.GetAdditionalBeamCount(); return [top * beamInterface.m_beamWidth, bottom * beamInterface.m_beamWidth];
  }
  GetMinimalStemLength(beamInterface: BeamDrawingInterface): [number, number] {
    let minAbove = VRV_UNSET; let minBelow = VRV_UNSET; const [topOffset, bottomOffset] = this.GetVerticalOffset(beamInterface);
    for (const coord of this.m_beamElementCoordRefs) {
      if (!isNoteOrChord(coord.m_element)) continue; const stemmed = coord.GetStemHolderInterface(); if (!stemmed) continue;
      const stem = stemmed.GetDrawingStem?.(); if (!stem || !coord.m_closestNote) continue;
      const up = stem.GetDrawingStemDir() === STEMDIRECTION_up;
      const current = up ? coord.m_yBeam - bottomOffset - coord.m_closestNote.GetDrawingY() : coord.m_closestNote.GetDrawingY() - coord.m_yBeam - topOffset;
      if (up) minBelow = minBelow === VRV_UNSET ? current : Math.min(minBelow, current); else minAbove = minAbove === VRV_UNSET ? current : Math.min(minAbove, current);
    }
    return [minAbove, minBelow];
  }
  DoesBeamOverlap(beamInterface: BeamDrawingInterface, topBorder: number, bottomBorder: number, minStemLength: number): boolean {
    if (this.m_beamElementCoordRefs.some(c => c.m_yBeam > topBorder || c.m_yBeam < bottomBorder)) return true;
    const [a, b] = this.GetMinimalStemLength(beamInterface); return Math.min(a, b) < minStemLength;
  }

  NeedToResetPosition(staff: any, doc: any, beamInterface: BeamDrawingInterface): boolean {
    if (beamInterface.m_crossStaffContent) {
      const place = this.m_beamElementCoordRefs[0].m_beamRelativePlace;
      if (this.m_beamElementCoordRefs.every(c => c.m_beamRelativePlace === place)) { beamInterface.m_drawingPlace = place; return true; }
      return false;
    }
    if (doc.GetOptions?.().m_beamMixedPreserve?.GetValue?.()) return false;
    const unit = doc.GetDrawingUnit?.(staff.m_drawingStaffSize) ?? 1;
    const minStem = (doc.GetOptions?.().m_beamMixedStemMin?.GetValue?.() ?? 0) * unit;
    const [topOffset, bottomOffset] = this.GetVerticalOffset(beamInterface);
    const staffTop = staff.GetDrawingY();
    // C++ computes in 32-bit int (wraps when m_drawingLines == VRV_UNSET); replicate with imul.
    const staffBottom = staffTop - Math.imul(doc.GetDrawingDoubleUnit?.(staff.m_drawingStaffSize) ?? 0, ((staff.m_drawingLines ?? 5) - 1) | 0);
    const topBorder = staffTop + topOffset + unit; const bottomBorder = staffBottom - bottomOffset - unit;
    if (!this.DoesBeamOverlap(beamInterface, topBorder, bottomBorder, minStem)) return false;
    let minY = this.m_beamElementCoordRefs[0].m_element.GetDrawingY(); let maxY = minY;
    for (const c of this.m_beamElementCoordRefs) { const y = c.m_element.GetDrawingY(); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    const midpoint = (maxY + minY) / 2; const within = midpoint < topBorder && midpoint > bottomBorder;
    const first = this.m_beamElementCoordRefs[0]; const last = this.m_beamElementCoordRefs.at(-1)!;
    if (within) {
      const off = (first.m_yBeam + last.m_yBeam - 2 * midpoint) / 2; for (const c of this.m_beamElementCoordRefs) c.m_yBeam -= off;
      if (!this.DoesBeamOverlap(beamInterface, topBorder, bottomBorder, minStem)) return false;
    }
    if (!within && midpoint > staffBottom) { const off = (first.m_yBeam + last.m_yBeam - 2 * topBorder) / 2; for (const c of this.m_beamElementCoordRefs) c.m_yBeam -= off; }
    else if (!within && midpoint < staffTop) { const off = (first.m_yBeam + last.m_yBeam - 2 * bottomBorder) / 2; for (const c of this.m_beamElementCoordRefs) c.m_yBeam -= off; }
    if (!this.DoesBeamOverlap(beamInterface, topBorder, bottomBorder, minStem)) return false;
    const up = this.m_beamElementCoordRefs.filter(c => c.GetStemDir() === STEMDIRECTION_up).length;
    const down = this.m_beamElementCoordRefs.filter(c => c.GetStemDir() === STEMDIRECTION_down).length;
    const dir = up >= down ? STEMDIRECTION_up : STEMDIRECTION_down;
    beamInterface.m_drawingPlace = dir === STEMDIRECTION_up ? BEAMPLACE_above : BEAMPLACE_below;
    if (dir === STEMDIRECTION_down && this.m_uniformStemLength > 0) this.m_uniformStemLength *= -1;
    return true;
  }

  AdjustBeamToFrenchStyle(beamInterface: BeamDrawingInterface): void {
    const coords = this.m_beamElementCoordRefs;
    for (let i = 1; i < coords.length - 1; i++) {
      const c = coords[i]; if (!isNoteOrChord(c.m_element)) continue;
      const vals = [c.m_breaksec ? durationMin(c.m_breaksec + DURATION_4, c.m_dur) : c.m_dur];
      const next = coords.slice(i + 1).find(isNoteOrChord); if (next) vals.push(next.m_dur);
      const prev = coords.slice(0, i).reverse().find(isNoteOrChord); if (prev) vals.push(prev.m_breaksec ? durationMin(prev.m_breaksec + DURATION_4, prev.m_dur) : prev.m_dur);
      const minDur = Math.min(...vals); if (minDur === DURATION_8) continue;
      const stemmed = c.GetStemHolderInterface(); const stem = stemmed?.GetDrawingStem?.(); if (!stem) continue;
      const sign = beamInterface.m_drawingPlace === BEAMPLACE_mixed ? (c.m_beamRelativePlace === BEAMPLACE_below ? -1 : 1) : (beamInterface.m_drawingPlace === BEAMPLACE_below ? -1 : 1);
      (stem as any).SetDrawingStemAdjust?.(((stem as any).GetDrawingStemAdjust?.() ?? 0) + sign * (minDur - DURATION_8) * beamInterface.m_beamWidth);
    }
  }
  AdjustBeamToLedgerLines(doc: any, staff: any, beamInterface: BeamDrawingInterface, isHorizontal: boolean): void {
    let adjust = 0; const staffTop = staff.GetDrawingY(); const staffHeight = doc.GetDrawingStaffSize(staff.m_drawingStaffSize); const doubleUnit = doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize); const margin = isHorizontal ? doubleUnit / 2 : 0;
    for (const c of this.m_beamElementCoordRefs) {
      if (beamInterface.m_drawingPlace === BEAMPLACE_below) { const top = c.m_yBeam + beamInterface.GetTotalBeamWidth(); if (top > staffTop - margin) { adjust = (Math.trunc((top - staffTop) / doubleUnit) + 1) * doubleUnit; break; } }
      else if (beamInterface.m_drawingPlace === BEAMPLACE_above) { const bottom = c.m_yBeam - beamInterface.GetTotalBeamWidth(); const bm = staffTop - staffHeight; if (bottom < bm + margin) { adjust = (Math.trunc((bottom - bm) / doubleUnit) - 1) * doubleUnit; break; } }
    }
    if (adjust) for (const c of this.m_beamElementCoordRefs) c.m_yBeam -= adjust;
  }
  AdjustBeamToTremolos(doc: any, staff: any, beamInterface: BeamDrawingInterface): void {
    let maxAdjustment = 0;
    for (const c of this.m_beamElementCoordRefs) { const stemmed = c.GetStemHolderInterface(); const stem = stemmed?.GetDrawingStem?.(); if (!stem) continue; const offset = (c.m_dur - DURATION_8) * beamInterface.m_beamWidth + beamInterface.m_beamWidthBlack; const adj = (stem as any).CalculateStemModAdjustment?.(doc, staff, offset) ?? c.m_element.GetStemModAdjustment?.(doc, staff, offset) ?? 0; if (Math.abs(adj) > Math.abs(maxAdjustment)) maxAdjustment = adj; }
    if (!maxAdjustment) return; for (const c of this.m_beamElementCoordRefs) { c.m_yBeam -= maxAdjustment; const stem = c.GetStemHolderInterface()?.GetDrawingStem?.(); if (stem) stem.SetDrawingStemLen(stem.GetDrawingStemLen() + maxAdjustment); }
  }

  CalcBeamInit(staff: any, doc: any, beamInterface: BeamDrawingInterface, place: number): void {
    const count = this.m_beamElementCoordRefs.length; assertInvariant(count > 0, 'beam coordinate list empty');
    for (const c of this.m_beamElementCoordRefs) c.m_x = c.m_element.GetDrawingX();
    this.m_verticalCenter = staff.GetDrawingY() - (doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize) * 2);
    beamInterface.m_beamWidthBlack = doc.GetDrawingBeamWidth(staff.m_drawingStaffSize, beamInterface.m_cueSize);
    beamInterface.m_beamWidthWhite = doc.GetDrawingBeamWhiteWidth(staff.m_drawingStaffSize, beamInterface.m_cueSize);
    if (beamInterface.m_shortestDur === DURATION_64) beamInterface.m_beamWidthWhite = beamInterface.m_beamWidthWhite * 4 / 3;
    if (staff.IsTablature?.() || staff.IsTabStaffLike?.()) {
      beamInterface.m_beamWidthBlack /= 2; beamInterface.m_beamWidthWhite /= 2;
      if (staff.IsTabLuteFrench?.() || staff.IsTabLuteGerman?.() || staff.IsTabLuteItalian?.() || staff.IsTabStaffLike?.()) {
        beamInterface.m_beamWidthBlack = beamInterface.m_beamWidthBlack * 2 / 5; beamInterface.m_beamWidthWhite = beamInterface.m_beamWidthWhite * 3 / 5;
      }
    }
    beamInterface.m_beamWidth = beamInterface.m_beamWidthBlack + beamInterface.m_beamWidthWhite;
    this.m_nbNotesOrChords = 0; this.m_ledgerLinesAbove = 0; this.m_ledgerLinesBelow = 0; this.m_firstNoteOrChord = null; this.m_lastNoteOrChord = null;
    let yMax = this.m_verticalCenter, yMin = this.m_verticalCenter;
    for (const c of this.m_beamElementCoordRefs) {
      c.m_yBeam = 0; const el = c.m_element;
      if (el?.IsAnyOf?.([ClassId.CHORD, ClassId.NOTE, ClassId.TABGRP])) { if (!this.m_firstNoteOrChord) this.m_firstNoteOrChord = c; this.m_lastNoteOrChord = c; this.m_nbNotesOrChords++; }
      if (el?.Is?.(ClassId.CHORD)) {
        const bot = el.GetBottomNote?.(); const top = el.GetTopNote?.();
        if (bot && top) {
          const maxRef = { value: 0 }, minRef = { value: 0 };
          this.CalcBeamInitForNotePair(bot, top, staff, maxRef, minRef);
          // C++ applies BOTH pair outputs through SetExtrema (max and min each).
          yMax = Math.max(yMax, maxRef.value, minRef.value);
          yMin = Math.min(yMin, maxRef.value, minRef.value);
        }
      }
      else if (el?.Is?.(ClassId.NOTE)) {
        if (el.HasStemSameasNote?.()) {
          const maxRef = { value: 0 }, minRef = { value: 0 };
          this.CalcBeamInitForNotePair(el, el.GetStemSameasNote(), staff, maxRef, minRef);
          yMax = Math.max(yMax, maxRef.value, minRef.value);
          yMin = Math.min(yMin, maxRef.value, minRef.value);
        } else {
          const y = el.GetDrawingY();
          yMax = Math.max(yMax, y); yMin = Math.min(yMin, y);
          const linesAbove = { value: 0 }, linesBelow = { value: 0 };
          if (el.HasLedgerLines?.(linesAbove, linesBelow, staff)) {
            this.m_ledgerLinesBelow += linesBelow.value;
            this.m_ledgerLinesAbove += linesAbove.value;
          }
        }
      }
    }
    this.m_weightedPlace = (this.m_verticalCenter - yMin) > (yMax - this.m_verticalCenter) ? BEAMPLACE_above : BEAMPLACE_below;
  }
  CalcBeamInitForNotePair(note1: any, note2: any, staff: any, yMaxRef?: {value:number}, yMinRef?: {value:number}): [number, number] {
    const bottomNote = note1.GetDrawingY() > note2.GetDrawingY() ? note2 : note1;
    const topNote = note1.GetDrawingY() > note2.GetDrawingY() ? note1 : note2;
    const yMax = bottomNote.GetDrawingY();
    const yMin = topNote.GetDrawingY();
    if (yMaxRef) yMaxRef.value = yMax;
    if (yMinRef) yMinRef.value = yMin;
    const linesAboveBottom = { value: 0 }, linesBelowBottom = { value: 0 };
    if (bottomNote.HasLedgerLines?.(linesAboveBottom, linesBelowBottom, staff)) {
      this.m_ledgerLinesBelow += linesBelowBottom.value;
    }
    const linesAboveTop = { value: 0 }, linesBelowTop = { value: 0 };
    if (topNote.HasLedgerLines?.(linesAboveTop, linesBelowTop, staff)) {
      this.m_ledgerLinesAbove += linesAboveTop.value;
    }
    return [yMax, yMin];
  }

  CalcBeamSlope(staff: any, doc: any, beamInterface: BeamDrawingInterface, stepRef?: {value:number}): boolean {
    if (this.m_nbNotesOrChords < 2 || !this.m_firstNoteOrChord || !this.m_lastNoteOrChord) { this.m_beamSlope = 0; return false; }
    const slope = (this.m_lastNoteOrChord.m_x === this.m_firstNoteOrChord.m_x) ? 0 : (this.m_lastNoteOrChord.m_yBeam - this.m_firstNoteOrChord.m_yBeam) / (this.m_lastNoteOrChord.m_x - this.m_firstNoteOrChord.m_x);
    let noteSlope = 0, noteStep = 0;
    if (this.m_firstNoteOrChord.m_closestNote && this.m_lastNoteOrChord.m_closestNote) {
      const x1=this.m_firstNoteOrChord.m_x,x2=this.m_lastNoteOrChord.m_x,y1=this.m_firstNoteOrChord.m_closestNote.GetDrawingY(),y2=this.m_lastNoteOrChord.m_closestNote.GetDrawingY();
      noteSlope=x2===x1?0:(y2-y1)/(x2-x1); noteStep=Math.abs(y1-y2);
    }
    this.m_beamSlope = slope || noteSlope; if (!this.m_beamSlope) return false;
    const unit=doc.GetDrawingUnit(staff.m_drawingStaffSize), short={value:false}; let step=this.CalcBeamSlopeStep(doc,staff,beamInterface,noteStep,short); if(stepRef)stepRef.value=step;
    const place=beamInterface.m_drawingPlace, cur=Math.abs(this.m_firstNoteOrChord.m_yBeam-this.m_lastNoteOrChord.m_yBeam);
    if(cur!==0 && cur<step && place!==BEAMPLACE_mixed)return false;
    if(cur===0){if(place===BEAMPLACE_above){if(this.m_beamSlope>0)this.m_lastNoteOrChord.m_yBeam+=step;else this.m_firstNoteOrChord.m_yBeam+=step;}else if(place===BEAMPLACE_below){if(this.m_beamSlope<0)this.m_lastNoteOrChord.m_yBeam-=step;else this.m_firstNoteOrChord.m_yBeam-=step;}}
    if(place===BEAMPLACE_above){if(this.m_beamSlope>0){this.m_firstNoteOrChord.m_centered=this.m_lastNoteOrChord.m_centered;if(short.value&&!this.m_lastNoteOrChord.m_centered){this.m_lastNoteOrChord.m_yBeam+=step;this.m_lastNoteOrChord.m_centered=true;}this.m_firstNoteOrChord.m_yBeam=this.m_lastNoteOrChord.m_yBeam-step;}else{this.m_lastNoteOrChord.m_centered=this.m_firstNoteOrChord.m_centered;if(short.value&&!this.m_firstNoteOrChord.m_centered){this.m_firstNoteOrChord.m_yBeam+=step;this.m_firstNoteOrChord.m_centered=true;}this.m_lastNoteOrChord.m_yBeam=this.m_firstNoteOrChord.m_yBeam-step;}}
    else if(place===BEAMPLACE_below){if(this.m_beamSlope<0){this.m_firstNoteOrChord.m_centered=this.m_lastNoteOrChord.m_centered;if(short.value&&!this.m_lastNoteOrChord.m_centered){this.m_lastNoteOrChord.m_yBeam-=step;this.m_lastNoteOrChord.m_centered=true;}this.m_firstNoteOrChord.m_yBeam=this.m_lastNoteOrChord.m_yBeam+step;}else{this.m_lastNoteOrChord.m_centered=this.m_firstNoteOrChord.m_centered;if(short.value&&!this.m_firstNoteOrChord.m_centered){this.m_firstNoteOrChord.m_yBeam-=step;this.m_firstNoteOrChord.m_centered=true;}this.m_lastNoteOrChord.m_yBeam=this.m_firstNoteOrChord.m_yBeam+step;}}
    else if(place===BEAMPLACE_mixed){if(step<=unit||step>unit*2)step=unit*2;this.CalcMixedBeamPosition(beamInterface,step,unit);}
    this.m_beamSlope=(this.m_lastNoteOrChord.m_x===this.m_firstNoteOrChord.m_x)?0:(this.m_lastNoteOrChord.m_yBeam-this.m_firstNoteOrChord.m_yBeam)/(this.m_lastNoteOrChord.m_x-this.m_firstNoteOrChord.m_x);
    if(stepRef)stepRef.value=step; return this.m_nbNotesOrChords!==2;
  }
  CalcBeamSlopeStep(doc:any,staff:any,beamInterface:BeamDrawingInterface,noteStep:number,shortStepRef?:{value:boolean}):number{
    const unit=doc.GetDrawingUnit(staff.m_drawingStaffSize); let step=4*unit; const dist=this.m_lastNoteOrChord!.m_x-this.m_firstNoteOrChord!.m_x;
    if(this.m_nbNotesOrChords===2){step=unit*2;if(dist<=unit*6){step=Math.trunc(unit/2);if(shortStepRef)shortStepRef.value=true;}}
    else if(this.m_nbNotesOrChords===3){if(dist<=unit*12)step=unit*2;else if(noteStep<=unit*4)step=unit*2;}
    else {if(noteStep<unit*3){step=Math.trunc(unit/2);if(shortStepRef)shortStepRef.value=true;}else if(noteStep<=unit*4)step=unit*2;else if(this.m_nbNotesOrChords===4&&this.m_beamElementCoordRefs[1]?.m_yBeam===this.m_beamElementCoordRefs[2]?.m_yBeam&&((this.m_firstNoteOrChord!.m_yBeam===this.m_beamElementCoordRefs[1].m_yBeam)||(this.m_lastNoteOrChord!.m_yBeam===this.m_beamElementCoordRefs[2].m_yBeam)))step=unit*2;}
    if(shortStepRef?.value&&beamInterface.m_shortestDur>=DURATION_32){step=unit*2;shortStepRef.value=false;} return step;
  }
  CalcMixedBeamPosition(beamInterface:BeamDrawingInterface,step:number,unit:number):void{const [topOffset,bottomOffset]=this.GetVerticalOffset(beamInterface);let center=this.CalcMixedBeamCenterY(step,unit);center+=Math.trunc((beamInterface.m_beamWidthBlack+bottomOffset-topOffset)/2);const up=(this.m_firstNoteOrChord!.m_beamRelativePlace===this.m_lastNoteOrChord!.m_beamRelativePlace)?(this.m_beamSlope>0):(this.m_lastNoteOrChord!.m_beamRelativePlace===BEAMPLACE_below);this.m_firstNoteOrChord!.m_yBeam=up?center-Math.trunc(step/2):center+Math.trunc(step/2);this.m_lastNoteOrChord!.m_yBeam=up?this.m_firstNoteOrChord!.m_yBeam+step:this.m_firstNoteOrChord!.m_yBeam-step;}
  CalcBeamPosition(doc:any,staff:any,beamInterface:BeamDrawingInterface,isHorizontal:boolean):void{for(const c of this.m_beamElementCoordRefs){if(beamInterface.m_drawingPlace===BEAMPLACE_above)c.SetDrawingStemDir(STEMDIRECTION_up,staff,doc,this,beamInterface);else if(beamInterface.m_drawingPlace===BEAMPLACE_below)c.SetDrawingStemDir(STEMDIRECTION_down,staff,doc,this,beamInterface);else{const dir=beamInterface.m_crossStaffContent?(c.m_beamRelativePlace===BEAMPLACE_above?STEMDIRECTION_up:STEMDIRECTION_down):c.GetStemDir();c.SetDrawingStemDir(dir,staff,doc,this,beamInterface);}}if(staff.IsTablature?.()&&staff.IsTabWithStemsOutside?.())return;this.m_beamSlope=0;if(!isHorizontal){const ref={value:0};if(this.CalcBeamSlope(staff,doc,beamInterface,ref))this.CalcAdjustSlope(staff,doc,beamInterface,ref);else this.CalcAdjustPosition(staff,doc,beamInterface);}else this.CalcHorizontalBeam(doc,staff,beamInterface);if(!beamInterface.m_crossStaffContent)this.AdjustBeamToLedgerLines(doc,staff,beamInterface,isHorizontal);}
  CalcAdjustSlope(staff:any,doc:any,beamInterface:BeamDrawingInterface,stepRef:{value:number}):void{
    this.CalcAdjustPosition(staff,doc,beamInterface); const first=this.m_firstNoteOrChord,last=this.m_lastNoteOrChord; if(!first||!last)return; const unit=doc.GetDrawingUnit(staff.m_drawingStaffSize);
    let refLen=0;
    if(beamInterface.m_drawingPlace===BEAMPLACE_above) refLen=this.m_beamSlope>0?(last.m_yBeam-(last.m_closestNote?.GetDrawingY?.()??0)):(first.m_yBeam-(first.m_closestNote?.GetDrawingY?.()??0));
    else if(beamInterface.m_drawingPlace===BEAMPLACE_below) refLen=this.m_beamSlope<0?((last.m_closestNote?.GetDrawingY?.()??0)-last.m_yBeam):((first.m_closestNote?.GetDrawingY?.()??0)-first.m_yBeam);
    refLen-=unit; let lengthen=false;
    for(const c of this.m_beamElementCoordRefs){if(!c.m_stem||!c.m_closestNote)continue;const len=Math.abs(c.m_yBeam-c.m_closestNote.GetDrawingY());if(len<refLen){lengthen=true;break;}else if(((c!==last)||(c!==first))&&(c.m_dur>DURATION_8)){const durLen=len-.9*unit;if(durLen<refLen){lengthen=true;break;}}}
    if(!lengthen)return;
    if(stepRef.value>=4*unit){stepRef.value=2*unit;if(beamInterface.m_drawingPlace===BEAMPLACE_above){if(this.m_beamSlope>0)first.m_yBeam+=2*unit;else last.m_yBeam+=2*unit;}else{if(this.m_beamSlope<0)first.m_yBeam-=2*unit;else last.m_yBeam-=2*unit;}this.m_beamSlope=(last.m_yBeam-first.m_yBeam)/(last.m_x-first.m_x);this.CalcAdjustPosition(staff,doc,beamInterface);this.CalcAdjustSlope(staff,doc,beamInterface,stepRef);}
    else{if(beamInterface.m_drawingPlace===BEAMPLACE_above){if(this.m_beamSlope>0)first.m_yBeam=last.m_yBeam;else last.m_yBeam=first.m_yBeam;}else if(this.m_beamSlope<0)first.m_yBeam=last.m_yBeam;else last.m_yBeam=first.m_yBeam;this.m_beamSlope=(last.m_yBeam-first.m_yBeam)/(last.m_x-first.m_x);this.CalcAdjustPosition(staff,doc,beamInterface);}
  }
  CalcAdjustPosition(staff:any,doc:any,beamInterface:BeamDrawingInterface):void{const top=staff.GetDrawingY(),height=doc.GetDrawingStaffSize(staff.m_drawingStaffSize),unit=doc.GetDrawingUnit(staff.m_drawingStaffSize);if(!this.m_firstNoteOrChord||!this.m_lastNoteOrChord)return;let adjust=0;const start=this.m_firstNoteOrChord.m_yBeam,end=this.m_lastNoteOrChord.m_yBeam,h=Math.abs(end-start);if(start<=top&&start>=top-height){const pos=Math.abs((top-start)%(unit*2));if(beamInterface.m_drawingPlace===BEAMPLACE_above){if((pos===unit&&this.m_beamSlope>0&&h!==unit)||(pos===.5*unit&&this.m_beamSlope<0))adjust=-Math.trunc(.5*unit);}else if(beamInterface.m_drawingPlace===BEAMPLACE_below){if((pos===unit&&this.m_beamSlope<0&&h!==unit)||(pos===1.5*unit&&this.m_beamSlope>0))adjust=Math.trunc(.5*unit);}}this.m_firstNoteOrChord.m_yBeam+=adjust;this.CalcSetValues();}
  CalcBeamPlace(layer: any, beamInterface: BeamDrawingInterface, place: number): void {
    if (place !== BEAMPLACE_NONE) {
      beamInterface.m_drawingPlace = place;
    }
    // Default with cross-staff
    else if (beamInterface.m_hasMultipleStemDir) {
      beamInterface.m_drawingPlace = BEAMPLACE_mixed;
    }
    // Now look at the stem direction of the notes within the beam
    else if (beamInterface.m_notesStemDir === STEMDIRECTION_up) {
      beamInterface.m_drawingPlace = BEAMPLACE_above;
    }
    else if (beamInterface.m_notesStemDir === STEMDIRECTION_down) {
      beamInterface.m_drawingPlace = BEAMPLACE_below;
    }
    else if (beamInterface.m_crossStaffContent) {
      beamInterface.m_drawingPlace = BEAMPLACE_mixed;
    }
    // Look at the layer direction or, finally, at the note position
    else {
      let layerStemDir = STEMDIRECTION_NONE;
      // Do not look at the layer context when notes from different layers are stemmed together
      if (!this.StemSameas()) {
        layerStemDir = typeof layer?.GetDrawingStemDirForCoords === 'function'
          ? layer.GetDrawingStemDirForCoords(this.m_beamElementCoordRefs)
          : (layer?.GetDrawingStemDir?.() ?? STEMDIRECTION_NONE);
      }
      // Layer direction ?
      if (layerStemDir === STEMDIRECTION_NONE) {
        if (this.m_ledgerLinesBelow !== this.m_ledgerLinesAbove) {
          beamInterface.m_drawingPlace = (this.m_ledgerLinesBelow > this.m_ledgerLinesAbove) ? BEAMPLACE_above : BEAMPLACE_below;
        } else {
          beamInterface.m_drawingPlace = this.m_weightedPlace;
        }
      } else {
        beamInterface.m_drawingPlace = (layerStemDir === STEMDIRECTION_up) ? BEAMPLACE_above : BEAMPLACE_below;
      }
    }

    if (this.StemSameasIsUnset()) {
      this.UpdateSameasRoles(beamInterface.m_drawingPlace);
    }
    this.CalcNoteHeadShiftForStemSameas(layer?.GetStemSameasBeam?.() ?? null, beamInterface.m_drawingPlace);
  }
  CalcBeamPlaceTab(layer:any, staff:any, doc:any, beamInterface:BeamDrawingInterface, place:number):void{
    // C++ BeamSegment::CalcBeamPlaceTab
    if(place!==BEAMPLACE_NONE){
      beamInterface.m_drawingPlace=(place===BEAMPLACE_below)?BEAMPLACE_below:BEAMPLACE_above;
    }
    else{
      // The layerStemDir can be none (single layer), up (1st layer), or down (2nd layer).
      // It is put above by default with tablature with a single layer.
      const layerStemDir=layer?.GetDrawingStemDir?.()??STEMDIRECTION_NONE;
      beamInterface.m_drawingPlace=(layerStemDir===STEMDIRECTION_down)?BEAMPLACE_below:BEAMPLACE_above;
    }
    if(beamInterface.m_drawingPlace===BEAMPLACE_below&&staff?.IsTabWithStemsOutside?.()){
      for(const coord of this.m_beamElementCoordRefs){
        if(!coord.m_element||!coord.m_element.Is?.(ClassId.TABGRP)) continue;
        const tabDurSym=coord.m_element.FindDescendantByType?.(ClassId.TABDURSYM);
        if(tabDurSym) tabDurSym.AdjustDrawingYRel?.(staff,doc);
      }
    }
  }
  CalcBeamStemLength(staff:any,place:number,isHorizontal:boolean):void{const r=this.CalcStemDefiningNote(staff,place);const noteLoc=r[0],noteDur=r[1],preferredDur=r[2];const globalDir=place===BEAMPLACE_below?STEMDIRECTION_down:STEMDIRECTION_up;for(const c of this.m_beamElementCoordRefs){const dir=place!==BEAMPLACE_mixed?globalDir:(c.m_beamRelativePlace===BEAMPLACE_below?STEMDIRECTION_down:STEMDIRECTION_up);if(c.m_tabDurSym){this.m_uniformStemLength=c.CalculateStemLengthTab(staff,dir);continue;}if(!c.m_closestNote)continue;if(c.m_dur<noteDur&&!c.m_element?.GetFirstAncestor?.(ClassId.FTREM))continue;const dur=preferredDur!==DURATION_NONE?preferredDur:c.m_dur;const len=c.CalculateStemLength(staff,dir,isHorizontal,dur);if(c.m_closestNote.GetDrawingLoc?.()===noteLoc)this.m_uniformStemLength=len;}for(const c of this.m_beamElementCoordRefs)if(c.m_element?.IsGraceNote?.()){this.m_uniformStemLength=Math.trunc(this.m_uniformStemLength*.75);break;}}
  CalcMixedBeamCenterY(step:number,unit:number):number{const first=this.m_firstNoteOrChord,last=this.m_lastNoteOrChord;if(!first||!last)return 0;const dist=last.m_x-first.m_x;const up=(first.m_beamRelativePlace===last.m_beamRelativePlace)?this.m_beamSlope>0:last.m_beamRelativePlace===BEAMPLACE_below;const sign=up?1:-1;const targetSlope=dist?sign*step/dist:0;let highest=VRV_UNSET,lowest=VRV_UNSET;for(const c of this.m_beamElementCoordRefs){const y=Math.trunc(c.m_yBeam-targetSlope*(c.m_x-first.m_x));if(c.m_beamRelativePlace===BEAMPLACE_above)highest=highest===VRV_UNSET?y:Math.max(highest,y);if(c.m_beamRelativePlace===BEAMPLACE_below)lowest=lowest===VRV_UNSET?y:Math.min(lowest,y);}let center=Math.trunc((first.m_yBeam+last.m_yBeam)/2);if(highest!==VRV_UNSET&&lowest!==VRV_UNSET)center=Math.trunc(Math.trunc((highest+lowest)/2)+targetSlope*dist/2);center+=(first.m_yBeam-center)%Math.trunc(unit/2);return center;}
  CalcStemDefiningNote(staff:any,place:number):[number,number,number]{let shortestDuration=DURATION_4,shortestLoc=VRV_UNSET,relevantDuration=DURATION_4,relevantLoc=VRV_UNSET;const globalDir=place===BEAMPLACE_below?STEMDIRECTION_down:STEMDIRECTION_up;for(const c of this.m_beamElementCoordRefs){const dir=place!==BEAMPLACE_mixed?globalDir:(c.m_beamRelativePlace===BEAMPLACE_below?STEMDIRECTION_down:STEMDIRECTION_up);c.SetClosestNoteOrTabDurSym(dir,!!staff.IsTabWithStemsOutside?.());if(!c.m_closestNote)continue;const loc=c.m_closestNote.GetDrawingLoc();if(relevantLoc===VRV_UNSET){relevantLoc=loc;shortestLoc=loc;relevantDuration=c.m_dur;shortestDuration=relevantDuration;continue;}if(place===BEAMPLACE_above&&loc>relevantLoc){relevantLoc=loc;relevantDuration=c.m_dur;}else if(place===BEAMPLACE_below&&loc<relevantLoc){relevantLoc=loc;relevantDuration=c.m_dur;}if(c.m_dur>shortestDuration){shortestDuration=c.m_dur;shortestLoc=loc;}else if(c.m_dur===shortestDuration&&((dir===STEMDIRECTION_up&&loc>shortestLoc)||(dir===STEMDIRECTION_down&&loc<shortestLoc))){shortestLoc=loc;}}let adjusted=DURATION_NONE;if((shortestDuration-relevantDuration)>(Math.abs(relevantLoc-shortestLoc)+1)){relevantLoc=shortestLoc;relevantDuration=shortestDuration;}else if((shortestDuration-relevantDuration)===(Math.abs(relevantLoc-shortestLoc)+1)&&((globalDir===STEMDIRECTION_up&&relevantLoc>4)||(globalDir===STEMDIRECTION_down&&relevantLoc<4))){relevantLoc=shortestLoc;relevantDuration=shortestDuration;}else if((shortestDuration-relevantDuration)===Math.abs(relevantLoc-shortestLoc)){adjusted=Math.trunc((relevantDuration+shortestDuration)/2);}return[relevantLoc,relevantDuration,adjusted];}
  CalcHorizontalBeam(doc:any,staff:any,beamInterface:BeamDrawingInterface):void{if(beamInterface.m_drawingPlace===BEAMPLACE_mixed){this.CalcMixedBeamPosition(beamInterface,0,doc.GetDrawingUnit(staff.m_drawingStaffSize));}else{let maxLength=beamInterface.m_drawingPlace===BEAMPLACE_above?VRV_UNSET:-VRV_UNSET;for(const c of this.m_beamElementCoordRefs){if(!c.m_stem)continue;if(beamInterface.m_drawingPlace===BEAMPLACE_above)maxLength=Math.max(maxLength,c.m_yBeam);else if(beamInterface.m_drawingPlace===BEAMPLACE_below)maxLength=Math.min(maxLength,c.m_yBeam);}if(Math.abs(maxLength)!==Math.abs(VRV_UNSET))this.m_beamElementCoordRefs[0].m_yBeam=maxLength;}this.CalcAdjustPosition(staff,doc,beamInterface);this.CalcSetValues();}
  CalcMixedBeamPlace(staff: any): void {
    // C++ BeamSegment::CalcMixedBeamPlace
    const currentStaffN=staff?.GetN?.()??0;
    // First check for an element with a cross-staff pointer
    const it=this.m_beamElementCoordRefs.find(c=>!!c.m_element?.m_crossStaff);
    // Chord cross-staff extremes fallback when no explicit cross-staff pointer
    let chordAbove=false;
    if(!it){
      const iter=this.m_beamElementCoordRefs.find(c=>c.m_element?.HasCrossStaff?.());
      if(iter&&iter.m_element.Is?.(ClassId.CHORD)){
        const staffAbove={value:null as any}; const staffBelow={value:null as any};
        iter.m_element.GetCrossStaffExtremes?.(staffAbove,staffBelow);
        // change beam direction in case if cross-staff note is located in staff above
        if(staffAbove.value) chordAbove=true;
        // otherwise just leave default value
      }
    }
    let beamPlaceBelow=false;
    if(it){
      const crossStaffN=it.m_element.m_crossStaff.GetN?.()??0;
      beamPlaceBelow=currentStaffN<=crossStaffN;
    }
    else{
      beamPlaceBelow=chordAbove;
    }
    for(const coord of this.m_beamElementCoordRefs){
      if(it){
        if(!coord.m_element?.m_crossStaff){
          coord.m_beamRelativePlace=beamPlaceBelow?BEAMPLACE_below:BEAMPLACE_above;
        }
        else{
          coord.m_beamRelativePlace=beamPlaceBelow?BEAMPLACE_above:BEAMPLACE_below;
        }
      }
      else if(coord.GetStemDir()!==STEMDIRECTION_NONE){
        coord.m_beamRelativePlace=(STEMDIRECTION_up===coord.GetStemDir())?BEAMPLACE_above:BEAMPLACE_below;
      }
      else{
        coord.m_beamRelativePlace=beamPlaceBelow?BEAMPLACE_below:BEAMPLACE_above;
      }
    }
  }
  CalcPartialFlagPlace(): void {
    // C++ BeamSegment::CalcPartialFlagPlace: start from note shorter than DURATION_8.
    // `refs.length` plays the role of the C++ end() iterator sentinel.
    const refs=this.m_beamElementCoordRefs;
    const END=refs.length;
    let start=END;
    for(let j=0;j<END;j++) if(refs[j].m_dur>=DURATION_16){ start=j; break; }
    if(start===END) return;
    while(start!==END){
      let subdivision=start;
      let place=refs[start].m_beamRelativePlace;
      let isProcessed=false;
      let breakSec=false;
      // Process beam as a collection of subdivisions; a subdivision extends as long
      // as we do not encounter an 8th note or a direction change.
      while(true){
        if(breakSec) break;
        // Find first note longer than 8th or first note that is cross-staff (RESTs skipped)
        let found=END;
        for(let j=subdivision;j<END;j++){
          const c=refs[j];
          if(c.m_element?.Is?.(ClassId.REST)) continue;
          if(c.m_beamRelativePlace!==place||c.m_dur<=DURATION_8||c.m_breaksec){ found=j; break; }
        }
        subdivision=found;
        if(found===END||refs[found].m_dur<=DURATION_8) break;
        if(refs[found].m_breaksec) breakSec=true;
        if(found===END-1){ subdivision=END; isProcessed=true; break; }
        // Proper cross-staff case: change drawing place to that of the new direction
        place=refs[found].m_beamRelativePlace;
      }
      for(let i=start;i<subdivision;i++) refs[i].m_partialFlagPlace=((place%2)+1) as number;
      if(isProcessed) break;
      if(subdivision!==END) subdivision++;
      start=subdivision;
    }
  }
  CalcSetValues(): void { if (!this.m_firstNoteOrChord) return; const x = this.m_firstNoteOrChord.m_x, y = this.m_firstNoteOrChord.m_yBeam; for (const c of this.m_beamElementCoordRefs) c.m_yBeam = Math.trunc(y + this.m_beamSlope * (c.m_x - x)); }
  GetAdjacentElementsDuration(elementX: number): number { if (!this.m_beamElementCoordRefs.length || elementX < this.m_beamElementCoordRefs[0].m_x || elementX > this.m_beamElementCoordRefs.at(-1)!.m_x) return DURATION_8; for (let i=0;i<this.m_beamElementCoordRefs.length-1;i++){const a=this.m_beamElementCoordRefs[i],b=this.m_beamElementCoordRefs[i+1];if(a.m_x<elementX&&b.m_x>elementX)return Math.min(a.m_dur,b.m_dur);} return DURATION_8; }
  GetStartingX(): number { return this.m_beamElementCoordRefs[0]?.m_x ?? 0; }
  GetStartingY(): number { return this.m_beamElementCoordRefs[0]?.m_yBeam ?? 0; }
  InitSameasRoles(sameasBeam: Beam | null, initialPlaceRef?: {value:number}): void { if (!sameasBeam) return; if (this.m_stemSameasRole===SAMEAS_NONE){ this.m_stemSameasReverseRole={value:sameasBeam.m_beamSegment.m_stemSameasRole}; this.m_stemSameasRole=SAMEAS_UNSET; this.m_stemSameasReverseRole.value=SAMEAS_UNSET; } else if (!this.m_stemSameasReverseRole && initialPlaceRef) initialPlaceRef.value=this.StemSameasIsPrimary()?BEAMPLACE_below:BEAMPLACE_above; }
  UpdateSameasRoles(place: number): void { if (!this.m_stemSameasReverseRole || !this.StemSameasIsUnset()) return; if (place===BEAMPLACE_above){this.m_stemSameasRole=SAMEAS_PRIMARY;this.m_stemSameasReverseRole.value=SAMEAS_SECONDARY;}else{this.m_stemSameasRole=SAMEAS_SECONDARY;this.m_stemSameasReverseRole.value=SAMEAS_PRIMARY;} }
  CalcNoteHeadShiftForStemSameas(sameasBeam: Beam | null, place: number): void { if (!sameasBeam || this.m_stemSameasReverseRole || this.StemSameasIsUnset()) return; const n=Math.min(this.m_beamElementCoordRefs.length,sameasBeam.m_beamSegment.m_beamElementCoordRefs.length); const dir=place===BEAMPLACE_above?STEMDIRECTION_up:STEMDIRECTION_down; for(let i=0;i<n;i++){const a=this.m_beamElementCoordRefs[i].m_element,b=sameasBeam.m_beamSegment.m_beamElementCoordRefs[i].m_element;if(a?.Is?.(ClassId.NOTE)&&b?.Is?.(ClassId.NOTE))a.CalcNoteHeadShiftForSameasNote?.(b,dir);} }
  RequestStaffSpace(doc: any, beamInterface: BeamDrawingInterface): void { if (beamInterface.m_drawingPlace!==BEAMPLACE_mixed || !beamInterface.m_beamStaff || !beamInterface.m_crossStaffContent) return; const unit=doc.GetDrawingUnit((beamInterface.m_beamStaff as any).m_drawingStaffSize);const min=(1+(doc.GetOptions?.().m_beamMixedStemMin?.GetValue?.()??0))*unit;const [a,b]=this.GetMinimalStemLength(beamInterface);const above=(beamInterface.m_beamStaff as any).GetN()<(beamInterface.m_crossStaffContent as any).GetN()?beamInterface.m_beamStaff.GetAlignment():beamInterface.m_crossStaffContent.GetAlignment();const below=(beamInterface.m_beamStaff as any).GetN()<(beamInterface.m_crossStaffContent as any).GetN()?beamInterface.m_crossStaffContent.GetAlignment():beamInterface.m_beamStaff.GetAlignment();if(a<min)above?.SetRequestedSpaceBelow?.(min-a);if(b<min)below?.SetRequestedSpaceAbove?.(min-b); }
}

export class BeamSpanSegment extends BeamSegment {
  private m_measure:any=null; private m_staff:any=null; private m_layer:any=null; private m_begin:BeamElementCoord|null=null; private m_end:BeamElementCoord|null=null; private m_spanningType=SPANNING_START_END;
  GetMeasure():any{return this.m_measure;} SetMeasure(v:any):void{this.m_measure=v;} GetStaff():any{return this.m_staff;} SetStaff(v:any):void{this.m_staff=v;} GetLayer():any{return this.m_layer;} SetLayer(v:any):void{this.m_layer=v;} GetBeginCoord():BeamElementCoord|null{return this.m_begin;} SetBeginCoord(v:BeamElementCoord|null):void{this.m_begin=v;} GetEndCoord():BeamElementCoord|null{return this.m_end;} SetEndCoord(v:BeamElementCoord|null):void{this.m_end=v;}
  SetSpanningType(systemIndex:number, systemCount:number):void{this.m_spanningType=systemIndex===0?SPANNING_START:(systemCount-1)===systemIndex?SPANNING_END:SPANNING_MIDDLE;}
  GetSpanningType():number{return this.m_spanningType;}
  AppendSpanningCoordinates(measure:any):void{if(this.m_spanningType===SPANNING_START_END||!this.m_beamElementCoordRefs.length)return;const rightSide=measure.GetRightBarLine().GetDrawingX();const front=this.m_beamElementCoordRefs[0],back=this.m_beamElementCoordRefs.at(-1)!;const slope=this.m_beamElementCoordRefs.length>1?(back.m_yBeam-front.m_yBeam)/(back.m_x-front.m_x):0;if(this.m_spanningType===SPANNING_START||this.m_spanningType===SPANNING_MIDDLE){const right=new BeamElementCoord(back);const d=rightSide-back.m_x;right.m_x=rightSide;right.m_yBeam=Math.floor(right.m_yBeam+d*slope);this.m_beamElementCoordRefs.push(right);}if(this.m_spanningType===SPANNING_END||this.m_spanningType===SPANNING_MIDDLE){const left=new BeamElementCoord(front);const offset=this.m_beamElementCoordRefs.length>1?Math.floor((back.m_x-front.m_x)/(2*(this.m_beamElementCoordRefs.length-1))):270;left.m_x-=offset;left.m_yBeam=Math.floor(left.m_yBeam-offset*slope);this.m_beamElementCoordRefs.unshift(left);}}
}

/**
 * C++ `Beam` inherits `ObjectListInterface` and overrides `FilterList`; TypeScript models this with
 * a subclass whose `GetInterfaceOwner()` resolves back to the beam.
 */
class BeamListInterface extends ObjectListInterface {
  protected override FilterList(childList: VrvObject[]): void {
    (this.GetInterfaceOwner() as unknown as Beam).FilterList(childList);
  }
}

export class Beam extends LayerElement  {
  private objectList!: BeamListInterface;
  private ensureObjectList(): void {
    if (!this.objectList) { this.objectList = new BeamListInterface(); this.objectList.SetInterfaceOwner(this as unknown as VrvObject); }
  }
  public readonly m_beamSegment=new BeamSegment();
  public m_stemSameas:Beam|null=null;
  public m_changingDur=false; public m_beamHasChord=false; public m_hasMultipleStemDir=false; public m_cueSize=false; public m_crossStaffContent:any=null; public m_crossStaffRel=0; public m_isSpanningElement=false; public m_shortestDur=0; public m_notesStemDir=0; public m_drawingPlace=0; public m_beamStaff:any=null; public m_beamWidth=0; public m_beamWidthBlack=0; public m_beamWidthWhite=0; public m_fractionSize=100; public m_beamElementCoords:ArrayOfBeamElementCoords=[];
  private beamedWith=new InstBeamedWith(); private beamRend=new InstBeamRend(); private color=new InstColor(); private cue=new InstCue();
  public constructor(){
    super(ClassId.BEAM);
    // C++ Beam::Beam (beam.cpp:1605ff): register att classes for MEI I/O.
    this.RegisterAttClass(ATT_CLASS_IDS.ATT_BEAMEDWITH);
    this.RegisterAttClass(ATT_CLASS_IDS.ATT_BEAMREND);
    this.RegisterAttClass(ATT_CLASS_IDS.ATT_COLOR);
    this.RegisterAttClass(ATT_CLASS_IDS.ATT_CUE);
    this.Reset();
  }
  public override Reset():void{super.Reset();this.m_beamSegment?.Reset();this.m_beamElementCoords=[];this.m_changingDur=false;this.m_beamHasChord=false;this.m_hasMultipleStemDir=false;this.m_cueSize=false;this.m_crossStaffContent=null;this.m_shortestDur=0;this.m_notesStemDir=0;this.m_drawingPlace=0;this.m_beamStaff=null;this.m_beamWidth=this.m_beamWidthBlack=this.m_beamWidthWhite=0;this.m_stemSameas=null;this.beamedWith?.ResetBeamedWith?.();this.beamRend?.ResetBeamRend?.();this.color?.ResetColor?.();this.cue?.ResetCue?.();}
  public override GetClassName():string{return 'beam';}
  public Clone():Beam{const b=new Beam();Object.assign(b,this);b.ResetParent();b.m_beamElementCoords=[...this.m_beamElementCoords];return b;}
  public CloneReset():void{this.m_beamElementCoords=[];}
  public GetNoteCount():number{return this.GetChildCount?.(ClassId.NOTE)??0;}
  public IsSupportedChild(id:any):boolean{return [ClassId.BEAM,ClassId.BTREM,ClassId.CHORD,ClassId.CLEF,ClassId.FTREM,ClassId.GRACEGRP,ClassId.NOTE,ClassId.REST,ClassId.SPACE,ClassId.TABGRP,ClassId.TUPLET].includes(id);}
  public FilterList(childList:any[]):void{
    // C++ Beam::FilterList: keep only layer elements with a duration interface;
    // tab beams keep only TABGRP; grace notes dropped unless first note is grace;
    // chord tones dropped.
    const isTabBeam=this.IsTabBeam(); let firstNoteGrace=false;
    for(let i=0;i<childList.length;){
      const e=childList[i];
      if(!e.IsLayerElement?.()){ childList.splice(i,1); continue; }
      if(!e.HasInterface?.(InterfaceId.INTERFACE_DURATION)){ childList.splice(i,1); continue; }
      if(isTabBeam){ if(!e.Is?.(ClassId.TABGRP)) childList.splice(i,1); else i++; continue; }
      if(i===0&&e.IsGraceNote?.()) firstNoteGrace=true;
      if(!firstNoteGrace&&e.IsGraceNote?.()){ childList.splice(i,1); continue; }
      if(e.Is?.(ClassId.NOTE)&&e.IsChordTone?.()){ childList.splice(i,1); continue; }
      i++;
    }
  }
  public GetElementCoords():ArrayOfBeamElementCoords{return this.m_beamElementCoords;}
  public IsTabBeam():boolean{return !!this.FindDescendantByType?.(ClassId.TABGRP);}
  public HasStemSameasBeam():boolean{return !!this.m_stemSameas;} public GetStemSameasBeam():Beam|null{return this.m_stemSameas;} public SetStemSameasBeam(v:Beam|null):void{this.m_stemSameas=v;}
  public GetAdditionalBeamCount():[number,number]{let top=DURATION_8,bottom=DURATION_8;for(const c of this.m_beamElementCoords){if(c.m_partialFlagPlace===BEAMPLACE_above)top=durationMax(top,c.m_dur);else if(c.m_partialFlagPlace===BEAMPLACE_below)bottom=durationMax(bottom,c.m_dur);}return[top-DURATION_8,bottom-DURATION_8];}
  public GetBeamPartDuration(x:number|any,includeRests=true):number{const xx=typeof x==='number'?x:x?.GetDrawingX?.()??0;const a=this.m_beamSegment.m_beamElementCoordRefs;const i=a.findIndex(c=>xx<c.m_x&&(!c.m_element?.Is?.(ClassId.REST)||includeRests));if(i<0)return DURATION_8;if(i===0)return a[i].m_dur;for(let j=i-1;j>=0;j--)if(!a[j].m_element?.Is?.(ClassId.REST)||includeRests)return Math.min(a[i].m_dur,a[j].m_dur);return a[i].m_dur;}
  public GetStemmedDrawingInterface():any{return this as any;}
  public Accept(functor:any):FunctorCode{return functor.VisitBeam?.(this)??FunctorCode.FUNCTOR_CONTINUE;} public AcceptEnd(functor:any):FunctorCode{return functor.VisitBeamEnd?.(this)??FunctorCode.FUNCTOR_CONTINUE;}
  public GetBeamDrawingInterface():BeamDrawingInterface{return this as any;}
  // C++ Beam inherits BeamDrawingInterface; the implementation is mixed onto this class and is
  // offset by these ObjectListInterface forwarders (GetPosition/IsFirstIn/IsLastIn need GetList).
  public GetList():VrvObject[]{this.ensureObjectList();return this.objectList.GetList();}
  public HasEmptyList():boolean{this.ensureObjectList();return this.objectList.HasEmptyList();}
  public GetListSize():number{this.ensureObjectList();return this.objectList.GetListSize();}
  public GetListFront():VrvObject{this.ensureObjectList();return this.objectList.GetListFront();}
  public GetListBack():VrvObject{this.ensureObjectList();return this.objectList.GetListBack();}
  public GetListIndex(element:VrvObject):number{this.ensureObjectList();return this.objectList.GetListIndex(element);}
  public GetListFirst(startFrom:VrvObject,classId?:ClassId):VrvObject|null{this.ensureObjectList();return this.objectList.GetListFirst(startFrom,classId??ClassId.UNSPECIFIED);}
  public GetListFirstBackward(startFrom:VrvObject,classId?:ClassId):VrvObject|null{this.ensureObjectList();return this.objectList.GetListFirstBackward(startFrom,classId??ClassId.UNSPECIFIED);}
  public GetListPrevious(element:VrvObject):VrvObject|null{this.ensureObjectList();return this.objectList.GetListPrevious(element);}
  public GetListNext(element:VrvObject):VrvObject|null{this.ensureObjectList();return this.objectList.GetListNext(element);}
  public InterfaceResetData(_functor:any):FunctorCode{return FunctorCode.FUNCTOR_CONTINUE;}
  // Attribute mixin forwarding.
  ResetBeamedWith():void{this.beamedWith?.ResetBeamedWith();} SetBeamWith(v:any):void{this.beamedWith.SetBeamWith(v);} GetBeamWith():any{return this.beamedWith.GetBeamWith();} HasBeamWith():boolean{return this.beamedWith.HasBeamWith();}
  ResetBeamRend():void{this.beamRend?.ResetBeamRend();} SetForm(v:any):void{this.beamRend.SetForm(v);} GetForm():any{return this.beamRend.GetForm();} HasForm():boolean{return this.beamRend.HasForm();} SetPlace(v:any):void{this.beamRend.SetPlace(v);} GetPlace():any{return this.beamRend.GetPlace();} HasPlace():boolean{return this.beamRend.HasPlace();} SetSlash(v:any):void{this.beamRend.SetSlash(v);} GetSlash():any{return this.beamRend.GetSlash();} HasSlash():boolean{return this.beamRend.HasSlash();} SetSlope(v:number):void{this.beamRend.SetSlope(v);} GetSlope():number{return this.beamRend.GetSlope();} HasSlope():boolean{return this.beamRend.HasSlope();}
  ResetColor():void{this.color?.ResetColor();} SetColor(v:any):void{this.color.SetColor(v);} GetColor():any{return this.color.GetColor();} HasColor():boolean{return this.color.HasColor();}
  ResetCue():void{this.cue?.ResetCue();} SetCue(v:any):void{this.cue.SetCue(v);} GetCue():any{return this.cue.GetCue();} HasCue():boolean{return this.cue.HasCue();}
}

export class BeamElementCoord {
  public m_x=0; public m_yBeam=0; public m_dur=0; public m_breaksec=0; public m_overlapMargin=0; public m_centered=false; public m_beamRelativePlace=BEAMPLACE_NONE; public m_partialFlags:number[]=new Array(MAX_DURATION_PARTIALS).fill(PARTIAL_NONE); public m_partialFlagPlace=BEAMPLACE_NONE; public m_element:any=null; public m_closestNote:any=null; public m_tabDurSym:any=null; public m_stem:any=null;
  constructor(copy?:BeamElementCoord){if(copy)Object.assign(this,copy,{m_partialFlags:[...copy.m_partialFlags]});}
  GetStemDir():number{return this.m_stem?.GetDir?.()??this.m_element?.GetStemDir?.()??STEMDIRECTION_NONE;}
  GetStemHolderInterface():StemmedDrawingInterface|null{if(!this.m_element||!this.m_element.IsAnyOf?.([ClassId.CHORD,ClassId.NOTE,ClassId.TABGRP]))return null;if(this.m_element.IsAnyOf([ClassId.CHORD,ClassId.NOTE]))return this.m_element.GetStemmedDrawingInterface?.()??null;const t=this.m_element.FindDescendantByType?.(ClassId.TABDURSYM);return t?.GetStemmedDrawingInterface?.()??null;}
  SetDrawingStemDir(stemDir:number,staff:any,doc:any,segment:BeamSegment,iface:BeamDrawingInterface):void{let stemLen=segment.m_uniformStemLength;if(iface.m_crossStaffContent||iface.m_drawingPlace===BEAMPLACE_mixed){if((stemDir===STEMDIRECTION_up&&stemLen<0)||(stemDir===STEMDIRECTION_down&&stemLen>0))stemLen*=-1;}this.m_centered=!!(segment.m_uniformStemLength%2)||(!!this.m_element?.IsGraceNote?.());if(this.m_element?.IsAnyOf?.([ClassId.REST,ClassId.SPACE])){this.m_x+=this.m_element.GetDrawingRadius?.(doc)??0;this.m_yBeam=this.m_element.GetDrawingY();this.m_yBeam+=Math.trunc(stemLen*(doc.GetDrawingUnit(staff.m_drawingStaffSize))/2);return;}const stemInterface=this.GetStemHolderInterface();if(!stemInterface)return;this.m_stem=stemInterface.GetDrawingStem?.();this.m_stem?.SetDrawingStemDir?.(stemDir);this.m_yBeam=this.m_element.GetDrawingY();if(stemDir===STEMDIRECTION_up){this.m_x+=stemInterface.GetStemUpSE(doc,staff.m_drawingStaffSize,iface.m_cueSize).x;this.m_x-=Math.trunc(doc.GetDrawingStemWidth(staff.m_drawingStaffSize)/2);}else{this.m_x+=stemInterface.GetStemDownNW(doc,staff.m_drawingStaffSize,iface.m_cueSize).x;this.m_x+=Math.trunc(doc.GetDrawingStemWidth(staff.m_drawingStaffSize)/2);}if(this.m_tabDurSym&&!this.m_closestNote){this.m_yBeam=this.m_tabDurSym.GetDrawingY();this.m_yBeam+=Math.trunc(stemLen*doc.GetDrawingUnit(staff.m_drawingStaffSize)/2);return;}if(!this.m_closestNote)return;if(!iface.m_cueSize&&(this.m_element.IsGraceNote?.()||this.m_element.GetDrawingCueSize?.())&&!this.m_element.GetFirstAncestor?.(ClassId.CHORD)&&stemDir===STEMDIRECTION_up){this.m_x-=Math.trunc((1/(doc.GetCueScaling?.()??1)-1)*2*(this.m_element.GetDrawingRadius?.(doc)??0));}this.m_yBeam=this.m_closestNote.GetDrawingY()+Math.trunc(stemLen*doc.GetDrawingUnit(staff.m_drawingStaffSize)/2);if(this.m_element.IsGraceNote?.())return;if(!iface.m_isSpanningElement&&!iface.m_crossStaffContent&&iface.m_drawingPlace!==BEAMPLACE_mixed){if((stemDir===STEMDIRECTION_up&&this.m_yBeam<=segment.m_verticalCenter)||(stemDir===STEMDIRECTION_down&&segment.m_verticalCenter<=this.m_yBeam)){this.m_yBeam=segment.m_verticalCenter;this.m_centered=false;}}this.m_yBeam+=this.m_overlapMargin;}
  SetClosestNoteOrTabDurSym(stemDir:number,outsideStaff:boolean):void{this.m_closestNote=null;if(this.m_element?.Is?.(ClassId.NOTE))this.m_closestNote=this.m_element;else if(this.m_element?.Is?.(ClassId.CHORD))this.m_closestNote=stemDir===STEMDIRECTION_up?this.m_element.GetTopNote?.():this.m_element.GetBottomNote?.();else if(this.m_element?.Is?.(ClassId.TABGRP)){this.m_tabDurSym=this.m_element.FindDescendantByType?.(ClassId.TABDURSYM)??null;if(!outsideStaff)this.m_closestNote=stemDir===STEMDIRECTION_up?this.m_element.GetTopNote?.():this.m_element.GetBottomNote?.();}}
  CalculateStemLength(staff:any,stemDir:number,isHorizontal:boolean,preferredDur:number):number{if(!this.m_closestNote)return 0;const onSpace=!!(this.m_closestNote.GetDrawingLoc?.()%2);let extend=onSpace;const standard=STANDARD_STEMLENGTH*2;const stemLen=Math.trunc((this.m_closestNote.CalcStemLenInThirdUnits?.(staff,stemDir)??standard)*2/3);if(stemLen!==standard)extend=false;const bias=stemDir===STEMDIRECTION_up?1:-1;let len=bias;if(preferredDur===DURATION_8)len*=stemLen!==standard?stemLen:((onSpace||!isHorizontal)?14:13);else{const odd=extend||!isHorizontal;switch(this.m_dur){case DURATION_16:len*=odd?14:13;break;case DURATION_32:len*=odd?18:16;break;case DURATION_64:len*=odd?22:20;break;case DURATION_128:len*=odd?26:24;break;case DURATION_256:len*=odd?30:28;break;case DURATION_512:len*=odd?34:32;break;case DURATION_1024:len*=odd?38:36;break;default:len*=14;}}return len+this.CalculateStemModAdjustment(len,bias);}
  CalculateStemLengthTab(staff:any,stemDir:number):number{return !this.m_tabDurSym?0:(this.m_tabDurSym.CalcStemLenInThirdUnits?.(staff,stemDir)??0)*2/3*(stemDir===STEMDIRECTION_up?1:-1);}
  CalculateStemModAdjustment(stemLength:number,directionBias:number):number{let slash=0;if(this.m_element?.Is?.(ClassId.NOTE)){const s=this.m_closestNote?.GetStemMod?.()??STEMMODIFIER_sprech;if(s<STEMMODIFIER_sprech)slash=s-1;}else if(this.m_element?.Is?.(ClassId.CHORD)){const s=this.m_element.GetStemMod?.()??STEMMODIFIER_sprech;if(s<STEMMODIFIER_sprech)slash=s-1;}const units=Math.abs(Math.trunc(stemLength/2));return units-3<slash?directionBias*(3+slash-units)*4:0;}
  UpdateStemLength(stemmedInterface:any,y1:number,y2:number,stemAdjust:number,inMixedBeam:boolean):void{const stem=stemmedInterface.GetDrawingStem?.();if(!stem)return;stem.SetDrawingXRel?.(this.m_x-(this.m_element?.GetDrawingX?.()??0));stem.SetDrawingYRel?.(y2-(this.m_element?.GetDrawingY?.()??0));const prev=stem.GetDrawingStemLen?.()??0;const next=y2-y1;stem.SetDrawingStemLen?.(next);stem.SetDrawingStemAdjust?.(-stemAdjust);const change=next-prev;if(!change||!inMixedBeam)return;for(const a of this.m_element?.FindAllDescendantsByType?.(ClassId.ARTIC)??[]){if((a.GetDrawingPlace?.()===1&&stem.GetDrawingStemDir?.()===STEMDIRECTION_up)||(a.GetDrawingPlace?.()===2&&stem.GetDrawingStemDir?.()===STEMDIRECTION_down))a.SetDrawingYRel?.((a.GetDrawingYRel?.()??0)-change);}}
}

// C++ Beam derives from BeamDrawingInterface (multiple inheritance).
mixinBeamDrawingInterface(Beam.prototype as unknown as object);
BeamDrawingInterface.s_coordFactory = (element: any) => {
  const c = new BeamElementCoord();
  c.m_element = element;
  c.m_dur = typeof element?.GetActualDur === 'function' ? element.GetActualDur() : DURATION_NONE;
  return c;
};
