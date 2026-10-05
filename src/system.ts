/**
 * Pure TypeScript translation of Verovio's `System`
 * (`src-cpp/src/system.cpp` + `src-cpp/include/vrv/system.h`).
 *
 * C++ has `System` inherit `Object` + `DrawingListInterface` + `AttTyped`;
 * TypeScript models the multiple inheritance with composition. The owned
 * `m_drawingScoreDef` (C++ `new`/`delete`) becomes a nullable reference
 * cleared explicitly on reset. The `SystemAligner` (verticalaligner.cpp) is
 * not yet migrated and is consumed through a structural contract; no
 * alignment logic is invented here.
 */
import { STEMDIRECTION_NONE } from './drawinginterface.js';
import { ClassId, FunctorCode, InterfaceId, SpanningType, VRV_UNSET } from './vrvdef.js';
import { ObjectFactory, VrvObject } from './object.js';
import { DrawingListInterface } from './drawinginterface.js';
import { InstTyped } from './atts_shared.js';
import { FindAllBetweenFunctor } from './findfunctor.js';
import { ClassIdComparison, Comparison, Filters, AttNIntegerComparison } from './comparison.js';
import { FindSpannedLayerElementsFunctor, type FindLayerTimeSpanningInterfaceLike } from './findlayerelementsfunctor.js';
import { InitProcessingListsFunctor } from './miscfunctor.js';
import { ConvertToUnCastOffMensuralFunctor } from './convertfunctor.js';
import { ScoreDef } from './scoredef.js';
import { SystemAligner as CanonicalSystemAligner } from './verticalaligner.js';

/** Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS). */
const ATT_TYPED = 224;

/** data_BOOLEAN ordinals (attconverter.ts canonical mapping). */
const BOOLEAN_true = 1;
const BOOLEAN_false = 2;

/** data_CURVEDIR ordinals — NONE is unsettable, above/below from vrvdef.h. */
export const curvature_CURVEDIR_NONE = 0;
export const curvature_CURVEDIR_above = 1;
export const curvature_CURVEDIR_below = 2;

/** data_MEASUREMENTTYPE ordinals (canonical libmei). */
const MEASUREMENTTYPE_vu = 1;
const MEASUREMENTTYPE_px = 2;

/** Structural contract for the not-yet-migrated `SystemAligner`/`StaffAlignment`. */
export interface SystemAlignerLike extends VrvObject {
  GetChildCount(): number;
  GetChildrenForModification(): VrvObject[];
  GetBottomAlignment(): StaffAlignmentLike | null;
  GetStaffAlignmentForStaffN(staffN: number): StaffAlignmentLike | null;
}

export interface StaffAlignmentLike extends VrvObject {
  GetStaff(): unknown;
  SetCurrentFloatingPositioner(object: unknown, objectX: unknown, objectY: unknown, spanningType: number): void;
  GetYRel(): number;
}

/** Structural contract for the not-yet-migrated `Page` selection flags. */
export interface SystemPageLike extends VrvObject {
  IsFirstOfSelection(): boolean;
  IsLastOfSelection(): boolean;
}

/** Structural contract for the `Doc` drawing APIs used here. */
export interface SystemDocLike {
  GetOptions(): { m_spacingSystem: { isSet(): boolean; GetValue(): number } };
  GetDrawingUnit(staffSize: number): number;
  m_drawingPageContentWidth: number;
}

/** Structural contract for control elements reached in AddToDrawingListIfNecessary. */
interface TimeSpanningElementLike {
  GetTimeSpanningInterface?(): { GetEnd(): unknown };
  GetEnd?(): unknown;
  GetExtender?(): number;
  GetLinkingInterface?(): { GetNextLink(): unknown };
}

/** Structural contract for elements with a stemmed drawing interface. */
interface StemmedElementLike extends VrvObject {
  GetStemmedDrawingInterface(): { GetDrawingStemDir(): number };
}

