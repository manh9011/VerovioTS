// EditorToolkitCMN - pure TS translation of src-cpp/src/editortoolkit_cmn.cpp.
// Part 1: constructor, ParseEditorCMNAction dispatcher, Parse*Action helpers,
// InsertCursorByDur/Pitch/Type, InsertMeasure.
import { EditorToolkitShared } from './editortoolkit_shared.js';
import { JsonxxObject } from './jsonxx.js';
import { InitProcessingListsFunctor } from './miscfunctor.js';
import { ObjectFactory, VrvObject } from './object.js';
import { Measure } from './measure.js';
import { Staff } from './staff.js';
import { Layer } from './layer.js';
import { Note } from './note.js';
import { Chord } from './chord.js';
import { Accid } from './accid.js';
import { Rest } from './rest.js';
import { Tie } from './tie.js';
import { Att } from './att.js';
import { Beam } from './beam.js';
import { ClassIdsComparison } from './comparison.js';
import type { ClassIdLike } from './vrvdef.js';
import { LogInfo, LogWarning, StringFormat, IsValidInteger } from './vrv.js';
import { Fraction } from './fraction.js';
import {
  ClassId, VRV_UNSET, UNLIMITED_DEPTH, BACKWARD, DURATION_4, DURATION_8, DURATION_NONE,
} from './vrvdef.js';
import {
  PITCHNAME_NONE, PITCHNAME_c, ACCIDENTAL_WRITTEN_NONE, ACCIDENTAL_GESTURAL_NONE,
} from './libmei-att.js';

export enum CursorInsertType { CURSOR_INSERT_NONE = 0, CURSOR_INSERT_REST, CURSOR_INSERT_TIE, CURSOR_INSERT_COPY }
export enum CursorContainer { CURSOR_CONTAINER_NONE = 0, CURSOR_CONTAINER_TUPLET, CURSOR_CONTAINER_GRACEGRP }

const attConverter = new Att();

const CHORD_NOTE_REST_LAYER: ClassIdLike[] = [ClassId.CHORD, ClassId.LAYER, ClassId.NOTE, ClassId.REST];

export class EditorToolkitCMN extends EditorToolkitShared {
  public constructor(doc: unknown, view: unknown) {
    // ponytail: MEI I/O seam is still pending (iomei pass); a default no-op seam keeps
    // construction usable for tests. Upgrade when iomei lands.
    super(doc, view, { exportState: () => '', importState: () => false, exportScoreDef: () => '' });
  }

  protected override IsCmnAction(action: string): boolean {
    return [
      'insertCursorByDur', 'insertCursorByPitch', 'insertCursorByType',
      'insertCursorContainer', 'insertMeasure', 'insertNote', 'insertRest', 'resetCursorContainer',
    ].includes(action);
  }

