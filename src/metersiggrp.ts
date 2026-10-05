/**
 * Pure TypeScript translation of Verovio's `src/metersiggrp.cpp` /
 * `include/vrv/metersiggrp.h`.
 *
 * `MeterSigGrp` represents a MEI `<meterSigGrp>` containing `meterSig` objects.
 *
 * C++ multiple inheritance (LayerElement + ObjectListInterface + AttBasic +
 * AttMeterSigGrpLog + AttVisibility) is represented through explicit
 * composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, ObjectListInterface, VrvObject } from './object.js';
import { InstBasic, InstVisibility } from './atts_shared.js';
import { InstMeterSigGrpLog } from './atts_cmn.js';
import { MeterSig } from './metersig.js';
import { MeterCountSign } from './libmei-att.js';
import { LogWarning } from './vrv.js';

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_BASIC = 101;
const ATT_METERSIGGRPLOG = 27;
const ATT_VISIBILITY = 228;

// meterSigGrpLog_FUNC ordinals (libmei/dist/atttypes.h).
const meterSigGrpLog_FUNC_NONE = 0;
const meterSigGrpLog_FUNC_alternating = 1;
const meterSigGrpLog_FUNC_interchanging = 2;
const meterSigGrpLog_FUNC_mixed = 3;

/** Structural contract for a `Measure` (non-owning pointer identity). */
export interface MeterSigGrpMeasureLike {
  /** Identity used for `std::find` on the alternating-measures vector. */
}

/** ObjectListInterface composition keeping only METERSIG children. */
class MeterSigGrpListInterface extends ObjectListInterface {
  protected override FilterList(childList: VrvObject[]): void {
    // We want to keep only MeterSig
    for (let i = 0; i < childList.length;) {
      if (childList[i].Is(ClassId.METERSIG)) ++i;
      else childList.splice(i, 1);
    }
  }
}

/**
 * Pure TypeScript translation of Verovio's `MeterSigGrp`.
 */
export class MeterSigGrp extends LayerElement {
  private readonly objectList: MeterSigGrpListInterface;

  private basic?: InstBasic;
  private meterSigGrpLog?: InstMeterSigGrpLog;
  private visibility?: InstVisibility;

  // vector with alternating measures to be used only with
  // meterSigGrpLog_FUNC_alternating (non-owning pointers)
  private readonly m_alternatingMeasures: MeterSigGrpMeasureLike[] = [];
  // counter for the meterSig to be used with meterSigGrpLog_FUNC_alternating
  private m_count: number = 0;

  public constructor() {
    super(ClassId.METERSIGGRP);
    this.objectList = new MeterSigGrpListInterface();
    this.objectList.SetInterfaceOwner(this as unknown as VrvObject);
    this.ensureAttributes();
    this.RegisterAttClass(ATT_BASIC);
    this.RegisterAttClass(ATT_METERSIGGRPLOG);
    this.RegisterAttClass(ATT_VISIBILITY);
    this.Reset();
  }

  private ensureAttributes(): void {
    this.basic ??= new InstBasic();
    this.meterSigGrpLog ??= new InstMeterSigGrpLog();
    this.visibility ??= new InstVisibility();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.basic!.ResetBasic();
    this.meterSigGrpLog!.ResetMeterSigGrpLog();
    this.visibility!.ResetVisibility();
  }

