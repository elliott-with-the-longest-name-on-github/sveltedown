<script lang="ts">
	import DemoPage from '$lib/demo-page.svelte';
	import { Markdown } from 'sveltedown';
	import initial_content from './initial-content.md?raw';

	let { data } = $props();
</script>

<DemoPage highlighter={data.highlighter} {initial_content} title="sveltedown">
	{#snippet markdown({ content, rehypePlugins, remarkPlugins })}
		<Markdown {content} {rehypePlugins} {remarkPlugins} />
	{/snippet}
</DemoPage>
