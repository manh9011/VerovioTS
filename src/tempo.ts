import { ClassId, DURATION_breve, FunctorCode, MIDI_TEMPO, VRV_UNSET } from './vrvdef.js';
import { ObjectFactory, VrvObject } from './object.js';
import { ControlElement } from './controlelement.js';
import { TextDirInterface, StaffRel } from './textdirinterface.js';
import { TimePointInterface, TimeSpanningInterface, LayerElementLike } from './timeinterface.js';
import { InstExtender, InstLang, InstMmTempo } from './atts_shared.js';
import { InstMidiTempo } from './atts_midi.js';

// Canonical libmei AttClassId ordinals (see libmei/dist/attclasses.h).
const ATT_EXTENDER = 132;
const ATT_LANG = 146;
const ATT_MIDITEMPO = 80;
const ATT_MMTEMPO = 165;

// data_BOOLEAN ordinals from the converter layer (see attconverter.ts).
const BOOLEAN_NONE = 0;
const BOOLEAN_true = 1;

export interface TempoMmTempoLike {
  GetMm(): number;
  HasMmUnit(): boolean;
  GetMmUnit(): number;
  HasMmDots(): boolean;
  GetMmDots(): number;
}

export interface TempoFunctorLike {
  VisitTempo(tempo: unknown): FunctorCode;
  VisitTempoEnd(tempo: unknown): FunctorCode;
}

/** Pure TypeScript translation of Verovio's src/tempo.cpp / include/vrv/tempo.h. */
export class Tempo extends ControlElement {
  private textDirInterface: TextDirInterface | null = null;
  private timeSpanningInterface: TimeSpanningInterface | null = null;
  private attExtender: InstExtender | null = null;
  private attLang: InstLang | null = null;
  private attMidiTempo: InstMidiTempo | null = null;
  private attMmTempo: InstMmTempo | null = null;
  private drawingXRels?: Map<number, number>;

