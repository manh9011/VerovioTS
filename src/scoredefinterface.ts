import { InterfaceId } from './vrvdef.js';
import { Interface } from './interface.js';
import {
  InstBarring,
  InstDurationDefault,
  InstLyricStyle,
  InstMeasureNumbers,
  InstMmTempo,
  InstMultinumMeasures,
  InstOctaveDefault,
  InstSpacing,
  InstSystems,
} from './atts_shared.js';
import { InstMidiTempo } from './atts_midi.js';
import { InstPianoPedals } from './atts_cmn.js';

/**
 * Pure TypeScript translation of Verovio's ScoreDefInterface.
 *
 * The C++ class uses multiple inheritance from generated libMEI attribute
 * classes. Until those attribute classes are migrated, their reset contract
 * is represented explicitly by typed local mocks rather than `any`.
 */
export class ScoreDefInterface extends Interface {
  private readonly barring = new InstBarring();
  private readonly durationDefault = new InstDurationDefault();
  private readonly lyricStyle = new InstLyricStyle();
  private readonly measureNumbers = new InstMeasureNumbers();
  private readonly midiTempo = new InstMidiTempo();
  private readonly mmTempo = new InstMmTempo();
  private readonly multinumMeasures = new InstMultinumMeasures();
  private readonly octaveDefault = new InstOctaveDefault();
  private readonly pianoPedals = new InstPianoPedals();
  private readonly spacing = new InstSpacing();
  private readonly systems = new InstSystems();

  public constructor() {
    super();
    this.RegisterInterfaceAttClass(100);
    this.RegisterInterfaceAttClass(126);
    this.RegisterInterfaceAttClass(153);
    this.RegisterInterfaceAttClass(154);
    this.RegisterInterfaceAttClass(80);
    this.RegisterInterfaceAttClass(165);
    this.RegisterInterfaceAttClass(166);
    this.RegisterInterfaceAttClass(173);
    this.RegisterInterfaceAttClass(32);
    this.RegisterInterfaceAttClass(199);
    this.RegisterInterfaceAttClass(212);
    this.Reset();
  }

  public override Reset(): void {
    this.barring.ResetBarring();
    this.durationDefault.ResetDurationDefault();
    this.lyricStyle.ResetLyricStyle();
    this.measureNumbers.ResetMeasureNumbers();
    this.midiTempo.ResetMidiTempo();
    this.mmTempo.ResetMmTempo();
    this.multinumMeasures.ResetMultinumMeasures();
    this.octaveDefault.ResetOctaveDefault();
    this.pianoPedals.ResetPianoPedals();
    this.spacing.ResetSpacing();
    this.systems.ResetSystems();
  }

