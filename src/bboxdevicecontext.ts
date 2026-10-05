import { BoundingBox, Point as BBPoint } from './boundingbox';
import { ClassId, GraphicID, VRV_UNSET, SMuFLGlyphAnchor, DEFINITION_FACTOR } from './vrvdef';
import { ApproximatelyEqual, LogWarning } from './vrv';
import { FontInfo, Pen, PenStyle, LineCapStyle, LineJoinStyle, Brush, TextExtend, Point } from './devicecontextbase';
import { Glyph } from './glyph';

export const BBOX_BOTH = 0;
export const BBOX_HORIZONTAL_ONLY = 1;
export const BBOX_VERTICAL_ONLY = 2;

export const HORIZONTALALIGNMENT_NONE = 0;
export const HORIZONTALALIGNMENT_left = 1;
export const HORIZONTALALIGNMENT_center = 3;
export const HORIZONTALALIGNMENT_right = 2;

export interface ViewLike {
  ToLogicalX(value: number): number;
  ToLogicalY(value: number): number;
}

export interface BBoxObjectLike {
  BoundingBox?: BoundingBox;
  ResetBoundingBox(): void;
  UpdateSelfBBoxX(x1: number, x2: number): void;
  UpdateSelfBBoxY(y1: number, y2: number): void;
  UpdateContentBBoxX(x1: number, x2: number): void;
  UpdateContentBBoxY(y1: number, y2: number): void;
  SetBoundingBoxGlyph(glyph: number, fontSize: number): void;
}

export interface ExtentGlyphLike {
  GetBoundingBox(): { x: number; y: number; w: number; h: number };
  GetHorizAdvX(): number;
  GetUnitsPerEm(): number;
}

export interface GlyphResourcesLike {
  GetGlyph(code: number): ExtentGlyphLike | null;
  GetTextGlyph(code: number): ExtentGlyphLike | null;
  // Font-name surfaces consumed by SvgDeviceContext (Resources implementation)
  GetCurrentFont?(): string;
  GetFallbackFont?(): string;
  GetTextFont?(): string;
  GetCSSFontFor?(fontName: string): string;
}

export interface TextExtentProvider {
  GetTextExtent?(text: string, extend: TextExtend, typeSize: boolean): void;
  GetSmuflTextExtent?(text: string | number[], extend: TextExtend): void;
}

/**
 * Structural compatibility boundary for the still-unmigrated DeviceContext.
 * It models only the state and inherited behavior consumed by BBoxDeviceContext.
 */
export interface DeviceContextDependencies extends TextExtentProvider {
  resources?: GlyphResourcesLike | null;
}

export abstract class DeviceContextCompat {
  protected readonly m_classId: ClassId;
  protected m_resources: GlyphResourcesLike | null = null;
  protected m_isDeactivatedX = false;
  protected m_isDeactivatedY = false;
  protected m_fontStack: FontInfo[] = [];
  protected m_penStack: Pen[] = [new Pen(1, PenStyle.PEN_SOLID)];
  protected m_brushStack: Brush[] = [new Brush(-1)];
  protected m_contentHeight = 0;
  protected m_baseWidth = 0;
  protected m_baseHeight = 0;
  protected m_width = 0;
  protected m_height = 0;
  protected m_userScaleX = 1.0;
  protected m_userScaleY = 1.0;
  protected m_pushBack = false;
  protected m_viewBoxFactor: number = DEFINITION_FACTOR;
  protected readonly m_dependencies: DeviceContextDependencies;

  protected constructor(classId: ClassId, dependencies: DeviceContextDependencies = {}) {
    this.m_classId = classId;
    this.m_dependencies = dependencies;
    this.m_resources = dependencies.resources ?? null;
  }

