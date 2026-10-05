import { MidiEvent } from './midievent';
import { MidiEventList } from './midieventlist';
import { Binasc } from './binasc';

export const TRACK_STATE_SPLIT = 0;
export const TRACK_STATE_JOINED = 1;
export const TIME_STATE_DELTA = 0;
export const TIME_STATE_ABSOLUTE = 1;

export interface TickTime {
  tick: number;
  seconds: number;
}

/**
 * Partial direct translation of smf::MidiFile.
 *
 * This pass intentionally covers the stateful track/event core and the exact
 * base64 helpers. Binary SMF stream parsing/writing and physical-time analysis
 * remain in-progress and are not silently replaced with simplified behavior.
 */
export class MidiFile {
  protected m_events: MidiEventList[] = [new MidiEventList()];
  protected m_ticksPerQuarterNote = 120;
  protected m_theTrackState = TRACK_STATE_SPLIT;
  protected m_theTimeState = TIME_STATE_ABSOLUTE;
  protected m_readFileName = '';
  protected m_timemapvalid = false;
  protected m_timemap: TickTime[] = [];
  protected m_rwstatus = true;
  protected m_linkedEventsQ = false;

  constructor(filename?: string) {
    if (filename !== undefined) this.setFilename(filename);
  }

  copyFrom(other: MidiFile): this {
    if (this === other) return this;
    this.m_events = other.m_events.map((track) => new MidiEventList(track));
    this.m_ticksPerQuarterNote = other.m_ticksPerQuarterNote;
    this.m_theTrackState = other.m_theTrackState;
    this.m_theTimeState = other.m_theTimeState;
    this.m_readFileName = other.m_readFileName;
    this.m_timemapvalid = other.m_timemapvalid;
    this.m_timemap = other.m_timemap.map((x) => ({ ...x }));
    this.m_rwstatus = other.m_rwstatus;
    this.m_linkedEventsQ = other.m_linkedEventsQ;
    if (this.m_linkedEventsQ) this.linkEventPairs();
    return this;
  }

  clone(): MidiFile {
    return new MidiFile().copyFrom(this);
  }

  status(): boolean {
    return this.m_rwstatus;
  }

  getTrackCount(): number { return this.m_events.length; }
  getNumTracks(): number { return this.getTrackCount(); }
  size(): number { return this.getTrackCount(); }

  getTrack(track: number): MidiEventList {
    return this.m_events[track];
  }

  operatorAt(track: number): MidiEventList { return this.getTrack(track); }

  removeEmpties(): void {
    for (const events of this.m_events) events.removeEmpties();
  }

  markSequence(track?: number, sequence = 1): void {
    if (track === undefined) {
      let next = sequence;
      for (const events of this.m_events) next = events.markSequence(next);
      void next;
      return;
    }
    this.m_events[track].markSequence(sequence);
  }

  clearSequence(track?: number): void {
    if (track === undefined) {
      for (const events of this.m_events) events.clearSequence();
      return;
    }
    this.m_events[track].clearSequence();
  }

  joinTracks(): void {
    if (this.getTrackState() === TRACK_STATE_JOINED || this.getNumTracks() === 1) {
      this.m_theTrackState = TRACK_STATE_JOINED;
      return;
    }

    const oldTimeState = this.getTickState();
    if (oldTimeState === TIME_STATE_DELTA) this.makeAbsoluteTicks();

    const joined = new MidiEventList();
    for (const events of this.m_events) {
      for (const event of events.data()) joined.push_back_no_copy(event);
    }

    // Ownership is transferred from the split lists to the joined list.
    for (const events of this.m_events) events.detach();
    this.m_events = [joined];
    this.sortTracksNoteOnsBeforeOffs();
    if (oldTimeState === TIME_STATE_DELTA) this.makeDeltaTicks();
    this.m_theTrackState = TRACK_STATE_JOINED;
  }

  splitTracks(): void {
    if (this.getTrackState() === TRACK_STATE_SPLIT) return;
    const oldTimeState = this.getTickState();
    if (oldTimeState === TIME_STATE_DELTA) this.makeAbsoluteTicks();

    const olddata = this.m_events[0];
    let maxTrack = 0;
    for (const event of olddata.data()) maxTrack = Math.max(maxTrack, event.track);
    const trackCount = maxTrack + 1;
    if (trackCount <= 1) return;

    this.m_events = Array.from({ length: trackCount }, () => new MidiEventList());
    for (const event of olddata.data()) this.m_events[event.track].push_back_no_copy(event);
    olddata.detach();
    if (oldTimeState === TIME_STATE_DELTA) this.makeDeltaTicks();
    this.m_theTrackState = TRACK_STATE_SPLIT;
  }

