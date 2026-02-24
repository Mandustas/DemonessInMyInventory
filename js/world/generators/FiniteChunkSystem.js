/**
 * FiniteChunkSystem - Система чанков для ограниченной карты
 * Управляет частичной загрузкой карты для оптимизации рендеринга
 */
class FiniteChunkSystem {
    /**
     * @param {Object} mapData - Данные карты от FiniteMapGenerator
     * @param {Object} config - Конфигурация
     */
    constructor(mapData, config = {}) {
        this.mapData = mapData;
        this.map = mapData.map;
        this.mapWidth = mapData.width;
        this.mapHeight = mapData.height;
        
        // Размер чанка
        this.chunkSize = config.chunkSize || GAME_CONFIG.WORLD_MAP.CHUNK_SIZE || 16;
        
        // Радиусы загрузки
        this.loadRadius = config.loadRadius || GAME_CONFIG.WORLD_MAP.LOAD_RADIUS || 4;
        this.unloadRadius = config.unloadRadius || GAME_CONFIG.WORLD_MAP.UNLOAD_RADIUS || 6;
        
        // Кэш загруженных чанков
        this.chunks = new Map();
        
        // Рассчитываем количество чанков
        this.chunksX = Math.ceil(this.mapWidth / this.chunkSize);
        this.chunksY = Math.ceil(this.mapHeight / this.chunkSize);
        
        // Тема карты
        this.theme = mapData.theme;
        
        // Для совместимости со старым кодом
        this.activeChunks = new Set();
        this.chunkSize = this.chunkSize; // Публичное свойство
        
        console.log(`[FiniteChunkSystem] Создан: карта ${this.mapWidth}x${this.mapHeight}, чанков: ${this.chunksX}x${this.chunksY}`);
    }

    /**
     * Получить ID чанка по координатам
     */
    getChunkId(chunkX, chunkY) {
        return `${chunkX},${chunkY}`;
    }

    /**
     * Получить координаты чанка по мировым координатам
     */
    worldToChunkCoords(worldX, worldY) {
        return {
            chunkX: Math.floor(worldX / this.chunkSize),
            chunkY: Math.floor(worldY / this.chunkSize)
        };
    }

    /**
     * Проверить, находится ли чанк в пределах карты
     */
    isValidChunk(chunkX, chunkY) {
        return chunkX >= 0 && chunkX < this.chunksX && chunkY >= 0 && chunkY < this.chunksY;
    }

    /**
     * Получить или создать чанк
     */
    getChunk(chunkX, chunkY) {
        if (!this.isValidChunk(chunkX, chunkY)) {
            return null;
        }
        
        const chunkId = this.getChunkId(chunkX, chunkY);
        
        if (!this.chunks.has(chunkId)) {
            // Создаём чанк из данных карты
            const chunk = this.createChunk(chunkX, chunkY);
            this.chunks.set(chunkId, chunk);
        }
        
        return this.chunks.get(chunkId);
    }

    /**
     * Создать чанк из данных карты
     */
    createChunk(chunkX, chunkY) {
        const startX = chunkX * this.chunkSize;
        const startY = chunkY * this.chunkSize;
        
        const tiles = [];
        const entities = [];
        
        // Копируем тайлы из карты
        for (let localY = 0; localY < this.chunkSize; localY++) {
            tiles[localY] = [];
            for (let localX = 0; localX < this.chunkSize; localX++) {
                const worldX = startX + localX;
                const worldY = startY + localY;
                
                if (worldX < this.mapWidth && worldY < this.mapHeight) {
                    tiles[localY][localX] = this.map[worldY][worldX];
                } else {
                    tiles[localY][localX] = 1; // Стена за пределами карты
                }
            }
        }
        
        return {
            x: chunkX,
            y: chunkY,
            chunkX: chunkX,  // Для совместимости с рендерером
            chunkY: chunkY,  // Для совместимости с рендерером
            worldX: startX,
            worldY: startY,
            size: this.chunkSize,
            tiles: tiles,
            entities: entities,
            isLoaded: true,
            lastAccess: Date.now()
        };
    }