  public GetClassId(): ClassId { return this.m_classId; }
  public Is(classId: ClassId): boolean { return this.m_classId === classId; }
  /** C++ DeviceContext::ApplyOffset base returns false; SvgDeviceContext overrides true. */
  public ApplyOffset(): boolean { return false; }
  public SetResources(resources: GlyphResourcesLike | null): void { this.m_resources = resources; }
  public HasResources(): boolean { return this.m_resources !== null; }
  public ResetResources(): void { this.m_resources = null; }
  public GetResources(required = false): GlyphResourcesLike | null {
    if (!this.m_resources && required) {
      LogWarning('Requested resources unavailable.');
      throw new Error('DeviceContext resources are not set.');
    }
    return this.m_resources;
  }
  public static RGB2Int(red: number, green: number, blue: number): number { return (red << 16) | (green << 8) | blue; }
  public SetContentHeight(height: number): void { this.m_contentHeight = height; }
  public GetContentHeight(): number { return this.m_contentHeight; }
  public SetBaseSize(width: number, height: number): void { this.m_baseWidth = width; this.m_baseHeight = height; }
  public GetBaseSize(): [number, number] { return [this.m_baseWidth, this.m_baseHeight]; }
  public SetViewBoxFactor(ppuFactor: number): void { this.m_viewBoxFactor = DEFINITION_FACTOR / ppuFactor; }
  public GetViewBoxFactor(): number { return this.m_viewBoxFactor; }
  public SetWidth(width: number): void { this.m_width = width; }
  public GetWidth(): number { return this.m_width; }
  public SetHeight(height: number): void { this.m_height = height; }
  public GetHeight(): number { return this.m_height; }
  public GetUserScaleX(): number { return this.m_userScaleX; }
  public GetUserScaleY(): number { return this.m_userScaleY; }
  public SetUserScale(xScale: number, yScale: number): void { this.m_userScaleX = xScale; this.m_userScaleY = yScale; }
  public SetBrush(opacity: number, color = -1): void { this.m_brushStack.push(new Brush(opacity, color)); }
  public ResetBrush(): void { this.m_brushStack.pop(); }
  public SetPenFull(width: number, style: PenStyle, dashLength = 0, lineCap: LineCapStyle = LineCapStyle.LINECAP_DEFAULT, lineJoin: LineJoinStyle = LineJoinStyle.LINEJOIN_DEFAULT): void {
    this.SetPen(width, style, dashLength, 0, lineCap, lineJoin);
  }
  public SetPen(width: number, style: PenStyle, dashLength = 0, gapLength = 0, lineCap: LineCapStyle = LineCapStyle.LINECAP_DEFAULT, lineJoin: LineJoinStyle = LineJoinStyle.LINEJOIN_DEFAULT, opacity = -1, color = -1): void {
    switch (style) {
      case PenStyle.PEN_DOT:
        dashLength = dashLength ? dashLength : 1;
        gapLength = gapLength ? gapLength : width * 3;
        break;
      case PenStyle.PEN_LONG_DASH:
        dashLength = dashLength ? dashLength : width * 4;
        gapLength = gapLength ? gapLength : width * 3;
        break;
      case PenStyle.PEN_SHORT_DASH:
        dashLength = dashLength ? dashLength : width * 2;
        gapLength = gapLength ? gapLength : width * 3;
        break;
      default: break;
    }
    this.m_penStack.push(new Pen(width, style, dashLength, gapLength, lineCap, lineJoin, opacity, color));
  }
  public ResetPen(): void { this.m_penStack.pop(); }
  public SetPushBack(): void { this.m_pushBack = true; }
  public ResetPushBack(): void { this.m_pushBack = false; }
  public DeactivateGraphic(): void {
    if (this.m_isDeactivatedX || this.m_isDeactivatedY) throw new Error('Graphic is already deactivated.');
    this.m_isDeactivatedX = true;
    this.m_isDeactivatedY = true;
  }
  public DeactivateGraphicX(): void {
    if (this.m_isDeactivatedX || this.m_isDeactivatedY) throw new Error('Graphic is already deactivated.');
    this.m_isDeactivatedX = true;
  }
  public DeactivateGraphicY(): void {
    if (this.m_isDeactivatedX || this.m_isDeactivatedY) throw new Error('Graphic is already deactivated.');
    this.m_isDeactivatedY = true;
  }
  public ReactivateGraphic(): void {
    if (!this.m_isDeactivatedX && !this.m_isDeactivatedY) throw new Error('Graphic is not deactivated.');
    this.m_isDeactivatedY = false;
    this.m_isDeactivatedX = false;
  }
  public SetFont(font: FontInfo): void {
    // Canonical DeviceContext::SetFont: inherit point size when the new font has none.
    if (this.m_fontStack.length > 0 && font.GetPointSize() === 0) {
      font.SetPointSize(this.m_fontStack[this.m_fontStack.length - 1].GetPointSize());
    }
    this.m_fontStack.push(font);
  }
  public ResetFont(): void { this.m_fontStack.pop(); }
  public GetFont(): FontInfo {
    const font = this.m_fontStack[this.m_fontStack.length - 1];
    if (!font) throw new Error('DeviceContext font stack is empty.');
    return font;
  }
  public HasFont(): boolean { return this.m_fontStack.length > 0; }
  public GetTextExtent(text: string, extend: TextExtend, typeSize: boolean): void {
    if (this.m_dependencies.GetTextExtent) {
      this.m_dependencies.GetTextExtent(text, extend, typeSize);
      return;
    }
    this.GetTextExtentFromResources(Array.from(text).map((c) => c.codePointAt(0)!), extend, typeSize, false);
  }
  public GetTextExtentFromCodePoints(codePoints: number[], extend: TextExtend, typeSize: boolean): void {
    if (this.m_dependencies.GetTextExtent) {
      this.m_dependencies.GetTextExtent(String.fromCodePoint(...codePoints), extend, typeSize);
      return;
    }
    this.GetTextExtentFromResources(codePoints, extend, typeSize, false);
  }
  public GetSmuflTextExtent(text: string | number[], extend: TextExtend): void {
    if (this.m_dependencies.GetSmuflTextExtent) {
      this.m_dependencies.GetSmuflTextExtent(text, extend);
      return;
    }
    // Callers pass either a string or a UTF-32 code point array (C++ std::u32string).
    const codePoints = typeof text === 'string' ? Array.from(text).map((c) => c.codePointAt(0)!) : [...text];
    this.GetTextExtentFromResources(codePoints, extend, true, true);
  }

