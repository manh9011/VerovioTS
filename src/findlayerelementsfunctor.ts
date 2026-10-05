/**
 * Pure TypeScript translation of Verovio's find-layer-elements functors
 * (`src-cpp/src/findlayerelementsfunctor.cpp` +
 *  `src-cpp/include/vrv/findlayerelementsfunctor.h`).
 *
 * Covers all four functors from the canonical source:
 * `LayersInTimeSpanFunctor`, `LayerElementsInTimeSpanFunctor`,
 * `FindSpannedLayerElementsFunctor`, and `GetRelativeLayerElementFunctor`.
 *
 * Unmigrated collaborators (Measure, Mensur, MeterSig, Note, Chord, Staff)
 * are consumed through structural contracts; no domain logic is invented.
 */
import { ClassId, FunctorCode, FORWARD, BACKWARD } from './vrvdef.js';
import { VrvObject } from './object.js';
import { ConstFunctor } from './functor.js';
import { Fraction } from './fraction.js';
import { LayerElement, StaffSearch, LayerContract, StaffContract } from './layerelement.js';

/** C++ `LayerElement::HasSameasLink()` resolves through the linking interface. */
const hasSameasLink = (el: LayerElement): boolean =>
  !!(el.GetLinkingInterface && (el.GetLinkingInterface() as unknown as { HasSameasLink?(): boolean } | null)?.HasSameasLink?.());

/** C++ `Fraction` relational operators (mapped to `compare()`). */
const fracLE = (a: Fraction, b: Fraction): boolean => a.compare(b) <= 0;
const fracGE = (a: Fraction, b: Fraction): boolean => a.compare(b) >= 0;

/** Structural contracts for not-yet-migrated collaborator state. */
export interface FindLayerMeterSigLike {
  dummy?: unknown;
}
export interface FindLayerMensurLike {
  dummy?: unknown;
}
export interface FindLayerMeasureLike {
  dummy?: unknown;
}
export interface FindLayerTimeSpanningInterfaceLike {
  GetStart(): LayerElement | null;
  GetEnd(): LayerElement | null;
  GetStartMeasure(): VrvObject | null;
  GetEndMeasure(): VrvObject | null;
}
export interface FindLayerAlignmentLike {
  GetTime(): Fraction;
}

/** Meter alignment parameters (mirrors `AlignMeterParams`). */
interface FindLayerMeterParams {
  meterSig: unknown;
  mensur: unknown;
}

//----------------------------------------------------------------------------
// LayersInTimeSpanFunctor
//----------------------------------------------------------------------------

/**
 * Collects all layers which appear in the given time / duration.
 */
export class LayersInTimeSpanFunctor extends ConstFunctor {
  private m_time: Fraction = new Fraction(0);
  private m_duration: Fraction = new Fraction(0);
  private m_layers: Set<number> = new Set<number>();
  private m_meterParams: FindLayerMeterParams;

  public constructor(meterSig: unknown, mensur: unknown) {
    super();
    this.m_meterParams = { meterSig, mensur };
  }

  public override ImplementsEndInterface(): boolean { return false; }

  /** Set the time and duration of the event. */
  public SetEvent(time: Fraction, duration: Fraction): void {
    this.m_time = time;
    this.m_duration = duration;
  }

  /** Retrieve the search result. */
  public GetLayers(): Set<number> { return this.m_layers; }

