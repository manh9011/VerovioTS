/**
 * Pure TypeScript translation of libmei/dist/atts_pagebased.cpp.
 * Preserves constructor/reset, XML read/write ordering, converter dispatch,
 * presence semantics and the instantiable wrapper shape from generated libmei.
 */

import { Att } from './att';
import { xml_node } from './pugixml';
import { data_MEASUREMENTSIGNED } from './libmei-att';

export type data_MEASUREMENTUNSIGNED = data_MEASUREMENTSIGNED;

/** Generated-libmei attribute class for page margins. */
export abstract class AttMargins extends Att {
  protected m_topmar = new data_MEASUREMENTSIGNED();
  protected m_botmar = new data_MEASUREMENTSIGNED();
  protected m_leftmar = new data_MEASUREMENTSIGNED();
  protected m_rightmar = new data_MEASUREMENTSIGNED();

  constructor() {
    super();
    this.ResetMargins();
  }

  ResetMargins(): void {
    this.m_topmar = new data_MEASUREMENTSIGNED();
    this.m_botmar = new data_MEASUREMENTSIGNED();
    this.m_leftmar = new data_MEASUREMENTSIGNED();
    this.m_rightmar = new data_MEASUREMENTSIGNED();
  }

  ReadMargins(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    let attr = element.attribute('topmar');
    if (!attr.empty()) {
      this.SetTopmar(this.StrToMeasurementunsigned(attr.value()));
      if (removeAttr) element.remove_attribute('topmar');
      hasAttribute = true;
    }
    attr = element.attribute('botmar');
    if (!attr.empty()) {
      this.SetBotmar(this.StrToMeasurementunsigned(attr.value()));
      if (removeAttr) element.remove_attribute('botmar');
      hasAttribute = true;
    }
    attr = element.attribute('leftmar');
    if (!attr.empty()) {
      this.SetLeftmar(this.StrToMeasurementunsigned(attr.value()));
      if (removeAttr) element.remove_attribute('leftmar');
      hasAttribute = true;
    }
    attr = element.attribute('rightmar');
    if (!attr.empty()) {
      this.SetRightmar(this.StrToMeasurementunsigned(attr.value()));
      if (removeAttr) element.remove_attribute('rightmar');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMargins(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTopmar()) {
      element.append_attribute('topmar').set_value(this.MeasurementunsignedToStr(this.GetTopmar()));
      wroteAttribute = true;
    }
    if (this.HasBotmar()) {
      element.append_attribute('botmar').set_value(this.MeasurementunsignedToStr(this.GetBotmar()));
      wroteAttribute = true;
    }
    if (this.HasLeftmar()) {
      element.append_attribute('leftmar').set_value(this.MeasurementunsignedToStr(this.GetLeftmar()));
      wroteAttribute = true;
    }
    if (this.HasRightmar()) {
      element.append_attribute('rightmar').set_value(this.MeasurementunsignedToStr(this.GetRightmar()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetTopmar(topmar: data_MEASUREMENTUNSIGNED): void { this.m_topmar = topmar; }
  GetTopmar(): data_MEASUREMENTUNSIGNED { return this.m_topmar; }
  HasTopmar(): boolean { return this.m_topmar.HasValue(); }

  SetBotmar(botmar: data_MEASUREMENTUNSIGNED): void { this.m_botmar = botmar; }
  GetBotmar(): data_MEASUREMENTUNSIGNED { return this.m_botmar; }
  HasBotmar(): boolean { return this.m_botmar.HasValue(); }

  SetLeftmar(leftmar: data_MEASUREMENTUNSIGNED): void { this.m_leftmar = leftmar; }
  GetLeftmar(): data_MEASUREMENTUNSIGNED { return this.m_leftmar; }
  HasLeftmar(): boolean { return this.m_leftmar.HasValue(); }

  SetRightmar(rightmar: data_MEASUREMENTUNSIGNED): void { this.m_rightmar = rightmar; }
  GetRightmar(): data_MEASUREMENTUNSIGNED { return this.m_rightmar; }
  HasRightmar(): boolean { return this.m_rightmar.HasValue(); }
}

export class InstMargins extends AttMargins {}