  // AttBarring forwarding surface (CopyAll needs Get/Set pairs).
  public HasBarLen(): boolean { return this.barring.HasBarLen(); }
  public GetBarLen(): any { return this.barring.GetBarLen(); }
  public SetBarLen(v: any): void { this.barring.SetBarLen(v); }
  public HasBarMethod(): boolean { return this.barring.HasBarMethod(); }
  public GetBarMethod(): any { return this.barring.GetBarMethod(); }
  public SetBarMethod(v: any): void { this.barring.SetBarMethod(v); }
  public HasBarPlace(): boolean { return this.barring.HasBarPlace(); }
  public GetBarPlace(): any { return this.barring.GetBarPlace(); }
  public SetBarPlace(v: any): void { this.barring.SetBarPlace(v); }
  // AttDurationDefault forwarding surface.
  public HasDurDefault(): boolean { return this.durationDefault.HasDurDefault(); }
  public GetDurDefault(): any { return this.durationDefault.GetDurDefault(); }
  public SetDurDefault(v: any): void { this.durationDefault.SetDurDefault(v); }
  public HasNumDefault(): boolean { return this.durationDefault.HasNumDefault(); }
  public GetNumDefault(): any { return this.durationDefault.GetNumDefault(); }
  public SetNumDefault(v: any): void { this.durationDefault.SetNumDefault(v); }
  public HasNumbaseDefault(): boolean { return this.durationDefault.HasNumbaseDefault(); }
  public GetNumbaseDefault(): any { return this.durationDefault.GetNumbaseDefault(); }
  public SetNumbaseDefault(v: any): void { this.durationDefault.SetNumbaseDefault(v); }
  // AttLyricStyle forwarding surface.
  public HasLyricAlign(): boolean { return this.lyricStyle.HasLyricAlign(); }
  public GetLyricAlign(): any { return this.lyricStyle.GetLyricAlign(); }
  public SetLyricAlign(v: any): void { this.lyricStyle.SetLyricAlign(v); }
  public HasLyricFam(): boolean { return this.lyricStyle.HasLyricFam(); }
  public GetLyricFam(): any { return this.lyricStyle.GetLyricFam(); }
  public SetLyricFam(v: any): void { this.lyricStyle.SetLyricFam(v); }
  public HasLyricName(): boolean { return this.lyricStyle.HasLyricName(); }
  public GetLyricName(): any { return this.lyricStyle.GetLyricName(); }
  public SetLyricName(v: any): void { this.lyricStyle.SetLyricName(v); }
  public HasLyricSize(): boolean { return this.lyricStyle.HasLyricSize(); }
  public GetLyricSize(): any { return this.lyricStyle.GetLyricSize(); }
  public SetLyricSize(v: any): void { this.lyricStyle.SetLyricSize(v); }
  public HasLyricStyle(): boolean { return this.lyricStyle.HasLyricStyle(); }
  public GetLyricStyle(): any { return this.lyricStyle.GetLyricStyle(); }
  public SetLyricStyle(v: any): void { this.lyricStyle.SetLyricStyle(v); }
  public HasLyricWeight(): boolean { return this.lyricStyle.HasLyricWeight(); }
  public GetLyricWeight(): any { return this.lyricStyle.GetLyricWeight(); }
  public SetLyricWeight(v: any): void { this.lyricStyle.SetLyricWeight(v); }
  // AttMeasureNumbers forwarding surface.
  public HasMnumVisible(): boolean { return this.measureNumbers.HasMnumVisible(); }
  public GetMnumVisible(): any { return this.measureNumbers.GetMnumVisible(); }
  public SetMnumVisible(v: any): void { this.measureNumbers.SetMnumVisible(v); }
  // AttMidiTempo forwarding surface.
  public HasMidiBpm(): boolean { return this.midiTempo.HasMidiBpm(); }
  public GetMidiBpm(): any { return this.midiTempo.GetMidiBpm(); }
  public SetMidiBpm(v: any): void { this.midiTempo.SetMidiBpm(v); }
  public HasMidiMspb(): boolean { return this.midiTempo.HasMidiMspb(); }
  public GetMidiMspb(): any { return this.midiTempo.GetMidiMspb(); }
  public SetMidiMspb(v: any): void { this.midiTempo.SetMidiMspb(v); }
  // AttMmTempo forwarding surface.
  public HasMm(): boolean { return this.mmTempo.HasMm(); }
  public GetMm(): any { return this.mmTempo.GetMm(); }
  public SetMm(v: any): void { this.mmTempo.SetMm(v); }
  public HasMmUnit(): boolean { return this.mmTempo.HasMmUnit(); }
  public GetMmUnit(): any { return this.mmTempo.GetMmUnit(); }
  public SetMmUnit(v: any): void { this.mmTempo.SetMmUnit(v); }
  public HasMmDots(): boolean { return this.mmTempo.HasMmDots(); }
  public GetMmDots(): any { return this.mmTempo.GetMmDots(); }
  public SetMmDots(v: any): void { this.mmTempo.SetMmDots(v); }
  // AttMultinumMeasures forwarding surface.
  public HasMultiNumber(): boolean { return this.multinumMeasures.HasMultiNumber(); }
  public GetMultiNumber(): any { return this.multinumMeasures.GetMultiNumber(); }
  public SetMultiNumber(v: any): void { this.multinumMeasures.SetMultiNumber(v); }
  // AttOctaveDefault forwarding surface.
  public HasOctDefault(): boolean { return this.octaveDefault.HasOctDefault(); }
  public GetOctDefault(): any { return this.octaveDefault.GetOctDefault(); }
  public SetOctDefault(v: any): void { this.octaveDefault.SetOctDefault(v); }
  // AttPianoPedals forwarding surface.
  public HasPedalStyle(): boolean { return this.pianoPedals.HasPedalStyle(); }
  public GetPedalStyle(): any { return this.pianoPedals.GetPedalStyle(); }
  public SetPedalStyle(v: any): void { this.pianoPedals.SetPedalStyle(v); }
  // AttSpacing forwarding surface (C++ multiple inheritance from the
  // generated libMEI attribute class; spacing.state is now the real
  // canonical implementation instead of a reset-only mock).
  public HasSpacingPackexp(): boolean { return this.spacing.HasSpacingPackexp(); }
  public GetSpacingPackexp(): any { return this.spacing.GetSpacingPackexp(); }
  public SetSpacingPackexp(v: any): void { this.spacing.SetSpacingPackexp(v); }
  public HasSpacingPackfact(): boolean { return this.spacing.HasSpacingPackfact(); }
  public GetSpacingPackfact(): any { return this.spacing.GetSpacingPackfact(); }
  public SetSpacingPackfact(v: any): void { this.spacing.SetSpacingPackfact(v); }
  public HasSpacingStaff(): boolean { return this.spacing.HasSpacingStaff(); }
  public GetSpacingStaff(): any { return this.spacing.GetSpacingStaff(); }
  public SetSpacingStaff(v: any): void { this.spacing.SetSpacingStaff(v); }
  public HasSpacingSystem(): boolean { return this.spacing.HasSpacingSystem(); }
  public GetSpacingSystem(): { GetType(): number; GetPx(): number; GetVu(): number } {
    return this.spacing.GetSpacingSystem();
  }
  public SetSpacingSystem(value: unknown): void { this.spacing.SetSpacingSystem(value); }
  public ResetSpacing(): void { this.spacing.ResetSpacing(); }
  // AttSystems forwarding surface.
  public HasSystemLeftline(): boolean { return this.systems.HasSystemLeftline(); }
  public GetSystemLeftline(): any { return this.systems.GetSystemLeftline(); }
  public SetSystemLeftline(v: any): void { this.systems.SetSystemLeftline(v); }
  public HasSystemLeftmar(): boolean { return this.systems.HasSystemLeftmar(); }
  public GetSystemLeftmar(): any { return this.systems.GetSystemLeftmar(); }
  public SetSystemLeftmar(v: any): void { this.systems.SetSystemLeftmar(v); }
  public HasSystemRightmar(): boolean { return this.systems.HasSystemRightmar(); }
  public GetSystemRightmar(): any { return this.systems.GetSystemRightmar(); }
  public SetSystemRightmar(v: any): void { this.systems.SetSystemRightmar(v); }
  public HasSystemTopmar(): boolean { return this.systems.HasSystemTopmar(); }
  public GetSystemTopmar(): any { return this.systems.GetSystemTopmar(); }
  public SetSystemTopmar(v: any): void { this.systems.SetSystemTopmar(v); }

  public override IsInterface(): InterfaceId {
    return InterfaceId.INTERFACE_SCOREDEF;
  }
}
