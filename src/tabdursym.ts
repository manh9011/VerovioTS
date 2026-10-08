/**
 * Pure TypeScript translation of Verovio's `src/tabdursym.cpp` / `include/vrv/tabdursym.h`.
 *
 * `TabDurSym` models the MEI `<tabDurSym>` element.
 *
 * C++ multiple inheritance (LayerElement + StemmedDrawingInterface + AttNNumberLike +
 * AttStringtab + AttVisualOffsetVo) is represented through explicit composition with
 * forwarding surfaces.
 */
import { ClassId, FunctorCode, STANDARD_STEMLENGTH_TAB } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { StemmedDrawingInterface, STEMDIRECTION_up, STEMDIRECTION_down } from './drawinginterface.js';
import { InstNNumberLike, InstVisualOffsetVo } from './atts_shared.js';
import { InstStringtab } from './atts_stringtab.js';
import { ObjectFactory, VrvObject } from './object.js';
import { Point } from './devicecontextbase.js';
import { LogError } from './vrv.js';

const ATT_NNUMBERLIKE = 168;
const ATT_STRINGTAB = 241;
const ATT_VISUALOFFSETVO = 231;

/** Pure-TypeScript translation of Verovio's `TabDurSym` element. */
// ponytail: shared subclass replaces per-instance anonymous classes (see note.ts P21).
class TabDurSymStemmedDrawingInterface extends StemmedDrawingInterface {
  constructor(private owner: TabDurSym) { super(); }
  public override GetStemUpSE(_doc: any, _staffSize: number, _isCueSize: boolean): Point {
    return new Point(0, 0);
  }
  public override GetStemDownNW(_doc: any, _staffSize: number, _isCueSize: boolean): Point {
    return new Point(0, 0);
  }
  public override CalcStemLenInThirdUnits(staff: any, stemDir: number): number {
    return this.owner.CalcStemLenInThirdUnits(staff, stemDir);
  }
}

export class TabDurSym extends LayerElement {
  private stemmedDrawingInterface!: StemmedDrawingInterface;
  private nNumberLike!: InstNNumberLike;
  private stringtab!: InstStringtab;
  private visualOffsetVo!: InstVisualOffsetVo;

  public constructor() {
    super(ClassId.TABDURSYM);
    this.stemmedDrawingInterface = new TabDurSymStemmedDrawingInterface(this);

    this.nNumberLike = new InstNNumberLike();
    this.stringtab = new InstStringtab();
    this.visualOffsetVo = new InstVisualOffsetVo();

    this.RegisterAttClass(ATT_NNUMBERLIKE);
    this.RegisterAttClass(ATT_STRINGTAB);
    this.RegisterAttClass(ATT_VISUALOFFSETVO);

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.stemmedDrawingInterface ??= new TabDurSymStemmedDrawingInterface(this);
    this.nNumberLike ??= new InstNNumberLike();
    this.stringtab ??= new InstStringtab();
    this.visualOffsetVo ??= new InstVisualOffsetVo();

    this.stemmedDrawingInterface.Reset();
    this.nNumberLike.ResetNNumberLike();
    this.stringtab.ResetStringtab();
    this.visualOffsetVo.ResetVisualOffsetVo();
  }

  public override GetClassName(): string {
    return 'tabDurSym';
  }

  public override GetStemmedDrawingInterface(): any {
    return this.stemmedDrawingInterface;
  }

  // StemmedDrawingInterface facade (C++ TabDurSym inherits it directly).
  public SetDrawingStem(s: unknown): void { this.stemmedDrawingInterface.SetDrawingStem(s as never); }
  public GetDrawingStem(): unknown { return this.stemmedDrawingInterface.GetDrawingStem(); }
  public SetDrawingStemDir(d: number): void { this.stemmedDrawingInterface.SetDrawingStemDir(d); }
  public GetDrawingStemDir(): number { return this.stemmedDrawingInterface.GetDrawingStemDir(); }
  public SetDrawingStemLen(n: number): void { this.stemmedDrawingInterface.SetDrawingStemLen(n); }
  public GetDrawingStemLen(): number { return this.stemmedDrawingInterface.GetDrawingStemLen(); }
  public GetDrawingStemModRelY(): number { return this.stemmedDrawingInterface.GetDrawingStemModRelY(); }
  public GetDrawingStemStart(object?: unknown): Point { return this.stemmedDrawingInterface.GetDrawingStemStart(object as never); }
  public GetDrawingStemEnd(object?: unknown): Point { return this.stemmedDrawingInterface.GetDrawingStemEnd(object as never); }

  public override HasToBeAligned(): boolean {
    return true;
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    return classId === ClassId.STEM;
  }

