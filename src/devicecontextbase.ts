import { BoundingBox, Point as BoundingPoint } from './boundingbox';
import type { SmuflTextFont } from './vrvdef';

export const COLOR_NONE = -1;
export const COLOR_WHITE = (255 << 16) | (255 << 8) | 255;
export const COLOR_BLACK = 0;
export const COLOR_RED = 255 << 16;
export const COLOR_BLUE = 255;
export const COLOR_GREEN = 255 << 8;
export const COLOR_CYAN = (255 << 8) | 255;
export const COLOR_LIGHT_GREY = (127 << 16) | (127 << 8) | 127;

export enum PenStyle { PEN_SOLID = 0, PEN_DOT, PEN_LONG_DASH, PEN_SHORT_DASH, PEN_DOT_DASH }
export enum LineCapStyle { LINECAP_DEFAULT = 0, LINECAP_BUTT, LINECAP_ROUND, LINECAP_SQUARE }
export enum LineJoinStyle { LINEJOIN_DEFAULT = 0, LINEJOIN_ARCS, LINEJOIN_BEVEL, LINEJOIN_MITER, LINEJOIN_MITER_CLIP, LINEJOIN_ROUND }

export class Pen {
  private m_width = 0;
  private m_style = PenStyle.PEN_SOLID;
  private m_dashLength = 0;
  private m_gapLength = 0;
  private m_lineCap = LineCapStyle.LINECAP_DEFAULT;
  private m_lineJoin = LineJoinStyle.LINEJOIN_DEFAULT;
  private m_opacity = -1;
  private m_color = COLOR_NONE;
  constructor(width = 0, style = PenStyle.PEN_SOLID, dashLength = 0, gapLength = 0,
              lineCap = LineCapStyle.LINECAP_DEFAULT, lineJoin = LineJoinStyle.LINEJOIN_DEFAULT,
              opacity = -1, color = COLOR_NONE) { Object.assign(this, { m_width: width, m_style: style, m_dashLength: dashLength, m_gapLength: gapLength, m_lineCap: lineCap, m_lineJoin: lineJoin, m_opacity: opacity, m_color: color }); }
  GetColor(){return this.m_color;} SetColor(v:number){this.m_color=v;} HasColor(){return this.m_color!==COLOR_NONE;}
  GetWidth(){return this.m_width;} SetWidth(v:number){this.m_width=v;}
  GetDashLength(){return this.m_dashLength;} SetDashLength(v:number){this.m_dashLength=v;}
  GetGapLength(){return this.m_gapLength;} SetGapLength(v:number){this.m_gapLength=v;}
  GetLineCap(){return this.m_lineCap;} SetLineCap(v:LineCapStyle){this.m_lineCap=v;}
  GetLineJoin(){return this.m_lineJoin;} SetLineJoin(v:LineJoinStyle){this.m_lineJoin=v;}
  GetStyle(){return this.m_style;} SetStyle(v:PenStyle){this.m_style=v;}
  GetOpacity(){return this.m_opacity;} SetOpacity(v:number){this.m_opacity=v;} HasOpacity(){return this.m_opacity!==-1;}
}

export class Brush {
  private m_opacity = -1;
  private m_color = COLOR_NONE;
  constructor(opacity = -1, color = COLOR_NONE){this.m_opacity=opacity;this.m_color=color;}
  GetColor(){return this.m_color;} SetColor(v:number){this.m_color=v;} HasColor(){return this.m_color!==COLOR_NONE;}
  GetOpacity(){return this.m_opacity;} SetOpacity(v:number){this.m_opacity=v;} HasOpacity(){return this.m_opacity!==-1;}
}

