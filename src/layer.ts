/**
 * Pure TypeScript translation of Verovio's `Layer`
 * (`src-cpp/src/layer.cpp` + `src-cpp/include/vrv/layer.h`).
 *
 * C++ has `Layer` inherit `Object` + `DrawingListInterface` +
 * `ObjectListInterface` + four generated libMEI attribute classes;
 * TypeScript models the multiple inheritance with composition.
 *
 * The `LayersInTimeSpanFunctor` / `LayerElementsInTimeSpanFunctor`
 * collaborators from `findlayerelementsfunctor.cpp` are not yet migrated;
 * they are consumed through an injectable structural contract so the Layer
 * methods remain faithful without inventing the pending algorithms.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, ObjectListInterface, VrvObject, ArrayOfObjects } from './object.js';
import { IsEditorialElementComparison, ClassIdComparison } from './comparison.js';
import { AttNIntegerComparison, Filters } from './comparison.js';
import { DrawingListInterface } from './drawinginterface.js';
import { InstCue, InstNInteger, InstTyped, InstVisibility } from './atts_shared.js';
import { Clef } from './clef.js';
import { KeySig } from './keysig.js';
import { Mensur } from './mensur.js';
import { MeterSig } from './metersig.js';
import { MeterSigGrp } from './metersiggrp.js';
import { StaffDef } from './staffdef.js';
import { Fraction } from './fraction.js';
import { Cursor } from './cursor.js';
import { LayerElement } from './layerelement.js';
import { Beam } from './beam.js';
import { LayersInTimeSpanFunctor, LayerElementsInTimeSpanFunctor } from './findlayerelementsfunctor.js';

/** data_STEMDIRECTION ordinals (drawinginterface.ts). */
const STEMDIRECTION_NONE = 0;

/** Structural contract for the not-yet-migrated measure aligner / measure. */
export interface LayerMeasureLike {
  GetFirst(classId: ClassId): VrvObject | null;
  FindAllDescendantsBetween(out: VrvObject[], comparison: unknown, start: VrvObject | null, end: VrvObject | null): void;
  GetLayerCountInTimeSpan?(time: Fraction, duration: Fraction, staff: number): number;
}

/** Structural contract for the pending `LayersInTimeSpanFunctor`. */
export interface LayersInTimeSpanFunctorLike {
  SetEvent(time: Fraction, duration: Fraction): void;
  SetFilters(filters: unknown): void;
  GetLayers(): Set<number>;
  Process(target: unknown): void;
}

/** Structural contract for the pending `LayerElementsInTimeSpanFunctor`. */
export interface LayerElementsInTimeSpanFunctorLike {
  SetEvent(time: Fraction, duration: Fraction): void;
  ConsiderAllLayersButCurrent(): void;
  SetFilters(filters: unknown): void;
  GetElements(): VrvObject[];
  Process(target: unknown): void;
}

/** Canonical `Cursor` alias for backward compatibility. */
export type CursorLike = Cursor;

/** Structural contract for the staff ancestor drawing-staffDef chain. */
interface LayerStaffLike {
  GetDrawingStaffDef(): {
    GetCurrentClef(): unknown | null;
    GetCurrentKeySig(): unknown | null;
    GetCurrentMensur(): unknown | null;
    GetCurrentMeterSig(): unknown | null;
    GetCurrentProport(): unknown | null;
  } | null;
}

/** ObjectListInterface composition: keep layer/editorial-tree elements. */
class LayerListInterface extends ObjectListInterface {
  protected override FilterList(childList: VrvObject[]): void {
    // Retain only LayerElement children (editorial wrappers are skipped by
    // the C++ FilterList override in layer.cpp).
    for (let i = 0; i < childList.length;) {
      if (VrvObject.IsLayerElement(childList[i].GetClassId())) ++i;
      else childList.splice(i, 1);
    }
  }
}

/** Pure TypeScript translation of Verovio's `Layer`. */
export class Layer extends VrvObject {
  private readonly objectList: LayerListInterface;
  private drawingListInterface: DrawingListInterface | null = null;
  private attCue: InstCue | null = null;
  private attNInteger: InstNInteger | null = null;
  private attTyped: InstTyped | null = null;
  private attVisibility: InstVisibility | null = null;

