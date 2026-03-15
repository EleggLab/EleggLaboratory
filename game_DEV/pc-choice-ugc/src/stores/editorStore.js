import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// 60 SECONDS style survival template
// Branching choice flow + flag-driven outcomes
// ============================================

const templateFlags = [
  { id: 'survivor_helped', name: 'Survivor Helped', defaultValue: false },
  { id: 'raider_threat', name: 'Raider Threat', defaultValue: false },
  { id: 'strict_rationing', name: 'Strict Rationing', defaultValue: false },
];

const templateLayoutSettings = {
  theme: {
    primaryColor: '#f4d03f',
    backgroundColor: '#1a1a1a',
    panelColor: '#2a2a2a',
    borderColor: '#444',
    textColor: '#ffffff',
    dangerColor: '#e74c3c',
    successColor: '#2ecc71',
    warningColor: '#f39c12',
  },
  characterPanel: {
    position: 'left',
    width: 256,
    backgroundColor: null,
    backgroundImage: null,
    showStats: true,
    statsDisplayStyle: 'bar',
    showStateEffects: true,
  },
  inventoryPanel: {
    position: 'right',
    width: 224,
    backgroundColor: null,
    backgroundImage: null,
    showResourceCounts: true,
  },
  eventPanel: {
    maxWidth: 672,
    backgroundColor: '#2a3a4a',
    backgroundImage: null,
    dialogueBoxStyle: 'modern',
    showCharacterPortrait: true,
    portraitSize: 48,
  },
  header: {
    backgroundColor: null,
    backgroundImage: null,
    showDayCounter: true,
    showExitButton: true,
  },
  choiceButtons: {
    backgroundColor: '#4a3a2a',
    hoverColor: '#5a4a3a',
    borderColor: '#8a6a4a',
    textColor: '#ffffff',
    borderRadius: 4,
  },
  gameOverScreen: {
    victoryBackgroundColor: '#1a2d1a',
    defeatBackgroundColor: '#2d1a1a',
    victoryImage: null,
    defeatImage: null,
  },
};

const templateSoundSettings = {
  enabled: true,
  masterVolume: 0.4,
  bgmUrl: '',
  sfx: {
    click: '/audio/ui_click.ogg',
    confirm: '/audio/ui_confirm.ogg',
    alert: '/audio/ui_alert.ogg',
  },
};

