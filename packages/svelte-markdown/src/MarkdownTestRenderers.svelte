<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { Renderer, RendererArg, SpecificSvelteHTMLElements } from './types.js';

	function create_children_element_renderer<TTag extends keyof SpecificSvelteHTMLElements>(
		assertions: (arg: RendererArg<TTag>) => Promise<void> = () => Promise.resolve()
	) {
		let { promise, resolve, reject } = Promise.withResolvers();
		return [
			promise,
			((target: Element, arg: () => RendererArg<TTag>) => {
				assertions(arg()).then(resolve, reject);
				// @ts-expect-error i don't care
				render_children_element(target, arg);
			}) as unknown as Renderer<TTag>
		] as const;
	}

	export { create_children_element_renderer };
</script>

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
