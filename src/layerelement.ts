/**
 * Pure TypeScript translation of Verovio's `src/layerelement.cpp` /
 * `include/vrv/layerelement.h`.
 *
 * C++ multiple inheritance (Object + FacsimileInterface + LinkingInterface +
 * AttCoordX1 + AttLabelled + AttTyped) is represented through composed
 * interface/attribute components with the same registration order, reset
 * order, and public forwarding surface.
 *
 * Not-yet-migrated domain collaborators (Note, Chord, Beam, FTrem, Stem, Staff,
 * Measure, Alignment, DurationInterface consumers) are structural contracts.
 */
import { VrvObject } from './object.js';
import { FacsimileInterface } from './facsimileinterface.js';
import { LinkingInterface } from './linkinginterface.js';
import { InstCoordX1, InstLabelled, InstTyped } from './atts_shared.js';
import { Fraction } from './fraction.js';
import { IsMensuralType } from './vrv.js';
import { LogWarning } from './vrv.js';
import {
  ClassId, FunctorCode, InterfaceId, VRV_UNSET, ElementScoreDefRole,
  DURATION_1, DURATION_2, DURATION_4, DURATION_breve, DURATION_brevis, DURATION_maxima,
  MAX_ACCID_DEPTH, MAX_BEAM_DEPTH, MAX_CHORD_DEPTH, MAX_FTREM_DEPTH,
  MAX_LIGATURE_DEPTH, MAX_TUPLET_DEPTH,
} from './vrvdef.js';
import { MapOfDotLocs, MapOfNoteLocs } from './vrvdef.js';
import { ClassIdComparison, ClassIdsComparison, InterfaceComparison } from './comparison.js';
import {
  SMUFL_E0A1_noteheadDoubleWholeSquare, SMUFL_E0A2_noteheadWhole,
  SMUFL_E0A3_noteheadHalf, SMUFL_E0A4_noteheadBlack,
  SMUFL_E220_tremolo1, SMUFL_E221_tremolo2, SMUFL_E222_tremolo3,
  SMUFL_E223_tremolo4, SMUFL_E224_tremolo5, SMUFL_E645_vocalSprechgesang,
  SMUFL_E22A_buzzRoll,
} from './smufl.js';
import { STEMDIRECTION_up, STEMDIRECTION_down, STEMDIRECTION_NONE, STAFFREL_basic_NONE, STAFFREL_basic_above, STAFFREL_basic_below } from './drawinginterface.js';
import type { ResourcesLike } from './boundingbox.js';

// Canonical libmei AttClassId ordinals (libmei/dist/attclasses.h, 0-based with
// names[0] == first value 1; verified against existing literal usage).
const ATT_COORDX1 = 111;
const ATT_LABELLED = 145;
const ATT_TYPED = 224;

// NOTATIONTYPE ordinals from the generated converter layer.
const NOTATIONTYPE_NONE = 0;
const NOTATIONTYPE_cmn = 1;
const NOTATIONTYPE_mensural = 2;
const NOTATIONTYPE_mensural_black = 3;

// data_STEMMODIFIER ordinals from the generated converter layer.
const STEMMODIFIER_NONE = 0;
const STEMMODIFIER_1slash = 2;
const STEMMODIFIER_2slash = 3;
const STEMMODIFIER_3slash = 4;
const STEMMODIFIER_4slash = 5;
const STEMMODIFIER_5slash = 6;
const STEMMODIFIER_6slash = 7;
const STEMMODIFIER_sprech = 8;
const STEMMODIFIER_z = 9;

export enum StaffSearch { ANCESTOR_ONLY = 0, RESOLVE_CROSS_STAFF }

// Helper enums (layerelement.h).
// NEUME_*_SPACE mirrors the C++ macros: Fraction(1,4), Fraction(1,8), Fraction(1,16).
export const NEUME_LARGE_SPACE = new Fraction(1, 4);
export const NEUME_MEDIUM_SPACE = new Fraction(1, 8);
export const NEUME_SMALL_SPACE = new Fraction(1, 16);

//---------//
// Contracts for not-yet-migrated collaborators (no invented behavior).
//---------//

export interface AlignmentLike {
  GetXRel(): number;
  FindAllDescendantsByType(classId: ClassId, continueDepthSearch: boolean): VrvObject[];
}

export interface StaffAlignmentLike { }

export interface StaffContract {
  GetN(): number;
  GetAlignment(): AlignmentLike | null;
  m_drawingStaffSize?: number;
  m_drawingNotationType?: number;
  GetDrawingX(): number;
  GetDrawingY(): number;
}

export interface LayerContract {
  GetN(): number;
  GetLayerCountForTimeSpanOf(element: unknown): number;
}

export interface NoteContract {
  HasGrace?(): boolean;
  IsChordTone?(): { HasGrace?(): boolean } | null;
  GetDrawingDur?(): number;
  IsMensuralDur?(): boolean;
  GetMensuralNoteheadGlyph?(): number;
  GetNoteheadGlyph?(dur: number): number;
  GetDrawingY?(): number;
  GetDots?(): number;
  IsUnisonWith?(other: unknown, includingAccid: boolean): boolean;
  GetDrawingLoc?(): number;
  GetDrawingStemDir?(): number;
  HasStemSameasNote?(): boolean;
  GetDrawingAccid?(): unknown;
  AlignDotsShift?(other: unknown): void;
  IsGraceNote?(): boolean;
  GetAlignmentLayerN?(): number;
  GetAncestorStaff?(strategy?: number, assertExistence?: boolean): StaffContract | null;
  /** C++ accesses previousNote->m_crossStaff directly (member access). */
  m_crossStaff?: unknown;
}

export interface ChordContract {
  HasGrace?(): boolean;
  GetActualDur?(): number;
  IsMensuralDur?(): boolean;
  HasCrossStaff?(): boolean;
  GetCrossStaffExtremes?(above: { value: StaffContract | null }, below: { value: StaffContract | null }): void;
  GetTopNote?(): NoteContract;
  GetBottomNote?(): NoteContract;
  GetDur?(): number;
}

export interface BeamContract {
  m_crossStaff?: unknown;
  GetList(): VrvObject[];
  GetListIndex(element: VrvObject): number;
  GetBeamChildOverflow?(above: { value: StaffAlignmentLike | null }, below: { value: StaffAlignmentLike | null }): void;
}

export interface FTremContract {
  m_crossStaff?: unknown;
  GetBeamChildOverflow?(above: { value: StaffAlignmentLike | null }, below: { value: StaffAlignmentLike | null }): void;
}

export interface DocContract {
  GetDrawingUnit(staffSize: number): number;
  GetDrawingStemWidth(staffSize: number): number;
  GetDrawingBrevisWidth(staffSize: number): number;
  GetGlyphWidth(code: number, staffSize: number, cueSize: boolean): number;
  /** Matches boundingbox.ts DocLike surface for overlap helpers. */
  GetResources(): ResourcesLike;
}

export interface ArticContract {
  GetDrawingPlace?(): number;
  GetSelfTop?(): number;
  GetSelfBottom?(): number;
}

export interface StemContract {
  CompareToElementPosition?(doc: DocContract, other: LayerElement, direction: number): number;
  HorizontalLeftOverlap?(other: LayerElement, doc: DocContract, xShift: number, verticalMargin: number): number;
}

export interface DotsContract extends VrvObject {
  IsAdjusted?(): boolean;
}

export interface MeterSigContract {
  HasUnit(): boolean;
  GetUnitAsDur(): number;
  HasCount(): boolean;
  GetTotalCount(): number;
}

export interface ProportContract {
  HasNum(): boolean;
  GetCumulatedNum(): number;
  HasNumbase(): boolean;
  GetCumulatedNumbase(): number;
}

export interface TupletContract extends VrvObject {
  GetNum(): number;
  GetNumbase(): number;
}

/** Mirrors the C++ AlignMeterParams struct passed through alignfunctor. */
export interface AlignMeterParams {
  meterSig: MeterSigContract | null;
  mensur: unknown;
  proport: ProportContract | null;
  equivalence: number;
  metcon: boolean;
}

export type NotePredicate = (note: VrvObject) => boolean;

export interface LayerElementFunctorLike {
  VisitLayerElement(element: unknown): FunctorCode;
  VisitLayerElementEnd(element: unknown): FunctorCode;
}

//---------//
// LayerElement
//---------//

export class LayerElement extends VrvObject {
  protected facsimileInterface?: FacsimileInterface;
  protected linkingInterface?: LinkingInterface;
  protected coordX1?: InstCoordX1;
  protected labelled?: InstLabelled;
  protected typed?: InstTyped;

  /** Absolute position X. This is used for facsimile (transcription) encoding */
  public m_drawingFacsX: number;
  public m_drawingFacsY: number; // This is used only for accid, syl
  /** Pointer to the cross-staff (if any) and the appropriate layer */
  public m_crossStaff: StaffContract | null;
  public m_crossLayer: LayerContract | null;

