/** Pure TypeScript translation of Verovio's elementpart.h/elementpart.cpp. */
import { ClassId, FunctorCode } from './vrvdef.js';
import { Point } from './devicecontextbase.js';
import { LayerElement } from './layerelement.js';
import {
  SMUFL_E240_flag8thUp, SMUFL_E241_flag8thDown, SMUFL_E242_flag16thUp,
  SMUFL_E243_flag16thDown, SMUFL_E244_flag32ndUp, SMUFL_E245_flag32ndDown,
  SMUFL_E246_flag64thUp, SMUFL_E247_flag64thDown, SMUFL_E248_flag128thUp,
  SMUFL_E249_flag128thDown, SMUFL_E24A_flag256thUp, SMUFL_E24B_flag256thDown,
  SMUFL_E24C_flag512thUp, SMUFL_E24D_flag512thDown, SMUFL_E24E_flag1024thUp,
  SMUFL_E24F_flag1024thDown,
} from './smufl.js';
import { VrvObject } from './object.js';
import { Functor } from './functor.js';
import { InstNumberPlacement } from './atts_cmn.js';
import { InstTupletVis } from './atts_visual.js';

const ATT_AUGMENTDOTS = 97;
const ATT_NUMBERPLACEMENT = 28;
const ATT_TUPLETVIS = 286;

const STEMDIRECTION_UP = 1;
// Canonical data.BEAMPLACE ordinals (above=1, below=2); elementpart.cpp switch
// compares against the real enum, so local 0/1 values silently miss.
const BEAMPLACE_ABOVE = 1;
const BEAMPLACE_BELOW = 2;

class AttAugmentDotsState {
  private dots = -0x7fffffff;
  Reset(): void { this.dots = -0x7fffffff; }
  SetDots(value: number): void { this.dots = value; }
  GetDots(): number { return this.dots; }
}

export interface StaffLikeElementPart extends VrvObject {}
export type MapOfDotLocsElementPart = Map<StaffLikeElementPart, Set<number>>;

export interface DocLikeElementPart {
  GetGlyphTop(code: number, staffSize: number, graceSize: boolean): number;
  GetGlyphBottom(code: number, staffSize: number, graceSize: boolean): number;
}

export interface BeamSegmentLike {
  GetStartingY(): number;
  GetStartingX(): number;
  m_beamSlope: number;
}

export interface BeamLikeElementPart extends VrvObject {
  m_beamSegment: BeamSegmentLike;
  m_drawingPlace: number;
}

export interface TupletElementPartLike extends VrvObject {
  GetDrawingLeft(): VrvObject | null;
  GetDrawingRight(): VrvObject | null;
  GetBracketAlignedBeam(): BeamLikeElementPart | null;
  GetNumAlignedBeam(): BeamLikeElementPart | null;
}

export interface TupletEndpointLike extends VrvObject {
  GetDrawingX(): number;
  GetDrawingRadius(doc: unknown): number;
}

function visitorCall(functor: Functor, method: string, self: unknown): FunctorCode {
  const fn = (functor as unknown as Record<string, unknown>)[method as string];
  if (typeof fn !== 'function') return FunctorCode.FUNCTOR_CONTINUE;
  return (fn as (value: unknown) => FunctorCode).call(functor, self);
}

export class Dots extends LayerElement {
  private augmentDots!: AttAugmentDotsState;
  private m_dotLocsByStaff!: MapOfDotLocsElementPart;
  private m_isAdjusted = false;
  private m_flagShift = 0;

  public constructor() {
    super(ClassId.DOTS);
    this.RegisterAttClass(ATT_AUGMENTDOTS);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    (this.augmentDots ??= new AttAugmentDotsState()).Reset();
    (this.m_dotLocsByStaff ??= new Map()).clear();
    this.m_isAdjusted = false;
    this.m_flagShift = 0;
  }

  public override GetClassName(): string { return 'dots'; }
  public override Clone(): Dots {
    const clone = new Dots();
    clone.m_dotLocsByStaff = new Map(this.m_dotLocsByStaff);
    clone.m_isAdjusted = this.m_isAdjusted;
    clone.m_flagShift = this.m_flagShift;
    return clone;
  }
  public override HasToBeAligned(): boolean { return true; }

  public SetDots(value: number): void { this.augmentDots.SetDots(value); }
  public GetDots(): number { return this.augmentDots.GetDots(); }
  public HasDots(): boolean { return this.GetDots() !== -0x7fffffff; }

