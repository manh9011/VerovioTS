/**
 * Pure TypeScript translation of Verovio's `src/editorial.cpp` / `editorial.h`.
 *
 * Multiple C++ base classes are represented explicitly through composition in
 * TypeScript. The public forwarding methods preserve the original interface
 * surfaces and ownership/reset semantics without WebAssembly.
 */
import { ObjectFactory, VrvObject } from './object.js';
import { VisibilityDrawingInterface } from './drawinginterface.js';
import { SystemMilestoneInterface } from './systemmilestone.js';
import { ClassId, FunctorCode } from './vrvdef.js';

/** Pure-TS adaptation of AttLabelled. */
export class EditorialElementLabelledAttributes {
  private m_label = '';
  public ResetLabelled(): void { this.m_label = ''; }
  public SetLabel(label: string): void { this.m_label = label; }
  public GetLabel(): string { return this.m_label; }
  public HasLabel(): boolean { return this.m_label !== ''; }
}

/** Pure-TS adaptation of AttTyped. */
export class EditorialElementTypedAttributes {
  private m_type = '';
  public ResetTyped(): void { this.m_type = ''; }
  public SetType(type: string): void { this.m_type = type; }
  public GetType(): string { return this.m_type; }
  public HasType(): boolean { return this.m_type !== ''; }
}

interface EditorialElementFunctorLike {
  VisitEditorialElement(editorialElement: EditorialElement): FunctorCode;
  VisitEditorialElementEnd(editorialElement: EditorialElement): FunctorCode;
}

interface EditorialElementConstFunctorLike {
  VisitEditorialElement(editorialElement: EditorialElement): FunctorCode;
  VisitEditorialElementEnd(editorialElement: EditorialElement): FunctorCode;
}

const ATT_LABELLED = 145;
const ATT_TYPED = 224;

/**
 * Base class for editorial content such as `<rdg>` or `<add>`.
 *
 * Mirrors C++ `EditorialElement`: an editorial element may act as either a
 * score-based container or a page-based milestone.
 */
export class EditorialElement extends VrvObject {
  private visibilityDrawingInterface: VisibilityDrawingInterface | undefined;
  private systemMilestoneInterface: SystemMilestoneInterface | undefined;
  private labelled: EditorialElementLabelledAttributes | undefined;
  private typed: EditorialElementTypedAttributes | undefined;

  public constructor(classId: ClassId = ClassId.EDITORIAL_ELEMENT) {
    super(classId);
    this.RegisterAttClass(ATT_LABELLED);
    this.RegisterAttClass(ATT_TYPED);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.visibilityDrawingInterface ??= new VisibilityDrawingInterface();
    this.systemMilestoneInterface ??= new SystemMilestoneInterface();
    this.labelled ??= new EditorialElementLabelledAttributes();
    this.typed ??= new EditorialElementTypedAttributes();
    this.visibilityDrawingInterface.Reset();
    this.systemMilestoneInterface.Reset();
    this.labelled.ResetLabelled();
    this.typed.ResetTyped();
  }

  public override GetClassName(): string { return 'editorialElement'; }

  public override Clone(): VrvObject {
    const clone = new EditorialElement(this.GetClassId() as ClassId);
    clone.AssignFrom(this);
    return clone;
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    switch (classId) {
      case ClassId.LAYER:
      case ClassId.MEASURE:
      case ClassId.SCOREDEF:
      case ClassId.STAFF:
      case ClassId.STAFFDEF:
      case ClassId.STAFFGRP:
      case ClassId.FACTORY_STAGEDIR:
        return true;
      default:
        break;
    }

    if (VrvObject.IsEditorialElement(classId)) return true;
    if (VrvObject.IsSystemElement(classId)) return true;
    if (VrvObject.IsControlElement(classId)) return true;
    if (VrvObject.IsLayerElement(classId)) return true;
    if (VrvObject.IsTextElement(classId)) return true;
    return false;
  }

