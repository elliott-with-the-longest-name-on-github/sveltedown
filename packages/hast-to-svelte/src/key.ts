import type { Nodes, RootContent } from 'hast';

const map = new Map<Nodes, string>();

export function reset() {
	conflicts.clear();
	map.clear();
}

export function key(node: Nodes) {
	let key = map.get(node);

	if (!key) {
		key = deconflict(hash_contents(node));
		map.set(node, key);
	}

	return key;
}

function hash_contents(node: Nodes): string {
	switch (node.type) {
		case 'text':
			return hash(node.value);
		case 'element':
			return hash(node.tagName + hash_children(node.children));
		case 'root':
			return hash_children(node.children);
		case 'comment':
			return hash(node.value);
		case 'doctype':
			return '';
		default: {
			const _: never = node;
			throw new Error('Unknown node type');
		}
	}
}

function hash_children(children: RootContent[]): string {
	return children.map((node) => hash_contents(node)).join('');
}

const conflicts = new Set<string>();

function deconflict(str: string) {
	let deconflicted = str;
	let i = 0;
	while (conflicts.has(deconflicted)) {
		deconflicted = `${str}-${i++}`;
	}
	conflicts.add(deconflicted);
	return deconflicted;
}

function hash(str: string) {
	let hash = 5381;
	let i = str.length;

	while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
	return (hash >>> 0).toString(36);
}
