/**
 * Pure-TypeScript translation of Verovio `src/preparedatafunctor.cpp`.
 *
 * Visitor dispatch relies on the migrated `FunctorInterface` forwarding chain
 * (e.g. `VisitNote -> VisitLayerElement -> VisitObject`): each functor
 * overrides only the methods the C++ class overrides. `CollectAndProcess`
 * multiple inheritance is represented through composition, and `assert`
 * invariants become explicit runtime errors, following the conventions of
 * this repository.
 */

import { CollectAndProcess, DocFunctor, Functor } from './functor.js';
import {
  FunctorCode, ClassId, InterfaceId, UNLIMITED_DEPTH, FORWARD, BACKWARD,
  MAX_ACCID_DEPTH, MAX_BEAM_DEPTH, MAX_CHORD_DEPTH, MAX_NOTE_DEPTH,
  DURATION_NONE, DURATION_2, DURATION_4, DURATION_breve,
  type data_DURATION, type data_MEASUREBEAT,
} from './vrvdef.js';
import { LogWarning, LogError, LogDebug, StringFormat, IsDigits, ExtractIDFragment, UTF8to32 } from './vrv.js';
import { AttNIntegerComparison, ClassIdsComparison, InterfaceComparison } from './comparison.js';
import { TimeSpanningInterface } from './timeinterface.js';
import { LinkingInterface } from './linkinginterface.js';
import { Stem } from './stem.js';
import { Dots, TupletBracket, TupletNum, Flag } from './elementpart.js';
import { Note } from './note.js';
import { Text } from './text.js';
import type { Doc } from './doc.js';

// Local scalar aliases for generated libMEI values not centralized in vrvdef.
const BOOLEAN_NONE = 0;
const BOOLEAN_true = 1;
const BOOLEAN_false = 2;
const BREAKS_none = 0;
const ATT_CUE = 116; // libmei AttClassId
const accidLog_FUNC_edit = 2;
const repeatMarkLog_FUNC_fine = 5;
const sylLog_CON_u = 3;
const sylLog_WORDPOS_i = 1;
const sylLog_WORDPOS_m = 2;
const pedalLog_DIR_down = 1;
const pedalLog_DIR_bounce = 4;
const PEDALSTYLE_line = 1;
const PEDALSTYLE_pedline = 5;
const SAMEAS_UNSET = 0;
const StaffSearch_RESOLVE_CROSS_STAFF = 1; // LayerElement::StaffSearch::RESOLVE_CROSS_STAFF

type AnyNode = any;

//----------------------------------------------------------------------------
// PrepareDataInitializationFunctor
//----------------------------------------------------------------------------

export class PrepareDataInitializationFunctor extends DocFunctor {
  public override ImplementsEndInterface(): boolean { return false; }