  splitTracksByChannel(): void {
    this.joinTracks();
    if (this.getTrackState() === TRACK_STATE_SPLIT) return;
    const oldTimeState = this.getTickState();
    if (oldTimeState === TIME_STATE_DELTA) this.makeAbsoluteTicks();

    const olddata = this.m_events[0];
    let maxChannel = 0;
    for (const event of olddata.data()) {
      if (event.length === 0) continue;
      const p0 = event.getP0();
      if ((p0 & 0xf0) === 0xf0) continue;
      maxChannel = Math.max(maxChannel, p0 & 0x0f);
    }
    const trackCount = maxChannel + 2;
    if (trackCount <= 1) return;

    this.m_events = Array.from({ length: trackCount }, () => new MidiEventList());
    for (const event of olddata.data()) {
      let trackValue = 0;
      const p0 = event.getP0();
      if ((p0 & 0xf0) !== 0xf0) trackValue = (p0 & 0x0f) + 1;
      this.m_events[trackValue].push_back_no_copy(event);
    }
    olddata.detach();
    if (oldTimeState === TIME_STATE_DELTA) this.makeDeltaTicks();
    this.m_theTrackState = TRACK_STATE_SPLIT;
  }

  getTrackState(): number { return this.m_theTrackState; }
  hasJoinedTracks(): number { return this.m_theTrackState === TRACK_STATE_JOINED ? 1 : 0; }
  hasSplitTracks(): number { return this.m_theTrackState === TRACK_STATE_SPLIT ? 1 : 0; }

  getSplitTrack(track: number, index?: number): number {
    if (this.hasSplitTracks()) return track;
    const eventIndex = index ?? track;
    return this.m_events[0].getEvent(eventIndex).track;
  }

  makeDeltaTicks(): void {
    if (this.isDeltaTicks()) return;
    for (const events of this.m_events) {
      let previous = 0;
      const data = events.data();
      if (data.length === 0) continue;
      previous = data[0].tick;
      for (let i = 1; i < data.length; i++) {
        const current = data[i].tick;
        const delta = current - previous;
        if (delta < 0) {
          throw new Error(`Negative delta tick value: ${delta}; timestamps must be sorted first.`);
        }
        data[i].tick = delta;
        previous = current;
      }
    }
    this.m_theTimeState = TIME_STATE_DELTA;
  }

  deltaTicks(): void { this.makeDeltaTicks(); }

  makeAbsoluteTicks(): void {
    if (this.isAbsoluteTicks()) return;
    for (const events of this.m_events) {
      const data = events.data();
      if (data.length === 0) continue;
      let absolute = data[0].tick;
      for (let i = 1; i < data.length; i++) {
        absolute += data[i].tick;
        data[i].tick = absolute;
      }
    }
    this.m_theTimeState = TIME_STATE_ABSOLUTE;
  }

  absoluteTicks(): void { this.makeAbsoluteTicks(); }
  getTickState(): number { return this.m_theTimeState; }
  isDeltaTicks(): boolean { return this.m_theTimeState === TIME_STATE_DELTA; }
  isAbsoluteTicks(): boolean { return this.m_theTimeState === TIME_STATE_ABSOLUTE; }

  getFileDurationInTicks(): number {
    const revert = this.isDeltaTicks();
    if (revert) this.makeAbsoluteTicks();
    let output = 0;
    for (const events of this.m_events) {
      const data = events.data();
      if (data.length > 0) output = Math.max(output, data[data.length - 1].tick);
    }
    if (revert) this.makeDeltaTicks();
    return output;
  }

  getFileDurationInQuarters(): number {
    return this.getFileDurationInTicks() / this.getTicksPerQuarterNote();
  }


  getFileDurationInSeconds(): number {
    if (!this.m_timemapvalid) {
      this.buildTimeMap();
      if (!this.m_timemapvalid) return -1.0;
    }
    const revert = this.isDeltaTicks();
    if (revert) this.makeAbsoluteTicks();
    let output = 0.0;
    for (const events of this.m_events) {
      const data = events.data();
      if (data.length > 0) output = Math.max(output, data[data.length - 1].seconds);
    }
    if (revert) this.makeDeltaTicks();
    return output;
  }

  doTimeAnalysis(): void {
    this.buildTimeMap();
  }

  getTimeInSeconds(track: number, index: number): number;
  getTimeInSeconds(tick: number): number;
  getTimeInSeconds(trackOrTick: number, index?: number): number {
    const tickvalue = index === undefined ? trackOrTick : this.getEvent(trackOrTick, index).tick;
    if (!this.m_timemapvalid) {
      this.buildTimeMap();
      if (!this.m_timemapvalid) return -1.0;
    }
    for (const entry of this.m_timemap) {
      if (entry.tick === tickvalue) return entry.seconds;
    }
    return this.linearSecondInterpolationAtTick(tickvalue);
  }

  getAbsoluteTickTime(seconds: number): number {
    if (!this.m_timemapvalid) {
      this.buildTimeMap();
      if (!this.m_timemapvalid) return -1.0;
    }
    for (const entry of this.m_timemap) {
      if (entry.seconds === seconds) return entry.tick;
    }
    return this.linearTickInterpolationAtSecond(seconds);
  }

  linkNotePairsFIFO(): number {
    let sum = 0;
    for (const events of this.m_events) sum += events.linkNotePairsFIFO();
    this.m_linkedEventsQ = true;
    return sum;
  }

  linkNotePairsLIFO(): number {
    let sum = 0;
    for (const events of this.m_events) sum += events.linkNotePairsLIFO();
    this.m_linkedEventsQ = true;
    return sum;
  }

