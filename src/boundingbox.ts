import { Accessor, SMuFLGlyphAnchor, VRV_UNSET } from './vrvdef';
import { LogDebug } from './vrv';

export interface Point { x: number; y: number; }
export type IntPair = [number, number];
export type Rect = [Point, Point];

export interface GlyphLike {
  HasAnchor(anchor: SMuFLGlyphAnchor): boolean;
  GetAnchor(anchor: SMuFLGlyphAnchor): Point | null;
  GetBoundingBox(): { x: number; y: number; w: number; h: number } | [number, number, number, number];
  GetUnitsPerEm(): number;
}

export interface ResourcesLike { GetGlyph(smuflCode: number): GlyphLike | null; }
export interface DocLike { GetResources(): ResourcesLike; }
export interface CurveObjectLike { IsAnyOf(ids: Iterable<number>): boolean; }
export interface FloatingCurvePositionerLike {
  GetObject(): CurveObjectLike | null;
  GetPoints(): Point[];
  GetThickness(): number;
  GetDir(): number;
  GetTopBy(type: Accessor): number;
  GetBottomBy(type: Accessor): number;
  CalcMinMaxY(bezier: Point[]): number;
}
export interface BeamElementCoordLike { m_x: number; m_yBeam: number; }
export interface BeamDrawingInterfaceLike {
  HasCoords(): boolean;
  m_beamElementCoords: BeamElementCoordLike[];
  m_drawingPlace: number;
}

export const BEZIER_APPROXIMATION = 50.0;

const curvature_CURVEDIR_above = 1;
const BEAMPLACE_above = 1;
const BEAMPLACE_below = 2;
const LV = 1;
const PHRASE = 2;
const SLUR = 3;
const TIE = 4;

function truncInt(value: number): number { return Math.trunc(value); }
function pointEq(a: Point, b: Point): boolean { return a.x === b.x && a.y === b.y; }
function clonePoint(p: Point): Point { return { x: p.x, y: p.y }; }

export abstract class BoundingBox {
  protected m_cachedDrawingX = VRV_UNSET;
  protected m_cachedDrawingY = VRV_UNSET;
  private m_contentBB_x1 = -VRV_UNSET;
  private m_contentBB_y1 = -VRV_UNSET;
  private m_contentBB_x2 = VRV_UNSET;
  private m_contentBB_y2 = VRV_UNSET;
  private m_selfBB_x1 = -VRV_UNSET;
  private m_selfBB_y1 = -VRV_UNSET;
  private m_selfBB_x2 = VRV_UNSET;
  private m_selfBB_y2 = VRV_UNSET;
  private m_smuflGlyph = 0;
  private m_smuflGlyphFontSize = 100;

  public constructor() { this.ResetBoundingBox(); }
  public abstract GetClassId(): number;
  public abstract GetDrawingX(): number;
  public abstract GetDrawingY(): number;
  public abstract ResetCachedDrawingX(): void;
  public abstract ResetCachedDrawingY(): void;
  public Is(classId: number): boolean { return this.GetClassId() === classId; }
  public IsAnyOf(classIds: Iterable<number>): boolean { for (const id of classIds) if (this.GetClassId() === id) return true; return false; }

  public UpdateContentBBoxX(x1: number, x2: number): void {
    let minX = Math.min(x1, x2) - this.GetDrawingX();
    let maxX = Math.max(x1, x2) - this.GetDrawingX();
    if (this.m_contentBB_x1 > minX) this.m_contentBB_x1 = minX;
    if (this.m_contentBB_x2 < maxX) this.m_contentBB_x2 = maxX;
  }
  public UpdateContentBBoxY(y1: number, y2: number): void {
    let minY = Math.min(y1, y2) - this.GetDrawingY();
    let maxY = Math.max(y1, y2) - this.GetDrawingY();
    if (this.m_contentBB_y1 > minY) this.m_contentBB_y1 = minY;
    if (this.m_contentBB_y2 < maxY) this.m_contentBB_y2 = maxY;
  }
  public UpdateSelfBBoxX(x1: number, x2: number): void {
    let minX = Math.min(x1, x2) - this.GetDrawingX();
    let maxX = Math.max(x1, x2) - this.GetDrawingX();
    if (this.m_selfBB_x1 > minX) this.m_selfBB_x1 = minX;
    if (this.m_selfBB_x2 < maxX) this.m_selfBB_x2 = maxX;
  }
  public UpdateSelfBBoxY(y1: number, y2: number): void {
    let minY = Math.min(y1, y2) - this.GetDrawingY();
    let maxY = Math.max(y1, y2) - this.GetDrawingY();
    if (this.m_selfBB_y1 > minY) this.m_selfBB_y1 = minY;
    if (this.m_selfBB_y2 < maxY) this.m_selfBB_y2 = maxY;
  }

