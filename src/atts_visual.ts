/** Pure TypeScript translation of libmei/dist/atts_visual.cpp. */

import { Att } from './att';
import { xml_node } from './pugixml';
import { MEI_UNSET } from './vrv';
import { data_FONTSIZE, data_LINEWIDTH, data_MEASUREMENTSIGNED, data_PLACEMENT } from './libmei-att';

export type beamingVis_BEAMREND = number;
export type char = number;
export type curvatureDirection_CURVE = number;
export type data_BARMETHOD = number;
export type data_BEATRPT_REND = number;
export type data_BOOLEAN = number;
export type data_CANCELACCID = number;
export type data_CLUSTER = number;
export type data_COMPASSDIRECTION = number;
export type data_EVENTREL = number;
export type data_FLAGFORM_mensural = number;
export type data_FLAGPOS_mensural = number;
export type data_LAYERSCHEME = number;
export type data_LIGATUREFORM = number;
export type data_LINEFORM = number;
export type data_LINESTARTENDSYMBOL = number;
export type data_MENSURATIONSIGN = number;
export type data_METERFORM = number;
export type data_ORIENTATION = number;
export type data_PEDALSTYLE = number;
export type data_STAFFREL_basic = number;
export type data_STEMDIRECTION = number;
export type data_STEMDIRECTION_basic = number;
export type data_STEMFORM_mensural = number;
export type data_STEMPOSITION = number;
export type episemaVis_FORM = number;
export type fermataVis_FORM = number;
export type fermataVis_SHAPE = number;
export type fingGrpVis_ORIENT = number;
export type harmVis_RENDGRID = number;
export type mensurVis_FORM = number;
export type mensuralVis_MENSURFORM = number;
export type pbVis_FOLIUM = number;
export type sbVis_FORM = number;
export type tupletVis_NUMFORMAT = number;

export const BARMETHOD_NONE = 0;
export const BEATRPT_REND_NONE = 0;
export const BOOLEAN_NONE = 0;
export const CANCELACCID_NONE = 0;
export const CLUSTER_NONE = 0;
export const FLAGFORM_mensural_NONE = 0;
export const FLAGPOS_mensural_NONE = 0;
export const LAYERSCHEME_NONE = 0;
export const LIGATUREFORM_NONE = 0;
export const LINEFORM_NONE = 0;
export const LINESTARTENDSYMBOL_NONE = 0;
export const MENSURATIONSIGN_NONE = 0;
export const METERFORM_NONE = 0;
export const ORIENTATION_NONE = 0;
export const PEDALSTYLE_NONE = 0;
export const STAFFREL_basic_NONE = 0;
export const STEMDIRECTION_NONE = 0;
export const STEMDIRECTION_basic_NONE = 0;
export const STEMFORM_mensural_NONE = 0;
export const STEMPOSITION_NONE = 0;
export const beamingVis_BEAMREND_NONE = 0;
export const curvatureDirection_CURVE_NONE = 0;
export const episemaVis_FORM_NONE = 0;
export const fermataVis_FORM_NONE = 0;
export const fermataVis_SHAPE_NONE = 0;
export const fingGrpVis_ORIENT_NONE = 0;
export const harmVis_RENDGRID_NONE = 0;
export const mensurVis_FORM_NONE = 0;
export const mensuralVis_MENSURFORM_NONE = 0;
export const pbVis_FOLIUM_NONE = 0;
export const sbVis_FORM_NONE = 0;
export const tupletVis_NUMFORMAT_NONE = 0;

