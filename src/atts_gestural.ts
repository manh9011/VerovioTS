/** Pure TypeScript translation of libmei/dist/atts_gestural.cpp.
 * Generated-style attribute classes; XML/converter behavior mirrors the canonical C++ implementation.
 */
import { Att } from './att';
import { xml_node } from './pugixml';
import { data_ACCIDENTAL_GESTURAL, data_ARTICULATION_List, data_DEGREES, data_DURATION, data_MEASUREBEAT, data_OCTAVE, data_PITCHNAME, DURATION_NONE } from './libmei-att';

type noteGes_EXTREMIS = number;
export const noteGes_EXTREMIS_NONE = 0;
export const noteGes_EXTREMIS_highest = 1;
export const noteGes_EXTREMIS_lowest = 2;

const MEI_UNSET = -1;
const MEI_UNSET_OCT = -1;
const BOOLEAN_NONE = 0;

function attrExists(element: xml_node, name: string): boolean { return !element.attribute(name).empty(); }
function getAttr(element: xml_node, name: string): string { return element.attribute(name).value(); }
function setAttr(element: xml_node, name: string, value: string): void { element.append_attribute(name).set_value(value); }

export abstract class AttAccidentalGes extends Att {
  protected m_accidGes: data_ACCIDENTAL_GESTURAL = 0;

  constructor() { super(); this.ResetAccidentalGes(); }

  ResetAccidentalGes(): void {
    this.m_accidGes = 0;
  }

  ReadAccidentalGes(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'accid.ges')) { this.SetAccidGes(this.StrToAccidentalGestural(getAttr(element, 'accid.ges'))); if (removeAttr) element.remove_attribute('accid.ges'); hasAttribute = true; }
    return hasAttribute;
  }

  WriteAccidentalGes(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAccidGes()) { setAttr(element, 'accid.ges', this.AccidentalGesturalToStr(this.GetAccidGes())); wroteAttribute = true; }
    return wroteAttribute;
  }

  SetAccidGes(value: data_ACCIDENTAL_GESTURAL): void { this.m_accidGes = value; }
  GetAccidGes(): data_ACCIDENTAL_GESTURAL { return this.m_accidGes; }
  HasAccidGes(): boolean { return this.m_accidGes !== 0; }
}

export class InstAccidentalGes extends AttAccidentalGes {}

export abstract class AttArticulationGes extends Att {
  protected m_articGes: data_ARTICULATION_List = [];

  constructor() { super(); this.ResetArticulationGes(); }

  ResetArticulationGes(): void {
    this.m_articGes = [];
  }

  ReadArticulationGes(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'artic.ges')) { this.SetArticGes(this.StrToArticulationList(getAttr(element, 'artic.ges'))); if (removeAttr) element.remove_attribute('artic.ges'); hasAttribute = true; }
    return hasAttribute;
  }

  WriteArticulationGes(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasArticGes()) { setAttr(element, 'artic.ges', this.ArticulationListToStr(this.GetArticGes())); wroteAttribute = true; }
    return wroteAttribute;
  }

  SetArticGes(value: data_ARTICULATION_List): void { this.m_articGes = value; }
  GetArticGes(): data_ARTICULATION_List { return this.m_articGes; }
  HasArticGes(): boolean { return this.m_articGes.length !== 0; }
}

export class InstArticulationGes extends AttArticulationGes {}

export abstract class AttAttacking extends Att {
  protected m_attacca: number = BOOLEAN_NONE;

  constructor() { super(); this.ResetAttacking(); }

  ResetAttacking(): void {
    this.m_attacca = BOOLEAN_NONE;
  }

