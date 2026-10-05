/**
 * Pure TypeScript translation of Verovio's `src/quilisma.cpp` / `include/vrv/quilisma.h`.
 *
 * `Quilisma` models a neume component element `<quilisma>`.
 *
 * C++ multiple inheritance (LayerElement + OffsetInterface + PitchInterface +
 * PositionInterface + AttColor) is represented through explicit composition
 * with forwarding surfaces.
 */
import { ClassId } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { OffsetInterface } from './offsetinterface.js';
import { PitchInterface, data_OCTAVE, data_PITCHNAME } from './pitchinterface.js';
import { PositionInterface } from './positioninterface.js';
import { InstColor } from './atts_shared.js';
import { ObjectFactory } from './object.js';

const ATT_COLOR = 109;

/** Pure-TypeScript translation of Verovio's `Quilisma` element. */
export class Quilisma extends LayerElement {
  private offsetInterface!: OffsetInterface;
  private pitchInterface!: PitchInterface;
  private positionInterface!: PositionInterface;
  private color!: InstColor;

  public constructor() {
    super(ClassId.QUILISMA);
    this.offsetInterface = new OffsetInterface();
    this.pitchInterface = new PitchInterface();
    this.positionInterface = new PositionInterface();
    this.color = new InstColor();

    this.RegisterInterface(this.offsetInterface.GetAttClasses(), this.offsetInterface.IsInterface());
    this.RegisterInterface(this.pitchInterface.GetAttClasses(), this.pitchInterface.IsInterface());
    this.RegisterInterface(this.positionInterface.GetAttClasses(), this.positionInterface.IsInterface());
    this.RegisterAttClass(ATT_COLOR);

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.offsetInterface ??= new OffsetInterface();
    this.pitchInterface ??= new PitchInterface();
    this.positionInterface ??= new PositionInterface();
    this.color ??= new InstColor();

    this.offsetInterface.Reset();
    this.pitchInterface.Reset();
    this.positionInterface.Reset();
    this.color.ResetColor();
  }

  public override GetClassName(): string {
    return 'quilisma';
  }

  public override GetOffsetInterface(): OffsetInterface {
    return this.offsetInterface;
  }

  public override GetPitchInterface(): PitchInterface {
    return this.pitchInterface;
  }

  public override GetPositionInterface(): PositionInterface {
    return this.positionInterface;
  }

  public override HasToBeAligned(): boolean {
    return true;
  }

  // AttColor forwarding.
  public SetColor(value: any): void { this.color.SetColor(value); }
  public GetColor(): any { return this.color.GetColor(); }
  public HasColor(): boolean { return this.color.HasColor(); }
  public ResetColor(): void { this.color.ResetColor(); }

  // PitchInterface forwarding.
  public SetPname(pname: data_PITCHNAME): void { this.pitchInterface.SetPname(pname); }
  public GetPname(): data_PITCHNAME { return this.pitchInterface.GetPname(); }
  public HasPname(): boolean { return this.pitchInterface.HasPname(); }
  public SetOct(oct: data_OCTAVE): void { this.pitchInterface.SetOct(oct); }
  public GetOct(): data_OCTAVE { return this.pitchInterface.GetOct(); }
  public HasOct(): boolean { return this.pitchInterface.HasOct(); }

  // PositionInterface forwarding.
  public SetLoc(loc: number): void { this.positionInterface.SetLoc(loc); }
  public GetLoc(): number { return this.positionInterface.GetLoc(); }
  public HasLoc(): boolean { return this.positionInterface.HasLoc(); }

  // OffsetInterface forwarding.
  public SetHo(ho: number): void { this.offsetInterface.SetHo(ho); }
  public GetHo(): number { return this.offsetInterface.GetHo(); }
  public HasHo(): boolean { return this.offsetInterface.HasHo(); }
  public SetVo(vo: number): void { this.offsetInterface.SetVo(vo); }
  public GetVo(): number { return this.offsetInterface.GetVo(); }
  public HasVo(): boolean { return this.offsetInterface.HasVo(); }

  public override Clone(): Quilisma {
    const clone = new Quilisma();
    clone.AssignFrom(this);
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasPname()) clone.SetPname(this.GetPname());
    if (this.HasOct()) clone.SetOct(this.GetOct());
    if (this.HasLoc()) clone.SetLoc(this.GetLoc());
    if (this.HasHo()) clone.SetHo(this.GetHo());
    if (this.HasVo()) clone.SetVo(this.GetVo());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('quilisma', ClassId.QUILISMA, () => new Quilisma());
