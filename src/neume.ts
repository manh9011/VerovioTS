/**
 * Pure TypeScript translation of Verovio's `Neume`
 * (`src-cpp/src/neume.cpp` + `src-cpp/include/vrv/neume.h`).
 *
 * C++ has `Neume` inherit `LayerElement` + `ObjectListInterface` +
 * `OffsetInterface` + `AttColor`; TypeScript models the multiple inheritance
 * with composition. The `NeumeGroup` enum and the static `s_neumes` mapping
 * preserve the C++ string keys and numeric order exactly.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { OffsetInterface } from './offsetinterface.js';
import { InstColor } from './atts_shared.js';
import { ObjectFactory, ObjectListInterface, VrvObject, ArrayOfObjects } from './object.js';
import { Comparison } from './comparison.js';
import { InterfaceId } from './vrvdef.js';
import { Nc } from './nc.js';
import { PitchInterface } from './pitchinterface.js';
const BOOLEAN_true = 1;

/** Neume group classification (`include/vrv/neume.h` enum order). */
export enum NeumeGroup {
  NEUME_ERROR = 0,
  PUNCTUM,
  CLIVIS,
  PES,
  PRESSUS,
  CLIMACUS,
  PORRECTUS,
  SCANDICUS,
  TORCULUS,
  SCANDICUS_FLEXUS,
  PORRECTUS_FLEXUS,
  TORCULUS_RESUPINUS,
  CLIMACUS_RESUPINUS,
  PES_SUBPUNCTIS,
  PORRECTUS_SUBPUNCTIS,
  SCANDICUS_SUBPUNCTIS,
}

/** Static neume-group lookup with the exact C++ keys and values. */
const S_NEUMES: ReadonlyMap<string, NeumeGroup> = new Map<string, NeumeGroup>([
  ['', NeumeGroup.PUNCTUM],
  ['u', NeumeGroup.PES],
  ['d', NeumeGroup.CLIVIS],
  ['uu', NeumeGroup.SCANDICUS],
  ['dd', NeumeGroup.CLIMACUS],
  ['ud', NeumeGroup.TORCULUS],
  ['du', NeumeGroup.PORRECTUS],
  ['ddd', NeumeGroup.CLIMACUS],
  ['ddu', NeumeGroup.CLIMACUS_RESUPINUS],
  ['udu', NeumeGroup.TORCULUS_RESUPINUS],
  ['dud', NeumeGroup.PORRECTUS_FLEXUS],
  ['udd', NeumeGroup.PES_SUBPUNCTIS],
  ['uud', NeumeGroup.SCANDICUS_FLEXUS],
  ['uudd', NeumeGroup.SCANDICUS_SUBPUNCTIS],
  ['dudd', NeumeGroup.PORRECTUS_SUBPUNCTIS],
  ['sd', NeumeGroup.PRESSUS],
]);

/**
 * ObjectListInterface specialization for Neume. The C++ `Neume` relies on the
 * base `ObjectListInterface` filtering (no override); this component keeps
 * that behavior while resolving the interface owner back to the neume.
 */
class NeumeListInterface extends ObjectListInterface {}

/** Pure TypeScript translation of Verovio's `Neume`. */
export class Neume extends LayerElement {
  private readonly objectList: NeumeListInterface;
  private offsetInterface: OffsetInterface | null = null;
  private attColor: InstColor | null = null;

  public constructor() {
    super(ClassId.NEUME);
    // Components must be created after `super(classId)` so the virtual
    // Reset() run by the VrvObject constructor sees initialized state.
    this.objectList = new NeumeListInterface();
    this.objectList.SetInterfaceOwner(this as unknown as VrvObject);
    this.ensureComponents();
    this.RegisterInterface(this.offsetInterface!.GetAttClasses(), this.offsetInterface!.IsInterface());
    this.RegisterAttClass(ATT_COLOR);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.offsetInterface?.Reset();
    this.attColor?.ResetColor();
  }

  public override GetClassName(): string { return 'neume'; }

  private ensureComponents(): void {
    this.offsetInterface ??= new OffsetInterface();
    this.attColor ??= new InstColor();
  }

  public override GetOffsetInterface(): OffsetInterface | null { return this.offsetInterface; }

  //---------//
  // Children //
  //---------//

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [ClassId.NC];
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
   * Position of a layer element within the neume (index in the flat list).
   */
  public GetPosition(element: VrvObject): number {
    this.GetList();
    return this.GetListIndex(element);
  }

  /**
   * Number of ligated `Nc` elements up to and including `position`.
   */
  public GetLigatureCount(position: number): number {
    let ligCount = 0;
    this.GetList();
    for (let pos = 0; pos <= position; pos++) {
      const posObj = this.GetChild(pos);
      if (posObj != null) {
        const posNc = posObj as Nc;
        if (!(posNc instanceof Nc)) {
          throw new Error('Neume::GetLigatureCount: expected Nc child.');
        }
        if (posNc.GetLigated() === BOOLEAN_true) {
          // first part of the ligature
          ligCount += 1;
        }
      }
    }
    return ligCount;
  }

  /**
   * True when the element is the last neume component.
   */
  public IsLastInNeume(element: VrvObject): boolean {
    const size = this.GetListSize();
    const position = this.GetPosition(element);

    // This method should be called only if the note is part of a neume
    if (position === -1) {
      throw new Error('Neume::IsLastInNeume: element not part of the neume.');
    }
    // this is the last one
    if (position === size - 1) return true;
    return false;
  }

