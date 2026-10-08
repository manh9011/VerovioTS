/**
 * Pure TypeScript translation of Verovio's `src/chord.cpp` / `include/vrv/chord.h`.
 *
 * `Chord` models the MEI `<chord>` element.
 *
 * C++ multiple inheritance (LayerElement + ObjectListInterface +
 * DrawingListInterface + StemmedDrawingInterface + DurationInterface +
 * AttChordVis + AttColor + AttCue + AttGraced + AttStems + AttStemsCmn +
 * AttTiePresent + AttVisibility) is represented through explicit composition
 * with forwarding surfaces.
 */
import { ClassId, FunctorCode, VRV_UNSET, MapOfDotLocs, MapOfNoteLocs } from './vrvdef.js';
import { LayerElement, StaffSearch, DocContract, StaffContract, LayerContract } from './layerelement.js';
import { ObjectFactory, ObjectListInterface, VrvObject, ArrayOfObjects } from './object.js';
import { DrawingListInterface, StemmedDrawingInterface, STEMDIRECTION_up, STEMDIRECTION_down, StemLike } from './drawinginterface.js';
import { DurationInterface } from './durationinterface.js';
import { InstChordVis } from './atts_visual.js';
import { InstColor, InstCue, InstStems, InstTiePresent, InstVisibility } from './atts_shared.js';
import { InstGraced, InstStemsCmn } from './atts_cmn.js';
import { Point } from './devicecontextbase.js';
import { LogError } from './vrv.js';
import type { NotePredicate } from './layerelement.js';
import type { Fraction } from './fraction.js';

// Canonical libmei AttClassId ordinals (libmei/dist/attclasses.h).
const ATT_CHORDVIS = 253;
const ATT_COLOR = 109;
const ATT_CUE = 116;
const ATT_GRACED = 22;
const ATT_STEMS = 209;
const ATT_STEMSCMN = 35;
const ATT_TIEPRESENT = 217;
const ATT_VISIBILITY = 228;

// data_BOOLEAN ordinals from the generated converter layer.
const BOOLEAN_true = 1;

/** Structural contract for the still-unmigrated `Note` collaborator. */
export interface ChordNoteLike {
  GetDiatonicPitch(): number;
  GetDrawingLoc(): number;
  GetDrawingY(): number;
  GetDrawingX(): number;
  GetDots(): number;
  HasDots(): boolean;
  HasVisible?(): boolean;
  GetVisible?(): any;
  GetAncestorStaff?(strategy?: number, assertExistence?: boolean): StaffContract | null;
  GetCrossStaff?(layerRef: { value: LayerContract | null }): StaffContract | null;
  m_crossStaff?: unknown;
  m_crossLayer?: LayerContract | null;
  SetNoteGroup?(noteGroup: ChordNoteGroupLike | null, position: number): void;
  GetNoteGroup?(): ChordNoteGroupLike | null;
  GetStemUpSE?(doc: unknown, staffSize: number, isCueSize: boolean): Point;
  GetStemDownNW?(doc: unknown, staffSize: number, isCueSize: boolean): Point;
  CalcStemLenInThirdUnits?(staff: unknown, stemDir: number): number;
  CalcElementHorizontalOverlap?(
    doc: DocContract, otherElements: LayerElement[], areDotsAdjusted: boolean,
    isChordElement: boolean, isLowerElement?: boolean, unison?: boolean,
  ): [number, boolean];
  IsVisible?(): boolean;
  Is(classId: ClassId): boolean;
  GetClassId(): ClassId;
}

/** C++ `ChordNoteGroup` is a `std::vector<Note *>`; modeled as an array. */
export type ChordNoteGroupLike = ChordNoteLike[];

/**
 * Helper function to calculate optimal dot locations based on note locations
 * in the chord. C++ template with forward/reverse iterators; both orders are
 * expressed over the ascending-sorted location array.
 */
function CalculateDotLocations(locations: number[], isReverseOrder: boolean): Set<number> {
  // Location adjustment that should be applied when looking for the optimal position
  let locAdjust = [0, 1, -1, -2, 2];
  if (isReverseOrder) locAdjust = locAdjust.map((v) => -v);
  // C++ returns std::set<int>: deduplicated AND ascending-sorted regardless of
  // iteration order. Collect first, then emit sorted so DrawDots order matches.
  const collected = new Set<number>();
  let prev: number | null = null;
  const values = isReverseOrder ? [...locations].reverse() : locations;
  for (const iter of values) {
    for (const adjust of locAdjust) {
      if ((iter + adjust) % 2 === 0) continue;
      if (prev !== null && prev === iter && adjust === -2) continue;
      // C++ std::set::insert reports whether the value was new; a duplicate
      // falls through to the next adjustment.
      if (collected.has(iter + adjust)) continue;
      collected.add(iter + adjust);
      break;
    }
    prev = iter;
  }
  return new Set([...collected].sort((a, b) => a - b));
}

