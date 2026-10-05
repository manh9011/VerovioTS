/**
 * Pure TypeScript translation of Verovio's horizontal aligner
 * (`src-cpp/src/horizontalaligner.cpp` + `src-cpp/include/vrv/horizontalaligner.h`).
 *
 * Preserves: Alignment / AlignmentReference / HorizontalAligner / MeasureAligner /
 * GraceAligner / TimestampAligner construction + reset order, time/type search,
 * insertion index handling, cross-staff layerN sign handling, grace stacking +
 * reverse alignment, grace width probing, left/right position probing, proportional
 * adjustment, grace X defaults, grace-note spacing shifts, timestamp dedup with
 * the C++ `time - 1.0` adjustment, and visitor dispatch. C++ `delete` of owned
 * grace aligners becomes explicit `ClearGraceAligners()`. C++ `assert` invariants
 * become explicit errors. Alignment bounds use canonical Filters and
 * GetAlignmentLeftRightFunctor, including inherited visitor dispatch.
 */
import { ClassId, FunctorCode, VRV_UNSET } from './vrvdef.js';
import { LogDebug } from './vrv.js';
import { Comparison, Filters, AttNIntegerComparison, ClassIdsComparison } from './comparison.js';
import { GetAlignmentLeftRightFunctor } from './miscfunctor.js';
import { ObjectFactory, VrvObject, ArrayOfObjects, ArrayOfConstObjects } from './object.js';
import { Fraction } from './fraction.js';
import { AttNInteger, InstNInteger } from './atts_shared.js';
import { LayerElement } from './layerelement.js';
import { ApproximatelyEqual, LogWarning } from './vrv.js';
import { SMUFL_E0A4_noteheadBlack } from './smufl.js';
import { DURATION_1 } from './vrvdef.js';
import { TimestampAttr } from './timestamp.js';

/** Canonical libmei AttClassId ordinal (attmodule.ts ATT_CLASS_IDS.ATT_NINTEGER = 167). */
const ATT_NINTEGER = 167;

/** Canonical AlignmentType ordinals from include/vrv/horizontalaligner.h. */
export enum AlignmentType {
  ALIGNMENT_SCOREDEF_OSSIA_CLEF = -2,
  ALIGNMENT_SCOREDEF_OSSIA_KEYSIG = -1,
  ALIGNMENT_MEASURE_START = 0,
  ALIGNMENT_SCOREDEF_CLEF = 1,
  ALIGNMENT_SCOREDEF_KEYSIG = 2,
  ALIGNMENT_SCOREDEF_MENSUR = 3,
  ALIGNMENT_SCOREDEF_METERSIG = 4,
  ALIGNMENT_MEASURE_LEFT_BARLINE = 5,
  ALIGNMENT_FULLMEASURE = 6,
  ALIGNMENT_FULLMEASURE2 = 7,
  ALIGNMENT_CURSOR = 8,
  ALIGNMENT_CURSOR_CHORD = 9,
  ALIGNMENT_CLEF = 10,
  ALIGNMENT_KEYSIG = 11,
  ALIGNMENT_MENSUR = 12,
  ALIGNMENT_METERSIG = 13,
  ALIGNMENT_PROPORT = 14,
  ALIGNMENT_DOT = 15,
  ALIGNMENT_CUSTOS = 16,
  ALIGNMENT_ACCID = 17,
  ALIGNMENT_GRACENOTE = 18,
  ALIGNMENT_BARLINE = 19,
  ALIGNMENT_DIVLINE = 20,
  ALIGNMENT_DEFAULT = 21,
  ALIGNMENT_MEASURE_RIGHT_BARLINE = 22,
  ALIGNMENT_SCOREDEF_CAUTION_CLEF = 23,
  ALIGNMENT_SCOREDEF_CAUTION_KEYSIG = 24,
  ALIGNMENT_SCOREDEF_CAUTION_MENSUR = 25,
  ALIGNMENT_SCOREDEF_CAUTION_METERSIG = 26,
  ALIGNMENT_MEASURE_END = 27,
}

export const BARLINE_REFERENCES = -1;
export const TSTAMP_REFERENCES = -2;

/** (start, end, distance) adjustment tuple for AdjustProportionally. */
export type AdjustmentTuple = [Alignment, Alignment, number];

