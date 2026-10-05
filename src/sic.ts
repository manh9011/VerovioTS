/**
 * Pure TypeScript translation of Verovio's `src/sic.cpp` / `include/vrv/sic.h`.
 *
 * `Sic` is the MEI `<Sic>` apparatus lemma: an `EditorialElement`
 * with the `AttSource` attribute class.
 */
import { ObjectFactory, VrvObject } from './object';
import { EditorialElement } from './editorial';
import { ClassId, VisibilityType } from './vrvdef';
import { AttSource } from './abbr';

// Canonical libmei att-class ordinal (libmei/dist/attclasses.h).
const ATT_SOURCE = 198;

/** Pure-TypeScript translation of Verovio's `Sic` element. */
export class Sic extends EditorialElement {
  private sourceAttributes?: AttSource;

  public constructor() {
    super(ClassId.SIC);
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
    const clone = new Sic();
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
    return 'sic';
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

ObjectFactory.GetInstance().Register('sic', ClassId.SIC, () => new Sic());
