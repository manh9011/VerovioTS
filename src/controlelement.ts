/**
 * Pure TypeScript translation of Verovio's `src/controlelement.cpp` / `include/vrv/controlelement.h`.
 *
 * C++ multiple inheritance (FloatingObject + AltSymInterface + LinkingInterface +
 * OffsetInterface + AttColor + AttLabelled + AttTyped) is represented through
 * composed interface/attribute components with the same registration order,
 * reset order, and public forwarding surface. No factory registration exists
 * in C++ for this base class ("should not be instantiated directly").
 */
import { FloatingObject } from './floatingobject.js';
import { VrvObject } from './object.js';
import { InstColor, InstLabelled, InstTyped } from './atts_shared.js';
import { AltSymInterface } from './altsyminterface.js';
import { LinkingInterface } from './linkinginterface.js';
import { OffsetInterface } from './offsetinterface.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { STAFFREL_above, STAFFREL_below } from './vrvdef.js';

const ATT_COLOR = 109;
const ATT_LABELLED = 145;
const ATT_TYPED = 224;

// data_HORIZONTALALIGNMENT ordinals from the converter layer.
const HORIZONTALALIGNMENT_NONE = 0;

const STEMDIRECTION_NONE = 0;
const STEMDIRECTION_up = 1;
const STEMDIRECTION_down = 2;

interface RendLike {
  HasHalign?(): boolean;
  GetHalign?(): number;
}

interface StartLike {
  Is(classId: number): boolean;
  GetFirstAncestor(classId: number, maxDepth?: number): unknown;
  m_crossLayer?: { GetDrawingStemDir?(element: unknown): number } | null;
  IsChordTone?(): { GetTopNote?(): unknown; GetBottomNote?(): unknown } | null;
}

interface LayerLike {
  GetDrawingStemDir?(element: unknown): number;
}

interface ControlElementFunctorLike {
  VisitControlElement(controlElement: ControlElement): FunctorCode;
  VisitControlElementEnd(controlElement: ControlElement): FunctorCode;
}

function visit(functor: unknown, method: string, self: unknown): FunctorCode {
  const fn = (functor as Record<string, unknown>)[method];
  if (typeof fn !== 'function') return FunctorCode.FUNCTOR_CONTINUE;
  const result = (fn as (value: unknown) => FunctorCode).call(functor, self);
  return result ?? FunctorCode.FUNCTOR_CONTINUE;
}

export class ControlElement extends FloatingObject {
  protected altSymInterface?: AltSymInterface;
  protected linkingInterface?: LinkingInterface;
  protected offsetInterface?: OffsetInterface;
  protected attColor?: InstColor;
  protected attLabelled?: InstLabelled;
  protected typed?: InstTyped;

