import { VrvObject, ObjectFactory } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { Functor, ConstFunctor } from './functor.js';

export const MEASUREMENTTYPE_NONE = 0;
export const MEASUREMENTTYPE_vu = 1;
export const MEASUREMENTTYPE_px = 2;

export interface MeasurementUnsigned {
  GetType(): number;
  GetPx(): number;
  GetVu(): number;
}

export class AttPointing {
  private actuate = '';
  private role = '';
  private show = '';
  private target = '';
  private targettype = '';
  ResetPointing(): void { this.actuate=''; this.role=''; this.show=''; this.target=''; this.targettype=''; }
  SetActuate(v:string):void{this.actuate=v;} GetActuate():string{return this.actuate;} HasActuate():boolean{return !!this.actuate;}
  SetRole(v:string):void{this.role=v;} GetRole():string{return this.role;} HasRole():boolean{return !!this.role;}
  SetShow(v:string):void{this.show=v;} GetShow():string{return this.show;} HasShow():boolean{return !!this.show;}
  SetTarget(v:string):void{this.target=v;} GetTarget():string{return this.target;} HasTarget():boolean{return !!this.target;}
  SetTargettype(v:string):void{this.targettype=v;} GetTargettype():string{return this.targettype;} HasTargettype():boolean{return !!this.targettype;}
}

export class AttWidth {
  protected m_width: MeasurementUnsigned | null = null;
  ResetWidth(): void { this.m_width = null; }
  SetWidth(v: MeasurementUnsigned): void { this.m_width = v; }
  GetWidth(): MeasurementUnsigned { if (!this.m_width) throw new Error('Width is unset'); return this.m_width; }
  HasWidth(): boolean { return this.m_width !== null; }
}
export class AttHeight {
  protected m_height: MeasurementUnsigned | null = null;
  ResetHeight(): void { this.m_height = null; }
  SetHeight(v: MeasurementUnsigned): void { this.m_height = v; }
  GetHeight(): MeasurementUnsigned { if (!this.m_height) throw new Error('Height is unset'); return this.m_height; }
  HasHeight(): boolean { return this.m_height !== null; }
}
export class AttTyped {
  private m_type = '';
  ResetTyped(): void { this.m_type=''; }
  SetType(v:string):void{this.m_type=v;} GetType():string{return this.m_type;} HasType():boolean{return !!this.m_type;}
}

export interface GraphicFunctorLike { VisitGraphic(g: Graphic): FunctorCode; VisitGraphicEnd(g: Graphic): FunctorCode; }
export interface GraphicConstFunctorLike { VisitGraphic(g: Graphic): FunctorCode; VisitGraphicEnd(g: Graphic): FunctorCode; }

export class Graphic extends VrvObject {
  private pointing: AttPointing | undefined;
  private width: AttWidth | undefined;
  private height: AttHeight | undefined;
  private typed: AttTyped | undefined;

  constructor() {
    super(ClassId.GRAPHIC);
    this.RegisterAttClass(188); // ATT_POINTING
    this.RegisterAttClass(237); // ATT_WIDTH
    this.RegisterAttClass(139); // ATT_HEIGHT
    this.RegisterAttClass(224); // ATT_TYPED
    this.ResetGraphic();
  }

  private ResetGraphic(): void {
    this.pointing ??= new AttPointing();
    this.width ??= new AttWidth();
    this.height ??= new AttHeight();
    this.typed ??= new AttTyped();
    this.pointing.ResetPointing(); this.width.ResetWidth(); this.height.ResetHeight(); this.typed.ResetTyped();
  }
  override Reset(): void { super.Reset(); this.ResetGraphic(); }
  override GetClassName(): string { return 'graphic'; }
  override Clone(): VrvObject { const c = new Graphic(); c.AssignFrom(this); return c; }

  GetDrawingWidth(unit:number, staffSize:number):number {
    if (!this.width || !this.width.HasWidth() || staffSize===0) return 0;
    const w = this.width.GetWidth();
    if (w.GetType()===MEASUREMENTTYPE_px) return Math.trunc(w.GetPx() * staffSize / 100);
    return Math.trunc(w.GetVu() * unit);
  }
  GetDrawingHeight(unit:number, staffSize:number):number {
    if (!this.height || !this.height.HasHeight()) return 0;
    const h = this.height.GetHeight();
    if (h.GetType()===MEASUREMENTTYPE_px) return Math.trunc(h.GetPx() * staffSize / 100);
    return Math.trunc(h.GetVu() * unit);
  }

  GetPointing(): AttPointing { return this.pointing!; }
  GetWidthAttribute(): AttWidth { return this.width!; }
  GetHeightAttribute(): AttHeight { return this.height!; }
  GetTyped(): AttTyped { return this.typed!; }

  override Accept(functor: Functor): FunctorCode {
    const f = functor as Functor & Partial<GraphicFunctorLike>;
    return typeof f.VisitGraphic === 'function' ? f.VisitGraphic(this) : FunctorCode.FUNCTOR_CONTINUE;
  }
  public AcceptConst(functor: ConstFunctor): FunctorCode {
    const f = functor as ConstFunctor & Partial<GraphicConstFunctorLike>;
    return typeof f.VisitGraphic === 'function' ? f.VisitGraphic(this) : FunctorCode.FUNCTOR_CONTINUE;
  }
  override AcceptEnd(functor: Functor): FunctorCode {
    const f = functor as Functor & Partial<GraphicFunctorLike>;
    return typeof f.VisitGraphicEnd === 'function' ? f.VisitGraphicEnd(this) : FunctorCode.FUNCTOR_CONTINUE;
  }
  public AcceptEndConst(functor: ConstFunctor): FunctorCode {
    const f = functor as ConstFunctor & Partial<GraphicConstFunctorLike>;
    return typeof f.VisitGraphicEnd === 'function' ? f.VisitGraphicEnd(this) : FunctorCode.FUNCTOR_CONTINUE;
  }
}

ObjectFactory.GetInstance().Register('graphic', ClassId.GRAPHIC, () => new Graphic());
