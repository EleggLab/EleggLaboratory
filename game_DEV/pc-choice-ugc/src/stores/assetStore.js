import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { looksCorruptedText } from '../utils/i18n';

// Default characters (template-ready, tagged + stock image linked)
const DEFAULT_CHARACTERS = [
  {
    id: 'default-char-ted',
    name: '아버지 (Ted)',
    isPlayer: true,
    tags: ['사람', '남성', '서브컬쳐', '초상', '표정', '임시태그캐릭터'],
    images: {
      normal: '/stock-library/characters/ted_normal.webp',
      sick: '/stock-library/characters/ted_sick.webp',
      insane: '/stock-library/characters/ted_insane.webp',
      dead: '/stock-library/characters/ted_dead.webp',
    },
    stats: { hungerThreshold: 12, thirstThreshold: 6, sanityThreshold: 25 },
    skills: [{ id: 'repair', name: 'Repair', nameKo: '수리', icon: 'R', bonus: 0.15 }],
  },
  {
    id: 'default-char-dolores',
    name: '어머니 (Dolores)',
    isPlayer: false,
    tags: ['사람', '여성', '서브컬쳐', '초상', '표정', '임시태그캐릭터'],
    images: {
      normal: '/stock-library/characters/dolores_normal.webp',
      sick: '/stock-library/characters/dolores_sick.webp',
      insane: '/stock-library/characters/dolores_insane.webp',
      dead: '/stock-library/characters/dolores_dead.webp',
    },
    stats: { hungerThreshold: 10, thirstThreshold: 5, sanityThreshold: 20 },
    skills: [{ id: 'medical', name: 'Medical', nameKo: '의료', icon: 'M', bonus: 0.15 }],
  },
  {
    id: 'default-char-mary',
    name: '딸 (Mary Jane)',
    isPlayer: false,
    tags: ['사람', '여성', '서브컬쳐', '초상', '표정', '임시태그캐릭터'],
    images: {
      normal: '/stock-library/characters/mary_normal.webp',
      sick: '/stock-library/characters/mary_sick.webp',
      insane: '/stock-library/characters/mary_insane.webp',
      dead: '/stock-library/characters/mary_dead.webp',
    },
    stats: { hungerThreshold: 8, thirstThreshold: 4, sanityThreshold: 18 },
    skills: [{ id: 'negotiation', name: 'Negotiation', nameKo: '협상', icon: 'N', bonus: 0.15 }],
  },
  {
    id: 'default-char-timmy',
    name: '아들 (Timmy)',
    isPlayer: false,
    tags: ['사람', '남성', '서브컬쳐', '초상', '표정', '임시태그캐릭터'],
    images: {
      normal: '/stock-library/characters/timmy_normal.webp',
      sick: '/stock-library/characters/timmy_sick.webp',
      insane: '/stock-library/characters/timmy_insane.webp',
      dead: '/stock-library/characters/timmy_dead.webp',
    },
    stats: { hungerThreshold: 8, thirstThreshold: 4, sanityThreshold: 15 },
    skills: [{ id: 'stealth', name: 'Stealth', nameKo: '은신', icon: 'S', bonus: 0.15 }],
  },
];

const DEFAULT_CHARACTER_BY_ID = Object.fromEntries(DEFAULT_CHARACTERS.map((char) => [char.id, char]));

// Default items
const DEFAULT_ITEMS = [
  { id: 'default-item-soup', name: 'Soup Can', category: 'food', icon: null, effects: { food: 1 } },
  { id: 'default-item-water', name: 'Water Bottle', category: 'water', icon: null, effects: { water: 1 } },
  { id: 'default-item-radio', name: 'Radio', category: 'tool', icon: null, effects: {} },
  { id: 'default-item-medkit', name: 'Medkit', category: 'medical', icon: null, effects: {} },
  { id: 'default-item-axe', name: 'Axe', category: 'weapon', icon: null, effects: {} },
  { id: 'default-item-map', name: 'Map', category: 'tool', icon: null, effects: {} },
  { id: 'default-item-gasmask', name: 'Gas Mask', category: 'tool', icon: null, effects: {} },
  { id: 'default-item-flashlight', name: 'Flashlight', category: 'tool', icon: null, effects: {} },
  { id: 'default-item-antidote', name: 'Antidote', category: 'medical', icon: null, effects: { heal: true, consumable: true } },
  { id: 'default-item-supertool', name: 'Super Tool', category: 'tool', icon: null, effects: { consumable: false } },
  { id: 'default-item-tracker', name: 'Tracker', category: 'tool', icon: null, effects: { consumable: false } },
  { id: 'default-item-rations', name: 'Emergency Rations', category: 'food', icon: null, effects: { food: 4, consumable: true } },
  { id: 'default-item-filter', name: 'Water Filter', category: 'tool', icon: null, effects: { water: 3, consumable: true } },
];

