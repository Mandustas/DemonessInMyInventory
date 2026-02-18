# Implementation Plan: Оптимизация производительности игры

Оптимизация систем рендеринга, освещения и управления сущностями для повышения FPS без ухудшения пользовательского опыта.

## Обзор проблемы

Игра страдает от низкого FPS, особенно при удалении от центра карты и с течением времени. Анализ выявил несколько критических проблем:

1. **Система рендеринга чанков** — кэш чанков очищается каждый кадр, что приводит к постоянному пересозданию спрайтов
2. **Система освещения** — динамическое освещение применяется ко всем тайлам каждый кадр
3. **Управление сущностями** — все враги обновляются каждый кадр без culling'а
4. **Системы эффектов** — избыточное количество частиц и обновлений

План направлен на устранение этих проблем с сохранением визуального качества игры.

---

## [Types]

Изменения типов данных для оптимизации производительности.

### Новые структуры данных

**SpatialHash** — пространственное хеширование для быстрого поиска сущностей:
```javascript
class SpatialHash {
  cellSize: number;           // Размер ячейки (по умолчанию 128)
  cells: Map<string, Set>;    // Карта ячеек с сущностями
  
  // Методы
  clear(): void;
  insert(entity: Object): void;
  remove(entity: Object): void;
  getNearby(x: number, y: number, radius: number): Array;
  update(entity: Object, oldX: number, oldY: number): void;
}
```

**ChunkRenderCache** — расширенный кэш рендеринга чанков:
```javascript
class ChunkRenderCache {
  chunks: Map<string, PIXI.Container>;
  lastAccessTime: Map<string, number>;
  maxChunks: number;          // Максимальное количество чанков в кэше (50)
  unloadThreshold: number;    // Порог времени для выгрузки (30 секунд)
  
  // Методы
  get(chunkKey: string): PIXI.Container | null;
  set(chunkKey: string, container: PIXI.Container): void;
  markAccessed(chunkKey: string): void;
  cleanup(currentChunkX: number, currentChunkY: number): void;
}
```

**LightingUpdateRegion** — область обновления освещения:
```javascript
class LightingUpdateRegion {
  centerX: number;
  centerY: number;
  radius: number;             // Радиус обновления в тайлах
  dirty: boolean;             // Флаг необходимости обновления
  
  // Методы
  contains(x: number, y: number): boolean;
  setCenter(x: number, y: number): void;
}
```

### Изменения в существующих типах

**GAME_CONFIG** — новые параметры конфигурации:
```javascript
// Добавить в config.js
OPTIMIZATION: {
  CHUNK_CACHE_MAX_SIZE: 50,
  CHUNK_UNLOAD_DISTANCE: 3,        // Чанков от игрока
  ENTITY_CULLING_MARGIN: 100,       // Пикселей за пределами экрана
  SPATIAL_HASH_CELL_SIZE: 128,
  LIGHTING_UPDATE_RADIUS: 8,        // Тайлов от игрока
  LIGHTING_CACHE_TTL: 5000,         // Время жизни кэша в мс
  PARTICLE_CULLING_ENABLED: true,
  DISTANT_ENTITY_UPDATE_INTERVAL: 3 // Обновлять далёких врагов каждые N кадров
}
```

---

## [Files]

Изменения в файлах проекта.

### Новые файлы

1. **js/optimization/spatial-hash.js**
   - Назначение: Класс пространственного хеширования для оптимизации поиска сущностей
   - Создать новую директорию `js/optimization/`

2. **js/optimization/chunk-cache.js**
   - Назначение: Улучшенный кэш чанков с автоматической выгрузкой

### Файлы для изменения

1. **js/pixi-renderer.js**
   - Удалить вызов `clearChunkCache()` из `setCameraPosition()` и `followCharacter()`
   - Добавить пороговое расстояние для очистки кэша
   - Оптимизировать `updateDynamicLighting()` — обновлять только видимые тайлы
   - Добавить culling для сущностей в `renderEnemy()` и `renderCharacter()`
   - Изменить `maxVisibleEntities` на динамический расчёт

2. **js/lighting-system.js**
   - Добавить `LightingUpdateRegion` для ограничения области обновления
   - Оптимизировать `applyLightingToSprite()` — проверять видимость
   - Увеличить `maxCacheSize` до 10000
   - Добавить TTL для записей кэша
   - Упростить `calculateLightIntensityFromSource()` для далёких тайлов

3. **js/light-source.js**
   - Добавить кэширование `getEffectiveRadius()` и `getEffectiveIntensity()`
   - Уменьшить частоту обновления мерцания

