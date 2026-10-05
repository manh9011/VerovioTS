import { ClassId, FunctorCode, VRV_UNSET } from './vrvdef.js';
import { VrvObject, ObjectFactory } from './object.js';
import { AttTyped } from './graphic.js';
import { Functor, ConstFunctor } from './functor.js';

/** Pure-TS translation of libmei::AttCoordinated. */
export class AttCoordinated {
  private m_lrx = VRV_UNSET;
  private m_lry = VRV_UNSET;
  private m_rotate = VRV_UNSET;

  public ResetCoordinated(): void {
    this.m_lrx = VRV_UNSET;
    this.m_lry = VRV_UNSET;
    this.m_rotate = VRV_UNSET;
  }

  public SetLrx(value: number): void { this.m_lrx = value; }
  public GetLrx(): number { return this.m_lrx; }
  public HasLrx(): boolean { return this.m_lrx !== VRV_UNSET; }

  public SetLry(value: number): void { this.m_lry = value; }
  public GetLry(): number { return this.m_lry; }
  public HasLry(): boolean { return this.m_lry !== VRV_UNSET; }

  public SetRotate(value: number): void { this.m_rotate = value; }
  public GetRotate(): number { return this.m_rotate; }
  public HasRotate(): boolean { return this.m_rotate !== VRV_UNSET; }
}

/** Pure-TS translation of libmei::AttCoordinatedUl. */
export class AttCoordinatedUl {
  private m_ulx = VRV_UNSET;
  private m_uly = VRV_UNSET;

  public ResetCoordinatedUl(): void {
    this.m_ulx = VRV_UNSET;
    this.m_uly = VRV_UNSET;
  }

  public SetUlx(value: number): void { this.m_ulx = value; }
  public GetUlx(): number { return this.m_ulx; }
  public HasUlx(): boolean { return this.m_ulx !== VRV_UNSET; }

  public SetUly(value: number): void { this.m_uly = value; }
  public GetUly(): number { return this.m_uly; }
  public HasUly(): boolean { return this.m_uly !== VRV_UNSET; }
}

export interface SurfaceFunctorLike {
  VisitSurface(surface: Surface): FunctorCode;
  VisitSurfaceEnd(surface: Surface): FunctorCode;
}

export interface SurfaceConstFunctorLike {
  VisitSurface(surface: Surface): FunctorCode;
  VisitSurfaceEnd(surface: Surface): FunctorCode;
}

interface ZoneLike extends VrvObject {
  GetLrx(): number;
  GetLry(): number;
}

/**
 * Pure-TypeScript translation of `include/vrv/surface.h` + `src/surface.cpp`.
 *
 * Multiple C++ inheritance from Object/AttTyped/AttCoordinated/AttCoordinatedUl is
 * represented by explicit attribute components because TypeScript has no multiple
 * class inheritance. Attribute state and reset semantics remain independent.
 */
export class Surface extends VrvObject {
  private typed: AttTyped | undefined;
  private coordinated: AttCoordinated | undefined;
  private coordinatedUl: AttCoordinatedUl | undefined;

  public constructor() {
    super(ClassId.SURFACE);
    this.RegisterAttClass(224); // ATT_TYPED
    this.RegisterAttClass(114); // ATT_COORDINATED
    this.RegisterAttClass(115); // ATT_COORDINATEDUL
    this.ResetSurfaceAttributes();
  }

  private ResetSurfaceAttributes(): void {
    this.typed ??= new AttTyped();
    this.coordinated ??= new AttCoordinated();
    this.coordinatedUl ??= new AttCoordinatedUl();
    this.typed!.ResetTyped();
    this.coordinated.ResetCoordinated();
    this.coordinatedUl.ResetCoordinatedUl();
  }

  public override Reset(): void {
    super.Reset();
    this.ResetSurfaceAttributes();
  }

