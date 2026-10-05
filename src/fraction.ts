import { data_DURATION, DURATION_2048, DURATION_NONE, DURATION_maxima } from './vrvdef';
import { DurationMax, DurationMin, StringFormat, LogDebug } from './vrv';

/** Direct TypeScript translation of vrv::Fraction. */
export class Fraction {
  private m_numerator: number;
  private m_denominator: number;

  public constructor(num?: number);
  public constructor(num: number, denom: number);
  public constructor(duration: data_DURATION);
  public constructor(value: number = 0, denom?: number) {
    if (denom !== undefined) {
      this.m_numerator = value;
      if (denom === 0) {
        LogDebug('Denominator cannot be zero.');
        denom = 1;
      }
      this.m_denominator = denom;
      this.Reduce();
      return;
    }

    // The C++ overload set is (int) and (data_DURATION), both represented as
    // numbers in TypeScript. Preserve the observable integer constructor as the
    // default because the duration overload is explicitly selected by TS callers
    // through fromDuration().
    this.m_numerator = value;
    this.m_denominator = 1;
  }

  /** Explicit adaptation of Fraction(data_DURATION). */
  public static fromDuration(duration: data_DURATION): Fraction {
    duration = DurationMin(duration, DURATION_2048);
    duration = DurationMax(duration, DURATION_maxima);
    const den = Math.pow(2, duration + 1);
    return new Fraction(8, den);
  }

  public add(other: Fraction): Fraction {
    const num = this.m_numerator * other.m_denominator + other.m_numerator * this.m_denominator;
    const denom = this.m_denominator * other.m_denominator;
    return new Fraction(num, denom);
  }

  public subtract(other: Fraction): Fraction {
    const num = this.m_numerator * other.m_denominator - other.m_numerator * this.m_denominator;
    const denom = this.m_denominator * other.m_denominator;
    return new Fraction(num, denom);
  }

  public multiply(other: Fraction): Fraction {
    const num = this.m_numerator * other.m_numerator;
    const denom = this.m_denominator * other.m_denominator;
    return new Fraction(num, denom);
  }

  public divide(other: Fraction): Fraction {
    if (other.m_numerator === 0) {
      LogDebug('Cannot divide by zero.');
      return this;
    }
    const num = this.m_numerator * other.m_denominator;
    const denom = this.m_denominator * other.m_numerator;
    return new Fraction(num, denom);
  }

  public mod(other: Fraction): Fraction {
    if (other.m_numerator === 0) {
      LogDebug('Cannot divide by zero.');
      return this;
    }
    const commonDenominator = this.m_denominator * other.m_denominator;
    const leftNumerator = this.m_numerator * other.m_denominator;
    const rightNumerator = other.m_numerator * this.m_denominator;
    // C++ integer division truncates toward zero; Math.trunc matches that rule.
    const quotient = Math.trunc(leftNumerator / rightNumerator);
    const remainder = new Fraction(
      leftNumerator - quotient * rightNumerator,
      commonDenominator,
    );
    remainder.Reduce();
    return remainder;
  }

  public equals(other: Fraction): boolean {
    return this.m_numerator * other.m_denominator === other.m_numerator * this.m_denominator;
  }

  public compare(other: Fraction): -1 | 0 | 1 {
    const left = this.m_numerator * other.m_denominator;
    const right = other.m_numerator * this.m_denominator;
    return left < right ? -1 : left > right ? 1 : 0;
  }

  public GetNumerator(): number { return this.m_numerator; }
  public GetDenominator(): number { return this.m_denominator; }

  public ToDouble(): number {
    return this.m_numerator / this.m_denominator;
  }

  public ToString(): string {
    return StringFormat('%d/%d', this.m_numerator, this.m_denominator);
  }

  public ToDur(): [data_DURATION, Fraction] {
    if (this.m_numerator === 0) return [DURATION_NONE, new Fraction(0)];

    let value = Math.ceil(
      Math.log2((this.m_denominator / this.m_numerator) * 8),
    ) - 1;
    let dur = value as data_DURATION;
    dur = DurationMax(DURATION_maxima, dur) as data_DURATION;
    dur = DurationMin(DURATION_2048, dur) as data_DURATION;

    let remainder = this.subtract(Fraction.fromDuration(dur));
    if (remainder.compare(this) >= 0 || remainder.compare(new Fraction(0)) < 0) {
      remainder = new Fraction(0);
    }
    return [dur, remainder];
  }

  /** Adaptation of the C++ output-reference static method. */
  public static ReducePair(numerator: number, denominator: number): [number, number] {
    const fraction = new Fraction(numerator, denominator);
    return [fraction.GetNumerator(), fraction.GetDenominator()];
  }

  private Reduce(): void {
    if (this.m_denominator < 0) {
      this.m_numerator = -this.m_numerator;
      this.m_denominator = -this.m_denominator;
    }
    const gcdVal = gcd(this.m_numerator, this.m_denominator);
    if (gcdVal !== 1) {
      this.m_numerator = Math.trunc(this.m_numerator / gcdVal);
      this.m_denominator = Math.trunc(this.m_denominator / gcdVal);
    }
  }
}

function gcd(a: number, b: number): number {
  a = Math.abs(Math.trunc(a));
  b = Math.abs(Math.trunc(b));
  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a === 0 ? 1 : a;
}
