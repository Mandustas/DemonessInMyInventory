/**
 * UIInventory - окно инвентаря на новой системе UI
 * Изящный дарк фентези стиль
 */
class UIInventory extends UIComponent {
    constructor(character, config = {}) {
        super(config);
        
        this.character = character;
        
        // Размеры окна
        this.width = 380;
        this.height = 400;
        this.padding = 20;
        
        // Позиционирование по центру
        this.config.positionKey = 'inventory';
        
        // Параметры сетки
        this.slotSize = 50;
        this.slotGap = 6;
        this.columns = 5;
        
        // Контейнеры
        this.slotsContainer = null;
        this.inventorySlots = [];
        
        // Кеш иконок
        this.iconCache = new Map();
    }
    
    /**
     * Хук инициализации
     */
    onInit() {
        // Создаем контейнер с сеткой
        this.gridContainer = new PIXI.Container();
        this.container.addChild(this.gridContainer);
        
        // Создаем заголовок
        this.renderTitle();
        
        // Создаем сетку инвентаря
        this.createInventoryGrid();
        
        // Обновляем отображение
        this.updateDisplay();
    }
    
    /**
     * Отрисовка заголовка
     */
    renderTitle() {
        const titleStyle = new PIXI.TextStyle({
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 22,
            fill: '#c9b896',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowDistance: 2,
            dropShadowAngle: Math.PI / 4
        });
        
        this.titleText = new PIXI.Text('ИНВЕНТАРЬ', titleStyle);
        this.titleText.anchor.set(0.5, 0);
        this.titleText.x = this.width / 2;
        this.titleText.y = this.padding;
        this.container.addChild(this.titleText);
        
        // Кнопка закрытия
        this.createCloseButton();
    }
    
    /**
     * Создание кнопки закрытия
     */
    createCloseButton() {
        const closeBtn = new UIButton({
            x: this.width - 80,
            y: 8,
            width: 70,
            height: 24,
            text: 'ЗАКРЫТЬ',
            fontSize: 11,
            onClick: () => this.close()
        });
        this.addChild(closeBtn);
    }
    
    /**
     * Создание сетки инвентаря
     */
    createInventoryGrid() {
        // Вычисляем параметры сетки
        const maxInventorySize = this.character.maxInventorySize || GAME_CONFIG.CHARACTER.INVENTORY_SIZE;
        const rows = Math.ceil(maxInventorySize / this.columns);
        
        const totalWidth = this.columns * this.slotSize + (this.columns - 1) * this.slotGap;
        const totalHeight = rows * this.slotSize + (rows - 1) * this.slotGap;
        
        const startX = (this.width - totalWidth) / 2;
        const startY = this.padding + 45;
        
        this.gridStartX = startX;
        this.gridStartY = startY;
        
        // Создаем слоты
        for (let i = 0; i < maxInventorySize; i++) {
            const col = i % this.columns;
            const row = Math.floor(i / this.columns);
            
            const x = startX + col * (this.slotSize + this.slotGap);
            const y = startY + row * (this.slotSize + this.slotGap);
            
            const slot = this.createSlot(i, x, y);
            this.inventorySlots.push(slot);
            this.gridContainer.addChild(slot.container);
        }
        
        // Обновляем высоту окна
        this.height = startY + totalHeight + this.padding + 15;
    }
    
    /**
     * Создание отдельного слота
     */
    createSlot(index, x, y) {
        const slot = {
            index: index,
            x: x,
            y: y,
            width: this.slotSize,
            height: this.slotSize,
            container: new PIXI.Container(),
            graphics: new PIXI.Graphics(),
            icon: null,
            item: null,
            isHovered: false
        };

        slot.container.x = x;
        slot.container.y = y;
        slot.container.addChild(slot.graphics);

        // Включаем интерактивность
        slot.container.eventMode = 'static';
        slot.container.cursor = 'pointer';

        // Обработчики событий
        slot.container.on('pointerover', () => {
            slot.isHovered = true;
            this.renderSlot(slot);
            this.onSlotHover(index, slot);
        });

        slot.container.on('pointerout', () => {
            slot.isHovered = false;
            this.renderSlot(slot);
            this.hideItemTooltip();
        });

        slot.container.on('pointermove', (e) => {
            // Обновляем позицию тултипа при движении мыши
            if (slot.item && slot.isHovered) {
                const rect = this.uiRenderer.app.view.getBoundingClientRect();
                const screenX = e.data.global.x;
                const screenY = e.data.global.y;
                this.updateItemTooltipPosition(screenX, screenY);
            }
        });

        slot.container.on('pointerdown', (e) => {
            if (e.data.button === 2) {
                this.onSlotRightClick(index);
            } else {
                this.onSlotClick(index);
            }
        });

        // Первоначальная отрисовка
        this.renderSlot(slot);

        return slot;
    }
    