  /** Canonical DeviceContext::GetTextExtent/GetSmuflTextExtent from devicecontext.cpp. */
  private GetTextExtentFromResources(codePoints: number[], extend: TextExtend, typeSize: boolean, smuflOnly: boolean): void {
    if (this.m_fontStack.length === 0) throw new Error('DeviceContext font stack is empty.');
    const resources = this.m_resources;
    if (!resources) throw new Error('DeviceContext resources are not set.');
    extend.m_width = 0;
    extend.m_height = 0;
    if (typeSize && !smuflOnly) {
      this.AddGlyphToTextExtend(resources.GetTextGlyph('p'.codePointAt(0)!)!, extend);
      this.AddGlyphToTextExtend(resources.GetTextGlyph('M'.codePointAt(0)!)!, extend);
      extend.m_width = 0;
    }
    const unknown = !smuflOnly ? resources.GetTextGlyph('o'.codePointAt(0)!) : null;
    for (const c of codePoints) {
      let glyph: ExtentGlyphLike | null = smuflOnly ? resources.GetGlyph(c) : resources.GetTextGlyph(c);
      if (!glyph && !smuflOnly) glyph = resources.GetGlyph(c);
      if (!glyph) {
        if (c === 0x20) {
          glyph = resources.GetTextGlyph('.'.codePointAt(0)!)!;
        }
        else {
          glyph = unknown;
        }
      }
      if (!glyph) continue;
      this.AddGlyphToTextExtend(glyph, extend);
    }
  }

  /** Canonical DeviceContext::AddGlyphToTextExtend from devicecontext.cpp. */
  public AddGlyphToTextExtend(glyph: ExtentGlyphLike, extend: TextExtend): void {
    if (!glyph || !extend) throw new Error('AddGlyphToTextExtend requires a glyph and extend.');
    const font = this.GetFont();
    const box = glyph.GetBoundingBox();
    const units = glyph.GetUnitsPerEm();
    const pointSize = font.GetPointSize();
    const partialWidth = Math.ceil(box.w * pointSize / units);
    const partialHeight = Math.ceil(box.h * pointSize / units);
    const y = Math.ceil(box.y * pointSize / units);
    const advX = Math.ceil(glyph.GetHorizAdvX() * pointSize / units);
    const letterSpacing = font.GetLetterSpacing();
    if (letterSpacing !== 0 && extend.m_width > 0) extend.m_width += letterSpacing;
    extend.m_width += (advX === 0) ? partialWidth : advX;
    extend.m_height = Math.max(partialHeight, extend.m_height);
    extend.m_ascent = Math.max(partialHeight + y, extend.m_ascent);
    extend.m_descent = Math.max(-y, extend.m_descent);
  }
}

function degToRad(deg: number): number { return (deg * Math.PI) / 180.0; }

