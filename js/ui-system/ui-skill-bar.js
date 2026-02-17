/**
 * UISkillBar - панель навыков на новой системе UI
 * Отображает полоски здоровья и маны, слоты для навыков и полоску опыта
 * Полностью соответствует стилю из skill-bar.js (DOM version)
 */
class UISkillBar extends UIComponent {
    constructor(character, config = {}) {
        super(config);
        
        this.character = character;
        this.hotkeys = {}; // Сопоставление горячих клавиш с навыками
        this.skillElements = {}; // Элементы UI для каждого слота
        
        // Размеры из конфига
        this.slotSize = 50; // GAME_CONFIG.UI.SKILL_BAR.SLOT_WIDTH
        this.slotGap = 5;   // GAME_CONFIG.UI.SKILL_BAR.SLOT_GAP
        this.circularBarSize = 60; // GAME_CONFIG.UI.SKILL_BAR.HEALTH_MANA_WIDTH
        
        // Ссылка на игру
        this.game = null;
        
        // Компоненты для круговых баров
        this.healthCircleContainer = null;
        this.manaCircleContainer = null;
        
        // Позиционирование внизу экрана
        this.config.positionKey = 'skillBar';
    }
    
    /**
     * Хук инициализации
     */
    onInit() {
        // Вычисляем размеры
        const totalSlotsWidth = 9 * this.slotSize + 8 * this.slotGap;
        const barPadding = 8;
        this.width = totalSlotsWidth + barPadding * 2 + this.circularBarSize * 2 + 30; // +orb+gap+orb
        this.height = this.circularBarSize + 30; // + место для полоски опыта
        
        // Создаем основные контейнеры
        this.createHealthManaBars();
        this.createSkillBarUI();
        this.createExperienceBar();
        
        // Обновляем отображение
        this.updateHealthManaDisplay();
        this.updateExperienceBar();
    }
    
    /**
     * Создание полосок здоровья и маны (SVG-подобные круги как в старом UI)
     */
    createHealthManaBars() {
        // Левая панель - Здоровье (круг)
        this.healthCircleContainer = new PIXI.Container();
        this.healthCircleContainer.x = 0;
        this.healthCircleContainer.y = (this.circularBarSize - 60) / 2;
        this.container.addChild(this.healthCircleContainer);
        
        // Создаем SVG-подобный круг здоровья
        this.createCircularBar(this.healthCircleContainer, 'health');
        
        // Правая панель - Мана (круг)
        this.manaCircleContainer = new PIXI.Container();
        this.manaCircleContainer.x = this.width - this.circularBarSize;
        this.manaCircleContainer.y = (this.circularBarSize - 60) / 2;
        this.container.addChild(this.manaCircleContainer);
        
        // Создаем SVG-подобный круг маны
        this.createCircularBar(this.manaCircleContainer, 'mana');
    }
    
    /**
     * Создание кругового прогресс-бара (как SVG circle в старом UI)
     */
    createCircularBar(container, type) {
        const radius = 26;
        const circumference = 2 * Math.PI * radius; // ~163.36
        
        // Создаем Graphics для круга
        const circleGraphics = new PIXI.Graphics();
        
        // Внешний контур (border)
        const borderColor = type === 'health' ? 0x8b0000 : 0x00008b;
        const fillColor = type === 'health' ? 0xff0000 : 0x0000ff;
        
        // Рисуем фоновый круг
        circleGraphics.lineStyle(4, 0x1a1a1a);
        circleGraphics.drawCircle(30, 30, radius);
        
        container.addChild(circleGraphics);
        
        // Создаем прогресс (заполняемый круг)
        const progressGraphics = new PIXI.Graphics();
        progressGraphics.name = 'progress';
        container.addChild(progressGraphics);
        
        // Сохраняем ссылки
        if (type === 'health') {
            this.healthProgress = progressGraphics;
            this.healthRadius = radius;
            this.healthCircumference = circumference;
            this.healthFillColor = fillColor;
        } else {
            this.manaProgress = progressGraphics;
            this.manaRadius = radius;
            this.manaCircumference = circumference;
            this.manaFillColor = fillColor;
        }
        
        // Применяем эффект свечения (drop-shadow аналог)
        // В PIXI используем BlurFilter для свечения
        if (!container.filters) {
            const blurFilter = new PIXI.BlurFilter();
            blurFilter.blur = type === 'health' ? 3 : 3;
            // Применяем свечение через separate filter
        }
    }
    
