/** Pure-TypeScript port of the option value classes from vrv/options.{h,cpp}. */

export const DEFAULT_SCALE = 100;
export const MIN_SCALE = 1;
export const MAX_SCALE = 1000;
export const TEMP_LYRIC_LINE_SPACE = 5.0;
export const TEMP_KEYSIG_STEP = 0.4;
export const TEMP_KEYSIG_NATURAL_STEP = 0.6;
const dashedBarLineLengthDefault = 8.0 / 7.0;

export enum OptionBreaks { none = 0, auto, line, smart, encoded }
export enum OptionCondense { none = 0, auto, all, encoded }
export enum OptionDurationEq { brevis = 0, semibrevis, minima }
export enum OptionFontFallback { Leipzig = 0, Bravura }
export enum OptionFooter { none = 0, auto, encoded, always }
export enum OptionHeader { none = 0, auto, encoded }
export enum OptionLigatureObl { auto = 0, straight, curved }
export enum OptionMensuralResp { none = 0, auto, selection }
export enum OptionMultiRestStyle { auto = 0, default, block, symbols }
export enum OptionSystemDivider { none = 0, auto, left, left_right }
export enum OptionSmuflTextFont { embedded = 0, linked, none }
export enum JsonSource { String, FilePath }
export enum OptionsCategory { None, Base, General, Json, Layout, Mensural, Margins, Midi, Neume, Selectors, Full }

export type DataStaffrel = 0 | 1 | 2 | 3 | 4;
export const STAFFREL_NONE = 0 as const;
export const STAFFREL_above = 1 as const;
export const STAFFREL_below = 2 as const;
export const STAFFREL_between = 3 as const;
export const STAFFREL_within = 4 as const;

export interface JsonObject { [key: string]: JsonValue; }
export type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject;

function isValidInteger(value: string): boolean {
    return /^[+-]?\d+$/.test(value.trim());
}
function isValidDouble(value: string): boolean {
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim());
}
function trunc(value: number): number { return value < 0 ? Math.ceil(value) : Math.floor(value); }

export class Option {
    protected m_title = "";
    protected m_description = "";
    private m_key = "";
    private m_shortOption = "";
    private m_isCmdOnly = false;

    protected unsupported(type: string): false { console.error(`Unsupported type ${type} for ${this.m_key}`); return false; }
    setKey(key: string): void { this.m_key = key; }
    getKey(): string { return this.m_key; }
    setInfo(title: string, description: string): void { this.m_title = title; this.m_description = description; }
    getTitle(): string { return this.m_title; }
    getDescription(): string { return this.m_description; }
    setShortOption(shortOption: string | number, isCmdOnly: boolean): void {
        this.m_shortOption = typeof shortOption === "number" ? String.fromCharCode(shortOption) : shortOption;
        this.m_isCmdOnly = isCmdOnly;
    }
    getShortOption(): string { return this.m_shortOption; }
    isCmdOnly(): boolean { return this.m_isCmdOnly; }
    isArgumentRequired(): boolean { return true; }
    GetValue(): any { return (this as any).getValue?.(); }
    GetDefault(): any { return (this as any).getDefault?.(); }
    setValueBool(_value: boolean): boolean { return this.unsupported("bool"); }
    setValueDbl(_value: number): boolean { return this.unsupported("double"); }
    setValueArray(_values: string[]): boolean { return this.unsupported("array"); }
    setValue(_value: string): boolean { return this.unsupported("string"); }
    getStrValue(): string { throw new Error("abstract Option::getStrValue"); }
    getDefaultStrValue(): string { throw new Error("abstract Option::getDefaultStrValue"); }
    reset(): void { throw new Error("abstract Option::reset"); }
    isSet(): boolean { throw new Error("abstract Option::isSet"); }
    copyTo(_option: Option): void { throw new Error("abstract Option::copyTo"); }
    toJson(): JsonObject {
        const result: JsonObject = { title: this.getTitle(), description: this.getDescription() };
        if (this instanceof OptionBool) result.type = "bool", result.default = this.getDefault();
        else if (this instanceof OptionDbl) { result.type = "double"; result.default = this.getDefault(); result.min = this.getMin(); result.max = this.getMax(); }
        else if (this instanceof OptionInt) { result.type = "int"; result.default = this.getDefault(); result.min = this.getMin(); result.max = this.getMax(); }
        else if (this instanceof OptionString) { result.type = "std::string"; result.default = this.getDefault(); }
        else if (this instanceof OptionArray) { result.type = "array"; result.default = this.getDefault(); }
        else if (this instanceof OptionIntMap) { result.type = "std::string-list"; result.default = this.getDefaultStrValue(); result.values = this.getStrValues(false); }
        if (this.isCmdOnly()) result.cmdOnly = true;
        if (this.getShortOption()) result.shortOption = this.getShortOption();
        return result;
    }
}

export class OptionBool extends Option {
    private m_value = false;
    private m_defaultValue = false;
    init(defaultValue: boolean): void { this.m_value = defaultValue; this.m_defaultValue = defaultValue; }
    setValueBool(value: boolean): boolean { return this.setValue(value); }
    setValueDbl(value: number): boolean { return this.setValue(Boolean(value)); }
    setValue(value: string | boolean): boolean { this.m_value = typeof value === "boolean" ? value : value === "true"; return true; }
    getStrValue(): string { return this.m_value ? "true" : "false"; }
    getDefaultStrValue(): string { return this.m_defaultValue ? "true" : "false"; }
    getValue(): boolean { return this.m_value; }
    getDefault(): boolean { return this.m_defaultValue; }
    reset(): void { this.m_value = this.m_defaultValue; }
    isSet(): boolean { return this.m_value !== this.m_defaultValue; }
    isArgumentRequired(): boolean { return false; }
    copyTo(option: Option): void { const child = option as OptionBool; child.m_value = this.m_value; child.m_defaultValue = this.m_defaultValue; child.setKey(this.getKey()); child.setInfo(this.getTitle(), this.getDescription()); }
}

export class OptionDbl extends Option {
    private m_value = 0;
    private m_defaultValue = 0;
    private m_minValue = 0;
    private m_maxValue = 0;
    private m_definitionFactor = false;
    init(defaultValue: number, minValue: number, maxValue: number, definitionFactor = false): void { this.m_value = defaultValue; this.m_defaultValue = defaultValue; this.m_minValue = minValue; this.m_maxValue = maxValue; this.m_definitionFactor = definitionFactor; }
    setValueDbl(value: number): boolean { return this.setValue(value); }
    setValue(value: string | number): boolean { const number = typeof value === "number" ? value : (isValidDouble(value) ? Number(value) : NaN); if (Number.isNaN(number)) return false; return this.setNumericValue(number); }
    private setNumericValue(value: number): boolean { if (value < this.m_minValue || value > this.m_maxValue) return false; this.m_value = value; return true; }
    getStrValue(): string { return this.m_value.toFixed(6); }
    getDefaultStrValue(): string { return this.m_defaultValue.toFixed(6); }
    getValue(): number { return this.m_definitionFactor ? this.m_value * 10 : this.m_value; }
    getUnfactoredValue(): number { return this.m_value; }
    getDefault(): number { return this.m_defaultValue; }
    getMin(): number { return this.m_minValue; }
    getMax(): number { return this.m_maxValue; }
    reset(): void { this.m_value = this.m_defaultValue; }
    isSet(): boolean { return this.m_value !== this.m_defaultValue; }
    copyTo(option: Option): void { const c = option as OptionDbl; c.m_value=this.m_value;c.m_defaultValue=this.m_defaultValue;c.m_minValue=this.m_minValue;c.m_maxValue=this.m_maxValue;c.m_definitionFactor=this.m_definitionFactor; }
}

export class OptionInt extends Option {
    private m_value = 0;
    private m_defaultValue = 0;
    private m_minValue = 0;
    private m_maxValue = 0;
    private m_definitionFactor = false;
    init(defaultValue: number, minValue: number, maxValue: number, definitionFactor = false): void { this.m_value=defaultValue;this.m_defaultValue=defaultValue;this.m_minValue=minValue;this.m_maxValue=maxValue;this.m_definitionFactor=definitionFactor; }
    setValueDbl(value: number): boolean { return this.setValue(trunc(value)); }
    setValue(value: string | number): boolean { const number = typeof value === "number" ? value : (isValidInteger(value) ? trunc(Number(value)) : NaN); if (Number.isNaN(number)) return false; if(number<this.m_minValue||number>this.m_maxValue)return false; this.m_value=number;return true; }
    getStrValue(): string { return String(this.m_value); }
    getDefaultStrValue(): string { return String(this.m_defaultValue); }
    getValue(): number { return this.m_definitionFactor ? this.m_value * 10 : this.m_value; }
    getUnfactoredValue(): number { return this.m_value; }
    getDefault(): number { return this.m_defaultValue; }
    getMin(): number { return this.m_minValue; }
    getMax(): number { return this.m_maxValue; }
    reset(): void { this.m_value=this.m_defaultValue; }
    isSet(): boolean { return this.m_value!==this.m_defaultValue; }
    copyTo(option: Option): void { const c=option as OptionInt;c.m_value=this.m_value;c.m_defaultValue=this.m_defaultValue;c.m_minValue=this.m_minValue;c.m_maxValue=this.m_maxValue;c.m_definitionFactor=this.m_definitionFactor; }
}

export class OptionString extends Option {
    private m_value=""; private m_defaultValue="";
    init(defaultValue: string): void { this.m_value=defaultValue;this.m_defaultValue=defaultValue; }
    setValue(value: string): boolean { this.m_value=value;return true; }
    getValue(): string{return this.m_value;} getDefault():string{return this.m_defaultValue;}
    getStrValue():string{return this.m_value;} getDefaultStrValue():string{return this.m_defaultValue;}
    reset():void{this.m_value=this.m_defaultValue;} isSet():boolean{return this.m_value!==this.m_defaultValue;}
    copyTo(option: Option): void { const c=option as OptionString;c.m_value=this.m_value;c.m_defaultValue=this.m_defaultValue; }
}

export class OptionArray extends Option {
    private m_values:string[]=[]; private m_defaultValues:string[]=[];
    init():void{this.m_values=[];this.m_defaultValues=[];}
    setValueArray(values:string[]):boolean{this.m_values=[...values];return true;}
    setValue(value:string):boolean{if(value.length)this.m_values.push(value);return true;}
    setValueVector(values:string[]):boolean{this.m_values=values.filter(v=>v.length>0);return true;}
    getValue():string[]{return [...this.m_values];} getDefault():string[]{return [...this.m_defaultValues];}
    getStrValue():string{return this.getStr(this.m_values);} getDefaultStrValue():string{return this.getStr(this.m_defaultValues);}
    private getStr(values:string[]):string{return values.map(v=>`"${v}"`).join(", ");}
    reset():void{this.m_values=[];} isSet():boolean{return this.m_values.length>0;}
    copyTo(option:Option):void{const c=option as OptionArray;c.m_values=[...this.m_values];c.m_defaultValues=[...this.m_defaultValues];}
}

export class OptionIntMap extends Option {
    private m_values = new Map<number,string>(); private m_value=0; private m_defaultValue=0;
    init(defaultValue:number, values:Map<number,string>|Record<number|string,string>):void { this.m_value=defaultValue;this.m_defaultValue=defaultValue;this.m_values=values instanceof Map?new Map(values):new Map(Object.entries(values).map(([k,v])=>[Number(k),v])); }
    setValue(value:string|number):boolean { if(typeof value === "string"){for(const [k,v] of this.m_values)if(v===value){this.m_value=k;return true;}return false;} if(!this.m_values.has(value))return false;this.m_value=value;return true; }
    getValue():number{return this.m_value;} getDefault():number{return this.m_defaultValue;}
    getStrValue():string{return this.m_values.get(this.m_value) ?? "";} getDefaultStrValue():string{return this.m_values.get(this.m_defaultValue) ?? "";}
    getStrValues(withoutDefault:boolean):string[]{return [...this.m_values.entries()].filter(([k])=>!(withoutDefault&&k===this.m_defaultValue)).map(([,v])=>v);}
    getStrValuesAsStr(withoutDefault:boolean):string{return this.getStrValues(withoutDefault).map(v=>`"${v}"`).join(", ");}
    reset():void{this.m_value=this.m_defaultValue;} isSet():boolean{return this.m_value!==this.m_defaultValue;}
    copyTo(option:Option):void{const c=option as OptionIntMap;c.m_values=new Map(this.m_values);c.m_value=this.m_value;c.m_defaultValue=this.m_defaultValue;}
}

export class OptionStaffrel extends Option {
    private m_value:DataStaffrel = STAFFREL_NONE; private m_defaultValue:DataStaffrel = STAFFREL_NONE;
    init(defaultValue:DataStaffrel):void{this.m_value=defaultValue;this.m_defaultValue=defaultValue;}
    setValue(value:string):boolean{const map:Record<string,DataStaffrel>={above:STAFFREL_above,below:STAFFREL_below,between:STAFFREL_between,within:STAFFREL_within};const v=map[value];if(v===undefined)return false;this.m_value=v;return true;}
    getStrValue():string{return ({1:"above",2:"below",3:"between",4:"within"} as Record<number,string>)[this.m_value]??"";}
    getDefaultStrValue():string{return ({1:"above",2:"below",3:"between",4:"within"} as Record<number,string>)[this.m_defaultValue]??"";}
    getValueAlternate():DataStaffrel{return this.m_value;} getDefaultAlternate():DataStaffrel{return this.m_defaultValue;}
    reset():void{this.m_value=this.m_defaultValue;} isSet():boolean{return this.m_value!==this.m_defaultValue;}
    copyTo(option:Option):void{const c=option as OptionStaffrel;c.m_value=this.m_value;c.m_defaultValue=this.m_defaultValue;}
}

