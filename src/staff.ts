/**
 * Pure TypeScript translation of Verovio's `Staff` and `LedgerLine`
 * (`src-cpp/src/staff.cpp` + `src-cpp/include/vrv/staff.h`).
 *
 * C++ has `Staff` inherit `Object` + `VisibilityDrawingInterface` +
 * `FacsimileInterface` + four generated libMEI attribute classes;
 * TypeScript models the multiple inheritance with composition.
 */
import { ClassId, FunctorCode, VRV_UNSET, VisibilityOptimization, VisibilityType } from './vrvdef.js';
import { ObjectFactory, VrvObject } from './object.js';
import { FacsimileInterface, ZoneLike } from './facsimileinterface.js';
import { VisibilityDrawingInterface } from './drawinginterface.js';
import { InstCoordY1, InstNInteger, InstTyped, InstVisibility } from './atts_shared.js';
import { IsNeumeType } from './vrv.js';

/** Canonical constant from `vrvdef.h`. */
const OSSIA_N_OFFSET = 1000000;
const TABLATURE_STAFF_RATIO = 1.75;
const GERMAN_TAB_STAFF_RATIO = 2.2;

/** libmei notation-type ordinals (attconverter.ts). */
const NOTATIONTYPE_NONE = 0;
const NOTATIONTYPE_mensural = 2;
const NOTATIONTYPE_mensural_black = 3;
const NOTATIONTYPE_mensural_white = 4;
const NOTATIONTYPE_tab = 8;
const NOTATIONTYPE_tab_staff_like = 9;
const NOTATIONTYPE_tab_guitar = 10;
const NOTATIONTYPE_tab_lute_french = 11;
const NOTATIONTYPE_tab_lute_italian = 12;
const NOTATIONTYPE_tab_lute_german = 13;

/** libmei staff-relative ordinals. */
const STAFFREL_above = 1;
const STAFFREL_below = 2;

/** libmei bar rendition ordinals. */
const BARRENDITION_NONE = 0;

/** Structural contract for the system ancestor used by `GetDrawingY`. */
interface StaffSystemLike {
  GetDrawingY(): number;
}

/** Structural contract for the staff-alignment used by C++ `Staff::GetDrawingY`. */
interface StaffAlignmentLike {
  GetYRel(): number;
}

/** Structural contract for the measure ancestor used by `GetOssiaDrawingShift`. */
interface StaffMeasureLike {
  GetLeftBarLineLeft(): number;
  GetLeftBarLine(): { GetForm(): number };
}

/** Structural contract for the ossia ancestor used by `GetOssiaDrawingShift`. */
interface StaffOssiaLike {
  GetScoreDefShift(): number;
  DrawScoreDef(): boolean;
  IsFirst(): boolean;
}

/** Structural contract for the layer descendant used by `GetOssiaDrawingShift`. */
interface StaffLayerLike {
  DrawOssiaStaffDef(): boolean;
}

/** Structural contract for the staff-def reference held by the staff. */
interface StaffDefLike {
  HasType(): boolean;
  GetType(): string | null;
  GetCurrentMensur?(): unknown | null;
  GetCurrentMeterSig?(): unknown | null;
  GetCurrentProport?(): unknown | null;
  AlternateCurrentMeterSig?(measure: unknown): void;
}

/** Structural contract for the tuning reference held by the staff. */
interface StaffTuningLike {}

/** Structural contract for the staff-alignment reference held by the staff. */
interface StaffAlignmentLike {
  GetYRel(): number;
}

/** Helper to mark drawingY on staff without breaking base signature. */
interface StaffDrawingYSupport {
  drawingY?: number;
  SetDrawingY?(v: number): void;
}

/** Structural contract for the doc ancestor used by facsimile paths. */
export interface StaffDocLike {
  IsFacs(): boolean;
  IsTranscription(): boolean;
  IsNeumeLines(): boolean;
  GetOptions(): { m_unit: { GetValue(): number } };
  GetDrawingUnit(staffSize: number): number;
  GetDrawingBarLineWidth(staffSize: number): number;
}

/** Structural contract for a time-spanning element collected on the staff. */
export interface TimeSpanningElementLike {
  GetStart(): unknown | null;
}

