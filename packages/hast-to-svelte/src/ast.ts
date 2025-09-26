import { find, type Schema } from 'property-information';
import type { Element, Parents } from 'hast';
import style_to_object from 'style-to-object';

export function sveltify_props(schema: Schema, node: Element): Record<string, unknown> {
	const props: Record<string, unknown> = {};
	let align_value: string | undefined;

	for (const [prop, prop_value] of Object.entries(node.properties)) {
		if (prop === 'children') continue;
		const result = sveltify_prop(schema, prop, prop_value);

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

function sveltify_prop(
	schema: Schema,
	prop: string,
	value: Array<number | string> | boolean | number | string | null | undefined
): [string, unknown] | undefined {
	const info = find(schema, prop);

	if (value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value))) {
		return;
	}

	if (Array.isArray(value)) {
		value = info.commaSeparated ? commas(value) : spaces(value);
	}

	return [info.attribute, value];
}

export function sveltify_children(node: Parents): Parents['children'] {
	return node.children.filter((child) => {
		if (node.type === 'element' && table_elements.has(node.tagName) && child.type === 'text') {
			return !whitespace(child.value);
		}
		return true;
	});
}

function commas(values: Array<number | string>) {
	// Ensure the last empty entry is seen.
	const input = values[values.length - 1] === '' ? [...values, ''] : values;
	return input.join(', ').trim();
}

function spaces(values: Array<number | string>) {
	return values.join(' ').trim();
}

// HTML whitespace expression.
// See <https://infra.spec.whatwg.org/#ascii-whitespace>.
const whitespace_regex = /[ \t\n\f\r]/g;

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

/*
 * This is just for compatibility with the output of `react-markdown` / `toJsxRuntime`
 * see https://github.com/syntax-tree/hast-util-to-jsx-runtime/blob/main/lib/index.js#L41
 */
const table_elements = new Set(['table', 'tbody', 'thead', 'tfoot', 'tr']);

const table_cell_element = new Set(['td', 'th']);
