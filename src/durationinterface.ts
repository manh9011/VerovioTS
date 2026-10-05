/** Pure TypeScript translation of Verovio's DurationInterface. */
import {
  AttClassId, DURATION_1, DURATION_1024, DURATION_16, DURATION_2, DURATION_4,
  DURATION_8, DURATION_NONE, DURATION_breve, DURATION_brevis, DURATION_fusa, DURATION_longa,
  DURATION_long, DURATION_maxima, DURATION_minima, DURATION_semibrevis,
  DURATION_semifusa, DURATION_semiminima, DURATION_2048, ClassId, FunctorCode,
  InterfaceId, VRV_UNSET,
} from './vrvdef.js';
import { Fraction } from './fraction.js';
import { Interface } from './interface.js';
import { LogError, LogWarning } from './vrv.js';

export type data_DURATION = number;
export const DURQUALITY_mensural_NONE = 0;
export const DURQUALITY_mensural_perfecta = 1;
export const DURQUALITY_mensural_imperfecta = 2;
export const DURQUALITY_mensural_altera = 3;
export const DURQUALITY_mensural_minor = 4;
export const DURQUALITY_mensural_maior = 5;
export const DURQUALITY_mensural_duplex = 6;

export const MODUSMINOR_2 = 2;
export const TEMPUS_2 = 2;
export const PROLATIO_2 = 2;

export const ATT_BEAMSECONDARY: AttClassId = 13;
export const ATT_DURATIONGES: AttClassId = 55;
export const ATT_DURATIONQUALITY: AttClassId = 70;
export const ATT_AUGMENTDOTS: AttClassId = 97;
export const ATT_DURATIONLOG: AttClassId = 127;
export const ATT_DURATIONRATIO: AttClassId = 128;
export const ATT_FERMATAPRESENT: AttClassId = 134;
export const ATT_STAFFIDENT: AttClassId = 203;

