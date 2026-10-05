/**
 * Pure TypeScript translation of Verovio's src/adjustlayersfunctor.cpp.
 *
 * Control flow, ordering and mutation semantics mirror the canonical C++ source.
 * Native/layout collaborators that are not yet migrated are expressed as structural
 * contracts; no native or WebAssembly runtime is introduced.
 */
import { DocFunctor } from './functor.js';
import { Note } from './note.js';
import { ClassId, FunctorCode, VRV_UNSET } from './vrvdef.js';
import { Filters, AttNIntegerAnyComparison } from './comparison.js';

export const ALIGNMENT_REFERENCE = ClassId.ALIGNMENT_REFERENCE;
export const BARLINE_REFERENCES = -1;
export const RESOLVE_CROSS_STAFF = 1;

export interface AdjustLayersDocLike {
  GetDrawingLedgerLineExtension(staffSize: number, cueSize: number): number;
  noteCollisionResolver?: AdjustLayersNoteCollisionResolverLike;
}

export interface AdjustLayersNoteCollisionResolverLike {
  HandleLedgerLineStemCollision(
    doc: AdjustLayersDocLike,
    staff: AdjustLayersStaffLike,
    currentNote: AdjustLayersLayerElementLike,
    previousNote: AdjustLayersLayerElementLike,
  ): boolean;
}

export interface AdjustLayersStaffLike {
  m_drawingStaffSize: number;
}

export interface AdjustLayersObjectLike {
  Is(classId: ClassId): boolean;
  IsAnyOf(classIds: ClassId[]): boolean;
  GetAlignmentLayerN(): number;
  GetAncestorStaff(resolveCrossStaff?: number): AdjustLayersStaffLike | null;
  GetDrawingCueSize(): number;
  GetDrawingXRel(): number;
  SetDrawingXRel(value: number): void;
  HasSelfBB(): boolean;
  IsScoreDefElement(): boolean;
  AdjustOverlappingLayers(
    doc: AdjustLayersDocLike,
    previous: AdjustLayersLayerElementLike[],
    includeDots: boolean,
    unison: { value: boolean },
    stemSameas: { value: boolean },
  ): number;
}

export interface AdjustLayersLayerElementLike extends AdjustLayersObjectLike {}

export interface AdjustLayersNoteLike extends AdjustLayersLayerElementLike {
  IsChordTone(): AdjustLayersLayerElementLike | null;
}

export interface AdjustLayersAlignmentReferenceLike {
  HasMultipleLayer(): boolean;
}

export interface AdjustLayersFiltersLike {
  Clear(): void;
  Add(comparison: unknown): void;
}

export interface AdjustLayersMeasureAlignerLike {
  Process(functor: unknown): void;
}

export interface AdjustLayersMeasureLike {
  HasAlignmentRefWithMultipleLayers(): boolean;
  m_measureAligner: AdjustLayersMeasureAlignerLike;
}

export interface AdjustLayersScoreDefLike {
  GetStaffNs(): number[];
}

export interface AdjustLayersSystemLike {
  GetDrawingScoreDef(): AdjustLayersScoreDefLike | null;
}

function isNote(element: AdjustLayersLayerElementLike): boolean {
  return element.Is(ClassId.NOTE);
}

function isChord(element: AdjustLayersLayerElementLike): boolean {
  return element.Is(ClassId.CHORD);
}

export class AdjustLayersFunctor extends DocFunctor {
  private m_staffNs: number[] = [];
  private m_currentLayerN = VRV_UNSET;
  private m_previous: AdjustLayersLayerElementLike[] = [];
  private m_current: AdjustLayersLayerElementLike[] = [];
  private m_unison = false;
  private m_ignoreDots = true;
  private m_stemSameas = false;
  private m_accumulatedShift = 0;

  public constructor(doc: AdjustLayersDocLike) {
    super(doc);
    this.m_currentLayerN = VRV_UNSET;
    this.m_unison = false;
    this.m_ignoreDots = true;
    this.m_stemSameas = false;
    this.m_accumulatedShift = 0;
  }

  public override ImplementsEndInterface(): boolean {
    return true;
  }

  public IgnoreDots(ignoreDots: boolean): void {
    this.m_ignoreDots = ignoreDots;
  }

