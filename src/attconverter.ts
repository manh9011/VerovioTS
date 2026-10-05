/**
 * Pure TypeScript translation of libmei/dist/attconverter.cpp.
 * Generated from the canonical C++ converter implementation; enum values
 * are numerically identical and conversion control flow is preserved.
 */

import { LogWarning } from './vrv';

const ACCIDENTAL_GESTURAL_NONE = 0;
const ACCIDENTAL_GESTURAL_basic_NONE = 0;
const ACCIDENTAL_GESTURAL_basic_f = 2;
const ACCIDENTAL_GESTURAL_basic_ff = 4;
const ACCIDENTAL_GESTURAL_basic_n = 7;
const ACCIDENTAL_GESTURAL_basic_s = 1;
const ACCIDENTAL_GESTURAL_basic_ss = 3;
const ACCIDENTAL_GESTURAL_basic_tf = 6;
const ACCIDENTAL_GESTURAL_basic_ts = 5;
const ACCIDENTAL_GESTURAL_bf = 19;
const ACCIDENTAL_GESTURAL_bmf = 21;
const ACCIDENTAL_GESTURAL_bms = 14;
const ACCIDENTAL_GESTURAL_bs = 16;
const ACCIDENTAL_GESTURAL_extended_NONE = 0;
const ACCIDENTAL_GESTURAL_extended_fd = 4;
const ACCIDENTAL_GESTURAL_extended_ffd = 6;
const ACCIDENTAL_GESTURAL_extended_fu = 3;
const ACCIDENTAL_GESTURAL_extended_sd = 2;
const ACCIDENTAL_GESTURAL_extended_su = 1;
const ACCIDENTAL_GESTURAL_extended_xu = 5;
const ACCIDENTAL_GESTURAL_f = 2;
const ACCIDENTAL_GESTURAL_fd = 11;
const ACCIDENTAL_GESTURAL_ff = 4;
const ACCIDENTAL_GESTURAL_ffd = 13;
const ACCIDENTAL_GESTURAL_fu = 10;
const ACCIDENTAL_GESTURAL_kf = 18;
const ACCIDENTAL_GESTURAL_kmf = 20;
const ACCIDENTAL_GESTURAL_kms = 15;
const ACCIDENTAL_GESTURAL_koron = 22;
const ACCIDENTAL_GESTURAL_ks = 17;
const ACCIDENTAL_GESTURAL_n = 7;
const ACCIDENTAL_GESTURAL_s = 1;
const ACCIDENTAL_GESTURAL_sd = 9;
const ACCIDENTAL_GESTURAL_sori = 23;
const ACCIDENTAL_GESTURAL_ss = 3;
const ACCIDENTAL_GESTURAL_su = 8;
const ACCIDENTAL_GESTURAL_tf = 6;
const ACCIDENTAL_GESTURAL_ts = 5;
const ACCIDENTAL_GESTURAL_xu = 12;
const ACCIDENTAL_WRITTEN_1qf = 23;
const ACCIDENTAL_WRITTEN_1qs = 25;
const ACCIDENTAL_WRITTEN_3qf = 24;
const ACCIDENTAL_WRITTEN_3qs = 26;
const ACCIDENTAL_WRITTEN_NONE = 0;
const ACCIDENTAL_WRITTEN_basic_NONE = 0;
const ACCIDENTAL_WRITTEN_basic_f = 2;
const ACCIDENTAL_WRITTEN_basic_ff = 5;
const ACCIDENTAL_WRITTEN_basic_n = 10;
const ACCIDENTAL_WRITTEN_basic_nf = 11;
const ACCIDENTAL_WRITTEN_basic_ns = 12;
const ACCIDENTAL_WRITTEN_basic_s = 1;
const ACCIDENTAL_WRITTEN_basic_ss = 3;
const ACCIDENTAL_WRITTEN_basic_sx = 7;
const ACCIDENTAL_WRITTEN_basic_tf = 9;
const ACCIDENTAL_WRITTEN_basic_ts = 8;
const ACCIDENTAL_WRITTEN_basic_x = 4;
const ACCIDENTAL_WRITTEN_basic_xs = 6;
const ACCIDENTAL_WRITTEN_bf = 32;
const ACCIDENTAL_WRITTEN_bmf = 34;
const ACCIDENTAL_WRITTEN_bms = 27;
const ACCIDENTAL_WRITTEN_bs = 29;
const ACCIDENTAL_WRITTEN_extended_1qf = 11;
const ACCIDENTAL_WRITTEN_extended_1qs = 13;
const ACCIDENTAL_WRITTEN_extended_3qf = 12;
const ACCIDENTAL_WRITTEN_extended_3qs = 14;
const ACCIDENTAL_WRITTEN_extended_NONE = 0;
const ACCIDENTAL_WRITTEN_extended_fd = 4;
const ACCIDENTAL_WRITTEN_extended_ffd = 10;
const ACCIDENTAL_WRITTEN_extended_ffu = 9;
const ACCIDENTAL_WRITTEN_extended_fu = 3;
const ACCIDENTAL_WRITTEN_extended_nd = 6;
const ACCIDENTAL_WRITTEN_extended_nu = 5;
const ACCIDENTAL_WRITTEN_extended_sd = 2;
const ACCIDENTAL_WRITTEN_extended_su = 1;
const ACCIDENTAL_WRITTEN_extended_xd = 8;
const ACCIDENTAL_WRITTEN_extended_xu = 7;
const ACCIDENTAL_WRITTEN_f = 2;
const ACCIDENTAL_WRITTEN_fd = 16;
const ACCIDENTAL_WRITTEN_ff = 5;
const ACCIDENTAL_WRITTEN_ffd = 22;
const ACCIDENTAL_WRITTEN_ffu = 21;
const ACCIDENTAL_WRITTEN_fu = 15;
const ACCIDENTAL_WRITTEN_kf = 31;
const ACCIDENTAL_WRITTEN_kmf = 33;
const ACCIDENTAL_WRITTEN_kms = 28;
const ACCIDENTAL_WRITTEN_koron = 35;
const ACCIDENTAL_WRITTEN_ks = 30;
const ACCIDENTAL_WRITTEN_n = 10;
const ACCIDENTAL_WRITTEN_nd = 18;
const ACCIDENTAL_WRITTEN_nf = 11;
const ACCIDENTAL_WRITTEN_ns = 12;
const ACCIDENTAL_WRITTEN_nu = 17;
const ACCIDENTAL_WRITTEN_s = 1;
const ACCIDENTAL_WRITTEN_sd = 14;
const ACCIDENTAL_WRITTEN_sori = 36;
const ACCIDENTAL_WRITTEN_ss = 3;
const ACCIDENTAL_WRITTEN_su = 13;
const ACCIDENTAL_WRITTEN_sx = 7;
const ACCIDENTAL_WRITTEN_tf = 9;
const ACCIDENTAL_WRITTEN_ts = 8;
const ACCIDENTAL_WRITTEN_x = 4;
const ACCIDENTAL_WRITTEN_xd = 20;
const ACCIDENTAL_WRITTEN_xs = 6;
const ACCIDENTAL_WRITTEN_xu = 19;
const ACCIDENTAL_aeu_NONE = 0;
const ACCIDENTAL_aeu_bf = 6;
const ACCIDENTAL_aeu_bmf = 8;
const ACCIDENTAL_aeu_bms = 1;
const ACCIDENTAL_aeu_bs = 3;
const ACCIDENTAL_aeu_kf = 5;
const ACCIDENTAL_aeu_kmf = 7;
const ACCIDENTAL_aeu_kms = 2;
const ACCIDENTAL_aeu_ks = 4;
const ACCIDENTAL_persian_NONE = 0;
const ACCIDENTAL_persian_koron = 1;
const ACCIDENTAL_persian_sori = 2;
const ARTICULATION_NONE = 0;
const ARTICULATION_acc = 1;
const ARTICULATION_acc_inv = 2;
const ARTICULATION_acc_long = 3;
const ARTICULATION_acc_soft = 4;
const ARTICULATION_bend = 18;
const ARTICULATION_damp = 27;
const ARTICULATION_dampall = 28;
const ARTICULATION_dbltongue = 31;
const ARTICULATION_dnbow = 22;
const ARTICULATION_doit = 12;
const ARTICULATION_dot = 37;
const ARTICULATION_fall = 16;
const ARTICULATION_fingernail = 26;
const ARTICULATION_flip = 19;
const ARTICULATION_harm = 24;
const ARTICULATION_heel = 33;
const ARTICULATION_lhpizz = 36;
const ARTICULATION_longfall = 17;
const ARTICULATION_marc = 8;
const ARTICULATION_open = 29;
const ARTICULATION_plop = 15;
const ARTICULATION_rip = 14;
const ARTICULATION_scoop = 13;
const ARTICULATION_shake = 21;
const ARTICULATION_smear = 20;
const ARTICULATION_snap = 25;
const ARTICULATION_spicc = 9;
const ARTICULATION_stacc = 5;
const ARTICULATION_stacciss = 7;
const ARTICULATION_stop = 30;
const ARTICULATION_stress = 10;
const ARTICULATION_stroke = 38;
const ARTICULATION_tap = 35;
const ARTICULATION_ten = 6;
const ARTICULATION_toe = 34;
const ARTICULATION_trpltongue = 32;
const ARTICULATION_unstress = 11;
const ARTICULATION_upbow = 23;
const BARMETHOD_NONE = 0;
const BARMETHOD_mensur = 1;
const BARMETHOD_staff = 2;
const BARMETHOD_takt = 3;
const BARRENDITION_NONE = 0;
const BARRENDITION_dashed = 1;
const BARRENDITION_dbl = 3;
const BARRENDITION_dbldashed = 4;
const BARRENDITION_dbldotted = 5;
const BARRENDITION_dblheavy = 6;
const BARRENDITION_dblsegno = 7;
const BARRENDITION_dotted = 2;
const BARRENDITION_end = 8;
const BARRENDITION_heavy = 9;
const BARRENDITION_invis = 10;
const BARRENDITION_rptboth = 12;
const BARRENDITION_rptend = 13;
const BARRENDITION_rptstart = 11;
const BARRENDITION_segno = 14;
const BARRENDITION_single = 15;
const BEAMPLACE_NONE = 0;
const BEAMPLACE_above = 1;
const BEAMPLACE_below = 2;
const BEAMPLACE_mixed = 3;
const BETYPE_NONE = 0;
const BETYPE_byte = 1;
const BETYPE_midi = 3;
const BETYPE_mmc = 4;
const BETYPE_mtc = 5;
const BETYPE_smil = 2;
const BETYPE_smpte_24 = 7;
const BETYPE_smpte_25 = 6;
const BETYPE_smpte_df29_97 = 10;
const BETYPE_smpte_df30 = 8;
const BETYPE_smpte_ndf29_97 = 11;
const BETYPE_smpte_ndf30 = 9;
const BETYPE_tcf = 12;
const BETYPE_time = 13;
const BOOLEAN_NONE = 0;
const BOOLEAN_false = 2;
const BOOLEAN_true = 1;
const CANCELACCID_NONE = 0;
const CANCELACCID_after = 3;
const CANCELACCID_before = 2;
const CANCELACCID_before_bar = 4;
const CANCELACCID_none = 1;
const CERTAINTY_NONE = 0;
const CERTAINTY_high = 1;
const CERTAINTY_low = 3;
const CERTAINTY_medium = 2;
const CERTAINTY_unknown = 4;
const CLEFSHAPE_C = 4;
const CLEFSHAPE_F = 3;
const CLEFSHAPE_G = 1;
const CLEFSHAPE_GG = 2;
const CLEFSHAPE_NONE = 0;
const CLEFSHAPE_TAB = 6;
const CLEFSHAPE_perc = 5;
const CLUSTER_NONE = 0;
const CLUSTER_black = 2;
const CLUSTER_chromatic = 3;
const CLUSTER_white = 1;
const COLORNAMES_NONE = 0;
const COLORNAMES_aliceblue = 1;
const COLORNAMES_antiquewhite = 2;
const COLORNAMES_aqua = 3;
const COLORNAMES_aquamarine = 4;
const COLORNAMES_azure = 5;
const COLORNAMES_beige = 6;
const COLORNAMES_bisque = 7;
const COLORNAMES_black = 8;
const COLORNAMES_blanchedalmond = 9;
const COLORNAMES_blue = 10;
const COLORNAMES_blueviolet = 11;
const COLORNAMES_brown = 12;
const COLORNAMES_burlywood = 13;
const COLORNAMES_cadetblue = 14;
const COLORNAMES_chartreuse = 15;
const COLORNAMES_chocolate = 16;
const COLORNAMES_coral = 17;
const COLORNAMES_cornflowerblue = 18;
const COLORNAMES_cornsilk = 19;
const COLORNAMES_crimson = 20;
const COLORNAMES_cyan = 21;
const COLORNAMES_darkblue = 22;
const COLORNAMES_darkcyan = 23;
const COLORNAMES_darkgoldenrod = 24;
const COLORNAMES_darkgray = 25;
const COLORNAMES_darkgreen = 26;
const COLORNAMES_darkgrey = 27;
const COLORNAMES_darkkhaki = 28;
const COLORNAMES_darkmagenta = 29;
const COLORNAMES_darkolivegreen = 30;
const COLORNAMES_darkorange = 31;
const COLORNAMES_darkorchid = 32;
const COLORNAMES_darkred = 33;
const COLORNAMES_darksalmon = 34;
const COLORNAMES_darkseagreen = 35;
const COLORNAMES_darkslateblue = 36;
const COLORNAMES_darkslategray = 37;
const COLORNAMES_darkslategrey = 38;
const COLORNAMES_darkturquoise = 39;
const COLORNAMES_darkviolet = 40;
const COLORNAMES_deeppink = 41;
const COLORNAMES_deepskyblue = 42;
const COLORNAMES_dimgray = 43;
const COLORNAMES_dimgrey = 44;
const COLORNAMES_dodgerblue = 45;
const COLORNAMES_firebrick = 46;
const COLORNAMES_floralwhite = 47;
const COLORNAMES_forestgreen = 48;
const COLORNAMES_fuchsia = 49;
const COLORNAMES_gainsboro = 50;
const COLORNAMES_ghostwhite = 51;
const COLORNAMES_gold = 52;
const COLORNAMES_goldenrod = 53;
const COLORNAMES_gray = 54;
const COLORNAMES_green = 55;
const COLORNAMES_greenyellow = 56;
const COLORNAMES_grey = 57;
const COLORNAMES_honeydew = 58;
const COLORNAMES_hotpink = 59;
const COLORNAMES_indianred = 60;
const COLORNAMES_indigo = 61;
const COLORNAMES_ivory = 62;
const COLORNAMES_khaki = 63;
const COLORNAMES_lavender = 64;
const COLORNAMES_lavenderblush = 65;
const COLORNAMES_lawngreen = 66;
const COLORNAMES_lemonchiffon = 67;
const COLORNAMES_lightblue = 68;
const COLORNAMES_lightcoral = 69;
const COLORNAMES_lightcyan = 70;
const COLORNAMES_lightgoldenrodyellow = 71;
const COLORNAMES_lightgray = 72;
const COLORNAMES_lightgreen = 73;
const COLORNAMES_lightgrey = 74;
const COLORNAMES_lightpink = 75;
const COLORNAMES_lightsalmon = 76;
const COLORNAMES_lightseagreen = 77;
const COLORNAMES_lightskyblue = 78;
const COLORNAMES_lightslategray = 79;
const COLORNAMES_lightslategrey = 80;
const COLORNAMES_lightsteelblue = 81;
const COLORNAMES_lightyellow = 82;
const COLORNAMES_lime = 83;
const COLORNAMES_limegreen = 84;
const COLORNAMES_linen = 85;
const COLORNAMES_magenta = 86;
const COLORNAMES_maroon = 87;
const COLORNAMES_mediumaquamarine = 88;
const COLORNAMES_mediumblue = 89;
const COLORNAMES_mediumorchid = 90;
const COLORNAMES_mediumpurple = 91;
const COLORNAMES_mediumseagreen = 92;
const COLORNAMES_mediumslateblue = 93;
const COLORNAMES_mediumspringgreen = 94;
const COLORNAMES_mediumturquoise = 95;
const COLORNAMES_mediumvioletred = 96;
const COLORNAMES_midnightblue = 97;
const COLORNAMES_mintcream = 98;
const COLORNAMES_mistyrose = 99;
const COLORNAMES_moccasin = 100;
const COLORNAMES_navajowhite = 101;
const COLORNAMES_navy = 102;
const COLORNAMES_oldlace = 103;
const COLORNAMES_olive = 104;
const COLORNAMES_olivedrab = 105;
const COLORNAMES_orange = 106;
const COLORNAMES_orangered = 107;
const COLORNAMES_orchid = 108;
const COLORNAMES_palegoldenrod = 109;
const COLORNAMES_palegreen = 110;
const COLORNAMES_paleturquoise = 111;
const COLORNAMES_palevioletred = 112;
const COLORNAMES_papayawhip = 113;
const COLORNAMES_peachpuff = 114;
const COLORNAMES_peru = 115;
const COLORNAMES_pink = 116;
const COLORNAMES_plum = 117;
const COLORNAMES_powderblue = 118;
const COLORNAMES_purple = 119;
const COLORNAMES_rebeccapurple = 120;
const COLORNAMES_red = 121;
const COLORNAMES_rosybrown = 122;
const COLORNAMES_royalblue = 123;
const COLORNAMES_saddlebrown = 124;
const COLORNAMES_salmon = 125;
const COLORNAMES_sandybrown = 126;
const COLORNAMES_seagreen = 127;
const COLORNAMES_seashell = 128;
const COLORNAMES_sienna = 129;
const COLORNAMES_silver = 130;
const COLORNAMES_skyblue = 131;
const COLORNAMES_slateblue = 132;
const COLORNAMES_slategray = 133;
const COLORNAMES_slategrey = 134;
const COLORNAMES_snow = 135;
const COLORNAMES_springgreen = 136;
const COLORNAMES_steelblue = 137;
const COLORNAMES_tan = 138;
const COLORNAMES_teal = 139;
const COLORNAMES_thistle = 140;
const COLORNAMES_tomato = 141;
const COLORNAMES_turquoise = 142;
const COLORNAMES_violet = 143;
const COLORNAMES_wheat = 144;
const COLORNAMES_white = 145;
const COLORNAMES_whitesmoke = 146;
const COLORNAMES_yellow = 147;
const COLORNAMES_yellowgreen = 148;
const COMPASSDIRECTION_NONE = 0;
const COMPASSDIRECTION_basic_NONE = 0;
const COMPASSDIRECTION_basic_e = 2;
const COMPASSDIRECTION_basic_n = 1;
const COMPASSDIRECTION_basic_s = 3;
const COMPASSDIRECTION_basic_w = 4;
const COMPASSDIRECTION_e = 2;
const COMPASSDIRECTION_extended_NONE = 0;
const COMPASSDIRECTION_extended_ne = 1;
const COMPASSDIRECTION_extended_nw = 2;
const COMPASSDIRECTION_extended_se = 3;
const COMPASSDIRECTION_extended_sw = 4;
const COMPASSDIRECTION_n = 1;
const COMPASSDIRECTION_ne = 5;
const COMPASSDIRECTION_nw = 6;
const COMPASSDIRECTION_s = 3;
const COMPASSDIRECTION_se = 7;
const COMPASSDIRECTION_sw = 8;
const COMPASSDIRECTION_w = 4;
const COURSETUNING_NONE = 0;
const COURSETUNING_guitar_drop_D = 2;
const COURSETUNING_guitar_open_A = 5;
const COURSETUNING_guitar_open_D = 3;
const COURSETUNING_guitar_open_G = 4;
const COURSETUNING_guitar_standard = 1;
const COURSETUNING_lute_baroque_d_major = 7;
const COURSETUNING_lute_baroque_d_minor = 8;
const COURSETUNING_lute_renaissance_6 = 6;
const DIVISIO_NONE = 0;
const DIVISIO_duodenaria = 7;
const DIVISIO_novenaria = 6;
const DIVISIO_octonaria = 5;
const DIVISIO_quaternaria = 2;
const DIVISIO_senariaimperf = 3;
const DIVISIO_senariaperf = 4;
const DIVISIO_ternaria = 1;
const DURATIONRESTS_mensural_2B = 1;
const DURATIONRESTS_mensural_3B = 2;
const DURATIONRESTS_mensural_NONE = 0;
const DURATIONRESTS_mensural_brevis = 5;
const DURATIONRESTS_mensural_fusa = 9;
const DURATIONRESTS_mensural_longa = 4;
const DURATIONRESTS_mensural_maxima = 3;
const DURATIONRESTS_mensural_minima = 7;
const DURATIONRESTS_mensural_semibrevis = 6;
const DURATIONRESTS_mensural_semifusa = 10;
const DURATIONRESTS_mensural_semiminima = 8;
const DURQUALITY_mensural_NONE = 0;
const DURQUALITY_mensural_altera = 3;
const DURQUALITY_mensural_duplex = 6;
const DURQUALITY_mensural_imperfecta = 2;
const DURQUALITY_mensural_maior = 5;
const DURQUALITY_mensural_minor = 4;
const DURQUALITY_mensural_perfecta = 1;
const ENCLOSURE_NONE = 0;
const ENCLOSURE_box = 3;
const ENCLOSURE_brack = 2;
const ENCLOSURE_none = 4;
const ENCLOSURE_paren = 1;
const EVENTREL_NONE = 0;
const EVENTREL_above = 1;
const EVENTREL_above_left = 5;
const EVENTREL_above_right = 6;
const EVENTREL_basic_NONE = 0;
const EVENTREL_basic_above = 1;
const EVENTREL_basic_below = 2;
const EVENTREL_basic_left = 3;
const EVENTREL_basic_right = 4;
const EVENTREL_below = 2;
const EVENTREL_below_left = 7;
const EVENTREL_below_right = 8;
const EVENTREL_extended_NONE = 0;
const EVENTREL_extended_above_left = 1;
const EVENTREL_extended_above_right = 2;
const EVENTREL_extended_below_left = 3;
const EVENTREL_extended_below_right = 4;
const EVENTREL_left = 3;
const EVENTREL_right = 4;
const FILL_NONE = 0;
const FILL_bottom = 4;
const FILL_left = 5;
const FILL_right = 6;
const FILL_solid = 2;
const FILL_top = 3;
const FILL_void = 1;
const FLAGFORM_mensural_NONE = 0;
const FLAGFORM_mensural_angled = 2;
const FLAGFORM_mensural_curled = 3;
const FLAGFORM_mensural_extended = 5;
const FLAGFORM_mensural_flared = 4;
const FLAGFORM_mensural_hooked = 6;
const FLAGFORM_mensural_straight = 1;
const FLAGPOS_mensural_NONE = 0;
const FLAGPOS_mensural_center = 3;
const FLAGPOS_mensural_left = 1;
const FLAGPOS_mensural_right = 2;
const FONTSIZETERM_NONE = 0;
const FONTSIZETERM_large = 5;
const FONTSIZETERM_larger = 9;
const FONTSIZETERM_normal = 4;
const FONTSIZETERM_small = 3;
const FONTSIZETERM_smaller = 8;
const FONTSIZETERM_x_large = 6;
const FONTSIZETERM_x_small = 2;
const FONTSIZETERM_xx_large = 7;
const FONTSIZETERM_xx_small = 1;
const FONTSTYLE_NONE = 0;
const FONTSTYLE_italic = 1;
const FONTSTYLE_normal = 2;
const FONTSTYLE_oblique = 3;
const FONTWEIGHT_NONE = 0;
const FONTWEIGHT_bold = 1;
const FONTWEIGHT_normal = 2;
const FRBRRELATIONSHIP_NONE = 0;
const FRBRRELATIONSHIP_hasAbridgement = 1;
const FRBRRELATIONSHIP_hasAdaptation = 3;
const FRBRRELATIONSHIP_hasAlternate = 5;
const FRBRRELATIONSHIP_hasArrangement = 7;
const FRBRRELATIONSHIP_hasComplement = 9;
const FRBRRELATIONSHIP_hasEmbodiment = 11;
const FRBRRELATIONSHIP_hasExemplar = 13;
const FRBRRELATIONSHIP_hasImitation = 15;
const FRBRRELATIONSHIP_hasPart = 17;
const FRBRRELATIONSHIP_hasRealization = 19;
const FRBRRELATIONSHIP_hasReconfiguration = 21;
const FRBRRELATIONSHIP_hasReproduction = 23;
const FRBRRELATIONSHIP_hasRevision = 25;
const FRBRRELATIONSHIP_hasSuccessor = 27;
const FRBRRELATIONSHIP_hasSummarization = 29;
const FRBRRELATIONSHIP_hasSupplement = 31;
const FRBRRELATIONSHIP_hasTransformation = 33;
const FRBRRELATIONSHIP_hasTranslation = 35;
const FRBRRELATIONSHIP_isAbridgementOf = 2;
const FRBRRELATIONSHIP_isAdaptationOf = 4;
const FRBRRELATIONSHIP_isAlternateOf = 6;
const FRBRRELATIONSHIP_isArrangementOf = 8;
const FRBRRELATIONSHIP_isComplementOf = 10;
const FRBRRELATIONSHIP_isEmbodimentOf = 12;
const FRBRRELATIONSHIP_isExemplarOf = 14;
const FRBRRELATIONSHIP_isImitationOf = 16;
const FRBRRELATIONSHIP_isPartOf = 18;
const FRBRRELATIONSHIP_isRealizationOf = 20;
const FRBRRELATIONSHIP_isReconfigurationOf = 22;
const FRBRRELATIONSHIP_isReproductionOf = 24;
const FRBRRELATIONSHIP_isRevisionOf = 26;
const FRBRRELATIONSHIP_isSuccessorOf = 28;
const FRBRRELATIONSHIP_isSummarizationOf = 30;
const FRBRRELATIONSHIP_isSupplementOf = 32;
const FRBRRELATIONSHIP_isTransformationOf = 34;
const FRBRRELATIONSHIP_isTranslationOf = 36;
const GLISSANDO_NONE = 0;
const GLISSANDO_i = 1;
const GLISSANDO_m = 2;
const GLISSANDO_t = 3;
const GRACE_NONE = 0;
const GRACE_acc = 1;
const GRACE_unacc = 2;
const GRACE_unknown = 3;
const HARPPEDALPOSITION_NONE = 0;
const HARPPEDALPOSITION_f = 1;
const HARPPEDALPOSITION_n = 2;
const HARPPEDALPOSITION_s = 3;
const HEADSHAPE_list_NONE = 0;
const HEADSHAPE_list_backslash = 4;
const HEADSHAPE_list_circle = 5;
const HEADSHAPE_list_diamond = 7;
const HEADSHAPE_list_half = 2;
const HEADSHAPE_list_isotriangle = 8;
const HEADSHAPE_list_oval = 9;
const HEADSHAPE_list_piewedge = 10;
const HEADSHAPE_list_plus = 6;
const HEADSHAPE_list_quarter = 1;
const HEADSHAPE_list_rectangle = 11;
const HEADSHAPE_list_rtriangle = 12;
const HEADSHAPE_list_semicircle = 13;
const HEADSHAPE_list_slash = 14;
const HEADSHAPE_list_square = 15;
const HEADSHAPE_list_whole = 3;
const HEADSHAPE_list_x = 16;
const HORIZONTALALIGNMENT_NONE = 0;
const HORIZONTALALIGNMENT_center = 3;
const HORIZONTALALIGNMENT_justify = 4;
const HORIZONTALALIGNMENT_left = 1;
const HORIZONTALALIGNMENT_right = 2;
const LAYERSCHEME_1 = 1;
const LAYERSCHEME_2f = 3;
const LAYERSCHEME_2o = 2;
const LAYERSCHEME_3f = 5;
const LAYERSCHEME_3o = 4;
const LAYERSCHEME_NONE = 0;
const LIGATUREFORM_NONE = 0;
const LIGATUREFORM_obliqua = 2;
const LIGATUREFORM_recta = 1;
const LINEFORM_NONE = 0;
const LINEFORM_dashed = 1;
const LINEFORM_dotted = 2;
const LINEFORM_solid = 3;
const LINEFORM_wavy = 4;
const LINESTARTENDSYMBOL_CH = 18;
const LINESTARTENDSYMBOL_H = 10;
const LINESTARTENDSYMBOL_N = 11;
const LINESTARTENDSYMBOL_NONE = 0;
const LINESTARTENDSYMBOL_RH = 19;
const LINESTARTENDSYMBOL_T = 16;
const LINESTARTENDSYMBOL_TInv = 17;
const LINESTARTENDSYMBOL_Th = 12;
const LINESTARTENDSYMBOL_ThInv = 15;
const LINESTARTENDSYMBOL_ThRetro = 13;
const LINESTARTENDSYMBOL_ThRetroInv = 14;
const LINESTARTENDSYMBOL_angledown = 1;
const LINESTARTENDSYMBOL_angleleft = 4;
const LINESTARTENDSYMBOL_angleright = 3;
const LINESTARTENDSYMBOL_angleup = 2;
const LINESTARTENDSYMBOL_arrow = 5;
const LINESTARTENDSYMBOL_arrowopen = 6;
const LINESTARTENDSYMBOL_arrowwhite = 7;
const LINESTARTENDSYMBOL_harpoonleft = 8;
const LINESTARTENDSYMBOL_harpoonright = 9;
const LINESTARTENDSYMBOL_none = 20;
const LINEWIDTHTERM_NONE = 0;
const LINEWIDTHTERM_medium = 2;
const LINEWIDTHTERM_narrow = 1;
const LINEWIDTHTERM_wide = 3;
const MARCRELATORS_basic_NONE = 0;
const MARCRELATORS_basic_arr = 1;
const MARCRELATORS_basic_aut = 2;
const MARCRELATORS_basic_cmp = 3;
const MARCRELATORS_basic_dte = 4;
const MARCRELATORS_basic_edt = 5;
const MARCRELATORS_basic_lbt = 6;
const MARCRELATORS_basic_lyr = 7;
const MARCRELATORS_extended_NONE = 0;
const MARCRELATORS_extended_act = 1;
const MARCRELATORS_extended_ard = 2;
const MARCRELATORS_extended_art = 3;
const MARCRELATORS_extended_aus = 4;
const MARCRELATORS_extended_chr = 5;
const MARCRELATORS_extended_cnd = 6;
const MARCRELATORS_extended_crp = 7;
const MARCRELATORS_extended_cst = 8;
const MARCRELATORS_extended_drt = 9;
const MARCRELATORS_extended_egr = 10;
const MARCRELATORS_extended_flm = 11;
const MARCRELATORS_extended_fmd = 12;
const MARCRELATORS_extended_fmp = 13;
const MARCRELATORS_extended_itr = 14;
const MARCRELATORS_extended_mcp = 15;
const MARCRELATORS_extended_msd = 17;
const MARCRELATORS_extended_mus = 16;
const MARCRELATORS_extended_pdr = 18;
const MARCRELATORS_extended_pmn = 19;
const MARCRELATORS_extended_prn = 20;
const MARCRELATORS_extended_pro = 21;
const MARCRELATORS_extended_rce = 22;
const MARCRELATORS_extended_scr = 23;
const MARCRELATORS_extended_sng = 24;
const MARCRELATORS_extended_std = 25;
const MARCRELATORS_extended_trc = 26;
const MARCRELATORS_extended_trl = 27;
const MELODICFUNCTION_23ret = 19;
const MELODICFUNCTION_43sus = 22;
const MELODICFUNCTION_76sus = 24;
const MELODICFUNCTION_78ret = 20;
const MELODICFUNCTION_98sus = 23;
const MELODICFUNCTION_NONE = 0;
const MELODICFUNCTION_aln = 1;
const MELODICFUNCTION_ant = 2;
const MELODICFUNCTION_app = 3;
const MELODICFUNCTION_apt = 4;
const MELODICFUNCTION_arp = 5;
const MELODICFUNCTION_arp7 = 6;
const MELODICFUNCTION_aun = 7;
const MELODICFUNCTION_chg = 8;
const MELODICFUNCTION_cln = 9;
const MELODICFUNCTION_ct = 10;
const MELODICFUNCTION_ct7 = 11;
const MELODICFUNCTION_cun = 12;
const MELODICFUNCTION_cup = 13;
const MELODICFUNCTION_et = 14;
const MELODICFUNCTION_ln = 15;
const MELODICFUNCTION_ped = 16;
const MELODICFUNCTION_rep = 17;
const MELODICFUNCTION_ret = 18;
const MELODICFUNCTION_sus = 21;
const MELODICFUNCTION_un = 25;
const MELODICFUNCTION_un7 = 26;
const MELODICFUNCTION_upt = 27;
const MELODICFUNCTION_upt7 = 28;
const MENSURATIONSIGN_C = 1;
const MENSURATIONSIGN_NONE = 0;
const MENSURATIONSIGN_O = 2;
const MENSURATIONSIGN_d = 15;
const MENSURATIONSIGN_g = 8;
const MENSURATIONSIGN_i = 6;
const MENSURATIONSIGN_n = 13;
const MENSURATIONSIGN_oc = 14;
const MENSURATIONSIGN_p = 10;
const MENSURATIONSIGN_q = 4;
const MENSURATIONSIGN_sg = 7;
const MENSURATIONSIGN_si = 5;
const MENSURATIONSIGN_sp = 9;
const MENSURATIONSIGN_sy = 11;
const MENSURATIONSIGN_t = 3;
const MENSURATIONSIGN_y = 12;
const METERFORM_NONE = 0;
const METERFORM_denomsym = 2;
const METERFORM_norm = 3;
const METERFORM_num = 1;
const METERFORM_symplusnorm = 4;
const METERSIGN_NONE = 0;
const METERSIGN_common = 1;
const METERSIGN_cut = 2;
const METERSIGN_open = 3;
const MIDINAMES_Accordion = 22;
const MIDINAMES_Acoustic_Bass = 33;
const MIDINAMES_Acoustic_Bass_Drum = 129;
const MIDINAMES_Acoustic_Grand_Piano = 1;
const MIDINAMES_Acoustic_Guitar_nylon = 25;
const MIDINAMES_Acoustic_Guitar_steel = 26;
const MIDINAMES_Acoustic_Snare = 132;
const MIDINAMES_Agogo = 114;
const MIDINAMES_Alto_Sax = 66;
const MIDINAMES_Applause = 127;
const MIDINAMES_Bag_pipe = 110;
const MIDINAMES_Banjo = 106;
const MIDINAMES_Baritone_Sax = 68;
const MIDINAMES_Bass_Drum_1 = 130;
const MIDINAMES_Bassoon = 71;
const MIDINAMES_Bird_Tweet = 124;
const MIDINAMES_Blown_Bottle = 77;
const MIDINAMES_Brass_Section = 62;
const MIDINAMES_Breath_Noise = 122;
const MIDINAMES_Bright_Acoustic_Piano = 2;
const MIDINAMES_Cabasa = 163;
const MIDINAMES_Celesta = 9;
const MIDINAMES_Cello = 43;
const MIDINAMES_Chinese_Cymbal = 146;
const MIDINAMES_Choir_Aahs = 53;
const MIDINAMES_Church_Organ = 20;
const MIDINAMES_Clarinet = 72;
const MIDINAMES_Claves = 169;
const MIDINAMES_Clavi = 8;
const MIDINAMES_Closed_Hi_Hat = 136;
const MIDINAMES_Contrabass = 44;
const MIDINAMES_Cowbell = 150;
const MIDINAMES_Crash_Cymbal_1 = 143;
const MIDINAMES_Crash_Cymbal_2 = 151;
const MIDINAMES_Distortion_Guitar = 31;
const MIDINAMES_Drawbar_Organ = 17;
const MIDINAMES_Dulcimer = 16;
const MIDINAMES_Electric_Bass_finger = 34;
const MIDINAMES_Electric_Bass_pick = 35;
const MIDINAMES_Electric_Grand_Piano = 3;
const MIDINAMES_Electric_Guitar_clean = 28;
const MIDINAMES_Electric_Guitar_jazz = 27;
const MIDINAMES_Electric_Guitar_muted = 29;
const MIDINAMES_Electric_Piano_1 = 5;
const MIDINAMES_Electric_Piano_2 = 6;
const MIDINAMES_Electric_Snare = 134;
const MIDINAMES_English_Horn = 70;
const MIDINAMES_FX_1_rain = 97;
const MIDINAMES_FX_2_soundtrack = 98;
const MIDINAMES_FX_3_crystal = 99;
const MIDINAMES_FX_4_atmosphere = 100;
const MIDINAMES_FX_5_brightness = 101;
const MIDINAMES_FX_6_goblins = 102;
const MIDINAMES_FX_7_echoes = 103;
const MIDINAMES_FX_8_sci_fi = 104;
const MIDINAMES_Fiddle = 111;
const MIDINAMES_Flute = 74;
const MIDINAMES_French_Horn = 61;
const MIDINAMES_Fretless_Bass = 36;
const MIDINAMES_Glockenspiel = 10;
const MIDINAMES_Guitar_Fret_Noise = 121;
const MIDINAMES_Guitar_harmonics = 32;
const MIDINAMES_Gunshot = 128;
const MIDINAMES_Hand_Clap = 133;
const MIDINAMES_Harmonica = 23;
const MIDINAMES_Harpsichord = 7;
const MIDINAMES_Helicopter = 126;
const MIDINAMES_Hi_Bongo = 154;
const MIDINAMES_Hi_Mid_Tom = 142;
const MIDINAMES_Hi_Wood_Block = 170;
const MIDINAMES_High_Agogo = 161;
const MIDINAMES_High_Floor_Tom = 137;
const MIDINAMES_High_Timbale = 159;
const MIDINAMES_High_Tom = 144;
const MIDINAMES_Honky_tonk_Piano = 4;
const MIDINAMES_Kalimba = 109;
const MIDINAMES_Koto = 108;
const MIDINAMES_Lead_1_square = 81;
const MIDINAMES_Lead_2_sawtooth = 82;
const MIDINAMES_Lead_3_calliope = 83;
const MIDINAMES_Lead_4_chiff = 84;
const MIDINAMES_Lead_5_charang = 85;
const MIDINAMES_Lead_6_voice = 86;
const MIDINAMES_Lead_7_fifths = 87;
const MIDINAMES_Lead_8_bass_and_lead = 88;
const MIDINAMES_Long_Guiro = 168;
const MIDINAMES_Long_Whistle = 166;
const MIDINAMES_Low_Agogo = 162;
const MIDINAMES_Low_Bongo = 155;
const MIDINAMES_Low_Conga = 158;
const MIDINAMES_Low_Floor_Tom = 135;
const MIDINAMES_Low_Mid_Tom = 141;
const MIDINAMES_Low_Timbale = 160;
const MIDINAMES_Low_Tom = 139;
const MIDINAMES_Low_Wood_Block = 171;
const MIDINAMES_Maracas = 164;
const MIDINAMES_Marimba = 13;
const MIDINAMES_Melodic_Tom = 118;
const MIDINAMES_Music_Box = 11;
const MIDINAMES_Mute_Cuica = 172;
const MIDINAMES_Mute_Hi_Conga = 156;
const MIDINAMES_Mute_Triangle = 174;
const MIDINAMES_Muted_Trumpet = 60;
const MIDINAMES_NONE = 0;
const MIDINAMES_Oboe = 69;
const MIDINAMES_Ocarina = 80;
const MIDINAMES_Open_Cuica = 173;
const MIDINAMES_Open_Hi_Conga = 157;
const MIDINAMES_Open_Hi_Hat = 140;
const MIDINAMES_Open_Triangle = 175;
const MIDINAMES_Orchestra_Hit = 56;
const MIDINAMES_Orchestral_Harp = 47;
const MIDINAMES_Overdriven_Guitar = 30;
const MIDINAMES_Pad_1_new_age = 89;
const MIDINAMES_Pad_2_warm = 90;
const MIDINAMES_Pad_3_polysynth = 91;
const MIDINAMES_Pad_4_choir = 92;
const MIDINAMES_Pad_5_bowed = 93;
const MIDINAMES_Pad_6_metallic = 94;
const MIDINAMES_Pad_7_halo = 95;
const MIDINAMES_Pad_8_sweep = 96;
const MIDINAMES_Pan_Flute = 76;
const MIDINAMES_Pedal_Hi_Hat = 138;
const MIDINAMES_Percussive_Organ = 18;
const MIDINAMES_Piccolo = 73;
const MIDINAMES_Pizzicato_Strings = 46;
const MIDINAMES_Recorder = 75;
const MIDINAMES_Reed_Organ = 21;
const MIDINAMES_Reverse_Cymbal = 120;
const MIDINAMES_Ride_Bell = 147;
const MIDINAMES_Ride_Cymbal_1 = 145;
const MIDINAMES_Ride_Cymbal_2 = 153;
const MIDINAMES_Rock_Organ = 19;
const MIDINAMES_Seashore = 123;
const MIDINAMES_Shakuhachi = 78;
const MIDINAMES_Shamisen = 107;
const MIDINAMES_Shanai = 112;
const MIDINAMES_Short_Guiro = 167;
const MIDINAMES_Short_Whistle = 165;
const MIDINAMES_Side_Stick = 131;
const MIDINAMES_Sitar = 105;
const MIDINAMES_Slap_Bass_1 = 37;
const MIDINAMES_Slap_Bass_2 = 38;
const MIDINAMES_Soprano_Sax = 65;
const MIDINAMES_Splash_Cymbal = 149;
const MIDINAMES_Steel_Drums = 115;
const MIDINAMES_String_Ensemble_1 = 49;
const MIDINAMES_String_Ensemble_2 = 50;
const MIDINAMES_SynthBrass_1 = 63;
const MIDINAMES_SynthBrass_2 = 64;
const MIDINAMES_SynthStrings_1 = 51;
const MIDINAMES_SynthStrings_2 = 52;
const MIDINAMES_Synth_Bass_1 = 39;
const MIDINAMES_Synth_Bass_2 = 40;
const MIDINAMES_Synth_Drum = 119;
const MIDINAMES_Synth_Voice = 55;
const MIDINAMES_Taiko_Drum = 117;
const MIDINAMES_Tambourine = 148;
const MIDINAMES_Tango_Accordion = 24;
const MIDINAMES_Telephone_Ring = 125;
const MIDINAMES_Tenor_Sax = 67;
const MIDINAMES_Timpani = 48;
const MIDINAMES_Tinkle_Bell = 113;
const MIDINAMES_Tremolo_Strings = 45;
const MIDINAMES_Trombone = 58;
const MIDINAMES_Trumpet = 57;
const MIDINAMES_Tuba = 59;
const MIDINAMES_Tubular_Bells = 15;
const MIDINAMES_Vibraphone = 12;
const MIDINAMES_Vibraslap = 152;
const MIDINAMES_Viola = 42;
const MIDINAMES_Violin = 41;
const MIDINAMES_Voice_Oohs = 54;
const MIDINAMES_Whistle = 79;
const MIDINAMES_Woodblock = 116;
const MIDINAMES_Xylophone = 14;
const MODE_NONE = 0;
const MODE_aeolian = 14;
const MODE_cmn_NONE = 0;
const MODE_cmn_major = 1;
const MODE_cmn_minor = 2;
const MODE_dorian = 3;
const MODE_extended_NONE = 0;
const MODE_extended_aeolian = 3;
const MODE_extended_hypoaeolian = 4;
const MODE_extended_hypoionian = 2;
const MODE_extended_hypolocrian = 6;
const MODE_extended_ionian = 1;
const MODE_extended_locrian = 5;
const MODE_gregorian_NONE = 0;
const MODE_gregorian_dorian = 1;
const MODE_gregorian_hypodorian = 2;
const MODE_gregorian_hypolydian = 6;
const MODE_gregorian_hypomixolydian = 8;
const MODE_gregorian_hypophrygian = 4;
const MODE_gregorian_lydian = 5;
const MODE_gregorian_mixolydian = 7;
const MODE_gregorian_peregrinus = 9;
const MODE_gregorian_phrygian = 3;
const MODE_hypoaeolian = 15;
const MODE_hypodorian = 4;
const MODE_hypoionian = 13;
const MODE_hypolocrian = 17;
const MODE_hypolydian = 8;
const MODE_hypomixolydian = 10;
const MODE_hypophrygian = 6;
const MODE_ionian = 12;
const MODE_locrian = 16;
const MODE_lydian = 7;
const MODE_major = 1;
const MODE_minor = 2;
const MODE_mixolydian = 9;
const MODE_peregrinus = 11;
const MODE_phrygian = 5;
const MODSRELATIONSHIP_NONE = 0;
const MODSRELATIONSHIP_constituent = 5;
const MODSRELATIONSHIP_host = 4;
const MODSRELATIONSHIP_isReferencedBy = 8;
const MODSRELATIONSHIP_original = 3;
const MODSRELATIONSHIP_otherFormat = 7;
const MODSRELATIONSHIP_otherVersion = 6;
const MODSRELATIONSHIP_preceding = 1;
const MODSRELATIONSHIP_references = 9;
const MODSRELATIONSHIP_succeeding = 2;
const MULTIBREVERESTS_mensural_2B = 1;
const MULTIBREVERESTS_mensural_3B = 2;
const MULTIBREVERESTS_mensural_NONE = 0;
const NEIGHBORINGLAYER_NONE = 0;
const NEIGHBORINGLAYER_above = 1;
const NEIGHBORINGLAYER_below = 2;
const NONSTAFFPLACE_NONE = 0;
const NONSTAFFPLACE_botmar = 1;
const NONSTAFFPLACE_end = 7;
const NONSTAFFPLACE_facing = 5;
const NONSTAFFPLACE_inspace = 12;
const NONSTAFFPLACE_inter = 8;
const NONSTAFFPLACE_intra = 9;
const NONSTAFFPLACE_leftmar = 3;
const NONSTAFFPLACE_overleaf = 6;
const NONSTAFFPLACE_rightmar = 4;
const NONSTAFFPLACE_sub = 11;
const NONSTAFFPLACE_super = 10;
const NONSTAFFPLACE_superimposed = 13;
const NONSTAFFPLACE_topmar = 2;
const NOTATIONTYPE_NONE = 0;
const NOTATIONTYPE_cmn = 1;
const NOTATIONTYPE_mensural = 2;
const NOTATIONTYPE_mensural_black = 3;
const NOTATIONTYPE_mensural_white = 4;
const NOTATIONTYPE_neume = 5;
const NOTATIONTYPE_neume_hufnagel = 7;
const NOTATIONTYPE_neume_square = 6;
const NOTATIONTYPE_tab = 8;
const NOTATIONTYPE_tab_guitar = 10;
const NOTATIONTYPE_tab_lute_french = 11;
const NOTATIONTYPE_tab_lute_german = 13;
const NOTATIONTYPE_tab_lute_italian = 12;
const NOTATIONTYPE_tab_staff_like = 9;
const NOTEHEADMODIFIER_NONE = 0;
const NOTEHEADMODIFIER_backslash = 2;
const NOTEHEADMODIFIER_box = 8;
const NOTEHEADMODIFIER_brack = 7;
const NOTEHEADMODIFIER_centerdot = 5;
const NOTEHEADMODIFIER_circle = 9;
const NOTEHEADMODIFIER_fences = 10;
const NOTEHEADMODIFIER_hline = 4;
const NOTEHEADMODIFIER_list_NONE = 0;
const NOTEHEADMODIFIER_list_backslash = 2;
const NOTEHEADMODIFIER_list_box = 8;
const NOTEHEADMODIFIER_list_brack = 7;
const NOTEHEADMODIFIER_list_centerdot = 5;
const NOTEHEADMODIFIER_list_circle = 9;
const NOTEHEADMODIFIER_list_fences = 10;
const NOTEHEADMODIFIER_list_hline = 4;
const NOTEHEADMODIFIER_list_paren = 6;
const NOTEHEADMODIFIER_list_slash = 1;
const NOTEHEADMODIFIER_list_vline = 3;
const NOTEHEADMODIFIER_paren = 6;
const NOTEHEADMODIFIER_slash = 1;
const NOTEHEADMODIFIER_vline = 3;
const PEDALSTYLE_NONE = 0;
const PEDALSTYLE_altpedstar = 4;
const PEDALSTYLE_line = 1;
const PEDALSTYLE_pedline = 2;
const PEDALSTYLE_pedstar = 3;
export const PGFUNC_NONE = 0;
export const PGFUNC_all = 1;
export const PGFUNC_alt1 = 4;
export const PGFUNC_alt2 = 5;
export const PGFUNC_first = 2;
export const PGFUNC_last = 3;
const RELATIONSHIP_NONE = 0;
const RELATIONSHIP_constituent = 41;
const RELATIONSHIP_hasAbridgement = 1;
const RELATIONSHIP_hasAdaptation = 3;
const RELATIONSHIP_hasAlternate = 5;
const RELATIONSHIP_hasArrangement = 7;
const RELATIONSHIP_hasComplement = 9;
const RELATIONSHIP_hasEmbodiment = 11;
const RELATIONSHIP_hasExemplar = 13;
const RELATIONSHIP_hasImitation = 15;
const RELATIONSHIP_hasPart = 17;
const RELATIONSHIP_hasRealization = 19;
const RELATIONSHIP_hasReconfiguration = 21;
const RELATIONSHIP_hasReproduction = 23;
const RELATIONSHIP_hasRevision = 25;
const RELATIONSHIP_hasSuccessor = 27;
const RELATIONSHIP_hasSummarization = 29;
const RELATIONSHIP_hasSupplement = 31;
const RELATIONSHIP_hasTransformation = 33;
const RELATIONSHIP_hasTranslation = 35;
const RELATIONSHIP_host = 40;
const RELATIONSHIP_isAbridgementOf = 2;
const RELATIONSHIP_isAdaptationOf = 4;
const RELATIONSHIP_isAlternateOf = 6;
const RELATIONSHIP_isArrangementOf = 8;
const RELATIONSHIP_isComplementOf = 10;
const RELATIONSHIP_isEmbodimentOf = 12;
const RELATIONSHIP_isExemplarOf = 14;
const RELATIONSHIP_isImitationOf = 16;
const RELATIONSHIP_isPartOf = 18;
const RELATIONSHIP_isRealizationOf = 20;
const RELATIONSHIP_isReconfigurationOf = 22;
const RELATIONSHIP_isReferencedBy = 44;
const RELATIONSHIP_isReproductionOf = 24;
const RELATIONSHIP_isRevisionOf = 26;
const RELATIONSHIP_isSuccessorOf = 28;
const RELATIONSHIP_isSummarizationOf = 30;
const RELATIONSHIP_isSupplementOf = 32;
const RELATIONSHIP_isTransformationOf = 34;
const RELATIONSHIP_isTranslationOf = 36;
const RELATIONSHIP_original = 39;
const RELATIONSHIP_otherFormat = 43;
const RELATIONSHIP_otherVersion = 42;
const RELATIONSHIP_preceding = 37;
const RELATIONSHIP_references = 45;
const RELATIONSHIP_succeeding = 38;
const RELATORS_NONE = 0;
const RELATORS_act = 8;
const RELATORS_ard = 9;
const RELATORS_arr = 1;
const RELATORS_art = 10;
const RELATORS_aus = 11;
const RELATORS_aut = 2;
const RELATORS_chr = 12;
const RELATORS_cmp = 3;
const RELATORS_cnd = 13;
const RELATORS_crp = 14;
const RELATORS_cst = 15;
const RELATORS_drt = 16;
const RELATORS_dte = 4;
const RELATORS_edt = 5;
const RELATORS_egr = 17;
const RELATORS_flm = 18;
const RELATORS_fmd = 19;
const RELATORS_fmp = 20;
const RELATORS_itr = 21;
const RELATORS_lbt = 6;
const RELATORS_lyr = 7;
const RELATORS_mcp = 22;
const RELATORS_msd = 24;
const RELATORS_mus = 23;
const RELATORS_pdr = 25;
const RELATORS_pmn = 26;
const RELATORS_prn = 27;
const RELATORS_pro = 28;
const RELATORS_rce = 29;
const RELATORS_scr = 30;
const RELATORS_sng = 31;
const RELATORS_std = 32;
const RELATORS_trc = 33;
const RELATORS_trl = 34;
const ROTATIONDIRECTION_NONE = 0;
const ROTATIONDIRECTION_down = 2;
const ROTATIONDIRECTION_left = 3;
const ROTATIONDIRECTION_ne = 4;
const ROTATIONDIRECTION_none = 1;
const ROTATIONDIRECTION_nw = 5;
const ROTATIONDIRECTION_se = 6;
const ROTATIONDIRECTION_sw = 7;
const ROTATION_NONE = 0;
const ROTATION_down = 2;
const ROTATION_left = 3;
const ROTATION_ne = 4;
const ROTATION_none = 1;
const ROTATION_nw = 5;
const ROTATION_se = 6;
const ROTATION_sw = 7;
const STAFFITEM_NONE = 0;
const STAFFITEM_accid = 1;
const STAFFITEM_annot = 2;
const STAFFITEM_artic = 3;
const STAFFITEM_basic_NONE = 0;
const STAFFITEM_basic_accid = 1;
const STAFFITEM_basic_annot = 2;
const STAFFITEM_basic_artic = 3;
const STAFFITEM_basic_dir = 4;
const STAFFITEM_basic_dynam = 5;
const STAFFITEM_basic_harm = 6;
const STAFFITEM_basic_ornam = 7;
const STAFFITEM_basic_sp = 8;
const STAFFITEM_basic_stageDir = 9;
const STAFFITEM_basic_tempo = 10;
const STAFFITEM_beam = 11;
const STAFFITEM_bend = 12;
const STAFFITEM_bracketSpan = 13;
const STAFFITEM_breath = 14;
const STAFFITEM_cmn_NONE = 0;
const STAFFITEM_cmn_beam = 1;
const STAFFITEM_cmn_bend = 2;
const STAFFITEM_cmn_bracketSpan = 3;
const STAFFITEM_cmn_breath = 4;
const STAFFITEM_cmn_cpMark = 5;
const STAFFITEM_cmn_fermata = 6;
const STAFFITEM_cmn_fing = 7;
const STAFFITEM_cmn_hairpin = 8;
const STAFFITEM_cmn_harpPedal = 9;
const STAFFITEM_cmn_lv = 10;
const STAFFITEM_cmn_mordent = 11;
const STAFFITEM_cmn_octave = 12;
const STAFFITEM_cmn_pedal = 13;
const STAFFITEM_cmn_reh = 14;
const STAFFITEM_cmn_tie = 15;
const STAFFITEM_cmn_trill = 16;
const STAFFITEM_cmn_tuplet = 17;
const STAFFITEM_cmn_turn = 18;
const STAFFITEM_cpMark = 15;
const STAFFITEM_dir = 4;
const STAFFITEM_dynam = 5;
const STAFFITEM_fermata = 16;
const STAFFITEM_fing = 17;
const STAFFITEM_hairpin = 18;
const STAFFITEM_harm = 6;
const STAFFITEM_harpPedal = 19;
const STAFFITEM_ligature = 29;
const STAFFITEM_lv = 20;
const STAFFITEM_mensural_NONE = 0;
const STAFFITEM_mensural_ligature = 1;
const STAFFITEM_mordent = 21;
const STAFFITEM_octave = 22;
const STAFFITEM_ornam = 7;
const STAFFITEM_pedal = 23;
const STAFFITEM_reh = 24;
const STAFFITEM_sp = 8;
const STAFFITEM_stageDir = 9;
const STAFFITEM_tempo = 10;
const STAFFITEM_tie = 25;
const STAFFITEM_trill = 26;
const STAFFITEM_tuplet = 27;
const STAFFITEM_turn = 28;
const STAFFREL_NONE = 0;
const STAFFREL_above = 1;
const STAFFREL_basic_NONE = 0;
const STAFFREL_basic_above = 1;
const STAFFREL_basic_below = 2;
const STAFFREL_below = 2;
const STAFFREL_between = 3;
const STAFFREL_extended_NONE = 0;
const STAFFREL_extended_between = 1;
const STAFFREL_extended_within = 2;
const STAFFREL_within = 4;
const STEMDIRECTION_NONE = 0;
const STEMDIRECTION_basic_NONE = 0;
const STEMDIRECTION_basic_down = 2;
const STEMDIRECTION_basic_up = 1;
const STEMDIRECTION_down = 2;
const STEMDIRECTION_extended_NONE = 0;
const STEMDIRECTION_extended_left = 1;
const STEMDIRECTION_extended_ne = 3;
const STEMDIRECTION_extended_nw = 5;
const STEMDIRECTION_extended_right = 2;
const STEMDIRECTION_extended_se = 4;
const STEMDIRECTION_extended_sw = 6;
const STEMDIRECTION_left = 3;
const STEMDIRECTION_ne = 5;
const STEMDIRECTION_nw = 7;
const STEMDIRECTION_right = 4;
const STEMDIRECTION_se = 6;
const STEMDIRECTION_sw = 8;
const STEMDIRECTION_up = 1;
const STEMFORM_mensural_NONE = 0;
const STEMFORM_mensural_circle = 1;
const STEMFORM_mensural_oblique = 2;
const STEMFORM_mensural_swallowtail = 3;
const STEMFORM_mensural_virgula = 4;
const STEMMODIFIER_1slash = 2;
const STEMMODIFIER_2slash = 3;
const STEMMODIFIER_3slash = 4;
const STEMMODIFIER_4slash = 5;
const STEMMODIFIER_5slash = 6;
const STEMMODIFIER_6slash = 7;
const STEMMODIFIER_NONE = 0;
const STEMMODIFIER_none = 1;
const STEMMODIFIER_sprech = 8;
const STEMMODIFIER_z = 9;
const STEMPOSITION_NONE = 0;
const STEMPOSITION_center = 3;
const STEMPOSITION_left = 1;
const STEMPOSITION_right = 2;
const TEMPERAMENT_NONE = 0;
const TEMPERAMENT_equal = 1;
const TEMPERAMENT_just = 2;
const TEMPERAMENT_mean = 3;
const TEMPERAMENT_pythagorean = 4;
const TEXTRENDITIONLIST_NONE = 0;
const TEXTRENDITIONLIST_bold = 6;
const TEXTRENDITIONLIST_bolder = 7;
const TEXTRENDITIONLIST_box = 9;
const TEXTRENDITIONLIST_bslash = 13;
const TEXTRENDITIONLIST_circle = 10;
const TEXTRENDITIONLIST_dbox = 11;
const TEXTRENDITIONLIST_fslash = 14;
const TEXTRENDITIONLIST_italic = 3;
const TEXTRENDITIONLIST_lighter = 8;
const TEXTRENDITIONLIST_line_through = 15;
const TEXTRENDITIONLIST_lro = 27;
const TEXTRENDITIONLIST_ltr = 25;
const TEXTRENDITIONLIST_none = 16;
const TEXTRENDITIONLIST_oblique = 4;
const TEXTRENDITIONLIST_overline = 17;
const TEXTRENDITIONLIST_overstrike = 18;
const TEXTRENDITIONLIST_quote = 1;
const TEXTRENDITIONLIST_quotedbl = 2;
const TEXTRENDITIONLIST_rlo = 28;
const TEXTRENDITIONLIST_rtl = 26;
const TEXTRENDITIONLIST_smcaps = 5;
const TEXTRENDITIONLIST_strike = 19;
const TEXTRENDITIONLIST_sub = 20;
const TEXTRENDITIONLIST_sup = 21;
const TEXTRENDITIONLIST_superimpose = 22;
const TEXTRENDITIONLIST_tbox = 12;
const TEXTRENDITIONLIST_underline = 23;
const TEXTRENDITIONLIST_x_through = 24;
const TEXTRENDITION_NONE = 0;
const TEXTRENDITION_bold = 6;
const TEXTRENDITION_bolder = 7;
const TEXTRENDITION_box = 9;
const TEXTRENDITION_bslash = 13;
const TEXTRENDITION_circle = 10;
const TEXTRENDITION_dbox = 11;
const TEXTRENDITION_fslash = 14;
const TEXTRENDITION_italic = 3;
const TEXTRENDITION_lighter = 8;
const TEXTRENDITION_line_through = 15;
const TEXTRENDITION_lro = 27;
const TEXTRENDITION_ltr = 25;
const TEXTRENDITION_none = 16;
const TEXTRENDITION_oblique = 4;
const TEXTRENDITION_overline = 17;
const TEXTRENDITION_overstrike = 18;
const TEXTRENDITION_quote = 1;
const TEXTRENDITION_quotedbl = 2;
const TEXTRENDITION_rlo = 28;
const TEXTRENDITION_rtl = 26;
const TEXTRENDITION_smcaps = 5;
const TEXTRENDITION_strike = 19;
const TEXTRENDITION_sub = 20;
const TEXTRENDITION_sup = 21;
const TEXTRENDITION_superimpose = 22;
const TEXTRENDITION_tbox = 12;
const TEXTRENDITION_underline = 23;
const TEXTRENDITION_x_through = 24;
const VERTICALALIGNMENT_NONE = 0;
const VERTICALALIGNMENT_baseline = 4;
const VERTICALALIGNMENT_bottom = 3;
const VERTICALALIGNMENT_middle = 2;
const VERTICALALIGNMENT_top = 1;
const accidLog_FUNC_NONE = 0;
const accidLog_FUNC_caution = 1;
const accidLog_FUNC_edit = 2;
const anchoredTextLog_FUNC_NONE = 0;
const anchoredTextLog_FUNC_unknown = 1;
const annotLog_FUNC_NONE = 0;
const annotLog_FUNC_display = 1;
const arpegLog_ORDER_NONE = 0;
const arpegLog_ORDER_down = 2;
const arpegLog_ORDER_nonarp = 3;
const arpegLog_ORDER_up = 1;
const audience_AUDIENCE_NONE = 0;
const audience_AUDIENCE_private = 1;
const audience_AUDIENCE_public = 2;
const beamRend_FORM_NONE = 0;
const beamRend_FORM_acc = 1;
const beamRend_FORM_mixed = 2;
const beamRend_FORM_norm = 4;
const beamRend_FORM_rit = 3;
const beamingVis_BEAMREND_NONE = 0;
const beamingVis_BEAMREND_acc = 1;
const beamingVis_BEAMREND_norm = 3;
const beamingVis_BEAMREND_rit = 2;
const bracketSpanLog_FUNC_NONE = 0;
const bracketSpanLog_FUNC_analytical = 4;
const bracketSpanLog_FUNC_coloration = 1;
const bracketSpanLog_FUNC_cross_rhythm = 2;
const bracketSpanLog_FUNC_ligature = 3;
const bracketSpanLog_FUNC_phrase = 5;
const bracketSpanLog_FUNC_uspecified = 6;
const curvatureDirection_CURVE_NONE = 0;
const curvatureDirection_CURVE_a = 1;
const curvatureDirection_CURVE_c = 2;
const curvature_CURVEDIR_NONE = 0;
const curvature_CURVEDIR_above = 1;
const curvature_CURVEDIR_below = 2;
const curvature_CURVEDIR_mixed = 3;
const curveLog_FUNC_NONE = 0;
const curveLog_FUNC_unknown = 1;
const cutout_CUTOUT_NONE = 0;
const cutout_CUTOUT_cutout = 1;
const divLineLog_FORM_NONE = 0;
const divLineLog_FORM_caesura = 1;
const divLineLog_FORM_finalis = 2;
const divLineLog_FORM_maior = 3;
const divLineLog_FORM_maxima = 4;
const divLineLog_FORM_minima = 5;
const divLineLog_FORM_virgula = 6;
const docStatus_STATUS_NONE = 0;
const docStatus_STATUS_approved = 4;
const docStatus_STATUS_candidate = 3;
const docStatus_STATUS_draft = 1;
const docStatus_STATUS_embargoed = 7;
const docStatus_STATUS_in_process = 2;
const docStatus_STATUS_published = 5;
const docStatus_STATUS_withdrawn = 6;
const dotLog_FORM_NONE = 0;
const dotLog_FORM_aug = 1;
const dotLog_FORM_div = 2;
const endings_ENDINGREND_NONE = 0;
const endings_ENDINGREND_barred = 2;
const endings_ENDINGREND_grouped = 3;
const endings_ENDINGREND_top = 1;
const episemaVis_FORM_NONE = 0;
const episemaVis_FORM_h = 1;
const episemaVis_FORM_v = 2;
const evidence_EVIDENCE_NONE = 0;
const evidence_EVIDENCE_conjecture = 3;
const evidence_EVIDENCE_external = 2;
const evidence_EVIDENCE_internal = 1;
const extSymAuth_GLYPHAUTH_NONE = 0;
const extSymAuth_GLYPHAUTH_smufl = 1;
const fermataVis_FORM_NONE = 0;
const fermataVis_FORM_inv = 1;
const fermataVis_FORM_norm = 2;
const fermataVis_SHAPE_NONE = 0;
const fermataVis_SHAPE_angular = 3;
const fermataVis_SHAPE_curved = 1;
const fermataVis_SHAPE_square = 2;
const fingGrpLog_FORM_NONE = 0;
const fingGrpLog_FORM_alter = 1;
const fingGrpLog_FORM_combi = 2;
const fingGrpLog_FORM_subst = 3;
const fingGrpVis_ORIENT_NONE = 0;
const fingGrpVis_ORIENT_horiz = 1;
const fingGrpVis_ORIENT_vert = 2;
const graceGrpLog_ATTACH_NONE = 0;
const graceGrpLog_ATTACH_post = 2;
const graceGrpLog_ATTACH_pre = 1;
const graceGrpLog_ATTACH_unknown = 3;
const hairpinLog_FORM_NONE = 0;
const hairpinLog_FORM_cres = 1;
const hairpinLog_FORM_dim = 2;
const harmAnl_FORM_NONE = 0;
const harmAnl_FORM_explicit = 1;
const harmAnl_FORM_implied = 2;
const harmVis_RENDGRID_NONE = 0;
const harmVis_RENDGRID_grid = 1;
const harmVis_RENDGRID_gridtext = 2;
const harmVis_RENDGRID_text = 3;
const lineLog_FUNC_NONE = 0;
const lineLog_FUNC_coloration = 1;
const lineLog_FUNC_ligature = 2;
const lineLog_FUNC_unknown = 3;
const measurement_UNIT_NONE = 0;
const measurement_UNIT_byte = 1;
const measurement_UNIT_char = 2;
const measurement_UNIT_cm = 3;
const measurement_UNIT_deg = 4;
const measurement_UNIT_ft = 7;
const measurement_UNIT_in = 5;
const measurement_UNIT_issue = 6;
const measurement_UNIT_m = 8;
const measurement_UNIT_mm = 9;
const measurement_UNIT_page = 10;
const measurement_UNIT_pc = 11;
const measurement_UNIT_pt = 12;
const measurement_UNIT_px = 13;
const measurement_UNIT_rad = 14;
const measurement_UNIT_record = 15;
const measurement_UNIT_vol = 16;
const measurement_UNIT_vu = 17;
const meiVersion_MEIVERSION_2013 = 1;
const meiVersion_MEIVERSION_3_0_0 = 2;
const meiVersion_MEIVERSION_4_0_0 = 3;
const meiVersion_MEIVERSION_4_0_1 = 4;
const meiVersion_MEIVERSION_5_0 = 5;
const meiVersion_MEIVERSION_5_0plusCMN = 8;
const meiVersion_MEIVERSION_5_0plusMensural = 9;
const meiVersion_MEIVERSION_5_0plusNeumes = 10;
const meiVersion_MEIVERSION_5_0plusbasic = 7;
const meiVersion_MEIVERSION_5_1 = 6;
const meiVersion_MEIVERSION_5_1plusCMN = 12;
const meiVersion_MEIVERSION_5_1plusMensural = 13;
const meiVersion_MEIVERSION_5_1plusNeumes = 14;
const meiVersion_MEIVERSION_5_1plusbasic = 11;
const meiVersion_MEIVERSION_6_0_dev = 15;
const meiVersion_MEIVERSION_6_0_devplusbasic = 16;
const meiVersion_MEIVERSION_NONE = 0;
const mensurVis_FORM_NONE = 0;
const mensurVis_FORM_horizontal = 1;
const mensurVis_FORM_vertical = 2;
const mensuralVis_MENSURFORM_NONE = 0;
const mensuralVis_MENSURFORM_horizontal = 1;
const mensuralVis_MENSURFORM_vertical = 2;
const meterConformance_METCON_NONE = 0;
const meterConformance_METCON_c = 1;
const meterConformance_METCON_i = 2;
const meterConformance_METCON_o = 3;
const meterSigGrpLog_FUNC_NONE = 0;
const meterSigGrpLog_FUNC_alternating = 1;
const meterSigGrpLog_FUNC_interchanging = 2;
const meterSigGrpLog_FUNC_mixed = 3;
const meterSigGrpLog_FUNC_other = 4;
const mordentLog_FORM_NONE = 0;
const mordentLog_FORM_lower = 1;
const mordentLog_FORM_upper = 2;
const ncForm_CON_NONE = 0;
const ncForm_CON_e = 3;
const ncForm_CON_g = 1;
const ncForm_CON_l = 2;
const ncForm_RELLEN_NONE = 0;
const ncForm_RELLEN_l = 1;
const ncForm_RELLEN_s = 2;
const neumeType_TYPE_NONE = 0;
const neumeType_TYPE_apostropha = 1;
const neumeType_TYPE_bistropha = 2;
const neumeType_TYPE_cephalicus = 3;
const neumeType_TYPE_climacus = 4;
const neumeType_TYPE_clivis = 5;
const neumeType_TYPE_epiphonus = 6;
const neumeType_TYPE_oriscus = 7;
const neumeType_TYPE_pes = 8;
const neumeType_TYPE_pessubpunctis = 9;
const neumeType_TYPE_porrectus = 10;
const neumeType_TYPE_porrectusflexus = 11;
const neumeType_TYPE_pressusmaior = 12;
const neumeType_TYPE_pressusminor = 13;
const neumeType_TYPE_punctum = 14;
const neumeType_TYPE_quilisma = 15;
const neumeType_TYPE_scandicus = 16;
const neumeType_TYPE_strophicus = 17;
const neumeType_TYPE_torculus = 18;
const neumeType_TYPE_torculusresupinus = 19;
const neumeType_TYPE_tristropha = 20;
const neumeType_TYPE_virga = 21;
const neumeType_TYPE_virgastrata = 22;
const noteGes_EXTREMIS_NONE = 0;
const noteGes_EXTREMIS_highest = 1;
const noteGes_EXTREMIS_lowest = 2;
const noteHeads_HEADAUTH_NONE = 0;
const noteHeads_HEADAUTH_smufl = 1;
const octaveLog_COLL_NONE = 0;
const octaveLog_COLL_coll = 1;
const pbVis_FOLIUM_NONE = 0;
const pbVis_FOLIUM_recto = 2;
const pbVis_FOLIUM_verso = 1;
const pedalLog_DIR_NONE = 0;
const pedalLog_DIR_bounce = 4;
const pedalLog_DIR_down = 1;
const pedalLog_DIR_half = 3;
const pedalLog_DIR_up = 2;
const pedalLog_FUNC_NONE = 0;
const pedalLog_FUNC_silent = 4;
const pedalLog_FUNC_soft = 2;
const pedalLog_FUNC_sostenuto = 3;
const pedalLog_FUNC_sustain = 1;
const pointing_XLINKACTUATE_NONE = 0;
const pointing_XLINKACTUATE_none = 3;
const pointing_XLINKACTUATE_onLoad = 1;
const pointing_XLINKACTUATE_onRequest = 2;
const pointing_XLINKACTUATE_other = 4;
const pointing_XLINKSHOW_NONE = 0;
const pointing_XLINKSHOW_embed = 3;
const pointing_XLINKSHOW_new = 1;
const pointing_XLINKSHOW_none = 4;
const pointing_XLINKSHOW_other = 5;
const pointing_XLINKSHOW_replace = 2;
const recordType_RECORDTYPE_NONE = 0;
const recordType_RECORDTYPE_a = 1;
const recordType_RECORDTYPE_c = 2;
const recordType_RECORDTYPE_d = 3;
const recordType_RECORDTYPE_e = 4;
const recordType_RECORDTYPE_f = 5;
const recordType_RECORDTYPE_g = 6;
const recordType_RECORDTYPE_i = 7;
const recordType_RECORDTYPE_j = 8;
const recordType_RECORDTYPE_k = 9;
const recordType_RECORDTYPE_m = 10;
const recordType_RECORDTYPE_o = 11;
const recordType_RECORDTYPE_p = 12;
const recordType_RECORDTYPE_r = 13;
const recordType_RECORDTYPE_t = 14;
const regularMethod_METHOD_NONE = 0;
const regularMethod_METHOD_markup = 2;
const regularMethod_METHOD_silent = 1;
const rehearsal_REHENCLOSE_NONE = 0;
const rehearsal_REHENCLOSE_box = 1;
const rehearsal_REHENCLOSE_circle = 2;
const rehearsal_REHENCLOSE_none = 3;
const repeatMarkLog_FUNC_NONE = 0;
const repeatMarkLog_FUNC_coda = 1;
const repeatMarkLog_FUNC_daCapo = 4;
const repeatMarkLog_FUNC_daCapoAlCoda = 8;
const repeatMarkLog_FUNC_daCapoAlFine = 6;
const repeatMarkLog_FUNC_dalSegno = 3;
const repeatMarkLog_FUNC_dalSegnoAlCoda = 9;
const repeatMarkLog_FUNC_dalSegnoAlFine = 7;
const repeatMarkLog_FUNC_fine = 5;
const repeatMarkLog_FUNC_repeatLeft = 10;
const repeatMarkLog_FUNC_repeatRight = 11;
const repeatMarkLog_FUNC_repeatRightLeft = 12;
const repeatMarkLog_FUNC_segno = 2;
const sbVis_FORM_NONE = 0;
const sbVis_FORM_hash = 1;
const staffGroupingSym_SYMBOL_NONE = 0;
const staffGroupingSym_SYMBOL_brace = 1;
const staffGroupingSym_SYMBOL_bracket = 2;
const staffGroupingSym_SYMBOL_bracketsq = 3;
const staffGroupingSym_SYMBOL_line = 4;
const staffGroupingSym_SYMBOL_none = 5;
const sylLog_CON_NONE = 0;
const sylLog_CON_b = 8;
const sylLog_CON_c = 5;
const sylLog_CON_d = 2;
const sylLog_CON_i = 7;
const sylLog_CON_s = 1;
const sylLog_CON_t = 4;
const sylLog_CON_u = 3;
const sylLog_CON_v = 6;
const sylLog_WORDPOS_NONE = 0;
const sylLog_WORDPOS_i = 1;
const sylLog_WORDPOS_m = 2;
const sylLog_WORDPOS_s = 3;
const sylLog_WORDPOS_t = 4;
const targetEval_EVALUATE_NONE = 0;
const targetEval_EVALUATE_all = 1;
const targetEval_EVALUATE_none = 3;
const targetEval_EVALUATE_one = 2;
const tempoLog_FUNC_NONE = 0;
const tempoLog_FUNC_continuous = 1;
const tempoLog_FUNC_instantaneous = 2;
const tempoLog_FUNC_metricmod = 3;
const tempoLog_FUNC_precedente = 4;
const tremForm_FORM_NONE = 0;
const tremForm_FORM_meas = 1;
const tremForm_FORM_unmeas = 2;
const tupletVis_NUMFORMAT_NONE = 0;
const tupletVis_NUMFORMAT_count = 1;
const tupletVis_NUMFORMAT_ratio = 2;
const turnLog_FORM_NONE = 0;
const turnLog_FORM_lower = 1;
const turnLog_FORM_upper = 2;
const voltaGroupingSym_VOLTASYM_NONE = 0;
const voltaGroupingSym_VOLTASYM_brace = 1;
const voltaGroupingSym_VOLTASYM_bracket = 2;
const voltaGroupingSym_VOLTASYM_bracketsq = 3;
const voltaGroupingSym_VOLTASYM_line = 4;
const voltaGroupingSym_VOLTASYM_none = 5;
const whitespace_XMLSPACE_NONE = 0;
const whitespace_XMLSPACE_default = 1;
const whitespace_XMLSPACE_preserve = 2;