/** Pure TypeScript translation of src/bboxdevicecontext.cpp. */
export class BBoxDeviceContext extends DeviceContextCompat {
  private m_update: number;
  private m_rotationOrigin = new Point();
  private m_rotationAngle = 0.0;
  private m_textX = 0;
  private m_textY = 0;
  private m_textWidth = 0;
  private m_textHeight = 0;
  private m_textAscent = 0;
  private m_textDescent = 0;
  private m_drawingText = false;
  private m_textAlignment = HORIZONTALALIGNMENT_left;
  private readonly m_objects: BBoxObjectLike[] = [];
  private readonly m_view: ViewLike;

  public constructor(view: ViewLike, width: number, height: number, update = BBOX_BOTH, dependencies: DeviceContextDependencies = {}) {
    super(ClassId.BBOX_DEVICE_CONTEXT, dependencies);
    this.m_view = view;
    this.m_width = width;
    this.m_height = height;
    this.m_update = update;
    this.ResetGraphicRotation();
  }

  public SetBackground(_color: number, _style: PenStyle = PenStyle.PEN_SOLID): void {}
  public SetBackgroundImage(_image: unknown, _opacity = 1.0): void {}
  public SetBackgroundMode(_mode: number): void {}
  public SetTextForeground(_color: number): void {}
  public SetTextBackground(_color: number): void {}
  public SetLogicalOrigin(_x: number, _y: number): void {}

  public GetLogicalOrigin(): Point { return new Point(0, 0); }
  public GetWidth(): number { return this.m_width; }
  public GetHeight(): number { return this.m_height; }
  public UpdateHorizontalValues(): boolean { return this.m_update !== BBOX_VERTICAL_ONLY; }
  public UpdateVerticalValues(): boolean { return this.m_update !== BBOX_HORIZONTAL_ONLY; }

  public StartGraphic(object: BBoxObjectLike, _gClass: string, _gId: string, _graphicID: GraphicID = GraphicID.PRIMARY, _prepend = false): void {
    object.ResetBoundingBox();
    this.m_objects.push(object);
    this.ResetGraphicRotation();
  }

  public ResumeGraphic(object: BBoxObjectLike, _gId: string): void { this.m_objects.push(object); }

  public EndGraphic(object: BBoxObjectLike, _view: ViewLike): void {
    this.assertTopObject(object);
    this.m_objects.pop();
    this.ResetGraphicRotation();
  }

  public EndResumedGraphic(object: BBoxObjectLike, _view: ViewLike): void {
    this.assertTopObject(object);
    this.m_objects.pop();
    this.ResetGraphicRotation();
  }

  // Canonical DeviceContext defaults (devicecontext.h:264-337): the BBox
  // context inherits these no-op/delegating graphic-boundary hooks in C++.
  // They must exist because View calls them unconditionally.
  public StartCustomGraphic(_name: string, _gClass = '', _gId = ''): void {}
  public EndCustomGraphic(): void {}
  public StartTextGraphic(object: BBoxObjectLike, gClass: string, gId: string): void {
    this.StartGraphic(object, gClass, gId);
  }
  public EndTextGraphic(object: BBoxObjectLike, view: ViewLike): void { this.EndGraphic(object, view); }
  public UseGlobalStyling(): boolean { return false; }

  public RotateGraphic(orig: Point, angle: number): void {
    if (!ApproximatelyEqual(this.m_rotationAngle, 0.0)) throw new Error('Graphic rotation is already active.');
    this.m_rotationAngle = angle;
    this.m_rotationOrigin = orig;
  }

  public StartPage(): void {}
  public EndPage(): void {}

