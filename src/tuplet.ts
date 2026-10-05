/**
 * Pure TypeScript translation of Verovio's `src/tuplet.cpp` /
 * `include/vrv/tuplet.h`.
 *
 * `Tuplet` models the MEI `<tuplet>` element.
 *
 * C++ multiple inheritance (LayerElement + ObjectListInterface + AttColor +
 * AttDurationRatio + AttNumberPlacement + AttTupletVis) is represented
 * through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode, InterfaceId } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, ObjectListInterface, VrvObject } from './object.js';
import { InstColor, InstDurationRatio } from './atts_shared.js';
import { InstNumberPlacement } from './atts_cmn.js';
import { InstTupletVis } from './atts_visual.js';
import { STAFFREL_basic_NONE, STAFFREL_basic_above, STAFFREL_basic_below } from './drawinginterface.js';
import { ClassIdsComparison } from './comparison.js';
import { LogError } from './vrv.js';

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_COLOR = 109;
const ATT_DURATIONRATIO = 128;
const ATT_NUMBERPLACEMENT = 28;
const ATT_TUPLETVIS = 286;

/** Helper enum from `tuplet.h` (C++ `enum class MelodicDirection`). */
export enum MelodicDirection {
  None = 0,
  Up = 1,
  Down = 2,
}

/** Structural contract for a `Note` (until `src/note.ts` is migrated). */
export interface TupletNoteLike {
  GetDiatonicPitch(): number;
  GetDrawingStemDir(): number;
  IsChordTone(): boolean;
}

/** Structural contract for a `Chord` (until `src/chord.ts` is migrated). */
export interface TupletChordLike {
  GetTopNote(): TupletNoteLike | null;
  GetDrawingStemDir(): number;
  GetXMin(): number;
  GetXMax(): number;
  GetDrawingX(): number;
  GetDrawingRadius(doc?: unknown): number;
}

/** Structural contract for a `Beam` aligned with the tuplet bracket/num. */
export interface TupletBeamLike {
  m_drawingPlace: number;
}

/** Structural contract for a `Staff` used by cross-staff checks. */
export interface TupletStaffLike {
  GetN(): number;
}

/** Structural contract for a `Layer` cross-staff reference. */
export interface TupletLayerLike { }

/** Structural contract for `FloatingCurvePositioner` inner slurs. */
export interface TupletCurvePositionerLike { }

/** ObjectListInterface composition keeping duration-interface layer elements. */
class TupletListInterface extends ObjectListInterface {
  protected override FilterList(childList: VrvObject[]): void {
    // We want to keep only notes and rests
    // Eventually, we also need to filter out grace notes properly (e.g., with sub-beams)
    for (let i = 0; i < childList.length;) {
      if (!childList[i].IsLayerElement() || !childList[i].HasInterface(InterfaceId.INTERFACE_DURATION)) {
        childList.splice(i, 1);
      }
      else {
        ++i;
      }
    }
  }
}

/**
 * Pure TypeScript translation of Verovio's `Tuplet`.
 */
export class Tuplet extends LayerElement {
  private readonly objectList: TupletListInterface;

  private color?: InstColor;
  private durationRatio?: InstDurationRatio;
  private numberPlacement?: InstNumberPlacement;
  private tupletVis?: InstTupletVis;

  /** The first Chord / Note / Rest in the tuplet. */
  private m_drawingLeft: LayerElement | null = null;
  /** The last Chord / Note / Rest in the tuplet. */
  private m_drawingRight: LayerElement | null = null;
  /** The calculated drawing position of the bracket. */
  private m_drawingBracketPos: number = STAFFREL_basic_NONE;
  /** The calculated drawing position of the num. */
  private m_drawingNumPos: number = STAFFREL_basic_NONE;
  /** The beam with which the bracket aligns (if any). */
  private m_bracketAlignedBeam: TupletBeamLike | null = null;
  /** The beam with which the num aligns (if any). */
  private m_numAlignedBeam: TupletBeamLike | null = null;
  /** The slurs avoided by the tuplet, set during drawing (C++ std::set). */
  private readonly m_innerSlurs: Set<TupletCurvePositionerLike> = new Set();

