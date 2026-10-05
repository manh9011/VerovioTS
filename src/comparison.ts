/**
 * Canonical port of `src-cpp/include/vrv/comparison.h` (header-only).
 *
 * `Comparison` subclasses are predicate objects consumed by the
 * `Find*ByComparison*` functors (`src/findfunctor.ts`) and by
 * `Filters` (functor-side child pruning).
 *
 * Call protocol: the historical TS tree used `.call(object)`; the C++
 * spelling is `operator()(object)`. This module exposes `matches(object)`
 * as the primary entry point and keeps a `call` alias so existing
 * consumers (`findfunctor.ts`, `object.ts`, functor filters) keep working.
 */

import { ClassId, InterfaceId, VRV_UNSET, VisibilityOptimization } from './vrvdef.js';
import type { VrvObject } from './object.js';

//----------------------------------------------------------------------------
// Comparison
//----------------------------------------------------------------------------

export class Comparison {
  private readonly predicate: ((object: VrvObject) => boolean) | null;

  /**
   * Base constructor. Subclasses modeling canonical C++ comparison classes
   * call `super()` with no predicate and override `matches()`. Ad-hoc
   * predicate comparisons pass a lambda (historical TS usage).
   * Also accept optional className for stub compatibility.
   */
  public className = '';

  public constructor(predicate?: (object: VrvObject) => boolean, className?: string) {
    this.predicate = predicate ?? null;
    this.className = className ?? '';
  }

  /** Primary predicate entry point (C++ `operator()`). */
  public matches(object: VrvObject): boolean {
    if (this.predicate) return this.predicate(object);
    throw new Error('Comparison::matches: base class has no predicate; subclass must override matches().');
  }
  /** Reverse-comparison support flag (C++ `m_supportReverse`). */
  protected m_supportReverse = false;
  /** Reverse-comparison state (C++ `m_reverse`). */
  private m_reverse = false;

  /** Historical TS alias for `matches` (kept for `findfunctor.ts` / `object.ts`). */
  public call(object: VrvObject): boolean {
    return this.matches(object);
  }

  /** For classes doing reverse comparison, return the reversed result. */
  public Result(comparison: boolean): boolean {
    return this.m_reverse ? !comparison : comparison;
  }

  /** Enable reverse comparison (C++ asserts the class allows it). */
  public ReverseComparison(): void {
    if (!this.m_supportReverse) {
      throw new Error('Comparison::ReverseComparison: class does not support reverse comparison.');
    }
    this.m_reverse = true;
  }
}

//----------------------------------------------------------------------------
// ClassIdComparison
//----------------------------------------------------------------------------

export class ClassIdComparison extends Comparison {
  protected m_classId: ClassId;

  public constructor(classId: ClassId, _className?: string) {
    super(undefined, _className ?? '');
    this.m_classId = classId;
    this.m_supportReverse = true;
  }

  public override matches(object: VrvObject): boolean {
    return this.Result(this.MatchesType(object));
  }

  public GetType(): ClassId {
    return this.m_classId;
  }

  public MatchesType(object: VrvObject): boolean {
    return object.Is(this.m_classId);
  }
}

//----------------------------------------------------------------------------
// ClassIdsComparison
//----------------------------------------------------------------------------

export class ClassIdsComparison extends Comparison {
  protected m_classIds: ClassId[];

  public constructor(classIds: ClassId[], _className?: string) {
    super(undefined, _className ?? '');
    this.m_classIds = [...classIds];
    this.m_supportReverse = true;
  }

  public override matches(object: VrvObject): boolean {
    return this.Result(this.MatchesType(object));
  }

  public MatchesType(object: VrvObject): boolean {
    return object.IsAnyOf(this.m_classIds);
  }
}

//----------------------------------------------------------------------------
// InterfaceComparison
//----------------------------------------------------------------------------

export class InterfaceComparison extends Comparison {
  protected m_interfaceId: InterfaceId;

  public constructor(interfaceId: InterfaceId) {
    super();
    this.m_interfaceId = interfaceId;
  }

  public override matches(object: VrvObject): boolean {
    if (object.HasInterface(this.m_interfaceId)) {
      return true;
    }
    return false;
  }
}

//----------------------------------------------------------------------------
// ChildOfClassIdComparison
//----------------------------------------------------------------------------

export class ChildOfClassIdComparison extends Comparison {
  protected m_classId: ClassId;

  public constructor(classId: ClassId) {
    super();
    this.m_classId = classId;
  }

  public override matches(object: VrvObject): boolean {
    return !!(object.GetParent() && object.GetParent()!.GetClassId() === this.m_classId);
  }
}

//----------------------------------------------------------------------------
// PointingToComparison
//----------------------------------------------------------------------------

export class PointingToComparison extends ClassIdComparison {
  protected m_pointingTo: VrvObject | null;

