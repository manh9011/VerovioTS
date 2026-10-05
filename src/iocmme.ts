/**
 * iocmme.ts — CmmeInput port of src-cpp/src/iocmme.cpp (1313 lines).
 * Real domain objects; WASM builds lack CMME support so C++ is the spec.
 */
import { Input, type DocLike } from './iobase.js';
import { LogWarning, UTF8to32 } from './vrv.js';
import { DocType } from './doc.js';
import { VrvObject } from './object.js';
import { ClassId, MeasureType, VisibilityType } from './vrvdef.js';
import { xml_document, xml_node } from './pugixml.js';
import { Mdiv } from './mdiv.js';
import { Score } from './score.js';
import { Section } from './section.js';
import { Staff } from './staff.js';
import { StaffGrp } from './staffgrp.js';
import { StaffDef } from './staffdef.js';
import { GrpSym } from './grpsym.js';
import { Label } from './label.js';
import { Text } from './text.js';
import { Layer } from './layer.js';
import { Measure } from './measure.js';
import { Note } from './note.js';
import { Rest } from './rest.js';
import { Space } from './space.js';
import { Accid } from './accid.js';
import { KeyAccid } from './keyaccid.js';
import { Clef } from './clef.js';
import { KeySig } from './keysig.js';
import { Mensur } from './mensur.js';
import { Proport } from './proport.js';
import { BarLine } from './barline.js';
import { Chord } from './chord.js';
import { Ligature } from './ligature.js';
import { Custos } from './custos.js';
import { Dot } from './dot.js';
import { Supplied } from './supplied.js';
import { App } from './app.js';
import { Lem } from './lem.js';
import { Rdg } from './rdg.js';
import { Annot } from './annot.js';
import { Verse } from './verse.js';
import { Syl } from './syl.js';
import { GenericLayerElement } from './genericlayerelement.js';
import { PITCHNAME_c, PITCHNAME_d, PITCHNAME_e, PITCHNAME_f, PITCHNAME_g, PITCHNAME_a, PITCHNAME_b } from './pitchinterface.js';
import { ACCIDENTAL_WRITTEN_f, ACCIDENTAL_WRITTEN_n, ACCIDENTAL_WRITTEN_s, ACCIDENTAL_WRITTEN_tf, ACCIDENTAL_WRITTEN_ff, ACCIDENTAL_WRITTEN_ss } from './accid.js';
import { VRV_UNSET } from './vrvdef.js'; // eslint-disable-line
import { Fraction } from './fraction.js';

const Raw = DocType.Raw;
const Visible = VisibilityType.Visible;
const Hidden = 2;
const BOOLEAN_true = 1;
const NOTATIONTYPE_mensural = 2;
const staffGroupingSym_SYMBOL_bracket = 2;
const CLEFSHAPE_C = 4;
const CLEFSHAPE_F = 3;
const CLEFSHAPE_G = 1;
const MENSURATIONSIGN_C = 1;
const MENSURATIONSIGN_O = 2;
const BARRENDITION_single = 15;
const BARRENDITION_dbl = 3;
const BARRENDITION_rptboth = 12;
// atttypes.h: DURATION_longa=100... (durationinterface parity).
const DURATION_brevis = 101;
const DURATION_longa = 100;
const DURATION_semibrevis = 102;
const DURATION_minima = 103;
const DURATION_semiminima = 104;
const DURATION_fusa = 105;
const DURATION_semifusa = 106;
const DURATION_maxima = -1;
const PROLATIO_2 = 2;
const PROLATIO_3 = 3;
const TEMPUS_2 = 2;
const TEMPUS_3 = 3;
const MODUSMINOR_2 = 2;
const MODUSMINOR_3 = 3;
const MODUSMAIOR_2 = 2;
const MODUSMAIOR_3 = 3;
const ORIENTATION_NONE = 0;
const ORIENTATION_reversed = 1;
const ORIENTATION_90CW = 2;
const ORIENTATION_90CCW = 3;
const STEMDIRECTION_NONE = 0;
const STEMDIRECTION_up = 1;
const STEMDIRECTION_down = 2;
const STEMDIRECTION_left = 3;
const STEMDIRECTION_right = 4;
const STEMPOSITION_left = 1;
const STEMPOSITION_right = 2;
const STAFFREL_basic_above = 1;
const STAFFREL_basic_below = 2;
const LIGATUREFORM_recta = 1;
const LIGATUREFORM_obliqua = 2;
const accidLog_FUNC_edit = 2;
const ACCIDENTAL_WRITTEN_sx = 4;
const sylLog_WORDPOS_i = 1;
const sylLog_WORDPOS_m = 2;
const sylLog_WORDPOS_t = 4;
const sylLog_CON_d = 2;

export interface MensInfo {
  prolatio: number;
  tempus: number;
  modusminor: number;
  modusmaior: number;
  proportNum: number;
  proportDen: number;
}

