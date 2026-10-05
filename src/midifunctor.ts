/**
 * midifunctor.ts — canonical translation of the timemap + MIDI slice of
 * src-cpp/src/midifunctor.cpp + src-cpp/include/vrv/midifunctor.h.
 *
 * Covers the eight functors in C++ source order:
 * - InitOnsetOffsetFunctor (DocFunctor, end interface true)
 * - InitMaxMeasureDurationFunctor (Functor, end interface true)
 * - InitTimemapTiesFunctor (Functor, end interface false)
 * - InitTimemapAdjustNotesFunctor (Functor, end interface true)
 * - InitMIDIFunctor (ConstFunctor, end interface false)
 * - GenerateMIDIFunctor (ConstFunctor, end interface true)
 * - GenerateTimemapFunctor (ConstFunctor, end interface false)
 * - GenerateFeaturesFunctor (ConstFunctor, end interface false)
 *
 * Branch order, return codes, accumulation order and sentinel handling follow
 * the canonical C++ source. MIDI functors (InitMIDI/GenerateMIDI) stay out;
 * they remain behind the mock factory boundary until their own pass.
 *
 * TypeScript adaptations:
 * - C++ `Fraction * int` becomes `.multiply(new Fraction(int))`.
 * - `UNACC_GRACENOTE_FRACTION` (C++ Fraction(1,2048)) is rebuilt from the
 *   canonical vrvdef tuple.
 * - `SetNoteOrChordStartStop(..., VRV_UNSET)` default becomes an optional
 *   `stopTime?: Fraction` (`undefined` = unset).
 * - Enum ordinals fragmented across TS modules are defined locally with
 *   canonical values (NOTATIONTYPE_cmn=1, BOOLEAN_true=1, GRACE_acc=1,
 *   arpegLog_ORDER_down=2, graceGrpLog_ATTACH_pre=1,
 *   DURATION_EQ_brevis/semibrevis/minima=0/1/2).
 * - Visitor parameters are `any` structural boundaries (established
 *   convertfunctor.ts pattern); no2323 invented layout/MIDI behavior.
 */

import { ConstFunctor, DocFunctor, Functor } from './functor.js';
import {
  ClassId,
  DURATION_NONE,
  DURATION_4,
  FunctorCode,
  MAX_TUPLET_DEPTH,
  MIDI_TEMPO,
  MIDI_VELOCITY,
  SCORE_TIME_UNIT,
  UNACC_GRACENOTE_FRACTION,
  DURATION_brevis,
  DURATION_minima,
  DURATION_semibrevis,
} from './vrvdef.js';
import { Fraction } from './fraction.js';
import { Tempo } from './tempo.js';
import { LogWarning, UTF32to8 } from './vrv.js';
import type { Fraction as FractionType } from './fraction.js';

/** Minimal timemap contract: structural GetEntry surface used below. */
export interface MidTimemapLike {
  GetEntry(time: FractionType): {
    tstamp: number;
    tempo: number;
    measureOn: string;
    notesOn: string[];
    notesOff: string[];
    restsOn: string[];
    restsOff: string[];
  };
}

// Canonical ordinals (sources: atttypes.h, attconverter.ts).
const NOTATIONTYPE_cmn = 1;
const BOOLEAN_true = 1;
const GRACE_acc = 1;
const arpegLog_ORDER_down = 2;
const graceGrpLog_ATTACH_pre = 1;
const DURATION_EQ_brevis = 0;
const DURATION_EQ_semibrevis = 1;
const DURATION_EQ_minima = 2;
const tremForm_FORM_unmeas = 2;
const pedalLog_DIR_down = 1;
const pedalLog_DIR_up = 2;
const pedalLog_DIR_bounce = 4;
const TEMPERAMENT_equal = 1;
const TEMPERAMENT_just = 2;
const TEMPERAMENT_mean = 3;
const TEMPERAMENT_pythagorean = 4;
const STAFFREL_basic_below = 2;
const OCTAVE_DIS_8 = 8;
const OCTAVE_DIS_15 = 15;
const OCTAVE_DIS_22 = 22;

/** Local meter-params shape; mirrors AlignMeterParams without a runtime cycle. */
export interface MidAlignMeterParams {
  meterSig: any;
  mensur: any;
  proport: any;
  equivalence: number;
  metcon: boolean;
}

/** Doc surface consumed by InitOnsetOffsetFunctor. */
export interface MidDocLike {
  GetOptions(): { m_durationEquivalence: { GetValue(): number } };
}

function scoreUnit(): Fraction {
  return new Fraction(SCORE_TIME_UNIT);
}

function unaccIncrement(tempo: number): Fraction {
  return new Fraction(UNACC_GRACENOTE_FRACTION[0], UNACC_GRACENOTE_FRACTION[1])
    .multiply(new Fraction(Math.trunc(tempo)));
}

function asFraction(value: any): Fraction {
  return value instanceof Fraction ? value : new Fraction(0);
}

function hasNoDur(note: any): boolean {
  if (typeof note.HasDur === 'function' && note.HasDur()) return false;
  if (typeof note.HasDurGes === 'function') return !note.HasDurGes();
  try {
    const iface = note.GetDurationInterface?.();
    if (iface && typeof iface.HasDurGes === 'function') return !iface.HasDurGes() && !note.HasDur?.();
  } catch { /* fall through */ }
  return !note.HasDur?.();
}

function hasSameasLink(element: any): boolean {
  if (!element) return false;
  if (typeof element.HasSameasLink === 'function') return !!element.HasSameasLink();
  try {
    return !!element.GetLinkingInterface?.()?.HasSameasLink?.();
  } catch { return false; }
}

//----------------------------------------------------------------------------
// InitOnsetOffsetFunctor
//----------------------------------------------------------------------------

export class InitOnsetOffsetFunctor extends DocFunctor {
  private m_currentScoreTime: Fraction = new Fraction(0);
  private m_currentRealTimeSeconds = 0.0;
  private m_meterParams: MidAlignMeterParams = {
    meterSig: null, mensur: null, proport: null, equivalence: DURATION_brevis, metcon: true,
  };
  private m_notationType: number = NOTATIONTYPE_cmn;
  private m_currentTempo: number = MIDI_TEMPO;

  public constructor(doc: MidDocLike | any) {
    super(doc);
    const durationEq: Record<number, number> = {
      [DURATION_EQ_brevis]: DURATION_brevis,
      [DURATION_EQ_semibrevis]: DURATION_semibrevis,
      [DURATION_EQ_minima]: DURATION_minima,
    };
    this.m_meterParams.equivalence = durationEq[doc.GetOptions().m_durationEquivalence.GetValue()];
  }

  public ImplementsEndInterface(): boolean { return true; }

