/// <reference types="@vitest/browser/matchers" />
/// <reference types="@vitest/browser/providers/playwright" />
/// <reference types="./vitest.d.ts" />
import { expect } from 'vitest';

expect.extend({
	to_equal_html(
		received: string,
		expected: string,
		options: { preserve_comments?: boolean; without_normalize_html?: boolean } = {}
	) {
		const { preserve_comments, without_normalize_html } = options;

		const process_html = (html: string) => {
			if (without_normalize_html) {
				return normalize_new_line(html.trim()).replace(
					/(<!(--)?.*?\2>)/g,
					preserve_comments !== false ? '$1' : ''
				);
			} else {
				return normalize_html(window, html.trim(), { preserve_comments });
			}
		};

		const normalized_received = process_html(received);
		const normalized_expected = process_html(expected);
		const pass = normalized_received === normalized_expected;
		const { isNot } = this;

		return {
			pass,
			message: (): string =>
				`Expected ${normalized_received}${isNot ? ' not' : ''} to equal ${normalized_expected}`,
			actual: normalized_received,
			expected: normalized_expected
		};
	}
});

const COMMENT_NODE = 8;
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

function clean_children(node: Element, opts: { preserve_comments: boolean }): void {
	let previous: ChildNode | null = null;
	let has_element_children = false;
	const template = node.nodeName === 'TEMPLATE' ? (node as HTMLTemplateElement) : undefined;

	if (template) {
		const div = document.createElement('div');
		div.append(template.content);
		node = div;
	}

	// sort attributes
	const attributes = Array.from(node.attributes).sort((a: Attr, b: Attr) => {
		return a.name < b.name ? -1 : 1;
	});

	attributes.forEach((attr: Attr) => {
		node.removeAttribute(attr.name);
	});

	attributes.forEach((attr: Attr) => {
		// Strip out the special onload/onerror hydration events from the test output
		if ((attr.name === 'onload' || attr.name === 'onerror') && attr.value === 'this.__e=event') {
			return;
		}

		node.setAttribute(attr.name, attr.value);
	});

	for (const child of [...node.childNodes]) {
		if (child.nodeType === TEXT_NODE) {
			let text = child as Text;

			if (
				node.namespaceURI === 'http://www.w3.org/2000/svg' &&
				node.tagName !== 'text' &&
				node.tagName !== 'tspan'
			) {
				node.removeChild(child);
				continue;
			}

			text.data = text.data.replace(/[^\S]+/g, ' ');

			if (previous && previous.nodeType === TEXT_NODE) {
				const prev = previous as Text;

				prev.data += text.data;
				node.removeChild(text);

				text = prev;
				text.data = text.data.replace(/[^\S]+/g, ' ');

				continue;
			}
		}

		if (child.nodeType === COMMENT_NODE && !opts.preserve_comments) {
			// comment
			child.remove();
			continue;
		}

		// add newlines for better readability and potentially recurse into children
		if (child.nodeType === ELEMENT_NODE || child.nodeType === COMMENT_NODE) {
			if (previous?.nodeType === TEXT_NODE) {
				const prev = previous as Text;
				prev.data = prev.data.replace(/^[^\S]+$/, '\n');
			} else if (previous?.nodeType === ELEMENT_NODE || previous?.nodeType === COMMENT_NODE) {
				node.insertBefore(document.createTextNode('\n'), child);
			}

			if (child.nodeType === ELEMENT_NODE) {
				has_element_children = true;
				clean_children(child as Element, opts);
			}
		}

		previous = child;
	}

	// collapse whitespace
	if (node.firstChild && node.firstChild.nodeType === TEXT_NODE) {
		const text = node.firstChild as Text;
		text.data = text.data.trimStart();
	}

	if (node.lastChild && node.lastChild.nodeType === TEXT_NODE) {
		const text = node.lastChild as Text;
		text.data = text.data.trimEnd();
	}

	// indent code for better readability
	if (has_element_children && node.parentNode) {
		node.innerHTML = `\n  ${node.innerHTML.replace(/\n/g, '\n  ')}\n`;
	}

	if (template) {
		template.innerHTML = node.innerHTML;
	}
}

function normalize_html(
	window: Window,
	html: string,
	{ preserve_comments = false }: { preserve_comments?: boolean } = {}
): string {
	try {
		const node = window.document.createElement('div');

		node.innerHTML = html.trim();
		clean_children(node, { preserve_comments });

		return node.innerHTML;
	} catch (err) {
		throw new Error(`Failed to normalize HTML:\n${html}\nCause: ${err}`);
	}
}

export function normalize_new_line(html: string): string {
	return html.replace(/\r\n/g, '\n');
}
