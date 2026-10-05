/**
 * Pure TypeScript translation of Verovio's src/calcbboxoverflowsfunctor.cpp
 * / include/vrv/calcbboxoverflowsfunctor.h.
 *
 * Fills the per-StaffAlignment above/below overflow boxes for drawn layer
 * elements. Unmigrated tree/layout classes (Layer, Staff, Beam, Stem,
 * StaffAlignment, ...) are represented by structural contracts; no layout
 * algorithm is invented.
 */
import { DocFunctor } from './functor.js';
import { ClassId, ElementScoreDefRole, FunctorCode } from './vrvdef.js';

export interface CalcBBoxOverflowsStaffAlignmentLike {
  GetStaffSize(): number;
  CalcOverflowAbove(element: unknown): number;
  CalcOverflowBelow(element: unknown): number;
  SetOverflowAbove(value: number): void;
  SetOverflowBelow(value: number): void;
  SetScoreDefClefOverflowAbove(value: number): void;
  SetScoreDefClefOverflowBelow(value: number): void;
  AddBBoxAbove(element: unknown): void;
  AddBBoxBelow(element: unknown): void;
}

export interface CalcBBoxOverflowsLayerElementLike {
  HasSelfBB(): boolean;
  GetScoreDefRole(): ElementScoreDefRole;
  GetOverflowStaffAlignments(
    above: { value: CalcBBoxOverflowsStaffAlignmentLike | null },
    below: { value: CalcBBoxOverflowsStaffAlignmentLike | null },
  ): void;
  GetAncestorBeam(): unknown;
  GetFirstAncestor(classId: ClassId): unknown;
  GetIsInBeamSpan(): boolean;
  GetParent(): { m_crossStaff?: unknown } | null;
  m_crossStaff: unknown;
  m_crossLayer: unknown;
}

export interface CalcBBoxOverflowsObjectLike extends CalcBBoxOverflowsLayerElementLike {
  Is(classId: ClassId): boolean;
  IsSystemElement(): boolean;
  IsControlElement(): boolean;
  IsLayerElement(): boolean;
  DrawingIsVisible?(): boolean;
}

export interface CalcBBoxOverflowsLayerLike {
  GetCautionStaffDefClef(): unknown;
  GetCautionStaffDefKeySig(): unknown;
  GetCautionStaffDefMensur(): unknown;
  GetCautionStaffDefMeterSig(): unknown;
  HasCursor(): boolean;
  GetCursor(): unknown;
  GetStaffDefClef(): unknown;
  GetStaffDefKeySig(): unknown;
  GetStaffDefMensur(): unknown;
  GetStaffDefMeterSig(): unknown;
}

export interface CalcBBoxOverflowsDocLike {
  GetDrawingStaffLineWidth(staffSize: number): number;
}

function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`CalcBBoxOverflowsFunctor: ${message}`);
}

export class CalcBBoxOverflowsFunctor extends DocFunctor {
  public constructor(doc: unknown) {
    super(doc);
  }

  public override ImplementsEndInterface(): boolean {
    return true;
  }

  // C++ FunctorInterface defaults forward each of these to VisitLayerElement;
  // TypeScript declaration merging provides only the type surface, so the
  // runtime override forwards explicitly (same gap as pass 254/255).
  public VisitClef(clef: unknown): FunctorCode {
    return this.VisitObject(clef as CalcBBoxOverflowsObjectLike);
  }

  public VisitKeySig(keySig: unknown): FunctorCode {
    return this.VisitObject(keySig as CalcBBoxOverflowsObjectLike);
  }

  public VisitMensur(mensur: unknown): FunctorCode {
    return this.VisitObject(mensur as CalcBBoxOverflowsObjectLike);
  }

  public VisitMeterSig(meterSig: unknown): FunctorCode {
    return this.VisitObject(meterSig as CalcBBoxOverflowsObjectLike);
  }

  public VisitCursor(cursor: unknown): FunctorCode {
    return this.VisitObject(cursor as CalcBBoxOverflowsObjectLike);
  }

