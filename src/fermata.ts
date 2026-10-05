import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, VrvObject } from './object.js';
import { ControlElement } from './controlelement.js';
import { TimePointInterface } from './timeinterface.js';
import { InstEnclosingChars, InstPlacementRelStaff } from './atts_shared.js';
import { InstExtSymAuth, InstExtSymNames } from './atts_externalsymbols.js';
import { InstFermataVis } from './atts_visual.js';
import { StaffRel } from './textdirinterface.js';
import {
  SMUFL_E26A_accidentalParensLeft,
  SMUFL_E26B_accidentalParensRight,
  SMUFL_E26C_accidentalBracketLeft,
  SMUFL_E26D_accidentalBracketRight,
  SMUFL_E4C0_fermataAbove,
  SMUFL_E4C1_fermataBelow,
  SMUFL_E4C2_fermataVeryShortAbove,
  SMUFL_E4C3_fermataVeryShortBelow,
  SMUFL_E4C4_fermataShortAbove,
  SMUFL_E4C5_fermataShortBelow,
  SMUFL_E4C6_fermataLongAbove,
  SMUFL_E4C7_fermataLongBelow,
  SMUFL_E4C8_fermataVeryLongAbove,
  SMUFL_E4C9_fermataVeryLongBelow,
} from './smufl.js';

// Canonical libmei att-class ordinals (libmei/dist/attclasses.h ordering used by
// the canonical C++ RegisterAttClass calls).
const ATT_ENCLOSINGCHARS = 129;
const ATT_EXTSYMAUTH = 46;
const ATT_EXTSYMNAMES = 47;
const ATT_FERMATAVIS = 258;
const ATT_PLACEMENTRELSTAFF = 186;

// Canonical fermataVis enum ordinals (libmei/dist/atttypes.h).
export const fermataVis_FORM_NONE = 0;
export const fermataVis_FORM_inv = 1;
export const fermataVis_FORM_norm = 2;
export const fermataVis_SHAPE_NONE = 0;
export const fermataVis_SHAPE_curved = 1;
export const fermataVis_SHAPE_square = 2;
export const fermataVis_SHAPE_angular = 3;

// data_VERTICALALIGNMENT ordinals (libmei/dist/atttypes.h).
export const VERTICALALIGNMENT_NONE = 0;
export const VERTICALALIGNMENT_top = 1;
export const VERTICALALIGNMENT_middle = 2;
export const VERTICALALIGNMENT_bottom = 3;

// Canonical ENCLOSURE ordinals (shared with accid.ts).
export const ENCLOSURE_NONE = 0;
export const ENCLOSURE_paren = 1;
export const ENCLOSURE_brack = 2;

/** Resources contract consumed by Fermata::GetFermataGlyph; matches canonical resources.ts. */
export interface FermataResourcesLike {
  GetGlyph(code: number): unknown | null;
  GetGlyphCode(smuflName: string): number;
}

/** Pure TypeScript translation of Verovio's src/fermata.cpp / include/vrv/fermata.h. */
export class Fermata extends ControlElement {
  private timePointInterface: TimePointInterface | null = null;
  private enclosingChars: InstEnclosingChars | null = null;
  private extSymAuth: InstExtSymAuth | null = null;
  private extSymNames: InstExtSymNames | null = null;
  private fermataVis: InstFermataVis | null = null;
  private placementRelStaff: InstPlacementRelStaff | null = null;

  public constructor() {
    super(ClassId.FERMATA);
    this.timePointInterface = new TimePointInterface();
    this.enclosingChars = new InstEnclosingChars();
    this.extSymAuth = new InstExtSymAuth();
    this.extSymNames = new InstExtSymNames();
    this.fermataVis = new InstFermataVis();
    this.placementRelStaff = new InstPlacementRelStaff();
    this.RegisterInterface(this.timePointInterface.GetAttClasses(), this.timePointInterface.IsInterface());
    this.RegisterAttClass(ATT_ENCLOSINGCHARS);
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.RegisterAttClass(ATT_FERMATAVIS);
    this.RegisterAttClass(ATT_PLACEMENTRELSTAFF);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.timePointInterface ??= new TimePointInterface();
    this.enclosingChars ??= new InstEnclosingChars();
    this.extSymAuth ??= new InstExtSymAuth();
    this.extSymNames ??= new InstExtSymNames();
    this.fermataVis ??= new InstFermataVis();
    this.placementRelStaff ??= new InstPlacementRelStaff();
    this.timePointInterface.Reset();
    this.enclosingChars!.ResetEnclosingChars();
    this.extSymAuth!.ResetExtSymAuth();
    this.extSymNames!.ResetExtSymNames();
    this.fermataVis!.ResetFermataVis();
    this.ResetPlacementRelStaff();
  }

