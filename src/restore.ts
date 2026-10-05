/**
 * Pure TypeScript translation of Verovio's `src/restore.cpp` / `include/vrv/restore.h`.
 *
 * `Restore` is the MEI `<restore>` editorial element: an `EditorialElement`
 * with the `AttSource` attribute class.
 */
import { ObjectFactory, VrvObject } from './object.js';
import { EditorialElement } from './editorial.js';
import { ClassId, VisibilityType } from './vrvdef.js';
import { AttSource } from './abbr.js';

// Canonical libmei att-class ordinal (libmei/dist/attclasses.h).
const ATT_SOURCE = 198;

/** Pure-TypeScript translation of Verovio's `Restore` element. */
export class Restore extends EditorialElement {
  private sourceAttributes?: AttSource;

  public constructor() {
    super(ClassId.RESTORE);
    this.ensureSourceAttributes();
    this.RegisterAttClass(ATT_SOURCE);
    this.Reset();
  }

  private ensureSourceAttributes(): void {
    if (!this.sourceAttributes) this.sourceAttributes = new AttSource();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureSourceAttributes();
    this.sourceAttributes!.ResetSource();
  }

  public override Clone(): VrvObject {
    const clone = new Restore();
    clone.AssignFrom(this);
    clone.SetSource(this.GetSource());
    clone.SetLabel(this.GetLabel());
    clone.SetType(this.GetType());
    clone.SetVisibility(this.IsHidden() ? VisibilityType.Hidden : VisibilityType.Visible);
    clone.SetMeasure(this.GetMeasure());
    const end = this.GetEnd();
    if (end !== null) clone.SetEnd(end);
    return clone;
  }

  public override GetClassName(): string {
    return 'restore';
  }

  public ResetSource(): void {
    this.sourceAttributes!.ResetSource();
  }

  public SetSource(value: string): void {
    this.sourceAttributes!.SetSource(value);
  }

  public GetSource(): string {
    return this.sourceAttributes!.GetSource();
  }

  public HasSource(): boolean {
    return this.sourceAttributes!.HasSource();
  }
}

ObjectFactory.GetInstance().Register('restore', ClassId.RESTORE, () => new Restore());