  ReadAttacking(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'attacca')) { this.SetAttacca(this.StrToBoolean(getAttr(element, 'attacca'))); if (removeAttr) element.remove_attribute('attacca'); hasAttribute = true; }
    return hasAttribute;
  }

  WriteAttacking(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAttacca()) { setAttr(element, 'attacca', this.BooleanToStr(this.GetAttacca())); wroteAttribute = true; }
    return wroteAttribute;
  }

  SetAttacca(value: number): void { this.m_attacca = value; }
  GetAttacca(): number { return this.m_attacca; }
  HasAttacca(): boolean { return this.m_attacca !== BOOLEAN_NONE; }
}

export class InstAttacking extends AttAttacking {}

export abstract class AttBendGes extends Att {
  protected m_amount: number = 0.0;

  constructor() { super(); this.ResetBendGes(); }

  ResetBendGes(): void {
    this.m_amount = 0.0;
  }

  ReadBendGes(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'amount')) { this.SetAmount(this.StrToDbl(getAttr(element, 'amount'))); if (removeAttr) element.remove_attribute('amount'); hasAttribute = true; }
    return hasAttribute;
  }

  WriteBendGes(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAmount()) { setAttr(element, 'amount', this.DblToStr(this.GetAmount())); wroteAttribute = true; }
    return wroteAttribute;
  }

  SetAmount(value: number): void { this.m_amount = value; }
  GetAmount(): number { return this.m_amount; }
  HasAmount(): boolean { return this.m_amount !== 0; }
}

export class InstBendGes extends AttBendGes {}

export abstract class AttDurationGes extends Att {
  protected m_durGes: data_DURATION = DURATION_NONE; protected m_dotsGes = MEI_UNSET; protected m_durMetrical = 0.0; protected m_durPpq = MEI_UNSET; protected m_durReal = 0.0; protected m_durRecip = '';
  constructor(){ super(); this.ResetDurationGes(); }
  ResetDurationGes():void{ this.m_durGes=DURATION_NONE; this.m_dotsGes=MEI_UNSET; this.m_durMetrical=0.0; this.m_durPpq=MEI_UNSET; this.m_durReal=0.0; this.m_durRecip=''; }
  ReadDurationGes(element:xml_node,removeAttr=true):boolean{ let hasAttribute=false; const defs:[[string,string,string],...any[]]=[['dur.ges','SetDurGes','this.StrToDuration'],['dots.ges','SetDotsGes','this.StrToInt'],['dur.metrical','SetDurMetrical','this.StrToDbl'],['dur.ppq','SetDurPpq','this.StrToInt'],['dur.real','SetDurReal','this.StrToDbl'],['dur.recip','SetDurRecip','this.StrToStr']]; for(const [attr,setter,conv] of defs as any){ if(attrExists(element,attr)){ (this as any)[setter]((this as any)[conv.replace(/^this\./,'')](getAttr(element,attr))); if(removeAttr)element.remove_attribute(attr); hasAttribute=true; }} return hasAttribute;}
  WriteDurationGes(element:xml_node):boolean{ let wrote=false; const defs:[[string,string,string,string],...any[]]=[['dur.ges','HasDurGes','GetDurGes','this.DurationToStr'],['dots.ges','HasDotsGes','GetDotsGes','this.IntToStr'],['dur.metrical','HasDurMetrical','GetDurMetrical','this.DblToStr'],['dur.ppq','HasDurPpq','GetDurPpq','this.IntToStr'],['dur.real','HasDurReal','GetDurReal','this.DblToStr'],['dur.recip','HasDurRecip','GetDurRecip','this.StrToStr']]; for(const [attr,has,get,conv] of defs as any){ if((this as any)[has]()) { setAttr(element,attr,(this as any)[conv.replace(/^this\./,'')]((this as any)[get]())); wrote=true; }} return wrote;}
  SetDurGes(v:data_DURATION):void{this.m_durGes=v;} GetDurGes():data_DURATION{return this.m_durGes;} HasDurGes():boolean{return this.m_durGes!==DURATION_NONE;}
  SetDotsGes(v:number):void{this.m_dotsGes=v;} GetDotsGes():number{return this.m_dotsGes;} HasDotsGes():boolean{return this.m_dotsGes!==MEI_UNSET;}
  SetDurMetrical(v:number):void{this.m_durMetrical=v;} GetDurMetrical():number{return this.m_durMetrical;} HasDurMetrical():boolean{return this.m_durMetrical!==0;}
  SetDurPpq(v:number):void{this.m_durPpq=v;} GetDurPpq():number{return this.m_durPpq;} HasDurPpq():boolean{return this.m_durPpq!==MEI_UNSET;}
  SetDurReal(v:number):void{this.m_durReal=v;} GetDurReal():number{return this.m_durReal;} HasDurReal():boolean{return this.m_durReal!==0;}
  SetDurRecip(v:string):void{this.m_durRecip=v;} GetDurRecip():string{return this.m_durRecip;} HasDurRecip():boolean{return this.m_durRecip!=='';}
}
export class InstDurationGes extends AttDurationGes {}