/** Structural Doc contract actually consumed by the aligners. */
export interface HorizontalAlignerDocLike {
  GetOptions(): {
    m_graceRhythmAlign: { GetValue(): boolean };
    m_graceRightAlign: { GetValue(): boolean };
  };
  GetDrawingUnit(staffSize: number): number;
  GetGlyphWidth(code: number, staffSize: number, graceSize: boolean): number;
  GetLeftMargin(target: unknown): number;
}

/** Structural Measure contract consumed by AdjustGraceNoteSpacing. */
export interface HorizontalAlignerMeasureLike extends VrvObject {
  GetLeftBarLineRight(): number;
}

/** Narrow layer/note/staff contracts for cross-staff resolution. */
interface CrossStaffCarrier {
  GetN(): number;
  Is(what: number): boolean;
}

function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** C++ FunctorInterface default forwarding helper (VisitAlignment -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

/** StaffN matching for ALIGNMENT_REFERENCE children (AttNIntegerComparison). */
class AlignmentReferenceNComparison extends AttNIntegerComparison {}

/** Any-of ClassIds comparison with reversible sense (mirrors ClassIdsComparison). */
class ClassIdsAnyComparison extends ClassIdsComparison {}

export class Alignment extends VrvObject {
  private m_xRel = 0;
  private m_time: Fraction = new Fraction(0);
  private m_type: AlignmentType = AlignmentType.ALIGNMENT_DEFAULT;
  private m_graceAligners: Map<number, GraceAligner> | null = null;

  public constructor(time?: Fraction, type?: AlignmentType) {
    super(ClassId.ALIGNMENT);
    this.Reset();
    if (time) this.m_time = time;
    if (type !== undefined) this.m_type = type;
  }

  public override Reset(): void {
    super.Reset();
    this.m_xRel = 0;
    this.m_time = new Fraction(0);
    this.m_type = AlignmentType.ALIGNMENT_DEFAULT;
    this.ClearGraceAligners();
  }

  public ClearGraceAligners(): void {
    // C++ deletes owned pointers; TS ctor runs Reset() before field init, so guard.
    this.m_graceAligners ??= new Map();
    this.m_graceAligners.clear();
  }

  public override IsSupportedChild(_classId: ClassId): boolean { return true; }

  public SetXRel(xRel: number): void {
    this.ResetCachedDrawingX();
    // C++ SetXRel(int) truncates at each assignment, not only when drawing.
    this.m_xRel = Math.trunc(xRel);
  }
  public GetXRel(): number { return this.m_xRel; }
  public SetTime(time: Fraction): void { this.m_time = time; }
  public GetTime(): Fraction { return this.m_time; }
  public SetType(type: AlignmentType): void { this.m_type = type; }
  public GetType(): AlignmentType { return this.m_type; }

  public IsOfType(types: AlignmentType[]): boolean { return types.includes(this.m_type); }

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitAlignment', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitAlignmentEnd', this); }

  /** C++ operator== : same measure + same time. */
  public IsEqual(other: Alignment): boolean {
    const measure = this.GetFirstAncestor(ClassId.MEASURE);
    const otherMeasure = other.GetFirstAncestor(ClassId.MEASURE);
    assertInvariant(measure && otherMeasure, 'Alignment::operator==: measure ancestors required.');
    return measure === otherMeasure && this.GetTime().equals(other.GetTime());
  }

  /** C++ operator<=> : same measure -> time; else document pre-order. */
  public CompareTo(other: Alignment): -1 | 0 | 1 {
    const measure = this.GetFirstAncestor(ClassId.MEASURE);
    const otherMeasure = other.GetFirstAncestor(ClassId.MEASURE);
    assertInvariant(measure && otherMeasure, 'Alignment::operator<=>: measure ancestors required.');
    if (measure === otherMeasure) return this.GetTime().compare(other.GetTime());
    return VrvObject.IsPreOrdered(measure, otherMeasure) ? -1 : 1;
  }

  public HasAccidVerticalOverlap(otherAlignment: Alignment | null, staffN: number): boolean {
    if (!otherAlignment) return false;
    const match = (ref: VrvObject): boolean =>
      ref.Is(ClassId.ALIGNMENT_REFERENCE) && (ref as unknown as { GetN(): number }).GetN() === staffN;
    const currentRef = this.FindDescendantByComparison(new Comparison(match), 1) as AlignmentReference | null;
    const otherRef = otherAlignment.FindDescendantByComparison(new Comparison(match), 1) as AlignmentReference | null;
    if (!currentRef || !otherRef) return false;
    return otherRef.HasAccidVerticalOverlap(currentRef.GetChildren());
  }

  public HasAlignmentReference(staffN: number): boolean {
    const match = new AlignmentReferenceNComparison(ClassId.ALIGNMENT_REFERENCE, staffN);
    return this.FindDescendantByComparison(match, 1) !== null;
  }

  public HasTimestampOnly(): boolean {
    if (this.GetChildrenForModification().length === 0) return false;
    const notTimestamp = new ClassIdsAnyComparison([ClassId.ALIGNMENT, ClassId.ALIGNMENT_REFERENCE, ClassId.TIMESTAMP_ATTR]);
    notTimestamp.ReverseComparison();
    return this.FindDescendantByComparison(notTimestamp, 2) === null;
  }

  public GetAlignmentReference(staffN: number): AlignmentReference {
    const match = new AlignmentReferenceNComparison(ClassId.ALIGNMENT_REFERENCE, staffN);
    let ref = this.FindDescendantByComparison(match, 1) as AlignmentReference | null;
    if (!ref) {
      ref = new AlignmentReference(staffN);
      this.AddChild(ref);
    }
    return ref;
  }

  public AddLayerElementRef(element: LayerElement): boolean {
    assertInvariant(element.IsLayerElement(), 'Alignment::AddLayerElementRef: LayerElement required.');
    let layerN = 0;
    let staffN = BARLINE_REFERENCES;
    if (element.Is(ClassId.TIMESTAMP_ATTR)) {
      staffN = TSTAMP_REFERENCES;
    } else {
      const layerRef = { value: null as unknown as import('./layerelement.js').LayerContract | null };
      const staffRef = element.GetCrossStaff(layerRef) as unknown as CrossStaffCarrier | null;
      if (staffRef && !element.IsGraceNote()) {
        assertInvariant(layerRef.value, 'Alignment::AddLayerElementRef: cross layer required.');
        layerN = -((layerRef.value as unknown as CrossStaffCarrier).GetN());
        staffN = staffRef.GetN();
      } else {
        const layerAncestor = element.GetFirstAncestor(ClassId.LAYER) as unknown as CrossStaffCarrier | null;
        const staffAncestor = layerAncestor
          ? (layerAncestor as unknown as VrvObject).GetFirstAncestor(ClassId.STAFF) as unknown as CrossStaffCarrier | null
          : null;
        if (staffAncestor && layerAncestor) {
          layerN = layerAncestor.GetN();
          staffN = staffAncestor.GetN();
        } else {
          assertInvariant(
            element.Is(ClassId.BARLINE) || element.Is(ClassId.TIMESTAMP_ATTR),
            'Alignment::AddLayerElementRef: barline/timestamp expected without staff.'
          );
        }
      }
    }
    const alignmentRef = this.GetAlignmentReference(staffN);
    element.SetAlignmentLayerN(layerN);
    alignmentRef.AddChild(element);
    return alignmentRef.HasMultipleLayer();
  }

  public GetLeftRight(
    staffN: number | number[], minLeftOut: { value: number }, maxRightOut: { value: number }, excludes: number[] = []
  ): void {
    if (Array.isArray(staffN)) {
      minLeftOut.value = -VRV_UNSET;
      maxRightOut.value = VRV_UNSET;
      for (const n of staffN) {
        const staffMin = { value: 0 };
        const staffMax = { value: 0 };
        this.GetLeftRight(n, staffMin, staffMax, excludes);
        minLeftOut.value = Math.min(minLeftOut.value, staffMin.value);
        maxRightOut.value = Math.max(maxRightOut.value, staffMax.value);
      }
      return;
    }
    const functor = new GetAlignmentLeftRightFunctor();
    functor.ExcludeClasses(excludes);
    if (staffN !== VRV_UNSET) {
      // Filter only matching reference classes; descendants retain virtual dispatch.
      functor.SetFilters(new Filters([new AttNIntegerComparison(ClassId.ALIGNMENT_REFERENCE, staffN)]));
    }
    this.Process(functor);
    minLeftOut.value = functor.GetMinLeft();
    maxRightOut.value = functor.GetMaxRight();
  }

  public GetGraceAligners(): Map<number, GraceAligner> {
    this.m_graceAligners ??= new Map();
    return this.m_graceAligners;
  }

  public GetGraceAligner(id: number): GraceAligner {
    this.m_graceAligners ??= new Map();
    let aligner = this.m_graceAligners.get(id);
    if (!aligner) {
      aligner = new GraceAligner();
      this.m_graceAligners.set(id, aligner);
    }
    return aligner;
  }

  public HasGraceAligner(id: number): boolean { return (this.m_graceAligners?.has(id) ?? false); }

  public PerformBoundingBoxAlignment(): boolean {
    return this.IsOfType([AlignmentType.ALIGNMENT_ACCID, AlignmentType.ALIGNMENT_DOT, AlignmentType.ALIGNMENT_DEFAULT]);
  }

  public GetReferenceWithElement(element: LayerElement, staffN: number = VRV_UNSET): AlignmentReference | null {
    let reference: AlignmentReference | null = null;
    for (const child of this.GetChildren()) {
      const ref = child as AlignmentReference;
      if ((ref as unknown as { GetN(): number }).GetN() === staffN) return ref;
      if (staffN === VRV_UNSET && child.HasDescendant(element, 1)) return ref;
      reference = ref;
    }
    return reference;
  }

  public GetAlignmentTopBottom(): [number, number] {
    let max = VRV_UNSET;
    let min = VRV_UNSET;
    for (const child of this.GetChildren()) {
      const reference = child as AlignmentReference;
      for (const element of reference.GetChildren()) {
        const top = (element as LayerElement).GetSelfTop();
        if (max === VRV_UNSET || top > max) max = top;
        const bottom = (element as LayerElement).GetSelfBottom();
        if (min === VRV_UNSET || bottom < min) min = bottom;
      }
    }
    return [min, max];
  }

  public static HorizontalSpaceForDuration(
    intervalTime: Fraction, maxActualDur: number, spacingLinear: number, spacingNonLinear: number
  ): number {
    let intervalTimeDbl = intervalTime.ToDouble();
    if (maxActualDur < DURATION_1) intervalTimeDbl /= Math.pow(2.0, DURATION_1 - maxActualDur);
    return Math.pow(intervalTimeDbl * 1024, spacingNonLinear) * spacingLinear * 10.0;
  }
}