  public DrawQuadBezierPath(bezier: Point[]): void {
    if (bezier.length < 3) throw new Error('Quadratic Bezier requires 3 points.');
    let pMin = Point.Min(bezier[0], bezier[2]);
    let pMax = Point.Max(bezier[0], bezier[2]);
    if (bezier[1].x < pMin.x || bezier[1].x > pMax.x || bezier[1].y < pMin.y || bezier[1].y > pMax.y) {
      const txDen = bezier[0].x - 2.0 * bezier[1].x + bezier[2].x;
      const tyDen = bezier[0].y - 2.0 * bezier[1].y + bezier[2].y;
      const tx = txDen === 0 ? 0 : Math.trunc(Math.max(0, Math.min(1, (bezier[0].x - bezier[1].x) / txDen)));
      const ty = tyDen === 0 ? 0 : Math.trunc(Math.max(0, Math.min(1, (bezier[0].y - bezier[1].y) / tyDen)));
      const sx = Math.trunc(1.0 - tx);
      const sy = Math.trunc(1.0 - ty);
      const qx = sx * sx * bezier[0].x + 2.0 * sx * tx * bezier[1].x + tx * tx * bezier[2].x;
      const qy = sy * sy * bezier[0].y + 2.0 * sy * ty * bezier[1].y + ty * ty * bezier[2].y;
      pMin = Point.Min(pMin, new Point(qx, qy));
      pMax = Point.Max(pMax, new Point(qx, qy));
    }
    this.UpdateBB(pMin.x, pMin.y, pMax.x, pMax.y);
  }

  public DrawCubicBezierPath(bezier: Point[]): void {
    if (bezier.length < 4) throw new Error('Cubic Bezier requires 4 points.');
    const box = BoundingBox.ApproximateBezierBoundingBox(bezier.slice(0, 4).map(p => ({ x: p.x, y: p.y })), { x: 0, y: 0 }, 0, 0, 0, 0);
    this.UpdateBB(box.pos.x, box.pos.y, box.pos.x + box.width, box.pos.y + box.height);
  }

  public DrawCubicBezierPathFilled(bezier1: Point[], bezier2: Point[]): void {
    if (bezier1.length < 4 || bezier2.length < 4) throw new Error('Filled cubic Bezier requires two 4-point curves.');
    for (const curve of [bezier1, bezier2]) {
      const box = BoundingBox.ApproximateBezierBoundingBox(curve.slice(0, 4).map(p => ({ x: p.x, y: p.y })), { x: 0, y: 0 }, 0, 0, 0, 0);
      this.UpdateBB(box.pos.x, box.pos.y, box.pos.x + box.width, box.pos.y + box.height);
    }
  }

  public DrawBentParallelogramFilled(side: Point[], height: number): void {
    if (side.length < 4) throw new Error('Parallelogram requires 4 points.');
    this.UpdateBB(Math.trunc(side[0].x), Math.trunc(side[0].y), Math.trunc(side[3].x), Math.trunc(side[3].y + height));
  }

  public DrawCircle(x: number, y: number, radius: number): void { this.DrawEllipse(x - radius, y - radius, 2 * radius, 2 * radius); }
  public DrawEllipse(x: number, y: number, width: number, height: number): void { this.UpdateBB(Math.trunc(x), Math.trunc(y), Math.trunc(x + width), Math.trunc(y + height)); }

  public DrawEllipticArc(x: number, y: number, width: number, height: number, _start: number, _end: number): void {
    const [p1, p2] = this.GetPenWidthOverlap();
    this.UpdateBB(Math.trunc(x) - p1, Math.trunc(y) - p2, Math.trunc(x + width) + p2, Math.trunc(y + height) + p1);
  }

  public DrawLine(x1: number, y1: number, x2: number, y2: number): void {
    if (x1 > x2) [x1, x2] = [x2, x1];
    if (y1 > y2) [y1, y2] = [y2, y1];
    const [p1, p2] = this.GetPenWidthOverlap();
    this.UpdateBB(Math.trunc(x1) - p1, Math.trunc(y1) - p2, Math.trunc(x2) + p2, Math.trunc(y2) + p1);
  }

  public DrawPolyline(n: number, points: Point[], _close: boolean): void { this.DrawPolygon(n, points); }

  public DrawPolygon(n: number, points: Point[]): void {
    if (n === 0) return;
    let x1 = points[0].x, x2 = x1, y1 = points[0].y, y2 = y1;
    for (let i = 0; i < n; ++i) {
      x1 = Math.min(x1, points[i].x);
      x2 = Math.max(x2, points[i].x);
      y1 = Math.min(y1, points[i].y);
      y2 = Math.max(y2, points[i].y);
    }
    const [p1, p2] = this.GetPenWidthOverlap();
    this.UpdateBB(Math.trunc(x1) - p1, Math.trunc(y1) - p2, Math.trunc(x2) + p2, Math.trunc(y2) + p1);
  }

  public DrawRectangle(x: number, y: number, width: number, height: number): void { this.DrawRoundedRectangle(x, y, width, height, 0); }