  public VisitChordEnd(chord: any): FunctorCode {
    const element = chord.ThisOrSameasLink();
    const incrementScoreTime = element.GetAlignmentDuration(this.m_meterParams, true, this.m_notationType).multiply(scoreUnit());
    const realTimeIncrementSeconds = incrementScoreTime.ToDouble() * 60.0 / this.m_currentTempo;
    this.m_currentScoreTime = this.m_currentScoreTime.add(incrementScoreTime);
    this.m_currentRealTimeSeconds += realTimeIncrementSeconds;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayer(layer: any): FunctorCode {
    this.m_currentScoreTime = new Fraction(0);
    this.m_currentRealTimeSeconds = 0.0;
    this.m_meterParams.mensur = layer.GetCurrentMensur();
    this.m_meterParams.meterSig = layer.GetCurrentMeterSig();
    this.m_meterParams.proport = layer.GetCurrentProport();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: any): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;
    const element = layerElement.ThisOrSameasLink();
    let incrementScoreTime: Fraction;

    if (element.Is(ClassId.REST) || element.Is(ClassId.SPACE)) {
      incrementScoreTime = element.GetAlignmentDuration(this.m_meterParams, true, this.m_notationType).multiply(scoreUnit());
      if (element.Is(ClassId.REST)) {
        const realTimeIncrementSeconds = incrementScoreTime.ToDouble() * 60.0 / this.m_currentTempo;
        element.SetScoreTimeOnset(this.m_currentScoreTime);
        element.SetRealTimeOnsetSeconds(this.m_currentRealTimeSeconds);
        element.SetScoreTimeOffset(this.m_currentScoreTime.add(incrementScoreTime));
        element.SetRealTimeOffsetSeconds(this.m_currentRealTimeSeconds + realTimeIncrementSeconds);
      }
      this.m_currentScoreTime = this.m_currentScoreTime.add(incrementScoreTime);
      this.m_currentRealTimeSeconds += incrementScoreTime.ToDouble() * 60.0 / this.m_currentTempo;
    } else if (element.Is(ClassId.NOTE)) {
      const note = element;
      if (note.IsGraceNote()) {
        note.SetScoreTimeOnset(this.m_currentScoreTime);
        note.SetRealTimeOnsetSeconds(this.m_currentRealTimeSeconds);
        return FunctorCode.FUNCTOR_CONTINUE;
      }
      const chord = note.IsChordTone();
      const tabGrp = note.IsTabGrpNote();
      if (chord && hasNoDur(note)) {
        incrementScoreTime = chord.GetAlignmentDuration(this.m_meterParams, true, this.m_notationType).multiply(scoreUnit());
      } else if (tabGrp && hasNoDur(note)) {
        incrementScoreTime = tabGrp.GetAlignmentDuration(this.m_meterParams, true, this.m_notationType).multiply(scoreUnit());
      } else {
        incrementScoreTime = note.GetAlignmentDuration(this.m_meterParams, true, this.m_notationType).multiply(scoreUnit());
      }
      const realTimeIncrementSeconds = incrementScoreTime.ToDouble() * 60.0 / this.m_currentTempo;
      const storeNote = (layerElement === element) ? note : layerElement;
      if (storeNote && typeof storeNote.SetScoreTimeOnset === 'function') {
        storeNote.SetScoreTimeOnset(this.m_currentScoreTime);
        storeNote.SetRealTimeOnsetSeconds(this.m_currentRealTimeSeconds);
        storeNote.SetScoreTimeOffset(this.m_currentScoreTime.add(incrementScoreTime));
        storeNote.SetRealTimeOffsetSeconds(this.m_currentRealTimeSeconds + realTimeIncrementSeconds);
      }
      if (!note.IsChordTone() && !note.IsTabGrpNote()) {
        this.m_currentScoreTime = this.m_currentScoreTime.add(incrementScoreTime);
        this.m_currentRealTimeSeconds += realTimeIncrementSeconds;
      }
    } else if (element.Is(ClassId.BEATRPT)) {
      const rpt = element;
      incrementScoreTime = rpt.GetAlignmentDuration(this.m_meterParams, true, this.m_notationType).multiply(scoreUnit());
      rpt.SetScoreTimeOnset(this.m_currentScoreTime);
      this.m_currentScoreTime = this.m_currentScoreTime.add(incrementScoreTime);
      this.m_currentRealTimeSeconds += incrementScoreTime.ToDouble() * 60.0 / this.m_currentTempo;
    } else if (layerElement.IsAnyOf([ClassId.BEAM, ClassId.LIGATURE, ClassId.FTREM, ClassId.TUPLET])
      && hasSameasLink(layerElement)) {
      incrementScoreTime = layerElement
        .GetSameAsContentAlignmentDuration(this.m_meterParams, true, this.m_notationType).multiply(scoreUnit());
      this.m_currentScoreTime = this.m_currentScoreTime.add(incrementScoreTime);
      this.m_currentRealTimeSeconds += incrementScoreTime.ToDouble() * 60.0 / this.m_currentTempo;
    } else if (layerElement.Is(ClassId.MENSUR)) {
      this.m_meterParams.mensur = layerElement;
    } else if (layerElement.Is(ClassId.METERSIG)) {
      this.m_meterParams.meterSig = layerElement;
    } else if (layerElement.Is(ClassId.PROPORT)) {
      if (typeof layerElement.GetType === 'function' && layerElement.GetType() === 'cmme_tempo_change') {
        return FunctorCode.FUNCTOR_SIBLINGS;
      }
      const previous = this.m_meterParams.proport ? this.m_meterParams.proport : null;
      this.m_meterParams.proport = layerElement;
      if (!this.m_meterParams.proport) throw new Error('InitOnsetOffsetFunctor::VisitLayerElement requires Proport.');
      if (previous && typeof this.m_meterParams.proport.Cumulate === 'function') {
        this.m_meterParams.proport.Cumulate(previous);
      }
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: any): FunctorCode {
    this.m_currentTempo = measure.GetCurrentTempo();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: any): FunctorCode {
    const drawingStaffDef = typeof staff.GetDrawingStaffDef === 'function'
      ? staff.GetDrawingStaffDef()
      : staff.m_drawingStaffDef;
    if (!drawingStaffDef) throw new Error('InitOnsetOffsetFunctor::VisitStaff requires drawing StaffDef.');
    this.m_notationType = drawingStaffDef.HasNotationtype() ? drawingStaffDef.GetNotationtype() : NOTATIONTYPE_cmn;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTabGrpEnd(tabGrp: any): FunctorCode {
    const element = tabGrp.ThisOrSameasLink();
    const incrementScoreTime = element.GetAlignmentDuration(this.m_meterParams, true, this.m_notationType).multiply(scoreUnit());
    const realTimeIncrementSeconds = incrementScoreTime.ToDouble() * 60.0 / this.m_currentTempo;
    this.m_currentScoreTime = this.m_currentScoreTime.add(incrementScoreTime);
    this.m_currentRealTimeSeconds += realTimeIncrementSeconds;
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// InitMaxMeasureDurationFunctor
//----------------------------------------------------------------------------

export class InitMaxMeasureDurationFunctor extends Functor {
  private m_currentScoreTime: Fraction = new Fraction(0);
  private m_currentRealTimeSeconds = 0.0;
  private m_currentTempo: number = MIDI_TEMPO;
  private m_tempoAdjustment = 1.0;
  private m_multiRestFactor = 1;

  public ImplementsEndInterface(): boolean { return true; }

  public SetCurrentTempo(tempo: number): void { this.m_currentTempo = tempo; }
  public SetTempoAdjustment(adjustment: number): void { this.m_tempoAdjustment = adjustment; }
  public GetCurrentTempo(): number { return this.m_currentTempo; }
  public GetTempoAdjustment(): number { return this.m_tempoAdjustment; }
  public GetAdjustedTempo(): number { return this.m_currentTempo * this.m_tempoAdjustment; }

  public VisitLayerElement(layerElement: any): FunctorCode {
    if (layerElement.Is(ClassId.MULTIREST)) {
      this.m_multiRestFactor = layerElement.GetNum();
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasure(measure: any): FunctorCode {
    measure.ClearScoreTimeOnset();
    measure.AddScoreTimeOnset(this.m_currentScoreTime);
    measure.ClearRealTimeOnsetMilliseconds();
    measure.AddRealTimeOnsetMilliseconds(this.m_currentRealTimeSeconds * 1000.0);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasureEnd(measure: any): FunctorCode {
    const tempo = this.GetAdjustedTempo();
    measure.SetCurrentTempo(tempo);
    const scoreTimeIncrement = measure.m_measureAligner.GetRightAlignment().GetTime()
      .multiply(new Fraction(this.m_multiRestFactor)).multiply(scoreUnit());
    this.m_currentScoreTime = this.m_currentScoreTime.add(scoreTimeIncrement);
    this.m_currentRealTimeSeconds += scoreTimeIncrement.ToDouble() * 60.0 / tempo;
    measure.ClearScoreTimeOffset();
    measure.AddScoreTimeOffset(this.m_currentScoreTime);
    measure.ClearRealTimeOffsetMilliseconds();
    measure.AddRealTimeOffsetMilliseconds(this.m_currentRealTimeSeconds * 1000.0);
    this.m_multiRestFactor = 1;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScoreDef(scoreDef: any): FunctorCode {
    if (scoreDef.HasMidiBpm()) {
      this.m_currentTempo = scoreDef.GetMidiBpm();
    } else if (scoreDef.HasMm()) {
      this.m_currentTempo = Tempo.CalcTempo(scoreDef);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTempo(tempo: any): FunctorCode {
    if (tempo.HasMidiBpm()) {
      this.m_currentTempo = tempo.GetMidiBpm();
    } else if (tempo.HasMm()) {
      this.m_currentTempo = Tempo.CalcTempo(tempo);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// InitTimemapTiesFunctor
//----------------------------------------------------------------------------

export class InitTimemapTiesFunctor extends Functor {
  public ImplementsEndInterface(): boolean { return false; }

  public VisitTie(tie: any): FunctorCode {
    const note1 = tie.GetStart();
    const note2 = tie.GetEnd();
    if (!note1 || !note2 || !note1.Is?.(ClassId.NOTE) || !note2.Is?.(ClassId.NOTE)) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    const sttd2: Fraction = asFraction(note2.GetScoreTimeTiedDuration());
    const std2: Fraction = asFraction(note2.GetScoreTimeDuration());
    if (sttd2.compare(new Fraction(0)) > 0) {
      note1.SetScoreTimeTiedDuration(sttd2.add(std2));
    } else {
      note1.SetScoreTimeTiedDuration(std2);
    }
    note2.SetScoreTimeTiedDuration(new Fraction(-1));
    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}

//----------------------------------------------------------------------------
// InitTimemapAdjustNotesFunctor
//----------------------------------------------------------------------------

export interface MidGraceEntry {
  notes: any[];
  duration: any;
  time: number;
}

export class InitTimemapAdjustNotesFunctor extends Functor {
  private m_noCue = false;
  private m_graces: MidGraceEntry[] = [];
  private m_accentedGraceNote = false;
  private m_currentTempo: number = MIDI_TEMPO;
  private m_lastNote: any = null;

  public ImplementsEndInterface(): boolean { return true; }

  public SetNoCue(noCue: boolean): void { this.m_noCue = noCue; }
  public GetNoCue(): boolean { return this.m_noCue; }

  public VisitArpeg(arpeg: any): FunctorCode {
    const order = typeof arpeg.GetOrder === 'function' ? arpeg.GetOrder() : 0;
    const playTopDown = order === arpegLog_ORDER_down;
    const notes: Set<any> = arpeg.GetNotes();
    if (notes.size === 0) return FunctorCode.FUNCTOR_CONTINUE;
    const sortedNotes = [...notes];
    sortedNotes.sort((a: any, b: any) => {
      const pitch1 = a.GetMIDIPitch();
      const pitch2 = b.GetMIDIPitch();
      return playTopDown ? pitch2 - pitch1 : pitch1 - pitch2;
    });
    let shift = new Fraction(0);
    const startTime: Fraction = asFraction(sortedNotes[0].GetScoreTimeOnset());
    const increment = unaccIncrement(this.m_currentTempo);
    for (const note of sortedNotes) {
      if (!shift.equals(new Fraction(0))) this.SetNoteStartStop(note, startTime.add(shift));
      shift = shift.add(increment);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitChord(chord: any): FunctorCode {
    if (chord.IsGraceNote()) {
      const notes: any[] = [];
      for (const obj of chord.GetList()) notes.push(obj);
      this.m_accentedGraceNote = chord.GetGrace() === GRACE_acc;
      let time = chord.HasGraceTime() ? chord.GetGraceTime() : 50.0;
      const graceGrp = chord.GetFirstAncestor(ClassId.GRACEGRP);
      if (graceGrp) {
        if (graceGrp.GetGrace() === GRACE_acc) this.m_accentedGraceNote = true;
        time = graceGrp.HasGraceTime() ? graceGrp.GetGraceTime() : 50.0;
      }
      this.m_graces.push({ notes, duration: chord.GetActualDur(), time });
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitGraceGrpEnd(graceGrp: any): FunctorCode {
    if (this.m_graces.length > 0 && graceGrp.GetAttach() === graceGrpLog_ATTACH_pre
      && !this.m_accentedGraceNote && this.m_lastNote) {
      let startTime: Fraction = asFraction(this.m_lastNote.GetScoreTimeOffset());
      const graceNoteDur = unaccIncrement(this.m_currentTempo);
      const totalDur = graceNoteDur.multiply(new Fraction(this.m_graces.length));
      startTime = startTime.subtract(totalDur);
      if (startTime.compare(new Fraction(0)) < 0) startTime = new Fraction(0);
      for (const grace of this.m_graces) {
        const stopTime = startTime.add(graceNoteDur);
        for (const note of grace.notes) this.SetNoteStartStop(note, startTime, stopTime);
        startTime = stopTime;
      }
      this.m_graces = [];
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerEnd(_layer: any): FunctorCode {
    if (this.m_graces.length > 0 && this.m_graces[0].notes.length > 0) {
      let startTime: Fraction = asFraction(this.m_graces[0].notes[0].GetScoreTimeOnset());
      const graceNoteDur = unaccIncrement(this.m_currentTempo);
      const totalDur = graceNoteDur.multiply(new Fraction(this.m_graces.length));
      startTime = startTime.subtract(totalDur);
      if (startTime.compare(new Fraction(0)) < 0) startTime = new Fraction(0);
      if (this.m_lastNote && this.m_lastNote.GetScoreTimeOffset().compare(startTime) > 0
        && this.m_lastNote.GetScoreTimeOnset().compare(startTime) < 0) {
        this.SetNoteOrChordStartStop(this.m_lastNote, asFraction(this.m_lastNote.GetScoreTimeOnset()), startTime);
      }
      for (const grace of this.m_graces) {
        const stopTime = startTime.add(graceNoteDur);
        for (const note of grace.notes) this.SetNoteStartStop(note, startTime, stopTime);
        startTime = stopTime;
      }
      this.m_graces = [];
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: any): FunctorCode {
    this.m_currentTempo = measure.GetCurrentTempo();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNote(note: any): FunctorCode {
    if (hasSameasLink(note)) return FunctorCode.FUNCTOR_SIBLINGS;
    if (note.GetCue() === BOOLEAN_true && this.m_noCue) return FunctorCode.FUNCTOR_SIBLINGS;
    if (asFraction(note.GetScoreTimeTiedDuration()).compare(new Fraction(0)) < 0) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    if (note.IsGraceNote()) {
      this.m_accentedGraceNote = note.GetGrace() === GRACE_acc;
      let time = note.HasGraceTime() ? note.GetGraceTime() : 50.0;
      const graceGrp = note.GetFirstAncestor(ClassId.GRACEGRP);
      if (graceGrp) {
        if (graceGrp.GetGrace() === GRACE_acc) this.m_accentedGraceNote = true;
        time = graceGrp.HasGraceTime() ? graceGrp.GetGraceTime() : 50.0;
      }
      this.m_graces.push({ notes: [note], duration: note.GetDur(), time });
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    if (this.m_graces.length > 0) {
      this.SetGraceNotesFor(note);
      this.m_graces = [];
    }
    this.m_lastNote = note;
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public SetGraceNotesFor(refNote: any): void {
    let startTime: Fraction = asFraction(refNote.GetScoreTimeOnset());
    let graceNoteDur: Fraction;
    if (this.m_accentedGraceNote && this.m_graces.length > 0) {
      let percent = this.m_graces[0].time;
      percent = Math.min(95.0, Math.max(5.0, percent));
      const totalDur = asFraction(refNote.GetScoreTimeDuration())
        .multiply(new Fraction(Math.trunc(percent))).divide(new Fraction(100));
      this.SetNoteOrChordStartStop(refNote, startTime.add(totalDur));
      graceNoteDur = totalDur.divide(new Fraction(this.m_graces.length));
    } else {
      graceNoteDur = unaccIncrement(this.m_currentTempo);
      const totalDur = graceNoteDur.multiply(new Fraction(this.m_graces.length));
      if (startTime.compare(totalDur) >= 0) {
        startTime = startTime.subtract(totalDur);
      } else {
        this.SetNoteOrChordStartStop(refNote, startTime.add(totalDur));
      }
    }
    for (const grace of this.m_graces) {
      const stopTime = startTime.add(graceNoteDur);
      for (const note of grace.notes) this.SetNoteStartStop(note, startTime, stopTime);
      startTime = stopTime;
    }
  }

  public SetNoteOrChordStartStop(note: any, startTime: Fraction, stopTime?: Fraction): void {
    const chord = note.IsChordTone?.();
    if (chord) {
      const notes = chord.FindAllDescendantsByType(ClassId.NOTE);
      for (const child of notes) this.SetNoteStartStop(child, startTime, stopTime);
    } else {
      this.SetNoteStartStop(note, startTime, stopTime);
    }
  }

  public SetNoteStartStop(note: any, startTime: Fraction, stopTime?: Fraction): void {
    if (!note) throw new Error('InitTimemapAdjustNotesFunctor::SetNoteStartStop requires a note.');
    note.SetScoreTimeOnset(startTime);
    note.SetRealTimeOnsetSeconds(startTime.ToDouble() * 60.0 / this.m_currentTempo);
    if (stopTime !== undefined) {
      note.SetScoreTimeOffset(stopTime);
      note.SetRealTimeOffsetSeconds(stopTime.ToDouble() * 60.0 / this.m_currentTempo);
    }
  }
}

//----------------------------------------------------------------------------
// GenerateTimemapFunctor
//----------------------------------------------------------------------------

export class GenerateTimemapFunctor extends ConstFunctor {
  private m_currentScoreTime: Fraction = new Fraction(0);
  private m_currentRealTimeMilliseconds = 0.0;
  private m_currentTempo: number = MIDI_TEMPO;
  private m_noCue = false;
  private m_timemap: MidTimemapLike;

  public constructor(timemap: MidTimemapLike) {
    super();
    this.m_timemap = timemap;
  }

  public ImplementsEndInterface(): boolean { return false; }

  public SetNoCue(noCue: boolean): void { this.m_noCue = noCue; }
  public GetNoCue(): boolean { return this.m_noCue; }
  public GetTimemap(): MidTimemapLike { return this.m_timemap; }

  public VisitLayerElement(layerElement: any): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;
    const sameas = typeof layerElement.GetSameasLink === 'function'
      ? layerElement.GetSameasLink()
      : layerElement.GetLinkingInterface?.()?.GetSameasLink?.();
    if (sameas && !hasSameasLink(sameas) && typeof sameas.Process === 'function') {
      sameas.Process(this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: any): FunctorCode {
    this.m_currentScoreTime = asFraction(measure.GetScoreTimeOnset());
    this.m_currentRealTimeMilliseconds = measure.GetRealTimeOnsetMilliseconds();
    this.m_currentTempo = measure.GetCurrentTempo();
    this.AddTimemapEntry(measure);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMRest(mRest: any): FunctorCode {
    this.AddTimemapEntry(mRest);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMultiRest(multiRest: any): FunctorCode {
    this.AddTimemapEntry(multiRest);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitNote(note: any): FunctorCode {
    if (note.GetCue() === BOOLEAN_true && this.m_noCue) return FunctorCode.FUNCTOR_SIBLINGS;
    const resolved = typeof note.ThisOrSameasLink === 'function' ? note.ThisOrSameasLink() : note;
    if (!resolved) throw new Error('GenerateTimemapFunctor::VisitNote requires a note.');
    this.AddTimemapEntry(resolved);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitRest(rest: any): FunctorCode {
    this.AddTimemapEntry(rest);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitStaff(staff: any): FunctorCode {
    if (staff.IsOssia()) return FunctorCode.FUNCTOR_SIBLINGS;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public AddTimemapEntry(object: any): void {
    if (!object) throw new Error('GenerateTimemapFunctor::AddTimemapEntry requires an object.');
    if (object.IsAnyOf([ClassId.NOTE, ClassId.REST])) {
      const iface = object.GetDurationInterface();
      if (!iface) throw new Error('GenerateTimemapFunctor::AddTimemapEntry requires DurationInterface.');
      const scoreTimeStart = this.m_currentScoreTime.add(asFraction(iface.GetScoreTimeOnset()));
      const realTimeStart = Math.round(this.m_currentRealTimeMilliseconds + iface.GetRealTimeOnsetMilliseconds());
      const scoreTimeEnd = this.m_currentScoreTime.add(asFraction(iface.GetScoreTimeOffset()));
      const realTimeEnd = Math.round(this.m_currentRealTimeMilliseconds + iface.GetRealTimeOffsetMilliseconds());
      const isRest = object.Is(ClassId.REST);
      const startEntry = this.m_timemap.GetEntry(scoreTimeStart);
      startEntry.tstamp = realTimeStart;
      if (!isRest) startEntry.notesOn.push(object.GetID());
      if (isRest) startEntry.restsOn.push(object.GetID());
      startEntry.tempo = this.m_currentTempo;
      const endEntry = this.m_timemap.GetEntry(scoreTimeEnd);
      endEntry.tstamp = realTimeEnd;
      if (!isRest) endEntry.notesOff.push(object.GetID());
      if (isRest) endEntry.restsOff.push(object.GetID());
    } else if (object.Is(ClassId.MEASURE)) {
      const scoreTimeStart = this.m_currentScoreTime;
      const realTimeStart = Math.round(this.m_currentRealTimeMilliseconds);
      const startEntry = this.m_timemap.GetEntry(scoreTimeStart);
      startEntry.tstamp = realTimeStart;
      startEntry.measureOn = object.GetID();
    } else if (object.IsAnyOf([ClassId.MREST, ClassId.MULTIREST])) {
      const measure = object.GetFirstAncestor(ClassId.MEASURE);
      if (!measure) throw new Error('GenerateTimemapFunctor::AddTimemapEntry requires ancestor Measure.');
      const scoreTimeStart = this.m_currentScoreTime;
      const realTimeStart = Math.round(this.m_currentRealTimeMilliseconds);
      const scoreTimeEnd = asFraction(measure.GetScoreTimeOffset());
      const realTimeEnd = Math.round(measure.GetRealTimeOffsetMilliseconds());
      const startEntry = this.m_timemap.GetEntry(scoreTimeStart);
      startEntry.tstamp = realTimeStart;
      startEntry.restsOn.push(object.GetID());
      const endEntry = this.m_timemap.GetEntry(scoreTimeEnd);
      endEntry.tstamp = realTimeEnd;
      endEntry.restsOff.push(object.GetID());
    }
  }
}

//----------------------------------------------------------------------------
// InitMIDIFunctor
//----------------------------------------------------------------------------

/** Helper struct to store octave data (C++ OctaveInfo). */
export interface OctaveInfo {
  octave: any;
  staffN: number;
  layerN: number;
  octaveShift: number;
  isActive: boolean;
}

/** This class initializes the MIDI export. Captures information (i.e. from
 * control elements) for MIDI interpretation which is required beforehand in
 * GenerateMIDI. */
export class InitMIDIFunctor extends ConstFunctor {
  private m_currentTempo: number = MIDI_TEMPO;
  private m_octaves: OctaveInfo[] = [];

  public constructor() {
    super();
  }

  public ImplementsEndInterface(): boolean { return false; }

  public SetCurrentTempo(tempo: number): void { this.m_currentTempo = tempo; }
  public GetOctaves(): OctaveInfo[] { return this.m_octaves; }

  public VisitMeasure(measure: any): FunctorCode {
    this.m_currentTempo = measure.GetCurrentTempo();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitOctave(octave: any): FunctorCode {
    const measure = octave.GetFirstAncestor(ClassId.MEASURE);
    if (!measure) throw new Error('InitMIDIFunctor::VisitOctave requires ancestor Measure.');
    const staffList = octave.GetTstampStaves(measure, octave);
    if (staffList.length !== 1) return FunctorCode.FUNCTOR_CONTINUE;
    const staff = staffList[0];

    const raisePitch = octave.GetDisPlace() !== STAFFREL_basic_below;
    let shift = 0;
    switch (octave.GetDis()) {
      case OCTAVE_DIS_8: shift = 1; break;
      case OCTAVE_DIS_15: shift = 2; break;
      case OCTAVE_DIS_22: shift = 3; break;
      default: break;
    }

    const layer = raisePitch ? staff.GetFirst(ClassId.LAYER) : staff.GetLast(ClassId.LAYER);
    if (!layer) throw new Error('InitMIDIFunctor::VisitOctave requires a Layer.');

    this.m_octaves.push({
      octave,
      staffN: staff.GetN(),
      layerN: layer.GetN(),
      octaveShift: raisePitch ? shift : -shift,
      isActive: false,
    });

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// GenerateMIDIFunctor
//----------------------------------------------------------------------------

/** Note sequences which replace notes in MIDI output due to expanded ornaments and tremolandi. */
export interface MIDINote {
  pitch: number;
  duration: number;
}

export type MIDINoteSequence = MIDINote[];

/** Helper struct for held notes in tablature. */
export interface MIDIHeldNote {
  m_pitch: number;
  m_stopTime: number;
}

/** This class performs the export to a MidiFile. */
export class GenerateMIDIFunctor extends ConstFunctor {
  private m_midiFile: any;
  private m_midiTrack = 1;
  private m_midiChannel = 0;
  private m_totalTime = 0.0;
  private m_staffN = 0;
  private m_layerN = 0;
  private m_transSemi = 0;
  private m_octaveShift = 0;
  private m_currentTempo: number = MIDI_TEMPO;
  private m_tempoEventTicks = new Set<number>();
  private m_lastNote: any = null;
  private m_expandedNotes = new Map<any, MIDINoteSequence>();
  private m_deferredNotes = new Map<any, number>();
  private m_octaves: OctaveInfo[] = [];
  private m_noCue = false;
  private m_heldNotes: MIDIHeldNote[] = [];
  private m_controlEvents = false;
  private m_instrDef: any = null;
  private m_customTuning: any = null;

  public constructor(midiFile: any) {
    super();
    this.m_midiFile = midiFile;
  }

  public ImplementsEndInterface(): boolean { return true; }

  public GetTempoEventTicks(): Set<number> { return this.m_tempoEventTicks; }

  public SetChannel(channel: number): void { this.m_midiChannel = channel; }
  public SetControlEvents(controlEvents: boolean): void { this.m_controlEvents = controlEvents; }
  public SetNoCue(noCue: boolean): void { this.m_noCue = noCue; }
  public SetCurrentTempo(tempo: number): void { this.m_currentTempo = tempo; }
  public SetDeferredNotes(deferredNotes: Map<any, number>): void { this.m_deferredNotes = deferredNotes; }
  public SetLayerN(layerN: number): void { this.m_layerN = layerN; }
  public SetOctaves(octaves: OctaveInfo[]): void { this.m_octaves = octaves; }
  public SetStaffN(staffN: number): void { this.m_staffN = staffN; }
  public SetTempoEventTicks(ticks: Set<number>): void { this.m_tempoEventTicks = ticks; }
  public SetTrack(track: number): void { this.m_midiTrack = track; }
  public SetTransSemi(transSemi: number): void { this.m_transSemi = transSemi; }
  public SetInstrDef(instrDef: any): void { this.m_instrDef = instrDef; }
  public SetCustomTuning(customTuning: any): void { this.m_customTuning = customTuning; }

  public VisitBeatRpt(beatRpt: any): FunctorCode {
    // Sameas not taken into account for now
    const params: MidAlignMeterParams = {
      meterSig: null, mensur: null, proport: null, equivalence: DURATION_brevis, metcon: true,
    };
    const beatLength = beatRpt.GetAlignmentDuration(params).ToDouble() * SCORE_TIME_UNIT;
    const startTime = this.m_totalTime + beatRpt.GetScoreTimeOnset().ToDouble();
    const tpq = this.m_midiFile.getTPQ();

    // filter last beat and copy all notes
    const eventCount = this.m_midiFile.getEventCount(this.m_midiTrack);
    for (let i = 0; i < eventCount; ++i) {
      const event = this.m_midiFile.getEvent(this.m_midiTrack, i);
      if (event.tick > startTime * tpq) break;
      else if (event.tick >= (startTime - beatLength) * tpq) {
        if (((event[0] & 0xf0) === 0x80) || ((event[0] & 0xf0) === 0x90)) {
          this.m_midiFile.addEventCopy(event);
          const copy = this.m_midiFile.getEvent(this.m_midiTrack, this.m_midiFile.getEventCount(this.m_midiTrack) - 1);
          copy.tick = event.tick + beatLength * tpq;
        }
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitBTrem(bTrem: any): FunctorCode {
    // Do nothing if the tremolo is unmeasured
    if (bTrem.GetForm() === tremForm_FORM_unmeas) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    // Adjust duration of the bTrem if it's nested within tuplet
    let num = 0;
    const tuplet = bTrem.GetFirstAncestor(ClassId.TUPLET, MAX_TUPLET_DEPTH);
    if (tuplet) {
      num = tuplet.GetNum() > 0 ? tuplet.GetNum() : 0;
    }
    // Get num value if it's set
    if (bTrem.HasNum()) {
      num = bTrem.GetNum();
    }

    // Calculate duration of individual note in tremolo
    const individualNoteDur = bTrem.CalcIndividualNoteDuration();
    if (individualNoteDur === DURATION_NONE) return FunctorCode.FUNCTOR_CONTINUE;
    const noteInQuarterDur = Math.pow(2.0, DURATION_4 - individualNoteDur);

    // Expand one note into multiple individual notes of the same pitch
    const expandNote = (obj: any): void => {
      const note = obj;
      if (!note) throw new Error('GenerateMIDIFunctor::VisitBTrem requires a note.');
      const pitch = this.GetMIDIPitch(note);
      const totalInQuarterDur
        = note.GetScoreTimeDuration().ToDouble() + note.GetScoreTimeTiedDuration().ToDouble();
      let multiplicity = Math.trunc(totalInQuarterDur / noteInQuarterDur);
      let noteDuration = noteInQuarterDur;
      // if NUM has been set for the bTrem, override calculated values
      if (num) {
        multiplicity = num;
        noteDuration = totalInQuarterDur / num;
      }
      this.m_expandedNotes.set(note, Array.from({ length: multiplicity }, () => ({ pitch, duration: noteDuration })));
    };

    // Apply expansion either to all notes in chord or to first note
    const chord = bTrem.FindDescendantByType(ClassId.CHORD);
    if (chord) {
      const notes = chord.FindAllDescendantsByType(ClassId.NOTE, false);
      for (const note of notes) expandNote(note);
    } else {
      const note = bTrem.FindDescendantByType(ClassId.NOTE);
      if (note) expandNote(note);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitChord(chord: any): FunctorCode {
    this.HandleOctave(chord);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitFTrem(fTrem: any): FunctorCode {
    this.HandleOctave(fTrem);

    if (fTrem.HasUnitdur()) {
      LogWarning('FTrem produces incorrect MIDI output');
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitHalfmRpt(_halfmRpt: any): FunctorCode {
    LogWarning('HalfmRpt produces empty MIDI output');
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayer(layer: any): FunctorCode {
    if ((layer.GetCue() === BOOLEAN_true) && this.m_noCue) return FunctorCode.FUNCTOR_SIBLINGS;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerEnd(_layer: any): FunctorCode {
    // stop all previously held notes
    for (const held of this.m_heldNotes) {
      if (held.m_pitch > 0) {
        this.m_midiFile.addNoteOff(
          this.m_midiTrack, Math.max(0.0, held.m_stopTime * this.m_midiFile.getTPQ() - 1),
          this.m_midiChannel, held.m_pitch);
      }
    }

    this.m_heldNotes = [];

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: any): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    this.HandleOctave(layerElement);

    // Only resolve simple sameas links to avoid infinite recursion
    const sameas = layerElement.GetSameasLink();
    if (sameas && !sameas.HasSameasLink()) {
      sameas.Process(this);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: any): FunctorCode {
    // Here we need to update the m_totalTime from the starting time of the measure.
    this.m_totalTime = measure.GetScoreTimeOnset().ToDouble();

    if ((this.m_totalTime === 0.0) || (measure.GetCurrentTempo() !== this.m_currentTempo)) {
      this.m_currentTempo = measure.GetCurrentTempo();
      const tick = Math.trunc(this.m_totalTime * this.m_midiFile.getTPQ());
      // Check if there was already a tempo event added for the given tick
      if (!this.m_tempoEventTicks.has(tick)) {
        this.m_tempoEventTicks.add(tick);
        this.m_midiFile.addTempo(0, tick, this.m_currentTempo);
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMRpt(_mRpt: any): FunctorCode {
    LogWarning('MRpt produces empty MIDI output');
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNote(note: any): FunctorCode {
    this.HandleOctave(note);

    // Skip linked notes
    if (note.HasSameasLink()) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    // Skip cue notes when midiNoCue is activated
    if ((note.GetCue() === BOOLEAN_true) && this.m_noCue) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    // If the note is a secondary tied note, then ignore it
    if (note.GetScoreTimeTiedDuration().compare(new Fraction(0)) < 0) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    const velocity = note.HasVel() ? note.GetVel() : MIDI_VELOCITY;
    if (!velocity) return FunctorCode.FUNCTOR_SIBLINGS;

    const channel = this.m_midiChannel;
    const tpq = this.m_midiFile.getTPQ();
    let startTime = this.m_totalTime + note.GetScoreTimeOnset().ToDouble();

    // Check if note is deferred
    if (this.m_deferredNotes.has(note)) {
      startTime += this.m_deferredNotes.get(note)!;
      this.m_deferredNotes.delete(note);
    }

    // Check if note was expanded into sequence of short notes due to trills/tremolandi
    // Play either the expanded note sequence or a single note
    if (this.m_expandedNotes.has(note)) {
      for (const midiNote of this.m_expandedNotes.get(note)!) {
        const stopTime = startTime + midiNote.duration;

        this.m_midiFile.addNoteOn(this.m_midiTrack, startTime * tpq, channel, midiNote.pitch, velocity);
        this.m_midiFile.addNoteOff(this.m_midiTrack, Math.max(0.0, stopTime * tpq - 1), channel, midiNote.pitch);

        startTime = stopTime;
      }
    } else {
      const pitch = this.GetMIDIPitch(note);

      if (note.HasTabCourse() && (note.GetTabCourse() >= 1)) {
        // Tablature 'rule of holds'. A note on a course is held until the next note
        // on that course is required, or until a default hold duration is reached.

        const course = note.GetTabCourse();
        if (this.m_heldNotes.length < course) {
          this.m_heldNotes.length = course; // make room (fills with undefined → normalized below)
          for (let i = 0; i < this.m_heldNotes.length; ++i) {
            if (!this.m_heldNotes[i]) this.m_heldNotes[i] = { m_pitch: 0, m_stopTime: 0 };
          }
        }

        // if a previously held note on this course is already sounding, end it now.
        if (this.m_heldNotes[course - 1].m_pitch > 0) {
          this.m_heldNotes[course - 1].m_stopTime = startTime; // stop now
        }

        // end all previously held notes that have reached their stoptime
        // or if the new pitch is already sounding, on any course
        for (const held of this.m_heldNotes) {
          if ((held.m_pitch > 0) && ((held.m_stopTime <= startTime) || (held.m_pitch === pitch))) {
            this.m_midiFile.addNoteOff(
              this.m_midiTrack, Math.max(0.0, held.m_stopTime * tpq - 1), channel, held.m_pitch);
            held.m_pitch = 0;
            held.m_stopTime = 0;
          }
        }

        // hold this note until the greater of its rhythm sign and the default duration.
        // TODO optimize the default hold duration
        const defaultHoldTime = 4; // quarter notes
        this.m_heldNotes[course - 1].m_pitch = pitch;
        this.m_heldNotes[course - 1].m_stopTime = this.m_totalTime
          + Math.max(defaultHoldTime,
            note.GetScoreTimeOffset().ToDouble() + note.GetScoreTimeTiedDuration().ToDouble());

        // start this note
        this.m_midiFile.addNoteOn(this.m_midiTrack, startTime * tpq, channel, pitch, velocity);
      } else {
        const stopTime
          = this.m_totalTime + note.GetScoreTimeOffset().ToDouble() + note.GetScoreTimeTiedDuration().ToDouble();

        this.m_midiFile.addNoteOn(this.m_midiTrack, startTime * tpq, channel, pitch, velocity);
        this.m_midiFile.addNoteOff(this.m_midiTrack, Math.max(0.0, stopTime * tpq - 1), channel, pitch);
      }
    }

    // Store reference, i.e. for Nachschlag
    this.m_lastNote = note;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPedal(pedal: any): FunctorCode {
    if (!pedal.HasDir()) return FunctorCode.FUNCTOR_CONTINUE;

    // Check the functor flag - filters should always be there, but just in case we change how it is called
    if (!this.m_controlEvents || !this.GetFilters()) return FunctorCode.FUNCTOR_CONTINUE;

    // Check if the pedal applies to the staff filtered
    const measure = pedal.GetFirstAncestor(ClassId.MEASURE);
    if (!measure) throw new Error('GenerateMIDIFunctor::VisitPedal requires ancestor Measure.');
    const staffList = pedal.GetTstampStaves(measure, pedal);
    let applies = false;
    for (const staff of staffList) {
      applies = applies || this.GetFilters()!.Apply(staff);
    }
    if (!applies) return FunctorCode.FUNCTOR_CONTINUE;

    const pedalTime = pedal.GetStart().GetAlignment().GetTime().ToDouble() * SCORE_TIME_UNIT;
    const startTime = this.m_totalTime + pedalTime;
    const tpq = this.m_midiFile.getTPQ();

    // todo: check pedal @func to switch between sustain/soften/damper pedals?
    switch (pedal.GetDir()) {
      case pedalLog_DIR_down:
        this.m_midiFile.addSustainPedalOn(this.m_midiTrack, (startTime * tpq), this.m_midiChannel);
        break;
      case pedalLog_DIR_up:
        this.m_midiFile.addSustainPedalOff(this.m_midiTrack, (startTime * tpq), this.m_midiChannel);
        break;
      case pedalLog_DIR_bounce:
        this.m_midiFile.addSustainPedalOff(this.m_midiTrack, (startTime * tpq), this.m_midiChannel);
        this.m_midiFile.addSustainPedalOn(this.m_midiTrack, (startTime * tpq) + 0.1, this.m_midiChannel);
        break;
      default: return FunctorCode.FUNCTOR_CONTINUE;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScoreDef(scoreDef: any): FunctorCode {
    let totalTime = this.m_totalTime;
    // check next measure for the time offset
    const parent = scoreDef.GetParent();
    if (parent && (parent.GetLast() !== scoreDef)) {
      const next = parent.GetNextOf(scoreDef);
      if (next && next.Is(ClassId.MEASURE)) {
        totalTime = next.GetScoreTimeOnset().ToDouble();
      }
    }
    const currentTick = totalTime * this.m_midiFile.getTPQ();

    const midiEvent = this.newMidiEvent(currentTick);
    // calculate reference pitch class based on @tune.pname
    let referencePitchClass = 0;
    if (scoreDef.HasTunePname()) {
      referencePitchClass = NotePnameToPclass(scoreDef.GetTunePname());
    }
    // set and remember custom tuning if available
    const customTuning = scoreDef.GetCustomTuning?.();
    if (customTuning && customTuning.IsValid()) {
      this.m_customTuning = customTuning;
      const program = this.m_instrDef && this.m_instrDef.HasMidiInstrnum?.()
        ? this.m_instrDef.GetMidiInstrnum() : 0;
      const tuneCustom = customTuning.GetTuning();
      const mapping: Array<[number, number]> = [];
      // sysex messages should not have the high bit (0x80) set, which means that the full 128 MIDI notes
      // cannot be retuned in the same sysex message. For now, we skip MIDI key 0.
      for (let i = 1; i < 128; i++) {
        mapping.push([i, tuneCustom.frequencyForMidiNote(i)]);
      }
      midiEvent.makeMts2_KeyTuningsByFrequency(mapping, program);
      this.m_midiFile.addEventToTrack(this.m_midiTrack, midiEvent);
    }
    // set temperament event if corresponding attribute present
    else if (scoreDef.HasTuneTemper()) {
      switch (scoreDef.GetTuneTemper()) {
        case TEMPERAMENT_equal: midiEvent.makeTemperamentEqual(referencePitchClass); break;
        case TEMPERAMENT_just: midiEvent.makeTemperamentBad(100.0, referencePitchClass); break;
        case TEMPERAMENT_mean: midiEvent.makeTemperamentMeantone(referencePitchClass); break;
        case TEMPERAMENT_pythagorean: midiEvent.makeTemperamentPythagorean(referencePitchClass); break;
        default: break;
      }
      this.m_midiFile.addEventToTrack(this.m_midiTrack, midiEvent);
    }
    // set tuning
    if (scoreDef.HasTuneHz()) {
      const tuneHz = scoreDef.GetTuneHz();
      // Add tuning for all keys from 0 to 127
      const tuneFrequencies: Array<[number, number]> = [];
      for (let i = 0; i < 127; ++i) {
        const freq = Math.pow(2.0, (i - 69.0) / 12.0) * tuneHz;
        tuneFrequencies.push([i, freq]);
      }
      midiEvent.makeMts2_KeyTuningsByFrequency(tuneFrequencies);
      this.m_midiFile.addEventToTrack(this.m_midiTrack, midiEvent);
    }
    // set MIDI key signature
    if (scoreDef.HasKeySigInfo()) {
      const keySig = scoreDef.GetKeySig();
      if (keySig && keySig.HasSig()) {
        // m_midiFile->addKeySignature(
        //     m_midiTrack, currentTick, keySig->GetFifthsInt(), (keySig->GetMode() == MODE_minor));
      }
    }
    // set MIDI time signature
    if (scoreDef.HasMeterSigInfo()) {
      const meterSig = scoreDef.GetMeterSig();
      if (meterSig && meterSig.HasCount() && meterSig.HasUnit()) {
        this.m_midiFile.addTimeSignature(this.m_midiTrack, currentTick, meterSig.GetTotalCount(), meterSig.GetUnit());
      } else if (meterSig && meterSig.HasUnit()) {
        this.m_midiFile.addTimeSignature(
          this.m_midiTrack, currentTick, meterSig.GetTotalCount(), meterSig.GetSymImplicitUnit());
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: any): FunctorCode {
    if (staff.IsOssia()) return FunctorCode.FUNCTOR_SIBLINGS;

    this.m_expandedNotes.clear();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaffDef(staffDef: any): FunctorCode {
    if (staffDef.GetN() === this.m_staffN) {
      // Update the semitone transposition
      if (staffDef.HasTransSemi()) this.m_transSemi = staffDef.GetTransSemi();
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSyl(syl: any): FunctorCode {
    if (syl.IsEmpty()) return FunctorCode.FUNCTOR_CONTINUE;

    let note = null;
    if (syl.GetFirstAncestor(ClassId.CHORD)) {
      const parentChord = syl.GetFirstAncestor(ClassId.CHORD);
      note = parentChord.GetFirst(ClassId.NOTE);
    } else {
      note = syl.GetFirstAncestor(ClassId.NOTE);
    }
    if (!note) return FunctorCode.FUNCTOR_CONTINUE;

    const startTime = this.m_totalTime + note.GetScoreTimeOnset().ToDouble();
    const sylText = UTF32to8(syl.GetText());

    this.m_midiFile.addLyric(this.m_midiTrack, startTime * this.m_midiFile.getTPQ(), sylText);

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitVolta(volta: any): FunctorCode {
    return (volta.GetDrawingVoltaN() === 1) ? FunctorCode.FUNCTOR_CONTINUE : FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitVerse(verse: any): FunctorCode {
    let parent = verse.GetFirstAncestor(ClassId.NOTE);
    if (!parent) parent = verse.GetFirstAncestor(ClassId.CHORD);
    if (!parent) throw new Error('GenerateMIDIFunctor::VisitVerse requires a Note or Chord parent.');

    const previousVerse = parent.GetPrevious(verse, ClassId.VERSE);

    if (previousVerse) return FunctorCode.FUNCTOR_SIBLINGS;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitRefrain(refrain: any): FunctorCode {
    let parent = refrain.GetFirstAncestor(ClassId.NOTE);
    if (!parent) parent = refrain.GetFirstAncestor(ClassId.CHORD);
    if (!parent) throw new Error('GenerateMIDIFunctor::VisitRefrain requires a Note or Chord parent.');

    if (parent.FindDescendantByType(ClassId.VERSE, 1)) return FunctorCode.FUNCTOR_SIBLINGS;
    if (parent.GetPrevious(refrain, ClassId.REFRAIN)) return FunctorCode.FUNCTOR_SIBLINGS;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public DeferMIDINote(refNote: any, shift: number, includeChordSiblings: boolean): void {
    // Recursive call for chords
    const chord = refNote.IsChordTone();
    if (chord && includeChordSiblings) {
      const notes = chord.GetList();

      for (const note of notes) {
        this.DeferMIDINote(note, shift, false);
      }
      return;
    }

    // Register the shift
    if (shift < refNote.GetScoreTimeDuration().ToDouble() + refNote.GetScoreTimeTiedDuration().ToDouble()) {
      this.m_deferredNotes.set(refNote, shift);
    }
  }

  public HandleOctave(layerElement: any): void {
    // Handle octave end
    let octaveIdx = this.m_octaves.findIndex((octave: OctaveInfo) => {
      if (octave.isActive && (octave.staffN === this.m_staffN) && (octave.layerN === this.m_layerN)) {
        const endAlignment = octave.octave.GetEnd().GetAlignment();
        const alignment = layerElement.GetAlignment();
        if (endAlignment && alignment) {
          return alignmentCompare(endAlignment, alignment) < 0;
        }
      }
      return false;
    });
    if (octaveIdx !== -1) {
      this.m_octaveShift -= this.m_octaves[octaveIdx].octaveShift;
      this.m_octaves.splice(octaveIdx, 1);
    }

    // Handle octave begin
    octaveIdx = this.m_octaves.findIndex((octave: OctaveInfo) => {
      if (!octave.isActive && (octave.staffN === this.m_staffN) && (octave.layerN === this.m_layerN)) {
        const startAlignment = octave.octave.GetStart().GetAlignment();
        const alignment = layerElement.GetAlignment();
        if (startAlignment && alignment) {
          return alignmentCompare(startAlignment, alignment) <= 0;
        }
      }
      return false;
    });
    if (octaveIdx !== -1) {
      this.m_octaveShift += this.m_octaves[octaveIdx].octaveShift;
      this.m_octaves[octaveIdx].isActive = true;
    }
  }

  public GetMIDIPitch(note: any): number {
    if (this.m_customTuning && this.m_customTuning.IsValid()) {
      return this.m_customTuning.GetMIDIPitch(note, this.m_transSemi, this.m_octaveShift);
    }
    return note.GetMIDIPitch(this.m_transSemi, this.m_octaveShift);
  }

  /** C++ creates a local smf::MidiEvent with tick set; modeled via an injectable event factory. */
  private newMidiEvent(tick: number): any {
    const factory = (this.m_midiFile as { createMidiEvent?: (tick: number) => any }).createMidiEvent;
    if (factory) return factory(tick);
    const DefaultMidiEvent = (this.m_midiFile as { MidiEvent?: new () => any }).MidiEvent;
    if (DefaultMidiEvent) return new DefaultMidiEvent();
    // ponytail: plain structural fallback — sufficient for make* + addEventToTrack consumers
    const event: any = [];
    event.tick = tick;
    event.makeMts2_KeyTuningsByFrequency = function (this: any, keyOrMapping: any, frequencyOrProgram?: number, program = 0) {
      if (Array.isArray(keyOrMapping)) { (this as any).length = 0; return; }
      (this as any).length = 0;
    };
    event.makeTemperamentEqual = function (this: any) { (this as any).length = 0; };
    event.makeTemperamentBad = function (this: any) { (this as any).length = 0; };
    event.makeTemperamentMeantone = function (this: any) { (this as any).length = 0; };
    event.makeTemperamentPythagorean = function (this: any) { (this as any).length = 0; };
    return event;
  }
}

/** C++ `*endAlignment < *alignment` / `<=` — structural Alignment comparison. */
function alignmentCompare(lhs: any, rhs: any): number {
  if (typeof lhs.CompareTo === 'function') return lhs.CompareTo(rhs);
  if (typeof lhs.compare === 'function') return lhs.compare(rhs);
  if (lhs === rhs) return 0;
  return lhs < rhs ? -1 : (lhs > rhs ? 1 : 0);
}

/** Local mirror of Note::PnameToPclass; avoids a runtime import cycle note.ts -> (doc ->) midifunctor.ts. */
function NotePnameToPclass(pitchName: number): number {
  switch (pitchName) {
    case 1: return 0;  // c
    case 2: return 2;  // d
    case 3: return 4;  // e
    case 4: return 5;  // f
    case 5: return 7;  // g
    case 6: return 9;  // a
    case 7: return 11; // b
    default: return 0;
  }
}

//----------------------------------------------------------------------------
// GenerateFeaturesFunctor
//----------------------------------------------------------------------------

/** This class exports the object to a JSON feature file. */
export class GenerateFeaturesFunctor extends ConstFunctor {
  private m_extractor: any;

  public constructor(extractor: any) {
    super();
    this.m_extractor = extractor;
  }

  public ImplementsEndInterface(): boolean { return false; }

  public VisitObject(object: any): FunctorCode {
    this.m_extractor.Extract(object);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
