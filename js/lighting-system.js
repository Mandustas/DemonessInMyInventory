/**
 * Система освещения на основе карт нормалей
 * Поддерживает множественные источники света (игрок, факелы, файрболы)
 */
class LightingSystem {
    /**
     * Конструктор системы освещения
     * @param {Object} config - конфигурация освещения из GAME_CONFIG.LIGHTING
     */
    constructor(config = GAME_CONFIG.LIGHTING) {
        this.config = config;
        
        // Карта всех источников света
        this.lightSources = new Map();
        
        // Источник света игрока (отдельно для быстрого доступа)
        this.playerLight = null;
        
        // Кэш значений освещения для оптимизации
        this.lightingCache = new Map();
        
        // Кэш для цветов тайлов
        this.tileColorCache = new Map();
        
        // Флаг необходимости очистки кэша
        this.cacheDirty = true;
        
        // Максимальный размер кэша
        this.maxCacheSize = (config.CACHE && config.CACHE.MAX_SIZE) || 5000;
        
        // Инициализация нормалей для типов тайлов
        this.initNormals();
        
        // Инициализация базовых цветов для типов тайлов
        this.initBaseColors();
        
        // Создаём источник света игрока
        this.createPlayerLight();
    }
    
    /**
     * Создание источника света игрока
     */
    createPlayerLight() {
        this.playerLight = new LightSource({
            id: 'player_light',
            x: 0,
            y: 0,
            radius: this.config.DEFAULT_RADIUS,
            color: this.config.LIGHT_COLOR,
            intensity: 1.0,
            type: 'player',
            flicker: false,
            height: 64
        });
        this.lightSources.set(this.playerLight.id, this.playerLight);
    }
    
    /**
     * Инициализация нормалей для каждого типа тайла
     */
    initNormals() {
        this.normals = new Map();
        
        // Типы тайлов: 0-пол, 1-стена, 2-колонна, 3-дерево, 4-скала, 5-вода, 6-лёд, 7-декорация
        const tileTypes = ['FLOOR', 'WALL', 'COLUMN', 'TREE', 'ROCK', 'WATER', 'ICE', 'DECORATION'];
        
        for (let i = 0; i < tileTypes.length; i++) {
            const normal = this.config.TILE_NORMALS[tileTypes[i]];
            this.normals.set(i, this.normalizeVector(normal));
        }
    }
    
    /**
     * Инициализация базовых цветов для типов тайлов
     */
    initBaseColors() {
        this.baseColors = new Map();
        
        // Цвета из конфигурации рендерера
        const colors = GAME_CONFIG.RENDERER.COLORS;
        
        // Преобразуем HEX цвета в RGB
        this.baseColors.set(0, this.hexToRgb(colors.FLOOR));       // Пол
        this.baseColors.set(1, this.hexToRgb(colors.WALL));        // Стена
        this.baseColors.set(2, this.hexToRgb(colors.WALL_DARK));   // Колонна
        this.baseColors.set(3, this.hexToRgb(colors.TREE_LEAVES)); // Дерево
        this.baseColors.set(4, this.hexToRgb(colors.ROCK));        // Скала
        this.baseColors.set(5, this.hexToRgb(colors.WATER));       // Вода
        this.baseColors.set(6, this.hexToRgb(colors.ICE));         // Лёд
        this.baseColors.set(7, this.hexToRgb(colors.DECORATION));  // Декорация
    }
    
    /**
     * Добавление источника света
     * @param {LightSource} lightSource - источник света
     * @returns {string} - ID источника
     */
    addLightSource(lightSource) {
        this.lightSources.set(lightSource.id, lightSource);
        this.cacheDirty = true;
        return lightSource.id;
    }
    
    /**
     * Создание и добавление источника света
     * @param {Object} config - конфигурация источника
     * @returns {LightSource} - созданный источник
     */
    createLightSource(config) {
        const lightSource = new LightSource(config);
        this.addLightSource(lightSource);
        return lightSource;
    }
    
    /**
     * Удаление источника света
     * @param {string} id - ID источника
     */
    removeLightSource(id) {
        if (id === 'player_light') {
            console.warn('Нельзя удалить источник света игрока');
            return;
        }
        this.lightSources.delete(id);
        this.cacheDirty = true;
    }
    
    /**
     * Получение источника света по ID
     * @param {string} id - ID источника
     * @returns {LightSource|null} - источник света или null
     */
    getLightSource(id) {
        return this.lightSources.get(id) || null;
    }
    
