/**
 * Pure TypeScript translation of libmei/dist/atts_externalsymbols.cpp.
 * Preserves generated libmei XML read/write order, defaults, presence
 * semantics, converter dispatch and instantiable wrappers.
 */

import { Att } from './att';
import { xml_node } from './pugixml';
import { data_HEXNUM } from './libmei-att';

/** Attributes identifying the authority and URI for an external glyph symbol. */
export abstract class AttExtSymAuth extends Att {
  protected m_glyphAuth = '';
  protected m_glyphUri = '';

  constructor() {
    super();
    this.ResetExtSymAuth();
  }

  ResetExtSymAuth(): void {
    this.m_glyphAuth = '';
    this.m_glyphUri = '';
  }

  ReadExtSymAuth(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;

    const glyphAuth = element.attribute('glyph.auth');
    if (!glyphAuth.empty()) {
      this.SetGlyphAuth(this.StrToStr(glyphAuth.value()));
      if (removeAttr) element.remove_attribute('glyph.auth');
      hasAttribute = true;
    }

    const glyphUri = element.attribute('glyph.uri');
    if (!glyphUri.empty()) {
      this.SetGlyphUri(this.StrToStr(glyphUri.value()));
      if (removeAttr) element.remove_attribute('glyph.uri');
      hasAttribute = true;
    }

    return hasAttribute;
  }

  WriteExtSymAuth(element: xml_node): boolean {
    let wroteAttribute = false;

    if (this.HasGlyphAuth()) {
      element.append_attribute('glyph.auth').set_value(this.StrToStr(this.GetGlyphAuth()));
      wroteAttribute = true;
    }
    if (this.HasGlyphUri()) {
      element.append_attribute('glyph.uri').set_value(this.StrToStr(this.GetGlyphUri()));
      wroteAttribute = true;
    }

    return wroteAttribute;
  }

  SetGlyphAuth(glyphAuth: string): void { this.m_glyphAuth = glyphAuth; }
  GetGlyphAuth(): string { return this.m_glyphAuth; }
  HasGlyphAuth(): boolean { return this.m_glyphAuth !== ''; }

  SetGlyphUri(glyphUri: string): void { this.m_glyphUri = glyphUri; }
  GetGlyphUri(): string { return this.m_glyphUri; }
  HasGlyphUri(): boolean { return this.m_glyphUri !== ''; }
}

/** Instantiable generated-libmei wrapper. */
export class InstExtSymAuth extends AttExtSymAuth {}

/** Attributes naming an external glyph and/or giving its hexadecimal code point. */
export abstract class AttExtSymNames extends Att {
  protected m_glyphName = '';
  protected m_glyphNum: data_HEXNUM = 0;

  constructor() {
    super();
    this.ResetExtSymNames();
  }

  ResetExtSymNames(): void {
    this.m_glyphName = '';
    this.m_glyphNum = 0;
  }

  ReadExtSymNames(element: xml_node, removeAttr = true): boolean {
    let hasAttribute = false;

    const glyphName = element.attribute('glyph.name');
    if (!glyphName.empty()) {
      this.SetGlyphName(this.StrToStr(glyphName.value()));
      if (removeAttr) element.remove_attribute('glyph.name');
      hasAttribute = true;
    }

    const glyphNum = element.attribute('glyph.num');
    if (!glyphNum.empty()) {
      this.SetGlyphNum(this.StrToHexnum(glyphNum.value()));
      if (removeAttr) element.remove_attribute('glyph.num');
      hasAttribute = true;
    }

    return hasAttribute;
  }

  WriteExtSymNames(element: xml_node): boolean {
    let wroteAttribute = false;

    if (this.HasGlyphName()) {
      element.append_attribute('glyph.name').set_value(this.StrToStr(this.GetGlyphName()));
      wroteAttribute = true;
    }
    if (this.HasGlyphNum()) {
      element.append_attribute('glyph.num').set_value(this.HexnumToStr(this.GetGlyphNum()));
      wroteAttribute = true;
    }

    return wroteAttribute;
  }

  SetGlyphName(glyphName: string): void { this.m_glyphName = glyphName; }
  GetGlyphName(): string { return this.m_glyphName; }
  HasGlyphName(): boolean { return this.m_glyphName !== ''; }

  SetGlyphNum(glyphNum: data_HEXNUM): void { this.m_glyphNum = glyphNum; }
  GetGlyphNum(): data_HEXNUM { return this.m_glyphNum; }
  HasGlyphNum(): boolean { return this.m_glyphNum !== 0; }
}

/** Instantiable generated-libmei wrapper. */
export class InstExtSymNames extends AttExtSymNames {}
