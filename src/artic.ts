/**
 * Pure TypeScript translation of Verovio's src/artic.cpp / include/vrv/artic.h.
 * Native/libMEI collaborators remain explicit structural boundaries until their
 * canonical implementations are migrated; Artic's algorithms mirror C++.
 */
import { ObjectFactory, VrvObject } from './object.js';
import { LayerElement } from './layerelement.js';
import { OffsetInterface } from './offsetinterface.js';
import { ClassId, FunctorCode, InterfaceId, STAFFREL_above, STAFFREL_below } from './vrvdef.js';
import { Functor } from './functor.js';
import {
  SMUFL_E4A0_articAccentAbove, SMUFL_ED40_articSoftAccentAbove, SMUFL_E4A2_articStaccatoAbove,
  SMUFL_E4A4_articTenutoAbove, SMUFL_E4A8_articStaccatissimoWedgeAbove, SMUFL_E4AC_articMarcatoAbove,
  SMUFL_E4A6_articStaccatissimoAbove, SMUFL_E610_stringsDownBow, SMUFL_E612_stringsUpBow,
  SMUFL_E614_stringsHarmonic, SMUFL_E631_pluckedSnapPizzicatoAbove, SMUFL_E636_pluckedWithFingernails,
  SMUFL_E638_pluckedDamp, SMUFL_E639_pluckedDampAll, SMUFL_E5E7_brassMuteOpen, SMUFL_E5E5_brassMuteClosed,
  SMUFL_E633_pluckedLeftHandPizzicato, SMUFL_E4AA_articStaccatissimoStrokeAbove,
  SMUFL_E4A1_articAccentBelow, SMUFL_ED41_articSoftAccentBelow, SMUFL_E4A3_articStaccatoBelow,
  SMUFL_E4A5_articTenutoBelow, SMUFL_E4A9_articStaccatissimoWedgeBelow, SMUFL_E4AD_articMarcatoBelow,
  SMUFL_E4A7_articStaccatissimoBelow, SMUFL_E611_stringsDownBowTurned, SMUFL_E613_stringsUpBowTurned,
  SMUFL_E630_pluckedSnapPizzicatoBelow, SMUFL_E4AB_articStaccatissimoStrokeBelow,
  SMUFL_E26A_accidentalParensLeft, SMUFL_E26B_accidentalParensRight,
  SMUFL_E26C_accidentalBracketLeft, SMUFL_E26D_accidentalBracketRight,
} from './smufl.js';

import {
  InstArticulation,
  InstColor,
  InstEnclosingChars,
  InstPlacementRelEvent,
} from './atts_shared.js';
import { InstArticulationGes } from './atts_gestural.js';

export enum data_ARTICULATION {
  NONE = 0, acc, acc_inv, acc_long, acc_soft, stacc, ten, stacciss, marc, spicc, stress, unstress,
  doit, scoop, rip, plop, fall, longfall, bend, flip, smear, shake, dnbow, upbow, harm, snap,
  fingernail, damp, dampall, open, stop, dbltongue, trpltongue, heel, toe, tap, lhpizz, dot, stroke,
}
export type data_ARTICULATION_List = data_ARTICULATION[];
export type data_STAFFREL = number;
const STAFFREL_NONE = 0;

/** AttClassId values from libmei/dist/attclasses.h. */
const ATT_EXTSYMAUTH = 46;
const ATT_EXTSYMNAMES = 47;
const ATT_ARTICULATIONGES = 52;
const ATT_ARTICULATION = 94;
const ATT_COLOR = 109;
const ATT_ENCLOSINGCHARS = 129;
const ATT_PLACEMENTRELEVENT = 185;
const ATT_VISUALOFFSETHO = 229;
const ATT_VISUALOFFSETVO = 231;

