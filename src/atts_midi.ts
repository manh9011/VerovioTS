/**
 * Pure TypeScript translation of libmei/dist/atts_midi.cpp.
 * Preserves generated libmei constructor/reset, XML read/write order,
 * converter dispatch, defaults/sentinels and presence semantics.
 */

import { Att } from './att';
import { xml_node } from './pugixml';
import { data_MIDIVALUE_NAME, data_MIDIVALUE_PAN } from './libmei-att';

const MEI_UNSET = -2147483647;
const MIDINAMES_NONE = 0;

type Midichannel = number;
type Midinames = number;
type Midimspb = number;
type Midivalue = number;
type Percent = number;
type PercentLimited = number;

export abstract class AttChannelized extends Att {
  protected m_midiChannel: Midichannel = -1;
  protected m_midiDuty: PercentLimited = -1.0;
  protected m_midiPort: data_MIDIVALUE_NAME = new data_MIDIVALUE_NAME();
  protected m_midiTrack = MEI_UNSET;

  constructor() { super(); this.ResetChannelized(); }

  ResetChannelized(): void {
    this.m_midiChannel = -1;
    this.m_midiDuty = -1.0;
    this.m_midiPort = new data_MIDIVALUE_NAME();
    this.m_midiTrack = MEI_UNSET;
  }