  // Owned staffDef objects (C++ `new`/`delete` ownership)
  private m_staffDefClef: Clef | null = null;
  private m_staffDefKeySig: KeySig | null = null;
  private m_staffDefMensur: Mensur | null = null;
  private m_staffDefMeterSig: MeterSig | null = null;
  private m_staffDefMeterSigGrp: MeterSigGrp | null = null;
  private m_drawKeySigCancellation: boolean = false;
  // Cautionary values
  private m_cautionStaffDefClef: Clef | null = null;
  private m_cautionStaffDefKeySig: KeySig | null = null;
  private m_cautionStaffDefMensur: Mensur | null = null;
  private m_cautionStaffDefMeterSig: MeterSig | null = null;
  private m_drawCautionKeySigCancel: boolean = false;
  // Ossia
  private m_drawOssiaStaffDef: boolean = false;
  // Cursor (owned)
  private m_cursor: Cursor | null = null;

  private m_drawingStemDir: number = STEMDIRECTION_NONE;
  private m_crossStaffFromAbove: boolean = false;
  private m_crossStaffFromBelow: boolean = false;

  /** Injectable factories for the time-span functors (default = canonical implementations). */
  public static LayersInTimeSpanFunctorFactory:
    (meterSig: unknown | null, mensur: unknown | null) => LayersInTimeSpanFunctorLike =
    (meterSig, mensur) => new LayersInTimeSpanFunctor(meterSig, mensur) as unknown as LayersInTimeSpanFunctorLike;
  public static LayerElementsInTimeSpanFunctorFactory:
    (meterSig: unknown | null, mensur: unknown | null, layer: Layer) => LayerElementsInTimeSpanFunctorLike =
    (meterSig, mensur, layer) => new LayerElementsInTimeSpanFunctor(meterSig, mensur, layer as unknown as never) as unknown as LayerElementsInTimeSpanFunctorLike;

  public constructor() {
    super(ClassId.LAYER);
    this.objectList = new LayerListInterface();
    this.objectList.SetInterfaceOwner(this as unknown as VrvObject);
    this.ensureComponents();
    this.RegisterAttClass(ATT_CUE);
    this.RegisterAttClass(ATT_NINTEGER);
    this.RegisterAttClass(ATT_TYPED);
    this.RegisterAttClass(ATT_VISIBILITY);
    this.Reset();
  }

  public override GetClassName(): string { return 'layer'; }

  public override Reset(): void {
    super.Reset();
    this.drawingListInterface?.Reset();
    this.attCue?.ResetCue();
    this.attNInteger?.ResetNInteger();
    this.attTyped?.ResetTyped();
    this.attVisibility?.ResetVisibility();

    if (this.m_staffDefClef !== undefined) this.ResetStaffDefObjects();
    if (this.m_cursor !== undefined) this.ResetCursor();

    this.m_drawingStemDir = STEMDIRECTION_NONE;
    this.m_crossStaffFromAbove = false;
    this.m_crossStaffFromBelow = false;
  }

  public override CloneReset(): void {
    super.CloneReset();
    this.m_drawKeySigCancellation = false;
    this.m_staffDefClef = null;
    this.m_staffDefKeySig = null;
    this.m_staffDefMensur = null;
    this.m_staffDefMeterSig = null;
    this.m_staffDefMeterSigGrp = null;
    this.m_drawCautionKeySigCancel = false;
    this.m_cautionStaffDefClef = null;
    this.m_cautionStaffDefKeySig = null;
    this.m_cautionStaffDefMensur = null;
    this.m_cautionStaffDefMeterSig = null;
    this.m_drawOssiaStaffDef = false;
    this.m_drawingStemDir = STEMDIRECTION_NONE;
    this.m_crossStaffFromAbove = false;
    this.m_crossStaffFromBelow = false;
  }

  private ensureComponents(): void {
    this.drawingListInterface ??= new DrawingListInterface();
    this.attCue ??= new InstCue();
    this.attNInteger ??= new InstNInteger();
    this.attTyped ??= new InstTyped();
    this.attVisibility ??= new InstVisibility();
  }

  //---------------//
  // StaffDef state //
  //---------------//

  public ResetStaffDefObjects(): void {
    this.m_drawKeySigCancellation = false;
    // C++ deletes the owned objects; TS drops the references (GC owns them).
    this.m_staffDefClef = null;
    this.m_staffDefKeySig = null;
    this.m_staffDefMensur = null;
    this.m_staffDefMeterSig = null;
    this.m_staffDefMeterSigGrp = null;
    // cautionary values
    this.m_drawCautionKeySigCancel = false;
    this.m_cautionStaffDefClef = null;
    this.m_cautionStaffDefKeySig = null;
    this.m_cautionStaffDefMensur = null;
    this.m_cautionStaffDefMeterSig = null;
    // ossia
    this.m_drawOssiaStaffDef = false;
  }

