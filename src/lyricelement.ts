/**
 * Pure TypeScript translation of Verovio's `src/lyricelement.cpp` / `include/vrv/lyricelement.h`.
 *
 * `LyricElement` is the shared base implementation for note-attached verse and refrain lyrics.
 *
 * C++ multiple inheritance (LayerElement + OffsetInterface + AttColor + AttLang +
 * AttPlacementRelStaff + AttTypography + AttVoltaGroupingSym) is represented
 * through explicit composition with forwarding surfaces.
 */
import { ClassId } from './vrvdef.js';
import { VrvObject } from './object.js';
import { LayerElement } from './layerelement.js';
import { OffsetInterface } from './offsetinterface.js';
import {
  InstColor,
  InstLang,
  InstPlacementRelStaff,
  InstTypography,
  InstVoltaGroupingSym,
} from './atts_shared.js';

// Canonical libmei att-class ordinals (libmei/dist/attclasses.h).
const ATT_COLOR = 109;
const ATT_LANG = 146;
const ATT_PLACEMENTRELSTAFF = 186;
const ATT_TYPOGRAPHY = 225;
const ATT_VOLTAGROUPINGSYM = 235;

/** Structural interface for Volta objects until `volta.ts` is ported. */
export interface VoltaLike extends VrvObject {
  GetDrawingVoltaN(): number;
}

/** Structural interface for Doc objects passed to AdjustPosition. */
export interface LyricDocLike {
  GetDrawingUnit(staffSize: number): number;
}

/** Pure-TypeScript translation of Verovio's `LyricElement` base class. */
export abstract class LyricElement extends LayerElement {
  private offsetInterface!: OffsetInterface;
  private color!: InstColor;
  private lang!: InstLang;
  private placementRelStaff!: InstPlacementRelStaff;
  private typography!: InstTypography;
  private voltaGroupingSym!: InstVoltaGroupingSym;

  private m_drawingVerseN = 1;
  private m_drawingLyricGroupN = 1;
  private m_drawingDirectSylTrack = false;