    /**
     * Установка позиции источника света игрока
     * @param {number} x - X координата в мировых координатах
     * @param {number} y - Y координата в мировых координатах
     */
    setLightSource(x, y) {
        if (this.playerLight) {
            const dx = x - this.playerLight.x;
            const dy = y - this.playerLight.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            this.playerLight.setPosition(x, y);
            
            // Помечаем кэш как грязный при перемещении
            if (distance > 1) {
                this.cacheDirty = true;
            }
        }
    }
    
    /**
     * Обновление позиции произвольного источника света
     * @param {string} id - ID источника
     * @param {number} x - X координата
     * @param {number} y - Y координата
     */
    updateLightPosition(id, x, y) {
        const light = this.lightSources.get(id);
        if (light) {
            light.setPosition(x, y);
            this.cacheDirty = true;
        }
    }
    
    /**
     * Установка радиуса освещения игрока
     * @param {number} radius - новый радиус в тайлах
     */
    setRadius(radius) {
        if (this.playerLight) {
            this.playerLight.radius = Math.max(
                this.config.MIN_RADIUS,
                Math.min(this.config.MAX_RADIUS, radius)
            );
            this.cacheDirty = true;
        }
    }
    
    /**
     * Обновление всех источников света
     * @param {number} deltaTime - время с последнего обновления в мс
     */
    update(deltaTime) {
        // Обновляем все источники света
        const inactiveLights = [];
        
        for (const [id, light] of this.lightSources) {
            light.update(deltaTime);
            
            // Собираем неактивные источники (кроме игрока)
            if (!light.active && id !== 'player_light') {
                inactiveLights.push(id);
            }
        }
        
        // Удаляем неактивные источники
        for (const id of inactiveLights) {
            this.lightSources.delete(id);
        }
        
        // Периодически очищаем кэш при превышении размера
        this.trimCacheIfNeeded();
    }
    
    /**
     * Очистка кэша освещения
     */
    clearCache() {
        this.lightingCache.clear();
        this.tileColorCache.clear();
        this.cacheDirty = true;
    }
    
    /**
     * Очистка кэша при превышении размера
     */
    trimCacheIfNeeded() {
        if (this.lightingCache.size > this.maxCacheSize) {
            // Удаляем половину кэша (первые добавленные записи)
            const keysToDelete = Array.from(this.lightingCache.keys()).slice(0, Math.floor(this.maxCacheSize / 2));
            for (const key of keysToDelete) {
                this.lightingCache.delete(key);
            }
        }
        
        if (this.tileColorCache.size > this.maxCacheSize) {
            const keysToDelete = Array.from(this.tileColorCache.keys()).slice(0, Math.floor(this.maxCacheSize / 2));
            for (const key of keysToDelete) {
                this.tileColorCache.delete(key);
            }
        }
    }
    
    /**
     * Нормализация вектора
     * @param {Object} v - вектор {x, y, z}
     * @returns {Object} - нормализованный вектор
     */
    normalizeVector(v) {
        const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        if (length === 0) return { x: 0, y: 0, z: 1 };
        return {
            x: v.x / length,
            y: v.y / length,
            z: v.z / length
        };
    }
    
    /**
     * Вычисление скалярного произведения двух векторов
     * @param {Object} a - первый вектор {x, y, z}
     * @param {Object} b - второй вектор {x, y, z}
     * @returns {number} - скалярное произведение
     */
    dotProduct(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }
    
    /**
     * Вычисление интенсивности освещения для точки от конкретного источника
     * @param {LightSource} light - источник света
     * @param {number} worldX - X координата в мировых координатах
     * @param {number} worldY - Y координата в мировых координатах
     * @param {number} tileType - тип тайла
     * @returns {number} - интенсивность от 0 до 1
     */
    calculateLightIntensityFromSource(light, worldX, worldY, tileType) {
        const tileSize = GAME_CONFIG.TILE.BASE_SIZE;
        const dx = worldX - light.x;
        const dy = worldY - light.y;
        const distance = Math.sqrt(dx * dx + dy * dy) / tileSize;
        const radius = light.getEffectiveRadius();
        
        if (distance > radius) {
            return 0;
        }
        
        // Базовая интенсивность на основе расстояния
        const normalizedDistance = distance / radius;
        const distanceIntensity = Math.pow(1 - normalizedDistance, this.config.FALLOFF);
        
        // Получаем нормаль тайла
        const normal = this.normals.get(tileType) || { x: 0, y: 0, z: 1 };
        
        // Получаем направление к источнику света
        const lightDir = light.getLightDirection(worldX, worldY);
        
        // Вычисляем dot product для определения угла падения света
        let dot = this.dotProduct(normal, lightDir);
        
        // Нормализуем dot product от -1..1 к 0..1
        dot = (dot + 1) / 2;
        
        // Комбинируем расстояние и угол падения
        let intensity = distanceIntensity * dot;
        
        // Применяем множитель яркости для типа тайла
        const tileTypes = ['FLOOR', 'WALL', 'COLUMN', 'TREE', 'ROCK', 'WATER', 'ICE', 'DECORATION'];
        const brightnessMultiplier = this.config.TILE_BRIGHTNESS[tileTypes[tileType]] || 1.0;
        intensity *= brightnessMultiplier;
        
        // Применяем интенсивность источника
        intensity *= light.getEffectiveIntensity();
        
        return Math.max(0, Math.min(1, intensity));
    }
    
