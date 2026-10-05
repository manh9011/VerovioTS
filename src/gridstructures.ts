import { HumNum } from './humlib';
import { HumGrid, GridMeasure, MeasureStyle } from './humgrid';
import { HumdrumFile, HumdrumLine, HumdrumToken } from './humlib-core';

export enum SliceType {
  Notes=1, _Duration, GraceNotes, _Data, Measures, _Measure, Stria, Clefs, Transpositions,
  KeyDesignations, KeySigs, TimeSigs, MeterSigs, Tempos, Labels, LabelAbbrs, Ottavas,
  _RegularInterpretation, Exclusives, Terminators, Manipulators, _Manipulator, _Interpretation,
  Layouts, LocalComments, _Spined, GlobalComments, GlobalLayouts, ReferenceRecords, _Other, Invalid
}

export interface HumdrumTokenLike { value:string; isNull?:()=>boolean; }
export interface HumdrumLineLike { appendToken(token: HumdrumTokenLike): void; }
const token = (value:string):HumdrumTokenLike => ({value, isNull:()=>value==='.'||value==='*'||value==='!'});

export class GridVoice {
  private m_token: HumdrumTokenLike|null;
  private m_nextdur: HumNum;
  private m_prevdur: HumNum;
  private m_transfered = false;
  constructor(t?: HumdrumTokenLike|string|null, duration?: HumNum){
    this.m_token = typeof t === 'string' ? token(t) : (t ?? null);
    this.m_nextdur = duration ? new HumNum(duration) : new HumNum();
    this.m_prevdur = new HumNum();
  }
  isTransfered(){ return this.m_transfered; }
  getToken(){ return this.m_token; }
  setToken(t: HumdrumTokenLike|string){ this.m_token = typeof t==='string' ? token(t) : t; this.m_transfered=false; }
  isNull(){ return this.m_token===null || !!this.m_token.isNull?.(); }
  setDuration(d:HumNum){ this.m_nextdur=new HumNum(d); this.m_prevdur=new HumNum(); }
  getDuration(){ return this.m_nextdur.add(this.m_prevdur); }
  getDurationToNext(){ return new HumNum(this.m_nextdur); }
  getDurationToPrev(){ return new HumNum(this.m_nextdur); } // preserves source implementation
  setDurationToPrev(d:HumNum){ this.m_prevdur=new HumNum(d); }
  incrementDuration(d:HumNum){ this.m_nextdur=this.m_nextdur.sub(d); this.m_prevdur=this.m_prevdur.add(d); }
  forgetToken(){ this.m_transfered=true; this.m_token=null; }
  getString(){ return this.m_token ? this.m_token.value : ''; }
  setTransfered(state:boolean){ this.m_transfered=state; }
}