  protected m_alignment: AlignmentLike | null;
  /** An alignment for grace notes */
  protected m_graceAlignment: AlignmentLike | null;
  /** The Y drawing relative position of the object. */
  protected m_drawingYRel: number;
  /** The cached value for m_drawingYRel for caching horizontal layout */
  protected m_cachedYRel: number;
  /** The X drawing relative position of the object. */
  protected m_drawingXRel: number;
  /** The cached value for m_drawingXRel for caching horizontal layout */
  protected m_cachedXRel: number;
  /** The cached drawing cue size set by PrepareCueSizeFunctor */
  protected m_drawingCueSize: boolean;
  /** Indicates whether it is a ScoreDef or StaffDef attribute */
  private m_scoreDefRole: ElementScoreDefRole;
  /** The cached alignment layer @n. Negative values identify cross-staff. */
  private m_alignmentLayerN: number;
  /** Flag to indicate that layerElement belongs to the beamSpan */
  private m_isInBeamspan: boolean;

  public constructor(classId: ClassId = ClassId.LAYER_ELEMENT) {
    super(classId);
    this.facsimileInterface = new FacsimileInterface();
    this.linkingInterface = new LinkingInterface();
    this.coordX1 = new InstCoordX1();
    this.labelled = new InstLabelled();
    this.typed = new InstTyped();
    this.RegisterInterface(this.facsimileInterface.GetAttClasses(), this.facsimileInterface.IsInterface());
    this.RegisterInterface(this.linkingInterface.GetAttClasses(), this.linkingInterface.IsInterface());
    this.RegisterAttClass(ATT_COORDX1);
    this.RegisterAttClass(ATT_LABELLED);
    this.RegisterAttClass(ATT_TYPED);
    // Fields are declared above without initializers because the VrvObject
    // constructor invokes the virtual Reset() before subclass field init.
    this.m_drawingFacsX = VRV_UNSET;
    this.m_drawingFacsY = VRV_UNSET;
    this.m_crossStaff = null;
    this.m_crossLayer = null;
    this.m_alignment = null;
    this.m_graceAlignment = null;
    this.m_drawingYRel = 0;
    this.m_cachedYRel = VRV_UNSET;
    this.m_drawingXRel = 0;
    this.m_cachedXRel = VRV_UNSET;
    this.m_drawingCueSize = false;
    this.m_scoreDefRole = ElementScoreDefRole.SCOREDEF_NONE;
    this.m_alignmentLayerN = VRV_UNSET;
    this.m_isInBeamspan = false;
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.facsimileInterface ??= new FacsimileInterface();
    this.linkingInterface ??= new LinkingInterface();
    this.coordX1 ??= new InstCoordX1();
    this.labelled ??= new InstLabelled();
    this.typed ??= new InstTyped();
    this.facsimileInterface.Reset();
    this.linkingInterface.Reset();
    this.coordX1.ResetCoordX1();
    this.labelled.ResetLabelled();
    this.typed.ResetTyped();

    this.m_drawingFacsX ??= VRV_UNSET;
    this.m_drawingFacsY ??= VRV_UNSET;
    this.m_drawingYRel ??= 0;
    this.m_drawingXRel ??= 0;
    this.m_drawingCueSize ??= false;

    this.m_cachedYRel ??= VRV_UNSET;
    this.m_cachedXRel ??= VRV_UNSET;

    this.m_scoreDefRole = ElementScoreDefRole.SCOREDEF_NONE;
    this.m_alignment = null;
    this.m_graceAlignment = null;
    this.m_alignmentLayerN = VRV_UNSET;

    this.m_crossStaff = null;
    this.m_crossLayer = null;

    this.m_isInBeamspan = false;
  }

  /** Overriding CloneReset() method to be called after copy / assignment calls. */
  public override CloneReset(): void {
    super.CloneReset();
    // pointers have to be NULL
    this.m_alignment = null;
    this.m_graceAlignment = null;
    this.m_alignmentLayerN = VRV_UNSET;
    this.m_crossStaff = null;
    this.m_crossLayer = null;
  }

  public override GetFacsimileInterface(): FacsimileInterface | null {
    this.facsimileInterface ??= new FacsimileInterface();
    return this.facsimileInterface;
  }

  public override GetLinkingInterface(): LinkingInterface | null {
    this.linkingInterface ??= new LinkingInterface();
    return this.linkingInterface;
  }

  public HasSameasLink(): boolean { return this.GetLinkingInterface()?.HasSameasLink() ?? false; }
  public GetSameasLink(): LayerElement | null { return this.GetLinkingInterface()?.GetSameasLink() as LayerElement | null; }
  public HasSameas(): boolean { return this.GetLinkingInterface()?.HasSameas() ?? false; }
  public GetSameas(): string { return this.GetLinkingInterface()?.GetSameas() ?? ''; }
  public SetSameas(v: string): void { this.GetLinkingInterface()?.SetSameas(v); }

  // AttTyped forwarding
  public SetType(type: string): void { this.typed?.SetType(type); }
  public GetType(): string { return this.typed?.GetType() ?? ''; }
  public HasType(): boolean { return this.typed?.HasType() ?? false; }
  public ResetTyped(): void { this.typed?.ResetTyped(); }

  // AttLabelled forwarding
  public SetLabel(label: string): void { this.labelled?.SetLabel(label); }
  public GetLabel(): string { return this.labelled?.GetLabel() ?? ''; }
  public HasLabel(): boolean { return this.labelled?.HasLabel() ?? false; }
  public ResetLabelled(): void { this.labelled?.ResetLabelled(); }

  // AttCoordX1 forwarding
  public SetCoordX1(coordX1: number): void { this.coordX1?.SetCoordX1(coordX1); }
  public GetCoordX1(): number { return this.coordX1?.GetCoordX1() ?? 0; }
  public HasCoordX1(): boolean { return this.coordX1?.HasCoordX1() ?? false; }
  public ResetCoordX1(): void { this.coordX1?.ResetCoordX1(); }

  // FacsimileInterface forwarding (AttFacsimile)
  public SetFacs(facs: string): void { this.GetFacsimileInterface()!.SetFacs(facs); }
  public GetFacs(): string { return this.GetFacsimileInterface()!.GetFacs(); }
  public HasFacs(): boolean { return this.GetFacsimileInterface()!.HasFacs(); }

  /** Return true if the element has to be aligned horizontally. */
  public HasToBeAligned(): boolean { return false; }

  /** Return true if the element is part of a scoreDef or staffDef. */
  public IsScoreDefElement(): boolean { return false; }

  /** Return true if the element is relative to the staff and not to its parent. */
  public IsRelativeToStaff(): boolean { return false; }

  /** Return itself or the resolved @sameas (if any). */
  public ThisOrSameasLink(): LayerElement | null {
    if (!this.GetLinkingInterface()!.HasSameasLink()) return this;
    const sameas = this.GetLinkingInterface()!.GetSameasLink() as LayerElement | null;
    if (!sameas) throw new Error('LayerElement::ThisOrSameasLink: sameas link must be resolved.');
    return sameas;
  }

  public GetScoreDefRole(): ElementScoreDefRole { return this.m_scoreDefRole; }
  public SetScoreDefRole(scoreDefRole: ElementScoreDefRole): void { this.m_scoreDefRole = scoreDefRole; }

  /** Return true if the element is a grace note. */
  public IsGraceNote(): boolean {
    // First, regardless of the type, check whether it's part of GRACEGRP
    if (this.GetFirstAncestor(ClassId.GRACEGRP)) return true;
    // For note, we need to look at it or at the parent chord
    if (this.Is(ClassId.NOTE)) {
      const note = this as unknown as NoteContract;
      const chord = note.IsChordTone?.();
      return (chord) ? !!chord.HasGrace?.() : !!note.HasGrace?.();
    }
    else if (this.Is(ClassId.CHORD)) {
      const chord = this as unknown as ChordContract;
      return !!chord.HasGrace?.();
    }
    else if (this.Is(ClassId.TUPLET)) {
      const child = this.FindDescendantByComparison(
        { IsSupported: (obj: VrvObject) => obj.Is(ClassId.NOTE) || obj.Is(ClassId.CHORD) } as never);
      if (child) return (child as LayerElement).IsGraceNote();
    }
    // For accid, artic, etc.. look at the parent note / chord
    else {
      // For an accid we expect to be the child of a note
      const note = this.GetFirstAncestor(ClassId.NOTE, MAX_ACCID_DEPTH) as (VrvObject & NoteContract) | null;
      if (note) return (note as LayerElement).IsGraceNote();
      // For an artic we can be direct child of a chord
      const chord = this.GetFirstAncestor(ClassId.CHORD, MAX_ACCID_DEPTH) as (VrvObject & ChordContract) | null;
      if (chord) return (chord as LayerElement).IsGraceNote();
    }
    return false;
  }

