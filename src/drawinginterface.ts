import { FunctorCode, VisibilityType, VRV_UNSET, ClassId, data_DURATION, DURATION_NONE, DURATION_8, DURATION_32 } from './vrvdef';
import { ArrayOfObjects, ObjectListInterface, VrvObject } from './object';
import { Point } from './devicecontextbase';

export interface BeamCoordLike { m_element:any; m_dur:number; m_stem:any; m_closestNote:any; m_beamRelativePlace:number; m_breaksec:number; GetStemDir?:()=>number; }
export interface StaffLike { GetAlignment:()=>any; }
export interface StaffDefLike { GetN:()=>number; }
export interface CloneResetLike { Reset:()=>void; CloneReset?:()=>void; [k:string]:any; }
export interface StemLike { SetDrawingStemDir:(d:number)=>void; GetDrawingStemDir:()=>number; SetDrawingStemLen:(n:number)=>void; GetDrawingStemLen:()=>number; GetStemModRelY:()=>number; GetDrawingX:()=>number; GetDrawingY:()=>number; }

export const STEMDIRECTION_NONE=0, STEMDIRECTION_up=1, STEMDIRECTION_down=2;
export const BEAMPLACE_NONE=0, BEAMPLACE_above=1, BEAMPLACE_below=2, BEAMPLACE_mixed=3;
export const STAFFREL_basic_NONE=0, STAFFREL_basic_above=1, STAFFREL_basic_below=2;
export const DUR_MAX=0x7fffffff;
export const INTERFACE_DRAWING_LIST=1001, INTERFACE_BEAM_DRAWING=1002, INTERFACE_STAFFDEF_DRAWING=1003, INTERFACE_STEMMED_DRAWING=1004, INTERFACE_VISIBILITY_DRAWING=1005;

export function GetNoteDirection(leftNoteY:number,rightNoteY:number):number { if(leftNoteY===rightNoteY)return STEMDIRECTION_NONE; return leftNoteY<rightNoteY?STEMDIRECTION_up:STEMDIRECTION_down; }

function assertInvariant(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}

export class DrawingListInterface {
  protected m_drawingList:ArrayOfObjects=[];
  constructor(){this.Reset();}
  Reset():void{this.m_drawingList=[];}
  AddToDrawingList(element:VrvObject):void{if(!this.m_drawingList.includes(element))this.m_drawingList.push(element);}
  GetDrawingList():ArrayOfObjects{return this.m_drawingList;}
  ResetDrawingList():void{this.m_drawingList=[];}
  InterfaceResetData(_functor:any):FunctorCode{this.Reset();return FunctorCode.FUNCTOR_CONTINUE;}
}

