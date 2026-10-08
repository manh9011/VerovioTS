import {
  ArrayOfStrAttr,
  BACKWARD,
  ClassId,
  ClassIdLike,
  FORWARD,
  FunctorCode,
  InterfaceId,
  UNLIMITED_DEPTH,
  VRV_UNSET,
} from './core-types';
import { BoundingBox } from './boundingbox';
import { Att } from './att.js';
import { AttConverterBase } from './attconverter.js';
import { AttModule } from './attmodule.js';
import { ClassIdComparison, Comparison, IsEditorialElementComparison } from './comparison.js';
import { Functor, ConstFunctor } from './functor.js';
import {
  AddToFlatListFunctor,
  FindAllByComparisonFunctor,
  FindAllBetweenFunctor,
  FindAllConstByComparisonFunctor,
  FindByComparisonFunctor,
  FindByIDFunctor,
  FindExtremeByComparisonFunctor,
  FindNextChildByComparisonFunctor,
  FindPreviousChildByComparisonFunctor,
} from './findfunctor.js';
import { BaseEncodeInt, LogDebug, LogError, LogInfo, LogWarning } from './vrv.js';
import { ReorderByXPosFunctor } from './miscfunctor.js';
import { ResetDataFunctor } from './resetfunctor.js';
import { SaveFunctor } from './savefunctor.js';
import type { Filters } from './comparison.js';
import type { FacsimileInterface } from './facsimileinterface.js';
import type { Resources } from './resources.js';
import type { Output } from './iobase.js';
import type { VisibilityDrawingInterface } from './drawinginterface.js';
type FilterMock = Filters;
type FacsimileInterfaceMock = FacsimileInterface;
type ResourcesMock = Resources;
type OutputMock = Output;
type VisibilityDrawingInterfaceMock = VisibilityDrawingInterface;

export type ArrayOfObjects = VrvObject[];
export type ArrayOfConstObjects = readonly VrvObject[];
export type ListOfObjects = VrvObject[];
export type ListOfConstObjects = readonly VrvObject[];

export function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/**
 * Pure-TypeScript translation of Verovio's `Object` tree base class from `src/object.cpp`.
 *
 * The translated class intentionally retains Verovio method names and state semantics.
 * JavaScript garbage collection replaces C++ `delete`; explicit parent/ownership state is retained.
 */
export class VrvObject extends BoundingBox {
  private static s_objectCounter = 0;
  private static s_xmlIDCounter = 0 >>> 0;

  public static readonly UNLIMITED_DEPTH = UNLIMITED_DEPTH;
  public static readonly FORWARD = FORWARD;
  public static readonly BACKWARD = BACKWARD;

  public m_unsupported: ArrayOfStrAttr = [];

  private m_children: ArrayOfObjects = [];
  private m_parent: VrvObject | null = null;
  private m_classId: ClassIdLike = ClassId.OBJECT;
  private m_id = '';
  private m_isReferenceObject = false;
  private m_isModified = true;
  private m_iteratorCurrent = -1;
  private m_iteratorElementType: ClassIdLike = ClassId.UNSPECIFIED;
  private m_attClasses: number[] = [];
  private m_attClassSet = new Set<number>();
  private m_interfaces: InterfaceId[] = [];
  private m_comment = '';
  private m_closingComment = '';
  private m_isAttribute = false;
  private m_isExpansion = false;
  private m_plistReferences: VrvObject[] | null = null;

  public constructor(classId: ClassIdLike = ClassId.OBJECT) {
    super();
    if (VrvObject.s_objectCounter++ === 0) VrvObject.SeedID();
    this.Init(classId);
  }

  public GetClassId(): ClassIdLike { return this.m_classId; }
  public GetClassName(): string { return '[MISSING]'; }

  public Clone(): VrvObject {
    throw new Error('Object::Clone() must be overridden by derived classes.');
  }

  public CopyChildren(): boolean { return true; }

  public SetAsReferenceObject(): void {
    assertInvariant(this.m_children.length === 0, 'Reference object must be set before children are added.');
    this.m_isReferenceObject = true;
  }

  public IsReferenceObject(): boolean { return this.m_isReferenceObject; }
  public IsFloatingObject(): boolean { return this.IsSystemElement() || this.IsControlElement(); }

  public IsControlElement(): boolean { return VrvObject.IsControlElement(this.m_classId); }
  public IsEditorialElement(): boolean { return VrvObject.IsEditorialElement(this.m_classId); }
  public IsLayerElement(): boolean { return VrvObject.IsLayerElement(this.m_classId); }
  public IsLyricElement(): boolean { return VrvObject.IsLyricElement(this.m_classId); }
  public IsPageElement(): boolean { return VrvObject.IsPageElement(this.m_classId); }
  public IsRunningElement(): boolean { return VrvObject.IsRunningElement(this.m_classId); }
  public IsScoreDefElement(): boolean { return VrvObject.IsScoreDefElement(this.m_classId); }
  public IsSystemElement(): boolean { return VrvObject.IsSystemElement(this.m_classId); }
  public IsTextElement(): boolean { return VrvObject.IsTextElement(this.m_classId); }

  public IsMilestoneElement(): boolean {
    if (this.IsEditorialElement() || this.Is(ClassId.ENDING) || this.Is(ClassId.SECTION)) {
      const iface = (this as any).GetSystemMilestoneInterface?.() ?? (this as any).m_systemMilestoneInterface;
      if (iface && typeof iface.IsSystemMilestone === 'function') {
        return iface.IsSystemMilestone();
      }
      return typeof (this as any).IsSystemMilestone === 'function' && (this as any).IsSystemMilestone();
    } else if (this.Is(ClassId.MDIV) || this.Is(ClassId.SCORE)) {
      const iface = (this as any).GetPageMilestoneInterface?.() ?? (this as any).m_pageMilestoneInterface;
      if (iface && typeof iface.IsPageMilestone === 'function') {
        return iface.IsPageMilestone();
      }
      return typeof (this as any).IsPageMilestone === 'function' && (this as any).IsPageMilestone();
    }
    return false;
  }