  public ResetBoundingBox(): void {
    this.m_contentBB_x1 = -VRV_UNSET; this.m_contentBB_y1 = -VRV_UNSET;
    this.m_contentBB_x2 = VRV_UNSET; this.m_contentBB_y2 = VRV_UNSET;
    this.m_selfBB_x1 = -VRV_UNSET; this.m_selfBB_y1 = -VRV_UNSET;
    this.m_selfBB_x2 = VRV_UNSET; this.m_selfBB_y2 = VRV_UNSET;
    this.m_cachedDrawingX = VRV_UNSET; this.m_cachedDrawingY = VRV_UNSET;
    this.m_smuflGlyph = 0; this.m_smuflGlyphFontSize = 100;
  }
  public SetEmptyBB(): void { this.m_contentBB_x1 = 0; this.m_contentBB_y1 = 0; this.m_contentBB_x2 = 0; this.m_contentBB_y2 = 0; this.m_selfBB_x1 = 0; this.m_selfBB_y1 = 0; this.m_selfBB_x2 = 0; this.m_selfBB_y2 = 0; }
  public HasEmptyBB(): boolean { return this.m_contentBB_x1 === 0 && this.m_contentBB_y1 === 0 && this.m_contentBB_x2 === 0 && this.m_contentBB_y2 === 0; }
  public HasContentBB(): boolean { return this.HasContentHorizontalBB() && this.HasContentVerticalBB(); }
  public HasContentHorizontalBB(): boolean { return this.m_contentBB_x1 !== -VRV_UNSET && this.m_contentBB_x2 !== VRV_UNSET; }
  public HasContentVerticalBB(): boolean { return this.m_contentBB_y1 !== -VRV_UNSET && this.m_contentBB_y2 !== VRV_UNSET; }
  public HasSelfBB(): boolean { return this.HasSelfHorizontalBB() && this.HasSelfVerticalBB(); }
  public HasSelfHorizontalBB(): boolean { return this.m_selfBB_x1 !== -VRV_UNSET && this.m_selfBB_x2 !== VRV_UNSET; }
  public HasSelfVerticalBB(): boolean { return this.m_selfBB_y1 !== -VRV_UNSET && this.m_selfBB_y2 !== VRV_UNSET; }
  public SetBoundingBoxGlyph(smuflGlyph: number, fontSize: number): void { if (!smuflGlyph) throw new Error('BoundingBox glyph must be non-zero'); this.m_smuflGlyph = smuflGlyph; this.m_smuflGlyphFontSize = fontSize; }
  public GetBoundingBoxGlyph(): number { return this.m_smuflGlyph; }
  public GetBoundingBoxGlyphFontSize(): number { return this.m_smuflGlyphFontSize; }

  public GetSelfBottom(): number { return this.GetDrawingY() + this.m_selfBB_y1; }
  public GetSelfTop(): number { return this.GetDrawingY() + this.m_selfBB_y2; }
  public GetSelfLeft(): number { return this.GetDrawingX() + this.m_selfBB_x1; }
  public GetSelfRight(): number { return this.GetDrawingX() + this.m_selfBB_x2; }
  public GetContentBottom(): number { return this.GetDrawingY() + this.m_contentBB_y1; }
  public GetContentTop(): number { return this.GetDrawingY() + this.m_contentBB_y2; }
  public GetContentLeft(): number { return this.GetDrawingX() + this.m_contentBB_x1; }
  public GetContentRight(): number { return this.GetDrawingX() + this.m_contentBB_x2; }
  public GetSelfX1(): number { return this.m_selfBB_x1; } public GetSelfX2(): number { return this.m_selfBB_x2; }
  public GetSelfY1(): number { return this.m_selfBB_y1; } public GetSelfY2(): number { return this.m_selfBB_y2; }
  public GetContentX1(): number { return this.m_contentBB_x1; } public GetContentX2(): number { return this.m_contentBB_x2; }
  public GetContentY1(): number { return this.m_contentBB_y1; } public GetContentY2(): number { return this.m_contentBB_y2; }
  public GetBottomBy(type: Accessor): number { return type === Accessor.SELF ? this.GetSelfBottom() : this.GetContentBottom(); }
  public GetTopBy(type: Accessor): number { return type === Accessor.SELF ? this.GetSelfTop() : this.GetContentTop(); }
  public GetLeftBy(type: Accessor): number { return type === Accessor.SELF ? this.GetSelfLeft() : this.GetContentLeft(); }
  public GetRightBy(type: Accessor): number { return type === Accessor.SELF ? this.GetSelfRight() : this.GetContentRight(); }
  public GetX1By(type: Accessor): number { return type === Accessor.SELF ? this.GetSelfX1() : this.GetContentX1(); }
  public GetX2By(type: Accessor): number { return type === Accessor.SELF ? this.GetSelfX2() : this.GetContentX2(); }
  public GetY1By(type: Accessor): number { return type === Accessor.SELF ? this.GetSelfY1() : this.GetContentY1(); }
  public GetY2By(type: Accessor): number { return type === Accessor.SELF ? this.GetSelfY2() : this.GetContentY2(); }

  public HorizontalContentOverlap(other: BoundingBox | null, margin = 0): boolean { if (!other) throw new Error('null BoundingBox'); if (!this.HasContentBB() || !other.HasContentBB()) return false; if (this.GetContentRight() <= other.GetContentLeft() - margin) return false; if (this.GetContentLeft() >= other.GetContentRight() + margin) return false; return true; }
  public VerticalContentOverlap(other: BoundingBox | null, margin = 0): boolean { if (!other) throw new Error('null BoundingBox'); if (!this.HasContentBB() || !other.HasContentBB()) return false; if (this.GetContentTop() <= other.GetContentBottom() - margin) return false; if (this.GetContentBottom() >= other.GetContentTop() + margin) return false; return true; }
  public HorizontalSelfOverlap(other: BoundingBox | null, margin = 0): boolean { if (!other) throw new Error('null BoundingBox'); if (!this.HasSelfBB() || !other.HasSelfBB()) return false; if (this.GetSelfRight() <= other.GetSelfLeft() - margin) return false; if (this.GetSelfLeft() >= other.GetSelfRight() + margin) return false; return true; }
  public VerticalSelfOverlap(other: BoundingBox | null, margin = 0): boolean { if (!other) throw new Error('null BoundingBox'); if (!this.HasSelfBB() || !other.HasSelfBB()) return false; if (this.GetSelfTop() <= other.GetSelfBottom() - margin) return false; if (this.GetSelfBottom() >= other.GetSelfTop() + margin) return false; return true; }

