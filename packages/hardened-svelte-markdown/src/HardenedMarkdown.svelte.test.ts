import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import HardenedMarkdown from './HardenedMarkdown.svelte';

describe('HardenedMarkdown', () => {
	// Helper function to test blocked URLs concisely
	const testBlockedUrls = (
		urlType: 'link' | 'image',
		badUrls: string[],
		allowedPrefixes: string[],
		defaultOrigin: string
	) => {
		it.each(badUrls)(`blocks ${urlType} with URL: %s`, async (url) => {
			const content = urlType === 'link' ? `[Test](${url})` : `![Test](${url})`;

			const screen = render(HardenedMarkdown, {
				defaultOrigin,
				allowedLinkPrefixes: urlType === 'link' ? allowedPrefixes : [],
				allowedImagePrefixes: urlType === 'image' ? allowedPrefixes : [],
				content
			});

			if (urlType === 'link') {
				await expect.element(screen.getByRole('link')).not.toBeInTheDocument();
				await expect.element(screen.getByText('Test [blocked]')).toBeInTheDocument();
			} else {
				await expect.element(screen.getByRole('img')).not.toBeInTheDocument();
				await expect.element(screen.getByText('[Blocked image: Test]')).toBeInTheDocument();
			}
		});
	};

	describe('defaultOrigin requirement', () => {
		it('throws error when allowedLinkPrefixes provided without defaultOrigin', async () => {
			expect(() => {
				render(HardenedMarkdown, {
					allowedLinkPrefixes: ['https://github.com/'],
					content: '[Test](https://github.com)'
				});
			}).toThrow(
				'defaultOrigin is required when allowedLinkPrefixes or allowedImagePrefixes are provided'
			);
		});

		it('throws error when allowedImagePrefixes provided without defaultOrigin', async () => {
			expect(() => {
				render(HardenedMarkdown, {
					allowedImagePrefixes: ['https://example.com/'],
					content: '![Test](https://example.com/image.jpg)'
				});
			}).toThrow(
				'defaultOrigin is required when allowedLinkPrefixes or allowedImagePrefixes are provided'
			);
		});

		it('does not throw when no prefixes are provided', async () => {
			expect(() => {
				render(HardenedMarkdown, {
					content: '[Test](https://github.com)'
				});
			}).not.toThrow();
		});
	});

	describe('URL transformation', () => {
		it('preserves relative URLs when input is relative and allowed', async () => {
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: ['https://example.com/'],
				content: '[Test](/path/to/page?query=1#hash)'
			});

			const link = screen.getByRole('link');
			await expect.element(link).toHaveAttribute('href', '/path/to/page?query=1#hash');
		});

		it('returns absolute URL when input is absolute and allowed', async () => {
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: ['https://github.com/'],
				content: '[Test](https://github.com/user/repo)'
			});

			const link = screen.getByRole('link');
			await expect.element(link).toHaveAttribute('href', 'https://github.com/user/repo');
		});

		it('correctly resolves relative URLs against defaultOrigin for validation', async () => {
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://trusted.com',
				allowedLinkPrefixes: ['https://trusted.com/'],
				content: '[Test](/api/data)'
			});

			const link = screen.getByRole('link');
			await expect.element(link).toHaveAttribute('href', '/api/data');
		});

		it('blocks relative URLs that resolve to disallowed origins', async () => {
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://untrusted.com',
				allowedLinkPrefixes: ['https://trusted.com/'],
				content: '[Test](/api/data)'
			});

			await expect.element(screen.getByRole('link')).not.toBeInTheDocument();
			await expect.element(screen.getByText('Test [blocked]')).toBeInTheDocument();
		});

		it('handles protocol-relative URLs', async () => {
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: ['https://cdn.example.com/'],
				content: '[Test](//cdn.example.com/resource)'
			});

			const link = screen.getByRole('link');
			// Protocol-relative URLs become relative paths when input was relative
			await expect.element(link).toHaveAttribute('href', '/resource');
		});

		it('normalizes URLs to prevent bypasses', async () => {
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: ['https://github.com/'],
				content: '[Test](https://github.com/../../../evil.com)'
			});

			// URL normalization resolves to https://github.com/evil.com which is allowed
			// since it starts with https://github.com/
			const link = screen.getByRole('link');
			await expect.element(link).toHaveAttribute('href', 'https://github.com/evil.com');
		});
	});

	describe('Bad URL cases - Links', () => {
		const badLinkUrls = [
			'javascript:alert("XSS")',
			'data:text/html,<script>alert("XSS")</script>',
			'vbscript:msgbox("XSS")',
			'file:///etc/passwd',
			'about:blank',
			'blob:https://example.com/uuid',
			'mailto:user@example.com',
			'tel:+1234567890',
			'ftp://ftp.example.com/file',
			'../../../etc/passwd',
			'//evil.com/malware',
			'https://evil.com@github.com',
			'https://github.com.evil.com',
			'https://github.com%2e%2e%2f%2e%2e%2fevil.com',
			'https://github.com\\.evil.com',
			'https://github.com%00.evil.com',
			'https://github.com%E2%80%8B.evil.com', // Zero-width space
			'\x00javascript:alert(1)',
			' javascript:alert(1)',
			'javascript\x00:alert(1)',
			'jav&#x61;script:alert(1)',
			'jav&#97;script:alert(1)'
		];

		testBlockedUrls('link', badLinkUrls, ['https://github.com/'], 'https://example.com');

		testBlockedUrls('link', badLinkUrls, ['https://github.com'], 'https://example.com');
	});

	describe('Bad URL cases - Images', () => {
		const badImageUrls = [
			'javascript:void(0)',
			'vbscript:execute',
			'file:///etc/passwd',
			'blob:https://example.com/uuid',
			'../../../sensitive.jpg',
			'//evil.com/tracker.gif',
			'https://evil.com@trusted.com/image.jpg',
			'https://trusted.com.evil.com/image.jpg',
			'\x00javascript:void(0)'
		];

		testBlockedUrls('image', badImageUrls, ['https://trusted.com/'], 'https://example.com');
	});

	describe('Edge cases with malformed URLs', () => {
		it('handles null href gracefully', async () => {
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				content: '[Test]()'
			});
			await expect.element(screen.getByText('Test [blocked]')).toBeInTheDocument();
		});

		it('handles undefined src gracefully', async () => {
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				content: '![Test]()'
			});
			await expect.element(screen.getByText('[Blocked image: Test]')).toBeInTheDocument();
		});

		it('handles numeric URL inputs', async () => {
			const markdown = '[Test](123)'; // Number as URL becomes relative path
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: ['https://example.com/'],
				content: markdown
			});
			// Numeric URLs resolve to relative paths like /123 which become https://example.com/123
			const link = screen.getByRole('link');
			await expect.element(link).toHaveAttribute('href', 'https://example.com/123');
		});

		it('handles URLs with unicode characters', async () => {
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: ['https://example.com/'],
				content: '[Test](https://example.com/路径/文件)'
			});

			const link = screen.getByRole('link');
			await expect
				.element(link)
				.toHaveAttribute('href', 'https://example.com/%E8%B7%AF%E5%BE%84/%E6%96%87%E4%BB%B6');
		});

		it('handles extremely long URLs', async () => {
			const longPath = 'a'.repeat(10000);
			const markdown = `[Test](https://example.com/${longPath})`;

			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: ['https://example.com/'],
				content: markdown
			});

			const link = screen.getByRole('link');
			await expect.element(link).toHaveAttribute('href', `https://example.com/${longPath}`);
		});
	});

	describe('Basic markdown rendering', () => {
		it('renders headings correctly', async () => {
			const screen = render(HardenedMarkdown, {
				content: '# Heading 1\n## Heading 2'
			});

			await expect
				.element(screen.getByRole('heading', { level: 1 }))
				.toHaveTextContent('Heading 1');
			await expect
				.element(screen.getByRole('heading', { level: 2 }))
				.toHaveTextContent('Heading 2');
		});

		it('renders paragraphs and text formatting', async () => {
			const screen = render(HardenedMarkdown, {
				content: 'This is **bold** and this is *italic*'
			});

			await expect.element(screen.getByText('bold')).toBeInTheDocument();
			await expect.element(screen.getByText('italic')).toBeInTheDocument();
		});

		it('renders lists correctly', async () => {
			const markdown = `
- Item 1
- Item 2

1. First
2. Second
      `;

			const screen = render(HardenedMarkdown, { content: markdown });

			await expect.element(screen.getByText('Item 1')).toBeInTheDocument();
			await expect.element(screen.getByText('Item 2')).toBeInTheDocument();
			await expect.element(screen.getByText('First')).toBeInTheDocument();
			await expect.element(screen.getByText('Second')).toBeInTheDocument();
		});

		it('renders code blocks', async () => {
			const screen = render(HardenedMarkdown, {
				content: `\`inline code\`

\`\`\`
block code
\`\`\``
			});

			await expect.element(screen.getByText('inline code')).toBeInTheDocument();
		});
	});

	describe('Security properties - Links', () => {
		it('blocks all links when no prefixes are allowed', async () => {
			const markdown = '[GitHub](https://github.com)';
			const screen = render(HardenedMarkdown, { content: markdown });

			await expect.element(screen.getByRole('link')).not.toBeInTheDocument();
			await expect.element(screen.getByText('GitHub [blocked]')).toBeInTheDocument();
		});

		it('blocks all links when empty allowedLinkPrefixes array is provided', async () => {
			const markdown = '[GitHub](https://github.com)';
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: [],
				content: markdown
			});

			await expect.element(screen.getByRole('link')).not.toBeInTheDocument();
			await expect.element(screen.getByText('GitHub [blocked]')).toBeInTheDocument();
		});

		it('allows links with allowed prefixes', async () => {
			const markdown = '[GitHub](https://github.com/user/repo)';
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: ['https://github.com/'],
				content: markdown
			});

			const link = screen.getByRole('link');
			await expect.element(link).toHaveAttribute('href', 'https://github.com/user/repo');
			await expect.element(link).toHaveAttribute('target', '_blank');
			await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer');
		});

		it('blocks links that do not match allowed prefixes', async () => {
			const markdown = `
[Allowed](https://github.com/repo)
[Blocked](https://evil.com/malware)
      `;

			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: ['https://github.com/'],
				content: markdown
			});

			await expect.element(screen.getByRole('link')).toHaveTextContent('Allowed');
			await expect.element(screen.getByText('Blocked [blocked]')).toBeInTheDocument();
		});

		it('handles multiple allowed prefixes', async () => {
			const markdown = `
[GitHub](https://github.com/repo)
[Docs](https://docs.example.com/page)
[Website](https://www.example.com/)
[Blocked](https://malicious.com)
      `;

			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: [
					'https://github.com/',
					'https://docs.example.com',
					'https://www.example.com'
				],
				content: markdown
			});

			await Promise.all([
				expect
					.element(screen.getByRole('link', { name: 'GitHub' }))
					.toHaveAttribute('href', 'https://github.com/repo'),
				expect
					.element(screen.getByRole('link', { name: 'Docs' }))
					.toHaveAttribute('href', 'https://docs.example.com/page'),
				expect
					.element(screen.getByRole('link', { name: 'Website' }))
					.toHaveAttribute('href', 'https://www.example.com/')
			]);
			await expect.element(screen.getByText('Blocked [blocked]')).toBeInTheDocument();
		});
	});

	describe('Security properties - Images', () => {
		it('blocks all images when no prefixes are allowed', async () => {
			const markdown = '![Alt text](https://example.com/image.jpg)';
			const screen = render(HardenedMarkdown, { content: markdown });

			await expect.element(screen.getByRole('img')).not.toBeInTheDocument();
			await expect.element(screen.getByText('[Blocked image: Alt text]')).toBeInTheDocument();
		});

		it('blocks all images when empty allowedImagePrefixes array is provided', async () => {
			const markdown = '![Alt text](https://example.com/image.jpg)';
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedImagePrefixes: [],
				content: markdown
			});

			await expect.element(screen.getByRole('img')).not.toBeInTheDocument();
			await expect.element(screen.getByText('[Blocked image: Alt text]')).toBeInTheDocument();
		});

		it('allows images with allowed prefixes', async () => {
			const markdown = '![Placeholder](https://via.placeholder.com/150)';
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedImagePrefixes: ['https://via.placeholder.com/'],
				content: markdown
			});

			const img = screen.getByRole('img');
			await expect.element(img).toHaveAttribute('src', 'https://via.placeholder.com/150');
			await expect.element(img).toHaveAttribute('alt', 'Placeholder');
		});

		it('blocks images that do not match allowed prefixes', async () => {
			const markdown = `
![Allowed](https://via.placeholder.com/150)
![Blocked](https://evil.com/malware.jpg)
      `;

			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedImagePrefixes: ['https://via.placeholder.com/'],
				content: markdown
			});

			await expect.element(screen.getByRole('img')).toHaveAttribute('alt', 'Allowed');
			await expect.element(screen.getByText('[Blocked image: Blocked]')).toBeInTheDocument();
		});

		it('handles images without alt text', async () => {
			const markdown = '![](https://example.com/image.jpg)';
			const screen = render(HardenedMarkdown, { content: markdown });

			await expect.element(screen.getByText('[Blocked image: No Description]')).toBeInTheDocument();
		});

		it('allows local images with correct origin', async () => {
			const markdown = '![Logo](/logo.png)';
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedImagePrefixes: ['https://example.com/'],
				content: markdown
			});

			const img = screen.getByRole('img');
			await expect.element(img).toHaveAttribute('src', '/logo.png');
		});

		it('transforms relative image URLs correctly', async () => {
			const markdown = '![Image](/images/test.jpg?v=1#section)';
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://trusted.com',
				allowedImagePrefixes: ['https://trusted.com/'],
				content: markdown
			});

			const img = screen.getByRole('img');
			await expect.element(img).toHaveAttribute('src', '/images/test.jpg?v=1#section');
		});
	});

	describe('Edge cases', () => {
		it('handles undefined href in links', async () => {
			const screen = render(HardenedMarkdown, { content: '[No href]()' });
			await expect.element(screen.getByText('No href [blocked]')).toBeInTheDocument();
		});

		it('handles undefined src in images', async () => {
			const screen = render(HardenedMarkdown, { content: '![No src]()' });
			await expect.element(screen.getByText('[Blocked image: No src]')).toBeInTheDocument();
		});

		it('handles complex markdown with mixed allowed/blocked content', async () => {
			const markdown = `
# My Document

This has [allowed link](https://github.com/repo) and [blocked link](https://bad.com).

![Allowed image](https://via.placeholder.com/100)
![Blocked image](https://external.com/img.jpg)

> Quote with [another link](https://docs.github.com)
      `;

			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: ['https://github.com/', 'https://docs.'],
				allowedImagePrefixes: ['https://via.placeholder.com/'],
				content: markdown
			});

			// Check allowed content
			await expect
				.element(screen.getByRole('link', { name: 'allowed link' }))
				.toHaveAttribute('href', 'https://github.com/repo');
			await expect.element(screen.getByRole('img')).toHaveAttribute('alt', 'Allowed image');

			// Check blocked content
			await expect.element(screen.getByText('blocked link [blocked]')).toBeInTheDocument();
			await expect.element(screen.getByText('[Blocked image: Blocked image]')).toBeInTheDocument();
		});
	});

	describe('Image transformation with relative URLs', () => {
		it('preserves query params and hash in relative image URLs', async () => {
			const markdown = '![Test](/img.jpg?size=large&v=2#section)';
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://trusted.com',
				allowedImagePrefixes: ['https://trusted.com/'],
				content: markdown
			});

			const img = screen.getByRole('img');
			await expect.element(img).toHaveAttribute('src', '/img.jpg?size=large&v=2#section');
		});

		it('blocks relative images when origin not allowed', async () => {
			const markdown = '![Test](/evil.jpg)';
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://untrusted.com',
				allowedImagePrefixes: ['https://trusted.com/'],
				content: markdown
			});

			await expect.element(screen.getByRole('img')).not.toBeInTheDocument();
			await expect.element(screen.getByText('[Blocked image: Test]')).toBeInTheDocument();
		});
	});

	describe('Specific bypass attempts', () => {
		it('correctly handles URLs that appear to bypass but actually resolve correctly', async () => {
			// This URL resolves to https://trusted.com/evil.com/image.jpg which should be allowed
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedImagePrefixes: ['https://trusted.com/'],
				content: '![Test](https://trusted.com/../../../evil.com/image.jpg)'
			});

			const img = screen.getByRole('img');
			await expect.element(img).toHaveAttribute('src', 'https://trusted.com/evil.com/image.jpg');
		});

		it.each(['[Test](javascript:alert)', '[Test](data:text)', '[Test](vbscript:)'])(
			'handles malformed URLs that contain invalid characters (%s)',
			async (markdown) => {
				const screen = render(HardenedMarkdown, {
					defaultOrigin: 'https://example.com',
					content: markdown
				});

				// These should be blocked
				await expect.element(screen.getByRole('link')).not.toBeInTheDocument();
			}
		);
	});
});

