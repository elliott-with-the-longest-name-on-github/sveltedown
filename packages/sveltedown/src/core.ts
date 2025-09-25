import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import type { Options } from './types.js';
import type { Root as MdastRoot } from 'mdast';
import type { Root as HastRoot } from 'hast';
import remark_parse from 'remark-parse';
import remark_rehype from 'remark-rehype';
import { unified, type Processor, type PluggableList } from 'unified';

const empty_plugins: PluggableList = [];

const empty_remark_rehype_options: RemarkRehypeOptions = { allowDangerousHtml: true };

export function create_processor(
	options: Readonly<Options>
): Processor<MdastRoot, MdastRoot, HastRoot, undefined, undefined> {
	const remark_rehype_options = options.remarkRehypeOptions
		? { ...options.remarkRehypeOptions, ...empty_remark_rehype_options }
		: empty_remark_rehype_options;

	const processor = unified()
		.use(remark_parse)
		.use(options.remarkPlugins ?? empty_plugins)
		.use(remark_rehype, remark_rehype_options)
		.use(options.rehypePlugins ?? empty_plugins);

	return processor;
}
