/**
 * resetfunctor.ts — canonical translation of src-cpp/src/resetfunctor.cpp.
 *
 * Three functors:
 *  - ResetDataFunctor: reset all data-preparation state (drawing values,
 *    interfaces, links, generated children).
 *  - ResetHorizontalAlignmentFunctor: reset horizontal alignment state
 *    (XRel values, alignment bindings, cached positions).
 *  - ResetVerticalAlignmentFunctor: reset vertical alignment state
 *    (YRel values, staff/system aligners, running elements).
 *
 * All functors implement `ImplementsEndInterface() == false` per the C++
 * header. Visitor methods preserve the C++ call order, including explicit
 * calls to parent visitors (`this->VisitLayerElement(element)` first) and
 * direct `InterfaceResetData` invocations on composed interfaces
 * (C++ `XInterface::InterfaceResetData(*this, element)` composition
 * adaptation).
 */

import { Functor } from './functor.js';
import { FunctorCode } from './vrvdef.js';
import { ClassId, InterfaceId, VRV_UNSET } from './vrvdef.js';

// Local numeric aliases for enums not centralized in vrvdef.ts yet.
const STAFFREL_NONE = 0;
const STAFFREL_basic_NONE = 0;
const SAMEAS_NONE = 0;
const SAMEAS_UNSET = -1;
const STEMDIRECTION_NONE = 0;

/** Structural type for any visited node (C++ forward-declared collaborator). */
type AnyNode = any;

/** Inherited visitor contract: `FunctorInterface` default forwards unknowns to `VisitObject`. */
function hasVisit(functor: Functor, name: string): boolean {
  return (functor as any)[name] !== undefined;
}

//----------------------------------------------------------------------------
// ResetDataFunctor
//----------------------------------------------------------------------------

export class ResetDataFunctor extends Functor {
  public override ImplementsEndInterface(): boolean { return false; }

