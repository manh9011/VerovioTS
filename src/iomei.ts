/**
 * iomei.ts — MEI output + MEI input.
 *
 * Translated from src-cpp/src/iomei.cpp + include/vrv/iomei.h.
 * Part 1: Export/Skip/dispatch/filter core that backs
 * Toolkit::GetMEI/SaveFile. Part 2: MEIInput::Import, ReadDoc, Score/
 * ScoreDef/StaffDef frame, 14 Read*Interface + element frame readers.
 * Part 3: all remaining MEIInput Read* leaf readers (190 C++ methods:
 * measure/staff/layer content, control + text + editorial elements,
 * page-based containers, facsimile, upgrades). The ~140 type-specific
 * Write* bodies are funneled through one generic AttModule.GetAll writer:
 * each TS domain class only Has its own att classes, so the union equals
 * the sum of the C++ per-type Write* calls (behavior identical, structure
 * adapted because TS classes expose no per-type Write facades). Read side
 * uses the same seam: readAttrs() routes each attribute through the 22
 * AttModule.Set* groups gated by HasAttClass, matching the C++ per-type
 * vrvX->ReadAttGroup(node) facade calls one-for-one. Attribute-only
 * branches (clef/keySig/meterSig/mensur/accid/artic/tie/fermata/grpSym/
 * keyAccid/stem) and page/score-based + serializing + MEI-basic conditions
 * are preserved exactly.
 *
 * C++ ownership: m_objectStack/m_boundaries/m_nodeStack are non-owning
 * views; TS models them as plain arrays of references (GC owns memory).
 * uint32 counters use >>> 0 only where C++ wraps; IDs stay strings.
 */

import { Output, Input, type DocLike } from './iobase.js';
import {
  ClassId, DEFINITION_FACTOR, VRV_UNSET, MensuralCastOffType,
  LayoutInformation, MARKUP_ANALYTICAL_FERMATA, MARKUP_SCOREDEF_DEFINITIONS,
  EditorialLevel, VisibilityType, MeasureType,
  MARKUP_ANALYTICAL_TIE, MARKUP_ARTIC_MULTIVAL,
} from './vrvdef.js';
import { Doc, DocType } from './doc.js';
import { VrvObject } from './object.js';
import { AttModule, type ArrayOfStrAttr, type AttModuleElementLike } from './attmodule.js';
import { AttConverterBase } from './attconverter.js';
import { Transposer, TransPitch, INVALID_INTERVAL_CLASS } from './transposition.js';
import { FindAllReferencedObjectsFunctor } from './findfunctor.js';
import type { AttributeData, NodeData } from './pugixml.js';
import { AttNIntegerComparison } from './comparison.js';
import { SaveFunctor } from './savefunctor.js';
import {
  xml_document,
  xml_node,
  xml_attribute,
  xml_node_type,
  format_default,
  format_no_escapes,
  format_raw,
  parse_comments,
  parse_default,
  parse_eol,
} from './pugixml.js';
import { LogDebug, LogError, LogWarning, StringFormat, UTF32to8, UTF8to32, ExtractIDFragment, IsNeumeType } from './vrv.js';
import { JsonxxObject, JsonxxArray } from './jsonxx.js';
import { SaveFunctor as CanonicalSaveFunctor } from './savefunctor.js';

import { Mdiv } from './mdiv.js';
import { Score } from './score.js';
import { Section } from './section.js';
import { Pages } from './pages.js';
import { ScoreDef, ScoreDefElement } from './scoredef.js';
import { StaffGrp } from './staffgrp.js';
import { StaffDef } from './staffdef.js';
import { EditorialElement } from './editorial.js';
import { PAEInput } from './iopae.js';
import { Clef } from './clef.js';
import { KeySig } from './keysig.js';
import { MeterSig } from './metersig.js';
import { Mensur } from './mensur.js';
import { Accid } from './accid.js';
import { Ending } from './ending.js';
import { Expansion } from './expansion.js';
import { Pb } from './pb.js';
import { Sb } from './sb.js';

import { Measure } from './measure.js';
import { Staff } from './staff.js';
import { Layer } from './layer.js';
import { Note } from './note.js';
import { Rest } from './rest.js';
import { Chord } from './chord.js';
import { Beam } from './beam.js';
import { Tuplet } from './tuplet.js';
import { MRest } from './mrest.js';
import { MSpace } from './mspace.js';
import { MultiRest } from './multirest.js';
import { BarLine } from './barline.js';
import { Artic } from './artic.js';
import { Dot } from './dot.js';
import { BTrem } from './btrem.js';
import { FTrem } from './ftrem.js';
import { GraceGrp } from './gracegrp.js';
import { Custos } from './custos.js';
import { DivLine } from './divline.js';
import { Space } from './space.js';
import { Ligature } from './ligature.js';
import { Proport } from './proport.js';
import { Syl } from './syl.js';
import { Verse } from './verse.js';
import { Slur } from './slur.js';
import { Tie } from './tie.js';
import { Hairpin } from './hairpin.js';
import { Dynam } from './dynam.js';
import { Dir } from './dir.js';
import { Tempo } from './tempo.js';
import { Fermata } from './fermata.js';
import { Pedal } from './pedal.js';
import { Octave } from './octave.js';
import { Trill } from './trill.js';
import { Turn } from './turn.js';
import { Mordent } from './mordent.js';
import { Ornam } from './ornam.js';
import { Arpeg } from './arpeg.js';
import { Gliss } from './gliss.js';
import { RepeatMark } from './repeatmark.js';
import { CpMark } from './cpmark.js';
import { Breath } from './breath.js';
import { Caesura } from './caesura.js';
import { Harm } from './harm.js';
import { MNum } from './mnum.js';
import { Fing } from './fing.js';
import { BeamSpan } from './beamspan.js';
import { BracketSpan } from './bracketspan.js';
import { Rend } from './rend.js';
import { Text } from './text.js';
import { Lb } from './lb.js';
import { Fig } from './fig.js';
import { Svg } from './svg.js';
import { Symbol } from './symbol.js';
import { Num } from './num.js';
import { Fb } from './fb.js';
import { F } from './f.js';
import { Episema } from './episema.js';
import { Nc } from './nc.js';
import { Neume } from './neume.js';
import { Syllable } from './syllable.js';
import { TabDurSym } from './tabdursym.js';
import { TabGrp } from './tabgrp.js';
import { Volta } from './volta.js';
import { Ossia } from './ossia.js';
import { AnchoredText } from './anchoredtext.js';
import { PitchInflection } from './pitchinflection.js';
import { Reh } from './reh.js';
import { Refrain } from './refrain.js';
import { BeatRpt } from './beatrpt.js';
import { HalfmRpt } from './halfmrpt.js';
import { MRpt } from './mrpt.js';
import { MRpt2 } from './mrpt2.js';
import { MultiRpt } from './multirpt.js';
import { KeyAccid } from './keyaccid.js';
import { Lv } from './lv.js';
import { Phrase } from './phrase.js';
import { Stem } from './stem.js';
import { Div } from './div.js';
import { PgHead } from './pghead.js';
import { PgFoot } from './pgfoot.js';
import { AnnotScore } from './annotscore.js';
import { GenericLayerElement } from './genericlayerelement.js';
import { Liquescent } from './liquescent.js';
import { Oriscus } from './oriscus.js';
import { Plica } from './plica.js';
import { Quilisma } from './quilisma.js';
import { Strophicus } from './strophicus.js';
import { LyricElement } from './lyricelement.js';
import { LayerElement } from './layerelement.js';
import { GrpSym } from './grpsym.js';
import { InstrDef } from './instrdef.js';
import { Label } from './label.js';
import { LabelAbbr } from './labelabbr.js';
import { LayerDef } from './layerdef.js';
import { Tuning } from './tuning.js';
import { Course } from './course.js';
import { SymbolTable } from './symboltable.js';
import { SymbolDef } from './symboldef.js';
import { MeterSigGrp } from './metersiggrp.js';
import { Page } from './page.js';
import { System } from './system.js';
import { PageMilestoneEnd, PageMilestoneInterface } from './pagemilestone.js';
import { SystemMilestoneEnd, SystemMilestoneInterface } from './systemmilestone.js';
import { Facsimile } from './facsimile.js';
import { Surface } from './surface.js';
import { Zone } from './zone.js';
import { Graphic } from './graphic.js';
import { Abbr } from './abbr.js';
import { Add } from './add.js';
import { Annot } from './annot.js';
import { App } from './app.js';
import { Choice } from './choice.js';
import { Corr } from './corr.js';
import { Damage } from './damage.js';
import { Del } from './del.js';
import { Expan } from './expan.js';
import { Lem } from './lem.js';
import { Orig } from './orig.js';
import { Rdg } from './rdg.js';
import { Ref } from './ref.js';
import { Reg } from './reg.js';
import { Restore } from './restore.js';
import { Sic } from './sic.js';
import { Subst } from './subst.js';
import { Supplied } from './supplied.js';
import { Unclear } from './unclear.js';
import { ApplyPPUFactorFunctor } from './miscfunctor.js';
import type { DurationInterface } from './durationinterface.js';

import {
  InstCleffingLog,
  InstKeySigDefaultLog,
  InstKeySigLog,
  InstMeterSigDefaultLog,
  InstAccidental,
  InstArticulation,
  InstStaffGroupingSym,
} from './atts_shared.js';
import {
  InstCleffingVis,
  InstKeySigDefaultVis,
  InstMensuralVis,
  InstMeterSigDefaultVis,
} from './atts_visual.js';
import { InstKeySigDefaultAnl } from './atts_analytical.js';
import { InstMensuralLog, InstMensuralShared } from './atts_mensural.js';
import { InstAccidentalGes } from './atts_gestural.js';

function saveThrough(output: Output, root: VrvObject): void {
  const save = new CanonicalSaveFunctor(output);
  save.SetVisibleOnly(false);
  root.Process(save);
}

export const MEI_ALL_SCHEMA = 'https://music-encoding.org/schema/dev/mei-all.rng';
export const MEI_BASIC_SCHEMA = 'https://music-encoding.org/schema/dev/mei-basic.rng';
export const MEI_PAGE_BASED_SCHEMA = 'https://www.verovio.org/schema/dev/mei-verovio.rng';
export const MEI_CURRENT_VERSION = 15;
export const MEI_CURRENT_BASIC_VERSION = 16;
export const VEROVIO_SERIALIZATION = 'verovio.serialization';
export const NEUME_LINE_TYPE = 'neon-neume-line';

import { MEIBASIC_MAP } from './meibasic.js';

const BOOLEAN_false = 2;
const MEI_UNSET = -0x7fffffff;

export class MEIBasic {
  public static IsAllowed(element: string, attr: string): boolean {
    if (attr === 'xml:id') return true;
    const allowed = MEIBASIC_MAP[element];
    if (!allowed) return false;
    return (allowed as readonly string[]).includes(attr);
  }
}

export enum MatchLocation { Before = 0, Here, After }
export enum RangeMatchLocation { BeforeStart = 0, AtStart, BetweenStartEnd, AtEnd, AfterEnd }

type AnyObj = VrvObject & Record<string, any>;
type AnyDoc = {
  m_header: xml_document;
  m_front: xml_document;
  m_back: xml_document;
  m_musicDecls: string;
} & Record<string, any>;

function asDoc(doc: DocLike): AnyDoc { return doc as unknown as AnyDoc; }
function asObj(object: unknown): AnyObj { return object as AnyObj; }
function objIs(object: unknown, id: ClassId): boolean { return asObj(object).Is(id); }
function objIsAnyOf(object: unknown, ids: ClassId[]): boolean { return asObj(object).IsAnyOf(ids); }

// C++ MEIOutput::WriteTempo order: ControlElement, TextDir, TimeSpanning,
// Extender, Lang, MidiTempo, MmTempo.
function orderTempoAttrs(attrs: ArrayOfStrAttr): ArrayOfStrAttr {
  const rank = (name: string): number => {
    if (name === 'place') return 1;
    if (name === 'tstamp' || name === 'tstamp2' || name === 'startid' || name === 'endid') return 2;
    if (name === 'extend') return 3;
    if (name === 'lang') return 4;
    if (name === 'midi.tempo') return 5;
    if (name === 'mm' || name === 'mm.unit' || name === 'mm.dots') return 6;
    return 0;
  };
  return attrs
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => rank(a.entry[0]) - rank(b.entry[0]) || a.index - b.index)
    .map(({ entry }) => entry);
}

// C++ MEIOutput::WriteStaffDef order: scoreDef element/interface attrs,
// distances, labelled, n, notationtype, scalable, log (lines), vis,
// tablature, timebase (ppq), transposition. Generic GetAll sorts ppq with
// spacing/scale before lines; rank timebase after log/vis instead.
function orderStaffDefAttrs(attrs: ArrayOfStrAttr): ArrayOfStrAttr {
  const rank = (name: string): number => {
    if (name === 'xml:id') return 0;
    if (name === 'n') return 6;
    if (name === 'notationtype') return 7;
    if (name === 'lines') return 9;
    if (name === 'ppq') return 12;
    if (name === 'spacing' || name === 'scale' || name === 'scale.x') return 8;
    if (name.startsWith('trans.')) return 13;
    return name === 'label' || name === 'label.abbr' ? 5 : 0;
  };
  return attrs
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => rank(a.entry[0]) - rank(b.entry[0]) || a.index - b.index)
    .map(({ entry }) => entry);
}

// C++ MEIOutput::WriteNc order: layer, duration, offset, pitch, position,
// color, curve, interval, ncform. Generic GetAll puts tilt before pitch.
function orderNcAttrs(attrs: ArrayOfStrAttr): ArrayOfStrAttr {
  const rank = (name: string): number => {
    if (name === 'oct' || name === 'pname') return 4;
    if (name === 'tilt') return 5;
    return 0;
  };
  return attrs
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => rank(a.entry[0]) - rank(b.entry[0]) || a.index - b.index)
    .map(({ entry }) => entry);
}

// C++ MEIOutput::WriteNote order: LayerElement (xml:id, type), duration
// (WriteDurationInterface: dots, breaksec, ges, log, quality, ratio,
// fermata, staff), pitch (oct, pname), position, color, ... stems last.
function orderNoteAttrs(attrs: ArrayOfStrAttr): ArrayOfStrAttr {
  const rank = (name: string): number => {
    if (name === 'xml:id') return 0;
    if (name === 'type') return 1;
    if (name === 'dots') return 2;
    if (name === 'breaksec') return 3;
    if (name.startsWith('dur.')) return 4;
    if (name === 'dur') return 5;
    if (name === 'oct' || name === 'pname') return 6;
    if (name === 'cue') return 9;
    if (name.startsWith('stem.') || name === 'stem') return 20;
    if (name === 'visible') return 21;
    return 7;
  };
  return attrs
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => rank(a.entry[0]) - rank(b.entry[0]) || a.index - b.index)
    .map(({ entry }) => entry);
}

// C++ WriteBracketSpan: ControlElement, TimeSpanning (endid then startid
// per libmei WriteStartEndId/WriteTimePoint order), BracketSpanLog (func).
// Generic GetAll emits them alphabetically, which already matches.
function orderBracketSpanAttrs(attrs: ArrayOfStrAttr): ArrayOfStrAttr {
  const rank = (name: string): number => {
    if (name === 'type') return 1;
    if (name === 'staff') return 2;
    if (name === 'startid') return 3;
    if (name === 'endid') return 4;
    if (name === 'func') return 5;
    return 0;
  };
  return attrs
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => rank(a.entry[0]) - rank(b.entry[0]) || a.index - b.index)
    .map(({ entry }) => entry);
}

export class MEIOutput extends Output {
  protected m_currentNode!: xml_node;
  protected m_nodeStack: xml_node[] = [];
  protected m_mei!: xml_node;

  private m_indent = 5;
  private m_scoreBasedMEI = false;
  private m_basic = false;
  private m_serializing = false;
  private m_ignoreHeader = false;
  private m_removeIds = false;

  private m_boundaries: VrvObject[] = [];
  private m_objectStack: VrvObject[] = [];

  private m_hasFilter = false;
  private m_filterMatchLocation: MatchLocation = MatchLocation.Before;
  private m_firstFilterMatch: VrvObject | null = null;
  private m_firstPage = 1;
  private m_currentPage = 0;
  private m_lastPage = 0;
  private m_firstMeasureID = '';
  private m_lastMeasureID = '';
  private m_measureFilterMatchLocation: RangeMatchLocation = RangeMatchLocation.BeforeStart;
  private m_mdivID = '';
  private m_mdivFilterMatchLocation: MatchLocation = MatchLocation.Before;

  private m_referredObjects: Set<VrvObject> = new Set();

  constructor(doc: DocLike) {
    super(doc);
    this.Reset();
    this.ResetFilter();
  }

  protected get doc(): AnyDoc { return asDoc(this.m_doc); }

  public override Skip(object: unknown): boolean {
    const o = asObj(object);
    if (objIs(object, ClassId.MDIV)) {
      const iface = o.GetVisibilityDrawingInterface?.() as { IsHidden(): boolean } | null;
      if (!iface) return false;
      if (!iface.IsHidden() || this.IsSerializing()) return false;
      if (this.IsPageBasedMEI() || this.HasFilter()) return true;
    }
    else if (objIs(object, ClassId.MNUM)) {
      if (this.IsSerializing()) return false;
      const gen = (o as unknown as { IsGenerated(): boolean }).IsGenerated?.();
      if (gen) return true;
    }
    else if (o.IsRunningElement()) {
      if (this.IsSerializing()) return false;
      const gen = (o as unknown as { IsGenerated(): boolean }).IsGenerated?.();
      if (gen) return true;
    }
    else if (o.IsEditorialElement()) {
      if (this.m_basic) return true;
      const iface = o.GetVisibilityDrawingInterface?.() as { IsHidden(): boolean } | null;
      if (!iface) return false;
      if (!iface.IsHidden() || this.IsSerializing()) return false;
    }
    return false;
  }

  public override Export(): string {
    const doc = this.doc;
    if (this.m_removeIds) {
      const find = new FindAllReferencedObjectsFunctor(this.m_referredObjects, null);
      find.IncludeMilestoneReferences(this.IsPageBasedMEI());
      (doc as unknown as VrvObject).Process(find);
    }
    try {
      const meiDoc = new xml_document();
      if (this.HasFilter()) {
        if (this.IsPageBasedMEI()) {
          LogError('MEI output with filter is not possible in page-based MEI');
          return '';
        }
        if (doc.IsMensuralMusicOnly?.() === true) {
          LogError('MEI output with filter is not possible for mensural music');
          return '';
        }
        if (!this.HasValidFilter()) {
          LogError('Invalid filter, please check the input');
          return '';
        }
      }
      if (this.IsPageBasedMEI() && this.GetBasic()) {
        LogError('MEI output in page-based MEI is not possible with MEI Basic');
        return '';
      }
      if (this.IsSerializing() && this.IsScoreBasedMEI()) {
        LogError('Serialization is not possible in page-based MEI');
        return '';
      }

      let decl = meiDoc.prepend_child(xml_node_type.node_declaration);
      decl.append_attribute('version').set_value('1.0');
      decl.append_attribute('encoding').set_value('UTF-8');

      if (this.IsSerializing()) {
        this.m_currentNode = meiDoc.append_child('verovio-serialization');
        this.m_nodeStack.push(this.m_currentNode);
        const pages = doc.GetPages?.() as unknown as VrvObject | null;
        if (pages) {
          const save = new SaveFunctor(this as unknown as Output);
          save.SetVisibleOnly(false);
          pages.Process(save);
        }
        return meiDoc.save_string('\t', format_default);
      }

      const schema = this.IsPageBasedMEI()
        ? MEI_PAGE_BASED_SCHEMA
        : this.GetBasic() ? MEI_BASIC_SCHEMA : MEI_ALL_SCHEMA;
      decl = meiDoc.append_child(xml_node_type.node_declaration);
      decl.set_name('xml-model');
      decl.append_attribute('href').set_value(schema);
      decl.append_attribute('type').set_value('application/xml');
      decl.append_attribute('schematypens').set_value('http://relaxng.org/ns/structure/1.0');
      if (this.IsScoreBasedMEI()) {
        decl = meiDoc.append_child(xml_node_type.node_declaration);
        decl.set_name('xml-model');
        decl.append_attribute('href').set_value(schema);
        decl.append_attribute('type').set_value('application/xml');
        decl.append_attribute('schematypens').set_value('http://purl.oclc.org/dsdl/schematron');
      }

      this.m_mei = meiDoc.append_child('mei');
      this.m_mei.append_attribute('xmlns').set_value('http://www.music-encoding.org/ns/mei');
      const converter = new AttConverterBase();
      const version = this.GetBasic() ? MEI_CURRENT_BASIC_VERSION : MEI_CURRENT_VERSION;
      this.m_mei.append_attribute('meiversion').set_value(converter.MeiVersionMeiversionToStr(version));

      doc.ConvertToCastOffMensuralDoc?.(MensuralCastOffType.MENSURAL_CAST_OFF_UNSET);

      saveThrough(this, doc as unknown as VrvObject);

      doc.ConvertToCastOffMensuralDoc?.(MensuralCastOffType.MENSURAL_CAST_OFF_RESET);

      let outputFlags = format_default;
      if (doc.GetOptions?.().m_outputSmuflXmlEntities?.getValue?.()) outputFlags |= format_no_escapes;
      if (doc.GetOptions?.().m_outputFormatRaw?.getValue?.()) outputFlags |= format_raw;
      if (this.GetBasic()) this.PruneAttributes(this.m_mei.child('music'));

      const indent = this.m_indent === -1 ? '\t' : ' '.repeat(Math.max(0, this.m_indent));
      return meiDoc.save_string(indent, outputFlags);
    }
    catch (e) {
      LogError('%s', (e as Error)?.message ?? String(e));
      return '';
    }
  }

  public override WriteObject(object: unknown): boolean {
    if (this.IsScoreBasedMEI() && this.HasFilter()) {
      if (!this.ProcessScoreBasedFilter(asObj(object))) return true;
    }
    return this.WriteObjectInternal(asObj(object), false);
  }

  protected WriteObjectInternal(object: AnyObj, useCustomScoreDef: boolean): boolean {
    if ((object as unknown as { HasComment?: () => boolean }).HasComment?.()) {
      const c = (object as unknown as { GetComment?: () => string }).GetComment?.() ?? '';
      this.m_currentNode.append_child(xml_node_type.node_comment).set_value(c);
    }
    if (objIs(object, ClassId.DOC)) {
      this.WriteDoc(object);
      this.m_nodeStack.push(this.m_currentNode);
      return true;
    }
    const tag = this.resolveTag(object);
    if (tag === null) return true;
    if (tag !== '') {
      this.m_currentNode = this.m_currentNode.append_child(tag);
      this.writeSpecial(object, tag);
    }
    else {
      this.writeSpecial(object, '');
    }

    if (this.IsTreeObject(object)) this.m_nodeStack.push(this.m_currentNode);

    if (objIs(object, ClassId.SCORE)) {
      const score = object as unknown as {
        GetScoreDef(): unknown;
        GetScoreDefSubtree(): VrvObject | null;
      };
      if (useCustomScoreDef) {
        this.WriteCustomScoreDef(score.GetScoreDef());
      }
      else {
        { const subtree = score.GetScoreDefSubtree(); if (subtree) saveThrough(this, subtree); }
      }
    }

    this.WriteUnsupportedAttr(this.m_currentNode, object);
    return true;
  }

  /** C++ WriteObjectInternal branch order preserved; null = skip subtree. */
  private resolveTag(object: AnyObj): string | null {
    if (objIs(object, ClassId.MDIV)) {
      return this.IsPageBasedMEI() && object.IsMilestoneElement() ? 'mdivb' : 'mdiv';
    }
    if (objIs(object, ClassId.PAGES)) return this.IsPageBasedMEI() ? 'pages' : null;
    if (objIs(object, ClassId.SCORE)) return 'score';
    if (objIs(object, ClassId.PAGE)) return this.IsPageBasedMEI() ? 'page' : null;
    if (objIs(object, ClassId.SYSTEM)) return this.IsPageBasedMEI() ? 'system' : null;
    if (objIs(object, ClassId.ENDING)) return 'ending';
    if (objIs(object, ClassId.EXPANSION)) return 'expansion';
    if (objIs(object, ClassId.PB)) return this.IsScoreBasedMEI() || this.IsSerializing() ? 'pb' : null;
    if (objIs(object, ClassId.SB)) return this.IsScoreBasedMEI() || this.IsSerializing() ? 'sb' : null;
    if (objIs(object, ClassId.SECTION)) {
      return this.IsPageBasedMEI() && object.IsMilestoneElement() ? 'secb' : 'section';
    }
    if (objIs(object, ClassId.MEASURE)) {
      const m = object as unknown as { IsNeumeLine(): boolean; SetType(v: string): void };
      if (m.IsNeumeLine?.()) {
        m.SetType(NEUME_LINE_TYPE);
        return 'section';
      }
      return 'measure';
    }
    if (objIs(object, ClassId.STAFF)) {
      const st = object as unknown as { IsOssia(): boolean };
      return st.IsOssia?.() ? 'oStaff' : 'staff';
    }
    if (objIs(object, ClassId.DIR)) {
      const dir = object as unknown as { IsStageDir(): boolean };
      return dir.IsStageDir?.() ? 'stageDir' : 'dir';
    }
    if (objIs(object, ClassId.FERMATA) || objIs(object, ClassId.TIE)) {
      if (!this.IsTreeObject(object)) return '';
      return objIs(object, ClassId.FERMATA) ? 'fermata' : 'tie';
    }
    for (const id of [ClassId.ACCID, ClassId.ARTIC, ClassId.CLEF, ClassId.KEYSIG, ClassId.MENSUR, ClassId.METERSIG]) {
      if (objIs(object, id)) return this.IsTreeObject(object) ? this.tagFor(id) : '';
    }
    if (objIs(object, ClassId.GRPSYM)) return this.IsTreeObject(object) ? 'grpSym' : '';
    if (objIs(object, ClassId.KEYACCID)) return this.IsTreeObject(object) ? 'keyAccid' : null;
    if (objIs(object, ClassId.STEM)) {
      return (object as unknown as { IsAttribute(): boolean }).IsAttribute() ? null : 'stem';
    }
    if (objIs(object, ClassId.TEXT)) return '';
    if (object.IsEditorialElement()) {
      if (this.GetBasic()) return null;
      if (objIs(object, ClassId.EXPAN)) return 'epxan';
      return object.GetClassName();
    }
    if (objIs(object, ClassId.SYSTEM_MILESTONE_END) || objIs(object, ClassId.PAGE_MILESTONE_END)) {
      return this.IsPageBasedMEI() ? 'milestoneEnd' : null;
    }
    const names: Partial<Record<number, string>> = {
      [ClassId.GRPSYM]: 'grpSym',
      [ClassId.INSTRDEF]: 'instrDef',
      [ClassId.LABEL]: 'label',
      [ClassId.LABELABBR]: 'labelAbbr',
      [ClassId.LAYERDEF]: 'layerDef',
      [ClassId.SCOREDEF]: 'scoreDef',
      [ClassId.DIV]: 'div',
      [ClassId.PGFOOT]: 'pgFoot',
      [ClassId.PGHEAD]: 'pgHead',
      [ClassId.STAFFGRP]: 'staffGrp',
      [ClassId.STAFFDEF]: 'staffDef',
      [ClassId.TUNING]: 'tuning',
      [ClassId.COURSE]: 'course',
      [ClassId.SYMBOLTABLE]: 'symbolTable',
      [ClassId.OSSIA]: 'ossia',
      [ClassId.LAYER]: 'layer',
      [ClassId.METERSIGGRP]: 'meterSigGrp',
      [ClassId.FB]: 'fb',
      [ClassId.ANCHOREDTEXT]: 'anchoredText',
      [ClassId.ANNOTSCORE]: 'annot',
      [ClassId.ARPEG]: 'arpeg',
      [ClassId.BEAMSPAN]: 'beamSpan',
      [ClassId.BRACKETSPAN]: 'bracketSpan',
      [ClassId.BREATH]: 'breath',
      [ClassId.CAESURA]: 'caesura',
      [ClassId.CPMARK]: 'cpMark',
      [ClassId.DYNAM]: 'dynam',
      [ClassId.FING]: 'fing',
      [ClassId.GLISS]: 'gliss',
      [ClassId.HAIRPIN]: 'hairpin',
      [ClassId.HARM]: 'harm',
      [ClassId.LV]: 'lv',
      [ClassId.MNUM]: 'mNum',
      [ClassId.MORDENT]: 'mordent',
      [ClassId.OCTAVE]: 'octave',
      [ClassId.ORNAM]: 'ornam',
      [ClassId.PEDAL]: 'pedal',
      [ClassId.PHRASE]: 'phrase',
      [ClassId.PITCHINFLECTION]: 'pitchInfection',
      [ClassId.REH]: 'reh',
      [ClassId.REPEATMARK]: 'repeatMark',
      [ClassId.SLUR]: 'slur',
      [ClassId.TEMPO]: 'tempo',
      [ClassId.TRILL]: 'trill',
      [ClassId.TURN]: 'turn',
      [ClassId.BARLINE]: 'barLine',
      [ClassId.BEAM]: 'beam',
      [ClassId.BEATRPT]: 'beatRpt',
      [ClassId.BTREM]: 'bTrem',
      [ClassId.CHORD]: 'chord',
      [ClassId.CUSTOS]: 'custos',
      [ClassId.DIVLINE]: 'divLine',
      [ClassId.DOT]: 'dot',
      [ClassId.FTREM]: 'fTrem',
      [ClassId.GENERIC_ELEMENT]: 'generic',
      [ClassId.GRACEGRP]: 'graceGrp',
      [ClassId.HALFMRPT]: 'halfmRpt',
      [ClassId.LIGATURE]: 'ligature',
      [ClassId.LIQUESCENT]: 'liquescent',
      [ClassId.MREST]: 'mRest',
      [ClassId.MRPT]: 'mRpt',
      [ClassId.MRPT2]: 'mRpt2',
      [ClassId.MSPACE]: 'mSpace',
      [ClassId.MULTIREST]: 'multiRest',
      [ClassId.MULTIRPT]: 'multiRpt',
      [ClassId.EPISEMA]: 'episema',
      [ClassId.NC]: 'nc',
      [ClassId.NEUME]: 'neume',
      [ClassId.NOTE]: 'note',
      [ClassId.ORISCUS]: 'oriscus',
      [ClassId.PLICA]: 'plica',
      [ClassId.PROPORT]: 'proport',
      [ClassId.QUILISMA]: 'quilisma',
      [ClassId.STROPHICUS]: 'strophicus',
      [ClassId.REST]: 'rest',
      [ClassId.SPACE]: 'space',
      [ClassId.SYL]: 'syl',
      [ClassId.SYLLABLE]: 'syllable',
      [ClassId.TABDURSYM]: 'tabDurSym',
      [ClassId.TABGRP]: 'tabGrp',
      [ClassId.TUPLET]: 'tuplet',
      [ClassId.VOLTA]: 'volta',
      [ClassId.REFRAIN]: 'refrain',
      [ClassId.VERSE]: 'verse',
      [ClassId.FIG]: 'fig',
      [ClassId.FIGURE]: 'f',
      [ClassId.LB]: 'lb',
      [ClassId.NUM]: 'num',
      [ClassId.REND]: 'rend',
      [ClassId.SVG]: 'svg',
      [ClassId.SYMBOL]: 'symbol',
      [ClassId.SYMBOLDEF]: 'symbolDef',
      [ClassId.GRAPHIC]: 'graphic',
    };
    const id = object.GetClassId() as number;
    if (names[id] !== undefined) return names[id] as string;
    LogError("Output method missing for '%s'", object.GetClassName());
    return null;
  }

