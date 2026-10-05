/**
 * Pure TypeScript translation of Verovio's `Ossia`
 * (`src-cpp/src/ossia.cpp` + `src-cpp/include/vrv/ossia.h`).
 *
 * C++ has `Ossia` inherit `Object` + `AttTyped` and own a value-member
 * `StaffGrp m_drawingStaffGrp` plus a value-member `BarLine
 * m_drawingLeftBarLine`. TypeScript models the attribute base through
 * composition and the two value members as narrow structural components
 * (`StaffGrp`/`StaffDef`/`Staff` are not yet migrated). The bar line keeps
 * the canonical `BARRENDITION_single` form default from the C++ constructor.
 */
import { ClassId, FunctorCode, VRV_UNSET } from './vrvdef.js';
import { InstTyped } from './atts_shared.js';
import { ObjectFactory, VrvObject } from './object.js';
import { ClassIdComparison } from './comparison.js';

const BOOLEAN_NONE = 0;
const BOOLEAN_true = 1;
const BOOLEAN_false = 2;

/** `MapOfOssiaStaffNs` (vrvdef.h): staff @n -> ordered ossia staff @n list. */
export type MapOfOssiaStaffNs = Map<number, number[]>;

/** Structural contract for the not-yet-migrated `StaffGrp` value member. */
export interface OssiaStaffGrpLike {
  AddChild(child: VrvObject): boolean;
  GetChildCount(): number;
  GetFirst(): VrvObject | null;
  GetLast(): VrvObject | null;
  Reset(): void;
}

/** Structural contract for the not-yet-migrated `StaffDef`. */
export interface OssiaStaffDefLike {
  GetN(): number;
}

/** Structural contract for the not-yet-migrated `Staff`. */
export interface OssiaStaffLike {
  GetN(): number;
  IsOssia(): boolean;
  IsHidden(): boolean;
  GetNFromOssia(): number;
}

/** Structural contract for the drawing left `BarLine` value member. */
export interface OssiaBarLineLike {
  SetForm(form: number): void;
  SetParent(parent: VrvObject): void;
  ResetParent(): void;
  ResetAlignment(): void;
}

/** Canonical `BARRENDITION_single` ordinal (libmei atttypes.h). */
const BARRENDITION_single = 3;

/**
 * Local structural staff-group component used until the canonical `StaffGrp`
 * migration replaces it. Provides the container surface the C++ value member
 * exposes to `Ossia`.
 */
class DrawingStaffGrp implements OssiaStaffGrpLike {
  private readonly children: VrvObject[] = [];
  private m_parent: VrvObject | null = null;

  public GetClassId(): ClassId { return ClassId.STAFFGRP; }
  public AddChild(child: VrvObject): boolean {
    this.children.push(child);
    return true;
  }
  public GetChildCount(): number { return this.children.length; }
  public GetFirst(): VrvObject | null { return this.children[0] ?? null; }
  public GetLast(): VrvObject | null { return this.children[this.children.length - 1] ?? null; }
  public Reset(): void { this.children.length = 0; }
  public SetParent(parent: VrvObject): void { this.m_parent = parent; }
  public GetParent(): VrvObject | null { return this.m_parent; }
}

/** Local structural bar line component for the drawing left bar line. */
class DrawingLeftBarLine implements OssiaBarLineLike {
  private m_form = 0;
  private m_parent: VrvObject | null = null;
  private m_alignment: unknown = null;

  public SetForm(form: number): void { this.m_form = form; }
  public GetForm(): number { return this.m_form; }
  public SetParent(parent: VrvObject): void { this.m_parent = parent; }
  public ResetParent(): void { this.m_parent = null; }
  public SetAlignment(alignment: unknown): void { this.m_alignment = alignment; }
  public ResetAlignment(): void { this.m_alignment = null; }
}

/** Pure TypeScript translation of Verovio's `Ossia`. */
export class Ossia extends VrvObject {
  private attTyped: InstTyped | null = null;
  /** Value member as in C++ (`StaffGrp m_drawingStaffGrp`). */
  private m_drawingStaffGrp!: DrawingStaffGrp;
  /** Value member as in C++ (`BarLine m_drawingLeftBarLine`). */
  private m_drawingLeftBarLine!: DrawingLeftBarLine;
  private m_isFirst = true;
  private m_isLast = true;
  private m_clefAlignment: { GetXRel(): number } | null = null;
  private m_keySigAlignment: { GetXRel(): number } | null = null;

  public constructor() {
    super(ClassId.OSSIA);
    this.ensureValueMembers();
    this.ensureAttributes();
    this.RegisterAttClass(ATT_TYPED);

    this.m_drawingLeftBarLine.SetForm(BARRENDITION_single);
    this.m_drawingStaffGrp.SetParent(this as unknown as VrvObject);

    this.Reset();
  }

