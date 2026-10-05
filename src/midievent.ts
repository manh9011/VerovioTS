import { MidiMessage } from './midimessage';

/** Direct TS translation of midifile::MidiEvent. */
export class MidiEvent extends MidiMessage {
  tick: number = 0;
  track: number = 0;
  seconds: number = 0.0;
  seq: number = 0;
  private m_eventlink: MidiEvent | null = null;

  constructor();
  constructor(command: number);
  constructor(command: number, p1: number);
  constructor(command: number, p1: number, p2: number);
  constructor(event: MidiEvent);
  constructor(aTime: number, aTrack: number, message: ArrayLike<number>);
  constructor(a?: number | MidiMessage, b?: number, c?: number | ArrayLike<number>) {
    super();
    if (a instanceof MidiEvent) {
      this.copyFrom(a);
      return;
    }
    if (typeof a === 'number' && c !== undefined && typeof c !== 'number') {
      this.track = b ?? 0;
      this.tick = a;
      this.seconds = 0.0;
      this.seq = 0;
      this.m_eventlink = null;
      this.setMessage(c);
      return;
    }
    if (typeof a === 'number') {
      this.push(a & 0xff);
      if (b !== undefined && c === undefined) this.push(b & 0xff);
      if (b !== undefined && typeof c === 'number') this.push(b & 0xff, c & 0xff);
    }
    this.clearVariables();
  }

  dispose(): void {
    this.unlinkEvent();
    this.track = -1;
    this.tick = -1;
    this.seconds = -1.0;
    this.seq = -1;
    this.length = 0;
  }

  clearVariables(): void {
    this.track = 0;
    this.tick = 0;
    this.seconds = 0.0;
    this.seq = 0;
    this.m_eventlink = null;
  }

  copyFrom(event: MidiEvent): this {
    if (this === event) return this;
    this.tick = event.tick;
    this.track = event.track;
    this.seconds = event.seconds;
    this.seq = event.seq;
    this.m_eventlink = null;
    this.length = 0;
    this.push(...event);
    return this;
  }

  assignMessage(message: MidiMessage): this {
    if (this === message) return this;
    this.clearVariables();
    this.setMessage(message);
    return this;
  }

  assignBytes(bytes: ArrayLike<number>): this {
    this.clearVariables();
    this.setMessage(bytes);
    return this;
  }

  unlinkEvent(): void {
    if (this.m_eventlink === null) return;
    const other = this.m_eventlink;
    this.m_eventlink = null;
    other.unlinkEvent();
  }

  unlinkEvents(): void { this.unlinkEvent(); }

  linkEvent(event: MidiEvent): void {
    if (event.m_eventlink !== null) event.unlinkEvent();
    if (this.m_eventlink !== null) this.m_eventlink.unlinkEvent();
    this.unlinkEvent();
    event.m_eventlink = this;
    this.m_eventlink = event;
  }

  linkEvents(event: MidiEvent): void { this.linkEvent(event); }

  isLinked(): number { return this.m_eventlink === null ? 0 : 1; }
  hasLink(): number { return this.isLinked(); }

  getLinkedEvent(): MidiEvent | null { return this.m_eventlink; }

  getTickDuration(): number {
    const event = this.getLinkedEvent();
    if (event === null) return 0;
    return Math.abs(event.tick - this.tick);
  }

  getDurationInSeconds(): number {
    const event = this.getLinkedEvent();
    if (event === null) return 0;
    return Math.abs(event.seconds - this.seconds);
  }

  toStringWithTick(): string {
    return `${this.tick}(${this.toString()})`;
  }
}

export function midiEventToString(event: MidiEvent): string {
  return event.toStringWithTick();
}
