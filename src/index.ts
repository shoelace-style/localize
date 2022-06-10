import type { LitElement, ReactiveController, ReactiveControllerHost } from 'lit';

export type FunctionParams<T> = T extends (...args: infer U) => string ? U : never;

export interface Translation {
  $code: string; // e.g. en, en-GB
  $name: string; // e.g. English, Español
  $dir: 'ltr' | 'rtl';
}

export interface DefaultTranslation extends Translation {
  [key: string]: any;
}

const connectedElements = new Set<HTMLElement>();
const documentElementObserver = new MutationObserver(update);
const translations: Map<string, Translation> = new Map();
let documentDirection = document.documentElement.dir || 'ltr';
let documentLanguage = document.documentElement.lang || navigator.language;
let fallback: Translation;

// Watch for changes on <html lang>
documentElementObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['dir', 'lang']
});

//
// Registers one or more translations
//
export function registerTranslation(...translation: Translation[]) {
  translation.map(t => {
    const code = t.$code.toLowerCase();

    if (translations.has(code)) {
      // Merge translations that share the same language code
      translations.set(code, { ...translations.get(code), ...t });
    } else {
      translations.set(code, t);
    }

    // The first translation that's registered is the fallback
    if (!fallback) {
      fallback = t;
    }
  });

  update();
}

//
// Updates all localized elements that are currently connected
//
export function update() {
  documentDirection = document.documentElement.dir || 'ltr';
  documentLanguage = document.documentElement.lang || navigator.language;

  [...connectedElements.keys()].map((el: LitElement) => {
    if (typeof el.requestUpdate === 'function') {
      el.requestUpdate();
    }
  });
}

//
// Reactive controller
//
// To use this controller, import the class and instantiate it in a custom element constructor:
//
//  private localize = new LocalizeController(this);
//
// This will add the element to the set and make it respond to changes to <html dir|lang> automatically. To make it
// respond to changes to its own dir|lang properties, make it a property:
//
//  @property() dir: string;
//  @property() lang: string;
//
// To use a translation method, call it like this:
//
//  ${this.localize.term('term_key_here')}
//  ${this.localize.date('2021-12-03')}
//  ${this.localize.number(1000000)}
//
export class LocalizeController<UserTranslation extends Translation = DefaultTranslation>
  implements ReactiveController
{
  host: ReactiveControllerHost & HTMLElement;

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    connectedElements.add(this.host);
  }

  hostDisconnected() {
    connectedElements.delete(this.host);
  }

  /**
   * Gets the host element's directionality as determined by the `dir` attribute. The return value is transformed to
   * lowercase.
   */
  dir() {
    return `${this.host.dir || documentDirection}`.toLowerCase();
  }

  /**
   * Gets the host element's language as determined by the `lang` attribute. The return value is transformed to
   * lowercase.
   */
  lang() {
    return `${this.host.lang || documentLanguage}`.toLowerCase();
  }

  term<K extends keyof UserTranslation>(key: K, ...args: FunctionParams<UserTranslation[K]>) {
    const code = this.lang().toLowerCase().slice(0, 2); // e.g. en
    const regionCode = this.lang().length > 2 ? this.lang().toLowerCase() : ''; // e.g. en-gb
    const primary = <UserTranslation>translations.get(regionCode);
    const secondary = <UserTranslation>translations.get(code);
    let term: any;

    // Look for a matching term using regionCode, code, then the fallback
    if (primary && primary[key]) {
      term = primary[key];
    } else if (secondary && secondary[key]) {
      term = secondary[key];
    } else if (fallback && fallback[key as keyof Translation]) {
      term = fallback[key as keyof Translation];
    } else {
      console.error(`No translation found for: ${String(key)}`);
      return key;
    }

    if (typeof term === 'function') {
      return term(...args) as string;
    }

    return term;
  }

  /** Outputs a localized date in the specified format. */
  date(dateToFormat: Date | string, options?: Intl.DateTimeFormatOptions) {
    dateToFormat = new Date(dateToFormat);
    return new Intl.DateTimeFormat(this.lang(), options).format(dateToFormat);
  }

  /** Outputs a localized number in the specified format. */
  number(numberToFormat: number | string, options?: Intl.NumberFormatOptions) {
    numberToFormat = Number(numberToFormat);
    return isNaN(numberToFormat) ? '' : new Intl.NumberFormat(this.lang(), options).format(numberToFormat);
  }

  /** Outputs a localized time in relative format. */
  relativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions) {
    return new Intl.RelativeTimeFormat(this.lang(), options).format(value, unit);
  }
}
