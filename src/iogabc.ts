/**
 * iogabc.ts — GABC input (full port of src-cpp/src/iogabc.cpp, 945 lines).
 *
 * Follows the S-GABC paper grammar notes embedded in the C++ source.
 * C++ `assert` invariants become no-ops (release/WASM parity); `delete`
 * of discarded Ncs is GC-owned. `std::optional` maps to `| undefined`.
 */

import { Input, type DocLike } from './iobase.js';
import { LogDebug, LogWarning } from './vrv.js';
import { DocType, type Doc } from './doc.js';
import { VrvObject } from './object.js';
import { MeasureType, VisibilityType, ClassId, LayoutInformation } from './vrvdef.js';
import { Mdiv } from './mdiv.js';
import { Score } from './score.js';
import { Section } from './section.js';
import { Staff } from './staff.js';
import { StaffGrp } from './staffgrp.js';
import { StaffDef } from './staffdef.js';
import { Layer } from './layer.js';
import { Measure } from './measure.js';
import { Clef } from './clef.js';
import { KeySig } from './keysig.js';
import { KeyAccid } from './keyaccid.js';
import { Custos } from './custos.js';
import { DivLine } from './divline.js';
import { Neume } from './neume.js';
import { Nc } from './nc.js';
import { Strophicus } from './strophicus.js';
import { Quilisma } from './quilisma.js';
import { Oriscus } from './oriscus.js';
import { Liquescent } from './liquescent.js';
import { Episema } from './episema.js';
import { Accid } from './accid.js';
import { Unclear } from './unclear.js';
import { Syllable } from './syllable.js';
import { Syl } from './syl.js';
import { Text } from './text.js';
import {
  PITCHNAME_NONE, PITCHNAME_c, PITCHNAME_d, PITCHNAME_e, PITCHNAME_f,
  PITCHNAME_g, PITCHNAME_a, PITCHNAME_b,
} from './pitchinterface.js';
import type {
  data_PITCHNAME, data_OCTAVE,
} from './pitchinterface.js';
type data_CLEFSHAPE = number;
import type { data_ACCIDENTAL_WRITTEN } from './accid.js';
import {
  ACCIDENTAL_WRITTEN_s, ACCIDENTAL_WRITTEN_f, ACCIDENTAL_WRITTEN_n,
} from './accid.js';

export enum GABCPrefixes { GABC_NO_SPACE, GABC_REMOVE_FIRST_STEM, GABC_NEUMATIC_CUT, GABC_OBLIQUE_LIGATURE }

export type PitchOctaveType = [number, number];

interface GabcDoc extends DocLike {
  Reset(): void;
  SetType(t: DocType): void;
  SetMensuralMusicOnly(v: number): void;
  GetOptions(): any;
  AddChild(x: VrvObject): boolean;
  GetFirstScoreDef(): VrvObject;
  ConvertToPageBasedDoc(): void;
}

const Raw = DocType.Raw;
const Visible = VisibilityType.Visible;
const BOOLEAN_true = 1;
const COMPASSDIRECTION_n = 1;
const COMPASSDIRECTION_s = 3;
const COMPASSDIRECTION_ne = 5;
const COMPASSDIRECTION_se = 7;
const EVENTREL_above = 1;
const EVENTREL_below = 2;
const episemaVis_FORM_h = 1;
const episemaVis_FORM_v = 2;
const curvatureDirection_CURVE_NONE = 0;
const curvatureDirection_CURVE_a = 1;
const curvatureDirection_CURVE_c = 2;
const divLineLog_FORM_caesura = 1;
const divLineLog_FORM_finalis = 2;
const divLineLog_FORM_maior = 3;
const divLineLog_FORM_maxima = 4;
const divLineLog_FORM_minima = 5;
const divLineLog_FORM_virgula = 6;
const NOTATIONTYPE_neume = 5;
const sylLog_WORDPOS_NONE = 0;
const sylLog_WORDPOS_i = 1;
const sylLog_WORDPOS_m = 2;
const sylLog_WORDPOS_s = 3;
const sylLog_WORDPOS_t = 4;
const sylLog_CON_NONE = 0;
const sylLog_CON_d = 2;

type ClefPitchOffsetType = [number, number, number];

