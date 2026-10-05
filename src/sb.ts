/**
 * Pure TypeScript translation of Verovio's `src/sb.cpp` / `include/vrv/sb.h`.
 *
 * `Sb` represents an MEI `<sb>` (system break) element in score-based MEI.
 * C++ multiple inheritance (SystemElement + FacsimileInterface + AttNNumberLike)
 * is represented through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory } from './object.js';
import { SystemElement } from './systemelement.js';
import { FacsimileInterface } from './facsimileinterface.js';
import { InstNNumberLike } from './atts_shared.js';

// Canonical libmei att-class ordinals (libmei/dist/attclasses.h).
const ATT_NNUMBERLIKE = 168;

/** Pure TypeScript translation of Verovio's `Sb` element. */
export class Sb extends SystemElement {
  private facsimileInterface: FacsimileInterface | null = null;
  private attNNumberLike: InstNNumberLike | null = null;

  public constructor() {
    super(ClassId.SB);
    this.facsimileInterface = new FacsimileInterface();
    this.attNNumberLike = new InstNNumberLike();

    this.RegisterAttClass(ATT_NNUMBERLIKE);
    this.RegisterInterface(this.facsimileInterface.GetAttClasses(), this.facsimileInterface.IsInterface());

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.facsimileInterface ??= new FacsimileInterface();
    this.attNNumberLike ??= new InstNNumberLike();

    this.facsimileInterface.Reset();
    this.attNNumberLike.ResetNNumberLike();
  }

  public override GetClassName(): string {
    return 'sb';
  }

  public override GetFacsimileInterface(): FacsimileInterface {
    this.facsimileInterface ??= new FacsimileInterface();
    return this.facsimileInterface;
  }

  // FacsimileInterface forwarding.
  public SetFacs(facs: string): void { this.GetFacsimileInterface().SetFacs(facs); }
  public GetFacs(): string { return this.GetFacsimileInterface().GetFacs(); }
  public HasFacs(): boolean { return this.GetFacsimileInterface().HasFacs(); }
  public ResetFacsimile(): void { this.GetFacsimileInterface().ResetFacsimile(); }

  // AttNNumberLike forwarding.
  public SetN(n: any): void { this.attNNumberLike!.SetN(n); }
  public GetN(): any { return this.attNNumberLike!.GetN(); }
  public HasN(): boolean { return this.attNNumberLike!.HasN(); }
  public ResetNNumberLike(): void { this.attNNumberLike!.ResetNNumberLike(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSb');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSb');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSbEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSbEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Sb {
    const clone = new Sb();
    clone.AssignFrom(this);
    if (this.HasFacs()) clone.SetFacs(this.GetFacs());
    if (this.HasN()) clone.SetN(this.GetN());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('sb', ClassId.SB, () => new Sb());
