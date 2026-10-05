/**
 * Pure TypeScript translation of Verovio's `src/keyaccid.cpp` /
 * `include/vrv/keyaccid.h`.
 *
 * `KeyAccid` models the MEI `<keyAccid>` element (an accidental within a key
 * signature).
 *
 * C++ multiple inheritance (LayerElement + PitchInterface + PositionInterface +
 * AttAccidental + AttColor + AttEnclosingChars + AttExtSymAuth + AttExtSymNames)
 * is represented through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode, InterfaceId } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, VrvObject } from './object.js';
import { PitchInterface } from './pitchinterface.js';
import { PositionInterface } from './positioninterface.js';
import { Accid, ACCIDENTAL_WRITTEN_NONE, data_ACCIDENTAL_WRITTEN } from './accid.js';
import { KeySig } from './keysig.js';
import { InstAccidental, InstColor, InstEnclosingChars } from './atts_shared.js';
import { InstExtSymAuth, InstExtSymNames } from './atts_externalsymbols.js';

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_ACCIDENTAL = 92;
const ATT_COLOR = 109;
const ATT_ENCLOSINGCHARS = 129;
const ATT_EXTSYMAUTH = 46;
const ATT_EXTSYMNAMES = 47;

/** Structural contract for the `Clef` collaborator (already migrated). */
export interface KeyAccidClefLike {
  GetShape(): number;
  GetLine(): number;
  GetDis(): number;
  GetDisPlace(): number;
}

/** Pure TypeScript translation of Verovio's `KeyAccid`. */
export class KeyAccid extends LayerElement {
  private pitch?: PitchInterface;
  private position?: PositionInterface;
  private accidental?: InstAccidental;
  private color?: InstColor;
  private enclosingChars?: InstEnclosingChars;
  private extSymAuth?: InstExtSymAuth;
  private extSymNames?: InstExtSymNames;