  public DrawRoundedRectangle(x: number, y: number, width: number, height: number, _radius: number): void {
    if (height < 0) { height = -height; y -= height; }
    if (width < 0) { width = -width; x -= width; }
    const [p1, p2] = this.GetPenWidthOverlap();
    this.UpdateBB(Math.trunc(x) - p1, Math.trunc(y) - p2, Math.trunc(x + width) + p2, Math.trunc(y + height) + p1);
  }

  public DrawPlaceholder(x: number, y: number): void { this.UpdateBB(Math.trunc(x), Math.trunc(y), Math.trunc(x), Math.trunc(y)); }

  public StartText(x: number, y: number, alignment = HORIZONTALALIGNMENT_left): void {
    if (this.m_drawingText) throw new Error('StartText called while already drawing text.');
    this.m_drawingText = true;
    this.m_textX = x;
    this.m_textY = y;
    this.m_textWidth = 0;
    this.m_textHeight = 0;
    this.m_textAscent = 0;
    this.m_textDescent = 0;
    this.m_textAlignment = alignment;
  }

  public EndText(): void { this.m_drawingText = false; }

  public MoveTextTo(x: number, y: number, alignment: number): void {
    if (!this.m_drawingText) throw new Error('MoveTextTo called outside text drawing.');
    this.m_textX = x;
    this.m_textY = y;
    this.m_textWidth = 0;
    this.m_textHeight = 0;
    this.m_textAscent = 0;
    this.m_textDescent = 0;
    if (alignment !== HORIZONTALALIGNMENT_NONE) this.m_textAlignment = alignment;
  }

  public MoveTextVerticallyTo(_y: number): void {
    if (!this.m_drawingText) throw new Error('MoveTextVerticallyTo called outside text drawing.');
  }

  public DrawText(text: string, wtext: string | number[] = '', x = VRV_UNSET, y = VRV_UNSET, width = VRV_UNSET, height = VRV_UNSET): void {
    const font = this.GetFont();
    if (x !== 0 && y !== 0 && x !== VRV_UNSET && y !== VRV_UNSET && width !== 0 && height !== 0 && width !== VRV_UNSET && height !== VRV_UNSET) {
      this.m_textX = x; this.m_textY = y; this.m_textWidth = width; this.m_textHeight = height;
      this.m_textAscent = 0; this.m_textDescent = 0;
      this.UpdateBB(this.m_textX, this.m_textY, this.m_textX + this.m_textWidth, this.m_textY + this.m_textHeight);
      return;
    }
    if (x !== VRV_UNSET && y !== VRV_UNSET) {
      this.m_textX = x; this.m_textY = y; this.m_textWidth = 0; this.m_textHeight = 0;
      this.m_textAscent = 0; this.m_textDescent = 0;
    }
    const extend = new TextExtend();
    const rawText = wtext;
    // C++ passes std::u32string here; TS callers may pass a code-point
    // array (View.DrawText forwards str) or a plain string.
    const rawPoints = typeof rawText === 'string' ? Array.from(rawText).map((c) => c.codePointAt(0)!) : [...rawText];
    if (font.GetSmuflFont()) this.GetSmuflTextExtent(rawPoints, extend);
    else this.GetTextExtentFromCodePoints(rawPoints, extend, true);
    this.m_textWidth += extend.m_width;
    this.m_textAscent = Math.max(this.m_textAscent, extend.m_ascent);
    this.m_textDescent = Math.max(this.m_textDescent, extend.m_descent);
    this.m_textHeight = this.m_textAscent + this.m_textDescent;
    if (this.m_textAlignment === HORIZONTALALIGNMENT_right) this.m_textX -= extend.m_width;
    else if (this.m_textAlignment === HORIZONTALALIGNMENT_center) this.m_textX -= Math.trunc(extend.m_width / 2);
    this.UpdateBB(this.m_textX, this.m_textY + this.m_textDescent, this.m_textX + this.m_textWidth, this.m_textY - this.m_textAscent);
  }

  public DrawRotatedText(_text: string, _x: number, _y: number, _angle: number): void {}

