import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, VrvObject } from './object.js';
import { ControlElement } from './controlelement.js';
import { TextDirInterface } from './textdirinterface.js';

/** Pure TypeScript translation of Verovio's src/anchoredtext.cpp. */
export class AnchoredText extends ControlElement {
  private textDirInterface: TextDirInterface | null = null;

  public constructor() {
    super(ClassId.ANCHOREDTEXT);
    this.textDirInterface = new TextDirInterface();
    this.RegisterInterface([186], this.textDirInterface.IsInterface());
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.textDirInterface ??= new TextDirInterface();
    this.textDirInterface.Reset();
  }

  public override GetClassName(): string { return 'anchoredText'; }

  public GetTextDirInterface(): TextDirInterface {
    this.textDirInterface ??= new TextDirInterface();
    return this.textDirInterface;
  }

  // AttPlacementRelStaff forwarding
  public SetPlace(place: number): void { this.GetTextDirInterface().SetPlace(place); }
  public GetPlace(): number { return this.GetTextDirInterface().GetPlace(); }
  public HasPlace(): boolean { return this.GetTextDirInterface().HasPlace(); }
  public ResetPlacementRelStaff(): void { this.GetTextDirInterface().ResetPlacementRelStaff(); }

  public IsSupportedChild(classId: ClassId): boolean {
    switch (classId) {
      case ClassId.LB:
      case ClassId.REND:
      case ClassId.TEXT:
        return true;
      default:
        return VrvObject.IsEditorialElement(classId);
    }
  }

  public override Accept(functor: any): FunctorCode {
    return functor.VisitAnchoredText(this);
  }

  public AcceptConst(functor: any): FunctorCode {
    return functor.VisitAnchoredText(this);
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return functor.VisitAnchoredTextEnd(this);
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return functor.VisitAnchoredTextEnd(this);
  }

  public override Clone(): AnchoredText {
    const clone = new AnchoredText();
    clone.AssignFrom(this);
    clone.GetTextDirInterface().SetPlace(this.GetTextDirInterface().GetPlace());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('anchoredText', ClassId.ANCHOREDTEXT, () => new AnchoredText());
