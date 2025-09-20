<script lang="ts">
	import { dev } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import DemoPage from '$lib/demo-page.svelte';
	import { Markdown } from '@sejohnson/hardened-svelte-markdown';

	let { data } = $props();

	const url = `${dev ? 'http://localhost:5173' : env.PUBLIC_VERCEL_URL}/hardened-svelte-markdown`;
</script>

<DemoPage
	highlighter={data.highlighter}
	initial_content={data.initial_content}
	title="@sejohnson/hardened-svelte-markdown"
>
	{#snippet markdown({ content, rehypePlugins, remarkPlugins })}
		<Markdown
			{content}
			{rehypePlugins}
			{remarkPlugins}
			defaultOrigin={url}
			allowedLinkPrefixes={[url]}
		/>
	{/snippet}
</DemoPage>