  public GetTargetContainerFor(target: VrvObject): [VrvObject | null, VrvObject | null] {
  let previousElement: VrvObject | null = null;
  let targetContainer: VrvObject | null = null;
  if (!target.Is(ClassId.LAYER)) {
    const targetParent = target.GetParent();
    // Inserting a note within a tuplet or a beam
    if (targetParent && (targetParent.Is(ClassId.BEAM) || targetParent.Is(ClassId.TUPLET)) && targetParent.GetLast() !== target) {
      previousElement = target;
      targetContainer = targetParent;
    }
    // Otherwise always insert in the layer
    else {
      previousElement = target.GetLastAncestorNot(ClassId.LAYER);
      if (!previousElement) return [null, null];
      targetContainer = previousElement.GetParent();
      if (!targetContainer || !targetContainer.Is(ClassId.LAYER)) {
        throw new Error('GetTargetContainerFor: targetContainer must be a layer.');
      }
    }
  }
  else {
    targetContainer = target;
  }
  return [targetContainer, previousElement];
}
  public SetNoteAttributes(note: Note, pname: number, oct: number, accid: number, accidGes: number): void {
  if (!note) throw new Error('SetNoteAttributes: note required.');

  note.SetPname(pname);
  note.SetOct(oct);

  if (accid !== (ACCIDENTAL_WRITTEN_NONE as number)) {
    const accidElement = new Accid();
    accidElement.SetAccid(accid);
    note.AddChild(accidElement);
  }
  else if (accidGes !== (ACCIDENTAL_GESTURAL_NONE as number)) {
    const accidElement = new Accid();
    accidElement.SetAccidGes(accidGes);
    note.AddChild(accidElement);
  }
}
  public InsertNoteInChordMode(elementId: string, pname: number, oct: number, accid: number, accidGes: number): boolean {
  let target: VrvObject | null = null;
  if (this.InsertMode()) {
    const cursor = this.m_cursor as any;
    target = (cursor.HasPosition?.()) ? cursor.GetPosition() : cursor.GetParent();
  }
  else {
    target = this.GetElement(elementId);
  }
  if (!target) return false;

  let chord: Chord | null = null;
  let targetNote: Note | null = null;

  if (target.Is(ClassId.CHORD)) {
    chord = target as unknown as Chord;
  }
  else if (target.Is(ClassId.NOTE)) {
    targetNote = target as unknown as Note;
    chord = targetNote.IsChordTone() as unknown as Chord | null;
  }

  if (!chord && !targetNote) return false;

  if (!chord) {
    const noteAny = targetNote as any;
    if (noteAny.HasEditorialContent?.()) {
      // ponytail: C++ LogInfo + false; kept
      LogInfo('Inserting a note where a note has editorial content is not possible');
      return false;
    }

    const lyric: VrvObject[] = [];
    const lyricsComparison = new ClassIdsComparison([ClassId.VERSE, ClassId.SYL]);
    targetNote!.FindAllDescendantsByComparison(lyric, lyricsComparison);
    if (lyric.length > 0) {
      LogInfo('Inserting a note where a note has lyric content is not possible');
      return false;
    }
    const newChord = new Chord();
    // chord->DurationInterface::operator=(*targetNote) and the four Att copies
    const n = targetNote as any;
    const chordAny = newChord as any;
    newChord.SetDur(n.GetDur());
    if (n.HasDots?.()) newChord.SetDots(n.GetDots());
    const attCopies: [string, string][] = [
      ['SetCue', 'GetCue'], ['SetGrace', 'GetGrace'], ['SetStemDir', 'GetStemDir'],
      ['SetStemLen', 'GetStemLen'], ['SetStemMod', 'GetStemMod'], ['SetStemPos', 'GetStemPos'], ['SetStemSameas', 'GetStemSameas'],
    ];
    for (const [setter, getter] of attCopies) {
      if (typeof chordAny[setter] === 'function' && typeof n[setter] === 'function') chordAny[setter](n[getter]());
    }
    // targetNote resets
    (targetNote!.GetDurationInterface?.() as any)?.SetDur(0 /* DURATION_NONE */);
    if (typeof noteAny.ResetCue === 'function') noteAny.ResetCue();
    if (typeof noteAny.ResetGraced === 'function') noteAny.ResetGraced();
    if (typeof noteAny.ResetStems === 'function') noteAny.ResetStems();
    if (typeof noteAny.ResetStemsCmn === 'function') noteAny.ResetStemsCmn();
    const parent = targetNote!.GetParent();
    if (!parent) throw new Error('InsertNoteInChordMode: parent required.');
    parent.ReplaceChild(targetNote!, newChord);
    newChord.AddChild(targetNote!);

    const artics = targetNote!.FindAllDescendantsByType(ClassId.ARTIC);
    for (const artic of artics) {
      artic.MoveItselfTo(newChord);
    }
    targetNote!.ClearRelinquishedChildren();

    if (this.InsertMode()) (this.m_cursor as any).SetPosition(newChord);
    chord = newChord;
  }

  const note = this.PrepareInsertion(chord, 'note') as Note | null;
  if (!note) return false;

  this.SetNoteAttributes(note, pname, oct, accid, accidGes);

  (chord as any).AddChild(note);

  if (this.InsertMode()) {
    const cursor = this.m_cursor as any;
    if (cursor.GetInputMode() === 0 /* PITCH_FIRST */) {
      if (typeof cursor.AdjustPitchByOffset === 'function') cursor.AdjustPitchByOffset(4);
    }
    const placeholder = cursor.GetID();
    this.UpdatePitch(placeholder, cursor.GetPname(), cursor.GetOct(), ACCIDENTAL_WRITTEN_NONE as number, VRV_UNSET);
  }

  this.ClearContext();
  this.SetEditStatus();

  return true;
}
  public InsertNote(elementId: string, pname: number, oct: number, accid: number, accidGes: number,
  dur: number, dots: number, chordMode: boolean): boolean {
  if (chordMode && (!this.InsertMode() || (this.m_cursor as any).GetChordMode() !== 1 /* NEW */)) {
    return this.InsertNoteInChordMode(elementId, pname, oct, accid, accidGes);
  }

  let target: VrvObject | null = null;
  if (this.InsertMode()) {
    const cursor = this.m_cursor as any;
    target = (cursor.HasPosition?.()) ? cursor.GetPosition() : cursor.GetParent();
  }
  else {
    target = this.GetElement(elementId);
  }
  if (!target || !target.IsAnyOf(CHORD_NOTE_REST_LAYER)) return false;

  if (target.Is(ClassId.NOTE)) {
    const note = target as unknown as Note;
    if (note.IsChordTone()) target = note.IsChordTone() as unknown as VrvObject;
  }

  const [targetContainer, previousElement] = this.GetTargetContainerFor(target);
  if (!targetContainer) return false;

  const note = this.PrepareInsertion(targetContainer, 'note') as Note | null;
  if (!note) return false;

  this.SetNoteAttributes(note, pname, oct, accid, accidGes);

  note.SetDur(dur);
  if (dots !== VRV_UNSET) {
    note.SetDots(dots);
  }

  if (previousElement) {
    targetContainer.InsertAfter(previousElement, note);
  }
  else {
    targetContainer.InsertChild(note, 0);
  }

  const noteAny = note as any;
  if (noteAny.IsInBeam?.()) {
    note.SetDur(Math.max(DURATION_8 as number, dur));
  }
  else if (this.InsertMode() && (note.GetDur() > (DURATION_4 as number))) {
    this.AutoBeam(note);
  }

  this.ClearContext();
  this.SetEditStatus();

  if (this.InsertMode()) {
    const cursor = this.m_cursor as any;
    this.MoveCursor(note);
    if (chordMode) {
      if (typeof cursor.AdjustPitchByOffset === 'function') cursor.AdjustPitchByOffset(4);
      const placeholder = cursor.GetID();
      this.UpdatePitch(placeholder, cursor.GetPname(), cursor.GetOct(), ACCIDENTAL_WRITTEN_NONE as number, VRV_UNSET);
    }
    if (cursor.GetInputMode() === 1 /* DURATION_FIRST */) {
      cursor.SetAccid(ACCIDENTAL_WRITTEN_NONE as number);
      cursor.SetAccidImplicit(false);
    }
  }

  return true;
}
  public InsertRest(elementId: string, dur: number, dots: number): boolean {
  let target: VrvObject | null = null;
  if (this.InsertMode()) {
    const cursor = this.m_cursor as any;
    target = (cursor.HasPosition?.()) ? cursor.GetPosition() : cursor.GetParent();
  }
  else {
    target = this.GetElement(elementId);
  }
  if (!target || !target.IsAnyOf(CHORD_NOTE_REST_LAYER)) return false;

  if (target.Is(ClassId.NOTE)) {
    const note = target as unknown as Note;
    if (note.IsChordTone()) target = note.IsChordTone() as unknown as VrvObject;
  }

  const [targetContainer, previousElement] = this.GetTargetContainerFor(target);
  if (!targetContainer) return false;

  const rest = this.PrepareInsertion(targetContainer, 'rest') as Rest | null;
  if (!rest) return false;

  rest.SetDur(dur);

  if (dots !== VRV_UNSET) {
    rest.SetDots(dots);
  }

  if (previousElement) {
    targetContainer.InsertAfter(previousElement, rest);
  }
  else {
    targetContainer.InsertChild(rest, 0);
  }

  const restAny = rest as any;
  if (restAny.IsInBeam?.()) {
    rest.SetDur(Math.max(DURATION_8 as number, dur));
  }
  else if (this.InsertMode() && (rest.GetDur() > (DURATION_4 as number))) {
    this.AutoBeam(rest);
  }

  this.ClearContext();
  this.SetEditStatus();

  if (this.InsertMode()) this.MoveCursor(rest);

  return true;
}
  public AutoBeam(noteOrRest: VrvObject): void {
  const cursor = this.m_cursor as any;
  if (!cursor) throw new Error('AutoBeam: cursor required.');

  // Not sure we actually want to autobeam rest - disabled for now
  if (!noteOrRest.IsAnyOf([ClassId.CHORD, ClassId.NOTE] as ClassIdLike[])) return;

  const layer = (noteOrRest as any).GetFirstAncestor(ClassId.LAYER);
  if (!layer) throw new Error('AutoBeam: layer required.');

  // Auto-beam with chord and notes only - rests could be added
  const classIds: ClassIdLike[] = [ClassId.CHORD, ClassId.NOTE];

  let result: VrvObject | null = noteOrRest;
  const noteAny = noteOrRest as any;

  while (result) {
    result = (layer as any).GetPreviousInLayer(result);

    if (!result || (noteAny.GetAlignment?.() === (result as any).GetAlignment?.())) continue;

    if (result.IsAnyOf(classIds)) break;
  }

  if (!result) return;

  if (result.Is(ClassId.NOTE)) {
    const previousNote = result as unknown as Note;
    const chord = previousNote.IsChordTone();
    if (chord) result = chord as unknown as VrvObject;
  }

  const durInterface = (result as any).GetDurationInterface?.() ?? result;
  if (!durInterface) throw new Error('AutoBeam: duration interface required.');

  if (durInterface.GetDur() < (DURATION_8 as number)) return;

  const meterSig = (layer as any).GetCurrentMeterSig?.();
  if (!meterSig) throw new Error('AutoBeam: meterSig required.');
  const meterCount = (meterSig.GetTotalCount() === 0) ? 4 : meterSig.GetTotalCount();
  const meterUnit = (meterSig.GetUnit() === VRV_UNSET) ? meterCount : meterSig.GetUnit();

  const position = (cursor.GetAlignment?.()) ? cursor.GetAlignment().GetTime() : new Fraction(0, 1);
  // Use compound-meter grouping for meters such as 6/8, 9/8 and 12/8.
  // Simple meters use one denominator unit per beat:
  //   4/4 -> 4 groups of 1/4
  // Compound meters use groups of three denominator units:
  //   6/8 -> 2 groups of 3/8

  const isCompoundMeter = ((meterCount % 3 === 0) && meterSig.GetUnit() === 8);

  let beatDuration = new Fraction(1, meterUnit);
  if (isCompoundMeter) beatDuration = beatDuration.multiply(new Fraction(3, 1));

  // A note beginning on a new beat must not be joined to the preceding
  // beam. Do not apply this at the beginning of the measure.
  if (position.compare(new Fraction(0, 1)) > 0) {
    const beatPosition = position.divide(beatDuration);
    if (beatPosition.GetDenominator() === 1) return;
  }

  if ((result as any).IsInBeam?.()) {
    const previousParent = noteOrRest.GetParent();
    if (!previousParent) throw new Error('AutoBeam: previousParent required.');
    const beam = (result as any).GetAncestorBeam();
    noteOrRest.MoveItselfTo(beam);
    previousParent.ClearRelinquishedChildren();
  }
  else {
    const previousParent = result.GetParent();
    if (!previousParent) throw new Error('AutoBeam: previousParent required.');
    const beam = new Beam();
    previousParent.AddChild(beam);
    result.MoveItselfTo(beam);
    noteOrRest.MoveItselfTo(beam);
    previousParent.ClearRelinquishedChildren();
  }
}
  public CopyCursorPosition(dur: number, dots: number, tie: boolean): boolean {
  if (!this.InsertMode()) return false;
  const cursor = this.m_cursor as any;

  let copyFrom: VrvObject | null = (cursor.HasPosition?.()) ? cursor.GetPosition() : null;
  if (!copyFrom) {
    const layer = cursor.GetParent();
    if (!layer) throw new Error('CopyCursorPosition: layer required.');
    const previousLayer = this.GetPreviousLayer(layer);
    if (previousLayer) {
      const comparison = new ClassIdsComparison([ClassId.CHORD, ClassId.NOTE]);
      copyFrom = (previousLayer as any).FindDescendantByComparison(comparison, -1 /* UNLIMITED_DEPTH */, 2 /* BACKWARD */) as VrvObject | null;
    }
  }

  if (!copyFrom || !copyFrom.IsAnyOf([ClassId.CHORD, ClassId.NOTE] as ClassIdLike[])) return false;

  // Make sure we copy the whole chord
  if (copyFrom.Is(ClassId.NOTE)) {
    const note = copyFrom as unknown as Note;
    if (note.IsChordTone()) copyFrom = note.IsChordTone() as unknown as VrvObject;
  }

  const copy = copyFrom.Clone() as VrvObject;
  (copy as any).CloneReset();
  const durInterface = (copy as any).GetDurationInterface?.() ?? copy;
  if (!durInterface) throw new Error('CopyCursorPosition: duration interface required.');
  durInterface.SetDur(dur);
  durInterface.SetDots(dots);

  let target: VrvObject | null = (cursor.HasPosition?.()) ? cursor.GetPosition() : cursor.GetParent();
  if (!target) return false;
  if (target.Is(ClassId.NOTE)) {
    const note = target as unknown as Note;
    if (note.IsChordTone()) target = note.IsChordTone() as unknown as VrvObject;
  }

  const [targetContainer, previousElement] = this.GetTargetContainerFor(target);
  if (!targetContainer) return false;

  if (previousElement) {
    targetContainer.InsertAfter(previousElement, copy);
  }
  else {
    targetContainer.InsertChild(copy, 0);
  }
  if (tie) this.TieElements(copyFrom, copy);

  if ((copy as any).IsInBeam?.()) {
    durInterface.SetDur(Math.max(DURATION_8 as number, dur));
  }
  else if (durInterface.GetDur() > (DURATION_4 as number)) {
    this.AutoBeam(copy);
  }

  if (tie || copyFrom.GetFirstAncestor(ClassId.MEASURE) === copy.GetFirstAncestor(ClassId.MEASURE)) {
    if (copy.Is(ClassId.CHORD)) {
      const endNotes = copy.FindAllDescendantsByType(ClassId.NOTE);
      for (const object of endNotes) {
        const note = object as unknown as Note;
        const accid = (note as any).GetDrawingAccid?.();
        if (accid && accid.HasAccid()) {
          accid.SetAccidGes(Att.AccidentalWrittenToGestural(accid.GetAccid()));
          accid.ResetAccidental();
        }
      }
    }
    else {
      const note = copy as unknown as Note;
      const accid = (note as any).GetDrawingAccid?.();
      if (accid && accid.HasAccid()) {
        accid.SetAccidGes(Att.AccidentalWrittenToGestural(accid.GetAccid()));
        accid.ResetAccidental();
      }
    }
  }

  this.ClearContext();
  this.SetEditStatus();

  this.MoveCursor(copy);
  if (cursor.GetInputMode() === 1 /* DURATION_FIRST */) {
    cursor.SetAccid(ACCIDENTAL_WRITTEN_NONE as number);
    cursor.SetAccidImplicit(false);
  }

  return true;
}
  public TieElements(start: VrvObject, end: VrvObject): void {
  if (!start) throw new Error('TieElements: start required.');
  if (!end) throw new Error('TieElements: end required.');

  // Make sure the tie is between notes or between chords
  const chordNote: ClassIdLike[] = [ClassId.CHORD, ClassId.NOTE];
  if (!start.IsAnyOf(chordNote)) return;
  if (!end.IsAnyOf(chordNote)) return;
  if (start.GetClassId() !== end.GetClassId()) return;

  const measure = start.GetFirstAncestor(ClassId.MEASURE);
  if (!measure) throw new Error('TieElements: measure required.');

  if (end.Is(ClassId.CHORD)) {
    const startNotes = start.FindAllDescendantsByType(ClassId.NOTE);
    const endNotes = end.FindAllDescendantsByType(ClassId.NOTE);
    // No note, or not the same number of notes, which should never happen because tied chords are copied
    if (startNotes.length === 0 || startNotes.length !== endNotes.length) return;
    for (let i = 0; i < startNotes.length; i++) {
      const tie = new Tie();
      measure.AddChild(tie);
      tie.SetStartid('#' + startNotes[i].GetID());
      tie.SetEndid('#' + endNotes[i].GetID());
    }
  }
  else {
    const tie = new Tie();
    measure.AddChild(tie);
    tie.SetStartid('#' + start.GetID());
    tie.SetEndid('#' + end.GetID());
  }
}

