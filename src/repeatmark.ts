/**
 * Pure TypeScript translation of Verovio's `src/repeatmark.cpp` / `include/vrv/repeatmark.h`.
 *
 * `RepeatMark` is the MEI `<repeatMark>` control element. C++ multiple inheritance
 * (ControlElement + TextListInterface + TextDirInterface + TimePointInterface +
 * AttExtSymAuth + AttExtSymNames + AttRepeatMarkLog) is represented through
 * explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, VrvObject, TextListInterface } from './object.js';
import { ControlElement } from './controlelement.js';
import { TextDirInterface } from './textdirinterface.js';
import { TimePointInterface, LayerElementLike } from './timeinterface.js';
import { InstExtSymAuth, InstExtSymNames } from './atts_externalsymbols.js';
import { InstRepeatMarkLog } from './atts_shared.js';
import {
  SMUFL_E045_dalSegno,
  SMUFL_E046_daCapo,
  SMUFL_E047_segno,
  SMUFL_E048_coda,
} from './smufl.js';

// Canonical libmei att-class ordinals (libmei/dist/attclasses.h).
const ATT_EXTSYMAUTH = 46;
const ATT_EXTSYMNAMES = 47;
const ATT_REPEATMARKLOG = 191;

// Canonical libmei enum ordinals (libmei/dist/atttypes.h).
export const repeatMarkLog_FUNC_NONE = 0;
export const repeatMarkLog_FUNC_coda = 1;
export const repeatMarkLog_FUNC_segno = 2;
export const repeatMarkLog_FUNC_dalSegno = 3;
export const repeatMarkLog_FUNC_daCapo = 4;
export const repeatMarkLog_FUNC_fine = 5;
export const repeatMarkLog_FUNC_daCapoAlFine = 6;
export const repeatMarkLog_FUNC_dalSegnoAlFine = 7;
export const repeatMarkLog_FUNC_daCapoAlCoda = 8;
export const repeatMarkLog_FUNC_dalSegnoAlCoda = 9;
export const repeatMarkLog_FUNC_repeatLeft = 10;
export const repeatMarkLog_FUNC_repeatRight = 11;
export const repeatMarkLog_FUNC_repeatRightLeft = 12;

/** Resources contract consumed by RepeatMark::GetMarkGlyph; matches canonical resources.ts. */
export interface RepeatMarkResourcesLike {
  GetGlyph(code: number): unknown | null;
  GetGlyphCode(smuflName: string): number;
}

/** Pure TypeScript translation of Verovio's `RepeatMark` element. */
export class RepeatMark extends ControlElement {
  private textListInterface: TextListInterface | null = null;
  private textDirInterface: TextDirInterface | null = null;
  private timePointInterface: TimePointInterface | null = null;
  private attExtSymAuth: InstExtSymAuth | null = null;
  private attExtSymNames: InstExtSymNames | null = null;
  private attRepeatMarkLog: InstRepeatMarkLog | null = null;

  public constructor() {
    super(ClassId.REPEATMARK);
    this.textListInterface = new TextListInterface();
    this.textDirInterface = new TextDirInterface();
    this.timePointInterface = new TimePointInterface();
    this.attExtSymAuth = new InstExtSymAuth();
    this.attExtSymNames = new InstExtSymNames();
    this.attRepeatMarkLog = new InstRepeatMarkLog();

    this.RegisterInterface(this.textDirInterface.GetAttClasses(), this.textDirInterface.IsInterface());
    this.RegisterInterface(this.timePointInterface.GetAttClasses(), this.timePointInterface.IsInterface());
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.RegisterAttClass(ATT_REPEATMARKLOG);

    this.textListInterface.SetInterfaceOwner(this as unknown as VrvObject);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.textDirInterface ??= new TextDirInterface();
    this.timePointInterface ??= new TimePointInterface();
    this.attExtSymAuth ??= new InstExtSymAuth();
    this.attExtSymNames ??= new InstExtSymNames();
    this.attRepeatMarkLog ??= new InstRepeatMarkLog();

    this.textDirInterface.Reset();
    this.timePointInterface.Reset();
    this.attExtSymAuth.ResetExtSymAuth();
    this.attExtSymNames.ResetExtSymNames();
    this.attRepeatMarkLog.ResetRepeatMarkLog();
  }

  public override GetClassName(): string {
    return 'repeatMark';
  }

  public GetTextDirInterface(): TextDirInterface {
    this.textDirInterface ??= new TextDirInterface();
    return this.textDirInterface;
  }

  public GetTimePointInterface(): TimePointInterface {
    this.timePointInterface ??= new TimePointInterface();
    return this.timePointInterface;
  }

  /**
   * Add an element (text, rend. etc.) to a repeatMark.
   * Only supported elements will be actually added to the child list.
   */
  public override IsSupportedChild(classId: ClassId): boolean {
    switch (classId) {
      case ClassId.LB:
      case ClassId.REND:
      case ClassId.SYMBOL:
      case ClassId.TEXT:
        return true;
      default:
        return VrvObject.IsEditorialElement(classId);
    }
  }

  /**
   * Get the SMuFL glyph for the repeatMark based on func or glyph.num
   */
  public GetMarkGlyph(): number {
    const resources = this.GetDocResources() as unknown as RepeatMarkResourcesLike | null;
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

    switch (this.GetFunc()) {
      case repeatMarkLog_FUNC_coda:
        return SMUFL_E048_coda;
      case repeatMarkLog_FUNC_segno:
        return SMUFL_E047_segno;
      case repeatMarkLog_FUNC_daCapo:
        return SMUFL_E046_daCapo;
      case repeatMarkLog_FUNC_dalSegno:
        return SMUFL_E045_dalSegno;
      default:
        return SMUFL_E047_segno;
    }
  }