export abstract class AttAnnotVis extends Att {
  protected m_place: data_PLACEMENT = new data_PLACEMENT();
  constructor() { super(); this.ResetAnnotVis(); }
  ResetAnnotVis(): void {
    this.m_place = new data_PLACEMENT();
  }
  ReadAnnotVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("place").empty()) {
    this.SetPlace(this.StrToPlacement(element.attribute("place").value()));
    if (removeAttr) element.remove_attribute("place");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteAnnotVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasPlace()) {
    element.append_attribute("place").set_value(this.PlacementToStr(this.GetPlace()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasPlace(): boolean {
    return (this.m_place.HasValue());
  }
  SetPlace(place_: data_PLACEMENT): void { this.m_place = place_; }
  GetPlace(): data_PLACEMENT { return this.m_place; }
}
export class InstAnnotVis extends AttAnnotVis {}

export abstract class AttArpegVis extends Att {
  protected m_arrow: number = BOOLEAN_NONE;
  protected m_arrowShape: number = LINESTARTENDSYMBOL_NONE;
  protected m_arrowSize: number = MEI_UNSET;
  protected m_arrowColor: string = "";
  protected m_arrowFillcolor: string = "";
  constructor() { super(); this.ResetArpegVis(); }
  ResetArpegVis(): void {
    this.m_arrow = BOOLEAN_NONE;
    this.m_arrowShape = LINESTARTENDSYMBOL_NONE;
    this.m_arrowSize = MEI_UNSET;
    this.m_arrowColor = "";
    this.m_arrowFillcolor = "";
  }
  ReadArpegVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("arrow").empty()) {
    this.SetArrow(this.StrToBoolean(element.attribute("arrow").value()));
    if (removeAttr) element.remove_attribute("arrow");
    hasAttribute = true;
    }
    if (!element.attribute("arrow.shape").empty()) {
    this.SetArrowShape(this.StrToLinestartendsymbol(element.attribute("arrow.shape").value()));
    if (removeAttr) element.remove_attribute("arrow.shape");
    hasAttribute = true;
    }
    if (!element.attribute("arrow.size").empty()) {
    this.SetArrowSize(this.StrToInt(element.attribute("arrow.size").value()));
    if (removeAttr) element.remove_attribute("arrow.size");
    hasAttribute = true;
    }
    if (!element.attribute("arrow.color").empty()) {
    this.SetArrowColor(this.StrToStr(element.attribute("arrow.color").value()));
    if (removeAttr) element.remove_attribute("arrow.color");
    hasAttribute = true;
    }
    if (!element.attribute("arrow.fillcolor").empty()) {
    this.SetArrowFillcolor(this.StrToStr(element.attribute("arrow.fillcolor").value()));
    if (removeAttr) element.remove_attribute("arrow.fillcolor");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteArpegVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasArrow()) {
    element.append_attribute("arrow").set_value(this.BooleanToStr(this.GetArrow()));
    wroteAttribute = true;
    }
    if (this.HasArrowShape()) {
    element.append_attribute("arrow.shape").set_value(this.LinestartendsymbolToStr(this.GetArrowShape()));
    wroteAttribute = true;
    }
    if (this.HasArrowSize()) {
    element.append_attribute("arrow.size").set_value(this.IntToStr(this.GetArrowSize()));
    wroteAttribute = true;
    }
    if (this.HasArrowColor()) {
    element.append_attribute("arrow.color").set_value(this.StrToStr(this.GetArrowColor()));
    wroteAttribute = true;
    }
    if (this.HasArrowFillcolor()) {
    element.append_attribute("arrow.fillcolor").set_value(this.StrToStr(this.GetArrowFillcolor()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasArrow(): boolean {
    return (this.m_arrow != BOOLEAN_NONE);
  }
  HasArrowShape(): boolean {
    return (this.m_arrowShape != LINESTARTENDSYMBOL_NONE);
  }
  HasArrowSize(): boolean {
    return (this.m_arrowSize != MEI_UNSET);
  }
  HasArrowColor(): boolean {
    return (this.m_arrowColor != "");
  }
  HasArrowFillcolor(): boolean {
    return (this.m_arrowFillcolor != "");
  }
  SetArrow(arrow_: number): void { this.m_arrow = arrow_; }
  GetArrow(): number { return this.m_arrow; }
  SetArrowShape(arrowShape_: number): void { this.m_arrowShape = arrowShape_; }
  GetArrowShape(): number { return this.m_arrowShape; }
  SetArrowSize(arrowSize_: number): void { this.m_arrowSize = arrowSize_; }
  GetArrowSize(): number { return this.m_arrowSize; }
  SetArrowColor(arrowColor_: string): void { this.m_arrowColor = arrowColor_; }
  GetArrowColor(): string { return this.m_arrowColor; }
  SetArrowFillcolor(arrowFillcolor_: string): void { this.m_arrowFillcolor = arrowFillcolor_; }
  GetArrowFillcolor(): string { return this.m_arrowFillcolor; }
}
export class InstArpegVis extends AttArpegVis {}

export abstract class AttBarLineVis extends Att {
  protected m_len: number = 0.0;
  protected m_method: number = BARMETHOD_NONE;
  protected m_place: number = MEI_UNSET;
  constructor() { super(); this.ResetBarLineVis(); }
  ResetBarLineVis(): void {
    this.m_len = 0.0;
    this.m_method = BARMETHOD_NONE;
    this.m_place = MEI_UNSET;
  }
  ReadBarLineVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("len").empty()) {
    this.SetLen(this.StrToDbl(element.attribute("len").value()));
    if (removeAttr) element.remove_attribute("len");
    hasAttribute = true;
    }
    if (!element.attribute("method").empty()) {
    this.SetMethod(this.StrToBarmethod(element.attribute("method").value()));
    if (removeAttr) element.remove_attribute("method");
    hasAttribute = true;
    }
    if (!element.attribute("place").empty()) {
    this.SetPlace(this.StrToInt(element.attribute("place").value()));
    if (removeAttr) element.remove_attribute("place");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteBarLineVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLen()) {
    element.append_attribute("len").set_value(this.DblToStr(this.GetLen()));
    wroteAttribute = true;
    }
    if (this.HasMethod()) {
    element.append_attribute("method").set_value(this.BarmethodToStr(this.GetMethod()));
    wroteAttribute = true;
    }
    if (this.HasPlace()) {
    element.append_attribute("place").set_value(this.IntToStr(this.GetPlace()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasLen(): boolean {
    return (this.m_len != 0.0);
  }
  HasMethod(): boolean {
    return (this.m_method != BARMETHOD_NONE);
  }
  HasPlace(): boolean {
    return (this.m_place != MEI_UNSET);
  }
  SetLen(len_: number): void { this.m_len = len_; }
  GetLen(): number { return this.m_len; }
  SetMethod(method_: number): void { this.m_method = method_; }
  GetMethod(): number { return this.m_method; }
  SetPlace(place_: number): void { this.m_place = place_; }
  GetPlace(): number { return this.m_place; }
}
export class InstBarLineVis extends AttBarLineVis {}

export abstract class AttBeamingVis extends Att {
  protected m_beamColor: string = "";
  protected m_beamRend: number = beamingVis_BEAMREND_NONE;
  protected m_beamSlope: number = 0.0;
  constructor() { super(); this.ResetBeamingVis(); }
  ResetBeamingVis(): void {
    this.m_beamColor = "";
    this.m_beamRend = beamingVis_BEAMREND_NONE;
    this.m_beamSlope = 0.0;
  }
  ReadBeamingVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("beam.color").empty()) {
    this.SetBeamColor(this.StrToStr(element.attribute("beam.color").value()));
    if (removeAttr) element.remove_attribute("beam.color");
    hasAttribute = true;
    }
    if (!element.attribute("beam.rend").empty()) {
    this.SetBeamRend(this.StrToBeamingVisBeamrend(element.attribute("beam.rend").value()));
    if (removeAttr) element.remove_attribute("beam.rend");
    hasAttribute = true;
    }
    if (!element.attribute("beam.slope").empty()) {
    this.SetBeamSlope(this.StrToDbl(element.attribute("beam.slope").value()));
    if (removeAttr) element.remove_attribute("beam.slope");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteBeamingVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasBeamColor()) {
    element.append_attribute("beam.color").set_value(this.StrToStr(this.GetBeamColor()));
    wroteAttribute = true;
    }
    if (this.HasBeamRend()) {
    element.append_attribute("beam.rend").set_value(this.BeamingVisBeamrendToStr(this.GetBeamRend()));
    wroteAttribute = true;
    }
    if (this.HasBeamSlope()) {
    element.append_attribute("beam.slope").set_value(this.DblToStr(this.GetBeamSlope()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasBeamColor(): boolean {
    return (this.m_beamColor != "");
  }
  HasBeamRend(): boolean {
    return (this.m_beamRend != beamingVis_BEAMREND_NONE);
  }
  HasBeamSlope(): boolean {
    return (this.m_beamSlope != 0.0);
  }
  SetBeamColor(beamColor_: string): void { this.m_beamColor = beamColor_; }
  GetBeamColor(): string { return this.m_beamColor; }
  SetBeamRend(beamRend_: number): void { this.m_beamRend = beamRend_; }
  GetBeamRend(): number { return this.m_beamRend; }
  SetBeamSlope(beamSlope_: number): void { this.m_beamSlope = beamSlope_; }
  GetBeamSlope(): number { return this.m_beamSlope; }
}
export class InstBeamingVis extends AttBeamingVis {}

export abstract class AttBeatRptVis extends Att {
  protected m_slash: number = BEATRPT_REND_NONE;
  constructor() { super(); this.ResetBeatRptVis(); }
  ResetBeatRptVis(): void {
    this.m_slash = BEATRPT_REND_NONE;
  }
  ReadBeatRptVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("slash").empty()) {
    this.SetSlash(this.StrToBeatrptRend(element.attribute("slash").value()));
    if (removeAttr) element.remove_attribute("slash");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteBeatRptVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasSlash()) {
    element.append_attribute("slash").set_value(this.BeatrptRendToStr(this.GetSlash()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasSlash(): boolean {
    return (this.m_slash != BEATRPT_REND_NONE);
  }
  SetSlash(slash_: number): void { this.m_slash = slash_; }
  GetSlash(): number { return this.m_slash; }
}
export class InstBeatRptVis extends AttBeatRptVis {}

export abstract class AttChordVis extends Att {
  protected m_cluster: number = CLUSTER_NONE;
  constructor() { super(); this.ResetChordVis(); }
  ResetChordVis(): void {
    this.m_cluster = CLUSTER_NONE;
  }
  ReadChordVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("cluster").empty()) {
    this.SetCluster(this.StrToCluster(element.attribute("cluster").value()));
    if (removeAttr) element.remove_attribute("cluster");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteChordVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCluster()) {
    element.append_attribute("cluster").set_value(this.ClusterToStr(this.GetCluster()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasCluster(): boolean {
    return (this.m_cluster != CLUSTER_NONE);
  }
  SetCluster(cluster_: number): void { this.m_cluster = cluster_; }
  GetCluster(): number { return this.m_cluster; }
}
export class InstChordVis extends AttChordVis {}

export abstract class AttCleffingVis extends Att {
  protected m_clefColor: string = "";
  protected m_clefVisible: number = BOOLEAN_NONE;
  constructor() { super(); this.ResetCleffingVis(); }
  ResetCleffingVis(): void {
    this.m_clefColor = "";
    this.m_clefVisible = BOOLEAN_NONE;
  }
  ReadCleffingVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("clef.color").empty()) {
    this.SetClefColor(this.StrToStr(element.attribute("clef.color").value()));
    if (removeAttr) element.remove_attribute("clef.color");
    hasAttribute = true;
    }
    if (!element.attribute("clef.visible").empty()) {
    this.SetClefVisible(this.StrToBoolean(element.attribute("clef.visible").value()));
    if (removeAttr) element.remove_attribute("clef.visible");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteCleffingVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasClefColor()) {
    element.append_attribute("clef.color").set_value(this.StrToStr(this.GetClefColor()));
    wroteAttribute = true;
    }
    if (this.HasClefVisible()) {
    element.append_attribute("clef.visible").set_value(this.BooleanToStr(this.GetClefVisible()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasClefColor(): boolean {
    return (this.m_clefColor != "");
  }
  HasClefVisible(): boolean {
    return (this.m_clefVisible != BOOLEAN_NONE);
  }
  SetClefColor(clefColor_: string): void { this.m_clefColor = clefColor_; }
  GetClefColor(): string { return this.m_clefColor; }
  SetClefVisible(clefVisible_: number): void { this.m_clefVisible = clefVisible_; }
  GetClefVisible(): number { return this.m_clefVisible; }
}
export class InstCleffingVis extends AttCleffingVis {}

export abstract class AttCurvatureDirection extends Att {
  protected m_curve: number = curvatureDirection_CURVE_NONE;
  constructor() { super(); this.ResetCurvatureDirection(); }
  ResetCurvatureDirection(): void {
    this.m_curve = curvatureDirection_CURVE_NONE;
  }
  ReadCurvatureDirection(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("curve").empty()) {
    this.SetCurve(this.StrToCurvatureDirectionCurve(element.attribute("curve").value()));
    if (removeAttr) element.remove_attribute("curve");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteCurvatureDirection(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCurve()) {
    element.append_attribute("curve").set_value(this.CurvatureDirectionCurveToStr(this.GetCurve()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasCurve(): boolean {
    return (this.m_curve != curvatureDirection_CURVE_NONE);
  }
  SetCurve(curve_: number): void { this.m_curve = curve_; }
  GetCurve(): number { return this.m_curve; }
}
export class InstCurvatureDirection extends AttCurvatureDirection {}

export abstract class AttEpisemaVis extends Att {
  protected m_form: number = episemaVis_FORM_NONE;
  protected m_place: number = 0;
  constructor() { super(); this.ResetEpisemaVis(); }
  ResetEpisemaVis(): void {
    this.m_form = episemaVis_FORM_NONE;
    this.m_place = 0;
  }
  ReadEpisemaVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("form").empty()) {
    this.SetForm(this.StrToEpisemaVisForm(element.attribute("form").value()));
    if (removeAttr) element.remove_attribute("form");
    hasAttribute = true;
    }
    if (!element.attribute("place").empty()) {
    this.SetPlace(this.StrToEventrel(element.attribute("place").value()));
    if (removeAttr) element.remove_attribute("place");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteEpisemaVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) {
    element.append_attribute("form").set_value(this.EpisemaVisFormToStr(this.GetForm()));
    wroteAttribute = true;
    }
    if (this.HasPlace()) {
    element.append_attribute("place").set_value(this.EventrelToStr(this.GetPlace()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasForm(): boolean {
    return (this.m_form != episemaVis_FORM_NONE);
  }
  HasPlace(): boolean {
    return (this.m_place != 0);
  }
  SetForm(form_: number): void { this.m_form = form_; }
  GetForm(): number { return this.m_form; }
  SetPlace(place_: number): void { this.m_place = place_; }
  GetPlace(): number { return this.m_place; }
}
export class InstEpisemaVis extends AttEpisemaVis {}

export abstract class AttFTremVis extends Att {
  protected m_beams: number = MEI_UNSET;
  protected m_beamsFloat: number = MEI_UNSET;
  protected m_floatGap: data_MEASUREMENTSIGNED = new data_MEASUREMENTSIGNED();
  constructor() { super(); this.ResetFTremVis(); }
  ResetFTremVis(): void {
    this.m_beams = MEI_UNSET;
    this.m_beamsFloat = MEI_UNSET;
    this.m_floatGap = new data_MEASUREMENTSIGNED();
  }
  ReadFTremVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("beams").empty()) {
    this.SetBeams(this.StrToInt(element.attribute("beams").value()));
    if (removeAttr) element.remove_attribute("beams");
    hasAttribute = true;
    }
    if (!element.attribute("beams.float").empty()) {
    this.SetBeamsFloat(this.StrToInt(element.attribute("beams.float").value()));
    if (removeAttr) element.remove_attribute("beams.float");
    hasAttribute = true;
    }
    if (!element.attribute("float.gap").empty()) {
    this.SetFloatGap(this.StrToMeasurementunsigned(element.attribute("float.gap").value()));
    if (removeAttr) element.remove_attribute("float.gap");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteFTremVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasBeams()) {
    element.append_attribute("beams").set_value(this.IntToStr(this.GetBeams()));
    wroteAttribute = true;
    }
    if (this.HasBeamsFloat()) {
    element.append_attribute("beams.float").set_value(this.IntToStr(this.GetBeamsFloat()));
    wroteAttribute = true;
    }
    if (this.HasFloatGap()) {
    element.append_attribute("float.gap").set_value(this.MeasurementunsignedToStr(this.GetFloatGap()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasBeams(): boolean {
    return (this.m_beams != MEI_UNSET);
  }
  HasBeamsFloat(): boolean {
    return (this.m_beamsFloat != MEI_UNSET);
  }
  HasFloatGap(): boolean {
    return (this.m_floatGap.HasValue());
  }
  SetBeams(beams_: number): void { this.m_beams = beams_; }
  GetBeams(): number { return this.m_beams; }
  SetBeamsFloat(beamsFloat_: number): void { this.m_beamsFloat = beamsFloat_; }
  GetBeamsFloat(): number { return this.m_beamsFloat; }
  SetFloatGap(floatGap_: data_MEASUREMENTSIGNED): void { this.m_floatGap = floatGap_; }
  GetFloatGap(): data_MEASUREMENTSIGNED { return this.m_floatGap; }
}
export class InstFTremVis extends AttFTremVis {}

export abstract class AttFermataVis extends Att {
  protected m_form: number = fermataVis_FORM_NONE;
  protected m_shape: number = fermataVis_SHAPE_NONE;
  constructor() { super(); this.ResetFermataVis(); }
  ResetFermataVis(): void {
    this.m_form = fermataVis_FORM_NONE;
    this.m_shape = fermataVis_SHAPE_NONE;
  }
  ReadFermataVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("form").empty()) {
    this.SetForm(this.StrToFermataVisForm(element.attribute("form").value()));
    if (removeAttr) element.remove_attribute("form");
    hasAttribute = true;
    }
    if (!element.attribute("shape").empty()) {
    this.SetShape(this.StrToFermataVisShape(element.attribute("shape").value()));
    if (removeAttr) element.remove_attribute("shape");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteFermataVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) {
    element.append_attribute("form").set_value(this.FermataVisFormToStr(this.GetForm()));
    wroteAttribute = true;
    }
    if (this.HasShape()) {
    element.append_attribute("shape").set_value(this.FermataVisShapeToStr(this.GetShape()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasForm(): boolean {
    return (this.m_form != fermataVis_FORM_NONE);
  }
  HasShape(): boolean {
    return (this.m_shape != fermataVis_SHAPE_NONE);
  }
  SetForm(form_: number): void { this.m_form = form_; }
  GetForm(): number { return this.m_form; }
  SetShape(shape_: number): void { this.m_shape = shape_; }
  GetShape(): number { return this.m_shape; }
}
export class InstFermataVis extends AttFermataVis {}

export abstract class AttFingGrpVis extends Att {
  protected m_orient: number = fingGrpVis_ORIENT_NONE;
  constructor() { super(); this.ResetFingGrpVis(); }
  ResetFingGrpVis(): void {
    this.m_orient = fingGrpVis_ORIENT_NONE;
  }
  ReadFingGrpVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("orient").empty()) {
    this.SetOrient(this.StrToFingGrpVisOrient(element.attribute("orient").value()));
    if (removeAttr) element.remove_attribute("orient");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteFingGrpVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOrient()) {
    element.append_attribute("orient").set_value(this.FingGrpVisOrientToStr(this.GetOrient()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasOrient(): boolean {
    return (this.m_orient != fingGrpVis_ORIENT_NONE);
  }
  SetOrient(orient_: number): void { this.m_orient = orient_; }
  GetOrient(): number { return this.m_orient; }
}
export class InstFingGrpVis extends AttFingGrpVis {}

export abstract class AttGuitarGridVis extends Att {
  protected m_gridShow: number = BOOLEAN_NONE;
  constructor() { super(); this.ResetGuitarGridVis(); }
  ResetGuitarGridVis(): void {
    this.m_gridShow = BOOLEAN_NONE;
  }
  ReadGuitarGridVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("grid.show").empty()) {
    this.SetGridShow(this.StrToBoolean(element.attribute("grid.show").value()));
    if (removeAttr) element.remove_attribute("grid.show");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteGuitarGridVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasGridShow()) {
    element.append_attribute("grid.show").set_value(this.BooleanToStr(this.GetGridShow()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasGridShow(): boolean {
    return (this.m_gridShow != BOOLEAN_NONE);
  }
  SetGridShow(gridShow_: number): void { this.m_gridShow = gridShow_; }
  GetGridShow(): number { return this.m_gridShow; }
}
export class InstGuitarGridVis extends AttGuitarGridVis {}

export abstract class AttHairpinVis extends Att {
  protected m_opening: data_MEASUREMENTSIGNED = new data_MEASUREMENTSIGNED();
  protected m_closed: number = BOOLEAN_NONE;
  protected m_openingVertical: number = BOOLEAN_NONE;
  protected m_angleOptimize: number = BOOLEAN_NONE;
  constructor() { super(); this.ResetHairpinVis(); }
  ResetHairpinVis(): void {
    this.m_opening = new data_MEASUREMENTSIGNED();
    this.m_closed = BOOLEAN_NONE;
    this.m_openingVertical = BOOLEAN_NONE;
    this.m_angleOptimize = BOOLEAN_NONE;
  }
  ReadHairpinVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("opening").empty()) {
    this.SetOpening(this.StrToMeasurementunsigned(element.attribute("opening").value()));
    if (removeAttr) element.remove_attribute("opening");
    hasAttribute = true;
    }
    if (!element.attribute("closed").empty()) {
    this.SetClosed(this.StrToBoolean(element.attribute("closed").value()));
    if (removeAttr) element.remove_attribute("closed");
    hasAttribute = true;
    }
    if (!element.attribute("opening.vertical").empty()) {
    this.SetOpeningVertical(this.StrToBoolean(element.attribute("opening.vertical").value()));
    if (removeAttr) element.remove_attribute("opening.vertical");
    hasAttribute = true;
    }
    if (!element.attribute("angle.optimize").empty()) {
    this.SetAngleOptimize(this.StrToBoolean(element.attribute("angle.optimize").value()));
    if (removeAttr) element.remove_attribute("angle.optimize");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteHairpinVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasOpening()) {
    element.append_attribute("opening").set_value(this.MeasurementunsignedToStr(this.GetOpening()));
    wroteAttribute = true;
    }
    if (this.HasClosed()) {
    element.append_attribute("closed").set_value(this.BooleanToStr(this.GetClosed()));
    wroteAttribute = true;
    }
    if (this.HasOpeningVertical()) {
    element.append_attribute("opening.vertical").set_value(this.BooleanToStr(this.GetOpeningVertical()));
    wroteAttribute = true;
    }
    if (this.HasAngleOptimize()) {
    element.append_attribute("angle.optimize").set_value(this.BooleanToStr(this.GetAngleOptimize()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasOpening(): boolean {
    return (this.m_opening.HasValue());
  }
  HasClosed(): boolean {
    return (this.m_closed != BOOLEAN_NONE);
  }
  HasOpeningVertical(): boolean {
    return (this.m_openingVertical != BOOLEAN_NONE);
  }
  HasAngleOptimize(): boolean {
    return (this.m_angleOptimize != BOOLEAN_NONE);
  }
  SetOpening(opening_: data_MEASUREMENTSIGNED): void { this.m_opening = opening_; }
  GetOpening(): data_MEASUREMENTSIGNED { return this.m_opening; }
  SetClosed(closed_: number): void { this.m_closed = closed_; }
  GetClosed(): number { return this.m_closed; }
  SetOpeningVertical(openingVertical_: number): void { this.m_openingVertical = openingVertical_; }
  GetOpeningVertical(): number { return this.m_openingVertical; }
  SetAngleOptimize(angleOptimize_: number): void { this.m_angleOptimize = angleOptimize_; }
  GetAngleOptimize(): number { return this.m_angleOptimize; }
}
export class InstHairpinVis extends AttHairpinVis {}

export abstract class AttHarmVis extends Att {
  protected m_rendgrid: number = harmVis_RENDGRID_NONE;
  constructor() { super(); this.ResetHarmVis(); }
  ResetHarmVis(): void {
    this.m_rendgrid = harmVis_RENDGRID_NONE;
  }
  ReadHarmVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("rendgrid").empty()) {
    this.SetRendgrid(this.StrToHarmVisRendgrid(element.attribute("rendgrid").value()));
    if (removeAttr) element.remove_attribute("rendgrid");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteHarmVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasRendgrid()) {
    element.append_attribute("rendgrid").set_value(this.HarmVisRendgridToStr(this.GetRendgrid()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasRendgrid(): boolean {
    return (this.m_rendgrid != harmVis_RENDGRID_NONE);
  }
  SetRendgrid(rendgrid_: number): void { this.m_rendgrid = rendgrid_; }
  GetRendgrid(): number { return this.m_rendgrid; }
}
export class InstHarmVis extends AttHarmVis {}

export abstract class AttHispanTickVis extends Att {
  protected m_place: number = 0;
  protected m_tilt: number = 0;
  constructor() { super(); this.ResetHispanTickVis(); }
  ResetHispanTickVis(): void {
    this.m_place = 0;
    this.m_tilt = 0;
  }
  ReadHispanTickVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("place").empty()) {
    this.SetPlace(this.StrToEventrel(element.attribute("place").value()));
    if (removeAttr) element.remove_attribute("place");
    hasAttribute = true;
    }
    if (!element.attribute("tilt").empty()) {
    this.SetTilt(this.StrToCompassdirection(element.attribute("tilt").value()));
    if (removeAttr) element.remove_attribute("tilt");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteHispanTickVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasPlace()) {
    element.append_attribute("place").set_value(this.EventrelToStr(this.GetPlace()));
    wroteAttribute = true;
    }
    if (this.HasTilt()) {
    element.append_attribute("tilt").set_value(this.CompassdirectionToStr(this.GetTilt()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasPlace(): boolean {
    return (this.m_place != 0);
  }
  HasTilt(): boolean {
    return (this.m_tilt != 0);
  }
  SetPlace(place_: number): void { this.m_place = place_; }
  GetPlace(): number { return this.m_place; }
  SetTilt(tilt_: number): void { this.m_tilt = tilt_; }
  GetTilt(): number { return this.m_tilt; }
}
export class InstHispanTickVis extends AttHispanTickVis {}

export abstract class AttKeySigVis extends Att {
  protected m_cancelaccid: number = CANCELACCID_NONE;
  constructor() { super(); this.ResetKeySigVis(); }
  ResetKeySigVis(): void {
    this.m_cancelaccid = CANCELACCID_NONE;
  }
  ReadKeySigVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("cancelaccid").empty()) {
    this.SetCancelaccid(this.StrToCancelaccid(element.attribute("cancelaccid").value()));
    if (removeAttr) element.remove_attribute("cancelaccid");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteKeySigVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCancelaccid()) {
    element.append_attribute("cancelaccid").set_value(this.CancelaccidToStr(this.GetCancelaccid()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasCancelaccid(): boolean {
    return (this.m_cancelaccid != CANCELACCID_NONE);
  }
  SetCancelaccid(cancelaccid_: number): void { this.m_cancelaccid = cancelaccid_; }
  GetCancelaccid(): number { return this.m_cancelaccid; }
}
export class InstKeySigVis extends AttKeySigVis {}

export abstract class AttKeySigDefaultVis extends Att {
  protected m_keysigCancelaccid: number = CANCELACCID_NONE;
  protected m_keysigVisible: number = BOOLEAN_NONE;
  constructor() { super(); this.ResetKeySigDefaultVis(); }
  ResetKeySigDefaultVis(): void {
    this.m_keysigCancelaccid = CANCELACCID_NONE;
    this.m_keysigVisible = BOOLEAN_NONE;
  }
  ReadKeySigDefaultVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("keysig.cancelaccid").empty()) {
    this.SetKeysigCancelaccid(this.StrToCancelaccid(element.attribute("keysig.cancelaccid").value()));
    if (removeAttr) element.remove_attribute("keysig.cancelaccid");
    hasAttribute = true;
    }
    if (!element.attribute("keysig.visible").empty()) {
    this.SetKeysigVisible(this.StrToBoolean(element.attribute("keysig.visible").value()));
    if (removeAttr) element.remove_attribute("keysig.visible");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteKeySigDefaultVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasKeysigCancelaccid()) {
    element.append_attribute("keysig.cancelaccid").set_value(this.CancelaccidToStr(this.GetKeysigCancelaccid()));
    wroteAttribute = true;
    }
    if (this.HasKeysigVisible()) {
    element.append_attribute("keysig.visible").set_value(this.BooleanToStr(this.GetKeysigVisible()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasKeysigCancelaccid(): boolean {
    return (this.m_keysigCancelaccid != CANCELACCID_NONE);
  }
  HasKeysigVisible(): boolean {
    return (this.m_keysigVisible != BOOLEAN_NONE);
  }
  SetKeysigCancelaccid(keysigCancelaccid_: number): void { this.m_keysigCancelaccid = keysigCancelaccid_; }
  GetKeysigCancelaccid(): number { return this.m_keysigCancelaccid; }
  SetKeysigVisible(keysigVisible_: number): void { this.m_keysigVisible = keysigVisible_; }
  GetKeysigVisible(): number { return this.m_keysigVisible; }
}
export class InstKeySigDefaultVis extends AttKeySigDefaultVis {}

export abstract class AttLigatureVis extends Att {
  protected m_form: number = LIGATUREFORM_NONE;
  constructor() { super(); this.ResetLigatureVis(); }
  ResetLigatureVis(): void {
    this.m_form = LIGATUREFORM_NONE;
  }
  ReadLigatureVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("form").empty()) {
    this.SetForm(this.StrToLigatureform(element.attribute("form").value()));
    if (removeAttr) element.remove_attribute("form");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteLigatureVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) {
    element.append_attribute("form").set_value(this.LigatureformToStr(this.GetForm()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasForm(): boolean {
    return (this.m_form != LIGATUREFORM_NONE);
  }
  SetForm(form_: number): void { this.m_form = form_; }
  GetForm(): number { return this.m_form; }
}
export class InstLigatureVis extends AttLigatureVis {}

export abstract class AttLineVis extends Att {
  protected m_form: number = LINEFORM_NONE;
  protected m_width: data_LINEWIDTH = new data_LINEWIDTH();
  protected m_endsym: number = LINESTARTENDSYMBOL_NONE;
  protected m_endsymSize: number = MEI_UNSET;
  protected m_startsym: number = LINESTARTENDSYMBOL_NONE;
  protected m_startsymSize: number = MEI_UNSET;
  constructor() { super(); this.ResetLineVis(); }
  ResetLineVis(): void {
    this.m_form = LINEFORM_NONE;
    this.m_width = new data_LINEWIDTH();
    this.m_endsym = LINESTARTENDSYMBOL_NONE;
    this.m_endsymSize = MEI_UNSET;
    this.m_startsym = LINESTARTENDSYMBOL_NONE;
    this.m_startsymSize = MEI_UNSET;
  }
  ReadLineVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("form").empty()) {
    this.SetForm(this.StrToLineform(element.attribute("form").value()));
    if (removeAttr) element.remove_attribute("form");
    hasAttribute = true;
    }
    if (!element.attribute("width").empty()) {
    this.SetWidth(this.StrToLinewidth(element.attribute("width").value()));
    if (removeAttr) element.remove_attribute("width");
    hasAttribute = true;
    }
    if (!element.attribute("endsym").empty()) {
    this.SetEndsym(this.StrToLinestartendsymbol(element.attribute("endsym").value()));
    if (removeAttr) element.remove_attribute("endsym");
    hasAttribute = true;
    }
    if (!element.attribute("endsym.size").empty()) {
    this.SetEndsymSize(this.StrToInt(element.attribute("endsym.size").value()));
    if (removeAttr) element.remove_attribute("endsym.size");
    hasAttribute = true;
    }
    if (!element.attribute("startsym").empty()) {
    this.SetStartsym(this.StrToLinestartendsymbol(element.attribute("startsym").value()));
    if (removeAttr) element.remove_attribute("startsym");
    hasAttribute = true;
    }
    if (!element.attribute("startsym.size").empty()) {
    this.SetStartsymSize(this.StrToInt(element.attribute("startsym.size").value()));
    if (removeAttr) element.remove_attribute("startsym.size");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteLineVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) {
    element.append_attribute("form").set_value(this.LineformToStr(this.GetForm()));
    wroteAttribute = true;
    }
    if (this.HasWidth()) {
    element.append_attribute("width").set_value(this.LinewidthToStr(this.GetWidth()));
    wroteAttribute = true;
    }
    if (this.HasEndsym()) {
    element.append_attribute("endsym").set_value(this.LinestartendsymbolToStr(this.GetEndsym()));
    wroteAttribute = true;
    }
    if (this.HasEndsymSize()) {
    element.append_attribute("endsym.size").set_value(this.IntToStr(this.GetEndsymSize()));
    wroteAttribute = true;
    }
    if (this.HasStartsym()) {
    element.append_attribute("startsym").set_value(this.LinestartendsymbolToStr(this.GetStartsym()));
    wroteAttribute = true;
    }
    if (this.HasStartsymSize()) {
    element.append_attribute("startsym.size").set_value(this.IntToStr(this.GetStartsymSize()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasForm(): boolean {
    return (this.m_form != LINEFORM_NONE);
  }
  HasWidth(): boolean {
    return (this.m_width.HasValue());
  }
  HasEndsym(): boolean {
    return (this.m_endsym != LINESTARTENDSYMBOL_NONE);
  }
  HasEndsymSize(): boolean {
    return (this.m_endsymSize != MEI_UNSET);
  }
  HasStartsym(): boolean {
    return (this.m_startsym != LINESTARTENDSYMBOL_NONE);
  }
  HasStartsymSize(): boolean {
    return (this.m_startsymSize != MEI_UNSET);
  }
  SetForm(form_: number): void { this.m_form = form_; }
  GetForm(): number { return this.m_form; }
  SetWidth(width_: data_LINEWIDTH): void { this.m_width = width_; }
  GetWidth(): data_LINEWIDTH { return this.m_width; }
  SetEndsym(endsym_: number): void { this.m_endsym = endsym_; }
  GetEndsym(): number { return this.m_endsym; }
  SetEndsymSize(endsymSize_: number): void { this.m_endsymSize = endsymSize_; }
  GetEndsymSize(): number { return this.m_endsymSize; }
  SetStartsym(startsym_: number): void { this.m_startsym = startsym_; }
  GetStartsym(): number { return this.m_startsym; }
  SetStartsymSize(startsymSize_: number): void { this.m_startsymSize = startsymSize_; }
  GetStartsymSize(): number { return this.m_startsymSize; }
}
export class InstLineVis extends AttLineVis {}

export abstract class AttLiquescentVis extends Att {
  protected m_looped: number = BOOLEAN_NONE;
  constructor() { super(); this.ResetLiquescentVis(); }
  ResetLiquescentVis(): void {
    this.m_looped = BOOLEAN_NONE;
  }
  ReadLiquescentVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("looped").empty()) {
    this.SetLooped(this.StrToBoolean(element.attribute("looped").value()));
    if (removeAttr) element.remove_attribute("looped");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteLiquescentVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLooped()) {
    element.append_attribute("looped").set_value(this.BooleanToStr(this.GetLooped()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasLooped(): boolean {
    return (this.m_looped != BOOLEAN_NONE);
  }
  SetLooped(looped_: number): void { this.m_looped = looped_; }
  GetLooped(): number { return this.m_looped; }
}
export class InstLiquescentVis extends AttLiquescentVis {}

export abstract class AttMensurVis extends Att {
  protected m_dot: number = BOOLEAN_NONE;
  protected m_form: number = mensurVis_FORM_NONE;
  protected m_orient: number = ORIENTATION_NONE;
  protected m_sign: number = MENSURATIONSIGN_NONE;
  constructor() { super(); this.ResetMensurVis(); }
  ResetMensurVis(): void {
    this.m_dot = BOOLEAN_NONE;
    this.m_form = mensurVis_FORM_NONE;
    this.m_orient = ORIENTATION_NONE;
    this.m_sign = MENSURATIONSIGN_NONE;
  }
  ReadMensurVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("dot").empty()) {
    this.SetDot(this.StrToBoolean(element.attribute("dot").value()));
    if (removeAttr) element.remove_attribute("dot");
    hasAttribute = true;
    }
    if (!element.attribute("form").empty()) {
    this.SetForm(this.StrToMensurVisForm(element.attribute("form").value()));
    if (removeAttr) element.remove_attribute("form");
    hasAttribute = true;
    }
    if (!element.attribute("orient").empty()) {
    this.SetOrient(this.StrToOrientation(element.attribute("orient").value()));
    if (removeAttr) element.remove_attribute("orient");
    hasAttribute = true;
    }
    if (!element.attribute("sign").empty()) {
    this.SetSign(this.StrToMensurationsign(element.attribute("sign").value()));
    if (removeAttr) element.remove_attribute("sign");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteMensurVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDot()) {
    element.append_attribute("dot").set_value(this.BooleanToStr(this.GetDot()));
    wroteAttribute = true;
    }
    if (this.HasForm()) {
    element.append_attribute("form").set_value(this.MensurVisFormToStr(this.GetForm()));
    wroteAttribute = true;
    }
    if (this.HasOrient()) {
    element.append_attribute("orient").set_value(this.OrientationToStr(this.GetOrient()));
    wroteAttribute = true;
    }
    if (this.HasSign()) {
    element.append_attribute("sign").set_value(this.MensurationsignToStr(this.GetSign()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasDot(): boolean {
    return (this.m_dot != BOOLEAN_NONE);
  }
  HasForm(): boolean {
    return (this.m_form != mensurVis_FORM_NONE);
  }
  HasOrient(): boolean {
    return (this.m_orient != ORIENTATION_NONE);
  }
  HasSign(): boolean {
    return (this.m_sign != MENSURATIONSIGN_NONE);
  }
  SetDot(dot_: number): void { this.m_dot = dot_; }
  GetDot(): number { return this.m_dot; }
  SetForm(form_: number): void { this.m_form = form_; }
  GetForm(): number { return this.m_form; }
  SetOrient(orient_: number): void { this.m_orient = orient_; }
  GetOrient(): number { return this.m_orient; }
  SetSign(sign_: number): void { this.m_sign = sign_; }
  GetSign(): number { return this.m_sign; }
}
export class InstMensurVis extends AttMensurVis {}

export abstract class AttMensuralVis extends Att {
  protected m_mensurColor: string = "";
  protected m_mensurDot: number = BOOLEAN_NONE;
  protected m_mensurForm: number = mensuralVis_MENSURFORM_NONE;
  protected m_mensurLoc: number = MEI_UNSET;
  protected m_mensurOrient: number = ORIENTATION_NONE;
  protected m_mensurSign: number = MENSURATIONSIGN_NONE;
  protected m_mensurSize: data_FONTSIZE = new data_FONTSIZE();
  protected m_mensurSlash: number = 0;
  constructor() { super(); this.ResetMensuralVis(); }
  ResetMensuralVis(): void {
    this.m_mensurColor = "";
    this.m_mensurDot = BOOLEAN_NONE;
    this.m_mensurForm = mensuralVis_MENSURFORM_NONE;
    this.m_mensurLoc = MEI_UNSET;
    this.m_mensurOrient = ORIENTATION_NONE;
    this.m_mensurSign = MENSURATIONSIGN_NONE;
    this.m_mensurSize = new data_FONTSIZE();
    this.m_mensurSlash = 0;
  }
  ReadMensuralVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("mensur.color").empty()) {
    this.SetMensurColor(this.StrToStr(element.attribute("mensur.color").value()));
    if (removeAttr) element.remove_attribute("mensur.color");
    hasAttribute = true;
    }
    if (!element.attribute("mensur.dot").empty()) {
    this.SetMensurDot(this.StrToBoolean(element.attribute("mensur.dot").value()));
    if (removeAttr) element.remove_attribute("mensur.dot");
    hasAttribute = true;
    }
    if (!element.attribute("mensur.form").empty()) {
    this.SetMensurForm(this.StrToMensuralVisMensurform(element.attribute("mensur.form").value()));
    if (removeAttr) element.remove_attribute("mensur.form");
    hasAttribute = true;
    }
    if (!element.attribute("mensur.loc").empty()) {
    this.SetMensurLoc(this.StrToInt(element.attribute("mensur.loc").value()));
    if (removeAttr) element.remove_attribute("mensur.loc");
    hasAttribute = true;
    }
    if (!element.attribute("mensur.orient").empty()) {
    this.SetMensurOrient(this.StrToOrientation(element.attribute("mensur.orient").value()));
    if (removeAttr) element.remove_attribute("mensur.orient");
    hasAttribute = true;
    }
    if (!element.attribute("mensur.sign").empty()) {
    this.SetMensurSign(this.StrToMensurationsign(element.attribute("mensur.sign").value()));
    if (removeAttr) element.remove_attribute("mensur.sign");
    hasAttribute = true;
    }
    if (!element.attribute("mensur.size").empty()) {
    this.SetMensurSize(this.StrToFontsize(element.attribute("mensur.size").value()));
    if (removeAttr) element.remove_attribute("mensur.size");
    hasAttribute = true;
    }
    if (!element.attribute("mensur.slash").empty()) {
    this.SetMensurSlash(this.StrToInt(element.attribute("mensur.slash").value()));
    if (removeAttr) element.remove_attribute("mensur.slash");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteMensuralVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMensurColor()) {
    element.append_attribute("mensur.color").set_value(this.StrToStr(this.GetMensurColor()));
    wroteAttribute = true;
    }
    if (this.HasMensurDot()) {
    element.append_attribute("mensur.dot").set_value(this.BooleanToStr(this.GetMensurDot()));
    wroteAttribute = true;
    }
    if (this.HasMensurForm()) {
    element.append_attribute("mensur.form").set_value(this.MensuralVisMensurformToStr(this.GetMensurForm()));
    wroteAttribute = true;
    }
    if (this.HasMensurLoc()) {
    element.append_attribute("mensur.loc").set_value(this.IntToStr(this.GetMensurLoc()));
    wroteAttribute = true;
    }
    if (this.HasMensurOrient()) {
    element.append_attribute("mensur.orient").set_value(this.OrientationToStr(this.GetMensurOrient()));
    wroteAttribute = true;
    }
    if (this.HasMensurSign()) {
    element.append_attribute("mensur.sign").set_value(this.MensurationsignToStr(this.GetMensurSign()));
    wroteAttribute = true;
    }
    if (this.HasMensurSize()) {
    element.append_attribute("mensur.size").set_value(this.FontsizeToStr(this.GetMensurSize()));
    wroteAttribute = true;
    }
    if (this.HasMensurSlash()) {
    element.append_attribute("mensur.slash").set_value(this.IntToStr(this.GetMensurSlash()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasMensurColor(): boolean {
    return (this.m_mensurColor != "");
  }
  HasMensurDot(): boolean {
    return (this.m_mensurDot != BOOLEAN_NONE);
  }
  HasMensurForm(): boolean {
    return (this.m_mensurForm != mensuralVis_MENSURFORM_NONE);
  }
  HasMensurLoc(): boolean {
    return (this.m_mensurLoc != MEI_UNSET);
  }
  HasMensurOrient(): boolean {
    return (this.m_mensurOrient != ORIENTATION_NONE);
  }
  HasMensurSign(): boolean {
    return (this.m_mensurSign != MENSURATIONSIGN_NONE);
  }
  HasMensurSize(): boolean {
    return (this.m_mensurSize.HasValue());
  }
  HasMensurSlash(): boolean {
    return (this.m_mensurSlash != 0);
  }
  SetMensurColor(mensurColor_: string): void { this.m_mensurColor = mensurColor_; }
  GetMensurColor(): string { return this.m_mensurColor; }
  SetMensurDot(mensurDot_: number): void { this.m_mensurDot = mensurDot_; }
  GetMensurDot(): number { return this.m_mensurDot; }
  SetMensurForm(mensurForm_: number): void { this.m_mensurForm = mensurForm_; }
  GetMensurForm(): number { return this.m_mensurForm; }
  SetMensurLoc(mensurLoc_: number): void { this.m_mensurLoc = mensurLoc_; }
  GetMensurLoc(): number { return this.m_mensurLoc; }
  SetMensurOrient(mensurOrient_: number): void { this.m_mensurOrient = mensurOrient_; }
  GetMensurOrient(): number { return this.m_mensurOrient; }
  SetMensurSign(mensurSign_: number): void { this.m_mensurSign = mensurSign_; }
  GetMensurSign(): number { return this.m_mensurSign; }
  SetMensurSize(mensurSize_: data_FONTSIZE): void { this.m_mensurSize = mensurSize_; }
  GetMensurSize(): data_FONTSIZE { return this.m_mensurSize; }
  SetMensurSlash(mensurSlash_: number): void { this.m_mensurSlash = mensurSlash_; }
  GetMensurSlash(): number { return this.m_mensurSlash; }
}
export class InstMensuralVis extends AttMensuralVis {}

export abstract class AttMeterSigVis extends Att {
  protected m_form: number = METERFORM_NONE;
  constructor() { super(); this.ResetMeterSigVis(); }
  ResetMeterSigVis(): void {
    this.m_form = METERFORM_NONE;
  }
  ReadMeterSigVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("form").empty()) {
    this.SetForm(this.StrToMeterform(element.attribute("form").value()));
    if (removeAttr) element.remove_attribute("form");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteMeterSigVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) {
    element.append_attribute("form").set_value(this.MeterformToStr(this.GetForm()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasForm(): boolean {
    return (this.m_form != METERFORM_NONE);
  }
  SetForm(form_: number): void { this.m_form = form_; }
  GetForm(): number { return this.m_form; }
}
export class InstMeterSigVis extends AttMeterSigVis {}

export abstract class AttMeterSigDefaultVis extends Att {
  protected m_meterForm: number = METERFORM_NONE;
  protected m_meterShowchange: number = BOOLEAN_NONE;
  protected m_meterVisible: number = BOOLEAN_NONE;
  constructor() { super(); this.ResetMeterSigDefaultVis(); }
  ResetMeterSigDefaultVis(): void {
    this.m_meterForm = METERFORM_NONE;
    this.m_meterShowchange = BOOLEAN_NONE;
    this.m_meterVisible = BOOLEAN_NONE;
  }
  ReadMeterSigDefaultVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("meter.form").empty()) {
    this.SetMeterForm(this.StrToMeterform(element.attribute("meter.form").value()));
    if (removeAttr) element.remove_attribute("meter.form");
    hasAttribute = true;
    }
    if (!element.attribute("meter.showchange").empty()) {
    this.SetMeterShowchange(this.StrToBoolean(element.attribute("meter.showchange").value()));
    if (removeAttr) element.remove_attribute("meter.showchange");
    hasAttribute = true;
    }
    if (!element.attribute("meter.visible").empty()) {
    this.SetMeterVisible(this.StrToBoolean(element.attribute("meter.visible").value()));
    if (removeAttr) element.remove_attribute("meter.visible");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteMeterSigDefaultVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasMeterForm()) {
    element.append_attribute("meter.form").set_value(this.MeterformToStr(this.GetMeterForm()));
    wroteAttribute = true;
    }
    if (this.HasMeterShowchange()) {
    element.append_attribute("meter.showchange").set_value(this.BooleanToStr(this.GetMeterShowchange()));
    wroteAttribute = true;
    }
    if (this.HasMeterVisible()) {
    element.append_attribute("meter.visible").set_value(this.BooleanToStr(this.GetMeterVisible()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasMeterForm(): boolean {
    return (this.m_meterForm != METERFORM_NONE);
  }
  HasMeterShowchange(): boolean {
    return (this.m_meterShowchange != BOOLEAN_NONE);
  }
  HasMeterVisible(): boolean {
    return (this.m_meterVisible != BOOLEAN_NONE);
  }
  SetMeterForm(meterForm_: number): void { this.m_meterForm = meterForm_; }
  GetMeterForm(): number { return this.m_meterForm; }
  SetMeterShowchange(meterShowchange_: number): void { this.m_meterShowchange = meterShowchange_; }
  GetMeterShowchange(): number { return this.m_meterShowchange; }
  SetMeterVisible(meterVisible_: number): void { this.m_meterVisible = meterVisible_; }
  GetMeterVisible(): number { return this.m_meterVisible; }
}
export class InstMeterSigDefaultVis extends AttMeterSigDefaultVis {}

export abstract class AttMultiRestVis extends Att {
  protected m_block: number = BOOLEAN_NONE;
  constructor() { super(); this.ResetMultiRestVis(); }
  ResetMultiRestVis(): void {
    this.m_block = BOOLEAN_NONE;
  }
  ReadMultiRestVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("block").empty()) {
    this.SetBlock(this.StrToBoolean(element.attribute("block").value()));
    if (removeAttr) element.remove_attribute("block");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteMultiRestVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasBlock()) {
    element.append_attribute("block").set_value(this.BooleanToStr(this.GetBlock()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasBlock(): boolean {
    return (this.m_block != BOOLEAN_NONE);
  }
  SetBlock(block_: number): void { this.m_block = block_; }
  GetBlock(): number { return this.m_block; }
}
export class InstMultiRestVis extends AttMultiRestVis {}

export abstract class AttPbVis extends Att {
  protected m_folium: number = pbVis_FOLIUM_NONE;
  constructor() { super(); this.ResetPbVis(); }
  ResetPbVis(): void {
    this.m_folium = pbVis_FOLIUM_NONE;
  }
  ReadPbVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("folium").empty()) {
    this.SetFolium(this.StrToPbVisFolium(element.attribute("folium").value()));
    if (removeAttr) element.remove_attribute("folium");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WritePbVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasFolium()) {
    element.append_attribute("folium").set_value(this.PbVisFoliumToStr(this.GetFolium()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasFolium(): boolean {
    return (this.m_folium != pbVis_FOLIUM_NONE);
  }
  SetFolium(folium_: number): void { this.m_folium = folium_; }
  GetFolium(): number { return this.m_folium; }
}
export class InstPbVis extends AttPbVis {}

export abstract class AttPedalVis extends Att {
  protected m_form: number = PEDALSTYLE_NONE;
  constructor() { super(); this.ResetPedalVis(); }
  ResetPedalVis(): void {
    this.m_form = PEDALSTYLE_NONE;
  }
  ReadPedalVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("form").empty()) {
    this.SetForm(this.StrToPedalstyle(element.attribute("form").value()));
    if (removeAttr) element.remove_attribute("form");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WritePedalVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) {
    element.append_attribute("form").set_value(this.PedalstyleToStr(this.GetForm()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasForm(): boolean {
    return (this.m_form != PEDALSTYLE_NONE);
  }
  SetForm(form_: number): void { this.m_form = form_; }
  GetForm(): number { return this.m_form; }
}
export class InstPedalVis extends AttPedalVis {}

export abstract class AttPlicaVis extends Att {
  protected m_dir: number = STEMDIRECTION_basic_NONE;
  protected m_len: data_MEASUREMENTSIGNED = new data_MEASUREMENTSIGNED();
  constructor() { super(); this.ResetPlicaVis(); }
  ResetPlicaVis(): void {
    this.m_dir = STEMDIRECTION_basic_NONE;
    this.m_len = new data_MEASUREMENTSIGNED();
  }
  ReadPlicaVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("dir").empty()) {
    this.SetDir(this.StrToStemdirectionBasic(element.attribute("dir").value()));
    if (removeAttr) element.remove_attribute("dir");
    hasAttribute = true;
    }
    if (!element.attribute("len").empty()) {
    this.SetLen(this.StrToMeasurementunsigned(element.attribute("len").value()));
    if (removeAttr) element.remove_attribute("len");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WritePlicaVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasDir()) {
    element.append_attribute("dir").set_value(this.StemdirectionBasicToStr(this.GetDir()));
    wroteAttribute = true;
    }
    if (this.HasLen()) {
    element.append_attribute("len").set_value(this.MeasurementunsignedToStr(this.GetLen()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasDir(): boolean {
    return (this.m_dir != STEMDIRECTION_basic_NONE);
  }
  HasLen(): boolean {
    return (this.m_len.HasValue());
  }
  SetDir(dir_: number): void { this.m_dir = dir_; }
  GetDir(): number { return this.m_dir; }
  SetLen(len_: data_MEASUREMENTSIGNED): void { this.m_len = len_; }
  GetLen(): data_MEASUREMENTSIGNED { return this.m_len; }
}
export class InstPlicaVis extends AttPlicaVis {}

export abstract class AttQuilismaVis extends Att {
  protected m_waves: number = MEI_UNSET;
  constructor() { super(); this.ResetQuilismaVis(); }
  ResetQuilismaVis(): void {
    this.m_waves = MEI_UNSET;
  }
  ReadQuilismaVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("waves").empty()) {
    this.SetWaves(this.StrToInt(element.attribute("waves").value()));
    if (removeAttr) element.remove_attribute("waves");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteQuilismaVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasWaves()) {
    element.append_attribute("waves").set_value(this.IntToStr(this.GetWaves()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasWaves(): boolean {
    return (this.m_waves != MEI_UNSET);
  }
  SetWaves(waves_: number): void { this.m_waves = waves_; }
  GetWaves(): number { return this.m_waves; }
}
export class InstQuilismaVis extends AttQuilismaVis {}

export abstract class AttSbVis extends Att {
  protected m_form: number = sbVis_FORM_NONE;
  constructor() { super(); this.ResetSbVis(); }
  ResetSbVis(): void {
    this.m_form = sbVis_FORM_NONE;
  }
  ReadSbVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("form").empty()) {
    this.SetForm(this.StrToSbVisForm(element.attribute("form").value()));
    if (removeAttr) element.remove_attribute("form");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteSbVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasForm()) {
    element.append_attribute("form").set_value(this.SbVisFormToStr(this.GetForm()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasForm(): boolean {
    return (this.m_form != sbVis_FORM_NONE);
  }
  SetForm(form_: number): void { this.m_form = form_; }
  GetForm(): number { return this.m_form; }
}
export class InstSbVis extends AttSbVis {}

export abstract class AttScoreDefVis extends Att {
  protected m_vuHeight: string = "";
  constructor() { super(); this.ResetScoreDefVis(); }
  ResetScoreDefVis(): void {
    this.m_vuHeight = "";
  }
  ReadScoreDefVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("vu.height").empty()) {
    this.SetVuHeight(this.StrToStr(element.attribute("vu.height").value()));
    if (removeAttr) element.remove_attribute("vu.height");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteScoreDefVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasVuHeight()) {
    element.append_attribute("vu.height").set_value(this.StrToStr(this.GetVuHeight()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasVuHeight(): boolean {
    return (this.m_vuHeight != "");
  }
  SetVuHeight(vuHeight_: string): void { this.m_vuHeight = vuHeight_; }
  GetVuHeight(): string { return this.m_vuHeight; }
}
export class InstScoreDefVis extends AttScoreDefVis {}

export abstract class AttSectionVis extends Att {
  protected m_restart: number = BOOLEAN_NONE;
  constructor() { super(); this.ResetSectionVis(); }
  ResetSectionVis(): void {
    this.m_restart = BOOLEAN_NONE;
  }
  ReadSectionVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("restart").empty()) {
    this.SetRestart(this.StrToBoolean(element.attribute("restart").value()));
    if (removeAttr) element.remove_attribute("restart");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteSectionVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasRestart()) {
    element.append_attribute("restart").set_value(this.BooleanToStr(this.GetRestart()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasRestart(): boolean {
    return (this.m_restart != BOOLEAN_NONE);
  }
  SetRestart(restart_: number): void { this.m_restart = restart_; }
  GetRestart(): number { return this.m_restart; }
}
export class InstSectionVis extends AttSectionVis {}

export abstract class AttSignifLetVis extends Att {
  protected m_place: number = 0;
  constructor() { super(); this.ResetSignifLetVis(); }
  ResetSignifLetVis(): void {
    this.m_place = 0;
  }
  ReadSignifLetVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("place").empty()) {
    this.SetPlace(this.StrToEventrel(element.attribute("place").value()));
    if (removeAttr) element.remove_attribute("place");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteSignifLetVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasPlace()) {
    element.append_attribute("place").set_value(this.EventrelToStr(this.GetPlace()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasPlace(): boolean {
    return (this.m_place != 0);
  }
  SetPlace(place_: number): void { this.m_place = place_; }
  GetPlace(): number { return this.m_place; }
}
export class InstSignifLetVis extends AttSignifLetVis {}

export abstract class AttSpaceVis extends Att {
  protected m_compressable: number = BOOLEAN_NONE;
  constructor() { super(); this.ResetSpaceVis(); }
  ResetSpaceVis(): void {
    this.m_compressable = BOOLEAN_NONE;
  }
  ReadSpaceVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("compressable").empty()) {
    this.SetCompressable(this.StrToBoolean(element.attribute("compressable").value()));
    if (removeAttr) element.remove_attribute("compressable");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteSpaceVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasCompressable()) {
    element.append_attribute("compressable").set_value(this.BooleanToStr(this.GetCompressable()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasCompressable(): boolean {
    return (this.m_compressable != BOOLEAN_NONE);
  }
  SetCompressable(compressable_: number): void { this.m_compressable = compressable_; }
  GetCompressable(): number { return this.m_compressable; }
}
export class InstSpaceVis extends AttSpaceVis {}

export abstract class AttStaffDefVis extends Att {
  protected m_layerscheme: number = LAYERSCHEME_NONE;
  protected m_linesColor: string = "";
  protected m_linesVisible: number = BOOLEAN_NONE;
  protected m_spacing: data_MEASUREMENTSIGNED = new data_MEASUREMENTSIGNED();
  constructor() { super(); this.ResetStaffDefVis(); }
  ResetStaffDefVis(): void {
    this.m_layerscheme = LAYERSCHEME_NONE;
    this.m_linesColor = "";
    this.m_linesVisible = BOOLEAN_NONE;
    this.m_spacing = new data_MEASUREMENTSIGNED();
  }
  ReadStaffDefVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("layerscheme").empty()) {
    this.SetLayerscheme(this.StrToLayerscheme(element.attribute("layerscheme").value()));
    if (removeAttr) element.remove_attribute("layerscheme");
    hasAttribute = true;
    }
    if (!element.attribute("lines.color").empty()) {
    this.SetLinesColor(this.StrToStr(element.attribute("lines.color").value()));
    if (removeAttr) element.remove_attribute("lines.color");
    hasAttribute = true;
    }
    if (!element.attribute("lines.visible").empty()) {
    this.SetLinesVisible(this.StrToBoolean(element.attribute("lines.visible").value()));
    if (removeAttr) element.remove_attribute("lines.visible");
    hasAttribute = true;
    }
    if (!element.attribute("spacing").empty()) {
    this.SetSpacing(this.StrToMeasurementsigned(element.attribute("spacing").value()));
    if (removeAttr) element.remove_attribute("spacing");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteStaffDefVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasLayerscheme()) {
    element.append_attribute("layerscheme").set_value(this.LayerschemeToStr(this.GetLayerscheme()));
    wroteAttribute = true;
    }
    if (this.HasLinesColor()) {
    element.append_attribute("lines.color").set_value(this.StrToStr(this.GetLinesColor()));
    wroteAttribute = true;
    }
    if (this.HasLinesVisible()) {
    element.append_attribute("lines.visible").set_value(this.BooleanToStr(this.GetLinesVisible()));
    wroteAttribute = true;
    }
    if (this.HasSpacing()) {
    element.append_attribute("spacing").set_value(this.MeasurementsignedToStr(this.GetSpacing()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasLayerscheme(): boolean {
    return (this.m_layerscheme != LAYERSCHEME_NONE);
  }
  HasLinesColor(): boolean {
    return (this.m_linesColor != "");
  }
  HasLinesVisible(): boolean {
    return (this.m_linesVisible != BOOLEAN_NONE);
  }
  HasSpacing(): boolean {
    return (this.m_spacing.HasValue());
  }
  SetLayerscheme(layerscheme_: number): void { this.m_layerscheme = layerscheme_; }
  GetLayerscheme(): number { return this.m_layerscheme; }
  SetLinesColor(linesColor_: string): void { this.m_linesColor = linesColor_; }
  GetLinesColor(): string { return this.m_linesColor; }
  SetLinesVisible(linesVisible_: number): void { this.m_linesVisible = linesVisible_; }
  GetLinesVisible(): number { return this.m_linesVisible; }
  SetSpacing(spacing_: data_MEASUREMENTSIGNED): void { this.m_spacing = spacing_; }
  GetSpacing(): data_MEASUREMENTSIGNED { return this.m_spacing; }
}
export class InstStaffDefVis extends AttStaffDefVis {}

export abstract class AttStaffGrpVis extends Att {
  protected m_barThru: number = BOOLEAN_NONE;
  constructor() { super(); this.ResetStaffGrpVis(); }
  ResetStaffGrpVis(): void {
    this.m_barThru = BOOLEAN_NONE;
  }
  ReadStaffGrpVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("bar.thru").empty()) {
    this.SetBarThru(this.StrToBoolean(element.attribute("bar.thru").value()));
    if (removeAttr) element.remove_attribute("bar.thru");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteStaffGrpVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasBarThru()) {
    element.append_attribute("bar.thru").set_value(this.BooleanToStr(this.GetBarThru()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasBarThru(): boolean {
    return (this.m_barThru != BOOLEAN_NONE);
  }
  SetBarThru(barThru_: number): void { this.m_barThru = barThru_; }
  GetBarThru(): number { return this.m_barThru; }
}
export class InstStaffGrpVis extends AttStaffGrpVis {}

export abstract class AttStemVis extends Att {
  protected m_pos: number = STEMPOSITION_NONE;
  protected m_len: data_MEASUREMENTSIGNED = new data_MEASUREMENTSIGNED();
  protected m_form: number = STEMFORM_mensural_NONE;
  protected m_dir: number = STEMDIRECTION_NONE;
  protected m_flagPos: number = FLAGPOS_mensural_NONE;
  protected m_flagForm: number = FLAGFORM_mensural_NONE;
  constructor() { super(); this.ResetStemVis(); }
  ResetStemVis(): void {
    this.m_pos = STEMPOSITION_NONE;
    this.m_len = new data_MEASUREMENTSIGNED();
    this.m_form = STEMFORM_mensural_NONE;
    this.m_dir = STEMDIRECTION_NONE;
    this.m_flagPos = FLAGPOS_mensural_NONE;
    this.m_flagForm = FLAGFORM_mensural_NONE;
  }
  ReadStemVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("pos").empty()) {
    this.SetPos(this.StrToStemposition(element.attribute("pos").value()));
    if (removeAttr) element.remove_attribute("pos");
    hasAttribute = true;
    }
    if (!element.attribute("len").empty()) {
    this.SetLen(this.StrToMeasurementunsigned(element.attribute("len").value()));
    if (removeAttr) element.remove_attribute("len");
    hasAttribute = true;
    }
    if (!element.attribute("form").empty()) {
    this.SetForm(this.StrToStemformMensural(element.attribute("form").value()));
    if (removeAttr) element.remove_attribute("form");
    hasAttribute = true;
    }
    if (!element.attribute("dir").empty()) {
    this.SetDir(this.StrToStemdirection(element.attribute("dir").value()));
    if (removeAttr) element.remove_attribute("dir");
    hasAttribute = true;
    }
    if (!element.attribute("flag.pos").empty()) {
    this.SetFlagPos(this.StrToFlagposMensural(element.attribute("flag.pos").value()));
    if (removeAttr) element.remove_attribute("flag.pos");
    hasAttribute = true;
    }
    if (!element.attribute("flag.form").empty()) {
    this.SetFlagForm(this.StrToFlagformMensural(element.attribute("flag.form").value()));
    if (removeAttr) element.remove_attribute("flag.form");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteStemVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasPos()) {
    element.append_attribute("pos").set_value(this.StempositionToStr(this.GetPos()));
    wroteAttribute = true;
    }
    if (this.HasLen()) {
    element.append_attribute("len").set_value(this.MeasurementunsignedToStr(this.GetLen()));
    wroteAttribute = true;
    }
    if (this.HasForm()) {
    element.append_attribute("form").set_value(this.StemformMensuralToStr(this.GetForm()));
    wroteAttribute = true;
    }
    if (this.HasDir()) {
    element.append_attribute("dir").set_value(this.StemdirectionToStr(this.GetDir()));
    wroteAttribute = true;
    }
    if (this.HasFlagPos()) {
    element.append_attribute("flag.pos").set_value(this.FlagposMensuralToStr(this.GetFlagPos()));
    wroteAttribute = true;
    }
    if (this.HasFlagForm()) {
    element.append_attribute("flag.form").set_value(this.FlagformMensuralToStr(this.GetFlagForm()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasPos(): boolean {
    return (this.m_pos != STEMPOSITION_NONE);
  }
  HasLen(): boolean {
    return (this.m_len.HasValue());
  }
  HasForm(): boolean {
    return (this.m_form != STEMFORM_mensural_NONE);
  }
  HasDir(): boolean {
    return (this.m_dir != STEMDIRECTION_NONE);
  }
  HasFlagPos(): boolean {
    return (this.m_flagPos != FLAGPOS_mensural_NONE);
  }
  HasFlagForm(): boolean {
    return (this.m_flagForm != FLAGFORM_mensural_NONE);
  }
  SetPos(pos_: number): void { this.m_pos = pos_; }
  GetPos(): number { return this.m_pos; }
  SetLen(len_: data_MEASUREMENTSIGNED): void { this.m_len = len_; }
  GetLen(): data_MEASUREMENTSIGNED { return this.m_len; }
  SetForm(form_: number): void { this.m_form = form_; }
  GetForm(): number { return this.m_form; }
  SetDir(dir_: number): void { this.m_dir = dir_; }
  GetDir(): number { return this.m_dir; }
  SetFlagPos(flagPos_: number): void { this.m_flagPos = flagPos_; }
  GetFlagPos(): number { return this.m_flagPos; }
  SetFlagForm(flagForm_: number): void { this.m_flagForm = flagForm_; }
  GetFlagForm(): number { return this.m_flagForm; }
}
export class InstStemVis extends AttStemVis {}

export abstract class AttTupletVis extends Att {
  protected m_bracketPlace: number = STAFFREL_basic_NONE;
  protected m_bracketVisible: number = BOOLEAN_NONE;
  protected m_numFormat: number = tupletVis_NUMFORMAT_NONE;
  constructor() { super(); this.ResetTupletVis(); }
  ResetTupletVis(): void {
    this.m_bracketPlace = STAFFREL_basic_NONE;
    this.m_bracketVisible = BOOLEAN_NONE;
    this.m_numFormat = tupletVis_NUMFORMAT_NONE;
  }
  ReadTupletVis(element: xml_node, removeAttr: boolean = true): boolean {
    let hasAttribute = false;
    if (!element.attribute("bracket.place").empty()) {
    this.SetBracketPlace(this.StrToStaffrelBasic(element.attribute("bracket.place").value()));
    if (removeAttr) element.remove_attribute("bracket.place");
    hasAttribute = true;
    }
    if (!element.attribute("bracket.visible").empty()) {
    this.SetBracketVisible(this.StrToBoolean(element.attribute("bracket.visible").value()));
    if (removeAttr) element.remove_attribute("bracket.visible");
    hasAttribute = true;
    }
    if (!element.attribute("num.format").empty()) {
    this.SetNumFormat(this.StrToTupletVisNumformat(element.attribute("num.format").value()));
    if (removeAttr) element.remove_attribute("num.format");
    hasAttribute = true;
    }
    return hasAttribute;
  }
  WriteTupletVis(element: xml_node): boolean {
    let wroteAttribute = false;
    if (this.HasBracketPlace()) {
    element.append_attribute("bracket.place").set_value(this.StaffrelBasicToStr(this.GetBracketPlace()));
    wroteAttribute = true;
    }
    if (this.HasBracketVisible()) {
    element.append_attribute("bracket.visible").set_value(this.BooleanToStr(this.GetBracketVisible()));
    wroteAttribute = true;
    }
    if (this.HasNumFormat()) {
    element.append_attribute("num.format").set_value(this.TupletVisNumformatToStr(this.GetNumFormat()));
    wroteAttribute = true;
    }
    return wroteAttribute;
  }
  HasBracketPlace(): boolean {
    return (this.m_bracketPlace != STAFFREL_basic_NONE);
  }
  HasBracketVisible(): boolean {
    return (this.m_bracketVisible != BOOLEAN_NONE);
  }
  HasNumFormat(): boolean {
    return (this.m_numFormat != tupletVis_NUMFORMAT_NONE);
  }
  SetBracketPlace(bracketPlace_: number): void { this.m_bracketPlace = bracketPlace_; }
  GetBracketPlace(): number { return this.m_bracketPlace; }
  SetBracketVisible(bracketVisible_: number): void { this.m_bracketVisible = bracketVisible_; }
  GetBracketVisible(): number { return this.m_bracketVisible; }
  SetNumFormat(numFormat_: number): void { this.m_numFormat = numFormat_; }
  GetNumFormat(): number { return this.m_numFormat; }
}
export class InstTupletVis extends AttTupletVis {}
