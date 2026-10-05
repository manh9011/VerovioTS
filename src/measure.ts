/**
 * Pure TypeScript translation of Verovio's `Measure`
 * (`src-cpp/src/measure.cpp` + `src-cpp/include/vrv/measure.h`).
 *
 * C++ has `Measure` inherit `Object` + `FacsimileInterface` + nine generated
 * libMEI attribute classes; TypeScript models the multiple inheritance with
 * composition. Owned C++ pointers (`m_drawingScoreDef` via `new`/`delete`)
 * become nullable references cleared explicitly on reset.
 *
 * The `MeasureAligner` / `TimestampAligner` layout collaborators
 * (`horizontalaligner.cpp`) are not yet migrated; they are consumed through
 * structural contracts, as are `System`, `Doc`, `ScoreDef`, `Ending`,
 * `StaffGrp`, and `AdjustXOverflowFunctor` where their full algorithms are
 * still pending. No layout/adjustment logic is invented here.
 */
import { ClassId, FunctorCode, MeasureType, MIDI_TEMPO, SCORE_TIME_UNIT, VRV_UNSET } from './vrvdef.js';
import { ObjectFactory, VrvObject, ArrayOfObjects } from './object.js';
import { Comparison, AttNIntegerComparison } from './comparison.js';
import { FacsimileInterface } from './facsimileinterface.js';
import { InstBarring, InstCoordX1, InstCoordX2, InstMeterConformanceBar, InstNNumberLike, InstPointing, InstTyped } from './atts_shared.js';
import { InstMeasureLog } from './atts_cmn.js';
import { Fraction } from './fraction.js';
import { BarLine, BarLinePosition } from './barline.js';
import { AdjustXOverflowFunctor } from './adjustxoverflowfunctor.js';
import { Staff } from './staff.js';
import { StaffDef } from './staffdef.js';
import { MeasureAligner as CanonicalMeasureAligner, TimestampAligner as CanonicalTimestampAligner } from './horizontalaligner.js';
import { VisibilityOptimization } from './vrvdef.js';

/** Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS). */
const ATT_BARRING = 100;
const ATT_COORDX1 = 111;
const ATT_COORDX2 = 112;
const ATT_MEASURELOG = 26;
const ATT_METERCONFORMANCEBAR = 162;
const ATT_NNUMBERLIKE = 168;
const ATT_POINTING = 188;
const ATT_TYPED = 224;

/** data_BARRENDITION ordinals (attconverter.ts canonical mapping). */
const BARRENDITION_NONE = 0;
const BARRENDITION_dashed = 1;
const BARRENDITION_dotted = 2;
const BARRENDITION_dbl = 3;
const BARRENDITION_dbldashed = 4;
const BARRENDITION_dbldotted = 5;
const BARRENDITION_end = 8;
const BARRENDITION_invis = 10;
const BARRENDITION_rptboth = 12;
const BARRENDITION_rptend = 13;
const BARRENDITION_rptstart = 11;
const BARRENDITION_single = 15;

/** C++ `Measure::BarlineDrawingFlags` bit values. */
export enum BarlineDrawingFlags {
  SYSTEM_BREAK = 0x1,
  SCORE_DEF_INSERT = 0x2,
  INVISIBLE_MEASURE_CURRENT = 0x4,
  INVISIBLE_MEASURE_PREVIOUS = 0x8,
}

/** A (left, right) pair of barline renditions. */
export type BarlineRenditionPair = [number, number];

/** Structural contract for the not-yet-migrated horizontal `Alignment`. */
export interface MeasureAlignmentLike extends VrvObject {
  GetXRel(): number;
  GetTime(): Fraction;
}

/** Structural contract for the not-yet-migrated `MeasureAligner`. */
export interface MeasureAlignerLike {
  SetParent(parent: VrvObject): void;
  Reset(): void;
  Process(functor: unknown): void;
  GetNonJustifiableMargin(): number;
  GetLeftBarLineAlignment(): MeasureAlignmentLike | null;
  GetRightBarLineAlignment(): MeasureAlignmentLike | null;
  GetRightAlignment(): MeasureAlignmentLike | null;
  AdjustProportionally(boundaries: Array<[unknown, unknown, number]>): void;
}

/** Structural contract for the not-yet-migrated `TimestampAligner`. */
export interface TimestampAlignerLike {
  SetParent(parent: VrvObject): void;
  Reset(): void;
  ResetCachedDrawingX(): void;
}

/** Structural contract for the not-yet-migrated `System`. */
export interface MeasureSystemLike extends VrvObject {
  GetDrawingX(): number;
  m_systemAligner: { FindAllPositionerPointingTo(out: unknown[], object: unknown): void };
}

/** Structural contract for the not-yet-migrated `Doc` drawing APIs used here. */
export interface MeasureDocLike {
  GetDrawingBarLineWidth(staffSize: number): number;
  GetDrawingUnit(staffSize: number): number;
  GetDrawingDoubleUnit(staffSize: number): number;
  GetOptions(): { m_thickBarlineThickness: { GetValue(): number }, m_barLineSeparation: { GetValue(): number } };
}

/** Structural contract for the `AdjustXOverflowFunctor` collaborator. */
export interface MeasureOverflowFunctorLike {
  SetCurrentSystem(system: unknown): void;
  SetLastMeasure(measure: unknown): void;
  GetWidestPositioner(): { GetContentRight(): number } | null;
}

/** Injectables so tests and future canonical migrations can supply collaborators. */
export interface MeasureCollaborators {
  createMeasureAligner(): MeasureAlignerLike;
  createTimestampAligner(): TimestampAlignerLike;
  createOverflowFunctor(margin: number): MeasureOverflowFunctorLike;
}

export class Measure extends VrvObject {
  private facsimileInterface: FacsimileInterface | null = null;
  private attBarring: InstBarring | null = null;
  private attCoordX1: InstCoordX1 | null = null;
  private attCoordX2: InstCoordX2 | null = null;
  private attMeasureLog: InstMeasureLog | null = null;
  private attMeterConformanceBar: InstMeterConformanceBar | null = null;
  private attNNumberLike: InstNNumberLike | null = null;
  private attPointing: InstPointing | null = null;
  private attTyped: InstTyped | null = null;

