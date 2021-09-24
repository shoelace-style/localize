import { connectedElements, detectLanguage, translate as t, formatDate as d, formatNumber as n } from './';
import type { CaptureType } from '@microsoft/fast-element';
import type { FunctionParams, Translation } from './';

/**
 * FAST Decorator
 *
 * This class decorator ensures lang is a reactive property and adds and removes the component to and from the
 * connectedElements set.
 */
export function localize() {
  return (targetClass: any): typeof targetClass => {
    return class extends targetClass {
      constructor() {
        super();
      }

      connectedCallback() {
        super.connectedCallback();

        const lang = detectLanguage(this as typeof targetClass);
        connectedElements.set(this as typeof targetClass, lang);
      }

      disconnectedCallback() {
        super.disconnectedCallback();
        connectedElements.delete(this as typeof targetClass);
      }

      get lang(): string {
        return this.lang;
      }

      set lang(value: string) {
        connectedElements.set(this as typeof targetClass, value);
        this.updateLocalizedTerms();
      }

      updateLocalizedTerms() {
        //
        // This is a hacky way to force a re-render, but there's no other way to achieve this at the moment. This issue
        // tracks a proposal to introduce signals that will allow external changes to trigger updates.
        //
        // https://github.com/microsoft/fast/issues/5083
        //
        this.$fastController.renderTemplate(this.$fastController.template);
      }
    };
  };
}

function getLang(source: any) {
  let lang = '';

  // A directive may be called from any context. In some cases, such as when contexts are nested, we won't have a
  // reference to the host element. In that case, we can't provide a value for lang so we return an empty string.
  if (source instanceof HTMLElement) {
    lang = connectedElements.get(source) || '';
  }

  return lang;
}

/**
 * FAST format number directive
 *
 * Formats a number using the element's current language.
 */
export function translate<K extends keyof Translation, TSource = any>(key: K, ...args: FunctionParams<Translation[K]>) {
  return (source: TSource): string => {
    return t(getLang(source), key, ...args);
  };
}

/**
 * FAST format date directive
 *
 * Formats a date using the element's current language.
 */
export function formatDate<TSource = any>(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): CaptureType<TSource> {
  return (source: TSource): string => {
    return d(getLang(source), date, options);
  };
}

/**
 * FAST format number directive
 *
 * Formats a number using the element's current language.
 */
export function formatNumber<TSource = any>(
  number: number | string,
  options?: Intl.DateTimeFormatOptions
): CaptureType<TSource> {
  return (source: TSource): string => {
    return n(getLang(source), number, options);
  };
}
