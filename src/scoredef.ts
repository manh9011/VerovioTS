import { ClassId, FunctorCode, InterfaceId, VRV_UNSET } from './vrvdef.js';
import { VrvObject, ObjectListInterface } from './object.js';
import { ScoreDefInterface } from './scoredefinterface.js';
import { InstTyped } from './atts_shared.js';
import { CustomTuning } from './customtuning.js';
import { MEASUREMENTTYPE_NONE, MEASUREMENTTYPE_vu, MEASUREMENTTYPE_px } from './graphic.js';
import { MEI_UNSET } from './vrv.js';
import { LogWarning } from './vrv.js';
import { Functor, ConstFunctor } from './functor.js';
import { ATT_CLASS_IDS } from './attmodule.js';

interface AttTypedLike { Reset(): void; RegisterAttClass?: (id: number) => void; }
interface StaffLike extends VrvObject {
  GetN?: () => number;
  GetOssiaStaffDef?: (n: number) => StaffLike | null;
  GetOssiaAboveNs?: (out: number[]) => void;
  GetOssiaBelowNs?: (out: number[]) => void;
  SetN?: (n: number) => void;
  AddOssiaAbove?: (staff: StaffLike) => void;
  AddOssiaBelow?: (staff: StaffLike) => void;
}
interface StaffGrpLike {
  GetN?: () => string;
  GetMaxStaffSize?: () => number;
  GetFirstLastStaffDef?: () => [StaffLike | null, StaffLike | null];
  GetFirst?: (classId?: ClassId) => VrvObject | null;
  FindAllDescendantsByType?: (classId: ClassId) => VrvObject[];
}
interface DrawingStaffLike extends StaffLike {
  HasClefInfo?: () => boolean; HasKeySigInfo?: () => boolean; HasMensurInfo?: () => boolean; HasMeterSigInfo?: () => boolean; HasMeterSigGrpInfo?: () => boolean;
  SetDrawClef?: (value:boolean)=>void; SetDrawKeySig?: (value:boolean)=>void; SetDrawMensur?: (value:boolean)=>void; SetDrawMeterSig?: (value:boolean)=>void; SetDrawMeterSigGrp?: (value:boolean)=>void;
  GetClef?: ()=>VrvObject; GetKeySig?: ()=>VrvObject; GetMensur?: ()=>VrvObject; GetMeterSig?: ()=>VrvObject; GetMeterSigGrp?: ()=>MeterSigGrpLike;
  GetMensurCopy?: ()=>VrvObject; GetMeterSigCopy?: ()=>VrvObject; GetMeterSigGrpCopy?: ()=>VrvObject;
  SetCurrentClef?: (v:VrvObject)=>void; SetCurrentKeySig?: (v:VrvObject)=>void; SetCurrentMensur?: (v:VrvObject)=>void; SetCurrentMeterSig?: (v:VrvObject)=>void; SetCurrentMeterSigGrp?: (v:VrvObject)=>void;
  HasLabel?: ()=>boolean; GetLabel?: ()=>VrvObject; SetLabel?: (v:VrvObject)=>void; GetVisible?: ()=>number;
}
interface LabelGroupLike extends VrvObject { GetN?:()=>string; HasLabelInfo?:()=>boolean; HasLabelAbbrInfo?:()=>boolean; GetLabelCopy?:()=>VrvObject; GetLabelAbbrCopy?:()=>VrvObject; GetLabel?:()=>VrvObject; GetLabelAbbr?:()=>VrvObject; }
interface SectionLike extends VrvObject { GetRestart?: () => number; }
interface LabelLike extends VrvObject {}

interface MeterSigGrpLike extends VrvObject { GetSimplifiedMeterSig?: () => VrvObject | null; }
interface RunningLike extends VrvObject { GetFunc?: () => number; }
interface KeySigLike extends VrvObject { HasCancelaccid?: () => boolean; GetCancelaccid?: () => number; }
interface ScoreDefLike extends VrvObject { HasClefInfo?: () => boolean; GetClef?: () => VrvObject; HasKeySigInfo?: () => KeySigLike; GetKeySig?: () => KeySigLike; HasMensurInfo?: () => boolean; GetMensurCopy?: () => VrvObject; HasMeterSigGrpInfo?: () => boolean; GetMeterSigGrp?: () => MeterSigGrpLike; GetMeterSigGrpCopy?: () => MeterSigGrpLike; HasMeterSigInfo?: () => boolean; GetMeterSigCopy?: () => VrvObject; GetStaffDef?: (n:number) => DrawingStaffLike | null; }
interface DrawingStateStaffLike extends StaffLike {
  GetCurrentClef?: () => VrvObject | null; GetCurrentKeySig?: () => VrvObject | null; GetCurrentMensur?: () => VrvObject | null;
  GetCurrentMeterSig?: () => VrvObject | null; GetCurrentMeterSigGrp?: () => VrvObject | null;
}


/** Pure-TypeScript equivalent of libmei data_MEASUREMENTSIGNED. */
export class MeasurementSigned {
  private type = MEASUREMENTTYPE_NONE;
  private px = MEI_UNSET;
  private vu = MEI_UNSET;
  public GetType(): number { return this.type; }
  public GetPx(): number { return this.px; }
  public GetVu(): number { return this.vu; }
  public SetPx(value: number): void { this.type = MEASUREMENTTYPE_px; this.px = value; this.vu = MEI_UNSET; }
  public SetVu(value: number): void { this.type = MEASUREMENTTYPE_vu; this.vu = value; this.px = MEI_UNSET; }
  public HasValue(): boolean { return this.px !== MEI_UNSET || this.vu !== MEI_UNSET; }
  public CopyFrom(other: MeasurementSigned): void { this.type = other.type; this.px = other.px; this.vu = other.vu; }
  public CopyFromAny(other: { GetType(): number; GetPx(): number; GetVu(): number }): void {
    const t = other.GetType();
    if (t === MEASUREMENTTYPE_px) this.SetPx(other.GetPx());
    else if (t === MEASUREMENTTYPE_vu) this.SetVu(other.GetVu());
  }
  public Clone(): MeasurementSigned { const c = new MeasurementSigned(); c.CopyFrom(this); return c; }
}

