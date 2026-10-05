/**
 * Pure TypeScript translation of Verovio's `src/divline.cpp` / `include/vrv/divline.h`.
 *
 * `DivLine` models the MEI `<divLine>` element.
 *
 * C++ multiple inheritance (LayerElement + OffsetInterface + AttColor + AttDivLineLog +
 * AttExtSymAuth + AttExtSymNames + AttNNumberLike + AttVisibility) is represented
 * through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { OffsetInterface } from './offsetinterface.js';
import { InstColor, InstNNumberLike, InstVisibility } from './atts_shared.js';
import { InstDivLineLog, divLineLog_FORM, divLineLog_FORM_caesura, divLineLog_FORM_finalis, divLineLog_FORM_maior, divLineLog_FORM_maxima, divLineLog_FORM_minima, divLineLog_FORM_virgula } from './atts_neumes.js';
import { InstExtSymAuth, InstExtSymNames } from './atts_externalsymbols.js';
import { ObjectFactory } from './object.js';
import {
  SMUFL_E8F3_chantDivisioMinima,
  SMUFL_E8F4_chantDivisioMaior,
  SMUFL_E8F5_chantDivisioMaxima,
  SMUFL_E8F6_chantDivisioFinalis,
  SMUFL_E8F7_chantVirgula,
  SMUFL_E8F8_chantCaesura,
} from './smufl.js';

const ATT_COLOR = 109;
const ATT_DIVLINELOG = 85;
const ATT_EXTSYMAUTH = 46;
const ATT_EXTSYMNAMES = 47;
const ATT_VISIBILITY = 228;

/** Pure-TypeScript translation of Verovio's `DivLine` element. */
export class DivLine extends LayerElement {
  private offsetInterface!: OffsetInterface;
  private color!: InstColor;
  private divLineLog!: InstDivLineLog;
  private extSymAuth!: InstExtSymAuth;
  private extSymNames!: InstExtSymNames;
  private nNumberLike!: InstNNumberLike;
  private visibility!: InstVisibility;

  public constructor() {
    super(ClassId.DIVLINE);
    this.offsetInterface = new OffsetInterface();
    this.color = new InstColor();
    this.divLineLog = new InstDivLineLog();
    this.extSymAuth = new InstExtSymAuth();
    this.extSymNames = new InstExtSymNames();
    this.nNumberLike = new InstNNumberLike();
    this.visibility = new InstVisibility();

    this.RegisterInterface(this.offsetInterface.GetAttClasses(), this.offsetInterface.IsInterface());
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_DIVLINELOG);
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.RegisterAttClass(ATT_VISIBILITY);

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.offsetInterface ??= new OffsetInterface();
    this.color ??= new InstColor();
    this.divLineLog ??= new InstDivLineLog();
    this.extSymAuth ??= new InstExtSymAuth();
    this.extSymNames ??= new InstExtSymNames();
    this.nNumberLike ??= new InstNNumberLike();
    this.visibility ??= new InstVisibility();