  public constructor(classId: ClassId = ClassId.CONTROL_ELEMENT) {
    super(classId);
    // The second C++ constructor omits OffsetInterface/AttColor from its
    // initializer list but still registers them; TS constructs all components
    // so the runtime shape matches the registered surface.
    this.altSymInterface = new AltSymInterface();
    this.linkingInterface = new LinkingInterface();
    this.offsetInterface = new OffsetInterface();
    this.attColor = new InstColor();
    this.attLabelled = new InstLabelled();
    this.typed = new InstTyped();
    this.RegisterInterface(this.altSymInterface.GetAttClasses(), this.altSymInterface.IsInterface());
    this.RegisterInterface(this.linkingInterface.GetAttClasses(), this.linkingInterface.IsInterface());
    this.RegisterInterface(this.offsetInterface.GetAttClasses(), this.offsetInterface.IsInterface());
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_LABELLED);
    this.RegisterAttClass(ATT_TYPED);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.altSymInterface?.Reset();
    this.linkingInterface?.Reset();
    this.offsetInterface?.Reset();
    this.attColor?.ResetColor();
    this.attLabelled?.ResetLabelled();
    this.typed?.ResetTyped();
  }

  // C++ interface getter overrides.
  public override GetAltSymInterface(): AltSymInterface { return this.altSymInterface!; }

  // AltSymInterface facade (C++ ControlElement inherits AltSymInterface).
  public SetAltsym(v: string): void { this.altSymInterface!.SetAltsym(v); }
  public GetAltsym(): string { return this.altSymInterface!.GetAltsym(); }
  public HasAltsym(): boolean { return this.altSymInterface!.HasAltsym(); }
  public SetAltSymbolDef(v: unknown): void { this.altSymInterface!.SetAltSymbolDef(v as never); }
  public GetAltSymbolDef(): unknown { return this.altSymInterface!.GetAltSymbolDef(); }
  public HasAltSymbolDef(): boolean { return this.altSymInterface!.HasAltSymbolDef(); }
  public override GetLinkingInterface(): LinkingInterface { return this.linkingInterface!; }
  // C++ ControlElement inherits LinkingInterface, so callers use element->
  // GetNextLink() directly (view_control.cpp:1248-1262). Forward to composition.
  public GetNextLink(): unknown { return this.linkingInterface!.GetNextLink(); }
  public HasNextLink(): boolean { return this.linkingInterface!.HasNextLink(); }
  public override GetOffsetInterface(): OffsetInterface { return this.offsetInterface!; }

  // C++ AttColor forwarding surface.
  public ResetColor(): void { this.attColor!.ResetColor(); }
  public SetColor(color: string): void { this.attColor!.SetColor(color); }
  public GetColor(): string { return this.attColor!.GetColor() as string; }
  public HasColor(): boolean { return this.attColor!.HasColor(); }

  // C++ AttLabelled forwarding surface.
  public ResetLabelled(): void { this.attLabelled!.ResetLabelled(); }
  public SetLabel(label: string): void { this.attLabelled!.SetLabel(label); }
  public GetLabel(): string { return this.attLabelled!.GetLabel() as string; }
  public HasLabel(): boolean { return this.attLabelled!.HasLabel(); }

  // C++ AttTyped forwarding surface.
  public ResetTyped(): void { this.typed!.ResetTyped(); }
  public SetType(type: string): void { this.typed!.SetType(type); }
  public GetType(): string { return this.typed!.GetType() as string; }
  public HasType(): boolean { return this.typed!.HasType(); }

  public GetChildRendAlignment(): number {
    const rend = this.FindDescendantByType(ClassId.REND) as RendLike | null;
    if (!rend || !rend.HasHalign || !rend.HasHalign()) return HORIZONTALALIGNMENT_NONE;
    return rend.GetHalign ? rend.GetHalign() : HORIZONTALALIGNMENT_NONE;
  }

  public GetLayerPlace(defaultValue: number): number {
    // Do this only for the following elements
    if (!this.IsAnyOf([ClassId.TRILL, ClassId.MORDENT, ClassId.ORNAM, ClassId.REPEATMARK, ClassId.TURN])) {
      return defaultValue;
    }

    const timePointInterface = this.GetTimePointInterface() as { GetStart(): StartLike | null } | null;
    if (!timePointInterface) throw new Error('ControlElement::GetLayerPlace requires a TimePointInterface.');
    const start = timePointInterface.GetStart();
    if (!start || start.Is(ClassId.TIMESTAMP_ATTR)) return defaultValue;

    let layer = start.GetFirstAncestor(ClassId.LAYER) as LayerLike | null;
    // We are only checking that the element is cross-staff; keep the same
    // override path as C++ LayerElement::m_crossLayer.
    if (start.m_crossLayer) layer = start.m_crossLayer;
    if (!layer) throw new Error('ControlElement::GetLayerPlace requires a Layer ancestor.');

    let value = defaultValue;

    const stemDir = layer.GetDrawingStemDir ? layer.GetDrawingStemDir(start) : STEMDIRECTION_NONE;
    switch (stemDir) {
      case STEMDIRECTION_up: value = STAFFREL_above; break;
      case STEMDIRECTION_down: value = STAFFREL_below; break;
      default: break;
    }

    // For ornaments pointing to notes in a chord, make the top and bottom one
    // placed above and below respectively.
    if (stemDir === STEMDIRECTION_NONE && start.Is(ClassId.NOTE)) {
      const chord = start.IsChordTone ? start.IsChordTone() : null;
      if (chord) {
        if (start === chord.GetTopNote?.()) value = STAFFREL_above;
        if (start === chord.GetBottomNote?.()) value = STAFFREL_below;
      }
    }

    return value;
  }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitControlElement', this);
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitControlElement', this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitControlElementEnd', this);
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitControlElementEnd', this);
  }
}
