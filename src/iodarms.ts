/**
 * iodarms.ts — DarmsInput port of src-cpp/src/iodarms.cpp (533 lines).
 * Real domain objects so LoadData produces a renderable doc.
 * (WASM builds ship NO_DARMS_SUPPORT; no WASM ground truth. C++ is the spec.)
 */
import { Input, type DocLike } from './iobase.js';
import { LogDebug, LogWarning } from './vrv.js';
import { DocType } from './doc.js';
import { VrvObject } from './object.js';
import { ClassId, MeasureType, VisibilityType } from './vrvdef.js';
import { Mdiv } from './mdiv.js';
import { Score } from './score.js';
import { Section } from './section.js';
import { Staff } from './staff.js';
import { StaffGrp } from './staffgrp.js';
import { StaffDef } from './staffdef.js';
import { Layer } from './layer.js';
import { Measure } from './measure.js';
import { Note } from './note.js';
import { Rest } from './rest.js';
import { Accid } from './accid.js';
import { Clef } from './clef.js';
import { KeySig } from './keysig.js';
import { Mensur } from './mensur.js';
import { Tie } from './tie.js';
import { PITCHNAME_c, PITCHNAME_d, PITCHNAME_e, PITCHNAME_f, PITCHNAME_g, PITCHNAME_a, PITCHNAME_b } from './pitchinterface.js';
import { ACCIDENTAL_WRITTEN_NONE, ACCIDENTAL_WRITTEN_s, ACCIDENTAL_WRITTEN_f, ACCIDENTAL_WRITTEN_n } from './accid.js';

export const ASCII_NUMBER_OFFSET = 0x30;
// data_DURATION: DURATION_long=0, breve=1, 1=2 ... (durationinterface parity).
const DURATION_long = 0;
const DURATION_breve = 1;
const DURATION_1 = 2;
const DURATION_2 = 3;
const DURATION_4 = 4;
const DURATION_8 = 5;
const DURATION_16 = 6;
const DURATION_32 = 7;
const DURATION_64 = 8;
const DURATION_128 = 9;
const DURATION_256 = 10;
const DURATION_NONE = -2;
const CLEFSHAPE_G = 1;
const CLEFSHAPE_F = 3;
const CLEFSHAPE_C = 4;
const MENSURATIONSIGN_C = 1;
const MENSURATIONSIGN_O = 2;
const Raw = DocType.Raw;
const Visible = VisibilityType.Visible;

interface DarmsDoc extends DocLike {
  Reset(): void;
  SetType(t: DocType): void;
  AddChild(x: VrvObject): boolean;
  GetFirstScoreDef(): VrvObject;
  ConvertToPageBasedDoc(): void;
}

export class DarmsInput extends Input {
  private m_staff: Staff | null = null;
  private m_measure: Measure | null = null;
  private m_layer: Layer | null = null;
  private m_current_tie: Tie | null = null;
  private m_clef_offset = 0;
  private m_antique_notation = false;

  static readonly PitchMap: ReadonlyArray<{ oct: number; pitch: number }> = (() => {
    const names = [PITCHNAME_c, PITCHNAME_d, PITCHNAME_e, PITCHNAME_f, PITCHNAME_g, PITCHNAME_a, PITCHNAME_b];
    const map: { oct: number; pitch: number }[] = [];
    for (let oct = 1; oct <= 8; oct++) for (const pitch of names) map.push({ oct, pitch });
    map.push({ oct: 8, pitch: PITCHNAME_b }, { oct: 8, pitch: PITCHNAME_b }, { oct: 8, pitch: PITCHNAME_b },
      { oct: 8, pitch: PITCHNAME_b }, { oct: 8, pitch: PITCHNAME_b }, { oct: 8, pitch: PITCHNAME_b },
      { oct: 8, pitch: PITCHNAME_b });
    return map;
  })();

  constructor(doc: DarmsDoc) {
    super(doc);
  }

  public getAntiqueNotation(): boolean { return this.m_antique_notation; }

  private layer(): Layer {
    if (!this.m_layer) throw new Error('DARMS layer is not initialized');
    return this.m_layer;
  }

  private UnrollKeysig(quantity: number, alter: string): void {
    if (quantity === 0) quantity++;
    const accid = alter === '-' ? ACCIDENTAL_WRITTEN_f : ACCIDENTAL_WRITTEN_s;
    const k = new KeySig();
    k.SetAttribute(true);
    k.SetSig([quantity, accid]);
    this.layer().AddChild(k);
  }