export class BeamDrawingInterface extends ObjectListInterface {
  public static s_coordFactory: (el: any) => any = (el: any) => ({
    m_element: el,
    m_dur: typeof el?.GetActualDur === 'function' ? el.GetActualDur() : DURATION_NONE,
    m_stem: null,
    m_closestNote: null,
    m_beamRelativePlace: BEAMPLACE_NONE,
    m_breaksec: 0,
    GetStemDir: () => typeof el?.GetDrawingStemDir === 'function' ? el.GetDrawingStemDir() : STEMDIRECTION_NONE,
  });
  m_changingDur=false; m_beamHasChord=false; m_hasMultipleStemDir=false; m_cueSize=false; m_crossStaffContent:StaffLike|null=null; m_crossStaffRel=STAFFREL_basic_NONE; m_isSpanningElement=false; m_shortestDur=DURATION_NONE; m_notesStemDir=STEMDIRECTION_NONE; m_drawingPlace=BEAMPLACE_NONE; m_beamStaff:StaffLike|null=null;
  m_beamWidth=0; m_beamWidthBlack=0; m_beamWidthWhite=0; m_fractionSize=100; m_beamElementCoords:BeamCoordLike[]=[];
  constructor(){super();this.ResetBeamDrawing();}
  // C++ qualified BeamDrawingInterface::Reset must not dispatch to Beam/FTrem::Reset, which deletes children.
  ResetBeamDrawing():void{this.m_changingDur=false;this.m_beamHasChord=false;this.m_hasMultipleStemDir=false;this.m_cueSize=false;this.m_fractionSize=100;this.m_crossStaffContent=null;this.m_crossStaffRel=STAFFREL_basic_NONE;this.m_isSpanningElement=false;this.m_shortestDur=DURATION_NONE;this.m_notesStemDir=STEMDIRECTION_NONE;this.m_drawingPlace=BEAMPLACE_NONE;this.m_beamStaff=null;this.m_beamWidth=0;this.m_beamWidthBlack=0;this.m_beamWidthWhite=0;this.ClearCoords();}
  Reset():void{this.ResetBeamDrawing();}
  HasCoords():boolean{return this.m_beamElementCoords.length>0;}
  GetTotalBeamWidth():number{return this.m_beamWidthBlack+(this.m_shortestDur-DURATION_8)*this.m_beamWidth;}
  ClearCoords():void{this.m_beamElementCoords=[];}
  InitCoords(childList:any[],staff:StaffLike,place:number):void{assertInvariant(staff,'staff required');this.ResetBeamDrawing();if(!childList.length)return;this.m_beamStaff=staff;this.m_drawingPlace=place;this.m_beamElementCoords=childList.map((element:any)=>BeamDrawingInterface.s_coordFactory(element));let lastDur=this.m_beamElementCoords[0].m_dur;for(const c of this.m_beamElementCoords){const e=c.m_element;if(e?.Is?.(ClassId.CHORD))this.m_beamHasChord=true;if(typeof e?.HasBreaksec==='function'&&e.HasBreaksec()){this.m_changingDur=true;c.m_breaksec=e.GetBreaksec();}
    // C++ drawinginterface.cpp: cross-staff detection per beam child.
    // C++ branches on the GetCrossStaff *return value*, not on method existence.
    const csLayerRef={value:null};
    const cross=(typeof e?.GetCrossStaff==='function')?e.GetCrossStaff(csLayerRef):null;
    if(cross&&cross!==this.m_beamStaff){this.m_crossStaffContent=cross;this.m_crossStaffRel=typeof e.GetCrossStaffRel==='function'?e.GetCrossStaffRel():STAFFREL_basic_NONE;}
    // Check if some beam chord has cross staff content
    else if(e?.Is?.(ClassId.CHORD)){for(const nn of [e.GetTopNote?.(),e.GetBottomNote?.()]){if(nn?.m_crossStaff&&nn.m_crossStaff!==this.m_beamStaff){this.m_crossStaffContent=nn.m_crossStaff;this.m_crossStaffRel=typeof nn.GetCrossStaffRel==='function'?nn.GetCrossStaffRel():STAFFREL_basic_NONE;}}}
    if(e?.Is?.(ClassId.CHORD)||e?.Is?.(ClassId.NOTE)){const sd=typeof c.GetStemDir==='function'?c.GetStemDir() : STEMDIRECTION_NONE;if(sd!==STEMDIRECTION_NONE){if(this.m_notesStemDir!==STEMDIRECTION_NONE&&this.m_notesStemDir!==sd){this.m_hasMultipleStemDir=true;this.m_notesStemDir=STEMDIRECTION_NONE}else this.m_notesStemDir=sd;}}if(e?.IsAnyOf?.([ClassId.CHORD,ClassId.NOTE,ClassId.TABGRP]))this.m_shortestDur=Math.max(this.m_shortestDur,c.m_dur);if(c.m_dur!==lastDur)this.m_changingDur=true;lastDur=c.m_dur;}}
  InitCue(beamCue:boolean):void{if(beamCue)this.m_cueSize=beamCue;else this.m_cueSize=this.m_beamElementCoords.every(c=>!!c.m_element&&(!!c.m_element.IsGraceNote?.()||!!c.m_element.GetDrawingCueSize?.()));}
  InitGraceStemDir(graceGrp:boolean):void{if(!graceGrp)graceGrp=this.m_beamElementCoords.every(c=>!!c.m_element?.IsGraceNote?.());if(graceGrp&&this.m_notesStemDir===STEMDIRECTION_NONE)this.m_notesStemDir=STEMDIRECTION_up;}
  IsHorizontal():boolean{if(this.IsRepeatedPattern()||this.HasOneStepHeight()||this.m_drawingPlace===BEAMPLACE_NONE)return true;const items:number[]=[],dirs:number[]=[];for(const c of this.m_beamElementCoords){if(!c.m_stem||!c.m_closestNote)continue;items.push(c.m_closestNote.GetDrawingY());dirs.push(c.m_beamRelativePlace);}if(items.length<2)return true;const first=items[0],last=items.at(-1)!;if(first===last)return true;if(this.m_drawingPlace===BEAMPLACE_mixed&&this.IsHorizontalMixedBeam(items,dirs))return true;const firstStep=first!==items[1],lastStep=last!==items[items.length-2];if(items.length>2&&(firstStep||lastStep)){for(let i=1;i<items.length-1;i++){if(this.m_drawingPlace===BEAMPLACE_above&&items[i]>=first&&items[i]>=last)return true;if(this.m_drawingPlace===BEAMPLACE_below&&items[i]<=first&&items[i]<=last)return true;}const pitches=items.filter((v,i)=>i===0||v!==items[i-1]);if(pitches.length===2){if(this.m_drawingPlace===BEAMPLACE_above){if(firstStep&&items.every((v,i)=>i===0||items[i-1]<=v))return true;if(lastStep&&items.every((v,i)=>i===0||items[i-1]>=v))return true;}else{if(lastStep&&items.every((v,i)=>i===0||items[i-1]<=v))return true;if(firstStep&&items.every((v,i)=>i===0||items[i-1]>=v))return true;}}}return false;}
  private IsHorizontalMixedBeam(items:number[],directions:number[]):boolean{if(items.length!==directions.length||!directions.length)return false;let changes=0,prev=directions[0];for(const d of directions)if(d!==prev){changes++;prev=d;}if(changes<=1)return false;let top=VRV_UNSET,bottom=VRV_UNSET;const outside=GetNoteDirection(items[0],items.at(-1)!);const counts=new Map<number,number>([[STEMDIRECTION_NONE,0],[STEMDIRECTION_up,0],[STEMDIRECTION_down,0]]);for(let i=0;i<directions.length;i++){const d=directions[i];if(d===BEAMPLACE_above){if(top===VRV_UNSET)top=items[i];else{const k=GetNoteDirection(top,items[i]);counts.set(k,(counts.get(k)??0)+1);}}else if(d===BEAMPLACE_below){if(bottom===VRV_UNSET)bottom=items[i];else{const k=GetNoteDirection(bottom,items[i]);counts.set(k,(counts.get(k)??0)+1);}}}for(const [k,v] of counts)if(k!==outside&&v>(counts.get(outside)??0))return true;return false;}
  IsRepeatedPattern():boolean{if(this.m_drawingPlace===BEAMPLACE_mixed||this.m_drawingPlace===BEAMPLACE_NONE||this.m_beamElementCoords.length<4)return false;const items:number[]=[];for(const c of this.m_beamElementCoords){if(!c.m_stem||!c.m_closestNote)continue;items.push(c.m_closestNote.GetDrawingY()+DUR_MAX*c.m_dur);}if(items.length<4||items.slice(1).every((v,i)=>v===items[i]))return false;for(let div=2;div<=items.length/2;div++)if(items.length%div===0){const p=items.slice(0,div);let ok=true;for(let j=1;j<items.length/div;j++){if(p.some((v,i)=>v!==items[j*div+i])){ok=false;break;}}if(ok)return true;}return false;}
  HasOneStepHeight():boolean{if(this.m_shortestDur<DURATION_32)return false;let top=-128,bottom=128;for(const c of this.m_beamElementCoords)if(c.m_closestNote){const loc=c.m_closestNote.GetDrawingLoc();if(loc>top)top=loc;if(loc<bottom)bottom=loc;}return Math.abs(top-bottom)<=1;}
  IsFirstIn(element:any):boolean{const p=this.GetPosition(element);assertInvariant(p!==-1,'Element is not in beam');return p===0;}
  IsLastIn(element:any):boolean{const p=this.GetPosition(element);assertInvariant(p!==-1,'Element is not in beam');return p===this.GetListSize()-1;}
  protected GetPosition(element:any):number{this.GetList();let p=this.GetListIndex(element as any);if(p===-1&&element?.Is?.(ClassId.NOTE)){const chord=element.IsChordTone?.();if(chord)p=this.GetListIndex(chord);}return p;}
  GetAdditionalBeamCount():[number,number]{return [0,0];}
  GetFloatingBeamCount():[number,number]{return [0,0];}
  GetBeamOverflow(aboveRef:{value:any},belowRef:{value:any}):void{if(!this.m_beamStaff||!this.m_crossStaffContent)return;if(this.m_drawingPlace===BEAMPLACE_mixed){aboveRef.value=null;belowRef.value=null}else if(this.m_drawingPlace===BEAMPLACE_below){aboveRef.value=null;belowRef.value=this.m_crossStaffRel===STAFFREL_basic_above?this.m_beamStaff.GetAlignment():this.m_crossStaffContent.GetAlignment()}else if(this.m_drawingPlace===BEAMPLACE_above){belowRef.value=null;aboveRef.value=this.m_crossStaffRel===STAFFREL_basic_below?this.m_beamStaff.GetAlignment():this.m_crossStaffContent.GetAlignment();}}
  GetBeamChildOverflow(aboveRef:{value:any},belowRef:{value:any}):void{if(this.m_beamStaff&&this.m_crossStaffContent){if(this.m_crossStaffRel===STAFFREL_basic_above){aboveRef.value=this.m_crossStaffContent.GetAlignment();belowRef.value=this.m_beamStaff.GetAlignment()}else{aboveRef.value=this.m_beamStaff.GetAlignment();belowRef.value=this.m_crossStaffContent.GetAlignment()}}}
  InterfaceResetData(_functor:any):FunctorCode{this.Reset();return FunctorCode.FUNCTOR_CONTINUE;}
}

