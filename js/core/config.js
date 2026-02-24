// Конфигурационный файл для игры Diablo

const GAME_CONFIG = {
    // Настройки игры
    INITIAL_CHUNK_SIZE: 16,
    PLAYER_SPEED: 200, // Пикселей в секунду (вместо 8 пикселей за кадр)
    ENEMY_SPAWN_ATTEMPTS: 1000,
    CHUNK_LOAD_RADIUS: 5,
    CHUNK_UNLOAD_RADIUS: 7,
    
    // Настройки камеры
    CAMERA: {
        DEFAULT_ZOOM: 2.0,
        MIN_ZOOM: 1.0,
        MAX_ZOOM: 3.0,
        ZOOM_SPEED: 0.15,
        ZOOM_DELTA_ON_WHEEL: 0.3
    },
    
    // Настройки тайла
    TILE: {
        BASE_SIZE: 64
    },
    
    // Настройки персонажа
    CHARACTER: {
        INITIAL_HEALTH: 100,
        INITIAL_MANA: 50,
        INITIAL_LEVEL: 1,
        INITIAL_EXPERIENCE: 0,
        EXPERIENCE_PER_LEVEL: 100,
        EXPERIENCE_MULTIPLIER: 1.5,

        // Основные характеристики
        INITIAL_STRENGTH: 10,         // Сила - влияет на физический урон
        INITIAL_DEXTERITY: 10,        // Ловкость - влияет на скорость атаки и крит
        INITIAL_VITALITY: 10,         // Живучесть - влияет на здоровье
        INITIAL_ENERGY: 10,           // Энергия - влияет на ману и регенерацию
        INITIAL_INTELLIGENCE: 10,     // Интеллект - влияет на магический урон и ману

        // Прирост характеристик при повышении уровня (отменен - только от предметов)
        LEVEL_UP_HEALTH_INCREASE: 0,  // HP не растет от уровня
        LEVEL_UP_MANA_INCREASE: 0,    // Mana не растет от уровня
        LEVEL_UP_STAT_INCREASE: 0,    // Статы не растут от уровня
        LEVEL_UP_ENERGY_INCREASE: 0,  // Energy не растет от уровня

        // Навыки
        SKILL_POINT_PER_LEVEL: 1,
        MELEE_MASTERY_BONUS: 0.1,     // 10% физ. урона за уровень навыка
        CRITICAL_STRIKE_BONUS: 3,     // 3% шанс крита за уровень навыка
        LIFE_LEECH_BONUS: 2,          // 2% похищения жизни за уровень навыка
        MAGIC_MASTERY_BONUS: 0.1,     // 10% маг. урона за уровень навыка
        MANA_EFFICIENCY_BONUS: 0.05,  // 5% снижение стоимости маны за уровень
        FIREBALL_DAMAGE_BONUS: 10,    // +10 маг. урона за уровень
        HEAL_PERCENT_BONUS: 0.05,     // 5% лечения за уровень

        // Стоимость маны для навыков
        SKILL_MANA_COST: {
            fireball: { base: 15, per_level: 3 },
            heal: { base: 12, per_level: 2 },
            default: { base: 8, per_level: 1 }
        },

        // Формулы характеристик
        // Здоровье: 10 HP за единицу живучести
        VITALITY_HP_MULTIPLIER: 10,
        // Мана: 3 за энергию + 2 за интеллект
        ENERGY_MANA_MULTIPLIER: 3,
        INTELLIGENCE_MANA_MULTIPLIER: 2,
        // Физический урон: 1.5 за единицу силы
        STRENGTH_PHYSICAL_DAMAGE_MULTIPLIER: 1.5,
        // Магический урон: 1.5 за единицу интеллекта
        INTELLIGENCE_MAGIC_DAMAGE_MULTIPLIER: 1.5,
        // Скорость атаки: базовая 1.0 + 2% за ловкость (100 ловкости = 3.0 атак/сек)
        DEXTERITY_ATTACK_SPEED_MULTIPLIER: 0.04,
        BASE_ATTACK_SPEED: 1.0,       // Базовая скорость атаки (атак в секунду)
        // Шанс крита: 0.5% за ловкость (100 ловкости = 50% крита, макс 50%)
        DEXTERITY_CRITICAL_MULTIPLIER: 0.5,
        MAX_CRITICAL_CHANCE: 50,      // Максимальный шанс крита (%)
        // Восстановление маны: 2 + 0.1 за энергию + 0.05 за интеллект (в секунду)
        BASE_MANA_REGEN: 2,
        ENERGY_MANA_REGEN_MULTIPLIER: 0.1,
        INTELLIGENCE_MANA_REGEN_MULTIPLIER: 0.05,

        // Хитбоксы
        HITBOX_RADIUS: 16,

        // Инвентарь
        INVENTORY_SIZE: 24
    },
    
    // Настройки врагов
    ENEMY: {
        // Базовые типы врагов с характеристиками
        TYPES: {
            TANK: {
                // Основные характеристики
                strength: 8,
                dexterity: 4,
                vitality: 12,
                energy: 10,
                intelligence: 8,
                // Боевые параметры
                speed: 35,
                detectionRange: 80,
                attackRange: 60,  // > 50 (радиус откидывания)
                attackType: 'physical', // physical или magic
                experienceValue: 30
            },
            ASSASSIN: {
                strength: 7,
                dexterity: 10,
                vitality: 6,
                energy: 10,
                intelligence: 8,
                speed: 100,
                detectionRange: 90,
                attackRange: 55,  // > 50 (радиус откидывания)
                attackType: 'physical',
                experienceValue: 25
            },
            MAGE: {
                strength: 5,
                dexterity: 6,
                vitality: 7,
                energy: 10,
                intelligence: 10,
                speed: 45,
                detectionRange: 130,
                attackRange: 70,  // > 50 (радиус откидывания), дальняя атака
                attackType: 'magic',
                experienceValue: 30
            }
        },

        // Настройки атаки
        ATTACK_COOLDOWN: 1200, // Миллисекунд между атаками (базовое)

        // Хитбоксы
        HITBOX_RADIUS: 15,

        // Блуждание
        WANDER_INTERVAL_MIN: 2000,
        WANDER_INTERVAL_MAX: 5000,
        WANDER_DISTANCE_MIN: 30,
        WANDER_DISTANCE_MAX: 100,
        WANDER_SPEED_MULTIPLIER: 0.5
    },
    
    // Настройки боевой системы
    COMBAT: {
        MIN_DAMAGE: 1,
        DAMAGE_VARIATION_MIN: 0.8,    // 80% от базового урона
        DAMAGE_VARIATION_MAX: 1.2,    // 120% от базового урона
        CRITICAL_DAMAGE_MULTIPLIER: 1.5,  // 150% урона при критическом ударе
        // Убраны: BASE_ACCURACY, ACCURACY_PER_DEXTERITY, DODGE_PER_DEXTERITY
        CRITICAL_CHANCE_PER_DEXTERITY: 0.5  // 0.5% за ловкость
    },
    
    // Настройки рендеринга
    RENDERER: {
        COLORS: {
            PLAYER: '#3a4a5a',
            PLAYER_HIGHLIGHT: '#5a6a7a',
            PLAYER_SHADOW: '#1a2a3a',
            ENEMY_TANK: '#2a0505',      // Тёмно-красный танк
            ENEMY_ASSASSIN: '#4a4a2a',  // Тёмно-жёлтый ассасин
            ENEMY_MAGE: '#2a052a',      // Тёмно-фиолетовый маг
            WALL: '#2d2520',
            WALL_DARK: '#1a1512',
            FLOOR: '#1a1512',
            FLOOR_LIGHT: '#2a2218',
            GRID: '#3d2f22',
            TREE_TRUNK: '#3d2818',
            TREE_LEAVES: '#1a2f1a',
            ROCK: '#1f1a17',
            WATER: '#1a2630',
            ICE: '#2d3a3f',
            DECORATION: '#1a2f1a'
        }
    },
    
    // Настройки системы чанков
    CHUNK_SYSTEM: {
        DEFAULT_SIZE: 16,
        LOAD_RADIUS: 5,
        UNLOAD_RADIUS: 7
    },
    
    // Настройки генерации подземелья
    DUNGEON_GENERATOR: {
        DEFAULT_ROOM_COUNT: 8,
        DEFAULT_MIN_ROOM_SIZE: 16,
        DEFAULT_MAX_ROOM_SIZE: 114,
        DEFAULT_BIOME_COUNT: 3,
        MAX_GENERATION_ATTEMPTS: 10,
        ROOM_OVERLAP_ATTEMPTS: 100,
        BIOME_DENSITY_MIN: 0.3,
        BIOME_DENSITY_MAX: 0.8,
        // Уменьшено с 0.05 до 0.015 - меньше препятствий на полу
        OBSTACLE_CHANCE_BASE: 0.015,
        CORRIDOR_OBSTACLE_MULTIPLIER: 1.0,
        DECORATION_CHANCE_BASE: 0.03,
        // Уменьшено с 0.15 до 0.05 - меньше деревьев в лесу
        FOREST_TREE_CHANCE: 0.05,
        DESERT_ROCK_CHANCE: 0.03,
        // Уменьшено с 0.3 до 0.1 - меньше скал в горах
        MOUNTAIN_ROCK_CHANCE: 0.1,
        // Уменьшено с 0.2 до 0.08 - меньше воды в болоте
        SWAMP_WATER_CHANCE: 0.08,
        ICE_ICE_CHANCE: 0.1,
        DEFAULT_DECORATION_CHANCE: 0.02
    },
    
    // Настройки атаки
    ATTACK: {
        RANGE: 50,
        SKILL_RANGE: 80
    },
    
    // Настройки спауна врагов
    SPAWN: {
        ENEMIES_PER_CHUNK: 0.5, // Количество врагов на чанк
        MIN_ENEMIES: 2,
        MIN_ENEMIES_UPDATE: 3,
        PLAYER_SPAWN_DISTANCE_MIN: 80,
        PLAYER_SPAWN_DISTANCE_MAX: 300,
        PLAYER_SPAWN_DISTANCE_DEFAULT: 200,
        CHUNK_RANGE_FOR_SPAWN: 3
    },
    
    // Настройки движения
    MOVEMENT: {
        MIN_DISTANCE_TO_TARGET: 5,
        SPEED_INCREASE_FACTOR: 2
    },
    
    // Настройки обновления
    UPDATE: {
        ENEMY_SPAWN_INTERVAL: 1000 // Миллисекунд между обновлениями спауна врагов
    },
    
    // Настройки UI компонентов
    UI: {
        INVENTORY_WINDOW: {
            WIDTH: 600,
            HEIGHT: 300,
            SLOT_SIZE: 60,
            SLOT_GAP: 5,
            GRID_COLUMNS: 5,
            PADDING: 20,
            BORDER_WIDTH: 2,
            POSITION_TOP: '50%',
            POSITION_LEFT: '50%'
        },
        STATS_WINDOW: {
            WIDTH: 600,
            PADDING: 20,
            BORDER_WIDTH: 2,
            POSITION_TOP: '50%',
            POSITION_LEFT: '50%'
        },
        SKILL_TREE: {
            WIDTH: 600,
            PADDING: 20,
            BORDER_WIDTH: 2,
            POSITION_TOP: '50%',
            POSITION_LEFT: '50%',
            SKILL_SLOT_WIDTH: 50,
            SKILL_SLOT_HEIGHT: 50,
            SKILL_SLOT_GAP: 5,
            SKILL_GRID_COLUMNS: 2
        },
        SKILL_BAR: {
            SLOT_WIDTH: 50,
            SLOT_HEIGHT: 50,
            SLOT_GAP: 5,
            BAR_PADDING: 8,
            HEALTH_MANA_WIDTH: 60,
            HEALTH_MANA_HEIGHT: 60,
            HEALTH_MANA_BORDER_WIDTH: 3,
            HEALTH_MANA_CIRCLE_RADIUS: 26,
            HEALTH_MANA_CIRCLE_CIRCUMFERENCE: 163.36
        },
        MINIMAP: {
            WIDTH: 250,
            HEIGHT: 250,
            SCALE: 1.2,
            PADDING: 8,
            BORDER_WIDTH: 2,
            PLAYER_DOT_RADIUS: 4,
            ENEMY_DOT_RADIUS: 3,
            POSITION_BOTTOM: 20,
            POSITION_LEFT: 20
        }
    },
    
    // Настройки изометрической проекции
    ISOMETRIC: {
        ANGLE: Math.atan(0.5), // Угол для изометрической проекции
        TILE_WIDTH: 64,  // Ширина тайла
        TILE_HEIGHT: 32  // Высота тайла
    },
    
    // Настройки сохранения
    SAVE: {
        KEY: 'diablo_rpg_save'
    },
    
    // Настройки предметов
    ITEMS: {
        RARITY_CHANCES: {
            COMMON: 0.5,      // 50% шанс на обычный
            UNCOMMON: 0.8,    // 30% шанс на необычный (0.8 - 0.5 = 0.3)
            RARE: 0.95,       // 15% шанс на редкий (0.95 - 0.8 = 0.15)
            EPIC: 1.0         // 5% шанс на эпический (1.0 - 0.95 = 0.05)
        },
        // Количество характеристик на предмете в зависимости от редкости
        STATS_PER_RARITY: {
            common: 1,
            uncommon: 2,
            rare: 3,
            epic: 4
        },
        // Диапазоны значений характеристик для каждого типа предмета
        STAT_VALUE_RANGES: {
            // Основные характеристики
            strength: { min: 1, max: 5 },
            dexterity: { min: 1, max: 5 },
            vitality: { min: 1, max: 5 },
            energy: { min: 1, max: 5 },
            intelligence: { min: 1, max: 5 },
            // Производные характеристики
            physicalDamage: { min: 2, max: 10 },
            magicDamage: { min: 2, max: 10 },
            attackSpeed: { min: 0.05, max: 0.2 },
            criticalChance: { min: 1, max: 5 },
            manaRegen: { min: 0.5, max: 2 },
            health: { min: 10, max: 50 }
        },
        // Возможные статы для каждого типа предмета
        POSSIBLE_STATS_BY_TYPE: {
            weapon: ['physicalDamage', 'strength', 'dexterity', 'criticalChance', 'attackSpeed'],
            helmet: ['vitality', 'energy', 'intelligence', 'manaRegen', 'health'],
            armor: ['vitality', 'strength', 'health', 'energy', 'physicalDamage'],
            ring: ['strength', 'dexterity', 'vitality', 'energy', 'intelligence', 'criticalChance'],
            amulet: ['intelligence', 'energy', 'magicDamage', 'manaRegen', 'health', 'strength']
        },
        BASE_VALUE: 10,
        VALUE_MULTIPLIERS: {
            UNCOMMON: 2,
            RARE: 5,
            EPIC: 10
        },
        STAT_VALUE_MULTIPLIER: 5
    },
    
    // Настройки генерации мира
    WORLD_MAP: {
        SEED_MULTIPLIER: 10000,
        ROOM_DENSITY: 0.015, // Плотность комнат на тайл
        MIN_ROOM_SIZE: 5,
        MAX_ROOM_SIZE: 10,
        CORRIDOR_WIDTH: 2,
        CHUNK_SIZE: 16,
        LOAD_RADIUS: 4,
        UNLOAD_RADIUS: 6,
        EXTRA_CONNECTIONS_PERCENTAGE: 0.3, // 30% дополнительных связей
        BIOME_CHANCES: {
            FOREST: 0.2,
            DESERT: 0.4,
            MOUNTAIN: 0.6,
            SWAMP: 0.8
        },
        ELEMENT_CHANCES: {
            ICE: 0.05,      // 5% шанс льда
            TREE: 0.06,     // 6% шанс дерева
            ROCK: 0.04,     // 4% шанс скалы
            ROCK_ALT: 0.12, // 12% шанс скалы (альтернативный)
            WATER: 0.08     // 8% шанс воды
        },
        PASSAGE_BLOCK_CHECK_TYPES: [3, 4, 5], // Типы тайлов, которые могут блокировать проход
        CONNECTED_PASSABLE_TILES: [0, 6, 7], // Проходимые тайлы для проверки связности
        MIN_RENDER_RADIUS: 3,
        RENDER_RADIUS_EXTRA: 2
    },
    
    // Настройки карты ограниченного размера
    MAP: {
        WIDTH: 256,              // Ширина карты в тайлах
        HEIGHT: 256,             // Высота карты в тайлах
        DEFAULT_TYPE: 'forest',  // Тип карты по умолчанию (если не выбран случайно)
        RANDOM_TYPE_ON_START: true, // Выбирать случайный тип карты при старте
        
        // Доступные типы карт
        TYPES: {
            forest: {
                name: 'Тёмный лес',
                enemyTypes: ['TANK', 'ASSASSIN'],
                description: 'Тёмный лес с густой растительностью'
            },
            desert: {
                name: 'Пустыня',
                enemyTypes: ['MAGE', 'ASSASSIN'],
                description: 'Песчаные дюны и скалы'
            },
            cave: {
                name: 'Пещера',
                enemyTypes: ['TANK', 'MAGE'],
                description: 'Тёмные пещеры с сталактитами'
            }
        },
        
        // Настройки спавна врагов
        ENEMY_SPAWN: {
            ENEMIES_PER_ROOM: 2,      // Врагов на комнату
            MIN_DISTANCE_FROM_PLAYER: 10, // Минимальное расстояние от игрока
            MAX_ENEMIES_TOTAL: 100    // Максимальное количество врагов на карте
        },
        
        // Настройки сундуков
        CHESTS: {
            MAX_CHESTS: 20,           // Максимальное количество сундуков на карте
            SPAWN_CHANCE: 0.03,       // Шанс спавна на проходимом тайле (3%)
            MIN_DISTANCE: 15,         // Минимальное расстояние между сундуками в тайлах
            MIN_DISTANCE_FROM_PLAYER: 20, // Минимальное расстояние от игрока при спавне
            ITEMS_MIN: 1,             // Минимальное количество предметов в сундуке
            ITEMS_MAX: 2,             // Максимальное количество предметов в сундуке
            GUARDIAN_SPAWN_CHANCE: 0.7, // Шанс спавна охранника рядом с сундуком (70%)
            GUARDIAN_DISTANCE: 3      // Расстояние спавна охранника от сундука (в тайлах)
        }
    },
    
    // Дополнительные настройки тайлов
    TILE_DIMENSIONS: {
        WIDTH: 64,
        HEIGHT: 32
    },
    
    // Настройки поиска позиций
    POSITION_SEARCH: {
        MAX_RADIUS: 10
    },

    // Настройки отладки
    DEBUG: {
        TELEPORT_ON_RIGHT_CLICK: true,  // Включить телепортацию по правому клику
        ENABLE_FPS_COUNTER: false,      // Включить вывод отладочной информации о FPS и чанках
        SHOW_CHUNK_INFO: false          // Показывать информацию о рендеринге чанков
    },

  // Настройки оптимизации производительности
  OPTIMIZATION: {
    CHUNK_CACHE_MAX_SIZE: 50,           // Максимальное количество чанков в кэше
    CHUNK_UNLOAD_DISTANCE: 3,           // Чанков от игрока для выгрузки
    ENTITY_CULLING_MARGIN: 100,         // Пикселей за пределами экрана для culling
    SPATIAL_HASH_CELL_SIZE: 128,        // Размер ячейки для пространственного хеширования
    LIGHTING_UPDATE_RADIUS: 8,          // Тайлов от игрока для обновления освещения
    LIGHTING_CACHE_TTL: 5000,           // Время жизни кэша освещения в мс
    PARTICLE_CULLING_ENABLED: true,     // Включить culling для частиц
    DISTANT_ENTITY_UPDATE_INTERVAL: 3,  // Обновлять далёких врагов каждые N кадров
    CHUNK_UNLOAD_THRESHOLD: 512         // Порог расстояния для очистки кэша чанков (в пикселях)
  },
  
  // Настройки системы освещения
  LIGHTING: {
        DEFAULT_RADIUS: 20,           // Радиус освещения в тайлах (увеличено для лучшей видимости)
        MIN_RADIUS: 15,                // Минимальный радиус
        MAX_RADIUS: 40,               // Максимальный радиус
        FALLOFF: 1.2,                 // Экспонента затухания (уменьшено для плавного перехода)
        AMBIENT_LIGHT: 0.4,          // Фоновое освещение (увеличено для видимости)
        
        // Цвет света (тёплый, как факел)
        LIGHT_COLOR: {
            R: 1.0,                   // Красный канал
            G: 0.85,                  // Зелёный канал (чуть меньше для теплоты)
            B: 0.6                    // Синий канал (ещё меньше для тёплого оттенка)
        },
        
        // Нормали для типов тайлов (x, y, z) - определяют как свет отражается от поверхности
        TILE_NORMALS: {
            FLOOR: { x: 0, y: 0, z: 1 },           // Пол - горизонтальная поверхность
            WALL: { x: 0, y: -0.5, z: 0.866 },     // Стена - наклонная вперёд
            COLUMN: { x: 0, y: -0.3, z: 0.95 },    // Колонна - слегка наклонная
            TREE: { x: 0, y: -0.2, z: 0.98 },      // Дерево - почти вертикальная
            ROCK: { x: 0, y: -0.1, z: 0.99 },      // Скала - почти горизонтальная
            WATER: { x: 0, y: 0, z: 1 },           // Вода - горизонтальная
            ICE: { x: 0, y: 0, z: 1 },             // Лёд - горизонтальная
            DECORATION: { x: 0, y: 0, z: 1 }       // Декорация - горизонтальная
        },
        
        // Множители яркости для типов тайлов
        TILE_BRIGHTNESS: {
            FLOOR: 1.0,
            WALL: 0.85,
            COLUMN: 0.9,
            TREE: 0.8,
            ROCK: 0.75,
            WATER: 0.7,
            ICE: 0.8,
            DECORATION: 0.9
        },
        
        // Настройки факелов
        TORCH: {
            RADIUS: 4,               // Радиус освещения в тайлах (уменьшено)
            FLICKER_ENABLED: false,  // Включить мерцание (false по умолчанию)
            FLICKER_SPEED: 3,        // Скорость мерцания (уменьшено)
            FLICKER_AMOUNT: 0.3,     // Сила мерцания (0-1) (уменьшено)
            SPAWN_CHANCE: 0.1,     // Шанс спауна на проходимом тайле (уменьшено в 4 раза)
            MIN_DISTANCE: 12,        // Минимальное расстояние между факелами в тайлах (увеличено)
            MAX_TORCHES: 50,         // Максимальное количество факелов
            UNLOAD_DISTANCE: 20      // Расстояние для выгрузки факелов (в тайлах)
        },
        
        // Настройки файрбола
        FIREBALL: {
            LIGHT_RADIUS: 4,         // Радиус освещения в тайлах (уменьшено)
            LIGHT_COLOR: { R: 1.0, G: 0.5, B: 0.1 }, // Ярко-оранжевый
            LIGHT_INTENSITY: 1.0,    // Интенсивность освещения (уменьшено)
            SPEED: 300,              // Скорость полёта (пикселей в секунду)
            PARTICLE_COUNT: 10,      // Количество частиц (уменьшено)
            EXPLOSION_RADIUS: 2,     // Радиус взрыва в тайлах (уменьшено)
            MAX_RANGE: 12            // Максимальная дальность полёта в тайлах
        },
        
    // Настройки кэша освещения
        CACHE: {
            MAX_SIZE: 5000,          // Максимальный размер кэша
            CLEAR_ON_MOVE: true      // Очищать кэш при перемещении игрока
        }
    },
    
    // Настройки тумана войны
    FOG_OF_WAR: {
        ENABLED: true,               // Включить систему тумана войны
        EXPLORED_DARKNESS: 0.35,     // Затемнённость исследованных но не видимых тайлов (0-1)
        UNEXPLORED_DARKNESS: 0.08,   // Затемнённость неисследованных тайлов (0-1)
        UPDATE_INTERVAL: 1           // Интервал обновления маски видимости (каждый N кадров)
    }
};

// Делаем конфигурацию глобально доступной
if (typeof window !== 'undefined') {
    window.GAME_CONFIG = GAME_CONFIG;
}