    /**
     * Отрисовка кругового прогресса (как stroke-dasharray в SVG)
     */
    renderCircularProgress(graphics, value, radius, circumference, fillColor, isLow = false) {
        graphics.clear();
        
        const centerX = 30;
        const centerY = 30;
        const borderWidth = 4;
        
        // Рисуем круг с dasharray эффектом
        const offset = circumference * (1 - Math.max(0, Math.min(1, value)));
        
        // Используем arc для рисования прогресса
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + 2 * Math.PI * value;
        
        if (value > 0) {
            // Цвет с эффектом свечения при низком здоровье
            const color = isLow && fillColor === 0xff0000 ? 0xff3333 : fillColor;
            
            graphics.lineStyle(borderWidth, color);
            
            // Рисуем дугу
            const points = [];
            const steps = Math.max(1, Math.floor(circumference / 2));
            
            for (let i = 0; i <= steps; i++) {
                const angle = startAngle + (endAngle - startAngle) * (i / steps);
                points.push(centerX + Math.cos(angle) * radius);
                points.push(centerY + Math.sin(angle) * radius);
            }
            
            if (points.length >= 4) {
                graphics.moveTo(points[0], points[1]);
                for (let i = 2; i < points.length; i += 2) {
                    graphics.lineTo(points[i], points[i + 1]);
                }
            }
        }
    }
    
    /**
     * Создание UI панели навыков
     */
    createSkillBarUI() {
        // Контейнер для панели навыков (центр)
        const barPadding = 8;
        const totalSlotsWidth = 9 * this.slotSize + 8 * this.slotGap;
        
        // Позиция: между орбами
        const skillBarX = this.circularBarSize + 10;
        
        this.skillBarContainer = new UIContainer({
            x: skillBarX,
            y: (this.circularBarSize - (this.slotSize + barPadding * 2)) / 2,
            width: totalSlotsWidth + barPadding * 2,
            height: this.slotSize + barPadding * 2,
            layout: 'flex-horizontal',
            gap: this.slotGap,
            padding: { top: barPadding, right: barPadding, bottom: barPadding, left: barPadding },
            background: {
                gradient: {
                    type: 'vertical',
                    colors: ['#1a1414', '#0d0a0a']
                }
            },
            border: {
                color: UIConfig.colors.border.dark,
                width: 2,
                radius: 3
            }
        });
        
        // Создаем 9 слотов для навыков (под горячие клавиши 1-9)
        for (let i = 1; i <= 9; i++) {
            const slot = this.createSkillSlot(i);
            this.skillBarContainer.addChild(slot);
            this.skillElements[i] = slot;
        }
        
        this.addChild(this.skillBarContainer);
    }
    
    /**
     * Создание слота для навыка
     */
    createSkillSlot(slotNumber) {
        const slot = new UISlot({
            width: this.slotSize,
            height: this.slotSize,
            number: slotNumber,
            onClick: () => this.useSkillInSlot(slotNumber),
            onHover: (slot) => {
                this.showSlotTooltip(slotNumber);
            },
            onPointerOut: () => {
                this.hideTooltip();
            }
        });

        return slot;
    }
    
    /**
     * Создание полоски опыта
     */
    createExperienceBar() {
        const barPadding = 8;
        const totalSlotsWidth = 9 * this.slotSize + 8 * this.slotGap;
        const skillBarX = this.circularBarSize + 10;
        
        this.expBar = new UIProgressBar({
            x: skillBarX,
            y: this.circularBarSize + 5,
            width: totalSlotsWidth + barPadding * 2,
            height: 16,
            value: 0,
            fillColor: UIConfig.colors.progress.experience.low,
            backgroundColor: UIConfig.colors.background.dark,
            borderColor: UIConfig.colors.border.dark,
            showText: true,
            fontSize: UIConfig.fonts.sizes.xs
        });
        
        this.addChild(this.expBar);
        this.height = this.circularBarSize + 5 + 16 + 10;
    }
    
    /**
     * Обновление отображения здоровья и маны
     */
    updateHealthManaDisplay() {
        if (!this.character) return;
        
        // Обновляем здоровье
        const healthPercent = this.character.health / this.character.maxHealth;
        const isHealthLow = healthPercent < 0.3;
        
        // Меняем цвет при низком здоровье
        const healthColor = isHealthLow ? 0xff3333 : this.healthFillColor;
        
        if (this.healthProgress) {
            this.renderCircularProgress(
                this.healthProgress, 
                healthPercent, 
                this.healthRadius, 
                this.healthCircumference, 
                healthColor,
                isHealthLow
            );
        }
        
        // Обновляем ману
        const manaPercent = this.character.mana / this.character.maxMana;
        
        if (this.manaProgress) {
            this.renderCircularProgress(
                this.manaProgress, 
                manaPercent, 
                this.manaRadius, 
                this.manaCircumference, 
                this.manaFillColor
            );
        }
    }
    
