/**
 * UIInventory - окно инвентаря на новой системе UI
 * Изящный дарк фентези стиль с панелью экипировки сверху
 */
class UIInventory extends UIComponent {
    constructor(character, config = {}) {
        super(config);

        this.character = character;

        // Размеры окна - будут пересчитаны динамически
        this.width = 500;
        this.height = 520;
        this.padding = 20;

        // Позиционирование по центру
        this.config.positionKey = 'inventory';

        // Параметры слотов экипировки (горизонтальное расположение сверху)
        this.equipSlotSize = 56;
        this.equipSlotGap = 10;
        this.equipSlotsX = 20; // Отступ слева для центровки
        this.equipSlotsStartY = 60; // Позиция сверху под заголовком

        // Параметры сетки инвентаря
        this.slotSize = 50;
        this.slotGap = 6;
        this.columns = 8;
        this.inventoryStartX = 20;
        this.inventoryStartY = 140; // Сдвиг вниз чтобы освободить место для слотов экипировки

        // Контейнеры
        this.gridContainer = null;
        this.equipContainer = null;
        this.inventorySlots = [];
        this.equipmentSlots = {};

        // Типы слотов экипировки (порядок важен для горизонтального расположения)
        this.equipmentSlotTypes = ['weapon', 'helmet', 'armor', 'ring', 'amulet'];

        // Названия слотов на русском
        this.slotNames = {
            'weapon': 'Оружие',
            'helmet': 'Шлем',
            'armor': 'Броня',
            'ring': 'Кольцо',
            'amulet': 'Амулет'
        };

        // Кеш иконок
        this.iconCache = new Map();
    }

    /**
     * Хук инициализации
     */
    onInit() {
        // Создаем контейнеры
        this.gridContainer = new PIXI.Container();
        this.equipContainer = new PIXI.Container();
        this.container.addChild(this.equipContainer);
        this.container.addChild(this.gridContainer);

        // Создаем заголовок
        this.renderTitle();

        // Создаем слоты экипировки
        this.createEquipmentSlots();

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
            fontSize: 24,
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

        // Разделитель под заголовком
        this.drawHeaderDivider();
    }

    /**
     * Отрисовка разделителя под заголовком
     */
    drawHeaderDivider() {
        const g = new PIXI.Graphics();

        // Основная линия под заголовком
        g.lineStyle(2, 0x3a2a1a);
        g.moveTo(this.padding, 55);
        g.lineTo(this.width - this.padding, 55);

        // Декоративная линия
        g.lineStyle(1, 0x6a5a4a, 0.5);
        g.moveTo(this.padding + 5, 58);
        g.lineTo(this.width - this.padding - 5, 58);

        // Разделитель под слотами экипировки
        g.lineStyle(1, 0x3a2a1a);
        g.moveTo(this.padding, this.equipSlotsStartY + this.equipSlotSize + 20);
        g.lineTo(this.width - this.padding, this.equipSlotsStartY + this.equipSlotSize + 20);

        this.container.addChild(g);
    }

    /**
     * Создание кнопки закрытия
     */
    createCloseButton() {
        const closeBtn = new UIButton({
            x: this.width - 90,
            y: 8,
            width: 80,
            height: 26,
            text: 'ЗАКРЫТЬ',
            fontSize: 11,
            onClick: () => this.close()
        });
        this.addChild(closeBtn);
    }

