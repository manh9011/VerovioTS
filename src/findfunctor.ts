/**
 * Pure TypeScript translation of Verovio's src/findfunctor.cpp
 * and include/vrv/findfunctor.h.
 */

import { Functor, ConstFunctor } from './functor.js';
import { ClassId, FunctorCode, InterfaceId } from './vrvdef.js';
import { VrvObject } from './object.js';
import { Comparison } from './comparison.js';
import { AltSymInterface } from './altsyminterface.js';
import { LinkingInterface } from './linkinginterface.js';
import { FacsimileInterface } from './facsimileinterface.js';
import { PlistInterface } from './plistinterface.js';
import { TimePointInterface, TimeSpanningInterface } from './timeinterface.js';
import { Note } from './note.js';
import { Layer } from './layer.js';
import { Score } from './score.js';
import { System } from './system.js';

function evaluateComparison(comparison: Comparison | ((obj: VrvObject) => boolean), object: VrvObject): boolean {
  // C++ `(*m_comparison)(object)` dispatches to Comparison::operator(). TS models
  // that as Comparison#matches (with a `call` alias). Plain predicate lambdas
  // must be detected by prototype: every JS function inherits Function.prototype.call,
  // so testing `.call` first misroutes lambdas through `comparison.call(object)`
  // with zero arguments (thisArg only), yielding undefined and crashing callers.
  if (comparison instanceof Comparison) {
    return comparison.matches(object);
  }
  if (typeof comparison === 'function') {
    return (comparison as (obj: VrvObject) => boolean)(object);
  }
  return false;
}

//----------------------------------------------------------------------------
// FindAllByComparisonFunctor
//----------------------------------------------------------------------------

export class FindAllByComparisonFunctor extends Functor {
  private m_comparison: Comparison;
  private m_continueDepthSearchForMatches = true;
  private m_elements: VrvObject[];