  /** Return true if the element is a note within a ligature. */
  public IsInLigature(): boolean {
    if (!this.Is(ClassId.NOTE)) return false;
    return !!this.GetFirstAncestor(ClassId.LIGATURE, MAX_LIGATURE_DEPTH);
  }

  /** Return the FTrem parent if the element is a note or chord within a fTrem. */
  public GetAncestorFTrem(): FTremContract | null {
    if (!this.IsAnyOf([ClassId.CHORD, ClassId.NOTE])) return null;
    return this.GetFirstAncestor(ClassId.FTREM, MAX_FTREM_DEPTH) as unknown as FTremContract | null;
  }

  /**
   * Return the beam parent if in beam. Look for the first beam parent and
   * check if the note is in its content list (necessary for grace notes or
   * imbricated beams).
   */
  public GetAncestorBeam(): BeamContract | null {
    if (!this.IsAnyOf([ClassId.CHORD, ClassId.NOTE, ClassId.REST, ClassId.TABGRP, ClassId.TABDURSYM, ClassId.STEM])) return null;
    const beamParent = this.GetFirstAncestor(ClassId.BEAM) as unknown as BeamContract | null;
    if (this.Is(ClassId.REST)) return beamParent;

    if (beamParent != null) {
      if (!this.IsGraceNote()) return beamParent;
      // This note is beamed and cue-sized
      let graceElement: LayerElement = this;
      if (this.Is(ClassId.STEM)) {
        const noteParent = this.GetFirstAncestor(ClassId.NOTE) as LayerElement | null;
        graceElement = noteParent ?? (this.GetFirstAncestor(ClassId.CHORD) as LayerElement | null)!;
        if (!graceElement) throw new Error('LayerElement::GetAncestorBeam: stem without note/chord parent.');
      }
      // Make sure the object list is set
      beamParent.GetList();
      // If the note is part of the beam parent, this means we have a beam of graced notes
      if (beamParent.GetListIndex(graceElement) > -1) {
        return beamParent;
      }
      // otherwise it is a non-beamed grace note within a beam - return NULL
    }
    return null;
  }

  public GetOriginalLayerN(): number {
    let layerN = this.GetAlignmentLayerN();
    if (layerN < 0) {
      const layer = this.GetFirstAncestor(ClassId.LAYER);
      if (!layer) throw new Error('LayerElement::GetOriginalLayerN: layer ancestor required.');
      layerN = (layer as unknown as LayerContract).GetN();
    }
    return layerN;
  }

  public SetIsInBeamSpan(isInBeamSpan: boolean): void {
    if (!this.IsAnyOf([ClassId.CHORD, ClassId.NOTE, ClassId.REST])) return;
    this.m_isInBeamspan = isInBeamSpan;
  }

  public GetIsInBeamSpan(): boolean { return this.m_isInBeamspan; }

  public IsInBeam(): boolean {
    return !!(this.GetAncestorBeam() || this.GetIsInBeamSpan());
  }

  /** Set and get the drawingCueSize flag. */
  public SetDrawingCueSize(drawingCueSize: boolean): void { this.m_drawingCueSize = drawingCueSize; }
  public GetDrawingCueSize(): boolean { return this.m_drawingCueSize; }

  /** Get and set the layerN drawing value. */
  public GetAlignmentLayerN(): number { return this.m_alignmentLayerN; }
  public SetAlignmentLayerN(alignmentLayerN: number): void { this.m_alignmentLayerN = alignmentLayerN; }

  /** @return (cross) layer number, parent layer number for cross staff elements */
  // (GetOriginalLayerN above)

  //---------//
  // X and Y drawing positions
  //---------//

  public override GetDrawingX(): number {
    // Since m_drawingFacsX is the left position, we adjust the XRel accordingly
    if (this.m_drawingFacsX !== VRV_UNSET) return this.m_drawingFacsX + this.GetDrawingXRel();

    if (this.m_cachedDrawingX != VRV_UNSET) return this.m_cachedDrawingX;

    if (!this.m_alignment) {
      const measure = this.GetFirstAncestor(ClassId.MEASURE);
      if (!measure) throw new Error('LayerElement::GetDrawingX: measure ancestor required.');
      this.m_cachedDrawingX = measure.GetDrawingX();
      return this.m_cachedDrawingX;
    }

    // First get the first layerElement parent (if any) and use its position if
    // they share the same alignment
    const parent = this.GetFirstAncestorInRange(ClassId.LAYER_ELEMENT, ClassId.LAYER_ELEMENT_max) as LayerElement | null;
    if (parent && (parent.GetAlignment() === this.GetAlignment())) {
      this.m_cachedDrawingX = (parent.GetDrawingX() + this.GetDrawingXRel());
      return this.m_cachedDrawingX;
    }

    // Otherwise get the measure
    const measure = this.GetFirstAncestor(ClassId.MEASURE);
    if (!measure) throw new Error('LayerElement::GetDrawingX: measure ancestor required.');

    let graceNoteShift = 0;
    if (this.HasGraceAlignment()) {
      graceNoteShift = this.GetGraceAlignment()!.GetXRel();
    }

    this.m_cachedDrawingX = (measure.GetDrawingX() + this.m_alignment.GetXRel() + this.GetDrawingXRel() + graceNoteShift);
    return this.m_cachedDrawingX;
  }

  public override GetDrawingY(): number {
    if (this.m_drawingFacsY !== VRV_UNSET) return this.m_drawingFacsY + this.GetDrawingYRel();

    if (this.m_cachedDrawingY != VRV_UNSET) return this.m_cachedDrawingY;

    // Look if we have a crossStaff situation
    let object: VrvObject | null = this.m_crossStaff as unknown as VrvObject | null;
    // First get the first layerElement parent (if any) but only if the element
    // is not directly relative to staff (e.g. artic, syl)
    if (!object && !this.IsRelativeToStaff()) {
      object = this.GetFirstAncestorInRange(ClassId.LAYER_ELEMENT, ClassId.LAYER_ELEMENT_max);
    }
    // Otherwise get the first staff
    if (!object) object = this.GetFirstAncestor(ClassId.STAFF);
    // Otherwise the first measure (this is the case with barLineAttr)
    if (!object) object = this.GetFirstAncestor(ClassId.MEASURE);

    if (!object) throw new Error('LayerElement::GetDrawingY: ancestor object required.');

    this.m_cachedDrawingY = object.GetDrawingY() + this.GetDrawingYRel();
    return this.m_cachedDrawingY;
  }

  public GetDrawingXRel(): number { return this.m_drawingXRel; }
  public SetDrawingXRel(drawingXRel: number): void {
    this.ResetCachedDrawingX();
    // C++ LayerElement::m_drawingXRel is int (layerelement.h:420), SetDrawingXRel(int).
    this.m_drawingXRel = Math.trunc(drawingXRel);
  }

  public CacheXRel(restore = false): void {
    if (restore) {
      this.m_drawingXRel = this.m_cachedXRel;
    }
    else {
      this.m_cachedXRel = this.m_drawingXRel;
    }
  }

  public GetDrawingYRel(): number { return this.m_drawingYRel; }
  public SetDrawingYRel(drawingYRel: number): void {
    this.ResetCachedDrawingY();
    // C++ LayerElement::m_drawingYRel is int (layerelement.h:409), SetDrawingYRel(int).
    this.m_drawingYRel = Math.trunc(drawingYRel);
  }

  public CacheYRel(restore = false): void {
    if (restore) {
      this.m_drawingYRel = this.m_cachedYRel;
    }
    else {
      this.m_cachedYRel = this.m_drawingYRel;
    }
  }

  /** Adjust the m_drawingYRel for the element to be centered on the inner content of the measure */
  public CenterDrawingX(): void {
    if (this.m_drawingFacsX != VRV_UNSET) return;

    this.SetDrawingXRel(0);

    const measure = this.GetFirstAncestor(ClassId.MEASURE) as unknown as { GetInnerCenterX(): number } | null;
    if (!measure) throw new Error('LayerElement::CenterDrawingX: measure ancestor required.');

    this.SetDrawingXRel(measure.GetInnerCenterX() - this.GetDrawingX());
  }

  //---------//
  // Alignment setters and getters
  //---------//

  public GetAlignment(): AlignmentLike | null { return this.m_alignment; }
  public ResetAlignment(): void { this.m_alignment = null; }
  public SetAlignment(alignment: AlignmentLike): void { this.m_alignment = alignment; }

  /**
   * Get the ancestor or cross staff.
   */
  public GetAncestorStaff(strategy: StaffSearch = StaffSearch.ANCESTOR_ONLY, assertExistence = true): StaffContract | null {
    let staff: StaffContract | null = null;
    if (strategy === StaffSearch.RESOLVE_CROSS_STAFF) {
      staff = this.GetCrossStaff({ value: null });
    }
    if (!staff) staff = this.GetFirstAncestor(ClassId.STAFF) as unknown as StaffContract | null;
    if (assertExistence && !staff) {
      throw new Error('LayerElement::GetAncestorStaff: staff ancestor required.');
    }
    return staff;
  }

