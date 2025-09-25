<script lang="ts">
	import type { Root, RootContent } from 'hast';
	import type { Renderer, Renderers, SpecificSvelteHTMLElements } from './types.js';
	import { svg, html } from 'property-information';
	import { key, reset } from './key.js';
	import type { Snippet } from 'svelte';
	import { sveltify_props, sveltify_children } from './ast.js';
	import { get_renderer } from './renderers.js';

	let { node, renderers }: { node: Root; renderers: Renderers } = $props();

	$effect.pre(() => {
		node;
		reset();
	});
</script>

{#snippet nodes(children: RootContent[])}
	{#each children as node (key(node))}
		{#if node.type === 'text'}
			{node.value}
		{:else if node.type === 'element'}
			{@const schema = node.tagName.toLowerCase() === 'svg' ? svg : html}
			{@const props = sveltify_props(schema, node)}
			{@const has_children = node.children.length > 0}
			{@const [resolved_tag_name, renderer] = get_renderer(
				node.tagName,
				renderers,
				(has_children ? element : void_element) as Renderer<keyof SpecificSvelteHTMLElements>
			)}

			{#snippet children()}
				{@render nodes(sveltify_children(node))}
			{/snippet}

			{@render renderer({
				tagName: resolved_tag_name,
				props,
				children: has_children ? children : undefined,
				node
			})}
		{/if}
	{/each}
{/snippet}

{#snippet void_element({ tagName, props }: { tagName: string; props: Record<string, unknown> })}
	<svelte:element this={tagName} {...props} />
{/snippet}

{#snippet element({
	tagName,
	props,
	children
}: {
	tagName: string;
	props: Record<string, unknown>;
	children: Snippet;
})}
	<svelte:element this={tagName} {...props}>
		{@render children()}
	</svelte:element>
{/snippet}

{@render nodes(node.children)}