/** Structural contract for a layer element used in stem/curve queries. */
export interface SystemLayerElementLike extends VrvObject {
  GetFirstAncestor(classId: ClassId, maxDepth?: number): VrvObject | null;
  GetDrawingX(): number;
}

/** Structural contract for the `Layer` ancestor. */
export interface SystemLayerLike extends VrvObject {
  GetN(): number;
}

/** Structural contract for the `Slur` time-spanning interface. */
interface SlurInterfaceLike extends FindLayerTimeSpanningInterfaceLike {}

/** Injectable factory so tests can supply a stub aligner until verticalaligner.cpp migrates. */
export interface SystemCollaborators {
  createSystemAligner(): SystemAlignerLike;
}

/**
 * Structural placeholder for the not-yet-migrated `SystemAligner`.
 * It is a plain Object tree node: traversal and child storage work, but every
 * alignment-specific behavior fails explicitly until verticalaligner.cpp is
 * migrated canonically. No alignment algorithm is invented here.
 */
class SystemAlignerPlaceholder extends VrvObject implements SystemAlignerLike {
  public constructor() {
    super(ClassId.SYSTEM_ALIGNER);
    this.Reset();
  }
  public GetChildCount(): number { return this.GetChildrenForModification().length; }
  public GetBottomAlignment(): StaffAlignmentLike | null {
    const last = this.GetLast();
    return last ? (last as unknown as StaffAlignmentLike) : null;
  }
  // C++ looks up the StaffAlignment for a staff @n among the aligner children;
  // the placeholder owns no alignments until verticalaligner.cpp migrates.
  public GetStaffAlignmentForStaffN(_staffN: number): StaffAlignmentLike | null { return null; }
}

export class System extends VrvObject {
  private drawingListInterface: DrawingListInterface | null = null;
  private attTyped: InstTyped | null = null;

  /** The system aligner holding the staff vertical alignments. */
  public m_systemAligner: SystemAlignerLike;

  public m_systemLeftMar = 0;
  public m_systemRightMar = 0;
  public m_drawingFacsX: number = VRV_UNSET;
  public m_drawingFacsY: number = VRV_UNSET;
  public m_drawingAbbrLabelsWidth = 0;
  public m_drawingTotalWidth = 0;
  public m_drawingJustifiableWidth = 0;
  public m_castOffTotalWidth = 0;
  public m_castOffJustifiableWidth = 0;

  protected m_drawingXRel = 0;
  protected m_drawingYRel = 0;

  /** Owned drawing ScoreDef (C++ `new`/`delete`; null when absent). */
  private m_drawingScoreDef: ScoreDef | null = null;
  private m_drawingIsOptimized = false;

  public static collaborators: SystemCollaborators = {
    createSystemAligner: (): SystemAlignerLike => new CanonicalSystemAligner() as unknown as SystemAlignerLike,
  };

  public constructor() {
    super(ClassId.SYSTEM);
    this.attTyped ??= new InstTyped();
    this.RegisterAttClass(ATT_TYPED);

    this.drawingListInterface ??= new DrawingListInterface();

    // We set parent to it because we want to access the parent doc from the aligners
    this.m_systemAligner = System.collaborators.createSystemAligner();
    this.m_systemAligner.SetParent(this);

    this.Reset();
  }

  public override GetClassName(): string { return 'system'; }

  public override Reset(): void {
    super.Reset();
    this.drawingListInterface?.Reset();
    this.attTyped?.ResetTyped();

    this.ResetDrawingScoreDef();

    this.m_systemLeftMar = 0;
    this.m_systemRightMar = 0;
    this.m_drawingFacsX = VRV_UNSET;
    this.m_drawingXRel = 0;
    this.m_drawingFacsY = VRV_UNSET;
    this.m_drawingYRel = 0;
    this.m_drawingTotalWidth = 0;
    this.m_drawingJustifiableWidth = 0;
    this.m_castOffTotalWidth = 0;
    this.m_castOffJustifiableWidth = 0;
    this.m_drawingAbbrLabelsWidth = 0;
    this.m_drawingIsOptimized = false;
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported = [ClassId.DIV, ClassId.MEASURE, ClassId.SCOREDEF];
    if (supported.includes(classId)) return true;
    if (VrvObject.IsSystemElement(classId)) return true;
    if (VrvObject.IsEditorialElement(classId)) return true;
    return false;
  }