  public GetRectangles(anchor: SMuFLGlyphAnchor, rect: Rect[], resources: ResourcesLike): number;
  public GetRectangles(anchor1: SMuFLGlyphAnchor, anchor2: SMuFLGlyphAnchor, rect: Rect[], resources: ResourcesLike): number;
  public GetRectangles(a1: SMuFLGlyphAnchor, a2orRect: SMuFLGlyphAnchor | Rect[], rectOrResources: Rect[] | ResourcesLike, resources?: ResourcesLike): number {
    if (typeof a2orRect === 'number') return this.getRectangles2(a1, a2orRect as SMuFLGlyphAnchor, rectOrResources as Rect[], resources!);
    return this.getRectangles1(a1, a2orRect as Rect[], rectOrResources as ResourcesLike);
  }
  private getRectangles1(anchor: SMuFLGlyphAnchor, rect: Rect[], resources: ResourcesLike): number {
    let glyph: GlyphLike | null = null;
    let glyphRect = true;
    if (this.m_smuflGlyph !== 0) { glyph = resources.GetGlyph(this.m_smuflGlyph); if (!glyph) throw new Error('Missing glyph'); if (glyph.HasAnchor(anchor)) { glyphRect = this.GetGlyph1PointRectangles(anchor, glyph, rect); if (glyphRect) return 2; } }
    if (!glyphRect) { LogDebug("Illogical values for anchor points in glyph '%02x'", this.m_smuflGlyph); }
    rect[0] = [{x:this.GetSelfLeft(), y:this.GetSelfTop()}, {x:this.GetSelfRight(), y:this.GetSelfBottom()}]; return 1;
  }
  private getRectangles2(anchor1: SMuFLGlyphAnchor, anchor2: SMuFLGlyphAnchor, rect: Rect[], resources: ResourcesLike): number {
    let glyph: GlyphLike | null = null;
    let glyphRect = true;
    if (this.m_smuflGlyph !== 0) {
      glyph = resources.GetGlyph(this.m_smuflGlyph); if (!glyph) throw new Error('Missing glyph');
      if (glyph.HasAnchor(anchor1) && glyph.HasAnchor(anchor2)) { glyphRect = this.GetGlyph2PointRectangles(anchor1, anchor2, glyph, rect); if (glyphRect) return 3; }
      else if (glyph.HasAnchor(anchor1)) { glyphRect = this.GetGlyph1PointRectangles(anchor1, glyph, rect); if (glyphRect) return 2; }
      else if (glyph.HasAnchor(anchor2)) { glyphRect = this.GetGlyph1PointRectangles(anchor2, glyph, rect); if (glyphRect) return 2; }
    }
    if (!glyphRect) { LogDebug("Illogical values for anchor points in glyph '%02x'", this.m_smuflGlyph); }
    rect[0] = [{x:this.GetSelfLeft(), y:this.GetSelfTop()}, {x:this.GetSelfRight(), y:this.GetSelfBottom()}]; return 1;
  }

  private GetGlyph2PointRectangles(anchor1: SMuFLGlyphAnchor, anchor2: SMuFLGlyphAnchor, glyph: GlyphLike, rect: Rect[]): boolean {
    const fontPoint1 = glyph.GetAnchor(anchor1); const fontPoint2 = glyph.GetAnchor(anchor2); if (!fontPoint1 || !fontPoint2) throw new Error('Missing glyph anchor');
    const bb = glyph.GetBoundingBox(); const x = Array.isArray(bb) ? bb[0] : bb.x, y = Array.isArray(bb) ? bb[1] : bb.y; const em = glyph.GetUnitsPerEm();
    const selfLeft=this.GetSelfLeft(), selfRight=this.GetSelfRight(), selfTop=this.GetSelfTop(), selfBottom=this.GetSelfBottom();
    const p1: Point = { x: selfLeft - truncInt(x*this.m_smuflGlyphFontSize/em), y: selfBottom - truncInt(y*this.m_smuflGlyphFontSize/em) };
    const p2: Point = clonePoint(p1);
    p1.x += truncInt(fontPoint1.x*this.m_smuflGlyphFontSize/em); p1.y += truncInt(fontPoint1.y*this.m_smuflGlyphFontSize/em);
    p2.x += truncInt(fontPoint2.x*this.m_smuflGlyphFontSize/em); p2.y += truncInt(fontPoint2.y*this.m_smuflGlyphFontSize/em);
    if (p1.x < selfLeft || p1.x > selfRight || p1.y > selfTop || p1.y < selfBottom || p2.x < selfLeft || p2.x > selfRight || p2.y > selfTop || p2.y < selfBottom) return false;
    const r=(a:number,b:number,c:number,d:number): Rect => [{x:a,y:b},{x:c,y:d}];
    if (anchor1===SMuFLGlyphAnchor.SMUFL_cutOutNW && anchor2===SMuFLGlyphAnchor.SMUFL_cutOutNE) { rect[0]=r(selfLeft,p1.y,p1.x,selfBottom); rect[1]=r(p1.x,selfTop,p2.x,selfBottom); rect[2]=r(p2.x,p2.y,selfRight,selfBottom); }
    else if (anchor1===SMuFLGlyphAnchor.SMUFL_cutOutNE && anchor2===SMuFLGlyphAnchor.SMUFL_cutOutSE) { rect[0]=r(selfLeft,selfTop,p1.x,p1.y); rect[1]=r(selfLeft,p1.y,selfRight,p2.y); rect[2]=r(selfLeft,p2.y,p2.x,selfBottom); }
    else if (anchor1===SMuFLGlyphAnchor.SMUFL_cutOutSW && anchor2===SMuFLGlyphAnchor.SMUFL_cutOutSE) { rect[0]=r(selfLeft,selfTop,p1.x,p1.y); rect[1]=r(p1.x,selfTop,p2.x,selfBottom); rect[2]=r(p2.x,selfTop,selfRight,p2.y); }
    else if (anchor1===SMuFLGlyphAnchor.SMUFL_cutOutNW && anchor2===SMuFLGlyphAnchor.SMUFL_cutOutSW) { rect[0]=r(p1.x,selfTop,selfRight,p1.y); rect[1]=r(selfLeft,p1.y,selfRight,p2.y); rect[2]=r(p2.x,p2.y,selfRight,selfBottom); }
    else throw new Error('Unsupported anchor combination');
    return true;
  }

