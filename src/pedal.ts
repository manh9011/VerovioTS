/**
 * Pure TypeScript translation of Verovio's `src/pedal.cpp` / `include/vrv/pedal.h`.
 *
 * `Pedal` is the MEI `<pedal>` control element. C++ multiple inheritance
 * (ControlElement + TimeSpanningInterface + AttExtSymAuth + AttExtSymNames +
 * AttPedalLog + AttPedalVis + AttPlacementRelStaff + AttVerticalGroup) is
 * represented through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory } from './object.js';
import { ControlElement } from './controlelement.js';
import { TimePointInterface, TimeSpanningInterface } from './timeinterface.js';
import { InstExtSymAuth, InstExtSymNames } from './atts_externalsymbols.js';
import { InstPedalLog } from './atts_cmn.js';
import { InstPedalVis, data_PEDALSTYLE, PEDALSTYLE_NONE } from './atts_visual.js';
import { InstPlacementRelStaff, InstVerticalGroup } from './atts_shared.js';
import { SMUFL_E650_keyboardPedalPed, SMUFL_E659_keyboardPedalSost } from './smufl.js';

// Canonical libmei att-class ordinals (libmei/dist/attclasses.h).
const ATT_EXTSYMAUTH = 46;
const ATT_EXTSYMNAMES = 47;
const ATT_PEDALLOG = 31;
const ATT_PEDALVIS = 275;
const ATT_PLACEMENTRELSTAFF = 186;
const ATT_VERTICALGROUP = 227;

type PedalDocLike = {
  GetOptions(): { m_pedalStyle: { GetValue(): data_PEDALSTYLE } };
  GetDrawingUnit(staffSize: number): number;
};

type PedalSystemLike = {
  GetDrawingScoreDef(): { HasPedalStyle(): boolean; GetPedalStyle(): data_PEDALSTYLE } | null;
};

/** Resources contract consumed by Pedal::GetPedalGlyph; matches canonical resources.ts. */
export interface PedalResourcesLike {
  GetGlyph(code: number): unknown | null;
  GetGlyphCode(smuflName: string): number;
}

/** Pure TypeScript translation of Verovio's `Pedal` element. */
export class Pedal extends ControlElement {
  private timeSpanningInterface: TimeSpanningInterface | null = null;
  private attExtSymAuth: InstExtSymAuth | null = null;
  private attExtSymNames: InstExtSymNames | null = null;
  private attPedalLog: InstPedalLog | null = null;
  private attPedalVis: InstPedalVis | null = null;
  private attPlacementRelStaff: InstPlacementRelStaff | null = null;
  private attVerticalGroup: InstVerticalGroup | null = null;
  private m_endsWithBounce: boolean = false;

  public constructor() {
    super(ClassId.PEDAL);
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.attExtSymAuth = new InstExtSymAuth();
    this.attExtSymNames = new InstExtSymNames();
    this.attPedalLog = new InstPedalLog();
    this.attPedalVis = new InstPedalVis();
    this.attPlacementRelStaff = new InstPlacementRelStaff();
    this.attVerticalGroup = new InstVerticalGroup();
    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.RegisterAttClass(ATT_PEDALLOG);
    this.RegisterAttClass(ATT_PEDALVIS);
    this.RegisterAttClass(ATT_PLACEMENTRELSTAFF);
    this.RegisterAttClass(ATT_VERTICALGROUP);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.attExtSymAuth ??= new InstExtSymAuth();
    this.attExtSymNames ??= new InstExtSymNames();
    this.attPedalLog ??= new InstPedalLog();
    this.attPedalVis ??= new InstPedalVis();
    this.attPlacementRelStaff ??= new InstPlacementRelStaff();
    this.attVerticalGroup ??= new InstVerticalGroup();
    this.timeSpanningInterface.Reset();
    this.attExtSymAuth.ResetExtSymAuth();
    this.attExtSymNames.ResetExtSymNames();
    this.attPedalLog.ResetPedalLog();
    this.attPedalVis.ResetPedalVis();
    this.attPlacementRelStaff.ResetPlacementRelStaff();
    this.attVerticalGroup.ResetVerticalGroup();
    this.m_endsWithBounce = false;
  }

  public override GetClassName(): string { return 'pedal'; }

  // Getter to interfaces (C++ vrv_cast overloads collapse to one TS surface).
  public GetTimePointInterface(): TimePointInterface {
    return this.GetTimeSpanningInterface();
  }