  public override GetClassName(): string { return 'fermata'; }

  public GetTimePointInterface(): TimePointInterface {
    this.timePointInterface ??= new TimePointInterface();
    return this.timePointInterface;
  }

  /** Get the SMuFL glyph for the fermata based on type, shape or glyph.num */
  public GetFermataGlyph(): number {
    const resources = this.GetDocResources() as unknown as FermataResourcesLike | null;
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

    // check for shape
    if (this.GetShape() === fermataVis_SHAPE_angular) {
      if (this.GetForm() === fermataVis_FORM_inv
        || (this.GetPlace() === StaffRel.below && !(this.GetForm() === fermataVis_FORM_norm))) {
        return SMUFL_E4C5_fermataShortBelow;
      }
      return SMUFL_E4C4_fermataShortAbove;
    }
    else if (this.GetShape() === fermataVis_SHAPE_square) {
      if (this.GetForm() === fermataVis_FORM_inv
        || (this.GetPlace() === StaffRel.below && !(this.GetForm() === fermataVis_FORM_norm))) {
        return SMUFL_E4C7_fermataLongBelow;
      }
      return SMUFL_E4C6_fermataLongAbove;
    }
    else if (this.GetForm() === fermataVis_FORM_inv
      || (this.GetPlace() === StaffRel.below && !(this.GetForm() === fermataVis_FORM_norm))) {
      return SMUFL_E4C1_fermataBelow;
    }

    // If no other attributes match, return default one (fermataAbove)
    return SMUFL_E4C0_fermataAbove;
  }

  /** Retrieve parentheses / brackets from the enclose attribute */
  public GetEnclosingGlyphs(): [number, number] {
    if (this.HasEnclose()) {
      switch (this.GetEnclose()) {
        case ENCLOSURE_brack: return [SMUFL_E26C_accidentalBracketLeft, SMUFL_E26D_accidentalBracketRight];
        case ENCLOSURE_paren: return [SMUFL_E26A_accidentalParensLeft, SMUFL_E26B_accidentalParensRight];
        default: break;
      }
    }
    return [0, 0];
  }

  /** Retrieves the vertical alignment for the fermata SMuFL code (static in C++). */
  public static GetVerticalAlignment(code: number): number {
    switch (code) {
      case SMUFL_E4C0_fermataAbove:
      case SMUFL_E4C2_fermataVeryShortAbove:
      case SMUFL_E4C4_fermataShortAbove:
      case SMUFL_E4C6_fermataLongAbove:
      case SMUFL_E4C8_fermataVeryLongAbove:
        return VERTICALALIGNMENT_top;

      case SMUFL_E4C1_fermataBelow:
      case SMUFL_E4C3_fermataVeryShortBelow:
      case SMUFL_E4C5_fermataShortBelow:
      case SMUFL_E4C7_fermataLongBelow:
      case SMUFL_E4C9_fermataVeryLongBelow:
        return VERTICALALIGNMENT_bottom;

      default:
        return VERTICALALIGNMENT_middle;
    }
  }

  // AttExtSymAuth forwarding
  public ResetExtSymAuth(): void { this.extSymAuth!.ResetExtSymAuth(); }
  public SetGlyphAuth(glyphAuth: string): void { this.extSymAuth!.SetGlyphAuth(glyphAuth); }
  public GetGlyphAuth(): string { return this.extSymAuth!.GetGlyphAuth(); }
  public HasGlyphAuth(): boolean { return this.extSymAuth!.HasGlyphAuth(); }
  public SetGlyphUri(glyphUri: string): void { this.extSymAuth!.SetGlyphUri(glyphUri); }
  public GetGlyphUri(): string { return this.extSymAuth!.GetGlyphUri(); }
  public HasGlyphUri(): boolean { return this.extSymAuth!.HasGlyphUri(); }