4. **js/updated-game.js**
   - Добавить пространственное хеширование для врагов
   - Оптимизировать `updateEnemySpawning()` — использовать spatial hash
   - Добавить culling для обновления врагов
   - Уменьшить частоту обновления для далёких врагов

5. **js/enemy.js**
   - Добавить свойство `lastUpdateFrame` для пропуска кадров
   - Оптимизировать `update()` — проверять расстояние до игрока

6. **js/torch.js**
   - Уменьшить количество частиц пламени с 8 до 5
   - Добавить culling для факелов вне viewport
   - Оптимизировать `updateFlame()` — обновлять только видимые

7. **js/fireball.js**
   - Уменьшить количество частиц с 10 до 6
   - Добавить culling для частиц

8. **js/config.js**
   - Добавить секцию `OPTIMIZATION` с новыми параметрами
   - Уменьшить `LOAD_RADIUS` с 4 до 3
   - Уменьшить `TORCH.MAX_TORCHES` с 50 до 30

9. **js/world-map.js**
   - Оптимизировать `getChunksToRender()` — использовать tighter bounds

---

## [Functions]

Изменения в функциях.

### Новые функции

1. **js/optimization/spatial-hash.js**
   - `constructor(cellSize)` — инициализация хеш-таблицы
   - `clear()` — очистка всех ячеек
   - `insert(entity)` — добавление сущности в ячейку
   - `remove(entity)` — удаление сущности из ячейки
   - `getNearby(x, y, radius)` — получение сущностей в радиусе
   - `update(entity, oldX, oldY)` — обновление позиции сущности
   - `getCellKey(x, y)` — получение ключа ячейки

2. **js/optimization/chunk-cache.js**
   - `constructor(maxChunks, unloadThreshold)` — инициализация кэша
   - `get(chunkKey)` — получение чанка с обновлением времени доступа
   - `set(chunkKey, container)` — добавление чанка в кэш
   - `cleanup(currentChunkX, currentChunkY)` — очистка далёких чанков

### Изменяемые функции

1. **js/pixi-renderer.js**
   
   - `setCameraPosition(x, y)` — **ИЗМЕНИТЬ**
     - Удалить вызов `clearChunkCache()`
     - Добавить проверку расстояния для очистки кэша
     ```javascript
     // Было:
     setCameraPosition(x, y) {
       this.camera.x = x;
       this.camera.y = y;
       // ... обновление позиции
       this.clearChunkCache(); // УДАЛИТЬ ЭТО
     }
     
     // Станет:
     setCameraPosition(x, y) {
       const dx = x - this.camera.x;
       const dy = y - this.camera.y;
       const distance = Math.sqrt(dx * dx + dy * dy);
       
       this.camera.x = x;
       this.camera.y = y;
       // ... обновление позиции
       
       // Очищать только при значительном перемещении
       if (distance > this.chunkUnloadThreshold) {
         this.clearChunkCache();
       }
     }
     ```

   - `followCharacter(character, smoothness)` — **ИЗМЕНИТЬ**
     - Удалить вызов `clearChunkCache()`

   - `updateDynamicLighting()` — **ИЗМЕНИТЬ**
     - Добавить проверку видимости спрайта
     - Обновлять только тайлы в радиусе от игрока
     ```javascript
     updateDynamicLighting() {
       if (!this.lightingSystem) return;
       
       const playerLight = this.lightingSystem.playerLight;
       if (!playerLight) return;
       
       const updateRadius = playerLight.radius * GAME_CONFIG.TILE.BASE_SIZE * 1.5;
       
       for (const [chunkKey, chunkContainer] of this.chunkCache.entries()) {
         for (const sprite of chunkContainer.children) {
           if (!sprite || sprite.destroyed) continue;
           
           // Проверка расстояния до игрока
           const dx = sprite.worldX - playerLight.x;
           const dy = sprite.worldY - playerLight.y;
           const dist = Math.sqrt(dx * dx + dy * dy);
           
           if (dist > updateRadius) continue; // Пропускаем далёкие тайлы
           
           // Применяем освещение
           this.lightingSystem.applyLightingToSprite(sprite, sprite.worldX, sprite.worldY, sprite.tileType);
         }
       }
     }
     ```

   - `isObjectVisible(x, y, width, height)` — **ОПТИМИЗИРОВАТЬ**
     - Использовать кэшированные границы viewport

   - `renderEnemy(enemy)` — **ИЗМЕНИТЬ**
     - Добавить проверку видимости перед рендерингом
     ```javascript
     renderEnemy(enemy) {
       // Culling — проверяем видимость
       if (!this.isObjectVisible(enemy.x, enemy.y, 32, 32)) {
         // Скрываем спрайт если есть
         const sprite = this.entitySprites.get(enemy);
         if (sprite) sprite.visible = false;
         return;
       }
       // ... остальной код
     }
     ```

