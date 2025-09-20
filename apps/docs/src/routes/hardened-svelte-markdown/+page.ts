export const load = async () => {
	return {
		initial_content
	};
};

const initial_content = `\
# A demo of \`@sejohnson/hardened-svelte-markdown\`

This library does everything \`@sejohnson/svelte-markdown\` does, while also ensuring that untrusted markdown does not contain images from and links to unexpected origins.

This is particularly important for markdown returned from LLMs in AI agents which might have been subject to prompt injection.

In addition to the options from the core library, this library adds:
- \`defaultOrigin\`: The default origin to use when resolving relative links and images.
- \`allowedLinkPrefixes\`: 
    - Array of URL prefixes that are allowed for links
    - Links not matching these prefixes will be blocked and shown as [blocked]
    - Use "*" to allow all URLs (disables filtering. However, javascript: and data: URLs are always disallowed)
    - Default: [] (blocks all links)
    - Example: ['https://github.com/', 'https://docs.example.com/'] or ['*']
- \`allowedImagePrefixes\`: 
    - Array of URL prefixes that are allowed for images
    - Images not matching these prefixes will be blocked and shown as placeholders
    - Use "*" to allow all URLs (disables filtering. However, javascript: and data: URLs are always disallowed)
    - Default: [] (blocks all images)
    - Example: ['https://via.placeholder.com/', '/'] or ['*']

The markdown you're seeing rendered to the right is configued as follows:

\`\`\`svelte
<script lang="ts">
	import { dev } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import DemoPage from '$lib/demo-page.svelte';
	import { Markdown } from '@sejohnson/hardened-svelte-markdown';

	let { data } = $props();

	const url = \`\${dev ? 'http://localhost:5173' : env.PUBLIC_VERCEL_URL}/hardened-svelte-markdown\`;
</script>

<DemoPage
	highlighter={data.highlighter}
	initial_content={data.initial_content}
	title="@sejohnson/hardened-svelte-markdown"
>
	{#snippet markdown({ content, rehypePlugins, remarkPlugins })}
		<Markdown
			{content}
			{rehypePlugins}
			{remarkPlugins}
			defaultOrigin={url}
			allowedLinkPrefixes={[url]}
		/>
	{/snippet}
</DemoPage>
\`\`\`

Here's how some links and images are or aren't rendered:
- [This will be rendered](https://hardened-svelte-markdown.vercel.app/hardened-svelte-markdown)
- [This will be rendered](https://hardened-svelte-markdown.vercel.app/hardened-svelte-markdown/subpath)
- [This will be blocked](https://github.com/)
- [This will be blocked](https://via.placeholder.com/150)
`;
