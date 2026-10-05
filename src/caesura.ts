import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, VrvObject } from './object.js';
import { ControlElement } from './controlelement.js';
import { TimePointInterface } from './timeinterface.js';
import { InstExtSymAuth, InstExtSymNames } from './atts_externalsymbols.js';
import { StaffRel } from './textdirinterface.js';
import { SMUFL_E4D1_caesura } from './smufl.js';
import type { ResourcesLike } from './boundingbox.js';

const ATT_EXTSYMAUTH = 46;
const ATT_EXTSYMNAMES = 47;
const ATT_PLACEMENTRELSTAFF = 186;

/**
 * AttPlacementRelStaff attribute state for Caesura (from libmei atts_cmn).
 * C++ inherits AttPlacementRelStaff directly; TS uses composition with the
 * same public surface.
 */
export class CaesuraPlacementRelStaff {
  private m_place = StaffRel.NONE;
  ResetPlacementRelStaff(): void { this.m_place = StaffRel.NONE; }
  SetPlace(v: StaffRel): void { this.m_place = v; }
  GetPlace(): StaffRel { return this.m_place; }
  HasPlace(): boolean { return this.m_place !== StaffRel.NONE; }
}

/** Resources contract consumed by Caesura::GetCaesuraGlyph; matches canonical resources.ts. */
export interface CaesuraResourcesLike {
  GetGlyph(code: number): unknown | null;
  GetGlyphCode(smuflName: string): number;
}

/** Pure TypeScript translation of Verovio's src/caesura.cpp / include/vrv/caesura.h. */
export class Caesura extends ControlElement {
  private timePointInterface: TimePointInterface | null = null;
  private extSymAuth: InstExtSymAuth | null = null;
  private extSymNames: InstExtSymNames | null = null;
  private placementRelStaff: CaesuraPlacementRelStaff | null = null;

  public constructor() {
    super(ClassId.CAESURA);
    this.timePointInterface = new TimePointInterface();
    this.extSymAuth = new InstExtSymAuth();
    this.extSymNames = new InstExtSymNames();
    this.placementRelStaff = new CaesuraPlacementRelStaff();
    this.RegisterInterface(this.timePointInterface.GetAttClasses(), this.timePointInterface.IsInterface());
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.RegisterAttClass(ATT_PLACEMENTRELSTAFF);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.timePointInterface ??= new TimePointInterface();
    this.extSymAuth ??= new InstExtSymAuth();
    this.extSymNames ??= new InstExtSymNames();
    this.placementRelStaff ??= new CaesuraPlacementRelStaff();
    this.timePointInterface.Reset();
    // C++ Reset() does not reset AttExtSymAuth/AttExtSymNames (only PlacementRelStaff);
    // they keep their libmei attribute state because the C++ Reset() omits them.
    this.placementRelStaff.ResetPlacementRelStaff();
  }

  public override GetClassName(): string { return 'caesura'; }

  public GetTimePointInterface(): TimePointInterface {
    this.timePointInterface ??= new TimePointInterface();
    return this.timePointInterface;
  }
  public SetStaff(v: number[]): void { this.GetTimePointInterface().SetStaff(v); }
  public GetStaff(): number[] { return this.GetTimePointInterface().GetStaff(); }
  public HasStaff(): boolean { return this.GetTimePointInterface().HasStaff(); }
  public SetStartid(v: string): void { this.GetTimePointInterface().SetStartid(v); }
  public SetTstamp(v: number): void { this.GetTimePointInterface().SetTstamp(v); }
  // C++ Caesura : TimePointInterface full forwarders (view_control.cpp:1718 uses GetStart/GetTstampStaves).
  public GetStartid(): string { return this.GetTimePointInterface().GetStartid(); }
  public HasStartid(): boolean { return this.GetTimePointInterface().HasStartid(); }
  public GetTstamp(): number { return this.GetTimePointInterface().GetTstamp(); }
  public HasTstamp(): boolean { return this.GetTimePointInterface().HasTstamp(); }
  public SetStart(v: unknown): void { this.GetTimePointInterface().SetStart(v as never); }
  public GetStart(): unknown { return this.GetTimePointInterface().GetStart(); }
  public HasStart(): boolean { return this.GetTimePointInterface().HasStart(); }
  public GetTstampStaves(measure: unknown, object: unknown): unknown[] { return this.GetTimePointInterface().GetTstampStaves(measure as never, object as never); }