const templateStats = [
  {
    id: 'hunger',
    name: 'Hunger',
    nameKo: '배고픔',
    icon: 'H',
    min: 0,
    max: 100,
    defaultValue: 0,
    dailyChange: 10,
    criticalThreshold: 80,
    deathDays: 10,
    enabled: true,
    color: '#f39c12',
    direction: 'up',
  },
  {
    id: 'thirst',
    name: 'Thirst',
    nameKo: '갈증',
    icon: 'T',
    min: 0,
    max: 100,
    defaultValue: 0,
    dailyChange: 15,
    criticalThreshold: 80,
    deathDays: 5,
    enabled: true,
    color: '#3498db',
    direction: 'up',
  },
  {
    id: 'sanity',
    name: 'Sanity',
    nameKo: '정신력',
    icon: 'S',
    min: 0,
    max: 100,
    defaultValue: 100,
    dailyChange: -3,
    criticalThreshold: 20,
    deathDays: 0,
    enabled: true,
    color: '#9b59b6',
    direction: 'down',
  },
  {
    id: 'health',
    name: 'Health',
    nameKo: '체력',
    icon: 'HP',
    min: 0,
    max: 100,
    defaultValue: 100,
    dailyChange: 0,
    criticalThreshold: 20,
    deathDays: 3,
    enabled: false,
    color: '#e74c3c',
    direction: 'down',
  },
  {
    id: 'affection',
    name: 'Affection',
    nameKo: '호감도',
    icon: 'A',
    min: 0,
    max: 100,
    defaultValue: 50,
    dailyChange: -2,
    criticalThreshold: 10,
    deathDays: 0,
    enabled: false,
    color: '#e91e63',
    direction: 'down',
  },
  {
    id: 'morale',
    name: 'Morale',
    nameKo: '사기',
    icon: 'M',
    min: 0,
    max: 100,
    defaultValue: 75,
    dailyChange: -5,
    criticalThreshold: 20,
    deathDays: 0,
    enabled: false,
    color: '#4caf50',
    direction: 'down',
  },
  {
    id: 'radiation',
    name: 'Radiation',
    nameKo: '방사능',
    icon: 'RAD',
    min: 0,
    max: 100,
    defaultValue: 0,
    dailyChange: 2,
    criticalThreshold: 80,
    deathDays: 7,
    enabled: false,
    color: '#00ff00',
    direction: 'up',
  },
];
const storyStarterNodes = [
  {
    id: 'story-start',
    type: 'startNode',
    position: { x: 80, y: 260 },
    data: {
      type: 'start',
      label: 'Start',
      description: 'Single entry point of your story graph.',
      descriptionKo: '스토리 그래프의 단일 시작 지점입니다.',
    },
  },
  {
    id: 'story-intro',
    type: 'dialogueNode',
    position: { x: 330, y: 260 },
    data: {
      type: 'dialogue',
      label: 'Intro',
      text: 'This is the opening scene. Introduce your world here.',
      textKo: '오프닝 장면입니다. 여기서 세계관을 소개하세요.',
      characterId: null,
      backgroundId: 'default-bg-shelter',
    },
  },
  {
    id: 'story-choice',
    type: 'choiceNode',
    position: { x: 610, y: 250 },
    data: {
      type: 'choice',
      label: 'First Choice',
      choices: [
        { id: 'starter-choice-1', text: 'Take the safe route', textKo: '안전한 경로를 선택한다', requiredItem: null },
        { id: 'starter-choice-2', text: 'Take the risky route', textKo: '위험한 경로를 선택한다', requiredItem: null },
      ],
    },
  },
  {
    id: 'story-ending-good',
    type: 'endingNode',
    position: { x: 910, y: 180 },
    data: {
      type: 'ending',
      label: 'Good Ending',
      endingKey: 'good_ending',
      victory: true,
      title: 'Good Ending',
      titleKo: '굿 엔딩',
      reason: 'You reached a positive ending.',
      reasonKo: '긍정적인 결말에 도달했다.',
    },
  },
  {
    id: 'story-ending-bad',
    type: 'endingNode',
    position: { x: 910, y: 360 },
    data: {
      type: 'ending',
      label: 'Bad Ending',
      endingKey: 'bad_ending',
      victory: false,
      title: 'Bad Ending',
      titleKo: '배드 엔딩',
      reason: 'Your choices led to a tragic ending.',
      reasonKo: '선택의 결과가 비극적인 결말로 이어졌다.',
    },
  },
];

const storyStarterEdges = [
  { id: 'starter-edge-1', source: 'story-start', target: 'story-intro', type: 'smoothstep' },
  { id: 'starter-edge-2', source: 'story-intro', target: 'story-choice', type: 'smoothstep' },
  { id: 'starter-edge-3', source: 'story-choice', sourceHandle: 'choice-0', target: 'story-ending-good', type: 'smoothstep' },
  { id: 'starter-edge-4', source: 'story-choice', sourceHandle: 'choice-1', target: 'story-ending-bad', type: 'smoothstep' },
];

function cloneStarterGraph() {
  return {
    nodes: JSON.parse(JSON.stringify(storyStarterNodes)),
    edges: JSON.parse(JSON.stringify(storyStarterEdges)),
  };
}