  public VisitLayer(layer: CalcBBoxOverflowsLayerLike): FunctorCode {
    const currentLayer = layer;
    assertInvariant(currentLayer, 'expected layer');
    // set scoreDef attr
    if (currentLayer.GetStaffDefClef()) {
      // System scoreDef clefs are taken into account but treated separately (see below)
      this.VisitClef(currentLayer.GetStaffDefClef());
    }
    if (currentLayer.GetStaffDefKeySig()) {
      this.VisitKeySig(currentLayer.GetStaffDefKeySig());
    }
    if (currentLayer.GetStaffDefMensur()) {
      this.VisitMensur(currentLayer.GetStaffDefMensur());
    }
    if (currentLayer.GetStaffDefMeterSig()) {
      this.VisitMeterSig(currentLayer.GetStaffDefMeterSig());
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerEnd(layer: CalcBBoxOverflowsLayerLike): FunctorCode {
    // set scoreDef attr
    if (layer.GetCautionStaffDefClef()) {
      this.VisitClef(layer.GetCautionStaffDefClef());
    }
    if (layer.GetCautionStaffDefKeySig()) {
      this.VisitKeySig(layer.GetCautionStaffDefKeySig());
    }
    if (layer.GetCautionStaffDefMensur()) {
      this.VisitMensur(layer.GetCautionStaffDefMensur());
    }
    if (layer.GetCautionStaffDefMeterSig()) {
      this.VisitMeterSig(layer.GetCautionStaffDefMeterSig());
    }
    if (layer.HasCursor()) {
      this.VisitCursor(layer.GetCursor());
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitObject(object: CalcBBoxOverflowsObjectLike): FunctorCode {
    // starting a new staff
    if (object.Is(ClassId.STAFF)) {
      const currentStaff = object;
      assertInvariant(currentStaff, 'expected staff');
      if (currentStaff.DrawingIsVisible && !currentStaff.DrawingIsVisible()) {
        return FunctorCode.FUNCTOR_SIBLINGS;
      }
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    // starting new layer
    if (object.Is(ClassId.LAYER)) {
      return this.VisitLayer(object as unknown as CalcBBoxOverflowsLayerLike);
    }

    if (object.IsSystemElement()) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (object.IsControlElement()) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (!object.IsLayerElement()) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    // Take into account beam in cross-staff situation
    if (object.Is(ClassId.BEAM)) {
      const beam = object as unknown as { m_crossStaffContent: unknown; m_crossStaff: unknown };
      assertInvariant(beam, 'expected beam');
      // Ignore it if it has cross-staff content but is not entirely cross-staff itself
      if (beam.m_crossStaffContent && !beam.m_crossStaff) return FunctorCode.FUNCTOR_CONTINUE;
    }

    // Take into account stem for notes in cross-staff situation and in beams
    if (object.Is(ClassId.STEM)) {
      const parent = object.GetParent();
      const noteOrChord = parent as unknown as CalcBBoxOverflowsLayerElementLike | null;
      if (noteOrChord && noteOrChord.m_crossStaff) {
        if (noteOrChord.GetAncestorBeam()) {
          const beam = noteOrChord.GetFirstAncestor(ClassId.BEAM) as unknown as { m_crossStaff: unknown };
          assertInvariant(beam, 'expected beam');
          // Ignore it but only if the beam is not entirely cross-staff itself
          if (!beam.m_crossStaff) return FunctorCode.FUNCTOR_CONTINUE;
        }
        else if (noteOrChord.GetIsInBeamSpan()) {
          return FunctorCode.FUNCTOR_CONTINUE;
        }
      }
    }

    if (object.Is(ClassId.FB) || object.Is(ClassId.FIGURE)) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (object.Is(ClassId.SYL)) {
      // We don't want to add the syl to the overflow since lyrics require a full line anyway
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (!object.HasSelfBB()) {
      // if nothing was drawn, do not take it into account
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    const current = object;
    assertInvariant(current, 'expected layer element');

    const above = { value: null as CalcBBoxOverflowsStaffAlignmentLike | null };
    const below = { value: null as CalcBBoxOverflowsStaffAlignmentLike | null };
    current.GetOverflowStaffAlignments(above, below);

    let isScoreDefClef = false;
    // Exception for the scoreDef clef where we do not want to take into account the general overflow
    // We have instead distinct members in StaffAlignment to store them
    if (object.Is(ClassId.CLEF) && current.GetScoreDefRole() === ElementScoreDefRole.SCOREDEF_SYSTEM) {
      isScoreDefClef = true;
    }

    const doc = this.m_doc as unknown as CalcBBoxOverflowsDocLike;
    if (above.value) {
      const overflowAbove = above.value.CalcOverflowAbove(current);
      const staffSize = above.value.GetStaffSize();
      // C++ int division at the / 2 boundary; Math.trunc preserves it.
      if (overflowAbove > Math.trunc(doc.GetDrawingStaffLineWidth(staffSize) / 2)) {
        if (isScoreDefClef) {
          above.value.SetScoreDefClefOverflowAbove(overflowAbove);
        }
        else {
          above.value.SetOverflowAbove(overflowAbove);
        }
        above.value.AddBBoxAbove(current);
      }
    }

    if (below.value) {
      const overflowBelow = below.value.CalcOverflowBelow(current);
      const staffSize = below.value.GetStaffSize();
      if (overflowBelow > Math.trunc(doc.GetDrawingStaffLineWidth(staffSize) / 2)) {
        if (isScoreDefClef) {
          below.value.SetScoreDefClefOverflowBelow(overflowBelow);
        }
        else {
          below.value.SetOverflowBelow(overflowBelow);
        }
        below.value.AddBBoxBelow(current);
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