  /**
   * Look for a cross or a parent LayerElement (note, chord, rest) with a cross
   * staff. Also set the corresponding m_crossLayer to layer if a cross staff is
   * found. Return NULL if there is no cross-staff in the element or a parent.
   */
  public GetCrossStaff(layerRef: { value: LayerContract | null }): StaffContract | null {
    if (this.m_crossStaff) {
      if (!this.m_crossLayer) throw new Error('LayerElement::GetCrossStaff: cross layer required with cross staff.');
      layerRef.value = this.m_crossLayer;
      return this.m_crossStaff;
    }

    const parent = this.GetFirstAncestorInRange(ClassId.LAYER_ELEMENT, ClassId.LAYER_ELEMENT_max) as LayerElement | null;
    if (parent) return parent.GetCrossStaff(layerRef);

    return null;
  }

  /** Retrieve the direction of a cross-staff situation */
  public GetCrossStaffRel(): number {
    if (!this.m_crossStaff) return STAFFREL_basic_NONE;

    const staff = this.GetAncestorStaff();

    return (this.m_crossStaff.GetN() < staff!.GetN()) ? STAFFREL_basic_above : STAFFREL_basic_below;
  }

  /**
   * Get the StaffAlignment for which overflows need to be calculated against.
   */
  public GetOverflowStaffAlignments(
    above: { value: StaffAlignmentLike | null },
    below: { value: StaffAlignmentLike | null },
  ): void {
    const staff = this.GetAncestorStaff(StaffSearch.RESOLVE_CROSS_STAFF);

    // By default use the alignment of the staff
    above.value = staff!.GetAlignment() as unknown as StaffAlignmentLike;
    below.value = above.value;

    // Dots, flags and stems with cross-staff chords need special treatment
    this.GetChordOverflow(above, below, staff!.GetN());

    // Stems cross-staff beam need special treatment but only if the beam
    // itself is not cross-staff
    if (this.IsAnyOf([ClassId.ARTIC, ClassId.STEM])) {
      if (this.GetFirstAncestor(ClassId.BEAM)) {
        const beam = this.GetFirstAncestor(ClassId.BEAM) as unknown as BeamContract;
        if (!beam.m_crossStaff) beam.GetBeamChildOverflow?.(above, below);
      }
      else if (this.GetFirstAncestor(ClassId.FTREM)) {
        const fTrem = this.GetFirstAncestor(ClassId.FTREM) as unknown as FTremContract;
        if (!fTrem.m_crossStaff) fTrem.GetBeamChildOverflow?.(above, below);
      }
    }
    // Beams in cross-staff situation need special treatment
    else if (this.IsAnyOf([ClassId.BEAM, ClassId.FTREM]) && !this.m_crossStaff) {
      const beamInterface = this.GetBeamDrawingInterface() as { GetBeamOverflow?(above: unknown, below: unknown): void } | null;
      if (!beamInterface) throw new Error('LayerElement::GetOverflowStaffAlignments: beam drawing interface required.');
      beamInterface.GetBeamOverflow?.(above, below);
    }
  }

  /** Get above/below overflow for the chord elements */
  private GetChordOverflow(above: { value: StaffAlignmentLike | null }, below: { value: StaffAlignmentLike | null }, staffN: number): void {
    const chord = this.GetFirstAncestor(ClassId.CHORD) as unknown as ChordContract | null;
    // Dots, flags and stems with cross-staff chords need special treatment
    if (this.IsAnyOf([ClassId.DOTS, ClassId.FLAG, ClassId.STEM]) && chord && chord.HasCrossStaff?.()) {
      const staffAbove: { value: StaffContract | null } = { value: null };
      const staffBelow: { value: StaffContract | null } = { value: null };
      chord.GetCrossStaffExtremes?.(staffAbove, staffBelow);
      if (staffAbove.value && (staffAbove.value.GetN() < staffN)) {
        above.value = staffAbove.value.GetAlignment() as unknown as StaffAlignmentLike;
      }
      if (staffBelow.value && (staffBelow.value.GetN() > staffN)) {
        below.value = staffBelow.value.GetAlignment() as unknown as StaffAlignmentLike;
      }
    }
  }

  public GetGraceAlignment(): AlignmentLike | null {
    if (!this.m_graceAlignment) throw new Error('LayerElement::GetGraceAlignment: grace alignment required.');
    return this.m_graceAlignment;
  }

  public ResetGraceAlignment(): void { this.m_graceAlignment = null; }

  public SetGraceAlignment(graceAlignment: AlignmentLike): void {
    if (this.m_graceAlignment || !graceAlignment) {
      throw new Error('LayerElement::SetGraceAlignment: precondition failed.');
    }
    this.m_graceAlignment = graceAlignment;
  }

  public HasGraceAlignment(): boolean { return (this.m_graceAlignment != null); }

  //---------//
  // Alignment duration
  //---------//

  /** Shortcut assigning default values for AlignParameter (C++ overload). */
  public GetAlignmentDurationNoParams(notGraceOnly = true, notationType: number = NOTATIONTYPE_cmn): Fraction {
    const params: AlignMeterParams = { meterSig: null, mensur: null, proport: null, equivalence: DURATION_brevis, metcon: true };
    return this.GetAlignmentDuration(params, notGraceOnly, notationType);
  }

