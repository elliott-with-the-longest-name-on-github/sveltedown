<script lang="ts">
	import DemoPage from '$lib/demo-page.svelte';
	import { Markdown } from '@sejohnson/svelte-markdown';

	let { data } = $props();
</script>

<DemoPage
	highlighter={data.highlighter}
	initial_content={data.initial_content}
	title="@sejohnson/svelte-markdown"
>
	{#snippet markdown({ content, rehypePlugins, remarkPlugins })}
		<Markdown {content} {rehypePlugins} {remarkPlugins} />
	{/snippet}
</DemoPage>