  public GetDotLocsForStaff(staff: StaffLikeElementPart): Set<number> {
    return this.m_dotLocsByStaff.get(staff) ?? new Set<number>();
  }

  public ModifyDotLocsForStaff(staff: StaffLikeElementPart): Set<number> {
    let locs = this.m_dotLocsByStaff.get(staff);
    if (!locs) {
      locs = new Set<number>();
      this.m_dotLocsByStaff.set(staff, locs);
    }
    return locs;
  }

  public GetMapOfDotLocs(): MapOfDotLocsElementPart { return this.m_dotLocsByStaff; }
  public SetMapOfDotLocs(value: MapOfDotLocsElementPart): void { this.m_dotLocsByStaff = value; }
  public ResetMapOfDotLocs(): void { this.m_dotLocsByStaff.clear(); }

  public IsAdjusted(value?: boolean): boolean | void {
    if (value === undefined) return this.m_isAdjusted;
    this.m_isAdjusted = value;
  }
  public GetFlagShift(): number { return this.m_flagShift; }
  public SetFlagShift(value: number): void { this.m_flagShift = value; }

  public override Accept(functor: any): FunctorCode { return visitorCall(functor, 'VisitDots', this); }
  public AcceptConst(functor: any): FunctorCode { return visitorCall(functor, 'VisitDots', this); }
  public override AcceptEnd(functor: any): FunctorCode { return visitorCall(functor, 'VisitDotsEnd', this); }
  public AcceptEndConst(functor: any): FunctorCode { return visitorCall(functor, 'VisitDotsEnd', this); }
}

export class Flag extends LayerElement {
  public m_drawingNbFlags = 0;

  public constructor() {
    super(ClassId.FLAG);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.m_drawingNbFlags = 0;
  }

  public override GetClassName(): string { return 'flag'; }
  public override Clone(): Flag {
    const clone = new Flag();
    clone.m_drawingNbFlags = this.m_drawingNbFlags;
    return clone;
  }
  public override HasToBeAligned(): boolean { return true; }

  public GetFlagGlyph(stemDir: number): number {
    if (stemDir === STEMDIRECTION_UP) {
      switch (this.m_drawingNbFlags) {
        case 1: return SMUFL_E240_flag8thUp;
        case 2: return SMUFL_E242_flag16thUp;
        case 3: return SMUFL_E244_flag32ndUp;
        case 4: return SMUFL_E246_flag64thUp;
        case 5: return SMUFL_E248_flag128thUp;
        case 6: return SMUFL_E24A_flag256thUp;
        case 7: return SMUFL_E24C_flag512thUp;
        case 8: return SMUFL_E24E_flag1024thUp;
        default: return 0;
      }
    }
    switch (this.m_drawingNbFlags) {
      case 1: return SMUFL_E241_flag8thDown;
      case 2: return SMUFL_E243_flag16thDown;
      case 3: return SMUFL_E245_flag32ndDown;
      case 4: return SMUFL_E247_flag64thDown;
      case 5: return SMUFL_E249_flag128thDown;
      case 6: return SMUFL_E24B_flag256thDown;
      case 7: return SMUFL_E24D_flag512thDown;
      case 8: return SMUFL_E24F_flag1024thDown;
      default: return 0;
    }
  }

  public GetStemUpSE(doc: DocLikeElementPart, staffSize: number, graceSize: boolean): Point {
    return new Point(0, doc.GetGlyphTop(this.GetFlagGlyph(STEMDIRECTION_UP), staffSize, graceSize));
  }

  public GetStemDownNW(doc: DocLikeElementPart, staffSize: number, graceSize: boolean): Point {
    return new Point(0, doc.GetGlyphBottom(this.GetFlagGlyph(0), staffSize, graceSize));
  }

  public override Accept(functor: any): FunctorCode { return visitorCall(functor, 'VisitFlag', this); }
  public AcceptConst(functor: any): FunctorCode { return visitorCall(functor, 'VisitFlag', this); }
  public override AcceptEnd(functor: any): FunctorCode { return visitorCall(functor, 'VisitFlagEnd', this); }
  public AcceptEndConst(functor: any): FunctorCode { return visitorCall(functor, 'VisitFlagEnd', this); }
}

export class TupletBracket extends LayerElement {
  private tupletVis!: InstTupletVis;
  private m_drawingXRelLeft = 0;
  private m_drawingXRelRight = 0;
  private m_drawingYRelLeft = 0;
  private m_drawingYRelRight = 0;
  private m_alignedNum: TupletNum | null = null;

