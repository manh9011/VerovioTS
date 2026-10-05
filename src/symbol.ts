/**
 * Pure TypeScript translation of Verovio's `src/symbol.cpp` / `include/vrv/symbol.h`.
 */
import { TextElement } from './textelement.js';
import { VrvObject, ObjectFactory } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { InstColor, InstTypography } from './atts_shared.js';
import { InstExtSymAuth, InstExtSymNames } from './atts_externalsymbols.js';

const ATT_COLOR = 109;
const ATT_EXTSYMAUTH = 46;
const ATT_EXTSYMNAMES = 47;
const ATT_TYPOGRAPHY = 225;

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

/**
 * Structural contract for `Resources` glyph lookup consumed by
 * `Symbol::GetSymbolGlyph()`; the canonical `resources.ts` satisfies it.
 */
export interface SymbolResourcesLike {
  GetGlyph(code: number): { /* Glyph presence is all the C++ code observes */ } | null;
  GetGlyphCode(smuflName: string): number;
}

export class Symbol extends TextElement {
  private color?: InstColor;
  private extSymAuth?: InstExtSymAuth;
  private extSymNames?: InstExtSymNames;
  private typography?: InstTypography;

  public constructor() {
    super(ClassId.SYMBOL);
    this.color = new InstColor();
    this.extSymAuth = new InstExtSymAuth();
    this.extSymNames = new InstExtSymNames();
    this.typography = new InstTypography();
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.RegisterAttClass(ATT_TYPOGRAPHY);
    this.Reset();
    ObjectFactory.GetInstance().Register('symbol', ClassId.SYMBOL, () => new Symbol());
  }

  public override Reset(): void {
    super.Reset();
    this.color?.ResetColor();
    this.extSymAuth?.ResetExtSymAuth();
    this.extSymNames?.ResetExtSymNames();
    this.typography?.ResetTypography();
  }

  public override Clone(): VrvObject {
    const clone = new Symbol();
    clone.AssignFrom(this as unknown as VrvObject);
    // Interface + attribute state is not carried by AssignFrom; copy explicitly.
    clone.SetColor(this.GetColor());
    clone.SetGlyphAuth(this.GetGlyphAuth());
    clone.SetGlyphUri(this.GetGlyphUri());
    clone.SetGlyphName(this.GetGlyphName());
    clone.SetGlyphNum(this.GetGlyphNum());
    clone.SetFontfam(this.GetFontfam());
    clone.SetFontname(this.GetFontname());
    clone.SetFontsize(this.GetFontsize());
    clone.SetFontstyle(this.GetFontstyle());
    clone.SetFontweight(this.GetFontweight());
    clone.SetLetterspacing(this.GetLetterspacing());
    return clone;
  }

  public override GetClassName(): string { return 'symbol'; }

  public override IsSupportedChild(_classId: ClassId): boolean {
    return false;
  }

  public GetSymbolGlyph(): number {
    // this.GetDocResources() is a structural mock boundary on the TS VrvObject;
    // resolve the same ancestor-doc lookup, then use the glyph contract.
    const resources = this.GetDocResources() as unknown as SymbolResourcesLike | null;
    if (!resources) return 0;

    // If there is glyph.num, prioritize it
    if (this.HasGlyphNum()) {
      const code = this.GetGlyphNum();
      if (resources.GetGlyph(code)) return code;
    }
    // If there is glyph.name (second priority)
    else if (this.HasGlyphName()) {
      const code = resources.GetGlyphCode(this.GetGlyphName());
      if (resources.GetGlyph(code)) return code;
    }

    return 0;
  }

  // AttColor forwarding surface.
  public ResetColor(): void { this.color!.ResetColor(); }
  public SetColor(color: string): void { this.color!.SetColor(color); }
  public GetColor(): string { return this.color!.GetColor(); }
  public HasColor(): boolean { return this.color!.HasColor(); }

  // AttExtSymAuth forwarding surface.
  public ResetExtSymAuth(): void { this.extSymAuth!.ResetExtSymAuth(); }
  public SetGlyphAuth(glyphAuth: string): void { this.extSymAuth!.SetGlyphAuth(glyphAuth); }
  public GetGlyphAuth(): string { return this.extSymAuth!.GetGlyphAuth(); }
  public HasGlyphAuth(): boolean { return this.extSymAuth!.HasGlyphAuth(); }
  public SetGlyphUri(glyphUri: string): void { this.extSymAuth!.SetGlyphUri(glyphUri); }
  public GetGlyphUri(): string { return this.extSymAuth!.GetGlyphUri(); }
  public HasGlyphUri(): boolean { return this.extSymAuth!.HasGlyphUri(); }

  // AttExtSymNames forwarding surface.
  public ResetExtSymNames(): void { this.extSymNames!.ResetExtSymNames(); }
  public SetGlyphName(glyphName: string): void { this.extSymNames!.SetGlyphName(glyphName); }
  public GetGlyphName(): string { return this.extSymNames!.GetGlyphName(); }
  public HasGlyphName(): boolean { return this.extSymNames!.HasGlyphName(); }
  public SetGlyphNum(glyphNum: number): void { this.extSymNames!.SetGlyphNum(glyphNum); }
  public GetGlyphNum(): number { return this.extSymNames!.GetGlyphNum(); }
  public HasGlyphNum(): boolean { return this.extSymNames!.HasGlyphNum(); }

  // AttTypography forwarding surface.
  public ResetTypography(): void { this.typography!.ResetTypography(); }
  public SetFontfam(v: string): void { this.typography!.SetFontfam(v); }
  public GetFontfam(): string { return this.typography!.GetFontfam(); }
  public HasFontfam(): boolean { return this.typography!.HasFontfam(); }
  public SetFontname(v: string): void { this.typography!.SetFontname(v); }
  public GetFontname(): string { return this.typography!.GetFontname(); }
  public HasFontname(): boolean { return this.typography!.HasFontname(); }
  public SetFontsize(v: unknown): void { this.typography!.SetFontsize(v); }
  public GetFontsize(): unknown { return this.typography!.GetFontsize(); }
  public GetFontsizeAlternate(): unknown { return this.typography!.GetFontsizeAlternate(); }
  public HasFontsize(): boolean { return this.typography!.HasFontsize(); }
  public SetFontstyle(v: number): void { this.typography!.SetFontstyle(v); }
  public GetFontstyle(): number { return this.typography!.GetFontstyle(); }
  public HasFontstyle(): boolean { return this.typography!.HasFontstyle(); }
  public SetFontweight(v: number): void { this.typography!.SetFontweight(v); }
  public GetFontweight(): number { return this.typography!.GetFontweight(); }
  public HasFontweight(): boolean { return this.typography!.HasFontweight(); }
  public SetLetterspacing(v: unknown): void { this.typography!.SetLetterspacing(v); }
  public GetLetterspacing(): unknown { return this.typography!.GetLetterspacing(); }
  public HasLetterspacing(): boolean { return this.typography!.HasLetterspacing(); }
  public SetLineheight(v: unknown): void { this.typography!.SetLineheight(v); }
  public GetLineheight(): unknown { return this.typography!.GetLineheight(); }
  public HasLineheight(): boolean { return this.typography!.HasLineheight(); }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitSymbol', this);
  }
  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitSymbol', this);
  }
  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitSymbolEnd', this);
  }
  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitSymbolEnd', this);
  }
}
