import { ExtractIDFragment, LogWarning } from './vrv.js';
import { AttClassId, FunctorCode, InterfaceId, ClassId } from './vrvdef.js';
import { Interface } from './interface.js';

/** Minimal pure-TS translation of libmei::AttFacsimile used by FacsimileInterface. */
export class FacsimileAttributes {
  private m_facs = '';
  public ResetFacsimile(): void { this.m_facs = ''; }
  public SetFacs(value: string): void { this.m_facs = value; }
  public GetFacs(): string { return this.m_facs; }
  public HasFacs(): boolean { return this.m_facs !== ''; }
}

export interface ZoneLike extends ObjectLike {
  GetUlx(): number;
  GetLrx(): number;
  GetRotate(): number;
  GetLogicalUly(): number;
  GetLogicalLry(): number;
  GetParent(): ObjectLike | null;
  GetID(): string;
}

export interface SurfaceLike {
  GetMaxY(): number;
}

export interface ObjectLike {
  DeleteChild(child: ObjectLike): boolean;
  GetParent(): ObjectLike | null;
  GetID(): string;
  Is(classId: number): boolean;
  GetFirstAncestor(classId: number): ObjectLike | null;
}

export interface FacsimileLike extends ObjectLike {
  FindDescendantByID(id: string): ObjectLike | null;
}

export interface PrepareFacsimileFunctorLike { GetFacsimile(): FacsimileLike | null; }
export interface ResetDataFunctorLike {}

export class FacsimileInterface extends Interface {
  public static readonly ATT_FACSIMILE: AttClassId = 48;
  private readonly attrs = new FacsimileAttributes();
  private m_zone: ZoneLike | null = null;
  private m_surface: SurfaceLike | null = null;

  public constructor() {
    super();
    this.RegisterInterfaceAttClass(FacsimileInterface.ATT_FACSIMILE);
    this.Reset();
  }

  public override Reset(): void {
    this.attrs.ResetFacsimile();
    this.m_zone = null;
    this.m_surface = null;
  }

  public override IsInterface(): InterfaceId { return InterfaceId.INTERFACE_FACSIMILE; }

  public SetFacs(value: string): void { this.attrs.SetFacs(value); }
  public GetFacs(): string { return this.attrs.GetFacs(); }
  public HasFacs(): boolean { return this.attrs.HasFacs(); }
  public ResetFacsimile(): void { this.attrs.ResetFacsimile(); }

  public GetDrawingX(): number {
    if (!this.m_zone) throw new Error('FacsimileInterface requires a zone');
    return this.m_zone.GetUlx();
  }

  public GetDrawingY(): number {
    if (!this.m_zone) throw new Error('FacsimileInterface requires a zone');
    const rotate = this.m_zone.GetRotate();
    if (rotate >= 0) return this.m_zone.GetLogicalUly();
    return this.m_zone.GetLogicalUly() - (this.m_zone.GetLrx() - this.m_zone.GetUlx()) * Math.tan(rotate * Math.PI / 180);
  }

  public GetWidth(): number {
    if (!this.m_zone) throw new Error('FacsimileInterface requires a zone');
    return this.m_zone.GetLrx() - this.m_zone.GetUlx();
  }

  public GetHeight(): number {
    if (!this.m_zone) throw new Error('FacsimileInterface requires a zone');
    return this.m_zone.GetLogicalLry() - this.m_zone.GetLogicalUly();
  }

  public GetDrawingRotate(): number {
    if (!this.m_zone) throw new Error('FacsimileInterface requires a zone');
    return this.m_zone.GetRotate();
  }

  public AttachZone(zone: ZoneLike | null): void {
    if (this.m_zone) {
      const parent = this.m_zone.GetParent();
      if (!parent || !parent.DeleteChild(this.m_zone)) {
        // C++ prints a diagnostic but continues.
        // LogWarning is used as the pure-TS equivalent sink.
        LogWarning(`Failed to delete zone with ID ${this.m_zone.GetID()}`);
      }
    }
    this.m_zone = zone;
    if (!zone) this.SetFacs('');
    else this.SetFacs(`#${zone.GetID()}`);
  }

  public GetSurfaceY(): number {
    if (!this.m_zone) throw new Error('FacsimileInterface requires a zone');
    let node: ObjectLike | null = this.m_zone;
    while (node) {
      if (node.Is(ClassId.SURFACE)) {
        const surface = node as unknown as SurfaceLike;
        return surface.GetMaxY();
      }
      node = node.GetParent();
    }
    throw new Error('FacsimileInterface requires an ancestor surface');
  }

  public GetZone(): ZoneLike | null { return this.m_zone; }
  public GetSurface(): SurfaceLike | null { return this.m_surface; }

  public InterfacePrepareFacsimile(functor: PrepareFacsimileFunctorLike, _object: unknown): FunctorCode {
    const facsimile = functor.GetFacsimile();
    if (!facsimile) throw new Error('PrepareFacsimileFunctor requires facsimile');
    const facsID = ExtractIDFragment(this.GetFacs());
    const facsDescendant = facsimile.FindDescendantByID(facsID);
    if (!facsDescendant) {
      LogWarning(`Could not find @facs '${facsID}' in facsimile element`);
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    if (facsDescendant.Is(ClassId.ZONE)) {
      this.m_zone = facsDescendant as unknown as ZoneLike;
    } else if (facsDescendant.Is(ClassId.SURFACE)) {
      this.m_surface = facsDescendant as unknown as SurfaceLike;
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public InterfaceResetData(_functor: ResetDataFunctorLike, _object: unknown): FunctorCode {
    this.m_zone = null;
    this.m_surface = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