  public override GetDrawingX(): number {
    if (this.m_drawingFacsX !== VRV_UNSET) return this.m_drawingFacsX;
    this.m_cachedDrawingX = 0;
    return this.m_drawingXRel;
  }

  public override GetDrawingY(): number {
    if (this.m_drawingFacsY !== VRV_UNSET) return this.m_drawingFacsY;
    this.m_cachedDrawingY = 0;
    return this.m_drawingYRel;
  }

  public GetDrawingXRel(): number { return this.m_drawingXRel; }
  public SetDrawingXRel(drawingXRel: number): void {
    this.ResetCachedDrawingX();
    this.m_drawingXRel = drawingXRel;
  }

  public GetDrawingYRel(): number { return this.m_drawingYRel; }
  public SetDrawingYRel(drawingYRel: number): void {
    this.ResetCachedDrawingY();
    // C++ System::m_drawingYRel is int (system.h:236).
    this.m_drawingYRel = Math.trunc(drawingYRel);
  }

  public GetHeight(): number {
    const bottom = this.m_systemAligner.GetBottomAlignment();
    if (bottom) return -bottom.GetYRel();
    return 0;
  }

  public GetTopVisibleStaff(includeOssia: boolean): VrvObject | null {
    for (const child of this.m_systemAligner.GetChildrenForModification()) {
      const alignment = child as unknown as StaffAlignmentLike;
      const staff = alignment.GetStaff() as VrvObject | null;
      if (!staff) continue;
      if (!(staff as unknown as { IsOssia(): boolean }).IsOssia()) return staff;
      if (!includeOssia) continue;
      // Return the ossia staff only if requested and the ossia in on the first measure
      if (staff.GetFirstAncestor(ClassId.MEASURE) === this.FindDescendantByType(ClassId.MEASURE)) return staff;
    }
    return null;
  }

  public GetMinimumSystemSpacing(doc: SystemDocLike): number {
    const spacingSystem = doc.GetOptions().m_spacingSystem;
    if (!spacingSystem.isSet()) {
      // C++ assert(m_drawingScoreDef) — explicit invariant failure.
      if (!this.m_drawingScoreDef) throw new Error('System::GetMinimumSystemSpacing: drawing scoreDef required');
      if (this.m_drawingScoreDef.HasSpacingSystem()) {
        const spacing = this.m_drawingScoreDef.GetSpacingSystem();
        if (spacing.GetType() === MEASUREMENTTYPE_px) return spacing.GetPx();
        return spacing.GetVu() * doc.GetDrawingUnit(100);
      }
    }
    return spacingSystem.GetValue() * doc.GetDrawingUnit(100);
  }

  public GetDrawingLabelsWidth(): number {
    return this.m_drawingScoreDef ? this.m_drawingScoreDef.GetDrawingLabelsWidth() : 0;
  }

  public SetDrawingLabelsWidth(width: number): void {
    if (!this.m_drawingScoreDef) throw new Error('System::SetDrawingLabelsWidth: drawing scoreDef required');
    this.m_drawingScoreDef.SetDrawingLabelsWidth(width);
  }

  public GetDrawingAbbrLabelsWidth(): number { return this.m_drawingAbbrLabelsWidth; }
  public SetDrawingAbbrLabelsWidth(width: number): void {
    if (this.m_drawingAbbrLabelsWidth < width) this.m_drawingAbbrLabelsWidth = width;
  }
  public ResetDrawingAbbrLabelsWidth(): void { this.m_drawingAbbrLabelsWidth = 0; }

  public GetSystemIdx(): number { return this.GetIdx(); }