/**
 * C++ Beam/FTrem/BeamSpan inherit BeamDrawingInterface in addition to their main base.
 * TypeScript has single inheritance, so the interface implementation is copied onto the host
 * prototype. The host must declare all of the interface's `m_*` fields (Beam and FTrem do).
 */
export function mixinBeamDrawingInterface<T extends object>(proto: T): T {
  for (const key of Object.getOwnPropertyNames(BeamDrawingInterface.prototype)) {
    if (key === 'constructor') continue;
    if ((proto as any)[key]) continue;
    (proto as any)[key] = (BeamDrawingInterface.prototype as any)[key];
  }
  return proto;
}

// C++ StaffDefDrawingInterface keeps Clef/KeySig/... as value members
// (drawinginterface.h:339-341): never null before the import fills them.
// TS lazy-inits on first access to avoid a static import cycle.
let LazyClef: (new () => any) | null = null;
export function SetStaffDefClefCtor(ctor: new () => any): void { LazyClef = ctor; }
let LazyKeySig: (new () => any) | null = null;
export function SetStaffDefKeySigCtor(ctor: new () => any): void { LazyKeySig = ctor; }

export class StaffDefDrawingInterface {
  m_currentClef:any; m_currentKeySig:any; m_currentMensur:any; m_currentMeterSig:any; m_currentMeterSigGrp:any; m_currentProport:any; m_drawClef=false;m_drawKeySig=false;m_drawMensur=false;m_drawMeterSig=false;m_drawMeterSigGrp=false;m_ossiasAbove:StaffDefLike[]=[];m_ossiasBelow:StaffDefLike[]=[];
  constructor(){this.Reset();}
  Reset():void{for(const x of ['m_currentClef','m_currentKeySig','m_currentMensur','m_currentMeterSig','m_currentMeterSigGrp']){const o=(this as any)[x];o?.Reset?.();}this.m_currentProport?.Reset?.();this.m_drawClef=this.m_drawKeySig=this.m_drawMensur=this.m_drawMeterSig=this.m_drawMeterSigGrp=false;this.ResetOssiaStaffDefs();}
  ResetOssiaStaffDefs():void{this.m_ossiasAbove=[];this.m_ossiasBelow=[];}
  DrawClef():boolean{return !!this.m_drawClef&&!!this.m_currentClef?.HasShape?.();} SetDrawClef(v:boolean):void{this.m_drawClef=v;}
  DrawKeySig():boolean{return this.m_drawKeySig;} SetDrawKeySig(v:boolean):void{this.m_drawKeySig=v;}
  DrawMensur():boolean{return !!this.m_drawMensur&&(!!this.m_currentMensur?.HasSign?.()||!!this.m_currentMensur?.HasNum?.());} SetDrawMensur(v:boolean):void{this.m_drawMensur=v;}
  DrawMeterSig():boolean{return !!this.m_drawMeterSig&&(!!this.m_currentMeterSig?.HasUnit?.()||!!this.m_currentMeterSig?.HasSym?.());} SetDrawMeterSig(v:boolean):void{this.m_drawMeterSig=v;}
  DrawMeterSigGrp():boolean{return !!this.m_drawMeterSigGrp&&((this.m_currentMeterSigGrp?.GetListSize?.()??0)>1);} SetDrawMeterSigGrp(v:boolean):void{this.m_drawMeterSigGrp=v;}
  SetCurrentClef(c:any):void{if(c){this.m_currentClef=c.Clone?c.Clone():c;this.m_currentClef.CloneReset?.();}}
  SetCurrentKeySig(k:any):void{
    if(!k)return;
    // C++ drawinginterface.cpp:627-643: cancellation describes the previous key.
    const previous=this.GetCurrentKeySig();
    const ignoreCancel=previous.HasNonAttribKeyAccidChildren()||k.HasNonAttribKeyAccidChildren();
    const count=previous.GetAccidCount(), type=previous.GetAccidType();
    this.m_currentKeySig=k.Clone();
    this.m_currentKeySig.CloneReset();
    if(ignoreCancel)this.m_currentKeySig.m_skipCancellation=true;
    else{
      this.m_currentKeySig.m_drawingCancelAccidCount=count;
      this.m_currentKeySig.m_drawingCancelAccidType=type;
    }
  }
  SetCurrentMensur(v:any):void{if(v){this.m_currentMensur=v.Clone?v.Clone():v;this.m_currentMensur.CloneReset?.();}}
  SetCurrentMeterSig(v:any):void{if(v){this.m_currentMeterSig=v.Clone?v.Clone():v;this.m_currentMeterSig.CloneReset?.();}}
  SetCurrentMeterSigGrp(v:any):void{if(v){this.m_currentMeterSigGrp=v.Clone?v.Clone():v;this.m_currentMeterSigGrp.CloneReset?.();}}
  AlternateCurrentMeterSig(measure:any):void{const g=this.m_currentMeterSigGrp;const alternating=1;const func=g?.GetFunc?.();if(func!==undefined&&func===alternating){g.SetMeasureBasedCount?.(measure);const m=g.GetSimplifiedMeterSig?.();if(m)this.SetCurrentMeterSig(m);}}
  SetCurrentProport(v:any):void{if(v){this.m_currentProport=v.Clone?v.Clone():v;this.m_currentProport.CloneReset?.();}}
  GetCurrentClef():any{if(this.m_currentClef==null && LazyClef)this.m_currentClef=new LazyClef();return this.m_currentClef;} GetCurrentKeySig():any{ if(this.m_currentKeySig===undefined||this.m_currentKeySig===null){ if(LazyKeySig) this.m_currentKeySig=new LazyKeySig(); } return this.m_currentKeySig;} GetCurrentMensur():any{return this.m_currentMensur;} GetCurrentMeterSig():any{return this.m_currentMeterSig;} GetCurrentMeterSigGrp():any{return this.m_currentMeterSigGrp;} GetCurrentProport():any{return this.m_currentProport;}
  AddOssiaAbove(v:StaffDefLike):void{this.m_ossiasAbove.push(v);} AddOssiaBelow(v:StaffDefLike):void{this.m_ossiasBelow.push(v);}
  GetOssiaStaffDef(n:number):StaffDefLike|null{return this.m_ossiasAbove.find(x=>x.GetN()===n)||this.m_ossiasBelow.find(x=>x.GetN()===n)||null;}
  GetOssiaAboveNs(out:number[]):void{for(const x of this.m_ossiasAbove)out.push(x.GetN());} GetOssiaBelowNs(out:number[]):void{for(const x of this.m_ossiasBelow)out.push(x.GetN());}
  InterfaceResetData(_functor:any):FunctorCode{return FunctorCode.FUNCTOR_CONTINUE;}
}