export class AlignmentReference extends VrvObject {
  private attNInteger: InstNInteger;
  private m_layerCount = 0;

  public constructor(staffN?: number) {
    super(ClassId.ALIGNMENT_REFERENCE);
    this.RegisterAttClass(ATT_NINTEGER);
    this.attNInteger = new InstNInteger();
    this.Reset();
    this.SetAsReferenceObject();
    if (staffN !== undefined) this.SetN(staffN);
  }

  public override Reset(): void {
    super.Reset();
    if (!this.attNInteger) this.attNInteger = new InstNInteger();
    this.attNInteger.ResetNInteger();
    this.m_layerCount = 0;
  }

  public override IsSupportedChild(_classId: ClassId): boolean { return true; }

  public override AddChild(child: VrvObject): boolean {
    const childElement = child as LayerElement;
    assertInvariant(childElement instanceof LayerElement, 'AlignmentReference::AddChild: LayerElement required.');
    const children = this.GetChildrenForModification();
    if (!(childElement.GetLinkingInterface()?.HasSameasLink() ?? false)) {
      let found = false;
      for (const existing of children) {
        if ((existing as LayerElement).GetAlignmentLayerN() === childElement.GetAlignmentLayerN()) {
          found = true;
          break;
        }
      }
      if (!found) this.m_layerCount++;
    }
    assertInvariant(child.GetParent() && this.IsReferenceObject(), 'AlignmentReference::AddChild: child parent required.');
    children.push(child);
    this.Modify();
    return true;
  }

