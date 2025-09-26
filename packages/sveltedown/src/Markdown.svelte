<script lang="ts">
	import type { Options } from './types.js';
	import { create_processor } from './core.js';
	import { Hast } from 'svehast';
	import remark_parse from 'remark-parse';
	import remark_rehype from 'remark-rehype';
	import { unified } from 'unified';

	let options: Options = $props();

	const processor = $derived(create_processor(options, unified, remark_parse, remark_rehype));
	const parsed = $derived(processor.parse(options.content ?? undefined));
	const compiled = $derived(processor.runSync(parsed));
</script>

<Hast node={compiled} {...options} />
