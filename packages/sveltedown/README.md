# `sveltedown`

A Svelte component for rendering markdown. Inspired by [`react-markdown`][github-react-markdown].

Check out the [demo](https://sveltedown.vercel.app/).

## Feature highlights

- **[Super easy][section-getting-started]**: You can render markdown in your application in seconds!
- **[Customizable][section-snippets]**: Pass your own snippets in to control what's rendered
- **[Huge plugin ecosystem][section-plugins]**: Built on `remark` and `rehype`
- **[Compliant][section-syntax]**: 100% to CommonMark, 100% to GFM with a plugin

## Contents

- [Getting started](#getting-started)
- [When should I use this?](#when-should-i-use-this)
- [API](#api)
  - [Components](#components)
    - [`Markdown`](#markdown)
    - [`MarkdownAsync`](#markdownasync)
  - [Functions](#functions)
    - [`defaultUrlTransform`](#defaulturltransform)
  - [Types](#types)
    - [`Options`](#options)
    - [`URLTransform`](#urltransform)
    - [`Renderer`](#renderer)
    - [`RendererArg`](#rendererarg)
    - [`Renderers`](#renderers)
- [Examples](#examples)
  - [Use custom renderers](#use-custom-renderers)
- [Plugins](#plugins)
- [Syntax](#syntax)
- [Architecture](#architecture)

## Getting started

Install the package:

```sh
pnpm i sveltedown # or npm, yarn
```

Import and use the component:

```svelte
<script lang="ts">
	import { Markdown } from 'sveltedown';
</script>

<Markdown content="# Hello, world!" />
```

## When should I use this?

This package focusses on making it easy for beginners to safely use markdown in
Svelte. It provides sane defaults and options for rendering markdown in a dynamic context.
If you reach the end of the customization you can achieve with this component and want to strike
out on your own, have no fear! The implementation is actually quite simple, and you can take advantage
of [`svehast`](https://npmjs.com/package/svehast) to build
your own markdown processing pipeline.

## API

This package exports two components and one function:

- [`Markdown`][api-markdown]
- [`MarkdownAsync`][api-markdown-async] (experimental, exported from `sveltedown/experimental-async`)
- [`defaultUrlTransform`][api-default-url-transform]

It also exports the following additional TypeScript types:

- [`Options`][api-options]
- [`URLTransform`][api-url-transform]
- All of the types from [`svehast`](https://npmjs.com/package/svehast#types)

### Components

#### `Markdown`

The core export of this package. You can use it like this:

```svelte
<Markdown content="# Hello, world!" />
```

`content` can be any markdown-formatted string.

It also supports custom renderers. Normally, the easiest way to declare these is as snippets that are direct children of `Markdown`:

```svelte
<Markdown content="[a link to this package](https://npmjs.com/package/sveltedown)">
  {#snippet a({ tagName, props, children, node })}
    <a {...props} href="/haha-all-links-are-now-the-same">
      {@render children()}
    </a>
  {/snippet}
</Hast>
```

Remember to render the children!

You can also pass snippets as arguments to the `Markdown` component (see [`RendererArg`](#rendererarg) below for argument details):

```svelte
{#snippet a({ tagName, props, children, node })}
  <a {...props} href="/haha-all-links-are-now-the-same">
    {@render children()}
  </a>
{/snippet}

<Hast node={/* Root */} {a}/>
```

You can also map nodes to other nodes. For example, if you wanted to only ever render down to a `h3`, you could map headings 4-6 back to `h3`:

```svelte
<Hast node={/* Root */} h4="h3" h5="h3" h6="h3">
```

That's pretty much it!

#### `MarkdownAsync`

If you have an asynchronous plugin in your pipeline, regular `Markdown` will fail. `MarkdownAsync` will run your pipeline asynchronously, and is compatible with Svelte's `experimental.async` compiler option.
The API is the same as `Markdown`, save that it will suspend while rendering your content. You'll want to use a `svelte:boundary` with `pending` content:

```svelte
<svelte:boundary>
  <Markdown content="# Neato burrito">

  {#snippet pending()}
    <Skeleton />
  {/snippet}
<svelte:boundary>
```

Most of the time, you should avoid asynchronous plugins. Many of them actually have a way to hoist the asynchronous work out of your Markdown pipeline. For example, when using Shiki to highlight code,
you can instantiate a global highlighter instance, then share that instance between all of your plugin invocations, which can run synchronously.

### Functions

#### `defaultUrlTransform`

By default, `Markdown` does what GitHub does with links. It allows the protocols `http`, `https`, `irc`, `ircs`, `mailto`, and `xmpp`, and URLs relative to the current protocol (such as `/something`). This function is exported
so that if you implement your own URL transform logic, you can reapply the default if necessary.

### Types

This package exports a number of types.

#### `Options`

The options you can pass to `Markdown` and `MarkdownAsync`.

- `content`: The markdown content. `string | undefined`
- `remarkPlugins`: Remark plugins to run prior to transforming the `mdast` to `hast`
- `rehypePlugins`: Rehype plugins to run prior to rendering the `hast` to the DOM
- `remarkParseOptions`: Options to pass to `remark-parse` (the plugin that parses your content to `mdast`)
- `remarkRehypeOptions`: Options to pass to `remark-rehype` (the plugin that translates `mdast` to `hast`)
- `skipHtml`: Ignore HTML in markdown completely. Defaults to `false`. `boolean | undefined`
- `urlTransform`: Transform URLs in HTML attributes (href, ping, src, etc.). Defaults to `defaultUrlTransform`.

**Notes**:

- Both `remarkPlugins` and `rehypePlugins` are of type `PluggableList`. This means there are a few ways you can register them:
  - If the plugin receives no options, it can be passed in as a root-level array item: `[myOptionlessPlugin]`
  - If the plugin takes options, you should pass a tuple of the plugin and the options: `[[myPlugin, myPluginOptions]]`
  - If you have multiple plugins, it would look like this: `[myOptionlessPlugin, [myPlugin, myPluginOptions]]`
- If all of the `remark` and `rehype` stuff is confusing, that's fine -- there's a section later explaining the markdown processing pipeline

#### `URLTransform`

Is called every time a HTML property containing a URL is found. Has the opportunity to transform the URL or remove it. Receives the URL, the property the URL came from (`src`, `href`, etc.), and the node it came from.

#### `Renderer`

The type of a custom renderer. This is either a HTML/SVG tag name (for remapping) or a `Snippet` accepting a `RenderArg` as its only argument.

#### `RendererArg`

The argument a custom renderer accepts:

- `tagName` is the HTML/SVG tag name to render
- `props` are the props. Typically you should spread these onto the element you're rendering
- `children` is the snippet you need to render as a child. It will be `undefined` for void elements like `<img>`.
- `node` is the original and unmodified `hast` node

A note on `tagName`: This is the name associated with the _resolved_ renderer, not the one we started with. So if we started with a `hast` element with a `tagName` of `h6`, but `h6` had been mapped to `h3`, the tag name passed to your custom renderer would be `h3`. If you need the _original_ tag name, you can find it on the `node` prop, as that remains unchanged.

#### `Renderers`

A map of all HTML/SVG tag names that Svelte can render to their corresponding [`Renderer`](#renderer) definition.

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

`remark` uses [`micromark`][github-micromark] under the hood for its parsing.
See its documentation for more information on markdown, CommonMark, and
extensions.

## Architecture

When you pass a string to `Markdown`, it passes through a pipeline before it becomes the content you see on the screen:

- First, `remark-parse` parses your markdown string into a `mdast`, the ast representation of markdown
- Next, your remark plugins are run on this `mdast`
- Then, `remark-rehype` converts your `mdast` to `hast`, a html ast
- Then, your `rehype` plugins run on this `hast`
- Finally, the `hast` is converted to Svelte, which renders it

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
[github-react-markdown]: https://github.com/remarkjs/react-markdown
[github-rehype]: https://github.com/rehypejs/rehype
[github-rehype-plugins]: https://github.com/rehypejs/rehype/blob/main/doc/plugins.md#list-of-plugins
[github-remark]: https://github.com/remarkjs/remark
[github-remark-gfm]: https://github.com/remarkjs/remark-gfm
[github-remark-plugins]: https://github.com/remarkjs/remark/blob/main/doc/plugins.md#list-of-plugins
[github-remark-rehype-options]: https://github.com/remarkjs/remark-rehype#options
[github-topic-rehype-plugin]: https://github.com/topics/rehype-plugin
[github-topic-remark-plugin]: https://github.com/topics/remark-plugin
[github-unified]: https://github.com/unifiedjs/unified
[section-getting-started]: #getting-started
[section-plugins]: #plugins
[section-security]: #security
[section-snippets]: #use-custom-renderers
[section-syntax]: #syntax
