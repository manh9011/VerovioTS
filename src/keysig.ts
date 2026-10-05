/**
 * Pure TypeScript translation of Verovio's `src/keysig.cpp` /
 * `include/vrv/keysig.h`.
 *
 * `KeySig` models the MEI `<keySig>` element.
 *
 * C++ multiple inheritance (LayerElement + ObjectListInterface + AttColor +
 * AttKeySigAnl + AttKeySigLog + AttKeySigVis + AttPitch + AttVisibility) is
 * represented through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode, MapOfOctavedPitchAccid } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, ObjectListInterface, VrvObject } from './object.js';
import { Comparison } from './comparison.js';
import { InstColor, InstKeySigLog, InstPitch, InstVisibility } from './atts_shared.js';
import { InstKeySigAnl } from './atts_analytical.js';
import { InstKeySigVis } from './atts_visual.js';
import { KeyAccid } from './keyaccid.js';
import { ACCIDENTAL_WRITTEN_f, ACCIDENTAL_WRITTEN_ff, ACCIDENTAL_WRITTEN_n,
  ACCIDENTAL_WRITTEN_NONE, ACCIDENTAL_WRITTEN_s, ACCIDENTAL_WRITTEN_ss,
  data_ACCIDENTAL_WRITTEN } from './accid.js';
import { PITCHNAME_b, PITCHNAME_c, data_PITCHNAME } from './pitchinterface.js';
import { Clef } from './clef.js';
import { LogError, LogWarning } from './vrv.js';

// data_PITCHNAME ordinals (libmei/dist/atttypes.h): c=1 .. b=7.
const PITCHNAME_d = 2;
const PITCHNAME_e = 3;
const PITCHNAME_f = 4;
const PITCHNAME_g = 5;
const PITCHNAME_a = 6;
// data_CLEFSHAPE ordinals.
const CLEFSHAPE_G = 1;
const CLEFSHAPE_GG = 2;
const CLEFSHAPE_F = 3;
const CLEFSHAPE_C = 4;
// data_OCTAVE_DIS ordinals.
const OCTAVE_DIS_NONE = 0;
const OCTAVE_DIS_8 = 8;
// data_STAFFREL_basic ordinals.
const STAFFREL_basic_above = 1;
const STAFFREL_basic_below = 2;

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_COLOR = 109;
const ATT_KEYSIGANL = 5;
const ATT_KEYSIGLOG = 143;
const ATT_KEYSIGVIS = 264;
const ATT_PITCH = 183;
const ATT_VISIBILITY = 228;

// From include/vrv/vrvdef.h.
const OCTAVE_OFFSET = 4;

/** Useful information regarding a KeyAccid child (C++ `KeyAccidInfo`). */
export interface KeyAccidInfo {
  accid: data_ACCIDENTAL_WRITTEN;
  pname: data_PITCHNAME;
}

/** Structural contract for a `Clef` consumed by `KeySig::GetOctave`. */
export interface KeySigClefLike {
  GetShape(): number;
  GetLine(): number;
  GetDis(): number;
  GetDisPlace(): number;
}

/** ObjectListInterface composition keeping only KEYACCID children. */
class KeySigListInterface extends ObjectListInterface {
  protected override FilterList(childList: VrvObject[]): void {
    for (let i = 0; i < childList.length;) {
      if (childList[i].Is(ClassId.KEYACCID)) ++i;
      else childList.splice(i, 1);
    }
  }
}

/**
 * Pure TypeScript translation of Verovio's `KeySig`.
 */
export class KeySig extends LayerElement {
  private readonly objectList: KeySigListInterface;

  private color?: InstColor;
  private keySigAnl?: InstKeySigAnl;
  private keySigLog?: InstKeySigLog;
  private keySigVis?: InstKeySigVis;
  private pitch?: InstPitch;
  private visibility?: InstVisibility;