const GABC_CLEFS = new Map<string, ClefPitchOffsetType>([
  ['c1', [4, 1, 2]], ['c2', [4, 2, 0]], ['c3', [4, 3, -2]], ['c4', [4, 4, -4]], ['c5', [4, 5, -6]],
  ['f2', [3, 2, -4]], ['f3', [3, 3, -6]], ['f4', [3, 4, -8]], ['f5', [3, 5, -10]],
  ['cb1', [4, 1, 2]], ['cb2', [4, 2, 0]], ['cb3', [4, 3, -2]], ['cb4', [4, 4, -4]],
]);
// C-shape=4, F-shape=3 match C++ CLEFSHAPE_C=4/CLEFSHAPE_F=3 (clef.ts).

const kDiatonicPitchNames = [PITCHNAME_c, PITCHNAME_d, PITCHNAME_e, PITCHNAME_f, PITCHNAME_g, PITCHNAME_a, PITCHNAME_b];

function isSpace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === '\v';
}

export class GABCInput extends Input {
  private m_currentClefPitchOffset = 0;
  private m_layer: Layer | null = null;
  private m_pendingFlatOnClef = false;
  private m_pendingNcType = '';

  constructor(doc: DocLike) { super(doc); }

  private doc(): GabcDoc { return this.m_doc as unknown as GabcDoc; }

  private GetCharAt(s: string, i: number): string {
    if (i < 0 || i >= s.length) return '\0';
    return s[i];
  }

  private FindPrefix(music: string, ref: { value: number }): GABCPrefixes | undefined {
    let next = ref.value;
    let result: GABCPrefixes | undefined = undefined;
    const appendPendingType = (tag: string): void => {
      if (this.m_pendingNcType !== '') this.m_pendingNcType += ' ';
      this.m_pendingNcType += tag;
    };
    // º = U+00BA oblique ligature prefix (UTF-16 single code unit 0xBA).
    if (music.charCodeAt(ref.value) === 0xba) {
      ref.value += 1;
      LogDebug('Prefix found: oblique ligature');
      return GABCPrefixes.GABC_OBLIQUE_LIGATURE;
    }
    switch (this.GetCharAt(music, ref.value)) {
      case '!':
        next++;
        appendPendingType('no-space');
        result = GABCPrefixes.GABC_NO_SPACE;
        break;
      case '@':
        next++;
        LogWarning('GABC \'@\' (remove_first_stem) prefix is deprecated per S-GABC §6.1; '
          + 'the next Nc will be tagged @type="remove-first-stem" for round-trip.');
        appendPendingType('remove-first-stem');
        result = GABCPrefixes.GABC_REMOVE_FIRST_STEM;
        break;
      case '/': {
        next++;
        const char2 = this.GetCharAt(music, next);
        if (char2 === '/') {
          appendPendingType('neumatic-cut-double');
          result = GABCPrefixes.GABC_NEUMATIC_CUT;
        }
        else if (char2 === '0') {
          appendPendingType('neumatic-cut-zero');
          result = GABCPrefixes.GABC_NEUMATIC_CUT;
        }
        else if (char2 === '[') {
          next++; // past '['
          let nx = this.GetCharAt(music, next);
          let negative = false;
          if (nx === '-') { next++; nx = this.GetCharAt(music, next); negative = true; }
          if (nx >= '1' && nx <= '6') {
            let value = nx.charCodeAt(0) - '0'.charCodeAt(0);
            if (negative) value = -value;
            next++; // past digit
            if (this.GetCharAt(music, next) === ']') next++;
            let tag = 'neumatic-cut-n';
            if (value < 0) tag += '-' + String(-value);
            else tag += String(value);
            appendPendingType(tag);
            result = GABCPrefixes.GABC_NEUMATIC_CUT;
          }
        }
        break;
      }
      default: break;
    }
    if (result !== undefined) {
      LogDebug('Prefix found');
      ref.value = next;
    }
    else {
      LogDebug('No prefix found');
    }
    return result;
  }

  private ProcessClef(word: string): boolean {
    const at = word.indexOf('@');
    if (at !== -1) {
      const first = word.substring(0, at);
      const second = word.substring(at + 1);
      if (!GABC_CLEFS.has(first) || !GABC_CLEFS.has(second)) return false;
      this.ProcessClef(second);
      this.ProcessClef(first);
      return true;
    }
    const v = GABC_CLEFS.get(word);
    if (!v) {
      LogDebug('Not a clef');
      return false;
    }
    const clef = new Clef();
    clef.SetLine(v[1]);
    clef.SetShape(v[0] as data_CLEFSHAPE);
    this.m_layer!.AddChild(clef);
    if (word.length >= 2 && word[1] === 'b') this.m_pendingFlatOnClef = true;
    this.m_currentClefPitchOffset = v[2];
    LogDebug('Clef found %s', word);
    return true;
  }