  public constructor(classId: ClassId, pointingTo: VrvObject | null) {
    super(classId);
    this.m_pointingTo = pointingTo;
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    const iface = object.GetTimePointInterface() as unknown as {
      GetStart?: () => VrvObject | null;
    } | null;
    if (!iface || typeof iface.GetStart !== 'function') return false;
    return iface.GetStart() === this.m_pointingTo;
  }
}

//----------------------------------------------------------------------------
// SpanningToComparison
//----------------------------------------------------------------------------

export class SpanningToComparison extends ClassIdComparison {
  protected m_pointingTo: VrvObject | null;

  public constructor(classId: ClassId, pointingTo: VrvObject | null) {
    super(classId);
    this.m_pointingTo = pointingTo;
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    const iface = (object as VrvObject & { GetTimeSpanningInterface?: () => { GetEnd?: () => VrvObject | null } | null }).GetTimeSpanningInterface?.() as unknown as {
      GetEnd?: () => VrvObject | null;
    } | null;
    if (!iface || typeof iface.GetEnd !== 'function') return false;
    return iface.GetEnd!() === this.m_pointingTo;
  }
}

//----------------------------------------------------------------------------
// IsEditorialElementComparison
//----------------------------------------------------------------------------

/** Evaluates if the object is an editorial element. */
export class IsEditorialElementComparison extends Comparison {
  public constructor() {
    super();
    this.m_supportReverse = true;
  }

  public override matches(object: VrvObject): boolean {
    if (object.IsEditorialElement()) return this.Result(true);
    return this.Result(false);
  }
}

//----------------------------------------------------------------------------
// IsEmptyComparison
//----------------------------------------------------------------------------

/** Evaluates if the object is of a certain ClassId and is empty. */
export class IsEmptyComparison extends ClassIdComparison {
  public constructor(classId: ClassId) {
    super(classId);
    this.m_supportReverse = true;
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    const children = object.GetChildren();
    if (children.length === 0) {
      return this.Result(true);
    }
    return this.Result(false);
  }
}

//----------------------------------------------------------------------------
// IsAttributeComparison
//----------------------------------------------------------------------------

/** Evaluates if the object is of a certain ClassId and is an MEI attribute. */
export class IsAttributeComparison extends ClassIdComparison {
  public constructor(classId: ClassId) {
    super(classId);
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    if (object.IsAttribute()) return true;
    return false;
  }
}

//----------------------------------------------------------------------------
// AttNIntegerComparison
//----------------------------------------------------------------------------

/** Evaluates if the object is of a certain ClassId and has a @n of value n. */
export class AttNIntegerComparison extends ClassIdComparison {
  private m_n: number;

  public constructor(classId: ClassId, n: number) {
    super(classId);
    this.m_n = n;
  }

  public SetN(n: number): void {
    this.m_n = n;
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    // This should not happen, but just in case
    const att = object as VrvObject & { GetN?: () => number };
    if (typeof att.GetN !== 'function') return false;
    return att.GetN() === this.m_n;
  }
}

//----------------------------------------------------------------------------
// AttNIntegerAnyComparison
//----------------------------------------------------------------------------

/** Evaluates if the object is of a certain ClassId and has a @n in a set. */
export class AttNIntegerAnyComparison extends ClassIdComparison {
  private m_ns: number[];

  public constructor(classId: ClassId, ns: number[]) {
    super(classId);
    this.m_ns = [...ns];
  }

  public SetNs(ns: number[]): void {
    this.m_ns = [...ns];
  }

  public AppendN(n: number): void {
    this.m_ns.push(n);
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    const att = object as VrvObject & { GetN?: () => number };
    if (typeof att.GetN !== 'function') return false;
    return this.m_ns.indexOf(att.GetN()) !== -1;
  }
}

//----------------------------------------------------------------------------
// LyricElementComparison
//----------------------------------------------------------------------------

/** Match a verse or refrain by its internal lyric-processing group. */
export class LyricElementComparison extends ClassIdComparison {
  private m_groupN: number;

  public constructor(classId: ClassId, groupN: number) {
    super(classId);
    if (!(classId > ClassId.LYRIC_ELEMENT && classId < ClassId.LYRIC_ELEMENT_max)) {
      throw new Error('LyricElementComparison: classId is not a lyric element.');
    }
    this.m_groupN = groupN;
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    const lyric = object as VrvObject & { GetDrawingLyricGroupN?: () => number };
    if (typeof lyric.GetDrawingLyricGroupN !== 'function') {
      throw new Error('LyricElementComparison: object is not a LyricElement.');
    }
    return lyric.GetDrawingLyricGroupN() === this.m_groupN;
  }
}

//----------------------------------------------------------------------------
// AttNNumberLikeComparison
//----------------------------------------------------------------------------

