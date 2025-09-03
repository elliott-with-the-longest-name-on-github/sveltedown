<script lang="ts">
	import type { HardenedOptions, Renderer, RendererArg } from './types.js';
	import Markdown from './Markdown.svelte';
	import { get_renderer } from './hast-to-svelte.js';

	let {
		defaultOrigin = '',
		allowedLinkPrefixes = [],
		allowedImagePrefixes = [],
		...options
	}: HardenedOptions = $props();

	// Only require defaultOrigin if we have specific prefixes (not wildcard only)
	const has_specific_link_prefixes = $derived(
		allowedLinkPrefixes.length && !allowedLinkPrefixes.every((p) => p === '*')
	);
	const has_specific_image_prefixes = $derived(
		allowedImagePrefixes.length && !allowedImagePrefixes.every((p) => p === '*')
	);

	function error_check() {
		if (!defaultOrigin && (has_specific_link_prefixes || has_specific_image_prefixes)) {
			throw new Error(
				'defaultOrigin is required when allowedLinkPrefixes or allowedImagePrefixes are provided'
			);
		}
	}

	error_check();
	$effect(error_check);

	const parse_url = (url: unknown): URL | null => {
		if (typeof url !== 'string') return null;
		try {
			// Try to parse as absolute URL first
			const url_object = new URL(url);
			return url_object;
		} catch (error) {
			// If that fails and we have a defaultOrigin, try with it
			if (defaultOrigin) {
				try {
					const url_object = new URL(url, defaultOrigin);
					return url_object;
				} catch (error) {
					return null;
				}
			}
			return null;
		}
	};

	const is_path_relative_url = (url: unknown): boolean => {
		if (typeof url !== 'string') return false;
		return url.startsWith('/');
	};

	const transform_url = (url: unknown, allowedPrefixes: string[]): string | null => {
		if (!url) return null;
		const parsed_url = parse_url(url);
		if (!parsed_url) return null;

		// Check for wildcard - allow all URLs
		if (allowedPrefixes.includes('*')) {
			const input_was_relative = is_path_relative_url(url);
			const url_string = parse_url(url);
			if (url_string) {
				if (input_was_relative) {
					return url_string.pathname + url_string.search + url_string.hash;
				}
				return url_string.href;
			}
			return null;
		}

		// If the input is path relative, we output a path relative URL as well,
		// however, we always run the same checks on an absolute URL and we
		// always rescronstruct the output from the parsed URL to ensure that
		// the output is always a valid URL.
		const input_was_relative = is_path_relative_url(url);
		const url_string = parse_url(url);
		if (
			url_string &&
			allowedPrefixes.some((prefix) => {
				const parsed_prefix = parse_url(prefix);
				if (!parsed_prefix) {
					return false;
				}
				if (parsed_prefix.origin !== url_string.origin) {
					return false;
				}
				return url_string.href.startsWith(parsed_prefix.href);
			})
		) {
			if (input_was_relative) {
				return url_string.pathname + url_string.search + url_string.hash;
			}
			return url_string.href;
		}
		return null;
	};
</script>

<Markdown {...options} {a} {img} />

{#snippet a(arg: RendererArg<'a'>)}
	{@const {
		props: { href, ...rest_props },
		children,
		node,
		...rest
	} = arg}
	{@const transformed_url = transform_url(href, allowedLinkPrefixes)}
	{#if transformed_url === null}
		<!-- TODO should probably be customizable -->
		<span class="text-gray-500" title="Blocked URL: {href}">{@render children?.()} [blocked]</span>
	{:else}
		{@const resolved_a = get_renderer(arg.tagName, options, arg) as unknown as Renderer<'a'>}
		{@render resolved_a({
			props: { ...rest_props, href: transformed_url, target: '_blank', rel: 'noopener noreferrer' },
			children,
			node,
			...rest
		})}
	{/if}
{/snippet}

{#snippet img(arg: RendererArg<'img'>)}
	{@const {
		props: { src, alt, ...rest_props },
		node,
		...rest
	} = arg}
	{@const transformed_url = transform_url(src, allowedImagePrefixes)}
	{#if transformed_url === null}
		<!-- TODO should probably be customizable -->
		<span
			class="inline-block bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded text-sm"
		>
			[Blocked image: {alt || 'No Description'}]
		</span>
	{:else}
		{@const resolved_img = get_renderer(arg.tagName, options, arg) as unknown as Renderer<'img'>}
		{@render resolved_img({
			props: { ...rest_props, src: transformed_url, alt },
			node,
			...rest
		})}
	{/if}
{/snippet}
