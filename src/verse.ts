/**
 * Pure TypeScript translation of Verovio's `src/verse.cpp` / `include/vrv/verse.h`.
 *
 * `Verse` models note-attached lyric verses `<verse>`.
 *
 * C++ multiple inheritance (LyricElement + AttNInteger) is represented
 * through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LyricElement } from './lyricelement.js';
import { InstNInteger } from './atts_shared.js';
import { LabelAbbr } from './labelabbr.js';
import { ObjectFactory } from './object.js';

const ATT_NINTEGER = 167;

/** Pure-TypeScript translation of Verovio's `Verse` element. */
export class Verse extends LyricElement {
  private attNInteger!: InstNInteger;
  private m_drawingLabelAbbr: LabelAbbr | null = null;

  public constructor() {
    super(ClassId.VERSE);
    this.attNInteger = new InstNInteger();
    this.RegisterAttClass(ATT_NINTEGER);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.attNInteger ??= new InstNInteger();
    this.attNInteger.ResetNInteger();
    this.m_drawingLabelAbbr = null;
  }

  public override GetClassName(): string {
    return 'verse';
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.LABEL || classId === ClassId.LABELABBR) {
      return true;
    }
    return super.IsSupportedChild(classId);
  }

  public GetDrawingLabelAbbr(): LabelAbbr | null {
    return this.m_drawingLabelAbbr;
  }

  public SetDrawingLabelAbbr(labelAbbr: LabelAbbr | null): void {
    this.m_drawingLabelAbbr = labelAbbr;
  }

  // AttNInteger forwarding.
  public SetN(value: any): void { this.attNInteger.SetN(value); }
  public GetN(): any { return this.attNInteger.GetN(); }
  public HasN(): boolean { return this.attNInteger.HasN(); }
  public ResetNInteger(): void { this.attNInteger.ResetNInteger(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitVerse');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitVerse');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitVerseEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitVerseEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitLyricElement === 'function') return functor.VisitLyricElement(this);
    if (typeof functor.VisitLayerElement === 'function') return functor.VisitLayerElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): Verse {
    const clone = new Verse();
    clone.AssignFrom(this);
    if (this.HasN()) clone.SetN(this.GetN());
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasLang()) clone.SetLang(this.GetLang());
    if (this.HasPlace()) clone.SetPlace(this.GetPlace());
    if (this.HasVoltasym()) clone.SetVoltasym(this.GetVoltasym());
    clone.SetDrawingVerseN(this.GetDrawingVerseN());
    clone.SetDrawingLyricGroupN(this.GetDrawingLyricGroupN());
    clone.SetDrawingLabelAbbr(this.GetDrawingLabelAbbr());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('verse', ClassId.VERSE, () => new Verse());