  public GetTimeSpanningInterface(): TimeSpanningInterface {
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    return this.timeSpanningInterface!;
  }

  /** Getter to check if the pedal ends with a bounce. */
  public EndsWithBounce(): boolean { return this.m_endsWithBounce; }
  public SetEndsWithBounce(endsWithBounce: boolean): void { this.m_endsWithBounce = endsWithBounce; }

  /**
   * Get the SMuFL glyph for the pedal based on function or glyph.num.
   */
  public GetPedalGlyph(): number {
    const resources = this.GetDocResources() as unknown as PedalResourcesLike | null;
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

    return (this.GetFunc() === 'sostenuto') ? SMUFL_E659_keyboardPedalSost : SMUFL_E650_keyboardPedalPed;
  }

  /**
   * Get the pedal form based on the options and corresponding attributes from <pedal> and <scoreDef>.
   */
  public GetPedalForm(doc: PedalDocLike, system: PedalSystemLike): data_PEDALSTYLE {
    let style: data_PEDALSTYLE = doc.GetOptions().m_pedalStyle.GetValue();
    if (style !== PEDALSTYLE_NONE) {
      return style;
    } else if (this.HasForm()) {
      style = this.GetForm();
    } else {
      const scoreDef = system.GetDrawingScoreDef();
      if (scoreDef && scoreDef.HasPedalStyle()) {
        style = scoreDef.GetPedalStyle();
      }
    }
    return style;
  }

  // TimeSpanningInterface facade.
  public GetStart(): unknown { return this.GetTimeSpanningInterface().GetStart(); }
  public SetStaff(v: number[]): void { this.GetTimeSpanningInterface().SetStaff(v); }
  public GetStaff(): number[] { return this.GetTimeSpanningInterface().GetStaff(); }
  /** C++ AttLayer::HasStaff via the time-pointing interface. */
  public HasStaff(): boolean { return this.GetTimeSpanningInterface().HasStaff(); }
  public HasStartid(): boolean { return this.GetTimeSpanningInterface().HasStartid(); }
  public HasTstamp(): boolean { return this.GetTimeSpanningInterface().HasTstamp(); }
  public SetTstamp(v: number): void { this.GetTimeSpanningInterface().SetTstamp(v); }
  public GetTstamp(): number { return this.GetTimeSpanningInterface().GetTstamp(); }
  public SetStartid(v: string): void { this.GetTimeSpanningInterface().SetStartid(v); }
  public GetStartid(): string { return this.GetTimeSpanningInterface().GetStartid(); }
  // C++ Pedal : TimeSpanningInterface — complete forwarder chain (33a uses GetTstampStaves).
  public SetTstamp2(v: [number, number]): void { this.GetTimeSpanningInterface().SetTstamp2(v as never); }
  public GetTstamp2(): unknown { return this.GetTimeSpanningInterface().GetTstamp2(); }
  public HasTstamp2(): boolean { return this.GetTimeSpanningInterface().HasTstamp2(); }
  public HasStart(): boolean { return this.GetTimeSpanningInterface().HasStart(); }
  public SetEndid(v: string): void { this.GetTimeSpanningInterface().SetEndid(v); }
  public GetEndid(): string { return this.GetTimeSpanningInterface().GetEndid(); }
  public HasEndid(): boolean { return this.GetTimeSpanningInterface().HasEndid(); }
  public HasStartAndEnd(): boolean { return this.GetTimeSpanningInterface().HasStartAndEnd(); }
  public GetEndMeasure(): unknown { return this.GetTimeSpanningInterface().GetEndMeasure(); }
  public GetTstampStaves(measure: unknown, object: unknown): unknown[] { return this.GetTimePointInterface().GetTstampStaves(measure as never, object as never); }
  public SetStart(start: any): void { this.GetTimeSpanningInterface().SetStart(start); }
  public GetEnd(): unknown { return this.GetTimeSpanningInterface().GetEnd(); }
  public SetEnd(end: any): void { this.GetTimeSpanningInterface().SetEnd(end); }

  // AttExtSymAuth forwarding (methods: SetGlyphAuth/GetGlyphAuth/HasGlyphAuth/SetGlyphUri/GetGlyphUri/HasGlyphUri).
  public SetGlyphAuth(value: string): void { this.attExtSymAuth!.SetGlyphAuth(value); }
  public GetGlyphAuth(): string { return this.attExtSymAuth!.GetGlyphAuth(); }
  public HasGlyphAuth(): boolean { return this.attExtSymAuth!.HasGlyphAuth(); }
  public SetGlyphUri(value: string): void { this.attExtSymAuth!.SetGlyphUri(value); }
  public GetGlyphUri(): string { return this.attExtSymAuth!.GetGlyphUri(); }
  public HasGlyphUri(): boolean { return this.attExtSymAuth!.HasGlyphUri(); }
  public ResetExtSymAuth(): void { this.attExtSymAuth!.ResetExtSymAuth(); }

