/**
 * Pure TypeScript translation of libmei/dist/atts_header.cpp.
 *
 * This file preserves the generated libMEI attribute-class semantics: default
 * values, XML read/remove order, append-only XML write behavior, converter
 * dispatch, presence checks, and instantiable wrappers.
 */

import { Att } from './att';
import { xml_node } from './pugixml';

/** libMEI generated scalar aliases used by this translation unit. */
export type data_BOOLEAN = number;
export type recordType_RECORDTYPE = number;
export type regularMethod_METHOD = number;

export const BOOLEAN_NONE = 0;
export const MEI_UNSET = -0x7fffffff;
export const recordType_RECORDTYPE_NONE = 0;
export const regularMethod_METHOD_NONE = 0;

/** Optional/ad-libitum performance resource. */
export abstract class AttAdlibitum extends Att {
  protected m_adlib: data_BOOLEAN = BOOLEAN_NONE;

  protected constructor() {
    super();
    this.ResetAdlibitum();
  }

  ResetAdlibitum(): void {
    this.m_adlib = BOOLEAN_NONE;
  }

  ReadAdlibitum(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const attribute = element.attribute('adlib');
    if (!attribute.empty()) {
      this.SetAdlib(this.StrToBoolean(attribute.value()));
      if (removeAttr) element.remove_attribute('adlib');
      hasAttribute = true;
    }
    return hasAttribute;
  }

  WriteAdlibitum(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAdlib()) {
      element.append_attribute('adlib').set_value(this.BooleanToStr(this.GetAdlib()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }

  SetAdlib(adlib: data_BOOLEAN): void { this.m_adlib = adlib; }
  GetAdlib(): data_BOOLEAN { return this.m_adlib; }
  HasAdlib(): boolean { return this.m_adlib !== BOOLEAN_NONE; }
}

export class InstAdlibitum extends AttAdlibitum {
  constructor() { super(); }
}

/** References to surface elements around a bifolium. */
export abstract class AttBifoliumSurfaces extends Att {
  protected m_outerRecto = '';
  protected m_innerVerso = '';
  protected m_innerRecto = '';
  protected m_outerVerso = '';

  protected constructor() {
    super();
    this.ResetBifoliumSurfaces();
  }

  ResetBifoliumSurfaces(): void {
    this.m_outerRecto = '';
    this.m_innerVerso = '';
    this.m_innerRecto = '';
    this.m_outerVerso = '';
  }

  ReadBifoliumSurfaces(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const outerRecto = element.attribute('outer.recto');
    if (!outerRecto.empty()) { this.SetOuterRecto(this.StrToStr(outerRecto.value())); if (removeAttr) element.remove_attribute('outer.recto'); hasAttribute = true; }
    const innerVerso = element.attribute('inner.verso');
    if (!innerVerso.empty()) { this.SetInnerVerso(this.StrToStr(innerVerso.value())); if (removeAttr) element.remove_attribute('inner.verso'); hasAttribute = true; }
    const innerRecto = element.attribute('inner.recto');
    if (!innerRecto.empty()) { this.SetInnerRecto(this.StrToStr(innerRecto.value())); if (removeAttr) element.remove_attribute('inner.recto'); hasAttribute = true; }
    const outerVerso = element.attribute('outer.verso');
    if (!outerVerso.empty()) { this.SetOuterVerso(this.StrToStr(outerVerso.value())); if (removeAttr) element.remove_attribute('outer.verso'); hasAttribute = true; }
    return hasAttribute;
  }

  WriteBifoliumSurfaces(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOuterRecto()) { element.append_attribute('outer.recto').set_value(this.StrToStr(this.GetOuterRecto())); wroteAttribute = true; }
    if (this.HasInnerVerso()) { element.append_attribute('inner.verso').set_value(this.StrToStr(this.GetInnerVerso())); wroteAttribute = true; }
    if (this.HasInnerRecto()) { element.append_attribute('inner.recto').set_value(this.StrToStr(this.GetInnerRecto())); wroteAttribute = true; }
    if (this.HasOuterVerso()) { element.append_attribute('outer.verso').set_value(this.StrToStr(this.GetOuterVerso())); wroteAttribute = true; }
    return wroteAttribute;
  }

  SetOuterRecto(value: string): void { this.m_outerRecto = value; }
  GetOuterRecto(): string { return this.m_outerRecto; }
  HasOuterRecto(): boolean { return this.m_outerRecto !== ''; }
  SetInnerVerso(value: string): void { this.m_innerVerso = value; }
  GetInnerVerso(): string { return this.m_innerVerso; }
  HasInnerVerso(): boolean { return this.m_innerVerso !== ''; }
  SetInnerRecto(value: string): void { this.m_innerRecto = value; }
  GetInnerRecto(): string { return this.m_innerRecto; }
  HasInnerRecto(): boolean { return this.m_innerRecto !== ''; }
  SetOuterVerso(value: string): void { this.m_outerVerso = value; }
  GetOuterVerso(): string { return this.m_outerVerso; }
  HasOuterVerso(): boolean { return this.m_outerVerso !== ''; }
}

export class InstBifoliumSurfaces extends AttBifoliumSurfaces {
  constructor() { super(); }
}

/** References to the recto and verso surface of a folium. */
export abstract class AttFoliumSurfaces extends Att {
  protected m_recto = '';
  protected m_verso = '';

  protected constructor() {
    super();
    this.ResetFoliumSurfaces();
  }

  ResetFoliumSurfaces(): void { this.m_recto = ''; this.m_verso = ''; }

