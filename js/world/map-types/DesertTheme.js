/**
 * DesertTheme - Пустынная тема карты
 * Песчаные дюны, скалы, кактусы, жаркое солнце
 */
class DesertTheme extends MapTheme {
    constructor() {
        super({
            name: 'Пустыня',
            id: 'desert',
            
            // Цвета текстур для пустынной темы
            textures: {
                floor: '#2a2015',      // Песчаный пол
                floorLight: '#3a3025', // Светлый песок
                wall: '#3d3020',       // Песчаник
                wallDark: '#2a2015',   // Тёмный песчаник
                column: '#3d3020',     // Колонны из песчаника
                tree: '#2a3f1a',       // Кактусы (тёмно-зелёный)
                treeTrunk: '#2a3f1a',  // Ствол кактуса
                rock: '#4a3a25',       // Песчаные скалы
                water: '#1a2630',      // Оазис (редко)
                ice: '#2d3a3f',        // Лёд (нет в пустыне)
                decoration: '#3a4a2a'  // Сухая растительность
            },
            
            // Доступные типы врагов в пустыне
            enemyTypes: ['MAGE', 'ASSASSIN'],
            
            // Настройки препятствий
            obstacles: {
                tree: { chance: 0.04, minDistance: 3 },   // Кактусы
                rock: { chance: 0.06, minDistance: 2 },   // Скалы
                water: { chance: 0.01, minDistance: 5 }   // Оазисы (редко)
            },
            
            // Настройки декораций
            decorations: {
                bones: { chance: 0.08 },
                skulls: { chance: 0.03 },
                dryBush: { chance: 0.05 }
            },
            
            // Параметры генерации
            generation: {
                roomDensity: 0.015,
                minRoomSize: 6,
                maxRoomSize: 15,
                corridorWidth: 3,
                extraConnections: 0.25
            }
        });
    }

    /**
     * Получить тип биома для темы
     * @returns {string}
     */
    getBiomeType() {
        return 'desert';
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
                    
                    // Кактусы (используем тип дерева)
                    if (rand < this.obstacles.tree.chance) {
                        if (!this.wouldBlockPassage(chunk, x, y, 3)) {
                            chunk.tiles[y][x] = 3; // Кактус
                        }
                    }
                    // Скалы
                    else if (rand < this.obstacles.tree.chance + this.obstacles.rock.chance) {
                        if (!this.wouldBlockPassage(chunk, x, y, 4)) {
                            chunk.tiles[y][x] = 4; // Скала
                        }
                    }
                    // Оазисы (редко)
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
    window.DesertTheme = DesertTheme;
}