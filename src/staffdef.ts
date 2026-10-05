/**
 * Pure TypeScript translation of Verovio's `StaffDef`
 * (`src-cpp/src/staffdef.cpp` + `src-cpp/include/vrv/staffdef.h`).
 *
 * C++ has `StaffDef` inherit `ScoreDefElement` + `StaffDefDrawingInterface` +
 * ten generated libMEI attribute classes; TypeScript models the multiple
 * inheritance with composition.
 */
import { ClassId, FunctorCode, VisibilityOptimization } from './vrvdef.js';
import { ScoreDefElement } from './scoredef.js';
import { StaffDefDrawingInterface, SetStaffDefKeySigCtor, SetStaffDefClefCtor } from './drawinginterface.js';
import { InstDistances, InstLabelled, InstNInteger, InstScalable, InstStaffDefLog, InstTransposition } from './atts_shared.js';
import { InstNotationType } from './atts_mei.js';
import { InstTimeBase } from './atts_midi.js';
import { InstStaffDefVisTablature } from './atts_stringtab.js';
import { InstStaffDefVis } from './atts_visual.js';
import { ObjectFactory, VrvObject } from './object.js';
import { KeySig } from './keysig.js';
import { Clef } from './clef.js';

/** Pure TypeScript translation of Verovio's `StaffDef`. */
export class StaffDef extends ScoreDefElement {
  private staffDefDrawingInterface: StaffDefDrawingInterface | null = null;
  private attDistances: InstDistances | null = null;
  private attLabelled: InstLabelled | null = null;
  private attNInteger: InstNInteger | null = null;
  private attNotationType: InstNotationType | null = null;
  private attScalable: InstScalable | null = null;
  private attStaffDefLog: InstStaffDefLog | null = null;
  private attStaffDefVis: InstStaffDefVis | null = null;
  private attStaffDefVisTablature: InstStaffDefVisTablature | null = null;
  private attTimeBase: InstTimeBase | null = null;
  private attTransposition: InstTransposition | null = null;
  private m_drawingVisibility: VisibilityOptimization = VisibilityOptimization.OPTIMIZATION_NONE;

  public constructor() {
    super(ClassId.STAFFDEF);
    this.ensureComponents();
    this.RegisterAttClass(ATT_DISTANCES);
    this.RegisterAttClass(ATT_LABELLED);
    this.RegisterAttClass(ATT_NINTEGER);
    this.RegisterAttClass(ATT_NOTATIONTYPE);
    this.RegisterAttClass(ATT_SCALABLE);
    this.RegisterAttClass(ATT_STAFFDEFLOG);
    this.RegisterAttClass(ATT_STAFFDEFVIS);
    this.RegisterAttClass(ATT_STAFFDEFVISTABLATURE);
    this.RegisterAttClass(ATT_TIMEBASE);
    this.RegisterAttClass(ATT_TRANSPOSITION);
    this.Reset();
  }

  public override GetClassName(): string { return 'staffDef'; }

  public override Reset(): void {
    super.Reset();
    this.staffDefDrawingInterface?.Reset();
    this.attDistances?.ResetDistances();
    this.attLabelled?.ResetLabelled();
    this.attNInteger?.ResetNInteger();
    this.attNotationType?.ResetNotationType();
    this.attScalable?.ResetScalable();
    this.attStaffDefLog?.ResetStaffDefLog();
    this.attStaffDefVis?.ResetStaffDefVis();
    this.attStaffDefVisTablature?.ResetStaffDefVisTablature();
    this.attTimeBase?.ResetTimeBase();
    this.attTransposition?.ResetTransposition();

    this.m_drawingVisibility = VisibilityOptimization.OPTIMIZATION_NONE;
  }

  private ensureComponents(): void {
    this.staffDefDrawingInterface ??= new StaffDefDrawingInterface();
    this.attDistances ??= new InstDistances();
    this.attLabelled ??= new InstLabelled();
    this.attNInteger ??= new InstNInteger();
    this.attNotationType ??= new InstNotationType();
    this.attScalable ??= new InstScalable();
    this.attStaffDefLog ??= new InstStaffDefLog();
    this.attStaffDefVis ??= new InstStaffDefVis();
    this.attStaffDefVisTablature ??= new InstStaffDefVisTablature();
    this.attTimeBase ??= new InstTimeBase();
    this.attTransposition ??= new InstTransposition();
  }

