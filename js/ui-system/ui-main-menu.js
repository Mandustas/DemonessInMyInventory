/**
 * UIMainMenu - главное меню игры
 * Изящный дарк фентези стиль с фоновым изображением
 */
class UIMainMenu extends UIComponent {
    constructor(game, config = {}) {
        super(config);

        this.game = game;

        // Размеры меню
        this.menuWidth = 500;
        this.menuHeight = 400;
        this.padding = 25;
        this.buttonHeight = 45;
        this.buttonGap = 12;

        // Фоновое изображение
        this.backgroundImage = null;
        this.backgroundSprite = null;

        // Кнопки
        this.buttons = {};

        // Есть ли сохранение
        this.hasSave = false;

        // Заголовок
        this.titleText = null;
    }

    /**
     * Хук инициализации
     */
    onInit() {
        // Загружаем фоновое изображение
        this.loadBackgroundImage();

        // Создаем контейнер для меню (слева центрированный)
        this.menuContainer = new PIXI.Container();
        this.container.addChild(this.menuContainer);

        // Создаем фон меню
        this.createMenuBackground();

        // Создаем заголовок
        this.createTitle();

        // Создаем кнопки
        this.createButtons();

        // Проверяем наличие сохранения
        this.checkSave();
    }

    /**
     * Загрузка фонового изображения
     */
    loadBackgroundImage() {
        const bgPath = 'static/sound/images/mainmenu/mainmenu_img.jfif';
        
        // Создаем спрайт фона
        const texture = PIXI.Texture.from(bgPath);
        this.backgroundSprite = new PIXI.Sprite(texture);
        
        // Добавляем фон первым (под всем)
        this.container.addChildAt(this.backgroundSprite, 0);
        
        // Обрабатываем загрузку текстуры
        texture.baseTexture.on('loaded', () => {
            this.resizeBackground();
        });
        
        // Если текстура уже загружена
        if (texture.baseTexture.valid) {
            this.resizeBackground();
        }
    }

    /**
     * Масштабирование фона под размер экрана
     */
    resizeBackground() {
        if (!this.backgroundSprite || !this.backgroundSprite.texture.valid) return;

        const screenWidth = this.uiRenderer.app.screen.width;
        const screenHeight = this.uiRenderer.app.screen.height;
        
        const textureWidth = this.backgroundSprite.texture.width;
        const textureHeight = this.backgroundSprite.texture.height;

        // Масштабируем с сохранением пропорций, чтобы покрыть весь экран
        const scaleX = screenWidth / textureWidth;
        const scaleY = screenHeight / textureHeight;
        const scale = Math.max(scaleX, scaleY);

        this.backgroundSprite.scale.set(scale);
        this.backgroundSprite.x = (screenWidth - textureWidth * scale) / 2;
        this.backgroundSprite.y = (screenHeight - textureHeight * scale) / 2;
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

        // Градиентный фон меню
        for (let i = 0; i < this.menuHeight; i++) {
            const t = i / (this.menuHeight - 1);
            const r1 = 26, g1 = 20, b1 = 20;
            const r2 = 13, g2 = 10, b2 = 10;
            const r = Math.round(r1 + (r2 - r1) * t);
            const gr = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (gr << 8) + b;
            g.beginFill(color, 0.92);
            g.drawRect(0, i, this.menuWidth, 1);
            g.endFill();
        }

        // Внешняя рамка
        g.lineStyle(3, 0x3a2a1a);
        g.drawRect(0, 0, this.menuWidth, this.menuHeight);

        // Толстая внешняя тень
        g.lineStyle(6, 0x000000, 0.5);
        g.drawRect(-4, -4, this.menuWidth + 8, this.menuHeight + 8);

        // Внутренняя подсветка
        g.lineStyle(1, 0x6a5a4a, 0.3);
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

        g.lineStyle(2, 0x6a5a4a);

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
        // Основной заголовок (первая строка)
        this.titleText = new PIXI.Text('Скучно исследуя руины,', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 24,
            fill: '#c9b896',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 6,
            dropShadowDistance: 3,
            dropShadowAngle: Math.PI / 4,
            letterSpacing: 2,
            wordWrap: true,
            wordWrapWidth: this.menuWidth - 40,
            align: 'center'
        });
        this.titleText.anchor.set(0.5);
        this.titleText.x = this.menuWidth / 2;
        this.titleText.y = this.padding + 20;
        this.menuContainer.addChild(this.titleText);

