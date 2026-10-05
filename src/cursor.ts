import { Note } from './note.js';
import {
  Accid,
  ACCIDENTAL_WRITTEN_NONE,
  ACCIDENTAL_WRITTEN_n,
  ENCLOSURE_NONE,
  ENCLOSURE_paren,
  type data_ENCLOSURE,
} from './accid.js';
import {
  ClassId,
  DURATION_4,
  FunctorCode,
  type data_ACCIDENTAL_WRITTEN,
} from './vrvdef.js';
import type { data_ACCIDENTAL_GESTURAL } from './transposition.js';
import { Att } from './att.js';
import { Alignment, AlignmentType } from './horizontalaligner.js';
import { LayerElement } from './layerelement.js';
import { Functor, ConstFunctor } from './functor.js';
import { PITCHNAME_c } from './pitchinterface.js';

export const ACCIDENTAL_GESTURAL_NONE = 0;
export const accidLog_FUNC_NONE = 0;
export const accidLog_FUNC_caution = 1;
export const accidLog_FUNC_edit = 2;

export enum ChordMode {
  CHORD_NONE = 0,
  ADD = 1,
  EDIT_NEW = 2,
  EDIT_EXISTING = 3,
}

export enum TieMode {
  TIE_NONE = 0,
  EDIT = 1,
  ADD = 2,
}

export enum InputMode {
  PITCH_FIRST = 0,
  DURATION_FIRST = 1,
}

export interface AccidLike {
  HasAccidGes?: () => boolean;
  GetAccidGes?: () => number;
  HasAccid?: () => boolean;
  GetAccid?: () => number;
}

export class Cursor extends Note {
  private m_position: LayerElement | null = null;
  private m_accid!: Accid;
  private m_isAccidImplicit = false;
  private m_restMode = false;
  private m_chordMode: ChordMode = ChordMode.CHORD_NONE;
  private m_inputMode: InputMode = InputMode.PITCH_FIRST;
  private m_yRelPitchC = 0;
  private m_tieMode: TieMode = TieMode.TIE_NONE;
  private m_container: LayerElement[] = [];

  public constructor() {
    super();
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.m_accid ??= new Accid();
    this.m_accid.Reset();

    // Guard against double SetParent during base-constructor Reset
    if (this.m_accid.GetParent() !== this) {
      this.m_accid.SetParent(this);
    }
    this.m_accid.SetDrawingCueSize(true);
    this.m_accid.SetFunc(accidLog_FUNC_edit);

    this.m_position = null;
    this.m_isAccidImplicit = false;
    this.m_yRelPitchC = 0;

    this.m_restMode = false;
    this.m_inputMode = InputMode.PITCH_FIRST;
    this.m_chordMode = ChordMode.CHORD_NONE;
    this.m_tieMode = TieMode.TIE_NONE;
    this.m_container = [];

    // Default pitch and duration
    this.SetPname(PITCHNAME_c);
    this.SetOct(4);
    this.SetDur(DURATION_4);
  }

  public override CloneReset(): void {
    super.CloneReset();

    this.ResetCursorAlignment();
    this.m_position = null;
    this.m_tieMode = TieMode.TIE_NONE;
    this.m_container = [];

    // Re-parent accid only if needed (avoid double SetParent)
    if (this.m_accid.GetParent() !== this) {
      // Detach from old parent first
      const old = this.m_accid.GetParent();
      if (old) (this.m_accid as any).m_parent = null;
      this.m_accid.SetParent(this);
    }
  }

  public override Clone(): Cursor {
    const clone = new Cursor();
    clone.AssignFrom(this);
    this.CopyNoteState(clone);
    clone.m_position = this.m_position;
    // Clone the accid and detach from the default parent before re-parenting
    clone.m_accid = this.m_accid.Clone() as Accid;
    // Force-clear the parent set during Accid.Clone/construction
    (clone.m_accid as any).m_parent = null;
    clone.m_accid.SetParent(clone);
    clone.m_isAccidImplicit = this.m_isAccidImplicit;
    clone.m_restMode = this.m_restMode;
    clone.m_chordMode = this.m_chordMode;
    clone.m_inputMode = this.m_inputMode;
    clone.m_yRelPitchC = this.m_yRelPitchC;
    clone.m_tieMode = this.m_tieMode;
    clone.m_container = [...this.m_container];
    // CloneReset resets transient state but preserves copied values
    clone.ResetCursorAlignment();
    return clone;
  }

  public ResetCursorAlignment(): void {
    if (this.m_alignment) {
      const alignment = this.m_alignment as Alignment;
      const parent = alignment.GetParent?.() ?? (alignment as any).GetParent();
      if (parent) {
        parent.DeleteChild(alignment);
      }
      this.m_alignment = null;
    }
  }

  public IsRestMode(): boolean {
    return this.m_restMode;
  }

  public SetRestMode(restMode: boolean): void {
    this.m_chordMode = ChordMode.CHORD_NONE;
    this.m_restMode = restMode;
  }

  public GetChordMode(): ChordMode {
    return this.m_chordMode;
  }

  public SetChordMode(chordMode: ChordMode): void {
    this.m_chordMode = chordMode;
    this.m_restMode = false;
    if (this.m_alignment) {
      const type: AlignmentType = this.IsChordEditMode()
        ? AlignmentType.ALIGNMENT_CURSOR_CHORD
        : AlignmentType.ALIGNMENT_CURSOR;
      (this.m_alignment as Alignment).SetType(type);
    }
  }

