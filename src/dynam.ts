import { Functor } from './functor.js';
import { TimeSpanningInterface } from './timeinterface.js';
import { TextDirInterface } from './textdirinterface.js';
import { TextListInterface } from './object.js';
import { ClassId, FunctorCode, ArrayOfStringDynamTypePairs } from './vrvdef.js';
import { VrvObject, ObjectFactory } from './object.js';
import { ControlElement } from './controlelement.js';
import {
  SMUFL_E26A_accidentalParensLeft,
  SMUFL_E26B_accidentalParensRight,
  SMUFL_E26C_accidentalBracketLeft,
  SMUFL_E26D_accidentalBracketRight,
  SMUFL_E520_dynamicPiano,
  SMUFL_E521_dynamicMezzo,
  SMUFL_E522_dynamicForte,
  SMUFL_E523_dynamicRinforzando,
  SMUFL_E524_dynamicSforzando,
  SMUFL_E525_dynamicZ,
  SMUFL_E526_dynamicNiente,
  SMUFL_E527_dynamicPPPPPP,
  SMUFL_E528_dynamicPPPPP,
  SMUFL_E529_dynamicPPPP,
  SMUFL_E52A_dynamicPPP,
  SMUFL_E52B_dynamicPP,
  SMUFL_E52C_dynamicMP,
  SMUFL_E52D_dynamicMF,
  SMUFL_E52E_dynamicPF,
  SMUFL_E52F_dynamicFF,
  SMUFL_E530_dynamicFFF,
  SMUFL_E531_dynamicFFFF,
  SMUFL_E532_dynamicFFFFF,
  SMUFL_E533_dynamicFFFFFF,
  SMUFL_E534_dynamicFortePiano,
  SMUFL_E535_dynamicForzando,
  SMUFL_E536_dynamicSforzando1,
  SMUFL_E537_dynamicSforzandoPiano,
  SMUFL_E538_dynamicSforzandoPianissimo,
  SMUFL_E539_dynamicSforzato,
  SMUFL_E53A_dynamicSforzatoPiano,
  SMUFL_E53B_dynamicSforzatoFF,
  SMUFL_E53C_dynamicRinforzando1,
  SMUFL_E53D_dynamicRinforzando2,
} from './smufl.js';

/** MEI data.BOOLEAN values used by AttExtender. */
export const BOOLEAN_NONE = 0;
export const BOOLEAN_true = 1;
export const BOOLEAN_false = 2;

/** MEI data.ENCLOSURE values used by AttEnclosingChars. */
export const ENCLOSURE_NONE = 0;
export const ENCLOSURE_paren = 1;
export const ENCLOSURE_brack = 2;

/** AttClassId values from the canonical libmei generated enum. */
const ATT_MIDIVALUE = 81;
const ATT_MIDIVALUE2 = 82;
const ATT_ENCLOSINGCHARS = 129;
const ATT_EXTENDER = 132;
const ATT_LINERENDBASE = 151;
const ATT_VERTICALGROUP = 227;

const MEI_UNSET = -1;

const dynamChars = ['p', 'm', 'f', 'r', 's', 'z', 'n'];
const dynamSmufl = [
  SMUFL_E520_dynamicPiano,
  SMUFL_E521_dynamicMezzo,
  SMUFL_E522_dynamicForte,
  SMUFL_E523_dynamicRinforzando,
  SMUFL_E524_dynamicSforzando,
  SMUFL_E525_dynamicZ,
  SMUFL_E526_dynamicNiente,
];

const compoundGlyphs = new Map<string, number>([
  ['p', SMUFL_E520_dynamicPiano],
  ['m', SMUFL_E521_dynamicMezzo],
  ['f', SMUFL_E522_dynamicForte],
  ['r', SMUFL_E523_dynamicRinforzando],
  ['s', SMUFL_E524_dynamicSforzando],
  ['z', SMUFL_E525_dynamicZ],
  ['n', SMUFL_E526_dynamicNiente],
  ['pppppp', SMUFL_E527_dynamicPPPPPP],
  ['ppppp', SMUFL_E528_dynamicPPPPP],
  ['pppp', SMUFL_E529_dynamicPPPP],
  ['ppp', SMUFL_E52A_dynamicPPP],
  ['pp', SMUFL_E52B_dynamicPP],
  ['mp', SMUFL_E52C_dynamicMP],
  ['mf', SMUFL_E52D_dynamicMF],
  ['pf', SMUFL_E52E_dynamicPF],
  ['ff', SMUFL_E52F_dynamicFF],
  ['fff', SMUFL_E530_dynamicFFF],
  ['ffff', SMUFL_E531_dynamicFFFF],
  ['fffff', SMUFL_E532_dynamicFFFFF],
  ['ffffff', SMUFL_E533_dynamicFFFFFF],
  ['fp', SMUFL_E534_dynamicFortePiano],
  ['fz', SMUFL_E535_dynamicForzando],
  ['sf', SMUFL_E536_dynamicSforzando1],
  ['sfp', SMUFL_E537_dynamicSforzandoPiano],
  ['sfpp', SMUFL_E538_dynamicSforzandoPianissimo],
  ['sfz', SMUFL_E539_dynamicSforzato],
  ['sfzp', SMUFL_E53A_dynamicSforzatoPiano],
  ['sffz', SMUFL_E53B_dynamicSforzatoFF],
  ['rf', SMUFL_E53C_dynamicRinforzando1],
  ['rfz', SMUFL_E53D_dynamicRinforzando2],
]);

