import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, VrvObject } from './object.js';
import { ControlElement } from './controlelement.js';
import { TimePointInterface, TimeSpanningInterface } from './timeinterface.js';
import { InstEnclosingChars, InstExtender, InstLineRend, InstNNumberLike, InstPlacementRelStaff } from './atts_shared.js';
import { InstExtSymAuth, InstExtSymNames } from './atts_externalsymbols.js';
import { InstOrnamentAccid } from './atts_cmnornaments.js';
import { StaffRel } from './textdirinterface.js';
import {
  SMUFL_E26A_accidentalParensLeft,
  SMUFL_E26B_accidentalParensRight,
  SMUFL_E26C_accidentalBracketLeft,
  SMUFL_E26D_accidentalBracketRight,
  SMUFL_E566_ornamentTrill,
} from './smufl.js';
import { ENCLOSURE_paren, ENCLOSURE_brack } from './fermata.js';

// Canonical libmei att-class ordinals used by the C++ RegisterAttClass calls.
const ATT_ENCLOSINGCHARS = 129;
const ATT_EXTENDER = 132;
const ATT_EXTSYMAUTH = 46;
const ATT_EXTSYMNAMES = 47;
const ATT_LINEREND = 150;
const ATT_NNUMBERLIKE = 168;
const ATT_ORNAMENTACCID = 41;
const ATT_PLACEMENTRELSTAFF = 186;

/** Resources contract consumed by Trill::GetTrillGlyph; matches canonical resources.ts. */
export interface TrillResourcesLike {
  GetGlyph(code: number): unknown | null;
  GetGlyphCode(smuflName: string): number;
}

/** Pure TypeScript translation of Verovio's src/trill.cpp / include/vrv/trill.h. */
export class Trill extends ControlElement {
  private timeSpanningInterface: TimeSpanningInterface | null = null;
  private enclosingChars: InstEnclosingChars | null = null;
  private extender: InstExtender | null = null;
  private extSymAuth: InstExtSymAuth | null = null;
  private extSymNames: InstExtSymNames | null = null;
  private lineRend: InstLineRend | null = null;
  private nNumberLike: InstNNumberLike | null = null;
  private ornamentAccid: InstOrnamentAccid | null = null;
  private placementRelStaff: InstPlacementRelStaff | null = null;

