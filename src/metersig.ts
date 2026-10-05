/**
 * Pure TypeScript translation of Verovio's `src/metersig.cpp` /
 * `include/vrv/metersig.h`.
 *
 * `MeterSig` models the MEI `<meterSig>` element.
 *
 * C++ multiple inheritance (LayerElement + AttColor + AttEnclosingChars +
 * AttExtSymNames + AttMeterSigLog + AttMeterSigVis + AttTypography +
 * AttVisibility) is represented through explicit composition with forwarding
 * surfaces.
 */
import { ClassId, FunctorCode, data_DURATION } from './vrvdef.js';
import { DURATION_1, DURATION_2, DURATION_4, DURATION_8, DURATION_16, DURATION_32 } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, VrvObject } from './object.js';
import { InstColor, InstEnclosingChars, InstMeterSigLog, InstTypography, InstVisibility } from './atts_shared.js';
import { InstMeterSigVis } from './atts_visual.js';
import { InstExtSymNames } from './atts_externalsymbols.js';
import { MeterCountSign } from './libmei-att.js';
import {
  SMUFL_E08A_timeSigCommon, SMUFL_E08B_timeSigCutCommon,
  SMUFL_E092_timeSigParensLeftSmall, SMUFL_E093_timeSigParensRightSmall,
  SMUFL_E094_timeSigParensLeft, SMUFL_E095_timeSigParensRight,
  SMUFL_EC80_timeSigBracketLeft, SMUFL_EC81_timeSigBracketRight,
  SMUFL_EC82_timeSigBracketLeftSmall, SMUFL_EC83_timeSigBracketRightSmall,
} from './smufl.js';
import { ENCLOSURE_brack, ENCLOSURE_paren } from './accid.js';

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_COLOR = 109;
const ATT_ENCLOSINGCHARS = 129;
const ATT_EXTSYMNAMES = 47;
const ATT_METERSIGLOG = 163;
const ATT_METERSIGVIS = 271;
const ATT_TYPOGRAPHY = 225;
const ATT_VISIBILITY = 228;

// data_METERSIGN ordinals (libmei/dist/atttypes.h).
export const METERSIGN_NONE = 0;
export const METERSIGN_common = 1;
export const METERSIGN_cut = 2;

/** Structural contract for the document resources lookup. */
export interface MeterSigResourcesLike {
  GetGlyph(code: number): unknown;
  GetGlyphCode(name: string): number;
}

/**
 * Pure TypeScript translation of Verovio's `MeterSig`.
 */
export class MeterSig extends LayerElement {
  private color?: InstColor;
  private enclosingChars?: InstEnclosingChars;
  private extSymNames?: InstExtSymNames;
  private meterSigLog?: InstMeterSigLog;
  private meterSigVis?: InstMeterSigVis;
  private typography?: InstTypography;
  private visibility?: InstVisibility;

