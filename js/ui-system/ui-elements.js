/**
 * Базовые UI элементы
 * UIButton, UILabel, UIImage, UIProgressBar, UISlot, UITooltip, UICircularBar, UIGrid
 */

/**
 * UIButton - кнопка с состояниями
 * Соответствует стилю .fantasy-btn из index.html
 */
class UIButton extends UIComponent {
    constructor(config = {}) {
        super(config);

        this.text = config.text || '';
        this.fontSize = config.fontSize || UIConfig.fonts.sizes.md;
        this.fontColor = config.fontColor || UIConfig.colors.text.primary;

        // Состояния кнопки
        this.state = 'normal'; // 'normal', 'hover', 'active', 'disabled'
        this.enabled = config.enabled !== false;

        // Обработчики событий
        this.onClick = config.onClick || null;
        this.onHover = config.onHover || null;
        
        // Для тени
        this.glowFilter = null;
    }

    /**
     * Хук инициализации
     */
    onInit() {
        // Создаем текстовую метку с text-shadow (используем dropShadow в PIXI)
        this.textSprite = this.uiRenderer.createText(this.text, {
            fontFamily: UIConfig.fonts.family,
            fontSize: this.fontSize,
            fill: this.hexToDecimal(this.fontColor),
            align: 'center',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 2,
            dropShadowDistance: 1,
            dropShadowAngle: Math.PI / 4
        });
        this.textSprite.anchor.set(0.5);
        this.container.addChild(this.textSprite);

        // Включаем интерактивность
        this.container.eventMode = 'static';
        this.container.cursor = this.enabled ? 'pointer' : 'default';

        // Настраиваем обработчики событий
        this.setupInteractions();

        this.updateState();
    }
    
    /**
     * Настройка интерактивности
     */
    setupInteractions() {
        this.container.on('pointerdown', () => {
            if (!this.enabled) return;
            this.state = 'active';
            this.updateState();
        });
        
        this.container.on('pointerup', () => {
            if (!this.enabled) return;
            this.state = 'hover';
            this.updateState();
            if (this.onClick) this.onClick();
        });
        
        this.container.on('pointerupoutside', () => {
            if (!this.enabled) return;
            this.state = 'normal';
            this.updateState();
        });
        
        this.container.on('pointerover', () => {
            if (!this.enabled) return;
            this.state = 'hover';
            this.updateState();
            if (this.onHover) this.onHover();
        });
        
        this.container.on('pointerout', () => {
            if (!this.enabled) return;
            this.state = 'normal';
            this.updateState();
        });
    }
    
    /**
     * Обновление состояния кнопки
     */
    updateState() {
        const colors = UIConfig.colors.button[this.state] || UIConfig.colors.button.normal;

        // Обновляем фон с градиентом (полный 3-цветный градиент как в CSS)
        this.backgroundStyle = {
            gradient: {
                type: 'vertical',
                colors: colors.bgGradient || UIConfig.gradients.button.colors
            }
        };

        // Обновляем границу
        this.borderStyle = {
            color: colors.border,
            width: 2,
            radius: 3
        };

        // Обновляем текст
        if (this.textSprite) {
            this.textSprite.style.fill = this.hexToDecimal(colors.text);
        }

        // Обновляем курсор
        if (this.container) {
            this.container.cursor = this.enabled ? 'pointer' : 'default';
        }

        this.markForUpdate();
    }
    
    /**
     * Отрисовка содержимого
     */
    renderContent() {
        if (!this.textSprite) return;
        
        // Центрируем текст
        this.textSprite.x = this.width / 2;
        this.textSprite.y = this.height / 2;
    }
    
    /**
     * Установка текста
     */
    setText(text) {
        this.text = text;
        if (this.textSprite) {
            this.textSprite.text = text;
        }
    }
    