  private GetGlyph1PointRectangles(anchor: SMuFLGlyphAnchor, glyph: GlyphLike, rect: Rect[]): boolean {
    const fontPoint = glyph.GetAnchor(anchor); if (!fontPoint) throw new Error('Missing glyph anchor');
    const bb = glyph.GetBoundingBox(); const x = Array.isArray(bb) ? bb[0] : bb.x, y = Array.isArray(bb) ? bb[1] : bb.y; const em=glyph.GetUnitsPerEm();
    const selfLeft=this.GetSelfLeft(), selfRight=this.GetSelfRight(), selfTop=this.GetSelfTop(), selfBottom=this.GetSelfBottom();
    const p: Point = { x:selfLeft-truncInt(x*this.m_smuflGlyphFontSize/em)+truncInt(fontPoint.x*this.m_smuflGlyphFontSize/em), y:selfBottom-truncInt(y*this.m_smuflGlyphFontSize/em)+truncInt(fontPoint.y*this.m_smuflGlyphFontSize/em) };
    if (p.x<selfLeft || p.x>selfRight || p.y>selfTop || p.y<selfBottom) return false;
    const r=(a:number,b:number,c:number,d:number): Rect => [{x:a,y:b},{x:c,y:d}];
    if (anchor===SMuFLGlyphAnchor.SMUFL_cutOutNE) { rect[0]=r(selfLeft,selfTop,p.x,p.y); rect[1]=r(selfLeft,p.y,selfRight,selfBottom); }
    else if (anchor===SMuFLGlyphAnchor.SMUFL_cutOutSE) { rect[0]=r(selfLeft,selfTop,selfRight,p.y); rect[1]=r(selfLeft,p.y,p.x,selfBottom); }
    else if (anchor===SMuFLGlyphAnchor.SMUFL_cutOutSW) { rect[0]=r(selfLeft,selfTop,selfRight,p.y); rect[1]=r(p.x,p.y,selfRight,selfBottom); }
    else if (anchor===SMuFLGlyphAnchor.SMUFL_cutOutNW) { rect[0]=r(p.x,selfTop,selfRight,p.y); rect[1]=r(selfLeft,p.y,selfRight,selfBottom); }
    else return false;
    return true;
  }

  public GetCutOutTop(resources: ResourcesLike): number { const rect:Rect[]=[]; const n=this.getRectangles2(SMuFLGlyphAnchor.SMUFL_cutOutNW,SMuFLGlyphAnchor.SMUFL_cutOutNE,rect,resources); const vals=rect.slice(0,n).map(r=>r[0].y).sort((a,b)=>b-a); return vals.length===1?vals[0]:vals[1]; }
  public GetCutOutBottom(resources: ResourcesLike): number { const rect:Rect[]=[]; const n=this.getRectangles2(SMuFLGlyphAnchor.SMUFL_cutOutSW,SMuFLGlyphAnchor.SMUFL_cutOutSE,rect,resources); const vals=rect.slice(0,n).map(r=>r[1].y).sort((a,b)=>a-b); return vals.length===1?vals[0]:vals[1]; }
  public GetCutOutLeft(resources: ResourcesLike): number { const rect:Rect[]=[]; const n=this.getRectangles2(SMuFLGlyphAnchor.SMUFL_cutOutNW,SMuFLGlyphAnchor.SMUFL_cutOutSW,rect,resources); const vals=rect.slice(0,n).map(r=>r[0].x).sort((a,b)=>a-b); return vals.length===1?vals[0]:vals[1]; }
  public GetCutOutRight(resources: ResourcesLike): number { const rect:Rect[]=[]; const n=this.getRectangles2(SMuFLGlyphAnchor.SMUFL_cutOutNE,SMuFLGlyphAnchor.SMUFL_cutOutSE,rect,resources); const vals=rect.slice(0,n).map(r=>r[1].x).sort((a,b)=>b-a); return vals.length===1?vals[0]:vals[1]; }
  public GetCutOutLeftFrom(resources: ResourcesLike, fromTop: boolean): number { const rect:Rect[]=[]; const a=fromTop?SMuFLGlyphAnchor.SMUFL_cutOutNW:SMuFLGlyphAnchor.SMUFL_cutOutSW; const n=this.getRectangles1(a,rect,resources); const vals=rect.slice(0,n).map(r=>r[0].x).sort((a,b)=>a-b); return vals.length===1?vals[0]:vals[1]; }
  public GetCutOutRightFrom(resources: ResourcesLike, fromTop: boolean): number { const rect:Rect[]=[]; const a=fromTop?SMuFLGlyphAnchor.SMUFL_cutOutNE:SMuFLGlyphAnchor.SMUFL_cutOutSE; const n=this.getRectangles1(a,rect,resources); const vals=rect.slice(0,n).map(r=>r[1].x).sort((a,b)=>b-a); return vals.length===1?vals[0]:vals[1]; }

  public Encloses(point: Point): boolean { if (this.GetContentRight()<point.x) return false; if (this.GetContentLeft()>point.x) return false; if (this.GetContentTop()<point.y) return false; if (this.GetContentBottom()>point.y) return false; return true; }