export type FontStyle = number;
export type FontWeight = number;
export class FontInfo {
  private m_pointSize=0; private m_letterSpacing=0; private m_family=0; private m_style:FontStyle=0; private m_weight:FontWeight=0;
  private m_underlined=false; private m_supSubScript=false; private m_faceName=''; private m_encoding=0; private m_widthToHeightRatio=1.0;
  private m_smuflFont:SmuflTextFont;
  constructor(){ this.m_smuflFont = 0 as SmuflTextFont; }
  GetPointSize(){return this.m_pointSize;} GetLetterSpacing(){return this.m_letterSpacing;} GetStyle(){return this.m_style;} GetWeight(){return this.m_weight;}
  GetUnderlined(){return this.m_underlined;} GetSupSubScript(){return this.m_supSubScript;} GetFaceName(){return this.m_faceName;} GetFamily(){return this.m_family;} GetEncoding(){return this.m_encoding;}
  GetWidthToHeightRatio(){return this.m_widthToHeightRatio;} GetSmuflFont(){return this.m_smuflFont;}
  SetPointSize(v:number){this.m_pointSize=v;} SetLetterSpacing(v:number){this.m_letterSpacing=v;} SetStyle(v:FontStyle){this.m_style=v;} SetWeight(v:FontWeight){this.m_weight=v;}
  SetUnderlined(v:boolean){this.m_underlined=v;} SetSupSubScript(v:boolean){this.m_supSubScript=v;} SetFaceName(v:string){this.m_faceName=v;} SetFamily(v:number){this.m_family=v;} SetEncoding(v:number){this.m_encoding=v;}
  SetWidthToHeightRatio(v:number){this.m_widthToHeightRatio=v;} SetSmuflFont(v:SmuflTextFont){this.m_smuflFont=v;}
  SetSmuflWithFallback(v:boolean){this.m_smuflFont=(v?2:1) as SmuflTextFont;}
}

export class Point {
  public x: number;
  public y: number;
  constructor(x=0, y=0) { this.x = Math.trunc(x); this.y = Math.trunc(y); }
  equals(p:Point){return this.x===p.x&&this.y===p.y;} notEquals(p:Point){return !this.equals(p);}
  add(p:Point){return new Point(this.x+p.x,this.y+p.y);} sub(p:Point){return new Point(this.x-p.x,this.y-p.y);}
  iadd(p:Point){this.x+=p.x;this.y+=p.y;return this;} isub(p:Point){this.x-=p.x;this.y-=p.y;return this;} neg(){return new Point(-this.x,-this.y);}
  static Min(a:Point,b:Point){return new Point(Math.min(a.x,b.x),Math.min(a.y,b.y));}
  static Max(a:Point,b:Point){return new Point(Math.max(a.x,b.x),Math.max(a.y,b.y));}
}

export interface BezierDocLike { GetDrawingUnit(staffSize:number):number; GetDrawingOctaveSize(staffSize:number):number; GetOptions():{m_slurCurveFactor:{GetValue():number}}; }

const asBoundingPoint=(p:Point):BoundingPoint=>({x:p.x,y:p.y});
const fromBoundingPoint=(p:BoundingPoint)=>new Point(p.x,p.y);

