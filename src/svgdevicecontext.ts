/**
 * Canonical translation of include/vrv/svgdevicecontext.h +
 * src/svgdevicecontext.cpp (Pass 353).
 *
 * SvgDeviceContext renders the object tree into an SVG document held in the
 * migrated pure-TypeScript pugixml layer. Native std::ostringstream is
 * replaced by a string builder; native file streaming (CopyFileToStream) is a
 * no-op seam that returns true exactly as the C++ method does for the empty
 * resource path. No WebAssembly/native dependency is introduced.
 */
import { DeviceContextCompat, type BBoxObjectLike, type ViewLike, type GlyphResourcesLike } from './bboxdevicecontext.js';
import { xml_document, xml_node, xml_node_type, format_default, format_no_declaration, format_raw } from './pugixml.js';
import { Point, Pen, Brush, PenStyle, LineCapStyle, LineJoinStyle, COLOR_NONE, COLOR_BLACK, COLOR_WHITE, COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_CYAN, COLOR_LIGHT_GREY } from './devicecontextbase.js';
import { GraphicID, VRV_UNSET, DEFINITION_FACTOR, ClassId, CSS_SHOW_HIDDEN, SmuflTextFont } from './vrvdef.js';
import { StringFormat, GetVersion, ConcatenateIDs } from './vrv.js';
import { DegToRad } from './devicecontext.js';
import { VERSION_DEV, VERSION_MAJOR, VERSION_MINOR, VERSION_REVISION } from './vrvdef.js';
import { ObjectFactory } from './object.js';
import type { Glyph } from './glyph.js';
import { AttConverterBase } from './attconverter.js';
const s_attConverter = new AttConverterBase();

// Local scalar constants matching the generated libmei ordinals used by the
// C++ implementation (not exported by the shared att modules).
const BOOLEAN_true = 1;
const BOOLEAN_false = 2;
const HORIZONTALALIGNMENT_NONE = 0;
const HORIZONTALALIGNMENT_left = 1;
const HORIZONTALALIGNMENT_right = 2;
const HORIZONTALALIGNMENT_center = 3;
const FONTSTYLE_NONE = 0;
const FONTSTYLE_italic = 1;
const FONTSTYLE_normal = 2;
const FONTSTYLE_oblique = 3;
const FONTWEIGHT_NONE = 0;
const FONTWEIGHT_bold = 1;
const SMUFL_NONE = SmuflTextFont.SMUFL_NONE;
const SMUFL_FONT_FALLBACK = SmuflTextFont.SMUFL_FONT_FALLBACK;

// Attribute-class ids used by StartGraphic attribute dispatch (libmei ordinals).
const ATT_COLOR = 109;
const ATT_LABELLED = 145;
const ATT_LANG = 146;
const ATT_TYPED = 224;
const ATT_TYPOGRAPHY = 225;
const ATT_VISIBILITY = 228;
const ATT_WHITESPACE = 236;

/** option_SMUFLTEXTFONT from toolkitdef (SMUFLTEXTFONT_none=0, embedded=1, linked=2). */
export enum SMUFLTEXTFONT { none = 0, embedded = 1, linked = 2 }

//----------------------------------------------------------------------------
// ObjectLike: structural contract for StartGraphic attribute dispatch
export interface SvgObjectLike extends BBoxObjectLike {
  GetClassId(): number;
  HasAttClass(attClassId: number): boolean;
  GetClassName(): string;
  HasPlistReferences(): boolean;
  GetPlistReferences(): readonly { GetID(): string }[] | null;
  /** Typed / Visibility / Color / Labelled / Lang / Typography / Whitespace surface */
  HasType?(): boolean; GetType?(): string;
  HasVisible?(): boolean; GetVisible?(): number;
  HasColor?(): boolean; GetColor?(): string;
  HasLabel?(): boolean; GetLabel?(): string;
  HasLang?(): boolean; GetLang?(): string;
  HasFontname?(): boolean; GetFontname?(): string;
  HasFontstyle?(): boolean; GetFontstyle?(): number; FontstyleToStr?(v: number): string;
  HasFontweight?(): boolean; GetFontweight?(): number; FontweightToStr?(v: number): string;
  HasSpace?(): boolean; GetSpace?(): string;
  /** staff drawing style source */
  m_drawingStaffDef?: StaffDefStyleLike | null;
  GetAttributes(attributes: ArrayOfStrAttr): number;
  Is(cls: number): boolean;
  IsFloatingObject?(): boolean;
  GetCurrentFloatingPositioner?(): BBoxObjectLike | null;
  // Bounding-box surface used by debug SVG boundingbox output
  GetID(): string;
  HasSelfBB(): boolean;
  GetSelfX1(): number; GetSelfX2(): number; GetSelfY1(): number; GetSelfY2(): number;
  HasContentBB(): boolean;
  GetContentX1(): number; GetContentX2(): number; GetContentY1(): number; GetContentY2(): number;
  GetDrawingX(): number; GetDrawingY(): number;
}

export interface StaffDefStyleLike {
  HasLyricFam(): boolean; GetLyricFam(): string;
  HasLyricName(): boolean; GetLyricName(): string;
  HasLyricStyle(): boolean; GetLyricStyle(): number; FontstyleToStr(v: number): string;
  HasLyricWeight(): boolean; GetLyricWeight(): number; FontweightToStr(v: number): string;
}

export type ArrayOfStrAttr = [string, string][];

//----------------------------------------------------------------------------
// GlyphRef (nested class)
class GlyphRef {
  public readonly m_glyph: Glyph;
  public readonly m_refId: string;

  constructor(glyph: Glyph, count: number, postfix: string) {
    this.m_glyph = glyph;
    // Add the counter only when necessary (more than one font for that glyph)
    if (count === 0) {
      this.m_refId = StringFormat('%s-%s', glyph.GetCodeStr(), postfix);
    }
    else {
      this.m_refId = StringFormat('%s-%d-%s', glyph.GetCodeStr(), count, postfix);
    }
  }

  public GetGlyph(): Glyph { return this.m_glyph; }
  public GetRefId(): string { return this.m_refId; }
}

//----------------------------------------------------------------------------
// SvgDeviceContext
export class SvgDeviceContext extends DeviceContextCompat {
  /** C++ SvgDeviceContext::ApplyOffset override returns true. */
  public override ApplyOffset(): boolean { return true; }
  protected m_docId: string;

  /** Flag for indicating if the music font is currently used as text font. */
  protected m_vrvTextFont = false;
  /** Flag indicating we need a fallback font for the music Glyphs. */
  protected m_vrvTextFontFallback = false;

  /** std::ostringstream equivalent: the committed SVG text. */
  protected m_outdata = '';
  protected m_committed = false;
  protected m_originX = 0;
  protected m_originY = 0;
  /** Current text baseline, used to express vertical moves as relative SVG dy values. */
  protected m_textY = 0;

  protected m_smuflGlyphs: [Glyph, GlyphRef][] = [];
  protected m_glyphCodeFontCounter = new Map<string, number>();

  // pugixml data
  protected m_svgDoc = new xml_document();
  protected m_svgNode: xml_node;
  protected m_pageNode!: xml_node;
  protected m_currentNode: xml_node;
  protected m_svgNodeStack: xml_node[] = [];

  // output as mm (for pdf generation with a 72 dpi)
  protected m_mmOutput = false;
  // show hidden flag
  protected m_showHidden = false;
  // facsimile flag
  protected m_facsimile = false;
  // use LiberationTextFont
  protected m_useLiberation = false;
  // add bounding boxes in svg output
  protected m_svgBoundingBoxes = false;
  // add content bounding boxes in svg output
  protected m_svgContentBoundingBoxes = false;
  // use viewbox on svg root element
  protected m_svgViewBox = false;
  // output HTML5 data-* attributes
  protected m_html5 = false;
  // additional CSS
  protected m_css = '';
  // copy additional attributes of given elements to the SVG, in the form "note@pname; layer@n"
  protected m_svgAdditionalAttributes = new Map<number, string[]>();
  // format output as raw, stripping extraneous whitespace and non-content newlines
  protected m_formatRaw = false;
  // remove xlink from href attributes
  protected m_removeXlink = false;
  // indentation value (-1 for tabs)
  protected m_indent = 2;
  // postfix to be added to font glyphs
  protected m_glyphPostfixId = '';
  // embedding of the smufl text font
  protected m_smuflTextFont: SMUFLTEXTFONT = SMUFLTEXTFONT.none;