/** A horizontal dash of a ledger line (C++ `LedgerLine::Dash` struct). */
export class LedgerLineDash {
  public m_x1: number;
  public m_x2: number;
  public m_event: VrvObject | null;

  constructor(x1: number, x2: number, event: VrvObject | null) {
    this.m_x1 = x1;
    this.m_x2 = x2;
    this.m_event = event;
  }

  public MergeWith(other: LedgerLineDash): void {
    this.m_x1 = Math.min(this.m_x1, other.m_x1);
    this.m_x2 = Math.max(this.m_x2, other.m_x2);
    // Only for debugging / performance checks
    // this->m_event = other.m_event;
  }
}

/** Pure TypeScript translation of Verovio's `LedgerLine`. */
export class LedgerLine {
  public readonly m_dashes: LedgerLineDash[] = [];

  /**
   * Insert-position parity with the C++ `std::list` insertion loop: the dash
   * is inserted before the first existing dash whose `m_x1` is greater than
   * `left` (stable sorted order).
   */
  public AddDash(left: number, right: number, extension: number, event: VrvObject | null): void {
    if (!(left < right)) throw new Error('LedgerLine::AddDash: left < right expected');

    // First add the dash
    let insertIndex = this.m_dashes.length;
    for (let i = 0; i < this.m_dashes.length; ++i) {
      if (this.m_dashes[i].m_x1 > left) {
        insertIndex = i;
        break;
      }
    }
    this.m_dashes.splice(insertIndex, 0, new LedgerLineDash(left, right, event));

    // Merge dashes which overlap by more than 1.5 extensions
    // => Dashes belonging to the same chord overlap at least by two extensions and will get merged
    // => Overlapping dashes of adjacent notes will not get merged
    if (this.m_dashes.length < 2) return;
    let prevIndex = 0;
    let iterIndex = 1;
    while (iterIndex < this.m_dashes.length) {
      const previous = this.m_dashes[prevIndex];
      const current = this.m_dashes[iterIndex];
      if (previous.m_x2 > current.m_x1 + 1.5 * extension) {
        previous.MergeWith(current);
        this.m_dashes.splice(iterIndex, 1);
      } else {
        prevIndex = iterIndex;
        ++iterIndex;
      }
    }
  }
}

/** Pure TypeScript translation of Verovio's `Staff`. */
export class Staff extends VrvObject {
  private readonly visibilityDrawingInterface: VisibilityDrawingInterface;
  private facsimileInterface: FacsimileInterface | null = null;
  private attCoordY1: InstCoordY1 | null = null;
  private attNInteger: InstNInteger | null = null;
  private attTyped: InstTyped | null = null;
  private attVisibility: InstVisibility | null = null;

  private m_isOssia: boolean = false;
  private m_drawingFacsY: number = -0x7fffffff; // VRV_UNSET
  private m_drawingStaffSize: number = 100;
  private m_drawingLines: number = 5;
  private m_drawingNotationType: number = NOTATIONTYPE_NONE;
  private m_staffAlignment: StaffAlignmentLike | null = null;
  private readonly m_timeSpanningElements: TimeSpanningElementLike[] = [];
  private m_drawingStaffDef: StaffDefLike | null = null;
  private m_drawingTuning: StaffTuningLike | null = null;
  private m_drawingRotation: number = 0.0;
  private readonly m_ledgerLinesAbove: LedgerLine[] = [];
  private readonly m_ledgerLinesBelow: LedgerLine[] = [];
  private readonly m_ledgerLinesAboveCue: LedgerLine[] = [];
  private readonly m_ledgerLinesBelowCue: LedgerLine[] = [];

  public drawingY: number = 2147483647;

  public constructor(n: number = 1, isOssia: boolean = false) {
    super(ClassId.STAFF);
    this.visibilityDrawingInterface = new VisibilityDrawingInterface();
    this.ensureComponents();
    this.RegisterAttClass(ATT_COORDY1);
    this.RegisterAttClass(ATT_NINTEGER);
    this.RegisterAttClass(ATT_TYPED);
    this.RegisterAttClass(ATT_VISIBILITY);
    this.RegisterInterface(this.facsimileInterface!.GetAttClasses(), this.facsimileInterface!.IsInterface());
    this.Reset();
    this.SetN(n);
    this.SetOssia(isOssia);
  }

