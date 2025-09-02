import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Markdown from './Markdown.svelte';
import rehype_raw from 'rehype-raw';
import remark_gfm from 'remark-gfm';

describe('Markdown', () => {
	it('should support `null` as children', async () => {
		const screen = render(Markdown, { content: null });
		await expect.element(screen.container).to_equal_html('');
	});

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
});