  constructor(docId: string) {
    super(ClassId.SVG_DEVICE_CONTEXT);
    this.m_docId = docId;

    this.m_originX = 0;
    this.m_originY = 0;

    this.m_smuflGlyphs = [];

    this.m_committed = false;
    this.m_vrvTextFont = false;
    this.m_vrvTextFontFallback = false;

    this.m_mmOutput = false;
    this.m_showHidden = false;
    this.m_svgBoundingBoxes = false;
    this.m_svgContentBoundingBoxes = false;
    this.m_svgViewBox = false;
    this.m_html5 = false;
    this.m_formatRaw = false;
    this.m_removeXlink = false;
    this.m_facsimile = false;
    this.m_useLiberation = false;
    this.m_indent = 2;

    // create the initial SVG element
    // width and height need to be set later; these are taken care of in "commit"
    this.m_svgNode = this.m_svgDoc.append_child('svg');
    this.m_svgNode.append_attribute('version').set_value('1.1');
    this.m_svgNode.append_attribute('xmlns').set_value('http://www.w3.org/2000/svg');
    this.m_svgNode.append_attribute('xmlns:xlink').set_value('http://www.w3.org/1999/xlink');
    this.m_svgNode.append_attribute('overflow').set_value('visible');
    this.m_svgNode.append_attribute('id').set_value(this.m_docId);

    // start the stack
    this.m_svgNodeStack.push(this.m_svgNode);
    this.m_currentNode = this.m_svgNode;

    this.m_outdata = '';
    this.m_glyphPostfixId = this.m_docId;
  }

  //--------------------------------------------------------------------------
  // Native seam: C++ copies a file to the stream; the pure-TS context has no
  // native filesystem in this seam and keeps the C++ success contract.
  protected CopyFileToStream(_filename: string, _dest: { write(data: string): void }): boolean {
    return true;
  }

  protected InsertGlyphRef(glyph: Glyph): string {
    const code = glyph.GetCodeStr();

    // Check if glyph already exists
    for (const [g, ref] of this.m_smuflGlyphs) {
      if (g === glyph) {
        return ref.GetRefId();
      }
    }

    let count = 0;
    if (this.m_glyphCodeFontCounter.has(code)) {
      count = this.m_glyphCodeFontCounter.get(code)!;
    }

    const ref = new GlyphRef(glyph, count, this.m_glyphPostfixId);
    const id = ref.GetRefId();

    this.m_smuflGlyphs.push([glyph, ref]); // preserve insertion order
    this.m_glyphCodeFontCounter.set(code, count + 1);

    return id;
  }

  protected IncludeTextFont(fontname: string, resources: GlyphResourcesLike): void {
    let cssContent: string;

    if (this.m_smuflTextFont === SMUFLTEXTFONT.embedded) {
      cssContent = resources.GetCSSFontFor ? resources.GetCSSFontFor(fontname) : '';
    }
    else {
      const versionPath = VERSION_DEV ? 'develop' : StringFormat('%d.%d.%d', VERSION_MAJOR, VERSION_MINOR, VERSION_REVISION);
      cssContent = StringFormat('@import url("https://www.verovio.org/javascript/%s/data/%s.css");', versionPath, fontname);
    }

    const css = this.m_svgNode.append_child('style');
    css.append_attribute('type').set_value('text/css');
    css.text().set(cssContent);
  }

  protected Commit(xml_declaration: boolean): void {
    if (this.m_committed) {
      return;
    }

    // take care of width/height once userScale is updated
    let height = this.GetHeight() * this.GetUserScaleY();
    let width = this.GetWidth() * this.GetUserScaleX();
    let format = '%gpx';

    if (this.m_mmOutput) {
      height /= 10;
      width /= 10;
      format = '%gmm';
    }
    else {
      const [baseWidth, baseHeight] = this.GetBaseSize();
      if (baseWidth && baseHeight) {
        height = baseHeight;
        width = baseWidth;
      }
      else {
        height = Math.ceil(height);
        width = Math.ceil(width);
      }
    }

    if (this.m_svgViewBox) {
      this.m_svgNode.prepend_attribute('viewBox').set_value(StringFormat('0 0 %g %g', width, height));
    }
    else {
      this.m_svgNode.prepend_attribute('height').set_value(StringFormat(format, height));
      this.m_svgNode.prepend_attribute('width').set_value(StringFormat(format, width));
    }

    // add the woff2 font if needed
    if (this.m_smuflTextFont !== SMUFLTEXTFONT.none) {
      const resources = this.GetResources(true);
      // include the selected font
      if (this.m_vrvTextFont && resources) {
        this.IncludeTextFont(resources.GetCurrentFont ? resources.GetCurrentFont() : '', resources);
      }
      // include the fallback font
      if (this.m_vrvTextFontFallback && resources) {
        this.IncludeTextFont(resources.GetFallbackFont ? resources.GetFallbackFont() : '', resources);
      }
    }
    if (this.m_useLiberation) {
      const resources = this.GetResources(true);
      if (resources) {
        this.IncludeTextFont(resources.GetTextFont ? resources.GetTextFont() : '', resources);
      }
    }

    // header
    if (this.m_smuflGlyphs.length > 0) {
      const defs = this.m_svgNode.prepend_child('defs');
      const sourceDoc = new xml_document();

      // for each needed glyph
      for (const entry of this.m_smuflGlyphs) {
        const glyph = entry[0];
        const ref = entry[1];
        // load the XML as a pugi::xml_document
        sourceDoc.load_string(glyph.GetXML());

        // copy all the nodes inside into the master document
        for (let child = sourceDoc.first_child(); !child.empty(); child = child.next_sibling()) {
          child.attribute('id').set_value(ref.GetRefId());
          defs.append_copy(child);
        }
      }
    }

    let output_flags = format_default | format_no_declaration;
    if (xml_declaration) {
      // edit the xml declaration
      output_flags = format_default;
      const decl = this.m_svgDoc.prepend_child(xml_node_type.node_declaration);
      decl.append_attribute('version').set_value('1.0');
      decl.append_attribute('encoding').set_value('UTF-8');
      decl.append_attribute('standalone').set_value('no');
    }

    if (this.m_formatRaw) {
      output_flags |= format_raw;
    }

    // add description statement
    const desc = this.m_svgNode.prepend_child('desc');
    desc.text().set(StringFormat('Engraved by Verovio %s', GetVersion()));

    // save the glyph data to m_outdata
    const indent = this.m_indent === -1 ? '\t' : ' '.repeat(this.m_indent);
    this.m_outdata = this.m_svgDoc.save_string(indent, output_flags);

    this.m_committed = true;
  }

  //--------------------------------------------------------------------------
  // Graphics stack lifecycle

