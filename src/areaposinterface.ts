import { Interface } from './interface.js';
import { InterfaceId } from './vrvdef.js';

// Numeric values from libmei::AttClassId; ordering matters to existing Interface users.
const ATT_HORIZONTALALIGN = 140;
const ATT_VERTICALALIGN = 226;

export enum HorizontalAlignment {
  NONE = 0,
  left,
  right,
  center,
  justify,
  MAX,
}

export enum VerticalAlignment {
  NONE = 0,
  top,
  middle,
  bottom,
  baseline,
  MAX,
}

export class AttHorizontalAlign {
  protected m_halign: HorizontalAlignment = HorizontalAlignment.NONE;
  public ResetHorizontalAlign(): void { this.m_halign = HorizontalAlignment.NONE; }
  public SetHalign(value: HorizontalAlignment): void { this.m_halign = value; }
  public GetHalign(): HorizontalAlignment { return this.m_halign; }
  public HasHalign(): boolean { return this.m_halign !== HorizontalAlignment.NONE; }
}

export class AttVerticalAlign {
  protected m_valign: VerticalAlignment = VerticalAlignment.NONE;
  public ResetVerticalAlign(): void { this.m_valign = VerticalAlignment.NONE; }
  public SetValign(value: VerticalAlignment): void { this.m_valign = value; }
  public GetValign(): VerticalAlignment { return this.m_valign; }
  public HasValign(): boolean { return this.m_valign !== VerticalAlignment.NONE; }
}

/** Pure-TS adaptation of C++ AreaPosInterface multiple inheritance. */
export class AreaPosInterface extends Interface {
  public readonly horizontalAlign = new AttHorizontalAlign();
  public readonly verticalAlign = new AttVerticalAlign();

  public constructor() {
    super();
    this.RegisterInterfaceAttClass(ATT_HORIZONTALALIGN);
    this.RegisterInterfaceAttClass(ATT_VERTICALALIGN);
    this.Reset();
  }

  public override Reset(): void {
    this.horizontalAlign.ResetHorizontalAlign();
    this.verticalAlign.ResetVerticalAlign();
  }

  public override IsInterface(): InterfaceId {
    return InterfaceId.INTERFACE_AREA_POS;
  }

  public SetHalign(value: HorizontalAlignment): void { this.horizontalAlign.SetHalign(value); }
  public GetHalign(): HorizontalAlignment { return this.horizontalAlign.GetHalign(); }
  public HasHalign(): boolean { return this.horizontalAlign.HasHalign(); }
  public SetValign(value: VerticalAlignment): void { this.verticalAlign.SetValign(value); }
  public GetValign(): VerticalAlignment { return this.verticalAlign.GetValign(); }
  public HasValign(): boolean { return this.verticalAlign.HasValign(); }
}
