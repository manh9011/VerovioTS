/**
 * Pure TypeScript translation of Verovio's `src/add.cpp` / `add.h`.
 *
 * `AttSource` is a libMEI attribute class. The migration currently reuses the
 * typed state boundary introduced with `Abbr` until the shared atts layer is
 * migrated from the canonical C++ source.
 */
import { ObjectFactory, VrvObject } from './object.js';
import { EditorialElement } from './editorial.js';
import { AttSource } from './abbr.js';
import { ClassId } from './vrvdef.js';

const ATT_SOURCE = 198;

/** Pure-TypeScript translation of Verovio's `Add` element. */
export class Add extends EditorialElement {
  private sourceAttributes: AttSource | undefined;

  public constructor() {
    super(ClassId.ADD);
    this.sourceAttributes ??= new AttSource();
    this.RegisterAttClass(ATT_SOURCE);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.sourceAttributes ??= new AttSource();
    this.sourceAttributes.ResetSource();
  }

  public override Clone(): VrvObject {
    const clone = new Add();
    clone.AssignFrom(this);
    clone.SetSource(this.GetSource());
    return clone;
  }

  public override GetClassName(): string {
    return 'add';
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

ObjectFactory.GetInstance().Register('add', ClassId.ADD, () => new Add());