  public Intersects(curve: FloatingCurvePositionerLike, type: Accessor, margin=0): number {
    // C++ boundingbox.cpp asserts curve object IsAnyOf({LV,PHRASE,SLUR,TIE}),
    // but asserts compile out (NDEBUG) and computation proceeds; keep the
    // null guards, drop the type assert so non-curve positioners (e.g. trill
    // ending on grace) compute instead of throwing.
    if (!curve) throw new Error('null curve'); const obj=curve.GetObject(); if (!obj) throw new Error('curve without object');
    const points=curve.GetPoints(); const p1=points[0], p2=points[3]; if (p2.x<this.GetLeftBy(type) || p1.x>this.GetRightBy(type)) return 0;
    const topBezier:Point[]=[]; const bottomBezier:Point[]=[]; BoundingBox.CalcThickBezier(points,curve.GetThickness(),topBezier,bottomBezier);
    if (p1.x<this.GetLeftBy(type) && p2.x>this.GetRightBy(type)) {
      if (curve.GetDir()===curvature_CURVEDIR_above) { if (curve.GetTopBy(type)+margin<this.GetBottomBy(type)) return 0; const xMaxY=curve.CalcMinMaxY(topBezier); let leftY=BoundingBox.CalcBezierAtPosition(bottomBezier,this.GetLeftBy(type))+margin; let rightY=BoundingBox.CalcBezierAtPosition(bottomBezier,this.GetRightBy(type))+margin; if(leftY>=this.GetTopBy(type)&&rightY>=this.GetTopBy(type)) return 0; leftY=BoundingBox.CalcBezierAtPosition(topBezier,this.GetLeftBy(type))+margin; rightY=BoundingBox.CalcBezierAtPosition(topBezier,this.GetRightBy(type))+margin; if(this.GetLeftBy(type)<p1.x+xMaxY&&this.GetRightBy(type)>p1.x+xMaxY) return curve.GetTopBy(type)-this.GetBottomBy(type)+margin; return this.GetRightBy(type)<p1.x+xMaxY?rightY-this.GetBottomBy(type):leftY-this.GetBottomBy(type); }
      if (curve.GetBottomBy(type)-margin>this.GetTopBy(type)) return 0; const xMinY=curve.CalcMinMaxY(bottomBezier); let leftY=BoundingBox.CalcBezierAtPosition(topBezier,this.GetLeftBy(type))-margin; let rightY=BoundingBox.CalcBezierAtPosition(topBezier,this.GetRightBy(type))-margin; if(leftY<=this.GetBottomBy(type)&&rightY<=this.GetBottomBy(type)) return 0; leftY=BoundingBox.CalcBezierAtPosition(bottomBezier,this.GetLeftBy(type))-margin; rightY=BoundingBox.CalcBezierAtPosition(bottomBezier,this.GetRightBy(type))-margin; if(this.GetLeftBy(type)<p1.x+xMinY&&this.GetRightBy(type)>p1.x+xMinY) return curve.GetBottomBy(type)-this.GetTopBy(type)-margin; return this.GetRightBy(type)<p1.x+xMinY?rightY-this.GetTopBy(type):leftY-this.GetTopBy(type);
    }
    if (p1.x<this.GetLeftBy(type) && p2.x<=this.GetRightBy(type)) {
      if(curve.GetDir()===curvature_CURVEDIR_above){const xMaxY=curve.CalcMinMaxY(topBezier); if(p2.y>this.GetTopBy(type)+margin)return 0; if(this.GetLeftBy(type)<p1.x+xMaxY)return curve.GetTopBy(type)-this.GetBottomBy(type)+margin; const leftY=BoundingBox.CalcBezierAtPosition(topBezier,this.GetLeftBy(type))+margin; if(leftY<this.GetBottomBy(type))return 0; return leftY-this.GetBottomBy(type);}
      const xMinY=curve.CalcMinMaxY(topBezier); if(p2.y<this.GetBottomBy(type)+margin)return 0; if(this.GetLeftBy(type)<p1.x+xMinY)return curve.GetBottomBy(type)-this.GetTopBy(type)-margin; const leftY=BoundingBox.CalcBezierAtPosition(bottomBezier,this.GetLeftBy(type))-margin; if(leftY>this.GetTopBy(type))return 0; return leftY-this.GetTopBy(type);
    }
    if (p1.x>=this.GetLeftBy(type) && p2.x>this.GetRightBy(type)) {
      if(curve.GetDir()===curvature_CURVEDIR_above){const xMaxY=curve.CalcMinMaxY(topBezier); if(p1.y>this.GetTopBy(type)+margin)return 0; if(this.GetRightBy(type)>p1.x+xMaxY)return curve.GetTopBy(type)-this.GetBottomBy(type)+margin; const rightY=BoundingBox.CalcBezierAtPosition(topBezier,this.GetRightBy(type))+margin; if(rightY<this.GetBottomBy(type))return 0; return rightY-this.GetBottomBy(type);}
      const xMinY=curve.CalcMinMaxY(bottomBezier); if(p1.y<this.GetBottomBy(type)+margin)return 0; if(this.GetRightBy(type)>p1.x+xMinY)return curve.GetBottomBy(type)-this.GetTopBy(type)-margin; const rightY=BoundingBox.CalcBezierAtPosition(bottomBezier,this.GetRightBy(type))-margin; if(rightY>this.GetTopBy(type))return 0; return rightY-this.GetTopBy(type);
    }
    if (p1.x>=this.GetLeftBy(type) && p2.x<=this.GetRightBy(type)) return curve.GetDir()===curvature_CURVEDIR_above ? curve.GetTopBy(type)-this.GetBottomBy(type)+margin : curve.GetBottomBy(type)-this.GetTopBy(type)-margin;
    return 0;
  }