    /**
     * Установка состояния enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.state = enabled ? 'normal' : 'disabled';
        this.updateState();
    }
}

/**
 * UILabel - текстовая метка
 * text-shadow: 1px 1px 2px #000 (из CSS)
 */
class UILabel extends UIComponent {
    constructor(config = {}) {
        super(config);

        this.text = config.text || '';
        this.fontSize = config.fontSize || UIConfig.fonts.sizes.md;
        this.fontColor = config.fontColor || UIConfig.colors.text.primary;
        this.align = config.align || 'left'; // 'left', 'center', 'right'
        this.wordWrap = config.wordWrap || false;
        this.wordWrapWidth = config.wordWrapWidth || 200;
        this.isTitle = config.isTitle || false; // Для заголовков с большей тенью
    }

    /**
     * Хук инициализации
     */
    onInit() {
        this.textSprite = this.uiRenderer.createText(this.text, {
            fontFamily: UIConfig.fonts.family,
            fontSize: this.fontSize,
            fill: this.hexToDecimal(this.fontColor),
            align: this.align,
            wordWrap: this.wordWrap,
            wordWrapWidth: this.wordWrapWidth
        }, true, this.isTitle);

        this.container.addChild(this.textSprite);
        this.updateTextPosition();
    }
    
    /**
     * Обновление позиции текста
     */
    updateTextPosition() {
        if (!this.textSprite) return;
        
        if (this.align === 'center') {
            this.textSprite.anchor.x = 0.5;
            this.textSprite.x = this.width / 2;
        } else if (this.align === 'right') {
            this.textSprite.anchor.x = 1;
            this.textSprite.x = this.width;
        } else {
            this.textSprite.anchor.x = 0;
            this.textSprite.x = 0;
        }
        
        this.textSprite.y = this.height / 2 - this.textSprite.height / 2;
    }
    
    /**
     * Установка текста
     */
    setText(text) {
        this.text = text;
        if (this.textSprite) {
            this.textSprite.text = text;
        }
    }
    
    /**
     * Установка цвета
     */
    setColor(color) {
        this.fontColor = color;
        if (this.textSprite) {
            this.textSprite.style.fill = this.hexToDecimal(color);
        }
    }
}

/**
 * UIImage - изображение/иконка
 */
class UIImage extends UIComponent {
    constructor(config = {}) {
        super(config);
        
        this.texture = config.texture || null;
        this.tint = config.tint || null;
        this.scale = config.scale || 1;
    }
    
    /**
     * Хук инициализации
     */
    onInit() {
        if (this.texture) {
            this.sprite = new PIXI.Sprite(this.texture);
            this.sprite.anchor.set(0.5);
            this.sprite.scale.set(this.scale);
            
            if (this.tint) {
                this.sprite.tint = this.hexToDecimal(this.tint);
            }
            
            this.container.addChild(this.sprite);
        }
    }
    
    /**
     * Отрисовка содержимого
     */
    renderContent() {
        if (this.sprite) {
            this.sprite.x = this.width / 2;
            this.sprite.y = this.height / 2;
        }
    }
    
    /**
     * Установка текстуры
     */
    setTexture(texture) {
        this.texture = texture;
        if (this.sprite) {
            this.sprite.texture = texture;
        } else if (this.container) {
            this.sprite = new PIXI.Sprite(texture);
            this.sprite.anchor.set(0.5);
            this.sprite.scale.set(this.scale);
            this.container.addChild(this.sprite);
        }
    }
    
    /**
     * Установка tint
     */
    setTint(tint) {
        this.tint = tint;
        if (this.sprite) {
            this.sprite.tint = this.hexToDecimal(tint);
        }
    }
}

/**
 * UIProgressBar - прогресс-бар
 */
class UIProgressBar extends UIComponent {
    constructor(config = {}) {
        super(config);
        
        this.value = config.value || 0; // 0-1
        this.minValue = config.minValue || 0;
        this.maxValue = config.maxValue || 1;
        
        // Цвета
        this.fillColor = config.fillColor || UIConfig.colors.progress.experience.low;
        this.backgroundColor = config.backgroundColor || UIConfig.colors.background.dark;
        this.borderColor = config.borderColor || UIConfig.colors.border.dark;
        
        // Текст
        this.showText = config.showText !== false;
        this.textColor = config.textColor || UIConfig.colors.text.primary;
        this.fontSize = config.fontSize || UIConfig.fonts.sizes.xs;
        
        // Скругление
        this.borderRadius = config.borderRadius || 2;
    }
    
