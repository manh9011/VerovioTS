/**
 * Pure TypeScript translation of libmei/dist/atts_mensural.cpp.
 *
 * Generated-libMEI attribute classes below preserve the C++ default/reset,
 * XML read/remove order, append-only XML write behavior, converter dispatch,
 * presence checks, and Inst* inheritance boundaries.
 */

import { Att } from './att';
import { xml_node } from './pugixml';
import type {
  data_MODUSMAIOR,
  data_MODUSMINOR,
  data_PROLATIO,
  data_TEMPUS,
} from './libmei-att';

export type data_DURQUALITY_mensural = number;
export type data_DIVISIO = number;
export type data_LIGATUREFORM = number;
export type data_STEMFORM_mensural = number;

// Canonical libMEI enum values from dist/atttypes.h.
export const DURQUALITY_mensural_NONE = 0;
export const DURQUALITY_mensural_perfecta = 1;
export const DURQUALITY_mensural_imperfecta = 2;
export const DURQUALITY_mensural_altera = 3;
export const DURQUALITY_mensural_minor = 4;
export const DURQUALITY_mensural_maior = 5;
export const DURQUALITY_mensural_duplex = 6;

export const DIVISIO_NONE = 0;
export const DIVISIO_ternaria = 1;
export const DIVISIO_quaternaria = 2;
export const DIVISIO_senariaimperf = 3;
export const DIVISIO_senariaperf = 4;
export const DIVISIO_octonaria = 5;
export const DIVISIO_novenaria = 6;
export const DIVISIO_duodenaria = 7;

export const LIGATUREFORM_NONE = 0;
export const LIGATUREFORM_recta = 1;
export const LIGATUREFORM_obliqua = 2;

export const STEMFORM_mensural_NONE = 0;
export const STEMFORM_mensural_circle = 1;
export const STEMFORM_mensural_oblique = 2;
export const STEMFORM_mensural_swallowtail = 3;
export const STEMFORM_mensural_virgula = 4;

/** Encodes durational quality of a mensural note. */
export abstract class AttDurationQuality extends Att {
  protected m_durQuality: data_DURQUALITY_mensural = DURQUALITY_mensural_NONE;

  protected constructor() {
    super();
    this.ResetDurationQuality();
  }

  ResetDurationQuality(): void {
    this.m_durQuality = DURQUALITY_mensural_NONE;
  }