  public SetCurrentFloatingPositioner(
    staffN: number,
    object: VrvObject,
    objectX: VrvObject,
    objectY: VrvObject,
    spanningType: SpanningType = SpanningType.SPANNING_START_END,
  ): boolean {
    if (!object) throw new Error('System::SetCurrentFloatingPositioner: object required');

    // If we have only the bottom alignment, then nothing to do (yet)
    if (this.m_systemAligner.GetChildCount() === 1) return false;
    const alignment = this.m_systemAligner.GetStaffAlignmentForStaffN(staffN);
    if (!alignment) {
      // Canonical C++ LogError; kept as console.error for parity with the migrated logging seam.
      console.error(`Staff @n='${staffN}' for rendering control event ${object.GetClassName()} ${object.GetID()} not found`);
      return false;
    }
    alignment.SetCurrentFloatingPositioner(object, objectX, objectY, spanningType);
    return true;
  }

  public GetDrawingScoreDef(): ScoreDef | null { return this.m_drawingScoreDef; }

  public SetDrawingScoreDef(drawingScoreDef: ScoreDef): void {
    if (this.m_drawingScoreDef) throw new Error('System::SetDrawingScoreDef: ResetDrawingScoreDef must be called first.');

    const fresh = new ScoreDef();
    fresh.ReplaceWithCopyOf(drawingScoreDef);
    fresh.SetParent(this);
    this.m_drawingScoreDef = fresh;
  }

  public ResetDrawingScoreDef(): void {
    // C++ deletes the owned object; TypeScript drops the reference (GC owns it).
    this.m_drawingScoreDef = null;
  }

  public HasMixedDrawingStemDir(start: SystemLayerElementLike, end: SystemLayerElementLike): boolean {
    if (!start) throw new Error('System::HasMixedDrawingStemDir: start required');
    if (!end) throw new Error('System::HasMixedDrawingStemDir: end required');

    // It is too inefficient to look for chord and notes over the entire system
    // We need first to get a list of measures
    const measureStart = start.GetFirstAncestor(ClassId.MEASURE);
    if (!measureStart) throw new Error('System::HasMixedDrawingStemDir: measure ancestor required');
    const measureEnd = end.GetFirstAncestor(ClassId.MEASURE);
    if (!measureEnd) throw new Error('System::HasMixedDrawingStemDir: measure ancestor required');
    const measures: VrvObject[] = [];

    // start and end are in the same measure, this is the only one we need
    if (measureStart === measureEnd) {
      measures.push(measureStart);
    }
    // otherwise look for a measures in between
    else {
      const isMeasure = new ClassIdComparison(ClassId.MEASURE);
      const findAllBetween = new FindAllBetweenFunctor(isMeasure as Comparison, measures, measureStart, measureEnd);
      this.Process(findAllBetween as never, 1);
    }

    // Now we can look for chords and note
    const matchType = new ClassIdsAnyComparison([ClassId.CHORD, ClassId.NOTE]);
    const children: VrvObject[] = [];
    for (const measure of measures) {
      const curStart = measure === measureStart ? (start as VrvObject) : measure.GetFirst();
      const curEnd = measure === measureEnd ? (end as VrvObject) : measure.GetLast();
      measure.FindAllDescendantsBetween(children, matchType as Comparison, curStart!, curEnd!, false);
    }

    const layerStart = start.GetFirstAncestor(ClassId.LAYER) as unknown as SystemLayerLike | null;
    if (!layerStart) throw new Error('System::HasMixedDrawingStemDir: layer ancestor required');
    const staffStart = layerStart.GetFirstAncestor(ClassId.STAFF) as unknown as { GetN(): number } | null;
    if (!staffStart) throw new Error('System::HasMixedDrawingStemDir: staff ancestor required');

    let stemDir = STEMDIRECTION_NONE;

    for (const child of children) {
      const layer = child.GetFirstAncestor(ClassId.LAYER) as unknown as SystemLayerLike | null;
      if (!layer) throw new Error('System::HasMixedDrawingStemDir: layer ancestor required');
      const staff = child.GetFirstAncestor(ClassId.STAFF) as unknown as { GetN(): number } | null;
      if (!staff) throw new Error('System::HasMixedDrawingStemDir: staff ancestor required');

      // If the slur is spanning over several measures, the children list will include notes and chords
      // from other staves and layers, so we need to skip them.
      if (staff!.GetN() !== staffStart!.GetN() || layer.GetN() !== layerStart.GetN()) continue;

      const iface = (child as unknown as StemmedElementLike).GetStemmedDrawingInterface();
      if (!iface) throw new Error('System::HasMixedDrawingStemDir: stemmed interface required');

      // First pass
      if (stemDir === STEMDIRECTION_NONE) {
        stemDir = iface.GetDrawingStemDir();
      } else if (stemDir !== iface.GetDrawingStemDir()) {
        return true;
      }
    }

    return false;
  }

