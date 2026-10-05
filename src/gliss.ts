/**
 * Pure TypeScript translation of Verovio's `src/gliss.cpp` / `include/vrv/gliss.h`.
 *
 * `Gliss` is the MEI `<gliss>` (glissando) control element. C++ multiple inheritance
 * (ControlElement + TimeSpanningInterface + AttLineRend + AttLineRendBase + AttNNumberLike)
 * is represented through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory } from './object.js';
import { ControlElement } from './controlelement.js';
import { TimePointInterface, TimeSpanningInterface } from './timeinterface.js';
import { InstLineRend, InstLineRendBase, InstNNumberLike } from './atts_shared.js';

// Canonical libmei att-class ordinals (libmei/dist/attclasses.h).
const ATT_LINEREND = 150;
const ATT_LINERENDBASE = 151;
const ATT_NNUMBERLIKE = 168;

/** Pure TypeScript translation of Verovio's `Gliss` element. */
export class Gliss extends ControlElement {
  private timeSpanningInterface: TimeSpanningInterface | null = null;
  private lineRend: InstLineRend | null = null;
  private lineRendBase: InstLineRendBase | null = null;
  private attNNumberLike: InstNNumberLike | null = null;

  public constructor() {
    super(ClassId.GLISS);
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.lineRend = new InstLineRend();
    this.lineRendBase = new InstLineRendBase();
    this.attNNumberLike = new InstNNumberLike();

    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());
    this.RegisterAttClass(ATT_LINEREND);
    this.RegisterAttClass(ATT_LINERENDBASE);
    this.RegisterAttClass(ATT_NNUMBERLIKE);

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.lineRend ??= new InstLineRend();
    this.lineRendBase ??= new InstLineRendBase();
    this.attNNumberLike ??= new InstNNumberLike();

