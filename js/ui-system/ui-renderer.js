/**
 * UIRenderer - рендерер для UI системы на PIXI
 * Предоставляет утилиты для создания текстур, управления спрайтами и анимациями
 * Соответствует стилям из index.html и ui-components.js
 */
class UIRenderer {
    constructor(pixiRenderer) {
        this.pixiRenderer = pixiRenderer;
        this.app = pixiRenderer.app;

        // Ссылка на UIManager (устанавливается из UIManager)
        this.uiManager = null;

        // Кэш текстур
        this.textureCache = new Map();

        // Кэш шрифтов
        this.fontCache = new Map();

        // Пул спрайтов для переиспользования
        this.spritePool = [];

        // Анимации
        this.animations = new Map();

        // Текстуры для UI элементов (создаются один раз)
        this.uiTextures = new Map();
    }

    /**
     * Инициализация рендерера
     */
    init() {
        this.generateUITextures();
    }
    
    /**
     * Генерация базовых текстур для UI
     */
    generateUITextures() {
        // Текстура для фона окон (градиент #1a1414 -> #0d0a0a)
        this.uiTextures.set('windowBackground', this.createWindowBackgroundTexture());

        // Текстура для границы окон
        this.uiTextures.set('windowBorder', this.createWindowBorderTexture());

        // Текстура для кнопок
        this.uiTextures.set('buttonNormal', this.createButtonTexture('normal'));
        this.uiTextures.set('buttonHover', this.createButtonTexture('hover'));
        this.uiTextures.set('buttonActive', this.createButtonTexture('active'));
        this.uiTextures.set('buttonDisabled', this.createButtonTexture('disabled'));

        // Текстура для слотов (градиент #2a1a1a -> #1a0f0f)
        this.uiTextures.set('slotBackground', this.createSlotTexture());
    }

    /**
     * Создание текстуры фона окна
     * Градиент: linear-gradient(to bottom, #1a1414 0%, #0d0a0a 100%)
     */
    createWindowBackgroundTexture() {
        const graphics = new PIXI.Graphics();
        const height = 100;
        
        // Рисуем вертикальный градиент
        for (let i = 0; i < height; i++) {
            const t = i / (height - 1);
            // Интерполяция от #1a1414 к #0d0a0a
            const r1 = 26, g1 = 20, b1 = 20;
            const r2 = 13, g2 = 10, b2 = 10;
            const r = Math.round(r1 + (r2 - r1) * t);
            const g = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (g << 8) + b;
            graphics.beginFill(color);
            graphics.drawRect(0, i, 4, 1);
            graphics.endFill();
        }

        return this.app.renderer.generateTexture(graphics);
    }
    
    /**
     * Создание текстуры границы окна
     */
    createWindowBorderTexture() {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(2, 0x3a2a1a);
        graphics.drawRect(0, 0, 4, 4);
        
        return this.app.renderer.generateTexture(graphics);
    }
    
    /**
     * Создание текстуры кнопки
     * Градиент: linear-gradient(to bottom, #2a1a1a 0%, #1a0f0f 50%, #0d0808 100%)
     * box-shadow: 0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,184,150,0.1)
     */
    createButtonTexture(state) {
        const colors = UIConfig.colors.button[state] || UIConfig.colors.button.normal;
        const gradient = colors.bgGradient || [colors.bg, colors.bg, colors.bg];

        const graphics = new PIXI.Graphics();
        const width = 100;
        const height = 30;

        // Градиентный фон
        for (let i = 0; i < height; i++) {
            const t = i / (height - 1);
            // Интерполяция между цветами градиента
            let color;
            if (gradient.length >= 3) {
                // Трехцветный градиент
                const r1 = parseInt(gradient[0].slice(1, 3), 16);
                const g1 = parseInt(gradient[0].slice(3, 5), 16);
                const b1 = parseInt(gradient[0].slice(5, 7), 16);
                const r2 = parseInt(gradient[1].slice(1, 3), 16);
                const g2 = parseInt(gradient[1].slice(3, 5), 16);
                const b2 = parseInt(gradient[1].slice(5, 7), 16);
                const r3 = parseInt(gradient[2].slice(1, 3), 16);
                const g3 = parseInt(gradient[2].slice(3, 5), 16);
                const b3 = parseInt(gradient[2].slice(5, 7), 16);
                
                let r, g, b;
                if (t < 0.5) {
                    const localT = t * 2;
                    r = Math.round(r1 + (r2 - r1) * localT);
                    g = Math.round(g1 + (g2 - g1) * localT);
                    b = Math.round(b1 + (b2 - b1) * localT);
                } else {
                    const localT = (t - 0.5) * 2;
                    r = Math.round(r2 + (r3 - r2) * localT);
                    g = Math.round(g2 + (g3 - g2) * localT);
                    b = Math.round(b2 + (b3 - b2) * localT);
                }
                color = (r << 16) + (g << 8) + b;
            } else {
                color = this.hexToDecimal(gradient[0]);
            }
            graphics.beginFill(color);
            graphics.drawRect(0, i, width, 1);
            graphics.endFill();
        }

        // Внутренняя тень (inset 0 1px 0 rgba(201,184,150,0.1))
        graphics.beginFill(0xc9b896, 0.1);
        graphics.drawRect(0, 0, width, 1);
        graphics.endFill();

        // Граница
        graphics.lineStyle(2, this.hexToDecimal(colors.border));
        graphics.drawRoundedRect(0, 0, width, height, 3);

        return this.app.renderer.generateTexture(graphics);
    }
    