    /**
     * Обновление полоски опыта (с цветовыми переходами как в старом UI)
     */
    updateExperienceBar() {
        if (!this.expBar || !this.character) return;
        
        const percent = this.character.experienceForNextLevel > 0
            ? (this.character.experience / this.character.experienceForNextLevel)
            : 0;
        
        this.expBar.setValue(percent);
        
        // Обновляем текст
        const expText = `${this.character.experience} / ${this.character.experienceForNextLevel}`;
        if (this.expBar.textSprite) {
            this.expBar.textSprite.text = expText;
        }
        
        // Меняем цвет в зависимости от заполнения (как в старом UI)
        let expColor;
        if (percent < 0.3) {
            expColor = UIConfig.colors.progress.experience.low;
        } else if (percent < 0.6) {
            expColor = UIConfig.colors.progress.experience.medium;
        } else if (percent < 0.85) {
            expColor = UIConfig.colors.progress.experience.high;
        } else {
            expColor = UIConfig.colors.progress.experience.nearlyFull;
        }
        this.expBar.setFillColor(expColor);
    }
    
    /**
     * Назначение навыка на слот
     */
    assignSkillToSlot(slotNumber, skillName) {
        if (slotNumber < 1 || slotNumber > 9) return;
        
        this.hotkeys[slotNumber] = skillName;
        this.updateSlotDisplay(slotNumber);
    }
    
    /**
     * Обновление отображения слота
     */
    updateSlotDisplay(slotNumber) {
        const slot = this.skillElements[slotNumber];
        if (!slot) return;
        
        const skillName = this.hotkeys[slotNumber];
        
        if (skillName && this.character.skills[skillName]) {
            const skill = this.character.skills[skillName];
            
            // Получаем или создаем текстуру иконки
            const iconTexture = this.getSkillIconTexture(skillName);
            slot.setIcon(iconTexture);
            
            // Устанавливаем тултип
            slot.title = `${skill.name} (Уровень: ${skill.level})\nГорячая клавиша: ${slotNumber}`;
        } else {
            slot.clear();
            slot.title = `Пустой слот\nГорячая клавиша: ${slotNumber}`;
        }
    }

    /**
     * Получение текстуры иконки навыка
     */
    getSkillIconTexture(skillName) {
        // Проверяем кэш
        const cacheKey = `skill_icon_${skillName}`;
        if (this.uiRenderer.textureCache.has(cacheKey)) {
            return this.uiRenderer.textureCache.get(cacheKey);
        }

        // Создаем текстуру
        const colors = {
            fireball: '#ff5722',
            heal: '#4caf50',
            melee_mastery: '#ff9800',
            critical_strike: '#f44336',
            life_leech: '#9c27b0',
            iron_skin: '#795548',
            dodge: '#2196f3'
        };

        const color = colors[skillName] || '#607d8b';

        const texture = this.uiRenderer.createTexture((g) => {
            g.beginFill(this.uiRenderer.hexToDecimal(color));
            g.drawRect(0, 0, 24, 24);
            g.endFill();
        });

        this.uiRenderer.textureCache.set(cacheKey, texture);
        return texture;
    }
    
    /**
     * Использование навыка в слоте
     */
    useSkillInSlot(slotNumber) {
        const skillName = this.hotkeys[slotNumber];
        if (!skillName) return;
        
        // Используем игру для применения навыка
        if (this.game && this.game.useSkillOnNearbyEnemies) {
            this.game.useSkillOnNearbyEnemies(skillName);
        } else if (window.game && window.game.useSkillOnNearbyEnemies) {
            window.game.useSkillOnNearbyEnemies(skillName);
        }
    }
    
    /**
     * Показ тултипа для слота
     */
    showSlotTooltip(slotNumber) {
        const skillName = this.hotkeys[slotNumber];
        if (!skillName || !this.character.skills[skillName]) return;
        
        const skill = this.character.skills[skillName];
        const title = skill.name;
        const description = `Уровень: ${skill.level}/${skill.maxLevel}\n${skill.description}`;

        // Показываем тултип через UIManager
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
     * Установка ссылки на игру
     */
    setGame(game) {
        this.game = game;
    }
    
    /**
     * Обновление компонента
     */
    onUpdate(deltaTime) {
        this.updateHealthManaDisplay();
        this.updateExperienceBar();

        // Обновляем все слоты
        for (let i = 1; i <= 9; i++) {
            this.updateSlotDisplay(i);
        }
    }

    /**
     * Публичный метод обновления (вызывается из игры)
     */
    update() {
        this.onUpdate(16.67);
    }

    /**
     * Обработка нажатий клавиш для использования навыков
     */
    handleHotkey(key) {
        const slotNumber = parseInt(key);
        if (slotNumber >= 1 && slotNumber <= 9) {
            this.useSkillInSlot(slotNumber);
        }
    }
}

// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UISkillBar;
} else if (typeof window !== 'undefined') {
    window.UISkillBar = UISkillBar;
}
