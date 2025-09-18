import type { Options as BaseOptions } from '@sejohnson/svelte-markdown';

export type Options = BaseOptions & {
	defaultOrigin?: string;
	allowedLinkPrefixes?: string[];
	allowedImagePrefixes?: string[];
};