  public GetStaffDefClef(): Clef | null { return this.m_staffDefClef; }
  public GetStaffDefKeySig(): KeySig | null { return this.m_staffDefKeySig; }
  public GetStaffDefMensur(): Mensur | null { return this.m_staffDefMensur; }
  public GetStaffDefMeterSig(): MeterSig | null { return this.m_staffDefMeterSig; }
  public GetStaffDefMeterSigGrp(): MeterSigGrp | null { return this.m_staffDefMeterSigGrp; }

  public HasStaffDef(): boolean {
    return Boolean(
      this.m_staffDefClef ||
      this.m_staffDefKeySig ||
      this.m_staffDefMensur ||
      this.m_staffDefMeterSig ||
      this.m_staffDefMeterSigGrp
    );
  }
  public HasCautionStaffDef(): boolean {
    return Boolean(this.m_cautionStaffDefClef || this.m_cautionStaffDefKeySig
      || this.m_cautionStaffDefMensur || this.m_cautionStaffDefMeterSig);
  }
  public GetCautionStaffDefClef(): Clef | null { return this.m_cautionStaffDefClef; }
  public GetCautionStaffDefKeySig(): KeySig | null { return this.m_cautionStaffDefKeySig; }
  public GetCautionStaffDefMensur(): Mensur | null { return this.m_cautionStaffDefMensur; }
  public GetCautionStaffDefMeterSig(): MeterSig | null { return this.m_cautionStaffDefMeterSig; }
  public GetDrawKeySigCancellation(): boolean { return this.m_drawKeySigCancellation; }
  public SetDrawKeySigCancellation(v: boolean): void { this.m_drawKeySigCancellation = v; }
  public GetDrawCautionKeySigCancel(): boolean { return this.m_drawCautionKeySigCancel; }
  public SetDrawCautionKeySigCancel(v: boolean): void { this.m_drawCautionKeySigCancel = v; }
  public DrawOssiaStaffDef(): boolean { return this.m_drawOssiaStaffDef; }
  public SetDrawOssiaStaffDef(v: boolean): void { this.m_drawOssiaStaffDef = v; }

  //--------------------//
  // Stem direction state//
  //--------------------//

  public GetDrawingStemDirValue(): number { return this.m_drawingStemDir; }
  public SetDrawingStemDirValue(v: number): void { this.m_drawingStemDir = v; }
  public SetDrawingStemDir(v: number): void { this.m_drawingStemDir = v; }
  public SetCrossStaffFromAbove(v: boolean): void { this.m_crossStaffFromAbove = v; }
  public SetCrossStaffFromBelow(v: boolean): void { this.m_crossStaffFromBelow = v; }
  public HasCrossStaffFromAbove(): boolean { return this.m_crossStaffFromAbove; }
  public HasCrossStaffFromBelow(): boolean { return this.m_crossStaffFromBelow; }
  public GetCrossStaffFromAbove(): boolean { return this.m_crossStaffFromAbove; }
  public GetCrossStaffFromBelow(): boolean { return this.m_crossStaffFromBelow; }

  //---------//
  // Children //
  //---------//

  public override IsSupportedChild(classId: ClassId): boolean {
    if (VrvObject.IsLayerElement(classId)) return true;
    if (VrvObject.IsEditorialElement(classId)) return true;
    return false;
  }

  public override ResetCachedDrawingY(): void {
    this.m_cursor?.ResetCachedDrawingY();
    super.ResetCachedDrawingY();
  }

  //-----------------------//
  // List facade           //
  //-----------------------//

  public GetList(): VrvObject[] { return this.objectList.GetList(); }
  public GetListSize(): number { return this.objectList.GetListSize(); }
  public HasEmptyList(): boolean { return this.objectList.HasEmptyList(); }
  public GetListFront(): VrvObject { return this.objectList.GetListFront(); }
  public GetListBack(): VrvObject { return this.objectList.GetListBack(); }
  public GetListIndex(element: VrvObject): number { return this.objectList.GetListIndex(element); }
  public GetListFirstBackward(startFrom: VrvObject, classId: ClassId = ClassId.UNSPECIFIED): VrvObject | null {
    return this.objectList.GetListFirstBackward(startFrom, classId);
  }
  public GetListPrevious(element: VrvObject): VrvObject | null { return this.objectList.GetListPrevious(element); }
  public GetListNext(element: VrvObject): VrvObject | null { return this.objectList.GetListNext(element); }
  public ResetList(): void { this.objectList.ResetList(); }