describe('URL prefix validation behavior', () => {
	it("requires complete valid URL prefixes (protocol-only prefixes don't work)", async () => {
		// This test demonstrates that "https://" alone doesn't work as a prefix
		const screen = render(HardenedMarkdown, {
			defaultOrigin: 'https://example.com',
			allowedLinkPrefixes: ['https://'],
			content: '[Test Link](https://github.com/test)'
		});

		// The link should be blocked because "https://" cannot be parsed as a valid URL
		await expect.element(screen.getByRole('link')).not.toBeInTheDocument();
		await expect.element(screen.getByText('Test Link [blocked]')).toBeInTheDocument();
	});

	it('works with complete domain prefixes', async () => {
		const screen = render(HardenedMarkdown, {
			defaultOrigin: 'https://example.com',
			allowedLinkPrefixes: ['https://github.com/'],
			content: '[Test Link](https://github.com/user/repo)'
		});

		const link = screen.getByRole('link');
		await expect.element(link).toHaveAttribute('href', 'https://github.com/user/repo');
	});

	it('requires origin and prefix to match for validation', async () => {
		const screen = render(HardenedMarkdown, {
			defaultOrigin: 'https://example.com',
			allowedLinkPrefixes: ['https://github.com/user/'],
			content: '[Allowed](https://github.com/user/repo) [Blocked](https://github.com/other/repo)'
		});

		// Only the first link should be rendered since it matches the prefix
		await expect
			.element(screen.getByRole('link', { name: 'Allowed' }))
			.toHaveAttribute('href', 'https://github.com/user/repo');
		await expect.element(screen.getByRole('link', { name: 'Blocked' })).not.toBeInTheDocument();
		await expect.element(screen.getByText('Blocked [blocked]')).toBeInTheDocument();
	});
});

