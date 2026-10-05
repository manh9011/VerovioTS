/**
 * Pure TypeScript translation of Verovio's `src/rend.cpp` / `include/vrv/rend.h`.
 *
 * C++ multiple inheritance (TextElement + AreaPosInterface + AttColor + AttExtSymAuth
 * + AttLang + AttNNumberLike + AttTextRendition + AttTypography + AttWhitespace) is
 * represented through composed components with a forwarding surface.
 */
import { TextElement } from './textelement.js';
import { AreaPosInterface } from './areaposinterface.js';
import { InstColor, InstLang, InstNNumberLike, InstTextRendition, InstTypography, InstWhitespace } from './atts_shared.js';
import { InstExtSymAuth } from './atts_externalsymbols.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { VrvObject, ObjectFactory } from './object.js';

const ATT_COLOR = 109;
const ATT_EXTSYMAUTH = 46;
const ATT_LANG = 146;
const ATT_NNUMBERLIKE = 168;
const ATT_TEXTRENDITION = 215;
const ATT_TYPOGRAPHY = 225;
const ATT_WHITESPACE = 236;

// Canonical libMEI att.textrendition@rend enclosure values (attconverter.ts).
const TEXTRENDITION_NONE = 0;
const TEXTRENDITION_box = 9;
const TEXTRENDITION_circle = 10;
const TEXTRENDITION_dbox = 11;
const TEXTRENDITION_tbox = 12;