    /**
     * Создание текстуры слота
     * Градиент: linear-gradient(to bottom, #2a1a1a 0%, #1a0f0f 100%)
     * box-shadow: inset 0 1px 0 rgba(201,184,150,0.1)
     */
    createSlotTexture() {
        const graphics = new PIXI.Graphics();
        const size = 50;

        // Градиентный фон
        for (let i = 0; i < size; i++) {
            const t = i / (size - 1);
            const r1 = 42, g1 = 26, b1 = 26; // #2a1a1a
            const r2 = 26, g2 = 15, b2 = 15; // #1a0f0f
            const r = Math.round(r1 + (r2 - r1) * t);
            const g = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (g << 8) + b;
            graphics.beginFill(color);
            graphics.drawRect(0, i, size, 1);
            graphics.endFill();
        }

        // Внутренняя тень (inset 0 1px 0 rgba(201,184,150,0.1))
        graphics.beginFill(0xc9b896, 0.1);
        graphics.drawRect(0, 0, size, 1);
        graphics.endFill();

        // Граница
        graphics.lineStyle(2, 0x3a2a1a);
        graphics.drawRoundedRect(0, 0, size, size, 3);

        return this.app.renderer.generateTexture(graphics);
    }

    /**
     * Получение текстуры из кэша или создание новой
     * @param {string} key - ключ текстуры
     * @param {Function} createFn - функция создания текстуры
     * @returns {PIXI.Texture}
     */
    getTexture(key, createFn) {
        if (!this.textureCache.has(key)) {
            const texture = createFn();
            this.textureCache.set(key, texture);
        }
        return this.textureCache.get(key);
    }

    /**
     * Создание текстуры из Graphics
     * @param {Function} drawFn - функция рисования
     * @param {Object} options - опции
     * @returns {PIXI.Texture}
     */
    createTexture(drawFn, options = {}) {
        const graphics = new PIXI.Graphics();
        drawFn(graphics);

        const texture = this.app.renderer.generateTexture(graphics, {
            scaleMode: PIXI.SCALE_MODES.NEAREST,
            resolution: 1
        });

        graphics.destroy();
        return texture;
    }
    
    /**
     * Создание 9-slice текстуры для масштабируемых элементов
     * @param {string} textureKey - ключ текстуры
     * @param {Object} slices - размеры срезов {top, bottom, left, right}
     * @returns {PIXI.NineSlicePlane}
     */
    createNineSlice(textureKey, slices) {
        const texture = this.getTexture(textureKey);
        return new PIXI.NineSlicePlane(
            texture,
            slices.left,
            slices.top,
            slices.right,
            slices.bottom
        );
    }
    
    /**
     * Получение спрайта из пула
     * @returns {PIXI.Sprite}
     */
    getSpriteFromPool() {
        if (this.spritePool.length > 0) {
            const sprite = this.spritePool.pop();
            sprite.visible = true;
            return sprite;
        }
        return new PIXI.Sprite();
    }
    
    /**
     * Возврат спрайта в пул
     * @param {PIXI.Sprite} sprite
     */
    returnSpriteToPool(sprite) {
        sprite.visible = false;
        sprite.x = 0;
        sprite.y = 0;
        sprite.scale.set(1);
        sprite.alpha = 1;
        this.spritePool.push(sprite);
    }
    
    /**
     * Создание текстового спрайта
     * @param {string} text - текст
     * @param {Object} style - стиль
     * @param {boolean} useDropShadow - использовать тень текста (text-shadow)
     * @param {boolean} isTitle - использовать увеличенную тень для заголовков
     * @returns {PIXI.Text}
     */
    createText(text, style = {}, useDropShadow = true, isTitle = false) {
        const defaultStyle = {
            fontFamily: UIConfig.fonts.family,
            fontSize: UIConfig.fonts.sizes.md,
            fill: 0xc9b896,
            align: 'left',
            // Встроенная тень текста PIXI (text-shadow)
            dropShadow: useDropShadow,
            dropShadowColor: '#000000',
            dropShadowBlur: isTitle ? 4 : 2,
            dropShadowDistance: isTitle ? 2 : 1,
            dropShadowAngle: Math.PI / 4 // 45 градусов
        };

        const mergedStyle = { ...defaultStyle, ...style };
        return new PIXI.Text(text, mergedStyle);
    }
    
