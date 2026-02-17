/**
 * UISkillTree - дерево навыков на новой системе UI
 * Изящный дарк фентези стиль
 */
class UISkillTree extends UIComponent {
    constructor(character, config = {}) {
        super(config);

        this.character = character;

        // Размеры окна
        this.width = 420;
        this.padding = 20;

        // Параметры сетки навыков
        this.slotSize = 140;
        this.slotHeight = 160;
        this.slotGap = 10;
        this.columns = 2;

        // Позиционирование по центру
        this.config.positionKey = 'skillTree';

        // Контейнеры
        this.skillsContainer = null;
        this.skillSlots = [];

        // Кеш текстовых спрайтов
        this.textSprites = {};
    }

    /**
     * Хук инициализации
     */
    onInit() {
        // Создаем контейнер для навыков
        this.skillsContainer = new PIXI.Container();
        this.container.addChild(this.skillsContainer);

        // Создаем заголовок
        this.renderTitle();

        // Создаем отображение очков навыков
        this.renderPointsDisplay();

        // Создаем полоску опыта
        this.renderExperienceBar();

        // Создаем сетку навыков
        this.createSkillSlots();

        // Обновляем отображение
        this.updateDisplay();
    }

    /**
     * Отрисовка заголовка
     */
    renderTitle() {
        const titleStyle = new PIXI.TextStyle({
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 22,
            fill: '#c9b896',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowDistance: 2,
            dropShadowAngle: Math.PI / 4
        });

        this.titleText = new PIXI.Text('НАВЫКИ', titleStyle);
        this.titleText.anchor.set(0.5, 0);
        this.titleText.x = this.width / 2;
        this.titleText.y = this.padding;
        this.container.addChild(this.titleText);

        // Кнопка закрытия
        this.createCloseButton();
    }

    /**
     * Создание кнопки закрытия
     */
    createCloseButton() {
        const closeBtn = new UIButton({
            x: this.width - 80,
            y: 8,
            width: 70,
            height: 24,
            text: 'ЗАКРЫТЬ',
            fontSize: 11,
            onClick: () => this.close()
        });
        this.addChild(closeBtn);
    }

    /**
     * Создание отображения очков навыков
     */
    renderPointsDisplay() {
        const pointsStyle = new PIXI.TextStyle({
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 14,
            fill: '#9C27B0',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 2,
            dropShadowDistance: 1,
            dropShadowAngle: Math.PI / 4
        });

        this.pointsText = new PIXI.Text('', pointsStyle);
        this.pointsText.anchor.set(0.5, 0);
        this.pointsText.x = this.width / 2;
        this.pointsText.y = this.padding + 35;
        this.container.addChild(this.pointsText);
    }

    /**
     * Создание полоски опыта
     */
    renderExperienceBar() {
        const barY = this.padding + 60;
        const barWidth = this.width - this.padding * 2;
        const barHeight = 24;

        // Контейнер для полоски опыта
        this.expBarContainer = new PIXI.Container();
        this.expBarContainer.x = this.padding;
        this.expBarContainer.y = barY;
        this.container.addChild(this.expBarContainer);

        // Текст с уровнем
        const levelStyle = new PIXI.TextStyle({
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 13,
            fill: '#FFD700',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 2,
            dropShadowDistance: 1,
            dropShadowAngle: Math.PI / 4
        });

        this.levelText = new PIXI.Text(`Уровень: ${this.character.level}`, levelStyle);
        this.levelText.anchor.set(0.5, 0);
        this.levelText.x = barWidth / 2;
        this.levelText.y = 0;
        this.expBarContainer.addChild(this.levelText);

        // Фон полоски опыта
        const bgGraphics = new PIXI.Graphics();
        bgGraphics.beginFill(0x1a1414);
        bgGraphics.lineStyle(2, 0x3a2a1a);
        bgGraphics.drawRoundedRect(0, 20, barWidth, barHeight, 3);
        bgGraphics.endFill();
        this.expBarContainer.addChild(bgGraphics);

        // Сама полоска опыта
        this.expBarGraphics = new PIXI.Graphics();
        this.expBarContainer.addChild(this.expBarGraphics);

        // Текст с опытом
        const expStyle = new PIXI.TextStyle({
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 11,
            fill: '#c9b896',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 1,
            dropShadowDistance: 1,
            dropShadowAngle: Math.PI / 4
        });

        this.expText = new PIXI.Text('', expStyle);
        this.expText.anchor.set(0.5, 0.5);
        this.expText.x = barWidth / 2;
        this.expText.y = 20 + barHeight / 2;
        this.expBarContainer.addChild(this.expText);
    }

