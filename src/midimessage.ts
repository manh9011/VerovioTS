/**
 * Direct TypeScript translation of smf::MidiMessage from src/midi/MidiMessage.cpp.
 *
 * The C++ type derives from std::vector<uchar>; this class therefore extends
 * Array<number> and constrains all stored values to unsigned MIDI bytes.
 */
export class MidiMessage extends Array<number> {
  constructor();
  constructor(command: number);
  constructor(command: number, p1: number);
  constructor(command: number, p1: number, p2: number);
  constructor(message: MidiMessage | number[]);
  constructor(commandOrMessage?: number | MidiMessage | number[], p1?: number, p2?: number) {
    super();
    if (typeof commandOrMessage === 'number') {
      this.push(u8(commandOrMessage));
      if (p1 !== undefined) this.push(u8(p1));
      if (p2 !== undefined) this.push(u8(p2));
    } else if (commandOrMessage !== undefined) {
      this.push(...commandOrMessage.map(u8));
    }
  }

  assign(other: MidiMessage | ArrayLike<number>): this {
    if (other === this) return this;
    this.setMessage(other);
    return this;
  }

  setSize(asize: number): void {
    if (asize < 0) asize = 0;
    this.length = asize;
    for (let i = 0; i < asize; i++) this[i] = u8(this[i] ?? 0);
  }

  getSize(): number { return this.length; }

  setSizeToCommand(): number {
    const osize = this.length;
    if (osize < 1) return 0;
    const command = this.getCommandNibble();
    if (command < 0) return 0;
    let bytecount = 1;
    switch (command) {
      case 0x80:
      case 0x90:
      case 0xa0:
      case 0xb0:
      case 0xe0: bytecount = 2; break;
      case 0xc0:
      case 0xd0: bytecount = 1; break;
      default: return this.length;
    }
    if (bytecount + 1 < osize) {
      this.length = bytecount + 1;
      for (let i = osize; i < bytecount + 1; i++) this[i] = 0;
    }
    return this.length;
  }

  resizeToCommand(): number { return this.setSizeToCommand(); }

  getP0(): number { return this.length < 1 ? -1 : u8(this[0]); }
  getP1(): number { return this.length < 2 ? -1 : u8(this[1]); }
  getP2(): number { return this.length < 3 ? -1 : u8(this[2]); }
  getP3(): number { return this.length < 4 ? -1 : u8(this[3]); }
  setP0(value: number): void { this.ensureSize(1); this[0] = u8(value); }
  setP1(value: number): void { this.ensureSize(2); this[1] = u8(value); }
  setP2(value: number): void { this.ensureSize(3); this[2] = u8(value); }
  setP3(value: number): void { this.ensureSize(4); this[3] = u8(value); }

  getKeyNumber(): number {
    if (!this.isNote() && !this.isAftertouch()) return -1;
    const output = this.getP1();
    return output < 0 ? output : (output & 0xff);
  }

  getVelocity(): number {
    if (!this.isNote()) return -1;
    const output = this.getP2();
    return output < 0 ? output : (output & 0xff);
  }

  setKeyNumber(value: number): void {
    if (this.isNote() || this.isAftertouch()) this.setP1(value & 0x7f);
  }

  setVelocity(value: number): void {
    if (this.isNote()) this.setP2(value & 0x7f);
  }

  setSpelling(base7: number, accidental: number): void {
    if (!this.isNoteOn()) return;
    if (this.getVelocity() < 4) this.setVelocity(4);
    const dpc = mod(base7, 7);
    let spelling = 0;
    switch (dpc) {
      case 0: spelling = spellingCode(accidental, { '-2':1, '-1':1, '0':2, '1':2, '2':3 }); break;
      case 1: spelling = spellingCode(accidental, { '-2':1, '-1':1, '0':2, '1':3, '2':3 }); break;
      case 2: spelling = spellingCode(accidental, { '-2':1, '-1':2, '0':2, '1':3, '2':3 }); break;
      case 3: spelling = spellingCode(accidental, { '-2':1, '-1':1, '0':2, '1':2, '2':3, '3':3 }); break;
      case 4: spelling = spellingCode(accidental, { '-2':1, '-1':1, '0':2, '1':2, '2':3 }); break;
      case 5: spelling = spellingCode(accidental, { '-2':1, '-1':1, '0':2, '1':3, '2':3 }); break;
      case 6: spelling = spellingCode(accidental, { '-2':1, '-1':2, '0':2, '1':3, '2':3 }); break;
    }
    let vel = this.getVelocity() & 0xff;
    vel = vel & 0xfc;
    vel = vel | spelling;
    this.setVelocity(vel);
  }