  public SetN(n: number): void { this.attNInteger.SetN(n); }
  public GetN(): number { return this.attNInteger.GetN(); }

  public HasAccidVerticalOverlap(objects: ArrayOfConstObjects): boolean {
    for (const child of this.GetChildren()) {
      if (!child.Is(ClassId.ACCID)) continue;
      const accid = child as unknown as {
        HasAccid(): boolean;
        VerticalContentOverlap(other: unknown): boolean;
      };
      if (!accid.HasAccid()) continue;
      for (const object of objects) {
        if (accid.VerticalContentOverlap(object)) return true;
      }
    }
    return false;
  }

  public HasMultipleLayer(): boolean { return this.m_layerCount > 1; }

  public HasCrossStaffElements(): boolean {
    const children: VrvObject[] = [];
    const match = new ClassIdsAnyComparison([ClassId.NOTE, ClassId.CHORD]);
    this.FindAllDescendantsByComparison(children, match);
    for (const child of children) {
      if ((child as unknown as { m_crossStaff: unknown }).m_crossStaff) return true;
    }
    return false;
  }

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitAlignmentReference', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitAlignmentReferenceEnd', this); }
}

export class HorizontalAligner extends VrvObject {
  public constructor(classId: ClassId = ClassId.MEASURE_ALIGNER) {
    super(classId);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
  }

