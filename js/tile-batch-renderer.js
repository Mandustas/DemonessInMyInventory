/**
 * TileBatchRenderer - система пакетного рендеринга тайлов
 * Оптимизация: один PIXI.Graphics на чанк вместо 256 отдельных спрайтов
 * 
 * Принцип работы:
 * - Каждый чанк рендерится в один Graphics объект
 * - Используются упрощённые текстуры из атласа
 * - Освещение применяется через tint на уровне Graphics
 */
class TileBatchRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        
        // Кэш батчей для чанков
        this.batchCache = new Map();
        
        // Атлас текстур для тайлов
        this.tileAtlas = null;
        this.atlasTextures = new Map();
        
        // Размер тайла
        this.tileSize = GAME_CONFIG.TILE.BASE_SIZE;
        
        // Размер чанка
        this.chunkSize = GAME_CONFIG.INITIAL_CHUNK_SIZE;
        
        // Кэш цветов для типов тайлов (упрощённые цвета)
        this.tileColors = this.initTileColors();
        
        // Флаг использования упрощённых текстур
        this.useSimpleTextures = true;
        
        // Счётчик для отладки
        this.stats = {
            batchesRendered: 0,
            tilesRendered: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }
    
    /**
     * Инициализация цветов для типов тайлов
     * Используем упрощённую палитру для batch rendering
     */
    initTileColors() {
        const colors = GAME_CONFIG.RENDERER.COLORS;
        return {
            0: this.hexToNumber(colors.FLOOR),       // Пол
            1: this.hexToNumber(colors.WALL),        // Стена
            2: this.hexToNumber(colors.WALL_DARK),   // Колонна
            3: this.hexToNumber(colors.TREE_LEAVES), // Дерево
            4: this.hexToNumber(colors.ROCK),        // Скала
            5: this.hexToNumber(colors.WATER),       // Вода
            6: this.hexToNumber(colors.ICE),         // Лёд
            7: this.hexToNumber(colors.DECORATION)   // Декорация
        };
    }
    
    /**
     * Преобразование HEX в число
     */
    hexToNumber(hex) {
        if (hex.startsWith('#')) {
            hex = hex.substring(1);
        }
        return parseInt(hex, 16);
    }
    
    /**
     * Инициализация атласа текстур
     * Создаёт простые текстуры для каждого типа тайла
     */
    initAtlas() {
        if (this.tileAtlas) return;
        
        // Создаём атлас как большой Graphics
        const atlasGraphics = new PIXI.Graphics();
        const textureSize = this.tileSize;
        const padding = 2;
        const totalSize = textureSize + padding * 2;
        
        // Создаём текстуры для каждого типа тайла
        for (let tileType = 0; tileType <= 7; tileType++) {
            const x = (tileType % 4) * totalSize;
            const y = Math.floor(tileType / 4) * totalSize;
            
            this.drawSimpleTile(atlasGraphics, x + padding, y + padding, textureSize, tileType);
        }
        
        // Генерируем текстуру атласа
        this.tileAtlas = this.renderer.app.renderer.generateTexture(atlasGraphics);
        atlasGraphics.destroy();
        
        // Создаём регионы текстур для каждого типа тайла
        for (let tileType = 0; tileType <= 7; tileType++) {
            const x = (tileType % 4) * totalSize + padding;
            const y = Math.floor(tileType / 4) * totalSize + padding;
            
            const frame = new PIXI.Rectangle(x, y, textureSize, textureSize);
            const texture = new PIXI.Texture(this.tileAtlas, frame);
            this.atlasTextures.set(tileType, texture);
        }
    }
    
    /**
     * Рисование упрощённого тайла
     * Сохраняет визуальный стиль, но с меньшим количеством деталей
     */
    drawSimpleTile(graphics, x, y, size, tileType) {
        const halfW = size / 2;
        const halfH = size / 4;
        const color = this.tileColors[tileType];
        
        switch (tileType) {
            case 0: // Пол
                this.drawIsometricTile(graphics, x, y, size, size / 2, color, 0x0a0806, 0.3);
                break;
            case 1: // Стена
                this.drawIsometricTile3D(graphics, x, y, size, size / 2, color, 0x1a1512, 8);
                break;
            case 2: // Колонна
                this.drawColumnTile(graphics, x, y, size, color);
                break;
            case 3: // Дерево
                this.drawTreeTile(graphics, x, y, size, color);
                break;
            case 4: // Скала
                this.drawRockTile(graphics, x, y, size, color);
                break;
            case 5: // Вода
                this.drawWaterTile(graphics, x, y, size, color);
                break;
            case 6: // Лёд
                this.drawIceTile(graphics, x, y, size, color);
                break;
            case 7: // Декорация
                this.drawDecorationTile(graphics, x, y, size, color);
                break;
        }
    }
    
    /**
     * Рисование изометрического тайла (пол)
     */
    drawIsometricTile(graphics, x, y, width, height, color, darkColor, darkAlpha) {
        const halfW = width / 2;
        const halfH = height / 2;
        
        // Основной цвет
        graphics.beginFill(color);
        graphics.moveTo(x, y);
        graphics.lineTo(x + halfW, y + halfH);
        graphics.lineTo(x, y + height);
        graphics.lineTo(x - halfW, y + halfH);
        graphics.closePath();
        graphics.endFill();
        
        // Затемнение к центру
        if (darkColor) {
            graphics.beginFill(darkColor, darkAlpha);
            graphics.moveTo(x, y + halfH * 0.3);
            graphics.lineTo(x + halfW * 0.6, y + halfH * 0.8);
            graphics.lineTo(x, y + height * 0.8);
            graphics.lineTo(x - halfW * 0.6, y + halfH * 0.8);
            graphics.closePath();
            graphics.endFill();
        }
    }
    
    /**
     * Рисование 3D изометрического тайла (стена)
     */
    drawIsometricTile3D(graphics, x, y, width, height, color, darkColor, depth) {
        const halfW = width / 2;
        const halfH = height / 2;
        
        // Правая грань (темнее)
        graphics.beginFill(darkColor, 0.8);
        graphics.moveTo(x + halfW, y + halfH);
        graphics.lineTo(x + halfW, y + halfH + depth);
        graphics.lineTo(x, y + height + depth);
        graphics.lineTo(x, y + height);
        graphics.closePath();
        graphics.endFill();
        
        // Левая грань (ещё темнее)
        graphics.beginFill(darkColor, 0.6);
        graphics.moveTo(x - halfW, y + halfH);
        graphics.lineTo(x - halfW, y + halfH + depth);
        graphics.lineTo(x, y + height + depth);
        graphics.lineTo(x, y + height);
        graphics.closePath();
        graphics.endFill();
        
        // Верхняя грань
        graphics.beginFill(color);
        graphics.moveTo(x, y);
        graphics.lineTo(x + halfW, y + halfH);
        graphics.lineTo(x, y + height);
        graphics.lineTo(x - halfW, y + halfH);
        graphics.closePath();
        graphics.endFill();
        
        // Текстура камня (упрощённая)
        graphics.beginFill(darkColor, 0.3);
        for (let i = 0; i < 4; i++) {
            const px = x + (Math.random() - 0.5) * width * 0.5;
            const py = y + halfH + (Math.random() - 0.5) * height * 0.3;
            graphics.drawCircle(px, py, 2 + Math.random() * 3);
        }
        graphics.endFill();
    }
    
    /**
     * Рисование колонны
     */
    drawColumnTile(graphics, x, y, size, color) {
        const halfW = size * 0.15;
        const height = size * 0.6;
        
        // Тень
        graphics.beginFill(0x0a0806, 0.4);
        graphics.drawEllipse(x, y + size * 0.15, size * 0.2, size * 0.08);
        graphics.endFill();
        
        // Тело колонны
        graphics.beginFill(color);
        graphics.moveTo(x - halfW, y - height * 0.3);
        graphics.lineTo(x + halfW, y - height * 0.2);
        graphics.lineTo(x + halfW * 0.8, y + size * 0.1);
        graphics.lineTo(x - halfW * 0.8, y + size * 0.1);
        graphics.closePath();
        graphics.endFill();
        
        // Капитель
        graphics.beginFill(this.tileColors[1]);
        graphics.drawEllipse(x, y - height * 0.35, halfW * 1.5, halfW * 0.5);
        graphics.endFill();
    }
    
    /**
     * Рисование дерева
     */
    drawTreeTile(graphics, x, y, size, color) {
        const trunkColor = this.hexToNumber(GAME_CONFIG.RENDERER.COLORS.TREE_TRUNK);
        
        // Тень
        graphics.beginFill(0x0a0806, 0.3);
        graphics.drawEllipse(x, y + size * 0.1, size * 0.2, size * 0.08);
        graphics.endFill();
        
        // Ствол
        graphics.beginFill(trunkColor);
        graphics.drawRect(x - size * 0.05, y - size * 0.15, size * 0.1, size * 0.25);
        graphics.endFill();
        
        // Крона (несколько кругов)
        graphics.beginFill(color, 0.9);
        graphics.drawCircle(x, y - size * 0.25, size * 0.2);
        graphics.drawCircle(x - size * 0.12, y - size * 0.18, size * 0.15);
        graphics.drawCircle(x + size * 0.12, y - size * 0.18, size * 0.15);
        graphics.endFill();
    }
    
    /**
     * Рисование скалы
     */
    drawRockTile(graphics, x, y, size, color) {
        // Тень
        graphics.beginFill(0x0a0806, 0.3);
        graphics.drawEllipse(x, y + size * 0.1, size * 0.25, size * 0.1);
        graphics.endFill();
        
        // Основная форма
        graphics.beginFill(color);
        graphics.moveTo(x - size * 0.25, y + size * 0.05);
        graphics.lineTo(x - size * 0.15, y - size * 0.1);
        graphics.lineTo(x, y - size * 0.15);
        graphics.lineTo(x + size * 0.2, y - size * 0.05);
        graphics.lineTo(x + size * 0.25, y + size * 0.08);
        graphics.lineTo(x, y + size * 0.12);
        graphics.closePath();
        graphics.endFill();
        
        // Блики
        graphics.beginFill(0x3d3028, 0.5);
        graphics.drawCircle(x - size * 0.08, y - size * 0.05, size * 0.05);
        graphics.endFill();
    }
    
    /**
     * Рисование воды
     */
    drawWaterTile(graphics, x, y, size, color) {
        const halfW = size / 2;
        const halfH = size / 4;
        
        // Основная вода
        graphics.beginFill(color);
        graphics.moveTo(x, y);
        graphics.lineTo(x + halfW, y + halfH);
        graphics.lineTo(x, y + size / 2);
        graphics.lineTo(x - halfW, y + halfH);
        graphics.closePath();
        graphics.endFill();
        
        // Блики
        graphics.beginFill(0x2a3f4f, 0.4);
        graphics.drawEllipse(x, y + halfH, size * 0.15, size * 0.05);
        graphics.endFill();
    }
    
    /**
     * Рисование льда
     */
    drawIceTile(graphics, x, y, size, color) {
        const halfW = size / 2;
        const halfH = size / 4;
        
        // Основной лёд
        graphics.beginFill(color);
        graphics.moveTo(x, y);
        graphics.lineTo(x + halfW, y + halfH);
        graphics.lineTo(x, y + size / 2);
        graphics.lineTo(x - halfW, y + halfH);
        graphics.closePath();
        graphics.endFill();
        
        // Трещины
        graphics.lineStyle(1, 0x3d4f55, 0.4);
        graphics.moveTo(x - size * 0.15, y + halfH * 0.5);
        graphics.lineTo(x + size * 0.1, y + halfH);
        graphics.moveTo(x, y + halfH * 0.3);
        graphics.lineTo(x + size * 0.1, y + halfH * 1.2);
    }
    
    /**
     * Рисование декорации
     */
    drawDecorationTile(graphics, x, y, size, color) {
        // Тень
        graphics.beginFill(0x0a0806, 0.3);
        graphics.drawEllipse(x, y + size * 0.08, size * 0.12, size * 0.05);
        graphics.endFill();
        
        // Трава/куст
        graphics.beginFill(color, 0.8);
        for (let i = 0; i < 5; i++) {
            const gx = x + (Math.random() - 0.5) * size * 0.2;
            const gy = y + size * 0.05;
            const gh = size * (0.08 + Math.random() * 0.06);
            graphics.moveTo(gx, gy);
            graphics.lineTo(gx + 1, gy - gh);
            graphics.lineTo(gx + 2, gy);
        }
        graphics.endFill();
    }
    
    /**
     * Создание батча для чанка
     * @param {Object} chunk - объект чанка
     * @returns {PIXI.Graphics} - Graphics объект с отрисованным чанком
     */
    createChunkBatch(chunk) {
        const chunkKey = `${chunk.chunkX},${chunk.chunkY}`;
        
        // Проверяем кэш
        if (this.batchCache.has(chunkKey)) {
            this.stats.cacheHits++;
            return this.batchCache.get(chunkKey);
        }
        
        this.stats.cacheMisses++;
        
        // Создаём Graphics для чанка
        const graphics = new PIXI.Graphics();
        graphics.chunkKey = chunkKey;
        
        // Рисуем все тайлы чанка
        let tilesDrawn = 0;
        
        for (let localY = 0; localY < chunk.tiles.length; localY++) {
            for (let localX = 0; localX < chunk.tiles[localY].length; localX++) {
                const tileType = chunk.tiles[localY][localX];
                
                // Вычисляем мировые координаты тайла
                const globalX = chunk.chunkX * this.chunkSize + localX;
                const globalY = chunk.chunkY * this.chunkSize + localY;
                
                // Преобразуем в экранные координаты
                const pos = this.renderer.isoTo2D(globalX, globalY);
                
                // Рисуем тайл
                this.drawSimpleTile(graphics, pos.x, pos.y, this.tileSize, tileType);
                tilesDrawn++;
            }
        }
        
        this.stats.tilesRendered += tilesDrawn;
        
        // Кэшируем батч
        this.batchCache.set(chunkKey, graphics);
        
        return graphics;
    }
    
    /**
     * Получение или создание батча для чанка
     * @param {Object} chunk - объект чанка
     * @returns {PIXI.Graphics} - Graphics объект
     */
    getChunkBatch(chunk) {
        return this.createChunkBatch(chunk);
    }
    
    /**
     * Обновление освещения для батча чанка
     * @param {PIXI.Graphics} batch - батч чанка
     * @param {LightingSystem} lightingSystem - система освещения
     * @param {number} playerX - X координата игрока
     * @param {number} playerY - Y координата игрока
     */
    updateBatchLighting(batch, lightingSystem, playerX, playerY) {
        if (!lightingSystem || !batch.chunkKey) return;
        
        // Вычисляем среднюю освещённость для чанка
        const [chunkX, chunkY] = batch.chunkKey.split(',').map(Number);
        const centerX = (chunkX + 0.5) * this.chunkSize;
        const centerY = (chunkY + 0.5) * this.chunkSize;
        const pos = this.renderer.isoTo2D(centerX, centerY);
        
        // Получаем освещённость для центра чанка
        const intensity = lightingSystem.getLightingAtPosition(pos.x, pos.y);
        
        // Применяем tint ко всему батчу
        // Вычисляем цвет tint на основе интенсивности
        const brightness = Math.max(0.2, intensity);
        const r = Math.floor(255 * brightness);
        const g = Math.floor(255 * brightness);
        const b = Math.floor(255 * brightness);
        batch.tint = (r << 16) + (g << 8) + b;
    }
    
    /**
     * Удаление батча чанка из кэша
     * @param {string} chunkKey - ключ чанка
     */
    removeChunkBatch(chunkKey) {
        const batch = this.batchCache.get(chunkKey);
        if (batch) {
            batch.destroy();
            this.batchCache.delete(chunkKey);
        }
    }
    
    /**
     * Очистка кэша батчей, которые далеко от игрока
     * @param {number} playerChunkX - X координата чанка игрока
     * @param {number} playerChunkY - Y координата чанка игрока
     * @param {number} maxDistance - максимальное расстояние в чанках
     */
    cleanupDistantBatches(playerChunkX, playerChunkY, maxDistance = 10) {
        for (const [key, batch] of this.batchCache.entries()) {
            const [cx, cy] = key.split(',').map(Number);
            const distance = Math.abs(cx - playerChunkX) + Math.abs(cy - playerChunkY);
            
            if (distance > maxDistance) {
                this.removeChunkBatch(key);
            }
        }
    }
    
    /**
     * Полная очистка кэша
     */
    clearCache() {
        for (const [key, batch] of this.batchCache.entries()) {
            batch.destroy();
        }
        this.batchCache.clear();
        this.stats = {
            batchesRendered: 0,
            tilesRendered: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }
    
    /**
     * Рендеринг чанков с использованием batch rendering
     * @param {Array} chunks - массив чанков для рендеринга
     * @param {PIXI.Container} container - контейнер для добавления батчей
     * @returns {number} - количество отрендеренных батчей
     */
    renderChunks(chunks, container) {
        // Очищаем контейнер
        container.removeChildren();
        
        let batchesRendered = 0;
        
        for (const chunk of chunks) {
            if (!chunk || !chunk.tiles) continue;
            
            const batch = this.getChunkBatch(chunk);
            
            // Добавляем в контейнер если ещё не добавлен
            if (!batch.parent) {
                container.addChild(batch);
            }
            
            batchesRendered++;
        }
        
        this.stats.batchesRendered = batchesRendered;
        
        return batchesRendered;
    }
    
    /**
     * Получение статистики рендеринга
     * @returns {Object} - статистика
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.batchCache.size
        };
    }
    
    /**
     * Уничтожение ресурсов
     */
    destroy() {
        this.clearCache();
        
        if (this.tileAtlas) {
            this.tileAtlas.destroy(true);
            this.tileAtlas = null;
        }
        
        this.atlasTextures.clear();
    }
}