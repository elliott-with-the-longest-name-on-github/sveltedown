<script lang="ts">
	import type { HardenedOptions } from './types.js';
	import Markdown from './Markdown.svelte';
	import { harden } from './harden.js';

	let {
		defaultOrigin = '',
		allowedLinkPrefixes = [],
		allowedImagePrefixes = [],
		rehypePlugins = [],
		...options
	}: HardenedOptions = $props();
</script>

<Markdown
	{...options}
	rehypePlugins={[
		...rehypePlugins,
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