  getSpelling(): { base7: number; accidental: number } {
    if (!this.isNoteOn()) return { base7: undefined as unknown as number, accidental: undefined as unknown as number };
    let base7 = -123456;
    let accidental = 123456;
    const base12 = this.getKeyNumber();
    let octave = Math.floor(base12 / 12);
    const base12pc = base12 - octave * 12;
    let base7pc = 0;
    const spelling = 0x03 & this.getVelocity();
    const set = (pc: number, acc: number, octaveDelta = 0) => { base7pc = pc; accidental = acc; octave += octaveDelta; };
    switch (base12pc) {
      case 0: if (spelling === 1) set(1,-2); else if (spelling === 0 || spelling === 2) set(0,0); else if (spelling === 3) set(6,1,-1); break;
      case 1: if (spelling === 1) set(1,-1); else if (spelling === 0 || spelling === 2) set(0,1); else if (spelling === 3) set(6,2,-1); break;
      case 2: if (spelling === 1) set(2,-2); else if (spelling === 0 || spelling === 2) set(1,0); else if (spelling === 3) set(0,2); break;
      case 3: if (spelling === 1) set(3,-2); else if (spelling === 0 || spelling === 2) set(2,-1); else if (spelling === 3) set(1,1); break;
      case 4: if (spelling === 1) set(3,-1); else if (spelling === 0 || spelling === 2) set(2,0); else if (spelling === 3) set(1,2); break;
      case 5: if (spelling === 1) set(4,-2); else if (spelling === 0 || spelling === 2) set(3,0); else if (spelling === 3) set(2,1); break;
      case 6: if (spelling === 1) set(4,-1); else if (spelling === 0 || spelling === 2) set(3,1); else if (spelling === 3) set(2,2); break;
      case 7: if (spelling === 1) set(5,-2); else if (spelling === 0 || spelling === 2) set(4,0); else if (spelling === 3) set(3,2); break;
      case 8: if (spelling === 1) set(5,-1); else if (spelling === 0 || spelling === 2) set(4,1); else if (spelling === 3) set(3,3); break;
      case 9: if (spelling === 1) set(6,-2); else if (spelling === 0 || spelling === 2) set(5,0); else if (spelling === 3) set(4,2); break;
      case 10: if (spelling === 1) set(0,-2,1); else if (spelling === 0 || spelling === 2) set(6,-1); else if (spelling === 3) set(5,1); break;
      case 11: if (spelling === 1) set(0,-1,1); else if (spelling === 0 || spelling === 2) set(6,0); else if (spelling === 3) set(5,2); break;
    }
    base7 = base7pc + 7 * octave;
    return { base7, accidental };
  }

  getControllerNumber(): number {
    if (!this.isController()) return -1;
    const output = this.getP1();
    return output < 0 ? output : (output & 0x7f);
  }
  getControllerValue(): number {
    if (!this.isController()) return -1;
    const output = this.getP2();
    return output < 0 ? output : (output & 0x7f);
  }

  getCommandNibble(): number { return this.length < 1 ? -1 : (this[0] & 0xf0); }
  getCommandByte(): number { return this.length < 1 ? -1 : u8(this[0]); }
  getChannelNibble(): number { return this.length < 1 ? -1 : (this[0] & 0x0f); }
  getChannel(): number { return this.getChannelNibble(); }
  setCommandByte(value: number): void { if (this.length < 1) this.length = 1; else this[0] = u8(value); }
  setCommand(value: number): void;
  setCommand(value: number, p1: number): void;
  setCommand(value: number, p1: number, p2: number): void;
  setCommand(value: number, p1?: number, p2?: number): void {
    if (p1 === undefined) this.setCommandByte(value);
    else if (p2 === undefined) { this.length = 2; this[0] = u8(value); this[1] = u8(p1); }
    else { this.length = 3; this[0] = u8(value); this[1] = u8(p1); this[2] = u8(p2); }
  }
  setCommandNibble(value: number): void {
    if (this.length < 1) this.length = 1;
    this[0] = (this[0] & 0x0f) | ((value <= 0x0f ? value << 4 : value) & 0xf0);
  }
  setChannelNibble(value: number): void { if (this.length < 1) this.length = 1; this[0] = (this[0] & 0xf0) | (value & 0x0f); }
  setChannel(value: number): void { this.setChannelNibble(value); }
  setParameters(p1: number): void;
  setParameters(p1: number, p2: number): void;
  setParameters(p1: number, p2?: number): void {
    const old = this.length;
    if (p2 === undefined) { this.length = 2; this[1] = u8(p1); }
    else { this.length = 3; this[1] = u8(p1); this[2] = u8(p2); }
    if (old < 1) this[0] = 0;
  }