/**
 * ObjectListInterface specialization for Chord. C++ has `Chord` inherit
 * `ObjectListInterface` and override `FilterList`; TypeScript models this with
 * a subclass whose `GetInterfaceOwner()` resolves back to the chord.
 */
class ChordListInterface extends ObjectListInterface {
  protected override FilterList(childList: VrvObject[]): void {
    // Retain only note children of chords
    for (let i = 0; i < childList.length;) {
      if (childList[i].Is(ClassId.NOTE)) ++i;
      else childList.splice(i, 1);
    }
    // DiatonicSort: sort notes by diatonic pitch
    childList.sort((a, b) => {
      const n1 = a as unknown as ChordNoteLike;
      const n2 = b as unknown as ChordNoteLike;
      return n1.GetDiatonicPitch() - n2.GetDiatonicPitch();
    });
  }
}

/** Pure TypeScript translation of Verovio's `Chord`. */
// ponytail: shared subclass replaces per-chord anonymous class (see note.ts P21).
class ChordStemmedDrawingInterface extends StemmedDrawingInterface {
  constructor(private owner: Chord) { super(); }
  public override GetStemUpSE(doc: any, staffSize: number, isCueSize: boolean): Point {
    return this.owner.GetStemUpSE(doc, staffSize, isCueSize);
  }
  public override GetStemDownNW(doc: any, staffSize: number, isCueSize: boolean): Point {
    return this.owner.GetStemDownNW(doc, staffSize, isCueSize);
  }
  public override CalcStemLenInThirdUnits(staff: any, stemDir: number): number {
    return this.owner.CalcStemLenInThirdUnits(staff, stemDir);
  }
}

export class Chord extends LayerElement {
  private readonly objectList: ChordListInterface;
  private readonly drawingList: DrawingListInterface;
  private stemmedDrawingInterface!: StemmedDrawingInterface;
  private durationInterface!: DurationInterface;
  private chordVis!: InstChordVis;
  private color!: InstColor;
  private cue!: InstCue;
  private graced!: InstGraced;
  private stems!: InstStems;
  private stemsCmn!: InstStemsCmn;
  private tiePresent!: InstTiePresent;
  private visibility!: InstVisibility;

  /** The list of chord note groups (C++ owns `ChordNoteGroup` objects). */
  private m_noteGroups: ChordNoteGroupLike[] = [];

  public constructor() {
    super(ClassId.CHORD);
    // Components must be created after `super(classId)` so the virtual
    // Reset() run by the VrvObject constructor sees initialized state.
    this.objectList = new ChordListInterface();
    this.objectList.SetInterfaceOwner(this as unknown as VrvObject);
    this.drawingList = new DrawingListInterface();

    this.stemmedDrawingInterface = new ChordStemmedDrawingInterface(this);

    this.durationInterface = new DurationInterface();
    this.chordVis = new InstChordVis();
    this.color = new InstColor();
    this.cue = new InstCue();
    this.graced = new InstGraced();
    this.stems = new InstStems();
    this.stemsCmn = new InstStemsCmn();
    this.tiePresent = new InstTiePresent();
    this.visibility = new InstVisibility();

    this.RegisterInterface(this.durationInterface.GetAttClasses(), this.durationInterface.IsInterface());
    this.RegisterAttClass(ATT_CHORDVIS);
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_CUE);
    this.RegisterAttClass(ATT_GRACED);
    this.RegisterAttClass(ATT_STEMS);
    this.RegisterAttClass(ATT_STEMSCMN);
    this.RegisterAttClass(ATT_TIEPRESENT);
    this.RegisterAttClass(ATT_VISIBILITY);

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.drawingList?.Reset();
    this.stemmedDrawingInterface?.Reset();
    this.durationInterface ??= new DurationInterface();
    this.durationInterface.Reset();
    this.chordVis?.ResetChordVis();
    this.color?.ResetColor();
    this.cue?.ResetCue();
    this.graced?.ResetGraced();
    this.stems?.ResetStems();
    this.stemsCmn?.ResetStemsCmn();
    this.tiePresent?.ResetTiePresent();
    this.visibility?.ResetVisibility();

