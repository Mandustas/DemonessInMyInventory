/**
 * UILoadingScreen - экран загрузки с подсказками
 * Использует стиль полоски опыта для прогресса загрузки
 */
class UILoadingScreen extends UIComponent {
    constructor(game, config = {}) {
        super(config);

        this.game = game;

        // Размеры
        this.barWidth = 500;
        this.barHeight = 25;
        this.padding = 30;

        // Прогресс
        this.progress = 0;
        this.targetProgress = 0;
        this.loadingSpeed = 0.02; // Скорость анимации

        // Подсказка
        this.currentTip = '';

        // Состояние
        this.isLoading = false;
        this.onComplete = null;

        // Элементы
        this.progressBar = null;
        this.progressFill = null;
        this.tipText = null;
        this.loadingText = null;
        
        // Инициализация видимости (важно для геттера/сеттера)
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
        this.createTipSection();
        this.createProgressBar();
        this.createLoadingText();

        // Выбираем случайную подсказку
        this.selectRandomTip();
    }

    /**
     * Создание фона
     */
    createBackground() {
        this.bgGraphics = new PIXI.Graphics();
        this.contentContainer.addChild(this.bgGraphics);
    }

    /**
     * Отрисовка фона
     */
    renderBackground() {
        const g = this.bgGraphics;
        g.clear();

        const screenWidth = this.uiRenderer.app.screen.width;
        const screenHeight = this.uiRenderer.app.screen.height;

        // Тёмный градиентный фон
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
    }

    /**
     * Создание секции подсказки
     */
    createTipSection() {
        // Заголовок "Подсказка"
        this.tipTitleText = new PIXI.Text('ПОДСКАЗКА', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 14,
            fill: '#6a5a4a',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 2,
            dropShadowDistance: 1
        });
        this.tipTitleText.anchor.set(0.5);
        this.contentContainer.addChild(this.tipTitleText);