const PITCH_MAP = new Map<string, number>([
  ['C', PITCHNAME_c], ['D', PITCHNAME_d], ['E', PITCHNAME_e], ['F', PITCHNAME_f],
  ['G', PITCHNAME_g], ['A', PITCHNAME_a], ['B', PITCHNAME_b],
]);
const ACCID_SHAPE_MAP = new Map<string, number>([
  ['Bmol', ACCIDENTAL_WRITTEN_f], ['BmolDouble', ACCIDENTAL_WRITTEN_f],
  ['Bqua', ACCIDENTAL_WRITTEN_n], ['Diesis', ACCIDENTAL_WRITTEN_s],
]);
const CLEF_SHAPE_MAP = new Map<string, number>([
  ['C', CLEFSHAPE_C], ['F', CLEFSHAPE_F], ['G', CLEFSHAPE_G],
  ['Frnd', CLEFSHAPE_F], ['Fsqr', CLEFSHAPE_F],
]);
const ACCID_OFFSET_MAP = new Map<number, number>([
  [-3, ACCIDENTAL_WRITTEN_tf], [-2, ACCIDENTAL_WRITTEN_ff], [-1, ACCIDENTAL_WRITTEN_f],
  [0, ACCIDENTAL_WRITTEN_n], [1, ACCIDENTAL_WRITTEN_s], [2, ACCIDENTAL_WRITTEN_ss],
  [3, ACCIDENTAL_WRITTEN_sx],
]);
const STEM_DIR_MAP = new Map<string, number>([
  ['Up', STEMDIRECTION_up], ['Down', STEMDIRECTION_down],
  ['Left', STEMDIRECTION_left], ['Right', STEMDIRECTION_right],
]);
const DURATION_MAP = new Map<string, number>([
  ['Maxima', DURATION_maxima], ['Longa', DURATION_longa], ['Brevis', DURATION_brevis],
  ['Semibrevis', DURATION_semibrevis], ['Minima', DURATION_minima],
  ['Semiminima', DURATION_semiminima], ['Fusa', DURATION_fusa], ['Semifusa', DURATION_semifusa],
]);

function eachChild(node: xml_node): xml_node[] {
  const out: xml_node[] = [];
  for (const child of node.children() as Iterable<xml_node>) {
    if (child.name() !== '') out.push(child);
  }
  return out;
}

function firstChild(node: xml_node | null | undefined, name: string): xml_node | null {
  if (!node || node.empty()) return null;
  for (const child of eachChild(node)) if (child.name() === name) return child;
  return null;
}

function childByPath(node: xml_node | null | undefined, path: string): xml_node | null {
  let cur: xml_node | null = node ?? null;
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue;
    cur = firstChild(cur, part);
    if (!cur) return null;
  }
  return cur;
}

function hasChild(node: xml_node | null | undefined, path: string): boolean {
  const n = childByPath(node, path);
  return !!n && !n.empty();
}

function childrenByPath(node: xml_node | null | undefined, path: string): xml_node[] {
  const parts = path.split('/').filter((p) => p !== '' && p !== '.');
  let cur: xml_node[] = node && !node.empty() ? [node] : [];
  for (const part of parts) {
    const next: xml_node[] = [];
    for (const n of cur) {
      for (const child of eachChild(n)) {
        if (part === '*' || child.name() === part) next.push(child);
      }
    }
    cur = next;
  }
  return cur;
}

function findDescendant(node: xml_node | null | undefined, name: string): xml_node | null {
  if (!node || node.empty()) return null;
  for (const child of eachChild(node)) {
    if (child.name() === name) return child;
    const found = findDescendant(child, name);
    if (found) return found;
  }
  return null;
}

interface CmmeDoc extends DocLike {
  Reset(): void;
  SetType(t: DocType): void;
  SetMensuralMusicOnly(v: number): void;
  GenerateMEIHeader(): void;
  AddChild(x: VrvObject): boolean;
  GetFirstScoreDef(): VrvObject;
  ConvertToPageBasedDoc(): void;
  PrepareData(): void;
  ScoreDefSetCurrentDoc(force?: boolean): void;
  SetDrawingPage(i: number): VrvObject | null;
  ResetToLoading(): void;
  ResetDataPage(): void;
  m_header: xml_document;
}

export class CmmeInput extends Input {
  private m_score: Score | null = null;
  private m_currentSection: Measure | null = null;
  private m_currentContainer: VrvObject | null = null;
  private m_currentSignature: KeySig | null = null;
  private m_currentNote: Note | null = null;
  private m_isInSyllable = false;
  private m_currentColor = '';
  private m_mensInfo: MensInfo | null = null;
  private m_mensInfos: MensInfo[] = [];
  private m_numVoices = 0;
  private m_voices: string[] = [];
  private m_activeTempoChange = false;

  public constructor(doc: CmmeDoc) {
    super(doc);
  }

