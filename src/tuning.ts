import { ObjectFactory, VrvObject } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { Functor, ConstFunctor } from './functor.js';
import { Comparison } from './comparison.js';
import { InstTuningLog } from './atts_shared.js';
import { ATT_CLASS_IDS } from './attmodule.js';
import { MEI_UNSET } from './vrv.js';
import {
  PITCHNAME_NONE,
  PITCHNAME_c,
  PITCHNAME_d,
  PITCHNAME_e,
  PITCHNAME_f,
  PITCHNAME_g,
  PITCHNAME_a,
  PITCHNAME_b,
} from './pitchinterface.js';
import { ACCIDENTAL_WRITTEN_s, ACCIDENTAL_WRITTEN_f } from './accid.js';
import { Course } from './course.js';

export const COURSETUNING_NONE = 0;
export const COURSETUNING_guitar_standard = 1;
export const COURSETUNING_guitar_drop_D = 2;
export const COURSETUNING_guitar_open_D = 3;
export const COURSETUNING_guitar_open_G = 4;
export const COURSETUNING_guitar_open_A = 5;
export const COURSETUNING_lute_renaissance_6 = 6;
export const COURSETUNING_lute_baroque_d_major = 7;
export const COURSETUNING_lute_baroque_d_minor = 8;

export const NOTATIONTYPE_tab_guitar = 10;
export const NOTATIONTYPE_tab_lute_french = 11;
export const NOTATIONTYPE_tab_lute_italian = 12;
export const NOTATIONTYPE_tab_lute_german = 13;

export class AttNNumberLikeComparison extends Comparison {
  private m_n: string;

  public constructor(classId: ClassId, n: string) {
    super((object: any) => {
      if (object.GetClassId() !== classId) return false;
      return typeof object.GetN === 'function' && object.GetN() === this.m_n;
    });
    this.m_n = n;
  }

  public SetN(n: string): void {
    this.m_n = n;
  }
}

/**
 * Pure-TypeScript translation of Verovio's Tuning (`<tuning>`) element.
 */
export class Tuning extends VrvObject {
  private attTuningLog: InstTuningLog | undefined;

  public constructor() {
    super(ClassId.TUNING);
    this.RegisterAttClass(ATT_CLASS_IDS.ATT_TUNINGLOG);
    this.Reset();
  }

  public override Clone(): Tuning {
    const clone = new Tuning();
    clone.AssignFrom(this);
    clone.SetTuningStandard(this.GetTuningStandard());
    return clone;
  }

  public override Reset(): void {
    super.Reset();
    this.attTuningLog ??= new InstTuningLog();
    this.attTuningLog.ResetTuningLog();
  }