  public VisitAccid(accid: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(accid);

    if (accid.GetFunc() === accidLog_FUNC_edit) {
      accid.InitFloatingObject();
    }
    if (accid.HasAccidGes() && this.GetDoc().GetOptions().m_showHidden.GetValue()) {
      accid.InitShowAccidGes();
    }
    accid.Modify();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitChord(chord: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(chord);

    if (chord.HasEmptyList()) {
      LogWarning("Chord '%s' has no child note - a default note is added", chord.GetID());
      const rescueNote = new Note();
      chord.AddChild(rescueNote);
    }
    chord.Modify();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitDiv(div: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitTextLayoutElement(div);

    if (this.GetDoc().GetOptions().m_breaks.GetValue() === BREAKS_none) {
      div.SetDrawingInline(true);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitFloatingObject(floatingObject: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitObject(floatingObject);

    floatingObject.ResetDrawingObjectIDs();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitKeySig(keySig: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(keySig);

    // Clear and regenerate attribute children
    keySig.GenerateKeyAccidAttribChildren();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMSpace(mSpace: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(mSpace);

    if (this.GetDoc().GetOptions().m_showHidden.GetValue()) {
      mSpace.InitShowMSpace();
    }
    mSpace.Modify();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitRepeatMark(repeatMark: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitControlElement(repeatMark);

    if (repeatMark.GetChildCount() === 0 && repeatMark.HasFunc() && repeatMark.GetFunc() === repeatMarkLog_FUNC_fine) {
      const fine = new Text();
      fine.SetGenerated(true);
      fine.SetText(UTF8to32('Fine'));
      repeatMark.AddChild(fine);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScore(score: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitPageElement(score);

    if (!score.GetScoreDef()) throw new Error('PrepareDataInitializationFunctor::VisitScore requires a ScoreDef');

    // Evaluate functor on scoreDef
    score.GetScoreDef().Process(this);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSpace(space: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitLayerElement(space);

    if (this.GetDoc().GetOptions().m_showHidden.GetValue()) {
      space.InitShowSpace();
    }
    space.Modify();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTextLayoutElement(textLayoutElement: AnyNode): FunctorCode {
    // Call parent one too
    this.VisitObject(textLayoutElement);

    textLayoutElement.ResetCells();
    textLayoutElement.ResetDrawingScaling();

    const childList = textLayoutElement.GetList();
    for (const child of childList) {
      const iface = child.GetAreaPosInterface();
      if (!iface) throw new Error('PrepareDataInitializationFunctor requires an AreaPosInterface child');
      const pos = textLayoutElement.GetAlignmentPos(iface.GetHalign(), iface.GetValign());
      textLayoutElement.AppendTextToCell(pos, child);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PrepareCueSizeFunctor
//----------------------------------------------------------------------------

export class PrepareCueSizeFunctor extends Functor {
  public override ImplementsEndInterface(): boolean { return false; }

  public VisitLayerElement(layerElement: AnyNode): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    const currentLayer = layerElement.GetFirstAncestor(ClassId.LAYER);
    if (!currentLayer) throw new Error('PrepareCueSizeFunctor requires a Layer ancestor');
    if (currentLayer.GetCue() === BOOLEAN_true) {
      layerElement.SetDrawingCueSize(true);
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (layerElement.IsGraceNote()) {
      layerElement.SetDrawingCueSize(true);
    }
    // This covers the case when the @size is given on the element
    else if (layerElement.HasAttClass(ATT_CUE)) {
      if (layerElement.HasCue()) layerElement.SetDrawingCueSize(layerElement.GetCue() === BOOLEAN_true);
    }
    // For note, we also need to look at the parent chord
    else if (layerElement.Is(ClassId.NOTE)) {
      const chord = layerElement.IsChordTone();
      if (chord) layerElement.SetDrawingCueSize(chord.GetDrawingCueSize());
    }
    // For tuplet, we also need to look at the first note or chord
    else if (layerElement.Is(ClassId.TUPLET)) {
      const matchType = new ClassIdsComparison([ClassId.NOTE, ClassId.CHORD]);
      const child = layerElement.FindDescendantByComparison(matchType);
      if (child) layerElement.SetDrawingCueSize(child.GetDrawingCueSize());
    }
    // For accid, look at the parent if @func="edit" or otherwise to the parent note
    else if (layerElement.Is(ClassId.ACCID)) {
      if (layerElement.GetFunc() === accidLog_FUNC_edit)
        layerElement.SetDrawingCueSize(true);
      else {
        const note = layerElement.GetFirstAncestor(ClassId.NOTE, MAX_ACCID_DEPTH);
        if (note) layerElement.SetDrawingCueSize(note.GetDrawingCueSize());
      }
    }
    else if (layerElement.IsAnyOf([ClassId.ARTIC, ClassId.DOTS, ClassId.FLAG, ClassId.STEM])) {
      const note = layerElement.GetFirstAncestor(ClassId.NOTE, MAX_NOTE_DEPTH);
      if (note)
        layerElement.SetDrawingCueSize(note.GetDrawingCueSize());
      else {
        const chord = layerElement.GetFirstAncestor(ClassId.CHORD, MAX_CHORD_DEPTH);
        if (chord) layerElement.SetDrawingCueSize(chord.GetDrawingCueSize());
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PrepareCrossStaffFunctor
//----------------------------------------------------------------------------

export class PrepareCrossStaffFunctor extends Functor {
  private m_currentMeasure: AnyNode = null;
  private m_currentCrossStaff: AnyNode = null;
  private m_currentCrossLayer: AnyNode = null;

  public override ImplementsEndInterface(): boolean { return true; }

  public VisitLayerElement(layerElement: AnyNode): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    layerElement.m_crossStaff = null;
    layerElement.m_crossLayer = null;

    // Look for cross-staff situations
    // If we have one, make it available in m_crossStaff
    const crossElement = layerElement;
    if (typeof crossElement.HasStaff !== 'function') return FunctorCode.FUNCTOR_CONTINUE;

    // If we have not @staff, set to what we had before (quite likely NULL for all non cross staff cases)
    if (!crossElement.HasStaff()) {
      layerElement.m_crossStaff = this.m_currentCrossStaff;
      layerElement.m_crossLayer = this.m_currentCrossLayer;
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    // We have a @staff, set the current pointers to NULL before assigning them
    this.m_currentCrossStaff = null;
    this.m_currentCrossLayer = null;

    const comparisonFirst = new AttNIntegerComparison(ClassId.STAFF, crossElement.GetStaff().at(0));
    layerElement.m_crossStaff = this.m_currentMeasure.FindDescendantByComparison(comparisonFirst, 1);
    if (!layerElement.m_crossStaff) {
      LogWarning("Could not get the cross staff reference '%d' for element '%s'", crossElement.GetStaff().at(0), layerElement.GetID());
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    const parentStaff = layerElement.GetAncestorStaff();
    // Check if we have a cross-staff to itself...
    if (layerElement.m_crossStaff === parentStaff) {
      LogWarning("The cross staff reference '%d' for element '%s' seems to be identical to the parent staff",
        crossElement.GetStaff().at(0), layerElement.GetID());
      layerElement.m_crossStaff = null;
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    const parentLayer = layerElement.GetFirstAncestor(ClassId.LAYER);
    if (!parentLayer) throw new Error('PrepareCrossStaffFunctor requires a Layer ancestor');
    // Now try to get the corresponding layer - for now look for the same layer @n
    const layerN = parentLayer.GetN();
    const comparisonFirstLayer = new AttNIntegerComparison(ClassId.LAYER, layerN);
    const direction = (parentStaff.GetN() < layerElement.m_crossStaff.GetN()) ? FORWARD : BACKWARD;
    layerElement.m_crossLayer = layerElement.m_crossStaff.FindDescendantByComparison(comparisonFirstLayer, 1);
    if (!layerElement.m_crossLayer) {
      // Just try to pick the first one... (i.e., last one when crossing above)
      layerElement.m_crossLayer = layerElement.m_crossStaff.FindDescendantByType(ClassId.LAYER, undefined, direction);
    }
    if (!layerElement.m_crossLayer) {
      // Nothing we can do
      LogWarning("Could not get the layer with cross-staff reference '%d' for element '%s'",
        crossElement.GetStaff().at(0), layerElement.GetID());
      layerElement.m_crossStaff = null;
    }
    else {
      if (direction === FORWARD) {
        layerElement.m_crossLayer.SetCrossStaffFromAbove(true);
      }
      else {
        layerElement.m_crossLayer.SetCrossStaffFromBelow(true);
      }
    }

    this.m_currentCrossStaff = layerElement.m_crossStaff;
    this.m_currentCrossLayer = layerElement.m_crossLayer;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElementEnd(layerElement: AnyNode): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    const durInterface = layerElement.GetDurationInterface();
    if (durInterface) {
      // If we have @staff, reset it to NULL - this can be problematic if we have different @staff attributes
      // in the children of one element. We do not consider this now because it seems over the top
      // We would need to look at the @n attribute and to have a stack to handle this properly
      if (durInterface.HasStaff()) {
        this.m_currentCrossStaff = null;
        this.m_currentCrossLayer = null;
      }
    }
    else if (layerElement.IsAnyOf([ClassId.BEAM, ClassId.BTREM, ClassId.FTREM, ClassId.TUPLET])) {
      // For other elements (e.g., beams, tuplets) check if all their child duration elements are cross-staff
      // If yes, make them cross-staff themselves.
      const durations: AnyNode[] = [];
      const hasInterface = new InterfaceComparison(InterfaceId.INTERFACE_DURATION);
      layerElement.FindAllDescendantsByComparison(durations, hasInterface);
      let crossStaff: AnyNode = null;
      let crossLayer: AnyNode = null;
      for (const object of durations) {
        // The duration element is not cross-staff or the cross-staff is not the same staff (very rare)
        if (!object.m_crossStaff || (crossStaff && (object.m_crossStaff !== crossStaff))) {
          crossStaff = null;
          // We can stop here
          break;
        }
        else {
          crossStaff = object.m_crossStaff;
          crossLayer = object.m_crossLayer;
        }
      }
      if (crossStaff) {
        layerElement.m_crossStaff = crossStaff;
        layerElement.m_crossLayer = crossLayer;
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: AnyNode): FunctorCode {
    this.m_currentMeasure = measure;

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PrepareAltSymFunctor
//----------------------------------------------------------------------------

export class PrepareAltSymFunctor extends Functor {
  private m_symbolTable: AnyNode = null;

  public override ImplementsEndInterface(): boolean { return false; }

  public GetSymbolTable(): AnyNode { return this.m_symbolTable; }

  public VisitObject(object: AnyNode): FunctorCode {
    if (object.Is(ClassId.SCORE)) {
      if (!object.GetScoreDef()) throw new Error('PrepareAltSymFunctor requires a ScoreDef');
      this.m_symbolTable = object.GetScoreDef().FindDescendantByType(ClassId.SYMBOLTABLE);
    }

    if (object.HasInterface(InterfaceId.INTERFACE_ALT_SYM)) {
      const iface = object.GetAltSymInterface();
      if (!iface) throw new Error('PrepareAltSymFunctor requires the AltSymInterface');
      iface.InterfacePrepareAltSym(this, object);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PrepareFacsimileFunctor
//----------------------------------------------------------------------------

export class PrepareFacsimileFunctor extends Functor {
  private m_facsimile: AnyNode;
  private m_zonelessSyls: AnyNode[] = [];

  public constructor(facsimile: AnyNode) {
    super();
    this.m_facsimile = facsimile;
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public GetZonelessSyls(): readonly AnyNode[] { return this.m_zonelessSyls; }
  public GetFacsimile(): AnyNode { return this.m_facsimile; }

  public VisitObject(object: AnyNode): FunctorCode {
    if (object.HasInterface(InterfaceId.INTERFACE_FACSIMILE)) {
      const iface = object.GetFacsimileInterface();
      if (!iface) throw new Error('PrepareFacsimileFunctor requires the FacsimileInterface');
      if (iface.HasFacs()) {
        iface.InterfacePrepareFacsimile(this, object);
      }
      // Zoneless syl
      else if (object.Is(ClassId.SYL)) {
        this.m_zonelessSyls.push(object);
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PrepareLinkingFunctor
//----------------------------------------------------------------------------

export class PrepareLinkingFunctor extends Functor {
  private readonly collect = new CollectAndProcess();
  private m_nextIDPairs: { id: string; iface: LinkingInterface }[] = [];
  private m_sameasIDPairs: { id: string; iface: LinkingInterface; object?: AnyNode }[] = [];
  private m_stemSameasIDPairs = new Map<string, AnyNode>();

  public override ImplementsEndInterface(): boolean { return false; }

  public IsCollectingData(): boolean { return this.collect.IsCollectingData(); }
  public IsProcessingData(): boolean { return this.collect.IsProcessingData(); }
  public SetDataCollectionCompleted(): void { this.collect.SetDataCollectionCompleted(); }

  public GetNextIDPairs(): readonly { id: string; iface: LinkingInterface }[] { return this.m_nextIDPairs; }
  public GetSameasIDPairs(): readonly { id: string; iface: LinkingInterface; object?: AnyNode }[] { return this.m_sameasIDPairs; }
  public GetStemSameasIDPairs(): readonly [string, AnyNode][] { return [...this.m_stemSameasIDPairs.entries()]; }

  public InsertNextIDPair(nextID: string, iface: LinkingInterface): void {
    this.m_nextIDPairs.push({ id: nextID, iface });
  }

  public InsertSameasIDPair(sameasID: string, iface: LinkingInterface, object?: AnyNode): void {
    this.m_sameasIDPairs.push({ id: sameasID, iface, object });
  }

  public VisitObject(object: AnyNode): FunctorCode {
    if (this.IsCollectingData() && object.HasInterface(InterfaceId.INTERFACE_LINKING)) {
      const iface = object.GetLinkingInterface();
      if (!iface) throw new Error('PrepareLinkingFunctor requires the LinkingInterface');
      iface.InterfacePrepareLinking(this, object);
    }

    if (object.Is(ClassId.NOTE)) {
      this.ResolveStemSameas(object);
    }

    // @next
    const id = object.GetID();
    let i = 0;
    while (i < this.m_nextIDPairs.length) {
      if (this.m_nextIDPairs[i].id === id) {
        this.m_nextIDPairs[i].iface.SetNextLink(object);
        this.m_nextIDPairs.splice(i, 1);
      }
      else {
        ++i;
      }
    }

    // @sameas
    i = 0;
    while (i < this.m_sameasIDPairs.length) {
      if (this.m_sameasIDPairs[i].id === id) {
        const pair = this.m_sameasIDPairs[i];
        pair.iface.SetSameasLink(object);
        // Issue a warning if classes of object and sameas do not match.
        // In C++ the interface is dynamic_cast back to the owning Object; the TS
        // composition stores that owner in the pair when it was inserted.
        const owner = pair.object;
        if (owner && owner.GetClassId && (owner.GetClassId() !== object.GetClassId())) {
          LogWarning('%s with @xml:id %s has @sameas to an element of class %s.', owner.GetClassName(), owner.GetID(), object.GetClassName());
        }
        this.m_sameasIDPairs.splice(i, 1);
      }
      else {
        ++i;
      }
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  private ResolveStemSameas(note: AnyNode): void {
    // First pass we fill m_stemSameasIDPairs
    if (this.IsCollectingData()) {
      if (note.HasStemSameas()) {
        const idTarget = ExtractIDFragment(note.GetStemSameas());
        this.m_stemSameasIDPairs.set(idTarget, note);
      }
    }
    // Second pass we resolve links
    else {
      const id = note.GetID();
      if (this.m_stemSameasIDPairs.has(id)) {
        const noteStemSameas = this.m_stemSameasIDPairs.get(id)!;
        // Instanciate the bi-directional references and mark the roles as unset
        note.SetStemSameasNote(noteStemSameas);
        note.SetStemSameasRole(SAMEAS_UNSET);
        noteStemSameas.SetStemSameasNote(note);
        noteStemSameas.SetStemSameasRole(SAMEAS_UNSET);
        // Also resolve beams and instanciate the bi-directional references
        const beamStemSameas = noteStemSameas.GetAncestorBeam();
        if (beamStemSameas) {
          const beam = note.GetAncestorBeam();
          if (!beam) {
            // This is one thing that can go wrong. We can have many others here...
            // E.g., not the same number of notes, conflicting durations, not all notes sharing stems, ...
            // Not sure everything could be checked here.
            LogError('Notes with @stem.sameas in a beam should refer only to a note also in beam.');
          }
          else {
            beam.SetStemSameasBeam(beamStemSameas);
            beamStemSameas.SetStemSameasBeam(beam);
          }
        }
        this.m_stemSameasIDPairs.delete(id);
      }
    }
  }
}

//----------------------------------------------------------------------------
// PreparePlistFunctor
//----------------------------------------------------------------------------

export class PreparePlistFunctor extends Functor {
  private readonly collect = new CollectAndProcess();
  private m_plistObjectIDPairs: { object: AnyNode; id: string }[] = [];

  public override ImplementsEndInterface(): boolean { return false; }

  public IsCollectingData(): boolean { return this.collect.IsCollectingData(); }
  public IsProcessingData(): boolean { return this.collect.IsProcessingData(); }
  public SetDataCollectionCompleted(): void { this.collect.SetDataCollectionCompleted(); }

  public GetInterfaceIDPairs(): readonly { object: AnyNode; id: string }[] { return this.m_plistObjectIDPairs; }

  public InsertInterfaceObjectIDPair(objectWithPlist: AnyNode, elementID: string): void {
    this.m_plistObjectIDPairs.push({ object: objectWithPlist, id: elementID });
  }

  public VisitObject(object: AnyNode): FunctorCode {
    if (this.IsCollectingData()) {
      if (object.HasInterface(InterfaceId.INTERFACE_PLIST)) {
        const iface = object.GetPlistInterface();
        if (!iface) throw new Error('PreparePlistFunctor requires the PlistInterface');
        return iface.InterfacePreparePlist(this, object);
      }
    }
    else {
      if (!object.IsLayerElement() && !object.IsAnyOf([ClassId.ENDING, ClassId.EXPANSION, ClassId.SECTION]))
        return FunctorCode.FUNCTOR_CONTINUE;

      const id = object.GetID();
      let it = 0;
      while (it < this.m_plistObjectIDPairs.length) {
        if (this.m_plistObjectIDPairs[it].id === id) {
          const pair = this.m_plistObjectIDPairs[it];
          const iface = pair.object.GetPlistInterface();
          if (!iface) throw new Error('PreparePlistFunctor requires the PlistInterface');
          iface.SetRef(object);
          // Add back link to the object referred in the plist - for now only for Annot
          if (pair.object.Is(ClassId.ANNOTSCORE)) {
            object.AddPlistReference(pair.object);
          }
          this.m_plistObjectIDPairs.splice(it, 1);
        }
        else {
          ++it;
        }
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PrepareDurationFunctor
//----------------------------------------------------------------------------

export class PrepareDurationFunctor extends Functor {
  private m_durDefault: data_DURATION = DURATION_NONE as data_DURATION;
  private m_durDefaultForStaffN = new Map<number, data_DURATION>();

  public override ImplementsEndInterface(): boolean { return false; }

  public VisitLayerElement(layerElement: AnyNode): FunctorCode {
    const durInterface = layerElement.GetDurationInterface();
    if (durInterface) {
      durInterface.SetDurDefault(this.m_durDefault);
      // Check if there is a duration default for the staff
      if (this.m_durDefaultForStaffN.size !== 0) {
        const staff = layerElement.GetAncestorStaff(StaffSearch_RESOLVE_CROSS_STAFF);
        if (this.m_durDefaultForStaffN.has(staff.GetN())) {
          durInterface.SetDurDefault(this.m_durDefaultForStaffN.get(staff.GetN())!);
        }
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScore(score: AnyNode): FunctorCode {
    const scoreDef = score.GetScoreDef();
    if (scoreDef) {
      scoreDef.Process(this);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScoreDef(scoreDef: AnyNode): FunctorCode {
    this.m_durDefaultForStaffN.clear();
    this.m_durDefault = scoreDef.GetDurDefault();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaffDef(staffDef: AnyNode): FunctorCode {
    if (staffDef.HasDurDefault() && staffDef.HasN()) {
      this.m_durDefaultForStaffN.set(staffDef.GetN(), staffDef.GetDurDefault());
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PrepareTimePointingFunctor
//----------------------------------------------------------------------------

export class PrepareTimePointingFunctor extends Functor {
  private m_timePointingInterfaces: { iface: AnyNode; classId: ClassId }[] = [];

  public override ImplementsEndInterface(): boolean { return true; }

  public InsertInterfaceIDTuple(classId: ClassId, iface: AnyNode): void {
    this.m_timePointingInterfaces.push({ iface, classId });
  }

  public VisitF(f: AnyNode): FunctorCode {
    // At this stage we require <f> to have a @startid - eventually we can
    // modify this method and set as start the parent <harm> so @startid would not be
    // required anymore

    // Pass it to the pseudo functor of the iface
    const iface = f.GetTimePointInterface();
    if (!iface) throw new Error('PrepareTimePointingFunctor requires the TimePointInterface');
    return iface.InterfacePrepareTimePointing(this, f);
  }

  public VisitFloatingObject(floatingObject: AnyNode): FunctorCode {
    // Pass it to the pseudo functor of the iface
    if (floatingObject.HasInterface(InterfaceId.INTERFACE_TIME_POINT)) {
      const iface = floatingObject.GetTimePointInterface();
      if (!iface) throw new Error('PrepareTimePointingFunctor requires the TimePointInterface');
      return iface.InterfacePrepareTimePointing(this, floatingObject);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: AnyNode): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    // Do not look for tstamp pointing to these
    if (layerElement.IsAnyOf([ClassId.ARTIC, ClassId.BEAM, ClassId.FLAG, ClassId.REFRAIN, ClassId.TUPLET, ClassId.STEM, ClassId.VERSE])) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    let iter = 0;
    while (iter < this.m_timePointingInterfaces.length) {
      if (this.m_timePointingInterfaces[iter].iface.SetStartOnly(layerElement)) {
        // We have both the start and the end that are matched
        this.m_timePointingInterfaces.splice(iter, 1);
      }
      else {
        ++iter;
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasureEnd(measure: AnyNode): FunctorCode {
    if (this.m_timePointingInterfaces.length !== 0) {
      LogWarning('%d time pointing element(s) could not be matched in measure %s', this.m_timePointingInterfaces.length, measure.GetID());
    }

    this.m_timePointingInterfaces.length = 0;

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PrepareTimeSpanningFunctor
//----------------------------------------------------------------------------

export class PrepareTimeSpanningFunctor extends Functor {
  private readonly collect = new CollectAndProcess();
  private m_insideMeasure = false;
  private m_timeSpanningInterfaces: { iface: TimeSpanningInterface; owner: AnyNode }[] = [];

  public override ImplementsEndInterface(): boolean { return true; }

  public IsCollectingData(): boolean { return this.collect.IsCollectingData(); }
  public IsProcessingData(): boolean { return this.collect.IsProcessingData(); }
  public SetDataCollectionCompleted(): void { this.collect.SetDataCollectionCompleted(); }

  public GetInterfaceOwnerPairs(): readonly { iface: TimeSpanningInterface; owner: AnyNode }[] { return this.m_timeSpanningInterfaces; }

  public InsertInterfaceOwnerPair(owner: AnyNode, iface: TimeSpanningInterface): void {
    this.m_timeSpanningInterfaces.push({ iface, owner });
  }

  public VisitF(f: AnyNode): FunctorCode {
    if (!this.m_insideMeasure) {
      return this.CallPseudoFunctor(f);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitFloatingObject(floatingObject: AnyNode): FunctorCode {
    if (!this.m_insideMeasure && floatingObject.HasInterface(InterfaceId.INTERFACE_TIME_SPANNING)) {
      return this.CallPseudoFunctor(floatingObject);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: AnyNode): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    // Do not look for tstamp pointing to these
    if (layerElement.IsAnyOf([ClassId.ARTIC, ClassId.BEAM, ClassId.FLAG, ClassId.REFRAIN, ClassId.TUPLET, ClassId.STEM, ClassId.VERSE])) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    let iter = 0;
    while (iter < this.m_timeSpanningInterfaces.length) {
      const pair = this.m_timeSpanningInterfaces[iter];
      if (pair.iface.SetStartAndEnd(layerElement)) {
        // Verify that the iface owner is encoded in the measure of its start
        pair.iface.VerifyMeasure(pair.owner);
        // We have both the start and the end that are matched
        this.m_timeSpanningInterfaces.splice(iter, 1);
      }
      else {
        ++iter;
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: AnyNode): FunctorCode {
    if (this.IsCollectingData()) {
      const timeSpanningObjects: AnyNode[] = [];
      const ic = new InterfaceComparison(InterfaceId.INTERFACE_TIME_SPANNING);
      measure.FindAllDescendantsByComparison(timeSpanningObjects, ic);
      for (const object of timeSpanningObjects) {
        this.CallPseudoFunctor(object);
      }
    }
    this.m_insideMeasure = true;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasureEnd(_measure: AnyNode): FunctorCode {
    if (this.IsCollectingData()) {
      let iter = 0;
      while (iter < this.m_timeSpanningInterfaces.length) {
        // At the end of the measure we remove elements for which we do not need to match the end (for now).
        // Eventually, we could consider them, for example if we want to display their spanning or for
        // improved MIDI output
        if (this.m_timeSpanningInterfaces[iter].owner.GetClassId() === ClassId.HARM) {
          this.m_timeSpanningInterfaces.splice(iter, 1);
        }
        else {
          ++iter;
        }
      }
    }
    this.m_insideMeasure = false;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  private CallPseudoFunctor(timeSpanningObject: AnyNode): FunctorCode {
    const iface = timeSpanningObject.GetTimeSpanningInterface();
    if (!iface) throw new Error('PrepareTimeSpanningFunctor requires the TimeSpanningInterface');
    return iface.InterfacePrepareTimeSpanning(this, timeSpanningObject);
  }
}

//----------------------------------------------------------------------------
// PrepareTimestampsFunctor
//----------------------------------------------------------------------------

export class PrepareTimestampsFunctor extends Functor {
  private m_timeSpanningInterfaces: { iface: TimeSpanningInterface; classId: ClassId }[] = [];
  private m_tstamps: { object: AnyNode; beat: [number, number] }[] = [];

  public override ImplementsEndInterface(): boolean { return true; }

  public GetInterfaceIDPairs(): readonly { iface: TimeSpanningInterface; classId: ClassId }[] { return this.m_timeSpanningInterfaces; }

  public InsertInterfaceIDPair(classId: ClassId, iface: TimeSpanningInterface): void {
    this.m_timeSpanningInterfaces.push({ iface, classId });
  }

  public InsertObjectBeatPair(object: AnyNode, beat: data_MEASUREBEAT): void {
    this.m_tstamps.push({ object, beat: [beat[0], beat[1]] });
  }

  public VisitDocEnd(doc: AnyNode): FunctorCode {
    if (!doc.GetOptions().m_openControlEvents.GetValue() || this.m_timeSpanningInterfaces.length === 0) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    const lastMeasure = doc.FindDescendantByType(ClassId.MEASURE, UNLIMITED_DEPTH, BACKWARD);
    if (!lastMeasure) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    for (const pair of this.m_timeSpanningInterfaces) {
      if (!pair.iface.GetEnd()) {
        pair.iface.SetEnd(lastMeasure.GetRightBarLine());
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitF(f: AnyNode): FunctorCode {
    // Using @tstamp on <f> will work only if @staff is also given on <f>

    // Pass it to the pseudo functor of the iface
    const iface = f.GetTimeSpanningInterface();
    if (!iface) throw new Error('PrepareTimestampsFunctor requires the TimeSpanningInterface');
    return iface.InterfacePrepareTimestamps(this, f);
  }

  public VisitFloatingObject(floatingObject: AnyNode): FunctorCode {
    // Pass it to the pseudo functor of the iface
    if (floatingObject.HasInterface(InterfaceId.INTERFACE_TIME_POINT)) {
      const iface = floatingObject.GetTimePointInterface();
      if (!iface) throw new Error('PrepareTimestampsFunctor requires the TimePointInterface');
      return iface.InterfacePrepareTimestamps(this, floatingObject);
    }
    else if (floatingObject.HasInterface(InterfaceId.INTERFACE_TIME_SPANNING)) {
      const iface = floatingObject.GetTimeSpanningInterface();
      if (!iface) throw new Error('PrepareTimestampsFunctor requires the TimeSpanningInterface');
      return iface.InterfacePrepareTimestamps(this, floatingObject);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasureEnd(measure: AnyNode): FunctorCode {
    let iter = 0;
    // Loop through the object/beat pairs and create the TimestampAttr when necessary
    while (iter < this.m_tstamps.length) {
      const pair = this.m_tstamps[iter];
      // -1 means that we have a @tstamp (start) to add to the current measure
      if (pair.beat[0] === -1) {
        const iface = pair.object.GetTimePointInterface();
        if (!iface) throw new Error('PrepareTimestampsFunctor requires the TimePointInterface');
        const timestampAttr = measure.m_timestampAligner.GetTimestampAtTime(pair.beat[1]);
        iface.SetStart(timestampAttr);
        // purge the list of unmatched elements if this is a TimeSpanningInterface element
        if (pair.object.HasInterface(InterfaceId.INTERFACE_TIME_SPANNING)) {
          const tsInterface = pair.object.GetTimeSpanningInterface();
          if (!tsInterface) throw new Error('PrepareTimestampsFunctor requires the TimeSpanningInterface');
          if (tsInterface.HasStartAndEnd()) {
            const item = this.m_timeSpanningInterfaces.findIndex((p) => p.iface === tsInterface);
            if (item !== -1) {
              this.m_timeSpanningInterfaces.splice(item, 1);
            }
          }
        }
        // remove it
        this.m_tstamps.splice(iter, 1);
      }
      // 0 means that we have a @tstamp2 (end) to add to the current measure
      else if (pair.beat[0] === 0) {
        const iface = pair.object.GetTimeSpanningInterface();
        if (!iface) throw new Error('PrepareTimestampsFunctor requires the TimeSpanningInterface');
        const timestampAttr = measure.m_timestampAligner.GetTimestampAtTime(pair.beat[1]);
        iface.SetEnd(timestampAttr);
        // We can check if the iface is now fully mapped (start / end) and purge the list of unmatched
        // elements
        if (iface.HasStartAndEnd()) {
          const item = this.m_timeSpanningInterfaces.findIndex((p) => p.iface === iface);
          if (item !== -1) {
            this.m_timeSpanningInterfaces.splice(item, 1);
          }
        }
        this.m_tstamps.splice(iter, 1);
      }
      // we have not reached the correct end measure yet
      else {
        pair.beat[0]--;
        ++iter;
      }
    }

    // Here we can also set the start for F within Harm that have no @startid or @tstamp but might have an extender
    const fs = measure.FindAllDescendantsByType(ClassId.FIGURE);
    for (const object of fs) {
      const f = object;
      // Nothing to do if the f has a start or has no end
      if (f.GetStart() || !f.GetEnd()) continue;

      const harm = f.GetFirstAncestor(ClassId.HARM);
      if (harm) {
        f.SetStart(harm.GetStart());
        // We should also remove the f from the list because we can consider it as being mapped now
        const item = this.m_timeSpanningInterfaces.findIndex((p) => p.iface === f.GetTimeSpanningInterface());
        if (item !== -1) {
          this.m_timeSpanningInterfaces.splice(item, 1);
        }
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PreparePedalsFunctor
//----------------------------------------------------------------------------

export class PreparePedalsFunctor extends DocFunctor {
  private m_pedalLines: AnyNode[] = [];

  public override ImplementsEndInterface(): boolean { return true; }

  public VisitMeasureEnd(_measure: AnyNode): FunctorCode {
    // Match down and up pedal lines
    let iter = 0;
    while (iter < this.m_pedalLines.length) {
      const current = this.m_pedalLines[iter];
      if (current.GetDir() !== pedalLog_DIR_down) {
        ++iter;
        continue;
      }
      // C++ compares staff vectors by value (operator==); TS arrays need element-wise compare.
      const curStaff = JSON.stringify(current.GetStaff());
      const upIdx = this.m_pedalLines.findIndex((pedal) =>
        (JSON.stringify(pedal.GetStaff()) === curStaff) && (pedal.GetDir() !== pedalLog_DIR_down));
      if (upIdx !== -1) {
        current.SetEnd(this.m_pedalLines[upIdx].GetStart());
        if (this.m_pedalLines[upIdx].GetDir() === pedalLog_DIR_bounce) {
          current.EndsWithBounce(true);
        }
        this.m_pedalLines.splice(upIdx, 1);
        // C++ erases at the (possibly shifted) down-pedal position afterwards
        if (upIdx < iter) iter--;
        this.m_pedalLines.splice(iter, 1);
      }
      else {
        ++iter;
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPedal(pedal: AnyNode): FunctorCode {
    if (!pedal.HasDir()) return FunctorCode.FUNCTOR_CONTINUE;

    const system = pedal.GetFirstAncestor(ClassId.SYSTEM);
    if (!system) throw new Error('PreparePedalsFunctor requires a System ancestor');
    const form = pedal.GetPedalForm(this.GetDoc(), system);
    if ((form === PEDALSTYLE_line) || (form === PEDALSTYLE_pedline)) {
      this.m_pedalLines.push(pedal);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PreparePointersByLayerFunctor
//----------------------------------------------------------------------------

export class PreparePointersByLayerFunctor extends Functor {
  private m_currentElement: AnyNode = null;
  private m_lastDot: AnyNode = null;

  public override ImplementsEndInterface(): boolean { return true; }

  public VisitDot(dot: AnyNode): FunctorCode {
    dot.m_drawingPreviousElement = this.m_currentElement;
    this.m_lastDot = dot;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: AnyNode): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    // Skip ligatures because we want it attached to the first note in it
    if (this.m_lastDot && !layerElement.Is(ClassId.LIGATURE)) {
      this.m_lastDot.m_drawingNextElement = layerElement;
      this.m_lastDot = null;
    }
    if (layerElement.Is(ClassId.BARLINE)) {
      // Do not attach a note when a barline is passed
      this.m_currentElement = null;
    }
    else if (layerElement.IsAnyOf([ClassId.NOTE, ClassId.REST])) {
      this.m_currentElement = layerElement;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasureEnd(measure: AnyNode): FunctorCode {
    if (this.m_lastDot) {
      this.m_lastDot.m_drawingNextElement = measure.GetRightBarLine();
      this.m_lastDot = null;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PrepareLyricsFunctor
//----------------------------------------------------------------------------

export class PrepareLyricsFunctor extends Functor {
  private m_currentSyl: AnyNode = null;
  private m_lastNoteOrChord: AnyNode = null;
  private m_penultimateNoteOrChord: AnyNode = null;
  private m_voltaTrack: number;

  public constructor(voltaTrack = 0) {
    super();
    this.m_voltaTrack = voltaTrack;
  }

  public override ImplementsEndInterface(): boolean { return true; }

  public VisitChord(chord: AnyNode): FunctorCode {
    this.m_penultimateNoteOrChord = this.m_lastNoteOrChord;
    this.m_lastNoteOrChord = chord;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitDocEnd(doc: AnyNode): FunctorCode {
    if (!this.m_currentSyl) {
      return FunctorCode.FUNCTOR_STOP; // early return
    }
    if (this.m_lastNoteOrChord && (this.m_currentSyl.GetStart() !== this.m_lastNoteOrChord)) {
      this.m_currentSyl.SetEnd(this.m_lastNoteOrChord);
    }
    else if (doc.GetOptions().m_openControlEvents.GetValue()) {
      const wordpos = this.m_currentSyl.GetWordpos();
      if ((wordpos === sylLog_WORDPOS_i) || (wordpos === sylLog_WORDPOS_m)) {
        const lastMeasure = doc.FindDescendantByType(ClassId.MEASURE, UNLIMITED_DEPTH, BACKWARD);
        if (!lastMeasure) throw new Error('PrepareLyricsFunctor requires a last measure');
        this.m_currentSyl.SetEnd(lastMeasure.GetRightBarLine());
      }
    }

    return FunctorCode.FUNCTOR_STOP;
  }

  public VisitNote(note: AnyNode): FunctorCode {
    if (!note.IsChordTone()) {
      this.m_penultimateNoteOrChord = this.m_lastNoteOrChord;
      this.m_lastNoteOrChord = note;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSyl(syl: AnyNode): FunctorCode {
    const volta = syl.GetFirstAncestor(ClassId.VOLTA);
    const voltaTrack = volta ? volta.GetDrawingVoltaN() : 0;
    if (voltaTrack !== this.m_voltaTrack) return FunctorCode.FUNCTOR_CONTINUE;

    const lyricElement = syl.GetFirstAncestorInRange(ClassId.LYRIC_ELEMENT, ClassId.LYRIC_ELEMENT_max, MAX_NOTE_DEPTH);
    if (lyricElement) {
      const lineN = volta ? lyricElement.GetVoltaLineN(volta) : 1;
      syl.m_drawingVerseN = lyricElement.GetDrawingVerseN() + (lyricElement.Is(ClassId.REFRAIN) ? lineN - 1 : 0);
      syl.m_drawingVersePlace = lyricElement.GetPlace();
      syl.m_drawingVoltaN = lyricElement.Is(ClassId.REFRAIN) ? 1 : lineN;
    }

    syl.SetStart(syl.GetFirstAncestor(ClassId.NOTE, MAX_NOTE_DEPTH));
    // If there isn't an ancestor note, it should be a chord
    if (!syl.GetStart()) {
      syl.SetStart(syl.GetFirstAncestor(ClassId.CHORD, MAX_CHORD_DEPTH));
    }
    const isEmptySyl = syl.IsEmpty();

    // At this stage currentSyl is actually the previous one that is ending here
    if (this.m_currentSyl) {
      // The previous syl was an initial or median -> The note we just parsed is the end
      if ((this.m_currentSyl.GetWordpos() === sylLog_WORDPOS_i) || (this.m_currentSyl.GetWordpos() === sylLog_WORDPOS_m)) {
        if (!isEmptySyl) {
          this.m_currentSyl.SetEnd(this.m_lastNoteOrChord);
          this.m_currentSyl.m_nextWordSyl = syl;
        }
      }
      // The previous syl was an underscore -> the explicit empty endpoint or the previous but one was the end.
      else if (this.m_currentSyl.GetCon() === sylLog_CON_u) {
        const end = isEmptySyl ? syl.GetStart() : this.m_penultimateNoteOrChord;
        if (end && (this.m_currentSyl.GetStart() === end)) {
          LogWarning("Syllable with underline extender under one single note '%s'", this.m_currentSyl.GetStart().GetID());
        }
        else if (end) {
          this.m_currentSyl.SetEnd(end);
        }
      }
    }

    if (isEmptySyl) {
      this.m_currentSyl = null;
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    // Now decide what to do with the starting syl and check if it has a forward connector
    if ((syl.GetWordpos() === sylLog_WORDPOS_i) || (syl.GetWordpos() === sylLog_WORDPOS_m)) {
      this.m_currentSyl = syl;
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    else if (syl.GetCon() === sylLog_CON_u) {
      this.m_currentSyl = syl;
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    else {
      this.m_currentSyl = null;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PrepareLayerElementPartsFunctor
//----------------------------------------------------------------------------

export class PrepareLayerElementPartsFunctor extends DocFunctor {
  public override ImplementsEndInterface(): boolean { return false; }

  public VisitChord(chord: AnyNode): FunctorCode {
    let currentStem = chord.FindDescendantByType(ClassId.STEM, 1);
    let currentFlag = null;
    if (currentStem) currentFlag = currentStem.GetFirst(ClassId.FLAG);

    currentStem = this.EnsureStemExists(currentStem, chord);
    currentStem.CopyGracedFrom(chord);
    currentStem.FillAttributes(chord);

    const duration = chord.GetDurationInterface().GetNoteOrChordDur(chord);
    if ((duration < DURATION_2) || (chord.GetStemVisible() === BOOLEAN_false)) {
      currentStem.SetVirtual(true);
    }

    const shouldHaveFlag = ((duration > DURATION_4) && !chord.IsInBeam() && !chord.GetAncestorFTrem());
    currentFlag = this.ProcessFlag(currentFlag, currentStem, shouldHaveFlag);

    chord.SetDrawingStem(currentStem);

    // Calculate chord note groups (except for chord clusters)
    if (!chord.HasCluster()) chord.CalculateNoteGroups();

    // Also set the drawing stem object (or NULL) to all child notes
    const childList = chord.GetList();
    for (const child of childList) {
      if (!child.Is(ClassId.NOTE)) throw new Error('PrepareLayerElementPartsFunctor requires Note children');
      child.SetDrawingStem(currentStem);
    }

    /************ dots ***********/

    let currentDots = chord.FindDescendantByType(ClassId.DOTS, 1);

    const shouldHaveDots = (chord.GetDots() > 0);
    currentDots = this.ProcessDots(currentDots, chord, shouldHaveDots);

    /************ Prepare the drawing cue size ************/

    const prepareCueSize = new PrepareCueSizeFunctor();
    chord.Process(prepareCueSize);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNote(note: AnyNode): FunctorCode {
    let currentStem = note.FindDescendantByType(ClassId.STEM, 1);
    let currentFlag = null;
    const chord = note.IsChordTone();
    if (currentStem) currentFlag = currentStem.GetFirst(ClassId.FLAG);

    if (!note.IsChordTone() && !note.IsTabGrpNote()) {
      currentStem = this.EnsureStemExists(currentStem, note);
      currentStem.CopyGracedFrom(note);
      currentStem.FillAttributes(note);

      if (note.GetActualDur() < DURATION_2 || (note.GetStemVisible() === BOOLEAN_false)) {
        currentStem.SetVirtual(true);
      }
    }
    // This will happen only if the duration has changed
    else if (currentStem) {
      if (note.DeleteChild(currentStem)) {
        currentStem = null;
        // The currentFlag (if any) will have been deleted above
        currentFlag = null;
      }
    }

    /************ dots ***********/

    let currentDots = note.FindDescendantByType(ClassId.DOTS, 1);

    const shouldHaveDots = (note.GetDots() > 0);
    if (shouldHaveDots && chord && (chord.GetDots() === note.GetDots())) {
      LogWarning("Note '%s' with a @dots attribute with the same value as its chord parent", note.GetID());
    }
    currentDots = this.ProcessDots(currentDots, note, shouldHaveDots);

    // We don't care about flags in mensural notes
    if (note.IsMensuralDur()) return FunctorCode.FUNCTOR_CONTINUE;

    if (currentStem) {
      const shouldHaveFlag = ((note.GetActualDur() > DURATION_4) && !note.IsInBeam()
        && !note.GetAncestorFTrem() && !note.IsChordTone() && !note.IsTabGrpNote());
      currentFlag = this.ProcessFlag(currentFlag, currentStem, shouldHaveFlag);

      if (!chord) note.SetDrawingStem(currentStem);
    }

    /************ Prepare the drawing cue size ************/

    const prepareCueSize = new PrepareCueSizeFunctor();
    note.Process(prepareCueSize);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitRest(rest: AnyNode): FunctorCode {
    let currentDots = rest.FindDescendantByType(ClassId.DOTS, 1);

    const shouldHaveDots = (rest.GetDur() > DURATION_breve) && (rest.GetDots() > 0);
    currentDots = this.ProcessDots(currentDots, rest, shouldHaveDots);

    /************ Prepare the drawing cue size ************/

    const prepareCueSize = new PrepareCueSizeFunctor();
    rest.Process(prepareCueSize);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTabDurSym(tabDurSym: AnyNode): FunctorCode {
    let currentStem = tabDurSym.FindDescendantByType(ClassId.STEM, 1);
    let currentFlag = null;
    if (currentStem) currentFlag = currentStem.GetFirst(ClassId.FLAG);

    currentStem = this.EnsureStemExists(currentStem, tabDurSym);
    tabDurSym.SetDrawingStem(currentStem);

    /************ flags ***********/

    const tabGrp = tabDurSym.GetFirstAncestor(ClassId.TABGRP);
    if (!tabGrp) throw new Error('PrepareLayerElementPartsFunctor requires a TabGrp ancestor');

    // No flag within beam for durations longer than 8th notes
    const shouldHaveFlag = (!tabDurSym.IsInBeam() && (tabGrp.GetActualDur() > DURATION_4));
    currentFlag = this.ProcessFlag(currentFlag, currentStem, shouldHaveFlag);

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitTuplet(tuplet: AnyNode): FunctorCode {
    let currentBracket = tuplet.GetFirst(ClassId.TUPLET_BRACKET);
    let currentNum = tuplet.GetFirst(ClassId.TUPLET_NUM);

    const showHidden = (this.GetDoc().GetOptions().m_showHidden.GetValue());

    let beamed = false;
    // Are we contained in a beam?
    const ancestorBeam = tuplet.GetFirstAncestor(ClassId.BEAM, MAX_BEAM_DEPTH);
    if (ancestorBeam) {
      // is only the tuplet beamed? (will not work with nested tuplets)
      if (ancestorBeam.GetChildCount() === 1) {
        beamed = true;
      }
    }
    // Is a beam or bTrem the only child? (will not work with editorial elements)
    if (tuplet.GetChildCount() === 1) {
      if ((tuplet.GetChildCount(ClassId.BEAM) === 1) || (tuplet.GetChildCount(ClassId.BTREM) === 1)) beamed = true;
    }

    if ((!tuplet.HasBracketVisible() && !beamed) || showHidden || (tuplet.GetBracketVisible() === BOOLEAN_true)) {
      if (!currentBracket) {
        currentBracket = new TupletBracket();
        tuplet.AddChild(currentBracket);
      }
      currentBracket.CopyTupletVisFrom(tuplet);
    }
    // This will happen only if the @bracket.visible value has changed
    else if (currentBracket) {
      if (tuplet.DeleteChild(currentBracket)) {
        currentBracket = null;
      }
    }

    if (tuplet.HasNum() && (showHidden || (tuplet.GetNumVisible() !== BOOLEAN_false))) {
      if (!currentNum) {
        currentNum = new TupletNum();
        tuplet.AddChild(currentNum);
      }
      currentNum.CopyNumberPlacementFrom(tuplet);
      currentNum.CopyTupletVisFrom(tuplet);
    }
    // This will happen only if the @num.visible value has changed
    else if (currentNum) {
      if (tuplet.DeleteChild(currentNum)) {
        currentNum = null;
      }
    }

    /************ Prepare the drawing cue size ************/

    const prepareCueSize = new PrepareCueSizeFunctor();
    tuplet.Process(prepareCueSize);

    /*********** Set the left and right element ***********/

    const comparison = new ClassIdsComparison([ClassId.CHORD, ClassId.NOTE, ClassId.REST]);
    tuplet.SetDrawingLeft(tuplet.FindDescendantByComparison(comparison));
    tuplet.SetDrawingRight(tuplet.FindDescendantByComparison(comparison, UNLIMITED_DEPTH, BACKWARD));

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  private EnsureStemExists(stem: Stem | null, parent: AnyNode): Stem {
    if (!parent) throw new Error('EnsureStemExists requires a parent');

    if (!stem) {
      stem = new Stem();
      stem.SetAttribute(true);
      parent.AddChild(stem);
    }
    return stem;
  }

  private ProcessDots(dots: Dots | null, parent: AnyNode, shouldExist: boolean): Dots | null {
    if (!parent) throw new Error('ProcessDots requires a parent');
    const durIface = parent.GetDurationInterface();
    if (!durIface) throw new Error('ProcessDots requires a DurationInterface');

    if (shouldExist) {
      if (!dots) {
        dots = new Dots();
        parent.AddChild(dots);
      }
      // C++ AttAugmentDots::operator= copies the @dots attribute value
      dots.SetDots(durIface.GetDots());
    }
    else if (dots) {
      if (parent.DeleteChild(dots)) {
        dots = null;
      }
    }
    return dots;
  }

  private ProcessFlag(flag: AnyNode, parent: AnyNode, shouldExist: boolean): AnyNode {
    if (!parent) throw new Error('ProcessFlag requires a parent');

    if (shouldExist) {
      if (!flag) {
        flag = new Flag();
        parent.AddChild(flag);
      }
    }
    else if (flag) {
      if (parent.DeleteChild(flag)) {
        flag = null;
      }
    }
    return flag;
  }
}

//----------------------------------------------------------------------------
// PrepareRptFunctor
//----------------------------------------------------------------------------

export class PrepareRptFunctor extends DocFunctor {
  private m_currentMRpt: AnyNode = null;
  private m_multiNumber: number = BOOLEAN_NONE;

  public override ImplementsEndInterface(): boolean { return false; }

  public VisitLayer(layer: AnyNode): FunctorCode {
    // If we have encountered a mRpt before and there is none in this layer, reset it to NULL
    if (this.m_currentMRpt && !layer.FindDescendantByType(ClassId.MRPT)) {
      this.m_currentMRpt = null;
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMRpt(mRpt: AnyNode): FunctorCode {
    // If multiNumber is not true, nothing needs to be done
    if (this.m_multiNumber !== BOOLEAN_true) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    // If this is the first one, number has to be 2
    if (this.m_currentMRpt === null) {
      mRpt.m_drawingMeasureCount = 2;
    }
    // Otherwise increment it
    else {
      mRpt.m_drawingMeasureCount = this.m_currentMRpt.m_drawingMeasureCount + 1;
    }
    this.m_currentMRpt = mRpt;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: AnyNode): FunctorCode {
    // If multiNumber is set, we already know that nothing needs to be done
    // Furthermore, if @multi.number is false, the functor should have stopped (see below)
    if (this.m_multiNumber !== BOOLEAN_NONE) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    // This is happening only for the first staff element of the staff @n
    const score = this.GetDoc().GetCorrespondingScore(staff);
    const scoreDef = score.GetScoreDef();
    if (!scoreDef) throw new Error('PrepareRptFunctor requires a ScoreDef');
    const staffDef = scoreDef.GetStaffDef(staff.GetN());
    if (staffDef) {
      const hideNumber = (staffDef.GetMultiNumber() === BOOLEAN_false)
        || ((staffDef.GetMultiNumber() !== BOOLEAN_true) && (scoreDef.GetMultiNumber() === BOOLEAN_false));
      if (hideNumber) {
        // Set it just in case, but stopping the functor should do it for this staff @n
        this.m_multiNumber = BOOLEAN_false;
        return FunctorCode.FUNCTOR_STOP;
      }
    }
    this.m_multiNumber = BOOLEAN_true;
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PrepareDelayedTurnsFunctor
//----------------------------------------------------------------------------

export class PrepareDelayedTurnsFunctor extends Functor {
  private readonly collect = new CollectAndProcess();
  private m_delayedTurns = new Map<AnyNode, AnyNode>();
  private m_previousElement: AnyNode = null;
  private m_currentChord: AnyNode = null;
  private m_currentTurn: AnyNode = null;

  public constructor() {
    super();
    this.ResetCurrent();
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public IsCollectingData(): boolean { return this.collect.IsCollectingData(); }
  public IsProcessingData(): boolean { return this.collect.IsProcessingData(); }
  public SetDataCollectionCompleted(): void { this.collect.SetDataCollectionCompleted(); }

  public GetDelayedTurns(): readonly [AnyNode, AnyNode][] { return [...this.m_delayedTurns.entries()]; }

  public ResetCurrent(): void {
    this.m_previousElement = null;
    this.m_currentChord = null;
    this.m_currentTurn = null;
  }

  public VisitLayerElement(layerElement: AnyNode): FunctorCode {
    // We are initializing the m_delayedTurns map
    if (this.IsCollectingData()) return FunctorCode.FUNCTOR_CONTINUE;

    if (!layerElement.HasInterface(InterfaceId.INTERFACE_DURATION)) return FunctorCode.FUNCTOR_CONTINUE;

    if (this.m_previousElement) {
      if (!this.m_currentTurn) throw new Error('PrepareDelayedTurnsFunctor requires the current turn');
      if (layerElement.Is(ClassId.NOTE) && this.m_currentChord) {
        if (layerElement.IsChordTone() === this.m_currentChord) return FunctorCode.FUNCTOR_CONTINUE;
      }
      this.m_currentTurn.m_drawingEndElement = layerElement;
      this.ResetCurrent();
    }

    if (this.m_delayedTurns.has(layerElement)) {
      this.m_previousElement = layerElement;
      this.m_currentTurn = this.m_delayedTurns.get(layerElement)!;
      if (layerElement.Is(ClassId.CHORD)) {
        return FunctorCode.FUNCTOR_SIBLINGS;
      }
      else if (layerElement.Is(ClassId.NOTE)) {
        const chord = layerElement.IsChordTone();
        if (chord) this.m_currentChord = chord;
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTurn(turn: AnyNode): FunctorCode {
    // We already initialized the m_delayedTurns map
    if (this.IsProcessingData()) return FunctorCode.FUNCTOR_CONTINUE;

    // Map only delayed turns
    if (turn.GetDelayed() !== BOOLEAN_true) return FunctorCode.FUNCTOR_CONTINUE;

    // Map only delayed turn pointing to a LayerElement (i.e., not using @tstamp)
    if (turn.GetStart() && !turn.GetStart().Is(ClassId.TIMESTAMP_ATTR)) {
      this.m_delayedTurns.set(turn.GetStart(), turn);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PrepareMilestonesFunctor
//----------------------------------------------------------------------------

export class PrepareMilestonesFunctor extends Functor {
  private m_lastMeasure: AnyNode = null;
  private m_currentEnding: AnyNode = null;
  private m_startMilestones: AnyNode[] = [];

  public override ImplementsEndInterface(): boolean { return false; }

  public GetStartMilestones(): readonly AnyNode[] { return this.m_startMilestones; }

  public InsertStartMilestone(iface: AnyNode): void {
    this.m_startMilestones.push(iface);
  }

  public VisitEditorialElement(editorialElement: AnyNode): FunctorCode {
    if (editorialElement.IsSystemMilestone()) {
      editorialElement.InterfacePrepareMilestones(this);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitEnding(ending: AnyNode): FunctorCode {
    // Endings should always have an SystemMilestoneEnd
    if (!ending.IsSystemMilestone()) throw new Error('PrepareMilestonesFunctor requires a system milestone ending');

    ending.InterfacePrepareMilestones(this);

    this.m_currentEnding = ending;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: AnyNode): FunctorCode {
    for (const milestone of this.m_startMilestones) {
      milestone.SetMeasure(measure);
    }
    this.m_startMilestones.length = 0;

    if (this.m_currentEnding) {
      // Set the ending to each measure in between
      measure.SetDrawingEnding(this.m_currentEnding);
    }

    // Keep a pointer to the measure for when we are reaching the end (see VisitSystemMilestone)
    this.m_lastMeasure = measure;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSection(section: AnyNode): FunctorCode {
    if (section.IsSystemMilestone()) {
      section.InterfacePrepareMilestones(this);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemMilestone(systemMilestoneEnd: AnyNode): FunctorCode {
    // We set its pointer to the last measure we have encountered - this can be NULL in case no measure exists before
    // the end milestone
    // This can happen with a editorial container around a scoreDef at the beginning
    systemMilestoneEnd.SetMeasure(this.m_lastMeasure);

    // Endings are also set as Measure::m_drawingEnding for all measures in between - when we reach the end milestone of
    // an ending, we need to set the m_currentEnding to NULL
    if (this.m_currentEnding && systemMilestoneEnd.GetStart().Is(ClassId.ENDING)) {
      this.m_currentEnding = null;
      // With ending we need the drawing measure - this will crash with en empty ending at the beginning of a score...
      if (!systemMilestoneEnd.GetMeasure()) throw new Error('PrepareMilestonesFunctor requires a drawing measure');
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PrepareFloatingGrpsFunctor
//----------------------------------------------------------------------------

export class PrepareFloatingGrpsFunctor extends Functor {
  private m_previousEnding: AnyNode = null;
  private m_dynams: AnyNode[] = [];
  private m_hairpins: AnyNode[] = [];
  private m_harms = new Map<string, AnyNode>();

  public override ImplementsEndInterface(): boolean { return true; }

  public VisitDir(dir: AnyNode): FunctorCode {
    if (dir.HasVgrp()) {
      dir.SetDrawingGrpId(-dir.GetVgrp());
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitDynam(dynam: AnyNode): FunctorCode {
    if (dynam.HasVgrp()) {
      dynam.SetDrawingGrpId(-dynam.GetVgrp());
    }

    // Keep it for linking only if start is resolved
    if (!dynam.GetTimeSpanningInterface().GetStart()) return FunctorCode.FUNCTOR_CONTINUE;

    this.m_dynams.push(dynam);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitEnding(ending: AnyNode): FunctorCode {
    if (this.m_previousEnding) {
      // We need to group the previous and this ending - the previous one should have a grpId
      if (this.m_previousEnding.GetDrawingGrpId() === 0) {
        LogDebug('Something went wrong with the grouping of the endings');
      }
      ending.SetDrawingGrpId(this.m_previousEnding.GetDrawingGrpId());
      // Also set the previous ending to NULL
      // We need this because three or more endings might have to be grouped together
      this.m_previousEnding = null;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitHairpin(hairpin: AnyNode): FunctorCode {
    if (hairpin.HasVgrp()) {
      hairpin.SetDrawingGrpId(-hairpin.GetVgrp());
    }

    // Only try to link them if start and end are resolved
    if (!hairpin.GetTimeSpanningInterface().GetStart() || !hairpin.GetTimeSpanningInterface().GetEnd()) return FunctorCode.FUNCTOR_CONTINUE;

    this.m_hairpins.push(hairpin);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitHarm(harm: AnyNode): FunctorCode {
    let n = harm.GetN();
    // If there is no @n on harm we use the first @staff value as negative
    // This will not work if @staff has more than one staff id, but this is probably not going to be used
    if (n === '' && harm.HasStaff()) {
      n = StringFormat('%d', harm.GetStaff().at(0) * -1);
    }

    const existing = this.m_harms.get(n);
    if (existing) {
      harm.SetDrawingGrpId(existing.GetDrawingGrpId());
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    // first harm@n, create a new group
    // If @n is a digit string, use it as group id - otherwise order them as they appear
    if (IsDigits(n)) {
      harm.SetDrawingGrpId(parseInt(n, 10));
    }
    else {
      harm.SetDrawingGrpObject(harm);
    }
    this.m_harms.set(n, harm);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(_measure: AnyNode): FunctorCode {
    if (this.m_previousEnding) {
      // We have a measure in between endings and the previous one was group, just reset pointer to NULL
      this.m_previousEnding = null;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasureEnd(measure: AnyNode): FunctorCode {
    // Link dynamics and hairpins at the end of the measure to make sure that the order of elements in MEI does not
    // dictate their linkage. With this, linking dynamics to hairpin is prioritized and hairpins are linked only after
    // all dynamics were processed.

    // C++ compares staff vectors by value (operator==); TS arrays need element-wise compare.
    const staffEq = (a: number[], b: number[]): boolean =>
      a.length === b.length && a.every((v, i) => v === b[i]);

    for (const dynam of this.m_dynams) {
      for (const hairpin of this.m_hairpins) {
        if ((hairpin.GetTimeSpanningInterface().GetEnd() === dynam.GetTimeSpanningInterface().GetStart())
          && staffEq(hairpin.GetStaff(), dynam.GetStaff())) {
          if (!hairpin.GetRightLink()) hairpin.SetRightLink(dynam);
        }
      }
    }

    for (const hairpin of this.m_hairpins) {
      for (const dynam of this.m_dynams) {
        if ((dynam.GetTimeSpanningInterface().GetStart() === hairpin.GetTimeSpanningInterface().GetStart())
          && staffEq(dynam.GetStaff(), hairpin.GetStaff())) {
          if (!hairpin.GetLeftLink()) hairpin.SetLeftLink(dynam);
        }
        else if ((dynam.GetTimeSpanningInterface().GetStart() === hairpin.GetTimeSpanningInterface().GetEnd())
          && staffEq(dynam.GetStaff(), hairpin.GetStaff())) {
          if (!hairpin.GetRightLink()) hairpin.SetRightLink(dynam);
        }
      }

      for (const hairpin2 of this.m_hairpins) {
        if (hairpin === hairpin2) continue;
        if ((hairpin2.GetTimeSpanningInterface().GetEnd() === hairpin.GetTimeSpanningInterface().GetStart())
          && staffEq(hairpin2.GetStaff(), hairpin.GetStaff())) {
          if (!hairpin.GetLeftLink() && !hairpin2.GetRightLink()) {
            hairpin.SetLeftLink(hairpin2);
            hairpin2.SetRightLink(hairpin);
          }
        }
        if ((hairpin2.GetTimeSpanningInterface().GetStart() === hairpin.GetTimeSpanningInterface().GetEnd())
          && staffEq(hairpin2.GetStaff(), hairpin.GetStaff())) {
          if (!hairpin2.GetLeftLink() && !hairpin.GetRightLink()) {
            hairpin2.SetLeftLink(hairpin);
            hairpin.SetRightLink(hairpin2);
          }
        }
      }
    }

    this.m_dynams.length = 0;

    let iter = 0;
    while (iter < this.m_hairpins.length) {
      const hairpin = this.m_hairpins[iter];
      if (!hairpin.GetTimeSpanningInterface().GetEnd()) throw new Error('PrepareFloatingGrpsFunctor requires a hairpin end');
      const measureEnd = hairpin.GetTimeSpanningInterface().GetEnd().GetFirstAncestor(ClassId.MEASURE);
      if (measureEnd === measure) {
        this.m_hairpins.splice(iter, 1);
      }
      else {
        ++iter;
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPedal(pedal: AnyNode): FunctorCode {
    if (pedal.HasVgrp()) {
      pedal.SetDrawingGrpId(-pedal.GetVgrp());
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemMilestone(systemMilestoneEnd: AnyNode): FunctorCode {
    if (!systemMilestoneEnd.GetStart()) throw new Error('PrepareFloatingGrpsFunctor requires a milestone start');

    // We are reaching the end of an ending - store it and it will be grouped with the next one if there is
    // no measure in between
    if (systemMilestoneEnd.GetStart().Is(ClassId.ENDING)) {
      this.m_previousEnding = systemMilestoneEnd.GetStart();
      // This is the end of the first ending - generate a grpId
      if (this.m_previousEnding.GetDrawingGrpId() === 0) {
        this.m_previousEnding.SetDrawingGrpObject(this.m_previousEnding);
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// PrepareStaffCurrentTimeSpanningFunctor
//----------------------------------------------------------------------------

export class PrepareStaffCurrentTimeSpanningFunctor extends Functor {
  private m_timeSpanningElements: AnyNode[] = [];

  public override ImplementsEndInterface(): boolean { return true; }

  public GetTimeSpanningElements(): readonly AnyNode[] { return this.m_timeSpanningElements; }

  public InsertTimeSpanningElement(element: AnyNode): void {
    this.m_timeSpanningElements.push(element);
  }

  public VisitF(f: AnyNode): FunctorCode {
    const iface = f.GetTimeSpanningInterface();
    if (!iface) throw new Error('PrepareStaffCurrentTimeSpanningFunctor requires the TimeSpanningInterface');
    return iface.InterfacePrepareStaffCurrentTimeSpanning(this, f);
  }

  public VisitFloatingObject(floatingObject: AnyNode): FunctorCode {
    // Pass it to the pseudo functor of the iface
    if (floatingObject.HasInterface(InterfaceId.INTERFACE_TIME_SPANNING)) {
      const iface = floatingObject.GetTimeSpanningInterface();
      if (!iface) throw new Error('PrepareStaffCurrentTimeSpanningFunctor requires the TimeSpanningInterface');
      iface.InterfacePrepareStaffCurrentTimeSpanning(this, floatingObject);
    }
    if (floatingObject.HasInterface(InterfaceId.INTERFACE_LINKING)) {
      const iface = floatingObject.GetLinkingInterface();
      if (!iface) throw new Error('PrepareStaffCurrentTimeSpanningFunctor requires the LinkingInterface');
      iface.InterfacePrepareStaffCurrentTimeSpanning(this, floatingObject);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasureEnd(measure: AnyNode): FunctorCode {
    let iter = 0;
    while (iter < this.m_timeSpanningElements.length) {
      let endParent: AnyNode = null;
      const element = this.m_timeSpanningElements[iter];
      if (element.HasInterface(InterfaceId.INTERFACE_TIME_SPANNING)) {
        const iface = element.GetTimeSpanningInterface();
        if (!iface) throw new Error('PrepareStaffCurrentTimeSpanningFunctor requires the TimeSpanningInterface');
        if (iface.GetEnd()) {
          endParent = iface.GetEnd().GetFirstAncestor(ClassId.MEASURE);
        }
      }
      if (!endParent && element.HasInterface(InterfaceId.INTERFACE_LINKING)) {
        const iface = element.GetLinkingInterface();
        if (!iface) throw new Error('PrepareStaffCurrentTimeSpanningFunctor requires the LinkingInterface');
        if (iface.GetNextLink()) {
          // We should have one because we allow only control events (dir and dynam) to be linked as target
          const nextInterface = iface.GetNextLink().GetTimePointInterface();
          if (!nextInterface) throw new Error('PrepareStaffCurrentTimeSpanningFunctor requires the TimePointInterface');
          endParent = nextInterface.GetStart().GetFirstAncestor(ClassId.MEASURE);
        }
      }
      if (!endParent) throw new Error('PrepareStaffCurrentTimeSpanningFunctor requires an end parent measure');
      // We have reached the end of the spanning - remove it from the list of running elements
      if (endParent === measure) {
        this.m_timeSpanningElements.splice(iter, 1);
      }
      else {
        ++iter;
      }
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: AnyNode): FunctorCode {
    for (const element of this.m_timeSpanningElements) {
      let iface = element.GetTimeSpanningInterface();
      if (!iface) throw new Error('PrepareStaffCurrentTimeSpanningFunctor requires the TimeSpanningInterface');
      const currentMeasure = staff.GetFirstAncestor(ClassId.MEASURE);
      if (!currentMeasure) throw new Error('PrepareStaffCurrentTimeSpanningFunctor requires a Measure ancestor');
      // Special case for harm/fb/f where we are likely not to have a \@staff on /f
      // Use the parent harm to get the staff (necessary when calling IsOnStaff with timestamps)
      if (element.Is(ClassId.FIGURE) && !iface.HasStaff()) {
        const harm = element.GetFirstAncestor(ClassId.HARM);
        if (harm) iface = harm.GetTimeSpanningInterface();
        if (!iface) throw new Error('PrepareStaffCurrentTimeSpanningFunctor requires the TimeSpanningInterface');
      }
      // We need to make sure we are in the next measure (and not just a staff below because of some cross staff
      // notation
      if ((iface.GetStartMeasure() !== currentMeasure) && (iface.IsOnStaff(staff.GetN()))) {
        staff.AddTimeSpanningElement(element);
      }
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSyl(syl: AnyNode): FunctorCode {
    // Pass it to the pseudo functor of the iface
    const iface = syl.GetTimeSpanningInterface();
    if (!iface) throw new Error('PrepareStaffCurrentTimeSpanningFunctor requires the TimeSpanningInterface');
    return iface.InterfacePrepareStaffCurrentTimeSpanning(this, syl);
  }
}

//----------------------------------------------------------------------------
// PrepareRehPositionFunctor
//----------------------------------------------------------------------------

export class PrepareRehPositionFunctor extends Functor {
  public override ImplementsEndInterface(): boolean { return false; }

  public VisitReh(reh: AnyNode): FunctorCode {
    if (!reh.HasStartid() && !reh.HasTstamp()) {
      const measure = reh.GetFirstAncestor(ClassId.MEASURE);
      if (measure.GetLeftBarLine()) reh.SetStart(measure.GetLeftBarLine());
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}

//----------------------------------------------------------------------------
// PrepareBeamSpanElementsFunctor
//----------------------------------------------------------------------------

export class PrepareBeamSpanElementsFunctor extends Functor {
  public override ImplementsEndInterface(): boolean { return false; }

  public VisitBeamSpan(beamSpan: AnyNode): FunctorCode {
    if (beamSpan.GetBeamedElements().length !== 0 || !beamSpan.GetTimeSpanningInterface().GetStart()
      || !beamSpan.GetTimeSpanningInterface().GetEnd()) return FunctorCode.FUNCTOR_CONTINUE;

    const layer = beamSpan.GetTimeSpanningInterface().GetStart().GetFirstAncestor(ClassId.LAYER);
    const staff = beamSpan.GetTimeSpanningInterface().GetStart().GetFirstAncestor(ClassId.STAFF);
    if (!layer || !staff) return FunctorCode.FUNCTOR_SIBLINGS;

    const beamedElements = beamSpan.HasPlist()
      ? [...beamSpan.GetRefs()]
      : this.GetBeamSpanElementList(beamSpan, layer, staff);

    beamSpan.SetBeamedElements(beamedElements);

    if (beamedElements.length === 0) return FunctorCode.FUNCTOR_SIBLINGS;

    // mark referenced elements as contained in beam span
    for (const element of beamedElements) {
      if (!element || typeof element.Is !== 'function' || !element.IsLayerElement || typeof element.IsLayerElement !== 'function') continue;
      if (!element.IsLayerElement()) continue;

      const measure = element.GetFirstAncestor(ClassId.MEASURE);
      if (!measure) continue;
      element.SetIsInBeamSpan(true);

      const elementStaff = element.GetFirstAncestor(ClassId.STAFF);
      if (!elementStaff) continue;
      if (elementStaff.GetN() !== staff.GetN()) {
        const elementLayer = element.GetFirstAncestor(ClassId.LAYER);
        if (!elementLayer) continue;
        element.m_crossStaff = elementStaff;
        element.m_crossLayer = elementLayer;
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  private GetBeamSpanElementList(beamSpan: AnyNode, layer: AnyNode, staff: AnyNode): AnyNode[] {
    // find all elements between startId and endId of the beamSpan
    const classIds = new ClassIdsComparison([ClassId.NOTE, ClassId.CHORD]);
    const objects: AnyNode[] = [];
    layer.FindAllDescendantsBetween(objects, classIds, beamSpan.GetTimeSpanningInterface().GetStart(),
      beamSpan.GetTimeSpanningInterface().GetEnd(), true, 3);
    // To make sure that notes from tuplets and btrems are included, lookup for decendants is done up to depth of 3.
    // However this might result in notes from chords being added as standalone elements. To avoid this we remove any
    // note that is in the span and is a chord tone. Same happens when nextLayerObjects are being processed.
    for (let i = objects.length - 1; i >= 0; i--) {
      if (objects[i].Is(ClassId.NOTE) && objects[i].IsChordTone()) objects.splice(i, 1);
    }

    if (objects.length === 0) return [];

    const beamSpanElements = [...objects];
    // If last element is not equal to the end, there is high chance that this beamSpan is cross-measure.
    // Look for the same N-staff N-layer in next measure and try finding end there
    let startMeasure = beamSpan.GetTimeSpanningInterface().GetStart().GetFirstAncestor(ClassId.MEASURE);
    const endMeasure = beamSpan.GetTimeSpanningInterface().GetEnd().GetFirstAncestor(ClassId.MEASURE);
    while ((beamSpanElements[beamSpanElements.length - 1] !== beamSpan.GetTimeSpanningInterface().GetEnd())
      && (startMeasure !== endMeasure)) {
      const parent = startMeasure.GetParent();

      const nextMeasure = parent.GetNextOf(startMeasure, ClassId.MEASURE);
      if (!nextMeasure) break;

      const snc = new AttNIntegerComparison(ClassId.STAFF, staff.GetN());
      const nextStaff = nextMeasure.FindDescendantByComparison(snc);
      if (!nextStaff) break;

      const lnc = new AttNIntegerComparison(ClassId.LAYER, layer.GetN());
      const nextStaffLayer = nextStaff.FindDescendantByComparison(lnc);
      if (!nextStaffLayer) break;

      // find all elements between startId and endId of the beamSpan
      const nextLayerObjects: AnyNode[] = [];
      // pass NULL as starting element to add all elements until end is reached
      if (endMeasure === nextMeasure) {
        nextStaffLayer.FindAllDescendantsBetween(nextLayerObjects, classIds, null,
          beamSpan.GetTimeSpanningInterface().GetEnd(), true, 3);
        for (let i = nextLayerObjects.length - 1; i >= 0; i--) {
          if (nextLayerObjects[i].Is(ClassId.NOTE) && nextLayerObjects[i].IsChordTone()) nextLayerObjects.splice(i, 1);
        }
        // Handle only next measure for the time being
        if (nextLayerObjects[nextLayerObjects.length - 1] === beamSpan.GetTimeSpanningInterface().GetEnd()) {
          beamSpanElements.push(...nextLayerObjects);
        }
      }
      else {
        nextStaffLayer.FindAllDescendantsByComparison(nextLayerObjects, classIds);
        beamSpanElements.push(...nextLayerObjects);
      }

      startMeasure = nextMeasure;
    }

    return beamSpanElements;
  }
}
