/**
 * Pure-TypeScript translation of Verovio's `src/barline.cpp` / `include/vrv/barline.h`.
 *
 * The C++ class uses multiple inheritance for generated libMEI attribute classes.
 * TypeScript keeps the same observable surface through composed attribute objects
 * and delegates, while LayerElement remains the runtime tree base.
 */
import { ObjectFactory, VrvObject } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement, type AlignmentLike } from './layerelement.js';
import {
  AttBarLineLog,
  AttNNumberLike,
  AttColor,
} from './atts_shared.js';
import { AttBarLineVis } from './atts_visual.js';
import { AttVisibility } from './atts_shared.js';

export enum BarLinePosition { None, Left, Right }

export interface BarLineAlignmentLike {
  GetXRel(): number;
  FindAllDescendantsByType(classId: number, continueDepthSearchForMatches?: boolean, deepness?: number): unknown[];
  AddLayerElementRef(element: BarLine): boolean;
}

export interface BarLineBarringLike {
  HasAttClass?(attClassId: number): boolean;
  HasBarLen?(): boolean;
  GetBarLen?(): number;
  HasBarMethod?(): boolean;
  GetBarMethod?(): number;
  HasBarPlace?(): boolean;
  GetBarPlace?(): number;
}

export interface BarLineStaffGrpLike extends VrvObject {
  HasBarThru(): boolean;
  GetBarThru(): number;
}

interface BarLineFunctorLike {
  VisitBarLine(barLine: BarLine): FunctorCode;
  VisitBarLineEnd(barLine: BarLine): FunctorCode;
}

const ATT_BARLINELOG = 99;
const ATT_COLOR = 109;
const ATT_NNUMBERLIKE = 168;
const ATT_VISIBILITY = 228;
const ATT_BARLINEVIS = 250;
const ATT_BARRING = 100;
const BOOLEAN_true = 1;
const BARMETHOD_NONE = 0;

function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** MEI `<barLine>` element. */
export class BarLine extends LayerElement {
  private attBarLineLog?: AttBarLineLog;
  private attBarLineVis?: AttBarLineVis;
  private attColor?: AttColor;
  private attNNumberLike?: AttNNumberLike;
  private attVisibility?: AttVisibility;

  protected m_alignment: AlignmentLike | null = null;
  private m_position = BarLinePosition.None;

