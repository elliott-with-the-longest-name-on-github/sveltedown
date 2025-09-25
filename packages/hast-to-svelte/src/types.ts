import type { Element as HastElement } from 'hast';
import type { SvelteHTMLElements } from 'svelte/elements';
import type { Snippet } from 'svelte';

type RemoveIndex<T> = {
	[K in keyof T as string extends K
		? never
		: number extends K
			? never
			: symbol extends K
				? never
				: K]: T[K];
};

export type SpecificSvelteHTMLElements = RemoveIndex<SvelteHTMLElements>;

export type RendererArg<T extends keyof SpecificSvelteHTMLElements> = {
	tagName: T;
	props: SpecificSvelteHTMLElements[T];
	children?: Snippet;
	node?: HastElement;
};

export type Renderer<T extends keyof SpecificSvelteHTMLElements> = Snippet<[RendererArg<T>]>;

/** Map tag names to renderers. */
export type Renderers = {
	[Key in keyof SpecificSvelteHTMLElements]?: Renderer<Key> | keyof SvelteHTMLElements;
};