  // AttExtSymNames forwarding (methods: SetGlyphName/GetGlyphName/HasGlyphName/SetGlyphNum/GetGlyphNum/HasGlyphNum).
  public SetGlyphName(value: string): void { this.attExtSymNames!.SetGlyphName(value); }
  public GetGlyphName(): string { return this.attExtSymNames!.GetGlyphName(); }
  public HasGlyphName(): boolean { return this.attExtSymNames!.HasGlyphName(); }
  public SetGlyphNum(value: number): void { this.attExtSymNames!.SetGlyphNum(value); }
  public GetGlyphNum(): number { return this.attExtSymNames!.GetGlyphNum(); }
  public HasGlyphNum(): boolean { return this.attExtSymNames!.HasGlyphNum(); }
  public ResetExtSymNames(): void { this.attExtSymNames!.ResetExtSymNames(); }

  // AttPedalLog forwarding (methods: dir/func).
  public SetDir(value: unknown): void { this.attPedalLog!.SetDir(value); }
  public GetDir(): unknown { return this.attPedalLog!.GetDir(); }
  public HasDir(): boolean { return this.attPedalLog!.HasDir(); }
  public SetFunc(value: string): void { this.attPedalLog!.SetFunc(value); }
  public GetFunc(): string { return this.attPedalLog!.GetFunc(); }
  public HasFunc(): boolean { return this.attPedalLog!.HasFunc(); }
  public ResetPedalLog(): void { this.attPedalLog!.ResetPedalLog(); }

  // AttPedalVis forwarding (methods: form).
  public SetForm(value: data_PEDALSTYLE): void { this.attPedalVis!.SetForm(value); }
  public GetForm(): data_PEDALSTYLE { return this.attPedalVis!.GetForm(); }
  public HasForm(): boolean { return this.attPedalVis!.HasForm(); }
  public ResetPedalVis(): void { this.attPedalVis!.ResetPedalVis(); }

  // AttPlacementRelStaff forwarding.
  public SetPlace(value: unknown): void { this.attPlacementRelStaff!.SetPlace(value); }
  public GetPlace(): unknown { return this.attPlacementRelStaff!.GetPlace(); }
  public HasPlace(): boolean { return this.attPlacementRelStaff!.HasPlace(); }
  public ResetPlacementRelStaff(): void { this.attPlacementRelStaff!.ResetPlacementRelStaff(); }

  // AttVerticalGroup forwarding.
  public SetVgrp(value: unknown): void { this.attVerticalGroup!.SetVgrp(value); }
  public GetVgrp(): unknown { return this.attVerticalGroup!.GetVgrp(); }
  public HasVgrp(): boolean { return this.attVerticalGroup!.HasVgrp(); }
  public ResetVerticalGroup(): void { this.attVerticalGroup!.ResetVerticalGroup(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitPedal');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitPedal');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitPedalEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitPedalEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Pedal {
    const clone = new Pedal();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all TimeSpanningInterface and attribute members.
    const ts = this.GetTimeSpanningInterface();
    const cts = clone.GetTimeSpanningInterface();
    if (ts.HasStartid()) cts.SetStartid(ts.GetStartid());
    if (ts.HasEndid()) cts.SetEndid(ts.GetEndid());
    if (ts.HasTstamp()) cts.SetTstamp(ts.GetTstamp());
    if (ts.HasTstamp2()) cts.SetTstamp2(ts.GetTstamp2());
    clone.SetGlyphAuth(this.GetGlyphAuth());
    if (this.HasGlyphUri()) clone.SetGlyphUri(this.GetGlyphUri());
    clone.SetGlyphName(this.GetGlyphName());
    if (this.HasGlyphNum()) clone.SetGlyphNum(this.GetGlyphNum());
    clone.SetDir(this.GetDir());
    clone.SetFunc(this.GetFunc());
    clone.SetForm(this.GetForm());
    clone.SetPlace(this.GetPlace());
    clone.SetVgrp(this.GetVgrp());
    clone.SetEndsWithBounce(this.EndsWithBounce());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('pedal', ClassId.PEDAL, () => new Pedal());