export interface DynamFunctorLike {
  VisitDynam(dynam: Dynam): FunctorCode;
  VisitDynamEnd(dynam: Dynam): FunctorCode;
}

/** Pure-TS translation of Verovio's Dynam element. */
export class Dynam extends ControlElement {

  public SetStaff(v: number[]): void { this.GetTimeSpanningInterface().SetStaff(v); }
  public GetStaff(): number[] { return this.GetTimeSpanningInterface().GetStaff(); }
  /** C++ AttLayer::HasStaff via the time-pointing interface. */
  public HasStaff(): boolean { return this.GetTimeSpanningInterface().HasStaff(); }
  public HasStartid(): boolean { return this.GetTimeSpanningInterface().HasStartid(); }
  public SetStartid(v: string): void { this.GetTimeSpanningInterface().SetStartid(v); }
  public GetStartid(): string { return this.GetTimeSpanningInterface().GetStartid(); }
  public SetTstamp(v: number): void { this.GetTimeSpanningInterface().SetTstamp(v); }
  public GetTstamp(): number { return this.GetTimeSpanningInterface().GetTstamp(); }
  public HasTstamp(): boolean { return this.GetTimeSpanningInterface().HasTstamp(); }
  public SetTstamp2(v: any): void { this.GetTimeSpanningInterface().SetTstamp2(v); }
  public GetTstamp2(): unknown { return this.GetTimeSpanningInterface().GetTstamp2(); }
  public HasTstamp2(): boolean { return this.GetTimeSpanningInterface().HasTstamp2(); }
  public HasStart(): boolean { return this.GetTimeSpanningInterface().HasStart(); }
  public HasStartAndEnd(): boolean { return this.GetTimeSpanningInterface().HasStartAndEnd(); }
  public SetStart(v: unknown): void { this.GetTimeSpanningInterface().SetStart(v as never); }
  public GetStart(): unknown { return this.GetTimeSpanningInterface().GetStart(); }
  public SetEnd(v: unknown): void { this.GetTimeSpanningInterface().SetEnd(v as never); }
  public GetEnd(): unknown { return this.GetTimeSpanningInterface().GetEnd(); }
  public GetStartMeasure(): unknown { return this.GetTimeSpanningInterface().GetStartMeasure(); }
  public GetEndMeasure(): unknown { return this.GetTimeSpanningInterface().GetEndMeasure(); }
  public GetTstampStaves(measure: unknown, object: unknown): unknown[] { return this.GetTimePointInterface().GetTstampStaves(measure as never, object as never); }
  private textDirInterface: TextDirInterface | null = null;
  private timeSpanningInterface: TimeSpanningInterface | null = null;
  private textListInterface: TextListInterface | null = null;

  private enclose = ENCLOSURE_NONE;
  private extender = BOOLEAN_NONE;
  private lform = 0;
  private lwidth: unknown = null;
  private lsegs = MEI_UNSET;
  private midiValue = MEI_UNSET;
  private midiValue2 = MEI_UNSET;
  private vgrp = MEI_UNSET;
  private m_symbolStr = '';

