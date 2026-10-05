/** Faithful TypeScript port of Verovio src/transposition.cpp. No WASM/native dependency. */

export const INVALID_INTERVAL_CLASS = -123456789;
export const dpc_C = 0, dpc_D = 1, dpc_E = 2, dpc_F = 3, dpc_G = 4, dpc_A = 5, dpc_B = 6;
export type data_PITCHNAME = number;
export type data_ACCIDENTAL_GESTURAL = number;
export type data_ACCIDENTAL_GESTURAL_basic = number;
export type data_ACCIDENTAL_WRITTEN = number;
export const PITCHNAME_c = 1; // libmei data_PITCHNAME ordinal; TransPitch.m_pname keeps the C=0 diatonic convention
// Canonical data_ACCIDENTAL_GESTURAL ordinals (libmei/dist/atttypes.h):
// NONE=0, s, f, ss, ff, ts, tf, n, su, sd, fu, fd, xu, ffd, bms, kms, bs, ks, kf, ...
export const ACCIDENTAL_GESTURAL_s=1, ACCIDENTAL_GESTURAL_f=2, ACCIDENTAL_GESTURAL_ss=3, ACCIDENTAL_GESTURAL_ff=4, ACCIDENTAL_GESTURAL_ts=5, ACCIDENTAL_GESTURAL_tf=6, ACCIDENTAL_GESTURAL_n=7, ACCIDENTAL_GESTURAL_NONE=0;
// Canonical data_ACCIDENTAL_GESTURAL_basic ordinals (libmei/dist/atttypes.h):
export const ACCIDENTAL_GESTURAL_basic_s=1, ACCIDENTAL_GESTURAL_basic_f=2, ACCIDENTAL_GESTURAL_basic_ss=3, ACCIDENTAL_GESTURAL_basic_ff=4, ACCIDENTAL_GESTURAL_basic_ts=5, ACCIDENTAL_GESTURAL_basic_tf=6, ACCIDENTAL_GESTURAL_basic_n=7, ACCIDENTAL_GESTURAL_basic_NONE=0;
// Canonical data_ACCIDENTAL_WRITTEN ordinals (libmei/dist/atttypes.h) — kept in sync with accid.ts.
export const ACCIDENTAL_WRITTEN_s=1, ACCIDENTAL_WRITTEN_f=2, ACCIDENTAL_WRITTEN_ss=3, ACCIDENTAL_WRITTEN_x=4, ACCIDENTAL_WRITTEN_ff=5, ACCIDENTAL_WRITTEN_xs=6, ACCIDENTAL_WRITTEN_sx=7, ACCIDENTAL_WRITTEN_ts=8, ACCIDENTAL_WRITTEN_tf=9, ACCIDENTAL_WRITTEN_n=10, ACCIDENTAL_WRITTEN_nf=11, ACCIDENTAL_WRITTEN_ns=12, ACCIDENTAL_WRITTEN_NONE=0;
export const UNICODE_FLAT='♭', UNICODE_SHARP='♯', UNICODE_DOUBLE_FLAT='𝄫', UNICODE_DOUBLE_SHARP='𝄪';
const warn=(m:string,...a:unknown[])=>console.warn(m,...a), err=(m:string,...a:unknown[])=>console.error(m,...a);

