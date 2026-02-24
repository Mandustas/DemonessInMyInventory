/**
 * MapTheme - Базовый класс темы карты
 * Определяет текстуры, врагов и элементы ландшафта для конкретного типа карты
 */
class MapTheme {
    /**
     * @param {Object} config - Конфигурация темы
     * @param {string} config.name - Название темы
     * @param {string} config.id - Идентификатор темы
     * @param {Object} config.textures - Цвета текстур для тайлов
     * @param {Array<string>} config.enemyTypes - Доступные типы врагов
     * @param {Object} config.obstacles - Настройки препятствий
     * @param {Object} config.decorations - Настройки декораций
     * @param {Object} config.generation - Параметры генерации
     */
    constructor(config) {
        this.name = config.name || 'Unknown Theme';
        this.id = config.id || 'unknown';
        this.textures = config.textures || {};
        this.enemyTypes = config.enemyTypes || ['TANK'];
        this.obstacles = config.obstacles || {};
        this.decorations = config.decorations || {};
        this.generation = config.generation || {};
    }

    /**
     * Получить случайного врага для этой темы
     * @returns {string} - Тип врага
     */
    getRandomEnemy() {
        if (!this.enemyTypes || this.enemyTypes.length === 0) {
            return 'TANK'; // По умолчанию
        }
        const index = Math.floor(Math.random() * this.enemyTypes.length);
        return this.enemyTypes[index];
    }

    /**
     * Получить список всех доступных типов врагов
     * @returns {Array<string>}
     */
    getEnemyTypes() {
        return [...this.enemyTypes];
    }

    /**
     * Получить цвет текстуры для типа тайла
     * @param {number} tileType - Тип тайла (0-7)
     * @returns {string} - HEX цвет
     */
    getTileColor(tileType) {
        const typeNames = ['floor', 'wall', 'column', 'tree', 'rock', 'water', 'ice', 'decoration'];
        const typeName = typeNames[tileType] || 'floor';
        return this.textures[typeName] || this.getDefaultColor(tileType);
    }

    /**
     * Получить цвет по умолчанию для типа тайла
     * @param {number} tileType - Тип тайла
     * @returns {string} - HEX цвет
     */
    getDefaultColor(tileType) {
        const defaults = {
            0: '#1a1512', // floor
            1: '#2d2520', // wall
            2: '#2d2520', // column
            3: '#1a2f1a', // tree
            4: '#1f1a17', // rock
            5: '#1a2630', // water
            6: '#2d3a3f', // ice
            7: '#1a2f1a'  // decoration
        };
        return defaults[tileType] || '#1a1512';
    }

    /**
     * Получить шанс появления препятствия
     * @param {string} obstacleType - Тип препятствия
     * @returns {number} - Шанс (0-1)
     */
    getObstacleChance(obstacleType) {
        return this.obstacles[obstacleType]?.chance || 0.05;
    }

    /**
     * Получить параметры генерации
     * @param {string} param - Имя параметра
     * @param {*} defaultValue - Значение по умолчанию
     * @returns {*}
     */
    getGenerationParam(param, defaultValue) {
        return this.generation[param] ?? defaultValue;
    }

    /**
     * Применить тему к чанку (изменяет типы тайлов)
     * @param {Object} chunk - Объект чанка
     */
    applyToChunk(chunk) {
        // Переопределяется в дочерних классах
    }

    /**
     * Получить тип биома для темы
     * @returns {string}
     */
    getBiomeType() {
        return 'default';
    }

    /**
     * Сериализация темы для сохранения
     * @returns {Object}
     */
    serialize() {
        return {
            id: this.id,
            name: this.name
        };
    }
}

// Экспорт для использования в других модулях
if (typeof window !== 'undefined') {
    window.MapTheme = MapTheme;
}