  public constructor() {
    super(ClassId.METERSIG);
    this.ensureAttributes();
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_ENCLOSINGCHARS);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.RegisterAttClass(ATT_METERSIGLOG);
    this.RegisterAttClass(ATT_METERSIGVIS);
    this.RegisterAttClass(ATT_TYPOGRAPHY);
    this.RegisterAttClass(ATT_VISIBILITY);
    this.Reset();
  }

  private ensureAttributes(): void {
    this.color ??= new InstColor();
    this.enclosingChars ??= new InstEnclosingChars();
    this.extSymNames ??= new InstExtSymNames();
    this.meterSigLog ??= new InstMeterSigLog();
    this.meterSigVis ??= new InstMeterSigVis();
    this.typography ??= new InstTypography();
    this.visibility ??= new InstVisibility();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.color!.ResetColor();
    this.enclosingChars!.ResetEnclosingChars();
    this.extSymNames!.ResetExtSymNames();
    this.meterSigLog!.ResetMeterSigLog();
    this.meterSigVis!.ResetMeterSigVis();
    this.typography!.ResetTypography();
    this.visibility!.ResetVisibility();
  }

  public override Clone(): VrvObject {
    const clone = new MeterSig();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all attribute members (composition
    // adaptation: AssignFrom covers only the object-tree state).
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasEnclose()) clone.SetEnclose(this.GetEnclose());
    if (this.HasGlyphName()) clone.SetGlyphName(this.GetGlyphName());
    if (this.HasGlyphNum()) clone.SetGlyphNum(this.GetGlyphNum());
    if (this.HasCount()) clone.SetCount(this.GetCount());
    if (this.HasSym()) clone.SetSym(this.GetSym());
    if (this.HasUnit()) clone.SetUnit(this.GetUnit());
    if (this.HasForm()) clone.SetForm(this.GetForm());
    if (this.HasVisible()) clone.SetVisible(this.GetVisible());
    if (this.HasFontfam()) clone.SetFontfam(this.GetFontfam());
    if (this.HasFontname()) clone.SetFontname(this.GetFontname());
    if (this.HasFontsize()) clone.SetFontsize(this.GetFontsize());
    if (this.HasFontstyle()) clone.SetFontstyle(this.GetFontstyle());
    if (this.HasFontweight()) clone.SetFontweight(this.GetFontweight());
    if (this.HasLetterspacing()) clone.SetLetterspacing(this.GetLetterspacing());
    if (this.HasLineheight()) clone.SetLineheight(this.GetLineheight());
    return clone;
  }

  public override GetClassName(): string { return 'meterSig'; }

  /** Override the method since alignment is required. */
  public override HasToBeAligned(): boolean { return true; }

  /** Override the method since check is required. */
  public override IsScoreDefElement(): boolean {
    return !!(this.GetParent() && this.GetFirstAncestor(ClassId.SCOREDEF));
  }

  /** Evaluate additive meter counts. */
  public GetTotalCount(): number {
    const [counts, sign] = this.GetCount() as [number[], MeterCountSign];
    // If @count is empty, look at the sym to return a reasonable value
    if (!counts || counts.length === 0) {
      if (this.HasSym()) {
        return (this.GetSym() === METERSIGN_cut) ? 2 : 4;
      }
      else {
        return 0;
      }
    }
    switch (sign) {
      case MeterCountSign.Slash: {
        // make sure that there is no division by zero
        for (let i = 0; i < counts.length; ++i) {
          if (!counts[i]) counts[i] = 1;
        }
        let result = counts[0];
        for (let i = 1; i < counts.length; ++i) {
          result = Math.trunc(result / counts[i]);
        }
        if (!result) result = 1;
        return result;
      }
      case MeterCountSign.Minus: {
        let result = counts[0];
        for (let i = 1; i < counts.length; ++i) {
          result -= counts[i];
        }
        if (result <= 0) result = 1;
        return result;
      }
      case MeterCountSign.Asterisk: {
        let result = 1;
        for (const count of counts) {
          result *= count;
        }
        if (!result) result = 1;
        return result;
      }
      case MeterCountSign.Plus: {
        let result = 0;
        for (const count of counts) {
          result += count;
        }
        return result;
      }
      case MeterCountSign.None:
      default: break;
    }

    return counts[0];
  }

  /** Return the implicit unit according to the sym (if any, return 0 otherwise). */
  public GetSymImplicitUnit(): number {
    if (this.HasSym()) {
      return (this.GetSym() === METERSIGN_cut) ? 2 : 4;
    }
    else {
      return 0;
    }
  }

  /**
   * Return the unit (int) as data_DURATION (up to 32).
   * Return DURATION_4 if no match.
   */
  public GetUnitAsDur(): data_DURATION {
    switch (this.GetUnit()) {
      case 1: return DURATION_1;
      case 2: return DURATION_2;
      case 4: return DURATION_4;
      case 8: return DURATION_8;
      case 16: return DURATION_16;
      case 32: return DURATION_32;
      default: return DURATION_4;
    }
  }

  /** Retrieves the symbol glyph. */
  public GetSymbolGlyph(): number {
    let glyph = 0;
    const resources = this.GetDocResources() as unknown as MeterSigResourcesLike | null;

    // If there is glyph.num, prioritize it
    if (this.HasGlyphNum()) {
      glyph = this.GetGlyphNum();
      if (resources && resources.GetGlyph(glyph)) return glyph;
    }
    // If there is glyph.name (second priority)
    else if (this.HasGlyphName()) {
      glyph = resources!.GetGlyphCode(this.GetGlyphName());
      if (resources!.GetGlyph(glyph)) return glyph;
    }

    switch (this.GetSym()) {
      case METERSIGN_common: glyph = SMUFL_E08A_timeSigCommon; break;
      case METERSIGN_cut: glyph = SMUFL_E08B_timeSigCutCommon; break;
      default: break;
    }
    return glyph;
  }

  /** Retrieve parentheses from the enclose attribute. */
  public GetEnclosingGlyphs(smallGlyph: boolean): [number, number] {
    if (this.GetEnclose() === ENCLOSURE_brack) {
      if (smallGlyph) {
        return [SMUFL_EC82_timeSigBracketLeftSmall, SMUFL_EC83_timeSigBracketRightSmall];
      }
      else {
        return [SMUFL_EC80_timeSigBracketLeft, SMUFL_EC81_timeSigBracketRight];
      }
    }
    else if (this.GetEnclose() === ENCLOSURE_paren) {
      if (smallGlyph) {
        return [SMUFL_E092_timeSigParensLeftSmall, SMUFL_E093_timeSigParensRightSmall];
      }
      else {
        return [SMUFL_E094_timeSigParensLeft, SMUFL_E095_timeSigParensRight];
      }
    }
    return [0, 0];
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitMeterSig');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitMeterSigEnd');
  }

  private visit(functor: unknown, method: string): FunctorCode {
    const f = functor as Record<string, unknown>;
    const fn = f[method];
    if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, this);
    if (typeof f['VisitObject'] === 'function') {
      return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  //---------//
  // AttColor forwarding surface
  //---------//
  public ResetColor(): void { this.color!.ResetColor(); }
  public SetColor(value: string): void { this.color!.SetColor(value); }
  public GetColor(): string { return this.color!.GetColor(); }
  public HasColor(): boolean { return this.color!.GetColor() !== ''; }

  //---------//
  // AttEnclosingChars forwarding surface
  //---------//
  public ResetEnclosingChars(): void { this.enclosingChars!.ResetEnclosingChars(); }
  public SetEnclose(value: number): void { this.enclosingChars!.SetEnclose(value); }
  public GetEnclose(): number { return this.enclosingChars!.GetEnclose(); }
  public HasEnclose(): boolean { return this.enclosingChars!.HasEnclose(); }

  //---------//
  // AttExtSymNames forwarding surface
  //---------//
  public ResetExtSymNames(): void { this.extSymNames!.ResetExtSymNames(); }
  public SetGlyphName(value: string): void { this.extSymNames!.SetGlyphName(value); }
  public GetGlyphName(): string { return this.extSymNames!.GetGlyphName(); }
  public HasGlyphName(): boolean { return this.extSymNames!.GetGlyphName() !== ''; }
  public SetGlyphNum(value: number): void { this.extSymNames!.SetGlyphNum(value); }
  public GetGlyphNum(): number { return this.extSymNames!.GetGlyphNum(); }
  public HasGlyphNum(): boolean { return this.extSymNames!.GetGlyphNum() !== 0; }

  //---------//
  // AttMeterSigLog forwarding surface (count/sym/unit)
  //---------//
  public ResetMeterSigLog(): void { this.meterSigLog!.ResetMeterSigLog(); }
  public SetCount(value: [number[], MeterCountSign] | { count: number[]; sign: MeterCountSign }): void {
    const counts = Array.isArray(value) ? value[0] : value.count;
    const sign = Array.isArray(value) ? value[1] : value.sign;
    // C++ HasMeterCount compares against empty pair: ([], None) is unset.
    // Copying an empty count must not mark it set (kills meter.count="").
    if ((!counts || counts.length === 0) && (sign === undefined || sign === null || sign === MeterCountSign.None)) {
      this.meterSigLog!.ResetMeterSigLogKeepSymUnit?.();
      return;
    }
    this.meterSigLog!.SetCount([counts ? counts.slice() : [], sign]);
  }
  public GetCount(): [number[], MeterCountSign] { return this.meterSigLog!.GetCount(); }
  public HasCount(): boolean { return this.meterSigLog!.HasCount(); }
  public SetSym(value: number): void { this.meterSigLog!.SetSym(value); }
  public GetSym(): number { return this.meterSigLog!.GetSym(); }
  public HasSym(): boolean { return this.meterSigLog!.HasSym(); }
  public SetUnit(value: number): void { this.meterSigLog!.SetUnit(value); }
  public GetUnit(): number { return this.meterSigLog!.GetUnit(); }
  public HasUnit(): boolean { return this.meterSigLog!.HasUnit(); }

  //---------//
  // AttMeterSigVis forwarding surface (form)
  //---------//
  public ResetMeterSigVis(): void { this.meterSigVis!.ResetMeterSigVis(); }
  public SetForm(value: number): void { this.meterSigVis!.SetForm(value); }
  public GetForm(): number { return this.meterSigVis!.GetForm(); }
  public HasForm(): boolean { return this.meterSigVis!.HasForm(); }

  //---------//
  // AttTypography forwarding surface
  //---------//
  public ResetTypography(): void { this.typography!.ResetTypography(); }
  public SetFontfam(value: string): void { this.typography!.SetFontfam(value); }
  public GetFontfam(): string { return this.typography!.GetFontfam(); }
  public HasFontfam(): boolean { return this.typography!.HasFontfam(); }
  public SetFontname(value: string): void { this.typography!.SetFontname(value); }
  public GetFontname(): string { return this.typography!.GetFontname(); }
  public HasFontname(): boolean { return this.typography!.HasFontname(); }
  public SetFontsize(value: unknown): void { this.typography!.SetFontsize(value); }
  public GetFontsize(): unknown { return this.typography!.GetFontsize(); }
  public HasFontsize(): boolean { return this.typography!.HasFontsize(); }
  public SetFontstyle(value: number): void { this.typography!.SetFontstyle(value); }
  public GetFontstyle(): number { return this.typography!.GetFontstyle(); }
  public HasFontstyle(): boolean { return this.typography!.HasFontstyle(); }
  public SetFontweight(value: number): void { this.typography!.SetFontweight(value); }
  public GetFontweight(): number { return this.typography!.GetFontweight(); }
  public HasFontweight(): boolean { return this.typography!.HasFontweight(); }
  public SetLetterspacing(value: unknown): void { this.typography!.SetLetterspacing(value); }
  public GetLetterspacing(): unknown { return this.typography!.GetLetterspacing(); }
  public HasLetterspacing(): boolean { return this.typography!.HasLetterspacing(); }
  public SetLineheight(value: unknown): void { this.typography!.SetLineheight(value); }
  public GetLineheight(): unknown { return this.typography!.GetLineheight(); }
  public HasLineheight(): boolean { return this.typography!.HasLineheight(); }

  //---------//
  // AttVisibility forwarding surface
  //---------//
  public ResetVisibility(): void { this.visibility!.ResetVisibility(); }
  public SetVisible(value: number): void { this.visibility!.SetVisible(value); }
  public GetVisible(): number { return this.visibility!.GetVisible(); }
  public HasVisible(): boolean { return this.visibility!.HasVisible(); }
}

// Factory registration (C++ `ClassRegistrar<MeterSig> s_factory("meterSig", METERSIG)`).
ObjectFactory.GetInstance().Register('meterSig', ClassId.METERSIG, () => new MeterSig());