  public VisitAlignmentReference(alignmentReference: AdjustLayersAlignmentReferenceLike): FunctorCode {
    if (!alignmentReference.HasMultipleLayer()) return FunctorCode.FUNCTOR_SIBLINGS;

    this.m_currentLayerN = VRV_UNSET;
    this.m_current.length = 0;
    this.m_previous.length = 0;
    this.m_accumulatedShift = 0;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitAlignmentReferenceEnd(_alignmentReference: AdjustLayersAlignmentReferenceLike): FunctorCode {
    if (this.m_current.length === 0) return FunctorCode.FUNCTOR_CONTINUE;

    const firstElem = this.m_current[0];
    const staff = firstElem.GetAncestorStaff(RESOLVE_CROSS_STAFF);
    if (!staff) throw new Error('AdjustLayersFunctor: ancestor staff invariant violated');

    const extension = this.m_doc.GetDrawingLedgerLineExtension(
      staff.m_drawingStaffSize,
      firstElem.GetDrawingCueSize(),
    );

    if (Math.abs(this.m_accumulatedShift) < 2 * extension && this.m_ignoreDots) {
      let handleLedgerLineStemCollision = false;

      outer: for (const currentElem of this.m_current) {
        if (!isNote(currentElem)) continue;
        for (const previousElem of this.m_previous) {
          if (!isNote(previousElem)) continue;

          const collisionResolver = this.m_doc.noteCollisionResolver ?? Note;
          if (collisionResolver.HandleLedgerLineStemCollision(
            this.m_doc, staff, currentElem, previousElem,
          )) {
            handleLedgerLineStemCollision = true;
            break outer;
          }
        }
      }

      if (handleLedgerLineStemCollision) {
        const note = this.m_current.find((elem) => isNote(elem));
        if (!note) throw new Error('AdjustLayersFunctor: NOTE invariant violated');

        const chord = (note as AdjustLayersNoteLike).IsChordTone();
        const element = chord ?? note;
        const shift = 2 * extension - Math.abs(this.m_accumulatedShift);
        element.SetDrawingXRel(element.GetDrawingXRel() - shift);
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: AdjustLayersLayerElementLike): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    if (this.m_current.length > 0 && layerElement.GetAlignmentLayerN() !== this.m_currentLayerN) {
      this.m_previous.push(...this.m_current);
      this.m_current.length = 0;
    }

    this.m_currentLayerN = layerElement.GetAlignmentLayerN();

    if (layerElement.HasSelfBB()) {
      if (layerElement.IsAnyOf([ClassId.NOTE, ClassId.STEM])) {
        this.m_current.push(layerElement);
      } else if (!this.m_ignoreDots && layerElement.Is(ClassId.DOTS)) {
        this.m_current.push(layerElement);
      }
    }

    if (this.m_previous.length === 0) return FunctorCode.FUNCTOR_SIBLINGS;

    // C++ passes bool & by reference; TS boolean is primitive (by value), wrap in object
    const unisonWrapper = { value: this.m_unison };
    const stemSameasWrapper = { value: this.m_stemSameas };
    const shift = layerElement.AdjustOverlappingLayers(
      this.m_doc,
      this.m_previous,
      !this.m_ignoreDots,
      unisonWrapper,
      stemSameasWrapper,
    );
    this.m_unison = unisonWrapper.value;
    this.m_stemSameas = stemSameasWrapper.value;
    this.m_accumulatedShift += shift;

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasure(measure: AdjustLayersMeasureLike): FunctorCode {
    if (!measure.HasAlignmentRefWithMultipleLayers()) return FunctorCode.FUNCTOR_SIBLINGS;

    const filters = new Filters();
    const previousFilters = this.SetFilters(filters);

    for (const n of this.m_staffNs) {
      filters.Clear();
      const ns = [BARLINE_REFERENCES, n];
      const matchStaff = new AttNIntegerAnyComparison(ALIGNMENT_REFERENCE, ns);
      filters.Add(matchStaff);
      measure.m_measureAligner.Process(this);
    }

    this.SetFilters(previousFilters);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystem(system: AdjustLayersSystemLike): FunctorCode {
    const scoreDef = system.GetDrawingScoreDef();
    if (scoreDef) this.m_staffNs = scoreDef.GetStaffNs();
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