  ReadDurationQuality(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const attribute = element.attribute('dur.quality');
    if (!attribute.empty()) {
      this.SetDurQuality(this.StrToDurqualityMensural(attribute.value()));
      if (removeAttr) element.remove_attribute('dur.quality');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteDurationQuality(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDurQuality()) {
      element.append_attribute('dur.quality').set_value(
        this.DurqualityMensuralToStr(this.GetDurQuality()),
      );
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetDurQuality(value: data_DURQUALITY_mensural): void { this.m_durQuality = value; }
  GetDurQuality(): data_DURQUALITY_mensural { return this.m_durQuality; }
  HasDurQuality(): boolean { return this.m_durQuality !== DURQUALITY_mensural_NONE; }
}

export class InstDurationQuality extends AttDurationQuality {
  constructor() { super(); }
}

/** Together, proport.num and proport.numbase specify a proportional ratio. */
export abstract class AttMensuralLog extends Att {
  protected m_proportNum = -0x7fffffff;
  protected m_proportNumbase = -0x7fffffff;

  protected constructor() {
    super();
    this.ResetMensuralLog();
  }

  ResetMensuralLog(): void {
    this.m_proportNum = -0x7fffffff;
    this.m_proportNumbase = -0x7fffffff;
  }

  ReadMensuralLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const proportNum = element.attribute('proport.num');
    if (!proportNum.empty()) {
      this.SetProportNum(this.StrToInt(proportNum.value()));
      if (removeAttr) element.remove_attribute('proport.num');
      hasAttribute = true;
    }
    const proportNumbase = element.attribute('proport.numbase');
    if (!proportNumbase.empty()) {
      this.SetProportNumbase(this.StrToInt(proportNumbase.value()));
      if (removeAttr) element.remove_attribute('proport.numbase');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMensuralLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasProportNum()) {
      element.append_attribute('proport.num').set_value(this.IntToStr(this.GetProportNum()));
      wroteAttribute = true;
    }
    if (this.HasProportNumbase()) {
      element.append_attribute('proport.numbase').set_value(this.IntToStr(this.GetProportNumbase()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetProportNum(value: number): void { this.m_proportNum = value; }
  GetProportNum(): number { return this.m_proportNum; }
  HasProportNum(): boolean { return this.m_proportNum !== -0x7fffffff; }

  SetProportNumbase(value: number): void { this.m_proportNumbase = value; }
  GetProportNumbase(): number { return this.m_proportNumbase; }
  HasProportNumbase(): boolean { return this.m_proportNumbase !== -0x7fffffff; }
}

export class InstMensuralLog extends AttMensuralLog {
  constructor() { super(); }
}

/** Common mensural modus/prolatio/tempus/divisio attributes. */
export abstract class AttMensuralShared extends Att {
  protected m_modusmaior: data_MODUSMAIOR = 0;
  protected m_modusminor: data_MODUSMINOR = 0;
  protected m_prolatio: data_PROLATIO = 0;
  protected m_tempus: data_TEMPUS = 0;
  protected m_divisio: data_DIVISIO = DIVISIO_NONE;

  protected constructor() {
    super();
    this.ResetMensuralShared();
  }

  ResetMensuralShared(): void {
    this.m_modusmaior = 0;
    this.m_modusminor = 0;
    this.m_prolatio = 0;
    this.m_tempus = 0;
    this.m_divisio = DIVISIO_NONE;
  }

  ReadMensuralShared(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const modusmaior = element.attribute('modusmaior');
    if (!modusmaior.empty()) {
      this.SetModusmaior(this.StrToModusmaior(modusmaior.value()));
      if (removeAttr) element.remove_attribute('modusmaior');
      hasAttribute = true;
    }
    const modusminor = element.attribute('modusminor');
    if (!modusminor.empty()) {
      this.SetModusminor(this.StrToModusminor(modusminor.value()));
      if (removeAttr) element.remove_attribute('modusminor');
      hasAttribute = true;
    }
    const prolatio = element.attribute('prolatio');
    if (!prolatio.empty()) {
      this.SetProlatio(this.StrToProlatio(prolatio.value()));
      if (removeAttr) element.remove_attribute('prolatio');
      hasAttribute = true;
    }
    const tempus = element.attribute('tempus');
    if (!tempus.empty()) {
      this.SetTempus(this.StrToTempus(tempus.value()));
      if (removeAttr) element.remove_attribute('tempus');
      hasAttribute = true;
    }
    const divisio = element.attribute('divisio');
    if (!divisio.empty()) {
      this.SetDivisio(this.StrToDivisio(divisio.value()));
      if (removeAttr) element.remove_attribute('divisio');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteMensuralShared(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasModusmaior()) {
      element.append_attribute('modusmaior').set_value(this.ModusmaiorToStr(this.GetModusmaior()));
      wroteAttribute = true;
    }
    if (this.HasModusminor()) {
      element.append_attribute('modusminor').set_value(this.ModusminorToStr(this.GetModusminor()));
      wroteAttribute = true;
    }
    if (this.HasProlatio()) {
      element.append_attribute('prolatio').set_value(this.ProlatioToStr(this.GetProlatio()));
      wroteAttribute = true;
    }
    if (this.HasTempus()) {
      element.append_attribute('tempus').set_value(this.TempusToStr(this.GetTempus()));
      wroteAttribute = true;
    }
    if (this.HasDivisio()) {
      element.append_attribute('divisio').set_value(this.DivisioToStr(this.GetDivisio()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetModusmaior(value: data_MODUSMAIOR): void { this.m_modusmaior = value; }
  GetModusmaior(): data_MODUSMAIOR { return this.m_modusmaior; }
  HasModusmaior(): boolean { return this.m_modusmaior !== 0; }

  SetModusminor(value: data_MODUSMINOR): void { this.m_modusminor = value; }
  GetModusminor(): data_MODUSMINOR { return this.m_modusminor; }
  HasModusminor(): boolean { return this.m_modusminor !== 0; }

  SetProlatio(value: data_PROLATIO): void { this.m_prolatio = value; }
  GetProlatio(): data_PROLATIO { return this.m_prolatio; }
  HasProlatio(): boolean { return this.m_prolatio !== 0; }

  SetTempus(value: data_TEMPUS): void { this.m_tempus = value; }
  GetTempus(): data_TEMPUS { return this.m_tempus; }
  HasTempus(): boolean { return this.m_tempus !== 0; }

  SetDivisio(value: data_DIVISIO): void { this.m_divisio = value; }
  GetDivisio(): data_DIVISIO { return this.m_divisio; }
  HasDivisio(): boolean { return this.m_divisio !== DIVISIO_NONE; }
}

export class InstMensuralShared extends AttMensuralShared {
  constructor() { super(); }
}

/** Visual ligature form for mensural notes. */
export abstract class AttNoteVisMensural extends Att {
  protected m_lig: data_LIGATUREFORM = LIGATUREFORM_NONE;

  protected constructor() {
    super();
    this.ResetNoteVisMensural();
  }

  ResetNoteVisMensural(): void { this.m_lig = LIGATUREFORM_NONE; }

  ReadNoteVisMensural(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const lig = element.attribute('lig');
    if (!lig.empty()) {
      this.SetLig(this.StrToLigatureform(lig.value()));
      if (removeAttr) element.remove_attribute('lig');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteNoteVisMensural(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLig()) {
      element.append_attribute('lig').set_value(this.LigatureformToStr(this.GetLig()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetLig(value: data_LIGATUREFORM): void { this.m_lig = value; }
  GetLig(): data_LIGATUREFORM { return this.m_lig; }
  HasLig(): boolean { return this.m_lig !== LIGATUREFORM_NONE; }
}

export class InstNoteVisMensural extends AttNoteVisMensural {
  constructor() { super(); }
}

/** Number of spaces covered by a mensural rest. */
export abstract class AttRestVisMensural extends Att {
  protected m_spaces = -0x7fffffff;

  protected constructor() {
    super();
    this.ResetRestVisMensural();
  }

  ResetRestVisMensural(): void { this.m_spaces = -0x7fffffff; }

  ReadRestVisMensural(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const spaces = element.attribute('spaces');
    if (!spaces.empty()) {
      this.SetSpaces(this.StrToInt(spaces.value()));
      if (removeAttr) element.remove_attribute('spaces');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteRestVisMensural(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSpaces()) {
      element.append_attribute('spaces').set_value(this.IntToStr(this.GetSpaces()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetSpaces(value: number): void { this.m_spaces = value; }
  GetSpaces(): number { return this.m_spaces; }
  HasSpaces(): boolean { return this.m_spaces !== -0x7fffffff; }
}

export class InstRestVisMensural extends AttRestVisMensural {
  constructor() { super(); }
}

/** Mensural note stem form. */
export abstract class AttStemsMensural extends Att {
  protected m_stemForm: data_STEMFORM_mensural = STEMFORM_mensural_NONE;

  protected constructor() {
    super();
    this.ResetStemsMensural();
  }

  ResetStemsMensural(): void { this.m_stemForm = STEMFORM_mensural_NONE; }

  ReadStemsMensural(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const stemForm = element.attribute('stem.form');
    if (!stemForm.empty()) {
      this.SetStemForm(this.StrToStemformMensural(stemForm.value()));
      if (removeAttr) element.remove_attribute('stem.form');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteStemsMensural(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasStemForm()) {
      element.append_attribute('stem.form').set_value(this.StemformMensuralToStr(this.GetStemForm()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetStemForm(value: data_STEMFORM_mensural): void { this.m_stemForm = value; }
  GetStemForm(): data_STEMFORM_mensural { return this.m_stemForm; }
  HasStemForm(): boolean { return this.m_stemForm !== STEMFORM_mensural_NONE; }
}

export class InstStemsMensural extends AttStemsMensural {
  constructor() { super(); }
}