  private ProcessCustos(word: string): number {
    const firstChar = this.GetCharAt(word, 0);
    let processedChars = 0;
    if (firstChar === 'Z') {
      const custos = new Custos();
      custos.SetType('manual');
      this.m_layer!.AddChild(custos);
      processedChars = 1;
    }
    else if (firstChar === 'z') {
      const custos = new Custos();
      processedChars = 1;
      const nextChar = this.GetCharAt(word, 1);
      if (nextChar === '0') {
        custos.SetType('auto-suppressed');
        processedChars = 2;
      }
      else {
        custos.SetType('auto');
      }
      this.m_layer!.AddChild(custos);
    }
    if (processedChars > 0) LogDebug('Custos found %s', word);
    return processedChars;
  }

  private ProcessInput(gabc: string): void {
    interface Token { lyrics: string; music: string; wordBoundaryBefore: boolean }
    const tokens: Token[] = [];
    let i = 0;
    const n = gabc.length;
    let pendingBoundary = true;
    while (i < n) {
      while (i < n && isSpace(gabc[i])) { pendingBoundary = true; i++; }
      if (i >= n) break;
      let lyrics = '';
      while (i < n && gabc[i] !== '(' && !isSpace(gabc[i])) lyrics += gabc[i++];
      let music = '';
      if (i < n && gabc[i] === '(') {
        i++;
        while (i < n && gabc[i] !== ')') music += gabc[i++];
        if (i < n) i++;
      }
      const boundary = pendingBoundary;
      if (lyrics !== '') pendingBoundary = false;
      LogDebug("Processing token: lyrics='%s' music='%s'", lyrics, music);
      tokens.push({ lyrics, music, wordBoundaryBefore: boundary });
    }
    const count = tokens.length;
    for (let ti = 0; ti < count; ti++) {
      let wordpos = sylLog_WORDPOS_NONE;
      let con = sylLog_CON_NONE;
      if (tokens[ti].lyrics !== '') {
        const isFirst = tokens[ti].wordBoundaryBefore;
        let isLast = true;
        for (let j = ti + 1; j < count; j++) {
          if (tokens[j].lyrics !== '') { isLast = tokens[j].wordBoundaryBefore; break; }
        }
        if (isFirst && isLast) wordpos = sylLog_WORDPOS_s;
        else if (isFirst) { wordpos = sylLog_WORDPOS_i; con = sylLog_CON_d; }
        else if (isLast) wordpos = sylLog_WORDPOS_t;
        else { wordpos = sylLog_WORDPOS_m; con = sylLog_CON_d; }
      }
      this.ProcessWord(tokens[ti].lyrics, tokens[ti].music, wordpos, con);
    }
  }