  protected constructor(classId: ClassId) {
    super(classId);
    this.offsetInterface = new OffsetInterface();
    this.color = new InstColor();
    this.lang = new InstLang();
    this.placementRelStaff = new InstPlacementRelStaff();
    this.typography = new InstTypography();
    this.voltaGroupingSym = new InstVoltaGroupingSym();

    this.RegisterInterface(this.offsetInterface.GetAttClasses(), this.offsetInterface.IsInterface());
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_LANG);
    this.RegisterAttClass(ATT_PLACEMENTRELSTAFF);
    this.RegisterAttClass(ATT_TYPOGRAPHY);
    this.RegisterAttClass(ATT_VOLTAGROUPINGSYM);
  }

  public override Reset(): void {
    super.Reset();
    this.offsetInterface ??= new OffsetInterface();
    this.color ??= new InstColor();
    this.lang ??= new InstLang();
    this.placementRelStaff ??= new InstPlacementRelStaff();
    this.typography ??= new InstTypography();
    this.voltaGroupingSym ??= new InstVoltaGroupingSym();

    this.offsetInterface.Reset();
    this.color.ResetColor();
    this.lang.ResetLang();
    this.placementRelStaff.ResetPlacementRelStaff();
    this.typography.ResetTypography();
    this.voltaGroupingSym.ResetVoltaGroupingSym();
    this.ResetDrawingLyricGroup();
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.SYL || classId === ClassId.VOLTA) {
      return true;
    }
    return VrvObject.IsEditorialElement(classId);
  }

  public override GetOffsetInterface(): OffsetInterface {
    return this.offsetInterface;
  }

  public GetVoltaCount(): number {
    return this.FindAllDescendantsByType(ClassId.VOLTA).length;
  }

  public GetVoltaDrawingRange(): [number, number] {
    let first = 0;
    let last = 0;
    for (const object of this.FindAllDescendantsByType(ClassId.VOLTA)) {
      const volta = object as unknown as VoltaLike;
      const drawingN = typeof volta.GetDrawingVoltaN === 'function' ? volta.GetDrawingVoltaN() : 0;
      first = first === 0 ? drawingN : Math.min(first, drawingN);
      last = Math.max(last, drawingN);
    }
    return [first, last];
  }

  public HasDirectSyl(): boolean {
    const syls = this.FindAllDescendantsByType(ClassId.SYL);
    return syls.some((syl) => syl.GetFirstAncestor(ClassId.VOLTA) === null);
  }

  public HasDrawingDirectSylTrack(): boolean {
    return this.m_drawingDirectSylTrack || this.HasDirectSyl();
  }

  public SetDrawingDirectSylTrack(): void {
    this.m_drawingDirectSylTrack = true;
  }

  public ResetDrawingDirectSylTrack(): void {
    this.m_drawingDirectSylTrack = false;
  }

  public GetLyricLineCount(): number {
    const lastVoltaTrack = this.GetVoltaDrawingRange()[1];
    return Math.max(1, lastVoltaTrack + (lastVoltaTrack && this.HasDrawingDirectSylTrack() ? 1 : 0));
  }

  public GetVoltaLineN(volta: VoltaLike): number {
    const drawingN = typeof volta.GetDrawingVoltaN === 'function' ? volta.GetDrawingVoltaN() : 0;
    return drawingN + (this.HasDrawingDirectSylTrack() ? 1 : 0);
  }

  public GetDrawingVerseN(): number {
    return this.m_drawingVerseN;
  }

  public SetDrawingVerseN(verseN: number): void {
    this.m_drawingVerseN = Math.max(verseN, 1);
  }

  public GetDrawingLyricGroupN(): number {
    return this.m_drawingLyricGroupN;
  }

  public SetDrawingLyricGroupN(groupN: number): void {
    this.m_drawingLyricGroupN = Math.max(groupN, 1);
  }

  public ResetDrawingLyricGroup(): void {
    this.m_drawingVerseN = 1;
    this.m_drawingLyricGroupN = 1;
    this.m_drawingDirectSylTrack = false;
  }

  public AdjustPosition(
    overlap: { value: number } | number,
    freeSpace: number,
    doc: LyricDocLike,
  ): number {
    if (!doc) throw new Error('assert(doc)');

    const isRef = typeof overlap === 'object' && overlap !== null;
    let overlapVal = isRef ? overlap.value : overlap;
    let nextFreeSpace = 0;

    if (overlapVal > 0) {
      if (freeSpace > overlapVal) {
        this.SetDrawingXRel(this.GetDrawingXRel() - overlapVal);
        overlapVal = 0;
        if (isRef) overlap.value = 0;
      } else if (freeSpace > 0) {
        this.SetDrawingXRel(this.GetDrawingXRel() - freeSpace);
        overlapVal -= freeSpace;
        if (isRef) overlap.value -= freeSpace;
      }
    } else {
      nextFreeSpace = Math.min(-overlapVal, 3 * doc.GetDrawingUnit(100));
    }
    return nextFreeSpace;
  }

  // AttColor forwarding.
  public SetColor(value: any): void { this.color.SetColor(value); }
  public GetColor(): any { return this.color.GetColor(); }
  public HasColor(): boolean { return this.color.HasColor(); }
  public ResetColor(): void { this.color.ResetColor(); }

  // AttLang forwarding.
  public SetLang(value: any): void { this.lang.SetLang(value); }
  public GetLang(): any { return this.lang.GetLang(); }
  public HasLang(): boolean { return this.lang.HasLang(); }
  public SetTranslit(value: any): void { this.lang.SetTranslit(value); }
  public GetTranslit(): any { return this.lang.GetTranslit(); }
  public HasTranslit(): boolean { return this.lang.HasTranslit(); }
  public ResetLang(): void { this.lang.ResetLang(); }

  // AttPlacementRelStaff forwarding.
  public SetPlace(value: any): void { this.placementRelStaff.SetPlace(value); }
  public GetPlace(): any { return this.placementRelStaff.GetPlace(); }
  public HasPlace(): boolean { return this.placementRelStaff.HasPlace(); }
  public ResetPlacementRelStaff(): void { this.placementRelStaff.ResetPlacementRelStaff(); }

  // AttTypography forwarding.
  public SetFontfam(value: any): void { this.typography.SetFontfam(value); }
  public GetFontfam(): any { return this.typography.GetFontfam(); }
  public HasFontfam(): boolean { return this.typography.HasFontfam(); }
  public SetFontname(value: any): void { this.typography.SetFontname(value); }
  public GetFontname(): any { return this.typography.GetFontname(); }
  public HasFontname(): boolean { return this.typography.HasFontname(); }
  public SetFontsize(value: any): void { this.typography.SetFontsize(value); }
  public GetFontsize(): any { return this.typography.GetFontsize(); }
  public HasFontsize(): boolean { return this.typography.HasFontsize(); }
  public SetFontstyle(value: any): void { this.typography.SetFontstyle(value); }
  public GetFontstyle(): any { return this.typography.GetFontstyle(); }
  public HasFontstyle(): boolean { return this.typography.HasFontstyle(); }
  public SetFontweight(value: any): void { this.typography.SetFontweight(value); }
  public GetFontweight(): any { return this.typography.GetFontweight(); }
  public HasFontweight(): boolean { return this.typography.HasFontweight(); }
  public SetLetterspacing(value: any): void { this.typography.SetLetterspacing(value); }
  public GetLetterspacing(): any { return this.typography.GetLetterspacing(); }
  public HasLetterspacing(): boolean { return this.typography.HasLetterspacing(); }
  public SetLineheight(value: any): void { this.typography.SetLineheight(value); }
  public GetLineheight(): any { return this.typography.GetLineheight(); }
  public HasLineheight(): boolean { return this.typography.HasLineheight(); }
  public ResetTypography(): void { this.typography.ResetTypography(); }

  // AttVoltaGroupingSym forwarding.
  public SetVoltasym(value: any): void { this.voltaGroupingSym.SetVoltasym(value); }
  public GetVoltasym(): any { return this.voltaGroupingSym.GetVoltasym(); }
  public HasVoltasym(): boolean { return this.voltaGroupingSym.HasVoltasym(); }
  public ResetVoltaGroupingSym(): void { this.voltaGroupingSym.ResetVoltaGroupingSym(); }

  // OffsetInterface forwarding.
  public SetHo(ho: number): void { this.offsetInterface.SetHo(ho); }
  public GetHo(): number { return this.offsetInterface.GetHo(); }
  public HasHo(): boolean { return this.offsetInterface.HasHo(); }
  public SetVo(vo: number): void { this.offsetInterface.SetVo(vo); }
  public GetVo(): number { return this.offsetInterface.GetVo(); }
  public HasVo(): boolean { return this.offsetInterface.HasVo(); }
}
