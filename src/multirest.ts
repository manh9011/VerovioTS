/**
 * Pure TypeScript translation of Verovio's `src/multirest.cpp` /
 * `include/vrv/multirest.h`.
 *
 * `MultiRest` models the MEI `<multiRest>` element.
 *
 * C++ multiple inheritance (LayerElement + PositionInterface + AttColor +
 * AttMultiRestVis + AttNumbered + AttNumberPlacement + AttWidth) is
 * represented through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, VrvObject } from './object.js';
import { PositionInterface } from './positioninterface.js';
import { InstColor } from './atts_shared.js';
import { InstNumberPlacement, InstNumbered } from './atts_cmn.js';
import { InstMultiRestVis } from './atts_visual.js';
import { OptionMultiRestStyle } from './options.js';
import { InstWidth } from './atts_shared.js';

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_COLOR = 109;
const ATT_MULTIRESTVIS = 273;
const ATT_NUMBERED = 29;
const ATT_NUMBERPLACEMENT = 28;
const ATT_WIDTH = 237;

// data_BOOLEAN sentinels (vrvdef.ts).
const BOOLEAN_NONE = 0;
const BOOLEAN_true = 1;
const BOOLEAN_false = 2;

/** Structural contract for the `Doc` collaborator of `UseBlockStyle`. */
export interface MultiRestDocLike {
  GetOptions(): { m_multiRestStyle: { GetValue(): number } };
}

/**
 * Pure TypeScript translation of Verovio's `MultiRest`.
 */
export class MultiRest extends LayerElement {
  // TS constructor-phase virtual Reset() dispatch adaptation (see keysig).
  private positionInterface?: PositionInterface;
  private color?: InstColor;
  private multiRestVis?: InstMultiRestVis;
  private numbered?: InstNumbered;
  private numberPlacement?: InstNumberPlacement;
  private width?: InstWidth;

