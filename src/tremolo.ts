/**
 * C++ Tool_tremolo (humlib.cpp:145144) port. Expands `**kern` @n@ / @@n@@
 * tremolo markup into repeated beamed notes and wraps each span with
 * `*tremolo` / `*Xtremolo` interpretation records.
 */
import { HumNum } from './humlib';
import { HumdrumFile } from './humlib-core';
import { Convert } from './convert';
import { recipToDuration } from './humlib-core';

type HTpLike = NonNullable<ReturnType<HumdrumFile['token']>>;

/** C++ Tool_tremolo::storeFirstTremoloNoteInfo. */
function storeFirstTremoloNoteInfo(token: HTpLike, first: HumNum[]): void {
  if (!token) return;
  const track = token.getTrack();
  if (track < 0 || track >= first.length) return;
  const timestamp = token.getDurationFromStart();
  if (first[track].getFloat() < 0 || timestamp.less(first[track])) first[track] = new HumNum(timestamp);
}

/** C++ Tool_tremolo::storeLastTremoloNoteInfo. */
function storeLastTremoloNoteInfo(token: HTpLike, last: HumNum[]): void {
  if (!token) return;
  const track = token.getTrack();
  if (track < 1 || track >= last.length) return;
  // C++ storeLastTremoloNoteInfo stores note end = start + recip duration.
  const timestamp = token.getDurationFromStart().add(Convert.recipToDuration(token.getText()));
  if (last[track].getFloat() < 0 || timestamp.greater(last[track])) last[track] = new HumNum(timestamp);
}

export class Tool_tremolo {
  private m_keepQ = false;
  private m_first_tremolo_time: HumNum[] = [];
  private m_last_tremolo_time: HumNum[] = [];
  private m_markup_tokens: HTpLike[] = [];
  private m_modifiedQ = false;

  run(infile: HumdrumFile): void {
    this.processFile(infile);
  }

  /** C++ Tool_tremolo::processFile (humlib.cpp:145211). */
  processFile(infile: HumdrumFile): void {
    this.m_keepQ = false;
    let maxtrack = infile.getMaxTrack();
    for (let i = 0; i < infile.getLineCount(); i++) {
      const line = infile.getLine(i);
      if (!line || !line.hasSpines()) continue;
      for (let j = 0; j < line.getFieldCount(); j++) {
        const t = line.token(j)?.getTrack() ?? -1;
        if (t > maxtrack) maxtrack = t;
      }
    }
    this.m_first_tremolo_time = new Array(maxtrack + 1).fill(new HumNum(-1));
    this.m_last_tremolo_time = new Array(maxtrack + 1).fill(new HumNum(-1));
    this.m_markup_tokens = [];
    // C++ Tool_tremolo::processFile (humlib.cpp:145211) does no
    // analyzing here; rhythm/link info comes from earlier tool runs.
    // (An extra analyzeRhythmStructure here can raise a bogus rhythm
    // parse error which then short-circuits the post-expansion reparse
    // and empties trackstarts, wrongly filtering Piano headers.)
    for (let i = infile.getLineCount() - 1; i >= 0; i--) {
      const line = infile.getLine(i);
      if (!line || !line.isData()) continue;
      if (line.getDuration().isZero()) continue;
      for (let j = 0; j < line.getFieldCount(); j++) {
        const token = infile.token(i, j);
        if (!token || !token.isKern() || token.isNull()) continue;
        const match = /@(\d+)@/.exec(token.getText());
        if (!match) continue;
        this.m_markup_tokens.push(token);
        const value = parseInt(match[1], 10);
        let count = Convert.recipToDuration(token.getText()).mul(value).div(4);
        let increment = new HumNum(4).div(value);
        if (token.find('@@') !== -1) count = count.mul(2);
        if (!count.isInteger()) continue;
        const kcount = count.getInteger();
        const starttime = token.getDurationFromStart();
        for (let k = 1; k < kcount; k++) {
          const timestamp = starttime.add(increment.mul(k));
          infile.insertNullDataLine(timestamp);
        }
      }
    }

    this.expandTremolos();
    this.addTremoloInterpretations(infile);
    if (this.m_modifiedQ) infile.createLinesFromTokens();
    // C++ Tool_tremolo::run (humlib.cpp:145195-199) forces a reparse
    // after expansion so spine/track analysis reflects inserted lines.
    // Without this, printResult would use stale pre-tremolo trackstarts.
    const reser = infile.toString();
    infile.readString(reser);
  }

