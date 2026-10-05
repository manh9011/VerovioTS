/**
 * Pure TypeScript translation of Verovio's src/adjustaccidxfunctor.cpp.
 *
 * The native Doc/Score/Measure/Alignment tree is represented structurally until
 * those concrete implementations are migrated. The adjustment algorithm itself
 * follows the canonical C++ control flow, ordering, grouping and mutation rules.
 */
import { DocFunctor } from './functor.js';
import { Accid, AccidOctaveSort, AccidSpaceSort, ACCIDENTAL_WRITTEN_NONE } from './accid.js';
import { ClassId, FunctorCode, VRV_UNSET } from './vrvdef.js';

export interface AdjustAccidScoreDefLike {
  GetStaffDef(n: number): AdjustAccidStaffDefLike | null;
}

export interface AdjustAccidStaffDefLike {
  HasScale(): boolean;
  GetScale(): number;
}

export interface AdjustAccidScoreLike {
  GetScoreDef(): AdjustAccidScoreDefLike;
}

export interface AdjustAccidDocLike {
  GetCorrespondingScore(alignmentReference: AdjustAccidAlignmentReferenceLike): AdjustAccidScoreLike;
}

export interface AdjustAccidObjectLike {
  Is(classId: ClassId): boolean;
  GetFirstAncestor(classId: ClassId): AdjustAccidObjectLike | null;
}

export interface AdjustAccidNoteLike extends AdjustAccidObjectLike {
  GetOct(): number;
  IsUnisonWith(other: AdjustAccidNoteLike, considerAccidental: boolean): boolean;
  IsChordTone(): AdjustAccidChordLike | null;
}

export interface AdjustAccidChordLike extends AdjustAccidObjectLike {
  FindAllDescendantsByType(classId: ClassId): AdjustAccidObjectLike[];
}

export interface AdjustAccidLike extends AdjustAccidObjectLike {
  GetAccid(): number;
  GetN(): number;
  GetDrawingX(): number;
  SetDrawingXRel(value: number): void;
  GetDrawingXRel(): number;
  HasContentHorizontalBB(): boolean;
  GetContentRight(): number;
  GetContentLeft(): number;
  GetDrawingUnisonAccid(): AdjustAccidLike | null;
  IsAlignedWithSameLayer(value?: boolean): boolean | void;
  AdjustX(
    element: any,
    doc: AdjustAccidDocLike,
    staffSize: number,
    leftAccids: AdjustAccidLike[],
    adjustedAccids: Set<AdjustAccidLike>,
  ): void;
}

export interface AdjustAccidAlignmentLike {
  GetGraceAligners(): Map<unknown, { Process(functor: AdjustAccidXFunctor): void }>;
}

export interface AdjustAccidAlignmentReferenceLike extends AdjustAccidObjectLike {
  GetN(): number;
  GetChildren(): AdjustAccidObjectLike[];
}

export interface AdjustAccidMeasureLike extends AdjustAccidObjectLike {
  m_measureAligner: { Process(functor: AdjustAccidXFunctor): void };
}

/** Adjusts the horizontal position of accidentals around alignment references. */
export class AdjustAccidXFunctor extends DocFunctor {
  private m_currentMeasure: AdjustAccidMeasureLike | null = null;
  private readonly m_adjustedAccids = new Set<AdjustAccidLike>();