  public StartGraphic(object: SvgObjectLike, gClass: string, gId: string, graphicID: GraphicID = GraphicID.PRIMARY, prepend = false): void {
    let gClassFull = gClass;

    if (object.HasAttClass(ATT_TYPED)) {
      if (object.HasType && object.HasType()) {
        gClassFull += (gClassFull.length === 0 ? '' : ' ') + object.GetType!();
      }
    }
    if (this.m_showHidden && object.HasAttClass(ATT_VISIBILITY)) {
      if (object.HasVisible && object.HasVisible() && object.GetVisible!() === BOOLEAN_false) {
        gClassFull += (gClassFull.length === 0 ? CSS_SHOW_HIDDEN : StringFormat(' %s', CSS_SHOW_HIDDEN));
      }
    }

    if (prepend) {
      this.m_currentNode = this.m_currentNode.prepend_child('g');
    }
    else {
      this.m_currentNode = this.m_currentNode.append_child('g');
    }
    this.m_svgNodeStack.push(this.m_currentNode);
    this.AppendIdAndClass(gId, object.GetClassName(), gClassFull, graphicID);
    this.AppendAdditionalAttributes(object);

    // Add data-plist with html5 (now only for annot)
    if (this.m_html5 && object.HasPlistReferences()) {
      const plist = object.GetPlistReferences();
      if (plist) {
        const ids = ConcatenateIDs(plist);
        this.SetCustomGraphicAttributes('plist-referring', ids);
      }
    }

    // this sets staffDef styles for lyrics
    if (object.Is(ClassId.STAFF)) {
      const staffDef = object.m_drawingStaffDef;
      if (!staffDef) throw new Error('SvgDeviceContext requires staff->m_drawingStaffDef');

      let styleStr = '';
      if (staffDef.HasLyricFam()) {
        styleStr += 'font-family:' + staffDef.GetLyricFam() + ';';
      }
      if (staffDef.HasLyricName()) {
        styleStr += 'font-family:' + staffDef.GetLyricName() + ';';
      }
      if (staffDef.HasLyricStyle()) {
        styleStr += 'font-style:' + staffDef.FontstyleToStr(staffDef.GetLyricStyle()) + ';';
      }
      if (staffDef.HasLyricWeight()) {
        styleStr += 'font-weight:' + staffDef.FontweightToStr(staffDef.GetLyricWeight()) + ';';
      }
      if (styleStr.length > 0) this.m_currentNode.append_attribute('style').set_value(styleStr);
    }

    if (object.HasAttClass(ATT_COLOR)) {
      if (object.HasColor && object.HasColor()) {
        this.m_currentNode.append_attribute('color').set_value(object.GetColor!());
        this.m_currentNode.append_attribute('fill').set_value(object.GetColor!());
      }
    }

    if (object.HasAttClass(ATT_LABELLED)) {
      if (object.HasLabel && object.HasLabel()) {
        const svgTitle = this.m_currentNode.prepend_child('title');
        svgTitle.append_attribute('class').set_value('labelAttr');
        svgTitle.text().set(object.GetLabel!());
      }
    }

    if (object.HasAttClass(ATT_LANG)) {
      if (object.HasLang && object.HasLang()) {
        this.m_currentNode.append_attribute('xml:lang').set_value(object.GetLang!());
      }
    }

    if (object.HasAttClass(ATT_TYPOGRAPHY)) {
      if (object.HasFontname && object.HasFontname()) this.m_currentNode.append_attribute('font-family').set_value(object.GetFontname!());
      if (object.HasFontstyle && object.HasFontstyle()) {
        const fn = typeof object.FontstyleToStr === 'function' ? object.FontstyleToStr.bind(object) : s_attConverter.FontstyleToStr.bind(s_attConverter);
        this.m_currentNode.append_attribute('font-style').set_value(fn(object.GetFontstyle!()));
      }
      if (object.HasFontweight && object.HasFontweight()) {
        const fn = typeof object.FontweightToStr === 'function' ? object.FontweightToStr.bind(object) : s_attConverter.FontweightToStr.bind(s_attConverter);
        this.m_currentNode.append_attribute('font-weight').set_value(fn(object.GetFontweight!()));
      }
    }

    if (object.HasAttClass(ATT_VISIBILITY)) {
      if (object.HasVisible && object.HasVisible()) {
        if (object.GetVisible!() === BOOLEAN_true || this.m_showHidden) {
          this.m_currentNode.append_attribute('visibility').set_value('visible');
        }
        else if (object.GetVisible!() === BOOLEAN_false) {
          this.m_currentNode.append_attribute('visibility').set_value('hidden');
        }
      }
    }
  }

  public StartCustomGraphic(name: string, gClass = '', gId = ''): void {
    this.m_currentNode = this.m_currentNode.append_child('g');
    this.m_svgNodeStack.push(this.m_currentNode);
    this.AppendIdAndClass(gId, name, gClass);
  }

  public StartTextGraphic(object: SvgObjectLike, gClass: string, gId: string): void {
    this.m_currentNode = this.AddChild('tspan');
    this.m_svgNodeStack.push(this.m_currentNode);
    this.AppendIdAndClass(gId, object.GetClassName(), gClass);
    this.AppendAdditionalAttributes(object);

    if (object.HasAttClass(ATT_COLOR)) {
      if (object.HasColor && object.HasColor()) this.m_currentNode.append_attribute('fill').set_value(object.GetColor!());
    }

    if (object.HasAttClass(ATT_LABELLED)) {
      if (object.HasLabel && object.HasLabel()) {
        const svgTitle = this.m_currentNode.prepend_child('title');
        svgTitle.append_attribute('class').set_value('labelAttr');
        svgTitle.text().set(object.GetLabel!());
      }
    }

    if (object.HasAttClass(ATT_LANG)) {
      if (object.HasLang && object.HasLang()) {
        this.m_currentNode.append_attribute('xml:lang').set_value(object.GetLang!());
      }
    }

    if (object.HasAttClass(ATT_TYPOGRAPHY)) {
      if (object.HasFontname && object.HasFontname()) this.m_currentNode.append_attribute('font-family').set_value(object.GetFontname!());
      if (object.HasFontstyle && object.HasFontstyle()) {
        const fn = typeof object.FontstyleToStr === 'function' ? object.FontstyleToStr.bind(object) : s_attConverter.FontstyleToStr.bind(s_attConverter);
        this.m_currentNode.append_attribute('font-style').set_value(fn(object.GetFontstyle!()));
      }
      if (object.HasFontweight && object.HasFontweight()) {
        const fn = typeof object.FontweightToStr === 'function' ? object.FontweightToStr.bind(object) : s_attConverter.FontweightToStr.bind(s_attConverter);
        this.m_currentNode.append_attribute('font-weight').set_value(fn(object.GetFontweight!()));
      }
    }

    if (object.HasAttClass(ATT_WHITESPACE)) {
      if (object.HasSpace && object.HasSpace()) {
        this.m_currentNode.append_attribute('xml:space').set_value(object.GetSpace!());
      }
    }
  }

  public ResumeGraphic(object: SvgObjectLike, gId: string): void {
    // C++ uses an XPath descendant lookup for the graphic id; the migrated
    // pugixml layer has no XPath engine, so the same node set is resolved with
    // a document-order descendant traversal.
    const attrName = this.m_html5 ? 'data-id' : 'id';
    const found = this.FindDescendantByAttribute(this.m_currentNode, attrName, gId);
    if (found) {
      this.m_currentNode = found;
    }
    this.m_svgNodeStack.push(this.m_currentNode);
  }

  /** Document-order descendant lookup equivalent to the C++ select_node. */
  protected FindDescendantByAttribute(root: xml_node, attrName: string, gId: string): xml_node | null {
    for (let child = root.first_child(); !child.empty(); child = child.next_sibling()) {
      const attr = child.attribute(attrName);
      if (!attr.empty() && attr.value() === gId) return child;
      const found = this.FindDescendantByAttribute(child, attrName, gId);
      if (found) return found;
    }
    return null;
  }

  public EndGraphic(object: SvgObjectLike, view: ViewLike | null): void {
    this.DrawSvgBoundingBox(object, view);
    this.m_svgNodeStack.pop();
    this.m_currentNode = this.m_svgNodeStack[this.m_svgNodeStack.length - 1];
  }

  public EndCustomGraphic(): void {
    this.m_svgNodeStack.pop();
    this.m_currentNode = this.m_svgNodeStack[this.m_svgNodeStack.length - 1];
  }

  public SetCustomGraphicColor(color: string): void {
    this.m_currentNode.append_attribute('color').set_value(color);
    this.m_currentNode.append_attribute('fill').set_value(color);
  }

  public SetCustomGraphicAttributes(data: string, value: string): void {
    this.m_currentNode.append_attribute('data-' + data).set_value(value);
  }

  public EndResumedGraphic(object: SvgObjectLike, view: ViewLike | null): void {
    this.m_svgNodeStack.pop();
    this.m_currentNode = this.m_svgNodeStack[this.m_svgNodeStack.length - 1];
  }

  public EndTextGraphic(object: SvgObjectLike, view: ViewLike | null): void {
    this.DrawSvgBoundingBox(object, view);
    this.m_svgNodeStack.pop();
    this.m_currentNode = this.m_svgNodeStack[this.m_svgNodeStack.length - 1];
  }

  public RotateGraphic(orig: Point, angle: number): void {
    if (!this.m_currentNode.attribute('transform').empty()) {
      return;
    }

    this.m_currentNode.append_attribute('transform').set_value(StringFormat('rotate(%f %d,%d)', angle, orig.x, orig.y));
  }

  //--------------------------------------------------------------------------
  // Page lifecycle