  public GetPreviousInLayer(element: LayerElement | null): LayerElement | null {
    this.ResetList();
    if (!element || this.HasEmptyList()) return null;
    return this.GetListPrevious(element as unknown as VrvObject) as unknown as LayerElement | null;
  }

  public GetNextInLayer(element: LayerElement | null): LayerElement | null {
    this.ResetList();
    if (!element || this.HasEmptyList()) return null;
    return this.GetListNext(element as unknown as VrvObject) as unknown as LayerElement | null;
  }

  /**
   * Last layer element at or before x. Preserves the C++ traversal:
   * editorial wrappers are resolved to their last non-editorial descendant,
   * non-layer elements are skipped, and the first element beyond x ends the
   * scan with the previous element.
   */
  public GetAtPos(x: number): LayerElement | null {
    const first = this.GetFirst();
    if (!first) return null;

    let testFirst: VrvObject | null = first;
    if (testFirst.IsEditorialElement()) {
      const cmp = new IsEditorialElementComparison();
      cmp.ReverseComparison();
      testFirst = this.FindDescendantByComparison(cmp);
    }
    if (!testFirst || !testFirst.IsLayerElement()) return null;

    let element = testFirst as unknown as LayerElement;
    if (element.GetDrawingX() > x) return null;

    let next: VrvObject | null;
    while ((next = this.GetNext())) {
      let nextLayerElement: LayerElement | null = null;
      if (next.IsLayerElement()) {
        nextLayerElement = next as unknown as LayerElement;
      } else if (next.IsEditorialElement()) {
        const cmp = new IsEditorialElementComparison();
        cmp.ReverseComparison();
        nextLayerElement = next.FindDescendantByComparison(cmp) as unknown as LayerElement | null;
        if (!nextLayerElement) continue;
      } else {
        continue;
      }
      if (nextLayerElement.GetDrawingX() > x) return element;
      element = nextLayerElement;
    }
    // This can be NULL if the layer is empty
    return element;
  }

  //-----------------------//
  // Clef lookup           //
  //-----------------------//

  public GetClef(test: LayerElement | null): Clef | null {
    let testObject: VrvObject | null = test as unknown as VrvObject | null;

    if (!test) {
      return this.GetCurrentClef();
    }

    // make sure list is set
    this.ResetList();
    if (!test.Is(ClassId.CLEF)) {
      testObject = this.GetListFirstBackward(testObject!, ClassId.CLEF);
    }

    if (testObject && testObject.Is(ClassId.CLEF)) {
      return testObject as unknown as Clef;
    }
    const facsClef = this.GetClefFacs(test);
    if (facsClef != null) {
      return facsClef;
    }
    return this.GetCurrentClef();
  }

  public GetClefFacs(test: LayerElement): Clef | null {
    const doc = this.GetFirstAncestor(ClassId.DOC) as unknown as (LayerMeasureLike & { IsFacs(): boolean }) | null;
    if (!doc) throw new Error('Layer::GetClefFacs: doc ancestor expected');
    if (doc.IsFacs()) {
      const clefs: VrvObject[] = [];
      const ac = new ClassIdComparison(ClassId.CLEF);
      doc.FindAllDescendantsBetween(clefs, ac, doc.GetFirst(ClassId.CLEF), test as unknown as VrvObject);
      if (clefs.length > 0) {
        return clefs[clefs.length - 1] as unknown as Clef;
      }
    }
    return null;
  }

  public GetClefLocOffset(test: LayerElement | null): number {
    const clef = this.GetClef(test);
    if (!clef) return 0;
    return (clef as unknown as { GetClefLocOffset(): number }).GetClefLocOffset();
  }

  public GetCrossStaffClefLocOffset(element: LayerElement, currentOffset: number): number {
    if (element.m_crossStaff) {
      this.ResetList();
      if (!element.Is(ClassId.CLEF)) {
        const clef = this.GetListFirstBackward(element as unknown as VrvObject, ClassId.CLEF) as unknown as (LayerElement & { GetClefLocOffset(): number }) | null;
        if (clef && clef.m_crossStaff) {
          return clef.GetClefLocOffset();
        }
      }
    }
    return currentOffset;
  }

  //---------------------------//
  // Stem direction resolution  //
  //---------------------------//

