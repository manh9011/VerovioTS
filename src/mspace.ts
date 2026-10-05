/**
 * Pure TypeScript translation of Verovio's `src/mspace.cpp` /
 * `include/vrv/mspace.h`.
 *
 * `MSpace` models the MEI `<space>` element (invisible measure space).
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, VrvObject } from './object.js';
import { MRest } from './mrest.js';
import { LogError } from './vrv.js';

/**
 * Pure TypeScript translation of Verovio's `MSpace`.
 */
export class MSpace extends LayerElement {
  public constructor() {
    super(ClassId.MSPACE);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
  }

  public override Clone(): VrvObject {
    const clone = new MSpace();
    clone.AssignFrom(this);
    return clone;
  }

  public override GetClassName(): string { return 'mSpace'; }

  public override IsSupportedChild(classId: ClassId): boolean {
    return (classId === ClassId.MREST);
  }

  public override AddChild(child: VrvObject): boolean {
    if (!this.IsSupportedChild(child.GetClassId()) || !this.AddChildAdditionalCheck(child)) {
      LogError("Adding '%s' to a '%s'", child.GetClassName(), this.GetClassName());
      return false;
    }

    child.SetParent(this as unknown as VrvObject);

    this.GetChildrenForModification().push(child);
    this.Modify();

    return true;
  }

  /** Init the display mspace as mrest when the option is set */
  public InitShowMSpace(): void {
    this.ClearChildren();
    const mRest = new MRest();
    mRest.SetAttribute(true);
    if (!this.AddChild(mRest)) {
      // C++ deletes the unattached object; in TS it simply becomes
      // garbage-collectable because it never enters the tree.
    }
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitMSpace');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitMSpaceEnd');
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
}

// Factory registration (C++ `ClassRegistrar<MSpace> s_factory("mSpace", MSPACE)`).
ObjectFactory.GetInstance().Register('mSpace', ClassId.MSPACE, () => new MSpace());
