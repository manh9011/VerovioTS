/**
 * Pure TypeScript translation of Verovio's `src/syl.cpp` / `include/vrv/syl.h`.
 *
 * `Syl` models the MEI `<syl>` element. TimeSpanningInterface attributes are not
 * read from MEI but populated by PrepareLyricsFunctor, per the C++ contract.
 *
 * C++ multiple inheritance (LayerElement + TextListInterface + OffsetInterface +
 * TimeSpanningInterface + AttLang + AttTypography + AttSylLog) is represented
 * through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode, STAFFREL_below, data_DURATION, data_MEASUREBEAT } from './vrvdef.js';
import { ELISION_unicode } from './view-text-support.js';
import { LayerElement } from './layerelement.js';
import { OffsetInterface } from './offsetinterface.js';
import { TimeSpanningInterface } from './timeinterface.js';
import { InstColor, InstLang, InstNNumberLike, InstTypography, InstSylLog } from './atts_shared.js';
import { ObjectFactory, VrvObject } from './object.js';
import { LogWarning } from './vrv.js';

const ATT_COLOR = 109;
const ATT_LANG = 146;
const ATT_TYPOGRAPHY = 225;
const ATT_SYLLOG = 210;

/** Syllable connector types (sylLog_CON). */
const sylLog_CON_NONE = 0, sylLog_CON_b = 8, sylLog_CON_c = 5, sylLog_CON_d = 2, sylLog_CON_i = 7, sylLog_CON_s = 1, sylLog_CON_t = 4, sylLog_CON_u = 3, sylLog_CON_v = 6;

/** Word position markers (sylLog_WORDPOS). */
const sylLog_WORDPOS_NONE = 0, sylLog_WORDPOS_i = 1, sylLog_WORDPOS_m = 2, sylLog_WORDPOS_s = 3, sylLog_WORDPOS_t = 4;

/** Pure-TypeScript translation of Verovio's `Syl` element. */
export class Syl extends LayerElement {
  private offsetInterface!: OffsetInterface;
  private timeSpanningInterface!: TimeSpanningInterface;
  private lang!: InstLang;
  private typography!: InstTypography;
  private sylLog!: InstSylLog;

  /** Verse number with multiple verses; value is 1 by default, set in PrepareLyrics. */
  public m_drawingVerseN = 1;
  /** The normalized volta row within the verse (one by default). */
  public m_drawingVoltaN = 1;
  /** The verse place (below by default). */
  public m_drawingVersePlace: number = STAFFREL_below;
  /** A pointer to the next syllable of the word (not set when end of lyric is another syl but a note for extenders). */
  public m_nextWordSyl: Syl | null = null;

  private m_drawingTextInkTop = 0;
  private m_drawingTextInkBottom = 0;
  private m_hasDrawingTextInkBounds = false;

  public constructor() {
    super(ClassId.SYL);
    this.offsetInterface = new OffsetInterface();
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.lang = new InstLang();
    this.typography = new InstTypography();
    this.sylLog = new InstSylLog();

    this.RegisterInterface(this.offsetInterface.GetAttClasses(), this.offsetInterface.IsInterface());
    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());
    this.RegisterAttClass(ATT_LANG);
    this.RegisterAttClass(ATT_TYPOGRAPHY);
    this.RegisterAttClass(ATT_SYLLOG);

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.offsetInterface ??= new OffsetInterface();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.lang ??= new InstLang();
    this.typography ??= new InstTypography();
    this.sylLog ??= new InstSylLog();

    this.offsetInterface.Reset();
    this.timeSpanningInterface.Reset();
    this.lang.ResetLang();
    this.typography.ResetTypography();
    this.sylLog.ResetSylLog();