  /** Injectables (defaults = canonical implementations; tests may override). */
  public static collaborators: MeasureCollaborators = {
    createMeasureAligner: () => new CanonicalMeasureAligner() as unknown as MeasureAlignerLike,
    createTimestampAligner: () => new CanonicalTimestampAligner() as unknown as TimestampAlignerLike,
    createOverflowFunctor: (margin: number): MeasureOverflowFunctorLike =>
      // Canonical functor is migrated; wire it like C++ `AdjustXOverflowFunctor adjustXOverflow(0)`.
      new AdjustXOverflowFunctor(margin) as unknown as MeasureOverflowFunctorLike,
  };

  /** The measure aligner holding the x positions of the measure content. */
  public m_measureAligner: MeasureAlignerLike;
  /** The timestamp aligner. */
  public m_timestampAligner: TimestampAlignerLike;

  /** The X absolute position of the measure for facsimile (transcription) encodings. */
  public m_drawingFacsX1: number = VRV_UNSET;
  public m_drawingFacsX2: number = VRV_UNSET;

  /** The X relative position of the measure. */
  protected m_drawingXRel: number = 0;
  /** The cached value for m_drawingXRel for caching horizontal layout. */
  protected m_cachedXRel: number = VRV_UNSET;
  /** Cached values of overflow and width for caching the horizontal layout. */
  protected m_cachedOverflow: number = VRV_UNSET;
  protected m_cachedWidth: number = VRV_UNSET;

  private m_measureType: MeasureType;
  /** The unique measure index. */
  private m_index: number = VRV_UNSET;

  /** The measure barlines (left and right) used when drawing. */
  private readonly m_leftBarLine: BarLine;
  private readonly m_rightBarLine: BarLine;

  /** Owned drawing ScoreDef (C++ `new`/`delete`; null when absent). */
  private m_drawingScoreDef: VrvObject | null = null;
  /** Non-owning pointer to the ending the measure belongs to. */
  private m_drawingEnding: VrvObject | null = null;
  /** Flag for an AlignmentReference with multiple layers. */
  private m_hasAlignmentRefWithMultipleLayers: boolean = false;

  private m_scoreTimeOnset: Fraction[] = [];
  private m_realTimeOnsetMilliseconds: number[] = [];
  private m_scoreTimeOffset: Fraction[] = [];
  private m_realTimeOffsetMilliseconds: number[] = [];
  private m_currentTempo: number = MIDI_TEMPO;

  private readonly m_invisibleStaffBarlines: Map<number, BarlineRenditionPair> = new Map();

  public constructor(measuredMusic: MeasureType = MeasureType.MEASURED, logMeasureNb = -1) {
    super(ClassId.MEASURE);
    void logMeasureNb;
    this.ensureComponents();
    this.RegisterAttClass(ATT_BARRING);
    this.RegisterAttClass(ATT_COORDX1);
    this.RegisterAttClass(ATT_COORDX2);
    this.RegisterAttClass(ATT_MEASURELOG);
    this.RegisterAttClass(ATT_METERCONFORMANCEBAR);
    this.RegisterAttClass(ATT_NNUMBERLIKE);
    this.RegisterAttClass(ATT_POINTING);
    this.RegisterAttClass(ATT_TYPED);
    this.RegisterInterface(this.facsimileInterface!.GetAttClasses(), this.facsimileInterface!.IsInterface());

    this.m_measureType = measuredMusic;

    // We set parent to it because we want to access the parent doc from the aligners
    this.m_measureAligner = Measure.collaborators.createMeasureAligner();
    this.m_measureAligner.SetParent(this);
    // Idem for timestamps
    this.m_timestampAligner = Measure.collaborators.createTimestampAligner();
    this.m_timestampAligner.SetParent(this);

    this.m_leftBarLine = new BarLine();
    this.m_rightBarLine = new BarLine();
    // Idem for barlines — C++ SetParent(this); AlignmentReference::AddChild
    // asserts child parent exists (reference holds non-owning pointer).
    (this.m_leftBarLine as VrvObject).SetParent(this);
    (this.m_rightBarLine as VrvObject).SetParent(this);

    // Set the barline positions
    this.m_leftBarLine.SetPosition(BarLinePosition.Left);
    this.m_rightBarLine.SetPosition(BarLinePosition.Right);

    this.Reset();

    if (!this.IsMeasuredMusic() && !this.IsNeumeLine()) this.SetRight(BARRENDITION_invis);
  }

  public override GetClassName(): string { return 'measure'; }

  public override Clone(): VrvObject {
    const clone = new Measure(this.m_measureType);
    clone.AssignFrom(this);
    return clone;
  }

  public override CloneReset(): void {
    super.CloneReset();
    this.m_measureAligner.Reset();
    this.m_measureAligner.SetParent(this);
    // Idem for timestamps
    this.m_timestampAligner.SetParent(this);
    // Idem for barlines
    this.m_leftBarLine.ResetParent?.();
    (this.m_leftBarLine as VrvObject).SetParent(this);
    this.m_rightBarLine.ResetParent?.();
    (this.m_rightBarLine as VrvObject).SetParent(this);

    // owned pointers need to be set to NULL;
    this.m_drawingScoreDef = null;
  }