  public DrawMusicText(text: string | number[], x: number, y: number, setSmuflGlyph = false): void {
    const font = this.GetFont();
    const resources = this.GetResources(true)!;
    let lastCharWidth = 0;
    let smuflGlyph = 0;
    // C++ takes std::u32string; TS callers pass a code-point array (View.DrawSmuflCode).
    const codePoints = typeof text === 'string' ? Array.from(text).map((c) => c.codePointAt(0)!) : [...text];
    if (setSmuflGlyph && codePoints.length === 1) smuflGlyph = codePoints[0] ?? 0;
    for (const code of codePoints) {
      const glyph = resources.GetGlyph(code);
      if (!glyph) continue;
      const box = glyph.GetBoundingBox();
      const pointSize = font.GetPointSize();
      const advX = glyph.GetHorizAdvX();
      const units = glyph.GetUnitsPerEm();
      // C++ glyph metrics and font point size are ints: divide before adding
      // the device origin (especially important after the Y-axis flip).
      const xOff = Math.trunc(x) + Math.trunc(box.x * pointSize / units);
      const yOff = Math.trunc(y) - Math.trunc(box.y * pointSize / units);
      this.UpdateBB(
        xOff,
        yOff,
        xOff + Math.trunc(box.w * pointSize / units),
        yOff - Math.trunc(box.h * pointSize / units),
        smuflGlyph,
      );
      lastCharWidth = Math.trunc(advX * pointSize / units);
      x += lastCharWidth;
    }
  }

  public DrawSpline(_n: number, _points: Point[]): void {}
  public DrawGraphicUri(x: number, y: number, width: number, height: number, _uri: string): void { this.DrawRoundedRectangle(x, y, width, height, 0); }
  public DrawSvgShape(x: number, y: number, width: number, height: number, _scale: number, _svg: unknown): void { this.DrawRoundedRectangle(x, y, width, height, 0); }
  public DrawBackgroundImage(_x = 0, _y = 0): void {}
  public AddDescription(_text: string): void {}

  private UpdateBB(x1: number, y1: number, x2: number, y2: number, glyph = 0): void {
    if (this.m_isDeactivatedX && this.m_isDeactivatedY) return;
    if (!ApproximatelyEqual(this.m_rotationAngle, 0.0)) {
      const p1 = BoundingBox.CalcPositionAfterRotation({ x: x1, y: y1 }, degToRad(this.m_rotationAngle), { x: this.m_rotationOrigin.x, y: this.m_rotationOrigin.y });
      const p2 = BoundingBox.CalcPositionAfterRotation({ x: x2, y: y2 }, degToRad(this.m_rotationAngle), { x: this.m_rotationOrigin.x, y: this.m_rotationOrigin.y });
      x1 = p1.x; y1 = p1.y; x2 = p2.x; y2 = p2.y;
    }
    if (this.m_objects.length === 0) throw new Error('UpdateBB requires an active graphic object.');
    const object = this.m_objects[this.m_objects.length - 1];
    if (!this.m_isDeactivatedX) {
      object.UpdateSelfBBoxX(this.m_view.ToLogicalX(x1), this.m_view.ToLogicalX(x2));
      if (glyph !== 0) object.SetBoundingBoxGlyph(glyph, this.GetFont().GetPointSize());
    }
    if (!this.m_isDeactivatedY) {
      object.UpdateSelfBBoxY(this.m_view.ToLogicalY(y1), this.m_view.ToLogicalY(y2));
      if (glyph !== 0) object.SetBoundingBoxGlyph(glyph, this.GetFont().GetPointSize());
    }
    for (const current of this.m_objects) {
      if (!this.m_isDeactivatedX) current.UpdateContentBBoxX(this.m_view.ToLogicalX(x1), this.m_view.ToLogicalX(x2));
      if (!this.m_isDeactivatedY) current.UpdateContentBBoxY(this.m_view.ToLogicalY(y1), this.m_view.ToLogicalY(y2));
    }
  }

  private ResetGraphicRotation(): void {
    this.m_rotationAngle = 0.0;
    this.m_rotationOrigin = new Point(0, 0);
  }

  private GetPenWidthOverlap(): [number, number] {
    const penWidth = this.m_penStack[this.m_penStack.length - 1].GetWidth();
    let p1 = Math.trunc(penWidth / 2);
    const p2 = p1;
    if (penWidth % 2) ++p1;
    return [p1, p2];
  }

  private assertTopObject(object: BBoxObjectLike): void {
    if (this.m_objects.length === 0 || this.m_objects[this.m_objects.length - 1] !== object) throw new Error('Graphic stack mismatch.');
  }
}
