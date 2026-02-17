/**
 * UIInventory - окно инвентаря на новой системе UI
 * Отображает предметы инвентаря, позволяет управлять ими
 */
class UIInventory extends UIComponent {
    constructor(character, config = {}) {
        super(config);
        
        this.character = character;
        
        // Размеры из конфига
        this.width = UIConfig.components.window.minWidth;
        this.height = UIConfig.components.window.minHeight;
        this.padding = UIConfig.components.window.padding;
        
        // Позиционирование по центру
        this.config.positionKey = 'inventory';
        
        // Сетка инвентаря
        this.slotsContainer = null;
        this.inventorySlots = [];
        
        // Размер слота
        this.slotSize = UIConfig.components.slot.size;
        this.slotGap = UIConfig.components.grid.slotGap;
        this.columns = UIConfig.components.grid.defaultColumns;
    }
    
    /**
     * Хук инициализации
     */
    onInit() {
        // Создаем основные элементы UI
        this.createTitle();
        this.createCloseButton();
        this.createInventoryGrid();
        
        // Обновляем отображение
        this.updateDisplay();
    }
    
    /**
     * Создание заголовка
     * text-shadow: 2px 2px 4px #000 (из CSS для заголовков)
     */
    createTitle() {
        this.titleLabel = new UILabel({
            x: this.padding,
            y: this.padding,
            text: 'ИНВЕНТАРЬ',
            fontSize: UIConfig.fonts.sizes.xxl,
            fontColor: UIConfig.colors.text.primary,
            align: 'center',
            isTitle: true
        });
        this.titleLabel.width = this.width - this.padding * 2;
        this.titleLabel.height = 30;
        this.addChild(this.titleLabel);
    }
    
    /**
     * Создание кнопки закрытия
     */
    createCloseButton() {
        this.closeButton = new UIButton({
            x: this.width - 80,
            y: 10,
            width: 70,
            height: 25,
            text: 'ЗАКРЫТЬ',
            fontSize: UIConfig.fonts.sizes.sm,
            onClick: () => this.close()
        });
        this.addChild(this.closeButton);
    }
    
    /**
     * Создание сетки инвентаря
     */
    createInventoryGrid() {
        const gridY = this.padding + 50;
        const availableWidth = this.width - this.padding * 2;
        
        // Вычисляем размеры сетки
        const totalWidth = this.columns * this.slotSize + (this.columns - 1) * this.slotGap;
        const startX = (this.width - totalWidth) / 2;
        
        this.slotsContainer = new UIContainer({
            x: startX,
            y: gridY,
            width: totalWidth,
            layout: 'grid',
            gridColumns: this.columns,
            gap: this.slotGap,
            cellWidth: this.slotSize,
            cellHeight: this.slotSize,
            background: { color: null },
            border: { color: null, width: 0 }
        });
        
        this.addChild(this.slotsContainer);
        
        // Создаем слоты по размеру инвентаря
        const maxInventorySize = this.character.maxInventorySize || GAME_CONFIG.CHARACTER.INVENTORY_SIZE;
        for (let i = 0; i < maxInventorySize; i++) {
            this.createInventorySlot(i);
        }
    }
    
    /**
     * Создание слота инвентаря
     */
    createInventorySlot(index) {
        const slot = new UISlot({
            width: this.slotSize,
            height: this.slotSize,
            onClick: () => this.onSlotClick(index),
            onHover: () => this.onSlotHover(index),
            onRightClick: () => this.onSlotRightClick(index),
            onPointerOut: () => this.hideTooltip()
        });

        // Сохраняем ссылку на слот
        this.inventorySlots.push(slot);
        this.slotsContainer.addChild(slot);

        return slot;
    }
    
    /**
     * Обработка клика по слоту
     */
    onSlotClick(index) {
        const item = this.character.inventory[index];
        if (!item) return;
        
        // Если предмет можно экипировать
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
        // Можно реализовать использование предмета
        console.log('Правый клик по слоту', index);
    }
    