  /** C++ Tool_tremolo::expandTremolos (humlib.cpp:145350). */
  expandTremolos(): void {
    for (const token of this.m_markup_tokens) {
      if (token.find('@@') !== -1) this.expandFingerTremolo(token);
      else this.expandTremolo(token);
    }
  }

  /** C++ Tool_tremolo::expandTremolo (humlib.cpp:145367). */
  expandTremolo(token: HTpLike): void {
    const text = token.getText();
    const match = /@(\d+)@/.exec(text);
    if (!match) return;
    const value = parseInt(match[1], 10);
    // C++ humlib.cpp:145375 uses Convert::recipToDuration(token), not the
    // analysed line duration; they differ for tuplet rhythms.
    const duration = Convert.recipToDuration(text);
    const count = duration.mul(value).div(4);
    if (!count.isInteger()) return;
    if (value < 8) return;
    let addBeam = false;
    if (duration.getFloat() > 0.5) addBeam = true;

    let repeat = duration.mul(value).div(4);
    const increment = new HumNum(4).div(value);
    if (!repeat.isInteger()) return;
    const tnotes = repeat.getInteger();

    storeFirstTremoloNoteInfo(token, this.m_first_tremolo_time);

    const beams = Math.trunc(Math.log(value) / Math.LN2) - 2;
    const markup = '@' + value + '@';
    let base = text;
    base = base.split(markup).join('');
    let hasBeamStart = base.indexOf('L') !== -1;
    let hasBeamStop = base.indexOf('J') !== -1;
    if (addBeam) { hasBeamStart = true; hasBeamStop = true; }
    base = base.replace(/[LJKk]+/g, '');
    const startbeam = 'L'.repeat(beams);
    const endbeam = 'J'.repeat(beams);
    base = base.replace(/\d+%?\d*\.*/g, String(value));
    let initial = base + (hasBeamStart ? startbeam : '');
    const terminal = base + (hasBeamStop ? endbeam : '');
    initial = initial.replace(/[)]+[<>]?/g, '');
    if (this.m_keepQ) initial += markup;
    base = base.replace(/[()]+[<>]?/g, '');
    const cleanTerminal = terminal.replace(/[(]+[<>]?/g, '');

    token.setText(initial);
    token.getOwner()?.createLineFromTokens();
    this.m_modifiedQ = true;

    const starttime = token.getDurationFromStart();
    let timestamp = starttime.add(increment);
    let current = this.nextInTrack(token);
    let counter = 1;
    while (current) {
      if (!current.isData()) { current = this.nextInTrack(current); continue; }
      if (current.getOwner()?.getDuration().isZero()) { current = this.nextInTrack(current); continue; }
      const cstamp = current.getDurationFromStart();
      if (cstamp.less(timestamp)) { current = this.nextInTrack(current); continue; }
      if (cstamp.greater(timestamp)) break;
      counter++;
      if (tnotes === counter) {
        current.setText(cleanTerminal);
        storeLastTremoloNoteInfo(current, this.m_last_tremolo_time);
      } else {
        current.setText(base);
      }
      current.getOwner()?.createLineFromTokens();
      if (counter >= tnotes) break;
      timestamp = timestamp.add(increment);
      current = this.nextInTrack(current);
    }
  }

