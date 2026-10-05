/**
 * scoringupfunctor.ts — canonical translation of src-cpp/src/scoringupfunctor.cpp
 * + src-cpp/include/vrv/scoringupfunctor.h.
 *
 * ScoringUpFunctor applies the mensural principles of imperfection and
 * alteration: it collects per-voice (layer) sequences of notes/rests/dots
 * under a common mensuration, subdivides perfect-mensuration passages into
 * sequences bounded by "supposedly" perfect notes, evaluates dots of
 * division vs augmentation, and sets `@dur.quality` (perfecta / imperfecta /
 * altera) plus dot forms (aug / div) accordingly.
 *
 * Extends plain `Functor` (not DocFunctor) with `ImplementsEndInterface() ==
 * true`, per the C++ header.
 */

import { Functor } from './functor.js';
import { FunctorCode, ClassId, type ArrayOfElementDurPairs } from './vrvdef.js';
import {
  DURATION_NONE,
  DURATION_semibrevis,
  DURATION_brevis,
  DURATION_longa,
  DURATION_maxima,
  DURATION_minima,
  DURATION_semiminima,
  DURATION_fusa,
  DURATION_semifusa,
  type data_DURATION,
} from './libmei-att.js';
import {
  DURQUALITY_mensural_altera,
  DURQUALITY_mensural_imperfecta,
  DURQUALITY_mensural_perfecta,
} from './durationinterface.js';

// Canonical dotLog_FORM ordinals (libmei/dist/atttypes.h): NONE=0, aug=1, div=2.
const dotLog_FORM_aug = 1;
const dotLog_FORM_div = 2;

//----------------------------------------------------------------------------
// Structural boundaries
//----------------------------------------------------------------------------

export interface ScoringLayerElementLike {
  Is(classId: number): boolean;
  ThisOrSameasLink(): ScoringLayerElementLike;
  IsScoreDefElement(): boolean;
}

export interface ScoringNoteLike extends ScoringLayerElementLike {
  GetDur(): data_DURATION;
  GetDurQuality(): number;
  HasDurQuality(): boolean;
  SetDurQuality(value: number): void;
}

export interface ScoringRestLike extends ScoringLayerElementLike {
  GetDur(): data_DURATION;
}

export interface ScoringDotLike extends ScoringLayerElementLike {
  SetForm(value: number): void;
}

export interface ScoringMensurLike extends ScoringLayerElementLike {
  GetModusmaior(): number;
  GetModusminor(): number;
  GetTempus(): number;
  GetProlatio(): number;
}

// Simplified structure for a Mensur (C++ nested struct).
export interface MensInfo {
  prolatio: number;
  tempus: number;
  modusminor: number;
  modusmaior: number;
}

function defaultMensInfo(): MensInfo {
  return { prolatio: 2, tempus: 2, modusminor: 2, modusmaior: 2 };
}

//----------------------------------------------------------------------------
// ScoringUpFunctor
//----------------------------------------------------------------------------

export class ScoringUpFunctor extends Functor {
  public override ImplementsEndInterface(): boolean { return true; }

  // The current Mensur
  private m_currentMensur: ScoringMensurLike | null = null;
  // The current mensuration info
  private m_mensInfo: MensInfo = defaultMensInfo();
  // Per-voice passages: mensuration info + notes/rests/dots under it.
  private m_voiceData: Array<[MensInfo, ArrayOfElementDurPairs]> = [];
  // Notes/rests/dots in the current voice passage.
  private m_dursInVoiceWithSameMensur: ArrayOfElementDurPairs = [];
  // Bounded sequences derived from the current passage.
  private m_listOfSequences: Array<ArrayOfElementDurPairs> = [];
  // {note, following_dot} pairs for dots of augmentation / perfection.
  private m_listOfAugNotesDotsPairs: Array<[ScoringNoteLike, ScoringDotLike]> = [];
  private m_listOfPerfNotesDotsPairs: Array<[ScoringNoteLike, ScoringDotLike]> = [];