const DEFAULT_BACKGROUNDS = [
  {
    id: 'default-bg-shelter',
    name: '대피소 (주간)',
    image: '/stock-library/backgrounds/renpy_day.webp',
    tags: ['배경', '서브컬쳐', '미연시', '주간', '실내', '임시태그배경'],
  },
  {
    id: 'default-bg-evening',
    name: '대피소 (야간)',
    image: '/stock-library/backgrounds/renpy_night.webp',
    tags: ['배경', '서브컬쳐', '미연시', '야간', '실내', '임시태그배경'],
  },
  {
    id: 'default-bg-alert',
    name: '상황 화면',
    image: '/stock-library/backgrounds/messaging_room.webp',
    tags: ['배경', '상황', '메신저', '서브컬쳐', 'UI', '임시태그배경'],
  },
  {
    id: 'default-bg-dating-home',
    name: '홈 배경',
    image: '/stock-library/backgrounds/dating_home.webp',
    tags: ['배경', '서브컬쳐', '연애시뮬레이션', '홈화면', '임시태그배경'],
  },
  {
    id: 'default-bg-dating-main',
    name: '메인 배경',
    image: '/stock-library/backgrounds/dating_main.webp',
    tags: ['배경', '서브컬쳐', '연애시뮬레이션', '실내', '임시태그배경'],
  },
  {
    id: 'default-bg-settings-room',
    name: '설정 배경',
    image: '/stock-library/backgrounds/settings_room.webp',
    tags: ['배경', '설정화면', 'UI', '서브컬쳐', '임시태그배경'],
  },
];

const DEFAULT_BACKGROUND_BY_ID = Object.fromEntries(DEFAULT_BACKGROUNDS.map((bg) => [bg.id, bg]));

const DEFAULT_CHARACTER_NAMES = {
  'default-char-ted': '아버지 (Ted)',
  'default-char-dolores': '어머니 (Dolores)',
  'default-char-mary': '딸 (Mary Jane)',
  'default-char-timmy': '아들 (Timmy)',
};

const DEFAULT_SKILL_TEXT = {
  repair: { name: 'Repair', nameKo: '수리', icon: 'R' },
  medical: { name: 'Medical', nameKo: '의료', icon: 'M' },
  negotiation: { name: 'Negotiation', nameKo: '협상', icon: 'N' },
  stealth: { name: 'Stealth', nameKo: '은신', icon: 'S' },
};

const DEFAULT_ITEM_NAMES = {
  'default-item-soup': 'Soup Can',
  'default-item-water': 'Water Bottle',
  'default-item-radio': 'Radio',
  'default-item-medkit': 'Medkit',
  'default-item-axe': 'Axe',
  'default-item-map': 'Map',
  'default-item-gasmask': 'Gas Mask',
  'default-item-flashlight': 'Flashlight',
  'default-item-antidote': 'Antidote',
  'default-item-supertool': 'Super Tool',
  'default-item-tracker': 'Tracker',
  'default-item-rations': 'Emergency Rations',
  'default-item-filter': 'Water Filter',
};

function sanitizeCharacterText(character) {
  if (!character) return character;
  let changed = false;
  let next = character;
  const fallbackCharacter = DEFAULT_CHARACTER_BY_ID[character.id];

  const fallbackName = DEFAULT_CHARACTER_NAMES[character.id];
  if (fallbackName && (typeof character.name !== 'string' || looksCorruptedText(character.name))) {
    next = { ...next, name: fallbackName };
    changed = true;
  }

  if (fallbackCharacter) {
    const states = ['normal', 'sick', 'insane', 'dead'];
    const currentImages = next.images || {};
    const mergedImages = { ...currentImages };
    let imageChanged = false;
    states.forEach((state) => {
      const current = currentImages[state];
      const validCurrent = typeof current === 'string' && current.trim().length > 0;
      const fallback = fallbackCharacter.images?.[state] || null;
      const resolved = validCurrent ? current : fallback;
      if (mergedImages[state] !== resolved) {
        mergedImages[state] = resolved;
        imageChanged = true;
      }
    });
    if (imageChanged) {
      next = { ...next, images: mergedImages };
      changed = true;
    }

    if (!Array.isArray(next.tags) || next.tags.length === 0) {
      next = { ...next, tags: [...(fallbackCharacter.tags || [])] };
      changed = true;
    }
  }

  const skills = Array.isArray(next.skills) ? next.skills : [];
  const normalizedSkills = skills.map((skill) => {
    const fallback = DEFAULT_SKILL_TEXT[skill?.id] || {};
    const updated = { ...(skill || {}) };
    let localChanged = false;

    if (typeof updated.name !== 'string' || looksCorruptedText(updated.name)) {
      updated.name = fallback.name || updated.id || 'Skill';
      localChanged = true;
    }
    if (typeof updated.nameKo !== 'string' || looksCorruptedText(updated.nameKo)) {
      updated.nameKo = fallback.nameKo || updated.name || updated.id || 'Skill';
      localChanged = true;
    }
    if (typeof updated.icon !== 'string' || looksCorruptedText(updated.icon) || updated.icon.length === 0) {
      updated.icon = fallback.icon || '*';
      localChanged = true;
    }

    if (localChanged) changed = true;
    return localChanged ? updated : skill;
  });

  if (changed) {
    next = { ...next, skills: normalizedSkills };
  }

  return next;
}