  public StartPage(): void {
    // Initialize the flag to false because we want to know if the font needs to be included in the SVG
    this.m_vrvTextFont = false;
    this.m_vrvTextFontFallback = false;

    const resources = this.GetResources();

    // default styles
    if (this.UseGlobalStyling()) {
      this.m_currentNode = this.m_currentNode.append_child('style');
      this.m_currentNode.append_attribute('type').set_value('text/css');
      if (!resources) throw new Error('SvgDeviceContext::StartPage requires resources');
      let css = 'g.ending, g.fing, g.reh, g.tempo {font-weight:bold;} '
        + 'g.dir, g.dynam, g.mNum {font-style:italic;}'
        + 'g.label {font-weight:normal;} '
        + 'ellipse, path, polygon, polyline, rect {stroke:currentColor} '
        + 'g.cursor {fill:dodgerblue; color:dodgerblue;} '
        + 'g.cursor.chord {fill:limegreen; color:limegreen;} ';
      if (this.m_showHidden) {
        css += StringFormat('g.%s {fill: silver; color:silver; stroke:silver;} ', CSS_SHOW_HIDDEN);
      }
      // C++ PrefixCssRules(std::string&) mutates in place; TS must store the result back.
      css = this.PrefixCssRulesOnString(css);
      // ponytail: C++ prefixes only the default `<style>` element; m_css (user
      // option `svgCss`) is emitted raw. Verify against WASM before prefixing m_css.
      this.m_currentNode.text().set(css);
      this.m_currentNode = this.m_svgNodeStack[this.m_svgNodeStack.length - 1];
    }

    if (this.m_css.length > 0) {
      this.m_currentNode = this.m_currentNode.append_child('style');
      this.m_currentNode.append_attribute('type').set_value('text/css');
      this.m_currentNode.text().set(this.m_css);
      this.m_currentNode = this.m_svgNodeStack[this.m_svgNodeStack.length - 1];
    }

    // a graphic for definition scaling
    this.m_currentNode = this.m_currentNode.append_child('svg');
    this.m_svgNodeStack.push(this.m_currentNode);
    this.m_currentNode.append_attribute('class').set_value('definition-scale');
    this.m_currentNode.append_attribute('color').set_value('black');
    this.m_currentNode.append_attribute('font-family').set_value((resources?.GetTextFont ? resources.GetTextFont() : 'Liberation') + ', serif');
    if (this.GetFacsimile()) {
      this.m_currentNode.append_attribute('viewBox').set_value(StringFormat('0 0 %d %d', this.GetWidth(), this.GetHeight()));
    }
    else {
      this.m_currentNode.append_attribute('viewBox').set_value(StringFormat('0 0 %d %d',
        Math.trunc(this.GetWidth() * this.GetViewBoxFactor()), Math.trunc(this.GetContentHeight() * this.GetViewBoxFactor())));
    }

    // a graphic for the origin
    this.m_currentNode = this.m_currentNode.append_child('g');
    this.m_svgNodeStack.push(this.m_currentNode);
    this.m_currentNode.append_attribute('class').set_value('page-margin');
    this.m_currentNode.append_attribute('transform')
      .set_value(StringFormat('translate(%d, %d)', Math.trunc(this.m_originX), Math.trunc(this.m_originY)));

    this.m_pageNode = this.m_currentNode;
  }

  public EndPage(): void {
    // end page-margin
    this.m_svgNodeStack.pop();
    // end definition-scale
    this.m_svgNodeStack.pop();
    // end page-scale
    // m_svgNodeStack.pop();
    this.m_currentNode = this.m_svgNodeStack[this.m_svgNodeStack.length - 1];
  }

  //--------------------------------------------------------------------------
  // Background/origin setters

  public SetBackground(_color: number, _style = PenStyle.PEN_SOLID): void {
    // nothing to do, we do not handle Background
  }

  public SetBackgroundImage(_image: unknown, _opacity = 1.0): void { /* nothing to do */ }

  public SetBackgroundMode(_mode: number): void {
    // nothing to do, we do not handle Background Mode
  }

  public SetTextForeground(color: number): void {
    this.m_brushStack[this.m_brushStack.length - 1].SetColor(color); // we use the brush color for text
  }

  public SetTextBackground(_color: number): void {
    // nothing to do, we do not handle Text Background Mode
  }

  public SetLogicalOrigin(x: number, y: number): void {
    this.m_originX = -x;
    this.m_originY = -y;
  }

  public GetLogicalOrigin(): Point {
    return new Point(this.m_originX, this.m_originY);
  }

  //--------------------------------------------------------------------------
  // Child node helper

  protected AddChild(name: string): xml_node {
    const g = this.m_currentNode.child('g');
    if (!g.empty()) {
      return this.m_currentNode.insert_child_before(name, g);
    }
    else {
      return this.m_pushBack ? this.m_currentNode.prepend_child(name) : this.m_currentNode.append_child(name);
    }
  }

  //--------------------------------------------------------------------------
  // Pen property helpers

  protected AppendStrokeLineCap(node: xml_node, pen: Pen): void {
    switch (pen.GetLineCap()) {
      case LineCapStyle.LINECAP_BUTT: node.append_attribute('stroke-linecap').set_value('butt'); break;
      case LineCapStyle.LINECAP_ROUND: node.append_attribute('stroke-linecap').set_value('round'); break;
      case LineCapStyle.LINECAP_SQUARE: node.append_attribute('stroke-linecap').set_value('square'); break;
      default: break;
    }
  }

  protected AppendStrokeLineJoin(node: xml_node, pen: Pen): void {
    switch (pen.GetLineJoin()) {
      case LineJoinStyle.LINEJOIN_ARCS: node.append_attribute('stroke-linejoin').set_value('arcs'); break;
      case LineJoinStyle.LINEJOIN_BEVEL: node.append_attribute('stroke-linejoin').set_value('bevel'); break;
      case LineJoinStyle.LINEJOIN_MITER: node.append_attribute('stroke-linejoin').set_value('miter'); break;
      case LineJoinStyle.LINEJOIN_MITER_CLIP: node.append_attribute('stroke-linejoin').set_value('miter-clip'); break;
      case LineJoinStyle.LINEJOIN_ROUND: node.append_attribute('stroke-linejoin').set_value('round'); break;
      default: break;
    }
  }

  protected AppendStrokeDashArray(node: xml_node, pen: Pen): void {
    if (pen.GetDashLength() > 0) {
      const dashLength = pen.GetDashLength();
      const gapLength = pen.GetGapLength() > 0 ? pen.GetGapLength() : dashLength;
      node.append_attribute('stroke-dasharray').set_value(StringFormat('%d %d', dashLength, gapLength));
    }
  }

