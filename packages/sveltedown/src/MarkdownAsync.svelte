<script lang="ts">
	import type { Options } from './types.js';
	import { create_processor } from './core.js';
	import { Hast } from 'svehast';

	let options: Options = $props();

	const processor = $derived(create_processor(options));
	const parsed = $derived(await processor.parse(options.content ?? undefined));
	const compiled = $derived(await processor.run(parsed));
</script>

<Hast node={compiled} {...options} />
