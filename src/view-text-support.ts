/**
 * Shared constants and helpers for the View text slice (view_text.cpp port).
 * Ordinals are canonical libMEI/Verovio values.
 */
import { UNICODE_UNDERTIE } from './vrvdef';

// data.ENCLOSURE (atttypes.h:630-636)
export const ENCLOSURE_NONE = 0;
export const ENCLOSURE_paren = 1;
export const ENCLOSURE_brack = 2;
export const ENCLOSURE_box = 3;
export const ENCLOSURE_none = 4;

// data.TEXTRENDITION (atttypes.h:1806-1836) — sub/sup/box used by view_text.cpp
export const TEXTRENDITION_sub = 20;
export const TEXTRENDITION_sup = 21;
export const TEXTRENDITION_box = 9;

// FontSizeType (attalternates.h:29): NONE=0, fontSizeNumeric=1, term=2, percent=3
export const FONTSIZE_fontSizeNumeric = 1;
export const FONTSIZE_term = 2;
export const FONTSIZE_percent = 3;

// data.FONTSTYLE / data.FONTWEIGHT (attconverter FONTSTYLE_NONE=0, italic=1, normal=2...; FONTWEIGHT_NONE=0, bold=1)
export const FONTSTYLE_NONE = 0;
export const FONTSTYLE_normal = 2;
export const FONTWEIGHT_NONE = 0;

// option_ELISION (options.h:66-71); unicode is UNICODE_UNDERTIE '\u203F'
export const ELISION_unicode = UNICODE_UNDERTIE.codePointAt(0) as number;
export const UNICODE_UNDERTIE_CP = UNICODE_UNDERTIE.codePointAt(0) as number;

// SMUFL figbass accidentals used by DrawHarmString
export const SMUFL_EA63_figbassDoubleFlat = 0xEA63;
export const SMUFL_EA64_figbassFlat = 0xEA64;
export const SMUFL_EA65_figbassNatural = 0xEA65;
export const SMUFL_EA66_figbassSharp = 0xEA66;
export const SMUFL_EA67_figbassDoubleSharp = 0xEA67;

// std::u32string == comparison over number[] (code points)
export function codePointsEqual(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
