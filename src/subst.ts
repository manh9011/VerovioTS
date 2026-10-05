/**
 * Pure TypeScript translation of Verovio's `src/subst.cpp` / `include/vrv/subst.h`.
 *
 * `Subst` is the MEI `<subst>` editorial substitution element: an
 * `EditorialElement` that stores the editorial level and accepts only
 * `ADD`, `DEL`, and nested `SUBST` children.
 */
import { ObjectFactory, VrvObject } from './object.js';
import { EditorialElement } from './editorial.js';
import { ClassId, EditorialLevel, VisibilityType } from './vrvdef.js';

/** Pure-TypeScript translation of Verovio's `Subst` element. */
export class Subst extends EditorialElement {
  /** We store the level of the `<subst>` for integrity check */
  private m_level: EditorialLevel;

  public constructor(level: EditorialLevel = EditorialLevel.EDITORIAL_UNDEFINED) {
    super(ClassId.SUBST);
    this.m_level = level;
    this.Reset();
  }

  /** Getter for level **/
  public GetLevel(): EditorialLevel {
    return this.m_level;
  }

  public override Reset(): void {
    super.Reset();
  }

  public override Clone(): VrvObject {
    const clone = new Subst(this.m_level);
    clone.AssignFrom(this);
    clone.SetLabel(this.GetLabel());
    clone.SetType(this.GetType());
    clone.SetVisibility(this.IsHidden() ? VisibilityType.Hidden : VisibilityType.Visible);
    clone.SetMeasure(this.GetMeasure());
    const end = this.GetEnd();
    if (end !== null) clone.SetEnd(end);
    return clone;
  }

  public override GetClassName(): string {
    return 'subst';
  }

  /**
   * Add children to an apparatus.
   */
  public override IsSupportedChild(classId: ClassId): boolean {
    switch (classId) {
      case ClassId.ADD:
      case ClassId.DEL:
      case ClassId.SUBST:
        return true;
      default:
        return false;
    }
  }
}

ObjectFactory.GetInstance().Register('subst', ClassId.SUBST, () => new Subst());
