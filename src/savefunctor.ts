/**
 * savefunctor.ts — canonical translation of src-cpp/src/savefunctor.cpp
 * + src-cpp/include/vrv/savefunctor.h.
 *
 * `SaveFunctor` serializes the object tree by calling the appropriate
 * `Output` (`FileOutputStream`) method for each visited object:
 *  - `VisitObject` / `VisitObjectEnd` delegate to `WriteObject` /
 *    `WriteObjectEnd`, returning `FUNCTOR_STOP` on failure.
 *  - Layer-element visits (`VisitLayerElement*`) and `VisitTextLayoutElement*`
 *    are the `FunctorInterface` default forwardings of the Accid / MRest /
 *    Rest / RunningElement visits; C++ resolves them statically to
 *    `VisitObject*`, so the TS port calls the functor's `VisitObject*`
 *    fallback.
 *  - Generated/implicit children (Dots, Flag, TupletBracket, TupletNum,
 *    nested Accid, MRest-in-MSpace, Rest-in-Space, generated Text) are
 *    skipped with `FUNCTOR_CONTINUE` / `FUNCTOR_SIBLINGS`.
 *  - EditorialElement, Mdiv, MNum, RunningElement route through
 *    `Output.Skip` and return `FUNCTOR_SIBLINGS` when skipped.
 *  - Measures require measured music or neume lines to be written.
 *
 * `ImplementsEndInterface() == true` per the C++ header.
 */

import { Functor } from './functor.js';
import { FunctorCode, ClassId } from './vrvdef.js';
import type { Output } from './iobase.js';

/** TS structural boundary for objects visited by SaveFunctor. */
export interface SaveObjectLike {
  GetParent(): SaveObjectLike | null;
  Is(classId: number): boolean;
  IsGenerated?(): boolean;
  IsMeasuredMusic?(): boolean;
  IsNeumeLine?(): boolean;
}

export class SaveFunctor extends Functor {
  private m_output: Output;

  public constructor(output: Output) {
    super();
    if (!output) throw new Error('SaveFunctor requires an output');
    this.m_output = output;
  }

  public override ImplementsEndInterface(): boolean { return true; }

  /** C++ `FunctorInterface::VisitLayerElement` default: forwards to `VisitObject`. */
  private visitLayerElement(object: SaveObjectLike): FunctorCode {
    return this.VisitObject(object);
  }

  private visitLayerElementEnd(object: SaveObjectLike): FunctorCode {
    return this.VisitObjectEnd(object);
  }

  /** C++ `FunctorInterface::VisitTextLayoutElement` default: forwards to `VisitObject`. */
  private visitTextLayoutElement(object: SaveObjectLike): FunctorCode {
    return this.VisitObject(object);
  }

  private visitTextLayoutElementEnd(object: SaveObjectLike): FunctorCode {
    return this.VisitObjectEnd(object);
  }

  public VisitAccid(accid: SaveObjectLike): FunctorCode {
    // Ignore accid within accid added for showHidden
    if (accid.GetParent() && accid.GetParent()!.Is(ClassId.ACCID)) return FunctorCode.FUNCTOR_CONTINUE;

    return this.visitLayerElement(accid);
  }

  public VisitAccidEnd(accid: SaveObjectLike): FunctorCode {
    // Ignore accid within accid added for showHidden
    if (accid.GetParent() && accid.GetParent()!.Is(ClassId.ACCID)) return FunctorCode.FUNCTOR_CONTINUE;

    return this.visitLayerElementEnd(accid);
  }