  public GetMilestoneEnd(): VrvObject | boolean | null {
    if (this.IsEditorialElement() || this.Is(ClassId.ENDING) || this.Is(ClassId.SECTION)) {
      const iface = (this as any).GetSystemMilestoneInterface?.() ?? (this as any).m_systemMilestoneInterface;
      if (iface && typeof iface.GetEnd === 'function') {
        return iface.GetEnd();
      }
      if (typeof (this as any).GetEnd === 'function') return (this as any).GetEnd();
      assertInvariant(false, 'SystemMilestoneInterface required.');
    } else if (this.Is(ClassId.MDIV) || this.Is(ClassId.SCORE)) {
      const iface = (this as any).GetPageMilestoneInterface?.() ?? (this as any).m_pageMilestoneInterface;
      if (iface && typeof iface.GetEnd === 'function') {
        return iface.GetEnd();
      }
      if (typeof (this as any).GetEnd === 'function') return (this as any).GetEnd();
      assertInvariant(false, 'PageMilestoneInterface required.');
    }
    return null;
  }

  public static IsControlElement(classId: ClassIdLike): boolean {
    return classId > ClassId.CONTROL_ELEMENT && classId < ClassId.CONTROL_ELEMENT_max;
  }
  public static IsEditorialElement(classId: ClassIdLike): boolean {
    return classId > ClassId.EDITORIAL_ELEMENT && classId < ClassId.EDITORIAL_ELEMENT_max;
  }
  public static IsLayerElement(classId: ClassIdLike): boolean {
    return classId > ClassId.LAYER_ELEMENT && classId < ClassId.LAYER_ELEMENT_max;
  }
  public static IsLyricElement(classId: ClassIdLike): boolean {
    return classId > ClassId.LYRIC_ELEMENT && classId < ClassId.LYRIC_ELEMENT_max;
  }
  public static IsPageElement(classId: ClassIdLike): boolean {
    return classId > ClassId.PAGE_ELEMENT && classId < ClassId.PAGE_ELEMENT_max;
  }
  public static IsRunningElement(classId: ClassIdLike): boolean {
    return classId > ClassId.RUNNING_ELEMENT && classId < ClassId.RUNNING_ELEMENT_max;
  }
  public static IsScoreDefElement(classId: ClassIdLike): boolean {
    return classId > ClassId.SCOREDEF_ELEMENT && classId < ClassId.SCOREDEF_ELEMENT_max;
  }
  public static IsSystemElement(classId: ClassIdLike): boolean {
    return classId > ClassId.SYSTEM_ELEMENT && classId < ClassId.SYSTEM_ELEMENT_max;
  }
  public static IsTextElement(classId: ClassIdLike): boolean {
    return classId > ClassId.TEXT_ELEMENT && classId < ClassId.TEXT_ELEMENT_max;
  }

  public RegisterAttClass(attClassId: number): void { this.m_attClasses.push(attClassId); this.m_attClassSet.add(attClassId); }
  public HasAttClass(attClassId: number): boolean { return this.m_attClassSet.has(attClassId); }
  public RegisterInterface(attClasses: number[], interfaceId: InterfaceId): void {
    this.m_attClasses.push(...attClasses);
    for (const c of attClasses) this.m_attClassSet.add(c);
    this.m_interfaces.push(interfaceId);
  }
  public HasInterface(interfaceId: InterfaceId): boolean { return this.m_interfaces.includes(interfaceId); }

  public GetAltSymInterface(): unknown { return null; }
  public GetAreaPosInterface(): unknown { return null; }
  public GetBeamDrawingInterface(): unknown { return null; }
  public GetDurationInterface(): unknown { return null; }
  public GetLinkingInterface(): unknown { return null; }
  public GetFacsimileInterface(): FacsimileInterfaceMock | null { return null; }
  public GetOffsetInterface(): unknown { return null; }
  public GetOffsetSpanningInterface(): unknown { return null; }
  public GetPitchInterface(): unknown { return null; }
  public GetPlistInterface(): unknown { return null; }
  public GetPositionInterface(): unknown { return null; }
  public GetScoreDefInterface(): unknown { return null; }
  public GetStemmedDrawingInterface(): unknown { return null; }
  public GetTextDirInterface(): unknown { return null; }
  public GetTimePointInterface(): unknown { return null; }
  public GetTimeSpanningInterface(): unknown { return null; }
  public GetVisibilityDrawingInterface(): VisibilityDrawingInterfaceMock | null { return null; }

  public GetDocResources(): ResourcesMock | null {
    let object: VrvObject | null = this;
    while (object && !object.Is(ClassId.DOC)) object = object.GetParent();
    if (object && typeof (object as any).GetResources === 'function') {
      return (object as any).GetResources() as ResourcesMock;
    }
    LogWarning('Requested resources unavailable.');
    return null;
  }

  public Reset(): void {
    this.ClearChildren();
    this.ResetBoundingBox();
  }

  public CloneReset(): void {
    this.Modify();
    const resetData = new ResetDataFunctor();
    this.Process(resetData, 0);
  }

  public AssignFrom(source: VrvObject): VrvObject {
    if (this !== source) {
      this.ClearChildren();
      this.ResetBoundingBox();
      this.m_classId = source.m_classId;
      this.m_parent = null;
      this.m_isAttribute = source.m_isAttribute;
      this.m_isModified = true;
      this.m_isReferenceObject = source.m_isReferenceObject;
      this.m_attClasses = [...source.m_attClasses];
      this.m_attClassSet = new Set(source.m_attClasses);
      this.m_interfaces = [...source.m_interfaces];
      this.CopyAttributesFrom(source);
      this.GenerateID();
      this.m_unsupported = source.m_unsupported.map(([k, v]) => [k, v]);
      if (source.m_plistReferences) this.m_plistReferences = [...source.m_plistReferences];
      if (source.CopyChildren()) {
        for (const current of source.m_children) {
          const clone = current.Clone();
          if (clone) {
            clone.SetParent(this);
            clone.CloneReset();
            this.m_children.push(clone);
          }
        }
      }
    }
    return this;
  }

