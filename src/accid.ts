/**
 * Pure TypeScript translation of Verovio's src/accid.cpp / include/vrv/accid.h.
 *
 * Native libMEI attribute classes and the still-unported LayerElement/Note/Staff/Doc
 * implementations are represented by typed local state/dependency boundaries. The
 * Accid algorithms themselves preserve the C++ control flow and comparison rules.
 */
import { ObjectFactory, VrvObject } from './object.js';
import { LayerElement, StaffSearch, type AlignmentLike } from './layerelement.js';
import { OffsetInterface } from './offsetinterface.js';
import { PositionInterface } from './positioninterface.js';
import { FloatingObject } from './floatingobject.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import type { ResourcesLike } from './boundingbox.js';
import { IsMensuralType, IsNeumeType } from './vrv.js';
import {
  SMUFL_E260_accidentalFlat, SMUFL_E261_accidentalNatural, SMUFL_E262_accidentalSharp,
  SMUFL_E263_accidentalDoubleSharp, SMUFL_E264_accidentalDoubleFlat, SMUFL_E265_accidentalTripleSharp,
  SMUFL_E266_accidentalTripleFlat, SMUFL_E267_accidentalNaturalFlat, SMUFL_E268_accidentalNaturalSharp,
  SMUFL_E269_accidentalSharpSharp, SMUFL_E26A_accidentalParensLeft, SMUFL_E26B_accidentalParensRight,
  SMUFL_E26C_accidentalBracketLeft, SMUFL_E26D_accidentalBracketRight,
  SMUFL_E270_accidentalQuarterToneFlatArrowUp, SMUFL_E271_accidentalThreeQuarterTonesFlatArrowDown,
  SMUFL_E272_accidentalQuarterToneSharpNaturalArrowUp, SMUFL_E273_accidentalQuarterToneFlatNaturalArrowDown,
  SMUFL_E274_accidentalThreeQuarterTonesSharpArrowUp, SMUFL_E275_accidentalQuarterToneSharpArrowDown,
  SMUFL_E280_accidentalQuarterToneFlatStein, SMUFL_E281_accidentalThreeQuarterTonesFlatZimmermann,
  SMUFL_E282_accidentalQuarterToneSharpStein, SMUFL_E283_accidentalThreeQuarterTonesSharpStein,
  SMUFL_E440_accidentalBuyukMucennebFlat, SMUFL_E441_accidentalKucukMucennebFlat,
  SMUFL_E442_accidentalBakiyeFlat, SMUFL_E443_accidentalKomaFlat, SMUFL_E444_accidentalKomaSharp,
  SMUFL_E445_accidentalBakiyeSharp, SMUFL_E446_accidentalKucukMucennebSharp,
  SMUFL_E447_accidentalBuyukMucennebSharp, SMUFL_E460_accidentalKoron, SMUFL_E461_accidentalSori,
  SMUFL_E9E0_medRenFlatSoftB, SMUFL_E9E2_medRenNatural, SMUFL_E9E3_medRenSharpCroix,
} from './smufl.js';

export type data_ACCIDENTAL_WRITTEN = number;
export type data_ENCLOSURE = number;
export type data_NOTATIONTYPE = number;
export type data_HEXNUM = number;