  ReadChannelized(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const midiChannel = element.attribute('midi.channel');
    if (!midiChannel.empty()) {
      this.SetMidiChannel(this.StrToMidichannel(midiChannel.value()));
      if (removeAttr) element.remove_attribute('midi.channel');
      hasAttribute = true;
    }
    const midiDuty = element.attribute('midi.duty');
    if (!midiDuty.empty()) {
      this.SetMidiDuty(this.StrToPercentLimited(midiDuty.value()));
      if (removeAttr) element.remove_attribute('midi.duty');
      hasAttribute = true;
    }
    const midiPort = element.attribute('midi.port');
    if (!midiPort.empty()) {
      this.SetMidiPort(this.StrToMidivalueName(midiPort.value()));
      if (removeAttr) element.remove_attribute('midi.port');
      hasAttribute = true;
    }
    const midiTrack = element.attribute('midi.track');
    if (!midiTrack.empty()) {
      this.SetMidiTrack(this.StrToInt(midiTrack.value()));
      if (removeAttr) element.remove_attribute('midi.track');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteChannelized(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMidiChannel()) {
      element.append_attribute('midi.channel').set_value(this.MidichannelToStr(this.GetMidiChannel()));
      wroteAttribute = true;
    }
    if (this.HasMidiDuty()) {
      element.append_attribute('midi.duty').set_value(this.PercentLimitedToStr(this.GetMidiDuty()));
      wroteAttribute = true;
    }
    if (this.HasMidiPort()) {
      element.append_attribute('midi.port').set_value(this.MidivalueNameToStr(this.GetMidiPort()));
      wroteAttribute = true;
    }
    if (this.HasMidiTrack()) {
      element.append_attribute('midi.track').set_value(this.IntToStr(this.GetMidiTrack()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetMidiChannel(value: Midichannel): void { this.m_midiChannel = value; }
  GetMidiChannel(): Midichannel { return this.m_midiChannel; }
  HasMidiChannel(): boolean { return this.m_midiChannel !== -1; }
  SetMidiDuty(value: PercentLimited): void { this.m_midiDuty = value; }
  GetMidiDuty(): PercentLimited { return this.m_midiDuty; }
  HasMidiDuty(): boolean { return this.m_midiDuty !== -1.0; }
  SetMidiPort(value: data_MIDIVALUE_NAME): void { this.m_midiPort = value; }
  GetMidiPort(): data_MIDIVALUE_NAME { return this.m_midiPort; }
  HasMidiPort(): boolean { return this.m_midiPort !== undefined && this.m_midiPort.HasValue(); }
  SetMidiTrack(value: number): void { this.m_midiTrack = value; }
  GetMidiTrack(): number { return this.m_midiTrack; }
  HasMidiTrack(): boolean { return this.m_midiTrack !== MEI_UNSET; }
}
export class InstChannelized extends AttChannelized {}

export abstract class AttInstrumentIdent extends Att {
  protected m_instr = '';
  constructor() { super(); this.ResetInstrumentIdent(); }
  ResetInstrumentIdent(): void { this.m_instr = ''; }
  ReadInstrumentIdent(element: xml_node, removeAttr = true): boolean {
    const attr = element.attribute('instr');
    if (attr.empty()) return false;
    this.SetInstr(this.StrToStr(attr.value()));
    if (removeAttr) element.remove_attribute('instr');
    return true;
  }
  WriteInstrumentIdent(element: xml_node): boolean {
    if (!this.HasInstr()) return false;
    element.append_attribute('instr').set_value(this.StrToStr(this.GetInstr()));
    return true;
  }
  SetInstr(value: string): void { this.m_instr = value; }
  GetInstr(): string { return this.m_instr; }
  HasInstr(): boolean { return this.m_instr !== ''; }
}
export class InstInstrumentIdent extends AttInstrumentIdent {}

export abstract class AttMidiInstrument extends Att {
  protected m_midiInstrnum: Midivalue = -1;
  protected m_midiInstrname: Midinames = MIDINAMES_NONE;
  protected m_midiPan: data_MIDIVALUE_PAN = new data_MIDIVALUE_PAN();
  protected m_midiPatchname = '';
  protected m_midiPatchnum: Midivalue = -1;
  protected m_midiVolume: Percent = -1.0;

  constructor() { super(); this.ResetMidiInstrument(); }
  ResetMidiInstrument(): void {
    this.m_midiInstrnum = -1;
    this.m_midiInstrname = MIDINAMES_NONE;
    this.m_midiPan = new data_MIDIVALUE_PAN();
    this.m_midiPatchname = '';
    this.m_midiPatchnum = -1;
    this.m_midiVolume = -1.0;
  }
  ReadMidiInstrument(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const instrnum = element.attribute('midi.instrnum');
    if (!instrnum.empty()) { this.SetMidiInstrnum(this.StrToMidivalue(instrnum.value())); if (removeAttr) element.remove_attribute('midi.instrnum'); hasAttribute = true; }
    const instrname = element.attribute('midi.instrname');
    if (!instrname.empty()) { this.SetMidiInstrname(this.StrToMidinames(instrname.value())); if (removeAttr) element.remove_attribute('midi.instrname'); hasAttribute = true; }
    const pan = element.attribute('midi.pan');
    if (!pan.empty()) { this.SetMidiPan(this.StrToMidivaluePan(pan.value())); if (removeAttr) element.remove_attribute('midi.pan'); hasAttribute = true; }
    const patchname = element.attribute('midi.patchname');
    if (!patchname.empty()) { this.SetMidiPatchname(this.StrToStr(patchname.value())); if (removeAttr) element.remove_attribute('midi.patchname'); hasAttribute = true; }
    const patchnum = element.attribute('midi.patchnum');
    if (!patchnum.empty()) { this.SetMidiPatchnum(this.StrToMidivalue(patchnum.value())); if (removeAttr) element.remove_attribute('midi.patchnum'); hasAttribute = true; }
    const volume = element.attribute('midi.volume');
    if (!volume.empty()) { this.SetMidiVolume(this.StrToPercent(volume.value())); if (removeAttr) element.remove_attribute('midi.volume'); hasAttribute = true; }
    return hasAttribute;
  }
  WriteMidiInstrument(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMidiInstrnum()) { element.append_attribute('midi.instrnum').set_value(this.MidivalueToStr(this.GetMidiInstrnum())); wroteAttribute = true; }
    if (this.HasMidiInstrname()) { element.append_attribute('midi.instrname').set_value(this.MidinamesToStr(this.GetMidiInstrname())); wroteAttribute = true; }
    if (this.HasMidiPan()) { element.append_attribute('midi.pan').set_value(this.MidivaluePanToStr(this.GetMidiPan())); wroteAttribute = true; }
    if (this.HasMidiPatchname()) { element.append_attribute('midi.patchname').set_value(this.StrToStr(this.GetMidiPatchname())); wroteAttribute = true; }
    if (this.HasMidiPatchnum()) { element.append_attribute('midi.patchnum').set_value(this.MidivalueToStr(this.GetMidiPatchnum())); wroteAttribute = true; }
    if (this.HasMidiVolume()) { element.append_attribute('midi.volume').set_value(this.PercentToStr(this.GetMidiVolume())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetMidiInstrnum(value: Midivalue): void { this.m_midiInstrnum = value; }
  GetMidiInstrnum(): Midivalue { return this.m_midiInstrnum; }
  HasMidiInstrnum(): boolean { return this.m_midiInstrnum !== -1; }
  SetMidiInstrname(value: Midinames): void { this.m_midiInstrname = value; }
  GetMidiInstrname(): Midinames { return this.m_midiInstrname; }
  HasMidiInstrname(): boolean { return this.m_midiInstrname !== MIDINAMES_NONE; }
  SetMidiPan(value: data_MIDIVALUE_PAN): void { this.m_midiPan = value; }
  GetMidiPan(): data_MIDIVALUE_PAN { return this.m_midiPan; }
  HasMidiPan(): boolean { return this.m_midiPan.HasValue(); }
  SetMidiPatchname(value: string): void { this.m_midiPatchname = value; }
  GetMidiPatchname(): string { return this.m_midiPatchname; }
  HasMidiPatchname(): boolean { return this.m_midiPatchname !== ''; }
  SetMidiPatchnum(value: Midivalue): void { this.m_midiPatchnum = value; }
  GetMidiPatchnum(): Midivalue { return this.m_midiPatchnum; }
  HasMidiPatchnum(): boolean { return this.m_midiPatchnum !== -1; }
  SetMidiVolume(value: Percent): void { this.m_midiVolume = value; }
  GetMidiVolume(): Percent { return this.m_midiVolume; }
  HasMidiVolume(): boolean { return this.m_midiVolume !== -1.0; }
}
export class InstMidiInstrument extends AttMidiInstrument {}

export abstract class AttMidiNumber extends Att {
  protected m_num: Midivalue = -1;
  constructor() { super(); this.ResetMidiNumber(); }
  ResetMidiNumber(): void { this.m_num = -1; }
  ReadMidiNumber(element: xml_node, removeAttr = true): boolean {
    const attr = element.attribute('num');
    if (attr.empty()) return false;
    this.SetNum(this.StrToMidivalue(attr.value()));
    if (removeAttr) element.remove_attribute('num');
    return true;
  }
  WriteMidiNumber(element: xml_node): boolean {
    if (!this.HasNum()) return false;
    element.append_attribute('num').set_value(this.MidivalueToStr(this.GetNum()));
    return true;
  }
  SetNum(value: Midivalue): void { this.m_num = value; }
  GetNum(): Midivalue { return this.m_num; }
  HasNum(): boolean { return this.m_num !== -1; }
}
export class InstMidiNumber extends AttMidiNumber {}

export abstract class AttMidiTempo extends Att {
  protected m_midiBpm = 0.0;
  protected m_midiMspb: Midimspb = -1;
  constructor() { super(); this.ResetMidiTempo(); }
  ResetMidiTempo(): void { this.m_midiBpm = 0.0; this.m_midiMspb = -1; }
  ReadMidiTempo(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const bpm = element.attribute('midi.bpm');
    if (!bpm.empty()) { this.SetMidiBpm(this.StrToDbl(bpm.value())); if (removeAttr) element.remove_attribute('midi.bpm'); hasAttribute = true; }
    const mspb = element.attribute('midi.mspb');
    if (!mspb.empty()) { this.SetMidiMspb(this.StrToMidimspb(mspb.value())); if (removeAttr) element.remove_attribute('midi.mspb'); hasAttribute = true; }
    return hasAttribute;
  }
  WriteMidiTempo(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMidiBpm()) { element.append_attribute('midi.bpm').set_value(this.DblToStr(this.GetMidiBpm())); wroteAttribute = true; }
    if (this.HasMidiMspb()) { element.append_attribute('midi.mspb').set_value(this.MidimspbToStr(this.GetMidiMspb())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetMidiBpm(value: number): void { this.m_midiBpm = value; }
  GetMidiBpm(): number { return this.m_midiBpm; }
  HasMidiBpm(): boolean { return this.m_midiBpm !== 0.0; }
  SetMidiMspb(value: Midimspb): void { this.m_midiMspb = value; }
  GetMidiMspb(): Midimspb { return this.m_midiMspb; }
  HasMidiMspb(): boolean { return this.m_midiMspb !== -1; }
}
export class InstMidiTempo extends AttMidiTempo {}

export abstract class AttMidiValue extends Att {
  protected m_val: Midivalue = -1;
  constructor() { super(); this.ResetMidiValue(); }
  ResetMidiValue(): void { this.m_val = -1; }
  ReadMidiValue(element: xml_node, removeAttr = true): boolean { const a=element.attribute('val'); if(a.empty()) return false; this.SetVal(this.StrToMidivalue(a.value())); if(removeAttr)element.remove_attribute('val'); return true; }
  WriteMidiValue(element: xml_node): boolean { if(!this.HasVal())return false;element.append_attribute('val').set_value(this.MidivalueToStr(this.GetVal()));return true; }
  SetVal(value: Midivalue): void { this.m_val = value; }
  GetVal(): Midivalue { return this.m_val; }
  HasVal(): boolean { return this.m_val !== -1; }
}
export class InstMidiValue extends AttMidiValue {}

export abstract class AttMidiValue2 extends Att {
  protected m_val2: Midivalue = -1;
  constructor() { super(); this.ResetMidiValue2(); }
  ResetMidiValue2(): void { this.m_val2 = -1; }
  ReadMidiValue2(element: xml_node, removeAttr = true): boolean { const a=element.attribute('val2'); if(a.empty())return false; this.SetVal2(this.StrToMidivalue(a.value())); if(removeAttr)element.remove_attribute('val2'); return true; }
  WriteMidiValue2(element: xml_node): boolean { if(!this.HasVal2())return false;element.append_attribute('val2').set_value(this.MidivalueToStr(this.GetVal2()));return true; }
  SetVal2(value: Midivalue): void { this.m_val2 = value; }
  GetVal2(): Midivalue { return this.m_val2; }
  HasVal2(): boolean { return this.m_val2 !== -1; }
}
export class InstMidiValue2 extends AttMidiValue2 {}

export abstract class AttMidiVelocity extends Att {
  protected m_vel: Midivalue = -1;
  constructor() { super(); this.ResetMidiVelocity(); }
  ResetMidiVelocity(): void { this.m_vel = -1; }
  ReadMidiVelocity(element: xml_node, removeAttr = true): boolean { const a=element.attribute('vel'); if(a.empty())return false; this.SetVel(this.StrToMidivalue(a.value())); if(removeAttr)element.remove_attribute('vel'); return true; }
  WriteMidiVelocity(element: xml_node): boolean { if(!this.HasVel())return false;element.append_attribute('vel').set_value(this.MidivalueToStr(this.GetVel()));return true; }
  SetVel(value: Midivalue): void { this.m_vel = value; }
  GetVel(): Midivalue { return this.m_vel; }
  HasVel(): boolean { return this.m_vel !== -1; }
}
export class InstMidiVelocity extends AttMidiVelocity {}

export abstract class AttTimeBase extends Att {
  protected m_ppq = MEI_UNSET;
  constructor() { super(); this.ResetTimeBase(); }
  ResetTimeBase(): void { this.m_ppq = MEI_UNSET; }
  ReadTimeBase(element: xml_node, removeAttr = true): boolean { const a=element.attribute('ppq'); if(a.empty())return false; this.SetPpq(this.StrToInt(a.value())); if(removeAttr)element.remove_attribute('ppq'); return true; }
  WriteTimeBase(element: xml_node): boolean { if(!this.HasPpq())return false;element.append_attribute('ppq').set_value(this.IntToStr(this.GetPpq()));return true; }
  SetPpq(value:number):void{this.m_ppq=value;} GetPpq():number{return this.m_ppq;} HasPpq():boolean{return this.m_ppq!==MEI_UNSET;}
}
export class InstTimeBase extends AttTimeBase {}