  public constructor(classId: ClassId = ClassId.BARLINE) {
    super(classId);
    this.RegisterAttClass(ATT_BARLINELOG);
    this.RegisterAttClass(ATT_BARLINEVIS);
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_VISIBILITY);
    this.attBarLineLog = new (class extends AttBarLineLog {})();
    this.attBarLineVis = new (class extends AttBarLineVis {})();
    this.attColor = new (class extends AttColor {})();
    this.attNNumberLike = new (class extends AttNNumberLike {})();
    this.attVisibility = new (class extends AttVisibility {})();
    this.Reset();
  }

  public override Clone(): VrvObject {
    const clone = new BarLine(this.GetClassId() as ClassId);
    clone.AssignFrom(this);
    clone.SetPosition(this.m_position);
    return clone;
  }

  public override Reset(): void {
    super.Reset();
    this.attBarLineLog?.ResetBarLineLog();
    this.attBarLineVis?.ResetBarLineVis();
    this.attColor?.ResetColor();
    this.attVisibility?.ResetVisibility();
    this.m_position = BarLinePosition.None;
  }

  public override GetClassName(): string { return 'barLine'; }
  public override HasToBeAligned(): boolean { return true; }

  public override SetAlignment(alignment: AlignmentLike): boolean {
    this.m_alignment = alignment;
    return (this.m_alignment as AlignmentLike & { AddLayerElementRef(el: BarLine): boolean }).AddLayerElementRef(this);
  }

  public HasRepetitionDots(): boolean {
    const form = this.GetForm();
    return form === this.barrendition('rptstart')
      || form === this.barrendition('rptend')
      || form === this.barrendition('rptboth');
  }

  public GetPosition(): BarLinePosition { return this.m_position; }
  public SetPosition(position: BarLinePosition): void { this.m_position = position; }

  public IsDrawnThrough(staffGrp: BarLineStaffGrpLike | null): boolean {
    let current: VrvObject | null = staffGrp;
    while (current) {
      const candidate = current as unknown as Partial<BarLineStaffGrpLike>;
      if (typeof candidate.HasBarThru === 'function' && candidate.HasBarThru()) {
        return candidate.GetBarThru?.() === BOOLEAN_true;
      }
      current = current.GetParent();
    }
    return false;
  }

  public GetLengthFromContext(staffDef: BarLineBarringLike | null): [boolean, number] {
    const measure = this.GetParent() as unknown as BarLineBarringLike | null;
    if (measure && typeof measure.HasBarLen === 'function' && measure.HasBarLen()) {
      return [true, measure.GetBarLen!()];
    }

    let object: (VrvObject & BarLineBarringLike) | null = staffDef as (VrvObject & BarLineBarringLike) | null;
    while (object) {
      if (object.HasAttClass?.(ATT_BARRING)) {
        assertInvariant(typeof object.GetBarLen === 'function' && typeof object.HasBarLen === 'function',
          'ATT_BARRING object must expose AttBarring accessors');
        if (object.HasBarLen()) return [true, object.GetBarLen!()];
      }
      if (object.Is(ClassId.SCOREDEF)) break;
      object = object.GetParent() as (VrvObject & BarLineBarringLike) | null;
    }
    return [false, 0.0];
  }

  public GetMethodFromContext(staffDef: BarLineBarringLike | null): [boolean, number] {
    const measure = this.GetParent() as unknown as BarLineBarringLike | null;
    if (measure && typeof measure.HasBarMethod === 'function' && measure.HasBarMethod()) {
      return [true, measure.GetBarMethod!()];
    }

    let object: (VrvObject & BarLineBarringLike) | null = staffDef as (VrvObject & BarLineBarringLike) | null;
    while (object) {
      if (object.HasAttClass?.(ATT_BARRING)) {
        assertInvariant(typeof object.GetBarMethod === 'function' && typeof object.HasBarMethod === 'function',
          'ATT_BARRING object must expose AttBarring accessors');
        if (object.HasBarMethod()) return [true, object.GetBarMethod!()];
      }
      if (object.Is(ClassId.SCOREDEF)) break;
      object = object.GetParent() as (VrvObject & BarLineBarringLike) | null;
    }
    return [false, BARMETHOD_NONE];
  }

  public GetPlaceFromContext(staffDef: BarLineBarringLike | null): [boolean, number] {
    const measure = this.GetParent() as unknown as BarLineBarringLike | null;
    if (measure && typeof measure.HasBarPlace === 'function' && measure.HasBarPlace()) {
      return [true, measure.GetBarPlace!()];
    }

    let object: (VrvObject & BarLineBarringLike) | null = staffDef as (VrvObject & BarLineBarringLike) | null;
    while (object) {
      if (object.HasAttClass?.(ATT_BARRING)) {
        assertInvariant(typeof object.GetBarPlace === 'function' && typeof object.HasBarPlace === 'function',
          'ATT_BARRING object must expose AttBarring accessors');
        if (object.HasBarPlace()) return [true, object.GetBarPlace!()];
      }
      if (object.Is(ClassId.SCOREDEF)) break;
      object = object.GetParent() as (VrvObject & BarLineBarringLike) | null;
    }
    return [false, 0];
  }

  // Generated-attribute delegates: preserve the C++ public mixin API.
  public ResetBarLineLog(): void { this.attBarLineLog!.ResetBarLineLog(); }
  public SetForm(value: number): void { this.attBarLineLog!.SetForm(value); }
  public GetForm(): number { return this.attBarLineLog!.GetForm(); }
  public HasForm(): boolean { return this.attBarLineLog!.HasForm(); }

  public ResetBarLineVis(): void { this.attBarLineVis!.ResetBarLineVis(); }
  public SetLen(value: number): void { this.attBarLineVis!.SetLen(value); }
  public GetLen(): number { return this.attBarLineVis!.GetLen(); }
  public HasLen(): boolean { return this.attBarLineVis!.HasLen(); }
  public SetMethod(value: number): void { this.attBarLineVis!.SetMethod(value); }
  public GetMethod(): number { return this.attBarLineVis!.GetMethod(); }
  public HasMethod(): boolean { return this.attBarLineVis!.HasMethod(); }
  public SetPlace(value: number): void { this.attBarLineVis!.SetPlace(value); }
  public GetPlace(): number { return this.attBarLineVis!.GetPlace(); }
  public HasPlace(): boolean { return this.attBarLineVis!.HasPlace(); }

  public ResetColor(): void { this.attColor!.ResetColor(); }
  public SetColor(value: string): void { this.attColor!.SetColor(value); }
  public GetColor(): string { return this.attColor!.GetColor(); }
  public HasColor(): boolean { return this.attColor!.HasColor(); }

  public ResetNNumberLike(): void { this.attNNumberLike!.ResetNNumberLike(); }
  public SetN(value: string): void { this.attNNumberLike!.SetN(value); }
  public GetN(): string { return this.attNNumberLike!.GetN(); }
  public HasN(): boolean { return this.attNNumberLike!.HasN(); }

  public ResetVisibility(): void { this.attVisibility!.ResetVisibility(); }
  public SetVisible(value: number): void { this.attVisibility!.SetVisible(value); }
  public GetVisible(): number { return this.attVisibility!.GetVisible(); }
  public HasVisible(): boolean { return this.attVisibility!.HasVisible(); }

  public override Accept(functor: any): FunctorCode {
    return (functor as BarLineFunctorLike).VisitBarLine(this);
  }

  public AcceptConst(functor: any): FunctorCode {
    return (functor as BarLineFunctorLike).VisitBarLine(this);
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return (functor as BarLineFunctorLike).VisitBarLineEnd(this);
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return (functor as BarLineFunctorLike).VisitBarLineEnd(this);
  }

  private barrendition(name: 'rptstart' | 'rptend' | 'rptboth'): number {
    // Canonical generated converter ordinals are resolved by the attribute layer.
    // Keep the comparison data-driven without introducing a second enum table.
    const probe = new (class extends AttBarLineLog {})();
    const converter = (probe as unknown as { StrToBarrendition(value: string): number }).StrToBarrendition.bind(probe);
    return converter(name);
  }
}

ObjectFactory.GetInstance().Register('barLine', ClassId.BARLINE, () => new BarLine());
