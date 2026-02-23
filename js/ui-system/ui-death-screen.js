/**
 * UIDeathScreen - экран смерти персонажа
 * Стилизованный экран с кнопками действий
 */
class UIDeathScreen extends UIComponent {
    constructor(game, config = {}) {
        super(config);

        this.game = game;

        // Размеры
        this.menuWidth = 500;
        this.menuHeight = 350;
        this.padding = 25;
        this.buttonHeight = 45;
        this.buttonGap = 15;

        // Элементы
        this.backgroundSprite = null;
        this.menuContainer = null;
        this.menuBg = null;
        this.titleText = null;
        this.subtitleText = null;
        this.buttons = {};

        // Фоновое изображение (затемнённое)
        this.backgroundImage = null;

        // Инициализация видимости
        this._visible = config.visible !== false;
    }

    /**
     * Хук инициализации
     */
    onInit() {
        // Загружаем фоновое изображение
        this.loadBackgroundImage();

        // Создаем контейнер для меню
        this.menuContainer = new PIXI.Container();
        this.container.addChild(this.menuContainer);

        // Создаем фон меню
        this.createMenuBackground();

        // Создаем заголовок
        this.createTitle();

        // Создаем кнопки
        this.createButtons();
    }

    /**
     * Загрузка фонового изображения
     */
    loadBackgroundImage() {
        const bgPath = 'static/sound/images/mainmenu/mainmenu_img.jfif';

        const texture = PIXI.Texture.from(bgPath);
        this.backgroundSprite = new PIXI.Sprite(texture);

        // Добавляем тёмный оверлей
        this.overlayGraphics = new PIXI.Graphics();
        this.container.addChildAt(this.overlayGraphics, 0);
        this.container.addChildAt(this.backgroundSprite, 0);

        texture.baseTexture.on('loaded', () => {
            this.resizeBackground();
        });

        if (texture.baseTexture.valid) {
            this.resizeBackground();
        }
    }

    /**
     * Масштабирование фона
     */
    resizeBackground() {
        if (!this.backgroundSprite || !this.backgroundSprite.texture.valid) return;

        const screenWidth = this.uiRenderer.app.screen.width;
        const screenHeight = this.uiRenderer.app.screen.height;

        const textureWidth = this.backgroundSprite.texture.width;
        const textureHeight = this.backgroundSprite.texture.height;

        const scaleX = screenWidth / textureWidth;
        const scaleY = screenHeight / textureHeight;
        const scale = Math.max(scaleX, scaleY);

        this.backgroundSprite.scale.set(scale);
        this.backgroundSprite.x = (screenWidth - textureWidth * scale) / 2;
        this.backgroundSprite.y = (screenHeight - textureHeight * scale) / 2;

        // Рисуем тёмный оверлей
        this.renderOverlay();
    }

    /**
     * Отрисовка тёмного оверлея
     */
    renderOverlay() {
        if (!this.overlayGraphics) return;

        const g = this.overlayGraphics;
        g.clear();

        const screenWidth = this.uiRenderer.app.screen.width;
        const screenHeight = this.uiRenderer.app.screen.height;

        g.beginFill(0x000000, 0.85);
        g.drawRect(0, 0, screenWidth, screenHeight);
        g.endFill();
    }

    /**
     * Создание фона меню
     */
    createMenuBackground() {
        this.menuBg = new PIXI.Graphics();
        this.menuContainer.addChild(this.menuBg);
    }