export class TransPitch {
  m_pname=0; m_accid=0; m_oct=0;
  constructor(aPname?: number|data_PITCHNAME, anAccid?: number|data_ACCIDENTAL_GESTURAL_basic, anOct?: number|data_ACCIDENTAL_WRITTEN, oct?: number){
    if(arguments.length===3) this.SetPitch(aPname as number, anAccid as number, anOct as number);
    else if(arguments.length===4) this.SetPitch((aPname as number)-PITCHNAME_c, TransPitch.GetChromaticAlteration(anAccid as number, anOct as number), oct!);
  }
  static copy(p:TransPitch){ return new TransPitch(p.m_pname,p.m_accid,p.m_oct); }
  static GetChromaticAlteration(g:number,w:number){
    const gm=new Map([[ACCIDENTAL_GESTURAL_tf,-3],[ACCIDENTAL_GESTURAL_ff,-2],[ACCIDENTAL_GESTURAL_f,-1],[ACCIDENTAL_GESTURAL_n,0],[ACCIDENTAL_GESTURAL_s,1],[ACCIDENTAL_GESTURAL_ss,2],[ACCIDENTAL_GESTURAL_ts,3]]);
    if(gm.has(g)) return gm.get(g)!;
    const wm=new Map([[ACCIDENTAL_WRITTEN_tf,-3],[ACCIDENTAL_WRITTEN_ff,-2],[ACCIDENTAL_WRITTEN_f,-1],[ACCIDENTAL_WRITTEN_nf,-1],[ACCIDENTAL_WRITTEN_n,0],[ACCIDENTAL_WRITTEN_ns,1],[ACCIDENTAL_WRITTEN_s,1],[ACCIDENTAL_WRITTEN_ss,2],[ACCIDENTAL_WRITTEN_x,2],[ACCIDENTAL_WRITTEN_xs,3],[ACCIDENTAL_WRITTEN_sx,3],[ACCIDENTAL_WRITTEN_ts,3]]);
    return wm.get(w) ?? 0;
  }
  GetAccidGesBasic(){return ([-3, -2,-1,0,1,2,3].includes(this.m_accid)?this.m_accid+3:ACCIDENTAL_GESTURAL_basic_NONE)}
  GetAccidGes(){return [-3,-2,-1,0,1,2,3].includes(this.m_accid)?this.m_accid+3:ACCIDENTAL_GESTURAL_NONE}
  GetAccidWritten(){return this.m_accid===-3?ACCIDENTAL_WRITTEN_tf:this.m_accid===-2?ACCIDENTAL_WRITTEN_ff:this.m_accid===-1?ACCIDENTAL_WRITTEN_f:this.m_accid===0?ACCIDENTAL_WRITTEN_n:this.m_accid===1?ACCIDENTAL_WRITTEN_s:this.m_accid===2?ACCIDENTAL_WRITTEN_x:this.m_accid===3?ACCIDENTAL_WRITTEN_xs:ACCIDENTAL_WRITTEN_NONE}
  GetPitchName(){return this.m_pname+PITCHNAME_c}
  GetPitchString(){const L='CDEFGAB'[this.m_pname]??'X'; const a=this.m_accid===-2?UNICODE_DOUBLE_FLAT:this.m_accid===-1?UNICODE_FLAT:this.m_accid===1?UNICODE_SHARP:this.m_accid===2?UNICODE_DOUBLE_SHARP:this.m_accid===0?'':null; if(a===null){err('Transposition: Could not get Accidental for %i',this.m_accid);return ''} return L+a}
  GetSimplePitchString(){const L='CDEFGAB'[this.m_pname]??'X'; const a=this.m_accid===-2?'-double-flat':this.m_accid===-1?'-flat':this.m_accid===1?'-sharp':this.m_accid===2?'-double-sharp':this.m_accid===0?'':null; if(a===null){err('Transposition: Could not get Accidental for %i',this.m_accid);return ''} return L+a}
  IsValid(maxAccid:number){return Math.abs(this.m_accid)<=Math.abs(maxAccid)}
  SetPitch(p:number,a:number,o:number){this.m_pname=p;this.m_accid=a;this.m_oct=o}
  copyFrom(p:TransPitch){this.m_pname=p.m_pname;this.m_accid=p.m_accid;this.m_oct=p.m_oct;return this}
  gt(p:TransPitch){return this.m_oct>p.m_oct || (this.m_oct===p.m_oct&&this.m_pname>p.m_pname)}
  lt(p:TransPitch){return this.m_oct<p.m_oct || (this.m_oct===p.m_oct&&this.m_pname<p.m_pname)}
  increment(){if(this.m_pname!==dpc_B)this.m_pname++;else{this.m_pname=dpc_C;this.m_oct++}return this}
  decrement(){if(this.m_pname!==dpc_C)this.m_pname--;else{this.m_pname=dpc_B;this.m_oct--}return this}
}