  public constructor() {
    super(ClassId.TUPLET);
    this.objectList = new TupletListInterface();
    this.objectList.SetInterfaceOwner(this as unknown as VrvObject);
    this.ensureAttributes();
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_DURATIONRATIO);
    this.RegisterAttClass(ATT_NUMBERPLACEMENT);
    this.RegisterAttClass(ATT_TUPLETVIS);
    this.Reset();
  }

  private ensureAttributes(): void {
    this.color ??= new InstColor();
    this.durationRatio ??= new InstDurationRatio();
    this.numberPlacement ??= new InstNumberPlacement();
    this.tupletVis ??= new InstTupletVis();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.color!.ResetColor();
    this.durationRatio!.ResetDurationRatio();
    this.numberPlacement!.ResetNumberPlacement();
    this.tupletVis!.ResetTupletVis();

    this.m_drawingLeft = null;
    this.m_drawingRight = null;
    this.m_drawingBracketPos = STAFFREL_basic_NONE;
    // Note: the C++ Reset() does not clear m_drawingNumPos; it is set in
    // CalcDrawingBracketAndNumPos before use. Preserve that behavior.
    this.m_bracketAlignedBeam = null;
    this.m_numAlignedBeam = null;
  }

  public override Clone(): VrvObject {
    const clone = new Tuplet();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all members (composition adaptation:
    // AssignFrom covers only the object-tree state). Drawing pointers are
    // reset by the Tuplet copy constructor? No - the C++ copy constructor
    // copies the private pointer members as-is; preserve that.
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasNum()) clone.SetNum(this.GetNum());
    if (this.HasNumbase()) clone.SetNumbase(this.GetNumbase());
    if (this.HasNumPlace()) clone.SetNumPlace(this.GetNumPlace());
    if (this.HasNumVisible()) clone.SetNumVisible(this.GetNumVisible());
    if (this.HasBracketPlace()) clone.SetBracketPlace(this.GetBracketPlace());
    if (this.HasBracketVisible()) clone.SetBracketVisible(this.GetBracketVisible());
    if (this.HasNumFormat()) clone.SetNumFormat(this.GetNumFormat());
    clone.SetDrawingLeft(this.GetDrawingLeft());
    clone.SetDrawingRight(this.GetDrawingRight());
    clone.SetDrawingBracketPos(this.GetDrawingBracketPos());
    clone.SetDrawingNumPos(this.GetDrawingNumPos());
    clone.SetBracketAlignedBeam(this.GetBracketAlignedBeam());
    clone.SetNumAlignedBeam(this.GetNumAlignedBeam());
    for (const slur of this.m_innerSlurs) clone.AddInnerSlur(slur);
    return clone;
  }

  public override GetClassName(): string { return 'tuplet'; }

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [ClassId.BEAM, ClassId.TUPLET_BRACKET, ClassId.BTREM, ClassId.CHORD,
      ClassId.CLEF, ClassId.FTREM, ClassId.NOTE, ClassId.TUPLET_NUM, ClassId.REST, ClassId.SPACE,
      ClassId.TABGRP, ClassId.TUPLET];

    if (supported.includes(classId)) {
      return true;
    }
    else if (VrvObject.IsEditorialElement(classId)) {
      return true;
    }
    else {
      return false;
    }
  }

  public override AddChild(child: VrvObject): boolean {
    if (!this.IsSupportedChild(child.GetClassId()) || !this.AddChildAdditionalCheck(child)) {
      LogError("Adding '%s' to a '%s'", child.GetClassName(), this.GetClassName());
      return false;
    }

    child.SetParent(this as unknown as VrvObject);

    const children = this.GetChildrenForModification();

    // Num and bracket are always added by PrepareLayerElementParts (for now)
    // and we want them to be in the front for the drawing order in the SVG output
    if (child.IsAnyOf([ClassId.TUPLET_BRACKET, ClassId.TUPLET_NUM] as unknown as number[])) {
      children.unshift(child);
    }
    else {
      children.push(child);
    }

    this.Modify();

    return true;
  }

  public GetDrawingLeft(): LayerElement | null { return this.m_drawingLeft; }
  public SetDrawingLeft(drawingLeft: LayerElement | null): void { this.m_drawingLeft = drawingLeft; }
  public GetDrawingRight(): LayerElement | null { return this.m_drawingRight; }
  public SetDrawingRight(drawingRight: LayerElement | null): void { this.m_drawingRight = drawingRight; }
  public GetDrawingBracketPos(): number { return this.m_drawingBracketPos; }
  public SetDrawingBracketPos(bracketPos: number): void { this.m_drawingBracketPos = bracketPos; }
  public GetDrawingNumPos(): number { return this.m_drawingNumPos; }
  public SetDrawingNumPos(numPos: number): void { this.m_drawingNumPos = numPos; }

  public GetBracketAlignedBeam(): TupletBeamLike | null { return this.m_bracketAlignedBeam; }
  public SetBracketAlignedBeam(alignedBeam: TupletBeamLike | null): void { this.m_bracketAlignedBeam = alignedBeam; }
  public GetNumAlignedBeam(): TupletBeamLike | null { return this.m_numAlignedBeam; }
  public SetNumAlignedBeam(alignedBeam: TupletBeamLike | null): void { this.m_numAlignedBeam = alignedBeam; }

  public GetInnerSlurs(): Set<TupletCurvePositionerLike> { return this.m_innerSlurs; }
  public AddInnerSlur(slur: TupletCurvePositionerLike): void { this.m_innerSlurs.add(slur); }
  public ResetInnerSlurs(): void { this.m_innerSlurs.clear(); }

  /** Determine the melodic direction. */
  public GetMelodicDirection(): MelodicDirection {
    const leftElement = this.GetDrawingLeft() as unknown as (TupletNoteLike & TupletChordLike & { Is(classId: number): boolean }) | null;
    let leftNote: TupletNoteLike | null = null;
    if (leftElement && leftElement.Is(ClassId.NOTE)) leftNote = leftElement as unknown as TupletNoteLike;
    if (leftElement && leftElement.Is(ClassId.CHORD)) {
      leftNote = (leftElement as unknown as TupletChordLike).GetTopNote();
    }

    const rightElement = this.GetDrawingRight() as unknown as (TupletNoteLike & TupletChordLike & { Is(classId: number): boolean }) | null;
    let rightNote: TupletNoteLike | null = null;
    if (rightElement && rightElement.Is(ClassId.NOTE)) rightNote = rightElement as unknown as TupletNoteLike;
    if (rightElement && rightElement.Is(ClassId.CHORD)) {
      rightNote = (rightElement as unknown as TupletChordLike).GetTopNote();
    }

    if (leftNote && rightNote) {
      const leftPitch = leftNote.GetDiatonicPitch();
      const rightPitch = rightNote.GetDiatonicPitch();
      if (leftPitch < rightPitch) return MelodicDirection.Up;
      if (leftPitch > rightPitch) return MelodicDirection.Down;
    }
    return MelodicDirection.None;
  }

  /**
   * Calculate the position of the bracket and the num looking at the stem
   * direction or at the encoded values (if any).
   */
  public CalcDrawingBracketAndNumPos(tupletNumHead: boolean): void {
    this.m_drawingBracketPos = STAFFREL_basic_NONE;

    if (this.HasBracketPlace()) {
      this.m_drawingBracketPos = this.GetBracketPlace();
    }

    if (this.HasNumPlace()) {
      this.m_drawingNumPos = this.GetNumPlace();
    }
    else {
      this.m_drawingNumPos = this.m_drawingBracketPos;
    }

    // if both are given we are all good (num is set in any case if bracket is)
    if (this.m_drawingBracketPos !== STAFFREL_basic_NONE) {
      return;
    }

    const tupletChildren = this.GetList();

    // There are unbeamed notes of two different beams
    // treat all the notes as unbeamed
    let ups = 0, downs = 0; // quantity of up- and down-stems

    // The first step is to calculate all the stem directions
    // cycle into the elements and count the up and down dirs
    for (const child of tupletChildren) {
      const current = child as unknown as TupletNoteLike & TupletChordLike & { Is(classId: number): boolean };
      if (current.Is(ClassId.CHORD)) {
        if (current.GetDrawingStemDir() === 1 /* STEMDIRECTION_up */) {
          ++ups;
        }
        else {
          ++downs;
        }
      }
      else if (current.Is(ClassId.NOTE)) {
        if (!current.IsChordTone() && (current.GetDrawingStemDir() === 1 /* STEMDIRECTION_up */)) {
          ++ups;
        }
        if (!current.IsChordTone() && (current.GetDrawingStemDir() === 2 /* STEMDIRECTION_down */)) {
          ++downs;
        }
      }
    }
    // true means up
    this.m_drawingBracketPos = ups > downs ? STAFFREL_basic_above : STAFFREL_basic_below;

    if (tupletNumHead) {
      this.m_drawingBracketPos
        = (this.m_drawingBracketPos === STAFFREL_basic_below) ? STAFFREL_basic_above : STAFFREL_basic_below;
    }

    // also use it for the num unless it is already set
    if (this.m_drawingNumPos === STAFFREL_basic_NONE) {
      this.m_drawingNumPos = this.m_drawingBracketPos;
    }
  }

  /**
   * Return the maximum and minimum X positions of the notes in the tuplets.
   * Look at flipped noteheads in chords.
   */
  public GetDrawingLeftRightXRel(xRelLeftRef: { value: number }, xRelRightRef: { value: number }, doc: unknown): void {
    if (!this.m_drawingLeft) throw new Error('Tuplet::GetDrawingLeftRightXRel: m_drawingLeft is null');
    if (!this.m_drawingRight) throw new Error('Tuplet::GetDrawingLeftRightXRel: m_drawingRight is null');

    let xRelLeft = 0;

    const left = this.m_drawingLeft as unknown as TupletChordLike & { Is(classId: number): boolean };
    if (left.Is(ClassId.NOTE)) {
      //
    }
    else if (left.Is(ClassId.REST)) {
      //
    }
    else if (left.Is(ClassId.CHORD)) {
      xRelLeft = (left as unknown as TupletChordLike).GetXMin() - this.m_drawingLeft.GetDrawingX();
    }
    xRelLeftRef.value = xRelLeft;

    let xRelRight = 0;

    const right = this.m_drawingRight as unknown as (TupletChordLike & { Is(classId: number): boolean; GetSelfX2(): number; GetDrawingRadius(doc?: unknown): number });
    if (right.Is(ClassId.NOTE)) {
      xRelRight += (2 * right.GetDrawingRadius(doc));
    }
    else if (right.Is(ClassId.REST)) {
      xRelRight += right.GetSelfX2();
    }
    else if (right.Is(ClassId.CHORD)) {
      xRelRight = right.GetXMax() - right.GetDrawingX() + (2 * right.GetDrawingRadius(doc));
    }
    xRelRightRef.value = xRelRight;
  }

  /**
   * Calculate corresponding cross-staff for the tuplet number if necessary.
   */
  public CalculateTupletNumCrossStaff(layerElement: LayerElement): void {
    // If tuplet is fully cross-staff, just return it - it's enough
    if (this.m_crossStaff) {
      layerElement.m_crossStaff = this.m_crossStaff;
      layerElement.m_crossLayer = this.m_crossLayer;
      return;
    }

    const staff = this.GetAncestorStaff();
    // Find if there is a mix of cross-staff and non-cross-staff elements in the tuplet
    const descendants: VrvObject[] = [];
    this.FindAllDescendantsByComparison(
      descendants,
      new ClassIdsComparison([ClassId.CHORD, ClassId.NOTE, ClassId.REST]),
    );

    let crossStaff: NonNullable<LayerElement['m_crossStaff']> | null = null;
    let crossLayer: LayerElement['m_crossLayer'] | null = null;
    let crossStaffCount = 0;
    for (const object of descendants) {
      const durElement = object as unknown as LayerElement;
      if (crossStaff && durElement.m_crossStaff && (durElement.m_crossStaff !== crossStaff)) {
        crossStaff = null;
        // We can stop here
        break;
      }
      else if (durElement.m_crossStaff) {
        ++crossStaffCount;
        crossStaff = durElement.m_crossStaff;
        crossLayer = durElement.m_crossLayer;
      }
    }
    if (!crossStaff) return;

    // In case if most elements of the tuplet are cross-staff we need to make sure there for proper positioning of the
    // tuplet number - otherwise tuplet number can end up with extreme adjustments
    const descendantCount = descendants.length;
    const isMostlyCrossStaff = crossStaff && (crossStaffCount > descendantCount / 2);
    if ((isMostlyCrossStaff && this.HasValidTupletNumPosition(crossStaff as unknown as TupletStaffLike, staff as unknown as TupletStaffLike))
      || (!isMostlyCrossStaff && !this.HasValidTupletNumPosition(staff as unknown as TupletStaffLike, crossStaff as unknown as TupletStaffLike))) {
      layerElement.m_crossStaff = crossStaff;
      layerElement.m_crossLayer = crossLayer;
    }
  }

  /** Check whether tuplet number has valid positioning staffwise. */
  public HasValidTupletNumPosition(preferredStaff: TupletStaffLike, otherStaff: TupletStaffLike): boolean {
    const beam = this.GetNumAlignedBeam();
    if (!beam) return true;
    if (beam.m_drawingPlace === 3 /* BEAMPLACE_mixed */) return false;

    if (preferredStaff.GetN() < otherStaff.GetN()) {
      if ((beam.m_drawingPlace === 2 /* BEAMPLACE_below */) && (this.m_drawingNumPos === STAFFREL_basic_below)) return false;
    }
    else {
      if ((beam.m_drawingPlace === 1 /* BEAMPLACE_above */) && (this.m_drawingNumPos === STAFFREL_basic_above)) return false;
    }

    return true;
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitTuplet');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitTupletEnd');
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
  // ObjectListInterface facade
  //---------//
  public GetList(): VrvObject[] { return this.objectList.GetList(); }
  public HasEmptyList(): boolean { return this.objectList.HasEmptyList(); }
  public GetListSize(): number { return this.objectList.GetListSize(); }
  public GetListFront(): VrvObject { return this.objectList.GetListFront(); }
  public GetListBack(): VrvObject { return this.objectList.GetListBack(); }
  public GetListIndex(element: VrvObject): number { return this.objectList.GetListIndex(element); }

  //---------//
  // AttColor forwarding surface
  //---------//
  public ResetColor(): void { this.color!.ResetColor(); }
  public SetColor(value: string): void { this.color!.SetColor(value); }
  public GetColor(): string { return this.color!.GetColor(); }
  public HasColor(): boolean { return this.color!.GetColor() !== ''; }

  //---------//
  // AttDurationRatio forwarding surface
  //---------//
  public ResetDurationRatio(): void { this.durationRatio!.ResetDurationRatio(); }
  public SetNum(value: number): void { this.durationRatio!.SetNum(value); }
  public GetNum(): number { return this.durationRatio!.GetNum(); }
  public HasNum(): boolean { return this.durationRatio!.HasNum(); }
  public SetNumbase(value: number): void { this.durationRatio!.SetNumbase(value); }
  public GetNumbase(): number { return this.durationRatio!.GetNumbase(); }
  public HasNumbase(): boolean { return this.durationRatio!.HasNumbase(); }

  //---------//
  // AttNumberPlacement forwarding surface
  //---------//
  public ResetNumberPlacement(): void { this.numberPlacement!.ResetNumberPlacement(); }
  public SetNumPlace(value: number): void { this.numberPlacement!.SetNumPlace(value); }
  public GetNumPlace(): number { return this.numberPlacement!.GetNumPlace(); }
  public HasNumPlace(): boolean { return this.numberPlacement!.HasNumPlace(); }
  public SetNumVisible(value: number): void { this.numberPlacement!.SetNumVisible(value); }
  public GetNumVisible(): number { return this.numberPlacement!.GetNumVisible(); }
  public HasNumVisible(): boolean { return this.numberPlacement!.HasNumVisible(); }

  //---------//
  // AttTupletVis forwarding surface
  //---------//
  public ResetTupletVis(): void { this.tupletVis!.ResetTupletVis(); }
  public SetBracketPlace(value: number): void { this.tupletVis!.SetBracketPlace(value); }
  public GetBracketPlace(): number { return this.tupletVis!.GetBracketPlace(); }
  public HasBracketPlace(): boolean { return this.tupletVis!.HasBracketPlace(); }
  public SetBracketVisible(value: number): void { this.tupletVis!.SetBracketVisible(value); }
  public GetBracketVisible(): number { return this.tupletVis!.GetBracketVisible(); }
  public HasBracketVisible(): boolean { return this.tupletVis!.HasBracketVisible(); }
  public SetNumFormat(value: number): void { this.tupletVis!.SetNumFormat(value); }
  public GetNumFormat(): number { return this.tupletVis!.GetNumFormat(); }
  public HasNumFormat(): boolean { return this.tupletVis!.HasNumFormat(); }
}

// Factory registration (C++ `ClassRegistrar<Tuplet> s_factory("tuplet", TUPLET)`).
ObjectFactory.GetInstance().Register('tuplet', ClassId.TUPLET, () => new Tuplet());
