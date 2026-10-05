/**
 * Pure TypeScript translation of Verovio's `src/fing.cpp` / `include/vrv/fing.h`.
 *
 * `Fing` is the MEI `<fing>` (fingering) control element. C++ multiple inheritance
 * (ControlElement + TimePointInterface + TextDirInterface + AttNNumberLike)
 * is represented through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode, STAFFREL_above, STAFFREL_below } from './vrvdef.js';
import { ObjectFactory } from './object.js';
import { ControlElement } from './controlelement.js';
import { FloatingObject } from './floatingobject.js';
import { TimePointInterface } from './timeinterface.js';
import { TextDirInterface } from './textdirinterface.js';
import { InstNNumberLike } from './atts_shared.js';

// Canonical libmei att-class ordinals (libmei/dist/attclasses.h).
const ATT_NNUMBERLIKE = 168;

/** Pure TypeScript translation of Verovio's `Fing` element. */
export class Fing extends ControlElement {
  private timePointInterface: TimePointInterface | null = null;
  private textDirInterface: TextDirInterface | null = null;
  private attNNumberLike: InstNNumberLike | null = null;

  public constructor() {
    super(ClassId.FING);
    this.timePointInterface = new TimePointInterface();
    this.textDirInterface = new TextDirInterface();
    this.attNNumberLike = new InstNNumberLike();

    this.RegisterInterface(this.timePointInterface.GetAttClasses(), this.timePointInterface.IsInterface());
    this.RegisterInterface(this.textDirInterface.GetAttClasses(), this.textDirInterface.IsInterface());
    this.RegisterAttClass(ATT_NNUMBERLIKE);

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.timePointInterface ??= new TimePointInterface();
    this.textDirInterface ??= new TextDirInterface();
    this.attNNumberLike ??= new InstNNumberLike();

    this.timePointInterface.Reset();
    this.textDirInterface.Reset();
    this.attNNumberLike.ResetNNumberLike();
  }

  public override GetClassName(): string {
    return 'fing';
  }

  public GetTextDirInterface(): TextDirInterface {
    this.textDirInterface ??= new TextDirInterface();
    return this.textDirInterface;
  }

  public GetTimePointInterface(): TimePointInterface {
    this.timePointInterface ??= new TimePointInterface();
    return this.timePointInterface;
  }

  /**
   * Add an element (text, rend) to a fing.
   * Only supported elements will be actually added to the child list.
   */
  public override IsSupportedChild(classId: ClassId): boolean {
    switch (classId) {
      case ClassId.LB:
      case ClassId.REND:
      case ClassId.TEXT:
        return true;
      default:
        return false;
    }
  }

  /**
   * Check whether the current object must be positioned closer to the staff than the other
   */
  public override IsCloserToStaffThan(other: FloatingObject, drawingPlace: number): boolean {
    if (!other.Is(ClassId.FING)) return false;
    const otherFing = other as Fing;

    const thisStart = this.GetStart();
    if (!thisStart || thisStart.Is(ClassId.TIMESTAMP_ATTR)) return false;
    const otherStart = otherFing.GetStart();
    if (!otherStart || otherStart.Is(ClassId.TIMESTAMP_ATTR)) return false;

    const thisY = typeof thisStart.GetDrawingY === 'function' ? thisStart.GetDrawingY() : (thisStart as any).m_drawingY ?? 0;
    const otherY = typeof otherStart.GetDrawingY === 'function' ? otherStart.GetDrawingY() : (otherStart as any).m_drawingY ?? 0;

    if (drawingPlace === STAFFREL_above) {
      return thisY < otherY;
    } else if (drawingPlace === STAFFREL_below) {
      return thisY > otherY;
    } else {
      return false;
    }
  }

  // TextDirInterface forwarding.
  public SetPlace(place: any): void { this.GetTextDirInterface().SetPlace(place); }
  public GetPlace(): any { return this.GetTextDirInterface().GetPlace(); }
  public HasPlace(): boolean { return this.GetTextDirInterface().HasPlace(); }
  public ResetPlace(): void { this.GetTextDirInterface().Reset(); }

  // TimePointInterface forwarding.
  public GetStart(): any { return this.GetTimePointInterface().GetStart(); }
  public SetStart(start: any): void { this.GetTimePointInterface().SetStart(start); }
  // C++ Fing : TimePointInterface — DrawFingering calls GetTstampStaves (34b/34c).
  public GetTstampStaves(measure: unknown, object: unknown): unknown[] { return this.GetTimePointInterface().GetTstampStaves(measure as never, object as never); }
  public SetStartid(startid: string): void { this.GetTimePointInterface().SetStartid(startid); }
  public GetStartid(): string { return this.GetTimePointInterface().GetStartid(); }
  public HasStartid(): boolean { return this.GetTimePointInterface().HasStartid(); }
  public SetTstamp(tstamp: any): void { this.GetTimePointInterface().SetTstamp(tstamp); }
  public GetTstamp(): any { return this.GetTimePointInterface().GetTstamp(); }
  public HasTstamp(): boolean { return this.GetTimePointInterface().HasTstamp(); }
  public SetStaff(staff: any): void { this.GetTimePointInterface().SetStaff(staff); }
  public GetStaff(): any { return this.GetTimePointInterface().GetStaff(); }
  public HasStaff(): boolean { return this.GetTimePointInterface().HasStaff(); }

  // AttNNumberLike forwarding.
  public SetN(n: any): void { this.attNNumberLike!.SetN(n); }
  public GetN(): any { return this.attNNumberLike!.GetN(); }
  public HasN(): boolean { return this.attNNumberLike!.HasN(); }
  public ResetNNumberLike(): void { this.attNNumberLike!.ResetNNumberLike(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitFing');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitFing');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitFingEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitFingEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Fing {
    const clone = new Fing();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all interface/attribute members.
    const td = this.GetTextDirInterface();
    const ctd = clone.GetTextDirInterface();
    if (td.HasPlace()) ctd.SetPlace(td.GetPlace());
    const tp = this.GetTimePointInterface();
    const ctp = clone.GetTimePointInterface();
    if (tp.HasPart()) ctp.SetPart(tp.GetPart());
    if (tp.HasStaff()) ctp.SetStaff(tp.GetStaff());
    if (tp.HasStartid()) ctp.SetStartid(tp.GetStartid());
    if (tp.HasTstamp()) ctp.SetTstamp(tp.GetTstamp());
    if (this.HasN()) clone.SetN(this.GetN());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('fing', ClassId.FING, () => new Fing());