  private tagFor(id: ClassId): string {
    switch (id) {
      case ClassId.ACCID: return 'accid';
      case ClassId.ARTIC: return 'artic';
      case ClassId.CLEF: return 'clef';
      case ClassId.KEYSIG: return 'keySig';
      case ClassId.MENSUR: return 'mensur';
      default: return 'meterSig';
    }
  }

  /** Per-type bodies: special geometry/structural cases, else generic attrs. */
  private writeSpecial(object: AnyObj, tag: string): void {
    const node = this.m_currentNode;
    if (tag === '') {
      // C++ attr-only writers (WriteClef/WriteKeySig/WriteMeterSig/WriteMensur
      // when !IsTreeObject) write only the value attributes into the parent
      // node, never xml:id. Dispatch per class like C++ instead of generic attrs.
      if (objIs(object, ClassId.TEXT)) this.WriteText(node, object);
      else if (objIs(object, ClassId.CLEF)) this.writeClefAttrOnly(node, object);
      else if (objIs(object, ClassId.KEYSIG)) this.writeKeySigAttrOnly(node, object);
      else if (objIs(object, ClassId.METERSIG)) this.writeMeterSigAttrOnly(node, object);
      else if (objIs(object, ClassId.MENSUR)) this.writeMensurAttrOnly(node, object);
      else this.writeAttrs(node, object, true);
      return;
    }
    if (tag === 'generic') {
      const g = object as unknown as { GetMEIName(): string; GetContent(): string };
      try {
        const name = g.GetMEIName?.();
        if (name) node.set_name(name);
        const content = new xml_document();
        content.load_string(g.GetContent?.() ?? '');
        const root = content.first_child();
        if (!root.empty()) {
          for (const child of root.children() as Iterable<xml_node>) node.append_copy(child);
        }
      }
      catch { /* keep node; mirrors C++ reparse tolerance */ }
      this.writeLayerElement(node, object);
      return;
    }
    if (tag === 'svg') { this.WriteSvg(node, object); return; }
    if (tag === 'annot' && object.IsEditorialElement()) {
      this.writeEditorialElement(node, object);
      const content = (object as unknown as { m_content?: xml_document }).m_content;
      if (content) {
        const root = content.first_child();
        if (!root.empty()) {
          for (const child of root.children() as Iterable<xml_node>) node.append_copy(child);
        }
      }
      this.writeAttrs(node, object, true);
      return;
    }
    switch (tag) {
      case 'mdiv': this.WriteMdiv(node, object); return;
      case 'pages': this.WritePages(node, object); return;
      case 'score': this.WriteScore(node, object); return;
      case 'page': this.WritePage(node, object); return;
      case 'system': this.WriteSystem(node, object); return;
      case 'expansion': this.WriteExpansion(node, object); return;
      case 'measure': case 'section': this.WriteMeasureLike(node, object); return;
      case 'staff': this.WriteStaff(node, object); return;
      case 'oStaff': this.WriteOStaff(node, object); return;
      case 'layer': this.WriteLayer(node, object); return;
      case 'facsimile': case 'surface': case 'zone': case 'graphic':
        this.writeFacsimileFamily(node, object, tag);
        return;
      case 'milestoneEnd': this.writeMilestoneEnd(node, object); return;
      case 'mdivb': case 'secb': this.WriteXmlId(node, object); this.writeAttrs(node, object, true); return;
      default: break;
    }
    // Attribute-only objects keep the parent node (no child pushed).
    if (!this.IsTreeObject(object)) {
      if (tag === 'clef') this.writeClefAttrOnly(node, object);
      else if (tag === 'keySig') this.writeKeySigAttrOnly(node, object);
      else if (tag === 'meterSig') this.writeMeterSigAttrOnly(node, object);
      else if (tag === 'mensur') this.writeMensurAttrOnly(node, object);
      else this.writeAttrs(node, object, true);
      return;
    }
    if (objIs(object, ClassId.MEASURE) || (object as unknown as { IsLayerElement?: () => boolean }).IsLayerElement?.()) {
      this.writeLayerElement(node, object);
    }
    else if ((object as unknown as { IsControlElement?: () => boolean }).IsControlElement?.()) {
      this.writeControlElement(node, object);
    }
    else if (object.IsEditorialElement()) {
      this.writeEditorialElement(node, object);
    }
    else {
      // C++ writes xml:id for the generic ScoreDef-family elements
      // (WriteScoreDefElement/WriteRunningElement/WriteTextLayoutElement...).
      this.WriteXmlId(node, object);
    }
    this.writeAttrs(node, object, true);
  }

  private writeAttrs(node: xml_node, object: AnyObj, skipXmlId = false): void {
    const attrs: ArrayOfStrAttr = [];
    AttModule.GetAll(object as unknown as Parameters<typeof AttModule.GetAll>[0], attrs);
    // ponytail: generic GetAll order puts mm before tstamp, but C++
    // MEIOutput::WriteTempo writes TimeSpanning before MmTempo. Reorder
    // tempo attrs to C++ order; lift to per-class writers if more diverge.
    let ordered = attrs;
    if (objIs(object, ClassId.TEMPO)) ordered = orderTempoAttrs(attrs);
    else if (objIs(object, ClassId.STAFFDEF)) ordered = orderStaffDefAttrs(attrs);
    else if (objIs(object, ClassId.NC)) ordered = orderNcAttrs(attrs);
    else if (objIs(object, ClassId.NOTE)) ordered = orderNoteAttrs(attrs);
    else if (objIs(object, ClassId.BRACKETSPAN)) ordered = orderBracketSpanAttrs(attrs);
    for (const [name, value] of ordered) {
      if (skipXmlId && name === 'xml:id') continue;
      if (name === 'xml:id') {
        if (node.attribute('xml:id').empty()) node.append_attribute('xml:id').set_value(value);
      }
      else if (node.attribute(name).empty()) {
        node.append_attribute(name).set_value(value);
      }
    }
    if (!skipXmlId) this.WriteXmlId(node, object);
  }

  private writeLayerElement(node: xml_node, object: AnyObj): void {
    this.WriteXmlId(node, object);
    this.writeAttrs(node, object, true);
    const el = object as unknown as { m_drawingFacsX?: number; SetCoordX1?: (v: number) => void };
    if (el.m_drawingFacsX !== undefined && el.m_drawingFacsX !== VRV_UNSET && !this.doc.IsNeumeLines?.()) {
      el.SetCoordX1?.(el.m_drawingFacsX / DEFINITION_FACTOR);
      this.writeAttrs(node, object, true);
    }
  }

  private writeControlElement(node: xml_node, object: AnyObj): void {
    this.WriteXmlId(node, object);
    this.writeAttrs(node, object, true);
  }

  private writeEditorialElement(node: xml_node, object: AnyObj): void {
    if ((object as unknown as { IsHidden(): boolean }).IsHidden?.()
      && this.IsSerializing()
      && (object.GetParent?.()?.Is(ClassId.SYSTEM) ?? false)) {
      this.m_currentNode.append_attribute(VEROVIO_SERIALIZATION).set_value('hidden');
    }
    this.WriteXmlId(node, object);
    this.writeAttrs(node, object, true);
  }

  private writeClefAttrOnly(node: xml_node, object: AnyObj): void {
    // C++ WriteClef attr-only: temp InstCleffingLog/Vis -> clef.shape/line/dis.
    const clef = object as unknown as {
      GetShape(): number; GetLine(): number; GetDis(): number; GetDisPlace(): number;
      GetColor(): string; GetVisible(): number;
    };
    const log = new InstCleffingLog();
    log.SetClefShape(clef.GetShape());
    log.SetClefLine(clef.GetLine());
    log.SetClefDis(clef.GetDis());
    log.SetClefDisPlace(clef.GetDisPlace());
    log.WriteCleffingLog(node);
    const vis = new InstCleffingVis();
    vis.SetClefColor(clef.GetColor());
    vis.SetClefVisible(clef.GetVisible());
    vis.WriteCleffingVis(node);
  }

  private writeKeySigAttrOnly(node: xml_node, object: AnyObj): void {
    // C++ WriteKeySig attr-only: temp InstKeySigDefaultAnl/Log/Vis.
    const ks = object as unknown as {
      GetMode(): number; GetPname(): number;
      HasSig(): boolean; GetSig(): { first: number; second: number };
      ConvertToSig(): { first: number; second: number };
      GetVisible(): number; GetCancelaccid(): number;
    };
    const anl = new InstKeySigDefaultAnl();
    anl.SetKeyMode(ks.GetMode());
    anl.SetKeyPname(ks.GetPname());
    anl.WriteKeySigDefaultAnl(node);
    const sigLog = new InstKeySigDefaultLog();
    try {
      sigLog.SetKeysig(ks.HasSig?.() ? ks.GetSig() : ks.ConvertToSig?.());
    }
    catch { /* leave unset like C++ when no sig available */ }
    sigLog.WriteKeySigDefaultLog(node);
    const vis = new InstKeySigDefaultVis();
    vis.SetKeysigVisible(ks.GetVisible());
    vis.SetKeysigCancelaccid(ks.GetCancelaccid());
    vis.WriteKeySigDefaultVis(node);
  }

  private writeMeterSigAttrOnly(node: xml_node, object: AnyObj): void {
    // C++ WriteMeterSig attr-only: temp InstMeterSigDefaultLog/Vis.
    const ms = object as unknown as {
      GetCount(): unknown; GetSym(): number; GetUnit(): number;
      GetForm(): number; GetVisible(): number;
    };
    const sigLog = new InstMeterSigDefaultLog();
    sigLog.SetMeterCount(ms.GetCount() as never);
    sigLog.SetMeterSym(ms.GetSym());
    sigLog.SetMeterUnit(ms.GetUnit());
    sigLog.WriteMeterSigDefaultLog(node);
    const vis = new InstMeterSigDefaultVis();
    vis.SetMeterForm(ms.GetForm());
    vis.SetMeterVisible(ms.GetVisible());
    vis.WriteMeterSigDefaultVis(node);
  }

  private writeMensurAttrOnly(node: xml_node, object: AnyObj): void {
    // C++ WriteMensur attr-only: temp InstMensuralLog/Shared/Vis.
    const m = object as unknown as {
      GetNum(): number; GetNumbase(): number;
      GetModusmaior(): number; GetModusminor(): number; GetProlatio(): number; GetTempus(): number;
      GetDot(): number; GetColor(): string; GetOrient(): number; GetSign(): number; GetSlash(): number;
    };
    const mensuralLog = new InstMensuralLog();
    mensuralLog.SetProportNum(m.GetNum());
    mensuralLog.SetProportNumbase(m.GetNumbase());
    mensuralLog.WriteMensuralLog(node);
    const shared = new InstMensuralShared();
    shared.SetModusmaior(m.GetModusmaior());
    shared.SetModusminor(m.GetModusminor());
    shared.SetProlatio(m.GetProlatio());
    shared.SetTempus(m.GetTempus());
    shared.WriteMensuralShared(node);
    const vis = new InstMensuralVis();
    vis.SetMensurDot(m.GetDot());
    vis.SetMensurColor(m.GetColor());
    vis.SetMensurOrient(m.GetOrient());
    vis.SetMensurSign(m.GetSign());
    vis.SetMensurSlash(m.GetSlash());
    vis.WriteMensuralVis(node);
  }

  private writeFacsimileFamily(node: xml_node, object: AnyObj, tag: string): void {
    this.WriteXmlId(node, object);
    this.writeAttrs(node, object, true);
    const children = object.GetChildren?.() ?? [];
    for (const child of children) {
      const cid = (child as VrvObject).GetClassId() as number;
      if (tag === 'facsimile' && cid === (ClassId.SURFACE as number)) {
        const n = node.append_child('surface');
        this.writeFacsimileFamily(n, child as unknown as AnyObj, 'surface');
      }
      else if (tag === 'surface' && (cid === (ClassId.GRAPHIC as number) || cid === (ClassId.ZONE as number))) {
        const n = node.append_child(cid === (ClassId.GRAPHIC as number) ? 'graphic' : 'zone');
        this.writeFacsimileFamily(n, child as unknown as AnyObj, cid === (ClassId.GRAPHIC as number) ? 'graphic' : 'zone');
      }
      else if (tag === 'facsimile' || tag === 'surface') {
        LogWarning("Unable to write child '%s' of %s", (child as VrvObject).GetClassName(), tag);
      }
    }
  }

  private writeMilestoneEnd(node: xml_node, object: AnyObj): void {
    this.writeAttrs(node, object, true);
    const start = (object as unknown as { GetStart(): VrvObject | null }).GetStart?.();
    if (start) {
      node.append_attribute('startid').set_value(`#${start.GetID()}`);
      node.append_attribute('type').set_value(start.GetClassName());
    }
  }

  public override WriteObjectEnd(object: unknown): boolean {
    const o = asObj(object);
    if (this.IsScoreBasedMEI()) {
      if (objIsAnyOf(object, [ClassId.PAGE, ClassId.PAGES, ClassId.SYSTEM])) return true;
      if (o.IsMilestoneElement()) {
        const end = o.GetMilestoneEnd() as VrvObject | null;
        if (end) this.m_boundaries.push(end);
        return true;
      }
      if (objIsAnyOf(object, [ClassId.PAGE_MILESTONE_END, ClassId.SYSTEM_MILESTONE_END])) {
        const top = this.m_boundaries[this.m_boundaries.length - 1];
        if (top !== object) throw new Error('MEIOutput::WriteObjectEnd: milestone boundary mismatch');
        this.m_boundaries.pop();
        if (this.GetBasic() && objIs(object, ClassId.SYSTEM_MILESTONE_END)) {
          const start = (o as unknown as { GetStart(): VrvObject | null }).GetStart?.();
          if (start?.IsEditorialElement()) return true;
        }
      }
      if (o.IsEditorialElement() && this.GetBasic()) return true;
    }
    else if (objIsAnyOf(object, [ClassId.PB, ClassId.SB]) && !this.IsSerializing()) {
      return true;
    }
    if (this.IsScoreBasedMEI() && this.HasFilter()) {
      if (!this.ProcessScoreBasedFilterEnd(o)) return true;
    }
    return this.WriteObjectInternalEnd(o);
  }

  protected WriteObjectInternalEnd(object: AnyObj): boolean {
    if (!this.IsTreeObject(object)) return true;
    if ((object as unknown as { HasClosingComment?: () => boolean }).HasClosingComment?.()) {
      const c = (object as unknown as { GetClosingComment?: () => string }).GetClosingComment?.() ?? '';
      this.m_currentNode.append_child(xml_node_type.node_comment).set_value(c);
    }
    if (objIs(object, ClassId.DOC)) return true;
    const top = this.m_nodeStack[this.m_nodeStack.length - 1];
    if (!top) throw new Error('MEIOutput::WriteObjectInternalEnd: empty node stack');
    this.m_nodeStack.pop();
    this.m_currentNode = this.m_nodeStack[this.m_nodeStack.length - 1];
    return true;
  }

  public HasFilter(): boolean { return this.m_hasFilter; }
  public SetFirstPage(page: number): void { this.m_firstPage = page; this.m_hasFilter = true; }
  public SetLastPage(page: number): void { this.m_lastPage = page; this.m_hasFilter = true; }
  public SetFirstMeasure(id: string): void { this.m_firstMeasureID = id; this.m_hasFilter = true; }
  public SetLastMeasure(id: string): void { this.m_lastMeasureID = id; this.m_hasFilter = true; }
  public SetMdiv(id: string): void { this.m_mdivID = id; this.m_hasFilter = true; }
  public ResetFilter(): void {
    this.m_hasFilter = false;
    this.m_firstPage = 1;
    this.m_lastPage = this.doc.GetPageCount?.() ?? 0;
    this.m_firstMeasureID = '';
    this.m_lastMeasureID = '';
    this.m_mdivID = '';
  }

  protected Reset(): void {
    this.m_filterMatchLocation = MatchLocation.Before;
    this.m_firstFilterMatch = null;
    this.m_currentPage = 0;
    this.m_measureFilterMatchLocation = RangeMatchLocation.BeforeStart;
    this.m_mdivFilterMatchLocation = MatchLocation.Before;
  }

  public SetScoreBasedMEI(v: boolean): void { this.m_scoreBasedMEI = v; }
  public SetBasic(v: boolean): void { this.m_basic = v; }
  public GetBasic(): boolean { return this.m_basic; }
  public SetIndent(v: number): void { this.m_indent = v; }
  public SetIgnoreHeader(v: boolean): void { this.m_ignoreHeader = v; }
  public SetRemoveIds(v: boolean): void { this.m_removeIds = v; }
  public SetSerializing(v: boolean): void { this.m_serializing = v; }
  public IsScoreBasedMEI(): boolean { return this.m_scoreBasedMEI; }
  public IsPageBasedMEI(): boolean { return !this.m_scoreBasedMEI; }
  public IsSerializing(): boolean { return this.m_serializing; }

  public IsTreeObject(object: unknown): boolean {
    const o = asObj(object);
    if (this.IsPageBasedMEI()) return !o.IsAttribute();
    if (objIsAnyOf(object, [ClassId.PAGES, ClassId.PAGE, ClassId.SYSTEM])) return false;
    if (this.GetBasic()) {
      if (objIsAnyOf(object, [ClassId.ACCID, ClassId.ARTIC, ClassId.FERMATA, ClassId.TIE])) return true;
      if (objIsAnyOf(object, [ClassId.GRPSYM, ClassId.KEYACCID])) return false;
      if (objIsAnyOf(object, [ClassId.CLEF, ClassId.KEYSIG, ClassId.METERSIG])
        && o.GetFirstAncestor(ClassId.SCOREDEF)) return false;
    }
    return !o.IsAttribute();
  }

  public HasValidFilter(): boolean {
    const doc = this.doc as unknown as {
      GetPageCount(): number;
      FindDescendantByID(id: string): VrvObject | null;
    };
    if (this.m_firstPage < 1 || this.m_lastPage > doc.GetPageCount() || this.m_firstPage > this.m_lastPage) return false;
    let firstMeasure: VrvObject | null = null;
    if (this.m_firstMeasureID !== '') {
      firstMeasure = doc.FindDescendantByID(this.m_firstMeasureID);
      if (!firstMeasure || !(firstMeasure as VrvObject).Is(ClassId.MEASURE)) return false;
    }
    let lastMeasure: VrvObject | null = null;
    if (this.m_lastMeasureID !== '') {
      lastMeasure = doc.FindDescendantByID(this.m_lastMeasureID);
      if (!lastMeasure || !(lastMeasure as VrvObject).Is(ClassId.MEASURE)) return false;
    }
    if (firstMeasure && lastMeasure && firstMeasure !== lastMeasure) {
      if (!VrvObject.IsPreOrdered(firstMeasure, lastMeasure)) return false;
    }
    if (this.m_mdivID !== '') {
      const mdiv = doc.FindDescendantByID(this.m_mdivID);
      if (!mdiv || !(mdiv as VrvObject).Is(ClassId.MDIV)) return false;
    }
    return true;
  }

  public IsMatchingFilter(): boolean {
    if (!this.HasFilter()) return true;
    if (this.m_currentPage < this.m_firstPage || this.m_currentPage > this.m_lastPage) return false;
    if (this.m_measureFilterMatchLocation === RangeMatchLocation.BeforeStart
      || this.m_measureFilterMatchLocation === RangeMatchLocation.AfterEnd) return false;
    if (this.m_mdivFilterMatchLocation !== MatchLocation.Here) return false;
    return true;
  }

  protected UpdateFilter(object: AnyObj): void {
    this.UpdatePageFilter(object);
    this.UpdateMeasureFilter(object);
    this.UpdateMdivFilter(object);
  }

  protected UpdatePageFilter(object: AnyObj): void {
    if (objIs(object, ClassId.PAGE)) ++this.m_currentPage;
  }

  protected UpdateMeasureFilter(object: AnyObj): void {
    if (this.m_firstMeasureID === '' && this.m_measureFilterMatchLocation === RangeMatchLocation.BeforeStart) {
      this.m_measureFilterMatchLocation = RangeMatchLocation.BetweenStartEnd;
    }
    if (objIs(object, ClassId.MEASURE)) {
      const id = (object as VrvObject).GetID();
      switch (this.m_measureFilterMatchLocation) {
        case RangeMatchLocation.BeforeStart:
          if (this.m_firstMeasureID !== '' && id === this.m_firstMeasureID) {
            this.m_measureFilterMatchLocation = RangeMatchLocation.AtStart;
          }
          break;
        case RangeMatchLocation.AtStart:
          if (this.m_lastMeasureID === '') this.m_measureFilterMatchLocation = RangeMatchLocation.BetweenStartEnd;
          else if (id === this.m_lastMeasureID) this.m_measureFilterMatchLocation = RangeMatchLocation.AtEnd;
          else if (this.m_firstMeasureID === this.m_lastMeasureID) this.m_measureFilterMatchLocation = RangeMatchLocation.AfterEnd;
          else this.m_measureFilterMatchLocation = RangeMatchLocation.BetweenStartEnd;
          break;
        case RangeMatchLocation.BetweenStartEnd:
          if (this.m_lastMeasureID !== '' && id === this.m_lastMeasureID) {
            this.m_measureFilterMatchLocation = RangeMatchLocation.AtEnd;
          }
          break;
        case RangeMatchLocation.AtEnd:
          this.m_measureFilterMatchLocation = RangeMatchLocation.AfterEnd;
          break;
        default: break;
      }
    }
  }

  protected UpdateMdivFilter(object: AnyObj): void {
    if (this.m_mdivID === '' && this.m_mdivFilterMatchLocation === MatchLocation.Before) {
      this.m_mdivFilterMatchLocation = MatchLocation.Here;
    }
    if (objIs(object, ClassId.MDIV)) {
      const id = (object as VrvObject).GetID();
      switch (this.m_mdivFilterMatchLocation) {
        case MatchLocation.Before:
          if (this.m_mdivID !== '' && id === this.m_mdivID) this.m_mdivFilterMatchLocation = MatchLocation.Here;
          break;
        case MatchLocation.Here:
          if (this.m_mdivID !== '') {
            const inside = this.m_objectStack.some((o) => (o as VrvObject).GetID() === this.m_mdivID);
            if (!inside) this.m_mdivFilterMatchLocation = MatchLocation.After;
          }
          break;
        default: break;
      }
    }
  }

  protected ProcessScoreBasedFilter(object: AnyObj): boolean {
    this.UpdateFilter(object);
    if (this.IsMatchingFilter()) {
      if (this.m_filterMatchLocation === MatchLocation.Before) {
        this.m_filterMatchLocation = MatchLocation.Here;
        this.m_firstFilterMatch = object;
        this.WriteStackedObjects();
      }
    }
    else if (this.m_filterMatchLocation === MatchLocation.Here) {
      this.m_filterMatchLocation = MatchLocation.After;
      this.WriteStackedObjectsEnd();
    }
    if (this.IsTreeObject(object)
      && !objIsAnyOf(object, [ClassId.SYSTEM_MILESTONE_END, ClassId.PAGE_MILESTONE_END])) {
      this.m_objectStack.push(object);
    }
    return this.m_filterMatchLocation === MatchLocation.Here;
  }

  protected ProcessScoreBasedFilterEnd(object: AnyObj): boolean {
    if (this.IsTreeObject(object) && this.m_objectStack.length > 0) this.m_objectStack.pop();
    return this.m_filterMatchLocation === MatchLocation.Here;
  }

  public PruneAttributes(node: xml_node): void {
    // C++ checks node.text() (first pcdata/cdata child); element nodes with
    // only attributes fall through. `.text().empty()` is the TS equivalent.
    if (!node.text().empty()) return;
    if (MEIBASIC_MAP[node.name()] === undefined) {
      LogWarning("Element '%s' is not supported but will be preserved", node.name());
      return;
    }
    const doomed: string[] = [];
    for (const attr of node.attributes() as Iterable<{ name(): string }>) {
      const n = (attr as { name(): string }).name();
      if (!MEIBasic.IsAllowed(node.name(), n)) doomed.push(n);
    }
    for (const n of doomed) node.remove_attribute(n);
    for (const child of node.children() as Iterable<xml_node>) this.PruneAttributes(child);
  }

  protected WriteStackedObjects(): void {
    for (const object of this.m_objectStack) this.WriteObjectInternal(object as unknown as AnyObj, true);
  }

  protected WriteStackedObjectsEnd(): void {
    for (let i = this.m_objectStack.length - 1; i >= 0; --i) {
      this.WriteObjectInternalEnd(this.m_objectStack[i] as unknown as AnyObj);
    }
  }

  protected WriteCustomScoreDef(scoreDef: unknown): void {
    let measure: (VrvObject & Record<string, any>) | null = null;
    if (this.m_firstFilterMatch) {
      const f = this.m_firstFilterMatch as VrvObject & Record<string, any>;
      const found: unknown = f.Is(ClassId.MEASURE) ? f : f.FindDescendantByType(ClassId.MEASURE);
      measure = found as ((VrvObject & Record<string, any>) | null);
    }
    let refScoreDef: (VrvObject & {
      Clone(): VrvObject;
      FindAllDescendantsByType(id: ClassId): VrvObject[];
    }) | null = null;
    if (measure) {
      refScoreDef = (measure.GetDrawingScoreDef?.() ?? null) as typeof refScoreDef;
      if (!refScoreDef) {
        const system = (measure as VrvObject).GetFirstAncestor(ClassId.SYSTEM) as unknown as {
          GetDrawingScoreDef(): typeof refScoreDef;
        } | null;
        if (system) refScoreDef = system.GetDrawingScoreDef?.() ?? null;
      }
    }
    if (measure && refScoreDef) {
      const custom = refScoreDef.Clone() as unknown as VrvObject & {
        FindAllDescendantsByType(id: ClassId): VrvObject[];
      };
      for (const sd of custom.FindAllDescendantsByType(ClassId.STAFFDEF)) {
        this.AdjustStaffDef(sd, measure as unknown as VrvObject);
      }
      let drawLabels = false;
      const system = (measure as VrvObject).GetFirstAncestor(ClassId.SYSTEM) as unknown as {
        GetDrawingScoreDef(): { DrawLabels(): boolean } | null;
      } | null;
      if (system?.GetDrawingScoreDef?.()) drawLabels = system.GetDrawingScoreDef()!.DrawLabels();
      if (!drawLabels) {
        for (const label of custom.FindAllDescendantsByType(ClassId.LABEL)) {
          if (!this.AdjustLabel(label)) label.GetParent()?.DeleteChild(label);
        }
      }
      saveThrough(this, custom);
    }
    else {
      if (scoreDef) saveThrough(this, scoreDef as VrvObject);
    }
  }

