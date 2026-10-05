import { ExtractIDFragment } from './vrv.js';
import { AttClassId, FunctorCode, InterfaceId } from './vrvdef.js';
import { Interface } from './interface.js';

/** Pure-TS adaptation of libmei::AttPlist. */
export class PlistAttributes {
  private m_plist: string[] = [];

  public ResetPlist(): void { this.m_plist = []; }
  public SetPlist(plist: readonly string[]): void { this.m_plist = [...plist]; }
  public GetPlist(): string[] { return [...this.m_plist]; }
  public HasPlist(): boolean { return this.m_plist.length > 0; }
}

export interface PlistObjectLike { readonly __plistObjectBrand?: never; }

/** Structural stand-in for Verovio's const Object* / Object*. */
export interface PlistObjectRef extends PlistObjectLike {}
export interface PreparePlistFunctorLike {
  IsProcessingData(): boolean;
  InsertInterfaceObjectIDPair(object: PlistObjectLike, id: string): void;
}
export interface ResetDataFunctorLike {}

export const ATT_PLIST: AttClassId = 187;

/** Pure-TypeScript translation of Verovio's PlistInterface. */
export class PlistInterface extends Interface {
  private readonly m_plistAttributes = new PlistAttributes();
  private m_references: readonly PlistObjectLike[] = [];
  private m_ids: string[] = [];

  public constructor() {
    super();
    this.RegisterInterfaceAttClass(ATT_PLIST);
    this.Reset();
  }

  public override Reset(): void {
    this.ResetPlist();
  }

  public override IsInterface(): InterfaceId { return InterfaceId.INTERFACE_PLIST; }

  public ResetPlist(): void {
    this.m_plistAttributes.ResetPlist();
  }
  public SetPlist(plist: readonly string[]): void { this.m_plistAttributes.SetPlist(plist); }
  public GetPlist(): string[] { return this.m_plistAttributes.GetPlist(); }
  public HasPlist(): boolean { return this.m_plistAttributes.HasPlist(); }

  public AddRef(ref: string): void {
    const references = this.GetPlist();
    if (!references.includes(ref)) {
      references.push(ref);
      this.SetPlist(references);
    }
  }

  public AddRefAllowDuplicate(ref: string): void {
    const references = this.GetPlist();
    references.push(ref);
    this.SetPlist(references);
  }

  /** Child classes may override the C++ virtual validator. */
  protected IsValidRef(_ref: PlistObjectLike): boolean { return true; }

  public SetRef(ref: PlistObjectLike): void {
    if (!this.IsValidRef(ref)) return;
    if (!this.m_references.includes(ref)) {
      this.m_references = [...this.m_references, ref];
    }
  }

  public GetRefs(): PlistObjectLike[] {
    return [...this.m_references];
  }

  public GetConstRefs(): readonly PlistObjectLike[] {
    return this.m_references;
  }

  protected SetIDStrs(): void {
    if (this.m_ids.length !== 0 || this.m_references.length !== 0) {
      throw new Error('PlistInterface::SetIDStrs requires empty id/reference state');
    }

    const list = this.GetPlist();
    for (const uri of list) {
      const id = ExtractIDFragment(uri);
      if (id.length > 0) {
        this.m_ids.push(id);
      } else {
        // C++ logs an error and continues. Keep observable control flow.
        continue;
      }
    }
  }

  public InterfacePreparePlist(functor: PreparePlistFunctorLike, object: PlistObjectLike): FunctorCode {
    if (functor.IsProcessingData()) return FunctorCode.FUNCTOR_CONTINUE;

    this.SetIDStrs();
    for (const id of this.m_ids) {
      functor.InsertInterfaceObjectIDPair(object, id);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public InterfaceResetData(_functor: ResetDataFunctorLike, _object: PlistObjectLike): FunctorCode {
    this.m_ids = [];
    this.m_references = [];
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