class AttAugmentDotsState {
  private dots = VRV_UNSET;
  Reset(): void { this.dots = VRV_UNSET; }
  SetDots(v: number): void { this.dots = v; }
  GetDots(): number { return this.dots; }
  HasDots(): boolean { return this.dots !== VRV_UNSET; }
}
class AttBeamSecondaryState {
  private breaksec = VRV_UNSET;
  Reset(): void { this.breaksec = VRV_UNSET; }
  SetBreaksec(v: number): void { this.breaksec = v; }
  GetBreaksec(): number { return this.breaksec; }
  HasBreaksec(): boolean { return this.breaksec !== VRV_UNSET; }
}
class AttDurationGesState {
  private durGes: data_DURATION = DURATION_NONE;
  private dotsGes = VRV_UNSET;
  private durMetrical = 0.0;
  private durPpq = VRV_UNSET;
  private durReal = 0.0;
  private durRecip = '';
  Reset(): void {
    this.durGes = DURATION_NONE;
    this.dotsGes = VRV_UNSET;
    this.durMetrical = 0.0;
    this.durPpq = VRV_UNSET;
    this.durReal = 0.0;
    this.durRecip = '';
  }
  SetDurGes(v: data_DURATION): void { this.durGes = v; }
  GetDurGes(): data_DURATION { return this.durGes; }
  HasDurGes(): boolean { return this.durGes !== DURATION_NONE; }
  SetDotsGes(v: number): void { this.dotsGes = v; }
  GetDotsGes(): number { return this.dotsGes; }
  HasDotsGes(): boolean { return this.dotsGes !== VRV_UNSET; }
  SetDurMetrical(v: number): void { this.durMetrical = v; }
  GetDurMetrical(): number { return this.durMetrical; }
  HasDurMetrical(): boolean { return this.durMetrical !== 0; }
  SetDurPpq(v: number): void { this.durPpq = v; }
  GetDurPpq(): number { return this.durPpq; }
  HasDurPpq(): boolean { return this.durPpq !== VRV_UNSET; }
  SetDurReal(v: number): void { this.durReal = v; }
  GetDurReal(): number { return this.durReal; }
  HasDurReal(): boolean { return this.durReal !== 0; }
  SetDurRecip(v: string): void { this.durRecip = v; }
  GetDurRecip(): string { return this.durRecip; }
  HasDurRecip(): boolean { return this.durRecip !== ''; }
}
class AttDurationLogState {
  private dur: data_DURATION = DURATION_NONE;
  Reset(): void { this.dur = DURATION_NONE; }
  SetDur(v: data_DURATION): void { this.dur = v; }
  GetDur(): data_DURATION { return this.dur; }
  HasDur(): boolean { return this.dur !== DURATION_NONE; }
}
class AttDurationQualityState {
  private durQuality = DURQUALITY_mensural_NONE;
  Reset(): void { this.durQuality = DURQUALITY_mensural_NONE; }
  SetDurQuality(v: number): void { this.durQuality = v; }
  GetDurQuality(): number { return this.durQuality; }
  HasDurQuality(): boolean { return this.durQuality !== DURQUALITY_mensural_NONE; }
}
class AttDurationRatioState {
  private num = VRV_UNSET;
  private numbase = VRV_UNSET;
  Reset(): void { this.num = VRV_UNSET; this.numbase = VRV_UNSET; }
  SetNum(v: number): void { this.num = v; }
  GetNum(): number { return this.num; }
  HasNum(): boolean { return this.num !== VRV_UNSET; }
  SetNumbase(v: number): void { this.numbase = v; }
  GetNumbase(): number { return this.numbase; }
  HasNumbase(): boolean { return this.numbase !== VRV_UNSET; }
}
class AttFermataPresentState {
  private fermata = 0;
  Reset(): void { this.fermata = 0; }
  SetFermata(v: number): void { this.fermata = v; }
  GetFermata(): number { return this.fermata; }
  HasFermata(): boolean { return this.fermata !== 0; }
  ResetFermataPresent(): void { this.fermata = 0; }
}
class AttStaffIdentState {
  private staff: number[] = [];
  Reset(): void { this.staff = []; }
  SetStaff(v: number[]): void { this.staff = v; }
  GetStaff(): number[] { return this.staff; }
  HasStaff(): boolean { return this.staff.length > 0; }
}

export interface MensurLike {
  GetModusminor(): number;
  GetModusmaior(): number;
  GetTempus(): number;
  GetProlatio(): number;
}
export interface LayerElementForDurationLike {
  Is(id: ClassId): boolean;
  GetFirstAncestor(id: ClassId, maxDepth: number): LayerElementForDurationLike | null;
}
export interface BeamLike extends LayerElementForDurationLike { GetListFront(): LayerElementForDurationLike; GetListBack(): LayerElementForDurationLike; }
export interface NoteLike extends LayerElementForDurationLike { IsChordTone(): ChordLike | null; GetActualDur(): data_DURATION; }
export interface ChordLike extends LayerElementForDurationLike { GetTopNote(): NoteLike; GetBottomNote(): NoteLike; GetActualDur(): data_DURATION; }
export interface ResetDataFunctorLike {}

const MAX_BEAM_DEPTH = 8;

export class DurationInterface extends Interface {
  private readonly augmentDots = new AttAugmentDotsState();
  private readonly beamSecondary = new AttBeamSecondaryState();
  private readonly durationGes = new AttDurationGesState();
  private readonly durationLog = new AttDurationLogState();
  private readonly durationQuality = new AttDurationQualityState();
  private readonly durationRatio = new AttDurationRatioState();
  private readonly fermataPresent = new AttFermataPresentState();
  private readonly staffIdent = new AttStaffIdentState();
  private m_durDefault: data_DURATION = DURATION_NONE;
  private m_scoreTimeOnset = new Fraction(0);
  private m_scoreTimeOffset = new Fraction(0);
  private m_realTimeOnsetMilliseconds = 0;
  private m_realTimeOffsetMilliseconds = 0;
  private m_scoreTimeTiedDuration = new Fraction(0);

