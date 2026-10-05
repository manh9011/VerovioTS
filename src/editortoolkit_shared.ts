// Shared editor toolkit + EditorTreeObject - pure TS translation of
// src-cpp/src/editortoolkit_shared.cpp / include/vrv/editortoolkit_shared.h
// MEIOutput/MEIInput still pending -> injected seam (rule 13 AGENTS.md).
import { EditorToolkit } from './editortoolkit.js';
import { JsonxxObject } from './jsonxx.js';
import { ObjectFactory, VrvObject } from './object.js';
import { LogInfo, LogWarning, LogError } from './vrv.js';
import { Att } from './att.js';
import { Accid } from './accid.js';
import { Text } from './text.js';
import { CursorFunctor, SectionContextFunctor, ScoreContextFunctor } from './editfunctor.js';
import { EditorTreeObject } from './editfunctor.js';
import { FindAllReferringObjectsFunctor, FindAllReferencedObjectsFunctor } from './findfunctor.js';
import { AttNIntegerComparison, ClassIdsComparison } from './comparison.js';
import { ATT_CLASS_IDS } from './attmodule.js';
import { AttModule } from './attmodule.js';
import { Fraction } from './fraction.js';
import { MNum } from './mnum.js';
import { UTF8to32, UTF32to8 } from './vrv.js';
import { ClassId, InterfaceId, UNLIMITED_DEPTH, BACKWARD, KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_DOT, VRV_UNSET, ArrayOfStrAttr, VisibilityType } from './vrvdef.js';
import { PITCHNAME_c, PITCHNAME_d, PITCHNAME_e, PITCHNAME_f, PITCHNAME_g, PITCHNAME_a, PITCHNAME_b, PITCHNAME_NONE, ACCIDENTAL_WRITTEN_NONE, ACCIDENTAL_WRITTEN_n, ACCIDENTAL_WRITTEN_s, ACCIDENTAL_WRITTEN_f } from './libmei-att.js';
import { JsonxxArray } from './jsonxx.js';

export const UNDO_MEMORY_LIMIT = 256 * 1024 * 1024;

export enum SelectCustom { SELECT_NONE = 0, SELECT_NOTE, SELECT_TEXT_PARENT }
export enum DeleteNavigation { DELETE_NO_NAVIGATON = 0, DELETE_BACKSPACE, DELETE_FORWARD }

export interface UndoState { data: string; status: string; options: number; }

/** MEI serialization seam until iomei port lands. */
export interface MeiIoSeam {
  exportState(doc: unknown): string;
  importState(doc: unknown, data: string): boolean;
  exportScoreDef(doc: unknown): string;
}

export function wrapObj(v: unknown): Record<string, unknown> {
  return (v && typeof v === 'object' && !Array.isArray(v)) ? (v as Record<string, unknown>) : {};
}

/** Class state, ParseEditorAction dispatcher, undo stack, cursor ops, context builders. */
export abstract class EditorToolkitShared extends EditorToolkit {
  protected m_undoPrepared = false;
  protected m_undoStack: UndoState[] = [];
  protected m_redoStack: UndoState[] = [];
  protected m_undoMemoryUsage = 0;
  protected m_scoreContext: VrvObject | null = null;
  protected m_sectionContext: VrvObject | null = null;
  protected m_currentContext: VrvObject | null = null;
  protected meiIo: MeiIoSeam;

  public constructor(doc: unknown, view: unknown, meiIo: MeiIoSeam) {
    super(doc as any, view as any);
    this.meiIo = meiIo;
    this.m_undoPrepared = false;
    this.m_scoreContext = null;
    this.m_sectionContext = null;
    this.m_currentContext = null;
    this.SetEditStatus();
  }

  public SetMeiIoSeam(seam: MeiIoSeam): void { this.meiIo = seam; }

  public override ParseEditorAction(jsonEditorAction: string): boolean {
    return this.ParseEditorActionCommit(jsonEditorAction, false);
  }

  public ParseEditorActionCommit(json: string, commitOnly: boolean): boolean {
    return this.ParseEditorActionCommitImpl(json, commitOnly);
  }

  /** CMN subclass overrides return true for its actions; shared default false. */
  protected IsCmnAction(_action: string): boolean { return false; }

  public ParseEditorActionCommitImpl(jsonEditorAction: string, commitOnly: boolean): boolean {
    const json = new JsonxxObject();
    if (!json.parse(jsonEditorAction)) {
      LogError('Cannot parse JSON std::string.');
      return false;
    }
    const hasAction = json.has('action');
    if (hasAction && typeof json.getValue('action') !== 'string') LogWarning('Incorrectly formatted JSON action.');
    const action = hasAction ? String(json.getValue('action')) : '';

    if (action !== 'context' && action !== 'properties') (this.m_doc as any).SetFocus();

    if (action === 'commit') {
      (this.m_doc as any).PrepareData();
      (this.m_doc as any).ScoreDefSetCurrentDoc(true);
      (this.m_doc as any).RefreshLayout();
      this.m_undoPrepared = false;
      this.SetEditStatus();
      return true;
    }
    if (action === 'undo' || action === 'redo') {
      if (action === 'undo') this.Undo();
      else this.Redo();
      this.m_undoPrepared = false;
      return true;
    }
    if (commitOnly) return false;

    const param = json.has('param') ? json.getValue('param') : undefined;
    if (param === undefined || param === null) LogWarning('Incorrectly formatted JSON param.');

    if (action === 'chain') {
      if (!Array.isArray(param)) { LogError('Incorrectly formatted JSON action'); return false; }
      return this.Chain(param);
    }
    else if (action === 'context') {
      const out = this.ParseContextAction(wrapObj(param));
      if (out) {
        if (out.scores) return this.ContextForScores(true);
        else if (out.sections) return this.ContextForSections(true);
        else return this.ContextForElement(out.elementId);
      }
      LogWarning('Could not parse the context action');
    }
    else if (action === 'delete') {
      const out = this.ParseDeleteAction(wrapObj(param));
      if (out) { this.PrepareUndo(); return this.Delete(out.elementId, out.navigation); }
      LogWarning('Could not parse the delete action');
    }
    else if (action === 'drag') {
      const out = this.ParseDragAction(wrapObj(param));
      if (out) { this.PrepareUndo(); return this.Drag(out.elementId, out.x, out.y); }
      LogWarning('Could not parse the drag action');
    }
    else if (action === 'insert') {
      const out = this.ParseInsertAction(wrapObj(param));
      if (out) {
        this.PrepareUndo();
        if (out.insertMode === 'appendChild') return this.AppendChild(out.elementId, out.elementName, false);
        else if (out.insertMode === 'appendChildNoDuplicate') return this.AppendChild(out.elementId, out.elementName, true);
        else if (out.insertMode === 'insertBefore') return this.InsertBefore(out.elementId, out.elementName);
        else if (out.insertMode === 'insertAfter') return this.InsertAfter(out.elementId, out.elementName);
      }
      LogWarning('Could not parse the insert action');
    }
    else if (action === 'insertControl') {
      const out = this.ParseInsertControlAction(wrapObj(param));
      if (out) { this.PrepareUndo(); return this.InsertControl(out.elementName, out.startId, out.endId); }
      LogWarning('Could not parse the insertControl action');
    }
    else if (this.IsCmnAction(action)) {
      return this.ParseEditorCMNAction(json);
    }
    else if (action === 'keyDown') {
      const out = this.ParseKeyDownAction(wrapObj(param));
      if (out) {
        this.PrepareUndo(this.InsertMode());
        return this.KeyDown(out.elementId, out.key, out.shiftKey, out.ctrlKey);
      }
      LogWarning('Could not parse the keyDown action');
    }
    else if (action === 'navigate') {
      const out = this.ParseNavigate(wrapObj(param));
      if (out) return this.Navigate(out.elementId, out.direction);
      LogWarning('Could not parse the navigate action');
    }
    else if (action === 'properties') {
      const out = this.ParsePropertiesAction(wrapObj(param));
      if (out !== null) {
        if (out === '') return this.GetScoreDef();
        else return this.SetScoreDef(out);
      }
    }
    else if (action === 'resetCursor') {
      const out = this.ParseResetCursorAction(wrapObj(param));
      if (out !== null) return this.ResetCursor(out);
      LogWarning('Could not parse the resetCursor action');
    }
    else if (action === 'select') {
      const out = this.ParseSelectAction(wrapObj(param));
      if (out) return this.Select(out.elementId, out.secondary, out.custom);
    }
    else if (action === 'set') {
      const out = this.ParseSetAction(wrapObj(param));
      if (out) {
        this.PrepareUndo(this.InsertMode());
        return this.Set(out.elementId, out.attribute, out.value);
      }
      LogWarning('Could not parse the set action');
    }
    else if (action === 'setCursor') {
      const out = this.ParseSetCursorAction(wrapObj(param));
      if (out) return this.SetCursor(out.elementId, out.inputMode, out.chordMode);
      LogWarning('Could not parse the setCursor action');
    }
    else if (action === 'updateCursor') {
      const out = this.ParseUpdateCursorAction(wrapObj(param));
      if (out) return this.UpdateCursor(out.restMode, out.chordMode, out.tieMode);
      LogWarning('Could not parse the setCursor action');
    }
    else if (action === 'updatePitch') {
      const out = this.ParseUpdatePitchAction(wrapObj(param));
      if (out) {
        this.PrepareUndo(this.InsertMode());
        return this.UpdatePitch(out.elementId, out.pname, out.oct, out.accid, out.midi);
      }
      LogWarning('Could not parse the updatePitch action');
    }
    else {
      LogWarning("Unknown action type '%s'.", action);
    }
    return false;
  }