class ExternalSymbolAttributes {
  private glyphAuth = ''; private glyphUri = ''; private glyphName = ''; private glyphNum = 0;
  ResetExtSymAuth(): void { this.glyphAuth = ''; this.glyphUri = ''; }
  ResetExtSymNames(): void { this.glyphName = ''; this.glyphNum = 0; }
  HasGlyphAuth(): boolean { return this.glyphAuth !== ''; }
  GetGlyphAuth(): string { return this.glyphAuth; }
  SetGlyphAuth(v: string): void { this.glyphAuth = v; }
  HasGlyphUri(): boolean { return this.glyphUri !== ''; }
  GetGlyphUri(): string { return this.glyphUri; }
  SetGlyphUri(v: string): void { this.glyphUri = v; }
  HasGlyphName(): boolean { return this.glyphName !== ''; }
  GetGlyphName(): string { return this.glyphName; }
  SetGlyphName(v: string): void { this.glyphName = v; }
  HasGlyphNum(): boolean { return this.glyphNum !== 0; }
  GetGlyphNum(): number { return this.glyphNum; }
  SetGlyphNum(v: number): void { this.glyphNum = v; }
}

export interface ArticResourcesLike {
  GetGlyph(code: number): unknown;
  GetGlyphCode(name: string): number;
}
export interface ArticElementLike {
  GetFirst?(): VrvObject | null;
  GetLast?(): VrvObject | null;
  FindAllDescendantsBetween?(out: VrvObject[], match: unknown, first: VrvObject, last: VrvObject): void;
}
export interface ArticFunctorLike {
  VisitArtic?(artic: Artic): FunctorCode;
  VisitArticEnd?(artic: Artic): FunctorCode;
}
function visit(functor: unknown, name: 'VisitArtic'|'VisitArticEnd', self: Artic): FunctorCode {
  const fn = (functor as Record<string, unknown>)[name];
  return typeof fn === 'function' ? (fn as unknown as (self: Artic) => FunctorCode).call(functor, self) : FunctorCode.FUNCTOR_CONTINUE;
}

export class Artic extends LayerElement {
  public static readonly s_outStaffArtic: data_ARTICULATION[] = [
    data_ARTICULATION.acc, data_ARTICULATION.acc_soft, data_ARTICULATION.dnbow, data_ARTICULATION.marc,
    data_ARTICULATION.upbow, data_ARTICULATION.harm, data_ARTICULATION.snap, data_ARTICULATION.fingernail,
    data_ARTICULATION.damp, data_ARTICULATION.dampall, data_ARTICULATION.lhpizz, data_ARTICULATION.open, data_ARTICULATION.stop,
  ];
  public static readonly s_aboveStaffArtic: data_ARTICULATION[] = [
    data_ARTICULATION.dnbow, data_ARTICULATION.marc, data_ARTICULATION.upbow, data_ARTICULATION.harm,
    data_ARTICULATION.snap, data_ARTICULATION.fingernail, data_ARTICULATION.damp, data_ARTICULATION.dampall,
    data_ARTICULATION.lhpizz, data_ARTICULATION.open, data_ARTICULATION.stop,
  ];

  private offset?: OffsetInterface;
  private articulation?: InstArticulation;
  private articulationGes?: InstArticulationGes;
  private color?: InstColor;
  private enclosing?: InstEnclosingChars;
  private external?: ExternalSymbolAttributes;
  private placementRelEvent?: InstPlacementRelEvent;
  private m_drawingPlace: data_STAFFREL = STAFFREL_NONE;
  public readonly m_startSlurPositioners: unknown[] = [];
  public readonly m_endSlurPositioners: unknown[] = [];

  public IsCentered(artic: data_ARTICULATION): boolean {
    return Artic.IsCentered(artic);
  }
  public VerticalCorr(code: number, place: data_STAFFREL): boolean {
    return Artic.VerticalCorr(code, place);
  }