  public IsChordMode(): boolean {
    return this.m_chordMode !== ChordMode.CHORD_NONE;
  }

  public IsChordEditMode(): boolean {
    return (
      this.m_chordMode === ChordMode.EDIT_NEW ||
      this.m_chordMode === ChordMode.EDIT_EXISTING
    );
  }

  public GetTieMode(): TieMode {
    return this.m_tieMode;
  }

  public SetTieMode(tieMode: TieMode): void {
    this.m_tieMode = tieMode;
    this.m_restMode = false;
  }

  public IsTieMode(): boolean {
    return this.m_tieMode !== TieMode.TIE_NONE;
  }

  public GetInputMode(): InputMode {
    return this.m_inputMode;
  }

  public SetInputMode(inputMode: InputMode): void {
    this.m_inputMode = inputMode;
  }

  public GetYRelPitchC(): number {
    return this.m_yRelPitchC;
  }

  public SetYRelPitchC(yRelPitchC: number): void {
    this.m_yRelPitchC = yRelPitchC;
  }

  public GetPosition(): LayerElement | null {
    return this.m_position;
  }

  public SetPosition(position: LayerElement | null): void {
    this.m_position = position;
  }

  public GetAccidElement(): Accid {
    return this.m_accid;
  }

  public GetAccid(): data_ACCIDENTAL_WRITTEN {
    return this.m_accid.GetAccid();
  }

  public SetAccid(accid: data_ACCIDENTAL_WRITTEN): void {
    this.m_accid.SetAccid(accid);
    this.SetAccidImplicit(false);
  }

  public HasAccid(): boolean {
    return this.m_accid.HasAccid();
  }

  public IsAccidImplicit(): boolean {
    return this.m_isAccidImplicit;
  }

  public SetAccidImplicit(isAccidImplicit: boolean): void {
    this.m_isAccidImplicit = isAccidImplicit;
    const enclosure: data_ENCLOSURE = this.m_isAccidImplicit ? ENCLOSURE_paren : ENCLOSURE_NONE;
    this.m_accid.SetEnclose(enclosure);
  }

  public SetAccidValue(accid: AccidLike | null): void {
    if (!accid) return;

    if (accid.HasAccidGes?.() && accid.GetAccidGes) {
      this.SetAccid(Att.AccidentalGesturalToWritten(accid.GetAccidGes()));
    } else if (accid.HasAccid?.() && accid.GetAccid) {
      this.SetAccid(accid.GetAccid());
    }
    this.SetAccidImplicit(true);
  }

  public GetAccidValue(): [data_ACCIDENTAL_WRITTEN, data_ACCIDENTAL_GESTURAL] {
    if (!this.HasAccid()) return [ACCIDENTAL_WRITTEN_NONE, ACCIDENTAL_GESTURAL_NONE];

    let accid: data_ACCIDENTAL_WRITTEN = ACCIDENTAL_WRITTEN_NONE;
    let accidGes: data_ACCIDENTAL_GESTURAL = ACCIDENTAL_GESTURAL_NONE;
    if (this.IsAccidImplicit()) {
      if (this.GetAccid() !== ACCIDENTAL_WRITTEN_n) {
        accidGes = Att.AccidentalWrittenToGestural(this.GetAccid());
      }
    } else {
      accid = this.GetAccid();
    }

    return [accid, accidGes];
  }

  public PushContainer(container: LayerElement): void {
    this.m_container.push(container);
  }

  public PopContainer(): LayerElement | null {
    if (this.m_container.length === 0) return null;
    return this.m_container.pop()!;
  }

  public TopContainer(): LayerElement | null {
    if (this.m_container.length === 0) return null;
    return this.m_container[this.m_container.length - 1];
  }

  public HasContainer(): boolean {
    return this.m_container.length > 0;
  }

  public Veto(attribute: string): boolean {
    if (this.IsChordEditMode() && (attribute === 'dur' || attribute === 'dots')) {
      return true;
    }
    return false;
  }

  public OnSet(attribute: string): void {
    if (attribute === 'dur') {
      this.ResetAugmentDots();
    }
  }

  public override Accept(functor: Functor): FunctorCode {
    const f = functor as unknown as Record<string, unknown>;
    if (typeof f['VisitCursor'] === 'function') {
      return (f['VisitCursor'] as (c: Cursor) => FunctorCode).call(functor, this);
    }
    if (typeof f['VisitLayerElement'] === 'function') {
      return (f['VisitLayerElement'] as (c: Cursor) => FunctorCode).call(functor, this);
    }
    if (typeof f['VisitObject'] === 'function') {
      return (f['VisitObject'] as (c: Cursor) => FunctorCode).call(functor, this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public override AcceptEnd(functor: Functor): FunctorCode {
    const f = functor as unknown as Record<string, unknown>;
    if (typeof f['VisitCursorEnd'] === 'function') {
      return (f['VisitCursorEnd'] as (c: Cursor) => FunctorCode).call(functor, this);
    }
    if (typeof f['VisitLayerElementEnd'] === 'function') {
      return (f['VisitLayerElementEnd'] as (c: Cursor) => FunctorCode).call(functor, this);
    }
    if (typeof f['VisitObjectEnd'] === 'function') {
      return (f['VisitObjectEnd'] as (c: Cursor) => FunctorCode).call(functor, this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