  public GetPreferredCurveDirection(
    start: SystemLayerElementLike,
    end: SystemLayerElementLike,
    slur: { GetStart(): unknown; GetEnd(): unknown },
  ): number {
    const findSpannedLayerElements = new FindSpannedLayerElementsFunctor(slur as unknown as SlurInterfaceLike);
    findSpannedLayerElements.SetMinMaxPos(start.GetDrawingX(), end.GetDrawingX());
    findSpannedLayerElements.SetClassIds([ClassId.CHORD, ClassId.NOTE]);

    const layerStart = start.GetFirstAncestor(ClassId.LAYER) as unknown as SystemLayerLike | null;
    if (!layerStart) throw new Error('System::GetPreferredCurveDirection: layer ancestor required');

    (this as unknown as { Process(f: unknown, deepness?: number): void }).Process(findSpannedLayerElements);

    let preferredDirection = curvature_CURVEDIR_NONE;
    for (const element of findSpannedLayerElements.GetElements()) {
      const layer = (element as VrvObject).GetFirstAncestor(ClassId.LAYER) as unknown as SystemLayerLike | null;
      if (!layer) throw new Error('System::GetPreferredCurveDirection: layer ancestor required');
      if (layer === layerStart) continue;

      if (curvature_CURVEDIR_NONE === preferredDirection) {
        if (layer.GetN() > layerStart.GetN()) {
          preferredDirection = curvature_CURVEDIR_above;
        } else {
          preferredDirection = curvature_CURVEDIR_below;
        }
      }
      // if there are layers both above and below - discard previous location and return - we'll use default direction
      else if (
        (curvature_CURVEDIR_above === preferredDirection && layer.GetN() < layerStart.GetN())
        || (curvature_CURVEDIR_below === preferredDirection && layer.GetN() > layerStart.GetN())
      ) {
        preferredDirection = curvature_CURVEDIR_NONE;
        break;
      }
    }

    return preferredDirection;
  }

  public IsDrawingOptimized(): boolean { return this.m_drawingIsOptimized; }
  public SetDrawingOptimized(drawingIsOptimized: boolean): void { this.m_drawingIsOptimized = drawingIsOptimized; }