  public constructor() {
    super(ClassId.TUPLET_BRACKET);
    this.RegisterAttClass(ATT_TUPLETVIS);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    (this.tupletVis ??= new InstTupletVis()).ResetTupletVis();
    this.m_drawingXRelLeft = 0;
    this.m_drawingXRelRight = 0;
    this.m_drawingYRelLeft = 0;
    this.m_drawingYRelRight = 0;
    this.m_alignedNum = null;
  }

  public override GetClassName(): string { return 'tupletBracket'; }
  public override Clone(): TupletBracket {
    const clone = new TupletBracket();
    clone.AssignFrom(this);
    clone.m_drawingXRelLeft = this.m_drawingXRelLeft;
    clone.m_drawingXRelRight = this.m_drawingXRelRight;
    clone.m_drawingYRelLeft = this.m_drawingYRelLeft;
    clone.m_drawingYRelRight = this.m_drawingYRelRight;
    clone.m_alignedNum = this.m_alignedNum;
    if (this.HasBracketPlace()) clone.SetBracketPlace(this.GetBracketPlace());
    if (this.HasBracketVisible()) clone.SetBracketVisible(this.GetBracketVisible());
    if (this.HasNumFormat()) clone.SetNumFormat(this.GetNumFormat());
    return clone;
  }

  // AttTupletVis forwarding
  public ResetTupletVis(): void { this.tupletVis.ResetTupletVis(); }
  public SetBracketPlace(value: any): void { this.tupletVis.SetBracketPlace(value); }
  public GetBracketPlace(): any { return this.tupletVis.GetBracketPlace(); }
  public HasBracketPlace(): boolean { return this.tupletVis.HasBracketPlace(); }
  public SetBracketVisible(value: any): void { this.tupletVis.SetBracketVisible(value); }
  public GetBracketVisible(): any { return this.tupletVis.GetBracketVisible(); }
  public HasBracketVisible(): boolean { return this.tupletVis.HasBracketVisible(); }
  public SetNumFormat(value: any): void { this.tupletVis.SetNumFormat(value); }
  public GetNumFormat(): any { return this.tupletVis.GetNumFormat(); }
  public HasNumFormat(): boolean { return this.tupletVis.HasNumFormat(); }
  /** C++ `AttTupletVis::operator=` member-wise copy from the parent Tuplet. */
  public CopyTupletVisFrom(source: {
    HasBracketPlace(): boolean; GetBracketPlace(): any;
    HasBracketVisible(): boolean; GetBracketVisible(): any;
    HasNumFormat(): boolean; GetNumFormat(): any;
  }): void {
    (this.tupletVis ??= new InstTupletVis()).ResetTupletVis();
    if (source.HasBracketPlace()) this.tupletVis.SetBracketPlace(source.GetBracketPlace());
    if (source.HasBracketVisible()) this.tupletVis.SetBracketVisible(source.GetBracketVisible());
    if (source.HasNumFormat()) this.tupletVis.SetNumFormat(source.GetNumFormat());
  }

  public GetDrawingXRelLeft(): number { return this.m_drawingXRelLeft; }
  public SetDrawingXRelLeft(value: number): void { this.m_drawingXRelLeft = value; }
  public GetDrawingXRelRight(): number { return this.m_drawingXRelRight; }
  public SetDrawingXRelRight(value: number): void { this.m_drawingXRelRight = value; }
  public GetDrawingYRelLeft(): number { return this.m_drawingYRelLeft; }
  public SetDrawingYRelLeft(value: number): void { this.m_drawingYRelLeft = value; }
  public GetDrawingYRelRight(): number { return this.m_drawingYRelRight; }
  public SetDrawingYRelRight(value: number): void { this.m_drawingYRelRight = value; }

  private GetTupletAncestor(): TupletElementPartLike {
    const tuplet = this.GetFirstAncestor(ClassId.TUPLET) as TupletElementPartLike | null;
    if (!tuplet) throw new Error('TupletBracket requires a Tuplet ancestor.');
    return tuplet;
  }

  public GetDrawingXLeft(): number {
    const tuplet = this.GetTupletAncestor();
    const left = tuplet.GetDrawingLeft();
    if (!left) throw new Error('TupletBracket requires a left drawing element.');
    return left.GetDrawingX() + this.m_drawingXRelLeft;
  }

  public GetDrawingXRight(): number {
    const tuplet = this.GetTupletAncestor();
    const right = tuplet.GetDrawingRight();
    if (!right) throw new Error('TupletBracket requires a right drawing element.');
    return right.GetDrawingX() + this.m_drawingXRelRight;
  }

