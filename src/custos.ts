/**
 * Pure TypeScript translation of Verovio's `src/custos.cpp` / `include/vrv/custos.h`.
 *
 * `Custos` models the MEI `<custos>` element (mensural/chant pitch indicator
 * at line breaks).
 *
 * C++ multiple inheritance (LayerElement + OffsetInterface + PitchInterface +
 * PositionInterface + AttColor + AttExtSymAuth + AttExtSymNames) is represented
 * through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode, InterfaceId } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, VrvObject } from './object.js';
import { OffsetInterface } from './offsetinterface.js';
import { PitchInterface } from './pitchinterface.js';
import { PositionInterface } from './positioninterface.js';
import { IsNeumeType } from './vrv.js';
import { SMUFL_EA02_mensuralCustosUp, SMUFL_EA06_chantCustosStemUpPosMiddle } from './smufl.js';
import { InstColor } from './atts_shared.js';
import { InstExtSymAuth, InstExtSymNames } from './atts_externalsymbols.js';

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS / interface
// registration ids from the migrated interface modules).
const ATT_COLOR = 109;
const ATT_EXTSYMAUTH = 46;
const ATT_EXTSYMNAMES = 47;
// OffsetInterface att classes: ATT_VISUALOFFSETHO, ATT_VISUALOFFSETVO.
const OFFSET_ATT_CLASSES = [229, 231];
// PitchInterface att classes: ATT_NOTEGES, ATT_OCTAVE, ATT_PITCH, ATT_PITCHGES.
const PITCH_ATT_CLASSES = [57, 173, 184, 59];
// PositionInterface att classes: ATT_STAFFLOC, ATT_STAFFLOCPITCHED.
const POSITION_ATT_CLASSES = [205, 206];

/** Structural contract for the still-unmigrated `Resources` collaborator. */
interface CustosResourcesLike {
  GetGlyph(codeOrName: number | string): unknown;
  GetGlyphCode(name: string): number;
}

/** Pure TypeScript translation of Verovio's `Custos`. */
export class Custos extends LayerElement {
  private offset?: OffsetInterface;
  private pitch?: PitchInterface;
  private position?: PositionInterface;
  private color?: InstColor;
  private extSymAuth?: InstExtSymAuth;
  private extSymNames?: InstExtSymNames;

  public constructor() {
    super(ClassId.CUSTOS);
    this.ensureAttributes();
    this.RegisterInterface(this.offset!.GetAttClasses(), InterfaceId.INTERFACE_OFFSET);
    this.RegisterInterface(this.pitch!.GetAttClasses(), InterfaceId.INTERFACE_PITCH);
    this.RegisterInterface(this.position!.GetAttClasses(), InterfaceId.INTERFACE_POSITION);
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.Reset();
  }

  private ensureAttributes(): void {
    this.offset ??= new OffsetInterface();
    this.pitch ??= new PitchInterface();
    this.position ??= new PositionInterface();
    this.color ??= new InstColor();
    this.extSymAuth ??= new InstExtSymAuth();
    this.extSymNames ??= new InstExtSymNames();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.offset!.Reset();
    this.pitch!.Reset();
    this.position!.Reset();
    this.color!.ResetColor();
    this.extSymAuth!.ResetExtSymAuth();
    this.extSymNames!.ResetExtSymNames();
  }

  public override Clone(): VrvObject {
    const clone = new Custos();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all attribute/interface state (composition
    // adaptation: AssignFrom covers only the object-tree state).
    if (this.HasPname()) clone.SetPname(this.GetPname());
    if (this.HasOct()) clone.SetOct(this.GetOct());
    if (this.HasLoc()) clone.SetLoc(this.GetLoc());
    if (this.HasPloc()) clone.SetPloc(this.GetPloc());
    if (this.HasOloc()) clone.SetOloc(this.GetOloc());
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasGlyphAuth()) clone.SetGlyphAuth(this.GetGlyphAuth());
    if (this.HasGlyphUri()) clone.SetGlyphUri(this.GetGlyphUri());
    if (this.HasGlyphName()) clone.SetGlyphName(this.GetGlyphName());
    if (this.HasGlyphNum()) clone.SetGlyphNum(this.GetGlyphNum());
    if (this.HasHo()) clone.SetHo(this.GetHo());
    if (this.HasVo()) clone.SetVo(this.GetVo());
    return clone;
  }