  protected AdjustStaffDef(staffDef: unknown, measure: unknown): void {
    const sd = staffDef as VrvObject & { GetN(): number; GetChild(i: number, id?: ClassId): VrvObject | null };
    const m = measure as VrvObject & {
      FindDescendantByComparison(c: unknown, d: number): VrvObject | null;
    };
    const staff = m.FindDescendantByComparison(new AttNIntegerComparison(ClassId.STAFF, sd.GetN()), 1) as unknown as {
      FindDescendantByType(id: ClassId): VrvObject | null;
    } | null;
    if (!staff) return;
    const layer = staff.FindDescendantByType(ClassId.LAYER) as unknown as {
      GetStaffDefClef(): VrvObject | null;
      GetStaffDefKeySig(): VrvObject | null;
      GetStaffDefMensur(): VrvObject | null;
      GetStaffDefMeterSigGrp(): VrvObject | null;
      GetStaffDefMeterSig(): VrvObject | null;
    } | null;
    if (!layer) return;
    const swap = (id: ClassId, repl: VrvObject | null): void => {
      if (!repl) return;
      const cur = (sd as unknown as VrvObject).GetChild(0, id);
      if (cur) (sd as unknown as VrvObject).DeleteChild(cur);
      (sd as unknown as VrvObject).AddChild(repl.Clone());
    };
    swap(ClassId.CLEF, layer.GetStaffDefClef());
    swap(ClassId.KEYSIG, layer.GetStaffDefKeySig());
    swap(ClassId.MENSUR, layer.GetStaffDefMensur());
    let meterReplaced = false;
    if (layer.GetStaffDefMeterSigGrp()) {
      const g = (sd as unknown as VrvObject).GetChild(0, ClassId.METERSIGGRP);
      if (g) (sd as unknown as VrvObject).DeleteChild(g);
      else {
        const s = (sd as unknown as VrvObject).GetChild(0, ClassId.METERSIG);
        if (s) (sd as unknown as VrvObject).DeleteChild(s);
      }
      (sd as unknown as VrvObject).AddChild(layer.GetStaffDefMeterSigGrp()!.Clone());
      meterReplaced = true;
    }
    if (layer.GetStaffDefMeterSig()) {
      const s = (sd as unknown as VrvObject).GetChild(0, ClassId.METERSIG);
      if (s) (sd as unknown as VrvObject).DeleteChild(s);
      else {
        const g = (sd as unknown as VrvObject).GetChild(0, ClassId.METERSIGGRP);
        if (g) (sd as unknown as VrvObject).DeleteChild(g);
      }
      (sd as unknown as VrvObject).AddChild(layer.GetStaffDefMeterSig()!.Clone());
      meterReplaced = true;
    }
    if (!meterReplaced) {
      for (const ms of (sd as unknown as VrvObject).FindAllDescendantsByType(ClassId.METERSIG)) {
        (ms as unknown as { SetVisible(v: number): void }).SetVisible(BOOLEAN_false);
      }
    }
  }

  protected AdjustLabel(label: unknown): boolean {
    const l = label as VrvObject & {
      GetParent(): VrvObject | null;
      GetChild(i: number, id?: ClassId): VrvObject | null;
      GetChildCount(id: ClassId): number;
    };
    const abbr = l.GetParent()?.GetChild(0, ClassId.LABELABBR) as unknown as {
      GetText(): string;
    } | null;
    if (abbr && l.GetChildCount(ClassId.TEXT) === 1) {
      const text = l.GetChild(0, ClassId.TEXT) as unknown as { SetText(v: number[]): void } | null;
      if (text) {
        text.SetText(UTF8to32(abbr.GetText()));
        return true;
      }
    }
    return false;
  }

  public IDToMeiStr(element: VrvObject): string { return element.GetID(); }

  public WriteXmlId(currentNode: xml_node, object: unknown): void {
    const o = object as VrvObject;
    if (this.m_removeIds && !this.m_referredObjects.has(o)) return;
    currentNode.append_attribute('xml:id').set_value(this.IDToMeiStr(o));
  }

  protected WriteDoc(doc: unknown): boolean {
    const d = this.doc;
    if (!this.m_ignoreHeader) {
      if (d.m_header.first_child().empty()) d.GenerateMEIHeader?.();
      if (this.GetBasic()) d.ConvertHeaderToMEIBasic?.();
      const head = d.m_header.first_child();
      if (!head.empty()) this.m_mei.append_copy(head);
      if (!this.GetBasic() && (d.GetOptions?.().m_transpose?.getValue?.() ?? '') !== '') {
        this.WriteRevisionDesc(this.m_mei.first_child());
      }
    }
    const music = this.m_mei.append_child('music');
    if (d.m_musicDecls !== '') music.append_attribute('decls').set_value(d.m_musicDecls);
    const facs = (doc as unknown as { GetFacsimile(): VrvObject & { GetChildCount(id: ClassId): number } | null }).GetFacsimile?.() ?? null;
    void facs;
    const docFacs = d.GetFacsimile?.() as unknown as (VrvObject & { GetChildCount(id: ClassId): number }) | null;
    if (!this.GetBasic() && docFacs && docFacs.GetChildCount(ClassId.UNSPECIFIED) > 0) {
      const facsimile = music.append_child('facsimile');
      this.writeFacsimileFamily(facsimile, docFacs as unknown as AnyObj, 'facsimile');
      this.m_nodeStack.push(facsimile);
    }
    if (!d.m_front.first_child().empty()) music.append_copy(d.m_front.first_child());
    this.m_currentNode = music.append_child('body');
    this.m_nodeStack.push(this.m_currentNode);
    if (!d.m_back.first_child().empty()) music.append_copy(d.m_back.first_child());
    void doc;
    return true;
  }

  protected WriteRevisionDesc(meiHead: xml_node): void {
    const transposition: string = this.doc.GetOptions?.().m_transpose?.getValue?.() ?? '';
    const transposer = new Transposer();
    transposer.SetBase600();
    let value = 0;
    let keyTonic = '';
    if (transposer.IsValidIntervalName(transposition)) {
      const interval = transposer.GetInterval(transposition);
      const [diatonic, chromatic] = transposer.IntervalToDiatonicChromatic(interval);
      void diatonic;
      value = chromatic === INVALID_INTERVAL_CLASS ? 0 : chromatic;
    }
    else if (transposer.IsValidSemitones(transposition)) {
      value = Number.parseInt(transposition, 10);
    }
    else if (transposer.IsValidKeyTonic(transposition)) {
      const pitch = new TransPitch();
      transposer.GetKeyTonic(transposition, pitch);
      let direction = '';
      if (!pitch.m_oct) direction = 'closest ';
      else if (pitch.m_oct < 0) direction += `${Math.abs(pitch.m_oct)} next lower `;
      else if (pitch.m_oct > 0) direction += `${Math.abs(pitch.m_oct)} next higher `;
      keyTonic += `Transposed to ${direction}${pitch.GetSimplePitchString()} by Verovio`;
    }
    if (!value && keyTonic === '') return;
    let revisionDesc = meiHead.child('revisionDesc');
    if (revisionDesc.empty()) revisionDesc = meiHead.append_child('revisionDesc');
    const change = revisionDesc.append_child('change');
    const now = new Date();
    const pad = (n: number): string => String(n).padStart(2, '0');
    change.append_attribute('isodate').set_value(
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    const changeDesc = change.append_child('changeDesc');
    const p1 = changeDesc.append_child('p');
    if (keyTonic !== '') p1.text().set(keyTonic);
    else p1.text().set(value > 0 ? `Transposed up ${value} semitones by Verovio.` : `Transposed down ${Math.abs(value)} semitones by Verovio.`);
  }

  protected WriteExpansion(currentNode: xml_node, expansion: unknown): void {
    // C++ WriteExpansion: PlistInterface (plist) before SystemElement (xml:id).
    this.writeAttrs(currentNode, asObj(expansion), true);
    this.WriteXmlId(currentNode, expansion);
  }

  protected WriteMdiv(currentNode: xml_node, mdiv: unknown): void {
    const m = mdiv as unknown as { IsHidden(): boolean };
    if (m.IsHidden?.() && this.IsSerializing()) {
      this.m_currentNode.append_attribute(VEROVIO_SERIALIZATION).set_value('hidden');
    }
    this.WriteXmlId(currentNode, mdiv);
    this.writeAttrs(currentNode, asObj(mdiv), true);
  }

  protected WritePages(currentNode: xml_node, pages: unknown): void {
    if (this.IsPageBasedMEI()) {
      currentNode.append_attribute('type').set_value(this.DocTypeToStr(this.doc.GetType?.() as DocType));
    }
    this.WriteXmlId(currentNode, pages);
    this.writeAttrs(currentNode, asObj(pages), true);
  }

  protected WriteScore(currentNode: xml_node, score: unknown): void {
    this.WriteXmlId(currentNode, score);
    this.writeAttrs(currentNode, asObj(score), true);
  }

  protected WritePage(currentNode: xml_node, page: unknown): void {
    const p = page as unknown as {
      m_pageHeight: number; m_pageWidth: number; m_pageMarginLeft: number; m_pageMarginRight: number;
      m_surface: string; m_PPUFactor: number;
    };
    this.WriteXmlId(currentNode, page);
    if (p.m_pageHeight !== -1) {
      // C++ repeats page.rightmar twice; preserved faithfully.
      currentNode.append_attribute('page.width').set_value(StringFormat('%d', p.m_pageWidth / DEFINITION_FACTOR));
      currentNode.append_attribute('page.height').set_value(StringFormat('%d', p.m_pageHeight / DEFINITION_FACTOR));
      currentNode.append_attribute('page.leftmar').set_value(StringFormat('%d', p.m_pageMarginLeft / DEFINITION_FACTOR));
      currentNode.append_attribute('page.rightmar').set_value(StringFormat('%d', p.m_pageMarginRight / DEFINITION_FACTOR));
      currentNode.append_attribute('page.rightmar').set_value(StringFormat('%d', p.m_pageMarginRight / DEFINITION_FACTOR));
    }
    if (p.m_surface !== '') currentNode.append_attribute('surface').set_value(p.m_surface);
    if (p.m_PPUFactor !== 1.0) currentNode.append_attribute('ppu').set_value(StringFormat('%f', p.m_PPUFactor));
  }

  protected WriteSystem(currentNode: xml_node, system: unknown): void {
    const s = system as unknown as { m_systemLeftMar: number; m_systemRightMar: number; m_drawingFacsY: number };
    this.WriteXmlId(currentNode, system);
    currentNode.append_attribute('system.leftmar').set_value(StringFormat('%d', s.m_systemLeftMar / DEFINITION_FACTOR));
    currentNode.append_attribute('system.rightmar').set_value(StringFormat('%d', s.m_systemRightMar / DEFINITION_FACTOR));
    if (s.m_drawingFacsY !== VRV_UNSET) {
      currentNode.append_attribute('uly').set_value(StringFormat('%d', s.m_drawingFacsY / DEFINITION_FACTOR));
    }
    this.writeAttrs(currentNode, asObj(system), true);
  }

  protected WriteMeasureLike(currentNode: xml_node, object: unknown): void {
    const m = object as unknown as {
      m_drawingFacsX1?: number; m_drawingFacsX2?: number;
      SetCoordX1(v: number): void; SetCoordX2(v: number): void;
    };
    this.WriteXmlId(currentNode, object);
    this.writeAttrs(currentNode, asObj(object), true);
    if (m.m_drawingFacsX1 !== undefined && m.m_drawingFacsX1 !== VRV_UNSET
      && m.m_drawingFacsX2 !== undefined && m.m_drawingFacsX2 !== VRV_UNSET
      && !this.doc.IsNeumeLines?.()) {
      m.SetCoordX1(m.m_drawingFacsX1 / DEFINITION_FACTOR);
      m.SetCoordX2(m.m_drawingFacsX2 / DEFINITION_FACTOR);
      this.writeAttrs(currentNode, asObj(object), true);
    }
  }

  protected WriteStaff(currentNode: xml_node, staff: unknown): void {
    const s = staff as unknown as {
      m_drawingFacsY?: number; GetDrawingFacsY?(): number; SetCoordY1(v: number): void;
    };
    this.WriteXmlId(currentNode, staff);
    this.writeAttrs(currentNode, asObj(staff), true);
    const y = s.GetDrawingFacsY?.() ?? s.m_drawingFacsY ?? VRV_UNSET;
    if (y !== VRV_UNSET && !this.doc.IsNeumeLines?.()) {
      s.SetCoordY1(y / DEFINITION_FACTOR);
      this.writeAttrs(currentNode, asObj(staff), true);
    }
  }

  protected WriteOStaff(currentNode: xml_node, staff: unknown): void {
    const s = staff as unknown as { AttributesToExternal(): void; AttributesToInternal(): void };
    s.AttributesToExternal?.();
    this.WriteXmlId(currentNode, staff);
    this.writeAttrs(currentNode, asObj(staff), true);
    s.AttributesToInternal?.();
  }

  protected WriteLayer(currentNode: xml_node, layer: unknown): void {
    this.WriteXmlId(currentNode, layer);
    this.writeAttrs(currentNode, asObj(layer), true);
  }

  protected WriteText(element: xml_node, text: unknown): void {
    const t = text as unknown as { GetText(): number[] };
    const content = t.GetText?.() ?? [];
    if (content.length > 0) {
      const child = element.append_child(xml_node_type.node_pcdata);
      if (this.doc.GetOptions?.().m_outputSmuflXmlEntities?.getValue?.()) {
        child.text().set(UTF32to8(UTF8to32(EscapeSMuFL(content)).flatMap((cp) => [cp])));
      }
      else {
        child.text().set(UTF32to8(content));
      }
    }
  }

  protected WriteSvg(currentNode: xml_node, svg: unknown): void {
    const s = svg as unknown as { Get(): xml_node };
    if (!this.m_removeIds) currentNode.append_attribute('id').set_value(this.IDToMeiStr(svg as VrvObject));
    const root = s.Get?.();
    if (root && !root.empty()) {
      for (const attr of root.attributes() as Iterable<{ name(): string; value(): string }>) {
        currentNode.append_attribute((attr as { name(): string }).name()).set_value((attr as { value(): string }).value());
      }
      for (const child of root.children() as Iterable<xml_node>) currentNode.append_copy(child);
    }
  }

  protected WriteUnsupportedAttr(element: xml_node, object: unknown): void {
    const o = object as VrvObject & { m_unsupported: ArrayOfStrAttr };
    for (const [name, value] of o.m_unsupported ?? []) {
      if (!element.attribute(name).empty()) {
        LogDebug("Attribute '%s' for '%s' is not supported", name, (object as VrvObject).GetClassName());
      }
      else {
        element.append_attribute(name).set_value(value);
      }
    }
  }

  public EscapeSMuFL(data: number[]): string { return EscapeSMuFL(data); }

  public DocTypeToStr(type: DocType): string {
    switch (type) {
      case DocType.Raw: return 'raw';
      case DocType.Rendering: return 'rendering';
      case DocType.Transcription: return 'transcription';
      case DocType.Facs: return 'facsimile';
      default:
        LogWarning("Unknown document type '%d'", type as number);
        return '';
    }
  }
}

export function EscapeSMuFL(data: number[]): string {
  let out = '';
  for (const c of data) {
    if (c === 0x26) out += '&amp;';
    else if (c === 0x22) out += '&quot;';
    else if (c === 0x27) out += '&apos;';
    else if (c === 0x3c) out += '&lt;';
    else if (c === 0x3e) out += '&gt;';
    else if (c > 0xe000) out += `&#x${c.toString(16)};`;
    else out += String.fromCodePoint(c);
  }
  return out;
}

export class MEIOutputExtended extends MEIOutput {
  constructor(doc: DocLike) { super(doc); }

  public ExportScoreDef(): JsonxxObject {
    try {
      const meiDoc = new xml_document();
      this.m_currentNode = meiDoc as unknown as xml_node;
      this.m_nodeStack.push(this.m_currentNode);
      const first = this.doc.GetFirstScoreDef?.() as unknown as VrvObject | null;
      if (first) saveThrough(this, first);
      return this.ToJson(meiDoc);
    }
    catch (e) {
      LogError('%s', (e as Error)?.message ?? String(e));
      return new JsonxxObject();
    }
  }

  private ToJson(doc: xml_document): JsonxxObject {
    const nodeToJson = (node: xml_node): JsonxxObject => {
      const out = new JsonxxObject();
      const idAttr = node.attribute('xml:id');
      out.append('id', idAttr.empty() ? new VrvObject(ClassId.OBJECT).GetID() : idAttr.value());
      if (node.type() === xml_node_type.node_pcdata) {
        out.append('text', node.value());
        out.append('isLeaf', true);
        out.append('element', 'text');
      }
      else {
        out.append('element', node.name());
        const attrs = new JsonxxObject();
        for (const attr of node.attributes() as Iterable<{ name(): string; value(): string }>) {
          const n = (attr as { name(): string }).name();
          if (n !== 'xml:id') attrs.append(n, (attr as { value(): string }).value());
        }
        if (!attrs.empty()) out.append('attributes', attrs);
      }
      const children = new JsonxxArray();
      for (const child of node.children() as Iterable<xml_node>) {
        if (child.type() === xml_node_type.node_element || child.type() === xml_node_type.node_pcdata) {
          children.append(nodeToJson(child));
        }
      }
      if (!children.empty()) out.append('children', children);
      else out.append('isLeaf', true);
      return out;
    };
    for (let n = doc.first_child(); !n.empty(); n = n.next_sibling()) {
      if (n.type() === xml_node_type.node_element) return nodeToJson(n);
    }
    return new JsonxxObject();
  }
}

export const s_editorialElementNames = ['abbr', 'add', 'app', 'annot', 'choice', 'corr',
  'damage', 'del', 'expan', 'orig', 'ref', 'reg', 'restore', 'sic', 'subst', 'supplied', 'unclear'];

const MEIVERSION_NONE = 0;
const MEIVERSION_2013 = 1;
const MEIVERSION_3_0_0 = 2;
const MEIVERSION_4_0_0 = 3;
const MEIVERSION_4_0_1 = 4;
const MEIVERSION_5_0 = 5;
const MEIVERSION_5_1 = 6;
const MEIVERSION_6_0_DEV = 15;

const BOOLEAN_NONE = 0;
const BOOLEAN_true = 1;
const CANCELACCID_none = 1;
const CANCELACCID_before = 2;
const MENSURATIONSIGN_C = 1;
const MENSURATIONSIGN_O = 2;
const TEMPUS_3 = 3;
const PROLATIO_3 = 3;
const NOTATIONTYPE_tab_guitar = 10;
const CLEFSHAPE_TAB = 6;
// Canonical libMEI ordinals (attconverter.ts StrTo* tables).
const BEATRPT_REND_1 = 1;
const BEATRPT_REND_2 = 2;
const BEATRPT_REND_3 = 3;
const BEATRPT_REND_4 = 4;
const BEATRPT_REND_5 = 5;
const BEATRPT_REND_mixed = 6;
const mordentLog_FORM_lower = 1;
const mordentLog_FORM_upper = 2;
const turnLog_FORM_lower = 1;
const HORIZONTALALIGNMENT_NONE = 0;
const VERTICALALIGNMENT_NONE = 0;

function nextElement(node: xml_node): xml_node {
  let cur = node;
  while (!cur.empty() && cur.type() !== xml_node_type.node_element && cur.type() !== xml_node_type.node_comment) {
    cur = cur.next_sibling();
  }
  return cur;
}

function firstElementChild(node: xml_node): xml_node {
  return nextElement(node.first_child());
}

/** Minimal XPath-subset matcher for the editorial selection options
 * (`./name`, `./name[@attr='v']`, `./name[contains(@attr,'v')]`). pugixml TS
 * ships no select_node; upgrade path: implement a real xpath engine. */
function matchesXPath(node: xml_node, query: string): boolean {
  const m = /^\.\/([a-zA-Z]+)(?:\[([^\]]+)\])?$/.exec(query.trim());
  if (!m) return false;
  if (node.name() !== m[1]) return false;
  const pred = m[2];
  if (!pred) return true;
  const attrEq = /^@([a-zA-Z:._-]+)='(.*)'$/.exec(pred);
  if (attrEq) return node.attribute(attrEq[1]).value() === attrEq[2];
  const contains = /^contains\(@([a-zA-Z:._-]+),\s*'(.*)'\)$/.exec(pred);
  if (contains) return node.attribute(contains[1]).value().includes(contains[2]);
  return false;
}

/** C++ parentNode.select_node(query) for the supported subset: first descendant match. */
function selectNode(parentNode: xml_node, query: string): xml_node | null {
  for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
    if (matchesXPath(current, query)) return current;
  }
  return null;
}

function sameXmlNode(a: xml_node | null, b: xml_node): boolean {
  return a !== null && !a.empty() && !b.empty() && a.internal_object() === b.internal_object();
}

function findFirstDescendant(node: xml_node, predicate: (n: xml_node) => boolean): xml_node | null {
  for (const child of node.children() as Iterable<xml_node>) {
    if (predicate(child)) return child;
    const found = findFirstDescendant(child, predicate);
    if (found) return found;
  }
  return null;
}

function findAllDescendants(node: xml_node, predicate: (n: xml_node) => boolean): xml_node[] {
  const result: xml_node[] = [];
  for (const child of node.children() as Iterable<xml_node>) {
    if (predicate(child)) result.push(child);
    result.push(...findAllDescendants(child, predicate));
  }
  return result;
}

type AttSetFn = (element: AttModuleElementLike, attrType: string, attrValue: string) => boolean;
const ATT_SETS: AttSetFn[] = [
  AttModule.SetShared, AttModule.SetCmn, AttModule.SetVisual, AttModule.SetGestural,
  AttModule.SetMensural, AttModule.SetAnalytical, AttModule.SetEdittrans, AttModule.SetHeader,
  AttModule.SetMidi, AttModule.SetNeumes, AttModule.SetPagebased, AttModule.SetPerformance,
  AttModule.SetStringtab, AttModule.SetUsersymbols, AttModule.SetFigtable, AttModule.SetFingering,
  AttModule.SetHarmony, AttModule.SetCritapp, AttModule.SetExternalsymbols, AttModule.SetFacsimile,
  AttModule.SetMei,
];
// ponytail: attr-name memo replaces the 21-deep Set* OR-chain per attribute.
// The union of Sets that ever handled a name is sufficient: extra Sets return
// false harmlessly, and a newly-seen class falls back to the full chain once.
// Upgrade path: static attr->Set table generated from attmodule if union grows.
const attSetMemo = new Map<string, AttSetFn[]>();

function setAttr(target: AttModuleElementLike, name: string, value: string): boolean {
  const memo = attSetMemo.get(name);
  if (memo !== undefined) {
    for (const fn of memo) {
      if (fn(target, name, value)) return true;
    }
    // Union missed (new class combo): full scan once, extend union.
    for (const fn of ATT_SETS) {
      if (memo.includes(fn)) continue;
      if (fn(target, name, value)) { memo.push(fn); return true; }
    }
    return false;
  }
  const hit: AttSetFn[] = [];
  let handled = false;
  for (const fn of ATT_SETS) {
    if (fn(target, name, value)) { hit.push(fn); handled = true; break; }
  }
  attSetMemo.set(name, hit);
  return handled;
}

function readAttrs(obj: VrvObject, node: xml_node): void {
  // Att converters now live on VrvObject.prototype (see object.ts mixin);
  // no Proxy needed. Raw object keeps HasAttClass/SetX monomorphic.
  // ponytail: raw AttributeData walk. node.attributes() allocated an
  // xml_attribute wrapper per attribute (mei/033: setAttr 73ms self +
  // wrappers). Semantics identical: skip xml:id, remove handled names.
  const target = obj as unknown as AttModuleElementLike;
  const root: NodeData | null = node.internal_object();
  if (!root) return;
  const toRemove: string[] = [];
  for (let a: AttributeData | null = root.firstAttribute; a; a = a.nextAttribute) {
    if (!a.alive) continue;
    const name = a.name;
    if (name === 'xml:id') continue;
    if (setAttr(target, name, a.value)) toRemove.push(name);
  }
  for (const name of toRemove) node.remove_attribute(name);
}

export class MEIInput extends Input {
  protected m_filename = '';
  protected m_meiversion = 0;
  protected m_readingScoreBased = false;
  protected m_hasScoreDef = false;
  protected m_selectedMdiv: xml_node | null = null;
  protected m_comment = '';
  protected m_deserializing = false;

  constructor(doc: DocLike) { super(doc); }

  protected getDoc(): Doc { return this.m_doc as unknown as Doc; }

  public SetDeserializing(v: boolean): void { this.m_deserializing = v; }

  public override Import(mei: string): boolean {
    try {
      const doc = new xml_document();
      doc.load_string(mei, (parse_comments | parse_default) & ~parse_eol);
      const root = doc.first_child();
      const master = this.getDoc();
      if (this.m_deserializing) {
        master.ResetToSerialization();
        this.m_meiversion = MEI_CURRENT_VERSION;
        return this.ReadPages(master, root.first_child());
      }
      else {
        master.Reset();
        master.SetType(DocType.Raw);
        return this.ReadDoc(root);
      }
    }
    catch (err: unknown) {
      LogError('%s', err instanceof Error ? err.message : String(err));
      return false;
    }
  }

