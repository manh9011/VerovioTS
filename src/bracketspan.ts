import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory } from './object.js';
import { ControlElement } from './controlelement.js';
import { TimeSpanningInterface } from './timeinterface.js';
import { InstBracketSpanLog } from './atts_cmn.js';
import { InstLineRend, InstLineRendBase } from './atts_shared.js';

// Canonical libmei att-class ordinals used by the C++ RegisterAttClass calls.
const ATT_BRACKETSPANLOG = 17;
const ATT_LINEREND = 150;
const ATT_LINERENDBASE = 151;

// Canonical libmei ordinals (see octave.ts / libmei atttypes.h).
const LINEWIDTHTERM_factor_narrow = 1.0;
const LINEWIDTHTERM_factor_medium = 2.0;
const LINEWIDTHTERM_factor_wide = 4.0;
const LINEWIDTHTYPE_lineWidthTerm = 1;
const LINEWIDTHTYPE_measurementunsigned = 2;
const LINEWIDTHTERM_narrow = 1;
const LINEWIDTHTERM_medium = 2;
const LINEWIDTHTERM_wide = 3;
const MEASUREMENTTYPE_px = 2;

/** Structural contract for the document/option collaborators of GetLineWidth. */
export interface BracketSpanDocLike {
  GetDrawingUnit?: (factor: number) => number;
  GetOptions(): { m_octaveLineThickness: { GetValue(): number } };
}

/** Pure TypeScript translation of Verovio's src/bracketspan.cpp / include/vrv/bracketspan.h. */
export class BracketSpan extends ControlElement {
  private timeSpanningInterface: TimeSpanningInterface | null = null;
  private bracketSpanLog: InstBracketSpanLog | null = null;
  private lineRend: InstLineRend | null = null;
  private lineRendBase: InstLineRendBase | null = null;

