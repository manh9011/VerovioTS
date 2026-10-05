/**
 * Pure TypeScript translation of Verovio's `src/runningelement.cpp` / `include/vrv/runningelement.h`.
 *
 * C++ multiple inheritance (TextLayoutElement + AttFormework) is represented
 * through a composed InstFormework component with a forwarding surface.
 */
import { TextLayoutElement } from './textlayoutelement.js';
import { InstFormework } from './atts_shared.js';
import { Rend } from './rend.js';
import { Num } from './num.js';
import { Text } from './text.js';
import { Fig } from './fig.js';
import { Svg } from './svg.js';
import { xml_document } from './pugixml.js';
import { bundledReadText } from './data-bundle.js';
import { VrvObject, ObjectFactory } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { UTF8to32, StringFormat } from './vrv.js';
import { HorizontalAlignment, VerticalAlignment } from './areaposinterface.js';
import { data_FONTSIZE } from './libmei-att.js';

const FONTSIZETERM_small = 3;

const ATT_FORMEWORK = 136;

function visit(functor: unknown, method: string, self: unknown): FunctorCode {
  const fn = (functor as Record<string, unknown>)[method];
  if (typeof fn !== 'function') {
    // C++ FunctorInterface forwards unknown Visit* defaults to VisitObject;
    // structural test functors expose only VisitObject.
    const fallback = (functor as Record<string, unknown>)['VisitObject'];
    if (typeof fallback === 'function') return (fallback as (value: unknown) => FunctorCode).call(functor, self);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
  return (fn as (value: unknown) => FunctorCode).call(functor, self);
}

/** Structural `Page` contract consumed by `SetDrawingPage` / `SetCurrentPageNum`. */
export interface RunningElementPageLike {
  GetIdx(): number;
}

/** Structural `Doc` contract consumed by `GetTotalWidth` / `LoadFooter`. */
export interface RunningElementDocLike {
  m_drawingPageContentWidth: number;
  GetResources(): { GetPath(): string } | null;
}

/** Loader seam for `LoadFooter` (C++ `pugi::xml_document::load_file` boundary). */
export type FooterFileLoader = (path: string) => { first_child(): unknown } | null;

/** Loader used by `LoadFooter`; overridable for tests/browser contexts. */
declare const require: ((name: string) => { readFileSync(path: string, encoding: string): string }) | undefined;

export let LoadFooterFile: FooterFileLoader | null = null;
export function SetFooterFileLoader(loader: FooterFileLoader | null): void {
  LoadFooterFile = loader;
}

// C++ does not define GetTotalHeight on RunningElement (subclasses PgHead/PgFoot
// override it); the class is therefore not instantiable directly — mirrored here
// with an abstract TypeScript class.
export abstract class RunningElement extends TextLayoutElement {
  private formework?: InstFormework;
  /** The page we are drawing (for the x position). */
  private m_drawingPage?: RunningElementPageLike | null;
  /** The y position of the running element. */
  private m_drawingYRel?: number;
  /** Flag indicating whether or not the element was generated. */
  private m_isGenerated?: boolean;

  public constructor(classId: ClassId) {
    super(classId);
    this.formework = new InstFormework();
    this.RegisterAttClass(ATT_FORMEWORK);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.formework?.ResetFormework();
    if (this.m_isGenerated === undefined) {
      // Guard: the VrvObject constructor dispatches the overridden Reset()
      // before subclass fields exist; the C++ ctor chain runs the base Reset()
      // only, so this branch runs exactly once per instance.
      this.m_isGenerated = false;
      this.m_drawingPage = null;
      this.m_drawingYRel = 0;
    }
    // ResetDrawingScaling touches base fields that are not yet initialized
    // during the constructor-phase Reset dispatch; skip until they exist.
    const scaling = (this as unknown as { m_drawingScalingPercent?: number[] }).m_drawingScalingPercent;
    if (scaling) this.ResetDrawingScaling();
  }

  /**
   * Disable cloning of the running elements (for now?).
   * It does not make sense to keep copying the running element across the systems.
   */
  public override Clone(): VrvObject {
    // C++ returns NULL; the base signature stays `VrvObject`.
    return null as unknown as VrvObject;
  }

  public IsGenerated(): boolean { return this.m_isGenerated ?? false; }
  public IsGeneratedSet(isGenerated: boolean): void { this.m_isGenerated = isGenerated; }

  public override GetDrawingX(): number {
    if (!this.m_drawingPage) return 0;
    return 0;
  }

  public override GetDrawingY(): number {
    // C++ sets m_cachedDrawingY = 0 before returning the relative position.
    this.ResetCachedDrawingY();
    return this.m_drawingYRel ?? 0;
  }

  public override GetTotalWidth(doc: unknown): number {
    return (doc as RunningElementDocLike).m_drawingPageContentWidth;
  }

  public GetDrawingYRel(): number { return this.m_drawingYRel ?? 0; }
  public SetDrawingYRel(drawingYRel: number): void {
    this.ResetCachedDrawingY();
    this.m_drawingYRel = drawingYRel;
  }

  public GetDrawingPage(): RunningElementPageLike | null { return this.m_drawingPage ?? null; }

  public SetDrawingPage(page: RunningElementPageLike | null): void {
    // C++ resets the ObjectListInterface flat list and the cached drawing X.
    this.GetList();
    this.ResetCachedDrawingX();
    this.m_drawingPage = page;

    if (page) {
      this.SetCurrentPageNum(page);
    }
  }

  public SetCurrentPageNum(currentPage: RunningElementPageLike): void {
    // C++: assert(currentPage);
    if (!currentPage) throw new Error('SetCurrentPageNum requires a current page.');

    const currentNum = currentPage.GetIdx() + 1;

    const num = this.FindDescendantByType(ClassId.NUM) as Num | null;
    if (!num || (num.GetLabel() !== 'page')) return;

    const text = num.FindDescendantByType(ClassId.TEXT) as Text | null;
    if (!text || (text.GetText().length !== 1 || text.GetText()[0] !== 0x23)) return;

    const currentText = num.GetCurrentText();
    if (!currentText) throw new Error('SetCurrentPageNum: Num must expose its current text.');

    currentText.SetText(UTF8to32(StringFormat('%d', currentNum)));
  }

  public LoadFooter(doc: RunningElementDocLike): void {
    const fig = new Fig();
    const svg = new Svg();

    const resources = doc.GetResources();
    const basePath = typeof (resources as any)?.GetPath === 'function' ? (resources as any).GetPath() : '';
    const footerPath = basePath + '/footer.svg';
    // C++ load_file failure leaves an empty document; preserve that fallback.
    // Bundled footer.svg first so browsers render footers with no fs.
    const loadFooter = LoadFooterFile ?? ((filePath: string) => {
      const bundled = bundledReadText(filePath) ?? bundledReadText('footer.svg');
      const text = bundled ?? (() => {
        if (typeof require === 'undefined') return null;
        try { return require('node:fs').readFileSync(filePath, 'utf8') as string; }
        catch { return null; }
      })();
      if (text === null) return null;
      const footer = new xml_document();
      footer.load_string(text);
      return footer;
    });
    const footerDoc = loadFooter(footerPath);
    if (footerDoc) {
      svg.Set(footerDoc.first_child() as never);
    }
    fig.AddChild(svg);
    fig.SetHalign(HorizontalAlignment.center);
    fig.SetValign(VerticalAlignment.bottom);
    this.AddChild(fig);
  }

  public AddPageNum(halign: number, valign: number): void {
    const rend = new Rend();
    const fs = new data_FONTSIZE();
    fs.SetTerm(FONTSIZETERM_small);
    rend.SetFontsize(fs);
    rend.SetHalign(halign);
    rend.SetValign(valign);
    const dash1 = new Text();
    // C++ writes U"– " (en-dash + space) for the page-number template.
    dash1.SetText(UTF8to32('– '));
    const num = new Num();
    num.SetLabel('page');
    const text = new Text();
    text.SetText(UTF8to32('#'));
    const dash2 = new Text();
    dash2.SetText(UTF8to32(' –'));

    num.AddChild(text);
    rend.AddChild(dash1);
    rend.AddChild(num);
    rend.AddChild(dash2);
    this.AddChild(rend);
  }

  // AttFormework forwarding surface.
  public SetFunc(v: any): void { this.formework!.SetFunc(v); }
  public GetFunc(): any { return this.formework!.GetFunc(); }
  public HasFunc(): boolean { return this.formework!.HasFunc(); }
  public ResetFormework(): void { this.formework!.ResetFormework(); }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitRunningElement', this);
  }
  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitRunningElement', this);
  }
  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitRunningElementEnd', this);
  }
  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitRunningElementEnd', this);
  }
}
