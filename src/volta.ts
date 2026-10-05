/**
 * Pure TypeScript translation of Verovio's `src/volta.cpp` / `include/vrv/volta.h`.
 *
 * `Volta` models sung text for a specific iteration of a repeated section of music.
 *
 * C++ multiple inheritance (LayerElement + OffsetInterface + AttColor + AttLang +
 * AttNNumberLike + AttTypography) is represented through explicit composition.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { OffsetInterface } from './offsetinterface.js';
import { InstColor, InstLang, InstNNumberLike, InstTypography } from './atts_shared.js';
import { ObjectFactory, VrvObject } from './object.js';

const ATT_COLOR = 109;
const ATT_LANG = 146;
const ATT_NNUMBERLIKE = 168;
const ATT_TYPOGRAPHY = 225;

/** Pure-TypeScript translation of Verovio's `Volta` element. */
export class Volta extends LayerElement {
  private offsetInterface!: OffsetInterface;
  private color!: InstColor;
  private lang!: InstLang;
  private nNumberLike!: InstNNumberLike;
  private typography!: InstTypography;

  private m_drawingVoltaN = 1;
  private m_drawingVoltaNSet = false;

  public constructor() {
    super(ClassId.VOLTA);
    this.offsetInterface = new OffsetInterface();
    this.color = new InstColor();
    this.lang = new InstLang();
    this.nNumberLike = new InstNNumberLike();
    this.typography = new InstTypography();

    this.RegisterInterface(this.offsetInterface.GetAttClasses(), this.offsetInterface.IsInterface());
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_LANG);
    this.RegisterAttClass(ATT_NNUMBERLIKE);
    this.RegisterAttClass(ATT_TYPOGRAPHY);

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.offsetInterface ??= new OffsetInterface();
    this.color ??= new InstColor();
    this.lang ??= new InstLang();
    this.nNumberLike ??= new InstNNumberLike();
    this.typography ??= new InstTypography();

    this.offsetInterface.Reset();
    this.color.ResetColor();
    this.lang.ResetLang();
    this.nNumberLike.ResetNNumberLike();
    this.typography.ResetTypography();