  /** Return the duration if the element has a DurationInterface. */
  public GetAlignmentDuration(params: AlignMeterParams, notGraceOnly = true, notationType: number = NOTATIONTYPE_cmn): Fraction {
    if (this.IsGraceNote() && notGraceOnly) {
      return new Fraction(0);
    }

    // Mensural chords are aligned looking at the duration of the notes
    if (this.Is(ClassId.CHORD) && IsMensuralType(notationType)) {
      let duration = new Fraction(0);
      const notes = this.FindAllDescendantsByType(ClassId.NOTE);
      for (const object of notes) {
        const note = object as unknown as NoteContract & LayerElement;
        const noteDuration = note.GetAlignmentDuration(params, notGraceOnly, notationType);
        if (noteDuration.compare(duration) > 0) duration = noteDuration;
      }
      return duration;
    }

    // Only resolve simple sameas links to avoid infinite recursion
    const sameas = this.GetLinkingInterface()!.GetSameasLink() as LayerElement | null;
    if (sameas && !sameas.GetLinkingInterface()!.HasSameasLink()) {
      return sameas.GetAlignmentDuration(params, notGraceOnly, notationType);
    }

    if (this.HasInterface(InterfaceId.INTERFACE_DURATION)) {
      let num = 1;
      let numbase = 1;

      if (params.proport) {
        // Proportion are applied reversly - higher ratio means shorter values
        if (params.proport.HasNum()) num *= params.proport.GetCumulatedNum();
        if (params.proport.HasNumbase()) numbase *= params.proport.GetCumulatedNumbase();
      }

      const tuplet = this.GetFirstAncestor(ClassId.TUPLET, MAX_TUPLET_DEPTH) as unknown as TupletContract | null;
      if (tuplet) {
        // Real Comparison required: ad-hoc predicates silently skip the tuplet ratio.
        const ids = new ClassIdsComparison([ClassId.CHORD, ClassId.NOTE, ClassId.REST, ClassId.SPACE]);
        const objects: VrvObject[] = [];
        tuplet.FindAllDescendantsByComparison(objects, ids);
        if (objects.length > 0) {
          num = tuplet.GetNum();
          numbase = tuplet.GetNumbase();
          // Adjust VRV_UNSET and 0 - which is not valid in MEI anyway
          num = Math.max(1, num);
          numbase = Math.max(1, numbase);
        }
      }
      const duration = this.GetDurationInterface() as unknown as {
        IsMensuralDur(): boolean;
        GetInterfaceAlignmentMensuralDuration(num: number, numbase: number, mensur: unknown, equivalence: number): Fraction;
        GetInterfaceAlignmentDuration(num: number, numbase: number): Fraction;
      } | null;
      if (!duration) throw new Error('LayerElement::GetAlignmentDuration: duration interface required.');
      if (duration.IsMensuralDur() && (notationType != NOTATIONTYPE_cmn)) {
        return duration.GetInterfaceAlignmentMensuralDuration(num, numbase, params.mensur, params.equivalence);
      }
      if (this.Is(ClassId.NC)) {
        // This is called only with --neume-as-note
        const neume = this.GetFirstAncestor(ClassId.NEUME);
        if (!neume) throw new Error('LayerElement::GetAlignmentDuration: neume ancestor required.');
        const syllable = neume.GetFirstAncestor(ClassId.SYLLABLE);
        if (!syllable) throw new Error('LayerElement::GetAlignmentDuration: syllable ancestor required.');
        // Add a larger gap after the last nc of the last neume in the syllable
        if (neume.GetLast() === this) {
          return (syllable.GetLast() === neume) ? NEUME_LARGE_SPACE : NEUME_MEDIUM_SPACE;
        }
        else {
          return NEUME_SMALL_SPACE;
        }
      }
      let durationValue = duration.GetInterfaceAlignmentDuration(num, numbase);
      // With fTrem we need to divide the duration by two
      const fTrem = this.GetFirstAncestor(ClassId.FTREM, MAX_FTREM_DEPTH);
      if (fTrem) {
        durationValue = durationValue.multiply(new Fraction(1, 2));
      }
      return durationValue;
    }
    else if (this.Is(ClassId.BEATRPT)) {
      const beatRpt = this as unknown as { GetBeatRptAlignmentDuration(meterUnit: number): Fraction };
      let meterUnit = DURATION_4;
      if (params.meterSig && params.meterSig.HasUnit()) meterUnit = params.meterSig.GetUnitAsDur();
      return beatRpt.GetBeatRptAlignmentDuration(meterUnit);
    }
    else if (this.Is(ClassId.TIMESTAMP_ATTR)) {
      const timestampAttr = this as unknown as { GetTimestampAttrAlignmentDuration(meterUnit: number): Fraction };
      let meterUnit = DURATION_4;
      if (params.meterSig && params.meterSig.HasUnit()) meterUnit = params.meterSig.GetUnitAsDur();
      return timestampAttr.GetTimestampAttrAlignmentDuration(meterUnit);
    }
    // We align all full measure element to the current time signature, even
    // the ones that last longer than one measure. If metcon is false, then the
    // duration will remain 0 because it cannot be determined.
    else if (params.metcon && this.IsAnyOf([ClassId.HALFMRPT, ClassId.MREST, ClassId.MULTIREST, ClassId.MRPT, ClassId.MRPT2, ClassId.MULTIRPT])) {
      let meterUnit = DURATION_4;
      let meterCount = 4;
      if (params.meterSig && params.meterSig.HasUnit()) meterUnit = params.meterSig.GetUnitAsDur();
      if (params.meterSig && params.meterSig.HasCount()) meterCount = params.meterSig.GetTotalCount();
      // C++ Fraction(data_DURATION) is the reciprocal constructor; the TS integer
      // constructor is the (num,1) overload — fromDuration selects the duration one.
      const duration = Fraction.fromDuration(meterUnit).multiply(new Fraction(meterCount));
      return (this.Is(ClassId.HALFMRPT)) ? duration.divide(new Fraction(2)) : duration;
    }
    // This is not called with --neume-as-note since otherwise each nc has an aligner
    else if (this.Is(ClassId.NEUME)) {
      const syllable = this.GetFirstAncestor(ClassId.SYLLABLE);
      if (!syllable) throw new Error('LayerElement::GetAlignmentDuration: syllable ancestor required.');
      // Add a larger gap after the last neume of the syllable
      return (syllable.GetLast() === this) ? NEUME_MEDIUM_SPACE : NEUME_SMALL_SPACE;
    }
    // This is called only with syllable without neume
    else if (this.Is(ClassId.SYLLABLE) && !this.FindDescendantByType(ClassId.NEUME)) {
      return NEUME_MEDIUM_SPACE;
    }
    else {
      return new Fraction(0);
    }
  }

  public GetSameAsContentAlignmentDuration(params: AlignMeterParams, notGraceOnly = true, notationType: number = NOTATIONTYPE_cmn): Fraction {
    const link = this.GetLinkingInterface()!.GetSameasLink() as LayerElement | null;
    if (!this.GetLinkingInterface()!.HasSameasLink() || !link?.IsAnyOf([ClassId.BEAM, ClassId.FTREM, ClassId.TUPLET])) {
      return new Fraction(0);
    }
    return link.GetContentAlignmentDuration(params, notGraceOnly, notationType);
  }

  public GetContentAlignmentDuration(params: AlignMeterParams, notGraceOnly = true, notationType: number = NOTATIONTYPE_cmn): Fraction {
    if (!this.IsAnyOf([ClassId.BEAM, ClassId.FTREM, ClassId.TUPLET])) {
      return new Fraction(0);
    }

    let duration = new Fraction(0);

    for (const child of this.GetChildren()) {
      // Skip everything that does not have a duration interface and notes in chords
      if (!child.HasInterface(InterfaceId.INTERFACE_DURATION) || (child.GetFirstAncestor(ClassId.CHORD, MAX_CHORD_DEPTH) != null)) {
        continue;
      }
      const element = child as LayerElement;
      duration = duration.add(element.GetAlignmentDuration(params, notGraceOnly, notationType));
    }

    return duration;
  }

  /**
   * Get zone bounds using child elements with facsimile information.
   * Returns true if bounds can be constructed, false otherwise.
   */
  public GenerateZoneBounds(ulx: { value: number }, uly: { value: number }, lrx: { value: number }, lry: { value: number }): boolean {
    // Set integers to extremes
    ulx.value = Number.MAX_SAFE_INTEGER;
    uly.value = Number.MAX_SAFE_INTEGER;
    lrx.value = Number.MIN_SAFE_INTEGER;
    lry.value = Number.MIN_SAFE_INTEGER;
    const childrenWithFacsimileInterface: VrvObject[] = [];
    // C++ uses InterfaceComparison(INTERFACE_FACSIMILE) here; the previous
    // duck-typed { IsSupported } object never matched because the functor
    // protocol calls comparison.call(obj).
    this.FindAllDescendantsByComparison(
      childrenWithFacsimileInterface,
      new InterfaceComparison(InterfaceId.INTERFACE_FACSIMILE));
    let result = false;
    for (const object of childrenWithFacsimileInterface) {
      const fi = object.GetFacsimileInterface() as { HasFacs(): boolean; GetZone(): { GetUlx(): number; GetUly(): number; GetLrx(): number; GetLry(): number } | null } | null;
      if (!fi) throw new Error('LayerElement::GenerateZoneBounds: facsimile interface required.');
      if (!object.Is(ClassId.SYL) && fi.HasFacs()) {
        const zone = fi.GetZone();
        if (!zone) throw new Error('LayerElement::GenerateZoneBounds: zone required.');
        ulx.value = Math.min(ulx.value, zone.GetUlx());
        uly.value = Math.min(uly.value, zone.GetUly());
        lrx.value = Math.max(lrx.value, zone.GetLrx());
        lry.value = Math.max(lry.value, zone.GetLry());
        result = true;
      }
    }
    return result;
  }

  /**
   * Helper to adjust overlapping layers for notes, chords, stems, etc.
   * Returns the shift of the adjustment.
   */
  public AdjustOverlappingLayers(
    doc: DocContract,
    otherElements: LayerElement[],
    areDotsAdjusted: boolean,
    isUnison: { value: boolean },
    stemSameas: { value: boolean },
  ): number {
    if (this.Is(ClassId.NOTE) && this.GetParent()!.Is(ClassId.CHORD)) return 0;
    else if (this.Is(ClassId.STEM) && isUnison.value) {
      isUnison.value = false;
      return 0;
    }
    else if (this.Is(ClassId.STEM) && stemSameas.value) {
      stemSameas.value = false;
      return 0;
    }

    const [margin, isInUnison] = this.CalcElementHorizontalOverlap(doc, otherElements, areDotsAdjusted, false);
    if (this.Is(ClassId.NOTE)) {
      isUnison.value = isInUnison;
      if (isUnison.value) return 0;
      const note = this as unknown as NoteContract;
      stemSameas.value = !!note.HasStemSameasNote?.();
      if (stemSameas.value) return 0;
    }

    if (this.IsAnyOf([ClassId.ACCID, ClassId.DOTS, ClassId.STEM])) {
      const parent = this.GetFirstAncestorInRange(ClassId.LAYER_ELEMENT, ClassId.LAYER_ELEMENT_max) as LayerElement | null;
      if (!parent) throw new Error('LayerElement::AdjustOverlappingLayers: layer element parent required.');
      parent.SetDrawingXRel(parent.GetDrawingXRel() + margin);
    }
    else {
      this.SetDrawingXRel(this.GetDrawingXRel() + margin);
    }
    return margin;
  }

