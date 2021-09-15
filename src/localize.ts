import type { LitElement } from 'lit';

export type FunctionParams<T> = T extends (...args: infer U) => string ? U : never;

export interface Translation {
  $code: string; // e.g. en, en-GB
  $name: string; // e.g. English, Español
  $dir: 'ltr' | 'rtl';

  [key: string]: any;
}

export const connectedElements = new Map<HTMLElement, string>();
const documentElementObserver = new MutationObserver(() => forceUpdate());
const translations: Map<string, Translation> = new Map();
let fallback: Translation;

function closest(selector: string, root: Element = this) {
  function getNext(el: Element | HTMLElement, next = el && el.closest(selector)): Element | null {
    if (el instanceof Window || el instanceof Document || !el) {
      return null;
    }

    return next ? next : getNext((el.getRootNode() as ShadowRoot).host);
  }

  return getNext(root);
}

export function detectLanguage(el: HTMLElement) {
  const closestEl = closest('[lang]', el) as HTMLElement;
  return closestEl?.lang;
}

export function registerTranslation(...translation: Translation[]) {
  translation.map(t => {
    const code = t.$code.toLowerCase();
    translations.set(code, t);

    // Use the first translation that's registered as the fallback
    if (!fallback) {
      fallback = t;
    }
  });
}

export function translate<K extends keyof Translation>(lang: string, key: K, ...args: FunctionParams<Translation[K]>) {
  const code = lang.toLowerCase().slice(0, 2); // e.g. en
  const subcode = lang.length > 2 ? lang.toLowerCase() : ''; // e.g. en-US
  const primary = translations.get(subcode);
  const secondary = translations.get(code);
  let term;

  // Look for a matching term using subcode, code, then the fallback
  if (primary && primary[key]) {
    term = primary[key];
  } else if (secondary && secondary[key]) {
    term = secondary[key];
  } else if (fallback && fallback[key]) {
    term = fallback[key];
  } else {
    throw new Error(`Cannot find "${key}" to translate.`);
  }

  if (typeof term === 'function') {
    return term(...args);
  }

  return term;
}

export function formatDate(lang: string, date: Date | string, options?: Intl.DateTimeFormatOptions) {
  date = new Date(date);
  return new Intl.DateTimeFormat(lang, options).format(date);
}

export function formatNumber(lang: string, number: number | string, options?: Intl.NumberFormatOptions) {
  number = Number(number);
  return isNaN(number) ? '' : new Intl.NumberFormat(lang, options).format(number);
}

export function forceUpdate() {
  [...connectedElements.keys()].map(el => {
    const lang = detectLanguage(el);
    connectedElements.set(el, lang);

    // Lit Element
    if (typeof (el as LitElement).requestUpdate === 'function') {
      (el as LitElement).requestUpdate();
    }
  });
}

// Update connected elements when a lang attribute changes
documentElementObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['lang'],
  childList: true,
  subtree: true
});
