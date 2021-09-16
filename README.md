# Shoelace: Localize

This micro library does not aim to replicate a full-blown localization tool. For that, you should use something like [i18next](https://www.i18next.com/). What this library _does_ do is provide a lightweight, framework-agnostic mechanism for sharing and applying translations across one or more custom elements in a component library.

Included are methods for translating terms, dates, currencies, and numbers, as well as corresponding directives for Lit and FAST.

## Overview

Here's an example of how this library can be used to create a custom element with Lit.


```ts
import { litLocalize as localize, litTranslate as t, registerTranslation } from '@shoelace-style/localize';
import en from '../translations/en.ts';
import es from '../translations/es.ts';

registerTranslation(en, es); // Can also be done outside of the component or on demand

@customElement('my-element')
@localize()
export class MyElement extends LitElement {
  render() {
    return html`
      <h1>${t('hello_user', 'world')}</h1>  <!-- outputs "Hello, world!" -->
    `;
  }
}
```

Here's how your consumers will change languages.

```html
<html lang="es">
  ...
</html>
```

Simply changing the `lang` attribute on any element in the DOM will trigger an update to all localized components.

## Why this instead of an i18n library?

It's not uncommon for a custom element to require localization, but implementing it at the component level is challenging. For example, how should we provide a translation for this close button that exists in a custom element's shadow root?

```html
<button type="button" aria-label="Close">
  <svg><!-- close icon --></svg>
</button>
```

Typically, custom element authors dance around the problem by exposing attributes or properties for such purposes.

```html
<my-element close-label="${t('close')}">
  ...
</my-element>
```

But this approach offloads the problem to the user so they have to provide every term, every time. It also doesn't scale with more complex components that have more than a handful of terms to be translated.

This is the use case this library is solving for. It is by no means intended to solve localization at the framework level. There are much better tools for that.

## How it works

To achieve this goal, we lean on HTML’s [`lang`](~https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang~) attribute to determine what languages should be used in various parts of the page. The default language is specified by `<html lang>`, but any element in the DOM can be scoped to a language by setting its `lang` attribute. This means you can have more than one language per page, if desired.

```html
<html lang="en">
<body>

  <my-element>This element will be English</my-element>

  <div lang="es">
    <my-element>This element will be Spanish</my-element>
    <my-element>This element is also Spanish</my-element>
  </div>

</body>
</html>
```

This library provides a set of tools to localize dates, currencies, numbers, and terms in your custom element library with a minimal footprint. Reactivity is achieved with a [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) that listens for `lang` changes in the document. This means that changing a `lang` attribute in the DOM will automatically update all localized elements.

_Exception: The mutation observer will not track `lang` changes within shadow roots. For this, there is a `forceUpdate()` method you can call to tell localized elements to update._

When a localized element is connected to the DOM, the library looks for the closest `lang` attribute, moving up through its ancestors and breaking through shadow roots as necessary. The element and its language are then cached internally. When a `lang` attribute changes. the library loops through all connected components, re-detects their language, and tells them to update. When an element is disconnected from the DOM, it is discarded from the map.

By caching languages in a map, we're able to limit expensive DOM traversal so it only occurs:

1. When the element is connected
2. When a `lang` attribute changes

At this time, there is no easier way to detect the "current language" of an arbitrary element. I consider this a gap in the platform and [I've proposed properties](https://github.com/whatwg/html/issues/7039) to make this lookup more efficient.

## Usage

First, install the library.

```bash
npm install @shoelace-style/localize
```

Next, follow these steps to localize your components.

1. Create one or more translations
2. Register the translations
3. Localize your components

### Creating Translations

Every translation must extend the `Translation` type. All translations must implement the required meta properties (denoted by a `$` prefix) and additional terms can be implemented as show below.

```ts
// en.ts
import type { Translation } from '@shoelace-style/localize';

const translation: Translation = {
  $code: 'en',
  $name: 'English',
  $dir: 'ltr',

  // Terms
  upload: 'Upload',

  // Placeholders
  hello_user: (name: string) => `Hello, ${name}!`,

  // Plurals
  num_files_selected: (count: number) => {
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
import en from './en.ts';
import es from './es.ts';

registerTranslation(en, es);
```

The first translation to be registered will be used as the "fallback". That is, if a term is missing from the target language, the fallback language will be used instead.

Translations registered with subcodes such as `en-GB` are supported. However, your fallback translation must be registered with a base code (e.g. `en`) to ensure users of unsupported regions will still receive a comprehensible translation.

For example, if you're fallback language is `en-US`, you should register it as `en` so users with unsupported `en-*` subcodes will receive it as a fallback. Then you can register subcodes such as `en-GB` and `en-AU` to improve the experience for those additional regions.

It's important to note that translations _do not_ have to be registered up front. You can register them on demand as the language changes in your app. Upon import, all localized components will update automatically.

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

### Lit

If you're using [Lit](https://lit.dev/) to develop components, import the `@localize` directive and the corresponding translation function(s).

```ts
import { 
  litLocalize as localize, 
  litTranslate as t, 
  litFormatDate as d, 
  litFormatNumber as n 
} from '@shoelace-style/localize';

@customElement('my-element')
@localize()
export class MyElement extends LitElement {
  render() {
    return html`
      <!-- Term -->
      ${t('hello')}

      <!-- Date -->
      ${d('2021-09-15 14:00:00 ET'), { month: 'long', day: 'numeric', year: 'numeric' }}

      <!-- Currency -->
      ${n(1000, { style: 'currency', currency: 'USD'})}
    `;
  }
}
```

### FAST

Directives are coming soon for [FAST Element](https://www.fast.design/).

### No Library (Advanced)

To use this without a custom element library, you'll need to follow this pattern.

```ts
import { connectedElements, detectLanguage, forceUpdate } from '@shoelace-style/localize';

class MyElement extends HTMLElement {
  connectedCallback() {
    // Register the component when it's connected and cache the current language
    const lang = detectLanguage(this);
    connectedElements.set(this, lang);
  }

  disconnectedCallback() {
    // Remove the element from cache when it disconnects from the DOM
    connectedElements.delete(this);
  }

  static get observedAttributes() { 
    return ['lang'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // When lang changes, update the cache and trigger an update
    if (name === 'lang') {
      forceUpdate();
    }
  }
}
```

Three core translation functions are exposed for translating terms, dates, numbers, and currencies. The `translate()` function relies on the translations you provide, while the `formatDate()` and `formatNumber()` functions use the [`Intl` API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) to localize dates, numbers, and currencies.

These are the functions that get called internally by the Lit directives. Note that `lang` is a required argument. If you use this API, make sure to use the cached language values available in the `connectedElements` map to avoid expensive DOM traversal.

```ts
function translate(lang: string, key: string, args: any) {
  // returns a localized term
}

function formatDate(lang: string, date: Date | string, options: Intl.DateTimeFormatOptions) {
  // returns a localized date
}

function formatNumber(lang: string, number: number | string, options?: Intl.NumberFormatOptions) {
  // returns a localized number or currency
}
```

### Typed Arguments

As the `Translation` interface is extended by the user, and because terms can have varying arguments, there's no way for TypeScript to automatically know about the terms you've added. This means we won't get strongly typed arguments when calling `translate()` or a translate directive.

However, you can optionally extend the `Translation` interface with your own and wrap the translation functions you want to enable strong typings for.

```ts
// translation.ts
import type { FunctionParams, Translation as BaseTranslation } from '@shoelace-style/localize';
import { translate as internalTranslate, litTranslate } from '@shoelace-style/localize';

export interface Translation extends BaseTranslation {
  upload: string;
  hello_user: (name: string) => string;
  num_files_selected: (count: number) => string;
}

// Wrap the translate function
export function translate<T extends keyof Translation>(lang: string, key: T, ...args: FunctionParams<Translation[T]>) {
  return internalTranslate(lang, key, ...args) as string;
}

// Wrap the Lit translate directive
export function translateDirective<T extends keyof Translation>(key: T, ...args: FunctionParams<Translation[T]>) {
  return litTranslate(key, ...args) as string;
}
```

Now, instead of importing from `@shoelace-style/localize`, you can import these functions from your own `translation.ts` module and you'll get strongly typed translation keys and arguments!

### Appending Terms

Occassionaly, third-party components may want to make use of your localization library. Should you choose to expose this as an option, here's how terms can be added to translations that are already registered.

```ts
import en from './en';

en.logout = 'Logout';
en.goodbye_user = (name: string) => `Goodbye, ${name}`;
```

## Advantages

- Extremely lightweight
	- ~2.7 KB compared to ~33 KB for i18next (without translations; minified, not gzipped)
- Uses existing platform features
- Supports simple terms, plurals, and complex translations
	- Fun fact: some languages have [six plural forms](https://lingohub.com/blog/2019/02/pluralization) and this will support that
- Supports dates, numbers, and currencies
- Good DX for custom element authors and consumers
	- Authors have directives to localize components using popular libraries
	- Consumers only need to load the translations they want to use and set the `lang` attribute
- Translations can be loaded up front or on demand
- Translations can be created by consumers without having to wait for them to get accepted upstream
- Strong typings when using translations (requires a custom Translation interface and a wrapper function)

## Disadvantages

- Complex translations require some code, such as conditionals
	- This is arguably no more difficult than, for example, adding them to a [YAML](https://edgeguides.rubyonrails.org/i18n.html#pluralization) or [XLIFF](https://en.wikipedia.org/wiki/XLIFF) file

Note that we aren’t aiming to solve localization at the framework level. Many teams already have their own translation libraries, so we need to provide something that will work in tandem with those with a minimal learning curve.