  /**
   * Variables for storing cancellation introduced by the key sig.
   * Values are set in StaffDefDrawingInterface::ReplaceKeySig
   */
  public m_skipCancellation: boolean = false;
  public m_drawingCancelAccidType: data_ACCIDENTAL_WRITTEN = ACCIDENTAL_WRITTEN_n;
  public m_drawingCancelAccidCount: number = 0;

  /**
   * The clef used for drawing.
   * Calculated from layer if not set (C++ `std::optional<Clef>`).
   */
  private m_drawingClef: Clef | null = null;

  public constructor() {
    super(ClassId.KEYSIG);
    this.objectList = new KeySigListInterface();
    this.objectList.SetInterfaceOwner(this as unknown as VrvObject);
    this.ensureAttributes();
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_KEYSIGANL);
    this.RegisterAttClass(ATT_KEYSIGLOG);
    this.RegisterAttClass(ATT_KEYSIGVIS);
    this.RegisterAttClass(ATT_PITCH);
    this.RegisterAttClass(ATT_VISIBILITY);
    this.Reset();
  }

  private ensureAttributes(): void {
    this.color ??= new InstColor();
    this.keySigAnl ??= new InstKeySigAnl();
    this.keySigLog ??= new InstKeySigLog();
    this.keySigVis ??= new InstKeySigVis();
    this.pitch ??= new InstPitch();
    this.visibility ??= new InstVisibility();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.color!.ResetColor();
    this.keySigAnl!.ResetKeySigAnl();
    this.keySigLog!.ResetKeySigLog();
    this.keySigVis!.ResetKeySigVis();
    this.pitch!.ResetPitch();
    this.visibility!.ResetVisibility();

    // key change drawing values
    this.m_skipCancellation = false;
    this.m_drawingCancelAccidType = ACCIDENTAL_WRITTEN_n;
    this.m_drawingCancelAccidCount = 0;

    this.ResetDrawingClef();
  }

  public override Clone(): VrvObject {
    const clone = new KeySig();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all members (composition adaptation:
    // AssignFrom covers only the object-tree state).
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasSig()) clone.SetSig(this.GetSig());
    if (this.HasAccid()) clone.SetAccid(this.GetAccid());
    if (this.HasMode()) clone.SetMode(this.GetMode());
    if (this.HasCancelaccid()) clone.SetCancelaccid(this.GetCancelaccid());
    if (this.HasPname()) clone.SetPname(this.GetPname());
    if (this.HasVisible()) clone.SetVisible(this.GetVisible());
    clone.m_skipCancellation = this.m_skipCancellation;
    clone.m_drawingCancelAccidType = this.m_drawingCancelAccidType;
    clone.m_drawingCancelAccidCount = this.m_drawingCancelAccidCount;
    if (this.m_drawingClef) clone.SetDrawingClef(this.m_drawingClef);
    return clone;
  }

  public override GetClassName(): string { return 'keySig'; }

  /** Override the method since alignment is required. */
  public override HasToBeAligned(): boolean { return true; }

  /** Override the method since check is required. */
  public override IsScoreDefElement(): boolean {
    return !!(this.GetParent() && this.GetFirstAncestor(ClassId.SCOREDEF));
  }

  /**
   * Add an element (a keyAccid) to a keySig.
   */
  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.KEYACCID) return true;
    return VrvObject.IsEditorialElement(classId);
  }

  /**
   * Additional check when adding a child.
   */
  public override AddChildAdditionalCheck(child: VrvObject): boolean {
    if (this.IsAttribute() && !child.IsAttribute()) {
      LogError('Adding a non-attribute child to an attribute is not allowed');
      return false;
    }
    return super.AddChildAdditionalCheck(child);
  }

  /** Accid number getter. */
  public GetAccidCount(fromAttribute = false): number {
    if (fromAttribute) {
      return this.HasSig() ? this.GetSig()[0] : 0;
    }
    else {
      return this.GetListSize();
    }
  }

  /** Accid type getter. */
  public GetAccidType(): data_ACCIDENTAL_WRITTEN {
    if (this.HasNonAttribKeyAccidChildren() || !this.HasSig()) {
      return ACCIDENTAL_WRITTEN_NONE;
    }
    else {
      return this.GetSig()[1];
    }
  }

  public HasNonAttribKeyAccidChildren(): boolean {
    const childList = this.GetList();
    return childList.some((child) => !child.IsAttribute());
  }

  public GenerateKeyAccidAttribChildren(): void {
    // IsAttributeComparison(KEYACCID): delete matching (attribute) children
    const isAttributeKeyAccid = new Comparison((object: VrvObject) =>
      object.GetClassId() === ClassId.KEYACCID && object.IsAttribute());
    this.DeleteChildrenByComparison(isAttributeKeyAccid);

    if (this.HasEmptyList()) {
      for (let i = 0; i < this.GetAccidCount(true); ++i) {
        const info = this.GetKeyAccidInfoAt(i);
        if (info) {
          const keyAccid = new KeyAccid();
          keyAccid.SetAccid(info.accid);
          keyAccid.SetPname(info.pname);
          keyAccid.SetAttribute(true);
          this.AddChild(keyAccid);
        }
      }
    }
    else if (this.HasSig()) {
      LogWarning(
        `Attribute key signature is ignored, since KeySig '${this.GetID()}' contains KeyAccid children.`);
    }
  }

  /**
   * Try to convert a keySig content (keyAccid) to a @sig value.
   * This can work only if the content represents a standard accidental series.
   * Return an empty @sig when the content cannot be converted.
   */
  public ConvertToSig(): [number, data_ACCIDENTAL_WRITTEN] {
    const sig: [number, data_ACCIDENTAL_WRITTEN] = [-1, ACCIDENTAL_WRITTEN_NONE as data_ACCIDENTAL_WRITTEN];
    const childList = this.GetList();
    if (childList.length > 1) {
      let accidType: data_ACCIDENTAL_WRITTEN = ACCIDENTAL_WRITTEN_NONE;
      let isCommon = true;
      let pos = 0;
      for (const child of childList) {
        const keyAccid = child as unknown as KeyAccid;
        const curType = keyAccid.GetAccid();
        if (curType === ACCIDENTAL_WRITTEN_n) {
          // Skip naturals encoded explicitly
          continue;
        }
        // We have not a key sig type at this stage
        if (accidType === ACCIDENTAL_WRITTEN_NONE) {
          if (curType === ACCIDENTAL_WRITTEN_s || curType === ACCIDENTAL_WRITTEN_f) {
            accidType = curType;
          }
        }
        if (accidType !== curType) {
          LogWarning('All the keySig content cannot be converted to @sig because the accidental type is not a '
            + 'flat or a sharp, or mixes them');
          break;
        }
        if (accidType === ACCIDENTAL_WRITTEN_f && KeySig.S_PNAME_FOR_FLATS[pos] !== keyAccid.GetPname()) {
          isCommon = false;
          break;
        }
        else if (accidType === ACCIDENTAL_WRITTEN_s && KeySig.S_PNAME_FOR_SHARPS[pos] !== keyAccid.GetPname()) {
          isCommon = false;
          break;
        }
        pos++;
      }
      if (!isCommon) {
        LogWarning('KeySig content cannot be converted to @sig because the accidental series is not standard');
        return sig;
      }
      sig[0] = pos;
      sig[1] = accidType;
    }
    return sig;
  }

  /**
   * Fill the map of modified pitches.
   */
  public FillMap(mapOfPitchAccid: MapOfOctavedPitchAccid): void {
    mapOfPitchAccid.clear();

    const childList = this.GetList(); // make sure it's initialized
    if (childList.length > 0) {
      for (const child of childList) {
        const keyAccid = child as unknown as KeyAccid;
        for (let oct = 0; oct < 10; ++oct) {
          mapOfPitchAccid.set(keyAccid.GetPname() + oct * 7, keyAccid.GetAccid());
        }
      }
      return;
    }

    const accidType = this.GetAccidType();
    for (let i = 0; i < this.GetAccidCount(true); ++i) {
      for (let oct = 0; oct < 10; ++oct) {
        mapOfPitchAccid.set(KeySig.GetAccidPnameAt(accidType, i) + oct * 7, accidType);
      }
    }
  }

  public GetFifthsInt(): number {
    if (this.GetSig()[1] === ACCIDENTAL_WRITTEN_f) {
      return -1 * this.GetSig()[0];
    }
    else if (this.GetSig()[1] === ACCIDENTAL_WRITTEN_s) {
      return this.GetSig()[0];
    }
    return 0;
  }

  /**
   * Set/Get the drawing clef.
   */
  public GetDrawingClef(): Clef | null {
    return this.m_drawingClef;
  }

  public ResetDrawingClef(): void {
    this.m_drawingClef = null;
  }

  public SetDrawingClef(clef: Clef | null): void {
    if (clef) {
      this.m_drawingClef = clef.Clone() as Clef;
      this.m_drawingClef.CloneReset();
    }
    else {
      this.m_drawingClef = null;
    }
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitKeySig');
  }

  public AcceptConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitKeySig');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitKeySigEnd');
  }

  public AcceptEndConst(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitKeySigEnd');
  }

  private visit(functor: unknown, method: string): FunctorCode {
    const f = functor as Record<string, unknown>;
    const fn = f[method];
    if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, this);
    if (typeof f['VisitObject'] === 'function') {
      return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  //----------------//
  // Static methods //
  //----------------//

  /**
   * Static methods for calculating position.
   */
  public static GetAccidPnameAt(alterationType: data_ACCIDENTAL_WRITTEN, pos: number): data_PITCHNAME {
    if (alterationType === ACCIDENTAL_WRITTEN_f) {
      return KeySig.S_PNAME_FOR_FLATS[pos % 7];
    }
    else {
      return KeySig.S_PNAME_FOR_SHARPS[pos % 7];
    }
  }

  public static GetOctave(accidType: data_ACCIDENTAL_WRITTEN, pitch: data_PITCHNAME, clef: KeySigClefLike): number {
    let accidSet = 0; // flats
    let keySet = 0;

    if (accidType === ACCIDENTAL_WRITTEN_s) accidSet = 1;

    const shapeLine = (clef.GetShape() << 8) | clef.GetLine();

    switch (shapeLine) {
      case (CLEFSHAPE_G << 8) | 1: keySet = 0; break;
      case (CLEFSHAPE_G << 8) | 2: keySet = 1; break;
      case (CLEFSHAPE_G << 8) | 3: keySet = 2; break;
      case (CLEFSHAPE_G << 8) | 4: keySet = 3; break;
      case (CLEFSHAPE_G << 8) | 5: keySet = 4; break;

      case (CLEFSHAPE_GG << 8) | 1: keySet = 0; break;
      case (CLEFSHAPE_GG << 8) | 2: keySet = 1; break;
      case (CLEFSHAPE_GG << 8) | 3: keySet = 2; break;
      case (CLEFSHAPE_GG << 8) | 4: keySet = 3; break;
      case (CLEFSHAPE_GG << 8) | 5: keySet = 4; break;

      case (CLEFSHAPE_C << 8) | 1: keySet = 2; break;
      case (CLEFSHAPE_C << 8) | 2: keySet = 3; break;
      case (CLEFSHAPE_C << 8) | 3: keySet = 4; break;
      case (CLEFSHAPE_C << 8) | 4: keySet = 5; break;
      case (CLEFSHAPE_C << 8) | 5: keySet = 6; break;

      case (CLEFSHAPE_F << 8) | 3: keySet = 6; break;
      case (CLEFSHAPE_F << 8) | 4: keySet = 7; break;
      case (CLEFSHAPE_F << 8) | 5: keySet = 8; break;

      // does not really exist but just to make it somehow aligned with the clef
      case (CLEFSHAPE_F << 8) | 1: keySet = 8; break;
      case (CLEFSHAPE_F << 8) | 2: keySet = 8; break;

      default: keySet = 4; break;
    }

    let octave = KeySig.OCTAVE_MAP[accidSet][keySet][pitch - 1] + OCTAVE_OFFSET;

    let disPlace = 0;
    if (clef.GetDis() !== OCTAVE_DIS_NONE) {
      // DIS 22 not supported
      if (clef.GetDisPlace() === STAFFREL_basic_above) {
        disPlace = (clef.GetDis() === OCTAVE_DIS_8) ? -1 : -2;
      }
      else if (clef.GetDisPlace() === STAFFREL_basic_below) {
        disPlace = (clef.GetDis() === OCTAVE_DIS_8) ? 1 : 2;
      }
    }
    if (clef.GetShape() === CLEFSHAPE_GG) disPlace = 1;

    octave -= disPlace;

    return octave;
  }

  //----------------//
  // Static members //
  //----------------//

  public static readonly S_PNAME_FOR_FLATS: data_PITCHNAME[]
    = [PITCHNAME_b, PITCHNAME_e, PITCHNAME_a, PITCHNAME_d, PITCHNAME_g, PITCHNAME_c, PITCHNAME_f];
  public static readonly S_PNAME_FOR_SHARPS: data_PITCHNAME[]
    = [PITCHNAME_f, PITCHNAME_c, PITCHNAME_g, PITCHNAME_d, PITCHNAME_a, PITCHNAME_e, PITCHNAME_b];

  private static readonly OCTAVE_MAP: number[][][] = [
    [
      // flats
      // C,  D,  E,  F,  G,  A,  B
      [1, 1, 1, 0, 0, 0, 0], // french g = G-1
      [1, 1, 1, 0, 0, 0, 0], // treble = G-2
      [0, 0, 0, 0, 0, 0, 0], // soprano = C-1 (G-3)
      [0, 0, 0, 0, 0, -1, -1], // mezzo = C-2
      [0, 0, 0, -1, -1, -1, -1], // alto = C-3
      [0, 0, 0, -1, -1, -1, -1], // tenor = C-4
      [-1, -1, -1, -1, -1, -1, -1], // bariton = F-3 (C-5)
      [-1, -1, -1, -2, -2, -2, -2], // bass = F-4
      [-1, -1, -1, -1, -1, -2, -2], // sub-bass = F-5
    ],
    [
      // sharps
      // C,  D,  E,  F,  G,  A,  B
      [1, 1, 1, 1, 1, 0, 0], // french g
      [1, 1, 1, 1, 1, 0, 0], // treble
      [0, 0, 0, 0, 0, 0, 0], // soprano
      [0, 0, 0, 0, 0, 0, 0], // mezzo
      [0, 0, 0, 0, 0, -1, -1], // alto
      [0, 0, 0, -1, -1, -1, -1], // tenor
      [-1, -1, -1, -1, -1, -1, -1], // bariton
      [-1, -1, -1, -1, -1, -2, -2], // bass
      [-1, -1, -1, -1, -1, -2, -2], // sub-bass
    ],
  ];

  //---------//
  // ObjectListInterface forwarding
  //---------//
  public GetList(): VrvObject[] { return this.objectList.GetList(); }
  public HasEmptyList(): boolean { return this.objectList.HasEmptyList(); }
  public GetListSize(): number { return this.objectList.GetListSize(); }
  public GetListFront(): VrvObject { return this.objectList.GetListFront(); }
  public GetListBack(): VrvObject { return this.objectList.GetListBack(); }
  public GetListIndex(element: VrvObject): number { return this.objectList.GetListIndex(element); }

  /**
   * Generate key accid information for a given position.
   */
  private GetKeyAccidInfoAt(pos: number): KeyAccidInfo | null {
    if ((pos < 0) || (pos > 12)) return null;

    const info: KeyAccidInfo = { accid: ACCIDENTAL_WRITTEN_NONE, pname: PITCHNAME_c };
    if (this.GetAccidType() === ACCIDENTAL_WRITTEN_f) {
      info.accid = (pos < 7) ? ACCIDENTAL_WRITTEN_f : ACCIDENTAL_WRITTEN_ff;
      info.pname = KeySig.S_PNAME_FOR_FLATS[pos % 7];
    }
    else if (this.GetAccidType() === ACCIDENTAL_WRITTEN_s) {
      info.accid = (pos < 7) ? ACCIDENTAL_WRITTEN_s : ACCIDENTAL_WRITTEN_ss;
      info.pname = KeySig.S_PNAME_FOR_SHARPS[pos % 7];
    }
    else {
      return null;
    }
    return info;
  }

  //---------//
  // Attribute forwarding surfaces
  //---------//

  // AttColor
  public ResetColor(): void { this.color!.ResetColor(); }
  public SetColor(value: any): void { this.color!.SetColor(value); }
  public GetColor(): any { return this.color!.GetColor(); }
  public HasColor(): boolean { return this.color!.HasColor(); }

  // AttKeySigAnl (accid, mode)
  public ResetKeySigAnl(): void { this.keySigAnl!.ResetKeySigAnl(); }
  public SetAccid(value: any): void { this.keySigAnl!.SetAccid(value); }
  public GetAccid(): any { return this.keySigAnl!.GetAccid(); }
  public HasAccid(): boolean { return this.keySigAnl!.HasAccid(); }
  public SetMode(value: any): void { this.keySigAnl!.SetMode(value); }
  public GetMode(): any { return this.keySigAnl!.GetMode(); }
  public HasMode(): boolean { return this.keySigAnl!.HasMode(); }

  // AttKeySigLog
  public ResetKeySigLog(): void { this.keySigLog!.ResetKeySigLog(); }
  /** C++ `data_KEYSIGNATURE` is `std::pair<int, data_ACCIDENTAL_WRITTEN>`; TS tuple `[count, accidType]`. */
  public SetSig(value: [number, data_ACCIDENTAL_WRITTEN]): void { this.keySigLog!.SetSig(value); }
  public GetSig(): [number, data_ACCIDENTAL_WRITTEN] { return this.keySigLog!.GetSig(); }
  public HasSig(): boolean { return this.keySigLog!.HasSig(); }

  // AttKeySigVis (cancelaccid)
  public ResetKeySigVis(): void { this.keySigVis!.ResetKeySigVis(); }
  public SetCancelaccid(value: number): void { this.keySigVis!.SetCancelaccid(value); }
  public GetCancelaccid(): number { return this.keySigVis!.GetCancelaccid(); }
  public HasCancelaccid(): boolean { return this.keySigVis!.HasCancelaccid(); }

  // AttPitch (pname)
  public ResetPitch(): void { this.pitch!.ResetPitch(); }
  public SetPname(value: any): void { this.pitch!.SetPname(value); }
  public GetPname(): any { return this.pitch!.GetPname(); }
  public HasPname(): boolean { return this.pitch!.HasPname(); }

  // AttVisibility
  public ResetVisibility(): void { this.visibility!.ResetVisibility(); }
  public SetVisible(value: any): void { this.visibility!.SetVisible(value); }
  public GetVisible(): any { return this.visibility!.GetVisible(); }
  public HasVisible(): boolean { return this.visibility!.HasVisible(); }
}

ObjectFactory.GetInstance().Register('keySig', ClassId.KEYSIG, () => new KeySig());
