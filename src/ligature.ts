/**
 * Pure TypeScript translation of Verovio's `Ligature`
 * (`src-cpp/src/ligature.cpp` + `src-cpp/include/vrv/ligature.h`).
 *
 * C++ has `Ligature` inherit `LayerElement` + `ObjectListInterface` +
 * `AttLigatureVis`; TypeScript models the multiple inheritance with
 * composition. `m_drawingShapes` stays a public member as in C++.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { InstLigatureVis } from './atts_visual.js';
import { ObjectFactory, ObjectListInterface, VrvObject } from './object.js';
import { Note } from './note.js';

/**
 * ObjectListInterface specialization for Ligature. Keeps only `NOTE`
 * children (with the C++ assert that each retained element is a Note).
 */
class LigatureListInterface extends ObjectListInterface {
  protected override FilterList(childList: VrvObject[]): void {
    // Retain only note children of ligatures
    for (let i = 0; i < childList.length;) {
      if (!childList[i].Is(ClassId.NOTE)) {
        // remove anything that is not an LayerElement
        childList.splice(i, 1);
      } else {
        // assert that we keep only notes
        if (!(childList[i] instanceof Note)) {
          throw new Error('Ligature::FilterList: retained element must be a Note.');
        }
        ++i;
      }
    }
  }
}

/** Pure TypeScript translation of Verovio's `Ligature`. */
export class Ligature extends LayerElement {
  private readonly objectList: LigatureListInterface;
  private attLigatureVis: InstLigatureVis | null = null;

  /**
   * Per-note drawing shapes filled by the ligature layout; `-1` marks an
   * unset shape as produced by `GetDrawingNoteShape` for missing entries.
   */
  public m_drawingShapes: number[] = [];

  public constructor() {
    super(ClassId.LIGATURE);
    // Components must be created after `super(classId)` so the virtual
    // Reset() run by the VrvObject constructor sees initialized state.
    this.objectList = new LigatureListInterface();
    this.objectList.SetInterfaceOwner(this as unknown as VrvObject);
    this.ensureAttributes();
    this.RegisterAttClass(ATT_LIGATUREVIS);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.attLigatureVis?.ResetLigatureVis();
  }

  public override GetClassName(): string { return 'ligature'; }

  /** Override the method since alignment is required */
  public override HasToBeAligned(): boolean { return true; }

  private ensureAttributes(): void {
    this.attLigatureVis ??= new InstLigatureVis();
  }

  //---------//
  // Children //
  //---------//

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [ClassId.DOT, ClassId.NOTE];
    if (supported.includes(classId)) return true;
    if (VrvObject.IsEditorialElement(classId)) return true;
    return false;
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

  //-------------//
  // Note access //
  //-------------//

  public GetFirstNote(): Note {
    return this.GetListFront() as Note;
  }

  public GetLastNote(): Note {
    return this.GetListBack() as Note;
  }

  /**
   * Return shape information about the note ligature. `m_drawingShapes` must
   * have been filled by the ligature layout before this is called; missing
   * entries surface the C++ `std::vector::at` failure as an explicit error.
   */
  public GetDrawingNoteShape(note: Note): number {
    if (!note) throw new Error('Ligature::GetDrawingNoteShape: note required.');
    const position = this.GetListIndex(note as unknown as VrvObject);
    if (position === -1) return -1;

    // no check because m_drawingShapes will have been filled by then
    if (position >= this.m_drawingShapes.length) {
      throw new Error('Ligature::GetDrawingNoteShape: drawing shape missing.');
    }
    return this.m_drawingShapes[position];
  }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitLigature', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitLigatureEnd', this); }

  public override Clone(): VrvObject {
    const clone = new Ligature();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attLigatureVis!.HasForm()) clone.attLigatureVis!.SetForm(this.attLigatureVis!.GetForm());
    clone.m_drawingShapes = [...this.m_drawingShapes];
    return clone;
  }

  //--------------//
  // AttLigatureVis
  //--------------//
  public ResetLigatureVis(): void { this.attLigatureVis!.ResetLigatureVis(); }
  public SetForm(v: number): void { this.attLigatureVis!.SetForm(v); }
  public GetForm(): number { return this.attLigatureVis!.GetForm(); }
  public HasForm(): boolean { return this.attLigatureVis!.HasForm(); }
}

// Canonical libmei AttClassId ordinal (attmodule.ts ATT_CLASS_IDS).
const ATT_LIGATUREVIS = 266;

/** C++ FunctorInterface default forwarding helper (VisitLigature -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('ligature', ClassId.LIGATURE, () => new Ligature());
