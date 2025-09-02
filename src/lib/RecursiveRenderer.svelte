<script module lang="ts">
	import type { Nodes as HastNodes } from 'hast';
	import RecursiveRenderer from './RecursiveRenderer.svelte';
	import type { Renderer, Renderers, SpecificSvelteHTMLElements } from './types.js';

	function get_snippet(tag_name: string, snippets: Renderers, seen = new Set<string>()) {
		if (seen.has(tag_name as string)) {
			throw new Error(`Circular renderer dependency: ${[...seen].join(' => ')} => ${tag_name}`);
		}
		const snippet = snippets[tag_name as keyof Renderers];
		if (typeof snippet === 'string') {
			return get_snippet(snippet, snippets, seen);
		}
		if (snippet === undefined) {
			return default_renderer;
		}
		return snippet as Renderer<keyof Renderers>;
	}
</script>

<script lang="ts">
	const {
		tree,
		renderers
	}: {
		tree: HastNodes;
		renderers: Renderers;
	} = $props();
</script>

{#if tree.type === 'root'}
	{@render children(tree.children)}
{:else if tree.type === 'element'}
	{@const snippet = get_snippet(tree.tagName, renderers)}
	{#if Array.isArray(tree.children) && tree.children.length > 0}
		{#snippet _children()}
			{@render children(tree.children)}
		{/snippet}
		{@render snippet(
			tree.tagName as keyof Renderers,
			{ ...tree.properties, children: _children },
			tree
		)}
	{:else}
		{@render snippet(tree.tagName as keyof Renderers, { ...tree.properties }, tree)}
	{/if}
{:else if tree.type === 'text' || tree.type === 'raw'}
	{tree.value}
{/if}

{#snippet children(nodes: HastNodes[])}
	<!-- eslint-disable-next-line svelte/require-each-key -->
	{#each nodes as node}
		<RecursiveRenderer tree={node} {renderers} />
	{/each}
{/snippet}

{#snippet default_renderer(
	tag_name: keyof SpecificSvelteHTMLElements,
	// @ts-expect-error
	{ children, ...props }: SpecificSvelteHTMLElements[keyof SpecificSvelteHTMLElements]
)}
	{#if children}
		<svelte:element
			this={tag_name}
			{...props}
			{...tag_name === 'svg' ? { xmlns: 'http://www.w3.org/2000/svg' } : {}}
		>
			{@render children()}
		</svelte:element>
	{:else}
		<svelte:element
			this={tag_name}
			{...props}
			{...tag_name === 'svg' ? { xmlns: 'http://www.w3.org/2000/svg' } : {}}
		/>
	{/if}
{/snippet}