  public ReadDoc(root: xml_node): boolean {
    let current: xml_node;
    let success = true;
    this.m_readingScoreBased = true;
    const doc = this.getDoc();

    if (root.empty()) {
      LogError('The tree of the MEI data cannot be parsed (no root found)');
      return false;
    }

    if (!root.attribute('meiversion').empty()) {
      const version = root.attribute('meiversion').value();
      const converter = new AttConverterBase();
      this.m_meiversion = converter.StrToMeiVersionMeiversion(version);
    }
    if (this.m_meiversion === MEIVERSION_NONE) {
      LogWarning('MEI version found or not known, falling back to MEI 6.0-dev');
      this.m_meiversion = MEIVERSION_6_0_DEV;
    }

    if (root.name() === 'mei') {
      current = root.child('meiHead');
      if (current.empty()) {
        LogWarning('No header found in the MEI data, trying to proceed...');
      }
      else {
        doc.m_header.reset();
        doc.m_header.append_copy(current);
      }
    }

    if (doc.GetOptions().m_incip.GetValue()) {
      return this.ReadIncipits(doc.m_header);
    }

    let music: xml_node;
    if (root.name() === 'music') {
      music = root;
    }
    else {
      music = root.child('music');
    }
    if (music.empty()) {
      LogError('No <music> element found in the MEI data');
      return false;
    }

    const facsimile = music.child('facsimile');
    if (!facsimile.empty()) {
      this.ReadFacsimile(doc, facsimile);
      const facs = doc.GetFacsimile() as any;
      if (doc.GetOptions().m_useFacsimile.GetValue()) {
        doc.SetType(DocType.Facs);
        if (facs) {
          doc.m_drawingPageHeight = facs.GetMaxY?.() ?? 0;
          doc.m_drawingPageWidth = facs.GetMaxX?.() ?? 0;
        }
      }
      else if (doc.HasFacsimile() && facs?.GetType?.()) {
        doc.SetType(this.StrToDocType(facs.GetType()));
      }
      if (!facsimile.next_sibling('facsimile').empty()) {
        LogWarning('Only first <facsimile> is processed');
      }
    }

    const front = music.child('front');
    if (!front.empty()) {
      doc.m_front.reset();
      doc.m_front.append_copy(front);
    }

    const back = music.child('back');
    if (!back.empty()) {
      doc.m_back.reset();
      doc.m_back.append_copy(back);
    }

    const body = music.child('body');
    if (body.empty()) {
      LogError('No <body> element found in the MEI data');
      return false;
    }

    let pages = body.child('pages');
    this.m_selectedMdiv = body.child('mdiv');

    if (this.m_selectedMdiv.empty() && pages.empty()) {
      LogError('No <mdiv> or no <pages> element found in the MEI data');
      return false;
    }
    else if (this.m_selectedMdiv.empty()) {
      this.m_readingScoreBased = false;
    }
    else if (!this.m_selectedMdiv.child('pages').empty() && (this.m_meiversion === MEIVERSION_2013)) {
      pages = this.m_selectedMdiv.child('pages');
      this.m_readingScoreBased = false;
    }

    if (this.m_readingScoreBased) {
      const xPathQuery = doc.GetOptions().m_mdivXPathQuery.GetValue();
      if (!doc.GetOptions().m_mdivAll.GetValue() && xPathQuery !== '') {
        const found = findFirstDescendant(body, (n) => {
          if (n.name() !== 'mdiv') return false;
          if (xPathQuery.includes(`@xml:id='`)) {
            const m = /@xml:id='([^']+)'/.exec(xPathQuery);
            return m ? n.attribute('xml:id').value() === m[1] : true;
          }
          if (xPathQuery.includes(`@n='`)) {
            const m = /@n='([^']+)'/.exec(xPathQuery);
            return m ? n.attribute('n').value() === m[1] : true;
          }
          return true;
        });
        if (found) {
          this.m_selectedMdiv = found;
        }
        else {
          LogError("The <mdiv> requested with the xpath query '%s' could not be found", xPathQuery);
          return false;
        }
      }
      else {
        const scoreMdiv = findFirstDescendant(body, (n) => n.name() === 'mdiv' && !n.child('score').empty());
        if (scoreMdiv) {
          this.m_selectedMdiv = scoreMdiv;
        }
      }

      if (this.m_selectedMdiv) {
        const scores = findAllDescendants(this.m_selectedMdiv, (n) => n.name() === 'score');
        if (scores.length > 1) {
          LogError('An <mdiv> with only one <score> descendant must be selected');
          return false;
        }
        const mdivPages = findAllDescendants(this.m_selectedMdiv, (n) => n.name() === 'pages');
        if (scores.length > 0 && mdivPages.length > 0) {
          LogError('An <mdiv> with only one <pages> or one <score> descendant must be selected');
          return false;
        }
      }

      const allMdivVisible = doc.GetOptions().m_mdivAll.GetValue();
      success = this.ReadMdivChildren(doc, body, allMdivVisible);

      if (success) {
        doc.ExpandExpansions();
      }

      if (success) {
        doc.ConvertToPageBasedDoc();
        doc.ConvertMarkupDoc(!doc.GetOptions().m_preserveAnalyticalMarkup.GetValue());
      }

      if (success && !this.m_hasScoreDef) {
        LogWarning('No scoreDef provided, trying to generate one...');
        success = doc.GenerateDocumentScoreDef();
      }
    }
    else {
      success = this.ReadPages(doc, pages);

      if (success && !this.m_hasScoreDef) {
        LogWarning('No scoreDef provided, trying to generate one...');
        success = doc.GenerateDocumentScoreDef();
      }
    }

    return success;
  }

  public ReadIncipits(root: xml_document): boolean {
    const incipSet = findAllDescendants(root as unknown as xml_node, (n) => n.name() === 'incip');
    if (incipSet.length === 0) {
      LogError('No <incip> element found in the MEI data');
      return false;
    }

    let incipCount = 0;
    let success = true;

    for (const incip of incipSet) {
      if (!success) break;
      const incipCode = incip.child('incipCode');
      if (!incipCode.empty()) {
        const form = incipCode.attribute('form').empty() ? '' : incipCode.attribute('form').value();
        if (form !== 'plaineAndEasie' && form !== 'pae') {
          LogWarning('Incipit format in <incipCode> is not a supported format and will be skipped.');
          continue;
        }
        const incipitDoc = new Doc();
        const paeInput = new PAEInput(incipitDoc);
        paeInput.SetScoreBased(true);
        let paeCode = incipCode.child_value().trimStart();
        paeInput.Import(paeCode);
        const mdiv = incipitDoc.DetachChild(0) as Mdiv | null;
        if (!mdiv) {
          LogError('Reading the Plaine & Easie incipit failed.');
          success = false;
        }
        else {
          incipCount++;
          mdiv.SetN(String(incipCount));
          mdiv.MakeVisible();
          this.getDoc().AddChild(mdiv);
        }
      }
    }

    return success;
  }

  public ReadMdiv(parent: VrvObject, mdiv: xml_node, isVisible: boolean): boolean {
    const vrvMdiv = new Mdiv();
    this.SetMeiID(mdiv, vrvMdiv);

    readAttrs(vrvMdiv, mdiv);
    parent.AddChild(vrvMdiv);

    if (this.m_deserializing) {
      if (!mdiv.attribute(VEROVIO_SERIALIZATION).empty()) {
        const verovioSerialization = mdiv.attribute(VEROVIO_SERIALIZATION).value();
        isVisible = (verovioSerialization !== 'hidden');
        mdiv.remove_attribute(VEROVIO_SERIALIZATION);
      }
    }

    if (isVisible) {
      vrvMdiv.MakeVisible();
    }

    this.ReadUnsupportedAttr(mdiv, vrvMdiv);
    return this.ReadMdivChildren(vrvMdiv, mdiv, isVisible);
  }

  public ReadMdivChildren(parent: VrvObject, parentNode: xml_node, isVisible: boolean): boolean {
    if (!this.m_readingScoreBased && !this.m_deserializing) {
      if (!parentNode.first_child().empty()) {
        LogWarning('Unexpected <mdiv> content in page-based MEI');
      }
      return true;
    }

    let success = true;
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      const makeVisible = isVisible || (this.m_selectedMdiv !== null && this.m_selectedMdiv.internal_object() === current.internal_object());
      if (!success) break;
      const name = current.name();
      if (name === 'mdiv') {
        success = this.ReadMdiv(parent, current, makeVisible);
      }
      else if (name === 'score') {
        if (!isVisible && this.getDoc().GetOptions().m_loadSelectedMdivOnly.GetValue()) continue;
        success = this.ReadScore(parent, current);
        if (parentNode.last_child().internal_object() !== current.internal_object()) {
          LogWarning('Skipping nodes after <score> element');
        }
        break;
      }
      else if (name === '') {
        success = this.ReadXMLComment(parent, current);
      }
      else {
        LogWarning("Unsupported '<%s>' within <mdiv>", name);
      }
    }

    return success;
  }

  public ReadScore(parent: VrvObject, score: xml_node): boolean {
    const vrvScore = new Score(false);
    this.SetMeiID(score, vrvScore);

    readAttrs(vrvScore, score);
    parent.AddChild(vrvScore);

    this.m_readingScoreBased = true;

    const tmpScore = new Score(false);
    const successDef = this.ReadScoreScoreDef(tmpScore, score);
    const subtree = tmpScore.DetachChild(0);
    const scoreScoreDef = (!subtree || subtree.Is(ClassId.SCOREDEF))
      ? (subtree as ScoreDef | null)
      : (subtree.FindDescendantByType(ClassId.SCOREDEF) as ScoreDef | null);

    if (!scoreScoreDef) {
      LogError('No top-level scoreDef could be read as child or direct descendant of score.');
      return false;
    }
    vrvScore.SetScoreDefSubtree(subtree!, scoreScoreDef);
    this.m_hasScoreDef = true;

    if (!successDef) return false;

    let success = true;
    const first = firstElementChild(score);
    for (let current = first.empty() ? first : nextElement(first.next_sibling()); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      this.NormalizeAttributes(current);
      const elementName = current.name();
      if (this.IsEditorialElementName(elementName)) {
        success = this.ReadEditorialElement(vrvScore, current, EditorialLevel.EDITORIAL_TOPLEVEL);
      }
      else if (elementName === 'ending') {
        success = this.ReadEnding(vrvScore, current);
      }
      else if (elementName === 'section') {
        success = this.ReadSection(vrvScore, current);
      }
      else if (elementName === 'sb') {
        success = this.ReadSb(vrvScore, current);
      }
      else if (elementName === 'pb') {
        success = this.ReadPb(vrvScore, current);
      }
      else if (elementName === '') {
        success = this.ReadXMLComment(parent, current);
      }
      else {
        LogWarning("Element <%s> within <score> is not supported and will be ignored ", elementName);
      }
    }

    this.ReadUnsupportedAttr(score, vrvScore);
    return success;
  }

  public ReadScoreScoreDef(parent: VrvObject, parentNode: xml_node): boolean {
    const firstChild = firstElementChild(parentNode);
    if (firstChild.empty()) return true;

    if (this.IsEditorialElementName(firstChild.name())) {
      return this.ReadEditorialElement(parent, firstChild, EditorialLevel.EDITORIAL_SCORE);
    }
    else if (firstChild.name() === 'scoreDef') {
      return this.ReadScoreDef(parent, firstChild);
    }

    return false;
  }

  public ReadScoreDef(parent: VrvObject, scoreDef: xml_node): boolean {
    const vrvScoreDef = new ScoreDef();
    parent.AddChild(vrvScoreDef);
    this.ReadScoreDefElement(scoreDef, vrvScoreDef);

    if (this.m_meiversion < MEIVERSION_4_0_0) {
      this.UpgradeScoreDefElementTo_4_0_0(scoreDef, vrvScoreDef);
    }

    const doc = this.getDoc();
    if (doc.GetOptions().m_moveScoreDefinitionToStaff.GetValue()) {
      const sdef = vrvScoreDef as unknown as { HasClefInfo?(): boolean; HasKeySigInfo?(): boolean; HasMeterSigGrpInfo?(): boolean; HasMeterSigInfo?(): boolean; HasMensurInfo?(): boolean };
      if ((sdef.HasClefInfo?.() ?? false) || (sdef.HasKeySigInfo?.() ?? false) || (sdef.HasMeterSigGrpInfo?.() ?? false)
        || (sdef.HasMeterSigInfo?.() ?? false) || (sdef.HasMensurInfo?.() ?? false)) {
        doc.SetMarkup(MARKUP_SCOREDEF_DEFINITIONS);
      }
    }

    this.ReadScoreDefInterface(scoreDef, vrvScoreDef);
    readAttrs(vrvScoreDef, scoreDef);

    this.ReadUnsupportedAttr(scoreDef, vrvScoreDef);
    return this.ReadScoreDefChildren(vrvScoreDef, scoreDef);
  }

  public ReadScoreDefChildren(parent: VrvObject, parentNode: xml_node): boolean {
    let success = true;
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      this.NormalizeAttributes(current);
      const name = current.name();
      if (this.IsEditorialElementName(name)) {
        success = this.ReadEditorialElement(parent, current, EditorialLevel.EDITORIAL_SCOREDEF);
      }
      else if (name === 'clef') success = this.ReadClef(parent, current);
      else if (name === 'grpSym') success = this.ReadGrpSym(parent, current);
      else if (name === 'keySig') success = this.ReadKeySig(parent, current);
      else if (name === 'mensur') success = this.ReadMensur(parent, current);
      else if (name === 'meterSig') success = this.ReadMeterSig(parent, current);
      else if (name === 'meterSigGrp') success = this.ReadMeterSigGrp(parent, current);
      else if (name === 'pgFoot' || name === 'pgFoot2') {
        if (this.m_meiversion <= MEIVERSION_5_0) this.UpgradePgHeadFootTo_5_0(current);
        success = this.ReadPgFoot(parent, current);
      }
      else if (name === 'pgHead' || name === 'pgHead2') {
        if (this.m_meiversion <= MEIVERSION_5_0) this.UpgradePgHeadFootTo_5_0(current);
        success = this.ReadPgHead(parent, current);
      }
      else if (name === 'symbolTable') success = this.ReadSymbolTable(parent, current);
      else if (name === 'staffGrp') {
        success = this.ReadStaffGrp(parent, current);
      }
      else if (name === '') {
        success = this.ReadXMLComment(parent, current);
      }
      else {
        LogWarning("Unsupported '<%s>' within <scoreDef>", name);
      }
    }
    return success;
  }

  public ReadStaffGrp(parent: VrvObject, staffGrp: xml_node): boolean {
    const vrvStaffGrp = new StaffGrp();
    this.SetMeiID(staffGrp, vrvStaffGrp);

    if (this.m_meiversion < MEIVERSION_4_0_0) {
      this.UpgradeStaffGrpTo_4_0_0(staffGrp, vrvStaffGrp);
    }

    // C++ iomei.cpp ReadStaffGrp reads the grouping symbol from the XML before
    // other attribute readers consume/remove it; groupingSym must be read first
    // so the implicit GrpSym child is created (WASM draws brace/bracket grpSym).
    const groupingSym = new InstStaffGroupingSym();
    groupingSym.ReadStaffGroupingSym(staffGrp);
    readAttrs(vrvStaffGrp, staffGrp);
    if (groupingSym.HasSymbol()) {
      const vrvGrpSym = new GrpSym();
      vrvGrpSym.SetAttribute(true);
      vrvGrpSym.SetSymbol(groupingSym.GetSymbol());
      vrvStaffGrp.AddChild(vrvGrpSym);
    }

    parent.AddChild(vrvStaffGrp);
    this.ReadUnsupportedAttr(staffGrp, vrvStaffGrp);
    return this.ReadStaffGrpChildren(vrvStaffGrp, staffGrp);
  }

  public ReadStaffGrpChildren(parent: VrvObject, parentNode: xml_node): boolean {
    let success = true;
    let missingStaffDef = true;
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      this.NormalizeAttributes(current);
      const name = current.name();
      if (this.IsEditorialElementName(name)) {
        success = this.ReadEditorialElement(parent, current, EditorialLevel.EDITORIAL_STAFFGRP);
      }
      else if (name === 'grpSym') {
        success = this.ReadGrpSym(parent, current);
      }
      else if (name === 'instrDef') {
        success = this.ReadInstrDef(parent, current);
      }
      else if (name === 'label') {
        success = this.ReadLabel(parent, current);
      }
      else if (name === 'labelAbbr') {
        success = this.ReadLabelAbbr(parent, current);
      }
      else if (name === 'staffGrp') {
        success = this.ReadStaffGrp(parent, current);
        missingStaffDef = false; // innermost staffGrp child will report missing staffDef
      }
      else if (name === 'staffDef') {
        success = this.ReadStaffDef(parent, current);
        missingStaffDef = false;
      }
      else if (name === '') {
        success = this.ReadXMLComment(parent, current);
      }
      else {
        LogWarning("Unsupported '<%s>' within <staffGrp>", name);
      }
    }

    // Missing staffDefs lead to crashes in the ScoreDefSetCurrent functor
    if (success && missingStaffDef) {
      LogWarning("Missing staffDef in staffGrp");
    }

    return success;
  }

  public ReadStaffDef(parent: VrvObject, staffDef: xml_node): boolean {
    const vrvStaffDef = new StaffDef();
    this.ReadScoreDefElement(staffDef, vrvStaffDef);

    if (this.m_meiversion < MEIVERSION_4_0_0) {
      this.UpgradeScoreDefElementTo_4_0_0(staffDef, vrvStaffDef);
      this.UpgradeStaffDefTo_4_0_0(staffDef, vrvStaffDef);
    }

    readAttrs(vrvStaffDef, staffDef);

    if (!vrvStaffDef.HasN()) {
      LogWarning("No @n on <staffDef> might yield unpredictable results");
    }

    this.ReadScoreDefInterface(staffDef, vrvStaffDef);

    this.getDoc().m_notationType = vrvStaffDef.GetNotationtype();

    parent.AddChild(vrvStaffDef);
    this.ReadUnsupportedAttr(staffDef, vrvStaffDef);
    return this.ReadStaffDefChildren(vrvStaffDef, staffDef);
  }

  public ReadStaffDefChildren(parent: VrvObject, parentNode: xml_node): boolean {
    let success = true;
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      const name = current.name();
      if (name === 'clef') success = this.ReadClef(parent, current);
      else if (name === 'keySig') success = this.ReadKeySig(parent, current);
      else if (name === 'mensur') success = this.ReadMensur(parent, current);
      else if (name === 'meterSig') success = this.ReadMeterSig(parent, current);
      else if (name === 'meterSigGrp') success = this.ReadMeterSigGrp(parent, current);
      else if (name === 'instrDef') success = this.ReadInstrDef(parent, current);
      else if (name === 'label') success = this.ReadLabel(parent, current);
      else if (name === 'labelAbbr') success = this.ReadLabelAbbr(parent, current);
      else if (name === 'layerDef') success = this.ReadLayerDef(parent, current);
      else if (name === 'tuning') success = this.ReadTuning(parent, current);
      else if (name === '') success = this.ReadXMLComment(parent, current);
      else LogWarning("Unsupported '<%s>' within <staffDef>", name);
    }
    return success;
  }

  public ReadSection(parent: VrvObject, section: xml_node): boolean {
    const vrvSection = new Section();
    this.ReadSystemElement(section, vrvSection);
    readAttrs(vrvSection, section);

    parent.AddChild(vrvSection);
    this.ReadUnsupportedAttr(section, vrvSection);
    return this.ReadSectionChildren(vrvSection, section);
  }

  public ReadSectionChildren(parent: VrvObject, parentNode: xml_node): boolean {
    let success = true;
    let unmeasured: Measure | null = null;
    const doc = this.getDoc();
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      this.NormalizeAttributes(current);
      const name = current.name();
      if (this.IsEditorialElementName(name)) {
        success = this.ReadEditorialElement(parent, current, EditorialLevel.EDITORIAL_TOPLEVEL);
      }
      else if (name === 'div') {
        success = this.ReadDiv(parent, current);
      }
      else if (name === 'ending') {
        success = this.ReadEnding(parent, current);
      }
      else if (name === 'expansion') {
        success = this.ReadExpansion(parent, current);
      }
      else if (name === 'scoreDef') {
        success = this.ReadScoreDef(parent, current);
      }
      else if (name === 'section') {
        success = this.ReadSection(parent, current);
      }
      else if (name === 'pb') {
        success = this.ReadPb(parent, current);
      }
      else if (name === 'sb') {
        success = this.ReadSb(parent, current);
      }
      else if (name === 'staff') {
        if (!unmeasured) {
          if (parent.Is(ClassId.SECTION)) {
            unmeasured = doc.IsNeumeLines()
              ? new Measure(MeasureType.NEUMELINE)
              : new Measure(MeasureType.UNMEASURED);
            if (!doc.IsNeumeLines()) doc.SetMensuralMusicOnly(BOOLEAN_true);
            parent.AddChild(unmeasured);
          }
          else {
            LogError('Unmeasured music within editorial markup is currently not supported');
            return false;
          }
        }
        success = this.ReadStaff(unmeasured, current);
      }
      else if (name === 'measure') {
        success = this.ReadMeasure(parent, current);
      }
      else if (name === '') {
        success = this.ReadXMLComment(parent, current);
      }
      else {
        LogWarning("Unsupported '<%s>' within <section>", name);
      }
    }

    if (!unmeasured && parent.Is(ClassId.SECTION) && IsNeumeType(doc.m_notationType)
      && !parent.FindDescendantByType(ClassId.MEASURE)) {
      const blank = doc.IsNeumeLines()
        ? new Measure(MeasureType.NEUMELINE)
        : new Measure(MeasureType.UNMEASURED);
      if (!doc.IsNeumeLines()) doc.SetMensuralMusicOnly(BOOLEAN_true);
      parent.AddChild(blank);
    }
    return success;
  }

  public ReadMeasure(parent: VrvObject, measure: xml_node): boolean {
    const vrvMeasure = new Measure();
    const doc = this.getDoc();
    if (doc.IsMensuralMusicOnly()) {
      LogWarning('Mixing mensural and non mensural music is not supported. Trying to go ahead...');
      doc.SetMensuralMusicOnly(BOOLEAN_false);
    }
    this.SetMeiID(measure, vrvMeasure);
    this.ReadFacsimileInterface(measure, vrvMeasure);
    readAttrs(vrvMeasure, measure);

    if (doc.IsTranscription() && (this.m_meiversion === MEIVERSION_2013)) {
      this.UpgradeMeasureTo_5_0(measure);
    }

    if (!measure.attribute('coord.x1').empty() && !measure.attribute('coord.x2').empty() && doc.IsTranscription()) {
      const anyMeasure = vrvMeasure as unknown as { m_drawingFacsX1: number; m_drawingFacsX2: number };
      anyMeasure.m_drawingFacsX1 = (parseFloat(measure.attribute('coord.x1').value()) || 0) * DEFINITION_FACTOR;
      anyMeasure.m_drawingFacsX2 = (parseFloat(measure.attribute('coord.x2').value()) || 0) * DEFINITION_FACTOR;
    }

    parent.AddChild(vrvMeasure);
    this.ReadUnsupportedAttr(measure, vrvMeasure);
    return this.ReadMeasureChildren(vrvMeasure, measure);
  }

  public ReadMeasureChildren(parent: VrvObject, parentNode: xml_node): boolean {
    let success = true;
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      const currentName = current.name();
      if (!success) break;
      this.NormalizeAttributes(current);
      if (this.IsEditorialElementName(currentName)) {
        if (currentName === 'annot' && this.IsAnnotScore(current)) {
          success = this.ReadAnnotScore(parent, current);
        }
        else {
          success = this.ReadEditorialElement(parent, current, EditorialLevel.EDITORIAL_MEASURE);
        }
      }
      else if (currentName === 'anchoredText') success = this.ReadAnchoredText(parent, current);
      else if (currentName === 'arpeg') success = this.ReadArpeg(parent, current);
      else if (currentName === 'beamSpan') success = this.ReadBeamSpan(parent, current);
      else if (currentName === 'bracketSpan') success = this.ReadBracketSpan(parent, current);
      else if (currentName === 'breath') success = this.ReadBreath(parent, current);
      else if (currentName === 'caesura') success = this.ReadCaesura(parent, current);
      else if (currentName === 'cpMark') success = this.ReadCpMark(parent, current);
      else if (currentName === 'dir') success = this.ReadDir(parent, current);
      else if (currentName === 'dynam') success = this.ReadDynam(parent, current);
      else if (currentName === 'fermata') success = this.ReadFermata(parent, current);
      else if (currentName === 'fing') success = this.ReadFing(parent, current);
      else if (currentName === 'gliss') success = this.ReadGliss(parent, current);
      else if (currentName === 'hairpin') success = this.ReadHairpin(parent, current);
      else if (currentName === 'harm') success = this.ReadHarm(parent, current);
      else if (currentName === 'lv') success = this.ReadLv(parent, current);
      else if (currentName === 'mNum') success = this.ReadMNum(parent, current);
      else if (currentName === 'mordent') success = this.ReadMordent(parent, current);
      else if (currentName === 'octave') success = this.ReadOctave(parent, current);
      else if (currentName === 'ornam') success = this.ReadOrnam(parent, current);
      else if (currentName === 'ossia') success = this.ReadOssia(parent, current);
      else if (currentName === 'pedal') success = this.ReadPedal(parent, current);
      else if (currentName === 'phrase') success = this.ReadPhrase(parent, current);
      else if (currentName === 'pitchInflection') success = this.ReadPitchInflection(parent, current);
      else if (currentName === 'reh') success = this.ReadReh(parent, current);
      else if (currentName === 'repeatMark') success = this.ReadRepeatMark(parent, current);
      else if (currentName === 'slur') success = this.ReadSlur(parent, current);
      else if (currentName === 'staff') success = this.ReadStaff(parent, current);
      else if (currentName === 'stageDir') success = this.ReadDir(parent, current, true);
      else if (currentName === 'tempo') success = this.ReadTempo(parent, current);
      else if (currentName === 'tie') success = this.ReadTie(parent, current);
      else if (currentName === 'trill') success = this.ReadTrill(parent, current);
      else if (currentName === 'turn') success = this.ReadTurn(parent, current);
      else if (currentName === 'tupletSpan') {
        if (!this.ReadTupletSpanAsTuplet(parent as Measure, current)) {
          LogWarning('<tupletSpan> is not readable as <tuplet> and will be ignored');
        }
      }
      else if (currentName === '') success = this.ReadXMLComment(parent, current);
      else LogWarning("Unsupported '<%s>' within <measure>", currentName);
    }
    return success;
  }

  public ReadStaff(parent: VrvObject, staff: xml_node): boolean {
    const vrvStaff = new Staff();
    this.SetMeiID(staff, vrvStaff);
    this.ReadFacsimileInterface(staff, vrvStaff);
    readAttrs(vrvStaff, staff);

    if (!vrvStaff.HasN() || (vrvStaff.GetN() === 0)) {
      LogWarning('No @n on <staff> or a value of 0 might yield unpredictable results');
    }

    parent.AddChild(vrvStaff);
    this.ReadUnsupportedAttr(staff, vrvStaff);
    return this.ReadStaffChildren(vrvStaff, staff);
  }

  public ReadOStaff(parent: VrvObject, oStaff: xml_node): boolean {
    const vrvStaff = new Staff();
    vrvStaff.SetOssia(true);
    this.SetMeiID(oStaff, vrvStaff);
    this.ReadFacsimileInterface(oStaff, vrvStaff);
    readAttrs(vrvStaff, oStaff);

    if (!vrvStaff.HasN() || (vrvStaff.GetN() === 0)) {
      LogWarning('No @n on <staff> or a value of 0 might yield unpredictable results');
    }

    vrvStaff.AttributesToInternal();

    if (this.getDoc().GetOptions().m_ossiaHidden.GetValue()) {
      vrvStaff.SetVisibility(VisibilityType.Hidden);
    }

    parent.AddChild(vrvStaff);
    this.ReadUnsupportedAttr(oStaff, vrvStaff);
    return this.ReadStaffChildren(vrvStaff, oStaff);
  }

  public ReadStaffChildren(parent: VrvObject, parentNode: xml_node): boolean {
    let success = true;
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      this.NormalizeAttributes(current);
      const name = current.name();
      if (this.IsEditorialElementName(name)) {
        success = this.ReadEditorialElement(parent, current, EditorialLevel.EDITORIAL_STAFF);
      }
      else if (name === 'layer') {
        success = this.ReadLayer(parent, current);
      }
      else if (name === '') {
        success = this.ReadXMLComment(parent, current);
      }
      else {
        LogWarning("Unsupported '<%s>' within <staff>", name);
      }
    }
    return success;
  }

  public ReadLayer(parent: VrvObject, layer: xml_node): boolean {
    const vrvLayer = new Layer();
    this.SetMeiID(layer, vrvLayer);
    readAttrs(vrvLayer, layer);

    if (!vrvLayer.HasN()) {
      LogWarning('Missing @n on <layer>, filled by order');
    }
    else if (vrvLayer.GetN() === 0) {
      LogWarning("Value @n='0' on <layer> might yield unpredictable results");
    }

    const doc = this.getDoc();
    if (doc.IsMensuralMusicOnly() && (parent.GetChildCount(ClassId.LAYER) > 0)) {
      LogWarning('Mensural music with more than one layer is not supported. Trying to go ahead...');
      doc.SetMensuralMusicOnly(BOOLEAN_false);
    }

    parent.AddChild(vrvLayer);
    this.ReadUnsupportedAttr(layer, vrvLayer);
    return this.ReadLayerChildren(vrvLayer, layer, vrvLayer);
  }

  public ReadLayerChildren(parent: VrvObject, parentNode: xml_node, filter: VrvObject | null): boolean {
    let success = true;
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      this.NormalizeAttributes(current);
      const elementName = current.name();
      if (filter && !this.IsAllowed(elementName, filter)) {
        LogWarning("Element <%s> within <%s> is not supported and will be ignored ", elementName, filter.GetClassName());
        continue;
      }
      if (this.IsEditorialElementName(elementName)) {
        success = this.ReadEditorialElement(parent, current, EditorialLevel.EDITORIAL_LAYER, filter);
      }
      else if (elementName === 'accid') success = this.ReadAccid(parent, current);
      else if (elementName === 'artic') success = this.ReadArtic(parent, current);
      else if (elementName === 'barLine') success = this.ReadBarLine(parent, current);
      else if (elementName === 'beam') success = this.ReadBeam(parent, current);
      else if (elementName === 'beatRpt') success = this.ReadBeatRpt(parent, current);
      else if (elementName === 'bTrem') success = this.ReadBTrem(parent, current);
      else if (elementName === 'chord') success = this.ReadChord(parent, current);
      else if (elementName === 'clef') success = this.ReadClef(parent, current);
      else if (elementName === 'custos') success = this.ReadCustos(parent, current);
      else if (elementName === 'divLine') success = this.ReadDivLine(parent, current);
      else if (elementName === 'dot') success = this.ReadDot(parent, current);
      else if (elementName === 'episema') success = this.ReadEpisema(parent, current);
      else if (elementName === 'fTrem') success = this.ReadFTrem(parent, current);
      else if (elementName === 'gap') success = this.ReadGenericLayerElement(parent, current);
      else if (elementName === 'graceGrp') success = this.ReadGraceGrp(parent, current);
      else if (elementName === 'halfmRpt') success = this.ReadHalfmRpt(parent, current);
      else if (elementName === 'keyAccid') success = this.ReadKeyAccid(parent, current);
      else if (elementName === 'keySig') success = this.ReadKeySig(parent, current);
      else if (elementName === 'ligature') success = this.ReadLigature(parent, current);
      else if (elementName === 'liquescent') success = this.ReadLiquescent(parent, current);
      else if (elementName === 'mensur') success = this.ReadMensur(parent, current);
      else if (elementName === 'meterSig') success = this.ReadMeterSig(parent, current);
      else if (elementName === 'meterSigGrp') success = this.ReadMeterSigGrp(parent, current);
      else if (elementName === 'mRest') success = this.ReadMRest(parent, current);
      else if (elementName === 'mRpt') success = this.ReadMRpt(parent, current);
      else if (elementName === 'mRpt2') success = this.ReadMRpt2(parent, current);
      else if (elementName === 'mSpace') success = this.ReadMSpace(parent, current);
      else if (elementName === 'multiRest') success = this.ReadMultiRest(parent, current);
      else if (elementName === 'multiRpt') success = this.ReadMultiRpt(parent, current);
      else if (elementName === 'nc') success = this.ReadNc(parent, current);
      else if (elementName === 'neume') success = this.ReadNeume(parent, current);
      else if (elementName === 'note') success = this.ReadNote(parent, current);
      else if (elementName === 'oriscus') success = this.ReadOriscus(parent, current);
      else if (elementName === 'plica') success = this.ReadPlica(parent, current);
      else if (elementName === 'proport') success = this.ReadProport(parent, current);
      else if (elementName === 'quilisma') success = this.ReadQuilisma(parent, current);
      else if (elementName === 'rest') success = this.ReadRest(parent, current);
      else if (elementName === 'space') success = this.ReadSpace(parent, current);
      else if (elementName === 'stem') success = this.ReadStem(parent, current);
      else if (elementName === 'strophicus') success = this.ReadStrophicus(parent, current);
      else if (elementName === 'syl') success = this.ReadSyl(parent, current);
      else if (elementName === 'syllable') success = this.ReadSyllable(parent, current);
      else if (elementName === 'tabDurSym') success = this.ReadTabDurSym(parent, current);
      else if (elementName === 'tabGrp') success = this.ReadTabGrp(parent, current);
      else if (elementName === 'tuplet') success = this.ReadTuplet(parent, current);
      else if (elementName === 'volta') success = this.ReadVolta(parent, current);
      else if (elementName === 'verse') success = this.ReadVerse(parent, current);
      else if (elementName === 'refrain') success = this.ReadRefrain(parent, current);
      else if (elementName === '') success = this.ReadXMLComment(parent, current);
      else LogWarning("Unsupported '<%s>' within <layer>", elementName);
    }
    return success;
  }

  public ReadTupletSpanAsTuplet(measure: Measure | null, tupletSpan: xml_node): boolean {
    if (!measure) {
      LogWarning('Cannot read <tupletSpan> within editorial markup');
      return false;
    }

    const tuplet = new Tuplet();
    this.SetMeiID(tupletSpan, tuplet);

    let start: LayerElement | null = null;
    let end: LayerElement | null = null;

    // C++ reads att.labelled/typed/duration.ratio/tuplet.vis attribute by
    // attribute; readAttrs covers the same set through AttModule.Set* (union
    // of groups), keeping the typed default override below.
    readAttrs(tuplet, tupletSpan);
    if (tupletSpan.attribute('type').empty()) tuplet.SetType('tupletSpan');

    if (!tupletSpan.attribute('startid').empty()) {
      const refId = ExtractIDFragment(tupletSpan.attribute('startid').value());
      start = measure.FindDescendantByID(refId) as LayerElement | null;
      if (!start) LogWarning("Element with @startid '%s' not found when trying to read the <tupletSpan>", refId);
    }
    if (!tupletSpan.attribute('endid').empty()) {
      const refId = ExtractIDFragment(tupletSpan.attribute('endid').value());
      end = measure.FindDescendantByID(refId) as LayerElement | null;
      if (!end) LogWarning("Element with @endid '%s' not found when trying to read the <tupletSpan>", refId);
    }
    if (!start || !end) return false;

    const startChild = start.GetLastAncestorNot(ClassId.LAYER) as LayerElement | null;
    const endChild = end.GetLastAncestorNot(ClassId.LAYER) as LayerElement | null;

    if (!startChild || !endChild || (startChild.GetParent() !== endChild.GetParent())) {
      LogWarning("Start and end elements for <tupletSpan> '%s' not in the same layer", tuplet.GetID());
      return false;
    }

    const parentLayer = startChild.GetParent() as Layer;
    const startIdx = startChild.GetIdx();
    const endIdx = endChild.GetIdx();
    for (let i = endIdx; i >= startIdx; --i) {
      const element = parentLayer.DetachChild(i) as LayerElement | null;
      if (element) tuplet.InsertChild(element, 0);
    }
    parentLayer.InsertChild(tuplet, startIdx);
    return true;
  }

  public ReadEnding(parent: VrvObject, ending: xml_node): boolean {
    const vrvEnding = new Ending();
    this.ReadSystemElement(ending, vrvEnding);
    readAttrs(vrvEnding, ending);

    parent.AddChild(vrvEnding);
    this.ReadUnsupportedAttr(ending, vrvEnding);
    if (this.m_readingScoreBased) {
      return this.ReadSectionChildren(vrvEnding, ending);
    }
    return true;
  }

  public ReadExpansion(parent: VrvObject, expansion: xml_node): boolean {
    const vrvExpansion = new Expansion();
    this.ReadSystemElement(expansion, vrvExpansion);
    this.ReadPlistInterface(expansion, vrvExpansion);
    readAttrs(vrvExpansion, expansion);

    parent.AddChild(vrvExpansion);
    this.ReadUnsupportedAttr(expansion, vrvExpansion);
    if (this.m_readingScoreBased) {
      return this.ReadSectionChildren(vrvExpansion, expansion);
    }
    return true;
  }

  public ReadPb(parent: VrvObject, pb: xml_node): boolean {
    this.m_layoutInformation = LayoutInformation.LAYOUT_ENCODED;

    const vrvPb = new Pb();
    this.ReadSystemElement(pb, vrvPb);
    this.ReadFacsimileInterface(pb, vrvPb);
    readAttrs(vrvPb, pb);

    parent.AddChild(vrvPb);
    this.ReadUnsupportedAttr(pb, vrvPb);
    return true;
  }

  public ReadSb(parent: VrvObject, sb: xml_node): boolean {
    this.m_layoutInformation = LayoutInformation.LAYOUT_ENCODED;

    const vrvSb = new Sb();
    this.ReadSystemElement(sb, vrvSb);
    this.ReadFacsimileInterface(sb, vrvSb);
    readAttrs(vrvSb, sb);

    parent.AddChild(vrvSb);
    this.ReadUnsupportedAttr(sb, vrvSb);
    return true;
  }

  public ReadScoreDefElement(element: xml_node, object: ScoreDefElement): boolean {
    this.SetMeiID(element, object);
    readAttrs(object, element);

    if (this.m_meiversion <= MEIVERSION_5_0) {
      this.UpgradeScoreDefElementTo_5_0(element);
    }

    const cleffingLog = new InstCleffingLog();
    cleffingLog.ReadCleffingLog(element);
    const cleffingVis = new InstCleffingVis();
    cleffingVis.ReadCleffingVis(element);
    if (cleffingLog.HasClefShape()) {
      const vrvClef = new Clef();
      vrvClef.SetAttribute(true);
      vrvClef.SetShape(cleffingLog.GetClefShape());
      vrvClef.SetLine(cleffingLog.GetClefLine());
      vrvClef.SetDis(cleffingLog.GetClefDis());
      vrvClef.SetDisPlace(cleffingLog.GetClefDisPlace());
      vrvClef.SetColor(cleffingVis.GetClefColor());
      vrvClef.SetVisible(cleffingVis.GetClefVisible());
      object.AddChild(vrvClef);
    }

    const keySigDefaultAnl = new InstKeySigDefaultAnl();
    keySigDefaultAnl.ReadKeySigDefaultAnl(element);
    const keySigDefaultLog = new InstKeySigDefaultLog();
    keySigDefaultLog.ReadKeySigDefaultLog(element);
    const keySigDefaultVis = new InstKeySigDefaultVis();
    keySigDefaultVis.ReadKeySigDefaultVis(element);
    if (keySigDefaultAnl.HasKeyAccid() || keySigDefaultAnl.HasKeyMode() || keySigDefaultAnl.HasKeyPname()
      || keySigDefaultLog.HasKeysig() || keySigDefaultVis.HasKeysigVisible()
      || keySigDefaultVis.HasKeysigCancelaccid()) {
      const vrvKeySig = new KeySig();
      vrvKeySig.SetAttribute(true);
      vrvKeySig.SetMode(keySigDefaultAnl.GetKeyMode());
      vrvKeySig.SetPname(keySigDefaultAnl.GetKeyPname());
      vrvKeySig.SetSig(keySigDefaultLog.GetKeysig());
      vrvKeySig.SetVisible(keySigDefaultVis.GetKeysigVisible());
      vrvKeySig.SetCancelaccid(keySigDefaultVis.GetKeysigCancelaccid());
      object.AddChild(vrvKeySig);
    }

    const mensuralLog = new InstMensuralLog();
    mensuralLog.ReadMensuralLog(element);
    const mensuralShared = new InstMensuralShared();
    mensuralShared.ReadMensuralShared(element);
    const mensuralVis = new InstMensuralVis();
    mensuralVis.ReadMensuralVis(element);
    if (mensuralShared.HasProlatio() || mensuralShared.HasTempus() || mensuralLog.HasProportNum()
      || mensuralLog.HasProportNumbase() || mensuralVis.HasMensurSign()) {
      const vrvMensur = new Mensur();
      vrvMensur.SetAttribute(true);
      vrvMensur.SetDot(mensuralVis.GetMensurDot());
      vrvMensur.SetNum(mensuralLog.GetProportNum());
      vrvMensur.SetNumbase(mensuralLog.GetProportNumbase());
      vrvMensur.SetSign(mensuralVis.GetMensurSign());
      vrvMensur.SetSlash(mensuralVis.GetMensurSlash());
      vrvMensur.SetModusmaior(mensuralShared.GetModusmaior());
      vrvMensur.SetModusminor(mensuralShared.GetModusminor());
      vrvMensur.SetProlatio(mensuralShared.GetProlatio());
      vrvMensur.SetTempus(mensuralShared.GetTempus());
      vrvMensur.SetColor(mensuralVis.GetMensurColor());
      vrvMensur.SetOrient(mensuralVis.GetMensurOrient());

      if (this.m_meiversion < MEIVERSION_5_0) {
        this.UpgradeMensurTo_5_0(element, vrvMensur);
      }

      object.AddChild(vrvMensur);
    }

    const meterSigDefaultLog = new InstMeterSigDefaultLog();
    meterSigDefaultLog.ReadMeterSigDefaultLog(element);
    const meterSigDefaultVis = new InstMeterSigDefaultVis();
    meterSigDefaultVis.ReadMeterSigDefaultVis(element);
    if (meterSigDefaultLog.HasMeterCount() || meterSigDefaultLog.HasMeterSym() || meterSigDefaultLog.HasMeterUnit()) {
      const vrvMeterSig = new MeterSig();
      vrvMeterSig.SetAttribute(true);
      vrvMeterSig.SetCount(meterSigDefaultLog.GetMeterCount());
      vrvMeterSig.SetSym(meterSigDefaultLog.GetMeterSym());
      vrvMeterSig.SetUnit(meterSigDefaultLog.GetMeterUnit());
      vrvMeterSig.SetForm(meterSigDefaultVis.GetMeterForm());
      vrvMeterSig.SetVisible(meterSigDefaultVis.GetMeterVisible());
      object.AddChild(vrvMeterSig);
    }

    return true;
  }

  public ReadSystemElement(element: xml_node, object: VrvObject): boolean {
    this.SetMeiID(element, object);
    readAttrs(object, element);
    return true;
  }

  public ReadControlElement(element: xml_node, object: VrvObject): boolean {
    this.SetMeiID(element, object);
    this.ReadAltSymInterface(element, object);
    this.ReadLinkingInterface(element, object);
    this.ReadOffsetInterface(element, object);
    readAttrs(object, element);
    return true;
  }

  public ReadLayerElement(element: xml_node, object: VrvObject): boolean {
    this.SetMeiID(element, object);
    this.ReadFacsimileInterface(element, object);
    this.ReadLinkingInterface(element, object);
    readAttrs(object, element);

    const doc = this.getDoc();
    if (doc.IsTranscription() && (this.m_meiversion === MEIVERSION_2013)) {
      this.UpgradeLayerElementTo_5_0(element);
    }

    if (!element.attribute('coord.x1').empty() && doc.IsTranscription()) {
      const coordAttr = element.attribute('coord.x1');
      const val = parseFloat(coordAttr.value()) || 0;
      (object as unknown as { m_drawingFacsX: number }).m_drawingFacsX = val * DEFINITION_FACTOR;
    }

    return true;
  }

  public ReadEditorialElement(element: xml_node, object: EditorialElement): boolean;
  public ReadEditorialElement(parent: VrvObject, current: xml_node, level: EditorialLevel, filter?: VrvObject | null): boolean;
  public ReadEditorialElement(
    first: xml_node | VrvObject,
    second: EditorialElement | xml_node,
    level?: EditorialLevel,
    _filter?: VrvObject | null,
  ): boolean {
    if (first instanceof xml_node) {
      const element = first;
      const object = second as EditorialElement;
      this.SetMeiID(element, object);
      if (this.m_deserializing) {
        if (!element.attribute(VEROVIO_SERIALIZATION).empty()) {
          const v = element.attribute(VEROVIO_SERIALIZATION).value();
          if (v === 'hidden') object.SetVisibility(VisibilityType.Hidden);
          element.remove_attribute(VEROVIO_SERIALIZATION);
        }
      }
      readAttrs(object, element);
      return true;
    }

    // Editorial container dispatch — C++ MEIInput::ReadEditorialElement(parent,...)
    // (iomei.cpp:8152-8209), 17 names, same order.
    const parent = first as VrvObject;
    const current = second as xml_node;
    const lvl = level ?? EditorialLevel.EDITORIAL_UNDEFINED;
    switch (current.name()) {
      case 'abbr': return this.ReadAbbr(parent, current, lvl, _filter ?? null);
      case 'add': return this.ReadAdd(parent, current, lvl, _filter ?? null);
      case 'app': return this.ReadApp(parent, current, lvl, _filter ?? null);
      case 'annot': return this.ReadAnnot(parent, current);
      case 'choice': return this.ReadChoice(parent, current, lvl, _filter ?? null);
      case 'corr': return this.ReadCorr(parent, current, lvl, _filter ?? null);
      case 'damage': return this.ReadDamage(parent, current, lvl, _filter ?? null);
      case 'del': return this.ReadDel(parent, current, lvl, _filter ?? null);
      case 'expan': return this.ReadExpan(parent, current, lvl, _filter ?? null);
      case 'orig': return this.ReadOrig(parent, current, lvl, _filter ?? null);
      case 'ref': return this.ReadRef(parent, current, lvl, _filter ?? null);
      case 'reg': return this.ReadReg(parent, current, lvl, _filter ?? null);
      case 'restore': return this.ReadRestore(parent, current, lvl, _filter ?? null);
      case 'sic': return this.ReadSic(parent, current, lvl, _filter ?? null);
      case 'subst': return this.ReadSubst(parent, current, lvl, _filter ?? null);
      case 'supplied': return this.ReadSupplied(parent, current, lvl, _filter ?? null);
      case 'unclear': return this.ReadUnclear(parent, current, lvl, _filter ?? null);
      default:
        // C++: assert(false); s_editorialElementNames would be out of sync.
        LogWarning("Unsupported editorial element '<%s>'", current.name());
        return false;
    }
  }

  public ReadTextLayoutElement(element: xml_node, object: VrvObject): boolean {
    this.SetMeiID(element, object);
    readAttrs(object, element);
    return true;
  }

  public ReadRunningElement(element: xml_node, object: VrvObject): boolean {
    this.ReadTextLayoutElement(element, object);
    readAttrs(object, element);

    if (this.m_deserializing) {
      if (!element.attribute(VEROVIO_SERIALIZATION).empty()) {
        const v = element.attribute(VEROVIO_SERIALIZATION).value();
        if (v === 'generated') (object as unknown as { IsGenerated(v: boolean): void }).IsGenerated(true);
        element.remove_attribute(VEROVIO_SERIALIZATION);
      }
    }
    return true;
  }

  public ReadTextElement(element: xml_node, object: VrvObject): boolean {
    this.SetMeiID(element, object);
    readAttrs(object, element);
    return true;
  }

  public ReadAltSymInterface(element: xml_node, object: VrvObject): boolean {
    readAttrs(object, element);
    return true;
  }

  public ReadAreaPosInterface(element: xml_node, object: VrvObject): boolean {
    readAttrs(object, element);
    return true;
  }

  public ReadDurationInterface(element: xml_node, object: VrvObject): boolean {
    readAttrs(object, element);
    // C++ iomei.cpp MEIInput::ReadDurationInterface calls
    // interface->ReadFermataPresent(element): @fermata on chord/note/rest
    // must be parsed here (generic readAttrs does not cover att.fermataPresent).
    if (!element.attribute('fermata').empty()) {
      const conv = new AttConverterBase() as unknown as {
        StrToStaffrelBasic(v: string): number;
      };
      const dur = (object as unknown as { SetFermata?(v: number): void });
      if (typeof dur.SetFermata === 'function') {
        dur.SetFermata(conv.StrToStaffrelBasic(element.attribute('fermata').value()));
        element.remove_attribute('fermata');
      }
    }
    const dur = (object as unknown as { HasFermata?(): boolean });
    if (typeof dur.HasFermata === 'function' && dur.HasFermata()) {
      this.getDoc().SetMarkup(MARKUP_ANALYTICAL_FERMATA);
    }
    return true;
  }

  public ReadLinkingInterface(element: xml_node, object: VrvObject): boolean {
    readAttrs(object, element);
    return true;
  }

  public ReadFacsimileInterface(element: xml_node, object: VrvObject): boolean {
    readAttrs(object, element);
    return true;
  }

  public ReadOffsetInterface(element: xml_node, object: VrvObject): boolean {
    readAttrs(object, element);
    return true;
  }

  public ReadOffsetSpanningInterface(element: xml_node, object: VrvObject): boolean {
    readAttrs(object, element);
    return true;
  }

  public ReadPitchInterface(element: xml_node, object: VrvObject): boolean {
    readAttrs(object, element);
    return true;
  }

  public ReadPlistInterface(element: xml_node, object: VrvObject): boolean {
    readAttrs(object, element);
    return true;
  }

  public ReadPositionInterface(element: xml_node, object: VrvObject): boolean {
    readAttrs(object, element);
    return true;
  }

  public ReadScoreDefInterface(element: xml_node, object: VrvObject): boolean {
    readAttrs(object, element);
    return true;
  }

  public ReadTextDirInterface(element: xml_node, object: VrvObject): boolean {
    readAttrs(object, element);
    return true;
  }

  public ReadTimePointInterface(element: xml_node, object: VrvObject): boolean {
    readAttrs(object, element);
    return true;
  }

  public ReadTimeSpanningInterface(element: xml_node, object: VrvObject): boolean {
    this.ReadTimePointInterface(element, object);
    readAttrs(object, element);
    return true;
  }

  public ReadAccidAttr(node: xml_node, object: VrvObject): void {
    const accidental = new InstAccidental();
    accidental.ReadAccidental(node);
    const accidentalGestural = new InstAccidentalGes();
    accidentalGestural.ReadAccidentalGes(node);
    if (accidental.HasAccid() || accidentalGestural.HasAccidGes()) {
      const vrvAccid = new Accid();
      vrvAccid.SetAttribute(true);
      vrvAccid.SetAccid(accidental.GetAccid());
      vrvAccid.SetAccidGes(accidentalGestural.GetAccidGes());
      object.AddChild(vrvAccid);
    }
  }

  public UpgradeScoreDefElementTo_5_0(scoreDefElement: xml_node): void {
    const sigAttr = scoreDefElement.attribute('key.sig');
    if (!sigAttr.empty()) {
      sigAttr.set_name('keysig');
    }

    const showChangeAttr = scoreDefElement.attribute('keysig.showchange');
    if (!showChangeAttr.empty()) {
      const showchange = showChangeAttr.value() === 'true' ? BOOLEAN_true : BOOLEAN_false;
      showChangeAttr.set_name('keysig.cancelaccid');
      showChangeAttr.set_value(showchange === BOOLEAN_true ? 'before' : 'none');
    }

    const meterFormAttr = scoreDefElement.attribute('meter.form');
    if (!meterFormAttr.empty()) {
      if (meterFormAttr.value() === 'invis') {
        scoreDefElement.remove_attribute('meter.form');
        scoreDefElement.append_attribute('meter.visible').set_value('false');
      }
    }

    const keySigShowAttr = scoreDefElement.attribute('keysig.show');
    if (!keySigShowAttr.empty()) {
      keySigShowAttr.set_name('keysig.visible');
    }
  }

  public UpgradeMensurTo_5_0(_mensurNode: xml_node, vrvMensur: Mensur): void {
    if (vrvMensur.HasTempus() && !vrvMensur.HasSign()) {
      vrvMensur.SetSign(vrvMensur.GetTempus() === TEMPUS_3 ? MENSURATIONSIGN_O : MENSURATIONSIGN_C);
    }
    if (vrvMensur.HasProlatio() && !vrvMensur.HasDot()) {
      vrvMensur.SetDot(vrvMensur.GetProlatio() === PROLATIO_3 ? BOOLEAN_true : BOOLEAN_false);
    }
  }

  public UpgradeLayerElementTo_5_0(element: xml_node): void {
    const facs = element.attribute('facs');
    if (!facs.empty()) {
      facs.set_name('facs.extended');
    }
  }

  public IsAllowed(element: string, filterParent: VrvObject | null): boolean {
    if (!filterParent || element === '') return true;
    if (this.IsEditorialElementName(element)) {
      if (filterParent.Is(ClassId.LABEL) && element === 'annot') return false;
      if (filterParent.Is(ClassId.LABELABBR) && element === 'annot') return false;
      return true;
    }
    if (filterParent.Is(ClassId.ANNOT)) return element === '';
    if (filterParent.Is(ClassId.DYNAM)) return element === '' || element === 'lb' || element === 'rend';
    if (filterParent.IsAnyOf([ClassId.DIR, ClassId.ORNAM, ClassId.REPEATMARK, ClassId.TEMPO])) {
      return element === '' || element === 'lb' || element === 'rend' || element === 'symbol';
    }
    if (filterParent.Is(ClassId.FIG)) return element === 'svg';
    if (filterParent.Is(ClassId.FIGURE)) return element === '';
    if (filterParent.Is(ClassId.NUM)) return element === '';
    if (filterParent.Is(ClassId.HARM)) return element === '' || element === 'rend' || element === 'fb';
    if (filterParent.Is(ClassId.REND)) {
      return element === '' || element === 'lb' || element === 'num' || element === 'rend' || element === 'symbol';
    }
    if (filterParent.IsControlElement()) return element === '' || element === 'rend';
    if (filterParent.IsRunningElement() || filterParent.Is(ClassId.DIV)) return element === 'fig' || element === 'rend';
    return true;
  }

  public SetMeiID(element: xml_node, object: VrvObject): void {
    if (this.m_comment !== '') {
      (object as unknown as { SetComment(v: string): void }).SetComment(this.m_comment);
      this.m_comment = '';
    }
    if (element.attribute('xml:id').empty()) return;
    object.SetID(element.attribute('xml:id').value());
    element.remove_attribute('xml:id');
  }

  public StrToDocType(type: string): DocType {
    if (type === 'raw') return DocType.Raw;
    if (type === 'rendering') return DocType.Rendering;
    if (type === 'transcription') return DocType.Transcription;
    if (type === 'facsimile') return DocType.Facs;
    LogWarning("Unknown layout type '%s'", type);
    return DocType.Raw;
  }

  public LeftTrim(str: string): string { return str.replace(/^[\s\uFEFF\xA0]+/, ''); }
  public RightTrim(str: string): string { return str.replace(/[\s\uFEFF\xA0]+$/, ''); }

  public ReadXMLComment(object: VrvObject, element: xml_node): boolean {
    if (!element.next_sibling().empty()) {
      this.m_comment = element.value();
    }
    else {
      (object as unknown as { SetClosingComment(v: string): void }).SetClosingComment(element.value());
    }
    return true;
  }

  public IsAnnotScore(annot: xml_node): boolean {
    const value = annot.attribute('type').value();
    return /(^|\s)score($|\s)/.test(value);
  }

  public IsEditorialElementName(name: string): boolean {
    return s_editorialElementNames.includes(name);
  }

  public NormalizeAttributes(element: xml_node): void {
    for (const attr of element.attributes() as Iterable<{ name(): string; value(): string; set_value(v: string): boolean }>) {
      const a = attr as { name(): string; value(): string; set_value(v: string): boolean };
      a.set_value(a.value().replace(/^ +/, '').replace(/ +$/, ''));
    }
  }

  // ---- Pass 377: leaf readers (scoreDef/staffDef children, measure content, ----
  // ---- layer content, control elements, text elements, editorial markup).  ----
  // Ported verbatim from src-cpp/src/iomei.cpp. The C++ per-element
  // `vrvX->ReadAttGroup(node)` facade calls are covered by one readAttrs()
  // pass per element (union over the 22 AttModule groups, gated by the
  // object's registered att classes — behaviourally identical because each
  // attribute name belongs to exactly one group per element).

  public ReadGrpSym(parent: VrvObject, grpSym: xml_node): boolean {
    const vrvGrpSym = new GrpSym();
    this.SetMeiID(grpSym, vrvGrpSym);
    readAttrs(vrvGrpSym, grpSym);

    if (parent.Is(ClassId.SCOREDEF)) {
      if (!vrvGrpSym.HasLevel() || !vrvGrpSym.HasStartid() || !vrvGrpSym.HasEndid()) {
        LogWarning("<%s>' nested under <scoreDef> must have @level, @startId and @endId attributes", grpSym.name());
        return true;
      }
    }

    parent.AddChild(vrvGrpSym);
    this.ReadUnsupportedAttr(grpSym, vrvGrpSym);
    return true;
  }

  public ReadPgFoot(parent: VrvObject, pgFoot: xml_node): boolean {
    const vrvPgFoot = new PgFoot();
    this.ReadRunningElement(pgFoot, vrvPgFoot);

    parent.AddChild(vrvPgFoot);
    this.ReadUnsupportedAttr(pgFoot, vrvPgFoot);
    return this.ReadRunningChildren(vrvPgFoot, pgFoot, vrvPgFoot);
  }

  public ReadPgHead(parent: VrvObject, pgHead: xml_node): boolean {
    const vrvPgHead = new PgHead();
    this.ReadRunningElement(pgHead, vrvPgHead);

    parent.AddChild(vrvPgHead);
    this.ReadUnsupportedAttr(pgHead, vrvPgHead);
    return this.ReadRunningChildren(vrvPgHead, pgHead, vrvPgHead);
  }

  public ReadDiv(parent: VrvObject, div: xml_node): boolean {
    const vrvDiv = new Div();
    this.ReadTextLayoutElement(div, vrvDiv);

    parent.AddChild(vrvDiv);
    this.ReadUnsupportedAttr(div, vrvDiv);
    return this.ReadRunningChildren(vrvDiv, div, vrvDiv);
  }

  public ReadRunningChildren(parent: VrvObject, parentNode: xml_node, filter: VrvObject | null): boolean {
    let success = true;
    for (let xmlElement = firstElementChild(parentNode); !xmlElement.empty(); xmlElement = nextElement(xmlElement.next_sibling())) {
      if (!success) break;
      this.NormalizeAttributes(xmlElement);
      const elementName = xmlElement.name();
      if (filter && !this.IsAllowed(elementName, filter)) {
        LogWarning("Element <%s> within <%s> is not supported and will be ignored ", elementName, filter.GetClassName());
        continue;
      }
      if (this.IsEditorialElementName(elementName)) {
        success = this.ReadEditorialElement(parent, xmlElement, EditorialLevel.EDITORIAL_RUNNING, filter);
      }
      else if (elementName === 'fig') success = this.ReadFig(parent, xmlElement);
      else if (elementName === 'rend') success = this.ReadRend(parent, xmlElement);
      else if (elementName === '') success = this.ReadXMLComment(parent, xmlElement);
      else LogWarning("Element <%s> is unknown and will be ignored", elementName);
    }
    return success;
  }

  public ReadSymbolTable(parent: VrvObject, symbolTable: xml_node): boolean {
    const vrvSymbolTable = new SymbolTable();
    this.SetMeiID(symbolTable, vrvSymbolTable);

    parent.AddChild(vrvSymbolTable);

    let success = true;
    // No need to have ReadSymbolTableChildren for this...
    for (let current = firstElementChild(symbolTable); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      const name = current.name();
      if (name === 'symbolDef') success = this.ReadSymbolDef(vrvSymbolTable, current);
      else if (name === '') success = this.ReadXMLComment(parent, current);
      else LogWarning("Unsupported '<%s>' within <symbolTable>", name);
    }

    this.ReadUnsupportedAttr(symbolTable, vrvSymbolTable);
    return success;
  }

  public ReadSymbolDef(parent: VrvObject, symbolDef: xml_node): boolean {
    const vrvSymbolDef = new SymbolDef();
    this.SetMeiID(symbolDef, vrvSymbolDef);

    parent.AddChild(vrvSymbolDef);
    this.ReadUnsupportedAttr(symbolDef, vrvSymbolDef);
    return this.ReadSymbolDefChildren(vrvSymbolDef, symbolDef, vrvSymbolDef);
  }

  public ReadSymbolDefChildren(parent: VrvObject, parentNode: xml_node, filter: VrvObject | null): boolean {
    let success = true;
    for (let xmlElement = firstElementChild(parentNode); !xmlElement.empty(); xmlElement = nextElement(xmlElement.next_sibling())) {
      if (!success) break;
      this.NormalizeAttributes(xmlElement);
      const elementName = xmlElement.name();
      if (filter && !this.IsAllowed(elementName, filter)) {
        LogWarning("Element <%s> within <%s> is not supported and will be ignored ", elementName, filter.GetClassName());
        continue;
      }
      else if (elementName === 'graphic') success = this.ReadGraphic(parent, xmlElement);
      else if (elementName === 'svg') success = this.ReadSvg(parent, xmlElement);
      else if (elementName === 'symbol') success = this.ReadSymbol(parent, xmlElement);
      else if (elementName === '') success = this.ReadXMLComment(parent, xmlElement);
      else LogWarning("Element <%s> is unknown and will be ignored", elementName);
    }
    return success;
  }

  public ReadGraphic(parent: VrvObject, graphic: xml_node): boolean {
    const vrvGraphic = new Graphic();
    this.SetMeiID(graphic, vrvGraphic);
    readAttrs(vrvGraphic, graphic);
    parent.AddChild(vrvGraphic);
    this.ReadUnsupportedAttr(graphic, vrvGraphic);
    return true;
  }

  public ReadInstrDef(parent: VrvObject, instrDef: xml_node): boolean {
    const vrvInstrDef = new InstrDef();
    this.SetMeiID(instrDef, vrvInstrDef);

    if (this.m_meiversion < MEIVERSION_4_0_0) {
      if (!instrDef.attribute('midi.volume').empty()) {
        const midiValue = instrDef.attribute('midi.volume').as_float();
        instrDef.attribute('midi.volume').set_value(StringFormat('%.2f%%', midiValue / 127 * 100));
      }
    }

    parent.AddChild(vrvInstrDef);
    readAttrs(vrvInstrDef, instrDef);

    return true;
  }

  public ReadLabel(parent: VrvObject, label: xml_node): boolean {
    const vrvLabel = new Label();
    this.SetMeiID(label, vrvLabel);

    parent.AddChild(vrvLabel);
    this.ReadUnsupportedAttr(label, vrvLabel);
    return this.ReadTextChildren(vrvLabel, label, vrvLabel);
  }

  public ReadLabelAbbr(parent: VrvObject, labelAbbr: xml_node): boolean {
    const vrvLabelAbbr = new LabelAbbr();
    this.SetMeiID(labelAbbr, vrvLabelAbbr);

    parent.AddChild(vrvLabelAbbr);
    this.ReadUnsupportedAttr(labelAbbr, vrvLabelAbbr);
    return this.ReadTextChildren(vrvLabelAbbr, labelAbbr, vrvLabelAbbr);
  }

  public ReadLayerDef(parent: VrvObject, layerDef: xml_node): boolean {
    const vrvLayerDef = new LayerDef();
    this.SetMeiID(layerDef, vrvLayerDef);
    readAttrs(vrvLayerDef, layerDef);

    parent.AddChild(vrvLayerDef);
    this.ReadUnsupportedAttr(layerDef, vrvLayerDef);
    return this.ReadLayerDefChildren(vrvLayerDef, layerDef);
  }

  public ReadLayerDefChildren(parent: VrvObject, parentNode: xml_node): boolean {
    let success = true;
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      const currentName = current.name();
      if (!success) break;
      else if (currentName === 'instrDef') success = this.ReadInstrDef(parent, current);
      else if (currentName === 'label') success = this.ReadLabel(parent, current);
      else if (currentName === 'labelAbbr') success = this.ReadLabelAbbr(parent, current);
      else if (currentName === '') success = this.ReadXMLComment(parent, current);
      else LogWarning("Unsupported '<%s>' within <layerDef>", currentName);
    }
    return success;
  }

  public ReadTuning(parent: VrvObject, tuning: xml_node): boolean {
    const vrvTuning = new Tuning();
    this.SetMeiID(tuning, vrvTuning);

    parent.AddChild(vrvTuning);
    readAttrs(vrvTuning, tuning);

    this.ReadUnsupportedAttr(tuning, vrvTuning);
    return this.ReadTuningChildren(vrvTuning, tuning);
  }

  public ReadTuningChildren(parent: VrvObject, parentNode: xml_node): boolean {
    let success = true;
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      else if (current.name() === 'course') success = this.ReadCourse(parent, current);
      else LogWarning("Unsupported '<%s>' within <tuning>", current.name());
    }
    return success;
  }

  public ReadCourse(parent: VrvObject, course: xml_node): boolean {
    const vrvCourse = new Course();
    this.SetMeiID(course, vrvCourse);

    parent.AddChild(vrvCourse);
    readAttrs(vrvCourse, course);

    this.ReadUnsupportedAttr(course, vrvCourse);
    return true;
  }

  public ReadClef(parent: VrvObject, clef: xml_node): boolean {
    const vrvClef = new Clef();
    this.ReadLayerElement(clef, vrvClef);

    this.ReadOffsetInterface(clef, vrvClef);
    readAttrs(vrvClef, clef);

    parent.AddChild(vrvClef);
    this.ReadUnsupportedAttr(clef, vrvClef);
    return true;
  }

  public ReadKeySig(parent: VrvObject, keySig: xml_node): boolean {
    const vrvKeySig = new KeySig();
    this.ReadLayerElement(keySig, vrvKeySig);

    if (this.m_meiversion <= MEIVERSION_5_0) {
      this.UpgradeKeySigTo_5_0(keySig);
    }

    readAttrs(vrvKeySig, keySig);

    parent.AddChild(vrvKeySig);
    this.ReadUnsupportedAttr(keySig, vrvKeySig);
    return this.ReadLayerChildren(vrvKeySig, keySig, vrvKeySig);
  }

  public ReadMensur(parent: VrvObject, mensur: xml_node): boolean {
    const vrvMensur = new Mensur();
    this.ReadLayerElement(mensur, vrvMensur);

    if (this.m_meiversion < MEIVERSION_4_0_0) {
      if (!mensur.attribute('size').empty()) {
        mensur.remove_attribute('size');
        mensur.append_attribute('cue').set_value('true');
      }
    }

    readAttrs(vrvMensur, mensur);

    if (this.m_meiversion < MEIVERSION_5_0) {
      this.UpgradeMensurTo_5_0(mensur, vrvMensur);
    }

    parent.AddChild(vrvMensur);
    this.ReadUnsupportedAttr(mensur, vrvMensur);
    return true;
  }

  public ReadMeterSig(parent: VrvObject, meterSig: xml_node): boolean {
    const vrvMeterSig = new MeterSig();
    this.ReadLayerElement(meterSig, vrvMeterSig);

    if (this.m_meiversion <= MEIVERSION_5_0) {
      this.UpgradeMeterSigTo_5_0(meterSig, vrvMeterSig);
    }

    readAttrs(vrvMeterSig, meterSig);

    parent.AddChild(vrvMeterSig);
    this.ReadUnsupportedAttr(meterSig, vrvMeterSig);
    return true;
  }

  public ReadMeterSigGrp(parent: VrvObject, meterSigGrp: xml_node): boolean {
    const vrvMeterSigGrp = new MeterSigGrp();
    this.ReadLayerElement(meterSigGrp, vrvMeterSigGrp);
    readAttrs(vrvMeterSigGrp, meterSigGrp);

    parent.AddChild(vrvMeterSigGrp);
    this.ReadUnsupportedAttr(meterSigGrp, vrvMeterSigGrp);
    return this.ReadMeterSigGrpChildren(vrvMeterSigGrp, meterSigGrp);
  }

  public ReadMeterSigGrpChildren(parent: VrvObject, parentNode: xml_node): boolean {
    let success = true;
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      else if (current.name() === 'meterSig') success = this.ReadMeterSig(parent, current);
      else if (current.name() === '') success = this.ReadXMLComment(parent, current);
      else LogWarning("Unsupported '<%s>' within <meterSigGrp>", current.name());
    }
    return success;
  }

  public ReadAccid(parent: VrvObject, accid: xml_node): boolean {
    const vrvAccid = new Accid();
    this.ReadLayerElement(accid, vrvAccid);

    this.ReadOffsetInterface(accid, vrvAccid);
    this.ReadPositionInterface(accid, vrvAccid);
    readAttrs(vrvAccid, accid);

    parent.AddChild(vrvAccid);
    this.ReadUnsupportedAttr(accid, vrvAccid);
    return true;
  }

  public ReadArtic(parent: VrvObject, artic: xml_node): boolean {
    const vrvArtic = new Artic();
    this.ReadLayerElement(artic, vrvArtic);

    this.ReadOffsetInterface(artic, vrvArtic);
    readAttrs(vrvArtic, artic);

    if (vrvArtic.GetArtic().length > 1) {
      this.getDoc().SetMarkup(MARKUP_ARTIC_MULTIVAL);
    }

    parent.AddChild(vrvArtic);
    this.ReadUnsupportedAttr(artic, vrvArtic);
    return true;
  }

  public ReadBarLine(parent: VrvObject, barLine: xml_node): boolean {
    const vrvBarLine = new BarLine();
    this.ReadLayerElement(barLine, vrvBarLine);

    readAttrs(vrvBarLine, barLine);

    parent.AddChild(vrvBarLine);
    this.ReadUnsupportedAttr(barLine, vrvBarLine);
    return true;
  }

  public ReadBeam(parent: VrvObject, beam: xml_node): boolean {
    const vrvBeam = new Beam();
    this.ReadLayerElement(beam, vrvBeam);

    readAttrs(vrvBeam, beam);

    parent.AddChild(vrvBeam);
    this.ReadUnsupportedAttr(beam, vrvBeam);
    return this.ReadLayerChildren(vrvBeam, beam, vrvBeam);
  }

  public ReadBeatRpt(parent: VrvObject, beatRpt: xml_node): boolean {
    const vrvBeatRpt = new BeatRpt();
    this.ReadLayerElement(beatRpt, vrvBeatRpt);

    readAttrs(vrvBeatRpt, beatRpt);

    if (this.m_meiversion < MEIVERSION_4_0_0) {
      this.UpgradeBeatRptTo_4_0_0(beatRpt, vrvBeatRpt);
    }

    parent.AddChild(vrvBeatRpt);
    this.ReadUnsupportedAttr(beatRpt, vrvBeatRpt);
    return true;
  }

  public ReadBTrem(parent: VrvObject, bTrem: xml_node): boolean {
    const vrvBTrem = new BTrem();
    this.ReadLayerElement(bTrem, vrvBTrem);

    readAttrs(vrvBTrem, bTrem);

    parent.AddChild(vrvBTrem);
    this.ReadUnsupportedAttr(bTrem, vrvBTrem);
    return this.ReadLayerChildren(vrvBTrem, bTrem, vrvBTrem);
  }

  public ReadChord(parent: VrvObject, chord: xml_node): boolean {
    const vrvChord = new Chord();
    this.ReadLayerElement(chord, vrvChord);

    if (this.m_meiversion < MEIVERSION_4_0_0) {
      if (!chord.attribute('size').empty()) {
        chord.remove_attribute('size');
        chord.append_attribute('cue').set_value('true');
      }
    }

    this.ReadDurationInterface(chord, vrvChord);
    readAttrs(vrvChord, chord);

    const artic = new InstArticulation();
    artic.ReadArticulation(chord);
    if (artic.HasArtic()) {
      const vrvArtic = new Artic();
      vrvArtic.SetAttribute(true);
      vrvArtic.SetArtic(artic.GetArtic());
      vrvChord.AddChild(vrvArtic);
    }

    if (vrvChord.HasTie()) {
      this.getDoc().SetMarkup(MARKUP_ANALYTICAL_TIE);
    }

    parent.AddChild(vrvChord);
    this.ReadUnsupportedAttr(chord, vrvChord);
    return this.ReadLayerChildren(vrvChord, chord, vrvChord);
  }

  public ReadCustos(parent: VrvObject, custos: xml_node): boolean {
    const vrvCustos = new Custos();
    this.ReadLayerElement(custos, vrvCustos);

    this.ReadFacsimileInterface(custos, vrvCustos);
    this.ReadOffsetInterface(custos, vrvCustos);
    this.ReadPitchInterface(custos, vrvCustos);
    this.ReadPositionInterface(custos, vrvCustos);
    readAttrs(vrvCustos, custos);

    this.ReadAccidAttr(custos, vrvCustos);

    parent.AddChild(vrvCustos);
    this.ReadUnsupportedAttr(custos, vrvCustos);
    return this.ReadLayerChildren(vrvCustos, custos, vrvCustos);
  }

  public ReadDivLine(parent: VrvObject, divLine: xml_node): boolean {
    const vrvDivLine = new DivLine();
    this.ReadLayerElement(divLine, vrvDivLine);

    this.ReadOffsetInterface(divLine, vrvDivLine);
    readAttrs(vrvDivLine, divLine);

    parent.AddChild(vrvDivLine);
    this.ReadUnsupportedAttr(divLine, vrvDivLine);
    return true;
  }

  public ReadDot(parent: VrvObject, dot: xml_node): boolean {
    const vrvDot = new Dot();
    this.ReadLayerElement(dot, vrvDot);

    this.ReadOffsetInterface(dot, vrvDot);
    this.ReadPositionInterface(dot, vrvDot);
    readAttrs(vrvDot, dot);

    parent.AddChild(vrvDot);
    this.ReadUnsupportedAttr(dot, vrvDot);
    return true;
  }

  public ReadFTrem(parent: VrvObject, fTrem: xml_node): boolean {
    const vrvFTrem = new FTrem();
    this.ReadLayerElement(fTrem, vrvFTrem);

    if (this.m_meiversion < MEIVERSION_4_0_0) {
      this.UpgradeFTremTo_4_0_0(fTrem, vrvFTrem);
    }

    readAttrs(vrvFTrem, fTrem);

    parent.AddChild(vrvFTrem);
    this.ReadUnsupportedAttr(fTrem, vrvFTrem);
    return this.ReadLayerChildren(vrvFTrem, fTrem, vrvFTrem);
  }

  public ReadGenericLayerElement(parent: VrvObject, element: xml_node): boolean {
    const vrvElement = new GenericLayerElement(element.name());
    this.ReadLayerElement(element, vrvElement);

    // Store the content as a string document
    const content = new xml_document();
    content.append_copy(element);
    vrvElement.SetContent(content.save_string('  '));

    parent.AddChild(vrvElement);
    this.ReadUnsupportedAttr(element, vrvElement);
    return true;
  }

  public ReadGraceGrp(parent: VrvObject, graceGrp: xml_node): boolean {
    const vrvGraceGrp = new GraceGrp();
    this.ReadLayerElement(graceGrp, vrvGraceGrp);

    readAttrs(vrvGraceGrp, graceGrp);

    parent.AddChild(vrvGraceGrp);
    this.ReadUnsupportedAttr(graceGrp, vrvGraceGrp);
    return this.ReadLayerChildren(vrvGraceGrp, graceGrp, vrvGraceGrp);
  }

  public ReadHalfmRpt(parent: VrvObject, halfmRpt: xml_node): boolean {
    const vrvHalfmRpt = new HalfmRpt();
    this.ReadLayerElement(halfmRpt, vrvHalfmRpt);

    this.ReadOffsetInterface(halfmRpt, vrvHalfmRpt);
    readAttrs(vrvHalfmRpt, halfmRpt);

    parent.AddChild(vrvHalfmRpt);
    this.ReadUnsupportedAttr(halfmRpt, vrvHalfmRpt);
    return true;
  }

  public ReadKeyAccid(parent: VrvObject, keyAccid: xml_node): boolean {
    const vrvKeyAccid = new KeyAccid();
    this.ReadLayerElement(keyAccid, vrvKeyAccid);

    this.ReadPitchInterface(keyAccid, vrvKeyAccid);
    this.ReadPositionInterface(keyAccid, vrvKeyAccid);
    readAttrs(vrvKeyAccid, keyAccid);

    parent.AddChild(vrvKeyAccid);
    this.ReadUnsupportedAttr(keyAccid, vrvKeyAccid);
    return true;
  }

  public ReadLigature(parent: VrvObject, ligature: xml_node): boolean {
    const vrvLigature = new Ligature();
    this.ReadLayerElement(ligature, vrvLigature);

    readAttrs(vrvLigature, ligature);

    parent.AddChild(vrvLigature);
    this.ReadUnsupportedAttr(ligature, vrvLigature);
    return this.ReadLayerChildren(vrvLigature, ligature, vrvLigature);
  }

  public ReadLiquescent(parent: VrvObject, liquescent: xml_node): boolean {
    const vrvLiquescent = new Liquescent();
    this.ReadLayerElement(liquescent, vrvLiquescent);

    this.ReadOffsetInterface(liquescent, vrvLiquescent);
    this.ReadPositionInterface(liquescent, vrvLiquescent);
    readAttrs(vrvLiquescent, liquescent);

    parent.AddChild(vrvLiquescent);
    this.ReadUnsupportedAttr(liquescent, vrvLiquescent);
    return true;
  }

  public ReadMRest(parent: VrvObject, mRest: xml_node): boolean {
    const vrvMRest = new MRest();
    this.ReadLayerElement(mRest, vrvMRest);

    this.ReadOffsetInterface(mRest, vrvMRest);
    this.ReadPositionInterface(mRest, vrvMRest);

    if (this.m_meiversion < MEIVERSION_4_0_0) {
      if (!mRest.attribute('size').empty()) {
        mRest.remove_attribute('size');
        mRest.append_attribute('cue').set_value('true');
      }
    }

    readAttrs(vrvMRest, mRest);

    if (vrvMRest.HasFermata()) {
      this.getDoc().SetMarkup(MARKUP_ANALYTICAL_FERMATA);
    }

    if (this.m_meiversion < MEIVERSION_4_0_0) {
      // as mRest has no durationInterface we simply delete dur.ges on upgrade
      if (!mRest.attribute('dur.ges').empty()) mRest.remove_attribute('dur.ges');
    }

    parent.AddChild(vrvMRest);
    this.ReadUnsupportedAttr(mRest, vrvMRest);
    return true;
  }

  public ReadMRpt(parent: VrvObject, mRpt: xml_node): boolean {
    const vrvMRpt = new MRpt();
    this.ReadLayerElement(mRpt, vrvMRpt);

    readAttrs(vrvMRpt, mRpt);

    parent.AddChild(vrvMRpt);
    this.ReadUnsupportedAttr(mRpt, vrvMRpt);
    return true;
  }

  public ReadMRpt2(parent: VrvObject, mRpt2: xml_node): boolean {
    const vrvMRpt2 = new MRpt2();
    this.ReadLayerElement(mRpt2, vrvMRpt2);

    readAttrs(vrvMRpt2, mRpt2);

    parent.AddChild(vrvMRpt2);
    this.ReadUnsupportedAttr(mRpt2, vrvMRpt2);
    return true;
  }

  public ReadMSpace(parent: VrvObject, mSpace: xml_node): boolean {
    const vrvMSpace = new MSpace();
    this.ReadLayerElement(mSpace, vrvMSpace);

    parent.AddChild(vrvMSpace);
    this.ReadUnsupportedAttr(mSpace, vrvMSpace);
    return true;
  }

  public ReadMultiRest(parent: VrvObject, multiRest: xml_node): boolean {
    const vrvMultiRest = new MultiRest();
    this.ReadLayerElement(multiRest, vrvMultiRest);

    this.ReadPositionInterface(multiRest, vrvMultiRest);
    readAttrs(vrvMultiRest, multiRest);

    parent.AddChild(vrvMultiRest);
    this.ReadUnsupportedAttr(multiRest, vrvMultiRest);
    return true;
  }

  public ReadMultiRpt(parent: VrvObject, multiRpt: xml_node): boolean {
    const vrvMultiRpt = new MultiRpt();
    this.ReadLayerElement(multiRpt, vrvMultiRpt);

    readAttrs(vrvMultiRpt, multiRpt);

    parent.AddChild(vrvMultiRpt);
    this.ReadUnsupportedAttr(multiRpt, vrvMultiRpt);
    return true;
  }

  public ReadEpisema(parent: VrvObject, episema: xml_node): boolean {
    const vrvEpisema = new Episema();
    this.ReadLayerElement(episema, vrvEpisema);

    this.ReadOffsetInterface(episema, vrvEpisema);
    this.ReadPitchInterface(episema, vrvEpisema);
    this.ReadPositionInterface(episema, vrvEpisema);
    readAttrs(vrvEpisema, episema);

    parent.AddChild(vrvEpisema);
    return this.ReadLayerChildren(vrvEpisema, episema, vrvEpisema);
  }

  public ReadNc(parent: VrvObject, nc: xml_node): boolean {
    const vrvNc = new Nc();
    this.ReadLayerElement(nc, vrvNc);

    this.ReadDurationInterface(nc, vrvNc);
    this.ReadOffsetInterface(nc, vrvNc);
    this.ReadPitchInterface(nc, vrvNc);
    this.ReadPositionInterface(nc, vrvNc);
    readAttrs(vrvNc, nc);

    parent.AddChild(vrvNc);
    return this.ReadLayerChildren(vrvNc, nc, vrvNc);
  }

  public ReadNeume(parent: VrvObject, neume: xml_node): boolean {
    const vrvNeume = new Neume();
    this.ReadLayerElement(neume, vrvNeume);

    this.ReadOffsetInterface(neume, vrvNeume);
    readAttrs(vrvNeume, neume);

    parent.AddChild(vrvNeume);
    return this.ReadLayerChildren(vrvNeume, neume, vrvNeume);
  }

  public ReadNote(parent: VrvObject, note: xml_node): boolean {
    const vrvNote = new Note();
    this.ReadLayerElement(note, vrvNote);

    if (this.m_meiversion < MEIVERSION_4_0_0) {
      if (!note.attribute('size').empty()) {
        note.remove_attribute('size');
        note.append_attribute('cue').set_value('true');
      }
    }

    this.ReadAltSymInterface(note, vrvNote);
    this.ReadDurationInterface(note, vrvNote);
    this.ReadOffsetInterface(note, vrvNote);
    this.ReadPitchInterface(note, vrvNote);
    this.ReadPositionInterface(note, vrvNote);
    readAttrs(vrvNote, note);

    const artic = new InstArticulation();
    artic.ReadArticulation(note);
    if (artic.HasArtic()) {
      const vrvArtic = new Artic();
      vrvArtic.SetAttribute(true);
      vrvArtic.SetArtic(artic.GetArtic());
      if (artic.GetArtic().length > 1) {
        this.getDoc().SetMarkup(MARKUP_ARTIC_MULTIVAL);
      }
      vrvNote.AddChild(vrvArtic);
    }

    this.ReadAccidAttr(note, vrvNote);

    if (vrvNote.HasTie()) {
      this.getDoc().SetMarkup(MARKUP_ANALYTICAL_TIE);
    }

    parent.AddChild(vrvNote);
    this.ReadUnsupportedAttr(note, vrvNote);
    return this.ReadLayerChildren(vrvNote, note, vrvNote);
  }

  public ReadOriscus(parent: VrvObject, oriscus: xml_node): boolean {
    const vrvOriscus = new Oriscus();
    this.ReadLayerElement(oriscus, vrvOriscus);

    this.ReadOffsetInterface(oriscus, vrvOriscus);
    this.ReadPositionInterface(oriscus, vrvOriscus);
    readAttrs(vrvOriscus, oriscus);

    parent.AddChild(vrvOriscus);
    this.ReadUnsupportedAttr(oriscus, vrvOriscus);

    return true;
  }

  public ReadPlica(parent: VrvObject, plica: xml_node): boolean {
    const vrvPlica = new Plica();
    this.ReadLayerElement(plica, vrvPlica);

    readAttrs(vrvPlica, plica);

    parent.AddChild(vrvPlica);
    this.ReadUnsupportedAttr(plica, vrvPlica);
    return true;
  }

  public ReadProport(parent: VrvObject, proport: xml_node): boolean {
    const vrvProport = new Proport();
    this.ReadLayerElement(proport, vrvProport);

    readAttrs(vrvProport, proport);

    parent.AddChild(vrvProport);
    this.ReadUnsupportedAttr(proport, vrvProport);
    return true;
  }

  public ReadQuilisma(parent: VrvObject, quilisma: xml_node): boolean {
    const vrvQuilisma = new Quilisma();
    this.ReadLayerElement(quilisma, vrvQuilisma);

    this.ReadOffsetInterface(quilisma, vrvQuilisma);
    this.ReadPositionInterface(quilisma, vrvQuilisma);
    readAttrs(vrvQuilisma, quilisma);

    parent.AddChild(vrvQuilisma);
    this.ReadUnsupportedAttr(quilisma, vrvQuilisma);

    return true;
  }

  public ReadRest(parent: VrvObject, rest: xml_node): boolean {
    const vrvRest = new Rest();
    this.ReadLayerElement(rest, vrvRest);

    if (this.m_meiversion < MEIVERSION_4_0_0) {
      if (!rest.attribute('size').empty()) {
        rest.remove_attribute('size');
        rest.append_attribute('cue').set_value('true');
      }
    }

    this.ReadAltSymInterface(rest, vrvRest);
    this.ReadDurationInterface(rest, vrvRest);
    this.ReadOffsetInterface(rest, vrvRest);
    this.ReadPositionInterface(rest, vrvRest);
    readAttrs(vrvRest, rest);

    parent.AddChild(vrvRest);
    this.ReadUnsupportedAttr(rest, vrvRest);
    return this.ReadLayerChildren(vrvRest, rest, vrvRest);
  }

  public ReadSpace(parent: VrvObject, space: xml_node): boolean {
    const vrvSpace = new Space();
    this.ReadLayerElement(space, vrvSpace);

    this.ReadDurationInterface(space, vrvSpace);

    parent.AddChild(vrvSpace);
    this.ReadUnsupportedAttr(space, vrvSpace);
    return true;
  }

  public ReadStem(parent: VrvObject, stem: xml_node): boolean {
    const vrvStem = new Stem();
    this.ReadLayerElement(stem, vrvStem);

    readAttrs(vrvStem, stem);

    parent.AddChild(vrvStem);
    this.ReadUnsupportedAttr(stem, vrvStem);
    return true;
  }

  public ReadStrophicus(parent: VrvObject, strophicus: xml_node): boolean {
    const vrvStrophicus = new Strophicus();
    this.ReadLayerElement(strophicus, vrvStrophicus);

    this.ReadOffsetInterface(strophicus, vrvStrophicus);
    this.ReadPositionInterface(strophicus, vrvStrophicus);
    readAttrs(vrvStrophicus, strophicus);

    parent.AddChild(vrvStrophicus);
    this.ReadUnsupportedAttr(strophicus, vrvStrophicus);

    return true;
  }

  public ReadSyl(parent: VrvObject, syl: xml_node): boolean {
    // Add empty text node for empty syl element for invisible bbox in neume notation
    if (parent.GetParent() !== null && syl.first_child().empty() && this.getDoc().HasFacsimile() && this.getDoc().IsNeumeLines()) {
      syl.text().set('');
    }
    const vrvSyl = new Syl();
    this.ReadLayerElement(syl, vrvSyl);

    this.ReadFacsimileInterface(syl, vrvSyl);
    this.ReadOffsetInterface(syl, vrvSyl);
    readAttrs(vrvSyl, syl);

    parent.AddChild(vrvSyl);
    this.ReadUnsupportedAttr(syl, vrvSyl);
    return this.ReadTextChildren(vrvSyl, syl, vrvSyl);
  }

  public ReadSyllable(parent: VrvObject, syllable: xml_node): boolean {
    const vrvSyllable = new Syllable();
    this.ReadLayerElement(syllable, vrvSyllable);

    readAttrs(vrvSyllable, syllable);

    parent.AddChild(vrvSyllable);
    return this.ReadLayerChildren(vrvSyllable, syllable, vrvSyllable);
  }

  public ReadTabDurSym(parent: VrvObject, tabRhyhtm: xml_node): boolean {
    const vrvTabDurSym = new TabDurSym();
    this.ReadLayerElement(tabRhyhtm, vrvTabDurSym);

    readAttrs(vrvTabDurSym, tabRhyhtm);

    parent.AddChild(vrvTabDurSym);
    this.ReadUnsupportedAttr(tabRhyhtm, vrvTabDurSym);
    return true;
  }

  public ReadTabGrp(parent: VrvObject, tabGrp: xml_node): boolean {
    const vrvTabGrp = new TabGrp();
    this.ReadLayerElement(tabGrp, vrvTabGrp);

    this.ReadDurationInterface(tabGrp, vrvTabGrp);
    this.ReadOffsetInterface(tabGrp, vrvTabGrp);

    parent.AddChild(vrvTabGrp);
    this.ReadUnsupportedAttr(tabGrp, vrvTabGrp);
    return this.ReadLayerChildren(vrvTabGrp, tabGrp, vrvTabGrp);
  }

  public ReadTuplet(parent: VrvObject, tuplet: xml_node): boolean {
    const vrvTuplet = new Tuplet();
    this.ReadLayerElement(tuplet, vrvTuplet);

    readAttrs(vrvTuplet, tuplet);

    parent.AddChild(vrvTuplet);
    this.ReadUnsupportedAttr(tuplet, vrvTuplet);
    return this.ReadLayerChildren(vrvTuplet, tuplet, vrvTuplet);
  }

  public ReadVolta(parent: VrvObject, volta: xml_node): boolean {
    const vrvVolta = new Volta();
    this.ReadLayerElement(volta, vrvVolta);
    this.ReadOffsetInterface(volta, vrvVolta);

    readAttrs(vrvVolta, volta);

    parent.AddChild(vrvVolta);
    this.ReadUnsupportedAttr(volta, vrvVolta);
    return this.ReadLayerChildren(vrvVolta, volta, vrvVolta);
  }

  public ReadVerse(parent: VrvObject, verse: xml_node): boolean {
    const vrvVerse = new Verse();
    this.ReadLyricElement(verse, vrvVerse);
    readAttrs(vrvVerse, verse);

    parent.AddChild(vrvVerse);
    this.ReadUnsupportedAttr(verse, vrvVerse);
    return this.ReadLayerChildren(vrvVerse, verse, vrvVerse);
  }

  public ReadRefrain(parent: VrvObject, refrain: xml_node): boolean {
    const vrvRefrain = new Refrain();
    this.ReadLyricElement(refrain, vrvRefrain);
    readAttrs(vrvRefrain, refrain);

    parent.AddChild(vrvRefrain);
    this.ReadUnsupportedAttr(refrain, vrvRefrain);
    return this.ReadLayerChildren(vrvRefrain, refrain, vrvRefrain);
  }

  public ReadLyricElement(element: xml_node, lyricElement: VrvObject): void {
    this.ReadLayerElement(element, lyricElement);
    this.ReadOffsetInterface(element, lyricElement);
  }

  public ReadOssia(parent: VrvObject, ossia: xml_node): boolean {
    const vrvOssia = new Ossia();
    this.SetMeiID(ossia, vrvOssia);

    readAttrs(vrvOssia, ossia);

    parent.AddChild(vrvOssia);
    this.ReadUnsupportedAttr(ossia, vrvOssia);

    let success = true;
    for (let current = firstElementChild(ossia); !current.empty(); current = nextElement(current.next_sibling())) {
      const currentName = current.name();
      if (currentName === 'staff') {
        success = this.ReadStaff(vrvOssia, current);
      }
      else if (currentName === 'oStaff') {
        success = this.ReadOStaff(vrvOssia, current);
      }
    }

    // Check that we don't have encoding that we do not support
    if (!this.getDoc().GetOptions().m_ossiaHidden.GetValue()) {
      const staves = vrvOssia.FindAllDescendantsByType(ClassId.STAFF);
      for (const object of staves) {
        const staff = object as Staff;
        if (!staff.IsOssia()) continue;
        let hide = false;
        // Hide oStaff with no n (even if n="1" is added in ReadOStaff but for the sake of completeness)
        hide = !staff.HasN();
        // Hide oStaff with no layer
        hide = hide || !staff.FindDescendantByType(ClassId.LAYER);
        // Hide oStaff for which there is no corresponding staff
        hide = hide || !(vrvOssia as unknown as { GetOriginalStaffForOssia(s: Staff): unknown }).GetOriginalStaffForOssia(staff);
        if (hide) staff.SetVisibility(VisibilityType.Hidden);
      }
    }

    return success;
  }

  // ---- Control elements ----

  public ReadAnchoredText(parent: VrvObject, anchoredText: xml_node): boolean {
    const vrvAnchoredText = new AnchoredText();
    this.ReadControlElement(anchoredText, vrvAnchoredText);

    this.ReadTextDirInterface(anchoredText, vrvAnchoredText);

    this.ReadUnsupportedAttr(anchoredText, vrvAnchoredText);
    parent.AddChild(vrvAnchoredText);
    return this.ReadTextChildren(vrvAnchoredText, anchoredText, vrvAnchoredText);
  }

  public ReadArpeg(parent: VrvObject, arpeg: xml_node): boolean {
    const vrvArpeg = new Arpeg();
    this.ReadControlElement(arpeg, vrvArpeg);

    this.ReadPlistInterface(arpeg, vrvArpeg);
    this.ReadTimePointInterface(arpeg, vrvArpeg);
    readAttrs(vrvArpeg, arpeg);

    parent.AddChild(vrvArpeg);
    this.ReadUnsupportedAttr(arpeg, vrvArpeg);
    return true;
  }

  public ReadBeamSpan(parent: VrvObject, beamSpan: xml_node): boolean {
    const vrvBeamSpan = new BeamSpan();
    this.ReadControlElement(beamSpan, vrvBeamSpan);

    this.ReadPlistInterface(beamSpan, vrvBeamSpan);
    this.ReadTimeSpanningInterface(beamSpan, vrvBeamSpan);
    readAttrs(vrvBeamSpan, beamSpan);

    parent.AddChild(vrvBeamSpan);
    this.ReadUnsupportedAttr(beamSpan, vrvBeamSpan);
    return true;
  }

  public ReadBracketSpan(parent: VrvObject, bracketSpan: xml_node): boolean {
    const vrvBracketSpan = new BracketSpan();
    this.ReadControlElement(bracketSpan, vrvBracketSpan);

    this.ReadTimeSpanningInterface(bracketSpan, vrvBracketSpan);
    readAttrs(vrvBracketSpan, bracketSpan);

    parent.AddChild(vrvBracketSpan);
    this.ReadUnsupportedAttr(bracketSpan, vrvBracketSpan);
    return true;
  }

  public ReadBreath(parent: VrvObject, breath: xml_node): boolean {
    const vrvBreath = new Breath();
    this.ReadControlElement(breath, vrvBreath);

    this.ReadTimePointInterface(breath, vrvBreath);
    readAttrs(vrvBreath, breath);

    parent.AddChild(vrvBreath);
    this.ReadUnsupportedAttr(breath, vrvBreath);
    return true;
  }

  public ReadCaesura(parent: VrvObject, caesura: xml_node): boolean {
    const vrvCaesura = new Caesura();
    this.ReadControlElement(caesura, vrvCaesura);

    this.ReadTimePointInterface(caesura, vrvCaesura);
    readAttrs(vrvCaesura, caesura);

    parent.AddChild(vrvCaesura);
    this.ReadUnsupportedAttr(caesura, vrvCaesura);
    return true;
  }

  public ReadCpMark(parent: VrvObject, cpMark: xml_node): boolean {
    const vrvCpMark = new CpMark();
    this.ReadControlElement(cpMark, vrvCpMark);

    this.ReadTextDirInterface(cpMark, vrvCpMark);
    this.ReadTimeSpanningInterface(cpMark, vrvCpMark);

    parent.AddChild(vrvCpMark);
    this.ReadUnsupportedAttr(cpMark, vrvCpMark);
    return this.ReadTextChildren(vrvCpMark, cpMark, vrvCpMark);
  }

  public ReadDir(parent: VrvObject, dir: xml_node, isStageDir = false): boolean {
    const vrvDir = new Dir(isStageDir);
    this.ReadControlElement(dir, vrvDir);

    this.ReadTextDirInterface(dir, vrvDir);
    this.ReadTimeSpanningInterface(dir, vrvDir);
    readAttrs(vrvDir, dir);

    parent.AddChild(vrvDir);
    this.ReadUnsupportedAttr(dir, vrvDir);
    return this.ReadTextChildren(vrvDir, dir, vrvDir);
  }

  public ReadDynam(parent: VrvObject, dynam: xml_node): boolean {
    const vrvDynam = new Dynam();
    this.ReadControlElement(dynam, vrvDynam);

    this.ReadTextDirInterface(dynam, vrvDynam);
    this.ReadTimeSpanningInterface(dynam, vrvDynam);
    readAttrs(vrvDynam, dynam);

    parent.AddChild(vrvDynam);
    this.ReadUnsupportedAttr(dynam, vrvDynam);
    return this.ReadTextChildren(vrvDynam, dynam, vrvDynam);
  }

  public ReadFermata(parent: VrvObject, fermata: xml_node): boolean {
    const vrvFermata = new Fermata();
    this.ReadControlElement(fermata, vrvFermata);

    this.ReadTimePointInterface(fermata, vrvFermata);
    readAttrs(vrvFermata, fermata);

    parent.AddChild(vrvFermata);
    this.ReadUnsupportedAttr(fermata, vrvFermata);
    return true;
  }

  public ReadFing(parent: VrvObject, fing: xml_node): boolean {
    const vrvFing = new Fing();
    this.ReadControlElement(fing, vrvFing);

    this.ReadTextDirInterface(fing, vrvFing);
    this.ReadTimePointInterface(fing, vrvFing);
    readAttrs(vrvFing, fing);

    parent.AddChild(vrvFing);
    this.ReadUnsupportedAttr(fing, vrvFing);
    return this.ReadTextChildren(vrvFing, fing, vrvFing);
  }

  public ReadGliss(parent: VrvObject, gliss: xml_node): boolean {
    const vrvGliss = new Gliss();
    this.ReadControlElement(gliss, vrvGliss);

    this.ReadTimeSpanningInterface(gliss, vrvGliss);
    readAttrs(vrvGliss, gliss);

    parent.AddChild(vrvGliss);
    this.ReadUnsupportedAttr(gliss, vrvGliss);
    return true;
  }

  public ReadHairpin(parent: VrvObject, hairpin: xml_node): boolean {
    const vrvHairpin = new Hairpin();
    this.ReadControlElement(hairpin, vrvHairpin);

    this.ReadOffsetSpanningInterface(hairpin, vrvHairpin);
    this.ReadTimeSpanningInterface(hairpin, vrvHairpin);
    readAttrs(vrvHairpin, hairpin);

    parent.AddChild(vrvHairpin);
    this.ReadUnsupportedAttr(hairpin, vrvHairpin);
    return true;
  }

  public ReadHarm(parent: VrvObject, harm: xml_node): boolean {
    const vrvHarm = new Harm();
    this.ReadControlElement(harm, vrvHarm);

    this.ReadTextDirInterface(harm, vrvHarm);
    this.ReadTimeSpanningInterface(harm, vrvHarm);
    readAttrs(vrvHarm, harm);

    parent.AddChild(vrvHarm);
    this.ReadUnsupportedAttr(harm, vrvHarm);
    return this.ReadTextChildren(vrvHarm, harm, vrvHarm);
  }

  public ReadLv(parent: VrvObject, lv: xml_node): boolean {
    const vrvLv = new Lv();
    this.ReadControlElement(lv, vrvLv);

    this.ReadOffsetSpanningInterface(lv, vrvLv);
    this.ReadTimeSpanningInterface(lv, vrvLv);
    readAttrs(vrvLv, lv);

    parent.AddChild(vrvLv);
    this.ReadUnsupportedAttr(lv, vrvLv);
    return true;
  }

  public ReadMNum(parent: VrvObject, mNum: xml_node): boolean {
    const vrvMNum = new MNum();
    this.ReadControlElement(mNum, vrvMNum);

    this.ReadTextDirInterface(mNum, vrvMNum);
    this.ReadTimePointInterface(mNum, vrvMNum);
    readAttrs(vrvMNum, mNum);

    if (this.m_deserializing) {
      if (!mNum.attribute(VEROVIO_SERIALIZATION).empty()) {
        const verovioSerialization = mNum.attribute(VEROVIO_SERIALIZATION).value();
        if (verovioSerialization === 'generated') vrvMNum.IsGenerated(true);
        mNum.remove_attribute(VEROVIO_SERIALIZATION);
      }
    }

    parent.AddChild(vrvMNum);
    return this.ReadTextChildren(vrvMNum, mNum, vrvMNum);
  }

  public ReadMordent(parent: VrvObject, mordent: xml_node): boolean {
    const vrvMordent = new Mordent();
    this.ReadControlElement(mordent, vrvMordent);

    if (this.m_meiversion < MEIVERSION_4_0_0) {
      this.UpgradeMordentTo_4_0_0(mordent, vrvMordent);
    }

    this.ReadTimePointInterface(mordent, vrvMordent);
    readAttrs(vrvMordent, mordent);

    parent.AddChild(vrvMordent);
    this.ReadUnsupportedAttr(mordent, vrvMordent);
    return true;
  }

  public ReadOctave(parent: VrvObject, octave: xml_node): boolean {
    const vrvOctave = new Octave();
    this.ReadControlElement(octave, vrvOctave);

    this.ReadTimeSpanningInterface(octave, vrvOctave);
    readAttrs(vrvOctave, octave);

    parent.AddChild(vrvOctave);
    this.ReadUnsupportedAttr(octave, vrvOctave);
    return true;
  }

  public ReadOrnam(parent: VrvObject, ornam: xml_node): boolean {
    const vrvOrnam = new Ornam();
    this.ReadControlElement(ornam, vrvOrnam);

    this.ReadTextDirInterface(ornam, vrvOrnam);
    this.ReadTimePointInterface(ornam, vrvOrnam);
    readAttrs(vrvOrnam, ornam);

    parent.AddChild(vrvOrnam);
    this.ReadUnsupportedAttr(ornam, vrvOrnam);
    return this.ReadTextChildren(vrvOrnam, ornam, vrvOrnam);
  }

  public ReadPedal(parent: VrvObject, pedal: xml_node): boolean {
    const vrvPedal = new Pedal();
    this.ReadControlElement(pedal, vrvPedal);

    this.ReadTimeSpanningInterface(pedal, vrvPedal);
    readAttrs(vrvPedal, pedal);

    parent.AddChild(vrvPedal);
    this.ReadUnsupportedAttr(pedal, vrvPedal);
    return true;
  }

  public ReadPhrase(parent: VrvObject, phrase: xml_node): boolean {
    const vrvPhrase = new Phrase();
    this.ReadControlElement(phrase, vrvPhrase);

    this.ReadOffsetSpanningInterface(phrase, vrvPhrase);
    this.ReadTimeSpanningInterface(phrase, vrvPhrase);
    readAttrs(vrvPhrase, phrase);

    parent.AddChild(vrvPhrase);
    this.ReadUnsupportedAttr(phrase, vrvPhrase);
    return true;
  }

  public ReadPitchInflection(parent: VrvObject, pitchInflection: xml_node): boolean {
    const vrvPitchInflection = new PitchInflection();
    this.ReadControlElement(pitchInflection, vrvPitchInflection);

    this.ReadTimeSpanningInterface(pitchInflection, vrvPitchInflection);

    parent.AddChild(vrvPitchInflection);
    this.ReadUnsupportedAttr(pitchInflection, vrvPitchInflection);
    return true;
  }

  public ReadReh(parent: VrvObject, reh: xml_node): boolean {
    const vrvReh = new Reh();
    this.ReadControlElement(reh, vrvReh);

    this.ReadTextDirInterface(reh, vrvReh);
    this.ReadTimePointInterface(reh, vrvReh);
    readAttrs(vrvReh, reh);

    parent.AddChild(vrvReh);
    this.ReadUnsupportedAttr(reh, vrvReh);
    return this.ReadTextChildren(vrvReh, reh, vrvReh);
  }

  public ReadRepeatMark(parent: VrvObject, repeatMark: xml_node): boolean {
    const vrvRepeatMark = new RepeatMark();
    this.ReadControlElement(repeatMark, vrvRepeatMark);

    this.ReadTextDirInterface(repeatMark, vrvRepeatMark);
    this.ReadTimePointInterface(repeatMark, vrvRepeatMark);
    readAttrs(vrvRepeatMark, repeatMark);

    parent.AddChild(vrvRepeatMark);
    this.ReadUnsupportedAttr(repeatMark, vrvRepeatMark);
    return this.ReadTextChildren(vrvRepeatMark, repeatMark, vrvRepeatMark);
  }

  public ReadSlur(parent: VrvObject, slur: xml_node): boolean {
    const vrvSlur = new Slur();
    this.ReadControlElement(slur, vrvSlur);

    this.ReadOffsetSpanningInterface(slur, vrvSlur);
    this.ReadTimeSpanningInterface(slur, vrvSlur);
    readAttrs(vrvSlur, slur);

    parent.AddChild(vrvSlur);
    this.ReadUnsupportedAttr(slur, vrvSlur);
    return true;
  }

  public ReadTempo(parent: VrvObject, tempo: xml_node): boolean {
    const vrvTempo = new Tempo();
    this.ReadControlElement(tempo, vrvTempo);

    this.ReadTextDirInterface(tempo, vrvTempo);
    this.ReadTimeSpanningInterface(tempo, vrvTempo);
    readAttrs(vrvTempo, tempo);

    parent.AddChild(vrvTempo);
    this.ReadUnsupportedAttr(tempo, vrvTempo);
    return this.ReadTextChildren(vrvTempo, tempo, vrvTempo);
  }

  public ReadTie(parent: VrvObject, tie: xml_node): boolean {
    const vrvTie = new Tie();
    this.ReadControlElement(tie, vrvTie);

    this.ReadOffsetSpanningInterface(tie, vrvTie);
    this.ReadTimeSpanningInterface(tie, vrvTie);
    readAttrs(vrvTie, tie);

    parent.AddChild(vrvTie);
    this.ReadUnsupportedAttr(tie, vrvTie);
    return true;
  }

  public ReadTrill(parent: VrvObject, trill: xml_node): boolean {
    const vrvTrill = new Trill();
    this.ReadControlElement(trill, vrvTrill);

    this.ReadTimeSpanningInterface(trill, vrvTrill);
    readAttrs(vrvTrill, trill);

    parent.AddChild(vrvTrill);
    this.ReadUnsupportedAttr(trill, vrvTrill);
    return true;
  }

  public ReadTurn(parent: VrvObject, turn: xml_node): boolean {
    const vrvTurn = new Turn();
    this.ReadControlElement(turn, vrvTurn);

    if (this.m_meiversion < MEIVERSION_4_0_0) {
      this.UpgradeTurnTo_4_0_0(turn, vrvTurn);
    }

    this.ReadTimePointInterface(turn, vrvTurn);
    readAttrs(vrvTurn, turn);

    parent.AddChild(vrvTurn);
    this.ReadUnsupportedAttr(turn, vrvTurn);
    return true;
  }

  public ReadFb(parent: VrvObject, fb: xml_node): boolean {
    const vrvFb = new Fb();
    this.SetMeiID(fb, vrvFb);

    parent.AddChild(vrvFb);
    this.ReadUnsupportedAttr(fb, vrvFb);
    return this.ReadFbChildren(vrvFb, fb);
  }

  public ReadFbChildren(parent: VrvObject, parentNode: xml_node): boolean {
    let success = true;
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      this.NormalizeAttributes(current);
      const name = current.name();
      if (this.IsEditorialElementName(name)) {
        success = this.ReadEditorialElement(parent, current, EditorialLevel.EDITORIAL_FB);
      }
      else if (name === 'f') success = this.ReadF(parent, current);
      else if (name === '') success = this.ReadXMLComment(parent, current);
      else LogWarning("Unsupported '<%s>' within <fb>", name);
    }
    return success;
  }

  // ---- Text elements ----

  public ReadF(parent: VrvObject, f: xml_node): boolean {
    const vrvF = new F();
    this.ReadTextElement(f, vrvF);

    this.ReadTimeSpanningInterface(f, vrvF);
    readAttrs(vrvF, f);

    parent.AddChild(vrvF);
    this.ReadUnsupportedAttr(f, vrvF);
    return this.ReadTextChildren(vrvF, f, vrvF);
  }

  public ReadFig(parent: VrvObject, fig: xml_node): boolean {
    const vrvFig = new Fig();
    this.ReadTextElement(fig, vrvFig);

    this.ReadAreaPosInterface(fig, vrvFig);

    parent.AddChild(vrvFig);
    this.ReadUnsupportedAttr(fig, vrvFig);
    return this.ReadTextChildren(vrvFig, fig, vrvFig);
  }

  public ReadLb(parent: VrvObject, lb: xml_node): boolean {
    const vrvLb = new Lb();
    this.ReadTextElement(lb, vrvLb);

    parent.AddChild(vrvLb);
    this.ReadUnsupportedAttr(lb, vrvLb);
    return true;
  }

  public ReadNum(parent: VrvObject, num: xml_node): boolean {
    const vrvNum = new Num();
    this.ReadTextElement(num, vrvNum);

    parent.AddChild(vrvNum);
    this.ReadUnsupportedAttr(num, vrvNum);
    return this.ReadTextChildren(vrvNum, num, vrvNum);
  }

  public ReadRend(parent: VrvObject, rend: xml_node): boolean {
    if (this.m_meiversion <= MEIVERSION_5_0) {
      this.UpgradeRendTo_5_0(rend);
    }

    const vrvRend = new Rend();
    this.ReadTextElement(rend, vrvRend);

    this.ReadAreaPosInterface(rend, vrvRend);

    readAttrs(vrvRend, rend);

    if (vrvRend.GetFirstAncestor(ClassId.REND) && (vrvRend.HasHalign() || vrvRend.HasValign())) {
      LogWarning("@halign or @valign in nested <rend> element <rend> %s will be ignored", vrvRend.GetID());
      // Eventually to be added to unsupported attributes?
      vrvRend.SetHalign(HORIZONTALALIGNMENT_NONE);
      vrvRend.SetValign(VERTICALALIGNMENT_NONE);
    }
    // Previously we would use @fontame="VerovioText"
    // Now changeto @glyph.auth="smufl"
    if (vrvRend.HasFontname() && vrvRend.GetFontname() === 'VerovioText') {
      LogWarning("Using rend@fontname with 'VerovioText' is deprecated. Use 'rend@glyph.auth=\"smufl\"' instead");
      vrvRend.SetGlyphAuth('smufl');
      vrvRend.SetFontname('');
    }

    parent.AddChild(vrvRend);
    this.ReadUnsupportedAttr(rend, vrvRend);
    return this.ReadTextChildren(vrvRend, rend, vrvRend);
  }

  public ReadSvg(parent: VrvObject, svg: xml_node): boolean {
    const vrvSvg = new Svg();
    // Still read the @xml:id for handling the comments
    this.SetMeiID(svg, vrvSvg);

    // Read the @id by hand
    if (!svg.attribute('id').empty()) {
      vrvSvg.SetID(svg.attribute('id').value());
      svg.remove_attribute('id');
    }

    if (svg.name() === 'svg') {
      vrvSvg.Set(svg);
    }
    else {
      LogWarning('No svg content found for <fig> %s', parent.GetID());
    }

    parent.AddChild(vrvSvg);
    this.ReadUnsupportedAttr(svg, vrvSvg);
    return true;
  }

  public ReadSymbol(parent: VrvObject, symbol: xml_node): boolean {
    const vrvSymbol = new Symbol();
    this.ReadTextElement(symbol, vrvSymbol);

    readAttrs(vrvSymbol, symbol);

    parent.AddChild(vrvSymbol);
    this.ReadUnsupportedAttr(symbol, vrvSymbol);
    return true;
  }

  public ReadAnnotScore(parent: VrvObject, annot: xml_node): boolean {
    const vrvAnnotScore = new AnnotScore();

    this.ReadControlElement(annot, vrvAnnotScore);
    this.ReadPlistInterface(annot, vrvAnnotScore);
    this.ReadTimeSpanningInterface(annot, vrvAnnotScore);

    parent.AddChild(vrvAnnotScore);

    let hasNonTextContent = false;
    // copy all the nodes inside into the document
    for (let child = annot.first_child(); !child.empty(); child = child.next_sibling()) {
      const nodeName = child.name();
      if (!hasNonTextContent && (nodeName !== '')) hasNonTextContent = true;
      // This is also orphan code -- we can't copy the contents here
    }
    this.ReadUnsupportedAttr(annot, vrvAnnotScore);
    // Unless annot has only text we do not load children because they are preserved in Annot::m_content
    if (hasNonTextContent) {
      return true;
    }
    else {
      // Again, this is code that may not apply for annotScore
      return this.ReadTextChildren(vrvAnnotScore, annot, vrvAnnotScore);
    }
  }

  public ReadTextChildren(parent: VrvObject, parentNode: xml_node, filter: VrvObject | null): boolean {
    let success = true;
    let i = 0;
    for (let xmlElement = parentNode.first_child(); !xmlElement.empty(); xmlElement = xmlElement.next_sibling()) {
      if (!success) break;
      this.NormalizeAttributes(xmlElement);
      const elementName = xmlElement.name();
      if (filter && !this.IsAllowed(elementName, filter)) {
        LogWarning("Element <%s> within <%s> is not supported and will be ignored ", elementName, filter.GetClassName());
        continue;
      }
      // editorial
      else if (this.IsEditorialElementName(xmlElement.name())) {
        success = this.ReadEditorialElement(parent, xmlElement, EditorialLevel.EDITORIAL_TEXT, filter);
      }
      // content
      else if (elementName === 'fig') success = this.ReadFig(parent, xmlElement);
      else if (elementName === 'lb') success = this.ReadLb(parent, xmlElement);
      else if (elementName === 'num') success = this.ReadNum(parent, xmlElement);
      else if (elementName === 'rend') success = this.ReadRend(parent, xmlElement);
      else if (elementName === 'svg') success = this.ReadSvg(parent, xmlElement);
      else if (elementName === 'symbol') success = this.ReadSymbol(parent, xmlElement);
      else if (!xmlElement.text().empty()) {
        const trimLeft = (i === 0);
        const trimRight = xmlElement.next_sibling().empty();
        success = this.ReadText(parent, xmlElement, trimLeft, trimRight);
      }
      // figured bass
      else if (elementName === 'fb') success = this.ReadFb(parent, xmlElement);
      // xml comment
      else if (elementName === '') success = this.ReadXMLComment(parent, xmlElement);
      // unknown
      else LogWarning("Element <%s> is unknown and will be ignored", elementName);
      ++i;
    }
    return success;
  }

  public ReadText(parent: VrvObject, text: xml_node, trimLeft: boolean, trimRight: boolean): boolean {
    const vrvText = new Text();

    // C++ LeftTrim/RightTrim use iswspace under the C locale: ASCII whitespace
    // only (0x20, 0x09-0x0d). U+00A0/U+FEFF are kept, so `&#160;` placeholders
    // survive trimming (hum pgHead empty rows keep their height).
    let str = UTF8to32(text.text().as_string());
    const isSpace = (cp: number): boolean => cp === 0x20 || (cp >= 0x09 && cp <= 0x0d);
    if (trimLeft) { let p = 0; while (p < str.length && isSpace(str[p])) p++; str = str.slice(p); }
    if (trimRight) { let p = str.length; while (p > 0 && isSpace(str[p - 1])) p--; str = str.slice(0, p); }

    vrvText.SetText(str);

    parent.AddChild(vrvText);
    return true;
  }

  // ---- Page-based containers ----

  public ReadPages(parent: VrvObject, pages: xml_node): boolean {
    const vrvPages = new Pages();
    this.SetMeiID(pages, vrvPages);

    readAttrs(vrvPages, pages);

    parent.AddChild(vrvPages);

    // check if there is a type attribute for the score
    if (!pages.attribute('type').empty()) {
      const type = this.StrToDocType(pages.attribute('type').value());
      this.getDoc().SetType(type);
      pages.remove_attribute('type');
    }

    // This is a page-based MEI file
    this.m_layoutInformation = LayoutInformation.LAYOUT_DONE;

    let success = true;
    // No need to have ReadPagesChildren for this...
    for (let current = firstElementChild(pages); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      const name = current.name();
      if (name === 'page') success = this.ReadPage(vrvPages, current);
      else if (name === '') success = this.ReadXMLComment(parent, current);
      else LogWarning("Unsupported '<%s>' within <pages>", name);
    }

    this.ReadUnsupportedAttr(pages, vrvPages);
    return success;
  }

  public ReadPage(parent: VrvObject, page: xml_node): boolean {
    const vrvPage = new Page();
    this.SetMeiID(page, vrvPage);

    const doc = this.getDoc();
    if (doc.IsTranscription() && (this.m_meiversion === MEIVERSION_2013)) {
      this.UpgradePageTo_3_0_0(vrvPage, doc);
    }

    const pageAny = vrvPage as unknown as Record<string, unknown>;
    if (!page.attribute('page.height').empty()) {
      pageAny['m_pageHeight'] = page.attribute('page.height').as_int() * DEFINITION_FACTOR;
      page.remove_attribute('page.height');
    }
    if (!page.attribute('page.width').empty()) {
      pageAny['m_pageWidth'] = page.attribute('page.width').as_int() * DEFINITION_FACTOR;
      page.remove_attribute('page.width');
    }
    if (!page.attribute('page.botmar').empty()) {
      pageAny['m_pageMarginBottom'] = page.attribute('page.botmar').as_int() * DEFINITION_FACTOR;
      page.remove_attribute('page.botmar');
    }
    if (!page.attribute('page.leftmar').empty()) {
      pageAny['m_pageMarginLeft'] = page.attribute('page.leftmar').as_int() * DEFINITION_FACTOR;
      page.remove_attribute('page.leftmar');
    }
    if (!page.attribute('page.rightmar').empty()) {
      pageAny['m_pageMarginRight'] = page.attribute('page.rightmar').as_int() * DEFINITION_FACTOR;
      page.remove_attribute('page.rightmar');
    }
    if (!page.attribute('page.topmar').empty()) {
      pageAny['m_pageMarginTop'] = page.attribute('page.topmar').as_int() * DEFINITION_FACTOR;
      page.remove_attribute('page.topmar');
    }
    if (!page.attribute('surface').empty()) {
      pageAny['m_surface'] = page.attribute('surface').value();
      page.remove_attribute('surface');
    }
    if (!page.attribute('ppu').empty()) {
      pageAny['m_PPUFactor'] = page.attribute('ppu').as_double();
    }

    parent.AddChild(vrvPage);
    let success = this.ReadPageChildren(vrvPage, page);

    if (success && doc.IsTranscription() && (vrvPage.GetPPUFactor() !== 1.0)) {
      const applyPPUFactor = new ApplyPPUFactorFunctor();
      vrvPage.Process(applyPPUFactor as never);
    }

    if (doc.IsTranscription() && (this.m_meiversion === MEIVERSION_2013)) {
      this.UpgradePageTo_5_0(vrvPage);
    }

    this.ReadUnsupportedAttr(page, vrvPage);
    return success;
  }

  public ReadPageChildren(parent: VrvObject, parentNode: xml_node): boolean {
    for (let current = parentNode.first_child(); !current.empty(); current = current.next_sibling()) {
      const name = current.name();
      if (name === 'mdiv') this.ReadMdiv(parent, current, true);
      else if (name === 'score') this.ReadScore(parent, current);
      else if (name === 'system') this.ReadSystem(parent, current);
      // mdiv in page-based MEI
      else if (name === 'mdivb') this.ReadMdiv(parent, current, true);
      else if (name === 'milestoneEnd') this.ReadPageMilestoneEnd(parent, current);
      // xml comment
      else if (name === '') this.ReadXMLComment(parent, current);
      else LogWarning("Unsupported '<%s>' within <page>", name);
    }

    return true;
  }

  public ReadPageMilestoneEnd(parent: VrvObject, milestoneEnd: xml_node): boolean {
    // Check that we have a @startid
    if (milestoneEnd.attribute('startid').empty()) {
      LogError('Missing @startid on  milestoneEnd');
      return false;
    }

    // Find the element pointing to it
    const startID = milestoneEnd.attribute('startid').value();
    const start = this.getDoc().FindDescendantByID(ExtractIDFragment(startID));
    if (!start) {
      LogError("Could not find start element '%s' for milestoneEnd", startID);
      return false;
    }

    // Check that it is a page milestone
    const iface = (start as unknown as { GetPageMilestoneInterface?(): PageMilestoneInterface | null }).GetPageMilestoneInterface?.() ?? null;
    if (!iface) {
      LogError("The start element  '%s' is not a page milestone element", startID);
      return false;
    }

    const vrvElementEnd = new PageMilestoneEnd(start);
    this.SetMeiID(milestoneEnd, vrvElementEnd);
    iface.SetEnd(vrvElementEnd);

    parent.AddChild(vrvElementEnd);
    return true;
  }

  public ReadSystem(parent: VrvObject, system: xml_node): boolean {
    const vrvSystem = new System();
    this.SetMeiID(system, vrvSystem);
    readAttrs(vrvSystem, system);

    const systemAny = vrvSystem as unknown as Record<string, unknown>;
    if (!system.attribute('system.leftmar').empty()) {
      systemAny['m_systemLeftMar'] = system.attribute('system.leftmar').as_int();
      system.remove_attribute('system.leftmar');
    }
    if (!system.attribute('system.rightmar').empty()) {
      systemAny['m_systemRightMar'] = system.attribute('system.rightmar').as_int();
      system.remove_attribute('system.rightmar');
    }
    if (!system.attribute('uly').empty() && this.getDoc().IsTranscription()) {
      systemAny['m_drawingFacsY'] = system.attribute('uly').as_int() * DEFINITION_FACTOR;
      system.remove_attribute('uly');
    }

    parent.AddChild(vrvSystem);
    this.ReadUnsupportedAttr(system, vrvSystem);
    return this.ReadSystemChildren(vrvSystem, system);
  }

  public ReadSystemChildren(parent: VrvObject, parentNode: xml_node): boolean {
    let success = true;
    let unmeasured: Measure | null = null;
    const doc = this.getDoc();
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      this.NormalizeAttributes(current);
      const name = current.name();
      if (this.IsEditorialElementName(name)) {
        success = this.ReadEditorialElement(parent, current, EditorialLevel.EDITORIAL_TOPLEVEL);
      }
      else if (name === 'section') {
        success = this.ReadSection(parent, current);
      }
      // section in page-based MEI
      else if (name === 'secb') {
        success = this.ReadSection(parent, current);
      }
      else if (name === 'milestoneEnd') {
        success = this.ReadSystemMilestoneEnd(parent, current);
      }
      else if (name === 'scoreDef') {
        this.ReadScoreDef(parent, current);
      }
      // unmeasured music
      else if (name === 'staff') {
        if (!unmeasured) {
          if (parent.Is(ClassId.SYSTEM)) {
            const system = parent as System;
            unmeasured = new Measure(MeasureType.UNMEASURED);
            doc.SetMensuralMusicOnly(BOOLEAN_true);
            if (doc.IsTranscription() && (this.m_meiversion === MEIVERSION_2013)) {
              this.UpgradeMeasureTo_3_0_0(unmeasured, system);
            }
            system.AddChild(unmeasured);
          }
          else {
            LogError('Unmeasured music within editorial markup is currently not supported');
            return false;
          }
        }
        success = this.ReadStaff(unmeasured, current);
      }
      else if (name === 'measure') {
        success = this.ReadMeasure(parent, current);
      }
      else if (this.m_deserializing) {
        if (name === 'pb') success = this.ReadPb(parent, current);
        else if (name === 'sb') success = this.ReadSb(parent, current);
      }
      else if (name === '') {
        success = this.ReadXMLComment(parent, current);
      }
      else {
        LogWarning("Unsupported '<%s>' within <system>", name);
      }
    }
    return success;
  }

  public ReadSystemMilestoneEnd(parent: VrvObject, milestoneEnd: xml_node): boolean {
    // Check that we have a @startid
    if (milestoneEnd.attribute('startid').empty()) {
      LogError('Missing @startid on  milestoneEnd');
      return false;
    }

    // Find the element pointing to it
    const startID = milestoneEnd.attribute('startid').value();
    const start = this.getDoc().FindDescendantByID(ExtractIDFragment(startID));
    if (!start) {
      LogError("Could not find start element '%s' for milestoneEnd", startID);
      return false;
    }

    // Check that it is a system milestone
    const iface = (start as unknown as { GetSystemMilestoneInterface?(): SystemMilestoneInterface | null }).GetSystemMilestoneInterface?.() ?? null;
    if (!iface) {
      LogError("The start element  '%s' is not a system milestone element", startID);
      return false;
    }

    const vrvElementEnd = new SystemMilestoneEnd(start);
    this.SetMeiID(milestoneEnd, vrvElementEnd);
    iface.SetEnd(vrvElementEnd);

    parent.AddChild(vrvElementEnd);
    return true;
  }

  public ReadFacsimile(parent: VrvObject, facsimile: xml_node): boolean {
    const vrvFacsimile = new Facsimile();
    // Read xmlId (if present)
    this.SetMeiID(facsimile, vrvFacsimile);
    readAttrs(vrvFacsimile, facsimile);
    // Read children
    for (let child = facsimile.first_child(); !child.empty(); child = child.next_sibling()) {
      if (child.name() === 'surface') {
        this.ReadSurface(vrvFacsimile, child);
      }
      else {
        LogWarning('Unsupported element <%s> in <facsimile>', child.name());
      }
    }
    this.getDoc().SetFacsimile(vrvFacsimile as never);
    return true;
  }

  public ReadSurface(parent: VrvObject, surface: xml_node): boolean {
    const vrvSurface = new Surface();
    this.SetMeiID(surface, vrvSurface);
    readAttrs(vrvSurface, surface);

    for (let child = surface.first_child(); !child.empty(); child = child.next_sibling()) {
      if (child.name() === 'graphic') {
        this.ReadGraphic(vrvSurface, child);
      }
      else if (child.name() === 'zone') {
        this.ReadZone(vrvSurface, child);
      }
      else {
        LogWarning('Unsupported element <%s> in <surface>', child.name());
      }
    }
    parent.AddChild(vrvSurface);
    return true;
  }

  public ReadZone(parent: VrvObject, zone: xml_node): boolean {
    const vrvZone = new Zone();
    this.SetMeiID(zone, vrvZone);
    readAttrs(vrvZone, zone);
    parent.AddChild(vrvZone);
    return true;
  }

  // ---- Editorial markup (containers with level + filter) ----

  public ReadEditorialChildren(parent: VrvObject, parentNode: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    if (level === EditorialLevel.EDITORIAL_SCORE) {
      return this.ReadScoreScoreDef(parent, parentNode);
    }
    else if (level === EditorialLevel.EDITORIAL_TOPLEVEL) {
      if (this.m_readingScoreBased) {
        return this.ReadSectionChildren(parent, parentNode);
      }
      else {
        return this.ReadSystemChildren(parent, parentNode);
      }
    }
    else if (level === EditorialLevel.EDITORIAL_SCOREDEF) {
      return this.ReadScoreDefChildren(parent, parentNode);
    }
    else if (level === EditorialLevel.EDITORIAL_STAFFGRP) {
      return this.ReadStaffGrpChildren(parent, parentNode);
    }
    else if (level === EditorialLevel.EDITORIAL_MEASURE) {
      return this.ReadMeasureChildren(parent, parentNode);
    }
    else if (level === EditorialLevel.EDITORIAL_STAFF) {
      return this.ReadStaffChildren(parent, parentNode);
    }
    else if (level === EditorialLevel.EDITORIAL_LAYER) {
      return this.ReadLayerChildren(parent, parentNode, filter);
    }
    else if (level === EditorialLevel.EDITORIAL_TEXT) {
      return this.ReadTextChildren(parent, parentNode, filter);
    }
    else if (level === EditorialLevel.EDITORIAL_FB) {
      return this.ReadFbChildren(parent, parentNode);
    }
    else if (level === EditorialLevel.EDITORIAL_RUNNING) {
      return this.ReadRunningChildren(parent, parentNode, filter);
    }
    else {
      return false;
    }
  }

  public ReadAbbr(parent: VrvObject, abbr: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvAbbr = new Abbr();
    this.ReadEditorialElement(abbr, vrvAbbr);

    parent.AddChild(vrvAbbr);
    this.ReadUnsupportedAttr(abbr, vrvAbbr);
    return this.ReadEditorialChildren(vrvAbbr, abbr, level, filter);
  }

  public ReadAdd(parent: VrvObject, add: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvAdd = new Add();
    this.ReadEditorialElement(add, vrvAdd);

    parent.AddChild(vrvAdd);
    this.ReadUnsupportedAttr(add, vrvAdd);
    return this.ReadEditorialChildren(vrvAdd, add, level, filter);
  }

  public ReadAnnot(parent: VrvObject, annot: xml_node): boolean {
    const vrvAnnot = new Annot();
    this.ReadEditorialElement(annot, vrvAnnot);

    parent.AddChild(vrvAnnot);
    const content = (vrvAnnot as unknown as { m_content: xml_document });
    content.m_content.remove_children();

    let hasNonTextContent = false;
    // copy all the nodes inside into the document
    for (let child = annot.first_child(); !child.empty(); child = child.next_sibling()) {
      const nodeName = child.name();
      if (!hasNonTextContent && (nodeName !== '')) hasNonTextContent = true;
      content.m_content.append_copy(child);
    }
    this.ReadUnsupportedAttr(annot, vrvAnnot);
    // Unless annot has only text we do not load children because they are preserved in Annot::m_content
    if (hasNonTextContent) {
      return true;
    }
    else {
      content.m_content.remove_children();
      return this.ReadTextChildren(vrvAnnot, annot, vrvAnnot);
    }
  }

  public ReadApp(parent: VrvObject, app: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvApp = new App(level);
    this.ReadEditorialElement(app, vrvApp);

    parent.AddChild(vrvApp);
    this.ReadUnsupportedAttr(app, vrvApp);
    return this.ReadAppChildren(vrvApp, app, level, filter);
  }

  public ReadAppChildren(parent: VrvObject, parentNode: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    // Check if one child node matches the m_appXPathQuery
    let selectedLemOrRdg: xml_node | null = null;
    const xPathQueries: string[] = this.getDoc().GetOptions().m_appXPathQuery.GetValue() as string[];
    if (xPathQueries.length > 0) {
      const i = xPathQueries.find((query) => selectNode(parentNode, query) !== null);
      if (i !== undefined) selectedLemOrRdg = selectNode(parentNode, i);
    }

    let success = true;
    let hasXPathSelected = false;
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      const name = current.name();
      if (name === 'lem') {
        success = this.ReadLem(parent, current, level, filter);
      }
      else if (name === 'rdg') {
        success = this.ReadRdg(parent, current, level, filter);
      }
      // xml comment
      else if (name === '') {
        success = this.ReadXMLComment(parent, current);
      }
      else {
        LogWarning("Unsupported '<%s>' within <app>", name);
      }
      // Now we check if the xpath selection (if any) matches the current node.
      // If yes, make it visible
      if (sameXmlNode(selectedLemOrRdg, current)) {
        const last = parent.GetLast() as EditorialElement | null;
        if (last) {
          last.SetVisibility(VisibilityType.Visible);
          hasXPathSelected = true;
        }
      }
    }

    // If no <rdg> or <lem> was made visible through the xpath selection, make the first one visible
    if (!hasXPathSelected) {
      const first = parent.GetFirst() as EditorialElement | null;
      if (first) {
        first.SetVisibility(VisibilityType.Visible);
      }
      else if (!this.m_deserializing && !parent.Is(ClassId.SYSTEM)) {
        LogWarning('Could not make one <rdg> or <lem> visible');
      }
    }
    return success;
  }

  public ReadChoice(parent: VrvObject, choice: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvChoice = new Choice(level);
    this.ReadEditorialElement(choice, vrvChoice);

    parent.AddChild(vrvChoice);
    this.ReadUnsupportedAttr(choice, vrvChoice);
    return this.ReadChoiceChildren(vrvChoice, choice, level, filter);
  }

  public ReadChoiceChildren(parent: VrvObject, parentNode: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    // Check if one child node matches a value in m_choiceXPathQueries
    let selectedChild: xml_node | null = null;
    const xPathQueries: string[] = this.getDoc().GetOptions().m_choiceXPathQuery.GetValue() as string[];
    if (xPathQueries.length > 0) {
      const i = xPathQueries.find((query) => selectNode(parentNode, query) !== null);
      if (i !== undefined) selectedChild = selectNode(parentNode, i);
    }

    let success = true;
    let hasXPathSelected = false;
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      const name = current.name();
      if (name === 'abbr') success = this.ReadAbbr(parent, current, level, filter);
      else if (name === 'choice') success = this.ReadChoice(parent, current, level, filter);
      else if (name === 'corr') success = this.ReadCorr(parent, current, level, filter);
      else if (name === 'expan') success = this.ReadExpan(parent, current, level, filter);
      else if (name === 'orig') success = this.ReadOrig(parent, current, level, filter);
      else if (name === 'ref') success = this.ReadRef(parent, current, level, filter);
      else if (name === 'reg') success = this.ReadReg(parent, current, level, filter);
      else if (name === 'sic') success = this.ReadSic(parent, current, level, filter);
      else if (name === 'unclear') success = this.ReadUnclear(parent, current, level, filter);
      // xml comment
      else if (name === '') success = this.ReadXMLComment(parent, current);
      else LogWarning("Unsupported '<%s>' within <choice>", name);

      // Now we check if the xpath selection (if any) matches the current node.
      // If yes, make it visible
      const last = parent.GetLast() as EditorialElement | null;
      if (success && last) {
        if (sameXmlNode(selectedChild, current)) {
          last.SetVisibility(VisibilityType.Visible);
          hasXPathSelected = true;
        }
        else {
          last.SetVisibility(VisibilityType.Hidden);
        }
      }
    }

    // If no child was made visible through the xpath selection, make the first one visible
    if (!hasXPathSelected) {
      const first = parent.GetFirst() as EditorialElement | null;
      if (first) {
        first.SetVisibility(VisibilityType.Visible);
      }
      else {
        LogWarning('Could not make one child of <choice> visible');
      }
    }
    return success;
  }

  public ReadCorr(parent: VrvObject, corr: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvCorr = new Corr();
    this.ReadEditorialElement(corr, vrvCorr);

    parent.AddChild(vrvCorr);
    this.ReadUnsupportedAttr(corr, vrvCorr);
    return this.ReadEditorialChildren(vrvCorr, corr, level, filter);
  }

  public ReadDamage(parent: VrvObject, damage: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvDamage = new Damage();
    this.ReadEditorialElement(damage, vrvDamage);

    parent.AddChild(vrvDamage);
    this.ReadUnsupportedAttr(damage, vrvDamage);
    return this.ReadEditorialChildren(vrvDamage, damage, level, filter);
  }

  public ReadDel(parent: VrvObject, del: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvDel = new Del();
    this.ReadEditorialElement(del, vrvDel);

    parent.AddChild(vrvDel);
    this.ReadUnsupportedAttr(del, vrvDel);
    return this.ReadEditorialChildren(vrvDel, del, level, filter);
  }

  public ReadExpan(parent: VrvObject, expan: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvExpan = new Expan();
    this.ReadEditorialElement(expan, vrvExpan);

    parent.AddChild(vrvExpan);
    this.ReadUnsupportedAttr(expan, vrvExpan);
    return this.ReadEditorialChildren(vrvExpan, expan, level, filter);
  }

  public ReadLem(parent: VrvObject, lem: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvLem = new Lem();
    // By default make them all hidden. MEIInput::ReadAppChildren will make one visible.
    vrvLem.SetVisibility(VisibilityType.Hidden);
    this.ReadEditorialElement(lem, vrvLem);

    parent.AddChild(vrvLem);
    this.ReadUnsupportedAttr(lem, vrvLem);
    return this.ReadEditorialChildren(vrvLem, lem, level, filter);
  }

  public ReadOrig(parent: VrvObject, orig: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvOrig = new Orig();
    this.ReadEditorialElement(orig, vrvOrig);

    parent.AddChild(vrvOrig);
    this.ReadUnsupportedAttr(orig, vrvOrig);
    return this.ReadEditorialChildren(vrvOrig, orig, level, filter);
  }

  public ReadRdg(parent: VrvObject, rdg: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvRdg = new Rdg();
    // By default make them all hidden. MEIInput::ReadAppChildren will make one visible.
    vrvRdg.SetVisibility(VisibilityType.Hidden);
    this.ReadEditorialElement(rdg, vrvRdg);

    parent.AddChild(vrvRdg);
    this.ReadUnsupportedAttr(rdg, vrvRdg);
    return this.ReadEditorialChildren(vrvRdg, rdg, level, filter);
  }

  public ReadRef(parent: VrvObject, ref: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvRef = new Ref();
    this.ReadEditorialElement(ref, vrvRef);

    parent.AddChild(vrvRef);
    this.ReadUnsupportedAttr(ref, vrvRef);
    return this.ReadEditorialChildren(vrvRef, ref, level, filter);
  }

  public ReadReg(parent: VrvObject, reg: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvReg = new Reg();
    this.ReadEditorialElement(reg, vrvReg);

    parent.AddChild(vrvReg);
    this.ReadUnsupportedAttr(reg, vrvReg);
    return this.ReadEditorialChildren(vrvReg, reg, level, filter);
  }

  public ReadRestore(parent: VrvObject, restore: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvRestore = new Restore();
    this.ReadEditorialElement(restore, vrvRestore);

    parent.AddChild(vrvRestore);
    this.ReadUnsupportedAttr(restore, vrvRestore);
    return this.ReadEditorialChildren(vrvRestore, restore, level, filter);
  }

  public ReadSic(parent: VrvObject, sic: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvSic = new Sic();
    this.ReadEditorialElement(sic, vrvSic);

    parent.AddChild(vrvSic);
    this.ReadUnsupportedAttr(sic, vrvSic);
    return this.ReadEditorialChildren(vrvSic, sic, level, filter);
  }

  public ReadSubst(parent: VrvObject, subst: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvSubst = new Subst(level);
    this.ReadEditorialElement(subst, vrvSubst);

    parent.AddChild(vrvSubst);
    this.ReadUnsupportedAttr(subst, vrvSubst);
    return this.ReadSubstChildren(vrvSubst, subst, level, filter);
  }

  public ReadSubstChildren(parent: VrvObject, parentNode: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    // Check if one child node matches a value in m_substXPathQueries
    let selectedChild: xml_node | null = null;
    const xPathQueries: string[] = this.getDoc().GetOptions().m_substXPathQuery.GetValue() as string[];
    if (xPathQueries.length > 0) {
      const i = xPathQueries.find((query) => selectNode(parentNode, query) !== null);
      if (i !== undefined) selectedChild = selectNode(parentNode, i);
    }

    let success = true;
    let hasXPathSelected = false;
    for (let current = firstElementChild(parentNode); !current.empty(); current = nextElement(current.next_sibling())) {
      if (!success) break;
      const name = current.name();
      if (name === 'add') success = this.ReadAdd(parent, current, level, filter);
      else if (name === 'del') success = this.ReadDel(parent, current, level, filter);
      else if (name === 'subst') success = this.ReadSubst(parent, current, level, filter);
      // xml comment
      else if (name === '') success = this.ReadXMLComment(parent, current);
      else LogWarning("Unsupported '<%s>' within <subst>", name);

      // Now we check if the xpath selection (if any) matches the current node.
      // If yes, make it visible
      const last = parent.GetLast() as EditorialElement | null;
      if (success && last) {
        if (sameXmlNode(selectedChild, current)) {
          last.SetVisibility(VisibilityType.Visible);
          hasXPathSelected = true;
        }
        else {
          last.SetVisibility(VisibilityType.Hidden);
        }
      }
    }

    // If no child was made visible through the xpath selection, make the first one visible
    if (!hasXPathSelected) {
      const first = parent.GetFirst() as EditorialElement | null;
      if (first) {
        first.SetVisibility(VisibilityType.Visible);
      }
      else {
        LogWarning('Could not make one child of <subst> visible');
      }
    }
    return success;
  }

  public ReadSupplied(parent: VrvObject, supplied: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvSupplied = new Supplied();
    this.ReadEditorialElement(supplied, vrvSupplied);

    parent.AddChild(vrvSupplied);
    this.ReadUnsupportedAttr(supplied, vrvSupplied);
    return this.ReadEditorialChildren(vrvSupplied, supplied, level, filter);
  }

  public ReadUnclear(parent: VrvObject, unclear: xml_node, level: EditorialLevel, filter: VrvObject | null): boolean {
    const vrvUnclear = new Unclear();
    this.ReadEditorialElement(unclear, vrvUnclear);

    parent.AddChild(vrvUnclear);
    this.ReadUnsupportedAttr(unclear, vrvUnclear);
    return this.ReadEditorialChildren(vrvUnclear, unclear, level, filter);
  }

  // ---- Upgrades ----

  public UpgradeScoreDefElementTo_4_0_0(scoreDefElement: xml_node, vrvScoreDefElement: ScoreDefElement): void {
    const keySig = vrvScoreDefElement.FindDescendantByType(ClassId.KEYSIG) as KeySig | null;
    const meterSig = vrvScoreDefElement.FindDescendantByType(ClassId.METERSIG) as MeterSig | null;

    if (!scoreDefElement.attribute('key.sig.show').empty()) {
      if (keySig) {
        keySig.SetVisible(new AttConverterBase().StrToBoolean(scoreDefElement.attribute('key.sig.show').value()));
        scoreDefElement.remove_attribute('key.sig.show');
      }
      else {
        LogWarning("No keySig found when trying to upgrade '@key.sig.show'");
      }
    }
    if (!scoreDefElement.attribute('key.sig.showchange').empty()) {
      if (keySig) {
        if (new AttConverterBase().StrToBoolean(scoreDefElement.attribute('key.sig.showchange').value()) === BOOLEAN_true) {
          keySig.SetCancelaccid(CANCELACCID_before);
        }
        else {
          keySig.SetCancelaccid(CANCELACCID_none);
        }
        scoreDefElement.remove_attribute('key.sig.showchange');
      }
      else {
        LogWarning("No keySig found when trying to upgrade '@key.sig.showchange'");
      }
    }
    if (!scoreDefElement.attribute('meter.rend').empty()) {
      if (meterSig) {
        meterSig.SetForm(
          new AttConverterBase().StrToMeterform(scoreDefElement.attribute('meter.rend').value()));
        scoreDefElement.remove_attribute('meter.rend');
      }
    }
  }

  public UpgradeStaffDefTo_4_0_0(staffDef: xml_node, vrvStaffDef: StaffDef): void {
    if (!staffDef.attribute('label').empty()) {
      const text = new Text();
      text.SetText(UTF8to32(staffDef.attribute('label').value()));
      const label = new Label();
      label.AddChild(text);
      vrvStaffDef.AddChild(label);
      staffDef.remove_attribute('label');
    }
    if (!staffDef.attribute('label.abbr').empty()) {
      const text = new Text();
      text.SetText(UTF8to32(staffDef.attribute('label.abbr').value()));
      const labelAbbr = new LabelAbbr();
      labelAbbr.AddChild(text);
      vrvStaffDef.AddChild(labelAbbr);
      staffDef.remove_attribute('label.abbr');
    }
  }

  public UpgradeStaffGrpTo_4_0_0(staffGrp: xml_node, vrvStaffGrp: StaffGrp): void {
    if (!staffGrp.attribute('barthru').empty()) {
      vrvStaffGrp.SetBarThru(new AttConverterBase().StrToBoolean(staffGrp.attribute('barthru').value()));
      staffGrp.remove_attribute('barthru');
    }
    if (!staffGrp.attribute('label').empty()) {
      const text = new Text();
      text.SetText(UTF8to32(staffGrp.attribute('label').value()));
      const label = new Label();
      label.AddChild(text);
      vrvStaffGrp.AddChild(label);
      staffGrp.remove_attribute('label');
    }
    if (!staffGrp.attribute('label.abbr').empty()) {
      const text = new Text();
      text.SetText(UTF8to32(staffGrp.attribute('label.abbr').value()));
      const labelAbbr = new LabelAbbr();
      labelAbbr.AddChild(text);
      vrvStaffGrp.AddChild(labelAbbr);
      staffGrp.remove_attribute('label.abbr');
    }
  }

  public UpgradeKeySigTo_5_0(keySig: xml_node): void {
    const keySigLog = new InstKeySigLog();

    if (!keySig.attribute('sig.showchange').empty()) {
      const showchange = keySigLog.StrToBoolean(keySig.attribute('sig.showchange').value());
      keySig.attribute('sig.showchange').set_name('cancelaccid');
      if (showchange === BOOLEAN_true) {
        keySig.attribute('cancelaccid').set_value('before');
      }
      else {
        keySig.attribute('cancelaccid').set_value('none');
      }
    }
  }

  public UpgradeMeterSigTo_5_0(meterSig: xml_node, vrvMeterSig: MeterSig): void {
    if (!meterSig.attribute('form').empty()) {
      const value = meterSig.attribute('form').value();
      if (value === 'invis') {
        meterSig.remove_attribute('form');
        vrvMeterSig.SetVisible(BOOLEAN_false);
      }
    }
  }

  public UpgradeDurGesTo_4_0_0(element: xml_node, iface: DurationInterface): void {
    if (!element.attribute('dur.ges').empty()) {
      let durGes = element.attribute('dur.ges').as_string();
      if (durGes.endsWith('p')) {
        iface.SetDurPpq(Number.parseInt(durGes, 10));
      }
      else if (durGes.endsWith('r')) {
        durGes = durGes.slice(0, -1);
        iface.SetDurRecip(durGes);
      }
      else if (durGes.endsWith('s')) {
        durGes = durGes.slice(0, -1);
        const parsed = Math.fround(Number.parseFloat(durGes));
        if (Number.isNaN(parsed)) {
          LogError('Upgrading to 4.0.0: %s', `invalid_argument: ${durGes}`);
        }
        else {
          iface.SetDurReal(parsed);
        }
      }
      element.remove_attribute('dur.ges');
    }
  }

  public UpgradeBeatRptTo_4_0_0(beatRpt: xml_node, vrvBeatRpt: BeatRpt): void {
    let value = '';
    if (!beatRpt.attribute('rend').empty()) {
      value = beatRpt.attribute('rend').value();
      beatRpt.remove_attribute('rend');
    }
    else if (!beatRpt.attribute('form').empty()) {
      value = beatRpt.attribute('form').value();
      beatRpt.remove_attribute('form');
    }
    if (value === '') return;
    if ((value === '4') || (value === '8')) {
      vrvBeatRpt.SetSlash(BEATRPT_REND_1);
    }
    else if (value === '16') {
      vrvBeatRpt.SetSlash(BEATRPT_REND_2);
    }
    else if (value === '32') {
      vrvBeatRpt.SetSlash(BEATRPT_REND_3);
    }
    else if (value === '64') {
      vrvBeatRpt.SetSlash(BEATRPT_REND_4);
    }
    else if (value === '128') {
      vrvBeatRpt.SetSlash(BEATRPT_REND_5);
    }
    else if (value === 'mixed') {
      vrvBeatRpt.SetSlash(BEATRPT_REND_mixed);
    }
  }

  public UpgradeFTremTo_4_0_0(fTrem: xml_node, vrvFTrem: FTrem): void {
    if (!fTrem.attribute('slash').empty()) {
      vrvFTrem.SetBeams(Number.parseInt(fTrem.attribute('slash').value(), 10) || 0);
      fTrem.remove_attribute('slash');
    }
  }

  public UpgradeMordentTo_4_0_0(mordent: xml_node, vrvMordent: Mordent): void {
    if (!mordent.attribute('form').empty()) {
      const form = mordent.attribute('form').value();
      if (form === 'norm') {
        vrvMordent.SetForm(mordentLog_FORM_lower);
      }
      else if (form === 'inv') {
        vrvMordent.SetForm(mordentLog_FORM_upper);
      }
      else {
        LogWarning("Unsupported value '%s' for att.mordent.log@form (MEI 3.0)", form);
      }
      mordent.remove_attribute('form');
    }
  }

  public UpgradeTurnTo_4_0_0(turn: xml_node, vrvTurn: Turn): void {
    if (!turn.attribute('form').empty()) {
      const form = turn.attribute('form').value();
      if (form === 'inv') {
        vrvTurn.SetForm(turnLog_FORM_lower);
      }
      else if (form === 'norm') {
        vrvTurn.SetForm(turnLog_FORM_lower);
      }
      else {
        LogWarning("Unsupported value '%s' for att.turn.log@form (MEI 3.0)", form);
      }
      turn.remove_attribute('form');
    }
  }

  public UpgradeRendTo_5_0(element: xml_node): void {
    if (!element.attribute('fontfam').empty()) {
      const value = element.attribute('fontfam').value();
      if (value === 'smufl') {
        element.attribute('fontfam').set_name('glyph.auth');
      }
    }
  }

  public UpgradePgHeadFootTo_5_0(element: xml_node): void {
    if ((element.name() === 'pgFoot') && element.attribute('func').empty()) {
      element.append_attribute('func').set_value('first');
    }
    else if (element.name() === 'pgFoot2') {
      element.set_name('pgFoot');
      element.append_attribute('func').set_value('all');
    }
    else if ((element.name() === 'pgHead') && element.attribute('func').empty()) {
      element.append_attribute('func').set_value('first');
    }
    else if (element.name() === 'pgHead2') {
      element.set_name('pgHead');
      element.append_attribute('func').set_value('all');
    }
  }

  public UpgradeMeasureTo_5_0(measure: xml_node): void {
    if (!measure.attribute('ulx').empty()) {
      measure.attribute('ulx').set_name('coord.x1');
    }
    if (!measure.attribute('lrx').empty()) {
      measure.attribute('lrx').set_name('coord.x2');
    }
  }

  public UpgradeMeasureTo_3_0_0(measure: Measure, system: System): void {
    const systemAny = system as unknown as Record<string, number>;
    const measureAny = measure as unknown as Record<string, number>;
    if (systemAny['m_drawingFacsY'] === VRV_UNSET) return;
    if (systemAny['m_systemRightMar'] === VRV_UNSET) return;

    const page = system.GetFirstAncestor(ClassId.PAGE) as (Page & Record<string, number>) | null;
    if (!page) return;
    measureAny['m_drawingFacsX1'] = systemAny['m_systemLeftMar'];
    measureAny['m_drawingFacsX2'] = page['m_pageWidth'] - systemAny['m_systemRightMar'];
  }

  public UpgradePageTo_5_0(page: Page): void {
    // Upgrade old page-based files by inserting a mdiv and score with corresponding boundaries
    // Works only for single page files

    const score = new Score();
    page.InsertChild(score, 0);

    const scoreEnd = new PageMilestoneEnd(score);
    page.AddChild(scoreEnd);
    score.GetPageMilestoneInterface()!.SetEnd(scoreEnd);

    const mdiv = new Mdiv();
    page.InsertChild(mdiv, 0);

    const mdivEnd = new PageMilestoneEnd(mdiv);
    page.AddChild(mdivEnd);
    mdiv.GetPageMilestoneInterface()!.SetEnd(mdivEnd);
  }

  public UpgradePageTo_3_0_0(page: Page, doc: Doc): void {
    // Once we have the GetPPU in Page through LibMEI, call this from Doc::SetDrawingPage and
    // use m_unit instead of DEFAULT_UNIT - For the upgraded call Page->SetPPU(12.5);
    page.SetPPUFactor(25.0 / 2.0 / doc.GetOptions().m_unit.GetDefault());
  }

  public ReadUnsupportedAttr(element: xml_node, object: VrvObject): void {
    const o = object as VrvObject & { m_unsupported: ArrayOfStrAttr };
    for (const attr of element.attributes() as Iterable<{ name(): string; value(): string }>) {
      const a = attr as { name(): string; value(): string };
      o.m_unsupported.push([a.name(), a.value()]);
    }
  }
}

export class MEIInputExtended extends MEIInput {
  constructor(doc: DocLike) { super(doc); }

  public ImportScoreDef(_scoreDef: JsonxxObject): void {
    LogError('MEI scoreDef import is not supported in this build.');
  }
}
