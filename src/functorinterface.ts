/**
 * Pure TypeScript translation of Verovio functor visitor interfaces.
 *
 * Concrete domain types are represented as `any` contracts until their owning
 * Verovio classes are migrated. Dispatch bodies are translated directly from
 * functorinterface.cpp; no native RTTI/WASM/browser dependency is introduced.
 */
export enum FunctorCode {
  FUNCTOR_CONTINUE = 0,
  FUNCTOR_SIBLINGS = 1,
  FUNCTOR_STOP = 2,
}

export type Accid = any;
export type Alignment = any;
export type AlignmentReference = any;
export type AnchoredText = any;
export type AnnotScore = any;
export type Arpeg = any;
export type Artic = any;
export type BTrem = any;
export type BarLine = any;
export type Beam = any;
export type BeamSpan = any;
export type BeatRpt = any;
export type BracketSpan = any;
export type Breath = any;
export type Caesura = any;
export type Chord = any;
export type Clef = any;
export type ControlElement = any;
export type Course = any;
export type CpMark = any;
export type Cursor = any;
export type Custos = any;
export type Dir = any;
export type Div = any;
export type Doc = any;
export type Dot = any;
export type Dots = any;
export type Dynam = any;
export type EditorialElement = any;
export type Ending = any;
export type Expansion = any;
export type F = any;
export type FTrem = any;
export type Facsimile = any;
export type Fb = any;
export type Fermata = any;
export type Fig = any;
export type Fing = any;
export type Flag = any;
export type FloatingObject = any;
export type GenericLayerElement = any;
export type Gliss = any;
export type GraceAligner = any;
export type GraceGrp = any;
export type Graphic = any;
export type GrpSym = any;
export type Hairpin = any;
export type HalfmRpt = any;
export type Harm = any;
export type HorizontalAligner = any;
export type InstrDef = any;
export type KeyAccid = any;
export type KeySig = any;
export type Label = any;
export type LabelAbbr = any;
export type Layer = any;
export type LayerDef = any;
export type LayerElement = any;
export type Lb = any;
export type Ligature = any;
export type Lv = any;
export type LyricElement = any;
export type MNum = any;
export type MRest = any;
export type MRpt = any;
export type MRpt2 = any;
export type MSpace = any;
export type Mdiv = any;
export type Measure = any;
export type MeasureAligner = any;
export type Mensur = any;
export type MeterSig = any;
export type MeterSigGrp = any;
export type Mordent = any;
export type MultiRest = any;
export type MultiRpt = any;
export type Nc = any;
export type Neume = any;
export type Note = any;
export type Num = any;
export type Object = any;
export type Octave = any;
export type Ornam = any;
export type Ossia = any;
export type Page = any;
export type PageElement = any;
export type PageMilestoneEnd = any;
export type Pages = any;
export type Pb = any;
export type Pedal = any;
export type PgFoot = any;
export type PgHead = any;
export type Phrase = any;
export type PitchInflection = any;
export type Plica = any;
export type Proport = any;
export type Refrain = any;
export type Reh = any;
export type Rend = any;
export type RepeatMark = any;
export type Rest = any;
export type RunningElement = any;
export type Sb = any;
export type Score = any;
export type ScoreDef = any;
export type ScoreDefElement = any;
export type Section = any;
export type Slur = any;
export type Space = any;
export type Staff = any;
export type StaffAlignment = any;
export type StaffDef = any;
export type StaffGrp = any;
export type Stem = any;
export type Surface = any;
export type Svg = any;
export type Syl = any;
export type Syllable = any;
export type Symbol = any;
export type System = any;
export type SystemAligner = any;
export type SystemElement = any;
export type SystemMilestoneEnd = any;
export type TabDurSym = any;
export type TabGrp = any;
export type Tempo = any;
export type Text = any;
export type TextElement = any;
export type TextLayoutElement = any;
export type Tie = any;
export type TimestampAligner = any;
export type TimestampAttr = any;
export type Trill = any;
export type Tuning = any;
export type Tuplet = any;
export type TupletBracket = any;
export type TupletNum = any;
export type Turn = any;
export type Verse = any;
export type Volta = any;
export type Zone = any;