export class OptionJson extends Option {
    private m_source:JsonSource = JsonSource.String; private m_values:JsonValue = {}; private m_defaultValues:JsonValue = {};
    private static m_fileLoader: ((path:string) => string | null) | null = null;
    init(source:JsonSource, defaultValue:string):void{this.m_source=source;this.readJson(defaultValue,true);}
    getSource():JsonSource{return this.m_source;} getValue(getDefault=false):JsonObject{return (getDefault?this.m_defaultValues:this.m_values) as JsonObject;}
    static setFileLoader(loader: ((path:string) => string | null) | null): void { OptionJson.m_fileLoader = loader; }
    setValue(value:string):boolean{if(this.m_source===JsonSource.FilePath && value.length===0){this.m_values={};return true;} const ok=this.readJson(value,false); if(!ok){if(this.m_source===JsonSource.String) LogError("Input json is not valid or contains errors"); else LogError("Input file '%s' is not valid or contains errors", value);} return ok;}
    getStrValue():string{return JSON.stringify(this.m_values);} getDefaultStrValue():string{return JSON.stringify(this.m_defaultValues);}
    reset():void{this.m_values={};} isSet():boolean{return this.getStrValue()!==this.getDefaultStrValue();}
    hasValue(path:string[]):boolean{return this.pathValue(this.m_values,path)!==undefined||this.pathValue(this.m_defaultValues,path)!==undefined;}
    getIntValue(path:string[],getDefault=false):number{return Math.trunc(this.getDblValue(path,getDefault));}
    getDblValue(path:string[],getDefault=false):number{const v=this.pathValue(getDefault?this.m_defaultValues:this.m_values,path);const fallback=!getDefault&&v===undefined?this.pathValue(this.m_defaultValues,path):v;return typeof fallback==="number"?fallback:0;}
    getStrValueAt(path:string[],getDefault=false):string{const v=this.pathValue(getDefault?this.m_defaultValues:this.m_values,path);const fallback=!getDefault&&v===undefined?this.pathValue(this.m_defaultValues,path):v;return typeof fallback==="string"?fallback:"";}
    updateNodeValue(path:string[],value:string):boolean{
        if(!path.length)return false;
        const container=this.findContainer(this.m_values,path.slice(0,-1));
        if(!container)return false;
        try{
            const parsed=JSON.parse(value) as JsonValue;
            if(Array.isArray(container)){
                const index=trunc(Number(path[path.length-1]));
                if(!Number.isFinite(index)||index<0||index>=container.length)return false;
                container[index]=parsed;
            } else {
                container[path[path.length-1]]=parsed;
            }
            return true;
        }catch{return false;}
    }
    getKeys():Set<string>{return new Set(this.objectKeys(this.m_values));}
    getKeysByNode(nodeName:string,jsonNodePath:string[]):Set<string>{const node=this.findNodeByName(this.m_values,nodeName,jsonNodePath);return new Set(this.objectKeys(node??this.m_values));}
    private readJson(input:string, toDefault:boolean):boolean{try{let text=input;if(this.m_source===JsonSource.FilePath){const loader=OptionJson.m_fileLoader;if(!loader)return false;const loaded=loader(input);if(loaded===null)return false;text=loaded;}const parsed=JSON.parse(text) as JsonValue;if(toDefault)this.m_defaultValues=parsed;else this.m_values=parsed;return typeof parsed==="object"&&parsed!==null&&!Array.isArray(parsed);}catch{return false;}}
    private pathValue(root:JsonValue,path:string[]):JsonValue|undefined{let cur:JsonValue=root;for(const p of path){if(Array.isArray(cur)){if(!isValidInteger(p))return undefined;cur=cur[trunc(Number(p))];}else if(cur&&typeof cur==="object"){cur=(cur as JsonObject)[p];}else return undefined;if(cur===undefined)return undefined;}return cur;}
    private findContainer(root:JsonValue,path:string[]):JsonObject|JsonValue[]|undefined{let cur:JsonValue=root;for(const p of path){if(Array.isArray(cur))cur=cur[trunc(Number(p))];else if(cur&&typeof cur==="object")cur=(cur as JsonObject)[p];else return undefined;if(cur===undefined)return undefined;}return (Array.isArray(cur)||(cur&&typeof cur==="object"))?cur as JsonObject|JsonValue[]:undefined;}
    private objectKeys(v:JsonValue):string[]{return v&&typeof v==="object"&&!Array.isArray(v)?Object.keys(v as JsonObject):[];}
    private findNodeByName(obj:JsonValue,name:string,path:string[]):JsonObject|undefined{if(!obj||typeof obj!=="object"||Array.isArray(obj))return undefined;for(const [key,val]of Object.entries(obj as JsonObject)){if(val&&typeof val==="object"&&!Array.isArray(val)){if(key===name){path.push(key);return val as JsonObject;}const result=this.findNodeByName(val,name,path);if(result){path.unshift(key);return result;}}}return undefined;}
    copyTo(option:Option):void{const c=option as OptionJson;c.m_source=this.m_source;c.m_values=JSON.parse(JSON.stringify(this.m_values));c.m_defaultValues=JSON.parse(JSON.stringify(this.m_defaultValues));}
}

export class OptionGrp {
    private m_id=""; private m_label=""; private m_options:Option[]=[]; private m_category=OptionsCategory.None;
    setLabel(label:string,id:string):void{this.m_label=label;this.m_id=id;} getLabel():string{return this.m_label;} getId():string{return this.m_id;}
    setCategory(category:OptionsCategory):void{this.m_category=category;} getCategory():OptionsCategory{return this.m_category;}
    addOption(option:Option):void{this.m_options.push(option);} getOptions():Option[]{return this.m_options;}
}

export const optionBreaks = new Map<number,string>([[0,"none"],[1,"auto"],[2,"line"],[3,"smart"],[4,"encoded"]]);
export const optionCondense = new Map<number,string>([[0,"none"],[1,"auto"],[2,"encoded"]]);
export const optionDurationEq = new Map<number,string>([[0,"brevis"],[1,"semibrevis"],[2,"minima"]]);
export const optionFooter = new Map<number,string>([[0,"none"],[1,"auto"],[2,"encoded"],[3,"always"]]);
export const optionHeader = new Map<number,string>([[0,"none"],[1,"auto"],[2,"encoded"]]);
export const optionLigatureOblique = new Map<number,string>([[0,"auto"],[1,"straight"],[2,"curved"]]);
export const optionMensuralResponsiveness = new Map<number,string>([[0,"none"],[1,"auto"],[2,"selection"]]);
export const optionMultiRestStyle = new Map<number,string>([[0,"auto"],[1,"default"],[2,"block"],[3,"symbols"]]);
export const optionSystemDivider = new Map<number,string>([[0,"none"],[1,"auto"],[2,"left"],[3,"left-right"]]);
export const optionSmuflTextFont = new Map<number,string>([[0,"embedded"],[1,"linked"],[2,"none"]]);
// C++ options.h:66-70: keys are SMuFL codepoints (ELISION_regular=E551, narrow=E550, wide=E552, unicode=U+203F).
export const optionElision = new Map<number,string>([[0xE551,"regular"],[0xE550,"narrow"],[0xE552,"wide"],[0x203F,"unicode"]]);
export const optionFontFallback = new Map<number,string>([[0,"Leipzig"],[1,"Bravura"]]);
export const optionPedalStyle = new Map<number,string>([[0,"auto"],[1,"line"],[2,"pedstar"],[3,"altpedstar"]]);


import { FileFormat } from './toolkitdef';
import { LogError, LogWarning } from './vrv';
import { VRV_RESOURCE_DIR, DEFAULT_UNIT, VRV_UNSET } from './vrvdef';
import { EnableLogToBuffer, EnableLog, LogLevel } from './toolkitdef';

export type MapOfStrOptions = Map<string, Option>;

export class Options {
    m_standardOutput: OptionBool;
    m_help: OptionString;
    m_allPages: OptionBool;
    m_inputFrom: OptionString;
    m_logLevel: OptionString;
    m_outfile: OptionString;
    m_page: OptionInt;
    m_resourcePath: OptionString;
    m_scale: OptionInt;
    m_outputTo: OptionString;
    m_version: OptionBool;
    m_xmlIdSeed: OptionInt;
    m_adjustPageHeight: OptionBool;
    m_adjustPageWidth: OptionBool;
    m_breaks: OptionIntMap;
    m_breaksSmartSb: OptionDbl;
    m_condense: OptionIntMap;
    m_condenseFirstPage: OptionBool;
    m_condenseNotLastSystem: OptionBool;
    m_condenseTempoPages: OptionBool;
    m_evenNoteSpacing: OptionBool;
    m_footer: OptionIntMap;
    m_header: OptionIntMap;
    m_humType: OptionBool;
    m_incip: OptionBool;
    m_justifyVertically: OptionBool;
    m_landscape: OptionBool;
    m_minLastJustification: OptionDbl;
    m_mmOutput: OptionBool;
    m_moveScoreDefinitionToStaff: OptionBool;
    m_neumeAsNote: OptionBool;
    m_noJustification: OptionBool;
    m_openControlEvents: OptionBool;
    m_outputFormatRaw: OptionBool;
    m_outputIndent: OptionInt;
    m_outputIndentTab: OptionBool;
    m_outputSmuflXmlEntities: OptionBool;
    m_pageHeight: OptionInt;
    m_pageMarginBottom: OptionInt;
    m_pageMarginLeft: OptionInt;
    m_pageMarginRight: OptionInt;
    m_pageMarginTop: OptionInt;
    m_pageWidth: OptionInt;
    m_pedalStyle: OptionIntMap;
    m_preserveAnalyticalMarkup: OptionBool;
    m_removeIds: OptionBool;
    m_scaleToPageSize: OptionBool;
    m_setLocale: OptionBool;
    m_showHidden: OptionBool;
    m_showRuntime: OptionBool;
    m_shrinkToFit: OptionBool;
    m_smuflTextFont: OptionIntMap;
    m_staccatoCenter: OptionBool;
    m_svgBoundingBoxes: OptionBool;
    m_svgContentBoundingBoxes: OptionBool;
    m_svgCss: OptionString;
    m_svgViewBox: OptionBool;
    m_svgHtml5: OptionBool;
    m_svgFormatRaw: OptionBool;
    m_svgRemoveXlink: OptionBool;
    m_svgAdditionalAttribute: OptionArray;
    m_unit: OptionDbl;
    m_useFacsimile: OptionBool;
    m_usePgFooterForAll: OptionBool;
    m_usePgHeaderForAll: OptionBool;
    m_useBraceGlyph: OptionBool;
    m_xmlIdChecksum: OptionBool;
    m_barLineSeparation: OptionDbl;
    m_barLineWidth: OptionDbl;
    m_beamFrenchStyle: OptionBool;
    m_beamMaxSlope: OptionInt;
    m_beamMixedPreserve: OptionBool;
    m_beamMixedStemMin: OptionDbl;
    m_bracketThickness: OptionDbl;
    m_breaksNoWidow: OptionBool;
    m_dashedBarLineDashLength: OptionDbl;
    m_dashedBarLineGapLength: OptionDbl;
    m_dynamDist: OptionDbl;
    m_dynamSingleGlyphs: OptionBool;
    m_engravingDefaults: OptionJson;
    m_engravingDefaultsFile: OptionJson;
    m_extenderLineMinSpace: OptionDbl;
    m_fingeringScale: OptionDbl;
    m_font: OptionString;
    m_fontAddCustom: OptionArray;
    m_fontFallback: OptionIntMap;
    m_fontLoadAll: OptionBool;
    m_fontTextLiberation: OptionBool;
    m_graceFactor: OptionDbl;
    m_graceRhythmAlign: OptionBool;
    m_graceRightAlign: OptionBool;
    m_hairpinSize: OptionDbl;
    m_hairpinThickness: OptionDbl;
    m_handwrittenFont: OptionArray;
    m_harmDist: OptionDbl;
    m_justificationBraceGroup: OptionDbl;
    m_justificationBracketGroup: OptionDbl;
    m_justificationStaff: OptionDbl;
    m_justificationSystem: OptionDbl;
    m_justificationMaxVertical: OptionDbl;
    m_ledgerLineThickness: OptionDbl;
    m_ledgerLineExtension: OptionDbl;
    m_lyricElision: OptionIntMap;
    m_lyricHeightFactor: OptionDbl;
    m_lyricLineThickness: OptionDbl;
    m_lyricNoStartHyphen: OptionBool;
    m_lyricSize: OptionDbl;
    m_lyricTopMinMargin: OptionDbl;
    m_lyricVerseCollapse: OptionBool;
    m_lyricWordSpace: OptionDbl;
    m_measureMinWidth: OptionInt;
    m_mnumInterval: OptionInt;
    m_multiRestStyle: OptionIntMap;
    m_multiRestThickness: OptionDbl;
    m_octaveAlternativeSymbols: OptionBool;
    m_octaveLineThickness: OptionDbl;
    m_octaveNoSpanningParentheses: OptionBool;
    m_ossiaStaffSize: OptionDbl;
    m_pedalLineThickness: OptionDbl;
    m_repeatBarLineDotSeparation: OptionDbl;
    m_repeatEndingLineThickness: OptionDbl;
    m_slurCurveFactor: OptionDbl;
    m_slurEndpointFlexibility: OptionDbl;
    m_slurEndpointThickness: OptionDbl;
    m_slurMargin: OptionDbl;
    m_slurMaxSlope: OptionInt;
    m_slurMidpointThickness: OptionDbl;
    m_slurSymmetry: OptionDbl;
    m_spacingBraceGroup: OptionInt;
    m_spacingBracketGroup: OptionInt;
    m_spacingDurDetection: OptionBool;
    m_spacingLinear: OptionDbl;
    m_spacingNonLinear: OptionDbl;
    m_spacingOssia: OptionDbl;
    m_spacingStaff: OptionInt;
    m_spacingSystem: OptionInt;
    m_staffLineWidth: OptionDbl;
    m_stemWidth: OptionDbl;
    m_subBracketThickness: OptionDbl;
    m_systemDivider: OptionIntMap;
    m_systemMaxPerPage: OptionInt;
    m_textEnclosureThickness: OptionDbl;
    m_thickBarlineThickness: OptionDbl;
    m_tieEndpointThickness: OptionDbl;
    m_tieMidpointThickness: OptionDbl;
    m_tieMinLength: OptionDbl;
    m_tupletAngledOnBeams: OptionBool;
    m_tupletBracketThickness: OptionDbl;
    m_tupletNumHead: OptionBool;
    m_appXPathQuery: OptionArray;
    m_choiceXPathQuery: OptionArray;
    m_expand: OptionString;
    m_expandAlways: OptionBool;
    m_expandNever: OptionBool;
    m_loadSelectedMdivOnly: OptionBool;
    m_mdivAll: OptionBool;
    m_mdivXPathQuery: OptionString;
    m_ossiaHidden: OptionBool;
    m_substXPathQuery: OptionArray;
    m_transpose: OptionString;
    m_transposeMdiv: OptionJson;
    m_transposeSelectedOnly: OptionBool;
    m_transposeToSoundingPitch: OptionBool;
    m_defaultBottomMargin: OptionDbl;
    m_defaultLeftMargin: OptionDbl;
    m_defaultRightMargin: OptionDbl;
    m_defaultTopMargin: OptionDbl;
    m_bottomMarginArtic: OptionDbl;
    m_bottomMarginHarm: OptionDbl;
    m_bottomMarginOctave: OptionDbl;
    m_bottomMarginPgHead: OptionDbl;
    m_leftMarginAccid: OptionDbl;
    m_leftMarginBarLine: OptionDbl;
    m_leftMarginBeatRpt: OptionDbl;
    m_leftMarginChord: OptionDbl;
    m_leftMarginClef: OptionDbl;
    m_leftMarginKeySig: OptionDbl;
    m_leftMarginLeftBarLine: OptionDbl;
    m_leftMarginMensur: OptionDbl;
    m_leftMarginMeterSig: OptionDbl;
    m_leftMarginMRest: OptionDbl;
    m_leftMarginMRpt2: OptionDbl;
    m_leftMarginMultiRest: OptionDbl;
    m_leftMarginMultiRpt: OptionDbl;
    m_leftMarginNote: OptionDbl;
    m_leftMarginRest: OptionDbl;
    m_leftMarginRightBarLine: OptionDbl;
    m_leftMarginTabDurSym: OptionDbl;
    m_rightMarginAccid: OptionDbl;
    m_rightMarginBarLine: OptionDbl;
    m_rightMarginBeatRpt: OptionDbl;
    m_rightMarginChord: OptionDbl;
    m_rightMarginClef: OptionDbl;
    m_rightMarginKeySig: OptionDbl;
    m_rightMarginLeftBarLine: OptionDbl;
    m_rightMarginMensur: OptionDbl;
    m_rightMarginMeterSig: OptionDbl;
    m_rightMarginMRest: OptionDbl;
    m_rightMarginMRpt2: OptionDbl;
    m_rightMarginMultiRest: OptionDbl;
    m_rightMarginMultiRpt: OptionDbl;
    m_rightMarginNote: OptionDbl;
    m_rightMarginRest: OptionDbl;
    m_rightMarginRightBarLine: OptionDbl;
    m_rightMarginTabDurSym: OptionDbl;
    m_topMarginArtic: OptionDbl;
    m_topMarginHarm: OptionDbl;
    m_topMarginPgFooter: OptionDbl;
    m_midiNoCue: OptionBool;
    m_midiTempoAdjustment: OptionDbl;
    m_midiTuningFile: OptionString;
    m_durationEquivalence: OptionIntMap;
    m_ligatureAsBracket: OptionBool;
    m_ligatureOblique: OptionIntMap;
    m_mensuralScoreUp: OptionBool;
    m_mensuralResponsiveView: OptionIntMap;
    m_mensuralToCmn: OptionBool;
    m_gabcAquitanianContext: OptionBool;
    m_gabcExtendedSymbols: OptionBool;
    m_gabcStaffLines: OptionInt;
    m_liquescentWithoutTails: OptionBool;
    m_timemapOptions: OptionString;
    inputFromFormat: FileFormat;
    outputToFormat: FileFormat;
    m_baseOptions: OptionGrp;
    m_general: OptionGrp;
    m_generalLayout: OptionGrp;
    m_selectors: OptionGrp;
    m_elementMargins: OptionGrp;
    m_midi: OptionGrp;
    m_mensural: OptionGrp;
    m_neume: OptionGrp;
    m_jsonCmdLineOptions: OptionGrp;
    private m_items: MapOfStrOptions = new Map();
    private m_grps: OptionGrp[] = [];

