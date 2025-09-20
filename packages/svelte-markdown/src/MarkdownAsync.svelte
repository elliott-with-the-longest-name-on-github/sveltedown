<script lang="ts">
	import type { Options } from './types.js';
	import { create_processor, create_file, post } from './core.js';
	import { hast_to_svelte } from './hast-to-svelte.js';

	let options: Options = $props();

	const processor = $derived(create_processor(options));
	const file = $derived(create_file(options));
	const processed = $derived(await processor.run(processor.parse(file), file));
	const tree = $derived(post(processed, options));
	const renderer = $derived(hast_to_svelte(tree, { renderers: options }));
</script>

{@render renderer()}
