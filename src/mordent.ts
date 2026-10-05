import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, VrvObject } from './object.js';
import { ControlElement } from './controlelement.js';
import { TimePointInterface } from './timeinterface.js';
import { InstEnclosingChars, InstPlacementRelStaff } from './atts_shared.js';
import { InstExtSymAuth, InstExtSymNames } from './atts_externalsymbols.js';
import { InstMordentLog, InstOrnamentAccid, mordentLog_FORM_upper } from './atts_cmnornaments.js';
import { StaffRel } from './textdirinterface.js';
import {
  SMUFL_E26A_accidentalParensLeft,
  SMUFL_E26B_accidentalParensRight,
  SMUFL_E26C_accidentalBracketLeft,
  SMUFL_E26D_accidentalBracketRight,
  SMUFL_E56C_ornamentShortTrill,
  SMUFL_E56D_ornamentMordent,
  SMUFL_E56E_ornamentTremblement,
  SMUFL_E5BD_ornamentPrecompTrillWithMordent,
} from './smufl.js';
import { ENCLOSURE_paren, ENCLOSURE_brack } from './fermata.js';

// Canonical libmei att-class ordinals used by the C++ RegisterAttClass calls.
const ATT_ENCLOSINGCHARS = 129;
const ATT_EXTSYMAUTH = 46;
const ATT_EXTSYMNAMES = 47;
const ATT_ORNAMENTACCID = 41;
const ATT_PLACEMENTRELSTAFF = 186;
const ATT_MORDENTLOG = 39;

// data_BOOLEAN ordinals (libmei/dist/atttypes.h).
const BOOLEAN_true = 1;

/** Resources contract consumed by Mordent::GetMordentGlyph; matches canonical resources.ts. */
export interface MordentResourcesLike {
  GetGlyph(code: number): unknown | null;
  GetGlyphCode(smuflName: string): number;
}

/** Pure TypeScript translation of Verovio's src/mordent.cpp / include/vrv/mordent.h. */
export class Mordent extends ControlElement {
  private timePointInterface: TimePointInterface | null = null;
  private enclosingChars: InstEnclosingChars | null = null;
  private extSymAuth: InstExtSymAuth | null = null;
  private extSymNames: InstExtSymNames | null = null;
  private ornamentAccid: InstOrnamentAccid | null = null;
  private placementRelStaff: InstPlacementRelStaff | null = null;
  private mordentLog: InstMordentLog | null = null;

  public constructor() {
    super(ClassId.MORDENT);
    this.timePointInterface = new TimePointInterface();
    this.enclosingChars = new InstEnclosingChars();
    this.extSymAuth = new InstExtSymAuth();
    this.extSymNames = new InstExtSymNames();
    this.ornamentAccid = new InstOrnamentAccid();
    this.placementRelStaff = new InstPlacementRelStaff();
    this.mordentLog = new InstMordentLog();
    this.RegisterInterface(this.timePointInterface.GetAttClasses(), this.timePointInterface.IsInterface());
    this.RegisterAttClass(ATT_ENCLOSINGCHARS);
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.RegisterAttClass(ATT_ORNAMENTACCID);
    this.RegisterAttClass(ATT_PLACEMENTRELSTAFF);
    this.RegisterAttClass(ATT_MORDENTLOG);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.timePointInterface ??= new TimePointInterface();
    this.enclosingChars ??= new InstEnclosingChars();
    this.extSymAuth ??= new InstExtSymAuth();
    this.extSymNames ??= new InstExtSymNames();
    this.ornamentAccid ??= new InstOrnamentAccid();
    this.placementRelStaff ??= new InstPlacementRelStaff();
    this.mordentLog ??= new InstMordentLog();
    this.timePointInterface.Reset();
    this.enclosingChars!.ResetEnclosingChars();
    this.extSymAuth!.ResetExtSymAuth();
    this.extSymNames!.ResetExtSymNames();
    this.ornamentAccid!.ResetOrnamentAccid();
    this.ResetPlacementRelStaff();
    this.mordentLog!.ResetMordentLog();
  }

  public override GetClassName(): string { return 'mordent'; }

