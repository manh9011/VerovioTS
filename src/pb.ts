/**
 * Pure TypeScript translation of Verovio's `src/pb.cpp` / `include/vrv/pb.h`.
 *
 * `Pb` represents an MEI `<pb>` (page break) element in score-based MEI.
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

/** Pure TypeScript translation of Verovio's `Pb` element. */
export class Pb extends SystemElement {
  private facsimileInterface: FacsimileInterface | null = null;
  private attNNumberLike: InstNNumberLike | null = null;

  public constructor() {
    super(ClassId.PB);
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
    return 'pb';
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
    return this.visit(functor, 'VisitPb');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitPb');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitPbEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitPbEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Pb {
    const clone = new Pb();
    clone.AssignFrom(this);
    if (this.HasFacs()) clone.SetFacs(this.GetFacs());
    if (this.HasN()) clone.SetN(this.GetN());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('pb', ClassId.PB, () => new Pb());
