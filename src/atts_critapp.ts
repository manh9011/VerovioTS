/** Pure TypeScript translation of libmei/dist/atts_critapp.cpp. */
import { Att } from './att';
import { xml_node } from './pugixml';

function attrExists(element: xml_node, name: string): boolean {
  return !element.attribute(name).empty();
}

function attrValue(element: xml_node, name: string): string {
  return element.attribute(name).value();
}

function writeAttr(element: xml_node, name: string, value: string): void {
  element.append_attribute(name).set_value(value);
}

/** Attribute class for the MEI critical-apparatus cause value. */
export abstract class AttCrit extends Att {
  protected m_cause = '';

  constructor() {
    super();
    this.ResetCrit();
  }

  ResetCrit(): void {
    this.m_cause = '';
  }

  ReadCrit(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (attrExists(element, 'cause')) {
      this.SetCause(this.StrToStr(attrValue(element, 'cause')));
      if (removeAttr) element.remove_attribute('cause');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteCrit(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCause()) {
      writeAttr(element, 'cause', this.StrToStr(this.GetCause()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetCause(cause: string): void {
    this.m_cause = cause;
  }

  GetCause(): string {
    return this.m_cause;
  }

  HasCause(): boolean {
    return this.m_cause !== '';
  }
}

/** Instantiable version of AttCrit, matching generated libmei. */
export class InstCrit extends AttCrit {}
