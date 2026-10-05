import { ClassId } from './vrvdef';
import { LogDebug, LogWarning, StringFormat } from './vrv';

export interface ChordLike { GetTopNote(): NoteLike | null; }
export interface AccidLike {
  GetAccid(): number;
  GetAccidGes(): number;
}
export interface NoteLike {
  Is(type: ClassId): boolean;
  IsChordTone(): ChordLike | null;
  GetScoreTimeTiedDuration(): number;
  GetDur(): number;
  GetDots(): number;
  GetOct(): number;
  GetPname(): number;
  GetMIDIPitch(): number;
  GetDiatonicPitch(): number;
  GetID(): string;
  FindDescendantByType(type: ClassId): object | null;
  PitchnameToStr?(pname: number): string;
}
export interface FeatureExtractorObjectLike {
  Is(type: ClassId): boolean;
}

// PAEOutput::GetPaeDur is source-defined in iopae.cpp. Keep its exact mapping local
// until iopae is migrated, avoiding a mock that invents alternative duration semantics.
function getPaeDur(dur: number, dots: number): string {
  let out: string;
  switch (dur) {
    case 0: out = '0'; break; // DURATION_long (0)
    case 1: out = '9'; break; // DURATION_breve
    case 2: out = '1'; break; // DURATION_1
    case 3: out = '2'; break; // DURATION_2
    case 4: out = '4'; break; // DURATION_4
    case 5: out = '8'; break; // DURATION_8
    case 6: out = '6'; break; // DURATION_16
    case 7: out = '3'; break; // DURATION_32
    case 8: out = '5'; break; // DURATION_64
    case 9: out = '7'; break; // DURATION_128
    case 100: out = '0'; break; // DURATION_longa
    case 101: out = '9'; break; // DURATION_brevis
    case 102: out = '1'; break; // DURATION_semibrevis
    case 103: out = '2'; break; // DURATION_minima
    case 104: out = '4'; break; // DURATION_semiminima
    case 105: out = '8'; break; // DURATION_fusa
    case 106: out = '6'; break; // DURATION_semifusa
    default:
      LogWarning('Unsupported duration');
      out = '4';
  }
  return out + (dots > 0 ? '.'.repeat(dots) : '');
}

export class FeatureExtractor {
  public m_previousNotes: NoteLike[] = [];
  public m_pitchesChromatic: string[] = [];
  public m_pitchesChromaticWithDuration: string[] = [];
  public m_pitchesDiatonic: string[] = [];
  public m_pitchesIds: string[][] = [];
  public m_intervalsChromatic: string[] = [];
  public m_intervalsDiatonic: string[] = [];
  public m_intervalGrossContour: string[] = [];
  public m_intervalRefinedContour: string[] = [];
  public m_intervalsIds: string[][] = [];

  public constructor(_options: string) { this.Reset(); }

  public Reset(): void { this.m_previousNotes.length = 0; }

  public Extract(object: FeatureExtractorObjectLike & NoteLike): void {
    if (!object.Is(ClassId.NOTE)) return;
    const note = object;

    const chord = note.IsChordTone();
    if (chord && note !== chord.GetTopNote()) return;

    if (note.GetScoreTimeTiedDuration() === -1) {
      if (this.m_intervalsIds.length > 0) this.m_intervalsIds[this.m_intervalsIds.length - 1].push(note.GetID());
      if (this.m_pitchesIds.length > 0) this.m_pitchesIds[this.m_pitchesIds.length - 1].push(note.GetID());
      this.m_previousNotes.push(note);
      return;
    }

    let pitch = '';
    let pitchWithDuration = getPaeDur(note.GetDur(), note.GetDots());
    const oct = note.GetOct();
    const octSign = oct > 3 ? "'" : ',';
    const signCount = oct > 3 ? oct - 3 : 4 - oct;
    const octaves = octSign.repeat(Math.max(0, signCount));
    pitch += octaves;
    pitchWithDuration += octaves;

    const accid = note.FindDescendantByType(ClassId.ACCID) as AccidLike | null;
    if (accid) {
      let written = '';
      switch (accid.GetAccid()) {
        case 1: written = 'x'; break;
        case 2: written = 'b'; break;
        case 3: written = 'xx'; break;
        case 4: written = 'xx'; break;
        case 5: written = 'bb'; break;
        default: written = '';
      }
      let gestural = written;
      switch (accid.GetAccidGes()) {
        case 1: gestural = 'x'; break;
        case 2: gestural = 'b'; break;
        case 3: gestural = 'xx'; break;
        case 4: gestural = 'bb'; break;
      }
      pitch += gestural;
      pitchWithDuration += gestural;
    }

    const pname = (note.PitchnameToStr ? note.PitchnameToStr(note.GetPname()) : ['','C','D','E','F','G','A','B'][note.GetPname()] ?? '') .toUpperCase();
    pitch += pname;
    pitchWithDuration += pname;

    this.m_pitchesChromatic.push(pitch);
    this.m_pitchesChromaticWithDuration.push(pitchWithDuration);
    this.m_pitchesDiatonic.push(pname);
    this.m_pitchesIds.push([note.GetID()]);

    if (this.m_previousNotes.length > 0) {
      const intervalChromatic = note.GetMIDIPitch() - this.m_previousNotes[0].GetMIDIPitch();
      if (intervalChromatic === 0) {
        this.m_intervalGrossContour.push('s');
        this.m_intervalRefinedContour.push('s');
      } else if (intervalChromatic < 0) {
        this.m_intervalGrossContour.push('D');
        this.m_intervalRefinedContour.push(intervalChromatic < -2 ? 'D' : 'd');
      } else {
        this.m_intervalGrossContour.push('U');
        this.m_intervalRefinedContour.push(intervalChromatic > 2 ? 'U' : 'u');
      }
      this.m_intervalsChromatic.push(StringFormat('%d', intervalChromatic));
      this.m_intervalsDiatonic.push(StringFormat('%d', note.GetDiatonicPitch() - this.m_previousNotes[0].GetDiatonicPitch()));
      const ids = this.m_previousNotes.map(n => n.GetID());
      ids.push(note.GetID());
      this.m_intervalsIds.push(ids);
    }

    this.m_previousNotes.length = 0;
    this.m_previousNotes.push(note);
  }

  public ToJson(output: { value: string }): void {
    const obj = {
      pitchesChromaticWithDuration: this.m_pitchesChromaticWithDuration,
      pitchesChromatic: this.m_pitchesChromatic,
      pitchesDiatonic: this.m_pitchesDiatonic,
      pitchesIds: this.m_pitchesIds,
      intervalsChromatic: this.m_intervalsChromatic,
      intervalsDiatonic: this.m_intervalsDiatonic,
      intervalGrossContour: this.m_intervalGrossContour,
      intervalRefinedContour: this.m_intervalRefinedContour,
      intervalsIds: this.m_intervalsIds,
    };
    output.value = JSON.stringify(obj);
    LogDebug('%s', output.value);
  }
}