  setMessage(message: ArrayLike<number>): void { this.length = 0; for (let i = 0; i < message.length; i++) this.push(u8(message[i])); }

  isMeta(): boolean { return this.length >= 3 && this[0] === 0xff; }
  isMetaMessage(): boolean { return this.isMeta(); }
  isNoteOff(): boolean { return this.length === 3 && ((this[0] & 0xf0) === 0x80 || ((this[0] & 0xf0) === 0x90 && this[2] === 0)); }
  isNoteOn(): boolean { return this.length === 3 && (this[0] & 0xf0) === 0x90 && this[2] !== 0; }
  isNote(): boolean { return this.isNoteOn() || this.isNoteOff(); }
  isAftertouch(): boolean { return this.length === 3 && (this[0] & 0xf0) === 0xa0; }
  isController(): boolean { return this.length === 3 && (this[0] & 0xf0) === 0xb0; }
  isSustain(): boolean { return this.isController() && this.getP1() === 64; }
  isSustainOn(): boolean { return this.isSustain() && this.getP2() >= 64; }
  isSustainOff(): boolean { return this.isSustain() && this.getP2() < 64; }
  isSoft(): boolean { return this.isController() && this.getP1() === 67; }
  isSoftOn(): boolean { return this.isSoft() && this.getP2() >= 64; }
  isSoftOff(): boolean { return this.isSoft() && this.getP2() < 64; }
  isTimbre(): boolean { return this.length === 2 && (this[0] & 0xf0) === 0xc0; }
  isPatchChange(): boolean { return this.isTimbre(); }
  isPressure(): boolean { return this.length === 2 && (this[0] & 0xf0) === 0xd0; }
  isPitchbend(): boolean { return this.length === 3 && (this[0] & 0xf0) === 0xe0; }
  isEmpty(): boolean { return this.length === 0; }
  empty(): boolean { return this.isEmpty(); }

  getMetaType(): number { return this.isMetaMessage() ? this[1] : -1; }
  isText(): boolean { return this.isMetaMessage() && this[1] === 0x01; }
  isCopyright(): boolean { return this.isMetaMessage() && this[1] === 0x02; }
  isTrackName(): boolean { return this.isMetaMessage() && this[1] === 0x03; }
  isInstrumentName(): boolean { return this.isMetaMessage() && this[1] === 0x04; }
  isLyricText(): boolean { return this.isMetaMessage() && this[1] === 0x05; }
  isMarkerText(): boolean { return this.isMetaMessage() && this[1] === 0x06; }
  isTempo(): boolean { return this.isMetaMessage() && this[1] === 0x51 && this.length === 6; }
  isTimeSignature(): boolean { return this.isMetaMessage() && this[1] === 0x58 && this.length === 7; }
  isKeySignature(): boolean { return this.isMetaMessage() && this[1] === 0x59 && this.length === 5; }
  isEndOfTrack(): boolean { return this.getMetaType() === 0x2f; }

  getTempoMicro(): number { return this.isTempo() ? (this[3] << 16) + (this[4] << 8) + this[5] : -1; }
  getTempoMicroseconds(): number { return this.getTempoMicro(); }
  getTempoSeconds(): number { const us = this.getTempoMicroseconds(); return us < 0 ? -1 : us / 1_000_000; }
  getTempoBPM(): number { const us = this.getTempoMicroseconds(); return us < 0 ? -1 : 60_000_000 / us; }
  getTempoTPS(tpq: number): number { const us = this.getTempoMicroseconds(); return us < 0 ? -1 : tpq * 1_000_000 / us; }
  getTempoSPT(tpq: number): number { const us = this.getTempoMicroseconds(); return us < 0 ? -1 : us / 1_000_000 / tpq; }