  /** Get the SMuFL glyph. */
  public GetCaesuraGlyph(): number {
    const resources = this.GetDocResources() as unknown as CaesuraResourcesLike | null;
    if (!resources) return 0;

    // If there is glyph.num, prioritize it
    if (this.HasGlyphNum()) {
      const code = this.GetGlyphNum();
      if (resources.GetGlyph(code)) return code;
    }
    // If there is glyph.name (second priority)
    else if (this.HasGlyphName()) {
      const code = resources.GetGlyphCode(this.GetGlyphName());
      if (resources.GetGlyph(code)) return code;
    }

    // return standard glyph
    return SMUFL_E4D1_caesura;
  }

  // AttExtSymAuth forwarding
  public ResetExtSymAuth(): void { this.extSymAuth!.ResetExtSymAuth(); }
  public SetGlyphAuth(glyphAuth: string): void { this.extSymAuth!.SetGlyphAuth(glyphAuth); }
  public GetGlyphAuth(): string { return this.extSymAuth!.GetGlyphAuth(); }
  public HasGlyphAuth(): boolean { return this.extSymAuth!.HasGlyphAuth(); }
  public SetGlyphUri(glyphUri: string): void { this.extSymAuth!.SetGlyphUri(glyphUri); }
  public GetGlyphUri(): string { return this.extSymAuth!.GetGlyphUri(); }
  public HasGlyphUri(): boolean { return this.extSymAuth!.HasGlyphUri(); }

  // AttExtSymNames forwarding
  public ResetExtSymNames(): void { this.extSymNames!.ResetExtSymNames(); }
  public SetGlyphName(glyphName: string): void { this.extSymNames!.SetGlyphName(glyphName); }
  public GetGlyphName(): string { return this.extSymNames!.GetGlyphName(); }
  public HasGlyphName(): boolean { return this.extSymNames!.HasGlyphName(); }
  public SetGlyphNum(glyphNum: number): void { this.extSymNames!.SetGlyphNum(glyphNum); }
  public GetGlyphNum(): number { return this.extSymNames!.GetGlyphNum(); }
  public HasGlyphNum(): boolean { return this.extSymNames!.HasGlyphNum(); }

  // AttPlacementRelStaff forwarding
  public SetPlace(v: StaffRel): void { this.placementRelStaff!.SetPlace(v); }
  public GetPlace(): StaffRel { return this.placementRelStaff!.GetPlace(); }
  public HasPlace(): boolean { return this.placementRelStaff!.HasPlace(); }
  public ResetPlacementRelStaff(): void { this.placementRelStaff!.ResetPlacementRelStaff(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitCaesura');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitCaesura');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitCaesuraEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitCaesuraEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Caesura {
    const clone = new Caesura();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all interface/attribute members.
    const tp = this.GetTimePointInterface();
    const ctp = clone.GetTimePointInterface();
    if (tp.HasPart()) ctp.SetPart(tp.GetPart());
    if (tp.HasStaff()) ctp.SetStaff(tp.GetStaff());
    if (tp.HasStartid()) ctp.SetStartid(tp.GetStartid());
    if (tp.HasTstamp()) ctp.SetTstamp(tp.GetTstamp());
    clone.SetGlyphAuth(this.GetGlyphAuth());
    clone.SetGlyphUri(this.GetGlyphUri());
    clone.SetGlyphName(this.GetGlyphName());
    clone.SetGlyphNum(this.GetGlyphNum());
    clone.SetPlace(this.GetPlace());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('caesura', ClassId.CAESURA, () => new Caesura());