  public MoveChildrenFrom(sourceParent: VrvObject, idx = -1, allowTypeChange = false): void {
    assertInvariant(this !== sourceParent, 'Object cannot be copied to itself');
    assertInvariant(allowTypeChange || this.m_classId === sourceParent.m_classId, 'Object must be of the same type');
    // C++ parity: Relinquish only resets parent, source array keeps stale
    // pointers; iterate by index exactly like the C++ ++i loop, then the
    // caller must ClearRelinquishedChildren on the source (C++ object.h
    // documents this contract on Relinquish).
    const size = sourceParent.m_children.length;
    for (let i = 0; i < size; ++i) {
      const child = sourceParent.Relinquish(i);
      if (!child) break;
      if (idx !== -1) {
        this.InsertChild(child, idx++);
      } else {
        this.AddChild(child);
      }
    }
  }

  public ReplaceChild(currentChild: VrvObject, replacingChild: VrvObject): void {
    const idx = this.GetChildIndex(currentChild);
    assertInvariant(idx !== -1, 'Current child is not a child of this object.');
    assertInvariant(this.GetChildIndex(replacingChild) === -1, 'Replacing child is already attached.');
    currentChild.ResetParent();
    this.m_children[idx] = replacingChild;
    replacingChild.SetParent(this);
    this.Modify();
  }

  public InsertBefore(child: VrvObject, newChild: VrvObject): void {
    const idx = this.GetChildIndex(child);
    assertInvariant(idx !== -1, 'Child not found.');
    assertInvariant(this.GetChildIndex(newChild) === -1, 'New child already belongs to parent.');
    this.InsertChild(newChild, idx);
    this.Modify();
  }

  public InsertAfter(child: VrvObject, newChild: VrvObject): void {
    const idx = this.GetChildIndex(child);
    assertInvariant(idx !== -1, 'Child not found.');
    assertInvariant(this.GetChildIndex(newChild) === -1, 'New child already belongs to parent.');
    this.InsertChild(newChild, idx + 1);
    this.Modify();
  }

  public SortChildren(comp: (a: VrvObject, b: VrvObject) => boolean): void {
    // Stable sort is available natively in modern ECMAScript engines.
    this.m_children = this.m_children
      .map((value, index) => ({ value, index }))
      .sort((a, b) => {
        if (comp(a.value, b.value)) return -1;
        if (comp(b.value, a.value)) return 1;
        return a.index - b.index;
      })
      .map((entry) => entry.value);
    this.Modify();
  }

  public MoveItselfTo(targetParent: VrvObject): void {
    assertInvariant(Boolean(targetParent), 'Target parent is required.');
    assertInvariant(Boolean(this.m_parent), 'Object must have a parent.');
    assertInvariant(this.m_parent !== targetParent, 'Object already has the target parent.');
    const parent = this.m_parent!;
    const relinquished = parent.Relinquish(this.GetIdx());
    assertInvariant(relinquished === this, 'Relinquished object mismatch.');
    targetParent.AddChild(relinquished);
  }

  public SwapID(other: VrvObject): void {
    assertInvariant(Boolean(other), 'Other object is required.');
    const swapID = this.GetID();
    this.SetID(other.GetID());
    other.SetID(swapID);
  }

  public ClearChildren(): void {
    if (this.m_isReferenceObject) {
      this.m_children = [];
      return;
    }
    for (const child of this.m_children) {
      if (child.GetParent() === this) child.ResetParent();
    }
    this.m_children = [];
  }

  public GetChildCount(classId: ClassIdLike = ClassId.UNSPECIFIED): number {
    // C++ ObjectComparison matches all children when classId is UNSPECIFIED.
    if (classId === ClassId.UNSPECIFIED) return this.m_children.length;
    return this.m_children.filter((child) => child.GetClassId() === classId).length;
  }
  public GetDescendantCount(classId: ClassIdLike): number {
    return this.FindAllDescendantsByType(classId).length;
  }

  public CopyAttributesTo(target: VrvObject): void {
    assertInvariant(this.GetClassId() === target.GetClassId(), 'Objects must have the same ClassId.');
    target.CopyAttributesFrom(this);
    target.m_unsupported = this.m_unsupported.map(([k, v]) => [k, v]);
  }

  public GetAttributes(attributes: ArrayOfStrAttr, _convertToExternal = true): number {
    attributes.length = 0;
    AttModule.GetAll(this, attributes);
    attributes.push(...this.m_unsupported.map(([k, v]) => [k, v] as [string, string]));
    return attributes.length;
  }

  public HasAttribute(attribute: string, value: string): boolean {
    const attributes: ArrayOfStrAttr = [];
    this.GetAttributes(attributes);
    return attributes.some(([key, val]) => key === attribute && val === value);
  }

  public GetFirst(classId: ClassIdLike = ClassId.UNSPECIFIED): VrvObject | null {
    this.m_iteratorElementType = classId;
    this.m_iteratorCurrent = this.findIndexFrom(0, classId);
    return this.m_iteratorCurrent === -1 ? null : this.m_children[this.m_iteratorCurrent];
  }

  public GetNext(): VrvObject | null {
    this.m_iteratorCurrent = this.findIndexFrom(this.m_iteratorCurrent + 1, this.m_iteratorElementType);
    return this.m_iteratorCurrent === -1 ? null : this.m_children[this.m_iteratorCurrent];
  }

  public GetNextOf(child: VrvObject, classId: ClassIdLike = ClassId.UNSPECIFIED): VrvObject | null {
    const idx = this.GetChildIndex(child);
    if (idx === -1) return null;
    const found = this.findIndexFrom(idx + 1, classId);
    return found === -1 ? null : this.m_children[found];
  }

