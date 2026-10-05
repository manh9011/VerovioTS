import { Interface } from './interface.js';
import { AttClassId, ClassId, FunctorCode, InterfaceId, OCTAVE_OFFSET, VRV_UNSET } from './vrvdef.js';
import { InstNoteGes, InstPitchGes } from './atts_gestural.js';
import { InstOctave, InstPitch } from './atts_shared.js';

export type data_PITCHNAME = number;
export type data_OCTAVE = number;

// libmei pitch-name ordering is c=1 ... b=7; 0 is NONE.
export const PITCHNAME_NONE = 0;
export const PITCHNAME_c = 1;
export const PITCHNAME_d = 2;
export const PITCHNAME_e = 3;
export const PITCHNAME_f = 4;
export const PITCHNAME_g = 5;
export const PITCHNAME_a = 6;
export const PITCHNAME_b = 7;
export const MEI_UNSET_OCT = -127;

export interface PitchAttributesLike {
  ResetNoteGes(): void; ResetOctave(): void; ResetPitch(): void; ResetPitchGes(): void;
  GetPname(): data_PITCHNAME; SetPname(v: data_PITCHNAME): void; HasPname(): boolean;
  GetOct(): data_OCTAVE; SetOct(v: data_OCTAVE): void; HasOct(): boolean;
  HasOctDefault?(): boolean; GetOctDefault?(): data_OCTAVE;
}

export interface LayerLike { GetClefLocOffset(crossStaffElement: LayerElementLike | null): number; GetCrossStaffClefLocOffset(element: LayerElementLike, offset: number): number; }
export interface NoteLike extends LayerElementLike, PitchAttributesLike { HasLoc(): boolean; GetLoc(): number; }
export interface ChordLike extends LayerElementLike { GetTopNote(): NoteLike | null; GetBottomNote(): NoteLike | null; }
export interface CustosLike extends LayerElementLike { HasLoc(): boolean; GetLoc(): number; GetPname(): data_PITCHNAME; GetOct(): data_OCTAVE; }
export interface LayerElementLike { Is(id: number): boolean; GetFirstAncestor(id: number): LayerLike | null; }
export interface ClefLike { GetLine(): number; GetShape(): number; }

export class NoteGesAttributes extends InstNoteGes {}
export class OctaveAttributes extends InstOctave {}
export class PitchAttributes extends InstPitch {}
export class PitchGesAttributes extends InstPitchGes {}

const ATT_NOTEGES: AttClassId = 56;
const ATT_PITCHGES: AttClassId = 58;
const ATT_OCTAVE: AttClassId = 172;
const ATT_PITCH: AttClassId = 183;

const CLEFSHAPE_F = 0;
const CLEFSHAPE_G = 1;

export class PitchInterface extends Interface {
  private readonly noteGes = new InstNoteGes();
  private readonly octave = new InstOctave();
  private readonly pitch = new InstPitch();
  private readonly pitchGes = new InstPitchGes();
  private m_octDefault: data_OCTAVE = MEI_UNSET_OCT;

  constructor() {
    super();
    this.RegisterInterfaceAttClass(ATT_NOTEGES);
    this.RegisterInterfaceAttClass(ATT_OCTAVE);
    this.RegisterInterfaceAttClass(ATT_PITCH);
    this.RegisterInterfaceAttClass(ATT_PITCHGES);
    this.Reset();
  }

  override Reset(): void {
    this.ResetNoteGes(); this.ResetOctave(); this.ResetPitch(); this.ResetPitchGes(); this.m_octDefault = MEI_UNSET_OCT;
  }
  override IsInterface(): InterfaceId { return InterfaceId.INTERFACE_PITCH; }

  // AttNoteGes forwarding
  ResetNoteGes(): void { this.noteGes.ResetNoteGes(); }
  SetExtremis(v: any): void { this.noteGes.SetExtremis(v); }
  GetExtremis(): any { return this.noteGes.GetExtremis(); }
  HasExtremis(): boolean { return this.noteGes.HasExtremis(); }

  // AttOctave forwarding
  ResetOctave(): void { this.octave.ResetOctave(); }
  SetOct(v: data_OCTAVE): void { this.octave.SetOct(v); }
  GetOct(): data_OCTAVE { return this.octave.GetOct(); }
  HasOct(): boolean { return this.octave.HasOct(); }

  // AttPitch forwarding
  ResetPitch(): void { this.pitch.ResetPitch(); }
  SetPname(v: data_PITCHNAME): void { this.pitch.SetPname(v); }
  GetPname(): data_PITCHNAME { return this.pitch.GetPname(); }
  HasPname(): boolean { return this.pitch.HasPname(); }

  // AttPitchGes forwarding
  ResetPitchGes(): void { this.pitchGes.ResetPitchGes(); }
  SetOctGes(v: any): void { this.pitchGes.SetOctGes(v); }
  GetOctGes(): any { return this.pitchGes.GetOctGes(); }
  HasOctGes(): boolean { return this.pitchGes.HasOctGes(); }
  SetPnameGes(v: any): void { this.pitchGes.SetPnameGes(v); }
  GetPnameGes(): any { return this.pitchGes.GetPnameGes(); }
  HasPnameGes(): boolean { return this.pitchGes.HasPnameGes(); }
  SetPnum(v: any): void { this.pitchGes.SetPnum(v); }
  GetPnum(): any { return this.pitchGes.GetPnum(); }
  HasPnum(): boolean { return this.pitchGes.HasPnum(); }

