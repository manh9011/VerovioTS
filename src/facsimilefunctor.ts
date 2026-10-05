/**
 * facsimilefunctor.ts — canonical translation of src-cpp/src/facsimilefunctor.cpp
 * + src-cpp/include/vrv/facsimilefunctor.h.
 *
 * Two functors syncing layout between facsimile zones and drawing coordinates:
 *  - SyncFromFacsimileFunctor: zone geometry -> m_drawingFacs* members, page
 *    size/margins, neon staff-size/rotation, then ApplyPPUFactor when needed.
 *  - SyncToFacsimileFunctor: drawing coordinates -> zone geometry, creating
 *    Surface/Zone objects on demand via GetZone().
 *
 * Both implement `ImplementsEndInterface() == true` per the C++ header.
 *
 * ponytail: View coordinate transforms (ToLogicalX/Y, ToDeviceContextX/Y) are
 * injectable identity-by-default until view.cpp ports; set via SetView().
 */

import { Functor } from './functor.js';
import { FunctorCode, ClassId, DEFINITION_FACTOR } from './vrvdef.js';
import { LogWarning, StringFormat, IsValidDouble } from './vrv.js';
import { ApplyPPUFactorFunctor } from './miscfunctor.js';
import { Zone } from './zone.js';
import { Surface } from './surface.js';

//----------------------------------------------------------------------------
// Structural boundaries (View + Doc unported pieces)
//----------------------------------------------------------------------------

/** Minimal View contract used by both functors (view.cpp pending). */
export interface FacsimileViewLike {
  SetDoc(doc: unknown): void;
  ToLogicalX(value: number): number;
  ToLogicalY(value: number): number;
  ToDeviceContextX(value: number): number;
  ToDeviceContextY(value: number): number;
}

/** Identity view until view.cpp ports. */
class IdentityFacsimileView implements FacsimileViewLike {
  private m_doc: unknown = null;
  public SetDoc(doc: unknown): void { this.m_doc = doc; }
  public ToLogicalX(value: number): number { return value; }
  public ToLogicalY(value: number): number { return value; }
  public ToDeviceContextX(value: number): number { return value; }
  public ToDeviceContextY(value: number): number { return value; }
}

/** Doc surface consumed by both functors. */
export interface FacsimileDocLike {
  SetDrawingPage(idx: number): unknown;
  UpdatePageDrawingSizes(): void;
  GetOptions(): { m_unit: { GetValue(): number } };
  GetFacsimile(): { AddChild(child: unknown): void } | null;
  m_drawingPageWidth: number;
  m_drawingPageHeight: number;
  m_drawingPageContentWidth: number;
  m_drawingPageContentHeight: number;
  m_drawingPageMarginTop: number;
  m_drawingPageMarginLeft: number;
}

/** Zone geometry surface. */
export interface FacsimileZoneLike {
  GetUlx(): number;
  GetUly(): number;
  GetLrx(): number;
  GetLry(): number;
  SetUlx(value: number): void;
  SetUly(value: number): void;
  SetLrx(value: number): void;
  SetLry(value: number): void;
  HasUlx(): boolean;
  HasUly(): boolean;
  HasLrx(): boolean;
  HasLry(): boolean;
  HasRotate(): boolean;
  GetRotate(): number;
  GetParent(): { Is(classId: number): boolean } | null;
  GetType(): string;
}

/** Surface surface for the from-functor Pb path. */
export interface FacsimileSurfaceLike {
  HasLrx(): boolean;
  HasLry(): boolean;
  GetLrx(): number;
  GetLry(): number;
  GetType(): string;
}

export interface FacsimileLayerElementLike {
  Is(classId: number): boolean;
  IsAnyOf(classIds: Iterable<number>): boolean;
  GetZone(): FacsimileZoneLike | null;
  GetClassName(): string;
  GetDrawingX(): number;
  GetDrawingY(): number;
  m_drawingFacsX: number;
  m_drawingFacsY: number;
}

