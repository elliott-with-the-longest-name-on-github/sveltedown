import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import type { Options, URLTransform } from './types.js';
import type { Root as MdastRoot } from 'mdast';
import type { Root as HastRoot, Nodes as HastNodes, Parents as HastParents } from 'hast';
import type _remark_parse from 'remark-parse';
import type _remark_rehype from 'remark-rehype';
import { type unified as _unified, type Processor, type PluggableList, type Plugin } from 'unified';
import { url_attributes } from './url-attributes.js';

const empty_plugins: PluggableList = [];

const empty_remark_rehype_options: RemarkRehypeOptions = { allowDangerousHtml: true };

export function create_processor(
	options: Readonly<Options>,
	unified: typeof _unified,
	remark_parse: typeof _remark_parse,
	remark_rehype: typeof _remark_rehype
): Processor<MdastRoot, MdastRoot, HastRoot, undefined, undefined> {
	const remark_rehype_options = options.remarkRehypeOptions
		? { ...options.remarkRehypeOptions, ...empty_remark_rehype_options }
		: empty_remark_rehype_options;

	const processor = unified()
		.use(remark_parse)
		.use(options.remarkPlugins ?? empty_plugins)
		.use(remark_rehype, remark_rehype_options)
		.use(options.rehypePlugins ?? empty_plugins)
		.use(postprocess, options);

	return processor;
}

type PostprocessOptions = Required<Pick<Options, 'urlTransform' | 'skipHtml'>>;

const postprocess: Plugin<[Options], HastRoot> = (options: Readonly<Options>) => {
	return (tree: HastRoot) => {
		const resolved_options = {
			urlTransform: options.urlTransform ?? defaultUrlTransform,
			skipHtml: options.skipHtml ?? false
		};
		root(resolved_options, tree);
	};
};

function root(options: PostprocessOptions, node: HastRoot) {
	many(options, node);
}

function one(options: PostprocessOptions, parent: HastParents, node: HastNodes, index: number) {
	if (node.type === 'raw') {
		if (options.skipHtml) {
			parent.children.splice(index, 1);
		} else {
			parent.children[index] = { type: 'text', value: node.value };
		}
	}

	if (node.type === 'element') {
		for (const [key, test] of Object.entries(url_attributes)) {
			if (Object.hasOwn(node.properties, key)) {
				if (test === null || test.includes(node.tagName)) {
					node.properties[key] = options.urlTransform(
						String(node.properties[key] || ''),
						key,
						node
					);
				}
			}
		}
	}

	if ('children' in node) {
		many(options, node);
	}
}

function many(options: PostprocessOptions, node: HastParents) {
	if (!node.children) {
		return;
	}

	// we do this in reverse order so that splicing a child out doesn't cause undefined
	// issues at the end of the array
	for (let i = node.children.length - 1; i >= 0; i--) {
		one(options, node, node.children[i], i);
	}
}

const safe_protocol = /^(https?|ircs?|mailto|xmpp)$/i;

/**
 * Make a URL safe.
 *
 * This follows how GitHub works.
 * It allows the protocols `http`, `https`, `irc`, `ircs`, `mailto`, and `xmpp`,
 * and URLs relative to the current protocol (such as `/something`).
 */
export const defaultUrlTransform: URLTransform = (value) => {
	// Same as:
	// <https://github.com/micromark/micromark/blob/929275e/packages/micromark-util-sanitize-uri/dev/index.js#L34>
	// But without the `encode` part.
	const colon = value.indexOf(':');
	const question_mark = value.indexOf('?');
	const number_sign = value.indexOf('#');
	const slash = value.indexOf('/');

	if (
		// If there is no protocol, it’s relative.
		colon === -1 ||
		// If the first colon is after a `?`, `#`, or `/`, it’s not a protocol.
		(slash !== -1 && colon > slash) ||
		(question_mark !== -1 && colon > question_mark) ||
		(number_sign !== -1 && colon > number_sign) ||
		// It is a protocol, it should be allowed.
		safe_protocol.test(value.slice(0, colon))
	) {
		return value;
	}

	return '';
};