  ReadFoliumSurfaces(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const recto = element.attribute('recto');
    if (!recto.empty()) { this.SetRecto(this.StrToStr(recto.value())); if (removeAttr) element.remove_attribute('recto'); hasAttribute = true; }
    const verso = element.attribute('verso');
    if (!verso.empty()) { this.SetVerso(this.StrToStr(verso.value())); if (removeAttr) element.remove_attribute('verso'); hasAttribute = true; }
    return hasAttribute;
  }

  WriteFoliumSurfaces(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasRecto()) { element.append_attribute('recto').set_value(this.StrToStr(this.GetRecto())); wroteAttribute = true; }
    if (this.HasVerso()) { element.append_attribute('verso').set_value(this.StrToStr(this.GetVerso())); wroteAttribute = true; }
    return wroteAttribute;
  }

  SetRecto(value: string): void { this.m_recto = value; }
  GetRecto(): string { return this.m_recto; }
  HasRecto(): boolean { return this.m_recto !== ''; }
  SetVerso(value: string): void { this.m_verso = value; }
  GetVerso(): string { return this.m_verso; }
  HasVerso(): boolean { return this.m_verso !== ''; }
}

export class InstFoliumSurfaces extends AttFoliumSurfaces {
  constructor() { super(); }
}

/** Identifies whether a performance resource is a soloist. */
export abstract class AttPerfRes extends Att {
  protected m_solo: data_BOOLEAN = BOOLEAN_NONE;

  protected constructor() {
    super();
    this.ResetPerfRes();
  }

  ResetPerfRes(): void { this.m_solo = BOOLEAN_NONE; }
  ReadPerfRes(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const solo = element.attribute('solo');
    if (!solo.empty()) { this.SetSolo(this.StrToBoolean(solo.value())); if (removeAttr) element.remove_attribute('solo'); hasAttribute = true; }
    return hasAttribute;
  }
  WritePerfRes(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSolo()) { element.append_attribute('solo').set_value(this.BooleanToStr(this.GetSolo())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetSolo(value: data_BOOLEAN): void { this.m_solo = value; }
  GetSolo(): data_BOOLEAN { return this.m_solo; }
  HasSolo(): boolean { return this.m_solo !== BOOLEAN_NONE; }
}

export class InstPerfRes extends AttPerfRes {
  constructor() { super(); }
}

/** Basic performance-resource cardinality. */
export abstract class AttPerfResBasic extends Att {
  protected m_count = MEI_UNSET;

  protected constructor() {
    super();
    this.ResetPerfResBasic();
  }
  ResetPerfResBasic(): void { this.m_count = MEI_UNSET; }
  ReadPerfResBasic(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const count = element.attribute('count');
    if (!count.empty()) { this.SetCount(this.StrToInt(count.value())); if (removeAttr) element.remove_attribute('count'); hasAttribute = true; }
    return hasAttribute;
  }
  WritePerfResBasic(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCount()) { element.append_attribute('count').set_value(this.IntToStr(this.GetCount())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetCount(value: number): void { this.m_count = value; }
  GetCount(): number { return this.m_count; }
  HasCount(): boolean { return this.m_count !== MEI_UNSET; }
}

export class InstPerfResBasic extends AttPerfResBasic {
  constructor() { super(); }
}

/** Record type token. Numeric values are kept identical to generated libMEI. */
export abstract class AttRecordType extends Att {
  protected m_recordtype: recordType_RECORDTYPE = recordType_RECORDTYPE_NONE;

  protected constructor() {
    super();
    this.ResetRecordType();
  }
  ResetRecordType(): void { this.m_recordtype = recordType_RECORDTYPE_NONE; }
  ReadRecordType(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const recordtype = element.attribute('recordtype');
    if (!recordtype.empty()) { this.SetRecordtype(this.StrToRecordTypeRecordtype(recordtype.value())); if (removeAttr) element.remove_attribute('recordtype'); hasAttribute = true; }
    return hasAttribute;
  }
  WriteRecordType(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasRecordtype()) { element.append_attribute('recordtype').set_value(this.RecordTypeRecordtypeToStr(this.GetRecordtype())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetRecordtype(value: recordType_RECORDTYPE): void { this.m_recordtype = value; }
  GetRecordtype(): recordType_RECORDTYPE { return this.m_recordtype; }
  HasRecordtype(): boolean { return this.m_recordtype !== recordType_RECORDTYPE_NONE; }
}

export class InstRecordType extends AttRecordType {
  constructor() { super(); }
}

/** Method used to mark corrections and normalizations. */
export abstract class AttRegularMethod extends Att {
  protected m_method: regularMethod_METHOD = regularMethod_METHOD_NONE;

  protected constructor() {
    super();
    this.ResetRegularMethod();
  }
  ResetRegularMethod(): void { this.m_method = regularMethod_METHOD_NONE; }
  ReadRegularMethod(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    const method = element.attribute('method');
    if (!method.empty()) { this.SetMethod(this.StrToRegularMethodMethod(method.value())); if (removeAttr) element.remove_attribute('method'); hasAttribute = true; }
    return hasAttribute;
  }
  WriteRegularMethod(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMethod()) { element.append_attribute('method').set_value(this.RegularMethodMethodToStr(this.GetMethod())); wroteAttribute = true; }
    return wroteAttribute;
  }
  SetMethod(value: regularMethod_METHOD): void { this.m_method = value; }
  GetMethod(): regularMethod_METHOD { return this.m_method; }
  HasMethod(): boolean { return this.m_method !== regularMethod_METHOD_NONE; }
}

export class InstRegularMethod extends AttRegularMethod {
  constructor() { super(); }
}