  public override CopyChildren(): boolean { return false; }

  public GetAlignmentCount(): number { return this.GetChildrenForModification().length; }

  public SearchAlignmentAtTime(time: Fraction, type: AlignmentType, idxOut: { value: number }): Alignment | null {
    idxOut.value = -1;
    let alignment: Alignment | null = null;
    for (let i = 0; i < this.GetAlignmentCount(); ++i) {
      alignment = this.GetChild(i) as Alignment;
      assertInvariant(alignment, 'HorizontalAligner::SearchAlignmentAtTime: alignment required.');
      const alignmentTime = alignment.GetTime();
      if (alignmentTime.equals(time)) {
        if (alignment.GetType() === type) return alignment;
        if (alignment.GetType() > type) {
          idxOut.value = i;
          break;
        }
      }
      if (alignment.GetTime().compare(time) > 0) {
        idxOut.value = i;
        break;
      }
    }
    return null;
  }

  public AddAlignment(alignment: Alignment, idx = -1): void {
    if (idx === -1) this.AddChild(alignment);
    else this.InsertChild(alignment, idx);
  }

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitHorizontalAligner', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitHorizontalAlignerEnd', this); }
}

export class MeasureAligner extends HorizontalAligner {
  private m_leftAlignment: Alignment | null = null;
  private m_rightAlignment: Alignment | null = null;
  private m_leftBarLineAlignment: Alignment | null = null;
  private m_rightBarLineAlignment: Alignment | null = null;
  private m_nonJustifiableLeftMargin = 0;
  private m_initialTstampDur: Fraction = new Fraction(-1);

  public constructor() {
    super(ClassId.MEASURE_ALIGNER);
    this.m_leftAlignment = null;
    this.m_leftBarLineAlignment = null;
    this.m_rightAlignment = null;
    this.m_rightBarLineAlignment = null;
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.m_nonJustifiableLeftMargin = 0;
    this.m_leftAlignment = new Alignment(new Fraction(-1), AlignmentType.ALIGNMENT_MEASURE_START);
    this.AddAlignment(this.m_leftAlignment);
    this.m_leftBarLineAlignment = new Alignment(new Fraction(-1), AlignmentType.ALIGNMENT_MEASURE_LEFT_BARLINE);
    this.AddAlignment(this.m_leftBarLineAlignment);
    this.m_rightBarLineAlignment = new Alignment(new Fraction(0), AlignmentType.ALIGNMENT_MEASURE_RIGHT_BARLINE);
    this.AddAlignment(this.m_rightBarLineAlignment);
    this.m_rightAlignment = new Alignment(new Fraction(0), AlignmentType.ALIGNMENT_MEASURE_END);
    this.AddAlignment(this.m_rightAlignment);
    this.m_initialTstampDur = new Fraction(-1);
  }

  public override IsSupportedChild(_classId: ClassId): boolean { return true; }