        // Вторая строка
        this.subtitleText = new PIXI.Text('я наткнулся на древний артефакт, который,', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 16,
            fill: '#a89880',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 3,
            dropShadowDistance: 1,
            wordWrap: true,
            wordWrapWidth: this.menuWidth - 40,
            align: 'center'
        });
        this.subtitleText.anchor.set(0.5);
        this.subtitleText.x = this.menuWidth / 2;
        this.subtitleText.y = this.padding + 55;
        this.menuContainer.addChild(this.subtitleText);

        // Третья строка
        this.subtitleText2 = new PIXI.Text('как выяснилось, является душой Королевы Демонов,', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 16,
            fill: '#a89880',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 3,
            dropShadowDistance: 1,
            wordWrap: true,
            wordWrapWidth: this.menuWidth - 40,
            align: 'center'
        });
        this.subtitleText2.anchor.set(0.5);
        this.subtitleText2.x = this.menuWidth / 2;
        this.subtitleText2.y = this.padding + 82;
        this.menuContainer.addChild(this.subtitleText2);

        // Четвёртая строка (финальная)
        this.subtitleText3 = new PIXI.Text('и теперь она живёт у меня в инвентаре и даёт вредные советы по билду', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 15,
            fill: '#8a7a6a',
            fontStyle: 'italic',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 3,
            dropShadowDistance: 1,
            wordWrap: true,
            wordWrapWidth: this.menuWidth - 40,
            align: 'center'
        });
        this.subtitleText3.anchor.set(0.5);
        this.subtitleText3.x = this.menuWidth / 2;
        this.subtitleText3.y = this.padding + 110;
        this.menuContainer.addChild(this.subtitleText3);

        // Декоративная линия под заголовком
        this.titleLine = new PIXI.Graphics();
        this.menuContainer.addChild(this.titleLine);
    }

    /**
     * Отрисовка декоративной линии
     */
    renderTitleLine() {
        const g = this.titleLine;
        g.clear();

        const y = this.padding + 145;
        const lineWidth = this.menuWidth - this.padding * 2;

        // Линия
        g.lineStyle(1, 0x3a2a1a);
        g.moveTo(this.padding, y);
        g.lineTo(this.padding + lineWidth, y);

        // Декоративная линия
        g.lineStyle(1, 0x6a5a4a, 0.5);
        g.moveTo(this.padding + 10, y + 2);
        g.lineTo(this.padding + lineWidth - 10, y + 2);
    }

    /**
     * Создание кнопок
     */
    createButtons() {
        const buttonConfig = [
            { key: 'continue', text: 'ПРОДОЛЖИТЬ ИГРУ', action: 'continue', requiresSave: true },
            { key: 'newGame', text: 'НОВАЯ ИГРА', action: 'newGame', requiresSave: false },
            { key: 'exit', text: 'ВЫЙТИ', action: 'exit', requiresSave: false }
        ];

        const startY = this.padding + 170;
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
            dropShadowDistance: 1,
            dropShadowAngle: Math.PI / 4
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
            normal: { bgTop: 0x2a1a1a, bgBottom: 0x1a0f0f, border: 0x4a3a2a, text: '#c9b896' },
            hover: { bgTop: 0x3a2a2a, bgBottom: 0x2a1a1a, border: 0x6a5a4a, text: '#e8d9b8' },
            active: { bgTop: 0x1a0f0f, bgBottom: 0x0d0808, border: 0x3a2a1a, text: '#c9b896' },
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
            case 'continue':
                if (this.game) {
                    this.game.continueGame();
                }
                break;
            case 'newGame':
                if (this.game) {
                    this.game.startNewGame();
                }
                break;
            case 'exit':
                // Закрываем вкладку
                window.close();
                // Если не удалось закрыть, показываем сообщение
                setTimeout(() => {
                    alert('Нажмите Alt+F4 для выхода из игры.');
                }, 100);
                break;
        }
    }

    /**
     * Проверка наличия сохранения
     */
    checkSave() {
        if (this.game && this.game.saveSystem) {
            this.hasSave = this.game.saveSystem.hasSave();
        } else {
            // Проверяем напрямую в localStorage
            this.hasSave = !!localStorage.getItem(GAME_CONFIG.SAVE.KEY);
        }

        // Обновляем состояние кнопки продолжения (только если кнопки уже созданы)
        if (this.buttons && this.buttons['continue']) {
            const continueButton = this.buttons['continue'];
            continueButton.enabled = this.hasSave;
            continueButton.container.cursor = this.hasSave ? 'pointer' : 'default';
            this.renderButton(continueButton);
        }
    }

    /**
     * Обновление позиции меню
     */
    updatePosition() {
        if (!this.container || !this.menuContainer) return;

        const screenWidth = this.uiRenderer.app.screen.width;
        const screenHeight = this.uiRenderer.app.screen.height;

        // Меню слева, центрированное по вертикали
        const menuX = screenWidth * 0.15; // 15% от левого края
        const menuY = (screenHeight - this.menuHeight) / 2;

        this.menuContainer.x = menuX;
        this.menuContainer.y = menuY;

        // Обновляем фон
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
        // Показываем фоновое изображение
        if (this.backgroundSprite) {
            this.backgroundSprite.visible = true;
        }
    }

    /**
     * Хук при закрытии
     */
    onClose() {
        // Скрываем фоновое изображение
        if (this.backgroundSprite) {
            this.backgroundSprite.visible = false;
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
        
        // Управляем видимостью фона
        if (this.backgroundSprite) {
            this.backgroundSprite.visible = value;
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
    module.exports = UIMainMenu;
} else if (typeof window !== 'undefined') {
    window.UIMainMenu = UIMainMenu;
}