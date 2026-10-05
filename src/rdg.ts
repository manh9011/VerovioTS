/**
 * Pure TypeScript translation of Verovio's `src/rdg.cpp` / `include/vrv/rdg.h`.
 *
 * `Rdg` is the MEI `<Rdg>` apparatus lemma: an `EditorialElement`
 * with the `AttSource` attribute class.
 */
import { ObjectFactory, VrvObject } from './object';
import { EditorialElement } from './editorial';
import { ClassId, VisibilityType } from './vrvdef';
import { AttSource } from './abbr';

// Canonical libmei att-class ordinal (libmei/dist/attclasses.h).
const ATT_SOURCE = 198;

/** Pure-TypeScript translation of Verovio's `Rdg` element. */
export class Rdg extends EditorialElement {
  private sourceAttributes?: AttSource;

  public constructor() {
    super(ClassId.RDG);
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
    const clone = new Rdg();
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
    return 'rdg';
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

ObjectFactory.GetInstance().Register('rdg', ClassId.RDG, () => new Rdg());