export abstract class AttNoteGes extends Att {
  protected m_extremis: noteGes_EXTREMIS = noteGes_EXTREMIS_NONE;

  constructor() { super(); this.ResetNoteGes(); }

  ResetNoteGes(): void {
    this.m_extremis = noteGes_EXTREMIS_NONE;
  }

  ReadNoteGes(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'extremis')) { this.SetExtremis(this.StrToNoteGesExtremis(getAttr(element, 'extremis'))); if (removeAttr) element.remove_attribute('extremis'); hasAttribute = true; }
    return hasAttribute;
  }

  WriteNoteGes(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasExtremis()) { setAttr(element, 'extremis', this.NoteGesExtremisToStr(this.GetExtremis())); wroteAttribute = true; }
    return wroteAttribute;
  }

  SetExtremis(value: noteGes_EXTREMIS): void { this.m_extremis = value; }
  GetExtremis(): noteGes_EXTREMIS { return this.m_extremis; }
  HasExtremis(): boolean { return this.m_extremis !== noteGes_EXTREMIS_NONE; }
}

export class InstNoteGes extends AttNoteGes {}

export abstract class AttOrnamentAccidGes extends Att {
 protected m_accidupperGes:data_ACCIDENTAL_GESTURAL=0; protected m_accidlowerGes:data_ACCIDENTAL_GESTURAL=0;
 constructor(){super();this.ResetOrnamentAccidGes();}
 ResetOrnamentAccidGes(){this.m_accidupperGes=0;this.m_accidlowerGes=0;}
 ReadOrnamentAccidGes(element:xml_node,removeAttr=true):boolean{let h=false; if(attrExists(element,'accidupper.ges')){this.SetAccidupperGes(this.StrToAccidentalGestural(getAttr(element,'accidupper.ges')));if(removeAttr)element.remove_attribute('accidupper.ges');h=true;} if(attrExists(element,'accidlower.ges')){this.SetAccidlowerGes(this.StrToAccidentalGestural(getAttr(element,'accidlower.ges')));if(removeAttr)element.remove_attribute('accidlower.ges');h=true;} return h;}
 WriteOrnamentAccidGes(element:xml_node):boolean{let w=false;if(this.HasAccidupperGes()){setAttr(element,'accidupper.ges',this.AccidentalGesturalToStr(this.GetAccidupperGes()));w=true;}if(this.HasAccidlowerGes()){setAttr(element,'accidlower.ges',this.AccidentalGesturalToStr(this.GetAccidlowerGes()));w=true;}return w;}
 SetAccidupperGes(v:data_ACCIDENTAL_GESTURAL){this.m_accidupperGes=v;} GetAccidupperGes(){return this.m_accidupperGes;} HasAccidupperGes(){return this.m_accidupperGes!==0;}
 SetAccidlowerGes(v:data_ACCIDENTAL_GESTURAL){this.m_accidlowerGes=v;} GetAccidlowerGes(){return this.m_accidlowerGes;} HasAccidlowerGes(){return this.m_accidlowerGes!==0;}
}
export class InstOrnamentAccidGes extends AttOrnamentAccidGes {}

