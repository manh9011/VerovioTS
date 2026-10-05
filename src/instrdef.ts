import { ObjectFactory, VrvObject } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { MEI_UNSET } from './vrv.js';
import { Functor, ConstFunctor } from './functor.js';

export class ChannelizedAttributes {
  private m_midiChannel = -1;
  private m_midiDuty = -1.0;
  private m_midiPort = 'none';
  private m_midiTrack = MEI_UNSET;
  ResetChannelized(): void { this.m_midiChannel = -1; this.m_midiDuty = -1.0; this.m_midiPort = 'none'; this.m_midiTrack = MEI_UNSET; }
  SetMidiChannel(v: number): void { this.m_midiChannel = v; }
  GetMidiChannel(): number { return this.m_midiChannel; }
  HasMidiChannel(): boolean { return this.m_midiChannel !== -1; }
  SetMidiDuty(v: number): void { this.m_midiDuty = v; }
  GetMidiDuty(): number { return this.m_midiDuty; }
  HasMidiDuty(): boolean { return this.m_midiDuty !== -1.0; }
  SetMidiPort(v: string): void { this.m_midiPort = v; }
  GetMidiPort(): string { return this.m_midiPort; }
  // ponytail: C++ HasMidiPort compares a data_MIDIVALUE_NAME; this placeholder
  // uses the sentinel 'none'. Add a real data class if a testcase needs midi.port.
  HasMidiPort(): boolean { return this.m_midiPort !== 'none'; }
  SetMidiTrack(v: number): void { this.m_midiTrack = v; }
  GetMidiTrack(): number { return this.m_midiTrack; }
  HasMidiTrack(): boolean { return this.m_midiTrack !== MEI_UNSET; }
}

export class LabelledAttributes {
  private m_label = '';
  ResetLabelled(): void { this.m_label = ''; }
  SetLabel(v: string): void { this.m_label = v; }
  GetLabel(): string { return this.m_label; }
  HasLabel(): boolean { return this.m_label !== ''; }
}

export class MidiInstrumentAttributes {
  private m_midiInstrnum = -1;
  // C++ data_MIDINAMES unset = MIDINAMES_NONE, written as '' by MidinamesToStr;
  // keep '' (not 'none') so HasMidiInstrname matches C++ (NONE -> attribute omitted).
  private m_midiInstrname = '';
  private m_midiPan = 'pan';
  private m_midiPatchname = '';
  private m_midiPatchnum = -1;
  private m_midiVolume = -1.0;
  ResetMidiInstrument(): void { this.m_midiInstrnum=-1; this.m_midiInstrname=''; this.m_midiPan='pan'; this.m_midiPatchname=''; this.m_midiPatchnum=-1; this.m_midiVolume=-1.0; }
  SetMidiInstrnum(v:number):void{this.m_midiInstrnum=v;} GetMidiInstrnum():number{return this.m_midiInstrnum;} HasMidiInstrnum():boolean{return this.m_midiInstrnum !== -1;}
  SetMidiInstrname(v:string):void{this.m_midiInstrname=v;} GetMidiInstrname():string{return this.m_midiInstrname;} HasMidiInstrname():boolean{return this.m_midiInstrname !== '' && this.m_midiInstrname !== 'none';}
  SetMidiPan(v:string):void{this.m_midiPan=v;} GetMidiPan():string{return this.m_midiPan;} HasMidiPan():boolean{return this.m_midiPan !== 'pan';}
  SetMidiPatchname(v:string):void{this.m_midiPatchname=v;} GetMidiPatchname():string{return this.m_midiPatchname;} HasMidiPatchname():boolean{return this.m_midiPatchname !== '';}
  SetMidiPatchnum(v:number):void{this.m_midiPatchnum=v;} GetMidiPatchnum():number{return this.m_midiPatchnum;} HasMidiPatchnum():boolean{return this.m_midiPatchnum !== -1;}
  SetMidiVolume(v:number):void{this.m_midiVolume=v;} GetMidiVolume():number{return this.m_midiVolume;} HasMidiVolume():boolean{return this.m_midiVolume !== -1.0;}
}

export class NNumberLikeAttributes {
  private m_n = '';
  ResetNNumberLike(): void { this.m_n = ''; }
  SetN(v: string): void { this.m_n = v; }
  GetN(): string { return this.m_n; }
  HasN(): boolean { return this.m_n !== ''; }
}

const ATT_CHANNELIZED=76, ATT_LABELLED=145, ATT_MIDIINSTRUMENT=78, ATT_NNUMBERLIKE=168;

export class InstrDef extends VrvObject {
  private channelized: ChannelizedAttributes | undefined;
  private labelled: LabelledAttributes | undefined;
  private midiInstrument: MidiInstrumentAttributes | undefined;
  private nNumberLike: NNumberLikeAttributes | undefined;