    constructor() {
        this.inputFromFormat = FileFormat.AUTO;
        this.outputToFormat = FileFormat.UNKNOWN;
        this.m_baseOptions = new OptionGrp(); this.m_baseOptions.setLabel('Base short options', '0-base'); this.m_baseOptions.setCategory(OptionsCategory.Base);
        this.m_general = new OptionGrp(); this.m_general.setLabel('Input and page configuration options', '1-general'); this.m_general.setCategory(OptionsCategory.General);
        this.m_grps.push(this.m_general);
        this.m_generalLayout = new OptionGrp(); this.m_generalLayout.setLabel('General layout options', '2-generalLayout'); this.m_generalLayout.setCategory(OptionsCategory.Layout);
        this.m_grps.push(this.m_generalLayout);
        this.m_selectors = new OptionGrp(); this.m_selectors.setLabel('Loading selectors and processing', '3-selectors'); this.m_selectors.setCategory(OptionsCategory.Selectors);
        this.m_grps.push(this.m_selectors);
        this.m_elementMargins = new OptionGrp(); this.m_elementMargins.setLabel('Element margins', '4-elementMargins'); this.m_elementMargins.setCategory(OptionsCategory.Margins);
        this.m_grps.push(this.m_elementMargins);
        this.m_midi = new OptionGrp(); this.m_midi.setLabel('Midi options', '5-midi'); this.m_midi.setCategory(OptionsCategory.Midi);
        this.m_grps.push(this.m_midi);
        this.m_mensural = new OptionGrp(); this.m_mensural.setLabel('Mensural notation options', '6-mensural'); this.m_mensural.setCategory(OptionsCategory.Mensural);
        this.m_grps.push(this.m_mensural);
        this.m_neume = new OptionGrp(); this.m_neume.setLabel('Neumatic notation options', '7-neume'); this.m_neume.setCategory(OptionsCategory.Neume);
        this.m_grps.push(this.m_neume);
        this.m_jsonCmdLineOptions = new OptionGrp(); this.m_jsonCmdLineOptions.setLabel('Method JSON options for the command-line', '7-methodJson'); this.m_jsonCmdLineOptions.setCategory(OptionsCategory.Json);
        this.m_grps.push(this.m_jsonCmdLineOptions);
        this.m_standardOutput = new OptionBool();
        this.m_help = new OptionString();
        this.m_allPages = new OptionBool();
        this.m_inputFrom = new OptionString();
        this.m_logLevel = new OptionString();
        this.m_outfile = new OptionString();
        this.m_page = new OptionInt();
        this.m_resourcePath = new OptionString();
        this.m_scale = new OptionInt();
        this.m_outputTo = new OptionString();
        this.m_version = new OptionBool();
        this.m_xmlIdSeed = new OptionInt();
        this.m_adjustPageHeight = new OptionBool();
        this.m_adjustPageWidth = new OptionBool();
        this.m_breaks = new OptionIntMap();
        this.m_breaksSmartSb = new OptionDbl();
        this.m_condense = new OptionIntMap();
        this.m_condenseFirstPage = new OptionBool();
        this.m_condenseNotLastSystem = new OptionBool();
        this.m_condenseTempoPages = new OptionBool();
        this.m_evenNoteSpacing = new OptionBool();
        this.m_footer = new OptionIntMap();
        this.m_header = new OptionIntMap();
        this.m_humType = new OptionBool();
        this.m_incip = new OptionBool();
        this.m_justifyVertically = new OptionBool();
        this.m_landscape = new OptionBool();
        this.m_minLastJustification = new OptionDbl();
        this.m_mmOutput = new OptionBool();
        this.m_moveScoreDefinitionToStaff = new OptionBool();
        this.m_neumeAsNote = new OptionBool();
        this.m_noJustification = new OptionBool();
        this.m_openControlEvents = new OptionBool();
        this.m_outputFormatRaw = new OptionBool();
        this.m_outputIndent = new OptionInt();
        this.m_outputIndentTab = new OptionBool();
        this.m_outputSmuflXmlEntities = new OptionBool();
        this.m_pageHeight = new OptionInt();
        this.m_pageMarginBottom = new OptionInt();
        this.m_pageMarginLeft = new OptionInt();
        this.m_pageMarginRight = new OptionInt();
        this.m_pageMarginTop = new OptionInt();
        this.m_pageWidth = new OptionInt();
        this.m_pedalStyle = new OptionIntMap();
        this.m_preserveAnalyticalMarkup = new OptionBool();
        this.m_removeIds = new OptionBool();
        this.m_scaleToPageSize = new OptionBool();
        this.m_setLocale = new OptionBool();
        this.m_showHidden = new OptionBool();
        this.m_showRuntime = new OptionBool();
        this.m_shrinkToFit = new OptionBool();
        this.m_smuflTextFont = new OptionIntMap();
        this.m_staccatoCenter = new OptionBool();
        this.m_svgBoundingBoxes = new OptionBool();
        this.m_svgContentBoundingBoxes = new OptionBool();
        this.m_svgCss = new OptionString();
        this.m_svgViewBox = new OptionBool();
        this.m_svgHtml5 = new OptionBool();
        this.m_svgFormatRaw = new OptionBool();
        this.m_svgRemoveXlink = new OptionBool();
        this.m_svgAdditionalAttribute = new OptionArray();
        this.m_unit = new OptionDbl();
        this.m_useFacsimile = new OptionBool();
        this.m_usePgFooterForAll = new OptionBool();
        this.m_usePgHeaderForAll = new OptionBool();
        this.m_useBraceGlyph = new OptionBool();
        this.m_xmlIdChecksum = new OptionBool();
        this.m_barLineSeparation = new OptionDbl();
        this.m_barLineWidth = new OptionDbl();
        this.m_beamFrenchStyle = new OptionBool();
        this.m_beamMaxSlope = new OptionInt();
        this.m_beamMixedPreserve = new OptionBool();
        this.m_beamMixedStemMin = new OptionDbl();
        this.m_bracketThickness = new OptionDbl();
        this.m_breaksNoWidow = new OptionBool();
        this.m_dashedBarLineDashLength = new OptionDbl();
        this.m_dashedBarLineGapLength = new OptionDbl();
        this.m_dynamDist = new OptionDbl();
        this.m_dynamSingleGlyphs = new OptionBool();
        this.m_engravingDefaults = new OptionJson();
        this.m_engravingDefaultsFile = new OptionJson();
        this.m_extenderLineMinSpace = new OptionDbl();
        this.m_fingeringScale = new OptionDbl();
        this.m_font = new OptionString();
        this.m_fontAddCustom = new OptionArray();
        this.m_fontFallback = new OptionIntMap();
        this.m_fontLoadAll = new OptionBool();
        this.m_fontTextLiberation = new OptionBool();
        this.m_graceFactor = new OptionDbl();
        this.m_graceRhythmAlign = new OptionBool();
        this.m_graceRightAlign = new OptionBool();
        this.m_hairpinSize = new OptionDbl();
        this.m_hairpinThickness = new OptionDbl();
        this.m_handwrittenFont = new OptionArray();
        this.m_harmDist = new OptionDbl();
        this.m_justificationBraceGroup = new OptionDbl();
        this.m_justificationBracketGroup = new OptionDbl();
        this.m_justificationStaff = new OptionDbl();
        this.m_justificationSystem = new OptionDbl();
        this.m_justificationMaxVertical = new OptionDbl();
        this.m_ledgerLineThickness = new OptionDbl();
        this.m_ledgerLineExtension = new OptionDbl();
        this.m_lyricElision = new OptionIntMap();
        this.m_lyricHeightFactor = new OptionDbl();
        this.m_lyricLineThickness = new OptionDbl();
        this.m_lyricNoStartHyphen = new OptionBool();
        this.m_lyricSize = new OptionDbl();
        this.m_lyricTopMinMargin = new OptionDbl();
        this.m_lyricVerseCollapse = new OptionBool();
        this.m_lyricWordSpace = new OptionDbl();
        this.m_measureMinWidth = new OptionInt();
        this.m_mnumInterval = new OptionInt();
        this.m_multiRestStyle = new OptionIntMap();
        this.m_multiRestThickness = new OptionDbl();
        this.m_octaveAlternativeSymbols = new OptionBool();
        this.m_octaveLineThickness = new OptionDbl();
        this.m_octaveNoSpanningParentheses = new OptionBool();
        this.m_ossiaStaffSize = new OptionDbl();
        this.m_pedalLineThickness = new OptionDbl();
        this.m_repeatBarLineDotSeparation = new OptionDbl();
        this.m_repeatEndingLineThickness = new OptionDbl();
        this.m_slurCurveFactor = new OptionDbl();
        this.m_slurEndpointFlexibility = new OptionDbl();
        this.m_slurEndpointThickness = new OptionDbl();
        this.m_slurMargin = new OptionDbl();
        this.m_slurMaxSlope = new OptionInt();
        this.m_slurMidpointThickness = new OptionDbl();
        this.m_slurSymmetry = new OptionDbl();
        this.m_spacingBraceGroup = new OptionInt();
        this.m_spacingBracketGroup = new OptionInt();
        this.m_spacingDurDetection = new OptionBool();
        this.m_spacingLinear = new OptionDbl();
        this.m_spacingNonLinear = new OptionDbl();
        this.m_spacingOssia = new OptionDbl();
        this.m_spacingStaff = new OptionInt();
        this.m_spacingSystem = new OptionInt();
        this.m_staffLineWidth = new OptionDbl();
        this.m_stemWidth = new OptionDbl();
        this.m_subBracketThickness = new OptionDbl();
        this.m_systemDivider = new OptionIntMap();
        this.m_systemMaxPerPage = new OptionInt();
        this.m_textEnclosureThickness = new OptionDbl();
        this.m_thickBarlineThickness = new OptionDbl();
        this.m_tieEndpointThickness = new OptionDbl();
        this.m_tieMidpointThickness = new OptionDbl();
        this.m_tieMinLength = new OptionDbl();
        this.m_tupletAngledOnBeams = new OptionBool();
        this.m_tupletBracketThickness = new OptionDbl();
        this.m_tupletNumHead = new OptionBool();
        this.m_appXPathQuery = new OptionArray();
        this.m_choiceXPathQuery = new OptionArray();
        this.m_expand = new OptionString();
        this.m_expandAlways = new OptionBool();
        this.m_expandNever = new OptionBool();
        this.m_loadSelectedMdivOnly = new OptionBool();
        this.m_mdivAll = new OptionBool();
        this.m_mdivXPathQuery = new OptionString();
        this.m_ossiaHidden = new OptionBool();
        this.m_substXPathQuery = new OptionArray();
        this.m_transpose = new OptionString();
        this.m_transposeMdiv = new OptionJson();
        this.m_transposeSelectedOnly = new OptionBool();
        this.m_transposeToSoundingPitch = new OptionBool();
        this.m_defaultBottomMargin = new OptionDbl();
        this.m_defaultLeftMargin = new OptionDbl();
        this.m_defaultRightMargin = new OptionDbl();
        this.m_defaultTopMargin = new OptionDbl();
        this.m_bottomMarginArtic = new OptionDbl();
        this.m_bottomMarginHarm = new OptionDbl();
        this.m_bottomMarginOctave = new OptionDbl();
        this.m_bottomMarginPgHead = new OptionDbl();
        this.m_leftMarginAccid = new OptionDbl();
        this.m_leftMarginBarLine = new OptionDbl();
        this.m_leftMarginBeatRpt = new OptionDbl();
        this.m_leftMarginChord = new OptionDbl();
        this.m_leftMarginClef = new OptionDbl();
        this.m_leftMarginKeySig = new OptionDbl();
        this.m_leftMarginLeftBarLine = new OptionDbl();
        this.m_leftMarginMensur = new OptionDbl();
        this.m_leftMarginMeterSig = new OptionDbl();
        this.m_leftMarginMRest = new OptionDbl();
        this.m_leftMarginMRpt2 = new OptionDbl();
        this.m_leftMarginMultiRest = new OptionDbl();
        this.m_leftMarginMultiRpt = new OptionDbl();
        this.m_leftMarginNote = new OptionDbl();
        this.m_leftMarginRest = new OptionDbl();
        this.m_leftMarginRightBarLine = new OptionDbl();
        this.m_leftMarginTabDurSym = new OptionDbl();
        this.m_rightMarginAccid = new OptionDbl();
        this.m_rightMarginBarLine = new OptionDbl();
        this.m_rightMarginBeatRpt = new OptionDbl();
        this.m_rightMarginChord = new OptionDbl();
        this.m_rightMarginClef = new OptionDbl();
        this.m_rightMarginKeySig = new OptionDbl();
        this.m_rightMarginLeftBarLine = new OptionDbl();
        this.m_rightMarginMensur = new OptionDbl();
        this.m_rightMarginMeterSig = new OptionDbl();
        this.m_rightMarginMRest = new OptionDbl();
        this.m_rightMarginMRpt2 = new OptionDbl();
        this.m_rightMarginMultiRest = new OptionDbl();
        this.m_rightMarginMultiRpt = new OptionDbl();
        this.m_rightMarginNote = new OptionDbl();
        this.m_rightMarginRest = new OptionDbl();
        this.m_rightMarginRightBarLine = new OptionDbl();
        this.m_rightMarginTabDurSym = new OptionDbl();
        this.m_topMarginArtic = new OptionDbl();
        this.m_topMarginHarm = new OptionDbl();
        this.m_topMarginPgFooter = new OptionDbl();
        this.m_midiNoCue = new OptionBool();
        this.m_midiTempoAdjustment = new OptionDbl();
        this.m_midiTuningFile = new OptionString();
        this.m_durationEquivalence = new OptionIntMap();
        this.m_ligatureAsBracket = new OptionBool();
        this.m_ligatureOblique = new OptionIntMap();
        this.m_mensuralScoreUp = new OptionBool();
        this.m_mensuralResponsiveView = new OptionIntMap();
        this.m_mensuralToCmn = new OptionBool();
        this.m_gabcAquitanianContext = new OptionBool();
        this.m_gabcExtendedSymbols = new OptionBool();
        this.m_gabcStaffLines = new OptionInt();
        this.m_liquescentWithoutTails = new OptionBool();
        this.m_timemapOptions = new OptionString();
        // __OPTIONS_CPP_INIT__
        this.m_standardOutput.setInfo("Standard output", "Use \"-\" as input file or set the \"--stdin\" option for reading from the standard input");
        this.m_standardOutput.init(false);
        this.m_standardOutput.setKey("stdin");
        this.m_standardOutput.setShortOption(" ", true);
        this.m_baseOptions.addOption(this.m_standardOutput);
        this.m_help.setInfo("Help", "Display this message");
        this.m_help.init("");
        this.m_help.setKey("help");
        this.m_help.setShortOption("h", true);
        this.m_baseOptions.addOption(this.m_help);
        this.m_allPages.setInfo("All pages", "Output all pages");
        this.m_allPages.init(false);
        this.m_allPages.setKey("allPages");
        this.m_allPages.setShortOption("a", true);
        this.m_baseOptions.addOption(this.m_allPages);
        this.m_inputFrom.setInfo("Input from", "Select input format from: \"abc\", \"cmme.xml\", \"darms\", \"esac\", \"gabc\", \"humdrum\", \"mei\", \"pae\", \"volpiano\", \"xml\" (musicxml), \"musicxml-hum\" (musicxml via humdrum) or \"mei-pb-serialized\"");
        this.m_inputFrom.init("mei");
        this.m_inputFrom.setKey("inputFrom");
        this.m_inputFrom.setShortOption("f", false);
        this.m_baseOptions.addOption(this.m_inputFrom);
        this.m_logLevel.setInfo("Log level", "Set the log level: \"off\", \"error\", \"warning\", \"info\", or \"debug\"");
        this.m_logLevel.init("warning");
        this.m_logLevel.setKey("logLevel");
        this.m_logLevel.setShortOption("l", true);
        this.m_baseOptions.addOption(this.m_logLevel);
        this.m_outfile.setInfo("Output file", "Output file name (use \"-\" as file name for standard output)");
        this.m_outfile.init("svg");
        this.m_outfile.setKey("outfile");
        this.m_outfile.setShortOption("o", true);
        this.m_baseOptions.addOption(this.m_outfile);
        this.m_page.setInfo("Page", "Select the page to engrave (default is 1)");
        this.m_page.init(0, 0, 0);
        this.m_page.setKey("page");
        this.m_page.setShortOption("p", true);
        this.m_baseOptions.addOption(this.m_page);
        this.m_resourcePath.setInfo("Resource path", "Path to the directory with Verovio resources");
        this.m_resourcePath.init(VRV_RESOURCE_DIR);
        this.m_resourcePath.setKey("resourcePath");
        this.m_resourcePath.setShortOption("r", true);
        this.m_baseOptions.addOption(this.m_resourcePath);
        this.m_scale.setInfo("Scale percent", "Scale of the output in percent (100 is normal size)");
        this.m_scale.init(DEFAULT_SCALE, MIN_SCALE, MAX_SCALE);
        this.m_scale.setKey("scale");
        this.m_scale.setShortOption("s", false);
        this.m_baseOptions.addOption(this.m_scale);
        this.m_outputTo.setInfo("Output to", "Select output format to: \"mei\", \"mei-pb\", \"mei-facs\", \"mei-basic\", \"svg\", \"midi\", \"timemap\", \"expansionmap\", \"humdrum\", \"pae\" or \"mei-pb-serialized\"");
        this.m_outputTo.init("svg");
        this.m_outputTo.setKey("outputTo");
        this.m_outputTo.setShortOption("t", true);
        this.m_baseOptions.addOption(this.m_outputTo);
        this.m_version.setInfo("Version number", "Display the version number");
        this.m_version.init(false);
        this.m_version.setKey("version");
        this.m_version.setShortOption("v", true);
        this.m_baseOptions.addOption(this.m_version);
        this.m_xmlIdSeed.setInfo("XML IDs seed", "Seed the random number generator for XML IDs (default is random)");
        this.m_xmlIdSeed.init(0, 0, -VRV_UNSET);
        this.m_xmlIdSeed.setKey("xmlIdSeed");
        this.m_xmlIdSeed.setShortOption("x", false);
        this.m_baseOptions.addOption(this.m_xmlIdSeed);
        this.m_adjustPageHeight.setInfo("Adjust page height", "Adjust the page height to the height of the content");
        this.m_adjustPageHeight.init(false);
        this.register(this.m_adjustPageHeight, "adjustPageHeight", this.m_general);
        this.m_adjustPageWidth.setInfo("Adjust page width", "Adjust the page width to the width of the content");
        this.m_adjustPageWidth.init(false);
        this.register(this.m_adjustPageWidth, "adjustPageWidth", this.m_general);
        this.m_breaks.setInfo("Breaks", "Define page and system breaks layout");
        this.m_breaks.init(OptionBreaks.auto, optionBreaks);
        this.register(this.m_breaks, "breaks", this.m_general);
        this.m_breaksSmartSb.setInfo("Smart breaks sb usage threshold", "In smart breaks mode, the portion of system width usage at which an encoded sb will be used");
        this.m_breaksSmartSb.init(0.66, 0.0, 1.0);
        this.register(this.m_breaksSmartSb, "breaksSmartSb", this.m_general);
        this.m_condense.setInfo("Condense", "Control condensed score layout");
        this.m_condense.init(OptionCondense.auto, optionCondense);
        this.register(this.m_condense, "condense", this.m_general);
        this.m_condenseFirstPage.setInfo("Condense first page", "When condensing a score also condense the first page");
        this.m_condenseFirstPage.init(false);
        this.register(this.m_condenseFirstPage, "condenseFirstPage", this.m_general);
        this.m_condenseNotLastSystem.setInfo("Condense not last system", "When condensing a score never condense the last system");
        this.m_condenseNotLastSystem.init(false);
        this.register(this.m_condenseNotLastSystem, "condenseNotLastSystem", this.m_general);
        this.m_condenseTempoPages.setInfo("Condense tempo pages", "When condensing a score also condense pages with a tempo change");
        this.m_condenseTempoPages.init(false);
        this.register(this.m_condenseTempoPages, "condenseTempoPages", this.m_general);
        this.m_evenNoteSpacing.setInfo("Even note spacing", "Align notes and rests without adding duration based space");
        this.m_evenNoteSpacing.init(false);
        this.register(this.m_evenNoteSpacing, "evenNoteSpacing", this.m_general);
        this.m_footer.setInfo("Footer", "Control footer layout");
        this.m_footer.init(OptionFooter.auto, optionFooter);
        this.register(this.m_footer, "footer", this.m_general);
        this.m_header.setInfo("Header", "Control header layout");
        this.m_header.init(OptionHeader.auto, optionHeader);
        this.register(this.m_header, "header", this.m_general);
        this.m_humType.setInfo("Humdrum type", "Include type attributes when importing from Humdrum");
        this.m_humType.init(false);
        this.register(this.m_humType, "humType", this.m_general);
        this.m_incip.setInfo("Incip", "Read <incip> elements as data input");
        this.m_incip.init(false);
        this.register(this.m_incip, "incip", this.m_general);
        this.m_justifyVertically.setInfo("Justify vertically", "Justify spacing vertically to fill the page");
        this.m_justifyVertically.init(false);
        this.register(this.m_justifyVertically, "justifyVertically", this.m_general);
        this.m_landscape.setInfo("Landscape orientation", "Swap the values for page height and page width");
        this.m_landscape.init(false);
        this.register(this.m_landscape, "landscape", this.m_general);
        this.m_minLastJustification.setInfo("Minimum last-system-justification width", "The last system is only justified if the unjustified width is greater than this percent");
        this.m_minLastJustification.init(0.8, 0.0, 1.0);
        this.register(this.m_minLastJustification, "minLastJustification", this.m_general);
        this.m_mmOutput.setInfo("MM output", "Specify that the output in the SVG is given in mm (default is px)");
        this.m_mmOutput.init(false);
        this.register(this.m_mmOutput, "mmOutput", this.m_general);
        this.m_moveScoreDefinitionToStaff.setInfo("Move score definition to staff", "Move score definition (clef, keySig, meterSig, etc.) from scoreDef to staffDef");
        this.m_moveScoreDefinitionToStaff.init(false);
        this.register(this.m_moveScoreDefinitionToStaff, "moveScoreDefinitionToStaff", this.m_general);
        this.m_neumeAsNote.setInfo("Neume as note", "Render neumes as note heads instead of original notation");
        this.m_neumeAsNote.init(false);
        this.register(this.m_neumeAsNote, "neumeAsNote", this.m_general);
        this.m_noJustification.setInfo("No justification", "Do not justify the system");
        this.m_noJustification.init(false);
        this.register(this.m_noJustification, "noJustification", this.m_general);
        this.m_openControlEvents.setInfo("Open control event", "Render open control events");
        this.m_openControlEvents.init(false);
        this.register(this.m_openControlEvents, "openControlEvents", this.m_general);
        this.m_outputIndent.setInfo("Output indentation", "Output indentation value for MEI and SVG");
        this.m_outputIndent.init(3, 1, 10);
        this.register(this.m_outputIndent, "outputIndent", this.m_general);
        this.m_outputFormatRaw.setInfo("Raw formatting for MEI output", "Writes MEI out with no line indenting or non-content newlines.");
        this.m_outputFormatRaw.init(false);
        this.register(this.m_outputFormatRaw, "outputFormatRaw", this.m_general);
        this.m_outputIndentTab.setInfo("Output indentation with tab", "Output indentation with tabulation for MEI and SVG");
        this.m_outputIndentTab.init(false);
        this.register(this.m_outputIndentTab, "outputIndentTab", this.m_general);
        this.m_outputSmuflXmlEntities.setInfo("Output SMuFL XML entities", "Output SMuFL characters as XML entities instead of hex byte codes ");
        this.m_outputSmuflXmlEntities.init(false);
        this.register(this.m_outputSmuflXmlEntities, "outputSmuflXmlEntities", this.m_general);
        this.m_pageHeight.setInfo("Page height", "The page height");
        this.m_pageHeight.init(2970, 100, 60000, true);
        this.register(this.m_pageHeight, "pageHeight", this.m_general);
        this.m_pageMarginBottom.setInfo("Page bottom margin", "The page bottom margin");
        this.m_pageMarginBottom.init(50, 0, 500, true);
        this.register(this.m_pageMarginBottom, "pageMarginBottom", this.m_general);
        this.m_pageMarginLeft.setInfo("Page left margin", "The page left margin");
        this.m_pageMarginLeft.init(50, 0, 500, true);
        this.register(this.m_pageMarginLeft, "pageMarginLeft", this.m_general);
        this.m_pageMarginRight.setInfo("Page right margin", "The page right margin");
        this.m_pageMarginRight.init(50, 0, 500, true);
        this.register(this.m_pageMarginRight, "pageMarginRight", this.m_general);
        this.m_pageMarginTop.setInfo("Page top margin", "The page top margin");
        this.m_pageMarginTop.init(50, 0, 500, true);
        this.register(this.m_pageMarginTop, "pageMarginTop", this.m_general);
        this.m_pageWidth.setInfo("Page width", "The page width");
        this.m_pageWidth.init(2100, 100, 100000, true);
        this.register(this.m_pageWidth, "pageWidth", this.m_general);
        this.m_pedalStyle.setInfo("Pedal style", "The global pedal style");
        this.m_pedalStyle.init(0, optionPedalStyle);
        this.register(this.m_pedalStyle, "pedalStyle", this.m_general);
        this.m_preserveAnalyticalMarkup.setInfo("Preserve analytical markup", "Preserves the analytical markup in MEI");
        this.m_preserveAnalyticalMarkup.init(false);
        this.register(this.m_preserveAnalyticalMarkup, "preserveAnalyticalMarkup", this.m_general);
        this.m_removeIds.setInfo("Remove IDs in MEI", "Remove XML IDs in the MEI output that are not referenced");
        this.m_removeIds.init(false);
        this.register(this.m_removeIds, "removeIds", this.m_general);
        this.m_scaleToPageSize.setInfo("Scale to fit the page size", "Scale the content within the page instead of scaling the page itself");
        this.m_scaleToPageSize.init(false);
        this.register(this.m_scaleToPageSize, "scaleToPageSize", this.m_general);
        this.m_setLocale.setInfo("Set the global locale", "Changes the global locale to C (this is not thread-safe)");
        this.m_setLocale.init(false);
        this.register(this.m_setLocale, "setLocale", this.m_general);
        this.m_showHidden.setInfo("Show hidden elements", "Display <space>, <mSpace> and invisible or gestural elements");
        this.m_showHidden.init(false);
        this.register(this.m_showHidden, "showHidden", this.m_general);
        this.m_showRuntime.setInfo("Show runtime on CLI", "Display the total runtime on command-line");
        this.m_showRuntime.init(false);
        this.register(this.m_showRuntime, "showRuntime", this.m_general);
        this.m_shrinkToFit.setInfo("Shrink content to fit page", "Scale down page content to fit the page height if needed");
        this.m_shrinkToFit.init(false);
        this.register(this.m_shrinkToFit, "shrinkToFit", this.m_general);
        this.m_smuflTextFont.setInfo("Smufl text font", "Specify if the smufl text font is embedded, linked, or ignored");
        this.m_smuflTextFont.init(OptionSmuflTextFont.embedded, optionSmuflTextFont);
        this.register(this.m_smuflTextFont, "smuflTextFont", this.m_general);
        this.m_staccatoCenter.setInfo("Center staccato", "Align staccato and staccatissimo articulations with center of the note");
        this.m_staccatoCenter.init(false);
        this.register(this.m_staccatoCenter, "staccatoCenter", this.m_general);
        this.m_svgBoundingBoxes.setInfo("Svg bounding boxes viewbox on svg root", "Include bounding boxes in SVG output");
        this.m_svgBoundingBoxes.init(false);
        this.register(this.m_svgBoundingBoxes, "svgBoundingBoxes", this.m_general);
        this.m_svgContentBoundingBoxes.setInfo("Svg content bounding boxes", "Include content bounding boxes in SVG output");
        this.m_svgContentBoundingBoxes.init(false);
        this.register(this.m_svgContentBoundingBoxes, "svgContentBoundingBoxes", this.m_general);
        this.m_svgCss.setInfo("SVG additional CSS", "CSS (as a string) to be added to the SVG output");
        this.m_svgCss.init("");
        this.register(this.m_svgCss, "svgCss", this.m_general);
        this.m_svgViewBox.setInfo("Use viewbox on svg root", "Use viewBox on svg root element for easy scaling of document");
        this.m_svgViewBox.init(false);
        this.register(this.m_svgViewBox, "svgViewBox", this.m_general);
        this.m_svgHtml5.setInfo("Output SVG for HTML5 embedding", "Write data-id and data-class attributes for JS usage and id clash avoidance");
        this.m_svgHtml5.init(false);
        this.register(this.m_svgHtml5, "svgHtml5", this.m_general);
        this.m_svgFormatRaw.setInfo("Raw formatting for SVG output", "Writes SVG out with no line indenting or non-content newlines");
        this.m_svgFormatRaw.init(false);
        this.register(this.m_svgFormatRaw, "svgFormatRaw", this.m_general);
        this.m_svgRemoveXlink.setInfo("Remove xlink: from href attributes", "Removes the xlink: prefix on href attributes for compatibility with some newer browsers");
        this.m_svgRemoveXlink.init(false);
        this.register(this.m_svgRemoveXlink, "svgRemoveXlink", this.m_general);
        this.m_svgAdditionalAttribute.setInfo("Add additional attribute in SVG", "Add additional attribute for graphical elements in SVG as \"data-*\", for example, \"note@pname\" would add a \"data-pname\" to all note elements");
        this.m_svgAdditionalAttribute.init();
        this.register(this.m_svgAdditionalAttribute, "svgAdditionalAttribute", this.m_general);
        this.m_unit.setInfo("Unit", "The MEI unit (1⁄2 of the distance between the staff lines)");
        this.m_unit.init(DEFAULT_UNIT, 4.5, 12.0, true);
        this.register(this.m_unit, "unit", this.m_general);
        this.m_useBraceGlyph.setInfo("Use Brace Glyph", "Use brace glyph from current font");
        this.m_useBraceGlyph.init(false);
        this.register(this.m_useBraceGlyph, "useBraceGlyph", this.m_general);
        this.m_useFacsimile.setInfo("Use facsimile for layout", "Use information in the <facsimile> element to control the layout");
        this.m_useFacsimile.init(false);
        this.register(this.m_useFacsimile, "useFacsimile", this.m_general);
        this.m_usePgFooterForAll.setInfo("Use PgFooter for all", "Use the pgFooter for all pages");
        this.m_usePgFooterForAll.init(false);
        this.register(this.m_usePgFooterForAll, "usePgFooterForAll", this.m_general);
        this.m_usePgHeaderForAll.setInfo("Use PgHeader for all", "Use the pgHeader for all pages");
        this.m_usePgHeaderForAll.init(false);
        this.register(this.m_usePgHeaderForAll, "usePgHeaderForAll", this.m_general);
        this.m_xmlIdChecksum.setInfo("XML IDs based on checksum", "Seed the generator for XML IDs using the checksum of the input data");
        this.m_xmlIdChecksum.init(false);
        this.register(this.m_xmlIdChecksum, "xmlIdChecksum", this.m_general);
        this.m_barLineSeparation.setInfo("Barline separation", "The default distance between multiple barlines when locked together");
        this.m_barLineSeparation.init(0.8, 0.5, 2.0);
        this.register(this.m_barLineSeparation, "barLineSeparation", this.m_generalLayout);
        this.m_barLineWidth.setInfo("Barline width", "The barline width");
        this.m_barLineWidth.init(0.30, 0.10, 0.80);
        this.register(this.m_barLineWidth, "barLineWidth", this.m_generalLayout);
        this.m_beamFrenchStyle.setInfo("French style of beams", "For notes in beams, stems will stop at first outermost sub-beam without crossing it");
        this.m_beamFrenchStyle.init(false);
        this.register(this.m_beamFrenchStyle, "beamFrenchStyle", this.m_generalLayout);
        this.m_beamMaxSlope.setInfo("Beam max slope", "The maximum beam slope");
        this.m_beamMaxSlope.init(10, 0, 20);
        this.register(this.m_beamMaxSlope, "beamMaxSlope", this.m_generalLayout);
        this.m_beamMixedPreserve.setInfo("Preserve mixed beams", "Mixed beams will be drawn even if there is not enough space");
        this.m_beamMixedPreserve.init(false);
        this.register(this.m_beamMixedPreserve, "beamMixedPreserve", this.m_generalLayout);
        this.m_beamMixedStemMin.setInfo("Minimal stem length of mixed beams", "The minimal stem length in MEI units used to draw mixed beams");
        this.m_beamMixedStemMin.init(3.5, 1.0, 8.0);
        this.register(this.m_beamMixedStemMin, "beamMixedStemMin", this.m_generalLayout);
        this.m_bracketThickness.setInfo("Bracket thickness", "The thickness of the system bracket");
        this.m_bracketThickness.init(1.0, 0.5, 2.0);
        this.register(this.m_bracketThickness, "bracketThickness", this.m_generalLayout);
        this.m_breaksNoWidow.setInfo("Breaks no widow", "Prevent single measures on the last page by fitting it into previous system");
        this.m_breaksNoWidow.init(false);
        this.register(this.m_breaksNoWidow, "breaksNoWidow", this.m_generalLayout);
        this.m_dashedBarLineDashLength.setInfo("Dashed barline dash length", "The dash length of dashed barlines");
        this.m_dashedBarLineDashLength.init(dashedBarLineLengthDefault, 0.1, 5.0);
        this.register(this.m_dashedBarLineDashLength, "dashedBarLineDashLength", this.m_generalLayout);
        this.m_dashedBarLineGapLength.setInfo("Dashed barline gap length", "The gap length of dashed barlines");
        this.m_dashedBarLineGapLength.init(dashedBarLineLengthDefault, 0.1, 5.0);
        this.register(this.m_dashedBarLineGapLength, "dashedBarLineGapLength", this.m_generalLayout);
        this.m_dynamDist.setInfo("Dynam dist", "The default distance from the staff for dynamic marks");
        this.m_dynamDist.init(1.0, 0.5, 16.0);
        this.register(this.m_dynamDist, "dynamDist", this.m_generalLayout);
        this.m_dynamSingleGlyphs.setInfo("Dynam single glyphs", "Don't use SMuFL's predefined dynamics glyph combinations");
        this.m_dynamSingleGlyphs.init(false);
        this.register(this.m_dynamSingleGlyphs, "dynamSingleGlyphs", this.m_generalLayout);
        this.m_engravingDefaults.setInfo("Engraving defaults", "Json describing defaults for engraving SMuFL elements");
        this.m_engravingDefaults.init(JsonSource.String, "{}");
        this.register(this.m_engravingDefaults, "engravingDefaults", this.m_generalLayout);
        this.m_engravingDefaultsFile.setInfo("Engraving defaults file", "Path to json file describing defaults for engraving SMuFL elements");
        this.m_engravingDefaultsFile.init(JsonSource.FilePath, "");
        this.register(this.m_engravingDefaultsFile, "engravingDefaultsFile", this.m_generalLayout);
        this.m_extenderLineMinSpace.setInfo("Extender line minimum space", "Minimum space required for extender line to be drawn");
        this.m_extenderLineMinSpace.init(1.5, 1.5, 10.0);
        this.register(this.m_extenderLineMinSpace, "extenderLineMinSpace", this.m_generalLayout);
        this.m_fingeringScale.setInfo("Fingering scale", "The scale of fingering font compared to default font size");
        this.m_fingeringScale.init(0.75, 0.25, 1);
        this.register(this.m_fingeringScale, "fingeringScale", this.m_generalLayout);
        this.m_font.setInfo("Font", "Set the music font");
        this.m_font.init("Leipzig");
        this.register(this.m_font, "font", this.m_generalLayout);
        this.m_fontAddCustom.setInfo("Add custom font", "Add a custom music font as zip file");
        this.m_fontAddCustom.init();
        this.register(this.m_fontAddCustom, "fontAddCustom", this.m_generalLayout);
        this.m_fontFallback.setInfo("Font fallback", "The music font fallback for missing glyphs");
        this.m_fontFallback.init(OptionFontFallback.Leipzig, optionFontFallback);
        this.register(this.m_fontFallback, "fontFallback", this.m_generalLayout);
        this.m_fontLoadAll.setInfo("Font init all", "Load all music fonts");
        this.m_fontLoadAll.init(false);
        this.register(this.m_fontLoadAll, "fontLoadAll", this.m_generalLayout);
        this.m_fontTextLiberation.setInfo("Font text Liberation", "Use the Liberation text font");
        this.m_fontTextLiberation.init(false);
        this.register(this.m_fontTextLiberation, "fontTextLiberation", this.m_generalLayout);
        this.m_graceFactor.setInfo("Grace factor", "The grace size ratio numerator");
        this.m_graceFactor.init(0.75, 0.5, 1.0);
        this.register(this.m_graceFactor, "graceFactor", this.m_generalLayout);
        this.m_graceRhythmAlign.setInfo("Grace rhythmic alignment", "Align grace notes rhythmically with all staves");
        this.m_graceRhythmAlign.init(false);
        this.register(this.m_graceRhythmAlign, "graceRhythmAlign", this.m_generalLayout);
        this.m_graceRightAlign.setInfo("Grace right alignment", "Align the right position of a grace group with all staves");
        this.m_graceRightAlign.init(false);
        this.register(this.m_graceRightAlign, "graceRightAlign", this.m_generalLayout);
        this.m_hairpinSize.setInfo("Hairpin size", "The hairpin size in MEI units");
        this.m_hairpinSize.init(3.0, 1.0, 8.0);
        this.register(this.m_hairpinSize, "hairpinSize", this.m_generalLayout);
        this.m_hairpinThickness.setInfo("Hairpin thickness", "The thickness of the hairpin");
        this.m_hairpinThickness.init(0.2, 0.1, 0.8);
        this.register(this.m_hairpinThickness, "hairpinThickness", this.m_generalLayout);
        this.m_handwrittenFont.setInfo("Handwritten font", "Fonts that emulate hand writing and require special handling");
        this.m_handwrittenFont.init();
        this.register(this.m_handwrittenFont, "handwrittenFont", this.m_generalLayout);
        this.m_harmDist.setInfo("Harm dist", "The default distance from the staff of harmonic indications");
        this.m_harmDist.init(1.0, 0.5, 16.0);
        this.register(this.m_harmDist, "harmDist", this.m_generalLayout);
        this.m_justificationStaff.setInfo("Spacing staff justification", "The staff justification");
        this.m_justificationStaff.init(1., 0., 10.);
        this.register(this.m_justificationStaff, "justificationStaff", this.m_generalLayout);
        this.m_justificationSystem.setInfo("Spacing system justification", "The system spacing justification");
        this.m_justificationSystem.init(1., 0., 10.);
        this.register(this.m_justificationSystem, "justificationSystem", this.m_generalLayout);
        this.m_justificationBracketGroup.setInfo("Spacing bracket group justification", "Space between staves inside a bracketed group justification");
        this.m_justificationBracketGroup.init(1., 0., 10.);
        this.register(this.m_justificationBracketGroup, "justificationBracketGroup", this.m_generalLayout);
        this.m_justificationBraceGroup.setInfo("Spacing brace group justification", "Space between staves inside a braced group justification");
        this.m_justificationBraceGroup.init(1., 0., 10.);
        this.register(this.m_justificationBraceGroup, "justificationBraceGroup", this.m_generalLayout);
        this.m_justificationMaxVertical.setInfo("Maximum ratio of justifiable height for page", "Maximum ratio of justifiable height to page height that can be used for the vertical justification");
        this.m_justificationMaxVertical.init(0.2, 0.0, 1.0);
        this.register(this.m_justificationMaxVertical, "justificationMaxVertical", this.m_generalLayout);
        this.m_ledgerLineThickness.setInfo("Ledger line thickness", "The thickness of the ledger lines");
        this.m_ledgerLineThickness.init(0.25, 0.10, 0.50);
        this.register(this.m_ledgerLineThickness, "ledgerLineThickness", this.m_generalLayout);
        this.m_ledgerLineExtension.setInfo("Ledger line extension", "The amount by which a ledger line should extend either side of a notehead");
        this.m_ledgerLineExtension.init(0.54, 0.20, 1.00);
        this.register(this.m_ledgerLineExtension, "ledgerLineExtension", this.m_generalLayout);
        this.m_lyricElision.setInfo("Lyric elision", "The lyric elision width");
        this.m_lyricElision.init(0xE551, optionElision);
        this.register(this.m_lyricElision, "lyricElision", this.m_generalLayout);
        this.m_lyricHeightFactor.setInfo("Lyric height factor", "The lyric verse line height factor");
        this.m_lyricHeightFactor.init(1.0, 1.0, 20.0);
        this.register(this.m_lyricHeightFactor, "lyricHeightFactor", this.m_generalLayout);
        this.m_lyricLineThickness.setInfo("Lyric line thickness", "The lyric extender line thickness");
        this.m_lyricLineThickness.init(0.25, 0.10, 0.50);
        this.register(this.m_lyricLineThickness, "lyricLineThickness", this.m_generalLayout);
        this.m_lyricNoStartHyphen.setInfo("Lyric no start hyphen", "Do not show hyphens at the beginning of a system");
        this.m_lyricNoStartHyphen.init(false);
        this.register(this.m_lyricNoStartHyphen, "lyricNoStartHyphen", this.m_generalLayout);
        this.m_lyricSize.setInfo("Lyric size", "The lyrics size in MEI units");
        this.m_lyricSize.init(4.5, 2.0, 8.0);
        this.register(this.m_lyricSize, "lyricSize", this.m_generalLayout);
        this.m_lyricTopMinMargin.setInfo("Lyric top min margin", "The minmal margin above the lyrics in MEI units");
        this.m_lyricTopMinMargin.init(2.0, 0.0, 8.0);
        this.register(this.m_lyricTopMinMargin, "lyricTopMinMargin", this.m_generalLayout);
        this.m_lyricWordSpace.setInfo("Lyric word space", "The lyric word space length");
        this.m_lyricWordSpace.init(1.20, 0.00, 10.00);
        this.register(this.m_lyricWordSpace, "lyricWordSpace", this.m_generalLayout);
        this.m_lyricVerseCollapse.setInfo("Lyric verse collapse", "Collapse empty verse lines in lyrics");
        this.m_lyricVerseCollapse.init(false);
        this.register(this.m_lyricVerseCollapse, "lyricVerseCollapse", this.m_generalLayout);
        this.m_measureMinWidth.setInfo("Measure min width", "The minimal measure width in MEI units");
        this.m_measureMinWidth.init(15, 1, 30);
        this.register(this.m_measureMinWidth, "measureMinWidth", this.m_generalLayout);
        this.m_mnumInterval.setInfo("Measure Number Interval", "How frequently to place measure numbers");
        this.m_mnumInterval.init(0, 0, 64, false);
        this.register(this.m_mnumInterval, "mnumInterval", this.m_generalLayout);
        this.m_multiRestStyle.setInfo("Multi rest style", "Rendering style of multiple measure rests");
        this.m_multiRestStyle.init(OptionMultiRestStyle.auto, optionMultiRestStyle);
        this.register(this.m_multiRestStyle, "multiRestStyle", this.m_generalLayout);
        this.m_multiRestThickness.setInfo("Multi rest thickness", "The thickness of the multi rest in MEI units");
        this.m_multiRestThickness.init(2.0, 0.50, 6.00);
        this.register(this.m_multiRestThickness, "multiRestThickness", this.m_generalLayout);
        this.m_octaveAlternativeSymbols.setInfo("Alternative octave symbols", "Use alternative symbols for displaying octaves");
        this.m_octaveAlternativeSymbols.init(false);
        this.register(this.m_octaveAlternativeSymbols, "octaveAlternativeSymbols", this.m_generalLayout);
        this.m_octaveLineThickness.setInfo("Octave line thickness", "The thickness of the line used for an octave line");
        this.m_octaveLineThickness.init(0.20, 0.10, 1.00);
        this.register(this.m_octaveLineThickness, "octaveLineThickness", this.m_generalLayout);
        this.m_octaveNoSpanningParentheses.setInfo("No parentheses on spanning octaves", "Do not enclose octaves that are spanning over systems with parentheses.");
        this.m_octaveNoSpanningParentheses.init(false);
        this.register(this.m_octaveNoSpanningParentheses, "octaveNoSpanningParentheses", this.m_generalLayout);
        this.m_ossiaStaffSize.setInfo("Ossia staff size", "The ossia staff size in relation to the staff size");
        this.m_ossiaStaffSize.init(0.75, 0.5, 1.00);
        this.register(this.m_ossiaStaffSize, "ossiaStaffSize", this.m_generalLayout);
        this.m_pedalLineThickness.setInfo("Pedal line thickness", "The thickness of the line used for piano pedaling");
        this.m_pedalLineThickness.init(0.20, 0.10, 1.00);
        this.register(this.m_pedalLineThickness, "pedalLineThickness", this.m_generalLayout);
        this.m_repeatBarLineDotSeparation.setInfo("Repeat barline dot separation", "The default horizontal distance between the dots and the inner barline of a repeat barline");
        this.m_repeatBarLineDotSeparation.init(0.36, 0.10, 1.00);
        this.register(this.m_repeatBarLineDotSeparation, "repeatBarLineDotSeparation", this.m_generalLayout);
        this.m_repeatEndingLineThickness.setInfo("Repeat ending line thickness", "Repeat and ending line thickness");
        this.m_repeatEndingLineThickness.init(0.15, 0.10, 2.0);
        this.register(this.m_repeatEndingLineThickness, "repeatEndingLineThickness", this.m_generalLayout);
        this.m_slurCurveFactor.setInfo("Slur curve factor", "Slur curve factor - high value means rounder slurs");
        this.m_slurCurveFactor.init(1.0, 0.2, 5.0);
        this.register(this.m_slurCurveFactor, "slurCurveFactor", this.m_generalLayout);
        this.m_slurEndpointFlexibility.setInfo("Slur endpoint flexibility", "Slur endpoint flexibility - allow more endpoint movement during adjustment");
        this.m_slurEndpointFlexibility.init(0.0, 0.0, 1.0);
        this.register(this.m_slurEndpointFlexibility, "slurEndpointFlexibility", this.m_generalLayout);
        this.m_slurEndpointThickness.setInfo("Slur endpoint thickness", "The endpoint slur thickness in MEI units");
        this.m_slurEndpointThickness.init(0.1, 0.05, 0.25);
        this.register(this.m_slurEndpointThickness, "slurEndpointThickness", this.m_generalLayout);
        this.m_slurMargin.setInfo("Slur margin", "Slur safety distance in MEI units to obstacles");
        this.m_slurMargin.init(1.0, 0.1, 4.0);
        this.register(this.m_slurMargin, "slurMargin", this.m_generalLayout);
        this.m_slurMaxSlope.setInfo("Slur max slope", "The maximum slur slope in degrees");
        this.m_slurMaxSlope.init(60, 30, 85);
        this.register(this.m_slurMaxSlope, "slurMaxSlope", this.m_generalLayout);
        this.m_slurMidpointThickness.setInfo("Slur midpoint thickness", "The midpoint slur thickness in MEI units");
        this.m_slurMidpointThickness.init(0.6, 0.2, 1.2);
        this.register(this.m_slurMidpointThickness, "slurMidpointThickness", this.m_generalLayout);
        this.m_slurSymmetry.setInfo("Slur symmetry", "Slur symmetry - high value means more symmetric slurs");
        this.m_slurSymmetry.init(0.0, 0.0, 1.0);
        this.register(this.m_slurSymmetry, "slurSymmetry", this.m_generalLayout);
        this.m_spacingBraceGroup.setInfo("Spacing brace group", "Minimum space between staves inside a braced group in MEI units");
        this.m_spacingBraceGroup.init(12, 0, 48);
        this.register(this.m_spacingBraceGroup, "spacingBraceGroup", this.m_generalLayout);
        this.m_spacingBracketGroup.setInfo("Spacing bracket group", "Minimum space between staves inside a bracketed group in MEI units");
        this.m_spacingBracketGroup.init(12, 0, 48);
        this.register(this.m_spacingBracketGroup, "spacingBracketGroup", this.m_generalLayout);
        this.m_spacingDurDetection.setInfo("Spacing dur detection", "Detect long duration for adjusting spacing");
        this.m_spacingDurDetection.init(false);
        this.register(this.m_spacingDurDetection, "spacingDurDetection", this.m_generalLayout);
        this.m_spacingLinear.setInfo("Spacing linear", "Specify the linear spacing factor");
        this.m_spacingLinear.init(0.25, 0.0, 1.0);
        this.register(this.m_spacingLinear, "spacingLinear", this.m_generalLayout);
        this.m_spacingNonLinear.setInfo("Spacing non linear", "Specify the non-linear spacing factor");
        this.m_spacingNonLinear.init(0.6, 0.0, 1.0);
        this.register(this.m_spacingNonLinear, "spacingNonLinear", this.m_generalLayout);
        this.m_spacingOssia.setInfo("Spacing ossia", "Specify the factor of an ossia spacing in relation to staff spacing");
        this.m_spacingOssia.init(0.35, 0.1, 1.0);
        this.register(this.m_spacingOssia, "spacingOssia", this.m_generalLayout);
        this.m_spacingStaff.setInfo("Spacing staff", "The staff minimal spacing in MEI units");
        this.m_spacingStaff.init(12, 0, 48);
        this.register(this.m_spacingStaff, "spacingStaff", this.m_generalLayout);
        this.m_spacingSystem.setInfo("Spacing system", "The system minimal spacing in MEI units");
        this.m_spacingSystem.init(4, 0, 48);
        this.register(this.m_spacingSystem, "spacingSystem", this.m_generalLayout);
        this.m_staffLineWidth.setInfo("Staff line width", "The staff line width in MEI units");
        this.m_staffLineWidth.init(0.15, 0.10, 0.30);
        this.register(this.m_staffLineWidth, "staffLineWidth", this.m_generalLayout);
        this.m_stemWidth.setInfo("Stem width", "The stem width");
        this.m_stemWidth.init(0.20, 0.10, 0.50);
        this.register(this.m_stemWidth, "stemWidth", this.m_generalLayout);
        this.m_subBracketThickness.setInfo("Sub bracket thickness", "The thickness of system sub-bracket");
        this.m_subBracketThickness.init(0.20, 0.10, 2.0);
        this.register(this.m_subBracketThickness, "subBracketThickness", this.m_generalLayout);
        this.m_systemDivider.setInfo("System divider", "The display of system dividers");
        this.m_systemDivider.init(OptionSystemDivider.auto, optionSystemDivider);
        this.register(this.m_systemDivider, "systemDivider", this.m_generalLayout);
        this.m_systemMaxPerPage.setInfo("Max. System per Page", "Maximum number of systems per page");
        this.m_systemMaxPerPage.init(0, 0, 24);
        this.register(this.m_systemMaxPerPage, "systemMaxPerPage", this.m_generalLayout);
        this.m_textEnclosureThickness.setInfo("Text box line thickness", "The thickness of the line text enclosing box");
        this.m_textEnclosureThickness.init(0.2, 0.10, 0.80);
        this.register(this.m_textEnclosureThickness, "textEnclosureThickness", this.m_generalLayout);
        this.m_thickBarlineThickness.setInfo("Thick barline thickness", "The thickness of the thick barline");
        this.m_thickBarlineThickness.init(1.0, 0.5, 2.0);
        this.register(this.m_thickBarlineThickness, "thickBarlineThickness", this.m_generalLayout);
        this.m_tieEndpointThickness.setInfo("Tie Endpoint thickness", "The Endpoint tie thickness in MEI units");
        this.m_tieEndpointThickness.init(0.1, 0.05, 0.25);
        this.register(this.m_tieEndpointThickness, "tieEndpointThickness", this.m_generalLayout);
        this.m_tieMidpointThickness.setInfo("Tie midpoint thickness", "The midpoint tie thickness in MEI units");
        this.m_tieMidpointThickness.init(0.5, 0.2, 1.0);
        this.register(this.m_tieMidpointThickness, "tieMidpointThickness", this.m_generalLayout);
        this.m_tieMinLength.setInfo("Tie minimum length", "The minimum length of tie in MEI units");
        this.m_tieMinLength.init(2.0, 0.0, 10.0);
        this.register(this.m_tieMinLength, "tieMinLength", this.m_generalLayout);
        this.m_tupletAngledOnBeams.setInfo("Tuplet angled on beams", "Tuplet brackets angled on beams only");
        this.m_tupletAngledOnBeams.init(false);
        this.register(this.m_tupletAngledOnBeams, "tupletAngledOnBeams", this.m_generalLayout);
        this.m_tupletBracketThickness.setInfo("Tuplet bracket thickness", "The thickness of the tuplet bracket");
        this.m_tupletBracketThickness.init(0.2, 0.1, 0.8);
        this.register(this.m_tupletBracketThickness, "tupletBracketThickness", this.m_generalLayout);
        this.m_tupletNumHead.setInfo("Tuplet number on head", "Placement of tuplet number on the side of the note head");
        this.m_tupletNumHead.init(false);
        this.register(this.m_tupletNumHead, "tupletNumHead", this.m_generalLayout);
        this.m_appXPathQuery.setInfo("App xPath query", "Set the xPath query for selecting <app> child elements, for example: \"./rdg[contains(@source, 'source-id')]\"; by default the <lem> or the first <rdg> is selected");
        this.m_appXPathQuery.init();
        this.register(this.m_appXPathQuery, "appXPathQuery", this.m_selectors);
        this.m_choiceXPathQuery.setInfo("Choice xPath query", "Set the xPath query for selecting <choice> child elements, for example: \"./orig\"; by default the first child is selected");
        this.m_choiceXPathQuery.init();
        this.register(this.m_choiceXPathQuery, "choiceXPathQuery", this.m_selectors);
        this.m_expand.setInfo("Expand expansion", "Expand all referenced elements in the expansion <xml:id>");
        this.m_expand.init("");
        this.register(this.m_expand, "expand", this.m_selectors);
        this.m_expandAlways.setInfo("Always expand", "Expand for all outputs, using selected, first, or generated expansion");
        this.m_expandAlways.init(false);
        this.register(this.m_expandAlways, "expandAlways", this.m_selectors);
        this.m_expandNever.setInfo("Never expand", "Expand for no output, including MIDI and timemap");
        this.m_expandNever.init(false);
        this.register(this.m_expandNever, "expandNever", this.m_selectors);
        this.m_loadSelectedMdivOnly.setInfo("Load selected Mdiv only", "Load only the selected mdiv; the content of the other is skipped");
        this.m_loadSelectedMdivOnly.init(false);
        this.register(this.m_loadSelectedMdivOnly, "loadSelectedMdivOnly", this.m_selectors);
        this.m_mdivAll.setInfo("Mdiv all", "Load and render all <mdiv> elements in the MEI files");
        this.m_mdivAll.init(false);
        this.register(this.m_mdivAll, "mdivAll", this.m_selectors);
        this.m_mdivXPathQuery.setInfo("Mdiv xPath query", "Set the xPath query for selecting the <mdiv> to be rendered; only one <mdiv> can be rendered");
        this.m_mdivXPathQuery.init("");
        this.register(this.m_mdivXPathQuery, "mdivXPathQuery", this.m_selectors);
        this.m_ossiaHidden.setInfo("Ossia hidden", "Hide ossias when rendering");
        this.m_ossiaHidden.init(false);
        this.register(this.m_ossiaHidden, "ossiaHidden", this.m_selectors);
        this.m_substXPathQuery.setInfo("Subst xPath query", "Set the xPath query for selecting <subst> child elements, for example: \"./del\"; by default the first child is selected");
        this.m_substXPathQuery.init();
        this.register(this.m_substXPathQuery, "substXPathQuery", this.m_selectors);
        this.m_transpose.setInfo("Transpose the content", "Transpose the entire content");
        this.m_transpose.init("");
        this.register(this.m_transpose, "transpose", this.m_selectors);
        this.m_transposeMdiv.setInfo("Transpose individual mdivs", "Json mapping the mdiv ids to the corresponding transposition");
        this.m_transposeMdiv.init(JsonSource.String, "{}");
        this.register(this.m_transposeMdiv, "transposeMdiv", this.m_selectors);
        this.m_transposeSelectedOnly.setInfo("Transpose selected only", "Transpose only the selected content and ignore unselected editorial content");
        this.m_transposeSelectedOnly.init(false);
        this.register(this.m_transposeSelectedOnly, "transposeSelectedOnly", this.m_selectors);
        this.m_transposeToSoundingPitch.setInfo("Transpose to sounding pitch", "Transpose to sounding pitch by evaluating @trans.semi");
        this.m_transposeToSoundingPitch.init(false);
        this.register(this.m_transposeToSoundingPitch, "transposeToSoundingPitch", this.m_selectors);
        this.m_defaultBottomMargin.setInfo("Default bottom margin", "The default bottom margin");
        this.m_defaultBottomMargin.init(0.5, 0.0, 5.0);
        this.register(this.m_defaultBottomMargin, "defaultBottomMargin", this.m_elementMargins);
        this.m_defaultLeftMargin.setInfo("Default left margin", "The default left margin");
        this.m_defaultLeftMargin.init(0.0, 0.0, 2.0);
        this.register(this.m_defaultLeftMargin, "defaultLeftMargin", this.m_elementMargins);
        this.m_defaultRightMargin.setInfo("Default right margin", "The default right margin");
        this.m_defaultRightMargin.init(0.0, 0.0, 2.0);
        this.register(this.m_defaultRightMargin, "defaultRightMargin", this.m_elementMargins);
        this.m_defaultTopMargin.setInfo("Default top margin", "The default top margin");
        this.m_defaultTopMargin.init(0.5, 0.0, 6.0);
        this.register(this.m_defaultTopMargin, "defaultTopMargin", this.m_elementMargins);
        this.m_bottomMarginArtic.setInfo("Bottom margin artic", "The margin for artic in MEI units");
        this.m_bottomMarginArtic.init(0.75, 0.0, 10.0);
        this.register(this.m_bottomMarginArtic, "bottomMarginArtic", this.m_elementMargins);
        this.m_bottomMarginHarm.setInfo("Bottom margin harm", "The margin for harm in MEI units");
        this.m_bottomMarginHarm.init(1.0, 0.0, 10.0);
        this.register(this.m_bottomMarginHarm, "bottomMarginHarm", this.m_elementMargins);
        this.m_bottomMarginOctave.setInfo("Bottom margin octave", "The margin for octave in MEI units");
        this.m_bottomMarginOctave.init(1.0, 0.0, 10.0);
        this.register(this.m_bottomMarginOctave, "bottomMarginOctave", this.m_elementMargins);
        this.m_bottomMarginPgHead.setInfo("Bottom margin header", "The margin for header in MEI units");
        this.m_bottomMarginPgHead.init(2.0, 0.0, 24.0);
        this.register(this.m_bottomMarginPgHead, "bottomMarginHeader", this.m_elementMargins);
        this.m_leftMarginAccid.setInfo("Left margin accid", "The margin for accid in MEI units");
        this.m_leftMarginAccid.init(1.0, 0.0, 2.0);
        this.register(this.m_leftMarginAccid, "leftMarginAccid", this.m_elementMargins);
        this.m_leftMarginBarLine.setInfo("Left margin barLine", "The margin for barLine in MEI units");
        this.m_leftMarginBarLine.init(0.0, 0.0, 2.0);
        this.register(this.m_leftMarginBarLine, "leftMarginBarLine", this.m_elementMargins);
        this.m_leftMarginBeatRpt.setInfo("Left margin beatRpt", "The margin for beatRpt in MEI units");
        this.m_leftMarginBeatRpt.init(2.0, 0.0, 2.0);
        this.register(this.m_leftMarginBeatRpt, "leftMarginBeatRpt", this.m_elementMargins);
        this.m_leftMarginChord.setInfo("Left margin chord", "The margin for chord in MEI units");
        this.m_leftMarginChord.init(1.0, 0.0, 2.0);
        this.register(this.m_leftMarginChord, "leftMarginChord", this.m_elementMargins);
        this.m_leftMarginClef.setInfo("Left margin clef", "The margin for clef in MEI units");
        this.m_leftMarginClef.init(1.0, 0.0, 2.0);
        this.register(this.m_leftMarginClef, "leftMarginClef", this.m_elementMargins);
        this.m_leftMarginKeySig.setInfo("Left margin keySig", "The margin for keySig in MEI units");
        this.m_leftMarginKeySig.init(1.0, 0.0, 2.0);
        this.register(this.m_leftMarginKeySig, "leftMarginKeySig", this.m_elementMargins);
        this.m_leftMarginLeftBarLine.setInfo("Left margin left barLine", "The margin for left barLine in MEI units");
        this.m_leftMarginLeftBarLine.init(1.0, 0.0, 2.0);
        this.register(this.m_leftMarginLeftBarLine, "leftMarginLeftBarLine", this.m_elementMargins);
        this.m_leftMarginMensur.setInfo("Left margin mensur", "The margin for mensur in MEI units");
        this.m_leftMarginMensur.init(1.0, 0.0, 2.0);
        this.register(this.m_leftMarginMensur, "leftMarginMensur", this.m_elementMargins);
        this.m_leftMarginMeterSig.setInfo("Left margin meterSig", "The margin for meterSig in MEI units");
        this.m_leftMarginMeterSig.init(1.0, 0.0, 2.0);
        this.register(this.m_leftMarginMeterSig, "leftMarginMeterSig", this.m_elementMargins);
        this.m_leftMarginMRest.setInfo("Left margin mRest", "The margin for mRest in MEI units");
        this.m_leftMarginMRest.init(0.0, 0.0, 2.0);
        this.register(this.m_leftMarginMRest, "leftMarginMRest", this.m_elementMargins);
        this.m_leftMarginMRpt2.setInfo("Left margin mRpt2", "The margin for mRpt2 in MEI units");
        this.m_leftMarginMRpt2.init(0.0, 0.0, 2.0);
        this.register(this.m_leftMarginMRpt2, "leftMarginMRpt2", this.m_elementMargins);
        this.m_leftMarginMultiRest.setInfo("Left margin multiRest", "The margin for multiRest in MEI units");
        this.m_leftMarginMultiRest.init(0.0, 0.0, 2.0);
        this.register(this.m_leftMarginMultiRest, "leftMarginMultiRest", this.m_elementMargins);
        this.m_leftMarginMultiRpt.setInfo("Left margin multiRpt", "The margin for multiRpt in MEI units");
        this.m_leftMarginMultiRpt.init(0.0, 0.0, 2.0);
        this.register(this.m_leftMarginMultiRpt, "leftMarginMultiRpt", this.m_elementMargins);
        this.m_leftMarginNote.setInfo("Left margin note", "The margin for note in MEI units");
        this.m_leftMarginNote.init(1.0, 0.0, 2.0);
        this.register(this.m_leftMarginNote, "leftMarginNote", this.m_elementMargins);
        this.m_leftMarginRest.setInfo("Left margin rest", "The margin for rest in MEI units");
        this.m_leftMarginRest.init(1.0, 0.0, 2.0);
        this.register(this.m_leftMarginRest, "leftMarginRest", this.m_elementMargins);
        this.m_leftMarginRightBarLine.setInfo("Left margin right barLine", "The margin for right barLine in MEI units");
        this.m_leftMarginRightBarLine.init(1.0, 0.0, 2.0);
        this.register(this.m_leftMarginRightBarLine, "leftMarginRightBarLine", this.m_elementMargins);
        this.m_leftMarginTabDurSym.setInfo("Left margin tabRhyhtm", "The margin for tabDurSym in MEI units");
        this.m_leftMarginTabDurSym.init(1.0, 0.0, 2.0);
        this.register(this.m_leftMarginTabDurSym, "leftMarginTabDurSym", this.m_elementMargins);
        this.m_rightMarginAccid.setInfo("Right margin accid", "The right margin for accid in MEI units");
        this.m_rightMarginAccid.init(0.5, 0.0, 2.0);
        this.register(this.m_rightMarginAccid, "rightMarginAccid", this.m_elementMargins);
        this.m_rightMarginBarLine.setInfo("Right margin barLine", "The right margin for barLine in MEI units");
        this.m_rightMarginBarLine.init(0.0, 0.0, 2.0);
        this.register(this.m_rightMarginBarLine, "rightMarginBarLine", this.m_elementMargins);
        this.m_rightMarginBeatRpt.setInfo("Right margin beatRpt", "The right margin for beatRpt in MEI units");
        this.m_rightMarginBeatRpt.init(0.0, 0.0, 2.0);
        this.register(this.m_rightMarginBeatRpt, "rightMarginBeatRpt", this.m_elementMargins);
        this.m_rightMarginChord.setInfo("Right margin chord", "The right margin for chord in MEI units");
        this.m_rightMarginChord.init(0.0, 0.0, 2.0);
        this.register(this.m_rightMarginChord, "rightMarginChord", this.m_elementMargins);
        this.m_rightMarginClef.setInfo("Right margin clef", "The right margin for clef in MEI units");
        this.m_rightMarginClef.init(1.0, 0.0, 2.0);
        this.register(this.m_rightMarginClef, "rightMarginClef", this.m_elementMargins);
        this.m_rightMarginKeySig.setInfo("Right margin keySig", "The right margin for keySig in MEI units");
        this.m_rightMarginKeySig.init(1.0, 0.0, 2.0);
        this.register(this.m_rightMarginKeySig, "rightMarginKeySig", this.m_elementMargins);
        this.m_rightMarginLeftBarLine.setInfo("Right margin left barLine", "The right margin for left barLine in MEI units");
        this.m_rightMarginLeftBarLine.init(1.0, 0.0, 2.0);
        this.register(this.m_rightMarginLeftBarLine, "rightMarginLeftBarLine", this.m_elementMargins);
        this.m_rightMarginMensur.setInfo("Right margin mensur", "The right margin for mensur in MEI units");
        this.m_rightMarginMensur.init(1.0, 0.0, 2.0);
        this.register(this.m_rightMarginMensur, "rightMarginMensur", this.m_elementMargins);
        this.m_rightMarginMeterSig.setInfo("Right margin meterSig", "The right margin for meterSig in MEI units");
        this.m_rightMarginMeterSig.init(1.0, 0.0, 2.0);
        this.register(this.m_rightMarginMeterSig, "rightMarginMeterSig", this.m_elementMargins);
        this.m_rightMarginMRest.setInfo("Right margin mRest", "The right margin for mRest in MEI units");
        this.m_rightMarginMRest.init(0.0, 0.0, 2.0);
        this.register(this.m_rightMarginMRest, "rightMarginMRest", this.m_elementMargins);
        this.m_rightMarginMRpt2.setInfo("Right margin mRpt2", "The right margin for mRpt2 in MEI units");
        this.m_rightMarginMRpt2.init(0.0, 0.0, 2.0);
        this.register(this.m_rightMarginMRpt2, "rightMarginMRpt2", this.m_elementMargins);
        this.m_rightMarginMultiRest.setInfo("Right margin multiRest", "The right margin for multiRest in MEI units");
        this.m_rightMarginMultiRest.init(0.0, 0.0, 2.0);
        this.register(this.m_rightMarginMultiRest, "rightMarginMultiRest", this.m_elementMargins);
        this.m_rightMarginMultiRpt.setInfo("Right margin multiRpt", "The right margin for multiRpt in MEI units");
        this.m_rightMarginMultiRpt.init(0.0, 0.0, 2.0);
        this.register(this.m_rightMarginMultiRpt, "rightMarginMultiRpt", this.m_elementMargins);
        this.m_rightMarginNote.setInfo("Right margin note", "The right margin for note in MEI units");
        this.m_rightMarginNote.init(0.0, 0.0, 2.0);
        this.register(this.m_rightMarginNote, "rightMarginNote", this.m_elementMargins);
        this.m_rightMarginRest.setInfo("Right margin rest", "The right margin for rest in MEI units");
        this.m_rightMarginRest.init(0.0, 0.0, 2.0);
        this.register(this.m_rightMarginRest, "rightMarginRest", this.m_elementMargins);
        this.m_rightMarginRightBarLine.setInfo("Right margin right barLine", "The right margin for right barLine in MEI units");
        this.m_rightMarginRightBarLine.init(0.0, 0.0, 2.0);
        this.register(this.m_rightMarginRightBarLine, "rightMarginRightBarLine", this.m_elementMargins);
        this.m_rightMarginTabDurSym.setInfo("Right margin tabRhyhtm", "The right margin for tabDurSym in MEI units");
        this.m_rightMarginTabDurSym.init(0.0, 0.0, 2.0);
        this.register(this.m_rightMarginTabDurSym, "rightMarginTabDurSym", this.m_elementMargins);
        this.m_topMarginArtic.setInfo("Top margin artic", "The margin for artic in MEI units");
        this.m_topMarginArtic.init(0.75, 0.0, 10.0);
        this.register(this.m_topMarginArtic, "topMarginArtic", this.m_elementMargins);
        this.m_topMarginHarm.setInfo("Top margin harm", "The margin for harm in MEI units");
        this.m_topMarginHarm.init(1.0, 0.0, 10.0);
        this.register(this.m_topMarginHarm, "topMarginHarm", this.m_elementMargins);
        this.m_topMarginPgFooter.setInfo("Top margin footer", "The margin for footer in MEI units");
        this.m_topMarginPgFooter.init(2.0, 0.0, 24.0);
        this.register(this.m_topMarginPgFooter, "topMarginPgFooter", this.m_elementMargins);
        this.m_midiNoCue.setInfo("MIDI playback without cue notes", "Skip cue notes in MIDI output");
        this.m_midiNoCue.init(false);
        this.register(this.m_midiNoCue, "midiNoCue", this.m_midi);
        this.m_midiTempoAdjustment.setInfo("MIDI tempo adjustment", "The MIDI tempo adjustment factor");
        this.m_midiTempoAdjustment.init(1.0, 0.2, 4.0);
        this.register(this.m_midiTempoAdjustment, "midiTempoAdjustment", this.m_midi);
        this.m_midiTuningFile.setInfo("MIDI tuning", "A custom tuning definition or filepath to apply to the MIDI output");
        this.m_midiTuningFile.init("");
        this.register(this.m_midiTuningFile, "tuningFile", this.m_midi);
        this.m_durationEquivalence.setInfo("Duration equivalence", "The mensural duration equivalence");
        this.m_durationEquivalence.init(OptionDurationEq.brevis, optionDurationEq);
        this.register(this.m_durationEquivalence, "durationEquivalence", this.m_mensural);
        this.m_ligatureAsBracket.setInfo("Ligature as bracket", "Render ligatures as bracket instead of original notation");
        this.m_ligatureAsBracket.init(false);
        this.register(this.m_ligatureAsBracket, "ligatureAsBracket", this.m_mensural);
        this.m_ligatureOblique.setInfo("Ligature oblique", "Ligature oblique shape");
        this.m_ligatureOblique.init(OptionLigatureObl.auto, optionLigatureOblique);
        this.register(this.m_ligatureOblique, "ligatureOblique", this.m_mensural);
        this.m_mensuralResponsiveView.setInfo("Mensural responsive view", "Make mensural content responsive (selection discards ligatures and editorial markup)");
        this.m_mensuralResponsiveView.init(OptionMensuralResp.auto, optionMensuralResponsiveness);
        this.register(this.m_mensuralResponsiveView, "mensuralResponsiveView", this.m_mensural);
        this.m_mensuralToCmn.setInfo("Mensural to CMN", "Convert mensural sections to CMN measure-based MEI");
        this.m_mensuralToCmn.init(false);
        this.register(this.m_mensuralToCmn, "mensuralToCmn", this.m_mensural);
        this.m_mensuralScoreUp.setInfo("Mensural scoring up", "Score up the mensural voices by providing a dur.quality to the notes");
        this.m_mensuralScoreUp.init(false);
        this.register(this.m_mensuralScoreUp, "mensuralScoreUp", this.m_mensural);
        this.m_gabcAquitanianContext.setInfo("GABC Aquitanian context", "Render the GABC `V` left-stem (grule virga_left) using tilt=\"ne\" instead of the default tilt=\"n\" used for square notation.");
        this.m_gabcAquitanianContext.init(false);
        this.register(this.m_gabcAquitanianContext, "gabcAquitanianContext", this.m_neume);
        this.m_gabcExtendedSymbols.setInfo("GABC extended (S-GABC) symbols", "Enable the S-GABC proposed symbols: `r` for uncertain reading and `\"` for clarifying lines");
        this.m_gabcExtendedSymbols.init(false);
        this.register(this.m_gabcExtendedSymbols, "gabcExtendedSymbols", this.m_neume);
        this.m_gabcStaffLines.setInfo("GABC staff lines", "Number of staff lines for GABC import (the GABC `staff-lines:` header value)");
        this.m_gabcStaffLines.init(4, 4, 5);
        this.register(this.m_gabcStaffLines, "gabcStaffLines", this.m_neume);
        this.m_liquescentWithoutTails.setInfo("Liquescent without tails", "Render liquescent head without tails");
        this.m_liquescentWithoutTails.init(false);
        this.register(this.m_liquescentWithoutTails, "liquescentWithoutTails", this.m_neume);
        this.m_timemapOptions.setInfo("Timemap options", "The JSON options to be passed when producing the timemap");
        this.m_timemapOptions.init("{}");
        this.register(this.m_timemapOptions, "timemapOptions", this.m_jsonCmdLineOptions);
    }

