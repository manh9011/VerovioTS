/**
 * Pure TypeScript translation of Verovio's `Mdiv`
 * (`src-cpp/src/mdiv.cpp` + `src-cpp/include/vrv/mdiv.h`).
 *
 * C++ has `Mdiv` inherit `PageElement` + `VisibilityDrawingInterface` +
 * `PageMilestoneInterface` + `AttLabelled` + `AttNNumberLike`; TypeScript
 * models the multiple inheritance with composition.
 */
import { ClassId, FunctorCode, VisibilityType } from './vrvdef.js';
import { PageElement } from './pageelement.js';
import { VisibilityDrawingInterface } from './drawinginterface.js';
import { PageMilestoneInterface, PageMilestoneEnd } from './pagemilestone.js';
import { InstLabelled, InstNNumberLike } from './atts_shared.js';
import { ObjectFactory, VrvObject } from './object.js';

/** Pure TypeScript translation of Verovio's `Mdiv`. */
export class Mdiv extends PageElement {
  private visibilityDrawingInterface: VisibilityDrawingInterface | null = null;
  private pageMilestoneInterface: PageMilestoneInterface | null = null;
  private attLabelled: InstLabelled | null = null;
  private attNNumberLike: InstNNumberLike | null = null;

  public constructor() {
    super(ClassId.MDIV);
    this.ensureComponents();
    this.RegisterAttClass(ATT_LABELLED);
    this.RegisterAttClass(ATT_NNUMBERLIKE);
    this.Reset();
  }

  public override GetClassName(): string { return 'mdiv'; }

  public override Reset(): void {
    // C++ Mdiv::Reset() calls Object::Reset() (not PageElement::Reset()).
    VrvObject.prototype.Reset.call(this);
    this.visibilityDrawingInterface?.Reset();
    this.pageMilestoneInterface?.Reset();
    this.attLabelled?.ResetLabelled();
    this.attNNumberLike?.ResetNNumberLike();

    this.SetVisibility(VisibilityType.Hidden);
  }

  private ensureComponents(): void {
    this.visibilityDrawingInterface ??= new VisibilityDrawingInterface();
    this.pageMilestoneInterface ??= new PageMilestoneInterface();
    this.attLabelled ??= new InstLabelled();
    this.attNNumberLike ??= new InstNNumberLike();
  }

  //---------//
  // Children //
  //---------//

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [ClassId.MDIV, ClassId.SCORE];
    return supported.includes(classId);
  }

  /** Make this mdiv and all ancestor mdivs visible. */
  public MakeVisible(): void {
    this.SetVisibility(VisibilityType.Visible);
    const parent = this.GetParent();
    if (parent && parent.Is(ClassId.MDIV)) {
      (parent as Mdiv).MakeVisible();
    }
  }

  //--------------------------------//
  // VisibilityDrawingInterface     //
  //--------------------------------//

  public GetVisibilityDrawingInterface(): VisibilityDrawingInterface {
    this.ensureComponents();
    return this.visibilityDrawingInterface!;
  }
  public SetVisibility(visibility: VisibilityType): void {
    this.ensureComponents();
    this.visibilityDrawingInterface!.SetVisibility(visibility);
  }
  public IsHidden(): boolean {
    this.ensureComponents();
    return this.visibilityDrawingInterface!.IsHidden();
  }

  //------------------------------//
  // PageMilestoneInterface facade //
  //------------------------------//

  public GetPageMilestoneInterface(): PageMilestoneInterface | null { return this.pageMilestoneInterface; }

  public SetEnd(end: PageMilestoneEnd): void { this.pageMilestoneInterface!.SetEnd(end); }
  public GetEnd(): PageMilestoneEnd | null { return this.pageMilestoneInterface!.GetEnd(); }
  public IsPageMilestone(): boolean { return this.pageMilestoneInterface?.IsPageMilestone() ?? false; }
  /** C++ `Mdiv` inherits `PageMilestoneInterface::ConvertToPageBasedMilestone` via multiple inheritance. */
  public ConvertToPageBasedMilestone(object: VrvObject, parent: VrvObject): void {
    this.pageMilestoneInterface!.ConvertToPageBasedMilestone(object, parent);
  }

  //---------------------------//
  // Attribute facades          //
  //---------------------------//

  public ResetLabelled(): void { this.attLabelled!.ResetLabelled(); }
  public SetLabel(v: string): void { this.attLabelled!.SetLabel(v); }
  public GetLabel(): string { return this.attLabelled!.GetLabel(); }
  public HasLabel(): boolean { return this.attLabelled!.HasLabel(); }

  public ResetNNumberLike(): void { this.attNNumberLike!.ResetNNumberLike(); }
  public SetN(v: string): void { this.attNNumberLike!.SetN(v); }
  public GetN(): string { return this.attNNumberLike!.GetN(); }
  public HasN(): boolean { return this.attNNumberLike!.HasN(); }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitMdiv', this); }
  public override AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitMdivEnd', this); }

  public override Clone(): VrvObject {
    const clone = new Mdiv();
    clone.AssignFrom(this as unknown as VrvObject);
    if (this.attLabelled!.HasLabel()) clone.attLabelled!.SetLabel(this.attLabelled!.GetLabel());
    if (this.attNNumberLike!.HasN()) clone.attNNumberLike!.SetN(this.attNNumberLike!.GetN());
    clone.SetVisibility(this.IsHidden() ? VisibilityType.Hidden : VisibilityType.Visible);
    return clone;
  }
}

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_LABELLED = 145;
const ATT_NNUMBERLIKE = 168;

/** C++ FunctorInterface default forwarding helper (VisitMdiv -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('mdiv', ClassId.MDIV, () => new Mdiv());
