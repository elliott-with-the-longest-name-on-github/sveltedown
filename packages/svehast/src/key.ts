import type { Nodes } from 'hast';

export function initKeys() {
	const map = new Map<Nodes, string>();
	const conflicts = new Set<string>();

	return {
		reset: () => {
			conflicts.clear();
			map.clear();
		},
		key: (node: Nodes) => {
			let key = map.get(node);

			if (!key) {
				key = deconflict_node(conflicts, node);
				map.set(node, key);
			}

			return key;
		}
	};
}

function deconflict_node(conflicts: Set<string>, node: Nodes): string {
	switch (node.type) {
		case 'text':
			return deconflict(conflicts, node.value);
		case 'element':
			return deconflict(conflicts, node.tagName);
		case 'comment':
			return deconflict(conflicts, node.value);
		case 'doctype':
		case 'root':
			return deconflict(conflicts, node.type);
		default: {
			const _: never = node;
			console.log(node);
			throw new Error('Unknown node type');
		}
	}
}

function deconflict(conflicts: Set<string>, str: string) {
	let deconflicted = str;
	let i = 0;
	while (conflicts.has(deconflicted)) {
		deconflicted = `${str}-${i++}`;
	}
	conflicts.add(deconflicted);
	return deconflicted;
}
