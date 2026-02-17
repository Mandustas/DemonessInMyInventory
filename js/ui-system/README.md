# UI System для Diablo-style RPG

Масштабируемая система UI на основе PIXI.js для игры Diablo-style Isometric RPG.

## Обзор

Новая система UI предоставляет:
- **Рендеринг на PIXI** - все UI элементы рендерятся на PIXI.Canvas, что обеспечивает лучшую производительность
- **Масштабируемость** - легко добавлять новые окна и элементы
- **Единый стиль** - централизованная конфигурация через `UIConfig`
- **Система событий** - подписка на события UI компонентов
- **Анимации** - встроенная поддержка анимаций (fade, scale, slide)

## Структура файлов

```
js/ui-system/
├── index.js              - Главный файл экспорта
├── ui-config.js          - Конфигурация стилей и размеров
├── ui-component.js       - Базовый класс для всех UI компонентов
├── ui-container.js       - Контейнер для иерархии элементов
├── ui-elements.js        - Базовые элементы (кнопки, метки, слоты и т.д.)
├── ui-renderer.js        - Рендерер на PIXI
├── ui-manager.js         - Центральный менеджер UI
├── ui-skill-bar.js       - Панель навыков
├── ui-skill-tree.js      - Дерево навыков
├── ui-inventory.js       - Окно инвентаря
└── ui-stats-window.js    - Окно характеристик
```

## Быстрый старт

### 1. Подключение в HTML

```html
<!-- Новая система UI -->
<script src="js/ui-system/ui-config.js"></script>
<script src="js/ui-system/ui-component.js"></script>
<script src="js/ui-system/ui-container.js"></script>
<script src="js/ui-system/ui-elements.js"></script>
<script src="js/ui-system/ui-renderer.js"></script>
<script src="js/ui-system/ui-manager.js"></script>
<script src="js/ui-system/ui-skill-bar.js"></script>
<script src="js/ui-system/ui-skill-tree.js"></script>
<script src="js/ui-system/ui-inventory.js"></script>
<script src="js/ui-system/ui-stats-window.js"></script>
```

### 2. Инициализация в игре

```javascript
class Game {
    constructor() {
        this.renderer = new PIXIRenderer('gameCanvas');
        
        // Инициализация UIManager
        this.uiManager = new UIManager(this.renderer);
        
        // Регистрация UI компонентов
        this.uiSkillBar = new UISkillBar(this.character);
        this.uiManager.register('skillBar', this.uiSkillBar);
        
        this.uiSkillTree = new UISkillTree(this.character);
        this.uiManager.register('skillTree', this.uiSkillTree);
        
        this.uiInventory = new UIInventory(this.character);
        this.uiManager.register('inventory', this.uiInventory);
        
        this.uiStatsWindow = new UIStatsWindow(this.character);
        this.uiManager.register('stats', this.uiStatsWindow);
    }
}
```

### 3. Использование

```javascript
// Открыть/закрыть окно
this.uiManager.toggle('inventory');
this.uiManager.open('stats');
this.uiManager.close('skillTree');

// Получить компонент
const skillBar = this.uiManager.get('skillBar');

// Обновить все UI
this.uiManager.updateAll();
```

## Создание собственных UI компонентов

### Базовый компонент

```javascript
class MyCustomWindow extends UIComponent {
    constructor(config = {}) {
        super(config);
        
        this.width = 400;
        this.height = 300;
        this.config.positionKey = 'myWindow';
    }
    
    onInit() {
        // Создание элементов UI
        this.titleLabel = new UILabel({
            text: 'МОЁ ОКНО',
            fontSize: UIConfig.fonts.sizes.xxl
        });
        this.addChild(this.titleLabel);
        
        this.closeButton = new UIButton({
            text: 'ЗАКРЫТЬ',
            onClick: () => this.close()
        });
        this.addChild(this.closeButton);
    }
    
    updateDisplay() {
        // Обновление содержимого
    }
    
    renderBackground() {
        // Кастомная отрисовка фона
    }
}
```

### Регистрация компонента

```javascript
this.uiManager.register('myWindow', new MyCustomWindow());
```

## Базовые элементы

### UIButton - Кнопка

```javascript
const button = new UIButton({
    x: 10,
    y: 10,
    width: 100,
    height: 30,
    text: 'Нажми меня',
    onClick: () => console.log('Клик!'),
    onHover: () => console.log('Наведение')
});
```

### UILabel - Текстовая метка

```javascript
const label = new UILabel({
    x: 10,
    y: 50,
    text: 'Здоровье: 100/100',
    fontSize: UIConfig.fonts.sizes.md,
    fontColor: UIConfig.colors.text.primary,
    align: 'center'
});
```

### UIProgressBar - Прогресс-бар

```javascript
const progressBar = new UIProgressBar({
    x: 10,
    y: 80,
    width: 200,
    height: 20,
    value: 0.75, // 0-1
    fillColor: UIConfig.colors.progress.health
});

progressBar.setValue(0.5);
```

