import { Interface } from './interface.js';
import { data_MEASUREBEAT, FunctorCode, InterfaceId, ClassId } from './vrvdef.js';
import { ExtractIDFragment, LogWarning } from './vrv.js';
import { VrvObject } from './object.js';
import { AttNIntegerComparison } from './comparison.js';

export const ATT_PARTIDENT = 182;
export const ATT_STAFFIDENT = 203;
export const ATT_STARTENDID = 207;
export const ATT_STARTID = 208;
export const ATT_TIMESTAMPLOG = 218;
export const ATT_TIMESTAMP2LOG = 219;

export const STAFFREL_between = 3;
export const CURVEDIR_above = 1;
export const CURVEDIR_below = 2;

export interface PartIdentLike {
  ResetPartIdent(): void;
  GetPart(): string;
  SetPart(v: string): void;
  HasPart(): boolean;
  GetPartstaff(): string;
  SetPartstaff(v: string): void;
  HasPartstaff(): boolean;
}
export class PartIdentAttributes implements PartIdentLike {
  private part = '';
  private partstaff = '';
  ResetPartIdent(): void { this.part = ''; this.partstaff = ''; }
  GetPart(): string { return this.part; }
  SetPart(v: string): void { this.part = v; }
  HasPart(): boolean { return this.part !== ''; }
  GetPartstaff(): string { return this.partstaff; }
  SetPartstaff(v: string): void { this.partstaff = v; }
  HasPartstaff(): boolean { return this.partstaff !== ''; }
}

export class StaffIdentAttributes {
  private staff: number[] = [];
  ResetStaffIdent(): void { this.staff = []; }
  GetStaff(): number[] { return this.staff; }
  SetStaff(v: number[]): void { this.staff = [...v]; }
  HasStaff(): boolean { return this.staff.length > 0; }
}

export class StartIdAttributes {
  private startid = '';
  ResetStartId(): void { this.startid = ''; }
  GetStartid(): string { return this.startid; }
  SetStartid(v: string): void { this.startid = v; }
  HasStartid(): boolean { return this.startid !== ''; }
}

export class StartEndIdAttributes {
  private endid = '';
  ResetStartEndId(): void { this.endid = ''; }
  GetEndid(): string { return this.endid; }
  SetEndid(v: string): void { this.endid = v; }
  HasEndid(): boolean { return this.endid !== ''; }
}

export class TimestampLogAttributes {
  private tstamp = -1;
  ResetTimestampLog(): void { this.tstamp = -1; }
  GetTstamp(): number { return this.tstamp; }
  SetTstamp(v: number): void { this.tstamp = v; }
  HasTstamp(): boolean { return this.tstamp !== -1; }
}

export class Timestamp2LogAttributes {
  private tstamp2: data_MEASUREBEAT = [-1, -1];
  ResetTimestamp2Log(): void { this.tstamp2 = [-1, -1]; }
  GetTstamp2(): data_MEASUREBEAT { return this.tstamp2; }
  SetTstamp2(v: data_MEASUREBEAT): void { this.tstamp2 = [v[0], v[1]]; }
  HasTstamp2(): boolean { return this.tstamp2[0] !== -1 || this.tstamp2[1] !== -1; }
}

export interface LayerElementLike {
  GetID(): string;
  GetFirstAncestor(id: ClassId | number): MeasureLike | null;
  GetAncestorStaff(...args: unknown[]): StaffLike | null;
  Is(id: ClassId | number): boolean;
  IsAnyOf?(ids: readonly (ClassId | number)[]): boolean;
  GetAlignment?(): AlignmentLike | null;
  GetDrawingX?(): number;
  GetDrawingY?(): number;
  GetCrossStaff?(layerRef: { value: LayerLike | null }): StaffLike | null;
}
export interface StaffLike { GetN(): number; DrawingIsVisible?(): boolean; }
export interface MeasureLike {
  GetFirstAncestor(id: ClassId | number): SystemLike | null;
  GetStaffCount(): number;
  GetFirstStaff(): StaffLike | null;
  FindDescendantByComparison(comparison: unknown, depth: number): StaffLike | null;
  GetID?(): string;
  GetIndex?(): number;
}
export interface SystemLike { GetTopVisibleStaff(all: boolean): StaffLike | null; }
export interface HarmLike { GetStaff(): number[]; }
export interface AlignmentLike {}

