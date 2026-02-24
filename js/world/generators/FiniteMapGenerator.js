/**
 * FiniteMapGenerator - Генератор карты ограниченного размера
 * Генерирует карту заданного размера с применением темы
 */
class FiniteMapGenerator {
    /**
     * @param {Object} config - Конфигурация генератора
     * @param {number} config.width - Ширина карты в тайлах
     * @param {number} config.height - Высота карты в тайлах
     * @param {string|MapTheme} config.theme - Тема карты (id или объект)
     * @param {Array<string>} config.enemyTypes - Список типов врагов (переопределяет тему)
     * @param {number} config.seed - Seed для генерации
     */
    constructor(config = {}) {
        this.width = config.width || 256;
        this.height = config.height || 256;
        this.seed = config.seed || Math.random() * 10000;
        
        // Устанавливаем тему
        if (typeof config.theme === 'string') {
            this.theme = mapTypeRegistry.getTheme(config.theme);
        } else if (config.theme instanceof MapTheme) {
            this.theme = config.theme;
        } else {
            this.theme = mapTypeRegistry.getRandomTheme();
        }
        
        // Переопределение типов врагов если задано
        if (config.enemyTypes && Array.isArray(config.enemyTypes)) {
            this.enemyTypes = config.enemyTypes;
        } else {
            this.enemyTypes = this.theme.getEnemyTypes();
        }
        
        // Карта
        this.map = [];
        this.rooms = [];
        this.corridors = [];
        
        // Параметры генерации из темы
        this.roomDensity = this.theme.getGenerationParam('roomDensity', 0.02);
        this.minRoomSize = this.theme.getGenerationParam('minRoomSize', 5);
        this.maxRoomSize = this.theme.getGenerationParam('maxRoomSize', 12);
        this.corridorWidth = this.theme.getGenerationParam('corridorWidth', 2);
        this.extraConnections = this.theme.getGenerationParam('extraConnections', 0.3);
        
        console.log(`[FiniteMapGenerator] Создан генератор: ${this.width}x${this.height}, тема: ${this.theme.name}`);
    }

    /**
     * Генерация карты
     * @returns {Object} - Сгенерированная карта и метаданные
     */
    generate() {
        console.log(`[FiniteMapGenerator] Начало генерации карты ${this.width}x${this.height}`);
        
        // Инициализируем карту стенами
        this.initializeMap();
        
        // Генерируем комнаты
        this.generateRooms();
        
        // Соединяем комнаты коридорами
        this.connectRooms();
        
        // Добавляем дополнительные связи
        this.addExtraConnections();
        
        // Проверяем связность
        if (!this.isMapFullyConnected()) {
            console.warn('[FiniteMapGenerator] Карта не связна, перегенерация...');
            // Пробуем ещё раз
            return this.generate();
        }
        
        // Применяем тему к карте
        this.applyTheme();
        
        console.log(`[FiniteMapGenerator] Генерация завершена: ${this.rooms.length} комнат, ${this.corridors.length} коридоров`);
        
        return {
            map: this.map,
            width: this.width,
            height: this.height,
            rooms: this.rooms,
            corridors: this.corridors,
            theme: this.theme,
            enemyTypes: this.enemyTypes,
            seed: this.seed
        };
    }

