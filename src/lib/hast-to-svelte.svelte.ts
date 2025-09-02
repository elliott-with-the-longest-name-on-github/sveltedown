import type { Element as HastElement, Nodes, Parents, Root, Text } from 'hast';
import { svg, html, type Schema, find } from 'property-information';
import type { RendererArg, Renderers, SpecificSvelteHTMLElements } from './types.js';
import style_to_object from 'style-to-object';
import {
	render_raw,
	render_children_element,
	render_void_element,
	render_children
} from './Renderers.svelte';
import { BROWSER } from 'esm-env';

/*
 * This is just for compatibility with the output of `react-markdown` / `toJsxRuntime`
 * see https://github.com/syntax-tree/hast-util-to-jsx-runtime/blob/main/lib/index.js#L41
 */
const table_elements = new Set(['table', 'tbody', 'thead', 'tfoot', 'tr']);

const table_cell_element = new Set(['td', 'th']);

// this is nasty
let snippet_args: <T>(args: T) => (() => T) | T;
if (BROWSER) {
	snippet_args =
		<T>(args: T) =>
		() =>
			args;
} else {
	snippet_args = <T>(args: T) => args;
}

// HTML whitespace expression.
// See <https://infra.spec.whatwg.org/#ascii-whitespace>.
const whitespace_regex = /[ \t\n\f\r]/g;

type State = {
	ancestors: Parents[];
	renderers: Renderers;
	schema: Schema;
};

type RawSnippet = (dom_node: Element, ...args: unknown[]) => void;

type Options = {
	renderers: Renderers;
};

export function hast_to_svelte(tree: Nodes, options: Options): RawSnippet {
	const state: State = {
		ancestors: [],
		renderers: options.renderers,
		schema: html
	};

	return one(state, tree) ?? (() => {});
}

function one(state: State, node: Nodes): RawSnippet | undefined {
	switch (node.type) {
		case 'root':
			return root(state, node);
		case 'element':
			return element(state, node);
		case 'text':
			return text(node);
	}
}

function root(state: State, node: Root): RawSnippet | undefined {
	const children = create_children(state, node);
	return (dom_node: Element) => render_children(dom_node, snippet_args(children));
}

function text(node: Text): RawSnippet | undefined {
	return (dom_node: Element) => render_raw(dom_node, snippet_args(node.value));
}

function element(state: State, node: HastElement): RawSnippet | undefined {
	const parent_schema = state.schema;
	if (node.tagName.toLowerCase() === 'svg' && parent_schema.space === 'html') {
		state.schema = svg;
	}

	state.ancestors.push(node);

	const renderer = get_snippet(node.tagName, state.renderers);
	const props = create_element_properties(state, node);
	let children = create_children(state, node);

	if (table_elements.has(node.tagName)) {
		children = children.filter((child) => (typeof child === 'string' ? !whitespace(child) : true));
	}

	state.ancestors.pop();
	state.schema = parent_schema;

	const args: RendererArg<keyof SpecificSvelteHTMLElements> = {
		tagName: node.tagName as keyof SpecificSvelteHTMLElements,
		props,
		children: (dom_node: Element) => render_children(dom_node, snippet_args(children)),
		node
	};

	if (renderer) {
		return (dom_node: Element) => renderer(dom_node, snippet_args(args));
	} else if (children.length > 0) {
		return (dom_node: Element) => render_children_element(dom_node, snippet_args(args));
	} else {
		return (dom_node: Element) => render_void_element(dom_node, snippet_args(args));
	}
}

function create_element_properties(state: State, node: HastElement) {
	const props: Record<string, unknown> = {};
	let align_value: string | undefined;

	for (const [prop, prop_value] of Object.entries(node.properties)) {
		if (prop === 'children') continue;
		const result = create_property(state, prop, prop_value);

		if (!result) continue;

		const [attribute, attribute_value] = result;

		if (
			attribute === 'align' &&
			typeof attribute_value === 'string' &&
			table_cell_element.has(node.tagName)
		) {
			align_value = attribute_value;
		} else {
			props[attribute] = attribute_value;
		}
	}

	if (align_value) {
		props.style = add_style(state, props.style as string, `text-align: ${align_value}`);
	}

	return props;
}

function create_property(
	state: State,
	prop: string,
	value: Array<number | string> | boolean | number | string | null | undefined
): [string, unknown] | undefined {
	const info = find(state.schema, prop);

	if (value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value))) {
		return;
	}

	if (Array.isArray(value)) {
		value = info.commaSeparated ? commas(value) : spaces(value);
	}

	// React has special handling for `style` objects, but I don't think we need any of it here.
	// if we do in the future, this is where we'd put it

	return [info.attribute, value];
}

function create_children(state: State, node: Parents) {
	return node.children
		.map((child) => one(state, child))
		.filter((value): value is RawSnippet => value !== undefined);
}

function commas(values: Array<number | string>) {
	// Ensure the last empty entry is seen.
	const input = values[values.length - 1] === '' ? [...values, ''] : values;
	return input.join(', ').trim();
}

function spaces(values: Array<number | string>) {
	return values.join(' ').trim();
}

function whitespace(value: string) {
	return value.replace(whitespace_regex, '') === '';
}

function add_style(state: State, styles: string, style: string) {
	try {
		const original = style_to_object(styles);
		const additional = style_to_object(style);
		return Object.entries({ ...original, ...additional })
			.map(([key, value]) => `${key}: ${value}`)
			.join('; ');
	} catch {
		return {};
	}
}

// TODO might be worth memoizing
function get_snippet(tag_name: string | number, snippets: Renderers, seen = new Set<string>()) {
	if (seen.has(tag_name as string)) {
		throw new Error(`Circular renderer dependency: ${[...seen].join(' => ')} => ${tag_name}`);
	}
	const snippet = snippets[tag_name as keyof Renderers];
	if (typeof snippet === 'string' || typeof snippet === 'number') {
		return get_snippet(snippet, snippets, seen);
	}
	return snippet;
}