/** Evaluates if the object is of a certain ClassId and has a @n of value n. */
export class AttNNumberLikeComparison extends ClassIdComparison {
  private m_n: string;

  public constructor(classId: ClassId, n: string) {
    super(classId);
    this.m_n = n;
  }

  public SetN(n: string): void {
    this.m_n = n;
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    const att = object as VrvObject & { GetN?: () => string };
    if (typeof att.GetN !== 'function') return false;
    return att.GetN() === this.m_n;
  }
}

/** Duration-extremum selector (C++ `DurExtreme`). */
export const enum DurExtreme {
  LONGEST = 0,
  SHORTEST = 0 + 1,
}

/** Alias names matching the C++ enumerators for structural consumers. */
export const LONGEST = DurExtreme.LONGEST;
export const SHORTEST = DurExtreme.SHORTEST;

//----------------------------------------------------------------------------
// AttDurExtremeComparison
//----------------------------------------------------------------------------

/**
 * Evaluates if the object is the extreme duration so far.
 * The object has to have a DurationInterface and to have a @dur.
 */
export class AttDurExtremeComparison extends ClassIdComparison {
  private m_extremeDur: number;
  private m_extremeType: DurExtreme;

  public constructor(extremeType: DurExtreme) {
    super(ClassId.OBJECT);
    this.m_extremeType = extremeType;
    this.m_extremeDur = this.m_extremeType === DurExtreme.LONGEST ? -VRV_UNSET : VRV_UNSET;
  }

  public override matches(object: VrvObject): boolean {
    const iface = object.GetDurationInterface();
    if (!iface) return false;
    const dur = iface as unknown as { HasDur?: () => boolean; GetActualDur?: () => number };
    if (typeof dur.HasDur !== 'function' || !dur.HasDur()) return false;
    const actualDur = dur.GetActualDur!();
    if (this.m_extremeType === DurExtreme.LONGEST && actualDur < this.m_extremeDur) {
      this.m_extremeDur = actualDur;
      return true;
    }
    if (this.m_extremeType === DurExtreme.SHORTEST && actualDur > this.m_extremeDur) {
      this.m_extremeDur = actualDur;
      return true;
    }
    return false;
  }
}

//----------------------------------------------------------------------------
// AttVisibilityComparison
//----------------------------------------------------------------------------

/** Evaluates if the object is visible. */
export class AttVisibilityComparison extends ClassIdComparison {
  private m_isVisible: number;

  public constructor(classId: ClassId, isVisible: number) {
    super(classId);
    this.m_isVisible = isVisible;
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    const vis = object as VrvObject & { GetVisible?: () => number };
    if (typeof vis.GetVisible !== 'function') return false;
    return vis.GetVisible() === this.m_isVisible;
  }
}

//----------------------------------------------------------------------------
// AttFormeworkComparison
//----------------------------------------------------------------------------

/** Evaluates if the object is of a certain ClassId and has a @func of value func. */
export class AttFormeworkComparison extends ClassIdComparison {
  private m_func: number;

  public constructor(classId: ClassId, func: number) {
    super(classId);
    this.m_func = func;
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    const el = object as VrvObject & { GetFunc?: () => number };
    if (typeof el.GetFunc !== 'function') return false;
    return el.GetFunc() === this.m_func;
  }
}

//----------------------------------------------------------------------------
// CrossAlignmentReferenceComparison
//----------------------------------------------------------------------------

/** Evaluates if alignment reference contains cross-staff elements. */
export class CrossAlignmentReferenceComparison extends ClassIdComparison {
  public constructor() {
    super(ClassId.ALIGNMENT_REFERENCE);
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    const ref = object as VrvObject & { HasCrossStaffElements?: () => boolean };
    if (typeof ref.HasCrossStaffElements !== 'function') {
      throw new Error('CrossAlignmentReferenceComparison: object is not an AlignmentReference.');
    }
    return ref.HasCrossStaffElements();
  }
}

//----------------------------------------------------------------------------
// MeasureAlignerTypeComparison
//----------------------------------------------------------------------------

/** Evaluates if the object is an Alignment of a certain type. */
export class MeasureAlignerTypeComparison extends ClassIdComparison {
  private m_type: number;

  public constructor(type: number) {
    super(ClassId.ALIGNMENT);
    this.m_type = type;
  }

  public SetType(type: number): void {
    this.m_type = type;
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    const alignment = object as VrvObject & { GetType?: () => number };
    if (typeof alignment.GetType !== 'function') {
      throw new Error('MeasureAlignerTypeComparison: object is not an Alignment.');
    }
    return alignment.GetType() === this.m_type;
  }
}

//----------------------------------------------------------------------------
// MeasureOnsetOffsetComparison
//----------------------------------------------------------------------------