  //---------//
  // Children //
  //---------//

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [
      ClassId.CLEF, ClassId.INSTRDEF, ClassId.KEYSIG, ClassId.LABEL, ClassId.LABELABBR,
      ClassId.LAYERDEF, ClassId.MENSUR, ClassId.METERSIG, ClassId.METERSIGGRP, ClassId.TUNING,
    ];
    return supported.includes(classId);
  }

  public override GetInsertOrderFor(classId: ClassId): number {
    // Anything else goes at the end
    const s_order: ClassId[] = [ClassId.LABEL, ClassId.LABELABBR];
    return this.GetInsertOrderForIn(classId, s_order);
  }

  /** True when a descendant layerDef has a label. */
  public HasLayerDefWithLabel(): boolean {
    // First get all the layerDefs
    const layerDefs = this.FindAllDescendantsByType(ClassId.LAYERDEF);
    // Then the label of each layerDef
    for (const object of layerDefs) {
      if (object.FindDescendantByType(ClassId.LABEL)) return true;
    }
    return false;
  }

  //-----------------------------------------//
  // StaffDefDrawingInterface facade          //
  //-----------------------------------------//

  public GetStaffDefDrawingInterface(): StaffDefDrawingInterface {
    this.ensureComponents();
    return this.staffDefDrawingInterface!;
  }

  public DrawClef(): boolean { return this.GetStaffDefDrawingInterface().DrawClef(); }
  public SetDrawClef(v: boolean): void { this.GetStaffDefDrawingInterface().SetDrawClef(v); }
  public DrawKeySig(): boolean { return this.GetStaffDefDrawingInterface().DrawKeySig(); }
  public SetDrawKeySig(v: boolean): void { this.GetStaffDefDrawingInterface().SetDrawKeySig(v); }
  public DrawMensur(): boolean { return this.GetStaffDefDrawingInterface().DrawMensur(); }
  public SetDrawMensur(v: boolean): void { this.GetStaffDefDrawingInterface().SetDrawMensur(v); }
  public DrawMeterSig(): boolean { return this.GetStaffDefDrawingInterface().DrawMeterSig(); }
  public SetDrawMeterSig(v: boolean): void { this.GetStaffDefDrawingInterface().SetDrawMeterSig(v); }
  public DrawMeterSigGrp(): boolean { return this.GetStaffDefDrawingInterface().DrawMeterSigGrp(); }
  public SetDrawMeterSigGrp(v: boolean): void { this.GetStaffDefDrawingInterface().SetDrawMeterSigGrp(v); }
  public ResetOssiaStaffDefs(): void { this.GetStaffDefDrawingInterface().ResetOssiaStaffDefs(); }
  public AddOssiaAbove(staff: unknown): void { this.GetStaffDefDrawingInterface().AddOssiaAbove(staff as never); }
  public AddOssiaBelow(staff: unknown): void { this.GetStaffDefDrawingInterface().AddOssiaBelow(staff as never); }
  public GetOssiaStaffDef(n: number): unknown { return this.GetStaffDefDrawingInterface().GetOssiaStaffDef(n); }
  public GetOssiaAboveNs(out: number[]): void { this.GetStaffDefDrawingInterface().GetOssiaAboveNs(out); }
  public GetOssiaBelowNs(out: number[]): void { this.GetStaffDefDrawingInterface().GetOssiaBelowNs(out); }
  public AlternateCurrentMeterSig(measure: unknown): void {
    this.GetStaffDefDrawingInterface().AlternateCurrentMeterSig(measure as never);
  }
  public GetCurrentClef(): unknown { return this.GetStaffDefDrawingInterface().GetCurrentClef(); }
  public SetCurrentClef(c: unknown): void { this.GetStaffDefDrawingInterface().SetCurrentClef(c); }
  public GetCurrentKeySig(): unknown { return this.GetStaffDefDrawingInterface().GetCurrentKeySig(); }
  public SetCurrentKeySig(k: unknown): void { this.GetStaffDefDrawingInterface().SetCurrentKeySig(k); }
  public GetCurrentMensur(): unknown { return this.GetStaffDefDrawingInterface().GetCurrentMensur(); }
  public SetCurrentMensur(v: unknown): void { this.GetStaffDefDrawingInterface().SetCurrentMensur(v); }
  public GetCurrentMeterSig(): unknown { return this.GetStaffDefDrawingInterface().GetCurrentMeterSig(); }
  public SetCurrentMeterSig(v: unknown): void { this.GetStaffDefDrawingInterface().SetCurrentMeterSig(v); }
  public GetCurrentMeterSigGrp(): unknown { return this.GetStaffDefDrawingInterface().GetCurrentMeterSigGrp(); }
  public SetCurrentMeterSigGrp(v: unknown): void { this.GetStaffDefDrawingInterface().SetCurrentMeterSigGrp(v); }
  public GetCurrentProport(): unknown { return this.GetStaffDefDrawingInterface().GetCurrentProport(); }
  public SetCurrentProport(v: unknown): void { this.GetStaffDefDrawingInterface().SetCurrentProport(v); }

  //--------------------------------------------//
  // Drawing visibility optimization             //
  //--------------------------------------------//

  public GetDrawingVisibility(): VisibilityOptimization { return this.m_drawingVisibility; }
  public SetDrawingVisibility(drawingIsVisible: VisibilityOptimization): void {
    this.m_drawingVisibility = drawingIsVisible;
  }

  //---------------------------//
  // Attribute facades          //
  //---------------------------//

  public ResetDistances(): void { this.attDistances!.ResetDistances(); }
  public SetDirDist(v: any): void { this.attDistances!.SetDirDist(v); }
  public GetDirDist(): any { return this.attDistances!.GetDirDist(); }
  public HasDirDist(): boolean { return this.attDistances!.HasDirDist(); }
  public SetDynamDist(v: number): void { this.attDistances!.SetDynamDist(v); }
  public GetDynamDist(): number { return this.attDistances!.GetDynamDist(); }
  public HasDynamDist(): boolean { return this.attDistances!.HasDynamDist(); }
  public SetHarmDist(v: number): void { this.attDistances!.SetHarmDist(v); }
  public GetHarmDist(): number { return this.attDistances!.GetHarmDist(); }
  public HasHarmDist(): boolean { return this.attDistances!.HasHarmDist(); }
  public SetRehDist(v: any): void { this.attDistances!.SetRehDist(v); }
  public GetRehDist(): any { return this.attDistances!.GetRehDist(); }
  public HasRehDist(): boolean { return this.attDistances!.HasRehDist(); }
  public SetTempoDist(v: any): void { this.attDistances!.SetTempoDist(v); }
  public GetTempoDist(): any { return this.attDistances!.GetTempoDist(); }
  public HasTempoDist(): boolean { return this.attDistances!.HasTempoDist(); }

  public ResetLabelled(): void { this.attLabelled!.ResetLabelled(); }
  public SetLabel(v: string): void { this.attLabelled!.SetLabel(v); }
  public GetLabel(): string { return this.attLabelled!.GetLabel(); }
  public HasLabel(): boolean { return this.attLabelled!.HasLabel(); }

  public ResetNInteger(): void { this.attNInteger!.ResetNInteger(); }
  public SetN(v: number): void { this.attNInteger!.SetN(v); }
  public GetN(): number { return this.attNInteger!.GetN(); }
  public HasN(): boolean { return this.attNInteger!.HasN(); }

  public ResetNotationType(): void { this.attNotationType!.ResetNotationType(); }
  public SetNotationtype(v: number): void { this.attNotationType!.SetNotationtype(v); }
  public GetNotationtype(): number { return this.attNotationType!.GetNotationtype(); }
  public HasNotationtype(): boolean { return this.attNotationType!.HasNotationtype(); }
  public SetNotationsubtype(v: string): void { this.attNotationType!.SetNotationsubtype(v); }
  public GetNotationsubtype(): string { return this.attNotationType!.GetNotationsubtype(); }
  public HasNotationsubtype(): boolean { return this.attNotationType!.HasNotationsubtype(); }

  public ResetScalable(): void { this.attScalable!.ResetScalable(); }
  public SetScale(v: number): void { this.attScalable!.SetScale(v); }
  public GetScale(): number { return this.attScalable!.GetScale(); }
  public HasScale(): boolean { return this.attScalable!.HasScale(); }

  public ResetStaffDefLog(): void { this.attStaffDefLog!.ResetStaffDefLog(); }
  public SetLines(v: any): void { this.attStaffDefLog!.SetLines(v); }
  public GetLines(): any { return this.attStaffDefLog!.GetLines(); }
  public HasLines(): boolean { return this.attStaffDefLog!.HasLines(); }

  public ResetStaffDefVis(): void { this.attStaffDefVis!.ResetStaffDefVis(); }
  public HasSpacing(): boolean { return this.attStaffDefVis ? this.attStaffDefVis.HasSpacing() : false; }
  public GetSpacing(): any { return this.attStaffDefVis!.GetSpacing(); }
  public SetSpacing(val: any): void { this.attStaffDefVis!.SetSpacing(val); }
  public GetLayerscheme(): number { return this.attStaffDefVis!.GetLayerscheme(); }
  public SetLayerscheme(v: number): void { this.attStaffDefVis!.SetLayerscheme(v); }
  public HasLayerscheme(): boolean { return this.attStaffDefVis!.HasLayerscheme(); }
  public GetLinesColor(): string { return this.attStaffDefVis!.GetLinesColor(); }
  public SetLinesColor(v: string): void { this.attStaffDefVis!.SetLinesColor(v); }
  public HasLinesColor(): boolean { return this.attStaffDefVis!.HasLinesColor(); }
  public GetLinesVisible(): number { return this.attStaffDefVis!.GetLinesVisible(); }
  public SetLinesVisible(v: number): void { this.attStaffDefVis!.SetLinesVisible(v); }
  public HasLinesVisible(): boolean { return this.attStaffDefVis!.HasLinesVisible(); }

  public ResetStaffDefVisTablature(): void { this.attStaffDefVisTablature!.ResetStaffDefVisTablature(); }
  public SetTabAlign(v: any): void { this.attStaffDefVisTablature!.SetTabAlign(v); }
  public GetTabAlign(): any { return this.attStaffDefVisTablature!.GetTabAlign(); }
  public HasTabAlign(): boolean { return this.attStaffDefVisTablature!.HasTabAlign(); }
  public SetTabAnchorline(v: any): void { this.attStaffDefVisTablature!.SetTabAnchorline(v); }
  public GetTabAnchorline(): any { return this.attStaffDefVisTablature!.GetTabAnchorline(); }
  public HasTabAnchorline(): boolean { return this.attStaffDefVisTablature!.HasTabAnchorline(); }

  public ResetTimeBase(): void { this.attTimeBase!.ResetTimeBase(); }
  public SetPpq(v: number): void { this.attTimeBase!.SetPpq(v); }
  public GetPpq(): number { return this.attTimeBase!.GetPpq(); }
  public HasPpq(): boolean { return this.attTimeBase!.HasPpq(); }

  public ResetTransposition(): void { this.attTransposition!.ResetTransposition(); }
  public SetTransDiat(v: any): void { this.attTransposition!.SetTransDiat(v); }
  public GetTransDiat(): any { return this.attTransposition!.GetTransDiat(); }
  public HasTransDiat(): boolean { return this.attTransposition!.HasTransDiat(); }
  public SetTransSemi(v: any): void { this.attTransposition!.SetTransSemi(v); }
  public GetTransSemi(): any { return this.attTransposition!.GetTransSemi(); }
  public HasTransSemi(): boolean { return this.attTransposition!.HasTransSemi(); }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitStaffDef', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitStaffDefEnd', this); }

  public override Clone(): VrvObject {
    const clone = new StaffDef();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attLabelled!.HasLabel()) clone.attLabelled!.SetLabel(this.attLabelled!.GetLabel());
    if (this.attNInteger!.HasN()) clone.attNInteger!.SetN(this.attNInteger!.GetN());
    if (this.attNotationType!.HasNotationtype()) clone.attNotationType!.SetNotationtype(this.attNotationType!.GetNotationtype());
    if (this.attNotationType!.HasNotationsubtype()) clone.attNotationType!.SetNotationsubtype(this.attNotationType!.GetNotationsubtype());
    if (this.attScalable!.HasScale()) clone.attScalable!.SetScale(this.attScalable!.GetScale());
    if (this.attStaffDefLog!.HasLines()) clone.attStaffDefLog!.SetLines(this.attStaffDefLog!.GetLines());
    if (this.attTimeBase!.HasPpq()) clone.attTimeBase!.SetPpq(this.attTimeBase!.GetPpq());
    if (this.attTransposition!.HasTransDiat()) clone.attTransposition!.SetTransDiat(this.attTransposition!.GetTransDiat());
    if (this.attTransposition!.HasTransSemi()) clone.attTransposition!.SetTransSemi(this.attTransposition!.GetTransSemi());
    if (this.attStaffDefVisTablature!.HasTabAlign()) clone.attStaffDefVisTablature!.SetTabAlign(this.attStaffDefVisTablature!.GetTabAlign());
    if (this.attStaffDefVisTablature!.HasTabAnchorline()) clone.attStaffDefVisTablature!.SetTabAnchorline(this.attStaffDefVisTablature!.GetTabAnchorline());
    clone.m_drawingVisibility = this.m_drawingVisibility;
    // C++ `StaffDef::Clone()` is `new StaffDef(*this)`; the implicit copy constructor
    // also copies the StaffDefDrawingInterface base (current clef/keySig/mensur/
    // meterSig + draw flags), which `Object::operator=` alone does not carry.
    copyStaffDefDrawingState(this, clone);
    return clone;
  }
}

