/**
 * transposefunctor.ts — canonical translation of src-cpp/src/transposefunctor.cpp
 * + src-cpp/include/vrv/transposefunctor.h.
 *
 * Three transposition functors:
 *  - TransposeFunctor: interval/key/semitone transposition of Harm (root +
 *    bass), KeySig (fifths + pname/accid), Note (via TransPitch), Rest
 *    (oloc/ploc or loc with top/bottom layer nudging), Score (transposition
 *    resolution + scoreDef processing), StaffDef (auxiliary KeySig).
 *  - TransposeSelectedMdivFunctor: restricts transposition to one Mdiv by
 *    tracking the nested mdiv ID stack across Mdiv/PageMilestoneEnd/Score/
 *    System visits.
 *  - TransposeToSoundingPitchFunctor: per-staff `@trans.semi` transposition
 *    with staff-N interval map, ScoreDef common-key handling, and the
 *    ScoreDef-key warning for mixed/untransposed staves.
 *
 * All extend `DocFunctor`; the first two return `ImplementsEndInterface() ==
 * false`, the sounding-pitch functor returns `true`, per the C++ header.
 */

import { DocFunctor } from './functor.js';
import { FunctorCode, ClassId } from './vrvdef.js';
import { LogWarning } from './vrv.js';
import { Transposer, TransPitch, INVALID_INTERVAL_CLASS, PITCHNAME_c, ACCIDENTAL_WRITTEN_NONE, ACCIDENTAL_WRITTEN_f, ACCIDENTAL_WRITTEN_s } from './transposition.js';
import { StaffSearch } from './layerelement.js';

//----------------------------------------------------------------------------
// Structural boundaries
//----------------------------------------------------------------------------

export interface TransposeHarmLike {
  GetRootPitch(pitch: TransPitch, pos: { value: number }): boolean;
  SetRootPitch(pitch: TransPitch, pos: number): void;
  GetBassPitch(pitch: TransPitch): boolean;
  SetBassPitch(pitch: TransPitch): void;
}

export interface TransposeKeySigLike {
  GetFifthsInt(): number;
  SetSig(sig: [number, number]): void;
  HasPname(): boolean;
  GetPname(): number;
  GetAccid(): number;
  SetPname(value: number): void;
  SetAccid(value: number): void;
  GetFirstAncestor(classId: number): unknown;
  GetAncestorStaff(search?: number, allowCross?: boolean): { GetN(): number } | null;
}

export interface TransposeMdivLike {
  GetID(): string;
}

export interface TransposeNoteLike {
  HasPname(): boolean;
  GetTransPitch(): TransPitch;
  GetAncestorStaff(search?: number): { GetN(): number } | null;
  UpdateFromTransPitch(pitch: TransPitch, hasKeySig: boolean): void;
}

export interface TransposeRestLike {
  HasOloc(): boolean;
  HasPloc(): boolean;
  HasLoc(): boolean;
  GetOloc(): number;
  GetPloc(): number;
  GetLoc(): number;
  SetLoc(value: number): void;
  GetAncestorStaff(): {
    FindAllDescendantsByType(classId: number, continueDepth?: boolean): Array<{ GetN(): number }>;
  } | null;
  GetFirstAncestor(classId: number): { GetN(): number } | null;
  UpdateFromTransLoc(loc: TransPitch): void;
}

export interface TransposeScoreLike {
  GetScoreDef(): TransposeScoreDefLike | null;
}

export interface TransposeScoreDefLike {
  FindDescendantByType(classId: number, depth?: number): unknown;
  Process(functor: unknown): void;
  GetStaffNs(): number[];
  GetStaffDef(n: number): TransposeStaffDefLike | null;
}

export interface TransposeStaffDefLike {
  GetN(): number;
  HasN(): boolean;
  HasTransSemi(): boolean;
  GetTransSemi(): number;
  ResetTransposition(): void;
  AddChild(child: unknown): void;
  FindDescendantByType(classId: number, depth?: number): unknown;
  GetFirstAncestor(classId: number): unknown;
}

