/**
 * Pure TypeScript translation of Verovio's src/calcspanningbeamspansfunctor.cpp
 * / include/vrv/calcspanningbeamspansfunctor.h.
 *
 * Splits beamspans that cross system boundaries into per-system segments.
 * Unmigrated tree classes (BeamSpan, Doc, Object, ...) are represented by
 * structural contracts; no layout algorithm is invented.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode } from './vrvdef.js';

export interface SpanningBeamSpanElementLike {
  GetFirstAncestor(classId: ClassId): unknown;
}

export interface SpanIndexEntryLike {
  first: number;
  second: unknown;
}

export interface SpanningBeamSpanLike {
  GetBeamedElements(): SpanningBeamSpanElementLike[];
  GetStart(): SpanningBeamSpanElementLike | null;
  GetEnd(): SpanningBeamSpanElementLike | null;
  GetFirstAncestor(classId: ClassId): unknown;
  AddSpanningSegment(doc: unknown, elements: SpanIndexEntryLike[], index: number, newSegment?: boolean): void;
}

function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`CalcSpanningBeamSpansFunctor: ${message}`);
}

export class CalcSpanningBeamSpansFunctor extends DocFunctor {
  public constructor(doc: unknown) {
    super(doc);
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitBeamSpan(beamSpan: SpanningBeamSpanLike): FunctorCode {
    const beamedElements = beamSpan.GetBeamedElements();

    if (beamedElements.length === 0 || !beamSpan.GetStart() || !beamSpan.GetEnd()) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    const startSystem = beamSpan.GetStart()!.GetFirstAncestor(ClassId.SYSTEM);
    const endSystem = beamSpan.GetEnd()!.GetFirstAncestor(ClassId.SYSTEM);
    assertInvariant(startSystem && endSystem, 'expected start/end systems');
    if (startSystem === endSystem) return FunctorCode.FUNCTOR_CONTINUE;

    // Find layerElements that belong to another system and store them in the vector alongside
    // the system they belong to. This will allow us to break down beamSpan based on the systems.
    // Indices model the C++ ArrayOfObjects iterators (positions, with length as end()).
    const elements: SpanIndexEntryLike[] = [];
    let firstSystem: unknown = startSystem;
    let iter = 0;
    while (iter < beamedElements.length) {
      elements.push({ first: iter, second: firstSystem });
      const holder = { system: firstSystem };
      let found = beamedElements.length;
      for (let j = iter; j < beamedElements.length; ++j) {
        const parentSystem = beamedElements[j].GetFirstAncestor(ClassId.SYSTEM);
        if (holder.system === parentSystem) continue;
        holder.system = parentSystem;
        found = j;
        break;
      }
      firstSystem = holder.system;
      iter = found;
    }
    elements.push({ first: beamedElements.length, second: null });

    // Iterator for the elements are based on the initial order of the elements, so skip current system when
    // found and process it separately in the end
    const currentSystem = beamSpan.GetFirstAncestor(ClassId.SYSTEM);
    let currentSystemIndex = 0;
    for (let i = 0; i < elements.length - 1; ++i) {
      if (elements[i].second === currentSystem) {
        currentSystemIndex = i;
        continue;
      }
      beamSpan.AddSpanningSegment(this.m_doc, elements, i);
    }
    beamSpan.AddSpanningSegment(this.m_doc, elements, currentSystemIndex, false);

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