  /**
   * Calculate note horizontal overlap with elements from another layer.
   * Returns overlapMargin and whether the element is in unison with another.
   */
  public CalcElementHorizontalOverlap(
    doc: DocContract,
    otherElements: LayerElement[],
    areDotsAdjusted: boolean,
    isChordElement: boolean,
    isLowerElement = false,
    unison = true,
  ): [number, boolean] {
    const staff = this.GetAncestorStaff();

    let isInUnison = false;
    let shift = 0;

    for (let i = 0; i < otherElements.length; ++i) {
      let verticalMargin = 0;
      let horizontalMargin = 2 * doc.GetDrawingStemWidth(staff!.m_drawingStaffSize!);
      let isUnisonElement = false;
      const other = otherElements[i];
      // Handle stem collisions
      if (this.Is(ClassId.STEM)) {
        const stem = this as unknown as StemContract;
        if (other.Is(ClassId.NOTE)) {
          shift += stem.CompareToElementPosition?.(doc, other, -shift) ?? 0;
        }
        else if (other.Is(ClassId.DOTS) && this.HorizontalSelfOverlap(other, horizontalMargin)) {
          shift += (stem.HorizontalLeftOverlap?.(other, doc, 0, 0) ?? 0) + Math.trunc(horizontalMargin / 2);
        }
        if (shift) break;
      }
      // handle note collisions
      else if (this.Is(ClassId.NOTE) && other.Is(ClassId.NOTE)) {
        const currentNote = this as unknown as NoteContract;
        const previousNote = other as unknown as NoteContract;
        isUnisonElement = !!currentNote.IsUnisonWith?.(previousNote, true);
        // Unisson, look at the duration for the note heads
        if (unison && currentNote.IsUnisonWith?.(previousNote, false)) {
          let previousDuration = previousNote.GetDrawingDur?.() ?? DURATION_4;
          const previousParent = other.GetParent();
          if (!previousParent) throw new Error('LayerElement::CalcElementHorizontalOverlap: previous note parent required.');
          const isPreviousChord = previousParent.Is(ClassId.CHORD);
          let isEdgeElement = false;
          const stemDir = currentNote.GetDrawingStemDir?.() ?? STEMDIRECTION_NONE;
          if (isPreviousChord) {
            const parentChord = previousParent as unknown as ChordContract;
            previousDuration = parentChord.GetDur?.() ?? previousDuration;
            isEdgeElement = ((STEMDIRECTION_down == stemDir) && (parentChord.GetBottomNote?.() === previousNote))
              || ((STEMDIRECTION_up == stemDir) && (parentChord.GetTopNote?.() === previousNote));
          }
          // Reduce the margin to 0 for whole notes unisson
          else if (((currentNote.GetDrawingDur?.() ?? DURATION_4) == DURATION_1) && (previousDuration == DURATION_1)) {
            horizontalMargin = 0;
          }
          if (!isPreviousChord || isEdgeElement || isChordElement) {
            if (((currentNote.GetDrawingDur?.() ?? DURATION_4) == DURATION_2) && (previousDuration == DURATION_2)) {
              isInUnison = true;
            }
            else if ((!this.IsGraceNote() && !this.GetDrawingCueSize())
              && (other.IsGraceNote() || other.GetDrawingCueSize())
              && (STEMDIRECTION_down == stemDir)) {
              // C++ `shift -= 0.8 * horizontalMargin` truncates the result, not the product.
              shift = Math.trunc(shift - 0.8 * horizontalMargin);
              continue;
            }
            else if ((this.IsGraceNote() || this.GetDrawingCueSize())
              && (!other.IsGraceNote() && !other.GetDrawingCueSize())
              && (STEMDIRECTION_up == stemDir)) {
              // C++ SetDrawingXRel(int) truncates the sum, not the product.
              this.SetDrawingXRel(Math.trunc(this.GetDrawingXRel() + 0.8 * horizontalMargin));
              isInUnison = true;
              continue;
            }
            else if (((currentNote.GetDrawingDur?.() ?? DURATION_4) > DURATION_2) && (previousDuration > DURATION_2)) {
              isInUnison = true;
            }
            if (isInUnison && ((currentNote.GetDots?.() ?? 0) == (previousNote.GetDots?.() ?? 0))) {
              continue;
            }
            else {
              isInUnison = false;
              if (((currentNote.GetDrawingDur?.() ?? DURATION_4) <= DURATION_1)
                || (previousDuration <= DURATION_1)) {
                horizontalMargin *= -1;
              }
              else {
                horizontalMargin *= ((currentNote.GetDots?.() ?? 0) >= (previousNote.GetDots?.() ?? 0)) ? 0 : -1;
              }
            }
          }
          else {
            horizontalMargin *= -1;
          }
        }
        else if (((previousNote.GetDrawingLoc?.() ?? 0) - (currentNote.GetDrawingLoc?.() ?? 0)) > 1) {
          continue;
        }
        else if (((previousNote.GetDrawingLoc?.() ?? 0) - (currentNote.GetDrawingLoc?.() ?? 0)) == 1) {
          horizontalMargin = 0;
        }
        else if (((previousNote.GetDrawingLoc?.() ?? 0) - (currentNote.GetDrawingLoc?.() ?? 0) < 0)
          && ((previousNote.GetDrawingStemDir?.() ?? 0) != (currentNote.GetDrawingStemDir?.() ?? 0))) {
          if (((previousNote.GetDrawingLoc?.() ?? 0) - (currentNote.GetDrawingLoc?.() ?? 0)) == -1) {
            horizontalMargin *= -1;
          }
          else if (((currentNote.GetDrawingDur?.() ?? DURATION_4) <= DURATION_1)
            && ((previousNote.GetDrawingDur?.() ?? DURATION_4) <= DURATION_1)) {
            continue;
          }
          else if (previousNote.m_crossStaff || this.m_crossStaff) continue;
          else {
            horizontalMargin *= -1;
            verticalMargin = horizontalMargin;
          }
        }
      }
      // handle dot collisions
      else if (this.Is(ClassId.DOTS) && !other.Is(ClassId.DOTS) && areDotsAdjusted) {
        // No need for shift if dot is adjusted
        const dot = this as unknown as DotsContract;
        if (dot.IsAdjusted?.() || !this.HorizontalSelfOverlap(other, horizontalMargin)) continue;

        if (other.IsAnyOf([ClassId.NOTE, ClassId.STEM])) {
          shift -= other.HorizontalLeftOverlap(this, doc, shift + Math.trunc(horizontalMargin / 2), 0);
        }
        else {
          shift -= this.HorizontalRightOverlap(other, doc, -shift, verticalMargin);
        }
      }
      else if (this.Is(ClassId.ACCID) && other.Is(ClassId.NOTE)) {
        const parentNote = this.GetFirstAncestor(ClassId.NOTE) as unknown as NoteContract | null;
        const otherNote = other as unknown as NoteContract;
        const isUnisonOverlap = !!parentNote && parentNote.IsUnisonWith?.(otherNote, true)
          && !parentNote.IsUnisonWith?.(otherNote, false);
        if (isUnisonOverlap && this.HorizontalContentOverlap(other))
          shift += this.HorizontalRightOverlap(other, doc, -doc.GetDrawingUnit(staff!.m_drawingStaffSize!));
      }

      if (this.Is(ClassId.NOTE) && !other.Is(ClassId.STEM)) {
        // Nothing to do if we have no vertical overlap
        if (!this.VerticalSelfOverlap(other, verticalMargin)) continue;

        // Nothing to do either if we have no horizontal overlap
        if (!this.HorizontalSelfOverlap(other, horizontalMargin + shift)) continue;

        if (horizontalMargin < 0 || isLowerElement) {
          shift -= this.HorizontalRightOverlap(other, doc, -shift, verticalMargin);
          if (!isUnisonElement) shift -= horizontalMargin;
        }
        else if ((horizontalMargin >= 0) || isChordElement) {
          shift += this.HorizontalLeftOverlap(other, doc, horizontalMargin - shift, verticalMargin);

          // Make additional adjustments for cross-staff and unison notes
          if (this.m_crossStaff) shift -= horizontalMargin;
          if (isInUnison) shift *= -1;
        }
        else {
          // Otherwise move the appropriate parent to the right
          shift -= horizontalMargin
            - this.HorizontalRightOverlap(other, doc, horizontalMargin - shift, verticalMargin);
        }
      }
      else if (this.Is(ClassId.NOTE)) {
        const currentNote = this as unknown as NoteContract;
        if (other.Is(ClassId.STEM) && (shift == 0) && areDotsAdjusted) {
          const stem = other as unknown as StemContract;
          // Nothing to do if note has same stem
          if (currentNote.HasStemSameasNote?.()) continue;

          shift -= stem.CompareToElementPosition?.(doc, this, 0) ?? 0;
        }
      }
    }

    // If note is not in unison, has accidental and were to be shifted to the
    // right - shift it to the left
    if (this.Is(ClassId.NOTE) && isChordElement && unison && (shift > 0)) {
      const currentNote = this as unknown as NoteContract;
      if (currentNote.GetDrawingAccid?.()) shift *= -1;
    }

    return [shift, isInUnison];
  }

  /** Get the stem mod for the element (if any) */
  public GetDrawingStemMod(): number {
    const stem = this as unknown as { GetStemMod?(): number } | null;
    if (!stem || typeof stem.GetStemMod !== 'function') return STEMMODIFIER_NONE;

    return stem.GetStemMod();
  }