    /**
     * Вычисление суммарной интенсивности освещения для точки
     * @param {number} worldX - X координата в мировых координатах
     * @param {number} worldY - Y координата в мировых координатах
     * @param {number} tileType - тип тайла
     * @returns {number} - интенсивность от 0 до 1
     */
    calculateLighting(worldX, worldY, tileType) {
        // Проверяем кэш (используем округлённые координаты для эффективности кэша)
        const cacheKey = `${Math.floor(worldX)},${Math.floor(worldY)},${tileType}`;
        
        // Если кэш не грязный, проверяем его
        if (!this.cacheDirty && this.lightingCache.has(cacheKey)) {
            return this.lightingCache.get(cacheKey);
        }
        
        // Суммируем интенсивность от всех источников света
        let totalIntensity = 0;
        
        for (const light of this.lightSources.values()) {
            if (!light.active) continue;
            
            const intensity = this.calculateLightIntensityFromSource(light, worldX, worldY, tileType);
            
            // Суммируем интенсивность (свет складывается, но ограничен 1)
            totalIntensity += intensity;
        }
        
        // Ограничиваем максимальную интенсивность
        totalIntensity = Math.min(1, totalIntensity);
        
        // Добавляем фоновое освещение
        totalIntensity = Math.max(this.config.AMBIENT_LIGHT, totalIntensity);
        
        // Кэшируем результат
        this.lightingCache.set(cacheKey, totalIntensity);
        
        return totalIntensity;
    }
    
    /**
     * Преобразование HEX цвета в RGB
     * @param {string} hex - HEX цвет (например, '#1a1512')
     * @returns {Object} - объект {r, g, b}
     */
    hexToRgb(hex) {
        // Удаляем # если есть
        if (hex.startsWith('#')) {
            hex = hex.substring(1);
        }
        
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }
    
    /**
     * Получение освещённого цвета для точки
     * @param {number} worldX - X координата в мировых координатах
     * @param {number} worldY - Y координата в мировых координатах
     * @param {number} tileType - тип тайла
     * @returns {number} - цвет в формате PIXI (0xRRGGBB) для tint
     */
    getLitColor(worldX, worldY, tileType) {
        // Проверяем кэш (используем округлённые координаты для эффективности кэша)
        const cacheKey = `${Math.floor(worldX)},${Math.floor(worldY)},${tileType}`;
        
        if (!this.cacheDirty && this.tileColorCache.has(cacheKey)) {
            return this.tileColorCache.get(cacheKey);
        }
        
        // Получаем интенсивность освещения
        const intensity = this.calculateLighting(worldX, worldY, tileType);
        
        // Вычисляем средний цвет света от всех влияющих источников
        let avgColorR = 0, avgColorG = 0, avgColorB = 0;
        let totalWeight = 0;
        
        for (const light of this.lightSources.values()) {
            if (!light.active) continue;
            
            const lightIntensity = light.getIntensityAt(worldX, worldY);
            if (lightIntensity > 0) {
                const color = light.getEffectiveColor();
                avgColorR += color.R * lightIntensity;
                avgColorG += color.G * lightIntensity;
                avgColorB += color.B * lightIntensity;
                totalWeight += lightIntensity;
            }
        }
        
        // Нормализуем средний цвет
        if (totalWeight > 0) {
            avgColorR /= totalWeight;
            avgColorG /= totalWeight;
            avgColorB /= totalWeight;
        } else {
            // Если нет источников, используем базовый цвет
            avgColorR = this.config.LIGHT_COLOR.R;
            avgColorG = this.config.LIGHT_COLOR.G;
            avgColorB = this.config.LIGHT_COLOR.B;
        }
        
        // Базовая яркость от интенсивности (от AMBIENT_LIGHT до 1.0)
        const minBrightness = this.config.AMBIENT_LIGHT;
        const brightness = minBrightness + (1.0 - minBrightness) * intensity;
        
        // Применяем цвет света
        const r = Math.round(255 * brightness * avgColorR);
        const g = Math.round(255 * brightness * avgColorG);
        const b = Math.round(255 * brightness * avgColorB);
        
        // Преобразуем в формат PIXI (0xRRGGBB)
        const color = (r << 16) + (g << 8) + b;
        
        // Кэшируем результат
        this.tileColorCache.set(cacheKey, color);
        
        return color;
    }
    
