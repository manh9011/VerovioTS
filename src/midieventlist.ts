import { MidiEvent } from './midievent';

/** Direct TypeScript translation of smf::MidiEventList. */
export class MidiEventList {
  protected list: Array<MidiEvent> = [];

  constructor();
  constructor(other: MidiEventList);
  constructor(other?: MidiEventList) {
    if (other) {
      this.list = other.list.map((event) => new MidiEvent(event));
    } else {
      this.reserve(1000);
    }
  }

  moveFrom(other: MidiEventList): this {
    this.list = other.list;
    other.list = [];
    return this;
  }

  dispose(): void {
    this.clear();
  }

  assign(other: MidiEventList): this {
    const tmp = this.list;
    this.list = other.list;
    other.list = tmp;
    return this;
  }

  at(index: number): MidiEvent {
    // std::vector::operator[] is unchecked; preserve direct indexing semantics.
    return this.list[index] as MidiEvent;
  }

  back(): MidiEvent {
    return this.list[this.list.length - 1] as MidiEvent;
  }

  last(): MidiEvent {
    return this.back();
  }

  getEvent(index: number): MidiEvent {
    return this.at(index);
  }

  clear(): void {
    for (const event of this.list) {
      event.unlinkEvent();
      event.dispose();
    }
    this.list.length = 0;
  }

  reserve(rsize: number): void {
    // JS arrays do not expose capacity; retain the observable no-op semantics.
    void rsize;
  }

  getEventCount(): number {
    return this.list.length;
  }

  getSize(): number {
    return this.list.length;
  }

  size(): number {
    return this.getSize();
  }

  removeEmpties(): void {
    this.list = this.list.filter((event) => {
      if (event.length === 0) {
        event.unlinkEvent();
        event.dispose();
        return false;
      }
      return true;
    });
  }

  linkEventPairs(): number {
    return this.linkNotePairsFIFO();
  }

  linkNotePairs(): number {
    return this.linkNotePairsFIFO();
  }

  linkNotePairsFIFO(): number {
    const noteons: MidiEvent[][][] = Array.from({ length: 16 }, () =>
      Array.from({ length: 128 }, () => [] as MidiEvent[]),
    );

    const contmap = new Array<{ onOff: number; index: number }>(128);
    for (let i = 0; i < 128; ++i) contmap[i] = { onOff: 0, index: 0 };
    const controllers = [64, 65, 66, 67, 68, 69, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 122];
    controllers.forEach((controller, index) => { contmap[controller] = { onOff: 1, index }; });

    const contevents: Array<Array<MidiEvent | null>> = Array.from({ length: 18 }, () => Array(16).fill(null));
    const oldstates = Array.from({ length: 18 }, () => Array(16).fill(-1));

    let counter = 0;
    for (const mev of this.list) {
      mev.unlinkEvent();
      if (mev.isNoteOn()) {
        noteons[mev.getChannel()][mev.getKeyNumber()].push(mev);
      } else if (mev.isNoteOff()) {
        const queue = noteons[mev.getChannel()][mev.getKeyNumber()];
        if (queue.length > 0) {
          const noteon = queue.shift() as MidiEvent;
          noteon.linkEvent(mev);
          counter++;
        }
      } else if (mev.isController()) {
        const contnum = mev.getP1();
        if (contnum >= 0 && contnum < contmap.length && contmap[contnum].onOff) {
          const conti = contmap[contnum].index;
          const channel = mev.getChannel();
          const contstate = mev.getP2() < 64 ? 0 : 1;
          if (oldstates[conti][channel] === -1 && contstate) {
            contevents[conti][channel] = mev;
            oldstates[conti][channel] = contstate;
          } else if (oldstates[conti][channel] === contstate) {
            // Redundant state.
          } else if (oldstates[conti][channel] === 0 && contstate) {
            contevents[conti][channel] = mev;
            oldstates[conti][channel] = contstate;
          } else if (oldstates[conti][channel] === 1 && contstate === 0) {
            contevents[conti][channel]?.linkEvent(mev);
            oldstates[conti][channel] = contstate;
            contevents[conti][channel] = mev;
          }
        }
      }
    }
    return counter;
  }

