<script lang="ts">
	import type { Options } from './types.js';
	import { create_processor } from './core.js';
	import { Hast } from 'svehast';

	let options: Options = $props();

	// this hypothetically enables better code-splitting, and doesn't really have
	// any downsides I can think of...
	const [remark_parse, remark_rehype, { unified }] = await Promise.all([
		import('remark-parse'),
		import('remark-rehype'),
		import('unified')
	]);
	const processor = $derived(
		create_processor(options, unified, remark_parse.default, remark_rehype.default)
	);
	const parsed = $derived(processor.parse(options.content ?? undefined));
	const compiled = $derived(await processor.run(parsed));
</script>

<Hast node={compiled} {...options} />
