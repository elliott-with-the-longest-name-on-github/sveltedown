import { describe, it, expect } from 'vitest';
import { sveltify_props, sveltify_children } from './ast.js';
import { h, s } from 'hastscript';
import { html, svg } from 'property-information';

const WHITESPACE_CASES = [
	{ display: JSON.stringify(' ').replaceAll('"', ''), actual: ' ' },
	{ display: JSON.stringify('\t').replaceAll('"', ''), actual: '\t' },
	{ display: JSON.stringify('\n').replaceAll('"', ''), actual: '\n' },
	{ display: JSON.stringify('\r').replaceAll('"', ''), actual: '\r' },
	{ display: JSON.stringify('\f').replaceAll('"', ''), actual: '\f' }
] as const;

describe('sveltify_props', () => {
	it('should un-jsx className', () => {
		// this node has a `className` prop instead of a `class` prop, because
		// why would you not use JSX prop naming in a HTML
		const node = h('div.dumb');
		expect(node).toMatchObject({ properties: { className: ['dumb'] } });
		expect(sveltify_props(html, node)).toEqual({ class: 'dumb' });
	});

	it('should un-jsx data attributes', () => {
		const node = h('div', { 'data-test': 'test' });
		expect(node).toMatchObject({ properties: { dataTest: 'test' } });
		expect(sveltify_props(html, node)).toEqual({ 'data-test': 'test' });
	});

	it('should un-jsx svg attributes', () => {
		const node = s('svg', { 'stroke-linejoin': '100' });
		expect(node).toMatchObject({ properties: { strokeLineJoin: '100' } });
		expect(sveltify_props(svg, node)).toEqual({ 'stroke-linejoin': '100' });
	});

	describe.each(['td', 'th'])('%s', (tag_name) => {
		it.each(['center', 'left', 'right', 'justify', 'char'])(
			'should replace obsolete align in table elements with styles (%s)',
			(align) => {
				const node = h(tag_name, { align });
				expect(node).toMatchObject({ properties: { align } });
				expect(sveltify_props(html, node)).toEqual({ style: `text-align: ${align}` });
			}
		);

		it.each(['center', 'left', 'right', 'justify', 'char'])(
			'should replace obsolete align in table elements with styles, appending to existing styles (%s)',
			(align) => {
				const node = h(tag_name, { align, style: 'color: red;' });
				expect(node).toMatchObject({ properties: { align, style: 'color: red;' } });
				expect(sveltify_props(html, node)).toEqual({ style: `color: red; text-align: ${align}` });
			}
		);
	});
});

describe('sveltify_children', () => {
	describe.each(['table', 'tbody', 'thead', 'tfoot', 'tr'])('%s', (tag_name) => {
		it.each(WHITESPACE_CASES)(
			`should remove whitespace-only text nodes from table elements ($display))`,
			({ actual: whitespace }) => {
				const node = h(tag_name, [whitespace, h('div', 'Hello, world!'), whitespace.repeat(10)]);
				expect(sveltify_children(node)).toEqual([h('div', 'Hello, world!')]);
			}
		);
	});

	describe.each(['div', 'span', 'p', 'h1'])('%s', (tag_name) => {
		it.each(WHITESPACE_CASES)(
			'should preserve whitespace-only text nodes from table elements ($display))',
			({ actual: whitespace }) => {
				const node = h(tag_name, [whitespace, h('div', 'Hello, world!'), whitespace.repeat(10)]);
				expect(sveltify_children(node)).toEqual(
					h(tag_name, [whitespace, h('div', 'Hello, world!'), whitespace.repeat(10)]).children
				);
			}
		);
	});
});