    /**
     * Обновить загруженные чанки вокруг позиции
     * @param {number} worldX - Мировая координата X
     * @param {number} worldY - Мировая координата Y
     */
    updateChunks(worldX, worldY) {
        const { chunkX: centerChunkX, chunkY: centerChunkY } = this.worldToChunkCoords(worldX, worldY);
        
        // Загружаем чанки в радиусе загрузки
        for (let dy = -this.loadRadius; dy <= this.loadRadius; dy++) {
            for (let dx = -this.loadRadius; dx <= this.loadRadius; dx++) {
                const chunkX = centerChunkX + dx;
                const chunkY = centerChunkY + dy;
                
                if (this.isValidChunk(chunkX, chunkY)) {
                    const chunk = this.getChunk(chunkX, chunkY);
                    if (chunk) {
                        chunk.lastAccess = Date.now();
                    }
                }
            }
        }
        
        // Выгружаем далёкие чанки
        this.unloadDistantChunks(centerChunkX, centerChunkY);
    }

    /**
     * Выгрузить чанки, которые далеко от игрока
     */
    unloadDistantChunks(centerX, centerY) {
        const chunksToUnload = [];
        
        for (const [chunkId, chunk] of this.chunks) {
            const distance = Math.max(Math.abs(chunk.x - centerX), Math.abs(chunk.y - centerY));
            
            if (distance > this.unloadRadius) {
                chunksToUnload.push(chunkId);
            }
        }
        
        for (const chunkId of chunksToUnload) {
            this.chunks.delete(chunkId);
        }
        
        if (chunksToUnload.length > 0) {
            console.log(`[FiniteChunkSystem] Выгружено ${chunksToUnload.length} чанков`);
        }
    }

    /**
     * Получить все загруженные чанки
     */
    getLoadedChunks() {
        return Array.from(this.chunks.values());
    }

    /**
     * Получить чанки для рендеринга в видимой области
     * @param {number} cameraX - X координата камеры (2D экранные координаты в пикселях)
     * @param {number} cameraY - Y координата камеры (2D экранные координаты в пикселях)
     * @param {number} screenWidth - ширина экрана
     * @param {number} screenHeight - высота экрана
     * @param {number} tileSize - размер тайла
     * @param {number} zoom - уровень зума
     * @returns {Array} - массив чанков для рендеринга
     */
    getChunksToRender(cameraX, cameraY, screenWidth, screenHeight, tileSize, zoom) {
        // cameraX и cameraY - это 2D экранные координаты (пиксели)
        // Преобразуем их обратно в изометрические мировые координаты (тайлы)
        const tileCoords = coordToIso(cameraX, cameraY);
        const centerTileX = Math.floor(tileCoords.isoX);
        const centerTileY = Math.floor(tileCoords.isoY);

        // Рассчитываем центральный чанк
        const centerChunkX = Math.floor(centerTileX / this.chunkSize);
        const centerChunkY = Math.floor(centerTileY / this.chunkSize);
        
        // Рассчитываем радиус видимости в чанках
        // Учитываем диагональ экрана и зум
        const screenDiagonal = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight);
        const visibleTiles = Math.ceil(screenDiagonal / (tileSize * zoom)) + 4;
        const visibleRadius = Math.ceil(visibleTiles / this.chunkSize) + 1;
        
        const chunksToRender = [];
        
        for (let dy = -visibleRadius; dy <= visibleRadius; dy++) {
            for (let dx = -visibleRadius; dx <= visibleRadius; dx++) {
                const chunkX = centerChunkX + dx;
                const chunkY = centerChunkY + dy;
                
                if (this.isValidChunk(chunkX, chunkY)) {
                    const chunk = this.getChunk(chunkX, chunkY);
                    if (chunk) {
                        // Добавляем свойства, ожидаемые рендерером
                        chunk.chunkX = chunk.x;
                        chunk.chunkY = chunk.y;
                        chunk.size = this.chunkSize;
                        chunksToRender.push(chunk);
                    }
                }
            }
        }
        
