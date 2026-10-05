import { Att } from './att';
import { xml_node } from './pugixml';

// libmei enum values are stable integer ordinals generated from atttypes.h.
export const harmAnl_FORM_NONE = 0, harmAnl_FORM_explicit = 1, harmAnl_FORM_implied = 2;
export type harmAnl_FORM = number;
export const MELODICFUNCTION_NONE = 0;
export type data_MELODICFUNCTION = number;
export const MODE_NONE = 0;
export type data_MODE = number;
export const ACCIDENTAL_GESTURAL_basic_NONE = 0;
export type data_ACCIDENTAL_GESTURAL_basic = number;

export abstract class AttHarmAnl extends Att {
  protected m_form: harmAnl_FORM = harmAnl_FORM_NONE;
  constructor() { super(); this.ResetHarmAnl(); }
  ResetHarmAnl(): void { this.m_form = harmAnl_FORM_NONE; }
  ReadHarmAnl(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const attr = element.attribute('form');
    if (!attr.empty()) { this.SetForm(this.StrToHarmAnlForm(attr.value())); if (removeAttr) element.remove_attribute('form'); hasAttribute = true; }
    return hasAttribute;
  }
  WriteHarmAnl(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) { element.append_attribute('form').set_value(this.HarmAnlFormToStr(this.GetForm())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetForm(form: harmAnl_FORM): void { this.m_form = form; }
  GetForm(): harmAnl_FORM { return this.m_form; }
  HasForm(): boolean { return this.m_form !== harmAnl_FORM_NONE; }
}
export class InstHarmAnl extends AttHarmAnl {}

export abstract class AttHarmonicFunction extends Att {
  protected m_deg = '';
  constructor() { super(); this.ResetHarmonicFunction(); }
  ResetHarmonicFunction(): void { this.m_deg = ''; }
  ReadHarmonicFunction(element: xml_node, removeAttr = true): boolean { const a=element.attribute('deg'); if(a.empty()) return false; this.SetDeg(this.StrToStr(a.value())); if(removeAttr) element.remove_attribute('deg'); return true; }
  WriteHarmonicFunction(element: xml_node): boolean { if(!this.HasDeg()) return false; element.append_attribute('deg').set_value(this.StrToStr(this.GetDeg())); return true; }
  SetDeg(deg: string): void { this.m_deg = deg; }
  GetDeg(): string { return this.m_deg; }
  HasDeg(): boolean { return this.m_deg !== ''; }
}
export class InstHarmonicFunction extends AttHarmonicFunction {}

export abstract class AttIntervalHarmonic extends Att {
  protected m_inth = '';
  constructor() { super(); this.ResetIntervalHarmonic(); }
  ResetIntervalHarmonic(): void { this.m_inth = ''; }
  ReadIntervalHarmonic(element: xml_node, removeAttr = true): boolean { const a=element.attribute('inth'); if(a.empty()) return false; this.SetInth(this.StrToStr(a.value())); if(removeAttr) element.remove_attribute('inth'); return true; }
  WriteIntervalHarmonic(element: xml_node): boolean { if(!this.HasInth()) return false; element.append_attribute('inth').set_value(this.StrToStr(this.GetInth())); return true; }
  SetInth(value: string): void { this.m_inth=value; }
  GetInth(): string { return this.m_inth; }
  HasInth(): boolean { return this.m_inth !== ''; }
}
export class InstIntervalHarmonic extends AttIntervalHarmonic {}

export abstract class AttIntervalMelodic extends Att {
  protected m_intm = '';
  constructor() { super(); this.ResetIntervalMelodic(); }
  ResetIntervalMelodic(): void { this.m_intm = ''; }
  ReadIntervalMelodic(element: xml_node, removeAttr = true): boolean { const a=element.attribute('intm'); if(a.empty()) return false; this.SetIntm(this.StrToStr(a.value())); if(removeAttr) element.remove_attribute('intm'); return true; }
  WriteIntervalMelodic(element: xml_node): boolean { if(!this.HasIntm()) return false; element.append_attribute('intm').set_value(this.StrToStr(this.GetIntm())); return true; }
  SetIntm(value: string): void { this.m_intm=value; }
  GetIntm(): string { return this.m_intm; }
  HasIntm(): boolean { return this.m_intm !== ''; }
}
export class InstIntervalMelodic extends AttIntervalMelodic {}

export abstract class AttKeySigAnl extends Att {
  protected m_accid: data_ACCIDENTAL_GESTURAL_basic = ACCIDENTAL_GESTURAL_basic_NONE;
  protected m_mode: data_MODE = MODE_NONE;
  constructor() { super(); this.ResetKeySigAnl(); }
  ResetKeySigAnl(): void { this.m_accid=ACCIDENTAL_GESTURAL_basic_NONE; this.m_mode=MODE_NONE; }
  ReadKeySigAnl(element: xml_node, removeAttr = true): boolean { let h=false; const a=element.attribute('accid'); if(!a.empty()){this.SetAccid(this.StrToAccidentalGesturalBasic(a.value()));if(removeAttr)element.remove_attribute('accid');h=true;} const m=element.attribute('mode'); if(!m.empty()){this.SetMode(this.StrToMode(m.value()));if(removeAttr)element.remove_attribute('mode');h=true;} return h; }
  WriteKeySigAnl(element: xml_node): boolean { let w=false; if(this.HasAccid()){element.append_attribute('accid').set_value(this.AccidentalGesturalBasicToStr(this.GetAccid()));w=true;} if(this.HasMode()){element.append_attribute('mode').set_value(this.ModeToStr(this.GetMode()));w=true;} return w; }
  SetAccid(v:data_ACCIDENTAL_GESTURAL_basic):void{this.m_accid=v;} GetAccid():data_ACCIDENTAL_GESTURAL_basic{return this.m_accid;} HasAccid():boolean{return this.m_accid!==ACCIDENTAL_GESTURAL_basic_NONE;}
  SetMode(v:data_MODE):void{this.m_mode=v;} GetMode():data_MODE{return this.m_mode;} HasMode():boolean{return this.m_mode!==MODE_NONE;}
}
export class InstKeySigAnl extends AttKeySigAnl {}

export abstract class AttKeySigDefaultAnl extends Att {
  protected m_keyAccid:data_ACCIDENTAL_GESTURAL_basic=ACCIDENTAL_GESTURAL_basic_NONE; protected m_keyMode:data_MODE=MODE_NONE; protected m_keyPname=0;
  constructor(){super();this.ResetKeySigDefaultAnl();}
  ResetKeySigDefaultAnl():void{this.m_keyAccid=ACCIDENTAL_GESTURAL_basic_NONE;this.m_keyMode=MODE_NONE;this.m_keyPname=0;}
  ReadKeySigDefaultAnl(element:xml_node,removeAttr=true):boolean{let h=false;const a=element.attribute('key.accid');if(!a.empty()){this.SetKeyAccid(this.StrToAccidentalGesturalBasic(a.value()));if(removeAttr)element.remove_attribute('key.accid');h=true;}const m=element.attribute('key.mode');if(!m.empty()){this.SetKeyMode(this.StrToMode(m.value()));if(removeAttr)element.remove_attribute('key.mode');h=true;}const p=element.attribute('key.pname');if(!p.empty()){this.SetKeyPname(this.StrToPitchname(p.value()));if(removeAttr)element.remove_attribute('key.pname');h=true;}return h;}
  WriteKeySigDefaultAnl(element:xml_node):boolean{let w=false;if(this.HasKeyAccid()){element.append_attribute('key.accid').set_value(this.AccidentalGesturalBasicToStr(this.GetKeyAccid()));w=true;}if(this.HasKeyMode()){element.append_attribute('key.mode').set_value(this.ModeToStr(this.GetKeyMode()));w=true;}if(this.HasKeyPname()){element.append_attribute('key.pname').set_value(this.PitchnameToStr(this.GetKeyPname()));w=true;}return w;}
  SetKeyAccid(v:data_ACCIDENTAL_GESTURAL_basic):void{this.m_keyAccid=v;}GetKeyAccid():data_ACCIDENTAL_GESTURAL_basic{return this.m_keyAccid;}HasKeyAccid():boolean{return this.m_keyAccid!==ACCIDENTAL_GESTURAL_basic_NONE;}
  SetKeyMode(v:data_MODE):void{this.m_keyMode=v;}GetKeyMode():data_MODE{return this.m_keyMode;}HasKeyMode():boolean{return this.m_keyMode!==MODE_NONE;}
  SetKeyPname(v:number):void{this.m_keyPname=v;}GetKeyPname():number{return this.m_keyPname;}HasKeyPname():boolean{return this.m_keyPname!==0;}
}
export class InstKeySigDefaultAnl extends AttKeySigDefaultAnl {}

export abstract class AttMelodicFunction extends Att { protected m_mfunc:data_MELODICFUNCTION=MELODICFUNCTION_NONE; constructor(){super();this.ResetMelodicFunction();} ResetMelodicFunction():void{this.m_mfunc=MELODICFUNCTION_NONE;} ReadMelodicFunction(e:xml_node,r=true):boolean{const a=e.attribute('mfunc');if(a.empty())return false;this.SetMfunc(this.StrToMelodicfunction(a.value()));if(r)e.remove_attribute('mfunc');return true;} WriteMelodicFunction(e:xml_node):boolean{if(!this.HasMfunc())return false;e.append_attribute('mfunc').set_value(this.MelodicfunctionToStr(this.GetMfunc()));return true;} SetMfunc(v:data_MELODICFUNCTION):void{this.m_mfunc=v;}GetMfunc():data_MELODICFUNCTION{return this.m_mfunc;}HasMfunc():boolean{return this.m_mfunc!==MELODICFUNCTION_NONE;} }
export class InstMelodicFunction extends AttMelodicFunction {}

export abstract class AttPitchClass extends Att { protected m_pclass:number=-0x7fffffff; constructor(){super();this.ResetPitchClass();} ResetPitchClass():void{this.m_pclass=-0x7fffffff;} ReadPitchClass(e:xml_node,r=true):boolean{const a=e.attribute('pclass');if(a.empty())return false;this.SetPclass(this.StrToInt(a.value()));if(r)e.remove_attribute('pclass');return true;} WritePitchClass(e:xml_node):boolean{if(!this.HasPclass())return false;e.append_attribute('pclass').set_value(this.IntToStr(this.GetPclass()));return true;}SetPclass(v:number):void{this.m_pclass=v;}GetPclass():number{return this.m_pclass;}HasPclass():boolean{return this.m_pclass!==-0x7fffffff;} }
export class InstPitchClass extends AttPitchClass {}

export abstract class AttSolfa extends Att { protected m_psolfa=''; constructor(){super();this.ResetSolfa();} ResetSolfa():void{this.m_psolfa='';} ReadSolfa(e:xml_node,r=true):boolean{const a=e.attribute('psolfa');if(a.empty())return false;this.SetPsolfa(this.StrToStr(a.value()));if(r)e.remove_attribute('psolfa');return true;} WriteSolfa(e:xml_node):boolean{if(!this.HasPsolfa())return false;e.append_attribute('psolfa').set_value(this.StrToStr(this.GetPsolfa()));return true;}SetPsolfa(v:string):void{this.m_psolfa=v;}GetPsolfa():string{return this.m_psolfa;}HasPsolfa():boolean{return this.m_psolfa!=='';} }
export class InstSolfa extends AttSolfa {}
