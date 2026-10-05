/**
 * Pure TypeScript translation of Verovio's `src/mensur.cpp` /
 * `include/vrv/mensur.h`.
 *
 * `Mensur` models the MEI `<mensur>` element.
 *
 * C++ multiple inheritance (LayerElement + AttColor + AttCue +
 * AttDurationRatio + AttMensuralShared + AttMensurVis + AttSlashCount +
 * AttStaffLoc) is represented through explicit composition with forwarding
 * surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, VrvObject } from './object.js';
import { InstColor, InstCue, InstDurationRatio, InstSlashCount, InstStaffLoc } from './atts_shared.js';
import { InstMensuralShared } from './atts_mensural.js';
import { InstMensurVis } from './atts_visual.js';

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_COLOR = 109;
const ATT_CUE = 116;
const ATT_DURATIONRATIO = 128;
const ATT_MENSURALSHARED = 72;
const ATT_MENSURVIS = 269;
const ATT_SLASHCOUNT = 196;
const ATT_STAFFLOC = 205;

/**
 * Pure TypeScript translation of Verovio's `Mensur`.
 */
export class Mensur extends LayerElement {
  private color?: InstColor;
  private cue?: InstCue;
  private durationRatio?: InstDurationRatio;
  private mensuralShared?: InstMensuralShared;
  private mensurVis?: InstMensurVis;
  private slashCount?: InstSlashCount;
  private staffLoc?: InstStaffLoc;

