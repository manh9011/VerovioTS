/**
 * Pure TypeScript translation of include/vrv/toolkitdef.h.
 *
 * This header contains the public scalar toolkit definitions plus declarations
 * for functions implemented in resources.cpp and vrv.cpp. The implementations
 * remain behind an injected runtime until those source units are migrated.
 */
import { Resources } from './resources.js';
import { EnableLog as EnableLogImpl, EnableLogToBuffer as EnableLogToBufferImpl } from './vrv.js';

export enum FileFormat {
  UNKNOWN = 0,
  AUTO,
  MEI,
  HUMDRUM,
  HUMMEI,
  HUMMIDI,
  PAE,
  ABC,
  GABC,
  CMME,
  DARMS,
  VOLPIANO,
  MUSICXML,
  MUSICXMLHUM,
  MEIHUM,
  MUSEDATAHUM,
  ESAC,
  MIDI,
  TIMEMAP,
  EXPANSIONMAP,
  SERIALIZATION,
}

export enum LogLevel {
  LOG_OFF = 0,
  LOG_ERROR,
  LOG_WARNING,
  LOG_INFO,
  LOG_DEBUG,
}

export function SetDefaultResourcePath(path: string): void {
  Resources.SetDefaultPath(path);
}

export function EnableLog(level: LogLevel | number): void {
  EnableLogImpl(level);
}

export function EnableLogToBuffer(value: boolean): void {
  EnableLogToBufferImpl(value);
}