  public override Reset(): void {
    super.Reset();
    this.facsimileInterface?.Reset();
    this.attBarring?.ResetBarring();
    this.attCoordX1?.ResetCoordX1();
    this.attCoordX2?.ResetCoordX2();
    this.attMeasureLog?.ResetMeasureLog();
    this.attMeterConformanceBar?.ResetMeterConformanceBar();
    this.attNNumberLike?.ResetNNumberLike();
    this.attPointing?.ResetPointing();
    this.attTyped?.ResetTyped();

    this.m_index = VRV_UNSET;

    this.ResetDrawingScoreDef();

    this.m_timestampAligner?.Reset?.();
    this.m_drawingFacsX1 = VRV_UNSET;
    this.m_drawingFacsX2 = VRV_UNSET;
    this.m_drawingXRel = 0;

    this.m_cachedXRel = VRV_UNSET;
    this.m_cachedOverflow = VRV_UNSET;
    this.m_cachedWidth = VRV_UNSET;

    // by default, we have a single barLine on the right (none on the left)
    this.m_rightBarLine?.SetForm(this.GetRight());
    this.m_leftBarLine?.SetForm(this.GetLeft());

    this.m_drawingFacsX1 = VRV_UNSET;
    this.m_drawingFacsX2 = VRV_UNSET;

    this.m_drawingEnding = null;
    this.m_hasAlignmentRefWithMultipleLayers = false;

    this.m_scoreTimeOnset = [];
    this.m_realTimeOnsetMilliseconds = [];
    this.m_scoreTimeOffset = [];
    this.m_realTimeOffsetMilliseconds = [];
    this.m_currentTempo = MIDI_TEMPO;
  }

  private ensureComponents(): void {
    this.facsimileInterface ??= new FacsimileInterface();
    this.attBarring ??= new InstBarring();
    this.attCoordX1 ??= new InstCoordX1();
    this.attCoordX2 ??= new InstCoordX2();
    this.attMeasureLog ??= new InstMeasureLog();
    this.attMeterConformanceBar ??= new InstMeterConformanceBar();
    this.attNNumberLike ??= new InstNNumberLike();
    this.attPointing ??= new InstPointing();
    this.attTyped ??= new InstTyped();
  }

  public override GetFacsimileInterface(): FacsimileInterface | null {
    this.ensureComponents();
    return this.facsimileInterface;
  }

  /** Return true if measured music (otherwise we have fake measures). */
  public IsMeasuredMusic(): boolean { return this.m_measureType === MeasureType.MEASURED; }

  /** Return true if the measure represents a neume (section) line. */
  public IsNeumeLine(): boolean { return this.m_measureType === MeasureType.NEUMELINE; }

  /** C++ `Measure(UNMEASURED)` parity: segments created by ConvertToCastOffMensural. */
  public SetMeasureType(type: MeasureType): void { this.m_measureType = type; }

