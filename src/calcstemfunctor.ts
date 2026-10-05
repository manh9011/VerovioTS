/**
 * Pure TypeScript translation of Verovio's src/calcstemfunctor.cpp
 * / include/vrv/calcstemfunctor.h.
 *
 * Sets drawing stem positions, directions, and lengths, including for beams,
 * fTrems, chords, notes, and tablature. Unmigrated tree/layout classes (Beam,
 * Chord, Note, Stem, Flag, Layer, Staff, ...) are represented by structural
 * contracts; no layout algorithm is invented.
 */
import { DocFunctor } from './functor.js';
import { SMUFL_E242_flag16thUp } from './smufl.js';
import {
  ClassId,
  DURATION_1,
  DURATION_16,
  DURATION_2,
  DURATION_4,
  FunctorCode,
} from './vrvdef.js';

// Canonical ordinals: data_BOOLEAN from atttypes.h; STEMDIRECTION and
// BEAMPLACE from src/drawinginterface.ts (canonical for this migration).
const BOOLEAN_true = 1;
const BOOLEAN_false = 2;
const STEMDIRECTION_NONE = 0;
const STEMDIRECTION_up = 1;
const STEMDIRECTION_down = 2;
const BEAMPLACE_NONE = 0;
const MEASUREMENTTYPE_vu = 1;
const STEMPOSITION_left = 1;
const STEMPOSITION_right = 2;
const SAMEAS_SECONDARY = 3;
const RESOLVE_CROSS_STAFF = 1;

export interface CalcStemPoint {
  x: number;
  y: number;
}

export interface CalcStemLengthLike {
  GetType(): number;
  GetVu(): number;
}

export interface CalcStemStemLike {
  HasDir(): boolean;
  GetDir(): number;
  HasLen(): boolean;
  GetLen(): CalcStemLengthLike;
  GetPos(): number;
  GetVisible(): number;
  GetDrawingCueSize(): boolean;
  GetDrawingStemDir(): number;
  GetDrawingStemLen(): number;
  GetDrawingY(): number;
  GetDrawingYRel(): number;
  GetParent(): unknown;
  GetFirst(classId: ClassId): unknown;
  SetDrawingXRel(value: number): void;
  SetDrawingYRel(value: number): void;
  SetDrawingStemLen(value: number): void;
  CalculateStemModAdjustment(doc: unknown, staff: unknown, offset: number): number;
  IsVirtual(value: boolean): void;
}

export interface CalcStemFlagLike {
  m_drawingNbFlags: number;
  GetFlagGlyph(stemDir: number): number;
  SetDrawingYRel(value: number): void;
}

export interface CalcStemmedInterfaceLike {
  GetDrawingStemDir(): number;
  CalcStemLenInThirdUnits(staff: unknown, stemDir: number): number;
  GetStemDownNW(doc: unknown, staffSize: number, cueSize: boolean): CalcStemPoint;
  GetStemUpSE(doc: unknown, staffSize: number, cueSize: boolean): CalcStemPoint;
}

export interface CalcStemLayerLike {
  GetN(): number;
  GetDrawingStemDir(element?: unknown): number;
  SetDrawingStemDir(dir: number): void;
  HasCrossStaffFromBelow(): boolean;
  HasCrossStaffFromAbove(): boolean;
  GetFirstAncestor(classId: ClassId): unknown;
}

export interface CalcStemStaffLike {
  m_drawingStaffSize: number;
  m_drawingLines: number;
  GetDrawingY(): number;
  FindAllDescendantsByType(classId: ClassId, continueDepthSearch?: boolean): CalcStemLayerLike[];
  FindAllDescendantsByComparison(list: unknown[], comparison: unknown): void;
  IsTabWithStemsOutside(): boolean;
  IsTabGuitar(): boolean;
}

export interface CalcStemChordLike extends CalcStemmedInterfaceLike {
  m_crossStaff: CalcStemStaffLike | null;
  m_crossLayer: CalcStemLayerLike | null;
  IsInBeam(): boolean;
  GetAncestorFTrem(): unknown;
  IsVisible(): boolean;
  GetStemVisible(): number;
  GetDrawingStem(): CalcStemStemLike;
  GetAncestorStaff(): CalcStemStaffLike | null;
  GetFirstAncestor(classId: ClassId): unknown;
  GetDurationInterface(): { GetNoteOrChordDur(chord: unknown): number };
  IsGraceNote(): boolean;
  GetYExtremes(yMax: { value: number }, yMin: { value: number }): void;
  GetDrawingY(): number;
  SetDrawingStemDir(dir: number): void;
  GetList(): { GetDrawingY(): number }[];
}

