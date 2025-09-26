import { describe, it, expect } from 'vitest';
import { get_renderer } from './renderers.js';
import type { HTMLElements, Renderer } from './types.js';

describe('get_renderer', () => {
	it('should return the tag name associated with the renderer actually retrieved, not the one passed in', () => {
		const renderers = { h6: 'h5', h5: 'h4', h4: 'h3' };

		expect(
			get_renderer('h6', renderers, 'sentinel' as unknown as Renderer<keyof HTMLElements>)
		).toEqual(['h3', 'sentinel']);
	});
});
