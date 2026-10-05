/**
 * Pure TypeScript translation of Verovio's functor base classes from
 * include/vrv/functor.h.
 *
 * The C++ hierarchy uses multiple inheritance (FunctorBase + FunctorInterface).
 * TypeScript models the same public surface through interface/class declaration
 * merging for Functor and ConstFunctor, while keeping FunctorBase as the single
 * runtime state owner. Visitor methods remain provided by the concrete functor.
 */
import { FORWARD, FunctorCode } from './vrvdef';
import { FunctorInterface, ConstFunctorInterface } from './functorinterface';

/** Structural contract for the not-yet-migrated Filters class. */
export type Filters = any;

/** Structural contract for the not-yet-migrated Doc class. */
export type Doc = any;

export abstract class FunctorBase {
  private m_code: FunctorCode = FunctorCode.FUNCTOR_CONTINUE;
  private m_filters: Filters | null = null;
  private m_visibleOnly = true;
  private m_direction = FORWARD;

  public GetCode(): FunctorCode {
    return this.m_code;
  }

  public ResetCode(): void {
    this.m_code = FunctorCode.FUNCTOR_CONTINUE;
  }

  public SetCode(code: FunctorCode): void {
    this.m_code = code;
  }

  public VisibleOnly(): boolean {
    return this.m_visibleOnly;
  }

  public SetVisibleOnly(visibleOnly: boolean): void {
    this.m_visibleOnly = visibleOnly;
  }

  public GetFilters(): Filters | null {
    return this.m_filters;
  }

  public SetFilters(filters: Filters | null): Filters | null {
    const previous = this.m_filters;
    this.m_filters = filters;
    return previous;
  }

  public GetDirection(): boolean {
    return this.m_direction;
  }

  public SetDirection(direction: boolean): boolean {
    const previous = this.m_direction;
    this.m_direction = direction;
    return previous;
  }

  /** Concrete functors determine whether they implement an end visitor. */
  public abstract ImplementsEndInterface(): boolean;
}

/**
 * Base for mutable functors.
 *
 * Declaration merging represents the C++ multiple-inheritance relationship
 * with FunctorInterface without introducing duplicate runtime visitor methods.
 */
export abstract class Functor extends FunctorBase {}
export interface Functor extends FunctorInterface {}

/** Base for const functors. */
export abstract class ConstFunctor extends FunctorBase {}
export interface ConstFunctor extends ConstFunctorInterface {}

function applyMixins(derivedCtor: any, baseCtors: any[]): void {
  for (const baseCtor of baseCtors) {
    for (const name of Object.getOwnPropertyNames(baseCtor.prototype)) {
      if (name === 'constructor') continue;
      const desc = Object.getOwnPropertyDescriptor(baseCtor.prototype, name);
      if (desc) {
        Object.defineProperty(derivedCtor.prototype, name, desc);
      }
    }
  }
}

applyMixins(Functor, [FunctorInterface]);
applyMixins(ConstFunctor, [ConstFunctorInterface]);

/** Mutable functor carrying a non-owning document reference. */
export abstract class DocFunctor extends Functor {
  protected m_doc: Doc;

  public constructor(doc: Doc) {
    super();
    this.m_doc = doc;
  }

  public GetDoc(): Doc {
    return this.m_doc;
  }
}

/** Const functor carrying a non-owning document reference. */
export abstract class DocConstFunctor extends ConstFunctor {
  protected m_doc: Doc;

  public constructor(doc: Doc) {
    super();
    this.m_doc = doc;
  }

  public GetDoc(): Doc {
    return this.m_doc;
  }
}

/** Two-phase functor mixin: collect first, process after collection completes. */
export class CollectAndProcess {
  private m_processingData = false;

  public IsCollectingData(): boolean {
    return !this.m_processingData;
  }

  public IsProcessingData(): boolean {
    return this.m_processingData;
  }

  public SetDataCollectionCompleted(): void {
    this.m_processingData = true;
  }
}