export interface CalcStemNoteLike extends CalcStemmedInterfaceLike {
  m_crossStaff: CalcStemStaffLike | null;
  m_crossLayer: CalcStemLayerLike | null;
  IsVisible(): boolean;
  GetStemVisible(): number;
  IsInBeam(): boolean;
  GetAncestorFTrem(): unknown;
  IsMensuralDur(): boolean;
  IsTabGrpNote(): boolean;
  IsChordTone(): unknown;
  HasStemSameasNote(): boolean;
  CalcStemDirForSameasNote(verticalCenter: number): number;
  GetStemSameasRole(): number;
  GetStemSameasNote(): { GetDrawingY(): number } | null;
  GetDrawingStem(): CalcStemStemLike;
  GetAncestorStaff(): CalcStemStaffLike | null;
  GetFirstAncestor(classId: ClassId): unknown;
  IsGraceNote(): boolean;
  GetActualDur(): number;
  GetDrawingY(): number;
  SetDrawingStemDir(dir: number): void;
}

export interface CalcStemBeamLike {
  m_beamSegment: {
    InitCoordRefs(coords: unknown): void;
    InitSameasRoles(beam: unknown, place: number): void;
    CalcBeam(layer: unknown, staff: unknown, doc: unknown, beam: unknown, place?: number): void;
    CalcNoteHeadShiftForStemSameas(beam: unknown, place: number): void;
  };
  GetList(): unknown[];
  GetFirstAncestor(classId: ClassId): unknown;
  HasCoords(): boolean;
  InitCoords(children: unknown[], staff: unknown, place: number): void;
  GetPlace(): number;
  GetCue(): number;
  InitGraceStemDir(graceGrp: unknown): void;
  InitCue(isCue: boolean): void;
  IsTabBeam(): boolean;
  HasStemSameasBeam(): boolean;
  GetStemSameasBeam(): unknown;
  GetElementCoords(): unknown;
}

export interface CalcStemBeamSpanLike {
  GetStart(): { GetFirstAncestor(classId: ClassId): unknown } | null;
  GetEnd(): unknown;
  GetBeamedElements(): unknown[];
  GetPlace(): number;
  m_beamElementCoords: unknown[];
  InitCoords(elements: unknown[], staff: unknown, place: number): void;
  GetSegment(index: number): {
    SetMeasure(m: unknown): void;
    SetStaff(s: unknown): void;
    SetLayer(l: unknown): void;
    SetBeginCoord(c: unknown): void;
    SetEndCoord(c: unknown): void;
    InitCoordRefs(coords: unknown): void;
    CalcBeam(layer: unknown, staff: unknown, doc: unknown, beamSpan: unknown, place: number): void;
  };
}

export interface CalcStemFTremLike {
  m_beamSegment: {
    InitCoordRefs(coords: unknown): void;
    CalcBeam(layer: unknown, staff: unknown, doc: unknown, fTrem: unknown): void;
  };
  GetList(): unknown[];
  GetFirstAncestor(classId: ClassId): unknown;
  HasCoords(): boolean;
  InitCoords(children: unknown[], staff: unknown, place: number): void;
  InitCue(isCue: boolean): void;
  GetElementCoords(): unknown[] | null;
}

export interface CalcStemTabDurSymLike extends CalcStemmedInterfaceLike {
  IsInBeam(): boolean;
  GetDrawingStem(): CalcStemStemLike;
  GetAncestorStaff(): CalcStemStaffLike | null;
  GetFirstAncestor(classId: ClassId): unknown;
  SetDrawingStemDir(dir: number): void;
  AdjustDrawingYRel(staff: unknown, doc: unknown): void;
  GetDrawingYRel(): number;
  CalcStemLenInThirdUnits(staff: unknown, stemDir: number): number;
}

export interface CalcStemTabGrpLike {
  GetActualDur(): number;
  FindDescendantByType(classId: ClassId): unknown;
  GetBottomNote(): { GetDrawingYRel(): number } | null;
  GetTopNote(): { GetDrawingYRel(): number } | null;
}

export interface CalcStemDocLike {
  GetOptions(): { m_showHidden: { GetValue(): boolean } };
  GetDrawingUnit(staffSize: number): number;
  GetDrawingDoubleUnit(staffSize: number): number;
  GetDrawingStemWidth(staffSize: number): number;
  GetCueSize(value: number): number;
  GetGlyphHeight(code: number, staffSize: number, cueSize: boolean): number;
}

export interface CalcStemParentLike {
  Is(classId: ClassId): boolean;
  GetDrawingRadius(doc: unknown): number;
}

export interface CalcStemNoteParentLike extends CalcStemParentLike {
  GetAncestorStaff(strategy: number): CalcStemStaffLike | null;
  HasLedgerLines(above: { value: number }, below: { value: number }, staff: unknown): boolean;
  GetTopNote(): { GetDrawingY(): number };
}

function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`CalcStemFunctor: ${message}`);
}