  public override Import(cmme: string): boolean {
    try {
      const d = this.m_doc as unknown as CmmeDoc;
      d.Reset();
      d.SetType(Raw);
      d.SetMensuralMusicOnly(BOOLEAN_true);
      d.GenerateMEIHeader();
      const projectDesc = findDescendant(d.m_header.first_child(), 'projectDesc');
      if (projectDesc && !(projectDesc as unknown as { empty(): boolean }).empty?.()) {
        const p1 = (projectDesc as unknown as xml_node).append_child('p');
        p1.text().set('Converted from CMME XML');
      }
      const doc = new xml_document();
      doc.load_string(cmme);
      const root = doc.first_child();
      if (!root.empty() && !root.child('GeneralData').empty()) {
        this.CreateMetadata(root.child('GeneralData'));
      }
      const mdiv = new Mdiv();
      mdiv.SetVisibility(Visible);
      d.AddChild(mdiv);
      this.m_score = new Score();
      mdiv.AddChild(this.m_score);
      const voiceNodes = childrenByPath(root, 'VoiceData/Voice');
      for (const vn of voiceNodes) {
        this.m_numVoices++;
        this.m_voices.push(this.ChildAsString(vn, 'Name'));
      }
      this.m_mensInfos = [];
      for (let i = 0; i < this.m_numVoices; i++) {
        this.m_mensInfos.push({ prolatio: 2, tempus: 2, modusminor: 2, modusmaior: 2, proportNum: 1, proportDen: 1 });
      }
      const sections = childrenByPath(root, 'MusicSection/*');
      for (const sn of sections) this.CreateSection(sn);
      const staffGrp = new StaffGrp();
      const grpSym = new GrpSym();
      grpSym.SetSymbol(staffGroupingSym_SYMBOL_bracket);
      staffGrp.AddChild(grpSym);
      for (let i = 0; i < this.m_numVoices; i++) {
        const staffDef = new StaffDef();
        staffDef.SetN(i + 1);
        staffDef.SetLines(5);
        staffDef.SetNotationtype(NOTATIONTYPE_mensural);
        staffGrp.AddChild(staffDef);
        if (this.m_voices[i] !== '') {
          const label = new Label();
          const text = new Text();
          text.SetText(UTF8to32(this.m_voices[i]));
          label.AddChild(text);
          staffDef.AddChild(label);
        }
        const mensur = new Mensur();
        mensur.SetProlatio(PROLATIO_2);
        mensur.SetTempus(TEMPUS_2);
        mensur.SetModusminor(MODUSMINOR_2);
        mensur.SetModusmaior(MODUSMAIOR_2);
        staffDef.AddChild(mensur);
      }
      if (!this.m_score.GetScoreDef()) throw new Error('CmmeInput.Import requires a scoreDef.');
      (this.m_score.GetScoreDef() as unknown as VrvObject).AddChild(staffGrp);
      d.ConvertToPageBasedDoc();
      this.PostProcessProport();
    }
    catch (e) {
      LogWarning('%s', (e as Error)?.message ?? String(e));
      return false;
    }
    return true;
  }

  public PostProcessProport(): void {
    const d = this.m_doc as unknown as CmmeDoc;
    d.PrepareData();
    d.ScoreDefSetCurrentDoc();
    const contentPage = d.SetDrawingPage(0) as unknown as {
      LayOutHorizontally(): void; FindAllDescendantsByType(id: ClassId): VrvObject[];
    } | null;
    if (!contentPage) throw new Error('CmmeInput.PostProcessProport: failed to establish drawing page.');
    contentPage.LayOutHorizontally();
    const proports = contentPage.FindAllDescendantsByType(ClassId.PROPORT) as unknown as Proport[];
    for (const proport of proports) {
      if (proport.GetType() !== 'reset?') continue;
      let propType = 'cmme_tempo_change';
      proport.SetType(propType);
      const alignment = proport.GetAlignment() as unknown as {
        GetChildCount(): number; FindAllDescendantsByType(id: ClassId): Proport[];
      } | null;
      const measure = proport.GetFirstAncestor(ClassId.MEASURE);
      if (!measure || !alignment) continue;
      const nbLayers = (measure as unknown as VrvObject).GetDescendantCount(ClassId.LAYER);
      let isTempoChange = true;
      let allVoices = true;
      if (nbLayers !== alignment.GetChildCount()) { isTempoChange = false; allVoices = false; }
      const alignProports = alignment.FindAllDescendantsByType(ClassId.PROPORT);
      for (const ap of alignProports) {
        if (proport.GetNum() !== (ap as unknown as Proport).GetNum()
          || proport.GetNumbase() !== (ap as unknown as Proport).GetNumbase()) isTempoChange = false;
      }
      if (!isTempoChange) {
        propType = 'reset';
        if (allVoices) LogWarning('A tempo change at all voices with different values detected');
        else LogWarning('A tempo change not occurring at all voices detected');
      }
      for (const ap of alignProports) (ap as unknown as Proport).SetType(propType);
    }
    d.ResetToLoading();
    d.ResetDataPage();
  }

  protected CreateMetadata(metadataNode: xml_node): void {
    const d = this.m_doc as unknown as CmmeDoc;
    const titleStmt = findDescendant(d.m_header.first_child(), 'titleStmt');
    if (!titleStmt || titleStmt.empty()) return;
    const titleStr = this.ChildAsString(metadataNode, 'Title');
    if (titleStr !== '') {
      const title = titleStmt.child('title');
      if (!title.empty()) title.text().set(titleStr);
    }
    const sectionStr = this.ChildAsString(metadataNode, 'Section');
    if (sectionStr !== '') {
      const title = titleStmt.append_child('title');
      title.append_attribute('type').set_value('subordinate');
      title.text().set(sectionStr);
    }
    const composerStr = this.ChildAsString(metadataNode, 'Composer');
    if (composerStr !== '') {
      const composer = titleStmt.append_child('composer');
      composer.text().set(composerStr);
    }
  }

  protected CreateSection(musicSectionNode: xml_node): void {
    if (!this.m_score) throw new Error('CmmeInput.CreateSection requires a score.');
    const sectionType = musicSectionNode.name();
    const section = new Section();
    section.SetType(sectionType);
    this.m_score.AddChild(section);
    this.m_currentSection = new Measure(MeasureType.UNMEASURED, 1);
    section.AddChild(this.m_currentSection);
    for (let i = 0; i < this.m_numVoices; i++) {
      let voice: xml_node | null = null;
      for (const cand of childrenByPath(musicSectionNode, './Voice')) {
        const num = childByPath(cand, './VoiceNum');
        if (num && num.text().as_string() === String(i + 1)) { voice = cand; break; }
      }
      if (voice && !voice.empty()) this.CreateStaff(voice);
      else {
        const staff = new Staff(i + 1);
        staff.SetVisible(0);
        this.m_currentSection.AddChild(staff);
      }
    }
  }

