/**
 * Pure TypeScript translation of libmei/dist/attmodule.cpp.
 *
 * C++ dynamic_cast checks are represented by the structural contract below.
 * Once HasAttClass() accepts the class id, the element is the corresponding
 * attribute-bearing object. The generated dispatcher branch order and
 * mutation/copy semantics are preserved.
 */

// Stable libmei AttClassId ordinals copied from dist/attclasses.h.
export const ATT_CLASS_IDS: Readonly<Record<string, number>> = {
  ATT_NOTATIONTYPE: 0,
  ATT_HARMANL: 1,
  ATT_HARMONICFUNCTION: 2,
  ATT_INTERVALHARMONIC: 3,
  ATT_INTERVALMELODIC: 4,
  ATT_KEYSIGANL: 5,
  ATT_KEYSIGDEFAULTANL: 6,
  ATT_MELODICFUNCTION: 7,
  ATT_PITCHCLASS: 8,
  ATT_SOLFA: 9,
  ATT_ARPEGLOG: 10,
  ATT_BEAMPRESENT: 11,
  ATT_BEAMREND: 12,
  ATT_BEAMSECONDARY: 13,
  ATT_BEAMEDWITH: 14,
  ATT_BEAMINGLOG: 15,
  ATT_BEATRPTLOG: 16,
  ATT_BRACKETSPANLOG: 17,
  ATT_CUTOUT: 18,
  ATT_EXPANDABLE: 19,
  ATT_GLISSPRESENT: 20,
  ATT_GRACEGRPLOG: 21,
  ATT_GRACED: 22,
  ATT_HAIRPINLOG: 23,
  ATT_HARPPEDALLOG: 24,
  ATT_LVPRESENT: 25,
  ATT_MEASURELOG: 26,
  ATT_METERSIGGRPLOG: 27,
  ATT_NUMBERPLACEMENT: 28,
  ATT_NUMBERED: 29,
  ATT_OCTAVELOG: 30,
  ATT_PEDALLOG: 31,
  ATT_PIANOPEDALS: 32,
  ATT_REHEARSAL: 33,
  ATT_SLURREND: 34,
  ATT_STEMSCMN: 35,
  ATT_TIEREND: 36,
  ATT_TREMFORM: 37,
  ATT_TREMMEASURED: 38,
  ATT_MORDENTLOG: 39,
  ATT_ORNAMPRESENT: 40,
  ATT_ORNAMENTACCID: 41,
  ATT_TURNLOG: 42,
  ATT_CRIT: 43,
  ATT_AGENTIDENT: 44,
  ATT_REASONIDENT: 45,
  ATT_EXTSYMAUTH: 46,
  ATT_EXTSYMNAMES: 47,
  ATT_FACSIMILE: 48,
  ATT_TABULAR: 49,
  ATT_FINGGRPLOG: 50,
  ATT_ACCIDENTALGES: 51,
  ATT_ARTICULATIONGES: 52,
  ATT_ATTACKING: 53,
  ATT_BENDGES: 54,
  ATT_DURATIONGES: 55,
  ATT_NOTEGES: 56,
  ATT_ORNAMENTACCIDGES: 57,
  ATT_PITCHGES: 58,
  ATT_SOUNDLOCATION: 59,
  ATT_TIMESTAMPGES: 60,
  ATT_TIMESTAMP2GES: 61,
  ATT_HARMLOG: 62,
  ATT_ADLIBITUM: 63,
  ATT_BIFOLIUMSURFACES: 64,
  ATT_FOLIUMSURFACES: 65,
  ATT_PERFRES: 66,
  ATT_PERFRESBASIC: 67,
  ATT_RECORDTYPE: 68,
  ATT_REGULARMETHOD: 69,
  ATT_DURATIONQUALITY: 70,
  ATT_MENSURALLOG: 71,
  ATT_MENSURALSHARED: 72,
  ATT_NOTEVISMENSURAL: 73,
  ATT_RESTVISMENSURAL: 74,
  ATT_STEMSMENSURAL: 75,
  ATT_CHANNELIZED: 76,
  ATT_INSTRUMENTIDENT: 77,
  ATT_MIDIINSTRUMENT: 78,
  ATT_MIDINUMBER: 79,
  ATT_MIDITEMPO: 80,
  ATT_MIDIVALUE: 81,
  ATT_MIDIVALUE2: 82,
  ATT_MIDIVELOCITY: 83,
  ATT_TIMEBASE: 84,
  ATT_DIVLINELOG: 85,
  ATT_NCLOG: 86,
  ATT_NCFORM: 87,
  ATT_NEUMETYPE: 88,
  ATT_MARGINS: 89,
  ATT_ALIGNMENT: 90,
  ATT_ACCIDLOG: 91,
  ATT_ACCIDENTAL: 92,
  ATT_ANNOTLOG: 93,
  ATT_ARTICULATION: 94,
  ATT_ATTACCALOG: 95,
  ATT_AUDIENCE: 96,
  ATT_AUGMENTDOTS: 97,
  ATT_AUTHORIZED: 98,
  ATT_BARLINELOG: 99,
  ATT_BARRING: 100,
  ATT_BASIC: 101,
  ATT_BIBL: 102,
  ATT_CALENDARED: 103,
  ATT_CANONICAL: 104,
  ATT_CLASSED: 105,
  ATT_CLEFLOG: 106,
  ATT_CLEFSHAPE: 107,
  ATT_CLEFFINGLOG: 108,
  ATT_COLOR: 109,
  ATT_COLORATION: 110,
  ATT_COORDX1: 111,
  ATT_COORDX2: 112,
  ATT_COORDY1: 113,
  ATT_COORDINATED: 114,
  ATT_COORDINATEDUL: 115,
  ATT_CUE: 116,
  ATT_CURVATURE: 117,
  ATT_CUSTOSLOG: 118,
  ATT_DATAPOINTING: 119,
  ATT_DATASELECTING: 120,
  ATT_DATABLE: 121,
  ATT_DISTANCES: 122,
  ATT_DOCSTATUS: 123,
  ATT_DOTLOG: 124,
  ATT_DURATIONADDITIVE: 125,
  ATT_DURATIONDEFAULT: 126,
  ATT_DURATIONLOG: 127,
  ATT_DURATIONRATIO: 128,
  ATT_ENCLOSINGCHARS: 129,
  ATT_ENDINGS: 130,
  ATT_EVIDENCE: 131,
  ATT_EXTENDER: 132,
  ATT_EXTENT: 133,
  ATT_FERMATAPRESENT: 134,
  ATT_FILING: 135,
  ATT_FORMEWORK: 136,
  ATT_GRPSYMLOG: 137,
  ATT_HANDIDENT: 138,
  ATT_HEIGHT: 139,
  ATT_HORIZONTALALIGN: 140,
  ATT_INTERNETMEDIA: 141,
  ATT_JOINED: 142,
  ATT_KEYSIGLOG: 143,
  ATT_KEYSIGDEFAULTLOG: 144,
  ATT_LABELLED: 145,
  ATT_LANG: 146,
  ATT_LAYERLOG: 147,
  ATT_LAYERIDENT: 148,
  ATT_LINELOC: 149,
  ATT_LINEREND: 150,
  ATT_LINERENDBASE: 151,
  ATT_LINKING: 152,
  ATT_LYRICSTYLE: 153,
  ATT_MEASURENUMBERS: 154,
  ATT_MEASUREMENT: 155,
  ATT_MEDIABOUNDS: 156,
  ATT_MEDIUM: 157,
  ATT_MEIVERSION: 158,
  ATT_MENSURLOG: 159,
  ATT_METADATAPOINTING: 160,
  ATT_METERCONFORMANCE: 161,
  ATT_METERCONFORMANCEBAR: 162,
  ATT_METERSIGLOG: 163,
  ATT_METERSIGDEFAULTLOG: 164,
  ATT_MMTEMPO: 165,
  ATT_MULTINUMMEASURES: 166,
  ATT_NINTEGER: 167,
  ATT_NNUMBERLIKE: 168,
  ATT_NAME: 169,
  ATT_NOTATIONSTYLE: 170,
  ATT_NOTEHEADS: 171,
  ATT_OCTAVE: 172,
  ATT_OCTAVEDEFAULT: 173,
  ATT_OCTAVEDISPLACEMENT: 174,
  ATT_ONELINESTAFF: 175,
  ATT_OPTIMIZATION: 176,
  ATT_ORIGINLAYERIDENT: 177,
  ATT_ORIGINSTAFFIDENT: 178,
  ATT_ORIGINSTARTENDID: 179,
  ATT_ORIGINTIMESTAMPLOG: 180,
  ATT_PAGES: 181,
  ATT_PARTIDENT: 182,
  ATT_PITCH: 183,
  ATT_PLACEMENTONSTAFF: 184,
  ATT_PLACEMENTRELEVENT: 185,
  ATT_PLACEMENTRELSTAFF: 186,
  ATT_PLIST: 187,
  ATT_POINTING: 188,
  ATT_QUANTITY: 189,
  ATT_RANGING: 190,
  ATT_REPEATMARKLOG: 191,
  ATT_RESPONSIBILITY: 192,
  ATT_RESTDURATIONLOG: 193,
  ATT_SCALABLE: 194,
  ATT_SEQUENCE: 195,
  ATT_SLASHCOUNT: 196,
  ATT_SLURPRESENT: 197,
  ATT_SOURCE: 198,
  ATT_SPACING: 199,
  ATT_STAFFLOG: 200,
  ATT_STAFFDEFLOG: 201,
  ATT_STAFFGROUPINGSYM: 202,
  ATT_STAFFIDENT: 203,
  ATT_STAFFITEMS: 204,
  ATT_STAFFLOC: 205,
  ATT_STAFFLOCPITCHED: 206,
  ATT_STARTENDID: 207,
  ATT_STARTID: 208,
  ATT_STEMS: 209,
  ATT_SYLLOG: 210,
  ATT_SYLTEXT: 211,
  ATT_SYSTEMS: 212,
  ATT_TARGETEVAL: 213,
  ATT_TEMPOLOG: 214,
  ATT_TEXTRENDITION: 215,
  ATT_TEXTSTYLE: 216,
  ATT_TIEPRESENT: 217,
  ATT_TIMESTAMPLOG: 218,
  ATT_TIMESTAMP2LOG: 219,
  ATT_TRANSPOSITION: 220,
  ATT_TUNING: 221,
  ATT_TUNINGLOG: 222,
  ATT_TUPLETPRESENT: 223,
  ATT_TYPED: 224,
  ATT_TYPOGRAPHY: 225,
  ATT_VERTICALALIGN: 226,
  ATT_VERTICALGROUP: 227,
  ATT_VISIBILITY: 228,
  ATT_VISUALOFFSETHO: 229,
  ATT_VISUALOFFSETTO: 230,
  ATT_VISUALOFFSETVO: 231,
  ATT_VISUALOFFSET2HO: 232,
  ATT_VISUALOFFSET2TO: 233,
  ATT_VISUALOFFSET2VO: 234,
  ATT_VOLTAGROUPINGSYM: 235,
  ATT_WHITESPACE: 236,
  ATT_WIDTH: 237,
  ATT_XY: 238,
  ATT_XY2: 239,
  ATT_STAFFDEFVISTABLATURE: 240,
  ATT_STRINGTAB: 241,
  ATT_STRINGTABPOSITION: 242,
  ATT_STRINGTABTUNING: 243,
  ATT_ALTSYM: 244,
  ATT_ANCHOREDTEXTLOG: 245,
  ATT_CURVELOG: 246,
  ATT_LINELOG: 247,
  ATT_ANNOTVIS: 248,
  ATT_ARPEGVIS: 249,
  ATT_BARLINEVIS: 250,
  ATT_BEAMINGVIS: 251,
  ATT_BEATRPTVIS: 252,
  ATT_CHORDVIS: 253,
  ATT_CLEFFINGVIS: 254,
  ATT_CURVATUREDIRECTION: 255,
  ATT_EPISEMAVIS: 256,
  ATT_FTREMVIS: 257,
  ATT_FERMATAVIS: 258,
  ATT_FINGGRPVIS: 259,
  ATT_GUITARGRIDVIS: 260,
  ATT_HAIRPINVIS: 261,
  ATT_HARMVIS: 262,
  ATT_HISPANTICKVIS: 263,
  ATT_KEYSIGVIS: 264,
  ATT_KEYSIGDEFAULTVIS: 265,
  ATT_LIGATUREVIS: 266,
  ATT_LINEVIS: 267,
  ATT_LIQUESCENTVIS: 268,
  ATT_MENSURVIS: 269,
  ATT_MENSURALVIS: 270,
  ATT_METERSIGVIS: 271,
  ATT_METERSIGDEFAULTVIS: 272,
  ATT_MULTIRESTVIS: 273,
  ATT_PBVIS: 274,
  ATT_PEDALVIS: 275,
  ATT_PLICAVIS: 276,
  ATT_QUILISMAVIS: 277,
  ATT_SBVIS: 278,
  ATT_SCOREDEFVIS: 279,
  ATT_SECTIONVIS: 280,
  ATT_SIGNIFLETVIS: 281,
  ATT_SPACEVIS: 282,
  ATT_STAFFDEFVIS: 283,
  ATT_STAFFGRPVIS: 284,
  ATT_STEMVIS: 285,
  ATT_TUPLETVIS: 286,
  ATT_CLASS_max: 287,
};

const ATT_NOTATIONTYPE = ATT_CLASS_IDS.ATT_NOTATIONTYPE;
const ATT_HARMANL = ATT_CLASS_IDS.ATT_HARMANL;
const ATT_HARMONICFUNCTION = ATT_CLASS_IDS.ATT_HARMONICFUNCTION;
const ATT_INTERVALHARMONIC = ATT_CLASS_IDS.ATT_INTERVALHARMONIC;
const ATT_INTERVALMELODIC = ATT_CLASS_IDS.ATT_INTERVALMELODIC;
const ATT_KEYSIGANL = ATT_CLASS_IDS.ATT_KEYSIGANL;
const ATT_KEYSIGDEFAULTANL = ATT_CLASS_IDS.ATT_KEYSIGDEFAULTANL;
const ATT_MELODICFUNCTION = ATT_CLASS_IDS.ATT_MELODICFUNCTION;
const ATT_PITCHCLASS = ATT_CLASS_IDS.ATT_PITCHCLASS;
const ATT_SOLFA = ATT_CLASS_IDS.ATT_SOLFA;
const ATT_ARPEGLOG = ATT_CLASS_IDS.ATT_ARPEGLOG;
const ATT_BEAMPRESENT = ATT_CLASS_IDS.ATT_BEAMPRESENT;
const ATT_BEAMREND = ATT_CLASS_IDS.ATT_BEAMREND;
const ATT_BEAMSECONDARY = ATT_CLASS_IDS.ATT_BEAMSECONDARY;
const ATT_BEAMEDWITH = ATT_CLASS_IDS.ATT_BEAMEDWITH;
const ATT_BEAMINGLOG = ATT_CLASS_IDS.ATT_BEAMINGLOG;
const ATT_BEATRPTLOG = ATT_CLASS_IDS.ATT_BEATRPTLOG;
const ATT_BRACKETSPANLOG = ATT_CLASS_IDS.ATT_BRACKETSPANLOG;
const ATT_CUTOUT = ATT_CLASS_IDS.ATT_CUTOUT;
const ATT_EXPANDABLE = ATT_CLASS_IDS.ATT_EXPANDABLE;
const ATT_GLISSPRESENT = ATT_CLASS_IDS.ATT_GLISSPRESENT;
const ATT_GRACEGRPLOG = ATT_CLASS_IDS.ATT_GRACEGRPLOG;
const ATT_GRACED = ATT_CLASS_IDS.ATT_GRACED;
const ATT_HAIRPINLOG = ATT_CLASS_IDS.ATT_HAIRPINLOG;
const ATT_HARPPEDALLOG = ATT_CLASS_IDS.ATT_HARPPEDALLOG;
const ATT_LVPRESENT = ATT_CLASS_IDS.ATT_LVPRESENT;
const ATT_MEASURELOG = ATT_CLASS_IDS.ATT_MEASURELOG;
const ATT_METERSIGGRPLOG = ATT_CLASS_IDS.ATT_METERSIGGRPLOG;
const ATT_NUMBERPLACEMENT = ATT_CLASS_IDS.ATT_NUMBERPLACEMENT;
const ATT_NUMBERED = ATT_CLASS_IDS.ATT_NUMBERED;
const ATT_OCTAVELOG = ATT_CLASS_IDS.ATT_OCTAVELOG;
const ATT_PEDALLOG = ATT_CLASS_IDS.ATT_PEDALLOG;
const ATT_PIANOPEDALS = ATT_CLASS_IDS.ATT_PIANOPEDALS;
const ATT_REHEARSAL = ATT_CLASS_IDS.ATT_REHEARSAL;
const ATT_SLURREND = ATT_CLASS_IDS.ATT_SLURREND;
const ATT_STEMSCMN = ATT_CLASS_IDS.ATT_STEMSCMN;
const ATT_TIEREND = ATT_CLASS_IDS.ATT_TIEREND;
const ATT_TREMFORM = ATT_CLASS_IDS.ATT_TREMFORM;
const ATT_TREMMEASURED = ATT_CLASS_IDS.ATT_TREMMEASURED;
const ATT_MORDENTLOG = ATT_CLASS_IDS.ATT_MORDENTLOG;
const ATT_ORNAMPRESENT = ATT_CLASS_IDS.ATT_ORNAMPRESENT;
const ATT_ORNAMENTACCID = ATT_CLASS_IDS.ATT_ORNAMENTACCID;
const ATT_TURNLOG = ATT_CLASS_IDS.ATT_TURNLOG;
const ATT_CRIT = ATT_CLASS_IDS.ATT_CRIT;
const ATT_AGENTIDENT = ATT_CLASS_IDS.ATT_AGENTIDENT;
const ATT_REASONIDENT = ATT_CLASS_IDS.ATT_REASONIDENT;
const ATT_EXTSYMAUTH = ATT_CLASS_IDS.ATT_EXTSYMAUTH;
const ATT_EXTSYMNAMES = ATT_CLASS_IDS.ATT_EXTSYMNAMES;
const ATT_FACSIMILE = ATT_CLASS_IDS.ATT_FACSIMILE;
const ATT_TABULAR = ATT_CLASS_IDS.ATT_TABULAR;
const ATT_FINGGRPLOG = ATT_CLASS_IDS.ATT_FINGGRPLOG;
const ATT_ACCIDENTALGES = ATT_CLASS_IDS.ATT_ACCIDENTALGES;
const ATT_ARTICULATIONGES = ATT_CLASS_IDS.ATT_ARTICULATIONGES;
const ATT_ATTACKING = ATT_CLASS_IDS.ATT_ATTACKING;
const ATT_BENDGES = ATT_CLASS_IDS.ATT_BENDGES;
const ATT_DURATIONGES = ATT_CLASS_IDS.ATT_DURATIONGES;
const ATT_NOTEGES = ATT_CLASS_IDS.ATT_NOTEGES;
const ATT_ORNAMENTACCIDGES = ATT_CLASS_IDS.ATT_ORNAMENTACCIDGES;
const ATT_PITCHGES = ATT_CLASS_IDS.ATT_PITCHGES;
const ATT_SOUNDLOCATION = ATT_CLASS_IDS.ATT_SOUNDLOCATION;
const ATT_TIMESTAMPGES = ATT_CLASS_IDS.ATT_TIMESTAMPGES;
const ATT_TIMESTAMP2GES = ATT_CLASS_IDS.ATT_TIMESTAMP2GES;
const ATT_HARMLOG = ATT_CLASS_IDS.ATT_HARMLOG;
const ATT_ADLIBITUM = ATT_CLASS_IDS.ATT_ADLIBITUM;
const ATT_BIFOLIUMSURFACES = ATT_CLASS_IDS.ATT_BIFOLIUMSURFACES;
const ATT_FOLIUMSURFACES = ATT_CLASS_IDS.ATT_FOLIUMSURFACES;
const ATT_PERFRES = ATT_CLASS_IDS.ATT_PERFRES;
const ATT_PERFRESBASIC = ATT_CLASS_IDS.ATT_PERFRESBASIC;
const ATT_RECORDTYPE = ATT_CLASS_IDS.ATT_RECORDTYPE;
const ATT_REGULARMETHOD = ATT_CLASS_IDS.ATT_REGULARMETHOD;
const ATT_DURATIONQUALITY = ATT_CLASS_IDS.ATT_DURATIONQUALITY;
const ATT_MENSURALLOG = ATT_CLASS_IDS.ATT_MENSURALLOG;
const ATT_MENSURALSHARED = ATT_CLASS_IDS.ATT_MENSURALSHARED;
const ATT_NOTEVISMENSURAL = ATT_CLASS_IDS.ATT_NOTEVISMENSURAL;
const ATT_RESTVISMENSURAL = ATT_CLASS_IDS.ATT_RESTVISMENSURAL;
const ATT_STEMSMENSURAL = ATT_CLASS_IDS.ATT_STEMSMENSURAL;
const ATT_CHANNELIZED = ATT_CLASS_IDS.ATT_CHANNELIZED;
const ATT_INSTRUMENTIDENT = ATT_CLASS_IDS.ATT_INSTRUMENTIDENT;
const ATT_MIDIINSTRUMENT = ATT_CLASS_IDS.ATT_MIDIINSTRUMENT;
const ATT_MIDINUMBER = ATT_CLASS_IDS.ATT_MIDINUMBER;
const ATT_MIDITEMPO = ATT_CLASS_IDS.ATT_MIDITEMPO;
const ATT_MIDIVALUE = ATT_CLASS_IDS.ATT_MIDIVALUE;
const ATT_MIDIVALUE2 = ATT_CLASS_IDS.ATT_MIDIVALUE2;
const ATT_MIDIVELOCITY = ATT_CLASS_IDS.ATT_MIDIVELOCITY;
const ATT_TIMEBASE = ATT_CLASS_IDS.ATT_TIMEBASE;
const ATT_DIVLINELOG = ATT_CLASS_IDS.ATT_DIVLINELOG;
const ATT_NCLOG = ATT_CLASS_IDS.ATT_NCLOG;
const ATT_NCFORM = ATT_CLASS_IDS.ATT_NCFORM;
const ATT_NEUMETYPE = ATT_CLASS_IDS.ATT_NEUMETYPE;
const ATT_MARGINS = ATT_CLASS_IDS.ATT_MARGINS;
const ATT_ALIGNMENT = ATT_CLASS_IDS.ATT_ALIGNMENT;
const ATT_ACCIDLOG = ATT_CLASS_IDS.ATT_ACCIDLOG;
const ATT_ACCIDENTAL = ATT_CLASS_IDS.ATT_ACCIDENTAL;
const ATT_ANNOTLOG = ATT_CLASS_IDS.ATT_ANNOTLOG;
const ATT_ARTICULATION = ATT_CLASS_IDS.ATT_ARTICULATION;
const ATT_ATTACCALOG = ATT_CLASS_IDS.ATT_ATTACCALOG;
const ATT_AUDIENCE = ATT_CLASS_IDS.ATT_AUDIENCE;
const ATT_AUGMENTDOTS = ATT_CLASS_IDS.ATT_AUGMENTDOTS;
const ATT_AUTHORIZED = ATT_CLASS_IDS.ATT_AUTHORIZED;
const ATT_BARLINELOG = ATT_CLASS_IDS.ATT_BARLINELOG;
const ATT_BARRING = ATT_CLASS_IDS.ATT_BARRING;
const ATT_BASIC = ATT_CLASS_IDS.ATT_BASIC;
const ATT_BIBL = ATT_CLASS_IDS.ATT_BIBL;
const ATT_CALENDARED = ATT_CLASS_IDS.ATT_CALENDARED;
const ATT_CANONICAL = ATT_CLASS_IDS.ATT_CANONICAL;
const ATT_CLASSED = ATT_CLASS_IDS.ATT_CLASSED;
const ATT_CLEFLOG = ATT_CLASS_IDS.ATT_CLEFLOG;
const ATT_CLEFSHAPE = ATT_CLASS_IDS.ATT_CLEFSHAPE;
const ATT_CLEFFINGLOG = ATT_CLASS_IDS.ATT_CLEFFINGLOG;
const ATT_COLOR = ATT_CLASS_IDS.ATT_COLOR;
const ATT_COLORATION = ATT_CLASS_IDS.ATT_COLORATION;
const ATT_COORDX1 = ATT_CLASS_IDS.ATT_COORDX1;
const ATT_COORDX2 = ATT_CLASS_IDS.ATT_COORDX2;
const ATT_COORDY1 = ATT_CLASS_IDS.ATT_COORDY1;
const ATT_COORDINATED = ATT_CLASS_IDS.ATT_COORDINATED;
const ATT_COORDINATEDUL = ATT_CLASS_IDS.ATT_COORDINATEDUL;
const ATT_CUE = ATT_CLASS_IDS.ATT_CUE;
const ATT_CURVATURE = ATT_CLASS_IDS.ATT_CURVATURE;
const ATT_CUSTOSLOG = ATT_CLASS_IDS.ATT_CUSTOSLOG;
const ATT_DATAPOINTING = ATT_CLASS_IDS.ATT_DATAPOINTING;
const ATT_DATASELECTING = ATT_CLASS_IDS.ATT_DATASELECTING;
const ATT_DATABLE = ATT_CLASS_IDS.ATT_DATABLE;
const ATT_DISTANCES = ATT_CLASS_IDS.ATT_DISTANCES;
const ATT_DOCSTATUS = ATT_CLASS_IDS.ATT_DOCSTATUS;
const ATT_DOTLOG = ATT_CLASS_IDS.ATT_DOTLOG;
const ATT_DURATIONADDITIVE = ATT_CLASS_IDS.ATT_DURATIONADDITIVE;
const ATT_DURATIONDEFAULT = ATT_CLASS_IDS.ATT_DURATIONDEFAULT;
const ATT_DURATIONLOG = ATT_CLASS_IDS.ATT_DURATIONLOG;
const ATT_DURATIONRATIO = ATT_CLASS_IDS.ATT_DURATIONRATIO;
const ATT_ENCLOSINGCHARS = ATT_CLASS_IDS.ATT_ENCLOSINGCHARS;
const ATT_ENDINGS = ATT_CLASS_IDS.ATT_ENDINGS;
const ATT_EVIDENCE = ATT_CLASS_IDS.ATT_EVIDENCE;
const ATT_EXTENDER = ATT_CLASS_IDS.ATT_EXTENDER;
const ATT_EXTENT = ATT_CLASS_IDS.ATT_EXTENT;
const ATT_FERMATAPRESENT = ATT_CLASS_IDS.ATT_FERMATAPRESENT;
const ATT_FILING = ATT_CLASS_IDS.ATT_FILING;
const ATT_FORMEWORK = ATT_CLASS_IDS.ATT_FORMEWORK;
const ATT_GRPSYMLOG = ATT_CLASS_IDS.ATT_GRPSYMLOG;
const ATT_HANDIDENT = ATT_CLASS_IDS.ATT_HANDIDENT;
const ATT_HEIGHT = ATT_CLASS_IDS.ATT_HEIGHT;
const ATT_HORIZONTALALIGN = ATT_CLASS_IDS.ATT_HORIZONTALALIGN;
const ATT_INTERNETMEDIA = ATT_CLASS_IDS.ATT_INTERNETMEDIA;
const ATT_JOINED = ATT_CLASS_IDS.ATT_JOINED;
const ATT_KEYSIGLOG = ATT_CLASS_IDS.ATT_KEYSIGLOG;
const ATT_KEYSIGDEFAULTLOG = ATT_CLASS_IDS.ATT_KEYSIGDEFAULTLOG;
const ATT_LABELLED = ATT_CLASS_IDS.ATT_LABELLED;
const ATT_LANG = ATT_CLASS_IDS.ATT_LANG;
const ATT_LAYERLOG = ATT_CLASS_IDS.ATT_LAYERLOG;
const ATT_LAYERIDENT = ATT_CLASS_IDS.ATT_LAYERIDENT;
const ATT_LINELOC = ATT_CLASS_IDS.ATT_LINELOC;
const ATT_LINEREND = ATT_CLASS_IDS.ATT_LINEREND;
const ATT_LINERENDBASE = ATT_CLASS_IDS.ATT_LINERENDBASE;
const ATT_LINKING = ATT_CLASS_IDS.ATT_LINKING;
const ATT_LYRICSTYLE = ATT_CLASS_IDS.ATT_LYRICSTYLE;
const ATT_MEASURENUMBERS = ATT_CLASS_IDS.ATT_MEASURENUMBERS;
const ATT_MEASUREMENT = ATT_CLASS_IDS.ATT_MEASUREMENT;
const ATT_MEDIABOUNDS = ATT_CLASS_IDS.ATT_MEDIABOUNDS;
const ATT_MEDIUM = ATT_CLASS_IDS.ATT_MEDIUM;
const ATT_MEIVERSION = ATT_CLASS_IDS.ATT_MEIVERSION;
const ATT_MENSURLOG = ATT_CLASS_IDS.ATT_MENSURLOG;
const ATT_METADATAPOINTING = ATT_CLASS_IDS.ATT_METADATAPOINTING;
const ATT_METERCONFORMANCE = ATT_CLASS_IDS.ATT_METERCONFORMANCE;
const ATT_METERCONFORMANCEBAR = ATT_CLASS_IDS.ATT_METERCONFORMANCEBAR;
const ATT_METERSIGLOG = ATT_CLASS_IDS.ATT_METERSIGLOG;
const ATT_METERSIGDEFAULTLOG = ATT_CLASS_IDS.ATT_METERSIGDEFAULTLOG;
const ATT_MMTEMPO = ATT_CLASS_IDS.ATT_MMTEMPO;
const ATT_MULTINUMMEASURES = ATT_CLASS_IDS.ATT_MULTINUMMEASURES;
const ATT_NINTEGER = ATT_CLASS_IDS.ATT_NINTEGER;
const ATT_NNUMBERLIKE = ATT_CLASS_IDS.ATT_NNUMBERLIKE;
const ATT_NAME = ATT_CLASS_IDS.ATT_NAME;
const ATT_NOTATIONSTYLE = ATT_CLASS_IDS.ATT_NOTATIONSTYLE;
const ATT_NOTEHEADS = ATT_CLASS_IDS.ATT_NOTEHEADS;
const ATT_OCTAVE = ATT_CLASS_IDS.ATT_OCTAVE;
const ATT_OCTAVEDEFAULT = ATT_CLASS_IDS.ATT_OCTAVEDEFAULT;
const ATT_OCTAVEDISPLACEMENT = ATT_CLASS_IDS.ATT_OCTAVEDISPLACEMENT;
const ATT_ONELINESTAFF = ATT_CLASS_IDS.ATT_ONELINESTAFF;
const ATT_OPTIMIZATION = ATT_CLASS_IDS.ATT_OPTIMIZATION;
const ATT_ORIGINLAYERIDENT = ATT_CLASS_IDS.ATT_ORIGINLAYERIDENT;
const ATT_ORIGINSTAFFIDENT = ATT_CLASS_IDS.ATT_ORIGINSTAFFIDENT;
const ATT_ORIGINSTARTENDID = ATT_CLASS_IDS.ATT_ORIGINSTARTENDID;
const ATT_ORIGINTIMESTAMPLOG = ATT_CLASS_IDS.ATT_ORIGINTIMESTAMPLOG;
const ATT_PAGES = ATT_CLASS_IDS.ATT_PAGES;
const ATT_PARTIDENT = ATT_CLASS_IDS.ATT_PARTIDENT;
const ATT_PITCH = ATT_CLASS_IDS.ATT_PITCH;
const ATT_PLACEMENTONSTAFF = ATT_CLASS_IDS.ATT_PLACEMENTONSTAFF;
const ATT_PLACEMENTRELEVENT = ATT_CLASS_IDS.ATT_PLACEMENTRELEVENT;
const ATT_PLACEMENTRELSTAFF = ATT_CLASS_IDS.ATT_PLACEMENTRELSTAFF;
const ATT_PLIST = ATT_CLASS_IDS.ATT_PLIST;
const ATT_POINTING = ATT_CLASS_IDS.ATT_POINTING;
const ATT_QUANTITY = ATT_CLASS_IDS.ATT_QUANTITY;
const ATT_RANGING = ATT_CLASS_IDS.ATT_RANGING;
const ATT_REPEATMARKLOG = ATT_CLASS_IDS.ATT_REPEATMARKLOG;
const ATT_RESPONSIBILITY = ATT_CLASS_IDS.ATT_RESPONSIBILITY;
const ATT_RESTDURATIONLOG = ATT_CLASS_IDS.ATT_RESTDURATIONLOG;
const ATT_SCALABLE = ATT_CLASS_IDS.ATT_SCALABLE;
const ATT_SEQUENCE = ATT_CLASS_IDS.ATT_SEQUENCE;
const ATT_SLASHCOUNT = ATT_CLASS_IDS.ATT_SLASHCOUNT;
const ATT_SLURPRESENT = ATT_CLASS_IDS.ATT_SLURPRESENT;
const ATT_SOURCE = ATT_CLASS_IDS.ATT_SOURCE;
const ATT_SPACING = ATT_CLASS_IDS.ATT_SPACING;
const ATT_STAFFLOG = ATT_CLASS_IDS.ATT_STAFFLOG;
const ATT_STAFFDEFLOG = ATT_CLASS_IDS.ATT_STAFFDEFLOG;
const ATT_STAFFGROUPINGSYM = ATT_CLASS_IDS.ATT_STAFFGROUPINGSYM;
const ATT_STAFFIDENT = ATT_CLASS_IDS.ATT_STAFFIDENT;
const ATT_STAFFITEMS = ATT_CLASS_IDS.ATT_STAFFITEMS;
const ATT_STAFFLOC = ATT_CLASS_IDS.ATT_STAFFLOC;
const ATT_STAFFLOCPITCHED = ATT_CLASS_IDS.ATT_STAFFLOCPITCHED;
const ATT_STARTENDID = ATT_CLASS_IDS.ATT_STARTENDID;
const ATT_STARTID = ATT_CLASS_IDS.ATT_STARTID;
const ATT_STEMS = ATT_CLASS_IDS.ATT_STEMS;
const ATT_SYLLOG = ATT_CLASS_IDS.ATT_SYLLOG;
const ATT_SYLTEXT = ATT_CLASS_IDS.ATT_SYLTEXT;
const ATT_SYSTEMS = ATT_CLASS_IDS.ATT_SYSTEMS;
const ATT_TARGETEVAL = ATT_CLASS_IDS.ATT_TARGETEVAL;
const ATT_TEMPOLOG = ATT_CLASS_IDS.ATT_TEMPOLOG;
const ATT_TEXTRENDITION = ATT_CLASS_IDS.ATT_TEXTRENDITION;
const ATT_TEXTSTYLE = ATT_CLASS_IDS.ATT_TEXTSTYLE;
const ATT_TIEPRESENT = ATT_CLASS_IDS.ATT_TIEPRESENT;
const ATT_TIMESTAMPLOG = ATT_CLASS_IDS.ATT_TIMESTAMPLOG;
const ATT_TIMESTAMP2LOG = ATT_CLASS_IDS.ATT_TIMESTAMP2LOG;
const ATT_TRANSPOSITION = ATT_CLASS_IDS.ATT_TRANSPOSITION;
const ATT_TUNING = ATT_CLASS_IDS.ATT_TUNING;
const ATT_TUNINGLOG = ATT_CLASS_IDS.ATT_TUNINGLOG;
const ATT_TUPLETPRESENT = ATT_CLASS_IDS.ATT_TUPLETPRESENT;
const ATT_TYPED = ATT_CLASS_IDS.ATT_TYPED;
const ATT_TYPOGRAPHY = ATT_CLASS_IDS.ATT_TYPOGRAPHY;
const ATT_VERTICALALIGN = ATT_CLASS_IDS.ATT_VERTICALALIGN;
const ATT_VERTICALGROUP = ATT_CLASS_IDS.ATT_VERTICALGROUP;
const ATT_VISIBILITY = ATT_CLASS_IDS.ATT_VISIBILITY;
const ATT_VISUALOFFSETHO = ATT_CLASS_IDS.ATT_VISUALOFFSETHO;
const ATT_VISUALOFFSETTO = ATT_CLASS_IDS.ATT_VISUALOFFSETTO;
const ATT_VISUALOFFSETVO = ATT_CLASS_IDS.ATT_VISUALOFFSETVO;
const ATT_VISUALOFFSET2HO = ATT_CLASS_IDS.ATT_VISUALOFFSET2HO;
const ATT_VISUALOFFSET2TO = ATT_CLASS_IDS.ATT_VISUALOFFSET2TO;
const ATT_VISUALOFFSET2VO = ATT_CLASS_IDS.ATT_VISUALOFFSET2VO;
const ATT_VOLTAGROUPINGSYM = ATT_CLASS_IDS.ATT_VOLTAGROUPINGSYM;
const ATT_WHITESPACE = ATT_CLASS_IDS.ATT_WHITESPACE;
const ATT_WIDTH = ATT_CLASS_IDS.ATT_WIDTH;
const ATT_XY = ATT_CLASS_IDS.ATT_XY;
const ATT_XY2 = ATT_CLASS_IDS.ATT_XY2;
const ATT_STAFFDEFVISTABLATURE = ATT_CLASS_IDS.ATT_STAFFDEFVISTABLATURE;
const ATT_STRINGTAB = ATT_CLASS_IDS.ATT_STRINGTAB;
const ATT_STRINGTABPOSITION = ATT_CLASS_IDS.ATT_STRINGTABPOSITION;
const ATT_STRINGTABTUNING = ATT_CLASS_IDS.ATT_STRINGTABTUNING;
const ATT_ALTSYM = ATT_CLASS_IDS.ATT_ALTSYM;
const ATT_ANCHOREDTEXTLOG = ATT_CLASS_IDS.ATT_ANCHOREDTEXTLOG;
const ATT_CURVELOG = ATT_CLASS_IDS.ATT_CURVELOG;
const ATT_LINELOG = ATT_CLASS_IDS.ATT_LINELOG;
const ATT_ANNOTVIS = ATT_CLASS_IDS.ATT_ANNOTVIS;
const ATT_ARPEGVIS = ATT_CLASS_IDS.ATT_ARPEGVIS;
const ATT_BARLINEVIS = ATT_CLASS_IDS.ATT_BARLINEVIS;
const ATT_BEAMINGVIS = ATT_CLASS_IDS.ATT_BEAMINGVIS;
const ATT_BEATRPTVIS = ATT_CLASS_IDS.ATT_BEATRPTVIS;
const ATT_CHORDVIS = ATT_CLASS_IDS.ATT_CHORDVIS;
const ATT_CLEFFINGVIS = ATT_CLASS_IDS.ATT_CLEFFINGVIS;
const ATT_CURVATUREDIRECTION = ATT_CLASS_IDS.ATT_CURVATUREDIRECTION;
const ATT_EPISEMAVIS = ATT_CLASS_IDS.ATT_EPISEMAVIS;
const ATT_FTREMVIS = ATT_CLASS_IDS.ATT_FTREMVIS;
const ATT_FERMATAVIS = ATT_CLASS_IDS.ATT_FERMATAVIS;
const ATT_FINGGRPVIS = ATT_CLASS_IDS.ATT_FINGGRPVIS;
const ATT_GUITARGRIDVIS = ATT_CLASS_IDS.ATT_GUITARGRIDVIS;
const ATT_HAIRPINVIS = ATT_CLASS_IDS.ATT_HAIRPINVIS;
const ATT_HARMVIS = ATT_CLASS_IDS.ATT_HARMVIS;
const ATT_HISPANTICKVIS = ATT_CLASS_IDS.ATT_HISPANTICKVIS;
const ATT_KEYSIGVIS = ATT_CLASS_IDS.ATT_KEYSIGVIS;
const ATT_KEYSIGDEFAULTVIS = ATT_CLASS_IDS.ATT_KEYSIGDEFAULTVIS;
const ATT_LIGATUREVIS = ATT_CLASS_IDS.ATT_LIGATUREVIS;
const ATT_LINEVIS = ATT_CLASS_IDS.ATT_LINEVIS;
const ATT_LIQUESCENTVIS = ATT_CLASS_IDS.ATT_LIQUESCENTVIS;
const ATT_MENSURVIS = ATT_CLASS_IDS.ATT_MENSURVIS;
const ATT_MENSURALVIS = ATT_CLASS_IDS.ATT_MENSURALVIS;
const ATT_METERSIGVIS = ATT_CLASS_IDS.ATT_METERSIGVIS;
const ATT_METERSIGDEFAULTVIS = ATT_CLASS_IDS.ATT_METERSIGDEFAULTVIS;
const ATT_MULTIRESTVIS = ATT_CLASS_IDS.ATT_MULTIRESTVIS;
const ATT_PBVIS = ATT_CLASS_IDS.ATT_PBVIS;
const ATT_PEDALVIS = ATT_CLASS_IDS.ATT_PEDALVIS;
const ATT_PLICAVIS = ATT_CLASS_IDS.ATT_PLICAVIS;
const ATT_QUILISMAVIS = ATT_CLASS_IDS.ATT_QUILISMAVIS;
const ATT_SBVIS = ATT_CLASS_IDS.ATT_SBVIS;
const ATT_SCOREDEFVIS = ATT_CLASS_IDS.ATT_SCOREDEFVIS;
const ATT_SECTIONVIS = ATT_CLASS_IDS.ATT_SECTIONVIS;
const ATT_SIGNIFLETVIS = ATT_CLASS_IDS.ATT_SIGNIFLETVIS;
const ATT_SPACEVIS = ATT_CLASS_IDS.ATT_SPACEVIS;
const ATT_STAFFDEFVIS = ATT_CLASS_IDS.ATT_STAFFDEFVIS;
const ATT_STAFFGRPVIS = ATT_CLASS_IDS.ATT_STAFFGRPVIS;
const ATT_STEMVIS = ATT_CLASS_IDS.ATT_STEMVIS;
const ATT_TUPLETVIS = ATT_CLASS_IDS.ATT_TUPLETVIS;
const ATT_CLASS_max = ATT_CLASS_IDS.ATT_CLASS_max;

export type AttModuleAttribute = [string, string];
export type ArrayOfStrAttr = AttModuleAttribute[];

export interface AttModuleElementLike {
  HasAttClass(attClassId: number): boolean;
  [key: string]: any;
}

function assertAtt(att: unknown): asserts att is AttModuleElementLike {
  if (!att || typeof att !== 'object') {
    throw new Error('libmei AttModule dynamic_cast invariant failed');
  }
}

function resolveAttLinking(el: AttModuleElementLike): any {
  if (typeof (el as any).GetLinkingInterface === 'function') {
    return (el as any).GetLinkingInterface() ?? el;
  }
  return el;
}

function resolveAttFacsimile(el: AttModuleElementLike): any {
  if (typeof (el as any).GetFacsimileInterface === 'function') {
    return (el as any).GetFacsimileInterface() ?? el;
  }
  return el;
}

function resolveAttOffset(el: AttModuleElementLike): any {
  if (typeof (el as any).GetOffsetInterface === 'function') {
    return (el as any).GetOffsetInterface() ?? el;
  }
  return el;
}

function resolveAttOffsetSpanning(el: AttModuleElementLike): any {
  if (typeof (el as any).GetOffsetSpanningInterface === 'function') {
    return (el as any).GetOffsetSpanningInterface() ?? el;
  }
  return el;
}

function resolveAttPlist(el: AttModuleElementLike): any {
  if (typeof (el as any).GetPlistInterface === 'function') {
    return (el as any).GetPlistInterface() ?? el;
  }
  return el;
}

function resolveAttPosition(el: AttModuleElementLike): any {
  if (typeof (el as any).GetPositionInterface === 'function') {
    return (el as any).GetPositionInterface() ?? el;
  }
  return el;
}

function resolveAttPlacementRelStaff(el: AttModuleElementLike): any {
  if (typeof (el as any).GetPlace === 'function') return el;
  if (typeof (el as any).GetTextDirInterface === 'function') {
    return (el as any).GetTextDirInterface() ?? el;
  }
  return el;
}

function resolveAttAltSym(el: AttModuleElementLike): any {
  if (typeof (el as any).GetAltSymInterface === 'function') {
    return (el as any).GetAltSymInterface() ?? el;
  }
  return el;
}

function resolveAttAreaPos(el: AttModuleElementLike): any {
  if (typeof (el as any).GetAreaPosInterface === 'function') {
    return (el as any).GetAreaPosInterface() ?? el;
  }
  return el;
}

function resolveAttTimePoint(el: AttModuleElementLike): any {
  if (typeof (el as any).GetTimePointInterface === 'function') {
    return (el as any).GetTimePointInterface() ?? el;
  }
  return el;
}

function resolveAttTimeSpanning(el: AttModuleElementLike): any {
  if (typeof (el as any).GetTimeSpanningInterface === 'function') {
    return (el as any).GetTimeSpanningInterface() ?? el;
  }
  return el;
}

function resolveAttDuration(el: AttModuleElementLike): any {
  if (typeof (el as any).GetDurationInterface === 'function') {
    return (el as any).GetDurationInterface() ?? el;
  }
  return el;
}

function resolveAttStaffIdent(el: AttModuleElementLike): any {
  if (typeof (el as any).GetStaff === 'function') return el;
  if (typeof (el as any).GetTimePointInterface === 'function') {
    const tpi = (el as any).GetTimePointInterface();
    if (tpi && typeof tpi.GetStaff === 'function') return tpi;
  }
  if (typeof (el as any).GetDurationInterface === 'function') {
    const di = (el as any).GetDurationInterface();
    if (di && typeof di.GetStaff === 'function') return di;
  }
  return el;
}

function resolveAttNcform(el: AttModuleElementLike): any {
  if (typeof (el as any).GetNcForm === 'function') {
    return (el as any).GetNcForm() ?? el;
  }
  return el;
}

function resolveAttPitch(el: AttModuleElementLike): any {
  if (typeof (el as any).GetPitchInterface === 'function') {
    return (el as any).GetPitchInterface() ?? el;
  }
  return el;
}

function resolveAttLabelled(el: AttModuleElementLike): any {
  const raw = el as any;
  if (raw && raw.attLabelled) return raw.attLabelled;
  if (raw && typeof raw.GetLabelAttr === 'function') {
    return {
      SetLabel: (v: any) => raw.SetLabelAttr(v),
      GetLabel: () => raw.GetLabelAttr(),
      HasLabel: () => raw.HasLabelAttr(),
      StrToStr: (v: any) => (typeof raw.StrToStr === 'function' ? raw.StrToStr(v) : v),
    };
  }
  return el;
}

// ponytail: generated per-attr dispatch for SetShared (P27).
// Replaces the 149-deep HasAttClass+string-compare chain per attribute
// (mei/033: SetShared 83ms self). Each handler preserves the legacy
// block order (first match wins); exotic blocks stay in legacySetShared.
const SHARED_SET_HANDLERS = new Map<string, (element: AttModuleElementLike, attrValue: string) => boolean>([
  ['aboveorder', (element, attrValue) => { if (element.HasAttClass(ATT_STAFFITEMS)) { const att = element; assertAtt(att); att.SetAboveorder(att.StrToStaffitem(attrValue)); return true; } return false; }],
  ['accid', (element, attrValue) => { if (element.HasAttClass(ATT_ACCIDENTAL)) { const att = element; assertAtt(att); att.SetAccid(att.StrToAccidentalWritten(attrValue)); return true; } return false; }],
  ['altrend', (element, attrValue) => { if (element.HasAttClass(ATT_TEXTRENDITION)) { const att = element; assertAtt(att); att.SetAltrend(att.StrToStr(attrValue)); return true; } return false; }],
  ['analog', (element, attrValue) => { if (element.HasAttClass(ATT_BIBL)) { const att = element; assertAtt(att); att.SetAnalog(att.StrToStr(attrValue)); return true; } return false; }],
  ['artic', (element, attrValue) => { if (element.HasAttClass(ATT_ARTICULATION)) { const att = element; assertAtt(att); att.SetArtic(att.StrToArticulationList(attrValue)); return true; } return false; }],
  ['atleast', (element, attrValue) => { if (element.HasAttClass(ATT_RANGING)) { const att = element; assertAtt(att); att.SetAtleast(att.StrToDbl(attrValue)); return true; } return false; }],
  ['atmost', (element, attrValue) => { if (element.HasAttClass(ATT_RANGING)) { const att = element; assertAtt(att); att.SetAtmost(att.StrToDbl(attrValue)); return true; } return false; }],
  ['audience', (element, attrValue) => { if (element.HasAttClass(ATT_AUDIENCE)) { const att = element; assertAtt(att); att.SetAudience(att.StrToAudienceAudience(attrValue)); return true; } return false; }],
  ['auth', (element, attrValue) => { if (element.HasAttClass(ATT_AUTHORIZED)) { const att = element; assertAtt(att); att.SetAuth(att.StrToStr(attrValue)); return true; } return false; }],
  ['auth.uri', (element, attrValue) => { if (element.HasAttClass(ATT_AUTHORIZED)) { const att = element; assertAtt(att); att.SetAuthUri(att.StrToStr(attrValue)); return true; } return false; }],
  ['bar.len', (element, attrValue) => { if (element.HasAttClass(ATT_BARRING)) { const att = element; assertAtt(att); att.SetBarLen(att.StrToDbl(attrValue)); return true; } return false; }],
  ['bar.method', (element, attrValue) => { if (element.HasAttClass(ATT_BARRING)) { const att = element; assertAtt(att); att.SetBarMethod(att.StrToBarmethod(attrValue)); return true; } return false; }],
  ['bar.place', (element, attrValue) => { if (element.HasAttClass(ATT_BARRING)) { const att = element; assertAtt(att); att.SetBarPlace(att.StrToInt(attrValue)); return true; } return false; }],
  ['begin', (element, attrValue) => { if (element.HasAttClass(ATT_MEDIABOUNDS)) { const att = element; assertAtt(att); att.SetBegin(att.StrToStr(attrValue)); return true; } return false; }],
  ['beloworder', (element, attrValue) => { if (element.HasAttClass(ATT_STAFFITEMS)) { const att = element; assertAtt(att); att.SetBeloworder(att.StrToStaffitem(attrValue)); return true; } return false; }],
  ['betweenorder', (element, attrValue) => { if (element.HasAttClass(ATT_STAFFITEMS)) { const att = element; assertAtt(att); att.SetBetweenorder(att.StrToStaffitem(attrValue)); return true; } return false; }],
  ['betype', (element, attrValue) => { if (element.HasAttClass(ATT_MEDIABOUNDS)) { const att = element; assertAtt(att); att.SetBetype(att.StrToBetype(attrValue)); return true; } return false; }],
  ['bezier', (element, attrValue) => { if (element.HasAttClass(ATT_CURVATURE)) { const att = element; assertAtt(att); att.SetBezier(att.StrToStr(attrValue)); return true; } return false; }],
  ['bulge', (element, attrValue) => { if (element.HasAttClass(ATT_CURVATURE)) { const att = element; assertAtt(att); att.SetBulge(att.StrToBulge(attrValue)); return true; } return false; }],
  ['calendar', (element, attrValue) => { if (element.HasAttClass(ATT_CALENDARED)) { const att = element; assertAtt(att); att.SetCalendar(att.StrToStr(attrValue)); return true; } return false; }],
  ['cautionary', (element, attrValue) => { if (element.HasAttClass(ATT_CLEFLOG)) { const att = element; assertAtt(att); att.SetCautionary(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['cert', (element, attrValue) => { if (element.HasAttClass(ATT_EVIDENCE)) { const att = element; assertAtt(att); att.SetCert(att.StrToCertainty(attrValue)); return true; } return false; }],
  ['class', (element, attrValue) => { if (element.HasAttClass(ATT_CLASSED)) { const att = element; assertAtt(att); att.SetClass(att.StrToStr(attrValue)); return true; } return false; }],
  ['clef.dis', (element, attrValue) => { if (element.HasAttClass(ATT_CLEFFINGLOG)) { const att = element; assertAtt(att); att.SetClefDis(att.StrToOctaveDis(attrValue)); return true; } return false; }],
  ['clef.dis.place', (element, attrValue) => { if (element.HasAttClass(ATT_CLEFFINGLOG)) { const att = element; assertAtt(att); att.SetClefDisPlace(att.StrToStaffrelBasic(attrValue)); return true; } return false; }],
  ['clef.line', (element, attrValue) => { if (element.HasAttClass(ATT_CLEFFINGLOG)) { const att = element; assertAtt(att); att.SetClefLine(att.StrToInt(attrValue)); return true; } return false; }],
  ['clef.shape', (element, attrValue) => { if (element.HasAttClass(ATT_CLEFFINGLOG)) { const att = element; assertAtt(att); att.SetClefShape(att.StrToClefshape(attrValue)); return true; } return false; }],
  ['codedval', (element, attrValue) => { if (element.HasAttClass(ATT_CANONICAL)) { const att = element; assertAtt(att); att.SetCodedval(att.StrToStr(attrValue)); return true; } return false; }],
  ['color', (element, attrValue) => { if (element.HasAttClass(ATT_COLOR)) { const att = element; assertAtt(att); att.SetColor(att.StrToStr(attrValue)); return true; } return false; }],
  ['colored', (element, attrValue) => { if (element.HasAttClass(ATT_COLORATION)) { const att = element; assertAtt(att); att.SetColored(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['con', (element, attrValue) => { if (element.HasAttClass(ATT_SYLLOG)) { const att = element; assertAtt(att); att.SetCon(att.StrToSylLogCon(attrValue)); return true; } return false; }],
  ['confidence', (element, attrValue) => { if (element.HasAttClass(ATT_RANGING)) { const att = element; assertAtt(att); att.SetConfidence(att.StrToDbl(attrValue)); return true; } return false; }],
  ['control', (element, attrValue) => { if (element.HasAttClass(ATT_METERCONFORMANCEBAR)) { const att = element; assertAtt(att); att.SetControl(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['coord.x1', (element, attrValue) => { if (element.HasAttClass(ATT_COORDX1)) { const att = element; assertAtt(att); att.SetCoordX1(att.StrToDbl(attrValue)); return true; } return false; }],
  ['coord.x2', (element, attrValue) => { if (element.HasAttClass(ATT_COORDX2)) { const att = element; assertAtt(att); att.SetCoordX2(att.StrToDbl(attrValue)); return true; } return false; }],
  ['coord.y1', (element, attrValue) => { if (element.HasAttClass(ATT_COORDY1)) { const att = element; assertAtt(att); att.SetCoordY1(att.StrToDbl(attrValue)); return true; } return false; }],
  ['copyof', (element, attrValue) => { if (element.HasAttClass(ATT_LINKING)) { const att = resolveAttLinking(element); assertAtt(att); att.SetCopyof(att.StrToStr(attrValue)); return true; } return false; }],
  ['corresp', (element, attrValue) => { if (element.HasAttClass(ATT_LINKING)) { const att = resolveAttLinking(element); assertAtt(att); att.SetCorresp(att.StrToStr(attrValue)); return true; } return false; }],
  ['count', (element, attrValue) => { if (element.HasAttClass(ATT_METERSIGLOG)) { const att = element; assertAtt(att); att.SetCount(att.StrToMetercountPair(attrValue)); return true; } return false; }],
  ['cue', (element, attrValue) => { if (element.HasAttClass(ATT_CUE)) { const att = element; assertAtt(att); att.SetCue(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['curvedir', (element, attrValue) => { if (element.HasAttClass(ATT_CURVATURE)) { const att = element; assertAtt(att); att.SetCurvedir(att.StrToCurvatureCurvedir(attrValue)); return true; } return false; }],
  ['data', (element, attrValue) => { if (element.HasAttClass(ATT_DATAPOINTING)) { const att = element; assertAtt(att); att.SetData(att.StrToStr(attrValue)); return true; } return false; }],
  ['decls', (element, attrValue) => { if (element.HasAttClass(ATT_METADATAPOINTING)) { const att = element; assertAtt(att); att.SetDecls(att.StrToStr(attrValue)); return true; } return false; }],
  ['def', (element, attrValue) => { if (element.HasAttClass(ATT_LAYERLOG)) { const att = element; assertAtt(att); att.SetDef(att.StrToStr(attrValue)); return true; } if (element.HasAttClass(ATT_STAFFLOG)) { const att = element; assertAtt(att); att.SetDef(att.StrToStr(attrValue)); return true; } return false; }],
  ['dir.dist', (element, attrValue) => { if (element.HasAttClass(ATT_DISTANCES)) { const att = element; assertAtt(att); att.SetDirDist(att.StrToMeasurementsigned(attrValue)); return true; } return false; }],
  ['dis', (element, attrValue) => { if (element.HasAttClass(ATT_OCTAVEDISPLACEMENT)) { const att = element; assertAtt(att); att.SetDis(att.StrToOctaveDis(attrValue)); return true; } return false; }],
  ['dis.place', (element, attrValue) => { if (element.HasAttClass(ATT_OCTAVEDISPLACEMENT)) { const att = element; assertAtt(att); att.SetDisPlace(att.StrToStaffrelBasic(attrValue)); return true; } return false; }],
  ['dots', (element, attrValue) => { if (element.HasAttClass(ATT_AUGMENTDOTS)) { const att = resolveAttDuration(element); assertAtt(att); att.SetDots(att.StrToInt(attrValue)); return true; } return false; }],
  ['dur', (element, attrValue) => { if (element.HasAttClass(ATT_DURATIONADDITIVE)) { const att = element; assertAtt(att); att.SetDur(att.StrToDuration(attrValue)); return true; } if (element.HasAttClass(ATT_DURATIONLOG)) { const att = resolveAttDuration(element); assertAtt(att); att.SetDur(att.StrToDuration(attrValue)); return true; } if (element.HasAttClass(ATT_RESTDURATIONLOG)) { const att = element; assertAtt(att); att.SetDur(att.StrToDuration(attrValue)); return true; } return false; }],
  ['dur.default', (element, attrValue) => { if (element.HasAttClass(ATT_DURATIONDEFAULT)) { const att = element; assertAtt(att); att.SetDurDefault(att.StrToDuration(attrValue)); return true; } return false; }],
  ['dynam.dist', (element, attrValue) => { if (element.HasAttClass(ATT_DISTANCES)) { const att = element; assertAtt(att); att.SetDynamDist(att.StrToMeasurementsigned(attrValue)); return true; } return false; }],
  ['enclose', (element, attrValue) => { if (element.HasAttClass(ATT_ENCLOSINGCHARS)) { const att = element; assertAtt(att); att.SetEnclose(att.StrToEnclosure(attrValue)); return true; } return false; }],
  ['end', (element, attrValue) => { if (element.HasAttClass(ATT_MEDIABOUNDS)) { const att = element; assertAtt(att); att.SetEnd(att.StrToStr(attrValue)); return true; } return false; }],
  ['enddate', (element, attrValue) => { if (element.HasAttClass(ATT_DATABLE)) { const att = element; assertAtt(att); att.SetEnddate(att.StrToStr(attrValue)); return true; } return false; }],
  ['endho', (element, attrValue) => { if (element.HasAttClass(ATT_VISUALOFFSET2HO)) { const att = resolveAttOffsetSpanning(element); assertAtt(att); att.SetEndho(att.StrToMeasurementsigned(attrValue)); return true; } return false; }],
  ['endid', (element, attrValue) => { if (element.HasAttClass(ATT_STARTENDID)) { const att = resolveAttTimeSpanning(element); assertAtt(att); att.SetEndid(att.StrToStr(attrValue)); return true; } return false; }],
  ['ending.rend', (element, attrValue) => { if (element.HasAttClass(ATT_ENDINGS)) { const att = element; assertAtt(att); att.SetEndingRend(att.StrToEndingsEndingrend(attrValue)); return true; } return false; }],
  ['endto', (element, attrValue) => { if (element.HasAttClass(ATT_VISUALOFFSET2TO)) { const att = resolveAttOffsetSpanning(element); assertAtt(att); att.SetEndto(att.StrToDbl(attrValue)); return true; } return false; }],
  ['endvo', (element, attrValue) => { if (element.HasAttClass(ATT_VISUALOFFSET2VO)) { const att = resolveAttOffsetSpanning(element); assertAtt(att); att.SetEndvo(att.StrToMeasurementsigned(attrValue)); return true; } return false; }],
  ['evaluate', (element, attrValue) => { if (element.HasAttClass(ATT_TARGETEVAL)) { const att = element; assertAtt(att); att.SetEvaluate(att.StrToTargetEvalEvaluate(attrValue)); return true; } return false; }],
  ['evidence', (element, attrValue) => { if (element.HasAttClass(ATT_EVIDENCE)) { const att = element; assertAtt(att); att.SetEvidence(att.StrToStr(attrValue)); return true; } return false; }],
  ['extender', (element, attrValue) => { if (element.HasAttClass(ATT_EXTENDER)) { const att = element; assertAtt(att); att.SetExtender(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['extent', (element, attrValue) => { if (element.HasAttClass(ATT_EXTENT)) { const att = element; assertAtt(att); att.SetExtent(att.StrToStr(attrValue)); return true; } return false; }],
  ['fermata', (element, attrValue) => { if (element.HasAttClass(ATT_FERMATAPRESENT)) { const att = resolveAttDuration(element); assertAtt(att); att.SetFermata(att.StrToStaffrelBasic(attrValue)); return true; } return false; }],
  ['follows', (element, attrValue) => { if (element.HasAttClass(ATT_LINKING)) { const att = resolveAttLinking(element); assertAtt(att); att.SetFollows(att.StrToStr(attrValue)); return true; } return false; }],
  ['fontfam', (element, attrValue) => { if (element.HasAttClass(ATT_TYPOGRAPHY)) { const att = element; assertAtt(att); att.SetFontfam(att.StrToStr(attrValue)); return true; } return false; }],
  ['fontname', (element, attrValue) => { if (element.HasAttClass(ATT_TYPOGRAPHY)) { const att = element; assertAtt(att); att.SetFontname(att.StrToStr(attrValue)); return true; } return false; }],
  ['fontsize', (element, attrValue) => { if (element.HasAttClass(ATT_TYPOGRAPHY)) { const att = element; assertAtt(att); att.SetFontsize(att.StrToFontsize(attrValue)); return true; } return false; }],
  ['fontstyle', (element, attrValue) => { if (element.HasAttClass(ATT_TYPOGRAPHY)) { const att = element; assertAtt(att); att.SetFontstyle(att.StrToFontstyle(attrValue)); return true; } return false; }],
  ['fontweight', (element, attrValue) => { if (element.HasAttClass(ATT_TYPOGRAPHY)) { const att = element; assertAtt(att); att.SetFontweight(att.StrToFontweight(attrValue)); return true; } return false; }],
  ['form', (element, attrValue) => { if (element.HasAttClass(ATT_BARLINELOG)) { const att = element; assertAtt(att); att.SetForm(att.StrToBarrendition(attrValue)); return true; } if (element.HasAttClass(ATT_DOTLOG)) { const att = element; assertAtt(att); att.SetForm(att.StrToDotLogForm(attrValue)); return true; } return false; }],
  ['func', (element, attrValue) => { if (element.HasAttClass(ATT_ACCIDLOG)) { const att = element; assertAtt(att); att.SetFunc(att.StrToAccidLogFunc(attrValue)); return true; } if (element.HasAttClass(ATT_ANNOTLOG)) { const att = element; assertAtt(att); att.SetFunc(att.StrToStr(attrValue)); return true; } if (element.HasAttClass(ATT_FORMEWORK)) { const att = element; assertAtt(att); att.SetFunc(att.StrToPgfunc(attrValue)); return true; } if (element.HasAttClass(ATT_REPEATMARKLOG)) { const att = element; assertAtt(att); att.SetFunc(att.StrToRepeatMarkLogFunc(attrValue)); return true; } if (element.HasAttClass(ATT_TEMPOLOG)) { const att = element; assertAtt(att); att.SetFunc(att.StrToTempoLogFunc(attrValue)); return true; } return false; }],
  ['halign', (element, attrValue) => { if (element.HasAttClass(ATT_HORIZONTALALIGN)) { const att = resolveAttAreaPos(element); assertAtt(att); att.SetHalign(att.StrToHorizontalalignment(attrValue)); return true; } return false; }],
  ['hand', (element, attrValue) => { if (element.HasAttClass(ATT_HANDIDENT)) { const att = element; assertAtt(att); att.SetHand(att.StrToStr(attrValue)); return true; } return false; }],
  ['harm.dist', (element, attrValue) => { if (element.HasAttClass(ATT_DISTANCES)) { const att = element; assertAtt(att); att.SetHarmDist(att.StrToMeasurementsigned(attrValue)); return true; } return false; }],
  ['head.altsym', (element, attrValue) => { if (element.HasAttClass(ATT_NOTEHEADS)) { const att = element; assertAtt(att); att.SetHeadAltsym(att.StrToStr(attrValue)); return true; } return false; }],
  ['head.auth', (element, attrValue) => { if (element.HasAttClass(ATT_NOTEHEADS)) { const att = element; assertAtt(att); att.SetHeadAuth(att.StrToStr(attrValue)); return true; } return false; }],
  ['head.color', (element, attrValue) => { if (element.HasAttClass(ATT_NOTEHEADS)) { const att = element; assertAtt(att); att.SetHeadColor(att.StrToStr(attrValue)); return true; } return false; }],
  ['head.fill', (element, attrValue) => { if (element.HasAttClass(ATT_NOTEHEADS)) { const att = element; assertAtt(att); att.SetHeadFill(att.StrToFill(attrValue)); return true; } return false; }],
  ['head.fillcolor', (element, attrValue) => { if (element.HasAttClass(ATT_NOTEHEADS)) { const att = element; assertAtt(att); att.SetHeadFillcolor(att.StrToStr(attrValue)); return true; } return false; }],
  ['head.mod', (element, attrValue) => { if (element.HasAttClass(ATT_NOTEHEADS)) { const att = element; assertAtt(att); att.SetHeadMod(att.StrToNoteheadmodifier(attrValue)); return true; } return false; }],
  ['head.rotation', (element, attrValue) => { if (element.HasAttClass(ATT_NOTEHEADS)) { const att = element; assertAtt(att); att.SetHeadRotation(att.StrToRotation(attrValue)); return true; } return false; }],
  ['head.shape', (element, attrValue) => { if (element.HasAttClass(ATT_NOTEHEADS)) { const att = element; assertAtt(att); att.SetHeadShape(att.StrToHeadshape(attrValue)); return true; } return false; }],
  ['head.visible', (element, attrValue) => { if (element.HasAttClass(ATT_NOTEHEADS)) { const att = element; assertAtt(att); att.SetHeadVisible(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['height', (element, attrValue) => { if (element.HasAttClass(ATT_HEIGHT)) { const att = element; assertAtt(att); att.SetHeight(att.StrToMeasurementunsigned(attrValue)); return true; } return false; }],
  ['ho', (element, attrValue) => { if (element.HasAttClass(ATT_VISUALOFFSETHO)) { const att = resolveAttOffset(element); assertAtt(att); att.SetHo(att.StrToMeasurementsigned(attrValue)); return true; } return false; }],
  ['isodate', (element, attrValue) => { if (element.HasAttClass(ATT_DATABLE)) { const att = element; assertAtt(att); att.SetIsodate(att.StrToStr(attrValue)); return true; } return false; }],
  ['join', (element, attrValue) => { if (element.HasAttClass(ATT_JOINED)) { const att = element; assertAtt(att); att.SetJoin(att.StrToStr(attrValue)); return true; } return false; }],
  ['keysig', (element, attrValue) => { if (element.HasAttClass(ATT_KEYSIGDEFAULTLOG)) { const att = element; assertAtt(att); att.SetKeysig(att.StrToKeysignature(attrValue)); return true; } return false; }],
  ['layer', (element, attrValue) => { if (element.HasAttClass(ATT_LAYERIDENT)) { const att = element; assertAtt(att); att.SetLayer(att.StrToInt(attrValue)); return true; } return false; }],
  ['lendsym', (element, attrValue) => { if (element.HasAttClass(ATT_LINEREND)) { const att = element; assertAtt(att); att.SetLendsym(att.StrToLinestartendsymbol(attrValue)); return true; } return false; }],
  ['lendsym.size', (element, attrValue) => { if (element.HasAttClass(ATT_LINEREND)) { const att = element; assertAtt(att); att.SetLendsymSize(att.StrToInt(attrValue)); return true; } return false; }],
  ['letterspacing', (element, attrValue) => { if (element.HasAttClass(ATT_TYPOGRAPHY)) { const att = element; assertAtt(att); att.SetLetterspacing(att.StrToDbl(attrValue)); return true; } return false; }],
  ['level', (element, attrValue) => { if (element.HasAttClass(ATT_GRPSYMLOG)) { const att = element; assertAtt(att); att.SetLevel(att.StrToInt(attrValue)); return true; } if (element.HasAttClass(ATT_MENSURLOG)) { const att = element; assertAtt(att); att.SetLevel(att.StrToDuration(attrValue)); return true; } return false; }],
  ['lform', (element, attrValue) => { if (element.HasAttClass(ATT_LINERENDBASE)) { const att = element; assertAtt(att); att.SetLform(att.StrToLineform(attrValue)); return true; } return false; }],
  ['line', (element, attrValue) => { if (element.HasAttClass(ATT_LINELOC)) { const att = element; assertAtt(att); att.SetLine(att.StrToInt(attrValue)); return true; } return false; }],
  ['lineheight', (element, attrValue) => { if (element.HasAttClass(ATT_TYPOGRAPHY)) { const att = element; assertAtt(att); att.SetLineheight(att.StrToStr(attrValue)); return true; } return false; }],
  ['lines', (element, attrValue) => { if (element.HasAttClass(ATT_STAFFDEFLOG)) { const att = element; assertAtt(att); att.SetLines(att.StrToInt(attrValue)); return true; } return false; }],
  ['loc', (element, attrValue) => { if (element.HasAttClass(ATT_STAFFLOC)) { const att = resolveAttPosition(element); assertAtt(att); att.SetLoc(att.StrToInt(attrValue)); return true; } return false; }],
  ['lrx', (element, attrValue) => { if (element.HasAttClass(ATT_COORDINATED)) { const att = element; assertAtt(att); att.SetLrx(att.StrToInt(attrValue)); return true; } return false; }],
  ['lry', (element, attrValue) => { if (element.HasAttClass(ATT_COORDINATED)) { const att = element; assertAtt(att); att.SetLry(att.StrToInt(attrValue)); return true; } return false; }],
  ['lsegs', (element, attrValue) => { if (element.HasAttClass(ATT_LINERENDBASE)) { const att = element; assertAtt(att); att.SetLsegs(att.StrToInt(attrValue)); return true; } return false; }],
  ['lstartsym', (element, attrValue) => { if (element.HasAttClass(ATT_LINEREND)) { const att = element; assertAtt(att); att.SetLstartsym(att.StrToLinestartendsymbol(attrValue)); return true; } return false; }],
  ['lstartsym.size', (element, attrValue) => { if (element.HasAttClass(ATT_LINEREND)) { const att = element; assertAtt(att); att.SetLstartsymSize(att.StrToInt(attrValue)); return true; } return false; }],
  ['lwidth', (element, attrValue) => { if (element.HasAttClass(ATT_LINERENDBASE)) { const att = element; assertAtt(att); att.SetLwidth(att.StrToLinewidth(attrValue)); return true; } return false; }],
  ['lyric.align', (element, attrValue) => { if (element.HasAttClass(ATT_LYRICSTYLE)) { const att = element; assertAtt(att); att.SetLyricAlign(att.StrToMeasurementsigned(attrValue)); return true; } return false; }],
  ['lyric.fam', (element, attrValue) => { if (element.HasAttClass(ATT_LYRICSTYLE)) { const att = element; assertAtt(att); att.SetLyricFam(att.StrToStr(attrValue)); return true; } return false; }],
  ['lyric.name', (element, attrValue) => { if (element.HasAttClass(ATT_LYRICSTYLE)) { const att = element; assertAtt(att); att.SetLyricName(att.StrToStr(attrValue)); return true; } return false; }],
  ['lyric.size', (element, attrValue) => { if (element.HasAttClass(ATT_LYRICSTYLE)) { const att = element; assertAtt(att); att.SetLyricSize(att.StrToFontsize(attrValue)); return true; } return false; }],
  ['lyric.style', (element, attrValue) => { if (element.HasAttClass(ATT_LYRICSTYLE)) { const att = element; assertAtt(att); att.SetLyricStyle(att.StrToFontstyle(attrValue)); return true; } return false; }],
  ['lyric.weight', (element, attrValue) => { if (element.HasAttClass(ATT_LYRICSTYLE)) { const att = element; assertAtt(att); att.SetLyricWeight(att.StrToFontweight(attrValue)); return true; } return false; }],
  ['max', (element, attrValue) => { if (element.HasAttClass(ATT_RANGING)) { const att = element; assertAtt(att); att.SetMax(att.StrToDbl(attrValue)); return true; } return false; }],
  ['medium', (element, attrValue) => { if (element.HasAttClass(ATT_MEDIUM)) { const att = element; assertAtt(att); att.SetMedium(att.StrToStr(attrValue)); return true; } return false; }],
  ['meiversion', (element, attrValue) => { if (element.HasAttClass(ATT_MEIVERSION)) { const att = element; assertAtt(att); att.SetMeiversion(att.StrToMeiVersionMeiversion(attrValue)); return true; } return false; }],
  ['metcon', (element, attrValue) => { if (element.HasAttClass(ATT_METERCONFORMANCE)) { const att = element; assertAtt(att); att.SetMetcon(att.StrToMeterConformanceMetcon(attrValue)); return true; } if (element.HasAttClass(ATT_METERCONFORMANCEBAR)) { const att = element; assertAtt(att); att.SetMetcon(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['meter.count', (element, attrValue) => { if (element.HasAttClass(ATT_METERSIGDEFAULTLOG)) { const att = element; assertAtt(att); att.SetMeterCount(att.StrToMetercountPair(attrValue)); return true; } return false; }],
  ['meter.sym', (element, attrValue) => { if (element.HasAttClass(ATT_METERSIGDEFAULTLOG)) { const att = element; assertAtt(att); att.SetMeterSym(att.StrToMetersign(attrValue)); return true; } return false; }],
  ['meter.unit', (element, attrValue) => { if (element.HasAttClass(ATT_METERSIGDEFAULTLOG)) { const att = element; assertAtt(att); att.SetMeterUnit(att.StrToInt(attrValue)); return true; } return false; }],
  ['mimetype', (element, attrValue) => { if (element.HasAttClass(ATT_INTERNETMEDIA)) { const att = element; assertAtt(att); att.SetMimetype(att.StrToStr(attrValue)); return true; } return false; }],
  ['min', (element, attrValue) => { if (element.HasAttClass(ATT_RANGING)) { const att = element; assertAtt(att); att.SetMin(att.StrToDbl(attrValue)); return true; } return false; }],
  ['mm', (element, attrValue) => { if (element.HasAttClass(ATT_MMTEMPO)) { const att = element; assertAtt(att); att.SetMm(att.StrToDbl(attrValue)); return true; } return false; }],
  ['mm.dots', (element, attrValue) => { if (element.HasAttClass(ATT_MMTEMPO)) { const att = element; assertAtt(att); att.SetMmDots(att.StrToInt(attrValue)); return true; } return false; }],
  ['mm.unit', (element, attrValue) => { if (element.HasAttClass(ATT_MMTEMPO)) { const att = element; assertAtt(att); att.SetMmUnit(att.StrToDuration(attrValue)); return true; } return false; }],
  ['mnum.visible', (element, attrValue) => { if (element.HasAttClass(ATT_MEASURENUMBERS)) { const att = element; assertAtt(att); att.SetMnumVisible(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['multi.number', (element, attrValue) => { if (element.HasAttClass(ATT_MULTINUMMEASURES)) { const att = element; assertAtt(att); att.SetMultiNumber(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['music.name', (element, attrValue) => { if (element.HasAttClass(ATT_NOTATIONSTYLE)) { const att = element; assertAtt(att); att.SetMusicName(att.StrToStr(attrValue)); return true; } return false; }],
  ['music.size', (element, attrValue) => { if (element.HasAttClass(ATT_NOTATIONSTYLE)) { const att = element; assertAtt(att); att.SetMusicSize(att.StrToFontsize(attrValue)); return true; } return false; }],
  ['n', (element, attrValue) => { if (element.HasAttClass(ATT_NINTEGER)) { const att = element; assertAtt(att); att.SetN(att.StrToInt(attrValue)); return true; } if (element.HasAttClass(ATT_NNUMBERLIKE)) { const att = element; assertAtt(att); att.SetN(att.StrToStr(attrValue)); return true; } return false; }],
  ['next', (element, attrValue) => { if (element.HasAttClass(ATT_LINKING)) { const att = resolveAttLinking(element); assertAtt(att); att.SetNext(att.StrToStr(attrValue)); return true; } return false; }],
  ['nonfiling', (element, attrValue) => { if (element.HasAttClass(ATT_FILING)) { const att = element; assertAtt(att); att.SetNonfiling(att.StrToInt(attrValue)); return true; } return false; }],
  ['notafter', (element, attrValue) => { if (element.HasAttClass(ATT_DATABLE)) { const att = element; assertAtt(att); att.SetNotafter(att.StrToStr(attrValue)); return true; } return false; }],
  ['notbefore', (element, attrValue) => { if (element.HasAttClass(ATT_DATABLE)) { const att = element; assertAtt(att); att.SetNotbefore(att.StrToStr(attrValue)); return true; } return false; }],
  ['num', (element, attrValue) => { if (element.HasAttClass(ATT_DURATIONRATIO)) { const att = resolveAttDuration(element); assertAtt(att); att.SetNum(att.StrToInt(attrValue)); return true; } return false; }],
  ['num.default', (element, attrValue) => { if (element.HasAttClass(ATT_DURATIONDEFAULT)) { const att = element; assertAtt(att); att.SetNumDefault(att.StrToInt(attrValue)); return true; } return false; }],
  ['numbase', (element, attrValue) => { if (element.HasAttClass(ATT_DURATIONRATIO)) { const att = resolveAttDuration(element); assertAtt(att); att.SetNumbase(att.StrToInt(attrValue)); return true; } return false; }],
  ['numbase.default', (element, attrValue) => { if (element.HasAttClass(ATT_DURATIONDEFAULT)) { const att = element; assertAtt(att); att.SetNumbaseDefault(att.StrToInt(attrValue)); return true; } return false; }],
  ['nymref', (element, attrValue) => { if (element.HasAttClass(ATT_NAME)) { const att = element; assertAtt(att); att.SetNymref(att.StrToStr(attrValue)); return true; } return false; }],
  ['oct', (element, attrValue) => { if (element.HasAttClass(ATT_OCTAVE)) { const att = resolveAttPitch(element); assertAtt(att); att.SetOct(att.StrToOctave(attrValue)); return true; } return false; }],
  ['oct.default', (element, attrValue) => { if (element.HasAttClass(ATT_OCTAVEDEFAULT)) { const att = element; assertAtt(att); att.SetOctDefault(att.StrToOctave(attrValue)); return true; } return false; }],
  ['oloc', (element, attrValue) => { if (element.HasAttClass(ATT_STAFFLOCPITCHED)) { const att = resolveAttPosition(element); assertAtt(att); att.SetOloc(att.StrToOctave(attrValue)); return true; } return false; }],
  ['onstaff', (element, attrValue) => { if (element.HasAttClass(ATT_PLACEMENTONSTAFF)) { const att = element; assertAtt(att); att.SetOnstaff(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['ontheline', (element, attrValue) => { if (element.HasAttClass(ATT_ONELINESTAFF)) { const att = element; assertAtt(att); att.SetOntheline(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['optimize', (element, attrValue) => { if (element.HasAttClass(ATT_OPTIMIZATION)) { const att = element; assertAtt(att); att.SetOptimize(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['origin.endid', (element, attrValue) => { if (element.HasAttClass(ATT_ORIGINSTARTENDID)) { const att = element; assertAtt(att); att.SetOriginEndid(att.StrToStr(attrValue)); return true; } return false; }],
  ['origin.layer', (element, attrValue) => { if (element.HasAttClass(ATT_ORIGINLAYERIDENT)) { const att = element; assertAtt(att); att.SetOriginLayer(att.StrToStr(attrValue)); return true; } return false; }],
  ['origin.staff', (element, attrValue) => { if (element.HasAttClass(ATT_ORIGINSTAFFIDENT)) { const att = element; assertAtt(att); att.SetOriginStaff(att.StrToStr(attrValue)); return true; } return false; }],
  ['origin.startid', (element, attrValue) => { if (element.HasAttClass(ATT_ORIGINSTARTENDID)) { const att = element; assertAtt(att); att.SetOriginStartid(att.StrToStr(attrValue)); return true; } return false; }],
  ['origin.tstamp', (element, attrValue) => { if (element.HasAttClass(ATT_ORIGINTIMESTAMPLOG)) { const att = element; assertAtt(att); att.SetOriginTstamp(att.StrToMeasurebeat(attrValue)); return true; } return false; }],
  ['origin.tstamp2', (element, attrValue) => { if (element.HasAttClass(ATT_ORIGINTIMESTAMPLOG)) { const att = element; assertAtt(att); att.SetOriginTstamp2(att.StrToMeasurebeat(attrValue)); return true; } return false; }],
  ['page.botmar', (element, attrValue) => { if (element.HasAttClass(ATT_PAGES)) { const att = element; assertAtt(att); att.SetPageBotmar(att.StrToMeasurementunsigned(attrValue)); return true; } return false; }],
  ['page.height', (element, attrValue) => { if (element.HasAttClass(ATT_PAGES)) { const att = element; assertAtt(att); att.SetPageHeight(att.StrToMeasurementunsigned(attrValue)); return true; } return false; }],
  ['page.leftmar', (element, attrValue) => { if (element.HasAttClass(ATT_PAGES)) { const att = element; assertAtt(att); att.SetPageLeftmar(att.StrToMeasurementunsigned(attrValue)); return true; } return false; }],
  ['page.panels', (element, attrValue) => { if (element.HasAttClass(ATT_PAGES)) { const att = element; assertAtt(att); att.SetPagePanels(att.StrToStr(attrValue)); return true; } return false; }],
  ['page.rightmar', (element, attrValue) => { if (element.HasAttClass(ATT_PAGES)) { const att = element; assertAtt(att); att.SetPageRightmar(att.StrToMeasurementunsigned(attrValue)); return true; } return false; }],
  ['page.scale', (element, attrValue) => { if (element.HasAttClass(ATT_PAGES)) { const att = element; assertAtt(att); att.SetPageScale(att.StrToStr(attrValue)); return true; } return false; }],
  ['page.topmar', (element, attrValue) => { if (element.HasAttClass(ATT_PAGES)) { const att = element; assertAtt(att); att.SetPageTopmar(att.StrToMeasurementunsigned(attrValue)); return true; } return false; }],
  ['page.width', (element, attrValue) => { if (element.HasAttClass(ATT_PAGES)) { const att = element; assertAtt(att); att.SetPageWidth(att.StrToMeasurementunsigned(attrValue)); return true; } return false; }],
  ['part', (element, attrValue) => { if (element.HasAttClass(ATT_PARTIDENT)) { const att = resolveAttTimePoint(element); assertAtt(att); att.SetPart(att.StrToStr(attrValue)); return true; } return false; }],
  ['partstaff', (element, attrValue) => { if (element.HasAttClass(ATT_PARTIDENT)) { const att = resolveAttTimePoint(element); assertAtt(att); att.SetPartstaff(att.StrToStr(attrValue)); return true; } return false; }],
  ['place', (element, attrValue) => { if (element.HasAttClass(ATT_PLACEMENTRELEVENT)) { const att = element; assertAtt(att); att.SetPlace(att.StrToStaffrel(attrValue)); return true; } if (element.HasAttClass(ATT_PLACEMENTRELSTAFF)) { const att = resolveAttPlacementRelStaff(element); assertAtt(att); att.SetPlace(att.StrToStaffrel(attrValue)); return true; } return false; }],
  ['plist', (element, attrValue) => { if (element.HasAttClass(ATT_PLIST)) { const att = resolveAttPlist(element); assertAtt(att); att.SetPlist(att.StrToXsdAnyURIList(attrValue)); return true; } return false; }],
  ['ploc', (element, attrValue) => { if (element.HasAttClass(ATT_STAFFLOCPITCHED)) { const att = resolveAttPosition(element); assertAtt(att); att.SetPloc(att.StrToPitchname(attrValue)); return true; } return false; }],
  ['pname', (element, attrValue) => { if (element.HasAttClass(ATT_PITCH)) { const att = resolveAttPitch(element); assertAtt(att); att.SetPname(att.StrToPitchname(attrValue)); return true; } return false; }],
  ['precedes', (element, attrValue) => { if (element.HasAttClass(ATT_LINKING)) { const att = resolveAttLinking(element); assertAtt(att); att.SetPrecedes(att.StrToStr(attrValue)); return true; } return false; }],
  ['prev', (element, attrValue) => { if (element.HasAttClass(ATT_LINKING)) { const att = resolveAttLinking(element); assertAtt(att); att.SetPrev(att.StrToStr(attrValue)); return true; } return false; }],
  ['quantity', (element, attrValue) => { if (element.HasAttClass(ATT_QUANTITY)) { const att = element; assertAtt(att); att.SetQuantity(att.StrToDbl(attrValue)); return true; } return false; }],
  ['reh.dist', (element, attrValue) => { if (element.HasAttClass(ATT_DISTANCES)) { const att = element; assertAtt(att); att.SetRehDist(att.StrToMeasurementsigned(attrValue)); return true; } return false; }],
  ['rend', (element, attrValue) => { if (element.HasAttClass(ATT_TEXTRENDITION)) { const att = element; assertAtt(att); att.SetRend(att.StrToTextrendition(attrValue)); return true; } return false; }],
  ['resp', (element, attrValue) => { if (element.HasAttClass(ATT_RESPONSIBILITY)) { const att = element; assertAtt(att); att.SetResp(att.StrToStr(attrValue)); return true; } return false; }],
  ['role', (element, attrValue) => { if (element.HasAttClass(ATT_NAME)) { const att = element; assertAtt(att); att.SetRole(att.StrToRelators(attrValue)); return true; } return false; }],
  ['rotate', (element, attrValue) => { if (element.HasAttClass(ATT_COORDINATED)) { const att = element; assertAtt(att); att.SetRotate(att.StrToDegrees(attrValue)); return true; } return false; }],
  ['sameas', (element, attrValue) => { if (element.HasAttClass(ATT_LINKING)) { const att = resolveAttLinking(element); assertAtt(att); att.SetSameas(att.StrToStr(attrValue)); return true; } return false; }],
  ['scale', (element, attrValue) => { if (element.HasAttClass(ATT_SCALABLE)) { const att = element; assertAtt(att); att.SetScale(att.StrToPercent(attrValue)); return true; } return false; }],
  ['select', (element, attrValue) => { if (element.HasAttClass(ATT_DATASELECTING)) { const att = element; assertAtt(att); att.SetSelect(att.StrToStr(attrValue)); return true; } return false; }],
  ['seq', (element, attrValue) => { if (element.HasAttClass(ATT_SEQUENCE)) { const att = element; assertAtt(att); att.SetSeq(att.StrToInt(attrValue)); return true; } return false; }],
  ['shape', (element, attrValue) => { if (element.HasAttClass(ATT_CLEFSHAPE)) { const att = element; assertAtt(att); att.SetShape(att.StrToClefshape(attrValue)); return true; } return false; }],
  ['sig', (element, attrValue) => { if (element.HasAttClass(ATT_KEYSIGLOG)) { const att = element; assertAtt(att); att.SetSig(att.StrToKeysignature(attrValue)); return true; } return false; }],
  ['slash', (element, attrValue) => { if (element.HasAttClass(ATT_SLASHCOUNT)) { const att = element; assertAtt(att); att.SetSlash(att.StrToInt(attrValue)); return true; } return false; }],
  ['slur', (element, attrValue) => { if (element.HasAttClass(ATT_SLURPRESENT)) { const att = element; assertAtt(att); att.SetSlur(att.StrToStr(attrValue)); return true; } return false; }],
  ['source', (element, attrValue) => { if (element.HasAttClass(ATT_SOURCE)) { const att = element; assertAtt(att); att.SetSource(att.StrToStr(attrValue)); return true; } return false; }],
  ['spacing.packexp', (element, attrValue) => { if (element.HasAttClass(ATT_SPACING)) { const att = element; assertAtt(att); att.SetSpacingPackexp(att.StrToDbl(attrValue)); return true; } return false; }],
  ['spacing.packfact', (element, attrValue) => { if (element.HasAttClass(ATT_SPACING)) { const att = element; assertAtt(att); att.SetSpacingPackfact(att.StrToDbl(attrValue)); return true; } return false; }],
  ['spacing.staff', (element, attrValue) => { if (element.HasAttClass(ATT_SPACING)) { const att = element; assertAtt(att); att.SetSpacingStaff(att.StrToMeasurementsigned(attrValue)); return true; } return false; }],
  ['spacing.system', (element, attrValue) => { if (element.HasAttClass(ATT_SPACING)) { const att = element; assertAtt(att); att.SetSpacingSystem(att.StrToMeasurementsigned(attrValue)); return true; } return false; }],
  ['staff', (element, attrValue) => { if (element.HasAttClass(ATT_STAFFIDENT)) { const att = resolveAttStaffIdent(element); assertAtt(att); att.SetStaff(att.StrToXsdPositiveIntegerList(attrValue)); return true; } return false; }],
  ['startdate', (element, attrValue) => { if (element.HasAttClass(ATT_DATABLE)) { const att = element; assertAtt(att); att.SetStartdate(att.StrToStr(attrValue)); return true; } return false; }],
  ['startho', (element, attrValue) => { if (element.HasAttClass(ATT_VISUALOFFSET2HO)) { const att = resolveAttOffsetSpanning(element); assertAtt(att); att.SetStartho(att.StrToMeasurementsigned(attrValue)); return true; } return false; }],
  ['startid', (element, attrValue) => { if (element.HasAttClass(ATT_STARTID)) { const att = resolveAttTimePoint(element); assertAtt(att); att.SetStartid(att.StrToStr(attrValue)); return true; } return false; }],
  ['startto', (element, attrValue) => { if (element.HasAttClass(ATT_VISUALOFFSET2TO)) { const att = resolveAttOffsetSpanning(element); assertAtt(att); att.SetStartto(att.StrToDbl(attrValue)); return true; } return false; }],
  ['startvo', (element, attrValue) => { if (element.HasAttClass(ATT_VISUALOFFSET2VO)) { const att = resolveAttOffsetSpanning(element); assertAtt(att); att.SetStartvo(att.StrToMeasurementsigned(attrValue)); return true; } return false; }],
  ['status', (element, attrValue) => { if (element.HasAttClass(ATT_DOCSTATUS)) { const att = element; assertAtt(att); att.SetStatus(att.StrToStr(attrValue)); return true; } return false; }],
  ['stem.dir', (element, attrValue) => { if (element.HasAttClass(ATT_STEMS)) { const att = element; assertAtt(att); att.SetStemDir(att.StrToStemdirection(attrValue)); return true; } return false; }],
  ['stem.len', (element, attrValue) => { if (element.HasAttClass(ATT_STEMS)) { const att = element; assertAtt(att); att.SetStemLen(att.StrToDbl(attrValue)); return true; } return false; }],
  ['stem.mod', (element, attrValue) => { if (element.HasAttClass(ATT_STEMS)) { const att = element; assertAtt(att); att.SetStemMod(att.StrToStemmodifier(attrValue)); return true; } return false; }],
  ['stem.pos', (element, attrValue) => { if (element.HasAttClass(ATT_STEMS)) { const att = element; assertAtt(att); att.SetStemPos(att.StrToStemposition(attrValue)); return true; } return false; }],
  ['stem.sameas', (element, attrValue) => { if (element.HasAttClass(ATT_STEMS)) { const att = element; assertAtt(att); att.SetStemSameas(att.StrToStr(attrValue)); return true; } return false; }],
  ['stem.visible', (element, attrValue) => { if (element.HasAttClass(ATT_STEMS)) { const att = element; assertAtt(att); att.SetStemVisible(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['stem.x', (element, attrValue) => { if (element.HasAttClass(ATT_STEMS)) { const att = element; assertAtt(att); att.SetStemX(att.StrToDbl(attrValue)); return true; } return false; }],
  ['stem.y', (element, attrValue) => { if (element.HasAttClass(ATT_STEMS)) { const att = element; assertAtt(att); att.SetStemY(att.StrToDbl(attrValue)); return true; } return false; }],
  ['syl', (element, attrValue) => { if (element.HasAttClass(ATT_SYLTEXT)) { const att = element; assertAtt(att); att.SetSyl(att.StrToStr(attrValue)); return true; } return false; }],
  ['sym', (element, attrValue) => { if (element.HasAttClass(ATT_METERSIGLOG)) { const att = element; assertAtt(att); att.SetSym(att.StrToMetersign(attrValue)); return true; } return false; }],
  ['symbol', (element, attrValue) => { if (element.HasAttClass(ATT_STAFFGROUPINGSYM)) { const att = element; assertAtt(att); att.SetSymbol(att.StrToStaffGroupingSymSymbol(attrValue)); return true; } return false; }],
  ['synch', (element, attrValue) => { if (element.HasAttClass(ATT_LINKING)) { const att = resolveAttLinking(element); assertAtt(att); att.SetSynch(att.StrToStr(attrValue)); return true; } return false; }],
  ['system.leftline', (element, attrValue) => { if (element.HasAttClass(ATT_SYSTEMS)) { const att = element; assertAtt(att); att.SetSystemLeftline(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['system.leftmar', (element, attrValue) => { if (element.HasAttClass(ATT_SYSTEMS)) { const att = element; assertAtt(att); att.SetSystemLeftmar(att.StrToMeasurementunsigned(attrValue)); return true; } return false; }],
  ['system.rightmar', (element, attrValue) => { if (element.HasAttClass(ATT_SYSTEMS)) { const att = element; assertAtt(att); att.SetSystemRightmar(att.StrToMeasurementunsigned(attrValue)); return true; } return false; }],
  ['system.topmar', (element, attrValue) => { if (element.HasAttClass(ATT_SYSTEMS)) { const att = element; assertAtt(att); att.SetSystemTopmar(att.StrToMeasurementunsigned(attrValue)); return true; } return false; }],
  ['target', (element, attrValue) => { if (element.HasAttClass(ATT_ATTACCALOG)) { const att = element; assertAtt(att); att.SetTarget(att.StrToStr(attrValue)); return true; } if (element.HasAttClass(ATT_CUSTOSLOG)) { const att = element; assertAtt(att); att.SetTarget(att.StrToStr(attrValue)); return true; } if (element.HasAttClass(ATT_POINTING)) { const att = element; assertAtt(att); att.SetTarget(att.StrToStr(attrValue)); return true; } return false; }],
  ['targettype', (element, attrValue) => { if (element.HasAttClass(ATT_POINTING)) { const att = element; assertAtt(att); att.SetTargettype(att.StrToStr(attrValue)); return true; } return false; }],
  ['tempo.dist', (element, attrValue) => { if (element.HasAttClass(ATT_DISTANCES)) { const att = element; assertAtt(att); att.SetTempoDist(att.StrToMeasurementsigned(attrValue)); return true; } return false; }],
  ['text.fam', (element, attrValue) => { if (element.HasAttClass(ATT_TEXTSTYLE)) { const att = element; assertAtt(att); att.SetTextFam(att.StrToStr(attrValue)); return true; } return false; }],
  ['text.name', (element, attrValue) => { if (element.HasAttClass(ATT_TEXTSTYLE)) { const att = element; assertAtt(att); att.SetTextName(att.StrToStr(attrValue)); return true; } return false; }],
  ['text.size', (element, attrValue) => { if (element.HasAttClass(ATT_TEXTSTYLE)) { const att = element; assertAtt(att); att.SetTextSize(att.StrToFontsize(attrValue)); return true; } return false; }],
  ['text.style', (element, attrValue) => { if (element.HasAttClass(ATT_TEXTSTYLE)) { const att = element; assertAtt(att); att.SetTextStyle(att.StrToFontstyle(attrValue)); return true; } return false; }],
  ['text.weight', (element, attrValue) => { if (element.HasAttClass(ATT_TEXTSTYLE)) { const att = element; assertAtt(att); att.SetTextWeight(att.StrToFontweight(attrValue)); return true; } return false; }],
  ['tie', (element, attrValue) => { if (element.HasAttClass(ATT_TIEPRESENT)) { const att = element; assertAtt(att); att.SetTie(att.StrToTie(attrValue)); return true; } return false; }],
  ['to', (element, attrValue) => { if (element.HasAttClass(ATT_VISUALOFFSETTO)) { const att = resolveAttOffset(element); assertAtt(att); att.SetTo(att.StrToDbl(attrValue)); return true; } return false; }],
  ['trans.diat', (element, attrValue) => { if (element.HasAttClass(ATT_TRANSPOSITION)) { const att = element; assertAtt(att); att.SetTransDiat(att.StrToInt(attrValue)); return true; } return false; }],
  ['trans.semi', (element, attrValue) => { if (element.HasAttClass(ATT_TRANSPOSITION)) { const att = element; assertAtt(att); att.SetTransSemi(att.StrToInt(attrValue)); return true; } return false; }],
  ['translit', (element, attrValue) => { if (element.HasAttClass(ATT_LANG)) { const att = element; assertAtt(att); att.SetTranslit(att.StrToStr(attrValue)); return true; } return false; }],
  ['tstamp', (element, attrValue) => { if (element.HasAttClass(ATT_TIMESTAMPLOG)) { const att = resolveAttTimePoint(element); assertAtt(att); att.SetTstamp(att.StrToDbl(attrValue)); return true; } return false; }],
  ['tstamp2', (element, attrValue) => { if (element.HasAttClass(ATT_TIMESTAMP2LOG)) { const att = resolveAttTimeSpanning(element); assertAtt(att); att.SetTstamp2(att.StrToMeasurebeat(attrValue)); return true; } return false; }],
  ['tune.Hz', (element, attrValue) => { if (element.HasAttClass(ATT_TUNING)) { const att = element; assertAtt(att); att.SetTuneHz(att.StrToDbl(attrValue)); return true; } return false; }],
  ['tune.pname', (element, attrValue) => { if (element.HasAttClass(ATT_TUNING)) { const att = element; assertAtt(att); att.SetTunePname(att.StrToPitchname(attrValue)); return true; } return false; }],
  ['tune.temper', (element, attrValue) => { if (element.HasAttClass(ATT_TUNING)) { const att = element; assertAtt(att); att.SetTuneTemper(att.StrToTemperament(attrValue)); return true; } return false; }],
  ['tuning.standard', (element, attrValue) => { if (element.HasAttClass(ATT_TUNINGLOG)) { const att = element; assertAtt(att); att.SetTuningStandard(att.StrToCoursetuning(attrValue)); return true; } return false; }],
  ['tuplet', (element, attrValue) => { if (element.HasAttClass(ATT_TUPLETPRESENT)) { const att = element; assertAtt(att); att.SetTuplet(att.StrToStr(attrValue)); return true; } return false; }],
  ['type', (element, attrValue) => { if (element.HasAttClass(ATT_TYPED)) { const att = element; assertAtt(att); att.SetType(att.StrToStr(attrValue)); return true; } return false; }],
  ['ulx', (element, attrValue) => { if (element.HasAttClass(ATT_COORDINATEDUL)) { const att = element; assertAtt(att); att.SetUlx(att.StrToInt(attrValue)); return true; } return false; }],
  ['uly', (element, attrValue) => { if (element.HasAttClass(ATT_COORDINATEDUL)) { const att = element; assertAtt(att); att.SetUly(att.StrToInt(attrValue)); return true; } return false; }],
  ['unit', (element, attrValue) => { if (element.HasAttClass(ATT_MEASUREMENT)) { const att = element; assertAtt(att); att.SetUnit(att.StrToStr(attrValue)); return true; } if (element.HasAttClass(ATT_METERSIGLOG)) { const att = element; assertAtt(att); att.SetUnit(att.StrToInt(attrValue)); return true; } return false; }],
  ['valign', (element, attrValue) => { if (element.HasAttClass(ATT_VERTICALALIGN)) { const att = resolveAttAreaPos(element); assertAtt(att); att.SetValign(att.StrToVerticalalignment(attrValue)); return true; } return false; }],
  ['vgrp', (element, attrValue) => { if (element.HasAttClass(ATT_VERTICALGROUP)) { const att = element; assertAtt(att); att.SetVgrp(att.StrToInt(attrValue)); return true; } return false; }],
  ['visible', (element, attrValue) => { if (element.HasAttClass(ATT_VISIBILITY)) { const att = element; assertAtt(att); att.SetVisible(att.StrToBoolean(attrValue)); return true; } return false; }],
  ['vo', (element, attrValue) => { if (element.HasAttClass(ATT_VISUALOFFSETVO)) { const att = resolveAttOffset(element); assertAtt(att); att.SetVo(att.StrToMeasurementsigned(attrValue)); return true; } return false; }],
  ['voltasym', (element, attrValue) => { if (element.HasAttClass(ATT_VOLTAGROUPINGSYM)) { const att = element; assertAtt(att); att.SetVoltasym(att.StrToVoltaGroupingSymVoltasym(attrValue)); return true; } return false; }],
  ['width', (element, attrValue) => { if (element.HasAttClass(ATT_WIDTH)) { const att = element; assertAtt(att); att.SetWidth(att.StrToMeasurementunsigned(attrValue)); return true; } return false; }],
  ['wordpos', (element, attrValue) => { if (element.HasAttClass(ATT_SYLLOG)) { const att = element; assertAtt(att); att.SetWordpos(att.StrToSylLogWordpos(attrValue)); return true; } return false; }],
  ['x', (element, attrValue) => { if (element.HasAttClass(ATT_XY)) { const att = element; assertAtt(att); att.SetX(att.StrToDbl(attrValue)); return true; } return false; }],
  ['x2', (element, attrValue) => { if (element.HasAttClass(ATT_XY2)) { const att = element; assertAtt(att); att.SetX2(att.StrToDbl(attrValue)); return true; } return false; }],
  ['xlink:actuate', (element, attrValue) => { if (element.HasAttClass(ATT_POINTING)) { const att = element; assertAtt(att); att.SetActuate(att.StrToStr(attrValue)); return true; } return false; }],
  ['xlink:role', (element, attrValue) => { if (element.HasAttClass(ATT_POINTING)) { const att = element; assertAtt(att); att.SetRole(att.StrToStr(attrValue)); return true; } return false; }],
  ['xlink:show', (element, attrValue) => { if (element.HasAttClass(ATT_POINTING)) { const att = element; assertAtt(att); att.SetShow(att.StrToStr(attrValue)); return true; } return false; }],
  ['xml:base', (element, attrValue) => { if (element.HasAttClass(ATT_BASIC)) { const att = element; assertAtt(att); att.SetBase(att.StrToStr(attrValue)); return true; } return false; }],
  ['xml:lang', (element, attrValue) => { if (element.HasAttClass(ATT_LANG)) { const att = element; assertAtt(att); att.SetLang(att.StrToStr(attrValue)); return true; } return false; }],
  ['xml:space', (element, attrValue) => { if (element.HasAttClass(ATT_WHITESPACE)) { const att = element; assertAtt(att); att.SetSpace(att.StrToStr(attrValue)); return true; } return false; }],
  ['y', (element, attrValue) => { if (element.HasAttClass(ATT_XY)) { const att = element; assertAtt(att); att.SetY(att.StrToDbl(attrValue)); return true; } return false; }],
  ['y2', (element, attrValue) => { if (element.HasAttClass(ATT_XY2)) { const att = element; assertAtt(att); att.SetY2(att.StrToDbl(attrValue)); return true; } return false; }],
]);

// ponytail: per-attr fast dispatch for legacySetShared (Q12).
// Generated verbatim from the 149 HasAttClass blocks below: same class
// order (first match wins), same stmts. Map probe replaces the
// 149-deep chain for attrs that miss SHARED_SET_HANDLERS.
const LEGACY_SET_HANDLERS = new Map<string, (element: AttModuleElementLike, attrValue: string) => boolean>([
  ["accid", (element, attrValue) => {
    if (element.HasAttClass(ATT_ACCIDENTAL)) {
              const att = element;
      assertAtt(att);
      att.SetAccid(att.StrToAccidentalWritten(attrValue));
      return true;
    }
    return false;
  }],
  ["dots", (element, attrValue) => {
    if (element.HasAttClass(ATT_AUGMENTDOTS)) {
              const att = resolveAttDuration(element);
      assertAtt(att);
      att.SetDots(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["codedval", (element, attrValue) => {
    if (element.HasAttClass(ATT_CANONICAL)) {
              const att = element;
      assertAtt(att);
      att.SetCodedval(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["bezier", (element, attrValue) => {
    if (element.HasAttClass(ATT_CURVATURE)) {
              const att = element;
      assertAtt(att);
      att.SetBezier(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["bulge", (element, attrValue) => {
    if (element.HasAttClass(ATT_CURVATURE)) {
              const att = element;
      assertAtt(att);
      att.SetBulge(att.StrToBulge(attrValue));
      return true;
    }
    return false;
  }],
  ["curvedir", (element, attrValue) => {
    if (element.HasAttClass(ATT_CURVATURE)) {
              const att = element;
      assertAtt(att);
      att.SetCurvedir(att.StrToCurvatureCurvedir(attrValue));
      return true;
    }
    return false;
  }],
  ["dur", (element, attrValue) => {
    if (element.HasAttClass(ATT_DURATIONADDITIVE)) {
              const att = element;
      assertAtt(att);
      att.SetDur(att.StrToDuration(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_DURATIONLOG)) {
              const att = resolveAttDuration(element);
      assertAtt(att);
      att.SetDur(att.StrToDuration(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_RESTDURATIONLOG)) {
              const att = element;
      assertAtt(att);
      att.SetDur(att.StrToDuration(attrValue));
      return true;
    }
    return false;
  }],
  ["n", (element, attrValue) => {
    if (element.HasAttClass(ATT_NINTEGER)) {
              const att = element;
      assertAtt(att);
      att.SetN(att.StrToInt(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_NNUMBERLIKE)) {
              const att = element;
      assertAtt(att);
      att.SetN(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["oct", (element, attrValue) => {
    if (element.HasAttClass(ATT_OCTAVE)) {
              const att = resolveAttPitch(element);
      assertAtt(att);
      att.SetOct(att.StrToOctave(attrValue));
      return true;
    }
    return false;
  }],
  ["pname", (element, attrValue) => {
    if (element.HasAttClass(ATT_PITCH)) {
              const att = resolveAttPitch(element);
      assertAtt(att);
      att.SetPname(att.StrToPitchname(attrValue));
      return true;
    }
    return false;
  }],
  ["place", (element, attrValue) => {
    if (element.HasAttClass(ATT_PLACEMENTRELEVENT)) {
              const att = element;
      assertAtt(att);
      att.SetPlace(att.StrToStaffrel(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_PLACEMENTRELSTAFF)) {
              const att = resolveAttPlacementRelStaff(element);
      assertAtt(att);
      att.SetPlace(att.StrToStaffrel(attrValue));
      return true;
    }
    return false;
  }],
  ["staff", (element, attrValue) => {
    if (element.HasAttClass(ATT_STAFFIDENT)) {
              const att = resolveAttStaffIdent(element);
      assertAtt(att);
      att.SetStaff(att.StrToXsdPositiveIntegerList(attrValue));
      return true;
    }
    return false;
  }],
  ["endid", (element, attrValue) => {
    if (element.HasAttClass(ATT_STARTENDID)) {
              const att = resolveAttTimeSpanning(element);
      assertAtt(att);
      att.SetEndid(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["startid", (element, attrValue) => {
    if (element.HasAttClass(ATT_STARTID)) {
              const att = resolveAttTimePoint(element);
      assertAtt(att);
      att.SetStartid(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["stem.dir", (element, attrValue) => {
    if (element.HasAttClass(ATT_STEMS)) {
              const att = element;
      assertAtt(att);
      att.SetStemDir(att.StrToStemdirection(attrValue));
      return true;
    }
    return false;
  }],
  ["stem.len", (element, attrValue) => {
    if (element.HasAttClass(ATT_STEMS)) {
              const att = element;
      assertAtt(att);
      att.SetStemLen(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["stem.mod", (element, attrValue) => {
    if (element.HasAttClass(ATT_STEMS)) {
              const att = element;
      assertAtt(att);
      att.SetStemMod(att.StrToStemmodifier(attrValue));
      return true;
    }
    return false;
  }],
  ["stem.pos", (element, attrValue) => {
    if (element.HasAttClass(ATT_STEMS)) {
              const att = element;
      assertAtt(att);
      att.SetStemPos(att.StrToStemposition(attrValue));
      return true;
    }
    return false;
  }],
  ["stem.sameas", (element, attrValue) => {
    if (element.HasAttClass(ATT_STEMS)) {
              const att = element;
      assertAtt(att);
      att.SetStemSameas(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["stem.visible", (element, attrValue) => {
    if (element.HasAttClass(ATT_STEMS)) {
              const att = element;
      assertAtt(att);
      att.SetStemVisible(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["stem.x", (element, attrValue) => {
    if (element.HasAttClass(ATT_STEMS)) {
              const att = element;
      assertAtt(att);
      att.SetStemX(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["stem.y", (element, attrValue) => {
    if (element.HasAttClass(ATT_STEMS)) {
              const att = element;
      assertAtt(att);
      att.SetStemY(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["tstamp", (element, attrValue) => {
    if (element.HasAttClass(ATT_TIMESTAMPLOG)) {
              const att = resolveAttTimePoint(element);
      assertAtt(att);
      att.SetTstamp(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["tstamp2", (element, attrValue) => {
    if (element.HasAttClass(ATT_TIMESTAMP2LOG)) {
              const att = resolveAttTimeSpanning(element);
      assertAtt(att);
      att.SetTstamp2(att.StrToMeasurebeat(attrValue));
      return true;
    }
    return false;
  }],
  ["fontfam", (element, attrValue) => {
    if (element.HasAttClass(ATT_TYPOGRAPHY)) {
              const att = element;
      assertAtt(att);
      att.SetFontfam(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["fontname", (element, attrValue) => {
    if (element.HasAttClass(ATT_TYPOGRAPHY)) {
              const att = element;
      assertAtt(att);
      att.SetFontname(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["fontsize", (element, attrValue) => {
    if (element.HasAttClass(ATT_TYPOGRAPHY)) {
              const att = element;
      assertAtt(att);
      att.SetFontsize(att.StrToFontsize(attrValue));
      return true;
    }
    return false;
  }],
  ["fontstyle", (element, attrValue) => {
    if (element.HasAttClass(ATT_TYPOGRAPHY)) {
              const att = element;
      assertAtt(att);
      att.SetFontstyle(att.StrToFontstyle(attrValue));
      return true;
    }
    return false;
  }],
  ["fontweight", (element, attrValue) => {
    if (element.HasAttClass(ATT_TYPOGRAPHY)) {
              const att = element;
      assertAtt(att);
      att.SetFontweight(att.StrToFontweight(attrValue));
      return true;
    }
    return false;
  }],
  ["letterspacing", (element, attrValue) => {
    if (element.HasAttClass(ATT_TYPOGRAPHY)) {
              const att = element;
      assertAtt(att);
      att.SetLetterspacing(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["lineheight", (element, attrValue) => {
    if (element.HasAttClass(ATT_TYPOGRAPHY)) {
              const att = element;
      assertAtt(att);
      att.SetLineheight(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["func", (element, attrValue) => {
    if (element.HasAttClass(ATT_ACCIDLOG)) {
              const att = element;
      assertAtt(att);
      att.SetFunc(att.StrToAccidLogFunc(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_ANNOTLOG)) {
              const att = element;
      assertAtt(att);
      att.SetFunc(att.StrToStr(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_FORMEWORK)) {
              const att = element;
      assertAtt(att);
      att.SetFunc(att.StrToPgfunc(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_REPEATMARKLOG)) {
              const att = element;
      assertAtt(att);
      att.SetFunc(att.StrToRepeatMarkLogFunc(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_TEMPOLOG)) {
              const att = element;
      assertAtt(att);
      att.SetFunc(att.StrToTempoLogFunc(attrValue));
      return true;
    }
    return false;
  }],
  ["artic", (element, attrValue) => {
    if (element.HasAttClass(ATT_ARTICULATION)) {
              const att = element;
      assertAtt(att);
      att.SetArtic(att.StrToArticulationList(attrValue));
      return true;
    }
    return false;
  }],
  ["target", (element, attrValue) => {
    if (element.HasAttClass(ATT_ATTACCALOG)) {
              const att = element;
      assertAtt(att);
      att.SetTarget(att.StrToStr(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_CUSTOSLOG)) {
              const att = element;
      assertAtt(att);
      att.SetTarget(att.StrToStr(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_POINTING)) {
              const att = element;
      assertAtt(att);
      att.SetTarget(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["audience", (element, attrValue) => {
    if (element.HasAttClass(ATT_AUDIENCE)) {
              const att = element;
      assertAtt(att);
      att.SetAudience(att.StrToAudienceAudience(attrValue));
      return true;
    }
    return false;
  }],
  ["auth", (element, attrValue) => {
    if (element.HasAttClass(ATT_AUTHORIZED)) {
              const att = element;
      assertAtt(att);
      att.SetAuth(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["auth.uri", (element, attrValue) => {
    if (element.HasAttClass(ATT_AUTHORIZED)) {
              const att = element;
      assertAtt(att);
      att.SetAuthUri(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["form", (element, attrValue) => {
    if (element.HasAttClass(ATT_BARLINELOG)) {
              const att = element;
      assertAtt(att);
      att.SetForm(att.StrToBarrendition(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_DOTLOG)) {
              const att = element;
      assertAtt(att);
      att.SetForm(att.StrToDotLogForm(attrValue));
      return true;
    }
    return false;
  }],
  ["bar.len", (element, attrValue) => {
    if (element.HasAttClass(ATT_BARRING)) {
              const att = element;
      assertAtt(att);
      att.SetBarLen(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["bar.method", (element, attrValue) => {
    if (element.HasAttClass(ATT_BARRING)) {
              const att = element;
      assertAtt(att);
      att.SetBarMethod(att.StrToBarmethod(attrValue));
      return true;
    }
    return false;
  }],
  ["bar.place", (element, attrValue) => {
    if (element.HasAttClass(ATT_BARRING)) {
              const att = element;
      assertAtt(att);
      att.SetBarPlace(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["xml:base", (element, attrValue) => {
    if (element.HasAttClass(ATT_BASIC)) {
              const att = element;
      assertAtt(att);
      att.SetBase(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["analog", (element, attrValue) => {
    if (element.HasAttClass(ATT_BIBL)) {
              const att = element;
      assertAtt(att);
      att.SetAnalog(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["calendar", (element, attrValue) => {
    if (element.HasAttClass(ATT_CALENDARED)) {
              const att = element;
      assertAtt(att);
      att.SetCalendar(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["class", (element, attrValue) => {
    if (element.HasAttClass(ATT_CLASSED)) {
              const att = element;
      assertAtt(att);
      att.SetClass(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["cautionary", (element, attrValue) => {
    if (element.HasAttClass(ATT_CLEFLOG)) {
              const att = element;
      assertAtt(att);
      att.SetCautionary(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["shape", (element, attrValue) => {
    if (element.HasAttClass(ATT_CLEFSHAPE)) {
              const att = element;
      assertAtt(att);
      att.SetShape(att.StrToClefshape(attrValue));
      return true;
    }
    return false;
  }],
  ["clef.shape", (element, attrValue) => {
    if (element.HasAttClass(ATT_CLEFFINGLOG)) {
              const att = element;
      assertAtt(att);
      att.SetClefShape(att.StrToClefshape(attrValue));
      return true;
    }
    return false;
  }],
  ["clef.line", (element, attrValue) => {
    if (element.HasAttClass(ATT_CLEFFINGLOG)) {
              const att = element;
      assertAtt(att);
      att.SetClefLine(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["clef.dis", (element, attrValue) => {
    if (element.HasAttClass(ATT_CLEFFINGLOG)) {
              const att = element;
      assertAtt(att);
      att.SetClefDis(att.StrToOctaveDis(attrValue));
      return true;
    }
    return false;
  }],
  ["clef.dis.place", (element, attrValue) => {
    if (element.HasAttClass(ATT_CLEFFINGLOG)) {
              const att = element;
      assertAtt(att);
      att.SetClefDisPlace(att.StrToStaffrelBasic(attrValue));
      return true;
    }
    return false;
  }],
  ["color", (element, attrValue) => {
    if (element.HasAttClass(ATT_COLOR)) {
              const att = element;
      assertAtt(att);
      att.SetColor(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["colored", (element, attrValue) => {
    if (element.HasAttClass(ATT_COLORATION)) {
              const att = element;
      assertAtt(att);
      att.SetColored(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["coord.x1", (element, attrValue) => {
    if (element.HasAttClass(ATT_COORDX1)) {
              const att = element;
      assertAtt(att);
      att.SetCoordX1(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["coord.x2", (element, attrValue) => {
    if (element.HasAttClass(ATT_COORDX2)) {
              const att = element;
      assertAtt(att);
      att.SetCoordX2(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["coord.y1", (element, attrValue) => {
    if (element.HasAttClass(ATT_COORDY1)) {
              const att = element;
      assertAtt(att);
      att.SetCoordY1(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["lrx", (element, attrValue) => {
    if (element.HasAttClass(ATT_COORDINATED)) {
              const att = element;
      assertAtt(att);
      att.SetLrx(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["lry", (element, attrValue) => {
    if (element.HasAttClass(ATT_COORDINATED)) {
              const att = element;
      assertAtt(att);
      att.SetLry(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["rotate", (element, attrValue) => {
    if (element.HasAttClass(ATT_COORDINATED)) {
              const att = element;
      assertAtt(att);
      att.SetRotate(att.StrToDegrees(attrValue));
      return true;
    }
    return false;
  }],
  ["ulx", (element, attrValue) => {
    if (element.HasAttClass(ATT_COORDINATEDUL)) {
              const att = element;
      assertAtt(att);
      att.SetUlx(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["uly", (element, attrValue) => {
    if (element.HasAttClass(ATT_COORDINATEDUL)) {
              const att = element;
      assertAtt(att);
      att.SetUly(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["cue", (element, attrValue) => {
    if (element.HasAttClass(ATT_CUE)) {
              const att = element;
      assertAtt(att);
      att.SetCue(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["data", (element, attrValue) => {
    if (element.HasAttClass(ATT_DATAPOINTING)) {
              const att = element;
      assertAtt(att);
      att.SetData(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["select", (element, attrValue) => {
    if (element.HasAttClass(ATT_DATASELECTING)) {
              const att = element;
      assertAtt(att);
      att.SetSelect(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["enddate", (element, attrValue) => {
    if (element.HasAttClass(ATT_DATABLE)) {
              const att = element;
      assertAtt(att);
      att.SetEnddate(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["isodate", (element, attrValue) => {
    if (element.HasAttClass(ATT_DATABLE)) {
              const att = element;
      assertAtt(att);
      att.SetIsodate(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["notafter", (element, attrValue) => {
    if (element.HasAttClass(ATT_DATABLE)) {
              const att = element;
      assertAtt(att);
      att.SetNotafter(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["notbefore", (element, attrValue) => {
    if (element.HasAttClass(ATT_DATABLE)) {
              const att = element;
      assertAtt(att);
      att.SetNotbefore(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["startdate", (element, attrValue) => {
    if (element.HasAttClass(ATT_DATABLE)) {
              const att = element;
      assertAtt(att);
      att.SetStartdate(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["dir.dist", (element, attrValue) => {
    if (element.HasAttClass(ATT_DISTANCES)) {
              const att = element;
      assertAtt(att);
      att.SetDirDist(att.StrToMeasurementsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["dynam.dist", (element, attrValue) => {
    if (element.HasAttClass(ATT_DISTANCES)) {
              const att = element;
      assertAtt(att);
      att.SetDynamDist(att.StrToMeasurementsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["harm.dist", (element, attrValue) => {
    if (element.HasAttClass(ATT_DISTANCES)) {
              const att = element;
      assertAtt(att);
      att.SetHarmDist(att.StrToMeasurementsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["reh.dist", (element, attrValue) => {
    if (element.HasAttClass(ATT_DISTANCES)) {
              const att = element;
      assertAtt(att);
      att.SetRehDist(att.StrToMeasurementsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["tempo.dist", (element, attrValue) => {
    if (element.HasAttClass(ATT_DISTANCES)) {
              const att = element;
      assertAtt(att);
      att.SetTempoDist(att.StrToMeasurementsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["status", (element, attrValue) => {
    if (element.HasAttClass(ATT_DOCSTATUS)) {
              const att = element;
      assertAtt(att);
      att.SetStatus(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["dur.default", (element, attrValue) => {
    if (element.HasAttClass(ATT_DURATIONDEFAULT)) {
              const att = element;
      assertAtt(att);
      att.SetDurDefault(att.StrToDuration(attrValue));
      return true;
    }
    return false;
  }],
  ["num.default", (element, attrValue) => {
    if (element.HasAttClass(ATT_DURATIONDEFAULT)) {
              const att = element;
      assertAtt(att);
      att.SetNumDefault(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["numbase.default", (element, attrValue) => {
    if (element.HasAttClass(ATT_DURATIONDEFAULT)) {
              const att = element;
      assertAtt(att);
      att.SetNumbaseDefault(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["num", (element, attrValue) => {
    if (element.HasAttClass(ATT_DURATIONRATIO)) {
              const att = resolveAttDuration(element);
      assertAtt(att);
      att.SetNum(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["numbase", (element, attrValue) => {
    if (element.HasAttClass(ATT_DURATIONRATIO)) {
              const att = resolveAttDuration(element);
      assertAtt(att);
      att.SetNumbase(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["enclose", (element, attrValue) => {
    if (element.HasAttClass(ATT_ENCLOSINGCHARS)) {
              const att = element;
      assertAtt(att);
      att.SetEnclose(att.StrToEnclosure(attrValue));
      return true;
    }
    return false;
  }],
  ["ending.rend", (element, attrValue) => {
    if (element.HasAttClass(ATT_ENDINGS)) {
              const att = element;
      assertAtt(att);
      att.SetEndingRend(att.StrToEndingsEndingrend(attrValue));
      return true;
    }
    return false;
  }],
  ["cert", (element, attrValue) => {
    if (element.HasAttClass(ATT_EVIDENCE)) {
              const att = element;
      assertAtt(att);
      att.SetCert(att.StrToCertainty(attrValue));
      return true;
    }
    return false;
  }],
  ["evidence", (element, attrValue) => {
    if (element.HasAttClass(ATT_EVIDENCE)) {
              const att = element;
      assertAtt(att);
      att.SetEvidence(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["extender", (element, attrValue) => {
    if (element.HasAttClass(ATT_EXTENDER)) {
              const att = element;
      assertAtt(att);
      att.SetExtender(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["extent", (element, attrValue) => {
    if (element.HasAttClass(ATT_EXTENT)) {
              const att = element;
      assertAtt(att);
      att.SetExtent(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["fermata", (element, attrValue) => {
    if (element.HasAttClass(ATT_FERMATAPRESENT)) {
              const att = resolveAttDuration(element);
      assertAtt(att);
      att.SetFermata(att.StrToStaffrelBasic(attrValue));
      return true;
    }
    return false;
  }],
  ["nonfiling", (element, attrValue) => {
    if (element.HasAttClass(ATT_FILING)) {
              const att = element;
      assertAtt(att);
      att.SetNonfiling(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["level", (element, attrValue) => {
    if (element.HasAttClass(ATT_GRPSYMLOG)) {
              const att = element;
      assertAtt(att);
      att.SetLevel(att.StrToInt(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_MENSURLOG)) {
              const att = element;
      assertAtt(att);
      att.SetLevel(att.StrToDuration(attrValue));
      return true;
    }
    return false;
  }],
  ["hand", (element, attrValue) => {
    if (element.HasAttClass(ATT_HANDIDENT)) {
              const att = element;
      assertAtt(att);
      att.SetHand(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["height", (element, attrValue) => {
    if (element.HasAttClass(ATT_HEIGHT)) {
              const att = element;
      assertAtt(att);
      att.SetHeight(att.StrToMeasurementunsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["halign", (element, attrValue) => {
    if (element.HasAttClass(ATT_HORIZONTALALIGN)) {
              const att = resolveAttAreaPos(element);
      assertAtt(att);
      att.SetHalign(att.StrToHorizontalalignment(attrValue));
      return true;
    }
    return false;
  }],
  ["mimetype", (element, attrValue) => {
    if (element.HasAttClass(ATT_INTERNETMEDIA)) {
              const att = element;
      assertAtt(att);
      att.SetMimetype(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["join", (element, attrValue) => {
    if (element.HasAttClass(ATT_JOINED)) {
              const att = element;
      assertAtt(att);
      att.SetJoin(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["sig", (element, attrValue) => {
    if (element.HasAttClass(ATT_KEYSIGLOG)) {
              const att = element;
      assertAtt(att);
      att.SetSig(att.StrToKeysignature(attrValue));
      return true;
    }
    return false;
  }],
  ["keysig", (element, attrValue) => {
    if (element.HasAttClass(ATT_KEYSIGDEFAULTLOG)) {
              const att = element;
      assertAtt(att);
      att.SetKeysig(att.StrToKeysignature(attrValue));
      return true;
    }
    return false;
  }],
  ["label", (element, attrValue) => {
    if (element.HasAttClass(ATT_LABELLED)) {
              const att = resolveAttLabelled(element);
      assertAtt(att);
      att.SetLabel(att.StrToStr ? att.StrToStr(attrValue) : attrValue);
      return true;
    }
    return false;
  }],
  ["xml:lang", (element, attrValue) => {
    if (element.HasAttClass(ATT_LANG)) {
              const att = element;
      assertAtt(att);
      att.SetLang(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["translit", (element, attrValue) => {
    if (element.HasAttClass(ATT_LANG)) {
              const att = element;
      assertAtt(att);
      att.SetTranslit(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["def", (element, attrValue) => {
    if (element.HasAttClass(ATT_LAYERLOG)) {
              const att = element;
      assertAtt(att);
      att.SetDef(att.StrToStr(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_STAFFLOG)) {
              const att = element;
      assertAtt(att);
      att.SetDef(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["layer", (element, attrValue) => {
    if (element.HasAttClass(ATT_LAYERIDENT)) {
              const att = element;
      assertAtt(att);
      att.SetLayer(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["line", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINELOC)) {
              const att = element;
      assertAtt(att);
      att.SetLine(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["lendsym", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINEREND)) {
              const att = element;
      assertAtt(att);
      att.SetLendsym(att.StrToLinestartendsymbol(attrValue));
      return true;
    }
    return false;
  }],
  ["lendsym.size", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINEREND)) {
              const att = element;
      assertAtt(att);
      att.SetLendsymSize(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["lstartsym", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINEREND)) {
              const att = element;
      assertAtt(att);
      att.SetLstartsym(att.StrToLinestartendsymbol(attrValue));
      return true;
    }
    return false;
  }],
  ["lstartsym.size", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINEREND)) {
              const att = element;
      assertAtt(att);
      att.SetLstartsymSize(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["lform", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINERENDBASE)) {
              const att = element;
      assertAtt(att);
      att.SetLform(att.StrToLineform(attrValue));
      return true;
    }
    return false;
  }],
  ["lwidth", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINERENDBASE)) {
              const att = element;
      assertAtt(att);
      att.SetLwidth(att.StrToLinewidth(attrValue));
      return true;
    }
    return false;
  }],
  ["lsegs", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINERENDBASE)) {
              const att = element;
      assertAtt(att);
      att.SetLsegs(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["copyof", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINKING)) {
              const att = resolveAttLinking(element);
      assertAtt(att);
      att.SetCopyof(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["corresp", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINKING)) {
              const att = resolveAttLinking(element);
      assertAtt(att);
      att.SetCorresp(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["follows", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINKING)) {
              const att = resolveAttLinking(element);
      assertAtt(att);
      att.SetFollows(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["next", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINKING)) {
              const att = resolveAttLinking(element);
      assertAtt(att);
      att.SetNext(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["precedes", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINKING)) {
              const att = resolveAttLinking(element);
      assertAtt(att);
      att.SetPrecedes(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["prev", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINKING)) {
              const att = resolveAttLinking(element);
      assertAtt(att);
      att.SetPrev(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["sameas", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINKING)) {
              const att = resolveAttLinking(element);
      assertAtt(att);
      att.SetSameas(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["synch", (element, attrValue) => {
    if (element.HasAttClass(ATT_LINKING)) {
              const att = resolveAttLinking(element);
      assertAtt(att);
      att.SetSynch(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["lyric.align", (element, attrValue) => {
    if (element.HasAttClass(ATT_LYRICSTYLE)) {
              const att = element;
      assertAtt(att);
      att.SetLyricAlign(att.StrToMeasurementsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["lyric.fam", (element, attrValue) => {
    if (element.HasAttClass(ATT_LYRICSTYLE)) {
              const att = element;
      assertAtt(att);
      att.SetLyricFam(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["lyric.name", (element, attrValue) => {
    if (element.HasAttClass(ATT_LYRICSTYLE)) {
              const att = element;
      assertAtt(att);
      att.SetLyricName(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["lyric.size", (element, attrValue) => {
    if (element.HasAttClass(ATT_LYRICSTYLE)) {
              const att = element;
      assertAtt(att);
      att.SetLyricSize(att.StrToFontsize(attrValue));
      return true;
    }
    return false;
  }],
  ["lyric.style", (element, attrValue) => {
    if (element.HasAttClass(ATT_LYRICSTYLE)) {
              const att = element;
      assertAtt(att);
      att.SetLyricStyle(att.StrToFontstyle(attrValue));
      return true;
    }
    return false;
  }],
  ["lyric.weight", (element, attrValue) => {
    if (element.HasAttClass(ATT_LYRICSTYLE)) {
              const att = element;
      assertAtt(att);
      att.SetLyricWeight(att.StrToFontweight(attrValue));
      return true;
    }
    return false;
  }],
  ["mnum.visible", (element, attrValue) => {
    if (element.HasAttClass(ATT_MEASURENUMBERS)) {
              const att = element;
      assertAtt(att);
      att.SetMnumVisible(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["unit", (element, attrValue) => {
    if (element.HasAttClass(ATT_MEASUREMENT)) {
              const att = element;
      assertAtt(att);
      att.SetUnit(att.StrToStr(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_METERSIGLOG)) {
              const att = element;
      assertAtt(att);
      att.SetUnit(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["begin", (element, attrValue) => {
    if (element.HasAttClass(ATT_MEDIABOUNDS)) {
              const att = element;
      assertAtt(att);
      att.SetBegin(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["end", (element, attrValue) => {
    if (element.HasAttClass(ATT_MEDIABOUNDS)) {
              const att = element;
      assertAtt(att);
      att.SetEnd(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["betype", (element, attrValue) => {
    if (element.HasAttClass(ATT_MEDIABOUNDS)) {
              const att = element;
      assertAtt(att);
      att.SetBetype(att.StrToBetype(attrValue));
      return true;
    }
    return false;
  }],
  ["medium", (element, attrValue) => {
    if (element.HasAttClass(ATT_MEDIUM)) {
              const att = element;
      assertAtt(att);
      att.SetMedium(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["meiversion", (element, attrValue) => {
    if (element.HasAttClass(ATT_MEIVERSION)) {
              const att = element;
      assertAtt(att);
      att.SetMeiversion(att.StrToMeiVersionMeiversion(attrValue));
      return true;
    }
    return false;
  }],
  ["decls", (element, attrValue) => {
    if (element.HasAttClass(ATT_METADATAPOINTING)) {
              const att = element;
      assertAtt(att);
      att.SetDecls(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["metcon", (element, attrValue) => {
    if (element.HasAttClass(ATT_METERCONFORMANCE)) {
              const att = element;
      assertAtt(att);
      att.SetMetcon(att.StrToMeterConformanceMetcon(attrValue));
      return true;
    }
    if (element.HasAttClass(ATT_METERCONFORMANCEBAR)) {
              const att = element;
      assertAtt(att);
      att.SetMetcon(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["control", (element, attrValue) => {
    if (element.HasAttClass(ATT_METERCONFORMANCEBAR)) {
              const att = element;
      assertAtt(att);
      att.SetControl(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["count", (element, attrValue) => {
    if (element.HasAttClass(ATT_METERSIGLOG)) {
              const att = element;
      assertAtt(att);
      att.SetCount(att.StrToMetercountPair(attrValue));
      return true;
    }
    return false;
  }],
  ["sym", (element, attrValue) => {
    if (element.HasAttClass(ATT_METERSIGLOG)) {
              const att = element;
      assertAtt(att);
      att.SetSym(att.StrToMetersign(attrValue));
      return true;
    }
    return false;
  }],
  ["meter.count", (element, attrValue) => {
    if (element.HasAttClass(ATT_METERSIGDEFAULTLOG)) {
              const att = element;
      assertAtt(att);
      att.SetMeterCount(att.StrToMetercountPair(attrValue));
      return true;
    }
    return false;
  }],
  ["meter.unit", (element, attrValue) => {
    if (element.HasAttClass(ATT_METERSIGDEFAULTLOG)) {
              const att = element;
      assertAtt(att);
      att.SetMeterUnit(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["meter.sym", (element, attrValue) => {
    if (element.HasAttClass(ATT_METERSIGDEFAULTLOG)) {
              const att = element;
      assertAtt(att);
      att.SetMeterSym(att.StrToMetersign(attrValue));
      return true;
    }
    return false;
  }],
  ["mm", (element, attrValue) => {
    if (element.HasAttClass(ATT_MMTEMPO)) {
              const att = element;
      assertAtt(att);
      att.SetMm(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["mm.unit", (element, attrValue) => {
    if (element.HasAttClass(ATT_MMTEMPO)) {
              const att = element;
      assertAtt(att);
      att.SetMmUnit(att.StrToDuration(attrValue));
      return true;
    }
    return false;
  }],
  ["mm.dots", (element, attrValue) => {
    if (element.HasAttClass(ATT_MMTEMPO)) {
              const att = element;
      assertAtt(att);
      att.SetMmDots(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["multi.number", (element, attrValue) => {
    if (element.HasAttClass(ATT_MULTINUMMEASURES)) {
              const att = element;
      assertAtt(att);
      att.SetMultiNumber(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["nymref", (element, attrValue) => {
    if (element.HasAttClass(ATT_NAME)) {
              const att = element;
      assertAtt(att);
      att.SetNymref(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["role", (element, attrValue) => {
    if (element.HasAttClass(ATT_NAME)) {
              const att = element;
      assertAtt(att);
      att.SetRole(att.StrToRelators(attrValue));
      return true;
    }
    return false;
  }],
  ["music.name", (element, attrValue) => {
    if (element.HasAttClass(ATT_NOTATIONSTYLE)) {
              const att = element;
      assertAtt(att);
      att.SetMusicName(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["music.size", (element, attrValue) => {
    if (element.HasAttClass(ATT_NOTATIONSTYLE)) {
              const att = element;
      assertAtt(att);
      att.SetMusicSize(att.StrToFontsize(attrValue));
      return true;
    }
    return false;
  }],
  ["head.altsym", (element, attrValue) => {
    if (element.HasAttClass(ATT_NOTEHEADS)) {
              const att = element;
      assertAtt(att);
      att.SetHeadAltsym(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["head.auth", (element, attrValue) => {
    if (element.HasAttClass(ATT_NOTEHEADS)) {
              const att = element;
      assertAtt(att);
      att.SetHeadAuth(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["head.color", (element, attrValue) => {
    if (element.HasAttClass(ATT_NOTEHEADS)) {
              const att = element;
      assertAtt(att);
      att.SetHeadColor(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["head.fill", (element, attrValue) => {
    if (element.HasAttClass(ATT_NOTEHEADS)) {
              const att = element;
      assertAtt(att);
      att.SetHeadFill(att.StrToFill(attrValue));
      return true;
    }
    return false;
  }],
  ["head.fillcolor", (element, attrValue) => {
    if (element.HasAttClass(ATT_NOTEHEADS)) {
              const att = element;
      assertAtt(att);
      att.SetHeadFillcolor(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["head.mod", (element, attrValue) => {
    if (element.HasAttClass(ATT_NOTEHEADS)) {
              const att = element;
      assertAtt(att);
      att.SetHeadMod(att.StrToNoteheadmodifier(attrValue));
      return true;
    }
    return false;
  }],
  ["head.rotation", (element, attrValue) => {
    if (element.HasAttClass(ATT_NOTEHEADS)) {
              const att = element;
      assertAtt(att);
      att.SetHeadRotation(att.StrToRotation(attrValue));
      return true;
    }
    return false;
  }],
  ["head.shape", (element, attrValue) => {
    if (element.HasAttClass(ATT_NOTEHEADS)) {
              const att = element;
      assertAtt(att);
      att.SetHeadShape(att.StrToHeadshape(attrValue));
      return true;
    }
    return false;
  }],
  ["head.visible", (element, attrValue) => {
    if (element.HasAttClass(ATT_NOTEHEADS)) {
              const att = element;
      assertAtt(att);
      att.SetHeadVisible(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["oct.default", (element, attrValue) => {
    if (element.HasAttClass(ATT_OCTAVEDEFAULT)) {
              const att = element;
      assertAtt(att);
      att.SetOctDefault(att.StrToOctave(attrValue));
      return true;
    }
    return false;
  }],
  ["dis", (element, attrValue) => {
    if (element.HasAttClass(ATT_OCTAVEDISPLACEMENT)) {
              const att = element;
      assertAtt(att);
      att.SetDis(att.StrToOctaveDis(attrValue));
      return true;
    }
    return false;
  }],
  ["dis.place", (element, attrValue) => {
    if (element.HasAttClass(ATT_OCTAVEDISPLACEMENT)) {
              const att = element;
      assertAtt(att);
      att.SetDisPlace(att.StrToStaffrelBasic(attrValue));
      return true;
    }
    return false;
  }],
  ["ontheline", (element, attrValue) => {
    if (element.HasAttClass(ATT_ONELINESTAFF)) {
              const att = element;
      assertAtt(att);
      att.SetOntheline(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["optimize", (element, attrValue) => {
    if (element.HasAttClass(ATT_OPTIMIZATION)) {
              const att = element;
      assertAtt(att);
      att.SetOptimize(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["origin.layer", (element, attrValue) => {
    if (element.HasAttClass(ATT_ORIGINLAYERIDENT)) {
              const att = element;
      assertAtt(att);
      att.SetOriginLayer(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["origin.staff", (element, attrValue) => {
    if (element.HasAttClass(ATT_ORIGINSTAFFIDENT)) {
              const att = element;
      assertAtt(att);
      att.SetOriginStaff(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["origin.startid", (element, attrValue) => {
    if (element.HasAttClass(ATT_ORIGINSTARTENDID)) {
              const att = element;
      assertAtt(att);
      att.SetOriginStartid(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["origin.endid", (element, attrValue) => {
    if (element.HasAttClass(ATT_ORIGINSTARTENDID)) {
              const att = element;
      assertAtt(att);
      att.SetOriginEndid(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["origin.tstamp", (element, attrValue) => {
    if (element.HasAttClass(ATT_ORIGINTIMESTAMPLOG)) {
              const att = element;
      assertAtt(att);
      att.SetOriginTstamp(att.StrToMeasurebeat(attrValue));
      return true;
    }
    return false;
  }],
  ["origin.tstamp2", (element, attrValue) => {
    if (element.HasAttClass(ATT_ORIGINTIMESTAMPLOG)) {
              const att = element;
      assertAtt(att);
      att.SetOriginTstamp2(att.StrToMeasurebeat(attrValue));
      return true;
    }
    return false;
  }],
  ["page.height", (element, attrValue) => {
    if (element.HasAttClass(ATT_PAGES)) {
              const att = element;
      assertAtt(att);
      att.SetPageHeight(att.StrToMeasurementunsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["page.width", (element, attrValue) => {
    if (element.HasAttClass(ATT_PAGES)) {
              const att = element;
      assertAtt(att);
      att.SetPageWidth(att.StrToMeasurementunsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["page.topmar", (element, attrValue) => {
    if (element.HasAttClass(ATT_PAGES)) {
              const att = element;
      assertAtt(att);
      att.SetPageTopmar(att.StrToMeasurementunsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["page.botmar", (element, attrValue) => {
    if (element.HasAttClass(ATT_PAGES)) {
              const att = element;
      assertAtt(att);
      att.SetPageBotmar(att.StrToMeasurementunsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["page.leftmar", (element, attrValue) => {
    if (element.HasAttClass(ATT_PAGES)) {
              const att = element;
      assertAtt(att);
      att.SetPageLeftmar(att.StrToMeasurementunsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["page.rightmar", (element, attrValue) => {
    if (element.HasAttClass(ATT_PAGES)) {
              const att = element;
      assertAtt(att);
      att.SetPageRightmar(att.StrToMeasurementunsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["page.panels", (element, attrValue) => {
    if (element.HasAttClass(ATT_PAGES)) {
              const att = element;
      assertAtt(att);
      att.SetPagePanels(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["page.scale", (element, attrValue) => {
    if (element.HasAttClass(ATT_PAGES)) {
              const att = element;
      assertAtt(att);
      att.SetPageScale(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["part", (element, attrValue) => {
    if (element.HasAttClass(ATT_PARTIDENT)) {
              const att = resolveAttTimePoint(element);
      assertAtt(att);
      att.SetPart(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["partstaff", (element, attrValue) => {
    if (element.HasAttClass(ATT_PARTIDENT)) {
              const att = resolveAttTimePoint(element);
      assertAtt(att);
      att.SetPartstaff(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["onstaff", (element, attrValue) => {
    if (element.HasAttClass(ATT_PLACEMENTONSTAFF)) {
              const att = element;
      assertAtt(att);
      att.SetOnstaff(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["plist", (element, attrValue) => {
    if (element.HasAttClass(ATT_PLIST)) {
              const att = resolveAttPlist(element);
      assertAtt(att);
      att.SetPlist(att.StrToXsdAnyURIList(attrValue));
      return true;
    }
    return false;
  }],
  ["xlink:actuate", (element, attrValue) => {
    if (element.HasAttClass(ATT_POINTING)) {
              const att = element;
      assertAtt(att);
      att.SetActuate(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["xlink:role", (element, attrValue) => {
    if (element.HasAttClass(ATT_POINTING)) {
              const att = element;
      assertAtt(att);
      att.SetRole(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["xlink:show", (element, attrValue) => {
    if (element.HasAttClass(ATT_POINTING)) {
              const att = element;
      assertAtt(att);
      att.SetShow(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["targettype", (element, attrValue) => {
    if (element.HasAttClass(ATT_POINTING)) {
              const att = element;
      assertAtt(att);
      att.SetTargettype(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["quantity", (element, attrValue) => {
    if (element.HasAttClass(ATT_QUANTITY)) {
              const att = element;
      assertAtt(att);
      att.SetQuantity(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["atleast", (element, attrValue) => {
    if (element.HasAttClass(ATT_RANGING)) {
              const att = element;
      assertAtt(att);
      att.SetAtleast(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["atmost", (element, attrValue) => {
    if (element.HasAttClass(ATT_RANGING)) {
              const att = element;
      assertAtt(att);
      att.SetAtmost(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["min", (element, attrValue) => {
    if (element.HasAttClass(ATT_RANGING)) {
              const att = element;
      assertAtt(att);
      att.SetMin(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["max", (element, attrValue) => {
    if (element.HasAttClass(ATT_RANGING)) {
              const att = element;
      assertAtt(att);
      att.SetMax(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["confidence", (element, attrValue) => {
    if (element.HasAttClass(ATT_RANGING)) {
              const att = element;
      assertAtt(att);
      att.SetConfidence(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["resp", (element, attrValue) => {
    if (element.HasAttClass(ATT_RESPONSIBILITY)) {
              const att = element;
      assertAtt(att);
      att.SetResp(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["scale", (element, attrValue) => {
    if (element.HasAttClass(ATT_SCALABLE)) {
              const att = element;
      assertAtt(att);
      att.SetScale(att.StrToPercent(attrValue));
      return true;
    }
    return false;
  }],
  ["seq", (element, attrValue) => {
    if (element.HasAttClass(ATT_SEQUENCE)) {
              const att = element;
      assertAtt(att);
      att.SetSeq(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["slash", (element, attrValue) => {
    if (element.HasAttClass(ATT_SLASHCOUNT)) {
              const att = element;
      assertAtt(att);
      att.SetSlash(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["slur", (element, attrValue) => {
    if (element.HasAttClass(ATT_SLURPRESENT)) {
              const att = element;
      assertAtt(att);
      att.SetSlur(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["source", (element, attrValue) => {
    if (element.HasAttClass(ATT_SOURCE)) {
              const att = element;
      assertAtt(att);
      att.SetSource(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["spacing.packexp", (element, attrValue) => {
    if (element.HasAttClass(ATT_SPACING)) {
              const att = element;
      assertAtt(att);
      att.SetSpacingPackexp(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["spacing.packfact", (element, attrValue) => {
    if (element.HasAttClass(ATT_SPACING)) {
              const att = element;
      assertAtt(att);
      att.SetSpacingPackfact(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["spacing.staff", (element, attrValue) => {
    if (element.HasAttClass(ATT_SPACING)) {
              const att = element;
      assertAtt(att);
      att.SetSpacingStaff(att.StrToMeasurementsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["spacing.system", (element, attrValue) => {
    if (element.HasAttClass(ATT_SPACING)) {
              const att = element;
      assertAtt(att);
      att.SetSpacingSystem(att.StrToMeasurementsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["lines", (element, attrValue) => {
    if (element.HasAttClass(ATT_STAFFDEFLOG)) {
              const att = element;
      assertAtt(att);
      att.SetLines(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["symbol", (element, attrValue) => {
    if (element.HasAttClass(ATT_STAFFGROUPINGSYM)) {
              const att = element;
      assertAtt(att);
      att.SetSymbol(att.StrToStaffGroupingSymSymbol(attrValue));
      return true;
    }
    return false;
  }],
  ["aboveorder", (element, attrValue) => {
    if (element.HasAttClass(ATT_STAFFITEMS)) {
              const att = element;
      assertAtt(att);
      att.SetAboveorder(att.StrToStaffitem(attrValue));
      return true;
    }
    return false;
  }],
  ["beloworder", (element, attrValue) => {
    if (element.HasAttClass(ATT_STAFFITEMS)) {
              const att = element;
      assertAtt(att);
      att.SetBeloworder(att.StrToStaffitem(attrValue));
      return true;
    }
    return false;
  }],
  ["betweenorder", (element, attrValue) => {
    if (element.HasAttClass(ATT_STAFFITEMS)) {
              const att = element;
      assertAtt(att);
      att.SetBetweenorder(att.StrToStaffitem(attrValue));
      return true;
    }
    return false;
  }],
  ["loc", (element, attrValue) => {
    if (element.HasAttClass(ATT_STAFFLOC)) {
              const att = resolveAttPosition(element);
      assertAtt(att);
      att.SetLoc(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["ploc", (element, attrValue) => {
    if (element.HasAttClass(ATT_STAFFLOCPITCHED)) {
              const att = resolveAttPosition(element);
      assertAtt(att);
      att.SetPloc(att.StrToPitchname(attrValue));
      return true;
    }
    return false;
  }],
  ["oloc", (element, attrValue) => {
    if (element.HasAttClass(ATT_STAFFLOCPITCHED)) {
              const att = resolveAttPosition(element);
      assertAtt(att);
      att.SetOloc(att.StrToOctave(attrValue));
      return true;
    }
    return false;
  }],
  ["con", (element, attrValue) => {
    if (element.HasAttClass(ATT_SYLLOG)) {
              const att = element;
      assertAtt(att);
      att.SetCon(att.StrToSylLogCon(attrValue));
      return true;
    }
    return false;
  }],
  ["wordpos", (element, attrValue) => {
    if (element.HasAttClass(ATT_SYLLOG)) {
              const att = element;
      assertAtt(att);
      att.SetWordpos(att.StrToSylLogWordpos(attrValue));
      return true;
    }
    return false;
  }],
  ["syl", (element, attrValue) => {
    if (element.HasAttClass(ATT_SYLTEXT)) {
              const att = element;
      assertAtt(att);
      att.SetSyl(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["system.leftline", (element, attrValue) => {
    if (element.HasAttClass(ATT_SYSTEMS)) {
              const att = element;
      assertAtt(att);
      att.SetSystemLeftline(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["system.leftmar", (element, attrValue) => {
    if (element.HasAttClass(ATT_SYSTEMS)) {
              const att = element;
      assertAtt(att);
      att.SetSystemLeftmar(att.StrToMeasurementunsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["system.rightmar", (element, attrValue) => {
    if (element.HasAttClass(ATT_SYSTEMS)) {
              const att = element;
      assertAtt(att);
      att.SetSystemRightmar(att.StrToMeasurementunsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["system.topmar", (element, attrValue) => {
    if (element.HasAttClass(ATT_SYSTEMS)) {
              const att = element;
      assertAtt(att);
      att.SetSystemTopmar(att.StrToMeasurementunsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["evaluate", (element, attrValue) => {
    if (element.HasAttClass(ATT_TARGETEVAL)) {
              const att = element;
      assertAtt(att);
      att.SetEvaluate(att.StrToTargetEvalEvaluate(attrValue));
      return true;
    }
    return false;
  }],
  ["altrend", (element, attrValue) => {
    if (element.HasAttClass(ATT_TEXTRENDITION)) {
              const att = element;
      assertAtt(att);
      att.SetAltrend(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["rend", (element, attrValue) => {
    if (element.HasAttClass(ATT_TEXTRENDITION)) {
              const att = element;
      assertAtt(att);
      att.SetRend(att.StrToTextrendition(attrValue));
      return true;
    }
    return false;
  }],
  ["text.fam", (element, attrValue) => {
    if (element.HasAttClass(ATT_TEXTSTYLE)) {
              const att = element;
      assertAtt(att);
      att.SetTextFam(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["text.name", (element, attrValue) => {
    if (element.HasAttClass(ATT_TEXTSTYLE)) {
              const att = element;
      assertAtt(att);
      att.SetTextName(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["text.size", (element, attrValue) => {
    if (element.HasAttClass(ATT_TEXTSTYLE)) {
              const att = element;
      assertAtt(att);
      att.SetTextSize(att.StrToFontsize(attrValue));
      return true;
    }
    return false;
  }],
  ["text.style", (element, attrValue) => {
    if (element.HasAttClass(ATT_TEXTSTYLE)) {
              const att = element;
      assertAtt(att);
      att.SetTextStyle(att.StrToFontstyle(attrValue));
      return true;
    }
    return false;
  }],
  ["text.weight", (element, attrValue) => {
    if (element.HasAttClass(ATT_TEXTSTYLE)) {
              const att = element;
      assertAtt(att);
      att.SetTextWeight(att.StrToFontweight(attrValue));
      return true;
    }
    return false;
  }],
  ["tie", (element, attrValue) => {
    if (element.HasAttClass(ATT_TIEPRESENT)) {
              const att = element;
      assertAtt(att);
      att.SetTie(att.StrToTie(attrValue));
      return true;
    }
    return false;
  }],
  ["trans.diat", (element, attrValue) => {
    if (element.HasAttClass(ATT_TRANSPOSITION)) {
              const att = element;
      assertAtt(att);
      att.SetTransDiat(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["trans.semi", (element, attrValue) => {
    if (element.HasAttClass(ATT_TRANSPOSITION)) {
              const att = element;
      assertAtt(att);
      att.SetTransSemi(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["tune.Hz", (element, attrValue) => {
    if (element.HasAttClass(ATT_TUNING)) {
              const att = element;
      assertAtt(att);
      att.SetTuneHz(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["tune.pname", (element, attrValue) => {
    if (element.HasAttClass(ATT_TUNING)) {
              const att = element;
      assertAtt(att);
      att.SetTunePname(att.StrToPitchname(attrValue));
      return true;
    }
    return false;
  }],
  ["tune.temper", (element, attrValue) => {
    if (element.HasAttClass(ATT_TUNING)) {
              const att = element;
      assertAtt(att);
      att.SetTuneTemper(att.StrToTemperament(attrValue));
      return true;
    }
    return false;
  }],
  ["tuning.standard", (element, attrValue) => {
    if (element.HasAttClass(ATT_TUNINGLOG)) {
              const att = element;
      assertAtt(att);
      att.SetTuningStandard(att.StrToCoursetuning(attrValue));
      return true;
    }
    return false;
  }],
  ["tuplet", (element, attrValue) => {
    if (element.HasAttClass(ATT_TUPLETPRESENT)) {
              const att = element;
      assertAtt(att);
      att.SetTuplet(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["type", (element, attrValue) => {
    if (element.HasAttClass(ATT_TYPED)) {
              const att = element;
      assertAtt(att);
      att.SetType(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["valign", (element, attrValue) => {
    if (element.HasAttClass(ATT_VERTICALALIGN)) {
              const att = resolveAttAreaPos(element);
      assertAtt(att);
      att.SetValign(att.StrToVerticalalignment(attrValue));
      return true;
    }
    return false;
  }],
  ["vgrp", (element, attrValue) => {
    if (element.HasAttClass(ATT_VERTICALGROUP)) {
              const att = element;
      assertAtt(att);
      att.SetVgrp(att.StrToInt(attrValue));
      return true;
    }
    return false;
  }],
  ["visible", (element, attrValue) => {
    if (element.HasAttClass(ATT_VISIBILITY)) {
              const att = element;
      assertAtt(att);
      att.SetVisible(att.StrToBoolean(attrValue));
      return true;
    }
    return false;
  }],
  ["ho", (element, attrValue) => {
    if (element.HasAttClass(ATT_VISUALOFFSETHO)) {
              const att = resolveAttOffset(element);
      assertAtt(att);
      att.SetHo(att.StrToMeasurementsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["to", (element, attrValue) => {
    if (element.HasAttClass(ATT_VISUALOFFSETTO)) {
              const att = resolveAttOffset(element);
      assertAtt(att);
      att.SetTo(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["vo", (element, attrValue) => {
    if (element.HasAttClass(ATT_VISUALOFFSETVO)) {
              const att = resolveAttOffset(element);
      assertAtt(att);
      att.SetVo(att.StrToMeasurementsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["startho", (element, attrValue) => {
    if (element.HasAttClass(ATT_VISUALOFFSET2HO)) {
              const att = resolveAttOffsetSpanning(element);
      assertAtt(att);
      att.SetStartho(att.StrToMeasurementsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["endho", (element, attrValue) => {
    if (element.HasAttClass(ATT_VISUALOFFSET2HO)) {
              const att = resolveAttOffsetSpanning(element);
      assertAtt(att);
      att.SetEndho(att.StrToMeasurementsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["startto", (element, attrValue) => {
    if (element.HasAttClass(ATT_VISUALOFFSET2TO)) {
              const att = resolveAttOffsetSpanning(element);
      assertAtt(att);
      att.SetStartto(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["endto", (element, attrValue) => {
    if (element.HasAttClass(ATT_VISUALOFFSET2TO)) {
              const att = resolveAttOffsetSpanning(element);
      assertAtt(att);
      att.SetEndto(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["startvo", (element, attrValue) => {
    if (element.HasAttClass(ATT_VISUALOFFSET2VO)) {
              const att = resolveAttOffsetSpanning(element);
      assertAtt(att);
      att.SetStartvo(att.StrToMeasurementsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["endvo", (element, attrValue) => {
    if (element.HasAttClass(ATT_VISUALOFFSET2VO)) {
              const att = resolveAttOffsetSpanning(element);
      assertAtt(att);
      att.SetEndvo(att.StrToMeasurementsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["voltasym", (element, attrValue) => {
    if (element.HasAttClass(ATT_VOLTAGROUPINGSYM)) {
              const att = element;
      assertAtt(att);
      att.SetVoltasym(att.StrToVoltaGroupingSymVoltasym(attrValue));
      return true;
    }
    return false;
  }],
  ["xml:space", (element, attrValue) => {
    if (element.HasAttClass(ATT_WHITESPACE)) {
              const att = element;
      assertAtt(att);
      att.SetSpace(att.StrToStr(attrValue));
      return true;
    }
    return false;
  }],
  ["width", (element, attrValue) => {
    if (element.HasAttClass(ATT_WIDTH)) {
              const att = element;
      assertAtt(att);
      att.SetWidth(att.StrToMeasurementunsigned(attrValue));
      return true;
    }
    return false;
  }],
  ["x", (element, attrValue) => {
    if (element.HasAttClass(ATT_XY)) {
              const att = element;
      assertAtt(att);
      att.SetX(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["y", (element, attrValue) => {
    if (element.HasAttClass(ATT_XY)) {
              const att = element;
      assertAtt(att);
      att.SetY(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["x2", (element, attrValue) => {
    if (element.HasAttClass(ATT_XY2)) {
              const att = element;
      assertAtt(att);
      att.SetX2(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }],
  ["y2", (element, attrValue) => {
    if (element.HasAttClass(ATT_XY2)) {
              const att = element;
      assertAtt(att);
      att.SetY2(att.StrToDbl(attrValue));
      return true;
    }
    return false;
  }]
]);

export class AttModule {
  static SetMei(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_NOTATIONTYPE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "notationtype") {
            att.SetNotationtype(att.StrToNotationtype(attrValue));
            return true;
        }
        if (attrType == "notationsubtype") {
            att.SetNotationsubtype(att.StrToStr(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetMei(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_NOTATIONTYPE)) {
        const att = element;
        assertAtt(att);
        if (att.HasNotationtype()) {
            attributes.push(["notationtype", att.NotationtypeToStr(att.GetNotationtype())]);
        }
        if (att.HasNotationsubtype()) {
            attributes.push(["notationsubtype", att.StrToStr(att.GetNotationsubtype())]);
        }
    }

  }

  static CopyMei(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_NOTATIONTYPE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetNotationtype(att.GetNotationtype());
        attTarget.SetNotationsubtype(att.GetNotationsubtype());
    }

  }

  static SetAnalytical(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_HARMANL)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToHarmAnlForm(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_HARMONICFUNCTION)) {
        const att = element;
        assertAtt(att);
        if (attrType == "deg") {
            att.SetDeg(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_INTERVALHARMONIC)) {
        const att = element;
        assertAtt(att);
        if (attrType == "inth") {
            att.SetInth(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_INTERVALMELODIC)) {
        const att = element;
        assertAtt(att);
        if (attrType == "intm") {
            att.SetIntm(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_KEYSIGANL)) {
        const att = element;
        assertAtt(att);
        if (attrType == "accid") {
            att.SetAccid(att.StrToAccidentalGesturalBasic(attrValue));
            return true;
        }
        if (attrType == "mode") {
            att.SetMode(att.StrToMode(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_KEYSIGDEFAULTANL)) {
        const att = element;
        assertAtt(att);
        if (attrType == "key.accid") {
            att.SetKeyAccid(att.StrToAccidentalGesturalBasic(attrValue));
            return true;
        }
        if (attrType == "key.mode") {
            att.SetKeyMode(att.StrToMode(attrValue));
            return true;
        }
        if (attrType == "key.pname") {
            att.SetKeyPname(att.StrToPitchname(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MELODICFUNCTION)) {
        const att = element;
        assertAtt(att);
        if (attrType == "mfunc") {
            att.SetMfunc(att.StrToMelodicfunction(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PITCHCLASS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "pclass") {
            att.SetPclass(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SOLFA)) {
        const att = element;
        assertAtt(att);
        if (attrType == "psolfa") {
            att.SetPsolfa(att.StrToStr(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetAnalytical(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_HARMANL)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.HarmAnlFormToStr(att.GetForm())]);
        }
    }
    if (element.HasAttClass(ATT_HARMONICFUNCTION)) {
        const att = element;
        assertAtt(att);
        if (att.HasDeg()) {
            attributes.push(["deg", att.StrToStr(att.GetDeg())]);
        }
    }
    if (element.HasAttClass(ATT_INTERVALHARMONIC)) {
        const att = element;
        assertAtt(att);
        if (att.HasInth()) {
            attributes.push(["inth", att.StrToStr(att.GetInth())]);
        }
    }
    if (element.HasAttClass(ATT_INTERVALMELODIC)) {
        const att = element;
        assertAtt(att);
        if (att.HasIntm()) {
            attributes.push(["intm", att.StrToStr(att.GetIntm())]);
        }
    }
    if (element.HasAttClass(ATT_KEYSIGANL)) {
        const att = element;
        assertAtt(att);
        if (att.HasAccid()) {
            attributes.push(["accid", att.AccidentalGesturalBasicToStr(att.GetAccid())]);
        }
        if (att.HasMode()) {
            attributes.push(["mode", att.ModeToStr(att.GetMode())]);
        }
    }
    if (element.HasAttClass(ATT_KEYSIGDEFAULTANL)) {
        const att = element;
        assertAtt(att);
        if (att.HasKeyAccid()) {
            attributes.push(["key.accid", att.AccidentalGesturalBasicToStr(att.GetKeyAccid())]);
        }
        if (att.HasKeyMode()) {
            attributes.push(["key.mode", att.ModeToStr(att.GetKeyMode())]);
        }
        if (att.HasKeyPname()) {
            attributes.push(["key.pname", att.PitchnameToStr(att.GetKeyPname())]);
        }
    }
    if (element.HasAttClass(ATT_MELODICFUNCTION)) {
        const att = element;
        assertAtt(att);
        if (att.HasMfunc()) {
            attributes.push(["mfunc", att.MelodicfunctionToStr(att.GetMfunc())]);
        }
    }
    if (element.HasAttClass(ATT_PITCHCLASS)) {
        const att = element;
        assertAtt(att);
        if (att.HasPclass()) {
            attributes.push(["pclass", att.IntToStr(att.GetPclass())]);
        }
    }
    if (element.HasAttClass(ATT_SOLFA)) {
        const att = element;
        assertAtt(att);
        if (att.HasPsolfa()) {
            attributes.push(["psolfa", att.StrToStr(att.GetPsolfa())]);
        }
    }

  }

  static CopyAnalytical(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_HARMANL)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
    }
    if (element.HasAttClass(ATT_HARMONICFUNCTION)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetDeg(att.GetDeg());
    }
    if (element.HasAttClass(ATT_INTERVALHARMONIC)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetInth(att.GetInth());
    }
    if (element.HasAttClass(ATT_INTERVALMELODIC)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetIntm(att.GetIntm());
    }
    if (element.HasAttClass(ATT_KEYSIGANL)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAccid(att.GetAccid());
        attTarget.SetMode(att.GetMode());
    }
    if (element.HasAttClass(ATT_KEYSIGDEFAULTANL)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetKeyAccid(att.GetKeyAccid());
        attTarget.SetKeyMode(att.GetKeyMode());
        attTarget.SetKeyPname(att.GetKeyPname());
    }
    if (element.HasAttClass(ATT_MELODICFUNCTION)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMfunc(att.GetMfunc());
    }
    if (element.HasAttClass(ATT_PITCHCLASS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetPclass(att.GetPclass());
    }
    if (element.HasAttClass(ATT_SOLFA)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetPsolfa(att.GetPsolfa());
    }

  }

  static SetCmn(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_ARPEGLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "order") {
            att.SetOrder(att.StrToArpegLogOrder(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BEAMPRESENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "beam") {
            att.SetBeam(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BEAMREND)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToBeamRendForm(attrValue));
            return true;
        }
        if (attrType == "place") {
            att.SetPlace(att.StrToBeamplace(attrValue));
            return true;
        }
        if (attrType == "slash") {
            att.SetSlash(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "slope") {
            att.SetSlope(att.StrToDbl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BEAMSECONDARY)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        if (attrType == "breaksec") {
            att.SetBreaksec(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BEAMEDWITH)) {
        const att = element;
        assertAtt(att);
        if (attrType == "beam.with") {
            att.SetBeamWith(att.StrToNeighboringlayer(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BEAMINGLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "beam.group") {
            att.SetBeamGroup(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "beam.rests") {
            att.SetBeamRests(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BEATRPTLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "beatdef") {
            att.SetBeatdef(att.StrToDbl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BRACKETSPANLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "func") {
            att.SetFunc(att.StrToBracketSpanLogFunc(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_CUTOUT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "cutout") {
            att.SetCutout(att.StrToCutoutCutout(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_EXPANDABLE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "expand") {
            att.SetExpand(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_GLISSPRESENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "gliss") {
            att.SetGliss(att.StrToGlissando(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_GRACEGRPLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "attach") {
            att.SetAttach(att.StrToGraceGrpLogAttach(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_GRACED)) {
        const att = element;
        assertAtt(att);
        if (attrType == "grace") {
            att.SetGrace(att.StrToGrace(attrValue));
            return true;
        }
        if (attrType == "grace.time") {
            att.SetGraceTime(att.StrToPercent(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_HAIRPINLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToHairpinLogForm(attrValue));
            return true;
        }
        if (attrType == "niente") {
            att.SetNiente(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_HARPPEDALLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "c") {
            att.SetC(att.StrToHarppedalposition(attrValue));
            return true;
        }
        if (attrType == "d") {
            att.SetD(att.StrToHarppedalposition(attrValue));
            return true;
        }
        if (attrType == "e") {
            att.SetE(att.StrToHarppedalposition(attrValue));
            return true;
        }
        if (attrType == "f") {
            att.SetF(att.StrToHarppedalposition(attrValue));
            return true;
        }
        if (attrType == "g") {
            att.SetG(att.StrToHarppedalposition(attrValue));
            return true;
        }
        if (attrType == "a") {
            att.SetA(att.StrToHarppedalposition(attrValue));
            return true;
        }
        if (attrType == "b") {
            att.SetB(att.StrToHarppedalposition(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_LVPRESENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "lv") {
            att.SetLv(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MEASURELOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "left") {
            att.SetLeft(att.StrToBarrendition(attrValue));
            return true;
        }
        if (attrType == "right") {
            att.SetRight(att.StrToBarrendition(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_METERSIGGRPLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "func") {
            att.SetFunc(att.StrToMeterSigGrpLogFunc(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_NUMBERPLACEMENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "num.place") {
            att.SetNumPlace(att.StrToStaffrelBasic(attrValue));
            return true;
        }
        if (attrType == "num.visible") {
            att.SetNumVisible(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_NUMBERED)) {
        const att = element;
        assertAtt(att);
        if (attrType == "num") {
            att.SetNum(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_OCTAVELOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "coll") {
            att.SetColl(att.StrToOctaveLogColl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PEDALLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "dir") {
            att.SetDir(att.StrToPedalLogDir(attrValue));
            return true;
        }
        if (attrType == "func") {
            att.SetFunc(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PIANOPEDALS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "pedal.style") {
            att.SetPedalStyle(att.StrToPedalstyle(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_REHEARSAL)) {
        const att = element;
        assertAtt(att);
        if (attrType == "reh.enclose") {
            att.SetRehEnclose(att.StrToRehearsalRehenclose(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SLURREND)) {
        const att = element;
        assertAtt(att);
        if (attrType == "slur.lform") {
            att.SetSlurLform(att.StrToLineform(attrValue));
            return true;
        }
        if (attrType == "slur.lwidth") {
            att.SetSlurLwidth(att.StrToLinewidth(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STEMSCMN)) {
        const att = element;
        assertAtt(att);
        if (attrType == "stem.with") {
            att.SetStemWith(att.StrToNeighboringlayer(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TIEREND)) {
        const att = element;
        assertAtt(att);
        if (attrType == "tie.lform") {
            att.SetTieLform(att.StrToLineform(attrValue));
            return true;
        }
        if (attrType == "tie.lwidth") {
            att.SetTieLwidth(att.StrToLinewidth(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TREMFORM)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToTremFormForm(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TREMMEASURED)) {
        const att = element;
        assertAtt(att);
        if (attrType == "unitdur") {
            att.SetUnitdur(att.StrToDuration(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetCmn(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_ARPEGLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasOrder()) {
            attributes.push(["order", att.ArpegLogOrderToStr(att.GetOrder())]);
        }
    }
    if (element.HasAttClass(ATT_BEAMPRESENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasBeam()) {
            attributes.push(["beam", att.StrToStr(att.GetBeam())]);
        }
    }
    if (element.HasAttClass(ATT_BEAMREND)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.BeamRendFormToStr(att.GetForm())]);
        }
        if (att.HasPlace()) {
            attributes.push(["place", att.BeamplaceToStr(att.GetPlace())]);
        }
        if (att.HasSlash()) {
            attributes.push(["slash", att.BooleanToStr(att.GetSlash())]);
        }
        if (att.HasSlope()) {
            attributes.push(["slope", att.DblToStr(att.GetSlope())]);
        }
    }
    if (element.HasAttClass(ATT_BEAMSECONDARY)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        if (att.HasBreaksec()) {
            attributes.push(["breaksec", att.IntToStr(att.GetBreaksec())]);
        }
    }
    if (element.HasAttClass(ATT_BEAMEDWITH)) {
        const att = element;
        assertAtt(att);
        if (att.HasBeamWith()) {
            attributes.push(["beam.with", att.NeighboringlayerToStr(att.GetBeamWith())]);
        }
    }
    if (element.HasAttClass(ATT_BEAMINGLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasBeamGroup()) {
            attributes.push(["beam.group", att.StrToStr(att.GetBeamGroup())]);
        }
        if (att.HasBeamRests()) {
            attributes.push(["beam.rests", att.BooleanToStr(att.GetBeamRests())]);
        }
    }
    if (element.HasAttClass(ATT_BEATRPTLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasBeatdef()) {
            attributes.push(["beatdef", att.DblToStr(att.GetBeatdef())]);
        }
    }
    if (element.HasAttClass(ATT_BRACKETSPANLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasFunc()) {
            attributes.push(["func", att.BracketSpanLogFuncToStr(att.GetFunc())]);
        }
    }
    if (element.HasAttClass(ATT_CUTOUT)) {
        const att = element;
        assertAtt(att);
        if (att.HasCutout()) {
            attributes.push(["cutout", att.CutoutCutoutToStr(att.GetCutout())]);
        }
    }
    if (element.HasAttClass(ATT_EXPANDABLE)) {
        const att = element;
        assertAtt(att);
        if (att.HasExpand()) {
            attributes.push(["expand", att.BooleanToStr(att.GetExpand())]);
        }
    }
    if (element.HasAttClass(ATT_GLISSPRESENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasGliss()) {
            attributes.push(["gliss", att.GlissandoToStr(att.GetGliss())]);
        }
    }
    if (element.HasAttClass(ATT_GRACEGRPLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasAttach()) {
            attributes.push(["attach", att.GraceGrpLogAttachToStr(att.GetAttach())]);
        }
    }
    if (element.HasAttClass(ATT_GRACED)) {
        const att = element;
        assertAtt(att);
        if (att.HasGrace()) {
            attributes.push(["grace", att.GraceToStr(att.GetGrace())]);
        }
        if (att.HasGraceTime()) {
            attributes.push(["grace.time", att.PercentToStr(att.GetGraceTime())]);
        }
    }
    if (element.HasAttClass(ATT_HAIRPINLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.HairpinLogFormToStr(att.GetForm())]);
        }
        if (att.HasNiente()) {
            attributes.push(["niente", att.BooleanToStr(att.GetNiente())]);
        }
    }
    if (element.HasAttClass(ATT_HARPPEDALLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasC()) {
            attributes.push(["c", att.HarppedalpositionToStr(att.GetC())]);
        }
        if (att.HasD()) {
            attributes.push(["d", att.HarppedalpositionToStr(att.GetD())]);
        }
        if (att.HasE()) {
            attributes.push(["e", att.HarppedalpositionToStr(att.GetE())]);
        }
        if (att.HasF()) {
            attributes.push(["f", att.HarppedalpositionToStr(att.GetF())]);
        }
        if (att.HasG()) {
            attributes.push(["g", att.HarppedalpositionToStr(att.GetG())]);
        }
        if (att.HasA()) {
            attributes.push(["a", att.HarppedalpositionToStr(att.GetA())]);
        }
        if (att.HasB()) {
            attributes.push(["b", att.HarppedalpositionToStr(att.GetB())]);
        }
    }
    if (element.HasAttClass(ATT_LVPRESENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasLv()) {
            attributes.push(["lv", att.BooleanToStr(att.GetLv())]);
        }
    }
    if (element.HasAttClass(ATT_MEASURELOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasLeft()) {
            attributes.push(["left", att.BarrenditionToStr(att.GetLeft())]);
        }
        if (att.HasRight()) {
            attributes.push(["right", att.BarrenditionToStr(att.GetRight())]);
        }
    }
    if (element.HasAttClass(ATT_METERSIGGRPLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasFunc()) {
            attributes.push(["func", att.MeterSigGrpLogFuncToStr(att.GetFunc())]);
        }
    }
    if (element.HasAttClass(ATT_NUMBERPLACEMENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasNumPlace()) {
            attributes.push(["num.place", att.StaffrelBasicToStr(att.GetNumPlace())]);
        }
        if (att.HasNumVisible()) {
            attributes.push(["num.visible", att.BooleanToStr(att.GetNumVisible())]);
        }
    }
    if (element.HasAttClass(ATT_NUMBERED)) {
        const att = element;
        assertAtt(att);
        if (att.HasNum()) {
            attributes.push(["num", att.IntToStr(att.GetNum())]);
        }
    }
    if (element.HasAttClass(ATT_OCTAVELOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasColl()) {
            attributes.push(["coll", att.OctaveLogCollToStr(att.GetColl())]);
        }
    }
    if (element.HasAttClass(ATT_PEDALLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasDir()) {
            attributes.push(["dir", att.PedalLogDirToStr(att.GetDir())]);
        }
        if (att.HasFunc()) {
            attributes.push(["func", att.StrToStr(att.GetFunc())]);
        }
    }
    if (element.HasAttClass(ATT_PIANOPEDALS)) {
        const att = element;
        assertAtt(att);
        if (att.HasPedalStyle()) {
            attributes.push(["pedal.style", att.PedalstyleToStr(att.GetPedalStyle())]);
        }
    }
    if (element.HasAttClass(ATT_REHEARSAL)) {
        const att = element;
        assertAtt(att);
        if (att.HasRehEnclose()) {
            attributes.push(["reh.enclose", att.RehearsalRehencloseToStr(att.GetRehEnclose())]);
        }
    }
    if (element.HasAttClass(ATT_SLURREND)) {
        const att = element;
        assertAtt(att);
        if (att.HasSlurLform()) {
            attributes.push(["slur.lform", att.LineformToStr(att.GetSlurLform())]);
        }
        if (att.HasSlurLwidth()) {
            attributes.push(["slur.lwidth", att.LinewidthToStr(att.GetSlurLwidth())]);
        }
    }
    if (element.HasAttClass(ATT_STEMSCMN)) {
        const att = element;
        assertAtt(att);
        if (att.HasStemWith()) {
            attributes.push(["stem.with", att.NeighboringlayerToStr(att.GetStemWith())]);
        }
    }
    if (element.HasAttClass(ATT_TIEREND)) {
        const att = element;
        assertAtt(att);
        if (att.HasTieLform()) {
            attributes.push(["tie.lform", att.LineformToStr(att.GetTieLform())]);
        }
        if (att.HasTieLwidth()) {
            attributes.push(["tie.lwidth", att.LinewidthToStr(att.GetTieLwidth())]);
        }
    }
    if (element.HasAttClass(ATT_TREMFORM)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.TremFormFormToStr(att.GetForm())]);
        }
    }
    if (element.HasAttClass(ATT_TREMMEASURED)) {
        const att = element;
        assertAtt(att);
        if (att.HasUnitdur()) {
            attributes.push(["unitdur", att.DurationToStr(att.GetUnitdur())]);
        }
    }

  }

  static CopyCmn(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_ARPEGLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetOrder(att.GetOrder());
    }
    if (element.HasAttClass(ATT_BEAMPRESENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetBeam(att.GetBeam());
    }
    if (element.HasAttClass(ATT_BEAMREND)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
        attTarget.SetPlace(att.GetPlace());
        attTarget.SetSlash(att.GetSlash());
        attTarget.SetSlope(att.GetSlope());
    }
    if (element.HasAttClass(ATT_BEAMSECONDARY)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        const attTarget = resolveAttDuration(target);
        assertAtt(attTarget);
        attTarget.SetBreaksec(att.GetBreaksec());
    }
    if (element.HasAttClass(ATT_BEAMEDWITH)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetBeamWith(att.GetBeamWith());
    }
    if (element.HasAttClass(ATT_BEAMINGLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetBeamGroup(att.GetBeamGroup());
        attTarget.SetBeamRests(att.GetBeamRests());
    }
    if (element.HasAttClass(ATT_BEATRPTLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetBeatdef(att.GetBeatdef());
    }
    if (element.HasAttClass(ATT_BRACKETSPANLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetFunc(att.GetFunc());
    }
    if (element.HasAttClass(ATT_CUTOUT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCutout(att.GetCutout());
    }
    if (element.HasAttClass(ATT_EXPANDABLE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetExpand(att.GetExpand());
    }
    if (element.HasAttClass(ATT_GLISSPRESENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetGliss(att.GetGliss());
    }
    if (element.HasAttClass(ATT_GRACEGRPLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAttach(att.GetAttach());
    }
    if (element.HasAttClass(ATT_GRACED)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetGrace(att.GetGrace());
        attTarget.SetGraceTime(att.GetGraceTime());
    }
    if (element.HasAttClass(ATT_HAIRPINLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
        attTarget.SetNiente(att.GetNiente());
    }
    if (element.HasAttClass(ATT_HARPPEDALLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetC(att.GetC());
        attTarget.SetD(att.GetD());
        attTarget.SetE(att.GetE());
        attTarget.SetF(att.GetF());
        attTarget.SetG(att.GetG());
        attTarget.SetA(att.GetA());
        attTarget.SetB(att.GetB());
    }
    if (element.HasAttClass(ATT_LVPRESENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLv(att.GetLv());
    }
    if (element.HasAttClass(ATT_MEASURELOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLeft(att.GetLeft());
        attTarget.SetRight(att.GetRight());
    }
    if (element.HasAttClass(ATT_METERSIGGRPLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetFunc(att.GetFunc());
    }
    if (element.HasAttClass(ATT_NUMBERPLACEMENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetNumPlace(att.GetNumPlace());
        attTarget.SetNumVisible(att.GetNumVisible());
    }
    if (element.HasAttClass(ATT_NUMBERED)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetNum(att.GetNum());
    }
    if (element.HasAttClass(ATT_OCTAVELOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetColl(att.GetColl());
    }
    if (element.HasAttClass(ATT_PEDALLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetDir(att.GetDir());
        attTarget.SetFunc(att.GetFunc());
    }
    if (element.HasAttClass(ATT_PIANOPEDALS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetPedalStyle(att.GetPedalStyle());
    }
    if (element.HasAttClass(ATT_REHEARSAL)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetRehEnclose(att.GetRehEnclose());
    }
    if (element.HasAttClass(ATT_SLURREND)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSlurLform(att.GetSlurLform());
        attTarget.SetSlurLwidth(att.GetSlurLwidth());
    }
    if (element.HasAttClass(ATT_STEMSCMN)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetStemWith(att.GetStemWith());
    }
    if (element.HasAttClass(ATT_TIEREND)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTieLform(att.GetTieLform());
        attTarget.SetTieLwidth(att.GetTieLwidth());
    }
    if (element.HasAttClass(ATT_TREMFORM)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
    }
    if (element.HasAttClass(ATT_TREMMEASURED)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetUnitdur(att.GetUnitdur());
    }

  }

  static SetCmnornaments(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_MORDENTLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToMordentLogForm(attrValue));
            return true;
        }
        if (attrType == "long") {
            att.SetLong(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ORNAMPRESENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "ornam") {
            att.SetOrnam(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ORNAMENTACCID)) {
        const att = element;
        assertAtt(att);
        if (attrType == "accidupper") {
            att.SetAccidupper(att.StrToAccidentalWritten(attrValue));
            return true;
        }
        if (attrType == "accidlower") {
            att.SetAccidlower(att.StrToAccidentalWritten(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TURNLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "delayed") {
            att.SetDelayed(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "form") {
            att.SetForm(att.StrToTurnLogForm(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetCmnornaments(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_MORDENTLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.MordentLogFormToStr(att.GetForm())]);
        }
        if (att.HasLong()) {
            attributes.push(["long", att.BooleanToStr(att.GetLong())]);
        }
    }
    if (element.HasAttClass(ATT_ORNAMPRESENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasOrnam()) {
            attributes.push(["ornam", att.StrToStr(att.GetOrnam())]);
        }
    }
    if (element.HasAttClass(ATT_ORNAMENTACCID)) {
        const att = element;
        assertAtt(att);
        if (att.HasAccidupper()) {
            attributes.push(["accidupper", att.AccidentalWrittenToStr(att.GetAccidupper())]);
        }
        if (att.HasAccidlower()) {
            attributes.push(["accidlower", att.AccidentalWrittenToStr(att.GetAccidlower())]);
        }
    }
    if (element.HasAttClass(ATT_TURNLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasDelayed()) {
            attributes.push(["delayed", att.BooleanToStr(att.GetDelayed())]);
        }
        if (att.HasForm()) {
            attributes.push(["form", att.TurnLogFormToStr(att.GetForm())]);
        }
    }

  }

  static CopyCmnornaments(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_MORDENTLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
        attTarget.SetLong(att.GetLong());
    }
    if (element.HasAttClass(ATT_ORNAMPRESENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetOrnam(att.GetOrnam());
    }
    if (element.HasAttClass(ATT_ORNAMENTACCID)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAccidupper(att.GetAccidupper());
        attTarget.SetAccidlower(att.GetAccidlower());
    }
    if (element.HasAttClass(ATT_TURNLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetDelayed(att.GetDelayed());
        attTarget.SetForm(att.GetForm());
    }

  }

  static SetCritapp(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_CRIT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "cause") {
            att.SetCause(att.StrToStr(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetCritapp(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_CRIT)) {
        const att = element;
        assertAtt(att);
        if (att.HasCause()) {
            attributes.push(["cause", att.StrToStr(att.GetCause())]);
        }
    }

  }

  static CopyCritapp(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_CRIT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCause(att.GetCause());
    }

  }

  static SetEdittrans(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_AGENTIDENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "agent") {
            att.SetAgent(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_REASONIDENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "reason") {
            att.SetReason(att.StrToStr(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetEdittrans(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_AGENTIDENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasAgent()) {
            attributes.push(["agent", att.StrToStr(att.GetAgent())]);
        }
    }
    if (element.HasAttClass(ATT_REASONIDENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasReason()) {
            attributes.push(["reason", att.StrToStr(att.GetReason())]);
        }
    }

  }

  static CopyEdittrans(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_AGENTIDENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAgent(att.GetAgent());
    }
    if (element.HasAttClass(ATT_REASONIDENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetReason(att.GetReason());
    }

  }

  static SetExternalsymbols(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_EXTSYMAUTH)) {
        const att = element;
        assertAtt(att);
        if (attrType == "glyph.auth") {
            att.SetGlyphAuth(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "glyph.uri") {
            att.SetGlyphUri(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_EXTSYMNAMES)) {
        const att = element;
        assertAtt(att);
        if (attrType == "glyph.name") {
            att.SetGlyphName(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "glyph.num") {
            att.SetGlyphNum(att.StrToHexnum(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetExternalsymbols(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_EXTSYMAUTH)) {
        const att = element;
        assertAtt(att);
        if (att.HasGlyphAuth()) {
            attributes.push(["glyph.auth", att.StrToStr(att.GetGlyphAuth())]);
        }
        if (att.HasGlyphUri()) {
            attributes.push(["glyph.uri", att.StrToStr(att.GetGlyphUri())]);
        }
    }
    if (element.HasAttClass(ATT_EXTSYMNAMES)) {
        const att = element;
        assertAtt(att);
        if (att.HasGlyphName()) {
            attributes.push(["glyph.name", att.StrToStr(att.GetGlyphName())]);
        }
        if (att.HasGlyphNum()) {
            attributes.push(["glyph.num", att.HexnumToStr(att.GetGlyphNum())]);
        }
    }

  }

  static CopyExternalsymbols(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_EXTSYMAUTH)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetGlyphAuth(att.GetGlyphAuth());
        attTarget.SetGlyphUri(att.GetGlyphUri());
    }
    if (element.HasAttClass(ATT_EXTSYMNAMES)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetGlyphName(att.GetGlyphName());
        attTarget.SetGlyphNum(att.GetGlyphNum());
    }

  }

  static SetFacsimile(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_FACSIMILE)) {
        const att = resolveAttFacsimile(element);
        assertAtt(att);
        if (attrType == "facs") {
            att.SetFacs(att.StrToStr(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetFacsimile(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_FACSIMILE)) {
        const att = resolveAttFacsimile(element);
        assertAtt(att);
        if (att.HasFacs()) {
            attributes.push(["facs", att.StrToStr(att.GetFacs())]);
        }
    }

  }

  static CopyFacsimile(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_FACSIMILE)) {
        const att = resolveAttFacsimile(element);
        assertAtt(att);
        const attTarget = resolveAttFacsimile(target);
        assertAtt(attTarget);
        attTarget.SetFacs(att.GetFacs());
    }

  }

  static SetFigtable(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_TABULAR)) {
        const att = element;
        assertAtt(att);
        if (attrType == "colspan") {
            att.SetColspan(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "rowspan") {
            att.SetRowspan(att.StrToInt(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetFigtable(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_TABULAR)) {
        const att = element;
        assertAtt(att);
        if (att.HasColspan()) {
            attributes.push(["colspan", att.IntToStr(att.GetColspan())]);
        }
        if (att.HasRowspan()) {
            attributes.push(["rowspan", att.IntToStr(att.GetRowspan())]);
        }
    }

  }

  static CopyFigtable(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_TABULAR)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetColspan(att.GetColspan());
        attTarget.SetRowspan(att.GetRowspan());
    }

  }

  static SetFingering(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_FINGGRPLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToFingGrpLogForm(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetFingering(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_FINGGRPLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.FingGrpLogFormToStr(att.GetForm())]);
        }
    }

  }

  static CopyFingering(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_FINGGRPLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
    }

  }

  static SetGestural(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_ACCIDENTALGES)) {
        const att = element;
        assertAtt(att);
        if (attrType == "accid.ges") {
            att.SetAccidGes(att.StrToAccidentalGestural(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ARTICULATIONGES)) {
        const att = element;
        assertAtt(att);
        if (attrType == "artic.ges") {
            att.SetArticGes(att.StrToArticulationList(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ATTACKING)) {
        const att = element;
        assertAtt(att);
        if (attrType == "attacca") {
            att.SetAttacca(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BENDGES)) {
        const att = element;
        assertAtt(att);
        if (attrType == "amount") {
            att.SetAmount(att.StrToDbl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_DURATIONGES)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        if (attrType == "dur.ges") {
            att.SetDurGes(att.StrToDuration(attrValue));
            return true;
        }
        if (attrType == "dots.ges") {
            att.SetDotsGes(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "dur.metrical") {
            att.SetDurMetrical(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "dur.ppq") {
            att.SetDurPpq(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "dur.real") {
            att.SetDurReal(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "dur.recip") {
            att.SetDurRecip(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_NOTEGES)) {
        const att = resolveAttPitch(element);
        assertAtt(att);
        if (attrType == "extremis") {
            att.SetExtremis(att.StrToNoteGesExtremis(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ORNAMENTACCIDGES)) {
        const att = element;
        assertAtt(att);
        if (attrType == "accidupper.ges") {
            att.SetAccidupperGes(att.StrToAccidentalGestural(attrValue));
            return true;
        }
        if (attrType == "accidlower.ges") {
            att.SetAccidlowerGes(att.StrToAccidentalGestural(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PITCHGES)) {
        const att = resolveAttPitch(element);
        assertAtt(att);
        if (attrType == "oct.ges") {
            att.SetOctGes(att.StrToOctave(attrValue));
            return true;
        }
        if (attrType == "pname.ges") {
            att.SetPnameGes(att.StrToPitchname(attrValue));
            return true;
        }
        if (attrType == "pnum") {
            att.SetPnum(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SOUNDLOCATION)) {
        const att = element;
        assertAtt(att);
        if (attrType == "azimuth") {
            att.SetAzimuth(att.StrToDegrees(attrValue));
            return true;
        }
        if (attrType == "elevation") {
            att.SetElevation(att.StrToDegrees(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TIMESTAMPGES)) {
        const att = element;
        assertAtt(att);
        if (attrType == "tstamp.ges") {
            att.SetTstampGes(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "tstamp.real") {
            att.SetTstampReal(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TIMESTAMP2GES)) {
        const att = element;
        assertAtt(att);
        if (attrType == "tstamp2.ges") {
            att.SetTstamp2Ges(att.StrToMeasurebeat(attrValue));
            return true;
        }
        if (attrType == "tstamp2.real") {
            att.SetTstamp2Real(att.StrToStr(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetGestural(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_ACCIDENTALGES)) {
        const att = element;
        assertAtt(att);
        if (att.HasAccidGes()) {
            attributes.push(["accid.ges", att.AccidentalGesturalToStr(att.GetAccidGes())]);
        }
    }
    if (element.HasAttClass(ATT_ARTICULATIONGES)) {
        const att = element;
        assertAtt(att);
        if (att.HasArticGes()) {
            attributes.push(["artic.ges", att.ArticulationListToStr(att.GetArticGes())]);
        }
    }
    if (element.HasAttClass(ATT_ATTACKING)) {
        const att = element;
        assertAtt(att);
        if (att.HasAttacca()) {
            attributes.push(["attacca", att.BooleanToStr(att.GetAttacca())]);
        }
    }
    if (element.HasAttClass(ATT_BENDGES)) {
        const att = element;
        assertAtt(att);
        if (att.HasAmount()) {
            attributes.push(["amount", att.DblToStr(att.GetAmount())]);
        }
    }
    if (element.HasAttClass(ATT_DURATIONGES)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        if (att.HasDurGes()) {
            attributes.push(["dur.ges", att.DurationToStr(att.GetDurGes())]);
        }
        if (att.HasDotsGes()) {
            attributes.push(["dots.ges", att.IntToStr(att.GetDotsGes())]);
        }
        if (att.HasDurMetrical()) {
            attributes.push(["dur.metrical", att.DblToStr(att.GetDurMetrical())]);
        }
        if (att.HasDurPpq()) {
            attributes.push(["dur.ppq", att.IntToStr(att.GetDurPpq())]);
        }
        if (att.HasDurReal()) {
            attributes.push(["dur.real", att.DblToStr(att.GetDurReal())]);
        }
        if (att.HasDurRecip()) {
            attributes.push(["dur.recip", att.StrToStr(att.GetDurRecip())]);
        }
    }
    if (element.HasAttClass(ATT_NOTEGES)) {
        const att = resolveAttPitch(element);
        assertAtt(att);
        if (att.HasExtremis()) {
            attributes.push(["extremis", att.NoteGesExtremisToStr(att.GetExtremis())]);
        }
    }
    if (element.HasAttClass(ATT_ORNAMENTACCIDGES)) {
        const att = element;
        assertAtt(att);
        if (att.HasAccidupperGes()) {
            attributes.push(["accidupper.ges", att.AccidentalGesturalToStr(att.GetAccidupperGes())]);
        }
        if (att.HasAccidlowerGes()) {
            attributes.push(["accidlower.ges", att.AccidentalGesturalToStr(att.GetAccidlowerGes())]);
        }
    }
    if (element.HasAttClass(ATT_PITCHGES)) {
        const att = resolveAttPitch(element);
        assertAtt(att);
        if (att.HasOctGes()) {
            attributes.push(["oct.ges", att.OctaveToStr(att.GetOctGes())]);
        }
        if (att.HasPnameGes()) {
            attributes.push(["pname.ges", att.PitchnameToStr(att.GetPnameGes())]);
        }
        if (att.HasPnum()) {
            attributes.push(["pnum", att.IntToStr(att.GetPnum())]);
        }
    }
    if (element.HasAttClass(ATT_SOUNDLOCATION)) {
        const att = element;
        assertAtt(att);
        if (att.HasAzimuth()) {
            attributes.push(["azimuth", att.DegreesToStr(att.GetAzimuth())]);
        }
        if (att.HasElevation()) {
            attributes.push(["elevation", att.DegreesToStr(att.GetElevation())]);
        }
    }
    if (element.HasAttClass(ATT_TIMESTAMPGES)) {
        const att = element;
        assertAtt(att);
        if (att.HasTstampGes()) {
            attributes.push(["tstamp.ges", att.DblToStr(att.GetTstampGes())]);
        }
        if (att.HasTstampReal()) {
            attributes.push(["tstamp.real", att.StrToStr(att.GetTstampReal())]);
        }
    }
    if (element.HasAttClass(ATT_TIMESTAMP2GES)) {
        const att = element;
        assertAtt(att);
        if (att.HasTstamp2Ges()) {
            attributes.push(["tstamp2.ges", att.MeasurebeatToStr(att.GetTstamp2Ges())]);
        }
        if (att.HasTstamp2Real()) {
            attributes.push(["tstamp2.real", att.StrToStr(att.GetTstamp2Real())]);
        }
    }

  }

  static CopyGestural(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_ACCIDENTALGES)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAccidGes(att.GetAccidGes());
    }
    if (element.HasAttClass(ATT_ARTICULATIONGES)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetArticGes(att.GetArticGes());
    }
    if (element.HasAttClass(ATT_ATTACKING)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAttacca(att.GetAttacca());
    }
    if (element.HasAttClass(ATT_BENDGES)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAmount(att.GetAmount());
    }
    if (element.HasAttClass(ATT_DURATIONGES)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        const attTarget = resolveAttDuration(target);
        assertAtt(attTarget);
        attTarget.SetDurGes(att.GetDurGes());
        attTarget.SetDotsGes(att.GetDotsGes());
        attTarget.SetDurMetrical(att.GetDurMetrical());
        attTarget.SetDurPpq(att.GetDurPpq());
        attTarget.SetDurReal(att.GetDurReal());
        attTarget.SetDurRecip(att.GetDurRecip());
    }
    if (element.HasAttClass(ATT_NOTEGES)) {
        const att = resolveAttPitch(element);
        assertAtt(att);
        const attTarget = resolveAttPitch(target);
        assertAtt(attTarget);
        attTarget.SetExtremis(att.GetExtremis());
    }
    if (element.HasAttClass(ATT_ORNAMENTACCIDGES)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAccidupperGes(att.GetAccidupperGes());
        attTarget.SetAccidlowerGes(att.GetAccidlowerGes());
    }
    if (element.HasAttClass(ATT_PITCHGES)) {
        const att = resolveAttPitch(element);
        assertAtt(att);
        const attTarget = resolveAttPitch(target);
        assertAtt(attTarget);
        attTarget.SetOctGes(att.GetOctGes());
        attTarget.SetPnameGes(att.GetPnameGes());
        attTarget.SetPnum(att.GetPnum());
    }
    if (element.HasAttClass(ATT_SOUNDLOCATION)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAzimuth(att.GetAzimuth());
        attTarget.SetElevation(att.GetElevation());
    }
    if (element.HasAttClass(ATT_TIMESTAMPGES)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTstampGes(att.GetTstampGes());
        attTarget.SetTstampReal(att.GetTstampReal());
    }
    if (element.HasAttClass(ATT_TIMESTAMP2GES)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTstamp2Ges(att.GetTstamp2Ges());
        attTarget.SetTstamp2Real(att.GetTstamp2Real());
    }

  }

  static SetHarmony(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_HARMLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "chordref") {
            att.SetChordref(att.StrToStr(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetHarmony(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_HARMLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasChordref()) {
            attributes.push(["chordref", att.StrToStr(att.GetChordref())]);
        }
    }

  }

  static CopyHarmony(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_HARMLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetChordref(att.GetChordref());
    }

  }

  static SetHeader(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_ADLIBITUM)) {
        const att = element;
        assertAtt(att);
        if (attrType == "adlib") {
            att.SetAdlib(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BIFOLIUMSURFACES)) {
        const att = element;
        assertAtt(att);
        if (attrType == "outer.recto") {
            att.SetOuterRecto(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "inner.verso") {
            att.SetInnerVerso(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "inner.recto") {
            att.SetInnerRecto(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "outer.verso") {
            att.SetOuterVerso(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_FOLIUMSURFACES)) {
        const att = element;
        assertAtt(att);
        if (attrType == "recto") {
            att.SetRecto(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "verso") {
            att.SetVerso(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PERFRES)) {
        const att = element;
        assertAtt(att);
        if (attrType == "solo") {
            att.SetSolo(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PERFRESBASIC)) {
        const att = element;
        assertAtt(att);
        if (attrType == "count") {
            att.SetCount(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_RECORDTYPE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "recordtype") {
            att.SetRecordtype(att.StrToRecordTypeRecordtype(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_REGULARMETHOD)) {
        const att = element;
        assertAtt(att);
        if (attrType == "method") {
            att.SetMethod(att.StrToRegularMethodMethod(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetHeader(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_ADLIBITUM)) {
        const att = element;
        assertAtt(att);
        if (att.HasAdlib()) {
            attributes.push(["adlib", att.BooleanToStr(att.GetAdlib())]);
        }
    }
    if (element.HasAttClass(ATT_BIFOLIUMSURFACES)) {
        const att = element;
        assertAtt(att);
        if (att.HasOuterRecto()) {
            attributes.push(["outer.recto", att.StrToStr(att.GetOuterRecto())]);
        }
        if (att.HasInnerVerso()) {
            attributes.push(["inner.verso", att.StrToStr(att.GetInnerVerso())]);
        }
        if (att.HasInnerRecto()) {
            attributes.push(["inner.recto", att.StrToStr(att.GetInnerRecto())]);
        }
        if (att.HasOuterVerso()) {
            attributes.push(["outer.verso", att.StrToStr(att.GetOuterVerso())]);
        }
    }
    if (element.HasAttClass(ATT_FOLIUMSURFACES)) {
        const att = element;
        assertAtt(att);
        if (att.HasRecto()) {
            attributes.push(["recto", att.StrToStr(att.GetRecto())]);
        }
        if (att.HasVerso()) {
            attributes.push(["verso", att.StrToStr(att.GetVerso())]);
        }
    }
    if (element.HasAttClass(ATT_PERFRES)) {
        const att = element;
        assertAtt(att);
        if (att.HasSolo()) {
            attributes.push(["solo", att.BooleanToStr(att.GetSolo())]);
        }
    }
    if (element.HasAttClass(ATT_PERFRESBASIC)) {
        const att = element;
        assertAtt(att);
        if (att.HasCount()) {
            attributes.push(["count", att.IntToStr(att.GetCount())]);
        }
    }
    if (element.HasAttClass(ATT_RECORDTYPE)) {
        const att = element;
        assertAtt(att);
        if (att.HasRecordtype()) {
            attributes.push(["recordtype", att.RecordTypeRecordtypeToStr(att.GetRecordtype())]);
        }
    }
    if (element.HasAttClass(ATT_REGULARMETHOD)) {
        const att = element;
        assertAtt(att);
        if (att.HasMethod()) {
            attributes.push(["method", att.RegularMethodMethodToStr(att.GetMethod())]);
        }
    }

  }

  static CopyHeader(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_ADLIBITUM)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAdlib(att.GetAdlib());
    }
    if (element.HasAttClass(ATT_BIFOLIUMSURFACES)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetOuterRecto(att.GetOuterRecto());
        attTarget.SetInnerVerso(att.GetInnerVerso());
        attTarget.SetInnerRecto(att.GetInnerRecto());
        attTarget.SetOuterVerso(att.GetOuterVerso());
    }
    if (element.HasAttClass(ATT_FOLIUMSURFACES)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetRecto(att.GetRecto());
        attTarget.SetVerso(att.GetVerso());
    }
    if (element.HasAttClass(ATT_PERFRES)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSolo(att.GetSolo());
    }
    if (element.HasAttClass(ATT_PERFRESBASIC)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCount(att.GetCount());
    }
    if (element.HasAttClass(ATT_RECORDTYPE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetRecordtype(att.GetRecordtype());
    }
    if (element.HasAttClass(ATT_REGULARMETHOD)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMethod(att.GetMethod());
    }

  }

  static SetMensural(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_DURATIONQUALITY)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        if (attrType == "dur.quality") {
            att.SetDurQuality(att.StrToDurqualityMensural(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MENSURALLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "proport.num") {
            att.SetProportNum(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "proport.numbase") {
            att.SetProportNumbase(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MENSURALSHARED)) {
        const att = element;
        assertAtt(att);
        if (attrType == "modusmaior") {
            att.SetModusmaior(att.StrToModusmaior(attrValue));
            return true;
        }
        if (attrType == "modusminor") {
            att.SetModusminor(att.StrToModusminor(attrValue));
            return true;
        }
        if (attrType == "prolatio") {
            att.SetProlatio(att.StrToProlatio(attrValue));
            return true;
        }
        if (attrType == "tempus") {
            att.SetTempus(att.StrToTempus(attrValue));
            return true;
        }
        if (attrType == "divisio") {
            att.SetDivisio(att.StrToDivisio(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_NOTEVISMENSURAL)) {
        const att = element;
        assertAtt(att);
        if (attrType == "lig") {
            att.SetLig(att.StrToLigatureform(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_RESTVISMENSURAL)) {
        const att = element;
        assertAtt(att);
        if (attrType == "spaces") {
            att.SetSpaces(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STEMSMENSURAL)) {
        const att = element;
        assertAtt(att);
        if (attrType == "stem.form") {
            att.SetStemForm(att.StrToStemformMensural(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetMensural(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_DURATIONQUALITY)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        if (att.HasDurQuality()) {
            attributes.push(["dur.quality", att.DurqualityMensuralToStr(att.GetDurQuality())]);
        }
    }
    if (element.HasAttClass(ATT_MENSURALLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasProportNum()) {
            attributes.push(["proport.num", att.IntToStr(att.GetProportNum())]);
        }
        if (att.HasProportNumbase()) {
            attributes.push(["proport.numbase", att.IntToStr(att.GetProportNumbase())]);
        }
    }
    if (element.HasAttClass(ATT_MENSURALSHARED)) {
        const att = element;
        assertAtt(att);
        if (att.HasModusmaior()) {
            attributes.push(["modusmaior", att.ModusmaiorToStr(att.GetModusmaior())]);
        }
        if (att.HasModusminor()) {
            attributes.push(["modusminor", att.ModusminorToStr(att.GetModusminor())]);
        }
        if (att.HasProlatio()) {
            attributes.push(["prolatio", att.ProlatioToStr(att.GetProlatio())]);
        }
        if (att.HasTempus()) {
            attributes.push(["tempus", att.TempusToStr(att.GetTempus())]);
        }
        if (att.HasDivisio()) {
            attributes.push(["divisio", att.DivisioToStr(att.GetDivisio())]);
        }
    }
    if (element.HasAttClass(ATT_NOTEVISMENSURAL)) {
        const att = element;
        assertAtt(att);
        if (att.HasLig()) {
            attributes.push(["lig", att.LigatureformToStr(att.GetLig())]);
        }
    }
    if (element.HasAttClass(ATT_RESTVISMENSURAL)) {
        const att = element;
        assertAtt(att);
        if (att.HasSpaces()) {
            attributes.push(["spaces", att.IntToStr(att.GetSpaces())]);
        }
    }
    if (element.HasAttClass(ATT_STEMSMENSURAL)) {
        const att = element;
        assertAtt(att);
        if (att.HasStemForm()) {
            attributes.push(["stem.form", att.StemformMensuralToStr(att.GetStemForm())]);
        }
    }

  }

  static CopyMensural(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_DURATIONQUALITY)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        const attTarget = resolveAttDuration(target);
        assertAtt(attTarget);
        attTarget.SetDurQuality(att.GetDurQuality());
    }
    if (element.HasAttClass(ATT_MENSURALLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetProportNum(att.GetProportNum());
        attTarget.SetProportNumbase(att.GetProportNumbase());
    }
    if (element.HasAttClass(ATT_MENSURALSHARED)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetModusmaior(att.GetModusmaior());
        attTarget.SetModusminor(att.GetModusminor());
        attTarget.SetProlatio(att.GetProlatio());
        attTarget.SetTempus(att.GetTempus());
        attTarget.SetDivisio(att.GetDivisio());
    }
    if (element.HasAttClass(ATT_NOTEVISMENSURAL)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLig(att.GetLig());
    }
    if (element.HasAttClass(ATT_RESTVISMENSURAL)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSpaces(att.GetSpaces());
    }
    if (element.HasAttClass(ATT_STEMSMENSURAL)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetStemForm(att.GetStemForm());
    }

  }

  static SetMidi(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_CHANNELIZED)) {
        const att = element;
        assertAtt(att);
        if (attrType == "midi.channel") {
            att.SetMidiChannel(att.StrToMidichannel(attrValue));
            return true;
        }
        if (attrType == "midi.duty") {
            att.SetMidiDuty(att.StrToPercentLimited(attrValue));
            return true;
        }
        if (attrType == "midi.port") {
            att.SetMidiPort(att.StrToMidivalueName(attrValue));
            return true;
        }
        if (attrType == "midi.track") {
            att.SetMidiTrack(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_INSTRUMENTIDENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "instr") {
            att.SetInstr(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MIDIINSTRUMENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "midi.instrnum") {
            att.SetMidiInstrnum(att.StrToMidivalue(attrValue));
            return true;
        }
        if (attrType == "midi.instrname") {
            att.SetMidiInstrname(att.StrToMidinames(attrValue));
            return true;
        }
        if (attrType == "midi.pan") {
            att.SetMidiPan(att.StrToMidivaluePan(attrValue));
            return true;
        }
        if (attrType == "midi.patchname") {
            att.SetMidiPatchname(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "midi.patchnum") {
            att.SetMidiPatchnum(att.StrToMidivalue(attrValue));
            return true;
        }
        if (attrType == "midi.volume") {
            att.SetMidiVolume(att.StrToPercent(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MIDINUMBER)) {
        const att = element;
        assertAtt(att);
        if (attrType == "num") {
            att.SetNum(att.StrToMidivalue(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MIDITEMPO)) {
        const att = element;
        assertAtt(att);
        if (attrType == "midi.bpm") {
            att.SetMidiBpm(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "midi.mspb") {
            att.SetMidiMspb(att.StrToMidimspb(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MIDIVALUE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "val") {
            att.SetVal(att.StrToMidivalue(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MIDIVALUE2)) {
        const att = element;
        assertAtt(att);
        if (attrType == "val2") {
            att.SetVal2(att.StrToMidivalue(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MIDIVELOCITY)) {
        const att = element;
        assertAtt(att);
        if (attrType == "vel") {
            att.SetVel(att.StrToMidivalue(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TIMEBASE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "ppq") {
            att.SetPpq(att.StrToInt(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetMidi(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_CHANNELIZED)) {
        const att = element;
        assertAtt(att);
        if (att.HasMidiChannel()) {
            attributes.push(["midi.channel", att.MidichannelToStr(att.GetMidiChannel())]);
        }
        if (att.HasMidiDuty()) {
            attributes.push(["midi.duty", att.PercentLimitedToStr(att.GetMidiDuty())]);
        }
        if (att.HasMidiPort()) {
            attributes.push(["midi.port", att.MidivalueNameToStr(att.GetMidiPort())]);
        }
        if (att.HasMidiTrack()) {
            attributes.push(["midi.track", att.IntToStr(att.GetMidiTrack())]);
        }
    }
    if (element.HasAttClass(ATT_INSTRUMENTIDENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasInstr()) {
            attributes.push(["instr", att.StrToStr(att.GetInstr())]);
        }
    }
    if (element.HasAttClass(ATT_MIDIINSTRUMENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasMidiInstrnum()) {
            attributes.push(["midi.instrnum", att.MidivalueToStr(att.GetMidiInstrnum())]);
        }
        if (att.HasMidiInstrname()) {
            // TS InstrDef stores the name string (C++ data_MIDINAMES enum);
            // write it directly instead of MidinamesToStr(number).
            const nm = att.GetMidiInstrname();
            attributes.push(["midi.instrname", typeof nm === 'number' ? att.MidinamesToStr(nm) : att.StrToStr(nm)]);
        }
        if (att.HasMidiPan()) {
            attributes.push(["midi.pan", att.MidivaluePanToStr(att.GetMidiPan())]);
        }
        if (att.HasMidiPatchname()) {
            attributes.push(["midi.patchname", att.StrToStr(att.GetMidiPatchname())]);
        }
        if (att.HasMidiPatchnum()) {
            attributes.push(["midi.patchnum", att.MidivalueToStr(att.GetMidiPatchnum())]);
        }
        if (att.HasMidiVolume()) {
            attributes.push(["midi.volume", att.PercentToStr(att.GetMidiVolume())]);
        }
    }
    if (element.HasAttClass(ATT_MIDINUMBER)) {
        const att = element;
        assertAtt(att);
        if (att.HasNum()) {
            attributes.push(["num", att.MidivalueToStr(att.GetNum())]);
        }
    }
    if (element.HasAttClass(ATT_MIDITEMPO)) {
        const att = element;
        assertAtt(att);
        if (att.HasMidiBpm()) {
            attributes.push(["midi.bpm", att.DblToStr(att.GetMidiBpm())]);
        }
        if (att.HasMidiMspb()) {
            attributes.push(["midi.mspb", att.MidimspbToStr(att.GetMidiMspb())]);
        }
    }
    if (element.HasAttClass(ATT_MIDIVALUE)) {
        const att = element;
        assertAtt(att);
        if (att.HasVal()) {
            attributes.push(["val", att.MidivalueToStr(att.GetVal())]);
        }
    }
    if (element.HasAttClass(ATT_MIDIVALUE2)) {
        const att = element;
        assertAtt(att);
        if (att.HasVal2()) {
            attributes.push(["val2", att.MidivalueToStr(att.GetVal2())]);
        }
    }
    if (element.HasAttClass(ATT_MIDIVELOCITY)) {
        const att = element;
        assertAtt(att);
        if (att.HasVel()) {
            attributes.push(["vel", att.MidivalueToStr(att.GetVel())]);
        }
    }
    if (element.HasAttClass(ATT_TIMEBASE)) {
        const att = element;
        assertAtt(att);
        if (att.HasPpq()) {
            attributes.push(["ppq", att.IntToStr(att.GetPpq())]);
        }
    }

  }

  static CopyMidi(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_CHANNELIZED)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMidiChannel(att.GetMidiChannel());
        attTarget.SetMidiDuty(att.GetMidiDuty());
        attTarget.SetMidiPort(att.GetMidiPort());
        attTarget.SetMidiTrack(att.GetMidiTrack());
    }
    if (element.HasAttClass(ATT_INSTRUMENTIDENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetInstr(att.GetInstr());
    }
    if (element.HasAttClass(ATT_MIDIINSTRUMENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMidiInstrnum(att.GetMidiInstrnum());
        attTarget.SetMidiInstrname(att.GetMidiInstrname());
        attTarget.SetMidiPan(att.GetMidiPan());
        attTarget.SetMidiPatchname(att.GetMidiPatchname());
        attTarget.SetMidiPatchnum(att.GetMidiPatchnum());
        attTarget.SetMidiVolume(att.GetMidiVolume());
    }
    if (element.HasAttClass(ATT_MIDINUMBER)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetNum(att.GetNum());
    }
    if (element.HasAttClass(ATT_MIDITEMPO)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMidiBpm(att.GetMidiBpm());
        attTarget.SetMidiMspb(att.GetMidiMspb());
    }
    if (element.HasAttClass(ATT_MIDIVALUE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetVal(att.GetVal());
    }
    if (element.HasAttClass(ATT_MIDIVALUE2)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetVal2(att.GetVal2());
    }
    if (element.HasAttClass(ATT_MIDIVELOCITY)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetVel(att.GetVel());
    }
    if (element.HasAttClass(ATT_TIMEBASE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetPpq(att.GetPpq());
    }

  }

  static SetNeumes(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_DIVLINELOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToDivLineLogForm(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_NCLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "oct") {
            att.SetOct(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "pname") {
            att.SetPname(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_NCFORM)) {
        const att = element;
        assertAtt(att);
        if (attrType == "angled") {
            att.SetAngled(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "con") {
            att.SetCon(att.StrToNcFormCon(attrValue));
            return true;
        }
        if (attrType == "hooked") {
            att.SetHooked(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "ligated") {
            att.SetLigated(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "rellen") {
            att.SetRellen(att.StrToNcFormRellen(attrValue));
            return true;
        }
        if (attrType == "sShape") {
            att.SetSShape(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "tilt") {
            att.SetTilt(att.StrToCompassdirection(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_NEUMETYPE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "type") {
            att.SetType(att.StrToStr(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetNeumes(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_DIVLINELOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.DivLineLogFormToStr(att.GetForm())]);
        }
    }
    if (element.HasAttClass(ATT_NCLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasOct()) {
            attributes.push(["oct", att.StrToStr(att.GetOct())]);
        }
        if (att.HasPname()) {
            attributes.push(["pname", att.StrToStr(att.GetPname())]);
        }
    }
    if (element.HasAttClass(ATT_NCFORM)) {
        const att = resolveAttNcform(element);
        assertAtt(att);
        if (att.HasAngled()) {
            attributes.push(["angled", att.BooleanToStr(att.GetAngled())]);
        }
        if (att.HasCon()) {
            attributes.push(["con", att.NcFormConToStr(att.GetCon())]);
        }
        if (att.HasHooked()) {
            attributes.push(["hooked", att.BooleanToStr(att.GetHooked())]);
        }
        if (att.HasLigated()) {
            attributes.push(["ligated", att.BooleanToStr(att.GetLigated())]);
        }
        if (att.HasRellen()) {
            attributes.push(["rellen", att.NcFormRellenToStr(att.GetRellen())]);
        }
        if (att.HasSShape()) {
            attributes.push(["sShape", att.StrToStr(att.GetSShape())]);
        }
        if (att.HasTilt()) {
            attributes.push(["tilt", att.CompassdirectionToStr(att.GetTilt())]);
        }
    }
    if (element.HasAttClass(ATT_NEUMETYPE)) {
        const att = element;
        assertAtt(att);
        if (att.HasType()) {
            attributes.push(["type", att.StrToStr(att.GetType())]);
        }
    }

  }

  static CopyNeumes(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_DIVLINELOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
    }
    if (element.HasAttClass(ATT_NCLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetOct(att.GetOct());
        attTarget.SetPname(att.GetPname());
    }
    if (element.HasAttClass(ATT_NCFORM)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAngled(att.GetAngled());
        attTarget.SetCon(att.GetCon());
        attTarget.SetHooked(att.GetHooked());
        attTarget.SetLigated(att.GetLigated());
        attTarget.SetRellen(att.GetRellen());
        attTarget.SetSShape(att.GetSShape());
        attTarget.SetTilt(att.GetTilt());
    }
    if (element.HasAttClass(ATT_NEUMETYPE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetType(att.GetType());
    }

  }

  static SetPagebased(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_MARGINS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "topmar") {
            att.SetTopmar(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
        if (attrType == "botmar") {
            att.SetBotmar(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
        if (attrType == "leftmar") {
            att.SetLeftmar(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
        if (attrType == "rightmar") {
            att.SetRightmar(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetPagebased(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_MARGINS)) {
        const att = element;
        assertAtt(att);
        if (att.HasTopmar()) {
            attributes.push(["topmar", att.MeasurementunsignedToStr(att.GetTopmar())]);
        }
        if (att.HasBotmar()) {
            attributes.push(["botmar", att.MeasurementunsignedToStr(att.GetBotmar())]);
        }
        if (att.HasLeftmar()) {
            attributes.push(["leftmar", att.MeasurementunsignedToStr(att.GetLeftmar())]);
        }
        if (att.HasRightmar()) {
            attributes.push(["rightmar", att.MeasurementunsignedToStr(att.GetRightmar())]);
        }
    }

  }

  static CopyPagebased(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_MARGINS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTopmar(att.GetTopmar());
        attTarget.SetBotmar(att.GetBotmar());
        attTarget.SetLeftmar(att.GetLeftmar());
        attTarget.SetRightmar(att.GetRightmar());
    }

  }

  static SetPerformance(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_ALIGNMENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "when") {
            att.SetWhen(att.StrToStr(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetPerformance(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_ALIGNMENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasWhen()) {
            attributes.push(["when", att.StrToStr(att.GetWhen())]);
        }
    }

  }

  static CopyPerformance(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_ALIGNMENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetWhen(att.GetWhen());
    }

  }


  static SetShared(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    const handler = SHARED_SET_HANDLERS.get(attrType);
    // ponytail: fast reject for attrs outside the Shared group (P28).
    // setAttr's memo union probes SetShared for every attr (e.g. cmn-only
    // names); without this the 149-deep legacy chain ran to false each time
    // (mei/033: legacySetShared 75ms self). 'label' stays known: its block
    // is exotic and lives in legacySetShared.
    if (handler !== undefined) return handler(element, attrValue) || AttModule.legacySetShared(element, attrType, attrValue);
    if (attrType !== 'label') return false;
    return AttModule.legacySetShared(element, attrType, attrValue);
  }

  static legacySetShared(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    // ponytail: per-attr dispatch (Q12) replaces the 149-deep chain walk.
    // Same order, same stmts (generated verbatim above); old chain kept as
    // fallback for attrs added later without regenerating the map.
    const handler = LEGACY_SET_HANDLERS.get(attrType);
    if (handler !== undefined) return handler(element, attrValue);
    return AttModule.legacySetSharedChain(element, attrType, attrValue);
  }

  static legacySetSharedChain(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_ACCIDENTAL)) {
        const att = element;
        assertAtt(att);
        if (attrType == "accid") {
            att.SetAccid(att.StrToAccidentalWritten(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_AUGMENTDOTS)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        if (attrType == "dots") {
            att.SetDots(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_CANONICAL)) {
        const att = element;
        assertAtt(att);
        if (attrType == "codedval") {
            att.SetCodedval(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_CURVATURE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "bezier") {
            att.SetBezier(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "bulge") {
            att.SetBulge(att.StrToBulge(attrValue));
            return true;
        }
        if (attrType == "curvedir") {
            att.SetCurvedir(att.StrToCurvatureCurvedir(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_DURATIONADDITIVE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "dur") {
            att.SetDur(att.StrToDuration(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_DURATIONLOG)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        if (attrType == "dur") {
            att.SetDur(att.StrToDuration(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_NINTEGER)) {
        const att = element;
        assertAtt(att);
        if (attrType == "n") {
            att.SetN(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_NNUMBERLIKE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "n") {
            att.SetN(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_OCTAVE)) {
        const att = resolveAttPitch(element);
        assertAtt(att);
        if (attrType == "oct") {
            att.SetOct(att.StrToOctave(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PITCH)) {
        const att = resolveAttPitch(element);
        assertAtt(att);
        if (attrType == "pname") {
            att.SetPname(att.StrToPitchname(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PLACEMENTRELEVENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "place") {
            att.SetPlace(att.StrToStaffrel(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PLACEMENTRELSTAFF)) {
        const att = resolveAttPlacementRelStaff(element);
        assertAtt(att);
        if (attrType == "place") {
            att.SetPlace(att.StrToStaffrel(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_RESTDURATIONLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "dur") {
            att.SetDur(att.StrToDuration(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STAFFIDENT)) {
        const att = resolveAttStaffIdent(element);
        assertAtt(att);
        if (attrType == "staff") {
            att.SetStaff(att.StrToXsdPositiveIntegerList(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STARTENDID)) {
        const att = resolveAttTimeSpanning(element);
        assertAtt(att);
        if (attrType == "endid") {
            att.SetEndid(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STARTID)) {
        const att = resolveAttTimePoint(element);
        assertAtt(att);
        if (attrType == "startid") {
            att.SetStartid(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STEMS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "stem.dir") {
            att.SetStemDir(att.StrToStemdirection(attrValue));
            return true;
        }
        if (attrType == "stem.len") {
            att.SetStemLen(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "stem.mod") {
            att.SetStemMod(att.StrToStemmodifier(attrValue));
            return true;
        }
        if (attrType == "stem.pos") {
            att.SetStemPos(att.StrToStemposition(attrValue));
            return true;
        }
        if (attrType == "stem.sameas") {
            att.SetStemSameas(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "stem.visible") {
            att.SetStemVisible(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "stem.x") {
            att.SetStemX(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "stem.y") {
            att.SetStemY(att.StrToDbl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TIMESTAMPLOG)) {
        const att = resolveAttTimePoint(element);
        assertAtt(att);
        if (attrType == "tstamp") {
            att.SetTstamp(att.StrToDbl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TIMESTAMP2LOG)) {
        const att = resolveAttTimeSpanning(element);
        assertAtt(att);
        if (attrType == "tstamp2") {
            att.SetTstamp2(att.StrToMeasurebeat(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TYPOGRAPHY)) {
        const att = element;
        assertAtt(att);
        if (attrType == "fontfam") {
            att.SetFontfam(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "fontname") {
            att.SetFontname(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "fontsize") {
            att.SetFontsize(att.StrToFontsize(attrValue));
            return true;
        }
        if (attrType == "fontstyle") {
            att.SetFontstyle(att.StrToFontstyle(attrValue));
            return true;
        }
        if (attrType == "fontweight") {
            att.SetFontweight(att.StrToFontweight(attrValue));
            return true;
        }
        if (attrType == "letterspacing") {
            att.SetLetterspacing(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "lineheight") {
            att.SetLineheight(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ACCIDLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "func") {
            att.SetFunc(att.StrToAccidLogFunc(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ANNOTLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "func") {
            att.SetFunc(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ARTICULATION)) {
        const att = element;
        assertAtt(att);
        if (attrType == "artic") {
            att.SetArtic(att.StrToArticulationList(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ATTACCALOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "target") {
            att.SetTarget(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_AUDIENCE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "audience") {
            att.SetAudience(att.StrToAudienceAudience(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_AUTHORIZED)) {
        const att = element;
        assertAtt(att);
        if (attrType == "auth") {
            att.SetAuth(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "auth.uri") {
            att.SetAuthUri(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BARLINELOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToBarrendition(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BARRING)) {
        const att = element;
        assertAtt(att);
        if (attrType == "bar.len") {
            att.SetBarLen(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "bar.method") {
            att.SetBarMethod(att.StrToBarmethod(attrValue));
            return true;
        }
        if (attrType == "bar.place") {
            att.SetBarPlace(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BASIC)) {
        const att = element;
        assertAtt(att);
        if (attrType == "xml:base") {
            att.SetBase(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BIBL)) {
        const att = element;
        assertAtt(att);
        if (attrType == "analog") {
            att.SetAnalog(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_CALENDARED)) {
        const att = element;
        assertAtt(att);
        if (attrType == "calendar") {
            att.SetCalendar(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_CLASSED)) {
        const att = element;
        assertAtt(att);
        if (attrType == "class") {
            att.SetClass(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_CLEFLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "cautionary") {
            att.SetCautionary(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_CLEFSHAPE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "shape") {
            att.SetShape(att.StrToClefshape(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_CLEFFINGLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "clef.shape") {
            att.SetClefShape(att.StrToClefshape(attrValue));
            return true;
        }
        if (attrType == "clef.line") {
            att.SetClefLine(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "clef.dis") {
            att.SetClefDis(att.StrToOctaveDis(attrValue));
            return true;
        }
        if (attrType == "clef.dis.place") {
            att.SetClefDisPlace(att.StrToStaffrelBasic(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_COLOR)) {
        const att = element;
        assertAtt(att);
        if (attrType == "color") {
            att.SetColor(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_COLORATION)) {
        const att = element;
        assertAtt(att);
        if (attrType == "colored") {
            att.SetColored(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_COORDX1)) {
        const att = element;
        assertAtt(att);
        if (attrType == "coord.x1") {
            att.SetCoordX1(att.StrToDbl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_COORDX2)) {
        const att = element;
        assertAtt(att);
        if (attrType == "coord.x2") {
            att.SetCoordX2(att.StrToDbl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_COORDY1)) {
        const att = element;
        assertAtt(att);
        if (attrType == "coord.y1") {
            att.SetCoordY1(att.StrToDbl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_COORDINATED)) {
        const att = element;
        assertAtt(att);
        if (attrType == "lrx") {
            att.SetLrx(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "lry") {
            att.SetLry(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "rotate") {
            att.SetRotate(att.StrToDegrees(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_COORDINATEDUL)) {
        const att = element;
        assertAtt(att);
        if (attrType == "ulx") {
            att.SetUlx(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "uly") {
            att.SetUly(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_CUE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "cue") {
            att.SetCue(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_CUSTOSLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "target") {
            att.SetTarget(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_DATAPOINTING)) {
        const att = element;
        assertAtt(att);
        if (attrType == "data") {
            att.SetData(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_DATASELECTING)) {
        const att = element;
        assertAtt(att);
        if (attrType == "select") {
            att.SetSelect(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_DATABLE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "enddate") {
            att.SetEnddate(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "isodate") {
            att.SetIsodate(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "notafter") {
            att.SetNotafter(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "notbefore") {
            att.SetNotbefore(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "startdate") {
            att.SetStartdate(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_DISTANCES)) {
        const att = element;
        assertAtt(att);
        if (attrType == "dir.dist") {
            att.SetDirDist(att.StrToMeasurementsigned(attrValue));
            return true;
        }
        if (attrType == "dynam.dist") {
            att.SetDynamDist(att.StrToMeasurementsigned(attrValue));
            return true;
        }
        if (attrType == "harm.dist") {
            att.SetHarmDist(att.StrToMeasurementsigned(attrValue));
            return true;
        }
        if (attrType == "reh.dist") {
            att.SetRehDist(att.StrToMeasurementsigned(attrValue));
            return true;
        }
        if (attrType == "tempo.dist") {
            att.SetTempoDist(att.StrToMeasurementsigned(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_DOCSTATUS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "status") {
            att.SetStatus(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_DOTLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToDotLogForm(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_DURATIONDEFAULT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "dur.default") {
            att.SetDurDefault(att.StrToDuration(attrValue));
            return true;
        }
        if (attrType == "num.default") {
            att.SetNumDefault(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "numbase.default") {
            att.SetNumbaseDefault(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_DURATIONRATIO)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        if (attrType == "num") {
            att.SetNum(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "numbase") {
            att.SetNumbase(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ENCLOSINGCHARS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "enclose") {
            att.SetEnclose(att.StrToEnclosure(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ENDINGS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "ending.rend") {
            att.SetEndingRend(att.StrToEndingsEndingrend(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_EVIDENCE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "cert") {
            att.SetCert(att.StrToCertainty(attrValue));
            return true;
        }
        if (attrType == "evidence") {
            att.SetEvidence(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_EXTENDER)) {
        const att = element;
        assertAtt(att);
        if (attrType == "extender") {
            att.SetExtender(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_EXTENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "extent") {
            att.SetExtent(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_FERMATAPRESENT)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        if (attrType == "fermata") {
            att.SetFermata(att.StrToStaffrelBasic(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_FILING)) {
        const att = element;
        assertAtt(att);
        if (attrType == "nonfiling") {
            att.SetNonfiling(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_FORMEWORK)) {
        const att = element;
        assertAtt(att);
        if (attrType == "func") {
            att.SetFunc(att.StrToPgfunc(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_GRPSYMLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "level") {
            att.SetLevel(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_HANDIDENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "hand") {
            att.SetHand(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_HEIGHT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "height") {
            att.SetHeight(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_HORIZONTALALIGN)) {
        const att = resolveAttAreaPos(element);
        assertAtt(att);
        if (attrType == "halign") {
            att.SetHalign(att.StrToHorizontalalignment(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_INTERNETMEDIA)) {
        const att = element;
        assertAtt(att);
        if (attrType == "mimetype") {
            att.SetMimetype(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_JOINED)) {
        const att = element;
        assertAtt(att);
        if (attrType == "join") {
            att.SetJoin(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_KEYSIGLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "sig") {
            att.SetSig(att.StrToKeysignature(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_KEYSIGDEFAULTLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "keysig") {
            att.SetKeysig(att.StrToKeysignature(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_LABELLED)) {
        const att = resolveAttLabelled(element);
        assertAtt(att);
        if (attrType == "label") {
            att.SetLabel(att.StrToStr ? att.StrToStr(attrValue) : attrValue);
            return true;
        }
    }
    if (element.HasAttClass(ATT_LANG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "xml:lang") {
            att.SetLang(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "translit") {
            att.SetTranslit(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_LAYERLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "def") {
            att.SetDef(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_LAYERIDENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "layer") {
            att.SetLayer(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_LINELOC)) {
        const att = element;
        assertAtt(att);
        if (attrType == "line") {
            att.SetLine(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_LINEREND)) {
        const att = element;
        assertAtt(att);
        if (attrType == "lendsym") {
            att.SetLendsym(att.StrToLinestartendsymbol(attrValue));
            return true;
        }
        if (attrType == "lendsym.size") {
            att.SetLendsymSize(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "lstartsym") {
            att.SetLstartsym(att.StrToLinestartendsymbol(attrValue));
            return true;
        }
        if (attrType == "lstartsym.size") {
            att.SetLstartsymSize(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_LINERENDBASE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "lform") {
            att.SetLform(att.StrToLineform(attrValue));
            return true;
        }
        if (attrType == "lwidth") {
            att.SetLwidth(att.StrToLinewidth(attrValue));
            return true;
        }
        if (attrType == "lsegs") {
            att.SetLsegs(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_LINKING)) {
        const att = resolveAttLinking(element);
        assertAtt(att);
        if (attrType == "copyof") {
            att.SetCopyof(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "corresp") {
            att.SetCorresp(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "follows") {
            att.SetFollows(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "next") {
            att.SetNext(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "precedes") {
            att.SetPrecedes(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "prev") {
            att.SetPrev(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "sameas") {
            att.SetSameas(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "synch") {
            att.SetSynch(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_LYRICSTYLE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "lyric.align") {
            att.SetLyricAlign(att.StrToMeasurementsigned(attrValue));
            return true;
        }
        if (attrType == "lyric.fam") {
            att.SetLyricFam(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "lyric.name") {
            att.SetLyricName(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "lyric.size") {
            att.SetLyricSize(att.StrToFontsize(attrValue));
            return true;
        }
        if (attrType == "lyric.style") {
            att.SetLyricStyle(att.StrToFontstyle(attrValue));
            return true;
        }
        if (attrType == "lyric.weight") {
            att.SetLyricWeight(att.StrToFontweight(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MEASURENUMBERS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "mnum.visible") {
            att.SetMnumVisible(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MEASUREMENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "unit") {
            att.SetUnit(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MEDIABOUNDS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "begin") {
            att.SetBegin(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "end") {
            att.SetEnd(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "betype") {
            att.SetBetype(att.StrToBetype(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MEDIUM)) {
        const att = element;
        assertAtt(att);
        if (attrType == "medium") {
            att.SetMedium(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MEIVERSION)) {
        const att = element;
        assertAtt(att);
        if (attrType == "meiversion") {
            att.SetMeiversion(att.StrToMeiVersionMeiversion(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MENSURLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "level") {
            att.SetLevel(att.StrToDuration(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_METADATAPOINTING)) {
        const att = element;
        assertAtt(att);
        if (attrType == "decls") {
            att.SetDecls(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_METERCONFORMANCE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "metcon") {
            att.SetMetcon(att.StrToMeterConformanceMetcon(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_METERCONFORMANCEBAR)) {
        const att = element;
        assertAtt(att);
        if (attrType == "metcon") {
            att.SetMetcon(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "control") {
            att.SetControl(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_METERSIGLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "count") {
            att.SetCount(att.StrToMetercountPair(attrValue));
            return true;
        }
        if (attrType == "sym") {
            att.SetSym(att.StrToMetersign(attrValue));
            return true;
        }
        if (attrType == "unit") {
            att.SetUnit(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_METERSIGDEFAULTLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "meter.count") {
            att.SetMeterCount(att.StrToMetercountPair(attrValue));
            return true;
        }
        if (attrType == "meter.unit") {
            att.SetMeterUnit(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "meter.sym") {
            att.SetMeterSym(att.StrToMetersign(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MMTEMPO)) {
        const att = element;
        assertAtt(att);
        if (attrType == "mm") {
            att.SetMm(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "mm.unit") {
            att.SetMmUnit(att.StrToDuration(attrValue));
            return true;
        }
        if (attrType == "mm.dots") {
            att.SetMmDots(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MULTINUMMEASURES)) {
        const att = element;
        assertAtt(att);
        if (attrType == "multi.number") {
            att.SetMultiNumber(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_NAME)) {
        const att = element;
        assertAtt(att);
        if (attrType == "nymref") {
            att.SetNymref(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "role") {
            att.SetRole(att.StrToRelators(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_NOTATIONSTYLE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "music.name") {
            att.SetMusicName(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "music.size") {
            att.SetMusicSize(att.StrToFontsize(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_NOTEHEADS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "head.altsym") {
            att.SetHeadAltsym(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "head.auth") {
            att.SetHeadAuth(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "head.color") {
            att.SetHeadColor(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "head.fill") {
            att.SetHeadFill(att.StrToFill(attrValue));
            return true;
        }
        if (attrType == "head.fillcolor") {
            att.SetHeadFillcolor(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "head.mod") {
            att.SetHeadMod(att.StrToNoteheadmodifier(attrValue));
            return true;
        }
        if (attrType == "head.rotation") {
            att.SetHeadRotation(att.StrToRotation(attrValue));
            return true;
        }
        if (attrType == "head.shape") {
            att.SetHeadShape(att.StrToHeadshape(attrValue));
            return true;
        }
        if (attrType == "head.visible") {
            att.SetHeadVisible(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_OCTAVEDEFAULT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "oct.default") {
            att.SetOctDefault(att.StrToOctave(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_OCTAVEDISPLACEMENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "dis") {
            att.SetDis(att.StrToOctaveDis(attrValue));
            return true;
        }
        if (attrType == "dis.place") {
            att.SetDisPlace(att.StrToStaffrelBasic(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ONELINESTAFF)) {
        const att = element;
        assertAtt(att);
        if (attrType == "ontheline") {
            att.SetOntheline(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_OPTIMIZATION)) {
        const att = element;
        assertAtt(att);
        if (attrType == "optimize") {
            att.SetOptimize(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ORIGINLAYERIDENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "origin.layer") {
            att.SetOriginLayer(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ORIGINSTAFFIDENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "origin.staff") {
            att.SetOriginStaff(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ORIGINSTARTENDID)) {
        const att = element;
        assertAtt(att);
        if (attrType == "origin.startid") {
            att.SetOriginStartid(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "origin.endid") {
            att.SetOriginEndid(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ORIGINTIMESTAMPLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "origin.tstamp") {
            att.SetOriginTstamp(att.StrToMeasurebeat(attrValue));
            return true;
        }
        if (attrType == "origin.tstamp2") {
            att.SetOriginTstamp2(att.StrToMeasurebeat(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PAGES)) {
        const att = element;
        assertAtt(att);
        if (attrType == "page.height") {
            att.SetPageHeight(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
        if (attrType == "page.width") {
            att.SetPageWidth(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
        if (attrType == "page.topmar") {
            att.SetPageTopmar(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
        if (attrType == "page.botmar") {
            att.SetPageBotmar(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
        if (attrType == "page.leftmar") {
            att.SetPageLeftmar(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
        if (attrType == "page.rightmar") {
            att.SetPageRightmar(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
        if (attrType == "page.panels") {
            att.SetPagePanels(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "page.scale") {
            att.SetPageScale(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PARTIDENT)) {
        const att = resolveAttTimePoint(element);
        assertAtt(att);
        if (attrType == "part") {
            att.SetPart(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "partstaff") {
            att.SetPartstaff(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PLACEMENTONSTAFF)) {
        const att = element;
        assertAtt(att);
        if (attrType == "onstaff") {
            att.SetOnstaff(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PLIST)) {
        const att = resolveAttPlist(element);
        assertAtt(att);
        if (attrType == "plist") {
            att.SetPlist(att.StrToXsdAnyURIList(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_POINTING)) {
        const att = element;
        assertAtt(att);
        if (attrType == "xlink:actuate") {
            att.SetActuate(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "xlink:role") {
            att.SetRole(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "xlink:show") {
            att.SetShow(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "target") {
            att.SetTarget(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "targettype") {
            att.SetTargettype(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_QUANTITY)) {
        const att = element;
        assertAtt(att);
        if (attrType == "quantity") {
            att.SetQuantity(att.StrToDbl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_RANGING)) {
        const att = element;
        assertAtt(att);
        if (attrType == "atleast") {
            att.SetAtleast(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "atmost") {
            att.SetAtmost(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "min") {
            att.SetMin(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "max") {
            att.SetMax(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "confidence") {
            att.SetConfidence(att.StrToDbl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_REPEATMARKLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "func") {
            att.SetFunc(att.StrToRepeatMarkLogFunc(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_RESPONSIBILITY)) {
        const att = element;
        assertAtt(att);
        if (attrType == "resp") {
            att.SetResp(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SCALABLE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "scale") {
            att.SetScale(att.StrToPercent(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SEQUENCE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "seq") {
            att.SetSeq(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SLASHCOUNT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "slash") {
            att.SetSlash(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SLURPRESENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "slur") {
            att.SetSlur(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SOURCE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "source") {
            att.SetSource(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SPACING)) {
        const att = element;
        assertAtt(att);
        if (attrType == "spacing.packexp") {
            att.SetSpacingPackexp(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "spacing.packfact") {
            att.SetSpacingPackfact(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "spacing.staff") {
            att.SetSpacingStaff(att.StrToMeasurementsigned(attrValue));
            return true;
        }
        if (attrType == "spacing.system") {
            att.SetSpacingSystem(att.StrToMeasurementsigned(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STAFFLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "def") {
            att.SetDef(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STAFFDEFLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "lines") {
            att.SetLines(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STAFFGROUPINGSYM)) {
        const att = element;
        assertAtt(att);
        if (attrType == "symbol") {
            att.SetSymbol(att.StrToStaffGroupingSymSymbol(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STAFFITEMS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "aboveorder") {
            att.SetAboveorder(att.StrToStaffitem(attrValue));
            return true;
        }
        if (attrType == "beloworder") {
            att.SetBeloworder(att.StrToStaffitem(attrValue));
            return true;
        }
        if (attrType == "betweenorder") {
            att.SetBetweenorder(att.StrToStaffitem(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STAFFLOC)) {
        const att = resolveAttPosition(element);
        assertAtt(att);
        if (attrType == "loc") {
            att.SetLoc(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STAFFLOCPITCHED)) {
        const att = resolveAttPosition(element);
        assertAtt(att);
        if (attrType == "ploc") {
            att.SetPloc(att.StrToPitchname(attrValue));
            return true;
        }
        if (attrType == "oloc") {
            att.SetOloc(att.StrToOctave(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SYLLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "con") {
            att.SetCon(att.StrToSylLogCon(attrValue));
            return true;
        }
        if (attrType == "wordpos") {
            att.SetWordpos(att.StrToSylLogWordpos(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SYLTEXT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "syl") {
            att.SetSyl(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SYSTEMS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "system.leftline") {
            att.SetSystemLeftline(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "system.leftmar") {
            att.SetSystemLeftmar(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
        if (attrType == "system.rightmar") {
            att.SetSystemRightmar(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
        if (attrType == "system.topmar") {
            att.SetSystemTopmar(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TARGETEVAL)) {
        const att = element;
        assertAtt(att);
        if (attrType == "evaluate") {
            att.SetEvaluate(att.StrToTargetEvalEvaluate(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TEMPOLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "func") {
            att.SetFunc(att.StrToTempoLogFunc(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TEXTRENDITION)) {
        const att = element;
        assertAtt(att);
        if (attrType == "altrend") {
            att.SetAltrend(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "rend") {
            att.SetRend(att.StrToTextrendition(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TEXTSTYLE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "text.fam") {
            att.SetTextFam(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "text.name") {
            att.SetTextName(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "text.size") {
            att.SetTextSize(att.StrToFontsize(attrValue));
            return true;
        }
        if (attrType == "text.style") {
            att.SetTextStyle(att.StrToFontstyle(attrValue));
            return true;
        }
        if (attrType == "text.weight") {
            att.SetTextWeight(att.StrToFontweight(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TIEPRESENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "tie") {
            att.SetTie(att.StrToTie(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TRANSPOSITION)) {
        const att = element;
        assertAtt(att);
        if (attrType == "trans.diat") {
            att.SetTransDiat(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "trans.semi") {
            att.SetTransSemi(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TUNING)) {
        const att = element;
        assertAtt(att);
        if (attrType == "tune.Hz") {
            att.SetTuneHz(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "tune.pname") {
            att.SetTunePname(att.StrToPitchname(attrValue));
            return true;
        }
        if (attrType == "tune.temper") {
            att.SetTuneTemper(att.StrToTemperament(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TUNINGLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "tuning.standard") {
            att.SetTuningStandard(att.StrToCoursetuning(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TUPLETPRESENT)) {
        const att = element;
        assertAtt(att);
        if (attrType == "tuplet") {
            att.SetTuplet(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TYPED)) {
        const att = element;
        assertAtt(att);
        if (attrType == "type") {
            att.SetType(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_VERTICALALIGN)) {
        const att = resolveAttAreaPos(element);
        assertAtt(att);
        if (attrType == "valign") {
            att.SetValign(att.StrToVerticalalignment(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_VERTICALGROUP)) {
        const att = element;
        assertAtt(att);
        if (attrType == "vgrp") {
            att.SetVgrp(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_VISIBILITY)) {
        const att = element;
        assertAtt(att);
        if (attrType == "visible") {
            att.SetVisible(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_VISUALOFFSETHO)) {
        const att = resolveAttOffset(element);
        assertAtt(att);
        if (attrType == "ho") {
            att.SetHo(att.StrToMeasurementsigned(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_VISUALOFFSETTO)) {
        const att = resolveAttOffset(element);
        assertAtt(att);
        if (attrType == "to") {
            att.SetTo(att.StrToDbl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_VISUALOFFSETVO)) {
        const att = resolveAttOffset(element);
        assertAtt(att);
        if (attrType == "vo") {
            att.SetVo(att.StrToMeasurementsigned(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_VISUALOFFSET2HO)) {
        const att = resolveAttOffsetSpanning(element);
        assertAtt(att);
        if (attrType == "startho") {
            att.SetStartho(att.StrToMeasurementsigned(attrValue));
            return true;
        }
        if (attrType == "endho") {
            att.SetEndho(att.StrToMeasurementsigned(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_VISUALOFFSET2TO)) {
        const att = resolveAttOffsetSpanning(element);
        assertAtt(att);
        if (attrType == "startto") {
            att.SetStartto(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "endto") {
            att.SetEndto(att.StrToDbl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_VISUALOFFSET2VO)) {
        const att = resolveAttOffsetSpanning(element);
        assertAtt(att);
        if (attrType == "startvo") {
            att.SetStartvo(att.StrToMeasurementsigned(attrValue));
            return true;
        }
        if (attrType == "endvo") {
            att.SetEndvo(att.StrToMeasurementsigned(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_VOLTAGROUPINGSYM)) {
        const att = element;
        assertAtt(att);
        if (attrType == "voltasym") {
            att.SetVoltasym(att.StrToVoltaGroupingSymVoltasym(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_WHITESPACE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "xml:space") {
            att.SetSpace(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_WIDTH)) {
        const att = element;
        assertAtt(att);
        if (attrType == "width") {
            att.SetWidth(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_XY)) {
        const att = element;
        assertAtt(att);
        if (attrType == "x") {
            att.SetX(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "y") {
            att.SetY(att.StrToDbl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_XY2)) {
        const att = element;
        assertAtt(att);
        if (attrType == "x2") {
            att.SetX2(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "y2") {
            att.SetY2(att.StrToDbl(attrValue));
            return true;
        }
    }

    return false;

  
}

  static GetShared(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_ACCIDLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasFunc()) {
            attributes.push(["func", att.AccidLogFuncToStr(att.GetFunc())]);
        }
    }
    if (element.HasAttClass(ATT_ACCIDENTAL)) {
        const att = element;
        assertAtt(att);
        if (att.HasAccid()) {
            attributes.push(["accid", att.AccidentalWrittenToStr(att.GetAccid())]);
        }
    }
    if (element.HasAttClass(ATT_ANNOTLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasFunc()) {
            attributes.push(["func", att.StrToStr(att.GetFunc())]);
        }
    }
    if (element.HasAttClass(ATT_ARTICULATION)) {
        const att = element;
        assertAtt(att);
        if (att.HasArtic()) {
            attributes.push(["artic", att.ArticulationListToStr(att.GetArtic())]);
        }
    }
    if (element.HasAttClass(ATT_ATTACCALOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasTarget()) {
            attributes.push(["target", att.StrToStr(att.GetTarget())]);
        }
    }
    if (element.HasAttClass(ATT_AUDIENCE)) {
        const att = element;
        assertAtt(att);
        if (att.HasAudience()) {
            attributes.push(["audience", att.AudienceAudienceToStr(att.GetAudience())]);
        }
    }
    if (element.HasAttClass(ATT_AUGMENTDOTS)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        if (att.HasDots()) {
            attributes.push(["dots", att.IntToStr(att.GetDots())]);
        }
    }
    if (element.HasAttClass(ATT_AUTHORIZED)) {
        const att = element;
        assertAtt(att);
        if (att.HasAuth()) {
            attributes.push(["auth", att.StrToStr(att.GetAuth())]);
        }
        if (att.HasAuthUri()) {
            attributes.push(["auth.uri", att.StrToStr(att.GetAuthUri())]);
        }
    }
    if (element.HasAttClass(ATT_BARLINELOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.BarrenditionToStr(att.GetForm())]);
        }
    }
    if (element.HasAttClass(ATT_BARRING)) {
        const att = element;
        assertAtt(att);
        if (att.HasBarLen()) {
            attributes.push(["bar.len", att.DblToStr(att.GetBarLen())]);
        }
        if (att.HasBarMethod()) {
            attributes.push(["bar.method", att.BarmethodToStr(att.GetBarMethod())]);
        }
        if (att.HasBarPlace()) {
            attributes.push(["bar.place", att.IntToStr(att.GetBarPlace())]);
        }
    }
    if (element.HasAttClass(ATT_BASIC)) {
        const att = element;
        assertAtt(att);
        if (att.HasBase()) {
            attributes.push(["xml:base", att.StrToStr(att.GetBase())]);
        }
    }
    if (element.HasAttClass(ATT_BIBL)) {
        const att = element;
        assertAtt(att);
        if (att.HasAnalog()) {
            attributes.push(["analog", att.StrToStr(att.GetAnalog())]);
        }
    }
    if (element.HasAttClass(ATT_CALENDARED)) {
        const att = element;
        assertAtt(att);
        if (att.HasCalendar()) {
            attributes.push(["calendar", att.StrToStr(att.GetCalendar())]);
        }
    }
    if (element.HasAttClass(ATT_CANONICAL)) {
        const att = element;
        assertAtt(att);
        if (att.HasCodedval()) {
            attributes.push(["codedval", att.StrToStr(att.GetCodedval())]);
        }
    }
    if (element.HasAttClass(ATT_CLASSED)) {
        const att = element;
        assertAtt(att);
        if (att.HasClass()) {
            attributes.push(["class", att.StrToStr(att.GetClass())]);
        }
    }
    if (element.HasAttClass(ATT_CLEFLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasCautionary()) {
            attributes.push(["cautionary", att.BooleanToStr(att.GetCautionary())]);
        }
    }
    if (element.HasAttClass(ATT_CLEFSHAPE)) {
        const att = element;
        assertAtt(att);
        if (att.HasShape()) {
            attributes.push(["shape", att.ClefshapeToStr(att.GetShape())]);
        }
    }
    if (element.HasAttClass(ATT_CLEFFINGLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasClefShape()) {
            attributes.push(["clef.shape", att.ClefshapeToStr(att.GetClefShape())]);
        }
        if (att.HasClefLine()) {
            attributes.push(["clef.line", att.IntToStr(att.GetClefLine())]);
        }
        if (att.HasClefDis()) {
            attributes.push(["clef.dis", att.OctaveDisToStr(att.GetClefDis())]);
        }
        if (att.HasClefDisPlace()) {
            attributes.push(["clef.dis.place", att.StaffrelBasicToStr(att.GetClefDisPlace())]);
        }
    }
    if (element.HasAttClass(ATT_COLOR)) {
        const att = element;
        assertAtt(att);
        if (att.HasColor()) {
            attributes.push(["color", att.StrToStr(att.GetColor())]);
        }
    }
    if (element.HasAttClass(ATT_COLORATION)) {
        const att = element;
        assertAtt(att);
        if (att.HasColored()) {
            attributes.push(["colored", att.BooleanToStr(att.GetColored())]);
        }
    }
    if (element.HasAttClass(ATT_COORDX1)) {
        const att = element;
        assertAtt(att);
        if (att.HasCoordX1()) {
            attributes.push(["coord.x1", att.DblToStr(att.GetCoordX1())]);
        }
    }
    if (element.HasAttClass(ATT_COORDX2)) {
        const att = element;
        assertAtt(att);
        if (att.HasCoordX2()) {
            attributes.push(["coord.x2", att.DblToStr(att.GetCoordX2())]);
        }
    }
    if (element.HasAttClass(ATT_COORDY1)) {
        const att = element;
        assertAtt(att);
        if (att.HasCoordY1()) {
            attributes.push(["coord.y1", att.DblToStr(att.GetCoordY1())]);
        }
    }
    if (element.HasAttClass(ATT_COORDINATED)) {
        const att = element;
        assertAtt(att);
        if (att.HasLrx()) {
            attributes.push(["lrx", att.IntToStr(att.GetLrx())]);
        }
        if (att.HasLry()) {
            attributes.push(["lry", att.IntToStr(att.GetLry())]);
        }
        if (att.HasRotate()) {
            attributes.push(["rotate", att.DegreesToStr(att.GetRotate())]);
        }
    }
    if (element.HasAttClass(ATT_COORDINATEDUL)) {
        const att = element;
        assertAtt(att);
        if (att.HasUlx()) {
            attributes.push(["ulx", att.IntToStr(att.GetUlx())]);
        }
        if (att.HasUly()) {
            attributes.push(["uly", att.IntToStr(att.GetUly())]);
        }
    }
    if (element.HasAttClass(ATT_CUE)) {
        const att = element;
        assertAtt(att);
        if (att.HasCue()) {
            attributes.push(["cue", att.BooleanToStr(att.GetCue())]);
        }
    }
    if (element.HasAttClass(ATT_CURVATURE)) {
        const att = element;
        assertAtt(att);
        if (att.HasBezier()) {
            attributes.push(["bezier", att.StrToStr(att.GetBezier())]);
        }
        if (att.HasBulge()) {
            attributes.push(["bulge", att.BulgeToStr(att.GetBulge())]);
        }
        if (att.HasCurvedir()) {
            attributes.push(["curvedir", att.CurvatureCurvedirToStr(att.GetCurvedir())]);
        }
    }
    if (element.HasAttClass(ATT_CUSTOSLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasTarget()) {
            attributes.push(["target", att.StrToStr(att.GetTarget())]);
        }
    }
    if (element.HasAttClass(ATT_DATAPOINTING)) {
        const att = element;
        assertAtt(att);
        if (att.HasData()) {
            attributes.push(["data", att.StrToStr(att.GetData())]);
        }
    }
    if (element.HasAttClass(ATT_DATASELECTING)) {
        const att = element;
        assertAtt(att);
        if (att.HasSelect()) {
            attributes.push(["select", att.StrToStr(att.GetSelect())]);
        }
    }
    if (element.HasAttClass(ATT_DATABLE)) {
        const att = element;
        assertAtt(att);
        if (att.HasEnddate()) {
            attributes.push(["enddate", att.StrToStr(att.GetEnddate())]);
        }
        if (att.HasIsodate()) {
            attributes.push(["isodate", att.StrToStr(att.GetIsodate())]);
        }
        if (att.HasNotafter()) {
            attributes.push(["notafter", att.StrToStr(att.GetNotafter())]);
        }
        if (att.HasNotbefore()) {
            attributes.push(["notbefore", att.StrToStr(att.GetNotbefore())]);
        }
        if (att.HasStartdate()) {
            attributes.push(["startdate", att.StrToStr(att.GetStartdate())]);
        }
    }
    if (element.HasAttClass(ATT_DISTANCES)) {
        const att = element;
        assertAtt(att);
        if (att.HasDirDist()) {
            attributes.push(["dir.dist", att.MeasurementsignedToStr(att.GetDirDist())]);
        }
        if (att.HasDynamDist()) {
            attributes.push(["dynam.dist", att.MeasurementsignedToStr(att.GetDynamDist())]);
        }
        if (att.HasHarmDist()) {
            attributes.push(["harm.dist", att.MeasurementsignedToStr(att.GetHarmDist())]);
        }
        if (att.HasRehDist()) {
            attributes.push(["reh.dist", att.MeasurementsignedToStr(att.GetRehDist())]);
        }
        if (att.HasTempoDist()) {
            attributes.push(["tempo.dist", att.MeasurementsignedToStr(att.GetTempoDist())]);
        }
    }
    if (element.HasAttClass(ATT_DOCSTATUS)) {
        const att = element;
        assertAtt(att);
        if (att.HasStatus()) {
            attributes.push(["status", att.StrToStr(att.GetStatus())]);
        }
    }
    if (element.HasAttClass(ATT_DOTLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.DotLogFormToStr(att.GetForm())]);
        }
    }
    if (element.HasAttClass(ATT_DURATIONADDITIVE)) {
        const att = element;
        assertAtt(att);
        if (att.HasDur()) {
            attributes.push(["dur", att.DurationToStr(att.GetDur())]);
        }
    }
    if (element.HasAttClass(ATT_DURATIONDEFAULT)) {
        const att = element;
        assertAtt(att);
        if (att.HasDurDefault()) {
            attributes.push(["dur.default", att.DurationToStr(att.GetDurDefault())]);
        }
        if (att.HasNumDefault()) {
            attributes.push(["num.default", att.IntToStr(att.GetNumDefault())]);
        }
        if (att.HasNumbaseDefault()) {
            attributes.push(["numbase.default", att.IntToStr(att.GetNumbaseDefault())]);
        }
    }
    if (element.HasAttClass(ATT_DURATIONLOG)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        if (att.HasDur()) {
            attributes.push(["dur", att.DurationToStr(att.GetDur())]);
        }
    }
    if (element.HasAttClass(ATT_DURATIONRATIO)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        if (att.HasNum()) {
            attributes.push(["num", att.IntToStr(att.GetNum())]);
        }
        if (att.HasNumbase()) {
            attributes.push(["numbase", att.IntToStr(att.GetNumbase())]);
        }
    }
    if (element.HasAttClass(ATT_ENCLOSINGCHARS)) {
        const att = element;
        assertAtt(att);
        if (att.HasEnclose()) {
            attributes.push(["enclose", att.EnclosureToStr(att.GetEnclose())]);
        }
    }
    if (element.HasAttClass(ATT_ENDINGS)) {
        const att = element;
        assertAtt(att);
        if (att.HasEndingRend()) {
            attributes.push(["ending.rend", att.EndingsEndingrendToStr(att.GetEndingRend())]);
        }
    }
    if (element.HasAttClass(ATT_EVIDENCE)) {
        const att = element;
        assertAtt(att);
        if (att.HasCert()) {
            attributes.push(["cert", att.CertaintyToStr(att.GetCert())]);
        }
        if (att.HasEvidence()) {
            attributes.push(["evidence", att.StrToStr(att.GetEvidence())]);
        }
    }
    if (element.HasAttClass(ATT_EXTENDER)) {
        const att = element;
        assertAtt(att);
        if (att.HasExtender()) {
            attributes.push(["extender", att.BooleanToStr(att.GetExtender())]);
        }
    }
    if (element.HasAttClass(ATT_EXTENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasExtent()) {
            attributes.push(["extent", att.StrToStr(att.GetExtent())]);
        }
    }
    if (element.HasAttClass(ATT_FERMATAPRESENT)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        if (att.HasFermata()) {
            attributes.push(["fermata", att.StaffrelBasicToStr(att.GetFermata())]);
        }
    }
    if (element.HasAttClass(ATT_FILING)) {
        const att = element;
        assertAtt(att);
        if (att.HasNonfiling()) {
            attributes.push(["nonfiling", att.IntToStr(att.GetNonfiling())]);
        }
    }
    if (element.HasAttClass(ATT_FORMEWORK)) {
        const att = element;
        assertAtt(att);
        if (att.HasFunc()) {
            attributes.push(["func", att.PgfuncToStr(att.GetFunc())]);
        }
    }
    if (element.HasAttClass(ATT_GRPSYMLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasLevel()) {
            attributes.push(["level", att.IntToStr(att.GetLevel())]);
        }
    }
    if (element.HasAttClass(ATT_HANDIDENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasHand()) {
            attributes.push(["hand", att.StrToStr(att.GetHand())]);
        }
    }
    if (element.HasAttClass(ATT_HEIGHT)) {
        const att = element;
        assertAtt(att);
        if (att.HasHeight()) {
            attributes.push(["height", att.MeasurementunsignedToStr(att.GetHeight())]);
        }
    }
    if (element.HasAttClass(ATT_HORIZONTALALIGN)) {
        const att = resolveAttAreaPos(element);
        assertAtt(att);
        if (att.HasHalign()) {
            attributes.push(["halign", att.HorizontalalignmentToStr(att.GetHalign())]);
        }
    }
    if (element.HasAttClass(ATT_INTERNETMEDIA)) {
        const att = element;
        assertAtt(att);
        if (att.HasMimetype()) {
            attributes.push(["mimetype", att.StrToStr(att.GetMimetype())]);
        }
    }
    if (element.HasAttClass(ATT_JOINED)) {
        const att = element;
        assertAtt(att);
        if (att.HasJoin()) {
            attributes.push(["join", att.StrToStr(att.GetJoin())]);
        }
    }
    if (element.HasAttClass(ATT_KEYSIGLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasSig()) {
            attributes.push(["sig", att.KeysignatureToStr(att.GetSig())]);
        }
    }
    if (element.HasAttClass(ATT_KEYSIGDEFAULTLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasKeysig()) {
            attributes.push(["keysig", att.KeysignatureToStr(att.GetKeysig())]);
        }
    }
    if (element.HasAttClass(ATT_LABELLED)) {
        const att = resolveAttLabelled(element);
        assertAtt(att);
        if (att.HasLabel()) {
            attributes.push(["label", att.StrToStr ? att.StrToStr(att.GetLabel()) : att.GetLabel()]);
        }
    }
    if (element.HasAttClass(ATT_LANG)) {
        const att = element;
        assertAtt(att);
        if (att.HasLang()) {
            attributes.push(["xml:lang", att.StrToStr(att.GetLang())]);
        }
        if (att.HasTranslit()) {
            attributes.push(["translit", att.StrToStr(att.GetTranslit())]);
        }
    }
    if (element.HasAttClass(ATT_LAYERLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasDef()) {
            attributes.push(["def", att.StrToStr(att.GetDef())]);
        }
    }
    if (element.HasAttClass(ATT_LAYERIDENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasLayer()) {
            attributes.push(["layer", att.IntToStr(att.GetLayer())]);
        }
    }
    if (element.HasAttClass(ATT_LINELOC)) {
        const att = element;
        assertAtt(att);
        if (att.HasLine()) {
            attributes.push(["line", att.IntToStr(att.GetLine())]);
        }
    }
    if (element.HasAttClass(ATT_LINEREND)) {
        const att = element;
        assertAtt(att);
        if (att.HasLendsym()) {
            attributes.push(["lendsym", att.LinestartendsymbolToStr(att.GetLendsym())]);
        }
        if (att.HasLendsymSize()) {
            attributes.push(["lendsym.size", att.IntToStr(att.GetLendsymSize())]);
        }
        if (att.HasLstartsym()) {
            attributes.push(["lstartsym", att.LinestartendsymbolToStr(att.GetLstartsym())]);
        }
        if (att.HasLstartsymSize()) {
            attributes.push(["lstartsym.size", att.IntToStr(att.GetLstartsymSize())]);
        }
    }
    if (element.HasAttClass(ATT_LINERENDBASE)) {
        const att = element;
        assertAtt(att);
        if (att.HasLform()) {
            attributes.push(["lform", att.LineformToStr(att.GetLform())]);
        }
        if (att.HasLwidth()) {
            attributes.push(["lwidth", att.LinewidthToStr(att.GetLwidth())]);
        }
        if (att.HasLsegs()) {
            attributes.push(["lsegs", att.IntToStr(att.GetLsegs())]);
        }
    }
    if (element.HasAttClass(ATT_LINKING)) {
        const att = resolveAttLinking(element);
        assertAtt(att);
        if (att.HasCopyof()) {
            attributes.push(["copyof", att.StrToStr(att.GetCopyof())]);
        }
        if (att.HasCorresp()) {
            attributes.push(["corresp", att.StrToStr(att.GetCorresp())]);
        }
        if (att.HasFollows()) {
            attributes.push(["follows", att.StrToStr(att.GetFollows())]);
        }
        if (att.HasNext()) {
            attributes.push(["next", att.StrToStr(att.GetNext())]);
        }
        if (att.HasPrecedes()) {
            attributes.push(["precedes", att.StrToStr(att.GetPrecedes())]);
        }
        if (att.HasPrev()) {
            attributes.push(["prev", att.StrToStr(att.GetPrev())]);
        }
        if (att.HasSameas()) {
            attributes.push(["sameas", att.StrToStr(att.GetSameas())]);
        }
        if (att.HasSynch()) {
            attributes.push(["synch", att.StrToStr(att.GetSynch())]);
        }
    }
    if (element.HasAttClass(ATT_LYRICSTYLE)) {
        const att = element;
        assertAtt(att);
        if (att.HasLyricAlign()) {
            attributes.push(["lyric.align", att.MeasurementsignedToStr(att.GetLyricAlign())]);
        }
        if (att.HasLyricFam()) {
            attributes.push(["lyric.fam", att.StrToStr(att.GetLyricFam())]);
        }
        if (att.HasLyricName()) {
            attributes.push(["lyric.name", att.StrToStr(att.GetLyricName())]);
        }
        if (att.HasLyricSize()) {
            attributes.push(["lyric.size", att.FontsizeToStr(att.GetLyricSize())]);
        }
        if (att.HasLyricStyle()) {
            attributes.push(["lyric.style", att.FontstyleToStr(att.GetLyricStyle())]);
        }
        if (att.HasLyricWeight()) {
            attributes.push(["lyric.weight", att.FontweightToStr(att.GetLyricWeight())]);
        }
    }
    if (element.HasAttClass(ATT_MEASURENUMBERS)) {
        const att = element;
        assertAtt(att);
        if (att.HasMnumVisible()) {
            attributes.push(["mnum.visible", att.BooleanToStr(att.GetMnumVisible())]);
        }
    }
    if (element.HasAttClass(ATT_MEASUREMENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasUnit()) {
            attributes.push(["unit", att.StrToStr(att.GetUnit())]);
        }
    }
    if (element.HasAttClass(ATT_MEDIABOUNDS)) {
        const att = element;
        assertAtt(att);
        if (att.HasBegin()) {
            attributes.push(["begin", att.StrToStr(att.GetBegin())]);
        }
        if (att.HasEnd()) {
            attributes.push(["end", att.StrToStr(att.GetEnd())]);
        }
        if (att.HasBetype()) {
            attributes.push(["betype", att.BetypeToStr(att.GetBetype())]);
        }
    }
    if (element.HasAttClass(ATT_MEDIUM)) {
        const att = element;
        assertAtt(att);
        if (att.HasMedium()) {
            attributes.push(["medium", att.StrToStr(att.GetMedium())]);
        }
    }
    if (element.HasAttClass(ATT_MEIVERSION)) {
        const att = element;
        assertAtt(att);
        if (att.HasMeiversion()) {
            attributes.push(["meiversion", att.MeiVersionMeiversionToStr(att.GetMeiversion())]);
        }
    }
    if (element.HasAttClass(ATT_MENSURLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasLevel()) {
            attributes.push(["level", att.DurationToStr(att.GetLevel())]);
        }
    }
    if (element.HasAttClass(ATT_METADATAPOINTING)) {
        const att = element;
        assertAtt(att);
        if (att.HasDecls()) {
            attributes.push(["decls", att.StrToStr(att.GetDecls())]);
        }
    }
    if (element.HasAttClass(ATT_METERCONFORMANCE)) {
        const att = element;
        assertAtt(att);
        if (att.HasMetcon()) {
            attributes.push(["metcon", att.MeterConformanceMetconToStr(att.GetMetcon())]);
        }
    }
    if (element.HasAttClass(ATT_METERCONFORMANCEBAR)) {
        const att = element;
        assertAtt(att);
        if (att.HasMetcon()) {
            attributes.push(["metcon", att.BooleanToStr(att.GetMetcon())]);
        }
        if (att.HasControl()) {
            attributes.push(["control", att.BooleanToStr(att.GetControl())]);
        }
    }
    if (element.HasAttClass(ATT_METERSIGLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasCount()) {
            attributes.push(["count", att.MetercountPairToStr(att.GetCount())]);
        }
        if (att.HasSym()) {
            attributes.push(["sym", att.MetersignToStr(att.GetSym())]);
        }
        if (att.HasUnit()) {
            attributes.push(["unit", att.IntToStr(att.GetUnit())]);
        }
    }
    if (element.HasAttClass(ATT_METERSIGDEFAULTLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasMeterCount()) {
            attributes.push(["meter.count", att.MetercountPairToStr(att.GetMeterCount())]);
        }
        if (att.HasMeterUnit()) {
            attributes.push(["meter.unit", att.IntToStr(att.GetMeterUnit())]);
        }
        if (att.HasMeterSym()) {
            attributes.push(["meter.sym", att.MetersignToStr(att.GetMeterSym())]);
        }
    }
    if (element.HasAttClass(ATT_MMTEMPO)) {
        const att = element;
        assertAtt(att);
        if (att.HasMm()) {
            attributes.push(["mm", att.DblToStr(att.GetMm())]);
        }
        if (att.HasMmUnit()) {
            attributes.push(["mm.unit", att.DurationToStr(att.GetMmUnit())]);
        }
        if (att.HasMmDots()) {
            attributes.push(["mm.dots", att.IntToStr(att.GetMmDots())]);
        }
    }
    if (element.HasAttClass(ATT_MULTINUMMEASURES)) {
        const att = element;
        assertAtt(att);
        if (att.HasMultiNumber()) {
            attributes.push(["multi.number", att.BooleanToStr(att.GetMultiNumber())]);
        }
    }
    if (element.HasAttClass(ATT_NINTEGER)) {
        const att = element;
        assertAtt(att);
        if (att.HasN()) {
            attributes.push(["n", att.IntToStr(att.GetN())]);
        }
    }
    if (element.HasAttClass(ATT_NNUMBERLIKE)) {
        const att = element;
        assertAtt(att);
        if (att.HasN()) {
            attributes.push(["n", att.StrToStr(att.GetN())]);
        }
    }
    if (element.HasAttClass(ATT_NAME)) {
        const att = element;
        assertAtt(att);
        if (att.HasNymref()) {
            attributes.push(["nymref", att.StrToStr(att.GetNymref())]);
        }
        if (att.HasRole()) {
            attributes.push(["role", att.RelatorsToStr(att.GetRole())]);
        }
    }
    if (element.HasAttClass(ATT_NOTATIONSTYLE)) {
        const att = element;
        assertAtt(att);
        if (att.HasMusicName()) {
            attributes.push(["music.name", att.StrToStr(att.GetMusicName())]);
        }
        if (att.HasMusicSize()) {
            attributes.push(["music.size", att.FontsizeToStr(att.GetMusicSize())]);
        }
    }
    if (element.HasAttClass(ATT_NOTEHEADS)) {
        const att = element;
        assertAtt(att);
        if (att.HasHeadAltsym()) {
            attributes.push(["head.altsym", att.StrToStr(att.GetHeadAltsym())]);
        }
        if (att.HasHeadAuth()) {
            attributes.push(["head.auth", att.StrToStr(att.GetHeadAuth())]);
        }
        if (att.HasHeadColor()) {
            attributes.push(["head.color", att.StrToStr(att.GetHeadColor())]);
        }
        if (att.HasHeadFill()) {
            attributes.push(["head.fill", att.FillToStr(att.GetHeadFill())]);
        }
        if (att.HasHeadFillcolor()) {
            attributes.push(["head.fillcolor", att.StrToStr(att.GetHeadFillcolor())]);
        }
        if (att.HasHeadMod()) {
            attributes.push(["head.mod", att.NoteheadmodifierToStr(att.GetHeadMod())]);
        }
        if (att.HasHeadRotation()) {
            attributes.push(["head.rotation", att.RotationToStr(att.GetHeadRotation())]);
        }
        if (att.HasHeadShape()) {
            attributes.push(["head.shape", att.HeadshapeToStr(att.GetHeadShape())]);
        }
        if (att.HasHeadVisible()) {
            attributes.push(["head.visible", att.BooleanToStr(att.GetHeadVisible())]);
        }
    }
    if (element.HasAttClass(ATT_OCTAVE)) {
        const att = resolveAttPitch(element);
        assertAtt(att);
        if (att.HasOct()) {
            attributes.push(["oct", att.OctaveToStr(att.GetOct())]);
        }
    }
    if (element.HasAttClass(ATT_OCTAVEDEFAULT)) {
        const att = element;
        assertAtt(att);
        if (att.HasOctDefault()) {
            attributes.push(["oct.default", att.OctaveToStr(att.GetOctDefault())]);
        }
    }
    if (element.HasAttClass(ATT_OCTAVEDISPLACEMENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasDis()) {
            attributes.push(["dis", att.OctaveDisToStr(att.GetDis())]);
        }
        if (att.HasDisPlace()) {
            attributes.push(["dis.place", att.StaffrelBasicToStr(att.GetDisPlace())]);
        }
    }
    if (element.HasAttClass(ATT_ONELINESTAFF)) {
        const att = element;
        assertAtt(att);
        if (att.HasOntheline()) {
            attributes.push(["ontheline", att.BooleanToStr(att.GetOntheline())]);
        }
    }
    if (element.HasAttClass(ATT_OPTIMIZATION)) {
        const att = element;
        assertAtt(att);
        if (att.HasOptimize()) {
            attributes.push(["optimize", att.BooleanToStr(att.GetOptimize())]);
        }
    }
    if (element.HasAttClass(ATT_ORIGINLAYERIDENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasOriginLayer()) {
            attributes.push(["origin.layer", att.StrToStr(att.GetOriginLayer())]);
        }
    }
    if (element.HasAttClass(ATT_ORIGINSTAFFIDENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasOriginStaff()) {
            attributes.push(["origin.staff", att.StrToStr(att.GetOriginStaff())]);
        }
    }
    if (element.HasAttClass(ATT_ORIGINSTARTENDID)) {
        const att = element;
        assertAtt(att);
        if (att.HasOriginStartid()) {
            attributes.push(["origin.startid", att.StrToStr(att.GetOriginStartid())]);
        }
        if (att.HasOriginEndid()) {
            attributes.push(["origin.endid", att.StrToStr(att.GetOriginEndid())]);
        }
    }
    if (element.HasAttClass(ATT_ORIGINTIMESTAMPLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasOriginTstamp()) {
            attributes.push(["origin.tstamp", att.MeasurebeatToStr(att.GetOriginTstamp())]);
        }
        if (att.HasOriginTstamp2()) {
            attributes.push(["origin.tstamp2", att.MeasurebeatToStr(att.GetOriginTstamp2())]);
        }
    }
    if (element.HasAttClass(ATT_PAGES)) {
        const att = element;
        assertAtt(att);
        if (att.HasPageHeight()) {
            attributes.push(["page.height", att.MeasurementunsignedToStr(att.GetPageHeight())]);
        }
        if (att.HasPageWidth()) {
            attributes.push(["page.width", att.MeasurementunsignedToStr(att.GetPageWidth())]);
        }
        if (att.HasPageTopmar()) {
            attributes.push(["page.topmar", att.MeasurementunsignedToStr(att.GetPageTopmar())]);
        }
        if (att.HasPageBotmar()) {
            attributes.push(["page.botmar", att.MeasurementunsignedToStr(att.GetPageBotmar())]);
        }
        if (att.HasPageLeftmar()) {
            attributes.push(["page.leftmar", att.MeasurementunsignedToStr(att.GetPageLeftmar())]);
        }
        if (att.HasPageRightmar()) {
            attributes.push(["page.rightmar", att.MeasurementunsignedToStr(att.GetPageRightmar())]);
        }
        if (att.HasPagePanels()) {
            attributes.push(["page.panels", att.StrToStr(att.GetPagePanels())]);
        }
        if (att.HasPageScale()) {
            attributes.push(["page.scale", att.StrToStr(att.GetPageScale())]);
        }
    }
    if (element.HasAttClass(ATT_PARTIDENT)) {
        const att = resolveAttTimePoint(element);
        assertAtt(att);
        if (att.HasPart()) {
            attributes.push(["part", att.StrToStr(att.GetPart())]);
        }
        if (att.HasPartstaff()) {
            attributes.push(["partstaff", att.StrToStr(att.GetPartstaff())]);
        }
    }
    if (element.HasAttClass(ATT_PITCH)) {
        const att = resolveAttPitch(element);
        assertAtt(att);
        if (att.HasPname()) {
            attributes.push(["pname", att.PitchnameToStr(att.GetPname())]);
        }
    }
    if (element.HasAttClass(ATT_PLACEMENTONSTAFF)) {
        const att = element;
        assertAtt(att);
        if (att.HasOnstaff()) {
            attributes.push(["onstaff", att.BooleanToStr(att.GetOnstaff())]);
        }
    }
    if (element.HasAttClass(ATT_PLACEMENTRELEVENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasPlace()) {
            attributes.push(["place", att.StaffrelToStr(att.GetPlace())]);
        }
    }
    if (element.HasAttClass(ATT_PLACEMENTRELSTAFF)) {
        const att = resolveAttPlacementRelStaff(element);
        assertAtt(att);
        if (att.HasPlace()) {
            attributes.push(["place", att.StaffrelToStr(att.GetPlace())]);
        }
    }
    if (element.HasAttClass(ATT_PLIST)) {
        const att = resolveAttPlist(element);
        assertAtt(att);
        if (att.HasPlist()) {
            attributes.push(["plist", att.XsdAnyURIListToStr(att.GetPlist())]);
        }
    }
    if (element.HasAttClass(ATT_POINTING)) {
        const att = element;
        assertAtt(att);
        if (att.HasActuate()) {
            attributes.push(["xlink:actuate", att.StrToStr(att.GetActuate())]);
        }
        if (att.HasRole()) {
            attributes.push(["xlink:role", att.StrToStr(att.GetRole())]);
        }
        if (att.HasShow()) {
            attributes.push(["xlink:show", att.StrToStr(att.GetShow())]);
        }
        if (att.HasTarget()) {
            attributes.push(["target", att.StrToStr(att.GetTarget())]);
        }
        if (att.HasTargettype()) {
            attributes.push(["targettype", att.StrToStr(att.GetTargettype())]);
        }
    }
    if (element.HasAttClass(ATT_QUANTITY)) {
        const att = element;
        assertAtt(att);
        if (att.HasQuantity()) {
            attributes.push(["quantity", att.DblToStr(att.GetQuantity())]);
        }
    }
    if (element.HasAttClass(ATT_RANGING)) {
        const att = element;
        assertAtt(att);
        if (att.HasAtleast()) {
            attributes.push(["atleast", att.DblToStr(att.GetAtleast())]);
        }
        if (att.HasAtmost()) {
            attributes.push(["atmost", att.DblToStr(att.GetAtmost())]);
        }
        if (att.HasMin()) {
            attributes.push(["min", att.DblToStr(att.GetMin())]);
        }
        if (att.HasMax()) {
            attributes.push(["max", att.DblToStr(att.GetMax())]);
        }
        if (att.HasConfidence()) {
            attributes.push(["confidence", att.DblToStr(att.GetConfidence())]);
        }
    }
    if (element.HasAttClass(ATT_REPEATMARKLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasFunc()) {
            attributes.push(["func", att.RepeatMarkLogFuncToStr(att.GetFunc())]);
        }
    }
    if (element.HasAttClass(ATT_RESPONSIBILITY)) {
        const att = element;
        assertAtt(att);
        if (att.HasResp()) {
            attributes.push(["resp", att.StrToStr(att.GetResp())]);
        }
    }
    if (element.HasAttClass(ATT_RESTDURATIONLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasDur()) {
            attributes.push(["dur", att.DurationToStr(att.GetDur())]);
        }
    }
    if (element.HasAttClass(ATT_SCALABLE)) {
        const att = element;
        assertAtt(att);
        if (att.HasScale()) {
            attributes.push(["scale", att.PercentToStr(att.GetScale())]);
        }
    }
    if (element.HasAttClass(ATT_SEQUENCE)) {
        const att = element;
        assertAtt(att);
        if (att.HasSeq()) {
            attributes.push(["seq", att.IntToStr(att.GetSeq())]);
        }
    }
    if (element.HasAttClass(ATT_SLASHCOUNT)) {
        const att = element;
        assertAtt(att);
        if (att.HasSlash()) {
            attributes.push(["slash", att.IntToStr(att.GetSlash())]);
        }
    }
    if (element.HasAttClass(ATT_SLURPRESENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasSlur()) {
            attributes.push(["slur", att.StrToStr(att.GetSlur())]);
        }
    }
    if (element.HasAttClass(ATT_SOURCE)) {
        const att = element;
        assertAtt(att);
        if (att.HasSource()) {
            attributes.push(["source", att.StrToStr(att.GetSource())]);
        }
    }
    if (element.HasAttClass(ATT_SPACING)) {
        const att = element;
        assertAtt(att);
        if (att.HasSpacingPackexp()) {
            attributes.push(["spacing.packexp", att.DblToStr(att.GetSpacingPackexp())]);
        }
        if (att.HasSpacingPackfact()) {
            attributes.push(["spacing.packfact", att.DblToStr(att.GetSpacingPackfact())]);
        }
        if (att.HasSpacingStaff()) {
            attributes.push(["spacing.staff", att.MeasurementsignedToStr(att.GetSpacingStaff())]);
        }
        if (att.HasSpacingSystem()) {
            attributes.push(["spacing.system", att.MeasurementsignedToStr(att.GetSpacingSystem())]);
        }
    }
    if (element.HasAttClass(ATT_STAFFLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasDef()) {
            attributes.push(["def", att.StrToStr(att.GetDef())]);
        }
    }
    if (element.HasAttClass(ATT_STAFFDEFLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasLines()) {
            attributes.push(["lines", att.IntToStr(att.GetLines())]);
        }
    }
    if (element.HasAttClass(ATT_STAFFGROUPINGSYM)) {
        const att = element;
        assertAtt(att);
        if (att.HasSymbol()) {
            attributes.push(["symbol", att.StaffGroupingSymSymbolToStr(att.GetSymbol())]);
        }
    }
    if (element.HasAttClass(ATT_STAFFIDENT)) {
        const att = resolveAttStaffIdent(element);
        assertAtt(att);
        if (att.HasStaff()) {
            attributes.push(["staff", att.XsdPositiveIntegerListToStr(att.GetStaff())]);
        }
    }
    if (element.HasAttClass(ATT_STAFFITEMS)) {
        const att = element;
        assertAtt(att);
        if (att.HasAboveorder()) {
            attributes.push(["aboveorder", att.StaffitemToStr(att.GetAboveorder())]);
        }
        if (att.HasBeloworder()) {
            attributes.push(["beloworder", att.StaffitemToStr(att.GetBeloworder())]);
        }
        if (att.HasBetweenorder()) {
            attributes.push(["betweenorder", att.StaffitemToStr(att.GetBetweenorder())]);
        }
    }
    if (element.HasAttClass(ATT_STAFFLOC)) {
        const att = resolveAttPosition(element);
        assertAtt(att);
        if (att.HasLoc()) {
            attributes.push(["loc", att.IntToStr(att.GetLoc())]);
        }
    }
    if (element.HasAttClass(ATT_STAFFLOCPITCHED)) {
        const att = resolveAttPosition(element);
        assertAtt(att);
        if (att.HasPloc()) {
            attributes.push(["ploc", att.PitchnameToStr(att.GetPloc())]);
        }
        if (att.HasOloc()) {
            attributes.push(["oloc", att.OctaveToStr(att.GetOloc())]);
        }
    }
    if (element.HasAttClass(ATT_STARTID)) {
        const att = resolveAttTimePoint(element);
        assertAtt(att);
        if (att.HasStartid()) {
            attributes.push(["startid", att.StrToStr(att.GetStartid())]);
        }
    }
    if (element.HasAttClass(ATT_STARTENDID)) {
        const att = resolveAttTimeSpanning(element);
        assertAtt(att);
        if (att.HasEndid()) {
            attributes.push(["endid", att.StrToStr(att.GetEndid())]);
        }
    }
    if (element.HasAttClass(ATT_STEMS)) {
        const att = element;
        assertAtt(att);
        if (att.HasStemDir()) {
            attributes.push(["stem.dir", att.StemdirectionToStr(att.GetStemDir())]);
        }
        if (att.HasStemLen()) {
            attributes.push(["stem.len", att.DblToStr(att.GetStemLen())]);
        }
        if (att.HasStemMod()) {
            attributes.push(["stem.mod", att.StemmodifierToStr(att.GetStemMod())]);
        }
        if (att.HasStemPos()) {
            attributes.push(["stem.pos", att.StempositionToStr(att.GetStemPos())]);
        }
        if (att.HasStemSameas()) {
            attributes.push(["stem.sameas", att.StrToStr(att.GetStemSameas())]);
        }
        if (att.HasStemVisible()) {
            attributes.push(["stem.visible", att.BooleanToStr(att.GetStemVisible())]);
        }
        if (att.HasStemX()) {
            attributes.push(["stem.x", att.DblToStr(att.GetStemX())]);
        }
        if (att.HasStemY()) {
            attributes.push(["stem.y", att.DblToStr(att.GetStemY())]);
        }
    }
    if (element.HasAttClass(ATT_SYLLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasCon()) {
            attributes.push(["con", att.SylLogConToStr(att.GetCon())]);
        }
        if (att.HasWordpos()) {
            attributes.push(["wordpos", att.SylLogWordposToStr(att.GetWordpos())]);
        }
    }
    if (element.HasAttClass(ATT_SYLTEXT)) {
        const att = element;
        assertAtt(att);
        if (att.HasSyl()) {
            attributes.push(["syl", att.StrToStr(att.GetSyl())]);
        }
    }
    if (element.HasAttClass(ATT_SYSTEMS)) {
        const att = element;
        assertAtt(att);
        if (att.HasSystemLeftline()) {
            attributes.push(["system.leftline", att.BooleanToStr(att.GetSystemLeftline())]);
        }
        if (att.HasSystemLeftmar()) {
            attributes.push(["system.leftmar", att.MeasurementunsignedToStr(att.GetSystemLeftmar())]);
        }
        if (att.HasSystemRightmar()) {
            attributes.push(["system.rightmar", att.MeasurementunsignedToStr(att.GetSystemRightmar())]);
        }
        if (att.HasSystemTopmar()) {
            attributes.push(["system.topmar", att.MeasurementunsignedToStr(att.GetSystemTopmar())]);
        }
    }
    if (element.HasAttClass(ATT_TARGETEVAL)) {
        const att = element;
        assertAtt(att);
        if (att.HasEvaluate()) {
            attributes.push(["evaluate", att.TargetEvalEvaluateToStr(att.GetEvaluate())]);
        }
    }
    if (element.HasAttClass(ATT_TEMPOLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasFunc()) {
            attributes.push(["func", att.TempoLogFuncToStr(att.GetFunc())]);
        }
    }
    if (element.HasAttClass(ATT_TEXTRENDITION)) {
        const att = element;
        assertAtt(att);
        if (att.HasAltrend()) {
            attributes.push(["altrend", att.StrToStr(att.GetAltrend())]);
        }
        if (att.HasRend()) {
            attributes.push(["rend", att.TextrenditionToStr(att.GetRend())]);
        }
    }
    if (element.HasAttClass(ATT_TEXTSTYLE)) {
        const att = element;
        assertAtt(att);
        if (att.HasTextFam()) {
            attributes.push(["text.fam", att.StrToStr(att.GetTextFam())]);
        }
        if (att.HasTextName()) {
            attributes.push(["text.name", att.StrToStr(att.GetTextName())]);
        }
        if (att.HasTextSize()) {
            attributes.push(["text.size", att.FontsizeToStr(att.GetTextSize())]);
        }
        if (att.HasTextStyle()) {
            attributes.push(["text.style", att.FontstyleToStr(att.GetTextStyle())]);
        }
        if (att.HasTextWeight()) {
            attributes.push(["text.weight", att.FontweightToStr(att.GetTextWeight())]);
        }
    }
    if (element.HasAttClass(ATT_TIEPRESENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasTie()) {
            attributes.push(["tie", att.TieToStr(att.GetTie())]);
        }
    }
    if (element.HasAttClass(ATT_TIMESTAMPLOG)) {
        const att = resolveAttTimePoint(element);
        assertAtt(att);
        if (att.HasTstamp()) {
            attributes.push(["tstamp", att.DblToStr(att.GetTstamp())]);
        }
    }
    if (element.HasAttClass(ATT_TIMESTAMP2LOG)) {
        const att = resolveAttTimeSpanning(element);
        assertAtt(att);
        if (att.HasTstamp2()) {
            attributes.push(["tstamp2", att.MeasurebeatToStr(att.GetTstamp2())]);
        }
    }
    if (element.HasAttClass(ATT_TRANSPOSITION)) {
        const att = element;
        assertAtt(att);
        if (att.HasTransDiat()) {
            attributes.push(["trans.diat", att.IntToStr(att.GetTransDiat())]);
        }
        if (att.HasTransSemi()) {
            attributes.push(["trans.semi", att.IntToStr(att.GetTransSemi())]);
        }
    }
    if (element.HasAttClass(ATT_TUNING)) {
        const att = element;
        assertAtt(att);
        if (att.HasTuneHz()) {
            attributes.push(["tune.Hz", att.DblToStr(att.GetTuneHz())]);
        }
        if (att.HasTunePname()) {
            attributes.push(["tune.pname", att.PitchnameToStr(att.GetTunePname())]);
        }
        if (att.HasTuneTemper()) {
            attributes.push(["tune.temper", att.TemperamentToStr(att.GetTuneTemper())]);
        }
    }
    if (element.HasAttClass(ATT_TUNINGLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasTuningStandard()) {
            attributes.push(["tuning.standard", att.CoursetuningToStr(att.GetTuningStandard())]);
        }
    }
    if (element.HasAttClass(ATT_TUPLETPRESENT)) {
        const att = element;
        assertAtt(att);
        if (att.HasTuplet()) {
            attributes.push(["tuplet", att.StrToStr(att.GetTuplet())]);
        }
    }
    if (element.HasAttClass(ATT_TYPED)) {
        const att = element;
        assertAtt(att);
        if (att.HasType()) {
            attributes.push(["type", att.StrToStr(att.GetType())]);
        }
    }
    if (element.HasAttClass(ATT_TYPOGRAPHY)) {
        const att = element;
        assertAtt(att);
        if (att.HasFontfam()) {
            attributes.push(["fontfam", att.StrToStr(att.GetFontfam())]);
        }
        if (att.HasFontname()) {
            attributes.push(["fontname", att.StrToStr(att.GetFontname())]);
        }
        if (att.HasFontsize()) {
            attributes.push(["fontsize", att.FontsizeToStr(att.GetFontsize())]);
        }
        if (att.HasFontstyle()) {
            attributes.push(["fontstyle", att.FontstyleToStr(att.GetFontstyle())]);
        }
        if (att.HasFontweight()) {
            attributes.push(["fontweight", att.FontweightToStr(att.GetFontweight())]);
        }
        if (att.HasLetterspacing()) {
            attributes.push(["letterspacing", att.DblToStr(att.GetLetterspacing())]);
        }
        if (att.HasLineheight()) {
            attributes.push(["lineheight", att.StrToStr(att.GetLineheight())]);
        }
    }
    if (element.HasAttClass(ATT_VERTICALALIGN)) {
        const att = resolveAttAreaPos(element);
        assertAtt(att);
        if (att.HasValign()) {
            attributes.push(["valign", att.VerticalalignmentToStr(att.GetValign())]);
        }
    }
    if (element.HasAttClass(ATT_VERTICALGROUP)) {
        const att = element;
        assertAtt(att);
        if (att.HasVgrp()) {
            attributes.push(["vgrp", att.IntToStr(att.GetVgrp())]);
        }
    }
    if (element.HasAttClass(ATT_VISIBILITY)) {
        const att = element;
        assertAtt(att);
        if (att.HasVisible()) {
            attributes.push(["visible", att.BooleanToStr(att.GetVisible())]);
        }
    }
    if (element.HasAttClass(ATT_VISUALOFFSETHO)) {
        const att = resolveAttOffset(element);
        assertAtt(att);
        if (att.HasHo()) {
            attributes.push(["ho", att.MeasurementsignedToStr(att.GetHo())]);
        }
    }
    if (element.HasAttClass(ATT_VISUALOFFSETTO)) {
        const att = resolveAttOffset(element);
        assertAtt(att);
        if (att.HasTo()) {
            attributes.push(["to", att.DblToStr(att.GetTo())]);
        }
    }
    if (element.HasAttClass(ATT_VISUALOFFSETVO)) {
        const att = resolveAttOffset(element);
        assertAtt(att);
        if (att.HasVo()) {
            attributes.push(["vo", att.MeasurementsignedToStr(att.GetVo())]);
        }
    }
    if (element.HasAttClass(ATT_VISUALOFFSET2HO)) {
        const att = resolveAttOffsetSpanning(element);
        assertAtt(att);
        if (att.HasStartho()) {
            attributes.push(["startho", att.MeasurementsignedToStr(att.GetStartho())]);
        }
        if (att.HasEndho()) {
            attributes.push(["endho", att.MeasurementsignedToStr(att.GetEndho())]);
        }
    }
    if (element.HasAttClass(ATT_VISUALOFFSET2TO)) {
        const att = resolveAttOffsetSpanning(element);
        assertAtt(att);
        if (att.HasStartto()) {
            attributes.push(["startto", att.DblToStr(att.GetStartto())]);
        }
        if (att.HasEndto()) {
            attributes.push(["endto", att.DblToStr(att.GetEndto())]);
        }
    }
    if (element.HasAttClass(ATT_VISUALOFFSET2VO)) {
        const att = resolveAttOffsetSpanning(element);
        assertAtt(att);
        if (att.HasStartvo()) {
            attributes.push(["startvo", att.MeasurementsignedToStr(att.GetStartvo())]);
        }
        if (att.HasEndvo()) {
            attributes.push(["endvo", att.MeasurementsignedToStr(att.GetEndvo())]);
        }
    }
    if (element.HasAttClass(ATT_VOLTAGROUPINGSYM)) {
        const att = element;
        assertAtt(att);
        if (att.HasVoltasym()) {
            attributes.push(["voltasym", att.VoltaGroupingSymVoltasymToStr(att.GetVoltasym())]);
        }
    }
    if (element.HasAttClass(ATT_WHITESPACE)) {
        const att = element;
        assertAtt(att);
        if (att.HasSpace()) {
            attributes.push(["xml:space", att.StrToStr(att.GetSpace())]);
        }
    }
    if (element.HasAttClass(ATT_WIDTH)) {
        const att = element;
        assertAtt(att);
        if (att.HasWidth()) {
            attributes.push(["width", att.MeasurementunsignedToStr(att.GetWidth())]);
        }
    }
    if (element.HasAttClass(ATT_XY)) {
        const att = element;
        assertAtt(att);
        if (att.HasX()) {
            attributes.push(["x", att.DblToStr(att.GetX())]);
        }
        if (att.HasY()) {
            attributes.push(["y", att.DblToStr(att.GetY())]);
        }
    }
    if (element.HasAttClass(ATT_XY2)) {
        const att = element;
        assertAtt(att);
        if (att.HasX2()) {
            attributes.push(["x2", att.DblToStr(att.GetX2())]);
        }
        if (att.HasY2()) {
            attributes.push(["y2", att.DblToStr(att.GetY2())]);
        }
    }

  }

  static CopyShared(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_ACCIDLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetFunc(att.GetFunc());
    }
    if (element.HasAttClass(ATT_ACCIDENTAL)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAccid(att.GetAccid());
    }
    if (element.HasAttClass(ATT_ANNOTLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetFunc(att.GetFunc());
    }
    if (element.HasAttClass(ATT_ARTICULATION)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetArtic(att.GetArtic());
    }
    if (element.HasAttClass(ATT_ATTACCALOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTarget(att.GetTarget());
    }
    if (element.HasAttClass(ATT_AUDIENCE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAudience(att.GetAudience());
    }
    if (element.HasAttClass(ATT_AUGMENTDOTS)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        const attTarget = resolveAttDuration(target);
        assertAtt(attTarget);
        attTarget.SetDots(att.GetDots());
    }
    if (element.HasAttClass(ATT_AUTHORIZED)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAuth(att.GetAuth());
        attTarget.SetAuthUri(att.GetAuthUri());
    }
    if (element.HasAttClass(ATT_BARLINELOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
    }
    if (element.HasAttClass(ATT_BARRING)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetBarLen(att.GetBarLen());
        attTarget.SetBarMethod(att.GetBarMethod());
        attTarget.SetBarPlace(att.GetBarPlace());
    }
    if (element.HasAttClass(ATT_BASIC)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetBase(att.GetBase());
    }
    if (element.HasAttClass(ATT_BIBL)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAnalog(att.GetAnalog());
    }
    if (element.HasAttClass(ATT_CALENDARED)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCalendar(att.GetCalendar());
    }
    if (element.HasAttClass(ATT_CANONICAL)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCodedval(att.GetCodedval());
    }
    if (element.HasAttClass(ATT_CLASSED)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetClass(att.GetClass());
    }
    if (element.HasAttClass(ATT_CLEFLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCautionary(att.GetCautionary());
    }
    if (element.HasAttClass(ATT_CLEFSHAPE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetShape(att.GetShape());
    }
    if (element.HasAttClass(ATT_CLEFFINGLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetClefShape(att.GetClefShape());
        attTarget.SetClefLine(att.GetClefLine());
        attTarget.SetClefDis(att.GetClefDis());
        attTarget.SetClefDisPlace(att.GetClefDisPlace());
    }
    if (element.HasAttClass(ATT_COLOR)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetColor(att.GetColor());
    }
    if (element.HasAttClass(ATT_COLORATION)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetColored(att.GetColored());
    }
    if (element.HasAttClass(ATT_COORDX1)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCoordX1(att.GetCoordX1());
    }
    if (element.HasAttClass(ATT_COORDX2)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCoordX2(att.GetCoordX2());
    }
    if (element.HasAttClass(ATT_COORDY1)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCoordY1(att.GetCoordY1());
    }
    if (element.HasAttClass(ATT_COORDINATED)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLrx(att.GetLrx());
        attTarget.SetLry(att.GetLry());
        attTarget.SetRotate(att.GetRotate());
    }
    if (element.HasAttClass(ATT_COORDINATEDUL)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetUlx(att.GetUlx());
        attTarget.SetUly(att.GetUly());
    }
    if (element.HasAttClass(ATT_CUE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCue(att.GetCue());
    }
    if (element.HasAttClass(ATT_CURVATURE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetBezier(att.GetBezier());
        attTarget.SetBulge(att.GetBulge());
        attTarget.SetCurvedir(att.GetCurvedir());
    }
    if (element.HasAttClass(ATT_CUSTOSLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTarget(att.GetTarget());
    }
    if (element.HasAttClass(ATT_DATAPOINTING)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetData(att.GetData());
    }
    if (element.HasAttClass(ATT_DATASELECTING)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSelect(att.GetSelect());
    }
    if (element.HasAttClass(ATT_DATABLE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetEnddate(att.GetEnddate());
        attTarget.SetIsodate(att.GetIsodate());
        attTarget.SetNotafter(att.GetNotafter());
        attTarget.SetNotbefore(att.GetNotbefore());
        attTarget.SetStartdate(att.GetStartdate());
    }
    if (element.HasAttClass(ATT_DISTANCES)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetDirDist(att.GetDirDist());
        attTarget.SetDynamDist(att.GetDynamDist());
        attTarget.SetHarmDist(att.GetHarmDist());
        attTarget.SetRehDist(att.GetRehDist());
        attTarget.SetTempoDist(att.GetTempoDist());
    }
    if (element.HasAttClass(ATT_DOCSTATUS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetStatus(att.GetStatus());
    }
    if (element.HasAttClass(ATT_DOTLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
    }
    if (element.HasAttClass(ATT_DURATIONADDITIVE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetDur(att.GetDur());
    }
    if (element.HasAttClass(ATT_DURATIONDEFAULT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetDurDefault(att.GetDurDefault());
        attTarget.SetNumDefault(att.GetNumDefault());
        attTarget.SetNumbaseDefault(att.GetNumbaseDefault());
    }
    if (element.HasAttClass(ATT_DURATIONLOG)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        const attTarget = resolveAttDuration(target);
        assertAtt(attTarget);
        attTarget.SetDur(att.GetDur());
    }
    if (element.HasAttClass(ATT_DURATIONRATIO)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        const attTarget = resolveAttDuration(target);
        assertAtt(attTarget);
        attTarget.SetNum(att.GetNum());
        attTarget.SetNumbase(att.GetNumbase());
    }
    if (element.HasAttClass(ATT_ENCLOSINGCHARS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetEnclose(att.GetEnclose());
    }
    if (element.HasAttClass(ATT_ENDINGS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetEndingRend(att.GetEndingRend());
    }
    if (element.HasAttClass(ATT_EVIDENCE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCert(att.GetCert());
        attTarget.SetEvidence(att.GetEvidence());
    }
    if (element.HasAttClass(ATT_EXTENDER)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetExtender(att.GetExtender());
    }
    if (element.HasAttClass(ATT_EXTENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetExtent(att.GetExtent());
    }
    if (element.HasAttClass(ATT_FERMATAPRESENT)) {
        const att = resolveAttDuration(element);
        assertAtt(att);
        const attTarget = resolveAttDuration(target);
        assertAtt(attTarget);
        attTarget.SetFermata(att.GetFermata());
    }
    if (element.HasAttClass(ATT_FILING)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetNonfiling(att.GetNonfiling());
    }
    if (element.HasAttClass(ATT_FORMEWORK)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetFunc(att.GetFunc());
    }
    if (element.HasAttClass(ATT_GRPSYMLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLevel(att.GetLevel());
    }
    if (element.HasAttClass(ATT_HANDIDENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetHand(att.GetHand());
    }
    if (element.HasAttClass(ATT_HEIGHT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetHeight(att.GetHeight());
    }
    if (element.HasAttClass(ATT_HORIZONTALALIGN)) {
        const att = resolveAttAreaPos(element);
        assertAtt(att);
        const attTarget = resolveAttAreaPos(target);
        assertAtt(attTarget);
        attTarget.SetHalign(att.GetHalign());
    }
    if (element.HasAttClass(ATT_INTERNETMEDIA)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMimetype(att.GetMimetype());
    }
    if (element.HasAttClass(ATT_JOINED)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetJoin(att.GetJoin());
    }
    if (element.HasAttClass(ATT_KEYSIGLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSig(att.GetSig());
    }
    if (element.HasAttClass(ATT_KEYSIGDEFAULTLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetKeysig(att.GetKeysig());
    }
    if (element.HasAttClass(ATT_LABELLED)) {
        const att = resolveAttLabelled(element);
        assertAtt(att);
        const attTarget = resolveAttLabelled(target);
        assertAtt(attTarget);
        attTarget.SetLabel(att.GetLabel());
    }
    if (element.HasAttClass(ATT_LANG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLang(att.GetLang());
        attTarget.SetTranslit(att.GetTranslit());
    }
    if (element.HasAttClass(ATT_LAYERLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetDef(att.GetDef());
    }
    if (element.HasAttClass(ATT_LAYERIDENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLayer(att.GetLayer());
    }
    if (element.HasAttClass(ATT_LINELOC)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLine(att.GetLine());
    }
    if (element.HasAttClass(ATT_LINEREND)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLendsym(att.GetLendsym());
        attTarget.SetLendsymSize(att.GetLendsymSize());
        attTarget.SetLstartsym(att.GetLstartsym());
        attTarget.SetLstartsymSize(att.GetLstartsymSize());
    }
    if (element.HasAttClass(ATT_LINERENDBASE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLform(att.GetLform());
        attTarget.SetLwidth(att.GetLwidth());
        attTarget.SetLsegs(att.GetLsegs());
    }
    if (element.HasAttClass(ATT_LINKING)) {
        const att = resolveAttLinking(element);
        assertAtt(att);
        const attTarget = resolveAttLinking(target);
        assertAtt(attTarget);
        attTarget.SetCopyof(att.GetCopyof());
        attTarget.SetCorresp(att.GetCorresp());
        attTarget.SetFollows(att.GetFollows());
        attTarget.SetNext(att.GetNext());
        attTarget.SetPrecedes(att.GetPrecedes());
        attTarget.SetPrev(att.GetPrev());
        attTarget.SetSameas(att.GetSameas());
        attTarget.SetSynch(att.GetSynch());
    }
    if (element.HasAttClass(ATT_LYRICSTYLE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLyricAlign(att.GetLyricAlign());
        attTarget.SetLyricFam(att.GetLyricFam());
        attTarget.SetLyricName(att.GetLyricName());
        attTarget.SetLyricSize(att.GetLyricSize());
        attTarget.SetLyricStyle(att.GetLyricStyle());
        attTarget.SetLyricWeight(att.GetLyricWeight());
    }
    if (element.HasAttClass(ATT_MEASURENUMBERS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMnumVisible(att.GetMnumVisible());
    }
    if (element.HasAttClass(ATT_MEASUREMENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetUnit(att.GetUnit());
    }
    if (element.HasAttClass(ATT_MEDIABOUNDS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetBegin(att.GetBegin());
        attTarget.SetEnd(att.GetEnd());
        attTarget.SetBetype(att.GetBetype());
    }
    if (element.HasAttClass(ATT_MEDIUM)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMedium(att.GetMedium());
    }
    if (element.HasAttClass(ATT_MEIVERSION)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMeiversion(att.GetMeiversion());
    }
    if (element.HasAttClass(ATT_MENSURLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLevel(att.GetLevel());
    }
    if (element.HasAttClass(ATT_METADATAPOINTING)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetDecls(att.GetDecls());
    }
    if (element.HasAttClass(ATT_METERCONFORMANCE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMetcon(att.GetMetcon());
    }
    if (element.HasAttClass(ATT_METERCONFORMANCEBAR)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMetcon(att.GetMetcon());
        attTarget.SetControl(att.GetControl());
    }
    if (element.HasAttClass(ATT_METERSIGLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCount(att.GetCount());
        attTarget.SetSym(att.GetSym());
        attTarget.SetUnit(att.GetUnit());
    }
    if (element.HasAttClass(ATT_METERSIGDEFAULTLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMeterCount(att.GetMeterCount());
        attTarget.SetMeterUnit(att.GetMeterUnit());
        attTarget.SetMeterSym(att.GetMeterSym());
    }
    if (element.HasAttClass(ATT_MMTEMPO)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMm(att.GetMm());
        attTarget.SetMmUnit(att.GetMmUnit());
        attTarget.SetMmDots(att.GetMmDots());
    }
    if (element.HasAttClass(ATT_MULTINUMMEASURES)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMultiNumber(att.GetMultiNumber());
    }
    if (element.HasAttClass(ATT_NINTEGER)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetN(att.GetN());
    }
    if (element.HasAttClass(ATT_NNUMBERLIKE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetN(att.GetN());
    }
    if (element.HasAttClass(ATT_NAME)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetNymref(att.GetNymref());
        attTarget.SetRole(att.GetRole());
    }
    if (element.HasAttClass(ATT_NOTATIONSTYLE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMusicName(att.GetMusicName());
        attTarget.SetMusicSize(att.GetMusicSize());
    }
    if (element.HasAttClass(ATT_NOTEHEADS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetHeadAltsym(att.GetHeadAltsym());
        attTarget.SetHeadAuth(att.GetHeadAuth());
        attTarget.SetHeadColor(att.GetHeadColor());
        attTarget.SetHeadFill(att.GetHeadFill());
        attTarget.SetHeadFillcolor(att.GetHeadFillcolor());
        attTarget.SetHeadMod(att.GetHeadMod());
        attTarget.SetHeadRotation(att.GetHeadRotation());
        attTarget.SetHeadShape(att.GetHeadShape());
        attTarget.SetHeadVisible(att.GetHeadVisible());
    }
    if (element.HasAttClass(ATT_OCTAVE)) {
        const att = resolveAttPitch(element);
        assertAtt(att);
        const attTarget = resolveAttPitch(target);
        assertAtt(attTarget);
        attTarget.SetOct(att.GetOct());
    }
    if (element.HasAttClass(ATT_OCTAVEDEFAULT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetOctDefault(att.GetOctDefault());
    }
    if (element.HasAttClass(ATT_OCTAVEDISPLACEMENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetDis(att.GetDis());
        attTarget.SetDisPlace(att.GetDisPlace());
    }
    if (element.HasAttClass(ATT_ONELINESTAFF)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetOntheline(att.GetOntheline());
    }
    if (element.HasAttClass(ATT_OPTIMIZATION)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetOptimize(att.GetOptimize());
    }
    if (element.HasAttClass(ATT_ORIGINLAYERIDENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetOriginLayer(att.GetOriginLayer());
    }
    if (element.HasAttClass(ATT_ORIGINSTAFFIDENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetOriginStaff(att.GetOriginStaff());
    }
    if (element.HasAttClass(ATT_ORIGINSTARTENDID)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetOriginStartid(att.GetOriginStartid());
        attTarget.SetOriginEndid(att.GetOriginEndid());
    }
    if (element.HasAttClass(ATT_ORIGINTIMESTAMPLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetOriginTstamp(att.GetOriginTstamp());
        attTarget.SetOriginTstamp2(att.GetOriginTstamp2());
    }
    if (element.HasAttClass(ATT_PAGES)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetPageHeight(att.GetPageHeight());
        attTarget.SetPageWidth(att.GetPageWidth());
        attTarget.SetPageTopmar(att.GetPageTopmar());
        attTarget.SetPageBotmar(att.GetPageBotmar());
        attTarget.SetPageLeftmar(att.GetPageLeftmar());
        attTarget.SetPageRightmar(att.GetPageRightmar());
        attTarget.SetPagePanels(att.GetPagePanels());
        attTarget.SetPageScale(att.GetPageScale());
    }
    if (element.HasAttClass(ATT_PARTIDENT)) {
        const att = resolveAttTimePoint(element);
        assertAtt(att);
        const attTarget = resolveAttTimePoint(target);
        assertAtt(attTarget);
        attTarget.SetPart(att.GetPart());
        attTarget.SetPartstaff(att.GetPartstaff());
    }
    if (element.HasAttClass(ATT_PITCH)) {
        const att = resolveAttPitch(element);
        assertAtt(att);
        const attTarget = resolveAttPitch(target);
        assertAtt(attTarget);
        attTarget.SetPname(att.GetPname());
    }
    if (element.HasAttClass(ATT_PLACEMENTONSTAFF)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetOnstaff(att.GetOnstaff());
    }
    if (element.HasAttClass(ATT_PLACEMENTRELEVENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetPlace(att.GetPlace());
    }
    if (element.HasAttClass(ATT_PLACEMENTRELSTAFF)) {
        const att = resolveAttPlacementRelStaff(element);
        assertAtt(att);
        const attTarget = resolveAttPlacementRelStaff(target);
        assertAtt(attTarget);
        attTarget.SetPlace(att.GetPlace());
    }
    if (element.HasAttClass(ATT_PLIST)) {
        const att = resolveAttPlist(element);
        assertAtt(att);
        const attTarget = resolveAttPlist(target);
        assertAtt(attTarget);
        attTarget.SetPlist(att.GetPlist());
    }
    if (element.HasAttClass(ATT_POINTING)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetActuate(att.GetActuate());
        attTarget.SetRole(att.GetRole());
        attTarget.SetShow(att.GetShow());
        attTarget.SetTarget(att.GetTarget());
        attTarget.SetTargettype(att.GetTargettype());
    }
    if (element.HasAttClass(ATT_QUANTITY)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetQuantity(att.GetQuantity());
    }
    if (element.HasAttClass(ATT_RANGING)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAtleast(att.GetAtleast());
        attTarget.SetAtmost(att.GetAtmost());
        attTarget.SetMin(att.GetMin());
        attTarget.SetMax(att.GetMax());
        attTarget.SetConfidence(att.GetConfidence());
    }
    if (element.HasAttClass(ATT_REPEATMARKLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetFunc(att.GetFunc());
    }
    if (element.HasAttClass(ATT_RESPONSIBILITY)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetResp(att.GetResp());
    }
    if (element.HasAttClass(ATT_RESTDURATIONLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetDur(att.GetDur());
    }
    if (element.HasAttClass(ATT_SCALABLE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetScale(att.GetScale());
    }
    if (element.HasAttClass(ATT_SEQUENCE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSeq(att.GetSeq());
    }
    if (element.HasAttClass(ATT_SLASHCOUNT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSlash(att.GetSlash());
    }
    if (element.HasAttClass(ATT_SLURPRESENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSlur(att.GetSlur());
    }
    if (element.HasAttClass(ATT_SOURCE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSource(att.GetSource());
    }
    if (element.HasAttClass(ATT_SPACING)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSpacingPackexp(att.GetSpacingPackexp());
        attTarget.SetSpacingPackfact(att.GetSpacingPackfact());
        attTarget.SetSpacingStaff(att.GetSpacingStaff());
        attTarget.SetSpacingSystem(att.GetSpacingSystem());
    }
    if (element.HasAttClass(ATT_STAFFLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetDef(att.GetDef());
    }
    if (element.HasAttClass(ATT_STAFFDEFLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLines(att.GetLines());
    }
    if (element.HasAttClass(ATT_STAFFGROUPINGSYM)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSymbol(att.GetSymbol());
    }
    if (element.HasAttClass(ATT_STAFFIDENT)) {
        const att = resolveAttStaffIdent(element);
        assertAtt(att);
        const attTarget = resolveAttStaffIdent(target);
        assertAtt(attTarget);
        attTarget.SetStaff(att.GetStaff());
    }
    if (element.HasAttClass(ATT_STAFFITEMS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAboveorder(att.GetAboveorder());
        attTarget.SetBeloworder(att.GetBeloworder());
        attTarget.SetBetweenorder(att.GetBetweenorder());
    }
    if (element.HasAttClass(ATT_STAFFLOC)) {
        const att = resolveAttPosition(element);
        assertAtt(att);
        const attTarget = resolveAttPosition(target);
        assertAtt(attTarget);
        attTarget.SetLoc(att.GetLoc());
    }
    if (element.HasAttClass(ATT_STAFFLOCPITCHED)) {
        const att = resolveAttPosition(element);
        assertAtt(att);
        const attTarget = resolveAttPosition(target);
        assertAtt(attTarget);
        attTarget.SetPloc(att.GetPloc());
        attTarget.SetOloc(att.GetOloc());
    }
    if (element.HasAttClass(ATT_STARTENDID)) {
        const att = resolveAttTimeSpanning(element);
        assertAtt(att);
        const attTarget = resolveAttTimeSpanning(target);
        assertAtt(attTarget);
        attTarget.SetEndid(att.GetEndid());
    }
    if (element.HasAttClass(ATT_STARTID)) {
        const att = resolveAttTimePoint(element);
        assertAtt(att);
        const attTarget = resolveAttTimePoint(target);
        assertAtt(attTarget);
        attTarget.SetStartid(att.GetStartid());
    }
    if (element.HasAttClass(ATT_STEMS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetStemDir(att.GetStemDir());
        attTarget.SetStemLen(att.GetStemLen());
        attTarget.SetStemMod(att.GetStemMod());
        attTarget.SetStemPos(att.GetStemPos());
        attTarget.SetStemSameas(att.GetStemSameas());
        attTarget.SetStemVisible(att.GetStemVisible());
        attTarget.SetStemX(att.GetStemX());
        attTarget.SetStemY(att.GetStemY());
    }
    if (element.HasAttClass(ATT_SYLLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCon(att.GetCon());
        attTarget.SetWordpos(att.GetWordpos());
    }
    if (element.HasAttClass(ATT_SYLTEXT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSyl(att.GetSyl());
    }
    if (element.HasAttClass(ATT_SYSTEMS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSystemLeftline(att.GetSystemLeftline());
        attTarget.SetSystemLeftmar(att.GetSystemLeftmar());
        attTarget.SetSystemRightmar(att.GetSystemRightmar());
        attTarget.SetSystemTopmar(att.GetSystemTopmar());
    }
    if (element.HasAttClass(ATT_TARGETEVAL)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetEvaluate(att.GetEvaluate());
    }
    if (element.HasAttClass(ATT_TEMPOLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetFunc(att.GetFunc());
    }
    if (element.HasAttClass(ATT_TEXTRENDITION)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetAltrend(att.GetAltrend());
        attTarget.SetRend(att.GetRend());
    }
    if (element.HasAttClass(ATT_TEXTSTYLE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTextFam(att.GetTextFam());
        attTarget.SetTextName(att.GetTextName());
        attTarget.SetTextSize(att.GetTextSize());
        attTarget.SetTextStyle(att.GetTextStyle());
        attTarget.SetTextWeight(att.GetTextWeight());
    }
    if (element.HasAttClass(ATT_TIEPRESENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTie(att.GetTie());
    }
    if (element.HasAttClass(ATT_TIMESTAMPLOG)) {
        const att = resolveAttTimePoint(element);
        assertAtt(att);
        const attTarget = resolveAttTimePoint(target);
        assertAtt(attTarget);
        attTarget.SetTstamp(att.GetTstamp());
    }
    if (element.HasAttClass(ATT_TIMESTAMP2LOG)) {
        const att = resolveAttTimeSpanning(element);
        assertAtt(att);
        const attTarget = resolveAttTimeSpanning(target);
        assertAtt(attTarget);
        attTarget.SetTstamp2(att.GetTstamp2());
    }
    if (element.HasAttClass(ATT_TRANSPOSITION)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTransDiat(att.GetTransDiat());
        attTarget.SetTransSemi(att.GetTransSemi());
    }
    if (element.HasAttClass(ATT_TUNING)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTuneHz(att.GetTuneHz());
        attTarget.SetTunePname(att.GetTunePname());
        attTarget.SetTuneTemper(att.GetTuneTemper());
    }
    if (element.HasAttClass(ATT_TUNINGLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTuningStandard(att.GetTuningStandard());
    }
    if (element.HasAttClass(ATT_TUPLETPRESENT)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTuplet(att.GetTuplet());
    }
    if (element.HasAttClass(ATT_TYPED)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetType(att.GetType());
    }
    if (element.HasAttClass(ATT_TYPOGRAPHY)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetFontfam(att.GetFontfam());
        attTarget.SetFontname(att.GetFontname());
        attTarget.SetFontsize(att.GetFontsize());
        attTarget.SetFontstyle(att.GetFontstyle());
        attTarget.SetFontweight(att.GetFontweight());
        attTarget.SetLetterspacing(att.GetLetterspacing());
        attTarget.SetLineheight(att.GetLineheight());
    }
    if (element.HasAttClass(ATT_VERTICALALIGN)) {
        const att = resolveAttAreaPos(element);
        assertAtt(att);
        const attTarget = resolveAttAreaPos(target);
        assertAtt(attTarget);
        attTarget.SetValign(att.GetValign());
    }
    if (element.HasAttClass(ATT_VERTICALGROUP)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetVgrp(att.GetVgrp());
    }
    if (element.HasAttClass(ATT_VISIBILITY)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetVisible(att.GetVisible());
    }
    if (element.HasAttClass(ATT_VISUALOFFSETHO)) {
        const att = resolveAttOffset(element);
        assertAtt(att);
        const attTarget = resolveAttOffset(target);
        assertAtt(attTarget);
        attTarget.SetHo(att.GetHo());
    }
    if (element.HasAttClass(ATT_VISUALOFFSETTO)) {
        const att = resolveAttOffset(element);
        assertAtt(att);
        const attTarget = resolveAttOffset(target);
        assertAtt(attTarget);
        attTarget.SetTo(att.GetTo());
    }
    if (element.HasAttClass(ATT_VISUALOFFSETVO)) {
        const att = resolveAttOffset(element);
        assertAtt(att);
        const attTarget = resolveAttOffset(target);
        assertAtt(attTarget);
        attTarget.SetVo(att.GetVo());
    }
    if (element.HasAttClass(ATT_VISUALOFFSET2HO)) {
        const att = resolveAttOffsetSpanning(element);
        assertAtt(att);
        const attTarget = resolveAttOffsetSpanning(target);
        assertAtt(attTarget);
        attTarget.SetStartho(att.GetStartho());
        attTarget.SetEndho(att.GetEndho());
    }
    if (element.HasAttClass(ATT_VISUALOFFSET2TO)) {
        const att = resolveAttOffsetSpanning(element);
        assertAtt(att);
        const attTarget = resolveAttOffsetSpanning(target);
        assertAtt(attTarget);
        attTarget.SetStartto(att.GetStartto());
        attTarget.SetEndto(att.GetEndto());
    }
    if (element.HasAttClass(ATT_VISUALOFFSET2VO)) {
        const att = resolveAttOffsetSpanning(element);
        assertAtt(att);
        const attTarget = resolveAttOffsetSpanning(target);
        assertAtt(attTarget);
        attTarget.SetStartvo(att.GetStartvo());
        attTarget.SetEndvo(att.GetEndvo());
    }
    if (element.HasAttClass(ATT_VOLTAGROUPINGSYM)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetVoltasym(att.GetVoltasym());
    }
    if (element.HasAttClass(ATT_WHITESPACE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSpace(att.GetSpace());
    }
    if (element.HasAttClass(ATT_WIDTH)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetWidth(att.GetWidth());
    }
    if (element.HasAttClass(ATT_XY)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetX(att.GetX());
        attTarget.SetY(att.GetY());
    }
    if (element.HasAttClass(ATT_XY2)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetX2(att.GetX2());
        attTarget.SetY2(att.GetY2());
    }

  }

  static SetStringtab(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_STAFFDEFVISTABLATURE)) {
        const att = element;
        assertAtt(att);
        if (attrType == "tab.align") {
            att.SetTabAlign(att.StrToVerticalalignment(attrValue));
            return true;
        }
        if (attrType == "tab.anchorline") {
            att.SetTabAnchorline(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STRINGTAB)) {
        const att = element;
        assertAtt(att);
        if (attrType == "tab.fing") {
            att.SetTabFing(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "tab.fret") {
            att.SetTabFret(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "tab.line") {
            att.SetTabLine(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "tab.string") {
            att.SetTabString(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "tab.course") {
            att.SetTabCourse(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STRINGTABPOSITION)) {
        const att = element;
        assertAtt(att);
        if (attrType == "tab.pos") {
            att.SetTabPos(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STRINGTABTUNING)) {
        const att = element;
        assertAtt(att);
        if (attrType == "tab.strings") {
            att.SetTabStrings(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "tab.courses") {
            att.SetTabCourses(att.StrToStr(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetStringtab(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_STAFFDEFVISTABLATURE)) {
        const att = element;
        assertAtt(att);
        if (att.HasTabAlign()) {
            attributes.push(["tab.align", att.VerticalalignmentToStr(att.GetTabAlign())]);
        }
        if (att.HasTabAnchorline()) {
            attributes.push(["tab.anchorline", att.IntToStr(att.GetTabAnchorline())]);
        }
    }
    if (element.HasAttClass(ATT_STRINGTAB)) {
        const att = element;
        assertAtt(att);
        if (att.HasTabFing()) {
            attributes.push(["tab.fing", att.StrToStr(att.GetTabFing())]);
        }
        if (att.HasTabFret()) {
            attributes.push(["tab.fret", att.IntToStr(att.GetTabFret())]);
        }
        if (att.HasTabLine()) {
            attributes.push(["tab.line", att.IntToStr(att.GetTabLine())]);
        }
        if (att.HasTabString()) {
            attributes.push(["tab.string", att.StrToStr(att.GetTabString())]);
        }
        if (att.HasTabCourse()) {
            attributes.push(["tab.course", att.IntToStr(att.GetTabCourse())]);
        }
    }
    if (element.HasAttClass(ATT_STRINGTABPOSITION)) {
        const att = element;
        assertAtt(att);
        if (att.HasTabPos()) {
            attributes.push(["tab.pos", att.IntToStr(att.GetTabPos())]);
        }
    }
    if (element.HasAttClass(ATT_STRINGTABTUNING)) {
        const att = element;
        assertAtt(att);
        if (att.HasTabStrings()) {
            attributes.push(["tab.strings", att.StrToStr(att.GetTabStrings())]);
        }
        if (att.HasTabCourses()) {
            attributes.push(["tab.courses", att.StrToStr(att.GetTabCourses())]);
        }
    }

  }

  static CopyStringtab(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_STAFFDEFVISTABLATURE)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTabAlign(att.GetTabAlign());
        attTarget.SetTabAnchorline(att.GetTabAnchorline());
    }
    if (element.HasAttClass(ATT_STRINGTAB)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTabFing(att.GetTabFing());
        attTarget.SetTabFret(att.GetTabFret());
        attTarget.SetTabLine(att.GetTabLine());
        attTarget.SetTabString(att.GetTabString());
        attTarget.SetTabCourse(att.GetTabCourse());
    }
    if (element.HasAttClass(ATT_STRINGTABPOSITION)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTabPos(att.GetTabPos());
    }
    if (element.HasAttClass(ATT_STRINGTABTUNING)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetTabStrings(att.GetTabStrings());
        attTarget.SetTabCourses(att.GetTabCourses());
    }

  }

  static SetUsersymbols(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_ALTSYM)) {
        const att = resolveAttAltSym(element);
        assertAtt(att);
        if (attrType == "altsym") {
            att.SetAltsym(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ANCHOREDTEXTLOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "func") {
            att.SetFunc(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_CURVELOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "func") {
            att.SetFunc(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_LINELOG)) {
        const att = element;
        assertAtt(att);
        if (attrType == "func") {
            att.SetFunc(att.StrToStr(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetUsersymbols(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_ALTSYM)) {
        const att = resolveAttAltSym(element);
        assertAtt(att);
        if (att.HasAltsym()) {
            attributes.push(["altsym", att.StrToStr(att.GetAltsym())]);
        }
    }
    if (element.HasAttClass(ATT_ANCHOREDTEXTLOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasFunc()) {
            attributes.push(["func", att.StrToStr(att.GetFunc())]);
        }
    }
    if (element.HasAttClass(ATT_CURVELOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasFunc()) {
            attributes.push(["func", att.StrToStr(att.GetFunc())]);
        }
    }
    if (element.HasAttClass(ATT_LINELOG)) {
        const att = element;
        assertAtt(att);
        if (att.HasFunc()) {
            attributes.push(["func", att.StrToStr(att.GetFunc())]);
        }
    }

  }

  static CopyUsersymbols(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_ALTSYM)) {
        const att = resolveAttAltSym(element);
        assertAtt(att);
        const attTarget = resolveAttAltSym(target);
        assertAtt(attTarget);
        attTarget.SetAltsym(att.GetAltsym());
    }
    if (element.HasAttClass(ATT_ANCHOREDTEXTLOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetFunc(att.GetFunc());
    }
    if (element.HasAttClass(ATT_CURVELOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetFunc(att.GetFunc());
    }
    if (element.HasAttClass(ATT_LINELOG)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetFunc(att.GetFunc());
    }

  }

  static SetVisual(element: AttModuleElementLike, attrType: string, attrValue: string): boolean {
    if (element.HasAttClass(ATT_ANNOTVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "place") {
            att.SetPlace(att.StrToPlacement(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_ARPEGVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "arrow") {
            att.SetArrow(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "arrow.shape") {
            att.SetArrowShape(att.StrToLinestartendsymbol(attrValue));
            return true;
        }
        if (attrType == "arrow.size") {
            att.SetArrowSize(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "arrow.color") {
            att.SetArrowColor(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "arrow.fillcolor") {
            att.SetArrowFillcolor(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BARLINEVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "len") {
            att.SetLen(att.StrToDbl(attrValue));
            return true;
        }
        if (attrType == "method") {
            att.SetMethod(att.StrToBarmethod(attrValue));
            return true;
        }
        if (attrType == "place") {
            att.SetPlace(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BEAMINGVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "beam.color") {
            att.SetBeamColor(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "beam.rend") {
            att.SetBeamRend(att.StrToBeamingVisBeamrend(attrValue));
            return true;
        }
        if (attrType == "beam.slope") {
            att.SetBeamSlope(att.StrToDbl(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_BEATRPTVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "slash") {
            att.SetSlash(att.StrToBeatrptRend(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_CHORDVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "cluster") {
            att.SetCluster(att.StrToCluster(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_CLEFFINGVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "clef.color") {
            att.SetClefColor(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "clef.visible") {
            att.SetClefVisible(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_CURVATUREDIRECTION)) {
        const att = element;
        assertAtt(att);
        if (attrType == "curve") {
            att.SetCurve(att.StrToCurvatureDirectionCurve(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_EPISEMAVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToEpisemaVisForm(attrValue));
            return true;
        }
        if (attrType == "place") {
            att.SetPlace(att.StrToEventrel(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_FTREMVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "beams") {
            att.SetBeams(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "beams.float") {
            att.SetBeamsFloat(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "float.gap") {
            att.SetFloatGap(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_FERMATAVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToFermataVisForm(attrValue));
            return true;
        }
        if (attrType == "shape") {
            att.SetShape(att.StrToFermataVisShape(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_FINGGRPVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "orient") {
            att.SetOrient(att.StrToFingGrpVisOrient(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_GUITARGRIDVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "grid.show") {
            att.SetGridShow(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_HAIRPINVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "opening") {
            att.SetOpening(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
        if (attrType == "closed") {
            att.SetClosed(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "opening.vertical") {
            att.SetOpeningVertical(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "angle.optimize") {
            att.SetAngleOptimize(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_HARMVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "rendgrid") {
            att.SetRendgrid(att.StrToHarmVisRendgrid(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_HISPANTICKVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "place") {
            att.SetPlace(att.StrToEventrel(attrValue));
            return true;
        }
        if (attrType == "tilt") {
            att.SetTilt(att.StrToCompassdirection(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_KEYSIGVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "cancelaccid") {
            att.SetCancelaccid(att.StrToCancelaccid(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_KEYSIGDEFAULTVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "keysig.cancelaccid") {
            att.SetKeysigCancelaccid(att.StrToCancelaccid(attrValue));
            return true;
        }
        if (attrType == "keysig.visible") {
            att.SetKeysigVisible(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_LIGATUREVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToLigatureform(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_LINEVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToLineform(attrValue));
            return true;
        }
        if (attrType == "width") {
            att.SetWidth(att.StrToLinewidth(attrValue));
            return true;
        }
        if (attrType == "endsym") {
            att.SetEndsym(att.StrToLinestartendsymbol(attrValue));
            return true;
        }
        if (attrType == "endsym.size") {
            att.SetEndsymSize(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "startsym") {
            att.SetStartsym(att.StrToLinestartendsymbol(attrValue));
            return true;
        }
        if (attrType == "startsym.size") {
            att.SetStartsymSize(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_LIQUESCENTVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "looped") {
            att.SetLooped(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MENSURVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "dot") {
            att.SetDot(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "form") {
            att.SetForm(att.StrToMensurVisForm(attrValue));
            return true;
        }
        if (attrType == "orient") {
            att.SetOrient(att.StrToOrientation(attrValue));
            return true;
        }
        if (attrType == "sign") {
            att.SetSign(att.StrToMensurationsign(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MENSURALVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "mensur.color") {
            att.SetMensurColor(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "mensur.dot") {
            att.SetMensurDot(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "mensur.form") {
            att.SetMensurForm(att.StrToMensuralVisMensurform(attrValue));
            return true;
        }
        if (attrType == "mensur.loc") {
            att.SetMensurLoc(att.StrToInt(attrValue));
            return true;
        }
        if (attrType == "mensur.orient") {
            att.SetMensurOrient(att.StrToOrientation(attrValue));
            return true;
        }
        if (attrType == "mensur.sign") {
            att.SetMensurSign(att.StrToMensurationsign(attrValue));
            return true;
        }
        if (attrType == "mensur.size") {
            att.SetMensurSize(att.StrToFontsize(attrValue));
            return true;
        }
        if (attrType == "mensur.slash") {
            att.SetMensurSlash(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_METERSIGVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToMeterform(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_METERSIGDEFAULTVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "meter.form") {
            att.SetMeterForm(att.StrToMeterform(attrValue));
            return true;
        }
        if (attrType == "meter.showchange") {
            att.SetMeterShowchange(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "meter.visible") {
            att.SetMeterVisible(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_MULTIRESTVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "block") {
            att.SetBlock(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PBVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "folium") {
            att.SetFolium(att.StrToPbVisFolium(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PEDALVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToPedalstyle(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_PLICAVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "dir") {
            att.SetDir(att.StrToStemdirectionBasic(attrValue));
            return true;
        }
        if (attrType == "len") {
            att.SetLen(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_QUILISMAVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "waves") {
            att.SetWaves(att.StrToInt(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SBVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "form") {
            att.SetForm(att.StrToSbVisForm(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SCOREDEFVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "vu.height") {
            att.SetVuHeight(att.StrToStr(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SECTIONVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "restart") {
            att.SetRestart(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SIGNIFLETVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "place") {
            att.SetPlace(att.StrToEventrel(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_SPACEVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "compressable") {
            att.SetCompressable(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STAFFDEFVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "layerscheme") {
            att.SetLayerscheme(att.StrToLayerscheme(attrValue));
            return true;
        }
        if (attrType == "lines.color") {
            att.SetLinesColor(att.StrToStr(attrValue));
            return true;
        }
        if (attrType == "lines.visible") {
            att.SetLinesVisible(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "spacing") {
            att.SetSpacing(att.StrToMeasurementsigned(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STAFFGRPVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "bar.thru") {
            att.SetBarThru(att.StrToBoolean(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_STEMVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "pos") {
            att.SetPos(att.StrToStemposition(attrValue));
            return true;
        }
        if (attrType == "len") {
            att.SetLen(att.StrToMeasurementunsigned(attrValue));
            return true;
        }
        if (attrType == "form") {
            att.SetForm(att.StrToStemformMensural(attrValue));
            return true;
        }
        if (attrType == "dir") {
            att.SetDir(att.StrToStemdirection(attrValue));
            return true;
        }
        if (attrType == "flag.pos") {
            att.SetFlagPos(att.StrToFlagposMensural(attrValue));
            return true;
        }
        if (attrType == "flag.form") {
            att.SetFlagForm(att.StrToFlagformMensural(attrValue));
            return true;
        }
    }
    if (element.HasAttClass(ATT_TUPLETVIS)) {
        const att = element;
        assertAtt(att);
        if (attrType == "bracket.place") {
            att.SetBracketPlace(att.StrToStaffrelBasic(attrValue));
            return true;
        }
        if (attrType == "bracket.visible") {
            att.SetBracketVisible(att.StrToBoolean(attrValue));
            return true;
        }
        if (attrType == "num.format") {
            att.SetNumFormat(att.StrToTupletVisNumformat(attrValue));
            return true;
        }
    }

    return false;

  }

  static GetVisual(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    if (element.HasAttClass(ATT_ANNOTVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasPlace()) {
            attributes.push(["place", att.PlacementToStr(att.GetPlace())]);
        }
    }
    if (element.HasAttClass(ATT_ARPEGVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasArrow()) {
            attributes.push(["arrow", att.BooleanToStr(att.GetArrow())]);
        }
        if (att.HasArrowShape()) {
            attributes.push(["arrow.shape", att.LinestartendsymbolToStr(att.GetArrowShape())]);
        }
        if (att.HasArrowSize()) {
            attributes.push(["arrow.size", att.IntToStr(att.GetArrowSize())]);
        }
        if (att.HasArrowColor()) {
            attributes.push(["arrow.color", att.StrToStr(att.GetArrowColor())]);
        }
        if (att.HasArrowFillcolor()) {
            attributes.push(["arrow.fillcolor", att.StrToStr(att.GetArrowFillcolor())]);
        }
    }
    if (element.HasAttClass(ATT_BARLINEVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasLen()) {
            attributes.push(["len", att.DblToStr(att.GetLen())]);
        }
        if (att.HasMethod()) {
            attributes.push(["method", att.BarmethodToStr(att.GetMethod())]);
        }
        if (att.HasPlace()) {
            attributes.push(["place", att.IntToStr(att.GetPlace())]);
        }
    }
    if (element.HasAttClass(ATT_BEAMINGVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasBeamColor()) {
            attributes.push(["beam.color", att.StrToStr(att.GetBeamColor())]);
        }
        if (att.HasBeamRend()) {
            attributes.push(["beam.rend", att.BeamingVisBeamrendToStr(att.GetBeamRend())]);
        }
        if (att.HasBeamSlope()) {
            attributes.push(["beam.slope", att.DblToStr(att.GetBeamSlope())]);
        }
    }
    if (element.HasAttClass(ATT_BEATRPTVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasSlash()) {
            attributes.push(["slash", att.BeatrptRendToStr(att.GetSlash())]);
        }
    }
    if (element.HasAttClass(ATT_CHORDVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasCluster()) {
            attributes.push(["cluster", att.ClusterToStr(att.GetCluster())]);
        }
    }
    if (element.HasAttClass(ATT_CLEFFINGVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasClefColor()) {
            attributes.push(["clef.color", att.StrToStr(att.GetClefColor())]);
        }
        if (att.HasClefVisible()) {
            attributes.push(["clef.visible", att.BooleanToStr(att.GetClefVisible())]);
        }
    }
    if (element.HasAttClass(ATT_CURVATUREDIRECTION)) {
        const att = element;
        assertAtt(att);
        if (att.HasCurve()) {
            attributes.push(["curve", att.CurvatureDirectionCurveToStr(att.GetCurve())]);
        }
    }
    if (element.HasAttClass(ATT_EPISEMAVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.EpisemaVisFormToStr(att.GetForm())]);
        }
        if (att.HasPlace()) {
            attributes.push(["place", att.EventrelToStr(att.GetPlace())]);
        }
    }
    if (element.HasAttClass(ATT_FTREMVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasBeams()) {
            attributes.push(["beams", att.IntToStr(att.GetBeams())]);
        }
        if (att.HasBeamsFloat()) {
            attributes.push(["beams.float", att.IntToStr(att.GetBeamsFloat())]);
        }
        if (att.HasFloatGap()) {
            attributes.push(["float.gap", att.MeasurementunsignedToStr(att.GetFloatGap())]);
        }
    }
    if (element.HasAttClass(ATT_FERMATAVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.FermataVisFormToStr(att.GetForm())]);
        }
        if (att.HasShape()) {
            attributes.push(["shape", att.FermataVisShapeToStr(att.GetShape())]);
        }
    }
    if (element.HasAttClass(ATT_FINGGRPVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasOrient()) {
            attributes.push(["orient", att.FingGrpVisOrientToStr(att.GetOrient())]);
        }
    }
    if (element.HasAttClass(ATT_GUITARGRIDVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasGridShow()) {
            attributes.push(["grid.show", att.BooleanToStr(att.GetGridShow())]);
        }
    }
    if (element.HasAttClass(ATT_HAIRPINVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasOpening()) {
            attributes.push(["opening", att.MeasurementunsignedToStr(att.GetOpening())]);
        }
        if (att.HasClosed()) {
            attributes.push(["closed", att.BooleanToStr(att.GetClosed())]);
        }
        if (att.HasOpeningVertical()) {
            attributes.push(["opening.vertical", att.BooleanToStr(att.GetOpeningVertical())]);
        }
        if (att.HasAngleOptimize()) {
            attributes.push(["angle.optimize", att.BooleanToStr(att.GetAngleOptimize())]);
        }
    }
    if (element.HasAttClass(ATT_HARMVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasRendgrid()) {
            attributes.push(["rendgrid", att.HarmVisRendgridToStr(att.GetRendgrid())]);
        }
    }
    if (element.HasAttClass(ATT_HISPANTICKVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasPlace()) {
            attributes.push(["place", att.EventrelToStr(att.GetPlace())]);
        }
        if (att.HasTilt()) {
            attributes.push(["tilt", att.CompassdirectionToStr(att.GetTilt())]);
        }
    }
    if (element.HasAttClass(ATT_KEYSIGVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasCancelaccid()) {
            attributes.push(["cancelaccid", att.CancelaccidToStr(att.GetCancelaccid())]);
        }
    }
    if (element.HasAttClass(ATT_KEYSIGDEFAULTVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasKeysigCancelaccid()) {
            attributes.push(["keysig.cancelaccid", att.CancelaccidToStr(att.GetKeysigCancelaccid())]);
        }
        if (att.HasKeysigVisible()) {
            attributes.push(["keysig.visible", att.BooleanToStr(att.GetKeysigVisible())]);
        }
    }
    if (element.HasAttClass(ATT_LIGATUREVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.LigatureformToStr(att.GetForm())]);
        }
    }
    if (element.HasAttClass(ATT_LINEVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.LineformToStr(att.GetForm())]);
        }
        if (att.HasWidth()) {
            attributes.push(["width", att.LinewidthToStr(att.GetWidth())]);
        }
        if (att.HasEndsym()) {
            attributes.push(["endsym", att.LinestartendsymbolToStr(att.GetEndsym())]);
        }
        if (att.HasEndsymSize()) {
            attributes.push(["endsym.size", att.IntToStr(att.GetEndsymSize())]);
        }
        if (att.HasStartsym()) {
            attributes.push(["startsym", att.LinestartendsymbolToStr(att.GetStartsym())]);
        }
        if (att.HasStartsymSize()) {
            attributes.push(["startsym.size", att.IntToStr(att.GetStartsymSize())]);
        }
    }
    if (element.HasAttClass(ATT_LIQUESCENTVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasLooped()) {
            attributes.push(["looped", att.BooleanToStr(att.GetLooped())]);
        }
    }
    if (element.HasAttClass(ATT_MENSURVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasDot()) {
            attributes.push(["dot", att.BooleanToStr(att.GetDot())]);
        }
        if (att.HasForm()) {
            attributes.push(["form", att.MensurVisFormToStr(att.GetForm())]);
        }
        if (att.HasOrient()) {
            attributes.push(["orient", att.OrientationToStr(att.GetOrient())]);
        }
        if (att.HasSign()) {
            attributes.push(["sign", att.MensurationsignToStr(att.GetSign())]);
        }
    }
    if (element.HasAttClass(ATT_MENSURALVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasMensurColor()) {
            attributes.push(["mensur.color", att.StrToStr(att.GetMensurColor())]);
        }
        if (att.HasMensurDot()) {
            attributes.push(["mensur.dot", att.BooleanToStr(att.GetMensurDot())]);
        }
        if (att.HasMensurForm()) {
            attributes.push(["mensur.form", att.MensuralVisMensurformToStr(att.GetMensurForm())]);
        }
        if (att.HasMensurLoc()) {
            attributes.push(["mensur.loc", att.IntToStr(att.GetMensurLoc())]);
        }
        if (att.HasMensurOrient()) {
            attributes.push(["mensur.orient", att.OrientationToStr(att.GetMensurOrient())]);
        }
        if (att.HasMensurSign()) {
            attributes.push(["mensur.sign", att.MensurationsignToStr(att.GetMensurSign())]);
        }
        if (att.HasMensurSize()) {
            attributes.push(["mensur.size", att.FontsizeToStr(att.GetMensurSize())]);
        }
        if (att.HasMensurSlash()) {
            attributes.push(["mensur.slash", att.IntToStr(att.GetMensurSlash())]);
        }
    }
    if (element.HasAttClass(ATT_METERSIGVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.MeterformToStr(att.GetForm())]);
        }
    }
    if (element.HasAttClass(ATT_METERSIGDEFAULTVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasMeterForm()) {
            attributes.push(["meter.form", att.MeterformToStr(att.GetMeterForm())]);
        }
        if (att.HasMeterShowchange()) {
            attributes.push(["meter.showchange", att.BooleanToStr(att.GetMeterShowchange())]);
        }
        if (att.HasMeterVisible()) {
            attributes.push(["meter.visible", att.BooleanToStr(att.GetMeterVisible())]);
        }
    }
    if (element.HasAttClass(ATT_MULTIRESTVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasBlock()) {
            attributes.push(["block", att.BooleanToStr(att.GetBlock())]);
        }
    }
    if (element.HasAttClass(ATT_PBVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasFolium()) {
            attributes.push(["folium", att.PbVisFoliumToStr(att.GetFolium())]);
        }
    }
    if (element.HasAttClass(ATT_PEDALVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.PedalstyleToStr(att.GetForm())]);
        }
    }
    if (element.HasAttClass(ATT_PLICAVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasDir()) {
            attributes.push(["dir", att.StemdirectionBasicToStr(att.GetDir())]);
        }
        if (att.HasLen()) {
            attributes.push(["len", att.MeasurementunsignedToStr(att.GetLen())]);
        }
    }
    if (element.HasAttClass(ATT_QUILISMAVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasWaves()) {
            attributes.push(["waves", att.IntToStr(att.GetWaves())]);
        }
    }
    if (element.HasAttClass(ATT_SBVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasForm()) {
            attributes.push(["form", att.SbVisFormToStr(att.GetForm())]);
        }
    }
    if (element.HasAttClass(ATT_SCOREDEFVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasVuHeight()) {
            attributes.push(["vu.height", att.StrToStr(att.GetVuHeight())]);
        }
    }
    if (element.HasAttClass(ATT_SECTIONVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasRestart()) {
            attributes.push(["restart", att.BooleanToStr(att.GetRestart())]);
        }
    }
    if (element.HasAttClass(ATT_SIGNIFLETVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasPlace()) {
            attributes.push(["place", att.EventrelToStr(att.GetPlace())]);
        }
    }
    if (element.HasAttClass(ATT_SPACEVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasCompressable()) {
            attributes.push(["compressable", att.BooleanToStr(att.GetCompressable())]);
        }
    }
    if (element.HasAttClass(ATT_STAFFDEFVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasLayerscheme()) {
            attributes.push(["layerscheme", att.LayerschemeToStr(att.GetLayerscheme())]);
        }
        if (att.HasLinesColor()) {
            attributes.push(["lines.color", att.StrToStr(att.GetLinesColor())]);
        }
        if (att.HasLinesVisible()) {
            attributes.push(["lines.visible", att.BooleanToStr(att.GetLinesVisible())]);
        }
        if (att.HasSpacing()) {
            attributes.push(["spacing", att.MeasurementsignedToStr(att.GetSpacing())]);
        }
    }
    if (element.HasAttClass(ATT_STAFFGRPVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasBarThru()) {
            attributes.push(["bar.thru", att.BooleanToStr(att.GetBarThru())]);
        }
    }
    if (element.HasAttClass(ATT_STEMVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasPos()) {
            attributes.push(["pos", att.StempositionToStr(att.GetPos())]);
        }
        if (att.HasLen()) {
            attributes.push(["len", att.MeasurementunsignedToStr(att.GetLen())]);
        }
        if (att.HasForm()) {
            attributes.push(["form", att.StemformMensuralToStr(att.GetForm())]);
        }
        if (att.HasDir()) {
            attributes.push(["dir", att.StemdirectionToStr(att.GetDir())]);
        }
        if (att.HasFlagPos()) {
            attributes.push(["flag.pos", att.FlagposMensuralToStr(att.GetFlagPos())]);
        }
        if (att.HasFlagForm()) {
            attributes.push(["flag.form", att.FlagformMensuralToStr(att.GetFlagForm())]);
        }
    }
    if (element.HasAttClass(ATT_TUPLETVIS)) {
        const att = element;
        assertAtt(att);
        if (att.HasBracketPlace()) {
            attributes.push(["bracket.place", att.StaffrelBasicToStr(att.GetBracketPlace())]);
        }
        if (att.HasBracketVisible()) {
            attributes.push(["bracket.visible", att.BooleanToStr(att.GetBracketVisible())]);
        }
        if (att.HasNumFormat()) {
            attributes.push(["num.format", att.TupletVisNumformatToStr(att.GetNumFormat())]);
        }
    }

  }

  static CopyVisual(element: AttModuleElementLike, target: AttModuleElementLike): void {
    if (element.HasAttClass(ATT_ANNOTVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetPlace(att.GetPlace());
    }
    if (element.HasAttClass(ATT_ARPEGVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetArrow(att.GetArrow());
        attTarget.SetArrowShape(att.GetArrowShape());
        attTarget.SetArrowSize(att.GetArrowSize());
        attTarget.SetArrowColor(att.GetArrowColor());
        attTarget.SetArrowFillcolor(att.GetArrowFillcolor());
    }
    if (element.HasAttClass(ATT_BARLINEVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLen(att.GetLen());
        attTarget.SetMethod(att.GetMethod());
        attTarget.SetPlace(att.GetPlace());
    }
    if (element.HasAttClass(ATT_BEAMINGVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetBeamColor(att.GetBeamColor());
        attTarget.SetBeamRend(att.GetBeamRend());
        attTarget.SetBeamSlope(att.GetBeamSlope());
    }
    if (element.HasAttClass(ATT_BEATRPTVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetSlash(att.GetSlash());
    }
    if (element.HasAttClass(ATT_CHORDVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCluster(att.GetCluster());
    }
    if (element.HasAttClass(ATT_CLEFFINGVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetClefColor(att.GetClefColor());
        attTarget.SetClefVisible(att.GetClefVisible());
    }
    if (element.HasAttClass(ATT_CURVATUREDIRECTION)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCurve(att.GetCurve());
    }
    if (element.HasAttClass(ATT_EPISEMAVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
        attTarget.SetPlace(att.GetPlace());
    }
    if (element.HasAttClass(ATT_FTREMVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetBeams(att.GetBeams());
        attTarget.SetBeamsFloat(att.GetBeamsFloat());
        attTarget.SetFloatGap(att.GetFloatGap());
    }
    if (element.HasAttClass(ATT_FERMATAVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
        attTarget.SetShape(att.GetShape());
    }
    if (element.HasAttClass(ATT_FINGGRPVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetOrient(att.GetOrient());
    }
    if (element.HasAttClass(ATT_GUITARGRIDVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetGridShow(att.GetGridShow());
    }
    if (element.HasAttClass(ATT_HAIRPINVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetOpening(att.GetOpening());
        attTarget.SetClosed(att.GetClosed());
        attTarget.SetOpeningVertical(att.GetOpeningVertical());
        attTarget.SetAngleOptimize(att.GetAngleOptimize());
    }
    if (element.HasAttClass(ATT_HARMVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetRendgrid(att.GetRendgrid());
    }
    if (element.HasAttClass(ATT_HISPANTICKVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetPlace(att.GetPlace());
        attTarget.SetTilt(att.GetTilt());
    }
    if (element.HasAttClass(ATT_KEYSIGVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCancelaccid(att.GetCancelaccid());
    }
    if (element.HasAttClass(ATT_KEYSIGDEFAULTVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetKeysigCancelaccid(att.GetKeysigCancelaccid());
        attTarget.SetKeysigVisible(att.GetKeysigVisible());
    }
    if (element.HasAttClass(ATT_LIGATUREVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
    }
    if (element.HasAttClass(ATT_LINEVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
        attTarget.SetWidth(att.GetWidth());
        attTarget.SetEndsym(att.GetEndsym());
        attTarget.SetEndsymSize(att.GetEndsymSize());
        attTarget.SetStartsym(att.GetStartsym());
        attTarget.SetStartsymSize(att.GetStartsymSize());
    }
    if (element.HasAttClass(ATT_LIQUESCENTVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLooped(att.GetLooped());
    }
    if (element.HasAttClass(ATT_MENSURVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetDot(att.GetDot());
        attTarget.SetForm(att.GetForm());
        attTarget.SetOrient(att.GetOrient());
        attTarget.SetSign(att.GetSign());
    }
    if (element.HasAttClass(ATT_MENSURALVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMensurColor(att.GetMensurColor());
        attTarget.SetMensurDot(att.GetMensurDot());
        attTarget.SetMensurForm(att.GetMensurForm());
        attTarget.SetMensurLoc(att.GetMensurLoc());
        attTarget.SetMensurOrient(att.GetMensurOrient());
        attTarget.SetMensurSign(att.GetMensurSign());
        attTarget.SetMensurSize(att.GetMensurSize());
        attTarget.SetMensurSlash(att.GetMensurSlash());
    }
    if (element.HasAttClass(ATT_METERSIGVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
    }
    if (element.HasAttClass(ATT_METERSIGDEFAULTVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetMeterForm(att.GetMeterForm());
        attTarget.SetMeterShowchange(att.GetMeterShowchange());
        attTarget.SetMeterVisible(att.GetMeterVisible());
    }
    if (element.HasAttClass(ATT_MULTIRESTVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetBlock(att.GetBlock());
    }
    if (element.HasAttClass(ATT_PBVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetFolium(att.GetFolium());
    }
    if (element.HasAttClass(ATT_PEDALVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
    }
    if (element.HasAttClass(ATT_PLICAVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetDir(att.GetDir());
        attTarget.SetLen(att.GetLen());
    }
    if (element.HasAttClass(ATT_QUILISMAVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetWaves(att.GetWaves());
    }
    if (element.HasAttClass(ATT_SBVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetForm(att.GetForm());
    }
    if (element.HasAttClass(ATT_SCOREDEFVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetVuHeight(att.GetVuHeight());
    }
    if (element.HasAttClass(ATT_SECTIONVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetRestart(att.GetRestart());
    }
    if (element.HasAttClass(ATT_SIGNIFLETVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetPlace(att.GetPlace());
    }
    if (element.HasAttClass(ATT_SPACEVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetCompressable(att.GetCompressable());
    }
    if (element.HasAttClass(ATT_STAFFDEFVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetLayerscheme(att.GetLayerscheme());
        attTarget.SetLinesColor(att.GetLinesColor());
        attTarget.SetLinesVisible(att.GetLinesVisible());
        attTarget.SetSpacing(att.GetSpacing());
    }
    if (element.HasAttClass(ATT_STAFFGRPVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetBarThru(att.GetBarThru());
    }
    if (element.HasAttClass(ATT_STEMVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetPos(att.GetPos());
        attTarget.SetLen(att.GetLen());
        attTarget.SetForm(att.GetForm());
        attTarget.SetDir(att.GetDir());
        attTarget.SetFlagPos(att.GetFlagPos());
        attTarget.SetFlagForm(att.GetFlagForm());
    }
    if (element.HasAttClass(ATT_TUPLETVIS)) {
        const att = element;
        assertAtt(att);
        const attTarget = target;
        assertAtt(attTarget);
        attTarget.SetBracketPlace(att.GetBracketPlace());
        attTarget.SetBracketVisible(att.GetBracketVisible());
        attTarget.SetNumFormat(att.GetNumFormat());
    }

  }

  static CopyAll(element: AttModuleElementLike, target: AttModuleElementLike): void {
    AttModule.CopyAnalytical(element, target);
    AttModule.CopyCmn(element, target);
    AttModule.CopyCmnornaments(element, target);
    AttModule.CopyCritapp(element, target);
    AttModule.CopyEdittrans(element, target);
    AttModule.CopyExternalsymbols(element, target);
    AttModule.CopyFacsimile(element, target);
    AttModule.CopyFigtable(element, target);
    AttModule.CopyFingering(element, target);
    AttModule.CopyGestural(element, target);
    AttModule.CopyHarmony(element, target);
    AttModule.CopyMei(element, target);
    AttModule.CopyMensural(element, target);
    AttModule.CopyMidi(element, target);
    AttModule.CopyNeumes(element, target);
    AttModule.CopyPagebased(element, target);
    AttModule.CopyPerformance(element, target);
    AttModule.CopyShared(element, target);
    AttModule.CopyStringtab(element, target);
    AttModule.CopyUsersymbols(element, target);
    AttModule.CopyVisual(element, target);
  }

  static GetAll(element: AttModuleElementLike, attributes: ArrayOfStrAttr): void {
    AttModule.GetAnalytical(element, attributes);
    AttModule.GetCmn(element, attributes);
    AttModule.GetCmnornaments(element, attributes);
    AttModule.GetCritapp(element, attributes);
    AttModule.GetEdittrans(element, attributes);
    AttModule.GetExternalsymbols(element, attributes);
    AttModule.GetFacsimile(element, attributes);
    AttModule.GetFigtable(element, attributes);
    AttModule.GetFingering(element, attributes);
    AttModule.GetGestural(element, attributes);
    AttModule.GetHarmony(element, attributes);
    AttModule.GetMei(element, attributes);
    AttModule.GetMensural(element, attributes);
    AttModule.GetMidi(element, attributes);
    AttModule.GetNeumes(element, attributes);
    AttModule.GetPagebased(element, attributes);
    AttModule.GetPerformance(element, attributes);
    AttModule.GetShared(element, attributes);
    AttModule.GetStringtab(element, attributes);
    AttModule.GetUsersymbols(element, attributes);
    AttModule.GetVisual(element, attributes);
  }
}
