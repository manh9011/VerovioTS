/**
 * Pure TypeScript translation of Verovio's `src/abbr.cpp` / `abbr.h`.
 *
 * `AttSource` is a libMEI attribute class. The canonical implementation is
 * represented here by a minimal local stateful contract because libMEI is an
 * external/generated dependency boundary for this migration pass.
 */
import { ObjectFactory, VrvObject } from './object';
import { EditorialElement } from './editorial';
import { ClassId, VisibilityType } from './vrvdef';

/** Pure-TS adaptation of libMEI `AttSource`. */
export class AttSource {
  private source = '';

  public ResetSource(): void {
    this.source = '';
  }

  public SetSource(value: string): void {
    this.source = value;
  }

  public GetSource(): string {
    return this.source;
  }

  public HasSource(): boolean {
    return this.source !== '';
  }
}

/** Pure-TypeScript translation of Verovio's `Abbr` element. */
export class Abbr extends EditorialElement {
  private sourceAttributes?: AttSource;

  public constructor() {
    super(ClassId.ABBR);
    this.ensureSourceAttributes();
    this.RegisterAttClass(198); // ATT_SOURCE (libMEI AttClassId).
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
    const clone = new Abbr();
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
    return 'abbr';
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

ObjectFactory.GetInstance().Register('abbr', ClassId.ABBR, () => new Abbr());
