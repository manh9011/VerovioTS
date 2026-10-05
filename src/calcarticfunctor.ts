/**
 * Pure TypeScript translation of Verovio's src/calcarticfunctor.cpp
 * / include/vrv/calcarticfunctor.h.
 *
 * Calculates the drawing placement of outside articulations relative to their
 * parent chord/note. Unmigrated tree/layout classes (Staff, Layer, Beam, ...)
 * are represented by structural contracts; no layout algorithm is invented.
 */
import { DocFunctor } from './functor.js';
import { BEAMPLACE_above, BEAMPLACE_below, STEMDIRECTION_down, STEMDIRECTION_NONE, STEMDIRECTION_up } from './drawinginterface.js';
import { ClassId, FunctorCode, STAFFREL_above, STAFFREL_below } from './vrvdef.js';

// Canonical data_STAFFREL ordinals from src-cpp/libmei/dist/atttypes.h.
const STAFFREL_NONE = 0;
// Canonical data_ARTICULATION ordinals from src-cpp/libmei/dist/atttypes.h
// (NONE=0, acc=1, acc_inv=2, acc_long=3, acc_soft=4, stacc=5, ten=6, stacciss=7).
const ARTICULATION_stacc = 5;
const ARTICULATION_stacciss = 7;
// StaffSearch::RESOLVE_CROSS_STAFF from src-cpp/include/vrv/layerelement.h.
const RESOLVE_CROSS_STAFF = 1;

export interface CalcArticStaffLike {
  m_drawingStaffSize: number;
}

export interface CalcArticLayerLike {
  GetDrawingStemDir(element: unknown): number;
}

export interface CalcArticStemLike {
  IsVirtual(): boolean;
}

export interface CalcArticBeamLike {
  m_drawingPlace: number;
  GetAncestorStaff(strategy: number): CalcArticStaffLike | null;
}

export interface CalcArticParentLike {
  m_crossStaff: unknown;
  m_crossLayer: unknown;
  GetDrawingStemDir(): number;
  GetAncestorStaff(): CalcArticStaffLike | null;
  GetFirstAncestor(classId: ClassId): CalcArticLayerLike | null;
  FindDescendantByType(classId: ClassId): CalcArticStemLike | null;
  GetDrawingRadius(doc: unknown): number;
  GetChildCount(classId: ClassId): number;
  GetAncestorBeam(): CalcArticBeamLike | null;
  GetCrossStaffExtremes?(
    staffAbove: { value: CalcArticStaffLike | null },
    staffBelow: { value: CalcArticStaffLike | null },
    layerAbove?: { value: CalcArticLayerLike | null },
    layerBelow?: { value: CalcArticLayerLike | null },
  ): void;
  IsChordTone?(): boolean;
}

export interface CalcArticArticLike {
  m_crossStaff: unknown;
  m_crossLayer: unknown;
  GetPlace(): number;
  SetDrawingPlace(place: number): void;
  GetDrawingPlace(): number;
  IsOutsideArtic(): boolean;
  AlwaysAbove(): boolean;
  GetArticFirst(): number;
  GetAncestorStaff(): CalcArticStaffLike | null;
  GetFirstAncestor(classId: ClassId): CalcArticLayerLike | null;
  SetDrawingXRel(value: number): void;
}

export interface CalcArticDocLike {
  GetDrawingStemWidth(staffSize: number): number;
  GetOptions(): { m_staccatoCenter: { GetValue(): boolean } };
}

function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`CalcArticFunctor: ${message}`);
}

export class CalcArticFunctor extends DocFunctor {
  private m_parent: CalcArticParentLike | null = null;
  private m_stemDir = STEMDIRECTION_NONE;
  private m_staffAbove: CalcArticStaffLike | null = null;
  private m_staffBelow: CalcArticStaffLike | null = null;
  private m_layerAbove: CalcArticLayerLike | null = null;
  private m_layerBelow: CalcArticLayerLike | null = null;
  private m_crossStaffAbove = false;
  private m_crossStaffBelow = false;

