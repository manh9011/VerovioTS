import { ObjectFactory, VrvObject } from './object.js';
import { LayerElement } from './layerelement.js';
import { ClassId, FunctorCode, data_DURATION } from './vrvdef.js';
import { Fraction } from './fraction.js';
import { InstBeatRptLog } from './atts_cmn.js';
import { InstBeatRptVis } from './atts_visual.js';
import { InstColor } from './atts_shared.js';

// libmei addon macro: #define DUR_MAX 2048 (libmei/addons/attdef.h)
const DUR_MAX = 2048;

const ATT_BEATRPTLOG = 16;
const ATT_BEATRPTVIS = 252;
const ATT_COLOR = 109;

/** Pure TypeScript translation of Verovio's src/beatrpt.cpp / include/vrv/beatrpt.h. */
export class BeatRpt extends LayerElement {
  private beatRptLog!: InstBeatRptLog;
  private beatRptVis!: InstBeatRptVis;
  private color!: InstColor;
  /** Score-time onset of the repeat in the measure (duration from the measure start in quarter notes). */
  private m_scoreTimeOnset = new Fraction(0);

  public constructor() {
    super(ClassId.BEATRPT);
    this.beatRptLog = new InstBeatRptLog();
    this.beatRptVis = new InstBeatRptVis();
    this.color = new InstColor();
    this.RegisterAttClass(ATT_BEATRPTLOG);
    this.RegisterAttClass(ATT_BEATRPTVIS);
    this.RegisterAttClass(ATT_COLOR);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.beatRptLog?.ResetBeatRptLog();
    this.beatRptVis?.ResetBeatRptVis();
    this.color?.ResetColor();
    // C++ resets via value assignment of the default-constructed Fraction.
    this.m_scoreTimeOnset = new Fraction(0);
  }

  public override GetClassName(): string { return 'beatRpt'; }

  /** Override the method since alignment is required */
  public override HasToBeAligned(): boolean { return true; }

  /** Returns the duration (in Fraction) for the BeatRpt. */
  public GetBeatRptAlignmentDuration(meterUnit: data_DURATION): Fraction {
    const duration = Fraction.fromDuration(meterUnit);
    if (this.HasBeatdef()) {
      return duration.multiply(new Fraction(Math.trunc(this.GetBeatdef() * DUR_MAX), DUR_MAX));
    }
    return duration;
  }

  // MIDI timing information
  public SetScoreTimeOnset(scoreTime: Fraction): void { this.m_scoreTimeOnset = scoreTime; }
  public GetScoreTimeOnset(): Fraction { return this.m_scoreTimeOnset; }

  // AttBeatRptLog forwarding
  public SetBeatdef(value: number): void { this.beatRptLog.SetBeatdef(value); }
  public GetBeatdef(): number { return this.beatRptLog.GetBeatdef(); }
  public HasBeatdef(): boolean { return this.beatRptLog.HasBeatdef(); }
  public ResetBeatRptLog(): void { this.beatRptLog.ResetBeatRptLog(); }

  // AttBeatRptVis forwarding
  public SetSlash(value: number): void { this.beatRptVis.SetSlash(value); }
  public GetSlash(): number { return this.beatRptVis.GetSlash(); }
  public HasSlash(): boolean { return this.beatRptVis.HasSlash(); }
  public ResetBeatRptVis(): void { this.beatRptVis.ResetBeatRptVis(); }

  // AttColor forwarding
  public SetColor(value: string): void { this.color.SetColor(value); }
  public GetColor(): string { return this.color.GetColor(); }
  public HasColor(): boolean { return this.color.HasColor(); }
  public ResetColor(): void { this.color.ResetColor(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBeatRpt');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBeatRpt');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBeatRptEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBeatRptEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): BeatRpt {
    const clone = new BeatRpt();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all attribute-class members and m_scoreTimeOnset.
    if (this.HasBeatdef()) clone.SetBeatdef(this.GetBeatdef());
    if (this.HasSlash()) clone.SetSlash(this.GetSlash());
    if (this.HasColor()) clone.SetColor(this.GetColor());
    clone.SetScoreTimeOnset(this.GetScoreTimeOnset());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('beatRpt', ClassId.BEATRPT, () => new BeatRpt());