  // Shared default: CMN subclass overrides.
  public ParseEditorCMNAction(_json: JsonxxObject): boolean { return false; }
  public Chain(actions: unknown[]) {
  let status = true;
  this.m_chainedId = '';
  for (let i = 0; i < actions.length; i++) {
    status = this.ParseEditorActionCommit(JSON.stringify(actions[i]), !status);
  }
  return status;
}
  public ParseContextAction(param: Record<string, unknown>) {
  if (typeof param.elementId === 'string') return { elementId: param.elementId, scores: false, sections: false };
  if (typeof param.document === 'string') {
    const isScores = param.document === 'scores';
    return { elementId: '', scores: isScores, sections: !isScores };
  }
  return null;
}
  public ParseDeleteAction(param: Record<string, unknown>) {
  if (typeof param.elementId !== 'string') return null;
  let navigation = DeleteNavigation.DELETE_FORWARD;
  if (typeof param.backspace === 'boolean') navigation = param.backspace ? DeleteNavigation.DELETE_BACKSPACE : DeleteNavigation.DELETE_FORWARD;
  return { elementId: param.elementId, navigation };
}
  public ParseDragAction(param: Record<string, unknown>) {
  if (typeof param.elementId !== 'string' || typeof param.x !== 'number' || typeof param.y !== 'number') return null;
  return { elementId: param.elementId, x: param.x, y: param.y };
}
  public ParseInsertAction(param: Record<string, unknown>) {
  if (typeof param.elementName !== 'string' || typeof param.elementId !== 'string' || typeof param.insertMode !== 'string') return null;
  return { elementName: param.elementName, elementId: param.elementId, insertMode: param.insertMode };
}
  public ParseInsertControlAction(param: Record<string, unknown>) {
  if (typeof param.elementName !== 'string' || typeof param.startId !== 'string') return null;
  return { elementName: param.elementName, startId: param.startId, endId: typeof param.endId === 'string' ? param.endId : '' };
}
  public ParseKeyDownAction(param: Record<string, unknown>) {
  if (typeof param.elementId !== 'string' || typeof param.key !== 'number') return null;
  return {
    elementId: param.elementId, key: param.key,
    shiftKey: param.shiftKey === true, ctrlKey: param.ctrlKey === true,
  };
}
  public ParseNavigate(param: Record<string, unknown>) {
  if (typeof param.elementId !== 'string' || typeof param.direction !== 'number') return null;
  return { elementId: param.elementId, direction: param.direction };
}
  public ParsePropertiesAction(param: Record<string, unknown>) {
  if (typeof param.scoreDef === 'string') return param.scoreDef;
  return '';
}
  public ParseResetCursorAction(param: Record<string, unknown>) {
  return param.maintainChordMode === true;
}
  public ParseSelectAction(param: Record<string, unknown>) {
  if (typeof param.elementId !== 'string') return null;
  let custom = SelectCustom.SELECT_NONE;
  let secondary = false;
  if (typeof param.secondary === 'boolean') secondary = param.secondary;
  else if (typeof param.custom === 'string') {
    if (param.custom === 'note') custom = SelectCustom.SELECT_NOTE;
    else if (param.custom === 'textParent') custom = SelectCustom.SELECT_TEXT_PARENT;
  }
  return { elementId: param.elementId, secondary, custom };
}
  public ParseSetAction(param: Record<string, unknown>) {
  if (typeof param.elementId !== 'string' || typeof param.attribute !== 'string' || typeof param.value !== 'string') return null;
  return { elementId: param.elementId, attribute: param.attribute, value: param.value };
}
  public ParseSetCursorAction(param: Record<string, unknown>) {
  if (typeof param.inputMode !== 'string' || typeof param.chordMode !== 'boolean') return null;
  return {
    elementId: typeof param.elementId === 'string' ? param.elementId : '',
    inputMode: param.inputMode === 'pitchFirst' ? 0 : 1,
    chordMode: param.chordMode,
  };
}
  public ParseUpdateCursorAction(param: Record<string, unknown>) {
  let restMode = false, chordMode = false, tieMode = 0;
  if (typeof param.chordMode === 'boolean') chordMode = param.chordMode;
  else if (typeof param.restMode === 'boolean') restMode = param.restMode;
  else if (typeof param.tieMode === 'string') tieMode = param.tieMode === 'tie' ? 1 : 2;
  return { restMode, chordMode, tieMode };
}
  public ParseUpdatePitchAction(param: Record<string, unknown>) {
  if (typeof param.elementId !== 'string') return null;
  const att = new Att();
  return {
    elementId: param.elementId,
    pname: typeof param.pname === 'string' ? att.StrToPitchname(param.pname) : PITCHNAME_NONE,
    oct: typeof param.oct === 'number' ? param.oct : VRV_UNSET,
    accid: typeof param.accid === 'string' ? att.StrToAccidentalWritten(param.accid) : ACCIDENTAL_WRITTEN_NONE,
    midi: typeof param.midi === 'number' ? param.midi : VRV_UNSET,
  };
}
  public SetEditStatus() {
  this.m_editStatus.reset();
  this.m_editStatus.import('chainedId', this.m_chainedId);
  this.m_editStatus.import('canUndo', this.CanUndo());
  this.m_editStatus.import('canRedo', this.CanRedo());
  this.m_editStatus.import('isMensuralMusicOnly', (this.m_doc as any).IsMensuralMusicOnly());
  this.m_editStatus.import('insertMode', this.InsertMode());
  if (this.m_selectionId !== '') {
    const selection = new JsonxxObject();
    selection.import('id', this.m_selectionId);
    selection.import('element', ObjectFactory.GetInstance().GetClassName(this.m_selectionClassId));
    if (this.m_selectionSecondaryId !== '') selection.import('secondaryId', this.m_selectionSecondaryId);
    this.m_editStatus.import('selection', selection);
  }
  if (this.InsertMode() && this.m_cursor) {
    const cursor = this.m_cursor as any;
    const att = new Att();
    const insertion = new JsonxxObject();
    insertion.import('oct', cursor.HasOct ? cursor.HasOct() ? cursor.GetOct() : 4 : 4);
    insertion.import('pname', (typeof cursor.HasPname === 'function' && cursor.HasPname()) ? att.PitchnameToStr(cursor.GetPname()) : 'c');
    insertion.import('dur', (typeof cursor.HasDur === 'function' && cursor.HasDur()) ? att.DurationToStr(cursor.GetDur()) : '4');
    insertion.import('dots', (typeof cursor.HasDots === 'function' && cursor.HasDots()) ? cursor.GetDots() : 0);
    insertion.import('inputMode', cursor.GetInputMode() === 0 ? 'pitchFirst' : 'durationFirst');
    insertion.import('chordMode', cursor.IsChordMode());
    insertion.import('restMode', cursor.IsRestMode());
    insertion.import('accid', (typeof cursor.HasAccid === 'function' && cursor.HasAccid())
      ? att.AccidentalWrittenToStr(cursor.GetAccid())
      : '');
    insertion.import('accidImplicit', cursor.IsAccidImplicit());
    this.m_editStatus.import('insertion', insertion);
  }
}
  public ReloadEditStatus(statusStr: string, insertMode: boolean) {
  const status = new JsonxxObject();
  if (!status.parse(statusStr)) return;

  if (!insertMode) this.m_chainedId = '';
  this.ResetSelect();

  const selection = status.has('selection') ? status.getValue('selection') : null;
  if (selection && typeof selection === 'object') {
    const sel = selection as Record<string, unknown>;
    if (typeof sel.id === 'string') this.m_selectionId = sel.id;
    if (typeof sel.element === 'string') this.m_selectionClassId = ObjectFactory.GetInstance().GetClassId(sel.element);
    this.m_selectionSecondaryId = typeof sel.secondaryId === 'string' ? sel.secondaryId : '';
  }

  const insertion = status.has('insertion') ? status.getValue('insertion') : null;
  if (insertion && typeof insertion === 'object' && insertMode) {
    const ins = insertion as Record<string, unknown>;
    let inputMode = 0;
    if (typeof ins.inputMode === 'string') inputMode = ins.inputMode === 'pitchFirst' ? 0 : 1;
    const chordMode = ins.chordMode === true;

    this.SetCursor(this.m_selectionId, inputMode, chordMode);
    if (!this.m_cursor) return this.SetEditStatus(), undefined;
    const cursor = this.m_cursor as any;
    const att = new Att();
    if (typeof ins.oct === 'number') cursor.SetOct(ins.oct);
    if (typeof ins.pname === 'string') cursor.SetPname(att.StrToPitchname(ins.pname));
    if (typeof ins.dur === 'string') cursor.SetDur(att.StrToDuration(ins.dur));
    if (typeof ins.dots === 'number' && ins.dots !== 0) cursor.SetDots(ins.dots);
    if (ins.restMode === true) cursor.SetRestMode(true);
    if (typeof ins.accid === 'string') cursor.SetAccid(att.StrToAccidentalWritten(ins.accid));
    if (typeof ins.accidImplicit === 'boolean') cursor.SetAccidImplicit(ins.accidImplicit);
  }

  this.SetEditStatus();
}
  public PrepareUndo(ignoreInsertMode = false) {
  if (ignoreInsertMode && this.InsertMode()) return;
  if (this.m_undoPrepared) return;
  const state: UndoState = { data: this.GetCurrentState(), status: this.EditStatus(), options: this.m_options };
  this.m_undoStack.push(state);
  this.m_undoMemoryUsage += state.data.length;
  while (this.m_redoStack.length) {
    this.m_undoMemoryUsage -= this.m_redoStack[this.m_redoStack.length - 1].data.length;
    this.m_redoStack.pop();
  }
  this.TrimUndoMemory();
  this.m_undoPrepared = true;
}
  public GetCurrentState() {
  return this.meiIo.exportState(this.m_doc);
}
  public ReloadState(state: UndoState) {
  this.ClearContext();
  const insertMode = this.InsertMode();
  this.m_cursor = null;

  const success = this.meiIo.importState(this.m_doc, state.data);
  if (success) {
    (this.m_doc as any).PrepareData();
    (this.m_doc as any).ScoreDefSetCurrentDoc(true);
    this.ReloadEditStatus(state.status, insertMode);
    if (state.options !== this.m_options) this.m_editStatus.import('invalidLayout', true);
  } else {
    this.SetEditStatus();
  }
  return success;
}
  public TrimUndoMemory() {
  while (this.m_undoMemoryUsage > UNDO_MEMORY_LIMIT && this.m_undoStack.length > 0) {
    this.m_undoMemoryUsage -= this.m_undoStack[0].data.length;
    this.m_undoStack.shift();
  }
  LogInfo('Undo stack size: %dMB', Math.trunc(this.m_undoMemoryUsage / 1024 / 1024));
}
  public CanUndo() { return this.m_undoStack.length > 0; }
  public CanRedo() { return this.m_redoStack.length > 0; }
  public Undo() {
  if (!this.CanUndo()) return false;
  const currentState: UndoState = { data: this.GetCurrentState(), status: this.EditStatus(), options: this.m_options };
  this.m_redoStack.push(currentState);
  const previous = this.m_undoStack.pop()!;
  return this.ReloadState(previous);
}
  public Redo() {
  if (!this.CanRedo()) return false;
  const currentState: UndoState = { data: this.GetCurrentState(), status: this.EditStatus(), options: this.m_options };
  this.m_undoStack.push(currentState);
  const redoState = this.m_redoStack.pop()!;
  return this.ReloadState(redoState);
}
  public SetCursor(elementId: string, inputMode: number, chordMode: boolean) {
  let layer: any = null;
  let position: any = null;
  const element = this.ResolveElement(elementId);
  if (!element) return false;
  let updateAccid = false;
  if (element.Is(ClassId.STAFF)) {
    updateAccid = true;
    layer = element.FindDescendantByType(ClassId.LAYER);
  }
  else if (element.Is(ClassId.LAYER)) {
    updateAccid = true;
    layer = element;
  }
  else if (element.IsLayerElement()) {
    layer = element.GetFirstAncestor(ClassId.LAYER);
    position = element;
  }
  const cursorFunctor = new CursorFunctor(layer, position);
  (this.m_doc as any).Process(cursorFunctor);
  this.m_cursor = cursorFunctor.GetCursor() as any;

  if (this.m_cursor) {
    const cursor = this.m_cursor as any;
    cursor.SetInputMode(inputMode);
    if (chordMode && cursor.GetPosition() && cursor.GetPosition().IsAnyOf([ClassId.NOTE, ClassId.CHORD])) {
      cursor.SetRestMode(false);
      cursor.SetChordMode(2);
    }
    if (updateAccid) {
      this.UpdatePitch('', cursor.GetPname(), cursor.GetOct(), ACCIDENTAL_WRITTEN_NONE, VRV_UNSET);
    }
  }
  this.SetEditStatus();
  return true;
}
  public UpdateCursor(restMode: boolean, chordMode: boolean, tieMode: number) {
  if (!this.InsertMode()) return true;
  const cursor = this.m_cursor as any;
  if (chordMode) { cursor.SetRestMode(false); cursor.SetChordMode(2); }
  else if (tieMode !== 0) { cursor.SetTieMode(tieMode); }
  else if (cursor.GetInputMode() === 0) { cursor.SetRestMode(restMode); }
  this.SetEditStatus();
  return true;
}
  public ResetCursor(maintainChordMode: boolean) {
  const cursor = this.m_cursor as any;
  if (this.InsertMode() && cursor && cursor.IsChordMode()) {
    if (cursor.GetPosition()) {
      const position = cursor.GetPosition();
      if (position.Is(ClassId.CHORD)) {
        const chord = position as any;
        const note = chord.GetBottomNote();
        this.UpdatePitch('', note.GetPname(), note.GetOct(), ACCIDENTAL_WRITTEN_NONE, VRV_UNSET);
      }
      this.MoveCursor(cursor.GetPosition(), maintainChordMode);
    }
    if (this.m_cursor) {
      if (maintainChordMode) this.UpdateCursor(false, true, 0);
      else (this.m_cursor as any).SetChordMode(0);
    }
    return true;
  }
  const cursorFunctor = new CursorFunctor(null as any, null);
  (this.m_doc as any).Process(cursorFunctor);
  this.m_cursor = null;
  this.SetEditStatus();
  return true;
}
  public Delete(elementId: string, navigation: DeleteNavigation) {
  if (this.InsertMode()) return true;
  const element = this.ResolveElement(elementId);
  if (!element) return false;

  if (navigation !== DeleteNavigation.DELETE_NO_NAVIGATON) {
    const direction = navigation === DeleteNavigation.DELETE_BACKSPACE ? 37 : 39;
    this.Navigate(elementId, direction);
    if (this.m_chainedId === '' && element.GetParent()) this.m_chainedId = element.GetParent()!.GetID();
  }

  const postProcessObjects = new Set<string>();
  this.PostProcessDeleteObjects(element, postProcessObjects);

  const objectsToDelete = new Set<string>();
  const visited = new Set<VrvObject>();
  objectsToDelete.add(element.GetID());
  this.CollectReferringObjects(element, objectsToDelete, visited);
  for (const id of objectsToDelete) {
    const toDelete = (this.m_doc as any).FindDescendantByID(id);
    if (toDelete && toDelete.GetParent()) toDelete.GetParent().DeleteChild(toDelete);
  }
  for (const id of postProcessObjects) this.PostProcessDelete(id);

  this.ResetSelect();
  if (this.m_chainedId !== '' && !(this.m_doc as any).FindDescendantByID(this.m_chainedId)) this.m_chainedId = '';
  if (this.m_chainedId !== '') this.Select(this.m_chainedId, false, SelectCustom.SELECT_NONE);

  this.ClearContext();
  this.SetEditStatus();
  return true;
}
  public Drag(elementId: string, x: number, y: number) {
  if (this.InsertMode()) return true;
  const element = this.ResolveElement(elementId);
  if (!element) return false;
  if (element.HasInterface(InterfaceId.INTERFACE_PITCH)) {
    const layer = element.GetFirstAncestor(ClassId.LAYER);
    if (!layer) return false;
    const oct = { value: 0 };
    const view = this.m_view as any;
    const pname = view.CalculatePitchCode(layer, view.ToLogicalY(y), (element as any).GetDrawingX(), oct);
    const iface = (element as any).GetPitchInterface();
    iface.SetPname(pname);
    iface.SetOct(oct.value);
    return true;
  }
  return false;
}
  public InsertControl(elementName: string, startId: string, endId: string) {
  if (this.InsertMode()) return true;
  const start = this.ResolveElement(startId, false);
  if (!start) return false;
  const measure = start.GetFirstAncestor(ClassId.MEASURE);
  if (!measure) return false;
  const childElement = this.PrepareInsertion(measure, elementName);
  if (!childElement) return false;
  if (!measure.AddChild(childElement)) return false;
  const timePointInterface = (childElement as any).GetTimePointInterface?.() ?? null;
  if (timePointInterface) timePointInterface.SetStartid('#' + startId);
  if (endId !== '') {
    const end = this.ResolveElement(endId, false);
    if (!end) return false;
    const timeSpanningInterface = (childElement as any).GetTimeSpanningInterface?.() ?? null;
    if (timeSpanningInterface && endId !== '') timeSpanningInterface.SetEndid('#' + endId);
  }
  return true;
}
  public KeyDown(elementId: string, key: number, shiftKey: boolean, ctrlKey: boolean) {
  const element = this.m_cursor ? (this.m_cursor as VrvObject) : this.ResolveElement(elementId);
  if (!element) return false;

  if (element.HasInterface(InterfaceId.INTERFACE_PITCH)) {
    const iface = (element as any).GetPitchInterface();
    let step = 0;
    switch (key) {
      case KEY_UP: step = 1; break;
      case KEY_DOWN: step = -1; break;
      default: step = 0;
    }
    if (ctrlKey) step *= 7;
    iface.AdjustPitchByOffset(step);
    this.UpdatePitch(elementId, iface.GetPname(), iface.GetOct(), ACCIDENTAL_WRITTEN_NONE, VRV_UNSET);
  }
  const cursor = this.m_cursor as any;
  if (element.HasInterface(InterfaceId.INTERFACE_DURATION) && (!cursor || !cursor.Veto('dur'))) {
    const iface = (element as any).GetDurationInterface();
    switch (key) {
      case KEY_LEFT: iface.DecreaseCMNDuration(); break;
      case KEY_RIGHT: iface.IncreaseCMNDuration(); break;
      case KEY_DOT: iface.HasDots() ? iface.ResetAugmentDots() : iface.SetDots(1); break;
      default: break;
    }
    if (cursor && (key === KEY_LEFT || key === KEY_RIGHT)) cursor.OnSet('dur');
  }

  this.PostEditRestriction(element);
  this.SetEditStatus();
  return true;
}
  public Navigate(elementId: string, direction: number) {
  const classIds = [ClassId.CHORD, ClassId.MREST, ClassId.NOTE, ClassId.REST];
  if (this.InsertMode()) return true;
  if (direction !== 37 && direction !== 39) return true;
  const forward = direction === 39;

  this.m_chainedId = '';
  this.SetEditStatus();

  const element = this.GetElement(elementId);
  if (!element) return false;

  const layerElement = element as any;
  if (!layerElement || typeof layerElement.GetAlignment !== 'function') return true;
  const layer = layerElement.GetFirstAncestor(ClassId.LAYER);
  if (!layer) return true;

  let result: any = layerElement;
  while (result) {
    result = forward ? layer.GetNextInLayer(result) : layer.GetPreviousInLayer(result);
    if (!result || layerElement.GetAlignment() === result.GetAlignment()) continue;
    if (result.IsAnyOf(classIds)) break;
  }

  if (!result) {
    const matches = new ClassIdsComparison(classIds);
    if (forward) {
      const nextLayer = this.GetNextLayer(layer);
      if (!nextLayer) return true;
      result = nextLayer.FindDescendantByComparison(matches);
    } else {
      const previousLayer = this.GetPreviousLayer(layer);
      if (!previousLayer) return true;
      result = previousLayer.FindDescendantByComparison(matches, UNLIMITED_DEPTH, BACKWARD);
    }
  }

  if (result) {
    if (result.Is(ClassId.NOTE)) {
      const note = result as any;
      if (note.IsChordTone && note.IsChordTone()) result = note.IsChordTone();
    }
    if (result && result.Is(ClassId.CHORD)) {
      result = (result as any).GetTopNote();
    }
  }
  if (result) this.m_chainedId = result.GetID();
  this.SetEditStatus();
  return true;
}
  public Select(elementId: string, secondary: boolean, custom: SelectCustom) {
  if (this.InsertMode()) return true;
  if (secondary) {
    this.m_selectionSecondaryId = '';
    if (this.m_selectionId !== '') {
      const element = this.GetElement(elementId);
      if (!element) return false;
      this.m_selectionSecondaryId = elementId;
    }
  }
  else if (custom === SelectCustom.SELECT_NOTE) {
    this.m_selectionSecondaryId = '';
    if (this.m_selectionId !== '') {
      const element = this.GetElement(elementId);
      if (!element || !element.Is(ClassId.NOTE)) return false;
      const note = element as any;
      if (note && note.IsChordTone && note.IsChordTone()) {
        const chord = note.IsChordTone();
        this.m_selectionId = chord.GetID();
        this.m_selectionClassId = chord.GetClassId();
      }
    }
  }
  else if (custom === SelectCustom.SELECT_TEXT_PARENT) {
    this.m_selectionSecondaryId = '';
    if (this.m_selectionId !== '') {
      const element = this.GetElement(elementId);
      if (!element || !element.IsAnyOf([ClassId.DIR, ClassId.DYNAM, ClassId.FING, ClassId.SYL])) return false;
      const text = element.FindDescendantByType(ClassId.TEXT);
      if (text) {
        this.m_selectionId = text.GetID();
        this.m_selectionClassId = text.GetClassId();
      }
    }
  }
  else {
    this.ResetSelect();
    const element = this.GetElement(elementId);
    if (!element) return false;
    this.m_selectionId = elementId;
    this.m_selectionClassId = element.GetClassId();
  }
  this.SetEditStatus();
  return true;
}
  public Set(elementId: string, attribute: string, value: string) {
  const allowCursor = ['oct', 'pname', 'dots', 'dur', 'accid'];
  if (this.InsertMode() && this.m_cursor) {
    const cursor = this.m_cursor as any;
    if (!allowCursor.includes(attribute)) return true;
    if (cursor.Veto(attribute)) return true;
    cursor.OnSet(attribute);
  }

  let element = this.m_cursor ? (this.m_cursor as VrvObject) : this.ResolveElement(elementId);
  if (!element) return false;

  if (this.m_cursor && attribute === 'accid') {
    element = (this.m_cursor as any).GetAccidElement() as VrvObject;
  }

  let success = false;
  if (element.Is(ClassId.TEXT) && attribute === 'text') {
    (element as unknown as Text).SetText(UTF8to32(value));
    success = true;
  }
  else if (AttModule.SetAnalytical(element as any, attribute, value)) success = true;
  else if (AttModule.SetCmn(element as any, attribute, value)) success = true;
  else if (AttModule.SetCmnornaments(element as any, attribute, value)) success = true;
  else if (AttModule.SetCritapp(element as any, attribute, value)) success = true;
  else if (AttModule.SetEdittrans(element as any, attribute, value)) success = true;
  else if (AttModule.SetExternalsymbols(element as any, attribute, value)) success = true;
  else if (AttModule.SetFacsimile(element as any, attribute, value)) success = true;
  else if (AttModule.SetFigtable(element as any, attribute, value)) success = true;
  else if (AttModule.SetFingering(element as any, attribute, value)) success = true;
  else if (AttModule.SetGestural(element as any, attribute, value)) success = true;
  else if (AttModule.SetHarmony(element as any, attribute, value)) success = true;
  else if (AttModule.SetHeader(element as any, attribute, value)) success = true;
  else if (AttModule.SetMei(element as any, attribute, value)) success = true;
  else if (AttModule.SetMensural(element as any, attribute, value)) success = true;
  else if (AttModule.SetMidi(element as any, attribute, value)) success = true;
  else if (AttModule.SetNeumes(element as any, attribute, value)) success = true;
  else if (AttModule.SetPagebased(element as any, attribute, value)) success = true;
  else if (AttModule.SetPerformance(element as any, attribute, value)) success = true;
  else if (AttModule.SetShared(element as any, attribute, value)) success = true;
  else if (AttModule.SetStringtab(element as any, attribute, value)) success = true;
  else if (AttModule.SetUsersymbols(element as any, attribute, value)) success = true;
  else if (AttModule.SetVisual(element as any, attribute, value)) success = true;

  this.PostEditRestriction(element);
  this.SetEditStatus();
  return success;
}
  public UpdatePitch(elementId: string, pname: number, oct: number, accid: number, midi: number) {
  const element = this.m_cursor ? (this.m_cursor as VrvObject) : this.ResolveElement(elementId);
  if (!element) return false;
  if (!element.HasInterface(InterfaceId.INTERFACE_PITCH)) return true;

  const layer = element.GetFirstAncestor(ClassId.LAYER);
  if (!layer) throw new Error('UpdatePitch: layer ancestor required.');

  const iface = (element as any).GetPitchInterface();
  const cursor = this.m_cursor as any;

  if (pname !== (PITCHNAME_NONE as number)) {
    iface.SetPname(pname);
    if (oct !== VRV_UNSET) iface.SetOct(oct);
    if (cursor) cursor.SetAccid(accid);
  }
  else if (midi !== VRV_UNSET) {
    let keySig: [number, number] = [-1, ACCIDENTAL_WRITTEN_NONE as number];
    const currentKeySig = (layer as any).GetCurrentKeySig?.();
    if (currentKeySig) {
      const sig = currentKeySig.ConvertToSig();
      keySig = [sig.first, sig.second];
    }
    const spelling = EditorToolkitSharedSpellMidi(midi, keySig);
    iface.SetPname(spelling.pname);
    accid = spelling.accid;
    if (accid === (ACCIDENTAL_WRITTEN_NONE as number)) accid = ACCIDENTAL_WRITTEN_n as number;
    iface.SetOct(Math.trunc(midi / 12) - 1);
  }

  if (!cursor) {
    const accidChild = element.FindDescendantByType(ClassId.ACCID, 1);
    if (accidChild) element.DeleteChild(accidChild);
  } else {
    cursor.SetAccid(ACCIDENTAL_WRITTEN_NONE);
  }

  let actualAccid!: number;
  let isImplicit!: boolean;
  if (cursor && cursor.GetInputMode() === 1) {
    actualAccid = accid;
    isImplicit = false;
  } else {
    [actualAccid, isImplicit] = this.GetActualAccid(element, accid);
  }

  if (actualAccid !== (ACCIDENTAL_WRITTEN_NONE as number)) {
    if (cursor) {
      cursor.SetAccid(actualAccid);
      cursor.SetAccidImplicit(isImplicit);
    }
    else if (element.IsSupportedChild(ClassId.ACCID)) {
      const accidElement = new Accid();
      if (isImplicit) accidElement.SetAccidGes(Att.AccidentalWrittenToGestural(actualAccid));
      else accidElement.SetAccid(actualAccid);
      element.AddChild(accidElement);
      this.ClearContext();
    }
  }

  this.SetEditStatus();
  return true;
}
  public ClearContext() {
  if (this.m_sectionContext) {
    this.m_sectionContext.ClearChildren();
    this.m_sectionContext = null;
  }
}
  public ContextForElement(elementId: string) {
  this.m_editResponse.reset();
  this.ContextForSections(false);
  if (!this.m_sectionContext) throw new Error('ContextForElement: section context required.');

  const hasTargetID = elementId !== '';
  let object: VrvObject | null = null;
  if (hasTargetID) object = this.ResolveElement(elementId);
  else object = (this.m_doc as any).FindDescendantByType(ClassId.MEASURE);
  if (!object || !object.GetParent()) return false;

  const originalObject = object;
  let siblings: VrvObject[] = [];
  let targetIdx = -1;
  let contextRoot: VrvObject | null = null;

  if (object.GetParent()!.Is(ClassId.SYSTEM)) {
    const editorTreeObject = this.m_sectionContext.FindDescendantByID(object.GetID());
    if (!editorTreeObject) return false;
    if (object.IsMilestoneElement()) object = editorTreeObject!;
    contextRoot = editorTreeObject!.GetParent();
    siblings = this.GetScoreBasedChildrenFor(contextRoot!);
    targetIdx = siblings.indexOf(object!);
    if (targetIdx === -1) return false;
  } else {
    contextRoot = object.GetParent();
    siblings = object.GetParent()!.GetChildren();
    targetIdx = siblings.indexOf(object);
    if (targetIdx === -1) return false;
  }
  if (!contextRoot) throw new Error('ContextForElement: contextRoot required.');

  const previousSiblings = targetIdx > 0 ? siblings.slice(0, targetIdx) : [];
  const followingSiblings = targetIdx < siblings.length - 1 ? siblings.slice(targetIdx + 1) : [];

  const ancestors: VrvObject[] = [];
  const jsonAncestors = new JsonxxArray();
  let current: VrvObject | null = object;
  while (current && current.GetParent()) {
    const par: VrvObject = current.GetParent()!;
    if (par.Is(ClassId.SYSTEM)) {
      const mapped = this.m_sectionContext.FindDescendantByID(current.GetID());
      if (!mapped || !mapped.GetParent()) return false;
      current = mapped;
      continue;
    }
    if (par.Is(ClassId.MEASURE)) {
      const measure = par as any;
      if (typeof measure.IsMeasuredMusic === 'function' && !measure.IsMeasuredMusic()) {
        current = par;
        continue;
      }
    }
    if (par.Is(ClassId.SCORE)) break;
    current = par;
    ancestors.push(par);
  }
  this.ContextForObjects(ancestors, jsonAncestors);
  this.m_editResponse.import('ancestors', jsonAncestors);

  const jsonContextRoot = new JsonxxObject();
  this.ContextForObject(contextRoot, jsonContextRoot);
  const jsonContext = new JsonxxArray();

  const elements = new JsonxxArray();
  this.ContextForObjects(previousSiblings, elements);
  jsonContext.append(elements);

  const jsonObject = new JsonxxObject();
  this.ContextForObject(object!, jsonObject);
  if (hasTargetID) {
    const jsonObjectChildren = new JsonxxArray();
    const objectChildren = object instanceof EditorTreeObject
      ? this.GetScoreBasedChildrenFor(object)
      : object!.GetChildren();
    this.ContextForObjects(objectChildren, jsonObjectChildren);
    if (jsonObjectChildren.size() > 0) jsonObject.import('children', jsonObjectChildren);
  }
  jsonContext.append(jsonObject);

  this.ContextForObjects(followingSiblings, elements);
  jsonContext.append(elements);

  jsonContextRoot.import('children', jsonContext);
  this.m_editResponse.import('context', jsonContextRoot);

  if (!hasTargetID) {
    this.m_editResponse.import('object', new JsonxxObject());
    this.m_editResponse.import('referringElements', new JsonxxArray());
    this.m_editResponse.import('referencedElements', new JsonxxArray());
    return true;
  }

  const attributes: ArrayOfStrAttr = [];
  originalObject!.GetAttributes(attributes);
  const jsonAttributes = new JsonxxObject();
  for (const [k, v] of attributes) jsonAttributes.import(k, v);
  jsonObject.import('attributes', jsonAttributes);
  if (!(object instanceof EditorTreeObject) && object!.Is(ClassId.TEXT)) {
    jsonObject.import('text', UTF32to8((object as unknown as Text).GetText()));
  }
  this.m_editResponse.import('object', jsonObject);

  const referringObjects: Array<[VrvObject, string]> = [];
  const findAllReferringObjects = new FindAllReferringObjectsFunctor(object!, referringObjects);
  (this.m_doc as any).Process(findAllReferringObjects);
  const references = new JsonxxArray();
  this.ContextForReferences(referringObjects, references);
  this.m_editResponse.import('referringElements', references);

  const referencedObjects: Array<[VrvObject, string]> = [];
  const findAllReferencedObjects = new FindAllReferencedObjectsFunctor(null, referencedObjects as any);
  object!.Process(findAllReferencedObjects, 0);
  const references2 = new JsonxxArray();
  this.ContextForReferences(referencedObjects, references2);
  this.m_editResponse.import('referencedElements', references2);

  return true;
}
  public ContextForScores(updateResponse: boolean) {
  if (!this.m_scoreContext) {
    this.m_scoreContext = new EditorTreeObject(this.m_doc as any, false);
    const scoreContextFunctor = new ScoreContextFunctor(this.m_scoreContext as any);
    (this.m_doc as any).Process(scoreContextFunctor);
  }
  this.m_currentContext = this.m_scoreContext;
  if (!updateResponse) return true;
  this.m_editResponse.reset();
  const jsonObject = new JsonxxObject();
  this.ContextForObject(this.m_scoreContext, jsonObject, true);
  this.m_editResponse.import('context', jsonObject);
  return true;
}
  public ContextForSections(updateResponse: boolean) {
  if (!this.m_sectionContext) {
    this.m_sectionContext = new EditorTreeObject(this.m_doc as any, false);
    const sectionContextFunctor = new SectionContextFunctor(this.m_sectionContext as any);
    (this.m_doc as any).Process(sectionContextFunctor);
  }
  this.m_currentContext = this.m_sectionContext;
  if (!updateResponse) return true;
  this.m_editResponse.reset();
  const jsonObject = new JsonxxObject();
  this.ContextForObject(this.m_sectionContext, jsonObject, true);
  this.m_editResponse.import('context', jsonObject);
  return true;
}
  public GetScoreDef() {
  this.m_editResponse.reset();
  const exported = this.meiIo.exportScoreDef(this.m_doc);
  this.m_editResponse.import('scoreDef', exported);
  return true;
}
  public SetScoreDef(_scoreDef: string) {
  return true;
}
  public MoveCursor(element: VrvObject | null, _maintainChordMode = false) {
  const cursor = this.m_cursor as any;
  if (!cursor) throw new Error('MoveCursor: cursor required.');
  if (!element) return;

  let object: VrvObject | null = element;
  const layer = element.GetFirstAncestor(ClassId.LAYER);
  if (!layer) throw new Error('MoveCursor: layer ancestor required.');

  const comparison = new ClassIdsComparison([ClassId.CHORD, ClassId.NOTE, ClassId.REST]);

  if (cursor.GetChordMode() === 2 /* NEW */) {
    cursor.SetChordMode(2 /* EDIT_NEW */);
  }
  else if (element === layer.FindDescendantByComparison(comparison, UNLIMITED_DEPTH, BACKWARD)) {
    const meterSig = (layer as any).GetCurrentMeterSig?.();
    if (!meterSig) throw new Error('MoveCursor: meterSig required.');
    const meterCount = meterSig.GetTotalCount() === 0 ? 4 : meterSig.GetTotalCount();
    const meterUnit = meterSig.GetUnit() === VRV_UNSET ? meterCount : meterSig.GetUnit();

    const alignment = cursor.GetAlignment?.();
    const position = alignment ? alignment.GetTime() : new Fraction(0);
    const duration = cursor.IsChordEditMode()
      ? new Fraction(0)
      : (element as any).GetAlignmentDuration?.({ meterSig }, true, 0) ?? new Fraction(0);
    let measureDuration = new Fraction(meterCount, meterUnit);
    if (measureDuration.equals(new Fraction(0))) measureDuration = new Fraction(4);
    if (position.add(duration).compare(measureDuration) >= 0) {
      object = this.GetNextLayer(layer);
      cursor.SetAccidImplicit(false);
    }
  }

  if (object) {
    this.m_selectionId = object.GetID();
    this.m_chainedId = this.m_selectionId;
    this.m_selectionClassId = object.GetClassId();
    this.SetCursor(this.m_selectionId, cursor.GetInputMode(), false);
  } else {
    cursor.SetChordMode(0 /* CHORD_NONE */);
    this.ResetCursor(false);
  }
}
  public GetAccidBefore(element: any, pname: number, oct: number) {
  if (!element) return ACCIDENTAL_WRITTEN_NONE as number;
  const layer = element.GetFirstAncestor(ClassId.LAYER);
  if (!layer) throw new Error('GetAccidBefore: layer ancestor required.');
  const notes = layer.FindAllDescendantsByType(ClassId.NOTE);
  let breakAtNext = false;
  let previous = ACCIDENTAL_WRITTEN_NONE as number;
  for (const object of notes) {
    const note = object as any;
    if (element.GetAlignment() === note.GetAlignment()) breakAtNext = true;
    else if (breakAtNext) break;
    if (note.GetPname() !== pname || note.GetOct() !== oct) continue;
    const accid = note.GetDrawingAccid();
    if (accid) {
      previous = (accid.HasAccidGes && accid.HasAccidGes())
        ? Att.AccidentalGesturalToWritten(accid.GetAccidGes())
        : accid.GetAccid();
    }
  }
  return previous;
}
  public GetActualAccid(element: VrvObject, accid: number): [number, boolean] {
  const iface = (element as any).GetPitchInterface();
  const layer = element.GetFirstAncestor(ClassId.LAYER);
  if (!layer) throw new Error('GetActualAccid: layer ancestor required.');
  const cursor = this.m_cursor as any;

  let previousAccid = this.GetAccidBefore(
    cursor ? cursor.GetPosition() : element, iface.GetPname(), iface.GetOct());

  if (previousAccid === (ACCIDENTAL_WRITTEN_NONE as number)) {
    const currentAccids = new Map<number, number>();
    const currentKeySig = (layer as any).GetCurrentKeySig?.();
    if (currentKeySig) currentKeySig.FillMap(currentAccids);
    const octavedPitch = iface.GetPname() + iface.GetOct() * 7;
    previousAccid = currentAccids.has(octavedPitch) ? currentAccids.get(octavedPitch)! : (ACCIDENTAL_WRITTEN_NONE as number);
  }

  let actualAccid = ACCIDENTAL_WRITTEN_NONE as number;
  let isImplicit = true;
  if (accid !== (ACCIDENTAL_WRITTEN_NONE as number)) {
    if (accid !== (ACCIDENTAL_WRITTEN_n as number) || previousAccid !== (ACCIDENTAL_WRITTEN_NONE as number)) {
      actualAccid = accid;
      isImplicit = accid === previousAccid;
    }
  }
  else if (previousAccid !== (ACCIDENTAL_WRITTEN_NONE as number)) {
    actualAccid = previousAccid;
  }
  return [actualAccid, isImplicit];
}
  public GetPreviousMeasure(measure: VrvObject) {
  const system = measure.GetFirstAncestor(ClassId.SYSTEM);
  if (!system) throw new Error('GetPreviousMeasure: system required.');
  const previousMeasure = system.GetPrevious(measure, ClassId.MEASURE);
  if (previousMeasure) return previousMeasure;
  const page = system.GetFirstAncestor(ClassId.PAGE);
  if (!page) throw new Error('GetPreviousMeasure: page required.');
  let previousSystem = page.GetPrevious(system, ClassId.SYSTEM);
  if (!previousSystem) {
    const pages = (this.m_doc as any).GetPages();
    const previousPage = pages.GetPrevious(page, ClassId.PAGE);
    if (!previousPage) return null;
    previousSystem = previousPage.GetLast(ClassId.SYSTEM);
    if (!previousSystem) return null;
  }
  return previousSystem.GetLast(ClassId.MEASURE);
}
  public GetPreviousStaff(staff: VrvObject) {
  const measure = staff.GetFirstAncestor(ClassId.MEASURE);
  if (!measure) throw new Error('GetPreviousStaff: measure required.');
  const previousMeasure = this.GetPreviousMeasure(measure);
  if (!previousMeasure) return null;
  const staffNComparison = new AttNIntegerComparison(ClassId.STAFF, (staff as any).GetN());
  return previousMeasure.FindDescendantByComparison(staffNComparison);
}
  public GetPreviousLayer(layer: VrvObject) {
  const staff = layer.GetFirstAncestor(ClassId.STAFF);
  if (!staff) throw new Error('GetPreviousLayer: staff required.');
  const previousStaff = this.GetPreviousStaff(staff);
  if (!previousStaff) return null;
  const layerNComparison = new AttNIntegerComparison(ClassId.LAYER, (layer as any).GetN());
  return previousStaff.FindDescendantByComparison(layerNComparison);
}
  public GetNextMeasure(measure: VrvObject) {
  const system = measure.GetFirstAncestor(ClassId.SYSTEM);
  if (!system) throw new Error('GetNextMeasure: system required.');
  const nextMeasure = system.GetNextOf(measure, ClassId.MEASURE);
  if (nextMeasure) return nextMeasure;
  const page = system.GetFirstAncestor(ClassId.PAGE);
  if (!page) throw new Error('GetNextMeasure: page required.');
  let nextSystem = page.GetNextOf(system, ClassId.SYSTEM);
  if (!nextSystem) {
    const pages = (this.m_doc as any).GetPages();
    const nextPage = pages.GetNextOf(page, ClassId.PAGE);
    if (!nextPage) return null;
    nextSystem = nextPage.GetFirst(ClassId.SYSTEM);
    if (!nextSystem) return null;
  }
  return nextSystem.GetFirst(ClassId.MEASURE);
}
  public GetNextStaff(staff: VrvObject) {
  const measure = staff.GetFirstAncestor(ClassId.MEASURE);
  if (!measure) throw new Error('GetNextStaff: measure required.');
  const nextMeasure = this.GetNextMeasure(measure);
  if (!nextMeasure) return null;
  const staffNComparison = new AttNIntegerComparison(ClassId.STAFF, (staff as any).GetN());
  return nextMeasure.FindDescendantByComparison(staffNComparison);
}
  public GetNextLayer(layer: VrvObject) {
  const staff = layer.GetFirstAncestor(ClassId.STAFF);
  if (!staff) throw new Error('GetNextLayer: staff required.');
  const nextStaff = this.GetNextStaff(staff);
  if (!nextStaff) return null;
  const layerNComparison = new AttNIntegerComparison(ClassId.LAYER, (layer as any).GetN());
  return nextStaff.FindDescendantByComparison(layerNComparison);
}
  private CollectReferringObjects(element: VrvObject, toDelete: Set<string>, visited: Set<VrvObject>) {
  if (!element) throw new Error('CollectReferringObjects: element required.');
  if (visited.has(element)) return;
  visited.add(element);
  for (let i = 0; i < element.GetChildCount(ClassId.UNSPECIFIED); i++) {
    const child = element.GetChild(i);
    if (child) this.CollectReferringObjects(child, toDelete, visited);
  }
  const referringObjects: Array<[VrvObject, string]> = [];
  const functor = new FindAllReferringObjectsFunctor(element, referringObjects as any);
  (this.m_doc as any).Process(functor);
  for (const [referringObject] of referringObjects) {
    if (!referringObject || referringObject === element) continue;
    toDelete.add(referringObject.GetID());
    this.CollectReferringObjects(referringObject, toDelete, visited);
  }
}
  private PostProcessDeleteObjects(element: VrvObject, toPostProcess: Set<string>) {
  if (element.Is(ClassId.NOTE)) {
    const note = element as any;
    if (note.IsChordTone && note.IsChordTone()) toPostProcess.add(note.IsChordTone().GetID());
  }
  if (element.HasInterface(InterfaceId.INTERFACE_DURATION) && element.IsLayerElement()) {
    const beam = element.GetFirstAncestor(ClassId.BEAM);
    if (beam) toPostProcess.add(beam.GetID());
  }
}
  private PostProcessDelete(elementId: string) {
  const object = (this.m_doc as any).FindDescendantByID(elementId);
  if (!object) return;

  if (object.Is(ClassId.CHORD)) {
    const chord = object as any;
    const count = chord.GetChildCount(ClassId.NOTE, UNLIMITED_DEPTH);
    if (count !== 1) return;
    const note = chord.GetTopNote();
    note.CopyDurationFrom?.(chord);
    note.CopyCueFrom?.(chord);
    note.CopyGracedFrom?.(chord);
    note.CopyStemsFrom?.(chord);
    const artics = chord.FindAllDescendantsByType(ClassId.ARTIC, false, 1);
    for (const artic of artics) artic.MoveItselfTo(note);
    const parent = chord.GetParent()!;
    const idx = chord.GetIdx();
    chord.DetachChild(note.GetIdx());
    parent.InsertChild(note, idx);
    this.Delete(chord.GetID(), DeleteNavigation.DELETE_NO_NAVIGATON);
    this.m_chainedId = note.GetID();
  }
  else if (object.Is(ClassId.BEAM)) {
    const beam = object as any;
    const descendants: VrvObject[] = [];
    const comparison = new ClassIdsComparison([ClassId.CHORD, ClassId.NOTE, ClassId.REST]);
    beam.FindAllDescendantsByComparison(descendants, comparison, 1);
    if (descendants.length !== 1) return;
    const parent = beam.GetParent()!;
    const idx = beam.GetIdx();
    beam.DetachChild(descendants[0].GetIdx());
    parent.InsertChild(descendants[0], idx);
    this.Delete(beam.GetID(), DeleteNavigation.DELETE_NO_NAVIGATON);
    this.m_chainedId = descendants[0].GetID();
  }
}
  private PostEditRestriction(element: VrvObject) {
  if (element.HasInterface(InterfaceId.INTERFACE_DURATION) && element.IsLayerElement()) {
    const layerElement = element as any;
    if (layerElement.IsInBeam && layerElement.IsInBeam()) {
      const iface = layerElement.GetDurationInterface();
      if (iface && typeof iface.HasDur === 'function' && iface.HasDur()) {
        // DUR 8 guard: beams cannot contain durations shorter than an eighth
        iface.SetDur(Math.max(iface.GetDur(), 8 as any) as any);
      }
    }
  }
}
  private ContextForObject(object: VrvObject, element: JsonxxObject, recursive = false) {
  element.import('element', object.GetClassName());
  element.import('id', object.GetID());
  const attributes = new JsonxxObject();
  const att = object as any;
  const ATT_NINTEGER = ATT_CLASS_IDS.ATT_NINTEGER;
const ATT_NNUMBERLIKE = ATT_CLASS_IDS.ATT_NNUMBERLIKE;
  if (object.HasAttClass(ATT_NINTEGER)) attributes.import('n', att.GetN());
  if (object.HasAttClass(ATT_NNUMBERLIKE)) attributes.import('n', att.GetN());
  if (object.HasAttClass(ATT_NNUMBERLIKE) || object.HasAttClass(ATT_NINTEGER)) element.import('attributes', attributes);

  let children: VrvObject[];
  if (object instanceof EditorTreeObject) children = this.GetScoreBasedChildrenFor(object);
  else children = object.GetChildren();
  children = children.filter((item) =>
    !item.IsAnyOf([ClassId.DOTS, ClassId.FLAG, ClassId.STEM, ClassId.TUPLET_NUM, ClassId.TUPLET_BRACKET]));

  if (children.length > 0) {
    const jsonChildren = new JsonxxArray();
    if (recursive) {
      for (const child of children) {
        const jsonChild = new JsonxxObject();
        this.ContextForObject(child, jsonChild, true);
        jsonChildren.append(jsonChild);
      }
    }
    element.import('children', jsonChildren);
  } else {
    element.import('isLeaf', true);
  }
}
  private ContextForObjects(objects: VrvObject[], elements: JsonxxArray) {
  elements.reset();
  for (const object of objects) {
    if (object.Is(ClassId.MNUM)) {
      const mNum = object as unknown as MNum;
      if (mNum.IsGenerated()) continue;
    }
    if (object.IsAttribute()) continue;
    if (object.IsAnyOf([ClassId.DOTS, ClassId.FLAG, ClassId.STEM, ClassId.TUPLET_NUM, ClassId.TUPLET_BRACKET])) continue;
    const element = new JsonxxObject();
    this.ContextForObject(object, element);
    elements.append(element);
  }
}
  private ContextForReferences(objectAttNames: Array<[VrvObject, string]>, references: JsonxxArray) {
  references.reset();
  for (const [object, attributeName] of objectAttNames) {
    const element = new JsonxxObject();
    this.ContextForObject(object, element);
    element.import('referenceAttribute', attributeName);
    references.append(element);
  }
}
  private GetScoreBasedChildrenFor(object: VrvObject) {
  if (!this.m_currentContext) throw new Error('GetScoreBasedChildrenFor: current context required.');
  const editorTreeObject = this.m_currentContext.GetID() === object.GetID()
    ? this.m_currentContext
    : this.m_currentContext.FindDescendantByID(object.GetID());
  if (!editorTreeObject) return [];
  return (editorTreeObject as any).GetChildObjects();
}
}

