# `sveltedown`

A Svelte component for rendering markdown. Strongly inspired by [`react-markdown`](https://github.com/remarkjs/react-markdown).

## Feature highlights

- [x] **[safe][section-security] by default**
      (no `dangerouslySetInnerHTML` or XSS attacks)
- [x] **[snippets][section-snippets]**
      (pass your own component to use instead of `<h2>` for `## hi`)
- [x] **[plugins][section-plugins]**
      (many plugins you can pick and choose from)
- [x] **[compliant][section-syntax]**
      (100% to CommonMark, 100% to GFM with a plugin)

## Contents

- [What is this?](#what-is-this)
- [When should I use this?](#when-should-i-use-this)
- [Use](#use)
- [API](#api)
  - [`Markdown`](#markdown)
  - [`MarkdownAsync`](#markdownasync)
  - [`defaultUrlTransform(url)`](#defaulturltransformurl)
  - [`AllowElement`](#allowelement)
  - [`renderers`](#renderers)
  - [`Options`](#options)
  - [`UrlTransform`](#urltransform)
- [Examples](#examples)
  - [Use a plugin](#use-a-plugin)
  - [Use a plugin with options](#use-a-plugin-with-options)
  - [Use custom renderers (syntax highlight)](#use-custom-renderers-syntax-highlight)
  - [Use remark and rehype plugins (math)](#use-remark-and-rehype-plugins-math)
- [Plugins](#plugins)
- [Syntax](#syntax)

## What is this?

This package is a [Svelte](https://svelte.dev) component that can be given a string of markdown
that it’ll safely render to Svelte elements.
You can pass plugins to change how markdown is transformed and pass components
that will be used instead of normal HTML elements.

- to learn markdown, see this [cheatsheet and tutorial][commonmark-help]
- to try out `sveltedown`, see [our demo](TODO)

## When should I use this?

This package focusses on making it easy for beginners to safely use markdown in
Svelte. It provides sane defaults and options for rendering markdown in a dynamic context.
If you reach the end of the customization you can achieve with this component and want to strike
out on your own, have no fear! The implementation is actually quite simple, and you can take advantage
of [`hast-to-svelte`](https://github.com/elliott-with-the-longest-name-on-github/sveltedown) to build
your own markdown processing pipeline.

## Install

```sh
pnpm i sveltedown
```

## Use

A basic hello world:

```svelte
<script lang="ts">
	import { Markdown } from 'sveltedown';

	const markdown = '# Neato _burrito_';
</script>

<Markdown content={markdown} />
```

<details>
<summary>Show equivalent HTML</summary>

```js
<h1>
	Neato <em>burrito</em>!
</h1>
```

</details>
```

Here is an example that shows how to use a plugin
([`remark-gfm`][github-remark-gfm],
which adds support for footnotes, strikethrough, tables, tasklists and
URLs directly):

```svelte
<script lang="ts">
	import { Markdown } from 'sveltedown';
	import remarkGfm from 'remark-gfm';

	const markdown = 'Just a link: www.nasa.gov.';
</script>

<Markdown content={markdown} remarkPlugins={[remarkGfm]} />
```

<details>
<summary>Show equivalent HTML</summary>

```js
<p>
	Just a link: <a href="http://www.nasa.gov">www.nasa.gov</a>.
</p>
```

</details>
```

## API

This package exports the identifiers
[`Markdown`][api-markdown]
[`MarkdownAsync`][api-markdown-async],
and
[`defaultUrlTransform`][api-default-url-transform].
The default export is [`Markdown`][api-markdown].

It also exports the additional TypeScript types
[`AllowElement`][api-allow-element],
[`Renderers`][api-renderers],
[`Options`][api-options],
and
[`UrlTransform`][api-url-transform].

### `Markdown`

Component to render markdown.

This is a synchronous component.
When using async plugins,
see [`MarkdownAsync`][api-markdown-async].

###### Parameters

- `options` ([`Options`][api-options])
  — props

### `MarkdownAsync`

Component to render markdown with support for async plugins
through async/await.

This uses `experimental.async` from Svelte and is intended to be used with the new `svelte:boundary`.

Most of the time, you probably don't want to run async plugins. For example, shiki allows you to
create your highligher outside of your Markdown pipeline and then pass the resolved highlighter
into your plugin to make the plugin synchronous; this allows you to do the heavy async work somewhere
outside of the plugin pipeline and avoid redoing that work every time your content changes.

###### Parameters

- `options` ([`Options`][api-options])
  — props

### `defaultUrlTransform(url)`

Make a URL safe.

This follows how GitHub works.
It allows the protocols `http`, `https`, `irc`, `ircs`, `mailto`, and `xmpp`,
and URLs relative to the current protocol (such as `/something`).

###### Parameters

- `url` (`string`)
  — URL

###### Returns

Safe URL (`string`).

### `AllowElement`

Filter elements.

###### Parameters

- `node` ([`Element` from `hast`][github-hast-element])
  — element to check
- `index` (`number | undefined`)
  — index of `element` in `parent`
- `parent` ([`Node` from `hast`][github-hast-nodes])
  — parent of `element`

###### Returns

Whether to allow `element` (`boolean`, optional).

### `Renderers`

Map tag names to custom renderers (snippets).

###### Type

```ts
type RemoveIndex<T> = {
	[K in keyof T as string extends K
		? never
		: number extends K
			? never
			: symbol extends K
				? never
				: K]: T[K];
};

export type SpecificSvelteHTMLElements = RemoveIndex<SvelteHTMLElements>;

export type RendererArg<T extends keyof SpecificSvelteHTMLElements> = {
	tagName: T;
	props: SpecificSvelteHTMLElements[T];
	children?: Snippet;
	node?: HastElement;
};

export type Renderer<T extends keyof SpecificSvelteHTMLElements> = Snippet<[RendererArg<T>]>;

/** Map tag names to renderers. */
export type Renderers = {
	[Key in keyof SpecificSvelteHTMLElements]?: Renderer<Key> | keyof SvelteHTMLElements;
};
```

### `Options`

Configuration.

###### Fields

- `allowElement` ([`AllowElement`][api-allow-element], optional)
  — filter elements;
  `allowedElements` / `disallowedElements` is used first
- `allowedElements` (`Array<string>`, default: all tag names)
  — tag names to allow;
  cannot combine w/ `disallowedElements`
- `content` (`string`, optional)
  — markdown content to render
- `disallowedElements` (`Array<string>`, default: `[]`)
  — tag names to disallow;
  cannot combine w/ `allowedElements`
- `rehypePlugins` (`Array<Plugin>`, optional)
  — list of [rehype plugins][github-rehype-plugins] to use
- `remarkPlugins` (`Array<Plugin>`, optional)
  — list of [remark plugins][github-remark-plugins] to use
- `remarkRehypeOptions`
  ([`Options` from `remark-rehype`][github-remark-rehype-options],
  optional)
  — options to pass through to `remark-rehype`
- `skipHtml` (`boolean`, default: `false`)
  — ignore HTML in markdown completely
- `unwrapDisallowed` (`boolean`, default: `false`)
  — extract (unwrap) what’s in disallowed elements;
  normally when you say `strong` is not allowed, it and it’s children are dropped,
  with `unwrapDisallowed` the element itself is replaced by its children
- `urlTransform` ([`UrlTransform`][api-url-transform], default:
  [`defaultUrlTransform`][api-default-url-transform])
  — change URLs

This also has a field for every element tag Markdown is capable of rendering (`a`, `div`, `img`, etc). You can set these to other tags (eg. `h4: 'h3'` to render `h4` elements as `h3` elements), or you can set them to custom snippet renderers to have complete control over what content is rendered.

### `UrlTransform`

Transform URLs (TypeScript type).

###### Parameters

- `url` (`string`)
  — URL
- `key` (`string`, example: `'href'`)
  — property name
- `node` ([`Element` from `hast`][github-hast-element])
  — element to check

###### Returns

Transformed URL (`string`, optional).

## Examples

### Use custom renderers

```svelte
<script lang="ts">
	import { Markdown } from 'sveltedown';

	const markdown = '# Neato _burrito_';
</script>

<Markdown content={markdown}>
	<!-- 
   In Svelte, declaring a snippet as the child of a component passes that snippet 
   to the component as a prop! You don't have to do it this way; you can also use
   snippets declared elsewhere by passing them as props to the `Markdown` component.

   `em` captures all `em` elements that would be rendered. We can replace them with
   `strong` elements if we want to.

   Snippets also receive a `tagName` argument (`em` in this case) and a `node` argument,
   which is the original `hast` node. This can be useful if you need to do really fancy
   things with your custom renderers.
   -->
	{#snippet em({ props, children })}
		<strong>{@render children()}</strong>
	{/snippet}
</Markdown>
```

<details>
<summary>Show equivalent HTML</summary>

```js
<h1>
	Neato <strong>burrito</strong>!
</h1>
```

</details>
```

## Plugins

I use [unified][github-unified],
specifically [remark][github-remark] for markdown and
[rehype][github-rehype] for HTML,
which are tools to transform content with plugins.
Here are three good ways to find plugins:

- [`awesome-remark`][github-awesome-remark] and
  [`awesome-rehype`][github-awesome-rehype]
  — selection of the most awesome projects
- [List of remark plugins][github-remark-plugins] and
  [list of rehype plugins][github-rehype-plugins]
  — list of all plugins
- [`remark-plugin`][github-topic-remark-plugin] and
  [`rehype-plugin`][github-topic-rehype-plugin] topics
  — any tagged repo on GitHub

## Syntax

`sveltedown` follows CommonMark, which standardizes the differences between
markdown implementations, by default.
Some syntax extensions are supported through plugins.

I use [`micromark`][github-micromark] under the hood for our parsing.
See its documentation for more information on markdown, CommonMark, and
extensions.

[api-allow-element]: #allowelement
[api-default-url-transform]: #defaulturltransformurl
[api-markdown]: #markdown
[api-markdown-async]: #markdownasync
[api-options]: #options
[api-renderers]: #renderers
[api-url-transform]: #urltransform
[commonmark-help]: https://commonmark.org/help/
[github-awesome-rehype]: https://github.com/rehypejs/awesome-rehype
[github-awesome-remark]: https://github.com/remarkjs/awesome-remark
[github-hast-element]: https://github.com/syntax-tree/hast#element
[github-hast-nodes]: https://github.com/syntax-tree/hast#nodes
[github-micromark]: https://github.com/micromark/micromark
[github-rehype]: https://github.com/rehypejs/rehype
[github-rehype-plugins]: https://github.com/rehypejs/rehype/blob/main/doc/plugins.md#list-of-plugins
[github-remark]: https://github.com/remarkjs/remark
[github-remark-gfm]: https://github.com/remarkjs/remark-gfm
[github-remark-plugins]: https://github.com/remarkjs/remark/blob/main/doc/plugins.md#list-of-plugins
[github-remark-rehype-options]: https://github.com/remarkjs/remark-rehype#options
[github-topic-rehype-plugin]: https://github.com/topics/rehype-plugin
[github-topic-remark-plugin]: https://github.com/topics/remark-plugin
[github-unified]: https://github.com/unifiedjs/unified
[section-plugins]: #plugins
[section-security]: #security
[section-snippets]: #use-custom-renderers
[section-syntax]: #syntax