  /**
   * Prefix the CSS rules with a #docId for scoping them to the SVG.
   * The C++ implementation uses std::regex; the same selector/property
   * extraction is done with a regex scan preserving match order.
   */
  protected PrefixCssRulesOnString(rules: string): string {
    const selectorRegex = /([^{}]+)\s*\{([^}]*)\}/g;
    let result = '';
    let match: RegExpExecArray | null;
    while ((match = selectorRegex.exec(rules)) !== null) {
      const selectors = match[1];
      const properties = match[2];

      // Split by comma to handle multi-selectors
      const prefixedSelectors: string[] = [];
      for (const raw of selectors.split(',')) {
        const selector = raw.replace(/^\s+|\s+$/g, '');
        prefixedSelectors.push('#' + this.m_docId + ' ' + selector);
      }

      if (prefixedSelectors.length === 0) continue;

      const finalSelector = prefixedSelectors.join(', ');
      result += finalSelector + ' {' + properties + '}';
    }
    return result;
  }

  /** C++ SvgDeviceContext::PrefixCssRules(std::string&) (svgdevicecontext.cpp:649). */
  protected PrefixCssRules(rules: { get(): string; set(v: string): void }): void {
    rules.set(this.PrefixCssRulesOnString(rules.get()));
  }

  //--------------------------------------------------------------------------
  // Drawing methods

  public DrawQuadBezierPath(bezier: Point[]): void {
    if (this.m_penStack.length === 0) throw new Error('SvgDeviceContext pen stack is empty');
    const currentPen = this.m_penStack[this.m_penStack.length - 1];

    const pathChild = this.AddChild('path');
    pathChild.append_attribute('d').set_value(StringFormat('M%d,%d Q%d,%d %d,%d', // Base string
      bezier[0].x, bezier[0].y, // M Command
      bezier[1].x, bezier[1].y, bezier[2].x, bezier[2].y));
    pathChild.append_attribute('fill').set_value('none');

    if (currentPen.GetWidth() > 0) {
      pathChild.append_attribute('stroke-width').set_value(StringFormat('%d', currentPen.GetWidth()));
    }
    if (currentPen.HasColor() || !this.UseGlobalStyling()) {
      pathChild.append_attribute('stroke').set_value(this.GetColor(currentPen.GetColor()));
    }
    pathChild.append_attribute('stroke-linecap').set_value('round');
    pathChild.append_attribute('stroke-linejoin').set_value('round');
    this.AppendStrokeDashArray(pathChild, currentPen);
  }

  public DrawCubicBezierPath(bezier: Point[]): void {
    if (this.m_penStack.length === 0) throw new Error('SvgDeviceContext pen stack is empty');
    const currentPen = this.m_penStack[this.m_penStack.length - 1];

    const pathChild = this.AddChild('path');
    pathChild.append_attribute('d').set_value(StringFormat('M%d,%d C%d,%d %d,%d %d,%d', // Base string
      bezier[0].x, bezier[0].y, // M Command
      bezier[1].x, bezier[1].y, bezier[2].x, bezier[2].y, bezier[3].x, bezier[3].y // Remaining bezier points.
    ));
    pathChild.append_attribute('fill').set_value('none');

    if (currentPen.GetWidth() > 0) {
      pathChild.append_attribute('stroke-width').set_value(StringFormat('%d', currentPen.GetWidth()));
    }
    if (currentPen.HasColor() || !this.UseGlobalStyling()) {
      pathChild.append_attribute('stroke').set_value(this.GetColor(currentPen.GetColor()));
    }
    pathChild.append_attribute('stroke-linecap').set_value('round');
    pathChild.append_attribute('stroke-linejoin').set_value('round');
    this.AppendStrokeDashArray(pathChild, currentPen);
  }

  public DrawCubicBezierPathFilled(bezier1: Point[], bezier2: Point[]): void {
    if (this.m_penStack.length === 0) throw new Error('SvgDeviceContext pen stack is empty');
    const currentPen = this.m_penStack[this.m_penStack.length - 1];

    const pathChild = this.AddChild('path');
    pathChild.append_attribute('d')
      .set_value(StringFormat('M%d,%d C%d,%d %d,%d %d,%d C%d,%d %d,%d %d,%d', bezier1[0].x, bezier1[0].y, // M command
        bezier1[1].x, bezier1[1].y, bezier1[2].x, bezier1[2].y, bezier1[3].x, bezier1[3].y, // First bezier
        bezier2[2].x, bezier2[2].y, bezier2[1].x, bezier2[1].y, bezier2[0].x, bezier2[0].y // Second Bezier
      ));

    if (currentPen.GetWidth() > 0) {
      pathChild.append_attribute('stroke-width').set_value(StringFormat('%d', currentPen.GetWidth()));
    }
    if (currentPen.HasColor() || !this.UseGlobalStyling()) {
      pathChild.append_attribute('stroke').set_value(this.GetColor(currentPen.GetColor()));
    }
    pathChild.append_attribute('stroke-linecap').set_value('round');
    pathChild.append_attribute('stroke-linejoin').set_value('round');
  }

  public DrawBentParallelogramFilled(side: Point[], height: number): void {
    if (this.m_penStack.length === 0) throw new Error('SvgDeviceContext pen stack is empty');
    const currentPen = this.m_penStack[this.m_penStack.length - 1];

    const pathChild = this.AddChild('path');
    pathChild.append_attribute('d').set_value(StringFormat('M%d,%d C%d,%d %d,%d %d,%d L%d,%d C%d,%d %d,%d %d,%d Z', side[0].x,
      side[0].y, side[1].x, side[1].y, side[2].x, side[2].y, side[3].x, side[3].y, side[3].x, side[3].y + height,
      side[2].x, side[2].y + height, side[1].x, side[1].y + height, side[0].x, side[0].y + height));

    if (currentPen.GetWidth() > 0) {
      pathChild.append_attribute('stroke-width').set_value(StringFormat('%d', currentPen.GetWidth()));
    }
    if (currentPen.HasColor() || !this.UseGlobalStyling()) {
      pathChild.append_attribute('stroke').set_value(this.GetColor(currentPen.GetColor()));
    }
    pathChild.append_attribute('stroke-linecap').set_value('round');
    pathChild.append_attribute('stroke-linejoin').set_value('round');
  }

  public DrawCircle(x: number, y: number, radius: number): void {
    this.DrawEllipse(x - radius, y - radius, 2 * radius, 2 * radius);
  }

  public DrawEllipse(x: number, y: number, width: number, height: number): void {
    if (this.m_penStack.length === 0) throw new Error('SvgDeviceContext pen stack is empty');
    if (this.m_brushStack.length === 0) throw new Error('SvgDeviceContext brush stack is empty');

    const currentPen = this.m_penStack[this.m_penStack.length - 1];
    const currentBrush = this.m_brushStack[this.m_brushStack.length - 1];

    const rh = Math.trunc(height / 2);
    const rw = Math.trunc(width / 2);

    const ellipseChild = this.AddChild('ellipse');
    ellipseChild.append_attribute('cx').set_value(StringFormat('%d', x + rw));
    ellipseChild.append_attribute('cy').set_value(StringFormat('%d', y + rh));
    ellipseChild.append_attribute('rx').set_value(StringFormat('%d', rw));
    ellipseChild.append_attribute('ry').set_value(StringFormat('%d', rh));

    if (currentBrush.HasOpacity()) {
      ellipseChild.append_attribute('fill-opacity').set_value(StringFormat('%g', currentBrush.GetOpacity()));
    }
    if (currentPen.GetWidth() > 0) {
      ellipseChild.append_attribute('stroke-width').set_value(StringFormat('%d', currentPen.GetWidth()));
    }
    if (currentPen.HasColor() || !this.UseGlobalStyling()) {
      ellipseChild.append_attribute('stroke').set_value(this.GetColor(currentPen.GetColor()));
    }
    if (currentPen.HasOpacity()) {
      ellipseChild.append_attribute('stroke-opacity').set_value(StringFormat('%g', currentPen.GetOpacity()));
    }
  }

  public DrawEllipticArc(x: number, y: number, width: number, height: number, start: number, end: number): void {
    if (this.m_penStack.length === 0) throw new Error('SvgDeviceContext pen stack is empty');
    if (this.m_brushStack.length === 0) throw new Error('SvgDeviceContext brush stack is empty');

    const currentPen = this.m_penStack[this.m_penStack.length - 1];
    const currentBrush = this.m_brushStack[this.m_brushStack.length - 1];

    // radius
    const rx = width / 2;
    const ry = height / 2;
    // center
    const xc = x + rx;
    const yc = y + ry;

    const xs = xc + rx * Math.cos(DegToRad(start));
    const xe = xc + rx * Math.cos(DegToRad(end));
    const ys = yc - ry * Math.sin(DegToRad(start));
    const ye = yc - ry * Math.sin(DegToRad(end));

    /// now same as circle arc...
    const theta1 = Math.atan2(ys - yc, xs - xc);
    const theta2 = Math.atan2(ye - yc, xe - xc);

    // flag for large or small arc 0 means less than 180 degrees
    const fArc = (theta2 - theta1) > 0 ? 1 : 0;

    const fSweep = Math.abs(theta2 - theta1) > Math.PI ? 1 : 0;

    const pathChild = this.AddChild('path');
    pathChild.append_attribute('d').set_value(StringFormat(
      'M%d %d A%d %d 0.0 %d %d %d %d', Math.trunc(xs), Math.trunc(ys), Math.abs(Math.trunc(rx)), Math.abs(Math.trunc(ry)), fArc, fSweep, Math.trunc(xe), Math.trunc(ye)));

    if (currentBrush.HasOpacity()) {
      pathChild.append_attribute('fill-opacity').set_value(StringFormat('%g', currentBrush.GetOpacity()));
    }
    if (currentPen.GetWidth() > 0) {
      pathChild.append_attribute('stroke-width').set_value(StringFormat('%d', currentPen.GetWidth()));
    }
    if (currentPen.HasColor() || !this.UseGlobalStyling()) {
      pathChild.append_attribute('stroke').set_value(this.GetColor(currentPen.GetColor()));
    }
    if (currentPen.HasOpacity()) {
      pathChild.append_attribute('stroke-opacity').set_value(StringFormat('%g', currentPen.GetOpacity()));
    }
  }

  public DrawLine(x1: number, y1: number, x2: number, y2: number): void {
    if (this.m_penStack.length === 0) throw new Error('SvgDeviceContext pen stack is empty');
    const currentPen = this.m_penStack[this.m_penStack.length - 1];

    const pathChild = this.AddChild('path');
    pathChild.append_attribute('d').set_value(StringFormat('M%d %d L%d %d', x1, y1, x2, y2));

    if (currentPen.GetWidth() > 0) {
      pathChild.append_attribute('stroke-width').set_value(StringFormat('%d', currentPen.GetWidth()));
    }
    if (currentPen.HasColor() || !this.UseGlobalStyling()) {
      pathChild.append_attribute('stroke').set_value(this.GetColor(currentPen.GetColor()));
    }
    if (currentPen.HasOpacity()) {
      pathChild.append_attribute('stroke-opacity').set_value(StringFormat('%g', currentPen.GetOpacity()));
    }

    this.AppendStrokeLineCap(pathChild, currentPen);
    this.AppendStrokeDashArray(pathChild, currentPen);
  }

  public DrawPolyline(n: number, points: Point[], close: boolean): void {
    if (this.m_penStack.length === 0) throw new Error('SvgDeviceContext pen stack is empty');
    const currentPen = this.m_penStack[this.m_penStack.length - 1];

    const polylineChild = close ? this.AddChild('polygon') : this.AddChild('polyline');

    if (currentPen.GetWidth() > 0) {
      polylineChild.append_attribute('stroke-width').set_value(StringFormat('%d', currentPen.GetWidth()));
    }
    if (currentPen.HasColor() || !this.UseGlobalStyling()) {
      polylineChild.append_attribute('stroke').set_value(this.GetColor(currentPen.GetColor()));
    }
    if (currentPen.HasOpacity()) {
      polylineChild.append_attribute('stroke-opacity').set_value(StringFormat('%g', currentPen.GetOpacity()));
    }

    this.AppendStrokeLineCap(polylineChild, currentPen);
    this.AppendStrokeLineJoin(polylineChild, currentPen);
    this.AppendStrokeDashArray(polylineChild, currentPen);

    if (n > 2) polylineChild.append_attribute('fill').set_value('none');

    let pointsString = '';
    for (let i = 0; i < n; ++i) {
      pointsString += StringFormat('%d,%d ', points[i].x, points[i].y);
    }
    polylineChild.append_attribute('points').set_value(pointsString);
  }

  public DrawPolygon(n: number, points: Point[]): void {
    if (this.m_penStack.length === 0) throw new Error('SvgDeviceContext pen stack is empty');
    if (this.m_brushStack.length === 0) throw new Error('SvgDeviceContext brush stack is empty');

    const currentPen = this.m_penStack[this.m_penStack.length - 1];
    const currentBrush = this.m_brushStack[this.m_brushStack.length - 1];

    const polygonChild = this.AddChild('polygon');

    if (currentPen.GetWidth() > 0) {
      polygonChild.append_attribute('stroke-width').set_value(StringFormat('%d', currentPen.GetWidth()));
    }
    if (currentPen.HasColor() || !this.UseGlobalStyling()) {
      polygonChild.append_attribute('stroke').set_value(this.GetColor(currentPen.GetColor()));
    }
    if (currentPen.HasOpacity()) {
      polygonChild.append_attribute('stroke-opacity').set_value(StringFormat('%g', currentPen.GetOpacity()));
    }
    this.AppendStrokeLineJoin(polygonChild, currentPen);
    this.AppendStrokeDashArray(polygonChild, currentPen);

    if (currentBrush.HasColor()) {
      polygonChild.append_attribute('fill').set_value(this.GetColor(currentBrush.GetColor()));
    }
    if (currentBrush.HasOpacity()) {
      polygonChild.append_attribute('fill-opacity').set_value(StringFormat('%g', currentBrush.GetOpacity()));
    }

    let pointsString = StringFormat('%d,%d', points[0].x, points[0].y);
    for (let i = 1; i < n; ++i) {
      pointsString += ' ' + StringFormat('%d,%d', points[i].x, points[i].y);
    }
    polygonChild.append_attribute('points').set_value(pointsString);
  }

  public DrawRectangle(x: number, y: number, width: number, height: number): void {
    this.DrawRoundedRectangle(x, y, width, height, 0);
  }

  public DrawRoundedRectangle(x: number, y: number, width: number, height: number, radius: number): void {
    if (this.m_penStack.length === 0) throw new Error('SvgDeviceContext pen stack is empty');
    if (this.m_brushStack.length === 0) throw new Error('SvgDeviceContext brush stack is empty');

    const currentPen = this.m_penStack[this.m_penStack.length - 1];
    const currentBrush = this.m_brushStack[this.m_brushStack.length - 1];

    const rectChild = this.AddChild('rect');

    if (currentPen.GetWidth() > 0) {
      rectChild.append_attribute('stroke-width').set_value(StringFormat('%d', currentPen.GetWidth()));
    }
    if (currentPen.HasColor() || !this.UseGlobalStyling()) {
      rectChild.append_attribute('stroke').set_value(this.GetColor(currentPen.GetColor()));
    }
    if (currentPen.HasOpacity()) {
      rectChild.append_attribute('stroke-opacity').set_value(StringFormat('%g', currentPen.GetOpacity()));
    }

    if (currentBrush.HasColor()) {
      rectChild.append_attribute('fill').set_value(this.GetColor(currentBrush.GetColor()));
    }
    if (currentBrush.HasOpacity()) {
      rectChild.append_attribute('fill-opacity').set_value(StringFormat('%g', currentBrush.GetOpacity()));
    }

    // negative heights or widths are not allowed in SVG
    if (height < 0) {
      height = -height;
      y -= height;
    }
    if (width < 0) {
      width = -width;
      x -= width;
    }

    rectChild.append_attribute('x').set_value(StringFormat('%d', x));
    rectChild.append_attribute('y').set_value(StringFormat('%d', y));
    rectChild.append_attribute('height').set_value(StringFormat('%d', height));
    rectChild.append_attribute('width').set_value(StringFormat('%d', width));
    if (radius !== 0) rectChild.append_attribute('rx').set_value(StringFormat('%d', radius));
  }

  //--------------------------------------------------------------------------
  // Text

  public StartText(x: number, y: number, alignment: number = HORIZONTALALIGNMENT_left): void {
    let anchor = '';

    if (alignment === HORIZONTALALIGNMENT_right) {
      anchor = 'end';
    }
    if (alignment === HORIZONTALALIGNMENT_center) {
      anchor = 'middle';
    }

    this.m_currentNode = this.m_currentNode.append_child('text');
    this.m_svgNodeStack.push(this.m_currentNode);
    if (x) this.m_currentNode.append_attribute('x').set_value(StringFormat('%d', x));
    if (y) this.m_currentNode.append_attribute('y').set_value(StringFormat('%d', y));
    this.m_textY = y;
    // unless dx, dy have a value they don't need to be set
    if (anchor.length > 0) {
      this.m_currentNode.append_attribute('text-anchor').set_value(anchor);
    }
    // font-size seems to be required in <text> in FireFox and also we set it to 0px so space
    // is not added between tspan elements
    this.m_currentNode.append_attribute('font-size').set_value('0px');
    //
    const font = this.m_fontStack[this.m_fontStack.length - 1];
    if (font.GetFaceName().length > 0) {
      this.m_currentNode.append_attribute('font-family').set_value(font.GetFaceName());
    }
    if (font.GetStyle() !== FONTSTYLE_NONE) {
      if (font.GetStyle() === FONTSTYLE_italic) {
        this.m_currentNode.append_attribute('font-style').set_value('italic');
      }
      else if (font.GetStyle() === FONTSTYLE_normal) {
        this.m_currentNode.append_attribute('font-style').set_value('normal');
      }
      else if (font.GetStyle() === FONTSTYLE_oblique) {
        this.m_currentNode.append_attribute('font-style').set_value('oblique');
      }
    }
    if (font.GetWeight() !== FONTWEIGHT_NONE) {
      if (font.GetWeight() === FONTWEIGHT_bold) {
        this.m_currentNode.append_attribute('font-weight').set_value('bold');
      }
    }
  }

  public MoveTextTo(x: number, y: number, alignment: number): void {
    this.m_currentNode.append_attribute('x').set_value(StringFormat('%d', x));
    this.m_currentNode.append_attribute('y').set_value(StringFormat('%d', y));
    this.m_textY = y;
    if (alignment !== HORIZONTALALIGNMENT_NONE) {
      let anchor = 'start';
      if (alignment === HORIZONTALALIGNMENT_right) {
        anchor = 'end';
      }
      if (alignment === HORIZONTALALIGNMENT_center) {
        anchor = 'middle';
      }
      this.m_currentNode.append_attribute('text-anchor').set_value(anchor);
    }
  }

  public MoveTextVerticallyTo(y: number): void {
    // An absolute y starts a new anchored text chunk in SVG. Use a relative shift so
    // superscripts and subscripts remain part of the surrounding horizontal text run.
    this.m_currentNode.append_attribute('dy').set_value(StringFormat('%d', y - this.m_textY));
    this.m_textY = y;
  }

  public EndText(): void {
    this.m_svgNodeStack.pop();
    this.m_currentNode = this.m_svgNodeStack[this.m_svgNodeStack.length - 1];
  }

  // draw text element with optional parameters to specify the bounding box of the text
  // if the bounding box is specified then append a rect child
  public DrawText(text: string, _wtext: number[] = [], x: number = VRV_UNSET, y: number = VRV_UNSET, width: number = VRV_UNSET, height: number = VRV_UNSET): void {
    const font = this.m_fontStack[this.m_fontStack.length - 1];
    if (!font) throw new Error('SvgDeviceContext font stack is empty');

    let svgText = text;

    // Because IE does not support xml:space="preserve", we need to replace the initial
    // space with a non breakable space
    if (svgText.length > 0 && svgText[0] === ' ') {
      // C++ svgText.replace(0, 1, "\xC2\xA0"): UTF-8 bytes for U+00A0 NBSP.
      // TS strings hold UTF-16 code units, so use the single NBSP char directly;
      // '\xC2\xA0' in TS is two Latin-1 chars (mojibake U+00C2 U+00A0).
      svgText = ' ' + svgText.slice(1);
    }
    if (svgText.length > 0 && svgText[svgText.length - 1] === ' ') {
      svgText = svgText.slice(0, -1) + ' ';
    }

    // C++ uses XPath ancestor::*[@font-family][1]; the same first ancestor with
    // a font-family attribute is resolved with an ancestor-chain walk.
    const currentFaceName = this.FindAncestorFontFamily(this.m_currentNode);
    const fontFaceName = font.GetFaceName();

    const textChild = this.AddChild('tspan');
    // Set the @font-family only if it is not the same as in the parent node
    if (fontFaceName.length > 0 && fontFaceName !== currentFaceName) {
      // Special case where we want to specifiy if the woff2 font needs to be included in the output
      if (font.GetSmuflFont() !== SMUFL_NONE) {
        if (font.GetSmuflFont() === SMUFL_FONT_FALLBACK) {
          this.VrvTextFontFallback();
          textChild.append_attribute('font-family').set_value('Leipzig');
        }
        else {
          this.VrvTextFont();
          textChild.append_attribute('font-family').set_value(font.GetFaceName());
        }
        if (font.GetStyle() === FONTSTYLE_normal) {
          textChild.append_attribute('font-style').set_value('normal');
        }
      }
      else {
        textChild.append_attribute('font-family').set_value(font.GetFaceName());
      }
    }
    if (font.GetPointSize() !== 0) {
      textChild.append_attribute('font-size').set_value(StringFormat('%dpx', font.GetPointSize()));
    }
    if (font.GetLetterSpacing() !== 0.0) {
      // C++ %d on a float member truncates
      textChild.append_attribute('letter-spacing').set_value(StringFormat('%dpx', Math.trunc(font.GetLetterSpacing())));
    }
    textChild.text().set(svgText);

    if ((x !== 0) && (y !== 0) && (x !== VRV_UNSET) && (y !== VRV_UNSET) && (width !== 0) && (height !== 0)
      && (width !== VRV_UNSET) && (height !== VRV_UNSET)) {
      const g = this.m_currentNode.parent().parent();
      const rectChild = g.append_child('rect');
      rectChild.append_attribute('class').set_value('sylTextRect');
      rectChild.append_attribute('x').set_value(StringFormat('%d', x));
      rectChild.append_attribute('y').set_value(StringFormat('%d', y));
      rectChild.append_attribute('width').set_value(StringFormat('%d', width));
      rectChild.append_attribute('height').set_value(StringFormat('%d', height));
      rectChild.append_attribute('opacity').set_value('0.0');
    }
    else if ((x !== 0) && (y !== 0) && (x !== VRV_UNSET) && (y !== VRV_UNSET)) {
      textChild.append_attribute('x').set_value(StringFormat('%d', x));
      textChild.append_attribute('y').set_value(StringFormat('%d', y));
    }
  }

  /** First ancestor with a font-family attribute (XPath ancestor::*[@font-family][1]). */
  protected FindAncestorFontFamily(node: xml_node): string {
    const parent = node.parent();
    if (parent.empty()) return '';
    const attr = parent.attribute('font-family');
    if (!attr.empty()) return attr.value();
    return this.FindAncestorFontFamily(parent);
  }

  public DrawRotatedText(_text: string, _x: number, _y: number, _angle: number): void {
    // TODO
  }

  public DrawMusicText(text: number[] | string, x: number, y: number, _setSmuflGlyph = false): void {
    const font = this.m_fontStack[this.m_fontStack.length - 1];
    if (!font) throw new Error('SvgDeviceContext font stack is empty');

    const resources = this.GetResources();
    if (!resources) throw new Error('SvgDeviceContext::DrawMusicText requires resources');

    // remove the `xlink:` prefix for backwards compatibility with older SVG viewers.
    let hrefAttrib = 'href';
    if (!this.m_removeXlink) {
      hrefAttrib = 'xlink:' + hrefAttrib;
    }

    // print chars one by one
    // C++ takes std::u32string; TS callers may pass a JS string (Accid symbol)
    // or a code-point array. Normalize to code points before lookup.
    const codePoints = typeof text === 'string' ? Array.from(text).map((ch) => ch.codePointAt(0)!) : [...text];
    for (const c of codePoints) {
      const glyph = (resources as any).GetGlyph(c) as Glyph | null;
      if (!glyph) {
        continue;
      }

      // Add the glyph to the array for the <defs>
      const id = this.InsertGlyphRef(glyph);

      // Write the char in the SVG
      const useChild = this.AddChild('use');
      useChild.append_attribute(hrefAttrib).set_value(StringFormat('#%s', id));
      let scaleX = font.GetPointSize() / glyph.GetUnitsPerEm() * DEFINITION_FACTOR;
      let scaleY = scaleX;
      if (font.GetWidthToHeightRatio() !== 1.0) scaleX *= font.GetWidthToHeightRatio();
      useChild.append_attribute('transform').set_value(StringFormat('translate(%d, %d) scale(%g, %g)', x, y, scaleX, scaleY));

      // Get the bounds of the char
      // C++ int accumulation: x += advX*pointSize/units truncates per glyph.
      if (glyph.GetHorizAdvX() > 0) {
        x += Math.trunc(glyph.GetHorizAdvX() * font.GetPointSize() / glyph.GetUnitsPerEm());
      }
      else {
        const bb = glyph.GetBoundingBox();
        x += Math.trunc(bb.w * font.GetPointSize() / glyph.GetUnitsPerEm());
      }
    }
  }

  public DrawSpline(_n: number, _points: Point[]): void { /* no-op exactly as C++ */ }

  public DrawGraphicUri(x: number, y: number, width: number, height: number, uri: string): void {
    const image = this.m_currentNode.append_child('image');
    image.append_attribute('xlink:href').set_value(uri);
    image.append_attribute('x').set_value(StringFormat('%d', x));
    image.append_attribute('y').set_value(StringFormat('%d', y));
    image.append_attribute('width').set_value(StringFormat('%d', width));
    image.append_attribute('height').set_value(StringFormat('%d', height));
  }

  public DrawSvgShape(x: number, y: number, _width: number, _height: number, scale: number, svg: xml_node): void {
    this.m_currentNode.append_attribute('transform')
      .set_value(StringFormat('translate(%d, %d) scale(%f, %f)', x, y, scale * DEFINITION_FACTOR, scale * DEFINITION_FACTOR));

    // Remove the ID in the SVG because it might be duplicated and that will not be valid
    this.m_currentNode.remove_attribute('id');

    for (let child = svg.first_child(); !child.empty(); child = child.next_sibling()) {
      this.m_currentNode.append_copy(child);
    }
  }

  public DrawBackgroundImage(_x = 0, _y = 0): void { /* no-op exactly as C++ */ }

  public AddDescription(text: string): void {
    const desc = this.m_currentNode.append_child('desc');
    desc.text().set(text);
  }

  //--------------------------------------------------------------------------
  // Id/class attributes

  public AppendIdAndClass(gId: string, baseClass: string, addedClasses: string, graphicID: GraphicID = GraphicID.PRIMARY): void {
    let baseClassFull = baseClass;

    if (gId.length > 0) {
      if (this.m_html5) {
        this.m_currentNode.append_attribute('data-id').set_value(gId);
      }
      else if (graphicID === GraphicID.PRIMARY) {
        // Don't write ids for HTML5 to avoid id clashes when embedding into
        // an HTML document.
        this.m_currentNode.append_attribute('id').set_value(gId);
      }
    }

    if (this.m_html5) {
      this.m_currentNode.append_attribute('data-class').set_value(baseClassFull);
    }

    if (graphicID !== GraphicID.PRIMARY) {
      const addClass = graphicID === GraphicID.SPANNING ? ' spanning' : ' symbol-ref';
      baseClassFull += ' id-' + gId + addClass;
    }
    if (addedClasses.length > 0) {
      baseClassFull += ' ' + addedClasses;
    }
    this.m_currentNode.append_attribute('class').set_value(baseClassFull);
  }

  public AppendAdditionalAttributes(object: SvgObjectLike): void {
    const attributeNames = this.m_svgAdditionalAttributes.get((object as any).GetClassId());
    if (!attributeNames) return;
    const attributes: ArrayOfStrAttr = [];
    object.GetAttributes(attributes);
    for (const attrName of attributeNames) {
      for (const [key, value] of attributes) {
        if (attrName === key) { // ...and attribute exists in class name, add it to SVG element
          this.m_currentNode.append_attribute('data-' + attrName).set_value(value);
        }
      }
    }
  }

  public UseGlobalStyling(): boolean { return !this.m_mmOutput; }

  public SetMMOutput(mmOutput: boolean): void { this.m_mmOutput = mmOutput; }

  public SetFacsimile(facsimile: boolean): void { this.m_facsimile = facsimile; }
  public GetFacsimile(): boolean { return this.m_facsimile; }

  public SetShowHidden(showHidden: boolean): void { this.m_showHidden = showHidden; }

  public SetUseLiberation(useLiberation: boolean): void { this.m_useLiberation = useLiberation; }

  public SetSvgBoundingBoxes(svgBoundingBoxes: boolean): void { this.m_svgBoundingBoxes = svgBoundingBoxes; }

  public SetSvgContentBoundingBoxes(svgContentBoundingBoxes: boolean): void { this.m_svgContentBoundingBoxes = svgContentBoundingBoxes; }

  public SetSvgViewBox(svgViewBox: boolean): void { this.m_svgViewBox = svgViewBox; }

  public SetHtml5(html5: boolean): void { this.m_html5 = html5; }

  public SetIndent(indent: number): void { this.m_indent = indent; }

  public SetFormatRaw(rawFormat: boolean): void { this.m_formatRaw = rawFormat; }

  public SetRemoveXlink(removeXlink: boolean): void { this.m_removeXlink = removeXlink; }

  public SetCss(css: string): void {
    this.m_css = css;
    // C++ mutates m_css in place through PrefixCssRules(std::string&)
    this.m_css = this.PrefixCssRulesOnString(this.m_css);
  }

  /** Copies additional attributes of defined elements to the SVG, each string in the form "elementName@attribute". */
  public SetAdditionalAttributes(additionalAttributes: string[]): void {
    for (const s of additionalAttributes) {
      const className = s.slice(0, s.indexOf('@')); // parse <element@attribute>, e.g., "note@pname"
      const attributeName = s.slice(s.indexOf('@') + 1);
      const classId = ObjectFactory.GetInstance().GetClassId(className);
      const existing = this.m_svgAdditionalAttributes.get(classId) ?? [];
      existing.push(attributeName);
      this.m_svgAdditionalAttributes.set(classId, existing);
    }
  }

  public SetSmuflTextFont(smuflTextFont: SMUFLTEXTFONT): void { this.m_smuflTextFont = smuflTextFont; }

  //--------------------------------------------------------------------------
  // Output

  public GetColor(color: number): string {
    switch (color) {
      case COLOR_NONE: return 'currentColor';
      case COLOR_BLACK: return '#000000';
      case COLOR_WHITE: return '#FFFFFF';
      case COLOR_RED: return '#FF0000';
      case COLOR_GREEN: return '#00FF00';
      case COLOR_BLUE: return '#0000FF';
      case COLOR_CYAN: return '#00FFFF';
      case COLOR_LIGHT_GREY: return '#777777';
      default: return '#' + (color >>> 0).toString(16).toUpperCase().padStart(6, '0');
    }
  }

  public GetStringSVG(xml_declaration = false): string {
    if (!this.m_committed) this.Commit(xml_declaration);

    return this.m_outdata;
  }

  //--------------------------------------------------------------------------
  // Debug bounding boxes

  protected DrawSvgBoundingBoxRectangle(x: number, y: number, width: number, height: number): void {
    // negative heights or widths are not allowed in SVG
    if (height < 0) {
      height = -height;
      y -= height;
    }
    if (width < 0) {
      width = -width;
      x -= width;
    }

    const rectChild = this.AddChild('rect');
    rectChild.append_attribute('x').set_value(StringFormat('%d', x));
    rectChild.append_attribute('y').set_value(StringFormat('%d', y));
    rectChild.append_attribute('height').set_value(StringFormat('%d', height));
    rectChild.append_attribute('width').set_value(StringFormat('%d', width));

    rectChild.append_attribute('fill').set_value('transparent');
    rectChild.append_attribute('stroke-width').set_value('0');
  }

  protected DrawSvgBoundingBox(object: SvgObjectLike, view: ViewLike | null): void {
    const resources = this.GetResources();
    if (!resources) throw new Error('SvgDeviceContext::DrawSvgBoundingBox requires resources');

    const groupInPage = false;
    const drawAnchors = false;
    const drawContentBB = this.m_svgContentBoundingBoxes;

    if (this.m_svgBoundingBoxes && view) {
      let box: SvgObjectLike = object;
      // For floating elements, get the current bounding box set by System::SetCurrentFloatingPositioner
      if (object.IsFloatingObject && object.IsFloatingObject()) {
        const positioner = object.GetCurrentFloatingPositioner ? object.GetCurrentFloatingPositioner() : null;
        // No bounding box found, ignore the object - this happens when the @staff is missing because the element is
        // never drawn but there is still a EndGraphic call.
        if (!positioner) return;
        box = positioner as unknown as SvgObjectLike;
      }

      const currentNode = this.m_currentNode;
      if (groupInPage) {
        this.m_currentNode = this.m_pageNode;
      }

      this.StartGraphic(object, 'boundingbox', 'bbox-' + object.GetID(), GraphicID.PRIMARY, true);

      if (box.HasSelfBB && box.HasSelfBB()) {
        this.DrawSvgBoundingBoxRectangle(
          (view as any).ToDeviceContextX(object.GetDrawingX() + box.GetSelfX1()),
          (view as any).ToDeviceContextY(object.GetDrawingY() + box.GetSelfY1()),
          (view as any).ToDeviceContextX(object.GetDrawingX() + box.GetSelfX2())
          - (view as any).ToDeviceContextX(object.GetDrawingX() + box.GetSelfX1()),
          (view as any).ToDeviceContextY(object.GetDrawingY() + box.GetSelfY2())
          - (view as any).ToDeviceContextY(object.GetDrawingY() + box.GetSelfY1()));
      }

      if (drawAnchors) {
        // ponytail: anchor debug drawing requires the SMuFL glyph-anchor surface;
        // enable when View passes anchor-capable objects. Upgrade path: port the
        // C++ anchor loop verbatim once GetBoundingBoxGlyph consumers migrate.
      }

      this.EndGraphic(object, null);

      if (groupInPage) {
        this.m_currentNode = this.m_pageNode;
      }

      if (drawContentBB) {
        if (object.HasContentBB && object.HasContentBB()) {
          this.StartGraphic(object, 'content-boundingbox', 'cbbox-' + object.GetID(), GraphicID.PRIMARY, true);
          if (object.HasContentBB()) {
            this.DrawSvgBoundingBoxRectangle(
              (view as any).ToDeviceContextX(object.GetDrawingX() + box.GetContentX1()),
              (view as any).ToDeviceContextY(object.GetDrawingY() + box.GetContentY1()),
              (view as any).ToDeviceContextX(object.GetDrawingX() + box.GetContentX2())
              - (view as any).ToDeviceContextX(object.GetDrawingX() + box.GetContentX1()),
              (view as any).ToDeviceContextY(object.GetDrawingY() + box.GetContentY2())
              - (view as any).ToDeviceContextY(object.GetDrawingY() + box.GetContentY1()));
          }
          this.EndGraphic(object, null);
        }
      }

      if (groupInPage) {
        this.m_currentNode = currentNode;
      }
    }
  }

  //--------------------------------------------------------------------------
  // Internal font flags (called by DrawText)

  protected VrvTextFont(): void { this.m_vrvTextFont = true; }

  protected VrvTextFontFallback(): void { this.m_vrvTextFontFallback = true; }
}
