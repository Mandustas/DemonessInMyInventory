/**
 * UISkillTree - дерево навыков на новой системе UI
 * Отображает навыки персонажа, позволяет их улучшать
 */
class UISkillTree extends UIComponent {
    constructor(character, config = {}) {
        super(config);
        
        this.character = character;
        
        // Размеры из конфига
        this.width = UIConfig.components.window.minWidth;
        this.height = UIConfig.components.window.minHeight;
        this.padding = UIConfig.components.window.padding;
        
        // Позиционирование по центру
        this.config.positionKey = 'skillTree';
        
        // Контейнер для навыков
        this.skillsContainer = null;
        this.skillElements = {};
    }
    
    /**
     * Хук инициализации
     */
    onInit() {
        // Создаем основные элементы UI
        this.createTitle();
        this.createPointsDisplay();
        this.createExperienceBar();
        this.createSkillsGrid();
        this.createCloseButton();
        
        // Обновляем отображение
        this.updateDisplay();
    }
    
    /**
     * Создание заголовка
     * text-shadow: 2px 2px 4px #000 (из CSS для заголовков)
     */
    createTitle() {
        this.titleLabel = new UILabel({
            x: this.padding,
            y: this.padding,
            text: 'ДЕРЕВО НАВЫКОВ',
            fontSize: UIConfig.fonts.sizes.xxl,
            fontColor: UIConfig.colors.text.primary,
            align: 'center',
            isTitle: true
        });
        this.titleLabel.width = this.width - this.padding * 2;
        this.titleLabel.height = 30;
        this.addChild(this.titleLabel);
    }
    
    /**
     * Создание отображения доступных очков навыков
     */
    createPointsDisplay() {
        this.pointsDisplay = new UILabel({
            x: this.padding,
            y: this.padding + 40,
            text: '',
            fontSize: UIConfig.fonts.sizes.lg,
            fontColor: UIConfig.colors.text.purple,
            align: 'center'
        });
        this.pointsDisplay.width = this.width - this.padding * 2;
        this.pointsDisplay.height = 25;
        this.addChild(this.pointsDisplay);
    }
    
    /**
     * Создание полоски опыта
     */
    createExperienceBar() {
        const barY = this.padding + 70;
        const barHeight = 24;
        
        // Контейнер для полоски опыта
        this.expBarContainer = new UIContainer({
            x: this.padding,
            y: barY,
            width: this.width - this.padding * 2,
            height: barHeight + 30,
            background: { color: null },
            border: { color: null, width: 0 }
        });
        
        // Текст с уровнем
        this.levelLabel = new UILabel({
            x: 0,
            y: 0,
            text: `Уровень: ${this.character.level}`,
            fontSize: UIConfig.fonts.sizes.md,
            fontColor: UIConfig.colors.text.gold,
            align: 'center'
        });
        this.levelLabel.width = this.expBarContainer.width;
        this.expBarContainer.addChild(this.levelLabel);
        
        // Прогресс-бар опыта
        this.expBar = new UIProgressBar({
            x: 0,
            y: 20,
            width: this.expBarContainer.width,
            height: barHeight,
            value: 0,
            fillColor: UIConfig.colors.progress.experience.low,
            backgroundColor: UIConfig.colors.background.dark,
            borderColor: UIConfig.colors.border.dark,
            showText: true,
            fontSize: UIConfig.fonts.sizes.xs
        });
        this.expBarContainer.addChild(this.expBar);
        
        this.addChild(this.expBarContainer);
    }
    
    /**
     * Создание сетки навыков
     */
    createSkillsGrid() {
        const gridY = this.padding + 130;
        const availableHeight = this.height - gridY - this.padding - 50;
        
        // Вычисляем количество рядов
        const slotSize = 100;
        const slotGap = 10;
        const columns = 2;
        
        this.skillsContainer = new UIContainer({
            x: this.padding,
            y: gridY,
            width: this.width - this.padding * 2,
            height: availableHeight,
            layout: 'grid',
            gridColumns: columns,
            gap: slotGap,
            cellWidth: slotSize,
            cellHeight: slotSize,
            background: { color: null },
            border: { color: null, width: 0 }
        });
        
        this.addChild(this.skillsContainer);
    }
    
    /**
     * Создание кнопки закрытия
     */
    createCloseButton() {
        this.closeButton = new UIButton({
            x: this.width - 80,
            y: 10,
            width: 70,
            height: 25,
            text: 'ЗАКРЫТЬ',
            fontSize: UIConfig.fonts.sizes.sm,
            onClick: () => this.close()
        });
        this.addChild(this.closeButton);
    }
    
