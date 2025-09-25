import type { PluggableList } from 'unified';
import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import type { Renderers } from 'hast-to-svelte';
import type { Options as RemarkParseOptions } from 'remark-parse';

/** Configuration. */
export type Options = {
	/** Markdown. */
	content?: string;
	/** List of rehype plugins to use. */
	rehypePlugins?: PluggableList;
	/** List of remark plugins to use. */
	remarkPlugins?: PluggableList;
	/** Options to pass through to `remark-rehype`. */
	remarkRehypeOptions?: Readonly<RemarkRehypeOptions>;
	/** Options to pass through to `remark-parse`. */
	remarkParseOptions?: Readonly<RemarkParseOptions>;
} & Renderers;