const cleanTemplateNodes = [
  {
    id: 'tmpl-note-guide',
    type: 'noteNode',
    position: { x: 40, y: 70 },
    data: {
      type: 'note',
      label: 'Template Guide',
      title: 'Template Guide',
      text: 'This note explains how the template flows: Start -> Dialogue -> Choice -> Result/Branch -> Ending.',
      textKo: '이 노트는 템플릿 진행 구조를 설명합니다: 시작 -> 대화 -> 선택지 -> 결과/분기 -> 엔딩',
      noteColor: '#d8b34f',
    },
  },
  {
    id: 'tmpl-start',
    type: 'startNode',
    position: { x: 60, y: 280 },
    data: { type: 'start', label: 'Start', description: 'Single story entry.', descriptionKo: '스토리 단일 시작 지점입니다.' },
  },
  {
    id: 'tmpl-intro',
    type: 'dialogueNode',
    position: { x: 280, y: 280 },
    data: {
      type: 'dialogue',
      label: 'Intro',
      text: 'A knock echoes through the shelter door.',
      textKo: '방공호 문 너머에서 누군가 문을 두드린다.',
      characterId: null,
      backgroundId: 'default-bg-shelter',
    },
  },
  {
    id: 'tmpl-choice-main',
    type: 'choiceNode',
    position: { x: 520, y: 270 },
    data: {
      type: 'choice',
      label: 'Main Choice',
      choices: [
        { id: 'tmpl-c0', text: 'Open the door', textKo: '문을 연다', requiredItem: null },
        { id: 'tmpl-c1', text: 'Stay hidden', textKo: '숨어서 기다린다', requiredItem: null },
      ],
    },
  },
  {
    id: 'tmpl-open-result',
    type: 'resultNode',
    position: { x: 790, y: 170 },
    data: {
      type: 'result',
      label: 'Open Result',
      successChance: 0.65,
      onSuccess: {
        text: 'A survivor gives you supplies and trust.',
        textKo: '생존자가 물자와 신뢰를 건넨다.',
        itemChanges: [],
        statChanges: { food: 2, water: 1 },
        stateEffects: [],
        flagChanges: [{ flagId: 'survivor_helped', value: true }],
      },
      onFailure: {
        text: 'Raiders ambush the shelter.',
        textKo: '약탈자들이 방공호를 급습한다.',
        itemChanges: [],
        statChanges: { food: -2, water: -1 },
        stateEffects: [{ state: 'injured', target: 'random' }],
        flagChanges: [{ flagId: 'raider_threat', value: true }],
      },
    },
  },
  {
    id: 'tmpl-hide-dialogue',
    type: 'dialogueNode',
    position: { x: 790, y: 360 },
    data: {
      type: 'dialogue',
      label: 'Hide',
      text: 'Silence keeps you safe, but no one helps you.',
      textKo: '조용하면 당장은 안전하지만 아무도 도와주지 않는다.',
      characterId: null,
      backgroundId: 'default-bg-evening',
    },
  },
  {
    id: 'tmpl-flag-helped',
    type: 'flagNode',
    position: { x: 1040, y: 120 },
    data: {
      type: 'flag',
      label: 'Set Help Flag',
      flagId: 'survivor_helped',
      value: true,
      text: 'The alliance flag is now true.',
      textKo: '동맹 플래그가 true로 설정되었다.',
    },
  },
  {
    id: 'tmpl-branch-end',
    type: 'branchNode',
    position: { x: 1240, y: 240 },
    data: {
      type: 'branch',
      label: 'Check Alliance',
      conditions: [{ id: 'tmpl-cond-0', type: 'flag', flagId: 'survivor_helped', value: true }],
    },
  },
  {
    id: 'tmpl-dialogue-good',
    type: 'dialogueNode',
    position: { x: 1480, y: 170 },
    data: {
      type: 'dialogue',
      label: 'Alliance Route',
      text: 'Your new ally guides you to a safe route.',
      textKo: '새로운 동료가 안전한 경로로 안내한다.',
      characterId: null,
      backgroundId: 'default-bg-alert',
    },
  },
  {
    id: 'tmpl-ending-good',
    type: 'endingNode',
    position: { x: 1710, y: 130 },
    data: {
      type: 'ending',
      label: 'Good Ending',
      endingKey: 'good_ending',
      victory: true,
      title: 'Good Ending',
      titleKo: '굿 엔딩',
      reason: 'You survived with trusted allies.',
      reasonKo: '신뢰할 수 있는 동료와 함께 생존했다.',
    },
  },
  {
    id: 'tmpl-ending-bad',
    type: 'endingNode',
    position: { x: 1710, y: 330 },
    data: {
      type: 'ending',
      label: 'Bad Ending',
      endingKey: 'bad_ending',
      victory: false,
      title: 'Bad Ending',
      titleKo: '배드 엔딩',
      reason: 'You were isolated and overwhelmed.',
      reasonKo: '고립된 채 위기를 버티지 못했다.',
    },
  },
];