  // Overloads merged: C++ has GetDrawingStemDir(const LayerElement*), GetDrawingStemDir(const ArrayOfBeamElementCoords*)
  // and the trivial GetDrawingStemDir() { return m_drawingStemDir; }. No-arg form is preserved here.
  public GetDrawingStemDir(element?: LayerElement): number {
    if (!element) return this.m_drawingStemDir;
    if (this.GetLayerCountForTimeSpanOf(element) < 2) {
      return STEMDIRECTION_NONE;
    } else {
      if (this.m_crossStaffFromBelow) {
        return (element.m_crossStaff) ? 2 /* STEMDIRECTION_down */ : 1 /* STEMDIRECTION_up */;
      } else if (this.m_crossStaffFromAbove) {
        return (element.m_crossStaff) ? 1 /* up */ : 2 /* down */;
      } else {
        return this.m_drawingStemDir;
      }
    }
  }

  public GetDrawingStemDirForCoords(coords: { m_element: VrvObject | null }[]): number {
    if (coords.length === 0) throw new Error('Layer::GetDrawingStemDir(coords): non-empty coords expected');

    // Adjust the x position of the first and last element for taking into account the stem width
    const first = coords[0].m_element as unknown as LayerElement | null;
    const last = coords[coords.length - 1].m_element as unknown as LayerElement | null;

    if (!first || !last) {
      return this.m_drawingStemDir;
    }

    const measure = this.GetFirstAncestor(ClassId.MEASURE) as unknown as
      (LayerMeasureLike & { GetLayerCountInTimeSpan(time: Fraction, duration: Fraction, staff: number): number }) | null;
    if (!measure) throw new Error('Layer::GetDrawingStemDirForCoords: measure ancestor expected');

    const alignmentFirst = first.GetAlignment();
    if (!alignmentFirst) throw new Error('Layer::GetDrawingStemDirForCoords: first alignment expected');
    const alignmentLast = last.GetAlignment();
    if (!alignmentLast) throw new Error('Layer::GetDrawingStemDirForCoords: last alignment expected');

    // We are ignoring cross-staff situation here because this should not be called if we have one
    const staff = first.GetAncestorStaff();

    const time = (alignmentFirst as any).GetTime();
    let duration: Fraction;
    // For the sake of counting number of layers consider only current measure. If first and last elements' layers are
    // different, take only time within current measure to run GetLayerCountInTimeSpan.
    const lastMeasure = last.GetFirstAncestor(ClassId.MEASURE);
    if (lastMeasure === (measure as unknown as VrvObject)) {
      duration = (alignmentLast as any).GetTime().subtract(time).add(last.GetAlignmentDurationNoParams());
    } else {
      duration = (measure as unknown as { m_measureAligner: { GetRightAlignment(): { GetTime(): Fraction } } })
        .m_measureAligner.GetRightAlignment().GetTime().subtract(time);
    }

    if (this.GetLayerCountInTimeSpan(time, duration, measure as never, (staff as unknown as { GetN(): number }).GetN()) < 2) {
      return STEMDIRECTION_NONE;
    } else {
      return this.m_drawingStemDir;
    }
  }

  //---------------------------//
  // Time-span layer counting   //
  //---------------------------//

  public GetLayersNForTimeSpanOf(element: LayerElement): Set<number> {
    const measure = this.GetFirstAncestor(ClassId.MEASURE) as unknown as LayerMeasureLike | null;
    if (!measure) throw new Error('Layer::GetLayersNForTimeSpanOf: measure ancestor expected');

    const alignment = element.GetAlignment();
    if (!alignment) throw new Error('Layer::GetLayersNForTimeSpanOf: alignment expected');

    const staff = element.GetAncestorStaff(1 /* RESOLVE_CROSS_STAFF */);

    return this.GetLayersNInTimeSpan((alignment as any).GetTime(), element.GetAlignmentDurationNoParams(), measure as never, (staff as unknown as { GetN(): number }).GetN());
  }

  public GetLayerCountForTimeSpanOf(element: LayerElement): number {
    return this.GetLayersNForTimeSpanOf(element).size;
  }

  public GetLayersNInTimeSpan(time: Fraction, duration: Fraction, measure: LayerMeasureLike & { m_measureAligner: unknown }, staff: number): Set<number> {
    const layersInTimeSpan = Layer.LayersInTimeSpanFunctorFactory(this.GetCurrentMeterSig(), this.GetCurrentMensur());
    layersInTimeSpan.SetEvent(time, duration);

    const filters = new Filters();
    filters.Add(new AttNIntegerComparison(ClassId.ALIGNMENT_REFERENCE, staff));
    layersInTimeSpan.SetFilters(filters);

    (measure.m_measureAligner as unknown as { Process(f: unknown): void }).Process(layersInTimeSpan);

    return layersInTimeSpan.GetLayers();
  }