  getMetaContent(): string {
    if (!this.isMetaMessage()) return '';
    let start = 3;
    if (this[2] > 0x7f) { start++; if (this[3] > 0x7f) { start++; if (this[4] > 0x7f) { start++; if (this[5] > 0x7f) start++; } } }
    let output = '';
    for (let i = start; i < this.length; i++) output += String.fromCharCode(this[i]);
    return output;
  }
  setMetaContent(content: string): void {
    if (this.length < 2 || this[0] !== 0xff) return;
    this.length = 2;
    this.push(...MidiMessage.intToVlv(content.length));
    for (let i = 0; i < content.length; i++) this.push(content.charCodeAt(i) & 0xff);
  }
  setMetaTempo(tempo: number): void { this.setTempoMicroseconds(Math.trunc(60.0 / tempo * 1_000_000.0 + 0.5)); }
  setTempo(tempo: number): void { this.setMetaTempo(tempo); }
  setTempoMicroseconds(microseconds: number): void { this.length = 6; this[0]=0xff; this[1]=0x51; this[2]=3; this[3]=(microseconds>>16)&0xff; this[4]=(microseconds>>8)&0xff; this[5]=microseconds&0xff; }

  makeKeySignature(fifths: number, mode = false): void { this.length=5; this[0]=0xff; this[1]=0x59; this[2]=2; this[3]=fifths&0xff; this[4]=(mode?1:0); }
  makeTimeSignature(top: number, bottom: number, clocksPerClick=24, num32dsPerQuarter=8): void { let base2=0; while ((bottom >>= 1)) base2++; this.length=7; this[0]=0xff; this[1]=0x58; this[2]=4; this[3]=top&0xff; this[4]=base2&0xff; this[5]=clocksPerClick&0xff; this[6]=num32dsPerQuarter&0xff; }

  makeNoteOn(channel: number, key: number, velocity: number): void { this.length=3; this[0]=0x90|(channel&0x0f); this[1]=key&0x7f; this[2]=velocity&0x7f; }
  makeNoteOff(channel?: number, key?: number, velocity?: number): void {
    if (channel !== undefined && key !== undefined && velocity !== undefined) { this.length=3; this[0]=0x80|(channel&0x0f); this[1]=key&0x7f; this[2]=velocity&0x7f; }
    else if (channel !== undefined && key !== undefined) { this.length=3; this[0]=0x90|(channel&0x0f); this[1]=key&0x7f; this[2]=0; }
    else { this.makeNoteOffNoArgs(); }
  }
  private makeNoteOffNoArgs(): void { if (!this.isNoteOn()) { this.length=3; this[0]=0x90; this[1]=0; this[2]=0; } else this[2]=0; }
  makePatchChange(channel: number, patchnum: number): void { this.length=2; this[0]=0xc0|(channel&0x0f); this[1]=patchnum&0x7f; }
  makeTimbre(channel: number, patchnum: number): void { this.makePatchChange(channel,patchnum); }
  makeController(channel: number, num: number, value: number): void { this.length=3; this[0]=0xb0|(channel&0x0f); this[1]=num&0x7f; this[2]=value&0x7f; }
  makePitchBend(channel: number, lsb: number, msb?: number): void {
    this.length=3;
    this[0]=0xe0|((msb===undefined?channel:channel)&0x0f);
    if (msb === undefined) { const value=lsb; this[1]=value&0x7f; this[2]=(value>>7)&0x7f; }
    else { this[0]=0xe0|(0x0e&channel); this[1]=lsb&0x7f; this[2]=msb&0x7f; }
  }
  makePitchBendDouble(channel: number, value: number): void { this.length=3; let dvalue=(value+1)*Math.pow(2,15); if(dvalue<0)dvalue=0; if(dvalue>Math.pow(2,15)-1)dvalue=Math.pow(2,15)-1; const u=Math.trunc(dvalue)>>>0; this[0]=0xe0|(channel&0x7f); this[1]=u&0x7f; this[2]=(u>>>7)&0x7f; }
  makeSustain(channel:number,value:number):void{this.makeController(channel,64,value)}
  makeSustainPedal(channel:number,value:number):void{this.makeSustain(channel,value)}
  makeSustainOn(channel:number):void{this.makeController(channel,64,127)}
  makeSustainPedalOn(channel:number):void{this.makeSustainOn(channel)}
  makeSustainOff(channel:number):void{this.makeController(channel,64,0)}
  makeSustainPedalOff(channel:number):void{this.makeSustainOff(channel)}
  makeMetaMessage(mnum:number,data:string):void{this.length=0;this.push(0xff,mnum&0x7f);this.setMetaContent(data)}
  makeText(text:string):void{this.makeMetaMessage(0x01,text)}
  makeCopyright(text:string):void{this.makeMetaMessage(0x02,text)}
  makeTrackName(name:string):void{this.makeMetaMessage(0x03,name)}
  makeInstrumentName(name:string):void{this.makeMetaMessage(0x04,name)}
  makeLyric(text:string):void{this.makeMetaMessage(0x05,text)}
  makeMarker(text:string):void{this.makeMetaMessage(0x06,text)}
  makeCue(text:string):void{this.makeMetaMessage(0x07,text)}
  makeTempo(tempo:number):void{this.setTempo(tempo)}