  public GetDrawingYLeft(): number {
    const tuplet = this.GetTupletAncestor();
    const left = tuplet.GetDrawingLeft();
    if (!left) throw new Error('TupletBracket requires a left drawing element.');
    const beam = tuplet.GetBracketAlignedBeam();
    if (beam) {
      const xLeft = left.GetDrawingX() + this.m_drawingXRelLeft;
      return Math.trunc(beam.m_beamSegment.GetStartingY()
        + beam.m_beamSegment.m_beamSlope * (xLeft - beam.m_beamSegment.GetStartingX())
        + this.GetDrawingYRel() + this.m_drawingYRelLeft);
    }
    return this.GetDrawingY() + this.m_drawingYRelLeft;
  }

  public GetDrawingYRight(): number {
    const tuplet = this.GetTupletAncestor();
    const right = tuplet.GetDrawingRight();
    if (!right) throw new Error('TupletBracket requires a right drawing element.');
    const beam = tuplet.GetBracketAlignedBeam();
    if (beam) {
      const xRight = right.GetDrawingX() + this.m_drawingXRelRight;
      return Math.trunc(beam.m_beamSegment.GetStartingY()
        + beam.m_beamSegment.m_beamSlope * (xRight - beam.m_beamSegment.GetStartingX())
        + this.GetDrawingYRel() + this.m_drawingYRelRight);
    }
    return this.GetDrawingY() + this.m_drawingYRelRight;
  }

  public GetAlignedNum(): TupletNum | null { return this.m_alignedNum; }
  public SetAlignedNum(value: TupletNum | null): void { this.m_alignedNum = value; }

  public override Accept(functor: any): FunctorCode { return visitorCall(functor, 'VisitTupletBracket', this); }
  public AcceptConst(functor: any): FunctorCode { return visitorCall(functor, 'VisitTupletBracket', this); }
  public override AcceptEnd(functor: any): FunctorCode { return visitorCall(functor, 'VisitTupletBracketEnd', this); }
  public AcceptEndConst(functor: any): FunctorCode { return visitorCall(functor, 'VisitTupletBracketEnd', this); }
}

export class TupletNum extends LayerElement {
  private numberPlacement!: InstNumberPlacement;
  private tupletVis!: InstTupletVis;
  private m_alignedBracket: TupletBracket | null = null;

  public constructor() {
    super(ClassId.TUPLET_NUM);
    this.RegisterAttClass(ATT_NUMBERPLACEMENT);
    this.RegisterAttClass(ATT_TUPLETVIS);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    (this.numberPlacement ??= new InstNumberPlacement()).ResetNumberPlacement();
    (this.tupletVis ??= new InstTupletVis()).ResetTupletVis();
    this.m_alignedBracket = null;
  }

  public override GetClassName(): string { return 'tupletNum'; }
  public override Clone(): TupletNum {
    const clone = new TupletNum();
    clone.AssignFrom(this);
    clone.m_alignedBracket = this.m_alignedBracket;
    if (this.HasNumPlace()) clone.SetNumPlace(this.GetNumPlace());
    if (this.HasNumVisible()) clone.SetNumVisible(this.GetNumVisible());
    if (this.HasBracketPlace()) clone.SetBracketPlace(this.GetBracketPlace());
    if (this.HasBracketVisible()) clone.SetBracketVisible(this.GetBracketVisible());
    if (this.HasNumFormat()) clone.SetNumFormat(this.GetNumFormat());
    return clone;
  }

  // AttNumberPlacement forwarding
  public ResetNumberPlacement(): void { this.numberPlacement.ResetNumberPlacement(); }
  public SetNumPlace(value: any): void { this.numberPlacement.SetNumPlace(value); }
  public GetNumPlace(): any { return this.numberPlacement.GetNumPlace(); }
  public HasNumPlace(): boolean { return this.numberPlacement.HasNumPlace(); }
  public SetNumVisible(value: any): void { this.numberPlacement.SetNumVisible(value); }
  public GetNumVisible(): any { return this.numberPlacement.GetNumVisible(); }
  public HasNumVisible(): boolean { return this.numberPlacement.HasNumVisible(); }
  /** C++ `AttNumberPlacement::operator=` member-wise copy from the parent Tuplet. */
  public CopyNumberPlacementFrom(source: { HasNumPlace(): boolean; GetNumPlace(): any; HasNumVisible(): boolean; GetNumVisible(): any }): void {
    (this.numberPlacement ??= new InstNumberPlacement()).ResetNumberPlacement();
    if (source.HasNumPlace()) this.numberPlacement.SetNumPlace(source.GetNumPlace());
    if (source.HasNumVisible()) this.numberPlacement.SetNumVisible(source.GetNumVisible());
  }