  public constructor() {
    super(ClassId.ARTIC);
    this.ensureAttributes();
    this.RegisterInterface([ATT_VISUALOFFSETHO, ATT_VISUALOFFSETVO], InterfaceId.INTERFACE_OFFSET);
    for (const id of [ATT_ARTICULATION, ATT_ARTICULATIONGES, ATT_COLOR, ATT_ENCLOSINGCHARS, ATT_EXTSYMAUTH, ATT_EXTSYMNAMES, ATT_PLACEMENTRELEVENT]) this.RegisterAttClass(id);
    this.Reset();
  }
  private ensureAttributes(): void {
    this.offset ??= new OffsetInterface();
    this.articulation ??= new InstArticulation();
    this.articulationGes ??= new InstArticulationGes();
    this.color ??= new InstColor();
    this.enclosing ??= new InstEnclosingChars();
    this.external ??= new ExternalSymbolAttributes();
    this.placementRelEvent ??= new InstPlacementRelEvent();
  }
  public override Reset(): void {
    super.Reset(); this.ensureAttributes();
    this.offset!.Reset(); this.articulation!.ResetArticulation(); this.articulationGes!.ResetArticulationGes();
    this.color!.ResetColor(); this.enclosing!.ResetEnclosingChars(); this.external!.ResetExtSymAuth(); this.external!.ResetExtSymNames();
    this.placementRelEvent!.ResetPlacementRelEvent(); this.m_drawingPlace = STAFFREL_NONE;
  }
  public override Clone(): VrvObject { const c = new Artic(); c.AssignFrom(this); c.SetArtic(this.GetArtic()); c.SetEnclose(this.GetEnclose()); c.SetGlyphName(this.GetGlyphName()); c.SetGlyphNum(this.GetGlyphNum()); c.SetDrawingPlace(this.GetDrawingPlace()); return c; }
  public override GetClassName(): string { return 'artic'; }
  public GetOffsetInterface(): OffsetInterface { this.ensureAttributes(); return this.offset!; }
  public HasToBeAligned(): boolean { return true; }
  public IsRelativeToStaff(): boolean { return true; }
  public GetArticFirst(): data_ARTICULATION { const a = this.GetArtic(); return a.length ? a[0] : data_ARTICULATION.NONE; }
  public GetArtic(): data_ARTICULATION_List { return this.articulation!.GetArtic(); }
  public SetArtic(v: data_ARTICULATION_List): void { this.articulation!.SetArtic(v); }
  public HasArtic(): boolean { return this.articulation!.HasArtic(); }
  public ResetArticulation(): void { this.articulation!.ResetArticulation(); }
  public GetArticGes(): data_ARTICULATION_List { return this.articulationGes!.GetArticGes(); }
  public SetArticGes(v: data_ARTICULATION_List): void { this.articulationGes!.SetArticGes(v); }
  public HasArticGes(): boolean { return this.articulationGes!.HasArticGes(); }
  public ResetArticulationGes(): void { this.articulationGes!.ResetArticulationGes(); }
  public GetColor(): string { return this.color!.GetColor(); }
  public SetColor(v: string): void { this.color!.SetColor(v); }
  public HasColor(): boolean { return this.color!.HasColor(); }
  public ResetColor(): void { this.color!.ResetColor(); }
  public GetEnclose(): number { return this.enclosing!.GetEnclose(); }
  public SetEnclose(v: number): void { this.enclosing!.SetEnclose(v); }
  public HasEnclose(): boolean { return this.enclosing!.HasEnclose(); }
  public ResetEnclosingChars(): void { this.enclosing!.ResetEnclosingChars(); }
  public HasGlyphAuth(): boolean { return this.external!.HasGlyphAuth(); }
  public GetGlyphAuth(): string { return this.external!.GetGlyphAuth(); }
  public SetGlyphAuth(v: string): void { this.external!.SetGlyphAuth(v); }
  public HasGlyphUri(): boolean { return this.external!.HasGlyphUri(); }
  public GetGlyphUri(): string { return this.external!.GetGlyphUri(); }
  public SetGlyphUri(v: string): void { this.external!.SetGlyphUri(v); }
  public HasGlyphName(): boolean { return this.external!.HasGlyphName(); }
  public GetGlyphName(): string { return this.external!.GetGlyphName(); }
  public SetGlyphName(v: string): void { this.external!.SetGlyphName(v); }
  public HasGlyphNum(): boolean { return this.external!.HasGlyphNum(); }
  public GetGlyphNum(): number { return this.external!.GetGlyphNum(); }
  public SetGlyphNum(v: number): void { this.external!.SetGlyphNum(v); }
  public IsInsideArtic(artic = this.GetArticFirst()): boolean { return this.GetEnclose() !== 2 && this.GetEnclose() !== 1 && !Artic.s_outStaffArtic.includes(artic); }
  public IsOutsideArtic(): boolean { return !this.IsInsideArtic(); }
  public AlwaysAbove(): boolean { return Artic.s_aboveStaffArtic.includes(this.GetArticFirst()); }
  public GetPlace(): data_STAFFREL { return this.placementRelEvent!.GetPlace(); }
  public SetPlace(v: data_STAFFREL): void { this.ensureAttributes(); this.placementRelEvent!.SetPlace(v); }
  public HasPlace(): boolean { return this.placementRelEvent!.HasPlace(); }
  public ResetPlacementRelEvent(): void { this.ensureAttributes(); this.placementRelEvent!.ResetPlacementRelEvent(); }
  public GetDrawingPlace(): data_STAFFREL { return this.m_drawingPlace; }
  public SetDrawingPlace(v: data_STAFFREL): void { this.m_drawingPlace = v; }
  public AddSlurPositioner(positioner: unknown, start: boolean): void { const list = start ? this.m_startSlurPositioners : this.m_endSlurPositioners; if (!list.includes(positioner)) list.push(positioner); }

