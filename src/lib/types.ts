import type { Element, Parents } from 'hast';
import type { Snippet } from 'svelte';
import type { PluggableList } from 'unified';
import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import type { SvelteHTMLElements } from 'svelte/elements';

/** Filter elements. */
type AllowElement = (
	/** Element to check. */
	element: Readonly<Element>,
	/** Index of `element` in `parent`. */
	index: number,
	/** Parent of `element`. */
	parent: Readonly<Parents> | undefined
) => boolean | null | undefined;

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
	node?: Element;
};

export type Renderer<T extends keyof SpecificSvelteHTMLElements> = Snippet<[RendererArg<T>]>;

/** Map tag names to renderers. */
export type Renderers = {
	[Key in keyof SpecificSvelteHTMLElements]?: Renderer<Key> | keyof SvelteHTMLElements;
};

/**
 * Transform all URLs.
 * @returns Transformed URL (optional).
 */
export type URLTransform = (
	/** URL. */
	url: string,
	/** Property name (example: `'href'`). */
	key: string,
	/** Node. */
	element: Readonly<Element>
) => string | null | undefined;

/** Configuration. */
export type Options = {
	/** Filter elements (optional); `allowedElements` / `disallowedElements` is used first. */
	allowElement?: AllowElement | null | undefined;
	/** Tag names to allow (default: all tag names); cannot combine w/ `disallowedElements`. */
	allowedElements?: ReadonlySet<string> | null | undefined;
	/** Markdown. */
	content?: string | null | undefined;
	/** Tag names to disallow (default: `[]`); cannot combine w/ `allowedElements`. */
	disallowedElements?: ReadonlySet<string> | null | undefined;
	/** List of rehype plugins to use. */
	rehypePlugins?: PluggableList | null | undefined;
	/** List of remark plugins to use. */
	remarkPlugins?: PluggableList | null | undefined;
	/** Options to pass through to `remark-rehype`. */
	remarkRehypeOptions?: Readonly<RemarkRehypeOptions> | null | undefined;
	/** Ignore HTML in markdown completely (default: `false`). */
	skipHtml?: boolean | null | undefined;
	/** Extract (unwrap) what’s in disallowed elements (default: `false`). */
	unwrapDisallowed?: boolean | null | undefined;
	/** Change URLs (default: `defaultUrlTransform`). */
	urlTransform?: URLTransform | null | undefined;
} & Renderers;
