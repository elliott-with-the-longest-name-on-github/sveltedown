<script lang="ts">
	import type { Options } from './types.js';
	import { create_processor } from './core.js';
	import { Hast } from 'hast-to-svelte';

	let options: Options = $props();

	const processor = $derived(create_processor(options));
	const parsed = $derived(processor.parse(options.content ?? undefined));
	const compiled = $derived(processor.runSync(parsed));
</script>

<Hast node={compiled} renderers={options} />
