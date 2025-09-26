<script lang="ts">
	import remark_toc from 'remark-toc';
	import rehype_raw from 'rehype-raw';
	import remark_gfm from 'remark-gfm';
	import { type Options } from 'sveltedown';
	import rehypeShikiFromHighlighter from '@shikijs/rehype/core';
	import type { HighlighterCore } from 'shiki/core';
	import type { Snippet } from 'svelte';

	const {
		highlighter,
		initial_content,
		title,
		markdown
	}: {
		highlighter: HighlighterCore;
		initial_content: string;
		title: string;
		markdown: Snippet<
			[
				{
					content: string;
					rehypePlugins: Options['rehypePlugins'];
					remarkPlugins: Options['remarkPlugins'];
				}
			]
		>;
	} = $props();

	let gfm = $state(false);
	let raw = $state(false);

	let content = $derived(initial_content);
	const html = $derived(
		highlighter.codeToHtml(content, {
			lang: 'markdown',
			themes: { light: 'github-light', dark: 'github-dark' }
		})
	);

	function autoResize(_content: string) {
		return (element: HTMLTextAreaElement) => {
			if (element) {
				element.style.height = 'auto';
				element.style.height = element.scrollHeight + 'px';
			}
		};
	}
</script>

<div class="container">
	<h1 class="title">{title}</h1>
	<main>
		<form class="editor">
			<div class="checkbox-controls">
				<label>
					<input type="checkbox" bind:checked={gfm} />
					Use `remark-gfm` (to enable GFM)
				</label>
				<label>
					<input type="checkbox" bind:checked={raw} />
					Use `rehype-raw` (to enable HTML)
				</label>
			</div>
			<div class="editor-wrapper">
				<div class="syntax-highlight" aria-hidden="true">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html html}
				</div>
				<textarea
					name="markdown"
					id="markdown"
					spellcheck="false"
					bind:value={content}
					{@attach autoResize(content)}
				></textarea>
			</div>
		</form>
		<div class="markdown-body">
			{@render markdown({
				content,
				rehypePlugins: [
					[
						rehypeShikiFromHighlighter,
						highlighter,
						{ themes: { light: 'github-light', dark: 'github-dark' } }
					],
					...(raw ? [rehype_raw] : [])
				],
				remarkPlugins: [remark_toc, ...(gfm ? [remark_gfm] : [])]
			})}
		</div>
	</main>
</div>

<style>
	.title {
		font-family: 'GeistMono', monospace;
		text-align: left;
	}

	.container {
		width: 100dvw;
		height: 100dvh;
		display: grid;
		grid-template-rows: auto 1fr;
		grid-template-columns: 1fr 1fr;
		grid-template-areas:
			'header header'
			'editor result';
	}

	h1 {
		grid-area: header;
		margin: 0;
		padding: 1rem;
		background-color: #f5f5f5;
		border-bottom: 1px solid #ddd;
		text-align: center;
	}

	main {
		display: contents;
	}

	.editor {
		grid-area: editor;
		border-right: 1px solid #ddd;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.checkbox-controls {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 10;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.9);
		padding: 0.5rem;
		border-radius: 4px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		backdrop-filter: blur(4px);
	}

	.checkbox-controls label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 12px;
		color: #333;
		cursor: pointer;
		white-space: nowrap;
	}

	.checkbox-controls input[type='checkbox'] {
		margin: 0;
	}

	.editor-wrapper {
		position: relative;
		flex: 1;
		overflow: auto;
	}

	.syntax-highlight {
		display: contents;
	}

	.syntax-highlight :global(pre) {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		padding: 1rem;
		font-family: 'GeistMono', monospace;
		font-size: 14px;
		line-height: calc(1em + 1ex);
		white-space: pre-wrap;
		word-wrap: break-word;
		pointer-events: none;
		z-index: 1;
		box-sizing: border-box;
		min-height: 100%;
		margin: 0;
		overflow: hidden;
	}

	.editor textarea {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 2;
		box-sizing: border-box;
		border: none;
		outline: none;
		padding: 1rem;
		margin: 0;
		resize: none;
		font-family: 'GeistMono', monospace;
		font-size: 14px;
		line-height: calc(1em + 1ex);
		background: transparent;
		color: transparent;
		caret-color: black;
		min-height: 100%;
		overflow: hidden;
	}

	.markdown-body {
		grid-area: result;
		padding: 1rem;
		overflow-y: auto;
	}
</style>
