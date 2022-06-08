import type { ReactiveControllerHost } from 'lit';

export type FunctionParams<T> = T extends (...args: infer U) => string ? U : never;

export interface Translation {
  $code: string; // e.g. en, en-GB
  $name: string; // e.g. English, Español
  $dir: 'ltr' | 'rtl';
  [key: string]: any;
}

type ReactiveElement = HTMLElement & ReactiveControllerHost & { requestUpdate(): void };

const elementUpdaters = new Set<() => void>();
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
  translation.forEach(t => {
    const code = t.$code.toLowerCase();
    translations.set(code, t);

    // The first translation that's registered is the fallback
    if (!fallback) {
      fallback = t;
    }
  });

  update();
}

//
// Translates a term using the specified locale. Looks up translations in order of language + country codes (es-PE),
// language code (es), then the fallback translation.
//
export function term<K extends keyof Translation>(lang: string, key: K, ...args: FunctionParams<Translation[K]>) {
  const code = lang.toLowerCase().slice(0, 2); // e.g. en
  const subcode = lang.length > 2 ? lang.toLowerCase() : ''; // e.g. en-GB
  const primary = translations.get(subcode);
  const secondary = translations.get(code);
  let term: any;

  // Look for a matching term using subcode, code, then the fallback
  if (primary && primary[key]) {
    term = primary[key];
  } else if (secondary && secondary[key]) {
    term = secondary[key];
  } else if (fallback && fallback[key]) {
    term = fallback[key];
  } else {
    console.error(`No translation found for: ${key}`);
    return key;
  }

  if (typeof term === 'function') {
    return term(...args) as string;
  }

  return term;
}

//
// Formats a date using the specified locale.
//
export function date(lang: string, dateToFormat: Date | string, options?: Intl.DateTimeFormatOptions) {
  dateToFormat = new Date(dateToFormat);
  return new Intl.DateTimeFormat(lang, options).format(dateToFormat);
}

//
// Formats a number using the specified locale.
//
export function number(lang: string, numberToFormat: number | string, options?: Intl.NumberFormatOptions) {
  numberToFormat = Number(numberToFormat);
  return isNaN(numberToFormat) ? '' : new Intl.NumberFormat(lang, options).format(numberToFormat);
}

//
// Formats a relative date using the specified locale.
//
export function relativeTime(
  lang: string,
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options?: Intl.RelativeTimeFormatOptions
) {
  return new Intl.RelativeTimeFormat(lang, options).format(value, unit);
}

//
// Updates all localized elements that are currently connected
//
function update() {
  documentDirection = document.documentElement.dir || 'ltr';
  documentLanguage = document.documentElement.lang || navigator.language;
  elementUpdaters.forEach(updater => updater());
}

//
// LocalizeController
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
export class LocalizeController {
  private element: HTMLElement;

  constructor(
    subject:
      | ReactiveElement
      | {
          element: HTMLElement;
          update: () => void;
          onConnect: (action: () => void) => void;
          onDisconnect: (action: () => void) => void;
        }
  ) {
    if (subject instanceof HTMLElement) {
      this.element = subject;
      const updater = () => subject.requestUpdate();

      subject.addController({
        hostConnected: () => elementUpdaters.add(updater),
        hostDisconnected: () => elementUpdaters.delete(updater)
      });
    } else {
      this.element = subject.element;
      subject.onConnect(() => elementUpdaters.add(subject.update));
      subject.onDisconnect(() => elementUpdaters.delete(subject.update));
    }
  }

  /**
   * Gets the host element's directionality as determined by the `dir` attribute. The return value is transformed to
   * lowercase.
   */
  dir() {
    return `${this.element.dir || documentDirection}`.toLowerCase();
  }

  /**
   * Gets the host element's language as determined by the `lang` attribute. The return value is transformed to
   * lowercase.
   */
  lang() {
    return `${this.element.lang || documentLanguage}`.toLowerCase();
  }

  term<K extends keyof Translation>(key: K, ...args: FunctionParams<Translation[K]>) {
    /** Outputs a localized term. */
    return term(this.element.lang || documentLanguage, key, ...args);
  }

  /** Outputs a localized date in the specified format. */
  date(dateToFormat: Date | string, options?: Intl.DateTimeFormatOptions) {
    return date(this.element.lang || documentLanguage, dateToFormat, options);
  }

  /** Outputs a localized number in the specified format. */
  number(numberToFormat: number | string, options?: Intl.NumberFormatOptions) {
    return number(this.element.lang || documentLanguage, numberToFormat, options);
  }

  /** Outputs a localized time in relative format. */
  relativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions) {
    return relativeTime(this.element.lang || documentLanguage, value, unit, options);
  }
}
