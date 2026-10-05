import { Fraction } from './fraction.js';

/**
 * Helper struct to store timemap entries.
 */
export class TimemapEntry {
  public tempo: number = -1000.0;
  public tstamp: number = 0.0;
  public notesOn: string[] = [];
  public notesOff: string[] = [];
  public restsOn: string[] = [];
  public restsOff: string[] = [];
  public measureOn: string = '';
}

export interface TimemapLike {
  ToJson(
    output: { value: string } | string,
    includeRests: boolean,
    includeMeasures: boolean,
    useFractions: boolean,
  ): void;
}

/**
 * This class holds a timemap for exporting onset / offset values.
 */
export class Timemap implements TimemapLike {
  private m_entries: { time: Fraction; entry: TimemapEntry }[] = [];

  public constructor() {
    this.Reset();
  }

  /**
   * Resets the timemap
   */
  public Reset(): void {
    this.m_entries = [];
  }

  /**
   * Return (and possibly add) an entry for the given time.
   */
  public GetEntry(time: Fraction): TimemapEntry {
    let low = 0;
    let high = this.m_entries.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      const cmp = time.compare(this.m_entries[mid].time);
      if (cmp === 0) {
        return this.m_entries[mid].entry;
      }
      if (cmp < 0) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    const entry = new TimemapEntry();
    this.m_entries.splice(low, 0, {
      time: new Fraction(time.GetNumerator(), time.GetDenominator()),
      entry,
    });
    return entry;
  }

  /**
   * Write the current timemap to a JSON string
   */
  public ToJson(
    output: { value: string } | string,
    includeRests: boolean,
    includeMeasures: boolean,
    useFractions: boolean,
  ): string {
    let currentTempo = -1000.0;
    const timemap: any[] = [];

    for (const { time: qstamp, entry } of this.m_entries) {
      const o: Record<string, any> = {};
      if (useFractions) {
        o['qfrac'] = Timemap.ToArray(qstamp);
      } else {
        o['qstamp'] = qstamp.ToDouble();
      }
      o['tstamp'] = entry.tstamp;

      // on / off
      if (entry.notesOn.length > 0) {
        o['on'] = [...entry.notesOn];
      }
      if (entry.notesOff.length > 0) {
        o['off'] = [...entry.notesOff];
      }

      // restsOn / restsOff
      if (includeRests) {
        if (entry.restsOn.length > 0) {
          o['restsOn'] = [...entry.restsOn];
        }
        if (entry.restsOff.length > 0) {
          o['restsOff'] = [...entry.restsOff];
        }
      }

      // tempo
      if (entry.tempo !== -1000.0) {
        const newTempo = entry.tempo;
        if (newTempo !== currentTempo) {
          currentTempo = newTempo;
          o['tempo'] = currentTempo;
        }
      }

      // measureOn
      if (includeMeasures && entry.measureOn.length > 0) {
        o['measureOn'] = entry.measureOn;
      }

      timemap.push(o);
    }

    const jsonStr = JSON.stringify(timemap);
    if (typeof output === 'object' && output !== null && 'value' in output) {
      output.value = jsonStr;
    }
    return jsonStr;
  }

  public static ToArray(fraction: Fraction): [number, number] {
    return [fraction.GetNumerator(), fraction.GetDenominator()];
  }
}