const cleanTemplateEdges = [
  { id: 'tmpl-e1', source: 'tmpl-start', target: 'tmpl-intro', type: 'smoothstep' },
  { id: 'tmpl-e2', source: 'tmpl-intro', target: 'tmpl-choice-main', type: 'smoothstep' },
  { id: 'tmpl-e3', source: 'tmpl-choice-main', sourceHandle: 'choice-0', target: 'tmpl-open-result', type: 'smoothstep' },
  { id: 'tmpl-e4', source: 'tmpl-choice-main', sourceHandle: 'choice-1', target: 'tmpl-hide-dialogue', type: 'smoothstep' },
  { id: 'tmpl-e5', source: 'tmpl-open-result', sourceHandle: 'success', target: 'tmpl-flag-helped', type: 'smoothstep' },
  { id: 'tmpl-e6', source: 'tmpl-open-result', sourceHandle: 'failure', target: 'tmpl-ending-bad', type: 'smoothstep' },
  { id: 'tmpl-e7', source: 'tmpl-hide-dialogue', target: 'tmpl-branch-end', type: 'smoothstep' },
  { id: 'tmpl-e8', source: 'tmpl-flag-helped', target: 'tmpl-branch-end', type: 'smoothstep' },
  { id: 'tmpl-e9', source: 'tmpl-branch-end', sourceHandle: 'true', target: 'tmpl-dialogue-good', type: 'smoothstep' },
  { id: 'tmpl-e10', source: 'tmpl-branch-end', sourceHandle: 'false', target: 'tmpl-ending-bad', type: 'smoothstep' },
  { id: 'tmpl-e11', source: 'tmpl-dialogue-good', target: 'tmpl-ending-good', type: 'smoothstep' },
];

function cloneCleanTemplateGraph() {
  return {
    nodes: JSON.parse(JSON.stringify(cleanTemplateNodes)),
    edges: JSON.parse(JSON.stringify(cleanTemplateEdges)),
  };
}

function buildTemplateRecipes() {
  return [
    {
      id: 'recipe-antidote',
      name: 'Antidote',
      nameKo: '해독제',
      ingredients: [
        { itemId: 'default-item-medkit', count: 1 },
        { itemId: 'default-item-water', count: 1 },
      ],
      resultItemId: 'default-item-antidote',
      resultName: 'Antidote',
      resultCount: 1,
      successChance: 0.75,
      description: 'Craft an antidote from medkit and water',
      descriptionKo: '구급상자와 물로 해독제를 제작합니다',
    },
    {
      id: 'recipe-supertool',
      name: 'Super Tool',
      nameKo: '슈퍼 도구',
      ingredients: [
        { itemId: 'default-item-axe', count: 1 },
        { itemId: 'default-item-flashlight', count: 1 },
      ],
      resultItemId: 'default-item-supertool',
      resultName: 'Super Tool',
      resultCount: 1,
      successChance: 0.7,
      description: 'Combine axe and flashlight into a superior tool',
      descriptionKo: '도끼와 손전등을 조합해 상위 도구를 만듭니다',
    },
    {
      id: 'recipe-tracker',
      name: 'Tracker',
      nameKo: '추적기',
      ingredients: [
        { itemId: 'default-item-radio', count: 1 },
        { itemId: 'default-item-map', count: 1 },
      ],
      resultItemId: 'default-item-tracker',
      resultName: 'Tracker',
      resultCount: 1,
      successChance: 0.65,
      description: 'Build a tracker from radio and map',
      descriptionKo: '라디오와 지도로 추적기를 제작합니다',
    },
    {
      id: 'recipe-rations',
      name: 'Emergency Rations',
      nameKo: '비상 배급식',
      ingredients: [
        { itemId: 'default-item-soup', count: 3 },
      ],
      resultItemId: 'default-item-rations',
      resultName: 'Emergency Rations',
      resultCount: 1,
      successChance: 0.9,
      description: 'Consolidate soup cans into emergency rations',
      descriptionKo: '수프 캔을 묶어 비상 배급식으로 전환합니다',
    },
    {
      id: 'recipe-filter',
      name: 'Water Filter',
      nameKo: '정수 필터',
      ingredients: [
        { itemId: 'default-item-gasmask', count: 1 },
        { itemId: 'default-item-water', count: 1 },
      ],
      resultItemId: 'default-item-filter',
      resultName: 'Water Filter',
      resultCount: 1,
      successChance: 0.7,
      description: 'Make a water filter from gasmask parts',
      descriptionKo: '가스마스크 부품으로 정수 필터를 제작합니다',
    },
  ];
}

