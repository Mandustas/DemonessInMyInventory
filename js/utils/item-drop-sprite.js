/**
 * Класс спрайта предмета для PIXI рендерера
 * Предназначен для отображения выпавших предметов на земле
 * Аутентичный dark fantasy стиль в стиле Diablo
 */

class ItemDropSprite extends PIXI.Container {
    /**
     * @param {Object} drop - Объект ItemDrop для отображения
     * @param {PIXIRenderer} pixiRenderer - Ссылка на PIXI рендерер
     */
    constructor(drop, pixiRenderer) {
        super();

        this.drop = drop;
        this.pixiRenderer = pixiRenderer;
        this.isHovered = false;

        // Размеры предмета
        this.baseWidth = drop.width;
        this.baseHeight = drop.height;

        // Цвета в стиле Diablo
        this.colors = {
            // Статичная тёмная рамка (не меняется)
            border: 0x4a3a2a,
            borderInner: 0x8b7355,
            // Тёмный фон
            background: 0x1a1414,
            backgroundHover: 0x2a1f1f,
            // Золотые угловые украшения
            corner: 0xd4af37
        };

        // Флаг последнего состояния hover для оптимизации
        this.lastHoverState = false;

        // Создаём визуальные элементы предмета
        this.createVisuals();

        // Настраиваем интерактивность
        this.setupInteraction();
    }

    /**
     * Создание визуальных элементов предмета
     */
    createVisuals() {
        const width = this.baseWidth;
        const height = this.baseHeight;

        // Создаём текстуру предмета один раз и используем Sprite вместо Graphics
        this.sprite = this.createItemTexture();
        this.sprite.anchor.set(0.5, 0.5);
        this.sprite.eventMode = 'none';
        this.addChild(this.sprite);

        // Название предмета в стиле Diablo
        this.textStyle = new PIXI.TextStyle({
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 11,
            fontWeight: 'bold',
            fill: this.drop.item.getColorByRarity(),
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 3,
            dropShadowAngle: Math.PI / 2,
            dropShadowDistance: 2,
        });

        this.textLabel = new PIXI.Text(this.drop.item.name, this.textStyle);
        this.textLabel.anchor.set(0.5, 0.5);
        this.textLabel.eventMode = 'none';
        this.textLabel.y = -2; // Чуть выше центра
        this.addChild(this.textLabel);
    }

    /**
     * Создание текстуры предмета с кэшированием
     */
    createItemTexture() {
        const width = this.baseWidth;
        const height = this.baseHeight;
        const graphics = new PIXI.Graphics();

        // Фон
        const bgColor = this.colors.background;
        const bgAlpha = 0.5;
        graphics.beginFill(bgColor, bgAlpha);
        graphics.drawRect(-width / 2, -height / 2, width, height);
        graphics.endFill();

        // Рамка
        graphics.lineStyle(2, this.colors.border, 1);
        graphics.drawRect(-width / 2, -height / 2, width, height);
        graphics.lineStyle(1, this.colors.borderInner, 0.6);
        graphics.drawRect(-width / 2 + 3, -height / 2 + 3, width - 6, height - 6);

        // Угловые украшения
        this.drawCornersStatic(graphics, width, height);

        // Генерируем текстуру
        const texture = this.pixiRenderer.app.renderer.generateTexture(graphics);
        graphics.destroy();

        return new PIXI.Sprite(texture);
    }

    /**
     * Отрисовка угловых украшений для текстуры
     */
    drawCornersStatic(graphics, width, height) {
        const cornerSize = 5;
        const color = this.colors.corner;
        const halfW = width / 2;
        const halfH = height / 2;

        graphics.beginFill(color, 0.7);

        // Верхний левый угол
        graphics.moveTo(-halfW, -halfH + cornerSize);
        graphics.lineTo(-halfW, -halfH);
        graphics.lineTo(-halfW + cornerSize, -halfH);

        // Верхний правый угол
        graphics.moveTo(halfW, -halfH + cornerSize);
        graphics.lineTo(halfW, -halfH);
        graphics.lineTo(halfW - cornerSize, -halfH);

        // Нижний правый угол
        graphics.moveTo(halfW, halfH - cornerSize);
        graphics.lineTo(halfW, halfH);
        graphics.lineTo(halfW - cornerSize, halfH);

        // Нижний левый угол
        graphics.moveTo(-halfW, halfH - cornerSize);
        graphics.lineTo(-halfW, halfH);
        graphics.lineTo(-halfW + cornerSize, halfH);

        graphics.endFill();
    }

    /**
     * Настройка интерактивности
     */
    setupInteraction() {
        // Включаем интерактивность для обработки наведений
        // Для PIXI v7 используем eventMode
        this.eventMode = 'static';
        this.cursor = 'pointer';

        // Обработчики событий PIXI
        this.on('pointerenter', () => this.onHoverEnter());
        this.on('pointerleave', () => this.onHoverLeave());
    }

    /**
     * Обработчик наведения курсора
     */
    onHoverEnter() {
        this.isHovered = true;
        this.updateVisuals();
    }

    /**
     * Обработчик ухода курсора
     */
    onHoverLeave() {
        this.isHovered = false;
        this.updateVisuals();
    }