function visit(functor: unknown, method: string, self: unknown): FunctorCode {
  const fn = (functor as Record<string, unknown>)[method];
  if (typeof fn !== 'function') {
    // C++ FunctorInterface forwards unknown Visit* defaults to VisitObject;
    // structural test functors expose only VisitObject.
    const fallback = (functor as Record<string, unknown>)['VisitObject'];
    if (typeof fallback === 'function') return (fallback as (value: unknown) => FunctorCode).call(functor, self);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
  return (fn as (value: unknown) => FunctorCode).call(functor, self);
}

export class Rend extends TextElement {
  private areaPosInterface?: AreaPosInterface;
  private color?: InstColor;
  private extSymAuth?: InstExtSymAuth;
  private lang?: InstLang;
  private nNumberLike?: InstNNumberLike;
  private textRendition?: InstTextRendition;
  private typography?: InstTypography;
  private whitespace?: InstWhitespace;

  public constructor() {
    super(ClassId.REND);
    this.areaPosInterface = new AreaPosInterface();
    this.color = new InstColor();
    this.extSymAuth = new InstExtSymAuth();
    this.lang = new InstLang();
    this.nNumberLike = new InstNNumberLike();
    this.textRendition = new InstTextRendition();
    this.typography = new InstTypography();
    this.whitespace = new InstWhitespace();
    this.RegisterInterface(this.areaPosInterface.GetAttClasses(), this.areaPosInterface.IsInterface());
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_LANG);
    this.RegisterAttClass(ATT_NNUMBERLIKE);
    this.RegisterAttClass(ATT_TEXTRENDITION);
    this.RegisterAttClass(ATT_TYPOGRAPHY);
    this.RegisterAttClass(ATT_WHITESPACE);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.areaPosInterface?.Reset();
    this.color?.ResetColor();
    this.extSymAuth?.ResetExtSymAuth();
    this.lang?.ResetLang();
    this.nNumberLike?.ResetNNumberLike();
    this.textRendition?.ResetTextRendition();
    this.typography?.ResetTypography();
    this.whitespace?.ResetWhitespace();
  }

  public override Clone(): VrvObject {
    const clone = new Rend();
    clone.AssignFrom(this as unknown as VrvObject);
    // Interface + attribute state is not carried by AssignFrom; copy explicitly.
    clone.GetAreaPosInterface().SetHalign(this.GetHalign());
    clone.GetAreaPosInterface().SetValign(this.GetValign());
    clone.SetColor(this.GetColor());
    clone.SetGlyphAuth(this.GetGlyphAuth());
    clone.SetGlyphUri(this.GetGlyphUri());
    clone.SetLang(this.GetLang());
    if (this.HasTranslit()) clone.SetTranslit(this.GetTranslit());
    clone.SetN(this.GetN());
    clone.SetAltrend(this.GetAltrend());
    clone.SetRend(this.GetRend());
    clone.SetFontfam(this.GetFontfam());
    clone.SetFontname(this.GetFontname());
    clone.SetFontsize(this.GetFontsize());
    clone.SetFontstyle(this.GetFontstyle());
    clone.SetFontweight(this.GetFontweight());
    clone.SetLetterspacing(this.GetLetterspacing());
    clone.SetLineheight(this.GetLineheight());
    clone.SetSpace(this.GetSpace());
    return clone;
  }

  public override GetClassName(): string { return 'rend'; }

  public GetAreaPosInterface(): AreaPosInterface { return this.areaPosInterface!; }

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [ClassId.LB, ClassId.NUM, ClassId.REND, ClassId.SYMBOL, ClassId.TEXT];
    if (supported.includes(classId)) return true;
    if (VrvObject.IsEditorialElement(classId)) return true;
    return false;
  }

  public HasEnclosure(): boolean {
    if (!this.HasRend()) return false;
    const rend = this.GetRend() as number;
    const hasEnclosure = rend === TEXTRENDITION_box || rend === TEXTRENDITION_circle
      || rend === TEXTRENDITION_dbox || rend === TEXTRENDITION_tbox;
    return hasEnclosure;
  }

  // AreaPosInterface forwarding surface.
  public SetHalign(value: number): void { this.areaPosInterface!.SetHalign(value); }
  public GetHalign(): number { return this.areaPosInterface!.GetHalign(); }
  public HasHalign(): boolean { return this.areaPosInterface!.HasHalign(); }
  public SetValign(value: number): void { this.areaPosInterface!.SetValign(value); }
  public GetValign(): number { return this.areaPosInterface!.GetValign(); }
  public HasValign(): boolean { return this.areaPosInterface!.HasValign(); }

  // AttColor forwarding surface.
  public ResetColor(): void { this.color!.ResetColor(); }
  public SetColor(value: string): void { this.color!.SetColor(value); }
  public GetColor(): string { return this.color!.GetColor() as string; }
  public HasColor(): boolean { return this.color!.HasColor(); }

  // AttExtSymAuth forwarding surface.
  public ResetExtSymAuth(): void { this.extSymAuth!.ResetExtSymAuth(); }
  public SetGlyphAuth(value: string): void { this.extSymAuth!.SetGlyphAuth(value); }
  public GetGlyphAuth(): string { return this.extSymAuth!.GetGlyphAuth() as string; }
  public HasGlyphAuth(): boolean { return this.extSymAuth!.HasGlyphAuth(); }
  public SetGlyphUri(value: string): void { this.extSymAuth!.SetGlyphUri(value); }
  public GetGlyphUri(): string { return this.extSymAuth!.GetGlyphUri() as string; }
  public HasGlyphUri(): boolean { return this.extSymAuth!.HasGlyphUri(); }

  // AttLang forwarding surface.
  public ResetLang(): void { this.lang!.ResetLang(); }
  public SetLang(value: string): void { this.lang!.SetLang(value); }
  public GetLang(): string { return this.lang!.GetLang() as string; }
  public HasLang(): boolean { return this.lang!.HasLang(); }
  public SetTranslit(value: string): void { this.lang!.SetTranslit(value); }
  public GetTranslit(): string { return this.lang!.GetTranslit() as string; }
  public HasTranslit(): boolean { return this.lang!.HasTranslit(); }

  // AttNNumberLike forwarding surface.
  public ResetNNumberLike(): void { this.nNumberLike!.ResetNNumberLike(); }
  public SetN(value: string): void { this.nNumberLike!.SetN(value); }
  public GetN(): string { return this.nNumberLike!.GetN() as string; }
  public HasN(): boolean { return this.nNumberLike!.HasN(); }

  // AttTextRendition forwarding surface.
  public ResetTextRendition(): void { this.textRendition!.ResetTextRendition(); }
  public SetAltrend(value: string): void { this.textRendition!.SetAltrend(value); }
  public GetAltrend(): string { return this.textRendition!.GetAltrend() as string; }
  public HasAltrend(): boolean { return this.textRendition!.HasAltrend(); }
  public SetRend(value: number): void { this.textRendition!.SetRend(value); }
  public GetRend(): number { return this.textRendition!.GetRend() as number; }
  public HasRend(): boolean { return this.textRendition!.HasRend(); }

  // AttTypography forwarding surface (libMEI att.typography: fontfam, fontname,
  // fontsize, fontstyle, fontweight, letterspacing, lineheight).
  public ResetTypography(): void { this.typography!.ResetTypography(); }
  public SetFontfam(value: string): void { this.typography!.SetFontfam(value); }
  public GetFontfam(): string { return this.typography!.GetFontfam() as string; }
  public HasFontfam(): boolean { return this.typography!.HasFontfam(); }
  public SetFontname(value: string): void { this.typography!.SetFontname(value); }
  public GetFontname(): string { return this.typography!.GetFontname() as string; }
  public HasFontname(): boolean { return this.typography!.HasFontname(); }
  public SetFontsize(value: unknown): void { this.typography!.SetFontsize(value); }
  public GetFontsize(): unknown { return this.typography!.GetFontsize(); }
  public GetFontsizeAlternate(): unknown { return this.typography!.GetFontsizeAlternate(); }
  public HasFontsize(): boolean { return this.typography!.HasFontsize(); }
  public SetFontstyle(value: number): void { this.typography!.SetFontstyle(value); }
  public GetFontstyle(): number { return this.typography!.GetFontstyle() as number; }
  public HasFontstyle(): boolean { return this.typography!.HasFontstyle(); }
  public SetFontweight(value: number): void { this.typography!.SetFontweight(value); }
  public GetFontweight(): number { return this.typography!.GetFontweight() as number; }
  public HasFontweight(): boolean { return this.typography!.HasFontweight(); }
  public SetLetterspacing(value: number): void { this.typography!.SetLetterspacing(value); }
  public GetLetterspacing(): number { return this.typography!.GetLetterspacing() as number; }
  public HasLetterspacing(): boolean { return this.typography!.HasLetterspacing(); }
  public SetLineheight(value: string): void { this.typography!.SetLineheight(value); }
  public GetLineheight(): string { return this.typography!.GetLineheight() as string; }
  public HasLineheight(): boolean { return this.typography!.HasLineheight(); }

  // AttWhitespace forwarding surface (libMEI att.whitespace@xml:space → space).
  public ResetWhitespace(): void { this.whitespace!.ResetWhitespace(); }
  public SetSpace(value: string): void { this.whitespace!.SetSpace(value); }
  public GetSpace(): string { return this.whitespace!.GetSpace() as string; }
  public HasSpace(): boolean { return this.whitespace!.HasSpace(); }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitRend', this);
  }
  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitRend', this);
  }
  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitRendEnd', this);
  }
  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitRendEnd', this);
  }
}

// C++ `static const ClassRegistrar<Rend> s_factory("rend", REND);`
ObjectFactory.GetInstance().Register('rend', ClassId.REND, () => new Rend());

