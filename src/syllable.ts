/**
 * Pure TypeScript translation of Verovio's `Syllable`
 * (`src-cpp/src/syllable.cpp` + `src-cpp/include/vrv/syllable.h`).
 *
 * C++ has `Syllable` inherit `LayerElement` + `ObjectListInterface` +
 * `AttColor` + `AttSlashCount`; TypeScript models the multiple inheritance
 * with composition.
 */
import { ClassId, FunctorCode, ArrayOfStrAttr } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { InstColor } from './atts_shared.js';
import { InstSlashCount } from './atts_shared.js';
import { ObjectFactory, ObjectListInterface, VrvObject } from './object.js';
import { Syl } from './syl.js';
import { Text } from './text.js';

/**
 * ObjectListInterface specialization for Syllable. The C++ `Syllable` relies
 * on the base `ObjectListInterface` behavior (no FilterList override).
 */
class SyllableListInterface extends ObjectListInterface {}

/** Pure TypeScript translation of Verovio's `Syllable`. */
export class Syllable extends LayerElement {
  public override GetClassName(): string { return 'syllable'; }
  private readonly objectList: SyllableListInterface;
  private attColor: InstColor | null = null;
  private attSlashCount: InstSlashCount | null = null;

  public constructor() {
    super(ClassId.SYLLABLE);
    this.objectList = new SyllableListInterface();
    this.objectList.SetInterfaceOwner(this as unknown as VrvObject);
    this.initSyllable();
  }

  private initSyllable(): void {
    this.ensureAttributes();
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_SLASHCOUNT);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.attColor?.ResetColor();
    this.attSlashCount?.ResetSlashCount();
  }

  private ensureAttributes(): void {
    this.attColor ??= new InstColor();
    this.attSlashCount ??= new InstSlashCount();
  }

  //---------//
  // Children //
  //---------//

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [
      ClassId.ACCID,
      ClassId.CLEF,
      ClassId.DIVLINE,
      ClassId.NEUME,
      ClassId.SYL,
    ];
    return supported.includes(classId);
  }

  //-------------//
  // List facade //
  //-------------//

  public GetList(): VrvObject[] { return this.objectList.GetList(); }
  public HasEmptyList(): boolean { return this.objectList.HasEmptyList(); }
  public GetListSize(): number { return this.objectList.GetListSize(); }
  public GetListFront(): VrvObject { return this.objectList.GetListFront(); }
  public GetListBack(): VrvObject { return this.objectList.GetListBack(); }
  public GetListIndex(element: VrvObject): number { return this.objectList.GetListIndex(element); }

  /**
   * MEI-header style markup helper: add an empty `Syl` with a `Text` child
   * when no `SYL` descendant exists and the element has no `follows`
   * attribute.
   */
  public MarkupAddSyl(): boolean {
    const obj = this.FindDescendantByType(ClassId.SYL);
    const attributes: ArrayOfStrAttr = [];
    this.GetAttributes(attributes);
    const noFollows = !attributes.some((att) => att[0] === 'follows');
    if (noFollows && obj == null) {
      const syl = new Syl();
      const text = new Text();
      syl.AddChild(text as unknown as VrvObject);
      this.AddChild(syl as unknown as VrvObject);
      return true;
    }
    return false;
  }

  //-----------//
  // AttColor  //
  //-----------//
  public ResetColor(): void { this.attColor!.ResetColor(); }
  public SetColor(v: string): void { this.attColor!.SetColor(v); }
  public GetColor(): string { return this.attColor!.GetColor(); }
  public HasColor(): boolean { return this.attColor!.HasColor(); }

  //---------------//
  // AttSlashCount //
  //---------------//
  public ResetSlashCount(): void { this.attSlashCount!.ResetSlashCount(); }
  public SetSlash(v: number): void { this.attSlashCount!.SetSlash(v); }
  public GetSlash(): number { return this.attSlashCount!.GetSlash(); }
  public HasSlash(): boolean { return this.attSlashCount!.HasSlash(); }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitSyllable', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitSyllableEnd', this); }

  public override Clone(): VrvObject {
    const clone = new Syllable();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attColor!.HasColor()) clone.attColor!.SetColor(this.attColor!.GetColor());
    if (this.attSlashCount!.HasSlash()) clone.attSlashCount!.SetSlash(this.attSlashCount!.GetSlash());
    return clone;
  }
}

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_COLOR = 109;
const ATT_SLASHCOUNT = 196;

/** C++ FunctorInterface default forwarding helper (VisitSyllable -> VisitLayerElement -> ... -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('syllable', ClassId.SYLLABLE, () => new Syllable());