  public override GetClassName(): string {
    return 'tuning';
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.COURSE) {
      return true;
    } else if (VrvObject.IsEditorialElement(classId)) {
      return true;
    }
    return false;
  }

  // AttTuningLog forwarding
  public ResetTuningLog(): void { this.attTuningLog!.ResetTuningLog(); }
  public SetTuningStandard(val: any): void { this.attTuningLog!.SetTuningStandard(val); }
  public GetTuningStandard(): any { return this.attTuningLog!.GetTuningStandard(); }
  public HasTuningStandard(): boolean { return this.attTuningLog!.HasTuningStandard(); }
  public ReadTuningLog(element: any, removeAttr = true): boolean { return this.attTuningLog!.ReadTuningLog(element, removeAttr); }
  public WriteTuningLog(element: any): boolean { return this.attTuningLog!.WriteTuningLog(element); }

  public static CalcPitchPos(
    course: number,
    notationType: number,
    lines: number,
    listSize: number,
    index: number,
    loc: number,
    tabLine: number,
    tabAnchorline: number,
    topAlign: boolean,
  ): number {
    switch (notationType) {
      case NOTATIONTYPE_tab_lute_french:
        // all courses >= 7 are positioned above line 0
        return (lines - Math.min(course, 7)) * 2 + 1; // above the line
      case NOTATIONTYPE_tab_lute_italian:
        // all courses >= 7 are positioned on line 7
        return (Math.min(course, 7) - 1) * 2;
      case NOTATIONTYPE_tab_lute_german:
        if (tabLine !== 0) {
          // explicit position, 1st priority
          return (tabLine - 1) * 2;
        } else if (loc !== MEI_UNSET) {
          // explicit position, 2nd priority
          return loc;
        } else if (tabAnchorline !== 0) {
          // align bottom note to given anchor line, but don't extend chord above the top line, 3rd priority
          return (Math.min(tabAnchorline - 1, lines - listSize) + index) * 2;
        } else if (topAlign) {
          // align top note with top line, joint 4th priority (default positioning)
          return (lines - listSize + index) * 2;
        } else {
          // align bottom note with bottom line, joint 4th priority
          return index * 2;
        }
      case NOTATIONTYPE_tab_guitar:
      default:
        return Math.abs(course - lines) * 2;
    }
  }

  public CalcPitchNumber(course: number, fret: number, notationType: number): number {
    // Use <tuning><course>s, if available
    // else use @tuning.standard, if available
    // else use @notationType

    // Do we have the tuning for this course?
    const cnc = new AttNNumberLikeComparison(ClassId.COURSE, String(course));
    const courseTuning = this.FindDescendantByComparison(cnc) as Course | null;

    if (courseTuning && courseTuning.HasPname() && courseTuning.HasOct()) {
      // Distance in semitones from the octave's starting C to the given note
      let midiBase = 0;
      switch (courseTuning.GetPname()) {
        case PITCHNAME_c: midiBase = 0; break;
        case PITCHNAME_d: midiBase = 2; break;
        case PITCHNAME_e: midiBase = 4; break;
        case PITCHNAME_f: midiBase = 5; break;
        case PITCHNAME_g: midiBase = 7; break;
        case PITCHNAME_a: midiBase = 9; break;
        case PITCHNAME_b: midiBase = 11; break;
        case PITCHNAME_NONE: break;
      }

      const octave = courseTuning.GetOct();

      // As this does not represent historical notation of any kind the only
      // accidentals we should ever see are "s" and "f"
      let alter = 0;
      if (courseTuning.HasAccid()) {
        if (courseTuning.GetAccid() === ACCIDENTAL_WRITTEN_s) {
          alter = 1;
        } else if (courseTuning.GetAccid() === ACCIDENTAL_WRITTEN_f) {
          alter = -1;
        }
      }

      return (octave + 1) * 12 + midiBase + alter + fret; // MIDI note C4 = 60
    }

    // no <tuning><course> specified, fall back to @tuning.standard

    // modern guitar                           E4  B3  G3  D3  A2  E2
    const guitarStandardPitch = [64, 59, 55, 50, 45, 40];

    // modern guitar drop D                 E4  B3  G3  D3  A2  D2
    const guitarDropDPitch = [64, 59, 55, 50, 45, 38];

    // modern guitar open D                 D4  A3  F#3 D3  A2  D2
    const guitarOpenDPitch = [62, 57, 54, 50, 45, 38];

    // modern guitar open G                 D4  B3  G3  D3  G2  D2
    const guitarOpenGPitch = [62, 59, 55, 50, 43, 38];

    // modern guitar open A                 E4  C#4 A3  E3  A2  E2
    const guitarOpenAPitch = [64, 61, 57, 52, 45, 40];

    // 6 course renaissance lute                 G4  D4  A3  F3  C3  G2
    const luteRenaissance6Pitch = [67, 62, 57, 53, 48, 43];

    // baroque lute D major                  F#4 D4  A3  F#3 D3  A2  G2  F#2 E2  D2  C#2 B1  A1
    const luteBaroqueDMajor = [66, 62, 57, 54, 50, 45, 43, 42, 40, 38, 37, 35, 33];

    // baroque lute D minor                  F4  D4  A3  F3  D3  A2  G2  F2  E2  D2  C2  B1  A1
    const luteBaroqueDMinor = [65, 62, 57, 53, 50, 45, 43, 41, 40, 38, 36, 35, 33];

    let pitch: number[] | null = null;
    let pitchSize = 0;

    switch (this.GetTuningStandard()) {
      case COURSETUNING_guitar_standard:
        pitch = guitarStandardPitch;
        pitchSize = guitarStandardPitch.length;
        break;
      case COURSETUNING_guitar_drop_D:
        pitch = guitarDropDPitch;
        pitchSize = guitarDropDPitch.length;
        break;
      case COURSETUNING_guitar_open_D:
        pitch = guitarOpenDPitch;
        pitchSize = guitarOpenDPitch.length;
        break;
      case COURSETUNING_guitar_open_G:
        pitch = guitarOpenGPitch;
        pitchSize = guitarOpenGPitch.length;
        break;
      case COURSETUNING_guitar_open_A:
        pitch = guitarOpenAPitch;
        pitchSize = guitarOpenAPitch.length;
        break;
      case COURSETUNING_lute_renaissance_6:
        pitch = luteRenaissance6Pitch;
        pitchSize = luteRenaissance6Pitch.length;
        break;
      case COURSETUNING_lute_baroque_d_major:
        pitch = luteBaroqueDMajor;
        pitchSize = luteBaroqueDMajor.length;
        break;
      case COURSETUNING_lute_baroque_d_minor:
        pitch = luteBaroqueDMinor;
        pitchSize = luteBaroqueDMinor.length;
        break;
      case COURSETUNING_NONE:
      default:
        // @tuning.standard is not specified, use @notationType
        if (
          notationType === NOTATIONTYPE_tab_lute_french ||
          notationType === NOTATIONTYPE_tab_lute_italian ||
          notationType === NOTATIONTYPE_tab_lute_german
        ) {
          pitch = luteRenaissance6Pitch;
          pitchSize = luteRenaissance6Pitch.length;
        } else {
          pitch = guitarStandardPitch;
          pitchSize = guitarStandardPitch.length;
        }
        break;
    }

    // ponytail: C++ uses sizeof(pitchArray) which equals length * sizeof(int). In TS, pitch.length bounds check prevents accessing undefined elements.
    return course > 0 && course <= pitchSize && pitch ? pitch[course - 1] + fret : 0;
  }

  public override Accept(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitTuning', this);
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitTuning', this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitTuningEnd', this);
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitTuningEnd', this);
  }
}

function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') {
    return (fn as (arg: unknown) => FunctorCode).call(functor, self);
  }
  const fallback = method.endsWith('End') ? f.VisitObjectEnd : f.VisitObject;
  if (typeof fallback === 'function') {
    return (fallback as (arg: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('tuning', ClassId.TUNING, () => new Tuning());