  private ProcessNeume(music: string, syllable: Syllable): void {
    LogDebug('Processing neume');
    let neume: Neume | null = null;
    let previousNC: Nc | null = null;
    let ligateNext = false;
    let lastWasStrophicus = false;
    let strophicusPname: data_PITCHNAME = PITCHNAME_NONE;
    let strophicusOct = 0;
    let currentIndex = 0;
    const extended = !!this.doc().GetOptions()?.m_gabcExtendedSymbols?.GetValue?.();
    while (currentIndex < music.length) {
      let ch = this.GetCharAt(music, currentIndex);
      if (ch === '/') {
        const next = this.GetCharAt(music, currentIndex + 1);
        if (next !== '/' && next !== '0' && next !== '[') {
          if (lastWasStrophicus) {
            const nextIsStrophicus = (((next >= 'a' && next <= 'm')
              && this.GetCharAt(music, currentIndex + 2) === 's') || next === 's');
            if (nextIsStrophicus) { currentIndex++; continue; }
          }
          lastWasStrophicus = false;
          if (neume) syllable.AddChild(neume);
          neume = null;
          currentIndex++;
          continue;
        }
      }
      if (lastWasStrophicus && ch === 's') {
        const strophNC = new Nc();
        strophNC.GetPitchInterface()!.SetPname(strophicusPname);
        strophNC.GetPitchInterface()!.SetOct(strophicusOct);
        strophNC.AddChild(new Strophicus());
        if (!neume) neume = new Neume();
        neume.AddChild(strophNC);
        previousNC = strophNC;
        currentIndex++;
        continue;
      }
      lastWasStrophicus = false;
      if (extended) {
        if (ch === 'r') {
          if (!previousNC) {
            previousNC = new Nc();
            if (!neume) neume = new Neume();
            neume.AddChild(previousNC);
          }
          previousNC.AddChild(new Unclear());
          currentIndex++;
          continue;
        }
        if (ch === '"') {
          if (previousNC) {
            let current = previousNC.HasType() ? previousNC.GetType() : '';
            if (current !== '') current += ' ';
            current += 'clarifying-line';
            previousNC.SetType(current);
          }
          currentIndex++;
          continue;
        }
      }
      const ref = { value: currentIndex };
      const prefixOpt = this.FindPrefix(music, ref);
      currentIndex = ref.value;
      ch = this.GetCharAt(music, currentIndex);
      let diamond = false;
      if (ch >= 'A' && ch <= 'M') {
        ch = String.fromCharCode(ch.charCodeAt(0) - ('A'.charCodeAt(0) - 'a'.charCodeAt(0)));
        diamond = true;
      }
      const pitchOctOpt = this.FindPitch(ch, this.m_currentClefPitchOffset);
      if (pitchOctOpt) {
        currentIndex++;
        const [pname, oct] = pitchOctOpt;
        const currentNC = new Nc();
        currentNC.GetPitchInterface()!.SetPname(pname);
        currentNC.GetPitchInterface()!.SetOct(oct);
        if (diamond) currentNC.SetTilt(COMPASSDIRECTION_se);
        if (prefixOpt !== undefined && prefixOpt === GABCPrefixes.GABC_OBLIQUE_LIGATURE) {
          currentNC.SetTilt(COMPASSDIRECTION_n);
          currentNC.SetLigated(BOOLEAN_true);
          ligateNext = true;
        }
        else if (ligateNext) {
          currentNC.SetLigated(BOOLEAN_true);
          ligateNext = false;
        }
        let nextChar = this.GetCharAt(music, currentIndex);
        if (nextChar === 'x') {
          currentIndex++;
          this.AddAccidental(syllable, ACCIDENTAL_WRITTEN_f, pname, oct);
          continue;
        }
        else if (nextChar === '#') {
          currentIndex++;
          this.AddAccidental(syllable, ACCIDENTAL_WRITTEN_s, pname, oct);
          continue;
        }
        else if (nextChar === 'y') {
          currentIndex++;
          this.AddAccidental(syllable, ACCIDENTAL_WRITTEN_n, pname, oct);
          continue;
        }
        nextChar = this.GetCharAt(music, currentIndex);
        if (nextChar === 's') {
          currentIndex++;
          currentNC.AddChild(new Strophicus());
          lastWasStrophicus = true;
          strophicusPname = pname;
          strophicusOct = oct;
        }
        else if (nextChar === '/' && this.GetCharAt(music, currentIndex + 1) === 's') {
          lastWasStrophicus = true;
          strophicusPname = pname;
          strophicusOct = oct;
          continue;
        }
        nextChar = this.GetCharAt(music, currentIndex);
        if ((nextChar === '~' || nextChar === '>' || nextChar === '<') && neume) {
          syllable.AddChild(neume);
          neume = null;
        }
        if (!neume) neume = new Neume();
        neume.AddChild(currentNC);
        if (this.m_pendingNcType !== '') {
          let current = currentNC.HasType() ? currentNC.GetType() : '';
          if (current !== '') current += ' ';
          current += this.m_pendingNcType;
          currentNC.SetType(current);
          this.m_pendingNcType = '';
        }
        while (currentIndex < music.length) {
          const suffixChars = this.ProcessSuffix(music, currentIndex, currentNC, previousNC);
          if (suffixChars === 0) break;
          currentIndex += suffixChars;
        }
        previousNC = currentNC;
      }
      else {
        const processedChars = this.ProcessBarline(music, currentIndex, this.m_layer!);
        if (processedChars > 0) currentIndex += processedChars;
        else {
          LogDebug('Unknown neume character: %c', ch);
          currentIndex++;
        }
      }
    }
    if (neume) syllable.AddChild(neume);
  }