/** C++ implicit StaffDef copy-constructor parity for the drawing interface base. */
function copyStaffDefDrawingState(source: StaffDef, target: StaffDef): void {
  const src = source.GetStaffDefDrawingInterface();
  const dst = target.GetStaffDefDrawingInterface();
  const current: Array<keyof StaffDefDrawingInterface> = [
    'm_currentClef', 'm_currentKeySig', 'm_currentMensur', 'm_currentMeterSig', 'm_currentMeterSigGrp', 'm_currentProport',
  ];
  for (const key of current) {
    const value = src[key] as { Clone?(): unknown } | undefined;
    (dst as unknown as Record<string, unknown>)[key] = value?.Clone ? value.Clone() : value;
  }
  dst.m_drawClef = src.m_drawClef;
  dst.m_drawKeySig = src.m_drawKeySig;
  dst.m_drawMensur = src.m_drawMensur;
  dst.m_drawMeterSig = src.m_drawMeterSig;
  dst.m_drawMeterSigGrp = src.m_drawMeterSigGrp;
  dst.m_ossiasAbove = [...src.m_ossiasAbove];
  dst.m_ossiasBelow = [...src.m_ossiasBelow];
}

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_DISTANCES = 122;
const ATT_LABELLED = 145;
const ATT_NINTEGER = 167;
const ATT_NOTATIONTYPE = 0;
const ATT_SCALABLE = 194;
const ATT_STAFFDEFLOG = 201;
const ATT_STAFFDEFVIS = 283;
const ATT_STAFFDEFVISTABLATURE = 240;
const ATT_TIMEBASE = 84;
const ATT_TRANSPOSITION = 220;

/** C++ FunctorInterface default forwarding helper (VisitStaffDef -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('staffDef', ClassId.STAFFDEF, () => new StaffDef());

// C++ m_currentKeySig is a value member (drawinginterface.h:341) that exists
// even when no <keySig> was imported: Layer::SetDrawingStaffDefValues clones
// it (`new KeySig(*GetCurrentKeySig())`, layer.cpp:586-588) whenever
// DrawKeySig() is true, so an empty staffDef keySig still renders an empty <g>.
// keysig.ts does not import staffdef.ts, so this direct registration is acyclic.
SetStaffDefKeySigCtor(KeySig as unknown as new () => any);
SetStaffDefClefCtor(Clef);