  /** Get and set the measure index. */
  public GetIndex(): number { return this.m_index; }
  public SetIndex(index: number): void { this.m_index = index; }

  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.OSSIA || classId === ClassId.STAFF || classId === ClassId.FACTORY_STAGEDIR) return true;
    if (VrvObject.IsControlElement(classId)) return true;
    if (VrvObject.IsEditorialElement(classId)) return true;
    return false;
  }

  public override AddChildAdditionalCheck(child: VrvObject): boolean {
    if (child.Is(ClassId.STAFF)) {
      const staff = child as Staff;
      if (staff && (staff.GetN() < 1)) {
        // This is not 100% safe if we have a <app> and <rdg> with more than
        // one staff as a previous child.
        staff.SetN(this.GetChildCount(ClassId.STAFF));
      }
    }
    return super.AddChildAdditionalCheck(child);
  }

  /** Specific method for measures: non-staff children go before the first staff. */
  public AddChildBack(child: VrvObject): boolean {
    this.ensureComponents();
    return this.addChildBack(child);
  }

  private addChildBack(child: VrvObject): boolean {
    // Mirrors Measure::AddChildBack (which bypasses GetInsertOrderFor).
    if (!this.IsSupportedChild(child.GetClassId() as ClassId) || !this.AddChildAdditionalCheck(child)) {
      // C++ logs an error; the base AddChild path does the same — keep behavior.
      return false;
    }
    child.SetParent(this);
    const children = this.GetChildrenForModification();
    if (children.length === 0) {
      children.push(child);
    }
    else if (children[children.length - 1].Is(ClassId.STAFF)) {
      children.push(child);
    }
    else {
      for (let i = 0; i < children.length; ++i) {
        if (!children[i].Is(ClassId.STAFF)) {
          children.splice(i, 0, child);
          break;
        }
      }
    }
    this.Modify();
    return true;
  }

  /** Return true if the Measure has cached values for the horizontal layout. */
  public HasCachedHorizontalLayout(): boolean { return this.m_cachedWidth !== VRV_UNSET; }

  public override GetDrawingX(): number {
    if (this.m_drawingFacsX1 !== VRV_UNSET) return this.m_drawingFacsX1;
    const cached = (this as unknown as { m_cachedDrawingX?: number }).m_cachedDrawingX;
    if (cached !== undefined && cached !== VRV_UNSET) return cached;

    const system = this.GetFirstAncestor(ClassId.SYSTEM) as unknown as MeasureSystemLike | null;
    if (!system) throw new Error('Measure::GetDrawingX: system ancestor expected.');
    const x = system.GetDrawingX() + this.GetDrawingXRel();
    (this as unknown as { m_cachedDrawingX: number }).m_cachedDrawingX = x;
    return x;
  }

  public override ResetCachedDrawingX(): void {
    super.ResetCachedDrawingX();
    this.m_timestampAligner.ResetCachedDrawingX();
  }

  public GetDrawingXRel(): number { return this.m_drawingXRel; }
  public SetDrawingXRel(drawingXRel: number): void {
    this.ResetCachedDrawingX();
    this.m_drawingXRel = drawingXRel;
  }
  public CacheXRel(restore = false): void {
    if (restore) {
      this.m_drawingXRel = this.m_cachedXRel;
    }
    else {
      this.m_cachedWidth = this.GetWidth();
      this.m_cachedOverflow = this.GetDrawingOverflow();
      this.m_cachedXRel = this.m_drawingXRel;
    }
  }
  public GetCachedXRel(): number { return this.m_cachedXRel; }
  public ResetCachedXRel(): void { this.m_cachedXRel = VRV_UNSET; }

  public IsFirstInSystem(): boolean {
    const parent = this.GetParent();
    if (!parent) throw new Error('Measure::IsFirstInSystem: parent expected.');
    return parent.GetFirst(ClassId.MEASURE) === (this as unknown as VrvObject);
  }

  public IsLastInSystem(): boolean {
    const parent = this.GetParent();
    if (!parent) throw new Error('Measure::IsLastInSystem: parent expected.');
    return parent.GetLast(ClassId.MEASURE) === (this as unknown as VrvObject);
  }

  /** Return the index position of the measure in its system parent. */
  public GetMeasureIdx(): number { return this.GetIdx(); }

  public GetDrawingLeftBarLine(): number { return this.m_leftBarLine.GetForm(); }
  public SetDrawingLeftBarLine(type: number): void { this.m_leftBarLine.SetForm(type); }
  public GetDrawingRightBarLine(): number { return this.m_rightBarLine.GetForm(); }
  public SetDrawingRightBarLine(type: number): void { this.m_rightBarLine.SetForm(type); }

  public GetDrawingLeftBarLineByStaffN(staffN: number): number {
    const pair = this.m_invisibleStaffBarlines.get(staffN);
    if (pair) return pair[0];
    return this.GetDrawingLeftBarLine();
  }

  public GetDrawingRightBarLineByStaffN(staffN: number): number {
    const pair = this.m_invisibleStaffBarlines.get(staffN);
    if (pair) return pair[1];
    return this.GetDrawingRightBarLine();
  }

  /** Return whether invisible-staff barline mapping is present in the measure. */
  public HasInvisibleStaffBarlines(): boolean { return this.m_invisibleStaffBarlines.size > 0; }

  /**
   * Select drawing barlines based on the previous right and current left
   * barlines (to avoid duplicated doubles or singles).
   */
  public SelectDrawingBarLines(previous: Measure): BarlineRenditionPair {
    const previousRight = Measure.drawingLines.get(previous.GetRight());
    const defaultValue: BarlineRenditionPair = [previous.GetRight(), this.GetLeft()];
    if (!previousRight) return defaultValue;
    const currentLeft = previousRight.get(this.GetLeft());
    if (!currentLeft) return defaultValue;
    return currentLeft;
  }

  /**
   * Set the drawing barlines for the measure.
   * Also adjust the right barline of the previous measure and the left one if necessary.
   */
  public SetDrawingBarLines(previous: Measure | null, barlineDrawingFlags: number): void {
    // First set the right barline. If none then set a single one.
    const rightBarline = this.HasRight() ? this.GetRight() : BARRENDITION_single;
    this.SetDrawingRightBarLine(rightBarline);

    // Now adjust the right barline of the previous measure (if any) and the left one
    if (!previous) {
      this.SetDrawingLeftBarLine(this.GetLeft());
    }
    else if (barlineDrawingFlags & BarlineDrawingFlags.SYSTEM_BREAK) {
      // we have rptboth on one of the two sides, split them (ignore any other value)
      if ((previous.GetRight() === BARRENDITION_rptboth) || (this.GetLeft() === BARRENDITION_rptboth)) {
        previous.SetDrawingRightBarLine(BARRENDITION_rptend);
        this.SetDrawingLeftBarLine(BARRENDITION_rptstart);
      }
      // nothing to do with any other value?
      else {
        this.SetDrawingLeftBarLine(this.GetLeft());
      }
    }
    else if (!((barlineDrawingFlags & BarlineDrawingFlags.SCORE_DEF_INSERT)
      || (barlineDrawingFlags & BarlineDrawingFlags.INVISIBLE_MEASURE_CURRENT)
      || (barlineDrawingFlags & BarlineDrawingFlags.INVISIBLE_MEASURE_PREVIOUS))) {
      // we have rptboth split in the two measures, make them one rptboth
      if ((previous.GetRight() === BARRENDITION_rptend) && (this.GetLeft() === BARRENDITION_rptstart)) {
        previous.SetDrawingRightBarLine(BARRENDITION_rptboth);
        this.SetDrawingLeftBarLine(BARRENDITION_NONE);
      }
      // we have an rptend before, make sure there in none on the left (ignore any other value)
      else if (previous.GetRight() === BARRENDITION_rptend) {
        this.SetDrawingLeftBarLine(BARRENDITION_NONE);
      }
      // we have an rptstart coming, make sure there is none on the right before (ignore any other value)
      else if (this.GetLeft() === BARRENDITION_rptstart) {
        // always set the right barline to invis for spacing
        previous.SetDrawingRightBarLine(BARRENDITION_invis);
        this.SetDrawingLeftBarLine(BARRENDITION_rptstart);
      }
      // we have an rptboth coming, make sure there is none on the right before (ignore any other value)
      else if (this.GetLeft() === BARRENDITION_rptboth) {
        // always set the right barline to invis for spacing
        previous.SetDrawingRightBarLine(BARRENDITION_invis);
        this.SetDrawingLeftBarLine(BARRENDITION_rptboth);
      }
      // handle other possible barline interactions
      else {
        const [right, left] = this.SelectDrawingBarLines(previous);
        if (right !== left) {
          previous.SetDrawingRightBarLine(right);
          this.SetDrawingLeftBarLine(left);
          if (this.HasInvisibleStaffBarlines()) this.GetLeftBarLine()!.SetPosition(BarLinePosition.None);
        }
      }
    }
    else {
      if ((barlineDrawingFlags & BarlineDrawingFlags.INVISIBLE_MEASURE_PREVIOUS)
        && !(barlineDrawingFlags & BarlineDrawingFlags.INVISIBLE_MEASURE_CURRENT)
        && !(barlineDrawingFlags & BarlineDrawingFlags.SCORE_DEF_INSERT)) {
        if (this.GetLeft() === BARRENDITION_NONE) {
          this.SetLeft(BARRENDITION_single);
        }
        this.GetLeftBarLine()!.SetPosition(BarLinePosition.None);
      }
      // with a scoredef inbetween always set it to what we have in the encoding
      this.SetDrawingLeftBarLine(this.GetLeft());
    }
  }

  /**
   * Create mapping of original barline values to staves in the measure that
   * are neighbored by invisible staves.
   */
  public SetInvisibleStaffBarlines(
    previous: Measure | null, currentInvisible: VrvObject[], previousInvisible: VrvObject[], barlineDrawingFlags: number
  ): void {
    if (!previous) return;

    // Process invisible staves in the current measure and set right barline values for previous measure
    for (const object of currentInvisible) {
      const staff = object as Staff;
      let right = previous.GetRight();
      if (right === BARRENDITION_NONE) right = BARRENDITION_single;
      const existing = (previous as Measure).m_invisibleStaffBarlines.get(staff.GetN());
      if (!existing) (previous as Measure).m_invisibleStaffBarlines.set(staff.GetN(), [BARRENDITION_NONE, right]);
      else existing[1] = right;
    }
    // Then process invisible staves in the previous measure and set left barline values in the current measure
    for (const object of previousInvisible) {
      const staff = object as Staff;
      let left = this.GetLeft();
      if ((left === BARRENDITION_NONE) && !(barlineDrawingFlags & BarlineDrawingFlags.SCORE_DEF_INSERT))
        left = BARRENDITION_single;
      const existing = this.m_invisibleStaffBarlines.get(staff.GetN());
      if (!existing) this.m_invisibleStaffBarlines.set(staff.GetN(), [left, BARRENDITION_NONE]);
      else existing[0] = left;
    }
  }

  public GetLeftBarLine(): BarLine | null { return this.m_leftBarLine; }
  public GetRightBarLine(): BarLine | null { return this.m_rightBarLine; }

  /** Return the non-justifiable left margin for the measure. */
  public GetNonJustifiableLeftMargin(): number { return this.m_measureAligner.GetNonJustifiableMargin(); }

  public GetLeftBarLineXRel(): number {
    const alignment = this.m_measureAligner.GetLeftBarLineAlignment();
    if (alignment) return alignment.GetXRel();
    return 0;
  }

  public GetLeftBarLineLeft(): number {
    let x = this.GetLeftBarLineXRel();
    if (this.m_leftBarLine.HasSelfBB()) {
      x += this.m_leftBarLine.GetContentX1();
    }
    return x;
  }

  public GetLeftBarLineRight(): number {
    let x = this.GetLeftBarLineXRel();
    if (this.m_leftBarLine.HasSelfBB()) {
      x += this.m_leftBarLine.GetContentX2();
    }
    return x;
  }

  public GetRightBarLineXRel(): number {
    const alignment = this.m_measureAligner.GetRightBarLineAlignment();
    if (alignment) return alignment.GetXRel();
    return 0;
  }

  /** Return the width of the right barline based on the barline form. */
  public CalculateRightBarLineWidth(doc: MeasureDocLike, staffSize: number): number {
    const barline = this.GetRightBarLine();
    if (!barline) return 0;

    const barLineWidth = doc.GetDrawingBarLineWidth(staffSize);
    const barLineThickWidth = Math.trunc(doc.GetDrawingUnit(staffSize) * doc.GetOptions().m_thickBarlineThickness.GetValue());
    const barLineSeparation = Math.trunc(doc.GetDrawingUnit(staffSize) * doc.GetOptions().m_barLineSeparation.GetValue());

    let width = 0;
    switch (barline.GetForm()) {
      case BARRENDITION_dbl:
      case BARRENDITION_dbldashed:
      case BARRENDITION_dbldotted: {
        width = barLineSeparation + barLineWidth;
        break;
      }
      case BARRENDITION_rptend:
      case BARRENDITION_end: {
        width = barLineSeparation + barLineWidth + barLineThickWidth;
        break;
      }
      case BARRENDITION_rptboth: {
        width = 2 * barLineSeparation + barLineWidth + barLineThickWidth;
        break;
      }
      default: break;
    }
    return width;
  }

  public GetRightBarLineLeft(): number {
    let x = this.GetRightBarLineXRel();
    if (this.m_rightBarLine.HasSelfBB()) {
      x += this.m_rightBarLine.GetContentX1();
    }
    return x;
  }

  public GetRightBarLineRight(): number {
    let x = this.GetRightBarLineXRel();
    if (this.m_rightBarLine.HasSelfBB()) {
      x += this.m_rightBarLine.GetContentX2();
    }
    return x;
  }

  /** Return the width of the measure, including the barLine width. */
  public GetWidth(): number {
    if (this.m_drawingFacsX2 !== VRV_UNSET) return (this.m_drawingFacsX2 - this.m_drawingFacsX1);
    const right = this.m_measureAligner.GetRightAlignment();
    if (!right) throw new Error('Measure::GetWidth: right alignment expected.');
    return right.GetXRel();
  }

  /** Return the inner width of the measure. */
  public GetInnerWidth(): number {
    return (this.GetRightBarLineLeft() - this.GetLeftBarLineRight());
  }

  /** Return the center x of the inner of the measure. */
  public GetInnerCenterX(): number {
    return (this.GetDrawingX() + this.GetLeftBarLineRight() + Math.trunc(this.GetInnerWidth() / 2));
  }

  public GetCachedWidth(): number { return this.m_cachedWidth; }
  public GetCachedOverflow(): number { return this.m_cachedOverflow; }
  public ResetCachedWidth(): void { this.m_cachedWidth = VRV_UNSET; }
  public ResetCachedOverflow(): void { this.m_cachedOverflow = VRV_UNSET; }

  /**
   * Return the right overflow of the control events in the measure.
   * Takes into account Dir, Dynam, and Tempo.
   */
  public GetDrawingOverflow(): number {
    const adjustXOverflow = Measure.collaborators.createOverflowFunctor(0);
    const system = this.GetFirstAncestor(ClassId.SYSTEM);
    if (!system) throw new Error('Measure::GetDrawingOverflow: system ancestor expected.');
    adjustXOverflow.SetCurrentSystem(system);
    adjustXOverflow.SetLastMeasure(this);
    this.Process(adjustXOverflow as unknown as never);

    const widestPositioner = adjustXOverflow.GetWidestPositioner();
    if (!widestPositioner) return 0;

    const measureRightX = this.GetDrawingX() + this.GetWidth();
    const overflow = widestPositioner.GetContentRight() - measureRightX;
    return Math.max(0, overflow);
  }

  /** Calculates the section restart shift. */
  public GetSectionRestartShift(doc: MeasureDocLike): number {
    if (this.IsFirstInSystem()) {
      return 0;
    }
    else {
      return 5 * doc.GetDrawingDoubleUnit(100);
    }
  }

  public GetDrawingScoreDef(): VrvObject | null { return this.m_drawingScoreDef; }
  public SetDrawingScoreDef(drawingScoreDef: VrvObject): void {
    if (this.m_drawingScoreDef) throw new Error('Measure::SetDrawingScoreDef: ResetDrawingScoreDef must be called first.');
    const fresh = new (drawingScoreDef.constructor as new () => VrvObject)();
    fresh.ReplaceWithCopyOf(drawingScoreDef);
    this.m_drawingScoreDef = fresh;
  }
  public ResetDrawingScoreDef(): void {
    this.m_drawingScoreDef = null;
  }

  public GetDrawingEnding(): VrvObject | null { return this.m_drawingEnding; }
  public SetDrawingEnding(ending: VrvObject | null): void { this.m_drawingEnding = ending; }

  public HasAlignmentRefWithMultipleLayers(hasRef?: boolean): boolean {
    if (hasRef !== undefined) this.m_hasAlignmentRefWithMultipleLayers = hasRef;
    return this.m_hasAlignmentRefWithMultipleLayers;
  }
  public SetHasAlignmentRefWithMultipleLayers(hasRef: boolean): void { this.m_hasAlignmentRefWithMultipleLayers = hasRef; }

  /**
   * Return the first staff of each staffGrp according to the scoreDef.
   */
  public GetFirstStaffGrpStaves(scoreDef: VrvObject): VrvObject[] {
    if (!scoreDef) throw new Error('Measure::GetFirstStaffGrpStaves: scoreDef expected.');
    const staves: VrvObject[] = [];
    const staffList: number[] = [];

    // First get all the staffGrps
    const staffGrps = scoreDef.FindAllDescendantsByType(ClassId.STAFFGRP);

    // Then the @n of each first staffDef
    for (const staffGrp of staffGrps) {
      const staffDef = staffGrp.FindDescendantByType(ClassId.STAFFDEF) as StaffDef | null;
      if (staffDef && (staffDef.GetDrawingVisibility() !== VisibilityOptimization.OPTIMIZATION_HIDDEN)
        && !staffList.includes(staffDef.GetN()))
        staffList.push(staffDef.GetN());
    }

    // Get the corresponding staves in the measure
    for (const staffN of staffList) {
      const staff = this.FindDescendantByComparison(new StaffNComparison(staffN), 1);
      if (!staff) {
        // LogDebug("Staff with @n '%d' not found in measure '%s'", *iter, measure->GetID().c_str());
        continue;
      }
      staves.push(staff);
    }
    return staves;
  }

  /** Return the bottom (last) visible staff in the measure (if any). */
  public GetBottomVisibleStaff(): Staff | null {
    let bottomStaff: Staff | null = null;
    const staves = this.FindAllDescendantsByType(ClassId.STAFF, false);
    for (const child of staves) {
      const staff = child as Staff;
      if (!staff.DrawingIsVisible()) {
        continue;
      }
      bottomStaff = staff;
    }
    return bottomStaff;
  }

  /** Return the first or last staff taking into account ossias (or not). */
  public GetStaffCount(excludeOStaves = true): number {
    let count = 0;
    const staves = this.FindAllDescendantsByType(ClassId.STAFF, false);
    for (const child of staves) {
      const staff = child as Staff;
      if (staff.IsOssia() && excludeOStaves) continue;
      count++;
    }
    return count;
  }

  public GetFirstStaff(excludeOStaves = true): Staff | null {
    const staves = this.FindAllDescendantsByType(ClassId.STAFF, false);
    for (const child of staves) {
      const staff = child as Staff;
      if (staff.IsOssia() && excludeOStaves) continue;
      return staff;
    }
    return null;
  }

  public GetLastStaff(excludeOStaves = true): Staff | null {
    const staves = this.FindAllDescendantsByType(ClassId.STAFF);
    const reversed = [...staves].reverse();
    for (const child of reversed) {
      const staff = child as Staff;
      if (staff.IsOssia() && excludeOStaves) continue;
      return staff;
    }
    return null;
  }

  /**
   * Check if the measure encloses the given time (in millisecond).
   * Return the playing repeat time (1-based), VRV_UNSET otherwise.
   */
  public EnclosesTime(time: number): number {
    let repeat = 1;
    const right = this.m_measureAligner.GetRightAlignment();
    if (!right) throw new Error('Measure::EnclosesTime: right alignment expected.');
    const timeDuration = right.GetTime().ToDouble() * SCORE_TIME_UNIT * 60.0 / this.m_currentTempo * 1000.0 + 0.5;
    for (const onset of this.m_realTimeOnsetMilliseconds) {
      if ((time >= onset) && (time <= onset + timeDuration)) return repeat;
      repeat++;
    }
    return VRV_UNSET;
  }

  public GetScoreTimeOnset(repeat: number = VRV_UNSET): Fraction {
    if (this.m_scoreTimeOnset.length === 0 || (repeat > this.m_scoreTimeOnset.length)) return new Fraction(0);
    if (repeat === VRV_UNSET) return this.m_scoreTimeOnset[this.m_scoreTimeOnset.length - 1];
    if (!(repeat > 0)) throw new Error('Measure::GetScoreTimeOnset: repeat must be positive.');
    return this.m_scoreTimeOnset[repeat - 1];
  }

  public GetRealTimeOnsetMilliseconds(repeat: number = VRV_UNSET): number {
    if (this.m_realTimeOnsetMilliseconds.length === 0 || (repeat > this.m_realTimeOnsetMilliseconds.length)) return 0;
    if (repeat === VRV_UNSET) return this.m_realTimeOnsetMilliseconds[this.m_realTimeOnsetMilliseconds.length - 1];
    if (!(repeat > 0)) throw new Error('Measure::GetRealTimeOnsetMilliseconds: repeat must be positive.');
    return this.m_realTimeOnsetMilliseconds[repeat - 1];
  }

  public GetScoreTimeOffset(repeat: number = VRV_UNSET): Fraction {
    if (this.m_scoreTimeOffset.length === 0 || (repeat > this.m_scoreTimeOffset.length)) return new Fraction(0);
    if (repeat === VRV_UNSET) return this.m_scoreTimeOffset[this.m_scoreTimeOffset.length - 1];
    if (!(repeat > 0)) throw new Error('Measure::GetScoreTimeOffset: repeat must be positive.');
    return this.m_scoreTimeOffset[repeat - 1];
  }

  public GetRealTimeOffsetMilliseconds(repeat: number = VRV_UNSET): number {
    if (this.m_realTimeOffsetMilliseconds.length === 0 || (repeat > this.m_realTimeOffsetMilliseconds.length)) return 0;
    if (repeat === VRV_UNSET) return this.m_realTimeOffsetMilliseconds[this.m_realTimeOffsetMilliseconds.length - 1];
    if (!(repeat > 0)) throw new Error('Measure::GetRealTimeOffsetMilliseconds: repeat must be positive.');
    return this.m_realTimeOffsetMilliseconds[repeat - 1];
  }

  public ClearScoreTimeOnset(): void { this.m_scoreTimeOnset = []; }
  public AddScoreTimeOnset(offset: Fraction): void { this.m_scoreTimeOnset.push(offset); }
  public ClearRealTimeOnsetMilliseconds(): void { this.m_realTimeOnsetMilliseconds = []; }
  public AddRealTimeOnsetMilliseconds(milliseconds: number): void { this.m_realTimeOnsetMilliseconds.push(milliseconds); }
  public ClearScoreTimeOffset(): void { this.m_scoreTimeOffset = []; }
  public AddScoreTimeOffset(offset: Fraction): void { this.m_scoreTimeOffset.push(offset); }
  public ClearRealTimeOffsetMilliseconds(): void { this.m_realTimeOffsetMilliseconds = []; }
  public AddRealTimeOffsetMilliseconds(milliseconds: number): void { this.m_realTimeOffsetMilliseconds.push(milliseconds); }

  public SetCurrentTempo(tempo: number): void { this.m_currentTempo = tempo; }
  public GetCurrentTempo(): number { return this.m_currentTempo; }

  /** Return vector with tie endpoints for ties that start and end in current measure. */
  public GetInternalTieEndpoints(): Array<[VrvObject, VrvObject]> {
    const children = this.FindAllDescendantsByType(ClassId.TIE);

    const endpoints: Array<[VrvObject, VrvObject]> = [];
    for (const object of children) {
      const tie = object as unknown as { GetStart(): VrvObject | null, GetEnd(): VrvObject | null };
      // If both start and end points of the tie are not within current measure - skip it
      const start = tie.GetStart();
      if (!start || (start.GetFirstAncestor(ClassId.MEASURE) !== (this as unknown as VrvObject))) continue;
      const end = tie.GetEnd();
      if (!end || (end.GetFirstAncestor(ClassId.MEASURE) !== (this as unknown as VrvObject))) continue;
      endpoints.push([start, end]);
    }

    return endpoints;
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitMeasure', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitMeasureEnd', this); }
  public AcceptConst(functor: unknown): FunctorCode { return visitor(functor, 'VisitMeasure', this); }
  public AcceptEndConst(functor: unknown): FunctorCode { return visitor(functor, 'VisitMeasureEnd', this); }

  //---------------//
  // MEI attribute //
  //---------------//

  // AttBarring
  public ResetBarring(): void { this.ensureComponents(); this.attBarring!.ResetBarring(); }
  public SetBarLen(v: number): void { this.ensureComponents(); this.attBarring!.SetBarLen(v); }
  public GetBarLen(): number { this.ensureComponents(); return this.attBarring!.GetBarLen(); }
  public HasBarLen(): boolean { this.ensureComponents(); return this.attBarring!.HasBarLen(); }
  public SetBarMethod(v: number): void { this.ensureComponents(); this.attBarring!.SetBarMethod(v); }
  public GetBarMethod(): number { this.ensureComponents(); return this.attBarring!.GetBarMethod(); }
  public HasBarMethod(): boolean { this.ensureComponents(); return this.attBarring!.HasBarMethod(); }
  public SetBarPlace(v: number): void { this.ensureComponents(); this.attBarring!.SetBarPlace(v); }
  public GetBarPlace(): number { this.ensureComponents(); return this.attBarring!.GetBarPlace(); }
  public HasBarPlace(): boolean { this.ensureComponents(); return this.attBarring!.HasBarPlace(); }
  // AttCoordX1
  public SetCoordX1(v: number): void { this.ensureComponents(); this.attCoordX1!.SetCoordX1(v); }
  public GetCoordX1(): number { return this.attCoordX1!.GetCoordX1(); }
  public HasCoordX1(): boolean { return this.attCoordX1!.HasCoordX1(); }
  public ResetCoordX1(): void { this.ensureComponents(); this.attCoordX1!.ResetCoordX1(); }
  // AttCoordX2
  public SetCoordX2(v: number): void { this.ensureComponents(); this.attCoordX2!.SetCoordX2(v); }
  public GetCoordX2(): number { return this.attCoordX2!.GetCoordX2(); }
  public HasCoordX2(): boolean { return this.attCoordX2!.HasCoordX2(); }
  public ResetCoordX2(): void { this.ensureComponents(); this.attCoordX2!.ResetCoordX2(); }
  // AttMeasureLog
  public SetLeft(v: number): void { this.ensureComponents(); this.attMeasureLog!.SetLeft(v); }
  public GetLeft(): number { return this.attMeasureLog!.GetLeft(); }
  public HasLeft(): boolean { return this.attMeasureLog!.HasLeft(); }
  public SetRight(v: number): void { this.ensureComponents(); this.attMeasureLog!.SetRight(v); }
  public GetRight(): number { return this.attMeasureLog!.GetRight(); }
  public HasRight(): boolean { return this.attMeasureLog!.HasRight(); }
  public ResetMeasureLog(): void { this.ensureComponents(); this.attMeasureLog!.ResetMeasureLog(); }
  // AttMeterConformanceBar
  public ResetMeterConformanceBar(): void { this.ensureComponents(); this.attMeterConformanceBar!.ResetMeterConformanceBar(); }
  public SetMetcon(v: number): void { this.ensureComponents(); this.attMeterConformanceBar!.SetMetcon(v); }
  public GetMetcon(): number { this.ensureComponents(); return this.attMeterConformanceBar!.GetMetcon(); }
  public HasMetcon(): boolean { this.ensureComponents(); return this.attMeterConformanceBar!.HasMetcon(); }
  public SetControl(v: number): void { this.ensureComponents(); this.attMeterConformanceBar!.SetControl(v); }
  public GetControl(): number { this.ensureComponents(); return this.attMeterConformanceBar!.GetControl(); }
  public HasControl(): boolean { this.ensureComponents(); return this.attMeterConformanceBar!.HasControl(); }
  // AttNNumberLike
  public SetN(v: number): void { this.ensureComponents(); this.attNNumberLike!.SetN(v); }
  public GetN(): number { return this.attNNumberLike!.GetN(); }
  public HasN(): boolean { return this.attNNumberLike!.HasN(); }
  public ResetNNumberLike(): void { this.ensureComponents(); this.attNNumberLike!.ResetNNumberLike(); }
  // AttPointing
  public ResetPointing(): void { this.ensureComponents(); this.attPointing!.ResetPointing(); }
  public SetActuate(v: any): void { this.ensureComponents(); this.attPointing!.SetActuate(v); }
  public GetActuate(): any { this.ensureComponents(); return this.attPointing!.GetActuate(); }
  public HasActuate(): boolean { this.ensureComponents(); return this.attPointing!.HasActuate(); }
  public SetRole(v: any): void { this.ensureComponents(); this.attPointing!.SetRole(v); }
  public GetRole(): any { this.ensureComponents(); return this.attPointing!.GetRole(); }
  public HasRole(): boolean { this.ensureComponents(); return this.attPointing!.HasRole(); }
  public SetShow(v: any): void { this.ensureComponents(); this.attPointing!.SetShow(v); }
  public GetShow(): any { this.ensureComponents(); return this.attPointing!.GetShow(); }
  public HasShow(): boolean { this.ensureComponents(); return this.attPointing!.HasShow(); }
  public SetTarget(v: any): void { this.ensureComponents(); this.attPointing!.SetTarget(v); }
  public GetTarget(): any { this.ensureComponents(); return this.attPointing!.GetTarget(); }
  public HasTarget(): boolean { this.ensureComponents(); return this.attPointing!.HasTarget(); }
  public SetTargettype(v: any): void { this.ensureComponents(); this.attPointing!.SetTargettype(v); }
  public GetTargettype(): any { this.ensureComponents(); return this.attPointing!.GetTargettype(); }
  public HasTargettype(): boolean { this.ensureComponents(); return this.attPointing!.HasTargettype(); }
  // AttTyped
  public SetType(v: string): void { this.ensureComponents(); this.attTyped!.SetType(v); }
  public GetType(): string { return this.attTyped!.GetType(); }
  public HasType(): boolean { return this.attTyped!.HasType(); }
  public ResetTyped(): void { this.ensureComponents(); this.attTyped!.ResetTyped(); }

  //----------------------------------------------------------------------------//
  // Static barline-selection table (mirrors the C++ `drawingLines` map)       //
  //----------------------------------------------------------------------------//

  /** Barlines stored as: previous right -> current left -> [previous, current]. */
  private static readonly drawingLines: Map<number, Map<number, BarlineRenditionPair>> = Measure.buildDrawingLines();

  private static buildDrawingLines(): Map<number, Map<number, BarlineRenditionPair>> {
    // Previous-right -> current-left -> expected (previous, current).
    // Keep the exact C++ table entries (dotted/dashed/single/dbldotted/dbldashed/dbl previous).
    const none = BARRENDITION_NONE;
    const dotted = BARRENDITION_dotted;
    const dashed = BARRENDITION_dashed;
    const single = BARRENDITION_single;
    const dbldotted = BARRENDITION_dbldotted;
    const dbldashed = BARRENDITION_dbldashed;
    const dbl = BARRENDITION_dbl;
    const table: Array<[number, Array<[number, BarlineRenditionPair]>]> = [
      [dotted, [[dotted, [dotted, none]], [dashed, [dashed, none]], [single, [single, none]], [dbldotted, [dbldotted, none]], [dbldashed, [dbldashed, none]], [dbl, [dbl, none]]]],
      [dashed, [[dotted, [dashed, none]], [dashed, [dashed, none]], [single, [single, none]], [dbldotted, [dashed, dotted]], [dbldashed, [dbldashed, none]], [dbl, [dbl, none]]]],
      [single, [[dotted, [single, none]], [dashed, [single, none]], [single, [single, none]], [dbldotted, [single, dotted]], [dbldashed, [single, dashed]], [dbl, [dbl, none]]]],
      [dbldotted, [[dotted, [dbldotted, none]], [dashed, [dotted, dashed]], [single, [dotted, single]], [dbldotted, [dbldotted, none]], [dbldashed, [dbldashed, none]], [dbl, [dbl, none]]]],
      [dbldashed, [[dotted, [dbldashed, none]], [dashed, [dbldashed, none]], [single, [dashed, single]], [dbldotted, [dbldashed, none]], [dbldashed, [dbldashed, none]], [dbl, [dbl, none]]]],
      [dbl, [[dotted, [dbl, none]], [dashed, [dbl, none]], [single, [dbl, none]], [dbldotted, [dbl, none]], [dbldashed, [dbl, none]], [dbl, [dbl, none]]]],
    ];
    const outer = new Map<number, Map<number, BarlineRenditionPair>>();
    for (const [prev, pairs] of table) {
      const inner = new Map<number, BarlineRenditionPair>();
      for (const [cur, value] of pairs) inner.set(cur, value);
      outer.set(prev, inner);
    }
    return outer;
  }
}

/** STAFF @n comparison for GetFirstStaffGrpStaves (mirrors AttNIntegerComparison). */
class StaffNComparison extends AttNIntegerComparison {
  public constructor(staffN: number) {
    super(ClassId.STAFF, staffN);
  }
}

/** C++ FunctorInterface default forwarding helper (VisitMeasure -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('measure', ClassId.MEASURE, () => new Measure());