  /** Return true if cross-staff is set */
  public HasCrossStaff(): boolean { return (this.m_crossStaff != null); }

  /** Convert stem mode to corresponding glyph code */
  public StemModToGlyph(stemMod: number): number {
    switch (stemMod) {
      case STEMMODIFIER_1slash: return SMUFL_E220_tremolo1;
      case STEMMODIFIER_2slash: return SMUFL_E221_tremolo2;
      case STEMMODIFIER_3slash: return SMUFL_E222_tremolo3;
      case STEMMODIFIER_4slash: return SMUFL_E223_tremolo4;
      case STEMMODIFIER_5slash: return SMUFL_E224_tremolo5;
      case STEMMODIFIER_6slash: return SMUFL_E224_tremolo5;
      case STEMMODIFIER_sprech: return SMUFL_E645_vocalSprechgesang;
      case STEMMODIFIER_z: return SMUFL_E22A_buzzRoll;
      default: break;
    }
    return 0;
  }

  /**
   * Calculate the optimal dot location for a note or chord.
   */
  public CalcOptimalDotLocations(): MapOfDotLocs {
    if (!this.IsAnyOf([ClassId.NOTE, ClassId.CHORD])) {
      return new Map();
    }

    const layer = this.GetFirstAncestor(ClassId.LAYER) as unknown as LayerContract | null;
    if (!layer) throw new Error('LayerElement::CalcOptimalDotLocations: layer ancestor required.');
    const layerCount = layer.GetLayerCountForTimeSpanOf(this);

    // Calculate primary/secondary dot locations
    const dotLocs1 = this.CalcDotLocations(layerCount, true);
    const dotLocs2 = this.CalcDotLocations(layerCount, false);

    // Special treatment for two layers
    if (layerCount == 2) {
      // Find the first note on the other layer, but in the same staff
      const alignment = this.GetAlignment();
      if (!alignment) throw new Error('LayerElement::CalcOptimalDotLocations: alignment required.');
      const currentStaff = this.GetAncestorStaff(StaffSearch.RESOLVE_CROSS_STAFF);
      const currentLayerN = Math.abs(this.GetAlignmentLayerN());
      const notes = alignment.FindAllDescendantsByType(ClassId.NOTE, false);
      const otherNote = notes.find((obj) => {
        const other = obj as unknown as NoteContract;
        const otherStaff = other.GetAncestorStaff?.(StaffSearch.RESOLVE_CROSS_STAFF);
        const otherLayerN = Math.abs((other.GetAlignmentLayerN?.() ?? 0));
        return ((currentLayerN != otherLayerN) && (currentStaff == otherStaff));
      }) as (VrvObject & NoteContract) | undefined;

      if (otherNote) {
        // Prefer the note's chord if it has one
        let other: LayerElement = otherNote as LayerElement;
        const chord = otherNote.IsChordTone?.();
        if (chord) other = chord as unknown as LayerElement;
        const otherLayerN = Math.abs(other.GetAlignmentLayerN());

        // Calculate the primary/secondary dot locations
        const otherDotLocs1 = other.CalcDotLocations(layerCount, true);
        const otherDotLocs2 = other.CalcDotLocations(layerCount, false);

        // Handling of unisons
        if (this.Is(ClassId.NOTE) && other.Is(ClassId.NOTE)) {
          const note = this as unknown as NoteContract;
          const otherN = other as unknown as NoteContract;
          if (note.IsUnisonWith?.(otherN, false)) {
            if ((note.GetDrawingStemDir?.() ?? 0) == STEMDIRECTION_up) {
              otherN.AlignDotsShift?.(note);
            }
            else if ((otherN.GetDrawingStemDir?.() ?? 0) == STEMDIRECTION_up) {
              note.AlignDotsShift?.(otherN);
            }
            return (currentLayerN < otherLayerN) ? dotLocs1 : dotLocs2;
          }
        }

        // Count collisions between each pair of dot choices
        const collisions11 = LayerElement.GetCollisionCount(dotLocs1, otherDotLocs1);
        const collisions12 = LayerElement.GetCollisionCount(dotLocs1, otherDotLocs2);
        const collisions21 = LayerElement.GetCollisionCount(dotLocs2, otherDotLocs1);
        const collisions22 = LayerElement.GetCollisionCount(dotLocs2, otherDotLocs2);
        const maxCollisions = Math.max(collisions11, collisions12, collisions21, collisions22);

        if (maxCollisions > 0) {
          // Collisions might occur => choose dots which minimize the number of collisions
          const minCollisions = Math.min(collisions11, collisions12, collisions21, collisions22);
          if (collisions11 == minCollisions) return dotLocs1;
          if (collisions12 == minCollisions) {
            if (collisions21 == minCollisions) {
              // Symmetric case: choose primary dot location on upper layer
              return (currentLayerN < otherLayerN) ? dotLocs1 : dotLocs2;
            }
            return dotLocs1;
          }
          return dotLocs2;
        }
      }
    }

    // Count dots to decide which set is used
    const usePrimary = (LayerElement.GetDotCount(dotLocs1) >= LayerElement.GetDotCount(dotLocs2));
    return usePrimary ? dotLocs1 : dotLocs2;
  }

  //---------//
  // Static methods for LayerElement
  //---------//

  /** Helper to count the number of dots */
  public static GetDotCount(dotLocations: MapOfDotLocs): number {
    let sum = 0;
    for (const entry of dotLocations.values()) sum += entry.size;
    return sum;
  }

  /** Helper to count the collisions between two sets of dots */
  public static GetCollisionCount(dotLocs1: MapOfDotLocs, dotLocs2: MapOfDotLocs): number {
    let count = 0;
    for (const [key, value] of dotLocs1) {
      const other = dotLocs2.get(key);
      if (other) {
        for (const v of value) if (other.has(v)) count++;
      }
    }
    return count;
  }

  //---------//
  // Functors
  //---------//