function sanitizeItemText(item) {
  if (!item) return item;
  const fallbackName = DEFAULT_ITEM_NAMES[item.id];
  if (fallbackName && (typeof item.name !== 'string' || looksCorruptedText(item.name))) {
    return { ...item, name: fallbackName };
  }
  return item;
}

function sanitizeBackgroundText(background) {
  if (!background) return background;
  const fallback = DEFAULT_BACKGROUND_BY_ID[background.id];
  if (!fallback) return background;

  let changed = false;
  const next = { ...background };

  if (typeof next.name !== 'string' || looksCorruptedText(next.name) || next.name.trim().length === 0) {
    next.name = fallback.name;
    changed = true;
  }

  const legacyImage = typeof next.image === 'string' && next.image.includes('/editor-skin/');
  if (!next.image || legacyImage) {
    next.image = fallback.image;
    changed = true;
  }

  if (!Array.isArray(next.tags) || next.tags.length === 0) {
    next.tags = [...(fallback.tags || [])];
    changed = true;
  }

  return changed ? next : background;
}

function sanitizeArray(items, mapper) {
  let changed = false;
  const sanitized = items.map((entry) => {
    const next = mapper(entry);
    if (next !== entry) changed = true;
    if (next !== entry && next && typeof next === 'object' && !next.id && entry?.id) {
      changed = true;
      return { ...next, id: entry.id };
    }
    return next;
  });
  return { sanitized, changed };
}

function normalizePlayerCharacters(characters) {
  if (!Array.isArray(characters) || characters.length === 0) return [];
  const withFlag = characters.map((char) => ({ ...char, isPlayer: char.isPlayer === true }));
  const firstPlayerIndex = withFlag.findIndex((char) => char.isPlayer);
  const selected = firstPlayerIndex >= 0 ? firstPlayerIndex : 0;
  return withFlag.map((char, idx) => ({ ...char, isPlayer: idx === selected }));
}