  // AttTupletVis forwarding
  public ResetTupletVis(): void { this.tupletVis.ResetTupletVis(); }
  public SetBracketPlace(value: any): void { this.tupletVis.SetBracketPlace(value); }
  public GetBracketPlace(): any { return this.tupletVis.GetBracketPlace(); }
  public HasBracketPlace(): boolean { return this.tupletVis.HasBracketPlace(); }
  public SetBracketVisible(value: any): void { this.tupletVis.SetBracketVisible(value); }
  public GetBracketVisible(): any { return this.tupletVis.GetBracketVisible(); }
  public HasBracketVisible(): boolean { return this.tupletVis.HasBracketVisible(); }
  public SetNumFormat(value: any): void { this.tupletVis.SetNumFormat(value); }
  public GetNumFormat(): any { return this.tupletVis.GetNumFormat(); }
  public HasNumFormat(): boolean { return this.tupletVis.HasNumFormat(); }
  /** C++ `AttTupletVis::operator=` member-wise copy from the parent Tuplet. */
  public CopyTupletVisFrom(source: {
    HasBracketPlace(): boolean; GetBracketPlace(): any;
    HasBracketVisible(): boolean; GetBracketVisible(): any;
    HasNumFormat(): boolean; GetNumFormat(): any;
  }): void {
    (this.tupletVis ??= new InstTupletVis()).ResetTupletVis();
    if (source.HasBracketPlace()) this.tupletVis.SetBracketPlace(source.GetBracketPlace());
    if (source.HasBracketVisible()) this.tupletVis.SetBracketVisible(source.GetBracketVisible());
    if (source.HasNumFormat()) this.tupletVis.SetNumFormat(source.GetNumFormat());
  }

  public GetDrawingYMid(): number {
    if (this.m_alignedBracket) {
      const yLeft = this.m_alignedBracket.GetDrawingYLeft();
      const yRight = this.m_alignedBracket.GetDrawingYRight();
      // C++ int division truncates toward zero.
      return yLeft + Math.trunc((yRight - yLeft) / 2);
    }
    return this.GetDrawingY();
  }

  public GetDrawingXMid(doc: DocLikeElementPart | null = null): number {
    if (this.m_alignedBracket) {
      const xLeft = this.m_alignedBracket.GetDrawingXLeft();
      const xRight = this.m_alignedBracket.GetDrawingXRight();
      // C++ int division truncates toward zero.
      return xLeft + Math.trunc((xRight - xLeft) / 2);
    }

    const tuplet = this.GetFirstAncestor(ClassId.TUPLET) as TupletElementPartLike | null;
    if (!tuplet) throw new Error('TupletNum requires a Tuplet ancestor.');
    const left = tuplet.GetDrawingLeft() as TupletEndpointLike | null;
    const right = tuplet.GetDrawingRight() as TupletEndpointLike | null;
    if (!left || !right) throw new Error('TupletNum requires tuple endpoints.');

    let xLeft = left.GetDrawingX();
    let xRight = right.GetDrawingX();
    if (doc) xRight += (right.GetDrawingRadius(doc) * 2);

    const beam = tuplet.GetNumAlignedBeam();
    if (beam) {
      switch (beam.m_drawingPlace) {
        case BEAMPLACE_ABOVE: xLeft += left.GetDrawingRadius(doc); break;
        case BEAMPLACE_BELOW: xRight -= right.GetDrawingRadius(doc); break;
        default: break;
      }
    }
    // C++ int division truncates toward zero.
    return xLeft + Math.trunc((xRight - xLeft) / 2);
  }

  public GetAlignedBracket(): TupletBracket | null { return this.m_alignedBracket; }

  public SetAlignedBracket(value: TupletBracket | null): void {
    if (this.m_alignedBracket) this.m_alignedBracket.SetAlignedNum(null);
    this.m_alignedBracket = value;
    if (this.m_alignedBracket) this.m_alignedBracket.SetAlignedNum(this);
  }

  public override Accept(functor: any): FunctorCode { return visitorCall(functor, 'VisitTupletNum', this); }
  public AcceptConst(functor: any): FunctorCode { return visitorCall(functor, 'VisitTupletNum', this); }
  public override AcceptEnd(functor: any): FunctorCode { return visitorCall(functor, 'VisitTupletNumEnd', this); }
  public AcceptEndConst(functor: any): FunctorCode { return visitorCall(functor, 'VisitTupletNumEnd', this); }
}
