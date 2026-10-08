import { LogWarning, StringFormat } from './vrv';
import { DEFINITION_FACTOR, VRV_UNSET } from './vrvdef';
import * as c from './libmei-att';
import { AttConverterBase } from './attconverter';
import {
  data_VU, data_ARTICULATION_List, data_BULGE, data_DEGREES, data_DURATION,
  data_HEXNUM, data_HEADSHAPE, data_FONTSIZE, data_LINEWIDTH, data_FONTSIZENUMERIC, data_KEYSIGNATURE,
  data_MEASUREBEAT, data_MEASUREMENTSIGNED, data_METERCOUNT_pair, MeterCountSign, data_MIDIVALUE_NAME,
  data_MIDIVALUE_PAN, data_MODUSMAIOR, data_MODUSMINOR, data_OCTAVE_DIS, data_ORIENTATION,
  data_PERCENT, data_PERCENT_LIMITED, data_PERCENT_LIMITED_SIGNED, data_PITCHNAME, data_PLACEMENT,
  data_PROLATIO, data_TEMPUS, data_TIE, xsdAnyURI_List, xsdPositiveInteger_List,
  data_ACCIDENTAL_GESTURAL, data_ACCIDENTAL_WRITTEN, data_STAFFREL, data_STAFFREL_basic,
} from './libmei-att';

export * from './libmei-att';
export { AttConverterBase } from './attconverter';
export { VRV_UNSET } from './vrvdef';

// ponytail: module tables replace per-call Map/object allocs in StrTo*.
// 061.mei calls StrToDuration ~770x + StrToPitchname ~850x during MEI load.
const DURATION_MAP = new Map<string, number>([['maxima', c.DURATION_maxima], ['longa', c.DURATION_longa], ['brevis', c.DURATION_brevis], ['semibrevis', c.DURATION_semibrevis], ['minima', c.DURATION_minima], ['semiminima', c.DURATION_semiminima], ['fusa', c.DURATION_fusa], ['semifusa', c.DURATION_semifusa], ['long', c.DURATION_long], ['breve', c.DURATION_breve], ['1', c.DURATION_1], ['2', c.DURATION_2], ['4', c.DURATION_4], ['8', c.DURATION_8], ['16', c.DURATION_16], ['32', c.DURATION_32], ['64', c.DURATION_64], ['128', c.DURATION_128], ['256', c.DURATION_256], ['512', c.DURATION_512], ['1024', c.DURATION_1024]]);
const PITCHNAME_MAP: Record<string, number> = { c: c.PITCHNAME_c, d: c.PITCHNAME_d, e: c.PITCHNAME_e, f: c.PITCHNAME_f, g: c.PITCHNAME_g, a: c.PITCHNAME_a, b: c.PITCHNAME_b };