export interface FacsimileMeasureLike {
  IsNeumeLine(): boolean;
  GetZone(): FacsimileZoneLike | null;
  GetClassName(): string;
  GetDrawingX(): number;
  GetWidth(): number;
  m_drawingFacsX1: number;
  m_drawingFacsX2: number;
}

export interface FacsimilePageLike {
  GetIdx(): number;
  m_pageWidth: number;
  m_pageHeight: number;
  m_pageMarginTop: number;
  m_pageMarginBottom: number;
  m_pageMarginLeft: number;
  m_pageMarginRight: number;
  SetPPUFactor(value: number): void;
  GetPPUFactor(): number;
  FindDescendantByType(classId: number): unknown;
  LayOut(): void;
  Process(functor: unknown): void;
}

export interface FacsimilePbLike {
  GetZone(): FacsimileZoneLike | null;
  GetSurface(): FacsimileSurfaceLike | null;
  GetClassName(): string;
  GetFirstAncestor?(classId: number): unknown;
}

export interface FacsimileSbLike {
  GetZone(): FacsimileZoneLike | null;
  GetClassName(): string;
}

export interface FacsimileStaffLike {
  GetZone(): FacsimileZoneLike | null;
  GetClassName(): string;
  GetDrawingY(): number;
  m_drawingFacsY: number;
  m_drawingStaffSize: number;
  m_drawingLines: number;
  SetDrawingRotation(value: number): void;
}

export interface FacsimileSystemLike {
  m_drawingFacsX: number;
  m_drawingFacsY: number;
  GetDrawingX(): number;
  GetDrawingY(): number;
}

export interface FacsimileInterfaceLike {
  GetZone(): (FacsimileZoneLike & { GetParent(): unknown }) | null;
  SetFacs(value: string): void;
  AttachZone(zone: unknown): void;
}

//----------------------------------------------------------------------------
// SyncFromFacsimileFunctor
//----------------------------------------------------------------------------

const SYNC_FROM_CLASSES = [
  ClassId.ACCID, ClassId.BARLINE, ClassId.CHORD, ClassId.CLEF, ClassId.CUSTOS,
  ClassId.DIVLINE, ClassId.DOT, ClassId.LIQUESCENT, ClassId.NC, ClassId.NOTE,
  ClassId.REST, ClassId.SYL,
];

export class SyncFromFacsimileFunctor extends Functor {
  private m_doc: FacsimileDocLike;
  private m_view: FacsimileViewLike;
  private m_currentPage: FacsimilePageLike | null = null;
  private m_currentSystem: FacsimileSystemLike | null = null;
  private m_currentNeumeLine: FacsimileMeasureLike | null = null;
  private m_staffZones = new Map<FacsimileStaffLike, FacsimileZoneLike>();
  private m_pageMarginTop = 0;
  private m_pageMarginLeft = 0;
  private m_ppuFactor = 1.0;

  public constructor(doc: FacsimileDocLike) {
    super();
    this.m_doc = doc;
    this.m_view = new IdentityFacsimileView();
    this.m_view.SetDoc(doc);
  }

  public override ImplementsEndInterface(): boolean { return true; }

  /** Injectable view until view.cpp ports. */
  public SetView(view: FacsimileViewLike): void { this.m_view = view; }