  public constructor(comparison: Comparison, elements: VrvObject[]) {
    super();
    this.m_comparison = comparison;
    this.m_elements = elements;
    this.m_continueDepthSearchForMatches = true;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public SetContinueDepthSearchForMatches(continueDepthSearchForMatches: boolean): void {
    this.m_continueDepthSearchForMatches = continueDepthSearchForMatches;
  }

  public override VisitObject(object: VrvObject): FunctorCode {
    if (evaluateComparison(this.m_comparison, object)) {
      this.m_elements.push(object);
      if (!this.m_continueDepthSearchForMatches) {
        return FunctorCode.FUNCTOR_SIBLINGS;
      }
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// FindAllConstByComparisonFunctor
//----------------------------------------------------------------------------

export class FindAllConstByComparisonFunctor extends ConstFunctor {
  private m_comparison: Comparison;
  private m_continueDepthSearchForMatches = true;
  private m_elements: VrvObject[];

  public constructor(comparison: Comparison, elements: VrvObject[]) {
    super();
    this.m_comparison = comparison;
    this.m_elements = elements;
    this.m_continueDepthSearchForMatches = true;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public SetContinueDepthSearchForMatches(continueDepthSearchForMatches: boolean): void {
    this.m_continueDepthSearchForMatches = continueDepthSearchForMatches;
  }

  public override VisitObject(object: VrvObject): FunctorCode {
    if (evaluateComparison(this.m_comparison, object)) {
      this.m_elements.push(object);
      if (!this.m_continueDepthSearchForMatches) {
        return FunctorCode.FUNCTOR_SIBLINGS;
      }
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// FindAllBetweenFunctor
//----------------------------------------------------------------------------

export class FindAllBetweenFunctor extends ConstFunctor {
  private m_comparison: Comparison;
  private m_elements: VrvObject[];
  private m_start: VrvObject | null;
  private m_end: VrvObject | null;

  public constructor(
    comparison: Comparison,
    elements: VrvObject[],
    start: VrvObject | null,
    end: VrvObject | null
  ) {
    super();
    this.m_comparison = comparison;
    this.m_elements = elements;
    this.m_start = start;
    this.m_end = end;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public override VisitObject(object: VrvObject): FunctorCode {
    if (this.m_start === object) {
      this.m_start = null;
    } else if (this.m_start !== null) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (evaluateComparison(this.m_comparison, object)) {
      this.m_elements.push(object);
    }

    if (this.m_end === object) {
      return FunctorCode.FUNCTOR_STOP;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// FindByComparisonFunctor
//----------------------------------------------------------------------------

export class FindByComparisonFunctor extends ConstFunctor {
  private m_comparison: Comparison;
  private m_element: VrvObject | null = null;

  public constructor(comparison: Comparison) {
    super();
    this.m_comparison = comparison;
    this.m_element = null;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public GetElement(): VrvObject | null {
    return this.m_element;
  }

  public override VisitObject(object: VrvObject): FunctorCode {
    if (this.m_element) {
      return FunctorCode.FUNCTOR_STOP;
    }

    if (evaluateComparison(this.m_comparison, object)) {
      this.m_element = object;
      return FunctorCode.FUNCTOR_STOP;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// FindByIDFunctor
//----------------------------------------------------------------------------

export class FindByIDFunctor extends ConstFunctor {
  private m_id: string;
  private m_element: VrvObject | null = null;

  public constructor(id: string) {
    super();
    this.m_id = id;
    this.m_element = null;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public GetElement(): VrvObject | null {
    return this.m_element;
  }

  public override VisitObject(object: VrvObject): FunctorCode {
    if (this.m_element) {
      return FunctorCode.FUNCTOR_STOP;
    }

    if (this.m_id === object.GetID()) {
      this.m_element = object;
      return FunctorCode.FUNCTOR_STOP;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// FindNextChildByComparisonFunctor
//----------------------------------------------------------------------------

export class FindNextChildByComparisonFunctor extends ConstFunctor {
  private m_comparison: Comparison;
  private m_start: VrvObject | null;
  private m_element: VrvObject | null = null;

  public constructor(comparison: Comparison, start: VrvObject | null) {
    super();
    this.m_comparison = comparison;
    this.m_start = start;
    this.m_element = null;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public GetElement(): VrvObject | null {
    return this.m_element;
  }

  public override VisitObject(object: VrvObject): FunctorCode {
    if (this.m_start === object) {
      this.m_start = null;
      return FunctorCode.FUNCTOR_CONTINUE;
    } else if (this.m_start !== null) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (evaluateComparison(this.m_comparison, object)) {
      this.m_element = object;
      return FunctorCode.FUNCTOR_STOP;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// FindPreviousChildByComparisonFunctor
//----------------------------------------------------------------------------

export class FindPreviousChildByComparisonFunctor extends ConstFunctor {
  private m_comparison: Comparison;
  private m_start: VrvObject | null;
  private m_element: VrvObject | null = null;

  public constructor(comparison: Comparison, start: VrvObject | null) {
    super();
    this.m_comparison = comparison;
    this.m_start = start;
    this.m_element = null;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public GetElement(): VrvObject | null {
    return this.m_element;
  }

  public override VisitObject(object: VrvObject): FunctorCode {
    if (this.m_start === object) {
      return FunctorCode.FUNCTOR_STOP;
    }

    if (evaluateComparison(this.m_comparison, object)) {
      this.m_element = object;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// FindExtremeByComparisonFunctor
//----------------------------------------------------------------------------

export class FindExtremeByComparisonFunctor extends ConstFunctor {
  private m_comparison: Comparison;
  private m_element: VrvObject | null = null;

  public constructor(comparison: Comparison) {
    super();
    this.m_comparison = comparison;
    this.m_element = null;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public GetElement(): VrvObject | null {
    return this.m_element;
  }

  public override VisitObject(object: VrvObject): FunctorCode {
    if (evaluateComparison(this.m_comparison, object)) {
      this.m_element = object;
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// FindAllReferencedObjectsFunctor
//----------------------------------------------------------------------------

export class FindAllReferencedObjectsFunctor extends ConstFunctor {
  private m_elements: Set<VrvObject> | null;
  private m_listWithAttName: Array<[VrvObject, string]> | null;
  private m_milestoneReferences = false;

  public constructor(
    elements: Set<VrvObject> | null,
    listWithAttName: Array<[VrvObject, string]> | null = null
  ) {
    super();
    this.m_elements = elements;
    this.m_listWithAttName = listWithAttName;
    if (!this.m_elements && !this.m_listWithAttName) {
      throw new Error('FindAllReferencedObjectsFunctor requires elements or listWithAttName');
    }
    this.m_milestoneReferences = false;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public IncludeMilestoneReferences(included: boolean): void {
    this.m_milestoneReferences = included;
  }

  public override VisitObject(object: VrvObject): FunctorCode {
    if (object.HasInterface(InterfaceId.INTERFACE_ALT_SYM)) {
      const iface = object.GetAltSymInterface() as AltSymInterface | null;
      if (iface) {
        const sym = iface.GetAltSymbolDef();
        if (sym) this.AddObject(sym as unknown as VrvObject, 'altsym');
      }
    }
    if (object.HasInterface(InterfaceId.INTERFACE_LINKING)) {
      const iface = object.GetLinkingInterface() as LinkingInterface | null;
      if (iface) {
        const nextLink = iface.GetNextLink();
        if (nextLink) this.AddObject(nextLink as unknown as VrvObject, 'link');
        const sameasLink = iface.GetSameasLink();
        if (sameasLink) this.AddObject(sameasLink as unknown as VrvObject, 'sameas');
      }
    }
    if (object.HasInterface(InterfaceId.INTERFACE_FACSIMILE)) {
      const iface = object.GetFacsimileInterface() as FacsimileInterface | null;
      if (iface) {
        const surface = iface.GetSurface();
        if (surface) this.AddObject(surface as unknown as VrvObject, 'surface');
        const zone = iface.GetZone();
        if (zone) this.AddObject(zone as unknown as VrvObject, 'zone');
      }
    }
    if (object.HasInterface(InterfaceId.INTERFACE_PLIST)) {
      const iface = object.GetPlistInterface() as PlistInterface | null;
      if (iface) {
        for (const ref of iface.GetRefs()) {
          this.AddObject(ref as unknown as VrvObject, 'plist');
        }
      }
    }
    if (object.HasInterface(InterfaceId.INTERFACE_TIME_POINT) || object.HasInterface(InterfaceId.INTERFACE_TIME_SPANNING)) {
      const iface = object.GetTimePointInterface() as TimePointInterface | null;
      if (iface) {
        const start = iface.GetStart();
        if (start && !start.Is(ClassId.TIMESTAMP_ATTR)) {
          this.AddObject(start as unknown as VrvObject, 'startid');
        }
      }
    }
    if (object.HasInterface(InterfaceId.INTERFACE_TIME_SPANNING)) {
      const iface = object.GetTimeSpanningInterface() as TimeSpanningInterface | null;
      if (iface) {
        const end = iface.GetEnd();
        if (end && !end.Is(ClassId.TIMESTAMP_ATTR)) {
          this.AddObject(end as unknown as VrvObject, 'endid');
        }
      }
    }
    if (object.Is(ClassId.NOTE)) {
      const note = object as Note;
      if (note.HasStemSameas() && note.HasStemSameasNote()) {
        const sameasNote = note.GetStemSameasNote();
        if (sameasNote) {
          this.AddObject(sameasNote, 'stem.sameas');
        }
      }
    }
    if (this.m_milestoneReferences && object.IsMilestoneElement()) {
      this.AddObject(object, '');
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  private AddObject(object: VrvObject, attribute: string): void {
    if (this.m_elements) {
      this.m_elements.add(object);
    } else if (this.m_listWithAttName) {
      this.m_listWithAttName.push([object, attribute]);
    }
  }
}

//----------------------------------------------------------------------------
// FindAllReferringObjectsFunctor
//----------------------------------------------------------------------------

export class FindAllReferringObjectsFunctor extends ConstFunctor {
  private m_object: VrvObject;
  private m_elements: Array<[VrvObject, string]>;

  public constructor(object: VrvObject, elements: Array<[VrvObject, string]>) {
    super();
    this.m_object = object;
    this.m_elements = elements;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public override VisitObject(object: VrvObject): FunctorCode {
    if (object.HasInterface(InterfaceId.INTERFACE_ALT_SYM)) {
      const iface = object.GetAltSymInterface() as AltSymInterface | null;
      if (iface && iface.GetAltSymbolDef() === this.m_object) {
        this.m_elements.push([object, 'altsym']);
      }
    }
    if (object.HasInterface(InterfaceId.INTERFACE_LINKING)) {
      const iface = object.GetLinkingInterface() as LinkingInterface | null;
      if (iface) {
        if (iface.GetNextLink() === this.m_object) {
          this.m_elements.push([object, 'next']);
        }
        if (iface.GetSameasLink() === this.m_object) {
          this.m_elements.push([object, 'sameas']);
        }
      }
    }
    if (object.HasInterface(InterfaceId.INTERFACE_FACSIMILE)) {
      const iface = object.GetFacsimileInterface() as FacsimileInterface | null;
      if (iface) {
        if ((iface.GetSurface() as unknown) === this.m_object) {
          this.m_elements.push([object, 'surface']);
        }
        if ((iface.GetZone() as unknown) === this.m_object) {
          this.m_elements.push([object, 'zone']);
        }
      }
    }
    if (object.HasInterface(InterfaceId.INTERFACE_PLIST)) {
      const iface = object.GetPlistInterface() as PlistInterface | null;
      if (iface) {
        for (const plistObject of iface.GetRefs()) {
          if ((plistObject as unknown) === this.m_object) {
            this.m_elements.push([object, 'plist']);
          }
        }
      }
    }
    if (object.HasInterface(InterfaceId.INTERFACE_TIME_POINT) || object.HasInterface(InterfaceId.INTERFACE_TIME_SPANNING)) {
      const iface = object.GetTimePointInterface() as TimePointInterface | null;
      if (iface && (iface.GetStart() as unknown) === this.m_object) {
        this.m_elements.push([object, 'startid']);
      }
    }
    if (object.HasInterface(InterfaceId.INTERFACE_TIME_SPANNING)) {
      const iface = object.GetTimeSpanningInterface() as TimeSpanningInterface | null;
      if (iface && (iface.GetEnd() as unknown) === this.m_object) {
        this.m_elements.push([object, 'endid']);
      }
    }
    if (object.Is(ClassId.NOTE)) {
      const note = object as Note;
      if (note.HasStemSameas() && note.GetStemSameasNote() === this.m_object) {
        this.m_elements.push([object, 'stem.sameas']);
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// FindElementInLayerStaffDefFunctor
//----------------------------------------------------------------------------

export class FindElementInLayerStaffDefFunctor extends ConstFunctor {
  private m_id: string;
  private m_element: VrvObject | null = null;

  public constructor(xmlId: string) {
    super();
    this.m_id = xmlId;
    this.m_element = null;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public GetElement(): VrvObject | null {
    return this.m_element;
  }

  public override VisitLayer(layer: Layer): FunctorCode {
    if (!layer.HasStaffDef()) return FunctorCode.FUNCTOR_SIBLINGS;

    if (layer.GetStaffDefClef() && layer.GetStaffDefClef()!.GetID() === this.m_id) {
      this.m_element = layer.GetStaffDefClef();
    } else if (layer.GetStaffDefKeySig() && layer.GetStaffDefKeySig()!.GetID() === this.m_id) {
      this.m_element = layer.GetStaffDefKeySig();
    } else if (layer.GetStaffDefMensur() && layer.GetStaffDefMensur()!.GetID() === this.m_id) {
      this.m_element = layer.GetStaffDefMensur();
    } else if (layer.GetStaffDefMeterSig() && layer.GetStaffDefMeterSig()!.GetID() === this.m_id) {
      this.m_element = layer.GetStaffDefMeterSig();
    } else if (layer.GetStaffDefMeterSigGrp() && layer.GetStaffDefMeterSigGrp()!.GetID() === this.m_id) {
      this.m_element = layer.GetStaffDefMeterSigGrp();
    }

    if (!this.m_element && layer.GetStaffDefKeySig()) {
      this.m_element = layer.GetStaffDefKeySig()!.FindDescendantByID(this.m_id);
    }

    return this.m_element ? FunctorCode.FUNCTOR_STOP : FunctorCode.FUNCTOR_SIBLINGS;
  }

  public override VisitScore(score: Score): FunctorCode {
    const scoreDef = score.GetScoreDef();
    if (!scoreDef) {
      throw new Error('FindElementInLayerStaffDefFunctor::VisitScore invariant: score->GetScoreDef() required');
    }

    if (scoreDef.GetID() === this.m_id) {
      this.m_element = scoreDef;
    } else {
      this.m_element = scoreDef.FindDescendantByID(this.m_id);
    }

    return this.m_element ? FunctorCode.FUNCTOR_STOP : FunctorCode.FUNCTOR_CONTINUE;
  }

  public override VisitSystem(system: System): FunctorCode {
    const drawingScoreDef = system.GetDrawingScoreDef();
    if (drawingScoreDef) {
      this.m_element = drawingScoreDef.FindDescendantByID(this.m_id);
    }

    return this.m_element ? FunctorCode.FUNCTOR_STOP : FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// AddToFlatListFunctor
//----------------------------------------------------------------------------

export class AddToFlatListFunctor extends ConstFunctor {
  private m_flatList: VrvObject[];

  public constructor(flatList: VrvObject[]) {
    super();
    this.m_flatList = flatList;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public override VisitObject(object: VrvObject): FunctorCode {
    this.m_flatList.push(object);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