export class Att extends AttConverterBase {  StrToStr(str:string):string{return str;}
  DblToStr(data:number):string{return String(Math.round(data*10000)/10000);}
  IntToStr(data:number):string{return StringFormat('%d',data);}
  VUToStr(data:data_VU):string{return this.DblToStr(data)+'vu';}
  StrToDbl(value:string):number{return Math.fround(Number.parseFloat(value));}
  StrToInt(value:string):number{return Number.parseInt(value,10);}
  MidichannelToStr(data:number):string{return this.IntToStr(data);}
  StrToMidichannel(value:string):number{return this.StrToInt(value);}
  MidimspbToStr(data:number):string{return this.IntToStr(data);}
  OctaveToStr(data:number):string{return this.IntToStr(data);}
  StrToOctave(value:string):number{return this.StrToInt(value);}
  StrToMidimspb(value:string):number{return this.StrToInt(value);}
  PercentLimitedToStr(data:number):string{return this.PercentToStr(data);}
  StrToVU(value:string,logWarning=true):data_VU { const test=/^[+-]?[0-9]*(\.[0-9]+)?(vu)?$/; if(!test.test(value)){if(logWarning&&value)LogWarning("Unsupported virtual unit value '%s'",value);return VRV_UNSET;} return Math.fround(Number.parseFloat(value)); }
  ArticulationListToStr(data:data_ARTICULATION_List):string{return data.map(x=>this.ArticulationToStr(x)).join(' ');}
  StrToArticulationList(value:string):data_ARTICULATION_List{return value.split(' ').map(x=>this.StrToArticulation(x));}
  BeatrptRendToStr(data:number):string { switch(data){case c.BEATRPT_REND_1:return '1';case c.BEATRPT_REND_2:return '2';case c.BEATRPT_REND_3:return '3';case c.BEATRPT_REND_4:return '4';case c.BEATRPT_REND_5:return '5';case c.BEATRPT_REND_mixed:return 'mixed';default:LogWarning("Unknown beatrpt rend '%d'",data);return '';} }
  StrToBeatrptRend(value:string,logWarning=true):number{return value==='1'?c.BEATRPT_REND_1:value==='2'?c.BEATRPT_REND_2:value==='3'?c.BEATRPT_REND_3:value==='4'?c.BEATRPT_REND_4:value==='5'?c.BEATRPT_REND_5:value==='mixed'?c.BEATRPT_REND_mixed:(logWarning&&value&&LogWarning("Unsupported beatrpt rend '%s'",value),c.BEATRPT_REND_NONE);}
  BulgeToStr(data:data_BULGE):string{return data.map(([d,o])=>`${d} ${o}`).join(' ');}
  StrToBulge(value:string,logWarning=true):data_BULGE { const e=value.split(' ').filter(Boolean); const out:data_BULGE=[]; for(let i=0;i<e.length-1;i+=2){const distance=this.StrToDbl(e[i]);const offset=this.StrToDbl(e[i+1]);if(offset<0||offset>100){if(logWarning)LogWarning("Unsupported percentage value '%f' in bulge",offset);continue;}out.push([distance,offset]);}return out; }
  DegreesToStr(data:data_DEGREES):string{return StringFormat('%f',data);}
  StrToDegrees(value:string,logWarning=true):data_DEGREES{const d=Math.fround(Number.parseFloat(value));if(d>360||d<-360){if(logWarning)LogWarning("Unsupported data.DEGREES '%s'",value);return 0;}return d;}
  DurationToStr(data:data_DURATION):string { switch(data){case c.DURATION_maxima:return'maxima';case c.DURATION_longa:return'longa';case c.DURATION_brevis:return'brevis';case c.DURATION_semibrevis:return'semibrevis';case c.DURATION_minima:return'minima';case c.DURATION_semiminima:return'semiminima';case c.DURATION_fusa:return'fusa';case c.DURATION_semifusa:return'semifusa';case c.DURATION_long:return'long';case c.DURATION_breve:return'breve';case c.DURATION_1:return'1';case c.DURATION_2:return'2';case c.DURATION_4:return'4';case c.DURATION_8:return'8';case c.DURATION_16:return'16';case c.DURATION_32:return'32';case c.DURATION_64:return'64';case c.DURATION_128:return'128';case c.DURATION_256:return'256';case c.DURATION_512:return'512';case c.DURATION_1024:return'1024';default:LogWarning("Unknown dur '%d'",data);return'4';} }
  StrToDuration(value:string):data_DURATION { const m = DURATION_MAP;if(m.has(value))return m.get(value)!;if(value.length&&value.endsWith('p')){}else LogWarning("Unknown dur '%s'",value);return c.DURATION_NONE;}
  HexnumToStr(data:data_HEXNUM):string{return `U+${Math.trunc(data).toString(16).toUpperCase().padStart(4,'0')}`;}
  StrToHexnum(value:string,logWarning=true):data_HEXNUM{let v=value;if(v.startsWith('U+')||v.startsWith('#x'))v=v.slice(2);else{if(logWarning)LogWarning("Unable to parse glyph code '%s'. Unknown prefix value.",value);return 0;}const wc=Number.parseInt(v,16);if(wc>=0xE000&&wc<=0xF8FF)return wc;if(logWarning&&v)LogWarning("Value '%s' is not in the SMuFL (private area) range",v);return 0;}
  HeadshapeToStr(data:data_HEADSHAPE):string{if(data.GetType()===c.HEADSHAPE_headShapeList)return this.HeadshapeListToStr(data.GetHeadShapeList());if(data.GetType()===c.HEADSHAPE_hexnum)return this.HexnumToStr(data.GetHexnum());return '';}
  StrToHeadshape(value:string,logWarning=true):data_HEADSHAPE{const d=new data_HEADSHAPE();d.SetHeadShapeList(this.StrToHeadshapeList(value,false));if(d.HasValue())return d;d.SetHexnum(this.StrToHexnum(value,false));if(d.HasValue())return d;if(logWarning&&value)LogWarning("Unsupported data.HEADSHAPE '%s'",value);return d;}
  FontsizeToStr(data:data_FONTSIZE):string{if(data.GetType()===c.FONTSIZE_fontSizeNumeric)return StringFormat('%f%s',data.GetFontSizeNumeric(),data.GetFontSizeNumericType()===c.FONTSIZENUMERIC_vu?'vu':'pt');if(data.GetType()===c.FONTSIZE_term)return this.FontsizetermToStr(data.GetTerm());if(data.GetType()===c.FONTSIZE_percent)return this.PercentToStr(data.GetPercent());return '';}
  StrToFontsize(value:string,logWarning=true):data_FONTSIZE{const d=new data_FONTSIZE();const pt=this.StrToFontsizenumeric(value,false);if(pt!==VRV_UNSET){d.SetFontSizeNumeric(pt,c.FONTSIZENUMERIC_pt);return d;}if(/([0-9]+(\.[0-9]+)?|\.[0-9]+)vu$/.test(value)){const vu=Math.fround(Number.parseFloat(value));if(vu>0){d.SetFontSizeNumeric(vu,c.FONTSIZENUMERIC_vu);return d;}}d.SetTerm(this.StrToFontsizeterm(value,false));if(d.HasValue())return d;d.SetPercent(this.StrToPercent(value,false));if(d.HasValue())return d;if(logWarning&&value)LogWarning("Unsupported data.FONTSIZE '%s'",value);return d;}
  LinewidthToStr(data:data_LINEWIDTH):string{if(data.GetType()===c.LINEWIDTHTYPE_lineWidthTerm)return this.LinewidthtermToStr(data.GetLineWithTerm());if(data.GetType()===c.LINEWIDTHTYPE_measurementunsigned)return this.MeasurementunsignedToStr(data.GetMeasurementunsigned() as any);return '';}
  StrToLinewidth(value:string,logWarning=true):data_LINEWIDTH{const d=new data_LINEWIDTH();d.SetLineWidthTerm(this.StrToLinewidthterm(value,false));if(d.HasValue())return d;d.SetMeasurementunsigned(this.StrToMeasurementunsigned(value) as any);if(d.HasValue())return d;if(logWarning&&value)LogWarning("Unsupported data.LINEWIDTH '%s'",value);return d;}
  FontsizenumericToStr(data:data_FONTSIZENUMERIC):string{return StringFormat('%.2fpt',data);}
  StrToFontsizenumeric(value:string,logWarning=true):data_FONTSIZENUMERIC{if(!/([0-9]+(\.[0-9]+)?|\.[0-9]+)pt$/.test(value)){if(logWarning&&value)LogWarning("Unsupported data.FONTSIZENUMERIC '%s'",value);return VRV_UNSET;}const n=Math.fround(Number.parseFloat(value));if(n<=0){if(logWarning)LogWarning("Unsupported data.FONTSIZENUMERIC '%s'",value);return VRV_UNSET;}return n;}
  KeysignatureToStr(data:data_KEYSIGNATURE):string{if(data[0]===VRV_UNSET)return'mixed';if(data[0]===0)return'0';if(data[0]!==-1)return StringFormat('%d%s',data[0],this.AccidentalWrittenToStr(data[1]));return '';}
  StrToKeysignature(value:string,logWarning=true):data_KEYSIGNATURE{if(!/^(mixed|0|([1-9]|1[0-2])[fs])$/.test(value)){if(logWarning)LogWarning("Unsupported data.KEYSIGNATURE '%s'",value);return[-1,c.ACCIDENTAL_WRITTEN_NONE];}if(value==='mixed')return[VRV_UNSET,c.ACCIDENTAL_WRITTEN_NONE];if(value!=='0')return[Number.parseInt(value,10),value[1]==='s'?c.ACCIDENTAL_WRITTEN_s:c.ACCIDENTAL_WRITTEN_f];return[0,c.ACCIDENTAL_WRITTEN_n];}
  MeasurebeatToStr(data:data_MEASUREBEAT):string{return `${data[0]}m+${Math.round(data[1]*10000)/10000}`;}
  StrToMeasurebeat(value:string):data_MEASUREBEAT{value=value.replace(/\s/g,'');const m=value.indexOf('m');const plus=value.lastIndexOf('+');const measure=m!==-1?Number.parseInt(value.slice(0,m),10):0;const time=plus!==-1?Math.fround(Number.parseFloat(value.slice(plus))):Math.fround(Number.parseFloat(value));return[measure,time];}
  MeasurementsignedToStr(data:data_MEASUREMENTSIGNED):string{if(data.GetType()===c.MEASUREMENTTYPE_px)return StringFormat('%dpx',data.GetPx()/DEFINITION_FACTOR);if(data.GetType()===c.MEASUREMENTTYPE_vu)return this.VUToStr(data.GetVu());return '';}
  StrToMeasurementsigned(value:string,logWarning=true):data_MEASUREMENTSIGNED{const d=new data_MEASUREMENTSIGNED();if(/^[+-]?[0-9]*(\.[0-9]+)?px$/.test(value))d.SetPx(Number.parseInt(value,10)*DEFINITION_FACTOR);else if(/^[+-]?[0-9]*(\.[0-9]+)?(vu)?$/.test(value))d.SetVu(Math.fround(Number.parseFloat(value)));if(logWarning&&value&&!d.HasValue())LogWarning("Unsupported data.MEASUREMENTSIGNED '%s'",value);return d;}
  MetercountPairToStr(data:data_METERCOUNT_pair):string{const [nums,sign]=data;const sep:Record<number,string>={[MeterCountSign.None]:'',[MeterCountSign.Slash]:'/',[MeterCountSign.Minus]:'-',[MeterCountSign.Asterisk]:'*',[MeterCountSign.Plus]:'+'};return nums.map(String).join(sep[sign]??'');}
  StrToMetercountPair(value:string):data_METERCOUNT_pair{const tokens=value.split(/[\*+\/-]/);let sign=MeterCountSign.None;const p=value.search(/[+\-*\/]/);if(p!==-1)sign=value[p]==='/'?MeterCountSign.Slash:value[p]==='*'?MeterCountSign.Asterisk:value[p]==='+'?MeterCountSign.Plus:MeterCountSign.Minus;return[tokens.map(x=>Number.parseInt(x,10)),sign];}
  MidivalueNameToStr(data:data_MIDIVALUE_NAME):string{if(data.GetType()===c.MIDIVALUENAMETYPE_midivalue)return this.MidivalueToStr(data.GetMidivalue());if(data.GetType()===c.MIDIVALUENAMETYPE_mcname)return this.NcnameToStr(data.GetNcname());return '';}
  StrToMidivalueName(value:string,logWarning=true):data_MIDIVALUE_NAME{const d=new data_MIDIVALUE_NAME();d.SetMidivalue(this.StrToMidivalue(value));if(d.HasValue())return d;d.SetNcname(this.StrToNcname(value));if(d.HasValue())return d;if(logWarning&&value)LogWarning("Unsupported data.MIDIVALUE_NAME '%s'",value);return d;}
  MidivaluePanToStr(data:data_MIDIVALUE_PAN):string{if(data.GetType()===c.MIDIVALUEPANTYPE_midivalue)return this.MidivalueToStr(data.GetMidivalue());if(data.GetType()===c.MIDIVALUEPANTYPE_percentLimitedSigned)return this.PercentLimitedSignedToStr(data.GetPercentLimitedSigned());return '';}
  StrToMidivaluePan(value:string,logWarning=true):data_MIDIVALUE_PAN{const d=new data_MIDIVALUE_PAN();d.SetMidivalue(this.StrToMidivalue(value));if(d.HasValue())return d;d.SetPercentLimitedSigned(this.StrToPercentLimitedSigned(value));if(d.HasValue())return d;if(logWarning&&value)LogWarning("Unsupported data.MIDIVALUE_PAN '%s'",value);return d;}
  ModusmaiorToStr(data:data_MODUSMAIOR):string{return data===c.MODUSMAIOR_2?'2':data===c.MODUSMAIOR_3?'3':(LogWarning("Unknown modusmaior '%d'",data), '');}
  StrToModusmaior(value:string,logWarning=true):data_MODUSMAIOR{if(value==='2')return c.MODUSMAIOR_2;if(value==='3')return c.MODUSMAIOR_3;if(logWarning&&value)LogWarning("Unsupported data.MODUSMAIOR '%s'",value);return c.MODUSMAIOR_NONE;}
  ModusminorToStr(data:data_MODUSMINOR):string{return data===c.MODUSMINOR_2?'2':data===c.MODUSMINOR_3?'3':(LogWarning("Unknown modusminor '%d'",data), '');}
  StrToModusminor(value:string,logWarning=true):data_MODUSMINOR{if(value==='2')return c.MODUSMINOR_2;if(value==='3')return c.MODUSMINOR_3;if(logWarning&&value)LogWarning("Unsupported data.MODUSMINOR '%s'",value);return c.MODUSMINOR_NONE;}
  OctaveDisToStr(data:data_OCTAVE_DIS):string{return data===c.OCTAVE_DIS_8?'8':data===c.OCTAVE_DIS_15?'15':data===c.OCTAVE_DIS_22?'22':(LogWarning("Unknown octave dis '%d'",data),'');}
  StrToOctaveDis(value:string,logWarning=true):data_OCTAVE_DIS{if(value==='8')return c.OCTAVE_DIS_8;if(value==='15')return c.OCTAVE_DIS_15;if(value==='22')return c.OCTAVE_DIS_22;if(logWarning&&value)LogWarning("Unsupported data.OCTAVE.DIS '%s'",value);return c.OCTAVE_DIS_NONE;}
  OrientationToStr(data:data_ORIENTATION):string{return data===c.ORIENTATION_reversed?'reversed':data===c.ORIENTATION_90CW?'90CW':data===c.ORIENTATION_90CCW?'90CCW':(LogWarning("Unknown orientation '%d'",data),'');}
  StrToOrientation(value:string,logWarning=true):data_ORIENTATION{if(value==='reversed')return c.ORIENTATION_reversed;if(value==='90CW')return c.ORIENTATION_90CW;if(value==='90CCW')return c.ORIENTATION_90CCW;if(logWarning&&value)LogWarning("Unsupported data.ORIENTATION '%s'",value);return c.ORIENTATION_NONE;}
  PercentToStr(data:data_PERCENT):string{return this.DblToStr(data)+'%';}
  StrToPercent(value:string,logWarning=true):data_PERCENT{if(!/^[0-9]+(\.?[0-9]*)?%$/.test(value)){if(logWarning)LogWarning("Unsupported data.PERCENT '%s'",value);return 0;}return Math.fround(Number.parseFloat(value));}
  StrToPercentLimited(value:string,logWarning=true):data_PERCENT_LIMITED{if(!/^[0-9]+(\.?[0-9]*)?%$/.test(value)){if(logWarning)LogWarning("Unsupported data.PERCENT.LIMITED '%s'",value);return 0;}return Math.fround(Number.parseFloat(value));}
  StrToPercentLimitedSigned(value:string,logWarning=true):data_PERCENT_LIMITED_SIGNED{if(!/^[+-]?[0-9]+(\.?[0-9]*)?%$/.test(value)){if(logWarning)LogWarning("Unsupported data.PERCENT.LIMITED.SIGNED '%s'",value);return 0;}return Math.fround(Number.parseFloat(value));}
  PitchnameToStr(data:data_PITCHNAME):string{return data===c.PITCHNAME_c?'c':data===c.PITCHNAME_d?'d':data===c.PITCHNAME_e?'e':data===c.PITCHNAME_f?'f':data===c.PITCHNAME_g?'g':data===c.PITCHNAME_a?'a':data===c.PITCHNAME_b?'b':(LogWarning("Unknown pitch name '%d'",data),'');}
  StrToPitchname(value:string,logWarning=true):data_PITCHNAME{if(value in PITCHNAME_MAP)return PITCHNAME_MAP[value];if(logWarning&&value)LogWarning("Unsupported data.PITCHNAME '%s'",value);return c.PITCHNAME_NONE;}
  PlacementToStr(data:data_PLACEMENT):string{if(data.GetType()===c.PLACEMENT_staffRel)return this.StaffrelToStr(data.GetStaffRel());if(data.GetType()===c.PLACEMENT_nonStaffPlace)return this.NonstaffplaceToStr(data.GetNonStaffPlace());if(data.GetType()===c.PLACEMENT_nmtoken)return data.GetNMToken();return '';}
  StrToPlacement(value:string,logWarning=true):data_PLACEMENT{const d=new data_PLACEMENT();d.SetStaffRel(this.StrToStaffrel(value,false));if(d.HasValue())return d;d.SetNonStaffPlace(this.StrToNonstaffplace(value,false));if(d.HasValue())return d;d.SetNMToken(value);if(d.HasValue())return d;if(logWarning&&value)LogWarning("Unsupported data.PLACEMENT '%s'",value);return d;}
  ProlatioToStr(data:data_PROLATIO):string{return data===c.PROLATIO_2?'2':data===c.PROLATIO_3?'3':(LogWarning("Unknown prolatio '%d'",data),'');}
  StrToProlatio(value:string,logWarning=true):data_PROLATIO{if(value==='2')return c.PROLATIO_2;if(value==='3')return c.PROLATIO_3;if(logWarning&&value)LogWarning("Unsupported data.PROLATIO '%s'",value);return c.PROLATIO_NONE;}
  TempusToStr(data:data_TEMPUS):string{return data===c.TEMPUS_2?'2':data===c.TEMPUS_3?'3':(LogWarning("Unknown tempus '%d'",data),'');}
  StrToTempus(value:string,logWarning=true):data_TEMPUS{if(value==='2')return c.TEMPUS_2;if(value==='3')return c.TEMPUS_3;if(logWarning&&value)LogWarning("Unsupported data.TEMPUS '%s'",value);return c.TEMPUS_NONE;}
  TieToStr(data:data_TIE):string{return data===c.TIE_i?'i':data===c.TIE_m?'m':data===c.TIE_t?'t':(LogWarning("Unknown tie '%d'",data),'');}
  StrToTie(value:string,logWarning=true):data_TIE{if(value==='i')return c.TIE_i;if(value==='m')return c.TIE_m;if(value==='t')return c.TIE_t;if(logWarning&&value)LogWarning("Unsupported data.TIE '%s'",value);return c.TIE_NONE;}
  XsdAnyURIListToStr(data:xsdAnyURI_List):string{return data.join(' ');}
  StrToXsdAnyURIList(value:string):xsdAnyURI_List{return value.split(' ');}
  XsdPositiveIntegerListToStr(data:xsdPositiveInteger_List):string{return data.join(' ');}
  StrToXsdPositiveIntegerList(value:string):xsdPositiveInteger_List{return value.split(' ').map(x=>Number.parseInt(x,10));}
  static AccidentalGesturalToWritten(accidGes:data_ACCIDENTAL_GESTURAL):data_ACCIDENTAL_WRITTEN{switch(accidGes){case c.ACCIDENTAL_GESTURAL_s:return c.ACCIDENTAL_WRITTEN_s;case c.ACCIDENTAL_GESTURAL_f:return c.ACCIDENTAL_WRITTEN_f;case c.ACCIDENTAL_GESTURAL_ss:return c.ACCIDENTAL_WRITTEN_ss;case c.ACCIDENTAL_GESTURAL_ff:return c.ACCIDENTAL_WRITTEN_ff;case c.ACCIDENTAL_GESTURAL_n:return c.ACCIDENTAL_WRITTEN_n;case c.ACCIDENTAL_GESTURAL_su:return c.ACCIDENTAL_WRITTEN_su;case c.ACCIDENTAL_GESTURAL_sd:return c.ACCIDENTAL_WRITTEN_sd;case c.ACCIDENTAL_GESTURAL_fu:return c.ACCIDENTAL_WRITTEN_fu;case c.ACCIDENTAL_GESTURAL_fd:return c.ACCIDENTAL_WRITTEN_fd;default:return c.ACCIDENTAL_WRITTEN_NONE;}}
  static AccidentalWrittenToGestural(accid:data_ACCIDENTAL_WRITTEN):data_ACCIDENTAL_GESTURAL{switch(accid){case c.ACCIDENTAL_WRITTEN_s:return c.ACCIDENTAL_GESTURAL_s;case c.ACCIDENTAL_WRITTEN_f:return c.ACCIDENTAL_GESTURAL_f;case c.ACCIDENTAL_WRITTEN_ss:case c.ACCIDENTAL_WRITTEN_x:return c.ACCIDENTAL_GESTURAL_ss;case c.ACCIDENTAL_WRITTEN_ff:return c.ACCIDENTAL_GESTURAL_ff;case c.ACCIDENTAL_WRITTEN_xs:case c.ACCIDENTAL_WRITTEN_sx:case c.ACCIDENTAL_WRITTEN_ts:return c.ACCIDENTAL_GESTURAL_ss;case c.ACCIDENTAL_WRITTEN_tf:return c.ACCIDENTAL_GESTURAL_ff;case c.ACCIDENTAL_WRITTEN_n:return c.ACCIDENTAL_GESTURAL_n;case c.ACCIDENTAL_WRITTEN_nf:return c.ACCIDENTAL_GESTURAL_f;case c.ACCIDENTAL_WRITTEN_ns:return c.ACCIDENTAL_GESTURAL_s;case c.ACCIDENTAL_WRITTEN_su:return c.ACCIDENTAL_GESTURAL_su;case c.ACCIDENTAL_WRITTEN_sd:return c.ACCIDENTAL_GESTURAL_sd;case c.ACCIDENTAL_WRITTEN_fu:return c.ACCIDENTAL_GESTURAL_fu;case c.ACCIDENTAL_WRITTEN_fd:return c.ACCIDENTAL_GESTURAL_fd;case c.ACCIDENTAL_WRITTEN_nu:case c.ACCIDENTAL_WRITTEN_nd:return c.ACCIDENTAL_GESTURAL_n;case c.ACCIDENTAL_WRITTEN_1qf:return c.ACCIDENTAL_GESTURAL_fu;case c.ACCIDENTAL_WRITTEN_3qf:return c.ACCIDENTAL_GESTURAL_fd;case c.ACCIDENTAL_WRITTEN_1qs:return c.ACCIDENTAL_GESTURAL_su;case c.ACCIDENTAL_WRITTEN_3qs:return c.ACCIDENTAL_GESTURAL_sd;default:return c.ACCIDENTAL_GESTURAL_NONE;}}
  static StaffrelBasicToStaffrel(staffrelBasic:data_STAFFREL_basic):data_STAFFREL{return staffrelBasic===c.STAFFREL_basic_above?c.STAFFREL_above:staffrelBasic===c.STAFFREL_basic_below?c.STAFFREL_below:c.STAFFREL_NONE;}
  static StaffrelToStaffrelBasic(staffrel:data_STAFFREL):data_STAFFREL_basic{return staffrel===c.STAFFREL_above?c.STAFFREL_basic_above:staffrel===c.STAFFREL_below?c.STAFFREL_basic_below:c.STAFFREL_basic_NONE;}

  // These inherited generated-libmei methods remain explicit mock boundaries.
  MeasurementunsignedToStr(data:any):string{return this.MeasurementsignedToStr(data);}
  StrToMeasurementunsigned(value:string,logWarning=true):any{return this.StrToMeasurementsigned(value,logWarning);}
  MidivalueToStr(data:number):string{return this.IntToStr(data);}
  StrToMidivalue(value:string):number{return this.StrToInt(value);}
  NcnameToStr(data:string):string{return data;}
  StrToNcname(value:string):string{return value;}
  PercentLimitedSignedToStr(data:number):string{return this.PercentToStr(data);}
}