  public VisitLayerElement(layerElement: FacsimileLayerElementLike): FunctorCode {
    if (!layerElement.IsAnyOf(SYNC_FROM_CLASSES)) return FunctorCode.FUNCTOR_CONTINUE;

    const zone = layerElement.GetZone();
    if (!zone) throw new Error('SyncFromFacsimileFunctor::VisitLayerElement: zone required');
    layerElement.m_drawingFacsX = this.m_view.ToLogicalX(zone.GetUlx() * DEFINITION_FACTOR - this.m_pageMarginLeft);
    if (this.m_currentNeumeLine && layerElement.IsAnyOf([ClassId.ACCID, ClassId.SYL])) {
      layerElement.m_drawingFacsY = this.m_view.ToLogicalY(zone.GetUly() * DEFINITION_FACTOR - this.m_pageMarginTop);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: FacsimileMeasureLike): FunctorCode {
    // neon specific code - measure have no zone, we will use the staff one in VisitStaff
    if (measure.IsNeumeLine()) {
      this.m_currentNeumeLine = measure;
    }
    else {
      const zone = measure.GetZone();
      if (!zone) throw new Error('SyncFromFacsimileFunctor::VisitMeasure: zone required');
      measure.m_drawingFacsX1 = this.m_view.ToLogicalX(zone.GetUlx() * DEFINITION_FACTOR - this.m_pageMarginLeft);
      measure.m_drawingFacsX2 = this.m_view.ToLogicalX(zone.GetLrx() * DEFINITION_FACTOR - this.m_pageMarginLeft);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPage(page: FacsimilePageLike): FunctorCode {
    this.m_staffZones.clear();
    this.m_currentPage = page;
    this.m_doc.SetDrawingPage(page.GetIdx());

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPageEnd(page: FacsimilePageLike): FunctorCode {
    // Used for adjusting staff size in neon - filled in VisitStaff
    if (this.m_staffZones.size !== 0) {
      // Since we multiply all values by the DEFINITION_FACTOR, set it as PPU for neon facs
      this.m_ppuFactor = DEFINITION_FACTOR;
    }

    // The staff size is calculated based on the zone height and takes into account the rotation
    for (const [staff, zone] of this.m_staffZones) {
      const rotate = zone.HasRotate() ? zone.GetRotate() : 0.0;
      const yDiff
        = zone.GetLry() - zone.GetUly() - (zone.GetLrx() - zone.GetUlx()) * Math.tan(Math.abs(rotate) * Math.PI / 180.0);
      staff.m_drawingStaffSize
        = 100 * yDiff / (this.m_doc.GetOptions().m_unit.GetValue() * 2 * (staff.m_drawingLines - 1));
      staff.SetDrawingRotation(rotate);
    }

    this.m_currentPage!.SetPPUFactor(this.m_ppuFactor);
    if (this.m_currentPage!.GetPPUFactor() !== 1.0) {
      const applyPPUFactor = new ApplyPPUFactorFunctor(null);
      this.m_currentPage!.Process(applyPPUFactor as unknown as never);
      this.m_doc.UpdatePageDrawingSizes();
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPb(pb: FacsimilePbLike): FunctorCode {
    // This would happen if we run the functor on data not converted to page-based
    if (!this.m_currentPage) throw new Error('SyncFromFacsimileFunctor::VisitPb: current page required');

    const zone = pb.GetZone();
    let surface = pb.GetSurface();
    if (!surface && zone && zone.GetParent()) {
      surface = zone.GetParent()!.Is(ClassId.SURFACE) ? (zone.GetParent() as unknown as FacsimileSurfaceLike) : null;
    }
    if (!zone && !surface) throw new Error('SyncFromFacsimileFunctor::VisitPb: zone or surface required');
    // Use the (parent) surface attributes if given
    if (surface && surface.HasLrx() && surface.HasLry()) {
      this.m_currentPage.m_pageHeight = surface.GetLry() * DEFINITION_FACTOR;
      this.m_currentPage.m_pageWidth = surface.GetLrx() * DEFINITION_FACTOR;
      // Read the ppu factor from surface@type
      const surfaceType = surface.GetType();
      if (surfaceType.startsWith('ppu:')) {
        const ppuFactorStr = surfaceType.substr(surfaceType.indexOf(':') + 1);
        if (IsValidDouble(ppuFactorStr)) {
          this.m_ppuFactor = parseFloat(ppuFactorStr);
          this.m_ppuFactor *= DEFINITION_FACTOR / this.m_doc.GetOptions().m_unit.GetValue();
        }
      }
      // Read margins
      if (zone && zone.HasUlx() && zone.HasUly() && zone.HasLrx() && zone.HasLry()) {
        this.m_pageMarginTop = zone.GetUly() * DEFINITION_FACTOR;
        this.m_pageMarginLeft = zone.GetUlx() * DEFINITION_FACTOR;
        this.m_currentPage.m_pageMarginTop = this.m_pageMarginTop;
        // Calculate the bottom margin looking at the surface lry and zone lry
        this.m_currentPage.m_pageMarginBottom = this.m_currentPage.m_pageHeight - zone.GetLry() * DEFINITION_FACTOR;
        this.m_currentPage.m_pageMarginLeft = this.m_pageMarginLeft;
        // Calculate the right margin looking at the surface lrx and zone lrx
        this.m_currentPage.m_pageMarginRight = this.m_currentPage.m_pageWidth - zone.GetLrx() * DEFINITION_FACTOR;
        this.m_doc.UpdatePageDrawingSizes();
      }
    }
    // Fallback on zone
    else {
      this.m_currentPage.m_pageHeight = zone!.GetLry() * DEFINITION_FACTOR;
      this.m_currentPage.m_pageWidth = zone!.GetLrx() * DEFINITION_FACTOR;
    }

    // Update the page size to have to View::ToLogicalX/Y valid
    this.m_doc.UpdatePageDrawingSizes();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSb(sb: FacsimileSbLike): FunctorCode {
    // This would happen if we run the functor on data not converted to page-based
    if (!this.m_currentSystem) throw new Error('SyncFromFacsimileFunctor::VisitSb: current system required');

    const zone = sb.GetZone();
    if (!zone) throw new Error('SyncFromFacsimileFunctor::VisitSb: zone required');
    this.m_currentSystem.m_drawingFacsX = this.m_view.ToLogicalX(zone.GetUlx() * DEFINITION_FACTOR - this.m_pageMarginLeft);
    this.m_currentSystem.m_drawingFacsY = this.m_view.ToLogicalY(zone.GetUly() * DEFINITION_FACTOR - this.m_pageMarginTop);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: FacsimileStaffLike): FunctorCode {
    const zone = staff.GetZone();
    if (!zone) throw new Error('SyncFromFacsimileFunctor::VisitStaff: zone required');
    staff.m_drawingFacsY = this.m_view.ToLogicalY(zone.GetUly() * DEFINITION_FACTOR - this.m_pageMarginTop);

    // neon specific code - set the position of the pseudo measure (neume line)
    if (this.m_currentNeumeLine) {
      this.m_currentNeumeLine.m_drawingFacsX1 = this.m_view.ToLogicalX(zone.GetUlx() * DEFINITION_FACTOR - this.m_pageMarginLeft);
      this.m_currentNeumeLine.m_drawingFacsX2 = this.m_view.ToLogicalX(zone.GetLrx() * DEFINITION_FACTOR - this.m_pageMarginLeft);
      this.m_staffZones.set(staff, zone);

      // The staff slope is going up. The y left position needs to be adjusted accordingly
      if (zone.HasRotate() && zone.GetRotate() < 0) {
        staff.m_drawingFacsY = staff.m_drawingFacsY
          + (this.m_currentNeumeLine.m_drawingFacsX2 - this.m_currentNeumeLine.m_drawingFacsX1)
          * Math.tan(zone.GetRotate() * Math.PI / 180.0);
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: FacsimileSystemLike): FunctorCode {
    this.m_currentSystem = system;
    this.m_currentNeumeLine = null;

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// SyncToFacsimileFunctor
//----------------------------------------------------------------------------

const SYNC_TO_CLASSES = [
  ClassId.ACCID, ClassId.BARLINE, ClassId.CHORD, ClassId.CLEF, ClassId.CUSTOS,
  ClassId.DOT, ClassId.DIVLINE, ClassId.LIQUESCENT, ClassId.NC, ClassId.NOTE,
  ClassId.REST, ClassId.SYL,
];

export class SyncToFacsimileFunctor extends Functor {
  private m_doc: FacsimileDocLike;
  private m_view: FacsimileViewLike;
  private m_surface: Surface | null = null;
  private m_currentPage: FacsimilePageLike | null = null;
  private m_currentSystem: FacsimileSystemLike | null = null;
  private m_pageMarginTop = 0;
  private m_pageMarginLeft = 0;
  private m_currentNeumeLine = false;
  private m_ppuFactor: number;

  public constructor(doc: FacsimileDocLike, ppuFactor: number) {
    super();
    this.m_doc = doc;
    this.m_ppuFactor = ppuFactor;
    this.m_view = new IdentityFacsimileView();
    this.m_view.SetDoc(doc);
  }

  public override ImplementsEndInterface(): boolean { return true; }

  /** Injectable view until view.cpp ports. */
  public SetView(view: FacsimileViewLike): void { this.m_view = view; }

  public VisitLayerElement(layerElement: FacsimileLayerElementLike & FacsimileInterfaceLike): FunctorCode {
    if (!layerElement.IsAnyOf(SYNC_TO_CLASSES)) return FunctorCode.FUNCTOR_CONTINUE;

    const zone = this.GetZone(layerElement, layerElement.GetClassName()) as unknown as FacsimileZoneLike;
    zone.SetUlx(this.m_view.ToDeviceContextX(layerElement.GetDrawingX()) / DEFINITION_FACTOR + this.m_pageMarginLeft);
    if (this.m_currentNeumeLine && layerElement.IsAnyOf([ClassId.ACCID, ClassId.SYL])) {
      zone.SetUly(this.m_view.ToDeviceContextY(layerElement.GetDrawingY()) / DEFINITION_FACTOR + this.m_pageMarginTop);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: FacsimileMeasureLike & FacsimileInterfaceLike): FunctorCode {
    const zone = this.GetZone(measure as unknown as FacsimileInterfaceLike, measure.GetClassName()) as unknown as FacsimileZoneLike;
    zone.SetUlx(this.m_view.ToDeviceContextX(measure.GetDrawingX()) / DEFINITION_FACTOR + this.m_pageMarginLeft);
    zone.SetLrx(
      this.m_view.ToDeviceContextX(measure.GetDrawingX() + measure.GetWidth()) / DEFINITION_FACTOR + this.m_pageMarginLeft);

    this.m_currentNeumeLine = measure.IsNeumeLine();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPage(page: FacsimilePageLike): FunctorCode {
    // This is required since processing Pb will create or select the Surface
    if (!page.FindDescendantByType(ClassId.PB)) {
      LogWarning('Page without <pb> skipped when synching to facsimile');
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    this.m_currentPage = page;
    this.m_doc.SetDrawingPage(page.GetIdx());
    page.LayOut();
    // From a previously loaded facsimile
    if (page.GetPPUFactor() !== 1.0) {
      this.m_ppuFactor = page.GetPPUFactor();
    }
    // When generating a facsimile with a scale option
    else {
      page.SetPPUFactor(this.m_ppuFactor);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPageEnd(_page: FacsimilePageLike): FunctorCode {
    if (this.m_ppuFactor !== 1.0) {
      const applyPPUFactor = new ApplyPPUFactorFunctor(this.m_currentPage as unknown as never);
      (this.m_surface as unknown as { Process(functor: unknown): void }).Process(applyPPUFactor as unknown as never);
      (this.m_surface as unknown as { SetType(value: string): void }).SetType(
        StringFormat('ppu:%f', this.m_ppuFactor * this.m_doc.GetOptions().m_unit.GetValue() / DEFINITION_FACTOR));
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPb(pb: FacsimilePbLike & FacsimileInterfaceLike): FunctorCode {
    let zone = pb.GetZone() as unknown as (FacsimileZoneLike & { GetFirstAncestor(classId: number): unknown }) | null;
    // Assume to be creating the facsimile data from scratch
    if (!pb.GetZone()) {
      // Also create a new surface
      this.m_surface = new Surface();
      const facsimile = this.m_doc.GetFacsimile();
      if (!facsimile) throw new Error('SyncToFacsimileFunctor::VisitPb: facsimile required');
      facsimile.AddChild(this.m_surface);
      zone = this.GetZone(pb, pb.GetClassName()) as unknown as typeof zone;
    }
    // We already have some facsimile data - retrieve the surface ancestor
    else {
      this.m_surface = zone!.GetFirstAncestor(ClassId.SURFACE) as Surface;
    }
    if (!this.m_surface) throw new Error('SyncToFacsimileFunctor::VisitPb: surface required');
    if (!zone) throw new Error('SyncToFacsimileFunctor::VisitPb: zone required');

    (this.m_surface as unknown as FacsimileZoneLike).SetLrx(this.m_doc.m_drawingPageWidth / DEFINITION_FACTOR);
    (this.m_surface as unknown as FacsimileZoneLike).SetLry(this.m_doc.m_drawingPageHeight / DEFINITION_FACTOR);
    // Because the facsimile output zone positions include the margins, we will add them to each zone
    this.m_pageMarginTop = this.m_doc.m_drawingPageMarginTop / DEFINITION_FACTOR;
    this.m_pageMarginLeft = this.m_doc.m_drawingPageMarginLeft / DEFINITION_FACTOR;

    // The Pb zone values are currently not used in SyncFromFacsimileFunctor because the
    // page sizes are synced from the parent Surface and zone positions include margins
    zone.SetUlx(this.m_pageMarginLeft);
    zone.SetUly(this.m_pageMarginTop);
    // Use the page content size to factor in the bottom and right margins
    zone.SetLrx(this.m_doc.m_drawingPageContentWidth / DEFINITION_FACTOR + this.m_pageMarginLeft);
    zone.SetLry(this.m_doc.m_drawingPageContentHeight / DEFINITION_FACTOR + this.m_pageMarginTop);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSb(sb: FacsimileSbLike & FacsimileInterfaceLike): FunctorCode {
    const zone = this.GetZone(sb, sb.GetClassName()) as unknown as FacsimileZoneLike;
    zone.SetUlx(this.m_view.ToDeviceContextX(this.m_currentSystem!.GetDrawingX()) / DEFINITION_FACTOR + this.m_pageMarginLeft);
    zone.SetUly(this.m_view.ToDeviceContextY(this.m_currentSystem!.GetDrawingY()) / DEFINITION_FACTOR + this.m_pageMarginTop);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: FacsimileStaffLike & FacsimileInterfaceLike): FunctorCode {
    const zone = this.GetZone(staff, staff.GetClassName()) as unknown as FacsimileZoneLike;
    zone.SetUly(this.m_view.ToDeviceContextY(staff.GetDrawingY()) / DEFINITION_FACTOR + this.m_pageMarginTop);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: FacsimileSystemLike): FunctorCode {
    this.m_currentSystem = system;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public GetZone(iface: FacsimileInterfaceLike, type: string): FacsimileZoneLike {
    if (!this.m_surface) throw new Error('SyncToFacsimileFunctor::GetZone: surface required');

    if (iface.GetZone()) {
      // Here we should probably check if the zone is a child of m_surface
      if (iface.GetZone()!.GetParent() !== (this.m_surface as unknown)) {
        throw new Error('SyncToFacsimileFunctor::GetZone: zone parent mismatch');
      }
      return iface.GetZone() as unknown as FacsimileZoneLike;
    }
    else {
      const zone = new Zone();
      const lowerType = type.toLowerCase();
      zone.SetType(lowerType);
      this.m_surface.AddChild(zone);
      iface.SetFacs(`#${zone.GetID()}`);
      iface.AttachZone(zone as unknown as never);
      return iface.GetZone() as unknown as FacsimileZoneLike;
    }
  }
}
