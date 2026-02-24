/**
 * ForestTheme - Лесная тема карты
 * Тёмный лес с деревьями, густой растительностью
 */
class ForestTheme extends MapTheme {
    constructor() {
        super({
            name: 'Тёмный лес',
            id: 'forest',
            
            // Цвета текстур для лесной темы
            textures: {
                floor: '#1a1512',      // Тёмный земляной пол
                floorLight: '#2a2218', // Светлый вариант пола
                wall: '#2d2520',       // Стены из тёмного камня
                wallDark: '#1a1512',   // Тёмные участки стен
                column: '#2d2520',     // Каменные колонны
                tree: '#1a2f1a',       // Тёмно-зелёная листва
                treeTrunk: '#3d2818',  // Коричневый ствол
                rock: '#1f1a17',       // Серые камни
                water: '#1a2630',      // Тёмная вода
                ice: '#2d3a3f',        // Лёд (редко в лесу)
                decoration: '#1a2f1a'  // Растения
            },
            
            // Доступные типы врагов в лесу
            enemyTypes: ['TANK', 'ASSASSIN'],
            
            // Настройки препятствий
            obstacles: {
                tree: { chance: 0.08, minDistance: 2 },
                rock: { chance: 0.03, minDistance: 3 },
                water: { chance: 0.02, minDistance: 4 }
            },
            
            // Настройки декораций
            decorations: {
                grass: { chance: 0.15 },
                mushrooms: { chance: 0.05 },
                flowers: { chance: 0.03 }
            },
            
            // Параметры генерации
            generation: {
                roomDensity: 0.02,
                minRoomSize: 5,
                maxRoomSize: 12,
                corridorWidth: 2,
                extraConnections: 0.3
            }
        });
    }

    /**
     * Получить тип биома для темы
     * @returns {string}
     */
    getBiomeType() {
        return 'forest';
    }

    /**
     * Применить тему к чанку
     * @param {Object} chunk - Объект чанка
     */
    applyToChunk(chunk) {
        // Лесная тема добавляет больше деревьев
        for (let y = 0; y < chunk.size; y++) {
            for (let x = 0; x < chunk.size; x++) {
                if (chunk.tiles[y][x] === 0) { // Только на полу
                    const rand = Math.random();
                    
                    // Деревья - основной элемент леса
                    if (rand < this.obstacles.tree.chance) {
                        if (!this.wouldBlockPassage(chunk, x, y, 3)) {
                            chunk.tiles[y][x] = 3; // Дерево
                        }
                    }
                    // Камни
                    else if (rand < this.obstacles.tree.chance + this.obstacles.rock.chance) {
                        if (!this.wouldBlockPassage(chunk, x, y, 4)) {
                            chunk.tiles[y][x] = 4; // Скала
                        }
                    }
                    // Вода (небольшие пруды)
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
        
        // Проверяем соседние клетки
        let passableNeighbors = 0;
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < chunk.size && ny >= 0 && ny < chunk.size) {
                const tileType = chunk.tiles[ny][nx];
                // Проходимые тайлы: пол, лёд, декорация
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
    window.ForestTheme = ForestTheme;
}