import type { Nodes } from 'hast';

const map = new Map<Nodes, string>();

export function reset() {
	conflicts.clear();
	map.clear();
}

export function key(node: Nodes) {
	let key = map.get(node);

	if (!key) {
		key = deconflict_node(node);
		map.set(node, key);
	}

	return key;
}

function deconflict_node(node: Nodes): string {
	switch (node.type) {
		case 'text':
			return deconflict(node.value);
		case 'element':
			return deconflict(node.tagName);
		case 'comment':
			return deconflict(node.value);
		case 'doctype':
		case 'root':
			return deconflict(node.type);
		default: {
			const _: never = node;
			console.log(node);
			throw new Error('Unknown node type');
		}
	}
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