  public GetLayerCountInTimeSpan(time: Fraction, duration: Fraction, measure: LayerMeasureLike & { m_measureAligner: unknown }, staff: number): number {
    return this.GetLayersNInTimeSpan(time, duration, measure, staff).size;
  }

  //------------------------------//
  // Time-span layer elements      //
  //------------------------------//

  public GetLayerElementsForTimeSpanOf(element: LayerElement, excludeCurrent = false): VrvObject[] {
    const measure = this.GetFirstAncestor(ClassId.MEASURE) as unknown as LayerMeasureLike | null;
    if (!measure) throw new Error('Layer::GetLayerElementsForTimeSpanOf: measure ancestor expected');

    let time = new Fraction(0, 1);
    let duration: Fraction;
    const alignment = element.GetAlignment();
    // Get duration and time if element has alignment
    if (alignment) {
      time = (alignment as any).GetTime();
      duration = element.GetAlignmentDurationNoParams();
    }
    // If it is Beam, try to get alignments for first and last elements and calculate
    // the duration of the beam based on those
    else if (element.Is(ClassId.BEAM)) {
      const beam = element as unknown as Beam & { GetListFront?: () => VrvObject | null; GetListBack?: () => VrvObject | null };

      // Beam does not yet compose an ObjectListInterface facade; the list
      // access mirrors the C++ `beam->GetListFront()` contract.
      const first = (beam.GetListFront ? beam.GetListFront() : null) as unknown as LayerElement | null;
      const last = (beam.GetListBack ? beam.GetListBack() : null) as unknown as LayerElement | null;

      if (!first || !last) return [];

      time = (first.GetAlignment() as any).GetTime();
      const lastTime = (last.GetAlignment() as any).GetTime();
      duration = lastTime.subtract(time).add(last.GetAlignmentDurationNoParams());
    } else {
      return [];
    }

    const staff = element.GetAncestorStaff(1 /* RESOLVE_CROSS_STAFF */);

    return this.GetLayerElementsInTimeSpan(time, duration!, measure as never, (staff as unknown as { GetN(): number }).GetN(), excludeCurrent);
  }

  public GetLayerElementsInTimeSpan(
    time: Fraction, duration: Fraction, measure: LayerMeasureLike & { m_measureAligner: unknown }, staff: number, excludeCurrent = false,
  ): VrvObject[] {
    const layerElementsInTimeSpan = Layer.LayerElementsInTimeSpanFunctorFactory(this.GetCurrentMeterSig(), this.GetCurrentMensur(), this);
    layerElementsInTimeSpan.SetEvent(time, duration);
    if (excludeCurrent) layerElementsInTimeSpan.ConsiderAllLayersButCurrent();

    const filters = new Filters();
    filters.Add(new AttNIntegerComparison(ClassId.ALIGNMENT_REFERENCE, staff));
    layerElementsInTimeSpan.SetFilters(filters);

    (measure.m_measureAligner as unknown as { Process(f: unknown): void }).Process(layerElementsInTimeSpan);

    return layerElementsInTimeSpan.GetElements();
  }

  //-------------------------------------------//
  // Current staffDef values (through Staff)    //
  //-------------------------------------------//

  public GetCurrentClef(): Clef | null {
    const staff = this.GetFirstAncestor(ClassId.STAFF) as unknown as LayerStaffLike | null;
    if (staff && staff.GetDrawingStaffDef()) {
      return staff.GetDrawingStaffDef()!.GetCurrentClef() as Clef | null;
    }
    return null;
  }

  public GetCurrentKeySig(): KeySig | null {
    const staff = this.GetFirstAncestor(ClassId.STAFF) as unknown as LayerStaffLike | null;
    if (!staff || !staff.GetDrawingStaffDef()) throw new Error('Layer::GetCurrentKeySig: staff + staffDef expected');
    return staff.GetDrawingStaffDef()!.GetCurrentKeySig() as KeySig | null;
  }

  public GetCurrentMensur(): Mensur | null {
    const staff = this.GetFirstAncestor(ClassId.STAFF) as unknown as LayerStaffLike | null;
    if (!staff || !staff.GetDrawingStaffDef()) throw new Error('Layer::GetCurrentMensur: staff + staffDef expected');
    return staff.GetDrawingStaffDef()!.GetCurrentMensur() as Mensur | null;
  }

