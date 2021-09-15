import { Directive, directive, Part } from 'lit/directive.js';
import { connectedElements, detectLanguage, formatDate, formatNumber, translate } from '../localize';

import type { FunctionParams, Translation } from '../localize';
import type { LitElement } from 'lit';

/**
 * Lit Decorator
 *
 * This class decorator ensures lang is a reactive property and adds and removes the component to and from the
 * connectedElements set.
 */
export function localize() {
  return (targetClass: any): typeof targetClass => {
    return class extends targetClass {
      static get properties() {
        return {
          // Ensure lang is a watched property
          lang: { type: String },
          ...targetClass.properties
        };
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
    };
  };
}

/**
 * Lit translate directive
 *
 * Translates a term using the element's current language.
 */
class TranslateDirective extends Directive {
  host: HTMLElement | undefined;

  constructor(part: Part) {
    super(part);
    this.host = part.options?.host as HTMLElement;
  }

  render<K extends keyof Translation>(key: K, ...args: FunctionParams<Translation[K]>) {
    const lang = connectedElements.get(this.host as LitElement) || '';
    return translate(lang, key, ...args);
  }
}

const litDirective = directive(TranslateDirective);

export function translateDirective<T extends keyof Translation>(key: T, ...args: FunctionParams<Translation[T]>) {
  return litDirective(key, ...args);
}

/**
 * Lit format date directive
 *
 * Formats a date using the element's current language.
 */
class FormatDateDirective extends Directive {
  host: HTMLElement | undefined;

  constructor(part: Part) {
    super(part);
    this.host = part.options?.host as HTMLElement;
  }

  render(date: Date | string, options?: Intl.DateTimeFormatOptions) {
    const lang = connectedElements.get(this.host as LitElement) || '';
    return formatDate(lang, date, options);
  }
}

export const formatDateDirective = directive(FormatDateDirective);

/**
 * Lit format number directive
 *
 * Formats a number using the element's current language.
 */
class FormatNumberDirective extends Directive {
  host: HTMLElement | undefined;

  constructor(part: Part) {
    super(part);
    this.host = part.options?.host as HTMLElement;
  }

  render(number: number | string, options?: Intl.NumberFormatOptions) {
    const lang = connectedElements.get(this.host as LitElement) || '';
    return formatNumber(lang, number, options);
  }
}

export const formatNumberDirective = directive(FormatNumberDirective);