    /**
     * Применение освещения к спрайту тайла
     * @param {PIXI.Sprite} sprite - спрайт тайла
     * @param {number} worldX - X координата в мировых координатах
     * @param {number} worldY - Y координата в мировых координатах
     * @param {number} tileType - тип тайла
     */
    applyLightingToSprite(sprite, worldX, worldY, tileType) {
        const litColor = this.getLitColor(worldX, worldY, tileType);
        sprite.tint = litColor;
    }
    
    /**
     * Получение интенсивности освещения для позиции в мировых координатах
     * @param {number} worldX - X координата в мире
     * @param {number} worldY - Y координата в мире
     * @returns {number} - интенсивность от 0 до 1
     */
    getLightingAtPosition(worldX, worldY) {
        // Вычисляем расстояние до ближайшего источника
        let maxIntensity = 0;
        
        for (const light of this.lightSources.values()) {
            if (!light.active) continue;
            
            const intensity = light.getIntensityAt(worldX, worldY);
            maxIntensity = Math.max(maxIntensity, intensity);
        }
        
        return Math.max(this.config.AMBIENT_LIGHT, maxIntensity);
    }
    
    /**
     * Получение цвета затемнения для UI элементов (например, полосок здоровья)
     * @param {number} worldX - X координата в мире
     * @param {number} worldY - Y координата в мире
     * @returns {number} - множитель яркости от 0 до 1
     */
    getBrightnessMultiplier(worldX, worldY) {
        return this.getLightingAtPosition(worldX, worldY);
    }
    
    /**
     * Получение всех активных источников света
     * @returns {Array<LightSource>} - массив источников света
     */
    getAllLightSources() {
        return Array.from(this.lightSources.values()).filter(l => l.active);
    }
    
    /**
     * Получение источников света определённого типа
     * @param {string} type - тип источника
     * @returns {Array<LightSource>} - массив источников света
     */
    getLightSourcesByType(type) {
        return Array.from(this.lightSources.values()).filter(l => l.active && l.type === type);
    }
    
    /**
     * Отрисовка отладочной визуализации освещения
     * @param {PIXI.Graphics} graphics - объект Graphics для отрисовки
     * @param {PIXI.Container} container - контейнер для добавления графики
     */
    drawDebugVisualization(graphics, container) {
        graphics.clear();
        
        // Рисуем все источники света
        for (const light of this.lightSources.values()) {
            if (!light.active) continue;
            
            const radiusPixels = light.getEffectiveRadius() * GAME_CONFIG.TILE.BASE_SIZE;
            
            // Цвет в зависимости от типа
            let color = 0xFFFF00; // Жёлтый по умолчанию
            if (light.type === 'player') color = 0x00FFFF; // Голубой для игрока
            else if (light.type === 'torch') color = 0xFF8800; // Оранжевый для факелов
            else if (light.type === 'projectile') color = 0xFF4400; // Красный для снарядов
            
            // Центр источника света
            graphics.beginFill(color, 0.5);
            graphics.drawCircle(light.x, light.y, 8);
            graphics.endFill();
            
            // Граница освещения
            graphics.lineStyle(2, color, 0.4);
            graphics.drawCircle(light.x, light.y, radiusPixels);
        }
        
        container.addChild(graphics);
    }
    
    /**
     * Получение информации о системе освещения для отладки
     * @returns {Object} - информация о системе
     */
    getDebugInfo() {
        return {
            playerLightX: this.playerLight ? this.playerLight.x.toFixed(2) : 0,
            playerLightY: this.playerLight ? this.playerLight.y.toFixed(2) : 0,
            playerRadius: this.playerLight ? this.playerLight.radius : 0,
            totalLightSources: this.lightSources.size,
            activeLightSources: this.getAllLightSources().length,
            cacheSize: this.lightingCache.size,
            colorCacheSize: this.tileColorCache.size,
            cacheDirty: this.cacheDirty
        };
    }
}