  linkNotePairs(): number { return this.linkNotePairsFIFO(); }
  linkEventPairs(): number { return this.linkNotePairsFIFO(); }

  clearLinks(): void {
    for (const events of this.m_events) events.clearLinks();
    this.m_linkedEventsQ = false;
  }

  setFilename(name: string): void {
    const loc = name.lastIndexOf('/');
    this.m_readFileName = loc >= 0 ? name.slice(loc + 1) : name;
  }

  getFilename(): string { return this.m_readFileName; }

  addEvent(track: number, tick: number, midiData: ArrayLike<number>): MidiEvent {
    this.m_timemapvalid = false;
    const event = new MidiEvent();
    // C++ takes int ticks at every add* boundary (MidiFile.h); truncate here
    // so delta/absolute conversions operate on ints like smf.
    event.tick = Math.trunc(tick);
    event.track = track;
    event.setMessage(midiData);
    this.m_events[track].push_back_no_copy(event);
    return event;
  }

  addEventCopy(event: MidiEvent): MidiEvent {
    if (this.getTrackState() === TRACK_STATE_JOINED) {
      this.m_events[0].push(event);
      return this.m_events[0].back();
    }
    this.m_events[event.track].push(event);
    return this.m_events[event.track].back();
  }

  addEventToTrack(track: number, event: MidiEvent): MidiEvent {
    if (this.getTrackState() === TRACK_STATE_JOINED) {
      this.m_events[0].push(event);
      this.m_events[0].back().track = track;
      return this.m_events[0].back();
    }
    this.m_events[track].push(event);
    this.m_events[track].back().track = track;
    return this.m_events[track].back();
  }

  addMetaEvent(track: number, tick: number, type: number, data: ArrayLike<number> | string): MidiEvent {
    const payload = typeof data === 'string'
      ? Array.from(data, (c) => c.charCodeAt(0) & 0xff)
      : Array.from(data, (v) => v & 0xff);
    const vlv = MidiFile.makeVLV(payload.length);
    return this.addEvent(track, tick, [0xff, type & 0x7f, ...vlv, ...payload]);
  }

  addText(track: number, tick: number, text: string): MidiEvent { return this.addMetaEvent(track, tick, 1, text); }
  addCopyright(track: number, tick: number, text: string): MidiEvent { return this.addMetaEvent(track, tick, 2, text); }
  addTrackName(track: number, tick: number, text: string): MidiEvent { return this.addMetaEvent(track, tick, 3, text); }
  addInstrumentName(track: number, tick: number, text: string): MidiEvent { return this.addMetaEvent(track, tick, 4, text); }
  addLyric(track: number, tick: number, text: string): MidiEvent { return this.addMetaEvent(track, tick, 5, text); }
  addMarker(track: number, tick: number, text: string): MidiEvent { return this.addMetaEvent(track, tick, 6, text); }
  addCue(track: number, tick: number, text: string): MidiEvent { return this.addMetaEvent(track, tick, 7, text); }

  addTempo(track: number, tick: number, tempo: number): MidiEvent {
    const microseconds = Math.floor(60000000.0 / tempo + 0.5);
    return this.addMetaEvent(track, tick, 0x51, [
      (microseconds >>> 16) & 0xff,
      (microseconds >>> 8) & 0xff,
      microseconds & 0xff,
    ]);
  }

  addKeySignature(track: number, tick: number, fifths: number, mode = false): MidiEvent {
    return this.addMetaEvent(track, tick, 0x59, [fifths & 0xff, mode ? 1 : 0]);
  }

  addTimeSignature(track: number, tick: number, top: number, bottom: number,
    clocksPerClick = 24, num32ndsPerQuarter = 8): MidiEvent {
    let logBottom = 0;
    let value = Math.max(1, bottom);
    while (value > 1) { value = Math.floor(value / 2); logBottom++; }
    return this.addMetaEvent(track, tick, 0x58,
      [top & 0xff, logBottom & 0xff, clocksPerClick & 0xff, num32ndsPerQuarter & 0xff]);
  }

  addCompoundTimeSignature(track: number, tick: number, top: number, bottom: number,
    clocksPerClick = 36, num32ndsPerQuarter = 8): MidiEvent {
    return this.addTimeSignature(track, tick, top, bottom, clocksPerClick, num32ndsPerQuarter);
  }

  addNoteOn(track: number, tick: number, channel: number, key: number, velocity: number): MidiEvent {
    return this.addEvent(track, tick, [0x90 | MidiFile.clamp(channel, 0, 15), key & 0x7f, velocity & 0x7f]);
  }

  addNoteOff(track: number, tick: number, channel: number, key: number, velocity?: number): MidiEvent {
    // ponytail: 5-arg path emits 0x80 running-status NoteOff; bare 4-arg path emits
    // 0x90 vel-0 NoteOn (smf::MidiMessage::makeNoteOff(channel,key) parity).
    if (velocity === undefined) {
      return this.addEvent(track, tick, [0x90 | MidiFile.clamp(channel, 0, 15), key & 0x7f, 0]);
    }
    return this.addEvent(track, tick, [0x80 | MidiFile.clamp(channel, 0, 15), key & 0x7f, velocity & 0x7f]);
  }