  public constructor() {
    super(ClassId.MENSUR);
    this.ensureAttributes();
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_CUE);
    this.RegisterAttClass(ATT_DURATIONRATIO);
    this.RegisterAttClass(ATT_MENSURALSHARED);
    this.RegisterAttClass(ATT_MENSURVIS);
    this.RegisterAttClass(ATT_SLASHCOUNT);
    this.RegisterAttClass(ATT_STAFFLOC);
    this.Reset();
  }

  private ensureAttributes(): void {
    this.color ??= new InstColor();
    this.cue ??= new InstCue();
    this.durationRatio ??= new InstDurationRatio();
    this.mensuralShared ??= new InstMensuralShared();
    this.mensurVis ??= new InstMensurVis();
    this.slashCount ??= new InstSlashCount();
    this.staffLoc ??= new InstStaffLoc();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.color!.ResetColor();
    this.cue!.ResetCue();
    this.durationRatio!.ResetDurationRatio();
    this.mensuralShared!.ResetMensuralShared();
    this.mensurVis!.ResetMensurVis();
    this.slashCount!.ResetSlashCount();
    this.staffLoc!.ResetStaffLoc();
  }

  public override Clone(): VrvObject {
    const clone = new Mensur();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all attribute members (composition
    // adaptation: AssignFrom covers only the object-tree state).
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasCue()) clone.SetCue(this.GetCue());
    if (this.HasNum()) clone.SetNum(this.GetNum());
    if (this.HasNumbase()) clone.SetNumbase(this.GetNumbase());
    if (this.HasModusmaior()) clone.SetModusmaior(this.GetModusmaior());
    if (this.HasModusminor()) clone.SetModusminor(this.GetModusminor());
    if (this.HasProlatio()) clone.SetProlatio(this.GetProlatio());
    if (this.HasTempus()) clone.SetTempus(this.GetTempus());
    if (this.HasDivisio()) clone.SetDivisio(this.GetDivisio());
    if (this.HasDot()) clone.SetDot(this.GetDot());
    if (this.HasForm()) clone.SetForm(this.GetForm());
    if (this.HasOrient()) clone.SetOrient(this.GetOrient());
    if (this.HasSign()) clone.SetSign(this.GetSign());
    if (this.HasSlash()) clone.SetSlash(this.GetSlash());
    if (this.HasLoc()) clone.SetLoc(this.GetLoc());
    return clone;
  }

  public override GetClassName(): string { return 'mensur'; }

  /** Override the method since alignment is required. */
  public override HasToBeAligned(): boolean { return true; }

  /** Override the method since check is required. */
  public override IsScoreDefElement(): boolean {
    return !!(this.GetParent() && this.GetFirstAncestor(ClassId.SCOREDEF));
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitMensur');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitMensurEnd');
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
  // AttCue forwarding surface
  //---------//
  public ResetCue(): void { this.cue!.ResetCue(); }
  public SetCue(value: number): void { this.cue!.SetCue(value); }
  public GetCue(): number { return this.cue!.GetCue(); }
  public HasCue(): boolean { return this.cue!.HasCue(); }

  //---------//
  // AttDurationRatio forwarding surface
  //---------//
  public ResetDurationRatio(): void { this.durationRatio!.ResetDurationRatio(); }
  public SetNum(value: number): void { this.durationRatio!.SetNum(value); }
  public GetNum(): number { return this.durationRatio!.GetNum(); }
  public HasNum(): boolean { return this.durationRatio!.HasNum(); }
  public SetNumbase(value: number): void { this.durationRatio!.SetNumbase(value); }
  public GetNumbase(): number { return this.durationRatio!.GetNumbase(); }
  public HasNumbase(): boolean { return this.durationRatio!.HasNumbase(); }

  //---------//
  // AttMensuralShared forwarding surface (modusmaior/modusminor/prolatio/tempus/divisio)
  //---------//
  public ResetMensuralShared(): void { this.mensuralShared!.ResetMensuralShared(); }
  public SetModusmaior(value: number): void { this.mensuralShared!.SetModusmaior(value); }
  public GetModusmaior(): number { return this.mensuralShared!.GetModusmaior(); }
  public HasModusmaior(): boolean { return this.mensuralShared!.HasModusmaior(); }
  public SetModusminor(value: number): void { this.mensuralShared!.SetModusminor(value); }
  public GetModusminor(): number { return this.mensuralShared!.GetModusminor(); }
  public HasModusminor(): boolean { return this.mensuralShared!.HasModusminor(); }
  public SetProlatio(value: number): void { this.mensuralShared!.SetProlatio(value); }
  public GetProlatio(): number { return this.mensuralShared!.GetProlatio(); }
  public HasProlatio(): boolean { return this.mensuralShared!.HasProlatio(); }
  public SetTempus(value: number): void { this.mensuralShared!.SetTempus(value); }
  public GetTempus(): number { return this.mensuralShared!.GetTempus(); }
  public HasTempus(): boolean { return this.mensuralShared!.HasTempus(); }
  public SetDivisio(value: number): void { this.mensuralShared!.SetDivisio(value); }
  public GetDivisio(): number { return this.mensuralShared!.GetDivisio(); }
  public HasDivisio(): boolean { return this.mensuralShared!.HasDivisio(); }

  //---------//
  // AttMensurVis forwarding surface (dot/form/orient/sign)
  //---------//
  public ResetMensurVis(): void { this.mensurVis!.ResetMensurVis(); }
  public SetDot(value: number): void { this.mensurVis!.SetDot(value); }
  public GetDot(): number { return this.mensurVis!.GetDot(); }
  public HasDot(): boolean { return this.mensurVis!.HasDot(); }
  public SetForm(value: number): void { this.mensurVis!.SetForm(value); }
  public GetForm(): number { return this.mensurVis!.GetForm(); }
  public HasForm(): boolean { return this.mensurVis!.HasForm(); }
  public SetOrient(value: number): void { this.mensurVis!.SetOrient(value); }
  public GetOrient(): number { return this.mensurVis!.GetOrient(); }
  public HasOrient(): boolean { return this.mensurVis!.HasOrient(); }
  public SetSign(value: number): void { this.mensurVis!.SetSign(value); }
  public GetSign(): number { return this.mensurVis!.GetSign(); }
  public HasSign(): boolean { return this.mensurVis!.HasSign(); }

  //---------//
  // AttSlashCount forwarding surface
  //---------//
  public ResetSlashCount(): void { this.slashCount!.ResetSlashCount(); }
  public SetSlash(value: number): void { this.slashCount!.SetSlash(value); }
  public GetSlash(): number { return this.slashCount!.GetSlash(); }
  public HasSlash(): boolean { return this.slashCount!.HasSlash(); }

  //---------//
  // AttStaffLoc forwarding surface
  //---------//
  public ResetStaffLoc(): void { this.staffLoc!.ResetStaffLoc(); }
  public SetLoc(value: number): void { this.staffLoc!.SetLoc(value); }
  public GetLoc(): number { return this.staffLoc!.GetLoc(); }
  public HasLoc(): boolean { return this.staffLoc!.HasLoc(); }
}

// Static members for setting a value from a controller (C++ `s_num`/`s_numBase`).
export const MENSUR_S_NUM = 3;
export const MENSUR_S_NUMBASE = 2;

// Factory registration (C++ `ClassRegistrar<Mensur> s_factory("mensur", MENSUR)`).
ObjectFactory.GetInstance().Register('mensur', ClassId.MENSUR, () => new Mensur());