  public GetCurrentMeterSig(): MeterSig | null {
    const staff = this.GetFirstAncestor(ClassId.STAFF) as unknown as LayerStaffLike | null;
    if (!staff || !staff.GetDrawingStaffDef()) throw new Error('Layer::GetCurrentMeterSig: staff + staffDef expected');
    return staff.GetDrawingStaffDef()!.GetCurrentMeterSig() as MeterSig | null;
  }

  public GetCurrentProport(): unknown | null {
    const staff = this.GetFirstAncestor(ClassId.STAFF) as unknown as LayerStaffLike | null;
    if (!staff || !staff.GetDrawingStaffDef()) throw new Error('Layer::GetCurrentProport: staff + staffDef expected');
    return staff.GetDrawingStaffDef()!.GetCurrentProport();
  }

  //-------------------------------------------//
  // Drawing staffDef value management          //
  //-------------------------------------------//

  public SetDrawingStaffDefValues(currentStaffDef: StaffDef | null): void {
    if (!currentStaffDef) {
      // C++ LogDebug("staffDef not found")
      return;
    }

    // Remove any previous value in the Layer
    this.ResetStaffDefObjects();

    if (currentStaffDef.DrawClef()) {
      this.m_staffDefClef = currentStaffDef.GetStaffDefDrawingInterface().GetCurrentClef() as unknown as Clef;
      this.m_staffDefClef = (currentStaffDef.GetStaffDefDrawingInterface().GetCurrentClef() as unknown as Clef)?.Clone() as Clef ?? null;
      this.m_staffDefClef?.SetParent(this as unknown as VrvObject);
    }
    if (currentStaffDef.DrawKeySig()) {
      this.m_staffDefKeySig = (currentStaffDef.GetStaffDefDrawingInterface().GetCurrentKeySig() as unknown as KeySig)?.Clone() as KeySig ?? null;
      this.m_staffDefKeySig?.SetParent(this as unknown as VrvObject);
    }
    if (currentStaffDef.DrawMensur()) {
      this.m_staffDefMensur = (currentStaffDef.GetStaffDefDrawingInterface().GetCurrentMensur() as unknown as Mensur)?.Clone() as Mensur ?? null;
      this.m_staffDefMensur?.SetParent(this as unknown as VrvObject);
    }
    if (currentStaffDef.DrawMeterSigGrp()) {
      this.m_staffDefMeterSigGrp = (currentStaffDef.GetStaffDefDrawingInterface().GetCurrentMeterSigGrp() as unknown as MeterSigGrp)?.Clone() as MeterSigGrp ?? null;
      this.m_staffDefMeterSigGrp?.SetParent(this as unknown as VrvObject);
    } else if (currentStaffDef.DrawMeterSig()) {
      this.m_staffDefMeterSig = (currentStaffDef.GetStaffDefDrawingInterface().GetCurrentMeterSig() as unknown as MeterSig)?.Clone() as MeterSig ?? null;
      this.m_staffDefMeterSig?.SetParent(this as unknown as VrvObject);
    }

    // Don't draw on the next one
    currentStaffDef.SetDrawClef(false);
    currentStaffDef.SetDrawKeySig(false);
    currentStaffDef.SetDrawMensur(false);
    currentStaffDef.SetDrawMeterSig(false);
    currentStaffDef.SetDrawMeterSigGrp(false);
  }

  public GetDrawingStaffDefValues(staffDef: StaffDef): boolean {
    let hasValue = false;
    if (this.m_staffDefClef) {
      staffDef.SetDrawClef(true);
      hasValue = true;
    }
    if (this.m_staffDefKeySig) {
      staffDef.SetDrawKeySig(true);
      hasValue = true;
    }
    if (this.m_staffDefMensur) {
      staffDef.SetDrawMensur(true);
      hasValue = true;
    }
    if (this.m_staffDefMeterSig) {
      staffDef.SetDrawMeterSig(true);
      hasValue = true;
    }
    if (this.m_staffDefMeterSigGrp) {
      staffDef.SetDrawMeterSigGrp(true);
      hasValue = true;
    }
    return hasValue;
  }