export class FunctorInterface {
  VisitObject(arg: any): FunctorCode { return FunctorCode.FUNCTOR_CONTINUE; }
  VisitObjectEnd(arg: any): FunctorCode { return FunctorCode.FUNCTOR_CONTINUE; }
  VisitDoc(doc: any): FunctorCode {
    return this.VisitObject(doc);
  }
  VisitDocEnd(doc: any): FunctorCode {
    return this.VisitObjectEnd(doc);
  }
  VisitCourse(course: any): FunctorCode {
    return this.VisitObject(course);
  }
  VisitCourseEnd(course: any): FunctorCode {
    return this.VisitObjectEnd(course);
  }
  VisitGrpSym(grpSym: any): FunctorCode {
    return this.VisitObject(grpSym);
  }
  VisitGrpSymEnd(grpSym: any): FunctorCode {
    return this.VisitObjectEnd(grpSym);
  }
  VisitInstrDef(instrDef: any): FunctorCode {
    return this.VisitObject(instrDef);
  }
  VisitInstrDefEnd(instrDef: any): FunctorCode {
    return this.VisitObjectEnd(instrDef);
  }
  VisitLabel(label: any): FunctorCode {
    return this.VisitObject(label);
  }
  VisitLabelEnd(label: any): FunctorCode {
    return this.VisitObjectEnd(label);
  }
  VisitLabelAbbr(labelAbbr: any): FunctorCode {
    return this.VisitObject(labelAbbr);
  }
  VisitLabelAbbrEnd(labelAbbr: any): FunctorCode {
    return this.VisitObjectEnd(labelAbbr);
  }
  VisitLayer(layer: any): FunctorCode {
    return this.VisitObject(layer);
  }
  VisitLayerEnd(layer: any): FunctorCode {
    return this.VisitObjectEnd(layer);
  }
  VisitLayerDef(layerDef: any): FunctorCode {
    return this.VisitObject(layerDef);
  }
  VisitLayerDefEnd(layerDef: any): FunctorCode {
    return this.VisitObjectEnd(layerDef);
  }
  VisitMeasure(measure: any): FunctorCode {
    return this.VisitObject(measure);
  }
  VisitMeasureEnd(measure: any): FunctorCode {
    return this.VisitObjectEnd(measure);
  }
  VisitOssia(ossia: any): FunctorCode {
    return this.VisitObject(ossia);
  }
  VisitOssiaEnd(ossia: any): FunctorCode {
    return this.VisitObjectEnd(ossia);
  }
  VisitPage(page: any): FunctorCode {
    return this.VisitObject(page);
  }
  VisitPageEnd(page: any): FunctorCode {
    return this.VisitObjectEnd(page);
  }
  VisitPages(pages: any): FunctorCode {
    return this.VisitObject(pages);
  }
  VisitPagesEnd(pages: any): FunctorCode {
    return this.VisitObjectEnd(pages);
  }
  VisitPb(pb: any): FunctorCode {
    return this.VisitSystemElement(pb);
  }
  VisitPbEnd(pb: any): FunctorCode {
    return this.VisitSystemElementEnd(pb);
  }
  VisitSb(sb: any): FunctorCode {
    return this.VisitSystemElement(sb);
  }
  VisitSbEnd(sb: any): FunctorCode {
    return this.VisitSystemElementEnd(sb);
  }
  VisitScoreDef(scoreDef: any): FunctorCode {
    return this.VisitScoreDefElement(scoreDef);
  }
  VisitScoreDefEnd(scoreDef: any): FunctorCode {
    return this.VisitScoreDefElementEnd(scoreDef);
  }
  VisitScoreDefElement(scoreDefElement: any): FunctorCode {
    return this.VisitObject(scoreDefElement);
  }
  VisitScoreDefElementEnd(scoreDefElement: any): FunctorCode {
    return this.VisitObjectEnd(scoreDefElement);
  }
  VisitStaff(staff: any): FunctorCode {
    return this.VisitObject(staff);
  }
  VisitStaffEnd(staff: any): FunctorCode {
    return this.VisitObjectEnd(staff);
  }
  VisitStaffDef(staffDef: any): FunctorCode {
    return this.VisitScoreDefElement(staffDef);
  }
  VisitStaffDefEnd(staffDef: any): FunctorCode {
    return this.VisitScoreDefElementEnd(staffDef);
  }
  VisitStaffGrp(staffGrp: any): FunctorCode {
    return this.VisitObject(staffGrp);
  }
  VisitStaffGrpEnd(staffGrp: any): FunctorCode {
    return this.VisitObjectEnd(staffGrp);
  }
  VisitSystem(system: any): FunctorCode {
    return this.VisitObject(system);
  }
  VisitSystemEnd(system: any): FunctorCode {
    return this.VisitObjectEnd(system);
  }
  VisitTuning(tuning: any): FunctorCode {
    return this.VisitObject(tuning);
  }
  VisitTuningEnd(tuning: any): FunctorCode {
    return this.VisitObjectEnd(tuning);
  }
  VisitEditorialElement(editorialElement: any): FunctorCode {
    return this.VisitObject(editorialElement);
  }
  VisitEditorialElementEnd(editorialElement: any): FunctorCode {
    return this.VisitObjectEnd(editorialElement);
  }
  VisitDiv(div: any): FunctorCode {
    return this.VisitTextLayoutElement(div);
  }
  VisitDivEnd(div: any): FunctorCode {
    return this.VisitTextLayoutElementEnd(div);
  }
  VisitRunningElement(runningElement: any): FunctorCode {
    return this.VisitTextLayoutElement(runningElement);
  }
  VisitRunningElementEnd(runningElement: any): FunctorCode {
    return this.VisitTextLayoutElementEnd(runningElement);
  }
  VisitPgHead(pgHead: any): FunctorCode {
    return this.VisitRunningElement(pgHead);
  }
  VisitPgHeadEnd(pgHead: any): FunctorCode {
    return this.VisitRunningElementEnd(pgHead);
  }
  VisitPgFoot(pgFoot: any): FunctorCode {
    return this.VisitRunningElement(pgFoot);
  }
  VisitPgFootEnd(pgFoot: any): FunctorCode {
    return this.VisitRunningElementEnd(pgFoot);
  }
  VisitTextLayoutElement(textLayoutElement: any): FunctorCode {
    return this.VisitObject(textLayoutElement);
  }
  VisitTextLayoutElementEnd(textLayoutElement: any): FunctorCode {
    return this.VisitObjectEnd(textLayoutElement);
  }
  VisitEnding(ending: any): FunctorCode {
    return this.VisitSystemElement(ending);
  }
  VisitEndingEnd(ending: any): FunctorCode {
    return this.VisitSystemElementEnd(ending);
  }
  VisitExpansion(expansion: any): FunctorCode {
    return this.VisitSystemElement(expansion);
  }
  VisitExpansionEnd(expansion: any): FunctorCode {
    return this.VisitSystemElementEnd(expansion);
  }
  VisitSection(section: any): FunctorCode {
    return this.VisitSystemElement(section);
  }
  VisitSectionEnd(section: any): FunctorCode {
    return this.VisitSystemElementEnd(section);
  }
  VisitSystemElement(systemElement: any): FunctorCode {
    return this.VisitFloatingObject(systemElement);
  }
  VisitSystemElementEnd(systemElement: any): FunctorCode {
    return this.VisitFloatingObjectEnd(systemElement);
  }
  VisitSystemMilestone(systemMilestoneEnd: any): FunctorCode {
    return this.VisitSystemElement(systemMilestoneEnd);
  }
  VisitSystemMilestoneEnd(systemMilestoneEnd: any): FunctorCode {
    return this.VisitSystemElementEnd(systemMilestoneEnd);
  }
  VisitMdiv(mdiv: any): FunctorCode {
    return this.VisitPageElement(mdiv);
  }
  VisitMdivEnd(mdiv: any): FunctorCode {
    return this.VisitPageElementEnd(mdiv);
  }
  VisitPageElement(pageElement: any): FunctorCode {
    return this.VisitObject(pageElement);
  }
  VisitPageElementEnd(pageElement: any): FunctorCode {
    return this.VisitObjectEnd(pageElement);
  }
  VisitPageMilestone(pageMilestoneEnd: any): FunctorCode {
    return this.VisitPageElement(pageMilestoneEnd);
  }
  VisitPageMilestoneEnd(pageMilestoneEnd: any): FunctorCode {
    return this.VisitPageElementEnd(pageMilestoneEnd);
  }
  VisitScore(score: any): FunctorCode {
    return this.VisitPageElement(score);
  }
  VisitScoreEnd(score: any): FunctorCode {
    return this.VisitPageElementEnd(score);
  }
  VisitAnchoredText(anchoredText: any): FunctorCode {
    return this.VisitControlElement(anchoredText);
  }
  VisitAnchoredTextEnd(anchoredText: any): FunctorCode {
    return this.VisitControlElementEnd(anchoredText);
  }
  VisitAnnotScore(annotScore: any): FunctorCode {
    return this.VisitControlElement(annotScore);
  }
  VisitAnnotScoreEnd(annotScore: any): FunctorCode {
    return this.VisitControlElementEnd(annotScore);
  }
  VisitArpeg(arpeg: any): FunctorCode {
    return this.VisitControlElement(arpeg);
  }
  VisitArpegEnd(arpeg: any): FunctorCode {
    return this.VisitControlElementEnd(arpeg);
  }
  VisitBeamSpan(beamSpan: any): FunctorCode {
    return this.VisitControlElement(beamSpan);
  }
  VisitBeamSpanEnd(beamSpan: any): FunctorCode {
    return this.VisitControlElementEnd(beamSpan);
  }
  VisitBracketSpan(bracketSpan: any): FunctorCode {
    return this.VisitControlElement(bracketSpan);
  }
  VisitBracketSpanEnd(bracketSpan: any): FunctorCode {
    return this.VisitControlElementEnd(bracketSpan);
  }
  VisitBreath(breath: any): FunctorCode {
    return this.VisitControlElement(breath);
  }
  VisitBreathEnd(breath: any): FunctorCode {
    return this.VisitControlElementEnd(breath);
  }
  VisitCaesura(caesura: any): FunctorCode {
    return this.VisitControlElement(caesura);
  }
  VisitCaesuraEnd(caesura: any): FunctorCode {
    return this.VisitControlElementEnd(caesura);
  }
  VisitControlElement(controlElement: any): FunctorCode {
    return this.VisitFloatingObject(controlElement);
  }
  VisitControlElementEnd(controlElement: any): FunctorCode {
    return this.VisitFloatingObjectEnd(controlElement);
  }
  VisitCpMark(cpMark: any): FunctorCode {
    return this.VisitControlElement(cpMark);
  }
  VisitCpMarkEnd(cpMark: any): FunctorCode {
    return this.VisitControlElementEnd(cpMark);
  }
  VisitDir(dir: any): FunctorCode {
    return this.VisitControlElement(dir);
  }
  VisitDirEnd(dir: any): FunctorCode {
    return this.VisitControlElementEnd(dir);
  }
  VisitDynam(dynam: any): FunctorCode {
    return this.VisitControlElement(dynam);
  }
  VisitDynamEnd(dynam: any): FunctorCode {
    return this.VisitControlElementEnd(dynam);
  }
  VisitFermata(fermata: any): FunctorCode {
    return this.VisitControlElement(fermata);
  }
  VisitFermataEnd(fermata: any): FunctorCode {
    return this.VisitControlElementEnd(fermata);
  }
  VisitFing(fing: any): FunctorCode {
    return this.VisitControlElement(fing);
  }
  VisitFingEnd(fing: any): FunctorCode {
    return this.VisitControlElementEnd(fing);
  }
  VisitGliss(gliss: any): FunctorCode {
    return this.VisitControlElement(gliss);
  }
  VisitGlissEnd(gliss: any): FunctorCode {
    return this.VisitControlElementEnd(gliss);
  }
  VisitHairpin(hairpin: any): FunctorCode {
    return this.VisitControlElement(hairpin);
  }
  VisitHairpinEnd(hairpin: any): FunctorCode {
    return this.VisitControlElementEnd(hairpin);
  }
  VisitHarm(harm: any): FunctorCode {
    return this.VisitControlElement(harm);
  }
  VisitHarmEnd(harm: any): FunctorCode {
    return this.VisitControlElementEnd(harm);
  }
  VisitLv(lv: any): FunctorCode {
    return this.VisitTie(lv);
  }
  VisitLvEnd(lv: any): FunctorCode {
    return this.VisitTieEnd(lv);
  }
  VisitMordent(mordent: any): FunctorCode {
    return this.VisitControlElement(mordent);
  }
  VisitMordentEnd(mordent: any): FunctorCode {
    return this.VisitControlElementEnd(mordent);
  }
  VisitOctave(octave: any): FunctorCode {
    return this.VisitControlElement(octave);
  }
  VisitOctaveEnd(octave: any): FunctorCode {
    return this.VisitControlElementEnd(octave);
  }
  VisitOrnam(ornam: any): FunctorCode {
    return this.VisitControlElement(ornam);
  }
  VisitOrnamEnd(ornam: any): FunctorCode {
    return this.VisitControlElementEnd(ornam);
  }
  VisitPedal(pedal: any): FunctorCode {
    return this.VisitControlElement(pedal);
  }
  VisitPedalEnd(pedal: any): FunctorCode {
    return this.VisitControlElementEnd(pedal);
  }
  VisitPhrase(phrase: any): FunctorCode {
    return this.VisitSlur(phrase);
  }
  VisitPhraseEnd(phrase: any): FunctorCode {
    return this.VisitSlurEnd(phrase);
  }
  VisitPitchInflection(pitchInflection: any): FunctorCode {
    return this.VisitControlElement(pitchInflection);
  }
  VisitPitchInflectionEnd(pitchInflection: any): FunctorCode {
    return this.VisitControlElementEnd(pitchInflection);
  }
  VisitReh(reh: any): FunctorCode {
    return this.VisitControlElement(reh);
  }
  VisitRehEnd(reh: any): FunctorCode {
    return this.VisitControlElementEnd(reh);
  }
  VisitRepeatMark(repeatMark: any): FunctorCode {
    return this.VisitControlElement(repeatMark);
  }
  VisitRepeatMarkEnd(repeatMark: any): FunctorCode {
    return this.VisitControlElementEnd(repeatMark);
  }
  VisitSlur(slur: any): FunctorCode {
    return this.VisitControlElement(slur);
  }
  VisitSlurEnd(slur: any): FunctorCode {
    return this.VisitControlElementEnd(slur);
  }
  VisitTempo(tempo: any): FunctorCode {
    return this.VisitControlElement(tempo);
  }
  VisitTempoEnd(tempo: any): FunctorCode {
    return this.VisitControlElementEnd(tempo);
  }
  VisitTie(tie: any): FunctorCode {
    return this.VisitControlElement(tie);
  }
  VisitTieEnd(tie: any): FunctorCode {
    return this.VisitControlElementEnd(tie);
  }
  VisitTrill(trill: any): FunctorCode {
    return this.VisitControlElement(trill);
  }
  VisitTrillEnd(trill: any): FunctorCode {
    return this.VisitControlElementEnd(trill);
  }
  VisitTurn(turn: any): FunctorCode {
    return this.VisitControlElement(turn);
  }
  VisitTurnEnd(turn: any): FunctorCode {
    return this.VisitControlElementEnd(turn);
  }
  VisitAccid(accid: any): FunctorCode {
    return this.VisitLayerElement(accid);
  }
  VisitAccidEnd(accid: any): FunctorCode {
    return this.VisitLayerElementEnd(accid);
  }
  VisitArtic(artic: any): FunctorCode {
    return this.VisitLayerElement(artic);
  }
  VisitArticEnd(artic: any): FunctorCode {
    return this.VisitLayerElementEnd(artic);
  }
  VisitBarLine(barLine: any): FunctorCode {
    return this.VisitLayerElement(barLine);
  }
  VisitBarLineEnd(barLine: any): FunctorCode {
    return this.VisitLayerElementEnd(barLine);
  }
  VisitBeam(beam: any): FunctorCode {
    return this.VisitLayerElement(beam);
  }
  VisitBeamEnd(beam: any): FunctorCode {
    return this.VisitLayerElementEnd(beam);
  }
  VisitBeatRpt(beatRpt: any): FunctorCode {
    return this.VisitLayerElement(beatRpt);
  }
  VisitBeatRptEnd(beatRpt: any): FunctorCode {
    return this.VisitLayerElementEnd(beatRpt);
  }
  VisitBTrem(bTrem: any): FunctorCode {
    return this.VisitLayerElement(bTrem);
  }
  VisitBTremEnd(bTrem: any): FunctorCode {
    return this.VisitLayerElementEnd(bTrem);
  }
  VisitChord(chord: any): FunctorCode {
    return this.VisitLayerElement(chord);
  }
  VisitChordEnd(chord: any): FunctorCode {
    return this.VisitLayerElementEnd(chord);
  }
  VisitClef(clef: any): FunctorCode {
    return this.VisitLayerElement(clef);
  }
  VisitClefEnd(clef: any): FunctorCode {
    return this.VisitLayerElementEnd(clef);
  }
  VisitCursor(cursor: any): FunctorCode {
    return this.VisitLayerElement(cursor);
  }
  VisitCursorEnd(cursor: any): FunctorCode {
    return this.VisitLayerElementEnd(cursor);
  }
  VisitCustos(custos: any): FunctorCode {
    return this.VisitLayerElement(custos);
  }
  VisitCustosEnd(custos: any): FunctorCode {
    return this.VisitLayerElementEnd(custos);
  }
  VisitDot(dot: any): FunctorCode {
    return this.VisitLayerElement(dot);
  }
  VisitDotEnd(dot: any): FunctorCode {
    return this.VisitLayerElementEnd(dot);
  }
  VisitDots(dots: any): FunctorCode {
    return this.VisitLayerElement(dots);
  }
  VisitDotsEnd(dots: any): FunctorCode {
    return this.VisitLayerElementEnd(dots);
  }
  VisitFlag(flag: any): FunctorCode {
    return this.VisitLayerElement(flag);
  }
  VisitFlagEnd(flag: any): FunctorCode {
    return this.VisitLayerElementEnd(flag);
  }
  VisitFTrem(fTrem: any): FunctorCode {
    return this.VisitLayerElement(fTrem);
  }
  VisitFTremEnd(fTrem: any): FunctorCode {
    return this.VisitLayerElementEnd(fTrem);
  }
  VisitGraceGrp(graceGrp: any): FunctorCode {
    return this.VisitLayerElement(graceGrp);
  }
  VisitGraceGrpEnd(graceGrp: any): FunctorCode {
    return this.VisitLayerElementEnd(graceGrp);
  }
  VisitGenericLayerElement(genericLayerElement: any): FunctorCode {
    return this.VisitLayerElement(genericLayerElement);
  }
  VisitGenericLayerElementEnd(genericLayerElement: any): FunctorCode {
    return this.VisitLayerElementEnd(genericLayerElement);
  }
  VisitHalfmRpt(halfmRpt: any): FunctorCode {
    return this.VisitLayerElement(halfmRpt);
  }
  VisitHalfmRptEnd(halfmRpt: any): FunctorCode {
    return this.VisitLayerElementEnd(halfmRpt);
  }
  VisitKeyAccid(keyAccid: any): FunctorCode {
    return this.VisitLayerElement(keyAccid);
  }
  VisitKeyAccidEnd(keyAccid: any): FunctorCode {
    return this.VisitLayerElementEnd(keyAccid);
  }
  VisitKeySig(keySig: any): FunctorCode {
    return this.VisitLayerElement(keySig);
  }
  VisitKeySigEnd(keySig: any): FunctorCode {
    return this.VisitLayerElementEnd(keySig);
  }
  VisitLayerElement(layerElement: any): FunctorCode {
    return this.VisitObject(layerElement);
  }
  VisitLayerElementEnd(layerElement: any): FunctorCode {
    return this.VisitObjectEnd(layerElement);
  }
  VisitLyricElement(lyricElement: any): FunctorCode {
    return this.VisitLayerElement(lyricElement);
  }
  VisitLyricElementEnd(lyricElement: any): FunctorCode {
    return this.VisitLayerElementEnd(lyricElement);
  }
  VisitLigature(ligature: any): FunctorCode {
    return this.VisitLayerElement(ligature);
  }
  VisitLigatureEnd(ligature: any): FunctorCode {
    return this.VisitLayerElementEnd(ligature);
  }
  VisitMensur(mensur: any): FunctorCode {
    return this.VisitLayerElement(mensur);
  }
  VisitMensurEnd(mensur: any): FunctorCode {
    return this.VisitLayerElementEnd(mensur);
  }
  VisitMeterSig(meterSig: any): FunctorCode {
    return this.VisitLayerElement(meterSig);
  }
  VisitMeterSigEnd(meterSig: any): FunctorCode {
    return this.VisitLayerElementEnd(meterSig);
  }
  VisitMeterSigGrp(meterSigGrp: any): FunctorCode {
    return this.VisitLayerElement(meterSigGrp);
  }
  VisitMeterSigGrpEnd(meterSigGrp: any): FunctorCode {
    return this.VisitLayerElementEnd(meterSigGrp);
  }
  VisitMRest(mRest: any): FunctorCode {
    return this.VisitLayerElement(mRest);
  }
  VisitMRestEnd(mRest: any): FunctorCode {
    return this.VisitLayerElementEnd(mRest);
  }
  VisitMRpt(mRpt: any): FunctorCode {
    return this.VisitLayerElement(mRpt);
  }
  VisitMRptEnd(mRpt: any): FunctorCode {
    return this.VisitLayerElementEnd(mRpt);
  }
  VisitMRpt2(mRpt2: any): FunctorCode {
    return this.VisitLayerElement(mRpt2);
  }
  VisitMRpt2End(mRpt2: any): FunctorCode {
    return this.VisitLayerElementEnd(mRpt2);
  }
  VisitMSpace(mSpace: any): FunctorCode {
    return this.VisitLayerElement(mSpace);
  }
  VisitMSpaceEnd(mSpace: any): FunctorCode {
    return this.VisitLayerElementEnd(mSpace);
  }
  VisitMultiRest(multiRest: any): FunctorCode {
    return this.VisitLayerElement(multiRest);
  }
  VisitMultiRestEnd(multiRest: any): FunctorCode {
    return this.VisitLayerElementEnd(multiRest);
  }
  VisitMultiRpt(multiRpt: any): FunctorCode {
    return this.VisitLayerElement(multiRpt);
  }
  VisitMultiRptEnd(multiRpt: any): FunctorCode {
    return this.VisitLayerElementEnd(multiRpt);
  }
  VisitNc(nc: any): FunctorCode {
    return this.VisitLayerElement(nc);
  }
  VisitNcEnd(nc: any): FunctorCode {
    return this.VisitLayerElementEnd(nc);
  }
  VisitNeume(neume: any): FunctorCode {
    return this.VisitLayerElement(neume);
  }
  VisitNeumeEnd(neume: any): FunctorCode {
    return this.VisitLayerElementEnd(neume);
  }
  VisitNote(note: any): FunctorCode {
    return this.VisitLayerElement(note);
  }
  VisitNoteEnd(note: any): FunctorCode {
    return this.VisitLayerElementEnd(note);
  }
  VisitPlica(plica: any): FunctorCode {
    return this.VisitLayerElement(plica);
  }
  VisitPlicaEnd(plica: any): FunctorCode {
    return this.VisitLayerElementEnd(plica);
  }
  VisitProport(proport: any): FunctorCode {
    return this.VisitLayerElement(proport);
  }
  VisitProportEnd(proport: any): FunctorCode {
    return this.VisitLayerElementEnd(proport);
  }
  VisitRest(rest: any): FunctorCode {
    return this.VisitLayerElement(rest);
  }
  VisitRestEnd(rest: any): FunctorCode {
    return this.VisitLayerElementEnd(rest);
  }
  VisitSpace(space: any): FunctorCode {
    return this.VisitLayerElement(space);
  }
  VisitSpaceEnd(space: any): FunctorCode {
    return this.VisitLayerElementEnd(space);
  }
  VisitStem(stem: any): FunctorCode {
    return this.VisitLayerElement(stem);
  }
  VisitStemEnd(stem: any): FunctorCode {
    return this.VisitLayerElementEnd(stem);
  }
  VisitSyl(syl: any): FunctorCode {
    return this.VisitLayerElement(syl);
  }
  VisitSylEnd(syl: any): FunctorCode {
    return this.VisitLayerElementEnd(syl);
  }
  VisitSyllable(syllable: any): FunctorCode {
    return this.VisitLayerElement(syllable);
  }
  VisitSyllableEnd(syllable: any): FunctorCode {
    return this.VisitLayerElementEnd(syllable);
  }
  VisitTabDurSym(tabDurSym: any): FunctorCode {
    return this.VisitLayerElement(tabDurSym);
  }
  VisitTabDurSymEnd(tabDurSym: any): FunctorCode {
    return this.VisitLayerElementEnd(tabDurSym);
  }
  VisitTabGrp(tabGrp: any): FunctorCode {
    return this.VisitLayerElement(tabGrp);
  }
  VisitTabGrpEnd(tabGrp: any): FunctorCode {
    return this.VisitLayerElementEnd(tabGrp);
  }
  VisitTimestamp(timeStamp: any): FunctorCode {
    return this.VisitLayerElement(timeStamp);
  }
  VisitTimestampEnd(timeStamp: any): FunctorCode {
    return this.VisitLayerElementEnd(timeStamp);
  }
  VisitTuplet(tuplet: any): FunctorCode {
    return this.VisitLayerElement(tuplet);
  }
  VisitTupletEnd(tuplet: any): FunctorCode {
    return this.VisitLayerElementEnd(tuplet);
  }
  VisitTupletBracket(tupletBracket: any): FunctorCode {
    return this.VisitLayerElement(tupletBracket);
  }
  VisitTupletBracketEnd(tupletBracket: any): FunctorCode {
    return this.VisitLayerElementEnd(tupletBracket);
  }
  VisitTupletNum(tupletNum: any): FunctorCode {
    return this.VisitLayerElement(tupletNum);
  }
  VisitTupletNumEnd(tupletNum: any): FunctorCode {
    return this.VisitLayerElementEnd(tupletNum);
  }
  VisitVolta(volta: any): FunctorCode {
    return this.VisitLayerElement(volta);
  }
  VisitVoltaEnd(volta: any): FunctorCode {
    return this.VisitLayerElementEnd(volta);
  }
  VisitRefrain(refrain: any): FunctorCode {
    return this.VisitLyricElement(refrain);
  }
  VisitRefrainEnd(refrain: any): FunctorCode {
    return this.VisitLyricElementEnd(refrain);
  }
  VisitVerse(verse: any): FunctorCode {
    return this.VisitLyricElement(verse);
  }
  VisitVerseEnd(verse: any): FunctorCode {
    return this.VisitLyricElementEnd(verse);
  }
  VisitF(f: any): FunctorCode {
    return this.VisitTextElement(f);
  }
  VisitFEnd(f: any): FunctorCode {
    return this.VisitTextElementEnd(f);
  }
  VisitFb(fb: any): FunctorCode {
    return this.VisitObject(fb);
  }
  VisitFbEnd(fb: any): FunctorCode {
    return this.VisitObjectEnd(fb);
  }
  VisitFig(fig: any): FunctorCode {
    return this.VisitTextElement(fig);
  }
  VisitFigEnd(fig: any): FunctorCode {
    return this.VisitTextElementEnd(fig);
  }
  VisitLb(lb: any): FunctorCode {
    return this.VisitTextElement(lb);
  }
  VisitLbEnd(lb: any): FunctorCode {
    return this.VisitTextElementEnd(lb);
  }
  VisitMNum(mNum: any): FunctorCode {
    return this.VisitControlElement(mNum);
  }
  VisitMNumEnd(mNum: any): FunctorCode {
    return this.VisitControlElementEnd(mNum);
  }
  VisitNum(num: any): FunctorCode {
    return this.VisitTextElement(num);
  }
  VisitNumEnd(num: any): FunctorCode {
    return this.VisitTextElementEnd(num);
  }
  VisitRend(rend: any): FunctorCode {
    return this.VisitTextElement(rend);
  }
  VisitRendEnd(rend: any): FunctorCode {
    return this.VisitTextElementEnd(rend);
  }
  VisitSvg(svg: any): FunctorCode {
    return this.VisitObject(svg);
  }
  VisitSvgEnd(svg: any): FunctorCode {
    return this.VisitObjectEnd(svg);
  }
  VisitSymbol(symbol: any): FunctorCode {
    return this.VisitTextElement(symbol);
  }
  VisitSymbolEnd(symbol: any): FunctorCode {
    return this.VisitTextElementEnd(symbol);
  }
  VisitText(text: any): FunctorCode {
    return this.VisitTextElement(text);
  }
  VisitTextEnd(text: any): FunctorCode {
    return this.VisitTextElementEnd(text);
  }
  VisitTextElement(textElement: any): FunctorCode {
    return this.VisitObject(textElement);
  }
  VisitTextElementEnd(textElement: any): FunctorCode {
    return this.VisitObjectEnd(textElement);
  }
  VisitFacsimile(facsimile: any): FunctorCode {
    return this.VisitObject(facsimile);
  }
  VisitFacsimileEnd(facsimile: any): FunctorCode {
    return this.VisitObjectEnd(facsimile);
  }
  VisitGraphic(graphic: any): FunctorCode {
    return this.VisitObject(graphic);
  }
  VisitGraphicEnd(graphic: any): FunctorCode {
    return this.VisitObjectEnd(graphic);
  }
  VisitSurface(surface: any): FunctorCode {
    return this.VisitObject(surface);
  }
  VisitSurfaceEnd(surface: any): FunctorCode {
    return this.VisitObjectEnd(surface);
  }
  VisitZone(zone: any): FunctorCode {
    return this.VisitObject(zone);
  }
  VisitZoneEnd(zone: any): FunctorCode {
    return this.VisitObjectEnd(zone);
  }
  VisitAlignment(alignment: any): FunctorCode {
    return this.VisitObject(alignment);
  }
  VisitAlignmentEnd(alignment: any): FunctorCode {
    return this.VisitObjectEnd(alignment);
  }
  VisitAlignmentReference(alignmentReference: any): FunctorCode {
    return this.VisitObject(alignmentReference);
  }
  VisitAlignmentReferenceEnd(alignmentReference: any): FunctorCode {
    return this.VisitObjectEnd(alignmentReference);
  }
  VisitHorizontalAligner(horizontalAligner: any): FunctorCode {
    return this.VisitObject(horizontalAligner);
  }
  VisitHorizontalAlignerEnd(horizontalAligner: any): FunctorCode {
    return this.VisitObjectEnd(horizontalAligner);
  }
  VisitMeasureAligner(measureAligner: any): FunctorCode {
    return this.VisitHorizontalAligner(measureAligner);
  }
  VisitMeasureAlignerEnd(measureAligner: any): FunctorCode {
    return this.VisitHorizontalAlignerEnd(measureAligner);
  }
  VisitGraceAligner(graceAligner: any): FunctorCode {
    return this.VisitHorizontalAligner(graceAligner);
  }
  VisitGraceAlignerEnd(graceAligner: any): FunctorCode {
    return this.VisitHorizontalAlignerEnd(graceAligner);
  }
  VisitTimestampAligner(timestampAligner: any): FunctorCode {
    return this.VisitObject(timestampAligner);
  }
  VisitTimestampAlignerEnd(timestampAligner: any): FunctorCode {
    return this.VisitObjectEnd(timestampAligner);
  }
  VisitSystemAligner(systemAligner: any): FunctorCode {
    return this.VisitObject(systemAligner);
  }
  VisitSystemAlignerEnd(systemAligner: any): FunctorCode {
    return this.VisitObjectEnd(systemAligner);
  }
  VisitStaffAlignment(staffAlignment: any): FunctorCode {
    return this.VisitObject(staffAlignment);
  }
  VisitStaffAlignmentEnd(staffAlignment: any): FunctorCode {
    return this.VisitObjectEnd(staffAlignment);
  }
  VisitFloatingObject(floatingObject: any): FunctorCode {
    return this.VisitObject(floatingObject);
  }
  VisitFloatingObjectEnd(floatingObject: any): FunctorCode {
    return this.VisitObjectEnd(floatingObject);
  }
}