  public constructor(doc: unknown) {
    super(doc);
    this.m_parent = null;
    this.m_stemDir = STEMDIRECTION_NONE;
    this.m_staffAbove = null;
    this.m_staffBelow = null;
    this.m_layerAbove = null;
    this.m_layerBelow = null;
    this.m_crossStaffAbove = false;
    this.m_crossStaffBelow = false;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitArtic(artic: CalcArticArticLike): FunctorCode {
    if (!this.m_parent) return FunctorCode.FUNCTOR_CONTINUE;

    /************** placement **************/

    let layer = artic.GetFirstAncestor(ClassId.LAYER);
    assertInvariant(layer, 'expected layer ancestor');
    const parent = this.m_parent;

    if (parent.m_crossLayer) {
      layer = parent.m_crossLayer as CalcArticLayerLike;
    }

    let allowAbove = true;
    let layerStemDir: number;

    // for now we ignore within @place
    if (artic.GetPlace() !== STAFFREL_NONE) {
      artic.SetDrawingPlace(artic.GetPlace());
      // if we have a place indication do not allow to be changed to above
      allowAbove = false;
    }
    else if ((layerStemDir = layer.GetDrawingStemDir(parent)) !== STEMDIRECTION_NONE) {
      artic.SetDrawingPlace(layerStemDir === STEMDIRECTION_up ? STAFFREL_above : STAFFREL_below);
      // If we have more than one layer do not allow to be changed to above
      allowAbove = false;
    }
    else if (this.m_stemDir === STEMDIRECTION_up) {
      artic.SetDrawingPlace(STAFFREL_below);
    }
    else {
      artic.SetDrawingPlace(STAFFREL_above);
    }

    // Not sure what this is anymore...
    if (artic.IsOutsideArtic()) {
      // If allowAbove is true it will place the artic above if the content requires so (even if place below is given)
      if (artic.GetDrawingPlace() === STAFFREL_below && allowAbove && artic.AlwaysAbove()) {
        artic.SetDrawingPlace(STAFFREL_above);
      }
    }

    /************** adjust the xRel position **************/

    const stem = parent.FindDescendantByType(ClassId.STEM);
    assertInvariant(stem, 'expected stem descendant');
    artic.SetDrawingXRel(this.CalculateHorizontalShift(artic, stem.IsVirtual()));

    /************** set cross-staff / layer **************/

    // Exception for artic because they are relative to the staff - we set m_crossStaff and m_crossLayer
    if (artic.GetDrawingPlace() === STAFFREL_above && this.m_crossStaffAbove) {
      artic.m_crossStaff = this.m_staffAbove;
      artic.m_crossLayer = this.m_layerAbove;
    }
    else if (artic.GetDrawingPlace() === STAFFREL_below && this.m_crossStaffBelow) {
      artic.m_crossStaff = this.m_staffBelow;
      artic.m_crossLayer = this.m_layerBelow;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitChord(chord: CalcArticParentLike): FunctorCode {
    this.m_parent = chord;
    this.m_stemDir = chord.GetDrawingStemDir();

    const staff = chord.GetAncestorStaff();
    const layer = chord.GetFirstAncestor(ClassId.LAYER);
    assertInvariant(layer, 'expected layer ancestor');

    this.m_staffAbove = staff;
    this.m_staffBelow = staff;
    this.m_layerAbove = layer;
    this.m_layerBelow = layer;
    this.m_crossStaffAbove = false;
    this.m_crossStaffBelow = false;

    if (chord.m_crossStaff) {
      this.m_staffAbove = chord.m_crossStaff as CalcArticStaffLike;
      this.m_staffBelow = chord.m_crossStaff as CalcArticStaffLike;
      this.m_layerAbove = chord.m_crossLayer as CalcArticLayerLike;
      this.m_layerBelow = chord.m_crossLayer as CalcArticLayerLike;
      this.m_crossStaffAbove = true;
      this.m_crossStaffBelow = true;
    }
    else {
      const staffAbove = { value: null as CalcArticStaffLike | null };
      const staffBelow = { value: null as CalcArticStaffLike | null };
      const layerAbove = { value: null as CalcArticLayerLike | null };
      const layerBelow = { value: null as CalcArticLayerLike | null };
      assertInvariant(chord.GetCrossStaffExtremes, 'expected GetCrossStaffExtremes');
      chord.GetCrossStaffExtremes(staffAbove, staffBelow, layerAbove, layerBelow);
      this.m_staffAbove = staffAbove.value;
      this.m_staffBelow = staffBelow.value;
      this.m_layerAbove = layerAbove.value;
      this.m_layerBelow = layerBelow.value;
      if (this.m_staffAbove) {
        this.m_crossStaffAbove = true;
        this.m_staffBelow = staff;
        this.m_layerBelow = layer;
      }
      else if (this.m_staffBelow) {
        this.m_crossStaffBelow = true;
        this.m_staffAbove = staff;
        this.m_layerAbove = layer;
      }
    }

    this.IncludeBeamStaff(chord);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNote(note: CalcArticParentLike): FunctorCode {
    if (note.IsChordTone?.()) return FunctorCode.FUNCTOR_CONTINUE;

    this.m_parent = note;
    this.m_stemDir = note.GetDrawingStemDir();

    const staff = note.GetAncestorStaff();
    const layer = note.GetFirstAncestor(ClassId.LAYER);
    assertInvariant(layer, 'expected layer ancestor');

    this.m_staffAbove = staff;
    this.m_staffBelow = staff;
    this.m_layerAbove = layer;
    this.m_layerBelow = layer;
    this.m_crossStaffAbove = false;
    this.m_crossStaffBelow = false;

    if (note.m_crossStaff) {
      this.m_staffAbove = note.m_crossStaff as CalcArticStaffLike;
      this.m_staffBelow = note.m_crossStaff as CalcArticStaffLike;
      this.m_layerAbove = note.m_crossLayer as CalcArticLayerLike;
      this.m_layerBelow = note.m_crossLayer as CalcArticLayerLike;
      this.m_crossStaffAbove = true;
      this.m_crossStaffBelow = true;
    }

    this.IncludeBeamStaff(note);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  private CalculateHorizontalShift(artic: CalcArticArticLike, virtualStem: boolean): number {
    assertInvariant(this.m_parent, 'expected parent element');
    const doc = this.m_doc as unknown as CalcArticDocLike;
    let shift = this.m_parent.GetDrawingRadius(this.m_doc);
    if (virtualStem || this.m_parent.GetChildCount(ClassId.ARTIC) > 1 || doc.GetOptions().m_staccatoCenter.GetValue()) {
      return shift;
    }
    switch (artic.GetArticFirst()) {
      case ARTICULATION_stacc:
      case ARTICULATION_stacciss: {
        const staff = artic.GetAncestorStaff();
        assertInvariant(staff, 'expected staff ancestor');
        const stemWidth = doc.GetDrawingStemWidth(staff.m_drawingStaffSize);
        // C++ int division at the stemWidth / 2 boundary; Math.trunc preserves it.
        if (this.m_stemDir === STEMDIRECTION_up && artic.GetDrawingPlace() === STAFFREL_above) {
          shift += shift - Math.trunc(stemWidth / 2);
        }
        else if (this.m_stemDir === STEMDIRECTION_down && artic.GetDrawingPlace() === STAFFREL_below) {
          shift = Math.trunc(stemWidth / 2);
        }
        break;
      }
      default: {
        break;
      }
    }

    return shift;
  }

  private IncludeBeamStaff(layerElement: CalcArticParentLike): void {
    const beam = layerElement.GetAncestorBeam();
    if (beam) {
      if (this.m_crossStaffAbove && beam.m_drawingPlace === BEAMPLACE_above) {
        this.m_staffAbove = beam.GetAncestorStaff(RESOLVE_CROSS_STAFF);
      }
      else if (this.m_crossStaffBelow && beam.m_drawingPlace === BEAMPLACE_below) {
        this.m_staffBelow = beam.GetAncestorStaff(RESOLVE_CROSS_STAFF);
      }
    }
  }
}