    /**
     * Создание сетки навыков
     */
    createSkillSlots() {
        const skillCount = Object.keys(this.character.skills).length;
        const rows = Math.ceil(skillCount / this.columns);

        const totalWidth = this.columns * this.slotSize + (this.columns - 1) * this.slotGap;
        const totalHeight = rows * this.slotHeight + (rows - 1) * this.slotGap;

        const startX = (this.width - totalWidth) / 2;
        const startY = this.padding + 120;

        this.gridStartX = startX;
        this.gridStartY = startY;

        // Создаем слоты для каждого навыка
        let slotIndex = 0;
        for (const skillName in this.character.skills) {
            const col = slotIndex % this.columns;
            const row = Math.floor(slotIndex / this.columns);

            const x = startX + col * (this.slotSize + this.slotGap);
            const y = startY + row * (this.slotHeight + this.slotGap);

            const slot = this.createSkillSlot(skillName, x, y);
            this.skillSlots.push(slot);
            this.skillsContainer.addChild(slot.container);

            slotIndex++;
        }

        // Обновляем высоту окна
        this.height = startY + totalHeight + this.padding + 20;
        this.markForUpdate();
    }

    /**
     * Создание отдельного слота навыка
     */
    createSkillSlot(skillName, x, y) {
        const slot = {
            skillName: skillName,
            x: x,
            y: y,
            width: this.slotSize,
            height: this.slotHeight,
            container: new PIXI.Container(),
            background: new PIXI.Graphics(),
            nameText: null,
            levelText: null,
            upgradeButton: null,
            upgradeButtonBg: null,
            descText: null,
            isHovered: false
        };

        slot.container.x = x;
        slot.container.y = y;
        slot.container.addChild(slot.background);

        // Название навыка
        const nameStyle = new PIXI.TextStyle({
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 13,
            fill: '#c9b896',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 2,
            dropShadowDistance: 1,
            dropShadowAngle: Math.PI / 4,
            wordWrap: true,
            wordWrapWidth: this.slotSize - 20
        });

        slot.nameText = new PIXI.Text('', nameStyle);
        slot.nameText.anchor.set(0.5, 0);
        slot.nameText.x = this.slotSize / 2;
        slot.nameText.y = 10;
        slot.container.addChild(slot.nameText);

        // Уровень навыка
        const levelStyle = new PIXI.TextStyle({
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 11,
            fill: '#8a7a6a',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 1,
            dropShadowDistance: 1,
            dropShadowAngle: Math.PI / 4
        });

        slot.levelText = new PIXI.Text('', levelStyle);
        slot.levelText.anchor.set(0.5, 0);
        slot.levelText.x = this.slotSize / 2;
        slot.levelText.y = 40;
        slot.container.addChild(slot.levelText);

        // Кнопка улучшения
        slot.upgradeButtonBg = new PIXI.Graphics();
        slot.container.addChild(slot.upgradeButtonBg);

        const buttonStyle = new PIXI.TextStyle({
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 18,
            fill: '#c9b896',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 2,
            dropShadowDistance: 1,
            dropShadowAngle: Math.PI / 4
        });

        slot.upgradeButton = new PIXI.Text('+', buttonStyle);
        slot.upgradeButton.anchor.set(0.5);
        slot.upgradeButton.x = this.slotSize / 2;
        slot.upgradeButton.y = 70;
        slot.container.addChild(slot.upgradeButton);

        // Описание навыка
        const descStyle = new PIXI.TextStyle({
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: 10,
            fill: '#8a7a6a',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 1,
            dropShadowDistance: 1,
            dropShadowAngle: Math.PI / 4,
            wordWrap: true,
            wordWrapWidth: this.slotSize - 20,
            align: 'center'
        });

        slot.descText = new PIXI.Text('', descStyle);
        slot.descText.anchor.set(0.5, 0);
        slot.descText.x = this.slotSize / 2;
        slot.descText.y = 100;
        slot.container.addChild(slot.descText);

        // Включаем интерактивность
        slot.container.eventMode = 'static';
        slot.container.cursor = 'pointer';

        // Обработчики событий
        slot.container.on('pointerover', () => {
            slot.isHovered = true;
            this.renderSkillSlot(slot);
        });

        slot.container.on('pointerout', () => {
            slot.isHovered = false;
            this.renderSkillSlot(slot);
        });

        slot.container.on('pointerdown', (e) => {
            // Проверяем, был ли клик по кнопке улучшения
            const buttonBounds = slot.upgradeButton.getBounds();
            const localPoint = slot.container.toLocal(e.data.global);
            
            if (localPoint.x >= buttonBounds.x && localPoint.x <= buttonBounds.x + buttonBounds.width &&
                localPoint.y >= buttonBounds.y && localPoint.y <= buttonBounds.y + buttonBounds.height) {
                this.onUpgradeSkill(skillName);
            } else {
                this.onUpgradeSkill(skillName);
            }
        });

        // Первоначальная отрисовка
        this.renderSkillSlot(slot);

        return slot;
    }

