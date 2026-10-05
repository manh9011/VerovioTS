/** Pure TypeScript translation of libmei/dist/atts_neumes.cpp. */
import { Att } from './att';
import { xml_node } from './pugixml';

export type divLineLog_FORM = number;
export const divLineLog_FORM_NONE = 0;
export const divLineLog_FORM_caesura = 1;
export const divLineLog_FORM_finalis = 2;
export const divLineLog_FORM_maior = 3;
export const divLineLog_FORM_maxima = 4;
export const divLineLog_FORM_minima = 5;
export const divLineLog_FORM_virgula = 6;

export type ncForm_CON = number;
export const ncForm_CON_NONE = 0;
export const ncForm_CON_g = 1;
export const ncForm_CON_l = 2;
export const ncForm_CON_e = 3;

export type ncForm_RELLEN = number;
export const ncForm_RELLEN_NONE = 0;
export const ncForm_RELLEN_l = 1;
export const ncForm_RELLEN_s = 2;

const BOOLEAN_NONE = 0;
const COMPASSDIRECTION_NONE = 0;
const attrExists = (element: xml_node, name: string): boolean => !element.attribute(name).empty();
const attrValue = (element: xml_node, name: string): string => element.attribute(name).value();
const writeAttr = (element: xml_node, name: string, value: string): void => {
  element.append_attribute(name).set_value(value);
};