  SetOctDefault(oct: data_OCTAVE): void { this.m_octDefault = oct; }
  GetOctDefault(): data_OCTAVE { return this.m_octDefault; }
  HasOctDefault(): boolean { return this.m_octDefault !== MEI_UNSET_OCT; }

  HasIdenticalPitchInterface(_other: PitchInterface | null): boolean {
    throw new Error('PitchInterface::HasIdenticalPitchInterface missing');
  }

  AdjustPitchByOffset(pitchOffset: number): void {
    let pname = this.GetPname() + pitchOffset;
    let oct = this.GetOct();
    while (pname > PITCHNAME_b) { pname -= 7; oct++; }
    while (pname < PITCHNAME_c) { pname += 7; oct--; }
    if (oct > 9) { oct = 9; pname = PITCHNAME_b; }
    else if (oct < 0) { oct = 0; pname = PITCHNAME_c; }
    this.SetPname(pname); this.SetOct(oct);
  }

  PitchDifferenceTo(pi: PitchInterface | null): number {
    if (!pi) throw new Error('PitchInterface: null pitch interface');
    return this.GetPname() - pi.GetPname() + 7 * (this.GetOct() - pi.GetOct());
  }

  AdjustPitchForNewClef(oldClef: ClefLike | null, newClef: ClefLike | null): void {
    if (!oldClef || !newClef) throw new Error('PitchInterface: missing clef');
    let pitchDiff = -2 * (newClef.GetLine() - oldClef.GetLine());
    if (oldClef.GetShape() === CLEFSHAPE_F) pitchDiff += 4;
    else if (oldClef.GetShape() === CLEFSHAPE_G) pitchDiff -= 4;
    if (newClef.GetShape() === CLEFSHAPE_F) pitchDiff -= 4;
    else if (newClef.GetShape() === CLEFSHAPE_G) pitchDiff += 4;
    this.AdjustPitchByOffset(pitchDiff);
  }

  static AdjustPname(pnameRef: { value: number }, octRef: { value: number }): void {
    if (pnameRef.value < PITCHNAME_c) { if (octRef.value > 0) octRef.value--; pnameRef.value = PITCHNAME_b; }
    else if (pnameRef.value > PITCHNAME_b) { if (octRef.value < 7) octRef.value++; pnameRef.value = PITCHNAME_c; }
  }

  static CalcLoc(element: LayerElementLike, layer: LayerLike | null, crossStaffElement: LayerElementLike | null, topChordNote?: boolean): number;
  static CalcLoc(pname: data_PITCHNAME, oct: number, clefLocOffset: number): number;
  static CalcLoc(a: LayerElementLike | data_PITCHNAME, b: LayerLike | number | null, c: LayerElementLike | number | null, d = true): number {
    if (typeof a === 'number') {
      return ((b as number - OCTAVE_OFFSET) * 7 + (a - 1) + (c as number));
    }
    const element = a;
    const layer = b as LayerLike | null;
    const crossStaffElement = c as LayerElementLike | null;
    if (element.Is(ClassId.CHORD)) {
      const chord = element as unknown as ChordLike;
      const note = d ? chord.GetTopNote() : chord.GetBottomNote();
      if (!note) throw new Error('PitchInterface::CalcLoc: missing chord note');
      return PitchInterface.CalcLoc(note, layer, crossStaffElement);
    } else if (element.Is(ClassId.NOTE)) {
      const note = element as unknown as NoteLike;
      if (note.HasLoc()) return note.GetLoc();
      if (note.HasPname() && (note.HasOct() || !!note.HasOctDefault?.())) {
        if (!layer) throw new Error('PitchInterface::CalcLoc: missing layer');
        let offset = layer.GetClefLocOffset(crossStaffElement);
        const parentLayer = element.GetFirstAncestor(ClassId.LAYER) as LayerLike | null;
        if (parentLayer !== layer && parentLayer) offset = parentLayer.GetCrossStaffClefLocOffset(element, offset);
        const oct = note.HasOct() ? note.GetOct() : note.GetOctDefault!();
        return PitchInterface.CalcLoc(note.GetPname(), oct, offset);
      }
      return 0;
    } else if (element.Is(ClassId.CUSTOS)) {
      const custos = element as unknown as CustosLike;
      if (custos.HasLoc()) return custos.GetLoc();
      if (!layer) throw new Error('PitchInterface::CalcLoc: missing layer');
      return PitchInterface.CalcLoc(custos.GetPname(), custos.GetOct(), layer.GetClefLocOffset(crossStaffElement));
    }
    throw new Error('PitchInterface::CalcLoc: unsupported element');
  }

  static CalcPitch(loc: number, clefLocOffset: number): [data_PITCHNAME, number] {
    const pitchPos = loc - clefLocOffset;
    const degree = ((pitchPos % 7) + 7) % 7;
    const octaveOffset = (pitchPos - degree) / 7;
    return [degree + 1, OCTAVE_OFFSET + octaveOffset];
  }
}