    /**
     * Создание слотов экипировки (горизонтально)
     */
    createEquipmentSlots() {
        const startX = this.equipSlotsX;
        const totalWidth = this.equipmentSlotTypes.length * this.equipSlotSize + (this.equipmentSlotTypes.length - 1) * this.equipSlotGap;
        const centeredStartX = startX + (this.width - totalWidth - startX * 2) / 2; // Центрируем горизонтально

        this.equipmentSlotTypes.forEach((slotType, index) => {
            const x = centeredStartX + index * (this.equipSlotSize + this.equipSlotGap);
            const y = this.equipSlotsStartY;

            const slot = {
                type: slotType,
                x: x,
                y: y,
                width: this.equipSlotSize,
                height: this.equipSlotSize,
                container: new PIXI.Container(),
                graphics: new PIXI.Graphics(),
                icon: null,
                item: null,
                isHovered: false
            };

            slot.container.x = slot.x;
            slot.container.y = slot.y;
            slot.container.addChild(slot.graphics);

            // Включаем интерактивность
            slot.container.eventMode = 'static';
            slot.container.cursor = 'pointer';

            // Обработчики событий
            slot.container.on('pointerover', () => {
                slot.isHovered = true;
                this.renderEquipmentSlot(slot);
                this.onEquipmentSlotHover(slot);
            });

            slot.container.on('pointerout', () => {
                slot.isHovered = false;
                this.renderEquipmentSlot(slot);
                this.hideItemTooltip();
            });

            slot.container.on('pointermove', (e) => {
                if (slot.item && slot.isHovered) {
                    const screenX = e.data.global.x;
                    const screenY = e.data.global.y;
                    this.updateItemTooltipPosition(screenX, screenY);
                }
            });

            slot.container.on('pointerdown', (e) => {
                e.stopPropagation();
                if (e.data.button === 2) {
                    this.onEquipmentSlotRightClick(slot);
                }
            });

            // Подпись под слотом
            const labelStyle = new PIXI.TextStyle({
                fontFamily: "'MedievalSharp', Georgia, serif",
                fontSize: 11,
                fill: '#8b7355',
                fontWeight: 'bold',
                dropShadow: true,
                dropShadowColor: '#000000',
                dropShadowBlur: 2,
                dropShadowDistance: 1
            });

            const label = new PIXI.Text(this.slotNames[slotType], labelStyle);
            label.anchor.set(0.5, 0);
            label.x = x + this.equipSlotSize / 2;
            label.y = y + this.equipSlotSize + 4;
            this.container.addChild(label);

            // Добавляем в контейнер и словарь
            this.equipContainer.addChild(slot.container);
            this.equipmentSlots[slotType] = slot;

            // Первоначальная отрисовка
            this.renderEquipmentSlot(slot);
        });
    }

    /**
     * Создание сетки инвентаря
     */
    createInventoryGrid() {
        const maxInventorySize = this.character.maxInventorySize || GAME_CONFIG.CHARACTER.INVENTORY_SIZE;
        const rows = Math.ceil(maxInventorySize / this.columns);

        // Вычисляем ширину сетки слотов
        const gridWidth = this.columns * this.slotSize + (this.columns - 1) * this.slotGap;
        const gridHeight = rows * this.slotSize + (rows - 1) * this.slotGap;

        // Динамически вычисляем ширину окна на основе ширины сетки
        this.width = gridWidth + this.padding * 2;

        // Центрируем сетку в окне
        const startX = this.padding;
        const startY = this.inventoryStartY;

        this.gridStartX = startX;
        this.gridStartY = startY;

        // Создаем слоты
        for (let i = 0; i < maxInventorySize; i++) {
            const col = i % this.columns;
            const row = Math.floor(i / this.columns);

            const x = startX + col * (this.slotSize + this.slotGap);
            const y = startY + row * (this.slotSize + this.slotGap);

            const slot = this.createInventorySlot(i, x, y);
            this.inventorySlots.push(slot);
            this.gridContainer.addChild(slot.container);
        }

        // Обновляем высоту окна
        this.height = startY + gridHeight + this.padding + 30;
        
        // Обновляем позицию заголовка и кнопки закрытия
        if (this.titleText) {
            this.titleText.x = this.width / 2;
        }
    }

