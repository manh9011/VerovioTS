/**
 * Pure TypeScript translation of Verovio's `src/harm.cpp` / `include/vrv/harm.h`.
 *
 * `Harm` is the MEI `<harm>` harmony control element. C++ multiple
 * inheritance (ControlElement + TextListInterface + TextDirInterface +
 * TimeSpanningInterface + AttLang + AttNNumberLike) is represented through
 * explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode, UNICODE_DOUBLE_FLAT, UNICODE_DOUBLE_SHARP, UNICODE_FLAT, UNICODE_SHARP } from './vrvdef.js';
import { ObjectFactory, VrvObject, TextListInterface } from './object.js';
import { ControlElement } from './controlelement.js';
import { TextDirInterface } from './textdirinterface.js';
import { TimeSpanningInterface, TimePointInterface } from './timeinterface.js';
import { InstLang, InstNNumberLike } from './atts_shared.js';
import { TransPitch } from './transposition.js';
import { Text } from './text.js';
import { LogWarning } from './vrv.js';

// Canonical libmei att-class ordinals (libmei/dist/attclasses.h).
const ATT_LANG = 146;
const ATT_NNUMBERLIKE = 168;

/** Pure TypeScript translation of Verovio's `Harm` element. */
export class Harm extends ControlElement {
  private textListInterface: TextListInterface | null = null;
  private textDirInterface: TextDirInterface | null = null;
  private timeSpanningInterface: TimeSpanningInterface | null = null;
  private attLang: InstLang | null = null;
  private attNNumberLike: InstNNumberLike | null = null;

