# A demo of `sveltedown`'s `AppendOnly` component

This component works identically to the standard `Markdown` export, save that it is optimized for append-only operations like streaming text from a LLM. Under normal circumstances, if you render `Markdown` with some content:

```svelte
<script lang="ts">
	let content = $state('');
</script>

<button onclick={() => (content += '\n# This is another heading')}>Add another heading</button>
<Markdown {content} />
```

...every time `content` is modified, the _entire_ string has to be re-processed. This means:

- Parsing from string to `mdast`, the Markdown AST
- Running `remark` plugins
- Converting from `mdast` to `hast` (the HTML AST)
- Running `rehype` plugins
- Converting from `hast` to the Svelte runtime

This is extremely wasteful when you _know_ content is only ever going to be added to the Markdown document, never modified or removed. Thankfully, we can optimize for this use case. `AppendOnly` will:

- On initial render, process the entire `content` string and save the location of the start of the last block of root content. (Think heading, paragraph, blockquote, etc.)
- When `content` changes, slice `content` from the saved location to the end. Process only this content
- Replace the last root block with the first new block, and append any additional root blocks. If we append any additional root blocks, the start of the last one becomes our new "saved location"

> `remark` plugins are run prior to saving the last block start location. `rehype` plugins are run after.

What this means in practice is that the only text we're ever actually processing is the very last block-level content. The efficiency gain of rendering this way grows as the size of the markdown document grows.

## Rules

Because of this, there are rules. Well, only one, really. You **must not** perform any content edits other than appending. The behavior of doing so is undefined (and by undefined, I mean "will definitely break in very strange and unexpected ways). An extension of this rule is that you cannot use `remark` or `rehype` plugins that retroactively modify content -- think things like `remark-toc`, which go back to prior sections to insert nodes based on later nodes.

## Try it out

Add content after this to see it in action. Add content before this block to see how things will fall apart if you don't follow the rules.
