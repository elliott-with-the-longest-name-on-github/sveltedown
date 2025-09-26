<script lang="ts">
	import type { Root, RootContent } from 'hast';
	import type { Renderer, Renderers, HTMLElements } from './types.js';
	import { svg, html, type Schema } from 'property-information';
	import { key, reset } from './key.js';
	import type { Snippet } from 'svelte';
	import { sveltify_props, sveltify_children } from './ast.js';
	import { get_renderer } from './renderers.js';

	let { node, ...renderers }: { node: Root } & Renderers = $props();

	$effect.pre(() => {
		node;
		reset();
	});
</script>

{#snippet nodes(schema: Schema, children: RootContent[])}
	{#each children as node (key(node))}
		{#if node.type === 'text'}
			{node.value}
		{:else if node.type === 'element'}
			{@const child_schema = node.tagName.toLowerCase() === 'svg' ? svg : schema}
			{@const props = sveltify_props(child_schema, node)}
			{@const has_children = node.children.length > 0}
			{@const [resolved_tag_name, renderer] = get_renderer(
				node.tagName,
				renderers,
				(has_children ? element : void_element) as Renderer<keyof HTMLElements>
			)}

			{#snippet children()}
				{@render nodes(child_schema, sveltify_children(node))}
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

{@render nodes(html, node.children)}