    /**
     * Отрисовка фона меню
     */
    renderMenuBackground() {
        const g = this.menuBg;
        g.clear();

        // Градиентный фон меню (тёмный, красно-коричневый)
        for (let i = 0; i < this.menuHeight; i++) {
            const t = i / (this.menuHeight - 1);
            const r1 = 40, g1 = 10, b1 = 10;
            const r2 = 15, g2 = 5, b2 = 5;
            const r = Math.round(r1 + (r2 - r1) * t);
            const gr = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (gr << 8) + b;
            g.beginFill(color, 0.95);
            g.drawRect(0, i, this.menuWidth, 1);
            g.endFill();
        }

        // Внешняя рамка
        g.lineStyle(3, 0x5a2a2a);
        g.drawRect(0, 0, this.menuWidth, this.menuHeight);

        // Толстая внешняя тень
        g.lineStyle(6, 0x000000, 0.7);
        g.drawRect(-4, -4, this.menuWidth + 8, this.menuHeight + 8);

        // Внутренняя подсветка
        g.lineStyle(1, 0x8a5a5a, 0.3);
        g.drawRect(4, 4, this.menuWidth - 8, this.menuHeight - 8);

        // Декоративные уголки
        this.drawCornerDecorations(g);
    }

    /**
     * Отрисовка декоративных уголков
     */
    drawCornerDecorations(g) {
        const cornerSize = 12;
        const margin = 8;

        g.lineStyle(2, 0x8a5a4a);

        // Верхний левый
        g.moveTo(margin, margin + cornerSize);
        g.lineTo(margin, margin);
        g.lineTo(margin + cornerSize, margin);

        // Верхний правый
        g.moveTo(this.menuWidth - margin - cornerSize, margin);
        g.lineTo(this.menuWidth - margin, margin);
        g.lineTo(this.menuWidth - margin, margin + cornerSize);

        // Нижний левый
        g.moveTo(margin, this.menuHeight - margin - cornerSize);
        g.lineTo(margin, this.menuHeight - margin);
        g.lineTo(margin + cornerSize, this.menuHeight - margin);

        // Нижний правый
        g.moveTo(this.menuWidth - margin - cornerSize, this.menuHeight - margin);
        g.lineTo(this.menuWidth - margin, this.menuHeight - margin);
        g.lineTo(this.menuWidth - margin, this.menuHeight - margin - cornerSize);
    }

    /**
     * Создание заголовка
     */
    createTitle() {
        // Основной заголовок
        this.titleText = new PIXI.Text('ВЫ ПОГИБЛИ', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 42,
            fill: '#8b0000',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#ff0000',
            dropShadowBlur: 8,
            dropShadowDistance: 4,
            letterSpacing: 4,
            stroke: '#3a0a0a',
            strokeThickness: 2
        });
        this.titleText.anchor.set(0.5);
        this.titleText.x = this.menuWidth / 2;
        this.titleText.y = this.padding + 30;
        this.menuContainer.addChild(this.titleText);

