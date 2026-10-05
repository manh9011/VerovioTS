/**
 * Pure TypeScript translation of Verovio's `src/stem.cpp` / `include/vrv/stem.h`.
 *
 * `Stem` models a stem as a layer element part and as the MEI `<stem>` element.
 *
 * C++ multiple inheritance (LayerElement + AttGraced + AttStemVis +
 * AttVisibility) is represented through explicit composition with forwarding
 * surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, VrvObject } from './object.js';
import { InstGraced } from './atts_cmn.js';
import { InstStemVis } from './atts_visual.js';
import { data_MEASUREMENTSIGNED } from './libmei-att.js';
import { InstVisibility } from './atts_shared.js';
import { STEMDIRECTION_NONE, STEMDIRECTION_up, STEMDIRECTION_down } from './drawinginterface.js';
import { SMUFL_E220_tremolo1 } from './smufl.js';

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_GRACED = 22;
const ATT_STEMVIS = 285;
const ATT_VISIBILITY = 228;

// data_STEMMODIFIER ordinals (libmei/dist/atttypes.h).
export const STEMMODIFIER_NONE = 0;
export const STEMMODIFIER_none = 1;
export const STEMMODIFIER_1slash = 2;
export const STEMMODIFIER_2slash = 3;
export const STEMMODIFIER_3slash = 4;
export const STEMMODIFIER_4slash = 5;
export const STEMMODIFIER_5slash = 6;
export const STEMMODIFIER_6slash = 7;
export const STEMMODIFIER_sprech = 8;
export const STEMMODIFIER_z = 9;
export const STEMMODIFIER_MAX = 10;

// Structural contracts for not-yet-migrated collaborators (no invented behavior).
export interface StemDocContract {
  GetDrawingUnit(staffSize?: number): number;
  GetDrawingStemWidth(staffSize: number): number;
  GetGlyphWidth(code: number, staffSize: number, graceSize: boolean): number;
  GetGlyphHeight(code: number, staffSize: number, graceSize: boolean): number;
  GetDrawingStaffSize(staffSize: number): number;
}

export interface StemStaffContract {
  m_drawingStaffSize: number;
  GetDrawingY(): number;
}

export interface StemFlagContract {
  m_drawingNbFlags: number;
  GetFlagGlyph(stemDir: number): number;
}

export interface StemNoteContract {
  IsGraceNote(): boolean;
  GetDrawingCueSize(): boolean;
  GetDrawingLoc(): number;
  GetDrawingY(): number;
}

export interface StemChordContract {
  GetTopNote(): StemNoteContract;
  GetBottomNote(): StemNoteContract;
}

export interface StemBTremContract {
  GetDrawingStemMod(): number;
}

/** `AttStems` source surface consumed by `FillAttributes`. */
export interface AttStemsSource {
  HasStemDir(): boolean; GetStemDir(): number;
  HasStemLen(): boolean; GetStemLen(): number;
  HasStemPos(): boolean; GetStemPos(): number;
  HasStemMod(): boolean; GetStemMod(): number;
  HasStemVisible(): boolean; GetStemVisible(): any;
}

/** Pure TypeScript translation of Verovio's `Stem`. */
export class Stem extends LayerElement {
  /**
   * The drawing direction of the stem.
   */
  private m_drawingStemDir = STEMDIRECTION_NONE;
  /**
   * The drawing length of stem.
   */
  private m_drawingStemLen = 0;
  /**
   * The drawing modifier of the stem.
   */
  private m_drawingStemMod = STEMMODIFIER_NONE;
  /**
   * Relative Y position for the stem modifier.
   */
  private m_stemModRelY = 0;
  /**
   * The adjustment of the drawing stem length (used with french style of beams).
   */
  private m_drawingStemAdjust = 0;
  /**
   * A flag indicating if a stem is virtual and should never be rendered.
   */
  private m_isVirtual = false;

  private graced?: InstGraced;
  private stemVis?: InstStemVis;
  private visibility?: InstVisibility;

  public constructor() {
    super(ClassId.STEM);
    this.ensureAttributes();
    this.RegisterAttClass(ATT_GRACED);
    this.RegisterAttClass(ATT_STEMVIS);
    this.RegisterAttClass(ATT_VISIBILITY);
    this.Reset();
  }