// Canonical data_ACCIDENTAL_WRITTEN ordinals (libmei/dist/atttypes.h):
// NONE=0, s, f, ss, x, ff, xs, sx, ts, tf, n, nf, ns, su, sd, fu, fd, nu, nd,
// xu, xd, ffu, ffd, 1qf, 3qf, 1qs, 3qs, bms, kms, bs, ks, kf, bf, kmf, bmf, koron, sori.
export const ACCIDENTAL_WRITTEN_s = 1;
export const ACCIDENTAL_WRITTEN_f = 2;
export const ACCIDENTAL_WRITTEN_ss = 3;
export const ACCIDENTAL_WRITTEN_x = 4;
export const ACCIDENTAL_WRITTEN_ff = 5;
export const ACCIDENTAL_WRITTEN_xs = 6;
export const ACCIDENTAL_WRITTEN_sx = 7;
export const ACCIDENTAL_WRITTEN_ts = 8;
export const ACCIDENTAL_WRITTEN_tf = 9;
export const ACCIDENTAL_WRITTEN_n = 10;
export const ACCIDENTAL_WRITTEN_nf = 11;
export const ACCIDENTAL_WRITTEN_ns = 12;
export const ACCIDENTAL_WRITTEN_su = 13;
export const ACCIDENTAL_WRITTEN_sd = 14;
export const ACCIDENTAL_WRITTEN_fu = 15;
export const ACCIDENTAL_WRITTEN_fd = 16;
export const ACCIDENTAL_WRITTEN_nu = 17;
export const ACCIDENTAL_WRITTEN_nd = 18;
export const ACCIDENTAL_WRITTEN_xu = 19;
export const ACCIDENTAL_WRITTEN_xd = 20;
export const ACCIDENTAL_WRITTEN_ffu = 21;
export const ACCIDENTAL_WRITTEN_ffd = 22;
export const ACCIDENTAL_WRITTEN_1qf = 23;
export const ACCIDENTAL_WRITTEN_3qf = 24;
export const ACCIDENTAL_WRITTEN_1qs = 25;
export const ACCIDENTAL_WRITTEN_3qs = 26;
export const ACCIDENTAL_WRITTEN_bms = 27;
export const ACCIDENTAL_WRITTEN_kms = 28;
export const ACCIDENTAL_WRITTEN_bs = 29;
export const ACCIDENTAL_WRITTEN_ks = 30;
export const ACCIDENTAL_WRITTEN_kf = 31;
export const ACCIDENTAL_WRITTEN_bf = 32;
export const ACCIDENTAL_WRITTEN_kmf = 33;
export const ACCIDENTAL_WRITTEN_bmf = 34;
export const ACCIDENTAL_WRITTEN_koron = 35;
export const ACCIDENTAL_WRITTEN_sori = 36;
export const ACCIDENTAL_WRITTEN_NONE = 0;
export const ENCLOSURE_NONE = 0;
export const ENCLOSURE_paren = 1;
export const ENCLOSURE_brack = 2;
export const NOTATIONTYPE_NONE = 0;

class AccidentalAttributes {
  private value: data_ACCIDENTAL_WRITTEN = ACCIDENTAL_WRITTEN_NONE;
  ResetAccidental(): void { this.value = ACCIDENTAL_WRITTEN_NONE; }
  SetAccid(value: data_ACCIDENTAL_WRITTEN): void { this.value = value; }
  GetAccid(): data_ACCIDENTAL_WRITTEN { return this.value; }
}
class AccidentalGesAttributes {
  private value = 0;
  ResetAccidentalGes(): void { this.value = 0; }
  SetAccidGes(value: number): void { this.value = value; }
  GetAccidGes(): number { return this.value; }
}
class EmptyAttributeState {
  Reset(): void {}
  [key: string]: unknown;
}

export interface AccidResourcesLike extends ResourcesLike {
  GetGlyph(code: number): any;
  GetGlyphCode(name: string): number;
}
export interface AccidDocLike {
  GetDrawingUnit(staffSize: number): number;
  GetRightMargin(classId: number): number;
  GetBottomMargin?(classId: number): number;
  GetOptions(): { m_ledgerLineExtension: { GetValue(): number } };
  GetDrawingStaffSize(staffSize: number): number;
  GetResources(): AccidResourcesLike;
}
export interface AccidElementLike extends VrvObject {
  GetAncestorStaff(resolveCrossStaff?: number): AccidStaffLike | null;
  Is(classId: ClassId): boolean;
  GetDrawingY(): number;
  GetSelfLeft(): number;
  GetSelfRight(): number;
  HasLedgerLines?(above: { value: number }, below: { value: number }, staff: AccidStaffLike | null): boolean;
}
export interface AccidStaffLike extends VrvObject {
  GetDrawingY(): number;
  GetN(): number;
  GetAlignment(): AlignmentLike | null;
}
export interface AccidNoteLike extends AccidElementLike {
  HasLedgerLines(above: { value: number }, below: { value: number }, staff: AccidStaffLike | null): boolean;
}
export interface AccidChordLike extends VrvObject {
  HasAdjacentNotesInStaff(staff: AccidStaffLike | null): boolean;
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  // C++ FunctorInterface default: VisitAccid -> VisitLayerElement -> ... -> VisitObject.
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

export class AccidFloatingObject extends FloatingObject {
  public constructor() { super(ClassId.ACCID_FLOATING); this.Reset(); }
  public override Reset(): void { super.Reset(); }
  public override GetClassName(): string { return 'accid'; }
}

export class Accid extends LayerElement {
  private offsetInterface!: OffsetInterface;
  private positionInterface!: PositionInterface;
  private accidental!: AccidentalAttributes;
  private accidentalGes!: AccidentalGesAttributes;
  private accidLog!: EmptyAttributeState;
  private color!: EmptyAttributeState;
  private enclosingChars!: EmptyAttributeState;
  private extSymAuth!: EmptyAttributeState;
  private extSymNames!: EmptyAttributeState;
  private placementOnStaff!: EmptyAttributeState;
  private placementRelEvent!: EmptyAttributeState;
  private m_drawingUnison: Accid | null = null;
  private m_alignedWithSameLayer = false;
  private m_floatingObject: AccidFloatingObject | null = null;

