/**
 * src/hum/humlib.cpp HumInstrument -- instrument code -> General MIDI map.
 * Mirrors the C++ static table: index 0 is skipped by every accessor
 * (`m_index > 0`), so the first sorted record is unreachable by name.
 */

interface HumInstrumentRecord {
  humdrum: string;
  gm: number;
  name: string;
}

/** C++ strips a leading `*I` in the name-based overloads only. */
function stripI(hname: string): string {
  return hname.startsWith('*I') ? hname.slice(2) : hname;
}

export class HumInstrument {
  private static m_data: HumInstrumentRecord[] = [];
  private static m_classcount = 0;

  private m_index = -1;

  public constructor(hname?: string) {
    if (HumInstrument.m_classcount === 0) HumInstrument.initialize();
    HumInstrument.m_classcount++;
    this.m_index = hname === undefined ? -1 : this.find(hname);
  }

  /** C++ destructor resets the per-instance index. */
  public dispose(): void { this.m_index = -1; }

  public getGM(): number { return this.m_index > 0 ? HumInstrument.m_data[this.m_index].gm : -1; }

  public getGMByName(hname: string): number {
    const tindex = this.find(stripI(hname));
    return tindex > 0 ? HumInstrument.m_data[tindex].gm : -1;
  }

  public getName(): string { return this.m_index > 0 ? HumInstrument.m_data[this.m_index].name : ''; }

  public getNameByName(hname: string): string {
    const i = this.find(stripI(hname));
    return i > 0 ? HumInstrument.m_data[i].name : '';
  }

  public getHumdrum(): string { return this.m_index > 0 ? HumInstrument.m_data[this.m_index].humdrum : ''; }

  public setGM(hname: string, value: number): number {
    if (value < 0 || value > 127) return 0;
    const rindex = this.find(hname);
    if (rindex > 0) HumInstrument.m_data[rindex].gm = value;
    else { this.afi(hname, value, hname); this.sortData(); }
    return rindex;
  }

  public setHumdrum(hname: string): void { this.m_index = this.find(stripI(hname)); }

  private afi(humdrumName: string, gm: number, enName: string): void {
    HumInstrument.m_data.push({ humdrum: humdrumName, name: enName, gm });
  }