  /**
   * Classify the neume by its melodic direction pattern (`u`/`d`/`s`).
   */
  public GetNeumeGroup(): NeumeGroup {
    const children = this.FindAllDescendantsByType(ClassId.NC) as unknown as Nc[];

    const previous = children[0] as Nc | undefined;
    if (previous == null || !(previous instanceof Nc)) return NeumeGroup.NEUME_ERROR;

    let key = '';
    let prev: Nc = previous;

    for (let iter = 1; iter < children.length; iter++) {
      const current = children[iter] as Nc;
      if (!(current instanceof Nc)) {
        throw new Error('Neume::GetNeumeGroup: expected Nc descendant.');
      }
      const pitchDifference = current.GetPitchInterface()!.PitchDifferenceTo(prev.GetPitchInterface());
      if (pitchDifference > 0) {
        key += 'u';
      } else if (pitchDifference < 0) {
        key += 'd';
      } else {
        key += 's';
      }
      prev = current;
    }

    const group = S_NEUMES.get(key);
    if (group !== undefined) {
      return group;
    }
    return NeumeGroup.NEUME_ERROR;
  }

  /**
   * Melodic pitch differences between consecutive `Nc` components.
   */
  public GetPitchDifferences(): number[] {
    const pitchDifferences: number[] = [];
    const ncChildren = this.FindAllDescendantsByType(ClassId.NC) as unknown as Nc[];

    const previous = ncChildren[0] as Nc | undefined;
    if (previous == null || !(previous instanceof Nc)) return pitchDifferences;

    let prev: Nc = previous;
    for (let iter = 1; iter < ncChildren.length; iter++) {
      const current = ncChildren[iter] as Nc;
      if (!(current instanceof Nc)) {
        throw new Error('Neume::GetPitchDifferences: expected Nc descendant.');
      }
      pitchDifferences.push(current.GetPitchInterface()!.PitchDifferenceTo(prev.GetPitchInterface()));
      prev = current;
    }

    return pitchDifferences;
  }

  /**
   * Set `@intm` on every neume component after the first from the melodic
   * direction to the head component.
   */
  public GenerateChildMelodic(): boolean {
    const children = this.FindAllDescendantsByType(ClassId.NC) as unknown as ArrayOfObjects;

    // Get the first neume component of the neume
    let iter = 0;
    let head = children[iter] as Nc | undefined;
    if (head == null || !(head instanceof Nc)) return false;
    iter++;

    // Iterate on second to last neume component and add intm value
    for (; iter < children.length; iter++) {
      const current = children[iter] as Nc;
      if (!(current instanceof Nc)) {
        throw new Error('Neume::GenerateChildMelodic: expected Nc descendant.');
      }
      let intmValue: string;

      const pitchDifference = current.GetPitchInterface()!.PitchDifferenceTo(head!.GetPitchInterface());
      if (pitchDifference > 0) {
        intmValue = 'u';
      } else if (pitchDifference < 0) {
        intmValue = 'd';
      } else {
        intmValue = 's';
      }

      current.SetIntm(intmValue);
      head = current;
    }

    return true;
  }

  /**
   * Highest `PitchInterface` among descendants.
   */
  public GetHighestPitch(): PitchInterface | null {
    const pitchChildren: VrvObject[] = [];
    const ic = new Comparison(
      (object: { GetPitchInterface?(): unknown }) => object.GetPitchInterface != null && object.GetPitchInterface() != null
    );
    // InterfaceComparison(INTERFACE_PITCH) matches objects exposing the pitch
    // interface; the local structural equivalent checks the interface getter.
    this.FindAllDescendantsByComparison(pitchChildren, ic as never);

    let iter = 0;
    let max = (pitchChildren[iter] as unknown as { GetPitchInterface(): PitchInterface | null }).GetPitchInterface();
    if (!max) return null;
    for (iter++; iter < pitchChildren.length; iter++) {
      const pi = (pitchChildren[iter] as unknown as { GetPitchInterface(): PitchInterface }).GetPitchInterface();
      if (pi.PitchDifferenceTo(max) > 0) {
        max = pi;
      }
    }
    return max;
  }

  /**
   * Lowest `PitchInterface` among descendants.
   */
  public GetLowestPitch(): PitchInterface | null {
    const pitchChildren: VrvObject[] = [];
    const ic = new Comparison(
      (object: { GetPitchInterface?(): unknown }) => object.GetPitchInterface != null && object.GetPitchInterface() != null
    );
    this.FindAllDescendantsByComparison(pitchChildren, ic as never);

    let iter = 0;
    let min = (pitchChildren[iter] as unknown as { GetPitchInterface(): PitchInterface | null }).GetPitchInterface();
    if (!min) return null;
    for (iter++; iter < pitchChildren.length; iter++) {
      const pi = (pitchChildren[iter] as unknown as { GetPitchInterface(): PitchInterface }).GetPitchInterface();
      if (pi.PitchDifferenceTo(min) < 0) {
        min = pi;
      }
    }
    return min;
  }

  //-----------//
  // AttColor  //
  //-----------//
  public ResetColor(): void { this.attColor!.ResetColor(); }
  public SetColor(v: string): void { this.attColor!.SetColor(v); }
  public GetColor(): string { return this.attColor!.GetColor(); }
  public HasColor(): boolean { return this.attColor!.HasColor(); }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitNeume', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitNeumeEnd', this); }

  public override Clone(): VrvObject {
    const clone = new Neume();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attColor!.HasColor()) clone.attColor!.SetColor(this.attColor!.GetColor());
    return clone;
  }
}

// Canonical libmei AttClassId ordinal (attmodule.ts ATT_CLASS_IDS).
const ATT_COLOR = 109;

/** C++ FunctorInterface default forwarding helper (VisitNeume -> VisitLayerElement -> ... -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

export { InterfaceId };

ObjectFactory.GetInstance().Register('neume', ClassId.NEUME, () => new Neume());
