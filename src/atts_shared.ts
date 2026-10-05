/**
 * Pure TypeScript translation of libmei/dist/atts_shared.cpp.
 * Generated from the canonical C++ implementation; XML read/write
 * control flow, defaults and presence semantics are preserved.
 */

import { Att } from './att';
import { xml_node } from './pugixml';
import * as c from './libmei-att';
import { AttConverterBase } from './attconverter';

const ACCIDENTAL_WRITTEN_NONE = 0;
const BARMETHOD_NONE = 0;
const BARRENDITION_NONE = 0;
const BETYPE_NONE = 0;
const BOOLEAN_NONE = 0;
const CERTAINTY_NONE = 0;
const CLEFSHAPE_NONE = 0;
const COURSETUNING_NONE = 0;
const ENCLOSURE_NONE = 0;
const FILL_NONE = 0;
const FONTSTYLE_NONE = 0;
const FONTWEIGHT_NONE = 0;
const HORIZONTALALIGNMENT_NONE = 0;
const LINEFORM_NONE = 0;
const LINESTARTENDSYMBOL_NONE = 0;
const METERSIGN_NONE = 0;
const NOTEHEADMODIFIER_NONE = 0;
const PGFUNC_NONE = 0;
const RELATORS_NONE = 0;
const ROTATION_NONE = 0;
const STAFFREL_basic_NONE = 0;
const STEMDIRECTION_NONE = 0;
const STEMMODIFIER_NONE = 0;
const STEMPOSITION_NONE = 0;
const TEMPERAMENT_NONE = 0;
const TEXTRENDITION_NONE = 0;
const VERTICALALIGNMENT_NONE = 0;
const accidLog_FUNC_NONE = 0;
const audience_AUDIENCE_NONE = 0;
const curvature_CURVEDIR_NONE = 0;
const dotLog_FORM_NONE = 0;
const endings_ENDINGREND_NONE = 0;
const meiVersion_MEIVERSION_NONE = 0;
const meterConformance_METCON_NONE = 0;
const repeatMarkLog_FUNC_NONE = 0;
const staffGroupingSym_SYMBOL_NONE = 0;
const sylLog_CON_NONE = 0;
const sylLog_WORDPOS_NONE = 0;
const targetEval_EVALUATE_NONE = 0;
const tempoLog_FUNC_NONE = 0;
const voltaGroupingSym_VOLTASYM_NONE = 0;
const MEI_UNSET = -2147483647;
const MEI_UNSET_OCT_LOCAL = -127;
const data_MEASUREMENTUNSIGNED = c.data_MEASUREMENTSIGNED;

export abstract class AttAccidLog extends Att {
  protected m_func: any;
  constructor() { super(); this.ResetAccidLog(); }

  ResetAccidLog(): void {
    this.m_func = accidLog_FUNC_NONE;
  }

  ReadAccidLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('func').empty()) {
    this.SetFunc(this.StrToAccidLogFunc(element.attribute('func').value()));
    if (removeAttr) element.remove_attribute("func");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteAccidLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasFunc()) {
    element.append_attribute("func").set_value(this.AccidLogFuncToStr(this.GetFunc()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasFunc(): boolean {
    return (this.m_func != accidLog_FUNC_NONE);
  }

  SetFunc(value: any): void { this.m_func = value; }

  GetFunc(): any { return this.m_func; }

}
export class InstAccidLog extends AttAccidLog {}

export abstract class AttAccidental extends Att {
  protected m_accid: any;
  constructor() { super(); this.ResetAccidental(); }

  ResetAccidental(): void {
    this.m_accid = c.ACCIDENTAL_WRITTEN_NONE;
  }

  ReadAccidental(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('accid').empty()) {
    this.SetAccid(this.StrToAccidentalWritten(element.attribute('accid').value()));
    if (removeAttr) element.remove_attribute("accid");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteAccidental(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAccid()) {
    element.append_attribute("accid").set_value(this.AccidentalWrittenToStr(this.GetAccid()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasAccid(): boolean {
    return (this.m_accid != c.ACCIDENTAL_WRITTEN_NONE);
  }

  SetAccid(value: any): void { this.m_accid = value; }

  GetAccid(): any { return this.m_accid; }

}
export class InstAccidental extends AttAccidental {}

export abstract class AttAnnotLog extends Att {
  protected m_func: any;
  constructor() { super(); this.ResetAnnotLog(); }

  ResetAnnotLog(): void {
    this.m_func = "";
  }

  ReadAnnotLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('func').empty()) {
    this.SetFunc(this.StrToStr(element.attribute('func').value()));
    if (removeAttr) element.remove_attribute("func");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteAnnotLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasFunc()) {
    element.append_attribute("func").set_value(this.StrToStr(this.GetFunc()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasFunc(): boolean {
    return (this.m_func != "");
  }

  SetFunc(value: any): void { this.m_func = value; }

  GetFunc(): any { return this.m_func; }

}
export class InstAnnotLog extends AttAnnotLog {}

export abstract class AttArticulation extends Att {
  protected m_artic: any;
  constructor() { super(); this.ResetArticulation(); }

  ResetArticulation(): void {
    this.m_artic = [];
  }

  ReadArticulation(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('artic').empty()) {
    this.SetArtic(this.StrToArticulationList(element.attribute('artic').value()));
    if (removeAttr) element.remove_attribute("artic");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteArticulation(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasArtic()) {
    element.append_attribute("artic").set_value(this.ArticulationListToStr(this.GetArtic()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasArtic(): boolean {
    return (this.m_artic.length !== 0);
  }

  SetArtic(value: any): void { this.m_artic = value; }

  GetArtic(): any { return this.m_artic; }

}
export class InstArticulation extends AttArticulation {}

export abstract class AttAttaccaLog extends Att {
  protected m_target: any;
  constructor() { super(); this.ResetAttaccaLog(); }

  ResetAttaccaLog(): void {
    this.m_target = "";
  }

  ReadAttaccaLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('target').empty()) {
    this.SetTarget(this.StrToStr(element.attribute('target').value()));
    if (removeAttr) element.remove_attribute("target");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteAttaccaLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTarget()) {
    element.append_attribute("target").set_value(this.StrToStr(this.GetTarget()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasTarget(): boolean {
    return (this.m_target != "");
  }

  SetTarget(value: any): void { this.m_target = value; }

  GetTarget(): any { return this.m_target; }

}
export class InstAttaccaLog extends AttAttaccaLog {}

export abstract class AttAudience extends Att {
  protected m_audience: any;
  constructor() { super(); this.ResetAudience(); }

  ResetAudience(): void {
    this.m_audience = audience_AUDIENCE_NONE;
  }

  ReadAudience(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('audience').empty()) {
    this.SetAudience(this.StrToAudienceAudience(element.attribute('audience').value()));
    if (removeAttr) element.remove_attribute("audience");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteAudience(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAudience()) {
    element.append_attribute("audience").set_value(this.AudienceAudienceToStr(this.GetAudience()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasAudience(): boolean {
    return (this.m_audience != audience_AUDIENCE_NONE);
  }

  SetAudience(value: any): void { this.m_audience = value; }

  GetAudience(): any { return this.m_audience; }

}
export class InstAudience extends AttAudience {}

export abstract class AttAugmentDots extends Att {
  protected m_dots: any;
  constructor() { super(); this.ResetAugmentDots(); }

  ResetAugmentDots(): void {
    this.m_dots = MEI_UNSET;
  }

  ReadAugmentDots(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('dots').empty()) {
    this.SetDots(this.StrToInt(element.attribute('dots').value()));
    if (removeAttr) element.remove_attribute("dots");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteAugmentDots(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDots()) {
    element.append_attribute("dots").set_value(this.IntToStr(this.GetDots()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasDots(): boolean {
    return (this.m_dots != MEI_UNSET);
  }

  SetDots(value: any): void { this.m_dots = value; }

  GetDots(): any { return this.m_dots; }

}
export class InstAugmentDots extends AttAugmentDots {}

export abstract class AttAuthorized extends Att {
  protected m_auth: any;
  protected m_authUri: any;
  constructor() { super(); this.ResetAuthorized(); }

  ResetAuthorized(): void {
    this.m_auth = "";
    this.m_authUri = "";
  }

  ReadAuthorized(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('auth').empty()) {
    this.SetAuth(this.StrToStr(element.attribute('auth').value()));
    if (removeAttr) element.remove_attribute("auth");
    hasAttribute = true;
    }
    if (!element.attribute('auth.uri').empty()) {
    this.SetAuthUri(this.StrToStr(element.attribute('auth.uri').value()));
    if (removeAttr) element.remove_attribute("auth.uri");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteAuthorized(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAuth()) {
    element.append_attribute("auth").set_value(this.StrToStr(this.GetAuth()));
    wroteAttribute = true;
    }
    if (this.HasAuthUri()) {
    element.append_attribute("auth.uri").set_value(this.StrToStr(this.GetAuthUri()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasAuth(): boolean {
    return (this.m_auth != "");
  }

  HasAuthUri(): boolean {
    return (this.m_authUri != "");
  }

  SetAuth(value: any): void { this.m_auth = value; }
  SetAuthUri(value: any): void { this.m_authUri = value; }

  GetAuth(): any { return this.m_auth; }
  GetAuthUri(): any { return this.m_authUri; }

}
export class InstAuthorized extends AttAuthorized {}

export abstract class AttBarLineLog extends Att {
  protected m_form: any;
  constructor() { super(); this.ResetBarLineLog(); }

  ResetBarLineLog(): void {
    this.m_form = BARRENDITION_NONE;
  }

  ReadBarLineLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('form').empty()) {
    this.SetForm(this.StrToBarrendition(element.attribute('form').value()));
    if (removeAttr) element.remove_attribute("form");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteBarLineLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) {
    element.append_attribute("form").set_value(this.BarrenditionToStr(this.GetForm()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasForm(): boolean {
    return (this.m_form != BARRENDITION_NONE);
  }

  SetForm(value: any): void { this.m_form = value; }

  GetForm(): any { return this.m_form; }

}
export class InstBarLineLog extends AttBarLineLog {}

export abstract class AttBarring extends Att {
  protected m_barLen: any;
  protected m_barMethod: any;
  protected m_barPlace: any;
  constructor() { super(); this.ResetBarring(); }

  ResetBarring(): void {
    this.m_barLen = 0.0;
    this.m_barMethod = BARMETHOD_NONE;
    this.m_barPlace = MEI_UNSET;
  }

  ReadBarring(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('bar.len').empty()) {
    this.SetBarLen(this.StrToDbl(element.attribute('bar.len').value()));
    if (removeAttr) element.remove_attribute("bar.len");
    hasAttribute = true;
    }
    if (!element.attribute('bar.method').empty()) {
    this.SetBarMethod(this.StrToBarmethod(element.attribute('bar.method').value()));
    if (removeAttr) element.remove_attribute("bar.method");
    hasAttribute = true;
    }
    if (!element.attribute('bar.place').empty()) {
    this.SetBarPlace(this.StrToInt(element.attribute('bar.place').value()));
    if (removeAttr) element.remove_attribute("bar.place");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteBarring(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasBarLen()) {
    element.append_attribute("bar.len").set_value(this.DblToStr(this.GetBarLen()));
    wroteAttribute = true;
    }
    if (this.HasBarMethod()) {
    element.append_attribute("bar.method").set_value(this.BarmethodToStr(this.GetBarMethod()));
    wroteAttribute = true;
    }
    if (this.HasBarPlace()) {
    element.append_attribute("bar.place").set_value(this.IntToStr(this.GetBarPlace()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasBarLen(): boolean {
    return (this.m_barLen != 0.0);
  }

  HasBarMethod(): boolean {
    return (this.m_barMethod != BARMETHOD_NONE);
  }

  HasBarPlace(): boolean {
    return (this.m_barPlace != MEI_UNSET);
  }

  SetBarLen(value: any): void { this.m_barLen = value; }
  SetBarMethod(value: any): void { this.m_barMethod = value; }
  SetBarPlace(value: any): void { this.m_barPlace = value; }

  GetBarLen(): any { return this.m_barLen; }
  GetBarMethod(): any { return this.m_barMethod; }
  GetBarPlace(): any { return this.m_barPlace; }

}
export class InstBarring extends AttBarring {}

export abstract class AttBasic extends Att {
  protected m_base: any;
  constructor() { super(); this.ResetBasic(); }

  ResetBasic(): void {
    this.m_base = "";
  }

  ReadBasic(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('xml:base').empty()) {
    this.SetBase(this.StrToStr(element.attribute('xml:base').value()));
    if (removeAttr) element.remove_attribute("xml:base");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteBasic(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasBase()) {
    element.append_attribute("xml:base").set_value(this.StrToStr(this.GetBase()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasBase(): boolean {
    return (this.m_base != "");
  }

  SetBase(value: any): void { this.m_base = value; }

  GetBase(): any { return this.m_base; }

}
export class InstBasic extends AttBasic {}

export abstract class AttBibl extends Att {
  protected m_analog: any;
  constructor() { super(); this.ResetBibl(); }

  ResetBibl(): void {
    this.m_analog = "";
  }

  ReadBibl(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('analog').empty()) {
    this.SetAnalog(this.StrToStr(element.attribute('analog').value()));
    if (removeAttr) element.remove_attribute("analog");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteBibl(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAnalog()) {
    element.append_attribute("analog").set_value(this.StrToStr(this.GetAnalog()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasAnalog(): boolean {
    return (this.m_analog != "");
  }

  SetAnalog(value: any): void { this.m_analog = value; }

  GetAnalog(): any { return this.m_analog; }

}
export class InstBibl extends AttBibl {}

export abstract class AttCalendared extends Att {
  protected m_calendar: any;
  constructor() { super(); this.ResetCalendared(); }

  ResetCalendared(): void {
    this.m_calendar = "";
  }

  ReadCalendared(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('calendar').empty()) {
    this.SetCalendar(this.StrToStr(element.attribute('calendar').value()));
    if (removeAttr) element.remove_attribute("calendar");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteCalendared(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCalendar()) {
    element.append_attribute("calendar").set_value(this.StrToStr(this.GetCalendar()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasCalendar(): boolean {
    return (this.m_calendar != "");
  }

  SetCalendar(value: any): void { this.m_calendar = value; }

  GetCalendar(): any { return this.m_calendar; }

}
export class InstCalendared extends AttCalendared {}

export abstract class AttCanonical extends Att {
  protected m_codedval: any;
  constructor() { super(); this.ResetCanonical(); }

  ResetCanonical(): void {
    this.m_codedval = "";
  }

  ReadCanonical(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('codedval').empty()) {
    this.SetCodedval(this.StrToStr(element.attribute('codedval').value()));
    if (removeAttr) element.remove_attribute("codedval");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteCanonical(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCodedval()) {
    element.append_attribute("codedval").set_value(this.StrToStr(this.GetCodedval()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasCodedval(): boolean {
    return (this.m_codedval != "");
  }

  SetCodedval(value: any): void { this.m_codedval = value; }

  GetCodedval(): any { return this.m_codedval; }

}
export class InstCanonical extends AttCanonical {}

export abstract class AttClassed extends Att {
  protected m_class: any;
  constructor() { super(); this.ResetClassed(); }

  ResetClassed(): void {
    this.m_class = "";
  }

  ReadClassed(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('class').empty()) {
    this.SetClass(this.StrToStr(element.attribute('class').value()));
    if (removeAttr) element.remove_attribute("class");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteClassed(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasClass()) {
    element.append_attribute("class").set_value(this.StrToStr(this.GetClass()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasClass(): boolean {
    return (this.m_class != "");
  }

  SetClass(value: any): void { this.m_class = value; }

  GetClass(): any { return this.m_class; }

}
export class InstClassed extends AttClassed {}

export abstract class AttClefLog extends Att {
  protected m_cautionary: any;
  constructor() { super(); this.ResetClefLog(); }

  ResetClefLog(): void {
    this.m_cautionary = BOOLEAN_NONE;
  }

  ReadClefLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('cautionary').empty()) {
    this.SetCautionary(this.StrToBoolean(element.attribute('cautionary').value()));
    if (removeAttr) element.remove_attribute("cautionary");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteClefLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCautionary()) {
    element.append_attribute("cautionary").set_value(this.BooleanToStr(this.GetCautionary()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasCautionary(): boolean {
    return (this.m_cautionary != BOOLEAN_NONE);
  }

  SetCautionary(value: any): void { this.m_cautionary = value; }

  GetCautionary(): any { return this.m_cautionary; }

}
export class InstClefLog extends AttClefLog {}

export abstract class AttClefShape extends Att {
  protected m_shape: any;
  constructor() { super(); this.ResetClefShape(); }

  ResetClefShape(): void {
    this.m_shape = CLEFSHAPE_NONE;
  }

  ReadClefShape(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('shape').empty()) {
    this.SetShape(this.StrToClefshape(element.attribute('shape').value()));
    if (removeAttr) element.remove_attribute("shape");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteClefShape(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasShape()) {
    element.append_attribute("shape").set_value(this.ClefshapeToStr(this.GetShape()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasShape(): boolean {
    return (this.m_shape != CLEFSHAPE_NONE);
  }

  SetShape(value: any): void { this.m_shape = value; }

  GetShape(): any { return this.m_shape; }

}
export class InstClefShape extends AttClefShape {}

export abstract class AttCleffingLog extends Att {
  protected m_clefShape: any;
  protected m_clefLine: any;
  protected m_clefDis: any;
  protected m_clefDisPlace: any;
  constructor() { super(); this.ResetCleffingLog(); }

  ResetCleffingLog(): void {
    this.m_clefShape = CLEFSHAPE_NONE;
    this.m_clefLine = 0;
    this.m_clefDis = c.OCTAVE_DIS_NONE;
    this.m_clefDisPlace = c.STAFFREL_basic_NONE;
  }

  ReadCleffingLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('clef.shape').empty()) {
    this.SetClefShape(this.StrToClefshape(element.attribute('clef.shape').value()));
    if (removeAttr) element.remove_attribute("clef.shape");
    hasAttribute = true;
    }
    if (!element.attribute('clef.line').empty()) {
    this.SetClefLine(this.StrToInt(element.attribute('clef.line').value()));
    if (removeAttr) element.remove_attribute("clef.line");
    hasAttribute = true;
    }
    if (!element.attribute('clef.dis').empty()) {
    this.SetClefDis(this.StrToOctaveDis(element.attribute('clef.dis').value()));
    if (removeAttr) element.remove_attribute("clef.dis");
    hasAttribute = true;
    }
    if (!element.attribute('clef.dis.place').empty()) {
    this.SetClefDisPlace(this.StrToStaffrelBasic(element.attribute('clef.dis.place').value()));
    if (removeAttr) element.remove_attribute("clef.dis.place");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteCleffingLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasClefShape()) {
    element.append_attribute("clef.shape").set_value(this.ClefshapeToStr(this.GetClefShape()));
    wroteAttribute = true;
    }
    if (this.HasClefLine()) {
    element.append_attribute("clef.line").set_value(this.IntToStr(this.GetClefLine()));
    wroteAttribute = true;
    }
    if (this.HasClefDis()) {
    element.append_attribute("clef.dis").set_value(this.OctaveDisToStr(this.GetClefDis()));
    wroteAttribute = true;
    }
    if (this.HasClefDisPlace()) {
    element.append_attribute("clef.dis.place").set_value(this.StaffrelBasicToStr(this.GetClefDisPlace()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasClefShape(): boolean {
    return (this.m_clefShape != CLEFSHAPE_NONE);
  }

  HasClefLine(): boolean {
    return (this.m_clefLine != 0);
  }

  HasClefDis(): boolean {
    return (this.m_clefDis != c.OCTAVE_DIS_NONE);
  }

  HasClefDisPlace(): boolean {
    return (this.m_clefDisPlace != c.STAFFREL_basic_NONE);
  }

  SetClefShape(value: any): void { this.m_clefShape = value; }
  SetClefLine(value: any): void { this.m_clefLine = value; }
  SetClefDis(value: any): void { this.m_clefDis = value; }
  SetClefDisPlace(value: any): void { this.m_clefDisPlace = value; }

  GetClefShape(): any { return this.m_clefShape; }
  GetClefLine(): any { return this.m_clefLine; }
  GetClefDis(): any { return this.m_clefDis; }
  GetClefDisPlace(): any { return this.m_clefDisPlace; }

}
export class InstCleffingLog extends AttCleffingLog {}

export abstract class AttColor extends Att {
  protected m_color: any;
  constructor() { super(); this.ResetColor(); }

  ResetColor(): void {
    this.m_color = "";
  }

  ReadColor(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('color').empty()) {
    this.SetColor(this.StrToStr(element.attribute('color').value()));
    if (removeAttr) element.remove_attribute("color");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteColor(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasColor()) {
    element.append_attribute("color").set_value(this.StrToStr(this.GetColor()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasColor(): boolean {
    return (this.m_color != "");
  }

  SetColor(value: any): void { this.m_color = value; }

  GetColor(): any { return this.m_color; }

}
export class InstColor extends AttColor {}

export abstract class AttColoration extends Att {
  protected m_colored: any;
  constructor() { super(); this.ResetColoration(); }

  ResetColoration(): void {
    this.m_colored = BOOLEAN_NONE;
  }

  ReadColoration(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('colored').empty()) {
    this.SetColored(this.StrToBoolean(element.attribute('colored').value()));
    if (removeAttr) element.remove_attribute("colored");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteColoration(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasColored()) {
    element.append_attribute("colored").set_value(this.BooleanToStr(this.GetColored()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasColored(): boolean {
    return (this.m_colored != BOOLEAN_NONE);
  }

  SetColored(value: any): void { this.m_colored = value; }

  GetColored(): any { return this.m_colored; }

}
export class InstColoration extends AttColoration {}

export abstract class AttCoordX1 extends Att {
  protected m_coordX1: any;
  constructor() { super(); this.ResetCoordX1(); }

  ResetCoordX1(): void {
    this.m_coordX1 = 0.0;
  }

  ReadCoordX1(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('coord.x1').empty()) {
    this.SetCoordX1(this.StrToDbl(element.attribute('coord.x1').value()));
    if (removeAttr) element.remove_attribute("coord.x1");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteCoordX1(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCoordX1()) {
    element.append_attribute("coord.x1").set_value(this.DblToStr(this.GetCoordX1()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasCoordX1(): boolean {
    return (this.m_coordX1 != 0.0);
  }

  SetCoordX1(value: any): void { this.m_coordX1 = value; }

  GetCoordX1(): any { return this.m_coordX1; }

}
export class InstCoordX1 extends AttCoordX1 {}

export abstract class AttCoordX2 extends Att {
  protected m_coordX2: any;
  constructor() { super(); this.ResetCoordX2(); }

  ResetCoordX2(): void {
    this.m_coordX2 = 0.0;
  }

  ReadCoordX2(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('coord.x2').empty()) {
    this.SetCoordX2(this.StrToDbl(element.attribute('coord.x2').value()));
    if (removeAttr) element.remove_attribute("coord.x2");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteCoordX2(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCoordX2()) {
    element.append_attribute("coord.x2").set_value(this.DblToStr(this.GetCoordX2()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasCoordX2(): boolean {
    return (this.m_coordX2 != 0.0);
  }

  SetCoordX2(value: any): void { this.m_coordX2 = value; }

  GetCoordX2(): any { return this.m_coordX2; }

}
export class InstCoordX2 extends AttCoordX2 {}

export abstract class AttCoordY1 extends Att {
  protected m_coordY1: any;
  constructor() { super(); this.ResetCoordY1(); }

  ResetCoordY1(): void {
    this.m_coordY1 = 0.0;
  }

  ReadCoordY1(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('coord.y1').empty()) {
    this.SetCoordY1(this.StrToDbl(element.attribute('coord.y1').value()));
    if (removeAttr) element.remove_attribute("coord.y1");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteCoordY1(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCoordY1()) {
    element.append_attribute("coord.y1").set_value(this.DblToStr(this.GetCoordY1()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasCoordY1(): boolean {
    return (this.m_coordY1 != 0.0);
  }

  SetCoordY1(value: any): void { this.m_coordY1 = value; }

  GetCoordY1(): any { return this.m_coordY1; }

}
export class InstCoordY1 extends AttCoordY1 {}

export abstract class AttCoordinated extends Att {
  protected m_lrx: any;
  protected m_lry: any;
  protected m_rotate: any;
  constructor() { super(); this.ResetCoordinated(); }

  ResetCoordinated(): void {
    this.m_lrx = MEI_UNSET;
    this.m_lry = MEI_UNSET;
    this.m_rotate = MEI_UNSET;
  }

  ReadCoordinated(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('lrx').empty()) {
    this.SetLrx(this.StrToInt(element.attribute('lrx').value()));
    if (removeAttr) element.remove_attribute("lrx");
    hasAttribute = true;
    }
    if (!element.attribute('lry').empty()) {
    this.SetLry(this.StrToInt(element.attribute('lry').value()));
    if (removeAttr) element.remove_attribute("lry");
    hasAttribute = true;
    }
    if (!element.attribute('rotate').empty()) {
    this.SetRotate(this.StrToDegrees(element.attribute('rotate').value()));
    if (removeAttr) element.remove_attribute("rotate");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteCoordinated(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLrx()) {
    element.append_attribute("lrx").set_value(this.IntToStr(this.GetLrx()));
    wroteAttribute = true;
    }
    if (this.HasLry()) {
    element.append_attribute("lry").set_value(this.IntToStr(this.GetLry()));
    wroteAttribute = true;
    }
    if (this.HasRotate()) {
    element.append_attribute("rotate").set_value(this.DegreesToStr(this.GetRotate()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasLrx(): boolean {
    return (this.m_lrx != MEI_UNSET);
  }

  HasLry(): boolean {
    return (this.m_lry != MEI_UNSET);
  }

  HasRotate(): boolean {
    return (this.m_rotate != MEI_UNSET);
  }

  SetLrx(value: any): void { this.m_lrx = value; }
  SetLry(value: any): void { this.m_lry = value; }
  SetRotate(value: any): void { this.m_rotate = value; }

  GetLrx(): any { return this.m_lrx; }
  GetLry(): any { return this.m_lry; }
  GetRotate(): any { return this.m_rotate; }

}
export class InstCoordinated extends AttCoordinated {}

export abstract class AttCoordinatedUl extends Att {
  protected m_ulx: any;
  protected m_uly: any;
  constructor() { super(); this.ResetCoordinatedUl(); }

  ResetCoordinatedUl(): void {
    this.m_ulx = MEI_UNSET;
    this.m_uly = MEI_UNSET;
  }

  ReadCoordinatedUl(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('ulx').empty()) {
    this.SetUlx(this.StrToInt(element.attribute('ulx').value()));
    if (removeAttr) element.remove_attribute("ulx");
    hasAttribute = true;
    }
    if (!element.attribute('uly').empty()) {
    this.SetUly(this.StrToInt(element.attribute('uly').value()));
    if (removeAttr) element.remove_attribute("uly");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteCoordinatedUl(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasUlx()) {
    element.append_attribute("ulx").set_value(this.IntToStr(this.GetUlx()));
    wroteAttribute = true;
    }
    if (this.HasUly()) {
    element.append_attribute("uly").set_value(this.IntToStr(this.GetUly()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasUlx(): boolean {
    return (this.m_ulx != MEI_UNSET);
  }

  HasUly(): boolean {
    return (this.m_uly != MEI_UNSET);
  }

  SetUlx(value: any): void { this.m_ulx = value; }
  SetUly(value: any): void { this.m_uly = value; }

  GetUlx(): any { return this.m_ulx; }
  GetUly(): any { return this.m_uly; }

}
export class InstCoordinatedUl extends AttCoordinatedUl {}

export abstract class AttCue extends Att {
  protected m_cue: any;
  constructor() { super(); this.ResetCue(); }

  ResetCue(): void {
    this.m_cue = BOOLEAN_NONE;
  }

  ReadCue(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('cue').empty()) {
    this.SetCue(this.StrToBoolean(element.attribute('cue').value()));
    if (removeAttr) element.remove_attribute("cue");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteCue(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCue()) {
    element.append_attribute("cue").set_value(this.BooleanToStr(this.GetCue()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasCue(): boolean {
    return (this.m_cue != BOOLEAN_NONE);
  }

  SetCue(value: any): void { this.m_cue = value; }

  GetCue(): any { return this.m_cue; }

}
export class InstCue extends AttCue {}

export abstract class AttCurvature extends Att {
  protected m_bezier: any;
  protected m_bulge: any;
  protected m_curvedir: any;
  constructor() { super(); this.ResetCurvature(); }

  ResetCurvature(): void {
    this.m_bezier = "";
    this.m_bulge = [];
    this.m_curvedir = curvature_CURVEDIR_NONE;
  }

  ReadCurvature(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('bezier').empty()) {
    this.SetBezier(this.StrToStr(element.attribute('bezier').value()));
    if (removeAttr) element.remove_attribute("bezier");
    hasAttribute = true;
    }
    if (!element.attribute('bulge').empty()) {
    this.SetBulge(this.StrToBulge(element.attribute('bulge').value()));
    if (removeAttr) element.remove_attribute("bulge");
    hasAttribute = true;
    }
    if (!element.attribute('curvedir').empty()) {
    this.SetCurvedir(this.StrToCurvatureCurvedir(element.attribute('curvedir').value()));
    if (removeAttr) element.remove_attribute("curvedir");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteCurvature(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasBezier()) {
    element.append_attribute("bezier").set_value(this.StrToStr(this.GetBezier()));
    wroteAttribute = true;
    }
    if (this.HasBulge()) {
    element.append_attribute("bulge").set_value(this.BulgeToStr(this.GetBulge()));
    wroteAttribute = true;
    }
    if (this.HasCurvedir()) {
    element.append_attribute("curvedir").set_value(this.CurvatureCurvedirToStr(this.GetCurvedir()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasBezier(): boolean {
    return (this.m_bezier != "");
  }

  HasBulge(): boolean {
    return (this.m_bulge.length !== 0);
  }

  HasCurvedir(): boolean {
    return (this.m_curvedir != curvature_CURVEDIR_NONE);
  }

  SetBezier(value: any): void { this.m_bezier = value; }
  SetBulge(value: any): void { this.m_bulge = value; }
  SetCurvedir(value: any): void { this.m_curvedir = value; }

  GetBezier(): any { return this.m_bezier; }
  GetBulge(): any { return this.m_bulge; }
  GetCurvedir(): any { return this.m_curvedir; }

}
export class InstCurvature extends AttCurvature {}

export abstract class AttCustosLog extends Att {
  protected m_target: any;
  constructor() { super(); this.ResetCustosLog(); }

  ResetCustosLog(): void {
    this.m_target = "";
  }

  ReadCustosLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('target').empty()) {
    this.SetTarget(this.StrToStr(element.attribute('target').value()));
    if (removeAttr) element.remove_attribute("target");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteCustosLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTarget()) {
    element.append_attribute("target").set_value(this.StrToStr(this.GetTarget()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasTarget(): boolean {
    return (this.m_target != "");
  }

  SetTarget(value: any): void { this.m_target = value; }

  GetTarget(): any { return this.m_target; }

}
export class InstCustosLog extends AttCustosLog {}

export abstract class AttDataPointing extends Att {
  protected m_data: any;
  constructor() { super(); this.ResetDataPointing(); }

  ResetDataPointing(): void {
    this.m_data = "";
  }

  ReadDataPointing(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('data').empty()) {
    this.SetData(this.StrToStr(element.attribute('data').value()));
    if (removeAttr) element.remove_attribute("data");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteDataPointing(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasData()) {
    element.append_attribute("data").set_value(this.StrToStr(this.GetData()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasData(): boolean {
    return (this.m_data != "");
  }

  SetData(value: any): void { this.m_data = value; }

  GetData(): any { return this.m_data; }

}
export class InstDataPointing extends AttDataPointing {}

export abstract class AttDataSelecting extends Att {
  protected m_select: any;
  constructor() { super(); this.ResetDataSelecting(); }

  ResetDataSelecting(): void {
    this.m_select = "";
  }

  ReadDataSelecting(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('select').empty()) {
    this.SetSelect(this.StrToStr(element.attribute('select').value()));
    if (removeAttr) element.remove_attribute("select");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteDataSelecting(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSelect()) {
    element.append_attribute("select").set_value(this.StrToStr(this.GetSelect()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasSelect(): boolean {
    return (this.m_select != "");
  }

  SetSelect(value: any): void { this.m_select = value; }

  GetSelect(): any { return this.m_select; }

}
export class InstDataSelecting extends AttDataSelecting {}

export abstract class AttDatable extends Att {
  protected m_enddate: any;
  protected m_isodate: any;
  protected m_notafter: any;
  protected m_notbefore: any;
  protected m_startdate: any;
  constructor() { super(); this.ResetDatable(); }

  ResetDatable(): void {
    this.m_enddate = "";
    this.m_isodate = "";
    this.m_notafter = "";
    this.m_notbefore = "";
    this.m_startdate = "";
  }

  ReadDatable(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('enddate').empty()) {
    this.SetEnddate(this.StrToStr(element.attribute('enddate').value()));
    if (removeAttr) element.remove_attribute("enddate");
    hasAttribute = true;
    }
    if (!element.attribute('isodate').empty()) {
    this.SetIsodate(this.StrToStr(element.attribute('isodate').value()));
    if (removeAttr) element.remove_attribute("isodate");
    hasAttribute = true;
    }
    if (!element.attribute('notafter').empty()) {
    this.SetNotafter(this.StrToStr(element.attribute('notafter').value()));
    if (removeAttr) element.remove_attribute("notafter");
    hasAttribute = true;
    }
    if (!element.attribute('notbefore').empty()) {
    this.SetNotbefore(this.StrToStr(element.attribute('notbefore').value()));
    if (removeAttr) element.remove_attribute("notbefore");
    hasAttribute = true;
    }
    if (!element.attribute('startdate').empty()) {
    this.SetStartdate(this.StrToStr(element.attribute('startdate').value()));
    if (removeAttr) element.remove_attribute("startdate");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteDatable(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasEnddate()) {
    element.append_attribute("enddate").set_value(this.StrToStr(this.GetEnddate()));
    wroteAttribute = true;
    }
    if (this.HasIsodate()) {
    element.append_attribute("isodate").set_value(this.StrToStr(this.GetIsodate()));
    wroteAttribute = true;
    }
    if (this.HasNotafter()) {
    element.append_attribute("notafter").set_value(this.StrToStr(this.GetNotafter()));
    wroteAttribute = true;
    }
    if (this.HasNotbefore()) {
    element.append_attribute("notbefore").set_value(this.StrToStr(this.GetNotbefore()));
    wroteAttribute = true;
    }
    if (this.HasStartdate()) {
    element.append_attribute("startdate").set_value(this.StrToStr(this.GetStartdate()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasEnddate(): boolean {
    return (this.m_enddate != "");
  }

  HasIsodate(): boolean {
    return (this.m_isodate != "");
  }

  HasNotafter(): boolean {
    return (this.m_notafter != "");
  }

  HasNotbefore(): boolean {
    return (this.m_notbefore != "");
  }

  HasStartdate(): boolean {
    return (this.m_startdate != "");
  }

  SetEnddate(value: any): void { this.m_enddate = value; }
  SetIsodate(value: any): void { this.m_isodate = value; }
  SetNotafter(value: any): void { this.m_notafter = value; }
  SetNotbefore(value: any): void { this.m_notbefore = value; }
  SetStartdate(value: any): void { this.m_startdate = value; }

  GetEnddate(): any { return this.m_enddate; }
  GetIsodate(): any { return this.m_isodate; }
  GetNotafter(): any { return this.m_notafter; }
  GetNotbefore(): any { return this.m_notbefore; }
  GetStartdate(): any { return this.m_startdate; }

}
export class InstDatable extends AttDatable {}

export abstract class AttDistances extends Att {
  protected m_dirDist: any;
  protected m_dynamDist: any;
  protected m_harmDist: any;
  protected m_rehDist: any;
  protected m_tempoDist: any;
  constructor() { super(); this.ResetDistances(); }

  ResetDistances(): void {
    this.m_dirDist = new c.data_MEASUREMENTSIGNED();
    this.m_dynamDist = new c.data_MEASUREMENTSIGNED();
    this.m_harmDist = new c.data_MEASUREMENTSIGNED();
    this.m_rehDist = new c.data_MEASUREMENTSIGNED();
    this.m_tempoDist = new c.data_MEASUREMENTSIGNED();
  }

  ReadDistances(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('dir.dist').empty()) {
    this.SetDirDist(this.StrToMeasurementsigned(element.attribute('dir.dist').value()));
    if (removeAttr) element.remove_attribute("dir.dist");
    hasAttribute = true;
    }
    if (!element.attribute('dynam.dist').empty()) {
    this.SetDynamDist(this.StrToMeasurementsigned(element.attribute('dynam.dist').value()));
    if (removeAttr) element.remove_attribute("dynam.dist");
    hasAttribute = true;
    }
    if (!element.attribute('harm.dist').empty()) {
    this.SetHarmDist(this.StrToMeasurementsigned(element.attribute('harm.dist').value()));
    if (removeAttr) element.remove_attribute("harm.dist");
    hasAttribute = true;
    }
    if (!element.attribute('reh.dist').empty()) {
    this.SetRehDist(this.StrToMeasurementsigned(element.attribute('reh.dist').value()));
    if (removeAttr) element.remove_attribute("reh.dist");
    hasAttribute = true;
    }
    if (!element.attribute('tempo.dist').empty()) {
    this.SetTempoDist(this.StrToMeasurementsigned(element.attribute('tempo.dist').value()));
    if (removeAttr) element.remove_attribute("tempo.dist");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteDistances(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDirDist()) {
    element.append_attribute("dir.dist").set_value(this.MeasurementsignedToStr(this.GetDirDist()));
    wroteAttribute = true;
    }
    if (this.HasDynamDist()) {
    element.append_attribute("dynam.dist").set_value(this.MeasurementsignedToStr(this.GetDynamDist()));
    wroteAttribute = true;
    }
    if (this.HasHarmDist()) {
    element.append_attribute("harm.dist").set_value(this.MeasurementsignedToStr(this.GetHarmDist()));
    wroteAttribute = true;
    }
    if (this.HasRehDist()) {
    element.append_attribute("reh.dist").set_value(this.MeasurementsignedToStr(this.GetRehDist()));
    wroteAttribute = true;
    }
    if (this.HasTempoDist()) {
    element.append_attribute("tempo.dist").set_value(this.MeasurementsignedToStr(this.GetTempoDist()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasDirDist(): boolean {
    return (this.m_dirDist?.HasValue?.() === true);
  }

  HasDynamDist(): boolean {
    return (this.m_dynamDist?.HasValue?.() === true);
  }

  HasHarmDist(): boolean {
    return (this.m_harmDist?.HasValue?.() === true);
  }

  HasRehDist(): boolean {
    return (this.m_rehDist?.HasValue?.() === true);
  }

  HasTempoDist(): boolean {
    return (this.m_tempoDist?.HasValue?.() === true);
  }

  SetDirDist(value: any): void { this.m_dirDist = value; }
  SetDynamDist(value: any): void { this.m_dynamDist = value; }
  SetHarmDist(value: any): void { this.m_harmDist = value; }
  SetRehDist(value: any): void { this.m_rehDist = value; }
  SetTempoDist(value: any): void { this.m_tempoDist = value; }

  GetDirDist(): any { return this.m_dirDist; }
  GetDynamDist(): any { return this.m_dynamDist; }
  GetHarmDist(): any { return this.m_harmDist; }
  GetRehDist(): any { return this.m_rehDist; }
  GetTempoDist(): any { return this.m_tempoDist; }

}
export class InstDistances extends AttDistances {}

export abstract class AttDocStatus extends Att {
  protected m_status: any;
  constructor() { super(); this.ResetDocStatus(); }

  ResetDocStatus(): void {
    this.m_status = "";
  }

  ReadDocStatus(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('status').empty()) {
    this.SetStatus(this.StrToStr(element.attribute('status').value()));
    if (removeAttr) element.remove_attribute("status");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteDocStatus(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasStatus()) {
    element.append_attribute("status").set_value(this.StrToStr(this.GetStatus()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasStatus(): boolean {
    return (this.m_status != "");
  }

  SetStatus(value: any): void { this.m_status = value; }

  GetStatus(): any { return this.m_status; }

}
export class InstDocStatus extends AttDocStatus {}

export abstract class AttDotLog extends Att {
  protected m_form: any;
  constructor() { super(); this.ResetDotLog(); }

  ResetDotLog(): void {
    this.m_form = dotLog_FORM_NONE;
  }

  ReadDotLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('form').empty()) {
    this.SetForm(this.StrToDotLogForm(element.attribute('form').value()));
    if (removeAttr) element.remove_attribute("form");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteDotLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) {
    element.append_attribute("form").set_value(this.DotLogFormToStr(this.GetForm()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasForm(): boolean {
    return (this.m_form != dotLog_FORM_NONE);
  }

  SetForm(value: any): void { this.m_form = value; }

  GetForm(): any { return this.m_form; }

}
export class InstDotLog extends AttDotLog {}

export abstract class AttDurationAdditive extends Att {
  protected m_dur: any;
  constructor() { super(); this.ResetDurationAdditive(); }

  ResetDurationAdditive(): void {
    this.m_dur = c.DURATION_NONE;
  }

  ReadDurationAdditive(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('dur').empty()) {
    this.SetDur(this.StrToDuration(element.attribute('dur').value()));
    if (removeAttr) element.remove_attribute("dur");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteDurationAdditive(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDur()) {
    element.append_attribute("dur").set_value(this.DurationToStr(this.GetDur()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasDur(): boolean {
    return (this.m_dur != c.DURATION_NONE);
  }

  SetDur(value: any): void { this.m_dur = value; }

  GetDur(): any { return this.m_dur; }

}
export class InstDurationAdditive extends AttDurationAdditive {}

export abstract class AttDurationDefault extends Att {
  protected m_durDefault: any;
  protected m_numDefault: any;
  protected m_numbaseDefault: any;
  constructor() { super(); this.ResetDurationDefault(); }

  ResetDurationDefault(): void {
    this.m_durDefault = c.DURATION_NONE;
    this.m_numDefault = MEI_UNSET;
    this.m_numbaseDefault = MEI_UNSET;
  }

  ReadDurationDefault(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('dur.default').empty()) {
    this.SetDurDefault(this.StrToDuration(element.attribute('dur.default').value()));
    if (removeAttr) element.remove_attribute("dur.default");
    hasAttribute = true;
    }
    if (!element.attribute('num.default').empty()) {
    this.SetNumDefault(this.StrToInt(element.attribute('num.default').value()));
    if (removeAttr) element.remove_attribute("num.default");
    hasAttribute = true;
    }
    if (!element.attribute('numbase.default').empty()) {
    this.SetNumbaseDefault(this.StrToInt(element.attribute('numbase.default').value()));
    if (removeAttr) element.remove_attribute("numbase.default");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteDurationDefault(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDurDefault()) {
    element.append_attribute("dur.default").set_value(this.DurationToStr(this.GetDurDefault()));
    wroteAttribute = true;
    }
    if (this.HasNumDefault()) {
    element.append_attribute("num.default").set_value(this.IntToStr(this.GetNumDefault()));
    wroteAttribute = true;
    }
    if (this.HasNumbaseDefault()) {
    element.append_attribute("numbase.default").set_value(this.IntToStr(this.GetNumbaseDefault()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasDurDefault(): boolean {
    return (this.m_durDefault != c.DURATION_NONE);
  }

  HasNumDefault(): boolean {
    return (this.m_numDefault != MEI_UNSET);
  }

  HasNumbaseDefault(): boolean {
    return (this.m_numbaseDefault != MEI_UNSET);
  }

  SetDurDefault(value: any): void { this.m_durDefault = value; }
  SetNumDefault(value: any): void { this.m_numDefault = value; }
  SetNumbaseDefault(value: any): void { this.m_numbaseDefault = value; }

  GetDurDefault(): any { return this.m_durDefault; }
  GetNumDefault(): any { return this.m_numDefault; }
  GetNumbaseDefault(): any { return this.m_numbaseDefault; }

}
export class InstDurationDefault extends AttDurationDefault {}

export abstract class AttDurationLog extends Att {
  protected m_dur: any;
  constructor() { super(); this.ResetDurationLog(); }

  ResetDurationLog(): void {
    this.m_dur = c.DURATION_NONE;
  }

  ReadDurationLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('dur').empty()) {
    this.SetDur(this.StrToDuration(element.attribute('dur').value()));
    if (removeAttr) element.remove_attribute("dur");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteDurationLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDur()) {
    element.append_attribute("dur").set_value(this.DurationToStr(this.GetDur()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasDur(): boolean {
    return (this.m_dur != c.DURATION_NONE);
  }

  SetDur(value: any): void { this.m_dur = value; }

  GetDur(): any { return this.m_dur; }

}
export class InstDurationLog extends AttDurationLog {}

export abstract class AttDurationRatio extends Att {
  protected m_num: any;
  protected m_numbase: any;
  constructor() { super(); this.ResetDurationRatio(); }

  ResetDurationRatio(): void {
    this.m_num = MEI_UNSET;
    this.m_numbase = MEI_UNSET;
  }

  ReadDurationRatio(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('num').empty()) {
    this.SetNum(this.StrToInt(element.attribute('num').value()));
    if (removeAttr) element.remove_attribute("num");
    hasAttribute = true;
    }
    if (!element.attribute('numbase').empty()) {
    this.SetNumbase(this.StrToInt(element.attribute('numbase').value()));
    if (removeAttr) element.remove_attribute("numbase");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteDurationRatio(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasNum()) {
    element.append_attribute("num").set_value(this.IntToStr(this.GetNum()));
    wroteAttribute = true;
    }
    if (this.HasNumbase()) {
    element.append_attribute("numbase").set_value(this.IntToStr(this.GetNumbase()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasNum(): boolean {
    return (this.m_num != MEI_UNSET);
  }

  HasNumbase(): boolean {
    return (this.m_numbase != MEI_UNSET);
  }

  SetNum(value: any): void { this.m_num = value; }
  SetNumbase(value: any): void { this.m_numbase = value; }

  GetNum(): any { return this.m_num; }
  GetNumbase(): any { return this.m_numbase; }

}
export class InstDurationRatio extends AttDurationRatio {}

export abstract class AttEnclosingChars extends Att {
  protected m_enclose: any;
  constructor() { super(); this.ResetEnclosingChars(); }

  ResetEnclosingChars(): void {
    this.m_enclose = ENCLOSURE_NONE;
  }

  ReadEnclosingChars(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('enclose').empty()) {
    this.SetEnclose(this.StrToEnclosure(element.attribute('enclose').value()));
    if (removeAttr) element.remove_attribute("enclose");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteEnclosingChars(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasEnclose()) {
    element.append_attribute("enclose").set_value(this.EnclosureToStr(this.GetEnclose()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasEnclose(): boolean {
    return (this.m_enclose != ENCLOSURE_NONE);
  }

  SetEnclose(value: any): void { this.m_enclose = value; }

  GetEnclose(): any { return this.m_enclose; }

}
export class InstEnclosingChars extends AttEnclosingChars {}

export abstract class AttEndings extends Att {
  protected m_endingRend: any;
  constructor() { super(); this.ResetEndings(); }

  ResetEndings(): void {
    this.m_endingRend = endings_ENDINGREND_NONE;
  }

  ReadEndings(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('ending.rend').empty()) {
    this.SetEndingRend(this.StrToEndingsEndingrend(element.attribute('ending.rend').value()));
    if (removeAttr) element.remove_attribute("ending.rend");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteEndings(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasEndingRend()) {
    element.append_attribute("ending.rend").set_value(this.EndingsEndingrendToStr(this.GetEndingRend()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasEndingRend(): boolean {
    return (this.m_endingRend != endings_ENDINGREND_NONE);
  }

  SetEndingRend(value: any): void { this.m_endingRend = value; }

  GetEndingRend(): any { return this.m_endingRend; }

}
export class InstEndings extends AttEndings {}

export abstract class AttEvidence extends Att {
  protected m_cert: any;
  protected m_evidence: any;
  constructor() { super(); this.ResetEvidence(); }

  ResetEvidence(): void {
    this.m_cert = CERTAINTY_NONE;
    this.m_evidence = "";
  }

  ReadEvidence(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('cert').empty()) {
    this.SetCert(this.StrToCertainty(element.attribute('cert').value()));
    if (removeAttr) element.remove_attribute("cert");
    hasAttribute = true;
    }
    if (!element.attribute('evidence').empty()) {
    this.SetEvidence(this.StrToStr(element.attribute('evidence').value()));
    if (removeAttr) element.remove_attribute("evidence");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteEvidence(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCert()) {
    element.append_attribute("cert").set_value(this.CertaintyToStr(this.GetCert()));
    wroteAttribute = true;
    }
    if (this.HasEvidence()) {
    element.append_attribute("evidence").set_value(this.StrToStr(this.GetEvidence()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasCert(): boolean {
    return (this.m_cert != CERTAINTY_NONE);
  }

  HasEvidence(): boolean {
    return (this.m_evidence != "");
  }

  SetCert(value: any): void { this.m_cert = value; }
  SetEvidence(value: any): void { this.m_evidence = value; }

  GetCert(): any { return this.m_cert; }
  GetEvidence(): any { return this.m_evidence; }

}
export class InstEvidence extends AttEvidence {}

export abstract class AttExtender extends Att {
  protected m_extender: any;
  constructor() { super(); this.ResetExtender(); }

  ResetExtender(): void {
    this.m_extender = BOOLEAN_NONE;
  }

  ReadExtender(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('extender').empty()) {
    this.SetExtender(this.StrToBoolean(element.attribute('extender').value()));
    if (removeAttr) element.remove_attribute("extender");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteExtender(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasExtender()) {
    element.append_attribute("extender").set_value(this.BooleanToStr(this.GetExtender()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasExtender(): boolean {
    return (this.m_extender != BOOLEAN_NONE);
  }

  SetExtender(value: any): void { this.m_extender = value; }

  GetExtender(): any { return this.m_extender; }

}
export class InstExtender extends AttExtender {}

export abstract class AttExtent extends Att {
  protected m_extent: any;
  constructor() { super(); this.ResetExtent(); }

  ResetExtent(): void {
    this.m_extent = "";
  }

  ReadExtent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('extent').empty()) {
    this.SetExtent(this.StrToStr(element.attribute('extent').value()));
    if (removeAttr) element.remove_attribute("extent");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteExtent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasExtent()) {
    element.append_attribute("extent").set_value(this.StrToStr(this.GetExtent()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasExtent(): boolean {
    return (this.m_extent != "");
  }

  SetExtent(value: any): void { this.m_extent = value; }

  GetExtent(): any { return this.m_extent; }

}
export class InstExtent extends AttExtent {}

export abstract class AttFermataPresent extends Att {
  protected m_fermata: any;
  constructor() { super(); this.ResetFermataPresent(); }

  ResetFermataPresent(): void {
    this.m_fermata = c.STAFFREL_basic_NONE;
  }

  ReadFermataPresent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('fermata').empty()) {
    this.SetFermata(this.StrToStaffrelBasic(element.attribute('fermata').value()));
    if (removeAttr) element.remove_attribute("fermata");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteFermataPresent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasFermata()) {
    element.append_attribute("fermata").set_value(this.StaffrelBasicToStr(this.GetFermata()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasFermata(): boolean {
    return (this.m_fermata != c.STAFFREL_basic_NONE);
  }

  SetFermata(value: any): void { this.m_fermata = value; }

  GetFermata(): any { return this.m_fermata; }

}
export class InstFermataPresent extends AttFermataPresent {}

export abstract class AttFiling extends Att {
  protected m_nonfiling: any;
  constructor() { super(); this.ResetFiling(); }

  ResetFiling(): void {
    this.m_nonfiling = MEI_UNSET;
  }

  ReadFiling(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('nonfiling').empty()) {
    this.SetNonfiling(this.StrToInt(element.attribute('nonfiling').value()));
    if (removeAttr) element.remove_attribute("nonfiling");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteFiling(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasNonfiling()) {
    element.append_attribute("nonfiling").set_value(this.IntToStr(this.GetNonfiling()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasNonfiling(): boolean {
    return (this.m_nonfiling != MEI_UNSET);
  }

  SetNonfiling(value: any): void { this.m_nonfiling = value; }

  GetNonfiling(): any { return this.m_nonfiling; }

}
export class InstFiling extends AttFiling {}

export abstract class AttFormework extends Att {
  protected m_func: any;
  constructor() { super(); this.ResetFormework(); }

  ResetFormework(): void {
    this.m_func = PGFUNC_NONE;
  }

  ReadFormework(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('func').empty()) {
    this.SetFunc(this.StrToPgfunc(element.attribute('func').value()));
    if (removeAttr) element.remove_attribute("func");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteFormework(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasFunc()) {
    element.append_attribute("func").set_value(this.PgfuncToStr(this.GetFunc()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasFunc(): boolean {
    return (this.m_func != PGFUNC_NONE);
  }

  SetFunc(value: any): void { this.m_func = value; }

  GetFunc(): any { return this.m_func; }

}
export class InstFormework extends AttFormework {}

export abstract class AttGrpSymLog extends Att {
  protected m_level: any;
  constructor() { super(); this.ResetGrpSymLog(); }

  ResetGrpSymLog(): void {
    this.m_level = MEI_UNSET;
  }

  ReadGrpSymLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('level').empty()) {
    this.SetLevel(this.StrToInt(element.attribute('level').value()));
    if (removeAttr) element.remove_attribute("level");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteGrpSymLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLevel()) {
    element.append_attribute("level").set_value(this.IntToStr(this.GetLevel()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasLevel(): boolean {
    return (this.m_level != MEI_UNSET);
  }

  SetLevel(value: any): void { this.m_level = value; }

  GetLevel(): any { return this.m_level; }

}
export class InstGrpSymLog extends AttGrpSymLog {}

export abstract class AttHandIdent extends Att {
  protected m_hand: any;
  constructor() { super(); this.ResetHandIdent(); }

  ResetHandIdent(): void {
    this.m_hand = "";
  }

  ReadHandIdent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('hand').empty()) {
    this.SetHand(this.StrToStr(element.attribute('hand').value()));
    if (removeAttr) element.remove_attribute("hand");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteHandIdent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasHand()) {
    element.append_attribute("hand").set_value(this.StrToStr(this.GetHand()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasHand(): boolean {
    return (this.m_hand != "");
  }

  SetHand(value: any): void { this.m_hand = value; }

  GetHand(): any { return this.m_hand; }

}
export class InstHandIdent extends AttHandIdent {}

export abstract class AttHeight extends Att {
  protected m_height: any;
  constructor() { super(); this.ResetHeight(); }

  ResetHeight(): void {
    this.m_height = new data_MEASUREMENTUNSIGNED();
  }

  ReadHeight(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('height').empty()) {
    this.SetHeight(this.StrToMeasurementunsigned(element.attribute('height').value()));
    if (removeAttr) element.remove_attribute("height");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteHeight(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasHeight()) {
    element.append_attribute("height").set_value(this.MeasurementunsignedToStr(this.GetHeight()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasHeight(): boolean {
    return (this.m_height?.HasValue?.() === true);
  }

  SetHeight(value: any): void { this.m_height = value; }

  GetHeight(): any { return this.m_height; }

}
export class InstHeight extends AttHeight {}

export abstract class AttHorizontalAlign extends Att {
  protected m_halign: any;
  constructor() { super(); this.ResetHorizontalAlign(); }

  ResetHorizontalAlign(): void {
    this.m_halign = HORIZONTALALIGNMENT_NONE;
  }

  ReadHorizontalAlign(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('halign').empty()) {
    this.SetHalign(this.StrToHorizontalalignment(element.attribute('halign').value()));
    if (removeAttr) element.remove_attribute("halign");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteHorizontalAlign(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasHalign()) {
    element.append_attribute("halign").set_value(this.HorizontalalignmentToStr(this.GetHalign()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasHalign(): boolean {
    return (this.m_halign != HORIZONTALALIGNMENT_NONE);
  }

  SetHalign(value: any): void { this.m_halign = value; }

  GetHalign(): any { return this.m_halign; }

}
export class InstHorizontalAlign extends AttHorizontalAlign {}

export abstract class AttInternetMedia extends Att {
  protected m_mimetype: any;
  constructor() { super(); this.ResetInternetMedia(); }

  ResetInternetMedia(): void {
    this.m_mimetype = "";
  }

  ReadInternetMedia(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('mimetype').empty()) {
    this.SetMimetype(this.StrToStr(element.attribute('mimetype').value()));
    if (removeAttr) element.remove_attribute("mimetype");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteInternetMedia(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMimetype()) {
    element.append_attribute("mimetype").set_value(this.StrToStr(this.GetMimetype()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasMimetype(): boolean {
    return (this.m_mimetype != "");
  }

  SetMimetype(value: any): void { this.m_mimetype = value; }

  GetMimetype(): any { return this.m_mimetype; }

}
export class InstInternetMedia extends AttInternetMedia {}

export abstract class AttJoined extends Att {
  protected m_join: any;
  constructor() { super(); this.ResetJoined(); }

  ResetJoined(): void {
    this.m_join = "";
  }

  ReadJoined(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('join').empty()) {
    this.SetJoin(this.StrToStr(element.attribute('join').value()));
    if (removeAttr) element.remove_attribute("join");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteJoined(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasJoin()) {
    element.append_attribute("join").set_value(this.StrToStr(this.GetJoin()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasJoin(): boolean {
    return (this.m_join != "");
  }

  SetJoin(value: any): void { this.m_join = value; }

  GetJoin(): any { return this.m_join; }

}
export class InstJoined extends AttJoined {}

export abstract class AttKeySigLog extends Att {
  protected m_sig: any;
  constructor() { super(); this.ResetKeySigLog(); }

  ResetKeySigLog(): void {
    this.m_sig = [-1, c.ACCIDENTAL_WRITTEN_NONE];
  }

  ReadKeySigLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('sig').empty()) {
    this.SetSig(this.StrToKeysignature(element.attribute('sig').value()));
    if (removeAttr) element.remove_attribute("sig");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteKeySigLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSig()) {
    element.append_attribute("sig").set_value(this.KeysignatureToStr(this.GetSig()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasSig(): boolean {
    return !Array.isArray(this.m_sig) || this.m_sig.length !== 2 || this.m_sig[0] !== -1 || this.m_sig[1] !== c.ACCIDENTAL_WRITTEN_NONE;
  }

  SetSig(value: any): void { this.m_sig = value; }

  GetSig(): any { return this.m_sig; }

}
export class InstKeySigLog extends AttKeySigLog {}

export abstract class AttKeySigDefaultLog extends Att {
  protected m_keysig: any;
  constructor() { super(); this.ResetKeySigDefaultLog(); }

  ResetKeySigDefaultLog(): void {
    this.m_keysig = [-1, c.ACCIDENTAL_WRITTEN_NONE];
  }

  ReadKeySigDefaultLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('keysig').empty()) {
    this.SetKeysig(this.StrToKeysignature(element.attribute('keysig').value()));
    if (removeAttr) element.remove_attribute("keysig");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteKeySigDefaultLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasKeysig()) {
    element.append_attribute("keysig").set_value(this.KeysignatureToStr(this.GetKeysig()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasKeysig(): boolean {
    return !Array.isArray(this.m_keysig) || this.m_keysig.length !== 2 || this.m_keysig[0] !== -1 || this.m_keysig[1] !== c.ACCIDENTAL_WRITTEN_NONE;
  }

  SetKeysig(value: any): void { this.m_keysig = value; }

  GetKeysig(): any { return this.m_keysig; }

}
export class InstKeySigDefaultLog extends AttKeySigDefaultLog {}

export abstract class AttLabelled extends Att {
  protected m_label: any;
  constructor() { super(); this.ResetLabelled(); }

  ResetLabelled(): void {
    this.m_label = "";
  }

  ReadLabelled(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('label').empty()) {
    this.SetLabel(this.StrToStr(element.attribute('label').value()));
    if (removeAttr) element.remove_attribute("label");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteLabelled(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLabel()) {
    element.append_attribute("label").set_value(this.StrToStr(this.GetLabel()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasLabel(): boolean {
    return (this.m_label != "");
  }

  SetLabel(value: any): void { this.m_label = value; }

  GetLabel(): any { return this.m_label; }

}
export class InstLabelled extends AttLabelled {}

export abstract class AttLang extends Att {
  protected m_lang: any;
  protected m_translit: any;
  constructor() { super(); this.ResetLang(); }

  ResetLang(): void {
    this.m_lang = "";
    this.m_translit = "";
  }

  ReadLang(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('xml:lang').empty()) {
    this.SetLang(this.StrToStr(element.attribute('xml:lang').value()));
    if (removeAttr) element.remove_attribute("xml:lang");
    hasAttribute = true;
    }
    if (!element.attribute('translit').empty()) {
    this.SetTranslit(this.StrToStr(element.attribute('translit').value()));
    if (removeAttr) element.remove_attribute("translit");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteLang(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLang()) {
    element.append_attribute("xml:lang").set_value(this.StrToStr(this.GetLang()));
    wroteAttribute = true;
    }
    if (this.HasTranslit()) {
    element.append_attribute("translit").set_value(this.StrToStr(this.GetTranslit()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasLang(): boolean {
    return (this.m_lang != "");
  }

  HasTranslit(): boolean {
    return (this.m_translit != "");
  }

  SetLang(value: any): void { this.m_lang = value; }
  SetTranslit(value: any): void { this.m_translit = value; }

  GetLang(): any { return this.m_lang; }
  GetTranslit(): any { return this.m_translit; }

}
export class InstLang extends AttLang {}

export abstract class AttLayerLog extends Att {
  protected m_def: any;
  constructor() { super(); this.ResetLayerLog(); }

  ResetLayerLog(): void {
    this.m_def = "";
  }

  ReadLayerLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('def').empty()) {
    this.SetDef(this.StrToStr(element.attribute('def').value()));
    if (removeAttr) element.remove_attribute("def");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteLayerLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDef()) {
    element.append_attribute("def").set_value(this.StrToStr(this.GetDef()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasDef(): boolean {
    return (this.m_def != "");
  }

  SetDef(value: any): void { this.m_def = value; }

  GetDef(): any { return this.m_def; }

}
export class InstLayerLog extends AttLayerLog {}

export abstract class AttLayerIdent extends Att {
  protected m_layer: any;
  constructor() { super(); this.ResetLayerIdent(); }

  ResetLayerIdent(): void {
    this.m_layer = MEI_UNSET;
  }

  ReadLayerIdent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('layer').empty()) {
    this.SetLayer(this.StrToInt(element.attribute('layer').value()));
    if (removeAttr) element.remove_attribute("layer");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteLayerIdent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLayer()) {
    element.append_attribute("layer").set_value(this.IntToStr(this.GetLayer()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasLayer(): boolean {
    return (this.m_layer != MEI_UNSET);
  }

  SetLayer(value: any): void { this.m_layer = value; }

  GetLayer(): any { return this.m_layer; }

}
export class InstLayerIdent extends AttLayerIdent {}

export abstract class AttLineLoc extends Att {
  protected m_line: any;
  constructor() { super(); this.ResetLineLoc(); }

  ResetLineLoc(): void {
    this.m_line = 0;
  }

  ReadLineLoc(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('line').empty()) {
    this.SetLine(this.StrToInt(element.attribute('line').value()));
    if (removeAttr) element.remove_attribute("line");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteLineLoc(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLine()) {
    element.append_attribute("line").set_value(this.IntToStr(this.GetLine()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasLine(): boolean {
    return (this.m_line != 0);
  }

  SetLine(value: any): void { this.m_line = value; }

  GetLine(): any { return this.m_line; }

}
export class InstLineLoc extends AttLineLoc {}

export abstract class AttLineRend extends Att {
  protected m_lendsym: any;
  protected m_lendsymSize: any;
  protected m_lstartsym: any;
  protected m_lstartsymSize: any;
  constructor() { super(); this.ResetLineRend(); }

  ResetLineRend(): void {
    this.m_lendsym = LINESTARTENDSYMBOL_NONE;
    this.m_lendsymSize = MEI_UNSET;
    this.m_lstartsym = LINESTARTENDSYMBOL_NONE;
    this.m_lstartsymSize = MEI_UNSET;
  }

  ReadLineRend(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('lendsym').empty()) {
    this.SetLendsym(this.StrToLinestartendsymbol(element.attribute('lendsym').value()));
    if (removeAttr) element.remove_attribute("lendsym");
    hasAttribute = true;
    }
    if (!element.attribute('lendsym.size').empty()) {
    this.SetLendsymSize(this.StrToInt(element.attribute('lendsym.size').value()));
    if (removeAttr) element.remove_attribute("lendsym.size");
    hasAttribute = true;
    }
    if (!element.attribute('lstartsym').empty()) {
    this.SetLstartsym(this.StrToLinestartendsymbol(element.attribute('lstartsym').value()));
    if (removeAttr) element.remove_attribute("lstartsym");
    hasAttribute = true;
    }
    if (!element.attribute('lstartsym.size').empty()) {
    this.SetLstartsymSize(this.StrToInt(element.attribute('lstartsym.size').value()));
    if (removeAttr) element.remove_attribute("lstartsym.size");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteLineRend(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLendsym()) {
    element.append_attribute("lendsym").set_value(this.LinestartendsymbolToStr(this.GetLendsym()));
    wroteAttribute = true;
    }
    if (this.HasLendsymSize()) {
    element.append_attribute("lendsym.size").set_value(this.IntToStr(this.GetLendsymSize()));
    wroteAttribute = true;
    }
    if (this.HasLstartsym()) {
    element.append_attribute("lstartsym").set_value(this.LinestartendsymbolToStr(this.GetLstartsym()));
    wroteAttribute = true;
    }
    if (this.HasLstartsymSize()) {
    element.append_attribute("lstartsym.size").set_value(this.IntToStr(this.GetLstartsymSize()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasLendsym(): boolean {
    return (this.m_lendsym != LINESTARTENDSYMBOL_NONE);
  }

  HasLendsymSize(): boolean {
    return (this.m_lendsymSize != MEI_UNSET);
  }

  HasLstartsym(): boolean {
    return (this.m_lstartsym != LINESTARTENDSYMBOL_NONE);
  }

  HasLstartsymSize(): boolean {
    return (this.m_lstartsymSize != MEI_UNSET);
  }

  SetLendsym(value: any): void { this.m_lendsym = value; }
  SetLendsymSize(value: any): void { this.m_lendsymSize = value; }
  SetLstartsym(value: any): void { this.m_lstartsym = value; }
  SetLstartsymSize(value: any): void { this.m_lstartsymSize = value; }

  GetLendsym(): any { return this.m_lendsym; }
  GetLendsymSize(): any { return this.m_lendsymSize; }
  GetLstartsym(): any { return this.m_lstartsym; }
  GetLstartsymSize(): any { return this.m_lstartsymSize; }

}
export class InstLineRend extends AttLineRend {}

export abstract class AttLineRendBase extends Att {
  protected m_lform: any;
  protected m_lwidth: any;
  protected m_lsegs: any;
  constructor() { super(); this.ResetLineRendBase(); }

  ResetLineRendBase(): void {
    this.m_lform = LINEFORM_NONE;
    this.m_lwidth = new c.data_LINEWIDTH();
    this.m_lsegs = MEI_UNSET;
  }

  ReadLineRendBase(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('lform').empty()) {
    this.SetLform(this.StrToLineform(element.attribute('lform').value()));
    if (removeAttr) element.remove_attribute("lform");
    hasAttribute = true;
    }
    if (!element.attribute('lwidth').empty()) {
    this.SetLwidth(this.StrToLinewidth(element.attribute('lwidth').value()));
    if (removeAttr) element.remove_attribute("lwidth");
    hasAttribute = true;
    }
    if (!element.attribute('lsegs').empty()) {
    this.SetLsegs(this.StrToInt(element.attribute('lsegs').value()));
    if (removeAttr) element.remove_attribute("lsegs");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteLineRendBase(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLform()) {
    element.append_attribute("lform").set_value(this.LineformToStr(this.GetLform()));
    wroteAttribute = true;
    }
    if (this.HasLwidth()) {
    element.append_attribute("lwidth").set_value(this.LinewidthToStr(this.GetLwidth()));
    wroteAttribute = true;
    }
    if (this.HasLsegs()) {
    element.append_attribute("lsegs").set_value(this.IntToStr(this.GetLsegs()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasLform(): boolean {
    return (this.m_lform != LINEFORM_NONE);
  }

  HasLwidth(): boolean {
    return typeof this.m_lwidth?.HasValue === 'function' ? this.m_lwidth.HasValue() : this.m_lwidth != null && this.m_lwidth != LINEFORM_NONE;
  }

  HasLsegs(): boolean {
    return (this.m_lsegs != MEI_UNSET);
  }

  SetLform(value: any): void { this.m_lform = value; }
  SetLwidth(value: any): void { this.m_lwidth = value; }
  SetLsegs(value: any): void { this.m_lsegs = value; }

  GetLform(): any { return this.m_lform; }
  GetLwidth(): any { return this.m_lwidth; }
  GetLsegs(): any { return this.m_lsegs; }

}
export class InstLineRendBase extends AttLineRendBase {}

export abstract class AttLinking extends Att {
  protected m_copyof: any;
  protected m_corresp: any;
  protected m_follows: any;
  protected m_next: any;
  protected m_precedes: any;
  protected m_prev: any;
  protected m_sameas: any;
  protected m_synch: any;
  constructor() { super(); this.ResetLinking(); }

  ResetLinking(): void {
    this.m_copyof = "";
    this.m_corresp = "";
    this.m_follows = "";
    this.m_next = "";
    this.m_precedes = "";
    this.m_prev = "";
    this.m_sameas = "";
    this.m_synch = "";
  }

  ReadLinking(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('copyof').empty()) {
    this.SetCopyof(this.StrToStr(element.attribute('copyof').value()));
    if (removeAttr) element.remove_attribute("copyof");
    hasAttribute = true;
    }
    if (!element.attribute('corresp').empty()) {
    this.SetCorresp(this.StrToStr(element.attribute('corresp').value()));
    if (removeAttr) element.remove_attribute("corresp");
    hasAttribute = true;
    }
    if (!element.attribute('follows').empty()) {
    this.SetFollows(this.StrToStr(element.attribute('follows').value()));
    if (removeAttr) element.remove_attribute("follows");
    hasAttribute = true;
    }
    if (!element.attribute('next').empty()) {
    this.SetNext(this.StrToStr(element.attribute('next').value()));
    if (removeAttr) element.remove_attribute("next");
    hasAttribute = true;
    }
    if (!element.attribute('precedes').empty()) {
    this.SetPrecedes(this.StrToStr(element.attribute('precedes').value()));
    if (removeAttr) element.remove_attribute("precedes");
    hasAttribute = true;
    }
    if (!element.attribute('prev').empty()) {
    this.SetPrev(this.StrToStr(element.attribute('prev').value()));
    if (removeAttr) element.remove_attribute("prev");
    hasAttribute = true;
    }
    if (!element.attribute('sameas').empty()) {
    this.SetSameas(this.StrToStr(element.attribute('sameas').value()));
    if (removeAttr) element.remove_attribute("sameas");
    hasAttribute = true;
    }
    if (!element.attribute('synch').empty()) {
    this.SetSynch(this.StrToStr(element.attribute('synch').value()));
    if (removeAttr) element.remove_attribute("synch");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteLinking(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCopyof()) {
    element.append_attribute("copyof").set_value(this.StrToStr(this.GetCopyof()));
    wroteAttribute = true;
    }
    if (this.HasCorresp()) {
    element.append_attribute("corresp").set_value(this.StrToStr(this.GetCorresp()));
    wroteAttribute = true;
    }
    if (this.HasFollows()) {
    element.append_attribute("follows").set_value(this.StrToStr(this.GetFollows()));
    wroteAttribute = true;
    }
    if (this.HasNext()) {
    element.append_attribute("next").set_value(this.StrToStr(this.GetNext()));
    wroteAttribute = true;
    }
    if (this.HasPrecedes()) {
    element.append_attribute("precedes").set_value(this.StrToStr(this.GetPrecedes()));
    wroteAttribute = true;
    }
    if (this.HasPrev()) {
    element.append_attribute("prev").set_value(this.StrToStr(this.GetPrev()));
    wroteAttribute = true;
    }
    if (this.HasSameas()) {
    element.append_attribute("sameas").set_value(this.StrToStr(this.GetSameas()));
    wroteAttribute = true;
    }
    if (this.HasSynch()) {
    element.append_attribute("synch").set_value(this.StrToStr(this.GetSynch()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasCopyof(): boolean {
    return (this.m_copyof != "");
  }

  HasCorresp(): boolean {
    return (this.m_corresp != "");
  }

  HasFollows(): boolean {
    return (this.m_follows != "");
  }

  HasNext(): boolean {
    return (this.m_next != "");
  }

  HasPrecedes(): boolean {
    return (this.m_precedes != "");
  }

  HasPrev(): boolean {
    return (this.m_prev != "");
  }

  HasSameas(): boolean {
    return (this.m_sameas != "");
  }

  HasSynch(): boolean {
    return (this.m_synch != "");
  }

  SetCopyof(value: any): void { this.m_copyof = value; }
  SetCorresp(value: any): void { this.m_corresp = value; }
  SetFollows(value: any): void { this.m_follows = value; }
  SetNext(value: any): void { this.m_next = value; }
  SetPrecedes(value: any): void { this.m_precedes = value; }
  SetPrev(value: any): void { this.m_prev = value; }
  SetSameas(value: any): void { this.m_sameas = value; }
  SetSynch(value: any): void { this.m_synch = value; }

  GetCopyof(): any { return this.m_copyof; }
  GetCorresp(): any { return this.m_corresp; }
  GetFollows(): any { return this.m_follows; }
  GetNext(): any { return this.m_next; }
  GetPrecedes(): any { return this.m_precedes; }
  GetPrev(): any { return this.m_prev; }
  GetSameas(): any { return this.m_sameas; }
  GetSynch(): any { return this.m_synch; }

}
export class InstLinking extends AttLinking {}

export abstract class AttLyricStyle extends Att {
  protected m_lyricAlign: any;
  protected m_lyricFam: any;
  protected m_lyricName: any;
  protected m_lyricSize: any;
  protected m_lyricStyle: any;
  protected m_lyricWeight: any;
  constructor() { super(); this.ResetLyricStyle(); }

  ResetLyricStyle(): void {
    this.m_lyricAlign = new c.data_MEASUREMENTSIGNED();
    this.m_lyricFam = "";
    this.m_lyricName = "";
    this.m_lyricSize = new c.data_FONTSIZE();
    this.m_lyricStyle = FONTSTYLE_NONE;
    this.m_lyricWeight = FONTWEIGHT_NONE;
  }

  ReadLyricStyle(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('lyric.align').empty()) {
    this.SetLyricAlign(this.StrToMeasurementsigned(element.attribute('lyric.align').value()));
    if (removeAttr) element.remove_attribute("lyric.align");
    hasAttribute = true;
    }
    if (!element.attribute('lyric.fam').empty()) {
    this.SetLyricFam(this.StrToStr(element.attribute('lyric.fam').value()));
    if (removeAttr) element.remove_attribute("lyric.fam");
    hasAttribute = true;
    }
    if (!element.attribute('lyric.name').empty()) {
    this.SetLyricName(this.StrToStr(element.attribute('lyric.name').value()));
    if (removeAttr) element.remove_attribute("lyric.name");
    hasAttribute = true;
    }
    if (!element.attribute('lyric.size').empty()) {
    this.SetLyricSize(this.StrToFontsize(element.attribute('lyric.size').value()));
    if (removeAttr) element.remove_attribute("lyric.size");
    hasAttribute = true;
    }
    if (!element.attribute('lyric.style').empty()) {
    this.SetLyricStyle(this.StrToFontstyle(element.attribute('lyric.style').value()));
    if (removeAttr) element.remove_attribute("lyric.style");
    hasAttribute = true;
    }
    if (!element.attribute('lyric.weight').empty()) {
    this.SetLyricWeight(this.StrToFontweight(element.attribute('lyric.weight').value()));
    if (removeAttr) element.remove_attribute("lyric.weight");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteLyricStyle(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLyricAlign()) {
    element.append_attribute("lyric.align").set_value(this.MeasurementsignedToStr(this.GetLyricAlign()));
    wroteAttribute = true;
    }
    if (this.HasLyricFam()) {
    element.append_attribute("lyric.fam").set_value(this.StrToStr(this.GetLyricFam()));
    wroteAttribute = true;
    }
    if (this.HasLyricName()) {
    element.append_attribute("lyric.name").set_value(this.StrToStr(this.GetLyricName()));
    wroteAttribute = true;
    }
    if (this.HasLyricSize()) {
    element.append_attribute("lyric.size").set_value(this.FontsizeToStr(this.GetLyricSize()));
    wroteAttribute = true;
    }
    if (this.HasLyricStyle()) {
    element.append_attribute("lyric.style").set_value(this.FontstyleToStr(this.GetLyricStyle()));
    wroteAttribute = true;
    }
    if (this.HasLyricWeight()) {
    element.append_attribute("lyric.weight").set_value(this.FontweightToStr(this.GetLyricWeight()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasLyricAlign(): boolean {
    return (this.m_lyricAlign?.HasValue?.() === true);
  }

  HasLyricFam(): boolean {
    return (this.m_lyricFam != "");
  }

  HasLyricName(): boolean {
    return (this.m_lyricName != "");
  }

  HasLyricSize(): boolean {
    return (this.m_lyricSize.HasValue());
  }

  HasLyricStyle(): boolean {
    return (this.m_lyricStyle != FONTSTYLE_NONE);
  }

  HasLyricWeight(): boolean {
    return (this.m_lyricWeight != FONTWEIGHT_NONE);
  }

  SetLyricAlign(value: any): void { this.m_lyricAlign = value; }
  SetLyricFam(value: any): void { this.m_lyricFam = value; }
  SetLyricName(value: any): void { this.m_lyricName = value; }
  SetLyricSize(value: any): void { this.m_lyricSize = value; }
  SetLyricStyle(value: any): void { this.m_lyricStyle = value; }
  SetLyricWeight(value: any): void { this.m_lyricWeight = value; }

  GetLyricAlign(): any { return this.m_lyricAlign; }
  GetLyricFam(): any { return this.m_lyricFam; }
  GetLyricName(): any { return this.m_lyricName; }
  GetLyricSize(): any { return this.m_lyricSize; }
  GetLyricStyle(): any { return this.m_lyricStyle; }
  GetLyricWeight(): any { return this.m_lyricWeight; }

}
export class InstLyricStyle extends AttLyricStyle {}

export abstract class AttMeasureNumbers extends Att {
  protected m_mnumVisible: any;
  constructor() { super(); this.ResetMeasureNumbers(); }

  ResetMeasureNumbers(): void {
    this.m_mnumVisible = BOOLEAN_NONE;
  }

  ReadMeasureNumbers(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('mnum.visible').empty()) {
    this.SetMnumVisible(this.StrToBoolean(element.attribute('mnum.visible').value()));
    if (removeAttr) element.remove_attribute("mnum.visible");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMeasureNumbers(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMnumVisible()) {
    element.append_attribute("mnum.visible").set_value(this.BooleanToStr(this.GetMnumVisible()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasMnumVisible(): boolean {
    return (this.m_mnumVisible != BOOLEAN_NONE);
  }

  SetMnumVisible(value: any): void { this.m_mnumVisible = value; }

  GetMnumVisible(): any { return this.m_mnumVisible; }

}
export class InstMeasureNumbers extends AttMeasureNumbers {}

export abstract class AttMeasurement extends Att {
  protected m_unit: any;
  constructor() { super(); this.ResetMeasurement(); }

  ResetMeasurement(): void {
    this.m_unit = "";
  }

  ReadMeasurement(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('unit').empty()) {
    this.SetUnit(this.StrToStr(element.attribute('unit').value()));
    if (removeAttr) element.remove_attribute("unit");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMeasurement(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasUnit()) {
    element.append_attribute("unit").set_value(this.StrToStr(this.GetUnit()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasUnit(): boolean {
    return (this.m_unit != "");
  }

  SetUnit(value: any): void { this.m_unit = value; }

  GetUnit(): any { return this.m_unit; }

}
export class InstMeasurement extends AttMeasurement {}

export abstract class AttMediaBounds extends Att {
  protected m_begin: any;
  protected m_end: any;
  protected m_betype: any;
  constructor() { super(); this.ResetMediaBounds(); }

  ResetMediaBounds(): void {
    this.m_begin = "";
    this.m_end = "";
    this.m_betype = BETYPE_NONE;
  }

  ReadMediaBounds(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('begin').empty()) {
    this.SetBegin(this.StrToStr(element.attribute('begin').value()));
    if (removeAttr) element.remove_attribute("begin");
    hasAttribute = true;
    }
    if (!element.attribute('end').empty()) {
    this.SetEnd(this.StrToStr(element.attribute('end').value()));
    if (removeAttr) element.remove_attribute("end");
    hasAttribute = true;
    }
    if (!element.attribute('betype').empty()) {
    this.SetBetype(this.StrToBetype(element.attribute('betype').value()));
    if (removeAttr) element.remove_attribute("betype");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMediaBounds(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasBegin()) {
    element.append_attribute("begin").set_value(this.StrToStr(this.GetBegin()));
    wroteAttribute = true;
    }
    if (this.HasEnd()) {
    element.append_attribute("end").set_value(this.StrToStr(this.GetEnd()));
    wroteAttribute = true;
    }
    if (this.HasBetype()) {
    element.append_attribute("betype").set_value(this.BetypeToStr(this.GetBetype()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasBegin(): boolean {
    return (this.m_begin != "");
  }

  HasEnd(): boolean {
    return (this.m_end != "");
  }

  HasBetype(): boolean {
    return (this.m_betype != BETYPE_NONE);
  }

  SetBegin(value: any): void { this.m_begin = value; }
  SetEnd(value: any): void { this.m_end = value; }
  SetBetype(value: any): void { this.m_betype = value; }

  GetBegin(): any { return this.m_begin; }
  GetEnd(): any { return this.m_end; }
  GetBetype(): any { return this.m_betype; }

}
export class InstMediaBounds extends AttMediaBounds {}

export abstract class AttMedium extends Att {
  protected m_medium: any;
  constructor() { super(); this.ResetMedium(); }

  ResetMedium(): void {
    this.m_medium = "";
  }

  ReadMedium(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('medium').empty()) {
    this.SetMedium(this.StrToStr(element.attribute('medium').value()));
    if (removeAttr) element.remove_attribute("medium");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMedium(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMedium()) {
    element.append_attribute("medium").set_value(this.StrToStr(this.GetMedium()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasMedium(): boolean {
    return (this.m_medium != "");
  }

  SetMedium(value: any): void { this.m_medium = value; }

  GetMedium(): any { return this.m_medium; }

}
export class InstMedium extends AttMedium {}

export abstract class AttMeiVersion extends Att {
  protected m_meiversion: any;
  constructor() { super(); this.ResetMeiVersion(); }

  ResetMeiVersion(): void {
    this.m_meiversion = meiVersion_MEIVERSION_NONE;
  }

  ReadMeiVersion(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('meiversion').empty()) {
    this.SetMeiversion(this.StrToMeiVersionMeiversion(element.attribute('meiversion').value()));
    if (removeAttr) element.remove_attribute("meiversion");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMeiVersion(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMeiversion()) {
    element.append_attribute("meiversion").set_value(this.MeiVersionMeiversionToStr(this.GetMeiversion()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasMeiversion(): boolean {
    return (this.m_meiversion != meiVersion_MEIVERSION_NONE);
  }

  SetMeiversion(value: any): void { this.m_meiversion = value; }

  GetMeiversion(): any { return this.m_meiversion; }

}
export class InstMeiVersion extends AttMeiVersion {}

export abstract class AttMensurLog extends Att {
  protected m_level: any;
  constructor() { super(); this.ResetMensurLog(); }

  ResetMensurLog(): void {
    this.m_level = c.DURATION_NONE;
  }

  ReadMensurLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('level').empty()) {
    this.SetLevel(this.StrToDuration(element.attribute('level').value()));
    if (removeAttr) element.remove_attribute("level");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMensurLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLevel()) {
    element.append_attribute("level").set_value(this.DurationToStr(this.GetLevel()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasLevel(): boolean {
    return (this.m_level != c.DURATION_NONE);
  }

  SetLevel(value: any): void { this.m_level = value; }

  GetLevel(): any { return this.m_level; }

}
export class InstMensurLog extends AttMensurLog {}

export abstract class AttMetadataPointing extends Att {
  protected m_decls: any;
  constructor() { super(); this.ResetMetadataPointing(); }

  ResetMetadataPointing(): void {
    this.m_decls = "";
  }

  ReadMetadataPointing(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('decls').empty()) {
    this.SetDecls(this.StrToStr(element.attribute('decls').value()));
    if (removeAttr) element.remove_attribute("decls");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMetadataPointing(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDecls()) {
    element.append_attribute("decls").set_value(this.StrToStr(this.GetDecls()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasDecls(): boolean {
    return (this.m_decls != "");
  }

  SetDecls(value: any): void { this.m_decls = value; }

  GetDecls(): any { return this.m_decls; }

}
export class InstMetadataPointing extends AttMetadataPointing {}

export abstract class AttMeterConformance extends Att {
  protected m_metcon: any;
  constructor() { super(); this.ResetMeterConformance(); }

  ResetMeterConformance(): void {
    this.m_metcon = meterConformance_METCON_NONE;
  }

  ReadMeterConformance(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('metcon').empty()) {
    this.SetMetcon(this.StrToMeterConformanceMetcon(element.attribute('metcon').value()));
    if (removeAttr) element.remove_attribute("metcon");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMeterConformance(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMetcon()) {
    element.append_attribute("metcon").set_value(this.MeterConformanceMetconToStr(this.GetMetcon()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasMetcon(): boolean {
    return (this.m_metcon != meterConformance_METCON_NONE);
  }

  SetMetcon(value: any): void { this.m_metcon = value; }

  GetMetcon(): any { return this.m_metcon; }

}
export class InstMeterConformance extends AttMeterConformance {}

export abstract class AttMeterConformanceBar extends Att {
  protected m_metcon: any;
  protected m_control: any;
  constructor() { super(); this.ResetMeterConformanceBar(); }

  ResetMeterConformanceBar(): void {
    this.m_metcon = BOOLEAN_NONE;
    this.m_control = BOOLEAN_NONE;
  }

  ReadMeterConformanceBar(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('metcon').empty()) {
    this.SetMetcon(this.StrToBoolean(element.attribute('metcon').value()));
    if (removeAttr) element.remove_attribute("metcon");
    hasAttribute = true;
    }
    if (!element.attribute('control').empty()) {
    this.SetControl(this.StrToBoolean(element.attribute('control').value()));
    if (removeAttr) element.remove_attribute("control");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMeterConformanceBar(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMetcon()) {
    element.append_attribute("metcon").set_value(this.BooleanToStr(this.GetMetcon()));
    wroteAttribute = true;
    }
    if (this.HasControl()) {
    element.append_attribute("control").set_value(this.BooleanToStr(this.GetControl()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasMetcon(): boolean {
    return (this.m_metcon != BOOLEAN_NONE);
  }

  HasControl(): boolean {
    return (this.m_control != BOOLEAN_NONE);
  }

  SetMetcon(value: any): void { this.m_metcon = value; }
  SetControl(value: any): void { this.m_control = value; }

  GetMetcon(): any { return this.m_metcon; }
  GetControl(): any { return this.m_control; }

}
export class InstMeterConformanceBar extends AttMeterConformanceBar {}

export abstract class AttMeterSigLog extends Att {
  protected m_count: any;
  protected m_sym: any;
  protected m_unit: any;
  constructor() { super(); this.ResetMeterSigLog(); }

  ResetMeterSigLog(): void {
    this.m_count = [];
    this.m_sym = METERSIGN_NONE;
    this.m_unit = MEI_UNSET;
  }

  ReadMeterSigLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('count').empty()) {
    this.SetCount(this.StrToMetercountPair(element.attribute('count').value()));
    if (removeAttr) element.remove_attribute("count");
    hasAttribute = true;
    }
    if (!element.attribute('sym').empty()) {
    this.SetSym(this.StrToMetersign(element.attribute('sym').value()));
    if (removeAttr) element.remove_attribute("sym");
    hasAttribute = true;
    }
    if (!element.attribute('unit').empty()) {
    this.SetUnit(this.StrToInt(element.attribute('unit').value()));
    if (removeAttr) element.remove_attribute("unit");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMeterSigLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCount()) {
    element.append_attribute("count").set_value(this.MetercountPairToStr(this.GetCount()));
    wroteAttribute = true;
    }
    if (this.HasSym()) {
    element.append_attribute("sym").set_value(this.MetersignToStr(this.GetSym()));
    wroteAttribute = true;
    }
    if (this.HasUnit()) {
    element.append_attribute("unit").set_value(this.IntToStr(this.GetUnit()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasCount(): boolean {
    return (this.m_count.length !== 0);
  }

  HasSym(): boolean {
    return (this.m_sym != METERSIGN_NONE);
  }

  HasUnit(): boolean {
    return (this.m_unit != MEI_UNSET);
  }

  SetCount(value: any): void { this.m_count = value; }
  /** Keep sym/unit; C++ copy of an empty count leaves HasCount false. */
  ResetMeterSigLogKeepSymUnit(): void { this.m_count = []; }
  SetSym(value: any): void { this.m_sym = value; }
  SetUnit(value: any): void { this.m_unit = value; }

  GetCount(): any { return this.m_count; }
  GetSym(): any { return this.m_sym; }
  GetUnit(): any { return this.m_unit; }

}
export class InstMeterSigLog extends AttMeterSigLog {}

export abstract class AttMeterSigDefaultLog extends Att {
  protected m_meterCount: any;
  protected m_meterUnit: any;
  protected m_meterSym: any;
  constructor() { super(); this.ResetMeterSigDefaultLog(); }

  ResetMeterSigDefaultLog(): void {
    this.m_meterCount = [];
    this.m_meterUnit = MEI_UNSET;
    this.m_meterSym = METERSIGN_NONE;
  }

  ReadMeterSigDefaultLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('meter.count').empty()) {
    this.SetMeterCount(this.StrToMetercountPair(element.attribute('meter.count').value()));
    if (removeAttr) element.remove_attribute("meter.count");
    hasAttribute = true;
    }
    if (!element.attribute('meter.unit').empty()) {
    this.SetMeterUnit(this.StrToInt(element.attribute('meter.unit').value()));
    if (removeAttr) element.remove_attribute("meter.unit");
    hasAttribute = true;
    }
    if (!element.attribute('meter.sym').empty()) {
    this.SetMeterSym(this.StrToMetersign(element.attribute('meter.sym').value()));
    if (removeAttr) element.remove_attribute("meter.sym");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMeterSigDefaultLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMeterCount()) {
    element.append_attribute("meter.count").set_value(this.MetercountPairToStr(this.GetMeterCount()));
    wroteAttribute = true;
    }
    if (this.HasMeterUnit()) {
    element.append_attribute("meter.unit").set_value(this.IntToStr(this.GetMeterUnit()));
    wroteAttribute = true;
    }
    if (this.HasMeterSym()) {
    element.append_attribute("meter.sym").set_value(this.MetersignToStr(this.GetMeterSym()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasMeterCount(): boolean {
    return (this.m_meterCount.length !== 0);
  }

  HasMeterUnit(): boolean {
    return (this.m_meterUnit != MEI_UNSET);
  }

  HasMeterSym(): boolean {
    return (this.m_meterSym != METERSIGN_NONE);
  }

  SetMeterCount(value: any): void { this.m_meterCount = value; }
  SetMeterUnit(value: any): void { this.m_meterUnit = value; }
  SetMeterSym(value: any): void { this.m_meterSym = value; }

  GetMeterCount(): any { return this.m_meterCount; }
  GetMeterUnit(): any { return this.m_meterUnit; }
  GetMeterSym(): any { return this.m_meterSym; }

}
export class InstMeterSigDefaultLog extends AttMeterSigDefaultLog {}

export abstract class AttMmTempo extends Att {
  protected m_mm: any;
  protected m_mmUnit: any;
  protected m_mmDots: any;
  constructor() { super(); this.ResetMmTempo(); }

  ResetMmTempo(): void {
    this.m_mm = 0.0;
    this.m_mmUnit = c.DURATION_NONE;
    this.m_mmDots = MEI_UNSET;
  }

  ReadMmTempo(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('mm').empty()) {
    this.SetMm(this.StrToDbl(element.attribute('mm').value()));
    if (removeAttr) element.remove_attribute("mm");
    hasAttribute = true;
    }
    if (!element.attribute('mm.unit').empty()) {
    this.SetMmUnit(this.StrToDuration(element.attribute('mm.unit').value()));
    if (removeAttr) element.remove_attribute("mm.unit");
    hasAttribute = true;
    }
    if (!element.attribute('mm.dots').empty()) {
    this.SetMmDots(this.StrToInt(element.attribute('mm.dots').value()));
    if (removeAttr) element.remove_attribute("mm.dots");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMmTempo(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMm()) {
    element.append_attribute("mm").set_value(this.DblToStr(this.GetMm()));
    wroteAttribute = true;
    }
    if (this.HasMmUnit()) {
    element.append_attribute("mm.unit").set_value(this.DurationToStr(this.GetMmUnit()));
    wroteAttribute = true;
    }
    if (this.HasMmDots()) {
    element.append_attribute("mm.dots").set_value(this.IntToStr(this.GetMmDots()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasMm(): boolean {
    return (this.m_mm != 0.0);
  }

  HasMmUnit(): boolean {
    return (this.m_mmUnit != c.DURATION_NONE);
  }

  HasMmDots(): boolean {
    return (this.m_mmDots != MEI_UNSET);
  }

  SetMm(value: any): void { this.m_mm = value; }
  SetMmUnit(value: any): void { this.m_mmUnit = value; }
  SetMmDots(value: any): void { this.m_mmDots = value; }

  GetMm(): any { return this.m_mm; }
  GetMmUnit(): any { return this.m_mmUnit; }
  GetMmDots(): any { return this.m_mmDots; }

}
export class InstMmTempo extends AttMmTempo {}

export abstract class AttMultinumMeasures extends Att {
  protected m_multiNumber: any;
  constructor() { super(); this.ResetMultinumMeasures(); }

  ResetMultinumMeasures(): void {
    this.m_multiNumber = BOOLEAN_NONE;
  }

  ReadMultinumMeasures(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('multi.number').empty()) {
    this.SetMultiNumber(this.StrToBoolean(element.attribute('multi.number').value()));
    if (removeAttr) element.remove_attribute("multi.number");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMultinumMeasures(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMultiNumber()) {
    element.append_attribute("multi.number").set_value(this.BooleanToStr(this.GetMultiNumber()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasMultiNumber(): boolean {
    return (this.m_multiNumber != BOOLEAN_NONE);
  }

  SetMultiNumber(value: any): void { this.m_multiNumber = value; }

  GetMultiNumber(): any { return this.m_multiNumber; }

}
export class InstMultinumMeasures extends AttMultinumMeasures {}

export abstract class AttNInteger extends Att {
  protected m_n: any;
  constructor() { super(); this.ResetNInteger(); }

  ResetNInteger(): void {
    this.m_n = MEI_UNSET;
  }

  ReadNInteger(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('n').empty()) {
    this.SetN(this.StrToInt(element.attribute('n').value()));
    if (removeAttr) element.remove_attribute("n");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteNInteger(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasN()) {
    element.append_attribute("n").set_value(this.IntToStr(this.GetN()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasN(): boolean {
    return (this.m_n != MEI_UNSET);
  }

  SetN(value: any): void { this.m_n = value; }

  GetN(): any { return this.m_n; }

}
export class InstNInteger extends AttNInteger {}

export abstract class AttNNumberLike extends Att {
  protected m_n: any;
  constructor() { super(); this.ResetNNumberLike(); }

  ResetNNumberLike(): void {
    this.m_n = "";
  }

  ReadNNumberLike(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('n').empty()) {
    this.SetN(this.StrToStr(element.attribute('n').value()));
    if (removeAttr) element.remove_attribute("n");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteNNumberLike(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasN()) {
    element.append_attribute("n").set_value(this.StrToStr(this.GetN()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasN(): boolean {
    return (this.m_n != "");
  }

  SetN(value: any): void { this.m_n = value; }

  GetN(): any { return this.m_n; }

}
export class InstNNumberLike extends AttNNumberLike {}

export abstract class AttName extends Att {
  protected m_nymref: any;
  protected m_role: any;
  constructor() { super(); this.ResetName(); }

  ResetName(): void {
    this.m_nymref = "";
    this.m_role = RELATORS_NONE;
  }

  ReadName(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('nymref').empty()) {
    this.SetNymref(this.StrToStr(element.attribute('nymref').value()));
    if (removeAttr) element.remove_attribute("nymref");
    hasAttribute = true;
    }
    if (!element.attribute('role').empty()) {
    this.SetRole(this.StrToRelators(element.attribute('role').value()));
    if (removeAttr) element.remove_attribute("role");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteName(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasNymref()) {
    element.append_attribute("nymref").set_value(this.StrToStr(this.GetNymref()));
    wroteAttribute = true;
    }
    if (this.HasRole()) {
    element.append_attribute("role").set_value(this.RelatorsToStr(this.GetRole()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasNymref(): boolean {
    return (this.m_nymref != "");
  }

  HasRole(): boolean {
    return (this.m_role != RELATORS_NONE);
  }

  SetNymref(value: any): void { this.m_nymref = value; }
  SetRole(value: any): void { this.m_role = value; }

  GetNymref(): any { return this.m_nymref; }
  GetRole(): any { return this.m_role; }

}
export class InstName extends AttName {}

export abstract class AttNotationStyle extends Att {
  protected m_musicName: any;
  protected m_musicSize: any;
  constructor() { super(); this.ResetNotationStyle(); }

  ResetNotationStyle(): void {
    this.m_musicName = "";
    this.m_musicSize = new c.data_FONTSIZE();
  }

  ReadNotationStyle(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('music.name').empty()) {
    this.SetMusicName(this.StrToStr(element.attribute('music.name').value()));
    if (removeAttr) element.remove_attribute("music.name");
    hasAttribute = true;
    }
    if (!element.attribute('music.size').empty()) {
    this.SetMusicSize(this.StrToFontsize(element.attribute('music.size').value()));
    if (removeAttr) element.remove_attribute("music.size");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteNotationStyle(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMusicName()) {
    element.append_attribute("music.name").set_value(this.StrToStr(this.GetMusicName()));
    wroteAttribute = true;
    }
    if (this.HasMusicSize()) {
    element.append_attribute("music.size").set_value(this.FontsizeToStr(this.GetMusicSize()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasMusicName(): boolean {
    return (this.m_musicName != "");
  }

  HasMusicSize(): boolean {
    return (this.m_musicSize.HasValue());
  }

  SetMusicName(value: any): void { this.m_musicName = value; }
  SetMusicSize(value: any): void { this.m_musicSize = value; }

  GetMusicName(): any { return this.m_musicName; }
  GetMusicSize(): any { return this.m_musicSize; }

}
export class InstNotationStyle extends AttNotationStyle {}

export abstract class AttNoteHeads extends Att {
  protected m_headAltsym: any;
  protected m_headAuth: any;
  protected m_headColor: any;
  protected m_headFill: any;
  protected m_headFillcolor: any;
  protected m_headMod: any;
  protected m_headRotation: any;
  protected m_headShape: any;
  protected m_headVisible: any;
  constructor() { super(); this.ResetNoteHeads(); }

  ResetNoteHeads(): void {
    this.m_headAltsym = "";
    this.m_headAuth = "";
    this.m_headColor = "";
    this.m_headFill = FILL_NONE;
    this.m_headFillcolor = "";
    this.m_headMod = NOTEHEADMODIFIER_NONE;
    this.m_headRotation = ROTATION_NONE;
    this.m_headShape = new c.data_HEADSHAPE();
    this.m_headVisible = BOOLEAN_NONE;
  }

  ReadNoteHeads(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('head.altsym').empty()) {
    this.SetHeadAltsym(this.StrToStr(element.attribute('head.altsym').value()));
    if (removeAttr) element.remove_attribute("head.altsym");
    hasAttribute = true;
    }
    if (!element.attribute('head.auth').empty()) {
    this.SetHeadAuth(this.StrToStr(element.attribute('head.auth').value()));
    if (removeAttr) element.remove_attribute("head.auth");
    hasAttribute = true;
    }
    if (!element.attribute('head.color').empty()) {
    this.SetHeadColor(this.StrToStr(element.attribute('head.color').value()));
    if (removeAttr) element.remove_attribute("head.color");
    hasAttribute = true;
    }
    if (!element.attribute('head.fill').empty()) {
    this.SetHeadFill(this.StrToFill(element.attribute('head.fill').value()));
    if (removeAttr) element.remove_attribute("head.fill");
    hasAttribute = true;
    }
    if (!element.attribute('head.fillcolor').empty()) {
    this.SetHeadFillcolor(this.StrToStr(element.attribute('head.fillcolor').value()));
    if (removeAttr) element.remove_attribute("head.fillcolor");
    hasAttribute = true;
    }
    if (!element.attribute('head.mod').empty()) {
    this.SetHeadMod(this.StrToNoteheadmodifier(element.attribute('head.mod').value()));
    if (removeAttr) element.remove_attribute("head.mod");
    hasAttribute = true;
    }
    if (!element.attribute('head.rotation').empty()) {
    this.SetHeadRotation(this.StrToRotation(element.attribute('head.rotation').value()));
    if (removeAttr) element.remove_attribute("head.rotation");
    hasAttribute = true;
    }
    if (!element.attribute('head.shape').empty()) {
    this.SetHeadShape(this.StrToHeadshape(element.attribute('head.shape').value()));
    if (removeAttr) element.remove_attribute("head.shape");
    hasAttribute = true;
    }
    if (!element.attribute('head.visible').empty()) {
    this.SetHeadVisible(this.StrToBoolean(element.attribute('head.visible').value()));
    if (removeAttr) element.remove_attribute("head.visible");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteNoteHeads(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasHeadAltsym()) {
    element.append_attribute("head.altsym").set_value(this.StrToStr(this.GetHeadAltsym()));
    wroteAttribute = true;
    }
    if (this.HasHeadAuth()) {
    element.append_attribute("head.auth").set_value(this.StrToStr(this.GetHeadAuth()));
    wroteAttribute = true;
    }
    if (this.HasHeadColor()) {
    element.append_attribute("head.color").set_value(this.StrToStr(this.GetHeadColor()));
    wroteAttribute = true;
    }
    if (this.HasHeadFill()) {
    element.append_attribute("head.fill").set_value(this.FillToStr(this.GetHeadFill()));
    wroteAttribute = true;
    }
    if (this.HasHeadFillcolor()) {
    element.append_attribute("head.fillcolor").set_value(this.StrToStr(this.GetHeadFillcolor()));
    wroteAttribute = true;
    }
    if (this.HasHeadMod()) {
    element.append_attribute("head.mod").set_value(this.NoteheadmodifierToStr(this.GetHeadMod()));
    wroteAttribute = true;
    }
    if (this.HasHeadRotation()) {
    element.append_attribute("head.rotation").set_value(this.RotationToStr(this.GetHeadRotation()));
    wroteAttribute = true;
    }
    if (this.HasHeadShape()) {
    element.append_attribute("head.shape").set_value(this.HeadshapeToStr(this.GetHeadShape()));
    wroteAttribute = true;
    }
    if (this.HasHeadVisible()) {
    element.append_attribute("head.visible").set_value(this.BooleanToStr(this.GetHeadVisible()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasHeadAltsym(): boolean {
    return (this.m_headAltsym != "");
  }

  HasHeadAuth(): boolean {
    return (this.m_headAuth != "");
  }

  HasHeadColor(): boolean {
    return (this.m_headColor != "");
  }

  HasHeadFill(): boolean {
    return (this.m_headFill != FILL_NONE);
  }

  HasHeadFillcolor(): boolean {
    return (this.m_headFillcolor != "");
  }

  HasHeadMod(): boolean {
    return (this.m_headMod != NOTEHEADMODIFIER_NONE);
  }

  HasHeadRotation(): boolean {
    return (this.m_headRotation != ROTATION_NONE);
  }

  HasHeadShape(): boolean {
    return (this.m_headShape.HasValue());
  }

  HasHeadVisible(): boolean {
    return (this.m_headVisible != BOOLEAN_NONE);
  }

  SetHeadAltsym(value: any): void { this.m_headAltsym = value; }
  SetHeadAuth(value: any): void { this.m_headAuth = value; }
  SetHeadColor(value: any): void { this.m_headColor = value; }
  SetHeadFill(value: any): void { this.m_headFill = value; }
  SetHeadFillcolor(value: any): void { this.m_headFillcolor = value; }
  SetHeadMod(value: any): void { this.m_headMod = value; }
  SetHeadRotation(value: any): void { this.m_headRotation = value; }
  SetHeadShape(value: any): void { this.m_headShape = value; }
  SetHeadVisible(value: any): void { this.m_headVisible = value; }

  GetHeadAltsym(): any { return this.m_headAltsym; }
  GetHeadAuth(): any { return this.m_headAuth; }
  GetHeadColor(): any { return this.m_headColor; }
  GetHeadFill(): any { return this.m_headFill; }
  GetHeadFillcolor(): any { return this.m_headFillcolor; }
  GetHeadMod(): any { return this.m_headMod; }
  GetHeadRotation(): any { return this.m_headRotation; }
  GetHeadShape(): any { return this.m_headShape; }
  GetHeadVisible(): any { return this.m_headVisible; }

}
export class InstNoteHeads extends AttNoteHeads {}

export abstract class AttOctave extends Att {
  protected m_oct: any;
  constructor() { super(); this.ResetOctave(); }

  ResetOctave(): void {
    this.m_oct = MEI_UNSET_OCT_LOCAL;
  }

  ReadOctave(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('oct').empty()) {
    this.SetOct(this.StrToOctave(element.attribute('oct').value()));
    if (removeAttr) element.remove_attribute("oct");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteOctave(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOct()) {
    element.append_attribute("oct").set_value(this.OctaveToStr(this.GetOct()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasOct(): boolean {
    return (this.m_oct != MEI_UNSET_OCT_LOCAL);
  }

  SetOct(value: any): void { this.m_oct = value; }

  GetOct(): any { return this.m_oct; }

}
export class InstOctave extends AttOctave {}

export abstract class AttOctaveDefault extends Att {
  protected m_octDefault: any;
  constructor() { super(); this.ResetOctaveDefault(); }

  ResetOctaveDefault(): void {
    this.m_octDefault = MEI_UNSET_OCT_LOCAL;
  }

  ReadOctaveDefault(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('oct.default').empty()) {
    this.SetOctDefault(this.StrToOctave(element.attribute('oct.default').value()));
    if (removeAttr) element.remove_attribute("oct.default");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteOctaveDefault(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOctDefault()) {
    element.append_attribute("oct.default").set_value(this.OctaveToStr(this.GetOctDefault()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasOctDefault(): boolean {
    return (this.m_octDefault != MEI_UNSET_OCT_LOCAL);
  }

  SetOctDefault(value: any): void { this.m_octDefault = value; }

  GetOctDefault(): any { return this.m_octDefault; }

}
export class InstOctaveDefault extends AttOctaveDefault {}

export abstract class AttOctaveDisplacement extends Att {
  protected m_dis: any;
  protected m_disPlace: any;
  constructor() { super(); this.ResetOctaveDisplacement(); }

  ResetOctaveDisplacement(): void {
    this.m_dis = c.OCTAVE_DIS_NONE;
    this.m_disPlace = c.STAFFREL_basic_NONE;
  }

  ReadOctaveDisplacement(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('dis').empty()) {
    this.SetDis(this.StrToOctaveDis(element.attribute('dis').value()));
    if (removeAttr) element.remove_attribute("dis");
    hasAttribute = true;
    }
    if (!element.attribute('dis.place').empty()) {
    this.SetDisPlace(this.StrToStaffrelBasic(element.attribute('dis.place').value()));
    if (removeAttr) element.remove_attribute("dis.place");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteOctaveDisplacement(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDis()) {
    element.append_attribute("dis").set_value(this.OctaveDisToStr(this.GetDis()));
    wroteAttribute = true;
    }
    if (this.HasDisPlace()) {
    element.append_attribute("dis.place").set_value(this.StaffrelBasicToStr(this.GetDisPlace()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasDis(): boolean {
    return (this.m_dis != c.OCTAVE_DIS_NONE);
  }

  HasDisPlace(): boolean {
    return (this.m_disPlace != c.STAFFREL_basic_NONE);
  }

  SetDis(value: any): void { this.m_dis = value; }
  SetDisPlace(value: any): void { this.m_disPlace = value; }

  GetDis(): any { return this.m_dis; }
  GetDisPlace(): any { return this.m_disPlace; }

}
export class InstOctaveDisplacement extends AttOctaveDisplacement {}

export abstract class AttOneLineStaff extends Att {
  protected m_ontheline: any;
  constructor() { super(); this.ResetOneLineStaff(); }

  ResetOneLineStaff(): void {
    this.m_ontheline = BOOLEAN_NONE;
  }

  ReadOneLineStaff(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('ontheline').empty()) {
    this.SetOntheline(this.StrToBoolean(element.attribute('ontheline').value()));
    if (removeAttr) element.remove_attribute("ontheline");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteOneLineStaff(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOntheline()) {
    element.append_attribute("ontheline").set_value(this.BooleanToStr(this.GetOntheline()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasOntheline(): boolean {
    return (this.m_ontheline != BOOLEAN_NONE);
  }

  SetOntheline(value: any): void { this.m_ontheline = value; }

  GetOntheline(): any { return this.m_ontheline; }

}
export class InstOneLineStaff extends AttOneLineStaff {}

export abstract class AttOptimization extends Att {
  protected m_optimize: any;
  constructor() { super(); this.ResetOptimization(); }

  ResetOptimization(): void {
    this.m_optimize = BOOLEAN_NONE;
  }

  ReadOptimization(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('optimize').empty()) {
    this.SetOptimize(this.StrToBoolean(element.attribute('optimize').value()));
    if (removeAttr) element.remove_attribute("optimize");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteOptimization(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOptimize()) {
    element.append_attribute("optimize").set_value(this.BooleanToStr(this.GetOptimize()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasOptimize(): boolean {
    return (this.m_optimize != BOOLEAN_NONE);
  }

  SetOptimize(value: any): void { this.m_optimize = value; }

  GetOptimize(): any { return this.m_optimize; }

}
export class InstOptimization extends AttOptimization {}

export abstract class AttOriginLayerIdent extends Att {
  protected m_originLayer: any;
  constructor() { super(); this.ResetOriginLayerIdent(); }

  ResetOriginLayerIdent(): void {
    this.m_originLayer = "";
  }

  ReadOriginLayerIdent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('origin.layer').empty()) {
    this.SetOriginLayer(this.StrToStr(element.attribute('origin.layer').value()));
    if (removeAttr) element.remove_attribute("origin.layer");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteOriginLayerIdent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOriginLayer()) {
    element.append_attribute("origin.layer").set_value(this.StrToStr(this.GetOriginLayer()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasOriginLayer(): boolean {
    return (this.m_originLayer != "");
  }

  SetOriginLayer(value: any): void { this.m_originLayer = value; }

  GetOriginLayer(): any { return this.m_originLayer; }

}
export class InstOriginLayerIdent extends AttOriginLayerIdent {}

export abstract class AttOriginStaffIdent extends Att {
  protected m_originStaff: any;
  constructor() { super(); this.ResetOriginStaffIdent(); }

  ResetOriginStaffIdent(): void {
    this.m_originStaff = "";
  }

  ReadOriginStaffIdent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('origin.staff').empty()) {
    this.SetOriginStaff(this.StrToStr(element.attribute('origin.staff').value()));
    if (removeAttr) element.remove_attribute("origin.staff");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteOriginStaffIdent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOriginStaff()) {
    element.append_attribute("origin.staff").set_value(this.StrToStr(this.GetOriginStaff()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasOriginStaff(): boolean {
    return (this.m_originStaff != "");
  }

  SetOriginStaff(value: any): void { this.m_originStaff = value; }

  GetOriginStaff(): any { return this.m_originStaff; }

}
export class InstOriginStaffIdent extends AttOriginStaffIdent {}

export abstract class AttOriginStartEndId extends Att {
  protected m_originStartid: any;
  protected m_originEndid: any;
  constructor() { super(); this.ResetOriginStartEndId(); }

  ResetOriginStartEndId(): void {
    this.m_originStartid = "";
    this.m_originEndid = "";
  }

  ReadOriginStartEndId(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('origin.startid').empty()) {
    this.SetOriginStartid(this.StrToStr(element.attribute('origin.startid').value()));
    if (removeAttr) element.remove_attribute("origin.startid");
    hasAttribute = true;
    }
    if (!element.attribute('origin.endid').empty()) {
    this.SetOriginEndid(this.StrToStr(element.attribute('origin.endid').value()));
    if (removeAttr) element.remove_attribute("origin.endid");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteOriginStartEndId(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOriginStartid()) {
    element.append_attribute("origin.startid").set_value(this.StrToStr(this.GetOriginStartid()));
    wroteAttribute = true;
    }
    if (this.HasOriginEndid()) {
    element.append_attribute("origin.endid").set_value(this.StrToStr(this.GetOriginEndid()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasOriginStartid(): boolean {
    return (this.m_originStartid != "");
  }

  HasOriginEndid(): boolean {
    return (this.m_originEndid != "");
  }

  SetOriginStartid(value: any): void { this.m_originStartid = value; }
  SetOriginEndid(value: any): void { this.m_originEndid = value; }

  GetOriginStartid(): any { return this.m_originStartid; }
  GetOriginEndid(): any { return this.m_originEndid; }

}
export class InstOriginStartEndId extends AttOriginStartEndId {}

export abstract class AttOriginTimestampLog extends Att {
  protected m_originTstamp: any;
  protected m_originTstamp2: any;
  constructor() { super(); this.ResetOriginTimestampLog(); }

  ResetOriginTimestampLog(): void {
    this.m_originTstamp = [-1, -1.0];
    this.m_originTstamp2 = [-1, -1.0];
  }

  ReadOriginTimestampLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('origin.tstamp').empty()) {
    this.SetOriginTstamp(this.StrToMeasurebeat(element.attribute('origin.tstamp').value()));
    if (removeAttr) element.remove_attribute("origin.tstamp");
    hasAttribute = true;
    }
    if (!element.attribute('origin.tstamp2').empty()) {
    this.SetOriginTstamp2(this.StrToMeasurebeat(element.attribute('origin.tstamp2').value()));
    if (removeAttr) element.remove_attribute("origin.tstamp2");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteOriginTimestampLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOriginTstamp()) {
    element.append_attribute("origin.tstamp").set_value(this.MeasurebeatToStr(this.GetOriginTstamp()));
    wroteAttribute = true;
    }
    if (this.HasOriginTstamp2()) {
    element.append_attribute("origin.tstamp2").set_value(this.MeasurebeatToStr(this.GetOriginTstamp2()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasOriginTstamp(): boolean {
    return !(Array.isArray(this.m_originTstamp) && this.m_originTstamp[0] === -1 && this.m_originTstamp[1] === -1.0);
  }

  HasOriginTstamp2(): boolean {
    return !(Array.isArray(this.m_originTstamp2) && this.m_originTstamp2[0] === -1 && this.m_originTstamp2[1] === -1.0);
  }

  SetOriginTstamp(value: any): void { this.m_originTstamp = value; }
  SetOriginTstamp2(value: any): void { this.m_originTstamp2 = value; }

  GetOriginTstamp(): any { return this.m_originTstamp; }
  GetOriginTstamp2(): any { return this.m_originTstamp2; }

}
export class InstOriginTimestampLog extends AttOriginTimestampLog {}

export abstract class AttPages extends Att {
  protected m_pageHeight: any;
  protected m_pageWidth: any;
  protected m_pageTopmar: any;
  protected m_pageBotmar: any;
  protected m_pageLeftmar: any;
  protected m_pageRightmar: any;
  protected m_pagePanels: any;
  protected m_pageScale: any;
  constructor() { super(); this.ResetPages(); }

  ResetPages(): void {
    this.m_pageHeight = new data_MEASUREMENTUNSIGNED();
    this.m_pageWidth = new data_MEASUREMENTUNSIGNED();
    this.m_pageTopmar = new data_MEASUREMENTUNSIGNED();
    this.m_pageBotmar = new data_MEASUREMENTUNSIGNED();
    this.m_pageLeftmar = new data_MEASUREMENTUNSIGNED();
    this.m_pageRightmar = new data_MEASUREMENTUNSIGNED();
    this.m_pagePanels = "";
    this.m_pageScale = "";
  }

  ReadPages(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('page.height').empty()) {
    this.SetPageHeight(this.StrToMeasurementunsigned(element.attribute('page.height').value()));
    if (removeAttr) element.remove_attribute("page.height");
    hasAttribute = true;
    }
    if (!element.attribute('page.width').empty()) {
    this.SetPageWidth(this.StrToMeasurementunsigned(element.attribute('page.width').value()));
    if (removeAttr) element.remove_attribute("page.width");
    hasAttribute = true;
    }
    if (!element.attribute('page.topmar').empty()) {
    this.SetPageTopmar(this.StrToMeasurementunsigned(element.attribute('page.topmar').value()));
    if (removeAttr) element.remove_attribute("page.topmar");
    hasAttribute = true;
    }
    if (!element.attribute('page.botmar').empty()) {
    this.SetPageBotmar(this.StrToMeasurementunsigned(element.attribute('page.botmar').value()));
    if (removeAttr) element.remove_attribute("page.botmar");
    hasAttribute = true;
    }
    if (!element.attribute('page.leftmar').empty()) {
    this.SetPageLeftmar(this.StrToMeasurementunsigned(element.attribute('page.leftmar').value()));
    if (removeAttr) element.remove_attribute("page.leftmar");
    hasAttribute = true;
    }
    if (!element.attribute('page.rightmar').empty()) {
    this.SetPageRightmar(this.StrToMeasurementunsigned(element.attribute('page.rightmar').value()));
    if (removeAttr) element.remove_attribute("page.rightmar");
    hasAttribute = true;
    }
    if (!element.attribute('page.panels').empty()) {
    this.SetPagePanels(this.StrToStr(element.attribute('page.panels').value()));
    if (removeAttr) element.remove_attribute("page.panels");
    hasAttribute = true;
    }
    if (!element.attribute('page.scale').empty()) {
    this.SetPageScale(this.StrToStr(element.attribute('page.scale').value()));
    if (removeAttr) element.remove_attribute("page.scale");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WritePages(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasPageHeight()) {
    element.append_attribute("page.height").set_value(this.MeasurementunsignedToStr(this.GetPageHeight()));
    wroteAttribute = true;
    }
    if (this.HasPageWidth()) {
    element.append_attribute("page.width").set_value(this.MeasurementunsignedToStr(this.GetPageWidth()));
    wroteAttribute = true;
    }
    if (this.HasPageTopmar()) {
    element.append_attribute("page.topmar").set_value(this.MeasurementunsignedToStr(this.GetPageTopmar()));
    wroteAttribute = true;
    }
    if (this.HasPageBotmar()) {
    element.append_attribute("page.botmar").set_value(this.MeasurementunsignedToStr(this.GetPageBotmar()));
    wroteAttribute = true;
    }
    if (this.HasPageLeftmar()) {
    element.append_attribute("page.leftmar").set_value(this.MeasurementunsignedToStr(this.GetPageLeftmar()));
    wroteAttribute = true;
    }
    if (this.HasPageRightmar()) {
    element.append_attribute("page.rightmar").set_value(this.MeasurementunsignedToStr(this.GetPageRightmar()));
    wroteAttribute = true;
    }
    if (this.HasPagePanels()) {
    element.append_attribute("page.panels").set_value(this.StrToStr(this.GetPagePanels()));
    wroteAttribute = true;
    }
    if (this.HasPageScale()) {
    element.append_attribute("page.scale").set_value(this.StrToStr(this.GetPageScale()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasPageHeight(): boolean {
    return (this.m_pageHeight?.HasValue?.() === true);
  }

  HasPageWidth(): boolean {
    return (this.m_pageWidth?.HasValue?.() === true);
  }

  HasPageTopmar(): boolean {
    return (this.m_pageTopmar?.HasValue?.() === true);
  }

  HasPageBotmar(): boolean {
    return (this.m_pageBotmar?.HasValue?.() === true);
  }

  HasPageLeftmar(): boolean {
    return (this.m_pageLeftmar?.HasValue?.() === true);
  }

  HasPageRightmar(): boolean {
    return (this.m_pageRightmar?.HasValue?.() === true);
  }

  HasPagePanels(): boolean {
    return (this.m_pagePanels != "");
  }

  HasPageScale(): boolean {
    return (this.m_pageScale != "");
  }

  SetPageHeight(value: any): void { this.m_pageHeight = value; }
  SetPageWidth(value: any): void { this.m_pageWidth = value; }
  SetPageTopmar(value: any): void { this.m_pageTopmar = value; }
  SetPageBotmar(value: any): void { this.m_pageBotmar = value; }
  SetPageLeftmar(value: any): void { this.m_pageLeftmar = value; }
  SetPageRightmar(value: any): void { this.m_pageRightmar = value; }
  SetPagePanels(value: any): void { this.m_pagePanels = value; }
  SetPageScale(value: any): void { this.m_pageScale = value; }

  GetPageHeight(): any { return this.m_pageHeight; }
  GetPageWidth(): any { return this.m_pageWidth; }
  GetPageTopmar(): any { return this.m_pageTopmar; }
  GetPageBotmar(): any { return this.m_pageBotmar; }
  GetPageLeftmar(): any { return this.m_pageLeftmar; }
  GetPageRightmar(): any { return this.m_pageRightmar; }
  GetPagePanels(): any { return this.m_pagePanels; }
  GetPageScale(): any { return this.m_pageScale; }

}
export class InstPages extends AttPages {}

export abstract class AttPartIdent extends Att {
  protected m_part: any;
  protected m_partstaff: any;
  constructor() { super(); this.ResetPartIdent(); }

  ResetPartIdent(): void {
    this.m_part = "";
    this.m_partstaff = "";
  }

  ReadPartIdent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('part').empty()) {
    this.SetPart(this.StrToStr(element.attribute('part').value()));
    if (removeAttr) element.remove_attribute("part");
    hasAttribute = true;
    }
    if (!element.attribute('partstaff').empty()) {
    this.SetPartstaff(this.StrToStr(element.attribute('partstaff').value()));
    if (removeAttr) element.remove_attribute("partstaff");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WritePartIdent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasPart()) {
    element.append_attribute("part").set_value(this.StrToStr(this.GetPart()));
    wroteAttribute = true;
    }
    if (this.HasPartstaff()) {
    element.append_attribute("partstaff").set_value(this.StrToStr(this.GetPartstaff()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasPart(): boolean {
    return (this.m_part != "");
  }

  HasPartstaff(): boolean {
    return (this.m_partstaff != "");
  }

  SetPart(value: any): void { this.m_part = value; }
  SetPartstaff(value: any): void { this.m_partstaff = value; }

  GetPart(): any { return this.m_part; }
  GetPartstaff(): any { return this.m_partstaff; }

}
export class InstPartIdent extends AttPartIdent {}

export abstract class AttPitch extends Att {
  protected m_pname: any;
  constructor() { super(); this.ResetPitch(); }

  ResetPitch(): void {
    this.m_pname = c.PITCHNAME_NONE;
  }

  ReadPitch(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('pname').empty()) {
    this.SetPname(this.StrToPitchname(element.attribute('pname').value()));
    if (removeAttr) element.remove_attribute("pname");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WritePitch(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasPname()) {
    element.append_attribute("pname").set_value(this.PitchnameToStr(this.GetPname()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasPname(): boolean {
    return (this.m_pname != c.PITCHNAME_NONE);
  }

  SetPname(value: any): void { this.m_pname = value; }

  GetPname(): any { return this.m_pname; }

}
export class InstPitch extends AttPitch {}

export abstract class AttPlacementOnStaff extends Att {
  protected m_onstaff: any;
  constructor() { super(); this.ResetPlacementOnStaff(); }

  ResetPlacementOnStaff(): void {
    this.m_onstaff = BOOLEAN_NONE;
  }

  ReadPlacementOnStaff(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('onstaff').empty()) {
    this.SetOnstaff(this.StrToBoolean(element.attribute('onstaff').value()));
    if (removeAttr) element.remove_attribute("onstaff");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WritePlacementOnStaff(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOnstaff()) {
    element.append_attribute("onstaff").set_value(this.BooleanToStr(this.GetOnstaff()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasOnstaff(): boolean {
    return (this.m_onstaff != BOOLEAN_NONE);
  }

  SetOnstaff(value: any): void { this.m_onstaff = value; }

  GetOnstaff(): any { return this.m_onstaff; }

}
export class InstPlacementOnStaff extends AttPlacementOnStaff {}

export abstract class AttPlacementRelEvent extends Att {
  protected m_place: any;
  constructor() { super(); this.ResetPlacementRelEvent(); }

  ResetPlacementRelEvent(): void {
    this.m_place = 0;
  }

  ReadPlacementRelEvent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('place').empty()) {
    this.SetPlace(this.StrToStaffrel(element.attribute('place').value()));
    if (removeAttr) element.remove_attribute("place");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WritePlacementRelEvent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasPlace()) {
    element.append_attribute("place").set_value(this.StaffrelToStr(this.GetPlace()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasPlace(): boolean {
    return (this.m_place !== 0);
  }

  SetPlace(value: any): void { this.m_place = value; }

  GetPlace(): any { return this.m_place; }

}
export class InstPlacementRelEvent extends AttPlacementRelEvent {}

export abstract class AttPlacementRelStaff extends Att {
  protected m_place: any;
  constructor() { super(); this.ResetPlacementRelStaff(); }

  ResetPlacementRelStaff(): void {
    this.m_place = 0;
  }

  ReadPlacementRelStaff(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('place').empty()) {
    this.SetPlace(this.StrToStaffrel(element.attribute('place').value()));
    if (removeAttr) element.remove_attribute("place");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WritePlacementRelStaff(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasPlace()) {
    element.append_attribute("place").set_value(this.StaffrelToStr(this.GetPlace()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasPlace(): boolean {
    return (this.m_place !== 0);
  }

  SetPlace(value: any): void { this.m_place = value; }

  GetPlace(): any { return this.m_place; }

}
export class InstPlacementRelStaff extends AttPlacementRelStaff {}

export abstract class AttPlist extends Att {
  protected m_plist: any;
  constructor() { super(); this.ResetPlist(); }

  ResetPlist(): void {
    this.m_plist = [];
  }

  ReadPlist(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('plist').empty()) {
    this.SetPlist(this.StrToXsdAnyURIList(element.attribute('plist').value()));
    if (removeAttr) element.remove_attribute("plist");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WritePlist(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasPlist()) {
    element.append_attribute("plist").set_value(this.XsdAnyURIListToStr(this.GetPlist()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasPlist(): boolean {
    return (this.m_plist.length !== 0);
  }

  SetPlist(value: any): void { this.m_plist = value; }

  GetPlist(): any { return this.m_plist; }

}
export class InstPlist extends AttPlist {}

export abstract class AttPointing extends Att {
  protected m_actuate: any;
  protected m_role: any;
  protected m_show: any;
  protected m_target: any;
  protected m_targettype: any;
  constructor() { super(); this.ResetPointing(); }

  ResetPointing(): void {
    this.m_actuate = "";
    this.m_role = "";
    this.m_show = "";
    this.m_target = "";
    this.m_targettype = "";
  }

  ReadPointing(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('xlink:actuate').empty()) {
    this.SetActuate(this.StrToStr(element.attribute('xlink:actuate').value()));
    if (removeAttr) element.remove_attribute("xlink:actuate");
    hasAttribute = true;
    }
    if (!element.attribute('xlink:role').empty()) {
    this.SetRole(this.StrToStr(element.attribute('xlink:role').value()));
    if (removeAttr) element.remove_attribute("xlink:role");
    hasAttribute = true;
    }
    if (!element.attribute('xlink:show').empty()) {
    this.SetShow(this.StrToStr(element.attribute('xlink:show').value()));
    if (removeAttr) element.remove_attribute("xlink:show");
    hasAttribute = true;
    }
    if (!element.attribute('target').empty()) {
    this.SetTarget(this.StrToStr(element.attribute('target').value()));
    if (removeAttr) element.remove_attribute("target");
    hasAttribute = true;
    }
    if (!element.attribute('targettype').empty()) {
    this.SetTargettype(this.StrToStr(element.attribute('targettype').value()));
    if (removeAttr) element.remove_attribute("targettype");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WritePointing(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasActuate()) {
    element.append_attribute("xlink:actuate").set_value(this.StrToStr(this.GetActuate()));
    wroteAttribute = true;
    }
    if (this.HasRole()) {
    element.append_attribute("xlink:role").set_value(this.StrToStr(this.GetRole()));
    wroteAttribute = true;
    }
    if (this.HasShow()) {
    element.append_attribute("xlink:show").set_value(this.StrToStr(this.GetShow()));
    wroteAttribute = true;
    }
    if (this.HasTarget()) {
    element.append_attribute("target").set_value(this.StrToStr(this.GetTarget()));
    wroteAttribute = true;
    }
    if (this.HasTargettype()) {
    element.append_attribute("targettype").set_value(this.StrToStr(this.GetTargettype()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasActuate(): boolean {
    return (this.m_actuate != "");
  }

  HasRole(): boolean {
    return (this.m_role != "");
  }

  HasShow(): boolean {
    return (this.m_show != "");
  }

  HasTarget(): boolean {
    return (this.m_target != "");
  }

  HasTargettype(): boolean {
    return (this.m_targettype != "");
  }

  SetActuate(value: any): void { this.m_actuate = value; }
  SetRole(value: any): void { this.m_role = value; }
  SetShow(value: any): void { this.m_show = value; }
  SetTarget(value: any): void { this.m_target = value; }
  SetTargettype(value: any): void { this.m_targettype = value; }

  GetActuate(): any { return this.m_actuate; }
  GetRole(): any { return this.m_role; }
  GetShow(): any { return this.m_show; }
  GetTarget(): any { return this.m_target; }
  GetTargettype(): any { return this.m_targettype; }

}
export class InstPointing extends AttPointing {}

export abstract class AttQuantity extends Att {
  protected m_quantity: any;
  constructor() { super(); this.ResetQuantity(); }

  ResetQuantity(): void {
    this.m_quantity = 0.0;
  }

  ReadQuantity(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('quantity').empty()) {
    this.SetQuantity(this.StrToDbl(element.attribute('quantity').value()));
    if (removeAttr) element.remove_attribute("quantity");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteQuantity(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasQuantity()) {
    element.append_attribute("quantity").set_value(this.DblToStr(this.GetQuantity()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasQuantity(): boolean {
    return (this.m_quantity != 0.0);
  }

  SetQuantity(value: any): void { this.m_quantity = value; }

  GetQuantity(): any { return this.m_quantity; }

}
export class InstQuantity extends AttQuantity {}

export abstract class AttRanging extends Att {
  protected m_atleast: any;
  protected m_atmost: any;
  protected m_min: any;
  protected m_max: any;
  protected m_confidence: any;
  constructor() { super(); this.ResetRanging(); }

  ResetRanging(): void {
    this.m_atleast = 0.0;
    this.m_atmost = 0.0;
    this.m_min = 0.0;
    this.m_max = 0.0;
    this.m_confidence = 0.0;
  }

  ReadRanging(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('atleast').empty()) {
    this.SetAtleast(this.StrToDbl(element.attribute('atleast').value()));
    if (removeAttr) element.remove_attribute("atleast");
    hasAttribute = true;
    }
    if (!element.attribute('atmost').empty()) {
    this.SetAtmost(this.StrToDbl(element.attribute('atmost').value()));
    if (removeAttr) element.remove_attribute("atmost");
    hasAttribute = true;
    }
    if (!element.attribute('min').empty()) {
    this.SetMin(this.StrToDbl(element.attribute('min').value()));
    if (removeAttr) element.remove_attribute("min");
    hasAttribute = true;
    }
    if (!element.attribute('max').empty()) {
    this.SetMax(this.StrToDbl(element.attribute('max').value()));
    if (removeAttr) element.remove_attribute("max");
    hasAttribute = true;
    }
    if (!element.attribute('confidence').empty()) {
    this.SetConfidence(this.StrToDbl(element.attribute('confidence').value()));
    if (removeAttr) element.remove_attribute("confidence");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteRanging(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAtleast()) {
    element.append_attribute("atleast").set_value(this.DblToStr(this.GetAtleast()));
    wroteAttribute = true;
    }
    if (this.HasAtmost()) {
    element.append_attribute("atmost").set_value(this.DblToStr(this.GetAtmost()));
    wroteAttribute = true;
    }
    if (this.HasMin()) {
    element.append_attribute("min").set_value(this.DblToStr(this.GetMin()));
    wroteAttribute = true;
    }
    if (this.HasMax()) {
    element.append_attribute("max").set_value(this.DblToStr(this.GetMax()));
    wroteAttribute = true;
    }
    if (this.HasConfidence()) {
    element.append_attribute("confidence").set_value(this.DblToStr(this.GetConfidence()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasAtleast(): boolean {
    return (this.m_atleast != 0.0);
  }

  HasAtmost(): boolean {
    return (this.m_atmost != 0.0);
  }

  HasMin(): boolean {
    return (this.m_min != 0.0);
  }

  HasMax(): boolean {
    return (this.m_max != 0.0);
  }

  HasConfidence(): boolean {
    return (this.m_confidence != 0.0);
  }

  SetAtleast(value: any): void { this.m_atleast = value; }
  SetAtmost(value: any): void { this.m_atmost = value; }
  SetMin(value: any): void { this.m_min = value; }
  SetMax(value: any): void { this.m_max = value; }
  SetConfidence(value: any): void { this.m_confidence = value; }

  GetAtleast(): any { return this.m_atleast; }
  GetAtmost(): any { return this.m_atmost; }
  GetMin(): any { return this.m_min; }
  GetMax(): any { return this.m_max; }
  GetConfidence(): any { return this.m_confidence; }

}
export class InstRanging extends AttRanging {}

export abstract class AttRepeatMarkLog extends Att {
  protected m_func: any;
  constructor() { super(); this.ResetRepeatMarkLog(); }

  ResetRepeatMarkLog(): void {
    this.m_func = repeatMarkLog_FUNC_NONE;
  }

  ReadRepeatMarkLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('func').empty()) {
    this.SetFunc(this.StrToRepeatMarkLogFunc(element.attribute('func').value()));
    if (removeAttr) element.remove_attribute("func");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteRepeatMarkLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasFunc()) {
    element.append_attribute("func").set_value(this.RepeatMarkLogFuncToStr(this.GetFunc()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasFunc(): boolean {
    return (this.m_func != repeatMarkLog_FUNC_NONE);
  }

  SetFunc(value: any): void { this.m_func = value; }

  GetFunc(): any { return this.m_func; }

}
export class InstRepeatMarkLog extends AttRepeatMarkLog {}

export abstract class AttResponsibility extends Att {
  protected m_resp: any;
  constructor() { super(); this.ResetResponsibility(); }

  ResetResponsibility(): void {
    this.m_resp = "";
  }

  ReadResponsibility(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('resp').empty()) {
    this.SetResp(this.StrToStr(element.attribute('resp').value()));
    if (removeAttr) element.remove_attribute("resp");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteResponsibility(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasResp()) {
    element.append_attribute("resp").set_value(this.StrToStr(this.GetResp()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasResp(): boolean {
    return (this.m_resp != "");
  }

  SetResp(value: any): void { this.m_resp = value; }

  GetResp(): any { return this.m_resp; }

}
export class InstResponsibility extends AttResponsibility {}

export abstract class AttRestdurationLog extends Att {
  protected m_dur: any;
  constructor() { super(); this.ResetRestdurationLog(); }

  ResetRestdurationLog(): void {
    this.m_dur = c.DURATION_NONE;
  }

  ReadRestdurationLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('dur').empty()) {
    this.SetDur(this.StrToDuration(element.attribute('dur').value()));
    if (removeAttr) element.remove_attribute("dur");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteRestdurationLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDur()) {
    element.append_attribute("dur").set_value(this.DurationToStr(this.GetDur()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasDur(): boolean {
    return (this.m_dur != c.DURATION_NONE);
  }

  SetDur(value: any): void { this.m_dur = value; }

  GetDur(): any { return this.m_dur; }

}
export class InstRestdurationLog extends AttRestdurationLog {}

export abstract class AttScalable extends Att {
  protected m_scale: any;
  constructor() { super(); this.ResetScalable(); }

  ResetScalable(): void {
    this.m_scale = -1.0;
  }

  ReadScalable(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('scale').empty()) {
    this.SetScale(this.StrToPercent(element.attribute('scale').value()));
    if (removeAttr) element.remove_attribute("scale");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteScalable(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasScale()) {
    element.append_attribute("scale").set_value(this.PercentToStr(this.GetScale()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasScale(): boolean {
    return (this.m_scale != -1.0);
  }

  SetScale(value: any): void { this.m_scale = value; }

  GetScale(): any { return this.m_scale; }

}
export class InstScalable extends AttScalable {}

export abstract class AttSequence extends Att {
  protected m_seq: any;
  constructor() { super(); this.ResetSequence(); }

  ResetSequence(): void {
    this.m_seq = MEI_UNSET;
  }

  ReadSequence(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('seq').empty()) {
    this.SetSeq(this.StrToInt(element.attribute('seq').value()));
    if (removeAttr) element.remove_attribute("seq");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteSequence(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSeq()) {
    element.append_attribute("seq").set_value(this.IntToStr(this.GetSeq()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasSeq(): boolean {
    return (this.m_seq != MEI_UNSET);
  }

  SetSeq(value: any): void { this.m_seq = value; }

  GetSeq(): any { return this.m_seq; }

}
export class InstSequence extends AttSequence {}

export abstract class AttSlashCount extends Att {
  protected m_slash: any;
  constructor() { super(); this.ResetSlashCount(); }

  ResetSlashCount(): void {
    this.m_slash = 0;
  }

  ReadSlashCount(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('slash').empty()) {
    this.SetSlash(this.StrToInt(element.attribute('slash').value()));
    if (removeAttr) element.remove_attribute("slash");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteSlashCount(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSlash()) {
    element.append_attribute("slash").set_value(this.IntToStr(this.GetSlash()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasSlash(): boolean {
    return (this.m_slash != 0);
  }

  SetSlash(value: any): void { this.m_slash = value; }

  GetSlash(): any { return this.m_slash; }

}
export class InstSlashCount extends AttSlashCount {}

export abstract class AttSlurPresent extends Att {
  protected m_slur: any;
  constructor() { super(); this.ResetSlurPresent(); }

  ResetSlurPresent(): void {
    this.m_slur = "";
  }

  ReadSlurPresent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('slur').empty()) {
    this.SetSlur(this.StrToStr(element.attribute('slur').value()));
    if (removeAttr) element.remove_attribute("slur");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteSlurPresent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSlur()) {
    element.append_attribute("slur").set_value(this.StrToStr(this.GetSlur()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasSlur(): boolean {
    return (this.m_slur != "");
  }

  SetSlur(value: any): void { this.m_slur = value; }

  GetSlur(): any { return this.m_slur; }

}
export class InstSlurPresent extends AttSlurPresent {}

export abstract class AttSource extends Att {
  protected m_source: any;
  constructor() { super(); this.ResetSource(); }

  ResetSource(): void {
    this.m_source = "";
  }

  ReadSource(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('source').empty()) {
    this.SetSource(this.StrToStr(element.attribute('source').value()));
    if (removeAttr) element.remove_attribute("source");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteSource(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSource()) {
    element.append_attribute("source").set_value(this.StrToStr(this.GetSource()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasSource(): boolean {
    return (this.m_source != "");
  }

  SetSource(value: any): void { this.m_source = value; }

  GetSource(): any { return this.m_source; }

}
export class InstSource extends AttSource {}

export abstract class AttSpacing extends Att {
  protected m_spacingPackexp: any;
  protected m_spacingPackfact: any;
  protected m_spacingStaff: any;
  protected m_spacingSystem: any;
  constructor() { super(); this.ResetSpacing(); }

  ResetSpacing(): void {
    this.m_spacingPackexp = 0.0;
    this.m_spacingPackfact = 0.0;
    this.m_spacingStaff = new c.data_MEASUREMENTSIGNED();
    this.m_spacingSystem = new c.data_MEASUREMENTSIGNED();
  }

  ReadSpacing(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('spacing.packexp').empty()) {
    this.SetSpacingPackexp(this.StrToDbl(element.attribute('spacing.packexp').value()));
    if (removeAttr) element.remove_attribute("spacing.packexp");
    hasAttribute = true;
    }
    if (!element.attribute('spacing.packfact').empty()) {
    this.SetSpacingPackfact(this.StrToDbl(element.attribute('spacing.packfact').value()));
    if (removeAttr) element.remove_attribute("spacing.packfact");
    hasAttribute = true;
    }
    if (!element.attribute('spacing.staff').empty()) {
    this.SetSpacingStaff(this.StrToMeasurementsigned(element.attribute('spacing.staff').value()));
    if (removeAttr) element.remove_attribute("spacing.staff");
    hasAttribute = true;
    }
    if (!element.attribute('spacing.system').empty()) {
    this.SetSpacingSystem(this.StrToMeasurementsigned(element.attribute('spacing.system').value()));
    if (removeAttr) element.remove_attribute("spacing.system");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteSpacing(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSpacingPackexp()) {
    element.append_attribute("spacing.packexp").set_value(this.DblToStr(this.GetSpacingPackexp()));
    wroteAttribute = true;
    }
    if (this.HasSpacingPackfact()) {
    element.append_attribute("spacing.packfact").set_value(this.DblToStr(this.GetSpacingPackfact()));
    wroteAttribute = true;
    }
    if (this.HasSpacingStaff()) {
    element.append_attribute("spacing.staff").set_value(this.MeasurementsignedToStr(this.GetSpacingStaff()));
    wroteAttribute = true;
    }
    if (this.HasSpacingSystem()) {
    element.append_attribute("spacing.system").set_value(this.MeasurementsignedToStr(this.GetSpacingSystem()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasSpacingPackexp(): boolean {
    return (this.m_spacingPackexp != 0.0);
  }

  HasSpacingPackfact(): boolean {
    return (this.m_spacingPackfact != 0.0);
  }

  HasSpacingStaff(): boolean {
    return (this.m_spacingStaff?.HasValue?.() === true);
  }

  HasSpacingSystem(): boolean {
    return (this.m_spacingSystem?.HasValue?.() === true);
  }

  SetSpacingPackexp(value: any): void { this.m_spacingPackexp = value; }
  SetSpacingPackfact(value: any): void { this.m_spacingPackfact = value; }
  SetSpacingStaff(value: any): void { this.m_spacingStaff = value; }
  SetSpacingSystem(value: any): void { this.m_spacingSystem = value; }

  GetSpacingPackexp(): any { return this.m_spacingPackexp; }
  GetSpacingPackfact(): any { return this.m_spacingPackfact; }
  GetSpacingStaff(): any { return this.m_spacingStaff; }
  GetSpacingSystem(): any { return this.m_spacingSystem; }

}
export class InstSpacing extends AttSpacing {}

export abstract class AttStaffLog extends Att {
  protected m_def: any;
  constructor() { super(); this.ResetStaffLog(); }

  ResetStaffLog(): void {
    this.m_def = "";
  }

  ReadStaffLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('def').empty()) {
    this.SetDef(this.StrToStr(element.attribute('def').value()));
    if (removeAttr) element.remove_attribute("def");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteStaffLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDef()) {
    element.append_attribute("def").set_value(this.StrToStr(this.GetDef()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasDef(): boolean {
    return (this.m_def != "");
  }

  SetDef(value: any): void { this.m_def = value; }

  GetDef(): any { return this.m_def; }

}
export class InstStaffLog extends AttStaffLog {}

export abstract class AttStaffDefLog extends Att {
  protected m_lines: any;
  constructor() { super(); this.ResetStaffDefLog(); }

  ResetStaffDefLog(): void {
    this.m_lines = MEI_UNSET;
  }

  ReadStaffDefLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('lines').empty()) {
    this.SetLines(this.StrToInt(element.attribute('lines').value()));
    if (removeAttr) element.remove_attribute("lines");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteStaffDefLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLines()) {
    element.append_attribute("lines").set_value(this.IntToStr(this.GetLines()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasLines(): boolean {
    return (this.m_lines != MEI_UNSET);
  }

  SetLines(value: any): void { this.m_lines = value; }

  GetLines(): any { return this.m_lines; }

}
export class InstStaffDefLog extends AttStaffDefLog {}

export abstract class AttStaffGroupingSym extends Att {
  protected m_symbol: any;
  constructor() { super(); this.ResetStaffGroupingSym(); }

  ResetStaffGroupingSym(): void {
    this.m_symbol = staffGroupingSym_SYMBOL_NONE;
  }

  ReadStaffGroupingSym(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('symbol').empty()) {
    this.SetSymbol(this.StrToStaffGroupingSymSymbol(element.attribute('symbol').value()));
    if (removeAttr) element.remove_attribute("symbol");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteStaffGroupingSym(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSymbol()) {
    element.append_attribute("symbol").set_value(this.StaffGroupingSymSymbolToStr(this.GetSymbol()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasSymbol(): boolean {
    return (this.m_symbol != staffGroupingSym_SYMBOL_NONE);
  }

  SetSymbol(value: any): void { this.m_symbol = value; }

  GetSymbol(): any { return this.m_symbol; }

}
export class InstStaffGroupingSym extends AttStaffGroupingSym {}

export abstract class AttStaffIdent extends Att {
  protected m_staff: any;
  constructor() { super(); this.ResetStaffIdent(); }

  ResetStaffIdent(): void {
    this.m_staff = [];
  }

  ReadStaffIdent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('staff').empty()) {
    this.SetStaff(this.StrToXsdPositiveIntegerList(element.attribute('staff').value()));
    if (removeAttr) element.remove_attribute("staff");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteStaffIdent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasStaff()) {
    element.append_attribute("staff").set_value(this.XsdPositiveIntegerListToStr(this.GetStaff()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasStaff(): boolean {
    return (this.m_staff.length !== 0);
  }

  SetStaff(value: any): void { this.m_staff = value; }

  GetStaff(): any { return this.m_staff; }

}
export class InstStaffIdent extends AttStaffIdent {}

export abstract class AttStaffItems extends Att {
  protected m_aboveorder: any;
  protected m_beloworder: any;
  protected m_betweenorder: any;
  constructor() { super(); this.ResetStaffItems(); }

  ResetStaffItems(): void {
    this.m_aboveorder = 0;
    this.m_beloworder = 0;
    this.m_betweenorder = 0;
  }

  ReadStaffItems(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('aboveorder').empty()) {
    this.SetAboveorder(this.StrToStaffitem(element.attribute('aboveorder').value()));
    if (removeAttr) element.remove_attribute("aboveorder");
    hasAttribute = true;
    }
    if (!element.attribute('beloworder').empty()) {
    this.SetBeloworder(this.StrToStaffitem(element.attribute('beloworder').value()));
    if (removeAttr) element.remove_attribute("beloworder");
    hasAttribute = true;
    }
    if (!element.attribute('betweenorder').empty()) {
    this.SetBetweenorder(this.StrToStaffitem(element.attribute('betweenorder').value()));
    if (removeAttr) element.remove_attribute("betweenorder");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteStaffItems(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAboveorder()) {
    element.append_attribute("aboveorder").set_value(this.StaffitemToStr(this.GetAboveorder()));
    wroteAttribute = true;
    }
    if (this.HasBeloworder()) {
    element.append_attribute("beloworder").set_value(this.StaffitemToStr(this.GetBeloworder()));
    wroteAttribute = true;
    }
    if (this.HasBetweenorder()) {
    element.append_attribute("betweenorder").set_value(this.StaffitemToStr(this.GetBetweenorder()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasAboveorder(): boolean {
    return (this.m_aboveorder !== 0);
  }

  HasBeloworder(): boolean {
    return (this.m_beloworder !== 0);
  }

  HasBetweenorder(): boolean {
    return (this.m_betweenorder !== 0);
  }

  SetAboveorder(value: any): void { this.m_aboveorder = value; }
  SetBeloworder(value: any): void { this.m_beloworder = value; }
  SetBetweenorder(value: any): void { this.m_betweenorder = value; }

  GetAboveorder(): any { return this.m_aboveorder; }
  GetBeloworder(): any { return this.m_beloworder; }
  GetBetweenorder(): any { return this.m_betweenorder; }

}
export class InstStaffItems extends AttStaffItems {}

export abstract class AttStaffLoc extends Att {
  protected m_loc: any;
  constructor() { super(); this.ResetStaffLoc(); }

  ResetStaffLoc(): void {
    this.m_loc = MEI_UNSET;
  }

  ReadStaffLoc(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('loc').empty()) {
    this.SetLoc(this.StrToInt(element.attribute('loc').value()));
    if (removeAttr) element.remove_attribute("loc");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteStaffLoc(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLoc()) {
    element.append_attribute("loc").set_value(this.IntToStr(this.GetLoc()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasLoc(): boolean {
    return (this.m_loc != MEI_UNSET);
  }

  SetLoc(value: any): void { this.m_loc = value; }

  GetLoc(): any { return this.m_loc; }

}
export class InstStaffLoc extends AttStaffLoc {}

export abstract class AttStaffLocPitched extends Att {
  protected m_ploc: any;
  protected m_oloc: any;
  constructor() { super(); this.ResetStaffLocPitched(); }

  ResetStaffLocPitched(): void {
    this.m_ploc = c.PITCHNAME_NONE;
    this.m_oloc = MEI_UNSET_OCT_LOCAL;
  }

  ReadStaffLocPitched(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('ploc').empty()) {
    this.SetPloc(this.StrToPitchname(element.attribute('ploc').value()));
    if (removeAttr) element.remove_attribute("ploc");
    hasAttribute = true;
    }
    if (!element.attribute('oloc').empty()) {
    this.SetOloc(this.StrToOctave(element.attribute('oloc').value()));
    if (removeAttr) element.remove_attribute("oloc");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteStaffLocPitched(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasPloc()) {
    element.append_attribute("ploc").set_value(this.PitchnameToStr(this.GetPloc()));
    wroteAttribute = true;
    }
    if (this.HasOloc()) {
    element.append_attribute("oloc").set_value(this.OctaveToStr(this.GetOloc()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasPloc(): boolean {
    return (this.m_ploc != c.PITCHNAME_NONE);
  }

  HasOloc(): boolean {
    return (this.m_oloc != MEI_UNSET_OCT_LOCAL);
  }

  SetPloc(value: any): void { this.m_ploc = value; }
  SetOloc(value: any): void { this.m_oloc = value; }

  GetPloc(): any { return this.m_ploc; }
  GetOloc(): any { return this.m_oloc; }

}
export class InstStaffLocPitched extends AttStaffLocPitched {}

export abstract class AttStartEndId extends Att {
  protected m_endid: any;
  constructor() { super(); this.ResetStartEndId(); }

  ResetStartEndId(): void {
    this.m_endid = "";
  }

  ReadStartEndId(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('endid').empty()) {
    this.SetEndid(this.StrToStr(element.attribute('endid').value()));
    if (removeAttr) element.remove_attribute("endid");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteStartEndId(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasEndid()) {
    element.append_attribute("endid").set_value(this.StrToStr(this.GetEndid()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasEndid(): boolean {
    return (this.m_endid != "");
  }

  SetEndid(value: any): void { this.m_endid = value; }

  GetEndid(): any { return this.m_endid; }

}
export class InstStartEndId extends AttStartEndId {}

export abstract class AttStartId extends Att {
  protected m_startid: any;
  constructor() { super(); this.ResetStartId(); }

  ResetStartId(): void {
    this.m_startid = "";
  }

  ReadStartId(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('startid').empty()) {
    this.SetStartid(this.StrToStr(element.attribute('startid').value()));
    if (removeAttr) element.remove_attribute("startid");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteStartId(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasStartid()) {
    element.append_attribute("startid").set_value(this.StrToStr(this.GetStartid()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasStartid(): boolean {
    return (this.m_startid != "");
  }

  SetStartid(value: any): void { this.m_startid = value; }

  GetStartid(): any { return this.m_startid; }

}
export class InstStartId extends AttStartId {}

export abstract class AttStems extends Att {
  protected m_stemDir: any;
  protected m_stemLen: any;
  protected m_stemMod: any;
  protected m_stemPos: any;
  protected m_stemSameas: any;
  protected m_stemVisible: any;
  protected m_stemX: any;
  protected m_stemY: any;
  constructor() { super(); this.ResetStems(); }

  ResetStems(): void {
    this.m_stemDir = STEMDIRECTION_NONE;
    this.m_stemLen = -1.0;
    this.m_stemMod = STEMMODIFIER_NONE;
    this.m_stemPos = STEMPOSITION_NONE;
    this.m_stemSameas = "";
    this.m_stemVisible = BOOLEAN_NONE;
    this.m_stemX = 0.0;
    this.m_stemY = 0.0;
  }

  ReadStems(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('stem.dir').empty()) {
    this.SetStemDir(this.StrToStemdirection(element.attribute('stem.dir').value()));
    if (removeAttr) element.remove_attribute("stem.dir");
    hasAttribute = true;
    }
    if (!element.attribute('stem.len').empty()) {
    this.SetStemLen(this.StrToDbl(element.attribute('stem.len').value()));
    if (removeAttr) element.remove_attribute("stem.len");
    hasAttribute = true;
    }
    if (!element.attribute('stem.mod').empty()) {
    this.SetStemMod(this.StrToStemmodifier(element.attribute('stem.mod').value()));
    if (removeAttr) element.remove_attribute("stem.mod");
    hasAttribute = true;
    }
    if (!element.attribute('stem.pos').empty()) {
    this.SetStemPos(this.StrToStemposition(element.attribute('stem.pos').value()));
    if (removeAttr) element.remove_attribute("stem.pos");
    hasAttribute = true;
    }
    if (!element.attribute('stem.sameas').empty()) {
    this.SetStemSameas(this.StrToStr(element.attribute('stem.sameas').value()));
    if (removeAttr) element.remove_attribute("stem.sameas");
    hasAttribute = true;
    }
    if (!element.attribute('stem.visible').empty()) {
    this.SetStemVisible(this.StrToBoolean(element.attribute('stem.visible').value()));
    if (removeAttr) element.remove_attribute("stem.visible");
    hasAttribute = true;
    }
    if (!element.attribute('stem.x').empty()) {
    this.SetStemX(this.StrToDbl(element.attribute('stem.x').value()));
    if (removeAttr) element.remove_attribute("stem.x");
    hasAttribute = true;
    }
    if (!element.attribute('stem.y').empty()) {
    this.SetStemY(this.StrToDbl(element.attribute('stem.y').value()));
    if (removeAttr) element.remove_attribute("stem.y");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteStems(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasStemDir()) {
    element.append_attribute("stem.dir").set_value(this.StemdirectionToStr(this.GetStemDir()));
    wroteAttribute = true;
    }
    if (this.HasStemLen()) {
    element.append_attribute("stem.len").set_value(this.DblToStr(this.GetStemLen()));
    wroteAttribute = true;
    }
    if (this.HasStemMod()) {
    element.append_attribute("stem.mod").set_value(this.StemmodifierToStr(this.GetStemMod()));
    wroteAttribute = true;
    }
    if (this.HasStemPos()) {
    element.append_attribute("stem.pos").set_value(this.StempositionToStr(this.GetStemPos()));
    wroteAttribute = true;
    }
    if (this.HasStemSameas()) {
    element.append_attribute("stem.sameas").set_value(this.StrToStr(this.GetStemSameas()));
    wroteAttribute = true;
    }
    if (this.HasStemVisible()) {
    element.append_attribute("stem.visible").set_value(this.BooleanToStr(this.GetStemVisible()));
    wroteAttribute = true;
    }
    if (this.HasStemX()) {
    element.append_attribute("stem.x").set_value(this.DblToStr(this.GetStemX()));
    wroteAttribute = true;
    }
    if (this.HasStemY()) {
    element.append_attribute("stem.y").set_value(this.DblToStr(this.GetStemY()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasStemDir(): boolean {
    return (this.m_stemDir != STEMDIRECTION_NONE);
  }

  HasStemLen(): boolean {
    return (this.m_stemLen != -1.0);
  }

  HasStemMod(): boolean {
    return (this.m_stemMod != STEMMODIFIER_NONE);
  }

  HasStemPos(): boolean {
    return (this.m_stemPos != STEMPOSITION_NONE);
  }

  HasStemSameas(): boolean {
    return (this.m_stemSameas != "");
  }

  HasStemVisible(): boolean {
    return (this.m_stemVisible != BOOLEAN_NONE);
  }

  HasStemX(): boolean {
    return (this.m_stemX != 0.0);
  }

  HasStemY(): boolean {
    return (this.m_stemY != 0.0);
  }

  SetStemDir(value: any): void { this.m_stemDir = value; }
  SetStemLen(value: any): void { this.m_stemLen = value; }
  SetStemMod(value: any): void { this.m_stemMod = value; }
  SetStemPos(value: any): void { this.m_stemPos = value; }
  SetStemSameas(value: any): void { this.m_stemSameas = value; }
  SetStemVisible(value: any): void { this.m_stemVisible = value; }
  SetStemX(value: any): void { this.m_stemX = value; }
  SetStemY(value: any): void { this.m_stemY = value; }

  GetStemDir(): any { return this.m_stemDir; }
  GetStemLen(): any { return this.m_stemLen; }
  GetStemMod(): any { return this.m_stemMod; }
  GetStemPos(): any { return this.m_stemPos; }
  GetStemSameas(): any { return this.m_stemSameas; }
  GetStemVisible(): any { return this.m_stemVisible; }
  GetStemX(): any { return this.m_stemX; }
  GetStemY(): any { return this.m_stemY; }

}
export class InstStems extends AttStems {}

export abstract class AttSylLog extends Att {
  protected m_con: any;
  protected m_wordpos: any;
  constructor() { super(); this.ResetSylLog(); }

  ResetSylLog(): void {
    this.m_con = sylLog_CON_NONE;
    this.m_wordpos = sylLog_WORDPOS_NONE;
  }

  ReadSylLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('con').empty()) {
    this.SetCon(this.StrToSylLogCon(element.attribute('con').value()));
    if (removeAttr) element.remove_attribute("con");
    hasAttribute = true;
    }
    if (!element.attribute('wordpos').empty()) {
    this.SetWordpos(this.StrToSylLogWordpos(element.attribute('wordpos').value()));
    if (removeAttr) element.remove_attribute("wordpos");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteSylLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCon()) {
    element.append_attribute("con").set_value(this.SylLogConToStr(this.GetCon()));
    wroteAttribute = true;
    }
    if (this.HasWordpos()) {
    element.append_attribute("wordpos").set_value(this.SylLogWordposToStr(this.GetWordpos()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasCon(): boolean {
    return (this.m_con != sylLog_CON_NONE);
  }

  HasWordpos(): boolean {
    return (this.m_wordpos != sylLog_WORDPOS_NONE);
  }

  SetCon(value: any): void { this.m_con = value; }
  SetWordpos(value: any): void { this.m_wordpos = value; }

  GetCon(): any { return this.m_con; }
  GetWordpos(): any { return this.m_wordpos; }

}
export class InstSylLog extends AttSylLog {}

export abstract class AttSylText extends Att {
  protected m_syl: any;
  constructor() { super(); this.ResetSylText(); }

  ResetSylText(): void {
    this.m_syl = "";
  }

  ReadSylText(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('syl').empty()) {
    this.SetSyl(this.StrToStr(element.attribute('syl').value()));
    if (removeAttr) element.remove_attribute("syl");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteSylText(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSyl()) {
    element.append_attribute("syl").set_value(this.StrToStr(this.GetSyl()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasSyl(): boolean {
    return (this.m_syl != "");
  }

  SetSyl(value: any): void { this.m_syl = value; }

  GetSyl(): any { return this.m_syl; }

}
export class InstSylText extends AttSylText {}

export abstract class AttSystems extends Att {
  protected m_systemLeftline: any;
  protected m_systemLeftmar: any;
  protected m_systemRightmar: any;
  protected m_systemTopmar: any;
  constructor() { super(); this.ResetSystems(); }

  ResetSystems(): void {
    this.m_systemLeftline = BOOLEAN_NONE;
    this.m_systemLeftmar = new data_MEASUREMENTUNSIGNED();
    this.m_systemRightmar = new data_MEASUREMENTUNSIGNED();
    this.m_systemTopmar = new data_MEASUREMENTUNSIGNED();
  }

  ReadSystems(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('system.leftline').empty()) {
    this.SetSystemLeftline(this.StrToBoolean(element.attribute('system.leftline').value()));
    if (removeAttr) element.remove_attribute("system.leftline");
    hasAttribute = true;
    }
    if (!element.attribute('system.leftmar').empty()) {
    this.SetSystemLeftmar(this.StrToMeasurementunsigned(element.attribute('system.leftmar').value()));
    if (removeAttr) element.remove_attribute("system.leftmar");
    hasAttribute = true;
    }
    if (!element.attribute('system.rightmar').empty()) {
    this.SetSystemRightmar(this.StrToMeasurementunsigned(element.attribute('system.rightmar').value()));
    if (removeAttr) element.remove_attribute("system.rightmar");
    hasAttribute = true;
    }
    if (!element.attribute('system.topmar').empty()) {
    this.SetSystemTopmar(this.StrToMeasurementunsigned(element.attribute('system.topmar').value()));
    if (removeAttr) element.remove_attribute("system.topmar");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteSystems(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSystemLeftline()) {
    element.append_attribute("system.leftline").set_value(this.BooleanToStr(this.GetSystemLeftline()));
    wroteAttribute = true;
    }
    if (this.HasSystemLeftmar()) {
    element.append_attribute("system.leftmar").set_value(this.MeasurementunsignedToStr(this.GetSystemLeftmar()));
    wroteAttribute = true;
    }
    if (this.HasSystemRightmar()) {
    element.append_attribute("system.rightmar").set_value(this.MeasurementunsignedToStr(this.GetSystemRightmar()));
    wroteAttribute = true;
    }
    if (this.HasSystemTopmar()) {
    element.append_attribute("system.topmar").set_value(this.MeasurementunsignedToStr(this.GetSystemTopmar()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasSystemLeftline(): boolean {
    return (this.m_systemLeftline != BOOLEAN_NONE);
  }

  HasSystemLeftmar(): boolean {
    return (this.m_systemLeftmar?.HasValue?.() === true);
  }

  HasSystemRightmar(): boolean {
    return (this.m_systemRightmar?.HasValue?.() === true);
  }

  HasSystemTopmar(): boolean {
    return (this.m_systemTopmar?.HasValue?.() === true);
  }

  SetSystemLeftline(value: any): void { this.m_systemLeftline = value; }
  SetSystemLeftmar(value: any): void { this.m_systemLeftmar = value; }
  SetSystemRightmar(value: any): void { this.m_systemRightmar = value; }
  SetSystemTopmar(value: any): void { this.m_systemTopmar = value; }

  GetSystemLeftline(): any { return this.m_systemLeftline; }
  GetSystemLeftmar(): any { return this.m_systemLeftmar; }
  GetSystemRightmar(): any { return this.m_systemRightmar; }
  GetSystemTopmar(): any { return this.m_systemTopmar; }

}
export class InstSystems extends AttSystems {}

export abstract class AttTargetEval extends Att {
  protected m_evaluate: any;
  constructor() { super(); this.ResetTargetEval(); }

  ResetTargetEval(): void {
    this.m_evaluate = targetEval_EVALUATE_NONE;
  }

  ReadTargetEval(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('evaluate').empty()) {
    this.SetEvaluate(this.StrToTargetEvalEvaluate(element.attribute('evaluate').value()));
    if (removeAttr) element.remove_attribute("evaluate");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteTargetEval(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasEvaluate()) {
    element.append_attribute("evaluate").set_value(this.TargetEvalEvaluateToStr(this.GetEvaluate()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasEvaluate(): boolean {
    return (this.m_evaluate != targetEval_EVALUATE_NONE);
  }

  SetEvaluate(value: any): void { this.m_evaluate = value; }

  GetEvaluate(): any { return this.m_evaluate; }

}
export class InstTargetEval extends AttTargetEval {}

export abstract class AttTempoLog extends Att {
  protected m_func: any;
  constructor() { super(); this.ResetTempoLog(); }

  ResetTempoLog(): void {
    this.m_func = tempoLog_FUNC_NONE;
  }

  ReadTempoLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('func').empty()) {
    this.SetFunc(this.StrToTempoLogFunc(element.attribute('func').value()));
    if (removeAttr) element.remove_attribute("func");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteTempoLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasFunc()) {
    element.append_attribute("func").set_value(this.TempoLogFuncToStr(this.GetFunc()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasFunc(): boolean {
    return (this.m_func != tempoLog_FUNC_NONE);
  }

  SetFunc(value: any): void { this.m_func = value; }

  GetFunc(): any { return this.m_func; }

}
export class InstTempoLog extends AttTempoLog {}

export abstract class AttTextRendition extends Att {
  protected m_altrend: any;
  protected m_rend: any;
  constructor() { super(); this.ResetTextRendition(); }

  ResetTextRendition(): void {
    this.m_altrend = "";
    this.m_rend = TEXTRENDITION_NONE;
  }

  ReadTextRendition(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('altrend').empty()) {
    this.SetAltrend(this.StrToStr(element.attribute('altrend').value()));
    if (removeAttr) element.remove_attribute("altrend");
    hasAttribute = true;
    }
    if (!element.attribute('rend').empty()) {
    this.SetRend(this.StrToTextrendition(element.attribute('rend').value()));
    if (removeAttr) element.remove_attribute("rend");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteTextRendition(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAltrend()) {
    element.append_attribute("altrend").set_value(this.StrToStr(this.GetAltrend()));
    wroteAttribute = true;
    }
    if (this.HasRend()) {
    element.append_attribute("rend").set_value(this.TextrenditionToStr(this.GetRend()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasAltrend(): boolean {
    return (this.m_altrend != "");
  }

  HasRend(): boolean {
    return (this.m_rend != TEXTRENDITION_NONE);
  }

  SetAltrend(value: any): void { this.m_altrend = value; }
  SetRend(value: any): void { this.m_rend = value; }

  GetAltrend(): any { return this.m_altrend; }
  GetRend(): any { return this.m_rend; }

}
export class InstTextRendition extends AttTextRendition {}

export abstract class AttTextStyle extends Att {
  protected m_textFam: any;
  protected m_textName: any;
  protected m_textSize: any;
  protected m_textStyle: any;
  protected m_textWeight: any;
  constructor() { super(); this.ResetTextStyle(); }

  ResetTextStyle(): void {
    this.m_textFam = "";
    this.m_textName = "";
    this.m_textSize = new c.data_FONTSIZE();
    this.m_textStyle = FONTSTYLE_NONE;
    this.m_textWeight = FONTWEIGHT_NONE;
  }

  ReadTextStyle(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('text.fam').empty()) {
    this.SetTextFam(this.StrToStr(element.attribute('text.fam').value()));
    if (removeAttr) element.remove_attribute("text.fam");
    hasAttribute = true;
    }
    if (!element.attribute('text.name').empty()) {
    this.SetTextName(this.StrToStr(element.attribute('text.name').value()));
    if (removeAttr) element.remove_attribute("text.name");
    hasAttribute = true;
    }
    if (!element.attribute('text.size').empty()) {
    this.SetTextSize(this.StrToFontsize(element.attribute('text.size').value()));
    if (removeAttr) element.remove_attribute("text.size");
    hasAttribute = true;
    }
    if (!element.attribute('text.style').empty()) {
    this.SetTextStyle(this.StrToFontstyle(element.attribute('text.style').value()));
    if (removeAttr) element.remove_attribute("text.style");
    hasAttribute = true;
    }
    if (!element.attribute('text.weight').empty()) {
    this.SetTextWeight(this.StrToFontweight(element.attribute('text.weight').value()));
    if (removeAttr) element.remove_attribute("text.weight");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteTextStyle(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTextFam()) {
    element.append_attribute("text.fam").set_value(this.StrToStr(this.GetTextFam()));
    wroteAttribute = true;
    }
    if (this.HasTextName()) {
    element.append_attribute("text.name").set_value(this.StrToStr(this.GetTextName()));
    wroteAttribute = true;
    }
    if (this.HasTextSize()) {
    element.append_attribute("text.size").set_value(this.FontsizeToStr(this.GetTextSize()));
    wroteAttribute = true;
    }
    if (this.HasTextStyle()) {
    element.append_attribute("text.style").set_value(this.FontstyleToStr(this.GetTextStyle()));
    wroteAttribute = true;
    }
    if (this.HasTextWeight()) {
    element.append_attribute("text.weight").set_value(this.FontweightToStr(this.GetTextWeight()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasTextFam(): boolean {
    return (this.m_textFam != "");
  }

  HasTextName(): boolean {
    return (this.m_textName != "");
  }

  HasTextSize(): boolean {
    return (this.m_textSize.HasValue());
  }

  HasTextStyle(): boolean {
    return (this.m_textStyle != FONTSTYLE_NONE);
  }

  HasTextWeight(): boolean {
    return (this.m_textWeight != FONTWEIGHT_NONE);
  }

  SetTextFam(value: any): void { this.m_textFam = value; }
  SetTextName(value: any): void { this.m_textName = value; }
  SetTextSize(value: any): void { this.m_textSize = value; }
  SetTextStyle(value: any): void { this.m_textStyle = value; }
  SetTextWeight(value: any): void { this.m_textWeight = value; }

  GetTextFam(): any { return this.m_textFam; }
  GetTextName(): any { return this.m_textName; }
  GetTextSize(): any { return this.m_textSize; }
  GetTextStyle(): any { return this.m_textStyle; }
  GetTextWeight(): any { return this.m_textWeight; }

}
export class InstTextStyle extends AttTextStyle {}

export abstract class AttTiePresent extends Att {
  protected m_tie: any;
  constructor() { super(); this.ResetTiePresent(); }

  ResetTiePresent(): void {
    this.m_tie = c.TIE_NONE;
  }

  ReadTiePresent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('tie').empty()) {
    this.SetTie(this.StrToTie(element.attribute('tie').value()));
    if (removeAttr) element.remove_attribute("tie");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteTiePresent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTie()) {
    element.append_attribute("tie").set_value(this.TieToStr(this.GetTie()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasTie(): boolean {
    return (this.m_tie != c.TIE_NONE);
  }

  SetTie(value: any): void { this.m_tie = value; }

  GetTie(): any { return this.m_tie; }

}
export class InstTiePresent extends AttTiePresent {}

export abstract class AttTimestampLog extends Att {
  protected m_tstamp: any;
  constructor() { super(); this.ResetTimestampLog(); }

  ResetTimestampLog(): void {
    this.m_tstamp = -1.0;
  }

  ReadTimestampLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('tstamp').empty()) {
    this.SetTstamp(this.StrToDbl(element.attribute('tstamp').value()));
    if (removeAttr) element.remove_attribute("tstamp");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteTimestampLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTstamp()) {
    element.append_attribute("tstamp").set_value(this.DblToStr(this.GetTstamp()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasTstamp(): boolean {
    return (this.m_tstamp != -1.0);
  }

  SetTstamp(value: any): void { this.m_tstamp = value; }

  GetTstamp(): any { return this.m_tstamp; }

}
export class InstTimestampLog extends AttTimestampLog {}

export abstract class AttTimestamp2Log extends Att {
  protected m_tstamp2: any;
  constructor() { super(); this.ResetTimestamp2Log(); }

  ResetTimestamp2Log(): void {
    this.m_tstamp2 = [-1, -1.0];
  }

  ReadTimestamp2Log(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('tstamp2').empty()) {
    this.SetTstamp2(this.StrToMeasurebeat(element.attribute('tstamp2').value()));
    if (removeAttr) element.remove_attribute("tstamp2");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteTimestamp2Log(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTstamp2()) {
    element.append_attribute("tstamp2").set_value(this.MeasurebeatToStr(this.GetTstamp2()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasTstamp2(): boolean {
    return !(Array.isArray(this.m_tstamp2) && this.m_tstamp2[0] === -1 && this.m_tstamp2[1] === -1.0);
  }

  SetTstamp2(value: any): void { this.m_tstamp2 = value; }

  GetTstamp2(): any { return this.m_tstamp2; }

}
export class InstTimestamp2Log extends AttTimestamp2Log {}

export abstract class AttTransposition extends Att {
  protected m_transDiat: any;
  protected m_transSemi: any;
  constructor() { super(); this.ResetTransposition(); }

  ResetTransposition(): void {
    this.m_transDiat = MEI_UNSET;
    this.m_transSemi = MEI_UNSET;
  }

  ReadTransposition(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('trans.diat').empty()) {
    this.SetTransDiat(this.StrToInt(element.attribute('trans.diat').value()));
    if (removeAttr) element.remove_attribute("trans.diat");
    hasAttribute = true;
    }
    if (!element.attribute('trans.semi').empty()) {
    this.SetTransSemi(this.StrToInt(element.attribute('trans.semi').value()));
    if (removeAttr) element.remove_attribute("trans.semi");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteTransposition(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTransDiat()) {
    element.append_attribute("trans.diat").set_value(this.IntToStr(this.GetTransDiat()));
    wroteAttribute = true;
    }
    if (this.HasTransSemi()) {
    element.append_attribute("trans.semi").set_value(this.IntToStr(this.GetTransSemi()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasTransDiat(): boolean {
    return (this.m_transDiat != MEI_UNSET);
  }

  HasTransSemi(): boolean {
    return (this.m_transSemi != MEI_UNSET);
  }

  SetTransDiat(value: any): void { this.m_transDiat = value; }
  SetTransSemi(value: any): void { this.m_transSemi = value; }

  GetTransDiat(): any { return this.m_transDiat; }
  GetTransSemi(): any { return this.m_transSemi; }

}
export class InstTransposition extends AttTransposition {}

export abstract class AttTuning extends Att {
  protected m_tuneHz: any;
  protected m_tunePname: any;
  protected m_tuneTemper: any;
  constructor() { super(); this.ResetTuning(); }

  ResetTuning(): void {
    this.m_tuneHz = 0.0;
    this.m_tunePname = c.PITCHNAME_NONE;
    this.m_tuneTemper = TEMPERAMENT_NONE;
  }

  ReadTuning(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('tune.Hz').empty()) {
    this.SetTuneHz(this.StrToDbl(element.attribute('tune.Hz').value()));
    if (removeAttr) element.remove_attribute("tune.Hz");
    hasAttribute = true;
    }
    if (!element.attribute('tune.pname').empty()) {
    this.SetTunePname(this.StrToPitchname(element.attribute('tune.pname').value()));
    if (removeAttr) element.remove_attribute("tune.pname");
    hasAttribute = true;
    }
    if (!element.attribute('tune.temper').empty()) {
    this.SetTuneTemper(this.StrToTemperament(element.attribute('tune.temper').value()));
    if (removeAttr) element.remove_attribute("tune.temper");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteTuning(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTuneHz()) {
    element.append_attribute("tune.Hz").set_value(this.DblToStr(this.GetTuneHz()));
    wroteAttribute = true;
    }
    if (this.HasTunePname()) {
    element.append_attribute("tune.pname").set_value(this.PitchnameToStr(this.GetTunePname()));
    wroteAttribute = true;
    }
    if (this.HasTuneTemper()) {
    element.append_attribute("tune.temper").set_value(this.TemperamentToStr(this.GetTuneTemper()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasTuneHz(): boolean {
    return (this.m_tuneHz != 0.0);
  }

  HasTunePname(): boolean {
    return (this.m_tunePname != c.PITCHNAME_NONE);
  }

  HasTuneTemper(): boolean {
    return (this.m_tuneTemper != TEMPERAMENT_NONE);
  }

  SetTuneHz(value: any): void { this.m_tuneHz = value; }
  SetTunePname(value: any): void { this.m_tunePname = value; }
  SetTuneTemper(value: any): void { this.m_tuneTemper = value; }

  GetTuneHz(): any { return this.m_tuneHz; }
  GetTunePname(): any { return this.m_tunePname; }
  GetTuneTemper(): any { return this.m_tuneTemper; }

}
export class InstTuning extends AttTuning {}

export abstract class AttTuningLog extends Att {
  protected m_tuningStandard: any;
  constructor() { super(); this.ResetTuningLog(); }

  ResetTuningLog(): void {
    this.m_tuningStandard = COURSETUNING_NONE;
  }

  ReadTuningLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('tuning.standard').empty()) {
    this.SetTuningStandard(this.StrToCoursetuning(element.attribute('tuning.standard').value()));
    if (removeAttr) element.remove_attribute("tuning.standard");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteTuningLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTuningStandard()) {
    element.append_attribute("tuning.standard").set_value(this.CoursetuningToStr(this.GetTuningStandard()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasTuningStandard(): boolean {
    return (this.m_tuningStandard != COURSETUNING_NONE);
  }

  SetTuningStandard(value: any): void { this.m_tuningStandard = value; }

  GetTuningStandard(): any { return this.m_tuningStandard; }

}
export class InstTuningLog extends AttTuningLog {}

export abstract class AttTupletPresent extends Att {
  protected m_tuplet: any;
  constructor() { super(); this.ResetTupletPresent(); }

  ResetTupletPresent(): void {
    this.m_tuplet = "";
  }

  ReadTupletPresent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('tuplet').empty()) {
    this.SetTuplet(this.StrToStr(element.attribute('tuplet').value()));
    if (removeAttr) element.remove_attribute("tuplet");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteTupletPresent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTuplet()) {
    element.append_attribute("tuplet").set_value(this.StrToStr(this.GetTuplet()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasTuplet(): boolean {
    return (this.m_tuplet != "");
  }

  SetTuplet(value: any): void { this.m_tuplet = value; }

  GetTuplet(): any { return this.m_tuplet; }

}
export class InstTupletPresent extends AttTupletPresent {}

export abstract class AttTyped extends Att {
  protected m_type: any;
  constructor() { super(); this.ResetTyped(); }

  ResetTyped(): void {
    this.m_type = "";
  }

  ReadTyped(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('type').empty()) {
    this.SetType(this.StrToStr(element.attribute('type').value()));
    if (removeAttr) element.remove_attribute("type");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteTyped(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasType()) {
    element.append_attribute("type").set_value(this.StrToStr(this.GetType()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasType(): boolean {
    return (this.m_type != "");
  }

  SetType(value: any): void { this.m_type = value; }

  GetType(): any { return this.m_type; }

}
export class InstTyped extends AttTyped {}

export abstract class AttTypography extends Att {
  protected m_fontfam: any;
  protected m_fontname: any;
  protected m_fontsize: any;
  protected m_fontstyle: any;
  protected m_fontweight: any;
  protected m_letterspacing: any;
  protected m_lineheight: any;
  constructor() { super(); this.ResetTypography(); }

  ResetTypography(): void {
    this.m_fontfam = "";
    this.m_fontname = "";
    this.m_fontsize = new c.data_FONTSIZE();
    this.m_fontstyle = FONTSTYLE_NONE;
    this.m_fontweight = FONTWEIGHT_NONE;
    this.m_letterspacing = 0.0;
    this.m_lineheight = "";
  }

  ReadTypography(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('fontfam').empty()) {
    this.SetFontfam(this.StrToStr(element.attribute('fontfam').value()));
    if (removeAttr) element.remove_attribute("fontfam");
    hasAttribute = true;
    }
    if (!element.attribute('fontname').empty()) {
    this.SetFontname(this.StrToStr(element.attribute('fontname').value()));
    if (removeAttr) element.remove_attribute("fontname");
    hasAttribute = true;
    }
    if (!element.attribute('fontsize').empty()) {
    this.SetFontsize(this.StrToFontsize(element.attribute('fontsize').value()));
    if (removeAttr) element.remove_attribute("fontsize");
    hasAttribute = true;
    }
    if (!element.attribute('fontstyle').empty()) {
    this.SetFontstyle(this.StrToFontstyle(element.attribute('fontstyle').value()));
    if (removeAttr) element.remove_attribute("fontstyle");
    hasAttribute = true;
    }
    if (!element.attribute('fontweight').empty()) {
    this.SetFontweight(this.StrToFontweight(element.attribute('fontweight').value()));
    if (removeAttr) element.remove_attribute("fontweight");
    hasAttribute = true;
    }
    if (!element.attribute('letterspacing').empty()) {
    this.SetLetterspacing(this.StrToDbl(element.attribute('letterspacing').value()));
    if (removeAttr) element.remove_attribute("letterspacing");
    hasAttribute = true;
    }
    if (!element.attribute('lineheight').empty()) {
    this.SetLineheight(this.StrToStr(element.attribute('lineheight').value()));
    if (removeAttr) element.remove_attribute("lineheight");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteTypography(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasFontfam()) {
    element.append_attribute("fontfam").set_value(this.StrToStr(this.GetFontfam()));
    wroteAttribute = true;
    }
    if (this.HasFontname()) {
    element.append_attribute("fontname").set_value(this.StrToStr(this.GetFontname()));
    wroteAttribute = true;
    }
    if (this.HasFontsize()) {
    element.append_attribute("fontsize").set_value(this.FontsizeToStr(this.GetFontsize()));
    wroteAttribute = true;
    }
    if (this.HasFontstyle()) {
    element.append_attribute("fontstyle").set_value(this.FontstyleToStr(this.GetFontstyle()));
    wroteAttribute = true;
    }
    if (this.HasFontweight()) {
    element.append_attribute("fontweight").set_value(this.FontweightToStr(this.GetFontweight()));
    wroteAttribute = true;
    }
    if (this.HasLetterspacing()) {
    element.append_attribute("letterspacing").set_value(this.DblToStr(this.GetLetterspacing()));
    wroteAttribute = true;
    }
    if (this.HasLineheight()) {
    element.append_attribute("lineheight").set_value(this.StrToStr(this.GetLineheight()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasFontfam(): boolean {
    return (this.m_fontfam != "");
  }

  HasFontname(): boolean {
    return (this.m_fontname != "");
  }

  HasFontsize(): boolean {
    return (this.m_fontsize.HasValue());
  }

  HasFontstyle(): boolean {
    return (this.m_fontstyle != FONTSTYLE_NONE);
  }

  HasFontweight(): boolean {
    return (this.m_fontweight != FONTWEIGHT_NONE);
  }

  HasLetterspacing(): boolean {
    return (this.m_letterspacing != 0.0);
  }

  HasLineheight(): boolean {
    return (this.m_lineheight != "");
  }

  SetFontfam(value: any): void { this.m_fontfam = value; }
  SetFontname(value: any): void { this.m_fontname = value; }
  SetFontsize(value: any): void { this.m_fontsize = value; }
  SetFontstyle(value: any): void { this.m_fontstyle = value; }
  SetFontweight(value: any): void { this.m_fontweight = value; }
  SetLetterspacing(value: any): void { this.m_letterspacing = value; }
  SetLineheight(value: any): void { this.m_lineheight = value; }

  GetFontfam(): any { return this.m_fontfam; }
  GetFontname(): any { return this.m_fontname; }
  GetFontsize(): any { return this.m_fontsize; }
  GetFontsizeAlternate(): any { return this.m_fontsize; }
  GetFontstyle(): any { return this.m_fontstyle; }
  GetFontweight(): any { return this.m_fontweight; }
  GetLetterspacing(): any { return this.m_letterspacing; }
  GetLineheight(): any { return this.m_lineheight; }

}
export class InstTypography extends AttTypography {}

export abstract class AttVerticalAlign extends Att {
  protected m_valign: any;
  constructor() { super(); this.ResetVerticalAlign(); }

  ResetVerticalAlign(): void {
    this.m_valign = VERTICALALIGNMENT_NONE;
  }

  ReadVerticalAlign(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('valign').empty()) {
    this.SetValign(this.StrToVerticalalignment(element.attribute('valign').value()));
    if (removeAttr) element.remove_attribute("valign");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteVerticalAlign(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasValign()) {
    element.append_attribute("valign").set_value(this.VerticalalignmentToStr(this.GetValign()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasValign(): boolean {
    return (this.m_valign != VERTICALALIGNMENT_NONE);
  }

  SetValign(value: any): void { this.m_valign = value; }

  GetValign(): any { return this.m_valign; }

}
export class InstVerticalAlign extends AttVerticalAlign {}

export abstract class AttVerticalGroup extends Att {
  protected m_vgrp: any;
  constructor() { super(); this.ResetVerticalGroup(); }

  ResetVerticalGroup(): void {
    this.m_vgrp = MEI_UNSET;
  }

  ReadVerticalGroup(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('vgrp').empty()) {
    this.SetVgrp(this.StrToInt(element.attribute('vgrp').value()));
    if (removeAttr) element.remove_attribute("vgrp");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteVerticalGroup(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasVgrp()) {
    element.append_attribute("vgrp").set_value(this.IntToStr(this.GetVgrp()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasVgrp(): boolean {
    return (this.m_vgrp != MEI_UNSET);
  }

  SetVgrp(value: any): void { this.m_vgrp = value; }

  GetVgrp(): any { return this.m_vgrp; }

}
export class InstVerticalGroup extends AttVerticalGroup {}

export abstract class AttVisibility extends Att {
  protected m_visible: any;
  constructor() { super(); this.ResetVisibility(); }

  ResetVisibility(): void {
    this.m_visible = BOOLEAN_NONE;
  }

  ReadVisibility(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('visible').empty()) {
    this.SetVisible(this.StrToBoolean(element.attribute('visible').value()));
    if (removeAttr) element.remove_attribute("visible");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteVisibility(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasVisible()) {
    element.append_attribute("visible").set_value(this.BooleanToStr(this.GetVisible()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasVisible(): boolean {
    return (this.m_visible != BOOLEAN_NONE);
  }

  SetVisible(value: any): void { this.m_visible = value; }

  GetVisible(): any { return this.m_visible; }

}
export class InstVisibility extends AttVisibility {}

export abstract class AttVisualOffsetHo extends Att {
  protected m_ho: any;
  constructor() { super(); this.ResetVisualOffsetHo(); }

  ResetVisualOffsetHo(): void {
    this.m_ho = new c.data_MEASUREMENTSIGNED();
  }

  ReadVisualOffsetHo(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('ho').empty()) {
    this.SetHo(this.StrToMeasurementsigned(element.attribute('ho').value()));
    if (removeAttr) element.remove_attribute("ho");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteVisualOffsetHo(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasHo()) {
    element.append_attribute("ho").set_value(this.MeasurementsignedToStr(this.GetHo()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasHo(): boolean {
    return (this.m_ho?.HasValue?.() === true);
  }

  SetHo(value: any): void { this.m_ho = value; }

  GetHo(): any { return this.m_ho; }

}
export class InstVisualOffsetHo extends AttVisualOffsetHo {}

export abstract class AttVisualOffsetTo extends Att {
  protected m_to: any;
  constructor() { super(); this.ResetVisualOffsetTo(); }

  ResetVisualOffsetTo(): void {
    this.m_to = 0.0;
  }

  ReadVisualOffsetTo(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('to').empty()) {
    this.SetTo(this.StrToDbl(element.attribute('to').value()));
    if (removeAttr) element.remove_attribute("to");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteVisualOffsetTo(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTo()) {
    element.append_attribute("to").set_value(this.DblToStr(this.GetTo()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasTo(): boolean {
    return (this.m_to != 0.0);
  }

  SetTo(value: any): void { this.m_to = value; }

  GetTo(): any { return this.m_to; }

}
export class InstVisualOffsetTo extends AttVisualOffsetTo {}

export abstract class AttVisualOffsetVo extends Att {
  protected m_vo: any;
  constructor() { super(); this.ResetVisualOffsetVo(); }

  ResetVisualOffsetVo(): void {
    this.m_vo = new c.data_MEASUREMENTSIGNED();
  }

  ReadVisualOffsetVo(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('vo').empty()) {
    this.SetVo(this.StrToMeasurementsigned(element.attribute('vo').value()));
    if (removeAttr) element.remove_attribute("vo");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteVisualOffsetVo(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasVo()) {
    element.append_attribute("vo").set_value(this.MeasurementsignedToStr(this.GetVo()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasVo(): boolean {
    return (this.m_vo?.HasValue?.() === true);
  }

  SetVo(value: any): void { this.m_vo = value; }

  GetVo(): any { return this.m_vo; }

}
export class InstVisualOffsetVo extends AttVisualOffsetVo {}

export abstract class AttVisualOffset2Ho extends Att {
  protected m_startho: any;
  protected m_endho: any;
  constructor() { super(); this.ResetVisualOffset2Ho(); }

  ResetVisualOffset2Ho(): void {
    this.m_startho = new c.data_MEASUREMENTSIGNED();
    this.m_endho = new c.data_MEASUREMENTSIGNED();
  }

  ReadVisualOffset2Ho(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('startho').empty()) {
    this.SetStartho(this.StrToMeasurementsigned(element.attribute('startho').value()));
    if (removeAttr) element.remove_attribute("startho");
    hasAttribute = true;
    }
    if (!element.attribute('endho').empty()) {
    this.SetEndho(this.StrToMeasurementsigned(element.attribute('endho').value()));
    if (removeAttr) element.remove_attribute("endho");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteVisualOffset2Ho(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasStartho()) {
    element.append_attribute("startho").set_value(this.MeasurementsignedToStr(this.GetStartho()));
    wroteAttribute = true;
    }
    if (this.HasEndho()) {
    element.append_attribute("endho").set_value(this.MeasurementsignedToStr(this.GetEndho()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasStartho(): boolean {
    return (this.m_startho?.HasValue?.() === true);
  }

  HasEndho(): boolean {
    return (this.m_endho?.HasValue?.() === true);
  }

  SetStartho(value: any): void { this.m_startho = value; }
  SetEndho(value: any): void { this.m_endho = value; }

  GetStartho(): any { return this.m_startho; }
  GetEndho(): any { return this.m_endho; }

}
export class InstVisualOffset2Ho extends AttVisualOffset2Ho {}

export abstract class AttVisualOffset2To extends Att {
  protected m_startto: any;
  protected m_endto: any;
  constructor() { super(); this.ResetVisualOffset2To(); }

  ResetVisualOffset2To(): void {
    this.m_startto = 0.0;
    this.m_endto = 0.0;
  }

  ReadVisualOffset2To(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('startto').empty()) {
    this.SetStartto(this.StrToDbl(element.attribute('startto').value()));
    if (removeAttr) element.remove_attribute("startto");
    hasAttribute = true;
    }
    if (!element.attribute('endto').empty()) {
    this.SetEndto(this.StrToDbl(element.attribute('endto').value()));
    if (removeAttr) element.remove_attribute("endto");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteVisualOffset2To(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasStartto()) {
    element.append_attribute("startto").set_value(this.DblToStr(this.GetStartto()));
    wroteAttribute = true;
    }
    if (this.HasEndto()) {
    element.append_attribute("endto").set_value(this.DblToStr(this.GetEndto()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasStartto(): boolean {
    return (this.m_startto != 0.0);
  }

  HasEndto(): boolean {
    return (this.m_endto != 0.0);
  }

  SetStartto(value: any): void { this.m_startto = value; }
  SetEndto(value: any): void { this.m_endto = value; }

  GetStartto(): any { return this.m_startto; }
  GetEndto(): any { return this.m_endto; }

}
export class InstVisualOffset2To extends AttVisualOffset2To {}

export abstract class AttVisualOffset2Vo extends Att {
  protected m_startvo: any;
  protected m_endvo: any;
  constructor() { super(); this.ResetVisualOffset2Vo(); }

  ResetVisualOffset2Vo(): void {
    this.m_startvo = new c.data_MEASUREMENTSIGNED();
    this.m_endvo = new c.data_MEASUREMENTSIGNED();
  }

  ReadVisualOffset2Vo(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('startvo').empty()) {
    this.SetStartvo(this.StrToMeasurementsigned(element.attribute('startvo').value()));
    if (removeAttr) element.remove_attribute("startvo");
    hasAttribute = true;
    }
    if (!element.attribute('endvo').empty()) {
    this.SetEndvo(this.StrToMeasurementsigned(element.attribute('endvo').value()));
    if (removeAttr) element.remove_attribute("endvo");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteVisualOffset2Vo(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasStartvo()) {
    element.append_attribute("startvo").set_value(this.MeasurementsignedToStr(this.GetStartvo()));
    wroteAttribute = true;
    }
    if (this.HasEndvo()) {
    element.append_attribute("endvo").set_value(this.MeasurementsignedToStr(this.GetEndvo()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasStartvo(): boolean {
    return (this.m_startvo?.HasValue?.() === true);
  }

  HasEndvo(): boolean {
    return (this.m_endvo?.HasValue?.() === true);
  }

  SetStartvo(value: any): void { this.m_startvo = value; }
  SetEndvo(value: any): void { this.m_endvo = value; }

  GetStartvo(): any { return this.m_startvo; }
  GetEndvo(): any { return this.m_endvo; }

}
export class InstVisualOffset2Vo extends AttVisualOffset2Vo {}

export abstract class AttVoltaGroupingSym extends Att {
  protected m_voltasym: any;
  constructor() { super(); this.ResetVoltaGroupingSym(); }

  ResetVoltaGroupingSym(): void {
    this.m_voltasym = voltaGroupingSym_VOLTASYM_NONE;
  }

  ReadVoltaGroupingSym(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('voltasym').empty()) {
    this.SetVoltasym(this.StrToVoltaGroupingSymVoltasym(element.attribute('voltasym').value()));
    if (removeAttr) element.remove_attribute("voltasym");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteVoltaGroupingSym(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasVoltasym()) {
    element.append_attribute("voltasym").set_value(this.VoltaGroupingSymVoltasymToStr(this.GetVoltasym()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasVoltasym(): boolean {
    return (this.m_voltasym != voltaGroupingSym_VOLTASYM_NONE);
  }

  SetVoltasym(value: any): void { this.m_voltasym = value; }

  GetVoltasym(): any { return this.m_voltasym; }

}
export class InstVoltaGroupingSym extends AttVoltaGroupingSym {}

export abstract class AttWhitespace extends Att {
  protected m_space: any;
  constructor() { super(); this.ResetWhitespace(); }

  ResetWhitespace(): void {
    this.m_space = "";
  }

  ReadWhitespace(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('xml:space').empty()) {
    this.SetSpace(this.StrToStr(element.attribute('xml:space').value()));
    if (removeAttr) element.remove_attribute("xml:space");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteWhitespace(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSpace()) {
    element.append_attribute("xml:space").set_value(this.StrToStr(this.GetSpace()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasSpace(): boolean {
    return (this.m_space != "");
  }

  SetSpace(value: any): void { this.m_space = value; }

  GetSpace(): any { return this.m_space; }

}
export class InstWhitespace extends AttWhitespace {}

export abstract class AttWidth extends Att {
  protected m_width: any;
  constructor() { super(); this.ResetWidth(); }

  ResetWidth(): void {
    this.m_width = new data_MEASUREMENTUNSIGNED();
  }

  ReadWidth(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('width').empty()) {
    this.SetWidth(this.StrToMeasurementunsigned(element.attribute('width').value()));
    if (removeAttr) element.remove_attribute("width");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteWidth(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasWidth()) {
    element.append_attribute("width").set_value(this.MeasurementunsignedToStr(this.GetWidth()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasWidth(): boolean {
    return (this.m_width?.HasValue?.() === true);
  }

  SetWidth(value: any): void { this.m_width = value; }

  GetWidth(): any { return this.m_width; }

}
export class InstWidth extends AttWidth {}

export abstract class AttXy extends Att {
  protected m_x: any;
  protected m_y: any;
  constructor() { super(); this.ResetXy(); }

  ResetXy(): void {
    this.m_x = 0.0;
    this.m_y = 0.0;
  }

  ReadXy(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('x').empty()) {
    this.SetX(this.StrToDbl(element.attribute('x').value()));
    if (removeAttr) element.remove_attribute("x");
    hasAttribute = true;
    }
    if (!element.attribute('y').empty()) {
    this.SetY(this.StrToDbl(element.attribute('y').value()));
    if (removeAttr) element.remove_attribute("y");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteXy(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasX()) {
    element.append_attribute("x").set_value(this.DblToStr(this.GetX()));
    wroteAttribute = true;
    }
    if (this.HasY()) {
    element.append_attribute("y").set_value(this.DblToStr(this.GetY()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasX(): boolean {
    return (this.m_x != 0.0);
  }

  HasY(): boolean {
    return (this.m_y != 0.0);
  }

  SetX(value: any): void { this.m_x = value; }
  SetY(value: any): void { this.m_y = value; }

  GetX(): any { return this.m_x; }
  GetY(): any { return this.m_y; }

}
export class InstXy extends AttXy {}

export abstract class AttXy2 extends Att {
  protected m_x2: any;
  protected m_y2: any;
  constructor() { super(); this.ResetXy2(); }

  ResetXy2(): void {
    this.m_x2 = 0.0;
    this.m_y2 = 0.0;
  }

  ReadXy2(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('x2').empty()) {
    this.SetX2(this.StrToDbl(element.attribute('x2').value()));
    if (removeAttr) element.remove_attribute("x2");
    hasAttribute = true;
    }
    if (!element.attribute('y2').empty()) {
    this.SetY2(this.StrToDbl(element.attribute('y2').value()));
    if (removeAttr) element.remove_attribute("y2");
    hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteXy2(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasX2()) {
    element.append_attribute("x2").set_value(this.DblToStr(this.GetX2()));
    wroteAttribute = true;
    }
    if (this.HasY2()) {
    element.append_attribute("y2").set_value(this.DblToStr(this.GetY2()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }

  HasX2(): boolean {
    return (this.m_x2 != 0.0);
  }

  HasY2(): boolean {
    return (this.m_y2 != 0.0);
  }

  SetX2(value: any): void { this.m_x2 = value; }
  SetY2(value: any): void { this.m_y2 = value; }

  GetX2(): any { return this.m_x2; }
  GetY2(): any { return this.m_y2; }

}
export class InstXy2 extends AttXy2 {}