  public GetTimePointInterface(): TimePointInterface {
    this.timePointInterface ??= new TimePointInterface();
    return this.timePointInterface;
  }
  public GetStart(): unknown { return this.GetTimePointInterface().GetStart(); }
  public SetStart(start: unknown): void { this.GetTimePointInterface().SetStart(start as never); }
  public GetTstampStaves(measure: unknown, object: unknown): unknown[] { return this.GetTimePointInterface().GetTstampStaves(measure as never, object as never); }
  public GetStartid(): string { return this.GetTimePointInterface().GetStartid(); }
  public HasStartid(): boolean { return this.GetTimePointInterface().HasStartid(); }
  public GetTstamp(): number { return this.GetTimePointInterface().GetTstamp(); }
  public HasTstamp(): boolean { return this.GetTimePointInterface().HasTstamp(); }
  public GetStaff(): number[] { return this.GetTimePointInterface().GetStaff(); }
  public HasStaff(): boolean { return this.GetTimePointInterface().HasStaff(); }
  public SetStaff(v: number[]): void { this.GetTimePointInterface().SetStaff(v); }
  public SetStartid(v: string): void { this.GetTimePointInterface().SetStartid(v); }
  public SetTstamp(v: number): void { this.GetTimePointInterface().SetTstamp(v); }

  /** Get the SMuFL glyph for the mordent based on type, long attribute or glyph.num */
  public GetMordentGlyph(): number {
    const resources = this.GetDocResources() as unknown as MordentResourcesLike | null;
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

    // Handle glyph based on other attributes
    if (this.GetLong() === BOOLEAN_true) {
      return this.GetForm() === mordentLog_FORM_upper
        ? SMUFL_E56E_ornamentTremblement
        : SMUFL_E5BD_ornamentPrecompTrillWithMordent;
    }
    return this.GetForm() === mordentLog_FORM_upper
      ? SMUFL_E56C_ornamentShortTrill
      : SMUFL_E56D_ornamentMordent;
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

  // AttEnclosingChars forwarding
  public SetEnclose(value: number): void { this.enclosingChars!.SetEnclose(value); }
  public GetEnclose(): number { return this.enclosingChars!.GetEnclose(); }
  public HasEnclose(): boolean { return this.enclosingChars!.HasEnclose(); }
  public ResetEnclosingChars(): void { this.enclosingChars!.ResetEnclosingChars(); }

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

  // AttOrnamentAccid forwarding
  public ResetOrnamentAccid(): void { this.ornamentAccid!.ResetOrnamentAccid(); }
  public SetAccidupper(value: number): void { this.ornamentAccid!.SetAccidupper(value); }
  public GetAccidupper(): number { return this.ornamentAccid!.GetAccidupper(); }
  public HasAccidupper(): boolean { return this.ornamentAccid!.HasAccidupper(); }
  public SetAccidlower(value: number): void { this.ornamentAccid!.SetAccidlower(value); }
  public GetAccidlower(): number { return this.ornamentAccid!.GetAccidlower(); }
  public HasAccidlower(): boolean { return this.ornamentAccid!.HasAccidlower(); }

  // AttPlacementRelStaff forwarding
  public SetPlace(v: StaffRel): void { this.placementRelStaff!.SetPlace(v); }
  public GetPlace(): StaffRel { return this.placementRelStaff!.GetPlace(); }
  public HasPlace(): boolean { return this.placementRelStaff!.HasPlace(); }
  public ResetPlacementRelStaff(): void { this.placementRelStaff!.ResetPlacementRelStaff(); }

  // AttMordentLog forwarding
  public ResetMordentLog(): void { this.mordentLog!.ResetMordentLog(); }
  public SetForm(value: number): void { this.mordentLog!.SetForm(value); }
  public GetForm(): number { return this.mordentLog!.GetForm(); }
  public HasForm(): boolean { return this.mordentLog!.HasForm(); }
  public SetLong(value: number): void { this.mordentLog!.SetLong(value); }
  public GetLong(): number { return this.mordentLog!.GetLong(); }
  public HasLong(): boolean { return this.mordentLog!.HasLong(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMordent');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMordent');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMordentEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMordentEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Mordent {
    const clone = new Mordent();
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
    if (this.HasAccidupper()) clone.SetAccidupper(this.GetAccidupper());
    if (this.HasAccidlower()) clone.SetAccidlower(this.GetAccidlower());
    if (this.HasPlace()) clone.SetPlace(this.GetPlace());
    if (this.HasForm()) clone.SetForm(this.GetForm());
    if (this.HasLong()) clone.SetLong(this.GetLong());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('mordent', ClassId.MORDENT, () => new Mordent());
