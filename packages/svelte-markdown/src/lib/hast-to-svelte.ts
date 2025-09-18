import type { Element as HastElement, Nodes, Parents, Root, Text } from 'hast';
import { svg, html, type Schema, find } from 'property-information';
import type { RendererArg, Renderers, SpecificSvelteHTMLElements } from './types.js';
import style_to_object from 'style-to-object';
import {
	render_raw as render_raw_compiled,
	render_children_element as render_children_element_compiled,
	render_void_element as render_void_element_compiled,
	render_children as render_children_compiled
} from './Renderers.svelte';
import { BROWSER } from 'esm-env';
import type { Snippet } from 'svelte';

/*
 * This is just for compatibility with the output of `react-markdown` / `toJsxRuntime`
 * see https://github.com/syntax-tree/hast-util-to-jsx-runtime/blob/main/lib/index.js#L41
 */
const table_elements = new Set(['table', 'tbody', 'thead', 'tfoot', 'tr']);

const table_cell_element = new Set(['td', 'th']);

type RuntimeSnippet = (target: Element, ...args: unknown[]) => void;

const to_compiled_snippet = (snippet: RuntimeSnippet) => snippet as Snippet;

// these types are mostly a lie but that's ok
const render_raw = render_raw_compiled as unknown as RuntimeSnippet;
const render_children_element = render_children_element_compiled as unknown as RuntimeSnippet;
const render_void_element = render_void_element_compiled as unknown as RuntimeSnippet;
const render_children = render_children_compiled as unknown as RuntimeSnippet;

// this is nasty -- but during SSR snippet args are compiled to just objects, while in CSR
// they're compiled to thunks. This is here so that on the server we eagerly call the thunk.
let snippet_arg: <T>(args: () => T) => (() => T) | T;
if (BROWSER) {
	snippet_arg = (args) => args;
} else {
	snippet_arg = (args) => args();
}

// HTML whitespace expression.
// See <https://infra.spec.whatwg.org/#ascii-whitespace>.
const whitespace_regex = /[ \t\n\f\r]/g;

type State = {
	ancestors: Parents[];
	renderers: Renderers;
	schema: Schema;
};

type RawSnippet = (target: Element, ...args: unknown[]) => void;

type Options = {
	renderers: Renderers;
};

export function hast_to_svelte(tree: Nodes, options: Options): Snippet {
	const state: State = {
		ancestors: [],
		renderers: options.renderers,
		schema: html
	};

	return (one(state, tree) ?? (() => {})) as Snippet;
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
	return (target: Element) =>
		render_children(
			target,
			snippet_arg(() => children)
		);
}

function text(node: Text): RawSnippet | undefined {
	return (target: Element) =>
		render_raw(
			target,
			snippet_arg(() => node.value)
		);
}

function element(state: State, node: HastElement): RawSnippet | undefined {
	const parent_schema = state.schema;
	if (node.tagName.toLowerCase() === 'svg' && parent_schema.space === 'html') {
		state.schema = svg;
	}

	state.ancestors.push(node);

	const props = create_element_properties(state, node);
	const children = create_children(state, node);

	state.ancestors.pop();
	state.schema = parent_schema;

	const args: RendererArg<keyof SpecificSvelteHTMLElements> = {
		tagName: node.tagName as keyof SpecificSvelteHTMLElements,
		props,
		children:
			children.length > 0
				? to_compiled_snippet((target: Element) =>
						render_children(
							target,
							snippet_arg(() => children)
						)
					)
				: undefined,
		node
	};

	return curry_renderer(node.tagName, state.renderers, args);
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
		props.style = add_style(String(props.style ?? ''), `text-align: ${align_value}`);
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
		.filter((child) => {
			if (node.type === 'element' && table_elements.has(node.tagName)) {
				return typeof child === 'string' ? !whitespace(child) : true;
			}
			return true;
		})
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

function add_style(styles: string, style: string) {
	try {
		const original = style_to_object(styles);
		const additional = style_to_object(style);
		return Object.entries({ ...original, ...additional })
			.map(([key, value]) => `${key}: ${value}`)
			.join('; ');
	} catch {
		return styles; // styles are broken; don't break them more
	}
}

export function get_renderer(
	tag_name: string | number,
	renderers: Renderers,
	args: RendererArg<keyof SpecificSvelteHTMLElements>,
	seen = new Set<string>()
): [resolved_tag_name: string, renderer: RuntimeSnippet] {
	if (seen.has(tag_name as string)) {
		throw new Error(`Circular renderer dependency: ${[...seen].join(' => ')} => ${tag_name}`);
	}
	const renderer = renderers[tag_name as keyof Renderers];
	if (typeof renderer === 'string' || typeof renderer === 'number') {
		return get_renderer(renderer, renderers, args, seen);
	}

	if (renderer) {
		return [tag_name as string, renderer as unknown as RuntimeSnippet];
	} else if (args.children) {
		return [tag_name as string, render_children_element as RuntimeSnippet];
	} else {
		return [tag_name as string, render_void_element as RuntimeSnippet];
	}
}

export function curry_renderer(
	tag_name: string | number,
	renderers: Renderers,
	args: RendererArg<keyof SpecificSvelteHTMLElements>
) {
	const [resolved_tag_name, renderer] = get_renderer(tag_name, renderers, args);
	const tagged_args = () => ({ ...args, tagName: resolved_tag_name });
	return (target: Element) => renderer(target, snippet_arg(tagged_args));
}