    this.timeSpanningInterface.Reset();
    this.lineRend.ResetLineRend();
    this.lineRendBase.ResetLineRendBase();
    this.attNNumberLike.ResetNNumberLike();
  }

  public override GetClassName(): string {
    return 'gliss';
  }

  // Getter to interfaces (C++ vrv_cast overloads collapse to one TS surface).
  public GetTimePointInterface(): TimePointInterface {
    return this.GetTimeSpanningInterface();
  }

  public GetTimeSpanningInterface(): TimeSpanningInterface {
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    return this.timeSpanningInterface;
  }

  // TimeSpanningInterface forwarding.
  public GetStart(): unknown { return this.GetTimeSpanningInterface().GetStart(); }
  public SetStart(start: any): void { this.GetTimeSpanningInterface().SetStart(start); }
  public GetEnd(): unknown { return this.GetTimeSpanningInterface().GetEnd(); }
  public SetEnd(end: any): void { this.GetTimeSpanningInterface().SetEnd(end); }
  public SetStartid(startid: string): void { this.GetTimeSpanningInterface().SetStartid(startid); }
  public GetStartid(): string { return this.GetTimeSpanningInterface().GetStartid(); }
  public HasStartid(): boolean { return this.GetTimeSpanningInterface().HasStartid(); }
  public SetEndid(endid: string): void { this.GetTimeSpanningInterface().SetEndid(endid); }
  public GetEndid(): string { return this.GetTimeSpanningInterface().GetEndid(); }
  public HasEndid(): boolean { return this.GetTimeSpanningInterface().HasEndid(); }
  public SetTstamp(tstamp: any): void { this.GetTimeSpanningInterface().SetTstamp(tstamp); }
  public GetTstamp(): any { return this.GetTimeSpanningInterface().GetTstamp(); }
  public HasTstamp(): boolean { return this.GetTimeSpanningInterface().HasTstamp(); }
  public SetTstamp2(tstamp2: any): void { this.GetTimeSpanningInterface().SetTstamp2(tstamp2); }
  public SetStaff(v: number[]): void { this.GetTimeSpanningInterface().SetStaff(v); }
  public GetTstamp2(): any { return this.GetTimeSpanningInterface().GetTstamp2(); }
  public HasTstamp2(): boolean { return this.GetTimeSpanningInterface().HasTstamp2(); }

  // AttLineRend forwarding.
  public ResetLineRend(): void { this.lineRend!.ResetLineRend(); }
  public SetLendsym(value: string): void { this.lineRend!.SetLendsym(value); }
  public GetLendsym(): string { return this.lineRend!.GetLendsym(); }
  public HasLendsym(): boolean { return this.lineRend!.HasLendsym(); }
  public SetLendsymSize(value: number): void { this.lineRend!.SetLendsymSize(value); }
  public GetLendsymSize(): number { return this.lineRend!.GetLendsymSize(); }
  public HasLendsymSize(): boolean { return this.lineRend!.HasLendsymSize(); }
  public SetLstartsym(value: string): void { this.lineRend!.SetLstartsym(value); }
  public GetLstartsym(): string { return this.lineRend!.GetLstartsym(); }
  public HasLstartsym(): boolean { return this.lineRend!.HasLstartsym(); }
  public SetLstartsymSize(value: number): void { this.lineRend!.SetLstartsymSize(value); }
  public GetLstartsymSize(): number { return this.lineRend!.GetLstartsymSize(); }
  public HasLstartsymSize(): boolean { return this.lineRend!.HasLstartsymSize(); }

  // AttLineRendBase forwarding.
  public ResetLineRendBase(): void { this.lineRendBase!.ResetLineRendBase(); }
  public SetLform(value: number): void { this.lineRendBase!.SetLform(value); }
  public GetLform(): number { return this.lineRendBase!.GetLform(); }
  public HasLform(): boolean { return this.lineRendBase!.HasLform(); }
  public GetLwidth(): any { return this.lineRendBase!.GetLwidth(); }
  public SetLwidth(value: any): void { this.lineRendBase!.SetLwidth(value); }
  public HasLwidth(): boolean { return this.lineRendBase!.HasLwidth(); }
  public SetLsegs(value: string): void { this.lineRendBase!.SetLsegs(value); }
  public GetLsegs(): string { return this.lineRendBase!.GetLsegs(); }
  public HasLsegs(): boolean { return this.lineRendBase!.HasLsegs(); }

  // AttNNumberLike forwarding.
  public SetN(n: any): void { this.attNNumberLike!.SetN(n); }
  public GetN(): any { return this.attNNumberLike!.GetN(); }
  public HasN(): boolean { return this.attNNumberLike!.HasN(); }
  public ResetNNumberLike(): void { this.attNNumberLike!.ResetNNumberLike(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitGliss');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitGliss');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitGlissEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitGlissEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Gliss {
    const clone = new Gliss();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all interface and attribute state.
    const ts = this.GetTimeSpanningInterface();
    const cts = clone.GetTimeSpanningInterface();
    if (ts.HasStartid()) cts.SetStartid(ts.GetStartid());
    if (ts.HasEndid()) cts.SetEndid(ts.GetEndid());
    if (ts.HasTstamp()) cts.SetTstamp(ts.GetTstamp());
    if (ts.HasTstamp2()) cts.SetTstamp2(ts.GetTstamp2());
    if (this.HasLstartsym()) clone.SetLstartsym(this.GetLstartsym());
    if (this.HasLstartsymSize()) clone.SetLstartsymSize(this.GetLstartsymSize());
    if (this.HasLendsym()) clone.SetLendsym(this.GetLendsym());
    if (this.HasLendsymSize()) clone.SetLendsymSize(this.GetLendsymSize());
    if (this.HasLform()) clone.SetLform(this.GetLform());
    if (this.HasLwidth()) clone.SetLwidth(this.GetLwidth());
    if (this.HasLsegs()) clone.SetLsegs(this.GetLsegs());
    if (this.HasN()) clone.SetN(this.GetN());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('gliss', ClassId.GLISS, () => new Gliss());