export interface TransposeStaffLike {
  GetN(): number;
  HasN(): boolean;
}

//----------------------------------------------------------------------------
// TransposeFunctor
//----------------------------------------------------------------------------

export class TransposeFunctor extends DocFunctor {
  protected m_transposer: Transposer;
  protected m_keySigForStaffN = new Map<number, TransposeKeySigLike>();
  private m_transposition = '';

  public constructor(doc: unknown, transposer: Transposer) {
    super(doc as never);
    this.m_transposer = transposer;
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public SetTransposition(transposition: string): void { this.m_transposition = transposition; }

  public VisitHarm(harm: TransposeHarmLike): FunctorCode {
    const position = { value: 0 };
    const pitch = new TransPitch();
    if (harm.GetRootPitch(pitch, position)) {
      this.m_transposer.Transpose(pitch);
      harm.SetRootPitch(pitch, position.value);
    }

    // Transpose bass notes (the "/F#" in "G#m7/F#")
    const bass = new TransPitch();
    if (harm.GetBassPitch(bass)) {
      this.m_transposer.Transpose(bass);
      harm.SetBassPitch(bass);
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitKeySig(keySig: TransposeKeySigLike): FunctorCode {
    // Store current KeySig
    const staffN = this.GetStaffNForKeySig(keySig);
    this.m_keySigForStaffN.set(staffN, keySig);

    // Transpose
    const sig = keySig.GetFifthsInt();

    let intervalClass = this.m_transposer.CircleOfFifthsToIntervalClass(sig);
    const transposedClass = this.m_transposer.Transpose(intervalClass);
    if (typeof transposedClass === 'number') intervalClass = transposedClass;
    const fifths = this.m_transposer.IntervalToCircleOfFifths(intervalClass);

    if (fifths === INVALID_INTERVAL_CLASS) {
      keySig.SetSig([-1, ACCIDENTAL_WRITTEN_NONE]);
    }
    else if (fifths < 0) {
      keySig.SetSig([-fifths, ACCIDENTAL_WRITTEN_f]);
    }
    else if (fifths > 0) {
      keySig.SetSig([fifths, ACCIDENTAL_WRITTEN_s]);
    }
    else {
      keySig.SetSig([-1, ACCIDENTAL_WRITTEN_NONE]);
    }

    // Also convert pname and accid attributes
    if (keySig.HasPname()) {
      const pitch = new TransPitch(keySig.GetPname(), keySig.GetAccid(), ACCIDENTAL_WRITTEN_NONE, 4);
      this.m_transposer.Transpose(pitch);
      keySig.SetPname(pitch.GetPitchName());
      keySig.SetAccid(pitch.GetAccidGesBasic());
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMdiv(_mdiv: TransposeMdivLike): FunctorCode {
    this.m_keySigForStaffN.clear();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNote(note: TransposeNoteLike): FunctorCode {
    if (!note.HasPname()) return FunctorCode.FUNCTOR_SIBLINGS;

    const pitch = note.GetTransPitch();
    this.m_transposer.Transpose(pitch);

    const staff = note.GetAncestorStaff(StaffSearch.RESOLVE_CROSS_STAFF);
    if (!staff) throw new Error('TransposeFunctor::VisitNote: staff ancestor required');
    const hasKeySig = this.m_keySigForStaffN.has(staff.GetN()) || this.m_keySigForStaffN.has(-1);
    note.UpdateFromTransPitch(pitch, hasKeySig);

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitRest(rest: TransposeRestLike): FunctorCode {
    if ((!rest.HasOloc() || !rest.HasPloc()) && !rest.HasLoc()) return FunctorCode.FUNCTOR_SIBLINGS;

    // Find whether current layer is top, middle (either one if multiple) or bottom
    const parentStaff = rest.GetAncestorStaff();
    const parentLayer = rest.GetFirstAncestor(ClassId.LAYER);
    if (!parentStaff || !parentLayer) throw new Error('TransposeFunctor::VisitRest: staff/layer required');

    const objects = parentStaff.FindAllDescendantsByType(ClassId.LAYER, false);
    const layerCount = objects.length;

    const firstLayer = objects[0];
    const lastLayer = objects[objects.length - 1];

    const isTopLayer = firstLayer.GetN() === parentLayer.GetN();
    const isBottomLayer = lastLayer.GetN() === parentLayer.GetN();

    // transpose based on @oloc and @ploc
    if (rest.HasOloc() && rest.HasPloc()) {
      const centralLocation = new TransPitch(6, 0, 4); // middle location of the staff
      const restLoc = new TransPitch(rest.GetPloc() - PITCHNAME_c, 0, rest.GetOloc());
      this.m_transposer.Transpose(restLoc);
      const isRestOnSpace = ((restLoc.m_oct * 7 + restLoc.m_pname) % 2) !== 0;
      // on outer layers move rest on odd locations one line further
      // in middle layers tolerate even locations to not risk collisions
      if (layerCount > 1) {
        if (isTopLayer && isRestOnSpace) {
          restLoc.increment();
        }
        else if (isBottomLayer && isRestOnSpace) {
          restLoc.decrement();
        }
        if ((isTopLayer && restLoc.lt(centralLocation)) || (isBottomLayer && restLoc.gt(centralLocation))) {
          restLoc.copyFrom(centralLocation);
        }
      }

      rest.UpdateFromTransLoc(restLoc);
    }
    // transpose based on @loc
    else if (rest.HasLoc()) {
      const centralLocation = 4;
      const transval = this.m_transposer.GetTranspositionIntervalClass();
      const [diatonic] = this.m_transposer.IntervalToDiatonicChromatic(transval);
      let transposedLoc = rest.GetLoc() + diatonic;
      // on outer layers move rest on odd locations one line further
      // in middle layers tolerate even locations to not risk collisions
      if (layerCount > 1) {
        if (isTopLayer) transposedLoc += Math.abs(transposedLoc % 2);
        else if (isBottomLayer) transposedLoc -= Math.abs(transposedLoc % 2);
        if ((isTopLayer && transposedLoc < centralLocation) || (isBottomLayer && transposedLoc > centralLocation)) {
          transposedLoc = centralLocation;
        }
      }
      rest.SetLoc(transposedLoc);
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitScore(score: TransposeScoreLike): FunctorCode {
    const scoreDef = score.GetScoreDef();
    if (!scoreDef) throw new Error('TransposeFunctor::VisitScore: scoreDef required');

    if (this.m_transposer.IsValidIntervalName(this.m_transposition)) {
      this.m_transposer.SetTransposition(this.m_transposition);
    }
    else if (this.m_transposer.IsValidKeyTonic(this.m_transposition)) {
      // Find the starting key tonic of the data to use in calculating the tranposition interval:
      // Set transposition by key tonic.
      // Detect the current key from the keysignature.
      const keySig = scoreDef.FindDescendantByType(ClassId.KEYSIG) as TransposeKeySigLike | null;
      // If there is no keysignature, assume it is C.
      let currentKey = new TransPitch(0, 0, 0);
      if (keySig && keySig.HasPname()) {
        currentKey = new TransPitch(keySig.GetPname(), keySig.GetAccid(), ACCIDENTAL_WRITTEN_NONE, 0);
      }
      else if (keySig) {
        // No tonic pitch in key signature, so infer from key signature.
        const fifthsInt = keySig.GetFifthsInt();
        // Check the keySig@mode is present (currently assuming major):
        currentKey = this.m_transposer.CircleOfFifthsToMajorTonic(fifthsInt);
        // need to add a dummy "0" key signature in score (staffDefs of staffDef).
      }
      this.m_transposer.SetTransposition(currentKey, this.m_transposition);
    }
    else if (this.m_transposer.IsValidSemitones(this.m_transposition)) {
      const keySig = scoreDef.FindDescendantByType(ClassId.KEYSIG) as TransposeKeySigLike | null;
      let fifths = 0;
      if (keySig) {
        fifths = keySig.GetFifthsInt();
      }
      else {
        LogWarning('No key signature in data, assuming no key signature with no sharps/flats.');
        // need to add a dummy "0" key signature in score (staffDefs of staffDef).
      }
      this.m_transposer.SetTranspositionSemitones(fifths, this.m_transposition);
    }
    else {
      LogWarning('Transposition is invalid: %s', this.m_transposition);
      // there is no transposition that can be done so do not try
      // to transpose any further (if continuing in this function,
      // there will not be an error, just that the transposition
      // will be at the unison, so no notes should change.
      return FunctorCode.FUNCTOR_STOP;
    }

    // Evaluate functor on scoreDef
    scoreDef.Process(this);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaffDef(staffDef: TransposeStaffDefLike): FunctorCode {
    if (!this.GetKeySigForStaffDef(staffDef)) {
      // Auxiliary KeySig creation is an owning-tree mutation; represent it
      // through the structural AddChild contract.
      staffDef.AddChild({ __auxKeySig: true });
      LogWarning('Adding auxiliary KeySig for transposition');
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  protected GetKeySigForStaffDef(staffDef: TransposeStaffDefLike): unknown {
    let keySig = staffDef.FindDescendantByType(ClassId.KEYSIG) as unknown;
    if (!keySig) {
      const scoreDef = staffDef.GetFirstAncestor(ClassId.SCOREDEF) as TransposeScoreDefLike | null;
      keySig = scoreDef?.FindDescendantByType(ClassId.KEYSIG, 1) ?? null;
    }
    return keySig;
  }

  protected GetStaffNForKeySig(keySig: TransposeKeySigLike): number {
    let staffN = -1;
    const staffDef = keySig.GetFirstAncestor(ClassId.STAFFDEF) as unknown as TransposeStaffDefLike | null;
    if (staffDef) {
      staffN = staffDef.GetN();
    }
    else {
      const staff = keySig.GetAncestorStaff(StaffSearch.ANCESTOR_ONLY, false);
      if (staff) staffN = staff.GetN();
    }
    return staffN;
  }
}

//----------------------------------------------------------------------------
// TransposeSelectedMdivFunctor
//----------------------------------------------------------------------------

export class TransposeSelectedMdivFunctor extends TransposeFunctor {
  private m_selectedMdivID = '';
  private m_currentMdivIDs: string[] = [];

  public constructor(doc: unknown, transposer: Transposer) {
    super(doc, transposer);
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public SetSelectedMdivID(selectedID: string): void { this.m_selectedMdivID = selectedID; }

  public override VisitMdiv(mdiv: TransposeMdivLike): FunctorCode {
    super.VisitMdiv(mdiv);

    this.m_currentMdivIDs.push(mdiv.GetID());

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPageMilestone(pageMilestoneEnd: { GetStart(): { Is(classId: number): boolean } | null }): FunctorCode {
    if (pageMilestoneEnd.GetStart() && pageMilestoneEnd.GetStart()!.Is(ClassId.MDIV)) {
      this.m_currentMdivIDs.pop();
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public override VisitScore(score: TransposeScoreLike): FunctorCode {
    // Check whether we are in the selected mdiv
    if (this.m_selectedMdivID !== '' && !this.m_currentMdivIDs.includes(this.m_selectedMdivID)) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    return super.VisitScore(score);
  }

  public VisitSystem(_system: unknown): FunctorCode {
    // Check whether we are in the selected mdiv
    if (this.m_selectedMdivID !== '' && !this.m_currentMdivIDs.includes(this.m_selectedMdivID)) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// TransposeToSoundingPitchFunctor
//----------------------------------------------------------------------------

export class TransposeToSoundingPitchFunctor extends TransposeFunctor {
  private m_transposeIntervalForStaffN = new Map<number, number>();

  public constructor(doc: unknown, transposer: Transposer) {
    super(doc, transposer);
  }

  public override ImplementsEndInterface(): boolean { return true; }

  public override VisitMdiv(mdiv: TransposeMdivLike): FunctorCode {
    super.VisitMdiv(mdiv);

    this.m_transposeIntervalForStaffN.clear();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public override VisitScore(score: TransposeScoreLike): FunctorCode {
    // Evaluate functor on scoreDef
    const scoreDef = score.GetScoreDef();
    if (!scoreDef) throw new Error('TransposeToSoundingPitchFunctor::VisitScore: scoreDef required');
    scoreDef.Process(this);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScoreDef(scoreDef: TransposeScoreDefLike): FunctorCode {
    // Set the transposition in order to transpose common key signatures
    // (i.e. encoded as ScoreDef attributes or direct KeySig children)
    const staffNs = scoreDef.GetStaffNs();
    if (staffNs.length === 0) {
      let transposeInterval = 0;
      if (this.m_transposeIntervalForStaffN.size !== 0) {
        transposeInterval = this.m_transposeIntervalForStaffN.values().next().value!;
      }
      this.m_transposer.SetTransposition(transposeInterval);
    }
    else {
      this.VisitStaffDef(scoreDef.GetStaffDef(staffNs[0])!);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScoreDefEnd(scoreDef: TransposeScoreDefLike): FunctorCode {
    const hasScoreDefKeySig = this.m_keySigForStaffN.has(-1);
    if (hasScoreDefKeySig) {
      let showWarning = false;
      // Check if some staves are untransposed
      const mapEntryCount = this.m_transposeIntervalForStaffN.size;
      if (mapEntryCount > 0 && mapEntryCount < scoreDef.GetStaffNs().length) {
        showWarning = true;
      }
      // Check if there are different transpositions
      const values = [...this.m_transposeIntervalForStaffN.values()];
      for (let i = 1; i < values.length; ++i) {
        if (values[i] !== values[i - 1]) {
          showWarning = true;
          break;
        }
      }
      // Display warning
      if (showWarning) {
        LogWarning('Transpose to sounding pitch cannot handle different transpositions for ScoreDef key '
          + 'signatures. Please encode KeySig as StaffDef attribute or child.');
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: TransposeStaffLike): FunctorCode {
    this.UpdateTranspositionFromStaffN(staff);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public override VisitStaffDef(staffDef: TransposeStaffDefLike): FunctorCode {
    // Call base method (creates KeySig if missing)
    super.VisitStaffDef(staffDef);

    const keySig = this.GetKeySigForStaffDef(staffDef) as TransposeKeySigLike | null;

    // Determine and store the transposition interval (based on keySig)
    if (keySig && staffDef.HasTransSemi() && staffDef.HasN()) {
      const fifths = keySig.GetFifthsInt();
      let semitones = staffDef.GetTransSemi();
      // Factor out octave transpositions
      const sign = semitones >= 0 ? +1 : -1;
      semitones = sign * (Math.abs(semitones) % 24);
      this.m_transposer.SetTranspositionSemitones(fifths, String(semitones));
      this.m_transposeIntervalForStaffN.set(staffDef.GetN(), this.m_transposer.GetTranspositionIntervalClass());
      staffDef.ResetTransposition();
    }
    else {
      this.UpdateTranspositionFromStaffN(staffDef);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  private UpdateTranspositionFromStaffN(staffN: { HasN(): boolean; GetN(): number }): void {
    let transposeInterval = 0;
    if (staffN.HasN() && this.m_transposeIntervalForStaffN.has(staffN.GetN())) {
      transposeInterval = this.m_transposeIntervalForStaffN.get(staffN.GetN())!;
    }
    this.m_transposer.SetTransposition(transposeInterval);
  }
}