  public GetPrevious(child: VrvObject, classId: ClassIdLike = ClassId.UNSPECIFIED): VrvObject | null {
    const idx = this.GetChildIndex(child);
    if (idx === -1) return null;
    for (let i = idx - 1; i >= 0; --i) {
      if (classId === ClassId.UNSPECIFIED || this.m_children[i].GetClassId() === classId) return this.m_children[i];
    }
    return null;
  }

  public GetLast(classId: ClassIdLike = ClassId.UNSPECIFIED): VrvObject | null {
    for (let i = this.m_children.length - 1; i >= 0; --i) {
      if (classId === ClassId.UNSPECIFIED || this.m_children[i].GetClassId() === classId) return this.m_children[i];
    }
    return null;
  }

  public GetParent(): VrvObject | null { return this.m_parent; }
  public GetIdx(): number {
    assertInvariant(Boolean(this.m_parent), 'Parent required for GetIdx.');
    return this.m_parent!.GetChildIndex(this);
  }

  public SetParent(parent: VrvObject): void {
    // C++ Object::SetParent has assert(!m_parent), but asserts are compiled
    // out in release/WASM builds, so re-parenting silently overwrites.
    // Match WASM ground truth: assign directly.
    this.m_parent = parent;
  }

  public ResetParent(): void { this.m_parent = null; }

  public IsSupportedChild(_classId: ClassIdLike): boolean {
    LogDebug('Method for adding child to %s should be overridden', this.GetClassName());
    return false;
  }
  public AddChildAdditionalCheck(_child: VrvObject): boolean { return true; }
  public GetInsertOrderFor(_classId: ClassIdLike): number { return VRV_UNSET; }

  public AddChild(child: VrvObject): boolean {
    if (!this.IsSupportedChild(child.GetClassId()) || !this.AddChildAdditionalCheck(child)) {
      LogError("Adding '%s' to a '%s'", child.GetClassName(), this.GetClassName());
      return false;
    }
    if (!this.IsReferenceObject()) child.SetParent(this);
    const insertOrder = this.GetInsertOrderFor(child.GetClassId());
    if (this.m_children.length === 0 || insertOrder === VRV_UNSET) {
      this.m_children.push(child);
    } else {
      let i = 0;
      for (const existingChild of this.m_children) {
        if (Math.abs(this.GetInsertOrderFor(existingChild.GetClassId())) > insertOrder) break;
        ++i;
      }
      i = Math.min(i, this.m_children.length);
      this.m_children.splice(i, 0, child);
    }
    this.Modify();
    return true;
  }

  public GetInsertOrderForIn(classId: ClassIdLike, order: ClassIdLike[]): number {
    const idx = order.indexOf(classId);
    return idx === -1 ? VRV_UNSET : idx;
  }

  public GetDrawingX(): number {
    assertInvariant(Boolean(this.m_parent), 'Parent required for GetDrawingX.');
    return this.m_parent!.GetDrawingX();
  }
  public GetDrawingY(): number {
    assertInvariant(Boolean(this.m_parent), 'Parent required for GetDrawingY.');
    return this.m_parent!.GetDrawingY();
  }

  public ResetCachedDrawingX(): void {
    // C++ resets the object's own cache first, then cascades to children.
    if ('m_cachedDrawingX' in this) {
      (this as unknown as { m_cachedDrawingX: number }).m_cachedDrawingX = VRV_UNSET;
    }
    for (const child of this.m_children) child.ResetCachedDrawingX();
  }
  public ResetCachedDrawingY(): void {
    if ('m_cachedDrawingY' in this) {
      (this as unknown as { m_cachedDrawingY: number }).m_cachedDrawingY = VRV_UNSET;
    }
    for (const child of this.m_children) child.ResetCachedDrawingY();
  }

  public GetChildIndex(child: VrvObject): number { return this.m_children.indexOf(child); }

  public GetDescendantIndex(child: VrvObject, classId: ClassIdLike, depth: number): number {
    return this.FindAllDescendantsByType(classId, true, depth).indexOf(child);
  }

  public InsertChild(element: VrvObject, idx: number): void {
    assertInvariant(element.GetParent() === null, 'Inserted element must not have a parent.');
    element.SetParent(this);
    if (idx >= this.m_children.length) {
      this.m_children.push(element);
      return;
    }
    this.m_children.splice(Math.max(0, idx), 0, element);
  }

  public RotateChildren(first: number, middle: number, last: number): void {
    const head = this.m_children.slice(first, middle);
    const tail = this.m_children.slice(middle, last);
    this.m_children.splice(first, last - first, ...tail, ...head);
  }

  public DetachChild(idx: number): VrvObject | null {
    if (idx < 0 || idx >= this.m_children.length) return null;
    const child = this.m_children[idx];
    child.ResetParent();
    this.m_children.splice(idx, 1);
    return child;
  }

  public ReplaceWithCopyOf(source: VrvObject): void {
    const parent = this.GetParent();
    this.AssignFrom(source);
    this.CloneReset();
    if (parent) this.SetParent(parent);
  }

  public HasDescendant(child: VrvObject, deepness = UNLIMITED_DEPTH): boolean {
    for (const candidate of this.m_children) {
      if (child === candidate) return true;
      if (deepness === 0) return false;
      if (candidate.HasDescendant(child, deepness - 1)) return true;
    }
    return false;
  }

  public Relinquish(idx: number): VrvObject | null {
    if (idx < 0 || idx >= this.m_children.length) return null;
    const child = this.m_children[idx];
    child.ResetParent();
    return child;
  }

  public ClearRelinquishedChildren(): void {
    this.m_children = this.m_children.filter((child) => child.GetParent() === this);
  }

  public DeleteChild(child: VrvObject): boolean {
    const idx = this.GetChildIndex(child);
    if (idx === -1) {
      throw new Error('Object child not found.');
    }
    this.m_children.splice(idx, 1);
    if (child.GetParent() === this) child.ResetParent();
    this.Modify();
    return true;
  }