  public constructor() {
    super(ClassId.ACCID);
    this.offsetInterface = new OffsetInterface(); this.positionInterface = new PositionInterface();
    this.accidental = new AccidentalAttributes(); this.accidentalGes = new AccidentalGesAttributes();
    this.accidLog = new EmptyAttributeState(); this.color = new EmptyAttributeState(); this.enclosingChars = new EmptyAttributeState();
    this.extSymAuth = new EmptyAttributeState(); this.extSymNames = new EmptyAttributeState();
    this.placementOnStaff = new EmptyAttributeState(); this.placementRelEvent = new EmptyAttributeState();
    this.RegisterInterface(this.offsetInterface.GetAttClasses(), this.offsetInterface.IsInterface());
    this.RegisterInterface([205, 206], this.positionInterface.IsInterface());
    this.RegisterAttClass(ATT_ACCIDENTAL);
    this.RegisterAttClass(ATT_ACCIDENTALGES);
    this.RegisterAttClass(ATT_ACCIDLOG);
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_ENCLOSINGCHARS);
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.RegisterAttClass(ATT_PLACEMENTONSTAFF);
    this.RegisterAttClass(ATT_PLACEMENTRELEVENT);
    this.Reset();
  }
  public override Reset(): void {
    super.Reset();
    this.offsetInterface?.Reset(); this.positionInterface?.Reset();
    this.accidental?.ResetAccidental(); this.accidentalGes?.ResetAccidentalGes();
    this.accidLog?.Reset(); this.color?.Reset(); this.enclosingChars?.Reset(); this.extSymAuth?.Reset();
    this.extSymNames?.Reset(); this.placementOnStaff?.Reset(); this.placementRelEvent?.Reset();
    this.m_drawingUnison = null; this.m_alignedWithSameLayer = false;
    if (this.m_floatingObject) this.ClearFloatingObject();
  }
  public override Clone(): VrvObject {
    const clone = new Accid();
    clone.AssignFrom(this);
    clone.SetAccid(this.GetAccid()); clone.SetAccidGes(this.GetAccidGes());
    clone.SetDrawingXRel(this.GetDrawingXRel()); clone.SetDrawingYRel(this.GetDrawingYRel());
    clone.m_alignedWithSameLayer = this.m_alignedWithSameLayer;
    clone.m_drawingUnison = this.m_drawingUnison;
    clone.SetFunc(this.GetFunc());
    return clone;
  }
  public override GetClassName(): string { return 'accid'; }
  public SetIsAttribute(value: boolean): void { (this as any).m_isAttribute = value; }
  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.ACCID) return !!this.GetParent() && this.GetParent()!.Is(ClassId.NOTE);
    return false;
  }
  public ClearFloatingObject(): void { this.m_floatingObject = null; }
  public InitFloatingObject(): void { invariant(!this.m_floatingObject, 'Accid floating object already exists'); this.m_floatingObject = new AccidFloatingObject(); this.m_floatingObject.SetParent(this); }
  public GetFloatingObject(): AccidFloatingObject | null { return this.m_floatingObject; }
  public InitShowAccidGes(): void {
    const parent = this.GetParent();
    if (!parent || !parent.Is(ClassId.NOTE)) return;
    this.ClearChildren();
    const accid = new Accid(); accid.SetIsAttribute(true); accid.SetAccid(this.GetAccidGes());
    if (!this.AddChild(accid)) { /* C++ deletes the unattached object; JS GC handles this. */ }
  }
  public GetSymbolStr(notationType: data_NOTATIONTYPE): string { return Accid.CreateSymbolStr(this.GetAccid(), this.GetEnclose(), notationType, this.GetDocResources() as unknown as AccidResourcesLike, this.GetGlyphNum(), this.GetGlyphName()); }
  // C++ Accid has no GetAncestorStaff override: LayerElement::GetAncestorStaff
  // resolves cross-staff so child accids register overflow on the note's staff.
  public override GetAncestorStaff(strategy?: StaffSearch, assertExistence?: boolean): AccidStaffLike | null {
    return super.GetAncestorStaff(strategy, assertExistence) as unknown as AccidStaffLike | null;
  }
  public AdjustToLedgerLines(doc: AccidDocLike, element: AccidElementLike, staffSize: number): void {
    const staff = element.GetAncestorStaff(1); const chord = this.GetFirstAncestor(ClassId.CHORD) as unknown as AccidChordLike | null;
    const unit = doc.GetDrawingUnit(staffSize); const rightMargin = doc.GetRightMargin(ClassId.ACCID) * unit;
    if (element.Is(ClassId.NOTE) && chord && chord.HasAdjacentNotesInStaff(staff)) {
      const horizontalMargin = doc.GetOptions().m_ledgerLineExtension.GetValue() * unit + 0.5 * rightMargin;
      const staffTop = staff?.GetDrawingY() ?? 0; const staffBottom = staffTop - doc.GetDrawingStaffSize(staffSize);
      if (this.HorizontalContentOverlap(element, 0)) {
        if (((this.GetContentTop() > staffTop + 2 * unit) && (this.GetDrawingY() < element.GetDrawingY())) || ((this.GetContentBottom() < staffBottom - 2 * unit) && (this.GetDrawingY() > element.GetDrawingY()))) {
          let right = this.GetSelfRight();
          if (this.GetAccid() === ACCIDENTAL_WRITTEN_f || this.GetAccid() === ACCIDENTAL_WRITTEN_ff) {
            if (this.GetContentTop() > staffTop + 2 * unit && this.GetContentTop() < staffTop + 4 * unit) right = this.GetCutOutRight(doc.GetResources());
          }
          const xRelShift = right - element.GetSelfLeft() + horizontalMargin;
          if (xRelShift > 0) this.SetDrawingXRel(this.GetDrawingXRel() - xRelShift);
        }
      }
    }
  }
  public AdjustX(element: AccidElementLike, doc: AccidDocLike, staffSize: number, leftAccids: Accid[], adjustedAccids: Set<Accid>): void {
    invariant(!!element, 'Accid::AdjustX element is required'); invariant(!!doc, 'Accid::AdjustX doc is required');
    if ((this as unknown as VrvObject) === (element as unknown as VrvObject)) return;
    const unit = doc.GetDrawingUnit(staffSize); let horizontalMargin = doc.GetRightMargin(ClassId.ACCID) * unit;
    if (element.Is(ClassId.ACCID)) horizontalMargin *= 0.66;
    else if (element.Is(ClassId.NOTE)) {
      const note = element as AccidNoteLike; let ledgerAbove = { value: 0 }, ledgerBelow = { value: 0 };
      const staff = note.GetAncestorStaff(1);
      if (note.HasLedgerLines(ledgerAbove, ledgerBelow, staff)) {
        const value = doc.GetOptions().m_ledgerLineExtension.GetValue() * unit + 0.5 * horizontalMargin;
        horizontalMargin = Math.max(horizontalMargin, value);
      }
    }
    const verticalMargin = Math.trunc(unit / 4);
    if (!this.VerticalSelfOverlap(element, verticalMargin)) { this.AdjustToLedgerLines(doc, element, staffSize); return; }
    if (element.Is(ClassId.ACCID) && this.GetDrawingY() === element.GetDrawingY()) {
      const accid = element as unknown as Accid;
      if (this.GetSymbolStr(NOTATIONTYPE_NONE) === accid.GetSymbolStr(NOTATIONTYPE_NONE)) { accid.SetDrawingUnisonAccid(this); return; }
    }
    if (element.Is(ClassId.ACCID)) {
      const accid = element as unknown as Accid;
      if (!this.HorizontalLeftOverlap(element, doc as any, horizontalMargin, verticalMargin)) { leftAccids.push(accid); return; }
      if (!adjustedAccids.has(accid)) return;
    }
    let xRelShift = 0;
    if (element.Is(ClassId.STEM)) xRelShift = this.GetSelfRight() - element.GetSelfLeft() + horizontalMargin;
    else xRelShift = this.HorizontalRightOverlap(element, doc as any, horizontalMargin, verticalMargin);
    if (xRelShift > 0) {
      this.SetDrawingXRel(this.GetDrawingXRel() - xRelShift); adjustedAccids.add(this);
      if (leftAccids.length) {
        const subset: Accid[] = [];
        for (const accid of leftAccids) this.AdjustX(accid, doc, staffSize, subset, adjustedAccids);
      }
    }
  }
  public GetOffsetInterface(): OffsetInterface { return this.offsetInterface; }
  public GetPositionInterface(): PositionInterface { return this.positionInterface; }

  public SetHo(value: number): void { this.offsetInterface.SetHo(value); }
  public GetHo(): number { return this.offsetInterface.GetHo(); }
  public HasHo(): boolean { return this.offsetInterface.HasHo(); }
  public SetVo(value: number): void { this.offsetInterface.SetVo(value); }
  public GetVo(): number { return this.offsetInterface.GetVo(); }
  public HasVo(): boolean { return this.offsetInterface.HasVo(); }
  public SetLoc(value: number): void { this.positionInterface.SetLoc(value); }
  public GetLoc(): number { return this.positionInterface.GetLoc(); }
  public HasLoc(): boolean { return this.positionInterface.HasLoc(); }
  public SetPloc(value: number): void { this.positionInterface.SetPloc(value); }
  public GetPloc(): number { return this.positionInterface.GetPloc(); }
  public HasPloc(): boolean { return this.positionInterface.HasPloc(); }
  public SetOloc(value: number): void { this.positionInterface.SetOloc(value); }
  public GetOloc(): number { return this.positionInterface.GetOloc(); }
  public HasOloc(): boolean { return this.positionInterface.HasOloc(); }
  public SetDrawingUnisonAccid(value: Accid | null): void { this.m_drawingUnison = value; }
  public GetDrawingUnisonAccid(): Accid | null { return this.m_drawingUnison; }
  public GetAccid(): data_ACCIDENTAL_WRITTEN { return this.accidental.GetAccid(); }
  public SetAccid(value: data_ACCIDENTAL_WRITTEN): void { this.accidental.SetAccid(value); }
  public HasAccid(): boolean { return this.accidental.GetAccid() !== ACCIDENTAL_WRITTEN_NONE; }
  public GetAccidGes(): number { return this.accidentalGes.GetAccidGes(); }
  public SetAccidGes(value: number): void { this.accidentalGes.SetAccidGes(value); }
  public HasAccidGes(): boolean { return this.accidentalGes.GetAccidGes() !== 0; }
  public ResetAccidentalGes(): void { this.accidentalGes.ResetAccidentalGes(); }
  public GetEnclose(): data_ENCLOSURE { return (this as any).m_enclose ?? ENCLOSURE_NONE; }
  // C++ AttEnclosingChars::HasEnclose: `enclose` is never "none" when written.
  public HasEnclose(): boolean { return this.GetEnclose() !== ENCLOSURE_NONE; }
  public SetEnclose(value: data_ENCLOSURE): void { (this as any).m_enclose = value; }
  public GetGlyphNum(): data_HEXNUM { return (this as any).m_glyphNum ?? 0; }
  public SetGlyphNum(value: data_HEXNUM): void { (this as any).m_glyphNum = value; }
  public HasGlyphNum(): boolean { return ((this as any).m_glyphNum ?? 0) !== 0; }
  public GetGlyphName(): string { return (this as any).m_glyphName ?? ''; }
  public SetGlyphName(value: string): void { (this as any).m_glyphName = value; }
  public HasGlyphName(): boolean { return ((this as any).m_glyphName ?? '') !== ''; }
  public GetGlyphAuth(): string { return (this as any).m_glyphAuth ?? ''; }
  public SetGlyphAuth(value: string): void { (this as any).m_glyphAuth = value; }
  public HasGlyphAuth(): boolean { return ((this as any).m_glyphAuth ?? '') !== ''; }
  public GetGlyphUri(): string { return (this as any).m_glyphUri ?? ''; }
  public SetGlyphUri(value: string): void { (this as any).m_glyphUri = value; }
  public HasGlyphUri(): boolean { return ((this as any).m_glyphUri ?? '') !== ''; }

  // ATT_COLOR forwarding
  public GetColor(): string { return (this as any).m_color ?? ''; }
  public SetColor(value: string): void { (this as any).m_color = value; }
  public HasColor(): boolean { return ((this as any).m_color ?? '') !== ''; }
  public ResetColor(): void { (this as any).m_color = ''; }

  // ATT_PLACEMENTONSTAFF forwarding
  public GetOnstaff(): number { return (this as any).m_onstaff ?? 0; }
  public SetOnstaff(value: number): void { (this as any).m_onstaff = value; }
  public HasOnstaff(): boolean { return ((this as any).m_onstaff ?? 0) !== 0; }
  public ResetPlacementOnStaff(): void { (this as any).m_onstaff = 0; }

  // ATT_PLACEMENTRELEVENT forwarding
  public GetPlace(): number { return (this as any).m_place ?? 0; }
  public SetPlace(value: number): void { (this as any).m_place = value; }
  public HasPlace(): boolean { return ((this as any).m_place ?? 0) !== 0; }
  public ResetPlacementRelEvent(): void { (this as any).m_place = 0; }
  public IsAlignedWithSameLayer(value?: boolean): boolean | void { if (value === undefined) return this.m_alignedWithSameLayer; this.m_alignedWithSameLayer = value; }
  /** Override the method since alignment is required (accid.h:87). */
  public override HasToBeAligned(): boolean { return true; }
  public SetFunc(value: number): void { (this.accidLog as any).m_func = value; }
  public GetFunc(): number { return (this.accidLog as any).m_func ?? 0; }
  public HasFunc(): boolean { return this.GetFunc() !== 0; }
  public ResetAccidLog(): void { (this.accidLog as any).m_func = 0; }
  public Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitAccid', this); }
  public AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitAccidEnd', this); }

  public static GetAccidGlyph(accid: data_ACCIDENTAL_WRITTEN): number {
    switch (accid) {
      case ACCIDENTAL_WRITTEN_s: return SMUFL_E262_accidentalSharp;
      case ACCIDENTAL_WRITTEN_f: return SMUFL_E260_accidentalFlat;
      case ACCIDENTAL_WRITTEN_ss: return SMUFL_E269_accidentalSharpSharp;
      case ACCIDENTAL_WRITTEN_x: return SMUFL_E263_accidentalDoubleSharp;
      case ACCIDENTAL_WRITTEN_ff: return SMUFL_E264_accidentalDoubleFlat;
      case ACCIDENTAL_WRITTEN_sx: case ACCIDENTAL_WRITTEN_xs: case ACCIDENTAL_WRITTEN_ts: return SMUFL_E265_accidentalTripleSharp;
      case ACCIDENTAL_WRITTEN_tf: return SMUFL_E266_accidentalTripleFlat;
      case ACCIDENTAL_WRITTEN_n: return SMUFL_E261_accidentalNatural;
      case ACCIDENTAL_WRITTEN_nf: return SMUFL_E267_accidentalNaturalFlat;
      case ACCIDENTAL_WRITTEN_ns: return SMUFL_E268_accidentalNaturalSharp;
      case ACCIDENTAL_WRITTEN_su: return SMUFL_E274_accidentalThreeQuarterTonesSharpArrowUp;
      case ACCIDENTAL_WRITTEN_sd: return SMUFL_E275_accidentalQuarterToneSharpArrowDown;
      case ACCIDENTAL_WRITTEN_fu: return SMUFL_E270_accidentalQuarterToneFlatArrowUp;
      case ACCIDENTAL_WRITTEN_fd: return SMUFL_E271_accidentalThreeQuarterTonesFlatArrowDown;
      case ACCIDENTAL_WRITTEN_nu: return SMUFL_E272_accidentalQuarterToneSharpNaturalArrowUp;
      case ACCIDENTAL_WRITTEN_nd: return SMUFL_E273_accidentalQuarterToneFlatNaturalArrowDown;
      case ACCIDENTAL_WRITTEN_1qf: return SMUFL_E280_accidentalQuarterToneFlatStein;
      case ACCIDENTAL_WRITTEN_3qf: return SMUFL_E281_accidentalThreeQuarterTonesFlatZimmermann;
      case ACCIDENTAL_WRITTEN_1qs: return SMUFL_E282_accidentalQuarterToneSharpStein;
      case ACCIDENTAL_WRITTEN_3qs: return SMUFL_E283_accidentalThreeQuarterTonesSharpStein;
      case ACCIDENTAL_WRITTEN_bms: return SMUFL_E447_accidentalBuyukMucennebSharp;
      case ACCIDENTAL_WRITTEN_kms: return SMUFL_E446_accidentalKucukMucennebSharp;
      case ACCIDENTAL_WRITTEN_bs: return SMUFL_E445_accidentalBakiyeSharp;
      case ACCIDENTAL_WRITTEN_ks: return SMUFL_E444_accidentalKomaSharp;
      case ACCIDENTAL_WRITTEN_kf: return SMUFL_E443_accidentalKomaFlat;
      case ACCIDENTAL_WRITTEN_bf: return SMUFL_E442_accidentalBakiyeFlat;
      case ACCIDENTAL_WRITTEN_kmf: return SMUFL_E441_accidentalKucukMucennebFlat;
      case ACCIDENTAL_WRITTEN_bmf: return SMUFL_E440_accidentalBuyukMucennebFlat;
      case ACCIDENTAL_WRITTEN_koron: return SMUFL_E460_accidentalKoron;
      case ACCIDENTAL_WRITTEN_sori: return SMUFL_E461_accidentalSori;
      default: return 0;
    }
  }
  public static CreateSymbolStr(accid: data_ACCIDENTAL_WRITTEN, enclosure: data_ENCLOSURE = ENCLOSURE_NONE, notationType: data_NOTATIONTYPE = NOTATIONTYPE_NONE, resources: AccidResourcesLike | null = null, glyphNum: data_HEXNUM = 0, glyphName = ''): string {
    let code = 0;
    if (resources) {
      if (glyphNum !== 0) { code = glyphNum; if (!resources.GetGlyph(code)) code = 0; }
      else if (glyphName !== '') { code = resources.GetGlyphCode(glyphName); if (!resources.GetGlyph(code)) code = 0; }
    }
    if (!code) {
      if (accid === ACCIDENTAL_WRITTEN_NONE) return '';
      if (IsNeumeType(notationType) || IsMensuralType(notationType)) {
        switch (accid) {
          case ACCIDENTAL_WRITTEN_s: code = SMUFL_E9E3_medRenSharpCroix; break;
          case ACCIDENTAL_WRITTEN_f: code = SMUFL_E9E0_medRenFlatSoftB; break;
          case ACCIDENTAL_WRITTEN_n: code = SMUFL_E9E2_medRenNatural; break;
          default: code = Accid.GetAccidGlyph(accid); break;
        }
      } else code = Accid.GetAccidGlyph(accid);
    }
    switch (enclosure) {
      case ENCLOSURE_brack: return String.fromCodePoint(SMUFL_E26C_accidentalBracketLeft, code, SMUFL_E26D_accidentalBracketRight);
      case ENCLOSURE_paren: return String.fromCodePoint(SMUFL_E26A_accidentalParensLeft, code, SMUFL_E26B_accidentalParensRight);
      default: return String.fromCodePoint(code);
    }
  }
}