export class ConstFunctorInterface {
  VisitObject(arg: any): FunctorCode { return FunctorCode.FUNCTOR_CONTINUE; }
  VisitObjectEnd(arg: any): FunctorCode { return FunctorCode.FUNCTOR_CONTINUE; }
  VisitDoc(doc: any): FunctorCode {
    return this.VisitObject(doc);
  }
  VisitDocEnd(doc: any): FunctorCode {
    return this.VisitObjectEnd(doc);
  }
  VisitCourse(course: any): FunctorCode {
    return this.VisitObject(course);
  }
  VisitCourseEnd(course: any): FunctorCode {
    return this.VisitObjectEnd(course);
  }
  VisitGrpSym(grpSym: any): FunctorCode {
    return this.VisitObject(grpSym);
  }
  VisitGrpSymEnd(grpSym: any): FunctorCode {
    return this.VisitObjectEnd(grpSym);
  }
  VisitInstrDef(instrDef: any): FunctorCode {
    return this.VisitObject(instrDef);
  }
  VisitInstrDefEnd(instrDef: any): FunctorCode {
    return this.VisitObjectEnd(instrDef);
  }
  VisitLabel(label: any): FunctorCode {
    return this.VisitObject(label);
  }
  VisitLabelEnd(label: any): FunctorCode {
    return this.VisitObjectEnd(label);
  }
  VisitLabelAbbr(labelAbbr: any): FunctorCode {
    return this.VisitObject(labelAbbr);
  }
  VisitLabelAbbrEnd(labelAbbr: any): FunctorCode {
    return this.VisitObjectEnd(labelAbbr);
  }
  VisitLayer(layer: any): FunctorCode {
    return this.VisitObject(layer);
  }
  VisitLayerEnd(layer: any): FunctorCode {
    return this.VisitObjectEnd(layer);
  }
  VisitLayerDef(layerDef: any): FunctorCode {
    return this.VisitObject(layerDef);
  }
  VisitLayerDefEnd(layerDef: any): FunctorCode {
    return this.VisitObjectEnd(layerDef);
  }
  VisitMeasure(measure: any): FunctorCode {
    return this.VisitObject(measure);
  }
  VisitMeasureEnd(measure: any): FunctorCode {
    return this.VisitObjectEnd(measure);
  }
  VisitOssia(ossia: any): FunctorCode {
    return this.VisitObject(ossia);
  }
  VisitOssiaEnd(ossia: any): FunctorCode {
    return this.VisitObjectEnd(ossia);
  }
  VisitPage(page: any): FunctorCode {
    return this.VisitObject(page);
  }
  VisitPageEnd(page: any): FunctorCode {
    return this.VisitObjectEnd(page);
  }
  VisitPages(pages: any): FunctorCode {
    return this.VisitObject(pages);
  }
  VisitPagesEnd(pages: any): FunctorCode {
    return this.VisitObjectEnd(pages);
  }
  VisitPb(pb: any): FunctorCode {
    return this.VisitSystemElement(pb);
  }
  VisitPbEnd(pb: any): FunctorCode {
    return this.VisitSystemElementEnd(pb);
  }
  VisitSb(sb: any): FunctorCode {
    return this.VisitSystemElement(sb);
  }
  VisitSbEnd(sb: any): FunctorCode {
    return this.VisitSystemElementEnd(sb);
  }
  VisitScoreDef(scoreDef: any): FunctorCode {
    return this.VisitScoreDefElement(scoreDef);
  }
  VisitScoreDefEnd(scoreDef: any): FunctorCode {
    return this.VisitScoreDefElementEnd(scoreDef);
  }
  VisitScoreDefElement(scoreDefElement: any): FunctorCode {
    return this.VisitObject(scoreDefElement);
  }
  VisitScoreDefElementEnd(scoreDefElement: any): FunctorCode {
    return this.VisitObjectEnd(scoreDefElement);
  }
  VisitStaff(staff: any): FunctorCode {
    return this.VisitObject(staff);
  }
  VisitStaffEnd(staff: any): FunctorCode {
    return this.VisitObjectEnd(staff);
  }
  VisitStaffDef(staffDef: any): FunctorCode {
    return this.VisitScoreDefElement(staffDef);
  }
  VisitStaffDefEnd(staffDef: any): FunctorCode {
    return this.VisitScoreDefElementEnd(staffDef);
  }
  VisitStaffGrp(staffGrp: any): FunctorCode {
    return this.VisitObject(staffGrp);
  }
  VisitStaffGrpEnd(staffGrp: any): FunctorCode {
    return this.VisitObjectEnd(staffGrp);
  }
  VisitSystem(system: any): FunctorCode {
    return this.VisitObject(system);
  }
  VisitSystemEnd(system: any): FunctorCode {
    return this.VisitObjectEnd(system);
  }
  VisitTuning(tuning: any): FunctorCode {
    return this.VisitObject(tuning);
  }
  VisitTuningEnd(tuning: any): FunctorCode {
    return this.VisitObjectEnd(tuning);
  }
  VisitEditorialElement(editorialElement: any): FunctorCode {
    return this.VisitObject(editorialElement);
  }
  VisitEditorialElementEnd(editorialElement: any): FunctorCode {
    return this.VisitObjectEnd(editorialElement);
  }
  VisitDiv(div: any): FunctorCode {
    return this.VisitTextLayoutElement(div);
  }
  VisitDivEnd(div: any): FunctorCode {
    return this.VisitTextLayoutElementEnd(div);
  }
  VisitRunningElement(runningElement: any): FunctorCode {
    return this.VisitTextLayoutElement(runningElement);
  }
  VisitRunningElementEnd(runningElement: any): FunctorCode {
    return this.VisitTextLayoutElementEnd(runningElement);
  }
  VisitPgHead(pgHead: any): FunctorCode {
    return this.VisitRunningElement(pgHead);
  }
  VisitPgHeadEnd(pgHead: any): FunctorCode {
    return this.VisitRunningElementEnd(pgHead);
  }
  VisitPgFoot(pgFoot: any): FunctorCode {
    return this.VisitRunningElement(pgFoot);
  }
  VisitPgFootEnd(pgFoot: any): FunctorCode {
    return this.VisitRunningElementEnd(pgFoot);
  }
  VisitTextLayoutElement(textLayoutElement: any): FunctorCode {
    return this.VisitObject(textLayoutElement);
  }
  VisitTextLayoutElementEnd(textLayoutElement: any): FunctorCode {
    return this.VisitObjectEnd(textLayoutElement);
  }
  VisitEnding(ending: any): FunctorCode {
    return this.VisitSystemElement(ending);
  }
  VisitEndingEnd(ending: any): FunctorCode {
    return this.VisitSystemElementEnd(ending);
  }
  VisitExpansion(expansion: any): FunctorCode {
    return this.VisitSystemElement(expansion);
  }
  VisitExpansionEnd(expansion: any): FunctorCode {
    return this.VisitSystemElementEnd(expansion);
  }
  VisitSection(section: any): FunctorCode {
    return this.VisitSystemElement(section);
  }
  VisitSectionEnd(section: any): FunctorCode {
    return this.VisitSystemElementEnd(section);
  }
  VisitSystemElement(systemElement: any): FunctorCode {
    return this.VisitFloatingObject(systemElement);
  }
  VisitSystemElementEnd(systemElement: any): FunctorCode {
    return this.VisitFloatingObjectEnd(systemElement);
  }
  VisitSystemMilestone(systemMilestoneEnd: any): FunctorCode {
    return this.VisitSystemElement(systemMilestoneEnd);
  }
  VisitSystemMilestoneEnd(systemMilestoneEnd: any): FunctorCode {
    return this.VisitSystemElementEnd(systemMilestoneEnd);
  }
  VisitMdiv(mdiv: any): FunctorCode {
    return this.VisitPageElement(mdiv);
  }
  VisitMdivEnd(mdiv: any): FunctorCode {
    return this.VisitPageElementEnd(mdiv);
  }
  VisitPageElement(pageElement: any): FunctorCode {
    return this.VisitObject(pageElement);
  }
  VisitPageElementEnd(pageElement: any): FunctorCode {
    return this.VisitObjectEnd(pageElement);
  }
  VisitPageMilestone(pageMilestoneEnd: any): FunctorCode {
    return this.VisitPageElement(pageMilestoneEnd);
  }
  VisitPageMilestoneEnd(pageMilestoneEnd: any): FunctorCode {
    return this.VisitPageElementEnd(pageMilestoneEnd);
  }
  VisitScore(score: any): FunctorCode {
    return this.VisitPageElement(score);
  }
  VisitScoreEnd(score: any): FunctorCode {
    return this.VisitPageElementEnd(score);
  }
  VisitAnchoredText(anchoredText: any): FunctorCode {
    return this.VisitControlElement(anchoredText);
  }
  VisitAnchoredTextEnd(anchoredText: any): FunctorCode {
    return this.VisitControlElementEnd(anchoredText);
  }
  VisitAnnotScore(annotScore: any): FunctorCode {
    return this.VisitControlElement(annotScore);
  }
  VisitAnnotScoreEnd(annotScore: any): FunctorCode {
    return this.VisitControlElementEnd(annotScore);
  }
  VisitArpeg(arpeg: any): FunctorCode {
    return this.VisitControlElement(arpeg);
  }
  VisitArpegEnd(arpeg: any): FunctorCode {
    return this.VisitControlElementEnd(arpeg);
  }
  VisitBeamSpan(beamSpan: any): FunctorCode {
    return this.VisitControlElement(beamSpan);
  }
  VisitBeamSpanEnd(beamSpan: any): FunctorCode {
    return this.VisitControlElementEnd(beamSpan);
  }
  VisitBracketSpan(bracketSpan: any): FunctorCode {
    return this.VisitControlElement(bracketSpan);
  }
  VisitBracketSpanEnd(bracketSpan: any): FunctorCode {
    return this.VisitControlElementEnd(bracketSpan);
  }
  VisitBreath(breath: any): FunctorCode {
    return this.VisitControlElement(breath);
  }
  VisitBreathEnd(breath: any): FunctorCode {
    return this.VisitControlElementEnd(breath);
  }
  VisitCaesura(caesura: any): FunctorCode {
    return this.VisitControlElement(caesura);
  }
  VisitCaesuraEnd(caesura: any): FunctorCode {
    return this.VisitControlElementEnd(caesura);
  }
  VisitControlElement(controlElement: any): FunctorCode {
    return this.VisitFloatingObject(controlElement);
  }
  VisitControlElementEnd(controlElement: any): FunctorCode {
    return this.VisitFloatingObjectEnd(controlElement);
  }
  VisitCpMark(cpMark: any): FunctorCode {
    return this.VisitControlElement(cpMark);
  }
  VisitCpMarkEnd(cpMark: any): FunctorCode {
    return this.VisitControlElementEnd(cpMark);
  }
  VisitDir(dir: any): FunctorCode {
    return this.VisitControlElement(dir);
  }
  VisitDirEnd(dir: any): FunctorCode {
    return this.VisitControlElementEnd(dir);
  }
  VisitDynam(dynam: any): FunctorCode {
    return this.VisitControlElement(dynam);
  }
  VisitDynamEnd(dynam: any): FunctorCode {
    return this.VisitControlElementEnd(dynam);
  }
  VisitFermata(fermata: any): FunctorCode {
    return this.VisitControlElement(fermata);
  }
  VisitFermataEnd(fermata: any): FunctorCode {
    return this.VisitControlElementEnd(fermata);
  }
  VisitFing(fing: any): FunctorCode {
    return this.VisitControlElement(fing);
  }
  VisitFingEnd(fing: any): FunctorCode {
    return this.VisitControlElementEnd(fing);
  }
  VisitGliss(gliss: any): FunctorCode {
    return this.VisitControlElement(gliss);
  }
  VisitGlissEnd(gliss: any): FunctorCode {
    return this.VisitControlElementEnd(gliss);
  }
  VisitHairpin(hairpin: any): FunctorCode {
    return this.VisitControlElement(hairpin);
  }
  VisitHairpinEnd(hairpin: any): FunctorCode {
    return this.VisitControlElementEnd(hairpin);
  }
  VisitHarm(harm: any): FunctorCode {
    return this.VisitControlElement(harm);
  }
  VisitHarmEnd(harm: any): FunctorCode {
    return this.VisitControlElementEnd(harm);
  }
  VisitLv(lv: any): FunctorCode {
    return this.VisitTie(lv);
  }
  VisitLvEnd(lv: any): FunctorCode {
    return this.VisitTieEnd(lv);
  }
  VisitMordent(mordent: any): FunctorCode {
    return this.VisitControlElement(mordent);
  }
  VisitMordentEnd(mordent: any): FunctorCode {
    return this.VisitControlElementEnd(mordent);
  }
  VisitOctave(octave: any): FunctorCode {
    return this.VisitControlElement(octave);
  }
  VisitOctaveEnd(octave: any): FunctorCode {
    return this.VisitControlElementEnd(octave);
  }
  VisitOrnam(ornam: any): FunctorCode {
    return this.VisitControlElement(ornam);
  }
  VisitOrnamEnd(ornam: any): FunctorCode {
    return this.VisitControlElementEnd(ornam);
  }
  VisitPedal(pedal: any): FunctorCode {
    return this.VisitControlElement(pedal);
  }
  VisitPedalEnd(pedal: any): FunctorCode {
    return this.VisitControlElementEnd(pedal);
  }
  VisitPhrase(phrase: any): FunctorCode {
    return this.VisitSlur(phrase);
  }
  VisitPhraseEnd(phrase: any): FunctorCode {
    return this.VisitSlurEnd(phrase);
  }
  VisitPitchInflection(pitchInflection: any): FunctorCode {
    return this.VisitControlElement(pitchInflection);
  }
  VisitPitchInflectionEnd(pitchInflection: any): FunctorCode {
    return this.VisitControlElementEnd(pitchInflection);
  }
  VisitReh(reh: any): FunctorCode {
    return this.VisitControlElement(reh);
  }
  VisitRehEnd(reh: any): FunctorCode {
    return this.VisitControlElementEnd(reh);
  }
  VisitRepeatMark(repeatMark: any): FunctorCode {
    return this.VisitControlElement(repeatMark);
  }
  VisitRepeatMarkEnd(repeatMark: any): FunctorCode {
    return this.VisitControlElementEnd(repeatMark);
  }
  VisitSlur(slur: any): FunctorCode {
    return this.VisitControlElement(slur);
  }
  VisitSlurEnd(slur: any): FunctorCode {
    return this.VisitControlElementEnd(slur);
  }
  VisitTempo(tempo: any): FunctorCode {
    return this.VisitControlElement(tempo);
  }
  VisitTempoEnd(tempo: any): FunctorCode {
    return this.VisitControlElementEnd(tempo);
  }
  VisitTie(tie: any): FunctorCode {
    return this.VisitControlElement(tie);
  }
  VisitTieEnd(tie: any): FunctorCode {
    return this.VisitControlElementEnd(tie);
  }
  VisitTrill(trill: any): FunctorCode {
    return this.VisitControlElement(trill);
  }
  VisitTrillEnd(trill: any): FunctorCode {
    return this.VisitControlElementEnd(trill);
  }
  VisitTurn(turn: any): FunctorCode {
    return this.VisitControlElement(turn);
  }
  VisitTurnEnd(turn: any): FunctorCode {
    return this.VisitControlElementEnd(turn);
  }
  VisitAccid(accid: any): FunctorCode {
    return this.VisitLayerElement(accid);
  }
  VisitAccidEnd(accid: any): FunctorCode {
    return this.VisitLayerElementEnd(accid);
  }
  VisitArtic(artic: any): FunctorCode {
    return this.VisitLayerElement(artic);
  }
  VisitArticEnd(artic: any): FunctorCode {
    return this.VisitLayerElementEnd(artic);
  }
  VisitBarLine(barLine: any): FunctorCode {
    return this.VisitLayerElement(barLine);
  }
  VisitBarLineEnd(barLine: any): FunctorCode {
    return this.VisitLayerElementEnd(barLine);
  }
  VisitBeam(beam: any): FunctorCode {
    return this.VisitLayerElement(beam);
  }
  VisitBeamEnd(beam: any): FunctorCode {
    return this.VisitLayerElementEnd(beam);
  }
  VisitBeatRpt(beatRpt: any): FunctorCode {
    return this.VisitLayerElement(beatRpt);
  }
  VisitBeatRptEnd(beatRpt: any): FunctorCode {
    return this.VisitLayerElementEnd(beatRpt);
  }
  VisitBTrem(bTrem: any): FunctorCode {
    return this.VisitLayerElement(bTrem);
  }
  VisitBTremEnd(bTrem: any): FunctorCode {
    return this.VisitLayerElementEnd(bTrem);
  }
  VisitChord(chord: any): FunctorCode {
    return this.VisitLayerElement(chord);
  }
  VisitChordEnd(chord: any): FunctorCode {
    return this.VisitLayerElementEnd(chord);
  }
  VisitClef(clef: any): FunctorCode {
    return this.VisitLayerElement(clef);
  }
  VisitClefEnd(clef: any): FunctorCode {
    return this.VisitLayerElementEnd(clef);
  }
  VisitCursor(cursor: any): FunctorCode {
    return this.VisitLayerElement(cursor);
  }
  VisitCursorEnd(cursor: any): FunctorCode {
    return this.VisitLayerElementEnd(cursor);
  }
  VisitCustos(custos: any): FunctorCode {
    return this.VisitLayerElement(custos);
  }
  VisitCustosEnd(custos: any): FunctorCode {
    return this.VisitLayerElementEnd(custos);
  }
  VisitDot(dot: any): FunctorCode {
    return this.VisitLayerElement(dot);
  }
  VisitDotEnd(dot: any): FunctorCode {
    return this.VisitLayerElementEnd(dot);
  }
  VisitDots(dots: any): FunctorCode {
    return this.VisitLayerElement(dots);
  }
  VisitDotsEnd(dots: any): FunctorCode {
    return this.VisitLayerElementEnd(dots);
  }
  VisitFlag(flag: any): FunctorCode {
    return this.VisitLayerElement(flag);
  }
  VisitFlagEnd(flag: any): FunctorCode {
    return this.VisitLayerElementEnd(flag);
  }
  VisitFTrem(fTrem: any): FunctorCode {
    return this.VisitLayerElement(fTrem);
  }
  VisitFTremEnd(fTrem: any): FunctorCode {
    return this.VisitLayerElementEnd(fTrem);
  }
  VisitGraceGrp(graceGrp: any): FunctorCode {
    return this.VisitLayerElement(graceGrp);
  }
  VisitGraceGrpEnd(graceGrp: any): FunctorCode {
    return this.VisitLayerElementEnd(graceGrp);
  }
  VisitGenericLayerElement(genericLayerElement: any): FunctorCode {
    return this.VisitLayerElement(genericLayerElement);
  }
  VisitGenericLayerElementEnd(genericLayerElement: any): FunctorCode {
    return this.VisitLayerElementEnd(genericLayerElement);
  }
  VisitHalfmRpt(halfmRpt: any): FunctorCode {
    return this.VisitLayerElement(halfmRpt);
  }
  VisitHalfmRptEnd(halfmRpt: any): FunctorCode {
    return this.VisitLayerElementEnd(halfmRpt);
  }
  VisitKeyAccid(keyAccid: any): FunctorCode {
    return this.VisitLayerElement(keyAccid);
  }
  VisitKeyAccidEnd(keyAccid: any): FunctorCode {
    return this.VisitLayerElementEnd(keyAccid);
  }
  VisitKeySig(keySig: any): FunctorCode {
    return this.VisitLayerElement(keySig);
  }
  VisitKeySigEnd(keySig: any): FunctorCode {
    return this.VisitLayerElementEnd(keySig);
  }
  VisitLayerElement(layerElement: any): FunctorCode {
    return this.VisitObject(layerElement);
  }
  VisitLayerElementEnd(layerElement: any): FunctorCode {
    return this.VisitObjectEnd(layerElement);
  }
  VisitLyricElement(lyricElement: any): FunctorCode {
    return this.VisitLayerElement(lyricElement);
  }
  VisitLyricElementEnd(lyricElement: any): FunctorCode {
    return this.VisitLayerElementEnd(lyricElement);
  }
  VisitLigature(ligature: any): FunctorCode {
    return this.VisitLayerElement(ligature);
  }
  VisitLigatureEnd(ligature: any): FunctorCode {
    return this.VisitLayerElementEnd(ligature);
  }
  VisitMensur(mensur: any): FunctorCode {
    return this.VisitLayerElement(mensur);
  }
  VisitMensurEnd(mensur: any): FunctorCode {
    return this.VisitLayerElementEnd(mensur);
  }
  VisitMeterSig(meterSig: any): FunctorCode {
    return this.VisitLayerElement(meterSig);
  }
  VisitMeterSigEnd(meterSig: any): FunctorCode {
    return this.VisitLayerElementEnd(meterSig);
  }
  VisitMeterSigGrp(meterSigGrp: any): FunctorCode {
    return this.VisitLayerElement(meterSigGrp);
  }
  VisitMeterSigGrpEnd(meterSigGrp: any): FunctorCode {
    return this.VisitLayerElementEnd(meterSigGrp);
  }
  VisitMRest(mRest: any): FunctorCode {
    return this.VisitLayerElement(mRest);
  }
  VisitMRestEnd(mRest: any): FunctorCode {
    return this.VisitLayerElementEnd(mRest);
  }
  VisitMRpt(mRpt: any): FunctorCode {
    return this.VisitLayerElement(mRpt);
  }
  VisitMRptEnd(mRpt: any): FunctorCode {
    return this.VisitLayerElementEnd(mRpt);
  }
  VisitMRpt2(mRpt2: any): FunctorCode {
    return this.VisitLayerElement(mRpt2);
  }
  VisitMRpt2End(mRpt2: any): FunctorCode {
    return this.VisitLayerElementEnd(mRpt2);
  }
  VisitMSpace(mSpace: any): FunctorCode {
    return this.VisitLayerElement(mSpace);
  }
  VisitMSpaceEnd(mSpace: any): FunctorCode {
    return this.VisitLayerElementEnd(mSpace);
  }
  VisitMultiRest(multiRest: any): FunctorCode {
    return this.VisitLayerElement(multiRest);
  }
  VisitMultiRestEnd(multiRest: any): FunctorCode {
    return this.VisitLayerElementEnd(multiRest);
  }
  VisitMultiRpt(multiRpt: any): FunctorCode {
    return this.VisitLayerElement(multiRpt);
  }
  VisitMultiRptEnd(multiRpt: any): FunctorCode {
    return this.VisitLayerElementEnd(multiRpt);
  }
  VisitNc(nc: any): FunctorCode {
    return this.VisitLayerElement(nc);
  }
  VisitNcEnd(nc: any): FunctorCode {
    return this.VisitLayerElementEnd(nc);
  }
  VisitNeume(neume: any): FunctorCode {
    return this.VisitLayerElement(neume);
  }
  VisitNeumeEnd(neume: any): FunctorCode {
    return this.VisitLayerElementEnd(neume);
  }
  VisitNote(note: any): FunctorCode {
    return this.VisitLayerElement(note);
  }
  VisitNoteEnd(note: any): FunctorCode {
    return this.VisitLayerElementEnd(note);
  }
  VisitPlica(plica: any): FunctorCode {
    return this.VisitLayerElement(plica);
  }
  VisitPlicaEnd(plica: any): FunctorCode {
    return this.VisitLayerElementEnd(plica);
  }
  VisitProport(proport: any): FunctorCode {
    return this.VisitLayerElement(proport);
  }
  VisitProportEnd(proport: any): FunctorCode {
    return this.VisitLayerElementEnd(proport);
  }
  VisitRest(rest: any): FunctorCode {
    return this.VisitLayerElement(rest);
  }
  VisitRestEnd(rest: any): FunctorCode {
    return this.VisitLayerElementEnd(rest);
  }
  VisitSpace(space: any): FunctorCode {
    return this.VisitLayerElement(space);
  }
  VisitSpaceEnd(space: any): FunctorCode {
    return this.VisitLayerElementEnd(space);
  }
  VisitStem(stem: any): FunctorCode {
    return this.VisitLayerElement(stem);
  }
  VisitStemEnd(stem: any): FunctorCode {
    return this.VisitLayerElementEnd(stem);
  }
  VisitSyl(syl: any): FunctorCode {
    return this.VisitLayerElement(syl);
  }
  VisitSylEnd(syl: any): FunctorCode {
    return this.VisitLayerElementEnd(syl);
  }
  VisitSyllable(syllable: any): FunctorCode {
    return this.VisitLayerElement(syllable);
  }
  VisitSyllableEnd(syllable: any): FunctorCode {
    return this.VisitLayerElementEnd(syllable);
  }
  VisitTabDurSym(tabDurSym: any): FunctorCode {
    return this.VisitLayerElement(tabDurSym);
  }
  VisitTabDurSymEnd(tabDurSym: any): FunctorCode {
    return this.VisitLayerElementEnd(tabDurSym);
  }
  VisitTabGrp(tabGrp: any): FunctorCode {
    return this.VisitLayerElement(tabGrp);
  }
  VisitTabGrpEnd(tabGrp: any): FunctorCode {
    return this.VisitLayerElementEnd(tabGrp);
  }
  VisitTimestamp(timeStamp: any): FunctorCode {
    return this.VisitLayerElement(timeStamp);
  }
  VisitTimestampEnd(timeStamp: any): FunctorCode {
    return this.VisitLayerElementEnd(timeStamp);
  }
  VisitTuplet(tuplet: any): FunctorCode {
    return this.VisitLayerElement(tuplet);
  }
  VisitTupletEnd(tuplet: any): FunctorCode {
    return this.VisitLayerElementEnd(tuplet);
  }
  VisitTupletBracket(tupletBracket: any): FunctorCode {
    return this.VisitLayerElement(tupletBracket);
  }
  VisitTupletBracketEnd(tupletBracket: any): FunctorCode {
    return this.VisitLayerElementEnd(tupletBracket);
  }
  VisitTupletNum(tupletNum: any): FunctorCode {
    return this.VisitLayerElement(tupletNum);
  }
  VisitTupletNumEnd(tupletNum: any): FunctorCode {
    return this.VisitLayerElementEnd(tupletNum);
  }
  VisitVolta(volta: any): FunctorCode {
    return this.VisitLayerElement(volta);
  }
  VisitVoltaEnd(volta: any): FunctorCode {
    return this.VisitLayerElementEnd(volta);
  }
  VisitRefrain(refrain: any): FunctorCode {
    return this.VisitLyricElement(refrain);
  }
  VisitRefrainEnd(refrain: any): FunctorCode {
    return this.VisitLyricElementEnd(refrain);
  }
  VisitVerse(verse: any): FunctorCode {
    return this.VisitLyricElement(verse);
  }
  VisitVerseEnd(verse: any): FunctorCode {
    return this.VisitLyricElementEnd(verse);
  }
  VisitF(f: any): FunctorCode {
    return this.VisitTextElement(f);
  }
  VisitFEnd(f: any): FunctorCode {
    return this.VisitTextElementEnd(f);
  }
  VisitFb(fb: any): FunctorCode {
    return this.VisitObject(fb);
  }
  VisitFbEnd(fb: any): FunctorCode {
    return this.VisitObjectEnd(fb);
  }
  VisitFig(fig: any): FunctorCode {
    return this.VisitTextElement(fig);
  }
  VisitFigEnd(fig: any): FunctorCode {
    return this.VisitTextElementEnd(fig);
  }
  VisitLb(lb: any): FunctorCode {
    return this.VisitTextElement(lb);
  }
  VisitLbEnd(lb: any): FunctorCode {
    return this.VisitTextElementEnd(lb);
  }
  VisitMNum(mNum: any): FunctorCode {
    return this.VisitControlElement(mNum);
  }
  VisitMNumEnd(mNum: any): FunctorCode {
    return this.VisitControlElementEnd(mNum);
  }
  VisitNum(num: any): FunctorCode {
    return this.VisitTextElement(num);
  }
  VisitNumEnd(num: any): FunctorCode {
    return this.VisitTextElementEnd(num);
  }
  VisitRend(rend: any): FunctorCode {
    return this.VisitTextElement(rend);
  }
  VisitRendEnd(rend: any): FunctorCode {
    return this.VisitTextElementEnd(rend);
  }
  VisitSvg(svg: any): FunctorCode {
    return this.VisitObject(svg);
  }
  VisitSvgEnd(svg: any): FunctorCode {
    return this.VisitObjectEnd(svg);
  }
  VisitSymbol(symbol: any): FunctorCode {
    return this.VisitTextElement(symbol);
  }
  VisitSymbolEnd(symbol: any): FunctorCode {
    return this.VisitTextElementEnd(symbol);
  }
  VisitText(text: any): FunctorCode {
    return this.VisitTextElement(text);
  }
  VisitTextEnd(text: any): FunctorCode {
    return this.VisitTextElementEnd(text);
  }
  VisitTextElement(textElement: any): FunctorCode {
    return this.VisitObject(textElement);
  }
  VisitTextElementEnd(textElement: any): FunctorCode {
    return this.VisitObjectEnd(textElement);
  }
  VisitFacsimile(facsimile: any): FunctorCode {
    return this.VisitObject(facsimile);
  }
  VisitFacsimileEnd(facsimile: any): FunctorCode {
    return this.VisitObjectEnd(facsimile);
  }
  VisitGraphic(graphic: any): FunctorCode {
    return this.VisitObject(graphic);
  }
  VisitGraphicEnd(graphic: any): FunctorCode {
    return this.VisitObjectEnd(graphic);
  }
  VisitSurface(surface: any): FunctorCode {
    return this.VisitObject(surface);
  }
  VisitSurfaceEnd(surface: any): FunctorCode {
    return this.VisitObjectEnd(surface);
  }
  VisitZone(zone: any): FunctorCode {
    return this.VisitObject(zone);
  }
  VisitZoneEnd(zone: any): FunctorCode {
    return this.VisitObjectEnd(zone);
  }
  VisitAlignment(alignment: any): FunctorCode {
    return this.VisitObject(alignment);
  }
  VisitAlignmentEnd(alignment: any): FunctorCode {
    return this.VisitObjectEnd(alignment);
  }
  VisitAlignmentReference(alignmentReference: any): FunctorCode {
    return this.VisitObject(alignmentReference);
  }
  VisitAlignmentReferenceEnd(alignmentReference: any): FunctorCode {
    return this.VisitObjectEnd(alignmentReference);
  }
  VisitHorizontalAligner(horizontalAligner: any): FunctorCode {
    return this.VisitObject(horizontalAligner);
  }
  VisitHorizontalAlignerEnd(horizontalAligner: any): FunctorCode {
    return this.VisitObjectEnd(horizontalAligner);
  }
  VisitMeasureAligner(measureAligner: any): FunctorCode {
    return this.VisitHorizontalAligner(measureAligner);
  }
  VisitMeasureAlignerEnd(measureAligner: any): FunctorCode {
    return this.VisitHorizontalAlignerEnd(measureAligner);
  }
  VisitGraceAligner(graceAligner: any): FunctorCode {
    return this.VisitHorizontalAligner(graceAligner);
  }
  VisitGraceAlignerEnd(graceAligner: any): FunctorCode {
    return this.VisitHorizontalAlignerEnd(graceAligner);
  }
  VisitTimestampAligner(timestampAligner: any): FunctorCode {
    return this.VisitObject(timestampAligner);
  }
  VisitTimestampAlignerEnd(timestampAligner: any): FunctorCode {
    return this.VisitObjectEnd(timestampAligner);
  }
  VisitSystemAligner(systemAligner: any): FunctorCode {
    return this.VisitObject(systemAligner);
  }
  VisitSystemAlignerEnd(systemAligner: any): FunctorCode {
    return this.VisitObjectEnd(systemAligner);
  }
  VisitStaffAlignment(staffAlignment: any): FunctorCode {
    return this.VisitObject(staffAlignment);
  }
  VisitStaffAlignmentEnd(staffAlignment: any): FunctorCode {
    return this.VisitObjectEnd(staffAlignment);
  }
  VisitFloatingObject(floatingObject: any): FunctorCode {
    return this.VisitObject(floatingObject);
  }
  VisitFloatingObjectEnd(floatingObject: any): FunctorCode {
    return this.VisitObjectEnd(floatingObject);
  }
}

