/**
 * UISkillBar - панель навыков на новой системе UI
 * Изящный дарк фентези стиль
 */
class UISkillBar extends UIComponent {
    constructor(character, config = {}) {
        super(config);

        this.character = character;
        this.hotkeys = {};
        this.skillElements = {};

        // Размеры
        this.slotSize = 50;
        this.slotGap = 5;
        this.orbSize = 60;
        this.orbRadius = 26;
        this.orbCircumference = 2 * Math.PI * this.orbRadius;

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
        this.width = totalSlotsWidth + barPadding * 2 + this.orbSize * 2 + 20;
        this.height = this.orbSize + 25; // + место для полоски опыта

        // Создаем контейнер для орбов и слотов
        this.orbsContainer = new PIXI.Container();
        this.container.addChild(this.orbsContainer);

        this.slotsContainer = new PIXI.Container();
        this.container.addChild(this.slotsContainer);

        // Создаем основные элементы
        this.createHealthManaOrbs();
        this.createSkillSlots();
        this.createExperienceBar();

        // Обновляем отображение
        this.updateHealthManaDisplay();
        this.updateExperienceBar();
    }

    /**
     * Создание орбов здоровья и маны
     */
    createHealthManaOrbs() {
        // Орб здоровья (слева)
        this.healthOrbContainer = new PIXI.Container();
        this.healthOrbContainer.x = 0;
        this.healthOrbContainer.y = (this.orbSize - 60) / 2;
        this.orbsContainer.addChild(this.healthOrbContainer);

        // Фон орба здоровья
        const healthBgGraphics = new PIXI.Graphics();
        healthBgGraphics.lineStyle(4, 0x1a1a1a);
        healthBgGraphics.drawCircle(30, 30, this.orbRadius);
        this.healthOrbContainer.addChild(healthBgGraphics);

        // Прогресс здоровья
        this.healthProgress = new PIXI.Graphics();
        this.healthOrbContainer.addChild(this.healthProgress);

        // Текст здоровья
        this.healthText = this.createText('', {
            fontSize: 10,
            color: '#ff0000',
            bold: true
        });
        this.healthText.anchor.set(0.5);
        this.healthText.x = 30;
        this.healthText.y = 30;
        this.healthOrbContainer.addChild(this.healthText);

        // Орб маны (справа)
        this.manaOrbContainer = new PIXI.Container();
        this.manaOrbContainer.x = this.width - this.orbSize;
        this.manaOrbContainer.y = (this.orbSize - 60) / 2;
        this.orbsContainer.addChild(this.manaOrbContainer);

        // Фон орба маны
        const manaBgGraphics = new PIXI.Graphics();
        manaBgGraphics.lineStyle(4, 0x1a1a1a);
        manaBgGraphics.drawCircle(30, 30, this.orbRadius);
        this.manaOrbContainer.addChild(manaBgGraphics);

        // Прогресс маны
        this.manaProgress = new PIXI.Graphics();
        this.manaOrbContainer.addChild(this.manaProgress);

        // Текст маны
        this.manaText = this.createText('', {
            fontSize: 10,
            color: '#0000ff',
            bold: true
        });
        this.manaText.anchor.set(0.5);
        this.manaText.x = 30;
        this.manaText.y = 30;
        this.manaOrbContainer.addChild(this.manaText);
    }

    /**
     * Отрисовка кругового прогресса
     */
    renderCircularProgress(graphics, value, fillColor, isLow = false) {
        graphics.clear();

        const centerX = 30;
        const centerY = 30;
        const borderWidth = 4;

        if (value <= 0) return;

        // Цвет с эффектом при низком здоровье
        const color = isLow ? 0xff3333 : fillColor;

        // Рисуем дугу
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + 2 * Math.PI * value;

        graphics.lineStyle(borderWidth, color);

        const points = [];
        const steps = Math.max(1, Math.floor(this.orbCircumference / 2));

        for (let i = 0; i <= steps; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / steps);
            points.push(centerX + Math.cos(angle) * this.orbRadius);
            points.push(centerY + Math.sin(angle) * this.orbRadius);
        }