    /**
     * Инициализация карты стенами
     */
    initializeMap() {
        this.map = [];
        for (let y = 0; y < this.height; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Границы карты - стены
                if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
                    this.map[y][x] = 1; // Стена
                } else {
                    this.map[y][x] = 1; // Стена (внутренность тоже стена изначально)
                }
            }
        }
    }

    /**
     * Генерация комнат
     */
    generateRooms() {
        this.rooms = [];
        
        // Рассчитываем количество комнат на основе плотности
        const area = this.width * this.height;
        const roomCount = Math.floor(area * this.roomDensity);
        
        console.log(`[FiniteMapGenerator] Генерация ${roomCount} комнат`);
        
        // Разбиваем карту на сетку для более равномерного распределения
        const gridSize = Math.ceil(Math.sqrt(roomCount));
        const cellWidth = Math.floor(this.width / gridSize);
        const cellHeight = Math.floor(this.height / gridSize);
        
        for (let i = 0; i < roomCount; i++) {
            let attempts = 0;
            let room = null;
            let overlapping = true;
            
            while (overlapping && attempts < 100) {
                // Определяем ячейку сетки
                const gridX = i % gridSize;
                const gridY = Math.floor(i / gridSize);
                
                // Ограничиваем область поиска в пределах ячейки
                const minX = Math.max(2, gridX * cellWidth + 2);
                const maxX = Math.min((gridX + 1) * cellWidth - this.minRoomSize - 2, this.width - this.minRoomSize - 2);
                const minY = Math.max(2, gridY * cellHeight + 2);
                const maxY = Math.min((gridY + 1) * cellHeight - this.minRoomSize - 2, this.height - this.minRoomSize - 2);
                
                if (maxX > minX && maxY > minY) {
                    const w = this.minRoomSize + Math.floor(this.seededRandom(i * 2) * (this.maxRoomSize - this.minRoomSize));
                    const h = this.minRoomSize + Math.floor(this.seededRandom(i * 2 + 1) * (this.maxRoomSize - this.minRoomSize));
                    
                    const x = minX + Math.floor(this.seededRandom(i * 3) * (maxX - minX - w));
                    const y = minY + Math.floor(this.seededRandom(i * 3 + 1) * (maxY - minY - h));
                    
                    room = { x, y, width: w, height: h };
                } else {
                    // Случайное размещение если ячейка слишком мала
                    const w = this.minRoomSize + Math.floor(Math.random() * (this.maxRoomSize - this.minRoomSize));
                    const h = this.minRoomSize + Math.floor(Math.random() * (this.maxRoomSize - this.minRoomSize));
                    
                    const x = 2 + Math.floor(Math.random() * (this.width - w - 4));
                    const y = 2 + Math.floor(Math.random() * (this.height - h - 4));
                    
                    room = { x, y, width: w, height: h };
                }
                
                // Проверяем пересечение с существующими комнатами
                overlapping = false;
                for (const existingRoom of this.rooms) {
                    if (this.roomsOverlap(room, existingRoom, 2)) {
                        overlapping = true;
                        break;
                    }
                }
                
                attempts++;
            }
            
            if (!overlapping && room) {
                this.carveRoom(room);
                this.rooms.push(room);
            }
        }
    }

    /**
     * Проверка пересечения комнат
     */
    roomsOverlap(room1, room2, padding = 1) {
        return !(room1.x + room1.width + padding < room2.x ||
                room2.x + room2.width + padding < room1.x ||
                room1.y + room1.height + padding < room2.y ||
                room2.y + room2.height + padding < room1.y);
    }

    /**
     * Вырезание комнаты
     */
    carveRoom(room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
                    this.map[y][x] = 0; // Пол
                }
            }
        }
    }

    /**
     * Соединение комнат коридорами (MST)
     */
    connectRooms() {
        if (this.rooms.length < 2) return;
        
        // Алгоритм Прима для минимального остовного дерева
        const visited = new Set([0]);
        const unvisited = new Set();
        
        for (let i = 1; i < this.rooms.length; i++) {
            unvisited.add(i);
        }
        
        while (unvisited.size > 0) {
            let minDist = Infinity;
            let bestConnection = null;
            
            for (const visitedIdx of visited) {
                for (const unvisitedIdx of unvisited) {
                    const dist = this.getRoomDistance(this.rooms[visitedIdx], this.rooms[unvisitedIdx]);
                    if (dist < minDist) {
                        minDist = dist;
                        bestConnection = { from: visitedIdx, to: unvisitedIdx };
                    }
                }
            }
            
            if (bestConnection) {
                this.createCorridor(this.rooms[bestConnection.from], this.rooms[bestConnection.to]);
                visited.add(bestConnection.to);
                unvisited.delete(bestConnection.to);
            }
        }
    }

    /**
     * Добавление дополнительных связей
     */
    addExtraConnections() {
        const extraCount = Math.floor(this.rooms.length * this.extraConnections);
        
        for (let i = 0; i < extraCount; i++) {
            const roomA = this.rooms[Math.floor(Math.random() * this.rooms.length)];
            const roomB = this.rooms[Math.floor(Math.random() * this.rooms.length)];
            
            if (roomA !== roomB) {
                this.createCorridor(roomA, roomB);
            }
        }
    }

    /**
     * Получение расстояния между комнатами
     */
    getRoomDistance(room1, room2) {
        const center1 = {
            x: room1.x + room1.width / 2,
            y: room1.y + room1.height / 2
        };
        const center2 = {
            x: room2.x + room2.width / 2,
            y: room2.y + room2.height / 2
        };
        
        return Math.sqrt(Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2));
    }

    /**
     * Создание коридора между комнатами
     */
    createCorridor(room1, room2) {
        const center1 = {
            x: Math.floor(room1.x + room1.width / 2),
            y: Math.floor(room1.y + room1.height / 2)
        };
        const center2 = {
            x: Math.floor(room2.x + room2.width / 2),
            y: Math.floor(room2.y + room2.height / 2)
        };
        
        // Z-образный коридор
        const cornerX = center1.x;
        const cornerY = center2.y;
        
        // Горизонтальная часть
        this.drawCorridorLine(center1.x, center1.y, cornerX, cornerY);
        // Вертикальная часть
        this.drawCorridorLine(cornerX, cornerY, center2.x, center2.y);
        
        this.corridors.push({ from: room1, to: room2 });
    }

    /**
     * Рисование линии коридора
     */
    drawCorridorLine(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        let x = x1;
        let y = y1;
        
        while (true) {
            // Вырезаем коридор с учётом ширины
            for (let wx = -this.corridorWidth; wx <= this.corridorWidth; wx++) {
                for (let wy = -this.corridorWidth; wy <= this.corridorWidth; wy++) {
                    const nx = x + wx;
                    const ny = y + wy;
                    
                    if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1) {
                        this.map[ny][nx] = 0;
                    }
                }
            }
            
            if (x === x2 && y === y2) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }

    /**
     * Проверка связности карты
     */
    isMapFullyConnected() {
        // Находим первую проходимую клетку
        let startX = -1, startY = -1;
        
        for (let y = 1; y < this.height - 1 && startX === -1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.map[y][x] === 0) {
                    startX = x;
                    startY = y;
                    break;
                }
            }
        }
        
        if (startX === -1) return false;
        
        // BFS для подсчёта достижимых клеток
        const visited = new Set();
        const queue = [{ x: startX, y: startY }];
        visited.add(`${startX},${startY}`);
        
        let passableCount = 0;
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.map[y][x] === 0) passableCount++;
            }
        }
        
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            for (const [dx, dy] of directions) {
                const nx = current.x + dx;
                const ny = current.y + dy;
                const key = `${nx},${ny}`;
                
                if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1 &&
                    !visited.has(key) && this.map[ny][nx] === 0) {
                    visited.add(key);
                    queue.push({ x: nx, y: ny });
                }
            }
        }
        
        return visited.size === passableCount;
    }

    /**
     * Применение темы к карте
     */
    applyTheme() {
        // Применяем препятствия на основе темы
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.map[y][x] === 0) { // Только на полу
                    const rand = Math.random();
                    
                    // Получаем шансы препятствий из темы
                    const treeChance = this.theme.obstacles.tree?.chance || 0;
                    const rockChance = this.theme.obstacles.rock?.chance || 0;
                    const waterChance = this.theme.obstacles.water?.chance || 0;
                    
                    if (rand < treeChance) {
                        if (!this.wouldBlockPassage(x, y, 3)) {
                            this.map[y][x] = 3; // Дерево
                        }
                    } else if (rand < treeChance + rockChance) {
                        if (!this.wouldBlockPassage(x, y, 4)) {
                            this.map[y][x] = 4; // Скала
                        }
                    } else if (rand < treeChance + rockChance + waterChance) {
                        if (!this.wouldBlockPassage(x, y, 5)) {
                            this.map[y][x] = 5; // Вода
                        }
                    }
                }
            }
        }
    }

    /**
     * Проверка, заблокирует ли препятствие проход
     */
    wouldBlockPassage(x, y, obstacleType) {
        const original = this.map[y][x];
        this.map[y][x] = obstacleType;
        
        let passableNeighbors = 0;
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        
        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1) {
                const tileType = this.map[ny][nx];
                if (tileType === 0 || tileType === 6 || tileType === 7) {
                    passableNeighbors++;
                }
            }
        }
        
        this.map[y][x] = original;
        return passableNeighbors < 2;
    }

    /**
     * Детерминированный random на основе seed
     */
    seededRandom(n) {
        const x = Math.sin(this.seed + n) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Получить случайную проходимую позицию
     */
    getRandomPassablePosition() {
        const maxAttempts = 1000;
        
        for (let i = 0; i < maxAttempts; i++) {
            const x = 1 + Math.floor(Math.random() * (this.width - 2));
            const y = 1 + Math.floor(Math.random() * (this.height - 2));
            
            if (this.map[y][x] === 0) {
                return { x, y };
            }
        }
        
        // Если не нашли, возвращаем центр первой комнаты
        if (this.rooms.length > 0) {
            const room = this.rooms[0];
            return {
                x: Math.floor(room.x + room.width / 2),
                y: Math.floor(room.y + room.height / 2)
            };
        }
        
        return { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) };
    }

    /**
     * Получить позицию спавна игрока
     */
    getPlayerSpawnPosition() {
        // Спавним в центре первой комнаты
        if (this.rooms.length > 0) {
            const room = this.rooms[0];
            return {
                x: Math.floor(room.x + room.width / 2),
                y: Math.floor(room.y + room.height / 2)
            };
        }
        
        return this.getRandomPassablePosition();
    }

    /**
     * Получить случайного врага для этой карты
     */
    getRandomEnemyType() {
        if (!this.enemyTypes || this.enemyTypes.length === 0) {
            return 'TANK';
        }
        return this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
    }

    /**
     * Сериализация карты для сохранения
     */
    serialize() {
        return {
            width: this.width,
            height: this.height,
            seed: this.seed,
            themeId: this.theme.id,
            enemyTypes: this.enemyTypes,
            rooms: this.rooms,
            corridors: this.corridors.map(c => ({
                fromIdx: this.rooms.indexOf(c.from),
                toIdx: this.rooms.indexOf(c.to)
            }))
        };
    }
}

// Экспорт
if (typeof window !== 'undefined') {
    window.FiniteMapGenerator = FiniteMapGenerator;
}