  public override AddChild(child: VrvObject): boolean {
    if (!this.IsSupportedChild(child.GetClassId()) || !this.AddChildAdditionalCheck(child)) {
      LogError("Adding '%s' to a '%s'", child.GetClassName(), this.GetClassName());
      return false;
    }

    child.SetParent(this);
    const children = this.GetChildrenForModification();

    // Stem are always added by PrepareLayerElementParts and should be in front.
    if (child.Is(ClassId.STEM)) {
      children.unshift(child);
    } else {
      children.push(child);
    }
    this.Modify();

    return true;
  }

  public AdjustDrawingYRel(staff: any, doc: any): void {
    if (!staff || !doc) return;

    let yRel = (staff.m_drawingLines - 1) * doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize);

    // For stems outside add a margin to the tabDurSym - otherwise attached to the staff line
    if (staff.IsTabWithStemsOutside?.()) {
      const spacingRatio = (staff.IsTabLuteFrench?.() || staff.IsTabLuteGerman?.()) ? 2.0 : 1.0;
      yRel += doc.GetDrawingUnit(staff.m_drawingStaffSize) * spacingRatio;
    }

    this.SetDrawingYRel(-yRel);
  }

  public GetStemUpSE(_doc: any, _staffSize: number, _isCueSize: boolean): Point {
    return new Point(0, 0);
  }

  public GetStemDownNW(_doc: any, _staffSize: number, _isCueSize: boolean): Point {
    return new Point(0, 0);
  }

  public CalcStemLenInThirdUnits(staff: any, stemDir: number): number {
    if (!staff) return 0;
    if (stemDir !== STEMDIRECTION_down && stemDir !== STEMDIRECTION_up) {
      return 0;
    }

    let baseStem = STANDARD_STEMLENGTH_TAB * 3;

    // Shorter for german lute tablature to match rhythm glyphs
    if (staff.IsTabLuteGerman?.()) {
      baseStem -= 3;
    } else if (staff.IsTabGuitar?.() || staff.IsTabStaffLike?.()) {
      // One unit longer for guitar or staff-like tablature
      baseStem += 3;
    }

    // One unit longer for stems inside the staff
    if (!staff.IsTabWithStemsOutside?.()) {
      baseStem += 3;
    }

    return baseStem;
  }

  // AttNNumberLike forwarding.
  public SetN(value: any): void { this.nNumberLike.SetN(value); }
  public GetN(): any { return this.nNumberLike.GetN(); }
  public HasN(): boolean { return this.nNumberLike.HasN(); }
  public ResetNNumberLike(): void { this.nNumberLike.ResetNNumberLike(); }

  // AttStringtab forwarding.
  public SetTabFing(value: string): void { this.stringtab.SetTabFing(value); }
  public GetTabFing(): string { return this.stringtab.GetTabFing(); }
  public HasTabFing(): boolean { return this.stringtab.HasTabFing(); }
  public SetTabFret(value: number): void { this.stringtab.SetTabFret(value); }
  public GetTabFret(): number { return this.stringtab.GetTabFret(); }
  public HasTabFret(): boolean { return this.stringtab.HasTabFret(); }
  public SetTabLine(value: number): void { this.stringtab.SetTabLine(value); }
  public GetTabLine(): number { return this.stringtab.GetTabLine(); }
  public HasTabLine(): boolean { return this.stringtab.HasTabLine(); }
  public SetTabString(value: string): void { this.stringtab.SetTabString(value); }
  public GetTabString(): string { return this.stringtab.GetTabString(); }
  public HasTabString(): boolean { return this.stringtab.HasTabString(); }
  public SetTabCourse(value: number): void { this.stringtab.SetTabCourse(value); }
  public GetTabCourse(): number { return this.stringtab.GetTabCourse(); }
  public HasTabCourse(): boolean { return this.stringtab.HasTabCourse(); }
  public ResetStringtab(): void { this.stringtab.ResetStringtab(); }

  // AttVisualOffsetVo forwarding.
  public SetVo(value: any): void { this.visualOffsetVo.SetVo(value); }
  public GetVo(): any { return this.visualOffsetVo.GetVo(); }
  public HasVo(): boolean { return this.visualOffsetVo.HasVo(); }
  public ResetVisualOffsetVo(): void { this.visualOffsetVo.ResetVisualOffsetVo(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTabDurSym');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTabDurSym');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTabDurSymEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTabDurSymEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitLayerElement === 'function') return functor.VisitLayerElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): TabDurSym {
    const clone = new TabDurSym();
    clone.AssignFrom(this);
    if (this.HasN()) clone.SetN(this.GetN());
    if (this.HasTabFing()) clone.SetTabFing(this.GetTabFing());
    if (this.HasTabFret()) clone.SetTabFret(this.GetTabFret());
    if (this.HasTabLine()) clone.SetTabLine(this.GetTabLine());
    if (this.HasTabString()) clone.SetTabString(this.GetTabString());
    if (this.HasTabCourse()) clone.SetTabCourse(this.GetTabCourse());
    if (this.HasVo()) clone.SetVo(this.GetVo());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('tabDurSym', ClassId.TABDURSYM, () => new TabDurSym());