  /**
   * The TS `VrvObject` constructor runs the virtual `Reset()` before field
   * initializers; the C++ value members are therefore created lazily here so
   * the constructor-phase reset sees initialized state.
   */
  private ensureValueMembers(): void {
    this.m_drawingStaffGrp ??= new DrawingStaffGrp();
    this.m_drawingLeftBarLine ??= new DrawingLeftBarLine();
  }

  public override Reset(): void {
    super.Reset();
    this.attTyped?.ResetTyped();

    this.ResetDrawingStaffGrp();
    this.ResetAlignments();
  }

  public override CloneReset(): void {
    super.CloneReset();

    this.ResetDrawingStaffGrp();
    this.ResetAlignments();
  }

  public GetClassName(): string { return 'ossia'; }

  private ensureAttributes(): void {
    this.attTyped ??= new InstTyped();
  }

  //----------------//
  // Drawing staff  //
  //----------------//

  public ResetDrawingStaffGrp(): void {
    this.ensureValueMembers();
    this.m_drawingStaffGrp.Reset();
    this.m_isFirst = true;
    this.m_isLast = true;
  }

  public AddDrawingStaffDef(drawingStaffDef: VrvObject): void {
    if (!drawingStaffDef) throw new Error('Ossia::AddDrawingStaffDef: staffDef required.');
    this.ensureValueMembers();
    this.m_drawingStaffGrp.AddChild(drawingStaffDef);
  }

  public GetDrawingStaffGrp(): OssiaStaffGrpLike {
    this.ensureValueMembers();
    return this.m_drawingStaffGrp;
  }

  public IsFirst(): boolean { return this.m_isFirst; }
  public SetFirst(isFirst: boolean): void { this.m_isFirst = isFirst; }
  public IsLast(): boolean { return this.m_isLast; }
  public SetLast(isLast: boolean): void { this.m_isLast = isLast; }

  //--------------------------//
  // Type-based show methods  //
  //--------------------------//

  public HasShowScoreDef(): boolean {
    return this.HasType() && /\bshow\.scoredef\.(true|false)\b/.test(this.GetType()!);
  }

  public GetShowScoreDef(): number {
    if (this.HasType() && /\bshow\.scoredef\.true\b/.test(this.GetType()!)) return BOOLEAN_true;
    if (this.HasType() && /\bshow\.scoredef\.false\b/.test(this.GetType()!)) return BOOLEAN_false;
    return BOOLEAN_NONE;
  }

  public HasShowBarLines(): boolean {
    return this.HasType() && /\bshow\.barlines\.(true|false)\b/.test(this.GetType()!);
  }

  public GetShowBarLines(): number {
    if (this.HasType() && /\bshow\.barlines\.true\b/.test(this.GetType()!)) return BOOLEAN_true;
    if (this.HasType() && /\bshow\.barlines\.false\b/.test(this.GetType()!)) return BOOLEAN_false;
    return BOOLEAN_NONE;
  }

  /** True when the ossia has more than one oStaff. */
  public HasMultipleOStaves(): boolean {
    let count = 0;
    const staves = this.FindAllDescendantsByType(ClassId.STAFF);
    for (const object of staves) {
      const staff = object as unknown as OssiaStaffLike;
      if (staff.IsOssia() && !staff.IsHidden()) count++;
      if (count > 1) return true;
    }
    return false;
  }

  /** Show scoreDef at drawing depending on the staves and attribute values. */
  public DrawScoreDef(): boolean {
    if (!this.HasShowScoreDef()) return this.HasMultipleOStaves();
    return this.GetShowScoreDef() === BOOLEAN_true;
  }

  //---------//
  // Children //
  //---------//

  public override IsSupportedChild(classId: ClassId): boolean {
    // Include pseudo classId for check from the object factory
    const supported: ClassId[] = [ClassId.STAFF, ClassId.FACTORY_OSTAFF];
    if (supported.includes(classId)) return true;
    if (VrvObject.IsEditorialElement(classId)) return true;
    return false;
  }

  /**
   * Retrieve the original staff corresponding to the ossia staff.
   */
  public GetOriginalStaffForOssia(ossia: OssiaStaffLike): OssiaStaffLike | null {
    const n = ossia.GetNFromOssia();
    // AttNIntegerComparison(STAFF, n): first STAFF descendant with @n == n.
    const staff = this.FindAllDescendantsByType(ClassId.STAFF).find(
      (object) => (object as unknown as OssiaStaffLike).GetN() === n
    );
    if (!staff) {
      // LogDebug("Original staff %d for ossia could not be found", ...)
      console.debug?.(`Original staff ${n} for ossia could not be found`);
    }
    return (staff as unknown as OssiaStaffLike) ?? null;
  }

  //------------//
  // Alignments //
  //------------//

