import { ObjectFactory, VrvObject } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';

/**
 * Pure-TypeScript translation of Verovio's SymbolTable (`<symbolTable>`) element.
 */
export class SymbolTable extends VrvObject {
  public constructor() {
    super(ClassId.SYMBOLTABLE);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
  }

  public override GetClassName(): string {
    return 'symbolTable';
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    return classId === ClassId.SYMBOLDEF;
  }

  /**
   * Disable cloning of the symbolTable (matching C++ Object *Clone() const override { return NULL; }).
   */
  public override Clone(): VrvObject {
    return null as unknown as VrvObject;
  }

  public override Accept(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitSymbolTable', this);
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitSymbolTable', this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitSymbolTableEnd', this);
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitSymbolTableEnd', this);
  }
}

function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') {
    return (fn as (arg: unknown) => FunctorCode).call(functor, self);
  }
  const fallback = method.endsWith('End') ? f.VisitObjectEnd : f.VisitObject;
  if (typeof fallback === 'function') {
    return (fallback as (arg: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('symbolTable', ClassId.SYMBOLTABLE, () => new SymbolTable());
