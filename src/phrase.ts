/**
 * Pure TypeScript translation of Verovio's `src/phrase.cpp` / `include/vrv/phrase.h`.
 *
 * `Phrase` models the MEI `<phrase>` element, extending `Slur`.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { Slur } from './slur.js';
import { ObjectFactory } from './object.js';

export class Phrase extends Slur {
  public constructor() {
    super(ClassId.PHRASE);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
  }

  public override GetClassName(): string {
    return 'phrase';
  }

  public override Accept(functor: any): FunctorCode {
    return this.visitPhrase(functor, 'VisitPhrase');
  }

  public override AcceptConst(functor: any): FunctorCode {
    return this.visitPhrase(functor, 'VisitPhrase');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visitPhrase(functor, 'VisitPhraseEnd');
  }

  public override AcceptEndConst(functor: any): FunctorCode {
    return this.visitPhrase(functor, 'VisitPhraseEnd');
  }

  private visitPhrase(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitSlur === 'function') return functor.VisitSlur(this);
    if (typeof functor.VisitControlElement === 'function') return functor.VisitControlElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): Phrase {
    const clone = new Phrase();
    clone.AssignFrom(this);

    clone.SetDrawingCurveDir(this.GetDrawingCurveDir());

    if (this.HasCurvedir()) clone.SetCurvedir(this.GetCurvedir());
    if (this.HasBulge()) clone.SetBulge(this.GetBulge());

    if (this.HasLayer()) clone.SetLayer(this.GetLayer());

    if (this.HasLform()) clone.SetLform(this.GetLform());
    if (this.HasLwidth()) clone.SetLwidth(this.GetLwidth());
    if (this.HasLsegs()) clone.SetLsegs(this.GetLsegs());

    if (this.HasEndho()) clone.SetEndho(this.GetEndho());
    if (this.HasEndvo()) clone.SetEndvo(this.GetEndvo());
    if (this.HasStartho()) clone.SetStartho(this.GetStartho());
    if (this.HasStartvo()) clone.SetStartvo(this.GetStartvo());

    if (this.HasStartid()) clone.SetStartid(this.GetStartid());
    if (this.HasEndid()) clone.SetEndid(this.GetEndid());
    if (this.HasTstamp()) clone.SetTstamp(this.GetTstamp());
    if (this.HasTstamp2()) clone.SetTstamp2(this.GetTstamp2());
    if (this.HasStaff()) clone.SetStaff(this.GetStaff());
    if (this.HasPart()) clone.SetPart(this.GetPart());

    return clone;
  }
}

ObjectFactory.GetInstance().Register('phrase', ClassId.PHRASE, () => new Phrase());
