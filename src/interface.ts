/**
 * Pure TypeScript translation of Verovio's base `Interface` class.
 *
 * C++ stores registered MEI attribute-class identifiers in a std::vector and
 * exposes that vector by pointer. We preserve ordered storage and expose the
 * same mutable-array semantics in TypeScript.
 */
import { AttClassId, InterfaceId } from './vrvdef.js';
import { Att } from './att.js';

// C++ every Interface subclass also inherits the Att converter surface via
// its AttXxx bases (e.g. FacsimileInterface : Interface, AttFacsimile).
// TS composes attribute state instead, so Interface owns one shared Att and
// forwards the full converter surface (ponytail: centralize converters as
// static functions when att.ts is next touched).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AttConverterMixin = Record<string, (...args: any[]) => any>;

export class Interface {
  private m_interfaceAttClasses: AttClassId[];
  private readonly attConverters = new Att();

  public constructor() {
    this.m_interfaceAttClasses = [];
  }

  public RegisterInterfaceAttClass(attClassId: AttClassId): void {
    this.m_interfaceAttClasses.push(attClassId);
  }

  public GetAttClasses(): AttClassId[] {
    // C++ returns a pointer to the owned vector; returning the owned array
    // preserves caller-visible mutation semantics rather than copying it.
    return this.m_interfaceAttClasses;
  }

  public Reset(): void {
    // Base implementation is intentionally empty in C++.
  }