    /**
     * Хук инициализации
     */
    onInit() {
        // Создаем текст для отображения процентов
        if (this.showText) {
            this.textSprite = new PIXI.Text('', {
                fontFamily: UIConfig.fonts.family,
                fontSize: this.fontSize,
                fill: this.hexToDecimal(this.textColor),
                align: 'center'
            });
            this.textSprite.anchor.set(0.5);
            this.container.addChild(this.textSprite);
        }
    }
    
    /**
     * Отрисовка прогресс-бара
     */
    renderContent() {
        if (!this.graphics) return;
        
        const borderWidth = 2;
        const innerWidth = this.width - borderWidth * 2;
        const innerHeight = this.height - borderWidth * 2;
        
        // Фоновый прямоугольник
        this.graphics.beginFill(this.hexToDecimal(this.backgroundColor));
        this.graphics.drawRoundedRect(borderWidth, borderWidth, innerWidth, innerHeight, this.borderRadius);
        this.graphics.endFill();
        
        // Прогресс
        const normalizedValue = (this.value - this.minValue) / (this.maxValue - this.minValue);
        const fillWidth = innerWidth * Math.max(0, Math.min(1, normalizedValue));
        
        if (fillWidth > 0) {
            this.graphics.beginFill(this.hexToDecimal(this.fillColor));
            this.graphics.drawRoundedRect(borderWidth, borderWidth, fillWidth, innerHeight, this.borderRadius);
            this.graphics.endFill();
        }
        
        // Текст
        if (this.textSprite) {
            const percent = ((this.value - this.minValue) / (this.maxValue - this.minValue) * 100).toFixed(1);
            this.textSprite.text = `${percent}%`;
            this.textSprite.x = this.width / 2;
            this.textSprite.y = this.height / 2;
        }
    }
    
    /**
     * Установка значения
     */
    setValue(value) {
        this.value = Math.max(this.minValue, Math.min(this.maxValue, value));
        this.markForUpdate();
    }
    
    /**
     * Установка цвета заполнения
     */
    setFillColor(color) {
        this.fillColor = color;
        this.markForUpdate();
    }
}

/**
 * UISlot - слот для предметов/навыков
 */
class UISlot extends UIComponent {
    constructor(config = {}) {
        super(config);

        this.item = config.item || null;
        this.icon = config.icon || null;
        this.number = config.number || null; // Номер слота (для панели навыков)

        // Цвета
        this.backgroundColor = config.backgroundColor || UIConfig.colors.background.light;
        this.borderColor = config.borderColor || UIConfig.colors.border.dark;
        this.highlightColor = config.highlightColor || UIConfig.colors.border.light;

        // Обработчики
        this.onClick = config.onClick || null;
        this.onRightClick = config.onRightClick || null;
        this.onHover = config.onHover || null;
        this.onPointerOut = config.onPointerOut || null;
    }
    
    /**
     * Хук инициализации
     */
    onInit() {
        // Создаем контейнер для иконки
        this.iconContainer = new PIXI.Container();
        this.container.addChild(this.iconContainer);

        // Номер слота с text-shadow
        if (this.number !== null) {
            this.numberLabel = this.uiRenderer.createText(this.number.toString(), {
                fontFamily: UIConfig.fonts.family,
                fontSize: UIConfig.fonts.sizes.xs,
                fill: this.hexToDecimal(UIConfig.colors.text.primary),
                align: 'left'
            });
            this.numberLabel.anchor.set(0, 1);
            this.container.addChild(this.numberLabel);
        }

        // Включаем интерактивность
        this.container.eventMode = 'static';
        this.container.cursor = 'pointer';

        this.setupInteractions();
    }
    