  public IntersectsBeam(beamInterface: BeamDrawingInterfaceLike, type: Accessor, margin=0, fromBeamContentSide=false): number {
    if(!beamInterface || !beamInterface.HasCoords()) throw new Error('invalid beam'); const left=beamInterface.m_beamElementCoords[0], right=beamInterface.m_beamElementCoords[beamInterface.m_beamElementCoords.length-1]; const beamLeft:Point={x:left.m_x,y:left.m_yBeam}, beamRight:Point={x:right.m_x,y:right.m_yBeam}; const leftX=this.GetLeftBy(type)-margin,rightX=this.GetRightBy(type)+margin; let li:Point={x:0,y:0},ri:Point={x:0,y:0}; const slope=BoundingBox.CalcSlope(beamLeft,beamRight);
    if(leftX<=beamLeft.x){if(rightX<beamLeft.x)return 0; if(rightX<beamRight.x){li=clonePoint(beamLeft);ri={x:rightX,y:Math.trunc(beamLeft.y+slope*(rightX-beamLeft.x))};}else{li=clonePoint(beamLeft);ri=clonePoint(beamRight);}} else if(rightX>beamRight.x){if(leftX<=beamRight.x){li={x:leftX,y:Math.trunc(beamLeft.y+slope*(leftX-beamLeft.x))};ri=clonePoint(beamRight);}else return 0;} else {li={x:leftX,y:Math.trunc(beamLeft.y+slope*(leftX-beamLeft.x))};ri={x:rightX,y:Math.trunc(beamLeft.y+slope*(rightX-beamLeft.x))};}
    const above=beamInterface.m_drawingPlace===BEAMPLACE_above, below=beamInterface.m_drawingPlace===BEAMPLACE_below; if((above&&!fromBeamContentSide)||(below&&fromBeamContentSide)){const top=Math.max(li.y,ri.y);return Math.max(top-this.GetBottomBy(type)+margin,0);} if((below&&!fromBeamContentSide)||(above&&fromBeamContentSide)){const bottom=Math.min(li.y,ri.y);return Math.min(bottom-this.GetTopBy(type)-margin,0);} return 0;
  }
  public HorizontalLeftOverlap(other: BoundingBox, doc: DocLike, margin=0, vMargin=0): number { const a:Rect[]=[],b:Rect[]=[]; const na=this.getRectangles2(SMuFLGlyphAnchor.SMUFL_cutOutNW,SMuFLGlyphAnchor.SMUFL_cutOutSW,a,doc.GetResources()); const nb=other.getRectangles2(SMuFLGlyphAnchor.SMUFL_cutOutNE,SMuFLGlyphAnchor.SMUFL_cutOutSE,b,doc.GetResources()); let overlap=0; for(let i=0;i<na;i++)for(let j=0;j<nb;j++)overlap=Math.max(overlap,BoundingBox.RectLeftOverlap(a[i],b[j],margin,vMargin)); return overlap; }
  public HorizontalRightOverlap(other: BoundingBox, doc: DocLike, margin=0, vMargin=0): number { const a:Rect[]=[],b:Rect[]=[]; const na=this.getRectangles2(SMuFLGlyphAnchor.SMUFL_cutOutNE,SMuFLGlyphAnchor.SMUFL_cutOutSE,a,doc.GetResources()); const nb=other.getRectangles2(SMuFLGlyphAnchor.SMUFL_cutOutNW,SMuFLGlyphAnchor.SMUFL_cutOutSW,b,doc.GetResources()); let overlap=0; for(let i=0;i<na;i++)for(let j=0;j<nb;j++)overlap=Math.max(overlap,BoundingBox.RectRightOverlap(a[i],b[j],margin,vMargin)); return overlap; }
  public VerticalTopOverlap(other: BoundingBox, doc: DocLike, margin=0, hMargin=0): number { const a:Rect[]=[],b:Rect[]=[]; const na=this.getRectangles2(SMuFLGlyphAnchor.SMUFL_cutOutNW,SMuFLGlyphAnchor.SMUFL_cutOutNE,a,doc.GetResources()); const nb=other.getRectangles2(SMuFLGlyphAnchor.SMUFL_cutOutSW,SMuFLGlyphAnchor.SMUFL_cutOutSE,b,doc.GetResources()); let overlap=0; for(let i=0;i<na;i++)for(let j=0;j<nb;j++)overlap=Math.max(overlap,BoundingBox.RectTopOverlap(a[i],b[j],margin,hMargin)); return overlap; }
  public VerticalBottomOverlap(other: BoundingBox, doc: DocLike, margin=0, hMargin=0): number { const a:Rect[]=[],b:Rect[]=[]; const na=this.getRectangles2(SMuFLGlyphAnchor.SMUFL_cutOutSW,SMuFLGlyphAnchor.SMUFL_cutOutSE,a,doc.GetResources()); const nb=other.getRectangles2(SMuFLGlyphAnchor.SMUFL_cutOutNW,SMuFLGlyphAnchor.SMUFL_cutOutNE,b,doc.GetResources()); let overlap=0; for(let i=0;i<na;i++)for(let j=0;j<nb;j++)overlap=Math.max(overlap,BoundingBox.RectBottomOverlap(a[i],b[j],margin,hMargin)); return overlap; }