  public SetDrawingCautionValues(currentStaffDef: StaffDef | null): void {
    if (!currentStaffDef) {
      // C++ LogDebug("staffDef not found")
      return;
    }

    if (currentStaffDef.DrawClef()) {
      this.m_cautionStaffDefClef = (currentStaffDef.GetStaffDefDrawingInterface().GetCurrentClef() as unknown as Clef)?.Clone() as Clef ?? null;
      this.m_cautionStaffDefClef?.SetParent(this as unknown as VrvObject);
    }
    // special case - see above
    if (currentStaffDef.DrawKeySig()) {
      this.m_cautionStaffDefKeySig = (currentStaffDef.GetStaffDefDrawingInterface().GetCurrentKeySig() as unknown as KeySig)?.Clone() as KeySig ?? null;
      this.m_cautionStaffDefKeySig?.SetDrawingClef(currentStaffDef.GetStaffDefDrawingInterface().GetCurrentClef() as unknown as Clef);
      this.m_cautionStaffDefKeySig?.SetParent(this as unknown as VrvObject);
    }
    if (currentStaffDef.DrawMensur()) {
      this.m_cautionStaffDefMensur = (currentStaffDef.GetStaffDefDrawingInterface().GetCurrentMensur() as unknown as Mensur)?.Clone() as Mensur ?? null;
      this.m_cautionStaffDefMensur?.SetParent(this as unknown as VrvObject);
    }
    if (currentStaffDef.DrawMeterSig()) {
      this.m_cautionStaffDefMeterSig = (currentStaffDef.GetStaffDefDrawingInterface().GetCurrentMeterSig() as unknown as MeterSig)?.Clone() as MeterSig ?? null;
      this.m_cautionStaffDefMeterSig?.SetParent(this as unknown as VrvObject);
    }

    // Don't draw on the next one
    currentStaffDef.SetDrawClef(false);
    currentStaffDef.SetDrawKeySig(false);
    currentStaffDef.SetDrawMensur(false);
    currentStaffDef.SetDrawMeterSig(false);
  }

  //---------------//
  // Cursor         //
  //---------------//

  public SetCursor(cursor: Cursor | null): void {
    if (!cursor) return;
    if (this.m_cursor) this.ResetCursor();

    this.m_cursor = cursor;
    this.m_cursor!.SetParent(this as unknown as VrvObject);
  }

  public ResetCursor(): void {
    // C++ deletes the owned cursor; TS drops the reference.
    this.m_cursor = null;
  }

  public GetCursor(): Cursor | null { return this.m_cursor; }
  public HasCursor(): boolean { return this.m_cursor !== null; }

  //-----------------------//
  // DrawingList facade     //
  //-----------------------//

  public GetDrawingList(): ArrayOfObjects { this.ensureComponents(); return this.drawingListInterface!.GetDrawingList(); }
  public AddToDrawingList(element: VrvObject): void { this.ensureComponents(); this.drawingListInterface!.AddToDrawingList(element); }
  public ResetDrawingList(): void { this.ensureComponents(); this.drawingListInterface!.ResetDrawingList(); }

  //---------------------------//
  // Attribute facades          //
  //---------------------------//

  public ResetCue(): void { this.attCue!.ResetCue(); }
  public SetCue(v: boolean): void { this.attCue!.SetCue(v); }
  public GetCue(): boolean { return this.attCue!.GetCue(); }
  public HasCue(): boolean { return this.attCue!.HasCue(); }

  public ResetNInteger(): void { this.attNInteger!.ResetNInteger(); }
  public SetN(v: number): void { this.attNInteger!.SetN(v); }
  public GetN(): number { return this.attNInteger!.GetN(); }
  public HasN(): boolean { return this.attNInteger!.HasN(); }

  public ResetTyped(): void { this.attTyped!.ResetTyped(); }
  public SetType(v: string): void { this.attTyped!.SetType(v); }
  public GetType(): string | null { return this.attTyped!.GetType(); }
  public HasType(): boolean { return this.attTyped!.HasType(); }

  public ResetVisibility(): void { this.attVisibility!.ResetVisibility(); }
  public SetVisible(v: number): void { this.attVisibility!.SetVisible(v); }
  public GetVisible(): number { return this.attVisibility!.GetVisible(); }
  public HasVisible(): boolean { return this.attVisibility!.HasVisible(); }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitLayer', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitLayerEnd', this); }

  public override Clone(): VrvObject {
    const clone = new Layer();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attNInteger!.HasN()) clone.attNInteger!.SetN(this.attNInteger!.GetN());
    if (this.attTyped!.HasType()) clone.attTyped!.SetType(this.attTyped!.GetType()!);
    if (this.attCue!.HasCue()) clone.attCue!.SetCue(this.attCue!.GetCue());
    clone.m_drawingStemDir = this.m_drawingStemDir;
    return clone;
  }
}

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_CUE = 116;
const ATT_NINTEGER = 167;
const ATT_TYPED = 224;
const ATT_VISIBILITY = 228;

/** C++ FunctorInterface default forwarding helper (VisitLayer -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('layer', ClassId.LAYER, () => new Layer());