export abstract class AttDivLineLog extends Att {
  protected m_form: divLineLog_FORM = divLineLog_FORM_NONE;
  constructor() { super(); this.ResetDivLineLog(); }
  ResetDivLineLog(): void { this.m_form = divLineLog_FORM_NONE; }
  ReadDivLineLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'form')) { this.SetForm(this.StrToDivLineLogForm(attrValue(element, 'form'))); if (removeAttr) element.remove_attribute('form'); hasAttribute = true; }
    return hasAttribute;
  }
  WriteDivLineLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) { writeAttr(element, 'form', this.DivLineLogFormToStr(this.GetForm())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetForm(value: divLineLog_FORM): void { this.m_form = value; }
  GetForm(): divLineLog_FORM { return this.m_form; }
  HasForm(): boolean { return this.m_form !== divLineLog_FORM_NONE; }
}
export class InstDivLineLog extends AttDivLineLog {}

export abstract class AttNcLog extends Att {
  protected m_oct = '';
  protected m_pname = '';
  constructor() { super(); this.ResetNcLog(); }
  ResetNcLog(): void { this.m_oct = ''; this.m_pname = ''; }
  ReadNcLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'oct')) { this.SetOct(this.StrToStr(attrValue(element, 'oct'))); if (removeAttr) element.remove_attribute('oct'); hasAttribute = true; }
    if (attrExists(element, 'pname')) { this.SetPname(this.StrToStr(attrValue(element, 'pname'))); if (removeAttr) element.remove_attribute('pname'); hasAttribute = true; }
    return hasAttribute;
  }
  WriteNcLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOct()) { writeAttr(element, 'oct', this.StrToStr(this.GetOct())); wroteAttribute = true; }
    if (this.HasPname()) { writeAttr(element, 'pname', this.StrToStr(this.GetPname())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetOct(value: string): void { this.m_oct = value; }
  GetOct(): string { return this.m_oct; }
  HasOct(): boolean { return this.m_oct !== ''; }
  SetPname(value: string): void { this.m_pname = value; }
  GetPname(): string { return this.m_pname; }
  HasPname(): boolean { return this.m_pname !== ''; }
}
export class InstNcLog extends AttNcLog {}

export abstract class AttNcForm extends Att {
  protected m_angled = BOOLEAN_NONE;
  protected m_con: ncForm_CON = ncForm_CON_NONE;
  protected m_hooked = BOOLEAN_NONE;
  protected m_ligated = BOOLEAN_NONE;
  protected m_rellen: ncForm_RELLEN = ncForm_RELLEN_NONE;
  protected m_sShape = '';
  protected m_tilt = COMPASSDIRECTION_NONE;
  constructor() { super(); this.ResetNcForm(); }
  ResetNcForm(): void {
    this.m_angled = BOOLEAN_NONE; this.m_con = ncForm_CON_NONE; this.m_hooked = BOOLEAN_NONE;
    this.m_ligated = BOOLEAN_NONE; this.m_rellen = ncForm_RELLEN_NONE; this.m_sShape = ''; this.m_tilt = COMPASSDIRECTION_NONE;
  }
  ReadNcForm(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'angled')) { this.SetAngled(this.StrToBoolean(attrValue(element, 'angled'))); if (removeAttr) element.remove_attribute('angled'); hasAttribute = true; }
    if (attrExists(element, 'con')) { this.SetCon(this.StrToNcFormCon(attrValue(element, 'con'))); if (removeAttr) element.remove_attribute('con'); hasAttribute = true; }
    if (attrExists(element, 'hooked')) { this.SetHooked(this.StrToBoolean(attrValue(element, 'hooked'))); if (removeAttr) element.remove_attribute('hooked'); hasAttribute = true; }
    if (attrExists(element, 'ligated')) { this.SetLigated(this.StrToBoolean(attrValue(element, 'ligated'))); if (removeAttr) element.remove_attribute('ligated'); hasAttribute = true; }
    if (attrExists(element, 'rellen')) { this.SetRellen(this.StrToNcFormRellen(attrValue(element, 'rellen'))); if (removeAttr) element.remove_attribute('rellen'); hasAttribute = true; }
    if (attrExists(element, 'sShape')) { this.SetSShape(this.StrToStr(attrValue(element, 'sShape'))); if (removeAttr) element.remove_attribute('sShape'); hasAttribute = true; }
    if (attrExists(element, 'tilt')) { this.SetTilt(this.StrToCompassdirection(attrValue(element, 'tilt'))); if (removeAttr) element.remove_attribute('tilt'); hasAttribute = true; }
    return hasAttribute;
  }
  WriteNcForm(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAngled()) { writeAttr(element, 'angled', this.BooleanToStr(this.GetAngled())); wroteAttribute = true; }
    if (this.HasCon()) { writeAttr(element, 'con', this.NcFormConToStr(this.GetCon())); wroteAttribute = true; }
    if (this.HasHooked()) { writeAttr(element, 'hooked', this.BooleanToStr(this.GetHooked())); wroteAttribute = true; }
    if (this.HasLigated()) { writeAttr(element, 'ligated', this.BooleanToStr(this.GetLigated())); wroteAttribute = true; }
    if (this.HasRellen()) { writeAttr(element, 'rellen', this.NcFormRellenToStr(this.GetRellen())); wroteAttribute = true; }
    if (this.HasSShape()) { writeAttr(element, 'sShape', this.StrToStr(this.GetSShape())); wroteAttribute = true; }
    if (this.HasTilt()) { writeAttr(element, 'tilt', this.CompassdirectionToStr(this.GetTilt())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetAngled(value: number): void { this.m_angled = value; }
  GetAngled(): number { return this.m_angled; }
  HasAngled(): boolean { return this.m_angled !== BOOLEAN_NONE; }
  SetCon(value: ncForm_CON): void { this.m_con = value; }
  GetCon(): ncForm_CON { return this.m_con; }
  HasCon(): boolean { return this.m_con !== ncForm_CON_NONE; }
  SetHooked(value: number): void { this.m_hooked = value; }
  GetHooked(): number { return this.m_hooked; }
  HasHooked(): boolean { return this.m_hooked !== BOOLEAN_NONE; }
  SetLigated(value: number): void { this.m_ligated = value; }
  GetLigated(): number { return this.m_ligated; }
  HasLigated(): boolean { return this.m_ligated !== BOOLEAN_NONE; }
  SetRellen(value: ncForm_RELLEN): void { this.m_rellen = value; }
  GetRellen(): ncForm_RELLEN { return this.m_rellen; }
  HasRellen(): boolean { return this.m_rellen !== ncForm_RELLEN_NONE; }
  SetSShape(value: string): void { this.m_sShape = value; }
  GetSShape(): string { return this.m_sShape; }
  HasSShape(): boolean { return this.m_sShape !== ''; }
  SetTilt(value: number): void { this.m_tilt = value; }
  GetTilt(): number { return this.m_tilt; }
  HasTilt(): boolean { return this.m_tilt !== COMPASSDIRECTION_NONE; }
}
export class InstNcForm extends AttNcForm {}

export abstract class AttNeumeType extends Att {
  protected m_type = '';
  constructor() { super(); this.ResetNeumeType(); }
  ResetNeumeType(): void { this.m_type = ''; }
  ReadNeumeType(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'type')) { this.SetType(this.StrToStr(attrValue(element, 'type'))); if (removeAttr) element.remove_attribute('type'); hasAttribute = true; }
    return hasAttribute;
  }
  WriteNeumeType(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasType()) { writeAttr(element, 'type', this.StrToStr(this.GetType())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetType(value: string): void { this.m_type = value; }
  GetType(): string { return this.m_type; }
  HasType(): boolean { return this.m_type !== ''; }
}
export class InstNeumeType extends AttNeumeType {}