  public override GetClassName(): string { return 'staff'; }

  public override Reset(): void {
    super.Reset();
    this.visibilityDrawingInterface?.Reset();
    this.facsimileInterface?.Reset();
    this.attCoordY1?.ResetCoordY1();
    this.attNInteger?.ResetNInteger();
    this.attTyped?.ResetTyped();
    this.attVisibility?.ResetVisibility();

    this.m_isOssia = false;

    this.m_drawingFacsY = -0x7fffffff; // VRV_UNSET

    this.m_drawingStaffSize = 100;
    this.m_drawingLines = 5;
    this.m_drawingNotationType = NOTATIONTYPE_NONE;
    this.m_staffAlignment = null;
    if (this.m_timeSpanningElements) this.m_timeSpanningElements.length = 0;
    this.m_drawingStaffDef = null;
    this.m_drawingTuning = null;
    this.m_drawingRotation = 0.0;

    this.ClearLedgerLines?.();
  }

  public override CloneReset(): void {
    super.CloneReset();
    this.m_drawingStaffSize = 100;
    this.m_drawingLines = 5;
    this.m_drawingNotationType = NOTATIONTYPE_NONE;
    this.m_staffAlignment = null;
    this.m_timeSpanningElements?.length ? this.m_timeSpanningElements.length = 0 : undefined;
    this.m_drawingStaffDef = null;
    this.m_drawingTuning = null;
    this.m_drawingRotation = 0.0;
  }

  private ensureComponents(): void {
    this.facsimileInterface ??= new FacsimileInterface();
    this.attCoordY1 ??= new InstCoordY1();
    this.attNInteger ??= new InstNInteger();
    this.attTyped ??= new InstTyped();
    this.attVisibility ??= new InstVisibility();
  }

  //---------------//
  // Ossia staff n //
  //---------------//

  public GetNForOssia(): number {
    // C++ assert(!this->IsOssia())
    if (this.IsOssia()) throw new Error('Staff::GetNForOssia: ossia staff not expected');
    return this.GetN() + OSSIA_N_OFFSET;
  }

  public GetNFromOssia(): number {
    // C++ assert(this->IsOssia())
    if (!this.IsOssia()) throw new Error('Staff::GetNFromOssia: ossia staff expected');
    return this.GetN() - OSSIA_N_OFFSET;
  }

  public IsOssia(): boolean { return this.m_isOssia; }
  public SetOssia(isOssia: boolean): void { this.m_isOssia = isOssia; }

  public AttributesToExternal(): void {
    if (this.IsOssia() && this.HasN()) this.SetN(this.GetN() - OSSIA_N_OFFSET);
  }

  public AttributesToInternal(): void {
    if (this.IsOssia() && this.HasN()) this.SetN(this.GetN() + OSSIA_N_OFFSET);
  }

  //-----------------------//
  // Rotation and rotation //
  //-----------------------//

  public HasDrawingRotation(): boolean { return this.m_drawingRotation !== 0.0; }

  public GetDrawingRotationOffsetFor(x: number): number {
    const xDiff = x - this.GetDrawingX();
    // C++ `int(...)` truncation
    return Math.trunc(xDiff * Math.tan(this.GetDrawingRotation() * Math.PI / 180.0));
  }

  public GetDrawingRotation(): number { return this.m_drawingRotation; }
  public SetDrawingRotation(rotation: number): void { this.m_drawingRotation = rotation; }

  //--------------//
  // Ledger lines //
  //--------------//

  public ClearLedgerLines(): void {
    // Guarded because the VrvObject base constructor dispatches the virtual
    // Reset() before derived field initializers run.
    if (!this.m_ledgerLinesAbove) return;
    this.m_ledgerLinesAbove.length = 0;
    this.m_ledgerLinesBelow.length = 0;
    this.m_ledgerLinesAboveCue.length = 0;
    this.m_ledgerLinesBelowCue.length = 0;
  }