function cloneOrCopy(target: MeasurementSigned, v: unknown): MeasurementSigned {
  const c = v as { Clone?: () => MeasurementSigned; GetType?: () => number; GetPx?: () => number; GetVu?: () => number };
  if (c && typeof c.Clone === 'function') return c.Clone();
  if (c && typeof c.GetType === 'function') target.CopyFromAny(c as { GetType(): number; GetPx(): number; GetVu(): number });
  return target;
}

/** Typed stand-in for generated AttTyped state. */
class AttTypedMock implements AttTypedLike {
  private readonly inner = new InstTyped();
  public Reset(): void { this.inner.ResetTyped(); }
  public HasType(): boolean { return this.inner.HasType(); }
  public GetType(): any { return this.inner.GetType(); }
  public SetType(v: any): void { this.inner.SetType(v); }
  public ResetTyped(): void { this.inner.ResetTyped(); }
}

/**
 * Pure TypeScript translation of Verovio ScoreDefElement/ScoreDef foundation.
 * Concrete clef/key/mensur/meter/staff classes remain structural dependencies until
 * their dedicated migration passes are complete.
 */
export class ScoreDefElement extends VrvObject {
  private scoreDefInterface: ScoreDefInterface | undefined;
  private typed: AttTypedMock | undefined;

  public constructor(classId: ClassId = ClassId.SCOREDEF_ELEMENT) {
    super(classId);
    this.scoreDefInterface ??= new ScoreDefInterface();
    this.typed ??= new AttTypedMock();
    this.RegisterInterface(this.scoreDefInterface.GetAttClasses(), this.scoreDefInterface.IsInterface());
    this.RegisterAttClass(224); // ATT_TYPED
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.scoreDefInterface ??= new ScoreDefInterface();
    this.typed ??= new AttTypedMock();
    this.scoreDefInterface.Reset();
    this.typed.Reset();
  }

