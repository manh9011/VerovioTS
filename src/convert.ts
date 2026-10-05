import { HumNum } from './humlib';

/**
 * Pure-TypeScript port of the dependency-free numeric/string helpers from
 * humlib's Convert class. Methods are kept structurally close to C++ so later
 * humlib sub-passes can extend this class without changing call semantics.
 */
export class Convert {
  static getLcm(numbers: number[]): number {
    if (numbers.length === 0) return 1;
    let output = numbers[0];
    for (let i = 1; i < numbers.length; i++) {
      output = (output * numbers[i]) / Convert.getGcd(output, numbers[i]);
    }
    return output;
  }

  static getGcd(a: number, b: number): number {
    if (b === 0) return a;
    return Convert.getGcd(b, a % b);
  }

  static primeFactors(output: number[], n: number): void {
    output.length = 0;
    while (n % 2 === 0) {
      output.push(2);
      n = n >> 1;
    }
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      while (n % i === 0) {
        output.push(i);
        n = n / i;
      }
    }
    if (n > 2) output.push(n);
  }

  static nearIntQuantize(value: number, delta: number): number {
    if ((value + delta) - Math.trunc(value + delta) < delta * 2) {
      value = Math.trunc(value + delta);
    }
    return value;
  }

  static significantDigits(value: number, digits: number): number {
    const scale = Math.pow(10, digits);
    return Math.trunc(value * scale + 0.5) / scale;
  }

  static isNaN(value: number): boolean {
    return Number.isNaN(value);
  }

  static isPowerOfTwo(value: number): boolean {
    if (!Number.isInteger(value)) return false;
    if (value < 0) return ((-value & (-value - 1)) === 0);
    if (value > 0) return ((value & (value - 1)) === 0);
    return false;
  }

  static pearsonCorrelation(x: number[], y: number[]): number {
    let sumx = 0.0;
    let sumy = 0.0;
    let sumco = 0.0;
    let meanx = x[0];
    let meany = y[0];

    let size = x.length;
    if (y.length < size) size = y.length;

    for (let i = 2; i <= size; i++) {
      const sweep = (i - 1.0) / i;
      const deltax = x[i - 1] - meanx;
      const deltay = y[i - 1] - meany;
      sumx += deltax * deltax * sweep;
      sumy += deltay * deltay * sweep;
      sumco += deltax * deltay * sweep;
      meanx += deltax / i;
      meany += deltay / i;
    }

    const popsdx = Math.sqrt(sumx / size);
    const popsdy = Math.sqrt(sumy / size);
    const covxy = sumco / size;
    return covxy / (popsdx * popsdy);
  }

  static standardDeviation(x: number[]): number {
    let sum = 0.0;
    for (let i = 0; i < x.length; i++) sum += x[i];
    const mean = sum / x.length;
    let variance = 0.0;
    for (let i = 0; i < x.length; i++) variance += Math.pow(x[i] - mean, 2);
    variance = variance / x.length;
    return Math.sqrt(variance);
  }

  static standardDeviationSample(x: number[]): number {
    let sum = 0.0;
    for (let i = 0; i < x.length; i++) sum += x[i];
    const mean = sum / x.length;
    let variance = 0.0;
    for (let i = 0; i < x.length; i++) variance += Math.pow(x[i] - mean, 2);
    variance = variance / (x.length - 1);
    return Math.sqrt(variance);
  }

  static mean(x: number[]): number {
    let output = 0.0;
    for (let i = 0; i < x.length; i++) output += x[i];
    return output / x.length;
  }

  static coefficientOfVariationPopulation(x: number[]): number {
    return Convert.standardDeviation(x) / Convert.mean(x);
  }

  static coefficientOfVariationSample(x: number[]): number {
    return Convert.standardDeviationSample(x) / Convert.mean(x);
  }

  static nPvi(x: number[]): number {
    let output = 0.0;
    for (let i = 0; i < x.length - 1; i++) {
      output += Math.abs((x[i] - x[i + 1]) / (x[i] + x[i + 1]));
    }
    output *= 200.0 / (x.length - 1);
    return output;
  }

  static romanNumeralToInteger(roman: string): number {
    let sum = 0;
    let previous = '_';
    for (let i = roman.length - 1; i >= 0; i--) {
      let rdigit: number;
      switch (roman[i]) {
        case 'I': case 'i': rdigit = 1; break;
        case 'V': case 'v': rdigit = 5; break;
        case 'X': case 'x': rdigit = 10; break;
        case 'L': case 'l': rdigit = 50; break;
        case 'C': case 'c': rdigit = 100; break;
        case 'D': case 'd': rdigit = 500; break;
        case 'M': case 'm': rdigit = 1000; break;
        default: rdigit = -1;
      }
      if (rdigit < 0) continue;
      if (rdigit < sum && roman[i] !== previous) sum -= rdigit;
      else sum += rdigit;
      previous = roman[i];
    }
    return sum;
  }

  static isMensRest(mensdata: string): boolean {
    return mensdata.includes('r');
  }

  static isMensNote(mensdata: string): boolean {
    for (const ch of mensdata) {
      const lower = ch.toLowerCase();
      if (lower >= 'a' && lower <= 'g') return true;
    }
    return false;
  }

  static hasLigatureBegin(mensdata: string): boolean {
    return Convert.hasRectaLigatureBegin(mensdata) || Convert.hasObliquaLigatureBegin(mensdata);
  }

  static hasRectaLigatureBegin(mensdata: string): boolean {
    return mensdata.includes('<');
  }

  static hasObliquaLigatureBegin(mensdata: string): boolean {
    return mensdata.includes('[');
  }

  static hasLigatureEnd(mensdata: string): boolean {
    return Convert.hasRectaLigatureEnd(mensdata) || Convert.hasObliquaLigatureEnd(mensdata);
  }

  static hasRectaLigatureEnd(mensdata: string): boolean {
    return mensdata.includes('>');
  }

  static hasObliquaLigatureEnd(mensdata: string): boolean {
    return mensdata.includes(']');
  }
  static metToMensurationLevels(metsig: string): number {
    let maximodus = 2, modus = 2, tempus = 2, prolation = 2;
    let emaximodus = 0, emodus = 0, etempus = 0, eprolation = 0;
    let m = metsig.match(/^\*?met\(.*?\)_(\d)(\d)(\d)(\d)/);
    if (m) {
      emaximodus = Number(m[1]); emodus = Number(m[2]); etempus = Number(m[3]); eprolation = Number(m[4]);
      emaximodus = emaximodus === 3 ? 3 : 2; emodus = emodus === 3 ? 3 : 2;
      etempus = etempus === 3 ? 3 : 2; eprolation = eprolation === 3 ? 3 : 2;
      return emaximodus * 1000 + emodus * 100 + etempus * 10 + eprolation;
    }
    m = metsig.match(/^\*?met\(.*?\)_(\d)(\d)(\d)/);
    if (m) { emaximodus = +m[1]; emodus = +m[2]; etempus = +m[3]; }
    else if ((m = metsig.match(/^\*?met\(.*?\)_(\d)(\d)/))) { emaximodus = +m[1]; emodus = +m[2]; }
    else if ((m = metsig.match(/^\*?met\(.*?\)_(\d)/))) { emaximodus = +m[1]; }
    m = metsig.match(/^\*?met\((.+?)\)/);
    if (!m) return (emaximodus === 3 ? 3 : 2) * 1000 + (emodus === 3 ? 3 : 2) * 100 + (etempus === 3 ? 3 : 2) * 10 + (eprolation === 3 ? 3 : 2);
    switch (m[1]) {
      case 'C': case 'C|': case 'C2': case 'C|3/2': break;
      case 'C.': case 'C.|': prolation = 3; break;
      case 'C3': tempus = 3; break;
      case 'O': case 'O|': tempus = 3; break;
      case 'O.': case 'O.|': tempus = 3; prolation = 3; break;
      case 'O2': modus = 3; break;
      case 'O3': case 'O|3': maximodus = 3; modus = 3; tempus = 3; break;
      default: return maximodus * 1000 + modus * 100 + tempus * 10 + prolation;
    }
    maximodus = emaximodus !== 0 ? emaximodus : maximodus;
    modus = emodus !== 0 ? emodus : modus;
    tempus = etempus !== 0 ? etempus : tempus;
    prolation = eprolation !== 0 ? eprolation : prolation;
    return (maximodus === 3 ? 3 : 2) * 1000 + (modus === 3 ? 3 : 2) * 100 + (tempus === 3 ? 3 : 2) * 10 + (prolation === 3 ? 3 : 2);
  }

  static museToBase40(pitchString: string): number {
    let temp = pitchString;
    let i = temp.length - 1;
    while (i >= 0 && !/[0-9]/.test(temp[i])) i--;
    const octave = i <= 0 ? 4 : Number(temp[i]);
    temp = temp.slice(0, i).replace(/f/g, '-');
    const kb40 = Convert.kernToBase40(temp);
    return kb40 < 0 ? kb40 : (kb40 % 40) + 40 * octave;
  }

  static musePitchToKernPitch(museInput: string): string { return Convert.base40ToKern(Convert.museToBase40(museInput)); }

  static museClefToKernClef(mclef: string): string {
    const map: Record<string, string> = { '4':'*clefG2','22':'*clefF4','13':'*clefC3','12':'*clefC4','15':'*clefC1','14':'*clefC2','5':'*clefG1','3':'*clefG3','2':'*clefG4','1':'*clefG5','25':'*clefF1','24':'*clefF2','23':'*clefF3','21':'*clefF5','35':'*clefGv1','34':'*clefGv2','33':'*clefGv3','32':'*clefGv3','31':'*clefGv5' };
    return map[mclef] ?? '*';
  }

  static museKeySigToKernKeySig(mkeysig: string): string {
    const map: Record<string,string> = { '0':'*k[]','1':'*k[f#]','-1':'*k[b-]','2':'*k[f#c#]','-2':'*k[b-e-]','3':'*k[f#c#g#]','-3':'*k[b-e-a-]','4':'*k[f#c#g#d#]','-4':'*k[b-e-a-d-]','5':'*k[f#c#g#d#a#]','-5':'*k[b-e-a-d-g-]','6':'*k[f#c#g#d#a#e#]','-6':'*k[b-e-a-d-g-c-]','7':'*k[f#c#g#d#a#e#b#]','-7':'*k[b-e-a-d-g-c-f-]' };
    return map[mkeysig] ?? '*';
  }

  static museTimeSigToKernTimeSig(mtimesig: string): string {
    const map: Record<string,string> = {'11/0':'*M3/1','1/1':'*M4/4','0/0':'*M2/2','31/0':'*M2/1','61/0':'*M2/1','91/0':'*M3/1'};
    const unsupported = new Set(['12/0','21/0','22/0','41/0','42/0','43/0','51/0','52/0','62/0','63/0','71/0','72/0','81/0','82/0','92/0','93/0','101/0','102/0','103/0','104/0','105/0','106/0','111/0','112/0','121/0']);
    return map[mtimesig] ?? (unsupported.has(mtimesig) ? '' : `*M${mtimesig}`);
  }

  static museMeterSigToKernMeterSig(mtimesig: string): string {
    const map: Record<string,string> = {'11/0':'*met(O)','1/1':'*met(c)','0/0':'*met(c)','12/0':'*met(O:)','21/0':'*met(O.)','22/0':'*met(O;)','31/0':'*met(C)','41/0':'*met(C.)','42/0':'*met(C.3/2)','43/0':'*met(C.3/8)','51/0':'*met(Cr)','52/0':'*met(Cr|)','61/0':'*met(C|)','62/0':'*met(C|/2)','63/0':'*met(C|.)','71/0':'*met(C2)','72/0':'*met(C2/3)','81/0':'*met(O2)','82/0':'*met(O3/2)','91/0':'*met(O|)','92/0':'*met(O|3)','93/0':'*met(O|3/2)','101/0':'*met(C|3)','102/0':'*met(3)','103/0':'*met(3/2)','104/0':'*met(C|/3)','105/0':'*met(C3)','106/0':'*met(O/3)','111/0':'*met(C|2)','112/0':'*met(2)','121/0':'*met(Oo)'};
    return map[mtimesig] ?? '';
  }

  static museFiguredBassToKernFiguredBass(mfb: string): string {
    let output = '';
    for (let i = 0; i < mfb.length; i++) {
      const c = mfb[i];
      if (c === 'b') output += 'X'; else if (c === 'f') output += '-'; else if (c === 'x') output += '#';
      else if (c === '&' && i < mfb.length - 1 && mfb[i + 1] === '0') { output += ':'; i++; }
      else if (c === '/') output += '-/'; else if (c === '\\') output += '#/'; else if (c === '+') output += '#|';
      else if (/\d/.test(c) && i < mfb.length - 1 && (mfb[i+1] === '#' || mfb[i+1] === 'f' || mfb[i+1] === 'n')) { output += c + (mfb[i+1] === 'f' ? '-' : mfb[i+1]) + 'r'; i++; }
      else output += c;
    }
    return output;
  }

  static kernToDiatonicPC(kerndata: string): number { for (let i=0; i<kerndata.length && kerndata[i] !== ' '; i++) { const c=kerndata[i]; if(c==='r') return -1000; const m:Record<string,number>={A:5,a:5,B:6,b:6,C:0,c:0,D:1,d:1,E:2,e:2,F:3,f:3,G:4,g:4}; if(c in m) return m[c]; } return -2000; }
  static kernToDiatonicUC(kerndata: string): string { for(let i=0;i<kerndata.length&&kerndata[i]!==' ';i++){const c=kerndata[i];if(c==='r')return 'R';if(c>='A'&&c<='G')return c;if(c>='a'&&c<='g')return c.toUpperCase();}return 'X'; }
  static kernToDiatonicLC(kerndata: string): string { return Convert.kernToDiatonicUC(kerndata).toLowerCase(); }
  static kernToAccidentalCount(kerndata: string): number { let o=0;for(let i=0;i<kerndata.length&&kerndata[i]!==' ';i++){if(kerndata[i]==='-')o--;if(kerndata[i]==='#')o++;}return o; }
  static kernToOctaveNumber(kerndata: string): number { if(kerndata==='.')return -1000;let uc=0,lc=0;for(let i=0;i<kerndata.length&&kerndata[i]!==' ';i++){const c=kerndata[i];if(c==='r')return -1000;if(c>='A'&&c<='G')uc++;else if(c>='a'&&c<='g')lc++;}if(uc&&lc)return -1000;return uc?4-uc:lc?3+lc:-1000; }
  static kernToBase40PC(kerndata: string): number { const d=Convert.kernToDiatonicPC(kerndata);if(d<0)return d;const a=Convert.kernToAccidentalCount(kerndata);const base=[0,6,12,17,23,29,35][d];return base+a+2; }
  static kernToBase40(kerndata: string): number { const pc=Convert.kernToBase40PC(kerndata.trim()); if(pc<0)return pc;return pc+40*Convert.kernToOctaveNumber(kerndata); }
  static kernToBase12PC(kerndata: string): number { const d=Convert.kernToDiatonicPC(kerndata);if(d<0)return d;return [0,2,4,5,7,9,11][d]+Convert.kernToAccidentalCount(kerndata); }
  static kernToBase12(kerndata: string): number { return Convert.kernToBase12PC(kerndata)+12*Convert.kernToOctaveNumber(kerndata); }
  static base40ToDiatonic(b40: number): number { if(b40<0)return -1;const chroma=b40%40, off=Math.floor(b40/40)*7; if(chroma<=4)return off; if(chroma>=6&&chroma<=10)return 1+off;if(chroma>=12&&chroma<=16)return 2+off;if(chroma>=17&&chroma<=21)return 3+off;if(chroma>=23&&chroma<=27)return 4+off;if(chroma>=29&&chroma<=33)return 5+off;if(chroma>=35&&chroma<=39)return 6+off;return -1; }
  static base40ToAccidental(b40:number):number { if(b40<0)return 0; return [-2,-1,0,1,2,1000,-2,-1,0,1,2,1000,-2,-1,0,1,2,-2,-1,0,1,2,1000,-2,-1,0,1,2,1000,-2,-1,0,1,2,1000,-2,-1,0,1,2][b40%40]; }
  static base40ToKern(b40:number):string { const octave=Math.floor(b40/40),acc=Convert.base40ToAccidental(b40),d=Convert.base40ToDiatonic(b40)%7;const bases=['c','d','e','f','g','a','b'];let base=bases[d];if(octave<4)base=base.toUpperCase();let repeat=octave>4?octave-4:octave<3?3-octave:0;if(repeat>12)throw new Error(`unreasonable octave value: ${octave} for ${b40}`);let out=base.repeat(repeat+1);if(acc>0)out+='#'.repeat(acc);else if(acc<0)out+='-'.repeat(-acc);return out; }


  static base40ToMidiNoteNumber(b40: number): number {
    const octave = Math.trunc(b40 / 40) + 1;
    const accidental = Convert.base40ToAccidental(b40);
    const diatonicpc = Convert.base40ToDiatonic(b40) % 7;
    switch (diatonicpc) {
      case 0: return octave * 12 + 0 + accidental;
      case 1: return octave * 12 + 2 + accidental;
      case 2: return octave * 12 + 4 + accidental;
      case 3: return octave * 12 + 5 + accidental;
      case 4: return octave * 12 + 7 + accidental;
      case 5: return octave * 12 + 9 + accidental;
      case 6: return octave * 12 + 11 + accidental;
      default: return -1000;
    }
  }

  static kernToMidiNoteNumber(kerndata: string): number {
    const pc = Convert.kernToBase12PC(kerndata);
    const octave = Convert.kernToOctaveNumber(kerndata);
    return pc + 12 * (octave + 1);
  }

  static kernToBase7(kerndata: string): number {
    const diatonic = Convert.kernToDiatonicPC(kerndata);
    if (diatonic < 0) return diatonic;
    return diatonic + 7 * Convert.kernToOctaveNumber(kerndata);
  }

  static pitchToWbh(dpc: number, acc: number, octave: number, maxacc: number): number {
    if (dpc > 6) {
      dpc = (dpc.toString().charCodeAt(0) | 32) - 'a'.charCodeAt(0) + 5;
      dpc = dpc % 7;
    }
    let output = -1000;
    switch (dpc) {
      case 0: output = maxacc; break;
      case 1: output = 3 * maxacc + 2; break;
      case 2: output = 5 * maxacc + 4; break;
      case 3: output = 7 * maxacc + 5; break;
      case 4: output = 9 * maxacc + 7; break;
      case 5: output = 11 * maxacc + 9; break;
      case 6: output = 13 * maxacc + 11; break;
    }
    if (output < 0) return output;
    return (output + acc) + (7 * (maxacc * 2 + 1) + 5) * octave;
  }

  /** C++ output-reference adaptation: returns [dpc, acc, octave]. */
  static wbhToPitch(wbh: number, maxacc: number): [number, number, number] {
    const cwidth = maxacc * 2 + 1;
    const base = 7 * cwidth + 5;
    const octave = Math.trunc(wbh / base);
    const pc = wbh - octave * base;
    let pctest = cwidth;
    if (pc < pctest) return [0, pc - pctest + maxacc + 1, octave];
    pctest += 1 + cwidth;
    if (pc < pctest) return [1, pc - pctest + maxacc + 1, octave];
    pctest += 1 + cwidth;
    if (pc < pctest) return [2, pc - pctest + maxacc + 1, octave];
    pctest += cwidth;
    if (pc < pctest) return [3, pc - pctest + maxacc + 1, octave];
    pctest += 1 + cwidth;
    if (pc < pctest) return [4, pc - pctest + maxacc + 1, octave];
    pctest += 1 + cwidth;
    if (pc < pctest) return [5, pc - pctest + maxacc + 1, octave];
    pctest += 1 + cwidth;
    if (pc < pctest) return [6, pc - pctest + maxacc + 1, octave];
    return [-1, 0, octave];
  }

  static kernClefToBaseline(input: string): number {
    let clefname: string;
    if (input.startsWith('*clef')) clefname = input.slice(5);
    else if (input.startsWith('clef')) clefname = input.slice(4);
    else return -1000;
    const map: Record<string, string> = {
      G2:'e', F4:'GG', C3:'F', C4:'D', Gv2:'E', C1:'c', C2:'A', C5:'BB',
      G1:'g', G3:'c', G4:'A', G5:'F', F1:'F', F2:'D', F3:'BB', F5:'EE',
      Gv1:'G', Gv3:'C', Gv4:'AA', Gv5:'FF', Fv1:'FF', Fv2:'DD', Fv3:'BBB', Fv4:'GGG', Fv5:'EEE',
      Cv1:'C', Cv2:'AA', Cv3:'FF', Cv4:'DD', Cv5:'BBB', 'G^1':'gg', 'G^2':'ee', 'G^3':'cc', 'G^4':'a', 'G^5':'f',
      'F^1':'f', 'F^2':'d', 'F^3':'B', 'F^4':'G', 'F^5':'E', 'C^1':'cc', 'C^2':'a', 'C^3':'f', 'C^4':'d', 'C^5':'B'
    };
    return Convert.kernToBase7(map[clefname] ?? 'e');
  }

  static base40ToTrans(base40: number): string {
    const sign = base40 < 0 ? -1 : 1;
    const abs = Math.abs(base40);
    const chroma = abs % 40;
    const octave = Math.trunc(abs / 40);
    const table: Record<string, [number, number]> = {
      0:[0,0],1:[0,1],2:[0,2],4:[1,0],5:[1,1],6:[1,2],7:[1,3],8:[1,4],10:[2,2],11:[2,3],12:[2,4],13:[2,5],14:[2,6],15:[3,3],16:[3,4],17:[3,5],18:[3,6],19:[3,7],21:[4,5],22:[4,6],23:[4,7],24:[4,8],25:[4,9],27:[5,7],28:[5,8],29:[5,9],30:[5,10],31:[5,11],33:[6,9],34:[6,10],35:[6,11],36:[6,12],37:[6,13],38:[7,10],39:[7,11],
      '-1': [0,-1], '-2':[0,-2], '-3':[-1,1], '-4':[-1,0], '-5':[-1,-1], '-6':[-1,-2], '-7':[-1,-3], '-9':[-2,-1], '-10':[-2,-2], '-11':[-2,-3], '-12':[-2,-4], '-13':[-2,-5], '-15':[-3,-3], '-16':[-3,-4], '-17':[-3,-5], '-18':[-3,-6], '-19':[-3,-7], '-21':[-4,-5], '-22':[-4,-6], '-23':[-4,-7], '-24':[-4,-8], '-25':[-4,-9], '-26':[-5,-6], '-27':[-5,-7], '-28':[-5,-8], '-29':[-5,-9], '-30':[-5,-10], '-32':[-6,-8], '-33':[-6,-9], '-34':[-6,-10], '-35':[-6,-11], '-36':[-6,-12], '-38':[-7,-10], '-39':[-7,-11]
    };
    const [d0, c0] = table[String(sign * chroma)] ?? [0,0];
    const d = octave > 0 ? d0 + sign * octave * 7 : d0;
    const c = octave > 0 ? c0 + sign * octave * 12 : c0;
    return `d${d}c${c}`;
  }

  static base40ToIntervalAbbr(base40interval: number): string {
    if (base40interval < -1000) return 'r';
    let output = '';
    if (base40interval < 0) { output = '-'; base40interval = -base40interval; }
    const prefixes = ['p','a','aa','X','d','m','M','a','aa','X','d','m','M','a','aa','dd','d','p','a','aa','X','dd','d','p','a','aa','X','d','m','M','a','aa','X','d','m','M','a','aa','dd','d'];
    output += prefixes[base40interval % 40];
    output += String(Convert.base40IntervalToDiatonic(base40interval) + 1);
    return output;
  }

  static base40IntervalToDiatonic(base40interval: number): number {
    let sign = 1;
    if (base40interval < 0) { sign = -1; base40interval = -base40interval; }
    const octave = Math.trunc(base40interval / 40);
    const c = base40interval % 40;
    let d = 1000;
    if (c <= 2) d = 0; else if (c === 3) d = 1000; else if (c <= 8) d = 1; else if (c === 9) d = 1000;
    else if (c <= 14) d = 2; else if (c <= 19) d = 3; else if (c === 20) d = 1000; else if (c <= 25) d = 4;
    else if (c === 26) d = 1000; else if (c <= 31) d = 5; else if (c === 32) d = 1000; else if (c <= 37) d = 6; else if (c <= 39) d = 0;
    return sign * (d + octave * 7);
  }

  static transToBase40(input: string): number {
    const m = input.match(/^d(-?\d+)c(-?\d+)$/) ?? input.match(/^\*Trd(-?\d+)c(-?\d+)$/) ?? input.match(/^\*ITrd(-?\d+)c(-?\d+)$/);
    if (!m) return 0;
    const dval = Number(m[1]), cval = Number(m[2]);
    const dsign = dval < 0 ? -1 : 1;
    const doctave = Math.trunc(dsign * dval / 7);
    const key = `${dval},${cval}`;
    const map: Record<string, number> = {
      '0,0':0,'0,1':1,'0,2':2,'1,0':4,'1,1':5,'1,2':6,'1,3':7,'1,4':8,'2,2':10,'2,3':11,'2,4':12,'2,5':13,'2,6':14,'3,3':15,'3,4':16,'3,5':17,'3,6':18,'3,7':19,'4,5':21,'4,6':22,'4,7':23,'4,8':24,'4,9':25,'5,7':27,'5,8':28,'5,9':29,'5,10':30,'5,11':31,'6,9':33,'6,10':34,'6,11':35,'6,12':36,'6,13':37,'7,10':38,'7,11':38,
      '0,-0':-0,'0,-1':-1,'0,-2':-2,'-1,1':-3,'-1,-0':-4,'-1,-1':-5,'-1,-2':-6,'-1,-3':-7,'-2,-1':-9,'-2,-2':-10,'-2,-3':-11,'-2,-4':-12,'-2,-5':-13,'-3,-3':-15,'-3,-4':-16,'-3,-5':-17,'-3,-6':-18,'-3,-7':-19,'-4,-5':-21,'-4,-6':-22,'-4,-7':-23,'-4,-8':-24,'-4,-9':-25,'-5,-6':-26,'-5,-7':-27,'-5,-8':-28,'-5,-9':-29,'-5,-10':-30,'-6,-8':-32,'-6,-9':-33,'-6,-10':-34,'-6,-11':-35,'-6,-12':-36,'-7,-10':-38,'-7,-11':-39
    };
    if (!(key in map)) return 0;
    return map[key] + 40 * doctave * dsign;
  }

  static base40IntervalToLineOfFifths(base40interval: number): number {
    const table = [0,7,14,100,-12,-5,2,9,16,100,-10,-3,4,11,18,-15,-8,-1,6,13,100,-13,-6,1,8,15,100,-11,-4,3,10,17,100,-9,-2,5,12,19,-14,-7];
    return table[((base40interval + 4000) % 40 + 40) % 40];
  }

  static keyNumberToKern(number: number): string {
    const map: Record<string,string> = {'-7':'*k[b-e-a-d-g-c-f-]','-6':'*k[b-e-a-d-g-c-]','-5':'*k[b-e-a-d-g-]','-4':'*k[b-e-a-d-]','-3':'*k[b-e-a-]','-2':'*k[b-e-]','-1':'*k[b-]','0':'*k[]','1':'*k[f#]','2':'*k[f#c#]','3':'*k[f#c#g#]','4':'*k[f#c#g#d#]','5':'*k[f#c#g#d#a#]','6':'*k[f#c#g#d#a#e#]','7':'*k[f#c#g#d#a#e#b#]'};
    return map[String(number)] ?? '*k[]';
  }

  static base7ToBase40(base7: number): number {
    const octave = Math.trunc(base7 / 7);
    const b7pc = base7 - octave * 7;
    const b40pc = [0,6,12,17,23,29,35][b7pc];
    return octave * 40 + 2 + b40pc;
  }


  static base7ToBase12(aPitch: number, alter: number): number {
    if (aPitch <= 0) return -1;
    const octave = Math.trunc(aPitch / 7);
    const chroma = aPitch % 7;
    const output = [0, 2, 4, 5, 7, 9, 11][chroma] ?? 0;
    return output + 12 * (octave + 1) + alter;
  }

  static kernToStaffLocation(token: string, clef = ''): number {
    let offset = 0;
    const m = clef.match(/clef([GFC])([v^]*)(\d+)/);
    if (m) {
      const letter = m[1];
      const vcaret = m[2];
      const line = Number(m[3]);
      let octadj = 0;
      for (const ch of vcaret) {
        if (ch === '^') octadj--;
        else if (ch === 'v') octadj++;
      }
      if (letter === 'F') offset = 14 + 4;
      else if (letter === 'C') offset = 28;
      else offset = 28 + 4;
      offset += (line - 1) * 2;
      offset += octadj * 7;
    } else {
      offset = 28 + 2;
    }
    return Convert.kernToBase7(token) - offset;
  }

  static base12ToKern(aPitch: number): string {
    const octave = Math.trunc(aPitch / 12) - 1;
    if (octave > 12 || octave < -1) return 'c';
    const chroma = aPitch % 12;
    const names = ['c','c#','d','e-','e','f','f#','g','g#','a','b-','b'];
    let output = names[chroma] ?? 'c';
    output = octave >= 4 ? output[0].toLowerCase() + output.slice(1) : output[0].toUpperCase() + output.slice(1);
    const repeatMap: Record<number, number> = {4:0,5:1,6:2,7:3,8:4,9:5,3:0,2:1,1:2,0:3,'-1':4};
    const repeat = repeatMap[octave];
    if (repeat === undefined) return 'c';
    if (repeat === 0) return output;
    return output[0].repeat(repeat) + output;
  }

  static base12ToPitch(aPitch: number): string {
    const octave = Math.trunc(aPitch / 12) - 1;
    if (octave > 12 || octave < -1) return 'C4';
    const names = ['C','C#','D','E-','E','F','F#','G','G#','A','B-','B'];
    return (names[aPitch % 12] ?? 'C') + String(octave);
  }

  static base12ToBase40(aPitch: number): number {
    const octave = Math.trunc(aPitch / 12) - 1;
    const map = [2,3,8,13,14,19,20,25,30,31,36,37];
    return (map[aPitch % 12] ?? 2) + 40 * octave;
  }


  static pitchToClass(notes: number[], octave: number, modulo: number): number[] {
    const seen = new Set<number>();
    for (const note of notes) {
      if (note <= 0) continue;
      seen.add(note % modulo);
    }
    return Array.from(seen).sort((a, b) => a - b).map(pc => pc + modulo * octave);
  }

  static getMidiPCTriadAbbr(pcs: number[]): string {
    if (pcs.length === 0) return 'R';
    if (pcs.length === 1) return 'U';
    if (pcs.length === 2) {
      const a = pcs[0], b = pcs[1];
      const d = (b - a + 12) % 12;
      if (d === 7) return '-5';
      if (d === 3) return '-m';
      if (d === 4) return '-M';
      return '??';
    }
    if (pcs.length > 3) return '+';
    for (let r = 0; r < 3; r++) {
      const a = pcs[r];
      let b = pcs[(r + 1) % 3];
      let c = pcs[(r + 2) % 3];
      if (b < a) b += 12;
      if (c < b) c += 12;
      const d1 = b - a, d2 = c - b;
      if (d1 === 4 && d2 === 3) return 'M';
      if (d1 === 3 && d2 === 4) return 'm';
      if (d1 === 3 && d2 === 3) return 'd';
      if (d1 === 4 && d2 === 4) return 'A';
    }
    return '???';
  }

  static replaceOccurrences(source: string, search: string, replace: string): string {
    if (search.length === 0) return source;
    return source.split(search).join(replace);
  }

  static splitString(data: string, separator = ' '): string[] {
    if (separator.length !== 1) throw new Error('splitString separator must be one character');
    const output: string[] = [];
    let current = '';
    for (const ch of data) {
      if (ch === separator) {
        output.push(current);
        current = '';
      } else current += ch;
    }
    if (current.length > 0) output.push(current);
    if (output.length === 0) output.push(data);
    return output;
  }

  static repeatString(pattern: string, count: number): string {
    let output = '';
    for (let i = 0; i < count; i++) output += pattern;
    return output;
  }

  static encodeXml(input: string): string {
    let output = '';
    for (const ch of input) {
      switch (ch) {
        case '&': output += '&amp;'; break;
        case '<': output += '&lt;'; break;
        case '>': output += '&gt;'; break;
        case '"': output += '&quot;'; break;
        case "'": output += '&apos;'; break;
        default: output += ch;
      }
    }
    return output;
  }

  static getHumNumAttributes(num: HumNum): string {
    let output: string;
    if (num.isInteger()) output = ` float="${num.getNumerator()}"`;
    else output = ` float="${num.getFloat()}"`;
    if (!num.isInteger()) {
      const rem = num.getRemainder();
      output += ` ratfrac="${rem.getNumerator()}/${rem.getDenominator()}"`;
    }
    return output;
  }

  static trimWhiteSpace(input: string): string {
    return input.trim();
  }

  static startsWith(input: string, searchstring: string): boolean {
    return input.startsWith(searchstring);
  }

  static contains(input: string, pattern: string): boolean {
    return input.includes(pattern);
  }

  static extractIntegerList(input: string, maximum: number): number[] {
    if (maximum < 0) maximum = 0;
    const output: number[] = [];
    // Match C++ whitespace removal before segment parsing.
    const buffer = input.replace(/\s/g, '');
    let start = 0;
    while (start < buffer.length) {
      const rest = buffer.slice(start);
      const m = rest.match(/^([^,]+,?)/);
      if (!m) break;
      const segment = m[1];
      const temp = Convert.processSegmentEntry(segment, maximum);
      output.push(...temp);
      start += segment.length;
    }
    return output;
  }

  static processSegmentEntry(astring: string, maximum: number): number[] {
    let buffer = astring.replace(/,/g, '');
    buffer = Convert.removeDollarsFromString(buffer, maximum);
    const output: number[] = [];

    let m = buffer.match(/^(\d+)-(\d+)$/);
    if (m) {
      const first = Number.parseInt(m[1], 10);
      const last = Number.parseInt(m[2], 10);
      if ((first < 1 && first !== 0) || (last < 1 && last !== 0) || first > maximum || last > maximum) return output;
      const step = first > last ? -1 : 1;
      for (let value = first; ; value += step) {
        output.push(value);
        if (value === last) break;
      }
      return output;
    }

    m = buffer.match(/^(\d+)/);
    if (m) {
      const value = Number.parseInt(m[1], 10);
      if ((value < 1 && value !== 0) || value > maximum) return output;
      output.push(value);
    }
    return output;
  }

  static removeDollarsFromString(buffer: string, maximum: number): string {
    let out = buffer;
    const replacement = String(maximum);
    if (/[\%$]$/.test(out)) {
      out = out.replace(/[\%$]$/, replacement);
    } else if (/[\%$](?![\d-])/.test(out)) {
      out = out.replace(/[\%$](?![\d-])/g, replacement);
    } else if (/[\%$]$0/.test(out)) {
      out = out.replace(/[\%$]0/g, replacement);
    } else if (/^[\%$]-/.test(out)) {
      out = out.replace(/^[\%$]/, replacement);
    }
    while (/[\%$](\d+)/.test(out)) {
      const match = out.match(/[\%$](\d+)/);
      if (!match) break;
      const value = maximum - Math.abs(Number.parseInt(match[1], 10));
      out = out.replace(/[\%$]\d+/, String(value));
    }
    return out;
  }

  static generateRandomId(length: number): string {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let output = '';
    for (let i = 0; i < length; i++) {
      output += characters[Math.floor(Math.random() * characters.length)];
    }
    return output;
  }

  static tempoNameToMm(name: string, bot = 4, top = 4): number {
    let output = -1;
    const has = (pattern: string) => new RegExp(pattern, 'i').test(name);
    if (has('larghissimo')) output = 24;
    else if (has('adagissimo')) output = 35;
    else if (has('all.*molto')) output = 146;
    else if (has('all.*vivace')) output = 144;
    else if (has('all.*moderato')) output = 116;
    else if (has('all.*fuoco')) output = 138;
    else if (has('all.*presto')) output = 160;
    else if (has('grave')) output = 40;
    else if (has('largo')) output = 45;
    else if (has('lento?')) output = 50;
    else if (has('larghetto')) output = 63;
    else if (has('adagio')) output = 70;
    else if (has('adagietto')) output = 74;
    else if (has('andantino')) output = 90;
    else if (has('marcia moderato')) output = 85;
    else if (has('andante moderato')) output = 92;
    else if (has('allegretto')) output = 116;
    else if (has('rasch')) output = 128;
    else if (has('vivo')) output = 152;
    else if (has('vif')) output = 152;
    else if (has('vivace')) output = 164;
    else if (has('schnell')) output = 164;
    else if (has('vivacissimo')) output = 172;
    else if (has('allegrissimo')) output = 176;
    else if (has('moderato')) output = 108;
    else if (has('andante')) output = 88;
    else if (has('presto')) output = 180;
    else if (has('allegro')) output = 128;
    else if (has('prestissimo')) output = 208;
    else if (has('bewegt')) output = 144;
    else if (has('all(?!a)')) output = 128;

    if (output <= 0) return output;
    if (has('ma non troppo') || /non tanto/i.test(name)) {
      output = output > 100 ? Math.trunc(output * 0.93 + 0.5) : Math.trunc(output / 0.93 + 0.5);
    }
    if (bot === 2) output = Math.trunc(output * 1.75 + 0.5);
    else if (bot === 1) output = Math.trunc(output * 3.0 + 0.5);
    else if (bot === 8 && top % 3 === 0) output = Math.trunc(output * 1.5 + 0.5);
    else if (bot === 8) output = Math.trunc(output * 0.75 + 0.5);
    else if (bot === 16 && top % 3 === 0) output = Math.trunc(output * 1.5 / 2.0 + 0.5);
    else if (bot === 16) output = Math.trunc(output / 2.0 + 0.5);
    else if (bot === 32 && top % 3 === 0) output = Math.trunc(output * 1.5 / 4.0 + 0.5);
    else if (bot === 32) output = Math.trunc(output / 4.0 + 0.5);
    if (bot === 2 && top % 3 === 0) output = Math.trunc(output * 1.5 + 0.5);
    return output;
  }

  static makeBooleanTrackList(spinestring: string, maxtrack: number): boolean[] {
    const spinelist = new Array<boolean>(maxtrack + 1).fill(false);
    if (spinestring.length === 0) {
      for (let i = 1; i <= maxtrack; i++) spinelist[i] = true;
      return spinelist;
    }
    const entries = spinestring.split(/[^\d$-]+/).filter(Boolean);
    for (let entry of entries) {
      let m = entry.match(/\$(\d*)/);
      if (m) {
        entry = entry.replace(/\$\d*/, m[1] === '' ? String(maxtrack) : String(maxtrack - Number(m[1])));
      }
      let range = false;
      let val2 = -1;
      if (entry.includes('-')) {
        range = true;
        m = entry.match(/\$(\d*)/);
        if (m) entry = entry.replace(/\$\d*/, m[1] === '' ? String(maxtrack) : String(maxtrack - Number(m[1])));
        if (entry.endsWith('$')) entry = entry.slice(0, -1) + String(maxtrack);
        const r = entry.match(/-(\d+)/);
        if (r) val2 = Number(r[1]); else range = false;
      }
      const first = entry.match(/(\d+)/);
      if (!first) continue;
      const val = Number(first[1]);
      if (range) {
        const direction = val > val2 ? -1 : 1;
        for (let j = val; j !== val2; j += direction) if (j > 0 && j <= maxtrack) spinelist[j] = true;
        if (val2 > 0 && val2 <= maxtrack) spinelist[val2] = true;
      } else if (val > 0 && val <= maxtrack) spinelist[val] = true;
    }
    return spinelist;
  }



  static getReferenceKeyMeaning(tokenOrText: { getText(): string } | string): string {
    const token = typeof tokenOrText === 'string' ? tokenOrText : tokenOrText.getText();
    let key = '';
    let translation = '';
    let language = '';
    let number = '';
    const m = token.match(/^!!!+\s*([^:]+)\s*:/);
    if (m) key = m[1];
    if (!key || key[0] === key[0].toLowerCase()) return '';

    let x = key.match(/^([^@])+@@([^@]+)$/);
    if (x) {
      key = x[1];
      language = x[2];
    } else {
      x = key.match(/^([^@])+@([^@]+)$/);
      if (x) {
        key = x[1];
        translation = x[2];
      }
    }

    x = key.match(/^(.*)(\d+)$/);
    if (x) {
      key = x[1];
      number = x[2];
    }
    if (!key) return '';

    const meanings: Record<string, string> = {
      "ACO": "Collection designation",
      "AFR": "Form designation",
      "AGN": "genre designation",
      "AST": "Syle/period",
      "AMD": "Mode classification",
      "AMT": "Meter classification",
      "AIN": "Instrumentation",
      "ARE": "Geographical region of origin",
      "ARL": "Origin coordinates",
      "COM": "Composer",
      "CDT": "Composer's dates",
      "CNT": "Composer's nationality",
      "COA": "Attributed composer",
      "COS": "Suspected composer",
      "COL": "Composer's stage name",
      "COC": "Composer's corporate name",
      "CBL": "Composer's birth location",
      "CDL": "Composer's death location",
      "EED": "Electronic editor",
      "ENC": "Electronic encoder",
      "END": "Electronic encoding date",
      "EMD": "Modification description",
      "EEV": "Electronic edition version",
      "EFL": "Electronic file number",
      "EST": "Encoding status",
      "GTL": "Group title",
      "GAW": "Associated work",
      "GCO": "Collection designation",
      "HAO": "Aural history",
      "HTX": "Vocal text translation",
      "LYR": "Lyricist",
      "LIB": "Librettist",
      "LOR": "Orchestrator",
      "MPN": "Performer",
      "MPS": "Suspected performer",
      "MGN": "Performance group name",
      "MRD": "Performance date",
      "MLC": "Performance location",
      "MCN": "Conductor",
      "MPD": "Premier date",
      "OTL": "Work title",
      "OTP": "Popular title",
      "OTA": "Alternative title",
      "OPR": "Parent-work title",
      "OAC": "Act number",
      "OSC": "Scene number",
      "OMV": "Movement number",
      "OMD": "Movement designation",
      "OPS": "Opus number",
      "ONM": "Work number in opus",
      "OVM": "Volume number",
      "ODE": "Dedicatee",
      "OCO": "Commission",
      "OCL": "Collector",
      "OCY": "Composition country",
      "OPC": "Composition city",
      "PUB": "Publication status",
      "PPR": "First publisher",
      "PTL": "Publication title",
      "PDT": "Publication date",
      "PPP": "Publication location",
      "PC#": "Publication catalog number",
      "SCT": "Scholarly catalog abbreviation and number",
      "SCA": "Scholarly catalog unabbreviated name",
      "SMS": "Manuscript source name",
      "SML": "Manuscript location",
      "SMA": "Manuscript access",
      "RTL": "Recording Title",
      "RMM": "Manufacturer",
      "RC#": "Catalog number",
      "RRD": "Recording release date",
      "RLC": "Recording location",
      "RNP": "Record producer",
      "RDT": "Recording date",
      "RT#": "Recording track number",
      "RLN": "ASCII language setting",
      "RDF": "User-defined signifiers",
      "RNB": "Encoding note",
      "RWG": "Encoding warning",
      "TRN": "Translator",
      "VTS": "Data checksum",
      "YEP": "Publisher of electronic edition",
      "YEC": "Electronic edition copyright",
      "YER": "Electronic edition release year",
      "YEM": "Copyright message",
      "YOR": "Original document",
      "YOO": "Original edition owner",
      "YOY": "Original edition copyright year",
      "YOE": "Original edition editor"
    };
    let meaning = meanings[key] ?? '';
    if (number) meaning += ' #' + number;
    if (language) meaning += ', original language ' + Convert.getLanguageName(language);
    else if (translation) meaning += ', translated into ' + Convert.getLanguageName(language);
    return meaning;
  }

  static getLanguageName(abbreviation: string): string {
    let code = '';
    for (const ch of abbreviation) {
      if (ch === '@') continue;
      code += ch.toUpperCase();
    }
    const names: Record<string, string> = {
      "AA": "Afar",
      "AB": "Abkhazian",
      "AE": "Avestan",
      "AF": "Afrikaans",
      "AK": "Akan",
      "AM": "Amharic",
      "AN": "Aragonese",
      "AR": "Arabic",
      "AS": "Assamese",
      "AV": "Avaric",
      "AY": "Aymara",
      "AZ": "Azerbaijani",
      "BA": "Bashkir",
      "BE": "Belarusian",
      "BG": "Bulgarian",
      "BH": "Bihari languages",
      "BI": "Bislama",
      "BM": "Bambara",
      "BN": "Bengali",
      "BO": "Tibetan",
      "BR": "Breton",
      "BS": "Bosnian",
      "CA": "Catalan",
      "CE": "Chechen",
      "CH": "Chamorro",
      "CO": "Corsican",
      "CR": "Cree",
      "CS": "Czech",
      "CU": "Church Slavic",
      "CV": "Chuvash",
      "CY": "Welsh",
      "DA": "Danish",
      "DE": "German",
      "DV": "Divehi",
      "DZ": "Dzongkha",
      "EE": "Ewe",
      "EL": "Greek, Modern (1453-)",
      "EN": "English",
      "EO": "Esperanto",
      "ES": "Spanish",
      "ET": "Estonian",
      "EU": "Basque",
      "FA": "Persian",
      "FF": "Fulah",
      "FI": "Finnish",
      "FJ": "Fijian",
      "FO": "Faroese",
      "FR": "French",
      "FY": "Western Frisian",
      "GA": "Irish",
      "GD": "Gaelic",
      "GL": "Galician",
      "GN": "Guarani",
      "GU": "Gujarati",
      "GV": "Manx",
      "HA": "Hausa",
      "HE": "Hebrew",
      "HI": "Hindi",
      "HO": "Hiri Motu",
      "HR": "Croatian",
      "HT": "Haitian",
      "HU": "Hungarian",
      "HY": "Armenian",
      "HZ": "Herero",
      "IA": "Interlingua",
      "ID": "Indonesian",
      "IE": "Interlingue",
      "IG": "Igbo",
      "II": "Sichuan Yi",
      "IK": "Inupiaq",
      "IO": "Ido",
      "IS": "Icelandic",
      "IT": "Italian",
      "IU": "Inuktitut",
      "JA": "Japanese",
      "JV": "Javanese",
      "KA": "Georgian",
      "KG": "Kongo",
      "KI": "Kikuyu",
      "KJ": "Kuanyama",
      "KK": "Kazakh",
      "KL": "Greenlandic",
      "KM": "Central Khmer",
      "KN": "Kannada",
      "KO": "Korean",
      "KR": "Kanuri",
      "KS": "Kashmiri",
      "KU": "Kurdish",
      "KV": "Komi",
      "KW": "Cornish",
      "KY": "Kirghiz",
      "LA": "Latin",
      "LB": "Luxembourgish",
      "LG": "Ganda",
      "LI": "Limburgan",
      "LN": "Lingala",
      "LO": "Lao",
      "LT": "Lithuanian",
      "LU": "Luba-Katanga",
      "LV": "Latvian",
      "MG": "Malagasy",
      "MH": "Marshallese",
      "MI": "Maori",
      "MK": "Macedonian",
      "ML": "Malayalam",
      "MN": "Mongolian",
      "MR": "Marathi",
      "MS": "Malay",
      "MT": "Maltese",
      "MY": "Burmese",
      "NA": "Nauru",
      "NB": "Bokm\u00e5l, Norwegian",
      "ND": "Ndebele, North",
      "NE": "Nepali",
      "NG": "Ndonga",
      "NL": "Dutch",
      "NN": "Norwegian Nynorsk",
      "NO": "Norwegian",
      "NR": "Ndebele, South",
      "NV": "Navajo",
      "NY": "Chichewa",
      "OC": "Occitan (post 1500)",
      "OJ": "Ojibwa",
      "OM": "Oromo",
      "OR": "Oriya",
      "OS": "Ossetian",
      "PA": "Panjabi",
      "PI": "Pali",
      "PL": "Polish",
      "PS": "Pushto",
      "PT": "Portuguese",
      "QU": "Quechua",
      "RM": "Romansh",
      "RN": "Rundi",
      "RO": "Romanian",
      "RU": "Russian",
      "RW": "Kinyarwanda",
      "SA": "Sanskrit",
      "SC": "Sardinian",
      "SD": "Sindhi",
      "SE": "Northern Sami",
      "SG": "Sango",
      "SI": "Sinhala",
      "SL": "Slovenian",
      "SM": "Samoan",
      "SN": "Shona",
      "SO": "Somali",
      "SQ": "Albanian",
      "SR": "Serbian",
      "SS": "Swati",
      "ST": "Sotho, Southern",
      "SU": "Sundanese",
      "SV": "Swedish",
      "SW": "Swahili",
      "TA": "Tamil",
      "TE": "Telugu",
      "TG": "Tajik",
      "TH": "Thai",
      "TI": "Tigrinya",
      "TK": "Turkmen",
      "TL": "Tagalog",
      "TN": "Tswana",
      "TO": "Tonga (Tonga Islands)",
      "TR": "Turkish",
      "TS": "Tsonga",
      "TT": "Tatar",
      "TW": "Twi",
      "TY": "Tahitian",
      "UG": "Uighur",
      "UK": "Ukrainian",
      "UR": "Urdu",
      "UZ": "Uzbek",
      "VE": "Venda",
      "VI": "Vietnamese",
      "VO": "Volap\u00fck",
      "WA": "Walloon",
      "WO": "Wolof",
      "XH": "Xhosa",
      "YI": "Yiddish",
      "YO": "Yoruba",
      "ZA": "Zhuang",
      "ZH": "Chinese",
      "ZU": "Zulu",
      "AAR": "Afar",
      "ABK": "Abkhazian",
      "ACE": "Achinese",
      "ACH": "Acoli",
      "ADA": "Adangme",
      "ADY": "Adyghe",
      "AFA": "Afro-Asiatic languages",
      "AFH": "Afrihili",
      "AFR": "Afrikaans",
      "AIN": "Ainu",
      "AKA": "Akan",
      "AKK": "Akkadian",
      "ALB": "Albanian",
      "ALE": "Aleut",
      "ALG": "Algonquian languages",
      "ALT": "Southern Altai",
      "AMH": "Amharic",
      "ANG": "English, Old (ca.450-1100)",
      "ANP": "Angika",
      "APA": "Apache languages",
      "ARA": "Arabic",
      "ARC": "Aramaic (700-300 BCE)",
      "ARG": "Aragonese",
      "ARM": "Armenian",
      "ARN": "Mapudungun",
      "ARP": "Arapaho",
      "ART": "Artificial languages",
      "ARW": "Arawak",
      "ASM": "Assamese",
      "AST": "Asturian",
      "ATH": "Athapascan languages",
      "AUS": "Australian languages",
      "AVA": "Avaric",
      "AVE": "Avestan",
      "AWA": "Awadhi",
      "AYM": "Aymara",
      "AZE": "Azerbaijani",
      "BAD": "Banda languages",
      "BAI": "Bamileke languages",
      "BAK": "Bashkir",
      "BAL": "Baluchi",
      "BAM": "Bambara",
      "BAN": "Balinese",
      "BAQ": "Basque",
      "BAS": "Basa",
      "BAT": "Baltic languages",
      "BEJ": "Beja",
      "BEL": "Belarusian",
      "BEM": "Bemba",
      "BEN": "Bengali",
      "BER": "Berber languages",
      "BHO": "Bhojpuri",
      "BIH": "Bihari languages",
      "BIK": "Bikol",
      "BIN": "Bini",
      "BIS": "Bislama",
      "BLA": "Siksika",
      "BNT": "Bantu languages",
      "BOD": "Tibetan",
      "BOS": "Bosnian",
      "BRA": "Braj",
      "BRE": "Breton",
      "BTK": "Batak languages",
      "BUA": "Buriat",
      "BUG": "Buginese",
      "BUL": "Bulgarian",
      "BUR": "Burmese",
      "BYN": "Blin",
      "CAD": "Caddo",
      "CAI": "Central American Indian languages",
      "CAR": "Galibi Carib",
      "CAT": "Catalan",
      "CAU": "Caucasian languages",
      "CEB": "Cebuano",
      "CEL": "Celtic languages",
      "CES": "Czech",
      "CHA": "Chamorro",
      "CHB": "Chibcha",
      "CHE": "Chechen",
      "CHG": "Chagatai",
      "CHI": "Chinese",
      "CHK": "Chuukese",
      "CHM": "Mari",
      "CHN": "Chinook jargon",
      "CHO": "Choctaw",
      "CHP": "Chipewyan",
      "CHR": "Cherokee",
      "CHU": "Church Slavic",
      "CHV": "Chuvash",
      "CHY": "Cheyenne",
      "CMC": "Chamic languages",
      "CNR": "Montenegrin",
      "COP": "Coptic",
      "COR": "Cornish",
      "COS": "Corsican",
      "CPE": "Creoles and pidgins, English based",
      "CPF": "Creoles and pidgins, French-based",
      "CPP": "Creoles and pidgins, Portuguese-based",
      "CRE": "Cree",
      "CRH": "Crimean Tatar",
      "CRP": "Creoles and pidgins",
      "CSB": "Kashubian",
      "CUS": "Cushitic languages",
      "CYM": "Welsh",
      "CZE": "Czech",
      "DAK": "Dakota",
      "DAN": "Danish",
      "DAR": "Dargwa",
      "DAY": "Land Dayak languages",
      "DEL": "Delaware",
      "DEN": "Slave (Athapascan)",
      "DEU": "German",
      "DGR": "Dogrib",
      "DIN": "Dinka",
      "DIV": "Divehi",
      "DOI": "Dogri",
      "DRA": "Dravidian languages",
      "DSB": "Lower Sorbian",
      "DUA": "Duala",
      "DUM": "Dutch, Middle (ca.1050-1350)",
      "DUT": "Dutch",
      "DYU": "Dyula",
      "DZO": "Dzongkha",
      "EFI": "Efik",
      "EGY": "Egyptian (Ancient)",
      "EKA": "Ekajuk",
      "ELL": "Greek, Modern (1453-)",
      "ELX": "Elamite",
      "ENG": "English",
      "ENM": "English, Middle (1100-1500)",
      "EPO": "Esperanto",
      "EST": "Estonian",
      "EUS": "Basque",
      "EWE": "Ewe",
      "EWO": "Ewondo",
      "FAN": "Fang",
      "FAO": "Faroese",
      "FAS": "Persian",
      "FAT": "Fanti",
      "FIJ": "Fijian",
      "FIL": "Filipino",
      "FIN": "Finnish",
      "FIU": "Finno-Ugrian languages",
      "FON": "Fon",
      "FRA": "French",
      "FRE": "French",
      "FRM": "French, Middle (ca.1400-1600)",
      "FRO": "French, Old (842-ca.1400)",
      "FRR": "Northern Frisian",
      "FRS": "Eastern Frisian",
      "FRY": "Western Frisian",
      "FUL": "Fulah",
      "FUR": "Friulian",
      "GAA": "Ga",
      "GAY": "Gayo",
      "GBA": "Gbaya",
      "GEM": "Germanic languages",
      "GEO": "Georgin",
      "GER": "German",
      "GEZ": "Geez",
      "GIL": "Gilbertese",
      "GLA": "Gaelic",
      "GLE": "Irish",
      "GLG": "Galician",
      "GLV": "Manx",
      "GMH": "German, Middle High (ca.1050-1500)",
      "GOH": "German, Old High (ca.750-1050)",
      "GON": "Gondi",
      "GOR": "Gorontalo",
      "GOT": "Gothic",
      "GRB": "Grebo",
      "GRC": "Greek, Ancient (to 1453)",
      "GRE": "Greek",
      "GRN": "Guarani",
      "GSW": "Swiss German",
      "GUJ": "Gujarati",
      "GWI": "Gwich'in",
      "HAI": "Haida",
      "HAT": "Haitian",
      "HAU": "Hausa",
      "HAW": "Hawaiian",
      "HEB": "Hebrew",
      "HER": "Herero",
      "HIL": "Hiligaynon",
      "HIM": "Himachali languages",
      "HIN": "Hindi",
      "HIT": "Hittite",
      "HMN": "Hmong",
      "HMO": "Hiri Motu",
      "HRV": "Croatian",
      "HSB": "Upper Sorbian",
      "HUN": "Hungarian",
      "HUP": "Hupa",
      "HYE": "Armenian",
      "IBA": "Iban",
      "IBO": "Igbo",
      "ICE": "Icelandic",
      "IDO": "Ido",
      "III": "Sichuan Yi",
      "IJO": "Ijo languages",
      "IKU": "Inuktitut",
      "ILE": "Interlingue",
      "ILO": "Iloko",
      "INA": "Interlingua)",
      "INC": "Indic languages",
      "IND": "Indonesian",
      "INE": "Indo-European languages",
      "INH": "Ingush",
      "IPK": "Inupiaq",
      "IRA": "Iranian languages",
      "IRO": "Iroquoian languages",
      "ISL": "Icelandic",
      "ITA": "Italian",
      "JAV": "Javanese",
      "JBO": "Lojban",
      "JPN": "Japanese",
      "JPR": "Judeo-Persian",
      "JRB": "Judeo-Arabic",
      "KAA": "Kara-Kalpak",
      "KAB": "Kabyle",
      "KAC": "Kachin",
      "KAL": "Greenlandic",
      "KAM": "Kamba",
      "KAN": "Kannada",
      "KAR": "Karen languages",
      "KAS": "Kashmiri",
      "KAT": "Georgian",
      "KAU": "Kanuri",
      "KAW": "Kawi",
      "KAZ": "Kazakh",
      "KBD": "Kabardian",
      "KHA": "Khasi",
      "KHI": "Khoisan languages",
      "KHM": "Central Khmer",
      "KHO": "Khotanese",
      "KIK": "Kikuyu",
      "KIN": "Kinyarwanda",
      "KIR": "Kirghiz",
      "KMB": "Kimbundu",
      "KOK": "Konkani",
      "KOM": "Komi",
      "KON": "Kongo",
      "KOR": "Korean",
      "KOS": "Kosraean",
      "KPE": "Kpelle",
      "KRC": "Karachay-Balkar",
      "KRL": "Karelian",
      "KRO": "Kru languages",
      "KRU": "Kurukh",
      "KUA": "Kuanyama",
      "KUM": "Kumyk",
      "KUR": "Kurdish",
      "KUT": "Kutenai",
      "LAD": "Ladino",
      "LAH": "Lahnda",
      "LAM": "Lamba",
      "LAO": "Lao",
      "LAT": "Latin",
      "LAV": "Latvian",
      "LEZ": "Lezghian",
      "LIM": "Limburgan",
      "LIN": "Lingala",
      "LIT": "Lithuanian",
      "LOL": "Mongo",
      "LOZ": "Lozi",
      "LTZ": "Luxembourgish",
      "LUA": "Luba-Lulua",
      "LUB": "Luba-Katanga",
      "LUG": "Ganda",
      "LUI": "Luiseno",
      "LUN": "Lunda",
      "LUO": "Luo (Kenya and Tanzania)",
      "LUS": "Lushai",
      "MAC": "Macedonian",
      "MAD": "Madurese",
      "MAG": "Magahi",
      "MAH": "Marshallese",
      "MAI": "Maithili",
      "MAK": "Makasar",
      "MAL": "Malayalam",
      "MAN": "Mandingo",
      "MAO": "Maori",
      "MAP": "Austronesian languages",
      "MAR": "Marathi",
      "MAS": "Masai",
      "MAY": "Malay",
      "MDF": "Moksha",
      "MDR": "Mandar",
      "MEN": "Mende",
      "MGA": "Irish, Middle (900-1200)",
      "MIC": "Mi'kmaq",
      "MIN": "Minangkabau",
      "MIS": "Uncoded languages",
      "MKD": "Macedonian",
      "MKH": "Mon-Khmer languages",
      "MLG": "Malagasy",
      "MLT": "Maltese",
      "MNC": "Manchu",
      "MNI": "Manipuri",
      "MNO": "Manobo languages",
      "MOH": "Mohawk",
      "MON": "Mongolian",
      "MOS": "Mossi",
      "MRI": "Maori",
      "MSA": "Malay",
      "MUL": "Multiple languages",
      "MUN": "Munda languages",
      "MUS": "Creek",
      "MWL": "Mirandese",
      "MWR": "Marwari",
      "MYA": "Burmese",
      "MYN": "Mayan languages",
      "MYV": "Erzya",
      "NAH": "Nahuatl languages",
      "NAI": "North American Indian languages",
      "NAP": "Neapolitan",
      "NAU": "Nauru",
      "NAV": "Navajo",
      "NBL": "Ndebele, South",
      "NDE": "Ndebele, North",
      "NDO": "Ndonga",
      "NDS": "Low German",
      "NEP": "Nepali",
      "NEW": "Nepal Bhasa",
      "NIA": "Nias",
      "NIC": "Niger-Kordofanian languages",
      "NIU": "Niuean",
      "NLD": "Dutch",
      "NNO": "Norwegian Nynorsk",
      "NOB": "Bokm\u00e5l, Norwegian",
      "NOG": "Nogai",
      "NON": "Norse, Old",
      "NOR": "Norwegian",
      "NQO": "N'Ko",
      "NSO": "Pedi",
      "NUB": "Nubian languages",
      "NWC": "Classical Newari",
      "NYA": "Chichewa",
      "NYM": "Nyamwezi",
      "NYN": "Nyankole",
      "NYO": "Nyoro",
      "NZI": "Nzima",
      "OCI": "Occitan (post 1500)",
      "OJI": "Ojibwa",
      "ORI": "Oriya",
      "ORM": "Oromo",
      "OSA": "Osage",
      "OSS": "Ossetian",
      "OTA": "Turkish, Ottoman (1500-1928)",
      "OTO": "Otomian languages",
      "PAA": "Papuan languages",
      "PAG": "Pangasinan",
      "PAL": "Pahlavi",
      "PAM": "Pampanga",
      "PAN": "Panjabi",
      "PAP": "Papiamento",
      "PAU": "Palauan",
      "PEO": "Persian, Old (ca.600-400 B.C.)",
      "PER": "Persian",
      "PHI": "Philippine languages",
      "PHN": "Phoenician",
      "PLI": "Pali",
      "POL": "Polish",
      "PON": "Pohnpeian",
      "POR": "Portuguese",
      "PRA": "Prakrit languages",
      "PRO": "Proven\u00e7al, Old (to 1500)",
      "PUS": "Pushto",
      "QUE": "Quechua",
      "RAJ": "Rajasthani",
      "RAP": "Rapanui",
      "RAR": "Rarotongan",
      "ROA": "Romance languages",
      "ROH": "Romansh",
      "ROM": "Romany",
      "RON": "Romanian",
      "RUM": "Romanian",
      "RUN": "Rundi",
      "RUP": "Aromanian",
      "RUS": "Russian",
      "SAD": "Sandawe",
      "SAG": "Sango",
      "SAH": "Yakut",
      "SAI": "South American Indian languages",
      "SAL": "Salishan languages",
      "SAM": "Samaritan Aramaic",
      "SAN": "Sanskrit",
      "SAS": "Sasak",
      "SAT": "Santali",
      "SCN": "Sicilian",
      "SCO": "Scots",
      "SEL": "Selkup",
      "SEM": "Semitic languages",
      "SGA": "Irish, Old (to 900)",
      "SGN": "Sign Languages",
      "SHN": "Shan",
      "SID": "Sidamo",
      "SIN": "Sinhala",
      "SIO": "Siouan languages",
      "SIT": "Sino-Tibetan languages",
      "SLA": "Slavic languages",
      "SLO": "Slovak",
      "SLV": "Slovenian",
      "SMA": "Southern Sami",
      "SME": "Northern Sami",
      "SMI": "Sami languages",
      "SMJ": "Lule Sami",
      "SMN": "Inari Sami",
      "SMO": "Samoan",
      "SMS": "Skolt Sami",
      "SNA": "Shona",
      "SND": "Sindhi",
      "SNK": "Soninke",
      "SOG": "Sogdian",
      "SOM": "Somali",
      "SON": "Songhai languages",
      "SOT": "Sotho, Southern",
      "SPA": "Spanish",
      "SQI": "Albanian",
      "SRD": "Sardinian",
      "SRN": "Sranan Tongo",
      "SRP": "Serbian",
      "SRR": "Serer",
      "SSA": "Nilo-Saharan languages",
      "SSW": "Swati",
      "SUK": "Sukuma",
      "SUN": "Sundanese",
      "SUS": "Susu",
      "SUX": "Sumerian",
      "SWA": "Swahili",
      "SWE": "Swedish",
      "SYC": "Classical Syriac",
      "SYR": "Syriac",
      "TAH": "Tahitian",
      "TAI": "Tai languages",
      "TAM": "Tamil",
      "TAT": "Tatar",
      "TEL": "Telugu",
      "TEM": "Timne",
      "TER": "Tereno",
      "TET": "Tetum",
      "TGK": "Tajik",
      "TGL": "Tagalog",
      "THA": "Thai",
      "TIB": "Tibetian",
      "TIG": "Tigre",
      "TIR": "Tigrinya",
      "TIV": "Tiv",
      "TKL": "Tokelau",
      "TLH": "Klingon",
      "TLI": "Tlingit",
      "TMH": "Tamashek",
      "TOG": "Tonga (Nyasa)",
      "TON": "Tonga (Tonga Islands)",
      "TPI": "Tok Pisin",
      "TSI": "Tsimshian",
      "TSN": "Tswana",
      "TSO": "Tsonga",
      "TUK": "Turkmen",
      "TUM": "Tumbuka",
      "TUP": "Tupi languages",
      "TUR": "Turkish",
      "TUT": "Altaic languages",
      "TVL": "Tuvalu",
      "TWI": "Twi",
      "TYV": "Tuvinian",
      "UDM": "Udmurt",
      "UGA": "Ugaritic",
      "UIG": "Uighur",
      "UKR": "Ukrainian",
      "UMB": "Umbundu",
      "UND": "Undetermined",
      "URD": "Urdu",
      "UZB": "Uzbek",
      "VAI": "Vai",
      "VEN": "Venda",
      "VIE": "Vietnamese",
      "VOL": "Volap\u00fck",
      "VOT": "Votic",
      "WAK": "Wakashan languages",
      "WAL": "Wolaitta",
      "WAR": "Waray",
      "WAS": "Washo",
      "WEL": "Welsh",
      "WEN": "Sorbian languages",
      "WLN": "Walloon",
      "WOL": "Wolof",
      "XAL": "Kalmyk",
      "XHO": "Xhosa",
      "YAO": "Yao",
      "YAP": "Yapese",
      "YID": "Yiddish",
      "YOR": "Yoruba",
      "YPK": "Yupik languages",
      "ZAP": "Zapotec",
      "ZBL": "Blissymbols",
      "ZEN": "Zenaga",
      "ZGH": "Moroccan",
      "ZHA": "Zhuang",
      "ZHO": "Chinese",
      "ZND": "Zande languages",
      "ZUL": "Zulu",
      "ZUN": "Zuni",
      "ZZA": "Zaza"
    };
    return names[code] ?? code;
  }


  static recipToDuration(recip: string, scale: HumNum = new HumNum(4), separator = ' '): HumNum {
    const loc = recip.indexOf(separator);
    const subtok = loc >= 0 ? recip.slice(0, loc) : recip;

    // C++ treats any reciprocal containing 'q' as a grace note here.
    if (recip.indexOf('q') >= 0) return new HumNum(0);

    let dotcount = 0;
    let numi = -1;
    for (let i = 0; i < subtok.length; i++) {
      if (subtok[i] === '.') dotcount++;
      if (numi < 0 && /[0-9]/.test(subtok[i])) numi = i;
    }

    const percent = subtok.indexOf('%');
    let numerator = 1;
    let denominator = 1;
    let output = new HumNum();

    if (percent >= 0) {
      numerator = 1;
      denominator = Number.parseInt(subtok[numi++] ?? '', 10);
      if (Number.isNaN(denominator)) denominator = 0;
      while (numi < subtok.length && /[0-9]/.test(subtok[numi])) {
        denominator = denominator * 10 + (subtok.charCodeAt(numi++) - 48);
      }
      if (percent + 1 < subtok.length && /[0-9]/.test(subtok[percent + 1])) {
        let xi = percent + 1;
        numerator = subtok.charCodeAt(xi++) - 48;
        while (xi < subtok.length && /[0-9]/.test(subtok[xi])) {
          numerator = numerator * 10 + (subtok.charCodeAt(xi++) - 48);
        }
      }
      output.setValue(numerator, denominator);
    } else if (numi < 0) {
      return new HumNum(0);
    } else if (subtok[numi] === '0') {
      let zerocount = 1;
      for (let i = numi + 1; i < subtok.length; i++) {
        if (subtok[i] === '0') zerocount++;
        else break;
      }
      numerator = 2 ** zerocount;
      output.setValue(numerator, 1);
    } else {
      denominator = Number.parseInt(subtok.slice(numi).match(/^\d+/)?.[0] ?? '0', 10);
      output.setValue(1, Number.isNaN(denominator) ? 0 : denominator);
    }

    if (dotcount <= 0) return output.mul(scale);
    const bot = 2 ** dotcount;
    const top = 2 ** (dotcount + 1) - 1;
    return output.mul(new HumNum(top, bot)).mul(scale);
  }

  static recipToDurationIgnoreGrace(recip: string, scale: HumNum = new HumNum(4), separator = ' '): HumNum {
    const loc = recip.indexOf(separator);
    const subtok = loc >= 0 ? recip.slice(0, loc) : recip;
    let dotcount = 0;
    let numi = -1;
    for (let i = 0; i < subtok.length; i++) {
      if (subtok[i] === '.') dotcount++;
      if (numi < 0 && /[0-9]/.test(subtok[i])) numi = i;
    }
    const percent = subtok.indexOf('%');
    let numerator = 1;
    let denominator = 1;
    const output = new HumNum();
    if (percent >= 0) {
      numerator = 1;
      denominator = Number.parseInt(subtok[numi++] ?? '', 10);
      if (Number.isNaN(denominator)) denominator = 0;
      while (numi < subtok.length && /[0-9]/.test(subtok[numi])) {
        denominator = denominator * 10 + (subtok.charCodeAt(numi++) - 48);
      }
      if (percent + 1 < subtok.length && /[0-9]/.test(subtok[percent + 1])) {
        let xi = percent + 1;
        numerator = subtok.charCodeAt(xi++) - 48;
        while (xi < subtok.length && /[0-9]/.test(subtok[xi])) {
          numerator = numerator * 10 + (subtok.charCodeAt(xi++) - 48);
        }
      }
      output.setValue(numerator, denominator);
    } else if (numi < 0) {
      return new HumNum(0);
    } else if (subtok[numi] === '0') {
      let zerocount = 1;
      for (let i = numi + 1; i < subtok.length; i++) {
        if (subtok[i] === '0') zerocount++;
        else break;
      }
      numerator = 2 ** zerocount;
      output.setValue(numerator, 1);
    } else {
      denominator = Number.parseInt(subtok.slice(numi).match(/^\d+/)?.[0] ?? '0', 10);
      output.setValue(1, Number.isNaN(denominator) ? 0 : denominator);
    }
    if (dotcount <= 0) return output.mul(scale);
    const bot = 2 ** dotcount;
    const top = 2 ** (dotcount + 1) - 1;
    return output.mul(new HumNum(top, bot)).mul(scale);
  }

  static recipToDurationNoDots(recip: string, scale: HumNum = new HumNum(4), separator = ' '): HumNum {
    return Convert.recipToDuration(recip.replace(/\./g, 'Z'), scale, separator);
  }

  static durationToRecip(duration: HumNum, scale: HumNum = new HumNum(1, 4)): string {
    duration = duration.mul(scale);
    if (duration.getNumerator() === 1) return String(duration.getDenominator());
    if (duration.getDenominator() === 1) {
      switch (duration.getNumerator()) {
        case 2: return '0';
        case 3: return '0.';
        case 4: return '00';
        case 6: return '00.';
        case 8: return '000';
        case 12: return '000.';
      }
    }
    if (duration.getNumerator() === 0) return 'q';

    const test1dot = duration.mul(2).div(3);
    if (test1dot.getNumerator() === 1) return `${test1dot.getDenominator()}.`;
    const test2dot = duration.mul(4).div(7);
    if (test2dot.getNumerator() === 1) return `${test2dot.getDenominator()}..`;
    const test3dot = duration.mul(8).div(15);
    if (test3dot.getNumerator() === 1) return `${test3dot.getDenominator()}...`;
    return `${duration.getDenominator()}%${duration.getNumerator()}`;
  }

  static durationFloatToRecip(input: number, timebase: HumNum = new HumNum(1, 4)): string {
    let output = '';
    let testinput = input;
    let basic = 4.0 / input * timebase.getFloat();
    let diff = basic - Math.trunc(basic);
    if (diff > 0.998) {
      diff = 1.0 - diff;
      basic += diff;
    }
    if (input === 0.0625) return '64';
    if (input === 0.125) return '32';
    if (input === 0.25) return '16';
    if (input === 0.5) return '8';
    if (input === 1.0) return '4';
    if (input === 2.0) return '2';
    if (input === 4.0) return '1';
    if (input === 8.0) return '0';
    if (input === 12.0) return '0.';
    if (input === 16.0) return '00';
    if (input === 24.0) return '00.';
    if (input === 32.0) return '000';
    if (input === 48.0) return '000.';
    if (Math.abs(input - (4.0 * 2.0 / 3.0)) < 0.0001) return '3%2';
    if (Math.abs(input - (4.0 * 4.0 / 3.0)) < 0.0001) return '3%4';
    if (Math.abs(input - (4.0 * 9.0 / 8.0)) < 0.0001) return '8%9';
    if (Math.abs(input - 18.0) < 0.0001) return '2%9';
    if (input === 0.0833) return '48';
    if (diff < 0.002) {
      output += String(Math.trunc(basic));
    } else {
      testinput = input / 3.0 * 2.0;
      basic = 4.0 / testinput;
      diff = basic - Math.trunc(basic);
      if (diff < 0.002) {
        output += `${Math.trunc(basic)}.`;
      } else {
        testinput = input / 7.0 * 4.0;
        basic = 4.0 / testinput;
        diff = basic - Math.trunc(basic);
        if (diff < 0.002) {
          output += `${Math.trunc(basic)}..`;
        } else {
          testinput = input / 15.0 * 4.0;
          basic = 2.0 / testinput;
          diff = basic - Math.trunc(basic);
          if (diff < 0.002) {
            output += `${Math.trunc(basic)}...`;
          } else {
            output += `q${input.toFixed(6)}`;
          }
        }
      }
    }
    return output;
  }

}