  public VisitAccid(accid: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(accid);
    accid.GetPositionInterface().InterfaceResetData(this, accid);
    accid.ClearFloatingObject();
    // Reset show accid.ges
    accid.ClearChildren();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitArpeg(arpeg: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitControlElement(arpeg);
    arpeg.GetPlistInterface().InterfaceResetData(this, arpeg);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitArtic(artic: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(artic);
    artic.SetDrawingPlace(STAFFREL_NONE);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitBeam(beam: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(beam);
    // Drawing interface functor to be called explicitly
    beam.GetBeamDrawingInterface().InterfaceResetData(this);
    beam.m_beamSegment.Reset();
    beam.SetStemSameasBeam(null);
    // We want the list of the ObjectListInterface to be regenerated
    beam.Modify();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitBeamSpan(beamSpan: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitControlElement(beamSpan);
    // Drawing interface functor to be called explicitly
    beamSpan.GetBeamDrawingInterface().InterfaceResetData(this);
    beamSpan.ResetBeamedElements();
    beamSpan.ClearBeamSegments();
    beamSpan.InitBeamSegments();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitChord(chord: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(chord);
    // Drawing interface functor to be called explicitly
    chord.DrawingListInterface_InterfaceResetData?.(this);
    chord.GetStemmedDrawingInterface().InterfaceResetData(this);
    const currentStem = chord.FindDescendantByType(ClassId.STEM, 1);
    if (currentStem) chord.DeleteChild(currentStem);
    const currentDots = chord.FindDescendantByType(ClassId.DOTS, 1);
    if (currentDots) chord.DeleteChild(currentDots);
    // We want the list of the ObjectListInterface to be regenerated
    chord.Modify();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitControlElement(controlElement: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitFloatingObject(controlElement);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitCustos(custos: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(custos);
    custos.GetPositionInterface().InterfaceResetData(this, custos);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitDiv(div: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitObject(div);
    div.SetDrawingInline(false);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitDot(dot: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(dot);
    dot.GetPositionInterface().InterfaceResetData(this, dot);
    dot.m_drawingPreviousElement = null;
    dot.m_drawingNextElement = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitDots(dots: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(dots);
    dots.ResetMapOfDotLocs();
    dots.IsAdjusted(false);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitEditorialElement(editorialElement: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitObject(editorialElement);
    if (editorialElement.IsSystemMilestone()) {
      // C++ `EditorialElement::SystemMilestoneInterface::InterfaceResetData(*this)` —
      // EditorialElement exposes the interface reset directly.
      editorialElement.InterfaceResetData(this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitEnding(ending: AnyNode): FunctorCode {
    this.VisitFloatingObject(ending);
    ending.InterfaceResetData(this);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitF(f: AnyNode): FunctorCode {
    this.VisitTextElement(f);
    f.GetTimeSpanningInterface().InterfaceResetData(this, f);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitFlag(flag: AnyNode): FunctorCode {
    this.VisitLayerElement(flag);
    flag.m_drawingNbFlags = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitFloatingObject(floatingObject: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitObject(floatingObject);
    floatingObject.ResetDrawing();
    floatingObject.SetDrawingGrpId(0);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitFTrem(fTrem: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(fTrem);
    // Drawing interface functor to be called explicitly
    fTrem.GetBeamDrawingInterface().InterfaceResetData(this);
    fTrem.m_beamSegment.Reset();
    // We want the list of the ObjectListInterface to be regenerated
    fTrem.Modify();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitHairpin(hairpin: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitControlElement(hairpin);
    hairpin.SetLeftLink(null);
    hairpin.SetRightLink(null);
    hairpin.SetDrawingLength(0);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitKeySig(keySig: AnyNode): FunctorCode {
    this.VisitLayerElement(keySig);
    keySig.ResetDrawingClef();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayer(layer: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitObject(layer);
    // Drawing interface functor to be called explicitly
    layer.DrawingListInterface_InterfaceResetData?.(this);
    layer.SetCrossStaffFromAbove(false);
    layer.SetCrossStaffFromBelow(false);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitObject(layerElement);
    layerElement.SetIsInBeamSpan(false);
    layerElement.SetDrawingCueSize(false);
    layerElement.m_crossStaff = null;
    layerElement.m_crossLayer = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLyricElement(lyricElement: AnyNode): FunctorCode {
    this.VisitLayerElement(lyricElement);
    lyricElement.ResetDrawingDirectSylTrack();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLigature(ligature: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(ligature);
    ligature.m_drawingShapes.length = 0;
    // We want the list of the ObjectListInterface to be regenerated
    ligature.Modify();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitObject(measure);
    measure.m_timestampAligner.Reset();
    measure.SetDrawingEnding(null);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMRest(mRest: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(mRest);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMSpace(mSpace: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(mSpace);
    // Reset show mSpace
    mSpace.ClearChildren();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNote(note: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(note);
    // Drawing interface functor to be called explicitly
    note.GetStemmedDrawingInterface().InterfaceResetData(this);
    note.SetDrawingLoc(0);
    note.SetFlippedNotehead(false);
    note.SetStemSameasNote(null);
    note.SetStemSameasRole(SAMEAS_NONE);
    const currentStem = note.FindDescendantByType(ClassId.STEM, 1);
    if (currentStem) note.DeleteChild(currentStem);
    const currentDots = note.FindDescendantByType(ClassId.DOTS, 1);
    if (currentDots) note.DeleteChild(currentDots);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNc(nc: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(nc);
    nc.m_drawingGlyphs.length = 0;
    // We want the list of the ObjectListInterface to be regenerated
    nc.Modify();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitObject(object: AnyNode): FunctorCode {
    if (object.HasInterface(InterfaceId.INTERFACE_ALT_SYM)) {
      const iface = object.GetAltSymInterface();
      if (!iface) throw new Error('ResetDataFunctor::VisitObject: ALT_SYM interface missing');
      iface.InterfaceResetData(this, object);
    }
    if (object.HasInterface(InterfaceId.INTERFACE_FACSIMILE)) {
      const iface = object.GetFacsimileInterface();
      iface.InterfaceResetData(this, object);
    }
    if (object.HasInterface(InterfaceId.INTERFACE_LINKING)) {
      const iface = object.GetLinkingInterface();
      if (!iface) throw new Error('ResetDataFunctor::VisitObject: LINKING interface missing');
      iface.InterfaceResetData(this, object);
    }
    if (object.HasInterface(InterfaceId.INTERFACE_OFFSET)) {
      const iface = object.GetOffsetInterface();
      if (!iface) throw new Error('ResetDataFunctor::VisitObject: OFFSET interface missing');
      iface.InterfaceResetData(this, object);
    }
    if (object.HasInterface(InterfaceId.INTERFACE_OFFSET_SPANNING)) {
      const iface = object.GetOffsetSpanningInterface();
      if (!iface) throw new Error('ResetDataFunctor::VisitObject: OFFSET_SPANNING interface missing');
      iface.InterfaceResetData(this, object);
    }
    if (object.HasInterface(InterfaceId.INTERFACE_PLIST)) {
      const iface = object.GetPlistInterface();
      if (!iface) throw new Error('ResetDataFunctor::VisitObject: PLIST interface missing');
      iface.InterfaceResetData(this, object);
    }
    if (object.HasInterface(InterfaceId.INTERFACE_POSITION)) {
      const iface = object.GetPositionInterface();
      if (!iface) throw new Error('ResetDataFunctor::VisitObject: POSITION interface missing');
      iface.InterfaceResetData(this, object);
    }
    if (object.HasInterface(InterfaceId.INTERFACE_TIME_POINT)) {
      const iface = object.GetTimePointInterface();
      if (!iface) throw new Error('ResetDataFunctor::VisitObject: TIME_POINT interface missing');
      iface.InterfaceResetData(this, object);
    }
    if (object.HasInterface(InterfaceId.INTERFACE_TIME_SPANNING)) {
      const iface = object.GetTimeSpanningInterface();
      if (!iface) throw new Error('ResetDataFunctor::VisitObject: TIME_SPANNING interface missing');
      iface.InterfaceResetData(this, object);
    }
    if (object.HasPlistReferences()) object.ResetPlistReferences();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPage(page: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitObject(page);
    page.DeprecateLayout();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitRepeatMark(repeatMark: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitControlElement(repeatMark);
    // For now doing nothing, but we should eventually remove generated text when the @func is not 'fine' anymore
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitRest(rest: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(rest);
    const currentDots = rest.FindDescendantByType(ClassId.DOTS, 1);
    if (currentDots) rest.DeleteChild(currentDots);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSection(section: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitFloatingObject(section);
    if (section.IsSystemMilestone()) {
      section.InterfaceResetData(this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSlur(slur: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitControlElement(slur);
    slur.SetDrawingCurveDir(0 /* SlurCurveDirection::None */);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSpace(space: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(space);
    // Reset show space
    space.ClearChildren();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitObject(staff);
    staff.ClearTimeSpanningElements();
    staff.ClearLedgerLines();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaffDef(staffDef: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitObject(staffDef);
    // Drawing interface functor to be called explicitly
    staffDef.GetStaffDefDrawingInterface().InterfaceResetData(this);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStem(stem: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(stem);
    stem.SetDrawingStemDir(STEMDIRECTION_NONE);
    stem.SetDrawingStemLen(0);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSyl(syl: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(syl);
    syl.m_nextWordSyl = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitObject(system);
    // Drawing interface functor to be called explicitly
    system.DrawingListInterface_InterfaceResetData?.(this);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemMilestone(systemMilestoneEnd: AnyNode): FunctorCode {
    this.VisitFloatingObject(systemMilestoneEnd);
    systemMilestoneEnd.SetMeasure(null);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTabDurSym(tabDurSym: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(tabDurSym);
    // Drawing interface functor to be called explicitly
    tabDurSym.GetStemmedDrawingInterface().InterfaceResetData(this);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTempo(tempo: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitControlElement(tempo);
    tempo.ResetDrawingXRelative();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTuplet(tuplet: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(tuplet);
    // We want the list of the ObjectListInterface to be regenerated
    tuplet.Modify();
    tuplet.SetDrawingLeft(null);
    tuplet.SetDrawingRight(null);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTurn(turn: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitControlElement(turn);
    turn.m_drawingEndElement = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitVolta(volta: AnyNode): FunctorCode {
    this.VisitLayerElement(volta);
    volta.ResetDrawingVoltaN();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitVerse(verse: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLyricElement(verse);
    verse.SetDrawingLabelAbbr(null);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitRefrain(refrain: AnyNode): FunctorCode {
    this.VisitLyricElement(refrain);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  // Parent-chain helpers (C++ FunctorInterface default forwarding).
  public VisitTextElement(textElement: AnyNode): FunctorCode { return this.VisitObject(textElement); }
}

//----------------------------------------------------------------------------
// ResetHorizontalAlignmentFunctor
//----------------------------------------------------------------------------

export class ResetHorizontalAlignmentFunctor extends Functor {
  public override ImplementsEndInterface(): boolean { return false; }

  public VisitAccid(accid: AnyNode): FunctorCode {
    this.VisitLayerElement(accid);
    accid.GetPositionInterface().InterfaceResetHorizontalAlignment(this, accid);
    accid.SetDrawingUnisonAccid(null);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitArpeg(arpeg: AnyNode): FunctorCode {
    arpeg.SetDrawingXRel(0);
    return this.VisitControlElement(arpeg);
  }

  public VisitBeam(beam: AnyNode): FunctorCode {
    this.VisitLayerElement(beam);
    beam.m_beamSegment.m_stemSameasRole = SAMEAS_NONE;
    beam.m_beamSegment.m_stemSameasReverseRole = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitBeamSpan(beamSpan: AnyNode): FunctorCode {
    beamSpan.ClearBeamSegments();
    beamSpan.InitBeamSegments();
    return this.VisitControlElement(beamSpan);
  }

  public VisitCursor(cursor: AnyNode): FunctorCode {
    this.VisitNote(cursor);
    cursor.ResetCursorAlignment();
    cursor.SetYRelPitchC(0);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitCustos(custos: AnyNode): FunctorCode {
    this.VisitLayerElement(custos);
    custos.GetPositionInterface().InterfaceResetHorizontalAlignment(this, custos);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitDiv(div: AnyNode): FunctorCode {
    this.VisitTextLayoutElement(div);
    div.SetDrawingXRel(0);
    div.SetDrawingYRel(0);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitDot(dot: AnyNode): FunctorCode {
    this.VisitLayerElement(dot);
    dot.GetPositionInterface().InterfaceResetHorizontalAlignment(this, dot);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitDots(dots: AnyNode): FunctorCode {
    this.VisitLayerElement(dots);
    dots.ResetMapOfDotLocs();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitFloatingObject(floatingObject: AnyNode): FunctorCode {
    floatingObject.SetCurrentFloatingPositioner(null);
    floatingObject.ResetMaxDrawingYRel();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayer(layer: AnyNode): FunctorCode {
    if (layer.GetStaffDefClef()) {
      this.VisitClef(layer.GetStaffDefClef());
    }
    if (layer.GetStaffDefKeySig()) {
      this.VisitKeySig(layer.GetStaffDefKeySig());
    }
    if (layer.GetStaffDefMensur()) {
      this.VisitMensur(layer.GetStaffDefMensur());
    }
    if (layer.GetStaffDefMeterSig()) {
      this.VisitMeterSig(layer.GetStaffDefMeterSig());
    }
    if (layer.GetStaffDefMeterSigGrp()) {
      layer.GetStaffDefMeterSigGrp().Process(this);
    }

    if (layer.GetCautionStaffDefClef()) {
      this.VisitClef(layer.GetCautionStaffDefClef());
    }
    if (layer.GetCautionStaffDefKeySig()) {
      this.VisitKeySig(layer.GetCautionStaffDefKeySig());
    }
    if (layer.GetCautionStaffDefMensur()) {
      this.VisitMensur(layer.GetCautionStaffDefMensur());
    }
    if (layer.GetCautionStaffDefMeterSig()) {
      this.VisitMeterSig(layer.GetCautionStaffDefMeterSig());
    }

    if (layer.HasCursor()) {
      this.VisitCursor(layer.GetCursor());
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: AnyNode): FunctorCode {
    layerElement.SetDrawingXRel(0);
    // Exception here: the LayerElement::m_drawingYRel position is already set for horizontal alignment
    // See CalcAlignmentPitchPosFunctor - for this reason we need to reset it here and not in ResetVerticalAlignment
    layerElement.SetDrawingYRel(0);
    layerElement.ResetAlignment();
    layerElement.ResetGraceAlignment();
    layerElement.SetAlignmentLayerN(VRV_UNSET);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: AnyNode): FunctorCode {
    measure.SetDrawingXRel(0);
    if (measure.m_measureAligner.GetLeftAlignment()) {
      measure.m_measureAligner.GetLeftAlignment().SetXRel(0);
    }
    if (measure.m_measureAligner.GetRightAlignment()) {
      measure.m_measureAligner.GetRightAlignment().SetXRel(0);
    }
    measure.m_timestampAligner.Process(this);
    measure.SetHasAlignmentRefWithMultipleLayers(false);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMRest(mRest: AnyNode): FunctorCode {
    this.VisitLayerElement(mRest);
    mRest.GetPositionInterface().InterfaceResetHorizontalAlignment(this, mRest);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNote(note: AnyNode): FunctorCode {
    this.VisitLayerElement(note);
    note.GetPositionInterface().InterfaceResetHorizontalAlignment(this, note);
    note.SetDrawingLoc(0);
    note.SetFlippedNotehead(false);
    // Re-mark the role as unsed if we have a shared stem
    if (note.HasStemSameasNote()) note.SetStemSameasRole(SAMEAS_UNSET);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitOssia(ossia: AnyNode): FunctorCode {
    ossia.ResetAlignments();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitProport(proport: AnyNode): FunctorCode {
    this.VisitLayerElement(proport);
    proport.ResetCumulate();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitRest(rest: AnyNode): FunctorCode {
    this.VisitLayerElement(rest);
    rest.GetPositionInterface().InterfaceResetHorizontalAlignment(this, rest);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScoreDef(scoreDef: AnyNode): FunctorCode {
    scoreDef.ResetDrawingLabelsWidth();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: AnyNode): FunctorCode {
    system.SetDrawingXRel(0);
    system.ResetDrawingAbbrLabelsWidth();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTuplet(tuplet: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(tuplet);
    tuplet.SetDrawingBracketPos(STAFFREL_basic_NONE);
    tuplet.SetBracketAlignedBeam(null);
    tuplet.SetNumAlignedBeam(null);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTupletBracket(tupletBracket: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(tupletBracket);
    tupletBracket.SetDrawingXRelLeft(0);
    tupletBracket.SetDrawingXRelRight(0);
    tupletBracket.SetAlignedNum(null);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTupletNum(tupletNum: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(tupletNum);
    tupletNum.SetAlignedBracket(null);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  // Parent-chain helpers (C++ FunctorInterface default forwarding).
  public VisitTextLayoutElement(textLayoutElement: AnyNode): FunctorCode { return this.VisitObject(textLayoutElement); }
  public VisitControlElement(controlElement: AnyNode): FunctorCode { return this.VisitFloatingObject(controlElement); }
  public VisitClef(clef: AnyNode): FunctorCode { return this.VisitLayerElement(clef); }
  public VisitKeySig(keySig: AnyNode): FunctorCode { return this.VisitLayerElement(keySig); }
  public VisitMensur(mensur: AnyNode): FunctorCode { return this.VisitLayerElement(mensur); }
  public VisitMeterSig(meterSig: AnyNode): FunctorCode { return this.VisitLayerElement(meterSig); }
}

//----------------------------------------------------------------------------
// ResetVerticalAlignmentFunctor
//----------------------------------------------------------------------------

export class ResetVerticalAlignmentFunctor extends Functor {
  public override ImplementsEndInterface(): boolean { return false; }

  public VisitArtic(artic: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(artic);
    artic.m_startSlurPositioners.length = 0;
    artic.m_endSlurPositioners.length = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitFloatingObject(floatingObject: AnyNode): FunctorCode {
    floatingObject.SetCurrentFloatingPositioner(null);
    floatingObject.ResetMaxDrawingYRel();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(_layerElement: AnyNode): FunctorCode {
    // Nothing to do since m_drawingYRel is reset in ResetHorizontalAlignment and set in CalcAlignmentPitchPos
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitOctave(octave: AnyNode): FunctorCode {
    this.VisitFloatingObject(octave);
    octave.ResetDrawingExtenderX();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPage(page: AnyNode): FunctorCode {
    const header = page.GetHeader();
    if (header) {
      header.Process(this);
      header.SetDrawingPage(null);
      header.SetDrawingYRel(0);
    }
    const footer = page.GetFooter();
    if (footer) {
      footer.Process(this);
      footer.SetDrawingPage(null);
      footer.SetDrawingYRel(0);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: AnyNode): FunctorCode {
    staff.SetAlignment(null);
    staff.ClearLedgerLines();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: AnyNode): FunctorCode {
    system.SetDrawingYRel(0);
    system.m_systemAligner.Reset();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTextElement(textElement: AnyNode): FunctorCode {
    textElement.SetDrawingXRel(0);
    textElement.SetDrawingYRel(0);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTuplet(tuplet: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(tuplet);
    tuplet.ResetInnerSlurs();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTupletBracket(tupletBracket: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(tupletBracket);
    tupletBracket.SetDrawingYRelLeft(0);
    tupletBracket.SetDrawingYRelRight(0);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