export abstract class AttPitchGes extends Att {
  protected m_octGes: data_OCTAVE = MEI_UNSET_OCT;
  protected m_pnameGes: data_PITCHNAME = 0;
  protected m_pnum: number = MEI_UNSET;

  constructor() { super(); this.ResetPitchGes(); }

  ResetPitchGes(): void {
    this.m_octGes = MEI_UNSET_OCT;
    this.m_pnameGes = 0;
    this.m_pnum = MEI_UNSET;
  }

  ReadPitchGes(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'oct.ges')) { this.SetOctGes(this.StrToOctave(getAttr(element, 'oct.ges'))); if (removeAttr) element.remove_attribute('oct.ges'); hasAttribute = true; }
    if (attrExists(element, 'pname.ges')) { this.SetPnameGes(this.StrToPitchname(getAttr(element, 'pname.ges'))); if (removeAttr) element.remove_attribute('pname.ges'); hasAttribute = true; }
    if (attrExists(element, 'pnum')) { this.SetPnum(this.StrToInt(getAttr(element, 'pnum'))); if (removeAttr) element.remove_attribute('pnum'); hasAttribute = true; }
    return hasAttribute;
  }

  WritePitchGes(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOctGes()) { setAttr(element, 'oct.ges', this.OctaveToStr(this.GetOctGes())); wroteAttribute = true; }
    if (this.HasPnameGes()) { setAttr(element, 'pname.ges', this.PitchnameToStr(this.GetPnameGes())); wroteAttribute = true; }
    if (this.HasPnum()) { setAttr(element, 'pnum', this.IntToStr(this.GetPnum())); wroteAttribute = true; }
    return wroteAttribute;
  }

  SetOctGes(value: data_OCTAVE): void { this.m_octGes = value; }
  GetOctGes(): data_OCTAVE { return this.m_octGes; }
  HasOctGes(): boolean { return this.m_octGes !== MEI_UNSET_OCT; }
  SetPnameGes(value: data_PITCHNAME): void { this.m_pnameGes = value; }
  GetPnameGes(): data_PITCHNAME { return this.m_pnameGes; }
  HasPnameGes(): boolean { return this.m_pnameGes !== 0; }
  SetPnum(value: number): void { this.m_pnum = value; }
  GetPnum(): number { return this.m_pnum; }
  HasPnum(): boolean { return this.m_pnum !== MEI_UNSET; }
}

export class InstPitchGes extends AttPitchGes {}

export abstract class AttSoundLocation extends Att {
  protected m_azimuth: data_DEGREES = MEI_UNSET;
  protected m_elevation: data_DEGREES = MEI_UNSET;

  constructor() { super(); this.ResetSoundLocation(); }

  ResetSoundLocation(): void {
    this.m_azimuth = MEI_UNSET;
    this.m_elevation = MEI_UNSET;
  }

  ReadSoundLocation(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'azimuth')) { this.SetAzimuth(this.StrToDegrees(getAttr(element, 'azimuth'))); if (removeAttr) element.remove_attribute('azimuth'); hasAttribute = true; }
    if (attrExists(element, 'elevation')) { this.SetElevation(this.StrToDegrees(getAttr(element, 'elevation'))); if (removeAttr) element.remove_attribute('elevation'); hasAttribute = true; }
    return hasAttribute;
  }

  WriteSoundLocation(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAzimuth()) { setAttr(element, 'azimuth', this.DegreesToStr(this.GetAzimuth())); wroteAttribute = true; }
    if (this.HasElevation()) { setAttr(element, 'elevation', this.DegreesToStr(this.GetElevation())); wroteAttribute = true; }
    return wroteAttribute;
  }

  SetAzimuth(value: data_DEGREES): void { this.m_azimuth = value; }
  GetAzimuth(): data_DEGREES { return this.m_azimuth; }
  HasAzimuth(): boolean { return this.m_azimuth !== MEI_UNSET; }
  SetElevation(value: data_DEGREES): void { this.m_elevation = value; }
  GetElevation(): data_DEGREES { return this.m_elevation; }
  HasElevation(): boolean { return this.m_elevation !== MEI_UNSET; }
}

