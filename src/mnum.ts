/**
 * Pure TypeScript translation of Verovio's `src/mnum.cpp` / `include/vrv/mnum.h`.
 *
 * `MNum` represents an MEI `<mNum>` element (measure number).
 *
 * C++ multiple inheritance (ControlElement + TextListInterface + TextDirInterface
 * + TimePointInterface + AttLang + AttTypography) is represented through explicit
 * composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, TextListInterface, VrvObject } from './object.js';
import { ControlElement } from './controlelement.js';
import { TextDirInterface } from './textdirinterface.js';
import { TimePointInterface } from './timeinterface.js';
import { InstLang, InstTypography } from './atts_shared.js';

// Canonical libmei att-class ordinals (libmei/dist/attclasses.h).
const ATT_LANG = 146;
const ATT_TYPOGRAPHY = 225;

/** Pure TypeScript translation of Verovio's `MNum` element. */
export class MNum extends ControlElement {
  private textList: TextListInterface | null = null;
  private textDirInterface: TextDirInterface | null = null;
  private timePointInterface: TimePointInterface | null = null;
  private attLang: InstLang | null = null;
  private attTypography: InstTypography | null = null;

  private m_isGenerated = false;

  public constructor() {
    super(ClassId.MNUM);
    this.textList = new TextListInterface();
    this.textList.SetInterfaceOwner(this);
    this.textDirInterface = new TextDirInterface();
    this.timePointInterface = new TimePointInterface();
    this.attLang = new InstLang();
    this.attTypography = new InstTypography();

    this.RegisterInterface(this.textDirInterface.GetAttClasses(), this.textDirInterface.IsInterface());
    this.RegisterInterface(this.timePointInterface.GetAttClasses(), this.timePointInterface.IsInterface());
    this.RegisterAttClass(ATT_LANG);
    this.RegisterAttClass(ATT_TYPOGRAPHY);

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.textList ??= new TextListInterface();
    this.textList.SetInterfaceOwner(this);
    this.textDirInterface ??= new TextDirInterface();
    this.timePointInterface ??= new TimePointInterface();
    this.attLang ??= new InstLang();
    this.attTypography ??= new InstTypography();

    this.textDirInterface.Reset();
    this.timePointInterface.Reset();
    this.attLang.ResetLang();
    this.attTypography.ResetTypography();

    this.m_isGenerated = false;
  }

  public override GetClassName(): string {
    return 'mNum';
  }

  public override GetTextDirInterface(): TextDirInterface {
    this.textDirInterface ??= new TextDirInterface();
    return this.textDirInterface;
  }

