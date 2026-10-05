/**
 * Pure TypeScript translation of libmei/dist/atts_cmn.cpp.
 * Generated from the canonical C++ implementation; XML read/write
 * control flow, defaults and presence semantics are preserved.
 */

import { Att } from './att';
import { xml_node } from './pugixml';

const BARRENDITION_NONE = 0;
const BEAMPLACE_NONE = 0;
const BOOLEAN_NONE = 0;
const GLISSANDO_NONE = 0;
const GRACE_NONE = 0;
const HARPPEDALPOSITION_NONE = 0;
const LINEFORM_NONE = 0;
const NEIGHBORINGLAYER_NONE = 0;
const PEDALSTYLE_NONE = 0;
const STAFFREL_basic_NONE = 0;
const arpegLog_ORDER_NONE = 0;
const beamRend_FORM_NONE = 0;
const bracketSpanLog_FUNC_NONE = 0;
const cutout_CUTOUT_NONE = 0;
const graceGrpLog_ATTACH_NONE = 0;
const hairpinLog_FORM_NONE = 0;
const meterSigGrpLog_FUNC_NONE = 0;
const octaveLog_COLL_NONE = 0;
const pedalLog_DIR_NONE = 0;
const rehearsal_REHENCLOSE_NONE = 0;
const tremForm_FORM_NONE = 0;
const MEI_UNSET = -2147483647;
const DURATION_NONE = 0;

