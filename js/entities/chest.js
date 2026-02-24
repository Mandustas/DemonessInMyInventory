/**
 * Класс сундука
 * Интерактивный объект с предметами и охранником
 * Выполнен в тёмном стиле Diablo с изометрической проекцией
 */
class Chest {
    /**
     * Конструктор сундука
     * @param {number} x - X координата в мировых координатах
     * @param {number} y - Y координата в мировых координатах
     * @param {number} tileX - X координата тайла
     * @param {number} tileY - Y координата тайла
     */
    constructor(x, y, tileX, tileY) {
        this.x = x;
        this.y = y;
        this.tileX = tileX;
        this.tileY = tileY;
        
        // Уникальный ID сундука
        this.id = `chest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Состояние сундука
        this.opened = false;
        this.opening = false;
        this.openProgress = 0;
        
        // Предметы внутри
        this.items = [];
        this.itemsCount = 0;
        
        // Графические элементы
        this.container = null;
        this.baseSprite = null;
        this.lidSprite = null;
        this.lockSprite = null;
        this.glowSprite = null;
        this.shadowSprite = null;
        this.innerSprite = null;
        
        // Анимация
        this.animTime = 0;
        this.glowPhase = Math.random() * Math.PI * 2;
        
        // Звуковые эффекты
        this.openSound = null;
        
        // Состояние
        this.active = true;
        this.initialized = false;
        
        // Охранник рядом с сундуком
        this.guardian = null;
        this.guardianSpawned = false;
    }
    
    /**
     * Инициализация сундука
     * @param {PIXI.Container} parentContainer - родительский контейнер
     */
    init(parentContainer) {
        if (this.initialized) return;

        // Создаём графический контейнер
        this.container = new PIXI.Container();
        this.container.x = this.x;
        this.container.y = this.y;
        this.container.eventMode = 'static';
        this.container.cursor = 'pointer';

        // Добавляем интерактивность
        this.container.on('pointerdown', (e) => this.onClick(e));
        this.container.on('pointerover', () => this.onHover());
        this.container.on('pointerout', () => this.onHoverOut());

        // Создаём графику сундука в порядке слоёв
        this.createShadow();          // 1. Тень под сундуком
        this.createGlowEffect();      // 2. Свечение
        this.createBaseSprite();      // 3. Основание (корпус)
        this.createInnerSprite();     // 4. Внутренность (видна при открытии)
        this.createLidSprite();       // 5. Крышка
        this.createLockSprite();      // 6. Замок
        
        // Добавляем в родительский контейнер
        if (parentContainer) {
            parentContainer.addChild(this.container);
        }
        
        this.initialized = true;
    }
    
    /**
     * Создание тени под сундуком
     */
    createShadow() {
        const graphics = new PIXI.Graphics();
        
        // Изометрические размеры
        const shadowWidth = 52;
        const shadowHeight = 26;
        
        // Мягкая эллиптическая тень
        graphics.beginFill(0x000000, 0.4);
        graphics.drawEllipse(0, 22, shadowWidth / 2, shadowHeight / 2);
        graphics.endFill();
        
        // Дополнительный слой тени для глубины
        graphics.beginFill(0x000000, 0.2);
        graphics.drawEllipse(2, 24, shadowWidth / 2 + 4, shadowHeight / 2 + 2);
        graphics.endFill();
        
        this.shadowSprite = graphics;
        this.container.addChild(this.shadowSprite);
    }
    
    /**
     * Создание основания сундука (изометрический вид)
     * Реалистичный деревянный сундук с металлическими полосами
     */
    createBaseSprite() {
        const graphics = new PIXI.Graphics();

        // Изометрические размеры (соотношение 2:1 как в тайлах)
        const isoWidth = 48;
        const isoDepth = 24;
        const bodyHeight = 16; // Высота корпуса
        
        // Цвета в стиле Diablo - тёмные, насыщенные
        const woodDark = 0x1a0f08;     // Самый тёмный (тени, внутренность)
        const woodMid = 0x2d1f12;      // Средний (боковые стенки)
        const woodLight = 0x3d2815;    // Основной (передняя стенка)
        const woodHighlight = 0x4a3520; // Подсветка
        const metalDark = 0x2a2015;    // Тёмный металл
        const metalMid = 0x4a3a28;     // Основной металл
        const metalLight = 0x6a5a40;   // Светлый металл (блики)
        const rivetColor = 0x8a7a60;   // Заклёпки
        
        // === НИЖНЯЯ ГРАНЬ (дно сундука) ===
        graphics.beginFill(woodDark);
        graphics.moveTo(0, bodyHeight);
        graphics.lineTo(isoWidth / 2, bodyHeight + isoDepth / 2);
        graphics.lineTo(0, bodyHeight + isoDepth);
        graphics.lineTo(-isoWidth / 2, bodyHeight + isoDepth / 2);
        graphics.closePath();
        graphics.endFill();
        
        // === ПРАВАЯ БОКОВАЯ СТЕНКА ===
        graphics.beginFill(woodMid);
        graphics.moveTo(isoWidth / 2, bodyHeight + isoDepth / 2);
        graphics.lineTo(isoWidth / 2, isoDepth / 2);
        graphics.lineTo(0, 0);
        graphics.lineTo(0, bodyHeight);
        graphics.closePath();
        graphics.endFill();
        
        // Текстура дерева - вертикальные линии
        graphics.lineStyle(0.5, woodDark, 0.4);
        for (let i = 0; i < 4; i++) {
            const offsetX = isoWidth / 4 + i * 6;
            graphics.moveTo(offsetX, isoDepth / 2 + bodyHeight / 2);
            graphics.lineTo(offsetX - 6, isoDepth / 2);
        }
        
        // === ЛЕВАЯ БОКОВАЯ СТЕНКА ===
        graphics.beginFill(woodDark);
        graphics.moveTo(-isoWidth / 2, bodyHeight + isoDepth / 2);
        graphics.lineTo(-isoWidth / 2, isoDepth / 2);
        graphics.lineTo(0, 0);
        graphics.lineTo(0, bodyHeight);
        graphics.closePath();
        graphics.endFill();
        
        // Текстура дерева
        graphics.lineStyle(0.5, 0x0a0502, 0.3);
        for (let i = 0; i < 4; i++) {
            const offsetX = -isoWidth / 4 - i * 6;
            graphics.moveTo(offsetX, isoDepth / 2 + bodyHeight / 2);
            graphics.lineTo(offsetX + 6, isoDepth / 2);
        }
        
        // === ПЕРЕДНЯЯ СТЕНКА (основная видимая поверхность) ===
        graphics.beginFill(woodLight);
        graphics.moveTo(-isoWidth / 2, bodyHeight + isoDepth / 2);
        graphics.lineTo(isoWidth / 2, bodyHeight + isoDepth / 2);
        graphics.lineTo(isoWidth / 2, isoDepth / 2);
        graphics.lineTo(-isoWidth / 2, isoDepth / 2);
        graphics.closePath();
        graphics.endFill();
        
        // Текстура дерева - горизонтальные линии
        graphics.lineStyle(0.5, woodDark, 0.3);
        for (let i = 0; i < 3; i++) {
            const y = isoDepth / 2 + 4 + i * 5;
            graphics.moveTo(-isoWidth / 2 + 2, y);
            graphics.lineTo(isoWidth / 2 - 2, y);
        }
        
        // === МЕТАЛЛИЧЕСКИЕ ПОЛОСЫ (вертикальные) ===
        const stripWidth = 5;
        
        // Левая вертикальная полоса
        graphics.lineStyle(0);
        graphics.beginFill(metalMid);
        graphics.drawRect(-isoWidth / 2 + 6, isoDepth / 2 + 1, stripWidth, bodyHeight - 2);
        graphics.endFill();
        
        // Блик на левой полосе
        graphics.beginFill(metalLight, 0.4);
        graphics.drawRect(-isoWidth / 2 + 6, isoDepth / 2 + 1, stripWidth, 3);
        graphics.endFill();
        
        // Правая вертикальная полоса
        graphics.beginFill(metalMid);
        graphics.drawRect(isoWidth / 2 - 11, isoDepth / 2 + 1, stripWidth, bodyHeight - 2);
        graphics.endFill();
        
        // Блик на правой полосе
        graphics.beginFill(metalLight, 0.4);
        graphics.drawRect(isoWidth / 2 - 11, isoDepth / 2 + 1, stripWidth, 3);
        graphics.endFill();
        
        // Центральная вертикальная полоса
        graphics.beginFill(metalMid);
        graphics.drawRect(-3, isoDepth / 2 + 1, 6, bodyHeight - 2);
        graphics.endFill();
        
        // === ГОРИЗОНТАЛЬНАЯ МЕТАЛЛИЧЕСКАЯ ПОЛОСА ===
        graphics.beginFill(metalDark, 0.8);
        graphics.drawRect(-isoWidth / 2 + 2, isoDepth / 2 + bodyHeight / 2 - 2, isoWidth - 4, 4);
        graphics.endFill();
        
        // === ЗАКЛЁПКИ ===
        const rivetRadius = 1.5;
        
        // Заклёпки на левой полосе
        graphics.beginFill(rivetColor);
        graphics.drawCircle(-isoWidth / 2 + 8, isoDepth / 2 + 3, rivetRadius);
        graphics.drawCircle(-isoWidth / 2 + 8, isoDepth / 2 + bodyHeight / 2, rivetRadius);
        graphics.drawCircle(-isoWidth / 2 + 8, bodyHeight + isoDepth / 2 - 3, rivetRadius);
        graphics.endFill();
        
        // Блики на заклёпках
        graphics.beginFill(0xaa9a80, 0.6);
        graphics.drawCircle(-isoWidth / 2 + 7, isoDepth / 2 + 2, 0.8);
        graphics.drawCircle(-isoWidth / 2 + 7, isoDepth / 2 + bodyHeight / 2 - 1, 0.8);
        graphics.drawCircle(-isoWidth / 2 + 7, bodyHeight + isoDepth / 2 - 4, 0.8);
        graphics.endFill();
        
        // Заклёпки на правой полосе
        graphics.beginFill(rivetColor);
        graphics.drawCircle(isoWidth / 2 - 9, isoDepth / 2 + 3, rivetRadius);
        graphics.drawCircle(isoWidth / 2 - 9, isoDepth / 2 + bodyHeight / 2, rivetRadius);
        graphics.drawCircle(isoWidth / 2 - 9, bodyHeight + isoDepth / 2 - 3, rivetRadius);
        graphics.endFill();
        
        // Блики на заклёпках
        graphics.beginFill(0xaa9a80, 0.6);
        graphics.drawCircle(isoWidth / 2 - 10, isoDepth / 2 + 2, 0.8);
        graphics.drawCircle(isoWidth / 2 - 10, isoDepth / 2 + bodyHeight / 2 - 1, 0.8);
        graphics.drawCircle(isoWidth / 2 - 10, bodyHeight + isoDepth / 2 - 4, 0.8);
        graphics.endFill();
        
        // === ВЕРХНЯЯ КРОМКА (обод) ===
        graphics.lineStyle(2, metalMid, 0.9);
        graphics.moveTo(-isoWidth / 2, isoDepth / 2);
        graphics.lineTo(0, 0);
        graphics.lineTo(isoWidth / 2, isoDepth / 2);
        
        // Угловые металлические уголки
        graphics.lineStyle(0);
        graphics.beginFill(metalMid);
        // Левый уголок
        graphics.moveTo(-isoWidth / 2, isoDepth / 2);
        graphics.lineTo(-isoWidth / 2 + 4, isoDepth / 2 - 2);
        graphics.lineTo(-isoWidth / 2 + 4, isoDepth / 2 + 4);
        graphics.lineTo(-isoWidth / 2, isoDepth / 2 + 2);
        graphics.closePath();
        graphics.endFill();
        
        // Правый уголок
        graphics.beginFill(metalMid);
        graphics.moveTo(isoWidth / 2, isoDepth / 2);
        graphics.lineTo(isoWidth / 2 - 4, isoDepth / 2 - 2);
        graphics.lineTo(isoWidth / 2 - 4, isoDepth / 2 + 4);
        graphics.lineTo(isoWidth / 2, isoDepth / 2 + 2);
        graphics.closePath();
        graphics.endFill();
        
        this.baseSprite = graphics;
        this.container.addChild(this.baseSprite);
    }
    
    /**
     * Создание внутренней части сундука (видна при открытии)
     */
    createInnerSprite() {
        const graphics = new PIXI.Graphics();
        
        const isoWidth = 44;
        const isoDepth = 22;
        
        // Внутренность сундука - тёмная, с золотым отблеском
        graphics.beginFill(0x0a0502);
        graphics.moveTo(0, 0);
        graphics.lineTo(isoWidth / 2, isoDepth / 2);
        graphics.lineTo(0, isoDepth);
        graphics.lineTo(-isoWidth / 2, isoDepth / 2);
        graphics.closePath();
        graphics.endFill();
        
        // Золотой отблеск внутри (намёк на сокровища)
        graphics.beginFill(0x3a2a10, 0.5);
        graphics.drawEllipse(0, isoDepth / 2, isoWidth / 4, isoDepth / 4);
        graphics.endFill();
        
        // Точки-блики (золото)
        graphics.beginFill(0x5a4a20, 0.6);
        graphics.drawCircle(-5, isoDepth / 2 - 2, 2);
        graphics.drawCircle(4, isoDepth / 2 + 1, 1.5);
        graphics.drawCircle(-2, isoDepth / 2 + 3, 1);
        graphics.endFill();
        
        this.innerSprite = graphics;
        this.innerSprite.alpha = 0;
        this.container.addChild(this.innerSprite);
    }

    /**
     * Создание крышки сундука (изометрическая)
     * Детализированная крышка с изгибом и металлическими элементами
     */
    createLidSprite() {
        const graphics = new PIXI.Graphics();

        // Изометрические размеры
        const isoWidth = 48;
        const isoDepth = 24;
        const lidHeight = 8; // Высота купола крышки
        
        // Цвета
        const woodDark = 0x1a0f08;
        const woodMid = 0x2d1f12;
        const woodLight = 0x3d2815;
        const woodHighlight = 0x4a3520;
        const metalMid = 0x4a3a28;
        const metalLight = 0x6a5a40;
        
        // === ВЕРХНЯЯ ПОВЕРХНОСТЬ КРЫШКИ (изогнутый купол) ===
        
        // Правая половина верхней поверхности
        graphics.beginFill(woodHighlight);
        graphics.moveTo(0, -lidHeight - isoDepth / 2);
        graphics.lineTo(isoWidth / 2, -lidHeight);
        graphics.lineTo(isoWidth / 2, 0);
        graphics.lineTo(0, isoDepth / 2);
        graphics.closePath();
        graphics.endFill();
        
        // Левая половина верхней поверхности (темнее)
        graphics.beginFill(woodLight);
        graphics.moveTo(0, -lidHeight - isoDepth / 2);
        graphics.lineTo(-isoWidth / 2, -lidHeight);
        graphics.lineTo(-isoWidth / 2, 0);
        graphics.lineTo(0, isoDepth / 2);
        graphics.closePath();
        graphics.endFill();
        
        // Центральный блик на крышке
        graphics.beginFill(woodHighlight, 0.5);
        graphics.moveTo(-isoWidth / 4, -lidHeight - isoDepth / 4);
        graphics.lineTo(isoWidth / 4, -lidHeight - isoDepth / 4);
        graphics.lineTo(isoWidth / 4, isoDepth / 4);
        graphics.lineTo(-isoWidth / 4, isoDepth / 4);
        graphics.closePath();
        graphics.endFill();
        
        // === ПЕРЕДНИЙ СРЕЗ КРЫШКИ ===
        
        // Основная передняя поверхность
        graphics.beginFill(woodMid);
        graphics.moveTo(-isoWidth / 2, 0);
        graphics.lineTo(isoWidth / 2, 0);
        graphics.lineTo(isoWidth / 2, isoDepth / 4);
        graphics.lineTo(-isoWidth / 2, isoDepth / 4);
        graphics.closePath();
        graphics.endFill();
        
        // Изгиб крышки
        graphics.beginFill(woodLight, 0.7);
        graphics.moveTo(-isoWidth / 2, isoDepth / 4);
        graphics.quadraticCurveTo(0, isoDepth / 2 + 2, isoWidth / 2, isoDepth / 4);
        graphics.lineTo(isoWidth / 2, isoDepth / 4 - 2);
        graphics.quadraticCurveTo(0, isoDepth / 2, -isoWidth / 2, isoDepth / 4 - 2);
        graphics.closePath();
        graphics.endFill();
        
        // === МЕТАЛЛИЧЕСКИЙ ОБВОД КРЫШКИ ===
        
        // Верхняя металлическая полоса
        graphics.beginFill(metalMid);
        graphics.moveTo(-isoWidth / 2 + 3, -lidHeight - isoDepth / 4);
        graphics.lineTo(isoWidth / 2 - 3, -lidHeight - isoDepth / 4);
        graphics.lineTo(isoWidth / 2 - 5, -lidHeight - isoDepth / 4 + 3);
        graphics.lineTo(-isoWidth / 2 + 5, -lidHeight - isoDepth / 4 + 3);
        graphics.closePath();
        graphics.endFill();
        
        // Блик на металлической полосе
        graphics.beginFill(metalLight, 0.5);
        graphics.moveTo(-isoWidth / 4, -lidHeight - isoDepth / 4 + 1);
        graphics.lineTo(isoWidth / 4, -lidHeight - isoDepth / 4 + 1);
        graphics.lineTo(isoWidth / 4, -lidHeight - isoDepth / 4 + 2);
        graphics.lineTo(-isoWidth / 4, -lidHeight - isoDepth / 4 + 2);
        graphics.closePath();
        graphics.endFill();
        
        // Передняя металлическая полоса
        graphics.beginFill(metalMid);
        graphics.drawRect(-isoWidth / 2 + 2, 0, isoWidth - 4, 3);
        graphics.endFill();
        
        // === ТЕКСТУРА ДЕРЕВА НА КРЫШКЕ ===
        graphics.lineStyle(0.5, woodDark, 0.25);
        graphics.moveTo(-isoWidth / 2 + 4, -lidHeight / 2 - isoDepth / 4);
        graphics.lineTo(isoWidth / 2 - 4, -lidHeight / 2 - isoDepth / 4);
        graphics.moveTo(-isoWidth / 2 + 4, -lidHeight / 2);
        graphics.lineTo(isoWidth / 2 - 4, -lidHeight / 2);
        
        // === ЗАКЛЁПКИ НА КРЫШКЕ ===
        const rivetColor = 0x8a7a60;
        
        graphics.lineStyle(0);
        graphics.beginFill(rivetColor);
        // Верхние заклёпки
        graphics.drawCircle(-isoWidth / 2 + 6, -lidHeight - isoDepth / 4 + 2, 1.5);
        graphics.drawCircle(isoWidth / 2 - 6, -lidHeight - isoDepth / 4 + 2, 1.5);
        graphics.drawCircle(0, -lidHeight - isoDepth / 2 + 3, 1.5);
        // Передние заклёпки
        graphics.drawCircle(-isoWidth / 2 + 6, 1.5, 1.5);
        graphics.drawCircle(isoWidth / 2 - 6, 1.5, 1.5);
        graphics.endFill();
        
        // Блики на заклёпках
        graphics.beginFill(0xaa9a80, 0.5);
        graphics.drawCircle(-isoWidth / 2 + 5, -lidHeight - isoDepth / 4 + 1, 0.7);
        graphics.drawCircle(isoWidth / 2 - 7, -lidHeight - isoDepth / 4 + 1, 0.7);
        graphics.drawCircle(-1, -lidHeight - isoDepth / 2 + 2, 0.7);
        graphics.endFill();
        
        // === КОНТУР КРЫШКИ ===
        graphics.lineStyle(1, woodDark, 0.5);
        graphics.moveTo(-isoWidth / 2, 0);
        graphics.lineTo(0, -lidHeight - isoDepth / 2);
        graphics.lineTo(isoWidth / 2, 0);
        
        this.lidSprite = graphics;
        this.lidSprite.y = 0;
        this.lidSprite.pivot.y = 0;
        this.container.addChild(this.lidSprite);
    }

    /**
     * Создание замка (изометрический)
     * Детализированный замок в стиле Diablo
     */
    createLockSprite() {
        const graphics = new PIXI.Graphics();

        const isoDepth = 24;
        const lockX = 0;
        const lockY = isoDepth / 4 + 2;
        
        // Цвета металла
        const metalDark = 0x2a2015;
        const metalMid = 0x5a4a38;
        const metalLight = 0x8a7a60;
        const metalHighlight = 0xaa9a78;
        
        // === ЗАДНЯЯ ПЛАСТИНА ЗАМКА ===
        graphics.beginFill(metalDark);
        graphics.drawRoundedRect(lockX - 8, lockY - 10, 16, 18, 3);
        graphics.endFill();
        
        // === ОСНОВНАЯ ЧАСТЬ ЗАМКА ===
        graphics.beginFill(metalMid);
        graphics.drawRoundedRect(lockX - 7, lockY - 9, 14, 16, 2);
        graphics.endFill();
        
        // Верхняя часть замка (декоративная)
        graphics.beginFill(metalLight);
        graphics.moveTo(lockX - 6, lockY - 9);
        graphics.lineTo(lockX + 6, lockY - 9);
        graphics.lineTo(lockX + 5, lockY - 5);
        graphics.lineTo(lockX - 5, lockY - 5);
        graphics.closePath();
        graphics.endFill();
        
        // === ЗАМОЧНАЯ СКВАЖИНА ===
        graphics.beginFill(0x0a0502);
        // Круглая часть
        graphics.drawCircle(lockX, lockY - 2, 2.5);
        // Прямоугольная часть
        graphics.drawRect(lockX - 1, lockY - 2, 2, 6);
        graphics.endFill();
        
        // === ДЕКОРАТИВНЫЕ ЭЛЕМЕНТЫ ЗАМКА ===
        
        // Блик на замке
        graphics.beginFill(metalHighlight, 0.6);
        graphics.drawEllipse(lockX - 3, lockY - 6, 2, 3);
        graphics.endFill();
        
        // Нижний край замка
        graphics.beginFill(metalDark, 0.7);
        graphics.drawRect(lockX - 5, lockY + 4, 10, 2);
        graphics.endFill();
        
        // === КОЛЬЦО ДЛЯ КЛЮЧА ===
        graphics.lineStyle(2, metalLight, 0.9);
        graphics.drawCircle(lockX, lockY - 12, 3);
        
        // Блик на кольце
        graphics.lineStyle(1.5, metalHighlight, 0.7);
        graphics.arc(lockX, lockY - 12, 3, -Math.PI * 0.7, -Math.PI * 0.2);
        
        this.lockSprite = graphics;
        this.container.addChild(this.lockSprite);
    }
    
    /**
     * Создание эффекта свечения
     */
    createGlowEffect() {
        const graphics = new PIXI.Graphics();

        const isoWidth = 48;
        const isoDepth = 24;
        
        // Свечение под сундуком (эллиптическое)
        const glowWidth = isoWidth * 0.8;
        const glowHeight = isoDepth * 0.6;
        
        // Многослойное свечение
        for (let i = 1; i <= 6; i++) {
            const alpha = (1 - i / 7) * 0.08;
            graphics.beginFill(0xffa500, alpha); // Тёплый оранжевый
            graphics.drawEllipse(0, isoDepth / 2 + 4, glowWidth * (i / 6), glowHeight * (i / 6));
            graphics.endFill();
        }
        
        // Свечение вокруг замка
        for (let i = 1; i <= 3; i++) {
            const alpha = (1 - i / 4) * 0.15;
            graphics.beginFill(0xffd700, alpha); // Золотой
            graphics.drawEllipse(0, isoDepth / 4, 10 * (i / 3), 12 * (i / 3));
            graphics.endFill();
        }
        
        this.glowSprite = graphics;
        this.glowSprite.blendMode = PIXI.BLEND_MODES.ADD;
        this.glowSprite.alpha = 0.35;
        this.container.addChildAt(this.glowSprite, 0);
    }
    
    /**
     * Обработка клика
     * @param {PIXI.FederatedEvent} e - событие клика
     */
    onClick(e) {
        if (this.opened || this.opening) return;
        
        e.stopPropagation();
        this.open();
    }
    
    /**
     * Обработка наведения
     */
    onHover() {
        if (this.opened) return;
        
        if (this.glowSprite) {
            this.glowSprite.alpha = 0.9;
        }
        
        this.container.scale.set(1.05);
    }
    
    /**
     * Обработка ухода курсора
     */
    onHoverOut() {
        if (this.glowSprite) {
            this.glowSprite.alpha = 0.6;
        }
        
        this.container.scale.set(1);
    }
    
    /**
     * Открытие сундука
     */
    open() {
        if (this.opened || this.opening) return;
        
        this.opening = true;
        this.generateItems();
        
        const openAnimation = () => {
            this.openProgress += 0.04;
            
            if (this.openProgress >= 1) {
                this.opening = false;
                this.opened = true;
                this.onOpened();
                return;
            }
            
            // Плавная анимация крышки с эффектом подпрыгивания
            const easeProgress = this.easeOutBack(this.openProgress);
            
            if (this.lidSprite) {
                // Крышка поднимается и откидывается назад
                this.lidSprite.y = -easeProgress * 12;
                this.lidSprite.rotation = -easeProgress * 0.7;
                this.lidSprite.alpha = 1 - this.openProgress * 0.3;
            }
            
            if (this.lockSprite) {
                // Замок исчезает с эффектом
                this.lockSprite.alpha = 1 - this.openProgress;
                this.lockSprite.y = -this.openProgress * 5;
            }
            
            // Показываем внутренность сундука
            if (this.innerSprite) {
                this.innerSprite.alpha = Math.min(1, this.openProgress * 2);
            }
            
            requestAnimationFrame(openAnimation);
        };
        
        openAnimation();
        this.playOpenSound();
    }
    
    /**
     * Функция плавности для анимации (ease out back)
     * @param {number} t - прогресс анимации (0-1)
     * @returns {number} - сглаженное значение
     */
    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    
    /**
     * Генерация предметов в сундуке
     */
    generateItems() {
        const chestConfig = GAME_CONFIG.MAP.CHESTS;
        const itemsMin = chestConfig.ITEMS_MIN || 1;
        const itemsMax = chestConfig.ITEMS_MAX || 2;
        
        this.itemsCount = Math.floor(Math.random() * (itemsMax - itemsMin + 1)) + itemsMin;
        
        for (let i = 0; i < this.itemsCount; i++) {
            const item = generateRandomItem();
            this.items.push(item);
        }
    }
    
    /**
     * Обработка после открытия
     */
    onOpened() {
        if (window.game && window.game.itemDropSystem) {
            for (const item of this.items) {
                const offsetX = (Math.random() - 0.5) * 40;
                const offsetY = (Math.random() - 0.5) * 40;
                
                window.game.itemDropSystem.createItemDrop(
                    item,
                    this.x + offsetX,
                    this.y + offsetY
                );
            }
        }
        
        if (window.game && window.game.uiActionLog) {
            window.game.uiActionLog.addMessage(`Сундук открыт! Получено предметов: ${this.itemsCount}`);
        }
        
        if (this.glowSprite) {
            this.glowSprite.alpha = 0;
        }
    }
    
    /**
     * Воспроизведение звука открытия
     */
    playOpenSound() {
        if (window.game && window.game.audioSystem) {
            window.game.audioSystem.playSFX('ui/chest', 'ui');
        }
    }
    
    /**
     * Обновление сундука
     * @param {number} deltaTime - время с последнего обновления в мс
     */
    update(deltaTime) {
        if (!this.active || !this.initialized) return;
        
        this.animTime += deltaTime / 1000;
        
        if (!this.opened && this.glowSprite) {
            const pulse = Math.sin(this.animTime * 1.5 + this.glowPhase) * 0.15 + 0.4;
            this.glowSprite.alpha = pulse;
        }
        
        if (!this.opened && this.container) {
            const sway = Math.sin(this.animTime * 1) * 0.01;
            this.container.rotation = sway;
        }
    }
    
    /**
     * Удаление сундука
     * @param {PIXI.Container} parentContainer - родительский контейнер
     */
    destroy(parentContainer) {
        this.active = false;
        
        if (parentContainer && this.container) {
            parentContainer.removeChild(this.container);
        }
        
        if (this.container) {
            this.container.destroy({ children: true });
        }
        
        this.initialized = false;
    }
    
    /**
     * Сериализация сундука
     * @returns {Object} - данные для сохранения
     */
    serialize() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            tileX: this.tileX,
            tileY: this.tileY,
            opened: this.opened,
            items: this.items
        };
    }
    
    /**
     * Десериализация сундука
     * @param {Object} data - данные для восстановления
     * @returns {Chest} - восстановленный сундук
     */
    static deserialize(data) {
        const chest = new Chest(data.x, data.y, data.tileX, data.tileY);
        chest.opened = data.opened;
        chest.items = data.items || [];
        return chest;
    }
}

/**
 * Менеджер сундуков
 * Управляет всеми сундуками в игровом мире
 */
class ChestManager {
    constructor() {
        this.chests = new Map();
        this.container = new PIXI.Container();
        this.container.sortableChildren = true;
        this.initialized = false;
        this.generatedChunks = new Set();
    }
    
    init() {
        this.initialized = true;
    }
    
    addChest(x, y, tileX, tileY) {
        const chestConfig = GAME_CONFIG.MAP.CHESTS;
        const maxChests = chestConfig.MAX_CHESTS || 20;
        
        if (this.chests.size >= maxChests) {
            return null;
        }
        
        const chest = new Chest(x, y, tileX, tileY);
        chest.init(this.container);
        this.chests.set(chest.id, chest);
        
        this.spawnGuardian(chest, tileX, tileY);
        
        return chest;
    }
    
    spawnGuardian(chest, tileX, tileY) {
        const chestConfig = GAME_CONFIG.MAP.CHESTS;
        
        if (Math.random() > chestConfig.GUARDIAN_SPAWN_CHANCE) {
            return;
        }
        
        const enemyTypes = window.game ? window.game.chunkSystem.getEnemyTypes() : ['TANK'];
        const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        const guardianDistance = chestConfig.GUARDIAN_DISTANCE || 3;
        const spawnPositions = this.findGuardianSpawnPosition(tileX, tileY, guardianDistance);
        
        if (spawnPositions.length > 0 && window.game) {
            const pos = spawnPositions[0];
            const worldPos = isoTo2D(pos.x, pos.y);
            
            window.game.createEnemy(worldPos.x, worldPos.y, randomType);
            chest.guardianSpawned = true;
        }
    }
    
    findGuardianSpawnPosition(centerX, centerY, radius) {
        const positions = [];
        const chunkSystem = window.game ? window.game.chunkSystem : null;
        
        if (!chunkSystem) return positions;
        
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
            const checkX = Math.floor(centerX + Math.cos(angle) * radius);
            const checkY = Math.floor(centerY + Math.sin(angle) * radius);
            
            if (chunkSystem.isTilePassable(checkX, checkY)) {
                positions.push({ x: checkX, y: checkY });
            }
        }
        
        return positions;
    }
    
    removeChest(id) {
        const chest = this.chests.get(id);
        if (chest) {
            chest.destroy(this.container);
            this.chests.delete(id);
        }
    }
    
    getChest(id) {
        return this.chests.get(id) || null;
    }
    
    generateChests(chunks, tileSize, playerPos) {
        const chestConfig = GAME_CONFIG.MAP.CHESTS;
        const minDistance = chestConfig.MIN_DISTANCE * tileSize;
        const minDistanceFromPlayer = chestConfig.MIN_DISTANCE_FROM_PLAYER || 20;
        
        for (const [chunkKey, chunk] of chunks) {
            if (!chunk.generated && !chunk.isLoaded) continue;
            if (!chunk.tiles) continue;
            if (this.generatedChunks.has(chunkKey)) continue;
            
            const chunkSize = chunk.tiles.length;
            
            for (let y = 0; y < chunkSize; y++) {
                for (let x = 0; x < chunkSize; x++) {
                    const tile = chunk.tiles[y][x];
                    
                    if (tile !== 0 && tile !== 6) continue;
                    if (Math.random() > chestConfig.SPAWN_CHANCE) continue;
                    
                    const tileX = chunk.x * chunkSize + x;
                    const tileY = chunk.y * chunkSize + y;
                    
                    const dx = tileX - playerPos.x;
                    const dy = tileY - playerPos.y;
                    const distanceFromPlayer = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distanceFromPlayer < minDistanceFromPlayer) continue;
                    
                    const screenPos = isoTo2D(tileX, tileY);
                    const worldX = screenPos.x + tileSize / 2;
                    const worldY = screenPos.y + tileSize / 2;
                    
                    let tooClose = false;
                    for (const chest of this.chests.values()) {
                        const cDx = chest.x - worldX;
                        const cDy = chest.y - worldY;
                        if (Math.sqrt(cDx * cDx + cDy * cDy) < minDistance) {
                            tooClose = true;
                            break;
                        }
                    }
                    
                    if (!tooClose) {
                        this.addChest(worldX, worldY, tileX, tileY);
                    }
                }
            }
            
            this.generatedChunks.add(chunkKey);
        }
    }
    
    update(deltaTime) {
        for (const chest of this.chests.values()) {
            chest.update(deltaTime);
        }
    }
    
    cullChests(playerX, playerY, radius, tileSize = GAME_CONFIG.TILE.BASE_SIZE) {
        const toRemove = [];
        const chunksToUnmark = new Set();
        const chunkSize = 16;
        
        for (const [id, chest] of this.chests) {
            const dx = chest.x - playerX;
            const dy = chest.y - playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > radius) {
                toRemove.push(id);
                
                const tileX = Math.floor(chest.tileX / chunkSize);
                const tileY = Math.floor(chest.tileY / chunkSize);
                const chunkKey = `${tileX},${tileY}`;
                chunksToUnmark.add(chunkKey);
            }
        }
        
        for (const id of toRemove) {
            this.removeChest(id);
        }
        
        for (const chunkKey of chunksToUnmark) {
            this.generatedChunks.delete(chunkKey);
        }
    }
    
    clearGeneratedChunks() {
        this.generatedChunks.clear();
    }
    
    getContainer() {
        return this.container;
    }
    
    serialize() {
        return Array.from(this.chests.values()).map(c => c.serialize());
    }
    
    deserialize(data) {
        this.clear();
        
        for (const chestData of data) {
            const chest = Chest.deserialize(chestData);
            chest.init(this.container);
            this.chests.set(chest.id, chest);
        }
    }
    
    clear() {
        for (const chest of this.chests.values()) {
            chest.destroy(this.container);
        }
        this.chests.clear();
        this.generatedChunks.clear();
    }
    
    getCount() {
        return this.chests.size;
    }
}

// Экспорт
if (typeof window !== 'undefined') {
    window.Chest = Chest;
    window.ChestManager = ChestManager;
}