  public override Clone(): VrvObject {
    const clone = new Surface();
    clone.AssignFrom(this);
    if (this.HasLrx()) clone.SetLrx(this.GetLrx());
    if (this.HasLry()) clone.SetLry(this.GetLry());
    if (this.HasRotate()) clone.SetRotate(this.GetRotate());
    if (this.HasUlx()) clone.SetUlx(this.GetUlx());
    if (this.HasUly()) clone.SetUly(this.GetUly());
    if (this.HasType()) clone.SetType(this.GetType());
    return clone;
  }

  public override GetClassName(): string { return 'surface'; }

  public IsSupportedChild(classId: ClassId): boolean {
    return classId === ClassId.GRAPHIC || classId === ClassId.ZONE;
  }

  public GetMaxX(): number {
    if (this.coordinated?.HasLrx()) return this.coordinated!.GetLrx();

    let max = 0;
    const zones = this.FindAllDescendantsByType(ClassId.ZONE);
    for (const object of zones) {
      if (object.GetClassId() !== ClassId.ZONE) {
        throw new Error('Surface::GetMaxX expected a ZONE descendant');
      }
      const zone = object as ZoneLike;
      const lrx = zone.GetLrx();
      max = lrx > max ? lrx : max;
    }
    return max;
  }

  public GetMaxY(): number {
    if (this.coordinated?.HasLry()) return this.coordinated!.GetLry();

    let max = 0;
    const zones = this.FindAllDescendantsByType(ClassId.ZONE);
    for (const object of zones) {
      if (object.GetClassId() !== ClassId.ZONE) {
        throw new Error('Surface::GetMaxY expected a ZONE descendant');
      }
      const zone = object as ZoneLike;
      const lry = zone.GetLry();
      max = lry > max ? lry : max;
    }
    return max;
  }

  public SetType(value: string): void { this.typed!.SetType(value); }
  public GetType(): string { return this.typed!.GetType(); }
  public HasType(): boolean { return this.typed!.HasType(); }
  public ResetTyped(): void { this.typed!.ResetTyped(); }

  public SetLrx(value: number): void { this.coordinated!.SetLrx(value); }
  public GetLrx(): number { return this.coordinated!.GetLrx(); }
  public HasLrx(): boolean { return this.coordinated!.HasLrx(); }
  public SetLry(value: number): void { this.coordinated!.SetLry(value); }
  public GetLry(): number { return this.coordinated!.GetLry(); }
  public HasLry(): boolean { return this.coordinated!.HasLry(); }
  public SetRotate(value: number): void { this.coordinated!.SetRotate(value); }
  public GetRotate(): number { return this.coordinated!.GetRotate(); }
  public HasRotate(): boolean { return this.coordinated!.HasRotate(); }

  public SetUlx(value: number): void { this.coordinatedUl!.SetUlx(value); }
  public GetUlx(): number { return this.coordinatedUl!.GetUlx(); }
  public HasUlx(): boolean { return this.coordinatedUl!.HasUlx(); }
  public SetUly(value: number): void { this.coordinatedUl!.SetUly(value); }
  public GetUly(): number { return this.coordinatedUl!.GetUly(); }
  public HasUly(): boolean { return this.coordinatedUl!.HasUly(); }

  public override Accept(functor: Functor): FunctorCode {
    return visitor(functor, 'VisitSurface', this);
  }

  public AcceptConst(functor: ConstFunctor): FunctorCode {
    return visitor(functor, 'VisitSurface', this);
  }

  public override AcceptEnd(functor: Functor): FunctorCode {
    return visitor(functor, 'VisitSurfaceEnd', this);
  }

  public AcceptEndConst(functor: ConstFunctor): FunctorCode {
    return visitor(functor, 'VisitSurfaceEnd', this);
  }
}

function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') {
    return (fn as (arg: unknown) => FunctorCode).call(functor, self);
  }
  const fallback = method.endsWith('End') ? f.VisitObjectEnd : f.VisitObject;
  if (typeof fallback === 'function') {
    return (fallback as (arg: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('surface', ClassId.SURFACE, () => new Surface());