  public constructor() {
    super(ClassId.HARM);
    this.textListInterface = new TextListInterface();
    this.textDirInterface = new TextDirInterface();
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.attLang = new InstLang();
    this.attNNumberLike = new InstNNumberLike();
    this.RegisterInterface(this.textDirInterface.GetAttClasses(), this.textDirInterface.IsInterface());
    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());
    this.RegisterAttClass(ATT_LANG);
    this.RegisterAttClass(ATT_NNUMBERLIKE);
    // C++ multiple inheritance: TextListInterface is mixed into the Harm; bind
    // the composed list interface to this object as its owner.
    this.textListInterface.SetInterfaceOwner(this as unknown as VrvObject);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.textDirInterface ??= new TextDirInterface();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.attLang ??= new InstLang();
    this.attNNumberLike ??= new InstNNumberLike();
    this.textDirInterface.Reset();
    this.timeSpanningInterface.Reset();
    this.attLang.ResetLang();
    this.attNNumberLike.ResetNNumberLike();
  }

  public override GetClassName(): string { return 'harm'; }

  // Getter to interfaces (C++ vrv_cast overloads collapse to one TS surface).
  public GetTextDirInterface(): TextDirInterface {
    this.textDirInterface ??= new TextDirInterface();
    return this.textDirInterface;
  }
  // AttPlacementRelStaff forwarding (C++ Harm inherits TextDirInterface::GetPlace;
  // FloatingPositioner reads harm->GetPlace() for default placement).
  public SetPlace(v: number): void { this.GetTextDirInterface().SetPlace(v as never); }
  public GetPlace(): number { return this.GetTextDirInterface().GetPlace() as unknown as number; }
  public HasPlace(): boolean { return this.GetTextDirInterface().HasPlace(); }
  public GetTimePointInterface(): TimePointInterface {
    return this.GetTimeSpanningInterface();
  }
  public GetTimeSpanningInterface(): TimeSpanningInterface {
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    return this.timeSpanningInterface;
  }
  /** C++ TimePoint/TimeSpanning forwarding (iohumdrum harm placement). */
  public SetStaff(v: number[]): void { this.GetTimeSpanningInterface().SetStaff(v); }
  public GetStaff(): number[] { return this.GetTimeSpanningInterface().GetStaff(); }
  public HasStaff(): boolean { return this.GetTimeSpanningInterface().HasStaff(); }
  public SetTstamp(v: number): void { this.GetTimePointInterface().SetTstamp(v); }
  public GetTstamp(): number { return this.GetTimePointInterface().GetTstamp(); }
  public HasTstamp(): boolean { return this.GetTimePointInterface().HasTstamp(); }
  public SetStartid(v: string): void { this.GetTimePointInterface().SetStartid(v); }
  public GetStartid(): string { return this.GetTimePointInterface().GetStartid(); }
  public HasStartid(): boolean { return this.GetTimePointInterface().HasStartid(); }
  public SetStart(v: unknown): void { this.GetTimeSpanningInterface().SetStart(v as never); }
  public GetStart(): unknown { return this.GetTimeSpanningInterface().GetStart(); }
  public GetStartMeasure(): unknown { return this.GetTimeSpanningInterface().GetStartMeasure(); }
  public GetTstampStaves(measure: unknown, object: unknown): unknown[] { return this.GetTimePointInterface().GetTstampStaves(measure as never, object as never); }

  /**
   * Add an element (text, rend. etc.) to a harm.
   * Only supported elements will be actually added to the child list.
   */
  public override IsSupportedChild(classId: ClassId): boolean {
    switch (classId) {
      case ClassId.FB:
      case ClassId.LB:
      case ClassId.REND:
      case ClassId.TEXT:
        return true;
      default:
        return VrvObject.IsEditorialElement(classId);
    }
  }

  /**
   * Transposition related. The int tracks where we have iterated through the string.
   */
  public GetRootPitch(pitch: TransPitch, pos: { value: number }): boolean {
    const textObject = this.FindDescendantByType(ClassId.TEXT, 1) as Text | null;
    if (!textObject) return false;
    const text = textObject.GetText();

    const chr = (i: number): string => String.fromCodePoint(text[i]);
    if (text.length > pos.value && text[pos.value] >= 0x41 && text[pos.value] <= 0x47) {
      // C++: pname = (text.at(pos) - 'C' + 7) % 7
      const pname = (text[pos.value] - 0x43 + 7) % 7;
      let accid = 0;
      for (pos.value++; pos.value < text.length; pos.value++) {
        if (chr(pos.value) === UNICODE_DOUBLE_FLAT) {
          accid -= 2;
        } else if (chr(pos.value) === 'b' || chr(pos.value) === UNICODE_FLAT) {
          accid--;
        } else if (chr(pos.value) === '#' || chr(pos.value) === UNICODE_SHARP) {
          accid++;
        } else if (chr(pos.value) === UNICODE_DOUBLE_SHARP) {
          accid += 2;
        } else {
          break;
        }
      }
      pitch.SetPitch(pname, accid, 4);
      return true;
    }
    LogWarning('Failed to extract a pitch.');
    return false;
  }

  public SetRootPitch(pitch: TransPitch, endPos: number): void {
    const textObject = this.FindDescendantByType(ClassId.TEXT, 1) as Text | null;
    if (!textObject) return;
    const text = textObject.GetText();

    const pitchStr = pitch.GetPitchString();
    if (text.length > endPos) {
      // C++: textObject->SetText(pitch.GetPitchString() + &text.at(endPos));
      textObject.SetText([...pitchStr].map((c) => c.codePointAt(0)!).concat(text.slice(endPos)));
    } else {
      textObject.SetText([...pitchStr].map((c) => c.codePointAt(0)!));
    }
  }

  public GetBassPitch(pitch: TransPitch): boolean {
    const textObject = this.FindDescendantByType(ClassId.TEXT, 1) as Text | null;
    if (!textObject) return false;
    const text = textObject.GetText();
    if (!text.length) return false;

    for (let pos = 0; pos < text.length; pos++) {
      if (String.fromCodePoint(text[pos]) === '/') {
        pos++;
        return this.GetRootPitch(pitch, { value: pos });
      }
    }
    return false;
  }

  public SetBassPitch(pitch: TransPitch): void {
    const textObject = this.FindDescendantByType(ClassId.TEXT, 1) as Text | null;
    if (!textObject) return;
    const text = textObject.GetText();
    let pos: number;
    for (pos = 0; pos < text.length; pos++) {
      if (String.fromCodePoint(text[pos]) === '/') {
        break;
      }
    }

    // C++: text = text.substr(0, pos) + U"/" + pitch.GetPitchString();
    const slashCode = '/'.codePointAt(0)!;
    const newText = text.slice(0, pos).concat([slashCode], [...pitch.GetPitchString()].map((c) => c.codePointAt(0)!));
    textObject.SetText(newText);
  }

  // TextListInterface facade (C++ inherits the list interface; TS composes it).
  public GetList(): VrvObject[] { return this.textListInterface!.GetList(); }
  public GetListSize(): number { return this.textListInterface!.GetListSize(); }
  public GetText(): string { return this.textListInterface!.GetText(); }
  public GetTextLines(lines: string[]): void { this.textListInterface!.GetTextLines(lines); }

  // AttLang forwarding.
  public SetLang(value: unknown): void { this.attLang!.SetLang(value); }
  public GetLang(): unknown { return this.attLang!.GetLang(); }
  public HasLang(): boolean { return this.attLang!.HasLang(); }
  public SetTranslit(value: unknown): void { this.attLang!.SetTranslit(value); }
  public GetTranslit(): unknown { return this.attLang!.GetTranslit(); }
  public HasTranslit(): boolean { return this.attLang!.HasTranslit(); }
  public ResetLang(): void { this.attLang!.ResetLang(); }

  // AttNNumberLike forwarding.
  public SetN(value: unknown): void { this.attNNumberLike!.SetN(value); }
  public GetN(): unknown { return this.attNNumberLike!.GetN(); }
  public HasN(): boolean { return this.attNNumberLike!.HasN(); }
  public ResetNNumberLike(): void { this.attNNumberLike!.ResetNNumberLike(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitHarm');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitHarm');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitHarmEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitHarmEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Harm {
    const clone = new Harm();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all interface/attribute members.
    const td = this.GetTextDirInterface();
    const ctd = clone.GetTextDirInterface();
    if (td.HasPlace()) ctd.SetPlace(td.GetPlace());
    const ts = this.GetTimeSpanningInterface();
    const cts = clone.GetTimeSpanningInterface();
    if (ts.HasStartid()) cts.SetStartid(ts.GetStartid());
    if (ts.HasEndid()) cts.SetEndid(ts.GetEndid());
    if (ts.HasTstamp()) cts.SetTstamp(ts.GetTstamp());
    if (ts.HasTstamp2()) cts.SetTstamp2(ts.GetTstamp2());
    clone.SetLang(this.GetLang());
    clone.SetTranslit(this.GetTranslit());
    clone.SetN(this.GetN());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('harm', ClassId.HARM, () => new Harm());