  protected CreateStaff(voiceNode: xml_node): void {
    if (!this.m_currentSection) throw new Error('CmmeInput.CreateStaff requires a section.');
    const numVoice = this.ChildAsInt(voiceNode, 'VoiceNum');
    const staff = new Staff(numVoice);
    const layer = new Layer();
    layer.SetN(1);
    this.m_currentContainer = layer;
    this.m_mensInfo = this.m_mensInfos[numVoice - 1] ?? null;
    this.m_isInSyllable = false;
    this.m_currentSignature = null;
    this.m_activeTempoChange = false;
    staff.AddChild(this.m_currentContainer);
    this.m_currentSection.AddChild(staff);
    this.ReadEvents(voiceNode.child('EventList'));
  }

  protected CreateApp(appNode: xml_node): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.CreateApp requires a container.');
    const app = new App(8);
    this.m_currentContainer.AddChild(app);
    this.m_currentContainer = app;
    const lemOrRdgs = childrenByPath(appNode, './Reading');
    let isFirst = true;
    for (const lr of lemOrRdgs) {
      this.CreateLemOrRdg(lr, isFirst);
      isFirst = false;
    }
    this.m_currentContainer = this.m_currentContainer.GetParent();
  }

  protected CreateLemOrRdg(lemOrRdgNode: xml_node, isFirst: boolean): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.CreateLemOrRdg requires a container.');
    const versionId = this.ChildAsString(lemOrRdgNode, 'VariantVersionID');
    let lemOrRdg: VrvObject;
    if (isFirst && (!lemOrRdgNode.child('PreferredReading').empty() || versionId === 'DEFAULT')) {
      lemOrRdg = new Lem() as unknown as VrvObject;
    }
    else lemOrRdg = new Rdg() as unknown as VrvObject;
    (lemOrRdg as unknown as { SetVisibility(v: number): void }).SetVisibility(isFirst ? Visible : Hidden);
    if ((lemOrRdg as unknown as VrvObject).Is(ClassId.RDG)) {
      let label = '';
      const variants = childrenByPath(lemOrRdgNode, './VariantVersionID');
      let first = true;
      for (const v of variants) {
        if (!first) label += '; ';
        label += this.AsString(v);
        first = false;
      }
      (lemOrRdg as unknown as { SetLabel(s: string): void }).SetLabel(label);
    }
    if (!lemOrRdgNode.child('Error').empty()) (lemOrRdg as unknown as { SetType(s: string): void }).SetType('Error');
    else if (!lemOrRdgNode.child('Lacuna').empty()) (lemOrRdg as unknown as { SetType(s: string): void }).SetType('Lacuna');
    this.m_currentContainer.AddChild(lemOrRdg);
    this.m_currentContainer = lemOrRdg;
    this.ReadEvents(lemOrRdgNode.child('Music'));
    this.m_currentContainer = this.m_currentContainer.GetParent();
  }

  protected ReadEvents(eventsNode: xml_node): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.ReadEvents requires a container.');
    let keySigFound = false;
    const events = childrenByPath(eventsNode, './*');
    for (const ev of events) {
      const eventNode = ev;
      const name = eventNode.name();
      if (name === 'Clef') {
        if (this.IsClef(eventNode)) this.CreateClef(eventNode);
        else if (childByPath(eventNode, './Signature')) {
          keySigFound = true;
          this.CreateKeySig(eventNode);
        }
        else this.CreateAccid(eventNode);
      }
      else if (name === 'ColorChange') this.CreateColorChange(eventNode);
      else if (name === 'Custos') this.CreateCustos(eventNode);
      else if (name === 'Dot') this.CreateDot(eventNode);
      else if (name === 'LineEnd') this.CreateBreak(eventNode);
      else if (name === 'Mensuration') this.CreateMensuration(eventNode);
      else if (name === 'MiscItem') {
        const barSel = childByPath(eventNode, './Barline');
        if (barSel && !barSel.empty()) this.CreateBarline(barSel);
        else if (!eventNode.child('Ellipsis').empty()) this.CreateEllipsis();
        else if (!eventNode.child('Lacuna').empty()) this.CreateLacuna(eventNode.child('Lacuna'));
        else LogWarning('Unsupported MiscItem content');
      }
      else if (name === 'MultiEvent') {
        if (childByPath(eventNode, './Clef/Signature')) {
          this.m_currentSignature = null;
          const clefs = childrenByPath(eventNode, './Clef');
          for (const c of clefs) this.CreateKeySig(c);
        }
        else if (childByPath(eventNode, './Note')) this.CreateChord(eventNode);
        else LogWarning("Unsupported event '%s'", name);
      }
      else if (name === 'Note') this.CreateNote(eventNode);
      else if (name === 'OriginalText') this.CreateOriginalText(eventNode);
      else if (name === 'Proportion') this.CreateProport(eventNode);
      else if (name === 'Rest') this.CreateRest(eventNode);
      else if (name === 'VariantReadings') this.CreateApp(eventNode);
      else LogWarning("Unsupported event '%s'", name);
      if (!keySigFound) this.m_currentSignature = null;
      keySigFound = false;
    }
  }

  protected ReadEditorialCommentary(eventNode: xml_node, object: VrvObject): void {
    const commentary = this.ChildAsString(eventNode, 'EditorialCommentary');
    if (commentary === '' || !this.m_currentSection) return;
    const annot = new Annot();
    const text = new Text();
    text.SetText(UTF8to32(commentary));
    annot.AddChild(text);
    annot.SetPlist(['#' + object.GetID()]);
    this.m_currentSection.AddChild(annot);
  }

  protected CreateAccid(accidNode: xml_node): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.CreateAccid requires a container.');
    const accid = new Accid();
    const appearance = this.ChildAsString(accidNode, 'Appearance');
    accid.SetAccid(ACCID_SHAPE_MAP.get(appearance) ?? ACCIDENTAL_WRITTEN_f);
    const step = this.ChildAsString(accidNode, 'Pitch/LetterName');
    const ploc = PITCH_MAP.get(step) ?? PITCHNAME_c;
    accid.SetPloc(ploc);
    let oct = this.ChildAsInt(accidNode, 'Pitch/OctaveNum');
    if (ploc !== PITCHNAME_a && ploc !== PITCHNAME_b) oct += 1;
    accid.SetOloc(oct);
    const staffLoc = this.ChildAsInt(accidNode, 'StaffLoc');
    accid.SetLoc(staffLoc - 1);
    this.ReadEditorialCommentary(accidNode, accid as unknown as VrvObject);
    this.m_currentContainer.AddChild(accid as unknown as VrvObject);
  }

  protected CreateBarline(barlineNode: xml_node): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.CreateBarline requires a container.');
    const barLine = new BarLine();
    const formNumLines = this.ChildAsInt(barlineNode, 'NumLines');
    if (formNumLines === 1) barLine.SetForm(BARRENDITION_single);
    else if (formNumLines === 2) barLine.SetForm(BARRENDITION_dbl);
    else if (formNumLines !== VRV_UNSET) LogWarning('Unsupported barline (with more than 2 lines)');
    if (childByPath(barlineNode, './RepeatSign')) barLine.SetForm(BARRENDITION_rptboth);
    const bottomLine = this.ChildAsInt(barlineNode, 'BottomStaffLine');
    if (bottomLine !== VRV_UNSET) barLine.SetPlace(bottomLine * 2);
    const numSpaces = this.ChildAsInt(barlineNode, 'NumSpaces');
    if (numSpaces !== VRV_UNSET) barLine.SetLen(numSpaces * 2);
    this.m_currentContainer.AddChild(barLine as unknown as VrvObject);
  }

  protected CreateBreak(breakNode: xml_node): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.CreateBreak requires a container.');
    const gap = new GenericLayerElement(childByPath(breakNode, './PageEnd') ? 'pb' : 'sb');
    this.m_currentContainer.AddChild(gap as unknown as VrvObject);
  }

  protected CreateChord(chordNode: xml_node): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.CreateChord requires a container.');
    const inLigature = this.m_currentContainer.Is(ClassId.LIGATURE);
    if (!inLigature) {
      const chord = new Chord();
      this.m_currentContainer.AddChild(chord as unknown as VrvObject);
      this.m_currentContainer = chord as unknown as VrvObject;
    }
    const events = childrenByPath(chordNode, './*');
    for (const ev of events) {
      const eventNode = ev;
      if (eventNode.name() === 'Note') {
        this.CreateNote(eventNode);
        if (inLigature) break;
      }
      else LogWarning("Unsupported chord component: '%s'", eventNode.name());
    }
    if (!inLigature) this.m_currentContainer = this.m_currentContainer.GetParent();
  }

  protected CreateClef(clefNode: xml_node): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.CreateClef requires a container.');
    const clef = new Clef();
    let staffLoc = this.ChildAsInt(clefNode, 'StaffLoc');
    staffLoc = Math.trunc((staffLoc + 1) / 2);
    clef.SetLine(staffLoc);
    const appearance = this.ChildAsString(clefNode, 'Appearance');
    clef.SetShape(CLEF_SHAPE_MAP.get(appearance) ?? CLEFSHAPE_C);
    this.ReadEditorialCommentary(clefNode, clef as unknown as VrvObject);
    this.m_currentContainer.AddChild(clef as unknown as VrvObject);
  }

  protected CreateColorChange(colorChangeNode: xml_node): void {
    const colorMap = new Map<string, string>([
      ['Black', ''], ['Red', 'red'], ['Blue', 'blue'], ['Green', 'green'], ['Yellow', 'yellow'],
    ]);
    let color = '';
    if (!colorChangeNode.child('PrimaryColor').empty()) {
      color = this.ChildAsString(colorChangeNode.child('PrimaryColor'), 'Color');
    }
    this.m_currentColor = colorMap.get(color) ?? '';
  }

  protected CreateCustos(custosNode: xml_node): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.CreateCustos requires a container.');
    const custos = new Custos();
    const step = this.ChildAsString(custosNode, 'LetterName');
    const pname = PITCH_MAP.get(step) ?? PITCHNAME_c;
    custos.SetPname(pname);
    if (this.m_currentColor !== '') custos.SetColor(this.m_currentColor);
    let oct = this.ChildAsInt(custosNode, 'OctaveNum');
    if (pname !== PITCHNAME_a && pname !== PITCHNAME_b) oct += 1;
    custos.SetOct(oct);
    this.ReadEditorialCommentary(custosNode, custos as unknown as VrvObject);
    this.m_currentContainer.AddChild(custos as unknown as VrvObject);
  }

  protected CreateDot(dotNode: xml_node): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.CreateDot requires a container.');
    const dot = new Dot();
    this.m_currentContainer.AddChild(dot as unknown as VrvObject);
    this.ReadEditorialCommentary(dotNode, dot as unknown as VrvObject);
  }

  protected CreateEllipsis(): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.CreateEllipsis requires a container.');
    const gap = new GenericLayerElement('gap');
    gap.SetType('cmme_ellipsis');
    gap.m_unsupported.push(['reason', 'incipit']);
    this.m_currentContainer.AddChild(gap as unknown as VrvObject);
  }

  protected CreateKeySig(keyNode: xml_node): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.CreateKeySig requires a container.');
    if (!this.m_currentSignature) {
      this.m_currentSignature = new KeySig();
      this.m_currentContainer.AddChild(this.m_currentSignature as unknown as VrvObject);
    }
    const keyAccid = new KeyAccid();
    const appearance = this.ChildAsString(keyNode, 'Appearance');
    keyAccid.SetAccid(ACCID_SHAPE_MAP.get(appearance) ?? ACCIDENTAL_WRITTEN_f);
    const step = this.ChildAsString(keyNode, 'Pitch/LetterName');
    const pname = PITCH_MAP.get(step) ?? PITCHNAME_c;
    keyAccid.SetPname(pname);
    let oct = this.ChildAsInt(keyNode, 'Pitch/OctaveNum');
    if (pname !== PITCHNAME_a && pname !== PITCHNAME_b) oct += 1;
    keyAccid.SetOct(oct);
    const staffLoc = this.ChildAsInt(keyNode, 'StaffLoc');
    keyAccid.SetLoc(staffLoc - 1);
    this.ReadEditorialCommentary(keyNode, keyAccid as unknown as VrvObject);
    this.m_currentSignature.AddChild(keyAccid as unknown as VrvObject);
  }

  protected CreateLacuna(lacunaNode: xml_node): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.CreateLacuna requires a container.');
    const space = new Space();
    const supplied = new Supplied();
    supplied.AddChild(space as unknown as VrvObject);
    const refs = { num: VRV_UNSET, numbase: VRV_UNSET };
    const duration = this.ReadDuration(lacunaNode, refs);
    space.SetDur(duration);
    space.SetType('cmme_lacuna');
    supplied.SetType('cmme_lacuna');
    this.m_currentContainer.AddChild(supplied as unknown as VrvObject);
  }

  protected CreateMensuration(mensurationNode: xml_node): void {
    if (!this.m_currentContainer || !this.m_mensInfo) throw new Error('CmmeInput.CreateMensuration requires state.');
    const mensInfo = mensurationNode.child('MensInfo');
    if (!mensInfo.empty()) {
      this.m_mensInfo.prolatio = this.ChildAsInt(mensInfo, 'Prolatio');
      this.m_mensInfo.tempus = this.ChildAsInt(mensInfo, 'Tempus');
      this.m_mensInfo.modusminor = this.ChildAsInt(mensInfo, 'ModusMinor');
      this.m_mensInfo.modusmaior = this.ChildAsInt(mensInfo, 'ModusMaior');
    }
    else {
      this.m_mensInfo.prolatio = 2;
      this.m_mensInfo.tempus = 2;
      this.m_mensInfo.modusminor = 2;
      this.m_mensInfo.modusmaior = 2;
    }
    const mensur = new Mensur();
    mensur.SetProlatio(this.m_mensInfo.prolatio === 3 ? PROLATIO_3 : PROLATIO_2);
    mensur.SetTempus(this.m_mensInfo.tempus === 3 ? TEMPUS_3 : TEMPUS_2);
    mensur.SetModusminor(this.m_mensInfo.modusminor === 3 ? MODUSMINOR_3 : MODUSMINOR_2);
    mensur.SetModusmaior(this.m_mensInfo.modusmaior === 3 ? MODUSMAIOR_3 : MODUSMAIOR_2);
    const signNode = mensurationNode.child('Sign');
    const signValue = this.ChildAsString(signNode, 'MainSymbol');
    if (signValue === 'O') {
      mensur.SetSign(MENSURATIONSIGN_O);
      if (mensInfo.empty()) { this.m_mensInfo.tempus = 3; mensur.SetTempus(TEMPUS_3); }
    }
    else if (signValue === 'C') mensur.SetSign(MENSURATIONSIGN_C);
    else if (signValue !== '') LogWarning("Unsupported mesuration sign in CMME (not 'O' or 'C')");
    if (!signNode.child('Dot').empty()) {
      mensur.SetDot(BOOLEAN_true);
      if (mensInfo.empty()) { this.m_mensInfo.prolatio = 3; mensur.SetProlatio(PROLATIO_3); }
    }
    const strokes = this.ChildAsInt(signNode, 'Strokes');
    if (strokes !== VRV_UNSET) mensur.SetSlash(strokes);
    const orientationMap = new Map<string, number>([
      ['Reversed', ORIENTATION_reversed], ['90CW', ORIENTATION_90CW], ['90CCW', ORIENTATION_90CCW],
    ]);
    const orientation = this.ChildAsString(signNode, 'Orientation');
    mensur.SetOrient(orientationMap.get(orientation) ?? ORIENTATION_NONE);
    if (!mensurationNode.child('Small').empty()) mensur.m_unsupported.push(['fontsize', 'small']);
    if (!mensurationNode.child('NoScoreEffect').empty()) mensur.SetType('cmme_no_score_effect');
    const numberNode = mensurationNode.child('Number');
    if (!numberNode.empty()) {
      const numValue = this.ChildAsInt(numberNode, 'Num');
      const denValue = this.ChildAsInt(numberNode, 'Den');
      if (numValue !== VRV_UNSET && numValue !== 0) mensur.SetNum(numValue);
      if (denValue !== VRV_UNSET && denValue !== 0) mensur.SetNumbase(denValue);
    }
    const staffLoc = this.ChildAsInt(mensurationNode, 'StaffLoc');
    if (staffLoc !== VRV_UNSET) mensur.SetLoc(staffLoc);
    this.ReadEditorialCommentary(mensurationNode, mensur as unknown as VrvObject);
    this.m_currentContainer.AddChild(mensur as unknown as VrvObject);
    const tempoChangeNode = mensInfo.empty() ? null : mensInfo.child('TempoChange');
    if (tempoChangeNode && !tempoChangeNode.empty()) {
      const proport = new Proport();
      const numVal = this.ChildAsInt(tempoChangeNode, 'Num');
      const denVal = this.ChildAsInt(tempoChangeNode, 'Den');
      if (numVal !== VRV_UNSET) proport.SetNum(numVal);
      if (denVal !== VRV_UNSET) proport.SetNumbase(denVal);
      proport.SetType('reset?');
      this.m_currentContainer.AddChild(proport as unknown as VrvObject);
      this.m_activeTempoChange = true;
    }
    else if (this.m_activeTempoChange) {
      const proport = new Proport();
      proport.SetNum(1);
      proport.SetNumbase(1);
      proport.SetType('cmme_tempo_change?');
      this.m_currentContainer.AddChild(proport as unknown as VrvObject);
      this.m_activeTempoChange = false;
    }
  }

  protected CreateNote(noteNode: xml_node): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.CreateNote requires a container.');
    const note = new Note();
    const step = this.ChildAsString(noteNode, 'LetterName');
    const pname = PITCH_MAP.get(step) ?? PITCHNAME_c;
    note.SetPname(pname);
    if (this.m_currentColor !== '') note.SetColor(this.m_currentColor);
    const refs = { num: VRV_UNSET, numbase: VRV_UNSET };
    const duration = this.ReadDuration(noteNode, refs);
    note.SetDur(duration);
    if (refs.num !== VRV_UNSET && refs.numbase !== VRV_UNSET) { note.SetNum(refs.num); note.SetNumbase(refs.numbase); }
    let oct = this.ChildAsInt(noteNode, 'OctaveNum');
    if (pname !== PITCHNAME_a && pname !== PITCHNAME_b) oct += 1;
    note.SetOct(oct);
    if (!noteNode.child('Colored').empty()) note.SetColored(BOOLEAN_true);
    if (!noteNode.child('ModernText').empty()) {
      this.m_currentNote = note;
      this.CreateVerse(noteNode.child('ModernText'));
      this.m_currentNote = null;
    }
    if (!noteNode.child('Corona').empty()) {
      let position = STAFFREL_basic_above;
      { const o = childByPath(noteNode, 'Corona/Orientation'); if (o && o.text().as_string() === 'Down') position = STAFFREL_basic_below; }
      note.SetFermata(position);
    }
    if (!noteNode.child('ModernAccidental').empty()) {
      const accid = new Accid();
      let offset = this.ChildAsInt(noteNode.child('ModernAccidental'), 'PitchOffset');
      offset = Math.min(3, offset);
      offset = Math.max(-3, offset);
      accid.SetAccid(ACCID_OFFSET_MAP.get(offset) ?? ACCIDENTAL_WRITTEN_n);
      accid.SetFunc(accidLog_FUNC_edit);
      note.AddChild(accid as unknown as VrvObject);
    }
    if (!noteNode.child('Signum').empty()) {
      LogWarning('Signum Congruentiae in CMME mapped to @type');
      note.SetType('cmme_signum_congruentiae');
    }
    if (!noteNode.child('Stem').empty()) {
      const dir = this.ChildAsString(noteNode.child('Stem'), 'Dir');
      if (dir === 'Barline') LogWarning("Unsupported 'Barline' stem direction");
      note.SetStemDir(STEM_DIR_MAP.get(dir) ?? STEMDIRECTION_NONE);
      const side = this.ChildAsString(noteNode.child('Stem'), 'Side');
      if (side === 'Left') note.SetStemPos(STEMPOSITION_left);
      else if (side === 'Right') note.SetStemPos(STEMPOSITION_right);
    }
    if (!noteNode.child('Lig').empty()) {
      const lig = this.ChildAsString(noteNode, 'Lig');
      if (lig === 'Retrorsum') LogWarning("Unsupported 'Retrorsum' ligature");
      const form = lig === 'Obliqua' ? LIGATUREFORM_obliqua : LIGATUREFORM_recta;
      if (!this.m_currentContainer.Is(ClassId.LIGATURE)) {
        if (this.m_currentContainer.Is(ClassId.CHORD)) LogWarning('Ligature within chord is not supported');
        else {
          const ligature = new Ligature();
          ligature.SetForm(form);
          this.m_currentContainer.AddChild(ligature as unknown as VrvObject);
          this.m_currentContainer = ligature as unknown as VrvObject;
        }
      }
      else note.SetLig(form);
    }
    this.ReadEditorialCommentary(noteNode, note as unknown as VrvObject);
    this.m_currentContainer.AddChild(note as unknown as VrvObject);
    if (this.m_currentContainer.Is(ClassId.LIGATURE) && noteNode.child('Lig').empty()) {
      this.m_currentContainer = this.m_currentContainer.GetParent();
    }
  }

  protected CreateOriginalText(_originalTextNode: xml_node): void { /* C++ no-op */ }

  protected CreateProport(proportNode: xml_node): void {
    if (!this.m_currentContainer || !this.m_mensInfo) throw new Error('CmmeInput.CreateProport requires state.');
    const proport = new Proport();
    const numVal = this.ChildAsInt(proportNode, 'Num');
    const denVal = this.ChildAsInt(proportNode, 'Den');
    if (numVal !== VRV_UNSET) { proport.SetNum(numVal); this.m_mensInfo.proportNum *= numVal; }
    if (denVal !== VRV_UNSET) { proport.SetNumbase(denVal); this.m_mensInfo.proportDen *= denVal; }
    const [rn, rd] = Fraction.ReducePair(this.m_mensInfo.proportNum, this.m_mensInfo.proportDen);
    this.m_mensInfo.proportNum = rn;
    this.m_mensInfo.proportDen = rd;
    proport.SetType('cmme_proportion');
    this.m_currentContainer.AddChild(proport as unknown as VrvObject);
  }

  protected CreateRest(restNode: xml_node): void {
    if (!this.m_currentContainer) throw new Error('CmmeInput.CreateRest requires a container.');
    const rest = new Rest();
    const refs = { num: VRV_UNSET, numbase: VRV_UNSET };
    const duration = this.ReadDuration(restNode, refs);
    rest.SetDur(duration);
    if (this.m_currentColor !== '') rest.SetColor(this.m_currentColor);
    if (refs.num !== VRV_UNSET && refs.numbase !== VRV_UNSET) { rest.SetNum(refs.num); rest.SetNumbase(refs.numbase); }
    this.ReadEditorialCommentary(restNode, rest as unknown as VrvObject);
    if (!restNode.child('Signum').empty()) {
      LogWarning('Signum Congruentiae in CMME mapped to @type');
      rest.SetType('cmme_signum_congruentiae');
    }
    this.m_currentContainer.AddChild(rest as unknown as VrvObject);
  }

  protected CreateVerse(verseNode: xml_node): void {
    if (!this.m_currentNote) throw new Error('CmmeInput.CreateVerse requires a note.');
    const verse = new Verse();
    verse.SetN(1);
    const syl = new Syl();
    const text = new Text();
    text.SetText(UTF8to32(this.ChildAsString(verseNode, 'Syllable')));
    if (!verseNode.child('WordEnd').empty()) {
      syl.SetWordpos(sylLog_WORDPOS_t);
      this.m_isInSyllable = false;
    }
    else {
      if (this.m_isInSyllable) syl.SetWordpos(sylLog_WORDPOS_m);
      else syl.SetWordpos(sylLog_WORDPOS_i);
      this.m_isInSyllable = true;
      syl.SetCon(sylLog_CON_d);
    }
    syl.AddChild(text as unknown as VrvObject);
    verse.AddChild(syl as unknown as VrvObject);
    this.m_currentNote.AddChild(verse as unknown as VrvObject);
  }

  protected ReadDuration(durationNode: xml_node, refs: { num: number; numbase: number }): number {
    if (!this.m_mensInfo) throw new Error('CmmeInput.ReadDuration requires mensural info');
    const type = this.ChildAsString(durationNode, 'Type');
    const duration = DURATION_MAP.get(type) ?? DURATION_brevis;
    refs.num = VRV_UNSET;
    refs.numbase = VRV_UNSET;
    if (!durationNode.child('Length').empty()) {
      const cmmeNum = this.ChildAsInt(durationNode.child('Length'), 'Num');
      const cmmeDen = this.ChildAsInt(durationNode.child('Length'), 'Den');
      if (cmmeNum === VRV_UNSET || cmmeDen === VRV_UNSET) return duration;
      let ratioNum = 1;
      let ratioDen = 1;
      if (type === 'Maxima') ratioNum *= this.m_mensInfo.modusmaior * this.m_mensInfo.modusminor * this.m_mensInfo.tempus * this.m_mensInfo.prolatio;
      else if (type === 'Longa') ratioNum *= this.m_mensInfo.modusminor * this.m_mensInfo.tempus * this.m_mensInfo.prolatio;
      else if (type === 'Brevis') ratioNum *= this.m_mensInfo.tempus * this.m_mensInfo.prolatio;
      else if (type === 'Semibrevis') ratioNum *= this.m_mensInfo.prolatio;
      else if (type === 'Semiminima') ratioDen = 2;
      else if (type === 'Fusa') ratioDen = 4;
      else if (type === 'Semifusa') ratioDen = 8;
      let num = cmmeDen * ratioNum;
      let den = cmmeNum * ratioDen;
      const [rn, rd] = Fraction.ReducePair(num, den);
      num = rn;
      den = rd;
      refs.num = num;
      refs.numbase = den;
      if (num === den) { refs.num = VRV_UNSET; refs.numbase = VRV_UNSET; }
    }
    return duration;
  }

  protected IsClef(clefNode: xml_node): boolean {
    const clefs = new Set(['C', 'F', 'Fsqr', 'Frnd', 'G']);
    if (childByPath(clefNode, './Signature')) return false;
    return clefs.has(this.ChildAsString(clefNode, 'Appearance'));
  }

  protected AsString(node: xml_node | null | undefined): string {
    if (!node || node.empty()) return '';
    return node.text().as_string();
  }

  protected ChildAsString(node: xml_node | null | undefined, child: string): string {
    if (!node || node.empty()) return '';
    const n = childByPath(node, child);
    return n ? this.AsString(n) : '';
  }

  protected AsInt(node: xml_node | null | undefined): number {
    if (!node || node.empty()) return VRV_UNSET;
    return node.text().as_int();
  }

  protected ChildAsInt(node: xml_node | null | undefined, child: string): number {
    if (!node || node.empty()) return VRV_UNSET;
    const n = childByPath(node, child);
    return n ? this.AsInt(n) : VRV_UNSET;
  }
}
