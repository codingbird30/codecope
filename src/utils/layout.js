export function layoutGraph(graph) {
  const { nodes, entry_point } = graph;
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  const layers = {};
  const visited = new Set();
  const queue = [];

  const root = entry_point && nodeMap[entry_point] ? entry_point : nodes[0]?.id;
  if (root) {
    queue.push({ id: root, layer: 0 });
    visited.add(root);
  }

  while (queue.length) {
    const { id, layer } = queue.shift();
    layers[id] = layer;
    const node = nodeMap[id];
    if (!node) continue;
    for (const c of (node.calls || [])) {
      if (nodeMap[c] && !visited.has(c)) {
        visited.add(c);
        queue.push({ id: c, layer: layer + 1 });
      }
    }
  }

  let orphanLayer = Math.max(0, ...Object.values(layers)) + 1;
  for (const n of nodes) {
    if (!(n.id in layers)) layers[n.id] = orphanLayer;
  }

  const byLayer = {};
  for (const n of nodes) {
    const l = layers[n.id];
    if (!byLayer[l]) byLayer[l] = [];
    byLayer[l].push(n);
  }

  const COL_W = 330;
  const ROW_H = 140;
  const START_X = 80;
  const START_Y = 80;
  const COLLAPSED_H = 56;

  const positions = {};
  const sortedLayers = Object.keys(byLayer).map(Number).sort((a, b) => a - b);

  for (const layer of sortedLayers) {
    const col = byLayer[layer];
    col.sort((a, b) => {
      if (a.id === root) return -1;
      if (b.id === root) return 1;
      if (a.has_bug !== b.has_bug) return a.has_bug ? -1 : 1;
      return (a.name || '').localeCompare(b.name || '');
    });
    col.forEach((n, idx) => {
      positions[n.id] = {
        x: START_X + layer * COL_W,
        y: START_Y + idx * ROW_H,
        w: 280,
        h: COLLAPSED_H
      };
    });
  }

  return positions;
}
