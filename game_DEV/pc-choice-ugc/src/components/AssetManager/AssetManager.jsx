import { useState } from 'react';
import { useAssetStore } from '../../stores/assetStore';
import { useEditorStore } from '../../stores/editorStore';
import { fileToBase64, resizeImage } from '../../db/database';
import { pickLocalized } from '../../utils/i18n';

const TABS = [
  { id: 'characters', label: 'Characters', labelKo: '캐릭터' },
  { id: 'items', label: 'Items', labelKo: '아이템' },
  { id: 'backgrounds', label: 'Backgrounds', labelKo: '배경' },
  { id: 'stats', label: 'Stats', labelKo: '스탯' },
  { id: 'flags', label: 'Flags', labelKo: '플래그' },
  { id: 'layout', label: 'Layout', labelKo: '레이아웃' },
  { id: 'settings', label: 'Settings', labelKo: '설정' },
];

const CHARACTER_STATES = [
  { key: 'normal', label: 'Normal', labelKo: '정상' },
  { key: 'sick', label: 'Sick', labelKo: '아픔' },
  { key: 'insane', label: 'Insane', labelKo: '불안정' },
  { key: 'dead', label: 'Dead', labelKo: '사망' },
];

const ITEM_CATEGORIES = [
  { value: 'food', label: 'Food', labelKo: '식량' },
  { value: 'water', label: 'Water', labelKo: '물' },
  { value: 'medical', label: 'Medical', labelKo: '의료' },
  { value: 'tool', label: 'Tool', labelKo: '도구' },
  { value: 'weapon', label: 'Weapon', labelKo: '무기' },
  { value: 'misc', label: 'Misc', labelKo: '기타' },
];

const ITEM_EFFECTS = [
  { key: 'food', label: 'Food +', labelKo: '식량 +', type: 'number' },
  { key: 'water', label: 'Water +', labelKo: '물 +', type: 'number' },
  { key: 'hunger', label: 'Hunger -', labelKo: '배고픔 -', type: 'number' },
  { key: 'thirst', label: 'Thirst -', labelKo: '갈증 -', type: 'number' },
  { key: 'sanity', label: 'Sanity +', labelKo: '정신력 +', type: 'number' },
  { key: 'heal', label: 'Heals', labelKo: '치유', type: 'boolean' },
  { key: 'consumable', label: 'Consumable', labelKo: '소모성', type: 'boolean' },
];