  public GetAlignmentAtTime(time: Fraction, type: AlignmentType): Alignment {
    const idx = { value: -1 };
    const alignment = this.SearchAlignmentAtTime(time, type, idx);
    if (alignment) return alignment;
    if (idx.value === -1) {
      if (type !== AlignmentType.ALIGNMENT_MEASURE_END) {
        assertInvariant(this.m_rightBarLineAlignment, 'MeasureAligner::GetAlignmentAtTime: right barline required.');
        const rightBarlineIdx = this.m_rightBarLineAlignment!.GetIdx();
        assertInvariant(rightBarlineIdx !== -1, 'MeasureAligner::GetAlignmentAtTime: right barline index required.');
        idx.value = rightBarlineIdx;
        this.SetMaxTime(time);
      } else {
        idx.value = this.GetAlignmentCount();
      }
    }
    const created = new Alignment(time, type);
    this.AddAlignment(created, idx.value);
    return created;
  }

  public SetMaxTime(time: Fraction): void {
    assertInvariant(this.m_rightBarLineAlignment, 'MeasureAligner::SetMaxTime: right barline required.');
    const idx = this.m_rightBarLineAlignment!.GetIdx();
    assertInvariant(idx !== -1, 'MeasureAligner::SetMaxTime: right barline index required.');
    for (let i = idx; i < this.GetAlignmentCount(); ++i) {
      const alignment = this.GetChild(i) as Alignment;
      assertInvariant(alignment, 'MeasureAligner::SetMaxTime: alignment required.');
      if (time.compare(alignment.GetTime()) > 0) alignment.SetTime(time);
    }
  }

  public GetMaxTime(): Fraction {
    assertInvariant(this.m_rightBarLineAlignment, 'MeasureAligner::GetMaxTime: right barline required.');
    assertInvariant(this.m_rightAlignment, 'MeasureAligner::GetMaxTime: right alignment required.');
    return this.m_rightAlignment!.GetTime();
  }

  public GetNonJustifiableMargin(): number { return this.m_nonJustifiableLeftMargin; }

  public SetInitialTstamp(meterUnit: number): void {
    this.m_initialTstampDur = Fraction.fromDuration(meterUnit).multiply(new Fraction(-1));
  }
  public GetInitialTstampDur(): Fraction { return this.m_initialTstampDur; }

  public GetLeftAlignment(): Alignment | null { return this.m_leftAlignment; }
  public GetLeftBarLineAlignment(): Alignment | null { return this.m_leftBarLineAlignment; }
  public GetRightAlignment(): Alignment | null { return this.m_rightAlignment; }
  public GetRightBarLineAlignment(): Alignment | null { return this.m_rightBarLineAlignment; }

  public AdjustProportionally(adjustments: AdjustmentTuple[]): void {
    for (const [start, end, dist] of adjustments) {
      assertInvariant(start, 'MeasureAligner::AdjustProportionally: start required.');
      assertInvariant(end, 'MeasureAligner::AdjustProportionally: end required.');
      if (dist === 0) {
        LogDebug('Trying to adjust alignment with a distance of 0;');
        continue;
      }
      const startX = start.GetXRel();
      const endX = end.GetXRel();
      for (const child of this.GetChildren()) {
        const current = child as Alignment;
        assertInvariant(current, 'MeasureAligner::AdjustProportionally: alignment required.');
        if (current.GetXRel() <= startX) continue;
        if (current.GetXRel() >= endX) {
          current.SetXRel(current.GetXRel() + dist);
          continue;
        }
        const ratio = Math.trunc((current.GetXRel() - startX) * 100 / (endX - startX));
        const shift = Math.trunc(dist * ratio / 100);
        current.SetXRel(current.GetXRel() + shift);
      }
    }
  }

  public PushAlignmentsRight(): void {
    let previous: Alignment | null = null;
    const children = this.GetChildren();
    for (let i = children.length - 1; i >= 0; --i) {
      const current = children[i] as Alignment;
      assertInvariant(current, 'MeasureAligner::PushAlignmentsRight: alignment required.');
      if (current.IsOfType([AlignmentType.ALIGNMENT_GRACENOTE])) {
        if (previous) current.SetXRel(previous.GetXRel());
      } else {
        previous = current;
      }
    }
  }