2. **js/lighting-system.js**
   
   - `applyLightingToSprite(sprite, worldX, worldY, tileType)` — **ИЗМЕНИТЬ**
     - Добавить проверку расстояния до ближайшего источника света
     ```javascript
     applyLightingToSprite(sprite, worldX, worldY, tileType) {
       // Быстрая проверка — если нет активных источников рядом, используем ambient
       const nearestLight = this.getNearestLight(worldX, worldY);
       if (!nearestLight || nearestLight.distance > nearestLight.light.getEffectiveRadius() * GAME_CONFIG.TILE.BASE_SIZE) {
         sprite.tint = this.getAmbientColor();
         return;
       }
       
       const litColor = this.getLitColor(worldX, worldY, tileType);
       sprite.tint = litColor;
     }
     ```

   - `calculateLighting(worldX, worldY, tileType)` — **ОПТИМИЗИРОВАТЬ**
     - Добавить быстрый путь для далёких тайлов

   - `getNearestLight(x, y)` — **НОВАЯ**
     - Получение ближайшего источника света

3. **js/updated-game.js**
   
   - `update(deltaTime)` — **ИЗМЕНИТЬ**
     - Добавить culling для обновления врагов
     ```javascript
     update(deltaTime) {
       // ... существующий код
       
       // Обновляем врагов с culling
       const frameCount = this.frameCount || 0;
       this.frameCount = frameCount + 1;
       
       for (const enemy of this.enemies) {
         const dx = enemy.x - this.character.x;
         const dy = enemy.y - this.character.y;
         const dist = Math.sqrt(dx * dx + dy * dy);
         
         // Далёкие враги обновляются реже
         if (dist > 300) {
           if (frameCount % GAME_CONFIG.OPTIMIZATION.DISTANT_ENTITY_UPDATE_INTERVAL !== 0) {
             continue;
           }
         }
         
         enemy.update(this.character, null, this.chunkSystem);
         // ... остальной код
       }
     }
     ```

   - `handleEnemyCollisions(enemy)` — **ОПТИМИЗИРОВАТЬ**
     - Использовать spatial hash вместо перебора всех врагов

4. **js/enemy.js**
   
   - `update(player, map, chunkSystem)` — **ИЗМЕНИТЬ**
     - Добавить проверку расстояния для оптимизации

5. **js/torch.js**
   
   - `updateFlame(deltaTime)` — **ИЗМЕНИТЬ**
     - Уменьшить количество частиц с 8 до 5
     - Добавить проверку видимости

6. **js/fireball.js**
   
   - `initParticles()` — **ИЗМЕНИТЬ**
     - Уменьшить количество частиц с 10 до 6

### Удаляемые функции

Нет функций для полного удаления. Все изменения — оптимизация существующего кода.

---

## [Classes]

Изменения в классах.

### Новые классы

1. **SpatialHash** (js/optimization/spatial-hash.js)
   - Назначение: Пространственное хеширование для O(1) поиска ближайших сущностей
   - Методы: clear, insert, remove, getNearby, update
   - Наследование: нет

2. **ChunkRenderCache** (js/optimization/chunk-cache.js)
   - Назначение: Улучшенный кэш чанков с TTL и автоматической выгрузкой
   - Методы: get, set, cleanup, markAccessed
   - Наследование: нет

### Изменяемые классы

1. **PIXIRenderer** (js/pixi-renderer.js)
   - Добавить свойство `chunkUnloadThreshold` (по умолчанию 2 * chunkSize * tileSize)
   - Добавить свойство `spatialHash` для оптимизации поиска
   - Оптимизировать методы рендеринга

2. **LightingSystem** (js/lighting-system.js)
   - Добавить свойство `updateRegion` (LightingUpdateRegion)
   - Добавить метод `getNearestLight(x, y)`
   - Увеличить `maxCacheSize` до 10000

3. **Game** (js/updated-game.js)
   - Добавить свойство `spatialHash` (SpatialHash)
   - Добавить свойство `frameCount` для пропуска кадров
   - Оптимизировать игровой цикл

4. **Enemy** (js/enemy.js)
   - Добавить свойство `culled` (boolean) — находится ли враг вне viewport
   - Оптимизировать обновление