  public GetScoreDefInterface(): ScoreDefInterface { this.scoreDefInterface ??= new ScoreDefInterface(); return this.scoreDefInterface; }
  // C++ `ScoreDefElement : public ScoreDefInterface` — delegated Get/Set surface
  // so AttModule.CopyAll finds the attribute methods on the element itself.
  public HasBarLen(): boolean { return this.GetScoreDefInterface().HasBarLen(); }
  public GetBarLen(): any { return this.GetScoreDefInterface().GetBarLen(); }
  public SetBarLen(v: any): void { this.GetScoreDefInterface().SetBarLen(v); }
  public HasBarMethod(): boolean { return this.GetScoreDefInterface().HasBarMethod(); }
  public GetBarMethod(): any { return this.GetScoreDefInterface().GetBarMethod(); }
  public SetBarMethod(v: any): void { this.GetScoreDefInterface().SetBarMethod(v); }
  public HasBarPlace(): boolean { return this.GetScoreDefInterface().HasBarPlace(); }
  public GetBarPlace(): any { return this.GetScoreDefInterface().GetBarPlace(); }
  public SetBarPlace(v: any): void { this.GetScoreDefInterface().SetBarPlace(v); }
  public HasDurDefault(): boolean { return this.GetScoreDefInterface().HasDurDefault(); }
  public GetDurDefault(): any { return this.GetScoreDefInterface().GetDurDefault(); }
  public SetDurDefault(v: any): void { this.GetScoreDefInterface().SetDurDefault(v); }
  public HasNumDefault(): boolean { return this.GetScoreDefInterface().HasNumDefault(); }
  public GetNumDefault(): any { return this.GetScoreDefInterface().GetNumDefault(); }
  public SetNumDefault(v: any): void { this.GetScoreDefInterface().SetNumDefault(v); }
  public HasNumbaseDefault(): boolean { return this.GetScoreDefInterface().HasNumbaseDefault(); }
  public GetNumbaseDefault(): any { return this.GetScoreDefInterface().GetNumbaseDefault(); }
  public SetNumbaseDefault(v: any): void { this.GetScoreDefInterface().SetNumbaseDefault(v); }
  public HasLyricAlign(): boolean { return this.GetScoreDefInterface().HasLyricAlign(); }
  public GetLyricAlign(): any { return this.GetScoreDefInterface().GetLyricAlign(); }
  public SetLyricAlign(v: any): void { this.GetScoreDefInterface().SetLyricAlign(v); }
  public HasLyricFam(): boolean { return this.GetScoreDefInterface().HasLyricFam(); }
  public GetLyricFam(): any { return this.GetScoreDefInterface().GetLyricFam(); }
  public SetLyricFam(v: any): void { this.GetScoreDefInterface().SetLyricFam(v); }
  public HasLyricName(): boolean { return this.GetScoreDefInterface().HasLyricName(); }
  public GetLyricName(): any { return this.GetScoreDefInterface().GetLyricName(); }
  public SetLyricName(v: any): void { this.GetScoreDefInterface().SetLyricName(v); }
  public HasLyricSize(): boolean { return this.GetScoreDefInterface().HasLyricSize(); }
  public GetLyricSize(): any { return this.GetScoreDefInterface().GetLyricSize(); }
  public SetLyricSize(v: any): void { this.GetScoreDefInterface().SetLyricSize(v); }
  public HasLyricStyle(): boolean { return this.GetScoreDefInterface().HasLyricStyle(); }
  public GetLyricStyle(): any { return this.GetScoreDefInterface().GetLyricStyle(); }
  public SetLyricStyle(v: any): void { this.GetScoreDefInterface().SetLyricStyle(v); }
  public HasLyricWeight(): boolean { return this.GetScoreDefInterface().HasLyricWeight(); }
  public GetLyricWeight(): any { return this.GetScoreDefInterface().GetLyricWeight(); }
  public SetLyricWeight(v: any): void { this.GetScoreDefInterface().SetLyricWeight(v); }
  public HasMnumVisible(): boolean { return this.GetScoreDefInterface().HasMnumVisible(); }
  public GetMnumVisible(): any { return this.GetScoreDefInterface().GetMnumVisible(); }
  public SetMnumVisible(v: any): void { this.GetScoreDefInterface().SetMnumVisible(v); }
  public HasMidiBpm(): boolean { return this.GetScoreDefInterface().HasMidiBpm(); }
  public GetMidiBpm(): any { return this.GetScoreDefInterface().GetMidiBpm(); }
  public SetMidiBpm(v: any): void { this.GetScoreDefInterface().SetMidiBpm(v); }
  public HasMidiMspb(): boolean { return this.GetScoreDefInterface().HasMidiMspb(); }
  public GetMidiMspb(): any { return this.GetScoreDefInterface().GetMidiMspb(); }
  public SetMidiMspb(v: any): void { this.GetScoreDefInterface().SetMidiMspb(v); }
  public HasMm(): boolean { return this.GetScoreDefInterface().HasMm(); }
  public GetMm(): any { return this.GetScoreDefInterface().GetMm(); }
  public SetMm(v: any): void { this.GetScoreDefInterface().SetMm(v); }
  public HasMmUnit(): boolean { return this.GetScoreDefInterface().HasMmUnit(); }
  public GetMmUnit(): any { return this.GetScoreDefInterface().GetMmUnit(); }
  public SetMmUnit(v: any): void { this.GetScoreDefInterface().SetMmUnit(v); }
  public HasMmDots(): boolean { return this.GetScoreDefInterface().HasMmDots(); }
  public GetMmDots(): any { return this.GetScoreDefInterface().GetMmDots(); }
  public SetMmDots(v: any): void { this.GetScoreDefInterface().SetMmDots(v); }
  public HasMultiNumber(): boolean { return this.GetScoreDefInterface().HasMultiNumber(); }
  public GetMultiNumber(): any { return this.GetScoreDefInterface().GetMultiNumber(); }
  public SetMultiNumber(v: any): void { this.GetScoreDefInterface().SetMultiNumber(v); }
  public HasOctDefault(): boolean { return this.GetScoreDefInterface().HasOctDefault(); }
  public GetOctDefault(): any { return this.GetScoreDefInterface().GetOctDefault(); }
  public SetOctDefault(v: any): void { this.GetScoreDefInterface().SetOctDefault(v); }
  public HasPedalStyle(): boolean { return this.GetScoreDefInterface().HasPedalStyle(); }
  public GetPedalStyle(): any { return this.GetScoreDefInterface().GetPedalStyle(); }
  public SetPedalStyle(v: any): void { this.GetScoreDefInterface().SetPedalStyle(v); }
  public HasSpacingPackexp(): boolean { return this.GetScoreDefInterface().HasSpacingPackexp(); }
  public GetSpacingPackexp(): any { return this.GetScoreDefInterface().GetSpacingPackexp(); }
  public SetSpacingPackexp(v: any): void { this.GetScoreDefInterface().SetSpacingPackexp(v); }
  public HasSpacingPackfact(): boolean { return this.GetScoreDefInterface().HasSpacingPackfact(); }
  public GetSpacingPackfact(): any { return this.GetScoreDefInterface().GetSpacingPackfact(); }
  public SetSpacingPackfact(v: any): void { this.GetScoreDefInterface().SetSpacingPackfact(v); }
  public HasSpacingStaff(): boolean { return this.GetScoreDefInterface().HasSpacingStaff(); }
  public GetSpacingStaff(): any { return this.GetScoreDefInterface().GetSpacingStaff(); }
  public SetSpacingStaff(v: any): void { this.GetScoreDefInterface().SetSpacingStaff(v); }
  public HasSpacingSystem(): boolean { return this.GetScoreDefInterface().HasSpacingSystem(); }
  public GetSpacingSystem(): any { return this.GetScoreDefInterface().GetSpacingSystem(); }
  public SetSpacingSystem(v: any): void { this.GetScoreDefInterface().SetSpacingSystem(v); }
  public HasSystemLeftline(): boolean { return this.GetScoreDefInterface().HasSystemLeftline(); }
  public GetSystemLeftline(): any { return this.GetScoreDefInterface().GetSystemLeftline(); }
  public SetSystemLeftline(v: any): void { this.GetScoreDefInterface().SetSystemLeftline(v); }
  public HasSystemLeftmar(): boolean { return this.GetScoreDefInterface().HasSystemLeftmar(); }
  public GetSystemLeftmar(): any { return this.GetScoreDefInterface().GetSystemLeftmar(); }
  public SetSystemLeftmar(v: any): void { this.GetScoreDefInterface().SetSystemLeftmar(v); }
  public HasSystemRightmar(): boolean { return this.GetScoreDefInterface().HasSystemRightmar(); }
  public GetSystemRightmar(): any { return this.GetScoreDefInterface().GetSystemRightmar(); }
  public SetSystemRightmar(v: any): void { this.GetScoreDefInterface().SetSystemRightmar(v); }
  public HasSystemTopmar(): boolean { return this.GetScoreDefInterface().HasSystemTopmar(); }
  public GetSystemTopmar(): any { return this.GetScoreDefInterface().GetSystemTopmar(); }
  public SetSystemTopmar(v: any): void { this.GetScoreDefInterface().SetSystemTopmar(v); }
  public HasType(): boolean { return this.typed?.HasType() ?? false; }
  public GetType(): any { return this.typed?.GetType(); }
  public SetType(v: any): void { this.typed?.SetType(v); }
  public HasClefInfo(depth = 1): boolean { return this.FindDescendantByType(ClassId.CLEF, depth) !== null; }
  public HasKeySigInfo(depth = 1): boolean { return this.FindDescendantByType(ClassId.KEYSIG, depth) !== null; }
  public HasMensurInfo(depth = 1): boolean { return this.FindDescendantByType(ClassId.MENSUR, depth) !== null; }
  public HasMeterSigInfo(depth = 1): boolean { return this.FindDescendantByType(ClassId.METERSIG, depth) !== null; }
  public HasMeterSigGrpInfo(depth = 1): boolean { return this.FindDescendantByType(ClassId.METERSIGGRP, depth) !== null; }