  public DeleteChildrenByComparison(comparison: Comparison): number {
    let count = 0;
    const retained: VrvObject[] = [];
    for (const child of this.m_children) {
      if (comparison.call(child)) {
        if (child.GetParent() === this) child.ResetParent();
        ++count;
      } else {
        retained.push(child);
      }
    }
    this.m_children = retained;
    if (count > 0) this.Modify();
    return count;
  }

  public FindDescendantByID(id: string, deepness = UNLIMITED_DEPTH, direction = FORWARD): VrvObject | null {
    const findByID = new FindByIDFunctor(id);
    findByID.SetDirection(direction);
    this.Process(findByID, deepness, true);
    return findByID.GetElement() as VrvObject | null;
  }

  public FindDescendantByType(classId: ClassIdLike, deepness = UNLIMITED_DEPTH, direction = FORWARD): VrvObject | null {
    const comparison = new ClassIdComparison(classId);
    return this.FindDescendantByComparison(comparison, deepness, direction);
  }

  public FindDescendantByComparison(comparison: Comparison, deepness = UNLIMITED_DEPTH, direction = FORWARD): VrvObject | null {
    const functor = new FindByComparisonFunctor(comparison);
    functor.SetDirection(direction);
    this.Process(functor, deepness, true);
    return functor.GetElement() as VrvObject | null;
  }

  public FindDescendantExtremeByComparison(comparison: Comparison, deepness = UNLIMITED_DEPTH, direction = FORWARD): VrvObject | null {
    const functor = new FindExtremeByComparisonFunctor(comparison);
    functor.SetDirection(direction);
    this.Process(functor, deepness, true);
    return functor.GetElement() as VrvObject | null;
  }

  public FindAllDescendantsByType(classId: ClassIdLike, continueDepthSearchForMatches = true, deepness = UNLIMITED_DEPTH): VrvObject[] {
    const descendants: VrvObject[] = [];
    const comparison = new ClassIdComparison(classId);
    const functor = new FindAllByComparisonFunctor(comparison, descendants);
    functor.SetContinueDepthSearchForMatches(continueDepthSearchForMatches);
    this.Process(functor, deepness, true);
    return descendants;
  }

  public FindAllDescendantsByComparison(objects: VrvObject[], comparison: Comparison, deepness = UNLIMITED_DEPTH, direction = FORWARD, clear = true): void {
    if (clear) objects.length = 0;
    const functor = new FindAllByComparisonFunctor(comparison, objects);
    functor.SetDirection(direction);
    this.Process(functor, deepness, true);
  }

  public FindAllDescendantsBetween(objects: VrvObject[], comparison: Comparison, start: VrvObject, end: VrvObject, clear = true, depth = UNLIMITED_DEPTH): void {
    if (clear) objects.length = 0;
    const descendants: VrvObject[] = [];
    const functor = new FindAllBetweenFunctor(comparison, descendants, start, end);
    this.Process(functor, depth, true);
    objects.push(...descendants);
  }

  public GetChild(idx: number, classId?: ClassIdLike): VrvObject | null {
    if (classId === undefined) return idx < 0 || idx >= this.m_children.length ? null : this.m_children[idx];
    const objects = this.FindAllDescendantsByType(classId, true, 1);
    return idx < 0 || idx >= objects.length ? null : objects[idx];
  }

  public GetDirectChild(parent: VrvObject, descendant: VrvObject): VrvObject | null {
    if (!parent.HasDescendant(descendant)) return null;
    let current: VrvObject | null = descendant;
    while (current !== null && current.GetParent() !== parent) current = current.GetParent();
    return current;
  }

  public GetChildren(): VrvObject[] { return [...this.m_children]; }
  public GetChildrenForModification(): ArrayOfObjects { return this.m_children; }

  public GetAncestors(): VrvObject[] {
    const ancestors: VrvObject[] = [];
    let object = this.m_parent;
    while (object) {
      ancestors.push(object);
      object = object.m_parent;
    }
    return ancestors;
  }

  public IsAncestorOf(object: VrvObject): boolean {
    let parent = object.GetParent();
    while (parent) {
      if (this === parent) return true;
      parent = parent.GetParent();
    }
    return false;
  }

  public GetFirstAncestor(classId: ClassIdLike, maxDepth = -1): VrvObject | null {
    // ponytail: iterative walk replaces recursion; GetFirstAncestor was 1s self + 2.5s chain on 185.
    let current = this.m_parent;
    let depth = maxDepth;
    while (current && depth !== 0) {
      if (current.m_classId === classId) return current;
      current = current.m_parent;
      if (depth > 0) depth--;
    }
    return null;
  }

  public GetFirstAncestorInRange(classIdMin: ClassIdLike, classIdMax: ClassIdLike, maxDepth = -1): VrvObject | null {
    // ponytail: iterative walk, same as GetFirstAncestor (P4).
    let current = this.m_parent;
    let depth = maxDepth;
    while (current && depth !== 0) {
      if (current.m_classId > classIdMin && current.m_classId < classIdMax) return current;
      current = current.m_parent;
      if (depth > 0) depth--;
    }
    return null;
  }

  public GetLastAncestorNot(classId: ClassIdLike, maxDepth = -1): VrvObject | null {
    if (maxDepth === 0 || !this.m_parent) return null;
    if (this.m_parent.m_classId === classId) return this;
    return this.m_parent.GetLastAncestorNot(classId, maxDepth - 1);
  }

  public GetFirstChildNot(classId: ClassIdLike): VrvObject | null {
    return this.m_children.find((child) => !child.Is(classId)) ?? null;
  }

  public HasEditorialContent(): boolean {
    const editorial: VrvObject[] = [];
    const comparison = new IsEditorialElementComparison();
    this.FindAllDescendantsByComparison(editorial, comparison);
    return editorial.length > 0;
  }

  public HasNonEditorialContent(): boolean {
    const nonEditorial: VrvObject[] = [];
    const comparison = new IsEditorialElementComparison();
    comparison.ReverseComparison();
    this.FindAllDescendantsByComparison(nonEditorial, comparison);
    return nonEditorial.length > 0;
  }

