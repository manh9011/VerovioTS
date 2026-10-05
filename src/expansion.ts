import { ObjectFactory } from './object.js';
import { PlistInterface, PlistObjectLike } from './plistinterface.js';
import { SystemElement } from './systemelement.js';
import { ClassId, FunctorCode } from './vrvdef.js';

/**
 * Pure TypeScript translation of Verovio's Expansion class from
 * include/vrv/expansion.h and src/expansion.cpp.
 *
 * Implements the <expansion> element in MEI.
 */
export class Expansion extends SystemElement {
  private m_plistInterface!: PlistInterface;

  public constructor() {
    super(ClassId.EXPANSION);
    this.m_plistInterface = new PlistInterface();
    this.RegisterInterface(this.m_plistInterface.GetAttClasses(), this.m_plistInterface.IsInterface());
    this.Reset();
  }

  public override GetClassName(): string {
    return 'expansion';
  }

  public override Reset(): void {
    super.Reset();
    this.m_plistInterface ??= new PlistInterface();
    this.m_plistInterface.Reset();
  }

  public override Clone(): Expansion {
    const clone = new Expansion();
    clone.AssignFrom(this);
    if (this.HasPlist()) {
      clone.SetPlist(this.GetPlist());
    }
    for (const ref of this.GetConstRefs()) {
      clone.SetRef(ref);
    }
    return clone;
  }

  // Interface accessors
  public override GetPlistInterface(): PlistInterface {
    this.m_plistInterface ??= new PlistInterface();
    return this.m_plistInterface;
  }

  // PlistInterface forwarding
  public ResetPlist(): void {
    this.GetPlistInterface().ResetPlist();
  }

  public SetPlist(plist: readonly string[]): void {
    this.GetPlistInterface().SetPlist(plist);
  }

  public GetPlist(): string[] {
    return this.GetPlistInterface().GetPlist();
  }

  public HasPlist(): boolean {
    return this.GetPlistInterface().HasPlist();
  }

  public AddRef(ref: string): void {
    this.GetPlistInterface().AddRef(ref);
  }

  public AddRefAllowDuplicate(ref: string): void {
    this.GetPlistInterface().AddRefAllowDuplicate(ref);
  }

  public SetRef(object: PlistObjectLike): void {
    this.GetPlistInterface().SetRef(object);
  }

  public GetRefs(): PlistObjectLike[] {
    return this.GetPlistInterface().GetRefs();
  }

  public GetConstRefs(): readonly PlistObjectLike[] {
    return this.GetPlistInterface().GetConstRefs();
  }

  // Functor visitation
  public override Accept(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitExpansion', this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitExpansionEnd', this);
  }

  public override AcceptConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitExpansion', this);
  }

  public override AcceptEndConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitExpansionEnd', this);
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

ObjectFactory.GetInstance().Register('expansion', ClassId.EXPANSION, () => new Expansion());
