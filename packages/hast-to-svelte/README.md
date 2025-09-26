# `svehast`

A component for rendering [`hast`](https://github.com/syntax-tree/hast) trees. If you're just trying to render markdown, you may be looking for [`sveltedown`](https://npmjs.com/package/sveltedown) instead.

## API

This package exports a single component: `Hast`. You can use it like this:

```svelte
<Hast node={/* Root */} />
```

`node` must be a `Root` node. If you have a different kind of `hast` node, you can turn it into a root node pretty easily: `{ type: 'root', children: [myNode] }`.

It also supports custom renderers. Normally, the easiest way to declare these is as snippets that are direct children of `Hast`:

```svelte
<Hast node={/* Root */}>
  {#snippet a({ tagName, props, children, node })}
    <a {...props} href="/haha-all-links-are-now-the-same">
      {@render children()}
    </a>
  {/snippet}
</Hast>
```

But you can also pass snippets as arguments to the `Hast` component (see [`RendererArg`](#rendererarg) below for argument details):

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

## Types

This package exports a few types that might help you build your own extensions.

### `Renderer`

The type of a custom renderer. This is either a HTML/SVG tag name (for remapping) or a `Snippet` accepting a `RenderArg` as its only argument.

### `RendererArg`

The argument a custom renderer accepts:

- `tagName` is the HTML/SVG tag name to render
- `props` are the props. Typically you should spread these onto the element you're rendering
- `children` is the snippet you need to render as a child. It will be `undefined` for void elements like `<img>`.
- `node` is the original and unmodified `hast` node

A note on `tagName`: This is the name associated with the _resolved_ renderer, not the one we started with. So if we started with a `hast` element with a `tagName` of `h6`, but `h6` had been mapped to `h3`, the tag name passed to your custom renderer would be `h3`. If you need the _original_ tag name, you can find it on the `node` prop, as that remains unchanged.

### `Renderers`

A map of all HTML/SVG tag names that Svelte can render to their corresponding [`Renderer`](#renderer) definition.

### `HTMLElements`

This is `SvelteHTMLElements` without the special `svelte:` elements and with no index signature. Essentially, it's a map of all HTML and SVG tags that Svelte can render to the props that those tag types can have. You probably don't need this.