  public constructor() {
    super();
    this.RegisterInterfaceAttClass(ATT_AUGMENTDOTS);
    this.RegisterInterfaceAttClass(ATT_BEAMSECONDARY);
    this.RegisterInterfaceAttClass(ATT_DURATIONGES);
    this.RegisterInterfaceAttClass(ATT_DURATIONLOG);
    this.RegisterInterfaceAttClass(ATT_DURATIONQUALITY);
    this.RegisterInterfaceAttClass(ATT_DURATIONRATIO);
    this.RegisterInterfaceAttClass(ATT_FERMATAPRESENT);
    this.RegisterInterfaceAttClass(ATT_STAFFIDENT);
    this.Reset();
  }

  public override Reset(): void {
    this.augmentDots.Reset(); this.beamSecondary.Reset(); this.durationGes.Reset(); this.durationLog.Reset();
    this.durationQuality.Reset(); this.durationRatio.Reset(); this.fermataPresent.Reset(); this.staffIdent.Reset();
    this.m_durDefault = DURATION_NONE;
    this.m_scoreTimeOnset = new Fraction(0);
    this.m_scoreTimeOffset = new Fraction(0);
    this.m_realTimeOnsetMilliseconds = 0;
    this.m_realTimeOffsetMilliseconds = 0;
    this.m_scoreTimeTiedDuration = new Fraction(0);
  }
  public override IsInterface(): InterfaceId { return InterfaceId.INTERFACE_DURATION; }

  public SetDots(v: number): void { this.augmentDots.SetDots(v); }
  public GetDots(): number { return this.augmentDots.GetDots(); }
  public HasDots(): boolean { return this.augmentDots.HasDots(); }
  public ResetAugmentDots(): void { this.augmentDots.Reset(); }
  public SetDurGes(v: data_DURATION): void { this.durationGes.SetDurGes(v); }
  public GetDurGes(): data_DURATION { return this.durationGes.GetDurGes(); }
  public HasDurGes(): boolean { return this.durationGes.HasDurGes(); }
  public SetDotsGes(v: number): void { this.durationGes.SetDotsGes(v); }
  public GetDotsGes(): number { return this.durationGes.GetDotsGes(); }
  public HasDotsGes(): boolean { return this.durationGes.HasDotsGes(); }
  public SetDurMetrical(v: number): void { this.durationGes.SetDurMetrical(v); }
  public GetDurMetrical(): number { return this.durationGes.GetDurMetrical(); }
  public HasDurMetrical(): boolean { return this.durationGes.HasDurMetrical(); }
  public SetDurPpq(v: number): void { this.durationGes.SetDurPpq(v); }
  public GetDurPpq(): number { return this.durationGes.GetDurPpq(); }
  public HasDurPpq(): boolean { return this.durationGes.HasDurPpq(); }
  public SetDurReal(v: number): void { this.durationGes.SetDurReal(v); }
  public GetDurReal(): number { return this.durationGes.GetDurReal(); }
  public HasDurReal(): boolean { return this.durationGes.HasDurReal(); }
  public SetDurRecip(v: string): void { this.durationGes.SetDurRecip(v); }
  public GetDurRecip(): string { return this.durationGes.GetDurRecip(); }
  public HasDurRecip(): boolean { return this.durationGes.HasDurRecip(); }
  public SetDur(v: data_DURATION): void { this.durationLog.SetDur(v); }
  public GetDur(): data_DURATION { return this.durationLog.GetDur(); }
  public HasDur(): boolean { return this.durationLog.HasDur(); }
  public SetDurQuality(v: number): void { this.durationQuality.SetDurQuality(v); }
  public GetDurQuality(): number { return this.durationQuality.GetDurQuality(); }
  public HasDurQuality(): boolean { return this.durationQuality.HasDurQuality(); }
  public SetNum(v: number): void { this.durationRatio.SetNum(v); }
  public GetNum(): number { return this.durationRatio.GetNum(); }
  public HasNum(): boolean { return this.durationRatio.HasNum(); }
  public SetNumbase(v: number): void { this.durationRatio.SetNumbase(v); }
  public GetNumbase(): number { return this.durationRatio.GetNumbase(); }
  public HasNumbase(): boolean { return this.durationRatio.HasNumbase(); }
  public SetBreaksec(v: number): void { this.beamSecondary.SetBreaksec(v); }
  public GetBreaksec(): number { return this.beamSecondary.GetBreaksec(); }
  public HasBreaksec(): boolean { return this.beamSecondary.HasBreaksec(); }
  public SetFermata(v: number): void { this.fermataPresent.SetFermata(v); }
  public GetFermata(): number { return this.fermataPresent.GetFermata(); }
  public HasFermata(): boolean { return this.fermataPresent.HasFermata(); }
  public ResetFermataPresent(): void { this.fermataPresent.ResetFermataPresent(); }
  public SetStaff(v: number[]): void { this.staffIdent.SetStaff(v); }
  public GetStaff(): number[] { return this.staffIdent.GetStaff(); }
  public HasStaff(): boolean { return this.staffIdent.HasStaff(); }
  public ResetStaffIdent(): void { this.staffIdent.Reset(); }