  public override Clone(): VrvObject {
    const clone = new MeterSigGrp();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all members (composition adaptation:
    // AssignFrom covers only the object-tree state). The alternating-measure
    // vector and the counter are private runtime state and are not carried
    // over by the C++ copy constructor either.
    if (this.HasBase()) clone.SetBase(this.GetBase());
    if (this.HasFunc()) clone.SetFunc(this.GetFunc());
    if (this.HasVisible()) clone.SetVisible(this.GetVisible());
    return clone;
  }

  public override GetClassName(): string { return 'meterSigGrp'; }

  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.METERSIG) return true;
    return false;
  }

  /** Override the method since check is required. */
  public override IsScoreDefElement(): boolean {
    return !!(this.GetParent() && this.GetFirstAncestor(ClassId.SCOREDEF));
  }

  /** Add specified measureId to the m_alternatingMeasures vector. */
  public AddAlternatingMeasureToVector(measure: MeterSigGrpMeasureLike): void {
    this.m_alternatingMeasures.push(measure);
  }

  /**
   * Get simplified (i.e. single metersig with count/unit) based on the
   * MeterSigGrp function.
   */
  public GetSimplifiedMeterSig(): MeterSig | null {
    let newMeterSig: MeterSig | null = null;
    const childList = this.GetList();
    switch (this.GetFunc()) {
      // For alternating meterSig group alternate between children sequentially
      case meterSigGrpLog_FUNC_alternating: {
        const index = this.m_count % childList.length;
        newMeterSig = childList[index].Clone() as unknown as MeterSig;
        break;
      }
      // For interchanging meterSig group select the largest signature, but
      // make sure to align unit with the shortest
      case meterSigGrpLog_FUNC_interchanging: {
        // Get element with highest count
        let best = childList[0] as unknown as MeterSig;
        let bestRatio = best.GetTotalCount() / best.GetUnit();
        for (let i = 1; i < childList.length; ++i) {
          const current = childList[i] as unknown as MeterSig;
          const currentRatio = current.GetTotalCount() / current.GetUnit();
          if (bestRatio < currentRatio) {
            best = current;
            bestRatio = currentRatio;
          }
        }
        let maxUnit = 0;
        for (const object of childList) {
          const meterSig = object as unknown as MeterSig;
          if (meterSig.GetUnit() > maxUnit) maxUnit = meterSig.GetUnit();
        }

        newMeterSig = best.Clone() as unknown as MeterSig;
        if (newMeterSig.GetUnit() < maxUnit) {
          const ratio = Math.trunc(maxUnit / newMeterSig.GetUnit());
          const [currentCount, sign] = newMeterSig.GetCount() as [number[], MeterCountSign];
          for (let i = 0; i < currentCount.length; ++i) {
            currentCount[i] = currentCount[i] * ratio;
          }
          newMeterSig.SetCount([currentCount, sign]);
          newMeterSig.SetUnit(maxUnit);
        }
        break;
      }
      // For mixed meterSig group we want to accumulate total count of all
      // child meterSig (and keep the highest meter count), since it is what
      // counts for the timestamps
      case meterSigGrpLog_FUNC_mixed: {
        let maxUnit = 0;
        let currentCount = 0;
        for (const object of childList) {
          if (!object.Is(ClassId.METERSIG)) {
            LogWarning('Skipping over non-meterSig child of <MeterSigGrp>');
            continue;
          }
          const meterSig = object as unknown as MeterSig;
          if (!newMeterSig) {
            newMeterSig = meterSig.Clone() as unknown as MeterSig;
          }
          const currentUnit = meterSig.GetUnit();
          if (maxUnit === 0) maxUnit = currentUnit;
          if (maxUnit === currentUnit) {
            currentCount += meterSig.GetTotalCount();
          }
          else if (maxUnit > currentUnit) {
            const ratio = Math.trunc(maxUnit / currentUnit);
            currentCount += meterSig.GetTotalCount() * ratio;
          }
          else {
            const ratio = Math.trunc(currentUnit / maxUnit);
            currentCount *= ratio;
            currentCount += meterSig.GetTotalCount();
            maxUnit = currentUnit;
          }
        }
        if (newMeterSig) {
          newMeterSig.SetUnit(maxUnit);
          newMeterSig.SetCount([[currentCount], MeterCountSign.None]);
        }
        break;
      }
      default: {
        // should not be happening (C++ `assert(false)`)
        throw new Error('MeterSigGrp::GetSimplifiedMeterSig: unexpected func value');
      }
    }
    return newMeterSig;
  }

  /** Set counter for the alternating meterSigGrp based on the provided measureId. */
  public SetMeasureBasedCount(measure: MeterSigGrpMeasureLike): void {
    const index = this.m_alternatingMeasures.indexOf(measure);
    this.m_count = index;
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitMeterSigGrp');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitMeterSigGrpEnd');
  }

  private visit(functor: unknown, method: string): FunctorCode {
    const f = functor as Record<string, unknown>;
    const fn = f[method];
    if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, this);
    if (typeof f['VisitObject'] === 'function') {
      return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  //---------//
  // ObjectListInterface facade
  //---------//
  public GetList(): VrvObject[] { return this.objectList.GetList(); }
  public HasEmptyList(): boolean { return this.objectList.HasEmptyList(); }
  public GetListSize(): number { return this.objectList.GetListSize(); }
  public GetListFront(): VrvObject { return this.objectList.GetListFront(); }
  public GetListBack(): VrvObject { return this.objectList.GetListBack(); }
  public GetListIndex(element: VrvObject): number { return this.objectList.GetListIndex(element); }

  //---------//
  // AttBasic forwarding surface
  //---------//
  public ResetBasic(): void { this.basic!.ResetBasic(); }
  public SetBase(value: string): void { this.basic!.SetBase(value); }
  public GetBase(): string { return this.basic!.GetBase(); }
  public HasBase(): boolean { return this.basic!.HasBase(); }

  //---------//
  // AttMeterSigGrpLog forwarding surface
  //---------//
  public ResetMeterSigGrpLog(): void { this.meterSigGrpLog!.ResetMeterSigGrpLog(); }
  public SetFunc(value: number): void { this.meterSigGrpLog!.SetFunc(value); }
  public GetFunc(): number { return this.meterSigGrpLog!.GetFunc(); }
  public HasFunc(): boolean { return this.meterSigGrpLog!.HasFunc(); }

  //---------//
  // AttVisibility forwarding surface
  //---------//
  public ResetVisibility(): void { this.visibility!.ResetVisibility(); }
  public SetVisible(value: number): void { this.visibility!.SetVisible(value); }
  public GetVisible(): number { return this.visibility!.GetVisible(); }
  public HasVisible(): boolean { return this.visibility!.HasVisible(); }
}

// Factory registration (C++ `ClassRegistrar<MeterSigGrp> s_factory("meterSigGrp", METERSIGGRP)`).
ObjectFactory.GetInstance().Register('meterSigGrp', ClassId.METERSIGGRP, () => new MeterSigGrp());