/** Evaluates if the object is a measure enclosing the given time. */
export class MeasureOnsetOffsetComparison extends ClassIdComparison {
  private m_time: number;

  public constructor(time: number) {
    super(ClassId.MEASURE);
    this.m_time = time;
  }

  public SetTime(time: number): void {
    this.m_time = time;
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    const measure = object as VrvObject & { EnclosesTime?: (time: number) => number };
    if (typeof measure.EnclosesTime !== 'function') {
      throw new Error('MeasureOnsetOffsetComparison: object is not a Measure.');
    }
    return measure.EnclosesTime(this.m_time) !== VRV_UNSET;
  }
}

//----------------------------------------------------------------------------
// NoteOrRestOnsetOffsetComparison
//----------------------------------------------------------------------------

/** Evaluates if the object is a note being played at the given time. */
export class NoteOrRestOnsetOffsetComparison extends ClassIdsComparison {
  private m_time: number;

  public constructor(time: number) {
    super([ClassId.NOTE, ClassId.REST]);
    this.m_time = time;
  }

  public SetTime(time: number): void {
    this.m_time = time;
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    const iface = object.GetDurationInterface();
    if (!iface) {
      throw new Error('NoteOrRestOnsetOffsetComparison: object has no DurationInterface.');
    }
    const dur = iface as unknown as {
      GetRealTimeOnsetMilliseconds?: () => number;
      GetRealTimeOffsetMilliseconds?: () => number;
    };
    if (typeof dur.GetRealTimeOnsetMilliseconds !== 'function' || typeof dur.GetRealTimeOffsetMilliseconds !== 'function') {
      return false;
    }
    return this.m_time >= dur.GetRealTimeOnsetMilliseconds()! && this.m_time <= dur.GetRealTimeOffsetMilliseconds()!;
  }
}

//----------------------------------------------------------------------------
// IDComparison
//----------------------------------------------------------------------------

/** Evaluates if the object is of a certain ClassId and has a certain ID. */
export class IDComparison extends ClassIdComparison {
  private m_id: string;

  public constructor(classId: ClassId, id: string) {
    super(classId);
    this.m_id = id;
  }

  public SetID(id: string): void {
    this.m_id = id;
  }

  public override matches(object: VrvObject): boolean {
    if (!this.MatchesType(object)) return false;
    return object.GetID() === this.m_id;
  }
}

//----------------------------------------------------------------------------
// VisibleStaffDefOrGrpObject
//----------------------------------------------------------------------------

/**
 * Evaluates if the object is a visible StaffDef or StaffGrp.
 * Able to exclude an object passed to skip from the result set.
 */
export class VisibleStaffDefOrGrpObject extends ClassIdsComparison {
  protected m_objectToExclude: VrvObject | null = null;

  public constructor() {
    super([ClassId.STAFFDEF, ClassId.STAFFGRP]);
  }

  public Skip(objectToExclude: VrvObject): void {
    this.m_objectToExclude = objectToExclude;
  }

  public override matches(object: VrvObject): boolean {
    if (object === this.m_objectToExclude || !super.matches(object)) return false;

    const vis = object as VrvObject & { GetDrawingVisibility?: () => VisibilityOptimization };
    if (typeof vis.GetDrawingVisibility !== 'function') return false;
    return vis.GetDrawingVisibility() !== VisibilityOptimization.OPTIMIZATION_HIDDEN;
  }
}

//----------------------------------------------------------------------------
// Filters
//----------------------------------------------------------------------------

/**
 * Stores comparison filters and applies them when necessary.
 * `Type.AllOf` requires every filter to match; `Type.AnyOf` requires one.
 */
export class Filters {
  public static readonly Type = {
    AllOf: 0,
    AnyOf: 1,
  } as const;

  private m_filters: Comparison[] = [];
  private m_type: number = Filters.Type.AllOf;

  public constructor(comp?: Comparison[]) {
    if (comp) this.m_filters.push(...comp);
  }

  public Add(comp: Comparison): void {
    this.m_filters.push(comp);
  }

  public Clear(): void {
    this.m_filters.length = 0;
  }

  public SetType(type: number): void {
    this.m_type = type;
  }

  /** Apply comparison filters based on the specified type. */
  public Apply(object: VrvObject): boolean {
    const condition = (iter: Comparison): boolean => {
      // Ignore any class comparison which does not match the object class
      const cmp = iter as ClassIdComparison;
      if (cmp instanceof ClassIdComparison) {
        return cmp.GetType() !== object.GetClassId() ? true : iter.matches(object);
      }
      return iter.matches(object);
    };
    switch (this.m_type) {
      case Filters.Type.AnyOf: {
        return this.m_filters.some(condition);
      }
      case Filters.Type.AllOf:
      default: {
        return this.m_filters.every(condition);
      }
    }
  }
}
