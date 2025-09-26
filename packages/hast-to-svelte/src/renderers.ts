import type { Renderer, Renderers, HTMLElements } from './types';

export function get_renderer(
	tag_name: string | number,
	renderers: Renderers,
	fallback: Renderer<keyof HTMLElements>,
	seen = new Set<string>()
): [resolved_tag_name: keyof HTMLElements, renderer: Renderer<keyof HTMLElements>] {
	if (seen.has(tag_name as string)) {
		throw new Error(`Circular renderer dependency: ${[...seen].join(' => ')} => ${tag_name}`);
	}
	const renderer = renderers[tag_name as keyof Renderers];
	if (typeof renderer === 'string' || typeof renderer === 'number') {
		return get_renderer(renderer, renderers, fallback, seen);
	}

	if (renderer) {
		return [tag_name as keyof HTMLElements, renderer as Renderer<keyof HTMLElements>];
	} else {
		return [tag_name as keyof HTMLElements, fallback];
	}
}