export class GridStaff extends Array<GridVoice|null> {
  private verses:Array<HumdrumTokenLike|null>=[]; private harmony:HumdrumTokenLike|null=null;
  private xmlid:HumdrumTokenLike|null=null; private dynamics:HumdrumTokenLike|null=null; private figuredBass:HumdrumTokenLike|null=null;
  setTokenLayer(layerindex:number, t:HumdrumTokenLike|string, duration:HumNum){
    if(layerindex<0) return null;
    while(this.length<=layerindex)this.push(null); const gv=new GridVoice(t,duration); this[layerindex]=gv; return gv;
  }
  setNullTokenLayer(layerindex:number,type:SliceType,nextdur:HumNum){
    if([SliceType.Invalid,SliceType.GlobalLayouts,SliceType.GlobalComments,SliceType.ReferenceRecords].includes(type)) return;
    const nul = type < SliceType._Data ? '.' : type <= SliceType._Measure ? '=' : type <= SliceType._Interpretation ? '*' : type <= SliceType._Spined ? '!' : '!!';
    const cur=this[layerindex];
    if(cur?.getToken()?.value===nul) return;
    if(cur?.getToken()){
      const original = String(cur.getToken()!.value).replace(/\.ZZZ/g, '');
      this.setTokenLayer(layerindex,nul+'ZZZ'+original,nextdur);
      return;
    }
    this.setTokenLayer(layerindex,nul,nextdur);
  }
  appendTokenLayer(layerindex:number,t:HumdrumTokenLike|string,duration:HumNum,spacer=' '){
    while(this.length<=layerindex)this.push(null); const v=typeof t==='string'?token(t):t; if(this[layerindex]?.getToken()) this[layerindex]!.getToken()!.value += spacer+v.value; else this[layerindex]=new GridVoice(v,duration);
  }
  getMaxVerseCount(){ return 5; }
  getString(){ return this.map(v=>v===null?'{nv}':v.getToken()===null?'{n}':v.getToken()!.value).join('\t'); }
  setVerse(i:number,t:HumdrumTokenLike|string|null){ while(this.verses.length<=i)this.verses.push(null); this.verses[i]=typeof t==='string'?token(t):t; }
  getVerse(i:number){ return this.verses[i]??null; }
  getVerseCount(){ return this.verses.length; }
  setHarmony(t:HumdrumTokenLike|string|null){ this.harmony=typeof t==='string'?token(t):t; }
  getHarmony(){ return this.harmony; } getHarmonyCount(){ return this.harmony?1:0; } detachHarmony(){this.harmony=null;}
  setXmlid(t:HumdrumTokenLike|string|null){this.xmlid=typeof t==='string'?token(t):t;} getXmlid(){return this.xmlid;} getXmlidCount(){return this.xmlid?1:0;} detachXmlid(){this.xmlid=null;}
  setDynamics(t:HumdrumTokenLike|string|null){this.dynamics=typeof t==='string'?token(t):t;} getDynamics(){return this.dynamics;} getDynamicsCount(){return this.dynamics?1:0;} detachDynamics(){this.dynamics=null;}
  setFiguredBass(t:HumdrumTokenLike|string|null){this.figuredBass=typeof t==='string'?token(t):t;} getFiguredBass(){return this.figuredBass;} getFiguredBassCount(){return this.figuredBass?1:0;} detachFiguredBass(){this.figuredBass=null;}
}

export class GridPart extends Array<GridStaff> { private partName=''; private dynamics:HumdrumTokenLike|null=null; private harmony:HumdrumTokenLike|null=null; private figuredBass:HumdrumTokenLike|null=null; private xmlid:HumdrumTokenLike|null=null; private verses:Array<HumdrumTokenLike|null>=[]; setPartName(v:string){this.partName=v;} getPartName(){return this.partName;} setDynamics(t:HumdrumTokenLike|string|null){this.dynamics=typeof t==='string'?token(t):t;} getDynamics(){return this.dynamics;} getDynamicsCount(){return this.dynamics?1:0;} detachDynamics(){this.dynamics=null;} setHarmony(t:HumdrumTokenLike|string|null){this.harmony=typeof t==='string'?token(t):t;} getHarmony(){return this.harmony;} getHarmonyCount(){return this.harmony?1:0;} detachHarmony(){this.harmony=null;} setFiguredBass(t:HumdrumTokenLike|string|null){this.figuredBass=typeof t==='string'?token(t):t;} getFiguredBass(){return this.figuredBass;} getFiguredBassCount(){return this.figuredBass?1:0;} detachFiguredBass(){this.figuredBass=null;} getXmlid(){return this.xmlid;} getXmlidCount(){return this.xmlid?1:0;} detachXmlid(){this.xmlid=null;} getVerse(i:number){return this.verses[i]??null;} getVerseCount(){return this.verses.length;} }