  public Process(functor: any, deepness = UNLIMITED_DEPTH, skipFirst = false): void {
    // ponytail: hoist per-functor invariants out of the per-node recursion.
    // GetDirection/GetFilters/VisibleOnly/ImplementsEndInterface are loop-
    // invariant (set once before traversal) but cost a megamorphic call per
    // node per pass (mei/005: Process 209ms self). Accept/SetCode/GetCode
    // stay per-node: visitors mutate the code during traversal.
    this.processCached(functor, deepness, skipFirst, functor.GetDirection(),
      functor.GetFilters(), functor.VisibleOnly(), functor.ImplementsEndInterface());
  }

  private processCached(functor: any, deepness: number, skipFirst: boolean,
    backward: boolean, filters: FilterMock | null, visibleOnly: boolean, endIface: boolean): void {
    if (functor.GetCode() === FunctorCode.FUNCTOR_STOP) return;
    if (!skipFirst) functor.SetCode(this.Accept(functor));
    if (functor.GetCode() === FunctorCode.FUNCTOR_SIBLINGS) {
      functor.SetCode(FunctorCode.FUNCTOR_CONTINUE);
      return;
    } else if (this.m_classId > ClassId.EDITORIAL_ELEMENT && this.m_classId < ClassId.EDITORIAL_ELEMENT_max) {
      // ponytail: inlined IsEditorialElement (P30). Two static-call hops per
      // node per pass for a two-compare range check; m_classId is in scope.
      ++deepness;
    }
    if (deepness === 0) return;
    --deepness;
    // ponytail: SkipChildren returns false unconditionally when visibleOnly
    // is false, and FiltersApply(null) is true. Skip both calls per node in
    // that common case (mei/005: processCached 190ms self).
    if (visibleOnly ? !this.SkipChildren(true) : true) {
      // NB: BACKWARD === false; forward (true) keeps document order.
      // ponytail: index loops replace [...m_children].reverse() (Q11).
      // Old code allocated + copied the child array per node per pass;
      // reverse-order iteration walks indexes directly, zero alloc.
      const kids = this.m_children;
      if (backward) {
        if (filters) {
          for (let i = 0, n = kids.length; i < n; ++i) {
            const child = kids[i];
            if (this.FiltersApply(filters, child)) child.processCached(functor, deepness, false, backward, filters, visibleOnly, endIface);
          }
        }
        else {
          for (let i = 0, n = kids.length; i < n; ++i) kids[i].processCached(functor, deepness, false, backward, filters, visibleOnly, endIface);
        }
      }
      else if (filters) {
        for (let i = kids.length - 1; i >= 0; --i) {
          const child = kids[i];
          if (this.FiltersApply(filters, child)) child.processCached(functor, deepness, false, backward, filters, visibleOnly, endIface);
        }
      }
      else {
        for (let i = kids.length - 1; i >= 0; --i) kids[i].processCached(functor, deepness, false, backward, filters, visibleOnly, endIface);
      }
    }
    if (endIface && !skipFirst) functor.SetCode(this.AcceptEnd(functor));
  }

  public Accept(functor: any): FunctorCode { return functor.VisitObject(this); }
  public AcceptEnd(functor: any): FunctorCode { return functor.VisitObjectEnd(this); }

  private SkipChildren(visibleOnly: boolean): boolean {
    if (visibleOnly) {
      if (this.IsEditorialElement() || this.IsAnyOf([ClassId.MDIV, ClassId.STAFF]) || this.IsSystemElement()) {
        const iface = this.GetVisibilityDrawingInterface();
        if (iface && iface.IsHidden()) return true;
      }
    }
    return false;
  }

  private FiltersApply(filters: FilterMock | null, object: VrvObject): boolean {
    return filters ? filters.Apply(object) : true;
  }

  public SaveObject(output: OutputMock): void {
    const save = new SaveFunctor(output);
    save.SetVisibleOnly(false);
    this.Process(save);
  }

  public ReorderByXPos(): void {
    const reorder = new ReorderByXPosFunctor();
    this.Process(reorder);
  }

  public FindNextChild(comp: Comparison, start: VrvObject): VrvObject | null {
    const functor = new FindNextChildByComparisonFunctor(comp, start);
    this.Process(functor);
    return functor.GetElement() as VrvObject | null;
  }

  public FindPreviousChild(comp: Comparison, start: VrvObject): VrvObject | null {
    const functor = new FindPreviousChildByComparisonFunctor(comp, start);
    this.Process(functor);
    return functor.GetElement() as VrvObject | null;
  }

  public HasPlistReferences(): boolean { return this.m_plistReferences !== null; }
  public ResetPlistReferences(): void { this.m_plistReferences = null; }
  public GetPlistReferences(): readonly VrvObject[] | null { return this.m_plistReferences; }
  public AddPlistReference(object: VrvObject): void {
    (this.m_plistReferences ??= []).push(object);
  }

  public LogDebugTree(maxDepth = UNLIMITED_DEPTH, level = 0): void {
    LogDebug(`${'\t'.repeat(level)}${this.LogDebugTreeMsg()}`);
    if (maxDepth === level) return;
    for (const child of this.m_children) child.LogDebugTree(maxDepth, level + 1);
  }

  public LogDebugTreeMsg(): string { return this.GetClassName(); }

  public static SeedID(seed = 0): void {
    if (seed === 0) {
      const bytes = new Uint32Array(1);
      if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') crypto.getRandomValues(bytes);
      else bytes[0] = Math.floor(Math.random() * 0x100000000);
      VrvObject.s_xmlIDCounter = bytes[0] >>> 0;
    } else {
      VrvObject.s_xmlIDCounter = VrvObject.Hash(seed) >>> 0;
    }
  }

  public static GenerateHashID(): string {
    const nr = VrvObject.Hash((VrvObject.s_xmlIDCounter + 1) >>> 0);
    VrvObject.s_xmlIDCounter = (VrvObject.s_xmlIDCounter + 1) >>> 0;
    return BaseEncodeInt(nr, 36);
  }