    /**
     * Отрисовка слота
     */
    renderSlot(slot) {
        const g = slot.graphics;
        g.clear();
        
        // Градиентный фон слота
        for (let i = 0; i < this.slotSize; i++) {
            const t = i / (this.slotSize - 1);
            const r1 = 42, g1 = 26, b1 = 26; // #2a1a1a
            const r2 = 26, g2 = 15, b2 = 15;  // #1a0f0f
            const r = Math.round(r1 + (r2 - r1) * t);
            const gr = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (gr << 8) + b;
            g.beginFill(color);
            g.drawRect(0, i, this.slotSize, 1);
            g.endFill();
        }
        
        // Внутренняя тень (inner glow)
        g.beginFill(0xc9b896, slot.isHovered ? 0.15 : 0.08);
        g.drawRect(0, 0, this.slotSize, 1);
        g.endFill();
        
        // Определяем цвет рамки
        let borderColor = 0x3a2a1a;
        if (slot.item && slot.item.getColorByRarity) {
            const rarityColor = slot.item.getColorByRarity();
            borderColor = this.hexToDecimal(rarityColor);
        } else if (slot.isHovered) {
            borderColor = 0x6a5a4a;
        }
        
        // Рамка
        g.lineStyle(2, borderColor);
        g.drawRoundedRect(0, 0, this.slotSize, this.slotSize, 3);
        
        // Иконка предмета
        if (slot.item) {
            this.renderSlotIcon(slot);
        }
    }
    
    /**
     * Отрисовка иконки предмета в слоте
     */
    renderSlotIcon(slot) {
        // Удаляем старую иконку
        if (slot.icon) {
            slot.container.removeChild(slot.icon);
            slot.icon = null;
        }
        
        // Получаем текстуру
        const texture = this.getItemIconTexture(slot.item);
        
        // Создаем спрайт
        const icon = new PIXI.Sprite(texture);
        icon.anchor.set(0.5);
        icon.x = this.slotSize / 2;
        icon.y = this.slotSize / 2;
        icon.scale.set(0.7);
        
        slot.icon = icon;
        slot.container.addChild(icon);
    }
    
    /**
     * Получение текстуры иконки предмета
     */
    getItemIconTexture(item) {
        const cacheKey = `inv_icon_${item.type}_${item.rarity || 'common'}`;
        
        if (this.iconCache.has(cacheKey)) {
            return this.iconCache.get(cacheKey);
        }
        
        // Цвета по типу предмета
        const typeColors = {
            weapon: 0xc0c0c0,
            helmet: 0x8b4513,
            armor: 0x4a5568,
            ring: 0xffd700,
            amulet: 0x9c27b0
        };
        
        const color = typeColors[item.type] || 0x607d8b;
        
        // Создаем текстуру
        const g = new PIXI.Graphics();
        
        // Фон иконки
        g.beginFill(color);
        g.drawRect(0, 0, 32, 32);
        g.endFill();
        
        // Рамка по редкости
        if (item.getColorByRarity) {
            const rarityColor = this.hexToDecimal(item.getColorByRarity());
            g.lineStyle(2, rarityColor);
            g.drawRect(0, 0, 32, 32);
        }
        
        const texture = this.uiRenderer.app.renderer.generateTexture(g);
        g.destroy();
        
        this.iconCache.set(cacheKey, texture);
        return texture;
    }
    
    /**
     * Обработка клика по слоту
     */
    onSlotClick(index) {
        const item = this.character.inventory[index];
        if (!item) return;
        
        // Экипировка предмета
        if (item.type && ['weapon', 'helmet', 'armor', 'ring', 'amulet'].includes(item.type)) {
            this.character.equipItem(item);
            this.character.removeFromInventory(index);
            this.updateDisplay();
        }
    }
    
    /**
     * Обработка правого клика по слоту
     */
    onSlotRightClick(index) {
        console.log('Правый клик по слоту', index);
    }
    
    /**
     * Обработка наведения на слот
     */
    onSlotHover(index, slot) {
        const item = this.character.inventory[index];
        if (!item) {
            this.hideItemTooltip();
            return;
        }

        // Получаем экранные координаты из слота
        const screenX = slot.container.parent.toGlobal(slot.container).x + this.slotSize / 2;
        const screenY = slot.container.parent.toGlobal(slot.container).y + this.slotSize / 2;

        // Используем ItemTooltip для предметов с методом getColorByRarity
        if (item.getColorByRarity) {
            this.showItemTooltip(item, screenX, screenY);
        } else {
            // Для простых предметов используем старый тултип
            const title = item.name || 'Предмет';
            const description = this.getItemDescription(item);
            this.showTooltip(title, description, screenX, screenY);
        }
    }

    /**
     * Получение описания предмета
     */
    getItemDescription(item) {
        if (item.getDescription) {
            return item.getDescription();
        }

        let desc = `Тип: ${item.type || 'Неизвестно'}\n`;
        desc += `Редкость: ${item.rarity || 'Обычный'}\n`;

        if (item.stats) {
            desc += '\nХарактеристики:\n';
            for (const [stat, value] of Object.entries(item.stats)) {
                desc += `  ${stat}: ${value}\n`;
            }
        }

        return desc;
    }