const ATT_NNUMBERLIKE = ATT_CLASS_IDS.ATT_NNUMBERLIKE;

/**
 * SpellMidi port (exact C++ tables).
 */
export function EditorToolkitSharedSpellMidi(midi: number, keySig: [number, number]): { pname: number; accid: number } {
  const NONE = ACCIDENTAL_WRITTEN_NONE as number;
  const naturalTable: Array<[number, number]> = [
    [PITCHNAME_c as number, NONE], [NONE, NONE], [PITCHNAME_d as number, NONE], [NONE, NONE],
    [PITCHNAME_e as number, NONE], [PITCHNAME_f as number, NONE], [NONE, NONE],
    [PITCHNAME_g as number, NONE], [NONE, NONE], [PITCHNAME_a as number, NONE], [NONE, NONE],
    [PITCHNAME_b as number, NONE],
  ];
  const sharpTable: Array<[number, number]> = [
    [NONE, NONE], [PITCHNAME_c as number, ACCIDENTAL_WRITTEN_s as number], [NONE, NONE],
    [PITCHNAME_d as number, ACCIDENTAL_WRITTEN_s as number], [NONE, NONE], [NONE, NONE],
    [PITCHNAME_f as number, ACCIDENTAL_WRITTEN_s as number], [NONE, NONE],
    [PITCHNAME_g as number, ACCIDENTAL_WRITTEN_s as number], [NONE, NONE],
    [PITCHNAME_a as number, ACCIDENTAL_WRITTEN_s as number], [NONE, NONE],
  ];
  const flatTable: Array<[number, number]> = [
    [NONE, NONE], [PITCHNAME_d as number, ACCIDENTAL_WRITTEN_f as number], [NONE, NONE],
    [PITCHNAME_e as number, ACCIDENTAL_WRITTEN_f as number], [NONE, NONE], [NONE, NONE],
    [PITCHNAME_g as number, ACCIDENTAL_WRITTEN_f as number], [NONE, NONE],
    [PITCHNAME_a as number, ACCIDENTAL_WRITTEN_f as number], [NONE, NONE],
    [PITCHNAME_b as number, ACCIDENTAL_WRITTEN_f as number], [NONE, NONE],
  ];
  const sharpSignature = [0, 2, 0, 4, 0, 0, 1, 0, 3, 0, 5, 0];
  const flatSignature = [0, -5, 0, -3, 0, 0, -6, 0, -4, 0, -2, 0];

  const pc = ((midi % 12) + 12) % 12;
  switch (pc) {
    case 0: case 2: case 4: case 5: case 7: case 9: case 11: {
      const [pname, accid] = naturalTable[pc];
      return { pname, accid };
    }
  }
  let signature = 0;
  if (keySig[1] === (ACCIDENTAL_WRITTEN_s as number)) signature = keySig[0];
  else if (keySig[1] === (ACCIDENTAL_WRITTEN_f as number)) signature = -keySig[0];
  const sharpCost = Math.abs(signature - sharpSignature[pc]);
  const flatCost = Math.abs(signature - flatSignature[pc]);
  if (sharpCost === flatCost) {
    const [pname, accid] = signature < 0 ? flatTable[pc] : sharpTable[pc];
    return { pname, accid };
  }
  const [pname, accid] = flatCost < sharpCost ? flatTable[pc] : sharpTable[pc];
  return { pname, accid };
}
export function GetClassNameForFactory(classId: unknown): string {
  return ObjectFactory.GetInstance().GetClassName(classId as any);
}