  linkNotePairsLIFO(): number {
    const noteons: MidiEvent[][][] = Array.from({ length: 16 }, () =>
      Array.from({ length: 128 }, () => [] as MidiEvent[]),
    );

    const contmap = new Array<{ onOff: number; index: number }>(128);
    for (let i = 0; i < 128; ++i) contmap[i] = { onOff: 0, index: 0 };
    const controllers = [64, 65, 66, 67, 68, 69, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 122];
    controllers.forEach((controller, index) => { contmap[controller] = { onOff: 1, index }; });

    const contevents: Array<Array<MidiEvent | null>> = Array.from({ length: 18 }, () => Array(16).fill(null));
    const oldstates = Array.from({ length: 18 }, () => Array(16).fill(-1));

    let counter = 0;
    for (const mev of this.list) {
      mev.unlinkEvent();
      if (mev.isNoteOn()) {
        noteons[mev.getChannel()][mev.getKeyNumber()].push(mev);
      } else if (mev.isNoteOff()) {
        const queue = noteons[mev.getChannel()][mev.getKeyNumber()];
        if (queue.length > 0) {
          const noteon = queue.pop() as MidiEvent;
          noteon.linkEvent(mev);
          counter++;
        }
      } else if (mev.isController()) {
        const contnum = mev.getP1();
        if (contnum >= 0 && contnum < contmap.length && contmap[contnum].onOff) {
          const conti = contmap[contnum].index;
          const channel = mev.getChannel();
          const contstate = mev.getP2() < 64 ? 0 : 1;
          if (oldstates[conti][channel] === -1 && contstate) {
            contevents[conti][channel] = mev;
            oldstates[conti][channel] = contstate;
          } else if (oldstates[conti][channel] === contstate) {
            // Redundant state.
          } else if (oldstates[conti][channel] === 0 && contstate) {
            contevents[conti][channel] = mev;
            oldstates[conti][channel] = contstate;
          } else if (oldstates[conti][channel] === 1 && contstate === 0) {
            contevents[conti][channel]?.linkEvent(mev);
            oldstates[conti][channel] = contstate;
            contevents[conti][channel] = mev;
          }
        }
      }
    }
    return counter;
  }

  clearLinks(): void {
    for (const event of this.list) event.unlinkEvent();
  }

  clearSequence(): void {
    for (const event of this.list) event.seq = 0;
  }

  markSequence(sequence = 1): number {
    for (const event of this.list) event.seq = sequence++;
    return sequence;
  }

  push(event: MidiEvent): number {
    return this.append(event);
  }

  push_back(event: MidiEvent): number {
    return this.append(event);
  }

  append(event: MidiEvent): number {
    this.list.push(new MidiEvent(event));
    return this.list.length - 1;
  }

  detach(): void {
    this.list.length = 0;
  }

  push_back_no_copy(event: MidiEvent): number {
    this.list.push(event);
    return this.list.length - 1;
  }

  data(): MidiEvent[] {
    return this.list;
  }

  sortNoteOnsBeforeOffs(): void {
    this.list.sort(MidiEventList.compareNoteOnsBeforeOffs);
  }

  sortNoteOffsBeforeOns(): void {
    // The upstream C++ implementation calls eventCompareNoteOnsBeforeOffs here.
    this.list.sort(MidiEventList.compareNoteOnsBeforeOffs);
  }

  sort(): void {
    this.sortNoteOnsBeforeOffs();
  }

  private static compareBase(aevent: MidiEvent, bevent: MidiEvent, noteOffsBeforeOns: boolean): number {
    if (aevent.tick < bevent.tick) return -1;
    if (aevent.tick > bevent.tick) return 1;
    if (aevent.seq !== 0 && bevent.seq !== 0) {
      if (aevent.seq < bevent.seq) return -1;
      if (aevent.seq > bevent.seq) return 1;
    }
    const aEot = aevent.getP0() === 0xff && aevent.getP1() === 0x2f;
    const bEot = bevent.getP0() === 0xff && bevent.getP1() === 0x2f;
    if (aEot) return 1;
    if (bEot) return -1;
    const aMeta = aevent.getP0() === 0xff;
    const bMeta = bevent.getP0() === 0xff;
    if (aMeta && !bMeta) return -1;
    if (!aMeta && bMeta) return 1;
    if (aMeta && bMeta) return 0;
    if (aevent.isNote() && !bevent.isNote()) return 1;
    if (!aevent.isNote() && bevent.isNote()) return -1;
    if (aevent.isNoteOff() && bevent.isNoteOn()) return noteOffsBeforeOns ? -1 : 1;
    if (aevent.isNoteOn() && bevent.isNoteOff()) return noteOffsBeforeOns ? 1 : -1;
    if (aevent.isNoteOn() && bevent.isNoteOn()) return Math.sign(aevent.getP1() - bevent.getP1());
    if (aevent.isNoteOff() && bevent.isNoteOff()) return Math.sign(aevent.getP1() - bevent.getP1());
    if (((aevent.getP0() & 0xf0) === 0xb0) && ((bevent.getP0() & 0xf0) === 0xb0)) {
      if (aevent.getP1() !== bevent.getP1()) return Math.sign(aevent.getP1() - bevent.getP1());
      return Math.sign(aevent.getP2() - bevent.getP2());
    }
    return 0;
  }

  private static compareNoteOnsBeforeOffs(a: MidiEvent, b: MidiEvent): number {
    return MidiEventList.compareBase(a, b, false);
  }

  private static compareNoteOffsBeforeOns(a: MidiEvent, b: MidiEvent): number {
    return MidiEventList.compareBase(a, b, true);
  }
}