  addController(track: number, tick: number, channel: number, num: number, value: number): MidiEvent {
    return this.addEvent(track, tick, [0xb0 | MidiFile.clamp(channel, 0, 15), num & 0x7f, value & 0x7f]);
  }

  addPatchChange(track: number, tick: number, channel: number, patch: number): MidiEvent {
    return this.addEvent(track, tick, [0xc0 | MidiFile.clamp(channel, 0, 15), patch & 0x7f]);
  }

  addTimbre(track: number, tick: number, channel: number, patch: number): MidiEvent {
    return this.addPatchChange(track, tick, channel, patch);
  }

  addPitchBend(track: number, tick: number, channel: number, amount: number): MidiEvent {
    this.m_timemapvalid = false;
    const bounded = Math.max(0, Math.min(0x3fff, Math.floor((amount + 1.0) * 8192 + 0.5)));
    return this.addEvent(track, tick, [
      0xe0 | MidiFile.clamp(channel, 0, 15),
      bounded & 0x7f,
      (bounded >>> 7) & 0x7f,
    ]);
  }

  setPitchBendRange(track: number, tick: number, channel: number, range: number): void {
    range = Math.abs(range);
    if (range > 24.0) range = 24.0;
    const irange = Math.trunc(range);
    const cents = Math.trunc((range - irange) * 100.0 + 0.5);
    this.addController(track, tick, channel, 101, 0);
    this.addController(track, tick, channel, 100, 0);
    this.addController(track, tick, channel, 6, irange);
    this.addController(track, tick, channel, 38, cents);
  }

  addSustain(track: number, tick: number, channel: number, value: number): MidiEvent { return this.addController(track, tick, channel, 64, value); }
  addSustainPedal(track: number, tick: number, channel: number, value: number): MidiEvent { return this.addSustain(track, tick, channel, value); }
  addSustainOn(track: number, tick: number, channel: number): MidiEvent { return this.addSustain(track, tick, channel, 127); }
  addSustainPedalOn(track: number, tick: number, channel: number): MidiEvent { return this.addSustainOn(track, tick, channel); }
  addSustainOff(track: number, tick: number, channel: number): MidiEvent { return this.addSustain(track, tick, channel, 0); }
  addSustainPedalOff(track: number, tick: number, channel: number): MidiEvent { return this.addSustainOff(track, tick, channel); }

  addTrack(): number;
  addTrack(count: number): number;
  addTrack(count = 1): number {
    const start = this.getNumTracks();
    for (let i = 0; i < count; i++) this.m_events.push(new MidiEventList());
    return start + count - 1;
  }

  addTracks(count: number): number { return this.addTrack(count); }

  allocateEvents(track: number, size: number): void {
    this.m_events[track].reserve(size);
  }

  deleteTrack(track: number): void {
    const length = this.getNumTracks();
    if (track < 0 || track >= length || length === 1) return;
    this.m_events[track].clear();
    this.m_events.splice(track, 1);
  }

  clear(): void {
    for (const events of this.m_events) events.clear();
    this.m_events = [new MidiEventList()];
    this.m_timemapvalid = false;
    this.m_timemap = [];
    this.m_theTrackState = TRACK_STATE_SPLIT;
    this.m_theTimeState = TIME_STATE_ABSOLUTE;
    this.m_linkedEventsQ = false;
  }

  erase(): void { this.clear(); }

  clearNoDeallocate(): void {
    for (const events of this.m_events) events.detach();
  }

  getEvent(track: number, index: number): MidiEvent { return this.m_events[track].getEvent(index); }
  getEventCount(track: number): number { return this.m_events[track].size(); }
  getNumEvents(track: number): number { return this.getEventCount(track); }

  mergeTracks(track1: number, track2: number): void {
    const oldTimeState = this.getTickState();
    if (oldTimeState === TIME_STATE_DELTA) this.makeAbsoluteTicks();
    const merged = new MidiEventList();
    for (const e of this.m_events[track1].data()) merged.push_back(new MidiEvent(e));
    for (const e of this.m_events[track2].data()) {
      const copy = new MidiEvent(e);
      copy.track = track1;
      merged.push_back_no_copy(copy);
    }
    merged.sortNoteOnsBeforeOffs();
    this.m_events[track1].clear();
    this.m_events.splice(track2, 1);
    this.m_events[track1] = merged;
    for (let i = track1; i < this.m_events.length; i++) {
      for (const e of this.m_events[i].data()) e.track = i;
    }
    if (oldTimeState === TIME_STATE_DELTA) this.makeDeltaTicks();
  }

  setTicksPerQuarterNote(ticks: number): void { this.m_ticksPerQuarterNote = ticks; }
  setTPQ(ticks: number): void { this.setTicksPerQuarterNote(ticks); }
  getTicksPerQuarterNote(): number { return this.m_ticksPerQuarterNote; }
  getTPQ(): number { return this.getTicksPerQuarterNote(); }
  setMillisecondTicks(): void { this.m_ticksPerQuarterNote = 0xe728; }

