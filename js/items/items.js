class Item {
    constructor(type, name, stats = {}) {
        this.type = type; // weapon, helmet, armor, ring, amulet
        this.name = name;
        this.stats = stats; // Объект с бонусами {strength: 2, physicalDamage: 10, ...}
        this.rarity = this.generateRarity();
        this.value = this.calculateValue();
    }

    /**
     * Генерация редкости предмета
     * @returns {string} - редкость (common, uncommon, rare, epic)
     */
    generateRarity() {
        const roll = Math.random();

        if (roll < GAME_CONFIG.ITEMS.RARITY_CHANCES.COMMON) return 'common';
        else if (roll < GAME_CONFIG.ITEMS.RARITY_CHANCES.UNCOMMON) return 'uncommon';
        else if (roll < GAME_CONFIG.ITEMS.RARITY_CHANCES.RARE) return 'rare';
        else return 'epic';
    }

    /**
     * Расчет стоимости предмета на основе редкости и статов
     * @returns {number} - стоимость
     */
    calculateValue() {
        let baseValue = GAME_CONFIG.ITEMS.BASE_VALUE;

        // Увеличиваем стоимость в зависимости от редкости
        switch(this.rarity) {
            case 'uncommon': baseValue *= GAME_CONFIG.ITEMS.VALUE_MULTIPLIERS.UNCOMMON; break;
            case 'rare': baseValue *= GAME_CONFIG.ITEMS.VALUE_MULTIPLIERS.RARE; break;
            case 'epic': baseValue *= GAME_CONFIG.ITEMS.VALUE_MULTIPLIERS.EPIC; break;
        }

        // Увеличиваем стоимость в зависимости от суммы статов
        let statsSum = 0;
        for (const stat in this.stats) {
            statsSum += this.stats[stat];
        }

        return Math.floor(baseValue + statsSum * GAME_CONFIG.ITEMS.STAT_VALUE_MULTIPLIER);
    }

    /**
     * Получение цвета для отображения в зависимости от редкости
     * @returns {string} - цвет в формате CSS
     */
    getColorByRarity() {
        switch(this.rarity) {
            case 'common': return '#ffffff';    // Белый
            case 'uncommon': return '#00ff00';  // Зеленый
            case 'rare': return '#0080ff';     // Синий
            case 'epic': return '#d4af37';     // Золотой
            default: return '#ffffff';
        }
    }

    /**
     * Получение описания предмета
     * @returns {string} - описание
     */
    getDescription() {
        let description = `<b>${this.name}</b><br>`;
        description += `<span style="color:${this.getColorByRarity()}">${this.getRarityDisplayName()}</span><br><br>`;

        for (const stat in this.stats) {
            const statName = this.getStatDisplayName(stat);
            const statValue = this.stats[stat];
            description += `+${statValue} ${statName}<br>`;
        }

        description += `<br>Стоимость: ${this.value} золота`;

        return description;
    }

    /**
     * Получение отображаемого названия редкости
     * @returns {string}
     */
    getRarityDisplayName() {
        const names = {
            'common': 'Обычный',
            'uncommon': 'Необычный',
            'rare': 'Редкий',
            'epic': 'Эпический'
        };
        return names[this.rarity] || this.rarity;
    }

    /**
     * Получение отображаемого названия стата
     * @param {string} stat - внутреннее имя стата
     * @returns {string} - отображаемое имя
     */
    getStatDisplayName(stat) {
        const statNames = {
            // Основные характеристики
            'strength': 'Сила',
            'dexterity': 'Ловкость',
            'vitality': 'Живучесть',
            'energy': 'Энергия',
            'intelligence': 'Интеллект',
            // Производные характеристики
            'physicalDamage': 'Физ. урон',
            'magicDamage': 'Маг. урон',
            'attackSpeed': 'Скорость атаки',
            'criticalChance': 'Шанс крита',
            'manaRegen': 'Реген. маны',
            'health': 'Здоровье',
            // Устаревшие (для совместимости)
            'damage': 'Урон',
            'armor': 'Броня',
            'accuracy': 'Меткость',
            'dodge': 'Уклонение'
        };

        return statNames[stat] || stat;
    }
}

// Функция для генерации случайного предмета
function generateRandomItem(level = 1) {
    // Типы предметов
    const itemTypes = ['weapon', 'helmet', 'armor', 'ring', 'amulet'];
    const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

    // Базовые названия для разных типов
    const itemNames = {
        'weapon': ['Меч', 'Топор', 'Кинжал', 'Посох', 'Лук'],
        'helmet': ['Шлем', 'Капюшон', 'Корона', 'Маска', 'Обруч'],
        'armor': ['Доспехи', 'Халат', 'Кожанка', 'Кольчуга', 'Нагрудник'],
        'ring': ['Кольцо', 'Перстень', 'Обруч'],
        'amulet': ['Амулет', 'Кулон', 'Подвеска']
    };

    // Выбираем случайное имя для типа предмета
    const itemName = itemNames[itemType][Math.floor(Math.random() * itemNames[itemType].length)];

    // Генерируем случайные статы в зависимости от типа и уровня
    const stats = {};

    // Получаем возможные статы для этого типа предмета из конфига
    const possibleStats = GAME_CONFIG.ITEMS.POSSIBLE_STATS_BY_TYPE[itemType] || 
                          ['strength', 'dexterity', 'vitality', 'energy', 'intelligence'];

    // Определяем количество статов в зависимости от редкости
    // Сначала генерируем редкость, чтобы знать сколько статов давать
    const rarityRoll = Math.random();
    let rarity = 'common';
    if (rarityRoll >= GAME_CONFIG.ITEMS.RARITY_CHANCES.RARE) rarity = 'rare';
    else if (rarityRoll >= GAME_CONFIG.ITEMS.RARITY_CHANCES.UNCOMMON) rarity = 'uncommon';
    
    const statsCount = GAME_CONFIG.ITEMS.STATS_PER_RARITY[rarity] || 1;

    // Добавляем случайные статы
    const selectedStats = [];

    for (let i = 0; i < statsCount; i++) {
        const randomStat = possibleStats[Math.floor(Math.random() * possibleStats.length)];
        if (!selectedStats.includes(randomStat)) {
            selectedStats.push(randomStat);

            // Получаем диапазон значений для этого стата
            const statRange = GAME_CONFIG.ITEMS.STAT_VALUE_RANGES[randomStat];
            let statValue;
            
            if (statRange) {
                // Генерируем значение в диапазоне
                const range = statRange.max - statRange.min;
                // Значение зависит от уровня (но не больше максимума)
                const levelBonus = Math.min(level - 1, 5); // Максимум +5 уровней
                statValue = Math.floor(statRange.min + Math.random() * range) + Math.floor(levelBonus / 2);
                statValue = Math.max(statRange.min, Math.min(statValue, statRange.max));
            } else {
                // fallback для неизвестных статов
                statValue = Math.floor(Math.random() * level) + 1;
            }
            
            stats[randomStat] = statValue;
        }
    }

    // Создаем и возвращаем предмет
    return new Item(itemType, itemName, stats);
}