  public static Hash(number: number, reverse = false): number {
    const magicNumber = reverse ? 0x119de1f3 : 0x45d9f3b;
    number = Math.imul((number >>> 16) ^ (number >>> 0), magicNumber) >>> 0;
    number = Math.imul((number >>> 16) ^ number, magicNumber) >>> 0;
    number = ((number >>> 16) ^ number) >>> 0;
    return number;
  }

  public static sortByUlx(a: VrvObject, b: VrvObject): boolean {
    const fa = a.GetFacsimileInterface();
    const fb = b.GetFacsimileInterface();
    const aza = fa?.HasFacs() ? fa.GetZone() : null;
    const azb = fb?.HasFacs() ? fb.GetZone() : null;
    if (!aza || !azb) {
      if (!aza) LogInfo(`No available facsimile interface for ${a.GetID()}`);
      if (!azb) LogInfo(`No available facsimile interface for ${b.GetID()}`);
      return false;
    }
    return aza.GetUlx() < azb.GetUlx();
  }

  public static IsPreOrdered(left: VrvObject, right: VrvObject): boolean {
    // C++ builds [left, parent, ..., root] and iterates with rbegin (root first).
    // GetAncestors returns [parent, ..., root], so root-first order is reversed + self.
    const ancestorsLeft = [...left.GetAncestors()].reverse();
    ancestorsLeft.push(left);
    if (ancestorsLeft.includes(right)) return false;
    const ancestorsRight = [...right.GetAncestors()].reverse();
    ancestorsRight.push(right);
    if (ancestorsRight.includes(left)) return true;
    let i = 0;
    while (i < ancestorsLeft.length && i < ancestorsRight.length && ancestorsLeft[i] === ancestorsRight[i]) ++i;
    const leftSibling = ancestorsLeft[i];
    const rightSibling = ancestorsRight[i];
    const commonParent = leftSibling?.GetParent() ?? null;
    return commonParent ? commonParent.GetChildIndex(leftSibling) < commonParent.GetChildIndex(rightSibling) : true;
  }

  public GetID(): string { return this.m_id; }
  public SetID(id: string): void { this.m_id = id; }
  public ResetID(): void { this.GenerateID(); }
  public IsModified(): boolean { return this.m_isModified; }
  public Modify(modified = true): void {
    if (this.m_parent && modified) this.m_parent.Modify();
    this.m_isModified = modified;
  }
  public IsAttribute(): boolean { return this.m_isAttribute; }
  public SetAttribute(value: boolean): void { this.m_isAttribute = value; }
  public IsExpansion(): boolean { return this.m_isExpansion; }
  public SetExpansion(value: boolean): void { this.m_isExpansion = value; }

  public GetComment(): string { return this.m_comment; }
  public SetComment(comment: string): void { this.m_comment = comment; }
  public HasComment(): boolean { return this.m_comment !== ''; }
  public GetClosingComment(): string { return this.m_closingComment; }
  public SetClosingComment(comment: string): void { this.m_closingComment = comment; }
  public HasClosingComment(): boolean { return this.m_closingComment !== ''; }

  public FillFlatList(flatList: VrvObject[]): void {
    const functor = new AddToFlatListFunctor(flatList);
    this.Process(functor);
  }

  private Init(classId: ClassIdLike): void {
    this.m_classId = classId;
    this.m_parent = null;
    this.m_isAttribute = false;
    this.m_isModified = true;
    this.m_isReferenceObject = false;
    this.m_comment = '';
    this.m_closingComment = '';
    this.GenerateID();
    this.Reset();
  }

  private GenerateID(): void {
    const letter = String.fromCharCode('a'.charCodeAt(0) + (VrvObject.s_xmlIDCounter % 26));
    this.m_id = `${letter}${VrvObject.GenerateHashID()}`;
  }

  private CopyAttributesFrom(source: VrvObject): void {
    AttModule.CopyAll(source, this);
  }

  private findIndexFrom(start: number, classId: ClassIdLike): number {
    for (let i = Math.max(0, start); i < this.m_children.length; ++i) {
      if (classId === ClassId.UNSPECIFIED || this.m_children[i].GetClassId() === classId) return i;
    }
    return -1;
  }
}

export class ObjectListInterface {
  protected m_list: VrvObject[] = [];
  private m_owner: VrvObject | null = null;

  /** Explicitly bind the list interface to its owning VrvObject (composition adaptation). */
  public SetInterfaceOwner(owner: VrvObject): void { this.m_owner = owner; }

  public ResetList(): void {
    const owner = this.GetInterfaceOwner();
    if (!owner.IsModified()) return;
    owner.Modify(false);
    this.m_list = [];
    owner.FillFlatList(this.m_list);
    this.FilterList(this.m_list);
  }

  public GetList(): VrvObject[] {
    this.ResetList();
    return [...this.m_list];
  }
  public HasEmptyList(): boolean { this.ResetList(); return this.m_list.length === 0; }
  public GetListSize(): number { this.ResetList(); return this.m_list.length; }
  public GetListFront(): VrvObject {
    this.ResetList();
    assertInvariant(this.m_list.length > 0, 'List is empty.');
    return this.m_list[0];
  }
  public GetListBack(): VrvObject {
    this.ResetList();
    assertInvariant(this.m_list.length > 0, 'List is empty.');
    return this.m_list[this.m_list.length - 1];
  }
  public GetListIndex(element: VrvObject): number { return this.m_list.indexOf(element); }

  public GetListFirst(startFrom: VrvObject, classId: ClassIdLike = ClassId.UNSPECIFIED): VrvObject | null {
    this.ResetList();
    let idx = this.GetListIndex(startFrom);
    if (idx === -1) return null;
    while (idx < this.m_list.length) {
      if (classId === ClassId.UNSPECIFIED || this.m_list[idx].GetClassId() === classId) return this.m_list[idx];
      ++idx;
    }
    return null;
  }

