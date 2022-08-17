# Shoelace: Localize

This zero-dependency micro library does not aim to replicate a full-blown localization tool. For that, you should use something like [i18next](https://www.i18next.com/). What this library _does_ do is provide a lightweight, [Reactive Controller](https://lit.dev/docs/composition/controllers/) for sharing and applying translations across one or more custom elements in a component library.

Reactive Controllers are supported by Lit 2 out of the box, but they're designed to be generic so other libraries can elect to support them either natively or through an adapter. If you're favorite custom element authoring library doesn't support Reactive Controllers yet, consider asking the maintainers to add support for them!

## Overview

Here's an example of how this library can be used to create a localized custom element with Lit.

```ts
import { LocalizeController, registerTranslation } from '@shoelace-style/localize';

// Note: translations can also be lazy loaded (see "Registering Translations" below)
import en from '../translations/en';
import es from '../translations/es';

registerTranslation(en, es);

@customElement('my-element')
export class MyElement extends LitElement {
  private localize = new LocalizeController(this);

  @property() lang: string;

  render() {
    return html`
      <h1>${this.localize.term('hello_world')}</h1>
    `;
  }
}
```

To set the page locale, apply the desired `lang` attribute to the `<html>` element.

```html
<html lang="es">
  ...
</html>
```

Changes to `<html lang>` will trigger an update to all localized components automatically.

## Why this instead of an i18n library?

It's not uncommon for a custom element to require localization, but implementing it at the component level is challenging. For example, how should we provide a translation for this close button that exists in a custom element's shadow root?

```html
#shadow-root
  <button type="button" aria-label="Close">
    <svg>...</svg>
  </button>
```

Typically, custom element authors dance around the problem by exposing attributes or properties for such purposes.

```html
<my-element close-label="${t('close')}">
  ...
</my-element>
```

But this approach offloads the problem to the user so they have to provide every term, every time. It also doesn't scale with more complex components that have more than a handful of terms to be translated.

This is the use case this library is solving for. It is not intended to solve localization at the framework level. There are much better tools for that.

## How it works

To achieve this goal, we lean on HTML’s [`lang`](~https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang~) attribute to determine what language should be used. The default locale is specified by `<html lang="...">`, but any localized element can be scoped to a locale by setting its `lang` attribute. This means you can have more than one language per page, if desired.

```html
<html lang="en">
<body>
  <my-element>This element will be English</my-element>
  <my-element lang="es">This element will be Spanish</my-element>
  <my-element lang="fr">This element will be French</my-element>
</body>
</html>
```

This library provides a set of tools to localize dates, currencies, numbers, and terms in your custom element library with a minimal footprint. Reactivity is achieved with a [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) that listens for `lang` changes on `<html>`.

By design, `lang` attributes on ancestor elements are ignored. This is for performance reasons, as there isn't an efficient way to detect the "current language" of an arbitrary element. I consider this a gap in the platform and [I've proposed properties](https://github.com/whatwg/html/issues/7039) to make this lookup less expensive.

Fortunately, the majority of use cases appear to favor a single language per page. However, multiple languages per page are also supported, but you'll need to explicitly set the `lang` attribute on all components whose language differs from the one set in `<html lang>`.

## Usage

First, install the library.

```bash
npm install @shoelace-style/localize
```

Next, follow these steps to localize your components.

1. Create a translation
2. Register the translation
3. Localize your components

### Creating a Translation

All translations must extend the `Translation` type and implement the required meta properties (denoted by a `$` prefix). Additional terms can be implemented as show below.

```ts
// en.ts
import type { Translation } from '@shoelace-style/localize';

const translation: Translation = {
  $code: 'en',
  $name: 'English',
  $dir: 'ltr',

  // Simple terms
  upload: 'Upload',

  // Terms with placeholders
  greetUser: (name: string) => `Hello, ${name}!`,

  // Plurals
  numFilesSelected: (count: number) => {
    if (count === 0) return 'No files selected';
    if (count === 1) return '1 file selected';
    return `${count} files selected`;
  }
};

export default translation;
```

### Registering Translations

Once you've created a translation, you need to register it before use. To register a translation, call the `registerTranslation()` method. This example imports and register two translations up front.

```ts
import { registerTranslation } from '@shoelace-style/localize';
import en from './en';
import es from './es';

registerTranslation(en, es);
```

The first translation that's registered will be used as the _fallback_. That is, if a term is missing from the target language, the fallback language will be used instead.

Translations registered with country such as `en-GB` are supported. However, your fallback translation must be registered with only a language code (e.g. `en`) to ensure users of unsupported regions will still receive a comprehensible translation.

For example, if you're fallback language is `en-US`, you should register it as `en` so users with unsupported `en-*` country codes will receive it as a fallback. Then you can register country codes such as `en-GB` and `en-AU` to improve the experience for additional regions.

It's important to note that translations _do not_ have to be registered up front. You can register them on demand as the language changes in your app. Upon registration, localized components will update automatically.

Here's a sample function that dynamically loads a translation.

```ts
import { registerTranslation } from '@shoelace-style/localize';

async function changeLanguage(lang) {
  const availableTranslations = ['en', 'es', 'fr', 'de'];

  if (availableTranslations.includes(lang)) {
    const translation = await import(`/path/to/translations/${lang}.js`);
    registerTranslation(translation);
  }
}
```

### Localizing Components

You can use the `LocalizeController` with any library that supports [Lit's Reactive Controller pattern](https://lit.dev/docs/composition/controllers/). In Lit, a localized custom element will look something like this.

```ts
import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { LocalizeController } from '@shoelace-style/localize/dist/lit.js';

@customElement('my-element')
export class MyElement extends LitElement {
  private localize = new LocalizeController(this);

  // Make sure to make `dir` and `lang` reactive so the component will respond to changes to its own attributes
  @property() dir: string;
  @property() lang: string;

  render() {
    return html`
      <!-- Terms -->
      ${this.localize.term('hello')}

      <!-- Dates -->
      ${this.localize.date('2021-09-15 14:00:00 ET'), { month: 'long', day: 'numeric', year: 'numeric' }}

      <!-- Numbers/currency -->
      ${this.localize.number(1000, { style: 'currency', currency: 'USD'})}

      <!-- Determining language -->
      ${this.localize.lang()}

      <!-- Determining directionality, e.g. 'ltr' or 'rtl' -->
      ${this.localize.dir()}
    `;
  }
}
```

## Typed Translations and Arguments

Because translations are defined by the user, there's no way for TypeScript to automatically know about the terms you've defined. This means you won't get strongly typed arguments when calling `this.localize.term()`. However, you can solve this by extending `Translation` and `LocalizeController`.

In a separate file, e.g. `my-localize.ts`, add the following code.

```ts
import { LocalizeController as DefaultLocalizeController } from '@shoelace-style/localize';

// Extend the default controller with your custom translation
export class LocalizeController extends DefaultLocalizeController<MyTranslation> {}

// Export `registerTranslation` so you can import everything from this file
export { registerTranslation } from '@shoelace-style/localize';

// Define your translation terms here
export interface MyTranslation extends Translation {
  myTerm: string;
  myOtherTerm: string;
  myTermWithArgs: (count: string) => string;
}
```

Now you can import `MyLocalizeController` and get strongly typed translations when you use `this.localize.term()`!

## Advantages

- Zero dependencies
- Extremely lightweight
- Supports simple terms, plurals, and complex translations
	- Fun fact: some languages have [six plural forms](https://lingohub.com/blog/2019/02/pluralization) and this utility supports that
- Supports dates, numbers, and currencies using built-in [`Intl` APIs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- Good DX for custom element authors and consumers
  - Intuitive API for custom element authors
  - Consumers only need to load the translations they want and set the `lang` attribute
- Translations can be loaded up front or on demand

## Disadvantages

- Complex translations require some code, such as conditionals
	- This is arguably no more difficult than, for example, adding them to a [YAML](https://edgeguides.rubyonrails.org/i18n.html#pluralization) or [XLIFF](https://en.wikipedia.org/wiki/XLIFF) file