    /**
     * Настройка интерактивности
     */
    setupInteractions() {
        this.container.on('pointerdown', (e) => {
            if (e.data.button === 2 && this.onRightClick) {
                this.onRightClick(this);
            } else if (this.onClick) {
                this.onClick(this);
            }
        });

        this.container.on('pointerover', () => {
            this.isHovered = true;
            this.markForUpdate();
            if (this.onHover) this.onHover(this);
        });

        this.container.on('pointerout', () => {
            this.isHovered = false;
            this.markForUpdate();
            if (this.onPointerOut) this.onPointerOut(this);
        });

        // Блокируем контекстное меню
        this.container.on('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    /**
     * Отрисовка слота
     * Градиент: linear-gradient(to bottom, #2a1a1a 0%, #1a0f0f 100%)
     * box-shadow: inset 0 1px 0 rgba(201,184,150,0.1)
     */
    renderContent() {
        if (!this.graphics) return;

        const borderColor = this.isHovered ? this.highlightColor : this.borderColor;

        // Градиентный фон
        const height = this.height;
        for (let i = 0; i < height; i++) {
            const t = i / (height - 1);
            const r1 = 42, g1 = 26, b1 = 26; // #2a1a1a
            const r2 = 26, g2 = 15, b2 = 15; // #1a0f0f
            const r = Math.round(r1 + (r2 - r1) * t);
            const g = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (g << 8) + b;
            this.graphics.beginFill(color);
            this.graphics.drawRect(0, i, this.width, 1);
            this.graphics.endFill();
        }

        // Внутренняя тень (inset 0 1px 0 rgba(201,184,150,0.1))
        this.graphics.beginFill(0xc9b896, 0.1);
        this.graphics.drawRect(0, 0, this.width, 1);
        this.graphics.endFill();

        // Граница
        this.graphics.lineStyle(2, this.hexToDecimal(borderColor));
        this.graphics.drawRoundedRect(0, 0, this.width, this.height, 3);

        // Номер слота
        if (this.numberLabel) {
            this.numberLabel.x = 2;
            this.numberLabel.y = this.height - 2;
        }

        // Иконка
        if (this.icon) {
            if (!this.iconSprite) {
                this.iconSprite = new PIXI.Sprite(this.icon);
                this.iconSprite.anchor.set(0.5);
                this.iconContainer.addChild(this.iconSprite);
            }
            this.iconSprite.x = this.width / 2;
            this.iconSprite.y = this.height / 2;
        }
    }
    
    /**
     * Установка предмета
     */
    setItem(item) {
        this.item = item;
        this.markForUpdate();
    }
    
    /**
     * Установка иконки
     */
    setIcon(texture) {
        this.icon = texture;
        if (this.iconSprite) {
            this.iconSprite.texture = texture;
        }
        this.markForUpdate();
    }
    
    /**
     * Очистка слота
     */
    clear() {
        this.item = null;
        this.icon = null;
        if (this.iconSprite) {
            this.iconSprite.destroy();
            this.iconSprite = null;
        }
        this.markForUpdate();
    }
}

/**
 * UITooltip - всплывающая подсказка
 * text-shadow: 1px 1px 2px #000
 */
class UITooltip extends UIComponent {
    constructor(config = {}) {
        super(config);

        this.title = config.title || '';
        this.description = config.description || '';
        this.maxWidth = config.maxWidth || UIConfig.components.tooltip.maxWidth;

        // Стили
        this.backgroundColor = config.backgroundColor || UIConfig.colors.background.medium;
        this.borderColor = config.borderColor || UIConfig.colors.border.medium;
        this.titleColor = config.titleColor || UIConfig.colors.text.gold;
        this.descriptionColor = config.descriptionColor || UIConfig.colors.text.secondary;
    }

    /**
     * Хук инициализации
     */
    onInit() {
        this.container.zIndex = UIConfig.zIndices.tooltips;
    }

    /**
     * Отрисовка тултипа
     * Градиент: linear-gradient(to bottom, #1a1414 0%, #0d0a0a 100%)
     */
    renderContent() {
        if (!this.graphics) return;

        const padding = UIConfig.components.tooltip.padding;

        // Градиентный фон
        for (let i = 0; i < this.height; i++) {
            const t = i / (this.height - 1);
            const r1 = 26, g1 = 20, b1 = 20; // #1a1414
            const r2 = 13, g2 = 10, b2 = 10; // #0d0a0a
            const r = Math.round(r1 + (r2 - r1) * t);
            const g = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (g << 8) + b;
            this.graphics.beginFill(color, 0.95);
            this.graphics.drawRect(0, i, this.width, 1);
            this.graphics.endFill();
        }

        // Граница
        this.graphics.lineStyle(2, this.hexToDecimal(this.borderColor));
        this.graphics.drawRoundedRect(0, 0, this.width, this.height, 3);

        // Заголовок с text-shadow
        if (this.title && !this.titleSprite) {
            this.titleSprite = this.uiRenderer.createText(this.title, {
                fontFamily: UIConfig.fonts.family,
                fontSize: UIConfig.fonts.sizes.md,
                fill: this.hexToDecimal(this.titleColor),
                fontWeight: 'bold',
                wordWrap: true,
                wordWrapWidth: this.maxWidth - padding * 2
            }, true, false);
            this.titleSprite.anchor.set(0, 0);
            this.container.addChild(this.titleSprite);
        }

        // Описание с text-shadow
        if (this.description && !this.descSprite) {
            this.descSprite = this.uiRenderer.createText(this.description, {
                fontFamily: UIConfig.fonts.family,
                fontSize: UIConfig.fonts.sizes.xs,
                fill: this.hexToDecimal(this.descriptionColor),
                wordWrap: true,
                wordWrapWidth: this.maxWidth - padding * 2
            }, true, false);
            this.descSprite.anchor.set(0, 0);
            this.container.addChild(this.descSprite);
        }

        // Позиционирование текста
        if (this.titleSprite) {
            this.titleSprite.x = padding;
            this.titleSprite.y = padding;
        }

        if (this.descSprite) {
            this.descSprite.x = padding;
            this.descSprite.y = padding + (this.titleSprite ? this.titleSprite.height + 5 : 0);
        }
    }
    
    /**
     * Установка содержимого
     */
    setContent(title, description) {
        this.title = title;
        this.description = description;
        
        // Обновляем спрайты текста
        if (this.titleSprite) {
            this.titleSprite.text = title;
        }
        if (this.descSprite) {
            this.descSprite.text = description;
        }
        
        // Пересчитываем размер
        this.calculateSize();
        this.markForUpdate();
    }
    
    /**
     * Вычисление размера на основе содержимого
     */
    calculateSize() {
        const padding = UIConfig.components.tooltip.padding * 2;
        
        // Примерная высота текста
        let height = padding;
        
        if (this.title) {
            height += UIConfig.fonts.sizes.md + 5;
        }
        
        if (this.description) {
            // Примерный расчет высоты описания
            const lineHeight = UIConfig.fonts.sizes.xs * 1.3;
            const charsPerLine = Math.floor(this.maxWidth / (UIConfig.fonts.sizes.xs * 0.6));
            const lines = Math.ceil(this.description.length / charsPerLine);
            height += lines * lineHeight;
        }
        
        this.height = Math.max(40, height);
        this.width = this.maxWidth;
    }
}

/**
 * UICircularBar - круглый прогресс-бар (для health/mana орбов)
 */
class UICircularBar extends UIComponent {
    constructor(config = {}) {
        super(config);
        
        this.value = config.value || 1; // 0-1
        this.radius = config.radius || UIConfig.components.circularBar.radius;
        
        // Цвета
        this.fillColor = config.fillColor || UIConfig.colors.progress.health;
        this.backgroundColor = config.backgroundColor || '#1a1a1a';
        this.borderColor = config.borderColor || '#3a2a1a';
        
        // SVG для кругового прогресса
        this.circleGraphics = null;
    }
    
    /**
     * Хук инициализации
     */
    onInit() {
        // Создаем графику для кругов
        this.circleGraphics = new PIXI.Graphics();
        this.container.addChild(this.circleGraphics);
    }
    
    /**
     * Отрисовка круглого бара
     */
    renderContent() {
        if (!this.circleGraphics) return;
        
        this.circleGraphics.clear();
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        // Фоновый круг
        this.circleGraphics.lineStyle(4, this.hexToDecimal(this.backgroundColor));
        this.circleGraphics.drawCircle(centerX, centerY, this.radius);
        
        // Прогресс круг
        const circumference = 2 * Math.PI * this.radius;
        const offset = circumference * (1 - Math.max(0, Math.min(1, this.value)));
        
        this.circleGraphics.lineStyle(4, this.hexToDecimal(this.fillColor), 1, 1);
        this.circleGraphics.alpha = 1;
        
        // Рисуем дугу
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (circumference - offset) / this.radius;
        
        this.circleGraphics.moveTo(centerX + Math.cos(startAngle) * this.radius, centerY + Math.sin(startAngle) * this.radius);
        
        for (let angle = startAngle; angle <= endAngle; angle += 0.1) {
            this.circleGraphics.lineTo(centerX + Math.cos(angle) * this.radius, centerY + Math.sin(angle) * this.radius);
        }
        
        this.circleGraphics.lineStyle(0);
    }
    
    /**
     * Установка значения
     */
    setValue(value) {
        this.value = Math.max(0, Math.min(1, value));
        this.markForUpdate();
    }

    /**
     * Установка цвета
     */
    setFillColor(color) {
        this.fillColor = color;
        this.markForUpdate();
    }

    /**
     * Установка размеров
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.markForUpdate();
    }
}

/**
 * UIGrid - сетка для элементов
 */
class UIGrid extends UIComponent {
    constructor(config = {}) {
        super(config);
        
        this.columns = config.columns || UIConfig.components.grid.defaultColumns;
        this.rows = config.rows || 0; // 0 = авто
        this.gap = config.gap || UIConfig.components.grid.slotGap;
        this.slotSize = config.slotSize || UIConfig.components.slot.size;
        
        // Ячейки
        this.slots = [];
        this.slotConfig = config.slotConfig || {};
    }
    
    /**
     * Хук инициализации
     */
    onInit() {
        this.updateGridSize();
    }
    
    /**
     * Обновление размера сетки
     */
    updateGridSize() {
        if (this.rows === 0) {
            // Авто-расчет количества рядов
            const totalSlots = this.slots.length;
            this.rows = Math.ceil(totalSlots / this.columns);
        }
        
        // Вычисляем общий размер
        const totalWidth = this.columns * this.slotSize + (this.columns - 1) * this.gap;
        const totalHeight = this.rows * this.slotSize + (this.rows - 1) * this.gap;
        
        this.width = Math.max(this.width, totalWidth);
        this.height = Math.max(this.height, totalHeight);
    }
    
    /**
     * Добавление слота
     * @param {Object} item - данные для слота
     * @returns {UISlot}
     */
    addSlot(item = null) {
        const index = this.slots.length;
        const col = index % this.columns;
        const row = Math.floor(index / this.columns);
        
        const x = col * (this.slotSize + this.gap);
        const y = row * (this.slotSize + this.gap);
        
        const slot = new UISlot({
            ...this.slotConfig,
            x: x,
            y: y,
            width: this.slotSize,
            height: this.slotSize,
            item: item
        });
        
        this.addChild(slot);
        this.slots.push(slot);
        
        if (this.rows === 0) {
            this.updateGridSize();
        }
        
        return slot;
    }
    
    /**
     * Получение слота по индексу
     */
    getSlot(index) {
        return this.slots[index];
    }
    
    /**
     * Установка данных слота
     */
    setSlotData(index, item) {
        const slot = this.slots[index];
        if (slot) {
            slot.setItem(item);
        }
    }
    
    /**
     * Очистка всех слотов
     */
    clear() {
        for (const slot of this.slots) {
            slot.clear();
        }
    }
    
    /**
     * Обновление содержимого всех слотов
     */
    updateSlots(items = []) {
        this.clear();
        
        for (let i = 0; i < Math.max(this.slots.length, items.length); i++) {
            if (i < this.slots.length) {
                this.slots[i].setItem(items[i] || null);
            } else if (items[i]) {
                this.addSlot(items[i]);
            }
        }
    }
}

// Экспортируем классы
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UIButton,
        UILabel,
        UIImage,
        UIProgressBar,
        UISlot,
        UITooltip,
        UICircularBar,
        UIGrid
    };
} else if (typeof window !== 'undefined') {
    window.UIButton = UIButton;
    window.UILabel = UILabel;
    window.UIImage = UIImage;
    window.UIProgressBar = UIProgressBar;
    window.UISlot = UISlot;
    window.UITooltip = UITooltip;
    window.UICircularBar = UICircularBar;
    window.UIGrid = UIGrid;
}