        // Подзаголовок
        this.subtitleText = new PIXI.Text('Тьма поглотила вашу душу...', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 18,
            fill: '#6a5a5a',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 3,
            dropShadowDistance: 1
        });
        this.subtitleText.anchor.set(0.5);
        this.subtitleText.x = this.menuWidth / 2;
        this.subtitleText.y = this.padding + 85;
        this.menuContainer.addChild(this.subtitleText);

        // Декоративная линия
        this.titleLine = new PIXI.Graphics();
        this.menuContainer.addChild(this.titleLine);
    }

    /**
     * Отрисовка декоративной линии
     */
    renderTitleLine() {
        const g = this.titleLine;
        g.clear();

        const y = this.padding + 120;
        const lineWidth = this.menuWidth - this.padding * 2;

        g.lineStyle(2, 0x5a2a2a);
        g.moveTo(this.padding, y);
        g.lineTo(this.padding + lineWidth, y);

        g.lineStyle(1, 0x8a5a4a, 0.5);
        g.moveTo(this.padding + 10, y + 3);
        g.lineTo(this.padding + lineWidth - 10, y + 3);
    }

    /**
     * Создание кнопок
     */
    createButtons() {
        const buttonConfig = [
            { key: 'respawn', text: 'ВОЗРОДИТЬСЯ', action: 'respawn' },
            { key: 'mainMenu', text: 'В ГЛАВНОЕ МЕНЮ', action: 'mainMenu' },
            { key: 'loadSave', text: 'ЗАГРУЗИТЬ СОХРАНЕНИЕ', action: 'loadSave', requiresSave: true }
        ];

        const startY = this.padding + 140;
        const buttonWidth = this.menuWidth - this.padding * 2;

        buttonConfig.forEach((config, index) => {
            const y = startY + index * (this.buttonHeight + this.buttonGap);
            const button = this.createButton(config, this.padding, y, buttonWidth);
            this.buttons[config.key] = button;
            this.menuContainer.addChild(button.container);
        });
    }

    /**
     * Создание отдельной кнопки
     */
    createButton(config, x, y, width) {
        const button = {
            config: config,
            x: x,
            y: y,
            width: width,
            height: this.buttonHeight,
            container: new PIXI.Container(),
            background: new PIXI.Graphics(),
            textSprite: null,
            state: 'normal',
            enabled: !config.requiresSave
        };

        button.container.x = x;
        button.container.y = y;
        button.container.addChild(button.background);

        // Текст кнопки
        button.textSprite = new PIXI.Text(config.text, {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 14,
            fill: button.enabled ? '#c9b896' : '#5a5a5a',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 2,
            dropShadowDistance: 1
        });
        button.textSprite.anchor.set(0.5);
        button.textSprite.x = width / 2;
        button.textSprite.y = this.buttonHeight / 2;
        button.container.addChild(button.textSprite);

        // Интерактивность
        button.container.eventMode = 'static';
        button.container.cursor = button.enabled ? 'pointer' : 'default';

        button.container.on('pointerover', () => {
            if (button.enabled) {
                button.state = 'hover';
                this.renderButton(button);
            }
        });

        button.container.on('pointerout', () => {
            button.state = 'normal';
            this.renderButton(button);
        });

        button.container.on('pointerdown', () => {
            if (button.enabled) {
                button.state = 'active';
                this.renderButton(button);
            }
        });

        button.container.on('pointerup', () => {
            if (button.enabled) {
                button.state = 'hover';
                this.renderButton(button);
                this.handleAction(config.action);
            }
        });

        button.container.on('pointerupoutside', () => {
            button.state = 'normal';
            this.renderButton(button);
        });

        // Первоначальная отрисовка
        this.renderButton(button);

        return button;
    }

    /**
     * Отрисовка кнопки
     */
    renderButton(button) {
        const g = button.background;
        g.clear();

        const colors = {
            normal: { bgTop: 0x3a1a1a, bgBottom: 0x1a0a0a, border: 0x5a3a2a, text: '#c9b896' },
            hover: { bgTop: 0x4a2a2a, bgBottom: 0x2a1a1a, border: 0x7a5a4a, text: '#e8d9b8' },
            active: { bgTop: 0x2a0a0a, bgBottom: 0x0d0808, border: 0x4a2a1a, text: '#c9b896' },
            disabled: { bgTop: 0x1a1a1a, bgBottom: 0x0d0d0d, border: 0x2a2a2a, text: '#5a5a5a' }
        };

        const stateColors = button.enabled ? colors[button.state] : colors.disabled;

        // Градиентный фон
        for (let i = 0; i < this.buttonHeight; i++) {
            const t = i / (this.buttonHeight - 1);
            const r1 = (stateColors.bgTop >> 16) & 0xff;
            const g1 = (stateColors.bgTop >> 8) & 0xff;
            const b1 = stateColors.bgTop & 0xff;
            const r2 = (stateColors.bgBottom >> 16) & 0xff;
            const g2 = (stateColors.bgBottom >> 8) & 0xff;
            const b2 = stateColors.bgBottom & 0xff;
            const r = Math.round(r1 + (r2 - r1) * t);
            const gr = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (gr << 8) + b;
            g.beginFill(color);
            g.drawRect(0, i, button.width, 1);
            g.endFill();
        }

        // Рамка
        g.lineStyle(2, stateColors.border);
        g.drawRoundedRect(0, 0, button.width, this.buttonHeight, 3);

        // Цвет текста
        button.textSprite.style.fill = stateColors.text;
    }

    /**
     * Обработка действий кнопок
     */
    handleAction(action) {
        switch (action) {
            case 'respawn':
                if (this.game && this.game.character) {
                    // Возрождаем персонажа
                    this.game.character.respawn();
                    
                    // Скрываем экран смерти
                    this.close();
                    
                    // Возвращаем игру в нормальное состояние
                    this.game.gameState = 'playing';
                    
                    // Восстанавливаем видимость UI элементов
                    if (this.game.uiSkillBar) this.game.uiSkillBar.visible = true;
                    if (this.game.uiMinimap) this.game.uiMinimap.visible = true;
                    if (this.game.uiPanelButtons) this.game.uiPanelButtons.visible = true;
                    if (this.game.uiActionLog) this.game.uiActionLog.visible = true;
                    
                    // Воспроизводим музыку игры
                    if (this.game.audioSystem) {
                        this.game.audioSystem.playMusic('openworld', true);
                    }
                }
                break;
            case 'mainMenu':
                if (this.game) {
                    // Возрождаем персонажа перед выходом в меню
                    if (this.game.character) {
                        this.game.character.respawn();
                    }
                    this.game.exitToMainMenu();
                    this.close();
                }
                break;
            case 'loadSave':
                if (this.game && this.game.saveSystem) {
                    // Загружаем сохранение
                    this.game.saveSystem.loadGame();
                    this.close();
                }
                break;
        }
    }

    /**
     * Проверка наличия сохранения
     */
    checkSave() {
        let hasSave = false;

        if (this.game && this.game.saveSystem) {
            hasSave = this.game.saveSystem.hasSave();
        } else {
            hasSave = !!localStorage.getItem('diabloSave');
        }

        // Обновляем состояние кнопки загрузки
        if (this.buttons && this.buttons['loadSave']) {
            const loadButton = this.buttons['loadSave'];
            loadButton.enabled = hasSave;
            loadButton.container.cursor = hasSave ? 'pointer' : 'default';
            this.renderButton(loadButton);
        }
    }

    /**
     * Обновление позиции меню
     */
    updatePosition() {
        if (!this.container || !this.menuContainer) return;

        const screenWidth = this.uiRenderer.app.screen.width;
        const screenHeight = this.uiRenderer.app.screen.height;

        // Меню по центру
        const menuX = (screenWidth - this.menuWidth) / 2;
        const menuY = (screenHeight - this.menuHeight) / 2;

        this.menuContainer.x = menuX;
        this.menuContainer.y = menuY;

        // Обновляем фон и оверлей
        this.resizeBackground();
        this.renderMenuBackground();
        this.renderTitleLine();
    }

    /**
     * Хук при открытии
     */
    onOpen() {
        this.checkSave();
        this.updatePosition();

        // Показываем элементы
        if (this.backgroundSprite) {
            this.backgroundSprite.visible = true;
        }
        if (this.overlayGraphics) {
            this.overlayGraphics.visible = true;
        }

        // Приостанавливаем игру
        if (this.game) {
            this.game.gameState = 'death';
        }
    }

    /**
     * Хук при закрытии
     */
    onClose() {
        // Скрываем элементы
        if (this.backgroundSprite) {
            this.backgroundSprite.visible = false;
        }
        if (this.overlayGraphics) {
            this.overlayGraphics.visible = false;
        }
    }

    /**
     * Установка видимости
     */
    set visible(value) {
        if (this._visible === value) return;
        this._visible = value;

        if (this.container) {
            this.container.visible = value;
        }

        if (this.backgroundSprite) {
            this.backgroundSprite.visible = value;
        }
        if (this.overlayGraphics) {
            this.overlayGraphics.visible = value;
        }

        if (value) {
            this.onOpen();
        } else {
            this.onClose();
        }
    }

    /**
     * Получение видимости
     */
    get visible() {
        return this._visible;
    }

    /**
     * Отрисовка содержимого
     */
    renderContent() {
        // Вся отрисовка происходит в других методах
    }

    /**
     * Обработка изменения размера экрана
     */
    handleResize() {
        this.updatePosition();
    }
}

// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIDeathScreen;
} else if (typeof window !== 'undefined') {
    window.UIDeathScreen = UIDeathScreen;
}
