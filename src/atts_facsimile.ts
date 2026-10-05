/**
 * Pure TypeScript translation of libmei/dist/atts_facsimile.cpp.
 * Preserves generated libmei XML read/write ordering, defaults, presence
 * semantics, converter dispatch and the instantiable wrapper.
 */

import { Att } from './att';
import { xml_node } from './pugixml';

export abstract class AttFacsimile extends Att {
  protected m_facs = '';

  constructor() {
    super();
    this.ResetFacsimile();
  }

  ResetFacsimile(): void { this.m_facs = ''; }

  ReadFacsimile(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const facs = element.attribute('facs');
    if (!facs.empty()) {
      this.SetFacs(this.StrToStr(facs.value()));
      if (removeAttr) element.remove_attribute('facs');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteFacsimile(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasFacs()) {
      element.append_attribute('facs').set_value(this.StrToStr(this.GetFacs()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetFacs(facs: string): void { this.m_facs = facs; }
  GetFacs(): string { return this.m_facs; }
  HasFacs(): boolean { return this.m_facs !== ''; }
}

export class InstFacsimile extends AttFacsimile {}
