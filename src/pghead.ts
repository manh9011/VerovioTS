/**
 * Pure TypeScript translation of Verovio's `src/pghead.cpp` / `include/vrv/pghead.h`.
 */
import { RunningElement } from './runningelement.js';
import { Rend } from './rend.js';
import { Lb } from './lb.js';
import { Text } from './text.js';
import { VrvObject, ObjectFactory } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { HorizontalAlignment as HA, VerticalAlignment as VA } from './areaposinterface.js';
import { data_FONTSIZE } from './libmei-att.js';

// Canonical libMEI data.FONTSIZETERM ordinals (attconverter.ts).
const FONTSIZETERM_x_large = 6;
const FONTSIZETERM_small = 3;
import { UTF8to32 } from './vrv.js';
import type { xml_document, xml_node } from './pugixml.js';

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

/** Structural `Doc` contract consumed by `GetTotalHeight`. */
export interface PgHeadDocLike {
  GetDrawingUnit(staffSize: number): number;
  GetOptions(): { m_bottomMarginPgHead: { getValue(): number } };
}

export class PgHead extends RunningElement {
  public constructor() {
    super(ClassId.PGHEAD);
    this.Reset();
    ObjectFactory.GetInstance().Register('pgHead', ClassId.PGHEAD, () => new PgHead());
  }

  public override Reset(): void {
    super.Reset();
  }

  public override GetClassName(): string { return 'pgHead'; }

  public override GetTotalHeight(doc: unknown): number {
    // C++: assert(doc);
    if (!doc) throw new Error('PgHead::GetTotalHeight requires a document.');
    const d = doc as PgHeadDocLike;
    let height = this.GetContentHeight();
    if (height > 0) {
      const unit = d.GetDrawingUnit(100);
      height += d.GetOptions().m_bottomMarginPgHead.getValue() * unit;
    }
    return height;
  }

  /**
   * Canonical C++ generates the header from the MEI header document using two
   * XPath queries. The migrated pugixml layer has no XPath engine, so the
   * equivalent document-order traversal is implemented here; the visited node
   * sets are identical to the C++ queries.
   */
  public GenerateFromMEIHeader(header: xml_document): boolean {
    // XPath 1: //fileDesc/titleStmt/title[text()] — titles with text content,
    // in document order.
    const titles: xml_node[] = [];
    {
      const titleStmt = header.child('meiHead').child('fileDesc').child('titleStmt');
      if (!titleStmt.empty()) {
        for (let n = titleStmt.first_child(); !n.empty(); n = n.next_sibling()) {
          if (n.name() === 'title' && !n.text().empty()) titles.push(n);
        }
      }
    }

    if (titles.length > 0) {
      const titleRend = new Rend();
      titleRend.SetHalign(HA.center);
      titleRend.SetValign(VA.middle);
      titleRend.SetLabel('title');
      for (let i = 0; i < titles.length; ++i) {
        const titleNode = titles[i];
        const rend = new Rend();
        if (i === 0) {
          const fs = new data_FONTSIZE();
          fs.SetTerm(FONTSIZETERM_x_large);
          rend.SetFontsize(fs);
        }
        else {
          titleRend.AddChild(new Lb());
          const fs = new data_FONTSIZE();
          fs.SetTerm(FONTSIZETERM_small);
          rend.SetFontsize(fs);
        }
        const text = new Text();
        text.SetText(UTF8to32(titleNode.text().as_string()));
        rend.SetLang(titleNode.attribute('xml:lang').as_string());
        rend.AddChild(text);
        titleRend.AddChild(rend);
      }
      this.AddChild(titleRend);
    }

    // XPath 2: //fileDesc/titleStmt/composer|arranger|lyricist|
    //           respStmt/persName[contains('lyricist translator composer harmonizer arranger', @role)]
    // Per XPath 1.0 union operator '|', relative paths arranger, lyricist, and respStmt/persName[...]
    // are evaluated relative to the context node (header xml_document root). Since the root only contains
    // <meiHead>, none of the relative branches match. Only //fileDesc/titleStmt/composer matches.
    const persons: xml_node[] = [];
    {
      const titleStmt = header.child('meiHead').child('fileDesc').child('titleStmt');
      if (!titleStmt.empty()) {
        for (let n = titleStmt.first_child(); !n.empty(); n = n.next_sibling()) {
          const name = n.name();
          if (name === 'composer') {
            persons.push(n);
          }
        }
      }
    }

    for (const node of persons) {
      const personRend = new Rend();
      const role = node.attribute('role').as_string();
      const name = node.name();
      if (name === 'lyricist' || role === 'lyricist' || role === 'translator') {
        personRend.SetHalign(HA.left);
      }
      else {
        // composer, harmonizer, and arranger get placed on the right side.
        personRend.SetHalign(HA.right);
      }
      personRend.SetValign(VA.bottom);
      personRend.SetLabel(role);
      const personText = new Text();
      personText.SetText(UTF8to32(node.text().as_string()));
      personRend.SetLang(node.attribute('xml:lang').as_string());
      personRend.AddChild(personText);
      this.AddChild(personRend);
    }

    return true;
  }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPgHead', this);
  }
  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPgHead', this);
  }
  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPgHeadEnd', this);
  }
  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPgHeadEnd', this);
  }
}