  private requireDescendant<T extends VrvObject>(classId: ClassId, depth = 1): T {
    const result = this.FindDescendantByType(classId, depth);
    if (!result) throw new Error(`ScoreDefElement: missing required descendant ${ClassId[classId] ?? classId}`);
    return result as T;
  }
  public GetClef<T extends VrvObject = VrvObject>(): T { return this.requireDescendant<T>(ClassId.CLEF); }
  public GetClefCopy<T extends VrvObject = VrvObject>(): T { return this.GetClef<T>().Clone() as T; }
  public GetKeySig<T extends VrvObject = VrvObject>(): T { return this.requireDescendant<T>(ClassId.KEYSIG); }
  public GetKeySigCopy<T extends VrvObject = VrvObject>(): T { return this.GetKeySig<T>().Clone() as T; }
  public GetMensur<T extends VrvObject = VrvObject>(): T { return this.requireDescendant<T>(ClassId.MENSUR); }
  public GetMensurCopy<T extends VrvObject = VrvObject>(): T { return this.GetMensur<T>().Clone() as T; }
  public GetMeterSig<T extends VrvObject = VrvObject>(): T { return this.requireDescendant<T>(ClassId.METERSIG); }
  public GetMeterSigCopy<T extends VrvObject = VrvObject>(): T { return this.GetMeterSig<T>().Clone() as T; }
  public GetMeterSigGrp<T extends VrvObject = VrvObject>(): T { return this.requireDescendant<T>(ClassId.METERSIGGRP); }
  public GetMeterSigGrpCopy<T extends VrvObject = VrvObject>(): T { return this.GetMeterSigGrp<T>().Clone() as T; }

  public override Accept(functor: Functor): FunctorCode { return (functor as any).VisitScoreDefElement?.(this) ?? super.Accept(functor); }
  public AcceptConst(functor: ConstFunctor): FunctorCode { return (functor as any).VisitScoreDefElement?.(this) ?? FunctorCode.FUNCTOR_CONTINUE; }
  public override AcceptEnd(functor: Functor): FunctorCode { return (functor as any).VisitScoreDefElementEnd?.(this) ?? super.AcceptEnd(functor); }
  public AcceptEndConst(functor: ConstFunctor): FunctorCode { return (functor as any).VisitScoreDefElementEnd?.(this) ?? FunctorCode.FUNCTOR_CONTINUE; }
}

/** Pure TypeScript translation of the ScoreDef container/state contract. */
export class ScoreDef extends ScoreDefElement {
  public m_setAsDrawing = false;
  public m_insertScoreDef = true;
  private m_drawLabels = false;
  private m_drawingWidth = 0;
  private m_drawingLabelsWidth = 0;
  private m_customTuning = new CustomTuning();
  private redrawFlags = 0;
  private readonly attributeIds = [
    ATT_CLASS_IDS.ATT_DISTANCES,
    ATT_CLASS_IDS.ATT_ENDINGS,
    ATT_CLASS_IDS.ATT_OPTIMIZATION,
    ATT_CLASS_IDS.ATT_TIMEBASE,
    ATT_CLASS_IDS.ATT_TUNING,
  ];
  private dirDist = new MeasurementSigned();
  private dynamDist = new MeasurementSigned();
  private harmDist = new MeasurementSigned();
  private rehDist = new MeasurementSigned();
  private tempoDist = new MeasurementSigned();
  private endingRend = 0;
  private optimize = 0;
  private ppq = MEI_UNSET;
  private tuneHz = 0;
  private tunePname = 0;
  private tuneTemper = 0;

  private readonly objectList: ScoreDefListInterface;

  public constructor() {
    super(ClassId.SCOREDEF);
    this.objectList = new ScoreDefListInterface(this);
    this.RegisterAttClass(this.attributeIds[0]);
    this.RegisterAttClass(this.attributeIds[1]);
    this.RegisterAttClass(this.attributeIds[2]);
    this.RegisterAttClass(this.attributeIds[3]);
    this.RegisterAttClass(this.attributeIds[4]);
    this.Reset();
  }