  private parseMeter(pos: number, data: string): number {
    const meter = new Mensur();
    pos++;
    if (data[pos] === 'C') {
      meter.SetSign(MENSURATIONSIGN_C);
      if (data[pos + 1] === '/') { pos++; meter.SetSlash(1); }
      pos++;
    }
    else if (data[pos] === 'O') {
      if (data[pos + 1] === '/') { pos++; LogWarning('DARMS import: O/ not supported'); }
      meter.SetSign(MENSURATIONSIGN_O);
      pos++;
    }
    if (this.isDigit(data[pos] ?? '')) {
      let n1 = data.charCodeAt(pos) - ASCII_NUMBER_OFFSET;
      if (this.isDigit(data[pos + 1] ?? '')) { pos++; n1 = n1 * 10 + data.charCodeAt(pos) - ASCII_NUMBER_OFFSET; }
      meter.SetNumbase(n1);
      if (data[pos + 1] !== ':' && data[pos + 1] !== '-') { pos++; meter.SetNumbase(1); }
      else {
        pos++;
        if (data[pos] === '-') LogWarning("DARMS import: Time signature numbers should be divided with ':'.");
        n1 = data.charCodeAt(++pos) - ASCII_NUMBER_OFFSET;
        if (this.isDigit(data[pos + 1] ?? '')) { pos++; n1 = n1 * 10 + data.charCodeAt(pos) - ASCII_NUMBER_OFFSET; }
        meter.SetNumbase(n1);
      }
      LogDebug('DARMS import: Meter is: %i %i', meter.GetNumbase(), meter.GetNumbase());
    }
    this.layer().AddChild(meter);
    return pos;
  }

  private do_globalSpec(pos: number, data: string): number {
    const digit = data[++pos];
    let quantity = 0;
    switch (digit) {
      case 'I':
        if (!this.isDigit(data[++pos] ?? '')) LogWarning("DARMS import: Expected number after 'I'");
        break;
      case 'K':
        if (this.isDigit(data[pos + 1] ?? '')) { pos++; quantity = data.charCodeAt(pos) - ASCII_NUMBER_OFFSET; }
        pos++;
        if (data[pos] === '-' || data[pos] === '#') this.UnrollKeysig(quantity, data[pos]);
        else LogWarning("DARMS import: Invalid char for 'K': %c", data[pos]);
        break;
      case 'M': pos = this.parseMeter(pos, data); break;
      case 'N':
        if (!this.isDigit(data[++pos] ?? '') && data[pos] !== 'R') LogWarning("DARMS import: Expected number or 'R' after N");
        else if (data[pos] === String.fromCharCode(0x07 + ASCII_NUMBER_OFFSET)) this.m_antique_notation = true;
        break;
      default: break;
    }
    return pos;
  }

  private do_Clef(pos: number, data: string): number {
    const position = data.charCodeAt(pos) - ASCII_NUMBER_OFFSET;
    pos = pos + 2;
    const mclef = new Clef();
    if (data[pos] === 'C') {
      mclef.SetShape(CLEFSHAPE_C);
      switch (position) {
        case 1: mclef.SetLine(1); break;
        case 3: mclef.SetLine(2); break;
        case 5: mclef.SetLine(3); break;
        case 7: mclef.SetLine(4); break;
        default: LogWarning('DARMS import: Invalid C clef on line %i', position); break;
      }
      this.m_clef_offset = 21 - position;
    }
    else if (data[pos] === 'G') {
      mclef.SetShape(CLEFSHAPE_G);
      switch (position) {
        case 1: mclef.SetLine(1); break;
        case 3: mclef.SetLine(2); break;
        default: LogWarning('DARMS import: Invalid G clef on line %i', position); break;
      }
      this.m_clef_offset = 25 - position;
    }
    else if (data[pos] === 'F') {
      mclef.SetShape(CLEFSHAPE_F);
      switch (position) {
        case 3: mclef.SetLine(3); break;
        case 5: mclef.SetLine(4); break;
        case 7: mclef.SetLine(5); break;
        default: LogWarning('DARMS import: Invalid F clef on line %i', position); break;
      }
      this.m_clef_offset = 15 - position;
    }
    else {
      LogWarning('DARMS import: Invalid clef specification: %c', data[pos]);
      return 0;
    }
    this.layer().AddChild(mclef);
    return pos;
  }

