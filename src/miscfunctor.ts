/**
 * miscfunctor.ts — canonical translation of src-cpp/src/miscfunctor.cpp
 * + src-cpp/include/vrv/miscfunctor.h.
 *
 * Four functors:
 *  - ApplyPPUFactorFunctor: scale facsimile/page/system coordinates by the
 *    page PPU factor (C++ `assert(m_page)` invariants are explicit errors).
 *  - GetAlignmentLeftRightFunctor: collect min self-left / max self-right
 *    over layer elements with non-empty self BB, honoring exclusions.
 *  - InitProcessingListsFunctor: build staff/layer and
 *    staff/layer/verse/volta-track IntTrees from lyric elements, assigning
 *    drawing verse numbers, lyric group numbers, volta track numbers and
 *    direct-syl tracks exactly as C++.
 *  - ReorderByXPosFunctor: stable-sort children by ULX (`Object::sortByUlx`)
 *    unless the object already carries `@facs`.
 *
 * All implement `ImplementsEndInterface() == false` per the C++ header.
 */

import { Functor, ConstFunctor } from './functor.js';
import { FunctorCode, ClassId, VRV_UNSET } from './vrvdef.js';
import type { IntTree } from './vrvdef.js';
import { STAFFREL_above, STAFFREL_below } from './vrvdef.js';

//----------------------------------------------------------------------------
// Structural boundaries
//----------------------------------------------------------------------------

/** Page PPU + geometry mutated by ApplyPPUFactorFunctor. */
export interface MiscPageLike {
  GetPPUFactor(): number;
  m_pageWidth: number;
  m_pageHeight: number;
  m_pageMarginBottom: number;
  m_pageMarginLeft: number;
  m_pageMarginRight: number;
  m_pageMarginTop: number;
}

/** LayerElement facsimile drawing coordinates. */
export interface MiscLayerElementLike {
  IsScoreDefElement(): boolean;
  m_drawingFacsX: number;
  m_drawingFacsY: number;
}

/** Measure facsimile span. */
export interface MiscMeasureLike {
  m_drawingFacsX1: number;
  m_drawingFacsX2: number;
}

/** Staff facsimile Y. */
export interface MiscStaffLike {
  m_drawingFacsY: number;
}

/** Surface / Zone coordinate surface. */
export interface MiscCoordinatedLike {
  HasUlx(): boolean; GetUlx(): number; SetUlx(value: number): void;
  HasUly(): boolean; GetUly(): number; SetUly(value: number): void;
  HasLrx(): boolean; GetLrx(): number; SetLrx(value: number): void;
  HasLry(): boolean; GetLry(): number; SetLry(value: number): void;
}

/** System facsimile + margins. */
export interface MiscSystemLike {
  m_drawingFacsX: number;
  m_drawingFacsY: number;
  m_systemLeftMar: number;
  m_systemRightMar: number;
}

/** Layer/staff identity for processing-list trees. */
export interface MiscLayerLike {
  GetN(): number;
  GetFirstAncestor(classId: number): unknown;
}

export interface MiscStaffIdLike {
  GetN(): number;
}

export interface MiscLyricElementLike {
  Is(classId: number): boolean;
  GetPlace(): number;
  GetAncestorStaff(): MiscStaffIdLike & { GetN(): number };
  GetFirstAncestor(classId: number): unknown;
  GetParent(): { GetChildren(): Array<{ Is(classId: number): boolean }> } | null;
  HasDirectSyl(): boolean;
  GetLyricLineCount(): number;
  SetDrawingVerseN(value: number): void;
  SetDrawingLyricGroupN(value: number): void;
  SetDrawingDirectSylTrack(): void;
  FindAllDescendantsByType(classId: number): unknown[];
  GetN?(): number;
}

export interface MiscVoltaLike {
  HasDrawingVoltaN(): boolean;
  GetDrawingVoltaN(): number;
  SetDrawingVoltaN(value: number): void;
  HasN(): boolean;
  GetN(): string;
}