  public VisitLayerElement(layerElement: LayerElement): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    // For mRest we do not look at the time span
    if (layerElement.Is(ClassId.MREST)) {
      // Add the layerN to the list of layers occurring in this time frame
      this.m_layers.add(layerElement.GetAlignmentLayerN());

      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    if (!layerElement.GetDurationInterface() || layerElement.Is(ClassId.MSPACE) || layerElement.Is(ClassId.SPACE)
      || hasSameasLink(layerElement))
      return FunctorCode.FUNCTOR_CONTINUE;
    if (layerElement.Is(ClassId.NOTE) && (layerElement.GetParent() as VrvObject | null)?.Is(ClassId.CHORD)) return FunctorCode.FUNCTOR_CONTINUE;

    const duration = layerElement.GetAlignmentDurationNoParams();
    const time = (layerElement.GetAlignment() as unknown as FindLayerAlignmentLike).GetTime();

    // The event is starting after the end of the element
    if (fracLE(time.add(duration), this.m_time)) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    // The element is starting after the event end - we can stop here
    else if (fracGE(time, this.m_time.add(this.m_duration))) {
      return FunctorCode.FUNCTOR_STOP;
    }

    // Add the layerN to the list of layers occurring in this time frame
    this.m_layers.add(layerElement.GetAlignmentLayerN());

    // Not need to recurse for chords? Not quite sure about it.
    return (layerElement.Is(ClassId.CHORD)) ? FunctorCode.FUNCTOR_SIBLINGS : FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMensur(mensur: VrvObject): FunctorCode {
    this.m_meterParams.mensur = mensur;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeterSig(meterSig: VrvObject): FunctorCode {
    this.m_meterParams.meterSig = meterSig;

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// LayerElementsInTimeSpanFunctor
//----------------------------------------------------------------------------

/**
 * Collects all layer elements which appear in the given time / duration.
 */
export class LayerElementsInTimeSpanFunctor extends ConstFunctor {
  private m_time: Fraction = new Fraction(0);
  private m_duration: Fraction = new Fraction(0);
  private m_elements: VrvObject[] = [];
  private m_meterParams: FindLayerMeterParams;
  private readonly m_layer: VrvObject;
  private m_allLayersButCurrent: boolean = false;

  public constructor(meterSig: unknown, mensur: unknown, layer: VrvObject) {
    super();
    this.m_time = new Fraction(0);
    this.m_duration = new Fraction(0);
    this.m_meterParams = { meterSig, mensur };
    this.m_layer = layer;
    this.m_allLayersButCurrent = false;
  }

  public override ImplementsEndInterface(): boolean { return false; }

  /** Set the time and duration of the event. */
  public SetEvent(time: Fraction, duration: Fraction): void {
    this.m_time = time;
    this.m_duration = duration;
  }

  /** Consider all layers except the current one. */
  public ConsiderAllLayersButCurrent(): void { this.m_allLayersButCurrent = true; }

  /** Retrieve the search result. */
  public GetElements(): VrvObject[] { return this.m_elements; }

  public VisitLayerElement(layerElement: LayerElement): FunctorCode {
    const currentLayer = layerElement.GetFirstAncestor(ClassId.LAYER);
    // Either get layer referenced by @m_layer or all layers but it, depending on the @m_allLayersButCurrent flag
    if ((!this.m_allLayersButCurrent && (currentLayer !== this.m_layer)) || (this.m_allLayersButCurrent && (currentLayer === this.m_layer))) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    if (!currentLayer || layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    if (hasSameasLink(layerElement)) return FunctorCode.FUNCTOR_CONTINUE;

    if (layerElement.Is(ClassId.MREST)) {
      this.m_elements.push(layerElement as unknown as VrvObject);
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (!layerElement.GetDurationInterface()
      || layerElement.IsAnyOf([ClassId.MSPACE, ClassId.SPACE]))
      return FunctorCode.FUNCTOR_CONTINUE;

    const chordAncestor = layerElement.GetFirstAncestor(ClassId.CHORD) as unknown as (LayerElement & { GetAlignmentDurationNoParams(): Fraction }) | null;
    const duration = !chordAncestor
      ? layerElement.GetAlignmentDurationNoParams()
      : chordAncestor.GetAlignmentDurationNoParams();

    const time = (layerElement.GetAlignment() as unknown as FindLayerAlignmentLike).GetTime();

    // The event is starting after the end of the element
    if (fracLE(time.add(duration), this.m_time)) return FunctorCode.FUNCTOR_CONTINUE;
    // The element is starting after the event end - we can stop here
    if (fracGE(time, this.m_time.add(this.m_duration))) return FunctorCode.FUNCTOR_STOP;

    if (layerElement.Is(ClassId.NOTE)) {
      const note = layerElement as unknown as { IsChordTone(): VrvObject | null };
      const chord = note.IsChordTone();
      if (chord && (this.m_elements.indexOf(chord) !== -1)) {
        return FunctorCode.FUNCTOR_CONTINUE;
      }
    }
    this.m_elements.push(layerElement as unknown as VrvObject);

    // Not need to recurse for chords
    return layerElement.Is(ClassId.CHORD) ? FunctorCode.FUNCTOR_SIBLINGS : FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// FindSpannedLayerElementsFunctor
//----------------------------------------------------------------------------

/**
 * Retrieves all layer elements between two horizontal positions.
 * Designed to find spanned elements, i.e. for ties and slurs.
 */
export class FindSpannedLayerElementsFunctor extends ConstFunctor {
  private m_minPos: number = 0;
  private m_maxPos: number = 0;
  private m_staffNs: Set<number> = new Set<number>();
  private m_minLayerN: number = 0;
  private m_maxLayerN: number = 0;
  private readonly m_interface: FindLayerTimeSpanningInterfaceLike;
  private m_classIds: ClassId[] = [];
  private m_elements: LayerElement[] = [];

  public constructor(iface: FindLayerTimeSpanningInterfaceLike) {
    super();
    this.m_interface = iface;
    this.m_minPos = 0;
    this.m_maxPos = 0;
    this.m_minLayerN = 0;
    this.m_maxLayerN = 0;
  }

  public override ImplementsEndInterface(): boolean { return false; }

  /** Set the horizontal boundary to search for. */
  public SetMinMaxPos(minPos: number, maxPos: number): void {
    this.m_minPos = minPos;
    this.m_maxPos = maxPos;
  }

  /** Set the minimal and maximal layerN to consider. */
  public SetMinMaxLayerN(minLayerN: number, maxLayerN: number): void {
    this.m_minLayerN = minLayerN;
    this.m_maxLayerN = maxLayerN;
  }

  /** Set the staff numbers to consider. */
  public SetStaffNs(staffNs: Set<number>): void { this.m_staffNs = staffNs; }

  /** Set the classes to search for. */
  public SetClassIds(classIds: ClassId[]): void { this.m_classIds = classIds; }

  /** Clear the search result. */
  public ClearElements(): void { this.m_elements = []; }

  /** Retrieve the search result. */
  public GetElements(): LayerElement[] { return this.m_elements; }

  public VisitLayerElement(layerElement: LayerElement): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    if (!layerElement.IsAnyOf(this.m_classIds)) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (layerElement.HasContentBB() && !layerElement.HasEmptyBB() && (layerElement.GetContentRight() > this.m_minPos)
      && (layerElement.GetContentLeft() < this.m_maxPos)) {

      // We skip the start or end of the slur
      const start = this.m_interface.GetStart();
      const end = this.m_interface.GetEnd();
      if ((layerElement === start) || (layerElement === end)) {
        return FunctorCode.FUNCTOR_CONTINUE;
      }

      // Skip if neither parent staff nor cross staff matches the given staff number
      if (this.m_staffNs.size > 0) {
        const staff = layerElement.GetAncestorStaff();
        if (!staff || !this.m_staffNs.has((staff as unknown as { GetN(): number }).GetN())) {
          let layer: LayerContract | null = null;
          const crossStaff = layerElement.GetCrossStaff({ value: layer });
          if (!crossStaff || !this.m_staffNs.has((crossStaff as unknown as { GetN(): number }).GetN())) {
            return FunctorCode.FUNCTOR_CONTINUE;
          }
        }
      }

      // Skip if layer number is outside given bounds
      const layerN = layerElement.GetOriginalLayerN();
      if (this.m_minLayerN && (this.m_minLayerN > layerN)) {
        return FunctorCode.FUNCTOR_CONTINUE;
      }
      if (this.m_maxLayerN && (this.m_maxLayerN < layerN)) {
        return FunctorCode.FUNCTOR_CONTINUE;
      }

      // Skip elements aligned at start/end, but on a different staff
      const el = layerElement as unknown as {
        GetAlignment(): VrvObject | null;
        Is(classId: ClassId): boolean;
        GetAncestorStaff(strategy?: number, assertExistence?: boolean): StaffContract | null;
      };
      if (start && (layerElement.GetAlignment() === start.GetAlignment()) && !start.Is(ClassId.TIMESTAMP_ATTR)) {
        const staff = el.GetAncestorStaff(StaffSearch.RESOLVE_CROSS_STAFF);
        const startStaff = (start as unknown as typeof el).GetAncestorStaff(StaffSearch.RESOLVE_CROSS_STAFF);
        if ((staff as unknown as { GetN(): number }).GetN() !== (startStaff as unknown as { GetN(): number }).GetN()) {
          return FunctorCode.FUNCTOR_CONTINUE;
        }
      }
      if (end && (layerElement.GetAlignment() === end.GetAlignment()) && !end.Is(ClassId.TIMESTAMP_ATTR)) {
        const staff = el.GetAncestorStaff(StaffSearch.RESOLVE_CROSS_STAFF);
        const endStaff = (end as unknown as typeof el).GetAncestorStaff(StaffSearch.RESOLVE_CROSS_STAFF);
        if ((staff as unknown as { GetN(): number }).GetN() !== (endStaff as unknown as { GetN(): number }).GetN()) {
          return FunctorCode.FUNCTOR_CONTINUE;
        }
      }

      this.m_elements.push(layerElement);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: VrvObject): FunctorCode {
    if (VrvObject.IsPreOrdered(measure, this.m_interface.GetStartMeasure() as VrvObject)) return FunctorCode.FUNCTOR_SIBLINGS;

    if (VrvObject.IsPreOrdered(this.m_interface.GetEndMeasure() as VrvObject, measure)) return FunctorCode.FUNCTOR_SIBLINGS;

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// GetRelativeLayerElementFunctor
//----------------------------------------------------------------------------

/**
 * Goes through all layer elements of the layer and returns the next/previous
 * element (depending on traversal direction) relative to the specified layer
 * element. Searches recursively through child elements until note, chord or
 * ftrem is found. Can look into neighboring layers, but only checks the first
 * element there.
 */
export class GetRelativeLayerElementFunctor extends ConstFunctor {
  private m_relativeElement: LayerElement | null = null;
  private readonly m_initialElementIndex: number;
  private readonly m_isInNeighboringLayer: boolean;

  public constructor(elementIndex: number, anotherLayer: boolean) {
    super();
    this.m_relativeElement = null;
    this.m_initialElementIndex = elementIndex;
    this.m_isInNeighboringLayer = anotherLayer;
  }

  public override ImplementsEndInterface(): boolean { return false; }

  /** Retrieve the search result. */
  public GetRelativeElement(): LayerElement | null { return this.m_relativeElement; }

  public VisitLayerElement(layerElement: LayerElement): FunctorCode {
    // Do not check for index of the element if we're looking into neighboring layer or if nested element is being
    // processed (e.g. ignore index children of beams, since they have their own indices irrelevant to the one that
    // has been passed inside this functor)
    if (!this.m_isInNeighboringLayer && (layerElement.GetParent() as VrvObject | null)?.Is(ClassId.LAYER)) {
      if ((this.GetDirection() === FORWARD) && (layerElement.GetIdx() < this.m_initialElementIndex)) {
        return FunctorCode.FUNCTOR_SIBLINGS;
      }
      if ((this.GetDirection() === BACKWARD) && (layerElement.GetIdx() > this.m_initialElementIndex)) {
        return FunctorCode.FUNCTOR_SIBLINGS;
      }
    }

    if (layerElement.IsAnyOf([ClassId.NOTE, ClassId.CHORD, ClassId.FTREM])) {
      this.m_relativeElement = layerElement;
      return FunctorCode.FUNCTOR_STOP;
    }

    if (layerElement.Is(ClassId.REST)) return this.m_isInNeighboringLayer ? FunctorCode.FUNCTOR_STOP : FunctorCode.FUNCTOR_SIBLINGS;

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