export class BezierCurve {
  public p1:Point; public c1:Point; public c2:Point; public p2:Point;
  private m_leftControlOffset=0; private m_rightControlOffset=0; private m_leftControlHeight=0; private m_rightControlHeight=0;
  private m_leftControlAbove=true; private m_rightControlAbove=true;
  constructor(p1=new Point(), c1=new Point(), c2=new Point(), p2=new Point()){this.p1=new Point(p1.x,p1.y);this.c1=new Point(c1.x,c1.y);this.c2=new Point(c2.x,c2.y);this.p2=new Point(p2.x,p2.y);}
  Rotate(angle:number, rotationPoint:Point){this.p1=fromBoundingPoint(BoundingBox.CalcPositionAfterRotation(asBoundingPoint(this.p1),angle,asBoundingPoint(rotationPoint)));this.p2=fromBoundingPoint(BoundingBox.CalcPositionAfterRotation(asBoundingPoint(this.p2),angle,asBoundingPoint(rotationPoint)));this.c1=fromBoundingPoint(BoundingBox.CalcPositionAfterRotation(asBoundingPoint(this.c1),angle,asBoundingPoint(rotationPoint)));this.c2=fromBoundingPoint(BoundingBox.CalcPositionAfterRotation(asBoundingPoint(this.c2),angle,asBoundingPoint(rotationPoint)));}
  SetControlOffset(v:number){this.m_leftControlOffset=this.m_rightControlOffset=Math.trunc(v);} SetLeftControlOffset(v:number){this.m_leftControlOffset=Math.trunc(v);} SetRightControlOffset(v:number){this.m_rightControlOffset=Math.trunc(v);}
  GetLeftControlOffset(){return this.m_leftControlOffset;} GetRightControlOffset(){return this.m_rightControlOffset;}
  SetControlHeight(v:number){this.m_leftControlHeight=this.m_rightControlHeight=Math.trunc(v);} SetLeftControlHeight(v:number){this.m_leftControlHeight=Math.trunc(v);} SetRightControlHeight(v:number){this.m_rightControlHeight=Math.trunc(v);}
  GetLeftControlHeight(){return this.m_leftControlHeight;} GetRightControlHeight(){return this.m_rightControlHeight;}
  SetControlSides(l:boolean,r:boolean){this.m_leftControlAbove=l;this.m_rightControlAbove=r;} IsLeftControlAbove(){return this.m_leftControlAbove;} IsRightControlAbove(){return this.m_rightControlAbove;}
  CalcInitialControlPointParams(doc?:BezierDocLike, angle=0, staffSize=0){
    // C++ param is float; narrow double angle to float32 (affects cos(angle) truncation boundary).
    angle = Math.fround(angle);
    const dist=Math.abs(this.p2.x-this.p1.x);
    if(!doc){this.SetControlOffset(dist/3.0);this.SetControlHeight(0);return;}
    const unit=doc.GetDrawingUnit(staffSize); let offset=0;
    if(this.m_leftControlAbove===this.m_rightControlAbove){const ratio=dist/unit;let baseVal=ratio>4?3:6;if(ratio>4&&ratio<32)baseVal=8-Math.log2(ratio);offset=Math.trunc(dist/baseVal);}else{offset=Math.trunc(dist/12);offset=Math.min(offset,4*unit);}
    this.m_leftControlOffset=this.m_rightControlOffset=offset;let height=0;
    if(this.m_leftControlAbove===this.m_rightControlAbove){height=Math.max(Math.trunc(dist/5),Math.trunc(1.2*unit));height=Math.min(3*unit,height);height=Math.trunc(height*doc.GetOptions().m_slurCurveFactor.GetValue());height=Math.min(height,2*doc.GetDrawingOctaveSize(staffSize));height=Math.min(height,Math.trunc(2*offset*Math.cos(angle)));}
    else {height=Math.max(Math.abs(this.p2.y-this.p1.y),4*unit);height=Math.trunc(height*doc.GetOptions().m_slurCurveFactor.GetValue());}
    this.SetControlHeight(Math.trunc(height));
  }
  UpdateControlPointParams(){this.m_leftControlOffset=Math.trunc(this.c1.x-this.p1.x);this.m_rightControlOffset=Math.trunc(this.p2.x-this.c2.x);let sign=this.m_leftControlAbove?1:-1;this.m_leftControlHeight=Math.trunc(sign*(this.c1.y-this.p1.y));sign=this.m_rightControlAbove?1:-1;this.m_rightControlHeight=Math.trunc(sign*(this.c2.y-this.p2.y));}
  UpdateControlPoints(){this.c1.x=Math.trunc(this.p1.x+this.m_leftControlOffset);this.c2.x=Math.trunc(this.p2.x-this.m_rightControlOffset);let sign=this.m_leftControlAbove?1:-1;this.c1.y=Math.trunc(this.p1.y+sign*this.m_leftControlHeight);sign=this.m_rightControlAbove?1:-1;this.c2.y=Math.trunc(this.p2.y+sign*this.m_rightControlHeight);}
  EstimateCurveParamForControlPoints():[number,number]{const d1=BoundingBox.CalcDistance(asBoundingPoint(this.p1),asBoundingPoint(this.c1)),d2=BoundingBox.CalcDistance(asBoundingPoint(this.c1),asBoundingPoint(this.c2)),d3=BoundingBox.CalcDistance(asBoundingPoint(this.c2),asBoundingPoint(this.p2)),sum=d1+d2+d3;return sum>0?[d1/sum,(d1+d2)/sum]:[0,1];}
}

export class TextExtend {
  m_width=0; m_height=0; m_leftBearing=0; m_ascent=0; m_descent=0; m_advX=0;
}