  public constructor() {
    super(ClassId.BRACKETSPAN);
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.bracketSpanLog = new InstBracketSpanLog();
    this.lineRend = new InstLineRend();
    this.lineRendBase = new InstLineRendBase();
    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());
    this.RegisterAttClass(ATT_BRACKETSPANLOG);
    this.RegisterAttClass(ATT_LINEREND);
    this.RegisterAttClass(ATT_LINERENDBASE);
    // The TS base constructor dispatched the overridden Reset() before these
    // fields were initialized; run it again now that the full object exists.
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.bracketSpanLog ??= new InstBracketSpanLog();
    this.lineRend ??= new InstLineRend();
    this.lineRendBase ??= new InstLineRendBase();
    this.timeSpanningInterface.Reset();
    this.bracketSpanLog.ResetBracketSpanLog();
    this.lineRend.ResetLineRend();
    this.lineRendBase.ResetLineRendBase();
  }

  public override GetClassName(): string { return 'bracketSpan'; }

  public GetTimeSpanningInterface(): TimeSpanningInterface {
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    return this.timeSpanningInterface;
  }

  /** TimeSpanningInterface extends TimePointInterface in C++ (and here). */
  public GetTimePointInterface(): TimeSpanningInterface {
    return this.GetTimeSpanningInterface();
  }

  /**
   * Calculate the bracket line width.
   * Preserved from the C++ original: integer truncation at the option*unit
   * assignment, LINEWIDTHTERM factors, and px/vu measurement overrides.
   */
  public GetLineWidth(doc: BracketSpanDocLike, unit: number): number {
    // C++ int lineWidth = option * unit -> truncate at the assignment boundary.
    let lineWidth = Math.trunc(doc.GetOptions().m_octaveLineThickness.GetValue() * unit);
    if (this.HasLwidth()) {
      const lwidth = this.GetLwidth();
      if (lwidth.GetType() === LINEWIDTHTYPE_lineWidthTerm) {
        switch (lwidth.GetLineWithTerm()) {
          case LINEWIDTHTERM_narrow: lineWidth *= LINEWIDTHTERM_factor_narrow; break;
          case LINEWIDTHTERM_medium: lineWidth *= LINEWIDTHTERM_factor_medium; break;
          case LINEWIDTHTERM_wide: lineWidth *= LINEWIDTHTERM_factor_wide; break;
          default: break;
        }
      } else if (lwidth.GetType() === LINEWIDTHTYPE_measurementunsigned) {
        const measurement = lwidth.GetMeasurementunsigned!();
        if (measurement.GetType() === MEASUREMENTTYPE_px) {
          lineWidth = measurement.GetPx();
        } else {
          lineWidth = measurement.GetVu() * unit;
        }
      }
    }
    return lineWidth;
  }

  // AttBracketSpanLog forwarding
  public ResetBracketSpanLog(): void { this.bracketSpanLog!.ResetBracketSpanLog(); }
  public SetFunc(value: number): void { this.bracketSpanLog!.SetFunc(value); }
  public GetFunc(): number { return this.bracketSpanLog!.GetFunc(); }
  public HasFunc(): boolean { return this.bracketSpanLog!.HasFunc(); }

  // AttLineRend forwarding
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

  // AttLineRendBase forwarding
  public ResetLineRendBase(): void { this.lineRendBase!.ResetLineRendBase(); }
  public SetLform(value: number): void { this.lineRendBase!.SetLform(value); }
  public GetLform(): number { return this.lineRendBase!.GetLform(); }
  public HasLform(): boolean { return this.lineRendBase!.HasLform(); }
  public GetLwidth(): any { return this.lineRendBase!.GetLwidth(); }
  public SetLwidth(value: any): void { this.lineRendBase!.SetLwidth(value); }
  public HasLwidth(): boolean { return this.lineRendBase!.HasLwidth(); }
  public SetLsegs(value: string): void { this.lineRendBase!.SetLsegs(value); }
  public GetLsegs(): string { return this.lineRendBase!.GetLsegs(); }

  // Interface forwardings
  // C++ BracketSpan : ControlElement : TimeSpanningInterface exposes
  // GetStart/GetEnd directly (view_control.cpp DrawBracketSpan).
  public GetStart(): unknown { return this.GetTimeSpanningInterface().GetStart(); }
  public GetEnd(): unknown { return this.GetTimeSpanningInterface().GetEnd(); }
  public SetStartid(value: string): void { this.GetTimeSpanningInterface().SetStartid(value); }
  public GetStartid(): string { return this.GetTimeSpanningInterface().GetStartid(); }
  public HasStartid(): boolean { return this.GetTimeSpanningInterface().HasStartid(); }
  public SetEndid(value: string): void { this.GetTimeSpanningInterface().SetEndid(value); }
  public GetEndid(): string { return this.GetTimeSpanningInterface().GetEndid(); }
  public HasEndid(): boolean { return this.GetTimeSpanningInterface().HasEndid(); }
  public SetStaff(value: number[]): void { this.GetTimeSpanningInterface().SetStaff(value); }
  public GetStaff(): number[] { return this.GetTimeSpanningInterface().GetStaff(); }
  public HasStaff(): boolean { return this.GetTimeSpanningInterface().HasStaff(); }
  public SetTstamp(value: number): void { this.GetTimeSpanningInterface().SetTstamp(value); }
  public GetTstamp(): number { return this.GetTimeSpanningInterface().GetTstamp(); }
  public HasTstamp(): boolean { return this.GetTimeSpanningInterface().HasTstamp(); }
  // C++ AttTimestamp2Log via TimeSpanningInterface (iomusxml <bracket>/<principal-voice> stop).
  public SetTstamp2(value: [number, number]): void { this.GetTimeSpanningInterface().SetTstamp2(value as never); }
  public GetTstamp2(): unknown { return this.GetTimeSpanningInterface().GetTstamp2(); }
  public HasTstamp2(): boolean { return this.GetTimeSpanningInterface().HasTstamp2(); }
  public HasLsegs(): boolean { return this.lineRendBase!.HasLsegs(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBracketSpan');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBracketSpan');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBracketSpanEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBracketSpanEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): BracketSpan {
    const clone = new BracketSpan();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all interface/attribute members.
    const ts = this.GetTimeSpanningInterface();
    const cts = clone.GetTimeSpanningInterface();
    if (ts.HasPart()) cts.SetPart(ts.GetPart());
    if (ts.HasStaff()) cts.SetStaff(ts.GetStaff());
    if (ts.HasStartid()) cts.SetStartid(ts.GetStartid());
    if (ts.HasTstamp()) cts.SetTstamp(ts.GetTstamp());
    if (ts.HasEndid()) cts.SetEndid(ts.GetEndid());
    if (ts.HasTstamp2()) cts.SetTstamp2(ts.GetTstamp2());
    if (this.HasFunc()) clone.SetFunc(this.GetFunc());
    if (this.HasLendsym()) clone.SetLendsym(this.GetLendsym());
    if (this.HasLendsymSize()) clone.SetLendsymSize(this.GetLendsymSize());
    if (this.HasLstartsym()) clone.SetLstartsym(this.GetLstartsym());
    if (this.HasLstartsymSize()) clone.SetLstartsymSize(this.GetLstartsymSize());
    if (this.HasLform()) clone.SetLform(this.GetLform());
    if (this.HasLwidth()) clone.SetLwidth(this.GetLwidth());
    if (this.HasLsegs()) clone.SetLsegs(this.GetLsegs());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('bracketSpan', ClassId.BRACKETSPAN, () => new BracketSpan());