  public GetAllArtics(_direction: boolean, artics: Artic[]): void {
    const parent = this.GetFirstAncestor(ClassId.CHORD) ?? this.GetFirstAncestor(ClassId.NOTE);
    if (!parent) return;
    const finder = parent as unknown as ArticElementLike;
    const first = _direction ? this : (finder.GetFirst?.() ?? this);
    const last = !_direction ? this : (finder.GetLast?.() ?? this);
    const children: VrvObject[] = [];
    finder.FindAllDescendantsBetween?.(children, { IsMatch: (x: VrvObject) => x.Is(ClassId.ARTIC) }, first, last);
    for (const child of children) if (child !== this && child instanceof Artic && child.GetDrawingPlace() === this.GetDrawingPlace()) artics.push(child);
  }

  public GetArticGlyph(artic: data_ARTICULATION, place: data_STAFFREL): number {
    const resources = this.GetDocResources() as unknown as ArticResourcesLike | null; if (!resources) return 0;
    if (this.HasGlyphNum()) { const code = this.GetGlyphNum(); if (resources.GetGlyph(code)) return code; }
    else if (this.HasGlyphName()) { const code = resources.GetGlyphCode(this.GetGlyphName()); if (resources.GetGlyph(code)) return code; }
    if (place === STAFFREL_above) return ({
      [data_ARTICULATION.acc]:SMUFL_E4A0_articAccentAbove,[data_ARTICULATION.acc_soft]:SMUFL_ED40_articSoftAccentAbove,[data_ARTICULATION.stacc]:SMUFL_E4A2_articStaccatoAbove,[data_ARTICULATION.ten]:SMUFL_E4A4_articTenutoAbove,[data_ARTICULATION.stacciss]:SMUFL_E4A8_articStaccatissimoWedgeAbove,[data_ARTICULATION.marc]:SMUFL_E4AC_articMarcatoAbove,[data_ARTICULATION.spicc]:SMUFL_E4A6_articStaccatissimoAbove,[data_ARTICULATION.dnbow]:SMUFL_E610_stringsDownBow,[data_ARTICULATION.upbow]:SMUFL_E612_stringsUpBow,[data_ARTICULATION.harm]:SMUFL_E614_stringsHarmonic,[data_ARTICULATION.snap]:SMUFL_E631_pluckedSnapPizzicatoAbove,[data_ARTICULATION.fingernail]:SMUFL_E636_pluckedWithFingernails,[data_ARTICULATION.damp]:SMUFL_E638_pluckedDamp,[data_ARTICULATION.dampall]:SMUFL_E639_pluckedDampAll,[data_ARTICULATION.open]:SMUFL_E5E7_brassMuteOpen,[data_ARTICULATION.stop]:SMUFL_E5E5_brassMuteClosed,[data_ARTICULATION.lhpizz]:SMUFL_E633_pluckedLeftHandPizzicato,[data_ARTICULATION.dot]:SMUFL_E4A2_articStaccatoAbove,[data_ARTICULATION.stroke]:SMUFL_E4AA_articStaccatissimoStrokeAbove,
    } as Record<number,number>)[artic] ?? 0;
    if (place === STAFFREL_below) return ({
      [data_ARTICULATION.acc]:SMUFL_E4A1_articAccentBelow,[data_ARTICULATION.acc_soft]:SMUFL_ED41_articSoftAccentBelow,[data_ARTICULATION.stacc]:SMUFL_E4A3_articStaccatoBelow,[data_ARTICULATION.ten]:SMUFL_E4A5_articTenutoBelow,[data_ARTICULATION.stacciss]:SMUFL_E4A9_articStaccatissimoWedgeBelow,[data_ARTICULATION.marc]:SMUFL_E4AD_articMarcatoBelow,[data_ARTICULATION.spicc]:SMUFL_E4A7_articStaccatissimoBelow,[data_ARTICULATION.dnbow]:SMUFL_E611_stringsDownBowTurned,[data_ARTICULATION.upbow]:SMUFL_E613_stringsUpBowTurned,[data_ARTICULATION.harm]:SMUFL_E614_stringsHarmonic,[data_ARTICULATION.snap]:SMUFL_E630_pluckedSnapPizzicatoBelow,[data_ARTICULATION.fingernail]:SMUFL_E636_pluckedWithFingernails,[data_ARTICULATION.damp]:SMUFL_E638_pluckedDamp,[data_ARTICULATION.dampall]:SMUFL_E639_pluckedDampAll,[data_ARTICULATION.open]:SMUFL_E5E7_brassMuteOpen,[data_ARTICULATION.stop]:SMUFL_E5E5_brassMuteClosed,[data_ARTICULATION.lhpizz]:SMUFL_E633_pluckedLeftHandPizzicato,[data_ARTICULATION.dot]:SMUFL_E4A3_articStaccatoBelow,[data_ARTICULATION.stroke]:SMUFL_E4AB_articStaccatissimoStrokeBelow,
    } as Record<number,number>)[artic] ?? 0;
    return 0;
  }
  public GetEnclosingGlyphs(): [number, number] { if (this.HasEnclose()) return this.GetEnclose()===2?[SMUFL_E26C_accidentalBracketLeft,SMUFL_E26D_accidentalBracketRight]:[SMUFL_E26A_accidentalParensLeft,SMUFL_E26B_accidentalParensRight]; return [0,0]; }
  public static VerticalCorr(code: number, place: data_STAFFREL): boolean {
    if (place === STAFFREL_above) return false;
    return [SMUFL_E5E5_brassMuteClosed, SMUFL_E5E7_brassMuteOpen, SMUFL_E611_stringsDownBowTurned, SMUFL_E613_stringsUpBowTurned, SMUFL_E614_stringsHarmonic, SMUFL_E630_pluckedSnapPizzicatoBelow, SMUFL_E633_pluckedLeftHandPizzicato, SMUFL_E636_pluckedWithFingernails, SMUFL_E638_pluckedDamp, SMUFL_E639_pluckedDampAll].includes(code);
  }
  public static IsCentered(artic: data_ARTICULATION): boolean { return artic === data_ARTICULATION.stacc || artic === data_ARTICULATION.ten; }
  public override Accept(functor: Functor): FunctorCode { return visit(functor, 'VisitArtic' as never, this); }
  public override AcceptEnd(functor: Functor): FunctorCode { return visit(functor, 'VisitArticEnd' as never, this); }
}

ObjectFactory.GetInstance().Register('artic', ClassId.ARTIC, () => new Artic());