  public override ParseEditorCMNAction(json: JsonxxObject): boolean {
    const action = json.has('action') ? String(json.getValue('action') ?? '') : '';

    if (action === 'insertCursorByDur') {
      const out = this.ParseInsertCursorByDurAction(this.paramOf(json));
      if (out) { this.PrepareUndo(); return this.InsertCursorByDur(out.dur, out.dots); }
      LogWarning('Could not parse the insertCursorByDur action');
    }
    else if (action === 'insertCursorByPitch') {
      const out = this.ParseInsertCursorByPitchAction(this.paramOf(json));
      if (out) { this.PrepareUndo(); return this.InsertCursorByPitch(out.pname, out.oct, out.accid, out.midi); }
      LogWarning('Could not parse the insertCursorByPitch action');
    }
    else if (action === 'insertCursorByType') {
      const out = this.ParseInsertCursorByTypeAction(this.paramOf(json));
      if (out) { this.PrepareUndo(); return this.InsertCursorByType(out.insertType); }
      LogWarning('Could not parse the insertCursorByType action');
    }
    else if (action === 'insertCursorContainer') {
      const out = this.ParseInsertCursorContainerAction(this.paramOf(json));
      if (out) { this.PrepareUndo(); return this.InsertCursorContainer(out.container); }
      LogWarning('Could not parse the insertCursorContainer action');
    }
    else if (action === 'insertMeasure') {
      const out = this.ParseInsertMeasureAction(this.paramOf(json));
      if (out) { this.PrepareUndo(); return this.InsertMeasure(out.elementId, out.number, out.insertBefore); }
      LogWarning('Could not parse the insertMeasure action');
    }
    else if (action === 'insertNote') {
      const out = this.ParseInsertNoteAction(this.paramOf(json));
      if (out) {
        this.PrepareUndo();
        return this.InsertNote(out.elementId, out.pname, out.oct, out.accid, out.accidGes, out.dur, out.dots, out.chordMode);
      }
      LogWarning('Could not parse the insertNote action');
    }
    else if (action === 'insertRest') {
      const out = this.ParseInsertRestAction(this.paramOf(json));
      if (out) { this.PrepareUndo(); return this.InsertRest(out.elementId, out.dur, out.dots); }
      LogWarning('Could not parse the insertRest action');
    }
    else if (action === 'resetCursorContainer') {
      const out = this.ParseResetCursorContainerAction(this.paramOf(json));
      if (out) { this.PrepareUndo(); return this.ResetCursorContainer(out.container); }
      LogWarning('Could not parse the resetCursorContainer action');
    }
    return false;
  }