        return chunksToRender;
    }

    /**
     * Получить тип тайла по мировым координатам
     */
    getTileAt(worldX, worldY) {
        if (worldX < 0 || worldX >= this.mapWidth || worldY < 0 || worldY >= this.mapHeight) {
            return 1; // Стена за пределами
        }
        
        return this.map[worldY][worldX];
    }

    /**
     * Установить тип тайла по мировым координатам
     */
    setTileAt(worldX, worldY, tileType) {
        if (worldX < 0 || worldX >= this.mapWidth || worldY < 0 || worldY >= this.mapHeight) {
            return false;
        }
        
        this.map[worldY][worldX] = tileType;
        
        // Обновляем чанк если он загружен
        const { chunkX, chunkY } = this.worldToChunkCoords(worldX, worldY);
        const chunk = this.chunks.get(this.getChunkId(chunkX, chunkY));
        
        if (chunk) {
            const localX = worldX - chunk.worldX;
            const localY = worldY - chunk.worldY;
            chunk.tiles[localY][localX] = tileType;
        }
        
        return true;
    }

    /**
     * Проверить проходимость тайла
     */
    isTilePassable(worldX, worldY) {
        const tile = this.getTileAt(worldX, worldY);
        // Все тайлы проходимы кроме стен (1) и колонн (2)
        // Типы: 0-пол, 1-стена, 2-колонна, 3-дерево, 4-скала, 5-вода, 6-лед, 7-декорация
        return tile !== 1 && tile !== 2;
    }

    /**
     * Получить текстуры для рендеринга
     */
    getTextures() {
        return this.theme ? this.theme.textures : null;
    }

    /**
     * Получить комнаты карты
     */
    getRooms() {
        return this.mapData.rooms || [];
    }

    /**
     * Получить типы врагов для карты
     */
    getEnemyTypes() {
        return this.mapData.enemyTypes || ['TANK'];
    }

    /**
     * Получить случайную проходимую позицию
     */
    getRandomPassablePosition() {
        const maxAttempts = 1000;
        
        for (let i = 0; i < maxAttempts; i++) {
            const x = 1 + Math.floor(Math.random() * (this.mapWidth - 2));
            const y = 1 + Math.floor(Math.random() * (this.mapHeight - 2));
            
            if (this.isTilePassable(x, y)) {
                return { x, y };
            }
        }
        
        // Возвращаем центр первой комнаты
        const rooms = this.getRooms();
        if (rooms.length > 0) {
            return {
                x: Math.floor(rooms[0].x + rooms[0].width / 2),
                y: Math.floor(rooms[0].y + rooms[0].height / 2)
            };
        }
        
        return { x: Math.floor(this.mapWidth / 2), y: Math.floor(this.mapHeight / 2) };
    }

    /**
     * Получить позицию спавна игрока
     */
    getPlayerSpawnPosition() {
        const rooms = this.getRooms();
        if (rooms.length > 0) {
            return {
                x: Math.floor(rooms[0].x + rooms[0].width / 2),
                y: Math.floor(rooms[0].y + rooms[0].height / 2)
            };
        }
        return this.getRandomPassablePosition();
    }

    /**
     * Загрузить чанки вокруг позиции (для совместимости)
     * @param {number} tileX - Координата X тайла
     * @param {number} tileY - Координата Y тайла
     */
    loadChunksAround(tileX, tileY) {
        const chunkX = Math.floor(tileX / this.chunkSize);
        const chunkY = Math.floor(tileY / this.chunkSize);
        
        // Загружаем чанки в радиусе
        for (let dy = -this.loadRadius; dy <= this.loadRadius; dy++) {
            for (let dx = -this.loadRadius; dx <= this.loadRadius; dx++) {
                const cx = chunkX + dx;
                const cy = chunkY + dy;
                
                if (this.isValidChunk(cx, cy)) {
                    const chunkId = this.getChunkId(cx, cy);
                    this.activeChunks.add(chunkId);
                    this.getChunk(cx, cy);
                }
            }
        }
    }

    /**
     * Отметить начальные чанки (для совместимости)
     */
    markInitialChunks(tileX, tileY) {
        // Просто загружаем чанки вокруг - для совместимости
        this.loadChunksAround(tileX, tileY);
    }

    /**
     * Получить тип тайла (для совместимости)
     * @param {number} tileX - Координата X тайла
     * @param {number} tileY - Координата Y тайла
     * @returns {number} - Тип тайла
     */
    getTileType(tileX, tileY) {
        if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
            return 1; // Стена за пределами
        }
        return this.map[tileY][tileX];
    }

    /**
     * Проверить проходимость тайла (для совместимости)
     * @param {number} tileX - Координата X тайла
     * @param {number} tileY - Координата Y тайла
     * @returns {boolean}
     */
    isPassable(tileX, tileY) {
        return this.isTilePassable(tileX, tileY);
    }

    /**
     * Получить множитель скорости для тайла
     * @param {number} tileX - Координата X тайла
     * @param {number} tileY - Координата Y тайла
     * @returns {number} - Множитель скорости (1.0 по умолчанию)
     */
    getSpeedMultiplier(tileX, tileY) {
        const tileType = this.getTileType(tileX, tileY);

        switch (tileType) {
            case 3: // Дерево - медленнее на 40%
                return 0.6;
            case 4: // Скала - медленнее на 50%
                return 0.5;
            case 5: // Вода - медленнее на 60%
                return 0.4;
            case 6: // Лёд - быстрее на 30%
                return 1.3;
            default:
                return 1.0;
        }
    }

    /**
     * Получить позиции для спавна врагов
     * @param {number} count - Количество позиций
     * @param {Object} playerPos - Позиция игрока {x, y}
     * @param {number} minDistance - Минимальное расстояние от игрока
     */
    getEnemySpawnPositions(count, playerPos, minDistance = 10) {
        const positions = [];
        const rooms = this.getRooms();
        
        // Спавним врагов в комнатах (кроме первой - стартовой)
        for (let i = 1; i < rooms.length && positions.length < count; i++) {
            const room = rooms[i];
            const roomCenterX = Math.floor(room.x + room.width / 2);
            const roomCenterY = Math.floor(room.y + room.height / 2);
            
            // Проверяем расстояние от игрока
            const dist = Math.sqrt(Math.pow(roomCenterX - playerPos.x, 2) + Math.pow(roomCenterY - playerPos.y, 2));
            
            if (dist >= minDistance) {
                // Добавляем несколько позиций в комнате
                const enemiesPerRoom = GAME_CONFIG.MAP.ENEMY_SPAWN.ENEMIES_PER_ROOM || 2;
                
                for (let j = 0; j < enemiesPerRoom && positions.length < count; j++) {
                    const offsetX = Math.floor(Math.random() * (room.width - 4)) + 2;
                    const offsetY = Math.floor(Math.random() * (room.height - 4)) + 2;
                    
                    const spawnX = room.x + offsetX;
                    const spawnY = room.y + offsetY;
                    
                    if (this.isTilePassable(spawnX, spawnY)) {
                        positions.push({ x: spawnX, y: spawnY });
                    }
                }
            }
        }
        
        return positions;
    }

    /**
     * Получить информацию о карте для UI
     */
    getMapInfo() {
        return {
            width: this.mapWidth,
            height: this.mapHeight,
            theme: this.theme ? this.theme.name : 'Unknown',
            themeId: this.theme ? this.theme.id : 'unknown',
            enemyTypes: this.getEnemyTypes(),
            roomsCount: this.getRooms().length,
            chunksCount: this.chunks.size
        };
    }

    /**
     * Сериализация для сохранения
     */
    serialize() {
        return {
            map: this.map,
            width: this.mapWidth,
            height: this.mapHeight,
            themeId: this.theme ? this.theme.id : 'forest',
            enemyTypes: this.mapData.enemyTypes,
            rooms: this.mapData.rooms,
            seed: this.mapData.seed
        };
    }

    /**
     * Десериализация из сохранения
     */
    static deserialize(data) {
        const mapData = {
            map: data.map,
            width: data.width,
            height: data.height,
            theme: mapTypeRegistry.getTheme(data.themeId),
            enemyTypes: data.enemyTypes,
            rooms: data.rooms,
            seed: data.seed
        };
        
        return new FiniteChunkSystem(mapData);
    }
}

// Экспорт
if (typeof window !== 'undefined') {
    window.FiniteChunkSystem = FiniteChunkSystem;
}