describe('Wildcard prefix support', () => {
	it.each([
		{
			input: 'https://example.com/test',
			expected: 'https://example.com/test'
		},
		{
			input: 'https://malicious-site.com/tracker',
			expected: 'https://malicious-site.com/tracker'
		},
		{
			input: 'http://insecure-site.com/',
			expected: 'http://insecure-site.com/'
		},
		{
			input: 'https://any-domain.org/path',
			expected: 'https://any-domain.org/path'
		}
	])(
		"allows all links when allowedLinkPrefixes includes '*' (input: $input, expected: $expected)",
		async ({ input, expected }) => {
			const screen = render(HardenedMarkdown, {
				defaultOrigin: 'https://example.com',
				allowedLinkPrefixes: ['*'],
				content: `[Test Link](${input})`
			});

			const link = screen.getByRole('link');
			await expect.element(link).toHaveAttribute('href', expected);
			await expect.element(link).toHaveTextContent('Test Link');
		}
	);

	it.each([
		'https://example.com/image.png',
		'https://untrusted-site.com/tracker.gif',
		'http://insecure-images.com/photo.jpg',
		'https://any-cdn.net/asset.svg'
	])("allows all images when allowedImagePrefixes includes '*' (%s)", async (url) => {
		const screen = render(HardenedMarkdown, {
			defaultOrigin: 'https://example.com',
			allowedImagePrefixes: ['*'],
			content: `![Test Image](${url})`
		});

		const img = screen.getByRole('img');
		await expect.element(img).toHaveAttribute('src', url);
		await expect.element(img).toHaveAttribute('alt', 'Test Image');
	});

	it('handles relative URLs with wildcard prefix', async () => {
		const screen1 = render(HardenedMarkdown, {
			defaultOrigin: 'https://example.com',
			allowedLinkPrefixes: ['*'],
			content: '[Relative Link](/internal-page)'
		});

		await expect.element(screen1.getByRole('link')).toHaveAttribute('href', '/internal-page');
		screen1.unmount();

		const screen2 = render(HardenedMarkdown, {
			defaultOrigin: 'https://example.com',
			allowedImagePrefixes: ['*'],
			content: '![Relative Image](/images/logo.png)'
		});

		await expect.element(screen2.getByRole('img')).toHaveAttribute('src', '/images/logo.png');
		screen2.unmount();
	});

	it('wildcard works alongside other prefixes', async () => {
		const screen = render(HardenedMarkdown, {
			defaultOrigin: 'https://example.com',
			allowedLinkPrefixes: ['https://github.com/', '*'],
			content: '[Any Link](https://random-site.com/path)'
		});

		await expect
			.element(screen.getByRole('link'))
			.toHaveAttribute('href', 'https://random-site.com/path');
	});

	it('wildcard allows malformed URLs that can still be parsed', async () => {
		const screen = render(HardenedMarkdown, {
			defaultOrigin: 'https://example.com',
			allowedLinkPrefixes: ['*'],
			content: '[Test](//example.com/protocol-relative)'
		});

		await expect.element(screen.getByRole('link')).toHaveAttribute('href', '/protocol-relative');
	});

	it('wildcard allows URLs that can be resolved with defaultOrigin', async () => {
		const screen = render(HardenedMarkdown, {
			defaultOrigin: 'https://example.com',
			allowedLinkPrefixes: ['*'],
			content: '[Test](invalid-url-without-protocol)'
		});

		// With defaultOrigin, this gets resolved to an absolute URL
		await expect
			.element(screen.getByRole('link'))
			.toHaveAttribute('href', 'https://example.com/invalid-url-without-protocol');
	});

	it("wildcard doesn't require defaultOrigin for absolute URLs", async () => {
		const screen = render(HardenedMarkdown, {
			allowedLinkPrefixes: ['*'],
			content: '[Test](https://example.com/test)'
		});

		await expect
			.element(screen.getByRole('link'))
			.toHaveAttribute('href', 'https://example.com/test');
	});

	it('wildcard still blocks completely unparseable URLs', async () => {
		const screen = render(HardenedMarkdown, {
			allowedLinkPrefixes: ['*'],
			content: '[Test](ht@tp://not-a-valid-url)'
		});

		await expect.element(screen.getByRole('link')).not.toBeInTheDocument();
		await expect.element(screen.getByText('Test [blocked]')).toBeInTheDocument();
	});

	it('wildcard still blocks javascript: URLs', async () => {
		const screen = render(HardenedMarkdown, {
			allowedLinkPrefixes: ['*'],
			content: "[Test](javascript:alert('XSS'))"
		});

		// Even with wildcard "*", javascript: URLs are blocked because they can't be parsed by URL()
		await expect.element(screen.getByRole('link')).not.toBeInTheDocument();
		await expect.element(screen.getByText('Test [blocked]')).toBeInTheDocument();
	});

	it('wildcard blocks data: URLs', async () => {
		const screen = render(HardenedMarkdown, {
			allowedLinkPrefixes: ['*'],
			content: '[Test](data:text/html,123)'
		});

		// Even with wildcard "*", data: URLs are blocked because they can't be parsed by URL()
		await expect.element(screen.getByRole('link')).not.toBeInTheDocument();
		await expect.element(screen.getByText('Test [blocked]')).toBeInTheDocument();
	});

	it('wildcard still blocks javascript: URLs (with identity transform)', async () => {
		const screen = render(HardenedMarkdown, {
			allowedLinkPrefixes: ['*'],
			urlTransform: (url) => url,
			content: '[Test](javascript:alert("XSS"))'
		});

		await expect.element(screen.getByRole('link')).not.toBeInTheDocument();
		await expect.element(screen.getByText('Test [blocked]')).toBeInTheDocument();
	});

	it('wildcard still blocks data: URLs (with identity transform)', async () => {
		const screen = render(HardenedMarkdown, {
			allowedLinkPrefixes: ['*'],
			urlTransform: (url) => url,
			content: '[Test](data:text/html,123)'
		});

		await expect.element(screen.getByRole('link')).not.toBeInTheDocument();
		await expect.element(screen.getByText('Test [blocked]')).toBeInTheDocument();
	});
});