    this.m_drawingVoltaN = 1;
    this.m_drawingVoltaNSet = false;
  }

  public override GetClassName(): string {
    return 'volta';
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.SYL) {
      return true;
    }
    if (VrvObject.IsEditorialElement(classId)) {
      return true;
    }
    return false;
  }

  public override GetOffsetInterface(): OffsetInterface {
    return this.offsetInterface;
  }

  /** The normalized one-based alternative index used only for drawing and lyric processing. */
  public GetDrawingVoltaN(): number {
    return this.m_drawingVoltaN;
  }

  public SetDrawingVoltaN(drawingVoltaN: number): void {
    this.m_drawingVoltaN = drawingVoltaN;
    this.m_drawingVoltaNSet = true;
  }

  public HasDrawingVoltaN(): boolean {
    return this.m_drawingVoltaNSet;
  }

  public ResetDrawingVoltaN(): void {
    this.m_drawingVoltaN = 1;
    this.m_drawingVoltaNSet = false;
  }

  // AttColor forwarding.
  public SetColor(value: any): void { this.color.SetColor(value); }
  public GetColor(): any { return this.color.GetColor(); }
  public HasColor(): boolean { return this.color.HasColor(); }
  public ResetColor(): void { this.color.ResetColor(); }

  // AttLang forwarding.
  public SetLang(value: any): void { this.lang.SetLang(value); }
  public GetLang(): any { return this.lang.GetLang(); }
  public HasLang(): boolean { return this.lang.HasLang(); }
  public SetTranslit(value: any): void { this.lang.SetTranslit(value); }
  public GetTranslit(): any { return this.lang.GetTranslit(); }
  public HasTranslit(): boolean { return this.lang.HasTranslit(); }
  public ResetLang(): void { this.lang.ResetLang(); }

  // AttNNumberLike forwarding.
  public SetN(value: any): void { this.nNumberLike.SetN(value); }
  public GetN(): any { return this.nNumberLike.GetN(); }
  public HasN(): boolean { return this.nNumberLike.HasN(); }
  public ResetNNumberLike(): void { this.nNumberLike.ResetNNumberLike(); }

  // AttTypography forwarding.
  public SetFontfam(value: any): void { this.typography.SetFontfam(value); }
  public GetFontfam(): any { return this.typography.GetFontfam(); }
  public HasFontfam(): boolean { return this.typography.HasFontfam(); }
  public SetFontname(value: any): void { this.typography.SetFontname(value); }
  public GetFontname(): any { return this.typography.GetFontname(); }
  public HasFontname(): boolean { return this.typography.HasFontname(); }
  public SetFontsize(value: any): void { this.typography.SetFontsize(value); }
  public GetFontsize(): any { return this.typography.GetFontsize(); }
  public HasFontsize(): boolean { return this.typography.HasFontsize(); }
  public SetFontstyle(value: any): void { this.typography.SetFontstyle(value); }
  public GetFontstyle(): any { return this.typography.GetFontstyle(); }
  public HasFontstyle(): boolean { return this.typography.HasFontstyle(); }
  public SetFontweight(value: any): void { this.typography.SetFontweight(value); }
  public GetFontweight(): any { return this.typography.GetFontweight(); }
  public HasFontweight(): boolean { return this.typography.HasFontweight(); }
  public SetLetterspacing(value: any): void { this.typography.SetLetterspacing(value); }
  public GetLetterspacing(): any { return this.typography.GetLetterspacing(); }
  public HasLetterspacing(): boolean { return this.typography.HasLetterspacing(); }
  public SetLineheight(value: any): void { this.typography.SetLineheight(value); }
  public GetLineheight(): any { return this.typography.GetLineheight(); }
  public HasLineheight(): boolean { return this.typography.HasLineheight(); }
  public ResetTypography(): void { this.typography.ResetTypography(); }

  // OffsetInterface forwarding.
  public SetHo(ho: number): void { this.offsetInterface.SetHo(ho); }
  public GetHo(): number { return this.offsetInterface.GetHo(); }
  public HasHo(): boolean { return this.offsetInterface.HasHo(); }
  public SetVo(vo: number): void { this.offsetInterface.SetVo(vo); }
  public GetVo(): number { return this.offsetInterface.GetVo(); }
  public HasVo(): boolean { return this.offsetInterface.HasVo(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitVolta');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitVolta');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitVoltaEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitVoltaEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitLayerElement === 'function') return functor.VisitLayerElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): Volta {
    const clone = new Volta();
    clone.AssignFrom(this);
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasLang()) clone.SetLang(this.GetLang());
    if (this.HasTranslit()) clone.SetTranslit(this.GetTranslit());
    if (this.HasN()) clone.SetN(this.GetN());
    if (this.typography.HasFontfam()) clone.SetFontfam(this.GetFontfam());
    if (this.typography.HasFontname()) clone.SetFontname(this.GetFontname());
    if (this.typography.HasFontsize()) clone.SetFontsize(this.GetFontsize());
    if (this.typography.HasFontstyle()) clone.SetFontstyle(this.GetFontstyle());
    if (this.typography.HasFontweight()) clone.SetFontweight(this.GetFontweight());
    if (this.typography.HasLetterspacing()) clone.SetLetterspacing(this.GetLetterspacing());
    if (this.typography.HasLineheight()) clone.SetLineheight(this.GetLineheight());
    if (this.HasHo()) clone.SetHo(this.GetHo());
    if (this.HasVo()) clone.SetVo(this.GetVo());
    if (this.HasDrawingVoltaN()) clone.SetDrawingVoltaN(this.GetDrawingVoltaN());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('volta', ClassId.VOLTA, () => new Volta());
