/**
 * UISplashScreen - вступительный экран с просьбой нажать любую клавишу
 * Для обхода блокировки автовоспроизведения браузером
 */
class UISplashScreen extends UIComponent {
    constructor(game, config = {}) {
        super(config);

        this.game = game;

        // Размеры
        this.textWidth = 400;

        // Элементы
        this.backgroundGraphics = null;
        this.titleText = null;
        this.pressKeyText = null;
        this.diabloLogo = null;

        // Анимация мигания
        this.blinkTimer = 0;
        this.blinkVisible = true;
        this.blinkInterval = 500; // мс

        // Инициализация видимости
        this._visible = config.visible !== false;
    }

    /**
     * Хук инициализации
     */
    onInit() {
        // Создаем контейнер для содержимого
        this.contentContainer = new PIXI.Container();
        this.container.addChild(this.contentContainer);

        // Создаем элементы
        this.createBackground();
        this.createTitle();
        this.createPressKeyText();
    }

    /**
     * Создание фона
     */
    createBackground() {
        this.backgroundGraphics = new PIXI.Graphics();
        this.contentContainer.addChild(this.backgroundGraphics);
    }

    /**
     * Отрисовка фона
     */
    renderBackground() {
        const g = this.backgroundGraphics;
        if (!g) return;
        
        g.clear();

        const screenWidth = this.uiRenderer.app.screen.width;
        const screenHeight = this.uiRenderer.app.screen.height;

        // Тёмный градиентный фон (в стиле loading screen)
        for (let i = 0; i < screenHeight; i++) {
            const t = i / (screenHeight - 1);
            const r1 = 13, g1 = 10, b1 = 10;
            const r2 = 6, g2 = 5, b2 = 5;
            const r = Math.round(r1 + (r2 - r1) * t);
            const gr = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (gr << 8) + b;
            g.beginFill(color);
            g.drawRect(0, i, screenWidth, 1);
            g.endFill();
        }

        // Декоративная рамка по краям
        this.renderBorder(screenWidth, screenHeight);
    }

    /**
     * Отрисовка декоративной рамки
     */
    renderBorder(screenWidth, screenHeight) {
        const g = this.backgroundGraphics;
        if (!g) return;
        
        const borderWidth = 4;
        const innerBorder = 3;

        // Внешняя тёмная рамка
        g.lineStyle(borderWidth, 0x1a0f0f);
        g.drawRect(0, 0, screenWidth, screenHeight);

        // Внутренняя светлая рамка
        g.lineStyle(innerBorder, 0x3a2a1a);
        g.drawRect(borderWidth - innerBorder, borderWidth - innerBorder, 
                   screenWidth - borderWidth * 2 + innerBorder * 2, 
                   screenHeight - borderWidth * 2 + innerBorder * 2);

        // Уголки
        this.renderCornerDecorations(g, screenWidth, screenHeight);
    }

    /**
     * Отрисовка декоративных уголков
     */
    renderCornerDecorations(g, screenWidth, screenHeight) {
        const cornerSize = 20;
        const margin = 10;

        g.lineStyle(2, 0x6a5a4a);

        // Верхний левый
        g.moveTo(margin, margin + cornerSize);
        g.lineTo(margin, margin);
        g.lineTo(margin + cornerSize, margin);

        // Верхний правый
        g.moveTo(screenWidth - margin - cornerSize, margin);
        g.lineTo(screenWidth - margin, margin);
        g.lineTo(screenWidth - margin, margin + cornerSize);

        // Нижний левый
        g.moveTo(margin, screenHeight - margin - cornerSize);
        g.lineTo(margin, screenHeight - margin);
        g.lineTo(margin + cornerSize, screenHeight - margin);

        // Нижний правый
        g.moveTo(screenWidth - margin - cornerSize, screenHeight - margin);
        g.lineTo(screenWidth - margin, screenHeight - margin);
        g.lineTo(screenWidth - margin, screenHeight - margin - cornerSize);
    }

    /**
     * Создание заголовка
     */
    createTitle() {
        // Основной заголовок - первая строка
        this.titleText = new PIXI.Text('Скучно исследуя руины,', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 32,
            fill: '#c9b896',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 6,
            dropShadowDistance: 3,
            dropShadowAngle: Math.PI / 4,
            letterSpacing: 2,
            wordWrap: true,
            wordWrapWidth: 700,
            align: 'center',
            stroke: '#3a2a1a',
            strokeThickness: 1
        });
        this.titleText.anchor.set(0.5);
        this.contentContainer.addChild(this.titleText);