  private ProcessSuffix(music: string, currentIndex: number, nc: Nc, previousNC: Nc | null): number {
    let processedChars = 0;
    const nextChar = this.GetCharAt(music, currentIndex);
    switch (nextChar) {
      case 'V': {
        processedChars++;
        const aq = !!this.doc().GetOptions()?.m_gabcAquitanianContext?.GetValue?.();
        nc.SetTilt(aq ? COMPASSDIRECTION_ne : COMPASSDIRECTION_n);
        break;
      }
      case 'v':
        processedChars++;
        nc.SetTilt(COMPASSDIRECTION_s);
        break;
      case 's':
        break;
      case 'w':
      case 'W':
        processedChars++;
        nc.AddChild(new Quilisma());
        break;
      case 'o':
      case 'O':
        processedChars++;
        nc.AddChild(new Oriscus());
        break;
      case '~':
        processedChars++;
        this.AddLiquescent(nc, this.InferLiquescentCurve(previousNC, nc));
        break;
      case '>': {
        processedChars++;
        this.AddLiquescent(nc, curvatureDirection_CURVE_c);
        const nextChar2 = this.GetCharAt(music, currentIndex + processedChars);
        // C++ checks `nextChar != 'v'` where nextChar is the switch char '>'
        // (always true); kept verbatim via void.
        void nextChar;
        if (nextChar2 !== 'V' && !nc.GetTilt()) nc.SetType('cephalicus');
        break;
      }
      case '<':
        processedChars++;
        this.AddLiquescent(nc, curvatureDirection_CURVE_a);
        nc.SetType('epiphonus');
        break;
      case '\'':
        processedChars++;
        this.AddEpisema(nc, episemaVis_FORM_v, EVENTREL_below);
        break;
      case '_':
        processedChars++;
        this.AddEpisema(nc, episemaVis_FORM_h, EVENTREL_above);
        break;
      case '.': {
        processedChars++;
        const nx = this.GetCharAt(music, currentIndex + processedChars);
        if (nx === '.') { processedChars++; (nc.GetDurationInterface()! as unknown as { SetDots(v: number): void }).SetDots(2); }
        else (nc.GetDurationInterface()! as unknown as { SetDots(v: number): void }).SetDots(1);
        break;
      }
      default: break;
    }
    return processedChars;
  }

  private ProcessWord(lyrics: string, music: string, wordpos: number, con: number): void {
    const syllable = new Syllable();
    this.m_layer!.AddChild(syllable);
    if (lyrics !== '') {
      LogDebug('Processing lyrics: %s', lyrics);
      const syl = new Syl();
      if (wordpos !== sylLog_WORDPOS_NONE) syl.SetWordpos(wordpos);
      if (con !== sylLog_CON_NONE) syl.SetCon(con);
      syllable.AddChild(syl);
      const t = new Text();
      t.SetText(Array.from(lyrics).map((c) => c.codePointAt(0)!));
      syl.AddChild(t);
    }
    if (music !== '') {
      LogDebug('Processing music: %s', music);
      const isClef = this.ProcessClef(music);
      if (!isClef) {
        const custosChars = this.ProcessCustos(music);
        if (custosChars === 0) this.ProcessNeume(music, syllable);
      }
    }
  }

  public override Import(gabc: string): boolean {
    this.m_currentClefPitchOffset = 0;
    this.m_pendingFlatOnClef = false;
    this.m_pendingNcType = '';
    const d = this.doc();
    d.Reset();
    d.SetType(Raw);
    d.SetMensuralMusicOnly(BOOLEAN_true);
    const mdiv = new Mdiv();
    mdiv.SetVisibility(Visible);
    d.AddChild(mdiv);
    const score = new Score();
    mdiv.AddChild(score);
    const section = new Section();
    score.AddChild(section);
    const staff = new Staff(1);
    const measure = new Measure(MeasureType.UNMEASURED, 1);
    this.m_layer = new Layer();
    this.m_layer.SetN(1);
    staff.AddChild(this.m_layer);
    measure.AddChild(staff);
    section.AddChild(measure);
    this.ProcessInput(gabc);
    const staffGrp = new StaffGrp();
    const staffDef = new StaffDef();
    staffDef.SetNotationtype(NOTATIONTYPE_neume);
    staffDef.SetN(1);
    staffDef.SetLines(d.GetOptions()?.m_gabcStaffLines?.GetValue?.() ?? 4);
    if (this.m_pendingFlatOnClef) {
      const keySig = new KeySig();
      const keyAccid = new KeyAccid();
      keyAccid.SetAccid(ACCIDENTAL_WRITTEN_f);
      keyAccid.SetPname(PITCHNAME_b);
      keySig.AddChild(keyAccid);
      staffDef.AddChild(keySig);
    }
    staffGrp.AddChild(staffDef);
    (d.GetFirstScoreDef() as unknown as VrvObject).AddChild(staffGrp);
    d.ConvertToPageBasedDoc();
    return true;
  }

