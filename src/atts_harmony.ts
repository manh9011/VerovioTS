/**
 * Pure TypeScript translation of libmei/dist/atts_harmony.cpp.
 * Preserves generated libmei defaults, XML read/remove/write ordering,
 * append-attribute semantics, presence checks and converter dispatch.
 */

import { Att } from './att';
import { xml_node } from './pugixml';

export abstract class AttHarmLog extends Att {
  protected m_chordref = '';

  constructor() {
    super();
    this.ResetHarmLog();
  }

  ResetHarmLog(): void {
    this.m_chordref = '';
  }

  ReadHarmLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const chordref = element.attribute('chordref');
    if (!chordref.empty()) {
      this.SetChordref(this.StrToStr(chordref.value()));
      if (removeAttr) element.remove_attribute('chordref');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteHarmLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasChordref()) {
      element.append_attribute('chordref').set_value(this.StrToStr(this.GetChordref()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetChordref(chordref: string): void {
    this.m_chordref = chordref;
  }

  GetChordref(): string {
    return this.m_chordref;
  }

  HasChordref(): boolean {
    return this.m_chordref !== '';
  }
}

export class InstHarmLog extends AttHarmLog {}