  // AttExtSymNames forwarding
  public ResetExtSymNames(): void { this.extSymNames!.ResetExtSymNames(); }
  public SetGlyphName(glyphName: string): void { this.extSymNames!.SetGlyphName(glyphName); }
  public GetGlyphName(): string { return this.extSymNames!.GetGlyphName(); }
  public HasGlyphName(): boolean { return this.extSymNames!.HasGlyphName(); }
  public SetGlyphNum(glyphNum: number): void { this.extSymNames!.SetGlyphNum(glyphNum); }
  public GetGlyphNum(): number { return this.extSymNames!.GetGlyphNum(); }
  public HasGlyphNum(): boolean { return this.extSymNames!.HasGlyphNum(); }

  // AttFermataVis forwarding
  public SetForm(form_: number): void { this.fermataVis!.SetForm(form_); }
  public GetForm(): number { return this.fermataVis!.GetForm(); }
  public HasForm(): boolean { return this.fermataVis!.HasForm(); }
  public SetShape(shape_: number): void { this.fermataVis!.SetShape(shape_); }
  public GetShape(): number { return this.fermataVis!.GetShape(); }
  public HasShape(): boolean { return this.fermataVis!.HasShape(); }
  public ResetFermataVis(): void { this.fermataVis!.ResetFermataVis(); }

  // AttEnclosingChars forwarding
  public SetEnclose(value: number): void { this.enclosingChars!.SetEnclose(value); }
  public GetEnclose(): number { return this.enclosingChars!.GetEnclose(); }
  public HasEnclose(): boolean { return this.enclosingChars!.HasEnclose(); }
  public ResetEnclosingChars(): void { this.enclosingChars!.ResetEnclosingChars(); }

  // TimePointInterface forwarding
  public SetStartid(id: string): void { this.timePointInterface!.SetStartid(id); }
  public GetStart(): unknown { return this.GetTimePointInterface().GetStart(); }
  public SetStart(start: unknown): void { this.GetTimePointInterface().SetStart(start as never); }
  public GetTstampStaves(measure: unknown, object: unknown): unknown[] { return this.GetTimePointInterface().GetTstampStaves(measure as never, object as never); }
  public GetStartid(): string { return this.timePointInterface!.GetStartid(); }
  public HasStartid(): boolean { return this.timePointInterface!.HasStartid(); }
  public SetTstamp(ts: number): void { this.timePointInterface!.SetTstamp(ts); }
  public GetTstamp(): number { return this.timePointInterface!.GetTstamp(); }
  public HasTstamp(): boolean { return this.timePointInterface!.HasTstamp(); }
  public SetStaff(staff: number[]): void { this.timePointInterface!.SetStaff(staff); }
  public GetStaff(): number[] { return this.timePointInterface!.GetStaff(); }
  public HasStaff(): boolean { return this.timePointInterface!.HasStaff(); }

  // AttPlacementRelStaff forwarding
  public SetPlace(v: StaffRel): void { this.placementRelStaff!.SetPlace(v); }
  public GetPlace(): StaffRel { return this.placementRelStaff!.GetPlace(); }
  public HasPlace(): boolean { return this.placementRelStaff!.HasPlace(); }
  public ResetPlacementRelStaff(): void { this.placementRelStaff!.ResetPlacementRelStaff(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitFermata');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitFermata');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitFermataEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitFermataEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Fermata {
    const clone = new Fermata();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all interface/attribute members.
    const tp = this.GetTimePointInterface();
    const ctp = clone.GetTimePointInterface();
    if (tp.HasPart()) ctp.SetPart(tp.GetPart());
    if (tp.HasStaff()) ctp.SetStaff(tp.GetStaff());
    if (tp.HasStartid()) ctp.SetStartid(tp.GetStartid());
    if (tp.HasTstamp()) ctp.SetTstamp(tp.GetTstamp());
    if (this.HasEnclose()) clone.SetEnclose(this.GetEnclose());
    if (this.HasGlyphAuth()) clone.SetGlyphAuth(this.GetGlyphAuth());
    if (this.HasGlyphUri()) clone.SetGlyphUri(this.GetGlyphUri());
    if (this.HasGlyphName()) clone.SetGlyphName(this.GetGlyphName());
    if (this.HasGlyphNum()) clone.SetGlyphNum(this.GetGlyphNum());
    if (this.HasForm()) clone.SetForm(this.GetForm());
    if (this.HasShape()) clone.SetShape(this.GetShape());
    if (this.HasPlace()) clone.SetPlace(this.GetPlace());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('fermata', ClassId.FERMATA, () => new Fermata());