    /**
     * Создание отдельного слота инвентаря
     */
    createInventorySlot(index, x, y) {
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
            this.renderInventorySlot(slot);
            this.onInventorySlotHover(slot);
        });

        slot.container.on('pointerout', () => {
            slot.isHovered = false;
            this.renderInventorySlot(slot);
            this.hideItemTooltip();
        });

        slot.container.on('pointermove', (e) => {
            if (slot.item && slot.isHovered) {
                const screenX = e.data.global.x;
                const screenY = e.data.global.y;
                this.updateItemTooltipPosition(screenX, screenY);
            }
        });

        slot.container.on('pointerdown', (e) => {
            e.stopPropagation();
            if (e.data.button === 2) {
                this.onInventorySlotRightClick(slot);
            } else {
                this.onInventorySlotClick(slot);
            }
        });

        // Первоначальная отрисовка
        this.renderInventorySlot(slot);

        return slot;
    }

    /**
     * Отрисовка слота экипировки
     */
    renderEquipmentSlot(slot) {
        const g = slot.graphics;
        g.clear();

        // Градиентный фон слота
        for (let i = 0; i < this.equipSlotSize; i++) {
            const t = i / (this.equipSlotSize - 1);
            const r1 = 42, g1 = 26, b1 = 26;
            const r2 = 26, g2 = 15, b2 = 15;
            const r = Math.round(r1 + (r2 - r1) * t);
            const gr = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (gr << 8) + b;
            g.beginFill(color);
            g.drawRect(0, i, this.equipSlotSize, 1);
            g.endFill();
        }

        // Внутренняя тень
        g.beginFill(0xc9b896, slot.isHovered ? 0.15 : 0.08);
        g.drawRect(0, 0, this.equipSlotSize, 1);
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
        g.lineStyle(3, borderColor);
        g.drawRoundedRect(0, 0, this.equipSlotSize, this.equipSlotSize, 4);

        // Дополнительная внешняя рамка для экипировки
        if (slot.item) {
            g.lineStyle(1, borderColor, 0.5);
            g.drawRoundedRect(-2, -2, this.equipSlotSize + 4, this.equipSlotSize + 4, 5);
        }

        // Иконка предмета
        if (slot.item) {
            this.renderSlotIcon(slot, this.equipSlotSize);
        } else {
            // Очищаем иконку если предмета нет
            this.clearSlotIcon(slot);
        }
    }

    /**
     * Отрисовка слота инвентаря
     */
    renderInventorySlot(slot) {
        const g = slot.graphics;
        g.clear();

        // Градиентный фон слота
        for (let i = 0; i < this.slotSize; i++) {
            const t = i / (this.slotSize - 1);
            const r1 = 42, g1 = 26, b1 = 26;
            const r2 = 26, g2 = 15, b2 = 15;
            const r = Math.round(r1 + (r2 - r1) * t);
            const gr = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (gr << 8) + b;
            g.beginFill(color);
            g.drawRect(0, i, this.slotSize, 1);
            g.endFill();
        }

        // Внутренняя тень
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
            this.renderSlotIcon(slot, this.slotSize);
        } else {
            // Очищаем иконку если предмета нет
            this.clearSlotIcon(slot);
        }
    }

    /**
     * Очистка иконки предмета в слоте
     */
    clearSlotIcon(slot) {
        if (slot.icon) {
            slot.container.removeChild(slot.icon);
            slot.icon = null;
        }
    }

    /**
     * Отрисовка иконки предмета в слоте
     */
    renderSlotIcon(slot, size) {
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
        icon.x = size / 2;
        icon.y = size / 2;
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

        // Фон иконки - с градиентом
        for (let i = 0; i < 32; i++) {
            const t = i / 31;
            const r1 = Math.round((color >> 16) & 0xFF);
            const g1 = Math.round((color >> 8) & 0xFF);
            const b1 = Math.round(color & 0xFF);
            const r2 = Math.round(r1 * 0.7);
            const g2 = Math.round(g1 * 0.7);
            const b2 = Math.round(b1 * 0.7);
            const r = Math.round(r1 + (r2 - r1) * t);
            const gr = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const c = (r << 16) + (gr << 8) + b;
            g.beginFill(c);
            g.drawRect(0, i, 32, 1);
            g.endFill();
        }

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
     * Обработка клика по слоту инвентаря
     */
    onInventorySlotClick(slot) {
        const item = this.character.inventory[slot.index];
        if (!item) return;

        // Экипировка предмета (левый клик)
        if (item.type && this.equipmentSlotTypes.includes(item.type)) {
            // Пытаемся надеть предмет через character.equipItem()
            const success = this.character.equipItem(item);

            if (success) {
                // Удаляем предмет из инвентаря
                this.character.inventory[slot.index] = null;

                // Обновляем UI
                this.updateDisplay();
            }
        }
    }

    /**
     * Обработка правого клика по слоту инвентаря
     */
    onInventorySlotRightClick(slot) {
        const item = this.character.inventory[slot.index];
        if (!item || !item.type) return;

        // Проверяем, есть ли такой слот экипировки
        if (this.equipmentSlotTypes.includes(item.type)) {
            // Пытаемся надеть предмет через character.equipItem()
            const success = this.character.equipItem(item);

            if (success) {
                // Удаляем предмет из инвентаря
                this.character.inventory[slot.index] = null;

                // Обновляем UI
                this.updateDisplay();
            }
        }
    }

    /**
     * Обработка правого клика по слоту экипировки
     */
    onEquipmentSlotRightClick(slot) {
        const item = this.character.equipment[slot.type];
        if (!item) return;

        // Находим свободный слот в инвентаре
        const emptySlotIndex = this.character.inventory.findIndex(s => s === null);
        if (emptySlotIndex === -1) {
            console.log('Нет места в инвентаре для предмета');
            return;
        }

        // Снимаем предмет через character.unequipItem() и добавляем в инвентарь
        const removedItem = this.character.unequipItem(slot.type);
        if (removedItem) {
            this.character.inventory[emptySlotIndex] = removedItem;

            // Обновляем UI
            this.updateDisplay();
        }
    }

    /**
     * Обработка наведения на слот экипировки
     */
    onEquipmentSlotHover(slot) {
        const item = this.character.equipment[slot.type];
        if (!item) {
            return;
        }

        // Получаем экранные координаты
        const screenX = slot.container.parent.toGlobal(slot.container).x + this.equipSlotSize / 2;
        const screenY = slot.container.parent.toGlobal(slot.container).y + this.equipSlotSize / 2;

        this.showItemTooltip(item, screenX, screenY);
    }

    /**
     * Обработка наведения на слот инвентаря
     */
    onInventorySlotHover(slot) {
        const item = this.character.inventory[slot.index];
        if (!item) {
            this.hideItemTooltip();
            return;
        }

        // Получаем экранные координаты
        const screenX = slot.container.parent.toGlobal(slot.container).x + this.slotSize / 2;
        const screenY = slot.container.parent.toGlobal(slot.container).y + this.slotSize / 2;

        this.showItemTooltip(item, screenX, screenY);
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
     * Показ тултипа
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

        // Обновляем слоты инвентаря
        for (let i = 0; i < this.inventorySlots.length; i++) {
            const slot = this.inventorySlots[i];
            const item = this.character.inventory[i];

            slot.item = item || null;
            this.renderInventorySlot(slot);
        }

        // Обновляем слоты экипировки
        for (const slotType of this.equipmentSlotTypes) {
            const slot = this.equipmentSlots[slotType];
            const item = this.character.equipment[slotType];

            slot.item = item || null;
            this.renderEquipmentSlot(slot);
        }
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
    }

    /**
     * Отрисовка декоративных уголков
     */
    drawCornerDecorations() {
        const cornerSize = 10;
        const cornerOffset = 6;

        // Верхний левый
        this.graphics.lineStyle(2, 0x6a5a4a);
        this.graphics.moveTo(cornerOffset, cornerOffset + cornerSize);
        this.graphics.lineTo(cornerOffset, cornerOffset);
        this.graphics.lineTo(cornerOffset + cornerSize, cornerOffset);

        // Верхний правый
        this.graphics.moveTo(this.width - cornerOffset - cornerSize, cornerOffset);
        this.graphics.lineTo(this.width - cornerOffset, cornerOffset);
        this.graphics.lineTo(this.width - cornerOffset, cornerOffset + cornerSize);

        // Нижний левый
        this.graphics.moveTo(cornerOffset, this.height - cornerOffset - cornerSize);
        this.graphics.lineTo(cornerOffset, this.height - cornerOffset);
        this.graphics.lineTo(cornerOffset + cornerSize, this.height - cornerOffset);

        // Нижний правый
        this.graphics.moveTo(this.width - cornerOffset - cornerSize, this.height - cornerOffset);
        this.graphics.lineTo(this.width - cornerOffset, this.height - cornerOffset);
        this.graphics.lineTo(this.width - cornerOffset, this.height - cornerOffset - cornerSize);

        // Дополнительные декоративные элементы по углам
        const dotSize = 3;
        
        // Верхний левый угол - точки
        this.graphics.beginFill(0x6a5a4a, 0.6);
        this.graphics.drawCircle(cornerOffset + 3, cornerOffset + 3, dotSize);
        this.graphics.endFill();

        // Верхний правый угол - точки
        this.graphics.beginFill(0x6a5a4a, 0.6);
        this.graphics.drawCircle(this.width - cornerOffset - 3, cornerOffset + 3, dotSize);
        this.graphics.endFill();

        // Нижний левый угол - точки
        this.graphics.beginFill(0x6a5a4a, 0.6);
        this.graphics.drawCircle(cornerOffset + 3, this.height - cornerOffset - 3, dotSize);
        this.graphics.endFill();

        // Нижний правый угол - точки
        this.graphics.beginFill(0x6a5a4a, 0.6);
        this.graphics.drawCircle(this.width - cornerOffset - 3, this.height - cornerOffset - 3, dotSize);
        this.graphics.endFill();
    }

    /**
     * Отрисовка содержимого
     */
    renderContent() {
        // Содержимое отрисовывается в отдельных контейнерах
    }

    /**
     * Конвертация hex цвета в decimal
     */
    hexToDecimal(hexColor) {
        if (typeof hexColor === 'number') return hexColor;
        if (hexColor.startsWith('#')) {
            return parseInt(hexColor.slice(1), 16);
        }
        return parseInt(hexColor, 16);
    }
}

// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIInventory;
} else if (typeof window !== 'undefined') {
    window.UIInventory = UIInventory;
}
