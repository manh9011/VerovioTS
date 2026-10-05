/**
 * Pure TypeScript translation of libmei/dist/atts_figtable.cpp.
 * Preserves generated libmei defaults, XML read/remove/write ordering,
 * append-attribute semantics and presence checks.
 */

import { Att } from './att';
import { MEI_UNSET } from './vrv';
import { xml_node } from './pugixml';

export abstract class AttTabular extends Att {
  protected m_colspan = MEI_UNSET;
  protected m_rowspan = MEI_UNSET;

  constructor() {
    super();
    this.ResetTabular();
  }

  ResetTabular(): void {
    this.m_colspan = MEI_UNSET;
    this.m_rowspan = MEI_UNSET;
  }

  ReadTabular(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;

    const colspan = element.attribute('colspan');
    if (!colspan.empty()) {
      this.SetColspan(this.StrToInt(colspan.value()));
      if (removeAttr) element.remove_attribute('colspan');
      hasAttribute = true;
    }

    const rowspan = element.attribute('rowspan');
    if (!rowspan.empty()) {
      this.SetRowspan(this.StrToInt(rowspan.value()));
      if (removeAttr) element.remove_attribute('rowspan');
      hasAttribute = true;
    }

    return hasAttribute;
  }

  WriteTabular(element: xml_node): boolean {
    let wroteAttribute = false;

    if (this.HasColspan()) {
      element.append_attribute('colspan').set_value(this.IntToStr(this.GetColspan()));
      wroteAttribute = true;
    }

    if (this.HasRowspan()) {
      element.append_attribute('rowspan').set_value(this.IntToStr(this.GetRowspan()));
      wroteAttribute = true;
    }

    return wroteAttribute;
  }

  SetColspan(colspan: number): void { this.m_colspan = colspan; }
  GetColspan(): number { return this.m_colspan; }
  HasColspan(): boolean { return this.m_colspan !== MEI_UNSET; }

  SetRowspan(rowspan: number): void { this.m_rowspan = rowspan; }
  GetRowspan(): number { return this.m_rowspan; }
  HasRowspan(): boolean { return this.m_rowspan !== MEI_UNSET; }
}

export class InstTabular extends AttTabular {}
