import { ATT_CLASS_IDS } from './attmodule.js';
import { InstCoordinated, InstCoordinatedUl, InstTyped } from './atts_shared.js';
import { ObjectFactory, VrvObject } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';

/**
 * Pure TypeScript translation of Verovio's Zone class from
 * include/vrv/zone.h and src/zone.cpp.
 *
 * Implements the <zone> element in MEI.
 */
export class Zone extends VrvObject {
  private m_attTyped!: InstTyped;
  private m_attCoordinated!: InstCoordinated;
  private m_attCoordinatedUl!: InstCoordinatedUl;

  public constructor() {
    super(ClassId.ZONE);
    this.RegisterAttClass(ATT_CLASS_IDS.ATT_TYPED);
    this.RegisterAttClass(ATT_CLASS_IDS.ATT_COORDINATED);
    this.RegisterAttClass(ATT_CLASS_IDS.ATT_COORDINATEDUL);
    this.Reset();
  }

  public override GetClassName(): string {
    return 'zone';
  }

  public override Reset(): void {
    super.Reset();
    this.m_attTyped ??= new InstTyped();
    this.m_attCoordinated ??= new InstCoordinated();
    this.m_attCoordinatedUl ??= new InstCoordinatedUl();

    this.m_attTyped.ResetTyped();
    this.m_attCoordinated.ResetCoordinated();
    this.m_attCoordinatedUl.ResetCoordinatedUl();
  }

  public override Clone(): Zone {
    const clone = new Zone();
    clone.AssignFrom(this);
    if (this.HasType()) clone.SetType(this.GetType());
    if (this.HasLrx()) clone.SetLrx(this.GetLrx());
    if (this.HasLry()) clone.SetLry(this.GetLry());
    if (this.HasRotate()) clone.SetRotate(this.GetRotate());
    if (this.HasUlx()) clone.SetUlx(this.GetUlx());
    if (this.HasUly()) clone.SetUly(this.GetUly());
    return clone;
  }

  public ShiftByXY(xDiff: number, yDiff: number): void {
    this.SetUlx(this.GetUlx() + xDiff);
    this.SetLrx(this.GetLrx() + xDiff);
    this.SetUly(this.GetUly() + yDiff);
    this.SetLry(this.GetLry() + yDiff);
  }

  public GetLogicalUly(): number {
    return this.GetUly();
  }

  public GetLogicalLry(): number {
    return this.GetLry();
  }

  // AttTyped forwarding
  public SetType(type: string): void {
    this.m_attTyped.SetType(type);
  }

  public GetType(): string {
    return this.m_attTyped.GetType();
  }

  public HasType(): boolean {
    return this.m_attTyped.HasType();
  }

  public ResetTyped(): void {
    this.m_attTyped.ResetTyped();
  }

  // AttCoordinated forwarding
  public SetLrx(lrx: number): void {
    this.m_attCoordinated.SetLrx(lrx);
  }

  public GetLrx(): number {
    return this.m_attCoordinated.GetLrx();
  }

  public HasLrx(): boolean {
    return this.m_attCoordinated.HasLrx();
  }

  public SetLry(lry: number): void {
    this.m_attCoordinated.SetLry(lry);
  }

  public GetLry(): number {
    return this.m_attCoordinated.GetLry();
  }

  public HasLry(): boolean {
    return this.m_attCoordinated.HasLry();
  }

  public SetRotate(rotate: number): void {
    this.m_attCoordinated.SetRotate(rotate);
  }

  public GetRotate(): number {
    return this.m_attCoordinated.GetRotate();
  }

  public HasRotate(): boolean {
    return this.m_attCoordinated.HasRotate();
  }

  public ResetCoordinated(): void {
    this.m_attCoordinated.ResetCoordinated();
  }

  // AttCoordinatedUl forwarding
  public SetUlx(ulx: number): void {
    this.m_attCoordinatedUl.SetUlx(ulx);
  }

  public GetUlx(): number {
    return this.m_attCoordinatedUl.GetUlx();
  }

  public HasUlx(): boolean {
    return this.m_attCoordinatedUl.HasUlx();
  }

  public SetUly(uly: number): void {
    this.m_attCoordinatedUl.SetUly(uly);
  }

  public GetUly(): number {
    return this.m_attCoordinatedUl.GetUly();
  }

  public HasUly(): boolean {
    return this.m_attCoordinatedUl.HasUly();
  }

  public ResetCoordinatedUl(): void {
    this.m_attCoordinatedUl.ResetCoordinatedUl();
  }

  public override Accept(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitZone', this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitZoneEnd', this);
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitZone', this);
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitZoneEnd', this);
  }
}

function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') {
    return fn.call(functor, self) as FunctorCode;
  }
  const fallback = method.endsWith('End') ? f.VisitObjectEnd : f.VisitObject;
  if (typeof fallback === 'function') {
    return fallback.call(functor, self) as FunctorCode;
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('zone', ClassId.ZONE, () => new Zone());
