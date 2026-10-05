/**
 * Pure TypeScript translation of Verovio's `src/app.cpp` / `include/vrv/app.h`.
 *
 * C++ `App` derives from `EditorialElement` and stores the editorial level
 * used by page-level editorial rendering.  The translation preserves the
 * constructor overloads, reset semantics, supported-child policy, clone
 * behavior, and class registration without WebAssembly/native dependencies.
 */
import { ObjectFactory, VrvObject } from './object.js';
import { EditorialElement } from './editorial.js';
import { ClassId, EditorialLevel } from './vrvdef.js';

export class App extends EditorialElement {
  private m_level: EditorialLevel;

  public constructor(level: EditorialLevel = EditorialLevel.EDITORIAL_UNDEFINED) {
    super(ClassId.APP);
    this.m_level = level;
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
  }

  public GetLevel(): EditorialLevel {
    return this.m_level;
  }

  public override Clone(): VrvObject {
    const clone = new App(this.m_level);
    clone.AssignFrom(this);
    return clone;
  }

  public override GetClassName(): string {
    return 'app';
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    return classId === ClassId.LEM || classId === ClassId.RDG;
  }
}

ObjectFactory.GetInstance().Register('app', ClassId.APP, () => new App());
