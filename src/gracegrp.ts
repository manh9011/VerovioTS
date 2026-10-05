/**
 * Pure TypeScript translation of Verovio's `src/gracegrp.cpp` / `include/vrv/gracegrp.h`.
 *
 * `GraceGrp` models the MEI `<graceGrp>` element (grace note group).
 *
 * C++ multiple inheritance (LayerElement + AttColor + AttGraced +
 * AttGraceGrpLog) is represented through explicit composition with forwarding
 * surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, VrvObject } from './object.js';
import { InstGraced, InstGraceGrpLog } from './atts_cmn.js';
import { InstColor } from './atts_shared.js';

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_COLOR = 109;
const ATT_GRACED = 22;
const ATT_GRACEGRPLOG = 21;

/** Pure TypeScript translation of Verovio's `GraceGrp`. */
export class GraceGrp extends LayerElement {
  private color?: InstColor;
  private graced?: InstGraced;
  private graceGrpLog?: InstGraceGrpLog;

  public constructor() {
    super(ClassId.GRACEGRP);
    this.ensureAttributes();
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_GRACED);
    this.RegisterAttClass(ATT_GRACEGRPLOG);
    this.Reset();
  }

  private ensureAttributes(): void {
    this.color ??= new InstColor();
    this.graced ??= new InstGraced();
    this.graceGrpLog ??= new InstGraceGrpLog();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.color!.ResetColor();
    this.graced!.ResetGraced();
    this.graceGrpLog!.ResetGraceGrpLog();
  }

  public override Clone(): VrvObject {
    const clone = new GraceGrp();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all attribute state (composition
    // adaptation: AssignFrom covers only the object-tree state).
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasGrace()) clone.SetGrace(this.GetGrace());
    if (this.HasGraceTime()) clone.SetGraceTime(this.GetGraceTime());
    if (this.HasAttach()) clone.SetAttach(this.GetAttach());
    return clone;
  }

  public override GetClassName(): string { return 'graceGrp'; }

  /**
   * Add childElement to a element.
   * C++ `IsSupportedChild`: BEAM, CHORD, NOTE, REST, SPACE + editorial elements.
   */
  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.BEAM || classId === ClassId.CHORD || classId === ClassId.NOTE
      || classId === ClassId.REST || classId === ClassId.SPACE) {
      return true;
    }
    return VrvObject.IsEditorialElement(classId);
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitGraceGrp');
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitGraceGrp');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitGraceGrpEnd');
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitGraceGrpEnd');
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

  //---------//
  // Attribute forwarding surfaces
  //---------//

  // AttColor
  public ResetColor(): void { this.color!.ResetColor(); }
  public SetColor(value: any): void { this.color!.SetColor(value); }
  public GetColor(): any { return this.color!.GetColor(); }
  public HasColor(): boolean { return this.color!.HasColor(); }

  // AttGraced (grace, grace.time)
  public ResetGraced(): void { this.graced!.ResetGraced(); }
  public SetGrace(value: any): void { this.graced!.SetGrace(value); }
  public GetGrace(): any { return this.graced!.GetGrace(); }
  public HasGrace(): boolean { return this.graced!.HasGrace(); }
  public SetGraceTime(value: any): void { this.graced!.SetGraceTime(value); }
  public GetGraceTime(): any { return this.graced!.GetGraceTime(); }
  public HasGraceTime(): boolean { return this.graced!.HasGraceTime(); }

  // AttGraceGrpLog (attach)
  public ResetGraceGrpLog(): void { this.graceGrpLog!.ResetGraceGrpLog(); }
  public SetAttach(value: any): void { this.graceGrpLog!.SetAttach(value); }
  public GetAttach(): any { return this.graceGrpLog!.GetAttach(); }
  public HasAttach(): boolean { return this.graceGrpLog!.HasAttach(); }
}

ObjectFactory.GetInstance().Register('graceGrp', ClassId.GRACEGRP, () => new GraceGrp());
