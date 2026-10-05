/** Pure TypeScript translation of Verovio src/adjustslursfunctor.cpp. */
import { DocFunctor } from './functor.js';
import { BoundingBox } from './boundingbox.js';
import { BezierCurve, Point } from './devicecontextbase.js';
import { ClassId, FunctorCode, SpanningType } from './vrvdef.js';

export const CURVEDIR_above: number = 1;
export const CURVEDIR_below: number = 2;
export const CURVEDIR_mixed: number = 3;
export const curvature_CURVEDIR_above = CURVEDIR_above;
export const curvature_CURVEDIR_below = CURVEDIR_below;
export const curvature_CURVEDIR_mixed = CURVEDIR_mixed;

export interface NearEndCollision { metricAtStart:number; metricAtEnd:number; endPointsAdjusted:boolean; }
export interface ControlPointConstraint { a:number; b:number; c:number; }
export interface ControlPointAdjustment { leftShift:number; rightShift:number; moveUpwards:boolean; requestedStaffSpace:number; }
export interface AdjustSlursOptionsLike { m_slurMargin:{GetValue():number}; m_slurEndpointFlexibility:{GetValue():number}; m_slurSymmetry:{GetValue():number}; }
export interface AdjustSlursDocLike { GetDrawingUnit(staffSize:number):number; GetOptions():AdjustSlursOptionsLike; }
export interface SpanBoxLike { GetSelfLeft():number; GetSelfRight():number; GetSelfTop():number; GetSelfBottom():number; }
export interface CurveSpannedElementLike { m_boundingBox:SpanBoxLike; m_discarded:boolean; m_isBelow:boolean; }
export interface FloatingCurveLike {
  GetObject(): any; Is(classId:number):boolean; HasContentBB():boolean; GetPoints(out?:Point[]):Point[]|void; UpdatePoints(curve:BezierCurve):void; GetDir():number; IsCrossStaff():boolean;
  GetSpannedElements():CurveSpannedElementLike[]; CalcDirectionalAdjustment(b:SpanBoxLike,isAbove:boolean,discard:{value:boolean},margin:number):number;
  CalcDirectionalLeftRightAdjustment(b:SpanBoxLike,isAbove:boolean,discard:{value:boolean},margin:number):[number,number];
  MoveBackHorizontal(d:number):void; MoveFrontHorizontal(d:number):void; MoveFrontVertical(d:number):void; MoveBackVertical(d:number):void;
  SetRequestedStaffSpace(v:number):void; ResetBoundingBox():void; GetSpanningType():any; m_spanningType:any;
}
export interface StaffAlignmentLike { GetStaff():{m_drawingStaffSize:number}|null; GetFloatingPositioners():FloatingCurveLike[]; }
export interface SystemLike { m_systemAligner:{Process(functor:any):void}; }
export interface SlurLike {
  InitBezierControlSides(b:BezierCurve,dir:number):void; CalcInitialCurve(doc:any,curve:any,collision:NearEndCollision):void; CalcSpannedElements(curve:any):void; HasBulge():boolean;
  GetBulge():Array<[number,number]>; HasEndpointAboveStart():boolean; HasEndpointAboveEnd():boolean; GetStart():any; GetEnd():any; HasInnerSlur(other:any):boolean;
}

function p4(curve:any):Point[]{ const out=curve.GetPoints(); return Array.isArray(out)?out:[out[0],out[1],out[2],out[3]]; }
function opts(doc:AdjustSlursDocLike){ return doc.GetOptions(); }

export class AdjustSlursFunctor extends DocFunctor {
  private m_crossStaffSlurs=false;
  private m_currentSlur:SlurLike|null=null;
  private m_currentCurve:FloatingCurveLike|null=null;
  public constructor(doc:AdjustSlursDocLike){ super(doc as any); this.ResetCurrent(); }
  public override ImplementsEndInterface(){ return false; }
  public HasCrossStaffSlurs(){ return this.m_crossStaffSlurs; }
  public ResetCurrent(){ this.m_currentCurve=null; this.m_currentSlur=null; }