export class GridSlice extends Array<GridPart> {
  private m_owner:HumGrid|null=null; private m_measure:GridMeasure|null; private m_timestamp:HumNum; private m_duration=new HumNum(); private m_type:SliceType;
  constructor(measure:GridMeasure|null,timestamp:HumNum,type:SliceType,partcount=0){ super(); this.m_measure=measure; this.m_owner=measure?.getOwner()??null; this.m_timestamp=new HumNum(timestamp); this.m_type=type; for(let p=0;p<partcount;p++){const st=new GridStaff(); st.push(new GridVoice()); this.push(new GridPart(st));} }
  getType(){return this.m_type;} getDuration(){return new HumNum(this.m_duration);} setDuration(d:HumNum){this.m_duration=new HumNum(d);} getTimestamp(){return new HumNum(this.m_timestamp);} setTimestamp(t:HumNum){this.m_timestamp=new HumNum(t);} getOwner(){return this.m_owner;} setOwner(o:HumGrid|null){this.m_owner=o;} getMeasure(){return this.m_measure;}
  isNoteSlice(){return this.m_type===SliceType.Notes;} isGraceSlice(){return this.m_type===SliceType.GraceNotes;} isMeasureSlice(){return this.m_type===SliceType.Measures;} isClefSlice(){return this.m_type===SliceType.Clefs;} isLabelSlice(){return this.m_type===SliceType.Labels;} isLabelAbbrSlice(){return this.m_type===SliceType.LabelAbbrs;} isTransposeSlice(){return this.m_type===SliceType.Transpositions;} isKeySigSlice(){return this.m_type===SliceType.KeySigs;} isKeyDesignationSlice(){return this.m_type===SliceType.KeyDesignations;} isTimeSigSlice(){return this.m_type===SliceType.TimeSigs;} isTempoSlice(){return this.m_type===SliceType.Tempos;} isMeterSigSlice(){return this.m_type===SliceType.MeterSigs;} isManipulatorSlice(){return this.m_type===SliceType.Manipulators;} isLayoutSlice(){return this.m_type===SliceType.Layouts;} isLocalLayoutSlice(){return this.m_type===SliceType.Layouts;} isInvalidSlice(){return this.m_type===SliceType.Invalid;} isGlobalComment(){return this.m_type===SliceType.GlobalComments;} isGlobalLayout(){return this.m_type===SliceType.GlobalLayouts;} isReferenceRecord(){return this.m_type===SliceType.ReferenceRecords;} isOttavaRecord(){return this.m_type===SliceType.Ottavas;}
  isInterpretationSlice(){return this.m_type>=SliceType._Measure && this.m_type<=SliceType._Interpretation;} isDataSlice(){return this.m_type<=SliceType._Data;}
  hasSpines(){return this.m_type < SliceType._Spined;}
  size(){return this.length;}
  invalidate(){this.m_type=SliceType.Invalid; this.m_duration=new HumNum();}
  addToken(tok:string,parti:number,staffi:number,voicei:number){ if(parti<0||parti>=this.length||staffi<0)return; while(this[parti].length<=staffi)this[parti].push(new GridStaff()); while(this[parti][staffi].length<=voicei)this[parti][staffi].push(new GridVoice()); this[parti][staffi][voicei]!.setToken(tok); }
  getNullTokenForSlice(){ if(this.isDataSlice())return '.'; if(this.isInterpretationSlice())return '*'; if(this.isMeasureSlice())return '='; if(!this.hasSpines())return '!!'; return '!'; }
  getMeasureDuration(){return this.m_measure?this.m_measure.getDuration():new HumNum(-1);} getMeasureTimestamp(){return this.m_measure?this.m_measure.getTimestamp():new HumNum(-1);}
  getVerseCount(p:number,s:number){return this.m_owner?.getVerseCount(p,s)??0;} getHarmonyCount(p:number,s=-1){return s>=0?0:(this.m_owner?.getHarmonyCount(p)??0);} getXmlidCount(p:number,_s=-1){return this.m_owner?.getXmlidCount(p)??0;} getDynamicsCount(p:number,s=-1){return s>=0?0:(this.m_owner?.getDynamicsCount(p)??0);} getFiguredBassCount(p:number,s=-1){return s>=0?0:(this.m_owner?.getFiguredBassCount(p)??0);} reportVerseCount(p:number,s:number,c:number){this.m_owner?.reportVerseCount(p,s,c);}
  initializeByStaffCount(n:number){this.length=0; for(let i=0;i<n;i++){const st=new GridStaff();st.push(new GridVoice());this.push(new GridPart(st));}}
  transferSidesStaff(line:HumdrumLine, sides:GridStaff, empty:string, maxxcount:number, maxvcount:number, maxhcount:number, maxfcount:number):void{
    const vcount=sides.getVerseCount();
    const fcount=sides.getFiguredBassCount();
    const hcount=sides.getHarmonyCount();
    if(maxxcount>0){
      const xmlid=sides.getXmlid();
      if(xmlid){ line.appendToken(new HumdrumToken(xmlid.value)); sides.detachXmlid(); }
      else line.appendToken(new HumdrumToken(empty));
    }
    for(let i=0;i<vcount;i++){
      const verse=sides.getVerse(i);
      if(verse){ line.appendToken(new HumdrumToken(verse.value)); sides.setVerse(i,null); }
      else line.appendToken(new HumdrumToken(empty));
    }
    for(let i=vcount;i<maxvcount;i++) line.appendToken(new HumdrumToken(empty));
    for(let i=0;i<hcount;i++){
      const harmony=sides.getHarmony();
      if(harmony){ line.appendToken(new HumdrumToken(harmony.value)); sides.detachHarmony(); }
      else line.appendToken(new HumdrumToken(empty));
    }
    for(let i=0;i<fcount;i++){
      const fb=sides.getFiguredBass();
      if(fb){ line.appendToken(new HumdrumToken(fb.value)); sides.detachFiguredBass(); }
      else line.appendToken(new HumdrumToken(empty));
    }
    for(let i=hcount;i<maxhcount;i++) line.appendToken(new HumdrumToken(empty));
    for(let i=fcount;i<maxfcount;i++) line.appendToken(new HumdrumToken(empty));
  }
  transferSidesPart(line:HumdrumLine, sides:GridPart, empty:string, maxxcount:number, maxvcount:number, maxhcount:number, maxdcount:number, maxfcount:number):void{
    const xcount=sides.getXmlidCount();
    const hcount=sides.getHarmonyCount();
    const vcount=sides.getVerseCount();
    if(xcount>0){
      const xmlid=sides.getXmlid();
      if(xmlid){ line.appendToken(new HumdrumToken(xmlid.value)); sides.detachXmlid(); }
      else line.appendToken(new HumdrumToken(empty));
    }
    for(let i=0;i<vcount;i++){
      const verse=sides.getVerse(i);
      if(verse){ line.appendToken(new HumdrumToken(verse.value)); }
      else line.appendToken(new HumdrumToken(empty));
    }
    for(let i=vcount;i<maxvcount;i++) line.appendToken(new HumdrumToken(empty));
    if(maxdcount>0){
      const dynamics=sides.getDynamics();
      if(dynamics){ line.appendToken(new HumdrumToken(dynamics.value)); sides.detachDynamics(); }
      else line.appendToken(new HumdrumToken(empty));
    }
    if(maxfcount>0){
      const fb=sides.getFiguredBass();
      if(fb){ line.appendToken(new HumdrumToken(fb.value)); sides.detachFiguredBass(); }
      else line.appendToken(new HumdrumToken(empty));
    }
    for(let i=0;i<hcount;i++){
      const harmony=sides.getHarmony();
      if(harmony){ line.appendToken(new HumdrumToken(harmony.value)); sides.detachHarmony(); }
      else line.appendToken(new HumdrumToken(empty));
    }
    for(let i=hcount;i<maxhcount;i++) line.appendToken(new HumdrumToken(empty));
  }
  // C++ GridSlice::transferTokens (humlib.cpp:10818). Parts/staves iterate
  // in reverse so the last staff prints as the first spine.
  transferTokens(outfile:HumdrumFile,_recip:boolean):void{
    let empty='.';
    if(this.isMeasureSlice()&&this.length>0){ const st=this[0][0]; if(st&&st.length>0){ const gv=st[0]; const tok=gv?.getToken(); if(tok) empty=tok.value; } }
    else if(this.isInterpretationSlice()) empty='*';
    else if(this.isLayoutSlice()) empty='!';
    else if(!this.hasSpines()) empty='???';
    const line=new HumdrumLine();
    for(let p=this.length-1;p>=0;p--){
      if(!this.hasSpines()&&p!==0) continue;
      const part=this[p];
      for(let s=part.length-1;s>=0;s--){
        if(!this.hasSpines()&&s!==0) continue;
        const staff=part[s];
        if(staff.length===0){ line.appendToken(new HumdrumToken(empty)); }
        else{
          for(let v=0;v<staff.length;v++){
            const gv=staff[v];
            const tok=gv?.getToken();
            if(gv&&tok){ line.appendToken(new HumdrumToken(tok.value)); gv.forgetToken(); }
            else line.appendToken(new HumdrumToken(empty));
          }
        }
        if(!this.hasSpines()) continue;
        this.transferSidesStaff(line, staff, empty, this.getXmlidCount(p, s), this.getVerseCount(p, s), this.getHarmonyCount(p, s), this.getFiguredBassCount(p, s));
      }
      if(this.hasSpines()) this.transferSidesPart(line, part, empty, this.getXmlidCount(p), this.getVerseCount(p, -1), this.getHarmonyCount(p), this.getDynamicsCount(p), this.getFiguredBassCount(p));
    }
    line.createLineFromTokens();
    outfile.appendLine(line);
  }
}