  public SetClefAlignment(clefAlignment: { GetXRel(): number }): void { this.m_clefAlignment = clefAlignment; }
  public SetKeySigAlignment(keySigAlignment: { GetXRel(): number }): void { this.m_keySigAlignment = keySigAlignment; }

  public ResetAlignments(): void {
    this.ensureValueMembers();
    this.m_clefAlignment = null;
    this.m_keySigAlignment = null;
    this.m_drawingLeftBarLine.ResetParent();
    this.m_drawingLeftBarLine.ResetAlignment();
  }

  /** Ossia scoreDef shift using the clef and keySig alignments. */
  public GetScoreDefShift(): number {
    // The clef is the further appart
    if (this.m_clefAlignment) return this.m_clefAlignment.GetXRel();
    // Otherwise the key signature
    if (this.m_keySigAlignment) return this.m_keySigAlignment.GetXRel();
    return 0;
  }

  //---------------//
  // Staves above  //
  //---------------//

  public GetStavesAbove(map: MapOfOssiaStaffNs): void {
    const staves = this.FindAllDescendantsByType(ClassId.STAFF);
    this.GetStaves(map, [...staves].reverse());
  }

  public GetStavesBelow(map: MapOfOssiaStaffNs): void {
    const staves = this.FindAllDescendantsByType(ClassId.STAFF);
    this.GetStaves(map, staves);
  }

  /** Top/bottom oStaff (null when none or hidden). */
  public GetDrawingTopOStaff(): OssiaStaffLike | null {
    this.ensureValueMembers();
    if (this.m_drawingStaffGrp.GetChildCount() === 0) return null;
    // We have only staffDef as children
    const staffDef = this.m_drawingStaffGrp.GetFirst() as unknown as OssiaStaffDefLike;
    const n = staffDef.GetN();
    const staff = this.FindAllDescendantsByType(ClassId.STAFF).find(
      (object) => (object as unknown as OssiaStaffLike).GetN() === n
    );
    const found = (staff as unknown as OssiaStaffLike) ?? null;
    return found && !found.IsHidden() ? found : null;
  }

  public GetDrawingBottopOStaff(): OssiaStaffLike | null {
    this.ensureValueMembers();
    if (this.m_drawingStaffGrp.GetChildCount() === 0) return null;
    // We have only staffDef as children
    const staffDef = this.m_drawingStaffGrp.GetLast() as unknown as OssiaStaffDefLike;
    const n = staffDef.GetN();
    const staff = this.FindAllDescendantsByType(ClassId.STAFF).find(
      (object) => (object as unknown as OssiaStaffLike).GetN() === n
    );
    const found = (staff as unknown as OssiaStaffLike) ?? null;
    return found && !found.IsHidden() ? found : null;
  }

  /** Staff `@n` of oStaves in document order. */
  public GetOStaffNs(): number[] {
    const staves = this.FindAllDescendantsByType(ClassId.STAFF);
    const ns: number[] = [];
    for (const object of staves) {
      const staff = object as unknown as OssiaStaffLike;
      if (staff.IsOssia() && !staff.IsHidden()) ns.push(staff.GetN());
    }
    return ns;
  }

  /** Internal: fill the map with ossia staves for the given order. */
  private GetStaves(map: MapOfOssiaStaffNs, staves: VrvObject[]): void {
    let staffN: number = VRV_UNSET;
    for (const object of staves) {
      const staff = object as unknown as OssiaStaffLike;
      if (!staff.IsOssia()) {
        staffN = staff.GetN();
        continue;
      }
      if (staff.IsHidden()) continue;
      if (staffN !== VRV_UNSET) {
        const ossias = map.get(staffN) ?? [];
        const ossiaN = staff.GetN();
        // add only if not already present
        if (!ossias.includes(ossiaN)) ossias.push(ossiaN);
        map.set(staffN, ossias);
      }
    }
  }

  /** Drawing left bar line (value member). */
  public GetDrawingLeftBarLine(): OssiaBarLineLike {
    this.ensureValueMembers();
    return this.m_drawingLeftBarLine;
  }

  //-----------//
  // AttTyped  //
  //-----------//
  public ResetTyped(): void { this.attTyped!.ResetTyped(); }
  public SetType(v: string): void { this.attTyped!.SetType(v); }
  public GetType(): string | null { return this.attTyped!.GetType(); }
  public HasType(): boolean { return this.attTyped!.HasType(); }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitOssia', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitOssiaEnd', this); }

  public override Clone(): VrvObject {
    const clone = new Ossia();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attTyped!.HasType()) clone.attTyped!.SetType(this.attTyped!.GetType()!);
    return clone;
  }
}

// Canonical libmei AttClassId ordinal (attmodule.ts ATT_CLASS_IDS).
const ATT_TYPED = 224;

/** C++ FunctorInterface default forwarding helper (VisitOssia -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('ossia', ClassId.OSSIA, () => new Ossia());
