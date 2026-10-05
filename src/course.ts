import { ObjectFactory, VrvObject } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { Functor, ConstFunctor } from './functor.js';

interface CourseFunctorLike { VisitCourse(course: Course): FunctorCode; VisitCourseEnd(course: Course): FunctorCode; }
interface CourseConstFunctorLike { VisitCourse(course: Course): FunctorCode; VisitCourseEnd(course: Course): FunctorCode; }

export type AccidentalWritten = number;
export const ACCIDENTAL_WRITTEN_NONE = 0;
export const PITCHNAME_NONE = 0;
export const MEI_UNSET_OCT = -0x7fffffff;

/** Pure-TS adaptation of libmei AttAccidental used by Course. */
export class AccidentalAttributes {
  private m_accid: AccidentalWritten = ACCIDENTAL_WRITTEN_NONE;
  public ResetAccidental(): void { this.m_accid = ACCIDENTAL_WRITTEN_NONE; }
  public SetAccid(value: AccidentalWritten): void { this.m_accid = value; }
  public GetAccid(): AccidentalWritten { return this.m_accid; }
  public HasAccid(): boolean { return this.m_accid !== ACCIDENTAL_WRITTEN_NONE; }
}

/** Pure-TS adaptation of libmei AttNNumberLike used by Course. */
export class NNumberLikeAttributes {
  private m_n = '';
  public ResetNNumberLike(): void { this.m_n = ''; }
  public SetN(value: string): void { this.m_n = value; }
  public GetN(): string { return this.m_n; }
  public HasN(): boolean { return this.m_n !== ''; }
}

/** Pure-TS adaptation of libmei AttOctave used by Course. */
export class OctaveAttributes {
  private m_oct = MEI_UNSET_OCT;
  public ResetOctave(): void { this.m_oct = MEI_UNSET_OCT; }
  public SetOct(value: number): void { this.m_oct = value; }
  public GetOct(): number { return this.m_oct; }
  public HasOct(): boolean { return this.m_oct !== MEI_UNSET_OCT; }
}

/** Pure-TS adaptation of libmei AttPitch used by Course. */
export class PitchAttributes {
  private m_pname = PITCHNAME_NONE;
  public ResetPitch(): void { this.m_pname = PITCHNAME_NONE; }
  public SetPname(value: number): void { this.m_pname = value; }
  public GetPname(): number { return this.m_pname; }
  public HasPname(): boolean { return this.m_pname !== PITCHNAME_NONE; }
}

const ATT_ACCIDENTAL = 92;
const ATT_NNUMBERLIKE = 168;
const ATT_OCTAVE = 172;
const ATT_PITCH = 183;

/** Pure-TypeScript translation of Verovio's `<course>` element. */
export class Course extends VrvObject {
  private accidental: AccidentalAttributes | undefined;
  private nNumberLike: NNumberLikeAttributes | undefined;
  private octave: OctaveAttributes | undefined;
  private pitch: PitchAttributes | undefined;

  public constructor() {
    super(ClassId.COURSE);
    this.RegisterAttClass(ATT_ACCIDENTAL);
    this.RegisterAttClass(ATT_NNUMBERLIKE);
    this.RegisterAttClass(ATT_OCTAVE);
    this.RegisterAttClass(ATT_PITCH);
    this.ResetCourseAttributes();
  }

  public override Clone(): VrvObject {
    const clone = new Course();
    clone.AssignFrom(this);
    return clone;
  }

  public override Reset(): void {
    // C++ Course::Reset calls Object::Reset first, then each attribute reset.
    // Avoid relying on virtual dispatch from VrvObject's constructor.
    super.Reset();
    this.ResetCourseAttributes();
  }

  private ResetCourseAttributes(): void {
    // VrvObject's C++-compatible Init path dispatches Reset() during base construction.
    // TS derived fields are initialized only after super(), so lazily create the
    // attribute components on that first virtual Reset call.
    this.accidental ??= new AccidentalAttributes();
    this.nNumberLike ??= new NNumberLikeAttributes();
    this.octave ??= new OctaveAttributes();
    this.pitch ??= new PitchAttributes();
    this.accidental!.ResetAccidental();
    this.nNumberLike!.ResetNNumberLike();
    this.octave!.ResetOctave();
    this.pitch!.ResetPitch();
  }

  public override GetClassName(): string { return 'course'; }

  public IsSupportedChild(_classId: number): boolean {
    return false;
  }

  public ResetAccidental(): void { this.accidental!.ResetAccidental(); }
  public SetAccid(value: AccidentalWritten): void { this.accidental!.SetAccid(value); }
  public GetAccid(): AccidentalWritten { return this.accidental!.GetAccid(); }
  public HasAccid(): boolean { return this.accidental!.HasAccid(); }

  public ResetNNumberLike(): void { this.nNumberLike!.ResetNNumberLike(); }
  public SetN(value: string): void { this.nNumberLike!.SetN(value); }
  public GetN(): string { return this.nNumberLike!.GetN(); }
  public HasN(): boolean { return this.nNumberLike!.HasN(); }

  public ResetOctave(): void { this.octave!.ResetOctave(); }
  public SetOct(value: number): void { this.octave!.SetOct(value); }
  public GetOct(): number { return this.octave!.GetOct(); }
  public HasOct(): boolean { return this.octave!.HasOct(); }

  public ResetPitch(): void { this.pitch!.ResetPitch(); }
  public SetPname(value: number): void { this.pitch!.SetPname(value); }
  public GetPname(): number { return this.pitch!.GetPname(); }
  public HasPname(): boolean { return this.pitch!.HasPname(); }

  public override Accept(functor: Functor): FunctorCode {
    return visitor(functor, 'VisitCourse', this);
  }

  public AcceptConst(functor: ConstFunctor): FunctorCode {
    return visitor(functor, 'VisitCourse', this);
  }

  public override AcceptEnd(functor: Functor): FunctorCode {
    return visitor(functor, 'VisitCourseEnd', this);
  }

  public AcceptEndConst(functor: ConstFunctor): FunctorCode {
    return visitor(functor, 'VisitCourseEnd', this);
  }
}

function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') {
    return (fn as (arg: unknown) => FunctorCode).call(functor, self);
  }
  const fallback = method.endsWith('End') ? f.VisitObjectEnd : f.VisitObject;
  if (typeof fallback === 'function') {
    return (fallback as (arg: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('course', ClassId.COURSE, () => new Course());