  constructor() {
    super(ClassId.TEMPO);
    this.textDirInterface = new TextDirInterface();
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.attExtender = new InstExtender();
    this.attLang = new InstLang();
    this.attMidiTempo = new InstMidiTempo();
    this.attMmTempo = new InstMmTempo();
    this.RegisterInterface(this.textDirInterface.GetAttClasses(), this.textDirInterface.IsInterface());
    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());
    this.RegisterAttClass(ATT_EXTENDER);
    this.RegisterAttClass(ATT_LANG);
    this.RegisterAttClass(ATT_MIDITEMPO);
    this.RegisterAttClass(ATT_MMTEMPO);
    this.Reset();
  }

  override Reset(): void {
    super.Reset();
    this.textDirInterface ??= new TextDirInterface();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.attExtender ??= new InstExtender();
    this.attLang ??= new InstLang();
    this.attMidiTempo ??= new InstMidiTempo();
    this.attMmTempo ??= new InstMmTempo();
    this.textDirInterface.Reset();
    this.timeSpanningInterface.Reset();
    this.attExtender.ResetExtender();
    this.attLang.ResetLang();
    this.attMidiTempo.ResetMidiTempo();
    this.attMmTempo.ResetMmTempo();
    this.drawingXRels ??= new Map<number, number>();
    this.drawingXRels.clear();
  }

  override GetClassName(): string { return 'tempo'; }

  GetTextDirInterface(): TextDirInterface {
    this.textDirInterface ??= new TextDirInterface();
    return this.textDirInterface;
  }

  GetTimePointInterface(): TimePointInterface {
    return this.GetTimeSpanningInterface();
  }

  GetTimeSpanningInterface(): TimeSpanningInterface {
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    return this.timeSpanningInterface;
  }

  GetStart(): LayerElementLike | null { return this.GetTimeSpanningInterface().GetStart(); }
  SetStart(start: LayerElementLike | null): void { this.GetTimeSpanningInterface().SetStart(start); }

  IsSupportedChild(classId: ClassId): boolean {
    switch (classId) {
      case ClassId.LB:
      case ClassId.REND:
      case ClassId.SYMBOL:
      case ClassId.TEXT:
        return true;
      default:
        return VrvObject.IsEditorialElement(classId);
    }
  }

  SetDrawingXRelative(staffN: number, drawingX: number): void {
    this.drawingXRels ??= new Map<number, number>();
    this.drawingXRels.set(staffN, drawingX);
  }

  ResetDrawingXRelative(): void {
    this.drawingXRels?.clear();
  }

  GetDrawingXRelativeToStaff(staffN: number): number {
    let m_relativeX = 0;
    if (this.drawingXRels?.has(staffN)) {
      m_relativeX = this.drawingXRels.get(staffN)!;
    }
    const start = this.GetStart();
    if (!start || typeof start.GetDrawingX !== 'function') {
      throw new Error('Tempo::GetDrawingXRelativeToStaff requires a start object.');
    }
    return start.GetDrawingX() + m_relativeX;
  }

  // AttExtender forwarding
  SetExtender(value: any): void { this.attExtender!.SetExtender(value); }
  GetExtender(): any { return this.attExtender!.GetExtender(); }
  HasExtender(): boolean { return this.attExtender!.HasExtender(); }
  ResetExtender(): void { this.attExtender!.ResetExtender(); }

  /** See FloatingObject::IsExtenderElement */
  IsExtenderElement(): boolean { return this.GetExtender() === BOOLEAN_true; }

  // AttLang forwarding
  SetLang(value: any): void { this.attLang!.SetLang(value); }
  GetLang(): any { return this.attLang!.GetLang(); }
  HasLang(): boolean { return this.attLang!.HasLang(); }
  HasTranslit(): boolean { return this.attLang!.HasTranslit(); }
  SetTranslit(value: any): void { this.attLang!.SetTranslit(value); }
  GetTranslit(): any { return this.attLang!.GetTranslit(); }

  // AttMidiTempo forwarding
  SetMidiBpm(value: number): void { this.attMidiTempo!.SetMidiBpm(value); }
  GetMidiBpm(): number { return this.attMidiTempo!.GetMidiBpm(); }
  HasMidiBpm(): boolean { return this.attMidiTempo!.HasMidiBpm(); }
  SetMidiMspb(value: any): void { this.attMidiTempo!.SetMidiMspb(value); }
  GetMidiMspb(): any { return this.attMidiTempo!.GetMidiMspb(); }
  HasMidiMspb(): boolean { return this.attMidiTempo!.HasMidiMspb(); }

  // AttMmTempo forwarding
  SetMm(value: any): void { this.attMmTempo!.SetMm(value); }
  GetMm(): any { return this.attMmTempo!.GetMm(); }
  HasMm(): boolean { return this.attMmTempo!.HasMm(); }
  SetMmUnit(value: any): void { this.attMmTempo!.SetMmUnit(value); }
  GetMmUnit(): any { return this.attMmTempo!.GetMmUnit(); }
  HasMmUnit(): boolean { return this.attMmTempo!.HasMmUnit(); }
  SetMmDots(value: any): void { this.attMmTempo!.SetMmDots(value); }
  GetMmDots(): any { return this.attMmTempo!.GetMmDots(); }
  HasMmDots(): boolean { return this.attMmTempo!.HasMmDots(); }

  // Interface forwardings
  SetPlace(value: any): void { this.GetTextDirInterface().SetPlace(value); }
  GetPlace(): any { return this.GetTextDirInterface().GetPlace(); }
  HasPlace(): boolean { return this.GetTextDirInterface().HasPlace(); }
  GetNumberOfLines(object?: unknown): number { return this.GetTextDirInterface().GetNumberOfLines((object ?? this) as never); }
  GetTstampStaves(measure: unknown, object: unknown): unknown[] { return this.GetTimePointInterface().GetTstampStaves(measure as never, object as never); }
  SetStartid(value: string): void { this.GetTimeSpanningInterface().SetStartid(value); }
  GetStartid(): string { return this.GetTimeSpanningInterface().GetStartid(); }
  HasStartid(): boolean { return this.GetTimeSpanningInterface().HasStartid(); }
  SetTstamp(value: number): void { this.GetTimeSpanningInterface().SetTstamp(value); }
  GetTstamp(): number { return this.GetTimeSpanningInterface().GetTstamp(); }
  HasTstamp(): boolean { return this.GetTimeSpanningInterface().HasTstamp(); }
  SetStaff(v: number[]): void { this.GetTimeSpanningInterface().SetStaff(v); }
  GetStaff(): number[] { return this.GetTimeSpanningInterface().GetStaff(); }
  HasStaff(): boolean { return this.GetTimeSpanningInterface().HasStaff(); }
  // C++ Tempo : TimeSpanningInterface — complete forwarder chain.
  SetTstamp2(v: [number, number]): void { this.GetTimeSpanningInterface().SetTstamp2(v as never); }
  GetTstamp2(): unknown { return this.GetTimeSpanningInterface().GetTstamp2(); }
  HasTstamp2(): boolean { return this.GetTimeSpanningInterface().HasTstamp2(); }
  HasStart(): boolean { return this.GetTimeSpanningInterface().HasStart(); }
  HasStartAndEnd(): boolean { return this.GetTimeSpanningInterface().HasStartAndEnd(); }

  override Accept(functor: any): FunctorCode { return functor.VisitTempo(this); }
  AcceptConst(functor: any): FunctorCode { return functor.VisitTempo(this); }
  override AcceptEnd(functor: any): FunctorCode { return functor.VisitTempoEnd(this); }
  AcceptEndConst(functor: any): FunctorCode { return functor.VisitTempoEnd(this); }

  override Clone(): Tempo {
    const clone = new Tempo();
    clone.AssignFrom(this);
    clone.GetTextDirInterface().SetPlace(this.GetTextDirInterface().GetPlace());
    clone.GetTimeSpanningInterface().SetPart(this.GetTimeSpanningInterface().GetPart());
    clone.GetTimeSpanningInterface().SetStaff(this.GetTimeSpanningInterface().GetStaff());
    clone.GetTimeSpanningInterface().SetStartid(this.GetTimeSpanningInterface().GetStartid());
    clone.GetTimeSpanningInterface().SetTstamp(this.GetTimeSpanningInterface().GetTstamp());
    clone.GetTimeSpanningInterface().SetEndid(this.GetTimeSpanningInterface().GetEndid());
    clone.GetTimeSpanningInterface().SetTstamp2(this.GetTimeSpanningInterface().GetTstamp2());
    clone.SetExtender(this.GetExtender());
    clone.SetLang(this.GetLang());
    clone.SetTranslit(this.GetTranslit());
    clone.SetMidiBpm(this.GetMidiBpm());
    clone.SetMidiMspb(this.GetMidiMspb());
    clone.SetMm(this.GetMm());
    clone.SetMmUnit(this.GetMmUnit());
    clone.SetMmDots(this.GetMmDots());
    return clone;
  }

  /** Exact translation of Tempo::CalcTempo(const AttMmTempo *). */
  static CalcTempo(attMmTempo: TempoMmTempoLike | { GetMm(): any; HasMmUnit(): boolean; GetMmUnit(): any; HasMmDots(): boolean; GetMmDots(): any }): number {
    let tempo = MIDI_TEMPO;

    const mm = attMmTempo.GetMm();
    let mmUnit = 4;

    if (attMmTempo.HasMmUnit() && attMmTempo.GetMmUnit() > DURATION_breve) {
      mmUnit = Math.pow(2, Math.trunc(attMmTempo.GetMmUnit()) - 2);
    }

    if (attMmTempo.HasMmDots()) {
      let dotsUnit = 0.0;
      for (let d = 0; d < attMmTempo.GetMmDots(); d++) {
        dotsUnit += mmUnit / 4.0 / Math.pow(2, d);
      }
      mmUnit -= dotsUnit;
    }

    if (mmUnit > 0) tempo = mm * 4.0 / mmUnit;
    return tempo;
  }
}

ObjectFactory.GetInstance().Register('tempo', ClassId.TEMPO, () => new Tempo());