  public override Accept(functor: unknown): FunctorCode {
    const fn = (functor as Record<string, unknown>)['VisitLayerElement'];
    if (typeof fn !== 'function') {
      // C++ FunctorInterface forwards unknown Visit* methods to VisitObject
      // (default forwarding); structural functors like AddToFlatListFunctor rely
      // on this when traversing LayerElement children.
      const fallback = (functor as Record<string, unknown>)['VisitObject'];
      if (typeof fallback === 'function') return (fallback as (value: unknown) => FunctorCode).call(functor, this);
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    return (fn as (value: unknown) => FunctorCode).call(functor, this);
  }

  public AcceptConst(functor: unknown): FunctorCode {
    const fn = (functor as Record<string, unknown>)['VisitLayerElement'];
    if (typeof fn !== 'function') {
      const fallback = (functor as Record<string, unknown>)['VisitObject'];
      if (typeof fallback === 'function') return (fallback as (value: unknown) => FunctorCode).call(functor, this);
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    return (fn as (value: unknown) => FunctorCode).call(functor, this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    const fn = (functor as Record<string, unknown>)['VisitLayerElementEnd'];
    if (typeof fn !== 'function') {
      const fallback = (functor as Record<string, unknown>)['VisitObjectEnd'];
      if (typeof fallback === 'function') return (fallback as (value: unknown) => FunctorCode).call(functor, this);
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    return (fn as (value: unknown) => FunctorCode).call(functor, this);
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    const fn = (functor as Record<string, unknown>)['VisitLayerElementEnd'];
    if (typeof fn !== 'function') {
      const fallback = (functor as Record<string, unknown>)['VisitObjectEnd'];
      if (typeof fallback === 'function') return (fallback as (value: unknown) => FunctorCode).call(functor, this);
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    return (fn as (value: unknown) => FunctorCode).call(functor, this);
  }

  //---------//
  // Protected virtual surfaces (implemented by Note and Chord in C++)
  //---------//

  /**
   * Helper to figure whether two chords are fully in unison based on the
   * locations of the notes. Returns vector with all locations of elements in unison.
   */
  protected GetElementsInUnison(firstChord: Set<number>, secondChord: Set<number>, stemDirection: number): number[] {
    if (firstChord.size === 0 || secondChord.size === 0) return [];
    // Set always sorts elements, hence note locations stored will always be in
    // ascending order, regardless of how they are encoded in the MEI file
    const first = [...firstChord].sort((a, b) => a - b);
    const second = [...secondChord].sort((a, b) => a - b);
    const difference: Set<number> = new Set();
    const [big, small] = first.length > second.length ? [first, second] : [second, first];
    for (const v of big) if (!small.includes(v)) difference.add(v);

    // If there is a difference, there are two situations:
    // 1. Location is between start and end of either chords/set of notes -
    //    this means these elements cannot be in unison
    // 2. Location is lesser/greater than start/end of either - it's ok,
    //    overlapping notes can still be in unison
    if (difference.size > 0) {
      for (const element of difference) {
        if (((first.length <= second.length) && (element > first[0]) && (element < first[first.length - 1]))
          || ((first.length > second.length) && (element > second[0]) && (element < second[second.length - 1]))) {
          return [];
        }
      }
    }

    // If there are no `middle` notes, check whether chords can be in unison
    // with regards of stem direction
    if (stemDirection == STEMDIRECTION_down) {
      if ((first[first.length - 1] > second[second.length - 1]) || (first[0] > second[0])) return [];
    }
    else {
      if ((first[first.length - 1] < second[second.length - 1]) || (first[0] < second[0])) return [];
    }

    // Finally, check if notes in unison are at the proper distance to be drawn
    // as unison, as well as get number of elements in unison
    const intersection = first.filter(v => second.includes(v));
    if (intersection.length === 0) return [];
    for (let i = 0; i < intersection.length - 1; ++i) {
      if (Math.abs(intersection[i] - intersection[i + 1]) == 1) {
        return [];
      }
    }

    return intersection;
  }

  /** The note locations w.r.t. each staff, implemented for note and chord */
  protected CalcNoteLocations(_predicate: NotePredicate | null = null): MapOfNoteLocs { return new Map(); }

  /** The dot locations w.r.t. each staff, implemented for note and chord */
  protected CalcDotLocations(_layerCount: number, _primary: boolean): MapOfDotLocs { return new Map(); }

  /**
   * Returns the drawing top and bottom taking into account stem, etc.
   */
  public GetDrawingTop(doc: DocContract, staffSize: number, withArtic = true, articType: number = 0): number {
    // ARTIC_INSIDE = 0 (default)
    if (this.IsAnyOf([ClassId.NOTE, ClassId.CHORD]) && withArtic) {
      const articY = this.GetDrawingArticulationTopOrBottom(STAFFREL_basic_above, articType);
      if (articY !== VRV_UNSET) return articY;
    }

    let note: NoteContract | null = null;
    if (this.Is(ClassId.CHORD)) {
      const chord = this as unknown as ChordContract;
      note = chord.GetTopNote?.() ?? null;
    }
    else if (this.Is(ClassId.NOTE)) {
      note = this as unknown as NoteContract;
    }

    if (note) {
      const durationInterface = this.GetDurationInterface() as unknown as { GetNoteOrChordDur(element: unknown): number } | null;
      if (!durationInterface) throw new Error('LayerElement::GetDrawingTop: duration interface required.');
      if (durationInterface.GetNoteOrChordDur(this) < DURATION_2) {
        return note.GetDrawingY!() + doc.GetDrawingUnit(staffSize);
      }
      // We should also take into account the stem shift to the right
      const stemmedDrawingInterface = this.GetStemmedDrawingInterface() as unknown as {
        GetDrawingStemDir(): number;
        GetDrawingStemEnd(object: unknown): { y: number };
      } | null;
      if (!stemmedDrawingInterface) throw new Error('LayerElement::GetDrawingTop: stemmed drawing interface required.');
      if (stemmedDrawingInterface.GetDrawingStemDir() == STEMDIRECTION_up) {
        return stemmedDrawingInterface.GetDrawingStemEnd(this).y;
      }
      else {
        // this does not take into account the glyph's actual size
        return note.GetDrawingY!() + doc.GetDrawingUnit(staffSize);
      }
    }
    return this.GetDrawingY();
  }

  public GetDrawingBottom(doc: DocContract, staffSize: number, withArtic = true, articType: number = 0): number {
    if (this.IsAnyOf([ClassId.NOTE, ClassId.CHORD]) && withArtic) {
      const articY = this.GetDrawingArticulationTopOrBottom(STAFFREL_basic_below, articType);
      if (articY !== -VRV_UNSET) return articY;
    }

    let note: NoteContract | null = null;
    if (this.Is(ClassId.CHORD)) {
      const chord = this as unknown as ChordContract;
      note = chord.GetBottomNote?.() ?? null;
    }
    else if (this.Is(ClassId.NOTE)) {
      note = this as unknown as NoteContract;
    }

    if (note) {
      const durationInterface = this.GetDurationInterface() as unknown as { GetNoteOrChordDur(element: unknown): number } | null;
      if (!durationInterface) throw new Error('LayerElement::GetDrawingBottom: duration interface required.');
      if (durationInterface.GetNoteOrChordDur(this) < DURATION_2) {
        return note.GetDrawingY!() - doc.GetDrawingUnit(staffSize);
      }
      const stemmedDrawingInterface = this.GetStemmedDrawingInterface() as unknown as {
        GetDrawingStemDir(): number;
        GetDrawingStemEnd(object: unknown): { y: number };
      } | null;
      if (!stemmedDrawingInterface) throw new Error('LayerElement::GetDrawingBottom: stemmed drawing interface required.');
      if (stemmedDrawingInterface.GetDrawingStemDir() == STEMDIRECTION_up) {
        // this does not take into account the glyph's actual size
        return note.GetDrawingY!() - doc.GetDrawingUnit(staffSize);
      }
      else {
        return stemmedDrawingInterface.GetDrawingStemEnd(this).y;
      }
    }
    return this.GetDrawingY();
  }

  /** Return the drawing radius for notes and chords */
  public GetDrawingRadius(doc: DocContract, isInLigature = false): number {
    if (!this.IsAnyOf([ClassId.CHORD, ClassId.NC, ClassId.NOTE, ClassId.REST])) return 0;

    let code = 0;
    let dur = DURATION_4;
    const staff = this.GetAncestorStaff();
    let isMensuralDur = false;
    if (this.Is(ClassId.NOTE)) {
      const note = this as unknown as NoteContract;
      dur = note.GetDrawingDur?.() ?? DURATION_4;
      isMensuralDur = !!note.IsMensuralDur?.();
      if (isMensuralDur && !isInLigature) {
        code = note.GetMensuralNoteheadGlyph?.() ?? 0;
      }
      else {
        code = note.GetNoteheadGlyph?.(dur) ?? 0;
      }
    }
    else if (this.Is(ClassId.CHORD)) {
      const chord = this as unknown as ChordContract;
      dur = chord.GetActualDur?.() ?? DURATION_4;
      isMensuralDur = !!chord.IsMensuralDur?.();
      if (dur == DURATION_breve) {
        code = SMUFL_E0A1_noteheadDoubleWholeSquare;
      }
      else if (dur == DURATION_1) {
        code = SMUFL_E0A2_noteheadWhole;
      }
      else if (dur == DURATION_2) {
        code = SMUFL_E0A3_noteheadHalf;
      }
      else {
        code = SMUFL_E0A4_noteheadBlack;
      }
    }
    else if (this.IsAnyOf([ClassId.REST, ClassId.NC])) {
      code = SMUFL_E0A4_noteheadBlack;
    }

    // Mensural note shorter than DURATION_breve
    if ((isMensuralDur && (dur <= DURATION_breve)) || ((dur == DURATION_1) && isInLigature)) {
      const widthFactor = (dur == DURATION_maxima) ? 2 : 1;
      if (staff!.m_drawingNotationType == NOTATIONTYPE_mensural_black) {
        return Math.trunc(widthFactor * doc.GetDrawingBrevisWidth(staff!.m_drawingStaffSize!) * 0.7);
      }
      else {
        return Math.trunc(widthFactor * doc.GetDrawingBrevisWidth(staff!.m_drawingStaffSize!));
      }
    }

    return Math.trunc(doc.GetGlyphWidth(code, staff!.m_drawingStaffSize!, this.GetDrawingCueSize()) / 2);
  }

  private GetDrawingArticulationTopOrBottom(place: number, _type: number): number {
    // It would not crash otherwise but there is no reason to call it
    if (!this.IsAnyOf([ClassId.NOTE, ClassId.CHORD])) return VRV_UNSET;

    const artics: VrvObject[] = [];
    // Process backward because we want the farest away artic
    this.FindAllDescendantsByComparison(
      artics,
      new ClassIdComparison(ClassId.ARTIC),
      -1 /* UNLIMITED_DEPTH */, VrvObject.BACKWARD);
    // Process backward because we want the farest away artic
    let artic: ArticContract | null = null;
    for (const child of artics) {
      artic = child as unknown as ArticContract;
      if (artic.GetDrawingPlace?.() === place) break;
      artic = null;
    }

    let y = (place == STAFFREL_basic_above) ? VRV_UNSET : -VRV_UNSET;
    if (artic) {
      y = (place == STAFFREL_basic_above) ? (artic.GetSelfTop?.() ?? y) : (artic.GetSelfBottom?.() ?? y);
    }

    return y;
  }
}

// ponytail: FindAllDescendantsByComparison2 on TupletContract is a structural
// stand-in until the canonical comparison surface is unified; upgrade when
// comparison/tuplet units are migrated.
