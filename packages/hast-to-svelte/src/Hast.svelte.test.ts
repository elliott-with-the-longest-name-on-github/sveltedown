import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Hast from './Hast.svelte';
import { h } from 'hastscript';

// This test file is minimal because this is pretty thoroughly tested in `sveltedown`.
// If there are ever any bugs we need to document, we can add more tests here.

describe('Hast', () => {
	it('should render a simple div', async () => {
		const { container } = render(Hast, {
			node: { type: 'root', children: [h('div', 'Hello, world!')] }
		});
		await expect.element(container).to_equal_html('<div>Hello, world!</div>');
	});
});