  public SetDurDefault(v: data_DURATION): void { this.m_durDefault = v; }
  public GetDurDefault(): data_DURATION { return this.m_durDefault; }

  public GetInterfaceAlignmentDuration(num: number, numBase: number): Fraction {
    let noteDur = this.GetDurGes() !== DURATION_NONE ? this.GetActualDurGes() : this.GetActualDur();
    if (noteDur === DURATION_NONE) noteDur = DURATION_4;
    if (this.HasNum()) num *= this.GetNum();
    if (this.HasNumbase()) numBase *= this.GetNumbase();
    let duration = Fraction.fromDuration(noteDur).multiply(new Fraction(numBase)).divide(new Fraction(num));
    const noteDots = this.HasDotsGes() ? this.GetDotsGes() : this.GetDots();
    if (noteDots !== VRV_UNSET) {
      const reduction = new Fraction(duration.GetNumerator(), duration.GetDenominator() * Math.pow(2, noteDots));
      duration = duration.multiply(new Fraction(2)).subtract(reduction);
    }
    return duration;
  }

  public GetInterfaceAlignmentMensuralDuration(num: number, numBase: number, currentMensur: MensurLike | null, equivalence: data_DURATION): Fraction {
    let noteDur = this.GetDurGes() !== DURATION_NONE ? this.GetActualDurGes() : this.GetActualDur();
    if (noteDur === DURATION_NONE) noteDur = DURATION_4;
    if (!currentMensur) { LogWarning('No current mensur for calculating duration'); return new Fraction(1); }
    if (this.HasNum() || this.HasNumbase()) {
      if (this.HasNum()) num *= this.GetNum();
      if (this.HasNumbase()) numBase *= this.GetNumbase();
    } else if (this.GetDurQuality() === DURQUALITY_mensural_perfecta) {
      if ((this.GetDur() === DURATION_longa && currentMensur.GetModusminor() === MODUSMINOR_2) ||
          (this.GetDur() === DURATION_brevis && currentMensur.GetTempus() === TEMPUS_2) ||
          (this.GetDur() === DURATION_semibrevis && currentMensur.GetProlatio() === PROLATIO_2) ||
          this.GetDur() === DURATION_minima || this.GetDur() === DURATION_semiminima || this.GetDur() === DURATION_fusa || this.GetDur() === DURATION_semifusa) { num *= 2; numBase *= 3; }
    } else if (this.GetDurQuality() === DURQUALITY_mensural_imperfecta) {
      if ((this.GetDur() === DURATION_longa && currentMensur.GetModusminor() !== MODUSMINOR_2) ||
          (this.GetDur() === DURATION_brevis && currentMensur.GetTempus() !== TEMPUS_2) ||
          (this.GetDur() === DURATION_semibrevis && currentMensur.GetProlatio() !== PROLATIO_2)) { num *= 3; numBase *= 2; }
    } else if (this.HasDurQuality() && (this.GetDurQuality() === DURQUALITY_mensural_altera || this.GetDurQuality() === DURQUALITY_mensural_maior || this.GetDurQuality() === DURQUALITY_mensural_duplex)) {
      num *= 1; numBase *= 2;
    }
    let duration: Fraction;
    if (equivalence === DURATION_minima) duration = this.DurationWithMinimaEquivalence(num, numBase, currentMensur, noteDur);
    else if (equivalence === DURATION_semibrevis) duration = this.DurationWithSemibrevisEquivalence(num, numBase, currentMensur, noteDur);
    else duration = this.DurationWithBrevisEquivalence(num, numBase, currentMensur, noteDur);
    return duration.multiply(new Fraction(numBase)).divide(new Fraction(num));
  }