  public AdjustGraceNoteSpacing(doc: HorizontalAlignerDocLike, alignment: Alignment, staffN: number): void {
    assertInvariant(doc, 'MeasureAligner::AdjustGraceNoteSpacing: doc required.');
    assertInvariant(alignment, 'MeasureAligner::AdjustGraceNoteSpacing: alignment required.');
    assertInvariant(
      alignment.GetType() === AlignmentType.ALIGNMENT_GRACENOTE,
      'MeasureAligner::AdjustGraceNoteSpacing: grace alignment required.'
    );
    const graceAlignerId = doc.GetOptions().m_graceRhythmAlign.GetValue() ? 0 : staffN;
    assertInvariant(alignment.HasGraceAligner(graceAlignerId), 'MeasureAligner::AdjustGraceNoteSpacing: grace aligner required.');
    const measure = this.GetParent() as unknown as HorizontalAlignerMeasureLike | null;
    assertInvariant(measure, 'MeasureAligner::AdjustGraceNoteSpacing: measure required.');

    let maxRight = VRV_UNSET;
    let rightAlignment: Alignment | null = null;
    const staffNGrp = doc.GetOptions().m_graceRightAlign.GetValue() ? VRV_UNSET : staffN;

    let found = false;
    const children = this.GetChildren();
    for (let i = children.length - 1; i >= 0; --i) {
      if (!found) {
        if (children[i] === alignment) found = true;
        continue;
      }
      rightAlignment = children[i] as Alignment;
      assertInvariant(rightAlignment, 'MeasureAligner::AdjustGraceNoteSpacing: alignment required.');
      if (rightAlignment.IsOfType([AlignmentType.ALIGNMENT_FULLMEASURE, AlignmentType.ALIGNMENT_FULLMEASURE2])) continue;
      if (rightAlignment.GetType() === AlignmentType.ALIGNMENT_MEASURE_LEFT_BARLINE) {
        maxRight = measure!.GetLeftBarLineRight();
        break;
      }
      const minLeft = { value: 0 };
      const max = { value: 0 };
      rightAlignment.GetLeftRight(staffNGrp, minLeft, max, [ClassId.CLEF]);
      maxRight = max.value;
      if (maxRight !== VRV_UNSET) break;
    }
    if (!rightAlignment || maxRight === VRV_UNSET) return;

    let left = alignment.GetGraceAligner(graceAlignerId).GetGraceGroupLeft(staffN);
    if (left !== -VRV_UNSET) left -= doc.GetLeftMargin(ClassId.NOTE) * doc.GetDrawingUnit(100);
    if (left < maxRight) {
      const spacing = maxRight - left;
      this.AdjustProportionally([[rightAlignment, alignment, spacing]]);
    }
  }

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitMeasureAligner', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitMeasureAlignerEnd', this); }
}

export class GraceAligner extends HorizontalAligner {
  private m_graceStack: VrvObject[] = [];
  private m_totalWidth = 0;

  public constructor() {
    super(ClassId.GRACE_ALIGNER);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.m_totalWidth = 0;
  }

  public GetAlignmentAtTime(time: Fraction, type: AlignmentType): Alignment {
    const idx = { value: -1 };
    const alignment = this.SearchAlignmentAtTime(time, type, idx);
    if (alignment) return alignment;
    if (idx.value === -1) idx.value = this.GetAlignmentCount();
    const created = new Alignment(time, type);
    this.AddAlignment(created, idx.value);
    return created;
  }

  public StackGraceElement(element: VrvObject): void {
    assertInvariant(
      element.Is(ClassId.NOTE) || element.Is(ClassId.CHORD),
      'GraceAligner::StackGraceElement: note/chord required.'
    );
    if (element.Is(ClassId.NOTE)) {
      // IsChordTone lives on Note, not on the LayerElement base; duck-type it.
      const note = element as unknown as { IsChordTone?: () => unknown };
      if (typeof note.IsChordTone === 'function' && note.IsChordTone()) return;
    }
    this.m_graceStack.push(element);
  }