  public GetLedgerLinesAbove(): LedgerLine[] { return this.m_ledgerLinesAbove; }
  public GetLedgerLinesBelow(): LedgerLine[] { return this.m_ledgerLinesBelow; }
  public GetLedgerLinesAboveCue(): LedgerLine[] { return this.m_ledgerLinesAboveCue; }
  public GetLedgerLinesBelowCue(): LedgerLine[] { return this.m_ledgerLinesBelowCue; }

  public AddLedgerLineAbove(count: number, left: number, right: number, extension: number, cueSize: boolean, event: VrvObject | null): void {
    this.AddLedgerLines(cueSize ? this.m_ledgerLinesAboveCue : this.m_ledgerLinesAbove, count, left, right, extension, event);
  }

  public AddLedgerLineBelow(count: number, left: number, right: number, extension: number, cueSize: boolean, event: VrvObject | null): void {
    this.AddLedgerLines(cueSize ? this.m_ledgerLinesBelowCue : this.m_ledgerLinesBelow, count, left, right, extension, event);
  }

  private AddLedgerLines(lines: LedgerLine[], count: number, left: number, right: number, extension: number, event: VrvObject | null): void {
    if (!(left < right)) throw new Error('Staff::AddLedgerLines: left < right expected');
    while (lines.length < count) lines.push(new LedgerLine());
    for (let i = 0; i < count; ++i) {
      lines[i].AddDash(left, right, extension, event);
    }
  }

