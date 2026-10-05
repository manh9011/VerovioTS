/**
 * Pure TypeScript translation of Verovio's `src/choice.cpp` / `include/vrv/choice.h`.
 *
 * `Choice` is the MEI `<choice>` editorial element: an `EditorialElement`
 * that stores the editorial level and accepts the critical-apparatus
 * alternative children (`ABBR`, `CHOICE`, `CORR`, `EXPAN`, `ORIG`, `REG`,
 * `SIC`, `UNCLEAR`).
 */
import { ObjectFactory, VrvObject } from './object.js';
import { EditorialElement } from './editorial.js';
import { ClassId, EditorialLevel, VisibilityType } from './vrvdef.js';

/** Pure-TypeScript translation of Verovio's `Choice` element. */
export class Choice extends EditorialElement {
  /** We store the level of the `<choice>` for integrity check */
  private m_level: EditorialLevel;

  public constructor(level: EditorialLevel = EditorialLevel.EDITORIAL_UNDEFINED) {
    super(ClassId.CHOICE);
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
    const clone = new Choice(this.m_level);
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
    return 'choice';
  }

  /**
   * Add children to an apparatus.
   */
  public override IsSupportedChild(classId: ClassId): boolean {
    switch (classId) {
      case ClassId.ABBR:
      case ClassId.CHOICE:
      case ClassId.CORR:
      case ClassId.EXPAN:
      case ClassId.ORIG:
      case ClassId.REG:
      case ClassId.SIC:
      case ClassId.UNCLEAR:
        return true;
      default:
        return false;
    }
  }
}

ObjectFactory.GetInstance().Register('choice', ClassId.CHOICE, () => new Choice());