    /**
     * Создание элемента навыка
     */
    createSkillElement(skillName, skill) {
        const container = new UIContainer({
            width: 100,
            height: 100,
            background: {
                gradient: {
                    type: 'vertical',
                    colors: ['#2a1a1a', '#1a0f0f']
                }
            },
            border: {
                color: UIConfig.colors.border.dark,
                width: 1,
                radius: 3
            },
            padding: { top: 8, right: 8, bottom: 8, left: 8 }
        });
        
        // Название и уровень
        const nameLabel = new UILabel({
            x: 0,
            y: 0,
            text: `${skill.name}`,
            fontSize: UIConfig.fonts.sizes.sm,
            fontColor: UIConfig.colors.text.primary,
            align: 'center'
        });
        nameLabel.width = 84;
        nameLabel.height = 20;
        container.addChild(nameLabel);
        
        // Уровень
        const levelLabel = new UILabel({
            x: 0,
            y: 18,
            text: `${skill.level}/${skill.maxLevel}`,
            fontSize: UIConfig.fonts.sizes.xs,
            fontColor: UIConfig.colors.text.secondary,
            align: 'center'
        });
        levelLabel.width = 84;
        levelLabel.height = 15;
        container.addChild(levelLabel);
        
        // Кнопка улучшения
        const upgradeButton = new UIButton({
            x: 30,
            y: 35,
            width: 25,
            height: 25,
            text: '+',
            fontSize: UIConfig.fonts.sizes.md,
            enabled: false
        });
        container.addChild(upgradeButton);
        
        // Описание
        const descLabel = new UILabel({
            x: 0,
            y: 65,
            text: skill.description,
            fontSize: UIConfig.fonts.sizes.xs,
            fontColor: UIConfig.colors.text.secondary,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 84
        });
        descLabel.width = 84;
        descLabel.height = 30;
        container.addChild(descLabel);
        
        // Функция обновления состояния кнопки
        const updateButtonState = () => {
            const canUpgrade = this.character.skillPoints >= (skill.cost || 1) && skill.level < skill.maxLevel;
            
            if (canUpgrade) {
                upgradeButton.setEnabled(true);
                upgradeButton.onClick = () => {
                    this.character.upgradeSkill(skillName);
                    this.updateDisplay();
                };
                container.borderStyle = {
                    color: UIConfig.colors.border.light,
                    width: 1,
                    radius: 3
                };
            } else {
                upgradeButton.setEnabled(false);
                container.borderStyle = {
                    color: UIConfig.colors.border.dark,
                    width: 1,
                    radius: 3
                };
            }
            
            levelLabel.setText(`${skill.level}/${skill.maxLevel}`);
            container.markForUpdate();
        };

        // Обновляем состояние
        updateButtonState();

        // Клик на контейнер
        container.onClick = (e) => {
            // Проверяем, не был ли клик по кнопке
            if (e.target !== upgradeButton.container) {
                const canUpgrade = this.character.skillPoints >= (skill.cost || 1) && skill.level < skill.maxLevel;
                if (canUpgrade) {
                    this.character.upgradeSkill(skillName);
                    this.updateDisplay();
                }
            }
        };

        return container;
    }
    
    /**
     * Обновление отображения
     */
    updateDisplay() {
        if (!this.isOpen) return;
        
        // Обновляем очки навыков
        this.pointsDisplay.setText(`Доступные очки навыков: ${this.character.skillPoints}`);

        // Обновляем полоску опыта
        this.updateExperienceBar();

        // Очищаем контейнер навыков
        if (this.skillsContainer && this.skillsContainer.container) {
            this.skillsContainer.children = [];
            this.skillsContainer.container.removeChildren();
        }

        // Создаем элементы для каждого навыка
        for (const skillName in this.character.skills) {
            const skill = this.character.skills[skillName];
            const skillElement = this.createSkillElement(skillName, skill);
            this.skillsContainer.addChild(skillElement);
        }

        this.skillsContainer.updateLayout();
    }
    
    /**
     * Обновление полоски опыта
     */
    updateExperienceBar() {
        if (!this.expBar) return;
        
        const percent = this.character.experienceForNextLevel > 0
            ? (this.character.experience / this.character.experienceForNextLevel)
            : 0;
        
        this.expBar.setValue(percent);
        
        if (this.levelLabel) {
            this.levelLabel.setText(`Уровень: ${this.character.level}`);
        }
        
        if (this.expBar.textSprite) {
            this.expBar.textSprite.text = `${this.character.experience} / ${this.character.experienceForNextLevel} (${(percent * 100).toFixed(1)}%)`;
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
     * Хук при открытии
     */
    onOpen() {
        this.updateDisplay();
    }
    
    /**
     * Обновление при изменении персонажа
     */
    onCharacterUpdate() {
        if (this.isOpen) {
            this.updateDisplay();
        } else {
            this.updateExperienceBar();
        }
    }
    
    /**
     * Отрисовка фона окна
     * Градиент: linear-gradient(to bottom, #1a1414 0%, #0d0a0a 100%)
     * box-shadow: 0 0 20px rgba(0,0,0,0.8), inset 0 0 10px rgba(74,58,42,0.3)
     */
    renderBackground() {
        if (!this.graphics) return;

        // Градиентный фон (вертикальный от #1a1414 к #0d0a0a)
        for (let i = 0; i < this.height; i++) {
            const t = i / (this.height - 1);
            const r1 = 26, g1 = 20, b1 = 20; // #1a1414
            const r2 = 13, g2 = 10, b2 = 10; // #0d0a0a
            const r = Math.round(r1 + (r2 - r1) * t);
            const g = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (g << 8) + b;
            this.graphics.beginFill(color);
            this.graphics.drawRect(0, i, this.width, 1);
            this.graphics.endFill();
        }

        // Граница
        this.graphics.lineStyle(2, 0x3a2a1a);
        this.graphics.drawRect(0, 0, this.width, this.height);

        // Внешнее свечение (тень)
        this.graphics.lineStyle(4, 0x000000, 0.5);
        this.graphics.drawRect(-4, -4, this.width + 8, this.height + 8);

        // Внутренняя тень по краям
        this.graphics.lineStyle(2, 0x4a3a2a, 0.3);
        this.graphics.drawRect(2, 2, this.width - 4, this.height - 4);
    }
}

// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UISkillTree;
} else if (typeof window !== 'undefined') {
    window.UISkillTree = UISkillTree;
}
