/**
 * CaveTheme - Пещерная тема карты
 * Тёмные пещеры, сталактиты, подземные озёра
 */
class CaveTheme extends MapTheme {
    constructor() {
        super({
            name: 'Пещера',
            id: 'cave',
            
            // Цвета текстур для пещерной темы
            textures: {
                floor: '#151515',      // Тёмный каменный пол
                floorLight: '#1a1a1a', // Светлый камень
                wall: '#252525',       // Серые каменные стены
                wallDark: '#101010',   // Тёмные участки стен
                column: '#202020',     // Сталактиты/сталагмиты
                tree: '#1a1a1a',       // Каменные образования
                treeTrunk: '#151515',  // Основание
                rock: '#1f1f1f',       // Валуны
                water: '#0a1520',      // Подземные озёра
                ice: '#1a2530',        // Лёд (редко в глубоких пещерах)
                decoration: '#1a1a1a'  // Пещерные образования
            },
            
            // Доступные типы врагов в пещере
            enemyTypes: ['TANK', 'MAGE'],
            
            // Настройки препятствий
            obstacles: {
                tree: { chance: 0.02, minDistance: 3 },   // Сталактиты (мало)
                rock: { chance: 0.10, minDistance: 2 },   // Валуны (много)
                water: { chance: 0.04, minDistance: 4 }   // Подземные озёра
            },
            
            // Настройки декораций
            decorations: {
                crystals: { chance: 0.04 },
                mushrooms: { chance: 0.06 },
                bones: { chance: 0.03 }
            },
            
            // Параметры генерации
            generation: {
                roomDensity: 0.025,
                minRoomSize: 4,
                maxRoomSize: 10,
                corridorWidth: 2,
                extraConnections: 0.35
            }
        });
    }

    /**
     * Получить тип биома для темы
     * @returns {string}
     */
    getBiomeType() {
        return 'mountain'; // Пещеры используют mountain биом
    }

    /**
     * Применить тему к чанку
     * @param {Object} chunk - Объект чанка
     */
    applyToChunk(chunk) {
        for (let y = 0; y < chunk.size; y++) {
            for (let x = 0; x < chunk.size; x++) {
                if (chunk.tiles[y][x] === 0) { // Только на полу
                    const rand = Math.random();
                    
                    // Сталактиты/колонны (используем тип колонны)
                    if (rand < this.obstacles.tree.chance) {
                        if (!this.wouldBlockPassage(chunk, x, y, 2)) {
                            chunk.tiles[y][x] = 2; // Колонна
                        }
                    }
                    // Валуны (скалы)
                    else if (rand < this.obstacles.tree.chance + this.obstacles.rock.chance) {
                        if (!this.wouldBlockPassage(chunk, x, y, 4)) {
                            chunk.tiles[y][x] = 4; // Скала
                        }
                    }
                    // Подземные озёра
                    else if (rand < this.obstacles.tree.chance + this.obstacles.rock.chance + this.obstacles.water.chance) {
                        if (!this.wouldBlockPassage(chunk, x, y, 5)) {
                            chunk.tiles[y][x] = 5; // Вода
                        }
                    }
                }
            }
        }
    }

    /**
     * Проверка, заблокирует ли препятствие проход
     * @param {Object} chunk - Чанк
     * @param {number} x - Локальная координата X
     * @param {number} y - Локальная координата Y
     * @param {number} obstacleType - Тип препятствия
     * @returns {boolean}
     */
    wouldBlockPassage(chunk, x, y, obstacleType) {
        const original = chunk.tiles[y][x];
        chunk.tiles[y][x] = obstacleType;
        
        let passableNeighbors = 0;
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < chunk.size && ny >= 0 && ny < chunk.size) {
                const tileType = chunk.tiles[ny][nx];
                if (tileType === 0 || tileType === 6 || tileType === 7) {
                    passableNeighbors++;
                }
            }
        }
        
        chunk.tiles[y][x] = original;
        return passableNeighbors < 2;
    }
}

// Экспорт
if (typeof window !== 'undefined') {
    window.CaveTheme = CaveTheme;
}