5. **Torch** (js/torch.js)
   - Уменьшить `flameParticles` с 8 до 5

6. **Fireball** (js/fireball.js)
   - Уменьшить `particleCount` с 10 до 6

---

## [Dependencies]

Изменения в зависимостях.

### Новые зависимости

Нет новых внешних зависимостей. Все оптимизации используют существующий стек (PIXI.js).

### Изменения в версиях

Не требуются.

---

## [Testing]

Подход к тестированию оптимизаций.

### Метрики производительности

1. **FPS** — основной показатель
   - Цель: стабильные 60 FPS при 50+ врагах
   - Цель: минимум 30 FPS при 100+ врагах

2. **Время кадра** — детальный анализ
   - Цель: update() < 10ms
   - Цель: render() < 6ms

3. **Память** — использование памяти
   - Цель: отсутствие утечек памяти при длительной игре
   - Цель: стабильное использование памяти при перемещении

### Тестовые сценарии

1. **Базовый тест**
   - Запустить игру
   - Измерить FPS в стартовой позиции
   - Переместиться на 10 чанков от старта
   - Измерить FPS в новой позиции
   - Вернуться к старту
   - Проверить отсутствие утечек памяти

2. **Стресс-тест врагами**
   - Спаун 50 врагов
   - Измерить FPS
   - Спаун 100 врагов
   - Измерить FPS
   - Убить всех врагов
   - Проверить очистку памяти

3. **Тест освещения**
   - Включить отображение FPS
   - Перемещаться по карте
   - Проверить стабильность FPS при разных количествах факелов

4. **Тест длительной игры**
   - Играть 30 минут
   - Измерять FPS каждые 5 минут
   - Проверить отсутствие деградации производительности

### Валидация пользовательского опыта

1. Визуальное качество освещения не должно ухудшиться
2. Анимации должны оставаться плавными
3. Отклик управления должен быть мгновенным
4. Миникарта должна корректно отображаться

---

## [Implementation Order]

Порядок реализации для минимизации конфликтов и обеспечения успешной интеграции.

### Шаг 1: Оптимизация кэша чанков (Критический)
1. Изменить `config.js` — добавить параметры оптимизации
2. Изменить `pixi-renderer.js`:
   - Удалить `clearChunkCache()` из `setCameraPosition()`
   - Удалить `clearChunkCache()` из `followCharacter()`
   - Добавить пороговое расстояние для очистки кэша
3. Протестировать базовый FPS

### Шаг 2: Оптимизация системы освещения (Критический)
1. Изменить `lighting-system.js`:
   - Добавить проверку расстояния в `applyLightingToSprite()`
   - Оптимизировать `updateDynamicLighting()` в `pixi-renderer.js`
   - Увеличить размер кэша
2. Протестировать качество освещения

### Шаг 3: Culling для сущностей (Высокий приоритет)
1. Изменить `pixi-renderer.js`:
   - Добавить проверку видимости в `renderEnemy()`
   - Добавить проверку видимости в `renderCharacter()`
2. Изменить `updated-game.js`:
   - Добавить culling для обновления врагов
   - Добавить пропуск кадров для далёких врагов
3. Протестировать с большим количеством врагов

### Шаг 4: Оптимизация эффектов (Средний приоритет)
1. Изменить `torch.js`:
   - Уменьшить количество частиц
   - Добавить culling
2. Изменить `fireball.js`:
   - Уменьшить количество частиц
3. Изменить `config.js`:
   - Уменьшить MAX_TORCHES
4. Протестировать визуальное качество

### Шаг 5: Пространственное хеширование (Средний приоритет)
1. Создать `js/optimization/spatial-hash.js`
2. Изменить `updated-game.js`:
   - Интегрировать SpatialHash
   - Оптимизировать `handleEnemyCollisions()`
3. Протестировать производительность

### Шаг 6: Финальная оптимизация и тестирование
1. Провести все тестовые сценарии
2. Измерить финальные метрики
3. Валидировать пользовательский опыт
4. Документировать изменения

---

## Ожидаемые результаты

После реализации всех оптимизаций:

| Метрика | До | После |
|---------|-----|-------|
| FPS (старт) | 30-40 | 55-60 |
| FPS (удаление от центра) | 15-20 | 45-55 |
| FPS (50+ врагов) | 20-25 | 50-60 |
| Время кадра (update) | 15-25ms | 5-10ms |
| Время кадра (render) | 10-15ms | 4-6ms |
| Использование памяти | Рост со временем | Стабильное |