  public constructor() {
    super(ClassId.KEYACCID);
    this.ensureAttributes();
    this.RegisterInterface(this.pitch!.GetAttClasses(), InterfaceId.INTERFACE_PITCH);
    this.RegisterInterface(this.position!.GetAttClasses(), InterfaceId.INTERFACE_POSITION);
    this.RegisterAttClass(ATT_ACCIDENTAL);
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_ENCLOSINGCHARS);
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.Reset();
  }

  private ensureAttributes(): void {
    this.pitch ??= new PitchInterface();
    this.position ??= new PositionInterface();
    this.accidental ??= new InstAccidental();
    this.color ??= new InstColor();
    this.enclosingChars ??= new InstEnclosingChars();
    this.extSymAuth ??= new InstExtSymAuth();
    this.extSymNames ??= new InstExtSymNames();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.pitch!.Reset();
    this.position!.Reset();
    this.accidental!.ResetAccidental();
    this.color!.ResetColor();
    this.enclosingChars!.ResetEnclosingChars();
    this.extSymAuth!.ResetExtSymAuth();
    this.extSymNames!.ResetExtSymNames();
  }

  public override Clone(): VrvObject {
    const clone = new KeyAccid();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all members (composition adaptation:
    // AssignFrom covers only the object-tree state).
    clone.__copyKeyAccidState(this);
    return clone;
  }

  /** Composition-only state copy used by Clone. */
  private __copyKeyAccidState(source: KeyAccid): void {
    if (source.HasAccid()) this.SetAccid(source.GetAccid());
    if (source.HasColor()) this.SetColor(source.GetColor());
    if (source.HasEnclose()) this.SetEnclose(source.GetEnclose());
    if (source.HasGlyphAuth()) this.SetGlyphAuth(source.GetGlyphAuth());
    if (source.HasGlyphUri()) this.SetGlyphUri(source.GetGlyphUri());
    if (source.HasGlyphName()) this.SetGlyphName(source.GetGlyphName());
    if (source.HasGlyphNum()) this.SetGlyphNum(source.GetGlyphNum());
    // PitchInterface state
    if (source.HasPname()) this.SetPname(source.GetPname());
    if (source.HasOct()) this.SetOct(source.GetOct());
    // PositionInterface state
    if (source.HasPloc()) this.SetPloc(source.GetPloc());
    if (source.HasLoc()) this.SetLoc(source.GetLoc());
  }

  public override GetClassName(): string { return 'keyAccid'; }

  public GetPitchInterface(): PitchInterface { this.ensureAttributes(); return this.pitch!; }
  public GetPositionInterface(): PositionInterface { this.ensureAttributes(); return this.position!; }

  /**
   * Retrieve SMuFL string for the accidental.
   * This will include brackets.
   */
  public GetSymbolStr(notationType: number): string {
    return Accid.CreateSymbolStr(
      this.GetAccid(),
      this.GetEnclose(),
      notationType,
      this.GetDocResources() as never,
      this.GetGlyphNum(),
      this.GetGlyphName(),
    );
  }

  /**
   * Determine the staff location.
   */
  public CalcStaffLoc(clef: KeyAccidClefLike, clefLocOffset: number): number {
    if (this.HasLoc()) {
      return this.GetLoc();
    }
    else {
      const accid = this.GetAccid();
      const pname = this.GetPname();
      const oct = (this.HasOct()) ? this.GetOct() : KeySig.GetOctave(accid, pname, clef);
      return PitchInterface.CalcLoc(pname, oct, clefLocOffset);
    }
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitKeyAccid');
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitKeyAccid');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitKeyAccidEnd');
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitKeyAccidEnd');
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
  // AttAccidental forwarding surface
  //---------//
  public ResetAccidental(): void { this.accidental!.ResetAccidental(); }
  public SetAccid(value: data_ACCIDENTAL_WRITTEN): void { this.accidental!.SetAccid(value); }
  public GetAccid(): data_ACCIDENTAL_WRITTEN { return this.accidental!.GetAccid(); }
  public HasAccid(): boolean { return this.accidental!.GetAccid() !== ACCIDENTAL_WRITTEN_NONE; }

  //---------//
  // AttColor forwarding surface
  //---------//
  public ResetColor(): void { this.color!.ResetColor(); }
  public SetColor(value: any): void { this.color!.SetColor(value); }
  public GetColor(): any { return this.color!.GetColor(); }
  public HasColor(): boolean { return this.color!.HasColor(); }

  //---------//
  // AttEnclosingChars forwarding surface
  //---------//
  public ResetEnclosingChars(): void { this.enclosingChars!.ResetEnclosingChars(); }
  public SetEnclose(value: any): void { this.enclosingChars!.SetEnclose(value); }
  public GetEnclose(): any { return this.enclosingChars!.GetEnclose(); }
  public HasEnclose(): boolean { return this.enclosingChars!.HasEnclose(); }

  //---------//
  // AttExtSymAuth / AttExtSymNames forwarding surfaces
  //---------//
  public ResetExtSymAuth(): void { this.extSymAuth!.ResetExtSymAuth(); }
  public SetGlyphAuth(value: any): void { this.extSymAuth!.SetGlyphAuth(value); }
  public GetGlyphAuth(): any { return this.extSymAuth!.GetGlyphAuth(); }
  public HasGlyphAuth(): boolean { return this.extSymAuth!.HasGlyphAuth(); }
  public ResetExtSymNames(): void { this.extSymNames!.ResetExtSymNames(); }
  public SetGlyphName(value: any): void { this.extSymNames!.SetGlyphName(value); }
  public GetGlyphName(): any { return this.extSymNames!.GetGlyphName(); }
  public HasGlyphName(): boolean { return this.extSymNames!.HasGlyphName(); }
  public SetGlyphNum(value: any): void { this.extSymNames!.SetGlyphNum(value); }
  public GetGlyphNum(): any { return this.extSymNames!.GetGlyphNum(); }
  public HasGlyphNum(): boolean { return this.extSymNames!.HasGlyphNum(); }
  public SetGlyphUri(value: any): void { this.extSymAuth!.SetGlyphUri(value); }
  public GetGlyphUri(): any { return this.extSymAuth!.GetGlyphUri(); }
  public HasGlyphUri(): boolean { return this.extSymAuth!.HasGlyphUri(); }

  //---------//
  // PitchInterface facade (forwarding surface)
  //---------//
  public ResetPitchInterface(): void { this.pitch!.Reset(); }
  public SetPname(value: any): void { this.pitch!.SetPname(value); }
  public GetPname(): any { return this.pitch!.GetPname(); }
  public HasPname(): boolean { return this.pitch!.HasPname(); }
  public SetOct(value: any): void { this.pitch!.SetOct(value); }
  public GetOct(): any { return this.pitch!.GetOct(); }
  public HasOct(): boolean { return this.pitch!.HasOct(); }

  //---------//
  // PositionInterface facade (forwarding surface)
  //---------//
  public ResetPositionInterface(): void { this.position!.Reset(); }
  public SetPloc(value: any): void { this.position!.SetPloc(value); }
  public GetPloc(): any { return this.position!.GetPloc(); }
  public HasPloc(): boolean { return this.position!.HasPloc(); }
  public SetOloc(value: any): void { this.position!.SetOloc(value); }
  public GetOloc(): any { return this.position!.GetOloc(); }
  public HasOloc(): boolean { return this.position!.HasOloc(); }
  public SetLoc(value: any): void { this.position!.SetLoc(value); }
  public GetLoc(): any { return this.position!.GetLoc(); }
  public HasLoc(): boolean { return this.position!.HasLoc(); }
}

ObjectFactory.GetInstance().Register('keyAccid', ClassId.KEYACCID, () => new KeyAccid());