export interface LayerLike { GetN?(): number; }
export interface ChordLike extends LayerElementLike {
  GetCrossStaff(layerRef: { value: LayerLike | null }): StaffLike | null;
  GetCrossStaffExtremes(aboveRef: { value: StaffLike | null }, belowRef: { value: StaffLike | null }): void;
}
export interface AttPlacementRelStaffLike { GetPlace(): number; }
export interface PrepareTimePointingFunctorLike { InsertInterfaceIDTuple(classId: number, iface: TimePointInterface): void; }
export interface PrepareTimestampsFunctorLike {
  InsertObjectBeatPair(object: ObjectLike, beat: data_MEASUREBEAT): void;
  InsertInterfaceIDPair?(classId: number, iface: TimeSpanningInterface): void;
}
export interface PrepareTimeSpanningFunctorLike { IsProcessingData(): boolean; InsertInterfaceOwnerPair(object: ObjectLike, iface: TimeSpanningInterface): void; }
export interface PrepareStaffCurrentTimeSpanningFunctorLike { InsertTimeSpanningElement(object: ObjectLike): void; }
export interface ResetDataFunctorLike {}
export interface ObjectLike extends LayerElementLike { GetClassId(): number; GetClassName(): string; }
export interface StaffAlignmentLike { GetStaff(): StaffLike | null; }

export class TimePointInterface extends Interface {
  protected readonly partIdent = new PartIdentAttributes();
  protected readonly staffIdent = new StaffIdentAttributes();
  protected readonly startId = new StartIdAttributes();
  protected readonly timestampLog = new TimestampLogAttributes();
  protected m_start: LayerElementLike | null = null;
  protected m_startID = '';

  constructor() {
    super();
    this.RegisterInterfaceAttClass(ATT_PARTIDENT);
    this.RegisterInterfaceAttClass(ATT_STAFFIDENT);
    this.RegisterInterfaceAttClass(ATT_STARTID);
    this.RegisterInterfaceAttClass(ATT_TIMESTAMPLOG);
    this.resetTimePointState();
  }

  private resetTimePointState(): void {
    this.partIdent.ResetPartIdent(); this.staffIdent.ResetStaffIdent(); this.startId.ResetStartId(); this.timestampLog.ResetTimestampLog();
    this.m_start = null; this.m_startID = '';
  }

  override Reset(): void {
    this.partIdent.ResetPartIdent(); this.staffIdent.ResetStaffIdent(); this.startId.ResetStartId(); this.timestampLog.ResetTimestampLog();
    this.m_start = null; this.m_startID = '';
  }
  override IsInterface(): InterfaceId { return InterfaceId.INTERFACE_TIME_POINT; }

  SetPart(v: string): void { this.partIdent.SetPart(v); }
  GetPart(): string { return this.partIdent.GetPart(); }
  HasPart(): boolean { return this.partIdent.HasPart(); }
  SetPartstaff(v: string): void { this.partIdent.SetPartstaff(v); }
  GetPartstaff(): string { return this.partIdent.GetPartstaff(); }
  HasPartstaff(): boolean { return this.partIdent.HasPartstaff(); }
  GetStaff(): number[] { return this.staffIdent.GetStaff(); }
  SetStaff(v: number[]): void { this.staffIdent.SetStaff(v); }
  HasStaff(): boolean { return this.staffIdent.HasStaff(); }
  SetStartid(v: string): void { this.startId.SetStartid(v); }
  GetStartid(): string { return this.startId.GetStartid(); }
  HasStartid(): boolean { return this.startId.HasStartid(); }
  SetTstamp(v: number): void { this.timestampLog.SetTstamp(v); }
  GetTstamp(): number { return this.timestampLog.GetTstamp(); }
  HasTstamp(): boolean { return this.timestampLog.HasTstamp(); }