  constructor() {
    super(ClassId.DYNAM);
    this.textDirInterface = new TextDirInterface();
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.textListInterface = new TextListInterface();
    this.textListInterface.SetInterfaceOwner(this as unknown as VrvObject);
    this.RegisterInterface(this.textDirInterface.GetAttClasses(), this.textDirInterface.IsInterface());
    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());
    this.RegisterAttClass(ATT_ENCLOSINGCHARS);
    this.RegisterAttClass(ATT_EXTENDER);
    this.RegisterAttClass(ATT_LINERENDBASE);
    this.RegisterAttClass(ATT_MIDIVALUE);
    this.RegisterAttClass(ATT_MIDIVALUE2);
    this.RegisterAttClass(ATT_VERTICALGROUP);
    this.Reset();
  }

  override Reset(): void {
    super.Reset();
    this.textDirInterface?.Reset();
    this.timeSpanningInterface?.Reset();
    this.ResetEnclosingChars();
    this.ResetExtender();
    this.ResetLineRendBase();
    this.ResetMidiValue();
    this.ResetMidiValue2();
    this.ResetVerticalGroup();
    this.m_symbolStr = '';
  }

  GetClassName(): string { return 'dynam'; }
  override Clone(): VrvObject {
    const clone = new Dynam();
    clone.AssignFrom(this);
    clone.GetTextDirInterface().SetPlace(this.GetTextDirInterface().GetPlace());
    clone.GetTimeSpanningInterface().SetPart(this.GetTimeSpanningInterface().GetPart());
    clone.GetTimeSpanningInterface().SetStaff(this.GetTimeSpanningInterface().GetStaff());
    clone.GetTimeSpanningInterface().SetStartid(this.GetTimeSpanningInterface().GetStartid());
    clone.GetTimeSpanningInterface().SetTstamp(this.GetTimeSpanningInterface().GetTstamp());
    clone.GetTimeSpanningInterface().SetEndid(this.GetTimeSpanningInterface().GetEndid());
    clone.GetTimeSpanningInterface().SetTstamp2(this.GetTimeSpanningInterface().GetTstamp2());
    clone.SetEnclose(this.GetEnclose());
    clone.SetExtender(this.GetExtender());
    clone.SetLform(this.GetLform());
    clone.SetLwidth(this.GetLwidth());
    clone.SetLsegs(this.GetLsegs());
    clone.SetVal(this.GetVal());
    clone.SetVal2(this.GetVal2());
    clone.SetVgrp(this.GetVgrp());
    clone.m_symbolStr = this.m_symbolStr;
    return clone;
  }


  GetTextDirInterface(): TextDirInterface {
    if (!this.textDirInterface) this.textDirInterface = new TextDirInterface();
    return this.textDirInterface;
  }

  // AttPlacementRelStaff forwarding
  public SetPlace(place: number): void { this.GetTextDirInterface().SetPlace(place); }
  public GetPlace(): number { return this.GetTextDirInterface().GetPlace(); }
  public HasPlace(): boolean { return this.GetTextDirInterface().HasPlace(); }
  public GetNumberOfLines(object?: unknown): number { return this.GetTextDirInterface().GetNumberOfLines((object ?? this) as never); }
  public ResetPlacementRelStaff(): void { this.GetTextDirInterface().ResetPlacementRelStaff(); }
  GetTimePointInterface(): TimeSpanningInterface {
    if (!this.timeSpanningInterface) this.timeSpanningInterface = new TimeSpanningInterface();
    return this.timeSpanningInterface;
  }
  GetTimeSpanningInterface(): TimeSpanningInterface { return this.GetTimePointInterface(); }

  GetList(): VrvObject[] { return this.textListInterface!.GetList(); }
  GetListSize(): number { return this.textListInterface!.GetListSize(); }
  GetText(): string { return this.textListInterface!.GetText(); }
  GetTextLines(lines: string[]): void { this.textListInterface!.GetTextLines(lines); }

  IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.LB || classId === ClassId.REND || classId === ClassId.TEXT) return true;
    return VrvObject.IsEditorialElement(classId);
  }

  IsSymbolOnly(): boolean {
    this.m_symbolStr = '';
    const str = this.GetText();
    if (Dynam.IsSymbolOnly(str)) {
      this.m_symbolStr = str;
      return true;
    }
    return false;
  }

  GetSymbolStr(singleGlyphs: boolean): string {
    return Dynam.GetSymbolStr(this.m_symbolStr, singleGlyphs);
  }

  IsExtenderElement(): boolean { return this.GetExtender() === BOOLEAN_true; }

  GetEnclosingGlyphs(): [number, number] {
    if (this.HasEnclose()) {
      switch (this.GetEnclose()) {
        case ENCLOSURE_brack: return [SMUFL_E26C_accidentalBracketLeft, SMUFL_E26D_accidentalBracketRight];
        case ENCLOSURE_paren: return [SMUFL_E26A_accidentalParensLeft, SMUFL_E26B_accidentalParensRight];
        default: break;
      }
    }
    return [0, 0];
  }

  ResetEnclosingChars(): void { this.enclose = ENCLOSURE_NONE; }
  SetEnclose(value: number): void { this.enclose = value; }
  GetEnclose(): number { return this.enclose; }
  HasEnclose(): boolean { return this.enclose !== ENCLOSURE_NONE; }

  ResetExtender(): void { this.extender = BOOLEAN_NONE; }
  SetExtender(value: number): void { this.extender = value; }
  GetExtender(): number { return this.extender; }
  HasExtender(): boolean { return this.extender !== BOOLEAN_NONE; }

  ResetLineRendBase(): void { this.lform = 0; this.lwidth = null; this.lsegs = MEI_UNSET; }
  SetLform(value: number): void { this.lform = value; }
  GetLform(): number { return this.lform; }
  HasLform(): boolean { return this.lform !== 0; }
  SetLwidth(value: unknown): void { this.lwidth = value; }
  GetLwidth(): unknown { return this.lwidth; }
  HasLwidth(): boolean { return this.lwidth !== null; }
  SetLsegs(value: number): void { this.lsegs = value; }
  GetLsegs(): number { return this.lsegs; }
  HasLsegs(): boolean { return this.lsegs !== MEI_UNSET; }

  ResetMidiValue(): void { this.midiValue = MEI_UNSET; }
  SetVal(value: number): void { this.midiValue = value; }
  GetVal(): number { return this.midiValue; }
  HasVal(): boolean { return this.midiValue !== MEI_UNSET; }

  ResetMidiValue2(): void { this.midiValue2 = MEI_UNSET; }
  SetVal2(value: number): void { this.midiValue2 = value; }
  GetVal2(): number { return this.midiValue2; }
  HasVal2(): boolean { return this.midiValue2 !== MEI_UNSET; }

  ResetVerticalGroup(): void { this.vgrp = MEI_UNSET; }
  SetVgrp(value: number): void { this.vgrp = value; }
  GetVgrp(): number { return this.vgrp; }
  HasVgrp(): boolean { return this.vgrp !== MEI_UNSET; }

  static GetSymbolsInStr(str: string, tokens: ArrayOfStringDynamTypePairs): boolean {
    tokens.length = 0;
    let token = '';
    let hasSymbols = false;

    // Direct translation of the C++ loop/state machine. Inputs are MEI text, so
    // its delimiter is a literal U+0020 and not general Unicode whitespace.
    while (str !== token) {
      const index = str.indexOf(' ');
      token = str.substring(0, index === -1 ? str.length : index);
      if (Dynam.IsSymbolOnly(token)) {
        hasSymbols = true;
        if (tokens.length > 0) {
          if (!tokens[tokens.length - 1][1]) {
            tokens[tokens.length - 1][0] += ' ';
          } else {
            tokens.push([' ', false]);
          }
        }
        tokens.push([token, true]);
      } else {
        if (tokens.length > 0) {
          if (!tokens[tokens.length - 1][1]) {
            tokens[tokens.length - 1][0] += ` ${token}`;
          } else {
            tokens.push([` ${token}`, false]);
          }
        } else {
          tokens.push([token, false]);
        }
      }
      if (index === -1) break;
      token = '';
      str = str.substring(index + 1, index + 1 + str.length);
    }

    return hasSymbols;
  }

  static IsSymbolOnly(str: string): boolean {
    return str.length > 0 && /^[fpmrszn]+$/.test(str);
  }

  static GetSymbolStr(str: string, singleGlyphs: boolean): string {
    if (!singleGlyphs) {
      const compound = compoundGlyphs.get(str);
      if (compound !== undefined) return String.fromCodePoint(compound);
    }

    let dynam = str;
    for (let i = 0; i < dynamChars.length; ++i) {
      const from = dynamChars[i];
      const to = String.fromCodePoint(dynamSmufl[i]);
      dynam = dynam.split(from).join(to);
    }
    return dynam;
  }

  Accept(functor: Functor): FunctorCode {
    return (functor as unknown as DynamFunctorLike).VisitDynam(this);
  }

  AcceptConst(functor: Functor): FunctorCode {
    return (functor as unknown as DynamFunctorLike).VisitDynam(this);
  }

  AcceptEnd(functor: Functor): FunctorCode {
    return (functor as unknown as DynamFunctorLike).VisitDynamEnd(this);
  }

  AcceptEndConst(functor: Functor): FunctorCode {
    return (functor as unknown as DynamFunctorLike).VisitDynamEnd(this);
  }
}

ObjectFactory.GetInstance().Register('dynam', ClassId.DYNAM, () => new Dynam());