  public override GetClassName(): string { return 'custos'; }

  // Interface getters.
  public GetOffsetInterface(): OffsetInterface { this.ensureAttributes(); return this.offset!; }
  public GetPitchInterface(): PitchInterface { this.ensureAttributes(); return this.pitch!; }
  public GetPositionInterface(): PositionInterface { this.ensureAttributes(); return this.position!; }

  /** Override the method since alignment is required. */
  public override HasToBeAligned(): boolean { return true; }

  /**
   * Add an accid to a custos.
   * C++ `IsSupportedChild`: only ACCID.
   */
  public override IsSupportedChild(classId: ClassId): boolean {
    return classId === ClassId.ACCID;
  }

  /** Return a SMuFL code for the custos. */
  public GetCustosGlyph(notationType: number): number {
    const resources = this.GetDocResources() as unknown as CustosResourcesLike | null;
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

    if (IsNeumeType(notationType)) return SMUFL_EA06_chantCustosStemUpPosMiddle;
    return SMUFL_EA02_mensuralCustosUp;
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitCustos');
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitCustos');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitCustosEnd');
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitCustosEnd');
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
  // PitchInterface forwarding
  //---------//

  public ResetNoteGes(): void { this.pitch!.ResetNoteGes(); }
  public ResetOctave(): void { this.pitch!.ResetOctave(); }
  public ResetPitch(): void { this.pitch!.ResetPitch(); }
  public ResetPitchGes(): void { this.pitch!.ResetPitchGes(); }
  public SetPname(value: any): void { this.pitch!.SetPname(value); }
  public GetPname(): any { return this.pitch!.GetPname(); }
  public HasPname(): boolean { return this.pitch!.HasPname(); }
  public SetOct(value: any): void { this.pitch!.SetOct(value); }
  public GetOct(): any { return this.pitch!.GetOct(); }
  public HasOct(): boolean { return this.pitch!.HasOct(); }

  //---------//
  // PositionInterface forwarding
  //---------//

  public SetLoc(value: number): void { this.position!.SetLoc(value); }
  public GetLoc(): number { return this.position!.GetLoc(); }
  public HasLoc(): boolean { return this.position!.HasLoc(); }
  public ResetStaffLoc(): void { this.position!.ResetStaffLoc(); }
  public SetPloc(value: any): void { this.position!.SetPloc(value); }
  public GetPloc(): any { return this.position!.GetPloc(); }
  public HasPloc(): boolean { return this.position!.HasPloc(); }
  public SetOloc(value: any): void { this.position!.SetOloc(value); }
  public GetOloc(): any { return this.position!.GetOloc(); }
  public HasOloc(): boolean { return this.position!.HasOloc(); }
  public ResetStaffLocPitched(): void { this.position!.ResetStaffLocPitched(); }
  public GetDrawingLoc(): number { return this.position!.GetDrawingLoc(); }
  public SetDrawingLoc(loc: number): void { this.position!.SetDrawingLoc(loc); }

  //---------//
  // Attribute forwarding
  //---------//

  // AttColor
  public ResetColor(): void { this.color!.ResetColor(); }
  public SetColor(value: any): void { this.color!.SetColor(value); }
  public GetColor(): any { return this.color!.GetColor(); }
  public HasColor(): boolean { return this.color!.HasColor(); }

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
}

ObjectFactory.GetInstance().Register('custos', ClassId.CUSTOS, () => new Custos());
