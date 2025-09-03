import type { Nodes as HastNodes } from 'hast';
import { CONTINUE, SKIP, visit, type BuildVisitor } from 'unist-util-visit';

export function harden(
	nodes: HastNodes,
	{
		defaultOrigin = '',
		allowedLinkPrefixes = [],
		allowedImagePrefixes = []
	}: {
		defaultOrigin?: string;
		allowedLinkPrefixes?: string[];
		allowedImagePrefixes?: string[];
	}
): HastNodes {
	// Only require defaultOrigin if we have specific prefixes (not wildcard only)
	const has_specific_link_prefixes =
		allowedLinkPrefixes.length && !allowedLinkPrefixes.every((p) => p === '*');
	const has_specific_image_prefixes =
		allowedImagePrefixes.length && !allowedImagePrefixes.every((p) => p === '*');

	if (!defaultOrigin && (has_specific_link_prefixes || has_specific_image_prefixes)) {
		throw new Error(
			'defaultOrigin is required when allowedLinkPrefixes or allowedImagePrefixes are provided'
		);
	}

	const visitor = create_visitor(defaultOrigin, allowedLinkPrefixes, allowedImagePrefixes);
	visit(nodes, visitor);
	return nodes;
}

function parse_url(url: unknown, default_origin: string): URL | null {
	if (typeof url !== 'string') return null;
	try {
		// Try to parse as absolute URL first
		const url_object = new URL(url);
		return url_object;
	} catch {
		// If that fails and we have a defaultOrigin, try with it
		if (default_origin) {
			try {
				const url_object = new URL(url, default_origin);
				return url_object;
			} catch {
				return null;
			}
		}
		return null;
	}
}

function is_path_relative_url(url: unknown): boolean {
	if (typeof url !== 'string') return false;
	return url.startsWith('/');
}

function transform_url(
	url: unknown,
	allowedPrefixes: string[],
	default_origin: string
): string | null {
	if (!url) return null;
	const parsed_url = parse_url(url, default_origin);
	if (!parsed_url) return null;

	// Check for wildcard - allow all URLs
	if (allowedPrefixes.includes('*')) {
		const input_was_relative = is_path_relative_url(url);
		const url_string = parse_url(url, default_origin);
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
	const url_string = parse_url(url, default_origin);
	if (
		url_string &&
		allowedPrefixes.some((prefix) => {
			const parsed_prefix = parse_url(prefix, default_origin);
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
}

const create_visitor = (
	default_origin: string,
	allowed_link_prefixes: string[],
	allowed_image_prefixes: string[]
): BuildVisitor<HastNodes> => {
	const visitor: BuildVisitor<HastNodes> = (node, index, parent) => {
		if (node.type !== 'element') {
			return CONTINUE;
		}

		if (node.tagName === 'a') {
			const transformed_url = transform_url(
				node.properties.href,
				allowed_link_prefixes,
				default_origin
			);
			if (transformed_url === null) {
				for (const child of node.children) {
					visit(child, visitor);
				}
				if (parent && typeof index === 'number') {
					parent.children[index] = {
						type: 'element',
						tagName: 'span',
						properties: {
							title: 'Blocked URL: ' + String(node.properties.href),
							class: 'text-gray-500'
						},
						children: [
							...node.children,
							{
								type: 'text',
								value: ' [blocked]'
							}
						]
					};
				}
				return SKIP;
			} else {
				node.properties.href = transformed_url;
				node.properties.target = '_blank';
				node.properties.rel = 'noopener noreferrer';
				return CONTINUE;
			}
		}

		if (node.tagName === 'img') {
			const transformed_url = transform_url(
				node.properties.src,
				allowed_image_prefixes,
				default_origin
			);
			if (transformed_url === null) {
				for (const child of node.children) {
					visit(child, visitor);
				}
				if (parent && typeof index === 'number') {
					parent.children[index] = {
						type: 'element',
						tagName: 'span',
						properties: {
							class:
								'inline-block bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded text-sm'
						},
						children: [
							{
								type: 'text',
								value: 'Blocked image: ' + String(node.properties.alt || 'No Description')
							}
						]
					};
				}
				return SKIP;
			} else {
				node.properties.src = transformed_url;
				return CONTINUE;
			}
		}

		return CONTINUE;
	};

	return visitor;
};
