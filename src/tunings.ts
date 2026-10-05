/**
 * Typed runtime contract for the external tuning-library (`include/tuning-library/Tunings.h`).
 * The actual third-party implementation is intentionally not reimplemented here.
 */

export interface NotationMappingMock {
  count: number;
  names: string[];
}

export interface AbletonScaleMock {
  notationMapping: NotationMappingMock;
}

export class TuningError extends Error {}

export class TuningMock {
  public static readonly N = 512;
  public notationMapping: NotationMappingMock = { count: 0, names: [] };

  public constructor(scale?: AbletonScaleMock) {
    if (scale) this.notationMapping = {
      count: scale.notationMapping.count,
      names: [...scale.notationMapping.names],
    };
  }

  /**
   * Mock contract only. Production migration can bind this to the real tuning
   * algorithm once the vendor library itself is ported.
   */
  public midiNoteForNoteName(_noteName: string, _octave: number): number {
    throw new TuningError('Tunings::Tuning.midiNoteForNoteName() is not implemented in the external mock.');
  }
}

/** External parser contract used by CustomTuning. */
export function parseASCLData(_asclContents: string): AbletonScaleMock {
  throw new TuningError('Tunings::parseASCLData() is not implemented in the external mock.');
}