  public AlignStack(): void {
    let time = new Fraction(0);
    for (let i = this.m_graceStack.length; i > 0; --i) {
      const element = this.m_graceStack[i - 1] as LayerElement;
      assertInvariant(element, 'GraceAligner::AlignStack: element required.');
      const duration = element.GetAlignmentDurationNoParams(false);
      time = time.subtract(duration);
      const alignment = this.GetAlignmentAtTime(time, AlignmentType.ALIGNMENT_DEFAULT);
      element.SetGraceAlignment(alignment as never);

      const descendants: VrvObject[] = [];
      const matchType = new ClassIdsAnyComparison([ClassId.ACCID, ClassId.FLAG, ClassId.NOTE, ClassId.STEM]);
      element.FindAllDescendantsByComparison(descendants, matchType);
      alignment.AddLayerElementRef(element);

      for (const child of descendants) {
        if (child === element) continue;
        const childElement = child as LayerElement;
        assertInvariant(childElement, 'GraceAligner::AlignStack: child element required.');
        childElement.SetGraceAlignment(alignment as never);
        alignment.AddLayerElementRef(childElement);
      }
    }
    this.m_graceStack.length = 0;
  }

  public GetGraceGroupLeft(staffN: number): number {
    let leftAlignment: Alignment | null = null;
    if (staffN !== VRV_UNSET) {
      const matchStaff = new AlignmentReferenceNComparison(ClassId.ALIGNMENT_REFERENCE, staffN);
      const reference = this.FindDescendantByComparison(matchStaff);
      if (!reference) return -VRV_UNSET;
      leftAlignment = reference.GetParent() as Alignment | null;
    } else {
      leftAlignment = this.GetFirst() as Alignment | null;
    }
    if (!leftAlignment) return -VRV_UNSET;
    const minLeft = { value: 0 };
    const maxRight = { value: 0 };
    leftAlignment.GetLeftRight(staffN, minLeft, maxRight);
    return minLeft.value;
  }

  public GetGraceGroupRight(staffN: number): number {
    const rightAlignment = this.GetLast() as Alignment | null;
    if (!rightAlignment) return VRV_UNSET;
    const minLeft = { value: 0 };
    const maxRight = { value: 0 };
    rightAlignment.GetLeftRight(staffN, minLeft, maxRight);
    return maxRight.value;
  }

  public SetGraceAlignmentXPos(doc: HorizontalAlignerDocLike): void {
    assertInvariant(doc, 'GraceAligner::SetGraceAlignmentXPos: doc required.');
    const children = this.GetChildren();
    let i = 0;
    for (let k = children.length - 1; k >= 0; --k) {
      const alignment = children[k] as Alignment;
      assertInvariant(alignment, 'GraceAligner::SetGraceAlignmentXPos: alignment required.');
      alignment.SetXRel(-i * doc.GetGlyphWidth(SMUFL_E0A4_noteheadBlack, 100, false));
      ++i;
    }
  }

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitGraceAligner', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitGraceAlignerEnd', this); }
}

export class TimestampAligner extends VrvObject {
  public constructor() {
    super(ClassId.TIMESTAMP_ALIGNER);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
  }

  public override IsSupportedChild(_classId: ClassId): boolean { return true; }

  public GetTimestampAtTime(time: number): TimestampAttr {
    const adjusted = time - 1.0;
    const children = this.GetChildrenForModification();
    let idx = -1;
    let timestampAttr: TimestampAttr | null = null;
    let i = 0;
    for (const child of children) {
      timestampAttr = child as TimestampAttr;
      assertInvariant(timestampAttr, 'TimestampAligner::GetTimestampAtTime: timestamp required.');
      const alignmentTime = timestampAttr.GetActualDurPos();
      if (ApproximatelyEqual(alignmentTime, adjusted)) return timestampAttr;
      if (alignmentTime > adjusted) {
        idx = i;
        break;
      }
      ++i;
    }
    const created = new TimestampAttr();
    created.SetDrawingPos(adjusted);
    if (idx === -1) this.AddChild(created);
    else this.InsertChild(created, idx);
    return created;
  }

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitTimestampAligner', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitTimestampAlignerEnd', this); }
}

ObjectFactory.GetInstance().Register('alignment', ClassId.ALIGNMENT, () => new Alignment());
ObjectFactory.GetInstance().Register('alignmentReference', ClassId.ALIGNMENT_REFERENCE, () => new AlignmentReference());
ObjectFactory.GetInstance().Register('measureAligner', ClassId.MEASURE_ALIGNER, () => new MeasureAligner());
ObjectFactory.GetInstance().Register('graceAligner', ClassId.GRACE_ALIGNER, () => new GraceAligner());
ObjectFactory.GetInstance().Register('timestampAligner', ClassId.TIMESTAMP_ALIGNER, () => new TimestampAligner());

