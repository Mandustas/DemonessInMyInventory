/**
 * MapTypeRegistry - Реестр типов карт
 * Централизованное управление темами карт
 */
class MapTypeRegistry {
    constructor() {
        this.themes = new Map();
        this._initialized = false;
    }

    /**
     * Инициализация реестра (регистрация встроенных тем)
     */
    init() {
        if (this._initialized) return;
        
        // Регистрируем встроенные темы
        this.register('forest', new ForestTheme());
        this.register('desert', new DesertTheme());
        this.register('cave', new CaveTheme());
        
        this._initialized = true;
        console.log('[MapTypeRegistry] Инициализирован с темами:', this.getThemeIds());
    }

    /**
     * Регистрация новой темы
     * @param {string} id - Идентификатор темы
     * @param {MapTheme} theme - Объект темы
     */
    register(id, theme) {
        if (!(theme instanceof MapTheme)) {
            console.error(`[MapTypeRegistry] Попытка зарегистрировать неверный тип темы: ${id}`);
            return;
        }
        
        this.themes.set(id, theme);
        console.log(`[MapTypeRegistry] Зарегистрирована тема: ${id} (${theme.name})`);
    }

    /**
     * Получить тему по идентификатору
     * @param {string} id - Идентификатор темы
     * @returns {MapTheme|null}
     */
    getTheme(id) {
        if (!this._initialized) {
            this.init();
        }
        
        const theme = this.themes.get(id);
        if (!theme) {
            console.warn(`[MapTypeRegistry] Тема не найдена: ${id}, используется forest`);
            return this.themes.get('forest');
        }
        return theme;
    }

    /**
     * Получить список всех идентификаторов тем
     * @returns {Array<string>}
     */
    getThemeIds() {
        if (!this._initialized) {
            this.init();
        }
        return Array.from(this.themes.keys());
    }

    /**
     * Получить список всех тем
     * @returns {Array<MapTheme>}
     */
    getAllThemes() {
        if (!this._initialized) {
            this.init();
        }
        return Array.from(this.themes.values());
    }

    /**
     * Получить случайную тему
     * @returns {MapTheme}
     */
    getRandomTheme() {
        if (!this._initialized) {
            this.init();
        }
        
        const ids = this.getThemeIds();
        const randomId = ids[Math.floor(Math.random() * ids.length)];
        return this.getTheme(randomId);
    }

    /**
     * Получить случайный идентификатор темы
     * @returns {string}
     */
    getRandomThemeId() {
        if (!this._initialized) {
            this.init();
        }
        
        const ids = this.getThemeIds();
        return ids[Math.floor(Math.random() * ids.length)];
    }

    /**
     * Проверить существование темы
     * @param {string} id - Идентификатор темы
     * @returns {boolean}
     */
    hasTheme(id) {
        if (!this._initialized) {
            this.init();
        }
        return this.themes.has(id);
    }

    /**
     * Получить информацию о теме для UI
     * @param {string} id - Идентификатор темы
     * @returns {Object}
     */
    getThemeInfo(id) {
        const theme = this.getTheme(id);
        if (!theme) return null;
        
        return {
            id: theme.id,
            name: theme.name,
            enemyTypes: theme.getEnemyTypes(),
            textures: { ...theme.textures }
        };
    }

    /**
     * Получить информацию о всех темах для UI
     * @returns {Array<Object>}
     */
    getAllThemesInfo() {
        if (!this._initialized) {
            this.init();
        }
        
        return this.getThemeIds().map(id => this.getThemeInfo(id));
    }

    /**
     * Создать кастомную тему на основе конфигурации
     * @param {Object} config - Конфигурация темы
     * @returns {MapTheme}
     */
    createCustomTheme(config) {
        // Создаём базовую тему с кастомными параметрами
        const CustomTheme = class extends MapTheme {
            constructor(cfg) {
                super(cfg);
            }
            
            getBiomeType() {
                return config.biomeType || 'default';
            }
        };
        
        return new CustomTheme(config);
    }

    /**
     * Регистрация кастомной темы из конфигурации
     * @param {string} id - Идентификатор
     * @param {Object} config - Конфигурация темы
     */
    registerFromConfig(id, config) {
        const theme = this.createCustomTheme(config);
        this.register(id, theme);
    }
}

// Создаём глобальный экземпляр реестра
const mapTypeRegistry = new MapTypeRegistry();

// Экспорт
if (typeof window !== 'undefined') {
    window.MapTypeRegistry = MapTypeRegistry;
    window.mapTypeRegistry = mapTypeRegistry;
}