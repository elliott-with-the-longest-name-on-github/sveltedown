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

type RemoveSveltePrefixed<T> = {
	[K in keyof T as K extends `svelte:${string}` ? never : K]: T[K];
};

export type HTMLElements = RemoveSveltePrefixed<RemoveIndex<SvelteHTMLElements>>;

export type RendererArg<T extends keyof HTMLElements> = {
	tagName: T;
	props: HTMLElements[T];
	children?: Snippet;
	node?: HastElement;
};

export type Renderer<T extends keyof HTMLElements> = Snippet<[RendererArg<T>]>;

/** Map tag names to renderers. */
export type Renderers = {
	[Key in keyof HTMLElements]?: Renderer<Key> | keyof SvelteHTMLElements;
};
