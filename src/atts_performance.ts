/**
 * Pure TypeScript translation of libmei/dist/atts_performance.cpp.
 *
 * Generated-libMEI performance attribute class. Preserves constructor/reset,
 * XML read/remove/write ordering, append-only write semantics, converter
 * dispatch, presence semantics, and the instantiable wrapper shape.
 */
import { Att } from './att';
import { xml_node } from './pugixml';

export abstract class AttAlignment extends Att {
  protected m_when = '';

  constructor() {
    super();
    this.ResetAlignment();
  }

  ResetAlignment(): void {
    this.m_when = '';
  }

  ReadAlignment(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const attr = element.attribute('when');
    if (!attr.empty()) {
      this.SetWhen(this.StrToStr(attr.value()));
      if (removeAttr) element.remove_attribute('when');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteAlignment(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasWhen()) {
      element.append_attribute('when').set_value(this.StrToStr(this.GetWhen()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetWhen(when: string): void {
    this.m_when = when;
  }

  GetWhen(): string {
    return this.m_when;
  }

  HasWhen(): boolean {
    return this.m_when !== '';
  }
}

export class InstAlignment extends AttAlignment {}
