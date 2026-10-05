import { GridPart, GridSlice, GridStaff, GridVoice, SliceType } from './gridstructures';
import { HumNum } from './humlib';
import { HumdrumFile, HumdrumLine, HumdrumToken } from './humlib-core';
import { recipToDuration } from './humlib-core';
import { Convert } from './convert';

export enum MeasureStyle {
  Invisible,
  Plain,
  RepeatBackward,
  RepeatForward,
  RepeatBoth,
  Double,
  Final,
}

export interface GridSliceLike {
  size(): number;
  isDataSlice?(): boolean;
  isMeasureSlice?(): boolean;
  isManipulatorSlice?(): boolean;
  isLocalLayoutSlice?(): boolean;
}

export class GridMeasure {
  private readonly slices: GridSliceLike[] = [];
  private owner: HumGrid;
  private duration = new HumNum();
  private timestamp = new HumNum();
  private timeSigDur = new HumNum();
  private style = MeasureStyle.Plain;
  private measureNumber = 0;

  constructor(owner: HumGrid) { this.owner = owner; }
  size(): number { return this.slices.length; }
  empty(): boolean { return this.slices.length === 0; }
  at(index: number): GridSliceLike { return this.slices[index]; }
  back(): GridSliceLike { return this.slices[this.slices.length - 1]; }
  pushBack(slice: GridSliceLike): void { this.slices.push(slice); }
  push_back(slice: GridSliceLike): void { this.slices.push(slice); }
  insertAt(index: number, slice: GridSliceLike): void { this.slices.splice(index, 0, slice); }
  addTempoTokenTok(tok: string, timestamp: HumNum, part: number, staff: number, voice: number, _maxstaff: number): GridSliceLike {
    const fillPart = (slice: GridSlice): void => {
      // C++ newslice ctor resizes to partcount=maxstaff single-staff parts
      // (humlib.cpp GridSlice ctor); transfer pads the unused staves, so the
      // MM slice prints at score width even with one token (asap-230).
      if (_maxstaff > 0) slice.initializeByStaffCount(_maxstaff);
      slice.addToken(tok, part, staff, voice);
    };
    let gs: GridSliceLike | null = null;
    const last = this.slices.length ? (this.slices[this.slices.length - 1] as unknown as GridSlice) : null;
    if (!this.slices.length || (last!.getTimestamp() as HumNum).getFloat() < timestamp.getFloat()) {
      gs = new GridSlice(this as never, timestamp, SliceType.Tempos) as unknown as GridSliceLike;
      fillPart(gs as unknown as GridSlice);
      this.slices.push(gs);
      return gs;
    }
    for (let i = 0; i < this.slices.length; i++) {
      const it = this.slices[i] as unknown as GridSlice;
      const ts = it.getTimestamp() as HumNum;
      if (ts.equals(timestamp) && it.isTempoSlice()) { fillPart(it); return it as unknown as GridSliceLike; }
      if (ts.equals(timestamp) && it.isDataSlice()) {
        gs = new GridSlice(this as never, timestamp, SliceType.Tempos) as unknown as GridSliceLike;
        fillPart(gs as unknown as GridSlice);
        this.slices.splice(i, 0, gs);
        return gs;
      }
      if (ts.getFloat() > timestamp.getFloat()) {
        gs = new GridSlice(this as never, timestamp, SliceType.Tempos) as unknown as GridSliceLike;
        fillPart(gs as unknown as GridSlice);
        this.slices.splice(i, 0, gs);
        return gs;
      }
    }
    gs = new GridSlice(this as never, timestamp, SliceType.Tempos) as unknown as GridSliceLike;
    fillPart(gs as unknown as GridSlice);
    this.slices.push(gs);
    return gs;
  }
  findNoteSliceStaffCount(part: number): number {
    for (const it of this.slices) {
      const s = it as unknown as GridSlice;
      if (s.isNoteSlice && s.isNoteSlice()) {
        const n = s.at(part)?.length ?? 0;
        if (n > 1) return n;
      }
    }
    return 1;
  }
  addTempoTokenText(slice: GridSliceLike, partindex: number, tempo: string): GridSliceLike {
    if (!this.slices.length) return slice;
    const idx = this.slices.indexOf(slice);
    let prev = idx < 0 ? this.slices.length - 1 : idx - 1;
    while (prev >= 0) {
      const ps = this.slices[prev] as unknown as GridSlice;
      if (ps.isLayoutSlice()) {
        const gp = ps.at(partindex);
        const gs = gp?.at(0);
        if (gs) {
          if (!gs.length) gs.push(new GridVoice());
          const gv = gs.at(0);
          const tok = gv?.getToken();
          if (!tok || tok.value === '*') { gv!.setToken(tempo); return slice; }
        }
      } else break;
      prev--;
    }
    // C++ addTempoToken copies geometry from *iter, the last slice in the
    // measure (humlib.cpp:8708), not from the note slice passed by the caller.
    // Using the note's voice count creates a false layout/manip mismatch.
    const last = this.slices[this.slices.length - 1] as unknown as GridSlice;
    const newslice = new GridSlice(this as never, last.getTimestamp(), SliceType.Layouts) as unknown as GridSliceLike;
    const dst = newslice as unknown as GridSlice;
    dst.length = 0;
    for (let p = 0; p < last.length; p++) {
      const sp = last.at(p);
      const dp = new GridPart();
      dst.push(dp);
      for (let s = 0; s < (sp?.length ?? 0); s++) {
        const st2 = new GridStaff();
        for (let v = 0; v < (sp?.at(s)?.length ?? 0); v++) st2.push(new GridVoice());
        dp.push(st2);
      }
    }
    // C++ walks back from the last slice and inserts at previous.base(), i.e.
    // ahead of the trailing layout run rather than immediately before the note.
    const at = prev + 1;
    this.slices.splice(at, 0, newslice);
    const npart = (newslice as unknown as GridSlice).at(partindex);
    const ngs = npart?.at(0);
    if (ngs) { if (!ngs.length) ngs.push(new GridVoice()); ngs.at(0)?.setToken(tempo); }
    return slice;
  }
  addInterpretationBefore(slice: GridSliceLike, partindex: number, _staffindex: number, _voiceindex: number, interpretation: string): void {
    if (!this.slices.length) return;
    // C++ addInterpretationBefore (humlib.cpp): take the slice before the
    // last one only if it is an interpretation slice; note the C++ only
    // merges when the token is missing or null — a pending '*' blocks merge.
    let prev = this.slices[this.slices.length - 2] as unknown as GridSlice | undefined;
    if (prev && (prev as GridSlice).isInterpretationSlice && (prev as GridSlice).isInterpretationSlice()) {
      const gp = (prev as GridSlice).at(partindex);
      const gs = gp?.at(0);
      if (gs) {
        if (!gs.length) gs.push(new GridVoice());
        const gv = gs.at(0);
        const tok = gv?.getToken();
        if (!tok || (tok.isNull && tok.isNull())) { gv!.setToken(interpretation); return; }
      }
    }
    const last = this.slices[this.slices.length - 1] as unknown as GridSliceLike;
    this.insertInterpretationSliceBefore(last, partindex, interpretation, (last as unknown as GridSlice).getTimestamp ? (last as unknown as GridSlice).getTimestamp() : new HumNum());
  }
  insertInterpretationSliceBefore(slice: GridSliceLike, partindex: number, interpretation: string, timestamp?: HumNum): void {
    const idx = this.slices.indexOf(slice);
    const at = idx < 0 ? this.slices.length : idx;
    const ref = this.slices[at] as unknown as GridSlice | undefined;
    const owner = ref?.getMeasure ? ref.getMeasure() : null;
    const newslice = new GridSlice(owner, timestamp ? new HumNum(timestamp) : new HumNum(), SliceType._Interpretation);
    if (ref) {
      newslice.length = 0;
      for (let p = 0; p < ref.length; p++) {
        const part = new GridPart();
        newslice.push(part);
        for (let s = 0; s < (ref.at(p)?.length ?? 0); s++) {
          const staff = new GridStaff();
          part.push(staff);
          for (let v = 0; v < (ref.at(p)?.at(s)?.length ?? 0); v++) staff.push(new GridVoice());
        }
      }
    }
    this.slices.splice(at, 0, newslice);
    const npart = newslice.at(partindex);
    if (!npart || !npart.length || !npart[0]) return;
    if (!npart[0].length) npart[0].push(new GridVoice());
    const nv = npart[0][0];
    if (nv) nv.setToken(interpretation);
  }
  addInterpretationAfter(slice: GridSliceLike, partindex: number, _staffindex: number, _voiceindex: number, interpretation: string, timestamp: HumNum): void {
    const targettime = (slice as unknown as GridSlice).getTimestamp ? (slice as unknown as GridSlice).getTimestamp() : new HumNum();
    if (!this.slices.length) return;
    const prev = this.slices.length >= 2 ? this.slices[this.slices.length - 2] as unknown as GridSlice : undefined;
    const ptime = prev && prev.getTimestamp ? prev.getTimestamp() : targettime;
    if (ptime.equals(targettime)) {
      const nextone = this.slices[this.slices.length - 1] as unknown as GridSlice;
      if (nextone && nextone.isInterpretationSlice && nextone.isInterpretationSlice()) {
        const gs = nextone.at(partindex)?.at(0);
        if (gs) {
          if (!gs.length) gs.push(new GridVoice());
          const tok = gs.at(0)?.getToken();
          if (!tok || tok.value === '*') { gs.at(0)!.setToken(interpretation); return; }
        }
      }
    }
    if (ptime.getFloat() <= targettime.getFloat()) {
      const src = slice as unknown as GridSlice;
      const owner = src?.getMeasure ? src.getMeasure() : null;
      const newslice = new GridSlice(owner, new HumNum(timestamp), SliceType._Interpretation);
      // C++ copies geometry from the note slice (humlib.cpp addInterpretationAfter).
      if (src) {
        newslice.length = 0;
        for (let p = 0; p < src.length; p++) {
          const part = new GridPart();
          newslice.push(part);
          for (let s = 0; s < (src.at(p)?.length ?? 0); s++) {
            const staff = new GridStaff();
            part.push(staff);
            for (let v = 0; v < (src.at(p)?.at(s)?.length ?? 0); v++) staff.push(new GridVoice());
          }
        }
      }
      this.slices.push(newslice);
      const npart = newslice.at(partindex);
      if (!npart || !npart.length || !npart[0]) return;
      if (!npart[0].length) npart[0].push(new GridVoice());
      const nv = npart[0][0];
      if (nv) nv.setToken(interpretation);
    }
  }
  getSlices(): GridSliceLike[] { return this.slices; }
  // C++ GridMeasure::addDataToken (humlib.cpp:8562).
  addDataToken(tok: string, timestamp: HumNum, part: number, staff: number, voice: number, maxstaff: number): GridSliceLike {
    const last = this.slices.length ? (this.slices[this.slices.length - 1] as unknown as GridSlice) : null;
    if (!last || (last.getTimestamp() as HumNum).getFloat() < timestamp.getFloat()) {
      const gs = new GridSlice(this as never, timestamp, SliceType.Notes, maxstaff) as unknown as GridSliceLike;
      (gs as unknown as GridSlice).addToken(tok, part, staff, voice);
      this.slices.push(gs);
      return gs;
    }
    for (let i = 0; i < this.slices.length; i++) {
      const it = this.slices[i] as unknown as GridSlice;
      const ts = it.getTimestamp() as HumNum;
      if (ts.equals(timestamp) && it.isGraceSlice()) continue;
      if (ts.equals(timestamp) && it.isMeasureSlice()) continue;
      if (!it.isDataSlice() && ts.getFloat() <= timestamp.getFloat()) continue;
      if (ts.equals(timestamp)) { it.addToken(tok, part, staff, voice); return it as unknown as GridSliceLike; }
      if (ts.getFloat() > timestamp.getFloat()) {
        const gs = new GridSlice(this as never, timestamp, SliceType.Notes, maxstaff) as unknown as GridSliceLike;
        (gs as unknown as GridSlice).addToken(tok, part, staff, voice);
        this.slices.splice(i, 0, gs);
        return gs;
      }
    }
    const gs = new GridSlice(this as never, timestamp, SliceType.Notes, maxstaff) as unknown as GridSliceLike;
    (gs as unknown as GridSlice).addToken(tok, part, staff, voice);
    this.slices.push(gs);
    return gs;
  }
  // C++ GridMeasure::addGraceToken (humlib.cpp:8451).
  addGraceToken(tok: string, timestamp: HumNum, part: number, staff: number, voice: number, maxstaff: number, gracenumber: number): GridSliceLike | null {
    if (gracenumber < 1) return null;
    const mk = (): GridSliceLike => {
      const gs = new GridSlice(this as never, timestamp, SliceType.GraceNotes, maxstaff) as unknown as GridSliceLike;
      (gs as unknown as GridSlice).addToken(tok, part, staff, voice);
      return gs;
    };
    const sl = this.slices as unknown as GridSlice[];
    if (!sl.length) { const gs = mk(); this.slices.push(gs); return gs; }
    const backTs = (sl[sl.length - 1].getTimestamp() as HumNum).getFloat();
    if (timestamp.getFloat() > backTs) {
      let counter = 0;
      for (let i = sl.length - 1; i >= 0; i--) {
        const s = sl[i];
        if (s.isGraceSlice()) {
          counter++;
          if (counter === gracenumber) { s.addToken(tok, part, staff, voice); return sl[i] as unknown as GridSliceLike; }
        } else if (s.isLayoutSlice()) continue;
        else if (s.isDataSlice()) {
          const gs = mk(); this.slices.splice(i + 1, 0, gs); return gs;
        }
      }
      return null;
    }
    let iterator = 0;
    while (iterator < sl.length) {
      const it = sl[iterator];
      if (timestamp.getFloat() < (it.getTimestamp() as HumNum).getFloat()) return null;
      if (it.isDataSlice() && (it.getTimestamp() as HumNum).equals(timestamp)) break;
      iterator++;
    }
    let counter = 0;
    for (let i = iterator - 1; i >= 0; i--) {
      const s = sl[i];
      if (s.isGraceSlice()) {
        counter++;
        if (counter === gracenumber) { s.addToken(tok, part, staff, voice); return sl[i] as unknown as GridSliceLike; }
      } else if (s.isLayoutSlice()) continue;
      else if (s.isDataSlice()) {
        const gs = mk(); this.slices.splice(i + 1, 0, gs); return gs;
      }
    }
    const gs = mk(); this.slices.splice(0, 0, gs); return gs;
  }
  // C++ GridMeasure::appendGlobalLayout (humlib.cpp:8434).
  appendGlobalLayout(tok: string, timestamp: HumNum): GridSliceLike {
    const gs = new GridSlice(this as never, timestamp, SliceType.GlobalLayouts, 1) as unknown as GridSliceLike;
    (gs as unknown as GridSlice).addToken(tok, 0, 0, 0);
    (gs as unknown as GridSlice).setDuration(new HumNum(0));
    this.slices.push(gs);
    return gs;
  }
  // C++ GridMeasure::addClefToken/addTimeSigToken/addKeySigToken
  // (humlib.cpp:8738/8850/9044): shared typed-slice insert.
  addInterpToken(sliceType: number, tok: string, timestamp: HumNum, part: number, staff: number, voice: number, maxstaff: number, isType: (s: GridSlice) => boolean): GridSliceLike {
    const last = this.slices.length ? (this.slices[this.slices.length - 1] as unknown as GridSlice) : null;
    const mk = (): GridSliceLike => {
      const gs = new GridSlice(this as never, timestamp, sliceType as never, maxstaff) as unknown as GridSliceLike;
      (gs as unknown as GridSlice).addToken(tok, part, staff, voice);
      return gs;
    };
    if (!last || (last.getTimestamp() as HumNum).getFloat() < timestamp.getFloat()) {
      const gs = mk(); this.slices.push(gs); return gs;
    }
    for (let i = 0; i < this.slices.length; i++) {
      const it = this.slices[i] as unknown as GridSlice;
      const ts = it.getTimestamp() as HumNum;
      if (ts.equals(timestamp) && isType(it)) { it.addToken(tok, part, staff, voice); return it as unknown as GridSliceLike; }
      if (ts.equals(timestamp) && it.isDataSlice()) { const gs = mk(); this.slices.splice(i, 0, gs); return gs; }
      if (ts.getFloat() > timestamp.getFloat()) { const gs = mk(); this.slices.splice(i, 0, gs); return gs; }
    }
    const gs = mk(); this.slices.push(gs); return gs;
  }
  addClefToken(tok: string, timestamp: HumNum, part: number, staff: number, voice: number, maxstaff: number): GridSliceLike {
    return this.addInterpToken(SliceType.Clefs, tok, timestamp, part, staff, voice, maxstaff, (s) => s.isClefSlice());
  }
  addTimeSigToken(tok: string, timestamp: HumNum, part: number, staff: number, voice: number, maxstaff: number): GridSliceLike {
    return this.addInterpToken(SliceType.TimeSigs, tok, timestamp, part, staff, voice, maxstaff, (s) => s.isTimeSigSlice());
  }
  addKeySigToken(tok: string, timestamp: HumNum, part: number, staff: number, voice: number, maxstaff: number): GridSliceLike {
    return this.addInterpToken(SliceType.KeySigs, tok, timestamp, part, staff, voice, maxstaff, (s) => s.isKeySigSlice());
  }
  // C++ GridMeasure::addLabelToken/addLabelAbbrToken (humlib.cpp:8906+):
  // Labels slices sized by maxpart, token at (part, maxstaff-1); insert at
  // begin when no label slice at timestamp (C++ insert(begin)).
  addLabelToken(tok: string, timestamp: HumNum, part: number, _staff: number, voice: number, maxpart: number, maxstaff: number): GridSliceLike {
    const last = this.slices.length ? (this.slices[this.slices.length - 1] as unknown as GridSlice) : null;
    if (!last || (last.getTimestamp() as HumNum).getFloat() < timestamp.getFloat()) {
      const gs = new GridSlice(this as never, timestamp, SliceType.Labels, maxpart) as unknown as GridSliceLike;
      (gs as unknown as GridSlice).addToken(tok, part, maxstaff - 1, voice);
      this.slices.push(gs);
      return gs;
    }
    for (let i = 0; i < this.slices.length; i++) {
      const it = this.slices[i] as unknown as GridSlice;
      if (it.getTimestamp().equals(timestamp) && it.isLabelSlice()) {
        it.addToken(tok, part, maxstaff - 1, voice);
        return it as unknown as GridSliceLike;
      }
    }
    const gs = new GridSlice(this as never, timestamp, SliceType.Labels, maxpart) as unknown as GridSliceLike;
    (gs as unknown as GridSlice).addToken(tok, part, maxstaff - 1, voice);
    this.slices.splice(0, 0, gs);
    return gs;
  }
  addLabelAbbrToken(tok: string, timestamp: HumNum, part: number, _staff: number, voice: number, maxpart: number, maxstaff: number): GridSliceLike {
    const last = this.slices.length ? (this.slices[this.slices.length - 1] as unknown as GridSlice) : null;
    if (!last || (last.getTimestamp() as HumNum).getFloat() < timestamp.getFloat()) {
      const gs = new GridSlice(this as never, timestamp, SliceType.LabelAbbrs, maxpart) as unknown as GridSliceLike;
      (gs as unknown as GridSlice).addToken(tok, part, maxstaff - 1, voice);
      this.slices.push(gs);
      return gs;
    }
    for (let i = 0; i < this.slices.length; i++) {
      const it = this.slices[i] as unknown as GridSlice;
      if (it.getTimestamp().equals(timestamp) && it.isLabelAbbrSlice()) {
        it.addToken(tok, part, maxstaff - 1, voice);
        return it as unknown as GridSliceLike;
      }
    }
    const gs = new GridSlice(this as never, timestamp, SliceType.LabelAbbrs, maxpart) as unknown as GridSliceLike;
    (gs as unknown as GridSlice).addToken(tok, part, maxstaff - 1, voice);
    this.slices.splice(0, 0, gs);
    return gs;
  }
  addGlobalComment(tok: string, timestamp: HumNum): GridSliceLike {
    const last = this.slices.length ? (this.slices[this.slices.length - 1] as unknown as GridSlice) : null;
    if (!last || (last.getTimestamp() as HumNum).getFloat() < timestamp.getFloat()) {
      const gs = new GridSlice(this as never, timestamp, SliceType.GlobalComments, 1) as unknown as GridSliceLike;
      (gs as unknown as GridSlice).addToken(tok, 0, 0, 0);
      this.slices.push(gs);
      return gs;
    }
    for (let i = 0; i < this.slices.length; i++) {
      const it = this.slices[i] as unknown as GridSlice;
      const ts = it.getTimestamp() as HumNum;
      if (ts.equals(timestamp)) {
        if (it.isGlobalComment()) {
          const cur = it.at(0)?.at(0)?.[0]?.getToken?.()?.value;
          if (tok === cur) return it as unknown as GridSliceLike;
        }
        const gs = new GridSlice(this as never, timestamp, SliceType.GlobalComments, 1) as unknown as GridSliceLike;
        (gs as unknown as GridSlice).addToken(tok, 0, 0, 0);
        this.slices.splice(i, 0, gs);
        return gs;
      }
      if (ts.getFloat() > timestamp.getFloat()) {
        const gs = new GridSlice(this as never, timestamp, SliceType.GlobalComments, 1) as unknown as GridSliceLike;
        (gs as unknown as GridSlice).addToken(tok, 0, 0, 0);
        this.slices.splice(i, 0, gs);
        return gs;
      }
    }
    const gs = new GridSlice(this as never, timestamp, SliceType.GlobalComments, 1) as unknown as GridSliceLike;
    (gs as unknown as GridSlice).addToken(tok, 0, 0, 0);
    this.slices.push(gs);
    return gs;
  }
  getOwner(): HumGrid { return this.owner; }
  setOwner(owner: HumGrid): void { this.owner = owner; }
  getDuration(): HumNum { return new HumNum(this.duration); }
  setDuration(value: HumNum): void { this.duration.assign(value); }
  getTimestamp(): HumNum { return new HumNum(this.timestamp); }
  setTimestamp(value: HumNum): void { this.timestamp.assign(value); }
  getTimeSigDur(): HumNum { return new HumNum(this.timeSigDur); }
  setTimeSigDur(value: HumNum): void { this.timeSigDur.assign(value); }
  getStyle(): MeasureStyle { return this.style; }
  setStyle(style: MeasureStyle): void { this.style = style; }
  setFinalBarlineStyle(): void { this.style = MeasureStyle.Final; }
  setRepeatBackwardStyle(): void { this.style = MeasureStyle.RepeatBackward; }
  setInvisibleBarline(): void { this.style = MeasureStyle.Invisible; }
  isInvisible(): boolean { return this.style === MeasureStyle.Invisible; }
  isInvisibleBarline(): boolean { return this.style === MeasureStyle.Invisible; }
  isFinal(): boolean { return this.style === MeasureStyle.Final; }
  isRepeatBackward(): boolean { return this.style === MeasureStyle.RepeatBackward; }
  isRepeatForward(): boolean { return this.style === MeasureStyle.RepeatForward; }
  isRepeatBoth(): boolean { return this.style === MeasureStyle.RepeatBoth; }
  isDouble(): boolean { return this.style === MeasureStyle.Double; }
  setMeasureNumber(value: number): void { this.measureNumber = value; }
  getMeasureNumber(): number { return this.measureNumber; }
  // C++ GridMeasure::transferTokens (humlib.cpp:9365), with initial-barline logic.
  transferTokens(outfile: HumdrumFile, recip: boolean, addbar = false, _startbarnum = 0): boolean {
    if (this.slices.length > 0) {
      let slice = this.slices[this.slices.length - 1] as GridSliceLike & {
        isMeasureSlice?(): boolean; isDataSlice?(): boolean; getDuration(): HumNum; setDuration(d: HumNum): void; getTimestamp(): HumNum;
      };
      if (slice.isMeasureSlice?.() && this.slices.length >= 2) {
        let idx = this.slices.length - 2;
        while (idx > 0 && !(this.slices[idx] as GridSliceLike & { isDataSlice?(): boolean }).isDataSlice?.()) idx--;
        slice = this.slices[idx] as typeof slice;
      } else {
        slice = null as unknown as typeof slice;
      }
      if (slice && slice.isDataSlice?.() && slice.getDuration().isZero()) {
        const slicedur = this.timestamp.add(this.duration).sub(slice.getTimestamp());
        slice.setDuration(slicedur);
      }
    }
    let founddata = false;
    let addedbar = false;
    this.padInterpretationSlices();
    for (const it of this.slices) {
      const s = it as unknown as {
        isInvalidSlice(): boolean; isDataSlice(): boolean; isLayoutSlice(): boolean;
        isManipulatorSlice(): boolean; transferTokens(f: HumdrumFile, r: boolean): void;
      };
      if (s.isInvalidSlice()) continue;
      if (s.isDataSlice()) founddata = true;
      if (s.isLayoutSlice()) founddata = true;
      if (s.isManipulatorSlice()) founddata = true;
      if (founddata && addbar && !addedbar) {
        if (!this.duration.isZero()) {
          this.appendInitialBarline(outfile);
          addedbar = true;
        }
      }
      s.transferTokens(outfile, recip);
    }
    return true;
  }
  padInterpretationSlices(): void {
    // C++ has no equivalent: interpretation slices keep the voice counts
    // copied from their reference slice (plus null-fill). Padding empty
    // staves to the data maximum creates spurious spines (e.g. bracket
    // slices gain an extra `*` field and fail Humdrum import). Layout
    // slices that legitimately need full width already copy full counts
    // from their reference slice. Kept as no-op for call compat.
    return;
  }
  appendInitialBarline(outfile: HumdrumFile): void {
    const infile = outfile as unknown as {
      getLineCount(): number; back(): { getFieldCount(): number };
      appendLine(l: unknown): void;
    };
    if (infile.getLineCount() === 0) return;
    const fieldcount = infile.back().getFieldCount();
    const line = new HumdrumLine();
    for (let i = 0; i < fieldcount; i++) line.appendToken(new HumdrumToken('='));
    line.createLineFromTokens();
    outfile.appendLine(line);
  }
}

