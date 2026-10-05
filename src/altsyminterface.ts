import { ExtractIDFragment } from './vrv.js';
import { AttClassId, ClassId, FunctorCode, InterfaceId } from './vrvdef.js';
import { Interface } from './interface.js';

/** Minimal pure-TS translation of libmei::AttAltSym consumed by AltSymInterface. */
export class AltSymAttributes {
  private m_altsym = '';

  public ResetAltSym(): void { this.m_altsym = ''; }
  public SetAltsym(altsym: string): void { this.m_altsym = altsym; }
  public GetAltsym(): string { return this.m_altsym; }
  public HasAltsym(): boolean { return this.m_altsym !== ''; }
}

export interface SymbolDefLike {
  Is(classId: number): boolean;
}

export interface SymbolTableLike {
  FindDescendantByID(id: string): SymbolDefLike | null;
}

export interface PrepareAltSymFunctorLike {
  GetSymbolTable(): SymbolTableLike | null;
}

export interface ResetDataFunctorLike {}

/**
 * Pure-TypeScript translation of Verovio's AltSymInterface.
 * C++ multiple inheritance (Interface + AttAltSym) is represented by
 * explicit attribute state while retaining the public AttAltSym methods.
 */
export class AltSymInterface extends Interface {
  public static readonly ATT_ALTSYM: AttClassId = 244;
  private readonly m_altSymAttributes = new AltSymAttributes();
  private m_symbolDef: SymbolDefLike | null = null;
  private m_symbolDefID = '';

  public constructor() {
    super();
    this.RegisterInterfaceAttClass(AltSymInterface.ATT_ALTSYM);
    this.Reset();
  }

  public override Reset(): void {
    this.ResetAltSym();
    this.m_symbolDef = null;
    this.m_symbolDefID = '';
  }

  public override IsInterface(): InterfaceId {
    return InterfaceId.INTERFACE_ALT_SYM;
  }

  public ResetAltSym(): void { this.m_altSymAttributes.ResetAltSym(); }
  public SetAltsym(value: string): void { this.m_altSymAttributes.SetAltsym(value); }
  public GetAltsym(): string { return this.m_altSymAttributes.GetAltsym(); }
  public HasAltsym(): boolean { return this.m_altSymAttributes.HasAltsym(); }

  public SetAltSymbolDef(symbolDef: SymbolDefLike): void {
    if (this.m_symbolDef !== null) throw new Error('Alt symbol definition already set');
    this.m_symbolDef = symbolDef;
  }

  public GetAltSymbolDef(): SymbolDefLike | null { return this.m_symbolDef; }
  public HasAltSymbolDef(): boolean { return this.m_symbolDef !== null; }

  protected SetIDStr(): void {
    if (this.HasAltsym()) this.m_symbolDefID = ExtractIDFragment(this.GetAltsym());
  }

  public InterfacePrepareAltSym(functor: PrepareAltSymFunctorLike, _object: unknown): FunctorCode {
    this.SetIDStr();
    if (this.m_symbolDefID.length > 0) {
      let symbolDef: SymbolDefLike | null = null;
      const symbolTable = functor.GetSymbolTable();
      if (symbolTable) symbolDef = symbolTable.FindDescendantByID(this.m_symbolDefID);
      if (!symbolDef || !symbolDef.Is(ClassId.SYMBOLDEF)) {
        return FunctorCode.FUNCTOR_CONTINUE;
      }
      this.m_symbolDef = symbolDef;
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public InterfaceResetData(_functor: ResetDataFunctorLike, _object: unknown): FunctorCode {
    this.m_symbolDef = null;
    this.m_symbolDefID = '';
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