  /** Binary search over the humdrum-name-sorted table (C++ bsearch). */
  private find(hname: string): number {
    let lo = 0;
    let hi = HumInstrument.m_data.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const cmp = HumInstrument.m_data[mid].humdrum < hname ? -1
        : HumInstrument.m_data[mid].humdrum > hname ? 1 : 0;
      if (cmp === 0) return mid;
      if (cmp < 0) lo = mid + 1;
      else hi = mid - 1;
    }
    return -1;
  }

  private sortData(): void {
    HumInstrument.m_data.sort((a, b) => (a.humdrum < b.humdrum ? -1 : a.humdrum > b.humdrum ? 1 : 0));
  }

  private static initialize(): void {
    // Table order mirrors the C++ afi(...) sequence, then sorted by name.
        HumInstrument.seed("accor", 21, "accordion");
        HumInstrument.seed("alto", 74, "alto");
        HumInstrument.seed("anvil", 112, "anvil");
        HumInstrument.seed("archl", 24, "archlute");
        HumInstrument.seed("armon", 22, "harmonica");
        HumInstrument.seed("arpa", 46, "harp");
        HumInstrument.seed("bagpI", 109, "bagpipe (Irish)");
        HumInstrument.seed("bagpS", 109, "bagpipe (Scottish)");
        HumInstrument.seed("banjo", 105, "banjo");
        HumInstrument.seed("bansu", 73, "bansuri");
        HumInstrument.seed("barit", 52, "baritone");
        HumInstrument.seed("baset", 71, "bassett horn");
        HumInstrument.seed("bass", 52, "bass");
        HumInstrument.seed("bdrum", 116, "bass drum");
        HumInstrument.seed("bguit", 33, "electric bass guitar");
        HumInstrument.seed("biwa", 73, "biwa");
        HumInstrument.seed("bongo", 116, "bongo");
        HumInstrument.seed("brush", 121, "brush");
        HumInstrument.seed("bscan", 52, "basso cantante");
        HumInstrument.seed("bspro", 52, "basso profondo");
        HumInstrument.seed("bugle", 56, "bugle");
        HumInstrument.seed("calam", 68, "chalumeau");
        HumInstrument.seed("calpe", 82, "calliope");
        HumInstrument.seed("calto", 52, "contralto");
        HumInstrument.seed("campn", 14, "bell");
        HumInstrument.seed("cangl", 69, "english horn");
        HumInstrument.seed("canto", 52, "canto");
        HumInstrument.seed("caril", 14, "carillon");
        HumInstrument.seed("castr", 52, "castrato");
        HumInstrument.seed("casts", 115, "castanets");
        HumInstrument.seed("cbass", 43, "contrabass");
        HumInstrument.seed("cello", 42, "violoncello");
        HumInstrument.seed("cemba", 6, "harpsichord");
        HumInstrument.seed("cetra", 40, "cittern");
        HumInstrument.seed("chain", 112, "chains");
        HumInstrument.seed("chcym", 119, "China cymbal");
        HumInstrument.seed("chime", 14, "chimes");
        HumInstrument.seed("chlma", 70, "alto shawm");
        HumInstrument.seed("chlms", 70, "soprano shawm");
        HumInstrument.seed("chlmt", 70, "tenor shawm");
        HumInstrument.seed("clap", 127, "hand clapping");
        HumInstrument.seed("clara", 71, "alto clarinet");
        HumInstrument.seed("clarb", 71, "bass clarinet");
        HumInstrument.seed("clarp", 71, "piccolo clarinet");
        HumInstrument.seed("clars", 71, "clarinet");
        HumInstrument.seed("clave", 113, "claves");
        HumInstrument.seed("clavi", 7, "clavichord");
        HumInstrument.seed("clest", 8, "celesta");
        HumInstrument.seed("clrno", 56, "clarino");
        HumInstrument.seed("colsp", 73, "coloratura soprano");
        HumInstrument.seed("conga", 116, "conga");
        HumInstrument.seed("cor", 60, "horn");
        HumInstrument.seed("cornm", 109, "French bagpipe");
        HumInstrument.seed("corno", 56, "cornett");
        HumInstrument.seed("cornt", 56, "cornet");
        HumInstrument.seed("coro", 52, "chorus");
        HumInstrument.seed("crshc", 119, "crash cymbal");
        HumInstrument.seed("ctenor", 52, "counter-tenor");
        HumInstrument.seed("ctina", 21, "concertina");
        HumInstrument.seed("drmsp", 73, "dramatic soprano");
        HumInstrument.seed("drum", 118, "drum");
        HumInstrument.seed("drumP", 118, "small drum");
        HumInstrument.seed("dulc", 15, "dulcimer");
        HumInstrument.seed("eguit", 27, "electric guitar");
        HumInstrument.seed("fag_c", 70, "contrabassoon");
        HumInstrument.seed("fagot", 70, "bassoon");
        HumInstrument.seed("false", 74, "falsetto");
        HumInstrument.seed("fdrum", 116, "frame drum");
        HumInstrument.seed("feme", 52, "female voice");
        HumInstrument.seed("fife", 76, "fife");
        HumInstrument.seed("fingc", 119, "finger cymbal");
        HumInstrument.seed("flt", 73, "flute");
        HumInstrument.seed("flt_a", 73, "alto flute");
        HumInstrument.seed("flt_b", 73, "bass flute");
        HumInstrument.seed("fltda", 74, "alto recorder");
        HumInstrument.seed("fltdb", 74, "bass recorder");
        HumInstrument.seed("fltdn", 74, "sopranino recorder");
        HumInstrument.seed("fltds", 74, "soprano recorder");
        HumInstrument.seed("fltdt", 74, "tenor recorder");
        HumInstrument.seed("flugh", 60, "flugelhorn");
        HumInstrument.seed("forte", 2, "fortepiano");
        HumInstrument.seed("gen", 0, "generic instrument");
        HumInstrument.seed("genB", 0, "generic bass instrument");
        HumInstrument.seed("genT", 0, "generic treble instrument");
        HumInstrument.seed("glock", 9, "glockenspiel");
        HumInstrument.seed("gong", 119, "gong");
        HumInstrument.seed("guitr", 24, "guitar");
        HumInstrument.seed("hammd", 16, "Hammond electronic organ");
        HumInstrument.seed("hbell", 112, "handbell");
        HumInstrument.seed("hbell", 112, "handbell");
        HumInstrument.seed("heck", 70, "heckelphone");
        HumInstrument.seed("heltn", 52, "Heldentenor");
        HumInstrument.seed("hichi", 68, "hichiriki");
        HumInstrument.seed("hurdy", 82, "hurdy-gurdy");
        HumInstrument.seed("kitv", 40, "kit violin");
        HumInstrument.seed("klav", 0, "keyboard");
        HumInstrument.seed("kokyu", 110, "kokyu");
        HumInstrument.seed("komun", 107, "komun'go");
        HumInstrument.seed("koto", 107, "koto");
        HumInstrument.seed("kruma", 56, "alto crumhorn");
        HumInstrument.seed("krumb", 56, "bass crumhorn");
        HumInstrument.seed("krums", 56, "soprano crumhorn");
        HumInstrument.seed("krumt", 56, "tenor crumhorn");
        HumInstrument.seed("lion", 113, "lion's roar");
        HumInstrument.seed("liuto", 24, "lute");
        HumInstrument.seed("lyrsp", 73, "lyric soprano");
        HumInstrument.seed("lyrtn", 60, "lyric tenor");
        HumInstrument.seed("male", 52, "male voice");
        HumInstrument.seed("mando", 24, "mandolin");
        HumInstrument.seed("marac", 113, "maracas");
        HumInstrument.seed("marim", 12, "marimba");
        HumInstrument.seed("mbari", 52, "high baritone");
        HumInstrument.seed("mezzo", 52, "mezzo soprano");
        HumInstrument.seed("nfant", 52, "child's voice");
        HumInstrument.seed("nokan", 77, "nokan");
        HumInstrument.seed("oboe", 68, "oboe");
        HumInstrument.seed("oboeD", 69, "oboe d'amore");
        HumInstrument.seed("ocari", 79, "ocarina");
        HumInstrument.seed("ondes", 95, "ondes Martenot");
        HumInstrument.seed("ophic", 58, "ophicleide");
        HumInstrument.seed("organ", 19, "pipe organ");
        HumInstrument.seed("oud", 24, "oud");
        HumInstrument.seed("paila", 113, "timbales");
        HumInstrument.seed("panpi", 75, "panpipe");
        HumInstrument.seed("pbell", 14, "bell plate");
        HumInstrument.seed("pguit", 24, "Portuguese guitar");
        HumInstrument.seed("physh", 20, "physharmonica");
        HumInstrument.seed("piano", 0, "pianoforte");
        HumInstrument.seed("piatt", 119, "cymbals");
        HumInstrument.seed("picco", 72, "piccolo");
        HumInstrument.seed("pipa", 24, "Chinese lute");
        HumInstrument.seed("porta", 23, "portative organ");
        HumInstrument.seed("psalt", 7, "psaltery");
        HumInstrument.seed("qin", 7, "qin");
        HumInstrument.seed("quinto", 52, "quinto");
        HumInstrument.seed("quitr", 24, "gittern");
        HumInstrument.seed("rackt", 56, "racket");
        HumInstrument.seed("ratl", 115, "rattle");
        HumInstrument.seed("rebec", 24, "rebec");
        HumInstrument.seed("recit", 52, "recitativo");
        HumInstrument.seed("reedo", 20, "reed organ");
        HumInstrument.seed("rhode", 4, "Fender-Rhodes electric piano");
        HumInstrument.seed("ridec", 119, "ride cymbal");
        HumInstrument.seed("sarod", 104, "sarod");
        HumInstrument.seed("sarus", 58, "sarrusophone");
        HumInstrument.seed("saxA", 65, "alto saxophone");
        HumInstrument.seed("saxB", 67, "bass saxophone");
        HumInstrument.seed("saxC", 67, "contrabass saxophone");
        HumInstrument.seed("saxN", 64, "sopranino saxophone");
        HumInstrument.seed("saxR", 67, "baritone saxophone");
        HumInstrument.seed("saxS", 64, "soprano saxophone");
        HumInstrument.seed("saxT", 66, "tenor saxophone");
        HumInstrument.seed("sbell", 112, "sleigh bells");
        HumInstrument.seed("sdrum", 118, "snare drum (kit)");
        HumInstrument.seed("shaku", 77, "shakuhachi");
        HumInstrument.seed("shami", 106, "shamisen");
        HumInstrument.seed("sheng", 111, "sheng");
        HumInstrument.seed("sho", 111, "sho");
        HumInstrument.seed("siren", 103, "siren");
        HumInstrument.seed("sitar", 104, "sitar");
        HumInstrument.seed("slap", 127, "slapstick");
        HumInstrument.seed("soprn", 52, "soprano");
        HumInstrument.seed("spshc", 119, "splash cymbal");
        HumInstrument.seed("steel", 114, "steel-drum");
        HumInstrument.seed("stim", 122, "Sprechstimme");
        HumInstrument.seed("stimA", 122, "Sprechstimme, alto");
        HumInstrument.seed("stimB", 122, "Sprechstimme, bass");
        HumInstrument.seed("stimC", 122, "Sprechstimme, contralto");
        HumInstrument.seed("stimR", 122, "Sprechstimme, baritone");
        HumInstrument.seed("stimS", 122, "Sprechstimme, soprano");
        HumInstrument.seed("strdr", 113, "string drum");
        HumInstrument.seed("sxhA", 65, "alto saxhorn");
        HumInstrument.seed("sxhB", 67, "bass saxhorn");
        HumInstrument.seed("sxhC", 67, "contrabass saxhorn");
        HumInstrument.seed("sxhR", 67, "baritone saxhorn");
        HumInstrument.seed("sxhS", 64, "soprano saxhorn");
        HumInstrument.seed("sxhT", 66, "tenor saxhorn");
        HumInstrument.seed("synth", 5, "keyboard synthesizer");
        HumInstrument.seed("tabla", 117, "tabla");
        HumInstrument.seed("tambn", 112, "tambourine");
        HumInstrument.seed("tambu", 117, "tambura");
        HumInstrument.seed("tanbr", 117, "tanbur");
        HumInstrument.seed("tblok", 115, "temple blocks");
        HumInstrument.seed("tdrum", 118, "tenor drum");
        HumInstrument.seed("tenor", 52, "tenor");
        HumInstrument.seed("timpa", 117, "timpani");
        HumInstrument.seed("tiorb", 24, "theorbo");
        HumInstrument.seed("tom", 116, "tom-tom drum");
        HumInstrument.seed("trngl", 112, "triangle");
        HumInstrument.seed("tromb", 57, "bass trombone");
        HumInstrument.seed("tromp", 56, "trumpet");
        HumInstrument.seed("tromt", 57, "tenor trombone");
        HumInstrument.seed("tuba", 58, "tuba");
        HumInstrument.seed("tubaB", 58, "bass tuba");
        HumInstrument.seed("tubaC", 58, "contrabass tuba");
        HumInstrument.seed("tubaT", 58, "tenor tuba");
        HumInstrument.seed("tubaU", 58, "subcontra tuba");
        HumInstrument.seed("ukule", 24, "ukulele");
        HumInstrument.seed("vibra", 11, "vibraphone");
        HumInstrument.seed("vina", 104, "vina");
        HumInstrument.seed("viola", 41, "viola");
        HumInstrument.seed("violb", 43, "bass viola da gamba");
        HumInstrument.seed("viold", 41, "viola d'amore");
        HumInstrument.seed("violn", 40, "violin");
        HumInstrument.seed("violp", 40, "piccolo violin");
        HumInstrument.seed("viols", 40, "treble viola da gamba");
        HumInstrument.seed("violt", 42, "tenor viola da gamba");
        HumInstrument.seed("vox", 52, "generic voice");
        HumInstrument.seed("wblok", 115, "woodblock");
        HumInstrument.seed("xylo", 13, "xylophone");
        HumInstrument.seed("zithr", 7, "zither");
        HumInstrument.seed("zurna", 24, "zurna");
    HumInstrument.sortStatic();
  }

  private static seed(humdrum: string, gm: number, name: string): void {
    HumInstrument.m_data.push({ humdrum, name, gm });
  }

  private static sortStatic(): void {
    HumInstrument.m_data.sort((a, b) => (a.humdrum < b.humdrum ? -1 : a.humdrum > b.humdrum ? 1 : 0));
  }

  /** Inspection hook; copies so callers cannot mutate the static table. */
  public static getDataSnapshot(): HumInstrumentRecord[] {
    return HumInstrument.m_data.map((x) => ({ ...x }));
  }
}

/** C++ HumInstrument::getGM(Hname) equivalent for direct lookups. */
export function humInstrumentGM(hname: string): number {
  return new HumInstrument().getGMByName(hname);
}

/** C++ HumInstrument::getName(Hname) equivalent. */
export function humInstrumentName(hname: string): string {
  return new HumInstrument().getNameByName(hname);
}
