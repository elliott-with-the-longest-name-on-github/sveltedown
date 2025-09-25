import type { Renderer, Renderers, SpecificSvelteHTMLElements } from './types';

export function get_renderer(
	tag_name: string | number,
	renderers: Renderers,
	fallback: Renderer<keyof SpecificSvelteHTMLElements>,
	seen = new Set<string>()
): [
	resolved_tag_name: keyof SpecificSvelteHTMLElements,
	renderer: Renderer<keyof SpecificSvelteHTMLElements>
] {
	if (seen.has(tag_name as string)) {
		throw new Error(`Circular renderer dependency: ${[...seen].join(' => ')} => ${tag_name}`);
	}
	const renderer = renderers[tag_name as keyof Renderers];
	if (typeof renderer === 'string' || typeof renderer === 'number') {
		return get_renderer(renderer, renderers, fallback, seen);
	}

	if (renderer) {
		return [
			tag_name as keyof SpecificSvelteHTMLElements,
			renderer as Renderer<keyof SpecificSvelteHTMLElements>
		];
	} else {
		return [tag_name as keyof SpecificSvelteHTMLElements, fallback];
	}
}
