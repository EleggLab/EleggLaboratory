import { v4 as uuidv4 } from 'uuid';
import { useAssetStore } from '../../stores/assetStore';
import { useEditorStore } from '../../stores/editorStore';
import { pickLocalized } from '../../utils/i18n';

const STATE_OPTIONS = ['sick', 'injured', 'insane'];
const KO_LABEL_FALLBACKS = {
  'Start Description (EN)': '시작 설명 (영문)',
  'Shown in editor only': '에디터에서만 표시됩니다',
  'Start Description (KO)': '시작 설명 (국문)',
  Optional: '선택 사항',
  'Use one Start node as the single entry of your story graph.': '스토리 그래프의 단일 진입점으로 Start 노드 1개를 사용하세요.',
  'Min Day': '최소 일차',
  'Max Day (optional)': '최대 일차 (선택)',
  'Probability (%)': '확률 (%)',
  'Trigger Timing': '트리거 시점',
  'Status Phase': '상태 단계',
  'Daily Action Phase': '일일 행동 단계',
  'Event Phase': '이벤트 단계',
  'Event Image': '이벤트 이미지',
  None: '없음',
  'Common Trigger (runs in selected phase)': '공통 트리거 (선택한 단계에서 실행)',
  'Required Flags': '필수 플래그',
  'Select flag': '플래그 선택',
  'Add Flag Requirement': '플래그 조건 추가',
  'New flag name': '새 플래그 이름',
  'Required Items': '필수 아이템',
  'Select item': '아이템 선택',
  'Add Item Requirement': '아이템 조건 추가',
  'Text (EN)': '텍스트 (영문)',
  'Text (KO)': '텍스트 (국문)',
  Character: '캐릭터',
  Background: '배경',
  Choices: '선택지',
  Remove: '삭제',
  'Choice text (EN)': '선택지 텍스트 (영문)',
  'Choice text (KO)': '선택지 텍스트 (국문)',
  'No item required': '아이템 조건 없음',
  'Add Choice': '선택지 추가',
  'Message (EN)': '메시지 (영문)',
  'Message (KO)': '메시지 (국문)',
  'Item Changes': '아이템 변경',
  'Add Item Change': '아이템 변경 추가',
  'Stat Changes': '스탯 변경',
  'State Effects': '상태 효과',
  Random: '랜덤',
  All: '전체',
  Specific: '지정',
  'Select character': '캐릭터 선택',
  'Remove Effect': '효과 삭제',
  'Add State Effect': '상태 효과 추가',
  'Flag Changes': '플래그 변경',
  'Success Chance (%)': '성공 확률 (%)',
  'On Success': '성공 시',
  'On Failure': '실패 시',
  Conditions: '조건',
  Flag: '플래그',
  'Has Item': '아이템 보유',
  'Stat Check': '스탯 검사',
  'Add Condition': '조건 추가',
  Value: '값',
  'Ending Key': '엔딩 키',
  'e.g. true_ending': '예: true_ending',
  'Victory?': '승리 여부',
  Victory: '승리',
  Defeat: '패배',
  'Ending Title (EN)': '엔딩 제목 (영문)',
  'Ending title': '엔딩 제목',
  'Ending Title (KO)': '엔딩 제목 (국문)',
  'Ending Description (EN)': '엔딩 설명 (영문)',
  'Shown on game-over screen': '게임오버 화면에 표시됩니다',
  'Ending Description (KO)': '엔딩 설명 (국문)',
};

function withFallbackKo(en, ko) {
  if (typeof ko === 'string' && ko.trim() && ko !== en) return ko;
  return KO_LABEL_FALLBACKS[en] || ko || en;
}

function parseFlagLines(raw) {
  return String(raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (!line.includes('=')) return { flagId: line, value: true };
      const [flagId, rawValue] = line.split('=');
      return { flagId: flagId.trim(), value: String(rawValue).trim().toLowerCase() !== 'false' };
    })
    .filter((entry) => entry.flagId);
}

