/**
 * Pure TypeScript translation of Verovio's src/adjustdotsfunctor.cpp.
 *
 * Control flow, ordering and mutation semantics follow the canonical C++ source.
 * Unmigrated layout/tree classes remain explicit structural contracts.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { Filters, AttNIntegerAnyComparison } from './comparison.js';

export const ALIGNMENT_REFERENCE = ClassId.ALIGNMENT_REFERENCE;
export const BARLINE_REFERENCES = -1;
export const RESOLVE_CROSS_STAFF = 1;

export interface AdjustDotsDocLike {
  GetDrawingUnit(staffSize: number): number;
}

export interface AdjustDotsStaffLike {
  m_drawingStaffSize: number;
}

export interface AdjustDotsLayerElementLike {
  Is(classId: ClassId): boolean;
  IsAnyOf(classIds: ClassId[]): boolean;
  GetParent(): AdjustDotsObjectLike | null;
  GetFirstAncestor(classId: ClassId): AdjustDotsObjectLike | null;
  GetDrawingX(): number;
}

export interface AdjustDotsObjectLike extends AdjustDotsLayerElementLike {
  GetClassId?(): ClassId | number;
}

export interface AdjustDotsDotsLike extends AdjustDotsLayerElementLike {
  GetAncestorStaff(resolveCrossStaff?: number): AdjustDotsStaffLike | null;
  HorizontalSelfOverlap(element: AdjustDotsLayerElementLike, margin: number): boolean;
  VerticalSelfOverlap(element: AdjustDotsLayerElementLike, margin: number): boolean;
  GetDrawingX(): number;
  GetDrawingXRel(): number;
  SetDrawingXRel(value: number): void;
  IsAdjusted(value?: boolean): boolean | void;
}

export interface AdjustDotsMeasureAlignerLike {
  Process(functor: unknown): void;
}

export interface AdjustDotsMeasureLike {
  HasAlignmentRefWithMultipleLayers(): boolean;
  m_measureAligner: AdjustDotsMeasureAlignerLike;
}

export interface AdjustDotsScoreDefLike {
  GetStaffNs(): number[];
}

export interface AdjustDotsSystemLike {
  GetDrawingScoreDef(): AdjustDotsScoreDefLike | null;
}

/** Minimal AttAugmentDots contract; the canonical implementation uses GetDots(). */
export interface AdjustDotsAugmentLike {
  GetDots(): number;
}

function isChordOrNote(element: AdjustDotsLayerElementLike): boolean {
  return element.IsAnyOf([ClassId.CHORD, ClassId.NOTE]);
}

function hasDots(element: AdjustDotsLayerElementLike): boolean {
  const value = (element as unknown as Partial<AdjustDotsAugmentLike>).GetDots;
  return typeof value === 'function' && value.call(element) >= 1;
}

function asLayerElement(value: AdjustDotsObjectLike | null): AdjustDotsLayerElementLike | null {
  return value as AdjustDotsLayerElementLike | null;
}

export class AdjustDotsFunctor extends DocFunctor {
  private m_staffNs: number[] = [];
  private m_elements: AdjustDotsLayerElementLike[] = [];
  private m_dots: AdjustDotsDotsLike[] = [];

  public constructor(doc: AdjustDotsDocLike) {
    super(doc);
  }

  public override ImplementsEndInterface(): boolean { return true; }

  public VisitAlignmentEnd(_alignment: unknown): FunctorCode {
    if (this.m_elements.length > 0 && this.m_dots.length > 0) {
      // C++ std::multimap<Dots*, LayerElement*> equivalent. Map preserves per-dot grouping;
      // insertion order is retained by the arrays below.
      const overlapElements = new Map<AdjustDotsDotsLike, AdjustDotsLayerElementLike[]>();

      for (const dots of this.m_dots) {
        const staff = dots.GetAncestorStaff(RESOLVE_CROSS_STAFF);
        if (!staff) continue;
        const thirdUnit = Math.trunc(this.m_doc.GetDrawingUnit(staff.m_drawingStaffSize) / 3);
        for (const element of this.m_elements) {
          if (!dots.HorizontalSelfOverlap(element, thirdUnit)
            || !dots.VerticalSelfOverlap(element, 2 * thirdUnit)) continue;

          let target: AdjustDotsLayerElementLike | null = null;
          if (isChordOrNote(element)) {
            if (!hasDots(element)) continue;
            target = element;
          } else {
            const chord = asLayerElement(element.GetFirstAncestor(ClassId.CHORD));
            if (chord) {
              if (!hasDots(chord)) continue;
              target = chord;
            } else {
              const note = asLayerElement(element.GetFirstAncestor(ClassId.NOTE));
              if (!note) continue;
              if (!hasDots(note)) continue;
              target = note;
            }
          }
          if (target) {
            const bucket = overlapElements.get(dots);
            if (bucket) bucket.push(target);
            else overlapElements.set(dots, [target]);
          }
        }
      }

      if (overlapElements.size > 0) {
        for (const dots of this.m_dots) {
          const overlaps = overlapElements.get(dots);
          let max = 0;
          if (overlaps) {
            for (const element of overlaps) {
              const diff = element.GetDrawingX() + dots.GetDrawingXRel() - dots.GetDrawingX();
              if (diff > max) max = diff;
            }
          }
          if (max) dots.SetDrawingXRel(dots.GetDrawingXRel() + max);
          dots.IsAdjusted(true);
        }
      }
    }

    this.m_elements.length = 0;
    this.m_dots.length = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: AdjustDotsLayerElementLike): FunctorCode {
    const parent = layerElement.GetParent();
    if (layerElement.Is(ClassId.NOTE) && parent?.Is(ClassId.CHORD)) return FunctorCode.FUNCTOR_SIBLINGS;
    if (layerElement.Is(ClassId.DOTS)) this.m_dots.push(layerElement as AdjustDotsDotsLike);
    else this.m_elements.push(layerElement);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasure(measure: AdjustDotsMeasureLike): FunctorCode {
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

  public VisitSystem(system: AdjustDotsSystemLike): FunctorCode {
    const scoreDef = system.GetDrawingScoreDef();
    if (scoreDef) this.m_staffNs = scoreDef.GetStaffNs();
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