    /**
     * Обработка наведения на слот
     */
    onSlotHover(index) {
        const item = this.character.inventory[index];
        if (!item) {
            this.hideTooltip();
            return;
        }
        
        // Показываем тултип с информацией о предмете
        const title = item.name || 'Предмет';
        const description = this.getItemDescription(item);
        
        this.showTooltip(title, description);
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
     * Показ тултипа
     */
    showTooltip(title, description) {
        if (this.uiRenderer.uiManager) {
            this.uiRenderer.uiManager.showTooltip(title, description, 0, 0);
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
            
            if (item) {
                // Устанавливаем иконку предмета
                const iconTexture = this.getItemIconTexture(item);
                slot.setIcon(iconTexture);
                
                // Устанавливаем цвет рамки в зависимости от редкости
                if (item.getColorByRarity) {
                    const rarityColor = item.getColorByRarity();
                    slot.borderStyle = {
                        color: rarityColor,
                        width: 2,
                        radius: 3
                    };
                    // Убираем GlowFilter так как он может отсутствовать в PIXI
                    // slot.container.filters = [...];
                }
                
                slot.title = item.getDescription ? item.getDescription() : (item.name || 'Предмет');
            } else {
                slot.clear();
                slot.title = 'Пустой слот';
                slot.borderStyle = {
                    color: UIConfig.colors.border.dark,
                    width: 2,
                    radius: 3
                };
            }
            
            slot.markForUpdate();
        }
    }
    
    /**
     * Получение текстуры иконки предмета
     */
    getItemIconTexture(item) {
        // Проверяем кэш
        const cacheKey = `item_icon_${item.type}_${item.rarity || 'common'}`;
        if (this.uiRenderer.textureCache.has(cacheKey)) {
            return this.uiRenderer.textureCache.get(cacheKey);
        }
        
        // Определяем цвет по типу
        const typeColors = {
            weapon: '#c0c0c0',
            helmet: '#8b4513',
            armor: '#4a5568',
            ring: '#ffd700',
            amulet: '#9c27b0'
        };
        
        const color = typeColors[item.type] || '#607d8b';
        
        // Создаем текстуру
        const texture = this.uiRenderer.createTexture((g) => {
            // Фон
            g.beginFill(this.uiRenderer.hexToDecimal(color));
            g.drawRect(0, 0, 32, 32);
            g.endFill();
            
            // Рамка по цвету редкости
            if (item.getColorByRarity) {
                const rarityColor = item.getColorByRarity();
                g.lineStyle(2, this.uiRenderer.hexToDecimal(rarityColor));
                g.drawRect(0, 0, 32, 32);
            }
        });
        
        this.uiRenderer.textureCache.set(cacheKey, texture);
        return texture;
    }
    
    /**
     * Хук при открытии
     */
    onOpen() {
        this.updateDisplay();
    }
    
    /**
     * Обновление при изменении инвентаря
     */
    onInventoryUpdate() {
        if (this.isOpen) {
            this.updateDisplay();
        }
    }
    
    /**
     * Отрисовка фона окна
     * Градиент: linear-gradient(to bottom, #1a1414 0%, #0d0a0a 100%)
     * box-shadow: 0 0 20px rgba(0,0,0,0.8), inset 0 0 10px rgba(74,58,42,0.3)
     */
    renderBackground() {
        if (!this.graphics) return;

        // Градиентный фон (вертикальный от #1a1414 к #0d0a0a)
        for (let i = 0; i < this.height; i++) {
            const t = i / (this.height - 1);
            const r1 = 26, g1 = 20, b1 = 20; // #1a1414
            const r2 = 13, g2 = 10, b2 = 10; // #0d0a0a
            const r = Math.round(r1 + (r2 - r1) * t);
            const g = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (g << 8) + b;
            this.graphics.beginFill(color);
            this.graphics.drawRect(0, i, this.width, 1);
            this.graphics.endFill();
        }

        // Граница
        this.graphics.lineStyle(2, 0x3a2a1a);
        this.graphics.drawRect(0, 0, this.width, this.height);

        // Внешнее свечение (тень)
        this.graphics.lineStyle(4, 0x000000, 0.5);
        this.graphics.drawRect(-4, -4, this.width + 8, this.height + 8);

        // Внутренняя тень по краям
        this.graphics.lineStyle(2, 0x4a3a2a, 0.3);
        this.graphics.drawRect(2, 2, this.width - 4, this.height - 4);
    }
}

// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIInventory;
} else if (typeof window !== 'undefined') {
    window.UIInventory = UIInventory;
}