  public constructor() {
    super(ClassId.MULTIREST);
    this.ensureAttributes();
    this.RegisterInterface(this.positionInterface!.GetAttClasses(), this.positionInterface!.IsInterface());
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_MULTIRESTVIS);
    this.RegisterAttClass(ATT_NUMBERED);
    this.RegisterAttClass(ATT_NUMBERPLACEMENT);
    this.RegisterAttClass(ATT_WIDTH);
    this.Reset();
  }

  private ensureAttributes(): void {
    this.positionInterface ??= new PositionInterface();
    this.color ??= new InstColor();
    this.multiRestVis ??= new InstMultiRestVis();
    this.numbered ??= new InstNumbered();
    this.numberPlacement ??= new InstNumberPlacement();
    this.width ??= new InstWidth();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.positionInterface!.Reset();
    this.color!.ResetColor();
    this.multiRestVis!.ResetMultiRestVis();
    this.numbered!.ResetNumbered();
    this.numberPlacement!.ResetNumberPlacement();
    this.width!.ResetWidth();
  }

  public override Clone(): VrvObject {
    const clone = new MultiRest();
    clone.AssignFrom(this);
    if (this.HasPloc()) clone.SetPloc(this.GetPloc());
    if (this.HasOloc()) clone.SetOloc(this.GetOloc());
    if (this.HasLoc()) clone.SetLoc(this.GetLoc());
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasBlock()) clone.SetBlock(this.GetBlock());
    if (this.HasNum()) clone.SetNum(this.GetNum());
    if (this.HasNumPlace()) clone.SetNumPlace(this.GetNumPlace());
    if (this.HasNumVisible()) clone.SetNumVisible(this.GetNumVisible());
    if (this.HasWidth()) clone.SetWidth(this.GetWidth());
    return clone;
  }

  public override GetClassName(): string { return 'multiRest'; }

  public override GetPositionInterface(): PositionInterface | null {
    this.ensureAttributes();
    return this.positionInterface!;
  }

  /** True if block style rendering applies. */
  public UseBlockStyle(doc: MultiRestDocLike): boolean {
    let useBlock = false;
    switch (doc.GetOptions().m_multiRestStyle.GetValue()) {
      case OptionMultiRestStyle.auto:
        if (this.GetNum() > 15) {
          useBlock = true;
        }
        else if (this.GetNum() > 4) {
          useBlock = (this.GetBlock() !== BOOLEAN_false);
        }
        else {
          useBlock = (this.GetBlock() === BOOLEAN_true);
        }
        break;
      case OptionMultiRestStyle.default: useBlock = (this.GetNum() > 4); break;
      case OptionMultiRestStyle.block: useBlock = (this.GetNum() > 1); break;
      case OptionMultiRestStyle.symbols: useBlock = (this.GetNum() > 30); break;
      default: // should not arrive here
        break;
    }
    return useBlock;
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitMultiRest');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitMultiRestEnd');
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

  //---------//
  // PositionInterface facade
  //---------//
  public SetPloc(value: number): void { this.positionInterface!.SetPloc(value); }
  public GetPloc(): number { return this.positionInterface!.GetPloc(); }
  public HasPloc(): boolean { return this.positionInterface!.HasPloc(); }
  public SetOloc(value: number): void { this.positionInterface!.SetOloc(value); }
  public GetOloc(): number { return this.positionInterface!.GetOloc(); }
  public HasOloc(): boolean { return this.positionInterface!.HasOloc(); }
  public SetLoc(value: number): void { this.positionInterface!.SetLoc(value); }
  public GetLoc(): number { return this.positionInterface!.GetLoc(); }
  public HasLoc(): boolean { return this.positionInterface!.HasLoc(); }
  public GetDrawingLoc(): number { return this.positionInterface!.GetDrawingLoc(); }

  //---------//
  // AttColor forwarding surface
  //---------//
  public ResetColor(): void { this.color!.ResetColor(); }
  public SetColor(value: string): void { this.color!.SetColor(value); }
  public GetColor(): string { return this.color!.GetColor(); }
  public HasColor(): boolean { return this.color!.GetColor() !== ''; }

  //---------//
  // AttMultiRestVis forwarding surface
  //---------//
  public ResetMultiRestVis(): void { this.multiRestVis!.ResetMultiRestVis(); }
  public SetBlock(value: number): void { this.multiRestVis!.SetBlock(value); }
  public GetBlock(): number { return this.multiRestVis!.GetBlock(); }
  public HasBlock(): boolean { return this.multiRestVis!.HasBlock(); }

  //---------//
  // AttNumbered forwarding surface
  //---------//
  public ResetNumbered(): void { this.numbered!.ResetNumbered(); }
  public SetNum(value: number): void { this.numbered!.SetNum(value); }
  public GetNum(): number { return this.numbered!.GetNum(); }
  public HasNum(): boolean { return this.numbered!.HasNum(); }

  //---------//
  // AttNumberPlacement forwarding surface
  //---------//
  public ResetNumberPlacement(): void { this.numberPlacement!.ResetNumberPlacement(); }
  public SetNumPlace(value: number): void { this.numberPlacement!.SetNumPlace(value); }
  public GetNumPlace(): number { return this.numberPlacement!.GetNumPlace(); }
  public HasNumPlace(): boolean { return this.numberPlacement!.HasNumPlace(); }
  public SetNumVisible(value: number): void { this.numberPlacement!.SetNumVisible(value); }
  public GetNumVisible(): number { return this.numberPlacement!.GetNumVisible(); }
  public HasNumVisible(): boolean { return this.numberPlacement!.HasNumVisible(); }

  //---------//
  // AttWidth forwarding surface
  //---------//
  public ResetWidth(): void { this.width!.ResetWidth(); }
  public SetWidth(value: unknown): void { this.width!.SetWidth(value); }
  public GetWidth(): unknown { return this.width!.GetWidth(); }
  public HasWidth(): boolean { return this.width!.HasWidth(); }
}

// Factory registration (C++ `ClassRegistrar<MultiRest> s_factory("multiRest", MULTIREST)`).
ObjectFactory.GetInstance().Register('multiRest', ClassId.MULTIREST, () => new MultiRest());
