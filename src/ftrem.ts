/**
 * Pure TypeScript translation of Verovio's `src/ftrem.cpp` / `include/vrv/ftrem.h`.
 *
 * `FTrem` models the MEI `<fTrem>` element (fingered tremolo).
 *
 * C++ multiple inheritance (LayerElement + BeamDrawingInterface + AttFTremVis +
 * AttTremMeasured) is represented through explicit composition with forwarding
 * surfaces, following the migrated `Beam` pattern.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, VrvObject } from './object.js';
import { ObjectListInterface } from './object.js';
import { BeamSegment, ArrayOfBeamElementCoords } from './beam.js';
import { mixinBeamDrawingInterface } from './drawinginterface.js';
import { InstFTremVis } from './atts_visual.js';
import { InstTremMeasured } from './atts_cmn.js';

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_FTREMVIS = 257;
const ATT_TREMMEASURED = 38;

/**
 * ObjectListInterface specialization for FTrem (BeamDrawingInterface derives
 * from ObjectListInterface in C++). `FilterList` keeps only Note or Chord
 * elements, dropping chord tones, exactly as `FTrem::FilterList`.
 */
class FTremListInterface extends ObjectListInterface {
  protected override FilterList(childList: VrvObject[]): void {
    let i = 0;
    while (i < childList.length) {
      const e = childList[i];
      if (!e.Is(ClassId.NOTE) && !e.Is(ClassId.CHORD)) {
        // remove anything that is not an LayerElement (e.g. Verse, Syl, etc.)
        childList.splice(i, 1);
        continue;
      }
      // also remove notes within chords
      if (e.Is(ClassId.NOTE)) {
        const note = e as unknown as { IsChordTone?(): unknown };
        if (note.IsChordTone && note.IsChordTone()) {
          childList.splice(i, 1);
          continue;
        }
      }
      i++;
    }
  }
}

/** Pure TypeScript translation of Verovio's `FTrem`. */
export class FTrem extends LayerElement {
  /** Beam segment state (C++ public member). */
  public readonly m_beamSegment = new BeamSegment();
  /** Beam element coordinates (BeamDrawingInterface / ObjectListInterface state). */
  public m_beamElementCoords: ArrayOfBeamElementCoords = [];
  // C++ FTrem inherits BeamDrawingInterface: the implementation is mixed onto this class, so the
  // interface's state fields must exist on the instance (BeamDrawingInterface::Reset resets them).
  public m_changingDur = false;
  public m_beamHasChord = false;
  public m_hasMultipleStemDir = false;
  public m_cueSize = false;
  public m_crossStaffContent: unknown = null;
  public m_crossStaffRel = 0;
  public m_isSpanningElement = false;
  public m_shortestDur = 0;
  public m_notesStemDir = 0;
  public m_drawingPlace = 0;
  public m_beamStaff: unknown = null;
  public m_beamWidth = 0;
  public m_beamWidthBlack = 0;
  public m_beamWidthWhite = 0;
  public m_fractionSize = 100;

  private fTremVis?: InstFTremVis;
  private tremMeasured?: InstTremMeasured;
  /** ObjectListInterface composition (BeamDrawingInterface derives from it). */
  private listInterface?: FTremListInterface;

  public constructor() {
    super(ClassId.FTREM);
    this.ensureAttributes();
    this.RegisterAttClass(ATT_FTREMVIS);
    this.RegisterAttClass(ATT_TREMMEASURED);
    this.Reset();
  }

  private ensureAttributes(): void {
    this.fTremVis ??= new InstFTremVis();
    this.tremMeasured ??= new InstTremMeasured();
    if (!this.listInterface) {
      this.listInterface = new FTremListInterface();
      this.listInterface.SetInterfaceOwner(this as unknown as VrvObject);
    }
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.m_beamSegment?.Reset();
    this.m_beamElementCoords = [];
    // BeamDrawingInterface::Reset equivalent for the mixed-in state.
    this.m_changingDur = false; this.m_beamHasChord = false; this.m_hasMultipleStemDir = false;
    this.m_cueSize = false; this.m_fractionSize = 100; this.m_crossStaffContent = null;
    this.m_crossStaffRel = 0; this.m_isSpanningElement = false; this.m_shortestDur = 0;
    this.m_notesStemDir = 0; this.m_drawingPlace = 0; this.m_beamStaff = null;
    this.m_beamWidth = this.m_beamWidthBlack = this.m_beamWidthWhite = 0;
    this.fTremVis!.ResetFTremVis();
    this.tremMeasured!.ResetTremMeasured();
  }