  SetStart(start: LayerElementLike | null): void { if (this.m_start) throw new Error('TimePointInterface::SetStart already set'); this.m_start = start; }
  GetStart(): LayerElementLike | null { return this.m_start; }
  SetStartOnly(element: LayerElementLike): boolean {
    if (!this.m_start && this.m_startID !== '' && element.GetID() === this.m_startID) { this.SetStart(element); return true; }
    return false;
  }
  AddStaff(n: number): void { if (!this.HasStaff() || !this.GetStaff().includes(n)) this.SetStaff([...this.GetStaff(), n]); }
  HasStart(): boolean { return this.m_start !== null; }
  SetIDStr(): void { if (this.HasStartid()) this.m_startID = ExtractIDFragment(this.GetStartid()); }

  GetStartMeasure(): MeasureLike | null { return this.m_start ? this.m_start.GetFirstAncestor(ClassId.MEASURE) : null; }
  IsOnStaff(n: number): boolean {
    if (this.HasStaff()) return this.GetStaff().some(v => v === n);
    if (this.m_start) { const staff = this.m_start.GetAncestorStaff(0, false); return !!staff && staff.GetN() === n; }
    return false;
  }
  GetTstampStaves(measure: MeasureLike, object: ObjectLike): StaffLike[] {
    if (!measure || !object) throw new Error('TimePointInterface::GetTstampStaves missing required argument');
    let staffList: number[] = [];
    if (object.Is(ClassId.FIGURE) && !this.HasStaff()) {
      const harm = object.GetFirstAncestor(ClassId.HARM) as unknown as HarmLike | null;
      if (harm) staffList = harm.GetStaff();
    } else if (this.HasPart() && this.GetPart() === '%all') {
      const system = measure.GetFirstAncestor(ClassId.SYSTEM);
      if (!system) throw new Error('TimePointInterface::GetTstampStaves missing system');
      const staff = system.GetTopVisibleStaff(false); if (staff) staffList.push(staff.GetN());
    } else if (this.HasStaff()) {
      let between = false;
      if (object.IsAnyOf?.([ClassId.DYNAM, ClassId.DIR, ClassId.HAIRPIN, ClassId.TEMPO])) {
        const placement = object as unknown as AttPlacementRelStaffLike;
        between = placement.GetPlace() === STAFFREL_between;
      }
      staffList = between ? [this.GetStaff()[0]] : this.GetStaff().slice();
    } else if (this.m_start && !this.m_start.IsAnyOf?.([ClassId.BARLINE, ClassId.TIMESTAMP_ATTR])) {
      const staff = this.m_start.GetAncestorStaff(); if (staff) staffList.push(staff.GetN());
    } else if (measure.GetStaffCount() === 1) {
      const staff = measure.GetFirstStaff(); if (staff) staffList.push(staff.GetN());
    }
    const result: StaffLike[] = [];
    for (const staffN of staffList) {
      // C++ timeinterface.cpp constructs AttNIntegerComparison(STAFF, staffN).
      // A structural literal fails evaluateComparison (not instanceof Comparison)
      // and matches nothing, leaving every time-spanning connector staff-less.
      const staff = measure.FindDescendantByComparison(new AttNIntegerComparison(ClassId.STAFF, staffN), 1);
      if (!staff) continue;
      if (staff.DrawingIsVisible && !staff.DrawingIsVisible()) continue;
      result.push(staff);
    }
    return result;
  }
  VerifyMeasure(owner: ObjectLike): boolean {
    if (!owner) throw new Error('TimePointInterface::VerifyMeasure missing owner');
    if (this.m_start && owner.GetFirstAncestor(ClassId.MEASURE) !== this.GetStartMeasure()) return false;
    return true;
  }
  InterfacePrepareTimePointing(functor: PrepareTimePointingFunctorLike, object: ObjectLike): FunctorCode {
    if (!this.HasStartid()) return FunctorCode.FUNCTOR_CONTINUE;
    this.SetIDStr(); functor.InsertInterfaceIDTuple(object.GetClassId(), this); return FunctorCode.FUNCTOR_CONTINUE;
  }
  InterfacePrepareTimestamps(functor: PrepareTimestampsFunctorLike, object: ObjectLike): FunctorCode {
    if (this.HasStart()) {
      if (this.HasTstamp()) {
        LogWarning(`%s with @xml:id %s has both a @startid and an @tstamp; @tstamp is ignored`, object.GetClassName(), object.GetID());
      }
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    if (!this.HasTstamp()) return FunctorCode.FUNCTOR_CONTINUE;
    functor.InsertObjectBeatPair(object, [-1, this.GetTstamp()]); return FunctorCode.FUNCTOR_CONTINUE;
  }
  InterfaceResetData(_functor: ResetDataFunctorLike, _object: ObjectLike): FunctorCode { this.m_start = null; this.m_startID = ''; return FunctorCode.FUNCTOR_CONTINUE; }
}

export class TimeSpanningInterface extends TimePointInterface {
  protected readonly startEndId = new StartEndIdAttributes();
  protected readonly timestamp2Log = new Timestamp2LogAttributes();
  protected m_end: LayerElementLike | null = null;
  protected m_endID = '';

