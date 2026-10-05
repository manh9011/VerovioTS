/**
 * Pure TypeScript translation of Verovio's `src/clef.cpp` / `include/vrv/clef.h`.
 *
 * `Clef` models the MEI `<clef>` element.
 *
 * C++ multiple inheritance (LayerElement + OffsetInterface + AttClefLog +
 * AttClefShape + AttColor + AttEnclosingChars + AttExtSymAuth + AttExtSymNames +
 * AttLineLoc + AttOctave + AttOctaveDisplacement + AttStaffIdent + AttTypography +
 * AttVisibility) is represented through explicit composition with forwarding
 * surfaces.
 */
import { ClassId, FunctorCode, ClassIdLike } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, VrvObject } from './object.js';
import { OffsetInterface } from './offsetinterface.js';
import { IsNeumeType } from './vrv.js';
import {
  SMUFL_E050_gClef, SMUFL_E051_gClef15mb, SMUFL_E052_gClef8vb, SMUFL_E053_gClef8va,
  SMUFL_E054_gClef15ma, SMUFL_E055_gClef8vbOld, SMUFL_E05C_cClef, SMUFL_E05D_cClef8vb,
  SMUFL_E062_fClef, SMUFL_E063_fClef15mb, SMUFL_E064_fClef8vb, SMUFL_E065_fClef8va,
  SMUFL_E066_fClef15ma, SMUFL_E069_unpitchedPercussionClef1, SMUFL_E07A_gClefChange,
  SMUFL_E07B_cClefChange, SMUFL_E07C_fClefChange, SMUFL_E900_mensuralGclef,
  SMUFL_E901_mensuralGclefPetrucci, SMUFL_E902_chantFclef, SMUFL_E904_mensuralFclefPetrucci,
  SMUFL_E906_chantCclef, SMUFL_E907_mensuralCclefPetrucciPosLowest,
  SMUFL_E908_mensuralCclefPetrucciPosLow, SMUFL_E909_mensuralCclefPetrucciPosMiddle,
  SMUFL_E90A_mensuralCclefPetrucciPosHigh, SMUFL_E90B_mensuralCclefPetrucciPosHighest,
  SMUFL_E06D_6stringTabClef,
} from './smufl.js';
import {
  InstClefLog, InstClefShape, InstColor, InstEnclosingChars, InstLineLoc,
  InstOctave, InstOctaveDisplacement, InstStaffIdent, InstTypography, InstVisibility,
} from './atts_shared.js';
import { InstExtSymAuth, InstExtSymNames } from './atts_externalsymbols.js';

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_CLEFLOG = 106;
const ATT_CLEFSHAPE = 107;
const ATT_COLOR = 109;
const ATT_ENCLOSINGCHARS = 129;
const ATT_EXTSYMAUTH = 46;
const ATT_EXTSYMNAMES = 47;
const ATT_LINELOC = 149;
const ATT_OCTAVE = 172;
const ATT_OCTAVEDISPLACEMENT = 174;
const ATT_STAFFIDENT = 203;
const ATT_TYPOGRAPHY = 225;
const ATT_VISIBILITY = 228;

// Canonical libmei enum values (attconverter.ts / libmei-att.ts).
const CLEFSHAPE_G = 1;
const CLEFSHAPE_GG = 2;
const CLEFSHAPE_F = 3;
const CLEFSHAPE_C = 4;
const CLEFSHAPE_perc = 5;
const OCTAVE_DIS_NONE = 0;
const OCTAVE_DIS_8 = 8;
const OCTAVE_DIS_15 = 15;
const STAFFREL_basic_above = 1;
const NOTATIONTYPE_tab = 8;
const NOTATIONTYPE_tab_guitar = 10;
const NOTATIONTYPE_mensural = 2;
const NOTATIONTYPE_mensural_white = 4;
const NOTATIONTYPE_mensural_black = 3;