    this.offsetInterface.Reset();
    this.color.ResetColor();
    this.divLineLog.ResetDivLineLog();
    this.extSymAuth.ResetExtSymAuth();
    this.extSymNames.ResetExtSymNames();
    this.visibility.ResetVisibility();
  }

  public override GetClassName(): string {
    return 'divLine';
  }

  public override GetOffsetInterface(): OffsetInterface {
    return this.offsetInterface;
  }

  public override HasToBeAligned(): boolean {
    return true;
  }

  public override SetAlignment(alignment: any): boolean {
    this.m_alignment = alignment;
    return alignment?.AddLayerElementRef ? alignment.AddLayerElementRef(this) : true;
  }

  /** Retrieve SMuFL string for the divLine. */
  public GetSymbolStr(): string {
    if (!this.HasForm()) return '';
    const symc = DivLine.GetDivLineGlyph(this.GetForm());
    return String.fromCodePoint(symc);
  }

  /** Method used for drawing divLine. */
  public static GetDivLineGlyph(divLine: divLineLog_FORM): number {
    let symc = SMUFL_E8F5_chantDivisioMaxima;
    switch (divLine) {
      case divLineLog_FORM_minima:
        symc = SMUFL_E8F3_chantDivisioMinima;
        break;
      case divLineLog_FORM_maior:
        symc = SMUFL_E8F4_chantDivisioMaior;
        break;
      case divLineLog_FORM_maxima:
        symc = SMUFL_E8F5_chantDivisioMaxima;
        break;
      case divLineLog_FORM_finalis:
        symc = SMUFL_E8F6_chantDivisioFinalis;
        break;
      case divLineLog_FORM_caesura:
        symc = SMUFL_E8F8_chantCaesura;
        break;
      case divLineLog_FORM_virgula:
        symc = SMUFL_E8F7_chantVirgula;
        break;
      default:
        break;
    }
    return symc;
  }

  // AttColor forwarding.
  public SetColor(value: any): void { this.color.SetColor(value); }
  public GetColor(): any { return this.color.GetColor(); }
  public HasColor(): boolean { return this.color.HasColor(); }
  public ResetColor(): void { this.color.ResetColor(); }

  // AttDivLineLog forwarding.
  public SetForm(value: any): void { this.divLineLog.SetForm(value); }
  public GetForm(): any { return this.divLineLog.GetForm(); }
  public HasForm(): boolean { return this.divLineLog.HasForm(); }
  public ResetDivLineLog(): void { this.divLineLog.ResetDivLineLog(); }

  // AttExtSymAuth forwarding.
  public SetGlyphAuth(value: any): void { this.extSymAuth.SetGlyphAuth(value); }
  public GetGlyphAuth(): any { return this.extSymAuth.GetGlyphAuth(); }
  public HasGlyphAuth(): boolean { return this.extSymAuth.HasGlyphAuth(); }
  public SetGlyphUri(value: any): void { this.extSymAuth.SetGlyphUri(value); }
  public GetGlyphUri(): any { return this.extSymAuth.GetGlyphUri(); }
  public HasGlyphUri(): boolean { return this.extSymAuth.HasGlyphUri(); }
  public ResetExtSymAuth(): void { this.extSymAuth.ResetExtSymAuth(); }

  // AttExtSymNames forwarding.
  public SetGlyphName(value: any): void { this.extSymNames.SetGlyphName(value); }
  public GetGlyphName(): any { return this.extSymNames.GetGlyphName(); }
  public HasGlyphName(): boolean { return this.extSymNames.HasGlyphName(); }
  public SetGlyphNum(value: any): void { this.extSymNames.SetGlyphNum(value); }
  public GetGlyphNum(): any { return this.extSymNames.GetGlyphNum(); }
  public HasGlyphNum(): boolean { return this.extSymNames.HasGlyphNum(); }
  public ResetExtSymNames(): void { this.extSymNames.ResetExtSymNames(); }

  // AttNNumberLike forwarding.
  public SetN(value: any): void { this.nNumberLike.SetN(value); }
  public GetN(): any { return this.nNumberLike.GetN(); }
  public HasN(): boolean { return this.nNumberLike.HasN(); }
  public ResetNNumberLike(): void { this.nNumberLike.ResetNNumberLike(); }

  // AttVisibility forwarding.
  public SetVisible(value: any): void { this.visibility.SetVisible(value); }
  public GetVisible(): any { return this.visibility.GetVisible(); }
  public HasVisible(): boolean { return this.visibility.HasVisible(); }
  public ResetVisibility(): void { this.visibility.ResetVisibility(); }

  // OffsetInterface forwarding.
  public SetHo(ho: number): void { this.offsetInterface.SetHo(ho); }
  public GetHo(): number { return this.offsetInterface.GetHo(); }
  public HasHo(): boolean { return this.offsetInterface.HasHo(); }
  public SetVo(vo: number): void { this.offsetInterface.SetVo(vo); }
  public GetVo(): number { return this.offsetInterface.GetVo(); }
  public HasVo(): boolean { return this.offsetInterface.HasVo(); }

  public override Clone(): DivLine {
    const clone = new DivLine();
    clone.AssignFrom(this);
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasForm()) clone.SetForm(this.GetForm());
    if (this.HasGlyphAuth()) clone.SetGlyphAuth(this.GetGlyphAuth());
    if (this.HasGlyphUri()) clone.SetGlyphUri(this.GetGlyphUri());
    if (this.HasGlyphName()) clone.SetGlyphName(this.GetGlyphName());
    if (this.HasGlyphNum()) clone.SetGlyphNum(this.GetGlyphNum());
    if (this.HasN()) clone.SetN(this.GetN());
    if (this.HasVisible()) clone.SetVisible(this.GetVisible());
    if (this.HasHo()) clone.SetHo(this.GetHo());
    if (this.HasVo()) clone.SetVo(this.GetVo());
    return clone;
  }
}

/** This class models the divLine related attributes of a MEI measure. */
export class DivLineAttr extends DivLine {
  public constructor() {
    super();
  }

  public override GetClassName(): string {
    return 'divLineAttr';
  }

  public override Clone(): DivLineAttr {
    const clone = new DivLineAttr();
    clone.AssignFrom(this);
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasForm()) clone.SetForm(this.GetForm());
    if (this.HasGlyphAuth()) clone.SetGlyphAuth(this.GetGlyphAuth());
    if (this.HasGlyphUri()) clone.SetGlyphUri(this.GetGlyphUri());
    if (this.HasGlyphName()) clone.SetGlyphName(this.GetGlyphName());
    if (this.HasGlyphNum()) clone.SetGlyphNum(this.GetGlyphNum());
    if (this.HasN()) clone.SetN(this.GetN());
    if (this.HasVisible()) clone.SetVisible(this.GetVisible());
    if (this.HasHo()) clone.SetHo(this.GetHo());
    if (this.HasVo()) clone.SetVo(this.GetVo());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('divLine', ClassId.DIVLINE, () => new DivLine());