  private paramOf(json: JsonxxObject): Record<string, unknown> {
    const p = json.has('param') ? json.getValue('param') : undefined;
    return (p && typeof p === 'object' && !Array.isArray(p)) ? (p as Record<string, unknown>) : {};
  }

  private has(p: Record<string, unknown>, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(p, key) && p[key] !== undefined && p[key] !== null;
  }

  public ParseInsertCursorByDurAction(p: Record<string, unknown>): { dur: number; dots: number } | null {
    const dur = DURATION_NONE as number;
    let dots = VRV_UNSET;
    if (!this.has(p, 'dur') || typeof p.dur !== 'string') return null;
    const outDur = attConverter.StrToDuration(p.dur);
    if (this.has(p, 'dots') && typeof p.dots === 'number') dots = p.dots as number;
    return { dur: outDur, dots };
  }

  public ParseInsertCursorByPitchAction(
    p: Record<string, unknown>
  ): { pname: number; oct: number; accid: number; midi: number } | null {
    let pname = PITCHNAME_NONE as number;
    let oct = VRV_UNSET;
    let accid = ACCIDENTAL_WRITTEN_NONE as number;
    let midi = VRV_UNSET;

    // At least one of the two
    if (this.has(p, 'pname') && typeof p.pname === 'string') {
      pname = attConverter.StrToPitchname(p.pname);
    }
    else if (this.has(p, 'midi') && typeof p.midi === 'number') {
      midi = p.midi as number;
    }
    else return null;

    if (this.has(p, 'oct') && typeof p.oct === 'number') oct = p.oct as number;
    if (this.has(p, 'accid') && typeof p.accid === 'string') accid = attConverter.StrToAccidentalWritten(p.accid);
    return { pname, oct, accid, midi };
  }

