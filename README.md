# `@shoelace-style/localize`

## What is it?

Localization in a web component library should not be opinionated or “frameworky”, nor should it be heavy. It should be something that works with frameworks, but also without them.

This utility does not aim to replicate a full-blown internationalization tool. For that, I’d recommend using [i18next](https://www.i18next.com/). What it _does_ aim to do is provide a lightweight, framework-agnostic mechanism for sharing and applying translations across custom elements.

Methods for translating terms, dates, and numbers are exposed, as well as corresponding directives for Lit Element.

## How it works

To achieve this goal, we lean on the platform by using HTML’s [`lang`](~https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang~) attribute to determine what languages will be used in various parts of the page. The default language is specified by `<html lang>` , but any element in the DOM can be scoped to a different language by setting its `lang` attribute. This means you can have more than one language per page, if desired.

```html
<html lang="es">
<body>

	<my-element>This element will be Spanish</my-element>

  <div lang="fr">
    <my-element>This element will be French</my-element>
  </div>

</body>
</html>
```

## Diving Deeper

At the heart of this utility is a `@localize` decorator that ensures the component’s `lang` property is reactive and keeps track of components as they are connected to and disconnected from the DOM.

To achieve reactivity, a [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) is used to listen for `lang` changes in the document. To change the language, simply update the `lang` attribute of any element and localized components will update automatically.

_Exception: The mutation observer will not track `lang` changes within shadow roots. For this, there is a `forceUpdate()` method you can to tell localized components to update._

## Advantages

- Extremely lightweight
	- ~2.7 KB compared to ~33 KB for i18next (minified, not gzipped)
- Uses existing platform features
- Supports terms, plurals, and other complex translations
	- Fun fact: some languages have [six plural forms](https://lingohub.com/blog/2019/02/pluralization) and this can support that
- Supports dates, numbers, and currencies
- Easy DX for us and consumers
	- We have directives that let us localize components
	- Consumers only need to load the translations they want to use and set the `lang` attribute
- Translations can be loaded on demand
- Translations can be created by consumers without having to wait for them to get published with the library
- 100% type safety when using translations (requires a custom Translation interface and a wrapper function)

## Disadvantages

- Complex translations require some code, such as conditionals
	- This is arguably no more difficult than, for example, adding them to a [YAML](https://edgeguides.rubyonrails.org/i18n.html#pluralization) or [XLIFF](https://en.wikipedia.org/wiki/XLIFF) file
	- Note that we aren’t aiming to solve localization at the framework level. Many teams already have their own translation libraries, so we need to provide something that will work in tandem with those with a minimal learning curve.