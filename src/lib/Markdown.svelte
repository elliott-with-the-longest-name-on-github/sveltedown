<script lang="ts">
	import type { Options } from './types.js';
	import { create_processor, create_file, post } from './core.js';
	import RecursiveRenderer from './RecursiveRenderer.svelte';

	let options: Options = $props();

	const processor = $derived(create_processor(options));
	const file = $derived(create_file(options));
	const processed = $derived(processor.runSync(processor.parse(file), file));
	const tree = $derived(post(processed, options));
</script>

<RecursiveRenderer {tree} renderers={options} />