    /**
     * Отрисовка слота навыка
     */
    renderSkillSlot(slot) {
        const g = slot.background;
        g.clear();

        // Градиентный фон слота
        for (let i = 0; i < this.slotHeight; i++) {
            const t = i / (this.slotHeight - 1);
            const r1 = 42, g1 = 26, b1 = 26; // #2a1a1a
            const r2 = 26, g2 = 15, b2 = 15;  // #1a0f0f
            const r = Math.round(r1 + (r2 - r1) * t);
            const gr = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (gr << 8) + b;
            g.beginFill(color);
            g.drawRect(0, i, this.slotSize, 1);
            g.endFill();
        }

        // Внутренняя тень (inner glow)
        g.beginFill(0xc9b896, slot.isHovered ? 0.15 : 0.08);
        g.drawRect(0, 0, this.slotSize, 1);
        g.endFill();

        // Определяем цвет рамки
        const skill = this.character.skills[slot.skillName];
        const canUpgrade = this.character.skillPoints >= (skill.cost || 1) && skill.level < skill.maxLevel;
        
        let borderColor = slot.isHovered ? 0x6a5a4a : 0x3a2a1a;
        if (canUpgrade) {
            borderColor = 0x6a5a4a;
        }

        // Рамка
        g.lineStyle(2, borderColor);
        g.drawRoundedRect(0, 0, this.slotSize, this.slotHeight, 3);

        // Обновляем тексты
        this.updateSkillSlotTexts(slot);

        // Обновляем кнопку улучшения
        this.updateSkillButtonState(slot);
    }

    /**
     * Обновление текстов слота навыка
     */
    updateSkillSlotTexts(slot) {
        const skill = this.character.skills[slot.skillName];
        
        slot.nameText.text = skill.name;
        slot.levelText.text = `${skill.level}/${skill.maxLevel}`;
        slot.descText.text = skill.description;
    }

    /**
     * Обновление состояния кнопки улучшения
     */
    updateSkillButtonState(slot) {
        const skill = this.character.skills[slot.skillName];
        const canUpgrade = this.character.skillPoints >= (skill.cost || 1) && skill.level < skill.maxLevel;

        // Фон кнопки
        slot.upgradeButtonBg.clear();

        if (canUpgrade) {
            // Активная кнопка - зелёный фон
            slot.upgradeButtonBg.beginFill(0x2e7d32);
            slot.upgradeButtonBg.lineStyle(1, 0x4CAF50);
            slot.upgradeButtonBg.drawCircle(this.slotSize / 2, 70, 18);
            slot.upgradeButtonBg.endFill();

            slot.upgradeButton.style.fill = '#ffffff';
            slot.upgradeButton.alpha = 1;
        } else {
            // Неактивная кнопка - серый фон
            slot.upgradeButtonBg.beginFill(0x3a2a1a);
            slot.upgradeButtonBg.lineStyle(1, 0x5a4a3a);
            slot.upgradeButtonBg.drawCircle(this.slotSize / 2, 70, 18);
            slot.upgradeButtonBg.endFill();

            slot.upgradeButton.style.fill = '#8a7a6a';
            slot.upgradeButton.alpha = 0.5;
        }
    }

    /**
     * Обработка улучшения навыка
     */
    onUpgradeSkill(skillName) {
        const skill = this.character.skills[skillName];
        const canUpgrade = this.character.skillPoints >= (skill.cost || 1) && skill.level < skill.maxLevel;
        
        if (canUpgrade) {
            this.character.upgradeSkill(skillName);
            this.updateDisplay();
        }
    }

    /**
     * Обновление отображения
     */
    updateDisplay() {
        if (!this.isOpen) return;

        // Обновляем очки навыков
        this.pointsText.text = `Доступные очки навыков: ${this.character.skillPoints}`;

        // Обновляем полоску опыта
        this.updateExperienceBar();

        // Обновляем все слоты навыков
        for (const slot of this.skillSlots) {
            this.renderSkillSlot(slot);
        }
    }