export class AttConverterBase {
  protected unsupported(name: string): never { throw new Error(`libmei converter mock: ${name} is not migrated`); }
  protected logWarning(format: string, ...args: unknown[]): void {
    let i = 0;
    const msg = format.replace(/%[ds]/g, () => String(args[i++] ?? ""));
    LogWarning(msg);
  }

  AccidentalGesturalToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "s"; break;
            case 2: value = "f"; break;
            case 3: value = "ss"; break;
            case 4: value = "ff"; break;
            case 5: value = "ts"; break;
            case 6: value = "tf"; break;
            case 7: value = "n"; break;
            case 8: value = "su"; break;
            case 9: value = "sd"; break;
            case 10: value = "fu"; break;
            case 11: value = "fd"; break;
            case 12: value = "xu"; break;
            case 13: value = "ffd"; break;
            case 14: value = "bms"; break;
            case 15: value = "kms"; break;
            case 16: value = "bs"; break;
            case 17: value = "ks"; break;
            case 18: value = "kf"; break;
            case 19: value = "bf"; break;
            case 20: value = "kmf"; break;
            case 21: value = "bmf"; break;
            case 22: value = "koron"; break;
            case 23: value = "sori"; break;
            default:
                this.logWarning("Unknown value '%d' for data.ACCIDENTAL.GESTURAL", data);
                value = "";
                break;
        }
        return value;
  }

  StrToAccidentalGestural(value: string, logWarning: boolean = true): number {
    
        if (value == "s") return 1;
        if (value == "f") return 2;
        if (value == "ss") return 3;
        if (value == "ff") return 4;
        if (value == "ts") return 5;
        if (value == "tf") return 6;
        if (value == "n") return 7;
        if (value == "su") return 8;
        if (value == "sd") return 9;
        if (value == "fu") return 10;
        if (value == "fd") return 11;
        if (value == "xu") return 12;
        if (value == "ffd") return 13;
        if (value == "bms") return 14;
        if (value == "kms") return 15;
        if (value == "bs") return 16;
        if (value == "ks") return 17;
        if (value == "kf") return 18;
        if (value == "bf") return 19;
        if (value == "kmf") return 20;
        if (value == "bmf") return 21;
        if (value == "koron") return 22;
        if (value == "sori") return 23;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.ACCIDENTAL.GESTURAL", value);
        return 0;
  }

  AccidentalGesturalBasicToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "s"; break;
            case 2: value = "f"; break;
            case 3: value = "ss"; break;
            case 4: value = "ff"; break;
            case 5: value = "ts"; break;
            case 6: value = "tf"; break;
            case 7: value = "n"; break;
            default:
                this.logWarning("Unknown value '%d' for data.ACCIDENTAL.GESTURAL.basic", data);
                value = "";
                break;
        }
        return value;
  }

  StrToAccidentalGesturalBasic(value: string, logWarning: boolean = true): number {
    
        if (value == "s") return 1;
        if (value == "f") return 2;
        if (value == "ss") return 3;
        if (value == "ff") return 4;
        if (value == "ts") return 5;
        if (value == "tf") return 6;
        if (value == "n") return 7;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.ACCIDENTAL.GESTURAL.basic", value);
        return 0;
  }

  AccidentalGesturalExtendedToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "su"; break;
            case 2: value = "sd"; break;
            case 3: value = "fu"; break;
            case 4: value = "fd"; break;
            case 5: value = "xu"; break;
            case 6: value = "ffd"; break;
            default:
                this.logWarning("Unknown value '%d' for data.ACCIDENTAL.GESTURAL.extended", data);
                value = "";
                break;
        }
        return value;
  }

  StrToAccidentalGesturalExtended(value: string, logWarning: boolean = true): number {
    
        if (value == "su") return 1;
        if (value == "sd") return 2;
        if (value == "fu") return 3;
        if (value == "fd") return 4;
        if (value == "xu") return 5;
        if (value == "ffd") return 6;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.ACCIDENTAL.GESTURAL.extended", value);
        return 0;
  }

  AccidentalWrittenToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "s"; break;
            case 2: value = "f"; break;
            case 3: value = "ss"; break;
            case 4: value = "x"; break;
            case 5: value = "ff"; break;
            case 6: value = "xs"; break;
            case 7: value = "sx"; break;
            case 8: value = "ts"; break;
            case 9: value = "tf"; break;
            case 10: value = "n"; break;
            case 11: value = "nf"; break;
            case 12: value = "ns"; break;
            case 13: value = "su"; break;
            case 14: value = "sd"; break;
            case 15: value = "fu"; break;
            case 16: value = "fd"; break;
            case 17: value = "nu"; break;
            case 18: value = "nd"; break;
            case 19: value = "xu"; break;
            case 20: value = "xd"; break;
            case 21: value = "ffu"; break;
            case 22: value = "ffd"; break;
            case 23: value = "1qf"; break;
            case 24: value = "3qf"; break;
            case 25: value = "1qs"; break;
            case 26: value = "3qs"; break;
            case 27: value = "bms"; break;
            case 28: value = "kms"; break;
            case 29: value = "bs"; break;
            case 30: value = "ks"; break;
            case 31: value = "kf"; break;
            case 32: value = "bf"; break;
            case 33: value = "kmf"; break;
            case 34: value = "bmf"; break;
            case 35: value = "koron"; break;
            case 36: value = "sori"; break;
            default:
                this.logWarning("Unknown value '%d' for data.ACCIDENTAL.WRITTEN", data);
                value = "";
                break;
        }
        return value;
  }

  StrToAccidentalWritten(value: string, logWarning: boolean = true): number {
    
        if (value == "s") return 1;
        if (value == "f") return 2;
        if (value == "ss") return 3;
        if (value == "x") return 4;
        if (value == "ff") return 5;
        if (value == "xs") return 6;
        if (value == "sx") return 7;
        if (value == "ts") return 8;
        if (value == "tf") return 9;
        if (value == "n") return 10;
        if (value == "nf") return 11;
        if (value == "ns") return 12;
        if (value == "su") return 13;
        if (value == "sd") return 14;
        if (value == "fu") return 15;
        if (value == "fd") return 16;
        if (value == "nu") return 17;
        if (value == "nd") return 18;
        if (value == "xu") return 19;
        if (value == "xd") return 20;
        if (value == "ffu") return 21;
        if (value == "ffd") return 22;
        if (value == "1qf") return 23;
        if (value == "3qf") return 24;
        if (value == "1qs") return 25;
        if (value == "3qs") return 26;
        if (value == "bms") return 27;
        if (value == "kms") return 28;
        if (value == "bs") return 29;
        if (value == "ks") return 30;
        if (value == "kf") return 31;
        if (value == "bf") return 32;
        if (value == "kmf") return 33;
        if (value == "bmf") return 34;
        if (value == "koron") return 35;
        if (value == "sori") return 36;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.ACCIDENTAL.WRITTEN", value);
        return 0;
  }

  AccidentalWrittenBasicToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "s"; break;
            case 2: value = "f"; break;
            case 3: value = "ss"; break;
            case 4: value = "x"; break;
            case 5: value = "ff"; break;
            case 6: value = "xs"; break;
            case 7: value = "sx"; break;
            case 8: value = "ts"; break;
            case 9: value = "tf"; break;
            case 10: value = "n"; break;
            case 11: value = "nf"; break;
            case 12: value = "ns"; break;
            default:
                this.logWarning("Unknown value '%d' for data.ACCIDENTAL.WRITTEN.basic", data);
                value = "";
                break;
        }
        return value;
  }

  StrToAccidentalWrittenBasic(value: string, logWarning: boolean = true): number {
    
        if (value == "s") return 1;
        if (value == "f") return 2;
        if (value == "ss") return 3;
        if (value == "x") return 4;
        if (value == "ff") return 5;
        if (value == "xs") return 6;
        if (value == "sx") return 7;
        if (value == "ts") return 8;
        if (value == "tf") return 9;
        if (value == "n") return 10;
        if (value == "nf") return 11;
        if (value == "ns") return 12;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.ACCIDENTAL.WRITTEN.basic", value);
        return 0;
  }

  AccidentalWrittenExtendedToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "su"; break;
            case 2: value = "sd"; break;
            case 3: value = "fu"; break;
            case 4: value = "fd"; break;
            case 5: value = "nu"; break;
            case 6: value = "nd"; break;
            case 7: value = "xu"; break;
            case 8: value = "xd"; break;
            case 9: value = "ffu"; break;
            case 10: value = "ffd"; break;
            case 11: value = "1qf"; break;
            case 12: value = "3qf"; break;
            case 13: value = "1qs"; break;
            case 14: value = "3qs"; break;
            default:
                this.logWarning("Unknown value '%d' for data.ACCIDENTAL.WRITTEN.extended", data);
                value = "";
                break;
        }
        return value;
  }

  StrToAccidentalWrittenExtended(value: string, logWarning: boolean = true): number {
    
        if (value == "su") return 1;
        if (value == "sd") return 2;
        if (value == "fu") return 3;
        if (value == "fd") return 4;
        if (value == "nu") return 5;
        if (value == "nd") return 6;
        if (value == "xu") return 7;
        if (value == "xd") return 8;
        if (value == "ffu") return 9;
        if (value == "ffd") return 10;
        if (value == "1qf") return 11;
        if (value == "3qf") return 12;
        if (value == "1qs") return 13;
        if (value == "3qs") return 14;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.ACCIDENTAL.WRITTEN.extended", value);
        return 0;
  }

  AccidentalAeuToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "bms"; break;
            case 2: value = "kms"; break;
            case 3: value = "bs"; break;
            case 4: value = "ks"; break;
            case 5: value = "kf"; break;
            case 6: value = "bf"; break;
            case 7: value = "kmf"; break;
            case 8: value = "bmf"; break;
            default:
                this.logWarning("Unknown value '%d' for data.ACCIDENTAL.aeu", data);
                value = "";
                break;
        }
        return value;
  }

  StrToAccidentalAeu(value: string, logWarning: boolean = true): number {
    
        if (value == "bms") return 1;
        if (value == "kms") return 2;
        if (value == "bs") return 3;
        if (value == "ks") return 4;
        if (value == "kf") return 5;
        if (value == "bf") return 6;
        if (value == "kmf") return 7;
        if (value == "bmf") return 8;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.ACCIDENTAL.aeu", value);
        return 0;
  }

  AccidentalPersianToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "koron"; break;
            case 2: value = "sori"; break;
            default:
                this.logWarning("Unknown value '%d' for data.ACCIDENTAL.persian", data);
                value = "";
                break;
        }
        return value;
  }

  StrToAccidentalPersian(value: string, logWarning: boolean = true): number {
    
        if (value == "koron") return 1;
        if (value == "sori") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.ACCIDENTAL.persian", value);
        return 0;
  }

  ArticulationToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "acc"; break;
            case 2: value = "acc-inv"; break;
            case 3: value = "acc-long"; break;
            case 4: value = "acc-soft"; break;
            case 5: value = "stacc"; break;
            case 6: value = "ten"; break;
            case 7: value = "stacciss"; break;
            case 8: value = "marc"; break;
            case 9: value = "spicc"; break;
            case 10: value = "stress"; break;
            case 11: value = "unstress"; break;
            case 12: value = "doit"; break;
            case 13: value = "scoop"; break;
            case 14: value = "rip"; break;
            case 15: value = "plop"; break;
            case 16: value = "fall"; break;
            case 17: value = "longfall"; break;
            case 18: value = "bend"; break;
            case 19: value = "flip"; break;
            case 20: value = "smear"; break;
            case 21: value = "shake"; break;
            case 22: value = "dnbow"; break;
            case 23: value = "upbow"; break;
            case 24: value = "harm"; break;
            case 25: value = "snap"; break;
            case 26: value = "fingernail"; break;
            case 27: value = "damp"; break;
            case 28: value = "dampall"; break;
            case 29: value = "open"; break;
            case 30: value = "stop"; break;
            case 31: value = "dbltongue"; break;
            case 32: value = "trpltongue"; break;
            case 33: value = "heel"; break;
            case 34: value = "toe"; break;
            case 35: value = "tap"; break;
            case 36: value = "lhpizz"; break;
            case 37: value = "dot"; break;
            case 38: value = "stroke"; break;
            default:
                this.logWarning("Unknown value '%d' for data.ARTICULATION", data);
                value = "";
                break;
        }
        return value;
  }

  StrToArticulation(value: string, logWarning: boolean = true): number {
    
        if (value == "acc") return 1;
        if (value == "acc-inv") return 2;
        if (value == "acc-long") return 3;
        if (value == "acc-soft") return 4;
        if (value == "stacc") return 5;
        if (value == "ten") return 6;
        if (value == "stacciss") return 7;
        if (value == "marc") return 8;
        if (value == "spicc") return 9;
        if (value == "stress") return 10;
        if (value == "unstress") return 11;
        if (value == "doit") return 12;
        if (value == "scoop") return 13;
        if (value == "rip") return 14;
        if (value == "plop") return 15;
        if (value == "fall") return 16;
        if (value == "longfall") return 17;
        if (value == "bend") return 18;
        if (value == "flip") return 19;
        if (value == "smear") return 20;
        if (value == "shake") return 21;
        if (value == "dnbow") return 22;
        if (value == "upbow") return 23;
        if (value == "harm") return 24;
        if (value == "snap") return 25;
        if (value == "fingernail") return 26;
        if (value == "damp") return 27;
        if (value == "dampall") return 28;
        if (value == "open") return 29;
        if (value == "stop") return 30;
        if (value == "dbltongue") return 31;
        if (value == "trpltongue") return 32;
        if (value == "heel") return 33;
        if (value == "toe") return 34;
        if (value == "tap") return 35;
        if (value == "lhpizz") return 36;
        if (value == "dot") return 37;
        if (value == "stroke") return 38;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.ARTICULATION", value);
        return 0;
  }

  BarmethodToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "mensur"; break;
            case 2: value = "staff"; break;
            case 3: value = "takt"; break;
            default:
                this.logWarning("Unknown value '%d' for data.BARMETHOD", data);
                value = "";
                break;
        }
        return value;
  }

  StrToBarmethod(value: string, logWarning: boolean = true): number {
    
        if (value == "mensur") return 1;
        if (value == "staff") return 2;
        if (value == "takt") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.BARMETHOD", value);
        return 0;
  }

  BarrenditionToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "dashed"; break;
            case 2: value = "dotted"; break;
            case 3: value = "dbl"; break;
            case 4: value = "dbldashed"; break;
            case 5: value = "dbldotted"; break;
            case 6: value = "dblheavy"; break;
            case 7: value = "dblsegno"; break;
            case 8: value = "end"; break;
            case 9: value = "heavy"; break;
            case 10: value = "invis"; break;
            case 11: value = "rptstart"; break;
            case 12: value = "rptboth"; break;
            case 13: value = "rptend"; break;
            case 14: value = "segno"; break;
            case 15: value = "single"; break;
            default:
                this.logWarning("Unknown value '%d' for data.BARRENDITION", data);
                value = "";
                break;
        }
        return value;
  }

  StrToBarrendition(value: string, logWarning: boolean = true): number {
    
        if (value == "dashed") return 1;
        if (value == "dotted") return 2;
        if (value == "dbl") return 3;
        if (value == "dbldashed") return 4;
        if (value == "dbldotted") return 5;
        if (value == "dblheavy") return 6;
        if (value == "dblsegno") return 7;
        if (value == "end") return 8;
        if (value == "heavy") return 9;
        if (value == "invis") return 10;
        if (value == "rptstart") return 11;
        if (value == "rptboth") return 12;
        if (value == "rptend") return 13;
        if (value == "segno") return 14;
        if (value == "single") return 15;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.BARRENDITION", value);
        return 0;
  }

  BeamplaceToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "above"; break;
            case 2: value = "below"; break;
            case 3: value = "mixed"; break;
            default:
                this.logWarning("Unknown value '%d' for data.BEAMPLACE", data);
                value = "";
                break;
        }
        return value;
  }

  StrToBeamplace(value: string, logWarning: boolean = true): number {
    
        if (value == "above") return 1;
        if (value == "below") return 2;
        if (value == "mixed") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.BEAMPLACE", value);
        return 0;
  }

  BetypeToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "byte"; break;
            case 2: value = "smil"; break;
            case 3: value = "midi"; break;
            case 4: value = "mmc"; break;
            case 5: value = "mtc"; break;
            case 6: value = "smpte-25"; break;
            case 7: value = "smpte-24"; break;
            case 8: value = "smpte-df30"; break;
            case 9: value = "smpte-ndf30"; break;
            case 10: value = "smpte-df29.97"; break;
            case 11: value = "smpte-ndf29.97"; break;
            case 12: value = "tcf"; break;
            case 13: value = "time"; break;
            default:
                this.logWarning("Unknown value '%d' for data.BETYPE", data);
                value = "";
                break;
        }
        return value;
  }

  StrToBetype(value: string, logWarning: boolean = true): number {
    
        if (value == "byte") return 1;
        if (value == "smil") return 2;
        if (value == "midi") return 3;
        if (value == "mmc") return 4;
        if (value == "mtc") return 5;
        if (value == "smpte-25") return 6;
        if (value == "smpte-24") return 7;
        if (value == "smpte-df30") return 8;
        if (value == "smpte-ndf30") return 9;
        if (value == "smpte-df29.97") return 10;
        if (value == "smpte-ndf29.97") return 11;
        if (value == "tcf") return 12;
        if (value == "time") return 13;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.BETYPE", value);
        return 0;
  }

  BooleanToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "true"; break;
            case 2: value = "false"; break;
            default:
                this.logWarning("Unknown value '%d' for data.BOOLEAN", data);
                value = "";
                break;
        }
        return value;
  }

  StrToBoolean(value: string, logWarning: boolean = true): number {
    
        if (value == "true") return 1;
        if (value == "false") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.BOOLEAN", value);
        return 0;
  }

  CancelaccidToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "none"; break;
            case 2: value = "before"; break;
            case 3: value = "after"; break;
            case 4: value = "before-bar"; break;
            default:
                this.logWarning("Unknown value '%d' for data.CANCELACCID", data);
                value = "";
                break;
        }
        return value;
  }

  StrToCancelaccid(value: string, logWarning: boolean = true): number {
    
        if (value == "none") return 1;
        if (value == "before") return 2;
        if (value == "after") return 3;
        if (value == "before-bar") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.CANCELACCID", value);
        return 0;
  }

  CertaintyToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "high"; break;
            case 2: value = "medium"; break;
            case 3: value = "low"; break;
            case 4: value = "unknown"; break;
            default:
                this.logWarning("Unknown value '%d' for data.CERTAINTY", data);
                value = "";
                break;
        }
        return value;
  }

  StrToCertainty(value: string, logWarning: boolean = true): number {
    
        if (value == "high") return 1;
        if (value == "medium") return 2;
        if (value == "low") return 3;
        if (value == "unknown") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.CERTAINTY", value);
        return 0;
  }

  ClefshapeToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "G"; break;
            case 2: value = "GG"; break;
            case 3: value = "F"; break;
            case 4: value = "C"; break;
            case 5: value = "perc"; break;
            case 6: value = "TAB"; break;
            default:
                this.logWarning("Unknown value '%d' for data.CLEFSHAPE", data);
                value = "";
                break;
        }
        return value;
  }

  StrToClefshape(value: string, logWarning: boolean = true): number {
    
        if (value == "G") return 1;
        if (value == "GG") return 2;
        if (value == "F") return 3;
        if (value == "C") return 4;
        if (value == "perc") return 5;
        if (value == "TAB") return 6;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.CLEFSHAPE", value);
        return 0;
  }

  ClusterToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "white"; break;
            case 2: value = "black"; break;
            case 3: value = "chromatic"; break;
            default:
                this.logWarning("Unknown value '%d' for data.CLUSTER", data);
                value = "";
                break;
        }
        return value;
  }

  StrToCluster(value: string, logWarning: boolean = true): number {
    
        if (value == "white") return 1;
        if (value == "black") return 2;
        if (value == "chromatic") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.CLUSTER", value);
        return 0;
  }

  ColornamesToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "aliceblue"; break;
            case 2: value = "antiquewhite"; break;
            case 3: value = "aqua"; break;
            case 4: value = "aquamarine"; break;
            case 5: value = "azure"; break;
            case 6: value = "beige"; break;
            case 7: value = "bisque"; break;
            case 8: value = "black"; break;
            case 9: value = "blanchedalmond"; break;
            case 10: value = "blue"; break;
            case 11: value = "blueviolet"; break;
            case 12: value = "brown"; break;
            case 13: value = "burlywood"; break;
            case 14: value = "cadetblue"; break;
            case 15: value = "chartreuse"; break;
            case 16: value = "chocolate"; break;
            case 17: value = "coral"; break;
            case 18: value = "cornflowerblue"; break;
            case 19: value = "cornsilk"; break;
            case 20: value = "crimson"; break;
            case 21: value = "cyan"; break;
            case 22: value = "darkblue"; break;
            case 23: value = "darkcyan"; break;
            case 24: value = "darkgoldenrod"; break;
            case 25: value = "darkgray"; break;
            case 26: value = "darkgreen"; break;
            case 27: value = "darkgrey"; break;
            case 28: value = "darkkhaki"; break;
            case 29: value = "darkmagenta"; break;
            case 30: value = "darkolivegreen"; break;
            case 31: value = "darkorange"; break;
            case 32: value = "darkorchid"; break;
            case 33: value = "darkred"; break;
            case 34: value = "darksalmon"; break;
            case 35: value = "darkseagreen"; break;
            case 36: value = "darkslateblue"; break;
            case 37: value = "darkslategray"; break;
            case 38: value = "darkslategrey"; break;
            case 39: value = "darkturquoise"; break;
            case 40: value = "darkviolet"; break;
            case 41: value = "deeppink"; break;
            case 42: value = "deepskyblue"; break;
            case 43: value = "dimgray"; break;
            case 44: value = "dimgrey"; break;
            case 45: value = "dodgerblue"; break;
            case 46: value = "firebrick"; break;
            case 47: value = "floralwhite"; break;
            case 48: value = "forestgreen"; break;
            case 49: value = "fuchsia"; break;
            case 50: value = "gainsboro"; break;
            case 51: value = "ghostwhite"; break;
            case 52: value = "gold"; break;
            case 53: value = "goldenrod"; break;
            case 54: value = "gray"; break;
            case 55: value = "green"; break;
            case 56: value = "greenyellow"; break;
            case 57: value = "grey"; break;
            case 58: value = "honeydew"; break;
            case 59: value = "hotpink"; break;
            case 60: value = "indianred"; break;
            case 61: value = "indigo"; break;
            case 62: value = "ivory"; break;
            case 63: value = "khaki"; break;
            case 64: value = "lavender"; break;
            case 65: value = "lavenderblush"; break;
            case 66: value = "lawngreen"; break;
            case 67: value = "lemonchiffon"; break;
            case 68: value = "lightblue"; break;
            case 69: value = "lightcoral"; break;
            case 70: value = "lightcyan"; break;
            case 71: value = "lightgoldenrodyellow"; break;
            case 72: value = "lightgray"; break;
            case 73: value = "lightgreen"; break;
            case 74: value = "lightgrey"; break;
            case 75: value = "lightpink"; break;
            case 76: value = "lightsalmon"; break;
            case 77: value = "lightseagreen"; break;
            case 78: value = "lightskyblue"; break;
            case 79: value = "lightslategray"; break;
            case 80: value = "lightslategrey"; break;
            case 81: value = "lightsteelblue"; break;
            case 82: value = "lightyellow"; break;
            case 83: value = "lime"; break;
            case 84: value = "limegreen"; break;
            case 85: value = "linen"; break;
            case 86: value = "magenta"; break;
            case 87: value = "maroon"; break;
            case 88: value = "mediumaquamarine"; break;
            case 89: value = "mediumblue"; break;
            case 90: value = "mediumorchid"; break;
            case 91: value = "mediumpurple"; break;
            case 92: value = "mediumseagreen"; break;
            case 93: value = "mediumslateblue"; break;
            case 94: value = "mediumspringgreen"; break;
            case 95: value = "mediumturquoise"; break;
            case 96: value = "mediumvioletred"; break;
            case 97: value = "midnightblue"; break;
            case 98: value = "mintcream"; break;
            case 99: value = "mistyrose"; break;
            case 100: value = "moccasin"; break;
            case 101: value = "navajowhite"; break;
            case 102: value = "navy"; break;
            case 103: value = "oldlace"; break;
            case 104: value = "olive"; break;
            case 105: value = "olivedrab"; break;
            case 106: value = "orange"; break;
            case 107: value = "orangered"; break;
            case 108: value = "orchid"; break;
            case 109: value = "palegoldenrod"; break;
            case 110: value = "palegreen"; break;
            case 111: value = "paleturquoise"; break;
            case 112: value = "palevioletred"; break;
            case 113: value = "papayawhip"; break;
            case 114: value = "peachpuff"; break;
            case 115: value = "peru"; break;
            case 116: value = "pink"; break;
            case 117: value = "plum"; break;
            case 118: value = "powderblue"; break;
            case 119: value = "purple"; break;
            case 120: value = "rebeccapurple"; break;
            case 121: value = "red"; break;
            case 122: value = "rosybrown"; break;
            case 123: value = "royalblue"; break;
            case 124: value = "saddlebrown"; break;
            case 125: value = "salmon"; break;
            case 126: value = "sandybrown"; break;
            case 127: value = "seagreen"; break;
            case 128: value = "seashell"; break;
            case 129: value = "sienna"; break;
            case 130: value = "silver"; break;
            case 131: value = "skyblue"; break;
            case 132: value = "slateblue"; break;
            case 133: value = "slategray"; break;
            case 134: value = "slategrey"; break;
            case 135: value = "snow"; break;
            case 136: value = "springgreen"; break;
            case 137: value = "steelblue"; break;
            case 138: value = "tan"; break;
            case 139: value = "teal"; break;
            case 140: value = "thistle"; break;
            case 141: value = "tomato"; break;
            case 142: value = "turquoise"; break;
            case 143: value = "violet"; break;
            case 144: value = "wheat"; break;
            case 145: value = "white"; break;
            case 146: value = "whitesmoke"; break;
            case 147: value = "yellow"; break;
            case 148: value = "yellowgreen"; break;
            default:
                this.logWarning("Unknown value '%d' for data.COLORNAMES", data);
                value = "";
                break;
        }
        return value;
  }

  StrToColornames(value: string, logWarning: boolean = true): number {
    
        if (value == "aliceblue") return 1;
        if (value == "antiquewhite") return 2;
        if (value == "aqua") return 3;
        if (value == "aquamarine") return 4;
        if (value == "azure") return 5;
        if (value == "beige") return 6;
        if (value == "bisque") return 7;
        if (value == "black") return 8;
        if (value == "blanchedalmond") return 9;
        if (value == "blue") return 10;
        if (value == "blueviolet") return 11;
        if (value == "brown") return 12;
        if (value == "burlywood") return 13;
        if (value == "cadetblue") return 14;
        if (value == "chartreuse") return 15;
        if (value == "chocolate") return 16;
        if (value == "coral") return 17;
        if (value == "cornflowerblue") return 18;
        if (value == "cornsilk") return 19;
        if (value == "crimson") return 20;
        if (value == "cyan") return 21;
        if (value == "darkblue") return 22;
        if (value == "darkcyan") return 23;
        if (value == "darkgoldenrod") return 24;
        if (value == "darkgray") return 25;
        if (value == "darkgreen") return 26;
        if (value == "darkgrey") return 27;
        if (value == "darkkhaki") return 28;
        if (value == "darkmagenta") return 29;
        if (value == "darkolivegreen") return 30;
        if (value == "darkorange") return 31;
        if (value == "darkorchid") return 32;
        if (value == "darkred") return 33;
        if (value == "darksalmon") return 34;
        if (value == "darkseagreen") return 35;
        if (value == "darkslateblue") return 36;
        if (value == "darkslategray") return 37;
        if (value == "darkslategrey") return 38;
        if (value == "darkturquoise") return 39;
        if (value == "darkviolet") return 40;
        if (value == "deeppink") return 41;
        if (value == "deepskyblue") return 42;
        if (value == "dimgray") return 43;
        if (value == "dimgrey") return 44;
        if (value == "dodgerblue") return 45;
        if (value == "firebrick") return 46;
        if (value == "floralwhite") return 47;
        if (value == "forestgreen") return 48;
        if (value == "fuchsia") return 49;
        if (value == "gainsboro") return 50;
        if (value == "ghostwhite") return 51;
        if (value == "gold") return 52;
        if (value == "goldenrod") return 53;
        if (value == "gray") return 54;
        if (value == "green") return 55;
        if (value == "greenyellow") return 56;
        if (value == "grey") return 57;
        if (value == "honeydew") return 58;
        if (value == "hotpink") return 59;
        if (value == "indianred") return 60;
        if (value == "indigo") return 61;
        if (value == "ivory") return 62;
        if (value == "khaki") return 63;
        if (value == "lavender") return 64;
        if (value == "lavenderblush") return 65;
        if (value == "lawngreen") return 66;
        if (value == "lemonchiffon") return 67;
        if (value == "lightblue") return 68;
        if (value == "lightcoral") return 69;
        if (value == "lightcyan") return 70;
        if (value == "lightgoldenrodyellow") return 71;
        if (value == "lightgray") return 72;
        if (value == "lightgreen") return 73;
        if (value == "lightgrey") return 74;
        if (value == "lightpink") return 75;
        if (value == "lightsalmon") return 76;
        if (value == "lightseagreen") return 77;
        if (value == "lightskyblue") return 78;
        if (value == "lightslategray") return 79;
        if (value == "lightslategrey") return 80;
        if (value == "lightsteelblue") return 81;
        if (value == "lightyellow") return 82;
        if (value == "lime") return 83;
        if (value == "limegreen") return 84;
        if (value == "linen") return 85;
        if (value == "magenta") return 86;
        if (value == "maroon") return 87;
        if (value == "mediumaquamarine") return 88;
        if (value == "mediumblue") return 89;
        if (value == "mediumorchid") return 90;
        if (value == "mediumpurple") return 91;
        if (value == "mediumseagreen") return 92;
        if (value == "mediumslateblue") return 93;
        if (value == "mediumspringgreen") return 94;
        if (value == "mediumturquoise") return 95;
        if (value == "mediumvioletred") return 96;
        if (value == "midnightblue") return 97;
        if (value == "mintcream") return 98;
        if (value == "mistyrose") return 99;
        if (value == "moccasin") return 100;
        if (value == "navajowhite") return 101;
        if (value == "navy") return 102;
        if (value == "oldlace") return 103;
        if (value == "olive") return 104;
        if (value == "olivedrab") return 105;
        if (value == "orange") return 106;
        if (value == "orangered") return 107;
        if (value == "orchid") return 108;
        if (value == "palegoldenrod") return 109;
        if (value == "palegreen") return 110;
        if (value == "paleturquoise") return 111;
        if (value == "palevioletred") return 112;
        if (value == "papayawhip") return 113;
        if (value == "peachpuff") return 114;
        if (value == "peru") return 115;
        if (value == "pink") return 116;
        if (value == "plum") return 117;
        if (value == "powderblue") return 118;
        if (value == "purple") return 119;
        if (value == "rebeccapurple") return 120;
        if (value == "red") return 121;
        if (value == "rosybrown") return 122;
        if (value == "royalblue") return 123;
        if (value == "saddlebrown") return 124;
        if (value == "salmon") return 125;
        if (value == "sandybrown") return 126;
        if (value == "seagreen") return 127;
        if (value == "seashell") return 128;
        if (value == "sienna") return 129;
        if (value == "silver") return 130;
        if (value == "skyblue") return 131;
        if (value == "slateblue") return 132;
        if (value == "slategray") return 133;
        if (value == "slategrey") return 134;
        if (value == "snow") return 135;
        if (value == "springgreen") return 136;
        if (value == "steelblue") return 137;
        if (value == "tan") return 138;
        if (value == "teal") return 139;
        if (value == "thistle") return 140;
        if (value == "tomato") return 141;
        if (value == "turquoise") return 142;
        if (value == "violet") return 143;
        if (value == "wheat") return 144;
        if (value == "white") return 145;
        if (value == "whitesmoke") return 146;
        if (value == "yellow") return 147;
        if (value == "yellowgreen") return 148;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.COLORNAMES", value);
        return 0;
  }

  CompassdirectionToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "n"; break;
            case 2: value = "e"; break;
            case 3: value = "s"; break;
            case 4: value = "w"; break;
            case 5: value = "ne"; break;
            case 6: value = "nw"; break;
            case 7: value = "se"; break;
            case 8: value = "sw"; break;
            default:
                this.logWarning("Unknown value '%d' for data.COMPASSDIRECTION", data);
                value = "";
                break;
        }
        return value;
  }

  StrToCompassdirection(value: string, logWarning: boolean = true): number {
    
        if (value == "n") return 1;
        if (value == "e") return 2;
        if (value == "s") return 3;
        if (value == "w") return 4;
        if (value == "ne") return 5;
        if (value == "nw") return 6;
        if (value == "se") return 7;
        if (value == "sw") return 8;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.COMPASSDIRECTION", value);
        return 0;
  }

  CompassdirectionBasicToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "n"; break;
            case 2: value = "e"; break;
            case 3: value = "s"; break;
            case 4: value = "w"; break;
            default:
                this.logWarning("Unknown value '%d' for data.COMPASSDIRECTION.basic", data);
                value = "";
                break;
        }
        return value;
  }

  StrToCompassdirectionBasic(value: string, logWarning: boolean = true): number {
    
        if (value == "n") return 1;
        if (value == "e") return 2;
        if (value == "s") return 3;
        if (value == "w") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.COMPASSDIRECTION.basic", value);
        return 0;
  }

  CompassdirectionExtendedToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "ne"; break;
            case 2: value = "nw"; break;
            case 3: value = "se"; break;
            case 4: value = "sw"; break;
            default:
                this.logWarning("Unknown value '%d' for data.COMPASSDIRECTION.extended", data);
                value = "";
                break;
        }
        return value;
  }

  StrToCompassdirectionExtended(value: string, logWarning: boolean = true): number {
    
        if (value == "ne") return 1;
        if (value == "nw") return 2;
        if (value == "se") return 3;
        if (value == "sw") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.COMPASSDIRECTION.extended", value);
        return 0;
  }

  CoursetuningToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "guitar.standard"; break;
            case 2: value = "guitar.drop.D"; break;
            case 3: value = "guitar.open.D"; break;
            case 4: value = "guitar.open.G"; break;
            case 5: value = "guitar.open.A"; break;
            case 6: value = "lute.renaissance.6"; break;
            case 7: value = "lute.baroque.d.major"; break;
            case 8: value = "lute.baroque.d.minor"; break;
            default:
                this.logWarning("Unknown value '%d' for data.COURSETUNING", data);
                value = "";
                break;
        }
        return value;
  }

  StrToCoursetuning(value: string, logWarning: boolean = true): number {
    
        if (value == "guitar.standard") return 1;
        if (value == "guitar.drop.D") return 2;
        if (value == "guitar.open.D") return 3;
        if (value == "guitar.open.G") return 4;
        if (value == "guitar.open.A") return 5;
        if (value == "lute.renaissance.6") return 6;
        if (value == "lute.baroque.d.major") return 7;
        if (value == "lute.baroque.d.minor") return 8;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.COURSETUNING", value);
        return 0;
  }

  DivisioToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "ternaria"; break;
            case 2: value = "quaternaria"; break;
            case 3: value = "senariaimperf"; break;
            case 4: value = "senariaperf"; break;
            case 5: value = "octonaria"; break;
            case 6: value = "novenaria"; break;
            case 7: value = "duodenaria"; break;
            default:
                this.logWarning("Unknown value '%d' for data.DIVISIO", data);
                value = "";
                break;
        }
        return value;
  }

  StrToDivisio(value: string, logWarning: boolean = true): number {
    
        if (value == "ternaria") return 1;
        if (value == "quaternaria") return 2;
        if (value == "senariaimperf") return 3;
        if (value == "senariaperf") return 4;
        if (value == "octonaria") return 5;
        if (value == "novenaria") return 6;
        if (value == "duodenaria") return 7;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.DIVISIO", value);
        return 0;
  }

  DurationrestsMensuralToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "2B"; break;
            case 2: value = "3B"; break;
            case 3: value = "maxima"; break;
            case 4: value = "longa"; break;
            case 5: value = "brevis"; break;
            case 6: value = "semibrevis"; break;
            case 7: value = "minima"; break;
            case 8: value = "semiminima"; break;
            case 9: value = "fusa"; break;
            case 10: value = "semifusa"; break;
            default:
                this.logWarning("Unknown value '%d' for data.DURATIONRESTS.mensural", data);
                value = "";
                break;
        }
        return value;
  }

  StrToDurationrestsMensural(value: string, logWarning: boolean = true): number {
    
        if (value == "2B") return 1;
        if (value == "3B") return 2;
        if (value == "maxima") return 3;
        if (value == "longa") return 4;
        if (value == "brevis") return 5;
        if (value == "semibrevis") return 6;
        if (value == "minima") return 7;
        if (value == "semiminima") return 8;
        if (value == "fusa") return 9;
        if (value == "semifusa") return 10;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.DURATIONRESTS.mensural", value);
        return 0;
  }

  DurqualityMensuralToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "perfecta"; break;
            case 2: value = "imperfecta"; break;
            case 3: value = "altera"; break;
            case 4: value = "minor"; break;
            case 5: value = "maior"; break;
            case 6: value = "duplex"; break;
            default:
                this.logWarning("Unknown value '%d' for data.DURQUALITY.mensural", data);
                value = "";
                break;
        }
        return value;
  }

  StrToDurqualityMensural(value: string, logWarning: boolean = true): number {
    
        if (value == "perfecta") return 1;
        if (value == "imperfecta") return 2;
        if (value == "altera") return 3;
        if (value == "minor") return 4;
        if (value == "maior") return 5;
        if (value == "duplex") return 6;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.DURQUALITY.mensural", value);
        return 0;
  }

  EnclosureToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "paren"; break;
            case 2: value = "brack"; break;
            case 3: value = "box"; break;
            case 4: value = "none"; break;
            default:
                this.logWarning("Unknown value '%d' for data.ENCLOSURE", data);
                value = "";
                break;
        }
        return value;
  }

  StrToEnclosure(value: string, logWarning: boolean = true): number {
    
        if (value == "paren") return 1;
        if (value == "brack") return 2;
        if (value == "box") return 3;
        if (value == "none") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.ENCLOSURE", value);
        return 0;
  }

  EventrelToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "above"; break;
            case 2: value = "below"; break;
            case 3: value = "left"; break;
            case 4: value = "right"; break;
            case 5: value = "above-left"; break;
            case 6: value = "above-right"; break;
            case 7: value = "below-left"; break;
            case 8: value = "below-right"; break;
            default:
                this.logWarning("Unknown value '%d' for data.EVENTREL", data);
                value = "";
                break;
        }
        return value;
  }

  StrToEventrel(value: string, logWarning: boolean = true): number {
    
        if (value == "above") return 1;
        if (value == "below") return 2;
        if (value == "left") return 3;
        if (value == "right") return 4;
        if (value == "above-left") return 5;
        if (value == "above-right") return 6;
        if (value == "below-left") return 7;
        if (value == "below-right") return 8;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.EVENTREL", value);
        return 0;
  }

  EventrelBasicToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "above"; break;
            case 2: value = "below"; break;
            case 3: value = "left"; break;
            case 4: value = "right"; break;
            default:
                this.logWarning("Unknown value '%d' for data.EVENTREL.basic", data);
                value = "";
                break;
        }
        return value;
  }

  StrToEventrelBasic(value: string, logWarning: boolean = true): number {
    
        if (value == "above") return 1;
        if (value == "below") return 2;
        if (value == "left") return 3;
        if (value == "right") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.EVENTREL.basic", value);
        return 0;
  }

  EventrelExtendedToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "above-left"; break;
            case 2: value = "above-right"; break;
            case 3: value = "below-left"; break;
            case 4: value = "below-right"; break;
            default:
                this.logWarning("Unknown value '%d' for data.EVENTREL.extended", data);
                value = "";
                break;
        }
        return value;
  }

  StrToEventrelExtended(value: string, logWarning: boolean = true): number {
    
        if (value == "above-left") return 1;
        if (value == "above-right") return 2;
        if (value == "below-left") return 3;
        if (value == "below-right") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.EVENTREL.extended", value);
        return 0;
  }

  FillToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "void"; break;
            case 2: value = "solid"; break;
            case 3: value = "top"; break;
            case 4: value = "bottom"; break;
            case 5: value = "left"; break;
            case 6: value = "right"; break;
            default:
                this.logWarning("Unknown value '%d' for data.FILL", data);
                value = "";
                break;
        }
        return value;
  }

  StrToFill(value: string, logWarning: boolean = true): number {
    
        if (value == "void") return 1;
        if (value == "solid") return 2;
        if (value == "top") return 3;
        if (value == "bottom") return 4;
        if (value == "left") return 5;
        if (value == "right") return 6;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.FILL", value);
        return 0;
  }

  FlagformMensuralToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "straight"; break;
            case 2: value = "angled"; break;
            case 3: value = "curled"; break;
            case 4: value = "flared"; break;
            case 5: value = "extended"; break;
            case 6: value = "hooked"; break;
            default:
                this.logWarning("Unknown value '%d' for data.FLAGFORM.mensural", data);
                value = "";
                break;
        }
        return value;
  }

  StrToFlagformMensural(value: string, logWarning: boolean = true): number {
    
        if (value == "straight") return 1;
        if (value == "angled") return 2;
        if (value == "curled") return 3;
        if (value == "flared") return 4;
        if (value == "extended") return 5;
        if (value == "hooked") return 6;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.FLAGFORM.mensural", value);
        return 0;
  }

  FlagposMensuralToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "left"; break;
            case 2: value = "right"; break;
            case 3: value = "center"; break;
            default:
                this.logWarning("Unknown value '%d' for data.FLAGPOS.mensural", data);
                value = "";
                break;
        }
        return value;
  }

  StrToFlagposMensural(value: string, logWarning: boolean = true): number {
    
        if (value == "left") return 1;
        if (value == "right") return 2;
        if (value == "center") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.FLAGPOS.mensural", value);
        return 0;
  }

  FontsizetermToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "xx-small"; break;
            case 2: value = "x-small"; break;
            case 3: value = "small"; break;
            case 4: value = "normal"; break;
            case 5: value = "large"; break;
            case 6: value = "x-large"; break;
            case 7: value = "xx-large"; break;
            case 8: value = "smaller"; break;
            case 9: value = "larger"; break;
            default:
                this.logWarning("Unknown value '%d' for data.FONTSIZETERM", data);
                value = "";
                break;
        }
        return value;
  }

  StrToFontsizeterm(value: string, logWarning: boolean = true): number {
    
        if (value == "xx-small") return 1;
        if (value == "x-small") return 2;
        if (value == "small") return 3;
        if (value == "normal") return 4;
        if (value == "large") return 5;
        if (value == "x-large") return 6;
        if (value == "xx-large") return 7;
        if (value == "smaller") return 8;
        if (value == "larger") return 9;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.FONTSIZETERM", value);
        return 0;
  }

  FontstyleToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "italic"; break;
            case 2: value = "normal"; break;
            case 3: value = "oblique"; break;
            default:
                this.logWarning("Unknown value '%d' for data.FONTSTYLE", data);
                value = "";
                break;
        }
        return value;
  }

  StrToFontstyle(value: string, logWarning: boolean = true): number {
    
        if (value == "italic") return 1;
        if (value == "normal") return 2;
        if (value == "oblique") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.FONTSTYLE", value);
        return 0;
  }

  FontweightToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "bold"; break;
            case 2: value = "normal"; break;
            default:
                this.logWarning("Unknown value '%d' for data.FONTWEIGHT", data);
                value = "";
                break;
        }
        return value;
  }

  StrToFontweight(value: string, logWarning: boolean = true): number {
    
        if (value == "bold") return 1;
        if (value == "normal") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.FONTWEIGHT", value);
        return 0;
  }

  FrbrrelationshipToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "hasAbridgement"; break;
            case 2: value = "isAbridgementOf"; break;
            case 3: value = "hasAdaptation"; break;
            case 4: value = "isAdaptationOf"; break;
            case 5: value = "hasAlternate"; break;
            case 6: value = "isAlternateOf"; break;
            case 7: value = "hasArrangement"; break;
            case 8: value = "isArrangementOf"; break;
            case 9: value = "hasComplement"; break;
            case 10: value = "isComplementOf"; break;
            case 11: value = "hasEmbodiment"; break;
            case 12: value = "isEmbodimentOf"; break;
            case 13: value = "hasExemplar"; break;
            case 14: value = "isExemplarOf"; break;
            case 15: value = "hasImitation"; break;
            case 16: value = "isImitationOf"; break;
            case 17: value = "hasPart"; break;
            case 18: value = "isPartOf"; break;
            case 19: value = "hasRealization"; break;
            case 20: value = "isRealizationOf"; break;
            case 21: value = "hasReconfiguration"; break;
            case 22: value = "isReconfigurationOf"; break;
            case 23: value = "hasReproduction"; break;
            case 24: value = "isReproductionOf"; break;
            case 25: value = "hasRevision"; break;
            case 26: value = "isRevisionOf"; break;
            case 27: value = "hasSuccessor"; break;
            case 28: value = "isSuccessorOf"; break;
            case 29: value = "hasSummarization"; break;
            case 30: value = "isSummarizationOf"; break;
            case 31: value = "hasSupplement"; break;
            case 32: value = "isSupplementOf"; break;
            case 33: value = "hasTransformation"; break;
            case 34: value = "isTransformationOf"; break;
            case 35: value = "hasTranslation"; break;
            case 36: value = "isTranslationOf"; break;
            default:
                this.logWarning("Unknown value '%d' for data.FRBRRELATIONSHIP", data);
                value = "";
                break;
        }
        return value;
  }

  StrToFrbrrelationship(value: string, logWarning: boolean = true): number {
    
        if (value == "hasAbridgement") return 1;
        if (value == "isAbridgementOf") return 2;
        if (value == "hasAdaptation") return 3;
        if (value == "isAdaptationOf") return 4;
        if (value == "hasAlternate") return 5;
        if (value == "isAlternateOf") return 6;
        if (value == "hasArrangement") return 7;
        if (value == "isArrangementOf") return 8;
        if (value == "hasComplement") return 9;
        if (value == "isComplementOf") return 10;
        if (value == "hasEmbodiment") return 11;
        if (value == "isEmbodimentOf") return 12;
        if (value == "hasExemplar") return 13;
        if (value == "isExemplarOf") return 14;
        if (value == "hasImitation") return 15;
        if (value == "isImitationOf") return 16;
        if (value == "hasPart") return 17;
        if (value == "isPartOf") return 18;
        if (value == "hasRealization") return 19;
        if (value == "isRealizationOf") return 20;
        if (value == "hasReconfiguration") return 21;
        if (value == "isReconfigurationOf") return 22;
        if (value == "hasReproduction") return 23;
        if (value == "isReproductionOf") return 24;
        if (value == "hasRevision") return 25;
        if (value == "isRevisionOf") return 26;
        if (value == "hasSuccessor") return 27;
        if (value == "isSuccessorOf") return 28;
        if (value == "hasSummarization") return 29;
        if (value == "isSummarizationOf") return 30;
        if (value == "hasSupplement") return 31;
        if (value == "isSupplementOf") return 32;
        if (value == "hasTransformation") return 33;
        if (value == "isTransformationOf") return 34;
        if (value == "hasTranslation") return 35;
        if (value == "isTranslationOf") return 36;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.FRBRRELATIONSHIP", value);
        return 0;
  }

  GlissandoToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "i"; break;
            case 2: value = "m"; break;
            case 3: value = "t"; break;
            default:
                this.logWarning("Unknown value '%d' for data.GLISSANDO", data);
                value = "";
                break;
        }
        return value;
  }

  StrToGlissando(value: string, logWarning: boolean = true): number {
    
        if (value == "i") return 1;
        if (value == "m") return 2;
        if (value == "t") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.GLISSANDO", value);
        return 0;
  }

  GraceToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "acc"; break;
            case 2: value = "unacc"; break;
            case 3: value = "unknown"; break;
            default:
                this.logWarning("Unknown value '%d' for data.GRACE", data);
                value = "";
                break;
        }
        return value;
  }

  StrToGrace(value: string, logWarning: boolean = true): number {
    
        if (value == "acc") return 1;
        if (value == "unacc") return 2;
        if (value == "unknown") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.GRACE", value);
        return 0;
  }

  HarppedalpositionToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "f"; break;
            case 2: value = "n"; break;
            case 3: value = "s"; break;
            default:
                this.logWarning("Unknown value '%d' for data.HARPPEDALPOSITION", data);
                value = "";
                break;
        }
        return value;
  }

  StrToHarppedalposition(value: string, logWarning: boolean = true): number {
    
        if (value == "f") return 1;
        if (value == "n") return 2;
        if (value == "s") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.HARPPEDALPOSITION", value);
        return 0;
  }

  HeadshapeListToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "quarter"; break;
            case 2: value = "half"; break;
            case 3: value = "whole"; break;
            case 4: value = "backslash"; break;
            case 5: value = "circle"; break;
            case 6: value = "+"; break;
            case 7: value = "diamond"; break;
            case 8: value = "isotriangle"; break;
            case 9: value = "oval"; break;
            case 10: value = "piewedge"; break;
            case 11: value = "rectangle"; break;
            case 12: value = "rtriangle"; break;
            case 13: value = "semicircle"; break;
            case 14: value = "slash"; break;
            case 15: value = "square"; break;
            case 16: value = "x"; break;
            default:
                this.logWarning("Unknown value '%d' for data.HEADSHAPE.list", data);
                value = "";
                break;
        }
        return value;
  }

  StrToHeadshapeList(value: string, logWarning: boolean = true): number {
    
        if (value == "quarter") return 1;
        if (value == "half") return 2;
        if (value == "whole") return 3;
        if (value == "backslash") return 4;
        if (value == "circle") return 5;
        if (value == "+") return 6;
        if (value == "diamond") return 7;
        if (value == "isotriangle") return 8;
        if (value == "oval") return 9;
        if (value == "piewedge") return 10;
        if (value == "rectangle") return 11;
        if (value == "rtriangle") return 12;
        if (value == "semicircle") return 13;
        if (value == "slash") return 14;
        if (value == "square") return 15;
        if (value == "x") return 16;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.HEADSHAPE.list", value);
        return 0;
  }

  HorizontalalignmentToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "left"; break;
            case 2: value = "right"; break;
            case 3: value = "center"; break;
            case 4: value = "justify"; break;
            default:
                this.logWarning("Unknown value '%d' for data.HORIZONTALALIGNMENT", data);
                value = "";
                break;
        }
        return value;
  }

  StrToHorizontalalignment(value: string, logWarning: boolean = true): number {
    
        if (value == "left") return 1;
        if (value == "right") return 2;
        if (value == "center") return 3;
        if (value == "justify") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.HORIZONTALALIGNMENT", value);
        return 0;
  }

  LayerschemeToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "1"; break;
            case 2: value = "2o"; break;
            case 3: value = "2f"; break;
            case 4: value = "3o"; break;
            case 5: value = "3f"; break;
            default:
                this.logWarning("Unknown value '%d' for data.LAYERSCHEME", data);
                value = "";
                break;
        }
        return value;
  }

  StrToLayerscheme(value: string, logWarning: boolean = true): number {
    
        if (value == "1") return 1;
        if (value == "2o") return 2;
        if (value == "2f") return 3;
        if (value == "3o") return 4;
        if (value == "3f") return 5;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.LAYERSCHEME", value);
        return 0;
  }

  LigatureformToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "recta"; break;
            case 2: value = "obliqua"; break;
            default:
                this.logWarning("Unknown value '%d' for data.LIGATUREFORM", data);
                value = "";
                break;
        }
        return value;
  }

  StrToLigatureform(value: string, logWarning: boolean = true): number {
    
        if (value == "recta") return 1;
        if (value == "obliqua") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.LIGATUREFORM", value);
        return 0;
  }

  LineformToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "dashed"; break;
            case 2: value = "dotted"; break;
            case 3: value = "solid"; break;
            case 4: value = "wavy"; break;
            default:
                this.logWarning("Unknown value '%d' for data.LINEFORM", data);
                value = "";
                break;
        }
        return value;
  }

  StrToLineform(value: string, logWarning: boolean = true): number {
    
        if (value == "dashed") return 1;
        if (value == "dotted") return 2;
        if (value == "solid") return 3;
        if (value == "wavy") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.LINEFORM", value);
        return 0;
  }

  LinestartendsymbolToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "angledown"; break;
            case 2: value = "angleup"; break;
            case 3: value = "angleright"; break;
            case 4: value = "angleleft"; break;
            case 5: value = "arrow"; break;
            case 6: value = "arrowopen"; break;
            case 7: value = "arrowwhite"; break;
            case 8: value = "harpoonleft"; break;
            case 9: value = "harpoonright"; break;
            case 10: value = "H"; break;
            case 11: value = "N"; break;
            case 12: value = "Th"; break;
            case 13: value = "ThRetro"; break;
            case 14: value = "ThRetroInv"; break;
            case 15: value = "ThInv"; break;
            case 16: value = "T"; break;
            case 17: value = "TInv"; break;
            case 18: value = "CH"; break;
            case 19: value = "RH"; break;
            case 20: value = "none"; break;
            default:
                this.logWarning("Unknown value '%d' for data.LINESTARTENDSYMBOL", data);
                value = "";
                break;
        }
        return value;
  }

  StrToLinestartendsymbol(value: string, logWarning: boolean = true): number {
    
        if (value == "angledown") return 1;
        if (value == "angleup") return 2;
        if (value == "angleright") return 3;
        if (value == "angleleft") return 4;
        if (value == "arrow") return 5;
        if (value == "arrowopen") return 6;
        if (value == "arrowwhite") return 7;
        if (value == "harpoonleft") return 8;
        if (value == "harpoonright") return 9;
        if (value == "H") return 10;
        if (value == "N") return 11;
        if (value == "Th") return 12;
        if (value == "ThRetro") return 13;
        if (value == "ThRetroInv") return 14;
        if (value == "ThInv") return 15;
        if (value == "T") return 16;
        if (value == "TInv") return 17;
        if (value == "CH") return 18;
        if (value == "RH") return 19;
        if (value == "none") return 20;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.LINESTARTENDSYMBOL", value);
        return 0;
  }

  LinewidthtermToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "narrow"; break;
            case 2: value = "medium"; break;
            case 3: value = "wide"; break;
            default:
                this.logWarning("Unknown value '%d' for data.LINEWIDTHTERM", data);
                value = "";
                break;
        }
        return value;
  }

  StrToLinewidthterm(value: string, logWarning: boolean = true): number {
    
        if (value == "narrow") return 1;
        if (value == "medium") return 2;
        if (value == "wide") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.LINEWIDTHTERM", value);
        return 0;
  }

  MarcrelatorsBasicToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "arr"; break;
            case 2: value = "aut"; break;
            case 3: value = "cmp"; break;
            case 4: value = "dte"; break;
            case 5: value = "edt"; break;
            case 6: value = "lbt"; break;
            case 7: value = "lyr"; break;
            default:
                this.logWarning("Unknown value '%d' for data.MARCRELATORS.basic", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMarcrelatorsBasic(value: string, logWarning: boolean = true): number {
    
        if (value == "arr") return 1;
        if (value == "aut") return 2;
        if (value == "cmp") return 3;
        if (value == "dte") return 4;
        if (value == "edt") return 5;
        if (value == "lbt") return 6;
        if (value == "lyr") return 7;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.MARCRELATORS.basic", value);
        return 0;
  }

  MarcrelatorsExtendedToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "act"; break;
            case 2: value = "ard"; break;
            case 3: value = "art"; break;
            case 4: value = "aus"; break;
            case 5: value = "chr"; break;
            case 6: value = "cnd"; break;
            case 7: value = "crp"; break;
            case 8: value = "cst"; break;
            case 9: value = "drt"; break;
            case 10: value = "egr"; break;
            case 11: value = "flm"; break;
            case 12: value = "fmd"; break;
            case 13: value = "fmp"; break;
            case 14: value = "itr"; break;
            case 15: value = "mcp"; break;
            case 16: value = "mus"; break;
            case 17: value = "msd"; break;
            case 18: value = "pdr"; break;
            case 19: value = "pmn"; break;
            case 20: value = "prn"; break;
            case 21: value = "pro"; break;
            case 22: value = "rce"; break;
            case 23: value = "scr"; break;
            case 24: value = "sng"; break;
            case 25: value = "std"; break;
            case 26: value = "trc"; break;
            case 27: value = "trl"; break;
            default:
                this.logWarning("Unknown value '%d' for data.MARCRELATORS.extended", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMarcrelatorsExtended(value: string, logWarning: boolean = true): number {
    
        if (value == "act") return 1;
        if (value == "ard") return 2;
        if (value == "art") return 3;
        if (value == "aus") return 4;
        if (value == "chr") return 5;
        if (value == "cnd") return 6;
        if (value == "crp") return 7;
        if (value == "cst") return 8;
        if (value == "drt") return 9;
        if (value == "egr") return 10;
        if (value == "flm") return 11;
        if (value == "fmd") return 12;
        if (value == "fmp") return 13;
        if (value == "itr") return 14;
        if (value == "mcp") return 15;
        if (value == "mus") return 16;
        if (value == "msd") return 17;
        if (value == "pdr") return 18;
        if (value == "pmn") return 19;
        if (value == "prn") return 20;
        if (value == "pro") return 21;
        if (value == "rce") return 22;
        if (value == "scr") return 23;
        if (value == "sng") return 24;
        if (value == "std") return 25;
        if (value == "trc") return 26;
        if (value == "trl") return 27;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.MARCRELATORS.extended", value);
        return 0;
  }

  MelodicfunctionToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "aln"; break;
            case 2: value = "ant"; break;
            case 3: value = "app"; break;
            case 4: value = "apt"; break;
            case 5: value = "arp"; break;
            case 6: value = "arp7"; break;
            case 7: value = "aun"; break;
            case 8: value = "chg"; break;
            case 9: value = "cln"; break;
            case 10: value = "ct"; break;
            case 11: value = "ct7"; break;
            case 12: value = "cun"; break;
            case 13: value = "cup"; break;
            case 14: value = "et"; break;
            case 15: value = "ln"; break;
            case 16: value = "ped"; break;
            case 17: value = "rep"; break;
            case 18: value = "ret"; break;
            case 19: value = "23ret"; break;
            case 20: value = "78ret"; break;
            case 21: value = "sus"; break;
            case 22: value = "43sus"; break;
            case 23: value = "98sus"; break;
            case 24: value = "76sus"; break;
            case 25: value = "un"; break;
            case 26: value = "un7"; break;
            case 27: value = "upt"; break;
            case 28: value = "upt7"; break;
            default:
                this.logWarning("Unknown value '%d' for data.MELODICFUNCTION", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMelodicfunction(value: string, logWarning: boolean = true): number {
    
        if (value == "aln") return 1;
        if (value == "ant") return 2;
        if (value == "app") return 3;
        if (value == "apt") return 4;
        if (value == "arp") return 5;
        if (value == "arp7") return 6;
        if (value == "aun") return 7;
        if (value == "chg") return 8;
        if (value == "cln") return 9;
        if (value == "ct") return 10;
        if (value == "ct7") return 11;
        if (value == "cun") return 12;
        if (value == "cup") return 13;
        if (value == "et") return 14;
        if (value == "ln") return 15;
        if (value == "ped") return 16;
        if (value == "rep") return 17;
        if (value == "ret") return 18;
        if (value == "23ret") return 19;
        if (value == "78ret") return 20;
        if (value == "sus") return 21;
        if (value == "43sus") return 22;
        if (value == "98sus") return 23;
        if (value == "76sus") return 24;
        if (value == "un") return 25;
        if (value == "un7") return 26;
        if (value == "upt") return 27;
        if (value == "upt7") return 28;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.MELODICFUNCTION", value);
        return 0;
  }

  MensurationsignToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "C"; break;
            case 2: value = "O"; break;
            case 3: value = "t"; break;
            case 4: value = "q"; break;
            case 5: value = "si"; break;
            case 6: value = "i"; break;
            case 7: value = "sg"; break;
            case 8: value = "g"; break;
            case 9: value = "sp"; break;
            case 10: value = "p"; break;
            case 11: value = "sy"; break;
            case 12: value = "y"; break;
            case 13: value = "n"; break;
            case 14: value = "oc"; break;
            case 15: value = "d"; break;
            default:
                this.logWarning("Unknown value '%d' for data.MENSURATIONSIGN", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMensurationsign(value: string, logWarning: boolean = true): number {
    
        if (value == "C") return 1;
        if (value == "O") return 2;
        if (value == "t") return 3;
        if (value == "q") return 4;
        if (value == "si") return 5;
        if (value == "i") return 6;
        if (value == "sg") return 7;
        if (value == "g") return 8;
        if (value == "sp") return 9;
        if (value == "p") return 10;
        if (value == "sy") return 11;
        if (value == "y") return 12;
        if (value == "n") return 13;
        if (value == "oc") return 14;
        if (value == "d") return 15;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.MENSURATIONSIGN", value);
        return 0;
  }

  MeterformToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "num"; break;
            case 2: value = "denomsym"; break;
            case 3: value = "norm"; break;
            case 4: value = "sym+norm"; break;
            default:
                this.logWarning("Unknown value '%d' for data.METERFORM", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMeterform(value: string, logWarning: boolean = true): number {
    
        if (value == "num") return 1;
        if (value == "denomsym") return 2;
        if (value == "norm") return 3;
        if (value == "sym+norm") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.METERFORM", value);
        return 0;
  }

  MetersignToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "common"; break;
            case 2: value = "cut"; break;
            case 3: value = "open"; break;
            default:
                this.logWarning("Unknown value '%d' for data.METERSIGN", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMetersign(value: string, logWarning: boolean = true): number {
    
        if (value == "common") return 1;
        if (value == "cut") return 2;
        if (value == "open") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.METERSIGN", value);
        return 0;
  }

  MidinamesToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "Acoustic_Grand_Piano"; break;
            case 2: value = "Bright_Acoustic_Piano"; break;
            case 3: value = "Electric_Grand_Piano"; break;
            case 4: value = "Honky-tonk_Piano"; break;
            case 5: value = "Electric_Piano_1"; break;
            case 6: value = "Electric_Piano_2"; break;
            case 7: value = "Harpsichord"; break;
            case 8: value = "Clavi"; break;
            case 9: value = "Celesta"; break;
            case 10: value = "Glockenspiel"; break;
            case 11: value = "Music_Box"; break;
            case 12: value = "Vibraphone"; break;
            case 13: value = "Marimba"; break;
            case 14: value = "Xylophone"; break;
            case 15: value = "Tubular_Bells"; break;
            case 16: value = "Dulcimer"; break;
            case 17: value = "Drawbar_Organ"; break;
            case 18: value = "Percussive_Organ"; break;
            case 19: value = "Rock_Organ"; break;
            case 20: value = "Church_Organ"; break;
            case 21: value = "Reed_Organ"; break;
            case 22: value = "Accordion"; break;
            case 23: value = "Harmonica"; break;
            case 24: value = "Tango_Accordion"; break;
            case 25: value = "Acoustic_Guitar_nylon"; break;
            case 26: value = "Acoustic_Guitar_steel"; break;
            case 27: value = "Electric_Guitar_jazz"; break;
            case 28: value = "Electric_Guitar_clean"; break;
            case 29: value = "Electric_Guitar_muted"; break;
            case 30: value = "Overdriven_Guitar"; break;
            case 31: value = "Distortion_Guitar"; break;
            case 32: value = "Guitar_harmonics"; break;
            case 33: value = "Acoustic_Bass"; break;
            case 34: value = "Electric_Bass_finger"; break;
            case 35: value = "Electric_Bass_pick"; break;
            case 36: value = "Fretless_Bass"; break;
            case 37: value = "Slap_Bass_1"; break;
            case 38: value = "Slap_Bass_2"; break;
            case 39: value = "Synth_Bass_1"; break;
            case 40: value = "Synth_Bass_2"; break;
            case 41: value = "Violin"; break;
            case 42: value = "Viola"; break;
            case 43: value = "Cello"; break;
            case 44: value = "Contrabass"; break;
            case 45: value = "Tremolo_Strings"; break;
            case 46: value = "Pizzicato_Strings"; break;
            case 47: value = "Orchestral_Harp"; break;
            case 48: value = "Timpani"; break;
            case 49: value = "String_Ensemble_1"; break;
            case 50: value = "String_Ensemble_2"; break;
            case 51: value = "SynthStrings_1"; break;
            case 52: value = "SynthStrings_2"; break;
            case 53: value = "Choir_Aahs"; break;
            case 54: value = "Voice_Oohs"; break;
            case 55: value = "Synth_Voice"; break;
            case 56: value = "Orchestra_Hit"; break;
            case 57: value = "Trumpet"; break;
            case 58: value = "Trombone"; break;
            case 59: value = "Tuba"; break;
            case 60: value = "Muted_Trumpet"; break;
            case 61: value = "French_Horn"; break;
            case 62: value = "Brass_Section"; break;
            case 63: value = "SynthBrass_1"; break;
            case 64: value = "SynthBrass_2"; break;
            case 65: value = "Soprano_Sax"; break;
            case 66: value = "Alto_Sax"; break;
            case 67: value = "Tenor_Sax"; break;
            case 68: value = "Baritone_Sax"; break;
            case 69: value = "Oboe"; break;
            case 70: value = "English_Horn"; break;
            case 71: value = "Bassoon"; break;
            case 72: value = "Clarinet"; break;
            case 73: value = "Piccolo"; break;
            case 74: value = "Flute"; break;
            case 75: value = "Recorder"; break;
            case 76: value = "Pan_Flute"; break;
            case 77: value = "Blown_Bottle"; break;
            case 78: value = "Shakuhachi"; break;
            case 79: value = "Whistle"; break;
            case 80: value = "Ocarina"; break;
            case 81: value = "Lead_1_square"; break;
            case 82: value = "Lead_2_sawtooth"; break;
            case 83: value = "Lead_3_calliope"; break;
            case 84: value = "Lead_4_chiff"; break;
            case 85: value = "Lead_5_charang"; break;
            case 86: value = "Lead_6_voice"; break;
            case 87: value = "Lead_7_fifths"; break;
            case 88: value = "Lead_8_bass_and_lead"; break;
            case 89: value = "Pad_1_new_age"; break;
            case 90: value = "Pad_2_warm"; break;
            case 91: value = "Pad_3_polysynth"; break;
            case 92: value = "Pad_4_choir"; break;
            case 93: value = "Pad_5_bowed"; break;
            case 94: value = "Pad_6_metallic"; break;
            case 95: value = "Pad_7_halo"; break;
            case 96: value = "Pad_8_sweep"; break;
            case 97: value = "FX_1_rain"; break;
            case 98: value = "FX_2_soundtrack"; break;
            case 99: value = "FX_3_crystal"; break;
            case 100: value = "FX_4_atmosphere"; break;
            case 101: value = "FX_5_brightness"; break;
            case 102: value = "FX_6_goblins"; break;
            case 103: value = "FX_7_echoes"; break;
            case 104: value = "FX_8_sci-fi"; break;
            case 105: value = "Sitar"; break;
            case 106: value = "Banjo"; break;
            case 107: value = "Shamisen"; break;
            case 108: value = "Koto"; break;
            case 109: value = "Kalimba"; break;
            case 110: value = "Bag_pipe"; break;
            case 111: value = "Fiddle"; break;
            case 112: value = "Shanai"; break;
            case 113: value = "Tinkle_Bell"; break;
            case 114: value = "Agogo"; break;
            case 115: value = "Steel_Drums"; break;
            case 116: value = "Woodblock"; break;
            case 117: value = "Taiko_Drum"; break;
            case 118: value = "Melodic_Tom"; break;
            case 119: value = "Synth_Drum"; break;
            case 120: value = "Reverse_Cymbal"; break;
            case 121: value = "Guitar_Fret_Noise"; break;
            case 122: value = "Breath_Noise"; break;
            case 123: value = "Seashore"; break;
            case 124: value = "Bird_Tweet"; break;
            case 125: value = "Telephone_Ring"; break;
            case 126: value = "Helicopter"; break;
            case 127: value = "Applause"; break;
            case 128: value = "Gunshot"; break;
            case 129: value = "Acoustic_Bass_Drum"; break;
            case 130: value = "Bass_Drum_1"; break;
            case 131: value = "Side_Stick"; break;
            case 132: value = "Acoustic_Snare"; break;
            case 133: value = "Hand_Clap"; break;
            case 134: value = "Electric_Snare"; break;
            case 135: value = "Low_Floor_Tom"; break;
            case 136: value = "Closed_Hi_Hat"; break;
            case 137: value = "High_Floor_Tom"; break;
            case 138: value = "Pedal_Hi-Hat"; break;
            case 139: value = "Low_Tom"; break;
            case 140: value = "Open_Hi-Hat"; break;
            case 141: value = "Low-Mid_Tom"; break;
            case 142: value = "Hi-Mid_Tom"; break;
            case 143: value = "Crash_Cymbal_1"; break;
            case 144: value = "High_Tom"; break;
            case 145: value = "Ride_Cymbal_1"; break;
            case 146: value = "Chinese_Cymbal"; break;
            case 147: value = "Ride_Bell"; break;
            case 148: value = "Tambourine"; break;
            case 149: value = "Splash_Cymbal"; break;
            case 150: value = "Cowbell"; break;
            case 151: value = "Crash_Cymbal_2"; break;
            case 152: value = "Vibraslap"; break;
            case 153: value = "Ride_Cymbal_2"; break;
            case 154: value = "Hi_Bongo"; break;
            case 155: value = "Low_Bongo"; break;
            case 156: value = "Mute_Hi_Conga"; break;
            case 157: value = "Open_Hi_Conga"; break;
            case 158: value = "Low_Conga"; break;
            case 159: value = "High_Timbale"; break;
            case 160: value = "Low_Timbale"; break;
            case 161: value = "High_Agogo"; break;
            case 162: value = "Low_Agogo"; break;
            case 163: value = "Cabasa"; break;
            case 164: value = "Maracas"; break;
            case 165: value = "Short_Whistle"; break;
            case 166: value = "Long_Whistle"; break;
            case 167: value = "Short_Guiro"; break;
            case 168: value = "Long_Guiro"; break;
            case 169: value = "Claves"; break;
            case 170: value = "Hi_Wood_Block"; break;
            case 171: value = "Low_Wood_Block"; break;
            case 172: value = "Mute_Cuica"; break;
            case 173: value = "Open_Cuica"; break;
            case 174: value = "Mute_Triangle"; break;
            case 175: value = "Open_Triangle"; break;
            default:
                this.logWarning("Unknown value '%d' for data.MIDINAMES", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMidinames(value: string, logWarning: boolean = true): number {
    
        if (value == "Acoustic_Grand_Piano") return 1;
        if (value == "Bright_Acoustic_Piano") return 2;
        if (value == "Electric_Grand_Piano") return 3;
        if (value == "Honky-tonk_Piano") return 4;
        if (value == "Electric_Piano_1") return 5;
        if (value == "Electric_Piano_2") return 6;
        if (value == "Harpsichord") return 7;
        if (value == "Clavi") return 8;
        if (value == "Celesta") return 9;
        if (value == "Glockenspiel") return 10;
        if (value == "Music_Box") return 11;
        if (value == "Vibraphone") return 12;
        if (value == "Marimba") return 13;
        if (value == "Xylophone") return 14;
        if (value == "Tubular_Bells") return 15;
        if (value == "Dulcimer") return 16;
        if (value == "Drawbar_Organ") return 17;
        if (value == "Percussive_Organ") return 18;
        if (value == "Rock_Organ") return 19;
        if (value == "Church_Organ") return 20;
        if (value == "Reed_Organ") return 21;
        if (value == "Accordion") return 22;
        if (value == "Harmonica") return 23;
        if (value == "Tango_Accordion") return 24;
        if (value == "Acoustic_Guitar_nylon") return 25;
        if (value == "Acoustic_Guitar_steel") return 26;
        if (value == "Electric_Guitar_jazz") return 27;
        if (value == "Electric_Guitar_clean") return 28;
        if (value == "Electric_Guitar_muted") return 29;
        if (value == "Overdriven_Guitar") return 30;
        if (value == "Distortion_Guitar") return 31;
        if (value == "Guitar_harmonics") return 32;
        if (value == "Acoustic_Bass") return 33;
        if (value == "Electric_Bass_finger") return 34;
        if (value == "Electric_Bass_pick") return 35;
        if (value == "Fretless_Bass") return 36;
        if (value == "Slap_Bass_1") return 37;
        if (value == "Slap_Bass_2") return 38;
        if (value == "Synth_Bass_1") return 39;
        if (value == "Synth_Bass_2") return 40;
        if (value == "Violin") return 41;
        if (value == "Viola") return 42;
        if (value == "Cello") return 43;
        if (value == "Contrabass") return 44;
        if (value == "Tremolo_Strings") return 45;
        if (value == "Pizzicato_Strings") return 46;
        if (value == "Orchestral_Harp") return 47;
        if (value == "Timpani") return 48;
        if (value == "String_Ensemble_1") return 49;
        if (value == "String_Ensemble_2") return 50;
        if (value == "SynthStrings_1") return 51;
        if (value == "SynthStrings_2") return 52;
        if (value == "Choir_Aahs") return 53;
        if (value == "Voice_Oohs") return 54;
        if (value == "Synth_Voice") return 55;
        if (value == "Orchestra_Hit") return 56;
        if (value == "Trumpet") return 57;
        if (value == "Trombone") return 58;
        if (value == "Tuba") return 59;
        if (value == "Muted_Trumpet") return 60;
        if (value == "French_Horn") return 61;
        if (value == "Brass_Section") return 62;
        if (value == "SynthBrass_1") return 63;
        if (value == "SynthBrass_2") return 64;
        if (value == "Soprano_Sax") return 65;
        if (value == "Alto_Sax") return 66;
        if (value == "Tenor_Sax") return 67;
        if (value == "Baritone_Sax") return 68;
        if (value == "Oboe") return 69;
        if (value == "English_Horn") return 70;
        if (value == "Bassoon") return 71;
        if (value == "Clarinet") return 72;
        if (value == "Piccolo") return 73;
        if (value == "Flute") return 74;
        if (value == "Recorder") return 75;
        if (value == "Pan_Flute") return 76;
        if (value == "Blown_Bottle") return 77;
        if (value == "Shakuhachi") return 78;
        if (value == "Whistle") return 79;
        if (value == "Ocarina") return 80;
        if (value == "Lead_1_square") return 81;
        if (value == "Lead_2_sawtooth") return 82;
        if (value == "Lead_3_calliope") return 83;
        if (value == "Lead_4_chiff") return 84;
        if (value == "Lead_5_charang") return 85;
        if (value == "Lead_6_voice") return 86;
        if (value == "Lead_7_fifths") return 87;
        if (value == "Lead_8_bass_and_lead") return 88;
        if (value == "Pad_1_new_age") return 89;
        if (value == "Pad_2_warm") return 90;
        if (value == "Pad_3_polysynth") return 91;
        if (value == "Pad_4_choir") return 92;
        if (value == "Pad_5_bowed") return 93;
        if (value == "Pad_6_metallic") return 94;
        if (value == "Pad_7_halo") return 95;
        if (value == "Pad_8_sweep") return 96;
        if (value == "FX_1_rain") return 97;
        if (value == "FX_2_soundtrack") return 98;
        if (value == "FX_3_crystal") return 99;
        if (value == "FX_4_atmosphere") return 100;
        if (value == "FX_5_brightness") return 101;
        if (value == "FX_6_goblins") return 102;
        if (value == "FX_7_echoes") return 103;
        if (value == "FX_8_sci-fi") return 104;
        if (value == "Sitar") return 105;
        if (value == "Banjo") return 106;
        if (value == "Shamisen") return 107;
        if (value == "Koto") return 108;
        if (value == "Kalimba") return 109;
        if (value == "Bag_pipe") return 110;
        if (value == "Fiddle") return 111;
        if (value == "Shanai") return 112;
        if (value == "Tinkle_Bell") return 113;
        if (value == "Agogo") return 114;
        if (value == "Steel_Drums") return 115;
        if (value == "Woodblock") return 116;
        if (value == "Taiko_Drum") return 117;
        if (value == "Melodic_Tom") return 118;
        if (value == "Synth_Drum") return 119;
        if (value == "Reverse_Cymbal") return 120;
        if (value == "Guitar_Fret_Noise") return 121;
        if (value == "Breath_Noise") return 122;
        if (value == "Seashore") return 123;
        if (value == "Bird_Tweet") return 124;
        if (value == "Telephone_Ring") return 125;
        if (value == "Helicopter") return 126;
        if (value == "Applause") return 127;
        if (value == "Gunshot") return 128;
        if (value == "Acoustic_Bass_Drum") return 129;
        if (value == "Bass_Drum_1") return 130;
        if (value == "Side_Stick") return 131;
        if (value == "Acoustic_Snare") return 132;
        if (value == "Hand_Clap") return 133;
        if (value == "Electric_Snare") return 134;
        if (value == "Low_Floor_Tom") return 135;
        if (value == "Closed_Hi_Hat") return 136;
        if (value == "High_Floor_Tom") return 137;
        if (value == "Pedal_Hi-Hat") return 138;
        if (value == "Low_Tom") return 139;
        if (value == "Open_Hi-Hat") return 140;
        if (value == "Low-Mid_Tom") return 141;
        if (value == "Hi-Mid_Tom") return 142;
        if (value == "Crash_Cymbal_1") return 143;
        if (value == "High_Tom") return 144;
        if (value == "Ride_Cymbal_1") return 145;
        if (value == "Chinese_Cymbal") return 146;
        if (value == "Ride_Bell") return 147;
        if (value == "Tambourine") return 148;
        if (value == "Splash_Cymbal") return 149;
        if (value == "Cowbell") return 150;
        if (value == "Crash_Cymbal_2") return 151;
        if (value == "Vibraslap") return 152;
        if (value == "Ride_Cymbal_2") return 153;
        if (value == "Hi_Bongo") return 154;
        if (value == "Low_Bongo") return 155;
        if (value == "Mute_Hi_Conga") return 156;
        if (value == "Open_Hi_Conga") return 157;
        if (value == "Low_Conga") return 158;
        if (value == "High_Timbale") return 159;
        if (value == "Low_Timbale") return 160;
        if (value == "High_Agogo") return 161;
        if (value == "Low_Agogo") return 162;
        if (value == "Cabasa") return 163;
        if (value == "Maracas") return 164;
        if (value == "Short_Whistle") return 165;
        if (value == "Long_Whistle") return 166;
        if (value == "Short_Guiro") return 167;
        if (value == "Long_Guiro") return 168;
        if (value == "Claves") return 169;
        if (value == "Hi_Wood_Block") return 170;
        if (value == "Low_Wood_Block") return 171;
        if (value == "Mute_Cuica") return 172;
        if (value == "Open_Cuica") return 173;
        if (value == "Mute_Triangle") return 174;
        if (value == "Open_Triangle") return 175;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.MIDINAMES", value);
        return 0;
  }

  ModeToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "major"; break;
            case 2: value = "minor"; break;
            case 3: value = "dorian"; break;
            case 4: value = "hypodorian"; break;
            case 5: value = "phrygian"; break;
            case 6: value = "hypophrygian"; break;
            case 7: value = "lydian"; break;
            case 8: value = "hypolydian"; break;
            case 9: value = "mixolydian"; break;
            case 10: value = "hypomixolydian"; break;
            case 11: value = "peregrinus"; break;
            case 12: value = "ionian"; break;
            case 13: value = "hypoionian"; break;
            case 14: value = "aeolian"; break;
            case 15: value = "hypoaeolian"; break;
            case 16: value = "locrian"; break;
            case 17: value = "hypolocrian"; break;
            default:
                this.logWarning("Unknown value '%d' for data.MODE", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMode(value: string, logWarning: boolean = true): number {
    
        if (value == "major") return 1;
        if (value == "minor") return 2;
        if (value == "dorian") return 3;
        if (value == "hypodorian") return 4;
        if (value == "phrygian") return 5;
        if (value == "hypophrygian") return 6;
        if (value == "lydian") return 7;
        if (value == "hypolydian") return 8;
        if (value == "mixolydian") return 9;
        if (value == "hypomixolydian") return 10;
        if (value == "peregrinus") return 11;
        if (value == "ionian") return 12;
        if (value == "hypoionian") return 13;
        if (value == "aeolian") return 14;
        if (value == "hypoaeolian") return 15;
        if (value == "locrian") return 16;
        if (value == "hypolocrian") return 17;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.MODE", value);
        return 0;
  }

  ModeCmnToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "major"; break;
            case 2: value = "minor"; break;
            default:
                this.logWarning("Unknown value '%d' for data.MODE.cmn", data);
                value = "";
                break;
        }
        return value;
  }

  StrToModeCmn(value: string, logWarning: boolean = true): number {
    
        if (value == "major") return 1;
        if (value == "minor") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.MODE.cmn", value);
        return 0;
  }

  ModeExtendedToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "ionian"; break;
            case 2: value = "hypoionian"; break;
            case 3: value = "aeolian"; break;
            case 4: value = "hypoaeolian"; break;
            case 5: value = "locrian"; break;
            case 6: value = "hypolocrian"; break;
            default:
                this.logWarning("Unknown value '%d' for data.MODE.extended", data);
                value = "";
                break;
        }
        return value;
  }

  StrToModeExtended(value: string, logWarning: boolean = true): number {
    
        if (value == "ionian") return 1;
        if (value == "hypoionian") return 2;
        if (value == "aeolian") return 3;
        if (value == "hypoaeolian") return 4;
        if (value == "locrian") return 5;
        if (value == "hypolocrian") return 6;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.MODE.extended", value);
        return 0;
  }

  ModeGregorianToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "dorian"; break;
            case 2: value = "hypodorian"; break;
            case 3: value = "phrygian"; break;
            case 4: value = "hypophrygian"; break;
            case 5: value = "lydian"; break;
            case 6: value = "hypolydian"; break;
            case 7: value = "mixolydian"; break;
            case 8: value = "hypomixolydian"; break;
            case 9: value = "peregrinus"; break;
            default:
                this.logWarning("Unknown value '%d' for data.MODE.gregorian", data);
                value = "";
                break;
        }
        return value;
  }

  StrToModeGregorian(value: string, logWarning: boolean = true): number {
    
        if (value == "dorian") return 1;
        if (value == "hypodorian") return 2;
        if (value == "phrygian") return 3;
        if (value == "hypophrygian") return 4;
        if (value == "lydian") return 5;
        if (value == "hypolydian") return 6;
        if (value == "mixolydian") return 7;
        if (value == "hypomixolydian") return 8;
        if (value == "peregrinus") return 9;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.MODE.gregorian", value);
        return 0;
  }

  ModsrelationshipToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "preceding"; break;
            case 2: value = "succeeding"; break;
            case 3: value = "original"; break;
            case 4: value = "host"; break;
            case 5: value = "constituent"; break;
            case 6: value = "otherVersion"; break;
            case 7: value = "otherFormat"; break;
            case 8: value = "isReferencedBy"; break;
            case 9: value = "references"; break;
            default:
                this.logWarning("Unknown value '%d' for data.MODSRELATIONSHIP", data);
                value = "";
                break;
        }
        return value;
  }

  StrToModsrelationship(value: string, logWarning: boolean = true): number {
    
        if (value == "preceding") return 1;
        if (value == "succeeding") return 2;
        if (value == "original") return 3;
        if (value == "host") return 4;
        if (value == "constituent") return 5;
        if (value == "otherVersion") return 6;
        if (value == "otherFormat") return 7;
        if (value == "isReferencedBy") return 8;
        if (value == "references") return 9;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.MODSRELATIONSHIP", value);
        return 0;
  }

  MultibreverestsMensuralToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "2B"; break;
            case 2: value = "3B"; break;
            default:
                this.logWarning("Unknown value '%d' for data.MULTIBREVERESTS.mensural", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMultibreverestsMensural(value: string, logWarning: boolean = true): number {
    
        if (value == "2B") return 1;
        if (value == "3B") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.MULTIBREVERESTS.mensural", value);
        return 0;
  }

  NeighboringlayerToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "above"; break;
            case 2: value = "below"; break;
            default:
                this.logWarning("Unknown value '%d' for data.NEIGHBORINGLAYER", data);
                value = "";
                break;
        }
        return value;
  }

  StrToNeighboringlayer(value: string, logWarning: boolean = true): number {
    
        if (value == "above") return 1;
        if (value == "below") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.NEIGHBORINGLAYER", value);
        return 0;
  }

  NonstaffplaceToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "botmar"; break;
            case 2: value = "topmar"; break;
            case 3: value = "leftmar"; break;
            case 4: value = "rightmar"; break;
            case 5: value = "facing"; break;
            case 6: value = "overleaf"; break;
            case 7: value = "end"; break;
            case 8: value = "inter"; break;
            case 9: value = "intra"; break;
            case 10: value = "super"; break;
            case 11: value = "sub"; break;
            case 12: value = "inspace"; break;
            case 13: value = "superimposed"; break;
            default:
                this.logWarning("Unknown value '%d' for data.NONSTAFFPLACE", data);
                value = "";
                break;
        }
        return value;
  }

  StrToNonstaffplace(value: string, logWarning: boolean = true): number {
    
        if (value == "botmar") return 1;
        if (value == "topmar") return 2;
        if (value == "leftmar") return 3;
        if (value == "rightmar") return 4;
        if (value == "facing") return 5;
        if (value == "overleaf") return 6;
        if (value == "end") return 7;
        if (value == "inter") return 8;
        if (value == "intra") return 9;
        if (value == "super") return 10;
        if (value == "sub") return 11;
        if (value == "inspace") return 12;
        if (value == "superimposed") return 13;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.NONSTAFFPLACE", value);
        return 0;
  }

  NotationtypeToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "cmn"; break;
            case 2: value = "mensural"; break;
            case 3: value = "mensural.black"; break;
            case 4: value = "mensural.white"; break;
            case 5: value = "neume"; break;
            case 6: value = "neume.square"; break;
            case 7: value = "neume.hufnagel"; break;
            case 8: value = "tab"; break;
            case 9: value = "tab.staff-like"; break;
            case 10: value = "tab.guitar"; break;
            case 11: value = "tab.lute.french"; break;
            case 12: value = "tab.lute.italian"; break;
            case 13: value = "tab.lute.german"; break;
            default:
                this.logWarning("Unknown value '%d' for data.NOTATIONTYPE", data);
                value = "";
                break;
        }
        return value;
  }

  StrToNotationtype(value: string, logWarning: boolean = true): number {
    
        if (value == "cmn") return 1;
        if (value == "mensural") return 2;
        if (value == "mensural.black") return 3;
        if (value == "mensural.white") return 4;
        if (value == "neume") return 5;
        if (value == "neume.square") return 6;
        if (value == "neume.hufnagel") return 7;
        if (value == "tab") return 8;
        if (value == "tab.staff-like") return 9;
        if (value == "tab.guitar") return 10;
        if (value == "tab.lute.french") return 11;
        if (value == "tab.lute.italian") return 12;
        if (value == "tab.lute.german") return 13;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.NOTATIONTYPE", value);
        return 0;
  }

  NoteheadmodifierToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "slash"; break;
            case 2: value = "backslash"; break;
            case 3: value = "vline"; break;
            case 4: value = "hline"; break;
            case 5: value = "centerdot"; break;
            case 6: value = "paren"; break;
            case 7: value = "brack"; break;
            case 8: value = "box"; break;
            case 9: value = "circle"; break;
            case 10: value = "fences"; break;
            default:
                this.logWarning("Unknown value '%d' for data.NOTEHEADMODIFIER", data);
                value = "";
                break;
        }
        return value;
  }

  StrToNoteheadmodifier(value: string, logWarning: boolean = true): number {
    
        if (value == "slash") return 1;
        if (value == "backslash") return 2;
        if (value == "vline") return 3;
        if (value == "hline") return 4;
        if (value == "centerdot") return 5;
        if (value == "paren") return 6;
        if (value == "brack") return 7;
        if (value == "box") return 8;
        if (value == "circle") return 9;
        if (value == "fences") return 10;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.NOTEHEADMODIFIER", value);
        return 0;
  }

  NoteheadmodifierListToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "slash"; break;
            case 2: value = "backslash"; break;
            case 3: value = "vline"; break;
            case 4: value = "hline"; break;
            case 5: value = "centerdot"; break;
            case 6: value = "paren"; break;
            case 7: value = "brack"; break;
            case 8: value = "box"; break;
            case 9: value = "circle"; break;
            case 10: value = "fences"; break;
            default:
                this.logWarning("Unknown value '%d' for data.NOTEHEADMODIFIER.list", data);
                value = "";
                break;
        }
        return value;
  }

  StrToNoteheadmodifierList(value: string, logWarning: boolean = true): number {
    
        if (value == "slash") return 1;
        if (value == "backslash") return 2;
        if (value == "vline") return 3;
        if (value == "hline") return 4;
        if (value == "centerdot") return 5;
        if (value == "paren") return 6;
        if (value == "brack") return 7;
        if (value == "box") return 8;
        if (value == "circle") return 9;
        if (value == "fences") return 10;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.NOTEHEADMODIFIER.list", value);
        return 0;
  }

  PedalstyleToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "line"; break;
            case 2: value = "pedline"; break;
            case 3: value = "pedstar"; break;
            case 4: value = "altpedstar"; break;
            default:
                this.logWarning("Unknown value '%d' for data.PEDALSTYLE", data);
                value = "";
                break;
        }
        return value;
  }

  StrToPedalstyle(value: string, logWarning: boolean = true): number {
    
        if (value == "line") return 1;
        if (value == "pedline") return 2;
        if (value == "pedstar") return 3;
        if (value == "altpedstar") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.PEDALSTYLE", value);
        return 0;
  }

  PgfuncToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "all"; break;
            case 2: value = "first"; break;
            case 3: value = "last"; break;
            case 4: value = "alt1"; break;
            case 5: value = "alt2"; break;
            default:
                this.logWarning("Unknown value '%d' for data.PGFUNC", data);
                value = "";
                break;
        }
        return value;
  }

  StrToPgfunc(value: string, logWarning: boolean = true): number {
    
        if (value == "all") return 1;
        if (value == "first") return 2;
        if (value == "last") return 3;
        if (value == "alt1") return 4;
        if (value == "alt2") return 5;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.PGFUNC", value);
        return 0;
  }

  RelationshipToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "hasAbridgement"; break;
            case 2: value = "isAbridgementOf"; break;
            case 3: value = "hasAdaptation"; break;
            case 4: value = "isAdaptationOf"; break;
            case 5: value = "hasAlternate"; break;
            case 6: value = "isAlternateOf"; break;
            case 7: value = "hasArrangement"; break;
            case 8: value = "isArrangementOf"; break;
            case 9: value = "hasComplement"; break;
            case 10: value = "isComplementOf"; break;
            case 11: value = "hasEmbodiment"; break;
            case 12: value = "isEmbodimentOf"; break;
            case 13: value = "hasExemplar"; break;
            case 14: value = "isExemplarOf"; break;
            case 15: value = "hasImitation"; break;
            case 16: value = "isImitationOf"; break;
            case 17: value = "hasPart"; break;
            case 18: value = "isPartOf"; break;
            case 19: value = "hasRealization"; break;
            case 20: value = "isRealizationOf"; break;
            case 21: value = "hasReconfiguration"; break;
            case 22: value = "isReconfigurationOf"; break;
            case 23: value = "hasReproduction"; break;
            case 24: value = "isReproductionOf"; break;
            case 25: value = "hasRevision"; break;
            case 26: value = "isRevisionOf"; break;
            case 27: value = "hasSuccessor"; break;
            case 28: value = "isSuccessorOf"; break;
            case 29: value = "hasSummarization"; break;
            case 30: value = "isSummarizationOf"; break;
            case 31: value = "hasSupplement"; break;
            case 32: value = "isSupplementOf"; break;
            case 33: value = "hasTransformation"; break;
            case 34: value = "isTransformationOf"; break;
            case 35: value = "hasTranslation"; break;
            case 36: value = "isTranslationOf"; break;
            case 37: value = "preceding"; break;
            case 38: value = "succeeding"; break;
            case 39: value = "original"; break;
            case 40: value = "host"; break;
            case 41: value = "constituent"; break;
            case 42: value = "otherVersion"; break;
            case 43: value = "otherFormat"; break;
            case 44: value = "isReferencedBy"; break;
            case 45: value = "references"; break;
            default:
                this.logWarning("Unknown value '%d' for data.RELATIONSHIP", data);
                value = "";
                break;
        }
        return value;
  }

  StrToRelationship(value: string, logWarning: boolean = true): number {
    
        if (value == "hasAbridgement") return 1;
        if (value == "isAbridgementOf") return 2;
        if (value == "hasAdaptation") return 3;
        if (value == "isAdaptationOf") return 4;
        if (value == "hasAlternate") return 5;
        if (value == "isAlternateOf") return 6;
        if (value == "hasArrangement") return 7;
        if (value == "isArrangementOf") return 8;
        if (value == "hasComplement") return 9;
        if (value == "isComplementOf") return 10;
        if (value == "hasEmbodiment") return 11;
        if (value == "isEmbodimentOf") return 12;
        if (value == "hasExemplar") return 13;
        if (value == "isExemplarOf") return 14;
        if (value == "hasImitation") return 15;
        if (value == "isImitationOf") return 16;
        if (value == "hasPart") return 17;
        if (value == "isPartOf") return 18;
        if (value == "hasRealization") return 19;
        if (value == "isRealizationOf") return 20;
        if (value == "hasReconfiguration") return 21;
        if (value == "isReconfigurationOf") return 22;
        if (value == "hasReproduction") return 23;
        if (value == "isReproductionOf") return 24;
        if (value == "hasRevision") return 25;
        if (value == "isRevisionOf") return 26;
        if (value == "hasSuccessor") return 27;
        if (value == "isSuccessorOf") return 28;
        if (value == "hasSummarization") return 29;
        if (value == "isSummarizationOf") return 30;
        if (value == "hasSupplement") return 31;
        if (value == "isSupplementOf") return 32;
        if (value == "hasTransformation") return 33;
        if (value == "isTransformationOf") return 34;
        if (value == "hasTranslation") return 35;
        if (value == "isTranslationOf") return 36;
        if (value == "preceding") return 37;
        if (value == "succeeding") return 38;
        if (value == "original") return 39;
        if (value == "host") return 40;
        if (value == "constituent") return 41;
        if (value == "otherVersion") return 42;
        if (value == "otherFormat") return 43;
        if (value == "isReferencedBy") return 44;
        if (value == "references") return 45;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.RELATIONSHIP", value);
        return 0;
  }

  RelatorsToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "arr"; break;
            case 2: value = "aut"; break;
            case 3: value = "cmp"; break;
            case 4: value = "dte"; break;
            case 5: value = "edt"; break;
            case 6: value = "lbt"; break;
            case 7: value = "lyr"; break;
            case 8: value = "act"; break;
            case 9: value = "ard"; break;
            case 10: value = "art"; break;
            case 11: value = "aus"; break;
            case 12: value = "chr"; break;
            case 13: value = "cnd"; break;
            case 14: value = "crp"; break;
            case 15: value = "cst"; break;
            case 16: value = "drt"; break;
            case 17: value = "egr"; break;
            case 18: value = "flm"; break;
            case 19: value = "fmd"; break;
            case 20: value = "fmp"; break;
            case 21: value = "itr"; break;
            case 22: value = "mcp"; break;
            case 23: value = "mus"; break;
            case 24: value = "msd"; break;
            case 25: value = "pdr"; break;
            case 26: value = "pmn"; break;
            case 27: value = "prn"; break;
            case 28: value = "pro"; break;
            case 29: value = "rce"; break;
            case 30: value = "scr"; break;
            case 31: value = "sng"; break;
            case 32: value = "std"; break;
            case 33: value = "trc"; break;
            case 34: value = "trl"; break;
            default:
                this.logWarning("Unknown value '%d' for data.RELATORS", data);
                value = "";
                break;
        }
        return value;
  }

  StrToRelators(value: string, logWarning: boolean = true): number {
    
        if (value == "arr") return 1;
        if (value == "aut") return 2;
        if (value == "cmp") return 3;
        if (value == "dte") return 4;
        if (value == "edt") return 5;
        if (value == "lbt") return 6;
        if (value == "lyr") return 7;
        if (value == "act") return 8;
        if (value == "ard") return 9;
        if (value == "art") return 10;
        if (value == "aus") return 11;
        if (value == "chr") return 12;
        if (value == "cnd") return 13;
        if (value == "crp") return 14;
        if (value == "cst") return 15;
        if (value == "drt") return 16;
        if (value == "egr") return 17;
        if (value == "flm") return 18;
        if (value == "fmd") return 19;
        if (value == "fmp") return 20;
        if (value == "itr") return 21;
        if (value == "mcp") return 22;
        if (value == "mus") return 23;
        if (value == "msd") return 24;
        if (value == "pdr") return 25;
        if (value == "pmn") return 26;
        if (value == "prn") return 27;
        if (value == "pro") return 28;
        if (value == "rce") return 29;
        if (value == "scr") return 30;
        if (value == "sng") return 31;
        if (value == "std") return 32;
        if (value == "trc") return 33;
        if (value == "trl") return 34;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.RELATORS", value);
        return 0;
  }

  RotationToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "none"; break;
            case 2: value = "down"; break;
            case 3: value = "left"; break;
            case 4: value = "ne"; break;
            case 5: value = "nw"; break;
            case 6: value = "se"; break;
            case 7: value = "sw"; break;
            default:
                this.logWarning("Unknown value '%d' for data.ROTATION", data);
                value = "";
                break;
        }
        return value;
  }

  StrToRotation(value: string, logWarning: boolean = true): number {
    
        if (value == "none") return 1;
        if (value == "down") return 2;
        if (value == "left") return 3;
        if (value == "ne") return 4;
        if (value == "nw") return 5;
        if (value == "se") return 6;
        if (value == "sw") return 7;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.ROTATION", value);
        return 0;
  }

  RotationdirectionToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "none"; break;
            case 2: value = "down"; break;
            case 3: value = "left"; break;
            case 4: value = "ne"; break;
            case 5: value = "nw"; break;
            case 6: value = "se"; break;
            case 7: value = "sw"; break;
            default:
                this.logWarning("Unknown value '%d' for data.ROTATIONDIRECTION", data);
                value = "";
                break;
        }
        return value;
  }

  StrToRotationdirection(value: string, logWarning: boolean = true): number {
    
        if (value == "none") return 1;
        if (value == "down") return 2;
        if (value == "left") return 3;
        if (value == "ne") return 4;
        if (value == "nw") return 5;
        if (value == "se") return 6;
        if (value == "sw") return 7;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.ROTATIONDIRECTION", value);
        return 0;
  }

  StaffitemToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "accid"; break;
            case 2: value = "annot"; break;
            case 3: value = "artic"; break;
            case 4: value = "dir"; break;
            case 5: value = "dynam"; break;
            case 6: value = "harm"; break;
            case 7: value = "ornam"; break;
            case 8: value = "sp"; break;
            case 9: value = "stageDir"; break;
            case 10: value = "tempo"; break;
            case 11: value = "beam"; break;
            case 12: value = "bend"; break;
            case 13: value = "bracketSpan"; break;
            case 14: value = "breath"; break;
            case 15: value = "cpMark"; break;
            case 16: value = "fermata"; break;
            case 17: value = "fing"; break;
            case 18: value = "hairpin"; break;
            case 19: value = "harpPedal"; break;
            case 20: value = "lv"; break;
            case 21: value = "mordent"; break;
            case 22: value = "octave"; break;
            case 23: value = "pedal"; break;
            case 24: value = "reh"; break;
            case 25: value = "tie"; break;
            case 26: value = "trill"; break;
            case 27: value = "tuplet"; break;
            case 28: value = "turn"; break;
            case 29: value = "ligature"; break;
            default:
                this.logWarning("Unknown value '%d' for data.STAFFITEM", data);
                value = "";
                break;
        }
        return value;
  }

  StrToStaffitem(value: string, logWarning: boolean = true): number {
    
        if (value == "accid") return 1;
        if (value == "annot") return 2;
        if (value == "artic") return 3;
        if (value == "dir") return 4;
        if (value == "dynam") return 5;
        if (value == "harm") return 6;
        if (value == "ornam") return 7;
        if (value == "sp") return 8;
        if (value == "stageDir") return 9;
        if (value == "tempo") return 10;
        if (value == "beam") return 11;
        if (value == "bend") return 12;
        if (value == "bracketSpan") return 13;
        if (value == "breath") return 14;
        if (value == "cpMark") return 15;
        if (value == "fermata") return 16;
        if (value == "fing") return 17;
        if (value == "hairpin") return 18;
        if (value == "harpPedal") return 19;
        if (value == "lv") return 20;
        if (value == "mordent") return 21;
        if (value == "octave") return 22;
        if (value == "pedal") return 23;
        if (value == "reh") return 24;
        if (value == "tie") return 25;
        if (value == "trill") return 26;
        if (value == "tuplet") return 27;
        if (value == "turn") return 28;
        if (value == "ligature") return 29;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.STAFFITEM", value);
        return 0;
  }

  StaffitemBasicToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "accid"; break;
            case 2: value = "annot"; break;
            case 3: value = "artic"; break;
            case 4: value = "dir"; break;
            case 5: value = "dynam"; break;
            case 6: value = "harm"; break;
            case 7: value = "ornam"; break;
            case 8: value = "sp"; break;
            case 9: value = "stageDir"; break;
            case 10: value = "tempo"; break;
            default:
                this.logWarning("Unknown value '%d' for data.STAFFITEM.basic", data);
                value = "";
                break;
        }
        return value;
  }

  StrToStaffitemBasic(value: string, logWarning: boolean = true): number {
    
        if (value == "accid") return 1;
        if (value == "annot") return 2;
        if (value == "artic") return 3;
        if (value == "dir") return 4;
        if (value == "dynam") return 5;
        if (value == "harm") return 6;
        if (value == "ornam") return 7;
        if (value == "sp") return 8;
        if (value == "stageDir") return 9;
        if (value == "tempo") return 10;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.STAFFITEM.basic", value);
        return 0;
  }

  StaffitemCmnToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "beam"; break;
            case 2: value = "bend"; break;
            case 3: value = "bracketSpan"; break;
            case 4: value = "breath"; break;
            case 5: value = "cpMark"; break;
            case 6: value = "fermata"; break;
            case 7: value = "fing"; break;
            case 8: value = "hairpin"; break;
            case 9: value = "harpPedal"; break;
            case 10: value = "lv"; break;
            case 11: value = "mordent"; break;
            case 12: value = "octave"; break;
            case 13: value = "pedal"; break;
            case 14: value = "reh"; break;
            case 15: value = "tie"; break;
            case 16: value = "trill"; break;
            case 17: value = "tuplet"; break;
            case 18: value = "turn"; break;
            default:
                this.logWarning("Unknown value '%d' for data.STAFFITEM.cmn", data);
                value = "";
                break;
        }
        return value;
  }

  StrToStaffitemCmn(value: string, logWarning: boolean = true): number {
    
        if (value == "beam") return 1;
        if (value == "bend") return 2;
        if (value == "bracketSpan") return 3;
        if (value == "breath") return 4;
        if (value == "cpMark") return 5;
        if (value == "fermata") return 6;
        if (value == "fing") return 7;
        if (value == "hairpin") return 8;
        if (value == "harpPedal") return 9;
        if (value == "lv") return 10;
        if (value == "mordent") return 11;
        if (value == "octave") return 12;
        if (value == "pedal") return 13;
        if (value == "reh") return 14;
        if (value == "tie") return 15;
        if (value == "trill") return 16;
        if (value == "tuplet") return 17;
        if (value == "turn") return 18;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.STAFFITEM.cmn", value);
        return 0;
  }

  StaffitemMensuralToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "ligature"; break;
            default:
                this.logWarning("Unknown value '%d' for data.STAFFITEM.mensural", data);
                value = "";
                break;
        }
        return value;
  }

  StrToStaffitemMensural(value: string, logWarning: boolean = true): number {
    
        if (value == "ligature") return 1;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.STAFFITEM.mensural", value);
        return 0;
  }

  StaffrelToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "above"; break;
            case 2: value = "below"; break;
            case 3: value = "between"; break;
            case 4: value = "within"; break;
            default:
                this.logWarning("Unknown value '%d' for data.STAFFREL", data);
                value = "";
                break;
        }
        return value;
  }

  StrToStaffrel(value: string, logWarning: boolean = true): number {
    
        if (value == "above") return 1;
        if (value == "below") return 2;
        if (value == "between") return 3;
        if (value == "within") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.STAFFREL", value);
        return 0;
  }

  StaffrelBasicToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "above"; break;
            case 2: value = "below"; break;
            default:
                this.logWarning("Unknown value '%d' for data.STAFFREL.basic", data);
                value = "";
                break;
        }
        return value;
  }

  StrToStaffrelBasic(value: string, logWarning: boolean = true): number {
    
        if (value == "above") return 1;
        if (value == "below") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.STAFFREL.basic", value);
        return 0;
  }

  StaffrelExtendedToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "between"; break;
            case 2: value = "within"; break;
            default:
                this.logWarning("Unknown value '%d' for data.STAFFREL.extended", data);
                value = "";
                break;
        }
        return value;
  }

  StrToStaffrelExtended(value: string, logWarning: boolean = true): number {
    
        if (value == "between") return 1;
        if (value == "within") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.STAFFREL.extended", value);
        return 0;
  }

  StemdirectionToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "up"; break;
            case 2: value = "down"; break;
            case 3: value = "left"; break;
            case 4: value = "right"; break;
            case 5: value = "ne"; break;
            case 6: value = "se"; break;
            case 7: value = "nw"; break;
            case 8: value = "sw"; break;
            default:
                this.logWarning("Unknown value '%d' for data.STEMDIRECTION", data);
                value = "";
                break;
        }
        return value;
  }

  StrToStemdirection(value: string, logWarning: boolean = true): number {
    
        if (value == "up") return 1;
        if (value == "down") return 2;
        if (value == "left") return 3;
        if (value == "right") return 4;
        if (value == "ne") return 5;
        if (value == "se") return 6;
        if (value == "nw") return 7;
        if (value == "sw") return 8;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.STEMDIRECTION", value);
        return 0;
  }

  StemdirectionBasicToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "up"; break;
            case 2: value = "down"; break;
            default:
                this.logWarning("Unknown value '%d' for data.STEMDIRECTION.basic", data);
                value = "";
                break;
        }
        return value;
  }

  StrToStemdirectionBasic(value: string, logWarning: boolean = true): number {
    
        if (value == "up") return 1;
        if (value == "down") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.STEMDIRECTION.basic", value);
        return 0;
  }

  StemdirectionExtendedToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "left"; break;
            case 2: value = "right"; break;
            case 3: value = "ne"; break;
            case 4: value = "se"; break;
            case 5: value = "nw"; break;
            case 6: value = "sw"; break;
            default:
                this.logWarning("Unknown value '%d' for data.STEMDIRECTION.extended", data);
                value = "";
                break;
        }
        return value;
  }

  StrToStemdirectionExtended(value: string, logWarning: boolean = true): number {
    
        if (value == "left") return 1;
        if (value == "right") return 2;
        if (value == "ne") return 3;
        if (value == "se") return 4;
        if (value == "nw") return 5;
        if (value == "sw") return 6;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.STEMDIRECTION.extended", value);
        return 0;
  }

  StemformMensuralToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "circle"; break;
            case 2: value = "oblique"; break;
            case 3: value = "swallowtail"; break;
            case 4: value = "virgula"; break;
            default:
                this.logWarning("Unknown value '%d' for data.STEMFORM.mensural", data);
                value = "";
                break;
        }
        return value;
  }

  StrToStemformMensural(value: string, logWarning: boolean = true): number {
    
        if (value == "circle") return 1;
        if (value == "oblique") return 2;
        if (value == "swallowtail") return 3;
        if (value == "virgula") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.STEMFORM.mensural", value);
        return 0;
  }

  StemmodifierToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "none"; break;
            case 2: value = "1slash"; break;
            case 3: value = "2slash"; break;
            case 4: value = "3slash"; break;
            case 5: value = "4slash"; break;
            case 6: value = "5slash"; break;
            case 7: value = "6slash"; break;
            case 8: value = "sprech"; break;
            case 9: value = "z"; break;
            default:
                this.logWarning("Unknown value '%d' for data.STEMMODIFIER", data);
                value = "";
                break;
        }
        return value;
  }

  StrToStemmodifier(value: string, logWarning: boolean = true): number {
    
        if (value == "none") return 1;
        if (value == "1slash") return 2;
        if (value == "2slash") return 3;
        if (value == "3slash") return 4;
        if (value == "4slash") return 5;
        if (value == "5slash") return 6;
        if (value == "6slash") return 7;
        if (value == "sprech") return 8;
        if (value == "z") return 9;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.STEMMODIFIER", value);
        return 0;
  }

  StempositionToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "left"; break;
            case 2: value = "right"; break;
            case 3: value = "center"; break;
            default:
                this.logWarning("Unknown value '%d' for data.STEMPOSITION", data);
                value = "";
                break;
        }
        return value;
  }

  StrToStemposition(value: string, logWarning: boolean = true): number {
    
        if (value == "left") return 1;
        if (value == "right") return 2;
        if (value == "center") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.STEMPOSITION", value);
        return 0;
  }

  TemperamentToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "equal"; break;
            case 2: value = "just"; break;
            case 3: value = "mean"; break;
            case 4: value = "pythagorean"; break;
            default:
                this.logWarning("Unknown value '%d' for data.TEMPERAMENT", data);
                value = "";
                break;
        }
        return value;
  }

  StrToTemperament(value: string, logWarning: boolean = true): number {
    
        if (value == "equal") return 1;
        if (value == "just") return 2;
        if (value == "mean") return 3;
        if (value == "pythagorean") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.TEMPERAMENT", value);
        return 0;
  }

  TextrenditionToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "quote"; break;
            case 2: value = "quotedbl"; break;
            case 3: value = "italic"; break;
            case 4: value = "oblique"; break;
            case 5: value = "smcaps"; break;
            case 6: value = "bold"; break;
            case 7: value = "bolder"; break;
            case 8: value = "lighter"; break;
            case 9: value = "box"; break;
            case 10: value = "circle"; break;
            case 11: value = "dbox"; break;
            case 12: value = "tbox"; break;
            case 13: value = "bslash"; break;
            case 14: value = "fslash"; break;
            case 15: value = "line-through"; break;
            case 16: value = "none"; break;
            case 17: value = "overline"; break;
            case 18: value = "overstrike"; break;
            case 19: value = "strike"; break;
            case 20: value = "sub"; break;
            case 21: value = "sup"; break;
            case 22: value = "superimpose"; break;
            case 23: value = "underline"; break;
            case 24: value = "x-through"; break;
            case 25: value = "ltr"; break;
            case 26: value = "rtl"; break;
            case 27: value = "lro"; break;
            case 28: value = "rlo"; break;
            default:
                this.logWarning("Unknown value '%d' for data.TEXTRENDITION", data);
                value = "";
                break;
        }
        return value;
  }

  StrToTextrendition(value: string, logWarning: boolean = true): number {
    
        if (value == "quote") return 1;
        if (value == "quotedbl") return 2;
        if (value == "italic") return 3;
        if (value == "oblique") return 4;
        if (value == "smcaps") return 5;
        if (value == "bold") return 6;
        if (value == "bolder") return 7;
        if (value == "lighter") return 8;
        if (value == "box") return 9;
        if (value == "circle") return 10;
        if (value == "dbox") return 11;
        if (value == "tbox") return 12;
        if (value == "bslash") return 13;
        if (value == "fslash") return 14;
        if (value == "line-through") return 15;
        if (value == "none") return 16;
        if (value == "overline") return 17;
        if (value == "overstrike") return 18;
        if (value == "strike") return 19;
        if (value == "sub") return 20;
        if (value == "sup") return 21;
        if (value == "superimpose") return 22;
        if (value == "underline") return 23;
        if (value == "x-through") return 24;
        if (value == "ltr") return 25;
        if (value == "rtl") return 26;
        if (value == "lro") return 27;
        if (value == "rlo") return 28;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.TEXTRENDITION", value);
        return 0;
  }

  TextrenditionlistToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "quote"; break;
            case 2: value = "quotedbl"; break;
            case 3: value = "italic"; break;
            case 4: value = "oblique"; break;
            case 5: value = "smcaps"; break;
            case 6: value = "bold"; break;
            case 7: value = "bolder"; break;
            case 8: value = "lighter"; break;
            case 9: value = "box"; break;
            case 10: value = "circle"; break;
            case 11: value = "dbox"; break;
            case 12: value = "tbox"; break;
            case 13: value = "bslash"; break;
            case 14: value = "fslash"; break;
            case 15: value = "line-through"; break;
            case 16: value = "none"; break;
            case 17: value = "overline"; break;
            case 18: value = "overstrike"; break;
            case 19: value = "strike"; break;
            case 20: value = "sub"; break;
            case 21: value = "sup"; break;
            case 22: value = "superimpose"; break;
            case 23: value = "underline"; break;
            case 24: value = "x-through"; break;
            case 25: value = "ltr"; break;
            case 26: value = "rtl"; break;
            case 27: value = "lro"; break;
            case 28: value = "rlo"; break;
            default:
                this.logWarning("Unknown value '%d' for data.TEXTRENDITIONLIST", data);
                value = "";
                break;
        }
        return value;
  }

  StrToTextrenditionlist(value: string, logWarning: boolean = true): number {
    
        if (value == "quote") return 1;
        if (value == "quotedbl") return 2;
        if (value == "italic") return 3;
        if (value == "oblique") return 4;
        if (value == "smcaps") return 5;
        if (value == "bold") return 6;
        if (value == "bolder") return 7;
        if (value == "lighter") return 8;
        if (value == "box") return 9;
        if (value == "circle") return 10;
        if (value == "dbox") return 11;
        if (value == "tbox") return 12;
        if (value == "bslash") return 13;
        if (value == "fslash") return 14;
        if (value == "line-through") return 15;
        if (value == "none") return 16;
        if (value == "overline") return 17;
        if (value == "overstrike") return 18;
        if (value == "strike") return 19;
        if (value == "sub") return 20;
        if (value == "sup") return 21;
        if (value == "superimpose") return 22;
        if (value == "underline") return 23;
        if (value == "x-through") return 24;
        if (value == "ltr") return 25;
        if (value == "rtl") return 26;
        if (value == "lro") return 27;
        if (value == "rlo") return 28;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.TEXTRENDITIONLIST", value);
        return 0;
  }

  VerticalalignmentToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "top"; break;
            case 2: value = "middle"; break;
            case 3: value = "bottom"; break;
            case 4: value = "baseline"; break;
            default:
                this.logWarning("Unknown value '%d' for data.VERTICALALIGNMENT", data);
                value = "";
                break;
        }
        return value;
  }

  StrToVerticalalignment(value: string, logWarning: boolean = true): number {
    
        if (value == "top") return 1;
        if (value == "middle") return 2;
        if (value == "bottom") return 3;
        if (value == "baseline") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for data.VERTICALALIGNMENT", value);
        return 0;
  }

  AccidLogFuncToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "caution"; break;
            case 2: value = "edit"; break;
            default:
                this.logWarning("Unknown value '%d' for att.accid.log@func", data);
                value = "";
                break;
        }
        return value;
  }

  StrToAccidLogFunc(value: string, logWarning: boolean = true): number {
    
        if (value == "caution") return 1;
        if (value == "edit") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.accid.log@func", value);
        return 0;
  }

  AnchoredTextLogFuncToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "unknown"; break;
            default:
                this.logWarning("Unknown value '%d' for att.anchoredText.log@func", data);
                value = "";
                break;
        }
        return value;
  }

  StrToAnchoredTextLogFunc(value: string, logWarning: boolean = true): number {
    
        if (value == "unknown") return 1;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.anchoredText.log@func", value);
        return 0;
  }

  AnnotLogFuncToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "display"; break;
            default:
                this.logWarning("Unknown value '%d' for att.annot.log@func", data);
                value = "";
                break;
        }
        return value;
  }

  StrToAnnotLogFunc(value: string, logWarning: boolean = true): number {
    
        if (value == "display") return 1;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.annot.log@func", value);
        return 0;
  }

  ArpegLogOrderToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "up"; break;
            case 2: value = "down"; break;
            case 3: value = "nonarp"; break;
            default:
                this.logWarning("Unknown value '%d' for att.arpeg.log@order", data);
                value = "";
                break;
        }
        return value;
  }

  StrToArpegLogOrder(value: string, logWarning: boolean = true): number {
    
        if (value == "up") return 1;
        if (value == "down") return 2;
        if (value == "nonarp") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.arpeg.log@order", value);
        return 0;
  }

  AudienceAudienceToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "private"; break;
            case 2: value = "public"; break;
            default:
                this.logWarning("Unknown value '%d' for att.audience@audience", data);
                value = "";
                break;
        }
        return value;
  }

  StrToAudienceAudience(value: string, logWarning: boolean = true): number {
    
        if (value == "private") return 1;
        if (value == "public") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.audience@audience", value);
        return 0;
  }

  BeamRendFormToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "acc"; break;
            case 2: value = "mixed"; break;
            case 3: value = "rit"; break;
            case 4: value = "norm"; break;
            default:
                this.logWarning("Unknown value '%d' for att.beamRend@form", data);
                value = "";
                break;
        }
        return value;
  }

  StrToBeamRendForm(value: string, logWarning: boolean = true): number {
    
        if (value == "acc") return 1;
        if (value == "mixed") return 2;
        if (value == "rit") return 3;
        if (value == "norm") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.beamRend@form", value);
        return 0;
  }

  BeamingVisBeamrendToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "acc"; break;
            case 2: value = "rit"; break;
            case 3: value = "norm"; break;
            default:
                this.logWarning("Unknown value '%d' for att.beaming.vis@beam.rend", data);
                value = "";
                break;
        }
        return value;
  }

  StrToBeamingVisBeamrend(value: string, logWarning: boolean = true): number {
    
        if (value == "acc") return 1;
        if (value == "rit") return 2;
        if (value == "norm") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.beaming.vis@beam.rend", value);
        return 0;
  }

  BracketSpanLogFuncToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "coloration"; break;
            case 2: value = "cross-rhythm"; break;
            case 3: value = "ligature"; break;
            case 4: value = "analytical"; break;
            case 5: value = "phrase"; break;
            case 6: value = "uspecified"; break;
            default:
                this.logWarning("Unknown value '%d' for att.bracketSpan.log@func", data);
                value = "";
                break;
        }
        return value;
  }

  StrToBracketSpanLogFunc(value: string, logWarning: boolean = true): number {
    
        if (value == "coloration") return 1;
        if (value == "cross-rhythm") return 2;
        if (value == "ligature") return 3;
        if (value == "analytical") return 4;
        if (value == "phrase") return 5;
        if (value == "uspecified") return 6;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.bracketSpan.log@func", value);
        return 0;
  }

  CurvatureCurvedirToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "above"; break;
            case 2: value = "below"; break;
            case 3: value = "mixed"; break;
            default:
                this.logWarning("Unknown value '%d' for att.curvature@curvedir", data);
                value = "";
                break;
        }
        return value;
  }

  StrToCurvatureCurvedir(value: string, logWarning: boolean = true): number {
    
        if (value == "above") return 1;
        if (value == "below") return 2;
        if (value == "mixed") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.curvature@curvedir", value);
        return 0;
  }

  CurvatureDirectionCurveToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "a"; break;
            case 2: value = "c"; break;
            default:
                this.logWarning("Unknown value '%d' for att.curvatureDirection@curve", data);
                value = "";
                break;
        }
        return value;
  }

  StrToCurvatureDirectionCurve(value: string, logWarning: boolean = true): number {
    
        if (value == "a") return 1;
        if (value == "c") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.curvatureDirection@curve", value);
        return 0;
  }

  CurveLogFuncToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "unknown"; break;
            default:
                this.logWarning("Unknown value '%d' for att.curve.log@func", data);
                value = "";
                break;
        }
        return value;
  }

  StrToCurveLogFunc(value: string, logWarning: boolean = true): number {
    
        if (value == "unknown") return 1;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.curve.log@func", value);
        return 0;
  }

  CutoutCutoutToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "cutout"; break;
            default:
                this.logWarning("Unknown value '%d' for att.cutout@cutout", data);
                value = "";
                break;
        }
        return value;
  }

  StrToCutoutCutout(value: string, logWarning: boolean = true): number {
    
        if (value == "cutout") return 1;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.cutout@cutout", value);
        return 0;
  }

  DivLineLogFormToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "caesura"; break;
            case 2: value = "finalis"; break;
            case 3: value = "maior"; break;
            case 4: value = "maxima"; break;
            case 5: value = "minima"; break;
            case 6: value = "virgula"; break;
            default:
                this.logWarning("Unknown value '%d' for att.divLine.log@form", data);
                value = "";
                break;
        }
        return value;
  }

  StrToDivLineLogForm(value: string, logWarning: boolean = true): number {
    
        if (value == "caesura") return 1;
        if (value == "finalis") return 2;
        if (value == "maior") return 3;
        if (value == "maxima") return 4;
        if (value == "minima") return 5;
        if (value == "virgula") return 6;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.divLine.log@form", value);
        return 0;
  }

  DocStatusStatusToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "draft"; break;
            case 2: value = "in-process"; break;
            case 3: value = "candidate"; break;
            case 4: value = "approved"; break;
            case 5: value = "published"; break;
            case 6: value = "withdrawn"; break;
            case 7: value = "embargoed"; break;
            default:
                this.logWarning("Unknown value '%d' for att.docStatus@status", data);
                value = "";
                break;
        }
        return value;
  }

  StrToDocStatusStatus(value: string, logWarning: boolean = true): number {
    
        if (value == "draft") return 1;
        if (value == "in-process") return 2;
        if (value == "candidate") return 3;
        if (value == "approved") return 4;
        if (value == "published") return 5;
        if (value == "withdrawn") return 6;
        if (value == "embargoed") return 7;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.docStatus@status", value);
        return 0;
  }

  DotLogFormToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "aug"; break;
            case 2: value = "div"; break;
            default:
                this.logWarning("Unknown value '%d' for att.dot.log@form", data);
                value = "";
                break;
        }
        return value;
  }

  StrToDotLogForm(value: string, logWarning: boolean = true): number {
    
        if (value == "aug") return 1;
        if (value == "div") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.dot.log@form", value);
        return 0;
  }

  EndingsEndingrendToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "top"; break;
            case 2: value = "barred"; break;
            case 3: value = "grouped"; break;
            default:
                this.logWarning("Unknown value '%d' for att.endings@ending.rend", data);
                value = "";
                break;
        }
        return value;
  }

  StrToEndingsEndingrend(value: string, logWarning: boolean = true): number {
    
        if (value == "top") return 1;
        if (value == "barred") return 2;
        if (value == "grouped") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.endings@ending.rend", value);
        return 0;
  }

  EpisemaVisFormToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "h"; break;
            case 2: value = "v"; break;
            default:
                this.logWarning("Unknown value '%d' for att.episema.vis@form", data);
                value = "";
                break;
        }
        return value;
  }

  StrToEpisemaVisForm(value: string, logWarning: boolean = true): number {
    
        if (value == "h") return 1;
        if (value == "v") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.episema.vis@form", value);
        return 0;
  }

  EvidenceEvidenceToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "internal"; break;
            case 2: value = "external"; break;
            case 3: value = "conjecture"; break;
            default:
                this.logWarning("Unknown value '%d' for att.evidence@evidence", data);
                value = "";
                break;
        }
        return value;
  }

  StrToEvidenceEvidence(value: string, logWarning: boolean = true): number {
    
        if (value == "internal") return 1;
        if (value == "external") return 2;
        if (value == "conjecture") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.evidence@evidence", value);
        return 0;
  }

  ExtSymAuthGlyphauthToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "smufl"; break;
            default:
                this.logWarning("Unknown value '%d' for att.extSym.auth@glyph.auth", data);
                value = "";
                break;
        }
        return value;
  }

  StrToExtSymAuthGlyphauth(value: string, logWarning: boolean = true): number {
    
        if (value == "smufl") return 1;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.extSym.auth@glyph.auth", value);
        return 0;
  }

  FermataVisFormToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "inv"; break;
            case 2: value = "norm"; break;
            default:
                this.logWarning("Unknown value '%d' for att.fermata.vis@form", data);
                value = "";
                break;
        }
        return value;
  }

  StrToFermataVisForm(value: string, logWarning: boolean = true): number {
    
        if (value == "inv") return 1;
        if (value == "norm") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.fermata.vis@form", value);
        return 0;
  }

  FermataVisShapeToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "curved"; break;
            case 2: value = "square"; break;
            case 3: value = "angular"; break;
            default:
                this.logWarning("Unknown value '%d' for att.fermata.vis@shape", data);
                value = "";
                break;
        }
        return value;
  }

  StrToFermataVisShape(value: string, logWarning: boolean = true): number {
    
        if (value == "curved") return 1;
        if (value == "square") return 2;
        if (value == "angular") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.fermata.vis@shape", value);
        return 0;
  }

  FingGrpLogFormToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "alter"; break;
            case 2: value = "combi"; break;
            case 3: value = "subst"; break;
            default:
                this.logWarning("Unknown value '%d' for att.fingGrp.log@form", data);
                value = "";
                break;
        }
        return value;
  }

  StrToFingGrpLogForm(value: string, logWarning: boolean = true): number {
    
        if (value == "alter") return 1;
        if (value == "combi") return 2;
        if (value == "subst") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.fingGrp.log@form", value);
        return 0;
  }

  FingGrpVisOrientToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "horiz"; break;
            case 2: value = "vert"; break;
            default:
                this.logWarning("Unknown value '%d' for att.fingGrp.vis@orient", data);
                value = "";
                break;
        }
        return value;
  }

  StrToFingGrpVisOrient(value: string, logWarning: boolean = true): number {
    
        if (value == "horiz") return 1;
        if (value == "vert") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.fingGrp.vis@orient", value);
        return 0;
  }

  GraceGrpLogAttachToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "pre"; break;
            case 2: value = "post"; break;
            case 3: value = "unknown"; break;
            default:
                this.logWarning("Unknown value '%d' for att.graceGrp.log@attach", data);
                value = "";
                break;
        }
        return value;
  }

  StrToGraceGrpLogAttach(value: string, logWarning: boolean = true): number {
    
        if (value == "pre") return 1;
        if (value == "post") return 2;
        if (value == "unknown") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.graceGrp.log@attach", value);
        return 0;
  }

  HairpinLogFormToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "cres"; break;
            case 2: value = "dim"; break;
            default:
                this.logWarning("Unknown value '%d' for att.hairpin.log@form", data);
                value = "";
                break;
        }
        return value;
  }

  StrToHairpinLogForm(value: string, logWarning: boolean = true): number {
    
        if (value == "cres") return 1;
        if (value == "dim") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.hairpin.log@form", value);
        return 0;
  }

  HarmAnlFormToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "explicit"; break;
            case 2: value = "implied"; break;
            default:
                this.logWarning("Unknown value '%d' for att.harm.anl@form", data);
                value = "";
                break;
        }
        return value;
  }

  StrToHarmAnlForm(value: string, logWarning: boolean = true): number {
    
        if (value == "explicit") return 1;
        if (value == "implied") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.harm.anl@form", value);
        return 0;
  }

  HarmVisRendgridToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "grid"; break;
            case 2: value = "gridtext"; break;
            case 3: value = "text"; break;
            default:
                this.logWarning("Unknown value '%d' for att.harm.vis@rendgrid", data);
                value = "";
                break;
        }
        return value;
  }

  StrToHarmVisRendgrid(value: string, logWarning: boolean = true): number {
    
        if (value == "grid") return 1;
        if (value == "gridtext") return 2;
        if (value == "text") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.harm.vis@rendgrid", value);
        return 0;
  }

  LineLogFuncToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "coloration"; break;
            case 2: value = "ligature"; break;
            case 3: value = "unknown"; break;
            default:
                this.logWarning("Unknown value '%d' for att.line.log@func", data);
                value = "";
                break;
        }
        return value;
  }

  StrToLineLogFunc(value: string, logWarning: boolean = true): number {
    
        if (value == "coloration") return 1;
        if (value == "ligature") return 2;
        if (value == "unknown") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.line.log@func", value);
        return 0;
  }

  MeasurementUnitToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "byte"; break;
            case 2: value = "char"; break;
            case 3: value = "cm"; break;
            case 4: value = "deg"; break;
            case 5: value = "in"; break;
            case 6: value = "issue"; break;
            case 7: value = "ft"; break;
            case 8: value = "m"; break;
            case 9: value = "mm"; break;
            case 10: value = "page"; break;
            case 11: value = "pc"; break;
            case 12: value = "pt"; break;
            case 13: value = "px"; break;
            case 14: value = "rad"; break;
            case 15: value = "record"; break;
            case 16: value = "vol"; break;
            case 17: value = "vu"; break;
            default:
                this.logWarning("Unknown value '%d' for att.measurement@unit", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMeasurementUnit(value: string, logWarning: boolean = true): number {
    
        if (value == "byte") return 1;
        if (value == "char") return 2;
        if (value == "cm") return 3;
        if (value == "deg") return 4;
        if (value == "in") return 5;
        if (value == "issue") return 6;
        if (value == "ft") return 7;
        if (value == "m") return 8;
        if (value == "mm") return 9;
        if (value == "page") return 10;
        if (value == "pc") return 11;
        if (value == "pt") return 12;
        if (value == "px") return 13;
        if (value == "rad") return 14;
        if (value == "record") return 15;
        if (value == "vol") return 16;
        if (value == "vu") return 17;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.measurement@unit", value);
        return 0;
  }

  MeiVersionMeiversionToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "2013"; break;
            case 2: value = "3.0.0"; break;
            case 3: value = "4.0.0"; break;
            case 4: value = "4.0.1"; break;
            case 5: value = "5.0"; break;
            case 6: value = "5.1"; break;
            case 7: value = "5.0+basic"; break;
            case 8: value = "5.0+CMN"; break;
            case 9: value = "5.0+Mensural"; break;
            case 10: value = "5.0+Neumes"; break;
            case 11: value = "5.1+basic"; break;
            case 12: value = "5.1+CMN"; break;
            case 13: value = "5.1+Mensural"; break;
            case 14: value = "5.1+Neumes"; break;
            case 15: value = "6.0-dev"; break;
            case 16: value = "6.0-dev+basic"; break;
            default:
                this.logWarning("Unknown value '%d' for att.meiVersion@meiversion", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMeiVersionMeiversion(value: string, logWarning: boolean = true): number {
    
        if (value == "2013") return 1;
        if (value == "3.0.0") return 2;
        if (value == "4.0.0") return 3;
        if (value == "4.0.1") return 4;
        if (value == "5.0") return 5;
        if (value == "5.1") return 6;
        if (value == "5.0+basic") return 7;
        if (value == "5.0+CMN") return 8;
        if (value == "5.0+Mensural") return 9;
        if (value == "5.0+Neumes") return 10;
        if (value == "5.1+basic") return 11;
        if (value == "5.1+CMN") return 12;
        if (value == "5.1+Mensural") return 13;
        if (value == "5.1+Neumes") return 14;
        if (value == "6.0-dev") return 15;
        if (value == "6.0-dev+basic") return 16;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.meiVersion@meiversion", value);
        return 0;
  }

  MensurVisFormToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "horizontal"; break;
            case 2: value = "vertical"; break;
            default:
                this.logWarning("Unknown value '%d' for att.mensur.vis@form", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMensurVisForm(value: string, logWarning: boolean = true): number {
    
        if (value == "horizontal") return 1;
        if (value == "vertical") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.mensur.vis@form", value);
        return 0;
  }

  MensuralVisMensurformToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "horizontal"; break;
            case 2: value = "vertical"; break;
            default:
                this.logWarning("Unknown value '%d' for att.mensural.vis@mensur.form", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMensuralVisMensurform(value: string, logWarning: boolean = true): number {
    
        if (value == "horizontal") return 1;
        if (value == "vertical") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.mensural.vis@mensur.form", value);
        return 0;
  }

  MeterConformanceMetconToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "c"; break;
            case 2: value = "i"; break;
            case 3: value = "o"; break;
            default:
                this.logWarning("Unknown value '%d' for att.meterConformance@metcon", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMeterConformanceMetcon(value: string, logWarning: boolean = true): number {
    
        if (value == "c") return 1;
        if (value == "i") return 2;
        if (value == "o") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.meterConformance@metcon", value);
        return 0;
  }

  MeterSigGrpLogFuncToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "alternating"; break;
            case 2: value = "interchanging"; break;
            case 3: value = "mixed"; break;
            case 4: value = "other"; break;
            default:
                this.logWarning("Unknown value '%d' for att.meterSigGrp.log@func", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMeterSigGrpLogFunc(value: string, logWarning: boolean = true): number {
    
        if (value == "alternating") return 1;
        if (value == "interchanging") return 2;
        if (value == "mixed") return 3;
        if (value == "other") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.meterSigGrp.log@func", value);
        return 0;
  }

  MordentLogFormToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "lower"; break;
            case 2: value = "upper"; break;
            default:
                this.logWarning("Unknown value '%d' for att.mordent.log@form", data);
                value = "";
                break;
        }
        return value;
  }

  StrToMordentLogForm(value: string, logWarning: boolean = true): number {
    
        if (value == "lower") return 1;
        if (value == "upper") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.mordent.log@form", value);
        return 0;
  }

  NcFormConToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "g"; break;
            case 2: value = "l"; break;
            case 3: value = "e"; break;
            default:
                this.logWarning("Unknown value '%d' for att.ncForm@con", data);
                value = "";
                break;
        }
        return value;
  }

  StrToNcFormCon(value: string, logWarning: boolean = true): number {
    
        if (value == "g") return 1;
        if (value == "l") return 2;
        if (value == "e") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.ncForm@con", value);
        return 0;
  }

  NcFormRellenToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "l"; break;
            case 2: value = "s"; break;
            default:
                this.logWarning("Unknown value '%d' for att.ncForm@rellen", data);
                value = "";
                break;
        }
        return value;
  }

  StrToNcFormRellen(value: string, logWarning: boolean = true): number {
    
        if (value == "l") return 1;
        if (value == "s") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.ncForm@rellen", value);
        return 0;
  }

  NeumeTypeTypeToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "apostropha"; break;
            case 2: value = "bistropha"; break;
            case 3: value = "cephalicus"; break;
            case 4: value = "climacus"; break;
            case 5: value = "clivis"; break;
            case 6: value = "epiphonus"; break;
            case 7: value = "oriscus"; break;
            case 8: value = "pes"; break;
            case 9: value = "pessubpunctis"; break;
            case 10: value = "porrectus"; break;
            case 11: value = "porrectusflexus"; break;
            case 12: value = "pressusmaior"; break;
            case 13: value = "pressusminor"; break;
            case 14: value = "punctum"; break;
            case 15: value = "quilisma"; break;
            case 16: value = "scandicus"; break;
            case 17: value = "strophicus"; break;
            case 18: value = "torculus"; break;
            case 19: value = "torculusresupinus"; break;
            case 20: value = "tristropha"; break;
            case 21: value = "virga"; break;
            case 22: value = "virgastrata"; break;
            default:
                this.logWarning("Unknown value '%d' for att.neumeType@type", data);
                value = "";
                break;
        }
        return value;
  }

  StrToNeumeTypeType(value: string, logWarning: boolean = true): number {
    
        if (value == "apostropha") return 1;
        if (value == "bistropha") return 2;
        if (value == "cephalicus") return 3;
        if (value == "climacus") return 4;
        if (value == "clivis") return 5;
        if (value == "epiphonus") return 6;
        if (value == "oriscus") return 7;
        if (value == "pes") return 8;
        if (value == "pessubpunctis") return 9;
        if (value == "porrectus") return 10;
        if (value == "porrectusflexus") return 11;
        if (value == "pressusmaior") return 12;
        if (value == "pressusminor") return 13;
        if (value == "punctum") return 14;
        if (value == "quilisma") return 15;
        if (value == "scandicus") return 16;
        if (value == "strophicus") return 17;
        if (value == "torculus") return 18;
        if (value == "torculusresupinus") return 19;
        if (value == "tristropha") return 20;
        if (value == "virga") return 21;
        if (value == "virgastrata") return 22;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.neumeType@type", value);
        return 0;
  }

  NoteGesExtremisToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "highest"; break;
            case 2: value = "lowest"; break;
            default:
                this.logWarning("Unknown value '%d' for att.note.ges@extremis", data);
                value = "";
                break;
        }
        return value;
  }

  StrToNoteGesExtremis(value: string, logWarning: boolean = true): number {
    
        if (value == "highest") return 1;
        if (value == "lowest") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.note.ges@extremis", value);
        return 0;
  }

  NoteHeadsHeadauthToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "smufl"; break;
            default:
                this.logWarning("Unknown value '%d' for att.noteHeads@head.auth", data);
                value = "";
                break;
        }
        return value;
  }

  StrToNoteHeadsHeadauth(value: string, logWarning: boolean = true): number {
    
        if (value == "smufl") return 1;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.noteHeads@head.auth", value);
        return 0;
  }

  OctaveLogCollToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "coll"; break;
            default:
                this.logWarning("Unknown value '%d' for att.octave.log@coll", data);
                value = "";
                break;
        }
        return value;
  }

  StrToOctaveLogColl(value: string, logWarning: boolean = true): number {
    
        if (value == "coll") return 1;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.octave.log@coll", value);
        return 0;
  }

  PbVisFoliumToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "verso"; break;
            case 2: value = "recto"; break;
            default:
                this.logWarning("Unknown value '%d' for att.pb.vis@folium", data);
                value = "";
                break;
        }
        return value;
  }

  StrToPbVisFolium(value: string, logWarning: boolean = true): number {
    
        if (value == "verso") return 1;
        if (value == "recto") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.pb.vis@folium", value);
        return 0;
  }

  PedalLogDirToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "down"; break;
            case 2: value = "up"; break;
            case 3: value = "half"; break;
            case 4: value = "bounce"; break;
            default:
                this.logWarning("Unknown value '%d' for att.pedal.log@dir", data);
                value = "";
                break;
        }
        return value;
  }

  StrToPedalLogDir(value: string, logWarning: boolean = true): number {
    
        if (value == "down") return 1;
        if (value == "up") return 2;
        if (value == "half") return 3;
        if (value == "bounce") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.pedal.log@dir", value);
        return 0;
  }

  PedalLogFuncToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "sustain"; break;
            case 2: value = "soft"; break;
            case 3: value = "sostenuto"; break;
            case 4: value = "silent"; break;
            default:
                this.logWarning("Unknown value '%d' for att.pedal.log@func", data);
                value = "";
                break;
        }
        return value;
  }

  StrToPedalLogFunc(value: string, logWarning: boolean = true): number {
    
        if (value == "sustain") return 1;
        if (value == "soft") return 2;
        if (value == "sostenuto") return 3;
        if (value == "silent") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.pedal.log@func", value);
        return 0;
  }

  PointingXlinkactuateToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "onLoad"; break;
            case 2: value = "onRequest"; break;
            case 3: value = "none"; break;
            case 4: value = "other"; break;
            default:
                this.logWarning("Unknown value '%d' for att.pointing@xlink:actuate", data);
                value = "";
                break;
        }
        return value;
  }

  StrToPointingXlinkactuate(value: string, logWarning: boolean = true): number {
    
        if (value == "onLoad") return 1;
        if (value == "onRequest") return 2;
        if (value == "none") return 3;
        if (value == "other") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.pointing@xlink:actuate", value);
        return 0;
  }

  PointingXlinkshowToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "new"; break;
            case 2: value = "replace"; break;
            case 3: value = "embed"; break;
            case 4: value = "none"; break;
            case 5: value = "other"; break;
            default:
                this.logWarning("Unknown value '%d' for att.pointing@xlink:show", data);
                value = "";
                break;
        }
        return value;
  }

  StrToPointingXlinkshow(value: string, logWarning: boolean = true): number {
    
        if (value == "new") return 1;
        if (value == "replace") return 2;
        if (value == "embed") return 3;
        if (value == "none") return 4;
        if (value == "other") return 5;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.pointing@xlink:show", value);
        return 0;
  }

  RecordTypeRecordtypeToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "a"; break;
            case 2: value = "c"; break;
            case 3: value = "d"; break;
            case 4: value = "e"; break;
            case 5: value = "f"; break;
            case 6: value = "g"; break;
            case 7: value = "i"; break;
            case 8: value = "j"; break;
            case 9: value = "k"; break;
            case 10: value = "m"; break;
            case 11: value = "o"; break;
            case 12: value = "p"; break;
            case 13: value = "r"; break;
            case 14: value = "t"; break;
            default:
                this.logWarning("Unknown value '%d' for att.recordType@recordtype", data);
                value = "";
                break;
        }
        return value;
  }

  StrToRecordTypeRecordtype(value: string, logWarning: boolean = true): number {
    
        if (value == "a") return 1;
        if (value == "c") return 2;
        if (value == "d") return 3;
        if (value == "e") return 4;
        if (value == "f") return 5;
        if (value == "g") return 6;
        if (value == "i") return 7;
        if (value == "j") return 8;
        if (value == "k") return 9;
        if (value == "m") return 10;
        if (value == "o") return 11;
        if (value == "p") return 12;
        if (value == "r") return 13;
        if (value == "t") return 14;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.recordType@recordtype", value);
        return 0;
  }

  RegularMethodMethodToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "silent"; break;
            case 2: value = "markup"; break;
            default:
                this.logWarning("Unknown value '%d' for att.regularMethod@method", data);
                value = "";
                break;
        }
        return value;
  }

  StrToRegularMethodMethod(value: string, logWarning: boolean = true): number {
    
        if (value == "silent") return 1;
        if (value == "markup") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.regularMethod@method", value);
        return 0;
  }

  RehearsalRehencloseToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "box"; break;
            case 2: value = "circle"; break;
            case 3: value = "none"; break;
            default:
                this.logWarning("Unknown value '%d' for att.rehearsal@reh.enclose", data);
                value = "";
                break;
        }
        return value;
  }

  StrToRehearsalRehenclose(value: string, logWarning: boolean = true): number {
    
        if (value == "box") return 1;
        if (value == "circle") return 2;
        if (value == "none") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.rehearsal@reh.enclose", value);
        return 0;
  }

  RepeatMarkLogFuncToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "coda"; break;
            case 2: value = "segno"; break;
            case 3: value = "dalSegno"; break;
            case 4: value = "daCapo"; break;
            case 5: value = "fine"; break;
            case 6: value = "daCapoAlFine"; break;
            case 7: value = "dalSegnoAlFine"; break;
            case 8: value = "daCapoAlCoda"; break;
            case 9: value = "dalSegnoAlCoda"; break;
            case 10: value = "repeatLeft"; break;
            case 11: value = "repeatRight"; break;
            case 12: value = "repeatRightLeft"; break;
            default:
                this.logWarning("Unknown value '%d' for att.repeatMark.log@func", data);
                value = "";
                break;
        }
        return value;
  }

  StrToRepeatMarkLogFunc(value: string, logWarning: boolean = true): number {
    
        if (value == "coda") return 1;
        if (value == "segno") return 2;
        if (value == "dalSegno") return 3;
        if (value == "daCapo") return 4;
        if (value == "fine") return 5;
        if (value == "daCapoAlFine") return 6;
        if (value == "dalSegnoAlFine") return 7;
        if (value == "daCapoAlCoda") return 8;
        if (value == "dalSegnoAlCoda") return 9;
        if (value == "repeatLeft") return 10;
        if (value == "repeatRight") return 11;
        if (value == "repeatRightLeft") return 12;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.repeatMark.log@func", value);
        return 0;
  }

  SbVisFormToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "hash"; break;
            default:
                this.logWarning("Unknown value '%d' for att.sb.vis@form", data);
                value = "";
                break;
        }
        return value;
  }

  StrToSbVisForm(value: string, logWarning: boolean = true): number {
    
        if (value == "hash") return 1;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.sb.vis@form", value);
        return 0;
  }

  StaffGroupingSymSymbolToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "brace"; break;
            case 2: value = "bracket"; break;
            case 3: value = "bracketsq"; break;
            case 4: value = "line"; break;
            case 5: value = "none"; break;
            default:
                this.logWarning("Unknown value '%d' for att.staffGroupingSym@symbol", data);
                value = "";
                break;
        }
        return value;
  }

  StrToStaffGroupingSymSymbol(value: string, logWarning: boolean = true): number {
    
        if (value == "brace") return 1;
        if (value == "bracket") return 2;
        if (value == "bracketsq") return 3;
        if (value == "line") return 4;
        if (value == "none") return 5;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.staffGroupingSym@symbol", value);
        return 0;
  }

  SylLogConToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "s"; break;
            case 2: value = "d"; break;
            case 3: value = "u"; break;
            case 4: value = "t"; break;
            case 5: value = "c"; break;
            case 6: value = "v"; break;
            case 7: value = "i"; break;
            case 8: value = "b"; break;
            default:
                this.logWarning("Unknown value '%d' for att.syl.log@con", data);
                value = "";
                break;
        }
        return value;
  }

  StrToSylLogCon(value: string, logWarning: boolean = true): number {
    
        if (value == "s") return 1;
        if (value == "d") return 2;
        if (value == "u") return 3;
        if (value == "t") return 4;
        if (value == "c") return 5;
        if (value == "v") return 6;
        if (value == "i") return 7;
        if (value == "b") return 8;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.syl.log@con", value);
        return 0;
  }

  SylLogWordposToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "i"; break;
            case 2: value = "m"; break;
            case 3: value = "s"; break;
            case 4: value = "t"; break;
            default:
                this.logWarning("Unknown value '%d' for att.syl.log@wordpos", data);
                value = "";
                break;
        }
        return value;
  }

  StrToSylLogWordpos(value: string, logWarning: boolean = true): number {
    
        if (value == "i") return 1;
        if (value == "m") return 2;
        if (value == "s") return 3;
        if (value == "t") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.syl.log@wordpos", value);
        return 0;
  }

  TargetEvalEvaluateToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "all"; break;
            case 2: value = "one"; break;
            case 3: value = "none"; break;
            default:
                this.logWarning("Unknown value '%d' for att.targetEval@evaluate", data);
                value = "";
                break;
        }
        return value;
  }

  StrToTargetEvalEvaluate(value: string, logWarning: boolean = true): number {
    
        if (value == "all") return 1;
        if (value == "one") return 2;
        if (value == "none") return 3;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.targetEval@evaluate", value);
        return 0;
  }

  TempoLogFuncToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "continuous"; break;
            case 2: value = "instantaneous"; break;
            case 3: value = "metricmod"; break;
            case 4: value = "precedente"; break;
            default:
                this.logWarning("Unknown value '%d' for att.tempo.log@func", data);
                value = "";
                break;
        }
        return value;
  }

  StrToTempoLogFunc(value: string, logWarning: boolean = true): number {
    
        if (value == "continuous") return 1;
        if (value == "instantaneous") return 2;
        if (value == "metricmod") return 3;
        if (value == "precedente") return 4;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.tempo.log@func", value);
        return 0;
  }

  TremFormFormToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "meas"; break;
            case 2: value = "unmeas"; break;
            default:
                this.logWarning("Unknown value '%d' for att.tremForm@form", data);
                value = "";
                break;
        }
        return value;
  }

  StrToTremFormForm(value: string, logWarning: boolean = true): number {
    
        if (value == "meas") return 1;
        if (value == "unmeas") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.tremForm@form", value);
        return 0;
  }

  TupletVisNumformatToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "count"; break;
            case 2: value = "ratio"; break;
            default:
                this.logWarning("Unknown value '%d' for att.tuplet.vis@num.format", data);
                value = "";
                break;
        }
        return value;
  }

  StrToTupletVisNumformat(value: string, logWarning: boolean = true): number {
    
        if (value == "count") return 1;
        if (value == "ratio") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.tuplet.vis@num.format", value);
        return 0;
  }

  TurnLogFormToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "lower"; break;
            case 2: value = "upper"; break;
            default:
                this.logWarning("Unknown value '%d' for att.turn.log@form", data);
                value = "";
                break;
        }
        return value;
  }

  StrToTurnLogForm(value: string, logWarning: boolean = true): number {
    
        if (value == "lower") return 1;
        if (value == "upper") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.turn.log@form", value);
        return 0;
  }

  VoltaGroupingSymVoltasymToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "brace"; break;
            case 2: value = "bracket"; break;
            case 3: value = "bracketsq"; break;
            case 4: value = "line"; break;
            case 5: value = "none"; break;
            default:
                this.logWarning("Unknown value '%d' for att.voltaGroupingSym@voltasym", data);
                value = "";
                break;
        }
        return value;
  }

  StrToVoltaGroupingSymVoltasym(value: string, logWarning: boolean = true): number {
    
        if (value == "brace") return 1;
        if (value == "bracket") return 2;
        if (value == "bracketsq") return 3;
        if (value == "line") return 4;
        if (value == "none") return 5;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.voltaGroupingSym@voltasym", value);
        return 0;
  }

  WhitespaceXmlspaceToStr(data: number): string {
    
        let value = "";
        switch (data) {
            case 1: value = "default"; break;
            case 2: value = "preserve"; break;
            default:
                this.logWarning("Unknown value '%d' for att.whitespace@xml:space", data);
                value = "";
                break;
        }
        return value;
  }

  StrToWhitespaceXmlspace(value: string, logWarning: boolean = true): number {
    
        if (value == "default") return 1;
        if (value == "preserve") return 2;
        if (logWarning && value.length > 0)
            this.logWarning("Unsupported value '%s' for att.whitespace@xml:space", value);
        return 0;
  }

}