  public override VisitLayerEnd(_layer: unknown): FunctorCode {
    // Add the last passage (as there won't be any more changes in mensuration)
    this.m_voiceData.push([{ ...this.m_mensInfo }, this.m_dursInVoiceWithSameMensur]);
    // Assumption: mensuration defined in layer; staffDef definitions ignored.
    for (const mensurPassage of this.m_voiceData) {
      this.m_mensInfo = { ...mensurPassage[0] };
      const dursInVoiceWithSameMensur = mensurPassage[1] as ArrayOfElementDurPairs;
      // Process each perfect mensuration passage from lowest to highest level
      if (this.m_mensInfo.prolatio === 3) {
        this.ProcessPerfectMensurPassage(dursInVoiceWithSameMensur, DURATION_semibrevis);
      }
      if (this.m_mensInfo.tempus === 3) {
        this.ProcessPerfectMensurPassage(dursInVoiceWithSameMensur, DURATION_brevis);
      }
      if (this.m_mensInfo.modusminor === 3) {
        this.ProcessPerfectMensurPassage(dursInVoiceWithSameMensur, DURATION_longa);
      }
      if (this.m_mensInfo.modusmaior === 3) {
        this.ProcessPerfectMensurPassage(dursInVoiceWithSameMensur, DURATION_maxima);
      }
    }
    // restart for next voice (layer)
    this.m_voiceData = [];
    this.m_dursInVoiceWithSameMensur = [];

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public override VisitLayerElement(layerElement: unknown): FunctorCode {
    const el = layerElement as ScoringLayerElementLike;
    if (el.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    const element = el.ThisOrSameasLink();

    if (element.Is(ClassId.REST) || element.Is(ClassId.NOTE) || element.Is(ClassId.DOT)) {
      let dur: data_DURATION = DURATION_NONE;
      if (element.Is(ClassId.NOTE)) {
        const note = element as ScoringNoteLike;
        dur = note.GetDur();
      }
      else if (element.Is(ClassId.REST)) {
        const rest = element as ScoringRestLike;
        dur = rest.GetDur();
      }
      this.m_dursInVoiceWithSameMensur.push([element as never, dur]);
    }
    else if (element.Is(ClassId.MENSUR)) {
      // New mensuration ends the old passage: store it, start a new one.
      this.m_voiceData.push([{ ...this.m_mensInfo }, this.m_dursInVoiceWithSameMensur]);
      this.m_currentMensur = element as ScoringMensurLike;
      this.m_mensInfo.modusmaior = Math.abs(this.m_currentMensur.GetModusmaior());
      this.m_mensInfo.modusminor = Math.abs(this.m_currentMensur.GetModusminor());
      this.m_mensInfo.tempus = Math.abs(this.m_currentMensur.GetTempus());
      this.m_mensInfo.prolatio = Math.abs(this.m_currentMensur.GetProlatio());
      this.m_dursInVoiceWithSameMensur = [];
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public ProcessPerfectMensurPassage(
    dursInVoiceWithSameMensur: ArrayOfElementDurPairs, noteLevel: data_DURATION
  ): void {
    this.m_listOfSequences = this.SubdivideIntoBoundedSequences(dursInVoiceWithSameMensur, noteLevel);
    this.ProcessBoundedSequencesList(this.m_listOfSequences, noteLevel);
  }

  public SubdivideIntoBoundedSequences(
    dursInVoiceSameMensur: ArrayOfElementDurPairs, boundUnit: data_DURATION
  ): Array<ArrayOfElementDurPairs> {
    const listOfBoundedSequences: Array<ArrayOfElementDurPairs> = [];
    let boundedSequence: ArrayOfElementDurPairs = [];

    // Boundary notes: the boundUnit itself plus any note of higher value.
    const isBoundary = (dur: data_DURATION): boolean => {
      if (boundUnit === DURATION_semibrevis) {
        return dur === DURATION_semibrevis || dur === DURATION_brevis || dur === DURATION_longa
          || dur === DURATION_maxima;
      }
      if (boundUnit === DURATION_brevis) {
        return dur === DURATION_brevis || dur === DURATION_longa || dur === DURATION_maxima;
      }
      if (boundUnit === DURATION_longa) {
        return dur === DURATION_longa || dur === DURATION_maxima;
      }
      // DURATION_maxima
      return dur === DURATION_maxima;
    };

    for (const elementDurPair of dursInVoiceSameMensur) {
      const dur = elementDurPair[1];
      if (isBoundary(dur)) {
        boundedSequence.push(elementDurPair);
        listOfBoundedSequences.push(boundedSequence);
        boundedSequence = [elementDurPair];
      }
      else {
        boundedSequence.push(elementDurPair);
      }
    }
    return listOfBoundedSequences;
  }

  public ProcessBoundedSequencesList(
    listOfSequences: Array<ArrayOfElementDurPairs>, boundUnit: data_DURATION
  ): void {
    for (const sequence of listOfSequences) {
      this.ProcessBoundedSequence(sequence, boundUnit);
    }
  }

  public ProcessBoundedSequence(sequence: ArrayOfElementDurPairs, boundUnit: data_DURATION): void {
    // Notes in the middle of the sequence boundaries.
    const middleSeq = this.GetBoundedNotes(sequence, boundUnit);

    // Dots in middleSeq are the only candidates for dots of division.
    const indecesOfDots: number[] = [];
    for (let i = 0; i < middleSeq.length; i++) {
      if ((middleSeq[i][0] as unknown as ScoringLayerElementLike).Is(ClassId.DOT)) {
        indecesOfDots.push(i);
      }
    }
    const numberOfDots = indecesOfDots.length;
    let sum: number;
    // 0. No dots
    if (numberOfDots === 0) {
      sum = this.GetValueInUnit(this.GetValueInMinims(middleSeq), boundUnit);
      this.FindDurQuals(sequence, sum, boundUnit);
      this.ApplyAugmentationsAndPerfections();
    }
    // 1. Single dot in middle sequence
    else if (numberOfDots === 1) {
      const dotInd = indecesOfDots[0];
      const isDotOfDiv = this.EvalDotOfDiv(middleSeq, sequence, dotInd, boundUnit);
      if (!isDotOfDiv) {
        // Dot of augmentation
        sum = this.GetValueInUnit(this.GetValueInMinims(middleSeq), boundUnit);
        this.FindDurQuals(sequence, sum, boundUnit);
        this.ApplyAugmentationsAndPerfections();
      }
    }
    // 2. More than one dot in middle sequence
    else if (numberOfDots > 1) {
      const startDotInd = indecesOfDots[0];
      const isStartDotOfDiv = this.EvalDotOfDiv(middleSeq, sequence, startDotInd, boundUnit);

      const endDotInd = indecesOfDots[indecesOfDots.length - 1];
      const isEndDotOfDiv = this.EvalDotOfDiv(middleSeq, sequence, endDotInd, boundUnit);

      // If neither, all dots are dots of augmentation
      if (!isStartDotOfDiv && !isEndDotOfDiv) {
        sum = this.GetValueInUnit(this.GetValueInMinims(middleSeq), boundUnit);
        this.FindDurQuals(sequence, sum, boundUnit);
        this.ApplyAugmentationsAndPerfections();
      }
    }
  }

  public GetBoundedNotes(sequence: ArrayOfElementDurPairs, boundUnit: data_DURATION): ArrayOfElementDurPairs {
    let middleSeq: ArrayOfElementDurPairs = [];
    if (sequence.length >= 2) {
      const firstNoteDur = sequence[0][1];
      // Smaller-than-boundary first notes keep the leading boundary in the middle;
      // otherwise both boundaries are excluded. C++ branches per boundUnit.
      const includeFirst =
        (boundUnit === DURATION_semibrevis &&
          (firstNoteDur === DURATION_minima || firstNoteDur === DURATION_semiminima
            || firstNoteDur === DURATION_fusa || firstNoteDur === DURATION_semifusa)) ||
        (boundUnit === DURATION_brevis &&
          (firstNoteDur === DURATION_semibrevis || firstNoteDur === DURATION_minima
            || firstNoteDur === DURATION_semiminima || firstNoteDur === DURATION_fusa
            || firstNoteDur === DURATION_semifusa)) ||
        (boundUnit === DURATION_longa &&
          (firstNoteDur === DURATION_brevis || firstNoteDur === DURATION_semibrevis
            || firstNoteDur === DURATION_minima || firstNoteDur === DURATION_semiminima
            || firstNoteDur === DURATION_fusa || firstNoteDur === DURATION_semifusa)) ||
        (boundUnit === DURATION_maxima &&
          (firstNoteDur === DURATION_longa || firstNoteDur === DURATION_brevis
            || firstNoteDur === DURATION_semibrevis || firstNoteDur === DURATION_minima
            || firstNoteDur === DURATION_semiminima || firstNoteDur === DURATION_fusa
            || firstNoteDur === DURATION_semifusa));
      middleSeq = includeFirst ? sequence.slice(0, sequence.length - 1) : sequence.slice(1, sequence.length - 1);
    }
    return middleSeq;
  }

  public GetDurNumberValue(
    elementDurPair: [unknown, data_DURATION], followedByDot: boolean, nextElement: unknown
  ): number {
    const first = elementDurPair[0] as ScoringLayerElementLike | null;
    const note = first as ScoringNoteLike | null;
    if (!note || !first || !first.Is(ClassId.NOTE)) return 0.0;
    const durquality = note.GetDurQuality();
    const dur = elementDurPair[1];
    const longaDefaultVal = this.m_mensInfo.modusminor * this.m_mensInfo.tempus * this.m_mensInfo.prolatio;
    const brevisDefaultVal = this.m_mensInfo.tempus * this.m_mensInfo.prolatio;
    const semibrevisDefaultVal = this.m_mensInfo.prolatio;
    let durnum = 0;
    switch (dur) {
      case DURATION_longa:
        if (durquality === DURQUALITY_mensural_altera) {
          durnum = 2 * longaDefaultVal;
        }
        else if (this.m_mensInfo.modusminor === 3 || durquality === DURQUALITY_mensural_perfecta || followedByDot) {
          durnum = 3 * brevisDefaultVal;
          if (this.m_mensInfo.modusminor === 2 && followedByDot) {
            this.m_listOfAugNotesDotsPairs.push([note, nextElement as ScoringDotLike]);
          }
          else if (this.m_mensInfo.modusminor === 3 && followedByDot) {
            this.m_listOfPerfNotesDotsPairs.push([note, nextElement as ScoringDotLike]);
          }
        }
        else if (this.m_mensInfo.modusminor === 2 || durquality === DURQUALITY_mensural_imperfecta) {
          durnum = 2 * brevisDefaultVal;
        }
        break;
      case DURATION_brevis:
        if (durquality === DURQUALITY_mensural_altera) {
          durnum = 2 * brevisDefaultVal;
        }
        else if (this.m_mensInfo.tempus === 3 || durquality === DURQUALITY_mensural_perfecta || followedByDot) {
          durnum = 3 * semibrevisDefaultVal;
          if (this.m_mensInfo.tempus === 2 && followedByDot) {
            this.m_listOfAugNotesDotsPairs.push([note, nextElement as ScoringDotLike]);
          }
          else if (this.m_mensInfo.tempus === 3 && followedByDot) {
            this.m_listOfPerfNotesDotsPairs.push([note, nextElement as ScoringDotLike]);
          }
        }
        else if (this.m_mensInfo.tempus === 2 || durquality === DURQUALITY_mensural_imperfecta) {
          durnum = 2 * semibrevisDefaultVal;
        }
        break;
      case DURATION_semibrevis:
        if (durquality === DURQUALITY_mensural_altera) {
          durnum = 2 * semibrevisDefaultVal;
        }
        else if (this.m_mensInfo.prolatio === 3 || durquality === DURQUALITY_mensural_perfecta || followedByDot) {
          durnum = 3;
          if (this.m_mensInfo.prolatio === 2 && followedByDot) {
            this.m_listOfAugNotesDotsPairs.push([note, nextElement as ScoringDotLike]);
          }
          else if (this.m_mensInfo.prolatio === 3 && followedByDot) {
            this.m_listOfPerfNotesDotsPairs.push([note, nextElement as ScoringDotLike]);
          }
        }
        else if (this.m_mensInfo.prolatio === 2 || durquality === DURQUALITY_mensural_imperfecta) {
          durnum = 2;
        }
        break;
      case DURATION_minima:
        if (followedByDot) {
          durnum = 1.5;
          this.m_listOfAugNotesDotsPairs.push([note, nextElement as ScoringDotLike]);
        }
        else if (durquality === DURQUALITY_mensural_altera) {
          durnum = 2;
        }
        else {
          durnum = 1;
        }
        break;
      case DURATION_semiminima:
        if (followedByDot) {
          durnum = 0.75;
          this.m_listOfAugNotesDotsPairs.push([note, nextElement as ScoringDotLike]);
        }
        else {
          durnum = 0.5;
        }
        break;
      case DURATION_fusa:
        if (followedByDot) {
          durnum = 0.375;
          this.m_listOfAugNotesDotsPairs.push([note, nextElement as ScoringDotLike]);
        }
        else {
          durnum = 0.25;
        }
        break;
      case DURATION_semifusa: durnum = 0.125; break;
      default: break;
    }
    return durnum;
  }

  public GetValueInMinims(middleSeq: ArrayOfElementDurPairs): number {
    let sum = 0;
    let followedByDot = false;
    let nextElement: unknown = null;
    for (let i = 0; i < middleSeq.length; i++) {
      const elementDurPair = middleSeq[i];
      // Check if there is a dot after the element being evaluated
      if (i + 1 < middleSeq.length) {
        nextElement = middleSeq[i + 1][0];
        followedByDot = (nextElement as unknown as ScoringLayerElementLike).Is(ClassId.DOT);
      }
      else {
        followedByDot = false;
      }
      sum += this.GetDurNumberValue(elementDurPair as [unknown, data_DURATION], followedByDot, nextElement);
    }
    return sum;
  }

  public GetValueInUnit(valueInMinims: number, unit: data_DURATION): number {
    let valueInUnit = 0.0;
    if (unit === DURATION_semibrevis) {
      valueInUnit = valueInMinims;
    }
    else if (unit === DURATION_brevis) {
      valueInUnit = valueInMinims / this.m_mensInfo.prolatio;
    }
    else if (unit === DURATION_longa) {
      valueInUnit = valueInMinims / (this.m_mensInfo.prolatio * this.m_mensInfo.tempus);
    }
    else if (unit === DURATION_maxima) {
      valueInUnit = valueInMinims / (this.m_mensInfo.prolatio * this.m_mensInfo.tempus * this.m_mensInfo.modusminor);
    }
    return valueInUnit;
  }

  public FindDurQuals(sequence: ArrayOfElementDurPairs, valueInSmallerUnit: number, boundUnit: data_DURATION): void {
    const sum = valueInSmallerUnit;
    // C++ `(int)sum % 3` — truncation toward zero parity.
    const remainder = (Math.trunc(sum) % 3 + 3) % 3;

    let impappCandidate: ScoringNoteLike | null;
    let impapaCandidate: ScoringNoteLike | null;
    let alterationCandidate: ScoringNoteLike | null;
    const dotOfImperf = false;
    const simileAnteSimile = false;

    if (sum < 3) {
      switch (remainder) {
        case 0: break;
        case 1:
          impappCandidate = this.ImperfectionAPP(sequence, boundUnit);
          if (impappCandidate) {
            impappCandidate.SetDurQuality(DURQUALITY_mensural_imperfecta);
            break;
          }
          impapaCandidate = this.ImperfectionAPA(sequence, boundUnit);
          if (impapaCandidate) {
            impapaCandidate.SetDurQuality(DURQUALITY_mensural_imperfecta);
            break;
          }
          console.log('NO OPTION!');
          break;
        case 2:
          alterationCandidate = this.Alteration(sequence, boundUnit);
          if (alterationCandidate && !dotOfImperf) {
            alterationCandidate.SetDurQuality(DURQUALITY_mensural_altera);
            break;
          }
          impappCandidate = this.ImperfectionAPP(sequence, boundUnit);
          impapaCandidate = this.ImperfectionAPA(sequence, boundUnit);
          if (impappCandidate && impapaCandidate) {
            impappCandidate.SetDurQuality(DURQUALITY_mensural_imperfecta);
            impapaCandidate.SetDurQuality(DURQUALITY_mensural_imperfecta);
            break;
          }
          console.log('NO OPTION!');
          break;
      }
    }
    else if (sum === 3) {
      const leavePerfectFlag = this.LeavePerfect(sequence, boundUnit);
      if (!leavePerfectFlag || dotOfImperf) {
        // C++ empty body preserved.
      }
    }
    else {
      switch (remainder) {
        case 0:
          impappCandidate = this.ImperfectionAPP(sequence, boundUnit);
          alterationCandidate = this.Alteration(sequence, boundUnit);
          if (impappCandidate && alterationCandidate) {
            impappCandidate.SetDurQuality(DURQUALITY_mensural_imperfecta);
            alterationCandidate.SetDurQuality(DURQUALITY_mensural_altera);
            break;
          }
          // Alternative: no modifications.
          break;
        case 1:
          impappCandidate = this.ImperfectionAPP(sequence, boundUnit);
          if (impappCandidate) {
            impappCandidate.SetDurQuality(DURQUALITY_mensural_imperfecta);
            break;
          }
          impapaCandidate = this.ImperfectionAPA(sequence, boundUnit);
          if (impapaCandidate) {
            impapaCandidate.SetDurQuality(DURQUALITY_mensural_imperfecta);
            break;
          }
          console.log('NO OPTION!');
          break;
        case 2:
          impappCandidate = this.ImperfectionAPP(sequence, boundUnit);
          impapaCandidate = this.ImperfectionAPA(sequence, boundUnit);
          if (impappCandidate && impapaCandidate && !simileAnteSimile) {
            impappCandidate.SetDurQuality(DURQUALITY_mensural_imperfecta);
            impapaCandidate.SetDurQuality(DURQUALITY_mensural_imperfecta);
            break;
          }
          alterationCandidate = this.Alteration(sequence, boundUnit);
          if (alterationCandidate) {
            alterationCandidate.SetDurQuality(DURQUALITY_mensural_altera);
            break;
          }
          console.log('NO OPTION!');
          break;
      }
    }
  }

  public ImperfectionAPP(sequence: ArrayOfElementDurPairs, boundUnit: data_DURATION): ScoringNoteLike | null {
    const firstElementDurPair = sequence[0];
    const firstElement = firstElementDurPair[0] as unknown as ScoringLayerElementLike;
    const firstDur = firstElementDurPair[1];
    if (firstElement.Is(ClassId.NOTE) && firstDur === boundUnit) {
      const nextElement = sequence[1][0] as unknown as ScoringLayerElementLike;
      if (nextElement.Is(ClassId.DOT)) {
        // Dot of perfection (type of dot of division)
        const dot = nextElement as unknown as ScoringDotLike;
        dot.SetForm(dotLog_FORM_div);
        return null;
      }
      else {
        const firstNote = firstElement as unknown as ScoringNoteLike;
        if (!firstNote) throw new Error('ImperfectionAPP: note required');
        if (firstNote.HasDurQuality()) {
          // Already modified before
          return null;
        }
        else {
          return firstNote;
        }
      }
    }
    else {
      return null;
    }
  }

  public ImperfectionAPA(sequence: ArrayOfElementDurPairs, boundUnit: data_DURATION): ScoringNoteLike | null {
    const lastElementDurPair = sequence[sequence.length - 1];
    const lastElement = lastElementDurPair[0] as unknown as ScoringLayerElementLike;
    const lastDur = lastElementDurPair[1];
    if (lastElement.Is(ClassId.NOTE) && lastDur === boundUnit) {
      const lastNote = lastElement as unknown as ScoringNoteLike;
      if (!lastNote) throw new Error('ImperfectionAPA: note required');
      return lastNote;
    }
    else {
      return null;
    }
  }

  public Alteration(sequence: ArrayOfElementDurPairs, boundUnit: data_DURATION): ScoringNoteLike | null {
    const penultElementDurPair = sequence[sequence.length - 2];
    const penultElement = penultElementDurPair[0] as unknown as ScoringLayerElementLike;
    const penultDur = penultElementDurPair[1];
    const nextSmallLevel = new Map<data_DURATION, data_DURATION>([
      [DURATION_maxima, DURATION_longa],
      [DURATION_longa, DURATION_brevis],
      [DURATION_brevis, DURATION_semibrevis],
      [DURATION_semibrevis, DURATION_minima],
    ]);
    const smallerValue = nextSmallLevel.get(boundUnit);
    if (penultElement.Is(ClassId.NOTE) && penultDur === smallerValue) {
      const penultNote = penultElement as unknown as ScoringNoteLike;
      if (!penultNote) throw new Error('Alteration: note required');
      return penultNote;
    }
    else {
      return null;
    }
  }

  public LeavePerfect(_sequence: ArrayOfElementDurPairs, _boundUnit: data_DURATION): boolean {
    return true;
  }

  public ApplyAugmentationsAndPerfections(): void {
    for (const pairNoteAndDot of this.m_listOfAugNotesDotsPairs) {
      pairNoteAndDot[0].SetDurQuality(DURQUALITY_mensural_perfecta);
      pairNoteAndDot[1].SetForm(dotLog_FORM_aug);
    }
    for (const pairNoteAndDot of this.m_listOfPerfNotesDotsPairs) {
      pairNoteAndDot[0].SetDurQuality(DURQUALITY_mensural_perfecta);
      pairNoteAndDot[1].SetForm(dotLog_FORM_div);
    }
    this.m_listOfAugNotesDotsPairs = [];
    this.m_listOfPerfNotesDotsPairs = [];
  }

  public EvalDotOfDiv(
    middleSeq: ArrayOfElementDurPairs, sequence: ArrayOfElementDurPairs, dotInd: number, unit: data_DURATION
  ): boolean {
    // Initial assumption: the sequence doesn't have a dot of division
    let flagDotOfDiv = false;
    const middleSeq1 = middleSeq.slice(0, dotInd);
    const middleSeq2 = middleSeq.slice(dotInd + 1);
    const sum1 = this.GetValueInUnit(this.GetValueInMinims(middleSeq1), unit);
    const sum2 = this.GetValueInUnit(this.GetValueInMinims(middleSeq2), unit);
    // Discard dot-of-perfection case
    if (middleSeq1.length !== 0) {
      if (sum1 === Math.trunc(sum1) && sum2 === Math.trunc(sum2)) {
        flagDotOfDiv = true;
        const seq1 = sequence.slice(0, dotInd + 2);
        const seq2 = sequence.slice(dotInd + 2);
        // Encode the dot of division (middleSeq index -> sequence index offset +1)
        const dotElement = sequence[dotInd + 1][0] as unknown as ScoringDotLike;
        dotElement.SetForm(dotLog_FORM_div);
        this.FindDurQuals(seq1, sum1, unit);
        this.FindDurQuals(seq2, sum2, unit);
        this.ApplyAugmentationsAndPerfections();
      }
      else {
        this.m_listOfAugNotesDotsPairs = [];
        this.m_listOfPerfNotesDotsPairs = [];
      }
    }
    return flagDotOfDiv;
  }
}