export class Transposer {
  protected m_base=40; protected m_maxAccid=2; protected m_transpose=0;
  protected m_diatonicMapping:number[]=[]; protected readonly m_diatonic2semitone=[0,2,4,5,7,9,11];
  constructor(){this.SetMaxAccid(2)}
  SetMaxAccid(maxAccid:number){this.m_maxAccid=Math.abs(maxAccid);this.m_base=7*(2*this.m_maxAccid+1)+5;this.CalculateDiatonicMapping();this.m_transpose=0}
  GetMaxAccid(){return this.m_maxAccid} GetBase(){return this.m_base}
  SetBase40(){this.SetMaxAccid(2)} SetBase600(){this.SetMaxAccid(42)}
  SetBase(base: number) { this.m_base = base; }
  CalculateDiatonicMaping() { this.CalculateDiatonicMapping(); }
  IsValidKeyTonicName(n: string) { return this.IsValidKeyTonic(n); }
  octaveClass() { return this.PerfectOctaveClass(); }
  SemitonesToIntervalName(keyFifths: number, semitones: number): string {
    const intervalClass = this.SemitonesToIntervalClass(keyFifths, semitones);
    return this.GetIntervalName(intervalClass);
  }
  GetCPitchClass(){return this.m_diatonicMapping[0]} GetDPitchClass(){return this.m_diatonicMapping[1]} GetEPitchClass(){return this.m_diatonicMapping[2]} GetFPitchClass(){return this.m_diatonicMapping[3]} GetGPitchClass(){return this.m_diatonicMapping[4]} GetAPitchClass(){return this.m_diatonicMapping[5]} GetBPitchClass(){return this.m_diatonicMapping[6]}
  private CalculateDiatonicMapping(){const m2=this.m_maxAccid*2+1,M2=m2+1;this.m_diatonicMapping=[this.m_maxAccid];this.m_diatonicMapping[1]=this.m_diatonicMapping[0]+M2;this.m_diatonicMapping[2]=this.m_diatonicMapping[1]+M2;this.m_diatonicMapping[3]=this.m_diatonicMapping[2]+m2;this.m_diatonicMapping[4]=this.m_diatonicMapping[3]+M2;this.m_diatonicMapping[5]=this.m_diatonicMapping[4]+M2;this.m_diatonicMapping[6]=this.m_diatonicMapping[5]+M2}
  SetTransposition(v:number):boolean;
  SetTransposition(v:string):boolean;
  SetTransposition(from:TransPitch,toString:string):boolean;
  SetTransposition(v:number|string|TransPitch,toString?:string):boolean {
    if(v instanceof TransPitch){ return toString !== undefined && this.SetTranspositionFromPitches(v,toString); }
    if(typeof v==='number'){ this.m_transpose=v; return true; }
    this.m_transpose=this.GetInterval(v); return this.m_transpose!==INVALID_INTERVAL_CLASS;
  }
  private SetTranspositionFromPitch(from:TransPitch|number,to:string){ if(typeof from==='number') return false; return this.SetTranspositionFromPitches(from,to); }
  SetTranspositionFromPitches(from:TransPitch,to:string){const tp=new TransPitch();if(!this.GetKeyTonic(to,tp))return false;const n=tp.m_oct;this.m_transpose=this.GetInterval(from,tp);if(n>0&&this.m_transpose>this.PerfectOctaveClass()*n)this.m_transpose-=this.PerfectOctaveClass();else if(n<0&&this.m_transpose<this.PerfectOctaveClass()*n)this.m_transpose+=this.PerfectOctaveClass();else if(n===0&&this.m_transpose>this.PerfectOctaveClass()/2)this.m_transpose-=this.PerfectOctaveClass();else if(n===0&&this.m_transpose<-this.PerfectOctaveClass()/2)this.m_transpose+=this.PerfectOctaveClass();return true}
  SetTranspositionSemitones(keyFifths:number,s:number|string){const sem=typeof s==='string'?Number(s):s;if(typeof s==='string'&&!this.IsValidSemitones(s))return false;return this.SetTransposition(this.SemitonesToIntervalClass(keyFifths,sem))}
  GetTranspositionIntervalClass(){return this.m_transpose} GetTranspositionIntervalName(){return this.GetIntervalName(this.m_transpose)}
  Transpose(p:TransPitch|number,v?:number|string){if(typeof p==='number')return p+this.m_transpose;const iv=v===undefined?this.m_transpose:typeof v==='number'?v:this.GetInterval(v);p.copyFrom(this.IntegerPitchToTransPitch(this.TransPitchToIntegerPitch(p)+iv));}
  SemitonesToIntervalClass(keyFifths:number,semitones:number){const sign=semitones<0?-1:1;let s=Math.abs(semitones);const octave=Math.floor(s/12);s-=octave*12;const pairs:[[number,string,string]]|any=[[0,'P1','P1'],[1,'m2','A1'],[2,'M2','d3'],[3,'m3','A2'],[4,'M3','d4'],[5,'P4','A3'],[6,'A4','d5'],[7,'P5','d6'],[8,'m6','A5'],[9,'M6','d7'],[10,'m7','A6'],[11,'M7','d8']];let name='P1';for(const [semi,a,b] of pairs as any){if(s===semi){if(semi===0)name='P1';else {const coeff=[[ -5,7],[2,-10],[-3,9],[4,-8],[-1,11],[6,-6],[1,-11],[-4,8],[3,-9],[-2,10],[5,-7]][semi-1];name=Math.abs(keyFifths+coeff[0]*sign)<Math.abs(keyFifths+coeff[1]*sign)?a:b}break}}return this.GetInterval((sign<0?'-':'+')+name)+sign*octave*this.m_base}
  IntervalToSemitones(interval:number|string){const ic=typeof interval==='string'?this.GetInterval(interval):interval;if(ic===INVALID_INTERVAL_CLASS)return INVALID_INTERVAL_CLASS;const sign=ic<0?-1:1;let x=Math.abs(ic);const oct=Math.floor(x/this.m_base);x-=oct*this.m_base;let dc=this.intervalToDC(x);return dc? (this.m_diatonic2semitone[dc[0]]+dc[1])*sign+12*oct:INVALID_INTERVAL_CLASS}
  private intervalToDC(ic:number):[number,number]|null{let best=0,bd=ic;for(let i=1;i<7;i++){const d=ic-(this.m_diatonicMapping[i]-this.m_diatonicMapping[0]);if(Math.abs(d)<Math.abs(bd)){bd=d;best=i}if(Math.abs(bd)<=this.m_maxAccid)break}return [best,bd]}
  GetInterval(p1:TransPitch,p2?:TransPitch):number;
  GetInterval(intervalName:string):number;
  GetInterval(p1:TransPitch,p2?:TransPitch):number;
  GetInterval(intervalName:string):number;
  GetInterval(p1:TransPitch|string,p2?:TransPitch):number {
    if(typeof p1 !== 'string') return p2 ? this.TransPitchToIntegerPitch(p2)-this.TransPitchToIntegerPitch(p1) : INVALID_INTERVAL_CLASS;
    const s=p1; let dir=1,i=0,q='',num='';
    if(s[i]==='-'){dir=-1;i++;} else if(s[i]==='+') i++;
    while(i<s.length && !/[0-9]/.test(s[i])) q+=s[i++];
    while(i<s.length && /[0-9]/.test(s[i])) num+=s[i++];
    if(!q||!num||Number(num)===0)return INVALID_INTERVAL_CLASS;
    let d=Number(num)-1, octave=Math.floor(d/7); d%=7;
    let base=0, adj=0; const A=q[0]==='A', D=q[0]==='d';
    switch(d){
      case 0: base=this.PerfectUnisonClass(); if(A)adj=q.length; else if(D)adj=-q.length; else if(q!=='P')return INVALID_INTERVAL_CLASS; break;
      case 1: if(q==='M')base=this.MajorSecondClass(); else if(q==='m')base=this.MinorSecondClass(); else if(A){base=this.MajorSecondClass();adj=q.length;} else if(D){base=this.MinorSecondClass();adj=-q.length;} else return INVALID_INTERVAL_CLASS; break;
      case 2: if(q==='M')base=this.MajorThirdClass(); else if(q==='m')base=this.MinorThirdClass(); else if(A){base=this.MajorThirdClass();adj=q.length;} else if(D){base=this.MinorThirdClass();adj=-q.length;} else return INVALID_INTERVAL_CLASS; break;
      case 3: base=this.PerfectFourthClass(); if(A)adj=q.length; else if(D)adj=-q.length; else if(q!=='P')return INVALID_INTERVAL_CLASS; break;
      case 4: base=this.PerfectFifthClass(); if(A)adj=q.length; else if(D)adj=-q.length; else if(q!=='P')return INVALID_INTERVAL_CLASS; break;
      case 5: if(q==='M')base=this.MajorSixthClass(); else if(q==='m')base=this.MinorSixthClass(); else if(A){base=this.MajorSixthClass();adj=q.length;} else if(D){base=this.MinorSixthClass();adj=-q.length;} else return INVALID_INTERVAL_CLASS; break;
      case 6: if(q==='M')base=this.MajorSeventhClass(); else if(q==='m')base=this.MinorSeventhClass(); else if(A){base=this.MajorSeventhClass();adj=q.length;} else if(D){base=this.MinorSeventhClass();adj=-q.length;} else return INVALID_INTERVAL_CLASS; break;
    }
    return dir*(octave*this.m_base+base+adj);
  }
  PerfectUnisonClass(){return 0} MinorSecondClass(){return this.m_diatonicMapping[3]-this.m_diatonicMapping[2]} MajorSecondClass(){return this.m_diatonicMapping[1]-this.m_diatonicMapping[0]} MinorThirdClass(){return this.m_diatonicMapping[3]-this.m_diatonicMapping[1]} MajorThirdClass(){return this.m_diatonicMapping[2]-this.m_diatonicMapping[0]} PerfectFourthClass(){return this.m_diatonicMapping[3]-this.m_diatonicMapping[0]} PerfectFifthClass(){return this.m_diatonicMapping[4]-this.m_diatonicMapping[0]} MinorSixthClass(){return this.m_diatonicMapping[5]-this.m_diatonicMapping[0]-1} MajorSixthClass(){return this.m_diatonicMapping[5]-this.m_diatonicMapping[0]} MinorSeventhClass(){return this.m_diatonicMapping[6]-this.m_diatonicMapping[0]-1} MajorSeventhClass(){return this.m_diatonicMapping[6]-this.m_diatonicMapping[0]} PerfectOctaveClass(){return this.m_base}
  TransPitchToIntegerPitch(p:TransPitch){return p.m_oct*this.m_base+this.m_diatonicMapping[p.m_pname]+p.m_accid}
  IntegerPitchToTransPitch(ip:number){const p=new TransPitch();p.m_oct=Math.floor(ip/this.m_base);const chroma=ip-p.m_oct*this.m_base;let mindiff=-1000,mini=-1;const target=this.m_maxAccid;if(chroma>this.m_base/2){mindiff=chroma-this.m_diatonicMapping[6];mini=6;for(let i=5;i>=0;i--){const d=chroma-this.m_diatonicMapping[i];if(Math.abs(d)<Math.abs(mindiff)){mindiff=d;mini=i}if(Math.abs(mindiff)<=target)break}}else{mindiff=chroma-this.m_diatonicMapping[0];mini=0;for(let i=1;i<7;i++){const d=chroma-this.m_diatonicMapping[i];if(Math.abs(d)<Math.abs(mindiff)){mindiff=d;mini=i}if(Math.abs(mindiff)<=target)break}}p.m_pname=mini;p.m_accid=mindiff;return p}
  GetIntervalName(p1:TransPitch|number,p2?:TransPitch){let ic=typeof p1==='number'?p1:this.GetInterval(p1,p2!);let dir='';if(ic<0){dir='-';ic=-ic}const octave=Math.floor(ic/this.m_base),chroma=ic-octave*this.m_base;let mindiff=chroma,mini=0;for(let i=1;i<7;i++){const d=chroma-(this.m_diatonicMapping[i]-this.m_diatonicMapping[0]);if(Math.abs(d)<Math.abs(mindiff)){mindiff=d;mini=i}if(Math.abs(mindiff)<=this.m_maxAccid)break}const nums=[1,2,3,4,5,6,7], perfect=[0,3,4];let number=nums[mini],q='';if(perfect.includes(mini)){if(mindiff===0)q='P';else if(mindiff<0)q='d'.repeat(-mindiff);else q='A'.repeat(mindiff)}else{if(mindiff===0)q='M';else if(mindiff===-1)q='m';else if(mindiff<0)q='d'.repeat(-mindiff-1);else q='A'.repeat(mindiff)}return dir+q+(number+octave*7)}
  IntervalToCircleOfFifths(v:number|string){let x=typeof v==='string'?this.GetInterval(v):v;if(x<0)x=(this.m_base*100+x)%this.m_base;else if(x===0)return 0;else x%=this.m_base;const p5=this.PerfectFifthClass(),p4=this.PerfectFourthClass();for(let i=1;i<this.m_base;i++){if((p5*i)%this.m_base===x)return i;if((p4*i)%this.m_base===x)return -i}return INVALID_INTERVAL_CLASS}
  CircleOfFifthsToIntervalClass(f:number){if(f===0)return 0;return f>0?(this.PerfectFifthClass()*f)%this.m_base:(this.PerfectFourthClass()*(-f))%this.m_base}
  CircleOfFifthsToIntervalName(f:number){return this.GetIntervalName(this.CircleOfFifthsToIntervalClass(f))}
  private tonic(base:number,f:number){return this.IntegerPitchToTransPitch((base+this.CircleOfFifthsToIntervalClass(f))%this.m_base)}
  CircleOfFifthsToMajorTonic(f:number){return this.tonic(this.GetCPitchClass(),f)} CircleOfFifthsToMinorTonic(f:number){return this.tonic(this.GetAPitchClass(),f)} CircleOfFifthsToDorianTonic(f:number){return this.tonic(this.GetDPitchClass(),f)} CircleOfFifthsToPhrygianTonic(f:number){return this.tonic(this.GetEPitchClass(),f)} CircleOfFifthsToLydianTonic(f:number){return this.tonic(this.GetFPitchClass(),f)} CircleOfFifthsToMixolydianTonic(f:number){return this.tonic(this.GetGPitchClass(),f)} CircleOfFifthsToLocrianTonic(f:number){return this.tonic(this.GetBPitchClass(),f)}
  GetKeyTonic(s:string,tonic:TransPitch){let i=0,oct=0,a=0;if(/^[+-]*/.test(s)){while(s[i]==='+'){oct++;i++}while(s[i]==='-'){oct--;i++}}const p='CDEFGAB'.indexOf((s[i]??'').toUpperCase());if(p<0)return false;i++;while(i<s.length){const c=s[i++].toUpperCase();if(c==='F'||c==='B')a--;else if(c==='S'||c==='#')a++;else return false}tonic.SetPitch(p,a,oct);return true}
  DiatonicChromaticToIntervalName(d:number,c:number){let dir='';if(d<0){dir='-';d=-d;c=-c}const oct=Math.floor(d/7);d%=7;const bases=[0,2,4,5,7,9,11],b=bases[d];let q='';if(c===b)q=d===0||d===3||d===4?'P':'M';else if((d===1||d===2||d===5||d===6)&&c===b-1)q='m';else if(c>b)q='A'.repeat(c-b);else q='d'.repeat((d===1||d===2||d===5||d===6)?b-c-1:b-c);return dir+q+(oct*7+d+1)}
  DiatonicChromaticToIntervalClass(d:number,c:number){return this.GetInterval(this.DiatonicChromaticToIntervalName(d,c))}
  IntervalToDiatonicChromatic(interval:number|string){const s=typeof interval==='string'?interval:this.GetIntervalName(interval);let dir=1,i=0;if(s[0]==='-'){dir=-1;i++}else if(s[0]==='+')i++;let q='';while(i<s.length&&!/[0-9]/.test(s[i]))q+=s[i++];const n=Number(s.slice(i));if(!q||!n)return [INVALID_INTERVAL_CLASS,INVALID_INTERVAL_CLASS] as [number,number];const d0=n-1,oct=Math.floor(d0/7),d=dir*(oct*7+d0%7);const bases=[0,2,4,5,7,9,11],b=bases[d0%7];let c=b;if(q==='P'||q==='M')c=b;else if(q==='m')c=b-1;else if(q[0]==='A')c=b+q.length;else if(q[0]==='d')c=b-((d0%7===1||d0%7===2||d0%7===5||d0%7===6)?q.length+1:q.length);else return [INVALID_INTERVAL_CLASS,INVALID_INTERVAL_CLASS] as [number,number];return [d,c*dir] as [number,number]}
  IsValidIntervalName(n:string){return /^(-|\+?)([Pp]|M|m|[aA]+|[dD]+)([1-9][0-9]*)$/.test(n)}
  IsValidSemitones(n:string){return /^(-|\+?)(\d+)$/.test(n)}
  IsValidKeyTonic(n:string){return /^[+\-]*[A-Ga-g][Ss#Ffb]*$/.test(n)}
}

export default {TransPitch,Transposer,INVALID_INTERVAL_CLASS};