  private do_Note(pos: number, data: string, rest: boolean): number {
    let position = 0;
    let accidental: number = ACCIDENTAL_WRITTEN_NONE;
    let duration: number = DURATION_NONE;
    let dot = 0;
    let tie = 0;
    if (data[pos] === '-') {
      if (!this.isDigit(data[pos + 1] ?? '')) return 0;
      position = -(data.charCodeAt(++pos) - ASCII_NUMBER_OFFSET);
    }
    else {
      if (!this.isDigit(data[pos] ?? '') && data[pos] !== 'R') return 0;
      position = data.charCodeAt(pos) - ASCII_NUMBER_OFFSET;
      if (this.isDigit(data[pos + 1] ?? '')) { pos++; position = position * 10 + data.charCodeAt(pos) - ASCII_NUMBER_OFFSET; }
    }
    if (data[pos + 1] === '-') { accidental = ACCIDENTAL_WRITTEN_f; pos++; }
    else if (data[pos + 1] === '#') { accidental = ACCIDENTAL_WRITTEN_s; pos++; }
    else if (data[pos + 1] === '*') { accidental = ACCIDENTAL_WRITTEN_n; pos++; }
    switch (data[++pos]) {
      case 'W':
        duration = DURATION_1;
        if (data[pos + 1] === 'W') { duration = DURATION_breve; pos++; if (data[pos + 1] === 'W') { pos++; duration = DURATION_long; } }
        break;
      case 'H': duration = DURATION_2; break;
      case 'Q': duration = DURATION_4; break;
      case 'E': duration = DURATION_8; break;
      case 'S': duration = DURATION_16; break;
      case 'T': duration = DURATION_32; break;
      case 'X': duration = DURATION_64; break;
      case 'Y': duration = DURATION_128; break;
      case 'Z': duration = DURATION_256; break;
      default: LogWarning('DARMS import: Unknown note duration: %c', data[pos]); return 0;
    }
    if (data[pos + 1] === '.') { pos++; dot = 1; }
    if (data[pos + 1] === 'L' || data[pos + 1] === 'J') { pos++; tie = 1; }
    if (rest) {
      const r = new Rest();
      r.SetDur(duration);
      r.SetDurGes(DURATION_8);
      r.SetDots(dot);
      this.layer().AddChild(r);
    }
    else {
      // C++ `sizeof(PitchMap)` bug parity: byte size, not element count.
      if ((position + this.m_clef_offset) > DarmsInput.PitchMap.length * 8) position = 0;
      const note = new Note();
      note.SetDur(duration);
      note.SetDurGes(DURATION_8);
      if (accidental !== ACCIDENTAL_WRITTEN_NONE) {
        const accid = new Accid();
        accid.SetAccid(accidental);
        note.AddChild(accid);
      }
      note.SetOct(DarmsInput.PitchMap[position + this.m_clef_offset].oct);
      note.SetPname(DarmsInput.PitchMap[position + this.m_clef_offset].pitch);
      note.SetDots(dot);
      this.layer().AddChild(note);
      if (tie) {
        if (this.m_current_tie) this.m_current_tie.SetEnd(note);
        this.m_current_tie = new Tie();
        this.m_current_tie.SetStart(note);
      }
      else if (this.m_current_tie) {
        this.m_current_tie.SetEnd(note);
        this.m_current_tie = null;
      }
    }
    return pos;
  }

  public override Import(dataStr: string): boolean {
    const doc = this.m_doc as unknown as DarmsDoc;
    let pos = 0;
    const len = dataStr.length;
    doc.Reset();
    doc.SetType(Raw);
    const mdiv = new Mdiv();
    mdiv.SetVisibility(Visible);
    doc.AddChild(mdiv);
    const score = new Score();
    mdiv.AddChild(score);
    const section = new Section();
    score.AddChild(section);
    this.m_staff = new Staff(1);
    this.m_measure = new Measure(MeasureType.MEASURED, 1);
    this.m_layer = new Layer();
    this.m_layer.SetN(1);
    this.m_current_tie = null;
    this.m_staff.AddChild(this.m_layer);
    this.m_measure.AddChild(this.m_staff);
    section.AddChild(this.m_measure);
    while (pos < len) {
      const c = dataStr[pos];
      let res = 0;
      if (c === '!') {
        LogDebug('DARMS import: Global spec. at %i', pos);
        res = this.do_globalSpec(pos, dataStr);
        if (res) pos = res;
      }
      else if (this.isDigit(c) || c === '-') {
        if (dataStr[pos + 1] === '!') { res = this.do_Clef(pos, dataStr); if (res) pos = res; }
        else { res = this.do_Note(pos, dataStr, false); if (res) pos = res; }
      }
      else if (c === 'R') { res = this.do_Note(pos, dataStr, true); if (res) pos = res; }
      pos++;
    }
    const staffGrp = new StaffGrp();
    const staffDef = new StaffDef();
    staffDef.SetN(1);
    staffGrp.AddChild(staffDef);
    (doc.GetFirstScoreDef() as unknown as VrvObject).AddChild(staffGrp);
    doc.ConvertToPageBasedDoc();
    return true;
  }

  private isDigit(c: string): boolean { return c.length === 1 && c >= '0' && c <= '9'; }
}