    /**
     * Создание анимации
     * @param {string} name - имя анимации
     * @param {Object} config - конфигурация анимации
     */
    createAnimation(name, config) {
        this.animations.set(name, {
            name,
            config,
            time: 0,
            progress: 0,
            isPlaying: false,
            onComplete: config.onComplete || null
        });
    }
    
    /**
     * Запуск анимации
     * @param {string} name - имя анимации
     * @param {Object} target - объект для анимации
     */
    playAnimation(name, target) {
        const animation = this.animations.get(name);
        if (!animation) return;
        
        animation.target = target;
        animation.time = 0;
        animation.progress = 0;
        animation.isPlaying = true;
        
        // Применяем начальные значения
        if (animation.config.from) {
            this.applyAnimationValues(target, animation.config.from);
        }
    }
    
    /**
     * Применение значений анимации к объекту
     */
    applyAnimationValues(target, values) {
        for (const [key, value] of Object.entries(values)) {
            if (key in target) {
                target[key] = value;
            }
        }
    }
    
    /**
     * Интерполяция значений анимации
     */
    lerpAnimationValues(target, from, to, progress) {
        const easedProgress = this.ease(progress);
        
        for (const [key, startValue] of Object.entries(from)) {
            const endValue = to[key];
            if (endValue !== undefined && key in target) {
                target[key] = startValue + (endValue - startValue) * easedProgress;
            }
        }
    }
    
    /**
     * Функция плавности
     */
    ease(progress) {
        // Ease out cubic
        return 1 - Math.pow(1 - progress, 3);
    }
    
    /**
     * Обновление анимаций
     * @param {number} deltaTime - время с последнего кадра
     */
    updateAnimations(deltaTime) {
        for (const animation of this.animations.values()) {
            if (!animation.isPlaying) continue;
            
            animation.time += deltaTime;
            animation.progress = Math.min(1, animation.time / animation.config.duration);
            
            // Интерполяция значений
            if (animation.config.from && animation.config.to) {
                this.lerpAnimationValues(
                    animation.target,
                    animation.config.from,
                    animation.config.to,
                    animation.progress
                );
            }
            
            // Завершение анимации
            if (animation.progress >= 1) {
                animation.isPlaying = false;
                
                // Применяем конечные значения
                if (animation.config.to) {
                    this.applyAnimationValues(animation.target, animation.config.to);
                }
                
                if (animation.onComplete) {
                    animation.onComplete();
                }
            }
        }
    }
    
    /**
     * Анимация появления (fade in)
     * @param {Object} target - объект для анимации
     * @param {number} duration - длительность в мс
     * @param {Function} onComplete - callback по завершении
     */
    fadeIn(target, duration = 200, onComplete) {
        target.alpha = 0;
        target.visible = true;
        
        this.createAnimation(`fadeIn_${Date.now()}`, {
            duration,
            from: { alpha: 0 },
            to: { alpha: 1 },
            onComplete
        });
        this.playAnimation(`fadeIn_${Date.now()}`, target);
    }
    
    /**
     * Анимация исчезновения (fade out)
     * @param {Object} target - объект для анимации
     * @param {number} duration - длительность в мс
     * @param {Function} onComplete - callback по завершении
     */
    fadeOut(target, duration = 200, onComplete) {
        this.createAnimation(`fadeOut_${Date.now()}`, {
            duration,
            from: { alpha: target.alpha },
            to: { alpha: 0 },
            onComplete: () => {
                target.visible = false;
                if (onComplete) onComplete();
            }
        });
        this.playAnimation(`fadeOut_${Date.now()}`, target);
    }
    
    /**
     * Анимация масштабирования
     * @param {Object} target - объект для анимации
     * @param {number} scale - целевой масштаб
     * @param {number} duration - длительность в мс
     * @param {Function} onComplete - callback по завершении
     */
    scaleTo(target, scale, duration = 150, onComplete) {
        const startScale = target.scale.x;
        
        this.createAnimation(`scale_${Date.now()}`, {
            duration,
            from: { scale: { x: startScale, y: startScale } },
            to: { scale: { x: scale, y: scale } },
            onComplete
        });
        this.playAnimation(`scale_${Date.now()}`, target);
    }
    
    /**
     * Преобразование HEX цвета в десятичное число
     * @param {string} hex - HEX цвет
     * @returns {number}
     */
    hexToDecimal(hex) {
        if (typeof hex === 'number') return hex;
        return parseInt(hex.replace('#', '0x'));
    }
    
    /**
     * Очистка кэша текстур
     */
    clearTextureCache() {
        for (const texture of this.textureCache.values()) {
            texture.destroy(true);
        }
        this.textureCache.clear();
    }
    
    /**
     * Уничтожение рендерера
     */
    destroy() {
        this.clearTextureCache();
        
        for (const sprite of this.spritePool) {
            sprite.destroy();
        }
        this.spritePool = [];
        
        this.animations.clear();
    }
}

// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIRenderer;
} else if (typeof window !== 'undefined') {
    window.UIRenderer = UIRenderer;
}
