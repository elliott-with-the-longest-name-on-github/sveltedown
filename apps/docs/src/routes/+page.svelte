<script lang="ts">
	import { Markdown } from 'sveltedown';
	import content from '../../../../packages/sveltedown/README.md?raw';
	import rehypeShikiFromHighlighter from '@shikijs/rehype/core';
	import remark_gfm from 'remark-gfm';

	let { data } = $props();
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
	remarkPlugins={[remark_gfm]}
/>