  public AddToDrawingListIfNecessary(object: VrvObject): void {
    if (!object) throw new Error('System::AddToDrawingListIfNecessary: object required');

    if (!object.HasInterface(InterfaceId.INTERFACE_TIME_SPANNING)) return;

    if (
      object.IsAnyOf([
        ClassId.ANNOTSCORE, ClassId.BEAMSPAN, ClassId.BRACKETSPAN, ClassId.FIGURE, ClassId.GLISS, ClassId.HAIRPIN,
        ClassId.LV, ClassId.OCTAVE, ClassId.PHRASE, ClassId.PITCHINFLECTION, ClassId.SLUR, ClassId.SYL, ClassId.TIE,
      ])
    ) {
      this.AddToDrawingList(object);
    } else if (object.Is(ClassId.DIR)) {
      const dir = object as unknown as TimeSpanningElementLike;
      const nextLink = dir.GetLinkingInterface?.()?.GetNextLink?.();
      if (dir.GetEnd?.() || (nextLink && dir.GetExtender?.() === BOOLEAN_true)) {
        this.AddToDrawingList(object);
      }
    } else if (object.Is(ClassId.DYNAM)) {
      const dynam = object as unknown as TimeSpanningElementLike;
      const dynamEnd = dynam.GetEnd?.() ?? dynam.GetTimeSpanningInterface?.()?.GetEnd();
      const dynamNext = dynam.GetLinkingInterface?.()?.GetNextLink?.();
      if ((dynamEnd || dynamNext) && dynam.GetExtender?.() === BOOLEAN_true) {
        this.AddToDrawingList(object);
      }
    } else if (object.Is(ClassId.PEDAL)) {
      const pedal = object as unknown as TimeSpanningElementLike;
      if (pedal.GetEnd?.() ?? pedal.GetTimeSpanningInterface?.()?.GetEnd()) {
        this.AddToDrawingList(object);
      }
    } else if (object.Is(ClassId.TEMPO)) {
      const tempo = object as unknown as TimeSpanningElementLike;
      const tempoEnd = tempo.GetEnd?.() ?? tempo.GetTimeSpanningInterface?.()?.GetEnd();
      if (tempoEnd && tempo.GetExtender?.() === BOOLEAN_true) {
        this.AddToDrawingList(object);
      }
    } else if (object.Is(ClassId.TRILL)) {
      const trill = object as unknown as TimeSpanningElementLike;
      const trillEnd = trill.GetEnd?.() ?? trill.GetTimeSpanningInterface?.()?.GetEnd();
      if (trillEnd && trill.GetExtender?.() !== BOOLEAN_false) {
        this.AddToDrawingList(object);
      }
    }
  }

  public IsFirstInPage(): boolean {
    if (!this.GetParent()) throw new Error('System::IsFirstInPage: parent required');
    return this.GetParent()!.GetFirst(ClassId.SYSTEM) === (this as VrvObject);
  }

  public IsLastInPage(): boolean {
    if (!this.GetParent()) throw new Error('System::IsLastInPage: parent required');
    return this.GetParent()!.GetLast(ClassId.SYSTEM) === (this as VrvObject);
  }

  public IsFirstOfMdiv(): boolean {
    if (!this.GetParent()) throw new Error('System::IsFirstOfMdiv: parent required');
    const previousSibling = this.GetParent()!.GetPrevious(this as VrvObject);
    return Boolean(previousSibling && previousSibling.IsPageElement());
  }

  public IsLastOfMdiv(): boolean {
    if (!this.GetParent()) throw new Error('System::IsLastOfMdiv: parent required');
    const nextSibling = this.GetParent()!.GetNextOf(this as VrvObject);
    return Boolean(nextSibling && nextSibling.IsPageElement());
  }

  public IsFirstOfSelection(): boolean {
    const page = this.GetFirstAncestor(ClassId.PAGE) as unknown as SystemPageLike | null;
    if (!page) throw new Error('System::IsFirstOfSelection: page ancestor required');
    return page.IsFirstOfSelection() && this.IsFirstInPage();
  }

  public IsLastOfSelection(): boolean {
    const page = this.GetFirstAncestor(ClassId.PAGE) as unknown as SystemPageLike | null;
    if (!page) throw new Error('System::IsLastOfSelection: page ancestor required');
    return page.IsLastOfSelection() && this.IsLastInPage();
  }