  constructor() {
    super(); this.RegisterInterfaceAttClass(ATT_STARTENDID); this.RegisterInterfaceAttClass(ATT_TIMESTAMP2LOG); this.Reset();
  }
  override Reset(): void { super.Reset(); this.startEndId.ResetStartEndId(); this.timestamp2Log.ResetTimestamp2Log(); this.m_end = null; this.m_endID = ''; }
  override IsInterface(): InterfaceId { return InterfaceId.INTERFACE_TIME_SPANNING; }
  SetEndid(v: string): void { this.startEndId.SetEndid(v); }
  GetEndid(): string { return this.startEndId.GetEndid(); }
  HasEndid(): boolean { return this.startEndId.HasEndid(); }
  SetTstamp2(v: data_MEASUREBEAT): void { this.timestamp2Log.SetTstamp2(v); }
  GetTstamp2(): data_MEASUREBEAT { return this.timestamp2Log.GetTstamp2(); }
  HasTstamp2(): boolean { return this.timestamp2Log.HasTstamp2(); }
  SetEnd(end: LayerElementLike | null): void { if (this.m_end) throw new Error('TimeSpanningInterface::SetEnd already set'); this.m_end = end; }
  GetEnd(): LayerElementLike | null { return this.m_end; }
  SetStartAndEnd(element: LayerElementLike): boolean {
    if (!this.m_start && this.m_startID !== '' && element.GetID() === this.m_startID) this.SetStart(element);
    else if (!this.m_end && this.m_endID !== '' && element.GetID() === this.m_endID) this.SetEnd(element);
    return this.m_start !== null && this.m_end !== null;
  }
  HasStartAndEnd(): boolean { return !!this.m_start && !!this.m_end; }
  SetIDStr(): void { super.SetIDStr(); if (this.HasEndid()) this.m_endID = ExtractIDFragment(this.GetEndid()); }
  GetEndMeasure(): MeasureLike | null { return this.m_end ? this.m_end.GetFirstAncestor(ClassId.MEASURE) : null; }
  IsSpanningMeasures(): boolean { return this.HasStartAndEnd() && this.GetStartMeasure() !== this.GetEndMeasure(); }
  IsOrdered(start = this.m_start, end = this.m_end): boolean {
    if (!start || !end) return true;
    const startMeasure = start.GetFirstAncestor(ClassId.MEASURE);
    const endMeasure = end.GetFirstAncestor(ClassId.MEASURE);
    if (startMeasure === endMeasure) {
      const startAlignment = start.GetAlignment?.();
      const endAlignment = end.GetAlignment?.();
      if (!startAlignment || !endAlignment) return true;
      return VrvObject.IsPreOrdered(startAlignment as unknown as VrvObject, endAlignment as unknown as VrvObject);
    }
    return (startMeasure?.GetIndex?.() ?? 0) < (endMeasure?.GetIndex?.() ?? 0);
  }
  GetCrossStaffOverflows(alignment: StaffAlignmentLike, curveDir: number, skipAboveRef: { value: boolean }, skipBelowRef: { value: boolean }): void {
    if (!alignment || !this.m_start || !this.m_end) return;
    const target = alignment.GetStaff(); if (!target) return;
    if (this.m_start.Is(ClassId.TIMESTAMP_ATTR) && this.m_end.Is(ClassId.TIMESTAMP_ATTR)) return;
    const findStaff = (element: LayerElementLike): StaffLike | null => {
      let layerRef: { value: LayerLike | null } = { value: null };
      if (element.Is(ClassId.CHORD)) {
        const chord = element as unknown as ChordLike;
        let staff = chord.GetCrossStaff(layerRef);
        if (!staff) {
          const aboveRef = { value: null as StaffLike | null }; const belowRef = { value: null as StaffLike | null };
          chord.GetCrossStaffExtremes(aboveRef, belowRef);
          staff = curveDir === CURVEDIR_above ? aboveRef.value : belowRef.value;
        }
        return staff;
      }
      // C++ timeinterface.cpp calls GetAncestorStaff(ANCESTOR_ONLY, false):
      // timestamps have no staff ancestor and yield null instead of throwing.
      const cross = element.GetCrossStaff?.(layerRef) ?? null;
      if (cross) return cross;
      try { return element.GetAncestorStaff?.(0, false) ?? null; }
      catch { return null; }
    };
    let startStaff = findStaff(this.m_start); let endStaff = findStaff(this.m_end);
    if (!endStaff) endStaff = startStaff; else if (!startStaff) startStaff = endStaff;
    if (!startStaff || !endStaff) return;
    if (startStaff.GetN() < target.GetN() || endStaff.GetN() < target.GetN()) skipAboveRef.value = true;
    if (startStaff.GetN() > target.GetN() || endStaff.GetN() > target.GetN()) skipBelowRef.value = true;
  }
  InterfacePrepareTimeSpanning(functor: PrepareTimeSpanningFunctorLike, object: ObjectLike): FunctorCode {
    if (!this.HasStartid() && !this.HasEndid()) return FunctorCode.FUNCTOR_CONTINUE;
    if (functor.IsProcessingData()) return FunctorCode.FUNCTOR_CONTINUE;
    this.SetIDStr(); functor.InsertInterfaceOwnerPair(object, this); return FunctorCode.FUNCTOR_CONTINUE;
  }
  override InterfacePrepareTimestamps(functor: PrepareTimestampsFunctorLike, object: ObjectLike): FunctorCode {
    if (this.HasEndid()) {
      if (this.HasTstamp2()) {
        LogWarning(`%s with @xml:id %s has both a @endid and an @tstamp2; @tstamp2 is ignored`, object.GetClassName(), object.GetID());
      }
      if (this.GetStartid() === this.GetEndid() && !object.Is(ClassId.OCTAVE)) {
        LogWarning(`%s with @xml:id %s will not get rendered as it has identical values in @startid and @endid`, object.GetClassName(), object.GetID());
      }
      return super.InterfacePrepareTimestamps(functor, object);
    }
    if (!this.HasTstamp2()) {
      return super.InterfacePrepareTimestamps(functor, object);
    }
    functor.InsertInterfaceIDPair?.(object.GetClassId(), this);
    functor.InsertObjectBeatPair(object, this.GetTstamp2());
    return super.InterfacePrepareTimestamps(functor, object);
  }
  InterfacePrepareStaffCurrentTimeSpanning(functor: PrepareStaffCurrentTimeSpanningFunctorLike, object: ObjectLike): FunctorCode {
    if (this.IsSpanningMeasures()) functor.InsertTimeSpanningElement(object);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
  override InterfaceResetData(functor: ResetDataFunctorLike, object: ObjectLike): FunctorCode { this.m_end = null; this.m_endID = ''; return super.InterfaceResetData(functor, object); }
}
