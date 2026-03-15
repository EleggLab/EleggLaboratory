import { create } from 'zustand';

const CHARACTER_STATES = ['normal', 'sick', 'injured', 'insane', 'dead'];

// Expedition reward tables
const EXPEDITION_CONFIG = {
  short: { days: 1, baseSuccess: 0.6, food: [1, 3], water: [1, 2], itemChance: 0.1, label: 'Short Scout', labelEn: 'Short Scout' },
  medium: { days: 2, baseSuccess: 0.5, food: [2, 5], water: [2, 4], itemChance: 0.4, label: 'Medium Expedition', labelEn: 'Medium Expedition' },
  long: { days: 3, baseSuccess: 0.4, food: [3, 7], water: [3, 5], itemChance: 0.7, label: 'Long Expedition', labelEn: 'Long Expedition' },
};

// Weather types
const WEATHER_TYPES = ['clear', 'rain', 'storm', 'dust'];
const WEATHER_LABELS = {
  clear: { icon: 'SUN', name: 'Clear', nameEn: 'Clear' },
  rain: { icon: 'RAIN', name: 'Rain', nameEn: 'Rain' },
  storm: { icon: 'STORM', name: 'Storm', nameEn: 'Storm' },
  dust: { icon: 'DUST', name: 'Dust Storm', nameEn: 'Dust Storm' },
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export { EXPEDITION_CONFIG, WEATHER_TYPES, WEATHER_LABELS };

export const useGameStore = create((set, get) => ({
  // Game state
  isPlaying: false,
  day: 1,
  phase: 'status', // status, action, event, night

  // Characters runtime state
  characters: [],

  // Inventory
  inventory: [], // { itemId, count }

  // Resources
  food: 0,
  water: 0,

  // Flags
  flags: {}, // { flagId: boolean }

  // Current event traversal
  currentNodeId: null,
  eventHistory: [],

  // Game data (loaded from editor)
  gameData: null,
  assets: null,

  // Bad luck protection
  expeditionFailStreak: 0,

  // === NEW: Expedition System ===
  expeditions: [], // { id, characterId, characterName, type, daysRemaining, daysTotal }
  expeditionResults: [], // Results to show in morning phase

  // === NEW: Environment System ===
  environment: {
    radiation: 0,
    weather: 'clear',
    severity: 1,
    temperature: 20,
  },

  // === NEW: Game statistics for endings ===
  gameStats: {
    totalExpeditions: 0,
    successfulExpeditions: 0,
    itemsCrafted: 0,
    totalFoodGathered: 0,
  },

  // Initialize game from project data
  startGame: (projectData, assets) => {
    const { globalStats, flags, customStats } = projectData;

    // Get enabled stats
    const enabledStats = (customStats || []).filter((s) => s.enabled);
    const playerCharacterId = assets.characters.find((char) => char.isPlayer === true)?.id || assets.characters[0]?.id;

    // Initialize characters from assets with skills
    const characters = assets.characters.map((char) => {
      const charStats = {};
      const criticalDays = {};

      enabledStats.forEach((stat) => {
        charStats[stat.id] = stat.defaultValue;
        criticalDays[`days_${stat.id}_critical`] = 0;
      });

      return {
        id: char.id,
        name: char.name,
        isPlayer: char.id === playerCharacterId,
        stats: charStats,
        criticalDays,
        skills: char.skills || [],
        state: 'normal',
        alive: true,
        daysSick: 0,
        daysInjured: 0,
        onExpedition: false,
      };
    });

    // Initialize flags
    const initialFlags = {};
    (flags || []).forEach((flag) => {
      initialFlags[flag.id] = flag.defaultValue;
    });

    const inventory = [];

    set({
      isPlaying: true,
      day: 1,
      phase: 'status',
      characters,
      inventory,
      food: globalStats.startingFood || 10,
      water: globalStats.startingWater || 8,
      flags: initialFlags,
      currentNodeId: null,
      eventHistory: [],
      gameData: projectData,
      assets,
      expeditionFailStreak: 0,
      expeditions: [],
      expeditionResults: [],
      environment: {
        radiation: globalStats.radiationBase || 0,
        weather: 'clear',
        severity: 1,
        temperature: 20,
      },
      gameStats: {
        totalExpeditions: 0,
        successfulExpeditions: 0,
        itemsCrafted: 0,
        totalFoodGathered: 0,
      },
    });
  },

  stopGame: () => {
    set({
      isPlaying: false,
      day: 1,
      phase: 'status',
      characters: [],
      inventory: [],
      food: 0,
      water: 0,
      flags: {},
      currentNodeId: null,
      eventHistory: [],
      gameData: null,
      assets: null,
      expeditions: [],
      expeditionResults: [],
      environment: { radiation: 0, weather: 'clear', severity: 1, temperature: 20 },
      gameStats: { totalExpeditions: 0, successfulExpeditions: 0, itemsCrafted: 0, totalFoodGathered: 0 },
    });
  },

  // === SKILL SYSTEM ===
  getSkillBonus: (skillId) => {
    const { characters } = get();
    let totalBonus = 0;
    characters.forEach((char) => {
      if (!char.alive || char.onExpedition) return;
      const skill = (char.skills || []).find((s) => s.id === skillId);
      if (skill) {
        totalBonus += skill.bonus || 0;
        // Sick/injured characters have reduced skill effectiveness
        if (char.state === 'sick') totalBonus -= (skill.bonus || 0) * 0.5;
        if (char.state === 'injured') totalBonus -= (skill.bonus || 0) * 0.3;
      }
    });
    return Math.max(0, totalBonus);
  },

  hasSkill: (skillId) => {
    const { characters } = get();
    return characters.some((char) => char.alive && !char.onExpedition && (char.skills || []).some((s) => s.id === skillId));
  },

  // Daily cycle
  processDay: () => {
    const { characters, day, gameData, environment } = get();
    const customStats = gameData?.customStats || [];
    const enabledStats = customStats.filter((s) => s.enabled);

    const updatedCharacters = characters.map((char) => {
      if (!char.alive || char.onExpedition) return char;

      const newStats = { ...(char.stats || {}) };
      const newCriticalDays = { ...(char.criticalDays || {}) };
      let state = char.state;
      let alive = char.alive;
      let daysSick = char.daysSick || 0;
      let daysInjured = char.daysInjured || 0;

      // Apply daily changes for each enabled stat
      enabledStats.forEach((statDef) => {
        if (newStats[statDef.id] === undefined) {
          newStats[statDef.id] = statDef.defaultValue;
        }

        let statValue = newStats[statDef.id] + statDef.dailyChange;

        // State effects on stats
        if (state === 'sick') {
          if (statDef.direction === 'up') statValue += 3;
          else statValue -= 2;
        }
        if (state === 'injured') {
          if (statDef.direction === 'up') statValue += 2;
          else statValue -= 1;
        }

        // Environment effects on stats
        if (gameData?.globalStats?.environmentEnabled !== false) {
          // Storm worsens all stats slightly
          if (environment.weather === 'storm') {
            if (statDef.direction === 'up') statValue += 2;
            else statValue -= 2;
          }
          // Extreme temperatures increase thirst
          if (statDef.id === 'thirst') {
            if (environment.temperature > 40) statValue += 5;
            else if (environment.temperature < 0) statValue += 3;
          }
          // High radiation increases radiation stat if exists
          if (statDef.id === 'radiation' && environment.radiation > 60) {
            statValue += 5;
          }
        }

        // Clamp to min/max
        statValue = Math.max(statDef.min, Math.min(statDef.max, statValue));
        newStats[statDef.id] = statValue;

        // Check if stat is in critical state
        const isCritical = statDef.direction === 'up'
          ? statValue >= statDef.criticalThreshold
          : statValue <= statDef.criticalThreshold;

        if (alive && state !== 'dead' && statDef.id === 'sanity' && isCritical) {
          state = 'insane';
        }

        const criticalKey = `days_${statDef.id}_critical`;
        if (isCritical) {
          newCriticalDays[criticalKey] = (newCriticalDays[criticalKey] || 0) + 1;
          if (statDef.deathDays > 0 && newCriticalDays[criticalKey] >= statDef.deathDays) {
            alive = false;
            state = 'dead';
          }
        } else {
          newCriticalDays[criticalKey] = 0;
        }
      });

      // Sick progression
      if (state === 'sick') {
        daysSick++;
        if (daysSick >= 5) {
          alive = false;
          state = 'dead';
        }
      }

      // Injured progression
      if (state === 'injured') {
        daysInjured++;
        if (daysInjured >= 7 && Math.random() < 0.2) {
          state = 'normal';
          daysInjured = 0;
        }
      }

      return {
        ...char,
        stats: newStats,
        criticalDays: newCriticalDays,
        state,
        alive,
        daysSick,
        daysInjured,
      };
    });

    // Process expeditions
    const expeditionResults = get().processExpeditions();

    // Process environment
    get().processEnvironment();

    set({
      characters: updatedCharacters,
      day: day + 1,
      expeditionResults,
    });
  },

  // Feed character
  feedCharacter: (characterId) => {
    const { food, characters, gameData } = get();
    if (food <= 0) return false;

    const hungerStat = gameData?.customStats?.find((s) => s.id === 'hunger' && s.enabled);

    set({
      food: food - 1,
      characters: characters.map((c) => {
        if (c.id !== characterId) return c;
        if (!hungerStat) return c;
        const newStats = { ...c.stats };
        newStats.hunger = Math.max(hungerStat.min, (newStats.hunger || 0) - 30);
        return { ...c, stats: newStats };
      }),
    });
    return true;
  },

  // Water character
  waterCharacter: (characterId) => {
    const { water, characters, gameData } = get();
    if (water <= 0) return false;

    const thirstStat = gameData?.customStats?.find((s) => s.id === 'thirst' && s.enabled);

    set({
      water: water - 1,
      characters: characters.map((c) => {
        if (c.id !== characterId) return c;
        if (!thirstStat) return c;
        const newStats = { ...c.stats };
        newStats.thirst = Math.max(thirstStat.min, (newStats.thirst || 0) - 40);
        return { ...c, stats: newStats };
      }),
    });
    return true;
  },

  // Modify any stat for a character
  modifyCharacterStat: (characterId, statId, amount) => {
    const { characters, gameData } = get();
    const statDef = gameData?.customStats?.find((s) => s.id === statId && s.enabled);
    if (!statDef) return false;

    set({
      characters: characters.map((c) => {
        if (c.id !== characterId) return c;
        const newStats = { ...c.stats };
        const currentValue = newStats[statId] ?? statDef.defaultValue;
        newStats[statId] = Math.max(statDef.min, Math.min(statDef.max, currentValue + amount));
        return { ...c, stats: newStats };
      }),
    });
    return true;
  },

  // Heal character with medical item
  healCharacter: (characterId, itemId) => {
    const { inventory, characters, assets } = get();
    const item = assets?.items?.find((i) => i.id === itemId);
    const hasItem = inventory.some((i) => i.itemId === itemId && i.count > 0);
    const char = characters.find((c) => c.id === characterId);

    if (!hasItem || !char || !char.alive) return { success: false, message: 'Cannot heal' };
    if (char.state !== 'sick' && char.state !== 'injured') {
      return { success: false, message: 'Character is not sick or injured' };
    }

    get().removeItem(itemId, 1);

    set({
      characters: characters.map((c) =>
        c.id === characterId
          ? { ...c, state: 'normal', daysSick: 0, daysInjured: 0 }
          : c
      ),
    });

    return { success: true, message: `${char.name} was healed with ${item?.name || 'medicine'}` };
  },

  // Boost sanity
  boostSanity: (characterId, amount = 20) => {
    const { characters, gameData } = get();
    const char = characters.find((c) => c.id === characterId);
    if (!char || !char.alive) return false;
    const sanityStat = (gameData?.customStats || []).find((s) => s.id === 'sanity' && s.enabled);
    if (!sanityStat) return false;

    set({
      characters: characters.map((c) => {
        if (c.id !== characterId) return c;
        const newStats = { ...(c.stats || {}) };
        const currentSanity = Number.isFinite(newStats.sanity) ? newStats.sanity : sanityStat.defaultValue;
        const newSanity = clamp(currentSanity + amount, sanityStat.min, sanityStat.max);
        newStats.sanity = newSanity;
        const recoverThreshold = (sanityStat.criticalThreshold ?? 20) + 10;
        const newState = c.state === 'insane' && newSanity > recoverThreshold ? 'normal' : c.state;
        return { ...c, stats: newStats, state: newState };
      }),
    });
    return true;
  },

  // Use an item from inventory
  useItem: (itemId, targetCharacterId = null) => {
    const { inventory, assets, characters, food, water, gameData } = get();
    const item = assets?.items?.find((i) => i.id === itemId);
    const invItem = inventory.find((i) => i.itemId === itemId);

    if (!item || !invItem || invItem.count <= 0) {
      return { success: false, message: 'Item not available' };
    }

    const effects = item.effects || {};
    const results = [];

    if (effects.food) {
      set({ food: food + effects.food });
      results.push(`+${effects.food} food`);
    }
    if (effects.water) {
      set({ water: water + effects.water });
      results.push(`+${effects.water} water`);
    }

    if (targetCharacterId) {
      const char = characters.find((c) => c.id === targetCharacterId);
      if (char && char.alive) {
        const statDefs = (gameData?.customStats || []).filter((s) => s.enabled);
        const hungerStat = statDefs.find((s) => s.id === 'hunger');
        const thirstStat = statDefs.find((s) => s.id === 'thirst');
        const sanityStat = statDefs.find((s) => s.id === 'sanity');
        const newStats = { ...(char.stats || {}) };
        let stateUpdate = {};

        if (effects.hunger) {
          if (hungerStat) {
            const currentHunger = Number.isFinite(newStats.hunger) ? newStats.hunger : hungerStat.defaultValue;
            newStats.hunger = clamp(currentHunger - effects.hunger, hungerStat.min, hungerStat.max);
            results.push(`-${effects.hunger} hunger`);
          }
        }
        if (effects.thirst) {
          if (thirstStat) {
            const currentThirst = Number.isFinite(newStats.thirst) ? newStats.thirst : thirstStat.defaultValue;
            newStats.thirst = clamp(currentThirst - effects.thirst, thirstStat.min, thirstStat.max);
            results.push(`-${effects.thirst} thirst`);
          }
        }
        if (effects.sanity) {
          if (sanityStat) {
            const currentSanity = Number.isFinite(newStats.sanity) ? newStats.sanity : sanityStat.defaultValue;
            const nextSanity = clamp(currentSanity + effects.sanity, sanityStat.min, sanityStat.max);
            newStats.sanity = nextSanity;
            const recoverThreshold = (sanityStat.criticalThreshold ?? 20) + 10;
            if (char.state === 'insane' && nextSanity > recoverThreshold) {
              stateUpdate.state = 'normal';
            }
            results.push(`+${effects.sanity} sanity`);
          }
        }
        if (effects.heal && (char.state === 'sick' || char.state === 'injured')) {
          stateUpdate.state = 'normal';
          stateUpdate.daysSick = 0;
          stateUpdate.daysInjured = 0;
          results.push('healed');
        }

        const shouldUpdateStats = Object.keys(newStats).length > 0;
        if (shouldUpdateStats || Object.keys(stateUpdate).length > 0) {
          set({
            characters: characters.map((c) =>
              c.id === targetCharacterId ? { ...c, stats: newStats, ...stateUpdate } : c
            ),
          });
        }
      }
    }

    if (effects.consumable !== false) {
      get().removeItem(itemId, 1);
    }

    return {
      success: true,
      message: `Used ${item.name}: ${results.join(', ') || 'no effect'}`,
      results,
    };
  },

  // Modify resources
  addFood: (amount) => set({ food: Math.max(0, get().food + amount) }),
  addWater: (amount) => set({ water: Math.max(0, get().water + amount) }),

  // Inventory management
  addItem: (itemId, count = 1) => {
    const { inventory } = get();
    const existing = inventory.find((i) => i.itemId === itemId);

    if (existing) {
      set({
        inventory: inventory.map((i) =>
          i.itemId === itemId ? { ...i, count: i.count + count } : i
        ),
      });
    } else {
      set({ inventory: [...inventory, { itemId, count }] });
    }
  },

  removeItem: (itemId, count = 1) => {
    const { inventory } = get();
    set({
      inventory: inventory
        .map((i) =>
          i.itemId === itemId ? { ...i, count: i.count - count } : i
        )
        .filter((i) => i.count > 0),
    });
  },

  hasItem: (itemId) => {
    return get().inventory.some((i) => i.itemId === itemId && i.count > 0);
  },

  // Character state
  setCharacterState: (characterId, state) => {
    set({
      characters: get().characters.map((c) =>
        c.id === characterId ? { ...c, state } : c
      ),
    });
  },

  // Flags
  setFlag: (flagId, value) => {
    set({ flags: { ...get().flags, [flagId]: value } });
  },

  getFlag: (flagId) => {
    return get().flags[flagId] || false;
  },

  // Event traversal
  setCurrentNode: (nodeId) => {
    const { eventHistory, currentNodeId } = get();
    if (currentNodeId) {
      set({
        currentNodeId: nodeId,
        eventHistory: [...eventHistory, currentNodeId],
      });
    } else {
      set({ currentNodeId: nodeId });
    }
  },

  // Find eligible trigger nodes for current day
  // timing: status | action | event
  // includeCommon: true -> only common triggers, false -> only normal triggers
  getEligibleTriggers: (timing = 'event', includeCommon = false) => {
    const { gameData, day, flags, inventory } = get();
    if (!gameData?.nodes) return [];

    return gameData.nodes.filter((node) => {
      if (node.data.type !== 'trigger') return false;

      const { minDay, maxDay, probability, requiredFlags, requiredItems } = node.data;
      const nodeTiming = node.data.timing || 'event';
      const isCommon = node.data.common === true;

      if (nodeTiming !== timing) return false;
      if (includeCommon && !isCommon) return false;
      if (!includeCommon && isCommon) return false;

      if (minDay && day < minDay) return false;
      if (maxDay && day > maxDay) return false;

      // Flag check - handle both string format and {flagId, value} object format
      if (requiredFlags?.length) {
        const hasAllFlags = requiredFlags.every((f) => {
          if (typeof f === 'string') {
            return flags[f] === true;
          }
          return flags[f.flagId] === f.value;
        });
        if (!hasAllFlags) return false;
      }

      if (requiredItems?.length) {
        const hasAllItems = requiredItems.every((itemId) =>
          inventory.some((i) => i.itemId === itemId && i.count > 0)
        );
        if (!hasAllItems) return false;
      }

      if (probability < 1 && Math.random() > probability) return false;

      return true;
    });
  },

  // Get connected node
  getNextNode: (fromNodeId, handleId = null) => {
    const { gameData } = get();
    if (!gameData?.edges) return null;

    const edge = gameData.edges.find((e) => {
      if (e.source !== fromNodeId) return false;
      if (handleId && e.sourceHandle !== handleId) return false;
      return true;
    });

    if (!edge) return null;

    return gameData.nodes.find((n) => n.id === edge.target);
  },

  // Apply result effects
  applyResult: (result) => {
    const { characters, gameData } = get();

    if (result.itemChanges) {
      result.itemChanges.forEach((itemChange) => {
        const itemId = itemChange?.itemId;
        const amount = Number(itemChange?.amount ?? itemChange?.change ?? 0);
        if (!itemId || !Number.isFinite(amount) || amount === 0) return;

        if (amount > 0) {
          get().addItem(itemId, amount);
        } else {
          get().removeItem(itemId, -amount);
        }
      });
    }

    if (result.statChanges) {
      const statChanges = result.statChanges || {};
      const foodDelta = Number.isFinite(statChanges.food) ? statChanges.food : 0;
      const waterDelta = Number.isFinite(statChanges.water) ? statChanges.water : 0;

      if (foodDelta !== 0 || waterDelta !== 0) {
        set((s) => ({
          food: Math.max(0, s.food + foodDelta),
          water: Math.max(0, s.water + waterDelta),
          gameStats: {
            ...s.gameStats,
            totalFoodGathered: s.gameStats.totalFoodGathered + Math.max(0, foodDelta),
          },
        }));
      }

      const statDefs = (gameData?.customStats || []).filter((s) => s.enabled);
      const statDefById = Object.fromEntries(statDefs.map((s) => [s.id, s]));
      const customDeltaEntries = Object.entries(statChanges).filter(([key, value]) => (
        key !== 'food' &&
        key !== 'water' &&
        Number.isFinite(value) &&
        value !== 0 &&
        Boolean(statDefById[key])
      ));

      if (customDeltaEntries.length > 0) {
        set({
          characters: characters.map((char) => {
            if (!char.alive) return char;
            const nextStats = { ...(char.stats || {}) };
            customDeltaEntries.forEach(([statId, delta]) => {
              const statDef = statDefById[statId];
              const currentValue = Number.isFinite(nextStats[statId]) ? nextStats[statId] : statDef.defaultValue;
              nextStats[statId] = clamp(currentValue + delta, statDef.min, statDef.max);
            });
            return { ...char, stats: nextStats };
          }),
        });
      }
    }

    if (result.stateEffects) {
      result.stateEffects.forEach(({ characterId, state, target }) => {
        if (target === 'random') {
          const aliveChars = characters.filter((c) => c.alive);
          if (aliveChars.length > 0) {
            const random = aliveChars[Math.floor(Math.random() * aliveChars.length)];
            get().setCharacterState(random.id, state);
          }
        } else if (target === 'all') {
          characters.forEach((c) => {
            if (c.alive) get().setCharacterState(c.id, state);
          });
        } else if (characterId) {
          get().setCharacterState(characterId, state);
        }
      });
    }

    if (result.flagChanges) {
      result.flagChanges.forEach(({ flagId, value }) => {
        get().setFlag(flagId, value);
      });
    }
  },

  // Bad luck protection
  getExpeditionBonus: () => {
    const { expeditionFailStreak } = get();
    return Math.min(0.25, expeditionFailStreak * 0.05);
  },

  recordExpeditionResult: (success) => {
    if (success) {
      set({ expeditionFailStreak: 0 });
    } else {
      set({ expeditionFailStreak: get().expeditionFailStreak + 1 });
    }
  },

  // === EXPEDITION SYSTEM ===
  sendExpedition: (characterId, type) => {
    const { characters, expeditions, environment, gameStats } = get();
    const char = characters.find((c) => c.id === characterId);
    if (!char || !char.alive || char.onExpedition) return { success: false, message: 'Cannot send' };

    // Dust storm blocks expeditions
    if (environment.weather === 'dust') {
      return { success: false, message: 'Dust storm blocks expedition' };
    }

    const config = EXPEDITION_CONFIG[type];
    if (!config) return { success: false, message: 'Invalid type' };

    const expedition = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      characterId,
      characterName: char.name,
      type,
      daysRemaining: config.days,
      daysTotal: config.days,
    };

    set({
      characters: characters.map((c) =>
        c.id === characterId ? { ...c, onExpedition: true } : c
      ),
      expeditions: [...expeditions, expedition],
      gameStats: { ...gameStats, totalExpeditions: gameStats.totalExpeditions + 1 },
    });

    return { success: true, message: `${char.name} departed on ${config.labelEn}` };
  },

  processExpeditions: () => {
    const { expeditions, characters, assets, environment } = get();
    if (expeditions.length === 0) return [];

    const results = [];
    const completedIds = [];
    const updatedExpeditions = [];

    expeditions.forEach((exp) => {
      const remaining = exp.daysRemaining - 1;
      if (remaining > 0) {
        updatedExpeditions.push({ ...exp, daysRemaining: remaining });
        return;
      }

      // Expedition complete - resolve
      completedIds.push(exp.characterId);
      const config = EXPEDITION_CONFIG[exp.type];

      // Calculate success chance with skill & environment modifiers
      let successChance = config.baseSuccess;
      // Stealth skill bonus
      const char = characters.find((c) => c.id === exp.characterId);
      const stealthSkill = (char?.skills || []).find((s) => s.id === 'stealth');
      if (stealthSkill) successChance += stealthSkill.bonus;
      // Map item bonus
      const hasMap = get().hasItem('default-item-map');
      if (hasMap) successChance += 0.1;
      // Tracker item bonus
      const hasTracker = get().hasItem('default-item-tracker');
      if (hasTracker) successChance += 0.15;
      // Bad luck protection
      successChance += get().getExpeditionBonus();
      // Storm penalty
      if (environment.weather === 'storm') successChance -= 0.2;
      // High severity penalty
      successChance -= (environment.severity - 1) * 0.05;

      successChance = Math.max(0.1, Math.min(0.95, successChance));
      const success = Math.random() <= successChance;

      get().recordExpeditionResult(success);

      if (success) {
        const foodGain = randInt(config.food[0], config.food[1]);
        const waterGain = randInt(config.water[0], config.water[1]);

        get().addFood(foodGain);
        get().addWater(waterGain);

        // Random item find
        let foundItem = null;
        if (Math.random() < config.itemChance && assets?.items) {
          const findableItems = assets.items.filter((i) =>
            i.category !== 'food' && i.category !== 'water' &&
            !i.id.includes('antidote') && !i.id.includes('supertool') &&
            !i.id.includes('tracker') && !i.id.includes('rations') && !i.id.includes('filter')
          );
          if (findableItems.length > 0) {
            foundItem = findableItems[Math.floor(Math.random() * findableItems.length)];
            get().addItem(foundItem.id, 1);
          }
        }

        results.push({
          characterName: exp.characterName,
          success: true,
          food: foodGain,
          water: waterGain,
          item: foundItem?.name || null,
          type: exp.type,
        });

        set((s) => ({
          gameStats: {
            ...s.gameStats,
            successfulExpeditions: s.gameStats.successfulExpeditions + 1,
            totalFoodGathered: s.gameStats.totalFoodGathered + foodGain,
          },
        }));
      } else {
        // Failure consequences
        const consequences = [];
        const roll = Math.random();

        if (roll < 0.08 && environment.severity >= 4) {
          // Death (rare, only at high severity)
          set({
            characters: get().characters.map((c) =>
              c.id === exp.characterId ? { ...c, alive: false, state: 'dead' } : c
            ),
          });
          consequences.push('dead');
        } else if (roll < 0.3) {
          // Injury
          get().setCharacterState(exp.characterId, 'injured');
          consequences.push('injured');
        } else if (roll < 0.5) {
          // Sick
          get().setCharacterState(exp.characterId, 'sick');
          consequences.push('sick');
        }

        // Might still bring back small amount
        const smallFood = Math.random() < 0.3 ? 1 : 0;
        if (smallFood) get().addFood(smallFood);

        results.push({
          characterName: exp.characterName,
          success: false,
          food: smallFood,
          water: 0,
          item: null,
          consequences,
          type: exp.type,
        });
      }
    });

    // Return expedited characters
    set({
      expeditions: updatedExpeditions,
      characters: get().characters.map((c) =>
        completedIds.includes(c.id) ? { ...c, onExpedition: false } : c
      ),
    });

    return results;
  },

  cancelExpedition: (expeditionId) => {
    const { expeditions, characters } = get();
    const exp = expeditions.find((e) => e.id === expeditionId);
    if (!exp) return false;

    set({
      expeditions: expeditions.filter((e) => e.id !== expeditionId),
      characters: characters.map((c) =>
        c.id === exp.characterId ? { ...c, onExpedition: false } : c
      ),
    });
    return true;
  },

  // === CRAFTING SYSTEM ===
  getAvailableRecipes: () => {
    const { gameData, inventory } = get();
    const recipes = gameData?.recipes || [];

    return recipes.map((recipe) => {
      const canCraft = recipe.ingredients.every((ing) =>
        inventory.some((inv) => inv.itemId === ing.itemId && inv.count >= ing.count)
      );
      return { ...recipe, canCraft };
    });
  },

  craftItem: (recipeId) => {
    const { gameData, inventory, gameStats } = get();
    const recipes = gameData?.recipes || [];
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return { success: false, message: 'Recipe not found' };

    // Check ingredients
    const hasAll = recipe.ingredients.every((ing) =>
      inventory.some((inv) => inv.itemId === ing.itemId && inv.count >= ing.count)
    );
    if (!hasAll) return { success: false, message: 'Missing ingredients' };

    // Success chance with repair skill bonus
    let successChance = recipe.successChance || 0.8;
    successChance += get().getSkillBonus('repair');
    successChance = Math.min(0.98, successChance);

    const success = Math.random() <= successChance;

    // Consume ingredients regardless
    recipe.ingredients.forEach((ing) => {
      get().removeItem(ing.itemId, ing.count);
    });

    if (success) {
      get().addItem(recipe.resultItemId, recipe.resultCount || 1);
      set({ gameStats: { ...gameStats, itemsCrafted: gameStats.itemsCrafted + 1 } });
      return { success: true, message: `Crafted ${recipe.resultName || 'item'}!` };
    } else {
      return { success: false, message: 'Crafting failed! Materials lost.' };
    }
  },

  // === ENVIRONMENT SYSTEM ===
  processEnvironment: () => {
    const { environment, day, gameData } = get();
    if (gameData?.globalStats?.environmentEnabled === false) return;

    const severityIncrease = gameData?.globalStats?.severityIncrease || 7;
    const newSeverity = Math.min(5, 1 + Math.floor(day / severityIncrease));

    // Radiation changes
    const radiationBase = gameData?.globalStats?.radiationBase || 0;
    const radiationDrift = randInt(-5, 10) + (newSeverity - 1) * 3 + Math.round(radiationBase * 0.1);
    const newRadiation = Math.max(0, Math.min(100, environment.radiation + radiationDrift));

    // Weather transition
    const weatherRoll = Math.random();
    let newWeather;
    if (newSeverity >= 4) {
      // High severity - more extreme weather
      if (weatherRoll < 0.3) newWeather = 'clear';
      else if (weatherRoll < 0.5) newWeather = 'rain';
      else if (weatherRoll < 0.75) newWeather = 'storm';
      else newWeather = 'dust';
    } else if (newSeverity >= 2) {
      if (weatherRoll < 0.45) newWeather = 'clear';
      else if (weatherRoll < 0.7) newWeather = 'rain';
      else if (weatherRoll < 0.85) newWeather = 'storm';
      else newWeather = 'dust';
    } else {
      if (weatherRoll < 0.6) newWeather = 'clear';
      else if (weatherRoll < 0.8) newWeather = 'rain';
      else if (weatherRoll < 0.9) newWeather = 'storm';
      else newWeather = 'dust';
    }

    // Temperature
    const tempBase = 20 - (newSeverity - 1) * 5;
    const newTemp = tempBase + randInt(-10, 15);

    set({
      environment: {
        radiation: newRadiation,
        weather: newWeather,
        severity: newSeverity,
        temperature: Math.max(-10, Math.min(50, newTemp)),
      },
    });
  },

  getEnvironmentEffects: () => {
    const { environment } = get();
    const effects = [];

    if (environment.radiation > 60) {
      effects.push({ type: 'radiation', severity: 'danger', message: '높은 방사능 수치!' });
    } else if (environment.radiation > 30) {
      effects.push({ type: 'radiation', severity: 'warning', message: 'Radiation level rising.' });
    }

    if (environment.weather === 'storm') {
      effects.push({ type: 'weather', severity: 'danger', message: '폭풍 - 수색 위험 증가' });
    } else if (environment.weather === 'dust') {
      effects.push({ type: 'weather', severity: 'danger', message: '먼지폭풍 - 수색 불가' });
    } else if (environment.weather === 'rain') {
      effects.push({ type: 'weather', severity: 'info', message: '비가 내림' });
    }

    if (environment.temperature > 40) {
      effects.push({ type: 'temperature', severity: 'danger', message: '극심한 더위!' });
    } else if (environment.temperature < 0) {
      effects.push({ type: 'temperature', severity: 'warning', message: '영하권 추위!' });
    }

    if (environment.severity >= 4) {
      effects.push({ type: 'severity', severity: 'danger', message: `위험도 ${environment.severity}단계` });
    }

    return effects;
  },

  // === ENHANCED ENDING SYSTEM ===
  checkGameEnd: () => {
    const { characters, day, gameData, flags } = get();
    const aliveChars = characters.filter((c) => c.alive);

    // All dead = lose
    if (aliveChars.length === 0) {
      return { ended: true, victory: false, endingType: 'death_all', reason: 'All family members have died.', reasonKo: '모든 가족이 사망했습니다.' };
    }

    // === Special endings (flag-based, checked first) ===

    // Escape ending: tunnel + map + gasmask
    if (flags.found_secret_tunnel && get().hasItem('default-item-map') && get().hasItem('default-item-gasmask')) {
      if (flags.ending_escape) {
        return { ended: true, victory: true, endingType: 'escape', reason: 'You escaped through the tunnel to freedom!', reasonKo: '터널을 통해 탈출에 성공했습니다!' };
      }
    }

    // Scientist ending: crafted antidote + radiation research
    if (flags.ending_scientist) {
      return { ended: true, victory: true, endingType: 'scientist', reason: 'Your radiation cure changes the world!', reasonKo: '방사능 치료제 개발에 성공했습니다! 세상이 바뀝니다.' };
    }

    // Raider King ending: defeated raiders + weapon
    if (flags.raiders_defeated && get().hasItem('default-item-axe') && flags.ending_raider_king) {
      return { ended: true, victory: true, endingType: 'raider_king', reason: 'You established dominance over the wasteland!', reasonKo: '황무지의 지배자가 되었습니다.' };
    }

    // Trader ending: neighbor alliance via negotiation
    if (flags.ending_trader) {
      return { ended: true, victory: true, endingType: 'trader', reason: 'Your trading network rebuilt civilization!', reasonKo: '교역 네트워크로 문명을 재건했습니다!' };
    }

    // Underground ending
    if (flags.ending_underground) {
      return { ended: true, victory: true, endingType: 'underground', reason: 'You found the underground city!', reasonKo: '지하 도시를 발견했습니다!' };
    }

    // Military ending
    if (flags.reached_military) {
      return { ended: true, victory: true, endingType: 'military', reason: 'You reached the military outpost!', reasonKo: '군 전초기지에 도착했습니다!' };
    }

    // Self-sufficient ending: survive 60+ days
    if (day >= 60) {
      return {
        ended: true,
        victory: true,
        endingType: 'self_sufficient',
        reason: 'You built a self-sufficient life in the wasteland!',
        reasonKo: '황무지에서 자급자족하는 삶을 구축했습니다!',
      };
    }

    // Rescue check
    const { rescueMinDay, rescueMaxDay, rescueChancePerDay } = gameData?.globalStats || {};
    if (day >= rescueMinDay && day <= rescueMaxDay) {
      if (Math.random() < rescueChancePerDay) {
        // Check for special rescue variants
        if (aliveChars.length === characters.length) {
          return { ended: true, victory: true, endingType: 'all_alive', reason: 'Rescue arrived! The whole family survived!', reasonKo: '구조대가 도착했습니다! 온 가족이 생존했습니다.' };
        }
        if (aliveChars.length === 1) {
          return { ended: true, victory: true, endingType: 'lone_survivor', reason: `Only ${aliveChars[0].name} survived to see rescue...`, reasonKo: `${aliveChars[0].name}만 구조를 보게 되었습니다...` };
        }
        if (flags.ending_rescue) {
          return { ended: true, victory: true, endingType: 'rescue_requested', reason: 'Your rescue request was answered!', reasonKo: '구조 요청에 응답이 왔습니다!' };
        }
        return { ended: true, victory: true, endingType: 'rescue', reason: 'Rescue has arrived!', reasonKo: '구조대가 도착했습니다!' };
      }
    }

    if (day > rescueMaxDay) {
      // Past max day without rescue = self sufficient
      return { ended: true, victory: true, endingType: 'self_sufficient', reason: 'You survived beyond all hope!', reasonKo: '모든 역경을 이겨내고 생존했습니다!' };
    }

    return { ended: false };
  },

  // Phase management
  setPhase: (phase) => set({ phase }),

  // Evaluate branch node conditions
  evaluateBranchConditions: (conditions) => {
    const { flags, inventory, characters } = get();

    if (!conditions || conditions.length === 0) return true;

    return conditions.every((cond) => {
      switch (cond.type) {
        case 'flag':
          return flags[cond.flagId] === cond.value;

        case 'item':
          return inventory.some((i) => i.itemId === cond.itemId && i.count > 0);

        case 'stat': {
          let statValue = 0;

          if (cond.stat === 'food') {
            statValue = get().food;
          } else if (cond.stat === 'water') {
            statValue = get().water;
          } else if (cond.stat === 'aliveCount') {
            statValue = characters.filter((c) => c.alive).length;
          } else {
            const aliveChars = characters.filter((c) => c.alive);
            if (aliveChars.length === 0) return false;
            statValue = aliveChars.reduce((sum, c) => sum + (c.stats?.[cond.stat] || 0), 0) / aliveChars.length;
          }

          const compareValue = Number(cond.value) || 0;
          switch (cond.operator) {
            case '>': return statValue > compareValue;
            case '>=': return statValue >= compareValue;
            case '<': return statValue < compareValue;
            case '<=': return statValue <= compareValue;
            case '==': return statValue === compareValue;
            case '!=': return statValue !== compareValue;
            default: return statValue > compareValue;
          }
        }

        default:
          return true;
      }
    });
  },

  // Follow node chain
  followNodeChain: (startNodeId) => {
    const { gameData } = get();
    if (!gameData?.nodes) return null;

    let currentNode = gameData.nodes.find((n) => n.id === startNodeId);

    while (currentNode && (currentNode.data.type === 'branch' || currentNode.data.type === 'flag' || currentNode.data.type === 'note')) {
      if (currentNode.data.type === 'branch') {
        const conditions = currentNode.data.conditions || [];
        const result = get().evaluateBranchConditions(conditions);
        const handleId = result ? 'true' : 'false';

        const edge = gameData.edges.find((e) =>
          e.source === currentNode.id && e.sourceHandle === handleId
        );

        if (!edge) return null;
        currentNode = gameData.nodes.find((n) => n.id === edge.target);
        continue;
      }

      if (currentNode.data.type === 'flag') {
        const flagId = currentNode.data.flagId;
        const value = currentNode.data.value !== false;
        if (flagId) {
          get().setFlag(flagId, value);
        }

        const edge = gameData.edges.find((e) => e.source === currentNode.id);
        if (!edge) return null;
        currentNode = gameData.nodes.find((n) => n.id === edge.target);
      }

      if (currentNode?.data?.type === 'note') {
        const edge = gameData.edges.find((e) => e.source === currentNode.id);
        if (!edge) return null;
        currentNode = gameData.nodes.find((n) => n.id === edge.target);
      }
    }

    return currentNode;
  },
}));