    private register(option: Option, key: string, grp: OptionGrp): void { if (!option || !grp) throw new Error("Invalid option registration"); this.m_items.set(key, option); option.setKey(key); grp.addOption(option); }
    setOutputTo(outputTo: string): boolean { switch (outputTo) { case "humdrum": case "hum": this.outputToFormat=FileFormat.HUMDRUM; break; case "mei": case "mei-basic": case "mei-pb": case "mei-facs": this.outputToFormat=FileFormat.MEI; break; case "midi": this.outputToFormat=FileFormat.MIDI; break; case "hummidi": this.outputToFormat=FileFormat.HUMMIDI; break; case "timemap": this.outputToFormat=FileFormat.TIMEMAP; break; case "expansionmap": this.outputToFormat=FileFormat.EXPANSIONMAP; break; case "pae": this.outputToFormat=FileFormat.PAE; break; case "mei-pb-serialized": this.outputToFormat=FileFormat.SERIALIZATION; break; case "svg": return true; default: return false; } return true; }
    setInputFrom(inputFrom: string): boolean { switch(inputFrom) { case "abc": this.inputFromFormat=FileFormat.ABC; break; case "pae": this.inputFromFormat=FileFormat.PAE; break; case "darms": this.inputFromFormat=FileFormat.DARMS; break; case "volpiano": this.inputFromFormat=FileFormat.VOLPIANO; break; case "cmme.xml": this.inputFromFormat=FileFormat.CMME; break; case "esac": this.inputFromFormat=FileFormat.ESAC; break; case "gabc": this.inputFromFormat=FileFormat.GABC; break; case "humdrum": case "hum": this.inputFromFormat=FileFormat.HUMDRUM; break; case "mei": this.inputFromFormat=FileFormat.MEI; break; case "musicxml": case "xml": this.inputFromFormat=FileFormat.MUSICXML; break; case "md": case "musedata": case "musedata-hum": this.inputFromFormat=FileFormat.MUSEDATAHUM; break; case "musicxml-hum": this.inputFromFormat=FileFormat.MUSICXMLHUM; break; case "mei-hum": this.inputFromFormat=FileFormat.MEIHUM; break; case "mei-pb-serialized": this.inputFromFormat=FileFormat.SERIALIZATION; break; case "auto": this.inputFromFormat=FileFormat.AUTO; break; default: return false; } return true; }
    getInputFrom(): FileFormat { return this.inputFromFormat; }
    getOutputTo(): FileFormat { return this.outputToFormat; }
    getItems(): MapOfStrOptions { return this.m_items; }
    getGrps(): OptionGrp[] { return this.m_grps; }
    getBaseOptGrp(): JsonObject { const options: JsonObject = {}; for (const option of this.getBaseOptions()) options[option.getKey()] = option.toJson(); return { name: this.m_baseOptions.getLabel(), options }; }
    getBaseOptions(): Option[] { return this.m_baseOptions.getOptions(); }
    sync(): void {
        if (!this.m_engravingDefaults.isSet() && !this.m_engravingDefaultsFile.isSet()) return;
        const engravingDefaultsPath: string[] = [];
        const unmatched = new Set<string>([...this.m_engravingDefaults.getKeys(), ...this.m_engravingDefaultsFile.getKeysByNode("engravingDefaults", engravingDefaultsPath)]);
        const pairs: Array<[string, OptionDbl]> = [
            ["staffLineThickness", this.m_staffLineWidth],["stemThickness", this.m_stemWidth],["legerLineThickness", this.m_ledgerLineThickness],["legerLineExtension", this.m_ledgerLineExtension],["slurEndpointThickness", this.m_slurEndpointThickness],["slurMidpointThickness", this.m_slurMidpointThickness],["tieEndpointThickness", this.m_tieEndpointThickness],["tieMidpointThickness", this.m_tieMidpointThickness],["thinBarlineThickness", this.m_barLineWidth],["thickBarlineThickness", this.m_thickBarlineThickness],["barlineSeparation", this.m_barLineSeparation],["repeatBarlineDotSeparation", this.m_repeatBarLineDotSeparation],["dashedBarlineDashLength", this.m_dashedBarLineDashLength],["dashedBarlineGapLength", this.m_dashedBarLineGapLength],["bracketThickness", this.m_bracketThickness],["subBracketThickness", this.m_subBracketThickness],["hairpinThickness", this.m_hairpinThickness],["octaveLineThickness", this.m_octaveLineThickness],["pedalLineThickness", this.m_pedalLineThickness],["repeatEndingLineThickness", this.m_repeatEndingLineThickness],["lyricLineThickness", this.m_lyricLineThickness],["tupletBracketThickness", this.m_tupletBracketThickness],["textEnclosureThickness", this.m_textEnclosureThickness],["hBarThickness", this.m_multiRestThickness]
        ];
        for (const [key,opt] of pairs) { const localPath=[key]; const filePath=[...engravingDefaultsPath,key]; let value: number|undefined; if (this.m_engravingDefaultsFile.hasValue(filePath)) value=this.m_engravingDefaultsFile.getDblValue(filePath); else if (this.m_engravingDefaults.hasValue(localPath)) value=this.m_engravingDefaults.getDblValue(localPath); else continue; const scaled=value*2; if (!opt.isSet()) opt.setValueDbl(scaled); else if (scaled !== opt.getValue()) LogWarning("The engraving default '%s' is skipped because the corresponding option '%s' was set before to %f.", key, opt.getKey(), opt.getValue()); unmatched.delete(key); }
        for (const key of unmatched) LogError("Unsupported engraving default '%s'", key);
    }
    copyFrom(_options: Options): void { throw new Error("Options copy constructor intentionally not implemented; use copyOptionValuesFrom()"); }
    copyOptionValuesFrom(options: Options): void {
        const source = options as unknown as Record<string, unknown>;
        const target = this as unknown as Record<string, unknown>;
        for (const key of Object.keys(source)) {
            const src = source[key] as { copyTo?: (option: unknown) => void } | undefined;
            const dst = target[key];
            if (src && dst && typeof src.copyTo === "function" && typeof (dst as { copyTo?: unknown }).copyTo === "function") src.copyTo(dst);
        }
    }
}