// Alignment type from horizontalaligner.h.
const ALIGNMENT_CLEF = 10;

/** Structural contract for the still-unmigrated `Resources` collaborator. */
interface ClefResourcesLike {
  GetGlyph(codeOrName: number | string): { GetCode(): number } | null;
  GetGlyphCode(name: string): number;
}

/** Structural contract for the alignment used by clef-change detection. */
interface ClefAlignmentLike {
  GetType(): number;
}

/** Pure TypeScript translation of Verovio's `Clef`. */
export class Clef extends LayerElement {
  private offset?: OffsetInterface;
  private clefLog?: InstClefLog;
  private clefShape?: InstClefShape;
  private color?: InstColor;
  private enclosing?: InstEnclosingChars;
  private extSymAuth?: InstExtSymAuth;
  private extSymNames?: InstExtSymNames;
  private lineLoc?: InstLineLoc;
  private octave?: InstOctave;
  private octaveDisplacement?: InstOctaveDisplacement;
  private staffIdent?: InstStaffIdent;
  private typography?: InstTypography;
  private visibility?: InstVisibility;

  public constructor() {
    super(ClassId.CLEF);
    this.ensureAttributes();
    this.RegisterInterface([ATT_VISUALOFFSETHO_ID, ATT_VISUALOFFSETVO_ID], InterfaceIdOffset);
    this.RegisterAttClass(ATT_CLEFLOG);
    this.RegisterAttClass(ATT_CLEFSHAPE);
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_ENCLOSINGCHARS);
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.RegisterAttClass(ATT_LINELOC);
    this.RegisterAttClass(ATT_OCTAVE);
    this.RegisterAttClass(ATT_OCTAVEDISPLACEMENT);
    this.RegisterAttClass(ATT_STAFFIDENT);
    this.RegisterAttClass(ATT_TYPOGRAPHY);
    this.RegisterAttClass(ATT_VISIBILITY);
    this.Reset();
  }

  private ensureAttributes(): void {
    this.offset ??= new OffsetInterface();
    this.clefLog ??= new InstClefLog();
    this.clefShape ??= new InstClefShape();
    this.color ??= new InstColor();
    this.enclosing ??= new InstEnclosingChars();
    this.extSymAuth ??= new InstExtSymAuth();
    this.extSymNames ??= new InstExtSymNames();
    this.lineLoc ??= new InstLineLoc();
    this.octave ??= new InstOctave();
    this.octaveDisplacement ??= new InstOctaveDisplacement();
    this.staffIdent ??= new InstStaffIdent();
    this.typography ??= new InstTypography();
    this.visibility ??= new InstVisibility();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.offset!.Reset();
    this.clefLog!.ResetClefLog();
    this.clefShape!.ResetClefShape();
    this.color!.ResetColor();
    this.enclosing!.ResetEnclosingChars();
    this.extSymAuth!.ResetExtSymAuth();
    this.extSymNames!.ResetExtSymNames();
    this.lineLoc!.ResetLineLoc();
    this.octave!.ResetOctave();
    this.octaveDisplacement!.ResetOctaveDisplacement();
    this.staffIdent!.ResetStaffIdent();
    this.typography!.ResetTypography();
    this.visibility!.ResetVisibility();
  }

  public override Clone(): VrvObject {
    const clone = new Clef();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all attribute-class state (composition
    // adaptation: AssignFrom covers only the object-tree state).
    if (this.HasShape()) clone.SetShape(this.GetShape());
    if (this.HasLine()) clone.SetLine(this.GetLine());
    if (this.HasOct()) clone.SetOct(this.GetOct());
    if (this.HasDis()) clone.SetDis(this.GetDis());
    if (this.HasDisPlace()) clone.SetDisPlace(this.GetDisPlace());
    if (this.HasCautionary()) clone.SetCautionary(this.GetCautionary());
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasEnclose()) clone.SetEnclose(this.GetEnclose());
    if (this.HasGlyphAuth()) clone.SetGlyphAuth(this.GetGlyphAuth());
    if (this.HasGlyphUri()) clone.SetGlyphUri(this.GetGlyphUri());
    if (this.HasGlyphName()) clone.SetGlyphName(this.GetGlyphName());
    if (this.HasGlyphNum()) clone.SetGlyphNum(this.GetGlyphNum());
    if (this.HasStaff()) clone.SetStaff(this.GetStaff());
    if (this.HasFontname()) clone.SetFontname(this.GetFontname());
    if (this.HasFontfam()) clone.SetFontfam(this.GetFontfam());
    if (this.HasFontsize()) clone.SetFontsize(this.GetFontsize());
    if (this.HasFontstyle()) clone.SetFontstyle(this.GetFontstyle());
    if (this.HasFontweight()) clone.SetFontweight(this.GetFontweight());
    if (this.HasLetterspacing()) clone.SetLetterspacing(this.GetLetterspacing());
    if (this.HasLineheight()) clone.SetLineheight(this.GetLineheight());
    if (this.HasVisible()) clone.SetVisible(this.GetVisible());
    if (this.HasHo()) clone.SetHo(this.GetHo());
    if (this.HasVo()) clone.SetVo(this.GetVo());
    return clone;
  }

  public override GetClassName(): string { return 'clef'; }

  public GetOffsetInterface(): OffsetInterface { this.ensureAttributes(); return this.offset!; }

  public override HasToBeAligned(): boolean { return true; }

  /** Override the method since check is required. */
  public override IsScoreDefElement(): boolean {
    // C++: this->GetParent() && this->GetFirstAncestor(SCOREDEF)
    if (!this.GetParent()) return false;
    return this.GetFirstAncestor(ClassId.SCOREDEF) !== null;
  }

  // C++ multiple inheritance: LinkingInterface::SetSameas value forwarding
  // (used by iomusxml.cpp InsertClefToLayer for #sameas clefs).
  public SetSameas(value: string): void { this.GetLinkingInterface()?.SetSameas(value); }
  public GetSameas(): string { return this.GetLinkingInterface()?.GetSameas() ?? ''; }
  public HasSameas(): boolean { return this.GetLinkingInterface()?.HasSameas() ?? false; }

  /** Return the offset of the clef. */
  public GetClefLocOffset(): number {
    // Only resolve simple sameas links to avoid infinite recursion
    const sameas = this.GetLinkingInterface()!.GetSameasLink() as Clef | null;
    if (sameas && !sameas.GetLinkingInterface()!.HasSameasLink()) {
      return sameas.GetClefLocOffset();
    }

    let offset = 0;
    let defaultOct = 4; // C clef
    if (this.GetShape() === CLEFSHAPE_G) {
      defaultOct = 4;
      offset = -4;
    }
    else if (this.GetShape() === CLEFSHAPE_GG) {
      defaultOct = 3;
      offset = 3;
    }
    else if (this.GetShape() === CLEFSHAPE_F) {
      defaultOct = 3;
      offset = 4;
    }

    if (this.HasOct()) {
      const oct = this.GetOct();
      const octDifference = oct - defaultOct;
      offset -= octDifference * 7;
    }

    offset += (this.GetLine() - 1) * 2;

    let disPlace = 0;
    if (this.HasDisPlace()) {
      disPlace = (this.GetDisPlace() === STAFFREL_basic_above) ? -1 : 1;
    }

    if ((disPlace !== 0) && this.HasDis()) {
      offset += disPlace * (this.GetDis() - 1);
    }

    return offset;
  }

  //----------------//
  // Static methods //
  //----------------//

  /**
   * Retrieves the appropriate SMuFL code for a data_CLEFSHAPE.
   * (Member method in C++ mirroring the static behavior through resources.)
   */
  public GetClefGlyph(notationType: number): number {
    const resources = this.GetDocResources() as unknown as ClefResourcesLike | null;
    const alignment = this.GetAlignment() as unknown as ClefAlignmentLike | null;
    const clefChange = Boolean(alignment && (alignment.GetType() === ALIGNMENT_CLEF));
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

    if (IsNeumeType(notationType)) {
      switch (this.GetShape()) {
        case CLEFSHAPE_F: return SMUFL_E902_chantFclef;
        case CLEFSHAPE_C: return SMUFL_E906_chantCclef;
        case CLEFSHAPE_G: return SMUFL_E900_mensuralGclef;
        default: return SMUFL_E906_chantCclef;
      }
    }

    switch (notationType) {
      case NOTATIONTYPE_tab:
      case NOTATIONTYPE_tab_guitar:
        return SMUFL_E06D_6stringTabClef;
      case NOTATIONTYPE_mensural:
      case NOTATIONTYPE_mensural_white:
        // mensural clefs
        switch (this.GetShape()) {
          case CLEFSHAPE_G: return SMUFL_E901_mensuralGclefPetrucci;
          case CLEFSHAPE_F: return SMUFL_E904_mensuralFclefPetrucci;
          case CLEFSHAPE_C:
            switch (this.GetLine()) {
              case 1: return SMUFL_E907_mensuralCclefPetrucciPosLowest;
              case 2: return SMUFL_E908_mensuralCclefPetrucciPosLow;
              case 3: return SMUFL_E909_mensuralCclefPetrucciPosMiddle;
              case 4: return SMUFL_E90A_mensuralCclefPetrucciPosHigh;
              case 5: return SMUFL_E90B_mensuralCclefPetrucciPosHighest;
            }
            return SMUFL_E909_mensuralCclefPetrucciPosMiddle;
          default: return SMUFL_E909_mensuralCclefPetrucciPosMiddle;
        }
      case NOTATIONTYPE_mensural_black:
        switch (this.GetShape()) {
          case CLEFSHAPE_C: return SMUFL_E906_chantCclef;
          case CLEFSHAPE_F: return SMUFL_E902_chantFclef;
          default:
            // G clef doesn't exist in black notation, so should never get here,
            // but just in case.
            if (!this.GetDis()) return SMUFL_E901_mensuralGclefPetrucci;
            break;
        }
        break;
    }

    // cmn clefs (default branch in C++)
    switch (this.GetShape()) {
      case CLEFSHAPE_G:
        switch (this.GetDis()) {
          case OCTAVE_DIS_8:
            return (this.GetDisPlace() === STAFFREL_basic_above) ? SMUFL_E053_gClef8va : SMUFL_E052_gClef8vb;
          case OCTAVE_DIS_15:
            return (this.GetDisPlace() === STAFFREL_basic_above) ? SMUFL_E054_gClef15ma : SMUFL_E051_gClef15mb;
          default: return (clefChange) ? SMUFL_E07A_gClefChange : SMUFL_E050_gClef;
        }
      case CLEFSHAPE_GG: return SMUFL_E055_gClef8vbOld;
      case CLEFSHAPE_F:
        switch (this.GetDis()) {
          case OCTAVE_DIS_8:
            return (this.GetDisPlace() === STAFFREL_basic_above) ? SMUFL_E065_fClef8va : SMUFL_E064_fClef8vb;
          case OCTAVE_DIS_15:
            return (this.GetDisPlace() === STAFFREL_basic_above) ? SMUFL_E066_fClef15ma : SMUFL_E063_fClef15mb;
          default: return (clefChange) ? SMUFL_E07C_fClefChange : SMUFL_E062_fClef;
        }
      case CLEFSHAPE_C:
        switch (this.GetDis()) {
          case OCTAVE_DIS_8: return SMUFL_E05D_cClef8vb;
          default: return (clefChange) ? SMUFL_E07B_cClefChange : SMUFL_E05C_cClef;
        }
      case CLEFSHAPE_perc: return SMUFL_E069_unpitchedPercussionClef1;
    }

    return 0;
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitClef');
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitClef');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitClefEnd');
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitClefEnd');
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
  // OffsetInterface forwarding
  //---------//

  public ResetVisualOffsetHo(): void { this.offset!.ResetVisualOffsetHo(); }
  public ResetVisualOffsetVo(): void { this.offset!.ResetVisualOffsetVo(); }
  public SetHo(value: number): void { this.offset!.SetHo(value); }
  public GetHo(): number { return this.offset!.GetHo(); }
  public HasHo(): boolean { return this.offset!.HasHo(); }
  public SetVo(value: number): void { this.offset!.SetVo(value); }
  public GetVo(): number { return this.offset!.GetVo(); }
  public HasVo(): boolean { return this.offset!.HasVo(); }

  //---------//
  // Attribute forwarding surfaces
  //---------//

  // AttClefLog (cautionary)
  public ResetClefLog(): void { this.clefLog!.ResetClefLog(); }
  public SetCautionary(value: any): void { this.clefLog!.SetCautionary(value); }
  public GetCautionary(): any { return this.clefLog!.GetCautionary(); }
  public HasCautionary(): boolean { return this.clefLog!.HasCautionary(); }

  // AttClefShape (shape)
  public ResetClefShape(): void { this.clefShape!.ResetClefShape(); }
  public SetShape(value: any): void { this.clefShape!.SetShape(value); }
  public GetShape(): any { return this.clefShape!.GetShape(); }
  public HasShape(): boolean { return this.clefShape!.HasShape(); }

  // AttColor
  public ResetColor(): void { this.color!.ResetColor(); }
  public SetColor(value: any): void { this.color!.SetColor(value); }
  public GetColor(): any { return this.color!.GetColor(); }
  public HasColor(): boolean { return this.color!.HasColor(); }

  // AttEnclosingChars
  public ResetEnclosingChars(): void { this.enclosing!.ResetEnclosingChars(); }
  public SetEnclose(value: any): void { this.enclosing!.SetEnclose(value); }
  public GetEnclose(): any { return this.enclosing!.GetEnclose(); }
  public HasEnclose(): boolean { return this.enclosing!.HasEnclose(); }

  // AttExtSymAuth
  public ResetExtSymAuth(): void { this.extSymAuth!.ResetExtSymAuth(); }
  public SetGlyphAuth(value: any): void { this.extSymAuth!.SetGlyphAuth(value); }
  public GetGlyphAuth(): any { return this.extSymAuth!.GetGlyphAuth(); }
  public HasGlyphAuth(): boolean { return this.extSymAuth!.HasGlyphAuth(); }
  public SetGlyphUri(value: any): void { this.extSymAuth!.SetGlyphUri(value); }
  public GetGlyphUri(): any { return this.extSymAuth!.GetGlyphUri(); }
  public HasGlyphUri(): boolean { return this.extSymAuth!.HasGlyphUri(); }

  // AttExtSymNames
  public ResetExtSymNames(): void { this.extSymNames!.ResetExtSymNames(); }
  public SetGlyphName(value: any): void { this.extSymNames!.SetGlyphName(value); }
  public GetGlyphName(): any { return this.extSymNames!.GetGlyphName(); }
  public HasGlyphName(): boolean { return this.extSymNames!.HasGlyphName(); }
  public SetGlyphNum(value: any): void { this.extSymNames!.SetGlyphNum(value); }
  public GetGlyphNum(): any { return this.extSymNames!.GetGlyphNum(); }
  public HasGlyphNum(): boolean { return this.extSymNames!.HasGlyphNum(); }

  // AttLineLoc
  public ResetLineLoc(): void { this.lineLoc!.ResetLineLoc(); }
  public SetLine(value: any): void { this.lineLoc!.SetLine(value); }
  public GetLine(): any { return this.lineLoc!.GetLine(); }
  public HasLine(): boolean { return this.lineLoc!.HasLine(); }

  // AttOctave
  public ResetOctave(): void { this.octave!.ResetOctave(); }
  public SetOct(value: any): void { this.octave!.SetOct(value); }
  public GetOct(): any { return this.octave!.GetOct(); }
  public HasOct(): boolean { return this.octave!.HasOct(); }

  // AttOctaveDisplacement
  public ResetOctaveDisplacement(): void { this.octaveDisplacement!.ResetOctaveDisplacement(); }
  public SetDis(value: any): void { this.octaveDisplacement!.SetDis(value); }
  public GetDis(): any { return this.octaveDisplacement!.GetDis(); }
  public HasDis(): boolean { return this.octaveDisplacement!.HasDis(); }
  public SetDisPlace(value: any): void { this.octaveDisplacement!.SetDisPlace(value); }
  public GetDisPlace(): any { return this.octaveDisplacement!.GetDisPlace(); }
  public HasDisPlace(): boolean { return this.octaveDisplacement!.HasDisPlace(); }

  // AttStaffIdent
  public ResetStaffIdent(): void { this.staffIdent!.ResetStaffIdent(); }
  public SetStaff(value: any): void { this.staffIdent!.SetStaff(value); }
  public GetStaff(): any { return this.staffIdent!.GetStaff(); }
  public HasStaff(): boolean { return this.staffIdent!.HasStaff(); }

  // AttTypography
  public ResetTypography(): void { this.typography!.ResetTypography(); }
  public SetFontfam(value: any): void { this.typography!.SetFontfam(value); }
  public GetFontfam(): any { return this.typography!.GetFontfam(); }
  public HasFontfam(): boolean { return this.typography!.HasFontfam(); }
  public SetFontname(value: any): void { this.typography!.SetFontname(value); }
  public GetFontname(): any { return this.typography!.GetFontname(); }
  public HasFontname(): boolean { return this.typography!.HasFontname(); }
  public SetFontsize(value: any): void { this.typography!.SetFontsize(value); }
  public GetFontsize(): any { return this.typography!.GetFontsize(); }
  public HasFontsize(): boolean { return this.typography!.HasFontsize(); }
  public SetFontstyle(value: any): void { this.typography!.SetFontstyle(value); }
  public GetFontstyle(): any { return this.typography!.GetFontstyle(); }
  public HasFontstyle(): boolean { return this.typography!.HasFontstyle(); }
  public SetFontweight(value: any): void { this.typography!.SetFontweight(value); }
  public GetFontweight(): any { return this.typography!.GetFontweight(); }
  public HasFontweight(): boolean { return this.typography!.HasFontweight(); }
  public SetLetterspacing(value: any): void { this.typography!.SetLetterspacing(value); }
  public GetLetterspacing(): any { return this.typography!.GetLetterspacing(); }
  public HasLetterspacing(): boolean { return this.typography!.HasLetterspacing(); }
  public SetLineheight(value: any): void { this.typography!.SetLineheight(value); }
  public GetLineheight(): any { return this.typography!.GetLineheight(); }
  public HasLineheight(): boolean { return this.typography!.HasLineheight(); }

  // AttVisibility
  public ResetVisibility(): void { this.visibility!.ResetVisibility(); }
  public SetVisible(value: any): void { this.visibility!.SetVisible(value); }
  public GetVisible(): any { return this.visibility!.GetVisible(); }
  public HasVisible(): boolean { return this.visibility!.HasVisible(); }
}

// Placeholder IDs resolved at module load (circular-import avoidance with offsetinterface).
import { InterfaceId } from './vrvdef.js';
const ATT_VISUALOFFSETHO_ID = 229;
const ATT_VISUALOFFSETVO_ID = 231;
const InterfaceIdOffset = InterfaceId.INTERFACE_OFFSET;

ObjectFactory.GetInstance().Register('clef', ClassId.CLEF, () => new Clef());