export const useEditorStore = create((set, get) => ({
  // Project metadata
  projectMeta: {
    title: 'Sample Project',
    author: '',
    version: '1.0.0',
  },

  // React Flow state - start with template
  nodes: cloneCleanTemplateGraph().nodes,
  edges: cloneCleanTemplateGraph().edges,
  selectedNode: null,

  // Quest flags - start with template flags
  flags: templateFlags,

  // Custom character stats
  customStats: templateStats,

  // Layout settings for game player UX
  layoutSettings: templateLayoutSettings,

  // Project sound template
  soundSettings: templateSoundSettings,

  // Crafting recipes
  recipes: buildTemplateRecipes(),
  // Global game settings
  globalStats: {
    startingFood: 12,
    startingWater: 10,
    rescueMinDay: 25,
    rescueMaxDay: 45,
    rescueChancePerDay: 0.08,
    environmentEnabled: true,
    radiationBase: 10,
    severityIncrease: 7,
  },

  // Actions
  setProjectMeta: (meta) => set({ projectMeta: { ...get().projectMeta, ...meta } }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    const { nodes } = get();
    // Apply changes to nodes
    const updatedNodes = nodes.map((node) => {
      const change = changes.find((c) => c.id === node.id);
      if (!change) return node;

      if (change.type === 'position' && change.position) {
        return { ...node, position: change.position };
      }
      if (change.type === 'select') {
        return { ...node, selected: change.selected };
      }
      if (change.type === 'remove') {
        return null;
      }
      return node;
    }).filter(Boolean);

    // Handle additions
    const additions = changes.filter((c) => c.type === 'add');
    additions.forEach((add) => {
      if (add.item) updatedNodes.push(add.item);
    });

    set({ nodes: updatedNodes });
  },

  onEdgesChange: (changes) => {
    const { edges } = get();
    const updatedEdges = edges.map((edge) => {
      const change = changes.find((c) => c.id === edge.id);
      if (!change) return edge;
      if (change.type === 'remove') return null;
      return edge;
    }).filter(Boolean);

    set({ edges: updatedEdges });
  },

  onConnect: (connection) => {
    const { edges } = get();
    const newEdge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      type: 'smoothstep',
    };
    set({ edges: [...edges, newEdge] });
  },

  addNode: (type, position = { x: 100, y: 100 }) => {
    const existingNodes = get().nodes;
    if (type === 'start') {
      const existingStart = existingNodes.find((node) => node.data?.type === 'start');
      if (existingStart) return existingStart.id;
    }

    const id = uuidv4();
    const nodeDefaults = {
      trigger: {
        label: 'Event Trigger',
        data: {
          type: 'trigger',
          minDay: 1,
          maxDay: null,
          probability: 1.0,
          requiredFlags: [],
          requiredItems: [],
          eventImageId: null,
          timing: 'event',
          common: false,
        },
      },
      dialogue: {
        label: 'Dialogue',
        data: {
          type: 'dialogue',
          text: 'Enter event text here...',
          textKo: '여기에 이벤트 텍스트를 입력하세요...',
          characterId: null,
          backgroundId: null,
        },
      },
      choice: {
        label: 'Choice',
        data: {
          type: 'choice',
          choices: [
            { id: uuidv4(), text: 'Option 1', textKo: '선택지 1', requiredItem: null },
            { id: uuidv4(), text: 'Option 2', textKo: '선택지 2', requiredItem: null },
          ],
        },
      },
      result: {
        label: 'Result',
        data: {
          type: 'result',
          successChance: 1.0,
          onSuccess: {
            text: 'Success!',
            textKo: '성공!',
            itemChanges: [],
            statChanges: {},
            stateEffects: [],
            flagChanges: [],
          },
          onFailure: {
            text: 'Failed...',
            textKo: '실패...',
            itemChanges: [],
            statChanges: {},
            stateEffects: [],
            flagChanges: [],
          },
        },
      },
      branch: {
        label: 'Branch',
        data: {
          type: 'branch',
          conditions: [
            { id: uuidv4(), type: 'flag', flagId: '', value: true },
          ],
        },
      },
      flag: {
        label: 'Flag',
        data: {
          type: 'flag',
          flagId: '',
          value: true,
          text: 'Flag updated.',
          textKo: '플래그가 변경되었습니다.',
        },
      },
      note: {
        label: 'Note',
        data: {
          type: 'note',
          title: 'Design Note',
          text: 'Write design notes or TODOs here.',
          textKo: '여기에 기획 메모나 TODO를 작성하세요.',
          noteColor: '#d8b34f',
        },
      },
      start: {
        label: 'Start',
        data: {
          type: 'start',
          description: 'Single entry point of your story graph.',
          descriptionKo: '스토리 그래프의 단일 시작 지점입니다.',
        },
      },
      ending: {
        label: 'Ending',
        data: {
          type: 'ending',
          endingKey: '',
          victory: true,
          title: 'Ending',
          titleKo: '엔딩',
          reason: 'Story finished.',
          reasonKo: '스토리가 종료되었습니다.',
        },
      },
    };

    const defaults = nodeDefaults[type] || nodeDefaults.dialogue;

    const newNode = {
      id,
      type: `${type}Node`,
      position,
      data: {
        ...defaults.data,
        label: defaults.label,
      },
    };

    set({ nodes: [...existingNodes, newNode] });
    return id;
  },

  updateNodeData: (nodeId, data) => {
    const { nodes } = get();
    const updatedNodes = nodes.map((node) => {
      if (node.id !== nodeId) return node;
      return { ...node, data: { ...node.data, ...data } };
    });
    set({ nodes: updatedNodes });
  },

  deleteNode: (nodeId) => {
    const { nodes, edges } = get();
    set({
      nodes: nodes.filter((n) => n.id !== nodeId),
      edges: edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: get().selectedNode === nodeId ? null : get().selectedNode,
    });
  },

  selectNode: (nodeId) => set({ selectedNode: nodeId }),
  clearSelection: () => set({ selectedNode: null }),

  // Flags
  addFlag: (name) => {
    const flag = { id: uuidv4(), name, defaultValue: false };
    set({ flags: [...get().flags, flag] });
    return flag.id;
  },

  updateFlag: (flagId, updates) => {
    const { flags } = get();
    set({
      flags: flags.map((f) => (f.id === flagId ? { ...f, ...updates } : f)),
    });
  },

  deleteFlag: (flagId) => {
    set({ flags: get().flags.filter((f) => f.id !== flagId) });
  },

  // Custom Stats
  addCustomStat: (name, nameKo = '') => {
    const stat = {
      id: uuidv4(),
      name,
      nameKo: nameKo || name,
      icon: 'S',
      min: 0,
      max: 100,
      defaultValue: 50,
      dailyChange: 0,
      criticalThreshold: 20,
      deathDays: 0,
      enabled: true,
      color: '#888888',
      direction: 'down',
    };
    set({ customStats: [...get().customStats, stat] });
    return stat.id;
  },

  updateCustomStat: (statId, updates) => {
    const { customStats } = get();
    set({
      customStats: customStats.map((s) => (s.id === statId ? { ...s, ...updates } : s)),
    });
  },

  deleteCustomStat: (statId) => {
    set({ customStats: get().customStats.filter((s) => s.id !== statId) });
  },

  toggleStatEnabled: (statId) => {
    const { customStats } = get();
    set({
      customStats: customStats.map((s) =>
        s.id === statId ? { ...s, enabled: !s.enabled } : s
      ),
    });
  },

  // Layout settings
  updateLayoutSettings: (section, updates) => {
    const { layoutSettings } = get();
    set({
      layoutSettings: {
        ...layoutSettings,
        [section]: { ...layoutSettings[section], ...updates },
      },
    });
  },

  resetLayoutSettings: () => {
    set({ layoutSettings: templateLayoutSettings });
  },

  setLayoutImage: (section, imageData) => {
    const { layoutSettings } = get();
    set({
      layoutSettings: {
        ...layoutSettings,
        [section]: { ...layoutSettings[section], backgroundImage: imageData },
      },
    });
  },

  // Global stats
  setGlobalStats: (stats) => set({ globalStats: { ...get().globalStats, ...stats } }),
  setSoundSettings: (updates) => set({ soundSettings: { ...get().soundSettings, ...updates } }),

  // Recipe management
  addRecipe: (recipe) => {
    set({ recipes: [...get().recipes, recipe] });
  },

  updateRecipe: (recipeId, updates) => {
    set({
      recipes: get().recipes.map((r) => (r.id === recipeId ? { ...r, ...updates } : r)),
    });
  },

  deleteRecipe: (recipeId) => {
    set({ recipes: get().recipes.filter((r) => r.id !== recipeId) });
  },

  // Project management - NEW PROJECT = Empty canvas
  newProject: () => {
    const starter = cloneStarterGraph();
    set({
      projectMeta: { title: 'Untitled Project', author: '', version: '1.0.0' },
      nodes: starter.nodes,
      edges: starter.edges,
      selectedNode: null,
      flags: [],
      customStats: templateStats,
      layoutSettings: templateLayoutSettings,
      soundSettings: templateSoundSettings,
      recipes: [],
      globalStats: {
        startingFood: 12,
        startingWater: 10,
        rescueMinDay: 25,
        rescueMaxDay: 45,
        rescueChancePerDay: 0.08,
        environmentEnabled: true,
        radiationBase: 10,
        severityIncrease: 7,
      },
    });
  },

  // Load template (for reset to template)
  loadTemplate: () => {
    set({
      projectMeta: { title: 'Sample Project', author: '', version: '1.0.0' },
      nodes: cloneCleanTemplateGraph().nodes,
      edges: cloneCleanTemplateGraph().edges,
      selectedNode: null,
      flags: templateFlags,
      customStats: templateStats,
      layoutSettings: templateLayoutSettings,
      soundSettings: templateSoundSettings,
      recipes: buildTemplateRecipes(),
      globalStats: {
        startingFood: 12,
        startingWater: 10,
        rescueMinDay: 25,
        rescueMaxDay: 45,
        rescueChancePerDay: 0.08,
        environmentEnabled: true,
        radiationBase: 10,
        severityIncrease: 7,
      },
    });
  },

  loadProject: (data) => {
    set({
      projectMeta: data.meta || get().projectMeta,
      nodes: data.nodes || [],
      edges: data.edges || [],
      flags: data.flags || [],
      customStats: data.customStats || templateStats,
      layoutSettings: data.layoutSettings || templateLayoutSettings,
      soundSettings: data.soundSettings || templateSoundSettings,
      globalStats: data.globalStats || get().globalStats,
      recipes: Array.isArray(data.recipes) ? data.recipes : buildTemplateRecipes(),
      selectedNode: null,
    });
  },

  exportProject: () => {
    const { projectMeta, nodes, edges, flags, customStats, layoutSettings, soundSettings, globalStats, recipes } = get();
    return {
      meta: projectMeta,
      nodes,
      edges,
      flags,
      customStats,
      layoutSettings,
      soundSettings,
      globalStats,
      recipes,
    };
  },
}));