  public VisitStaffAlignment(sa:StaffAlignmentLike):FunctorCode {
    const staff=sa.GetStaff(); if(!staff) return FunctorCode.FUNCTOR_CONTINUE;
    const unit=(this.m_doc as any).GetDrawingUnit(staff.m_drawingStaffSize);
    const positioners:FloatingCurveLike[]=[];
    for(const pos of sa.GetFloatingPositioners()){
      const obj=pos.GetObject(); if(!obj) continue;
      if(typeof obj.IsAnyOf==='function' && !obj.IsAnyOf([ClassId.PHRASE,ClassId.SLUR])) continue;
      const slur=obj as SlurLike; this.m_currentSlur=slur; this.m_currentCurve=pos;
      if(!pos.HasContentBB()) continue;
      positioners.push(pos); this.AdjustSlur(unit); if(pos.IsCrossStaff()) this.m_crossStaffSlurs=true;
    }
    this.ResetCurrent();
    const inner=new Map<FloatingCurveLike,FloatingCurveLike[]>();
    for(let i=0;i<positioners.length;i++){
      const a=positioners[i], first=a.GetObject() as SlurLike; const inn:FloatingCurveLike[]=[];
      for(let j=0;j<positioners.length;j++){
        if(i===j) continue; const b=positioners[j], second=b.GetObject() as SlurLike;
        if(b.GetSpanningType?.()===SpanningType.SPANNING_START_END && first.HasInnerSlur(second)){ inn.push(b); continue; }
        const q1=p4(a),q2=p4(b);
        if(first.GetEnd?.()===second.GetStart?.() && BoundingBox.ArePointsClose(q1[3],q2[0],unit)){a.MoveBackHorizontal(-unit/2);b.MoveFrontHorizontal(unit/2);}
        if(first.GetStart?.()===second.GetStart?.() && BoundingBox.ArePointsClose(q1[0],q2[0],unit) && q1[3].x>q2[3].x){let d=q2[0].y-q1[0].y; d+=(a.GetDir()===CURVEDIR_below?-unit:unit); a.MoveFrontVertical(d);}
        if(first.GetEnd?.()===second.GetEnd?.() && BoundingBox.ArePointsClose(q1[3],q2[3],unit) && q1[0].x<q2[0].x){let d=q2[3].y-q1[3].y; d+=(a.GetDir()===CURVEDIR_below?-unit:unit); a.MoveBackVertical(d);}
      }
      if(inn.length) inner.set(a,inn);
    }
    for(const [curve,inn] of inner){this.m_currentCurve=curve;this.m_currentSlur=curve.GetObject() as SlurLike;this.AdjustOuterSlur(inn,unit);}
    this.ResetCurrent(); return FunctorCode.FUNCTOR_SIBLINGS;
  }
  public VisitSystem(system:SystemLike){ system.m_systemAligner.Process(this); return FunctorCode.FUNCTOR_SIBLINGS; }

  private AdjustSlur(unit:number){
    const curve=this.m_currentCurve!, slur=this.m_currentSlur!; const pts=p4(curve), b=new BezierCurve(pts[0],pts[1],pts[2],pts[3]);
    slur.InitBezierControlSides(b,curve.GetDir()); b.UpdateControlPointParams();
    const o=opts(this.m_doc as any), margin=o.m_slurMargin.GetValue()*unit, flex=o.m_slurEndpointFlexibility.GetValue(), sym=o.m_slurSymmetry.GetValue();
    this.FilterSpannedElements(b,margin); const nec=this.DetectCollisionsNearEnd(b,margin); slur.CalcInitialCurve(this.m_doc,curve,nec);
    if(nec.endPointsAdjusted){const q=p4(curve); b.p1=q[0];b.c1=q[1];b.c2=q[2];b.p2=q[3];b.UpdateControlPointParams();slur.CalcSpannedElements(curve);this.FilterSpannedElements(b,margin);} else curve.UpdatePoints(b);
    const [ls,rs]=this.CalcEndPointShift(b,flex,margin); this.ApplyEndPointShift(b,ls,rs);
    if(slur.HasBulge()){this.AdjustSlurFromBulge(b,unit);return;}
    if(this.AllowControlOffsetAdjustment(b,sym,unit)){const [ok,lo,ro]=this.CalcControlPointOffset(b,margin);if(ok){b.SetLeftControlOffset(lo);b.SetRightControlOffset(ro);b.UpdateControlPoints();curve.UpdatePoints(b);}}
    const a=this.CalcControlPointVerticalShift(b,sym,margin); b.SetLeftControlHeight(b.GetLeftControlHeight()+((b.IsLeftControlAbove()===a.moveUpwards)?1:-1)*a.leftShift); b.SetRightControlHeight(b.GetRightControlHeight()+((b.IsRightControlAbove()===a.moveUpwards)?1:-1)*a.rightShift); b.UpdateControlPoints();curve.UpdatePoints(b);curve.SetRequestedStaffSpace(a.requestedStaffSpace);
    if(curve.GetDir()!==CURVEDIR_mixed){this.AdjustSlurShape(b,curve.GetDir(),unit);curve.UpdatePoints(b);} curve.ResetBoundingBox();
  }