  public EstimateJustificationRatio(doc: SystemDocLike): number {
    if (!doc) throw new Error('System::EstimateJustificationRatio: doc required');

    // We can only estimate if cast off system widths are available
    if (this.m_castOffTotalWidth === 0 || this.m_castOffJustifiableWidth === 0) {
      return 1.0;
    }

    const nonJustifiableWidth
      = this.m_systemLeftMar + this.m_systemRightMar + this.m_castOffTotalWidth - this.m_castOffJustifiableWidth;
    let estimatedRatio = (doc.m_drawingPageContentWidth - nonJustifiableWidth) / this.m_castOffJustifiableWidth;

    // Apply dampening and bound compression
    estimatedRatio *= 0.95;
    estimatedRatio = Math.max(estimatedRatio, 0.8);

    return estimatedRatio;
  }

  public ConvertToUnCastOffMensuralSystem(): void {
    // Canonical C++ System::ConvertToUnCastOffMensuralSystem (system.cpp 446-478).
    const initProcessingLists = new InitProcessingListsFunctor();
    this.Process(initProcessingLists);
    const layerTree = initProcessingLists.GetLayerTree();

    // Checking just in case.
    if (layerTree.child.size === 0) return;

    const filters = new Filters();
    const convertToUnCastOffMensural = new ConvertToUnCastOffMensuralFunctor();
    convertToUnCastOffMensural.SetFilters(filters as unknown as never);

    // Now we can process by layer and move their content to (measure) segments.
    for (const [staffN, staves] of layerTree.child) {
      for (const [layerN] of staves.child) {
        // Create ad comparison object for each type / @n.
        const matchStaff = new AttNIntegerComparison(ClassId.STAFF, staffN);
        const matchLayer = new AttNIntegerComparison(ClassId.LAYER, layerN);
        filters.Clear();
        filters.Add(matchStaff as unknown as never);
        filters.Add(matchLayer as unknown as never);

        convertToUnCastOffMensural.ResetContent();
        this.Process(convertToUnCastOffMensural as unknown as never);
        convertToUnCastOffMensural.TrackSegmentsToDelete(false);
      }
    }

    // Detach the contentPage.
    for (const measure of convertToUnCastOffMensural.GetSegmentsToDelete()) {
      this.DeleteChild(measure);
    }
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitSystem', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitSystemEnd', this); }
  public AcceptConst(functor: unknown): FunctorCode { return visitor(functor, 'VisitSystem', this); }
  public AcceptEndConst(functor: unknown): FunctorCode { return visitor(functor, 'VisitSystemEnd', this); }

  //---------------//
  // MEI attribute //
  //---------------//

  // AttTyped
  public SetType(v: string): void { this.attTyped ??= new InstTyped(); this.attTyped.SetType(v); }
  public GetType(): string { return this.attTyped?.GetType() ?? ''; }
  public HasType(): boolean { return this.attTyped?.HasType() ?? false; }
  public ResetTyped(): void { this.attTyped?.ResetTyped(); }

  // DrawingListInterface forwarding (C++ multiple-inheritance surface).
  public AddToDrawingList(element: VrvObject): void { this.drawingListInterface ??= new DrawingListInterface(); this.drawingListInterface.AddToDrawingList(element); }
  public GetDrawingList(): VrvObject[] { this.drawingListInterface ??= new DrawingListInterface(); return this.drawingListInterface.GetDrawingList(); }
  public ResetDrawingList(): void { this.drawingListInterface?.ResetDrawingList(); }

  private ensureComponents(): void {
    this.attTyped ??= new InstTyped();
    this.drawingListInterface ??= new DrawingListInterface();
  }
}

/** ClassIds comparison for the HasMixedDrawingStemDir CHORD/NOTE match (comparison.h parity). */
class ClassIdsAnyComparison extends Comparison {
  private readonly ids: number[];
  public constructor(ids: number[]) {
    super(() => true);
    this.ids = ids;
  }
  // evaluateComparison dispatches via matches(), not call(); overriding call
  // left the base () => true predicate, matching every object.
  public override matches(object: VrvObject): boolean {
    return this.ids.some((id) => object.Is(id));
  }
}

/** C++ FunctorInterface default forwarding helper (VisitSystem -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('system', ClassId.SYSTEM, () => new System());
