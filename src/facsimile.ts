import { ATT_CLASS_IDS } from './attmodule.js';
import { InstTyped } from './atts_shared.js';
import { ObjectFactory, VrvObject } from './object.js';
import { Surface } from './surface.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { Zone } from './zone.js';

/**
 * Pure TypeScript translation of Verovio's Facsimile class from
 * include/vrv/facsimile.h and src/facsimile.cpp.
 *
 * Implements the <facsimile> element in MEI.
 */
export class Facsimile extends VrvObject {
  private m_attTyped!: InstTyped;

  public constructor() {
    super(ClassId.FACSIMILE);
    this.RegisterAttClass(ATT_CLASS_IDS.ATT_TYPED);
    this.Reset();
  }

  public override GetClassName(): string {
    return 'facsimile';
  }

  public override Reset(): void {
    super.Reset();
    this.m_attTyped ??= new InstTyped();
    this.m_attTyped.ResetTyped();
  }

  public override Clone(): Facsimile {
    const clone = new Facsimile();
    clone.AssignFrom(this);
    if (this.HasType()) {
      clone.SetType(this.GetType());
    }
    return clone;
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    return classId === ClassId.SURFACE;
  }

  public FindZoneByID(zoneId: string): Zone | null {
    const desc = this.FindDescendantByID(zoneId);
    if (desc instanceof Zone) {
      return desc;
    }
    return null;
  }

  public GetMaxX(): number {
    const surfaces = this.FindAllDescendantsByType(ClassId.SURFACE);
    let max = 0;
    for (const object of surfaces) {
      const surface = object as Surface;
      const x = surface.GetMaxX();
      if (x > max) {
        max = x;
      }
    }
    return max;
  }

  public GetMaxY(): number {
    const surfaces = this.FindAllDescendantsByType(ClassId.SURFACE);
    let max = 0;
    for (const object of surfaces) {
      const surface = object as Surface;
      const y = surface.GetMaxY();
      if (y > max) {
        max = y;
      }
    }
    return max;
  }

  // AttTyped forwarding
  public SetType(type: string): void {
    this.m_attTyped.SetType(type);
  }

  public GetType(): string {
    return this.m_attTyped.GetType();
  }

  public HasType(): boolean {
    return this.m_attTyped.HasType();
  }

  public ResetTyped(): void {
    this.m_attTyped.ResetTyped();
  }

  // Functor visitation
  public override Accept(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitFacsimile', this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitFacsimileEnd', this);
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitFacsimile', this);
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitFacsimileEnd', this);
  }
}

function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') {
    return fn.call(functor, self) as FunctorCode;
  }
  const fallback = method.endsWith('End') ? f.VisitObjectEnd : f.VisitObject;
  if (typeof fallback === 'function') {
    return fallback.call(functor, self) as FunctorCode;
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('facsimile', ClassId.FACSIMILE, () => new Facsimile());