  makeSysExMessage(data: ArrayLike<number>): void {
    let startindex=0, endindex=data.length-1;
    if(data.length>0 && u8(data[0])===0xf0)startindex++;
    if(data.length>0 && u8(data[data.length-1])===0xf7)endindex--;
    this.length=0; this.push(0xf0);
    for(let i=startindex;i<=endindex;i++)this.push(u8(data[i]));
    this.push(0xf7);
  }

  static intToVlv(value:number):number[]{const output:number[]=[];if(value<128){output.push(value&0xff);}else{const b1=value&0x7f; let b2=(value>>7)&0x7f,b3=(value>>14)&0x7f,b4=(value>>21)&0x7f,b5=(value>>28)&0x7f;if(b5)b4|=0x80;if(b4){b4|=0x80;b3|=0x80}if(b3){b3|=0x80;b2|=0x80}if(b2)b2|=0x80;if(b5)output.push(b5);if(b4)output.push(b4);if(b3)output.push(b3);if(b2)output.push(b2);output.push(b1);}return output;}
  static frequencyToSemitones(frequency:number,a4frequency=440.0):number{if(frequency<1||a4frequency<=0)return 0.0;const semitones=69+12*Math.log2(frequency/a4frequency);return semitones>=128?127:semitones<0?0:semitones;}

  makeMts2_KeyTuningByFrequency(key:number,frequency:number,program=0):void{this.makeMts2_KeyTuningsByFrequency(key,frequency,program)}
  makeMts2_KeyTuningsByFrequency(keyOrMapping:number|Array<[number,number]>,frequencyOrProgram:number,program=0):void{
    if(Array.isArray(keyOrMapping)){const semimap=keyOrMapping.map(([k,f])=>[k,MidiMessage.frequencyToSemitones(f)] as [number,number]);this.makeMts2_KeyTuningsBySemitone(semimap,frequencyOrProgram);}
    else {this.makeMts2_KeyTuningsBySemitone([[keyOrMapping,MidiMessage.frequencyToSemitones(frequencyOrProgram)]],program);}
  }
  makeMts2_KeyTuningBySemitone(key:number,semitone:number,program=0):void{this.makeMts2_KeyTuningsBySemitone(key,semitone,program)}
  makeMts2_KeyTuningsBySemitone(keyOrMapping:number|Array<[number,number]>,semitoneOrProgram:number,program=0):void{
    let mapping:Array<[number,number]>;
    if(Array.isArray(keyOrMapping)) mapping=keyOrMapping; else mapping=[[keyOrMapping,semitoneOrProgram]];
    if(Array.isArray(keyOrMapping)) program=semitoneOrProgram;
    if(program<0)program=0;else if(program>127)program=127;
    const data:number[]=[0x7f,0x7f,0x08,0x02,program,mapping.length&0xff];
    for(const [key,semitones0] of mapping){let keynum=key;if(keynum<0)keynum=0;else if(keynum>127)keynum=127;let sint=Math.trunc(semitones0);if(sint<0)sint=0;else if(sint>127)sint=127;const fraction=semitones0-sint;const value=Math.trunc(fraction*(1<<14));data.push(keynum&0xff,sint&0xff,(value>>7)&0x7f,value&0x7f);}
    this.makeSysExMessage(data);
  }