        // Текст подсказки
        this.tipText = new PIXI.Text('', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 16,
            fill: '#c9b896',
            wordWrap: true,
            wordWrapWidth: this.barWidth,
            align: 'center',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 2,
            dropShadowDistance: 1,
            lineHeight: 24
        });
        this.tipText.anchor.set(0.5, 0);
        this.contentContainer.addChild(this.tipText);
    }

    /**
     * Создание полоски прогресса (в стиле полоски опыта)
     */
    createProgressBar() {
        // Контейнер для полоски
        this.barContainer = new PIXI.Container();
        this.contentContainer.addChild(this.barContainer);

        // Фон полоски
        this.progressBarBg = new PIXI.Graphics();
        this.barContainer.addChild(this.progressBarBg);

        // Заполнение полоски
        this.progressBarFill = new PIXI.Graphics();
        this.barContainer.addChild(this.progressBarFill);

        // Текст процентов
        this.percentText = new PIXI.Text('0%', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 14,
            fill: '#c9b896',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 2,
            dropShadowDistance: 1
        });
        this.percentText.anchor.set(0.5);
        this.barContainer.addChild(this.percentText);
    }

    /**
     * Создание текста загрузки
     */
    createLoadingText() {
        this.loadingText = new PIXI.Text('Загрузка...', {
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 18,
            fill: '#8a7a6a',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 2,
            dropShadowDistance: 1
        });
        this.loadingText.anchor.set(0.5);
        this.contentContainer.addChild(this.loadingText);
    }

    /**
     * Выбор случайной подсказки
     */
    selectRandomTip() {
        if (typeof getRandomTip === 'function') {
            this.currentTip = getRandomTip();
        } else if (typeof GameTips !== 'undefined' && GameTips.length > 0) {
            this.currentTip = GameTips[Math.floor(Math.random() * GameTips.length)];
        } else {
            this.currentTip = 'Исследуйте подземелья и сражайтесь с врагами!';
        }

        if (this.tipText) {
            this.tipText.text = this.currentTip;
        }
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

        // Позиционируем элементы снизу экрана
        const barY = screenHeight - 120;
        const barX = (screenWidth - this.barWidth) / 2;

        // Подсказка
        this.tipTitleText.x = screenWidth / 2;
        this.tipTitleText.y = barY - 80;

        this.tipText.x = screenWidth / 2;
        this.tipText.y = barY - 55;

        // Полоска прогресса
        this.barContainer.x = barX;
        this.barContainer.y = barY;

        // Текст загрузки
        this.loadingText.x = screenWidth / 2;
        this.loadingText.y = barY + this.barHeight + 15;

        // Отрисовываем полоску
        this.renderProgressBar();
    }

    /**
     * Отрисовка полоски прогресса
     */
    renderProgressBar() {
        // Фон полоски
        const bg = this.progressBarBg;
        bg.clear();

        // Градиентный фон
        for (let i = 0; i < this.barHeight; i++) {
            const t = i / (this.barHeight - 1);
            const r1 = 26, g1 = 20, b1 = 20;
            const r2 = 13, g2 = 10, b2 = 10;
            const r = Math.round(r1 + (r2 - r1) * t);
            const gr = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (gr << 8) + b;
            bg.beginFill(color);
            bg.drawRect(0, i, this.barWidth, 1);
            bg.endFill();
        }

        // Рамка
        bg.lineStyle(2, 0x3a2a1a);
        bg.drawRoundedRect(0, 0, this.barWidth, this.barHeight, 3);

        // Внутренняя подсветка
        bg.lineStyle(1, 0x6a5a4a, 0.2);
        bg.drawRoundedRect(3, 3, this.barWidth - 6, this.barHeight - 6, 2);

        // Заполнение
        this.renderProgressFill();

        // Текст процентов
        this.percentText.x = this.barWidth / 2;
        this.percentText.y = this.barHeight / 2;
    }

    /**
     * Отрисовка заполнения полоски (в стиле полоски опыта)
     */
    renderProgressFill() {
        const fill = this.progressBarFill;
        fill.clear();

        const fillWidth = Math.floor((this.barWidth - 6) * this.progress);
        if (fillWidth <= 0) return;

        const innerHeight = this.barHeight - 6;

        // Цвет в зависимости от прогресса (как у полоски опыта)
        let fillColor;
        if (this.progress < 0.3) {
            fillColor = 0x8bc34a; // Зелёный
        } else if (this.progress < 0.6) {
            fillColor = 0xffc107; // Жёлтый
        } else if (this.progress < 0.85) {
            fillColor = 0xff9800; // Оранжевый
        } else {
            fillColor = 0xff5722; // Красно-оранжевый
        }

        // Градиентное заполнение
        for (let i = 0; i < innerHeight; i++) {
            const t = i / (innerHeight - 1);
            // Создаём градиент от светлого к тёмному
            const baseColor = fillColor;
            const r = ((baseColor >> 16) & 0xff);
            const g = ((baseColor >> 8) & 0xff);
            const b = (baseColor & 0xff);

            // Варьируем яркость
            const brightness = 1.0 - t * 0.3;
            const nr = Math.round(r * brightness);
            const ng = Math.round(g * brightness);
            const nb = Math.round(b * brightness);
            const color = (nr << 16) + (ng << 8) + nb;

            fill.beginFill(color);
            fill.drawRoundedRect(3, 3 + i, fillWidth, 1, 1);
            fill.endFill();
        }

        // Блик сверху
        fill.beginFill(0xffffff, 0.15);
        fill.drawRoundedRect(3, 3, fillWidth, 3, 1);
        fill.endFill();
    }

    /**
     * Начало загрузки
     * @param {Function} onComplete - callback при завершении
     * @param {number} duration - длительность в мс (по умолчанию 2500)
     */
    start(onComplete, duration = 2500) {
        // Сначала открываем экран (вызовет reset())
        this.open();

        // Затем устанавливаем переменные загрузки
        this.onComplete = onComplete;
        this.progress = 0;
        this.targetProgress = 1;
        this.isLoading = true;
        this.loadingDuration = duration;
        this.startTime = performance.now();

        this.selectRandomTip();
        this.updatePosition();

        // Запускаем собственный цикл анимации
        this.startAnimationLoop();
    }

    /**
     * Собственный цикл анимации
     */
    startAnimationLoop() {
        const animate = () => {
            if (!this.isLoading) return;
            
            const elapsed = performance.now() - this.startTime;
            this.progress = Math.min(elapsed / this.loadingDuration, 1);
            
            // Обновляем отображение
            this.renderProgressFill();
            if (this.percentText) {
                this.percentText.text = `${Math.floor(this.progress * 100)}%`;
            }
            
            // Анимация точек
            if (this.loadingText) {
                const dots = '.'.repeat(Math.floor(elapsed / 500) % 4);
                this.loadingText.text = `Загрузка${dots}`;
            }
            
            // Проверяем завершение
            if (this.progress >= 1) {
                this.onLoadingComplete();
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
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
     * Обновление компонента (переопределяем для работы при загрузке)
     */
    update(deltaTime = 16.67) {
        // Всегда обновляем дочерние элементы
        for (const child of this.children) {
            if (child.update) {
                child.update(deltaTime);
            }
        }

        // Обновляем даже если не видимый (для корректной работы)
        if (this.needsUpdate) {
            this.render();
        }

        // Вызываем onUpdate для анимации загрузки
        this.onUpdate(deltaTime);
    }

    /**
     * Хук для обновления в подклассах
     */
    onUpdate(deltaTime) {
        // Анимация прогресса
        if (this.isLoading && this.progress < this.targetProgress) {
            this.progress += this.loadingSpeed;
            
            if (this.progress >= this.targetProgress) {
                this.progress = 1;
                this.onLoadingComplete();
            }
        }

        // Обновляем отображение только если идёт загрузка
        if (this.isLoading) {
            this.renderProgressFill();
            this.percentText.text = `${Math.floor(this.progress * 100)}%`;

            // Анимация точек в тексте загрузки
            this.updateLoadingTextAnimation(deltaTime);
        }
    }

    /**
     * Анимация текста загрузки
     */
    updateLoadingTextAnimation(deltaTime) {
        if (!this.dotsTimer) this.dotsTimer = 0;
        if (!this.dotsCount) this.dotsCount = 0;

        this.dotsTimer += deltaTime;
        if (this.dotsTimer >= 500) {
            this.dotsTimer = 0;
            this.dotsCount = (this.dotsCount + 1) % 4;
            const dots = '.'.repeat(this.dotsCount);
            this.loadingText.text = `Загрузка${dots}`;
        }
    }

    /**
     * Завершение загрузки
     */
    onLoadingComplete() {
        this.isLoading = false;
        this.loadingText.text = 'Готово!';

        // Вызываем callback через небольшую задержку
        setTimeout(() => {
            if (this.onComplete) {
                this.onComplete();
            }
        }, 300);
    }

    /**
     * Сброс состояния
     */
    reset() {
        this.progress = 0;
        this.targetProgress = 0;
        this.isLoading = false;
        this.onComplete = null;
        this.dotsTimer = 0;
        this.dotsCount = 0;
    }

    /**
     * Хук при открытии
     */
    onOpen() {
        this.reset();
        this.updatePosition();
    }

    /**
     * Хук при закрытии
     */
    onClose() {
        this.reset();
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
    module.exports = UILoadingScreen;
} else if (typeof window !== 'undefined') {
    window.UILoadingScreen = UILoadingScreen;
}