  sortTrackNoteOnsBeforeOffs(track: number): void {
    if (track >= 0 && track < this.getTrackCount()) this.m_events[track].sortNoteOnsBeforeOffs();
  }

  sortTrackNoteOffsBeforeOns(track: number): void {
    if (track >= 0 && track < this.getTrackCount()) this.m_events[track].sortNoteOffsBeforeOns();
  }

  sortTrack(track: number): void { this.sortTrackNoteOnsBeforeOffs(track); }
  sortTracksNoteOnsBeforeOffs(): void {
    if (!this.isAbsoluteTicks()) return;
    for (const events of this.m_events) events.sortNoteOnsBeforeOffs();
  }
  sortTracksNoteOffsBeforeOns(): void {
    if (!this.isAbsoluteTicks()) return;
    for (const events of this.m_events) events.sortNoteOffsBeforeOns();
  }
  sortTracks(): void { this.sortTracksNoteOnsBeforeOffs(); }

  getTrackCountAsType1(): number {
    if (this.getTrackState() === TRACK_STATE_JOINED) {
      let output = 0;
      for (const event of this.m_events[0].data()) output = Math.max(output, event.track);
      return output + 1;
    }
    return this.getNumTracks();
  }

  /** Read a binary SMF from bytes. A string is treated as a binary byte string. */
  read(input: Uint8Array | ArrayBuffer | string): boolean {
    this.m_rwstatus = true;
    const bytes = MidiFile.toBytes(input);
    if (bytes.length === 0) { this.m_rwstatus = false; return false; }
    if (bytes[0] !== 0x4d) {
      // Match C++ read(): non-MThd input is presumed to be binasc.
      // Binasc ASCII input remains delegated to the pending Binasc I/O pass.
      this.m_rwstatus = false;
      return false;
    }
    this.m_rwstatus = this.readSmf(bytes);
    return this.m_rwstatus;
  }

  readBase64(base64data: string): boolean {
    return this.read(MidiFile.base64DecodeBytes(base64data));
  }

  readSmf(input: Uint8Array | ArrayBuffer | string): boolean {
    const bytes = MidiFile.toBytes(input);
    let pos = 0;
    const readU8 = (): number => {
      if (pos >= bytes.length) { this.m_rwstatus = false; return 0; }
      return bytes[pos++];
    };
    const readU16BE = (): number => (readU8() << 8) | readU8();
    const readU32BE = (): number => (((readU8() << 24) >>> 0) | (readU8() << 16) | (readU8() << 8) | readU8()) >>> 0;
    const readVlv = (): number => {
      const b = new Array<number>(5).fill(0);
      for (let i = 0; i < 5; i++) {
        b[i] = readU8();
        if (!this.m_rwstatus) return 0;
        if (b[i] < 0x80) break;
      }
      return this.unpackVLV(b[0], b[1], b[2], b[3], b[4]);
    };

    this.m_rwstatus = true;
    if (bytes.length - pos < 4 || String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== 'MThd') {
      this.m_rwstatus = false; return false;
    }
    pos = 4;
    const headerSize = readU32BE();
    if (!this.m_rwstatus || headerSize !== 6 || pos + headerSize > bytes.length) { this.m_rwstatus = false; return false; }
    const format = readU16BE();
    if (format !== 0 && format !== 1) { this.m_rwstatus = false; return false; }
    const tracks = readU16BE();
    if (format === 0 && tracks !== 1) { this.m_rwstatus = false; return false; }
    const division = readU16BE();
    this.clear();
    this.m_events = Array.from({ length: tracks }, () => new MidiEventList());
    for (const t of this.m_events) t.reserve(10000);
    if (division >= 0x8000) {
      let fps = 255 - ((division >> 8) & 0xff) + 1;
      const subframes = division & 0xff;
      // Preserve upstream supported/default FPS behavior.
      if (fps !== 25 && fps !== 24 && fps !== 29 && fps !== 30) { /* warning only in C++ */ }
      this.m_ticksPerQuarterNote = fps * subframes;
    } else {
      this.m_ticksPerQuarterNote = division;
    }

    for (let track = 0; track < tracks; track++) {
      if (pos + 8 > bytes.length || String.fromCharCode(bytes[pos], bytes[pos+1], bytes[pos+2], bytes[pos+3]) !== 'MTrk') { this.m_rwstatus = false; return false; }
      pos += 4;
      const chunkSize = readU32BE();
      if (!this.m_rwstatus || pos + chunkSize > bytes.length) { this.m_rwstatus = false; return false; }
      const trackEnd = pos + chunkSize;
      const list = this.m_events[track];
      let runningCommand = 0;
      let absTicks = 0;
      while (pos < trackEnd) {
        const delta = readVlv();
        if (!this.m_rwstatus) return false;
        absTicks += delta;
        const message = this.extractMidiData(bytes, () => readU8(), () => pos, (v) => { pos = v; }, runningCommand);
        if (message === null) return false;
        runningCommand = message.runningCommand;
        const event = new MidiEvent();
        event.setMessage(message.bytes);
        event.tick = absTicks;
        event.track = track;
        list.push_back_no_copy(event);
        if (event.isEndOfTrack()) break;
      }
      pos = trackEnd;
    }
    this.m_theTimeState = TIME_STATE_ABSOLUTE;
    this.markSequence();
    return this.m_rwstatus;
  }