  makeMts9_TemperamentByCentsDeviationFromET(mapping:number[],referencePitchClass=0,channelMask=0xffff):void{
    if(mapping.length!==12){return;} if(referencePitchClass<0)return;
    const MMSB=(channelMask>>14)&0x3,MSB=(channelMask>>7)&0x7f,LSB=channelMask&0x7f;const data:number[]=[0x7f,0x7f,0x08,0x09,MMSB,MSB,LSB];
    for(let i=0;i<mapping.length;i++){const ii=mod(i-referencePitchClass+48,12);let value=mapping[ii]/100;if(value>1)value=1;if(value<-1)value=-1;const intval=Math.trunc(((1<<13)-0.5)*(value+1)+0.5);data.push((intval>>7)&0x7f,intval&0x7f);}this.makeSysExMessage(data);
  }
  makeTemperamentEqual(referencePitchClass=0,channelMask=0xffff):void{this.makeMts9_TemperamentByCentsDeviationFromET(new Array(12).fill(0),referencePitchClass,channelMask)}
  makeTemperamentBad(maxDeviationCents=100,referencePitchClass=0,channelMask=0xffff):void{if(maxDeviationCents<0)maxDeviationCents=-maxDeviationCents;if(maxDeviationCents>100)maxDeviationCents=100;const temperament=Array.from({length:12},()=>((Math.random())*2-1)*maxDeviationCents);this.makeMts9_TemperamentByCentsDeviationFromET(temperament,referencePitchClass,channelMask)}
  makeTemperamentPythagorean(referencePitchClass=2,channelMask=0xffff):void{const t=new Array(12).fill(0);const x=1200*Math.log2(3/2);t[1]=x*-5+3500;t[8]=x*-4+2800;t[3]=x*-3+2100;t[10]=x*-2+1400;t[5]=x*-1+700;t[0]=0;t[7]=x-700;t[2]=x*2-1400;t[9]=x*3-2100;t[4]=x*4-2800;t[11]=x*5-3500;t[6]=x*6-4200;this.makeMts9_TemperamentByCentsDeviationFromET(t,referencePitchClass,channelMask)}
  makeTemperamentMeantone(fraction=0.25,referencePitchClass=2,channelMask=0xffff):void{const t=new Array(12).fill(0);const x=1200*Math.log2((3/2)*Math.pow(81/80,-fraction));t[1]=x*-5+3500;t[8]=x*-4+2800;t[3]=x*-3+2100;t[10]=x*-2+1400;t[5]=x*-1+700;t[0]=0;t[7]=x-700;t[2]=x*2-1400;t[9]=x*3-2100;t[4]=x*4-2800;t[11]=x*5-3500;t[6]=x*6-4200;this.makeMts9_TemperamentByCentsDeviationFromET(t,referencePitchClass,channelMask)}
  makeTemperamentMeantoneCommaQuarter(referencePitchClass=2,channelMask=0xffff):void{this.makeTemperamentMeantone(1/4,referencePitchClass,channelMask)}
  makeTemperamentMeantoneCommaThird(referencePitchClass=2,channelMask=0xffff):void{this.makeTemperamentMeantone(1/3,referencePitchClass,channelMask)}
  makeTemperamentMeantoneCommaHalf(referencePitchClass=2,channelMask=0xffff):void{this.makeTemperamentMeantone(1/2,referencePitchClass,channelMask)}

  // The declarations exist in the upstream header but have no implementation
  // in MidiMessage.cpp; they are intentionally not synthesized here.

  toString(): string { return Array.from(this).map(v => v >= 0x80 ? `0x${v.toString(16).padStart(2,'0')}` : String(v)).join(' '); }
  private ensureSize(size:number):void{if(this.length<size)this.length=size;for(let i=0;i<size;i++)if(this[i]===undefined)this[i]=0;}
}

function u8(v:number):number{return v & 0xff;}
function mod(v:number,m:number):number{const r=v%m;return r<0?r+m:r;}
function spellingCode(accidental:number, table:Record<string,number>):number{return table[String(accidental)] ?? 0;}