// These IDs mirror the C++ registration points; exact libMEI numeric IDs are deliberately isolated here.
export const ATT_ACCIDENTAL = 92; export const ATT_ACCIDENTALGES = 51; export const ATT_ACCIDLOG = 91;
export const ATT_COLOR = 109; export const ATT_ENCLOSINGCHARS = 129; export const ATT_EXTSYMAUTH = 46;
export const ATT_EXTSYMNAMES = 47; export const ATT_PLACEMENTONSTAFF = 184; export const ATT_PLACEMENTRELEVENT = 185;

export class AccidSpaceSort {
  public operator(first: Accid, second: Accid): boolean {
    if (first.GetDrawingY() === second.GetDrawingY()) return first.GetAccid() === ACCIDENTAL_WRITTEN_n && second.GetAccid() !== ACCIDENTAL_WRITTEN_n;
    return first.GetDrawingY() > second.GetDrawingY();
  }
}
export class AccidOctaveSort {
  public GetOctaveID(accid: Accid): string {
    const note = accid.GetFirstAncestor(ClassId.NOTE) as VrvObject | null; invariant(!!note, 'AccidOctaveSort requires a Note ancestor');
    const chord = (note as any).IsChordTone?.() ?? null;
    let id = chord ? chord.GetID() : note!.GetID();
    id += `-${accid.GetAccid()}-${(note as any).GetPname?.() ?? 0}`; return id;
  }
  public operator(first: Accid, second: Accid): boolean { return this.GetOctaveID(first) < this.GetOctaveID(second); }
}

ObjectFactory.GetInstance().Register('accid', ClassId.ACCID, () => new Accid());
