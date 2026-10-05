/**
 * Pure TypeScript translation of Verovio's `src/ref.cpp` / `include/vrv/ref.h`.
 *
 * `Ref` models the MEI `<ref>` element.
 */
import { ClassId } from './vrvdef.js';
import { ObjectFactory } from './object.js';
import { EditorialElement } from './editorial.js';

/** Pure TypeScript translation of Verovio's `Ref` element. */
export class Ref extends EditorialElement {
  public constructor() {
    super(ClassId.REF);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
  }

  public override GetClassName(): string {
    return 'ref';
  }

  public override Clone(): Ref {
    const clone = new Ref();
    clone.AssignFrom(this);
    return clone;
  }
}

ObjectFactory.GetInstance().Register('ref', ClassId.REF, () => new Ref());