  public GetListFirstBackward(startFrom: VrvObject, classId: ClassIdLike = ClassId.UNSPECIFIED): VrvObject | null {
    this.ResetList();
    let idx = this.GetListIndex(startFrom);
    if (idx === -1) return null;
    while (idx >= 0) {
      if (classId === ClassId.UNSPECIFIED || this.m_list[idx].GetClassId() === classId) return this.m_list[idx];
      --idx;
    }
    return null;
  }

  public GetListPrevious(element: VrvObject): VrvObject | null {
    this.ResetList();
    const idx = this.GetListIndex(element);
    return idx > 0 ? this.m_list[idx - 1] : null;
  }

  public GetListNext(element: VrvObject): VrvObject | null {
    this.ResetList();
    const idx = this.GetListIndex(element);
    return idx >= 0 && idx + 1 < this.m_list.length ? this.m_list[idx + 1] : null;
  }

  protected FilterList(_childList: VrvObject[]): void {}
  protected GetInterfaceOwner(): VrvObject {
    if (!this.m_owner) {
      const possibleOwner = this as unknown as VrvObject;
      assertInvariant(possibleOwner instanceof VrvObject, 'ObjectListInterface must be mixed into a VrvObject-derived class.');
      this.m_owner = possibleOwner;
    }
    return this.m_owner;
  }
}

export class TextListInterface extends ObjectListInterface {
  public GetText(): string {
    let concatText = '';
    for (const child of this.GetList()) {
      if (child.Is(ClassId.LB)) continue;
      concatText += this.ConcatChildText(child);
    }
    return concatText;
  }

  public GetTextLines(lines: string[]): void {
    let concatText = '';
    for (const child of this.GetList()) {
      if (child.Is(ClassId.LB) && concatText.length > 0) {
        lines.push(concatText);
        concatText = '';
        continue;
      }
      concatText += this.ConcatChildText(child);
    }
    if (concatText.length > 0) lines.push(concatText);
  }

  // C++ `concatText += childText->GetText()` concatenates std::u32string code points;
  // TS `Text.GetText()` models that u32string as number[] (UTF-32 code points), so decode
  // instead of letting `+=` coerce the array into a comma-separated string.
  private ConcatChildText(child: VrvObject): string {
    const text = child as any as { GetText?: () => string | number[] };
    assertInvariant(typeof text.GetText === 'function', 'Text child must provide GetText().');
    const value = text.GetText!();
    return typeof value === 'string' ? value : String.fromCodePoint(...value);
  }

  protected override FilterList(childList: VrvObject[]): void {
    for (let i = childList.length - 1; i >= 0; --i) {
      if (!(childList[i].Is(ClassId.LB) || childList[i].Is(ClassId.TEXT))) childList.splice(i, 1);
    }
  }
}

export class ObjectComparison extends ClassIdComparison {
  public constructor(classId: ClassIdLike) {
    super(classId as ClassId);
  }
}

type ObjectConstructor = () => VrvObject;

export class ObjectFactory {
  private static instance: ObjectFactory | null = null;
  private readonly m_ctorsRegistry = new Map<ClassIdLike, ObjectConstructor>();
  private readonly m_classIdsRegistry = new Map<string, ClassIdLike>();

  public static GetInstance(): ObjectFactory {
    return (ObjectFactory.instance ??= new ObjectFactory());
  }

  public Has(nameOrClassId: string | ClassIdLike): boolean {
    const classId = typeof nameOrClassId === 'string' ? this.m_classIdsRegistry.get(nameOrClassId) : nameOrClassId;
    return classId !== undefined && this.m_ctorsRegistry.has(classId);
  }

  public Create(nameOrClassId: string | ClassIdLike): VrvObject | null {
    const classId = typeof nameOrClassId === 'string' ? this.m_classIdsRegistry.get(nameOrClassId) : nameOrClassId;
    if (classId === undefined) {
      LogError('ClassId for %s not found', String(nameOrClassId));
      return null;
    }
    const factory = this.m_ctorsRegistry.get(classId);
    if (!factory) {
      LogError('Factory for %s not found', String(classId));
      return null;
    }
    return factory();
  }

  public GetClassId(name: string): ClassIdLike {
    const classId = this.m_classIdsRegistry.get(name);
    if (classId === undefined) {
      LogError("ClassId for '%s' not found", name);
      return ClassId.OBJECT;
    }
    return classId;
  }

  public GetClassName(classId: ClassIdLike): string {
    for (const [name, id] of this.m_classIdsRegistry) if (id === classId) return name;
    LogError("Class name for '%s' not found", String(classId));
    return '[unspecified]';
  }

  public GetClassIds(classStrings: string[], classIds: ClassIdLike[]): void {
    for (const str of classStrings) {
      const id = this.m_classIdsRegistry.get(str);
      if (id !== undefined) classIds.push(id);
      else LogDebug("Class name '%s' could not be matched", str);
    }
  }

  public Register(name: string, classId: ClassIdLike, factory: ObjectConstructor): void {
    this.m_ctorsRegistry.set(classId, factory);
    this.m_classIdsRegistry.set(name, classId);
  }
}

export { VrvObject as Object };

// ponytail: Att converter mixin replaces the per-element withConverters Proxy.
// C++ domain classes inherit Att; TS ones carry state but no StrTo*/IntToStr.
// Att methods are stateless (only call each other), so missing methods are
// filled on the prototype once. Own methods (HasAttClass, SetX, GetX) win.
// Upgrade path: real inheritance if TS domain classes ever extend Att.
{
  const skip = new Set(Object.getOwnPropertyNames(VrvObject.prototype));
  for (const proto of [AttConverterBase.prototype, Att.prototype]) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name === 'constructor' || skip.has(name)) continue;
      const desc = Object.getOwnPropertyDescriptor(proto, name);
      if (desc && typeof desc.value === 'function') {
        Object.defineProperty(VrvObject.prototype, name, desc);
        skip.add(name);
      }
    }
  }
}