export abstract class AttArpegLog extends Att {
  protected m_order: any = arpegLog_ORDER_NONE;
  constructor() { super(); this.ResetArpegLog(); }
  ResetArpegLog(): void {
    this.m_order = arpegLog_ORDER_NONE;
  }
  ReadArpegLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('order').empty()) {
      this.SetOrder(this.StrToArpegLogOrder(element.attribute('order').value()));
      if (removeAttr) element.remove_attribute('order');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteArpegLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOrder()) {
      element.append_attribute('order').set_value(this.ArpegLogOrderToStr(this.GetOrder()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetOrder(value: any): void { this.m_order = value; }
  GetOrder(): any { return this.m_order; }
  HasOrder(): boolean { return this.m_order != arpegLog_ORDER_NONE; }
}

export class InstArpegLog extends AttArpegLog {}

export abstract class AttBeamPresent extends Att {
  protected m_beam: any = "";
  constructor() { super(); this.ResetBeamPresent(); }
  ResetBeamPresent(): void {
    this.m_beam = "";
  }
  ReadBeamPresent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('beam').empty()) {
      this.SetBeam(this.StrToStr(element.attribute('beam').value()));
      if (removeAttr) element.remove_attribute('beam');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteBeamPresent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasBeam()) {
      element.append_attribute('beam').set_value(this.StrToStr(this.GetBeam()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetBeam(value: string): void { this.m_beam = value; }
  GetBeam(): string { return this.m_beam; }
  HasBeam(): boolean { return this.m_beam != ""; }
}

export class InstBeamPresent extends AttBeamPresent {}

export abstract class AttBeamRend extends Att {
  protected m_form: any = beamRend_FORM_NONE;
  protected m_place: any = BEAMPLACE_NONE;
  protected m_slash: any = BOOLEAN_NONE;
  protected m_slope: any = 0.0;
  constructor() { super(); this.ResetBeamRend(); }
  ResetBeamRend(): void {
    this.m_form = beamRend_FORM_NONE;
    this.m_place = BEAMPLACE_NONE;
    this.m_slash = BOOLEAN_NONE;
    this.m_slope = 0.0;
  }
  ReadBeamRend(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('form').empty()) {
      this.SetForm(this.StrToBeamRendForm(element.attribute('form').value()));
      if (removeAttr) element.remove_attribute('form');
      hasAttribute = true;
    }
    if (!element.attribute('place').empty()) {
      this.SetPlace(this.StrToBeamplace(element.attribute('place').value()));
      if (removeAttr) element.remove_attribute('place');
      hasAttribute = true;
    }
    if (!element.attribute('slash').empty()) {
      this.SetSlash(this.StrToBoolean(element.attribute('slash').value()));
      if (removeAttr) element.remove_attribute('slash');
      hasAttribute = true;
    }
    if (!element.attribute('slope').empty()) {
      this.SetSlope(this.StrToDbl(element.attribute('slope').value()));
      if (removeAttr) element.remove_attribute('slope');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteBeamRend(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) {
      element.append_attribute('form').set_value(this.BeamRendFormToStr(this.GetForm()));
      wroteAttribute = true;
    }
    if (this.HasPlace()) {
      element.append_attribute('place').set_value(this.BeamplaceToStr(this.GetPlace()));
      wroteAttribute = true;
    }
    if (this.HasSlash()) {
      element.append_attribute('slash').set_value(this.BooleanToStr(this.GetSlash()));
      wroteAttribute = true;
    }
    if (this.HasSlope()) {
      element.append_attribute('slope').set_value(this.DblToStr(this.GetSlope()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetForm(value: any): void { this.m_form = value; }
  GetForm(): any { return this.m_form; }
  HasForm(): boolean { return this.m_form != beamRend_FORM_NONE; }
  SetPlace(value: any): void { this.m_place = value; }
  GetPlace(): any { return this.m_place; }
  HasPlace(): boolean { return this.m_place != BEAMPLACE_NONE; }
  SetSlash(value: any): void { this.m_slash = value; }
  GetSlash(): any { return this.m_slash; }
  HasSlash(): boolean { return this.m_slash != BOOLEAN_NONE; }
  SetSlope(value: number): void { this.m_slope = value; }
  GetSlope(): number { return this.m_slope; }
  HasSlope(): boolean { return this.m_slope != 0.0; }
}

export class InstBeamRend extends AttBeamRend {}

export abstract class AttBeamSecondary extends Att {
  protected m_breaksec: any = MEI_UNSET;
  constructor() { super(); this.ResetBeamSecondary(); }
  ResetBeamSecondary(): void {
    this.m_breaksec = MEI_UNSET;
  }
  ReadBeamSecondary(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('breaksec').empty()) {
      this.SetBreaksec(this.StrToInt(element.attribute('breaksec').value()));
      if (removeAttr) element.remove_attribute('breaksec');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteBeamSecondary(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasBreaksec()) {
      element.append_attribute('breaksec').set_value(this.IntToStr(this.GetBreaksec()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetBreaksec(value: number): void { this.m_breaksec = value; }
  GetBreaksec(): number { return this.m_breaksec; }
  HasBreaksec(): boolean { return this.m_breaksec != MEI_UNSET; }
}

export class InstBeamSecondary extends AttBeamSecondary {}

export abstract class AttBeamedWith extends Att {
  protected m_beamWith: any = NEIGHBORINGLAYER_NONE;
  constructor() { super(); this.ResetBeamedWith(); }
  ResetBeamedWith(): void {
    this.m_beamWith = NEIGHBORINGLAYER_NONE;
  }
  ReadBeamedWith(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('beam.with').empty()) {
      this.SetBeamWith(this.StrToNeighboringlayer(element.attribute('beam.with').value()));
      if (removeAttr) element.remove_attribute('beam.with');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteBeamedWith(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasBeamWith()) {
      element.append_attribute('beam.with').set_value(this.NeighboringlayerToStr(this.GetBeamWith()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetBeamWith(value: any): void { this.m_beamWith = value; }
  GetBeamWith(): any { return this.m_beamWith; }
  HasBeamWith(): boolean { return this.m_beamWith != NEIGHBORINGLAYER_NONE; }
}

export class InstBeamedWith extends AttBeamedWith {}

export abstract class AttBeamingLog extends Att {
  protected m_beamGroup: any = "";
  protected m_beamRests: any = BOOLEAN_NONE;
  constructor() { super(); this.ResetBeamingLog(); }
  ResetBeamingLog(): void {
    this.m_beamGroup = "";
    this.m_beamRests = BOOLEAN_NONE;
  }
  ReadBeamingLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('beam.group').empty()) {
      this.SetBeamGroup(this.StrToStr(element.attribute('beam.group').value()));
      if (removeAttr) element.remove_attribute('beam.group');
      hasAttribute = true;
    }
    if (!element.attribute('beam.rests').empty()) {
      this.SetBeamRests(this.StrToBoolean(element.attribute('beam.rests').value()));
      if (removeAttr) element.remove_attribute('beam.rests');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteBeamingLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasBeamGroup()) {
      element.append_attribute('beam.group').set_value(this.StrToStr(this.GetBeamGroup()));
      wroteAttribute = true;
    }
    if (this.HasBeamRests()) {
      element.append_attribute('beam.rests').set_value(this.BooleanToStr(this.GetBeamRests()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetBeamGroup(value: string): void { this.m_beamGroup = value; }
  GetBeamGroup(): string { return this.m_beamGroup; }
  HasBeamGroup(): boolean { return this.m_beamGroup != ""; }
  SetBeamRests(value: any): void { this.m_beamRests = value; }
  GetBeamRests(): any { return this.m_beamRests; }
  HasBeamRests(): boolean { return this.m_beamRests != BOOLEAN_NONE; }
}

export class InstBeamingLog extends AttBeamingLog {}

export abstract class AttBeatRptLog extends Att {
  protected m_beatdef: any = 0.0;
  constructor() { super(); this.ResetBeatRptLog(); }
  ResetBeatRptLog(): void {
    this.m_beatdef = 0.0;
  }
  ReadBeatRptLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('beatdef').empty()) {
      this.SetBeatdef(this.StrToDbl(element.attribute('beatdef').value()));
      if (removeAttr) element.remove_attribute('beatdef');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteBeatRptLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasBeatdef()) {
      element.append_attribute('beatdef').set_value(this.DblToStr(this.GetBeatdef()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetBeatdef(value: number): void { this.m_beatdef = value; }
  GetBeatdef(): number { return this.m_beatdef; }
  HasBeatdef(): boolean { return this.m_beatdef != 0.0; }
}

export class InstBeatRptLog extends AttBeatRptLog {}

export abstract class AttBracketSpanLog extends Att {
  protected m_func: any = bracketSpanLog_FUNC_NONE;
  constructor() { super(); this.ResetBracketSpanLog(); }
  ResetBracketSpanLog(): void {
    this.m_func = bracketSpanLog_FUNC_NONE;
  }
  ReadBracketSpanLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('func').empty()) {
      this.SetFunc(this.StrToBracketSpanLogFunc(element.attribute('func').value()));
      if (removeAttr) element.remove_attribute('func');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteBracketSpanLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasFunc()) {
      element.append_attribute('func').set_value(this.BracketSpanLogFuncToStr(this.GetFunc()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetFunc(value: any): void { this.m_func = value; }
  GetFunc(): any { return this.m_func; }
  HasFunc(): boolean { return this.m_func != bracketSpanLog_FUNC_NONE; }
}

export class InstBracketSpanLog extends AttBracketSpanLog {}

export abstract class AttCutout extends Att {
  protected m_cutout: any = cutout_CUTOUT_NONE;
  constructor() { super(); this.ResetCutout(); }
  ResetCutout(): void {
    this.m_cutout = cutout_CUTOUT_NONE;
  }
  ReadCutout(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('cutout').empty()) {
      this.SetCutout(this.StrToCutoutCutout(element.attribute('cutout').value()));
      if (removeAttr) element.remove_attribute('cutout');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteCutout(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCutout()) {
      element.append_attribute('cutout').set_value(this.CutoutCutoutToStr(this.GetCutout()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetCutout(value: any): void { this.m_cutout = value; }
  GetCutout(): any { return this.m_cutout; }
  HasCutout(): boolean { return this.m_cutout != cutout_CUTOUT_NONE; }
}

export class InstCutout extends AttCutout {}

export abstract class AttExpandable extends Att {
  protected m_expand: any = BOOLEAN_NONE;
  constructor() { super(); this.ResetExpandable(); }
  ResetExpandable(): void {
    this.m_expand = BOOLEAN_NONE;
  }
  ReadExpandable(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('expand').empty()) {
      this.SetExpand(this.StrToBoolean(element.attribute('expand').value()));
      if (removeAttr) element.remove_attribute('expand');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteExpandable(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasExpand()) {
      element.append_attribute('expand').set_value(this.BooleanToStr(this.GetExpand()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetExpand(value: any): void { this.m_expand = value; }
  GetExpand(): any { return this.m_expand; }
  HasExpand(): boolean { return this.m_expand != BOOLEAN_NONE; }
}

export class InstExpandable extends AttExpandable {}

export abstract class AttGlissPresent extends Att {
  protected m_gliss: any = GLISSANDO_NONE;
  constructor() { super(); this.ResetGlissPresent(); }
  ResetGlissPresent(): void {
    this.m_gliss = GLISSANDO_NONE;
  }
  ReadGlissPresent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('gliss').empty()) {
      this.SetGliss(this.StrToGlissando(element.attribute('gliss').value()));
      if (removeAttr) element.remove_attribute('gliss');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteGlissPresent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasGliss()) {
      element.append_attribute('gliss').set_value(this.GlissandoToStr(this.GetGliss()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetGliss(value: any): void { this.m_gliss = value; }
  GetGliss(): any { return this.m_gliss; }
  HasGliss(): boolean { return this.m_gliss != GLISSANDO_NONE; }
}

export class InstGlissPresent extends AttGlissPresent {}

export abstract class AttGraceGrpLog extends Att {
  protected m_attach: any = graceGrpLog_ATTACH_NONE;
  constructor() { super(); this.ResetGraceGrpLog(); }
  ResetGraceGrpLog(): void {
    this.m_attach = graceGrpLog_ATTACH_NONE;
  }
  ReadGraceGrpLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('attach').empty()) {
      this.SetAttach(this.StrToGraceGrpLogAttach(element.attribute('attach').value()));
      if (removeAttr) element.remove_attribute('attach');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteGraceGrpLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasAttach()) {
      element.append_attribute('attach').set_value(this.GraceGrpLogAttachToStr(this.GetAttach()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetAttach(value: any): void { this.m_attach = value; }
  GetAttach(): any { return this.m_attach; }
  HasAttach(): boolean { return this.m_attach != graceGrpLog_ATTACH_NONE; }
}

export class InstGraceGrpLog extends AttGraceGrpLog {}

export abstract class AttGraced extends Att {
  protected m_grace: any = GRACE_NONE;
  protected m_graceTime: any = -1.0;
  constructor() { super(); this.ResetGraced(); }
  ResetGraced(): void {
    this.m_grace = GRACE_NONE;
    this.m_graceTime = -1.0;
  }
  ReadGraced(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('grace').empty()) {
      this.SetGrace(this.StrToGrace(element.attribute('grace').value()));
      if (removeAttr) element.remove_attribute('grace');
      hasAttribute = true;
    }
    if (!element.attribute('grace.time').empty()) {
      this.SetGraceTime(this.StrToPercent(element.attribute('grace.time').value()));
      if (removeAttr) element.remove_attribute('grace.time');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteGraced(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasGrace()) {
      element.append_attribute('grace').set_value(this.GraceToStr(this.GetGrace()));
      wroteAttribute = true;
    }
    if (this.HasGraceTime()) {
      element.append_attribute('grace.time').set_value(this.PercentToStr(this.GetGraceTime()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetGrace(value: any): void { this.m_grace = value; }
  GetGrace(): any { return this.m_grace; }
  HasGrace(): boolean { return this.m_grace != GRACE_NONE; }
  SetGraceTime(value: any): void { this.m_graceTime = value; }
  GetGraceTime(): any { return this.m_graceTime; }
  HasGraceTime(): boolean { return this.m_graceTime != -1.0; }
}

export class InstGraced extends AttGraced {}

export abstract class AttHairpinLog extends Att {
  protected m_form: any = hairpinLog_FORM_NONE;
  protected m_niente: any = BOOLEAN_NONE;
  constructor() { super(); this.ResetHairpinLog(); }
  ResetHairpinLog(): void {
    this.m_form = hairpinLog_FORM_NONE;
    this.m_niente = BOOLEAN_NONE;
  }
  ReadHairpinLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('form').empty()) {
      this.SetForm(this.StrToHairpinLogForm(element.attribute('form').value()));
      if (removeAttr) element.remove_attribute('form');
      hasAttribute = true;
    }
    if (!element.attribute('niente').empty()) {
      this.SetNiente(this.StrToBoolean(element.attribute('niente').value()));
      if (removeAttr) element.remove_attribute('niente');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteHairpinLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) {
      element.append_attribute('form').set_value(this.HairpinLogFormToStr(this.GetForm()));
      wroteAttribute = true;
    }
    if (this.HasNiente()) {
      element.append_attribute('niente').set_value(this.BooleanToStr(this.GetNiente()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetForm(value: any): void { this.m_form = value; }
  GetForm(): any { return this.m_form; }
  HasForm(): boolean { return this.m_form != hairpinLog_FORM_NONE; }
  SetNiente(value: any): void { this.m_niente = value; }
  GetNiente(): any { return this.m_niente; }
  HasNiente(): boolean { return this.m_niente != BOOLEAN_NONE; }
}

export class InstHairpinLog extends AttHairpinLog {}

export abstract class AttHarpPedalLog extends Att {
  protected m_c: any = HARPPEDALPOSITION_NONE;
  protected m_d: any = HARPPEDALPOSITION_NONE;
  protected m_e: any = HARPPEDALPOSITION_NONE;
  protected m_f: any = HARPPEDALPOSITION_NONE;
  protected m_g: any = HARPPEDALPOSITION_NONE;
  protected m_a: any = HARPPEDALPOSITION_NONE;
  protected m_b: any = HARPPEDALPOSITION_NONE;
  constructor() { super(); this.ResetHarpPedalLog(); }
  ResetHarpPedalLog(): void {
    this.m_c = HARPPEDALPOSITION_NONE;
    this.m_d = HARPPEDALPOSITION_NONE;
    this.m_e = HARPPEDALPOSITION_NONE;
    this.m_f = HARPPEDALPOSITION_NONE;
    this.m_g = HARPPEDALPOSITION_NONE;
    this.m_a = HARPPEDALPOSITION_NONE;
    this.m_b = HARPPEDALPOSITION_NONE;
  }
  ReadHarpPedalLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('c').empty()) {
      this.SetC(this.StrToHarppedalposition(element.attribute('c').value()));
      if (removeAttr) element.remove_attribute('c');
      hasAttribute = true;
    }
    if (!element.attribute('d').empty()) {
      this.SetD(this.StrToHarppedalposition(element.attribute('d').value()));
      if (removeAttr) element.remove_attribute('d');
      hasAttribute = true;
    }
    if (!element.attribute('e').empty()) {
      this.SetE(this.StrToHarppedalposition(element.attribute('e').value()));
      if (removeAttr) element.remove_attribute('e');
      hasAttribute = true;
    }
    if (!element.attribute('f').empty()) {
      this.SetF(this.StrToHarppedalposition(element.attribute('f').value()));
      if (removeAttr) element.remove_attribute('f');
      hasAttribute = true;
    }
    if (!element.attribute('g').empty()) {
      this.SetG(this.StrToHarppedalposition(element.attribute('g').value()));
      if (removeAttr) element.remove_attribute('g');
      hasAttribute = true;
    }
    if (!element.attribute('a').empty()) {
      this.SetA(this.StrToHarppedalposition(element.attribute('a').value()));
      if (removeAttr) element.remove_attribute('a');
      hasAttribute = true;
    }
    if (!element.attribute('b').empty()) {
      this.SetB(this.StrToHarppedalposition(element.attribute('b').value()));
      if (removeAttr) element.remove_attribute('b');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteHarpPedalLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasC()) {
      element.append_attribute('c').set_value(this.HarppedalpositionToStr(this.GetC()));
      wroteAttribute = true;
    }
    if (this.HasD()) {
      element.append_attribute('d').set_value(this.HarppedalpositionToStr(this.GetD()));
      wroteAttribute = true;
    }
    if (this.HasE()) {
      element.append_attribute('e').set_value(this.HarppedalpositionToStr(this.GetE()));
      wroteAttribute = true;
    }
    if (this.HasF()) {
      element.append_attribute('f').set_value(this.HarppedalpositionToStr(this.GetF()));
      wroteAttribute = true;
    }
    if (this.HasG()) {
      element.append_attribute('g').set_value(this.HarppedalpositionToStr(this.GetG()));
      wroteAttribute = true;
    }
    if (this.HasA()) {
      element.append_attribute('a').set_value(this.HarppedalpositionToStr(this.GetA()));
      wroteAttribute = true;
    }
    if (this.HasB()) {
      element.append_attribute('b').set_value(this.HarppedalpositionToStr(this.GetB()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetC(value: any): void { this.m_c = value; }
  GetC(): any { return this.m_c; }
  HasC(): boolean { return this.m_c != HARPPEDALPOSITION_NONE; }
  SetD(value: any): void { this.m_d = value; }
  GetD(): any { return this.m_d; }
  HasD(): boolean { return this.m_d != HARPPEDALPOSITION_NONE; }
  SetE(value: any): void { this.m_e = value; }
  GetE(): any { return this.m_e; }
  HasE(): boolean { return this.m_e != HARPPEDALPOSITION_NONE; }
  SetF(value: any): void { this.m_f = value; }
  GetF(): any { return this.m_f; }
  HasF(): boolean { return this.m_f != HARPPEDALPOSITION_NONE; }
  SetG(value: any): void { this.m_g = value; }
  GetG(): any { return this.m_g; }
  HasG(): boolean { return this.m_g != HARPPEDALPOSITION_NONE; }
  SetA(value: any): void { this.m_a = value; }
  GetA(): any { return this.m_a; }
  HasA(): boolean { return this.m_a != HARPPEDALPOSITION_NONE; }
  SetB(value: any): void { this.m_b = value; }
  GetB(): any { return this.m_b; }
  HasB(): boolean { return this.m_b != HARPPEDALPOSITION_NONE; }
}

export class InstHarpPedalLog extends AttHarpPedalLog {}

export abstract class AttLvPresent extends Att {
  protected m_lv: any = BOOLEAN_NONE;
  constructor() { super(); this.ResetLvPresent(); }
  ResetLvPresent(): void {
    this.m_lv = BOOLEAN_NONE;
  }
  ReadLvPresent(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('lv').empty()) {
      this.SetLv(this.StrToBoolean(element.attribute('lv').value()));
      if (removeAttr) element.remove_attribute('lv');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteLvPresent(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLv()) {
      element.append_attribute('lv').set_value(this.BooleanToStr(this.GetLv()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetLv(value: any): void { this.m_lv = value; }
  GetLv(): any { return this.m_lv; }
  HasLv(): boolean { return this.m_lv != BOOLEAN_NONE; }
}

export class InstLvPresent extends AttLvPresent {}

export abstract class AttMeasureLog extends Att {
  protected m_left: any = BARRENDITION_NONE;
  protected m_right: any = BARRENDITION_NONE;
  constructor() { super(); this.ResetMeasureLog(); }
  ResetMeasureLog(): void {
    this.m_left = BARRENDITION_NONE;
    this.m_right = BARRENDITION_NONE;
  }
  ReadMeasureLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('left').empty()) {
      this.SetLeft(this.StrToBarrendition(element.attribute('left').value()));
      if (removeAttr) element.remove_attribute('left');
      hasAttribute = true;
    }
    if (!element.attribute('right').empty()) {
      this.SetRight(this.StrToBarrendition(element.attribute('right').value()));
      if (removeAttr) element.remove_attribute('right');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteMeasureLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLeft()) {
      element.append_attribute('left').set_value(this.BarrenditionToStr(this.GetLeft()));
      wroteAttribute = true;
    }
    if (this.HasRight()) {
      element.append_attribute('right').set_value(this.BarrenditionToStr(this.GetRight()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetLeft(value: any): void { this.m_left = value; }
  GetLeft(): any { return this.m_left; }
  HasLeft(): boolean { return this.m_left != BARRENDITION_NONE; }
  SetRight(value: any): void { this.m_right = value; }
  GetRight(): any { return this.m_right; }
  HasRight(): boolean { return this.m_right != BARRENDITION_NONE; }
}

export class InstMeasureLog extends AttMeasureLog {}

export abstract class AttMeterSigGrpLog extends Att {
  protected m_func: any = meterSigGrpLog_FUNC_NONE;
  constructor() { super(); this.ResetMeterSigGrpLog(); }
  ResetMeterSigGrpLog(): void {
    this.m_func = meterSigGrpLog_FUNC_NONE;
  }
  ReadMeterSigGrpLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('func').empty()) {
      this.SetFunc(this.StrToMeterSigGrpLogFunc(element.attribute('func').value()));
      if (removeAttr) element.remove_attribute('func');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteMeterSigGrpLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasFunc()) {
      element.append_attribute('func').set_value(this.MeterSigGrpLogFuncToStr(this.GetFunc()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetFunc(value: any): void { this.m_func = value; }
  GetFunc(): any { return this.m_func; }
  HasFunc(): boolean { return this.m_func != meterSigGrpLog_FUNC_NONE; }
}

export class InstMeterSigGrpLog extends AttMeterSigGrpLog {}

export abstract class AttNumberPlacement extends Att {
  protected m_numPlace: any = STAFFREL_basic_NONE;
  protected m_numVisible: any = BOOLEAN_NONE;
  constructor() { super(); this.ResetNumberPlacement(); }
  ResetNumberPlacement(): void {
    this.m_numPlace = STAFFREL_basic_NONE;
    this.m_numVisible = BOOLEAN_NONE;
  }
  ReadNumberPlacement(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('num.place').empty()) {
      this.SetNumPlace(this.StrToStaffrelBasic(element.attribute('num.place').value()));
      if (removeAttr) element.remove_attribute('num.place');
      hasAttribute = true;
    }
    if (!element.attribute('num.visible').empty()) {
      this.SetNumVisible(this.StrToBoolean(element.attribute('num.visible').value()));
      if (removeAttr) element.remove_attribute('num.visible');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteNumberPlacement(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasNumPlace()) {
      element.append_attribute('num.place').set_value(this.StaffrelBasicToStr(this.GetNumPlace()));
      wroteAttribute = true;
    }
    if (this.HasNumVisible()) {
      element.append_attribute('num.visible').set_value(this.BooleanToStr(this.GetNumVisible()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetNumPlace(value: any): void { this.m_numPlace = value; }
  GetNumPlace(): any { return this.m_numPlace; }
  HasNumPlace(): boolean { return this.m_numPlace != STAFFREL_basic_NONE; }
  SetNumVisible(value: any): void { this.m_numVisible = value; }
  GetNumVisible(): any { return this.m_numVisible; }
  HasNumVisible(): boolean { return this.m_numVisible != BOOLEAN_NONE; }
}

export class InstNumberPlacement extends AttNumberPlacement {}

export abstract class AttNumbered extends Att {
  protected m_num: any = MEI_UNSET;
  constructor() { super(); this.ResetNumbered(); }
  ResetNumbered(): void {
    this.m_num = MEI_UNSET;
  }
  ReadNumbered(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('num').empty()) {
      this.SetNum(this.StrToInt(element.attribute('num').value()));
      if (removeAttr) element.remove_attribute('num');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteNumbered(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasNum()) {
      element.append_attribute('num').set_value(this.IntToStr(this.GetNum()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetNum(value: number): void { this.m_num = value; }
  GetNum(): number { return this.m_num; }
  HasNum(): boolean { return this.m_num != MEI_UNSET; }
}

export class InstNumbered extends AttNumbered {}

export abstract class AttOctaveLog extends Att {
  protected m_coll: any = octaveLog_COLL_NONE;
  constructor() { super(); this.ResetOctaveLog(); }
  ResetOctaveLog(): void {
    this.m_coll = octaveLog_COLL_NONE;
  }
  ReadOctaveLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('coll').empty()) {
      this.SetColl(this.StrToOctaveLogColl(element.attribute('coll').value()));
      if (removeAttr) element.remove_attribute('coll');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteOctaveLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasColl()) {
      element.append_attribute('coll').set_value(this.OctaveLogCollToStr(this.GetColl()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetColl(value: any): void { this.m_coll = value; }
  GetColl(): any { return this.m_coll; }
  HasColl(): boolean { return this.m_coll != octaveLog_COLL_NONE; }
}

export class InstOctaveLog extends AttOctaveLog {}

export abstract class AttPedalLog extends Att {
  protected m_dir: any = pedalLog_DIR_NONE;
  protected m_func: any = "";
  constructor() { super(); this.ResetPedalLog(); }
  ResetPedalLog(): void {
    this.m_dir = pedalLog_DIR_NONE;
    this.m_func = "";
  }
  ReadPedalLog(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('dir').empty()) {
      this.SetDir(this.StrToPedalLogDir(element.attribute('dir').value()));
      if (removeAttr) element.remove_attribute('dir');
      hasAttribute = true;
    }
    if (!element.attribute('func').empty()) {
      this.SetFunc(this.StrToStr(element.attribute('func').value()));
      if (removeAttr) element.remove_attribute('func');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WritePedalLog(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDir()) {
      element.append_attribute('dir').set_value(this.PedalLogDirToStr(this.GetDir()));
      wroteAttribute = true;
    }
    if (this.HasFunc()) {
      element.append_attribute('func').set_value(this.StrToStr(this.GetFunc()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetDir(value: any): void { this.m_dir = value; }
  GetDir(): any { return this.m_dir; }
  HasDir(): boolean { return this.m_dir != pedalLog_DIR_NONE; }
  SetFunc(value: string): void { this.m_func = value; }
  GetFunc(): string { return this.m_func; }
  HasFunc(): boolean { return this.m_func != ""; }
}

export class InstPedalLog extends AttPedalLog {}

export abstract class AttPianoPedals extends Att {
  protected m_pedalStyle: any = PEDALSTYLE_NONE;
  constructor() { super(); this.ResetPianoPedals(); }
  ResetPianoPedals(): void {
    this.m_pedalStyle = PEDALSTYLE_NONE;
  }
  ReadPianoPedals(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('pedal.style').empty()) {
      this.SetPedalStyle(this.StrToPedalstyle(element.attribute('pedal.style').value()));
      if (removeAttr) element.remove_attribute('pedal.style');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WritePianoPedals(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasPedalStyle()) {
      element.append_attribute('pedal.style').set_value(this.PedalstyleToStr(this.GetPedalStyle()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetPedalStyle(value: any): void { this.m_pedalStyle = value; }
  GetPedalStyle(): any { return this.m_pedalStyle; }
  HasPedalStyle(): boolean { return this.m_pedalStyle != PEDALSTYLE_NONE; }
}

export class InstPianoPedals extends AttPianoPedals {}

export abstract class AttRehearsal extends Att {
  protected m_rehEnclose: any = rehearsal_REHENCLOSE_NONE;
  constructor() { super(); this.ResetRehearsal(); }
  ResetRehearsal(): void {
    this.m_rehEnclose = rehearsal_REHENCLOSE_NONE;
  }
  ReadRehearsal(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('reh.enclose').empty()) {
      this.SetRehEnclose(this.StrToRehearsalRehenclose(element.attribute('reh.enclose').value()));
      if (removeAttr) element.remove_attribute('reh.enclose');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteRehearsal(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasRehEnclose()) {
      element.append_attribute('reh.enclose').set_value(this.RehearsalRehencloseToStr(this.GetRehEnclose()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetRehEnclose(value: any): void { this.m_rehEnclose = value; }
  GetRehEnclose(): any { return this.m_rehEnclose; }
  HasRehEnclose(): boolean { return this.m_rehEnclose != rehearsal_REHENCLOSE_NONE; }
}

export class InstRehearsal extends AttRehearsal {}

export abstract class AttSlurRend extends Att {
  protected m_slurLform: any = LINEFORM_NONE;
  protected m_slurLwidth: any = undefined as any;
  constructor() { super(); this.ResetSlurRend(); }
  ResetSlurRend(): void {
    this.m_slurLform = LINEFORM_NONE;
    this.m_slurLwidth = undefined as any;
  }
  ReadSlurRend(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('slur.lform').empty()) {
      this.SetSlurLform(this.StrToLineform(element.attribute('slur.lform').value()));
      if (removeAttr) element.remove_attribute('slur.lform');
      hasAttribute = true;
    }
    if (!element.attribute('slur.lwidth').empty()) {
      this.SetSlurLwidth(this.StrToLinewidth(element.attribute('slur.lwidth').value()));
      if (removeAttr) element.remove_attribute('slur.lwidth');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteSlurRend(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSlurLform()) {
      element.append_attribute('slur.lform').set_value(this.LineformToStr(this.GetSlurLform()));
      wroteAttribute = true;
    }
    if (this.HasSlurLwidth()) {
      element.append_attribute('slur.lwidth').set_value(this.LinewidthToStr(this.GetSlurLwidth()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetSlurLform(value: any): void { this.m_slurLform = value; }
  GetSlurLform(): any { return this.m_slurLform; }
  HasSlurLform(): boolean { return this.m_slurLform != LINEFORM_NONE; }
  SetSlurLwidth(value: any): void { this.m_slurLwidth = value; }
  GetSlurLwidth(): any { return this.m_slurLwidth; }
  HasSlurLwidth(): boolean { return this.m_slurLwidth.HasValue(); }
}

export class InstSlurRend extends AttSlurRend {}

export abstract class AttStemsCmn extends Att {
  protected m_stemWith: any = NEIGHBORINGLAYER_NONE;
  constructor() { super(); this.ResetStemsCmn(); }
  ResetStemsCmn(): void {
    this.m_stemWith = NEIGHBORINGLAYER_NONE;
  }
  ReadStemsCmn(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('stem.with').empty()) {
      this.SetStemWith(this.StrToNeighboringlayer(element.attribute('stem.with').value()));
      if (removeAttr) element.remove_attribute('stem.with');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteStemsCmn(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasStemWith()) {
      element.append_attribute('stem.with').set_value(this.NeighboringlayerToStr(this.GetStemWith()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetStemWith(value: any): void { this.m_stemWith = value; }
  GetStemWith(): any { return this.m_stemWith; }
  HasStemWith(): boolean { return this.m_stemWith != NEIGHBORINGLAYER_NONE; }
}

export class InstStemsCmn extends AttStemsCmn {}

export abstract class AttTieRend extends Att {
  protected m_tieLform: any = LINEFORM_NONE;
  protected m_tieLwidth: any = undefined as any;
  constructor() { super(); this.ResetTieRend(); }
  ResetTieRend(): void {
    this.m_tieLform = LINEFORM_NONE;
    this.m_tieLwidth = undefined as any;
  }
  ReadTieRend(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('tie.lform').empty()) {
      this.SetTieLform(this.StrToLineform(element.attribute('tie.lform').value()));
      if (removeAttr) element.remove_attribute('tie.lform');
      hasAttribute = true;
    }
    if (!element.attribute('tie.lwidth').empty()) {
      this.SetTieLwidth(this.StrToLinewidth(element.attribute('tie.lwidth').value()));
      if (removeAttr) element.remove_attribute('tie.lwidth');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteTieRend(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasTieLform()) {
      element.append_attribute('tie.lform').set_value(this.LineformToStr(this.GetTieLform()));
      wroteAttribute = true;
    }
    if (this.HasTieLwidth()) {
      element.append_attribute('tie.lwidth').set_value(this.LinewidthToStr(this.GetTieLwidth()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetTieLform(value: any): void { this.m_tieLform = value; }
  GetTieLform(): any { return this.m_tieLform; }
  HasTieLform(): boolean { return this.m_tieLform != LINEFORM_NONE; }
  SetTieLwidth(value: any): void { this.m_tieLwidth = value; }
  GetTieLwidth(): any { return this.m_tieLwidth; }
  HasTieLwidth(): boolean { return this.m_tieLwidth.HasValue(); }
}

export class InstTieRend extends AttTieRend {}

export abstract class AttTremForm extends Att {
  protected m_form: any = tremForm_FORM_NONE;
  constructor() { super(); this.ResetTremForm(); }
  ResetTremForm(): void {
    this.m_form = tremForm_FORM_NONE;
  }
  ReadTremForm(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('form').empty()) {
      this.SetForm(this.StrToTremFormForm(element.attribute('form').value()));
      if (removeAttr) element.remove_attribute('form');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteTremForm(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) {
      element.append_attribute('form').set_value(this.TremFormFormToStr(this.GetForm()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetForm(value: any): void { this.m_form = value; }
  GetForm(): any { return this.m_form; }
  HasForm(): boolean { return this.m_form != tremForm_FORM_NONE; }
}

export class InstTremForm extends AttTremForm {}

export abstract class AttTremMeasured extends Att {
  protected m_unitdur: any = DURATION_NONE;
  constructor() { super(); this.ResetTremMeasured(); }
  ResetTremMeasured(): void {
    this.m_unitdur = DURATION_NONE;
  }
  ReadTremMeasured(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;
    if (!element.attribute('unitdur').empty()) {
      this.SetUnitdur(this.StrToDuration(element.attribute('unitdur').value()));
      if (removeAttr) element.remove_attribute('unitdur');
      hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteTremMeasured(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasUnitdur()) {
      element.append_attribute('unitdur').set_value(this.DurationToStr(this.GetUnitdur()));
      wroteAttribute = true;
    }
    return wroteAttribute;
  }
  SetUnitdur(value: any): void { this.m_unitdur = value; }
  GetUnitdur(): any { return this.m_unitdur; }
  HasUnitdur(): boolean { return this.m_unitdur != DURATION_NONE; }
}

export class InstTremMeasured extends AttTremMeasured {}

