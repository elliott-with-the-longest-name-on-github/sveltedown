<script lang="ts">
	import type { Options } from './types.js';
	import { Markdown } from '@sejohnson/svelte-markdown';
	import { harden } from './harden.js';

	let {
		defaultOrigin = '',
		allowedLinkPrefixes = [],
		allowedImagePrefixes = [],
		rehypePlugins,
		...options
	}: Options = $props();
</script>

<Markdown
	{...options}
	rehypePlugins={[
		...(rehypePlugins ?? []),
		[
			harden,
			{
				defaultOrigin,
				allowedLinkPrefixes,
				allowedImagePrefixes
			}
		]
	]}
/>
