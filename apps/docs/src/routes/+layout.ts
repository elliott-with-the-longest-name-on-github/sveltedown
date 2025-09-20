import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';

export const prerender = true;

let highlighter: HighlighterCore;

export const load = async () => {
	highlighter ??= await createHighlighterCore({
		themes: [import('@shikijs/themes/github-light'), import('@shikijs/themes/github-dark')],
		langs: [
			import('@shikijs/langs/svelte'),
			import('@shikijs/langs/javascript'),
			import('@shikijs/langs/typescript'),
			import('@shikijs/langs/markdown')
		],
		engine: createOnigurumaEngine(() => import('shiki/wasm'))
	});

	return {
		highlighter
	};
};