  public AccidLogFuncToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['AccidLogFuncToStr'](...args); }
  public AccidentalAeuToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['AccidentalAeuToStr'](...args); }
  public AccidentalGesturalBasicToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['AccidentalGesturalBasicToStr'](...args); }
  public AccidentalGesturalExtendedToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['AccidentalGesturalExtendedToStr'](...args); }
  public AccidentalGesturalToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['AccidentalGesturalToStr'](...args); }
  public AccidentalPersianToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['AccidentalPersianToStr'](...args); }
  public AccidentalWrittenBasicToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['AccidentalWrittenBasicToStr'](...args); }
  public AccidentalWrittenExtendedToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['AccidentalWrittenExtendedToStr'](...args); }
  public AccidentalWrittenToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['AccidentalWrittenToStr'](...args); }
  public AnchoredTextLogFuncToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['AnchoredTextLogFuncToStr'](...args); }
  public AnnotLogFuncToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['AnnotLogFuncToStr'](...args); }
  public ArpegLogOrderToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ArpegLogOrderToStr'](...args); }
  public ArticulationListToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ArticulationListToStr'](...args); }
  public ArticulationToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ArticulationToStr'](...args); }
  public AudienceAudienceToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['AudienceAudienceToStr'](...args); }
  public BarmethodToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['BarmethodToStr'](...args); }
  public BarrenditionToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['BarrenditionToStr'](...args); }
  public BeamRendFormToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['BeamRendFormToStr'](...args); }
  public BeamingVisBeamrendToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['BeamingVisBeamrendToStr'](...args); }
  public BeamplaceToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['BeamplaceToStr'](...args); }
  public BeatrptRendToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['BeatrptRendToStr'](...args); }
  public BetypeToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['BetypeToStr'](...args); }
  public BooleanToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['BooleanToStr'](...args); }
  public BracketSpanLogFuncToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['BracketSpanLogFuncToStr'](...args); }
  public BulgeToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['BulgeToStr'](...args); }
  public CancelaccidToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['CancelaccidToStr'](...args); }
  public CertaintyToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['CertaintyToStr'](...args); }
  public ClefshapeToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ClefshapeToStr'](...args); }
  public ClusterToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ClusterToStr'](...args); }
  public ColornamesToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ColornamesToStr'](...args); }
  public CompassdirectionBasicToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['CompassdirectionBasicToStr'](...args); }
  public CompassdirectionExtendedToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['CompassdirectionExtendedToStr'](...args); }
  public CompassdirectionToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['CompassdirectionToStr'](...args); }
  public CoursetuningToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['CoursetuningToStr'](...args); }
  public CurvatureCurvedirToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['CurvatureCurvedirToStr'](...args); }
  public CurvatureDirectionCurveToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['CurvatureDirectionCurveToStr'](...args); }
  public CurveLogFuncToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['CurveLogFuncToStr'](...args); }
  public CutoutCutoutToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['CutoutCutoutToStr'](...args); }
  public DblToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['DblToStr'](...args); }
  public DegreesToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['DegreesToStr'](...args); }
  public DivLineLogFormToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['DivLineLogFormToStr'](...args); }
  public DivisioToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['DivisioToStr'](...args); }
  public DocStatusStatusToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['DocStatusStatusToStr'](...args); }
  public DotLogFormToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['DotLogFormToStr'](...args); }
  public DurationToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['DurationToStr'](...args); }
  public DurationrestsMensuralToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['DurationrestsMensuralToStr'](...args); }
  public DurqualityMensuralToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['DurqualityMensuralToStr'](...args); }
  public EnclosureToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['EnclosureToStr'](...args); }
  public EndingsEndingrendToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['EndingsEndingrendToStr'](...args); }
  public EpisemaVisFormToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['EpisemaVisFormToStr'](...args); }
  public EventrelBasicToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['EventrelBasicToStr'](...args); }
  public EventrelExtendedToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['EventrelExtendedToStr'](...args); }
  public EventrelToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['EventrelToStr'](...args); }
  public EvidenceEvidenceToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['EvidenceEvidenceToStr'](...args); }
  public ExtSymAuthGlyphauthToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ExtSymAuthGlyphauthToStr'](...args); }
  public FermataVisFormToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['FermataVisFormToStr'](...args); }
  public FermataVisShapeToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['FermataVisShapeToStr'](...args); }
  public FillToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['FillToStr'](...args); }
  public FingGrpLogFormToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['FingGrpLogFormToStr'](...args); }
  public FingGrpVisOrientToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['FingGrpVisOrientToStr'](...args); }
  public FlagformMensuralToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['FlagformMensuralToStr'](...args); }
  public FlagposMensuralToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['FlagposMensuralToStr'](...args); }
  public FontsizeToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['FontsizeToStr'](...args); }
  public FontsizenumericToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['FontsizenumericToStr'](...args); }
  public FontsizetermToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['FontsizetermToStr'](...args); }
  public FontstyleToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['FontstyleToStr'](...args); }
  public FontweightToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['FontweightToStr'](...args); }
  public FrbrrelationshipToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['FrbrrelationshipToStr'](...args); }
  public GlissandoToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['GlissandoToStr'](...args); }
  public GraceGrpLogAttachToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['GraceGrpLogAttachToStr'](...args); }
  public GraceToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['GraceToStr'](...args); }
  public HairpinLogFormToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['HairpinLogFormToStr'](...args); }
  public HarmAnlFormToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['HarmAnlFormToStr'](...args); }
  public HarmVisRendgridToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['HarmVisRendgridToStr'](...args); }
  public HarppedalpositionToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['HarppedalpositionToStr'](...args); }
  public HeadshapeListToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['HeadshapeListToStr'](...args); }
  public HeadshapeToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['HeadshapeToStr'](...args); }
  public HexnumToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['HexnumToStr'](...args); }
  public HorizontalalignmentToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['HorizontalalignmentToStr'](...args); }
  public IntToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['IntToStr'](...args); }
  public KeysignatureToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['KeysignatureToStr'](...args); }
  public LayerschemeToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['LayerschemeToStr'](...args); }
  public LigatureformToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['LigatureformToStr'](...args); }
  public LineLogFuncToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['LineLogFuncToStr'](...args); }
  public LineformToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['LineformToStr'](...args); }
  public LinestartendsymbolToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['LinestartendsymbolToStr'](...args); }
  public LinewidthToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['LinewidthToStr'](...args); }
  public LinewidthtermToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['LinewidthtermToStr'](...args); }
  public MarcrelatorsBasicToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MarcrelatorsBasicToStr'](...args); }
  public MarcrelatorsExtendedToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MarcrelatorsExtendedToStr'](...args); }
  public MeasurebeatToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MeasurebeatToStr'](...args); }
  public MeasurementUnitToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MeasurementUnitToStr'](...args); }
  public MeasurementsignedToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MeasurementsignedToStr'](...args); }
  public MeasurementunsignedToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MeasurementunsignedToStr'](...args); }
  public MeiVersionMeiversionToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MeiVersionMeiversionToStr'](...args); }
  public MelodicfunctionToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MelodicfunctionToStr'](...args); }
  public MensurVisFormToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MensurVisFormToStr'](...args); }
  public MensuralVisMensurformToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MensuralVisMensurformToStr'](...args); }
  public MensurationsignToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MensurationsignToStr'](...args); }
  public MeterConformanceMetconToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MeterConformanceMetconToStr'](...args); }
  public MeterSigGrpLogFuncToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MeterSigGrpLogFuncToStr'](...args); }
  public MetercountPairToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MetercountPairToStr'](...args); }
  public MeterformToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MeterformToStr'](...args); }
  public MetersignToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MetersignToStr'](...args); }
  public MidichannelToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MidichannelToStr'](...args); }
  public MidimspbToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MidimspbToStr'](...args); }
  public MidinamesToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MidinamesToStr'](...args); }
  public MidivalueNameToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MidivalueNameToStr'](...args); }
  public MidivaluePanToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MidivaluePanToStr'](...args); }
  public MidivalueToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MidivalueToStr'](...args); }
  public ModeCmnToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ModeCmnToStr'](...args); }
  public ModeExtendedToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ModeExtendedToStr'](...args); }
  public ModeGregorianToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ModeGregorianToStr'](...args); }
  public ModeToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ModeToStr'](...args); }
  public ModsrelationshipToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ModsrelationshipToStr'](...args); }
  public ModusmaiorToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ModusmaiorToStr'](...args); }
  public ModusminorToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ModusminorToStr'](...args); }
  public MordentLogFormToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MordentLogFormToStr'](...args); }
  public MultibreverestsMensuralToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['MultibreverestsMensuralToStr'](...args); }
  public NcFormConToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['NcFormConToStr'](...args); }
  public NcFormRellenToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['NcFormRellenToStr'](...args); }
  public NcnameToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['NcnameToStr'](...args); }
  public NeighboringlayerToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['NeighboringlayerToStr'](...args); }
  public NeumeTypeTypeToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['NeumeTypeTypeToStr'](...args); }
  public NonstaffplaceToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['NonstaffplaceToStr'](...args); }
  public NotationtypeToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['NotationtypeToStr'](...args); }
  public NoteGesExtremisToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['NoteGesExtremisToStr'](...args); }
  public NoteHeadsHeadauthToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['NoteHeadsHeadauthToStr'](...args); }
  public NoteheadmodifierListToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['NoteheadmodifierListToStr'](...args); }
  public NoteheadmodifierToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['NoteheadmodifierToStr'](...args); }
  public OctaveDisToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['OctaveDisToStr'](...args); }
  public OctaveLogCollToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['OctaveLogCollToStr'](...args); }
  public OctaveToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['OctaveToStr'](...args); }
  public OrientationToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['OrientationToStr'](...args); }
  public PbVisFoliumToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['PbVisFoliumToStr'](...args); }
  public PedalLogDirToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['PedalLogDirToStr'](...args); }
  public PedalLogFuncToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['PedalLogFuncToStr'](...args); }
  public PedalstyleToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['PedalstyleToStr'](...args); }
  public PercentLimitedSignedToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['PercentLimitedSignedToStr'](...args); }
  public PercentLimitedToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['PercentLimitedToStr'](...args); }
  public PercentToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['PercentToStr'](...args); }
  public PgfuncToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['PgfuncToStr'](...args); }
  public PitchnameToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['PitchnameToStr'](...args); }
  public PlacementToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['PlacementToStr'](...args); }
  public PointingXlinkactuateToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['PointingXlinkactuateToStr'](...args); }
  public PointingXlinkshowToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['PointingXlinkshowToStr'](...args); }
  public ProlatioToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['ProlatioToStr'](...args); }
  public RecordTypeRecordtypeToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['RecordTypeRecordtypeToStr'](...args); }
  public RegularMethodMethodToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['RegularMethodMethodToStr'](...args); }
  public RehearsalRehencloseToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['RehearsalRehencloseToStr'](...args); }
  public RelationshipToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['RelationshipToStr'](...args); }
  public RelatorsToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['RelatorsToStr'](...args); }
  public RepeatMarkLogFuncToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['RepeatMarkLogFuncToStr'](...args); }
  public RotationToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['RotationToStr'](...args); }
  public RotationdirectionToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['RotationdirectionToStr'](...args); }
  public SbVisFormToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['SbVisFormToStr'](...args); }
  public StaffGroupingSymSymbolToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StaffGroupingSymSymbolToStr'](...args); }
  public StaffitemBasicToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StaffitemBasicToStr'](...args); }
  public StaffitemCmnToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StaffitemCmnToStr'](...args); }
  public StaffitemMensuralToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StaffitemMensuralToStr'](...args); }
  public StaffitemToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StaffitemToStr'](...args); }
  public StaffrelBasicToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StaffrelBasicToStr'](...args); }
  public StaffrelExtendedToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StaffrelExtendedToStr'](...args); }
  public StaffrelToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StaffrelToStr'](...args); }
  public StemdirectionBasicToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StemdirectionBasicToStr'](...args); }
  public StemdirectionExtendedToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StemdirectionExtendedToStr'](...args); }
  public StemdirectionToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StemdirectionToStr'](...args); }
  public StemformMensuralToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StemformMensuralToStr'](...args); }
  public StemmodifierToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StemmodifierToStr'](...args); }
  public StempositionToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StempositionToStr'](...args); }
  public StrToAccidLogFunc(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToAccidLogFunc'](...args); }
  public StrToAccidentalAeu(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToAccidentalAeu'](...args); }
  public StrToAccidentalGestural(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToAccidentalGestural'](...args); }
  public StrToAccidentalGesturalBasic(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToAccidentalGesturalBasic'](...args); }
  public StrToAccidentalGesturalExtended(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToAccidentalGesturalExtended'](...args); }
  public StrToAccidentalPersian(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToAccidentalPersian'](...args); }
  public StrToAccidentalWritten(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToAccidentalWritten'](...args); }
  public StrToAccidentalWrittenBasic(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToAccidentalWrittenBasic'](...args); }
  public StrToAccidentalWrittenExtended(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToAccidentalWrittenExtended'](...args); }
  public StrToAnchoredTextLogFunc(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToAnchoredTextLogFunc'](...args); }
  public StrToAnnotLogFunc(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToAnnotLogFunc'](...args); }
  public StrToArpegLogOrder(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToArpegLogOrder'](...args); }
  public StrToArticulation(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToArticulation'](...args); }
  public StrToArticulationList(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToArticulationList'](...args); }
  public StrToAudienceAudience(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToAudienceAudience'](...args); }
  public StrToBarmethod(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToBarmethod'](...args); }
  public StrToBarrendition(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToBarrendition'](...args); }
  public StrToBeamRendForm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToBeamRendForm'](...args); }
  public StrToBeamingVisBeamrend(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToBeamingVisBeamrend'](...args); }
  public StrToBeamplace(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToBeamplace'](...args); }
  public StrToBeatrptRend(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToBeatrptRend'](...args); }
  public StrToBetype(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToBetype'](...args); }
  public StrToBoolean(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToBoolean'](...args); }
  public StrToBracketSpanLogFunc(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToBracketSpanLogFunc'](...args); }
  public StrToBulge(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToBulge'](...args); }
  public StrToCancelaccid(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToCancelaccid'](...args); }
  public StrToCertainty(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToCertainty'](...args); }
  public StrToClefshape(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToClefshape'](...args); }
  public StrToCluster(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToCluster'](...args); }
  public StrToColornames(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToColornames'](...args); }
  public StrToCompassdirection(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToCompassdirection'](...args); }
  public StrToCompassdirectionBasic(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToCompassdirectionBasic'](...args); }
  public StrToCompassdirectionExtended(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToCompassdirectionExtended'](...args); }
  public StrToCoursetuning(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToCoursetuning'](...args); }
  public StrToCurvatureCurvedir(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToCurvatureCurvedir'](...args); }
  public StrToCurvatureDirectionCurve(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToCurvatureDirectionCurve'](...args); }
  public StrToCurveLogFunc(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToCurveLogFunc'](...args); }
  public StrToCutoutCutout(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToCutoutCutout'](...args); }
  public StrToDbl(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToDbl'](...args); }
  public StrToDegrees(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToDegrees'](...args); }
  public StrToDivLineLogForm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToDivLineLogForm'](...args); }
  public StrToDivisio(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToDivisio'](...args); }
  public StrToDocStatusStatus(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToDocStatusStatus'](...args); }
  public StrToDotLogForm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToDotLogForm'](...args); }
  public StrToDuration(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToDuration'](...args); }
  public StrToDurationrestsMensural(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToDurationrestsMensural'](...args); }
  public StrToDurqualityMensural(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToDurqualityMensural'](...args); }
  public StrToEnclosure(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToEnclosure'](...args); }
  public StrToEndingsEndingrend(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToEndingsEndingrend'](...args); }
  public StrToEpisemaVisForm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToEpisemaVisForm'](...args); }
  public StrToEventrel(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToEventrel'](...args); }
  public StrToEventrelBasic(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToEventrelBasic'](...args); }
  public StrToEventrelExtended(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToEventrelExtended'](...args); }
  public StrToEvidenceEvidence(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToEvidenceEvidence'](...args); }
  public StrToExtSymAuthGlyphauth(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToExtSymAuthGlyphauth'](...args); }
  public StrToFermataVisForm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToFermataVisForm'](...args); }
  public StrToFermataVisShape(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToFermataVisShape'](...args); }
  public StrToFill(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToFill'](...args); }
  public StrToFingGrpLogForm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToFingGrpLogForm'](...args); }
  public StrToFingGrpVisOrient(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToFingGrpVisOrient'](...args); }
  public StrToFlagformMensural(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToFlagformMensural'](...args); }
  public StrToFlagposMensural(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToFlagposMensural'](...args); }
  public StrToFontsize(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToFontsize'](...args); }
  public StrToFontsizenumeric(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToFontsizenumeric'](...args); }
  public StrToFontsizeterm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToFontsizeterm'](...args); }
  public StrToFontstyle(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToFontstyle'](...args); }
  public StrToFontweight(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToFontweight'](...args); }
  public StrToFrbrrelationship(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToFrbrrelationship'](...args); }
  public StrToGlissando(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToGlissando'](...args); }
  public StrToGrace(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToGrace'](...args); }
  public StrToGraceGrpLogAttach(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToGraceGrpLogAttach'](...args); }
  public StrToHairpinLogForm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToHairpinLogForm'](...args); }
  public StrToHarmAnlForm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToHarmAnlForm'](...args); }
  public StrToHarmVisRendgrid(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToHarmVisRendgrid'](...args); }
  public StrToHarppedalposition(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToHarppedalposition'](...args); }
  public StrToHeadshape(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToHeadshape'](...args); }
  public StrToHeadshapeList(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToHeadshapeList'](...args); }
  public StrToHexnum(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToHexnum'](...args); }
  public StrToHorizontalalignment(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToHorizontalalignment'](...args); }
  public StrToInt(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToInt'](...args); }
  public StrToKeysignature(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToKeysignature'](...args); }
  public StrToLayerscheme(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToLayerscheme'](...args); }
  public StrToLigatureform(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToLigatureform'](...args); }
  public StrToLineLogFunc(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToLineLogFunc'](...args); }
  public StrToLineform(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToLineform'](...args); }
  public StrToLinestartendsymbol(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToLinestartendsymbol'](...args); }
  public StrToLinewidth(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToLinewidth'](...args); }
  public StrToLinewidthterm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToLinewidthterm'](...args); }
  public StrToMarcrelatorsBasic(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMarcrelatorsBasic'](...args); }
  public StrToMarcrelatorsExtended(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMarcrelatorsExtended'](...args); }
  public StrToMeasurebeat(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMeasurebeat'](...args); }
  public StrToMeasurementUnit(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMeasurementUnit'](...args); }
  public StrToMeasurementsigned(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMeasurementsigned'](...args); }
  public StrToMeasurementunsigned(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMeasurementunsigned'](...args); }
  public StrToMeiVersionMeiversion(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMeiVersionMeiversion'](...args); }
  public StrToMelodicfunction(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMelodicfunction'](...args); }
  public StrToMensurVisForm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMensurVisForm'](...args); }
  public StrToMensuralVisMensurform(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMensuralVisMensurform'](...args); }
  public StrToMensurationsign(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMensurationsign'](...args); }
  public StrToMeterConformanceMetcon(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMeterConformanceMetcon'](...args); }
  public StrToMeterSigGrpLogFunc(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMeterSigGrpLogFunc'](...args); }
  public StrToMetercountPair(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMetercountPair'](...args); }
  public StrToMeterform(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMeterform'](...args); }
  public StrToMetersign(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMetersign'](...args); }
  public StrToMidichannel(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMidichannel'](...args); }
  public StrToMidimspb(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMidimspb'](...args); }
  public StrToMidinames(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMidinames'](...args); }
  public StrToMidivalue(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMidivalue'](...args); }
  public StrToMidivalueName(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMidivalueName'](...args); }
  public StrToMidivaluePan(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMidivaluePan'](...args); }
  public StrToMode(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMode'](...args); }
  public StrToModeCmn(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToModeCmn'](...args); }
  public StrToModeExtended(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToModeExtended'](...args); }
  public StrToModeGregorian(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToModeGregorian'](...args); }
  public StrToModsrelationship(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToModsrelationship'](...args); }
  public StrToModusmaior(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToModusmaior'](...args); }
  public StrToModusminor(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToModusminor'](...args); }
  public StrToMordentLogForm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMordentLogForm'](...args); }
  public StrToMultibreverestsMensural(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToMultibreverestsMensural'](...args); }
  public StrToNcFormCon(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToNcFormCon'](...args); }
  public StrToNcFormRellen(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToNcFormRellen'](...args); }
  public StrToNcname(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToNcname'](...args); }
  public StrToNeighboringlayer(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToNeighboringlayer'](...args); }
  public StrToNeumeTypeType(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToNeumeTypeType'](...args); }
  public StrToNonstaffplace(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToNonstaffplace'](...args); }
  public StrToNotationtype(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToNotationtype'](...args); }
  public StrToNoteGesExtremis(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToNoteGesExtremis'](...args); }
  public StrToNoteHeadsHeadauth(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToNoteHeadsHeadauth'](...args); }
  public StrToNoteheadmodifier(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToNoteheadmodifier'](...args); }
  public StrToNoteheadmodifierList(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToNoteheadmodifierList'](...args); }
  public StrToOctave(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToOctave'](...args); }
  public StrToOctaveDis(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToOctaveDis'](...args); }
  public StrToOctaveLogColl(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToOctaveLogColl'](...args); }
  public StrToOrientation(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToOrientation'](...args); }
  public StrToPbVisFolium(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToPbVisFolium'](...args); }
  public StrToPedalLogDir(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToPedalLogDir'](...args); }
  public StrToPedalLogFunc(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToPedalLogFunc'](...args); }
  public StrToPedalstyle(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToPedalstyle'](...args); }
  public StrToPercent(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToPercent'](...args); }
  public StrToPercentLimited(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToPercentLimited'](...args); }
  public StrToPercentLimitedSigned(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToPercentLimitedSigned'](...args); }
  public StrToPgfunc(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToPgfunc'](...args); }
  public StrToPitchname(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToPitchname'](...args); }
  public StrToPlacement(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToPlacement'](...args); }
  public StrToPointingXlinkactuate(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToPointingXlinkactuate'](...args); }
  public StrToPointingXlinkshow(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToPointingXlinkshow'](...args); }
  public StrToProlatio(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToProlatio'](...args); }
  public StrToRecordTypeRecordtype(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToRecordTypeRecordtype'](...args); }
  public StrToRegularMethodMethod(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToRegularMethodMethod'](...args); }
  public StrToRehearsalRehenclose(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToRehearsalRehenclose'](...args); }
  public StrToRelationship(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToRelationship'](...args); }
  public StrToRelators(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToRelators'](...args); }
  public StrToRepeatMarkLogFunc(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToRepeatMarkLogFunc'](...args); }
  public StrToRotation(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToRotation'](...args); }
  public StrToRotationdirection(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToRotationdirection'](...args); }
  public StrToSbVisForm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToSbVisForm'](...args); }
  public StrToStaffGroupingSymSymbol(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStaffGroupingSymSymbol'](...args); }
  public StrToStaffitem(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStaffitem'](...args); }
  public StrToStaffitemBasic(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStaffitemBasic'](...args); }
  public StrToStaffitemCmn(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStaffitemCmn'](...args); }
  public StrToStaffitemMensural(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStaffitemMensural'](...args); }
  public StrToStaffrel(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStaffrel'](...args); }
  public StrToStaffrelBasic(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStaffrelBasic'](...args); }
  public StrToStaffrelExtended(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStaffrelExtended'](...args); }
  public StrToStemdirection(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStemdirection'](...args); }
  public StrToStemdirectionBasic(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStemdirectionBasic'](...args); }
  public StrToStemdirectionExtended(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStemdirectionExtended'](...args); }
  public StrToStemformMensural(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStemformMensural'](...args); }
  public StrToStemmodifier(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStemmodifier'](...args); }
  public StrToStemposition(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStemposition'](...args); }
  public StrToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToStr'](...args); }
  public StrToSylLogCon(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToSylLogCon'](...args); }
  public StrToSylLogWordpos(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToSylLogWordpos'](...args); }
  public StrToTargetEvalEvaluate(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToTargetEvalEvaluate'](...args); }
  public StrToTemperament(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToTemperament'](...args); }
  public StrToTempoLogFunc(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToTempoLogFunc'](...args); }
  public StrToTempus(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToTempus'](...args); }
  public StrToTextrendition(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToTextrendition'](...args); }
  public StrToTextrenditionlist(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToTextrenditionlist'](...args); }
  public StrToTie(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToTie'](...args); }
  public StrToTremFormForm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToTremFormForm'](...args); }
  public StrToTupletVisNumformat(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToTupletVisNumformat'](...args); }
  public StrToTurnLogForm(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToTurnLogForm'](...args); }
  public StrToVU(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToVU'](...args); }
  public StrToVerticalalignment(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToVerticalalignment'](...args); }
  public StrToVoltaGroupingSymVoltasym(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToVoltaGroupingSymVoltasym'](...args); }
  public StrToWhitespaceXmlspace(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToWhitespaceXmlspace'](...args); }
  public StrToXsdAnyURIList(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToXsdAnyURIList'](...args); }
  public StrToXsdPositiveIntegerList(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['StrToXsdPositiveIntegerList'](...args); }
  public SylLogConToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['SylLogConToStr'](...args); }
  public SylLogWordposToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['SylLogWordposToStr'](...args); }
  public TargetEvalEvaluateToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['TargetEvalEvaluateToStr'](...args); }
  public TemperamentToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['TemperamentToStr'](...args); }
  public TempoLogFuncToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['TempoLogFuncToStr'](...args); }
  public TempusToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['TempusToStr'](...args); }
  public TextrenditionToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['TextrenditionToStr'](...args); }
  public TextrenditionlistToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['TextrenditionlistToStr'](...args); }
  public TieToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['TieToStr'](...args); }
  public TremFormFormToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['TremFormFormToStr'](...args); }
  public TupletVisNumformatToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['TupletVisNumformatToStr'](...args); }
  public TurnLogFormToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['TurnLogFormToStr'](...args); }
  public VUToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['VUToStr'](...args); }
  public VerticalalignmentToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['VerticalalignmentToStr'](...args); }
  public VoltaGroupingSymVoltasymToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['VoltaGroupingSymVoltasymToStr'](...args); }
  public WhitespaceXmlspaceToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['WhitespaceXmlspaceToStr'](...args); }
  public XsdAnyURIListToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['XsdAnyURIListToStr'](...args); }
  public XsdPositiveIntegerListToStr(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['XsdPositiveIntegerListToStr'](...args); }
  public switch(...args: never[]): any { return (this.attConverters as unknown as Record<string, (...a: never[]) => unknown>)['switch'](...args); }

  public IsInterface(): InterfaceId {
    return InterfaceId.INTERFACE;
  }
}