  /** Write the current file to a binary Standard MIDI File byte array. */
  write(): Uint8Array {
    const oldTimeState = this.getTickState();
    if (oldTimeState === TIME_STATE_ABSOLUTE) this.makeDeltaTicks();
    const out: number[] = [];
    const push4 = (s: string) => { for (const c of s) out.push(c.charCodeAt(0)); };
    const pushU16 = (v: number) => { out.push((v >>> 8) & 0xff, v & 0xff); };
    const pushU32 = (v: number) => { out.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff); };
    push4('MThd'); pushU32(6); pushU16(this.getNumTracks() === 1 ? 0 : 1); pushU16(this.getNumTracks()); pushU16(this.getTicksPerQuarterNote());
    for (let i = 0; i < this.getNumTracks(); i++) {
      const trackdata: number[] = [];
      for (const event of this.m_events[i].data()) {
        if (event.empty() || event.isEndOfTrack()) continue;
        this.writeVLValue(event.tick, trackdata);
        if (event.getCommandByte() === 0xf0 || event.getCommandByte() === 0xf7) {
          trackdata.push(event[0]);
          this.writeVLValue(event.length - 1, trackdata);
          for (let k = 1; k < event.length; k++) trackdata.push(event[k]);
        } else {
          for (const b of event) trackdata.push(b);
        }
      }
      const n = trackdata.length;
      if (n < 3 || trackdata[n-3] !== 0xff || trackdata[n-2] !== 0x2f) trackdata.push(0, 0xff, 0x2f, 0);
      push4('MTrk'); pushU32(trackdata.length); for (const b of trackdata) out.push(b);
    }
    if (oldTimeState === TIME_STATE_ABSOLUTE) this.makeAbsoluteTicks();
    this.m_rwstatus = true;
    return Uint8Array.from(out);
  }

  writeBase64(width = 0): string {
    const encoded = MidiFile.base64Encode(this.write());
    if (width <= 0) return encoded;
    let out = '';
    for (let i = 0; i < encoded.length; i++) {
      out += encoded[i];
      if ((i + 1) % width === 0) out += '\n';
    }
    if ((encoded.length + 1) % width !== 0) out += '\n';
    return out;
  }

  getBase64(width = 0): string { return this.writeBase64(width); }


  private linearTickInterpolationAtSecond(seconds: number): number {
    if (!this.m_timemapvalid) {
      this.buildTimeMap();
      if (!this.m_timemapvalid) return -1.0;
    }
    if (this.m_timemap.length === 0) return -1.0;
    const lasttime = this.m_timemap[this.m_timemap.length - 1].seconds;
    if (seconds < 0.0 || seconds > lasttime) return -1.0;
    let startindex = -1;
    if (seconds < lasttime / 2) {
      for (let i = 0; i < this.m_timemap.length; i++) {
        if (this.m_timemap[i].seconds > seconds) { startindex = i - 1; break; }
        if (this.m_timemap[i].seconds === seconds) { startindex = i; break; }
      }
    } else {
      for (let i = this.m_timemap.length - 1; i > 0; i--) {
        if (this.m_timemap[i].seconds < seconds) { startindex = i + 1; break; }
        if (this.m_timemap[i].seconds === seconds) { startindex = i; break; }
      }
    }
    if (startindex < 0 || startindex >= this.m_timemap.length - 1) return -1.0;
    const x1 = this.m_timemap[startindex].seconds;
    const x2 = this.m_timemap[startindex + 1].seconds;
    const y1 = this.m_timemap[startindex].tick;
    const y2 = this.m_timemap[startindex + 1].tick;
    return (seconds - x1) * ((y2 - y1) / (x2 - x1)) + y1;
  }

  private linearSecondInterpolationAtTick(ticktime: number): number {
    if (!this.m_timemapvalid) {
      this.buildTimeMap();
      if (!this.m_timemapvalid) return -1.0;
    }
    if (this.m_timemap.length === 0) return -1.0;
    const lasttick = this.m_timemap[this.m_timemap.length - 1].tick;
    if (ticktime < 0 || ticktime > lasttick) return -1.0;
    let startindex = -1;
    if (ticktime < lasttick / 2) {
      for (let i = 0; i < this.m_timemap.length; i++) {
        if (this.m_timemap[i].tick > ticktime) { startindex = i - 1; break; }
        if (this.m_timemap[i].tick === ticktime) { startindex = i; break; }
      }
    } else {
      for (let i = this.m_timemap.length - 1; i > 0; i--) {
        if (this.m_timemap[i].tick < ticktime) { startindex = i; break; }
        if (this.m_timemap[i].tick === ticktime) { startindex = i; break; }
      }
    }
    if (startindex < 0 || startindex >= this.m_timemap.length - 1) return -1.0;
    if (this.m_timemap[startindex].tick === ticktime) return this.m_timemap[startindex].seconds;
    const x1 = this.m_timemap[startindex].tick;
    const x2 = this.m_timemap[startindex + 1].tick;
    const y1 = this.m_timemap[startindex].seconds;
    const y2 = this.m_timemap[startindex + 1].seconds;
    return (ticktime - x1) * ((y2 - y1) / (x2 - x1)) + y1;
  }

  private buildTimeMap(): void {
    const trackstate = this.getTrackState();
    const timestate = this.getTickState();
    this.makeAbsoluteTicks();
    this.joinTracks();
    this.m_timemap = [];
    const tpq = this.getTicksPerQuarterNote();
    const defaultTempo = 120.0;
    let secondsPerTick = 60.0 / (defaultTempo * tpq);
    let lasttick = 0;
    let tickinit = false;
    let lastsec = 0.0;
    let cursec = 0.0;
    const events = this.m_events[0]?.data() ?? [];
    for (const event of events) {
      const curtick = event.tick;
      event.seconds = cursec;
      if (curtick > lasttick || !tickinit) {
        tickinit = true;
        cursec = lastsec + (curtick - lasttick) * secondsPerTick;
        event.seconds = cursec;
        this.m_timemap.push({ tick: curtick, seconds: cursec });
        lasttick = curtick;
        lastsec = cursec;
      }
      if (this.isTempoEvent(event)) {
        const tempoSpt = this.getTempoSecondsPerTick(event);
        if (tempoSpt >= 0) secondsPerTick = tempoSpt;
      }
    }
    if (timestate === TIME_STATE_DELTA) this.makeDeltaTicks();
    if (trackstate === TRACK_STATE_SPLIT) this.splitTracks();
    this.m_timemapvalid = true;
  }

  private isTempoEvent(event: MidiEvent): boolean {
    return event.length === 6 && event.length >= 6 && event[0] === 0xff && event[1] === 0x51 && event[2] === 0x03;
  }

  private getTempoSecondsPerTick(event: MidiEvent): number {
    if (!this.isTempoEvent(event)) return -1.0;
    const microseconds = (event[3] << 16) + (event[4] << 8) + event[5];
    return microseconds / 1000000.0 / this.getTicksPerQuarterNote();
  }

  private static toBytes(input: Uint8Array | ArrayBuffer | string): Uint8Array {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    return Uint8Array.from(Array.from(input, c => c.charCodeAt(0) & 0xff));
  }

  static base64DecodeBytes(input: string): Uint8Array {
    const bytes: number[] = [];
    let val = 0; let bits = -8;
    for (let i = 0; i < input.length; i++) {
      const c = input.charCodeAt(i) & 0xff;
      if (c === 0x3d) break;
      const v = BASE64_DECODE[c];
      if (v === undefined || v < 0) continue;
      val = (val << 6) + v; bits += 6;
      if (bits >= 0) { bytes.push((val >>> bits) & 0xff); bits -= 8; }
    }
    return Uint8Array.from(bytes);
  }

  private extractMidiData(
    bytes: Uint8Array, readByte: () => number, getPos: () => number, setPos: (n: number) => void, runningCommand: number
  ): { bytes: number[]; runningCommand: number } | null {
    const first = readByte();
    if (!this.m_rwstatus) return null;
    let command = runningCommand;
    let running = false;
    if (first < 0x80) {
      running = true;
      if (command === 0 || command >= 0xf0) { this.m_rwstatus = false; return null; }
    } else { command = first; }
    const array: number[] = [command];
    if (running) array.push(first);
    const readData = (): number | null => { const b = readByte(); if (!this.m_rwstatus) return null; if (b > 0x7f) { this.m_rwstatus = false; return null; } return b; };
    switch (command & 0xf0) {
      case 0x80: case 0x90: case 0xa0: case 0xb0: case 0xe0:
        if (!running) { const a = readData(); if (a === null) return null; array.push(a); }
        { const b = readData(); if (b === null) return null; array.push(b); }
        break;
      case 0xc0: case 0xd0:
        if (!running) { const a = readData(); if (a === null) return null; array.push(a); }
        break;
      case 0xf0:
        if (command === 0xff) {
          if (!running) { const type = readByte(); if (!this.m_rwstatus) return null; array.push(type); }
          const lenStart = getPos(); const length = this.readVLFromBytes(bytes, lenStart, setPos); if (!this.m_rwstatus) return null;
          // readVLFromBytes leaves position after VLV; retain raw VLV bytes by reconstructing from source slice.
          const afterLen = getPos(); const raw = Array.from(bytes.slice(lenStart, afterLen)); array.push(...raw);
          for (let i = 0; i < length; i++) { const b = readByte(); if (!this.m_rwstatus) return null; array.push(b); }
        } else if (command === 0xf0 || command === 0xf7) {
          const lenPos = getPos(); const length = this.readVLFromBytes(bytes, lenPos, setPos); if (!this.m_rwstatus) return null;
          for (let i = 0; i < length; i++) { const b = readByte(); if (!this.m_rwstatus) return null; array.push(b); }
        } else { this.m_rwstatus = false; return null; }
        break;
      default: this.m_rwstatus = false; return null;
    }
    return { bytes: array, runningCommand: command };
  }

  private readVLFromBytes(bytes: Uint8Array, start: number, setPos: (n: number) => void): number {
    let pos = start; const b = [0,0,0,0,0];
    for (let i = 0; i < 5; i++) { if (pos >= bytes.length) { this.m_rwstatus = false; return 0; } b[i] = bytes[pos++]; if (b[i] < 0x80) break; }
    setPos(pos); return this.unpackVLV(b[0], b[1], b[2], b[3], b[4]);
  }

  private unpackVLV(a = 0, b = 0, c = 0, d = 0, e = 0): number {
    const bytes = [a,b,c,d,e]; let count = 0;
    while (count < 5 && bytes[count] > 0x7f) count++; count++;
    if (count >= 6) { this.m_rwstatus = false; return 0; }
    let output = 0; for (let i = 0; i < count; i++) output = ((output << 7) | (bytes[i] & 0x7f)) >>> 0;
    return output;
  }

  private writeVLValue(aValue: number, outdata: number[]): void {
    let value = Math.trunc(aValue);
    if (value >= (1 << 28)) value = 0x0fffffff;
    if (value < 0) value = 0;
    const bytes = [(value >>> 21) & 0x7f, (value >>> 14) & 0x7f, (value >>> 7) & 0x7f, value & 0x7f];
    let start = 0; while (start < 4 && bytes[start] === 0) start++;
    if (start === 4) { outdata.push(0); return; }
    for (let i = start; i < 3; i++) outdata.push(bytes[i] | 0x80);
    outdata.push(bytes[3]);
  }

  static makeVLV(number: number): number[] {
    let value = number >>> 0;
    const out = [value & 0x7f];
    while ((value >>>= 7) > 0) out.unshift((value & 0x7f) | 0x80);
    return out;
  }

  static base64Encode(input: string | Uint8Array): string {
    const bytes = typeof input === 'string'
      ? Uint8Array.from(Array.from(input, (c) => c.charCodeAt(0) & 0xff))
      : input;
    let output = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const a = bytes[i];
      const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
      output += BASE64[a >>> 2];
      output += BASE64[((a & 0x03) << 4) | (b >>> 4)];
      output += i + 1 < bytes.length ? BASE64[((b & 0x0f) << 2) | (c >>> 6)] : '=';
      output += i + 2 < bytes.length ? BASE64[c & 0x3f] : '=';
    }
    return output;
  }

  static base64Decode(input: string): string {
    const bytes: number[] = [];
    let val = 0;
    let bits = -8;
    for (let i = 0; i < input.length; i++) {
      const c = input.charCodeAt(i) & 0xff;
      if (c === 0x3d) break;
      const v = BASE64_DECODE[c];
      if (v === undefined || v < 0) continue;
      val = (val << 6) + v;
      bits += 6;
      if (bits >= 0) {
        bytes.push((val >>> bits) & 0xff);
        bits -= 8;
      }
    }
    return String.fromCharCode(...bytes);
  }

  static getGMInstrumentName(patchIndex: number): string {
    return patchIndex < 0 || patchIndex > 127 ? '' : GM_INSTRUMENTS[patchIndex];
  }

  private static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_DECODE: number[] = Array(256).fill(-1);