  public VisitDots(_dots: SaveObjectLike): FunctorCode {
    // Ignore dots during save
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitDotsEnd(_dots: SaveObjectLike): FunctorCode {
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitEditorialElement(editorialElement: SaveObjectLike): FunctorCode {
    // When writing MEI Basic, only visible elements within editorial markup are saved
    if (this.m_output.Skip(editorialElement)) return FunctorCode.FUNCTOR_SIBLINGS;

    return this.VisitObject(editorialElement);
  }

  public VisitEditorialElementEnd(editorialElement: SaveObjectLike): FunctorCode {
    if (this.m_output.Skip(editorialElement)) return FunctorCode.FUNCTOR_SIBLINGS;

    return this.VisitObjectEnd(editorialElement);
  }

  public VisitFlag(_flag: SaveObjectLike): FunctorCode {
    // Ignore flags during save
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitFlagEnd(_flag: SaveObjectLike): FunctorCode {
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMdiv(mdiv: SaveObjectLike): FunctorCode {
    // Can be skipped in MEI output
    if (this.m_output.Skip(mdiv)) return FunctorCode.FUNCTOR_SIBLINGS;

    return this.VisitObject(mdiv);
  }

  public VisitMdivEnd(mdiv: SaveObjectLike): FunctorCode {
    // Can be skipped in MEI output
    if (this.m_output.Skip(mdiv)) return FunctorCode.FUNCTOR_SIBLINGS;

    return this.VisitObjectEnd(mdiv);
  }

  public VisitMeasure(measure: SaveObjectLike): FunctorCode {
    return measure.IsMeasuredMusic!() || measure.IsNeumeLine!() ? this.VisitObject(measure) : FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasureEnd(measure: SaveObjectLike): FunctorCode {
    return measure.IsMeasuredMusic!() || measure.IsNeumeLine!() ? this.VisitObjectEnd(measure) : FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMNum(mNum: SaveObjectLike): FunctorCode {
    // Can be skipped in MEI output
    if (this.m_output.Skip(mNum)) return FunctorCode.FUNCTOR_SIBLINGS;

    return this.VisitObject(mNum);
  }

  public VisitMNumEnd(mNum: SaveObjectLike): FunctorCode {
    // Can be skipped in MEI output
    if (this.m_output.Skip(mNum)) return FunctorCode.FUNCTOR_SIBLINGS;

    return this.VisitObjectEnd(mNum);
  }

  public VisitMRest(mRest: SaveObjectLike): FunctorCode {
    // Ignore mRest within mSpace added for showHidden
    if (mRest.GetParent() && mRest.GetParent()!.Is(ClassId.MSPACE)) return FunctorCode.FUNCTOR_CONTINUE;

    return this.visitLayerElement(mRest);
  }

  public VisitMRestEnd(mRest: SaveObjectLike): FunctorCode {
    // Ignore mRest within mSpace added for showHidden
    if (mRest.GetParent() && mRest.GetParent()!.Is(ClassId.MSPACE)) return FunctorCode.FUNCTOR_CONTINUE;

    return this.visitLayerElementEnd(mRest);
  }

  public VisitObject(object: SaveObjectLike): FunctorCode {
    if (!this.m_output.WriteObject(object)) {
      return FunctorCode.FUNCTOR_STOP;
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitObjectEnd(object: SaveObjectLike): FunctorCode {
    if (!this.m_output.WriteObjectEnd(object)) {
      return FunctorCode.FUNCTOR_STOP;
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitRest(rest: SaveObjectLike): FunctorCode {
    // Ignore rest within space added for showHidden
    if (rest.GetParent() && rest.GetParent()!.Is(ClassId.SPACE)) return FunctorCode.FUNCTOR_CONTINUE;

    return this.visitLayerElement(rest);
  }

  public VisitRestEnd(rest: SaveObjectLike): FunctorCode {
    // Ignore rest within space added for showHidden
    if (rest.GetParent() && rest.GetParent()!.Is(ClassId.SPACE)) return FunctorCode.FUNCTOR_CONTINUE;

    return this.visitLayerElementEnd(rest);
  }

  public VisitRunningElement(runningElement: SaveObjectLike): FunctorCode {
    // Can be skipped in MEI output
    if (this.m_output.Skip(runningElement)) return FunctorCode.FUNCTOR_SIBLINGS;

    return this.visitTextLayoutElement(runningElement);
  }

  public VisitRunningElementEnd(runningElement: SaveObjectLike): FunctorCode {
    // Can be skipped in MEI output
    if (this.m_output.Skip(runningElement)) return FunctorCode.FUNCTOR_SIBLINGS;

    return this.visitTextLayoutElementEnd(runningElement);
  }

  public VisitText(text: SaveObjectLike): FunctorCode {
    if (text.IsGenerated!()) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    else {
      return this.VisitObject(text);
    }
  }

  public VisitTextEnd(text: SaveObjectLike): FunctorCode {
    if (text.IsGenerated!()) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    else {
      return this.VisitObjectEnd(text);
    }
  }

  public VisitTupletBracket(_tupletBracket: SaveObjectLike): FunctorCode {
    // Ignore tuplet brackets during save
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTupletBracketEnd(_tupletBracket: SaveObjectLike): FunctorCode {
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTupletNum(_tupletNum: SaveObjectLike): FunctorCode {
    // Ignore tuplet numbers during save
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTupletNumEnd(_tupletNum: SaveObjectLike): FunctorCode {
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
