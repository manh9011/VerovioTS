/**
 * Pure TypeScript translation of libmei/dist/atts_fingering.cpp.
 * Preserves constructor/reset, XML read/write ordering, converter dispatch,
 * presence semantics and the instantiable wrapper shape from generated libmei.
 */

import { Att } from './att';
import { xml_node } from './pugixml';

export const fingGrpLog_FORM_NONE = 0;
export const fingGrpLog_FORM_alter = 1;
export const fingGrpLog_FORM_combi = 2;
export const fingGrpLog_FORM_subst = 3;
export const fingGrpLog_FORM_MAX = 4;
export type fingGrpLog_FORM = number;

/** Generated-libmei attribute class for the fingGrpLog/form attribute. */
export abstract class AttFingGrpLog extends Att {
  protected m_form: fingGrpLog_FORM = fingGrpLog_FORM_NONE;

  constructor() {
    super();
    this.ResetFingGrpLog();
  }

  ResetFingGrpLog(): void {
    this.m_form = fingGrpLog_FORM_NONE;
  }

  ReadFingGrpLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const attr = element.attribute('form');
    if (!attr.empty()) {
      this.SetForm(this.StrToFingGrpLogForm(attr.value()));
      if (removeAttr) element.remove_attribute('form');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteFingGrpLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) {
      element.append_attribute('form').set_value(this.FingGrpLogFormToStr(this.GetForm()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetForm(form: fingGrpLog_FORM): void {
    this.m_form = form;
  }

  GetForm(): fingGrpLog_FORM {
    return this.m_form;
  }

  HasForm(): boolean {
    return this.m_form !== fingGrpLog_FORM_NONE;
  }
}

/** Instantiable generated-libmei wrapper. */
export class InstFingGrpLog extends AttFingGrpLog {}