export const useAssetStore = create((set, get) => ({
  // Characters with state-based images
  characters: [],

  // Items
  items: [],

  // Backgrounds
  backgrounds: [],

  // Loading state
  loading: false,

  // Initialize from IndexedDB (with default characters if empty)
  initialize: async () => {
    set({ loading: true });
    try {
      let characters = await db.characters.toArray();
      let items = await db.items.toArray();
      let backgrounds = await db.backgrounds.toArray();

      // Add default characters if none exist
      if (characters.length === 0) {
        await db.characters.bulkPut(DEFAULT_CHARACTERS);
        characters = DEFAULT_CHARACTERS;
      }
      const sanitizedCharactersResult = sanitizeArray(characters, sanitizeCharacterText);
      characters = normalizePlayerCharacters(sanitizedCharactersResult.sanitized);
      await db.characters.bulkPut(characters);

      // Add default items if none exist
      if (items.length === 0) {
        await db.items.bulkPut(DEFAULT_ITEMS);
        items = DEFAULT_ITEMS;
      }
      const sanitizedItemsResult = sanitizeArray(items, sanitizeItemText);
      if (sanitizedItemsResult.changed) {
        await db.items.bulkPut(sanitizedItemsResult.sanitized);
      }
      items = sanitizedItemsResult.sanitized;

      const existingBackgroundIds = new Set(backgrounds.map((bg) => bg.id));
      const missingBackgrounds = DEFAULT_BACKGROUNDS.filter((bg) => !existingBackgroundIds.has(bg.id));
      if (missingBackgrounds.length > 0) {
        await db.backgrounds.bulkPut(missingBackgrounds);
        backgrounds = [...backgrounds, ...missingBackgrounds];
      }
      const sanitizedBackgroundsResult = sanitizeArray(backgrounds, sanitizeBackgroundText);
      if (sanitizedBackgroundsResult.changed) {
        await db.backgrounds.bulkPut(sanitizedBackgroundsResult.sanitized);
      }
      backgrounds = sanitizedBackgroundsResult.sanitized;

      set({ characters, items, backgrounds, loading: false });
    } catch (error) {
      console.error('Failed to load assets:', error);
      set({ loading: false });
    }
  },

  // Character management
  addCharacter: async (name) => {
    const currentCharacters = get().characters || [];
    const hasPlayer = currentCharacters.some((char) => char.isPlayer === true);
    const character = {
      id: uuidv4(),
      name,
      isPlayer: !hasPlayer,
      tags: [],
      images: {
        normal: null,
        sick: null,
        insane: null,
        dead: null,
      },
      stats: {
        hungerThreshold: 10,
        thirstThreshold: 5,
        sanityThreshold: 20,
      },
      skills: [],
    };

    await db.characters.add(character);
    set({ characters: normalizePlayerCharacters([...currentCharacters, character]) });
    return character.id;
  },

  updateCharacter: async (id, updates) => {
    const { characters } = get();
    const updated = characters.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );

    await db.characters.update(id, updates);
    set({ characters: normalizePlayerCharacters(updated) });
  },

  setCharacterImage: async (characterId, state, imageData) => {
    const { characters } = get();
    const character = characters.find((c) => c.id === characterId);
    if (!character) return;

    const updatedImages = { ...character.images, [state]: imageData };
    await db.characters.update(characterId, { images: updatedImages });

    set({
      characters: characters.map((c) =>
        c.id === characterId ? { ...c, images: updatedImages } : c
      ),
    });
  },

  deleteCharacter: async (id) => {
    await db.characters.delete(id);
    set({ characters: normalizePlayerCharacters(get().characters.filter((c) => c.id !== id)) });
  },

  setPlayerCharacter: async (id) => {
    const { characters } = get();
    const updated = normalizePlayerCharacters(
      characters.map((char) => ({ ...char, isPlayer: char.id === id }))
    );
    await Promise.all(updated.map((char) => db.characters.update(char.id, { isPlayer: char.isPlayer })));
    set({ characters: updated });
  },

  // Item management
  addItem: async (name, category = 'misc') => {
    const item = {
      id: uuidv4(),
      name,
      category,
      icon: null,
      effects: {},
    };

    await db.items.add(item);
    set({ items: [...get().items, item] });
    return item.id;
  },

  updateItem: async (id, updates) => {
    const { items } = get();
    await db.items.update(id, updates);
    set({
      items: items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    });
  },

  setItemIcon: async (itemId, imageData) => {
    await db.items.update(itemId, { icon: imageData });
    set({
      items: get().items.map((i) =>
        i.id === itemId ? { ...i, icon: imageData } : i
      ),
    });
  },

  deleteItem: async (id) => {
    await db.items.delete(id);
    set({ items: get().items.filter((i) => i.id !== id) });
  },

  // Background management
  addBackground: async (name) => {
    const background = {
      id: uuidv4(),
      name,
      image: null,
      tags: [],
    };

    await db.backgrounds.add(background);
    set({ backgrounds: [...get().backgrounds, background] });
    return background.id;
  },

  updateBackground: async (id, updates) => {
    await db.backgrounds.update(id, updates);
    set({
      backgrounds: get().backgrounds.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    });
  },

  setBackgroundImage: async (backgroundId, imageData) => {
    await db.backgrounds.update(backgroundId, { image: imageData });
    set({
      backgrounds: get().backgrounds.map((b) =>
        b.id === backgroundId ? { ...b, image: imageData } : b
      ),
    });
  },

  deleteBackground: async (id) => {
    await db.backgrounds.delete(id);
    set({ backgrounds: get().backgrounds.filter((b) => b.id !== id) });
  },

  // Export all assets as base64
  exportAssets: () => {
    const { characters, items, backgrounds } = get();
    return {
      characters,
      items,
      backgrounds,
    };
  },

  // Import assets from JSON
  importAssets: async (assets) => {
    set({ loading: true });

    try {
      // Clear existing
      await db.characters.clear();
      await db.items.clear();
      await db.backgrounds.clear();

      // Add new
      if (assets.characters?.length) {
        const normalizedCharacters = normalizePlayerCharacters(assets.characters);
        await db.characters.bulkAdd(normalizedCharacters);
      }
      if (assets.items?.length) {
        await db.items.bulkAdd(assets.items);
      }
      if (assets.backgrounds?.length) {
        await db.backgrounds.bulkAdd(assets.backgrounds);
      }

      set({
        characters: normalizePlayerCharacters(assets.characters || []),
        items: assets.items || [],
        backgrounds: assets.backgrounds || [],
        loading: false,
      });
    } catch (error) {
      console.error('Failed to import assets:', error);
      set({ loading: false });
    }
  },

  // Clear all assets
  clearAll: async () => {
    await db.characters.clear();
    await db.items.clear();
    await db.backgrounds.clear();
    set({ characters: [], items: [], backgrounds: [] });
  },
}));