  private ensureAttributes(): void {
    this.graced ??= new InstGraced();
    this.stemVis ??= new InstStemVis();
    this.visibility ??= new InstVisibility();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.graced!.ResetGraced();
    this.stemVis!.ResetStemVis();
    this.visibility!.ResetVisibility();

    this.m_drawingStemDir = STEMDIRECTION_NONE;
    this.m_drawingStemLen = 0;
    this.m_drawingStemMod = STEMMODIFIER_NONE;
    this.m_drawingStemAdjust = 0;
    this.m_isVirtual = false;
    this.m_stemModRelY = 0;
  }

  public override Clone(): VrvObject {
    const clone = new Stem();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all attribute + drawing state (composition
    // adaptation: AssignFrom covers only the object-tree state).
    if (this.HasGrace()) clone.SetGrace(this.GetGrace());
    if (this.HasGraceTime()) clone.SetGraceTime(this.GetGraceTime());
    if (this.HasDir()) clone.SetDir(this.GetDir());
    if (this.HasLen()) clone.SetLen(this.GetLen());
    if (this.HasPos()) clone.SetPos(this.GetPos());
    if (this.HasForm()) clone.SetForm(this.GetForm());
    if (this.HasFlagPos()) clone.SetFlagPos(this.GetFlagPos());
    if (this.HasFlagForm()) clone.SetFlagForm(this.GetFlagForm());
    if (this.HasVisible()) clone.SetVisible(this.GetVisible());
    (clone as unknown as { m_drawingStemDir: number }).m_drawingStemDir = this.m_drawingStemDir;
    (clone as unknown as { m_drawingStemLen: number }).m_drawingStemLen = this.m_drawingStemLen;
    (clone as unknown as { m_drawingStemMod: number }).m_drawingStemMod = this.m_drawingStemMod;
    (clone as unknown as { m_drawingStemAdjust: number }).m_drawingStemAdjust = this.m_drawingStemAdjust;
    (clone as unknown as { m_stemModRelY: number }).m_stemModRelY = this.m_stemModRelY;
    (clone as unknown as { m_isVirtual: boolean }).m_isVirtual = this.m_isVirtual;
    return clone;
  }

  public override GetClassName(): string { return 'stem'; }

  /** Override the method since alignment is required. */
  public override HasToBeAligned(): boolean { return true; }

  /**
   * Add an element (only flag supported) to a stem.
   * C++ `IsSupportedChild`: FLAG only.
   */
  public override IsSupportedChild(classId: ClassId): boolean {
    return classId === ClassId.FLAG;
  }

  /**
   * Fill the attributes from the AttStems attribute of the parent note/chord.
   */
  public FillAttributes(attSource: AttStemsSource): void {
    if (attSource.HasStemDir()) {
      this.SetDir(attSource.GetStemDir());
    }
    if (attSource.HasStemLen()) {
      const stemLen = new data_MEASUREMENTSIGNED();
      stemLen.SetVu(attSource.GetStemLen());
      this.SetLen(stemLen);
    }
    if (attSource.HasStemPos()) {
      this.SetPos(attSource.GetStemPos());
    }
    if (attSource.HasStemMod()) {
      this.SetDrawingStemMod(attSource.GetStemMod());
    }
    if (attSource.HasStemVisible()) {
      this.SetVisible(attSource.GetStemVisible());
    }
  }

  //---------//
  // Drawing stem direction / length / modifier state
  //---------//

  public GetDrawingStemDir(): number { return this.m_drawingStemDir; }
  public SetDrawingStemDir(drawingStemDir: number): void { this.m_drawingStemDir = drawingStemDir; }
  public GetDrawingStemLen(): number { return this.m_drawingStemLen; }
  public SetDrawingStemLen(drawingStemLen: number): void { this.m_drawingStemLen = Math.trunc(drawingStemLen); }
  /** Since Stem does not inherit from AttStems we override LayerElement::GetDrawingStemMod(). */
  public override GetDrawingStemMod(): number { return this.m_drawingStemMod; }
  public HasDrawingStemMod(): boolean { return (this.m_drawingStemMod !== STEMMODIFIER_NONE); }
  public SetDrawingStemMod(mod: number): void { this.m_drawingStemMod = mod; }
  public GetDrawingStemAdjust(): number { return this.m_drawingStemAdjust; }
  public SetDrawingStemAdjust(drawingStemAdjust: number): void { this.m_drawingStemAdjust = drawingStemAdjust; }
  public GetStemModRelY(): number { return this.m_stemModRelY; }

  /** Setter and getter of the virtual flag. */
  // C++ Stem has both `bool IsVirtual() const` and `void IsVirtual(bool)`
  // overloads (stem.h); calcstemfunctor.cpp:506 calls the setter form, so a
  // single optional-arg method covers both (a 0-arg getter alone would silently
  // drop the setter call at runtime).
  public IsVirtual(value?: boolean): boolean {
    if (value !== undefined) this.m_isVirtual = value;
    return this.m_isVirtual;
  }
  public SetVirtual(isVirtual: boolean): void { this.m_isVirtual = isVirtual; }

  /**
   * Virtual stems keep reset BB (y1=+2147483647, y2=-2147483647). C++ int32
   * drawingY + BB wraps (wasm i32.add); TS doubles don't. `| 0` replicates
   * the wrap exactly. ponytail: if C++ ever initializes virtual BBs, drop override.
   */
  public override GetSelfTop(): number {
    if (this.IsVirtual()) return super.GetSelfTop() | 0;
    return super.GetSelfTop();
  }
  public override GetSelfBottom(): number {
    if (this.IsVirtual()) return super.GetSelfBottom() | 0;
    return super.GetSelfBottom();
  }

  /**
   * Helper to adjust overlapping layers for stems.
   */
  public CompareToElementPosition(doc: StemDocContract, otherElement: LayerElement, margin: number): number {
    const staff = this.GetAncestorStaff() as unknown as StemStaffContract;
    if (!staff) throw new Error('Stem::CompareToElementPosition: staff ancestor required.');

    // check if there is an overlap on the left or on the right and displace stem's parent correspondingly
    const right = (this as unknown as {
      HorizontalLeftOverlap?(o: LayerElement, d: StemDocContract, x: number, v: number): number;
    }).HorizontalLeftOverlap?.(otherElement, doc, margin, 0) ?? 0;
    const left = (this as unknown as {
      HorizontalRightOverlap?(o: LayerElement, d: StemDocContract, x: number, v: number): number;
    }).HorizontalRightOverlap?.(otherElement, doc, margin, 0) ?? 0;
    if (!right || !left) return 0;

    let horizontalMargin = 2 * doc.GetDrawingStemWidth(staff.m_drawingStaffSize);
    const currentFlag = this.FindDescendantByType(ClassId.FLAG, 1) as unknown as StemFlagContract | null;
    if (currentFlag && currentFlag.m_drawingNbFlags) {
      const flagGlyph = currentFlag.GetFlagGlyph(STEMDIRECTION_down);
      const flagWidth = doc.GetGlyphWidth(flagGlyph, staff.m_drawingStaffSize, this.GetDrawingCueSize());
      horizontalMargin += flagWidth;
    }

    if (right < left) {
      return right + horizontalMargin;
    }
    else {
      return (-horizontalMargin - left);
    }
  }

  /**
   * Helper to calculate stem modifier relative Y rel and required adjustment for stem length.
   */
  public CalculateStemModAdjustment(
    doc: StemDocContract,
    staff: StemStaffContract,
    flagOffset = 0,
  ): number {
    this.CalculateStemModRelY(doc, staff);
    return this.AdjustSlashes(doc, staff, flagOffset);
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitStem');
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitStem');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitStemEnd');
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitStemEnd');
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

  //--------------------//
  // Private helpers
  //--------------------//

  /**
   * Helper to adjust length of stem based on presence of slashes.
   */
  private AdjustSlashes(doc: StemDocContract, staff: StemStaffContract, flagOffset: number): number {
    // if stem length is explicitly set - exit
    if (this.HasLen()) return 0;

    const staffSize = staff.m_drawingStaffSize;
    const unit = doc.GetDrawingUnit(staffSize);
    let stemMod: number = STEMMODIFIER_NONE;
    const bTrem = this.GetFirstAncestor(ClassId.BTREM) as unknown as StemBTremContract | null;
    if (bTrem) {
      stemMod = bTrem.GetDrawingStemMod();
    }
    else if (this.HasDrawingStemMod() && (this.GetDrawingStemMod() < STEMMODIFIER_MAX)) {
      stemMod = this.GetDrawingStemMod();
    }
    if ((stemMod === STEMMODIFIER_NONE) || (stemMod === STEMMODIFIER_none)) return 0;

    const code = this.StemModToGlyph(stemMod);
    // if there is no glyph - do nothing
    if (!code) return 0;

    let lenAdjust = flagOffset;
    const parent = this.GetParent() as VrvObject | null;
    if (parent && parent.Is(ClassId.CHORD)) {
      const chord = parent as unknown as StemChordContract;
      lenAdjust += Math.abs(chord.GetTopNote().GetDrawingY() - chord.GetBottomNote().GetDrawingY());
    }

    const glyphHeight = doc.GetGlyphHeight(code, staffSize, false);
    const actualLength = Math.abs(this.GetDrawingStemLen()) - Math.trunc(lenAdjust / unit) * unit;
    let diff = 0;
    if ((stemMod === STEMMODIFIER_sprech) && (this.GetDrawingStemDir() === STEMDIRECTION_down)) {
      diff = Math.abs(actualLength - Math.abs(this.m_stemModRelY));
    }
    else {
      diff = actualLength - Math.abs(this.m_stemModRelY) - 0.5 * glyphHeight;
    }
    const halfUnit = 0.5 * unit;

    let adjust = 0;
    if ((diff < halfUnit) && (diff >= -halfUnit)) {
      adjust = halfUnit;
    }
    else if (diff < -halfUnit) {
      adjust = (Math.trunc(Math.abs(diff) / halfUnit) + 1) * halfUnit;
      if (stemMod === STEMMODIFIER_6slash) {
        adjust += Math.trunc(doc.GetGlyphHeight(SMUFL_E220_tremolo1, staffSize, false) / 4);
      }
    }
    return ((this.GetDrawingStemDir() === STEMDIRECTION_up) ? -adjust : adjust);
  }

  /**
   * Helper to calculate relative position for the stem modifier.
   */
  private CalculateStemModRelY(doc: StemDocContract, staff: StemStaffContract): void {
    const sign = (this.GetDrawingStemDir() === STEMDIRECTION_up) ? 1 : -1;
    const parent = this.GetParent() as VrvObject | null;
    // Get note
    let note: StemNoteContract | null = null;
    if (parent && parent.Is(ClassId.NOTE)) {
      note = parent as unknown as StemNoteContract;
    }
    else if (parent && parent.Is(ClassId.CHORD)) {
      const chord = parent as unknown as StemChordContract;
      note = (sign > 0) ? chord.GetTopNote() : chord.GetBottomNote();
    }
    if (!note || note.IsGraceNote() || note.GetDrawingCueSize()) return;

    // Get stem mod for the element
    let stemMod: number = STEMMODIFIER_NONE;
    const bTrem = this.GetFirstAncestor(ClassId.BTREM) as unknown as StemBTremContract | null;
    if (bTrem) {
      stemMod = bTrem.GetDrawingStemMod();
    }
    else if (this.HasDrawingStemMod() && (this.GetDrawingStemMod() < STEMMODIFIER_MAX)) {
      stemMod = this.GetDrawingStemMod();
    }
    if ((stemMod === STEMMODIFIER_NONE) || (stemMod === STEMMODIFIER_none)) return;

    // calculate height offset for positioning of stem mod elements on the stem
    const code = this.StemModToGlyph(stemMod);
    if (!code) return;

    const unit = doc.GetDrawingUnit(staff.m_drawingStaffSize);
    const glyphHalfHeight = Math.trunc(doc.GetGlyphHeight(code, staff.m_drawingStaffSize, false) / 2);
    const noteLoc = note.GetDrawingLoc();
    let height = 2 * unit;
    switch (stemMod) {
      case STEMMODIFIER_1slash:
      case STEMMODIFIER_2slash:
      case STEMMODIFIER_3slash:
      case STEMMODIFIER_4slash:
      case STEMMODIFIER_5slash:
      case STEMMODIFIER_6slash: {
        if (noteLoc % 2 === 0) height += unit;
        height += glyphHalfHeight;
        if (stemMod === STEMMODIFIER_6slash) {
          height += Math.trunc(doc.GetGlyphHeight(SMUFL_E220_tremolo1, staff.m_drawingStaffSize, false) / 2);
        }
        break;
      }
      case STEMMODIFIER_sprech:
      case STEMMODIFIER_z: {
        height += unit;
        if (stemMod === STEMMODIFIER_sprech) height -= sign * glyphHalfHeight;
        break;
      }
      default: return;
    }

    // calculate adjust for the stem modifiers that overlap with ledger lines
    const position = note.GetDrawingY() + sign * height;
    const staffSize = staff.m_drawingStaffSize;
    const doubleUnit = 2 * unit;
    const margin = (sign > 0)
      ? staff.GetDrawingY() - doc.GetDrawingStaffSize(staffSize)
      : staff.GetDrawingY();
    const ledgerLineDifference = margin - (position - sign * glyphHalfHeight);
    const adjust = (sign * ledgerLineDifference > 0)
      ? Math.trunc(ledgerLineDifference / doubleUnit) * doubleUnit
      : 0;

    this.m_stemModRelY = sign * height + adjust;
  }

  //---------//
  // Attribute forwarding surfaces
  //---------//

  // AttGraced (grace, grace.time)
  public ResetGraced(): void { this.graced!.ResetGraced(); }
  public SetGrace(value: any): void { this.graced!.SetGrace(value); }
  public GetGrace(): any { return this.graced!.GetGrace(); }
  public HasGrace(): boolean { return this.graced!.HasGrace(); }
  public SetGraceTime(value: any): void { this.graced!.SetGraceTime(value); }
  public GetGraceTime(): any { return this.graced!.GetGraceTime(); }
  public HasGraceTime(): boolean { return this.graced!.HasGraceTime(); }
  /** C++ `AttGraced::operator=` member-wise copy from a Note/Chord source. */
  public CopyGracedFrom(source: { HasGrace(): boolean; GetGrace(): any; HasGraceTime(): boolean; GetGraceTime(): any }): void {
    this.ensureAttributes();
    this.graced!.ResetGraced();
    if (source.HasGrace()) this.graced!.SetGrace(source.GetGrace());
    if (source.HasGraceTime()) this.graced!.SetGraceTime(source.GetGraceTime());
  }

  // AttStemVis (dir, len, pos, form, flag.pos, flag.form)
  public ResetStemVis(): void { this.stemVis!.ResetStemVis(); }
  public SetDir(value: any): void { this.stemVis!.SetDir(value); }
  public GetDir(): any { return this.stemVis!.GetDir(); }
  public HasDir(): boolean { return this.stemVis!.HasDir(); }
  public SetLen(value: any): void { this.stemVis!.SetLen(value); }
  public GetLen(): any { return this.stemVis!.GetLen(); }
  public HasLen(): boolean { return this.stemVis!.HasLen(); }
  public SetPos(value: any): void { this.stemVis!.SetPos(value); }
  public GetPos(): any { return this.stemVis!.GetPos(); }
  public HasPos(): boolean { return this.stemVis!.HasPos(); }
  public SetForm(value: any): void { this.stemVis!.SetForm(value); }
  public GetForm(): any { return this.stemVis!.GetForm(); }
  public HasForm(): boolean { return this.stemVis!.HasForm(); }
  public SetFlagPos(value: any): void { this.stemVis!.SetFlagPos(value); }
  public GetFlagPos(): any { return this.stemVis!.GetFlagPos(); }
  public HasFlagPos(): boolean { return this.stemVis!.HasFlagPos(); }
  public SetFlagForm(value: any): void { this.stemVis!.SetFlagForm(value); }
  public GetFlagForm(): any { return this.stemVis!.GetFlagForm(); }
  public HasFlagForm(): boolean { return this.stemVis!.HasFlagForm(); }

  // AttVisibility (visible)
  public ResetVisibility(): void { this.visibility!.ResetVisibility(); }
  public SetVisible(value: any): void { this.visibility!.SetVisible(value); }
  public GetVisible(): any { return this.visibility!.GetVisible(); }
  public HasVisible(): boolean { return this.visibility!.HasVisible(); }
}

ObjectFactory.GetInstance().Register('stem', ClassId.STEM, () => new Stem());