  public GetList(): VrvObject[] {
    return this.objectList.GetList();
  }
  public HasEmptyList(): boolean {
    return this.objectList.HasEmptyList();
  }
  public GetListSize(): number {
    return this.objectList.GetListSize();
  }
  public ResetList(): void {
    this.objectList.ResetList();
  }

  public override GetClassName(): string { return 'scoreDef'; }

  /** C++ `Clone() { return new ScoreDef(*this); }` — deep copy through AssignFrom plus member state. */
  public override Clone(): ScoreDef {
    const clone = new ScoreDef();
    clone.AssignFrom(this);
    clone.m_setAsDrawing = this.m_setAsDrawing;
    clone.m_insertScoreDef = this.m_insertScoreDef;
    clone.m_drawLabels = this.m_drawLabels;
    clone.m_drawingWidth = this.m_drawingWidth;
    clone.m_drawingLabelsWidth = this.m_drawingLabelsWidth;
    clone.redrawFlags = this.redrawFlags;
    clone.endingRend = this.endingRend;
    clone.optimize = this.optimize;
    clone.ppq = this.ppq;
    clone.tuneHz = this.tuneHz;
    clone.tunePname = this.tunePname;
    clone.tuneTemper = this.tuneTemper;
    clone.dirDist = this.dirDist.Clone();
    clone.dynamDist = this.dynamDist.Clone();
    clone.harmDist = this.harmDist.Clone();
    clone.rehDist = this.rehDist.Clone();
    clone.tempoDist = this.tempoDist.Clone();
    return clone;
  }
  public override Reset(): void {
    super.Reset();
    this.m_setAsDrawing = false;
    this.m_insertScoreDef = true;
    this.m_drawLabels = false;
    this.m_drawingWidth = 0;
    this.m_drawingLabelsWidth = 0;
    this.m_customTuning = new CustomTuning();
    this.dirDist = new MeasurementSigned();
    this.dynamDist = new MeasurementSigned();
    this.harmDist = new MeasurementSigned();
    this.rehDist = new MeasurementSigned();
    this.tempoDist = new MeasurementSigned();
    this.endingRend = 0;
    this.optimize = 0;
    this.ppq = MEI_UNSET;
    this.tuneHz = 0;
    this.tunePname = 0;
    this.tuneTemper = 0;
    this.redrawFlags = 0;
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    if ([ClassId.CLEF, ClassId.GRPSYM, ClassId.KEYSIG, ClassId.MENSUR, ClassId.METERSIG, ClassId.METERSIGGRP, ClassId.STAFFGRP, ClassId.SYMBOLTABLE].includes(classId)) return true;
    return VrvObject.IsRunningElement(classId);
  }

  public override AddChildAdditionalCheck(child: VrvObject): boolean {
    // C++ warns for element-form CLEF/MENSUR children but still accepts them.
    if (child.GetClassId() === ClassId.CLEF || child.GetClassId() === ClassId.MENSUR) {
      // Attribute-vs-element is represented by the structural predicate when available.
      if (!(child as any).IsAttribute?.()) {
        LogWarning(
          child.GetClassId() === ClassId.CLEF
            ? "Having <clef> as child of <scoreDef> is not valid MEI"
            : "Having <mensur> as child of <scoreDef> is not valid MEI"
        );
      }
    }
    return super.AddChildAdditionalCheck(child);
  }

  public override GetInsertOrderFor(classId: ClassId): number {
    return this.GetInsertOrderForIn(classId, [ClassId.SYMBOLTABLE, ClassId.CLEF, ClassId.KEYSIG, ClassId.METERSIGGRP, ClassId.METERSIG, ClassId.MENSUR, ClassId.PGHEAD, ClassId.PGFOOT, ClassId.STAFFGRP, ClassId.GRPSYM]);
  }

