import 'vitest';

interface CustomMatchers<R = unknown> {
	to_equal_html: (
		expected: string,
		options?: { preserve_comments?: boolean; without_normalize_html?: boolean }
	) => R;
}

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
	interface Matchers<T = any> extends CustomMatchers<T> {}
}