export class InstSoundLocation extends AttSoundLocation {}

export abstract class AttTimestampGes extends Att { protected m_tstampGes=0.0; protected m_tstampReal=''; constructor(){super();this.ResetTimestampGes();} ResetTimestampGes(){this.m_tstampGes=0.0;this.m_tstampReal='';} ReadTimestampGes(e:xml_node,r=true){let h=false;if(attrExists(e,'tstamp.ges')){this.SetTstampGes(this.StrToDbl(getAttr(e,'tstamp.ges')));if(r)e.remove_attribute('tstamp.ges');h=true;}if(attrExists(e,'tstamp.real')){this.SetTstampReal(this.StrToStr(getAttr(e,'tstamp.real')));if(r)e.remove_attribute('tstamp.real');h=true;}return h;} WriteTimestampGes(e:xml_node){let w=false;if(this.HasTstampGes()){setAttr(e,'tstamp.ges',this.DblToStr(this.GetTstampGes()));w=true;}if(this.HasTstampReal()){setAttr(e,'tstamp.real',this.StrToStr(this.GetTstampReal()));w=true;}return w;} SetTstampGes(v:number){this.m_tstampGes=v;}GetTstampGes(){return this.m_tstampGes;}HasTstampGes(){return this.m_tstampGes!==0;} SetTstampReal(v:string){this.m_tstampReal=v;}GetTstampReal(){return this.m_tstampReal;}HasTstampReal(){return this.m_tstampReal!=='';} }
export class InstTimestampGes extends AttTimestampGes {}

export abstract class AttTimestamp2Ges extends Att { protected m_tstamp2Ges:data_MEASUREBEAT=[-1,-1.0]; protected m_tstamp2Real=''; constructor(){super();this.ResetTimestamp2Ges();} ResetTimestamp2Ges(){this.m_tstamp2Ges=[-1,-1.0];this.m_tstamp2Real='';} ReadTimestamp2Ges(e:xml_node,r=true){let h=false;if(attrExists(e,'tstamp2.ges')){this.SetTstamp2Ges(this.StrToMeasurebeat(getAttr(e,'tstamp2.ges')));if(r)e.remove_attribute('tstamp2.ges');h=true;}if(attrExists(e,'tstamp2.real')){this.SetTstamp2Real(this.StrToStr(getAttr(e,'tstamp2.real')));if(r)e.remove_attribute('tstamp2.real');h=true;}return h;} WriteTimestamp2Ges(e:xml_node){let w=false;if(this.HasTstamp2Ges()){setAttr(e,'tstamp2.ges',this.MeasurebeatToStr(this.GetTstamp2Ges()));w=true;}if(this.HasTstamp2Real()){setAttr(e,'tstamp2.real',this.StrToStr(this.GetTstamp2Real()));w=true;}return w;} SetTstamp2Ges(v:data_MEASUREBEAT){this.m_tstamp2Ges=v;}GetTstamp2Ges(){return this.m_tstamp2Ges;}HasTstamp2Ges(){return this.m_tstamp2Ges[0]!==-1||this.m_tstamp2Ges[1]!==-1.0;} SetTstamp2Real(v:string){this.m_tstamp2Real=v;}GetTstamp2Real(){return this.m_tstamp2Real;}HasTstamp2Real(){return this.m_tstamp2Real!=='';} }
export class InstTimestamp2Ges extends AttTimestamp2Ges {}