  constructor() {
    super(ClassId.INSTRDEF);
    this.RegisterAttClass(ATT_CHANNELIZED); this.RegisterAttClass(ATT_LABELLED); this.RegisterAttClass(ATT_MIDIINSTRUMENT); this.RegisterAttClass(ATT_NNUMBERLIKE);
    this.ResetInstrDefAttributes();
  }
  override Clone(): VrvObject { const c=new InstrDef(); c.AssignFrom(this); return c; }
  override Reset(): void { super.Reset(); this.ResetInstrDefAttributes(); }
  private ResetInstrDefAttributes(): void {
    this.channelized ??= new ChannelizedAttributes(); this.labelled ??= new LabelledAttributes(); this.midiInstrument ??= new MidiInstrumentAttributes(); this.nNumberLike ??= new NNumberLikeAttributes();
    this.channelized.ResetChannelized(); this.labelled.ResetLabelled(); this.midiInstrument.ResetMidiInstrument(); this.nNumberLike.ResetNNumberLike();
  }
  override GetClassName(): string { return 'instrDef'; }
  override Accept(functor: Functor): FunctorCode { return visitor(functor, 'VisitInstrDef', this); }
  AcceptConst(functor: ConstFunctor): FunctorCode { return (functor as any).VisitInstrDef(this); }
  AcceptEnd(functor: Functor): FunctorCode { return visitor(functor, 'VisitInstrDefEnd', this); }
  AcceptEndConst(functor: ConstFunctor): FunctorCode { return (functor as any).VisitInstrDefEnd(this); }
  ResetChannelized():void{this.channelized!.ResetChannelized();} SetMidiChannel(v:number):void{this.channelized!.SetMidiChannel(v);} GetMidiChannel():number{return this.channelized!.GetMidiChannel();}
  SetMidiDuty(v:number):void{this.channelized!.SetMidiDuty(v);} GetMidiDuty():number{return this.channelized!.GetMidiDuty();} SetMidiPort(v:string):void{this.channelized!.SetMidiPort(v);} GetMidiPort():string{return this.channelized!.GetMidiPort();} SetMidiTrack(v:number):void{this.channelized!.SetMidiTrack(v);} GetMidiTrack():number{return this.channelized!.GetMidiTrack();}
  ResetLabelled():void{this.labelled!.ResetLabelled();} SetLabel(v:string):void{this.labelled!.SetLabel(v);} GetLabel():string{return this.labelled!.GetLabel();} HasLabel():boolean{return this.labelled!.HasLabel();}
  ResetMidiInstrument():void{this.midiInstrument!.ResetMidiInstrument();} SetMidiInstrnum(v:number):void{this.midiInstrument!.SetMidiInstrnum(v);} GetMidiInstrnum():number{return this.midiInstrument!.GetMidiInstrnum();} SetMidiInstrname(v:string):void{this.midiInstrument!.SetMidiInstrname(v);} GetMidiInstrname():string{return this.midiInstrument!.GetMidiInstrname();} SetMidiPan(v:string):void{this.midiInstrument!.SetMidiPan(v);} GetMidiPan():string{return this.midiInstrument!.GetMidiPan();} SetMidiPatchname(v:string):void{this.midiInstrument!.SetMidiPatchname(v);} GetMidiPatchname():string{return this.midiInstrument!.GetMidiPatchname();} SetMidiPatchnum(v:number):void{this.midiInstrument!.SetMidiPatchnum(v);} GetMidiPatchnum():number{return this.midiInstrument!.GetMidiPatchnum();} SetMidiVolume(v:number):void{this.midiInstrument!.SetMidiVolume(v);} GetMidiVolume():number{return this.midiInstrument!.GetMidiVolume();}
  ResetNNumberLike():void{this.nNumberLike!.ResetNNumberLike();} SetN(v:string):void{this.nNumberLike!.SetN(v);} GetN():string{return this.nNumberLike!.GetN();} HasN():boolean{return this.nNumberLike!.HasN();}
  // Att-class Has* predicates (attmodule GetMidi / atts_midi Write* consumers);
  // forward to the composed att-class state exactly like the C++ mixin members.
  HasMidiChannel():boolean{return this.channelized!.HasMidiChannel();} HasMidiDuty():boolean{return this.channelized!.HasMidiDuty();} HasMidiPort():boolean{return this.channelized!.HasMidiPort();} HasMidiTrack():boolean{return this.channelized!.HasMidiTrack();}
  HasMidiInstrnum():boolean{return this.midiInstrument!.HasMidiInstrnum();} HasMidiInstrname():boolean{return this.midiInstrument!.HasMidiInstrname();} HasMidiPan():boolean{return this.midiInstrument!.HasMidiPan();} HasMidiPatchname():boolean{return this.midiInstrument!.HasMidiPatchname();} HasMidiPatchnum():boolean{return this.midiInstrument!.HasMidiPatchnum();} HasMidiVolume():boolean{return this.midiInstrument!.HasMidiVolume();}
}

ObjectFactory.GetInstance().Register('instrDef', ClassId.INSTRDEF, () => new InstrDef());

/** C++ FunctorInterface default forwarding helper (VisitInstrDef -> VisitObject). */
function visitor(functor: Functor, method: string, self: unknown): FunctorCode {
  const f = functor as unknown as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}