  public ParseInsertCursorByTypeAction(p: Record<string, unknown>): { insertType: CursorInsertType } | null {
    if (!this.has(p, 'type') || typeof p.type !== 'string') return null;
    if (p.type === 'rest') return { insertType: CursorInsertType.CURSOR_INSERT_REST };
    if (p.type === 'tie') return { insertType: CursorInsertType.CURSOR_INSERT_TIE };
    if (p.type === 'copy') return { insertType: CursorInsertType.CURSOR_INSERT_COPY };
    return null;
  }

  public ParseInsertCursorContainerAction(p: Record<string, unknown>): { container: CursorContainer } | null {
    if (!this.has(p, 'container') || typeof p.container !== 'string') return null;
    if (p.container === 'tuplet') return { container: CursorContainer.CURSOR_CONTAINER_TUPLET };
    if (p.container === 'graceGrp') return { container: CursorContainer.CURSOR_CONTAINER_GRACEGRP };
    return null;
  }

  public ParseInsertMeasureAction(
    p: Record<string, unknown>
  ): { elementId: string; number: number; insertBefore: boolean } | null {
    let number = 0;
    let elementId = '';
    let insertBefore = false;
    if (this.has(p, 'elementId') && typeof p.elementId === 'string') elementId = p.elementId;
    if (!this.has(p, 'number') || typeof p.number !== 'number') return null;
    number = p.number as number;
    if (this.has(p, 'insertBefore') && typeof p.insertBefore === 'boolean') insertBefore = p.insertBefore;
    return { elementId, number, insertBefore };
  }