  public DurationWithBrevisEquivalence(_num: number, _numBase: number, mensur: MensurLike, noteDur: data_DURATION): Fraction {
    let duration = Fraction.fromDuration(DURATION_breve);
    switch (noteDur) {
      case DURATION_maxima: duration = duration.multiply(new Fraction(Math.abs(mensur.GetModusminor()))).multiply(new Fraction(Math.abs(mensur.GetModusmaior()))); break;
      case DURATION_long: duration = duration.multiply(new Fraction(Math.abs(mensur.GetModusminor()))); break;
      case DURATION_breve: break;
      case DURATION_1: duration = duration.divide(new Fraction(Math.abs(mensur.GetTempus()))); break;
      default: {
        const ratio = Math.pow(2, noteDur - DURATION_2); if (!ratio) throw new Error('invalid mensural duration ratio');
        duration = duration.divide(new Fraction(Math.abs(mensur.GetTempus()))).divide(new Fraction(Math.abs(mensur.GetProlatio()))).divide(new Fraction(ratio));
      }
    }
    return duration;
  }
  public DurationWithSemibrevisEquivalence(_num: number, _numBase: number, mensur: MensurLike, noteDur: data_DURATION): Fraction {
    let duration = Fraction.fromDuration(DURATION_1);
    switch (noteDur) {
      case DURATION_maxima: duration = duration.multiply(new Fraction(Math.abs(mensur.GetModusmaior())));
      case DURATION_long: duration = duration.multiply(new Fraction(Math.abs(mensur.GetModusminor())));
      case DURATION_breve: duration = duration.multiply(new Fraction(Math.abs(mensur.GetTempus()))); break;
      case DURATION_1: break;
      default: { const ratio = Math.pow(2, noteDur - DURATION_2); if (!ratio) throw new Error('invalid mensural duration ratio'); duration = duration.divide(new Fraction(Math.abs(mensur.GetProlatio()))).divide(new Fraction(ratio)); }
    }
    return duration;
  }
  public DurationWithMinimaEquivalence(_num: number, _numBase: number, mensur: MensurLike, noteDur: data_DURATION): Fraction {
    let duration = Fraction.fromDuration(DURATION_2);
    switch (noteDur) {
      case DURATION_maxima: duration = duration.multiply(new Fraction(Math.abs(mensur.GetModusmaior())));
      case DURATION_long: duration = duration.multiply(new Fraction(Math.abs(mensur.GetModusminor())));
      case DURATION_breve: duration = duration.multiply(new Fraction(Math.abs(mensur.GetTempus())));
      case DURATION_1: duration = duration.multiply(new Fraction(Math.abs(mensur.GetProlatio()))); break;
      default: { const ratio = Math.pow(2, noteDur - DURATION_2); if (!ratio) throw new Error('invalid mensural duration ratio'); duration = duration.divide(new Fraction(ratio)); }
    }
    return duration;
  }