  private AdjustOuterSlur(inner:FloatingCurveLike[],unit:number){const curve=this.m_currentCurve!,slur=this.m_currentSlur!;const q=p4(curve),b=new BezierCurve(q[0],q[1],q[2],q[3]);slur.InitBezierControlSides(b,curve.GetDir());b.UpdateControlPointParams();const o=opts(this.m_doc as any),m=o.m_slurMargin.GetValue()*unit,f=o.m_slurEndpointFlexibility.GetValue(),s=o.m_slurSymmetry.GetValue();const [l,r]=this.CalcEndPointShiftWithInner(b,inner,f,m);this.ApplyEndPointShift(b,l,r);const a=this.CalcControlPointShift(b,inner,s,m);b.SetLeftControlHeight(b.GetLeftControlHeight()+a.leftShift);b.SetRightControlHeight(b.GetRightControlHeight()+a.rightShift);b.UpdateControlPoints();curve.UpdatePoints(b);if(curve.GetDir()!==CURVEDIR_mixed){this.AdjustSlurShape(b,curve.GetDir(),unit);curve.UpdatePoints(b);}curve.ResetBoundingBox();}

  private FilterSpannedElements(b:BezierCurve,margin:number){
    if(b.p1.x>=b.p2.x)return; const dist=b.p2.x-b.p1.x, curve=this.m_currentCurve!;
    for(const e of curve.GetSpannedElements()){
      if(e.m_discarded)continue;
      const discard={value:false}; const inter=curve.CalcDirectionalAdjustment(e.m_boundingBox,e.m_isBelow,discard,margin);
      const mid=(e.m_boundingBox.GetSelfLeft()+e.m_boundingBox.GetSelfRight())/2; const ratio=(mid-b.p1.x)/dist;
      const h=Math.abs(e.m_boundingBox.GetSelfTop()-e.m_boundingBox.GetSelfBottom());
      if(inter>h+4*margin){
        const obj=(e as any).m_boundingBox as any;
        if(ratio<.05){
          const layer=obj && typeof obj.GetOriginalLayerN==='function' ? obj.GetOriginalLayerN() : undefined;
          const start=this.m_currentSlur!.GetStart?.(); const startLayer=start && typeof start.GetOriginalLayerN==='function' ? start.GetOriginalLayerN() : undefined;
          e.m_discarded = layer !== undefined && startLayer !== undefined ? layer !== startLayer : true;
        } else if(ratio>.95){
          const layer=obj && typeof obj.GetOriginalLayerN==='function' ? obj.GetOriginalLayerN() : undefined;
          const end=this.m_currentSlur!.GetEnd?.(); const endLayer=end && typeof end.GetOriginalLayerN==='function' ? end.GetOriginalLayerN() : undefined;
          e.m_discarded = layer !== undefined && endLayer !== undefined ? layer !== endLayer : true;
        }
        if(obj && typeof obj.Is==='function' && obj.Is(ClassId.TUPLET_NUM)) e.m_discarded=true;
      }
    }
  }
  private DetectCollisionsNearEnd(b:BezierCurve,margin:number):NearEndCollision{const n={metricAtStart:0,metricAtEnd:0,endPointsAdjusted:false};if(b.p1.x>=b.p2.x)return n;const pts=[b.p1,b.c1,b.c2,b.p2],curve=this.m_currentCurve!;for(const e of curve.GetSpannedElements()){if(e.m_discarded)continue;const d={value:false};const [il,ir]=curve.CalcDirectionalLeftRightAdjustment(e.m_boundingBox,e.m_isBelow,d,margin);if(il>0||ir>0){let x=Math.max(b.p1.x,e.m_boundingBox.GetSelfLeft()),py=BoundingBox.CalcBezierAtPosition(pts,x),pl=new Point(x,py),ds=Math.max(BoundingBox.CalcDistance(b.p1,pl),1),de=Math.max(BoundingBox.CalcDistance(b.p2,pl),1);n.metricAtStart=Math.max(il/ds,n.metricAtStart);n.metricAtEnd=Math.max(il/de,n.metricAtEnd);x=Math.min(b.p2.x,e.m_boundingBox.GetSelfRight());py=BoundingBox.CalcBezierAtPosition(pts,x);pl=new Point(x,py);ds=Math.max(BoundingBox.CalcDistance(b.p1,pl),1);de=Math.max(BoundingBox.CalcDistance(b.p2,pl),1);n.metricAtStart=Math.max(ir/ds,n.metricAtStart);n.metricAtEnd=Math.max(ir/de,n.metricAtEnd);}}return n;}
  private CalcEndPointShift(b:BezierCurve,flex:number,margin:number):[number,number]{
    let l=0,r=0; if(b.p1.x>=b.p2.x)return[0,0]; const dist=b.p2.x-b.p1.x,curve=this.m_currentCurve!;
    for(const e of curve.GetSpannedElements()){ if(e.m_discarded)continue; const d={value:false}; const [il,ir]=curve.CalcDirectionalLeftRightAdjustment(e.m_boundingBox,e.m_isBelow,d,margin); if(d.value){e.m_discarded=true;continue;}
      if(il||ir){ let x=Math.max(b.p1.x,e.m_boundingBox.GetSelfLeft()),ratio=Math.fround((x-b.p1.x)/dist); const ll={value:l},rr={value:r}; this.ShiftEndPoints(ll,rr,ratio,il,flex,e.m_isBelow,curve.m_spanningType); l=ll.value;r=rr.value;
        x=Math.min(b.p2.x,e.m_boundingBox.GetSelfRight()); ratio=Math.fround((x-b.p1.x)/dist); const l2={value:l},r2={value:r}; this.ShiftEndPoints(l2,r2,ratio,ir,flex,e.m_isBelow,curve.m_spanningType); l=l2.value;r=r2.value;
      }
    } return[l,r];
  }
  private ApplyEndPointShift(b:BezierCurve,l:number,r:number){if(!l&&!r)return;const sl=b.IsLeftControlAbove()?1:-1,sr=b.IsRightControlAbove()?1:-1;b.p1.y+=sl*l;b.p2.y+=sr*r;if(b.p1.x!==b.p2.x){const [u,v]=b.EstimateCurveParamForControlPoints();const d1=sl*(1-u)*l+sr*u*r;const d2=sl*(1-v)*l+sr*v*r;b.c1.y=Math.trunc(b.c1.y+d1);b.c2.y=Math.trunc(b.c2.y+d2);}b.UpdateControlPointParams();this.m_currentCurve!.UpdatePoints(b);}
  private AdjustSlurFromBulge(b:BezierCurve,unit:number){if(b.p1.x>=b.p2.x)return;let bulge=(this.m_currentSlur!.GetBulge?.()??[]).filter(e=>e[0]>0&&e[1]>0&&e[1]<100);let lmin=.66,lmax=.33;for(const e of bulge){const x=e[1]/100;lmin=Math.min(x,lmin);lmax=Math.max(x,lmax);}lmin/=2;lmax=1-(1-lmax)/2;const xmin=(1-lmin)*b.p1.x+lmin*b.p2.x,xmax=(1-lmax)*b.p1.x+lmax*b.p2.x;b.SetLeftControlOffset(xmin-b.p1.x);b.SetRightControlOffset(b.p2.x-xmax);b.UpdateControlPoints();this.m_currentCurve!.UpdatePoints(b);const pts=[b.p1,b.c1,b.c2,b.p2],cs:ControlPointConstraint[]=[];for(const e of bulge){const lam=e[1]/100,x=(1-lam)*b.p1.x+lam*b.p2.x,t=BoundingBox.CalcBezierParamAtPosition(pts,x);cs.push({a:3*(1-t)**2*t,b:3*(1-t)*t**2,c:e[0]*unit});}const [ls,rs]=this.SolveControlPointConstraints(cs);b.SetLeftControlHeight(b.GetLeftControlHeight()+ls);b.SetRightControlHeight(b.GetRightControlHeight()+rs);b.UpdateControlPoints();this.m_currentCurve!.UpdatePoints(b);this.AdjustSlurShape(b,this.m_currentCurve!.GetDir(),unit);this.m_currentCurve!.UpdatePoints(b);this.m_currentCurve!.ResetBoundingBox();}
  private AllowControlOffsetAdjustment(b:BezierCurve,sym:number,unit:number){return BoundingBox.CalcDistance(b.p1,b.p2)>sym*40*unit;}
  private CalcControlPointOffset(b:BezierCurve,margin:number):[boolean,number,number]{if(b.p1.x>=b.p2.x)return[false,0,0];let ls=Math.abs(BoundingBox.CalcSlope(b.p1,b.c1)),rs=Math.abs(BoundingBox.CalcSlope(b.p2,b.c2));for(const e of this.m_currentCurve!.GetSpannedElements()){if(e.m_discarded)continue;const y=e.m_isBelow?e.m_boundingBox.GetSelfTop():e.m_boundingBox.GetSelfBottom(),pl=new Point(e.m_boundingBox.GetSelfLeft(),y),pr=new Point(e.m_boundingBox.GetSelfRight(),y);if(pl.x>b.p1.x+margin&&b.IsLeftControlAbove()===e.m_isBelow){let s=BoundingBox.CalcSlope(b.p1,pl);if(s>0&&b.IsLeftControlAbove())ls=Math.max(ls,this.RotateSlope(s,10,2.5,true));if(s<0&&!b.IsLeftControlAbove())ls=Math.max(ls,this.RotateSlope(-s,10,2.5,true));}if(pr.x<b.p2.x-margin&&b.IsRightControlAbove()===e.m_isBelow){let s=BoundingBox.CalcSlope(b.p2,pr);if(s<0&&b.IsRightControlAbove())rs=Math.max(rs,this.RotateSlope(-s,10,2.5,true));if(s>0&&!b.IsRightControlAbove())rs=Math.max(rs,this.RotateSlope(s,10,2.5,true));}}if(!ls||!rs)return[false,0,0];const min=Math.trunc((b.p2.x-b.p1.x)/20);const lo=b.GetLeftControlOffset()>0?Math.max(min,Math.trunc(Math.abs(b.GetLeftControlHeight())/ls)):min;const ro=b.GetRightControlOffset()>0?Math.max(min,Math.trunc(Math.abs(b.GetRightControlHeight())/rs)):min;return[true,lo,ro];}
  private CalcControlPointVerticalShift(b:BezierCurve,sym:number,margin:number):ControlPointAdjustment{const a={leftShift:0,rightShift:0,moveUpwards:false,requestedStaffSpace:0};if(b.p1.x>=b.p2.x)return a;const above:ControlPointConstraint[]=[],below:ControlPointConstraint[]=[];let ma=0,mb=0;const dist=b.p2.x-b.p1.x,pts=[b.p1,b.c1,b.c2,b.p2];for(const e of this.m_currentCurve!.GetSpannedElements()){if(e.m_discarded)continue;let d={value:false};const [il,ir]=this.m_currentCurve!.CalcDirectionalLeftRightAdjustment(e.m_boundingBox,e.m_isBelow,d,margin);if(d.value){e.m_discarded=true;continue;}const cs=e.m_isBelow?below:above;let max=e.m_isBelow?mb:ma;if(il>0||ir>0){for(const x of [Math.max(b.p1.x,e.m_boundingBox.GetSelfLeft()),Math.min(b.p2.x,e.m_boundingBox.GetSelfRight())]){const inter=x===Math.max(b.p1.x,e.m_boundingBox.GetSelfLeft())?il:ir;const ratio=Math.fround((x-b.p1.x)/dist);if(Math.abs(.5-ratio)<.45&&inter>0){const t=BoundingBox.CalcBezierParamAtPosition(pts,x);cs.push({a:3*(1-t)**2*t,b:3*(1-t)*t**2,c:inter});max=Math.max(max,inter);}}}if(e.m_isBelow)mb=max;else ma=max;}
    const [ls,rs]=ma>mb?this.SolveControlPointConstraints(above,sym):this.SolveControlPointConstraints(below,sym);a.leftShift=ls;a.rightShift=rs;a.moveUpwards=!(ma>mb);if(b.IsLeftControlAbove()&&!b.IsRightControlAbove())a.requestedStaffSpace=Math.max(b.p1.y-b.p2.y+6*margin,0);else if(!b.IsLeftControlAbove()&&b.IsRightControlAbove())a.requestedStaffSpace=Math.max(b.p2.y-b.p1.y+6*margin,0);if(ma>0&&mb>0)a.requestedStaffSpace=Math.max(a.requestedStaffSpace,ma+mb);return a;}
  private SolveControlPointConstraints(cs:ControlPointConstraint[],sym=0):[number,number]{if(!cs.length)return[0,0];let ws=0,wa=0;for(const c of cs){const w=c.c/Math.hypot(c.a,c.b);wa+=w*Math.atan(c.b/c.a);ws+=w;}let ang=wa/ws;ang=Math.max(sym*Math.PI/4,ang);ang=Math.min((2-sym)*Math.PI/4,ang);const slope=Math.tan(ang);let x=0;for(const c of cs)x=Math.max(x,c.c/(c.a+slope*c.b));return[Math.trunc(x),Math.trunc(slope*x)];}
  private AdjustSlurShape(b:BezierCurve,dir:number,unit:number){if(b.p1.x>=b.p2.x)return;const angle=Math.fround(Math.atan2(b.p2.y-b.p1.y,b.p2.x-b.p1.x));b.Rotate(-angle,b.p1);b.UpdateControlPointParams();const sign=dir===CURVEDIR_above?1:-1,minA=this.GetMinControlPointAngle(b,angle/Math.PI*180,unit),mid=new Point(Math.trunc((b.p1.x+b.p2.x)/2),Math.trunc((b.p1.y+b.p2.y)/2)+sign*6*unit),il=b.c1.x<=b.p1.x,ir=b.c2.x>=b.p2.x;let sl=BoundingBox.CalcSlope(b.p1,b.c1),sr=BoundingBox.CalcSlope(b.p2,b.c2),base=BoundingBox.CalcSlope(b.p1,b.p2);if(dir===CURVEDIR_above){sl=Math.max(sl,Math.min(this.RotateSlope(base,minA,1,true),BoundingBox.CalcSlope(b.p1,mid)));sr=Math.min(sr,Math.max(this.RotateSlope(base,minA,1,false),BoundingBox.CalcSlope(b.p2,mid)));}else if(dir===CURVEDIR_below){sl=Math.min(sl,Math.max(this.RotateSlope(base,minA,1,false),BoundingBox.CalcSlope(b.p1,mid)));sr=Math.max(sr,Math.min(this.RotateSlope(base,minA,1,true),BoundingBox.CalcSlope(b.p2,mid)));}if(!il)b.SetLeftControlHeight(Math.trunc(sl*sign*b.GetLeftControlOffset()));if(!ir)b.SetRightControlHeight(Math.trunc(sr*-sign*b.GetRightControlOffset()));b.UpdateControlPoints();if(dir===CURVEDIR_above){sl=Math.max(sl,this.RotateSlope(BoundingBox.CalcSlope(b.p1,b.c2),3,10,true));sr=Math.min(sr,this.RotateSlope(BoundingBox.CalcSlope(b.p2,b.c1),3,10,false));}else if(dir===CURVEDIR_below){sl=Math.min(sl,this.RotateSlope(BoundingBox.CalcSlope(b.p1,b.c2),3,10,false));sr=Math.max(sr,this.RotateSlope(BoundingBox.CalcSlope(b.p2,b.c1),3,10,true));}if(!il)b.SetLeftControlHeight(Math.trunc(sl*sign*b.GetLeftControlOffset()));if(!ir)b.SetRightControlHeight(Math.trunc(sr*-sign*b.GetRightControlOffset()));b.UpdateControlPoints();b.Rotate(angle,b.p1);b.c1.x=Math.max(b.p1.x,b.c1.x);b.c2.x=Math.max(b.c1.x,b.c2.x);b.c2.x=Math.min(b.p2.x,b.c2.x);b.c1.x=Math.min(b.c2.x,b.c1.x);b.UpdateControlPointParams();}
  private CalcControlPointShift(b:BezierCurve,inner:FloatingCurveLike[],sym:number,margin:number):ControlPointAdjustment{const a={leftShift:0,rightShift:0,moveUpwards:false,requestedStaffSpace:0};if(b.p1.x>=b.p2.x)return a;const dist=b.p2.x-b.p1.x,below=this.m_currentCurve!.GetDir()===CURVEDIR_above,sign=below?1:-1,pts=[b.p1,b.c1,b.c2,b.p2],cs:ControlPointConstraint[]=[];for(const c of inner){const ip=p4(c);for(let k=0;k<=4;k++){const p=BoundingBox.CalcPointAtBezier(ip,.25*k);if(p.x>=b.p1.x&&p.x<=b.p2.x){const inter=Math.trunc((p.y-BoundingBox.CalcBezierAtPosition(pts,p.x))*sign+margin),ratio=Math.fround((p.x-b.p1.x)/dist);if(Math.abs(.5-ratio)<.45&&inter>0){const t=BoundingBox.CalcBezierParamAtPosition(pts,p.x);cs.push({a:3*(1-t)**2*t,b:3*(1-t)*t**2,c:inter});}}}}[a.leftShift,a.rightShift]=this.SolveControlPointConstraints(cs,sym);return a;}
  private CalcEndPointShiftWithInner(b:BezierCurve,inner:FloatingCurveLike[],flex:number,margin:number):[number,number]{
    if(b.p1.x>=b.p2.x)return[0,0]; let l=0,r=0; const dist=b.p2.x-b.p1.x; const below=this.m_currentCurve!.GetDir()===CURVEDIR_above; const sign=below?1:-1; const pts=[b.p1,b.c1,b.c2,b.p2];
    for(const c of inner){ const ip=p4(c); const mid=BoundingBox.CalcPointAtBezier(ip,.5); for(const pair of [[ip[0].x,ip[0].y],[mid.x,mid.y],[ip[3].x,ip[3].y]] as Array<[number,number]>){ const x=pair[0],y=pair[1]; if(x>=b.p1.x&&x<=b.p2.x){ const yy=BoundingBox.CalcBezierAtPosition(pts,x); const inter=Math.trunc((y-yy)*sign+1.5*margin); if(inter>0){ const ratio=Math.fround((x-b.p1.x)/dist); const box={value:0}; const box2={value:0}; this.ShiftEndPoints(box,box2,ratio,inter,flex,below,this.m_currentCurve!.m_spanningType); l=Math.max(l,box.value); r=Math.max(r,box2.value); } } } }
    return[l,r];
  }
  private ShiftEndPoints(lref:any,rref:any,ratio:number,intersection:number,flex:number,isBelow:boolean,span:any){intersection=Math.trunc(intersection);let [full,partial]=this.CalcShiftRadii(true,flex,span);if(ratio<partial&&(this.m_currentSlur!.HasEndpointAboveStart()===isBelow)){if(ratio>full)intersection=Math.trunc(intersection*this.CalcQuadraticInterpolation(partial,full,ratio));lref.value!==undefined?lref.value=Math.max(lref.value,intersection):null;}else if(Array.isArray(lref)){/* unreachable */}
    [full,partial]=this.CalcShiftRadii(false,flex,span);if(ratio>1-partial&&(this.m_currentSlur!.HasEndpointAboveEnd()===isBelow)){if(ratio<1-full)intersection=Math.trunc(intersection*this.CalcQuadraticInterpolation(1-partial,1-full,ratio));rref.value!==undefined?rref.value=Math.max(rref.value,intersection):null;}
  }
  private CalcShiftRadii(left:boolean,flex:number,span:any):[number,number]{if(left&&(span===SpanningType.SPANNING_MIDDLE||span===SpanningType.SPANNING_END))flex=1;if(!left&&(span===SpanningType.SPANNING_START||span===SpanningType.SPANNING_MIDDLE))flex=1;const f=.05+flex*.15;return[f,f*3];}
  private CalcQuadraticInterpolation(z:number,o:number,a:number){if(z===o)throw new Error('zeroAt must differ from oneAt');const A=1/(o-z),B=z/(z-o);return(A*a+B)**2;}
  private RotateSlope(s:number,degrees:number,bound:number,up:boolean){if(up&&s>=bound)return s*2;if(!up&&s<=-bound)return s*2;const sign=up?1:-1;return Math.tan(Math.atan(s)+sign*Math.PI*degrees/180);}
  private GetMinControlPointAngle(b:BezierCurve,angle:number,unit:number){angle=Math.abs(Math.fround(angle));const distance=(b.p2.x-b.p1.x)/unit;let inc=Math.min(angle/4,15),factor=1-(distance-8)/8;factor=Math.min(Math.max(factor,0),1);if(b.c1.x<b.p1.x||2*b.c1.x>b.p1.x+b.p2.x)inc=0;if(b.c2.x>b.p2.x||2*b.c2.x<b.p1.x+b.p2.x)inc=0;return Math.fround(30+inc*factor);}
}