### UISlot - Слот для предметов/навыков

```javascript
const slot = new UISlot({
    width: 50,
    height: 50,
    item: itemObject,
    onClick: (slot) => this.onSlotClick(slot),
    onHover: (slot) => this.onSlotHover(slot)
});
```

### UICircularBar - Круглый прогресс-бар

```javascript
const circularBar = new UICircularBar({
    x: 0,
    y: 0,
    size: 60,
    value: 0.8,
    fillColor: UIConfig.colors.progress.health
});
```

### UIGrid - Сетка

```javascript
const grid = new UIGrid({
    columns: 5,
    gap: 5,
    slotSize: 50
});

// Добавление слотов
for (let i = 0; i < 20; i++) {
    grid.addSlot(items[i]);
}
```

### UITooltip - Всплывающая подсказка

```javascript
// Через UIManager
this.uiManager.showTooltip('Предмет', 'Описание предмета', x, y);
this.uiManager.hideTooltip();
```

## Конфигурация

### UIConfig

Все стили централизованы в `UIConfig`:

```javascript
UIConfig.colors.background.dark      // '#0d0a0a'
UIConfig.colors.border.dark          // '#3a2a1a'
UIConfig.colors.text.primary         // '#c9b896'
UIConfig.fonts.sizes.md              // 14
UIConfig.components.slot.size        // 50
UIConfig.components.grid.slotGap     // 5
```

### Добавление новых стилей

```javascript
// В ui-config.js добавить:
UIConfig.colors.custom = {
    myColor: '#ff0000'
};

// Использование:
const label = new UILabel({
    fontColor: UIConfig.colors.custom.myColor
});
```

## Система событий

### Подписка на события

```javascript
component.on('open', () => console.log('Открыто'));
component.on('close', () => console.log('Закрыто'));

// Отписка
component.off('open', callback);
```

### Обработка ввода

```javascript
class MyComponent extends UIComponent {
    onInput(type, data) {
        if (type === 'mousedown') {
            console.log('Клик в координатах:', data.x, data.y);
            return true; // Событие обработано
        }
        return false;
    }
}
```

## Анимации

UIRenderer предоставляет встроенные анимации:

```javascript
// Fade in
this.renderer.uiManager.uiRenderer.fadeIn(component.container, 200);

// Fade out
this.renderer.uiManager.uiRenderer.fadeOut(component.container, 200, () => {
    component.close();
});

// Scale
this.renderer.uiManager.uiRenderer.scaleTo(component.container, 1.2, 150);
```

## Расширение системы

### Добавление нового окна

1. Создать класс, наследуемый от `UIComponent`
2. Реализовать `onInit()`, `renderBackground()`, `updateDisplay()`
3. Зарегистрировать в `UIManager`

### Добавление нового элемента

1. Создать класс, наследуемый от `UIComponent`
2. Реализовать отрисовку и обработку ввода
3. Экспортировать в `ui-elements.js`

### Добавление темы

1. Добавить новую конфигурацию в `UIConfig`
2. Использовать при создании компонентов

## Производительность

### Рекомендации

- Переиспользуйте текстуры через кэш
- Используйте пулы спрайтов для часто создаваемых элементов
- Избегайте частой перерисовки - используйте `markForUpdate()`
- Для больших списков используйте виртуализацию

## Обратная совместимость

Старые DOM-based компоненты (`skill-tree.js`, `skill-bar.js`, `ui-components.js`) сохраняются для обратной совместимости. Новые компоненты используют PIXI и регистрируются через `UIManager`.

## Примеры

### Пример 1: Создание простого окна

```javascript
class SimpleWindow extends UIComponent {
    constructor(title, config = {}) {
        super(config);
        this.title = title;
        this.width = 300;
        this.height = 200;
    }
    
    onInit() {
        this.titleLabel = new UILabel({
            text: this.title,
            fontSize: UIConfig.fonts.sizes.xl,
            align: 'center'
        });
        this.titleLabel.width = this.width;
        this.addChild(this.titleLabel);
    }
    
    renderBackground() {
        this.graphics.beginFill(0x1a1414);
        this.graphics.drawRect(0, 0, this.width, this.height);
        this.graphics.endFill();
        this.graphics.lineStyle(2, 0x3a2a1a);
        this.graphics.drawRect(0, 0, this.width, this.height);
    }
}

// Использование
this.uiManager.register('simpleWindow', new SimpleWindow('Моё окно'));
this.uiManager.toggle('simpleWindow');
```

### Пример 2: Создание панели с кнопками

```javascript
class ButtonPanel extends UIComponent {
    onInit() {
        this.container = new UIContainer({
            layout: 'flex-horizontal',
            gap: 10
        });
        
        for (let i = 1; i <= 3; i++) {
            const button = new UIButton({
                text: `Кнопка ${i}`,
                onClick: () => console.log(`Кнопка ${i} нажата`)
            });
            this.container.addChild(button);
        }
        
        this.addChild(this.container);
    }
}
```

## Лицензия

Используется в проекте Diablo-style RPG.
