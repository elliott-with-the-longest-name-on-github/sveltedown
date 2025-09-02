import type { PluggableList } from 'unified';
import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import type { Options, URLTransform } from './types.js';
import type { Root as MdastRoot } from 'mdast';
import type { Root as HastRoot, Nodes as HastNodes } from 'hast';
import remark_parse from 'remark-parse';
import remark_rehype from 'remark-rehype';
import { unified, type Processor } from 'unified';
import { VFile } from 'vfile';
import { DEV } from 'esm-env';
import { visit, type BuildVisitor } from 'unist-util-visit';
import { urlAttributes } from 'html-url-attributes';

const empty_plugins: PluggableList = [];

const empty_remark_rehype_options: RemarkRehypeOptions = { allowDangerousHtml: true };

const safe_protocol = /^(https?|ircs?|mailto|xmpp)$/i;

export function create_processor(
	options: Readonly<Options>
): Processor<MdastRoot, MdastRoot, HastRoot, undefined, undefined> {
	const rehype_plugins = options.rehypePlugins ?? empty_plugins;
	const remark_plugins = options.remarkPlugins ?? empty_plugins;
	const remark_rehype_options = options.remarkRehypeOptions
		? { ...options.remarkRehypeOptions, ...empty_remark_rehype_options }
		: empty_remark_rehype_options;

	const processor = unified()
		.use(remark_parse)
		.use(remark_plugins)
		.use(remark_rehype, remark_rehype_options)
		.use(rehype_plugins);

	return processor;
}

export function create_file(options: Readonly<Options>): InstanceType<typeof VFile> {
	const content = options.content ?? '';
	return new VFile({ value: content });
}

export function post(tree: HastNodes, options: Readonly<Options>) {
	const allowed_elements = options.allowedElements;
	const allow_element = options.allowElement;
	const disallowed_elements = options.disallowedElements;
	const skip_html = options.skipHtml;
	const unwrap_disallowed = options.unwrapDisallowed;
	const url_transform = options.urlTransform || defaultUrlTransform;

	if (DEV && allowed_elements && disallowed_elements) {
		throw new Error(
			'Unexpected combined `allowedElements` and `disallowedElements`, expected one or the other'
		);
	}

	const transform: BuildVisitor<HastNodes> = (node, index, parent) => {
		if (node.type === 'raw' && parent && typeof index === 'number') {
			if (skip_html) {
				parent.children.splice(index, 1);
			} else {
				parent.children[index] = { type: 'text', value: node.value };
			}

			return index;
		}

		if (node.type === 'element') {
			for (const [key, test] of Object.entries(urlAttributes)) {
				if (Object.hasOwn(node.properties, key)) {
					if (test === null || test === undefined || test.includes(node.tagName)) {
						node.properties[key] = url_transform(String(node.properties[key] || ''), key, node);
					}
				}
			}

			// for some idiotic reason, hast, the HTML AST, uses `className` instead of `class`
			// and ariaXxx instead of aria-xxx
			if (node.properties) {
				if (Object.hasOwn(node.properties, 'className')) {
					node.properties.class =
						typeof node.properties.className === 'string'
							? node.properties.className
							: Array.isArray(node.properties.className)
								? node.properties.className.join(' ')
								: (node.properties.className?.toString() ?? '');
					delete node.properties.className;
				}
				for (const [key, value] of Object.entries(node.properties)) {
					if (key.startsWith('aria')) {
						node.properties[key.replace(/([A-Z])/, '-$1').toLowerCase()] = value;
						delete node.properties[key];
					} else if (key.startsWith('data')) {
						node.properties[key.replace(/([A-Z])/g, '-$1')] = value;
						delete node.properties[key];
					}
				}
			}
		}

		if (node.type === 'element') {
			let remove = allowed_elements
				? !allowed_elements.has(node.tagName)
				: disallowed_elements
					? disallowed_elements.has(node.tagName)
					: false;

			if (!remove && allow_element && typeof index === 'number') {
				remove = !allow_element(node, index, parent);
			}

			if (remove && parent && typeof index === 'number') {
				if (unwrap_disallowed && node.children) {
					parent.children.splice(index, 1, ...node.children);
				} else {
					parent.children.splice(index, 1);
				}

				return index;
			}
		}
	};

	visit(tree, transform);

	return tree;
}

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