    /**
     * Обновление полоски опыта
     */
    updateExperienceBar() {
        const barWidth = this.width - this.padding * 2;
        const barHeight = 24;

        const percent = this.character.experienceForNextLevel > 0
            ? (this.character.experience / this.character.experienceForNextLevel)
            : 0;

        // Очищаем и перерисовываем полоску
        this.expBarGraphics.clear();

        // Заполнение полоски
        const fillWidth = Math.floor(barWidth * percent);
        if (fillWidth > 0) {
            // Определяем цвет в зависимости от заполнения
            let expColor;
            if (percent < 0.3) {
                expColor = 0x8bc34a;
            } else if (percent < 0.6) {
                expColor = 0xffc107;
            } else if (percent < 0.85) {
                expColor = 0xff9800;
            } else {
                expColor = 0xff5722;
            }

            this.expBarGraphics.beginFill(expColor);
            this.expBarGraphics.drawRoundedRect(2, 22, fillWidth - 2, barHeight - 4, 2);
            this.expBarGraphics.endFill();
        }

        // Обновляем текст уровня
        this.levelText.text = `Уровень: ${this.character.level}`;

        // Обновляем текст опыта
        this.expText.text = `${this.character.experience} / ${this.character.experienceForNextLevel} (${(percent * 100).toFixed(1)}%)`;
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
     * Отрисовка фона окна - изящный дарк фентези стиль
     */
    renderBackground() {
        if (!this.graphics) return;

        // Основной градиентный фон
        for (let i = 0; i < this.height; i++) {
            const t = i / (this.height - 1);
            const r1 = 26, g1 = 20, b1 = 20;
            const r2 = 13, g2 = 10, b2 = 10;
            const r = Math.round(r1 + (r2 - r1) * t);
            const gr = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (gr << 8) + b;
            this.graphics.beginFill(color);
            this.graphics.drawRect(0, i, this.width, 1);
            this.graphics.endFill();
        }

        // Внешняя рамка
        this.graphics.lineStyle(2, 0x3a2a1a);
        this.graphics.drawRect(0, 0, this.width, this.height);

        // Толстая внешняя тень
        this.graphics.lineStyle(4, 0x000000, 0.4);
        this.graphics.drawRect(-3, -3, this.width + 6, this.height + 6);

        // Внутренняя тень
        this.graphics.lineStyle(2, 0x4a3a2a, 0.2);
        this.graphics.drawRect(3, 3, this.width - 6, this.height - 6);

        // Декоративные уголки
        this.drawCornerDecorations();

        // Линия под заголовком
        this.drawTitleLine();
    }

    /**
     * Отрисовка декоративных уголков
     */
    drawCornerDecorations() {
        const cornerSize = 8;

        // Верхний левый
        this.graphics.lineStyle(2, 0x6a5a4a);
        this.graphics.moveTo(5, 5 + cornerSize);
        this.graphics.lineTo(5, 5);
        this.graphics.lineTo(5 + cornerSize, 5);

        // Верхний правый
        this.graphics.moveTo(this.width - 5 - cornerSize, 5);
        this.graphics.lineTo(this.width - 5, 5);
        this.graphics.lineTo(this.width - 5, 5 + cornerSize);

        // Нижний левый
        this.graphics.moveTo(5, this.height - 5 - cornerSize);
        this.graphics.lineTo(5, this.height - 5);
        this.graphics.lineTo(5 + cornerSize, this.height - 5);

        // Нижний правый
        this.graphics.moveTo(this.width - 5 - cornerSize, this.height - 5);
        this.graphics.lineTo(this.width - 5, this.height - 5);
        this.graphics.lineTo(this.width - 5, this.height - 5 - cornerSize);
    }

    /**
     * Отрисовка линии под заголовком
     */
    drawTitleLine() {
        // Основная линия
        this.graphics.lineStyle(1, 0x3a2a1a);
        this.graphics.moveTo(this.padding, this.padding + 30);
        this.graphics.lineTo(this.width - this.padding, this.padding + 30);

        // Декоративная линия
        this.graphics.lineStyle(1, 0x6a5a4a, 0.5);
        this.graphics.moveTo(this.padding + 5, this.padding + 32);
        this.graphics.lineTo(this.width - this.padding - 5, this.padding + 32);
    }

    /**
     * Отрисовка содержимого
     */
    renderContent() {
        // Содержимое уже отрисовано в соответствующих методах
    }
}

// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UISkillTree;
} else if (typeof window !== 'undefined') {
    window.UISkillTree = UISkillTree;
}