    /**
     * Обновление визуального состояния
     */
    updateVisuals() {
        // Оптимизация: обновляем только при изменении hover состояния
        if (this.lastHoverState === this.isHovered) {
            return;
        }

        this.lastHoverState = this.isHovered;

        // Проверяем, что спрайт и предмет существуют
        if (!this.sprite || !this.drop || !this.drop.item) {
            return;
        }

        // Уничтожаем старую текстуру и создаём новую с обновлённым фоном
        const oldTexture = this.sprite.texture;

        const width = this.baseWidth;
        const height = this.baseHeight;
        const graphics = new PIXI.Graphics();

        // Фон (меняет прозрачность при наведении)
        const bgColor = this.isHovered ? this.colors.backgroundHover : this.colors.background;
        const bgAlpha = this.isHovered ? 0.7 : 0.5;
        graphics.beginFill(bgColor, bgAlpha);
        graphics.drawRect(-width / 2, -height / 2, width, height);
        graphics.endFill();

        // Рамка (статичная)
        graphics.lineStyle(2, this.colors.border, 1);
        graphics.drawRect(-width / 2, -height / 2, width, height);
        graphics.lineStyle(1, this.colors.borderInner, 0.6);
        graphics.drawRect(-width / 2 + 3, -height / 2 + 3, width - 6, height - 6);

        // Угловые украшения
        this.drawCornersStatic(graphics, width, height);

        // Генерируем новую текстуру
        const newTexture = this.pixiRenderer.app.renderer.generateTexture(graphics);
        graphics.destroy();

        // Применяем новую текстуру
        this.sprite.texture = newTexture;

        // Уничтожаем старую текстуру для освобождения памяти
        if (oldTexture && oldTexture !== PIXI.Texture.EMPTY) {
            oldTexture.destroy(true);
        }
    }

    /**
     * Обновление позиции спрайта на экране
     * @param {number} worldX - Мировая координата X
     * @param {number} worldY - Мировая координата Y
     * @param {number} zoom - Текущий зум камеры
     */
    updatePosition(worldX, worldY, zoom) {
        // Позиционируем в мировых координатах
        // mainContainer уже имеет смещение камеры и масштабирование,
        // поэтому не нужно масштабировать спрайт отдельно
        this.x = worldX;
        this.y = worldY;

        // НЕ масштабируем спрайт - mainContainer.scale уже применён
        // this.scale.set(zoom);

        // hitArea задаётся в локальных координатах спрайта (до масштабирования)
        this.hitArea = new PIXI.Rectangle(
            -this.baseWidth / 2,
            -this.baseHeight / 2,
            this.baseWidth,
            this.baseHeight
        );
    }

    /**
     * Обновление анимации падения
     */
    updateAnimation() {
        if (this.drop.fallProgress < 1) {
            this.drop.fallProgress = Math.min(1, this.drop.fallProgress + 0.1);
            const currentY = this.drop.fallY + (this.drop.targetY - this.drop.fallY) * this.drop.fallProgress;
            // Анимация будет применена в updatePosition через screenY
        }
    }

    /**
     * Преобразование HEX цвета в десятичное число
     * @param {string} hex - HEX цвет (например, '#ff0000')
     * @returns {number} - Десятичное представление цвета
     */
    hexToDecimal(hex) {
        if (!hex) return 0xFFFFFF;
        return parseInt(hex.replace('#', '0x'));
    }

    /**
     * Очистка и уничтожение спрайта
     */
    destroy() {
        if (this.sprite) {
            // Уничтожаем текстуру для освобождения памяти
            if (this.sprite.texture && this.sprite.texture !== PIXI.Texture.EMPTY) {
                this.sprite.texture.destroy(true);
            }
            this.sprite.destroy();
            this.sprite = null;
        }
        if (this.textLabel) {
            this.textLabel.destroy();
            this.textLabel = null;
        }
        this.drop = null;
        this.pixiRenderer = null;
        super.destroy();
    }

    /**
     * Сброс спрайта для возврата в пул (без уничтожения)
     */
    reset() {
        this.drop = null;
        this.isHovered = false;
        this.visible = false;
    }

    /**
     * Восстановление спрайта из пула с новым предметом
     * @param {ItemDrop} drop - новый предмет
     */
    reuse(drop) {
        this.drop = drop;
        this.isHovered = false;
        this.lastHoverState = false;
        this.visible = true;

        // Обновляем текст и его цвет для нового предмета
        if (this.textLabel && drop.item) {
            this.textLabel.text = drop.item.name;
            const textColor = drop.item.getColorByRarity();
            this.textStyle.fill = textColor;
            this.textLabel.style = this.textStyle;
        }

        // Пересоздаём текстуру для нового предмета
        this.refreshTexture();
    }

    /**
     * Пересоздание текстуры (для reuse)
     */
    refreshTexture() {
        if (!this.sprite || !this.drop || !this.drop.item) return;

        const oldTexture = this.sprite.texture;

        const width = this.baseWidth;
        const height = this.baseHeight;
        const graphics = new PIXI.Graphics();

        // Фон
        const bgColor = this.colors.background;
        const bgAlpha = 0.5;
        graphics.beginFill(bgColor, bgAlpha);
        graphics.drawRect(-width / 2, -height / 2, width, height);
        graphics.endFill();

        // Рамка
        graphics.lineStyle(2, this.colors.border, 1);
        graphics.drawRect(-width / 2, -height / 2, width, height);
        graphics.lineStyle(1, this.colors.borderInner, 0.6);
        graphics.drawRect(-width / 2 + 3, -height / 2 + 3, width - 6, height - 6);

        // Угловые украшения
        this.drawCornersStatic(graphics, width, height);

        // Генерируем новую текстуру
        const newTexture = this.pixiRenderer.app.renderer.generateTexture(graphics);
        graphics.destroy();

        this.sprite.texture = newTexture;

        // Уничтожаем старую текстуру
        if (oldTexture && oldTexture !== PIXI.Texture.EMPTY) {
            oldTexture.destroy(true);
        }
    }
}

// Делаем класс глобально доступным
if (typeof window !== 'undefined') {
    window.ItemDropSprite = ItemDropSprite;
}