    this.m_drawingVerseN = 1;
    this.m_drawingVoltaN = 1;
    this.m_drawingVersePlace = STAFFREL_below;
    this.m_nextWordSyl = null;
    this.m_drawingTextInkTop = 0;
    this.m_drawingTextInkBottom = 0;
    this.m_hasDrawingTextInkBounds = false;
  }

  public override GetClassName(): string {
    return 'syl';
  }

  public override IsRelativeToStaff(): boolean {
    return true;
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.REND || classId === ClassId.TEXT) {
      return true;
    }
    if (VrvObject.IsEditorialElement(classId)) {
      return true;
    }
    return false;
  }

  public override GetOffsetInterface(): OffsetInterface {
    return this.offsetInterface;
  }

  public override GetTimePointInterface(): any {
    return this.timeSpanningInterface;
  }

  public override GetTimeSpanningInterface(): TimeSpanningInterface {
    return this.timeSpanningInterface;
  }

  // TextListInterface facade.
  public GetList(): VrvObject[] { return this.GetChildren(); }
  public GetListSize(): number { return this.GetChildCount(ClassId.TEXT) + this.GetChildCount(ClassId.REND); }
  public GetText(): string[] {
    // WASM ground truth: syl with <rend>Joy</rend> is non-empty (extender drawn).
    // C++ TextListInterface::GetText reads text through TEXT and REND children;
    // TS must include REND descendants, not only the first TEXT child.
    const out: any[] = [];
    for (const child of this.GetChildren() as any[]) {
      if (child.GetClassId() === ClassId.TEXT) {
        if (typeof child.GetText === 'function') out.push(...child.GetText());
      }
      else if (child.GetClassId() === ClassId.REND) {
        for (const grandchild of (child.GetChildren() as any[])) {
          if (grandchild.GetClassId() === ClassId.TEXT && typeof grandchild.GetText === 'function') {
            out.push(...grandchild.GetText());
          }
        }
      }
    }
    return out;
  }
  public GetTextLines(): string {
    const lines: string[] = [];
    const children = this.GetChildren();
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child && typeof (child as any).GetText === 'function') {
        const t = (child as any).GetText();
        lines.push(typeof t === 'string' ? t : String.fromCodePoint(...t));
      }
    }
    return lines.join('\n');
  }

  // AttLang forwarding.
  public SetLang(value: any): void { this.lang.SetLang(value); }
  public GetLang(): any { return this.lang.GetLang(); }
  public HasLang(): boolean { return this.lang.HasLang(); }
  public SetTranslit(value: any): void { this.lang.SetTranslit(value); }
  public GetTranslit(): any { return this.lang.GetTranslit(); }
  public HasTranslit(): boolean { return this.lang.HasTranslit(); }
  public ResetLang(): void { this.lang.ResetLang(); }

  // AttTypography forwarding.
  public SetFontfam(value: any): void { this.typography.SetFontfam(value); }
  public GetFontfam(): any { return this.typography.GetFontfam(); }
  public HasFontfam(): boolean { return this.typography.HasFontfam(); }
  public SetFontname(value: any): void { this.typography.SetFontname(value); }
  public GetFontname(): any { return this.typography.GetFontname(); }
  public HasFontname(): boolean { return this.typography.HasFontname(); }
  public SetFontsize(value: any): void { this.typography.SetFontsize(value); }
  public GetFontsize(): any { return this.typography.GetFontsize(); }
  public HasFontsize(): boolean { return this.typography.HasFontsize(); }
  public SetFontstyle(value: any): void { this.typography.SetFontstyle(value); }
  public GetFontstyle(): any { return this.typography.GetFontstyle(); }
  public HasFontstyle(): boolean { return this.typography.HasFontstyle(); }
  public SetFontweight(value: any): void { this.typography.SetFontweight(value); }
  public GetFontweight(): any { return this.typography.GetFontweight(); }
  public HasFontweight(): boolean { return this.typography.HasFontweight(); }
  public FontstyleToStr(value: number): string { return this.typography.FontstyleToStr(value); }
  public FontweightToStr(value: number): string { return this.typography.FontweightToStr(value); }
  public SetLetterspacing(value: any): void { this.typography.SetLetterspacing(value); }
  public GetLetterspacing(): any { return this.typography.GetLetterspacing(); }
  public HasLetterspacing(): boolean { return this.typography.HasLetterspacing(); }
  public SetLineheight(value: any): void { this.typography.SetLineheight(value); }
  public GetLineheight(): any { return this.typography.GetLineheight(); }
  public HasLineheight(): boolean { return this.typography.HasLineheight(); }
  public ResetTypography(): void { this.typography.ResetTypography(); }

  // AttSylLog forwarding.
  public SetCon(value: any): void { this.sylLog.SetCon(value); }
  public GetCon(): any { return this.sylLog.GetCon(); }
  public HasCon(): boolean { return this.sylLog.HasCon(); }
  public SetWordpos(value: any): void { this.sylLog.SetWordpos(value); }
  public GetWordpos(): any { return this.sylLog.GetWordpos(); }
  public HasWordpos(): boolean { return this.sylLog.HasWordpos(); }
  public ResetSylLog(): void { this.sylLog.ResetSylLog(); }

  // OffsetInterface forwarding.
  public SetHo(ho: number): void { this.offsetInterface.SetHo(ho); }
  public GetHo(): number { return this.offsetInterface.GetHo(); }
  public HasHo(): boolean { return this.offsetInterface.HasHo(); }
  public SetVo(vo: number): void { this.offsetInterface.SetVo(vo); }
  public GetVo(): number { return this.offsetInterface.GetVo(); }
  public HasVo(): boolean { return this.offsetInterface.HasVo(); }

  // TimeSpanningInterface forwarding (minimal surface used by syl.cpp).
  public SetStart(start: unknown): void { this.timeSpanningInterface.SetStart(start as never); }
  public GetStart(): unknown { return this.timeSpanningInterface.GetStart(); }
  public SetEnd(end: unknown): void { this.timeSpanningInterface.SetEnd(end as never); }
  public GetEnd(): unknown { return this.timeSpanningInterface.GetEnd(); }
  public SetStartid(value: string): void { this.timeSpanningInterface.SetStartid(value); }
  public GetStartid(): string { return this.timeSpanningInterface.GetStartid(); }
  public HasStartid(): boolean { return this.timeSpanningInterface.HasStartid(); }
  public SetEndid(value: string): void { this.timeSpanningInterface.SetEndid(value); }
  public GetEndid(): string { return this.timeSpanningInterface.GetEndid(); }
  public HasEndid(): boolean { return this.timeSpanningInterface.HasEndid(); }
  public SetStaff(value: number[]): void { this.timeSpanningInterface.SetStaff(value); }
  public GetStaff(): number[] { return this.timeSpanningInterface.GetStaff(); }
  public HasStaff(): boolean { return this.timeSpanningInterface.HasStaff(); }
  public SetTstamp(value: number): void { this.timeSpanningInterface.SetTstamp(value); }
  public GetTstamp(): number { return this.timeSpanningInterface.GetTstamp(); }
  public HasTstamp(): boolean { return this.timeSpanningInterface.HasTstamp(); }
  public SetTstamp2(value: data_MEASUREBEAT): void { this.timeSpanningInterface.SetTstamp2(value); }
  public GetTstamp2(): data_MEASUREBEAT { return this.timeSpanningInterface.GetTstamp2(); }
  public HasTstamp2(): boolean { return this.timeSpanningInterface.HasTstamp2(); }

  // TextInkBounds.
  public SetDrawingTextInkBounds(top: number, bottom: number): void {
    this.m_drawingTextInkTop = top;
    this.m_drawingTextInkBottom = bottom;
    this.m_hasDrawingTextInkBounds = true;
  }
  public ResetDrawingTextInkBounds(): void { this.m_hasDrawingTextInkBounds = false; }
  public HasDrawingTextInkBounds(): boolean { return this.m_hasDrawingTextInkBounds; }
  public GetDrawingTextInkTop(): number { return this.m_drawingTextInkTop; }
  public GetDrawingTextInkBottom(): number { return this.m_drawingTextInkBottom; }

  /** Return true when the syl has no textual content. */
  public IsEmpty(): boolean {
    return this.GetText().length === 0;
  }

  /** Calculate spacing needed depending on @worpos and @con (uses injected doc). */
  public CalcConnectorSpacing(doc: any, staffSize: number): number {
    const pos = this.GetWordpos();
    const con = this.GetCon();
    let spacing = 0;
    if (pos === sylLog_WORDPOS_i || pos === sylLog_WORDPOS_m) {
      spacing = 2 * this.CalcHyphenLength(doc, staffSize);
    } else if (con === sylLog_CON_b) {
      // Elision.
      if (doc?.GetOptions?.()?.m_lyricElision?.GetValue?.() === ELISION_unicode) {
        // Equivalent spacing with 0x230F
        spacing = Math.trunc(doc.GetDrawingUnit(staffSize) * 2.2);
      } else {
        // Calculate the elision space with the current music font
        spacing = doc?.GetGlyphAdvX?.(doc.GetOptions().m_lyricElision.GetValue(), staffSize, false) ?? 0;
        spacing = this.AdjustToLyricSize(doc, spacing);
      }
    } else {
      spacing = doc.GetDrawingUnit(staffSize) * doc.GetOptions().m_lyricWordSpace.GetValue();
      spacing = this.AdjustToLyricSize(doc, spacing);
    }
    return spacing;
  }

  /** Scale a spacing value by lyricSize/default (C++ Syl::AdjustToLyricSize). */
  private AdjustToLyricSize(doc: any, value: number): number {
    const lyricSize = doc.GetOptions().m_lyricSize;
    return Math.trunc(value * lyricSize.GetValue() / lyricSize.GetDefault());
  }

  /** Calculate the hyphen length using the text font (uses injected doc). */
  public CalcHyphenLength(doc: any, staffSize: number): number {
    const lyricFont = doc.GetDrawingLyricFont(staffSize);
    let dashLength = doc.GetTextGlyphWidth('-'.codePointAt(0)!, lyricFont, false);
    dashLength = Math.trunc((dashLength * doc.GetOptions().m_lyricSize.GetValue()) / doc.GetOptions().m_lyricSize.GetDefault());
    return dashLength;
  }

  // Note: full drawing/facsimile/zone APIs in syl.cpp require Doc/Staff/Zone which are
  // not yet migrated at this leaf; they are deferred to those units' canonical passes.

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSyl');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSyl');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSylEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSylEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitLayerElement === 'function') return functor.VisitLayerElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): Syl {
    const clone = new Syl();
    clone.AssignFrom(this);
    if (this.HasLang()) clone.SetLang(this.GetLang());
    if (this.HasTranslit()) clone.SetTranslit(this.GetTranslit());
    if (this.HasCon()) clone.SetCon(this.GetCon());
    if (this.HasWordpos()) clone.SetWordpos(this.GetWordpos());
    if (this.HasHo()) clone.SetHo(this.GetHo());
    if (this.HasVo()) clone.SetVo(this.GetVo());
    if (this.typography.HasFontfam()) clone.SetFontfam(this.GetFontfam());
    if (this.typography.HasFontname()) clone.SetFontname(this.GetFontname());
    if (this.typography.HasFontsize()) clone.SetFontsize(this.GetFontsize());
    if (this.typography.HasFontstyle()) clone.SetFontstyle(this.GetFontstyle());
    if (this.typography.HasFontweight()) clone.SetFontweight(this.GetFontweight());
    if (this.typography.HasLetterspacing()) clone.SetLetterspacing(this.GetLetterspacing());
    if (this.typography.HasLineheight()) clone.SetLineheight(this.GetLineheight());
    if (this.timeSpanningInterface.HasStartid()) clone.SetStartid(this.GetStartid());
    if (this.timeSpanningInterface.HasEndid()) clone.SetEndid(this.GetEndid());
    if (this.timeSpanningInterface.HasTstamp()) clone.SetTstamp(this.GetTstamp());
    if (this.timeSpanningInterface.HasTstamp2()) clone.SetTstamp2(this.GetTstamp2());
    if (this.timeSpanningInterface.HasStaff()) clone.SetStaff(this.GetStaff());
    clone.m_drawingVerseN = this.m_drawingVerseN;
    clone.m_drawingVoltaN = this.m_drawingVoltaN;
    clone.m_drawingVersePlace = this.m_drawingVersePlace;
    clone.m_nextWordSyl = this.m_nextWordSyl;
    clone.m_drawingTextInkTop = this.m_drawingTextInkTop;
    clone.m_drawingTextInkBottom = this.m_drawingTextInkBottom;
    clone.m_hasDrawingTextInkBounds = this.m_hasDrawingTextInkBounds;
    return clone;
  }
}

ObjectFactory.GetInstance().Register('syl', ClassId.SYL, () => new Syl());