/** Object surface for ReorderByXPosFunctor. */
export interface MiscReorderObjectLike {
  GetFacsimileInterface(): { HasFacs(): boolean } | null;
  GetChildrenForModification(): unknown[];
  Modify(): void;
}

//----------------------------------------------------------------------------
// ApplyPPUFactorFunctor
//----------------------------------------------------------------------------

export class ApplyPPUFactorFunctor extends Functor {
  private m_page: MiscPageLike | null;

  public constructor(page: MiscPageLike | null = null) {
    super();
    this.m_page = page;
  }

  public override ImplementsEndInterface(): boolean { return false; }

  private requirePage(caller: string): MiscPageLike {
    if (!this.m_page) throw new Error(`ApplyPPUFactorFunctor::${caller}: page required`);
    return this.m_page;
  }

  public VisitLayerElement(layerElement: MiscLayerElementLike): FunctorCode {
    const page = this.requirePage('VisitLayerElement');

    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    if (layerElement.m_drawingFacsX !== VRV_UNSET) layerElement.m_drawingFacsX /= page.GetPPUFactor();
    if (layerElement.m_drawingFacsY !== VRV_UNSET) layerElement.m_drawingFacsY /= page.GetPPUFactor();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: MiscMeasureLike): FunctorCode {
    const page = this.requirePage('VisitMeasure');

    if (measure.m_drawingFacsX1 !== VRV_UNSET) measure.m_drawingFacsX1 /= page.GetPPUFactor();
    if (measure.m_drawingFacsX2 !== VRV_UNSET) measure.m_drawingFacsX2 /= page.GetPPUFactor();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPage(page: MiscPageLike): FunctorCode {
    this.m_page = page;
    page.m_pageWidth /= page.GetPPUFactor();
    page.m_pageHeight /= page.GetPPUFactor();
    page.m_pageMarginBottom /= page.GetPPUFactor();
    page.m_pageMarginLeft /= page.GetPPUFactor();
    page.m_pageMarginRight /= page.GetPPUFactor();
    page.m_pageMarginTop /= page.GetPPUFactor();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: MiscStaffLike): FunctorCode {
    const page = this.requirePage('VisitStaff');

    if (staff.m_drawingFacsY !== VRV_UNSET) staff.m_drawingFacsY /= page.GetPPUFactor();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSurface(surface: MiscCoordinatedLike): FunctorCode {
    const page = this.requirePage('VisitSurface');

    if (surface.HasUlx()) surface.SetUlx(surface.GetUlx() * page.GetPPUFactor());
    if (surface.HasUly()) surface.SetUly(surface.GetUly() * page.GetPPUFactor());
    if (surface.HasLrx()) surface.SetLrx(surface.GetLrx() * page.GetPPUFactor());
    if (surface.HasLry()) surface.SetLry(surface.GetLry() * page.GetPPUFactor());

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: MiscSystemLike): FunctorCode {
    const page = this.requirePage('VisitSystem');

    if (system.m_drawingFacsX !== VRV_UNSET) system.m_drawingFacsX /= page.GetPPUFactor();
    if (system.m_drawingFacsY !== VRV_UNSET) system.m_drawingFacsY /= page.GetPPUFactor();
    system.m_systemLeftMar *= page.GetPPUFactor();
    system.m_systemRightMar *= page.GetPPUFactor();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitZone(zone: MiscCoordinatedLike): FunctorCode {
    const page = this.requirePage('VisitZone');

    if (zone.HasUlx()) zone.SetUlx(zone.GetUlx() * page.GetPPUFactor());
    if (zone.HasUly()) zone.SetUly(zone.GetUly() * page.GetPPUFactor());
    if (zone.HasLrx()) zone.SetLrx(zone.GetLrx() * page.GetPPUFactor());
    if (zone.HasLry()) zone.SetLry(zone.GetLry() * page.GetPPUFactor());

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// GetAlignmentLeftRightFunctor
//----------------------------------------------------------------------------

export interface LeftRightObjectLike {
  IsLayerElement(): boolean;
  HasSelfBB(): boolean;
  HasEmptyBB(): boolean;
  IsAnyOf(classIds: Iterable<number>): boolean;
  GetSelfLeft(): number;
  GetSelfRight(): number;
}

export class GetAlignmentLeftRightFunctor extends ConstFunctor {
  private m_minLeft = -VRV_UNSET;
  private m_maxRight = VRV_UNSET;
  private m_excludeClasses: number[] = [];

  public constructor() {
    super();
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public ExcludeClasses(excludeClasses: number[]): void { this.m_excludeClasses = [...excludeClasses]; }

  public GetMinLeft(): number { return this.m_minLeft; }
  public GetMaxRight(): number { return this.m_maxRight; }

  public VisitObject(object: LeftRightObjectLike): FunctorCode {
    if (!object.IsLayerElement()) return FunctorCode.FUNCTOR_CONTINUE;

    if (!object.HasSelfBB() || object.HasEmptyBB()) return FunctorCode.FUNCTOR_CONTINUE;

    if (object.IsAnyOf(this.m_excludeClasses)) return FunctorCode.FUNCTOR_CONTINUE;

    this.m_minLeft = Math.min(this.m_minLeft, object.GetSelfLeft());
    this.m_maxRight = Math.max(this.m_maxRight, object.GetSelfRight());

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// InitProcessingListsFunctor
//----------------------------------------------------------------------------

function makeIntTree(): IntTree {
  return { child: new Map<number, IntTree>() };
}

function getRefrainPosition(lyricElement: MiscLyricElementLike): number {
  let position = 1;
  const parent = lyricElement.GetParent();
  if (!parent) throw new Error('GetRefrainPosition: parent required');
  for (const child of parent.GetChildren()) {
    if (child === (lyricElement as unknown)) break;
    if (child.Is(ClassId.REFRAIN)) ++position;
  }
  return position;
}

function getLyricPlace(lyricElement: MiscLyricElementLike): number {
  return lyricElement.GetPlace() === STAFFREL_above ? STAFFREL_above : STAFFREL_below;
}

export class InitProcessingListsFunctor extends ConstFunctor {
  private m_layerTree: IntTree = makeIntTree();
  private m_verseTree: IntTree = makeIntTree();
  private m_lyricElements: MiscLyricElementLike[] = [];
  private m_lyricElementTracksPrepared = false;
  private m_voltaTracks = new Map<string, number>();
  private m_nextVoltaTrack = new Map<string, number>();
  private m_lyricElementGroups = new Map<string, MiscLyricElementLike[]>();
  private m_directSylTrackGroups = new Set<string>();

  public constructor() {
    super();
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public GetLayerTree(): IntTree {
    this.PrepareLyricElementTracks();
    return this.m_layerTree;
  }

  public GetVerseTree(): IntTree {
    this.PrepareLyricElementTracks();
    return this.m_verseTree;
  }

  public VisitLayer(layer: MiscLayerLike): FunctorCode {
    const staff = layer.GetFirstAncestor(ClassId.STAFF) as MiscStaffIdLike | null;
    if (!staff) throw new Error('InitProcessingListsFunctor::VisitLayer: staff ancestor required');
    let staffNode = this.m_layerTree.child.get(staff.GetN());
    if (!staffNode) {
      staffNode = makeIntTree();
      this.m_layerTree.child.set(staff.GetN(), staffNode);
    }
    if (!staffNode.child.has(layer.GetN())) staffNode.child.set(layer.GetN(), makeIntTree());

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitVerse(verse: MiscLyricElementLike): FunctorCode {
    this.CollectLyricElement(verse);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitRefrain(refrain: MiscLyricElementLike): FunctorCode {
    this.CollectLyricElement(refrain);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  private CollectLyricElement(lyricElement: MiscLyricElementLike): void {
    this.m_lyricElements.push(lyricElement);
  }

  private PrepareLyricElementTracks(): void {
    if (this.m_lyricElementTracksPrepared) return;
    this.m_lyricElementTracksPrepared = true;

    const maxVerseN = new Map<string, number>();
    const maxVerseNByPlace = new Map<string, number>();
    for (const lyricElement of this.m_lyricElements) {
      if (!lyricElement.Is(ClassId.VERSE)) continue;
      const staff = lyricElement.GetAncestorStaff();
      const layer = lyricElement.GetFirstAncestor(ClassId.LAYER) as MiscLayerLike | null;
      if (!staff || !layer) throw new Error('PrepareLyricElementTracks: staff/layer required');
      const verseN = Math.max(lyricElement.GetN?.() ?? 1, 1);
      const staffLayer = `${staff.GetN()}/${layer.GetN()}`;
      maxVerseN.set(staffLayer, Math.max(maxVerseN.get(staffLayer) ?? 0, verseN));
      const placeKey = `${staff.GetN()}/${layer.GetN()}/${getLyricPlace(lyricElement)}`;
      maxVerseNByPlace.set(placeKey, Math.max(maxVerseNByPlace.get(placeKey) ?? 0, verseN));
    }

    for (const lyricElement of this.m_lyricElements) {
      const staff = lyricElement.GetAncestorStaff();
      const layer = lyricElement.GetFirstAncestor(ClassId.LAYER) as MiscLayerLike | null;
      if (!staff || !layer) throw new Error('PrepareLyricElementTracks: staff/layer required');

      const staffN = staff.GetN();
      const layerN = layer.GetN();
      let drawingVerseN = 1;
      let lyricGroupN = 1;
      if (lyricElement.Is(ClassId.VERSE)) {
        drawingVerseN = Math.max(lyricElement.GetN?.() ?? 1, 1);
        lyricGroupN = drawingVerseN;
      }
      else {
        const refrainPosition = getRefrainPosition(lyricElement);
        drawingVerseN
          = (maxVerseNByPlace.get(`${staffN}/${layerN}/${getLyricPlace(lyricElement)}`) ?? 0) + refrainPosition;
        lyricGroupN = (maxVerseN.get(`${staffN}/${layerN}`) ?? 0) + refrainPosition;
      }
      lyricElement.SetDrawingVerseN(drawingVerseN);
      lyricElement.SetDrawingLyricGroupN(lyricGroupN);

      let staffNode = this.m_verseTree.child.get(staffN);
      if (!staffNode) {
        staffNode = makeIntTree();
        this.m_verseTree.child.set(staffN, staffNode);
      }
      let layerNode = staffNode.child.get(layerN);
      if (!layerNode) {
        layerNode = makeIntTree();
        staffNode.child.set(layerN, layerNode);
      }
      let verseNode = layerNode.child.get(lyricGroupN);
      if (!verseNode) {
        verseNode = makeIntTree();
        layerNode.child.set(lyricGroupN, verseNode);
      }
      const lyricKey = `${staffN}/${layerN}/${lyricGroupN}`;
      const hasDirectSyl = lyricElement.HasDirectSyl();
      if (hasDirectSyl && !verseNode.child.has(0)) verseNode.child.set(0, makeIntTree());

      let group = this.m_lyricElementGroups.get(lyricKey);
      if (!group) {
        group = [];
        this.m_lyricElementGroups.set(lyricKey, group);
      }
      group.push(lyricElement);
      if (hasDirectSyl) this.m_directSylTrackGroups.add(lyricKey);
      if (this.m_directSylTrackGroups.has(lyricKey)) {
        for (const groupMember of group) groupMember.SetDrawingDirectSylTrack();
      }

      let position = 0;
      for (const object of lyricElement.FindAllDescendantsByType(ClassId.VOLTA)) {
        const volta = object as unknown as MiscVoltaLike;
        ++position;

        if (volta.HasDrawingVoltaN()) {
          if (!verseNode.child.has(volta.GetDrawingVoltaN())) {
            verseNode.child.set(volta.GetDrawingVoltaN(), makeIntTree());
          }
          continue;
        }

        const identity = volta.HasN() ? `n:${volta.GetN()}` : `position:${position}`;
        const trackKey = `${staffN}/${layerN}/${lyricGroupN}/${identity}`;
        if (!this.m_voltaTracks.has(trackKey)) {
          const next = (this.m_nextVoltaTrack.get(lyricKey) ?? 0) + 1;
          this.m_nextVoltaTrack.set(lyricKey, next);
          this.m_voltaTracks.set(trackKey, next);
        }

        volta.SetDrawingVoltaN(this.m_voltaTracks.get(trackKey)!);
        const voltaN = this.m_voltaTracks.get(trackKey)!;
        if (!verseNode.child.has(voltaN)) verseNode.child.set(voltaN, makeIntTree());
      }
    }

    // Refrain alternatives occupy consecutive outer lyric slots after all numbered verses. This keeps every refrain
    // sub-line after the verse block with the existing above/below positioning rules.
    const refrainLineCounts = new Map<string, number>();
    for (const lyricElement of this.m_lyricElements) {
      if (!lyricElement.Is(ClassId.REFRAIN)) continue;
      const staff = lyricElement.GetAncestorStaff();
      const layer = lyricElement.GetFirstAncestor(ClassId.LAYER) as MiscLayerLike | null;
      if (!staff || !layer) throw new Error('PrepareLyricElementTracks: staff/layer required');
      const key = `${staff.GetN()}/${layer.GetN()}/${getRefrainPosition(lyricElement)}`;
      refrainLineCounts.set(key, Math.max(refrainLineCounts.get(key) ?? 0, lyricElement.GetLyricLineCount()));
    }
    for (const lyricElement of this.m_lyricElements) {
      if (!lyricElement.Is(ClassId.REFRAIN)) continue;
      const staff = lyricElement.GetAncestorStaff();
      const layer = lyricElement.GetFirstAncestor(ClassId.LAYER) as MiscLayerLike | null;
      if (!staff || !layer) throw new Error('PrepareLyricElementTracks: staff/layer required');
      const position = getRefrainPosition(lyricElement);
      let precedingLineCount = 0;
      for (let preceding = 1; preceding < position; ++preceding) {
        precedingLineCount += refrainLineCounts.get(`${staff.GetN()}/${layer.GetN()}/${preceding}`) ?? 0;
      }
      const maxVerse
        = maxVerseNByPlace.get(`${staff.GetN()}/${layer.GetN()}/${getLyricPlace(lyricElement)}`) ?? 0;
      lyricElement.SetDrawingVerseN(maxVerse + precedingLineCount + 1);
    }
  }
}

//----------------------------------------------------------------------------
// ReorderByXPosFunctor
//----------------------------------------------------------------------------

export class ReorderByXPosFunctor extends Functor {
  public constructor() {
    super();
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public VisitObject(object: MiscReorderObjectLike): FunctorCode {
    if (object.GetFacsimileInterface()) {
      if (object.GetFacsimileInterface()!.HasFacs()) {
        return FunctorCode.FUNCTOR_SIBLINGS; // This would have already been reordered.
      }
    }

    // C++ `std::stable_sort(children, Object::sortByUlx)` parity: order by
    // ULX ascending, stable for equal keys. ULX is read through the same
    // facsimile contract the migrated `Object::sortByUlx` uses.
    const children = object.GetChildrenForModification();
    const keyed = children.map((child, index) => ({ child, index }));
    keyed.sort((a, b) => {
      const aUlx = getUlx(a.child);
      const bUlx = getUlx(b.child);
      if (aUlx !== bUlx) return aUlx - bUlx;
      return a.index - b.index;
    });
    for (let i = 0; i < keyed.length; ++i) children[i] = keyed[i].child;

    object.Modify();

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

function getUlx(child: unknown): number {
  const c = child as { GetFacsimileInterface(): { HasFacs(): boolean; GetZone(): { GetUlx(): number } | null } | null };
  const fi = c.GetFacsimileInterface?.();
  if (fi?.HasFacs()) {
    const zone = fi.GetZone();
    if (zone) return zone.GetUlx();
  }
  return 0;
}
