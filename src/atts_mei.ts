/**
 * Pure TypeScript translation of libmei/dist/atts_mei.cpp.
 * Preserves generated libMEI constructor/reset, XML read/write order,
 * converter dispatch, defaults/sentinels and presence semantics.
 */

import { Att } from './att';
import { xml_node } from './pugixml';

export type data_NOTATIONTYPE = number;
const NOTATIONTYPE_NONE: data_NOTATIONTYPE = 0;

export abstract class AttNotationType extends Att {
  protected m_notationtype: data_NOTATIONTYPE = NOTATIONTYPE_NONE;
  protected m_notationsubtype = '';

  constructor() {
    super();
    this.ResetNotationType();
  }

  ResetNotationType(): void {
    this.m_notationtype = NOTATIONTYPE_NONE;
    this.m_notationsubtype = '';
  }

  ReadNotationType(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;

    const notationtype = element.attribute('notationtype');
    if (!notationtype.empty()) {
      this.SetNotationtype(this.StrToNotationtype(notationtype.value()));
      if (removeAttr) element.remove_attribute('notationtype');
      hasAttribute = true;
    }

    const notationsubtype = element.attribute('notationsubtype');
    if (!notationsubtype.empty()) {
      this.SetNotationsubtype(this.StrToStr(notationsubtype.value()));
      if (removeAttr) element.remove_attribute('notationsubtype');
      hasAttribute = true;
    }

    return hasAttribute;
  }

  WriteNotationType(element: xml_node): boolean {
    let wroteAttribute = false;

    if (this.HasNotationtype()) {
      element.append_attribute('notationtype')
        .set_value(this.NotationtypeToStr(this.GetNotationtype()));
      wroteAttribute = true;
    }

    if (this.HasNotationsubtype()) {
      element.append_attribute('notationsubtype')
        .set_value(this.StrToStr(this.GetNotationsubtype()));
      wroteAttribute = true;
    }

    return wroteAttribute;
  }

  SetNotationtype(value: data_NOTATIONTYPE): void { this.m_notationtype = value; }
  GetNotationtype(): data_NOTATIONTYPE { return this.m_notationtype; }
  HasNotationtype(): boolean { return this.m_notationtype !== NOTATIONTYPE_NONE; }

  SetNotationsubtype(value: string): void { this.m_notationsubtype = value; }
  GetNotationsubtype(): string { return this.m_notationsubtype; }
  HasNotationsubtype(): boolean { return this.m_notationsubtype !== ''; }
}

export class InstNotationType extends AttNotationType {}