  public override Clone(): VrvObject {
    const clone = new FTrem();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all attribute state (composition
    // adaptation: AssignFrom covers only the object-tree state).
    if (this.HasBeams()) clone.SetBeams(this.GetBeams());
    if (this.HasBeamsFloat()) clone.SetBeamsFloat(this.GetBeamsFloat());
    if (this.HasFloatGap()) clone.SetFloatGap(this.GetFloatGap());
    if (this.HasUnitdur()) clone.SetUnitdur(this.GetUnitdur());
    return clone;
  }

  public override GetClassName(): string { return 'fTrem'; }

  public GetBeamDrawingInterface(): FTrem { return this; }

  public InterfaceResetData(_functor: any): FunctorCode {
    this.m_beamElementCoords = [];
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  /**
   * Add an element (a note or a chord) to a fTrem.
   * C++ `IsSupportedChild`: CHORD, CLEF, NOTE + editorial elements.
   */
  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.CHORD || classId === ClassId.CLEF || classId === ClassId.NOTE) return true;
    return VrvObject.IsEditorialElement(classId);
  }

  public GetElementCoords(): ArrayOfBeamElementCoords {
    this.GetList();
    return this.m_beamElementCoords;
  }
  /** See DrawingInterface::GetAdditionalBeamCount. */
  public GetAdditionalBeamCount(): [number, number] {
    return [0, Math.max(this.GetBeams(), this.GetBeamsFloat())];
  }

  /** See DrawingInterface::GetFloatingBeamCount. */
  public GetFloatingBeamCount(): [number, number] {
    return [this.GetBeams(), this.GetBeamsFloat()];
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitFTrem');
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitFTrem');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitFTremEnd');
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitFTremEnd');
  }

  private visit(functor: unknown, method: string): FunctorCode {
    const f = functor as Record<string, unknown>;
    const fn = f[method];
    if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, this);
    if (typeof f['VisitObject'] === 'function') {
      return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  //---------//
  // ObjectListInterface forwarding (BeamDrawingInterface derives from it)
  //---------//

  public GetList(): VrvObject[] { this.ensureAttributes(); return this.listInterface!.GetList(); }
  public HasEmptyList(): boolean { this.ensureAttributes(); return this.listInterface!.HasEmptyList(); }
  public GetListSize(): number { this.ensureAttributes(); return this.listInterface!.GetListSize(); }
  public GetListFront(): VrvObject { this.ensureAttributes(); return this.listInterface!.GetListFront(); }
  public GetListBack(): VrvObject { this.ensureAttributes(); return this.listInterface!.GetListBack(); }
  public GetListIndex(element: VrvObject): number { this.ensureAttributes(); return this.listInterface!.GetListIndex(element); }
  public GetListFirst(startFrom: VrvObject, classId?: ClassId): VrvObject | null {
    this.ensureAttributes();
    return this.listInterface!.GetListFirst(startFrom, classId ?? ClassId.UNSPECIFIED);
  }
  public GetListFirstBackward(startFrom: VrvObject, classId?: ClassId): VrvObject | null {
    this.ensureAttributes();
    return this.listInterface!.GetListFirstBackward(startFrom, classId ?? ClassId.UNSPECIFIED);
  }
  public GetListPrevious(element: VrvObject): VrvObject | null {
    this.ensureAttributes();
    return this.listInterface!.GetListPrevious(element);
  }
  public GetListNext(element: VrvObject): VrvObject | null {
    this.ensureAttributes();
    return this.listInterface!.GetListNext(element);
  }

  //---------//
  // Attribute forwarding surfaces
  //---------//

  // AttFTremVis (beams, beams.float, float.gap)
  public ResetFTremVis(): void { this.fTremVis!.ResetFTremVis(); }
  public SetBeams(value: any): void { this.fTremVis!.SetBeams(value); }
  public GetBeams(): any { return this.fTremVis!.GetBeams(); }
  public HasBeams(): boolean { return this.fTremVis!.HasBeams(); }
  public SetBeamsFloat(value: any): void { this.fTremVis!.SetBeamsFloat(value); }
  public GetBeamsFloat(): any { return this.fTremVis!.GetBeamsFloat(); }
  public HasBeamsFloat(): boolean { return this.fTremVis!.HasBeamsFloat(); }
  public SetFloatGap(value: any): void { this.fTremVis!.SetFloatGap(value); }
  public GetFloatGap(): any { return this.fTremVis!.GetFloatGap(); }
  public HasFloatGap(): boolean { return this.fTremVis!.HasFloatGap(); }

  // AttTremMeasured (unitdur)
  public ResetTremMeasured(): void { this.tremMeasured!.ResetTremMeasured(); }
  public SetUnitdur(value: any): void { this.tremMeasured!.SetUnitdur(value); }
  public GetUnitdur(): any { return this.tremMeasured!.GetUnitdur(); }
  public HasUnitdur(): boolean { return this.tremMeasured!.HasUnitdur(); }
}

ObjectFactory.GetInstance().Register('fTrem', ClassId.FTREM, () => new FTrem());

// C++ FTrem derives from BeamDrawingInterface (multiple inheritance).
mixinBeamDrawingInterface(FTrem.prototype as unknown as object);
