/**
 * UIStatsWindow - окно характеристик на новой системе UI
 * Отображает основные характеристики персонажа
 */
class UIStatsWindow extends UIComponent {
    constructor(character, config = {}) {
        super(config);

        this.character = character;

        // Размеры из конфига
        this.width = UIConfig.components.window.minWidth;
        this.height = 400; // Больше по высоте для всех характеристик
        this.padding = UIConfig.components.window.padding;

        // Позиционирование по центру
        this.config.positionKey = 'stats';
    }

    /**
     * Хук инициализации
     */
    onInit() {
        // Создаем основные элементы UI
        this.createTitle();
        this.createCloseButton();
        this.createStatsContainer();

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
            text: 'ХАРАКТЕРИСТИКИ',
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
     * Создание контейнера для характеристик
     */
    createStatsContainer() {
        const containerY = this.padding + 50;
        const containerHeight = this.height - containerY - this.padding;

        this.statsContainer = new UIContainer({
            x: this.padding,
            y: containerY,
            width: this.width - this.padding * 2,
            height: containerHeight,
            layout: 'flex-vertical',
            gap: 10,
            background: { color: null },
            border: { color: null, width: 0 }
        });

        this.addChild(this.statsContainer);

        // Создаем секции характеристик
        this.createMainStatsSection();
        this.createSecondaryStatsSection();
    }

    /**
     * Создание секции основных характеристик
     */
    createMainStatsSection() {
        // Заголовок секции
        const mainStatsTitle = new UILabel({
            text: 'Основные характеристики:',
            fontSize: UIConfig.fonts.sizes.md,
            fontColor: UIConfig.colors.text.primary,
            align: 'left'
        });
        mainStatsTitle.width = this.statsContainer.width;
        mainStatsTitle.height = 20;
        this.statsContainer.addChild(mainStatsTitle);

        // Контейнер для основных статов
        this.mainStatsContent = new UIContainer({
            width: this.statsContainer.width,
            layout: 'flex-vertical',
            gap: 5,
            background: { color: null },
            border: { color: null, width: 0 }
        });
        this.statsContainer.addChild(this.mainStatsContent);

        // Создаем метки для основных характеристик
        this.levelLabel = this.createStatLabel('Уровень', '');
        this.healthLabel = this.createStatLabel('Здоровье', '');
        this.manaLabel = this.createStatLabel('Мана', '');
        this.experienceLabel = this.createStatLabel('Опыт', '');
        this.skillPointsLabel = this.createStatLabel('Очков навыков', '');

        this.mainStatsContent.addChild(this.levelLabel);
        this.mainStatsContent.addChild(this.healthLabel);
        this.mainStatsContent.addChild(this.manaLabel);
        this.mainStatsContent.addChild(this.experienceLabel);
        this.mainStatsContent.addChild(this.skillPointsLabel);
    }

    /**
     * Создание секции вторичных характеристик
     */
    createSecondaryStatsSection() {
        // Заголовок секции
        const secondaryStatsTitle = new UILabel({
            text: 'Статы:',
            fontSize: UIConfig.fonts.sizes.md,
            fontColor: UIConfig.colors.text.primary,
            align: 'left'
        });
        secondaryStatsTitle.width = this.statsContainer.width;
        secondaryStatsTitle.height = 20;
        this.statsContainer.addChild(secondaryStatsTitle);

        // Контейнер для вторичных статов
        this.secondaryStatsContent = new UIContainer({
            width: this.statsContainer.width,
            layout: 'flex-vertical',
            gap: 5,
            background: { color: null },
            border: { color: null, width: 0 }
        });
        this.statsContainer.addChild(this.secondaryStatsContent);

        // Создаем метки для вторичных характеристик
        this.strengthLabel = this.createStatLabel('Сила', '');
        this.dexterityLabel = this.createStatLabel('Ловкость', '');
        this.vitalityLabel = this.createStatLabel('Живучесть', '');
        this.energyLabel = this.createStatLabel('Энергия', '');

        this.secondaryStatsContent.addChild(this.strengthLabel);
        this.secondaryStatsContent.addChild(this.dexterityLabel);
        this.secondaryStatsContent.addChild(this.vitalityLabel);
        this.secondaryStatsContent.addChild(this.energyLabel);
    }

    /**
     * Создание метки характеристики
     */
    createStatLabel(name, value) {
        const label = new UILabel({
            text: `${name}: ${value}`,
            fontSize: UIConfig.fonts.sizes.md,
            fontColor: UIConfig.colors.text.primary,
            align: 'left'
        });
        label.width = this.statsContainer.width;
        label.height = 20;
        return label;
    }

    /**
     * Получение цвета для характеристики
     */
    getStatColor(name) {
        switch(name.toLowerCase()) {
            case 'уровень':
            case 'сила':
                return UIConfig.colors.text.orange;
            case 'здоровье':
            case 'живучесть':
                return UIConfig.colors.text.green;
            case 'мана':
            case 'энергия':
                return UIConfig.colors.text.blue;
            case 'ловкость':
                return UIConfig.colors.text.blue;
            case 'очков навыков':
                return UIConfig.colors.text.purple;
            case 'опыт':
                return UIConfig.colors.text.orange;
            default:
                return UIConfig.colors.text.primary;
        }
    }

    /**
     * Создание составной текстовой метки с цветными значениями
     * @param {string} label - название характеристики
     * @param {string|number} value - значение
     * @param {string|null} bonusText - текст бонуса
     * @param {string|null} bonusColor - цвет бонуса
     * @returns {UIContainer}
     */
    createColoredStatRow(label, value, bonusText = null, bonusColor = null) {
        const container = new UIContainer({
            width: this.statsContainer.width,
            height: 20,
            layout: 'flex-horizontal',
            gap: 4,
            background: { color: null },
            border: { color: null, width: 0 }
        });

        const valueColor = this.getStatColor(label);

        // Метка названия
        const nameLabel = new UILabel({
            text: `${label}: `,
            fontSize: UIConfig.fonts.sizes.md,
            fontColor: UIConfig.colors.text.primary,
            align: 'left'
        });
        nameLabel.width = 120;
        nameLabel.height = 20;
        container.addChild(nameLabel);

        // Значение цветом
        const valueLabel = new UILabel({
            text: String(value),
            fontSize: UIConfig.fonts.sizes.md,
            fontColor: valueColor,
            align: 'left',
            fontWeight: 'bold'
        });
        valueLabel.height = 20;
        container.addChild(valueLabel);

        // Бонус если есть
        if (bonusText !== null) {
            const bonusPrefixLabel = new UILabel({
                text: ' (Бонус: ',
                fontSize: UIConfig.fonts.sizes.md,
                fontColor: UIConfig.colors.text.primary,
                align: 'left'
            });
            bonusPrefixLabel.height = 20;
            container.addChild(bonusPrefixLabel);

            const bonusValueLabel = new UILabel({
                text: bonusText,
                fontSize: UIConfig.fonts.sizes.md,
                fontColor: bonusColor || UIConfig.colors.text.green,
                align: 'left',
                fontWeight: 'bold'
            });
            bonusValueLabel.height = 20;
            container.addChild(bonusValueLabel);

            const bonusSuffixLabel = new UILabel({
                text: ')',
                fontSize: UIConfig.fonts.sizes.md,
                fontColor: UIConfig.colors.text.primary,
                align: 'left'
            });
            bonusSuffixLabel.height = 20;
            container.addChild(bonusSuffixLabel);
        }

        return container;
    }

    /**
     * Обновление отображения
     */
    updateDisplay() {
        if (!this.isOpen) return;

        // Очищаем контейнеры
        this.mainStatsContent.children = [];
        this.secondaryStatsContent.children = [];

        // Основные характеристики
        this.mainStatsContent.addChild(this.createColoredStatRow('Уровень', this.character.level));
        this.mainStatsContent.addChild(this.createColoredStatRow(
            'Здоровье',
            `${this.character.health}/${this.character.maxHealth}`
        ));
        this.mainStatsContent.addChild(this.createColoredStatRow(
            'Мана',
            `${Math.floor(this.character.mana)}/${this.character.maxMana}`
        ));
        this.mainStatsContent.addChild(this.createColoredStatRow(
            'Опыт',
            `${this.character.experience}/${this.character.experienceForNextLevel}`
        ));
        this.mainStatsContent.addChild(this.createColoredStatRow('Очков навыков', this.character.skillPoints));

        // Вторичные характеристики
        const damageBonus = this.character.getTotalStat('damage');
        const accuracyBonus = this.character.getTotalStat('accuracy');
        const dodgeBonus = this.character.getTotalStat('dodge');
        const healthBonus = this.character.getTotalStat('health');
        const armorBonus = this.character.getTotalStat('armor');
        const manaBonus = this.character.getTotalStat('mana');
        const manaRegen = this.character.getManaRegenRate().toFixed(1);

        this.secondaryStatsContent.addChild(this.createColoredStatRow(
            'Сила',
            this.character.strength,
            `+${damageBonus}`,
            UIConfig.colors.text.red
        ));
        this.secondaryStatsContent.addChild(this.createColoredStatRow(
            'Ловкость',
            this.character.dexterity,
            `+${accuracyBonus}% точности, +${dodgeBonus}% уклонения`,
            UIConfig.colors.text.green
        ));
        this.secondaryStatsContent.addChild(this.createColoredStatRow(
            'Живучесть',
            this.character.vitality,
            `+${healthBonus} здоровья, +${armorBonus} брони`,
            UIConfig.colors.text.green
        ));
        this.secondaryStatsContent.addChild(this.createColoredStatRow(
            'Энергия',
            this.character.energy,
            `+${manaBonus} маны, +${manaRegen}/сек`,
            UIConfig.colors.text.blue
        ));

        // Обновляем все метки
        this.mainStatsContent.markForUpdate();
        this.secondaryStatsContent.markForUpdate();
    }

    /**
     * Хук при открытии
     */
    onOpen() {
        this.updateDisplay();
    }

    /**
     * Обновление при изменении характеристик
     */
    onStatsUpdate() {
        if (this.isOpen) {
            this.updateDisplay();
        }
    }

    /**
     * Отрисовка фона окна
     */
    renderBackground() {
        if (!this.graphics) return;

        // Градиентный фон (вертикальный от #1a1414 к #0d0a0a)
        const gradientHeight = this.height / 10;
        for (let i = 0; i < 10; i++) {
            const t = i / 9;
            const r1 = 26, g1 = 20, b1 = 20; // #1a1414
            const r2 = 13, g2 = 10, b2 = 10; // #0d0a0a
            const r = Math.round(r1 + (r2 - r1) * t);
            const g = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (g << 8) + b;
            this.graphics.beginFill(color);
            this.graphics.drawRect(0, i * gradientHeight, this.width, gradientHeight);
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
    module.exports = UIStatsWindow;
} else if (typeof window !== 'undefined') {
    window.UIStatsWindow = UIStatsWindow;
}