  public constructor() {
    super(ClassId.TRILL);
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.enclosingChars = new InstEnclosingChars();
    this.extender = new InstExtender();
    this.extSymAuth = new InstExtSymAuth();
    this.extSymNames = new InstExtSymNames();
    this.lineRend = new InstLineRend();
    this.nNumberLike = new InstNNumberLike();
    this.ornamentAccid = new InstOrnamentAccid();
    this.placementRelStaff = new InstPlacementRelStaff();
    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());
    this.RegisterAttClass(ATT_ENCLOSINGCHARS);
    this.RegisterAttClass(ATT_EXTENDER);
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.RegisterAttClass(ATT_LINEREND);
    this.RegisterAttClass(ATT_NNUMBERLIKE);
    this.RegisterAttClass(ATT_ORNAMENTACCID);
    this.RegisterAttClass(ATT_PLACEMENTRELSTAFF);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.enclosingChars ??= new InstEnclosingChars();
    this.extender ??= new InstExtender();
    this.extSymAuth ??= new InstExtSymAuth();
    this.extSymNames ??= new InstExtSymNames();
    this.lineRend ??= new InstLineRend();
    this.nNumberLike ??= new InstNNumberLike();
    this.ornamentAccid ??= new InstOrnamentAccid();
    this.placementRelStaff ??= new InstPlacementRelStaff();
    this.timeSpanningInterface.Reset();
    this.enclosingChars!.ResetEnclosingChars();
    this.extender!.ResetExtender();
    this.extSymAuth!.ResetExtSymAuth();
    this.extSymNames!.ResetExtSymNames();
    this.lineRend!.ResetLineRend();
    this.nNumberLike!.ResetNNumberLike();
    this.ornamentAccid!.ResetOrnamentAccid();
    this.ResetPlacementRelStaff();
  }

  public override GetClassName(): string { return 'trill'; }

  public GetTimePointInterface(): TimePointInterface {
    return this.GetTimeSpanningInterface();
  }

  public GetTimeSpanningInterface(): TimeSpanningInterface {
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    return this.timeSpanningInterface;
  }
  public SetStaff(v: number[]): void { this.GetTimeSpanningInterface().SetStaff(v); }
  public GetStaff(): number[] { return this.GetTimeSpanningInterface().GetStaff(); }
  public HasStaff(): boolean { return this.GetTimeSpanningInterface().HasStaff(); }
  public SetStartid(v: string): void { this.GetTimeSpanningInterface().SetStartid(v); }
  public GetStartid(): string { return this.GetTimeSpanningInterface().GetStartid(); }
  public SetEndid(v: string): void { this.GetTimeSpanningInterface().SetEndid(v); }
  public GetEndid(): string { return this.GetTimeSpanningInterface().GetEndid(); }
  public SetStart(v: unknown): void { this.GetTimeSpanningInterface().SetStart(v as never); }
  public GetStart(): unknown { return this.GetTimeSpanningInterface().GetStart(); }
  public SetEnd(v: unknown): void { this.GetTimeSpanningInterface().SetEnd(v as never); }
  public GetEnd(): unknown { return this.GetTimeSpanningInterface().GetEnd(); }
  public GetStartMeasure(): unknown { return this.GetTimeSpanningInterface().GetStartMeasure(); }
  public GetEndMeasure(): unknown { return this.GetTimeSpanningInterface().GetEndMeasure(); }
  public GetTstampStaves(measure: unknown, object: unknown): unknown[] { return this.GetTimeSpanningInterface().GetTstampStaves(measure as never, object as never); }
  public SetTstamp(v: number): void { this.GetTimeSpanningInterface().SetTstamp(v); }
  public GetTstamp(): number { return this.GetTimeSpanningInterface().GetTstamp(); }
  public SetTstamp2(v: any): void { this.GetTimeSpanningInterface().SetTstamp2(v); }
  public GetTstamp2(): any { return this.GetTimeSpanningInterface().GetTstamp2(); }

  /** Get the SMuFL glyph for the trill based on glyph.num */
  public GetTrillGlyph(): number {
    const resources = this.GetDocResources() as unknown as TrillResourcesLike | null;
    if (!resources) return 0;

    // If there is glyph.num, return glyph based on it
    if (this.HasGlyphNum()) {
      const code = this.GetGlyphNum();
      if (resources.GetGlyph(code)) return code;
    }
    // If there is glyph.name (second priority)
    else if (this.HasGlyphName()) {
      const code = resources.GetGlyphCode(this.GetGlyphName());
      if (resources.GetGlyph(code)) return code;
    }

    // return default glyph for trill
    return SMUFL_E566_ornamentTrill;
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

  // AttExtender forwarding
  public SetExtender(v: number): void { this.extender!.SetExtender(v); }
  public GetExtender(): number { return this.extender!.GetExtender(); }
  public HasExtender(): boolean { return this.extender!.HasExtender(); }
  public ResetExtender(): void { this.extender!.ResetExtender(); }

  // AttExtSymAuth forwarding
  public SetGlyphAuth(glyphAuth: string): void { this.extSymAuth!.SetGlyphAuth(glyphAuth); }
  public GetGlyphAuth(): string { return this.extSymAuth!.GetGlyphAuth(); }
  public HasGlyphAuth(): boolean { return this.extSymAuth!.HasGlyphAuth(); }
  public SetGlyphUri(glyphUri: string): void { this.extSymAuth!.SetGlyphUri(glyphUri); }
  public GetGlyphUri(): string { return this.extSymAuth!.GetGlyphUri(); }
  public HasGlyphUri(): boolean { return this.extSymAuth!.HasGlyphUri(); }
  public ResetExtSymAuth(): void { this.extSymAuth!.ResetExtSymAuth(); }

  // AttExtSymNames forwarding
  public SetGlyphName(glyphName: string): void { this.extSymNames!.SetGlyphName(glyphName); }
  public GetGlyphName(): string { return this.extSymNames!.GetGlyphName(); }
  public HasGlyphName(): boolean { return this.extSymNames!.HasGlyphName(); }
  public SetGlyphNum(glyphNum: number): void { this.extSymNames!.SetGlyphNum(glyphNum); }
  public GetGlyphNum(): number { return this.extSymNames!.GetGlyphNum(); }
  public HasGlyphNum(): boolean { return this.extSymNames!.HasGlyphNum(); }
  public ResetExtSymNames(): void { this.extSymNames!.ResetExtSymNames(); }

  // AttLineRend forwarding
  public SetLendsym(v: unknown): void { this.lineRend!.SetLendsym(v); }
  public GetLendsym(): unknown { return this.lineRend!.GetLendsym(); }
  public HasLendsym(): boolean { return this.lineRend!.HasLendsym(); }
  public SetLendsymSize(v: number): void { this.lineRend!.SetLendsymSize(v); }
  public GetLendsymSize(): number { return this.lineRend!.GetLendsymSize(); }
  public HasLendsymSize(): boolean { return this.lineRend!.HasLendsymSize(); }
  public SetLstartsym(v: unknown): void { this.lineRend!.SetLstartsym(v); }
  public GetLstartsym(): unknown { return this.lineRend!.GetLstartsym(); }
  public HasLstartsym(): boolean { return this.lineRend!.HasLstartsym(); }
  public SetLstartsymSize(v: number): void { this.lineRend!.SetLstartsymSize(v); }
  public GetLstartsymSize(): number { return this.lineRend!.GetLstartsymSize(); }
  public HasLstartsymSize(): boolean { return this.lineRend!.HasLstartsymSize(); }
  public ResetLineRend(): void { this.lineRend!.ResetLineRend(); }

  // AttNNumberLike forwarding
  public SetN(v: string): void { this.nNumberLike!.SetN(v); }
  public GetN(): string { return this.nNumberLike!.GetN(); }
  public HasN(): boolean { return this.nNumberLike!.HasN(); }
  public ResetNNumberLike(): void { this.nNumberLike!.ResetNNumberLike(); }

  // AttOrnamentAccid forwarding
  public SetAccidupper(v: number): void { this.ornamentAccid!.SetAccidupper(v); }
  public GetAccidupper(): number { return this.ornamentAccid!.GetAccidupper(); }
  public HasAccidupper(): boolean { return this.ornamentAccid!.HasAccidupper(); }
  public SetAccidlower(v: number): void { this.ornamentAccid!.SetAccidlower(v); }
  public GetAccidlower(): number { return this.ornamentAccid!.GetAccidlower(); }
  public HasAccidlower(): boolean { return this.ornamentAccid!.HasAccidlower(); }
  public ResetOrnamentAccid(): void { this.ornamentAccid!.ResetOrnamentAccid(); }

  // AttPlacementRelStaff forwarding
  public SetPlace(v: StaffRel): void { this.placementRelStaff!.SetPlace(v); }
  public GetPlace(): StaffRel { return this.placementRelStaff!.GetPlace(); }
  public HasPlace(): boolean { return this.placementRelStaff!.HasPlace(); }
  public ResetPlacementRelStaff(): void { this.placementRelStaff!.ResetPlacementRelStaff(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTrill');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTrill');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTrillEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTrillEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Trill {
    const clone = new Trill();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all interface/attribute members.
    const ts = this.GetTimeSpanningInterface();
    const cts = clone.GetTimeSpanningInterface();
    if (ts.HasPart()) cts.SetPart(ts.GetPart());
    if (ts.HasStaff()) cts.SetStaff(ts.GetStaff());
    if (ts.HasStartid()) cts.SetStartid(ts.GetStartid());
    if (ts.HasTstamp()) cts.SetTstamp(ts.GetTstamp());
    if (ts.HasEndid()) cts.SetEndid(ts.GetEndid());
    if (ts.HasTstamp2()) cts.SetTstamp2(ts.GetTstamp2());
    if (this.HasEnclose()) clone.SetEnclose(this.GetEnclose());
    if (this.HasExtender()) clone.SetExtender(this.GetExtender());
    if (this.HasGlyphAuth()) clone.SetGlyphAuth(this.GetGlyphAuth());
    if (this.HasGlyphUri()) clone.SetGlyphUri(this.GetGlyphUri());
    if (this.HasGlyphName()) clone.SetGlyphName(this.GetGlyphName());
    if (this.HasGlyphNum()) clone.SetGlyphNum(this.GetGlyphNum());
    if (this.HasLendsym()) clone.SetLendsym(this.GetLendsym());
    if (this.HasLendsymSize()) clone.SetLendsymSize(this.GetLendsymSize());
    if (this.HasLstartsym()) clone.SetLstartsym(this.GetLstartsym());
    if (this.HasLstartsymSize()) clone.SetLstartsymSize(this.GetLstartsymSize());
    if (this.HasN()) clone.SetN(this.GetN());
    if (this.HasAccidupper()) clone.SetAccidupper(this.GetAccidupper());
    if (this.HasAccidlower()) clone.SetAccidlower(this.GetAccidlower());
    if (this.HasPlace()) clone.SetPlace(this.GetPlace());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('trill', ClassId.TRILL, () => new Trill());