  public ParseInsertNoteAction(p: Record<string, unknown>): {
    elementId: string; pname: number; oct: number; accid: number; accidGes: number; dur: number; dots: number; chordMode: boolean;
  } | null {
    const chordMode = false;
    let pname = PITCHNAME_NONE as number;
    let oct = VRV_UNSET;
    let accid = ACCIDENTAL_WRITTEN_NONE as number;
    let accidGes = ACCIDENTAL_GESTURAL_NONE as number;
    let dur = DURATION_NONE as number;
    let dots = VRV_UNSET;

    if (!this.has(p, 'elementId') || typeof p.elementId !== 'string') return null;
    const elementId = p.elementId;
    if (!this.has(p, 'pname') || typeof p.pname !== 'string') return null;
    pname = attConverter.StrToPitchname(p.pname);
    if (!this.has(p, 'oct') || typeof p.oct !== 'number') return null;
    oct = p.oct as number;

    if (this.has(p, 'accid') && typeof p.accid === 'string') accid = attConverter.StrToAccidentalWritten(p.accid);
    if (this.has(p, 'accidGes') && typeof p.accidGes === 'string') accidGes = attConverter.StrToAccidentalGestural(p.accidGes);

    // At least one of the two
    if (!this.has(p, 'dur') && !this.has(p, 'chordMode')) return null;

    if (this.has(p, 'dur') && typeof p.dur === 'string') dur = attConverter.StrToDuration(p.dur);
    if (this.has(p, 'dots') && typeof p.dots === 'number') dots = p.dots as number;
    const outChordMode = (this.has(p, 'chordMode') && p.chordMode === true) || chordMode;
    return { elementId, pname, oct, accid, accidGes, dur, dots, chordMode: outChordMode };
  }