  public static CalcPositionAfterRotation(point:Point, alpha:number, center:Point):Point {
    if(pointEq(point,center))return point;
    // C++ Point BoundingBox::CalcPositionAfterRotation(Point point, float alpha, Point center)
    // Parameter alpha is explicitly float (float32). When callers pass double (like DegToRad(double)),
    // C++ narrows to float32 at parameter passing. Emulate the parameter boundary with Math.fround.
    alpha = Math.fround(alpha);
    const s=Math.fround(Math.sin(alpha)),c=Math.fround(Math.cos(alpha));
    const x=point.x-center.x,y=point.y-center.y;
    const xnew=Math.fround(Math.fround(x*c)-Math.fround(y*s));
    const ynew=Math.fround(Math.fround(x*s)+Math.fround(y*c));
    return {
      x:Math.trunc(Math.fround(xnew+center.x)),
      y:Math.trunc(Math.fround(ynew+center.y))
    };
  }
  public static CalcDistance(p1:Point,p2:Point):number{return Math.hypot(p1.x-p2.x,p1.y-p2.y);}
  public static ArePointsClose(p1:Point,p2:Point,margin:number):boolean{return BoundingBox.CalcDistance(p1,p2)<=margin;}
  public static CalcSlope(p1:Point,p2:Point):number{return (p1.y===p2.y||p1.x===p2.x)?0:(p2.y-p1.y)/(p2.x-p1.x);}
  public static CalcBezierParamAtPosition(bezier:Point[],x:number):number{const a=-bezier[0].x+3*bezier[1].x-3*bezier[2].x+bezier[3].x,b=3*bezier[0].x-6*bezier[1].x+3*bezier[2].x,c=-3*bezier[0].x+3*bezier[1].x,d=bezier[0].x-x; const roots=[...BoundingBox.SolveCubicPolynomial(a,b,c,d)].sort((u,v)=>u-v); const eps=1e-6; let root=roots.find(v=>v>=-eps&&v<=1+eps)??0; return Math.max(0,Math.min(1,root));}
  public static CalcBezierAtPosition(bezier:Point[],x:number):number{return Math.trunc(BoundingBox.CalcDeCasteljau(bezier,BoundingBox.CalcBezierParamAtPosition(bezier,x)).y);}
  public static CalcLinearInterpolation(dest:Point,a:Point,b:Point,t:number):void{dest.x=Math.trunc(a.x+(b.x-a.x)*t);dest.y=Math.trunc(a.y+(b.y-a.y)*t);}
  public static CalcPointAtBezier(bezier:Point[],t:number):Point{const p1=clonePoint({x:0,y:0}),p2={x:0,y:0},p3={x:0,y:0},p4={x:0,y:0},p5={x:0,y:0},mid={x:0,y:0};this.CalcLinearInterpolation(p1,bezier[0],bezier[1],t);this.CalcLinearInterpolation(p2,bezier[1],bezier[2],t);this.CalcLinearInterpolation(p3,bezier[2],bezier[3],t);this.CalcLinearInterpolation(p4,p1,p2,t);this.CalcLinearInterpolation(p5,p2,p3,t);this.CalcLinearInterpolation(mid,p4,p5,t);return mid;}
  public static GetBezierThicknessCoefficient(bezier:Point[],currentThickness:number,penWidth:number):number{const top:Point[]=[],bottom:Point[]=[];this.CalcThickBezier(bezier,currentThickness,top,bottom);const a=this.CalcPointAtBezier(top,.5),b=this.CalcPointAtBezier(bottom,.5);const actual=Math.trunc(Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2));let adjusted=currentThickness-penWidth;if(adjusted<0)adjusted=0;return adjusted/actual;}
  public static CalcDeCasteljau(bezier:Point[],t:number):Point{const u=1-t;return{x:Math.trunc(u**3*bezier[0].x+3*t*u**2*bezier[1].x+3*u*t**2*bezier[2].x+t**3*bezier[3].x),y:Math.trunc(u**3*bezier[0].y+3*t*u**2*bezier[1].y+3*u*t**2*bezier[2].y+t**3*bezier[3].y)};}
  public static SolveCubicPolynomial(a:number,b:number,c:number,d:number):Set<number>{if(Math.abs(a)<10e-10){if(Math.abs(b)<10e-10){if(Math.abs(c)<10e-10)return new Set();return new Set([-d/c]);}const q=Math.sqrt(c*c-4*b*d);return new Set([(q-c)/(2*b),(-c-q)/(2*b)]);}b/=a;c/=a;d/=a;const p=(3*c-b*b)/3,p3=p/3,q=(2*b*b*b-9*b*c+27*d)/27,q2=q/2,disc=q2*q2+p3*p3*p3;if(disc<0){const mp3=-p/3,r=Math.sqrt(mp3*mp3*mp3),t=-q/(2*r),cosphi=Math.max(-1,Math.min(1,t)),phi=Math.acos(cosphi),u=2*Math.cbrt(r);return new Set([u*Math.cos(phi/3)-b/3,u*Math.cos((phi+2*Math.PI)/3)-b/3,u*Math.cos((phi+4*Math.PI)/3)-b/3]);}if(disc===0){const u=-Math.cbrt(q2);return new Set([2*u-b/3,-u-b/3]);}const sd=Math.sqrt(disc),u=Math.cbrt(sd-q2),v=Math.cbrt(sd+q2);return new Set([u-v-b/3]);}
  public static CalcThickBezier(bezier:Point[],thickness:number,topBezier:Point[],bottomBezier:Point[]):void{let s1=Math.fround(this.CalcSlope(bezier[0],bezier[1]));if(bezier[0].x>bezier[1].x)s1*=-1.0;let s2=Math.fround(this.CalcSlope(bezier[1],bezier[2]));if(bezier[1].x>bezier[2].x)s2*=-1.0;let s3=Math.fround(this.CalcSlope(bezier[2],bezier[3]));if(bezier[2].x>bezier[3].x)s3*=-1.0;const a1=Math.fround((Math.atan(s1)+Math.atan(s2))/2.0),a2=Math.fround((Math.atan(s2)+Math.atan(s3))/2.0);let c1=clonePoint(bezier[1]),c2=clonePoint(bezier[2]);c1.y=Math.trunc(c1.y+thickness*.5);c2.y=Math.trunc(c2.y+thickness*.5);c1=this.CalcPositionAfterRotation(c1,a1,bezier[1]);c2=this.CalcPositionAfterRotation(c2,a2,bezier[2]);topBezier.push(clonePoint(bezier[0]),c1,c2,clonePoint(bezier[3]));c1=clonePoint(bezier[1]);c2=clonePoint(bezier[2]);c1.y=Math.trunc(c1.y-thickness*.5);c2.y=Math.trunc(c2.y-thickness*.5);c1=this.CalcPositionAfterRotation(c1,a1,bezier[1]);c2=this.CalcPositionAfterRotation(c2,a2,bezier[2]);bottomBezier.push(clonePoint(bezier[0]),c1,c2,clonePoint(bezier[3]));}
  public static ApproximateBezierBoundingBox(bezier:Point[],pos:Point,width:number,height:number,minYPos:number,maxYPos:number):{pos:Point,width:number,height:number,minYPos:number,maxYPos:number}{let minx=-VRV_UNSET,miny=-VRV_UNSET,maxx=VRV_UNSET,maxy=VRV_UNSET,minYP=minYPos,maxYP=maxYPos;const ax=bezier[0].x,ay=bezier[0].y,bx=bezier[1].x,by=bezier[1].y,cx=bezier[2].x,cy=bezier[2].y,dx=bezier[3].x,dy=bezier[3].y,tobx=bx-ax,toby=by-ay,tocx=cx-bx,tocy=cy-by,todx=dx-cx,tody=dy-cy,step=1/BEZIER_APPROXIMATION;for(let i=0;i<(BEZIER_APPROXIMATION+1);i++){const dd=i*step,px=ax+dd*tobx,py=ay+dd*toby,qx=bx+dd*tocx,qy=by+dd*tocy,rx=cx+dd*todx,ry=cy+dd*tody,sx=px+dd*(qx-px),sy=py+dd*(qy-py),tx=qx+dd*(rx-qx),ty=qy+dd*(ry-qy),x=truncInt(sx+dd*(tx-sx)),y=truncInt(sy+dd*(ty-sy));minx=Math.min(minx,x);if(miny>y){miny=y;minYP=truncInt((bezier[3].x-bezier[0].x)*dd);}maxx=Math.max(maxx,x);if(maxy<y){maxy=y;maxYP=truncInt((bezier[3].x-bezier[0].x)*dd);}}pos.x=minx;pos.y=miny;return{pos,width:maxx-minx,height:maxy-miny,minYPos:minYP,maxYPos:maxYP};}
  public static ApproximateBezierExtrema(bezier:Point[],isMaxExtrema:boolean,approximationSteps=BEZIER_APPROXIMATION):[number,number]{let bestT=0,bestY=this.CalcPointAtBezier(bezier,0).y;for(let i=1;i<=approximationSteps;i++){const t=i/approximationSteps,y=this.CalcPointAtBezier(bezier,t).y;if((isMaxExtrema&&y>bestY)||(!isMaxExtrema&&y<bestY)){bestY=y;bestT=t;}}return[bestT,bestY];}
  public static RectLeftOverlap(r1:Rect,r2:Rect,margin:number,vMargin:number):number{if(r1[0].y<r2[1].y-vMargin||r1[1].y>r2[0].y+vMargin)return 0;return Math.max(0,r2[1].x-r1[0].x+margin);}
  public static RectRightOverlap(r1:Rect,r2:Rect,margin:number,vMargin:number):number{if(r1[0].y<r2[1].y-vMargin||r1[1].y>r2[0].y+vMargin)return 0;return Math.max(0,r1[1].x-r2[0].x+margin);}
  public static RectTopOverlap(r1:Rect,r2:Rect,margin:number,hMargin:number):number{if(r1[0].x>r2[1].x+hMargin||r1[1].x<r2[0].x-hMargin)return 0;return Math.max(0,r1[1].y-r2[0].y+margin);}
  public static RectBottomOverlap(r1:Rect,r2:Rect,margin:number,hMargin:number):number{if(r1[0].x>r2[1].x+hMargin||r1[1].x<r2[0].x-hMargin)return 0;return Math.max(0,r2[1].y-r1[0].y+margin);}
}

