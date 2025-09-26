# A demo of `sveltedown`

`sveltedown` is a markdown component for Svelte.

👉 Changes are re-rendered as you type.

👈 Try writing some markdown on the left.

## Overview

- Implements [CommonMark](https://commonmark.org)
- Optionally implements [GitHub Flavored Markdown](https://github.github.com/gfm/)
- Renders Svelte elements
- Lets you define your own snippets (to `@render myHeading` instead of `'h1'`)
- Has a lot of plugins

## Contents

Here is an example of a plugin in action
([`remark-toc`](https://github.com/remarkjs/remark-toc)).
**This section is replaced by an actual table of contents**.

## Syntax highlighting

Here is an example of a plugin to highlight code:
[`@shikijs/rehype`](https://shiki.matsu.io/packages/rehype).

Create a shared highlighter in `load`:

```ts
// src/routes/+page.ts
import { createHighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';

export const load = async () => {
	const highlighter = await createHighlighterCore({
		themes: [import('@shikijs/themes/github-light'), import('@shikijs/themes/github-dark')],
		langs: [
			import('@shikijs/langs/svelte'),
			import('@shikijs/langs/javascript'),
			import('@shikijs/langs/typescript'),
			import('@shikijs/langs/markdown')
		],
		engine: createOnigurumaEngine(() => import('shiki/wasm'))
	});

	return {
		highlighter
	};
};
```

...and then use it in your component:

```svelte
<script lang="ts">
	// src/routes/+page.svelte
	import { Markdown } from 'sveltedown';
	import rehypeShikiFromHighlighter from '@shikijs/rehype/core';

	const { data } = $props();

	let content = $state('');
</script>

<Markdown
	{content}
	rehypePlugins={[
		[
			rehypeShikiFromHighlighter,
			data.highlighter,
			{ themes: { light: 'github-light', dark: 'github-dark' } }
		]
	]}
/>
```

Alternatively, if you're using `experimental.async`, you can use `MarkdownAsync` instead, which doesn't require setting up your highlighter in `load`.
If you're doing lots of highlighting, though, it's probably better to create your highlighter in some higher-level root scope and share it via context so that it
doesn't have to be recreated over and over again.

Pretty neat, eh?

## GitHub flavored markdown (GFM)

For GFM, you can _also_ use a plugin:
[`remark-gfm`](https://github.com/remarkjs/remark-gfm).
It adds support for GitHub-specific extensions to the language:
tables, strikethrough, tasklists, and literal URLs.

These features **do not work by default**.
👆 Use the toggle above to add the plugin.

|    Feature | Support              |
| ---------: | :------------------- |
| CommonMark | 100%                 |
|        GFM | 100% w/ `remark-gfm` |

~~strikethrough~~

- [ ] task list
- [x] checked item

https://example.com

## HTML in markdown

⚠️ HTML in markdown is quite unsafe, but if you want to support it, you can
use [`rehype-raw`](https://github.com/rehypejs/rehype-raw).
You should probably combine it with
[`rehype-sanitize`](https://github.com/rehypejs/rehype-sanitize).

<blockquote>
  👆 Use the toggle above to add the plugin.
</blockquote>

## Components

You can render custom content by mapping HTML elements to other HTML elements or by passing snippets for full custom control over rendering. HTML and SVG element tags are available as props directly on `Markdown`.

```svelte
<script lang="ts">
	import { Markdown } from 'sveltedown';
	import MyFancyDiv from '$lib/my-fancy-div.svelte';

	let content = $state('');
</script>

<!-- use h2s instead of h1s for # headings -->
<Markdown {content} h1="h2">
	<!-- use a custom component instead of divs -->
	{#snippet div({ props, children })}
		<MyFancyDiv {...props}>{@render children()}</MyFancyDiv>
	{/snippet}
</Markdown>
```

## More info?

Much more info is available in the
[readme on GitHub](https://github.com/elliott-with-the-longest-name-on-github/sveltedown)!