export abstract class StemmedDrawingInterface {
  protected m_drawingStem:StemLike|null=null;
  constructor(){this.Reset();}
  Reset():void{this.m_drawingStem=null;} SetDrawingStem(s:StemLike|null):void{this.m_drawingStem=s;}
  GetDrawingStem():StemLike|null{return this.m_drawingStem;} SetDrawingStemDir(d:number):void{this.m_drawingStem?.SetDrawingStemDir(d);} GetDrawingStemDir():number{return this.m_drawingStem?this.m_drawingStem.GetDrawingStemDir():STEMDIRECTION_NONE;}
  SetDrawingStemLen(n:number):void{this.m_drawingStem?.SetDrawingStemLen(n);} GetDrawingStemLen():number{return this.m_drawingStem?this.m_drawingStem.GetDrawingStemLen():0;} GetDrawingStemModRelY():number{return this.m_drawingStem?this.m_drawingStem.GetStemModRelY():0;}
  GetDrawingStemStart(object:any=null):Point{assertInvariant(this.m_drawingStem||object,'Stem or object required');if(object&&!this.m_drawingStem)return new Point(object.GetDrawingX(),object.GetDrawingY());return new Point(this.m_drawingStem!.GetDrawingX(),this.m_drawingStem!.GetDrawingY());}
  GetDrawingStemEnd(object:any=null):Point{assertInvariant(this.m_drawingStem||object,'Stem or object required');if(object&&!this.m_drawingStem){if(object.Is?.(ClassId.CHORD))return new Point(object.GetDrawingX(),object.GetYBottom());return new Point(object.GetDrawingX(),object.GetDrawingY());}return new Point(this.m_drawingStem!.GetDrawingX(),this.m_drawingStem!.GetDrawingY()-this.GetDrawingStemLen());}
  abstract GetStemUpSE(doc:any,staffSize:number,graceSize:boolean):Point; abstract GetStemDownNW(doc:any,staffSize:number,graceSize:boolean):Point; abstract CalcStemLenInThirdUnits(staff:any,stemDir:number):number;
  InterfaceResetData(_functor:any):FunctorCode{this.Reset();return FunctorCode.FUNCTOR_CONTINUE;}
}

export class VisibilityDrawingInterface {
  private m_visibility:VisibilityType=VisibilityType.Visible;
  constructor(){this.Reset();}
  Reset():void{this.m_visibility=VisibilityType.Visible;}
  SetVisibility(v:VisibilityType):void{this.m_visibility=v;} IsHidden():boolean{return this.m_visibility===VisibilityType.Hidden;}
}