  // TextListInterface facade.
  public GetList(): any[] { return this.textListInterface!.GetList(); }
  public GetListSize(): number { return this.textListInterface!.GetListSize(); }
  public GetText(): string { return this.textListInterface!.GetText(); }
  public GetTextLines(lines: string[]): void { this.textListInterface!.GetTextLines(lines); }

  // AttExtSymAuth forwarding.
  public ResetExtSymAuth(): void { this.attExtSymAuth!.ResetExtSymAuth(); }
  public SetGlyphAuth(glyphAuth: string): void { this.attExtSymAuth!.SetGlyphAuth(glyphAuth); }
  public GetGlyphAuth(): string { return this.attExtSymAuth!.GetGlyphAuth(); }
  public HasGlyphAuth(): boolean { return this.attExtSymAuth!.HasGlyphAuth(); }
  public SetGlyphUri(glyphUri: string): void { this.attExtSymAuth!.SetGlyphUri(glyphUri); }
  public GetGlyphUri(): string { return this.attExtSymAuth!.GetGlyphUri(); }
  public HasGlyphUri(): boolean { return this.attExtSymAuth!.HasGlyphUri(); }

  // AttExtSymNames forwarding.
  public ResetExtSymNames(): void { this.attExtSymNames!.ResetExtSymNames(); }
  public SetGlyphName(glyphName: string): void { this.attExtSymNames!.SetGlyphName(glyphName); }
  public GetGlyphName(): string { return this.attExtSymNames!.GetGlyphName(); }
  public HasGlyphName(): boolean { return this.attExtSymNames!.HasGlyphName(); }
  public SetGlyphNum(glyphNum: number): void { this.attExtSymNames!.SetGlyphNum(glyphNum); }
  public GetGlyphNum(): number { return this.attExtSymNames!.GetGlyphNum(); }
  public HasGlyphNum(): boolean { return this.attExtSymNames!.HasGlyphNum(); }

  // AttRepeatMarkLog forwarding.
  public ResetRepeatMarkLog(): void { this.attRepeatMarkLog!.ResetRepeatMarkLog(); }
  public SetFunc(func: number): void { this.attRepeatMarkLog!.SetFunc(func); }
  public GetFunc(): number { return this.attRepeatMarkLog!.GetFunc(); }
  public HasFunc(): boolean { return this.attRepeatMarkLog!.HasFunc(); }

  // TextDirInterface forwarding.
  public SetPlace(place: any): void { this.GetTextDirInterface().SetPlace(place); }
  public GetPlace(): any { return this.GetTextDirInterface().GetPlace(); }
  public HasPlace(): boolean { return this.GetTextDirInterface().HasPlace(); }
  public ResetPlace(): void { this.GetTextDirInterface().Reset(); }

  // TimePointInterface forwarding.
  public SetStartid(startid: string): void { this.GetTimePointInterface().SetStartid(startid); }
  public GetStartid(): string { return this.GetTimePointInterface().GetStartid(); }
  public HasStartid(): boolean { return this.GetTimePointInterface().HasStartid(); }
  public SetTstamp(tstamp: any): void { this.GetTimePointInterface().SetTstamp(tstamp); }
  public GetTstamp(): any { return this.GetTimePointInterface().GetTstamp(); }
  public HasTstamp(): boolean { return this.GetTimePointInterface().HasTstamp(); }
  public SetStaff(staff: any): void { this.GetTimePointInterface().SetStaff(staff); }
  public GetStaff(): any { return this.GetTimePointInterface().GetStaff(); }
  public HasStaff(): boolean { return this.GetTimePointInterface().HasStaff(); }
  // C++ RepeatMark : TimePointInterface — DrawRepeatMark calls GetTstampStaves (21f).
  public GetTstampStaves(measure: unknown, object: unknown): unknown[] { return this.GetTimePointInterface().GetTstampStaves(measure as never, object as never); }
  // C++ TimePointInterface::GetStart — resolved start element for DrawRepeatMark.
  public GetStart(): LayerElementLike | null { return this.GetTimePointInterface().GetStart(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitRepeatMark');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitRepeatMark');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitRepeatMarkEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitRepeatMarkEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): RepeatMark {
    const clone = new RepeatMark();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all interface/attribute members.
    const td = this.GetTextDirInterface();
    const ctd = clone.GetTextDirInterface();
    if (td.HasPlace()) ctd.SetPlace(td.GetPlace());
    const tp = this.GetTimePointInterface();
    const ctp = clone.GetTimePointInterface();
    if (tp.HasPart()) ctp.SetPart(tp.GetPart());
    if (tp.HasStaff()) ctp.SetStaff(tp.GetStaff());
    if (tp.HasStartid()) ctp.SetStartid(tp.GetStartid());
    if (tp.HasTstamp()) ctp.SetTstamp(tp.GetTstamp());
    if (this.HasGlyphAuth()) clone.SetGlyphAuth(this.GetGlyphAuth());
    if (this.HasGlyphUri()) clone.SetGlyphUri(this.GetGlyphUri());
    if (this.HasGlyphName()) clone.SetGlyphName(this.GetGlyphName());
    if (this.HasGlyphNum()) clone.SetGlyphNum(this.GetGlyphNum());
    if (this.HasFunc()) clone.SetFunc(this.GetFunc());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('repeatMark', ClassId.REPEATMARK, () => new RepeatMark());