  public constructor(doc: AdjustAccidDocLike) {
    super(doc);
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitAlignment(alignment: AdjustAccidAlignmentLike): FunctorCode {
    for (const graceAlignerPair of alignment.GetGraceAligners().values()) {
      graceAlignerPair.Process(this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitAlignmentReference(alignmentReference: AdjustAccidAlignmentReferenceLike): FunctorCode {
    this.m_adjustedAccids.clear();

    const accids = this.GetAccidentalsForAdjustment(alignmentReference);
    if (accids.length === 0) return FunctorCode.FUNCTOR_SIBLINGS;

    if (!this.m_doc) throw new Error('AdjustAccidXFunctor: document is required.');
    const score = (this.m_doc as AdjustAccidDocLike).GetCorrespondingScore(alignmentReference);
    const scoreDef = score.GetScoreDef();
    const staffDef = scoreDef.GetStaffDef(alignmentReference.GetN());
    const staffSize = staffDef && staffDef.HasScale() ? staffDef.GetScale() : 100;

    // std::sort(accids, AccidSpaceSort) is stable only with respect to the comparator
    // equivalence in the C++ implementation; Array#sort is likewise used only as the
    // ordering mechanism here and preserves the comparator's ordering relation.
    const spaceSort = new AccidSpaceSort();
    accids.sort((a, b) => {
      if (spaceSort.operator(a as unknown as Accid, b as unknown as Accid)) return -1;
      if (spaceSort.operator(b as unknown as Accid, a as unknown as Accid)) return 1;
      return 0;
    });

    // Process accid layer alignment before octave grouping, exactly as in C++.
    for (const accid of accids) {
      this.SetAccidLayerAlignment(accid, alignmentReference);
    }

    // std::multiset<Accid*, AccidOctaveSort>: equivalent keys form octave groups.
    const octaveSort = new AccidOctaveSort();
    const octaveGroups = new Map<string, AdjustAccidLike[]>();
    for (const accid of accids) {
      const key = octaveSort.GetOctaveID(accid as unknown as Accid);
      const group = octaveGroups.get(key);
      if (group) group.push(accid);
      else octaveGroups.set(key, [accid]);
    }

    for (const accid of accids) {
      // Skip any accid that was already adjusted.
      if (this.m_adjustedAccids.has(accid)) continue;
      // Skip accidentals which are not descendants of a note (e.g. mensural).
      if (!accid.GetFirstAncestor(ClassId.NOTE)) continue;

      const range = octaveGroups.get(octaveSort.GetOctaveID(accid as unknown as Accid)) ?? [];

      // Detect at least two octave accidentals without unisons.
      let octaveAccidCount = 0;
      const octaves = new Set<number>();
      for (const octaveAccid of range) {
        const note = octaveAccid.GetFirstAncestor(ClassId.NOTE) as AdjustAccidNoteLike | null;
        if (!note) continue;
        octaves.add(note.GetOct());
        ++octaveAccidCount;
      }
      if (octaveAccidCount < 2 || octaves.size < octaveAccidCount) continue;

      // Adjust the octave accidentals and store the left-most position.
      let minDrawingX = -VRV_UNSET;
      for (const octaveAccid of range) {
        this.AdjustAccidWithSpace(octaveAccid, alignmentReference, staffSize);
        minDrawingX = Math.min(minDrawingX, octaveAccid.GetDrawingX());
      }

      // Align the octave accidentals whenever the correction is small enough.
      for (const octaveAccid of range) {
        const dist = octaveAccid.GetDrawingX() - minDrawingX;
        if (dist > 0 && octaveAccid.HasContentHorizontalBB()) {
          const accidWidth = octaveAccid.GetContentRight() - octaveAccid.GetContentLeft();
          if (dist < accidWidth / 2) {
            octaveAccid.SetDrawingXRel(octaveAccid.GetDrawingXRel() - dist);
          }
        }
      }
    }

    // Align accidentals for unison notes if one of them is present.
    for (const accid of accids) {
      const unisonAccid = accid.GetDrawingUnisonAccid();
      if (!unisonAccid) continue;
      accid.SetDrawingXRel(unisonAccid.GetDrawingXRel());
    }

    const count = accids.length;
    // Zig-zag processing, preserving multiple accidentals on one note.
    for (let i = 0, j = count - 1; i < count; ++i) {
      if (!this.m_adjustedAccids.has(accids[i])) {
        this.AdjustAccidWithSpace(accids[i], alignmentReference, staffSize);
      }

      // Do not zig-zag if the next accidental belongs to the current note.
      if (
        i < count - 1
        && accids[i].GetFirstAncestor(ClassId.NOTE) === accids[i + 1].GetFirstAncestor(ClassId.NOTE)
      ) {
        continue;
      }

      // Back up to the first accidental of the current bottom note.
      const k = j;
      while (
        j > 0
        && accids[j].GetFirstAncestor(ClassId.NOTE) === accids[j - 1].GetFirstAncestor(ClassId.NOTE)
      ) {
        --j;
      }

      for (let l = j; l <= k; ++l) {
        if (!this.m_adjustedAccids.has(accids[l])) {
          this.AdjustAccidWithSpace(accids[l], alignmentReference, staffSize);
        }
      }

      --j;
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasure(measure: AdjustAccidMeasureLike): FunctorCode {
    this.m_currentMeasure = measure;
    measure.m_measureAligner.Process(this);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  private GetAccidentalsForAdjustment(alignmentReference: AdjustAccidAlignmentReferenceLike): AdjustAccidLike[] {
    const accidentals: AdjustAccidLike[] = [];
    for (const child of alignmentReference.GetChildren()) {
      if (!child.Is(ClassId.ACCID)) continue;
      const accid = child as unknown as AdjustAccidLike;
      if (accid.GetAccid() !== ACCIDENTAL_WRITTEN_NONE && accid.GetFirstAncestor(ClassId.NOTE)) {
        accidentals.push(accid);
      }
    }
    return accidentals;
  }

  private SetAccidLayerAlignment(
    accid: AdjustAccidLike,
    alignmentReference: AdjustAccidAlignmentReferenceLike,
  ): void {
    if (accid.IsAlignedWithSameLayer()) return;

    const children = alignmentReference.GetChildren();
    const parentNote = accid.GetFirstAncestor(ClassId.NOTE) as AdjustAccidNoteLike | null;
    const hasUnisonOverlap = children.some((child) => {
      if (!child.Is(ClassId.NOTE)) return false;
      const otherNote = child as unknown as AdjustAccidNoteLike;
      // Notes are in unison but have different accidentals.
      return !!parentNote
        && parentNote.IsUnisonWith(otherNote, true)
        && !parentNote.IsUnisonWith(otherNote, false);
    });

    if (!hasUnisonOverlap || !parentNote) return;

    const chord = parentNote.IsChordTone();
    // No chord: align only the parent note.
    if (!chord) {
      accid.IsAlignedWithSameLayer(true);
      return;
    }

    // Chord ancestor: align all accidentals of the chord.
    const accidentals = chord.FindAllDescendantsByType(ClassId.ACCID);
    for (const object of accidentals) {
      (object as unknown as AdjustAccidLike).IsAlignedWithSameLayer(true);
    }
  }

  private AdjustAccidWithSpace(
    accid: AdjustAccidLike,
    alignmentReference: AdjustAccidAlignmentReferenceLike,
    staffSize: number,
  ): void {
    const leftAccids: AdjustAccidLike[] = [];
    const children = alignmentReference.GetChildren();

    for (const child of children) {
      // If an accidental has unison overlap, ignore elements on other layers.
      if (
        accid.IsAlignedWithSameLayer()
        && accid.GetFirstAncestor(ClassId.LAYER) !== child.GetFirstAncestor(ClassId.LAYER)
      ) {
        continue;
      }
      accid.AdjustX(child, this.m_doc as unknown as AdjustAccidDocLike, staffSize, leftAccids, this.m_adjustedAccids);
    }

    // Mark adjusted even if its position was not altered.
    this.m_adjustedAccids.add(accid);
  }

  public GetCurrentMeasure(): AdjustAccidMeasureLike | null {
    return this.m_currentMeasure;
  }

  public GetAdjustedAccidentals(): ReadonlySet<AdjustAccidLike> {
    return this.m_adjustedAccids;
  }
}