export default function AssetManager({ language }) {
  const [activeTab, setActiveTab] = useState('characters');
  const [newName, setNewName] = useState('');

  const {
    characters,
    items,
    backgrounds,
    addCharacter,
    updateCharacter,
    setPlayerCharacter,
    setCharacterImage,
    deleteCharacter,
    addItem,
    updateItem,
    setItemIcon,
    deleteItem,
    addBackground,
    updateBackground,
    setBackgroundImage,
    deleteBackground,
  } = useAssetStore();

  const {
    flags, addFlag, updateFlag, deleteFlag,
    customStats, addCustomStat, updateCustomStat, deleteCustomStat, toggleStatEnabled,
    globalStats, setGlobalStats, projectMeta, setProjectMeta,
    layoutSettings, updateLayoutSettings, resetLayoutSettings, setLayoutImage,
    soundSettings, setSoundSettings,
  } = useEditorStore();

  const t = (en, ko) => pickLocalized(language, en, ko);
  const tagsToText = (tags) => (Array.isArray(tags) ? tags.join(', ') : '');
  const parseTags = (value) =>
    String(value || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

  const handleImageUpload = async (file, callback) => {
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      const resized = await resizeImage(base64, 256, 256);
      callback(resized);
    } catch (error) {
      console.error('Failed to process image:', error);
      alert(t('Failed to upload image', '이미지 업로드 실패'));
    }
  };

  const renderCharactersTab = () => (
    <div className="space-y-4">
      {/* Add new character */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('Character name', '캐릭터 이름')}
          className="flex-1 px-3 py-2 bg-[#333] border border-[#555] rounded"
        />
        <button
          onClick={() => {
            if (newName.trim()) {
              addCharacter(newName.trim());
              setNewName('');
            }
          }}
          className="px-4 py-2 bg-[#2ecc71] hover:bg-[#27ae60] rounded font-medium"
        >
          + {t('Add', '추가')}
        </button>
      </div>

      {/* Character list */}
      <div className="space-y-4">
        {characters.map((char) => (
          <div key={char.id} className="p-4 bg-[#333] rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="text"
                  value={char.name}
                  onChange={(e) => updateCharacter(char.id, { name: e.target.value })}
                  className="text-lg font-bold bg-transparent border-b border-transparent hover:border-[#555] focus:border-[#f4d03f] outline-none"
                />
                {char.isPlayer && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[#334155] text-[#93c5fd]">
                    {t('YOU', '주체')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPlayerCharacter(char.id)}
                  className={`text-xs px-2 py-1 rounded border ${
                    char.isPlayer
                      ? 'border-[#93c5fd] text-[#93c5fd] bg-[#1e293b]'
                      : 'border-[#555] text-gray-300 hover:border-[#93c5fd]'
                  }`}
                >
                  {char.isPlayer ? t('Main Subject', '현재 주체') : t('Set as Subject', '주체로 설정')}
                </button>
                <button
                  onClick={() => deleteCharacter(char.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  {t('Delete', '삭제')}
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs text-gray-400 mb-1">
                {t('Tags (comma separated)', '태그 (콤마로 구분)')}
              </label>
              <input
                type="text"
                value={tagsToText(char.tags)}
                onChange={(e) => updateCharacter(char.id, { tags: parseTags(e.target.value) })}
                placeholder={t('person, female, subculture', '사람, 여성, 서브컬쳐')}
                className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded text-xs"
              />
              {Array.isArray(char.tags) && char.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {char.tags.map((tag) => (
                    <span key={`${char.id}-${tag}`} className="text-[10px] px-1.5 py-0.5 rounded bg-[#243042] text-[#b6d5ff]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* State images */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CHARACTER_STATES.map((state) => (
                <div key={state.key} className="text-center">
                  <div className="text-xs text-gray-400 mb-1">
                    {t(state.label, state.labelKo)}
                  </div>
                  <label className="block w-16 h-16 mx-auto bg-[#2a2a2a] rounded-lg cursor-pointer overflow-hidden border-2 border-dashed border-[#555] hover:border-[#f4d03f]">
                    {char.images?.[state.key] ? (
                      <img
                        src={char.images[state.key]}
                        alt={state.label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-gray-600">+</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        handleImageUpload(e.target.files?.[0], (data) => {
                          setCharacterImage(char.id, state.key, data);
                        });
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-gray-400">{t('Hunger Days', '굶주림 한계(일)')}</label>
                <input
                  type="number"
                  min="1"
                  value={char.stats?.hungerThreshold || 10}
                  onChange={(e) =>
                    updateCharacter(char.id, {
                      stats: { ...char.stats, hungerThreshold: parseInt(e.target.value) || 10 },
                    })
                  }
                  className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded"
                />
              </div>
              <div>
                <label className="text-gray-400">{t('Thirst Days', '갈증 한계(일)')}</label>
                <input
                  type="number"
                  min="1"
                  value={char.stats?.thirstThreshold || 5}
                  onChange={(e) =>
                    updateCharacter(char.id, {
                      stats: { ...char.stats, thirstThreshold: parseInt(e.target.value) || 5 },
                    })
                  }
                  className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded"
                />
              </div>
              <div>
                <label className="text-gray-400">{t('Sanity Threshold', '정신력 한계')}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={char.stats?.sanityThreshold || 20}
                  onChange={(e) =>
                    updateCharacter(char.id, {
                      stats: { ...char.stats, sanityThreshold: parseInt(e.target.value) || 20 },
                    })
                  }
                  className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded"
                />
              </div>
            </div>
          </div>
        ))}

        {characters.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            {t('No characters yet. Add your first character above.', '캐릭터가 없습니다. 위에서 첫 캐릭터를 추가하세요.')}
          </div>
        )}
      </div>
    </div>
  );

  const renderItemsTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('Item name', '아이템 이름')}
          className="flex-1 px-3 py-2 bg-[#333] border border-[#555] rounded"
        />
        <button
          onClick={() => {
            if (newName.trim()) {
              addItem(newName.trim());
              setNewName('');
            }
          }}
          className="px-4 py-2 bg-[#2ecc71] hover:bg-[#27ae60] rounded font-medium"
        >
          + {t('Add', '추가')}
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="p-3 bg-[#333] rounded-lg">
            <div className="flex gap-3 mb-3">
              <label className="w-12 h-12 bg-[#2a2a2a] rounded cursor-pointer overflow-hidden border border-dashed border-[#555] hover:border-[#f4d03f] flex-shrink-0">
                {item.icon ? (
                  <img src={item.icon} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl text-gray-600">+</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleImageUpload(e.target.files?.[0], (data) => setItemIcon(item.id, data));
                  }}
                />
              </label>

              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  className="w-full bg-transparent font-medium outline-none border-b border-transparent hover:border-[#555] focus:border-[#f4d03f]"
                />
                <select
                  value={item.category || 'misc'}
                  onChange={(e) => updateItem(item.id, { category: e.target.value })}
                  className="mt-1 w-full px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded text-xs"
                >
                  {ITEM_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {t(cat.label, cat.labelKo)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => deleteItem(item.id)}
                className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-400/35"
              >
                {t('Delete', '삭제')}
              </button>
            </div>

            {/* Item Effects */}
            <div className="bg-[#2a2a2a] p-2 rounded">
              <div className="text-xs text-gray-400 mb-2">{t('Effects (when used)', '효과 (사용 시)')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {ITEM_EFFECTS.map((effect) => (
                  <div key={effect.key} className="flex items-center gap-1">
                    {effect.type === 'boolean' ? (
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.effects?.[effect.key] || false}
                          onChange={(e) => {
                            const effects = { ...item.effects, [effect.key]: e.target.checked };
                            updateItem(item.id, { effects });
                          }}
                          className="rounded"
                        />
                        {t(effect.label, effect.labelKo)}
                      </label>
                    ) : (
                      <>
                        <span className="text-xs text-gray-400">{t(effect.label, effect.labelKo)}</span>
                        <input
                          type="number"
                          value={item.effects?.[effect.key] || 0}
                          onChange={(e) => {
                            const effects = { ...item.effects, [effect.key]: parseInt(e.target.value) || 0 };
                            updateItem(item.id, { effects });
                          }}
                          className="w-12 px-1 py-0.5 bg-[#333] border border-[#444] rounded text-xs text-center"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          {t('No items yet.', '아이템이 없습니다.')}
        </div>
      )}
    </div>
  );

  const renderBackgroundsTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('Background name', '배경 이름')}
          className="flex-1 px-3 py-2 bg-[#333] border border-[#555] rounded"
        />
        <button
          onClick={() => {
            if (newName.trim()) {
              addBackground(newName.trim());
              setNewName('');
            }
          }}
          className="px-4 py-2 bg-[#2ecc71] hover:bg-[#27ae60] rounded font-medium"
        >
          + {t('Add', '추가')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {backgrounds.map((bg) => (
          <div key={bg.id} className="bg-[#333] rounded-lg overflow-hidden">
            <label className="block aspect-video bg-[#2a2a2a] cursor-pointer overflow-hidden border-2 border-dashed border-[#555] hover:border-[#f4d03f]">
              {bg.image ? (
                <img src={bg.image} alt={bg.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-gray-600">+</div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleImageUpload(e.target.files?.[0], (data) => setBackgroundImage(bg.id, data));
                }}
              />
            </label>
            <div className="p-2 flex justify-between items-center">
              <input
                type="text"
                value={bg.name}
                onChange={(e) => updateBackground(bg.id, { name: e.target.value })}
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button onClick={() => deleteBackground(bg.id)} className="text-red-400 hover:text-red-300">X</button>
            </div>
            <div className="px-2 pb-2">
              <input
                type="text"
                value={tagsToText(bg.tags)}
                onChange={(e) => updateBackground(bg.id, { tags: parseTags(e.target.value) })}
                placeholder={t('background, subculture, indoor', '배경, 서브컬쳐, 실내')}
                className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded text-xs"
              />
              {Array.isArray(bg.tags) && bg.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {bg.tags.map((tag) => (
                    <span key={`${bg.id}-${tag}`} className="text-[10px] px-1.5 py-0.5 rounded bg-[#2f2a45] text-[#d7c9ff]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {backgrounds.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          {t('No backgrounds yet.', '배경이 없습니다.')}
        </div>
      )}
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('Stat name', '스탯 이름')}
          className="flex-1 px-3 py-2 bg-[#333] border border-[#555] rounded"
        />
        <button
          onClick={() => {
            if (newName.trim()) {
              addCustomStat(newName.trim());
              setNewName('');
            }
          }}
          className="px-4 py-2 bg-[#2ecc71] hover:bg-[#27ae60] rounded font-medium"
        >
          + {t('Add', '추가')}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        {t(
          'Stats are tracked per character. Enable/disable stats for your game, set min/max values, and daily changes.',
          '스탯은 캐릭터별로 추적됩니다. 게임에서 사용할 스탯을 활성화하거나 비활성화하고, 최소/최대값과 일일 변화량을 설정하세요.'
        )}
      </p>

      <div className="space-y-3">
        {customStats.map((stat) => (
          <div
            key={stat.id}
            className={`p-4 rounded-lg border-2 transition-colors ${
              stat.enabled
                ? 'bg-[#333] border-[#555]'
                : 'bg-[#2a2a2a] border-[#333] opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleStatEnabled(stat.id)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    stat.enabled ? 'bg-[#2ecc71]' : 'bg-[#555]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      stat.enabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
                <input
                  type="text"
                  value={stat.icon}
                  onChange={(e) => updateCustomStat(stat.id, { icon: e.target.value })}
                  className="w-10 text-center bg-transparent text-xl"
                  title={t('Icon (emoji)', '아이콘(이모지)')}
                />
                <div>
                  <input
                    type="text"
                    value={stat.name}
                    onChange={(e) => updateCustomStat(stat.id, { name: e.target.value })}
                    className="bg-transparent font-bold outline-none border-b border-transparent hover:border-[#555] focus:border-[#f4d03f]"
                    placeholder="Name (EN)"
                  />
                  <input
                    type="text"
                    value={stat.nameKo}
                    onChange={(e) => updateCustomStat(stat.id, { nameKo: e.target.value })}
                    className="ml-2 bg-transparent text-gray-400 text-sm outline-none border-b border-transparent hover:border-[#555] focus:border-[#f4d03f]"
                    placeholder="이름 (KR)"
                  />
                </div>
              </div>
              <button
                onClick={() => deleteCustomStat(stat.id)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                {t('Delete', '삭제')}
              </button>
            </div>

            {stat.enabled && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">{t('Min', '최소')}</label>
                  <input
                    type="number"
                    value={stat.min}
                    onChange={(e) => updateCustomStat(stat.id, { min: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">{t('Max', '최대')}</label>
                  <input
                    type="number"
                    value={stat.max}
                    onChange={(e) => updateCustomStat(stat.id, { max: parseInt(e.target.value) || 100 })}
                    className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">{t('Default', '기본값')}</label>
                  <input
                    type="number"
                    value={stat.defaultValue}
                    onChange={(e) => updateCustomStat(stat.id, { defaultValue: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">{t('Daily Change', '일일 변화량')}</label>
                  <input
                    type="number"
                    value={stat.dailyChange}
                    onChange={(e) => updateCustomStat(stat.id, { dailyChange: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">{t('Critical', '위험 한계')}</label>
                  <input
                    type="number"
                    value={stat.criticalThreshold}
                    onChange={(e) => updateCustomStat(stat.id, { criticalThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">{t('Death Days', '사망 일수')}</label>
                  <input
                    type="number"
                    min="0"
                    value={stat.deathDays}
                    onChange={(e) => updateCustomStat(stat.id, { deathDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded"
                    title={t('0 = no death', '0 = 사망 없음')}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">{t('Direction', '방향')}</label>
                  <select
                    value={stat.direction}
                    onChange={(e) => updateCustomStat(stat.id, { direction: e.target.value })}
                    className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded"
                  >
                    <option value="up">{t('Increases (bad when high)', '증가 (높을수록 위험)')}</option>
                    <option value="down">{t('Decreases (bad when low)', '감소 (낮을수록 위험)')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">{t('Color', '색상')}</label>
                  <input
                    type="color"
                    value={stat.color}
                    onChange={(e) => updateCustomStat(stat.id, { color: e.target.value })}
                    className="w-full h-7 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {customStats.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          {t('No stats defined. Add stats to track character conditions.', '스탯이 없습니다. 캐릭터 상태 추적용 스탯을 추가하세요.')}
        </div>
      )}
    </div>
  );

  const renderFlagsTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('Flag name (e.g., rescue_route_started)', '플래그 이름 (예: rescue_route_started)')}
          className="flex-1 px-3 py-2 bg-[#333] border border-[#555] rounded"
        />
        <button
          onClick={() => {
            if (newName.trim()) {
              addFlag(newName.trim());
              setNewName('');
            }
          }}
          className="px-4 py-2 bg-[#2ecc71] hover:bg-[#27ae60] rounded font-medium"
        >
          + {t('Add', '추가')}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        {t(
          'Flags are boolean variables used to track quest progress. Use them in Trigger and Branch nodes.',
          '플래그는 퀘스트 진행 상태를 추적하는 불리언 변수입니다. 트리거와 분기 노드에서 사용하세요.'
        )}
      </p>

      <div className="space-y-2">
        {flags.map((flag) => (
          <div key={flag.id} className="flex items-center gap-3 p-3 bg-[#333] rounded">
            <span className="text-[#f4d03f]">F</span>
            <input
              type="text"
              value={flag.name}
              onChange={(e) => updateFlag(flag.id, { name: e.target.value })}
              className="flex-1 bg-transparent outline-none"
            />
            <label className="flex items-center gap-1 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={flag.defaultValue}
                onChange={(e) => updateFlag(flag.id, { defaultValue: e.target.checked })}
                className="rounded"
              />
              {t('Default: true', '기본값: true')}
            </label>
            <button onClick={() => deleteFlag(flag.id)} className="text-red-400 hover:text-red-300">X</button>
          </div>
        ))}
      </div>

      {flags.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          {t('No flags yet. Flags are useful for multi-part quest chains.', '플래그가 없습니다. 연속 퀘스트 구성에 유용합니다.')}
        </div>
      )}
    </div>
  );

  const handleLayoutImageUpload = async (file, section) => {
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      const resized = await resizeImage(base64, 512, 512);
      setLayoutImage(section, resized);
    } catch (error) {
      console.error('Failed to process image:', error);
      alert(t('Failed to upload image', '이미지 업로드 실패'));
    }
  };

  const handleGameOverImageUpload = async (file, key) => {
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      const resized = await resizeImage(base64, 1024, 1024);
      updateLayoutSettings('gameOverScreen', { [key]: resized });
    } catch (error) {
      console.error('Failed to process game over image:', error);
      alert(t('Failed to upload image', '이미지 업로드 실패'));
    }
  };

  const renderLayoutTab = () => (
    <div className="space-y-6">
      {/* Reset button */}
      <div className="flex justify-end">
        <button
          onClick={resetLayoutSettings}
          className="px-4 py-2 bg-[#555] hover:bg-[#666] rounded text-sm"
        >
          {t('Reset to Default', '기본값으로 초기화')}
        </button>
      </div>

      {/* Theme Colors */}
      <div className="bg-[#333] p-4 rounded-lg">
        <h3 className="font-bold text-[#f4d03f] mb-3">{t('Theme Colors', '테마 색상')}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Primary', '기본 강조')}</label>
            <input
              type="color"
              value={layoutSettings.theme.primaryColor}
              onChange={(e) => updateLayoutSettings('theme', { primaryColor: e.target.value })}
              className="w-full h-8 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Background', '배경')}</label>
            <input
              type="color"
              value={layoutSettings.theme.backgroundColor}
              onChange={(e) => updateLayoutSettings('theme', { backgroundColor: e.target.value })}
              className="w-full h-8 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Panel', '패널')}</label>
            <input
              type="color"
              value={layoutSettings.theme.panelColor}
              onChange={(e) => updateLayoutSettings('theme', { panelColor: e.target.value })}
              className="w-full h-8 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Border', '테두리')}</label>
            <input
              type="color"
              value={layoutSettings.theme.borderColor}
              onChange={(e) => updateLayoutSettings('theme', { borderColor: e.target.value })}
              className="w-full h-8 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Text', '텍스트')}</label>
            <input
              type="color"
              value={layoutSettings.theme.textColor}
              onChange={(e) => updateLayoutSettings('theme', { textColor: e.target.value })}
              className="w-full h-8 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Danger', '위험')}</label>
            <input
              type="color"
              value={layoutSettings.theme.dangerColor}
              onChange={(e) => updateLayoutSettings('theme', { dangerColor: e.target.value })}
              className="w-full h-8 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Success', '성공')}</label>
            <input
              type="color"
              value={layoutSettings.theme.successColor}
              onChange={(e) => updateLayoutSettings('theme', { successColor: e.target.value })}
              className="w-full h-8 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Warning', '경고')}</label>
            <input
              type="color"
              value={layoutSettings.theme.warningColor}
              onChange={(e) => updateLayoutSettings('theme', { warningColor: e.target.value })}
              className="w-full h-8 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Character Panel */}
      <div className="bg-[#333] p-4 rounded-lg">
        <h3 className="font-bold text-[#f4d03f] mb-3">{t('Character Panel', '캐릭터 패널')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Position', '위치')}</label>
            <select
              value={layoutSettings.characterPanel.position}
              onChange={(e) => updateLayoutSettings('characterPanel', { position: e.target.value })}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded"
            >
              <option value="left">{t('Left', '왼쪽')}</option>
              <option value="right">{t('Right', '오른쪽')}</option>
              <option value="hidden">{t('Hidden', '숨김')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Width (px)', '너비 (px)')}</label>
            <input
              type="number"
              min="150"
              max="400"
              value={layoutSettings.characterPanel.width}
              onChange={(e) => updateLayoutSettings('characterPanel', { width: parseInt(e.target.value) || 256 })}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Stats Display', '스탯 표시')}</label>
            <select
              value={layoutSettings.characterPanel.statsDisplayStyle}
              onChange={(e) => updateLayoutSettings('characterPanel', { statsDisplayStyle: e.target.value })}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded"
            >
              <option value="bar">{t('Progress Bar', '진행 바')}</option>
              <option value="number">{t('Number Only', '숫자만')}</option>
              <option value="icon">{t('Icon + Number', '아이콘 + 숫자')}</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={layoutSettings.characterPanel.showStats}
              onChange={(e) => updateLayoutSettings('characterPanel', { showStats: e.target.checked })}
              className="rounded"
            />
            {t('Show Stats', '스탯 표시')}
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={layoutSettings.characterPanel.showStateEffects}
              onChange={(e) => updateLayoutSettings('characterPanel', { showStateEffects: e.target.checked })}
              className="rounded"
            />
            {t('Show State Effects', '상태 효과 표시')}
          </label>
        </div>
        <div className="mt-3">
          <label className="block text-xs text-gray-400 mb-1">{t('Background Image', '배경 이미지')}</label>
          <div className="flex items-center gap-3">
            <label className="w-20 h-20 bg-[#2a2a2a] rounded cursor-pointer overflow-hidden border-2 border-dashed border-[#555] hover:border-[#f4d03f] flex-shrink-0">
              {layoutSettings.characterPanel.backgroundImage ? (
                <img src={layoutSettings.characterPanel.backgroundImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl text-gray-600">+</div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLayoutImageUpload(e.target.files?.[0], 'characterPanel')}
              />
            </label>
            {layoutSettings.characterPanel.backgroundImage && (
              <button
                onClick={() => updateLayoutSettings('characterPanel', { backgroundImage: null })}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                {t('Remove', '제거')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Panel */}
      <div className="bg-[#333] p-4 rounded-lg">
        <h3 className="font-bold text-[#f4d03f] mb-3">{t('Inventory Panel', '인벤토리 패널')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Position', '위치')}</label>
            <select
              value={layoutSettings.inventoryPanel.position}
              onChange={(e) => updateLayoutSettings('inventoryPanel', { position: e.target.value })}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded"
            >
              <option value="left">{t('Left', '왼쪽')}</option>
              <option value="right">{t('Right', '오른쪽')}</option>
              <option value="hidden">{t('Hidden', '숨김')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Width (px)', '너비 (px)')}</label>
            <input
              type="number"
              min="150"
              max="400"
              value={layoutSettings.inventoryPanel.width}
              onChange={(e) => updateLayoutSettings('inventoryPanel', { width: parseInt(e.target.value) || 224 })}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={layoutSettings.inventoryPanel.showResourceCounts}
                onChange={(e) => updateLayoutSettings('inventoryPanel', { showResourceCounts: e.target.checked })}
                className="rounded"
              />
              {t('Show Resources', '자원 표시')}
            </label>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs text-gray-400 mb-1">{t('Background Image', '배경 이미지')}</label>
          <div className="flex items-center gap-3">
            <label className="w-20 h-20 bg-[#2a2a2a] rounded cursor-pointer overflow-hidden border-2 border-dashed border-[#555] hover:border-[#f4d03f] flex-shrink-0">
              {layoutSettings.inventoryPanel.backgroundImage ? (
                <img src={layoutSettings.inventoryPanel.backgroundImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl text-gray-600">+</div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLayoutImageUpload(e.target.files?.[0], 'inventoryPanel')}
              />
            </label>
            {layoutSettings.inventoryPanel.backgroundImage && (
              <button
                onClick={() => updateLayoutSettings('inventoryPanel', { backgroundImage: null })}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                {t('Remove', '제거')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Event Panel */}
      <div className="bg-[#333] p-4 rounded-lg">
        <h3 className="font-bold text-[#f4d03f] mb-3">{t('Event Panel', '이벤트 패널')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Max Width (px)', '최대 너비 (px)')}</label>
            <input
              type="number"
              min="400"
              max="1200"
              value={layoutSettings.eventPanel.maxWidth}
              onChange={(e) => updateLayoutSettings('eventPanel', { maxWidth: parseInt(e.target.value) || 672 })}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Dialogue Style', '대화 스타일')}</label>
            <select
              value={layoutSettings.eventPanel.dialogueBoxStyle}
              onChange={(e) => updateLayoutSettings('eventPanel', { dialogueBoxStyle: e.target.value })}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded"
            >
              <option value="modern">{t('Modern', '모던')}</option>
              <option value="classic">{t('Classic', '클래식')}</option>
              <option value="minimal">{t('Minimal', '미니멀')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Portrait Size (px)', '초상 크기 (px)')}</label>
            <input
              type="number"
              min="32"
              max="128"
              value={layoutSettings.eventPanel.portraitSize}
              onChange={(e) => updateLayoutSettings('eventPanel', { portraitSize: parseInt(e.target.value) || 48 })}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={layoutSettings.eventPanel.showCharacterPortrait}
              onChange={(e) => updateLayoutSettings('eventPanel', { showCharacterPortrait: e.target.checked })}
              className="rounded"
            />
            {t('Show Character Portrait', '캐릭터 초상 표시')}
          </label>
        </div>
        <div className="mt-3">
          <label className="block text-xs text-gray-400 mb-1">{t('Dialogue Box Background', '대화 박스 배경')}</label>
          <input
            type="color"
            value={layoutSettings.eventPanel.backgroundColor}
            onChange={(e) => updateLayoutSettings('eventPanel', { backgroundColor: e.target.value })}
            className="w-16 h-8 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Choice Buttons */}
      <div className="bg-[#333] p-4 rounded-lg">
        <h3 className="font-bold text-[#f4d03f] mb-3">{t('Choice Buttons', '선택 버튼')}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Background', '배경')}</label>
            <input
              type="color"
              value={layoutSettings.choiceButtons.backgroundColor}
              onChange={(e) => updateLayoutSettings('choiceButtons', { backgroundColor: e.target.value })}
              className="w-full h-8 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Hover', '호버')}</label>
            <input
              type="color"
              value={layoutSettings.choiceButtons.hoverColor}
              onChange={(e) => updateLayoutSettings('choiceButtons', { hoverColor: e.target.value })}
              className="w-full h-8 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Border', '테두리')}</label>
            <input
              type="color"
              value={layoutSettings.choiceButtons.borderColor}
              onChange={(e) => updateLayoutSettings('choiceButtons', { borderColor: e.target.value })}
              className="w-full h-8 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Border Radius', '모서리')}</label>
            <input
              type="number"
              min="0"
              max="20"
              value={layoutSettings.choiceButtons.borderRadius}
              onChange={(e) => updateLayoutSettings('choiceButtons', { borderRadius: parseInt(e.target.value) || 4 })}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded"
            />
          </div>
        </div>
      </div>

      {/* Game Over Screen */}
      <div className="bg-[#333] p-4 rounded-lg">
        <h3 className="font-bold text-[#f4d03f] mb-3">{t('Game Over Screen', '게임 오버 화면')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Victory Background', '승리 배경')}</label>
            <input
              type="color"
              value={layoutSettings.gameOverScreen.victoryBackgroundColor}
              onChange={(e) => updateLayoutSettings('gameOverScreen', { victoryBackgroundColor: e.target.value })}
              className="w-full h-8 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Defeat Background', '패배 배경')}</label>
            <input
              type="color"
              value={layoutSettings.gameOverScreen.defeatBackgroundColor}
              onChange={(e) => updateLayoutSettings('gameOverScreen', { defeatBackgroundColor: e.target.value })}
              className="w-full h-8 bg-[#2a2a2a] border border-[#444] rounded cursor-pointer"
            />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Victory Image', '승리 이미지')}</label>
            <div className="flex items-center gap-3">
              <label className="w-20 h-20 bg-[#2a2a2a] rounded cursor-pointer overflow-hidden border-2 border-dashed border-[#555] hover:border-[#f4d03f]">
                {layoutSettings.gameOverScreen.victoryImage ? (
                  <img src={layoutSettings.gameOverScreen.victoryImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl text-gray-600">+</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleGameOverImageUpload(e.target.files?.[0], 'victoryImage')}
                />
              </label>
              {layoutSettings.gameOverScreen.victoryImage && (
                <button
                  onClick={() => updateLayoutSettings('gameOverScreen', { victoryImage: null })}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  {t('Remove', '제거')}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Defeat Image', '패배 이미지')}</label>
            <div className="flex items-center gap-3">
              <label className="w-20 h-20 bg-[#2a2a2a] rounded cursor-pointer overflow-hidden border-2 border-dashed border-[#555] hover:border-[#f4d03f]">
                {layoutSettings.gameOverScreen.defeatImage ? (
                  <img src={layoutSettings.gameOverScreen.defeatImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl text-gray-600">+</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleGameOverImageUpload(e.target.files?.[0], 'defeatImage')}
                />
              </label>
              {layoutSettings.gameOverScreen.defeatImage && (
                <button
                  onClick={() => updateLayoutSettings('gameOverScreen', { defeatImage: null })}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  {t('Remove', '제거')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview hint */}
      <div className="bg-[#2a3a4a] p-4 rounded-lg text-center">
        <p className="text-sm text-gray-300">
          {t('Run a playtest to see your layout changes in action!', '플레이테스트를 실행해 레이아웃 변경 사항을 확인하세요.')}
        </p>
      </div>
    </div>
  );

    const renderSettingsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-[#f4d03f] mb-3">{t('Project Info', '프로젝트 정보')}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Title', '제목')}</label>
            <input
              type="text"
              value={projectMeta.title}
              onChange={(e) => setProjectMeta({ title: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] border border-[#555] rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Author', '작성자')}</label>
            <input
              type="text"
              value={projectMeta.author}
              onChange={(e) => setProjectMeta({ author: e.target.value })}
              className="w-full px-3 py-2 bg-[#333] border border-[#555] rounded"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-[#f4d03f] mb-3">{t('Game Settings', '게임 설정')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Starting Food', '시작 식량')}</label>
            <input
              type="number"
              min="0"
              value={globalStats.startingFood}
              onChange={(e) => setGlobalStats({ startingFood: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-2 bg-[#333] border border-[#555] rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Starting Water', '시작 물')}</label>
            <input
              type="number"
              min="0"
              value={globalStats.startingWater}
              onChange={(e) => setGlobalStats({ startingWater: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-2 bg-[#333] border border-[#555] rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Rescue Min Day', '구조 최소 일차')}</label>
            <input
              type="number"
              min="1"
              value={globalStats.rescueMinDay}
              onChange={(e) => setGlobalStats({ rescueMinDay: parseInt(e.target.value, 10) || 20 })}
              className="w-full px-3 py-2 bg-[#333] border border-[#555] rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Rescue Max Day', '구조 최대 일차')}</label>
            <input
              type="number"
              min="1"
              value={globalStats.rescueMaxDay}
              onChange={(e) => setGlobalStats({ rescueMaxDay: parseInt(e.target.value, 10) || 60 })}
              className="w-full px-3 py-2 bg-[#333] border border-[#555] rounded"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">{t('Daily Rescue Chance (%)', '일일 구조 확률 (%)')}</label>
            <input
              type="number"
              min="0"
              max="100"
              value={Math.round((globalStats.rescueChancePerDay || 0.05) * 100)}
              onChange={(e) => setGlobalStats({ rescueChancePerDay: (parseInt(e.target.value, 10) || 5) / 100 })}
              className="w-full px-3 py-2 bg-[#333] border border-[#555] rounded"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[#f4d03f]">{t('Sound Template', '사운드 템플릿')}</h3>
          <button
            type="button"
            onClick={() => setSoundSettings({
              enabled: true,
              masterVolume: 0.4,
              bgmUrl: '',
              sfx: {
                click: '/audio/ui_click.ogg',
                confirm: '/audio/ui_confirm.ogg',
                alert: '/audio/ui_alert.ogg',
              },
            })}
            className="px-2 py-1 text-xs rounded bg-[#3a3a3a] hover:bg-[#4a4a4a]"
          >
            {t('Reset Sound Preset', '사운드 프리셋 초기화')}
          </button>
        </div>

        <div className="space-y-3 p-4 bg-[#2a2a2a] rounded-lg border border-[#444]">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={soundSettings.enabled !== false}
              onChange={(e) => setSoundSettings({ enabled: e.target.checked })}
            />
            <span>{t('Enable in-game template sounds', '인게임 템플릿 사운드 사용')}</span>
          </label>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              {t('Master Volume', '마스터 볼륨')} ({Math.round((soundSettings.masterVolume ?? 0.4) * 100)}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round((soundSettings.masterVolume ?? 0.4) * 100)}
              onChange={(e) => {
                const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                setSoundSettings({ masterVolume: v / 100 });
              }}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Background Music URL', '배경음 URL')}</label>
            <input
              type="text"
              value={soundSettings.bgmUrl || ''}
              onChange={(e) => setSoundSettings({ bgmUrl: e.target.value })}
              placeholder={t('Leave empty to disable BGM', '비워두면 BGM이 재생되지 않습니다')}
              className="w-full px-3 py-2 bg-[#333] border border-[#555] rounded"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('SFX: Click', '효과음: 클릭')}</label>
              <input
                type="text"
                value={soundSettings.sfx?.click || ''}
                onChange={(e) => setSoundSettings({ sfx: { ...(soundSettings.sfx || {}), click: e.target.value } })}
                className="w-full px-3 py-2 bg-[#333] border border-[#555] rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('SFX: Confirm', '효과음: 확인')}</label>
              <input
                type="text"
                value={soundSettings.sfx?.confirm || ''}
                onChange={(e) => setSoundSettings({ sfx: { ...(soundSettings.sfx || {}), confirm: e.target.value } })}
                className="w-full px-3 py-2 bg-[#333] border border-[#555] rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('SFX: Alert', '효과음: 경고')}</label>
              <input
                type="text"
                value={soundSettings.sfx?.alert || ''}
                onChange={(e) => setSoundSettings({ sfx: { ...(soundSettings.sfx || {}), alert: e.target.value } })}
                className="w-full px-3 py-2 bg-[#333] border border-[#555] rounded"
              />
            </div>
          </div>

          <p className="text-[11px] text-gray-400">
            {t('Tip: use paths inside /public, for example /audio/ui_click.ogg', '팁: /public 경로를 사용하세요. 예: /audio/ui_click.ogg')}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="asset-manager-shell">
      {/* Sidebar tabs */}
      <div className="asset-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setNewName('');
            }}
            className={`asset-tab-btn ${activeTab === tab.id ? 'is-active' : ''}`}
          >
            {t(tab.label, tab.labelKo)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="asset-content">
        <h2 className="asset-content-title">
          {(() => {
            const active = TABS.find((tab) => tab.id === activeTab);
            return active ? t(active.label, active.labelKo) : '';
          })()}
        </h2>

        {activeTab === 'characters' && renderCharactersTab()}
        {activeTab === 'items' && renderItemsTab()}
        {activeTab === 'backgrounds' && renderBackgroundsTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'flags' && renderFlagsTab()}
        {activeTab === 'layout' && renderLayoutTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
}