  private AddAccidental(syllable: Syllable, accid: data_ACCIDENTAL_WRITTEN, pname: data_PITCHNAME, oct: data_OCTAVE): void {
    LogDebug('Accidental found: %i', accid);
    const accidElem = new Accid();
    accidElem.SetAccid(accid);
    accidElem.SetPloc(pname);
    accidElem.SetOloc(oct);
    syllable.AddChild(accidElem);
  }

  private AddEpisema(nc: Nc, form: number, place: number): void {
    const episema = new Episema();
    episema.SetForm(form);
    episema.SetPlace(place);
    nc.AddChild(episema);
  }

  private AddLiquescent(nc: Nc, curve: number): void {
    const liquescent = new Liquescent();
    nc.AddChild(liquescent);
    nc.SetCurve(curve);
  }

  private FindPitch(ch: string, clefPitchOffset: number): PitchOctaveType | undefined {
    if (ch < 'a' || ch > 'p' || ch === 'o') return undefined;
    const c2BaseDiatonicIndexForA = 3 * 7 + 2;
    let letterIndex = ch.charCodeAt(0) - 'a'.charCodeAt(0);
    if (ch === 'p') letterIndex = 14;
    const absoluteDiatonicIndex = c2BaseDiatonicIndexForA + letterIndex + clefPitchOffset;
    return this.MakePitchFromDiatonicIndex(absoluteDiatonicIndex);
  }

  private MakePitchFromDiatonicIndex(absoluteDiatonicIndex: number): PitchOctaveType {
    let octave = Math.floor(absoluteDiatonicIndex / 7);
    let pitchClass = absoluteDiatonicIndex % 7;
    if (pitchClass < 0) { pitchClass += 7; octave -= 1; }
    return [kDiatonicPitchNames[pitchClass], octave];
  }

  private PitchToDiatonicNumber(pname: data_PITCHNAME, oct: number): number {
    let diatonic = 0;
    switch (pname) {
      case PITCHNAME_c: diatonic = 0; break;
      case PITCHNAME_d: diatonic = 1; break;
      case PITCHNAME_e: diatonic = 2; break;
      case PITCHNAME_f: diatonic = 3; break;
      case PITCHNAME_g: diatonic = 4; break;
      case PITCHNAME_a: diatonic = 5; break;
      case PITCHNAME_b: diatonic = 6; break;
      default: diatonic = 0; break;
    }
    return oct * 7 + diatonic;
  }

  private InferLiquescentCurve(previousNC: Nc | null, currentNC: Nc | null): number {
    if (!previousNC || !currentNC) return curvatureDirection_CURVE_NONE;
    const prevPitch = this.PitchToDiatonicNumber(
      previousNC.GetPitchInterface()!.GetPname(), previousNC.GetPitchInterface()!.GetOct());
    const currPitch = this.PitchToDiatonicNumber(
      currentNC.GetPitchInterface()!.GetPname(), currentNC.GetPitchInterface()!.GetOct());
    if (currPitch > prevPitch) return curvatureDirection_CURVE_a;
    if (currPitch < prevPitch) return curvatureDirection_CURVE_c;
    return curvatureDirection_CURVE_NONE;
  }

  private ProcessBarline(music: string, currentIndex: number, layer: Layer): number {
    let processedChars = 0;
    const ch = this.GetCharAt(music, currentIndex);
    const next = this.GetCharAt(music, currentIndex + 1);
    let form: number | undefined = undefined;
    if (ch === ':' && next === ':') { form = divLineLog_FORM_finalis; processedChars = 2; }
    else if (ch === ':') { form = divLineLog_FORM_maior; processedChars = 1; }
    else if (ch === ';') { form = divLineLog_FORM_minima; processedChars = 1; }
    else if (ch === ',') { form = divLineLog_FORM_virgula; processedChars = 1; }
    if (form !== undefined) {
      LogDebug('Divisio found: %c (form=%d)', ch, form);
      const divLine = new DivLine();
      divLine.SetForm(form);
      layer.AddChild(divLine);
    }
    return processedChars;
  }
}

export { GABCPrefixes as GABCPrefixesAlias };