  // C++ VisibilityDrawingInterface forwarding surface.
  public override GetVisibilityDrawingInterface(): VisibilityDrawingInterface {
    return this.visibilityDrawingInterface!;
  }
  public SetVisibility(visibility: Parameters<VisibilityDrawingInterface['SetVisibility']>[0]): void {
    this.visibilityDrawingInterface!.SetVisibility(visibility);
  }
  public IsHidden(): boolean { return this.visibilityDrawingInterface!.IsHidden(); }

  // C++ SystemMilestoneInterface forwarding surface.
  public SetMeasure(measure: Parameters<SystemMilestoneInterface['SetMeasure']>[0]): void {
    this.systemMilestoneInterface!.SetMeasure(measure);
  }
  public GetMeasure(): ReturnType<SystemMilestoneInterface['GetMeasure']> {
    return this.systemMilestoneInterface!.GetMeasure();
  }
  public SetEnd(end: Parameters<SystemMilestoneInterface['SetEnd']>[0]): void {
    this.systemMilestoneInterface!.SetEnd(end);
  }
  public GetEnd(): ReturnType<SystemMilestoneInterface['GetEnd']> {
    return this.systemMilestoneInterface!.GetEnd();
  }
  public IsSystemMilestone(): boolean { return this.systemMilestoneInterface!.IsSystemMilestone(); }
  public ConvertToPageBasedMilestone(object: VrvObject, parent: VrvObject): void {
    this.systemMilestoneInterface!.ConvertToPageBasedMilestone(object, parent);
  }
  public InterfacePrepareMilestones(functor: Parameters<SystemMilestoneInterface['InterfacePrepareMilestones']>[0]): FunctorCode {
    return this.systemMilestoneInterface!.InterfacePrepareMilestones(functor);
  }
  public InterfaceResetData(functor: Parameters<SystemMilestoneInterface['InterfaceResetData']>[0]): FunctorCode {
    return this.systemMilestoneInterface!.InterfaceResetData(functor);
  }

  // C++ AttLabelled forwarding surface.
  public ResetLabelled(): void { this.labelled!.ResetLabelled(); }
  public SetLabel(label: string): void { this.labelled!.SetLabel(label); }
  public GetLabel(): string { return this.labelled!.GetLabel(); }
  public HasLabel(): boolean { return this.labelled!.HasLabel(); }

  // C++ AttTyped forwarding surface.
  public ResetTyped(): void { this.typed!.ResetTyped(); }
  public SetType(type: string): void { this.typed!.SetType(type); }
  public GetType(): string { return this.typed!.GetType(); }
  public HasType(): boolean { return this.typed!.HasType(); }

  public override Accept(functor: unknown): FunctorCode {
    const typed = functor as EditorialElementFunctorLike;
    return typeof typed.VisitEditorialElement === 'function'
      ? typed.VisitEditorialElement(this)
      : FunctorCode.FUNCTOR_CONTINUE;
  }

  public AcceptConst(functor: unknown): FunctorCode {
    const typed = functor as EditorialElementConstFunctorLike;
    return typeof typed.VisitEditorialElement === 'function'
      ? typed.VisitEditorialElement(this)
      : FunctorCode.FUNCTOR_CONTINUE;
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    const typed = functor as EditorialElementFunctorLike;
    return typeof typed.VisitEditorialElementEnd === 'function'
      ? typed.VisitEditorialElementEnd(this)
      : FunctorCode.FUNCTOR_CONTINUE;
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    const typed = functor as EditorialElementConstFunctorLike;
    return typeof typed.VisitEditorialElementEnd === 'function'
      ? typed.VisitEditorialElementEnd(this)
      : FunctorCode.FUNCTOR_CONTINUE;
  }
}

ObjectFactory.GetInstance().Register(
  'editorialElement',
  ClassId.EDITORIAL_ELEMENT,
  () => new EditorialElement(),
);