export class HumGrid {
  readonly measures: GridMeasure[] = [];
  private readonly verseCount: number[][] = Array.from({ length: 100 }, () => []);
  private readonly harmonyCount: number[] = Array(100).fill(0);
  private readonly dynamics: boolean[] = Array(100).fill(false);
  private readonly xmlids: boolean[] = Array(100).fill(false);
  private readonly figuredBass: boolean[] = Array(100).fill(false);
  private readonly harmony: boolean[] = Array(100).fill(false);
  private partNames: string[] = [];
  private allslices: GridSliceLike[] = [];
  private recip = false;
  private musicxmlbarlines = false;
  private pickup = false;

  enableRecipSpine(): void { this.recip = true; }
  hasPickup(): boolean { return this.pickup; }

  addMeasureToBack(): GridMeasure {
    const measure = new GridMeasure(this);
    this.measures.push(measure);
    return measure;
  }
  size(): number { return this.measures.length; }
  at(index: number): GridMeasure { return this.measures[index]; }
  back(): GridMeasure { return this.measures[this.measures.length - 1]; }
  empty(): boolean { return this.measures.length === 0; }

  getPartCount(): number {
    if (this.allslices.length > 0) return this.allslices[0].size();
    if (this.measures.length === 0) return 0;
    const first = this.measures[0];
    return first.size() === 0 ? 0 : first.size();
  }

