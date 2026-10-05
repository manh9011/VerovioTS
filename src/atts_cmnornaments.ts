/** Pure TypeScript translation of libmei/dist/atts_cmnornaments.cpp. */
import { Att } from './att';
import { xml_node } from './pugixml';
import { data_ACCIDENTAL_WRITTEN } from './libmei-att';
type data_BOOLEAN = number;

export const mordentLog_FORM_NONE = 0;
export const mordentLog_FORM_lower = 1;
export const mordentLog_FORM_upper = 2;
export const mordentLog_FORM_MAX = 3;
export type mordentLog_FORM = number;

export const turnLog_FORM_NONE = 0;
export const turnLog_FORM_lower = 1;
export const turnLog_FORM_upper = 2;
export const turnLog_FORM_MAX = 3;
export type turnLog_FORM = number;

const BOOLEAN_NONE = 0;
const ACCIDENTAL_WRITTEN_NONE = 0;

function attrExists(element: xml_node, name: string): boolean { return !element.attribute(name).empty(); }
function attrValue(element: xml_node, name: string): string { return element.attribute(name).value(); }
function writeAttr(element: xml_node, name: string, value: string): void { element.append_attribute(name).set_value(value); }

export abstract class AttMordentLog extends Att {
  protected m_form: mordentLog_FORM = mordentLog_FORM_NONE;
  protected m_long: data_BOOLEAN = BOOLEAN_NONE;

  constructor() { super(); this.ResetMordentLog(); }
  ResetMordentLog(): void { this.m_form = mordentLog_FORM_NONE; this.m_long = BOOLEAN_NONE; }
  ReadMordentLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'form')) { this.SetForm(this.StrToMordentLogForm(attrValue(element, 'form'))); if (removeAttr) element.remove_attribute('form'); hasAttribute = true; }
    if (attrExists(element, 'long')) { this.SetLong(this.StrToBoolean(attrValue(element, 'long'))); if (removeAttr) element.remove_attribute('long'); hasAttribute = true; }
    return hasAttribute;
  }
  WriteMordentLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) { writeAttr(element, 'form', this.MordentLogFormToStr(this.GetForm())); wroteAttribute = true; }
    if (this.HasLong()) { writeAttr(element, 'long', this.BooleanToStr(this.GetLong())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetForm(value: mordentLog_FORM): void { this.m_form = value; }
  GetForm(): mordentLog_FORM { return this.m_form; }
  HasForm(): boolean { return this.m_form !== mordentLog_FORM_NONE; }
  SetLong(value: data_BOOLEAN): void { this.m_long = value; }
  GetLong(): data_BOOLEAN { return this.m_long; }
  HasLong(): boolean { return this.m_long !== BOOLEAN_NONE; }
}
export class InstMordentLog extends AttMordentLog {}

export abstract class AttOrnamPresent extends Att {
  protected m_ornam = '';
  constructor() { super(); this.ResetOrnamPresent(); }
  ResetOrnamPresent(): void { this.m_ornam = ''; }
  ReadOrnamPresent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'ornam')) { this.SetOrnam(this.StrToStr(attrValue(element, 'ornam'))); if (removeAttr) element.remove_attribute('ornam'); hasAttribute = true; }
    return hasAttribute;
  }
  WriteOrnamPresent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOrnam()) { writeAttr(element, 'ornam', this.StrToStr(this.GetOrnam())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetOrnam(value: string): void { this.m_ornam = value; }
  GetOrnam(): string { return this.m_ornam; }
  HasOrnam(): boolean { return this.m_ornam !== ''; }
}
export class InstOrnamPresent extends AttOrnamPresent {}

export abstract class AttOrnamentAccid extends Att {
  protected m_accidupper: data_ACCIDENTAL_WRITTEN = ACCIDENTAL_WRITTEN_NONE;
  protected m_accidlower: data_ACCIDENTAL_WRITTEN = ACCIDENTAL_WRITTEN_NONE;
  constructor() { super(); this.ResetOrnamentAccid(); }
  ResetOrnamentAccid(): void { this.m_accidupper = ACCIDENTAL_WRITTEN_NONE; this.m_accidlower = ACCIDENTAL_WRITTEN_NONE; }
  ReadOrnamentAccid(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'accidupper')) { this.SetAccidupper(this.StrToAccidentalWritten(attrValue(element, 'accidupper'))); if (removeAttr) element.remove_attribute('accidupper'); hasAttribute = true; }
    if (attrExists(element, 'accidlower')) { this.SetAccidlower(this.StrToAccidentalWritten(attrValue(element, 'accidlower'))); if (removeAttr) element.remove_attribute('accidlower'); hasAttribute = true; }
    return hasAttribute;
  }
  WriteOrnamentAccid(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAccidupper()) { writeAttr(element, 'accidupper', this.AccidentalWrittenToStr(this.GetAccidupper())); wroteAttribute = true; }
    if (this.HasAccidlower()) { writeAttr(element, 'accidlower', this.AccidentalWrittenToStr(this.GetAccidlower())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetAccidupper(value: data_ACCIDENTAL_WRITTEN): void { this.m_accidupper = value; }
  GetAccidupper(): data_ACCIDENTAL_WRITTEN { return this.m_accidupper; }
  HasAccidupper(): boolean { return this.m_accidupper !== ACCIDENTAL_WRITTEN_NONE; }
  SetAccidlower(value: data_ACCIDENTAL_WRITTEN): void { this.m_accidlower = value; }
  GetAccidlower(): data_ACCIDENTAL_WRITTEN { return this.m_accidlower; }
  HasAccidlower(): boolean { return this.m_accidlower !== ACCIDENTAL_WRITTEN_NONE; }
}
export class InstOrnamentAccid extends AttOrnamentAccid {}

export abstract class AttTurnLog extends Att {
  protected m_delayed: data_BOOLEAN = BOOLEAN_NONE;
  protected m_form: turnLog_FORM = turnLog_FORM_NONE;
  constructor() { super(); this.ResetTurnLog(); }
  ResetTurnLog(): void { this.m_delayed = BOOLEAN_NONE; this.m_form = turnLog_FORM_NONE; }
  ReadTurnLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'delayed')) { this.SetDelayed(this.StrToBoolean(attrValue(element, 'delayed'))); if (removeAttr) element.remove_attribute('delayed'); hasAttribute = true; }
    if (attrExists(element, 'form')) { this.SetForm(this.StrToTurnLogForm(attrValue(element, 'form'))); if (removeAttr) element.remove_attribute('form'); hasAttribute = true; }
    return hasAttribute;
  }
  WriteTurnLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDelayed()) { writeAttr(element, 'delayed', this.BooleanToStr(this.GetDelayed())); wroteAttribute = true; }
    if (this.HasForm()) { writeAttr(element, 'form', this.TurnLogFormToStr(this.GetForm())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetDelayed(value: data_BOOLEAN): void { this.m_delayed = value; }
  GetDelayed(): data_BOOLEAN { return this.m_delayed; }
  HasDelayed(): boolean { return this.m_delayed !== BOOLEAN_NONE; }
  SetForm(value: turnLog_FORM): void { this.m_form = value; }
  GetForm(): turnLog_FORM { return this.m_form; }
  HasForm(): boolean { return this.m_form !== turnLog_FORM_NONE; }
}
export class InstTurnLog extends AttTurnLog {}