        // Вторая строка
        this.subtitleText = new PIXI.Text('я наткнулся на древний артефакт, который,', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 22,
            fill: '#a89880',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 3,
            dropShadowDistance: 1,
            wordWrap: true,
            wordWrapWidth: 700,
            align: 'center'
        });
        this.subtitleText.anchor.set(0.5);
        this.contentContainer.addChild(this.subtitleText);

        // Третья строка
        this.subtitleText2 = new PIXI.Text('как выяснилось, является душой Королевы Демонов,', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 22,
            fill: '#a89880',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 3,
            dropShadowDistance: 1,
            wordWrap: true,
            wordWrapWidth: 700,
            align: 'center'
        });
        this.subtitleText2.anchor.set(0.5);
        this.contentContainer.addChild(this.subtitleText2);

        // Четвёртая строка
        this.subtitleText3 = new PIXI.Text('и теперь она живёт у меня в инвентаре и даёт вредные советы по билду', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 20,
            fill: '#8a7a6a',
            fontStyle: 'italic',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 3,
            dropShadowDistance: 1,
            wordWrap: true,
            wordWrapWidth: 700,
            align: 'center'
        });
        this.subtitleText3.anchor.set(0.5);
        this.contentContainer.addChild(this.subtitleText3);
    }

    /**
     * Создание текста "Нажмите любую клавишу"
     */
    createPressKeyText() {
        this.pressKeyText = new PIXI.Text('НАЖМИТЕ ПРОБЕЛ', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 20,
            fill: '#c9b896',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 3,
            dropShadowDistance: 2,
            letterSpacing: 2
        });
        this.pressKeyText.anchor.set(0.5);
        this.contentContainer.addChild(this.pressKeyText);

        // Дополнительный текст
        this.hintText = new PIXI.Text('для начала игры', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 14,
            fill: '#6a5a4a',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 2,
            dropShadowDistance: 1
        });
        this.hintText.anchor.set(0.5);
        this.contentContainer.addChild(this.hintText);
    }

    /**
     * Обновление позиции элементов
     */
    updatePosition() {
        if (!this.contentContainer) return;

        const screenWidth = this.uiRenderer.app.screen.width;
        const screenHeight = this.uiRenderer.app.screen.height;

        // Отрисовываем фон
        this.renderBackground();

        // Позиционируем элементы по центру
        const centerY = screenHeight / 2 - 60;
        const lineSpacing = 35;

        // Заголовок - первая строка
        this.titleText.x = screenWidth / 2;
        this.titleText.y = centerY - lineSpacing * 1.5;

        // Вторая строка
        this.subtitleText.x = screenWidth / 2;
        this.subtitleText.y = centerY - lineSpacing * 0.5;

        // Третья строка
        this.subtitleText2.x = screenWidth / 2;
        this.subtitleText2.y = centerY + lineSpacing * 0.5;

        // Четвёртая строка
        this.subtitleText3.x = screenWidth / 2;
        this.subtitleText3.y = centerY + lineSpacing * 1.5;

        // Текст "Нажмите пробел"
        this.pressKeyText.x = screenWidth / 2;
        this.pressKeyText.y = screenHeight - 120;

        // Дополнительный текст
        this.hintText.x = screenWidth / 2;
        this.hintText.y = screenHeight - 90;
    }

    /**
     * Обновление компонента (для анимации мигания)
     */
    update(deltaTime = 16.67) {
        super.update(deltaTime);

        // Анимация мигания текста
        this.updateBlinkAnimation(deltaTime);
    }

    /**
     * Анимация мигания текста
     */
    updateBlinkAnimation(deltaTime) {
        this.blinkTimer += deltaTime;

        if (this.blinkTimer >= this.blinkInterval) {
            this.blinkTimer = 0;
            this.blinkVisible = !this.blinkVisible;

            if (this.pressKeyText) {
                this.pressKeyText.alpha = this.blinkVisible ? 1.0 : 0.3;
            }
            if (this.hintText) {
                this.hintText.alpha = this.blinkVisible ? 0.8 : 0.2;
            }
        }
    }

    /**
     * Обработка нажатия клавиш для перехода к главному меню
     */
    setupKeyHandler() {
        const handleKeyPress = (e) => {
            // Проверяем, что нажат пробел
            if (e.code !== 'Space') return;
            
            // Предотвращаем прокрутку страницы
            e.preventDefault();
            
            // Удаляем обработчик
            document.removeEventListener('keydown', handleKeyPress);
            document.removeEventListener('click', handleKeyPress);

            // Запускаем музыку главного меню
            if (this.game && this.game.audioSystem) {
                this.game.audioSystem.playMusic('mainMenu', true);
            }

            // Скрываем splash screen и показываем главное меню
            this.close();

            if (this.game && this.game.uiMainMenu) {
                this.game.uiMainMenu.open();
            }
        };

        // Обработчик нажатия клавиш (только пробел)
        document.addEventListener('keydown', handleKeyPress, { once: false });
        // Обработчик клика (любой клик)
        document.addEventListener('click', handleKeyPress, { once: true });
    }

    /**
     * Хук при открытии
     */
    onOpen() {
        this.updatePosition();
        this.blinkTimer = 0;
        this.blinkVisible = true;
        if (this.pressKeyText) {
            this.pressKeyText.alpha = 1.0;
        }
        if (this.hintText) {
            this.hintText.alpha = 0.8;
        }

        // Настраиваем обработчик нажатия
        this.setupKeyHandler();
    }

    /**
     * Хук при закрытии
     */
    onClose() {
        // Очищаем обработчики (на случай если были)
        // Обработчики используют { once: true }, но на всякий случай
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
     * Переопределяем render() для использования собственной логики
     */
    render() {
        if (!this.backgroundGraphics || !this.visible) return;
        
        // Отрисовка фона и рамки
        this.renderBackground();
        
        // Отрисовка содержимого
        this.renderContent();
        
        this.needsUpdate = false;
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
    module.exports = UISplashScreen;
} else if (typeof window !== 'undefined') {
    window.UISplashScreen = UISplashScreen;
}