  getStaffCount(partindex: number): number {
    if (this.measures.length === 0 || this.measures[0].size() === 0) return 0;
    const slice = this.measures[0].at(this.measures[0].size() - 1) as unknown as {
      length: number; at(p: number): { length: number };
    };
    const part = slice.at(partindex);
    return part ? part.length : 0;
  }

  getHarmonyCount(partindex: number): number {
    return partindex < 0 || partindex >= this.harmonyCount.length ? 0 : this.harmonyCount[partindex];
  }
  getDynamicsCount(partindex: number): number {
    return partindex < 0 || partindex >= this.dynamics.length ? 0 : (this.dynamics[partindex] ? 1 : 0);
  }
  getFiguredBassCount(partindex: number): number {
    return partindex < 0 || partindex >= this.figuredBass.length ? 0 : (this.figuredBass[partindex] ? 1 : 0);
  }
  getXmlidCount(partindex: number): number {
    return partindex < 0 || partindex >= this.xmlids.length ? 0 : (this.xmlids[partindex] ? 1 : 0);
  }
  getVerseCount(partindex: number, staffindex: number): number {
    if (partindex < 0 || partindex >= this.verseCount.length) return 0;
    const staffnumber = staffindex + 1;
    if (staffnumber < 1 || staffnumber >= this.verseCount[partindex].length) return 0;
    return this.verseCount[partindex][staffnumber] ?? 0;
  }
  hasDynamics(partindex: number): boolean { return partindex >= 0 && partindex < this.dynamics.length && this.dynamics[partindex]; }
  hasXmlids(partindex: number): boolean { return partindex >= 0 && partindex < this.xmlids.length && this.xmlids[partindex]; }
  hasFiguredBass(partindex: number): boolean { return partindex >= 0 && partindex < this.figuredBass.length && this.figuredBass[partindex]; }
  setDynamicsPresent(partindex: number): void { if (partindex >= 0 && partindex < this.dynamics.length) this.dynamics[partindex] = true; }
  setXmlidsPresent(partindex: number): void { if (partindex >= 0 && partindex < this.xmlids.length) this.xmlids[partindex] = true; }
  setFiguredBassPresent(partindex: number): void { if (partindex >= 0 && partindex < this.figuredBass.length) this.figuredBass[partindex] = true; }
  setHarmonyPresent(partindex: number): void { if (partindex >= 0 && partindex < this.harmony.length) this.harmony[partindex] = true; }
  setHarmonyCount(partindex: number, count: number): void {
    if (partindex < 0 || partindex > this.harmonyCount.length) return;
    this.harmonyCount[partindex] = count;
  }
  reportVerseCount(partindex: number, staffindex: number, count: number): void {
    if (count <= 0 || partindex < 0) return;
    const staffnumber = staffindex + 1;
    while (this.verseCount.length <= partindex) this.verseCount.push([]);
    const row = this.verseCount[partindex];
    while (row.length <= staffnumber) row.push(0);
    if (count > (row[staffnumber] ?? 0)) row[staffnumber] = count;
  }
  removeRedundantClefChanges(): void {
    const curclef: string[][] = [];
    let hasduplicate = false;
    for (let m = 0; m < this.measures.length; m++) {
      const measure = this.measures[m];
      for (const sl of measure.getSlices()) {
        const slice = sl as GridSlice;
        if (!slice.isClefSlice()) continue;
        let allempty = true;
        for (let p = 0; p < slice.length; p++) {
          for (let s = 0; s < (slice.at(p)?.length ?? 0); s++) {
            const staff = slice.at(p)?.at(s);
            if (!staff || staff.length < 1) continue;
            const voice = staff[0];
            const tok = voice?.getToken()?.value ?? '';
            if (!tok || tok === '*') continue;
            if (!tok.includes('clef')) { allempty = false; continue; }
            while (curclef.length <= p) curclef.push([]);
            if ((curclef[p].length ?? 0) <= s) {
              curclef[p][s] = tok;
              allempty = false;
              continue;
            }
            if (curclef[p][s] === tok) {
              hasduplicate = true;
              voice?.setToken('*');
            }
            else {
              curclef[p][s] = tok;
              allempty = false;
            }
          }
        }
        if (!hasduplicate) continue;
        if (allempty) slice.invalidate();
      }
    }
  }
  removeSibeliusIncipit(): void {
    if (!this.measures.length) return;
    const measure = this.measures[0];
    if (!measure.isInvisible()) return;
    this.measures.shift();
  }
  setVerseCount(partindex: number, staffindex: number, count: number): void {
    if (partindex < 0 || partindex > this.verseCount.length) return;
    const staffnumber = staffindex + 1;
    if (staffnumber < 0) return;
    while (this.verseCount.length <= partindex) this.verseCount.push([]);
    const row = this.verseCount[partindex];
    while (row.length <= staffnumber) row.push(0);
    row[staffnumber] = count;
  }
  deleteMeasure(index: number): void {
    if (index < 0 || index >= this.measures.length) throw new RangeError('GridMeasure index out of range');
    this.measures.splice(index, 1);
  }
  setPartName(index: number, name: string): void {
    if (index < 0 || index >= 100) return;
    while (this.partNames.length <= index) this.partNames.push('');
    this.partNames[index] = name;
  }
  getPartName(index: number): string { return index >= 0 && index < this.partNames.length ? this.partNames[index] : ''; }
  setAllSlices(slices: GridSliceLike[]): void { this.allslices = slices; }
  getAllSlices(): GridSliceLike[] { return this.allslices; }
  // C++ HumGrid::buildSingleList (humlib.cpp:13883).
  buildSingleList(): boolean {
    this.allslices.length = 0;
    for (const m of this.measures) {
      for (const s of m.getSlices()) this.allslices.push(s);
    }
    for (let i = 0; i < this.allslices.length - 1; i++) {
      const a = this.allslices[i] as unknown as { getTimestamp(): HumNum; setDuration(d: HumNum): void };
      const b = this.allslices[i + 1] as unknown as { getTimestamp(): HumNum };
      a.setDuration(b.getTimestamp().sub(a.getTimestamp()));
    }
    return this.allslices.length > 0;
  }
  // C++ HumGrid::calculateGridDurations (humlib.cpp:14737).
  calculateGridDurations(): void {
    if (!this.allslices.length) return;
    const last = this.allslices[this.allslices.length - 1] as unknown as {
      setDuration(d: HumNum): void; isNoteSlice(): boolean; length: number; at(p: number): unknown;
    };
    last.setDuration(new HumNum(0));
    if (!last.isNoteSlice()) return;
    for (let p = 0; p < last.length; p++) {
      const part = last.at(p) as Array<Array<{ getDuration(): HumNum } | null>>;
      for (const staff of part) {
        for (const voice of staff) {
          if (!voice) continue;
          if (voice.getDuration().getFloat() > 0) {
            last.setDuration(voice.getDuration());
            return;
          }
        }
      }
    }
  }
  // C++ HumGrid::addNullTokens (humlib.cpp:14233), minimal note path.
  addNullTokens(): void {
    for (let i = 0; i < this.allslices.length; i++) {
      const slice = this.allslices[i] as unknown as {
        isNoteSlice(): boolean; length: number;
        at(p: number): Array<Array<{ isNull(): boolean; getToken(): { value: string } | null } | null>>;
      };
      if (!slice.isNoteSlice()) continue;
      for (let p = 0; p < slice.length; p++) {
        const part = slice.at(p);
        for (let s = 0; s < part.length; s++) {
          const staff = part[s];
          for (let v = 0; v < staff.length; v++) {
            const gv = staff[v];
            if (!gv || gv.isNull()) continue;
            this.extendDurationToken(i, p, s, v);
          }
        }
      }
    }
    this.addNullTokensForGraceNotes();
    this.adjustClefChanges();
    this.addNullTokensForClefChanges();
    this.addNullTokensForLayoutComments();
    this.checkForNullDataHoles();
  }
  adjustClefChanges(): void {
    for (let i = 1; i < this.measures.length; i++) {
      const slices = this.measures[i].getSlices();
      if (!slices.length) continue;
      const first = slices[0] as unknown as GridSlice;
      if (!first.isClefSlice()) continue;
      slices.shift();
      this.measures[i - 1].push_back(first as never);
    }
  }
  addNullTokensForClefChanges(): void {
    const all = this.allslices as unknown as GridSlice[];
    for (let i = 0; i < all.length; i++) {
      if (!all[i].isClefSlice()) continue;
      let nextnote: GridSlice | null = null;
      for (let j = i + 1; j < all.length; j++) {
        if (all[j].isNoteSlice()) { nextnote = all[j]; break; }
      }
      if (!nextnote) continue;
      let lastnote: GridSlice | null = null;
      for (let j = i - 1; j >= 0; j--) {
        if (all[j].isNoteSlice()) { lastnote = all[j]; break; }
      }
      if (!lastnote) continue;
      this.fillInNullTokensForClefChanges(all[i], lastnote, nextnote);
    }
  }
  fillInNullTokensForClefChanges(clefslice: GridSlice, lastnote: GridSlice, nextnote: GridSlice): void {
    for (let p = 0; p < clefslice.length; p++) {
      const staffcount = lastnote.at(p)?.length ?? 0;
      for (let s = 0; s < staffcount; s++) {
        let v1count = lastnote.at(p)?.at(s)?.length ?? 0;
        let v2count = nextnote.at(p)?.at(s)?.length ?? 0;
        const vgcount = clefslice.at(p)?.at(s)?.length ?? 0;
        if (v1count < 1) v1count = 1;
        if (v2count < 1) v2count = 1;
        if (v1count !== v2count) continue;
        if (vgcount === v1count) continue;
        const diff = v1count - vgcount;
        for (let i = 0; i < diff; i++) clefslice.at(p)?.at(s)?.push(new GridVoice('*', new HumNum(0)));
      }
    }
  }
  addNullTokensForLayoutComments(): void {
    const all = this.allslices as unknown as GridSlice[];
    for (let i = 0; i < all.length; i++) {
      if (!all[i].isLocalLayoutSlice()) continue;
      let nextnote: GridSlice | null = null;
      for (let j = i + 1; j < all.length; j++) {
        if (all[j].isNoteSlice()) { nextnote = all[j]; break; }
      }
      if (!nextnote) continue;
      let lastnote: GridSlice | null = null;
      for (let j = i - 1; j >= 0; j--) {
        if (all[j].isNoteSlice()) { lastnote = all[j]; break; }
      }
      let graceBetween = false;
      for (let j = i + 1; j < all.length; j++) {
        if (all[j].isNoteSlice()) break;
        if (all[j].isGraceSlice()) { graceBetween = true; break; }
      }
      this.fillInNullTokensForLayoutComments(all[i], lastnote, nextnote, graceBetween);
    }
  }
  fillInNullTokensForLayoutComments(layoutslice: GridSlice, lastnote: GridSlice | null, nextnote: GridSlice, graceBetween = false): void {
    // C++ HumGrid::fillInNullTokensForLayoutComments (humlib.cpp:14105).
    void graceBetween;
    if (!lastnote) return;
    for (let p = 0; p < layoutslice.length; p++) {
      const staffcount = lastnote.at(p)?.length ?? 0;
      for (let s = 0; s < staffcount; s++) {
        let v1count = lastnote.at(p)?.at(s)?.length ?? 0;
        let v2count = nextnote.at(p)?.at(s)?.length ?? 0;
        const vgcount = layoutslice.at(p)?.at(s)?.length ?? 0;
        if (v1count < 1) v1count = 1;
        if (v2count < 1) v2count = 1;
        if (v1count !== v2count) continue;
        if (vgcount === v1count) continue;
        const staff = layoutslice.at(p)?.at(s);
        if (!staff) continue;
        const diff = v1count - vgcount;
        for (let i = 0; i < diff; i++) staff.push(new GridVoice('!', new HumNum(0)));
      }
    }
  }
  checkForNullDataHoles(): void {
    const all = this.allslices as unknown as GridSlice[];
    for (let i = 0; i < all.length; i++) {
      const slice = all[i];
      if (!slice.isNoteSlice()) continue;
      for (let p = 0; p < slice.length; p++) {
        const part = slice.at(p);
        if (!part) continue;
        for (let s = 0; s < part.length; s++) {
          const staff = part.at(s);
          if (!staff) continue;
          for (let v = 0; v < staff.length; v++) {
            if (staff.at(v)) continue;
            staff[v] = new GridVoice();
            const duration = slice.getDuration();
            const recip = Convert.durationToRecip(duration) + 'ryy@';
            (staff.at(v) as GridVoice).setToken(recip);
          }
        }
      }
    }
  }
  addNullTokensForGraceNotes(): void {
    const all = this.allslices as unknown as GridSlice[];
    for (let i = 0; i < all.length; i++) {
      if (!all[i].isGraceSlice()) continue;
      let nextnote: GridSlice | null = null;
      for (let j = i + 1; j < all.length; j++) {
        if (all[j].isNoteSlice()) { nextnote = all[j]; break; }
      }
      if (!nextnote) continue;
      let lastnote: GridSlice | null = null;
      for (let j = i - 1; j >= 0; j--) {
        if (all[j].isNoteSlice()) { lastnote = all[j]; break; }
      }
      if (!lastnote) continue;
      this.fillInNullTokensForGraceNotes(all[i], lastnote, nextnote);
    }
  }
  fillInNullTokensForGraceNotes(graceslice: GridSlice, lastnote: GridSlice, nextnote: GridSlice): void {
    // WASM 6.3.0-425dd7b grows the grace spine to the wider neighbor only
    // when the neighbors agree on the voice count (asap-127 measure 118 is
    // a shrinking transition and stays narrow). Mirrors C++ humlib.cpp:14180.
    for (let p = 0; p < graceslice.length; p++) {
      const staffcount = lastnote.at(p)?.length ?? 0;
      for (let s = 0; s < staffcount; s++) {
        let v1count = lastnote.at(p)?.at(s)?.length ?? 0;
        let v2count = nextnote.at(p)?.at(s)?.length ?? 0;
        const vgcount = graceslice.at(p)?.at(s)?.length ?? 0;
        if (v1count < 1) v1count = 1;
        if (v2count < 1) v2count = 1;
        if (v1count !== v2count) continue;
        if (vgcount === v1count) continue;
        const diff = v1count - vgcount;
        for (let i = 0; i < diff; i++) graceslice.at(p)?.at(s)?.push(new GridVoice('.', new HumNum(0)));
      }
    }
  }
  // C++ HumGrid::extendDurationToken (humlib.cpp:14548), minimal note path.
  extendDurationToken(slicei: number, parti: number, staffi: number, voicei: number): void {
    if (slicei < 0 || slicei >= this.allslices.length - 1) return;
    type Slice = {
      hasSpines(): boolean; isGraceSlice(): boolean; isDataSlice(): boolean;
      isInvalidSlice(): boolean; getTimestamp(): HumNum; getDuration(): HumNum; setDuration(d: HumNum): void;
      getType(): number; length: number;
      at(p: number): Array<Array<{
        getToken(): { value: string } | null; setToken(t: string): void;
      } | null>>;
    };
    const cur = this.allslices[slicei] as unknown as Slice;
    if (!cur.hasSpines() || cur.isGraceSlice()) return;
    const gv = cur.at(parti)?.[staffi]?.[ voicei ];
    const token = gv?.getToken();
    if (!token || token.value === '.') return;
    let tokendur: HumNum;
    try { tokendur = recipToDuration(token.value); } catch { return; }
    if (tokendur.getFloat() === 0) return;
    const currts = cur.getTimestamp();
    const next = this.allslices[slicei + 1] as unknown as Slice;
    const nextts = next.getTimestamp();
    const slicedur = nextts.sub(currts);
    let timeleft = tokendur.sub(slicedur);
    if (timeleft.getFloat() <= 0) return;
    let s = slicei + 1;
    let curts = nextts;
    while (s < this.allslices.length && timeleft.getFloat() > 0) {
      const sl = this.allslices[s] as unknown as Slice;
      if (!sl.hasSpines()) { s++; continue; }
      let nexts = 1;
      while (s < this.allslices.length - nexts && !(this.allslices[s + nexts] as unknown as Slice).hasSpines()) nexts++;
      let nts: HumNum;
      if (s < this.allslices.length - nexts) nts = (this.allslices[s + nexts] as unknown as Slice).getTimestamp();
      else nts = curts.add(sl.getDuration());
      const sdur = nts.sub(curts);
      curts = nts;
      if (sl.isGraceSlice()) sl.setDuration(new HumNum(0));
      else if (sl.isDataSlice()) {
        const staff = sl.at(parti)?.[staffi] as unknown as GridStaff | undefined;
        if (staff) staff.setNullTokenLayer(voicei, sl.getType(), sdur);
        timeleft = timeleft.sub(sdur);
      }
      else if (!sl.isInvalidSlice()) {
        const staff = sl.at(parti)?.[staffi] as unknown as GridStaff | undefined;
        const existing = staff && voicei < staff.length ? staff[voicei] : null;
        const etok = existing?.getToken?.() as unknown as { value: string } | null;
        if (staff && (!existing || !etok)) {
          staff.setNullTokenLayer(voicei, sl.getType(), sdur);
        }
      }
      s++;
      if (s === this.allslices.length - 1) {
        (this.allslices[s] as unknown as Slice).setDuration(new HumNum(timeleft));
      }
    }
  }
  setPartStaffDimensions(nextevent: (GridSlice | null)[][], startslice: GridSlice): void {
    nextevent.length = 0;
    for (const sl of this.allslices as unknown as GridSlice[]) {
      if (!sl.isNoteSlice || !sl.isNoteSlice()) continue;
      nextevent.length = sl.length;
      for (let p = 0; p < sl.length; p++) {
        nextevent[p] = [];
        for (let j = 0; j < (sl.at(p)?.length ?? 0); j++) nextevent[p].push(startslice);
      }
      break;
    }
  }
  addInvisibleRestsInFirstTrack(): void {
    const all = this.allslices as unknown as GridSlice[];
    if (!all.length) return;
    const nextevent: (GridSlice | null)[][] = [];
    this.setPartStaffDimensions(nextevent, all[all.length - 1]);
    for (let i = all.length - 1; i >= 0; i--) {
      const slice = all[i];
      if (!slice.isNoteSlice || !slice.isNoteSlice()) continue;
      for (let p = 0; p < slice.length; p++) {
        const part = slice.at(p);
        if (!part) continue;
        for (let s = 0; s < part.length; s++) {
          const staff = part.at(s);
          if (!staff || staff.length === 0) continue;
          const gv = staff[0];
          if (!gv || gv.isNull()) continue;
          if (!nextevent[p] || nextevent[p][s] === null || nextevent[p][s] === undefined) {
            if (nextevent[p]) nextevent[p][s] = slice;
            continue;
          }
          this.addInvisibleRest(nextevent as GridSlice[][], i, p, s);
        }
      }
    }
  }
  addInvisibleRest(nextevent: GridSlice[][], index: number, p: number, s: number): void {
    const all = this.allslices as unknown as GridSlice[];
    const ending = nextevent[p][s];
    if (!ending) return;
    const endtime = ending.getTimestamp();
    const starting = all[index];
    const starttime = starting.getTimestamp();
    const stok = starting.at(p)?.at(s)?.[0]?.getToken?.() as unknown as { value: string } | null;
    if (!stok) return;
    let duration: HumNum;
    try { duration = recipToDuration(stok.value); } catch { return; }
    if (duration.getFloat() === 0) return;
    const difference = endtime.sub(starttime);
    const gap = difference.sub(duration);
    if (gap.getFloat() === 0) { nextevent[p][s] = starting; return; }
    const target = starttime.add(duration);
    const targetFloat = target.getFloat();
    const kern = Convert.durationToRecip(gap) + 'ryy';
    for (let i = index + 1; i < all.length; i++) {
      const sl = all[i];
      if (!sl.isNoteSlice || !sl.isNoteSlice()) continue;
      const timestampFloat = sl.getTimestamp().getFloat();
      if (timestampFloat < targetFloat) continue;
      if (timestampFloat !== targetFloat) { nextevent[p][s] = starting; return; }
      const staff = sl.at(p)?.at(s);
      if (staff && staff.length > 0 && !staff[0]) staff[0] = new GridVoice();
      if (staff && staff.length > 0 && staff[0]) staff[0].setToken(kern);
      break;
    }
    nextevent[p][s] = starting;
  }
  // C++ HumGrid::transferTokens (humlib.cpp:12732), minimal note path
  // (measure lines / headers / manipulators ported separately).
  transferTokens(outfile: HumdrumFile, _startbarnum: number, interp: string): boolean {
    this.buildSingleList();
    this.calculateGridDurations();
    this.addNullTokens();
    this.addInvisibleRestsInFirstTrack();
    this.addMeasureLines();
    this.buildSingleList();
    this.cleanTempos();
    this.addLastMeasure();
    if (this.manipulatorCheck()) {
      this.cleanupManipulators();
    }
    this.insertPartNames(outfile);
    this.insertStaffIndications(outfile);
    this.insertPartIndications(outfile);
    this.insertExclusiveInterpretationLine(outfile, interp);
    const addstartbar = !this.pickup && !this.musicxmlbarlines;
    let status = true;
    for (let m = 0; m < this.measures.length; m++) {
      status = this.measures[m].transferTokens(outfile, this.recip, addstartbar && m === 0, _startbarnum) && status;
    }
    this.insertDataTerminationLine(outfile);
    for (const line of (outfile as unknown as { m_lines?: unknown[] }).m_lines ?? []) {
      (line as unknown as { createLineFromTokens(): void }).createLineFromTokens();
    }
    void HumdrumLine;
    void HumdrumToken;
    return status;
  }
  insertExclusiveInterpretationLine(outfile: HumdrumFile, interp: string): void {
    if (!this.measures.length || this.measures[0].empty()) return;
    const line = new HumdrumLine();
    if (this.recip) line.appendToken(new HumdrumToken('**recip'));
    const slice = this.measures[0].at(0) as unknown as { length: number; at(p: number): { length: number } };
    for (let p = slice.length - 1; p >= 0; p--) {
      const part = slice.at(p);
      for (let s = part.length - 1; s >= 0; s--) {
        line.appendToken(new HumdrumToken(interp));
        this.insertExInterpSides(line, p, s);
      }
      this.insertExInterpSides(line, p, -1);
    }
    line.createLineFromTokens();
    outfile.insertLine(0, line);
  }
  getFirstSpinedSliceOf(measure: GridMeasure): GridSlice | null {
    for (const s of measure.getSlices()) {
      const gs = s as GridSlice;
      if (!gs.hasSpines()) continue;
      return gs;
    }
    return null;
  }
  getLastSpinedSliceOf(measure: GridMeasure): GridSlice | null {
    const slices = measure.getSlices();
    for (let i = slices.length - 1; i >= 0; i--) {
      const gs = slices[i] as GridSlice;
      if (gs.isGlobalLayout() || gs.isGlobalComment() || gs.isReferenceRecord()) continue;
      return gs;
    }
    return null;
  }
  getBarStyle(measure: GridMeasure): string {
    if (measure.isDouble()) return '||';
    if (measure.isFinal()) return '=';
    if (measure.isInvisibleBarline()) return '-';
    if (measure.isRepeatBoth()) return ':|!|:';
    if (measure.isRepeatBackward()) return ':|!';
    if (measure.isRepeatForward()) return '!|:';
    return '';
  }
  createBarToken(m: number, barnum: number, measure: GridMeasure): string {
    const barstyle = this.getBarStyle(measure);
    if (this.musicxmlbarlines) {
      if (barstyle === '=') return '==' + String(m + 1);
      return '=' + String(m + 1) + barstyle;
    }
    if (barnum > 0) {
      if (barstyle === '=') return '==' + String(barnum);
      return '=' + String(barnum) + barstyle;
    }
    if (barstyle === '=') return '==';
    return '=' + barstyle;
  }
  // C++ HumGrid::cleanTempos (humlib.cpp:15485): replicate the first found
  // tempo token across every empty voice of the tempo slice (asap-230
  // prints *MM168 on both data spines even though only one was placed).
  cleanTempos(): void {
    const all = this.allslices as unknown as GridSlice[];
    const width = (sl: GridSlice): number => {
      let n = 0;
      for (let p = 0; p < sl.length; p++) for (let s = 0; s < (sl.at(p)?.length ?? 0); s++) n += Math.max(1, sl.at(p)?.at(s)?.length ?? 0);
      return n;
    };
    // ponytail: WASM widens a narrow tempo slice to the surrounding note
    // width (asap-230 *MM168) while src-cpp keeps maxstaff parts. Rebuild as
    // one part x N staves with MM first, '*' middle, empty last for the fill
    // below. Single-part scores only; multi-part wide tempos unobserved.
    const singlePart = all.every((sl) => !sl.isNoteSlice || !sl.isNoteSlice() || sl.length <= 1);
    if (singlePart) {
      all.forEach((sl, i) => {
        if (!sl.isTempoSlice || !sl.isTempoSlice()) return;
        let target = 0;
        for (let j = i - 1; j >= 0; j--) { if (all[j].isNoteSlice && all[j].isNoteSlice()) { target = width(all[j]); break; } }
        for (let j = i + 1; j < all.length; j++) { if (all[j].isNoteSlice && all[j].isNoteSlice()) { target = Math.max(target, width(all[j])); break; } }
        if (target <= width(sl)) return;
        let first: string | null = null;
        for (let p = sl.length - 1; p >= 0 && !first; p--) {
          for (let s = (sl.at(p)?.length ?? 0) - 1; s >= 0 && !first; s--) {
            const st = sl.at(p)?.at(s);
            for (let v = 0; v < Math.max(1, st?.length ?? 0); v++) {
              const t = st?.at(v)?.getToken?.()?.value ?? null;
              if (t && t !== '*') { first = t; break; }
            }
          }
        }
        sl.length = 0;
        const part = new GridPart();
        sl.push(part);
        for (let s = 0; s < target; s++) {
          const st = new GridStaff();
          part.push(st);
          const gv = new GridVoice();
          if (s === 0 && first) gv.setToken(first);
          else if (s > 0 && s < target - 1) gv.setToken('*');
          st.push(gv);
        }
      });
    }
    for (const sl of all) {
      if (!sl.isTempoSlice || !sl.isTempoSlice()) continue;
      let tok: { value: string } | null = null;
      for (let p = 0; p < sl.length && !tok; p++) {
        const part = sl.at(p);
        if (!part) continue;
        for (let s = 0; s < part.length && !tok; s++) {
          const staff = part.at(s);
          if (!staff) continue;
          for (let v = 0; v < staff.length; v++) {
            const gv = staff.at(v) as unknown as { getToken(): { value: string } | null } | null;
            const t = gv?.getToken() ?? null;
            if (t) { tok = t; break; }
          }
        }
      }
      if (!tok) continue;
      for (let p = 0; p < sl.length; p++) {
        const part = sl.at(p);
        if (!part) continue;
        for (let s = 0; s < part.length; s++) {
          const staff = part.at(s);
          if (!staff) continue;
          for (let v = 0; v < staff.length; v++) {
            const gv = staff.at(v) as unknown as { getToken(): unknown; setToken(t: unknown): void } | null;
            if (gv && !gv.getToken()) gv.setToken(tok);
          }
        }
      }
    }
  }
  addMeasureLines(): void {
    for (let m = 0; m < this.measures.length - 1; m++) {
      const measure = this.measures[m];
      const nextmeasure = this.measures[m + 1];
      if (nextmeasure.size() === 0) continue;
      const firstspined = this.getFirstSpinedSliceOf(nextmeasure);
      if (!firstspined) continue;
      const timestamp = firstspined.getTimestamp();
      if (measure.size() === 0) continue;
      if (measure.getDuration().isZero()) continue;
      const mslice = new GridSlice(measure, timestamp, SliceType.Measures);
      const endslice = this.getLastSpinedSliceOf(measure);
      measure.push_back(mslice as never);
      const partcount = firstspined.length;
      for (let p = 0; p < partcount; p++) {
        const part = new GridPart();
        mslice.push(part);
        const staffcount = firstspined.at(p)?.length ?? 0;
        for (let s = 0; s < staffcount; s++) {
          const staff = new GridStaff();
          part.push(staff);
          const vcount = (endslice?.at(p)?.at(s)?.length ?? 0) as number;
          const nextvcount = (firstspined.at(p)?.at(s)?.length ?? 0) as number;
          let lcount = Math.min(vcount, nextvcount);
          if (lcount === 0) lcount = 1;
          for (let v = 0; v < lcount; v++) {
            staff.push(new GridVoice(this.createBarToken(m, measure.getMeasureNumber(), measure), new HumNum(0)));
          }
        }
      }
    }
  }
  cloneStructureFrom(other: GridSlice): GridSlice {
    const out = new GridSlice(other.getMeasure(), other.getTimestamp(), other.getType());
    for (let p = 0; p < other.length; p++) {
      const part = new GridPart();
      out.push(part);
      for (let s = 0; s < (other.at(p)?.length ?? 0); s++) part.push(new GridStaff());
    }
    return out;
  }
  cleanupManipulators(): void {
    let current: GridSlice | null = null;
    let last: GridSlice | null = null;
    for (let m = 0; m < this.measures.length; m++) {
      const slices = this.measures[m].getSlices();
      for (let i = 0; i < slices.length; i++) {
        last = current;
        current = slices[i] as GridSlice;
        if (current.getType() !== SliceType.Manipulators) {
          if (last && last.getType() !== SliceType.Manipulators) this.matchVoices(current, last);
          continue;
        }
        if (last && last.getType() !== SliceType.Manipulators) this.matchVoices(current, last);
        const newslices: GridSlice[] = [];
        this.cleanManipulator(newslices, current);
        if (newslices.length) {
          for (let j = 0; j < newslices.length; j++) slices.splice(i + j, 0, newslices[j] as never);
          i += newslices.length;
        }
      }
    }
  }
  cleanManipulator(newslices: GridSlice[], curr: GridSlice): void {
    newslices.length = 0;
    let output: GridSlice | null;
    while ((output = this.checkManipulatorExpand(curr))) newslices.push(output);
    while ((output = this.checkManipulatorContract(curr))) newslices.push(output);
  }
  checkManipulatorExpand(curr: GridSlice): GridSlice | null {
    let neednew = false;
    for (let p = 0; p < curr.length && !neednew; p++) {
      for (let s = 0; s < (curr.at(p)?.length ?? 0) && !neednew; s++) {
        const staff = curr.at(p)?.at(s);
        if (!staff) continue;
        for (let v = 0; v < staff.length; v++) {
          const tok = staff[v]?.getToken()?.value ?? '';
          if (tok.startsWith('*^') && tok.length > 2 && /\d/.test(tok[2])) { neednew = true; break; }
        }
      }
    }
    if (!neednew) return null;
    const newmanip = this.cloneStructureFrom(curr);
    for (let p = 0; p < curr.length; p++) {
      for (let s = 0; s < (curr.at(p)?.length ?? 0); s++) {
        this.adjustExpansionsInStaff(newmanip, curr, p, s);
      }
    }
    return newmanip;
  }
  adjustExpansionsInStaff(newmanip: GridSlice, curr: GridSlice, p: number, s: number): void {
    const newstaff = newmanip.at(p)?.at(s);
    const curstaff = curr.at(p)?.at(s);
    if (!newstaff || !curstaff) return;
    const originalsize = curstaff.length;
    let cv = 0;
    for (let v = 0; v < originalsize; v++) {
      const curvoice = curstaff[cv];
      const tok = curvoice?.getToken()?.value ?? '';
      if (tok.startsWith('*^')) {
        if (tok.length > 2 && /\d/.test(tok[2])) {
          const count = Number.parseInt(tok.slice(2), 10) || 0;
          if (curvoice) newstaff.push(curvoice);
          curvoice?.setToken('*^');
          curstaff[cv] = new GridVoice('*', new HumNum(0));
          if (count <= 3) curstaff.splice(cv + 1, 0, new GridVoice('*^', new HumNum(0)));
          else curstaff.splice(cv + 1, 0, new GridVoice('*^' + (count - 1), new HumNum(0)));
          cv++;
          continue;
        }
        else {
          if (curvoice) newstaff.push(curvoice);
          curstaff[cv] = new GridVoice('*', new HumNum(0));
          curstaff.splice(cv, 0, new GridVoice('*', new HumNum(0)));
          cv++;
          continue;
        }
      }
      newstaff.push(new GridVoice('*', new HumNum(0)));
      cv++;
    }
  }
  checkManipulatorContract(curr: GridSlice): GridSlice | null {
    let neednew = false;
    let init = false;
    let lastTok = '';
    for (let p = curr.length - 1; p >= 0 && !neednew; p--) {
      for (let s = (curr.at(p)?.length ?? 1) - 1; s >= 0; s--) {
        const staff = curr.at(p)?.at(s);
        if (!staff || !staff.length) continue;
        const tok = staff[staff.length - 1]?.getToken()?.value ?? '';
        if (!init) { lastTok = tok; init = true; continue; }
        if (tok === '*v' && lastTok === '*v') { neednew = true; break; }
        lastTok = tok;
      }
    }
    if (!neednew) return null;
    const newmanip = this.cloneStructureFrom(curr);
    let lastvoice: GridVoice | null = null;
    let laststaff: GridStaff | null = null;
    let lastp = 0;
    let lasts = 0;
    let partsplit = -1;
    let foundnew = false;
    for (let p = curr.length - 1; p >= 0 && !foundnew; p--) {
      for (let s = (curr.at(p)?.length ?? 1) - 1; s >= 0; s--) {
        const staff = curr.at(p)?.at(s);
        if (!staff || !staff.length) continue;
        const voice = staff[staff.length - 1];
        const newstaff = newmanip.at(p)?.at(s);
        if (lastvoice) {
          const vt = voice?.getToken()?.value ?? '';
          const lt = lastvoice.getToken()?.value ?? '';
          if (vt === '*v' && lt === '*v') {
            const newlaststaff = newmanip.at(lastp)?.at(lasts);
            if (newstaff && newlaststaff) this.transferMerges(staff, laststaff, newstaff, newlaststaff, p, s);
            foundnew = true;
            partsplit = p;
            break;
          }
        }
        else {
          void voice;
        }
        laststaff = staff;
        lastvoice = staff[staff.length - 1];
        lastp = p;
        lasts = s;
      }
      if (foundnew) {
        if (partsplit > 0) this.transferOtherParts(curr, newmanip, partsplit);
        break;
      }
    }
    this.adjustVoices(curr, newmanip, partsplit);
    return newmanip;
  }
  adjustVoices(curr: GridSlice, newmanip: GridSlice, _partsplit: number): void {
    for (let p = 0; p < curr.length; p++) {
      for (let s = 0; s < (curr.at(p)?.length ?? 0); s++) {
        const s1 = curr.at(p)?.at(s);
        const s2 = newmanip.at(p)?.at(s);
        if (!s1 || !s2) continue;
        if (s1.length === 0 && s2.length > 0) this.createMatchedVoiceCount(s1, s2);
        else if (s2.length === 0 && s1.length > 0) this.createMatchedVoiceCount(s2, s1);
      }
    }
  }
  createMatchedVoiceCount(snew: GridStaff, sold: GridStaff): void {
    if (snew.length !== 0) return;
    for (let i = 0; i < sold.length; i++) snew.push(new GridVoice('*', new HumNum(0)));
  }
  matchVoices(current: GridSlice | null, last: GridSlice | null): void {
    if (!current || !last) return;
    void last;
    const pcount1 = current.length;
    const pcount2 = current.length;
    if (pcount1 !== pcount2) return;
    for (let i = 0; i < pcount1; i++) {
      const part1 = current.at(i);
      const part2 = current.at(i);
      if (!part1 || !part2 || part1.length !== part2.length) continue;
      for (let j = 0; j < part1.length; j++) {
        const staff1 = part1.at(j);
        const staff2 = part2.at(j);
        if (!staff1 || !staff2) continue;
        if (staff1.length === staff2.length) continue;
        if (staff2.length > staff1.length) continue;
        const difference = staff1.length - staff2.length;
        for (let k = 0; k < difference; k++) staff2.push(new GridVoice('*', new HumNum(0)));
      }
    }
  }
  transferMerges(oldstaff: GridStaff, oldlaststaff: GridStaff | null, newstaff: GridStaff, newlaststaff: GridStaff, pindex: number, sindex: number): void {
    if (!oldstaff || !oldlaststaff) return;
    void pindex;
    void sindex;
    for (let t = 0; t < oldstaff.length; t++) {
      newstaff.push(new GridVoice('*', new HumNum(0)));
    }
    let addednull = false;
    for (let t = 0; t < oldlaststaff.length; t++) {
      const tok = oldlaststaff[t]?.getToken()?.value ?? '';
      if (tok === '*v') {
        const moved = oldlaststaff[t];
        if (moved) newlaststaff.push(moved);
        if (!addednull) {
          oldlaststaff[t] = new GridVoice('*', new HumNum(0));
          addednull = true;
        }
        else oldlaststaff[t] = null;
      }
      else newlaststaff.push(new GridVoice('*', new HumNum(0)));
    }
    for (let t = oldlaststaff.length - 1; t >= 0; t--) {
      if (oldlaststaff[t] === null) oldlaststaff.pop();
      else break;
    }
  }
  transferOtherParts(oldline: GridSlice, newline: GridSlice, maxpart: number): void {
    if (maxpart >= oldline.length) return;
    for (let i = 0; i < maxpart; i++) {
      const tmp = oldline[i];
      oldline[i] = newline[i];
      newline[i] = tmp;
      for (let j = 0; j < (oldline[i]?.length ?? 0); j++) {
        const oldstaff = oldline[i]?.at(j);
        const newstaff = newline[i]?.at(j);
        if (!oldstaff || !newstaff) continue;
        let voices = newstaff.length;
        let adjustment = 0;
        for (let k = 0; k < voices; k++) {
          if (newstaff[k]?.getToken()?.value === '*v') adjustment++;
        }
        if (adjustment > 0) adjustment--;
        voices -= adjustment;
        oldstaff.length = voices;
        for (let k = 0; k < voices; k++) oldstaff[k] = new GridVoice('*', new HumNum(0));
      }
    }
    for (let p = 0; p < newline.length; p++) {
      for (let s = 0; s < (newline.at(p)?.length ?? 0); s++) {
        const newstaff = newline.at(p)?.at(s);
        const oldstaff = oldline.at(p)?.at(s);
        if (!newstaff || !oldstaff) continue;
        if (newstaff.length >= oldstaff.length) continue;
        const diff = oldstaff.length - newstaff.length;
        for (let v = 0; v < diff; v++) newstaff.push(new GridVoice('*', new HumNum(0)));
      }
    }
  }
  manipulatorCheckPair(ice1: GridSlice | null, ice2: GridSlice | null): GridSlice | null {
    if (!ice1 || !ice2 || !ice1.hasSpines() || !ice2.hasSpines()) return null;
    if (ice1.length !== ice2.length) return null;
    let needmanip = false;
    for (let p = 0; p < ice1.length && !needmanip; p++) {
      if ((ice1.at(p)?.length ?? 0) !== (ice2.at(p)?.length ?? 0)) return null;
      for (let s = 0; s < (ice1.at(p)?.length ?? 0); s++) {
        let v1count = ice1.at(p)?.at(s)?.length ?? 0;
        if (v1count < 1) v1count = 1;
        let v2count = ice2.at(p)?.at(s)?.length ?? 0;
        if (v2count < 1) v2count = 1;
        if (v1count !== v2count) { needmanip = true; break; }
      }
    }
    if (!needmanip) return null;
    const mslice = new GridSlice(ice1.getMeasure(), ice2.getTimestamp(), SliceType.Manipulators);
    for (let p = 0; p < ice1.length; p++) {
      const part = new GridPart();
      mslice.push(part);
      for (let s = 0; s < (ice1.at(p)?.length ?? 0); s++) {
        const staff = new GridStaff();
        part.push(staff);
        let v1count = ice1.at(p)?.at(s)?.length ?? 0;
        let v2count = ice2.at(p)?.at(s)?.length ?? 0;
        if (v2count < 1) v2count = 1;
        if (v1count < 1) v1count = 1;
        if (v1count === v2count) {
          for (let v = 0; v < v1count; v++) staff.push(new GridVoice('*', new HumNum(0)));
        }
        else if (v1count < v2count) {
          if (v2count === 2 * v1count) {
            for (let z = 0; z < v1count; z++) staff.push(new GridVoice('*^', new HumNum(0)));
          }
          else if (v1count > 0 && v2count - v1count > 2 * v1count) {
            for (let z = 0; z < v1count - 1; z++) staff.push(new GridVoice('*^', new HumNum(0)));
            const extra = v2count - (v1count - 1) * 2;
            staff.push(new GridVoice(extra > 2 ? '*^' + extra : '*^', new HumNum(0)));
          }
          else {
            const doubled = v2count - v1count;
            const notdoubled = v1count - doubled;
            for (let z = 0; z < notdoubled; z++) staff.push(new GridVoice('*', new HumNum(0)));
            staff.push(new GridVoice(doubled > 1 ? '*^' + (doubled + 1) : '*^', new HumNum(0)));
          }
        }
        else {
          const shrink = v1count - v2count + 1;
          const notshrink = v1count - shrink;
          for (let z = 0; z < notshrink; z++) staff.push(new GridVoice('*', new HumNum(0)));
          for (let z = 0; z < shrink; z++) staff.push(new GridVoice('*v', new HumNum(0)));
        }
      }
    }
    return mslice;
  }
  manipulatorCheck(): boolean {
    let output = false;
    for (let m = 0; m < this.measures.length; m++) {
      const slices = this.measures[m].getSlices();
      for (let i = 0; i < slices.length; i++) {
        const s1 = slices[i] as GridSlice;
        if (!s1.hasSpines()) continue;
        let s2: GridSlice | null = null;
        for (let j = i + 1; j < slices.length; j++) {
          const cand = slices[j] as GridSlice;
          if (cand.hasSpines()) { s2 = cand; break; }
        }
        if (!s2) {
          for (let mm = m + 1; mm < this.measures.length && !s2; mm++) {
            for (const sl of this.measures[mm].getSlices()) {
              const cand = sl as GridSlice;
              if (cand.hasSpines()) { s2 = cand; break; }
            }
          }
        }
        const manipulator = this.manipulatorCheckPair(s1, s2);
        if (!manipulator) continue;
        output = true;
        slices.splice(i + 1, 0, manipulator as never);
        i++;
      }
    }
    return output;
  }
  addLastMeasure(): void {
    if (!this.measures.length) return;
    const lastMeasure = this.measures[this.measures.length - 1];
    if (lastMeasure.size() === 0) return;
    const model = lastMeasure.getSlices()[lastMeasure.size() - 1] as GridSlice;
    if (!model) return;
    const timestamp = model.getTimestamp();
    const barstyle = this.getBarStyle(lastMeasure);
    const mslice = new GridSlice(model.getMeasure(), timestamp, SliceType.Measures);
    mslice.setTimestamp(timestamp);
    lastMeasure.push_back(mslice as never);
    for (let p = 0; p < model.length; p++) {
      const part = new GridPart();
      mslice.push(part);
      for (let s = 0; s < (model.at(p)?.length ?? 0); s++) {
        const staff = new GridStaff();
        part.push(staff);
        staff.push(new GridVoice('=' + barstyle, new HumNum(0)));
      }
    }
  }
  // C++ HumGrid::insertPartIndications presumes the FIRST entry holds spines
  // (humlib.cpp:14904): measure 0 front slice, usually the Labels slice.
  private firstSpinedSlice(): { length: number; at(p: number): { length: number } } | null {
    if (!this.measures.length || this.measures[0].empty()) return null;
    return this.measures[0].at(0) as unknown as { length: number; at(p: number): { length: number } };
  }
  /** First slice of measure 0 with spines (C++ GridMeasure::getFirstSpinedSlice). */
  private getFirstSpinedSliceOfMeasure0(): { length: number; at(p: number): { length: number }; hasSpines(): boolean } | null {
    if (!this.measures.length) return null;
    for (const s of this.measures[0].getSlices()) {
      const gs = s as unknown as { length: number; at(p: number): { length: number }; hasSpines(): boolean };
      if (!gs.hasSpines()) continue;
      return gs;
    }
    return null;
  }
  insertPartNames(outfile: HumdrumFile): void {
    const names = this.partNames;
    if (!names.length) return;
    const slice = this.firstSpinedSlice();
    if (!slice) return;
    const line = new HumdrumLine();
    if (this.recip) line.appendToken(new HumdrumToken('*'));
    for (let p = slice.length - 1; p >= 0; p--) {
      const part = slice.at(p);
      for (let s = part.length - 1; s >= 0; s--) {
        let text = '*';
        const pname = names[p] ?? '';
        if (pname) text += `I"${pname}`;
        line.appendToken(new HumdrumToken(text));
        this.insertSideNullInterpretations(line, p, s);
      }
      this.insertSideNullInterpretations(line, p, -1);
    }
    line.createLineFromTokens();
    outfile.insertLine(0, line);
  }
  insertSideNullInterpretations(line: HumdrumLine, part: number, staff: number): void {
    if (staff < 0) {
      if (this.hasDynamics(part)) line.appendToken(new HumdrumToken('*'));
      if (this.hasFiguredBass(part)) line.appendToken(new HumdrumToken('*'));
      for (let i = 0; i < this.getHarmonyCount(part); i++) line.appendToken(new HumdrumToken('*'));
    }
    else {
      for (let i = 0; i < this.getXmlidCount(part); i++) line.appendToken(new HumdrumToken('*'));
      for (let i = 0; i < this.getVerseCount(part, staff); i++) line.appendToken(new HumdrumToken('*'));
    }
  }
  insertExInterpSides(line: HumdrumLine, part: number, staff: number): void {
    if (staff >= 0) {
      for (let i = 0; i < this.getXmlidCount(part); i++) line.appendToken(new HumdrumToken('**xmlid'));
    }
    if (staff >= 0) {
      for (let i = 0; i < this.getVerseCount(part, staff); i++) line.appendToken(new HumdrumToken('**text'));
    }
    if (staff < 0 && this.hasDynamics(part)) line.appendToken(new HumdrumToken('**dynam'));
    if (staff < 0 && this.hasFiguredBass(part)) line.appendToken(new HumdrumToken('**fb'));
    if (staff < 0) {
      for (let i = 0; i < this.getHarmonyCount(part); i++) line.appendToken(new HumdrumToken('**mxhm'));
    }
  }
  insertSidePartInfo(line: HumdrumLine, part: number, staff: number): void {
    if (staff < 0) {
      if (this.hasDynamics(part)) line.appendToken(new HumdrumToken(`*part${part + 1}`));
      if (this.hasFiguredBass(part)) line.appendToken(new HumdrumToken(`*part${part + 1}`));
      for (let i = 0; i < this.getHarmonyCount(part); i++) line.appendToken(new HumdrumToken(`*part${part + 1}`));
    }
    else {
      for (let i = 0; i < this.getXmlidCount(part); i++) line.appendToken(new HumdrumToken(`*part${part + 1}`));
      for (let i = 0; i < this.getVerseCount(part, staff); i++) line.appendToken(new HumdrumToken(`*part${part + 1}`));
    }
  }
  insertSideStaffInfo(line: HumdrumLine, part: number, staff: number, staffnum: number): void {
    if (staffnum < 0) {
      if (this.hasDynamics(part)) line.appendToken(new HumdrumToken('*'));
      if (this.hasFiguredBass(part)) line.appendToken(new HumdrumToken('*'));
      for (let i = 0; i < this.getHarmonyCount(part); i++) line.appendToken(new HumdrumToken('*'));
      return;
    }
    const label = staffnum > 0 ? `*staff${staffnum}` : '*';
    for (let i = 0; i < this.getXmlidCount(part); i++) line.appendToken(new HumdrumToken(label));
    for (let i = 0; i < this.getVerseCount(part, staff); i++) line.appendToken(new HumdrumToken(label));
  }
  insertSideTerminals(line: HumdrumLine, part: number, staff: number): void {
    if (staff < 0) {
      if (this.hasDynamics(part)) line.appendToken(new HumdrumToken('*-'));
      if (this.hasFiguredBass(part)) line.appendToken(new HumdrumToken('*-'));
      for (let i = 0; i < this.getHarmonyCount(part); i++) line.appendToken(new HumdrumToken('*-'));
    }
    else {
      for (let i = 0; i < this.getXmlidCount(part); i++) line.appendToken(new HumdrumToken('*-'));
      for (let i = 0; i < this.getVerseCount(part, staff); i++) line.appendToken(new HumdrumToken('*-'));
    }
  }
  insertPartIndications(outfile: HumdrumFile): void {
    const slice = this.firstSpinedSlice();
    if (!slice) return;
    const line = new HumdrumLine();
    if (this.recip) line.appendToken(new HumdrumToken('*'));
    for (let p = slice.length - 1; p >= 0; p--) {
      const part = slice.at(p);
      for (let s = part.length - 1; s >= 0; s--) {
        line.appendToken(new HumdrumToken(`*part${p + 1}`));
        this.insertSidePartInfo(line, p, s);
      }
      this.insertSidePartInfo(line, p, -1);
    }
    line.createLineFromTokens();
    outfile.insertLine(0, line);
  }
  insertStaffIndications(outfile: HumdrumFile): void {
    const slice = this.firstSpinedSlice();
    if (!slice) return;
    let staffcount = 0;
    for (let p = 0; p < slice.length; p++) staffcount += slice.at(p).length;
    const line = new HumdrumLine();
    if (this.recip) line.appendToken(new HumdrumToken('*'));
    for (let p = slice.length - 1; p >= 0; p--) {
      const part = slice.at(p);
      for (let s = part.length - 1; s >= 0; s--) {
        line.appendToken(new HumdrumToken(`*staff${staffcount--}`));
        this.insertSideStaffInfo(line, p, s, staffcount + 1);
      }
      this.insertSideStaffInfo(line, p, -1, -1);
    }
    line.createLineFromTokens();
    outfile.insertLine(0, line);
  }
  insertDataTerminationLine(outfile: HumdrumFile): void {
    const line = new HumdrumLine();
    const slice = this.measures.length && !this.measures[0].empty()
      ? (this.measures[0].at(0) as unknown as { length: number; at(p: number): { length: number } })
      : null;
    if (slice) {
      for (let p = slice.length - 1; p >= 0; p--) {
        const part = slice.at(p);
        for (let s = part.length - 1; s >= 0; s--) {
          line.appendToken(new HumdrumToken('*-'));
          this.insertSideTerminals(line, p, s);
        }
        this.insertSideTerminals(line, p, -1);
      }
    }
    line.createLineFromTokens();
    outfile.appendLine(line);
  }
}