    this.ClearNoteGroups();
  }

  public override CloneReset(): void {
    super.CloneReset();
    this.m_noteGroups = [];
  }

  public override GetClassName(): string { return 'chord'; }

  // Interface getters.
  public override GetDurationInterface(): DurationInterface { return this.durationInterface; }
  public GetStemmedDrawingInterface(): StemmedDrawingInterface { return this.stemmedDrawingInterface; }

  /** StemmedDrawingInterface forwarding used by Chord consumers. */
  public GetDrawingStem(): StemLike | null { return this.stemmedDrawingInterface.GetDrawingStem(); }
  public SetDrawingStem(stem: StemLike | null): void { this.stemmedDrawingInterface.SetDrawingStem(stem); }
  public GetDrawingStemDir(): number { return this.stemmedDrawingInterface.GetDrawingStemDir(); }
  public SetDrawingStemDir(dir: number): void { this.stemmedDrawingInterface.SetDrawingStemDir(dir); }
  public SetDrawingStemLen(len: number): void { this.stemmedDrawingInterface.SetDrawingStemLen(len); }
  public GetDrawingStemLen(): number { return this.stemmedDrawingInterface.GetDrawingStemLen(); }

  public override HasToBeAligned(): boolean { return true; }

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported = [ClassId.ARTIC, ClassId.DOTS, ClassId.NOTE, ClassId.REFRAIN, ClassId.STEM, ClassId.VERSE];
    if (supported.includes(classId)) return true;
    return VrvObject.IsEditorialElement(classId);
  }

  /**
   * Stems (and dots) are always added by PrepareLayerElementParts (for now)
   * and we want them to be in the front for the drawing order in the SVG output.
   */
  public override AddChild(child: VrvObject): boolean {
    if (!this.IsSupportedChild(child.GetClassId()) || !this.AddChildAdditionalCheck(child)) {
      LogError("Adding '%s' to a '%s'", child.GetClassName(), this.GetClassName());
      return false;
    }

    const children = this.GetChildrenForModification();
    child.SetParent(this);
    if (child.IsAnyOf([ClassId.DOTS, ClassId.STEM])) {
      children.unshift(child);
    }
    else {
      children.push(child);
    }
    this.Modify();
    return true;
  }

  //---------//
  // Note groups
  //---------//

  public ClearNoteGroups(): void {
    // Guard: the VrvObject base constructor dispatches the virtual Reset()
    // before subclass field initializers run (C++ vtable-in-ctor adaptation).
    if (!this.m_noteGroups) {
      this.m_noteGroups = [];
      return;
    }
    for (const group of this.m_noteGroups) {
      for (const note of group) {
        note.SetNoteGroup?.(null, 0);
      }
    }
    this.m_noteGroups = [];
  }

  /** Recalculate the m_noteGroups vector. */
  public CalculateNoteGroups(): void {
    this.ClearNoteGroups();

    const childList = this.GetList();
    if (childList.length === 0) return;

    let lastNote = childList[0] as unknown as ChordNoteLike;
    let lastPitch = lastNote.GetDiatonicPitch();
    let curGroup: ChordNoteGroupLike | null = null;

    for (let i = 1; i < childList.length; ++i) {
      const curNote = childList[i] as unknown as ChordNoteLike;
      const curPitch = curNote.GetDiatonicPitch();

      const layer1Ref = { value: null as LayerContract | null };
      const layer2Ref = { value: null as LayerContract | null };
      const curStaff = curNote.GetCrossStaff?.(layer1Ref) ?? (curNote.m_crossStaff as StaffContract | null) ?? null;
      const lastStaff = lastNote.GetCrossStaff?.(layer2Ref) ?? (lastNote.m_crossStaff as StaffContract | null) ?? null;

      if ((curPitch - lastPitch < 2) && (curStaff === lastStaff)) {
        if (!lastNote.GetNoteGroup?.()) {
          curGroup = [];
          this.m_noteGroups.push(curGroup);
          curGroup.push(lastNote);
          lastNote.SetNoteGroup?.(curGroup, curGroup.length);
        }
        curGroup!.push(curNote);
        curNote.SetNoteGroup?.(curGroup!, curGroup!.length);
      }

      lastNote = curNote;
      lastPitch = curPitch;
    }
  }

  //---------//
  // ObjectListInterface adaptation (methods run on the composed component)
  //---------//

  public GetList(): VrvObject[] { return this.objectList.GetList(); }
  public HasEmptyList(): boolean { return this.objectList.HasEmptyList(); }
  public GetListSize(): number { return this.objectList.GetListSize(); }
  public GetListFront(): VrvObject { return this.objectList.GetListFront(); }
  public GetListBack(): VrvObject { return this.objectList.GetListBack(); }
  public GetListIndex(element: VrvObject): number { return this.objectList.GetListIndex(element); }
  public GetListFirst(startFrom: VrvObject, classId?: ClassId): VrvObject | null {
    return this.objectList.GetListFirst(startFrom, classId ?? ClassId.UNSPECIFIED);
  }
  public GetListFirstBackward(startFrom: VrvObject, classId?: ClassId): VrvObject | null {
    return this.objectList.GetListFirstBackward(startFrom, classId ?? ClassId.UNSPECIFIED);
  }
  public GetListPrevious(element: VrvObject): VrvObject | null { return this.objectList.GetListPrevious(element); }
  public GetListNext(element: VrvObject): VrvObject | null { return this.objectList.GetListNext(element); }

  //---------//
  // Position / extremes
  //---------//

  /** Return 0 if the note is the middle note, -1 if below it and 1 if above. */
  public PositionInChord(note: ChordNoteLike): number {
    const size = this.GetListSize();
    const position = this.GetListIndex(note as unknown as VrvObject);
    if (position === -1) throw new Error('Chord::PositionInChord: note not in chord.');
    // this is the middle (only if odd)
    if ((size % 2) && (position === (size - 1) / 2)) return 0;
    if (position < (size / 2)) return -1;
    return 1;
  }

  public GetYExtremes(yMax: { value: number }, yMin: { value: number }): void {
    // The first note is the bottom
    yMin.value = this.GetListFront().GetDrawingY();
    // The last note is the top
    yMax.value = this.GetListBack().GetDrawingY();
  }

  public GetYTop(): number {
    // The last note is the top
    return this.GetListBack().GetDrawingY();
  }

  public GetYBottom(): number {
    // The first note is the bottom
    return this.GetListFront().GetDrawingY();
  }

  public GetTopNote(): ChordNoteLike {
    return this.GetListBack() as unknown as ChordNoteLike;
  }

  public GetBottomNote(): ChordNoteLike {
    // The first note is the bottom
    return this.GetListFront() as unknown as ChordNoteLike;
  }

  public GetXMin(): number {
    const childList = this.GetList(); // make sure it's initialized
    if (childList.length === 0) throw new Error('Chord::GetXMin: chord has no notes.');

    let x = -VRV_UNSET;
    for (const child of childList) {
      x = Math.min(child.GetDrawingX(), x);
    }
    return x;
  }

  public GetXMax(): number {
    const childList = this.GetList(); // make sure it's initialized
    if (childList.length === 0) throw new Error('Chord::GetXMax: chord has no notes.');

    let x = VRV_UNSET;
    for (const child of childList) {
      x = Math.max(child.GetDrawingX(), x);
    }
    return x;
  }

  //---------//
  // Cross staff
  //---------//

  public GetCrossStaffExtremes(
    staffAbove: { value: StaffContract | null },
    staffBelow: { value: StaffContract | null },
    layerAbove?: { value: LayerContract | null },
    layerBelow?: { value: LayerContract | null },
  ): void {
    staffAbove.value = null;
    staffBelow.value = null;

    // We assume that if we have a cross-staff chord we cannot have further cross-staffed notes
    if (this.m_crossStaff) return;

    // The first note is the bottom
    const bottomNote = this.GetBottomNote();
    if (bottomNote.m_crossStaff && bottomNote.m_crossLayer) {
      staffBelow.value = bottomNote.m_crossStaff as StaffContract;
      if (layerBelow) layerBelow.value = bottomNote.m_crossLayer;
    }

    // The last note is the top
    const topNote = this.GetTopNote();
    if (topNote.m_crossStaff && topNote.m_crossLayer) {
      staffAbove.value = topNote.m_crossStaff as StaffContract;
      if (layerAbove) layerAbove.value = topNote.m_crossLayer;
    }
  }

  public override HasCrossStaff(): boolean {
    if (this.m_crossStaff) return true;

    const staffAbove = { value: null as StaffContract | null };
    const staffBelow = { value: null as StaffContract | null };

    this.GetCrossStaffExtremes(staffAbove, staffBelow);

    return (staffAbove.value !== null) || (staffBelow.value !== null);
  }

  //---------//
  // Stem attachment points
  //---------//

  public GetStemUpSE(doc: unknown, staffSize: number, isCueSize: boolean): Point {
    const bottomNote = this.GetBottomNote();
    const p = bottomNote.GetStemUpSE?.(doc, staffSize, isCueSize);
    return p ?? new Point(0, 0);
  }

  public GetStemDownNW(doc: unknown, staffSize: number, isCueSize: boolean): Point {
    const topNote = this.GetTopNote();
    const p = topNote.GetStemDownNW?.(doc, staffSize, isCueSize);
    return p ?? new Point(0, 0);
  }

  public CalcStemLenInThirdUnits(staff: unknown, stemDir: number): number {
    if (stemDir === STEMDIRECTION_up) {
      const topNote = this.GetTopNote();
      return topNote.CalcStemLenInThirdUnits?.(staff, stemDir) ?? 0;
    }
    else if (stemDir === STEMDIRECTION_down) {
      const bottomNote = this.GetBottomNote();
      return bottomNote.CalcStemLenInThirdUnits?.(staff, stemDir) ?? 0;
    }
    return 0;
  }

  //---------//
  // Visibility
  //---------//

  public IsVisible(): boolean {
    if (this.HasVisible()) {
      return this.GetVisible() === BOOLEAN_true;
    }

    // if the chord doesn't have it, see if all the children are invisible
    const notes = this.GetList();
    for (const object of notes) {
      const note = object as unknown as ChordNoteLike;
      if (!note.HasVisible?.() || note.GetVisible?.() === BOOLEAN_true) return true;
    }
    return false;
  }

  //---------//
  // Adjacency / dots
  //---------//

  public HasAdjacentNotesInStaff(staff: StaffContract): boolean {
    const locations = this.CalcNoteLocations();
    const locs = locations.get(staff as never);
    if (!locs || locs.size === 0 || locs.size === 1) return false;

    // Find difference between adjacent notes in the chord. Since locations[staff]
    // is a sorted set, elements are ordered and represent positions of notes in
    // the chord. This way we can find whether there are notes with a diatonic
    // step difference of 1.
    const values = [...locs];
    for (let i = 1; i < values.length; ++i) {
      if (values[i] - values[i - 1] === 1) return true;
    }
    return false;
  }

  public HasNoteWithDots(): boolean {
    const notes = this.GetList();
    return notes.some((object) => {
      const note = object as unknown as ChordNoteLike;
      return note.GetDots() > 0;
    });
  }

  //---------//
  // Overlapping layers
  //---------//

  public override AdjustOverlappingLayers(
    doc: DocContract,
    otherElements: LayerElement[],
    areDotsAdjusted: boolean,
    isUnison: { value: boolean },
    stemSameas: { value: boolean },
  ): number {
    let margin = 0;
    // get positions of other elements
    const otherElementLocations = new Set<number>();
    for (const element of otherElements) {
      if (element.Is(ClassId.NOTE)) {
        otherElementLocations.add((element as unknown as ChordNoteLike).GetDrawingLoc());
      }
    }
    const notes = this.GetList();
    // get current chord positions
    const chordElementLocations = new Set<number>();
    for (const child of notes) {
      const note = child as unknown as ChordNoteLike;
      chordElementLocations.add(note.GetDrawingLoc());
    }

    const locationsInUnison = (this as unknown as {
      GetElementsInUnison(firstChord: Set<number>, secondChord: Set<number>, stemDirection: number): number[];
    }).GetElementsInUnison(chordElementLocations, otherElementLocations, this.GetDrawingStemDir());

    const expectedElementsInUnison = locationsInUnison.length;
    const chordBegin = Math.min(...chordElementLocations);
    const otherBegin = otherElementLocations.size > 0 ? Math.min(...otherElementLocations) : 0;
    const isLowerPosition =
      (STEMDIRECTION_down === this.GetDrawingStemDir()) && (otherElementLocations.size > 0) && (chordBegin >= otherBegin);
    let actualElementsInUnison = 0;

    // process each note of the chord separately, storing locations in the set
    for (const object of notes) {
      const note = object as unknown as ChordNoteLike;
      const [overlap, isInUnison] = note.CalcElementHorizontalOverlap
        ? note.CalcElementHorizontalOverlap(doc, otherElements, areDotsAdjusted, true, isLowerPosition, expectedElementsInUnison > 0)
        : [0, false];
      if (((margin >= 0) && (overlap > margin)) || ((margin <= 0) && (overlap < margin))) {
        margin = overlap;
      }
      else if ((margin < 0) && (this.m_noteGroups.length > 0)) {
        margin = overlap;
      }
      if (isInUnison) ++actualElementsInUnison;
    }

    // if there are accidentals that are aligned for the layer separately, we need to have additional margin for them
    let accidMargin = 0;
    for (const iter of otherElements) {
      if (!iter.Is(ClassId.NOTE)) continue;
      const note = iter as unknown as ChordNoteLike & { FindDescendantByType(classId: ClassId): VrvObject | null };
      const accid = note.FindDescendantByType?.(ClassId.ACCID) as unknown as
        | { IsAlignedWithSameLayer?(): boolean; GetContentRight?(): number; GetContentLeft?(): number }
        | null
        | undefined;
      if (accid && accid.IsAlignedWithSameLayer?.()) {
        accidMargin += (accid.GetContentRight?.() ?? 0) - (accid.GetContentLeft?.() ?? 0);
      }
    }
    if (accidMargin) {
      // add padding for the accidentals (1.5 unit)
      accidMargin += 1.5 * doc.GetDrawingUnit(100);
    }

    if (expectedElementsInUnison && (expectedElementsInUnison === actualElementsInUnison)) {
      isUnison.value = true;
    }
    else if (margin) {
      // adjust margin by accidental margin
      margin -= accidMargin;
      this.SetDrawingXRel(this.GetDrawingXRel() + margin);
      return margin;
    }
    return 0;
  }

  /**
   * Helper to get list of notes that are adjacent to the specified location.
   * Diatonic step difference is taken up to 2 points, so HasAdjacentNotesInStaff()
   * needs to be called first to make sure there actually are adjacent notes.
   */
  public GetAdjacentNotesList(staff: StaffContract, loc: number): ChordNoteLike[] {
    const notes = this.GetList();
    const adjacentNotes: ChordNoteLike[] = [];
    for (const obj of notes) {
      const note = obj as unknown as ChordNoteLike;
      const noteStaff = note.GetAncestorStaff?.(StaffSearch.RESOLVE_CROSS_STAFF, false) ?? null;
      if (noteStaff !== staff) continue;

      const locDiff = note.GetDrawingLoc() - loc;
      if ((Math.abs(locDiff) <= 2) && (locDiff !== 0)) {
        adjacentNotes.push(note);
      }
    }
    return adjacentNotes;
  }

  //---------//
  // Functors
  //---------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitChord');
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitChord');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitChordEnd');
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitChordEnd');
  }

  private visit(functor: unknown, method: string): FunctorCode {
    const f = functor as Record<string, unknown>;
    const fn = f[method];
    if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, this);
    if (typeof f['VisitObject'] === 'function') {
      return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  //---------//
  // Protected virtual surfaces (override the LayerElement stubs)
  //---------//

  protected override CalcNoteLocations(predicate: NotePredicate | null = null): MapOfNoteLocs {
    const notes = this.GetList();

    const noteLocations = new Map<never, Set<number>>();
    for (const obj of notes) {
      const note = obj as unknown as ChordNoteLike;
      if (predicate && !predicate(obj)) continue;

      const staff = note.GetAncestorStaff?.(StaffSearch.RESOLVE_CROSS_STAFF, false) ?? null;
      const key = staff as never;
      let set = noteLocations.get(key);
      if (!set) {
        set = new Set<number>();
        noteLocations.set(key, set);
      }
      set.add(note.GetDrawingLoc());
    }
    return noteLocations as unknown as MapOfNoteLocs;
  }

  protected override CalcDotLocations(layerCount: number, primary: boolean): MapOfDotLocs {
    const isUpwardDirection = (this.GetDrawingStemDir() === STEMDIRECTION_up) || (layerCount === 1);
    const useReverseOrder = (isUpwardDirection !== primary);
    const noteLocs = this.CalcNoteLocations((note) => {
      const n = note as unknown as ChordNoteLike;
      return !n.HasDots();
    });
    const dotLocs = new Map<never, Set<number>>();
    for (const [mapEntry, locs] of noteLocs as unknown as Map<never, Set<number>>) {
      dotLocs.set(mapEntry, CalculateDotLocations([...locs], useReverseOrder));
    }
    return dotLocs as unknown as MapOfDotLocs;
  }

  //---------//
  // DrawingListInterface forwarding
  //---------//

  public AddToDrawingList(element: VrvObject): void { this.drawingList.AddToDrawingList(element); }
  public GetDrawingList(): ArrayOfObjects { return this.drawingList.GetDrawingList(); }
  public ResetDrawingList(): void { this.drawingList.ResetDrawingList(); }

  //---------//
  // Attribute forwarding surfaces
  //---------//

  // AttChordVis
  public ResetChordVis(): void { this.chordVis.ResetChordVis(); }
  public SetCluster(value: number): void { this.chordVis.SetCluster(value); }
  public GetCluster(): number { return this.chordVis.GetCluster(); }
  public HasCluster(): boolean { return this.chordVis.HasCluster(); }

  // AttColor
  public ResetColor(): void { this.color.ResetColor(); }
  public SetColor(value: any): void { this.color.SetColor(value); }
  public GetColor(): any { return this.color.GetColor(); }
  public HasColor(): boolean { return this.color.HasColor(); }

  // AttCue
  public ResetCue(): void { this.cue.ResetCue(); }
  public SetCue(value: any): void { this.cue.SetCue(value); }
  public GetCue(): any { return this.cue.GetCue(); }
  public HasCue(): boolean { return this.cue.HasCue(); }

  // AttGraced
  public ResetGraced(): void { this.graced.ResetGraced(); }
  public SetGrace(value: any): void { this.graced.SetGrace(value); }
  public GetGrace(): any { return this.graced.GetGrace(); }
  public HasGrace(): boolean { return this.graced.HasGrace(); }
  public SetGraceTime(value: any): void { this.graced.SetGraceTime(value); }
  public GetGraceTime(): any { return this.graced.GetGraceTime(); }
  public HasGraceTime(): boolean { return this.graced.HasGraceTime(); }

  // AttStems
  public ResetStems(): void { this.stems.ResetStems(); }
  public SetStemDir(value: any): void { this.stems.SetStemDir(value); }
  public GetStemDir(): any { return this.stems.GetStemDir(); }
  public HasStemDir(): boolean { return this.stems.HasStemDir(); }
  public SetStemLen(value: any): void { this.stems.SetStemLen(value); }
  public GetStemLen(): any { return this.stems.GetStemLen(); }
  public HasStemLen(): boolean { return this.stems.HasStemLen(); }
  public SetStemMod(value: any): void { this.stems.SetStemMod(value); }
  public GetStemMod(): any { return this.stems.GetStemMod(); }
  public HasStemMod(): boolean { return this.stems.HasStemMod(); }
  public SetStemPos(value: any): void { this.stems.SetStemPos(value); }
  public GetStemPos(): any { return this.stems.GetStemPos(); }
  public HasStemPos(): boolean { return this.stems.HasStemPos(); }
  public SetStemSameas(value: any): void { this.stems.SetStemSameas(value); }
  public GetStemSameas(): any { return this.stems.GetStemSameas(); }
  public HasStemSameas(): boolean { return this.stems.HasStemSameas(); }
  public SetStemVisible(value: any): void { this.stems.SetStemVisible(value); }
  public GetStemVisible(): any { return this.stems.GetStemVisible(); }
  public HasStemVisible(): boolean { return this.stems.HasStemVisible(); }
  public SetStemX(value: any): void { this.stems.SetStemX(value); }
  public GetStemX(): any { return this.stems.GetStemX(); }
  public HasStemX(): boolean { return this.stems.HasStemX(); }
  public SetStemY(value: any): void { this.stems.SetStemY(value); }
  public GetStemY(): any { return this.stems.GetStemY(); }
  public HasStemY(): boolean { return this.stems.HasStemY(); }

  // AttStemsCmn
  public ResetStemsCmn(): void { this.stemsCmn.ResetStemsCmn(); }
  public SetStemWith(value: any): void { this.stemsCmn.SetStemWith(value); }
  public GetStemWith(): any { return this.stemsCmn.GetStemWith(); }
  public HasStemWith(): boolean { return this.stemsCmn.HasStemWith(); }

  // AttTiePresent
  public ResetTiePresent(): void { this.tiePresent.ResetTiePresent(); }
  public SetTie(value: any): void { this.tiePresent.SetTie(value); }
  public GetTie(): any { return this.tiePresent.GetTie(); }
  public HasTie(): boolean { return this.tiePresent.HasTie(); }

  // AttVisibility
  public ResetVisibility(): void { this.visibility.ResetVisibility(); }
  public SetVisible(value: any): void { this.visibility.SetVisible(value); }
  public GetVisible(): any { return this.visibility.GetVisible(); }
  public HasVisible(): boolean { return this.visibility.HasVisible(); }

  //---------//
  // DurationInterface forwarding surface (subset used by Chord consumers)
  //---------//

  public SetDur(v: number): void { this.durationInterface.SetDur(v); }
  public GetDur(): number { return this.durationInterface.GetDur(); }
  public HasDur(): boolean { return this.durationInterface.HasDur(); }
  public SetDots(v: number): void { this.durationInterface.SetDots(v); }
  public SetDurPpq(v: number): void { this.durationInterface.SetDurPpq(v); }
  public GetDurPpq(): number { return this.durationInterface.GetDurPpq(); }
  public SetStaff(v: number[]): void { this.durationInterface.SetStaff(v); }
  public GetStaff(): number[] { return this.durationInterface.GetStaff(); }
  public HasStaff(): boolean { return this.durationInterface.HasStaff(); }
  public ResetStaffIdent(): void { this.durationInterface.ResetStaffIdent(); }
  public GetDots(): number { return this.durationInterface.GetDots(); }
  public HasDots(): boolean { return this.durationInterface.HasDots(); }
  public SetDurGes(v: number): void { this.durationInterface.SetDurGes(v); }
  public GetDurGes(): number { return this.durationInterface.GetDurGes(); }
  public HasDurGes(): boolean { return this.durationInterface.HasDurGes(); }
  public SetDotsGes(v: number): void { this.durationInterface.SetDotsGes(v); }
  public GetDotsGes(): number { return this.durationInterface.GetDotsGes(); }
  public HasDotsGes(): boolean { return this.durationInterface.HasDotsGes(); }
  public SetDurQuality(v: number): void { this.durationInterface.SetDurQuality(v); }
  public GetDurQuality(): number { return this.durationInterface.GetDurQuality(); }
  public HasDurQuality(): boolean { return this.durationInterface.HasDurQuality(); }
  public SetNum(v: number): void { this.durationInterface.SetNum(v); }
  public GetNum(): number { return this.durationInterface.GetNum(); }
  public HasNum(): boolean { return this.durationInterface.HasNum(); }
  public SetNumbase(v: number): void { this.durationInterface.SetNumbase(v); }
  public SetFermata(v: number): void { this.durationInterface.SetFermata(v); }
  public GetFermata(): number { return this.durationInterface.GetFermata(); }
  public HasFermata(): boolean { return this.durationInterface.HasFermata(); }
  public ResetFermataPresent(): void { this.durationInterface.ResetFermataPresent(); }
  public GetNumbase(): number { return this.durationInterface.GetNumbase(); }
  public HasNumbase(): boolean { return this.durationInterface.HasNumbase(); }
  public GetActualDur(): number { return this.durationInterface.GetActualDur(); }
  public GetActualDurGes(): number { return this.durationInterface.GetActualDurGes(); }
  public SetScoreTimeOnset(v: Fraction): void { this.durationInterface.SetScoreTimeOnset(v); }
  public SetRealTimeOnsetSeconds(v: number): void { this.durationInterface.SetRealTimeOnsetSeconds(v); }
  public SetScoreTimeOffset(v: Fraction): void { this.durationInterface.SetScoreTimeOffset(v); }
  public SetRealTimeOffsetSeconds(v: number): void { this.durationInterface.SetRealTimeOffsetSeconds(v); }
  public SetScoreTimeTiedDuration(v: Fraction): void { this.durationInterface.SetScoreTimeTiedDuration(v); }
  public GetScoreTimeOnset(): Fraction { return this.durationInterface.GetScoreTimeOnset(); }
  public GetRealTimeOnsetMilliseconds(): number { return this.durationInterface.GetRealTimeOnsetMilliseconds(); }
  public GetScoreTimeOffset(): Fraction { return this.durationInterface.GetScoreTimeOffset(); }
  public GetRealTimeOffsetMilliseconds(): number { return this.durationInterface.GetRealTimeOffsetMilliseconds(); }
  public GetScoreTimeTiedDuration(): Fraction { return this.durationInterface.GetScoreTimeTiedDuration(); }
  public GetScoreTimeDuration(): Fraction { return this.durationInterface.GetScoreTimeDuration(); }
  public SetBreaksec(v: number): void { this.durationInterface.SetBreaksec(v); }
  public GetBreaksec(): number { return this.durationInterface.GetBreaksec(); }
  public HasBreaksec(): boolean { return this.durationInterface.HasBreaksec(); }

  //---------//
  // Clone
  //---------//

  public override Clone(): Chord {
    const clone = new Chord();
    clone.AssignFrom(this);
    if (this.HasDur()) clone.SetDur(this.GetDur());
    if (this.HasDots()) clone.SetDots(this.GetDots());
    if (this.HasDurGes()) clone.SetDurGes(this.GetDurGes());
    if (this.HasDotsGes()) clone.SetDotsGes(this.GetDotsGes());
    if (this.HasDurQuality()) clone.SetDurQuality(this.GetDurQuality());
    if (this.HasNum()) clone.SetNum(this.GetNum());
    if (this.HasNumbase()) clone.SetNumbase(this.GetNumbase());
    if (this.HasCluster()) clone.SetCluster(this.GetCluster());
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasCue()) clone.SetCue(this.GetCue());
    if (this.HasGrace()) clone.SetGrace(this.GetGrace());
    if (this.HasGraceTime()) clone.SetGraceTime(this.GetGraceTime());
    if (this.HasStemDir()) clone.SetStemDir(this.GetStemDir());
    if (this.HasStemLen()) clone.SetStemLen(this.GetStemLen());
    if (this.HasStemMod()) clone.SetStemMod(this.GetStemMod());
    if (this.HasStemPos()) clone.SetStemPos(this.GetStemPos());
    if (this.HasStemSameas()) clone.SetStemSameas(this.GetStemSameas());
    if (this.HasStemVisible()) clone.SetStemVisible(this.GetStemVisible());
    if (this.HasStemX()) clone.SetStemX(this.GetStemX());
    if (this.HasStemY()) clone.SetStemY(this.GetStemY());
    if (this.HasStemWith()) clone.SetStemWith(this.GetStemWith());
    if (this.HasTie()) clone.SetTie(this.GetTie());
    if (this.HasVisible()) clone.SetVisible(this.GetVisible());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('chord', ClassId.CHORD, () => new Chord());