  public ReplaceDrawingValues(newValue: DrawingStaffLike | ScoreDefLike): void {
    if (newValue.GetClassId() === ClassId.SCOREDEF) {
      const newScoreDef = newValue as ScoreDefLike;
      this.m_insertScoreDef = false;
      this.m_setAsDrawing = true;

      let redrawFlags = 0;
      let clef: VrvObject | null = null;
      let keySig: VrvObject | null = null;
      let mensur: VrvObject | null = null;
      let meterSig: VrvObject | null = null;
      let meterSigGrp: MeterSigGrpLike | null = null;

      if (newScoreDef.HasClefInfo?.()) {
        redrawFlags |= 0x1;
        clef = newScoreDef.GetClef?.() ?? null;
      }
      if (newScoreDef.HasKeySigInfo?.()) {
        const candidate = newScoreDef.GetKeySig?.();
        if (candidate && (!candidate.HasCancelaccid?.() || candidate.GetCancelaccid?.() !== 1)) {
          keySig = candidate;
          redrawFlags |= 0x2;
        }
      }
      if (newScoreDef.HasMensurInfo?.()) {
        redrawFlags |= 0x4;
        mensur = newScoreDef.GetMensurCopy?.() ?? null;
      }
      if (newScoreDef.HasMeterSigGrpInfo?.()) {
        redrawFlags &= ~0x4;
        redrawFlags |= 0x10;
        meterSigGrp = (newScoreDef.GetMeterSigGrpCopy?.() ?? newScoreDef.GetMeterSigGrp?.() ?? null) as MeterSigGrpLike | null;
        meterSig = meterSigGrp?.GetSimplifiedMeterSig?.() ?? null;
      } else if (newScoreDef.HasMeterSigInfo?.()) {
        redrawFlags |= 0x8;
        meterSig = newScoreDef.GetMeterSigCopy?.() ?? null;
      }

      for (const object of this.FindAllDescendantsByType(ClassId.STAFFDEF)) {
        const staffDef = object as DrawingStaffLike;
        const newStaffDef = newScoreDef.GetStaffDef?.(staffDef.GetN?.() ?? 0) ?? null;
        if (clef) staffDef.SetCurrentClef?.(clef);
        if (newStaffDef?.HasKeySigInfo?.()) {
          const ks = newStaffDef.GetKeySig?.() as KeySigLike | undefined;
          if (ks && (!ks.HasCancelaccid?.() || ks.GetCancelaccid?.() !== 1)) {
            staffDef.SetCurrentKeySig?.(ks);
            redrawFlags |= 0x2;
          }
        } else if (keySig) {
          staffDef.SetCurrentKeySig?.(keySig);
        }
        if (mensur) staffDef.SetCurrentMensur?.(mensur);
        if (meterSig) staffDef.SetCurrentMeterSig?.(meterSig);
        if (meterSigGrp) staffDef.SetCurrentMeterSigGrp?.(meterSigGrp);
      }
      this.SetRedrawFlags(redrawFlags);
      return;
    }

    const newStaffDef = newValue as DrawingStaffLike;
    const staffDef = this.GetStaffDef(newStaffDef.GetN?.() ?? 0) as DrawingStaffLike | null;
    if (!staffDef) {
      LogWarning("StaffDef with xml:id '%s' could not be found", newStaffDef.GetID());
      return;
    }
    if (newStaffDef.HasClefInfo?.()) { staffDef.SetDrawClef?.(true); const c=newStaffDef.GetClef?.(); if(c) staffDef.SetCurrentClef?.(c); }
    if (newStaffDef.HasKeySigInfo?.()) { staffDef.SetDrawKeySig?.(true); const k=newStaffDef.GetKeySig?.(); if(k) staffDef.SetCurrentKeySig?.(k); }
    if (newStaffDef.HasMensurInfo?.()) {
      staffDef.SetDrawMensur?.(true); staffDef.SetDrawMeterSig?.(false);
      const m=newStaffDef.GetMensurCopy?.() ?? newStaffDef.GetMensur?.(); if(m) staffDef.SetCurrentMensur?.(m);
    }
    if (newStaffDef.HasMeterSigGrpInfo?.()) {
      staffDef.SetDrawMeterSigGrp?.(true); staffDef.SetDrawMeterSig?.(false); staffDef.SetDrawMensur?.(false);
      const g=(newStaffDef.GetMeterSigGrpCopy?.() ?? newStaffDef.GetMeterSigGrp?.()) as MeterSigGrpLike | undefined;
      if(g){ staffDef.SetCurrentMeterSigGrp?.(g); const m=g.GetSimplifiedMeterSig?.(); if(m) staffDef.SetCurrentMeterSig?.(m); }
    } else if (newStaffDef.HasMeterSigInfo?.()) {
      const meter=newStaffDef.GetMeterSigCopy?.() ?? newStaffDef.GetMeterSig?.();
      if(meter){
        const invisible = newStaffDef.HasMensurInfo?.() && (meter as any).GetVisible?.() === 2;
        if(invisible){ staffDef.SetDrawMeterSig?.(false); staffDef.SetDrawMensur?.(true); const m=newStaffDef.GetMensurCopy?.() ?? newStaffDef.GetMensur?.(); if(m) staffDef.SetCurrentMensur?.(m); staffDef.SetCurrentMeterSig?.(meter); }
        else { staffDef.SetDrawMeterSig?.(true); staffDef.SetDrawMensur?.(false); staffDef.SetCurrentMeterSig?.(meter); }
      }
    }
    if(newStaffDef.HasLabel?.()){ const label=newStaffDef.GetLabel?.(); if(label) staffDef.SetLabel?.(label); }
  }

  public DrawLabels(): boolean { return this.m_drawLabels; }
  public SetDrawLabels(value: boolean): void { this.m_drawLabels = value; }
  public GetDrawingWidth(): number { return this.m_drawingWidth; }
  public SetDrawingWidth(value: number): void { this.m_drawingWidth = value; }
  public GetDrawingLabelsWidth(): number { return this.m_drawingLabelsWidth; }
  public SetDrawingLabelsWidth(width: number): void { if (this.m_drawingLabelsWidth < width) this.m_drawingLabelsWidth = width; }
  public ResetDrawingLabelsWidth(): void { this.m_drawingLabelsWidth = 0; }

  // AttSpacing forwarding — C++ `ScoreDef` inherits these through
  // ScoreDefInterface's multiple inheritance; system.cpp calls them directly
  // on the drawing ScoreDef.
  public HasSpacingSystem(): boolean { return this.GetScoreDefInterface().HasSpacingSystem(); }
  public GetSpacingSystem(): { GetType(): number; GetPx(): number; GetVu(): number } {
    return this.GetScoreDefInterface().GetSpacingSystem();
  }

