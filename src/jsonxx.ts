/** jsonxx replacement over stdlib JSON (moved from mocks; real logic, no stub). */
/** Structural boundaries for EditorToolkit dependencies that are not yet fully migrated. */

/**
 * jsonxx replacement built on stdlib JSON.parse/JSON.stringify.
 *
 * jsonxx::Object keeps an ordered key map; `json()` re-serializes it. We keep
 * insertion order via a plain object (ES2015+ preserves key order), matching
 * jsonxx output for the subset Verovio uses: parse, has, get, import, <<.
 */
export interface JsonObjectLike {
  json(): string;
  reset(): void;
  import(key: string, value: unknown): void;
  has(key: string): boolean;
  getValue(key: string): unknown;
  /** jsonxx `obj << key << value` stream operator. */
  append(key: string, value: unknown): void;
}

export interface JsonArrayLike {
  json(): string;
  reset(): void;
  append(value: unknown): void;
  size(): number;
  get(i: number): unknown;
}

export class JsonObjectMock implements JsonObjectLike {
  private value: Record<string, unknown> = {};

  public json(): string {
    return JSON.stringify(this.value);
  }

  public reset(): void {
    this.value = {};
  }

  public import(key: string, value: unknown): void {
    this.value[key] = value;
  }

  public has(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.value, key);
  }

  public getValue(key: string): unknown {
    return this.value[key];
  }

  public append(key: string, value: unknown): void {
    this.import(key, value);
  }
}

/** jsonxx::Object over stdlib JSON. */
export class JsonxxObject implements JsonObjectLike {
  private value: Record<string, unknown> = {};

  /** jsonxx::Object::parse — returns false on invalid JSON or non-object root. */
  public parse(str: string): boolean {
    try {
      const parsed = JSON.parse(str);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false;
      this.value = parsed as Record<string, unknown>;
      return true;
    } catch {
      return false;
    }
  }

  public json(): string {
    return JSON.stringify(this.value);
  }

  public reset(): void {
    this.value = {};
  }

  public import(key: string, value: unknown): void {
    this.value[key] = value;
  }

  public has(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.value, key);
  }

  /** jsonxx has<T>/get<T> — T erased at runtime; caller narrows. */
  public get(key: string): unknown {
    return this.value[key];
  }

  public getValue(key: string): unknown {
    return this.value[key];
  }

  public append(key: string, value: unknown): void {
    this.import(key, value);
  }

  public empty(): boolean {
    return Object.keys(this.value).length === 0;
  }
}

/** jsonxx::Array over stdlib JSON. */
export class JsonxxArray implements JsonArrayLike {
  private value: unknown[] = [];

  public parse(str: string): boolean {
    try {
      const parsed = JSON.parse(str);
      if (!Array.isArray(parsed)) return false;
      this.value = parsed;
      return true;
    } catch {
      return false;
    }
  }

  public json(): string {
    return JSON.stringify(this.value);
  }

  public reset(): void {
    this.value = [];
  }

  public append(value: unknown): void {
    this.value.push(value);
  }

  public size(): number {
    return this.value.length;
  }

  public get(i: number): unknown {
    return this.value[i];
  }

  public empty(): boolean {
    return this.value.length === 0;
  }
}