export class SegmentedLine {
  private m_segments: IntPair[] = [];
  private m_increasing: boolean;
  public constructor(start:number,end:number){this.m_increasing=start<=end;if(!this.m_increasing)[start,end]=[end,start];this.m_segments.push([start,end]);}
  public IsEmpty():boolean{return this.m_segments.length===0;}
  public IsUnsegmented():boolean{return this.m_segments.length===1;}
  public GetSegmentCount():number{return this.m_segments.length;}
  public GetStartEnd(idx:number):IntPair{if(idx<0||idx>=this.GetSegmentCount())throw new Error('Segment index out of bounds');if(this.m_increasing)return[...this.m_segments[idx]];idx=this.m_segments.length-1-idx;return[this.m_segments[idx][1],this.m_segments[idx][0]];}
  public AddGap(start:number,end:number):void{if(start===end)throw new Error('Gap cannot have zero length');if(start>end)[start,end]=[end,start];if(this.m_segments.length===0)return;for(let i=0;i<this.m_segments.length;){const seg=this.m_segments[i];if(start<=seg[0]&&end>=seg[1]){this.m_segments.splice(i,1);continue;}if(seg[0]<=start&&seg[1]>=end){this.m_segments.splice(i,1,[seg[0],start],[end,seg[1]]);break;}if(start<seg[0]&&end>=seg[0])seg[0]=end;if(end>seg[1]&&start<=seg[1])seg[1]=start;i++;}}
}