  public GetCustomTuning(): CustomTuning { return this.m_customTuning; }
  public SetCustomTuning(value: CustomTuning): void { this.m_customTuning = value; }
  public ResetDistances(): void { this.dirDist = new MeasurementSigned(); this.dynamDist = new MeasurementSigned(); this.harmDist = new MeasurementSigned(); this.rehDist = new MeasurementSigned(); this.tempoDist = new MeasurementSigned(); }
  public SetDirDist(v: MeasurementSigned): void { this.dirDist = cloneOrCopy(this.dirDist, v); } public GetDirDist(): MeasurementSigned { return this.dirDist.Clone(); } public HasDirDist(): boolean { return this.dirDist.HasValue(); }
  public SetDynamDist(v: MeasurementSigned): void { this.dynamDist = cloneOrCopy(this.dynamDist, v); } public GetDynamDist(): MeasurementSigned { return this.dynamDist.Clone(); } public HasDynamDist(): boolean { return this.dynamDist.HasValue(); }
  public SetHarmDist(v: MeasurementSigned): void { this.harmDist = cloneOrCopy(this.harmDist, v); } public GetHarmDist(): MeasurementSigned { return this.harmDist.Clone(); } public HasHarmDist(): boolean { return this.harmDist.HasValue(); }
  public SetRehDist(v: MeasurementSigned): void { this.rehDist = cloneOrCopy(this.rehDist, v); } public GetRehDist(): MeasurementSigned { return this.rehDist.Clone(); } public HasRehDist(): boolean { return this.rehDist.HasValue(); }
  public SetTempoDist(v: MeasurementSigned): void { this.tempoDist = cloneOrCopy(this.tempoDist, v); } public GetTempoDist(): MeasurementSigned { return this.tempoDist.Clone(); } public HasTempoDist(): boolean { return this.tempoDist.HasValue(); }
  public ResetEndings(): void { this.endingRend = 0; } public SetEndingRend(v: number): void { this.endingRend = v; } public GetEndingRend(): number { return this.endingRend; } public HasEndingRend(): boolean { return this.endingRend !== 0; }
  public ResetOptimization(): void { this.optimize = 0; } public SetOptimize(v: number): void { this.optimize = v; } public GetOptimize(): number { return this.optimize; } public HasOptimize(): boolean { return this.optimize !== 0; }
  public ResetTimeBase(): void { this.ppq = MEI_UNSET; } public SetPpq(v: number): void { this.ppq = v; } public GetPpq(): number { return this.ppq; } public HasPpq(): boolean { return this.ppq !== MEI_UNSET; }
  public ResetTuning(): void { this.tuneHz = 0; this.tunePname = 0; this.tuneTemper = 0; } public SetTuneHz(v: number): void { this.tuneHz = v; } public GetTuneHz(): number { return this.tuneHz; } public HasTuneHz(): boolean { return this.tuneHz !== 0; } public SetTunePname(v: number): void { this.tunePname = v; } public GetTunePname(): number { return this.tunePname; } public HasTunePname(): boolean { return this.tunePname !== 0; } public SetTuneTemper(v: number): void { this.tuneTemper = v; } public GetTuneTemper(): number { return this.tuneTemper; } public HasTuneTemper(): boolean { return this.tuneTemper !== 0; }

  public SetRedrawFlags(flags: number): void {
    this.redrawFlags = flags;
    this.m_setAsDrawing = true;
    const redrawClef = 0x1, redrawKey = 0x2, redrawMensur = 0x4, redrawMeter = 0x8, redrawMeterGrp = 0x10, force = 0x100;
    for (const object of this.FindAllDescendantsByType(ClassId.STAFFDEF)) {
      const staff = object as DrawingStaffLike;
      if ((flags & redrawClef) !== 0 || (flags & force) !== 0) (staff as any).SetDrawClef?.((flags & redrawClef) !== 0);
      if ((flags & redrawKey) !== 0 || (flags & force) !== 0) (staff as any).SetDrawKeySig?.((flags & redrawKey) !== 0);
      if ((flags & redrawMensur) !== 0 || (flags & force) !== 0) (staff as any).SetDrawMensur?.((flags & redrawMensur) !== 0);
      if ((flags & redrawMeter) !== 0 || (flags & force) !== 0) (staff as any).SetDrawMeterSig?.((flags & redrawMeter) !== 0);
      if ((flags & redrawMeterGrp) !== 0 || (flags & force) !== 0) (staff as any).SetDrawMeterSigGrp?.((flags & redrawMeterGrp) !== 0);
    }
  }
  // C++ has no separate drawing field: GetSystemLeftline is the AttSystems
  // attribute via ScoreDefElement. The removed override shadowed it.
  public GetRedrawFlags(): number { return this.redrawFlags; }

  public ResetFromDrawingValues(): void {
    for (const object of this.GetChildren()) {
      if (object.GetClassId() !== ClassId.STAFFDEF) continue;
      const staff = object as DrawingStaffLike;
      const clef = staff.FindDescendantByType(ClassId.CLEF); if (clef) (staff as any).ReplaceWithCopyOf?.((staff as any).GetCurrentClef?.() ?? null);
      const key = staff.FindDescendantByType(ClassId.KEYSIG); if (key) (staff as any).ReplaceWithCopyOf?.((staff as any).GetCurrentKeySig?.() ?? null);
      const mensur = staff.FindDescendantByType(ClassId.MENSUR); if (mensur) (staff as any).ReplaceWithCopyOf?.((staff as any).GetCurrentMensur?.() ?? null);
      const meterGrp = staff.FindDescendantByType(ClassId.METERSIGGRP); const meter = staff.FindDescendantByType(ClassId.METERSIG);
      if (meterGrp) (staff as any).ReplaceWithCopyOf?.((staff as any).GetCurrentMeterSigGrp?.() ?? null); else if (meter) (staff as any).ReplaceWithCopyOf?.((staff as any).GetCurrentMeterSig?.() ?? null);
    }
  }
  private matchesPgFunc(f: unknown, func: number): boolean {
    if (f === func) return true;
    if (func === 2 && (f === 'first' || f === 2)) return true;
    if (func === 1 && (f === 'all' || f === 1)) return true;
    if (func === 0 && (f === 'none' || f === 0 || f === '' || f === undefined)) return true;
    return false;
  }
  public GetPgFoot<T extends VrvObject = VrvObject>(func: number): T | null {
    for (const object of this.FindAllDescendantsByType(ClassId.PGFOOT)) if (this.matchesPgFunc((object as RunningLike).GetFunc?.(), func)) return object as T;
    return null;
  }
  public GetPgHead<T extends VrvObject = VrvObject>(func: number): T | null {
    for (const object of this.FindAllDescendantsByType(ClassId.PGHEAD)) if (this.matchesPgFunc((object as RunningLike).GetFunc?.(), func)) return object as T;
    return null;
  }

