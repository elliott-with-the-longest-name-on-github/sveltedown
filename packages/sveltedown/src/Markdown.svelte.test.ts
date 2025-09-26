import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Markdown from './Markdown.svelte';
import rehype_raw from 'rehype-raw';
import remark_gfm from 'remark-gfm';
import { create_children_element_renderer } from './MarkdownTestRenderers.svelte';
import type { Parents, Nodes } from 'hast';

describe('Markdown', () => {
	it('should support `undefined` as children', async () => {
		const screen = render(Markdown, { content: undefined });
		await expect.element(screen.container).to_equal_html('');
	});

	it('should support a block quote', async () => {
		const screen = render(Markdown, { content: '> Hello' });
		await expect
			.element(screen.container)
			.to_equal_html('<blockquote>\n<p>Hello</p>\n</blockquote>');
	});

	it('should support a break', async () => {
		const screen = render(Markdown, { content: 'Hello\\\nWorld' });
		await expect.element(screen.container).to_equal_html('<p>Hello<br>\nWorld</p>');
	});

	it('should support a code (block, flow; indented)', async () => {
		const screen = render(Markdown, { content: '    a' });
		await expect.element(screen.container).to_equal_html('<pre><code>a\n</code></pre>');
	});

	it('should support a code (block, flow; fenced)', async () => {
		const screen = render(Markdown, { content: '```js\na\n```' });
		await expect
			.element(screen.container)
			.to_equal_html('<pre><code class="language-js">a\n</code></pre>');
	});

	it('should support a delete (GFM)', async () => {
		const screen = render(Markdown, { content: '~a~', remarkPlugins: [remark_gfm] });
		await expect.element(screen.container).to_equal_html('<p><del>a</del></p>');
	});

	it('should support an emphasis', async () => {
		const screen = render(Markdown, { content: '*a*' });
		await expect.element(screen.container).to_equal_html('<p><em>a</em></p>');
	});

	it('should support a footnote (GFM)', async () => {
		const screen = render(Markdown, { content: 'a[^x]\n\n[^x]: y', remarkPlugins: [remark_gfm] });
		await expect
			.element(screen.container)
			.to_equal_html(
				'<p>a<sup><a href="#user-content-fn-x" id="user-content-fnref-x" data-footnote-ref="true" aria-describedby="footnote-label">1</a></sup></p>\n<section data-footnotes="true" class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2>\n<ol>\n<li id="user-content-fn-x">\n<p>y <a href="#user-content-fnref-x" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>\n</li>\n</ol>\n</section>'
			);
	});

	it('should support a heading', async () => {
		const screen = render(Markdown, { content: '# a' });
		await expect.element(screen.container).to_equal_html('<h1>a</h1>');
	});

	it('should support an html (default)', async () => {
		const screen = render(Markdown, { content: '<i>a</i>' });
		await expect.element(screen.container).to_equal_html('<p>&lt;i&gt;a&lt;/i&gt;</p>');
	});

	it('should support an html (w/ `rehype-raw`)', async () => {
		const screen = render(Markdown, { content: '<i>a</i>', rehypePlugins: [rehype_raw] });
		await expect.element(screen.container).to_equal_html('<p><i>a</i></p>');
	});

	it('should support an image', async () => {
		const screen = render(Markdown, { content: '![a](b)' });
		await expect.element(screen.container).to_equal_html('<p><img src="b" alt="a"></p>');
	});

	it('should support an image w/ a title', async () => {
		const screen = render(Markdown, { content: '![a](b (c))' });
		await expect.element(screen.container).to_equal_html('<p><img src="b" alt="a" title="c"></p>');
	});

	it('should support an image reference / definition', async () => {
		const screen = render(Markdown, { content: '![a]\n\n[a]: b' });
		await expect.element(screen.container).to_equal_html('<p><img src="b" alt="a"></p>');
	});

	it('should support code (text, inline)', async () => {
		const screen = render(Markdown, { content: '`a`' });
		await expect.element(screen.container).to_equal_html('<p><code>a</code></p>');
	});

	it('should support a link', async () => {
		const screen = render(Markdown, { content: '[a](b)' });
		await expect.element(screen.container).to_equal_html('<p><a href="b">a</a></p>');
	});

	it('should support a link w/ a title', async () => {
		const screen = render(Markdown, { content: '[a](b (c))' });
		await expect.element(screen.container).to_equal_html('<p><a href="b" title="c">a</a></p>');
	});

	it('should support a link reference / definition', async () => {
		const screen = render(Markdown, { content: '[a]\n\n[a]: b' });
		await expect.element(screen.container).to_equal_html('<p><a href="b">a</a></p>');
	});

	it('should support prototype poluting identifiers', async () => {
		const screen = render(Markdown, {
			content: '[][__proto__] [][constructor]\n\n[__proto__]: a\n[constructor]: b'
		});
		await expect
			.element(screen.container)
			.to_equal_html('<p><a href="a"></a> <a href="b"></a></p>');
	});

	it('should support duplicate definitions', async () => {
		const screen = render(Markdown, { content: '[a][]\n\n[a]: b\n[a]: c' });
		await expect.element(screen.container).to_equal_html('<p><a href="b">a</a></p>');
	});

	it('should support a list (unordered) / list item', async () => {
		const screen = render(Markdown, { content: '* a' });
		await expect.element(screen.container).to_equal_html('<ul>\n<li>a</li>\n</ul>');
	});

	it('should support a list (ordered) / list item', async () => {
		const screen = render(Markdown, { content: '1. a' });
		await expect.element(screen.container).to_equal_html('<ol>\n<li>a</li>\n</ol>');
	});

	it('should support a paragraph', async () => {
		const screen = render(Markdown, { content: 'a' });
		await expect.element(screen.container).to_equal_html('<p>a</p>');
	});

	it('should support a strong', async () => {
		const screen = render(Markdown, { content: '**a**' });
		await expect.element(screen.container).to_equal_html('<p><strong>a</strong></p>');
	});

	it('should support a table (GFM)', async () => {
		const screen = render(Markdown, {
			content: '| a |\n| - |\n| b |',
			remarkPlugins: [remark_gfm]
		});
		await expect
			.element(screen.container)
			.to_equal_html(
				'<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>b</td></tr></tbody></table>'
			);
	});

	it('should support a table (GFM; w/ align)', async () => {
		const screen = render(Markdown, {
			content: '| a | b | c | d |\n| :- | :-: | -: | - |',
			remarkPlugins: [remark_gfm]
		});
		await expect
			.element(screen.container)
			.to_equal_html(
				'<table><thead><tr><th style="text-align: left;">a</th><th style="text-align: center;">b</th><th style="text-align: right;">c</th><th>d</th></tr></thead></table>'
			);
	});

	it('should support a thematic break', async () => {
		const screen = render(Markdown, { content: '***' });
		await expect.element(screen.container).to_equal_html('<hr>');
	});

	it('should support an absolute path', async () => {
		const screen = render(Markdown, { content: '[](/a)' });
		await expect.element(screen.container).to_equal_html('<p><a href="/a"></a></p>');
	});

	it('should support an absolute URL', async () => {
		const screen = render(Markdown, { content: '[](http://a.com)' });
		await expect.element(screen.container).to_equal_html('<p><a href="http://a.com"></a></p>');
	});

	it('should support a URL w/ uppercase protocol', async () => {
		const screen = render(Markdown, { content: '[](HTTPS://A.COM)' });
		await expect.element(screen.container).to_equal_html('<p><a href="HTTPS://A.COM"></a></p>');
	});

	it('should make a `javascript:` URL safe', async () => {
		const screen = render(Markdown, { content: '[](javascript:alert(1))' });
		await expect.element(screen.container).to_equal_html('<p><a href=""></a></p>');
	});

	it('should make a `vbscript:` URL safe', async () => {
		const screen = render(Markdown, { content: '[](vbscript:alert(1))' });
		await expect.element(screen.container).to_equal_html('<p><a href=""></a></p>');
	});

	it('should make a `VBSCRIPT:` URL safe', async () => {
		const screen = render(Markdown, { content: '[](VBSCRIPT:alert(1))' });
		await expect.element(screen.container).to_equal_html('<p><a href=""></a></p>');
	});

	it('should make a `file:` URL safe', async () => {
		const screen = render(Markdown, { content: '[](file:///etc/passwd)' });
		await expect.element(screen.container).to_equal_html('<p><a href=""></a></p>');
	});

	it('should allow an empty URL', async () => {
		const screen = render(Markdown, { content: '[]()' });
		await expect.element(screen.container).to_equal_html('<p><a href=""></a></p>');
	});

	it('should support search (`?`) in a URL', async () => {
		const screen = render(Markdown, { content: '[](a?javascript:alert(1))' });
		await expect
			.element(screen.container)
			.to_equal_html('<p><a href="a?javascript:alert(1)"></a></p>');
	});

	it('should support hash (`&`) in a URL', async () => {
		const screen = render(Markdown, { content: '[](a?b&c=d)' });
		await expect.element(screen.container).to_equal_html('<p><a href="a?b&amp;c=d"></a></p>');
	});

	it('should support hash (`#`) in a URL', async () => {
		const screen = render(Markdown, { content: '[](a#javascript:alert(1))' });
		await expect
			.element(screen.container)
			.to_equal_html('<p><a href="a#javascript:alert(1)"></a></p>');
	});

	it('should support `urlTransform` (`href` on `a`)', async () => {
		const screen = render(Markdown, {
			content: '[a](https://b.com "c")',
			urlTransform: function (url, key, node) {
				expect(url).toBe('https://b.com');
				expect(key).toBe('href');
				expect(node.tagName).toBe('a');
				return '';
			}
		});
		await expect.element(screen.container).to_equal_html('<p><a href="" title="c">a</a></p>');
	});

	it('should support `urlTransform` w/ empty URLs', async () => {
		const screen = render(Markdown, {
			content: '[]()',
			urlTransform: function (url, key, node) {
				expect(url).toBe('');
				expect(key).toBe('href');
				expect(node.tagName).toBe('a');
				return '';
			}
		});
		await expect.element(screen.container).to_equal_html('<p><a href=""></a></p>');
	});

	it('should support `urlTransform` (`src` on `img`)', async () => {
		const screen = render(Markdown, {
			content: '![a](https://b.com "c")',
			urlTransform: function (url, key, node) {
				expect(url).toBe('https://b.com');
				expect(key).toBe('src');
				expect(node.tagName).toBe('img');
				return undefined;
			}
		});
		await expect.element(screen.container).to_equal_html('<p><img alt="a" title="c"/></p>');
	});

	it('should support `skipHtml`', async () => {
		const screen = render(Markdown, { content: 'a<i>b</i>c', skipHtml: true });
		await expect.element(screen.container).to_equal_html('<p>abc</p>');
	});

	it('should support `remarkRehypeOptions`', async () => {
		const screen = render(Markdown, {
			content: '[^x]\n\n[^x]: a\n\n',
			remarkPlugins: [remark_gfm],
			remarkRehypeOptions: { clobberPrefix: 'b-' }
		});
		await expect
			.element(screen.container)
			.to_equal_html(
				'<p><sup><a href="#b-fn-x" id="b-fnref-x" data-footnote-ref="true" aria-describedby="footnote-label">1</a></sup></p>\n<section data-footnotes="true" class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2>\n<ol>\n<li id="b-fn-x">\n<p>a <a href="#b-fnref-x" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>\n</li>\n</ol>\n</section>'
			);
	});

	it('should support custom renderers', async () => {
		const screen = render(Markdown, { content: '# a', h1: 'h2' });
		await expect.element(screen.container).to_equal_html('<h2>a</h2>');
	});

	it('should support custom renderers as snippets', async () => {
		const [promise, renderer] = create_children_element_renderer();
		const screen = render(Markdown, {
			content: 'a',
			p: renderer
		});

		await promise;
		await expect.element(screen.container).to_equal_html('<p>a</p>');
	});

	it('should support `components` (headings)', async () => {
		let calls = 0;
		const [promise, renderer] = create_children_element_renderer(async (props) => {
			const { node } = props;
			expect(node).toBeDefined();
			expect(node?.tagName === 'h1' || node?.tagName === 'h2').toBe(true);
			calls++;
		});

		const screen = render(Markdown, {
			content: '# a\n## b',
			h1: renderer,
			h2: renderer
		});

		await promise;
		await expect.element(screen.container).to_equal_html('<h1>a</h1>\n<h2>b</h2>');
		expect(calls).toBe(2);
	});

	it('should support `components` (code)', async () => {
		let calls = 0;
		const [promise, renderer] = create_children_element_renderer(async (props) => {
			const { node } = props;
			expect(node).toBeDefined();
			expect(node?.tagName).toBe('code');
			calls++;
		});

		const screen = render(Markdown, {
			content: '```\na\n```\n\n\tb\n\n`c`',
			code: renderer
		});

		await promise;
		await expect
			.element(screen.container)
			.to_equal_html(
				'<pre><code>a\n</code></pre>\n<pre><code>b\n</code></pre>\n<p><code>c</code></p>'
			);
		expect(calls).toBe(3);
	});

	it('should support `components` (li)', async () => {
		let calls = 0;
		const [promise, renderer] = create_children_element_renderer(async (props) => {
			const { node } = props;
			expect(node).toBeDefined();
			expect(node?.tagName).toBe('li');
			calls++;
		});

		const screen = render(Markdown, {
			content: '* [x] a\n1. b',
			li: renderer,
			remarkPlugins: [remark_gfm]
		});

		await promise;
		await expect
			.element(screen.container)
			.to_equal_html(
				'<ul class="contains-task-list">\n<li class="task-list-item"><input type="checkbox" disabled=""/> a</li>\n</ul>\n<ol>\n<li>b</li>\n</ol>'
			);
		expect(calls).toBe(2);
	});

	it('should support `components` (ol)', async () => {
		let calls = 0;
		const [promise, renderer] = create_children_element_renderer(async (props) => {
			const { node } = props;
			expect(node).toBeDefined();
			expect(node?.tagName).toBe('ol');
			calls++;
		});

		const screen = render(Markdown, {
			content: '1. a',
			ol: renderer
		});

		await promise;
		await expect.element(screen.container).to_equal_html('<ol>\n<li>a</li>\n</ol>');
		expect(calls).toBe(1);
	});

	it('should support `components` (ul)', async () => {
		let calls = 0;
		const [promise, renderer] = create_children_element_renderer(async (props) => {
			const { node } = props;
			expect(node).toBeDefined();
			expect(node?.tagName).toBe('ul');
			calls++;
		});

		const screen = render(Markdown, {
			content: '* a',
			ul: renderer
		});

		await promise;
		await expect.element(screen.container).to_equal_html('<ul>\n<li>a</li>\n</ul>');
		expect(calls).toBe(1);
	});

	it('should support `components` (tr)', async () => {
		let calls = 0;
		const [promise, renderer] = create_children_element_renderer(async (props) => {
			const { node } = props;
			expect(node).toBeDefined();
			expect(node?.tagName).toBe('tr');
			calls++;
		});

		const screen = render(Markdown, {
			content: '|a|\n|-|\n|b|',
			tr: renderer,
			remarkPlugins: [remark_gfm]
		});

		await promise;
		await expect
			.element(screen.container)
			.to_equal_html(
				'<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>b</td></tr></tbody></table>'
			);
		expect(calls).toBe(2);
	});

	it('should support plugins (`remark-gfm`)', async () => {
		const screen = render(Markdown, {
			content: 'a ~b~ c',
			remarkPlugins: [remark_gfm]
		});
		await expect.element(screen.container).to_equal_html('<p>a <del>b</del> c</p>');
	});

	it('should support `components` (td, th)', async () => {
		let tdCalls = 0;
		let thCalls = 0;
		const [tdPromise, tdRenderer] = create_children_element_renderer(async (props) => {
			const { node } = props;
			expect(node).toBeDefined();
			expect(node?.tagName).toBe('td');
			tdCalls++;
		});
		const [thPromise, thRenderer] = create_children_element_renderer(async (props) => {
			const { node } = props;
			expect(node).toBeDefined();
			expect(node?.tagName).toBe('th');
			thCalls++;
		});

		const screen = render(Markdown, {
			content: '|a|\n|-|\n|b|',
			td: tdRenderer,
			th: thRenderer,
			remarkPlugins: [remark_gfm]
		});

		await Promise.all([tdPromise, thPromise]);
		await expect
			.element(screen.container)
			.to_equal_html(
				'<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>b</td></tr></tbody></table>'
			);
		expect(tdCalls).toBe(1);
		expect(thCalls).toBe(1);
	});

	it('should pass `node` to components', async () => {
		let calls = 0;
		const [promise, renderer] = create_children_element_renderer(async (props) => {
			const { node } = props;
			expect(node).toEqual({
				type: 'element',
				tagName: 'em',
				properties: {},
				children: [
					{
						type: 'text',
						value: 'a',
						position: {
							start: { line: 1, column: 2, offset: 1 },
							end: { line: 1, column: 3, offset: 2 }
						}
					}
				],
				position: {
					start: { line: 1, column: 1, offset: 0 },
					end: { line: 1, column: 4, offset: 3 }
				}
			});
			calls++;
		});

		const screen = render(Markdown, {
			content: '*a*',
			em: renderer
		});

		await promise;
		await expect.element(screen.container).to_equal_html('<p><em>a</em></p>');
		expect(calls).toBe(1);
	});

	it('should support aria properties', async () => {
		function plugin() {
			return function (tree: Parents) {
				tree.children.unshift({
					type: 'element',
					tagName: 'input',
					properties: { id: 'a', ariaDescribedBy: 'b', required: true },
					children: []
				});
			};
		}

		const screen = render(Markdown, {
			content: 'c',
			rehypePlugins: [plugin]
		});
		await expect
			.element(screen.container)
			.to_equal_html('<input id="a" aria-describedby="b" required=""/><p>c</p>');
	});

	it('should support data properties', async () => {
		function plugin() {
			return function (tree: Parents) {
				tree.children.unshift({
					type: 'element',
					tagName: 'i',
					properties: { dataWhatever: 'a', dataIgnoreThis: undefined },
					children: []
				});
			};
		}

		const screen = render(Markdown, {
			content: 'b',
			rehypePlugins: [plugin]
		});
		await expect.element(screen.container).to_equal_html('<i data-whatever="a"></i><p>b</p>');
	});

	it('should support comma separated properties', async () => {
		function plugin() {
			return function (tree: Parents) {
				tree.children.unshift({
					type: 'element',
					tagName: 'i',
					properties: { accept: ['a', 'b'] },
					children: []
				});
			};
		}

		const screen = render(Markdown, {
			content: 'c',
			rehypePlugins: [plugin]
		});
		await expect.element(screen.container).to_equal_html('<i accept="a, b"></i><p>c</p>');
	});

	it('should support `style` properties', async () => {
		function plugin() {
			return function (tree: Parents) {
				tree.children.unshift({
					type: 'element',
					tagName: 'i',
					properties: { style: 'color: red; font-weight: bold' },
					children: []
				});
			};
		}

		const screen = render(Markdown, {
			content: 'a',
			rehypePlugins: [plugin]
		});
		await expect
			.element(screen.container)
			.to_equal_html('<i style="color: red; font-weight: bold;"></i><p>a</p>');
	});

	it('should support broken `style` properties', async () => {
		function plugin() {
			return function (tree: Parents) {
				tree.children.unshift({
					type: 'element',
					tagName: 'i',
					properties: { style: 'broken' },
					children: []
				});
			};
		}

		const screen = render(Markdown, {
			content: 'a',
			rehypePlugins: [plugin]
		});
		await expect.element(screen.container).to_equal_html('<i style=""></i><p>a</p>');
	});

	it.only('should support SVG elements', async () => {
		function plugin() {
			return function (tree: Parents) {
				tree.children.unshift({
					type: 'element',
					tagName: 'svg',
					properties: {
						viewBox: '0 0 500 500',
						xmlns: 'http://www.w3.org/2000/svg'
					},
					children: [
						{
							type: 'element',
							tagName: 'title',
							properties: {},
							children: [{ type: 'text', value: 'SVG `<circle>` element' }]
						},
						{
							type: 'element',
							tagName: 'circle',
							properties: { cx: 120, cy: 120, r: 100 },
							children: []
						},
						{
							type: 'element',
							tagName: 'path',
							properties: { strokeMiterLimit: -1 },
							children: []
						}
					]
				});
			};
		}

		const screen = render(Markdown, {
			content: 'a',
			rehypePlugins: [plugin]
		});
		await expect
			.element(screen.container)
			.to_equal_html(
				'<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"><title>SVG `&lt;circle&gt;` element</title><circle cx="120" cy="120" r="100"></circle><path stroke-miterlimit="-1"></path></svg><p>a</p>'
			);
	});

	it('should support comments (ignore them)', async () => {
		function plugin() {
			return function (tree: Parents) {
				tree.children.unshift({ type: 'comment', value: 'things!' });
			};
		}

		const screen = render(Markdown, {
			content: 'a',
			rehypePlugins: [plugin]
		});
		await expect.element(screen.container).to_equal_html('<p>a</p>');
	});

	it('should not fail on a plugin replacing `root`', async () => {
		function plugin() {
			return function () {
				return { type: 'comment', value: 'things!' };
			};
		}

		const screen = render(Markdown, {
			content: 'a',
			rehypePlugins: [plugin]
		});
		await expect.element(screen.container).to_equal_html('');
	});

	it('should support table cells w/ style', async () => {
		function plugin() {
			return function (tree: Parents) {
				// Simple tree traversal to find th elements
				function visit(node: Nodes) {
					if (node.type === 'element' && node.tagName === 'th') {
						node.properties = { ...node.properties, style: 'color: red' };
					}
					if ('children' in node) {
						node.children.forEach(visit);
					}
				}
				visit(tree);
			};
		}

		const screen = render(Markdown, {
			content: '| a  |\n| :- |',
			remarkPlugins: [remark_gfm],
			rehypePlugins: [plugin]
		});
		await expect
			.element(screen.container)
			.to_equal_html(
				'<table><thead><tr><th style="color: red; text-align: left;">a</th></tr></thead></table>'
			);
	});
});