  public ParseInsertRestAction(p: Record<string, unknown>): { elementId: string; dur: number; dots: number } | null {
    const dur = DURATION_NONE as number;
    let dots = VRV_UNSET;
    if (!this.has(p, 'elementId') || typeof p.elementId !== 'string') return null;
    const elementId = p.elementId;
    if (!this.has(p, 'dur') || typeof p.dur !== 'string') return null;
    const outDur = attConverter.StrToDuration(p.dur);
    if (this.has(p, 'dots') && typeof p.dots === 'number') dots = p.dots as number;
    return { elementId, dur: outDur, dots };
  }

  public ParseResetCursorContainerAction(p: Record<string, unknown>): { container: CursorContainer } | null {
    if (!this.has(p, 'container') || typeof p.container !== 'string') return null;
    if (p.container === 'tuplet') return { container: CursorContainer.CURSOR_CONTAINER_TUPLET };
    if (p.container === 'graceGrp') return { container: CursorContainer.CURSOR_CONTAINER_GRACEGRP };
    return null;
  }

  public InsertCursorByDur(dur: number, dots: number): boolean {
    if (!this.InsertMode()) return false;
    const cursor = this.m_cursor as any;
    if (cursor.GetInputMode() !== 0 /* PITCH_FIRST */) return false;

    const pname = cursor.HasPname?.() ? cursor.GetPname() : (PITCHNAME_c as number);
    const oct = cursor.HasOct?.() ? cursor.GetOct() : 3;
    const [accid, accidGes] = cursor.GetAccidValue() as [number, number];

    let outDots = dots;
    if (outDots === VRV_UNSET && cursor.HasDots?.()) outDots = cursor.GetDots();

    const id = cursor.GetID();

    if (cursor.IsTieMode()) {
      return this.CopyCursorPosition(dur, outDots, cursor.GetTieMode() === 2 /* TIE */);
    }
    else if (cursor.IsRestMode()) {
      return this.InsertRest(id, dur, outDots);
    }
    else {
      return this.InsertNote(id, pname, oct, accid, accidGes, dur, outDots, cursor.IsChordMode());
    }
  }