  public GetStaffDef(n: number): StaffLike | null {
    // C++ iterates the flat filtered list (ScoreDef::FilterList keeps only
    // STAFFDEF), so StaffDef nested inside StaffGrp is found.
    for (const child of this.GetList()) {
      const staff = child as StaffLike;
      if (staff.GetN?.() === n) return staff;
      const ossia = staff.GetOssiaStaffDef?.(n);
      if (ossia) return ossia;
    }
    return null;
  }
  public GetStaffGrp(n: string): StaffGrpLike | null {
    for (const object of this.FindAllDescendantsByType(ClassId.STAFFGRP)) {
      const group = object as StaffGrpLike;
      if (group.GetN?.() === n) return group;
    }
    return null;
  }
  public GetStaffNs(): number[] {
    const ns: number[] = [];
    // Same flat-list parity as GetStaffDef.
    for (const child of this.GetList()) {
      const staff = child as StaffLike;
      staff.GetOssiaAboveNs?.(ns);
      if (staff.GetN) ns.push(staff.GetN());
      staff.GetOssiaBelowNs?.(ns);
    }
    return ns;
  }
  public GetMaxStaffSize(): number {
    const staffGrp = this.FindDescendantByType(ClassId.STAFFGRP) as StaffGrpLike | null;
    return staffGrp?.GetMaxStaffSize?.() ?? 100;
  }
  public IsSectionRestart(): boolean {
    const parent = this.GetParent();
    if (!parent) return false;
    const section = parent.GetPrevious(this, ClassId.SECTION) as SectionLike | null;
    return !!section && section.GetRestart?.() === 1;
  }

  public ReplaceDrawingLabels(newStaffGrp: LabelGroupLike): void {
    const staffGrp = this.GetStaffGrp(newStaffGrp.GetN?.() ?? '') as LabelGroupLike | null;
    if(!staffGrp) return;
    if(newStaffGrp.HasLabelInfo?.()){ const label=newStaffGrp.GetLabelCopy?.(); if(label){ if(staffGrp.HasLabelInfo?.()){ const old=staffGrp.GetLabel?.(); if(old) staffGrp.ReplaceChild?.(old,label); } else staffGrp.AddChild?.(label); } }
    if(newStaffGrp.HasLabelAbbrInfo?.()){ const label=newStaffGrp.GetLabelAbbrCopy?.(); if(label){ if(staffGrp.HasLabelAbbrInfo?.()){ const old=staffGrp.GetLabelAbbr?.(); if(old) staffGrp.ReplaceChild?.(old,label); } else staffGrp.AddChild?.(label); } }
  }

  public AddOssias(staffN: number, ossias: number[], above: boolean): void {
    const staffDef = this.GetStaffDef(staffN);
    if (!staffDef) return;
    for (const ossiaN of ossias) {
      const original = this.GetStaffDef(ossiaN - 1000000);
      if (!original) continue;
      const ossiaStaff = original.Clone() as StaffLike;
      ossiaStaff.SetN?.(ossiaN);
      if (above) staffDef.AddOssiaAbove?.(ossiaStaff);
      else staffDef.AddOssiaBelow?.(ossiaStaff);
    }
  }

  public HasSystemStartLine(): boolean {
    const staffGrp = this.FindDescendantByType(ClassId.STAFFGRP) as StaffGrpLike | null;
    if (!staffGrp) return false;
    const firstLast = staffGrp.GetFirstLastStaffDef?.();
    const allDefs = staffGrp.FindAllDescendantsByType?.(ClassId.STAFFDEF) ?? [];
    const groupSymbol = staffGrp.GetFirst?.(ClassId.GRPSYM);
    if ((firstLast?.[0] && firstLast?.[1] && allDefs.length > 1) || groupSymbol) return this.GetSystemLeftline() !== 2;
    return this.GetSystemLeftline() === 1;
  }

  public override Accept(functor: Functor): FunctorCode { return (functor as any).VisitScoreDef?.(this) ?? super.Accept(functor); }
  public AcceptConst(functor: ConstFunctor): FunctorCode { return (functor as any).VisitScoreDef?.(this) ?? FunctorCode.FUNCTOR_CONTINUE; }
  public override AcceptEnd(functor: Functor): FunctorCode { return (functor as any).VisitScoreDefEnd?.(this) ?? super.AcceptEnd(functor); }
  public AcceptEndConst(functor: ConstFunctor): FunctorCode { return (functor as any).VisitScoreDefEnd?.(this) ?? FunctorCode.FUNCTOR_CONTINUE; }

  public FilterList(childList: VrvObject[]): void {
    for (let i = childList.length - 1; i >= 0; --i) if (childList[i].GetClassId() !== ClassId.STAFFDEF) childList.splice(i, 1);
  }
}

class ScoreDefListInterface extends ObjectListInterface {
  private readonly owner: ScoreDef;
  public constructor(owner: ScoreDef) {
    super();
    this.owner = owner;
  }
  public override GetInterfaceOwner(): VrvObject {
    return this.owner;
  }
  protected override FilterList(childList: VrvObject[]): void {
    this.owner.FilterList(childList);
  }
}