  /** C++ Tool_tremolo::expandFingerTremolo (humlib.cpp:145542). */
  expandFingerTremolo(token1: HTpLike): void {
    const match = /@@(\d+)@@/.exec(token1.getText());
    if (!match) return;
    const value = parseInt(match[1], 10);
    if (!Convert.isPowerOfTwo(value) || value < 8) return;
    const count = Convert.recipToDuration(token1.getText()).mul(value).div(4);
    if (!count.isInteger()) return;
    const increment = new HumNum(4).div(value);
    const tnotes = count.getInteger() * 2;

    const token2 = this.getNextNote(token1);
    if (!token2) return;
    storeFirstTremoloNoteInfo(token1, this.m_first_tremolo_time);

    const beams = Math.trunc(Math.log(value) / Math.LN2) - 2;
    const markup = '@@' + value + '@@';
    let base1 = token1.getText().split(markup).join('');
    base1 = base1.replace(/[LJKk]+/g, '');
    const startbeam = 'L'.repeat(beams);
    const endbeam = 'J'.repeat(beams);
    base1 = base1.replace(/\d+%?\d*\.*/g, String(value));
    let initial = base1 + startbeam;
    initial = initial.replace(/[)]+[<>]?/g, '');
    if (this.m_keepQ) initial += markup;
    base1 = base1.replace(/[()]+[<>]?/g, '');
    token1.setText(initial);
    token1.getOwner()?.createLineFromTokens();
    this.m_modifiedQ = true;

    let base2 = token2.getText().replace(/[LJKk]+/g, '');
    base2 = base2.replace(/\d+%?\d*\.*/g, String(value));
    const terminal = (base2 + endbeam).replace(/[(]+[<>]?/g, '');

    const starttime = token1.getDurationFromStart();
    let timestamp = starttime.add(increment);
    let current = this.nextInTrack(token1);
    let counter = 1;
    let state = false;
    while (current) {
      if (!current.isData()) { current = this.nextInTrack(current); continue; }
      const cstamp = current.getDurationFromStart();
      if (cstamp.less(timestamp)) { current = this.nextInTrack(current); continue; }
      if (cstamp.greater(timestamp)) break;
      counter++;
      if (tnotes === counter) {
        current.setText(terminal);
        storeLastTremoloNoteInfo(current, this.m_last_tremolo_time);
      } else {
        current.setText(state ? base1 : base2);
        state = !state;
      }
      current.getOwner()?.createLineFromTokens();
      if (counter >= tnotes) break;
      timestamp = timestamp.add(increment);
      current = this.nextInTrack(current);
    }
  }

  /**
   * Token links are unreliable in the TypeScript port: lines inserted by
   * insertNullDataLine keep stale durationFromStart values, so getNextToken()
   * walks the wrong chain. Walk the file directly by track instead.
   */
  private nextInTrack(token: HTpLike): HTpLike | null {
    return token.getNextToken() as HTpLike | null;
  }

  /** C++ Tool_tremolo::getNextNote (humlib.cpp:145512). */
  getNextNote(token: HTpLike): HTpLike | null {
    let current = this.nextInTrack(token);
    while (current) {
      if (!current.isData()) { current = this.nextInTrack(current); continue; }
      if (current.getOwner()?.getDuration().isZero()) { current = this.nextInTrack(current); continue; }
      if (current.isNull() || current.isRest()) { current = this.nextInTrack(current); continue; }
      return current;
    }
    return null;
  }

  /** C++ Tool_tremolo::addTremoloInterpretations (humlib.cpp:145292). */
  addTremoloInterpretations(infile: HumdrumFile): void {
    for (let i = 0; i < this.m_first_tremolo_time.length; i++) {
      if (this.m_first_tremolo_time[i].getFloat() < 0) continue;
      const line = infile.insertNullInterpretationLine(this.m_first_tremolo_time[i]);
      if (!line) continue;
      for (let j = 0; j < line.getFieldCount(); j++) {
        const token = line.token(j);
        if (!token || token.getSubtrack() > 1) continue;
        if (token.getTrack() === i) { token.setText('*tremolo'); line.createLineFromTokens(); }
      }
    }
    for (let i = 0; i < this.m_last_tremolo_time.length; i++) {
      if (this.m_last_tremolo_time[i].getFloat() < 0) continue;
      const line = infile.insertNullInterpretationLineAbove(this.m_last_tremolo_time[i]);
      if (!line) continue;
      for (let j = 0; j < line.getFieldCount(); j++) {
        const token = line.token(j);
        if (!token || token.getSubtrack() > 1) continue;
        if (token.getTrack() === i) { token.setText('*Xtremolo'); line.createLineFromTokens(); }
      }
    }
  }
}

export { recipToDuration };