  //---------//
  // Children //
  //---------//

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [ClassId.LAYER];
    if (supported.includes(classId)) return true;
    if (VrvObject.IsEditorialElement(classId)) return true;
    return false;
  }

  public override AddChildAdditionalCheck(child: VrvObject): boolean {
    if (child.Is(ClassId.LAYER)) {
      const layer = child as unknown as { HasN(): boolean; SetN(v: number): void };
      if (!layer.HasN()) {
        // This is not 100% safe if we have a <app> and <rdg> with more than
        // one layer as a previous child.
        layer.SetN(this.GetChildCount(ClassId.LAYER) + 1);
      }
    }
    return super.AddChildAdditionalCheck(child);
  }

  //---------------//
  // Drawing state //
  //---------------//

  public GetDrawingX(): number {
    if (this.HasFacs()) {
      const doc = this.GetFirstAncestor(ClassId.DOC) as unknown as StaffDocLike | null;
      if (doc?.IsFacs()) {
        return this.facsimileInterface!.GetDrawingX();
      }
    }
    return super.GetDrawingX();
  }

  public GetDrawingRotate(): number {
    if (this.HasFacs()) {
      const doc = this.GetFirstAncestor(ClassId.DOC) as unknown as StaffDocLike | null;
      if (doc && (doc.IsFacs() || doc.IsTranscription())) {
        return this.facsimileInterface!.GetDrawingRotate();
      }
    }
    return 0;
  }

  public SetDrawingFacsY(y: number): void { this.m_drawingFacsY = y; }
  public GetDrawingFacsY(): number { return this.m_drawingFacsY; }

  public AdjustDrawingStaffSize(): void {
    if (this.HasFacs()) {
      const doc = this.GetFirstAncestor(ClassId.DOC) as unknown as StaffDocLike | null;
      if (!doc) throw new Error('Staff::AdjustDrawingStaffSize: doc ancestor expected');
      if (doc.IsFacs() || doc.IsNeumeLines()) {
        const rotate = this.GetDrawingRotate();
        const zone = this.GetZone() as (ZoneLike & { GetLry(): number; GetUly(): number }) | null;
        if (!zone) throw new Error('Staff::AdjustDrawingStaffSize: zone expected');
        const yDiff = zone.GetLry() - zone.GetUly() - (zone.GetLrx() - zone.GetUlx()) * Math.tan(Math.abs(rotate) * Math.PI / 180.0);
        // C++ double -> int member assignment truncation
        this.m_drawingStaffSize = Math.trunc(100 * yDiff / (doc.GetOptions().m_unit.GetValue() * 2 * (this.m_drawingLines - 1)));
      }
    }
  }

  public GetDrawingStaffNotationSize(): number {
    if (this.IsTabLuteGerman()) return Math.round(this.m_drawingStaffSize / GERMAN_TAB_STAFF_RATIO);
    return this.IsTablature() ? Math.round(this.m_drawingStaffSize / TABLATURE_STAFF_RATIO) : this.m_drawingStaffSize;
  }

  public DrawingIsVisible(): boolean {
    if (this.IsHidden()) return false;

    const system = this.GetFirstAncestor(ClassId.SYSTEM) as unknown as (StaffSystemLike & {
      GetDrawingScoreDef(): { GetStaffDef(n: number): { GetDrawingVisibility(): number } | null };
    }) | null;
    if (!system) throw new Error('Staff::DrawingIsVisible: system ancestor expected');
    const staffDef = system.GetDrawingScoreDef().GetStaffDef(this.GetN());
    if (!staffDef) throw new Error('Staff::DrawingIsVisible: staffDef expected');
    return staffDef.GetDrawingVisibility() !== VisibilityOptimization.OPTIMIZATION_HIDDEN;
  }

  public SetFromFacsimile(doc: StaffDocLike & { GetFacsimile(): { FindZoneByID(id: string): ZoneLike | null } }): void {
    if (!this.HasFacs()) return;
    if (this.GetZone() == null) {
      const zone = doc.GetFacsimile().FindZoneByID(this.GetFacs());
      if (!zone) throw new Error('Staff::SetFromFacsimile: zone expected');
      this.AttachZone(zone);
    }
    this.AdjustDrawingStaffSize();
  }

  //---------------------------//
  // Notation type predicates  //
  //---------------------------//

  public IsMensural(): boolean {
    return this.m_drawingNotationType === NOTATIONTYPE_mensural
      || this.m_drawingNotationType === NOTATIONTYPE_mensural_white
      || this.m_drawingNotationType === NOTATIONTYPE_mensural_black;
  }

  public IsNeume(): boolean {
    return IsNeumeType(this.m_drawingNotationType);
  }

  public IsTablature(): boolean {
    // NOTATIONTYPE_tab_staff_like is excluded as it is neither tablature nor CMN, a hybrid.
    // So is always tested for explicitly
    return this.m_drawingNotationType === NOTATIONTYPE_tab
      || this.m_drawingNotationType === NOTATIONTYPE_tab_guitar
      || this.m_drawingNotationType === NOTATIONTYPE_tab_lute_italian
      || this.m_drawingNotationType === NOTATIONTYPE_tab_lute_french
      || this.m_drawingNotationType === NOTATIONTYPE_tab_lute_german;
  }

  public IsTabGuitar(): boolean { return this.m_drawingNotationType === NOTATIONTYPE_tab_guitar; }
  public IsTabLuteGerman(): boolean { return this.m_drawingNotationType === NOTATIONTYPE_tab_lute_german; }
  public IsTabLuteItalian(): boolean { return this.m_drawingNotationType === NOTATIONTYPE_tab_lute_italian; }
  public IsTabLuteFrench(): boolean { return this.m_drawingNotationType === NOTATIONTYPE_tab_lute_french; }
  // C++ staff.h inline: m_drawingNotationType == NOTATIONTYPE_tab_staff_like (ordinal 9)
  public IsTabStaffLike(): boolean { return this.m_drawingNotationType === NOTATIONTYPE_tab_staff_like; }

  public IsTabWithStemsOutside(): boolean {
    if (!this.m_drawingStaffDef) return false;
    // Temporary implementation looking at staffDef@type
    return !this.IsTabGuitar() || !this.m_drawingStaffDef.HasType() || this.m_drawingStaffDef.GetType() !== 'stems.within';
  }

  public GetDrawingNotationType(): number { return this.m_drawingNotationType; }
  public SetDrawingNotationType(notationType: number): void { this.m_drawingNotationType = notationType; }

  //-------------------------//
  // Geometry / positioning  //
  //-------------------------//

  public CalcPitchPosYRel(doc: StaffDocLike, loc: number): number {
    // the staff loc offset is based on the number of lines: 0 with 1 line, 2 with 2, etc
    // C++ computes in 32-bit int (wraps when m_drawingLines == VRV_UNSET); replicate with imul/|0.
    const staffLocOffset = Math.imul((this.m_drawingLines - 1) | 0, 2);
    return Math.imul((loc - staffLocOffset) | 0, doc.GetDrawingUnit(this.m_drawingStaffSize));
  }

  public override GetDrawingY(): number {
    if (this.m_drawingFacsY !== VRV_UNSET) return this.m_drawingFacsY;
    if (!this.m_staffAlignment) return 0;
    if (this.m_cachedDrawingY !== VRV_UNSET) return this.m_cachedDrawingY;
    // Propagation of System Y through StaffAlignment YRel
    // C++ Staff::GetDrawingY (staff.cpp:192-205) returns cached Y
    // Decompose into System.Y + StaffAlignment.YRel to match C++
    const system = this.GetFirstAncestor(ClassId.SYSTEM) as unknown as { GetDrawingY?(): number } | null;
    if (!system) return 0;

    // Compute and cache using BoundingBox's m_cachedDrawingY
    const center = system.GetDrawingY?.() ?? 0;
    this.m_cachedDrawingY = center + this.m_staffAlignment.GetYRel();
    return this.m_cachedDrawingY;
  }

  public IsOnStaffLine(y: number, doc: StaffDocLike): boolean {
    return (y - this.GetDrawingY()) % (2 * doc.GetDrawingUnit(this.m_drawingStaffSize)) === 0;
  }

  public GetNearestInterStaffPosition(y: number, doc: StaffDocLike, place: number): number {
    const yPos = y - this.GetDrawingY();
    const unit = doc.GetDrawingUnit(this.m_drawingStaffSize);
    let distance = yPos % unit;
    if (place === STAFFREL_above) {
      if (distance > 0) distance = unit - distance;
      return y - distance + unit;
    } else {
      if (distance < 0) distance = unit + distance;
      return y - distance - unit;
    }
  }

  //---------------//
  // Ossia shift    //
  //---------------//

  public GetOssiaDrawingShift(measure: StaffMeasureLike, doc: StaffDocLike): number {
    const ossia = this.GetFirstAncestor(ClassId.OSSIA) as unknown as StaffOssiaLike | null;
    const layer = this.FindDescendantByType(ClassId.LAYER) as unknown as StaffLayerLike | null;
    if (!ossia && !layer) return 0;

    if (layer!.DrawOssiaStaffDef()) {
      const shift = ossia!.GetScoreDefShift();
      // The ossia scoreDef shift is the position of the clef (or key signature)
      return shift - 1.5 * doc.GetDrawingUnit(this.m_drawingStaffSize);
    } else if (ossia!.DrawScoreDef() || !ossia!.IsFirst()) {
      return 0;
    }

    let shift = measure.GetLeftBarLineLeft();
    // When there is no left barline on the measure we need to adjust the position
    if (measure.GetLeftBarLine().GetForm() === BARRENDITION_NONE) {
      // Measure bar lines are always 100
      shift -= doc.GetDrawingBarLineWidth(100) / 2;
    }
    return shift;
  }

  //-------------------//
  // Alignment state    //
  //-------------------//

  public SetStaffAlignment(alignment: StaffAlignmentLike | null): void { this.m_staffAlignment = alignment; }
  public GetStaffAlignment(): StaffAlignmentLike | null { return this.m_staffAlignment; }
  public SetAlignment(alignment: StaffAlignmentLike | null): void { this.SetStaffAlignment(alignment); }
  public GetAlignment(): StaffAlignmentLike | null { return this.GetStaffAlignment(); }

  public GetTimeSpanningElements(): TimeSpanningElementLike[] { return this.m_timeSpanningElements; }
  public ClearTimeSpanningElements(): void { this.m_timeSpanningElements?.length ? this.m_timeSpanningElements.length = 0 : undefined; }
  public AddTimeSpanningElement(element: TimeSpanningElementLike): void { this.m_timeSpanningElements.push(element); }

  public SetDrawingStaffDef(staffDef: StaffDefLike | null): void { this.m_drawingStaffDef = staffDef; }
  public GetDrawingStaffDef(): StaffDefLike | null { return this.m_drawingStaffDef; }

  public SetDrawingTuning(tuning: StaffTuningLike | null): void { this.m_drawingTuning = tuning; }
  public GetDrawingTuning(): StaffTuningLike | null { return this.m_drawingTuning; }

  public GetDrawingStaffSize(): number { return this.m_drawingStaffSize; }
  public SetDrawingStaffSize(size: number): void { this.m_drawingStaffSize = size; }

  public GetDrawingLines(): number { return this.m_drawingLines; }
  public SetDrawingLines(lines: number): void { this.m_drawingLines = lines; }

  //---------------------------//
  // Interface facades          //
  //---------------------------//

  // FacsimileInterface
  public SetFacs(value: string): void { this.facsimileInterface!.SetFacs(value); }
  public GetFacs(): string { return this.facsimileInterface!.GetFacs(); }
  public HasFacs(): boolean { return this.facsimileInterface!.HasFacs(); }
  public ResetFacsimile(): void { this.facsimileInterface!.ResetFacsimile(); }
  public AttachZone(zone: ZoneLike | null): void { this.facsimileInterface!.AttachZone(zone); }
  public GetZone(): ZoneLike | null { return this.facsimileInterface!.GetZone(); }
  public GetFacsimileInterface(): FacsimileInterface { this.ensureComponents(); return this.facsimileInterface!; }
  public GetVisibilityDrawingInterface(): VisibilityDrawingInterface { return this.visibilityDrawingInterface; }

  // VisibilityDrawingInterface
  public SetVisibility(v: VisibilityType): void { this.visibilityDrawingInterface.SetVisibility(v); }
  public IsHidden(): boolean { return this.visibilityDrawingInterface.IsHidden(); }

  //---------------------------//
  // Attribute facades          //
  //---------------------------//

  public ResetCoordY1(): void { this.attCoordY1!.ResetCoordY1(); }
  public SetCoordY1(v: number): void { this.attCoordY1!.SetCoordY1(v); }
  public GetCoordY1(): number { return this.attCoordY1!.GetCoordY1(); }
  public HasCoordY1(): boolean { return this.attCoordY1!.HasCoordY1(); }

  public ResetNInteger(): void { this.attNInteger!.ResetNInteger(); }
  public SetN(v: number): void { this.attNInteger!.SetN(v); }
  public GetN(): number { return this.attNInteger!.GetN(); }
  public HasN(): boolean { return this.attNInteger!.HasN(); }

  public ResetTyped(): void { this.attTyped!.ResetTyped(); }
  public SetType(v: string): void { this.attTyped!.SetType(v); }
  public GetType(): string | null { return this.attTyped!.GetType(); }
  public HasType(): boolean { return this.attTyped!.HasType(); }

  public ResetVisibility(): void { this.ensureComponents(); this.attVisibility!.ResetVisibility(); }
  public SetVisible(v: any): void { this.ensureComponents(); this.attVisibility!.SetVisible(v); }
  public GetVisible(): any { this.ensureComponents(); return this.attVisibility!.GetVisible(); }
  public HasVisible(): boolean { this.ensureComponents(); return this.attVisibility!.HasVisible(); }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitStaff', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitStaffEnd', this); }

  public override Clone(): VrvObject {
    const clone = new Staff();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attNInteger!.HasN()) clone.attNInteger!.SetN(this.attNInteger!.GetN());
    if (this.attTyped!.HasType()) clone.attTyped!.SetType(this.attTyped!.GetType()!);
    if (this.attVisibility!.HasVisible()) clone.attVisibility!.SetVisible(this.attVisibility!.GetVisible());
    clone.m_isOssia = this.m_isOssia;
    return clone;
  }
}

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_COORDY1 = 113;
const ATT_NINTEGER = 167;
const ATT_TYPED = 224;
const ATT_VISIBILITY = 228;

/** C++ FunctorInterface default forwarding helper (VisitStaff -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('staff', ClassId.STAFF, () => new Staff());
ObjectFactory.GetInstance().Register('oStaff', ClassId.FACTORY_OSTAFF, () => new Staff(1, true));
