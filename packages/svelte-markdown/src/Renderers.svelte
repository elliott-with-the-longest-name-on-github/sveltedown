<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { SpecificSvelteHTMLElements } from './types.js';

	export { render_void_element, render_children_element, render_children, render_raw };
</script>

{#snippet render_void_element({
	tagName: tag_name,
	props
}: {
	tagName: keyof SpecificSvelteHTMLElements;
	props: SpecificSvelteHTMLElements[keyof SpecificSvelteHTMLElements];
})}
	<svelte:element this={tag_name} {...props} />
{/snippet}

{#snippet render_children_element({
	tagName: tag_name,
	children,
	props
}: {
	tagName: keyof SpecificSvelteHTMLElements;
	children?: Snippet;
	props: SpecificSvelteHTMLElements[keyof SpecificSvelteHTMLElements];
})}
	<svelte:element this={tag_name} {...props}>{@render children?.()}</svelte:element>
{/snippet}

{#snippet render_children(renderers: Snippet[])}
	{#each renderers as renderer, i (i)}
		{@render renderer()}
	{/each}
{/snippet}

{#snippet render_raw(value: string)}{value}{/snippet}
