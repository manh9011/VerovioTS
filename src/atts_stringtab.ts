/**
 * Pure TypeScript translation of libmei/dist/atts_stringtab.cpp.
 * Preserves generated libMEI constructor/reset, XML read/write ordering,
 * append-only attribute semantics, converter dispatch and presence checks.
 */
import { Att } from './att';
import { xml_node } from './pugixml';
const MEI_UNSET = -2147483647;

export const VERTICALALIGNMENT_NONE = 0;
export const VERTICALALIGNMENT_top = 1;
export const VERTICALALIGNMENT_middle = 2;
export const VERTICALALIGNMENT_bottom = 3;
export const VERTICALALIGNMENT_baseline = 4;
export type data_VERTICALALIGNMENT = number;

export abstract class AttStaffDefVisTablature extends Att {
  protected m_tabAlign: data_VERTICALALIGNMENT = VERTICALALIGNMENT_NONE;
  protected m_tabAnchorline = 0;

  constructor() { super(); this.ResetStaffDefVisTablature(); }

  ResetStaffDefVisTablature(): void {
    this.m_tabAlign = VERTICALALIGNMENT_NONE;
    this.m_tabAnchorline = 0;
  }

  ReadStaffDefVisTablature(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    let attr = element.attribute('tab.align');
    if (!attr.empty()) {
      this.SetTabAlign(this.StrToVerticalalignment(attr.value()));
      if (removeAttr) element.remove_attribute('tab.align');
      hasAttribute = true;
    }
    attr = element.attribute('tab.anchorline');
    if (!attr.empty()) {
      this.SetTabAnchorline(this.StrToInt(attr.value()));
      if (removeAttr) element.remove_attribute('tab.anchorline');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteStaffDefVisTablature(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTabAlign()) {
      element.append_attribute('tab.align').set_value(this.VerticalalignmentToStr(this.GetTabAlign()));
      wroteAttribute = true;
    }
    if (this.HasTabAnchorline()) {
      element.append_attribute('tab.anchorline').set_value(this.IntToStr(this.GetTabAnchorline()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetTabAlign(v: data_VERTICALALIGNMENT): void { this.m_tabAlign = v; }
  GetTabAlign(): data_VERTICALALIGNMENT { return this.m_tabAlign; }
  HasTabAlign(): boolean { return this.m_tabAlign !== VERTICALALIGNMENT_NONE; }
  SetTabAnchorline(v: number): void { this.m_tabAnchorline = v; }
  GetTabAnchorline(): number { return this.m_tabAnchorline; }
  HasTabAnchorline(): boolean { return this.m_tabAnchorline !== 0; }
}

export class InstStaffDefVisTablature extends AttStaffDefVisTablature {}

export abstract class AttStringtab extends Att {
  protected m_tabFing = '';
  protected m_tabFret = MEI_UNSET;
  protected m_tabLine = 0;
  protected m_tabString = '';
  protected m_tabCourse = MEI_UNSET;

  constructor() { super(); this.ResetStringtab(); }

  ResetStringtab(): void {
    this.m_tabFing = '';
    this.m_tabFret = MEI_UNSET;
    this.m_tabLine = 0;
    this.m_tabString = '';
    this.m_tabCourse = MEI_UNSET;
  }

  ReadStringtab(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    let attr = element.attribute('tab.fing');
    if (!attr.empty()) { this.SetTabFing(this.StrToStr(attr.value())); if (removeAttr) element.remove_attribute('tab.fing'); hasAttribute = true; }
    attr = element.attribute('tab.fret');
    if (!attr.empty()) { this.SetTabFret(this.StrToInt(attr.value())); if (removeAttr) element.remove_attribute('tab.fret'); hasAttribute = true; }
    attr = element.attribute('tab.line');
    if (!attr.empty()) { this.SetTabLine(this.StrToInt(attr.value())); if (removeAttr) element.remove_attribute('tab.line'); hasAttribute = true; }
    attr = element.attribute('tab.string');
    if (!attr.empty()) { this.SetTabString(this.StrToStr(attr.value())); if (removeAttr) element.remove_attribute('tab.string'); hasAttribute = true; }
    attr = element.attribute('tab.course');
    if (!attr.empty()) { this.SetTabCourse(this.StrToInt(attr.value())); if (removeAttr) element.remove_attribute('tab.course'); hasAttribute = true; }
    return hasAttribute;
  }

  WriteStringtab(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTabFing()) { element.append_attribute('tab.fing').set_value(this.StrToStr(this.GetTabFing())); wroteAttribute = true; }
    if (this.HasTabFret()) { element.append_attribute('tab.fret').set_value(this.IntToStr(this.GetTabFret())); wroteAttribute = true; }
    if (this.HasTabLine()) { element.append_attribute('tab.line').set_value(this.IntToStr(this.GetTabLine())); wroteAttribute = true; }
    if (this.HasTabString()) { element.append_attribute('tab.string').set_value(this.StrToStr(this.GetTabString())); wroteAttribute = true; }
    if (this.HasTabCourse()) { element.append_attribute('tab.course').set_value(this.IntToStr(this.GetTabCourse())); wroteAttribute = true; }
    return wroteAttribute;
  }

  SetTabFing(v: string): void { this.m_tabFing = v; }
  GetTabFing(): string { return this.m_tabFing; }
  HasTabFing(): boolean { return this.m_tabFing !== ''; }
  SetTabFret(v: number): void { this.m_tabFret = v; }
  GetTabFret(): number { return this.m_tabFret; }
  HasTabFret(): boolean { return this.m_tabFret !== MEI_UNSET; }
  SetTabLine(v: number): void { this.m_tabLine = v; }
  GetTabLine(): number { return this.m_tabLine; }
  HasTabLine(): boolean { return this.m_tabLine !== 0; }
  SetTabString(v: string): void { this.m_tabString = v; }
  GetTabString(): string { return this.m_tabString; }
  HasTabString(): boolean { return this.m_tabString !== ''; }
  SetTabCourse(v: number): void { this.m_tabCourse = v; }
  GetTabCourse(): number { return this.m_tabCourse; }
  HasTabCourse(): boolean { return this.m_tabCourse !== MEI_UNSET; }
}

export class InstStringtab extends AttStringtab {}

export abstract class AttStringtabPosition extends Att {
  protected m_tabPos = MEI_UNSET;
  constructor() { super(); this.ResetStringtabPosition(); }
  ResetStringtabPosition(): void { this.m_tabPos = MEI_UNSET; }
  ReadStringtabPosition(element: xml_node, removeAttr = true): boolean {
    const attr = element.attribute('tab.pos');
    if (attr.empty()) return false;
    this.SetTabPos(this.StrToInt(attr.value()));
    if (removeAttr) element.remove_attribute('tab.pos');
    return true;
  }
  WriteStringtabPosition(element: xml_node): boolean {
    if (!this.HasTabPos()) return false;
    element.append_attribute('tab.pos').set_value(this.IntToStr(this.GetTabPos()));
    return true;
  }
  SetTabPos(v: number): void { this.m_tabPos = v; }
  GetTabPos(): number { return this.m_tabPos; }
  HasTabPos(): boolean { return this.m_tabPos !== MEI_UNSET; }
}
export class InstStringtabPosition extends AttStringtabPosition {}

export abstract class AttStringtabTuning extends Att {
  protected m_tabStrings = '';
  protected m_tabCourses = '';
  constructor() { super(); this.ResetStringtabTuning(); }
  ResetStringtabTuning(): void { this.m_tabStrings = ''; this.m_tabCourses = ''; }
  ReadStringtabTuning(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    let attr = element.attribute('tab.strings');
    if (!attr.empty()) { this.SetTabStrings(this.StrToStr(attr.value())); if (removeAttr) element.remove_attribute('tab.strings'); hasAttribute = true; }
    attr = element.attribute('tab.courses');
    if (!attr.empty()) { this.SetTabCourses(this.StrToStr(attr.value())); if (removeAttr) element.remove_attribute('tab.courses'); hasAttribute = true; }
    return hasAttribute;
  }
  WriteStringtabTuning(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTabStrings()) { element.append_attribute('tab.strings').set_value(this.StrToStr(this.GetTabStrings())); wroteAttribute = true; }
    if (this.HasTabCourses()) { element.append_attribute('tab.courses').set_value(this.StrToStr(this.GetTabCourses())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetTabStrings(v: string): void { this.m_tabStrings = v; }
  GetTabStrings(): string { return this.m_tabStrings; }
  HasTabStrings(): boolean { return this.m_tabStrings !== ''; }
  SetTabCourses(v: string): void { this.m_tabCourses = v; }
  GetTabCourses(): string { return this.m_tabCourses; }
  HasTabCourses(): boolean { return this.m_tabCourses !== ''; }
}
export class InstStringtabTuning extends AttStringtabTuning {}