  public InsertCursorByPitch(pnameIn: number, octIn: number, accidIn: number, midi: number): boolean {
    if (!this.InsertMode()) return false;
    const cursor = this.m_cursor as any;
    if (cursor.GetInputMode() !== 1 /* DURATION_FIRST */) return false;

    let pname = pnameIn;
    let oct = octIn;
    let accid = accidIn;
    if (midi !== VRV_UNSET) {
      const placeholder = cursor.GetID();
      this.UpdatePitch(placeholder, PITCHNAME_NONE as number, VRV_UNSET, ACCIDENTAL_WRITTEN_NONE as number, midi);
      pname = cursor.GetPname();
      oct = VRV_UNSET;
      accid = ACCIDENTAL_WRITTEN_NONE as number;
    }

    if (oct === VRV_UNSET) oct = cursor.GetOct();

    // Since we did not know the pitch yet we need to calculate the actual accid
    if (pname !== (PITCHNAME_NONE as number)) cursor.SetPname(pname);

    const effective = (accid === (ACCIDENTAL_WRITTEN_NONE as number)) ? cursor.GetAccid() : accid;
    const [actualAccid, isImplicit] = this.GetActualAccid(cursor, effective);
    cursor.SetAccid(actualAccid);
    cursor.SetAccidImplicit(isImplicit);
    const value = cursor.GetAccidValue() as [number, number];
    accid = value[0];
    const accidGes = value[1];

    const dur = cursor.HasDur?.() ? cursor.GetDur() : (DURATION_4 as number);
    const dots = cursor.HasDots?.() ? cursor.GetDots() : VRV_UNSET;

    const id = cursor.GetID();
    return this.InsertNote(id, pname, oct, accid, accidGes, dur, dots, cursor.IsChordMode());
  }

  public InsertCursorByType(insertType: CursorInsertType): boolean {
    if (!this.InsertMode()) return false;
    const cursor = this.m_cursor as any;
    if (cursor.GetInputMode() !== 1 /* DURATION_FIRST */) return false;

    const dur = cursor.HasDur?.() ? cursor.GetDur() : (DURATION_4 as number);
    const dots = cursor.HasDots?.() ? cursor.GetDots() : VRV_UNSET;

    const id = cursor.GetID();

    cursor.SetChordMode(0 /* CHORD_NONE */);

    if (insertType === CursorInsertType.CURSOR_INSERT_REST) {
      return this.InsertRest(id, dur, dots);
    }
    else {
      return this.CopyCursorPosition(cursor.GetDur(), cursor.GetDots(), insertType === CursorInsertType.CURSOR_INSERT_TIE);
    }
  }

  public InsertCursorContainer(_container: CursorContainer): boolean {
    return true;
  }

  public ResetCursorContainer(_container: CursorContainer): boolean {
    return true;
  }

  public InsertMeasure(elementIdIn: string, number: number, insertBefore: boolean): boolean {
    const elementId = elementIdIn;
    const endInsert = elementId === '';
    let measure: VrvObject | null = null;

    let measureN: any = VRV_UNSET;
    if (endInsert) {
      measure = (this.m_doc as any).FindDescendantByType(ClassId.MEASURE, UNLIMITED_DEPTH, BACKWARD);
    }
    else {
      measure = this.ResolveElement(elementId, false);
    }
    if (!measure) return false;

    const measureAny = measure as any;
    if (endInsert && IsValidInteger(String(measureAny.GetN()))) measureN = Number.parseInt(String(measureAny.GetN()), 10);

    const initProcessingLists = new InitProcessingListsFunctor();
    measure.Process(initProcessingLists);
    const layerTree = initProcessingLists.GetLayerTree();

    for (let i = 0; i < number; i++) {
      const newMeasure = new Measure();
      if (endInsert && i === 0 && measureAny.HasRight?.()) {
        newMeasure.SetRight(measureAny.GetRight());
        measureAny.SetRight(0 /* BARRENDITION_NONE */);
      }
      if (measureN !== VRV_UNSET) {
        // AttNNumberLike holds a number-like string in C++ (m_n is std::string)
        (newMeasure as any).SetN(StringFormat('%d', measureN + number - i));
      }

      // Now we can process by layer and move their content to (measure) segments
      for (const [staffN, staves] of layerTree.child) {
        const staff = new Staff(staffN);
        newMeasure.AddChildBack(staff);
        for (const [layerN] of staves.child) {
          const layer = new Layer();
          layer.SetN(layerN);
          staff.AddChild(layer);
        }
      }
      if (insertBefore) {
        measure.GetParent()!.InsertBefore(measure, newMeasure);
      }
      else {
        measure.GetParent()!.InsertAfter(measure, newMeasure);
      }
      this.m_chainedId = newMeasure.GetID();
    }

    this.ClearContext();
    return true;
  }
}

