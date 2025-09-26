import type { PluggableList } from 'unified';
import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import type { Renderers } from 'svehast';
import type { Options as RemarkParseOptions } from 'remark-parse';
import type { Element as HastElement } from 'hast';

export type URLTransform = (
	/** The URL (eg. https://example.com)*/
	url: string,
	/** The attribute this URL came from (eg. href, ping, src, etc.) */
	attribute: string,
	/** The `hast` element this URL was found on. `node[attribute]` is `url`. */
	node: HastElement
) => string | undefined;

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
	/** Ignore HTML in markdown completely. Default is `false`. */
	skipHtml?: boolean;
	/** Transform URLs in HTML attributes (href, ping, src, etc.). Defaults to `defaultUrlTransform`. */
	urlTransform?: URLTransform;
} & Renderers;
