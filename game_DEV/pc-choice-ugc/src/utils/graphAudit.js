function labelForNode(node) {
  if (!node) return 'unknown';
  return node.data?.label || node.data?.title || node.id || 'unknown';
}

function previewLabels(nodes, limit = 8) {
  const list = nodes.slice(0, limit).map((node) => labelForNode(node));
  const suffix = nodes.length > limit ? ' ...' : '';
  return `${list.join(', ')}${suffix}`;
}

export function auditProjectGraph(projectData) {
  const nodes = Array.isArray(projectData?.nodes) ? projectData.nodes : [];
  const edges = Array.isArray(projectData?.edges) ? projectData.edges : [];
  const activeNodes = nodes.filter((node) => node?.data?.type !== 'note');

  const errors = [];
  const warnings = [];

  const nodeById = new Map(activeNodes.map((node) => [node.id, node]));
  const validEdges = edges.filter((edge) => nodeById.has(edge?.source) && nodeById.has(edge?.target));

  const startNodes = activeNodes.filter((node) => node?.data?.type === 'start');
  const endingNodes = activeNodes.filter((node) => node?.data?.type === 'ending');

  if (startNodes.length !== 1) {
    errors.push({
      code: 'start_count',
      messageEn: `Start node must be exactly 1. Current: ${startNodes.length}`,
      messageKo: `Start 노드는 정확히 1개여야 합니다. 현재: ${startNodes.length}`,
    });
  }

  if (endingNodes.length < 1) {
    errors.push({
      code: 'ending_count',
      messageEn: 'At least one Ending node is required.',
      messageKo: 'Ending 노드는 최소 1개 이상 필요합니다.',
    });
  }

  const adjacency = new Map();
  const outgoingCountBySource = new Map();
  validEdges.forEach((edge) => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source).push(edge.target);
    outgoingCountBySource.set(edge.source, (outgoingCountBySource.get(edge.source) || 0) + 1);
  });

  const reachable = new Set();
  if (startNodes.length === 1) {
    const startId = startNodes[0].id;
    const queue = [startId];
    reachable.add(startId);
    while (queue.length > 0) {
      const current = queue.shift();
      const nextList = adjacency.get(current) || [];
      nextList.forEach((nextId) => {
        if (!reachable.has(nextId)) {
          reachable.add(nextId);
          queue.push(nextId);
        }
      });
    }

    const unreachable = activeNodes.filter((node) => node.id !== startId && !reachable.has(node.id));
    if (unreachable.length > 0) {
      errors.push({
        code: 'unreachable_nodes',
        messageEn: `All nodes must be reachable from Start. Unreachable: ${previewLabels(unreachable)}`,
        messageKo: `모든 노드는 Start에서 도달 가능해야 합니다. 미도달 노드: ${previewLabels(unreachable)}`,
        nodes: unreachable.map((node) => node.id),
      });
    }

    const reachableEndings = endingNodes.filter((node) => reachable.has(node.id));
    if (endingNodes.length > 0 && reachableEndings.length === 0) {
      errors.push({
        code: 'unreachable_ending',
        messageEn: 'No Ending node is reachable from Start.',
        messageKo: 'Start에서 도달 가능한 Ending 노드가 없습니다.',
      });
    }
  }

  const danglingNodes = activeNodes.filter((node) => {
    const nodeType = node?.data?.type;
    if (nodeType === 'ending') return false;
    return (outgoingCountBySource.get(node.id) || 0) === 0;
  });
  if (danglingNodes.length > 0) {
    warnings.push({
      code: 'dangling_nodes',
      messageEn: `Some nodes have no outgoing edges: ${previewLabels(danglingNodes, 10)}`,
      messageKo: `출력 엣지가 없는 노드가 있습니다: ${previewLabels(danglingNodes, 10)}`,
      nodes: danglingNodes.map((node) => node.id),
    });
  }

  activeNodes.forEach((node) => {
    if (node?.data?.type === 'choice') {
      const choices = Array.isArray(node.data?.choices) ? node.data.choices : [];
      const missingHandles = [];
      choices.forEach((_, idx) => {
        const handle = `choice-${idx}`;
        const hasEdge = validEdges.some((edge) => edge.source === node.id && edge.sourceHandle === handle);
        if (!hasEdge) missingHandles.push(idx + 1);
      });
      if (missingHandles.length > 0) {
        warnings.push({
          code: 'choice_missing_edges',
          messageEn: `${labelForNode(node)}: missing edges for choice #${missingHandles.join(', #')}.`,
          messageKo: `${labelForNode(node)}: 선택지 #${missingHandles.join(', #')} 연결이 없습니다.`,
          nodes: [node.id],
        });
      }
    }

    if (node?.data?.type === 'result') {
      const hasSuccess = validEdges.some((edge) => edge.source === node.id && edge.sourceHandle === 'success');
      const hasFailure = validEdges.some((edge) => edge.source === node.id && edge.sourceHandle === 'failure');
      if (!hasSuccess || !hasFailure) {
        warnings.push({
          code: 'result_missing_edges',
          messageEn: `${labelForNode(node)}: connect both Success and Failure outputs.`,
          messageKo: `${labelForNode(node)}: Success/Failure 출력 모두 연결하세요.`,
          nodes: [node.id],
        });
      }
    }

    if (node?.data?.type === 'branch') {
      const hasTrue = validEdges.some((edge) => edge.source === node.id && edge.sourceHandle === 'true');
      const hasFalse = validEdges.some((edge) => edge.source === node.id && edge.sourceHandle === 'false');
      if (!hasTrue || !hasFalse) {
        warnings.push({
          code: 'branch_missing_edges',
          messageEn: `${labelForNode(node)}: connect both True and False outputs.`,
          messageKo: `${labelForNode(node)}: True/False 출력 모두 연결하세요.`,
          nodes: [node.id],
        });
      }
    }
  });

  return {
    errors,
    warnings,
    metrics: {
      totalNodes: nodes.length,
      activeNodes: activeNodes.length,
      edges: validEdges.length,
      startNodes: startNodes.length,
      endingNodes: endingNodes.length,
    },
  };
}

