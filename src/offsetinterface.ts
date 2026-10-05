import { AttClassId, FunctorCode, InterfaceId } from './vrvdef.js';
import { Interface } from './interface.js';

/** Pure-TS adaptation of libmei AttVisualOffsetHo. */
export class VisualOffsetHoAttributes {
  private m_ho = 0;
  public ResetVisualOffsetHo(): void { this.m_ho = 0; }
  public SetHo(value: number): void { this.m_ho = value; }
  public GetHo(): number { return this.m_ho; }
  public HasHo(): boolean { return this.m_ho !== 0; }
}

/** Pure-TS adaptation of libmei AttVisualOffsetVo. */
export class VisualOffsetVoAttributes {
  private m_vo = 0;
  public ResetVisualOffsetVo(): void { this.m_vo = 0; }
  public SetVo(value: number): void { this.m_vo = value; }
  public GetVo(): number { return this.m_vo; }
  public HasVo(): boolean { return this.m_vo !== 0; }
}

/** Pure-TS adaptation of libmei AttVisualOffset2Ho. */
export class VisualOffset2HoAttributes {
  private m_startho = 0;
  private m_endho = 0;
  public ResetVisualOffset2Ho(): void { this.m_startho = 0; this.m_endho = 0; }
  public SetStartho(value: number): void { this.m_startho = value; }
  public GetStartho(): number { return this.m_startho; }
  public HasStartho(): boolean { return this.m_startho !== 0; }
  public SetEndho(value: number): void { this.m_endho = value; }
  public GetEndho(): number { return this.m_endho; }
  public HasEndho(): boolean { return this.m_endho !== 0; }
}

/** Pure-TS adaptation of libmei AttVisualOffset2Vo. */
export class VisualOffset2VoAttributes {
  private m_startvo = 0;
  private m_endvo = 0;
  public ResetVisualOffset2Vo(): void { this.m_startvo = 0; this.m_endvo = 0; }
  public SetStartvo(value: number): void { this.m_startvo = value; }
  public GetStartvo(): number { return this.m_startvo; }
  public HasStartvo(): boolean { return this.m_startvo !== 0; }
  public SetEndvo(value: number): void { this.m_endvo = value; }
  public GetEndvo(): number { return this.m_endvo; }
  public HasEndvo(): boolean { return this.m_endvo !== 0; }
}

export interface ResetDataFunctorLike {}

export const ATT_VISUALOFFSETHO: AttClassId = 229;
export const ATT_VISUALOFFSETVO: AttClassId = 231;
export const ATT_VISUALOFFSET2HO: AttClassId = 232;
export const ATT_VISUALOFFSET2VO: AttClassId = 234;

export class OffsetInterface extends Interface {
  private readonly m_visualOffsetHo = new VisualOffsetHoAttributes();
  private readonly m_visualOffsetVo = new VisualOffsetVoAttributes();

  public constructor() {
    super();
    this.RegisterInterfaceAttClass(ATT_VISUALOFFSETHO);
    this.RegisterInterfaceAttClass(ATT_VISUALOFFSETVO);
    this.Reset();
  }

  public override Reset(): void {
    this.ResetVisualOffsetHo();
    this.ResetVisualOffsetVo();
  }

  public override IsInterface(): InterfaceId { return InterfaceId.INTERFACE_OFFSET; }

  public ResetVisualOffsetHo(): void { this.m_visualOffsetHo.ResetVisualOffsetHo(); }
  public SetHo(value: number): void { this.m_visualOffsetHo.SetHo(value); }
  public GetHo(): number { return this.m_visualOffsetHo.GetHo(); }
  public HasHo(): boolean { return this.m_visualOffsetHo.HasHo(); }
  public ResetVisualOffsetVo(): void { this.m_visualOffsetVo.ResetVisualOffsetVo(); }
  public SetVo(value: number): void { this.m_visualOffsetVo.SetVo(value); }
  public GetVo(): number { return this.m_visualOffsetVo.GetVo(); }
  public HasVo(): boolean { return this.m_visualOffsetVo.HasVo(); }

  public InterfaceResetData(_functor: ResetDataFunctorLike, _object: unknown): FunctorCode {
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

export class OffsetSpanningInterface extends Interface {
  private readonly m_visualOffset2Ho = new VisualOffset2HoAttributes();
  private readonly m_visualOffset2Vo = new VisualOffset2VoAttributes();

  public constructor() {
    super();
    this.RegisterInterfaceAttClass(ATT_VISUALOFFSET2HO);
    this.RegisterInterfaceAttClass(ATT_VISUALOFFSET2VO);
    this.Reset();
  }

  public override Reset(): void {
    this.ResetVisualOffset2Ho();
    this.ResetVisualOffset2Vo();
  }

  public override IsInterface(): InterfaceId { return InterfaceId.INTERFACE_OFFSET_SPANNING; }

  public ResetVisualOffset2Ho(): void { this.m_visualOffset2Ho.ResetVisualOffset2Ho(); }
  public SetStartho(value: number): void { this.m_visualOffset2Ho.SetStartho(value); }
  public GetStartho(): number { return this.m_visualOffset2Ho.GetStartho(); }
  public HasStartho(): boolean { return this.m_visualOffset2Ho.HasStartho(); }
  public SetEndho(value: number): void { this.m_visualOffset2Ho.SetEndho(value); }
  public GetEndho(): number { return this.m_visualOffset2Ho.GetEndho(); }
  public HasEndho(): boolean { return this.m_visualOffset2Ho.HasEndho(); }
  public ResetVisualOffset2Vo(): void { this.m_visualOffset2Vo.ResetVisualOffset2Vo(); }
  public SetStartvo(value: number): void { this.m_visualOffset2Vo.SetStartvo(value); }
  public GetStartvo(): number { return this.m_visualOffset2Vo.GetStartvo(); }
  public HasStartvo(): boolean { return this.m_visualOffset2Vo.HasStartvo(); }
  public SetEndvo(value: number): void { this.m_visualOffset2Vo.SetEndvo(value); }
  public GetEndvo(): number { return this.m_visualOffset2Vo.GetEndvo(); }
  public HasEndvo(): boolean { return this.m_visualOffset2Vo.HasEndvo(); }

  public InterfaceResetData(_functor: ResetDataFunctorLike, _object: unknown): FunctorCode {
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