for (let i = 0; i < BASE64.length; i++) BASE64_DECODE[BASE64.charCodeAt(i)] = i;

const GM_INSTRUMENTS = [
  'acoustic grand piano','bright acoustic piano','electric grand piano','honky-tonk piano','rhodes piano','chorused piano','harpsichord','clavinet','celeste','glockenspiel','music box','vibraphone','marimba','xylophone','tubular bells','dulcimer','hammond organ','percussive organ','rock organ','church organ','reed organ','accordion','harmonica','tango accordion','nylon guitar','steel guitar','jazz guitar','clean guitar','muted guitar','overdriven guitar','distortion guitar','guitar harmonics','acoustic bass','fingered electric bass','picked electric bass','fretless bass','slap bass 1','slap bass 2','synth bass 1','synth bass 2','violin','viola','cello','contrabass','tremolo strings','pizzcato strings','orchestral harp','timpani','string ensemble 1','string ensemble 2','synth strings 1','synth strings 1','choir aahs','voice oohs','synth voices','orchestra hit','trumpet','trombone','tuba','muted trumpet','frenc horn','brass section','syn brass 1','synth brass 2','soprano sax','alto sax','tenor sax','baritone sax','oboe','english horn','bassoon','clarinet','piccolo','flute','recorder','pan flute','bottle blow','shakuhachi','whistle','ocarina','square wave','saw wave','calliope lead','chiffer lead','charang lead','voice lead','fifths lead','brass lead','newage pad','warm pad','polysyn pad','choir pad','bowed pad','metallic pad','halo pad','sweep pad','rain','soundtrack','crystal','atmosphere','brightness','goblins','echoes','sci-fi','sitar','banjo','shamisen','koto','kalimba','bagpipes','fiddle','shanai','tinkle bell','agogo','steel drums','woodblock','taiko drum','melodoc tom','synth drum','reverse cymbal','guitar fret noise','breath noise','seashore','bird tweet','telephone ring','helicopter','applause','gunshot',
] as const;
