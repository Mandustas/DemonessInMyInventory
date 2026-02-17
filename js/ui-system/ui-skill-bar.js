/**
 * UISkillBar - панель навыков на новой системе UI
 * Отображает полоски здоровья и маны, слоты для навыков и полоску опыта
 */
class UISkillBar extends UIComponent {
    constructor(character, config = {}) {
        super(config);
        
        this.character = character;
        this.hotkeys = {}; // Сопоставление горячих клавиш с навыками
        this.skillElements = {}; // Элементы UI для каждого слота
        
        // Размеры из конфига
        this.slotSize = UIConfig.components.slot.size;
        this.slotGap = UIConfig.components.grid.slotGap;
        this.circularBarSize = UIConfig.components.circularBar.size;
        
        // Ссылка на игру
        this.game = null;
        
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
        this.width = totalSlotsWidth + barPadding * 2;
        this.height = this.circularBarSize + 20; // + место для полоски опыта
        
        // Создаем основные контейнеры
        this.createHealthManaBars();
        this.createSkillBarUI();
        this.createExperienceBar();
        
        // Обновляем отображение
        this.updateHealthManaDisplay();
        this.updateExperienceBar();
    }
    
    /**
     * Создание полосок здоровья и маны
     */
    createHealthManaBars() {
        // Левая панель - Здоровье (круг)
        this.healthBar = new UICircularBar({
            x: 0,
            y: 0,
            value: 1,
            fillColor: UIConfig.colors.progress.health,
            backgroundColor: '#1a1a1a',
            borderColor: '#8b0000'
        });
        this.healthBar.setSize(this.circularBarSize, this.circularBarSize);
        this.addChild(this.healthBar);
        
        // Правая панель - Мана (круг)
        this.manaBar = new UICircularBar({
            x: this.width - this.circularBarSize,
            y: 0,
            value: 1,
            fillColor: UIConfig.colors.progress.mana,
            backgroundColor: '#1a1a1a',
            borderColor: '#00008b'
        });
        this.manaBar.setSize(this.circularBarSize, this.circularBarSize);
        this.addChild(this.manaBar);
    }
    
    /**
     * Создание UI панели навыков
     */
    createSkillBarUI() {
        // Контейнер для панели навыков
        const barPadding = 8;
        const totalSlotsWidth = 9 * this.slotSize + 8 * this.slotGap;
        
        this.skillBarContainer = new UIContainer({
            x: (this.width - totalSlotsWidth) / 2,
            y: 0,
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
        
        // Создаем 9 слотов для навыков
        for (let i = 1; i <= 9; i++) {
            const slot = this.createSkillSlot(i);
            this.skillBarContainer.addChild(slot);
            this.skillElements[i] = slot;
        }
        
        this.addChild(this.skillBarContainer);
        
        // Позиционируем панель навыков между орбами
        this.skillBarContainer.y = (this.circularBarSize - this.skillBarContainer.height) / 2;
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
        
        this.expBar = new UIProgressBar({
            x: (this.width - totalSlotsWidth) / 2,
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
        this.height = this.circularBarSize + 5 + 16 + 5;
    }
    
    /**
     * Обновление отображения здоровья и маны
     */
    updateHealthManaDisplay() {
        if (!this.character || !this.healthBar || !this.manaBar) return;
        
        // Обновляем здоровье
        const healthPercent = this.character.health / this.character.maxHealth;
        this.healthBar.setValue(healthPercent);
        
        // Меняем цвет при низком здоровье
        if (healthPercent < 0.3) {
            this.healthBar.setFillColor(UIConfig.colors.progress.healthLow);
        } else {
            this.healthBar.setFillColor(UIConfig.colors.progress.health);
        }
        
        // Обновляем ману
        const manaPercent = this.character.mana / this.character.maxMana;
        this.manaBar.setValue(manaPercent);
    }
    
    /**
     * Обновление полоски опыта
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
        
        // Меняем цвет в зависимости от заполнения
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
