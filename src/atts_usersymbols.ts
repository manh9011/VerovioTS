/**
 * Pure TypeScript translation of libmei/dist/atts_usersymbols.cpp.
 * Generated libMEI attribute semantics are preserved, including XML
 * read/remove/write order, append-only writes, defaults and presence checks.
 */

import { Att } from './att';
import { xml_node } from './pugixml';

export abstract class AttAltSym extends Att {
  protected m_altsym = '';

  constructor() {
    super();
    this.ResetAltSym();
  }

  ResetAltSym(): void {
    this.m_altsym = '';
  }

  ReadAltSym(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const attribute = element.attribute('altsym');
    if (!attribute.empty()) {
      this.SetAltsym(this.StrToStr(attribute.value()));
      if (removeAttr) element.remove_attribute('altsym');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteAltSym(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAltsym()) {
      element.append_attribute('altsym').set_value(this.StrToStr(this.GetAltsym()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetAltsym(altsym: string): void { this.m_altsym = altsym; }
  GetAltsym(): string { return this.m_altsym; }
  HasAltsym(): boolean { return this.m_altsym !== ''; }
}

export class InstAltSym extends AttAltSym {}

export abstract class AttAnchoredTextLog extends Att {
  protected m_func = '';

  constructor() {
    super();
    this.ResetAnchoredTextLog();
  }

  ResetAnchoredTextLog(): void {
    this.m_func = '';
  }

  ReadAnchoredTextLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const attribute = element.attribute('func');
    if (!attribute.empty()) {
      this.SetFunc(this.StrToStr(attribute.value()));
      if (removeAttr) element.remove_attribute('func');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteAnchoredTextLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasFunc()) {
      element.append_attribute('func').set_value(this.StrToStr(this.GetFunc()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetFunc(func: string): void { this.m_func = func; }
  GetFunc(): string { return this.m_func; }
  HasFunc(): boolean { return this.m_func !== ''; }
}

export class InstAnchoredTextLog extends AttAnchoredTextLog {}

export abstract class AttCurveLog extends Att {
  protected m_func = '';

  constructor() {
    super();
    this.ResetCurveLog();
  }

  ResetCurveLog(): void {
    this.m_func = '';
  }

  ReadCurveLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const attribute = element.attribute('func');
    if (!attribute.empty()) {
      this.SetFunc(this.StrToStr(attribute.value()));
      if (removeAttr) element.remove_attribute('func');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteCurveLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasFunc()) {
      element.append_attribute('func').set_value(this.StrToStr(this.GetFunc()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetFunc(func: string): void { this.m_func = func; }
  GetFunc(): string { return this.m_func; }
  HasFunc(): boolean { return this.m_func !== ''; }
}

export class InstCurveLog extends AttCurveLog {}

export abstract class AttLineLog extends Att {
  protected m_func = '';

  constructor() {
    super();
    this.ResetLineLog();
  }

  ResetLineLog(): void {
    this.m_func = '';
  }

  ReadLineLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const attribute = element.attribute('func');
    if (!attribute.empty()) {
      this.SetFunc(this.StrToStr(attribute.value()));
      if (removeAttr) element.remove_attribute('func');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteLineLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasFunc()) {
      element.append_attribute('func').set_value(this.StrToStr(this.GetFunc()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetFunc(func: string): void { this.m_func = func; }
  GetFunc(): string { return this.m_func; }
  HasFunc(): boolean { return this.m_func !== ''; }
}

export class InstLineLog extends AttLineLog {}