    /**
     * Показ тултипа предмета
     */
    showItemTooltip(item, screenX, screenY) {
        if (this.uiRenderer.uiManager) {
            this.uiRenderer.uiManager.showItemTooltip(item, screenX, screenY);
        }
    }

    /**
     * Обновление позиции тултипа предмета
     */
    updateItemTooltipPosition(screenX, screenY) {
        if (this.uiRenderer.uiManager) {
            this.uiRenderer.uiManager.updateItemTooltipPosition(screenX, screenY);
        }
    }

    /**
     * Скрытие тултипа предмета
     */
    hideItemTooltip() {
        if (this.uiRenderer.uiManager) {
            this.uiRenderer.uiManager.hideItemTooltip();
        }
    }

    /**
     * Показ тултипа (старый метод для простых предметов)
     */
    showTooltip(title, description, x, y) {
        if (this.uiRenderer.uiManager) {
            this.uiRenderer.uiManager.showTooltip(title, description, x, y);
        }
    }

    /**
     * Скрытие тултипа
     */
    hideTooltip() {
        if (this.uiRenderer.uiManager) {
            this.uiRenderer.uiManager.hideTooltip();
        }
    }
    
    /**
     * Обновление отображения
     */
    updateDisplay() {
        if (!this.isOpen) return;
        
        // Обновляем каждый слот
        for (let i = 0; i < this.inventorySlots.length; i++) {
            const slot = this.inventorySlots[i];
            const item = this.character.inventory[i];
            
            slot.item = item || null;
            this.renderSlot(slot);
        }
    }
    
    /**
     * Хук при открытии
     */
    onOpen() {
        this.updateDisplay();
    }
    
    /**
     * Обновление при изменении инвентаря (вызывается из игры)
     */
    onInventoryUpdate() {
        if (this.isOpen) {
            this.updateDisplay();
        }
    }
    
    /**
     * Отрисовка фона окна - изящный дарк фентези стиль
     */
    renderBackground() {
        if (!this.graphics) return;

        // Основной градиентный фон
        for (let i = 0; i < this.height; i++) {
            const t = i / (this.height - 1);
            const r1 = 26, g1 = 20, b1 = 20;
            const r2 = 13, g2 = 10, b2 = 10;
            const r = Math.round(r1 + (r2 - r1) * t);
            const gr = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (gr << 8) + b;
            this.graphics.beginFill(color);
            this.graphics.drawRect(0, i, this.width, 1);
            this.graphics.endFill();
        }

        // Внешняя рамка
        this.graphics.lineStyle(2, 0x3a2a1a);
        this.graphics.drawRect(0, 0, this.width, this.height);

        // Толстая внешняя тень
        this.graphics.lineStyle(4, 0x000000, 0.4);
        this.graphics.drawRect(-3, -3, this.width + 6, this.height + 6);

        // Внутренняя тень
        this.graphics.lineStyle(2, 0x4a3a2a, 0.2);
        this.graphics.drawRect(3, 3, this.width - 6, this.height - 6);

        // Декоративные уголки
        this.drawCornerDecorations();

        // Линия под заголовком
        this.drawTitleLine();
    }
    
    /**
     * Отрисовка декоративных уголков
     */
    drawCornerDecorations() {
        const cornerSize = 8;
        
        // Верхний левый
        this.graphics.lineStyle(2, 0x6a5a4a);
        this.graphics.moveTo(5, 5 + cornerSize);
        this.graphics.lineTo(5, 5);
        this.graphics.lineTo(5 + cornerSize, 5);
        
        // Верхний правый
        this.graphics.moveTo(this.width - 5 - cornerSize, 5);
        this.graphics.lineTo(this.width - 5, 5);
        this.graphics.lineTo(this.width - 5, 5 + cornerSize);
        
        // Нижний левый
        this.graphics.moveTo(5, this.height - 5 - cornerSize);
        this.graphics.lineTo(5, this.height - 5);
        this.graphics.lineTo(5 + cornerSize, this.height - 5);
        
        // Нижний правый
        this.graphics.moveTo(this.width - 5 - cornerSize, this.height - 5);
        this.graphics.lineTo(this.width - 5, this.height - 5);
        this.graphics.lineTo(this.width - 5, this.height - 5 - cornerSize);
    }
    
    /**
     * Отрисовка линии под заголовком
     */
    drawTitleLine() {
        // Основная линия
        this.graphics.lineStyle(1, 0x3a2a1a);
        this.graphics.moveTo(this.padding, this.padding + 30);
        this.graphics.lineTo(this.width - this.padding, this.padding + 30);
        
        // Декоративная линия
        this.graphics.lineStyle(1, 0x6a5a4a, 0.5);
        this.graphics.moveTo(this.padding + 5, this.padding + 32);
        this.graphics.lineTo(this.width - this.padding - 5, this.padding + 32);
    }
    
    /**
     * Отрисовка содержимого
     */
    renderContent() {
        // Заголовок уже отрисован в renderTitle
    }
}

// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIInventory;
} else if (typeof window !== 'undefined') {
    window.UIInventory = UIInventory;
}