  public IsFirstInBeam(noteOrRest: LayerElementForDurationLike | null): boolean {
    if (!noteOrRest) return false;
    const beam = noteOrRest.GetFirstAncestor(ClassId.BEAM, MAX_BEAM_DEPTH) as BeamLike | null;
    return !!beam && noteOrRest === beam.GetListFront();
  }
  public IsLastInBeam(noteOrRest: LayerElementForDurationLike | null): boolean {
    if (!noteOrRest) return false;
    const beam = noteOrRest.GetFirstAncestor(ClassId.BEAM, MAX_BEAM_DEPTH) as BeamLike | null;
    return !!beam && noteOrRest === beam.GetListBack();
  }
  public GetActualDur(): data_DURATION { return this.CalcActualDur(this.HasDur() ? this.GetDur() : this.GetDurDefault()); }
  public GetActualDurGes(): data_DURATION { return this.CalcActualDur(this.HasDurGes() ? this.GetDurGes() : DURATION_NONE); }
  private CalcActualDur(dur: data_DURATION): data_DURATION {
    if (dur < DURATION_longa) return dur;
    switch (dur) {
      case DURATION_longa: return DURATION_long; case DURATION_brevis: return DURATION_breve; case DURATION_semibrevis: return DURATION_1;
      case DURATION_minima: return DURATION_2; case DURATION_semiminima: return DURATION_4; case DURATION_fusa: return DURATION_8; case DURATION_semifusa: return DURATION_16;
      default: return DURATION_NONE;
    }
  }
  public GetNoteOrChordDur(element: LayerElementForDurationLike): data_DURATION {
    if (element.Is(ClassId.CHORD)) {
      let duration = this.GetActualDur(); if (duration !== DURATION_NONE) return duration;
      const chord = element as ChordLike;
      for (const note of [chord.GetTopNote(), chord.GetBottomNote()]) { duration = note.GetActualDur(); if (duration !== DURATION_NONE) return duration; }
    } else if (element.Is(ClassId.NOTE)) {
      const note = element as NoteLike;
      const chord = note.IsChordTone();
      return (chord && !this.HasDur()) ? chord.GetActualDur() : this.GetActualDur();
    }
    return this.GetActualDur();
  }
  public IsMensuralDur(): boolean { return this.GetDur() === DURATION_maxima || this.GetDur() >= DURATION_longa; }
  public HasIdenticalDurationInterface(_other: DurationInterface | null): boolean { LogError('DurationInterface::HasIdenticalDurationInterface missing'); throw new Error('DurationInterface::HasIdenticalDurationInterface missing'); }

  public SetScoreTimeOnset(v: Fraction): void { this.m_scoreTimeOnset = v; }
  public SetRealTimeOnsetSeconds(v: number): void { this.m_realTimeOnsetMilliseconds = v * 1000.0; }
  public SetScoreTimeOffset(v: Fraction): void { this.m_scoreTimeOffset = v; }
  public SetRealTimeOffsetSeconds(v: number): void { this.m_realTimeOffsetMilliseconds = v * 1000.0; }
  public SetScoreTimeTiedDuration(v: Fraction): void { this.m_scoreTimeTiedDuration = v; }
  public GetScoreTimeOnset(): Fraction { return this.m_scoreTimeOnset; }
  public GetRealTimeOnsetMilliseconds(): number { return this.m_realTimeOnsetMilliseconds; }
  public GetScoreTimeOffset(): Fraction { return this.m_scoreTimeOffset; }
  public GetRealTimeOffsetMilliseconds(): number { return this.m_realTimeOffsetMilliseconds; }
  public GetScoreTimeTiedDuration(): Fraction { return this.m_scoreTimeTiedDuration; }
  public GetScoreTimeDuration(): Fraction { return this.GetScoreTimeOffset().subtract(this.GetScoreTimeOnset()); }
  public IncreaseCMNDuration(): void { const dur = this.GetDur(); if (dur > DURATION_long && dur <= DURATION_1024) this.SetDur(dur - 1); }
  public DecreaseCMNDuration(): void { const dur = this.GetDur(); if (dur >= DURATION_long && dur < DURATION_1024) this.SetDur(dur + 1); }
  public InterfaceResetData(_functor: ResetDataFunctorLike, _object: unknown): FunctorCode { return FunctorCode.FUNCTOR_CONTINUE; }
}
