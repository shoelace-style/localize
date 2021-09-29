import {
  connectedElements,
  detectLanguage,
  getSystemLanguage,
  translate as t,
  formatDate as d,
  formatNumber as n
} from './';
import type { CaptureType, ExecutionContext, FASTElement } from '@microsoft/fast-element';
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

      get lang() {
        return this.getAttribute('lang');
      }

      set lang(value: string) {
        if (value === null || value === undefined) {
          this.removeAttribute('lang');
        } else {
          this.setAttribute('lang', value);
        }

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

/**
 * FAST format number directive
 *
 * Formats a number using the element's current language.
 */
export function translate<TSource, K extends keyof Translation>(
  contextOrElement: ExecutionContext | FASTElement | HTMLElement,
  key: K,
  ...args: FunctionParams<Translation[K]>
): CaptureType<TSource> {
  const lang = connectedElements.get(contextOrElement as HTMLElement) || getSystemLanguage();
  return t(lang, key, ...args);
}

/**
 * FAST format date directive
 *
 * Formats a date using the element's current language.
 */
export function formatDate<TSource = any>(
  contextOrElement: ExecutionContext | FASTElement | HTMLElement,
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): CaptureType<TSource> {
  const lang = connectedElements.get(contextOrElement as HTMLElement) || getSystemLanguage();
  return d(lang, date, options);
}

/**
 * FAST format number directive
 *
 * Formats a number using the element's current language.
 */
export function formatNumber<TSource = any>(
  contextOrElement: ExecutionContext | FASTElement | HTMLElement,
  number: number | string,
  options?: Intl.DateTimeFormatOptions
): CaptureType<TSource> {
  const lang = connectedElements.get(contextOrElement as HTMLElement) || getSystemLanguage();
  return n(lang, number, options);
}