  public override GetTimePointInterface(): TimePointInterface {
    this.timePointInterface ??= new TimePointInterface();
    return this.timePointInterface;
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.REND || classId === ClassId.TEXT) {
      return true;
    } else if (VrvObject.IsEditorialElement(classId)) {
      return true;
    }
    return false;
  }

  public IsGenerated(): boolean;
  public IsGenerated(isGenerated: boolean): void;
  public IsGenerated(isGenerated?: boolean): boolean | void {
    if (isGenerated === undefined) {
      return this.m_isGenerated;
    }
    this.m_isGenerated = isGenerated;
  }

  // TextListInterface facade.
  public GetList(): any[] { return this.textList!.GetList(); }
  public GetListSize(): number { return this.textList!.GetListSize(); }
  public GetText(): string { return this.textList!.GetText(); }
  public GetTextLines(lines: string[]): void { this.textList!.GetTextLines(lines); }

  // TextDirInterface forwarding.
  public SetPlace(place: any): void { this.GetTextDirInterface().SetPlace(place); }
  public GetPlace(): any { return this.GetTextDirInterface().GetPlace(); }
  public HasPlace(): boolean { return this.GetTextDirInterface().HasPlace(); }

  // TimePointInterface forwarding.
  public GetStart(): unknown { return this.GetTimePointInterface().GetStart(); }
  public SetStart(start: any): void { this.GetTimePointInterface().SetStart(start); }
  public SetStartid(startid: string): void { this.GetTimePointInterface().SetStartid(startid); }
  public GetStartid(): string { return this.GetTimePointInterface().GetStartid(); }
  public HasStartid(): boolean { return this.GetTimePointInterface().HasStartid(); }
  public SetTstamp(tstamp: any): void { this.GetTimePointInterface().SetTstamp(tstamp); }
  public GetTstamp(): any { return this.GetTimePointInterface().GetTstamp(); }
  public HasTstamp(): boolean { return this.GetTimePointInterface().HasTstamp(); }
  public SetStaff(staff: any): void { this.GetTimePointInterface().SetStaff(staff); }
  public GetStaff(): any { return this.GetTimePointInterface().GetStaff(); }
  public HasStaff(): boolean { return this.GetTimePointInterface().HasStaff(); }

  // AttLang forwarding.
  public SetLang(value: any): void { this.attLang!.SetLang(value); }
  public GetLang(): any { return this.attLang!.GetLang(); }
  public HasLang(): boolean { return this.attLang!.HasLang(); }
  public SetTranslit(value: any): void { this.attLang!.SetTranslit(value); }
  public GetTranslit(): any { return this.attLang!.GetTranslit(); }
  public HasTranslit(): boolean { return this.attLang!.HasTranslit(); }
  public ResetLang(): void { this.attLang!.ResetLang(); }

  // AttTypography forwarding.
  public SetFontfam(value: any): void { this.attTypography!.SetFontfam(value); }
  public GetFontfam(): any { return this.attTypography!.GetFontfam(); }
  public HasFontfam(): boolean { return this.attTypography!.HasFontfam(); }
  public SetFontname(value: any): void { this.attTypography!.SetFontname(value); }
  public GetFontname(): any { return this.attTypography!.GetFontname(); }
  public HasFontname(): boolean { return this.attTypography!.HasFontname(); }
  public SetFontsize(value: any): void { this.attTypography!.SetFontsize(value); }
  public GetFontsize(): any { return this.attTypography!.GetFontsize(); }
  public GetFontsizeAlternate(): any { return this.attTypography!.GetFontsizeAlternate(); }
  public HasFontsize(): boolean { return this.attTypography!.HasFontsize(); }
  public SetFontstyle(value: any): void { this.attTypography!.SetFontstyle(value); }
  public GetFontstyle(): any { return this.attTypography!.GetFontstyle(); }
  public HasFontstyle(): boolean { return this.attTypography!.HasFontstyle(); }
  public SetFontweight(value: any): void { this.attTypography!.SetFontweight(value); }
  public GetFontweight(): any { return this.attTypography!.GetFontweight(); }
  public HasFontweight(): boolean { return this.attTypography!.HasFontweight(); }
  public SetLetterspacing(value: any): void { this.attTypography!.SetLetterspacing(value); }
  public GetLetterspacing(): any { return this.attTypography!.GetLetterspacing(); }
  public HasLetterspacing(): boolean { return this.attTypography!.HasLetterspacing(); }
  public SetLineheight(value: any): void { this.attTypography!.SetLineheight(value); }
  public GetLineheight(): any { return this.attTypography!.GetLineheight(); }
  public HasLineheight(): boolean { return this.attTypography!.HasLineheight(); }
  public ResetTypography(): void { this.attTypography!.ResetTypography(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMNum');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMNum');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMNumEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMNumEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): MNum {
    const clone = new MNum();
    clone.AssignFrom(this);
    if (this.HasPlace()) clone.SetPlace(this.GetPlace());
    const tpi = this.GetTimePointInterface();
    const ctpi = clone.GetTimePointInterface();
    if (tpi.HasStartid()) ctpi.SetStartid(tpi.GetStartid());
    if (tpi.HasTstamp()) ctpi.SetTstamp(tpi.GetTstamp());
    if (tpi.HasStaff()) ctpi.SetStaff(tpi.GetStaff());
    if (this.HasLang()) clone.SetLang(this.GetLang());
    if (this.HasTranslit()) clone.SetTranslit(this.GetTranslit());
    if (this.HasFontfam()) clone.SetFontfam(this.GetFontfam());
    if (this.HasFontname()) clone.SetFontname(this.GetFontname());
    if (this.HasFontsize()) clone.SetFontsize(this.GetFontsize());
    if (this.HasFontstyle()) clone.SetFontstyle(this.GetFontstyle());
    if (this.HasFontweight()) clone.SetFontweight(this.GetFontweight());
    if (this.HasLetterspacing()) clone.SetLetterspacing(this.GetLetterspacing());
    clone.IsGenerated(this.IsGenerated());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('mNum', ClassId.MNUM, () => new MNum());