        if (points.length >= 4) {
            graphics.moveTo(points[0], points[1]);
            for (let i = 2; i < points.length; i += 2) {
                graphics.lineTo(points[i], points[i + 1]);
            }
        }
    }

    /**
     * Создание слотов навыков
     */
    createSkillSlots() {
        const barPadding = 8;
        const totalSlotsWidth = 9 * this.slotSize + 8 * this.slotGap;

        const startX = this.orbSize + 10;
        const startY = (this.orbSize - this.slotSize) / 2;

        this.slotsContainer.x = startX;
        this.slotsContainer.y = startY;

        // Создаем 9 слотов
        for (let i = 1; i <= 9; i++) {
            const slotIndex = i - 1;
            const x = slotIndex * (this.slotSize + this.slotGap);
            const y = 0;

            const slot = this.createSkillSlot(i, x, y);
            this.skillElements[i] = slot;
            this.slotsContainer.addChild(slot.container);
        }
    }

    /**
     * Создание отдельного слота навыка
     */
    createSkillSlot(slotNumber, x, y) {
        const slot = {
            slotNumber: slotNumber,
            x: x,
            y: y,
            width: this.slotSize,
            height: this.slotSize,
            container: new PIXI.Container(),
            background: new PIXI.Graphics(),
            numberText: null,
            icon: null,
            cooldownOverlay: null,
            isHovered: false
        };

        slot.container.x = x;
        slot.container.y = y;
        slot.container.addChild(slot.background);

        // Номер слота
        slot.numberText = this.createText(slotNumber.toString(), {
            fontSize: 11,
            color: '#c9b896'
        });
        slot.numberText.anchor.set(0, 0);
        slot.numberText.x = 2;
        slot.numberText.y = 0;
        slot.container.addChild(slot.numberText);

        // Контейнер для иконки
        slot.iconContainer = new PIXI.Container();
        slot.iconContainer.x = this.slotSize / 2;
        slot.iconContainer.y = this.slotSize / 2;
        slot.container.addChild(slot.iconContainer);

        // Оверлей кулдауна
        slot.cooldownOverlay = new PIXI.Graphics();
        slot.cooldownOverlay.visible = false;
        slot.container.addChild(slot.cooldownOverlay);

        // Интерактивность
        slot.container.eventMode = 'static';
        slot.container.cursor = 'pointer';

        slot.container.on('pointerover', () => {
            slot.isHovered = true;
            this.renderSkillSlot(slot);
            this.showSlotTooltip(slotNumber);
        });

        slot.container.on('pointerout', () => {
            slot.isHovered = false;
            this.renderSkillSlot(slot);
            this.hideTooltip();
        });

        slot.container.on('pointerdown', (e) => {
            if (e.data.button === 2) {
                // Правый клик - назначение навыка
                this.showSkillAssignmentMenu(slotNumber);
            } else {
                // Левый клик - использование
                this.useSkillInSlot(slotNumber);
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
        for (let i = 0; i < this.slotSize; i++) {
            const t = i / (this.slotSize - 1);
            const r1 = 42, g1 = 26, b1 = 26;
            const r2 = 26, g2 = 15, b2 = 15;
            const r = Math.round(r1 + (r2 - r1) * t);
            const gr = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (gr << 8) + b;
            g.beginFill(color);
            g.drawRect(0, i, this.slotSize, 1);
            g.endFill();
        }

        // Внутренняя тень
        g.beginFill(0xc9b896, slot.isHovered ? 0.15 : 0.08);
        g.drawRect(0, 0, this.slotSize, 1);
        g.endFill();

        // Рамка
        const borderColor = slot.isHovered ? 0x6a5a4a : 0x3a2a1a;
        g.lineStyle(2, borderColor);
        g.drawRoundedRect(0, 0, this.slotSize, this.slotSize, 3);
    }

    /**
     * Создание полоски опыта
     */
    createExperienceBar() {
        const barPadding = 8;
        const totalSlotsWidth = 9 * this.slotSize + 8 * this.slotGap;
        const barWidth = totalSlotsWidth + barPadding * 2;
        const barHeight = 16;

        const startX = this.orbSize + 10;
        const startY = this.orbSize + 5;

        // Контейнер для полоски опыта
        this.expBarContainer = new PIXI.Container();
        this.expBarContainer.x = startX;
        this.expBarContainer.y = startY;
        this.container.addChild(this.expBarContainer);

        // Фон полоски
        this.expBarBg = new PIXI.Graphics();
        this.expBarBg.beginFill(0x1a1414);
        this.expBarBg.lineStyle(2, 0x3a2a1a);
        this.expBarBg.drawRoundedRect(0, 0, barWidth, barHeight, 2);
        this.expBarBg.endFill();
        this.expBarContainer.addChild(this.expBarBg);

        // Прогресс полоски
        this.expBarFill = new PIXI.Graphics();
        this.expBarContainer.addChild(this.expBarFill);

        // Текст опыта
        this.expText = this.createText('', {
            fontSize: 10,
            color: '#c9b896'
        });
        this.expText.anchor.set(0.5);
        this.expText.x = barWidth / 2;
        this.expText.y = barHeight / 2;
        this.expBarContainer.addChild(this.expText);
    }

    /**
     * Обновление отображения здоровья и маны
     */
    updateHealthManaDisplay() {
        if (!this.character) return;

        // Здоровье
        const healthPercent = this.character.health / this.character.maxHealth;
        const isHealthLow = healthPercent < 0.3;

        this.renderCircularProgress(
            this.healthProgress,
            healthPercent,
            0xff0000,
            isHealthLow
        );

        // Текст здоровья
        this.healthText.text = `${this.character.health}/${this.character.maxHealth}`;
        this.healthText.style.fill = isHealthLow ? '#ff3333' : '#ff0000';

        // Мана
        const manaPercent = this.character.mana / this.character.maxMana;

        this.renderCircularProgress(
            this.manaProgress,
            manaPercent,
            0x0000ff
        );

        // Текст маны
        this.manaText.text = `${Math.floor(this.character.mana)}/${this.character.maxMana}`;
    }

    /**
     * Обновление полоски опыта
     */
    updateExperienceBar() {
        if (!this.character) return;

        const percent = this.character.experienceForNextLevel > 0
            ? (this.character.experience / this.character.experienceForNextLevel)
            : 0;

        const barWidth = 9 * this.slotSize + 8 * this.slotGap + 16;
        const barHeight = 16;

        // Очищаем и перерисовываем заполнение
        this.expBarFill.clear();

        const fillWidth = Math.floor((barWidth - 4) * percent);
        if (fillWidth > 0) {
            // Цвет в зависимости от заполнения
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

            this.expBarFill.beginFill(expColor);
            this.expBarFill.drawRoundedRect(2, 2, fillWidth, barHeight - 4, 1);
            this.expBarFill.endFill();
        }

        // Текст опыта
        this.expText.text = `${this.character.experience} / ${this.character.experienceForNextLevel} (${(percent * 100).toFixed(1)}%)`;
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

        // Удаляем старую иконку
        if (slot.icon) {
            slot.iconContainer.removeChild(slot.icon);
            slot.icon = null;
        }

        if (skillName && this.character.skills[skillName]) {
            const skill = this.character.skills[skillName];

            // Получаем текстуру иконки
            const iconTexture = this.getSkillIconTexture(skillName);

            // Создаем иконку
            slot.icon = new PIXI.Sprite(iconTexture);
            slot.icon.anchor.set(0.5);
            slot.icon.x = 0;
            slot.icon.y = 0;
            slot.iconContainer.addChild(slot.icon);
        }
    }

    /**
     * Получение текстуры иконки навыка
     */
    getSkillIconTexture(skillName) {
        const cacheKey = `skill_icon_${skillName}`;
        if (this.uiRenderer.textureCache.has(cacheKey)) {
            return this.uiRenderer.textureCache.get(cacheKey);
        }

        const colors = {
            fireball: 0xff5722,
            heal: 0x4caf50,
            melee_mastery: 0xff9800,
            critical_strike: 0xf44336,
            life_leech: 0x9c27b0,
            iron_skin: 0x795548,
            dodge: 0x2196f3
        };

        const color = colors[skillName] || 0x607d8b;

        const g = new PIXI.Graphics();
        g.beginFill(color);
        g.drawRect(0, 0, 24, 24);
        g.endFill();

        const texture = this.uiRenderer.app.renderer.generateTexture(g);
        g.destroy();

        this.uiRenderer.textureCache.set(cacheKey, texture);
        return texture;
    }

    /**
     * Использование навыка в слоте
     */
    useSkillInSlot(slotNumber) {
        const skillName = this.hotkeys[slotNumber];
        if (!skillName) return;

        if (this.game && this.game.useSkillOnNearbyEnemies) {
            this.game.useSkillOnNearbyEnemies(skillName);
        } else if (window.game && window.game.useSkillOnNearbyEnemies) {
            window.game.useSkillOnNearbyEnemies(skillName);
        }
    }

    /**
     * Показ меню назначения навыка
     */
    showSkillAssignmentMenu(slotNumber) {
        // Простая реализация - циклическое переключение навыков
        const skillNames = Object.keys(this.character.skills);
        const currentSkill = this.hotkeys[slotNumber];
        const currentIndex = skillNames.indexOf(currentSkill);
        const nextIndex = (currentIndex + 1) % skillNames.length;
        const nextSkill = skillNames[nextIndex];

        this.assignSkillToSlot(slotNumber, nextSkill);
    }

    /**
     * Показ тултипа для слота
     */
    showSlotTooltip(slotNumber) {
        const skillName = this.hotkeys[slotNumber];
        if (!skillName || !this.character.skills[skillName]) {
            this.hideTooltip();
            return;
        }

        const skill = this.character.skills[skillName];
        const title = skill.name;
        const description = `Уровень: ${skill.level}/${skill.maxLevel}\n${skill.description}`;

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
     * Создание текстового спрайта
     */
    createText(text, options = {}) {
        const fontSize = options.fontSize || 14;
        const color = options.color || '#c9b896';
        const bold = options.bold || false;

        const style = new PIXI.TextStyle({
            fontFamily: "'MedievalSharp', Georgia, serif",
            fontSize: fontSize,
            fill: color,
            fontWeight: bold ? 'bold' : 'normal',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 2,
            dropShadowDistance: 1,
            dropShadowAngle: Math.PI / 4
        });

        return new PIXI.Text(text, style);
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

        for (let i = 1; i <= 9; i++) {
            this.updateSlotDisplay(i);
        }
    }

    /**
     * Публичный метод обновления
     */
    update() {
        this.onUpdate(16.67);
    }

    /**
     * Обработка горячих клавиш
     */
    handleHotkey(key) {
        const slotNumber = parseInt(key);
        if (slotNumber >= 1 && slotNumber <= 9) {
            this.useSkillInSlot(slotNumber);
        }
    }

    /**
     * Отрисовка фона панели
     */
    renderBackground() {
        if (!this.graphics) return;

        // Фон для центральной панели с навыками
        const barPadding = 8;
        const totalSlotsWidth = 9 * this.slotSize + 8 * this.slotGap;
        const panelX = this.orbSize + 10;
        const panelY = (this.orbSize - this.slotSize) / 2 - barPadding;
        const panelWidth = totalSlotsWidth + barPadding * 2;
        const panelHeight = this.slotSize + barPadding * 2;

        // Градиентный фон центральной панели
        for (let i = 0; i < panelHeight; i++) {
            const t = i / (panelHeight - 1);
            const r1 = 26, g1 = 20, b1 = 20;
            const r2 = 13, g2 = 10, b2 = 10;
            const r = Math.round(r1 + (r2 - r1) * t);
            const gr = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            const color = (r << 16) + (gr << 8) + b;
            this.graphics.beginFill(color);
            this.graphics.drawRect(panelX, panelY + i, panelWidth, 1);
            this.graphics.endFill();
        }

        // Рамка центральной панели
        this.graphics.lineStyle(2, 0x3a2a1a);
        this.graphics.drawRoundedRect(panelX, panelY, panelWidth, panelHeight, 3);

        // Декоративные уголки на орбах
        this.drawOrbDecorations();
    }

    /**
     * Отрисовка декоративных элементов на орбах
     */
    drawOrbDecorations() {
        const cornerSize = 6;

        // Левый орб (здоровье)
        this.graphics.lineStyle(2, 0x6a5a4a);

        // Верхний левый угол
        this.graphics.moveTo(5, 5 + cornerSize);
        this.graphics.lineTo(5, 5);
        this.graphics.lineTo(5 + cornerSize, 5);

        // Нижний левый угол
        this.graphics.moveTo(5, this.orbSize - 5 - cornerSize);
        this.graphics.lineTo(5, this.orbSize - 5);
        this.graphics.lineTo(5 + cornerSize, this.orbSize - 5);

        // Правый орб (мана)
        const orbX = this.width - this.orbSize;

        // Верхний правый угол
        this.graphics.moveTo(orbX + this.orbSize - 5 - cornerSize, 5);
        this.graphics.lineTo(orbX + this.orbSize - 5, 5);
        this.graphics.lineTo(orbX + this.orbSize - 5, 5 + cornerSize);

        // Нижний правый угол
        this.graphics.moveTo(orbX + this.orbSize - 5 - cornerSize, this.orbSize - 5);
        this.graphics.lineTo(orbX + this.orbSize - 5, this.orbSize - 5);
        this.graphics.lineTo(orbX + this.orbSize - 5, this.orbSize - 5 - cornerSize);
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
    module.exports = UISkillBar;
} else if (typeof window !== 'undefined') {
    window.UISkillBar = UISkillBar;
}