function formatFlagLines(changes) {
  if (!Array.isArray(changes)) return '';
  return changes
    .filter((entry) => entry?.flagId)
    .map((entry) => `${entry.flagId}=${entry.value === false ? 'false' : 'true'}`)
    .join('\n');
}

function normalizeRequiredFlags(requiredFlags) {
  if (!Array.isArray(requiredFlags)) return [];
  return requiredFlags
    .map((entry) => {
      if (typeof entry === 'string') return { flagId: entry, value: true };
      if (!entry) return null;
      return { flagId: entry.flagId || '', value: entry.value ?? true };
    })
    .filter(Boolean);
}

function itemAmount(entry) {
  const amount = Number(entry?.amount ?? entry?.change ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function blockTitle(title) {
  return <div className="text-xs text-gray-300">{title}</div>;
}

export default function NodeSidebar({ node, language }) {
  const {
    updateNodeData,
    deleteNode,
    flags = [],
    addFlag,
    customStats = [],
  } = useEditorStore();
  const { characters = [], items = [], backgrounds = [] } = useAssetStore();

  const t = (en, ko) => pickLocalized(language, en, withFallbackKo(en, ko));
  const enabledCustomStats = customStats.filter((stat) => stat.enabled);

  if (!node) {
    return (
      <div className="editor-sidebar node-inspector overflow-y-auto">
        <div className="p-4 border-b border-[#ffffff22]">
          <h3 className="font-bold text-[#f4d03f]">{t('Inspector', '인스펙터')}</h3>
          <p className="text-xs text-gray-300 mt-1">{t('Select a node to edit its details.', '노드를 선택하면 상세 설정을 편집할 수 있습니다.')}</p>
        </div>
        <div className="p-4 space-y-3 text-xs text-gray-300">
          <p>{t('Recommended flow', '권장 흐름')}</p>
          <p>{t('Start -> Dialogue -> Choice -> Result/Branch -> Ending', '시작 -> 대화 -> 선택지 -> 결과/분기 -> 엔딩')}</p>
          <p>{t('Note nodes are for documentation only.', '노트 노드는 설명/메모 전용입니다.')}</p>
        </div>
      </div>
    );
  }

  const setData = (key, value) => updateNodeData(node.id, { [key]: value });
  const setNested = (parentKey, key, value) => {
    const parent = node.data[parentKey] || {};
    setData(parentKey, { ...parent, [key]: value });
  };

  const updateNestedArrayItem = (parentKey, key, index, patch) => {
    const parent = node.data[parentKey] || {};
    const arr = Array.isArray(parent[key]) ? [...parent[key]] : [];
    arr[index] = { ...(arr[index] || {}), ...patch };
    setNested(parentKey, key, arr);
  };

  const removeNestedArrayItem = (parentKey, key, index) => {
    const parent = node.data[parentKey] || {};
    const arr = Array.isArray(parent[key]) ? parent[key] : [];
    setNested(parentKey, key, arr.filter((_, i) => i !== index));
  };

  const addNestedArrayItem = (parentKey, key, item) => {
    const parent = node.data[parentKey] || {};
    const arr = Array.isArray(parent[key]) ? parent[key] : [];
    setNested(parentKey, key, [...arr, item]);
  };

  const renderLabel = () => (
    <div className="mb-3">
      <label className="block text-xs text-gray-200 mb-1">{t('Node Label', '노드 라벨')}</label>
      <input
        type="text"
        value={node.data.label || ''}
        onChange={(e) => setData('label', e.target.value)}
        placeholder={t('Node title', '노드 제목')}
      />
    </div>
  );

  const renderStart = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Start Description (EN)', 'Start Description (EN)')}</label>
        <textarea
          value={node.data.description || ''}
          onChange={(e) => setData('description', e.target.value)}
          rows={3}
          className="resize-none"
          placeholder={t('Shown in editor only', 'Shown in editor only')}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Start Description (KO)', 'Start Description (KO)')}</label>
        <textarea
          value={node.data.descriptionKo || ''}
          onChange={(e) => setData('descriptionKo', e.target.value)}
          rows={3}
          className="resize-none"
          placeholder={t('Optional', 'Optional')}
        />
      </div>
      <p className="text-xs text-gray-400">
        {t('Use one Start node as the single entry of your story graph.', 'Use one Start node as the single entry of your story graph.')}
      </p>
    </div>
  );

  const renderTrigger = () => {
    const requiredFlags = normalizeRequiredFlags(node.data.requiredFlags);
    const requiredItems = Array.isArray(node.data.requiredItems) ? node.data.requiredItems : [];

    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-200 mb-1">{t('Min Day', 'Min Day')}</label>
          <input type="number" min="1" value={node.data.minDay || 1} onChange={(e) => setData('minDay', parseInt(e.target.value, 10) || 1)} />
        </div>

        <div>
          <label className="block text-xs text-gray-200 mb-1">{t('Max Day (optional)', 'Max Day (optional)')}</label>
          <input type="number" min="1" value={node.data.maxDay ?? ''} onChange={(e) => setData('maxDay', e.target.value ? parseInt(e.target.value, 10) : null)} />
        </div>

        <div>
          <label className="block text-xs text-gray-200 mb-1">{t('Probability (%)', 'Probability (%)')}</label>
          <input
            type="number"
            min="0"
            max="100"
            value={Math.round((node.data.probability ?? 1) * 100)}
            onChange={(e) => {
              const p = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
              setData('probability', p / 100);
            }}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-200 mb-1">{t('Trigger Timing', 'Trigger Timing')}</label>
          <select
            value={node.data.timing || 'event'}
            onChange={(e) => setData('timing', e.target.value)}
          >
            <option value="status">{t('Status Phase', 'Status Phase')}</option>
            <option value="action">{t('Daily Action Phase', 'Daily Action Phase')}</option>
            <option value="event">{t('Event Phase', 'Event Phase')}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-200 mb-1">{t('Event Image', 'Event Image')}</label>
          <select
            value={node.data.eventImageId || ''}
            onChange={(e) => setData('eventImageId', e.target.value || null)}
          >
            <option value="">{t('None', 'None')}</option>
            {backgrounds.map((bg) => (
              <option key={bg.id} value={bg.id}>{bg.name}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-200">
          <input
            type="checkbox"
            checked={node.data.common === true}
            onChange={(e) => setData('common', e.target.checked)}
          />
          {t('Common Trigger (runs in selected phase)', 'Common Trigger (runs in selected phase)')}
        </label>

        <div className="space-y-2">
          {blockTitle(t('Required Flags', 'Required Flags'))}
          {requiredFlags.map((rf, idx) => (
            <div key={`${rf.flagId}-${idx}`} className="grid grid-cols-[1fr_auto_auto] gap-1">
              <select
                value={rf.flagId || ''}
                onChange={(e) => {
                  const next = [...requiredFlags];
                  next[idx] = { ...rf, flagId: e.target.value };
                  setData('requiredFlags', next);
                }}
              >
                <option value="">{t('Select flag', 'Select flag')}</option>
                {flags.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <select
                value={String(rf.value ?? true)}
                onChange={(e) => {
                  const next = [...requiredFlags];
                  next[idx] = { ...rf, value: e.target.value === 'true' };
                  setData('requiredFlags', next);
                }}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
              <button type="button" className="px-2 rounded border border-white/20 hover:bg-white/10" onClick={() => setData('requiredFlags', requiredFlags.filter((_, i) => i !== idx))}>x</button>
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" className="flex-1 py-1.5 rounded border border-white/20 hover:bg-white/10 text-sm" onClick={() => setData('requiredFlags', [...requiredFlags, { flagId: '', value: true }])}>+ {t('Add Flag Requirement', 'Add Flag Requirement')}</button>
            <button
              type="button"
              className="px-2 py-1.5 rounded border border-white/20 hover:bg-white/10 text-sm"
              onClick={() => {
                const name = window.prompt(t('New flag name', 'New flag name'));
                if (!name?.trim()) return;
                const id = addFlag(name.trim());
                setData('requiredFlags', [...requiredFlags, { flagId: id, value: true }]);
              }}
            >
              +Flag
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {blockTitle(t('Required Items', 'Required Items'))}
          {requiredItems.map((itemId, idx) => (
            <div key={`${itemId}-${idx}`} className="grid grid-cols-[1fr_auto] gap-1">
              <select
                value={itemId || ''}
                onChange={(e) => {
                  const next = [...requiredItems];
                  next[idx] = e.target.value;
                  setData('requiredItems', next);
                }}
              >
                <option value="">{t('Select item', 'Select item')}</option>
                {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <button type="button" className="px-2 rounded border border-white/20 hover:bg-white/10" onClick={() => setData('requiredItems', requiredItems.filter((_, i) => i !== idx))}>x</button>
            </div>
          ))}
          <button type="button" className="w-full py-1.5 rounded border border-white/20 hover:bg-white/10 text-sm" onClick={() => setData('requiredItems', [...requiredItems, ''])}>+ {t('Add Item Requirement', 'Add Item Requirement')}</button>
        </div>
      </div>
    );
  };

  const renderDialogue = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Text (EN)', 'Text (EN)')}</label>
        <textarea value={node.data.text || ''} onChange={(e) => setData('text', e.target.value)} rows={4} className="resize-none" />
      </div>
      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Text (KO)', 'Text (KO)')}</label>
        <textarea value={node.data.textKo || ''} onChange={(e) => setData('textKo', e.target.value)} rows={4} className="resize-none" />
      </div>
      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Character', 'Character')}</label>
        <select value={node.data.characterId || ''} onChange={(e) => setData('characterId', e.target.value || null)}>
          <option value="">{t('None', 'None')}</option>
          {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Background', 'Background')}</label>
        <select value={node.data.backgroundId || ''} onChange={(e) => setData('backgroundId', e.target.value || null)}>
          <option value="">{t('None', 'None')}</option>
          {backgrounds.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
    </div>
  );

  const renderChoice = () => {
    const choices = Array.isArray(node.data.choices) ? node.data.choices : [];
    return (
      <div className="space-y-3">
        <label className="block text-xs text-gray-200">{t('Choices', 'Choices')}</label>
        {choices.map((choice, idx) => (
          <div key={choice.id || idx} className="p-2 rounded border border-white/15 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-200">#{idx + 1}</span>
              <button type="button" className="text-xs text-red-300 hover:text-red-200" onClick={() => setData('choices', choices.filter((_, i) => i !== idx))}>{t('Remove', 'Remove')}</button>
            </div>

            <input
              type="text"
              value={choice.text || ''}
              onChange={(e) => {
                const next = [...choices];
                next[idx] = { ...choice, text: e.target.value };
                setData('choices', next);
              }}
              placeholder={t('Choice text (EN)', 'Choice text (EN)')}
            />
            <input
              type="text"
              value={choice.textKo || ''}
              onChange={(e) => {
                const next = [...choices];
                next[idx] = { ...choice, textKo: e.target.value };
                setData('choices', next);
              }}
              placeholder={t('Choice text (KO)', 'Choice text (KO)')}
            />
            <select
              value={choice.requiredItem || ''}
              onChange={(e) => {
                const next = [...choices];
                next[idx] = { ...choice, requiredItem: e.target.value || null };
                setData('choices', next);
              }}
            >
              <option value="">{t('No item required', 'No item required')}</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
        ))}

        <button
          type="button"
          className="w-full py-1.5 rounded border border-white/20 hover:bg-white/10 text-sm"
          onClick={() => setData('choices', [...choices, { id: uuidv4(), text: '', textKo: '', requiredItem: null }])}
        >
          + {t('Add Choice', 'Add Choice')}
        </button>
      </div>
    );
  };

  const renderResultSection = (parentKey, title, cls) => {
    const result = node.data[parentKey] || {};
    const statChanges = result.statChanges || {};
    const itemChanges = Array.isArray(result.itemChanges) ? result.itemChanges : [];
    const stateEffects = Array.isArray(result.stateEffects) ? result.stateEffects : [];

    return (
      <div className={`p-2 rounded border space-y-2 ${cls}`}>
        <h4 className="text-xs font-bold">{title}</h4>

        <textarea value={result.text || ''} onChange={(e) => setNested(parentKey, 'text', e.target.value)} rows={2} className="resize-none" placeholder={t('Message (EN)', 'Message (EN)')} />
        <textarea value={result.textKo || ''} onChange={(e) => setNested(parentKey, 'textKo', e.target.value)} rows={2} className="resize-none" placeholder={t('Message (KO)', 'Message (KO)')} />

        <div className="space-y-1">
          {blockTitle(t('Item Changes', 'Item Changes'))}
          {itemChanges.map((entry, idx) => (
            <div key={`${entry.itemId || 'item'}-${idx}`} className="grid grid-cols-[1fr_auto_auto] gap-1">
              <select value={entry.itemId || ''} onChange={(e) => updateNestedArrayItem(parentKey, 'itemChanges', idx, { itemId: e.target.value })}>
                <option value="">{t('Select item', 'Select item')}</option>
                {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <input
                type="number"
                className="w-20"
                value={itemAmount(entry)}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10) || 0;
                  updateNestedArrayItem(parentKey, 'itemChanges', idx, { amount: value, change: value });
                }}
              />
              <button type="button" className="px-2 rounded border border-white/20 hover:bg-white/10" onClick={() => removeNestedArrayItem(parentKey, 'itemChanges', idx)}>x</button>
            </div>
          ))}
          <button type="button" className="w-full py-1 rounded border border-white/20 hover:bg-white/10 text-xs" onClick={() => addNestedArrayItem(parentKey, 'itemChanges', { itemId: '', amount: 1, change: 1 })}>+ {t('Add Item Change', 'Add Item Change')}</button>
        </div>

        <div className="space-y-1">
          {blockTitle(t('Stat Changes', 'Stat Changes'))}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={statChanges.food ?? 0}
              onChange={(e) => {
                const next = { ...statChanges, food: parseInt(e.target.value, 10) || 0 };
                setNested(parentKey, 'statChanges', next);
              }}
              placeholder="food"
            />
            <input
              type="number"
              value={statChanges.water ?? 0}
              onChange={(e) => {
                const next = { ...statChanges, water: parseInt(e.target.value, 10) || 0 };
                setNested(parentKey, 'statChanges', next);
              }}
              placeholder="water"
            />
          </div>
          {enabledCustomStats.map((stat) => (
            <div key={stat.id} className="grid grid-cols-[1fr_auto] gap-2 items-center">
              <div className="text-xs text-gray-300 truncate">{stat.name || stat.id}</div>
              <input
                type="number"
                className="w-24"
                value={statChanges[stat.id] ?? 0}
                onChange={(e) => {
                  const next = { ...statChanges, [stat.id]: parseInt(e.target.value, 10) || 0 };
                  setNested(parentKey, 'statChanges', next);
                }}
              />
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {blockTitle(t('State Effects', 'State Effects'))}
          {stateEffects.map((entry, idx) => (
            <div key={`${entry.state || 'effect'}-${idx}`} className="p-2 rounded border border-white/15 space-y-1">
              <div className="grid grid-cols-2 gap-1">
                <select value={entry.state || 'injured'} onChange={(e) => updateNestedArrayItem(parentKey, 'stateEffects', idx, { state: e.target.value })}>
                  {STATE_OPTIONS.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
                <select value={entry.target || 'random'} onChange={(e) => updateNestedArrayItem(parentKey, 'stateEffects', idx, { target: e.target.value })}>
                  <option value="random">{t('Random', 'Random')}</option>
                  <option value="all">{t('All', 'All')}</option>
                  <option value="specific">{t('Specific', 'Specific')}</option>
                </select>
              </div>

              {(entry.target || 'random') === 'specific' && (
                <select value={entry.characterId || ''} onChange={(e) => updateNestedArrayItem(parentKey, 'stateEffects', idx, { characterId: e.target.value })}>
                  <option value="">{t('Select character', 'Select character')}</option>
                  {characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
                </select>
              )}

              <button type="button" className="text-xs text-red-300 hover:text-red-200" onClick={() => removeNestedArrayItem(parentKey, 'stateEffects', idx)}>{t('Remove Effect', 'Remove Effect')}</button>
            </div>
          ))}

          <button type="button" className="w-full py-1 rounded border border-white/20 hover:bg-white/10 text-xs" onClick={() => addNestedArrayItem(parentKey, 'stateEffects', { state: 'injured', target: 'random' })}>+ {t('Add State Effect', 'Add State Effect')}</button>
        </div>

        <div className="space-y-1">
          {blockTitle(t('Flag Changes', 'Flag Changes'))}
          <textarea
            value={formatFlagLines(result.flagChanges)}
            onChange={(e) => setNested(parentKey, 'flagChanges', parseFlagLines(e.target.value))}
            rows={3}
            className="resize-none"
            placeholder="flag_a=true&#10;flag_b=false"
          />
        </div>
      </div>
    );
  };

  const renderResult = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Success Chance (%)', 'Success Chance (%)')}</label>
        <input
          type="number"
          min="0"
          max="100"
          value={Math.round((node.data.successChance ?? 1) * 100)}
          onChange={(e) => {
            const p = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
            setData('successChance', p / 100);
          }}
        />
      </div>

      {renderResultSection('onSuccess', t('On Success', 'On Success'), 'border-green-300/30 bg-green-900/20 text-green-200')}
      {renderResultSection('onFailure', t('On Failure', 'On Failure'), 'border-red-300/30 bg-red-900/20 text-red-200')}
    </div>
  );

  const renderBranch = () => {
    const conditions = Array.isArray(node.data.conditions) ? node.data.conditions : [];
    return (
      <div className="space-y-3">
        <label className="block text-xs text-gray-200">{t('Conditions', 'Conditions')}</label>

        {conditions.map((cond, idx) => (
          <div key={cond.id || idx} className="p-2 rounded border border-white/15 space-y-2">
            <select
              value={cond.type || 'flag'}
              onChange={(e) => {
                const next = [...conditions];
                if (e.target.value === 'flag') {
                  next[idx] = { id: cond.id || uuidv4(), type: 'flag', flagId: '', value: true };
                } else if (e.target.value === 'item') {
                  next[idx] = { id: cond.id || uuidv4(), type: 'item', itemId: '' };
                } else {
                  next[idx] = { id: cond.id || uuidv4(), type: 'stat', stat: 'food', operator: '>=', value: 0 };
                }
                setData('conditions', next);
              }}
            >
              <option value="flag">{t('Flag', 'Flag')}</option>
              <option value="item">{t('Has Item', 'Has Item')}</option>
              <option value="stat">{t('Stat Check', 'Stat Check')}</option>
            </select>

            {(cond.type || 'flag') === 'flag' && (
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={cond.flagId || ''}
                  onChange={(e) => {
                    const next = [...conditions];
                    next[idx] = { ...cond, flagId: e.target.value };
                    setData('conditions', next);
                  }}
                >
                  <option value="">{t('Select flag', 'Select flag')}</option>
                  {flags.map((flag) => <option key={flag.id} value={flag.id}>{flag.name}</option>)}
                </select>
                <select
                  value={String(cond.value ?? true)}
                  onChange={(e) => {
                    const next = [...conditions];
                    next[idx] = { ...cond, value: e.target.value === 'true' };
                    setData('conditions', next);
                  }}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
            )}

            {(cond.type || 'flag') === 'item' && (
              <select
                value={cond.itemId || ''}
                onChange={(e) => {
                  const next = [...conditions];
                  next[idx] = { ...cond, itemId: e.target.value };
                  setData('conditions', next);
                }}
              >
                <option value="">{t('Select item', 'Select item')}</option>
                {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            )}

            {(cond.type || 'flag') === 'stat' && (
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={cond.stat || 'food'}
                  onChange={(e) => {
                    const next = [...conditions];
                    next[idx] = { ...cond, stat: e.target.value };
                    setData('conditions', next);
                  }}
                >
                  <option value="food">food</option>
                  <option value="water">water</option>
                  {enabledCustomStats.map((stat) => <option key={stat.id} value={stat.id}>{stat.id}</option>)}
                </select>
                <select
                  value={cond.operator || '>'}
                  onChange={(e) => {
                    const next = [...conditions];
                    next[idx] = { ...cond, operator: e.target.value };
                    setData('conditions', next);
                  }}
                >
                  <option value=">">{'>'}</option>
                  <option value=">=">{'>='}</option>
                  <option value="<">{'<'}</option>
                  <option value="<=">{'<='}</option>
                  <option value="==">{'=='}</option>
                  <option value="!=">{'!='}</option>
                </select>
                <input
                  type="number"
                  value={cond.value ?? 0}
                  onChange={(e) => {
                    const next = [...conditions];
                    next[idx] = { ...cond, value: Number(e.target.value) || 0 };
                    setData('conditions', next);
                  }}
                />
              </div>
            )}

            <button type="button" className="text-xs text-red-300 hover:text-red-200" onClick={() => setData('conditions', conditions.filter((_, i) => i !== idx))}>{t('Remove', 'Remove')}</button>
          </div>
        ))}

        <button
          type="button"
          className="w-full py-1.5 rounded border border-white/20 hover:bg-white/10 text-sm"
          onClick={() => setData('conditions', [...conditions, { id: uuidv4(), type: 'flag', flagId: '', value: true }])}
        >
          + {t('Add Condition', 'Add Condition')}
        </button>
      </div>
    );
  };

  const renderFlag = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Flag', 'Flag')}</label>
        <div className="flex gap-2">
          <select value={node.data.flagId || ''} onChange={(e) => setData('flagId', e.target.value)} className="flex-1">
            <option value="">{t('Select flag', 'Select flag')}</option>
            {flags.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button
            type="button"
            className="px-2 py-1 rounded border border-white/20 hover:bg-white/10 text-xs"
            onClick={() => {
              const name = window.prompt(t('New flag name', 'New flag name'));
              if (!name?.trim()) return;
              const id = addFlag(name.trim());
              setData('flagId', id);
            }}
          >
            +Flag
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Value', 'Value')}</label>
        <select value={String(node.data.value ?? true)} onChange={(e) => setData('value', e.target.value === 'true')}>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Text (EN)', 'Text (EN)')}</label>
        <textarea value={node.data.text || ''} onChange={(e) => setData('text', e.target.value)} rows={3} className="resize-none" />
      </div>

      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Text (KO)', 'Text (KO)')}</label>
        <textarea value={node.data.textKo || ''} onChange={(e) => setData('textKo', e.target.value)} rows={3} className="resize-none" />
      </div>
    </div>
  );

  const renderNote = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Title', '제목')}</label>
        <input
          type="text"
          value={node.data.title || ''}
          onChange={(e) => setData('title', e.target.value)}
          placeholder={t('Short title for this note', '이 노트의 짧은 제목')}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Note (EN)', '노트 (영문)')}</label>
        <textarea
          value={node.data.text || ''}
          onChange={(e) => setData('text', e.target.value)}
          rows={5}
          className="resize-none"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Note (KO)', '노트 (국문)')}</label>
        <textarea
          value={node.data.textKo || ''}
          onChange={(e) => setData('textKo', e.target.value)}
          rows={5}
          className="resize-none"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Highlight Color', '강조 색상')}</label>
        <input
          type="color"
          value={node.data.noteColor || '#d8b34f'}
          onChange={(e) => setData('noteColor', e.target.value)}
          className="h-9 w-full rounded border border-white/20 bg-transparent"
        />
      </div>

      <p className="text-xs text-gray-400">
        {t(
          'Notes are for design documentation and teammate communication. They are ignored by story validation.',
          '노트는 기획/협업 설명용입니다. 스토리 진행 검증에서 제외됩니다.'
        )}
      </p>
    </div>
  );

  const renderEnding = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Ending Key', 'Ending Key')}</label>
        <input
          type="text"
          value={node.data.endingKey || ''}
          onChange={(e) => setData('endingKey', e.target.value)}
          placeholder={t('e.g. true_ending', 'e.g. true_ending')}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Victory?', 'Victory?')}</label>
        <select value={String(node.data.victory !== false)} onChange={(e) => setData('victory', e.target.value === 'true')}>
          <option value="true">{t('Victory', 'Victory')}</option>
          <option value="false">{t('Defeat', 'Defeat')}</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Ending Title (EN)', 'Ending Title (EN)')}</label>
        <input
          type="text"
          value={node.data.title || ''}
          onChange={(e) => setData('title', e.target.value)}
          placeholder={t('Ending title', 'Ending title')}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Ending Title (KO)', 'Ending Title (KO)')}</label>
        <input
          type="text"
          value={node.data.titleKo || ''}
          onChange={(e) => setData('titleKo', e.target.value)}
          placeholder={t('Optional', 'Optional')}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Ending Description (EN)', 'Ending Description (EN)')}</label>
        <textarea
          value={node.data.reason || ''}
          onChange={(e) => setData('reason', e.target.value)}
          rows={3}
          className="resize-none"
          placeholder={t('Shown on game-over screen', 'Shown on game-over screen')}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-200 mb-1">{t('Ending Description (KO)', 'Ending Description (KO)')}</label>
        <textarea
          value={node.data.reasonKo || ''}
          onChange={(e) => setData('reasonKo', e.target.value)}
          rows={3}
          className="resize-none"
          placeholder={t('Optional', 'Optional')}
        />
      </div>
    </div>
  );

  const nodeTypeLabel = () => {
    const labels = {
      start: { en: 'Start Node', ko: '시작 노드' },
      trigger: { en: 'Trigger Node', ko: '트리거 노드' },
      dialogue: { en: 'Dialogue Node', ko: '대화 노드' },
      choice: { en: 'Choice Node', ko: '선택지 노드' },
      result: { en: 'Result Node', ko: '결과 노드' },
      branch: { en: 'Branch Node', ko: '분기 노드' },
      flag: { en: 'Flag Node', ko: '플래그 노드' },
      note: { en: 'Note Node', ko: '노트 노드' },
      ending: { en: 'Ending Node', ko: '엔딩 노드' },
    };
    return labels[node.data.type]?.[language] || node.data.type;
  };

  return (
    <div className="editor-sidebar node-inspector overflow-y-auto">
      <div className="p-3 border-b border-[#ffffff22]">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-[#f4d03f]">{nodeTypeLabel()}</h3>
          <button onClick={() => deleteNode(node.id)} className="text-xs px-2 py-1 bg-red-900/50 text-red-400 hover:bg-red-900 rounded">
            {t('Delete', '삭제')}
          </button>
        </div>
        <p className="text-xs text-gray-300 mt-1">ID: {node.id.substring(0, 8)}...</p>
      </div>

      <div className="p-3">
        {renderLabel()}
        {node.data.type === 'start' && renderStart()}
        {node.data.type === 'trigger' && renderTrigger()}
        {node.data.type === 'dialogue' && renderDialogue()}
        {node.data.type === 'choice' && renderChoice()}
        {node.data.type === 'result' && renderResult()}
        {node.data.type === 'branch' && renderBranch()}
        {node.data.type === 'flag' && renderFlag()}
        {node.data.type === 'note' && renderNote()}
        {node.data.type === 'ending' && renderEnding()}
      </div>
    </div>
  );
}