export class CalcStemFunctor extends DocFunctor {
  private m_chordStemLength: number;
  private m_verticalCenter: number;
  private m_dur: number;
  private m_isGraceNote: boolean;
  private m_isStemSameasSecondary: boolean;
  private m_tabGrpWithNoNote: boolean;
  private m_staff: CalcStemStaffLike | null;
  private m_layer: CalcStemLayerLike | null;
  private m_interface: CalcStemmedInterfaceLike | null;

  public constructor(doc: unknown) {
    super(doc);
    this.m_chordStemLength = 0;
    this.m_verticalCenter = 0;
    this.m_dur = DURATION_1;
    this.m_isGraceNote = false;
    this.m_isStemSameasSecondary = false;
    this.m_tabGrpWithNoNote = false;
    this.m_staff = null;
    this.m_layer = null;
    this.m_interface = null;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitBeam(beam: CalcStemBeamLike): FunctorCode {
    const beamChildren = beam.GetList();

    // Should we assert this at the beginning?
    if (beamChildren.length === 0) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    const layer = beam.GetFirstAncestor(ClassId.LAYER) as CalcStemLayerLike | null;
    assertInvariant(layer, 'expected layer');
    const staff = layer.GetFirstAncestor(ClassId.STAFF) as CalcStemStaffLike | null;
    assertInvariant(staff, 'expected staff');

    if (!beam.HasCoords()) {
      beam.InitCoords(beamChildren, staff, beam.GetPlace());
      const isCue = beam.GetCue() === BOOLEAN_true
        || !!beam.GetFirstAncestor(ClassId.GRACEGRP);
      beam.InitGraceStemDir(beam.GetFirstAncestor(ClassId.GRACEGRP));
      beam.InitCue(isCue);
    }

    if (beam.IsTabBeam()) return FunctorCode.FUNCTOR_CONTINUE;

    const segment = beam.m_beamSegment;
    segment.InitCoordRefs(beam.GetElementCoords());

    const initialPlace = beam.GetPlace();
    if (beam.HasStemSameasBeam()) segment.InitSameasRoles(beam.GetStemSameasBeam(), initialPlace);

    segment.CalcBeam(layer, staff, this.m_doc, beam, initialPlace);

    if (beam.HasStemSameasBeam()) segment.CalcNoteHeadShiftForStemSameas(beam.GetStemSameasBeam(), initialPlace);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitBeamSpan(beamSpan: CalcStemBeamSpanLike): FunctorCode {
    if (!beamSpan.GetStart() || !beamSpan.GetEnd() || beamSpan.GetBeamedElements().length === 0) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    const layer = beamSpan.GetStart()!.GetFirstAncestor(ClassId.LAYER);
    const staff = beamSpan.GetStart()!.GetFirstAncestor(ClassId.STAFF);
    const measure = beamSpan.GetStart()!.GetFirstAncestor(ClassId.MEASURE);

    beamSpan.InitCoords(beamSpan.GetBeamedElements(), staff, beamSpan.GetPlace());

    const firstSegment = beamSpan.GetSegment(0);
    firstSegment.SetMeasure(measure);
    firstSegment.SetStaff(staff);
    firstSegment.SetLayer(layer);
    const coord = [...beamSpan.m_beamElementCoords];
    firstSegment.SetBeginCoord(coord[0]);
    firstSegment.SetEndCoord(coord[coord.length - 1]);
    firstSegment.InitCoordRefs(coord);
    firstSegment.CalcBeam(layer, staff, this.m_doc, beamSpan, beamSpan.GetPlace());

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitChord(chord: CalcStemChordLike): FunctorCode {
    const doc = this.m_doc as unknown as CalcStemDocLike;
    const showHidden = doc.GetOptions().m_showHidden.GetValue();

    // Set them to NULL in any case
    this.m_interface = null;

    // Stems have been calculated previously in beam or fTrem - siblings because flags do not need to
    // be processed either
    if (chord.IsInBeam() || chord.GetAncestorFTrem()) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    // if the chord isn't visible, carry on
    if (!showHidden && (!chord.IsVisible() || chord.GetStemVisible() === BOOLEAN_false)) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    const stem = chord.GetDrawingStem();
    assertInvariant(stem, 'expected stem');
    let staff = chord.GetAncestorStaff();
    let layer = chord.GetFirstAncestor(ClassId.LAYER) as CalcStemLayerLike | null;
    assertInvariant(layer, 'expected layer');

    if (chord.m_crossStaff) {
      staff = chord.m_crossStaff;
      layer = chord.m_crossLayer;
    }

    // Cache to avoid further lookup
    this.m_staff = staff;
    this.m_layer = layer;
    this.m_interface = chord;
    this.m_dur = chord.GetDurationInterface().GetNoteOrChordDur(chord);
    this.m_isGraceNote = chord.IsGraceNote();
    this.m_isStemSameasSecondary = false;

    /************ Set the direction ************/

    const yMax = { value: 0 };
    const yMin = { value: 0 };
    chord.GetYExtremes(yMax, yMin);
    this.m_chordStemLength = yMin.value - yMax.value;

    assertInvariant(staff, 'expected staff');
    const staffY = staff.GetDrawingY();
    const staffSize = staff.m_drawingStaffSize;
    this.m_verticalCenter = staffY - doc.GetDrawingDoubleUnit(staffSize) * 2;

    let layerStemDir: number;
    let stemDir = STEMDIRECTION_NONE;

    if (stem.HasDir()) {
      stemDir = stem.GetDir();
    }
    else if ((layerStemDir = layer!.GetDrawingStemDir(chord)) !== STEMDIRECTION_NONE) {
      stemDir = layerStemDir;
    }
    else {
      stemDir = this.CalcStemDirection(chord, this.m_verticalCenter);
    }

    chord.SetDrawingStemDir(stemDir);

    // Position the stem to the bottom note when up
    if (stemDir === STEMDIRECTION_up) {
      stem.SetDrawingYRel(yMin.value - chord.GetDrawingY());
    }
    // And to the top note when down
    else {
      stem.SetDrawingYRel(yMax.value - chord.GetDrawingY());
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitFTrem(fTrem: CalcStemFTremLike): FunctorCode {
    const fTremChildren = fTrem.GetList();

    // Should we assert this at the beginning?
    if (fTremChildren.length === 0) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    const layer = fTrem.GetFirstAncestor(ClassId.LAYER) as CalcStemLayerLike | null;
    assertInvariant(layer, 'expected layer');
    const staff = layer.GetFirstAncestor(ClassId.STAFF);
    assertInvariant(staff, 'expected staff');

    if (!fTrem.HasCoords()) {
      fTrem.InitCoords(fTremChildren, staff, BEAMPLACE_NONE);
      fTrem.InitCue(false);
    }

    if (fTrem.GetElementCoords()?.length !== 2) {
      this.logError('Stem calculation: <fTrem> element has invalid number of descendants.');
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    const segment = fTrem.m_beamSegment;

    segment.InitCoordRefs(fTrem.GetElementCoords());
    segment.CalcBeam(layer, staff, this.m_doc, fTrem);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNote(note: CalcStemNoteLike): FunctorCode {
    const doc = this.m_doc as unknown as CalcStemDocLike;
    const showHidden = doc.GetOptions().m_showHidden.GetValue();

    if (!showHidden && (!note.IsVisible() || note.GetStemVisible() === BOOLEAN_false)) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    // Stems have been calculated previously in Beam or fTrem - siblings because flags do not need to
    // be processed either
    if (note.IsInBeam() || note.GetAncestorFTrem()) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    // We do not need to calc stems for mensural notes
    // We have no stem with tab because it belongs to tabDurSym in this case
    if (note.IsMensuralDur() || note.IsTabGrpNote()) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    if (note.IsChordTone()) {
      assertInvariant(this.m_interface, 'expected chord interface');
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    // This now should be NULL and the chord stem length will be 0
    this.m_interface = null;
    this.m_chordStemLength = 0;

    const stem = note.GetDrawingStem();
    assertInvariant(stem, 'expected stem');
    let staff = note.GetAncestorStaff();
    let layer = note.GetFirstAncestor(ClassId.LAYER) as CalcStemLayerLike | null;
    assertInvariant(layer, 'expected layer');

    if (note.m_crossStaff) {
      staff = note.m_crossStaff;
      layer = note.m_crossLayer;
    }

    // Cache to avoid further lookup
    this.m_staff = staff;
    this.m_layer = layer;
    this.m_interface = note;
    this.m_dur = note.GetActualDur();
    this.m_isGraceNote = note.IsGraceNote();
    this.m_isStemSameasSecondary = false;

    assertInvariant(staff, 'expected staff');
    const staffSize = staff.m_drawingStaffSize;

    // C++ computes in 32-bit int (wraps when m_drawingLines == VRV_UNSET); replicate with imul.
    this.m_verticalCenter = staff.GetDrawingY() - Math.imul((staff.m_drawingLines - 1) | 0, doc.GetDrawingUnit(staffSize));

    /************ Set the direction ************/

    let layerStemDir: number;
    let stemDir = STEMDIRECTION_NONE;

    if (note.HasStemSameasNote()) {
      stemDir = note.CalcStemDirForSameasNote(this.m_verticalCenter);
    }
    else if (stem.HasDir()) {
      stemDir = stem.GetDir();
    }
    else if (note.IsGraceNote()) {
      stemDir = STEMDIRECTION_up;
    }
    else if ((layerStemDir = layer!.GetDrawingStemDir(note)) !== STEMDIRECTION_NONE) {
      stemDir = layerStemDir;
    }
    else {
      stemDir = note.GetDrawingY() >= this.m_verticalCenter ? STEMDIRECTION_down : STEMDIRECTION_up;
    }

    note.SetDrawingStemDir(stemDir);

    // Make sure the relative position of the stem is the same
    stem.SetDrawingYRel(0);

    // Use m_chordStemLength for the length of the stem between the notes
    // The value of m_stemSameasRole is set by Note::CalcStemDirForSameasNote
    if (note.HasStemSameasNote() && note.GetStemSameasRole() === SAMEAS_SECONDARY) {
      this.m_chordStemLength = -Math.abs(note.GetDrawingY() - note.GetStemSameasNote()!.GetDrawingY());
      this.m_isStemSameasSecondary = true;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: CalcStemStaffLike): FunctorCode {
    let layers = staff.FindAllDescendantsByType(ClassId.LAYER, false);
    if (layers.length === 0) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    // Not more than one layer - drawing stem dir remains unset unless there is cross-staff content
    if (layers.length < 2) {
      const layer = layers[0];
      assertInvariant(layer, 'expected layer');
      if (layer.HasCrossStaffFromBelow()) {
        layer.SetDrawingStemDir(STEMDIRECTION_up);
      }
      else if (layer.HasCrossStaffFromAbove()) {
        layer.SetDrawingStemDir(STEMDIRECTION_down);
      }
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    // Detecting empty layers (empty layers can also have @sameas) which have to be ignored for stem direction.
    // The C++ IsEmptyComparison checks child emptiness; the structural contract
    // exposes it through FindAllDescendantsByComparison, so no filter logic is duplicated here.
    const emptyLayers: CalcStemLayerLike[] = [];
    staff.FindAllDescendantsByComparison(emptyLayers, { layer: true });

    // We have only one layer (or less) with content - drawing stem dir remains unset
    if (layers.length < 3 && emptyLayers.length > 0) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (emptyLayers.length > 0) {
      // No need to sort since it is already sorted (std::set_difference on ordered lists).
      const emptySet = new Set(emptyLayers);
      layers = layers.filter((layer) => !emptySet.has(layer));
    }

    for (const object of layers) {
      // Alter stem direction between even and odd numbered layers
      const layer = object;
      layer.SetDrawingStemDir(layer.GetN() % 2 ? STEMDIRECTION_up : STEMDIRECTION_down);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStem(stem: CalcStemStemLike): FunctorCode {
    const doc = this.m_doc as unknown as CalcStemDocLike;
    assertInvariant(this.m_staff, 'expected staff');
    assertInvariant(this.m_layer, 'expected layer');
    assertInvariant(this.m_interface, 'expected interface');

    const staffSize = this.m_staff.m_drawingStaffSize;
    // C++ int division at the / 2 boundary; Math.trunc preserves it.
    const stemShift = Math.trunc(doc.GetDrawingStemWidth(staffSize) / 2);
    const drawingCueSize = stem.GetDrawingCueSize();
    const showHidden = doc.GetOptions().m_showHidden.GetValue();

    // For notes longer than half notes the stem is always 0
    if (this.m_dur < DURATION_2) {
      stem.SetDrawingXRel(0);
      stem.SetDrawingYRel(0);
      stem.SetDrawingStemLen(0);
      const adjust = stem.CalculateStemModAdjustment(doc, this.m_staff, 0);
      if (adjust) stem.SetDrawingStemLen(stem.GetDrawingStemLen() + adjust);
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    /************ Set the position, the length and adjust to the note head ************/

    const unit = doc.GetDrawingUnit(staffSize);
    let baseStem = 0;
    // Use the given one if any
    if (stem.HasLen() && stem.GetLen().GetType() === MEASUREMENTTYPE_vu) {
      baseStem = stem.GetLen().GetVu() * -unit;
    }
    // Do not adjust the baseStem for stem sameas notes (its length is in m_chordStemLength)
    else if (!this.m_isStemSameasSecondary) {
      // C++ int division at the / 3 boundary; Math.trunc preserves it.
      const thirdUnit = Math.trunc(unit / 3);
      const stemDir = this.m_interface.GetDrawingStemDir();
      baseStem = -(this.m_interface.CalcStemLenInThirdUnits(this.m_staff, stemDir) * thirdUnit);
      if (drawingCueSize) baseStem = doc.GetCueSize(baseStem);
    }
    // Even if a stem length is given we add the length of the chord content (however only if not 0)
    // Also, the given stem length is understood as being measured from the center of the note.
    // This means that it will be adjusted according to the note head
    if (!this.m_staff || !stem.HasLen() || stem.GetLen().GetVu() !== 0) {
      let p: CalcStemPoint;
      if (stem.GetDrawingStemDir() === STEMDIRECTION_up) {
        if (stem.GetPos() === STEMPOSITION_left) {
          p = this.m_interface.GetStemDownNW(doc, staffSize, drawingCueSize);
          p.x += stemShift;
        }
        else {
          p = this.m_interface.GetStemUpSE(doc, staffSize, drawingCueSize);
          p.x -= stemShift;
        }
        const stemShortening = this.m_isStemSameasSecondary ? 0 : p.y;
        stem.SetDrawingStemLen(baseStem + this.m_chordStemLength + stemShortening);
      }
      else {
        if (stem.GetPos() === STEMPOSITION_right) {
          p = this.m_interface.GetStemUpSE(doc, staffSize, drawingCueSize);
          p.x -= stemShift;
        }
        else {
          p = this.m_interface.GetStemDownNW(doc, staffSize, drawingCueSize);
          p.x += stemShift;
        }
        const stemShortening = this.m_isStemSameasSecondary ? 0 : p.y;
        stem.SetDrawingStemLen(-(baseStem + this.m_chordStemLength - stemShortening));
      }
      stem.SetDrawingYRel(stem.GetDrawingYRel() + p.y);
      stem.SetDrawingXRel(p.x);
    }

    /************ Set flag and slashes (if necessary) and adjust the length ************/
    let flagOffset = 0;
    let flag: CalcStemFlagLike | null = null;
    // There is never a flag with a duration longer than 8th notes
    if (this.m_dur > DURATION_4) {
      flag = stem.GetFirst(ClassId.FLAG) as CalcStemFlagLike | null;
      assertInvariant(flag, 'expected flag');
      // There is never a flag with stem sameas notes
      if (this.m_isStemSameasSecondary) {
        flag.m_drawingNbFlags = 0;
      }
      else {
        flag.m_drawingNbFlags = this.m_dur - DURATION_4;
        flagOffset = unit * (flag.m_drawingNbFlags + 1);
      }
    }

    // SMUFL flags cover some additional stem length from the 32th only
    if (flag) {
      flag.SetDrawingYRel(-stem.GetDrawingStemLen());
    }

    // Do not adjust the length with stem sameas notes or if given in the encoding
    // however, the stem will be extended with the SMuFL extension from 32th - this can be improved
    if (this.m_isStemSameasSecondary || stem.HasLen()) {
      if (stem.GetLen().GetVu() === 0 && flag) flag.m_drawingNbFlags = 0;
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    if (!showHidden && stem.GetVisible() === BOOLEAN_false && flag) {
      flag.m_drawingNbFlags = 0;
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    let flagHeight = 0;

    // SMUFL flags cover some additional stem length from the 32th only
    if (this.m_dur > DURATION_16) {
      assertInvariant(flag, 'expected flag');
      const stemEnd = { x: 0, y: 0 };
      // Commented since this is crashing - needs investigating
      if (stem.GetDrawingStemDir() === STEMDIRECTION_up) {
        // stemEnd = flag->GetStemUpSE(m_doc, staffSize, drawingCueSize);
      }
      else {
        // stemEnd = flag->GetStemDownNW(m_doc, staffSize, drawingCueSize);
      }
      // Trick for shortening the stem with DURATION_8
      flagHeight = stemEnd.y;
    }

    const endY = stem.GetDrawingY() - stem.GetDrawingStemLen() + flagHeight;
    let adjust = false;
    if (stem.GetDrawingStemDir() === STEMDIRECTION_up && endY < this.m_verticalCenter) {
      adjust = true;
    }
    else if (stem.GetDrawingStemDir() === STEMDIRECTION_down && endY > this.m_verticalCenter) {
      adjust = true;
    }

    // Do not adjust the length of grace notes - this is debatable and should probably become a styling option
    // However we still want flags from grace notes not to overlap with ledger lines
    if (adjust && !this.m_isGraceNote) {
      stem.SetDrawingStemLen(stem.GetDrawingStemLen() + (endY - this.m_verticalCenter));
      if (flag) flag.SetDrawingYRel(-stem.GetDrawingStemLen());
    }

    if (!this.m_isGraceNote && !drawingCueSize && !this.m_isStemSameasSecondary) {
      const modAdjust = stem.CalculateStemModAdjustment(doc, this.m_staff, flagOffset);
      if (modAdjust) stem.SetDrawingStemLen(stem.GetDrawingStemLen() + modAdjust);
      if (flag) flag.SetDrawingYRel(-stem.GetDrawingStemLen());
    }

    if (flag) this.AdjustFlagPlacement(doc, stem, flag, staffSize, this.m_verticalCenter, this.m_dur);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTabDurSym(tabDurSym: CalcStemTabDurSymLike): FunctorCode {
    const doc = this.m_doc as unknown as CalcStemDocLike;
    // Stems have been calculated previously in Beam
    if (tabDurSym.IsInBeam()) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    // This now should be NULL and the chord stem length will be 0
    this.m_interface = null;
    this.m_chordStemLength = 0;

    const stem = tabDurSym.GetDrawingStem();
    assertInvariant(stem, 'expected stem');

    // Do not draw virtual (e.g., whole note) stems
    if (this.m_dur < DURATION_2 || this.m_tabGrpWithNoNote) {
      stem.IsVirtual(true);
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    // Cache to avoid further lookup
    this.m_staff = tabDurSym.GetAncestorStaff();
    assertInvariant(this.m_staff, 'expected staff');
    this.m_layer = tabDurSym.GetFirstAncestor(ClassId.LAYER) as CalcStemLayerLike | null;
    assertInvariant(this.m_layer, 'expected layer');
    this.m_interface = tabDurSym;
    // Grace and stem sameas not supported in tablature
    this.m_isGraceNote = false;
    this.m_isStemSameasSecondary = false;

    const staffSize = this.m_staff.m_drawingStaffSize;

    /************ Set the direction ************/

    let layerStemDir: number;
    // Up by default with tablature
    let stemDir = STEMDIRECTION_up;

    if (stem.HasDir()) {
      stemDir = stem.GetDir();
    }
    else if ((layerStemDir = this.m_layer!.GetDrawingStemDir()) !== STEMDIRECTION_NONE) {
      stemDir = layerStemDir;
    }

    tabDurSym.SetDrawingStemDir(stemDir);

    let stemDirFactor = -1;
    if (stemDir === STEMDIRECTION_down) {
      tabDurSym.AdjustDrawingYRel(this.m_staff, doc);
      stemDirFactor = 1;
    }

    if (this.m_staff.IsTabWithStemsOutside()) {
      // Make sure the relative position of the stem is the same
      stem.SetDrawingYRel(0);
    }
    else {
      // Otherwise attach it to the closest note
      const tabGrp = tabDurSym.GetFirstAncestor(ClassId.TABGRP) as CalcStemTabGrpLike | null;
      assertInvariant(tabGrp, 'expected tabGrp');
      const note = stemDir === STEMDIRECTION_down ? tabGrp.GetBottomNote() : tabGrp.GetTopNote();
      let yRel = note ? note.GetDrawingYRel() : 0;
      // Because the tabDurSym is relative to the top or bottom staff line, remove its relative value
      yRel -= tabDurSym.GetDrawingYRel();
      // Remove a unit for the stem not to go to the center of the note
      yRel -= doc.GetDrawingUnit(this.m_staff.m_drawingStaffSize) * stemDirFactor;
      stem.SetDrawingYRel(yRel);
    }

    // C++ int arithmetic at the / (3 * factor) boundary; trunc preserves it.
    let stemSize = tabDurSym.CalcStemLenInThirdUnits(this.m_staff, stemDir)
      * doc.GetDrawingUnit(staffSize);
    stemSize = Math.trunc(stemSize / (3 * stemDirFactor));

    if (this.m_dur === DURATION_2) {
      // Stems for half notes twice shorter
      // C++ int division; Math.trunc preserves it.
      stemSize = Math.trunc(stemSize / 2);
    }

    stem.SetDrawingStemLen(stemSize);

    // Flag currently used only for guitar tablature because it is included in the glyphs for lute tab
    if (this.m_staff.IsTabGuitar()) {
      const flag = stem.GetFirst(ClassId.FLAG) as CalcStemFlagLike | null;
      if (flag) {
        flag.m_drawingNbFlags = this.m_dur - DURATION_4;
        flag.SetDrawingYRel(-stemSize);
      }
    }

    // Do not call VisitStem with TabDurSym because everything is done here
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitTabGrp(tabGrp: CalcStemTabGrpLike): FunctorCode {
    this.m_dur = tabGrp.GetActualDur();
    this.m_tabGrpWithNoNote = !tabGrp.FindDescendantByType(ClassId.NOTE);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public CalcStemDirection(
    chord: { GetList(): { GetDrawingY(): number }[] }, verticalCenter: number,
  ): number {
    const childList = chord.GetList();
    const topNotes: { GetDrawingY(): number }[] = [];
    const bottomNotes: { GetDrawingY(): number }[] = [];

    // split notes into two vectors - notes above vertical center and below
    for (const note of childList) {
      if (note.GetDrawingY() > verticalCenter) topNotes.push(note);
      else bottomNotes.push(note);
    }

    let bottomIdx = 0;
    let topIdx = topNotes.length - 1;
    for (; bottomIdx < bottomNotes.length && topIdx >= 0; ++bottomIdx, --topIdx) {
      const bottomY = bottomNotes[bottomIdx].GetDrawingY();
      const topY = topNotes[topIdx].GetDrawingY();
      // C++ int division at the / 2 boundary; Math.trunc preserves it.
      const middlePoint = Math.trunc((topY + bottomY) / 2);

      // if notes are equidistant - proceed to the next pair of notes
      if (middlePoint === verticalCenter) {
        continue;
      }
      // otherwise return corresponding stem direction
      else if (middlePoint > verticalCenter) {
        return STEMDIRECTION_down;
      }
      else {
        return STEMDIRECTION_up;
      }
    }

    // if there are still unprocessed notes left on the bottom that are not on the center - stem direction should be up
    if (bottomIdx < bottomNotes.length && bottomNotes[bottomIdx].GetDrawingY() !== verticalCenter) {
      return STEMDIRECTION_up;
    }
    // otherwise place it down
    return STEMDIRECTION_down;
  }

  public AdjustFlagPlacement(
    doc: CalcStemDocLike, stem: CalcStemStemLike, flag: CalcStemFlagLike,
    staffSize: number, verticalCenter: number, duration: number,
  ): void {
    assertInvariant(stem.GetParent(), 'expected stem parent');

    const parent = stem.GetParent() as CalcStemParentLike | null;
    // C++ asserts IsLayerElement; the structural contract exposes Is() only.
    if (!parent) return;

    const stemDirection = stem.GetDrawingStemDir();
    // For overlapping purposes we don't care for flags shorter than 16th since they grow in opposite direction
    let flagGlyph = SMUFL_E242_flag16thUp;
    if (duration < DURATION_16) flagGlyph = (flag.GetFlagGlyph
      ? flag.GetFlagGlyph(stemDirection) : SMUFL_E242_flag16thUp);
    const glyphHeight = doc.GetGlyphHeight(flagGlyph, staffSize, stem.GetDrawingCueSize());

    // Make sure that flags don't overlap with notehead. Upward flags cannot overlap with noteheads so check
    // only downward ones
    const adjustmentStep = doc.GetDrawingUnit(staffSize);
    if (stemDirection === STEMDIRECTION_down) {
      const noteheadMargin = stem.GetDrawingStemLen() - (glyphHeight + parent.GetDrawingRadius(doc));
      if (duration > DURATION_16 && noteheadMargin < 0) {
        let offset = 0;
        // C++ int arithmetic: % keeps the sign of the dividend, / truncates toward zero.
        if (noteheadMargin % adjustmentStep < Math.trunc(-adjustmentStep / 3 * 2)) {
          // C++ int division; Math.trunc preserves it.
          offset = Math.trunc(adjustmentStep / 2);
        }
        const heightToAdjust = Math.trunc(noteheadMargin / adjustmentStep) * adjustmentStep - offset;
        stem.SetDrawingStemLen(stem.GetDrawingStemLen() - heightToAdjust);
        flag.SetDrawingYRel(-stem.GetDrawingStemLen());
      }
    }

    let note: { GetDrawingY(): number } | null = null;
    if (parent.Is(ClassId.NOTE)) {
      note = parent as unknown as { GetDrawingY(): number };
    }
    else if (parent.Is(ClassId.CHORD)) {
      const chord = parent as unknown as { GetTopNote(): { GetDrawingY(): number } };
      assertInvariant(chord, 'expected chord');
      note = chord.GetTopNote();
    }
    assertInvariant(note, 'expected note');
    const ledgerAbove = { value: 0 };
    const ledgerBelow = { value: 0 };

    const noteParent = note as unknown as CalcStemNoteParentLike;
    const staff = noteParent.GetAncestorStaff
      ? noteParent.GetAncestorStaff(RESOLVE_CROSS_STAFF) : null;
    if (!note || !noteParent.HasLedgerLines || !noteParent.HasLedgerLines(ledgerAbove, ledgerBelow, staff)) return;
    if ((stemDirection === STEMDIRECTION_up && !ledgerBelow.value)
      || (stemDirection === STEMDIRECTION_down && !ledgerAbove.value)) {
      return;
    }

    // Make sure that flags don't overlap with first (top or bottom) ledger line (effectively avoiding all ledgers)
    const directionBias = stemDirection === STEMDIRECTION_down ? -1 : 1;
    const position = stem.GetDrawingY() - stem.GetDrawingStemLen() - directionBias * glyphHeight;
    const ledgerPosition = verticalCenter - 6 * directionBias * adjustmentStep;
    const displacementMargin = (position - ledgerPosition) * directionBias;

    if (displacementMargin < 0) {
      let offset = 0;
      if (stemDirection === STEMDIRECTION_down
        && displacementMargin % adjustmentStep > -adjustmentStep / 3) {
        // C++ int division; Math.trunc preserves it.
        offset = Math.trunc(adjustmentStep / 2);
      }
      // C++ int division; Math.trunc preserves it.
      const heightToAdjust = (Math.trunc(displacementMargin / adjustmentStep) - 1)
        * adjustmentStep * directionBias - offset;
      stem.SetDrawingStemLen(stem.GetDrawingStemLen() + heightToAdjust);
      flag.SetDrawingYRel(-stem.GetDrawingStemLen());
    }
  }

  private logError(_message: string): void {
    // C++ LogError has no observable effect on the functor state machine.
  }
}
