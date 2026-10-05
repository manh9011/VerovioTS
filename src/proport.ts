import { ATT_CLASS_IDS } from './attmodule.js';
import { InstDurationRatio } from './atts_shared.js';
import { Fraction } from './fraction.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory } from './object.js';
import { ClassId, FunctorCode, VRV_UNSET } from './vrvdef.js';

export class Proport extends LayerElement {
  private m_attDurationRatio!: InstDurationRatio;
  public m_cumulatedNum: number = VRV_UNSET;
  public m_cumulatedNumbase: number = VRV_UNSET;

  public constructor() {
    super(ClassId.PROPORT);
    this.RegisterAttClass(ATT_CLASS_IDS.ATT_DURATIONRATIO);
    this.Reset();
  }

  public override GetClassName(): string {
    return 'proport';
  }

  public override Reset(): void {
    super.Reset();
    this.m_attDurationRatio ??= new InstDurationRatio();
    this.m_attDurationRatio.ResetDurationRatio();

    this.m_cumulatedNum = VRV_UNSET;
    this.m_cumulatedNumbase = VRV_UNSET;
  }

  public override Clone(): Proport {
    const clone = new Proport();
    clone.AssignFrom(this);
    clone.m_cumulatedNum = this.m_cumulatedNum;
    clone.m_cumulatedNumbase = this.m_cumulatedNumbase;
    if (this.HasNum()) clone.SetNum(this.GetNum());
    if (this.HasNumbase()) clone.SetNumbase(this.GetNumbase());
    if (this.HasType()) clone.SetType(this.GetType());
    if (this.HasLabel()) clone.SetLabel(this.GetLabel());
    return clone;
  }

  public override HasToBeAligned(): boolean {
    return true;
  }

  // DurationRatio forwarding
  public ResetDurationRatio(): void {
    this.m_attDurationRatio.ResetDurationRatio();
  }

  public GetNum(): number {
    return this.m_attDurationRatio.GetNum();
  }

  public SetNum(num: number): void {
    this.m_attDurationRatio.SetNum(num);
  }

  public HasNum(): boolean {
    return this.m_attDurationRatio.HasNum();
  }

  public GetNumbase(): number {
    return this.m_attDurationRatio.GetNumbase();
  }

  public SetNumbase(numbase: number): void {
    this.m_attDurationRatio.SetNumbase(numbase);
  }

  public HasNumbase(): boolean {
    return this.m_attDurationRatio.HasNumbase();
  }

  // Cumulate methods
  public GetCumulatedNum(): number {
    return this.m_cumulatedNum !== VRV_UNSET ? this.m_cumulatedNum : this.GetNum();
  }

  public GetCumulatedNumbase(): number {
    return this.m_cumulatedNumbase !== VRV_UNSET ? this.m_cumulatedNumbase : this.GetNumbase();
  }

  public Cumulate(proport: Proport): void {
    // Reset type proportion - do not cumulate
    if (this.GetType() === 'reset') return;
    // Potential reset (tempo change) in CMME - do not cumulate
    if (this.GetType() === 'reset?') return;

    // Unset values are not cumulated
    if (proport.HasNum() && this.HasNum()) {
      this.m_cumulatedNum = this.GetNum() * proport.GetCumulatedNum();
    }
    if (proport.HasNumbase() && this.HasNumbase()) {
      this.m_cumulatedNumbase = this.GetNumbase() * proport.GetCumulatedNumbase();
    }
    if (this.m_cumulatedNum !== VRV_UNSET && this.m_cumulatedNumbase !== VRV_UNSET) {
      [this.m_cumulatedNum, this.m_cumulatedNumbase] = Fraction.ReducePair(
        this.m_cumulatedNum,
        this.m_cumulatedNumbase
      );
    }
  }

  public ResetCumulate(): void {
    this.m_cumulatedNum = VRV_UNSET;
    this.m_cumulatedNumbase = VRV_UNSET;
  }

  public override Accept(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitProport', this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitProportEnd', this);
  }

  public override AcceptConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitProport', this);
  }

  public override AcceptEndConst(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitProportEnd', this);
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

ObjectFactory.GetInstance().Register('proport', ClassId.PROPORT, () => new Proport());
