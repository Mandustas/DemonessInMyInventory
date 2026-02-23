class Character {
    constructor(x, y) {
        this.x = x;           // 2D координата X
        this.y = y;           // 2D координата Y
        this.isoX = 0;        // Изометрическая координата X
        this.isoY = 0;        // Изометрическая координата Y
        this.width = 32;      // Ширина персонажа
        this.height = 32;     // Высота персонажа

        // Характеристики персонажа
        this.health = GAME_CONFIG.CHARACTER.INITIAL_HEALTH;
        this.maxHealth = GAME_CONFIG.CHARACTER.INITIAL_HEALTH;
        this.mana = GAME_CONFIG.CHARACTER.INITIAL_MANA;       // Мана для использования навыков
        this.maxMana = GAME_CONFIG.CHARACTER.INITIAL_MANA;    // Максимальная mana
        this.level = GAME_CONFIG.CHARACTER.INITIAL_LEVEL;
        this.experience = GAME_CONFIG.CHARACTER.INITIAL_EXPERIENCE;
        this.experienceForNextLevel = GAME_CONFIG.CHARACTER.EXPERIENCE_PER_LEVEL;

        // Основные характеристики
        this.strength = GAME_CONFIG.CHARACTER.INITIAL_STRENGTH;      // Сила - физический урон
        this.dexterity = GAME_CONFIG.CHARACTER.INITIAL_DEXTERITY;    // Ловкость - скорость атаки и крит
        this.vitality = GAME_CONFIG.CHARACTER.INITIAL_VITALITY;      // Живучесть - здоровье
        this.energy = GAME_CONFIG.CHARACTER.INITIAL_ENERGY;          // Энергия - мана и регенерация
        this.intelligence = GAME_CONFIG.CHARACTER.INITIAL_INTELLIGENCE; // Интеллект - магический урон и мана

        // Слоты экипировки
        this.equipment = {
            weapon: null,
            helmet: null,
            armor: null,
            ring: null,
            amulet: null
        };

        // Инвентарь
        this.inventory = Array(GAME_CONFIG.CHARACTER.INVENTORY_SIZE).fill(null);

        // Навыки
        this.skillPoints = 0;
        this.skills = {
            // Боевые навыки
            'melee_mastery': { level: 0, maxLevel: 5, cost: 1, name: 'Боевое мастерство', description: 'Увеличивает физический урон на 10% за уровень' },
            'critical_strike': { level: 0, maxLevel: 5, cost: 1, name: 'Критический удар', description: 'Увеличивает шанс критического удара на 3% за уровень' },
            'life_leech': { level: 0, maxLevel: 5, cost: 1, name: 'Похищение жизни', description: 'Восстанавливает 2% нанесенного урона как здоровье за уровень' },

            // Магические навыки
            'magic_mastery': { level: 0, maxLevel: 5, cost: 1, name: 'Мастерство магии', description: 'Увеличивает магический урон на 10% за уровень' },
            'mana_efficiency': { level: 0, maxLevel: 5, cost: 1, name: 'Эффективность маны', description: 'Снижает стоимость заклинаний на 5% за уровень' },

            // Специальные навыки
            'fireball': { level: 0, maxLevel: 5, cost: 2, name: 'Огненный шар', description: 'Атака магическим огнем, наносит урон от интеллекта' },
            'heal': { level: 0, maxLevel: 5, cost: 2, name: 'Лечение', description: 'Восстанавливает здоровье' }
        };

        // Хитбокс
        this.hitboxRadius = GAME_CONFIG.CHARACTER.HITBOX_RADIUS;

        // Обновляем изометрические координаты
        this.updateIsoCoords();
    }
    
    /**
     * Обновление изометрических координат на основе 2D координат
     */
    updateIsoCoords() {
        const isoCoords = coordToIso(this.x, this.y);
        this.isoX = isoCoords.isoX;
        this.isoY = isoCoords.isoY;
    }
    
    /**
     * Перемещение персонажа
     * @param {number} deltaX - изменение по оси X
     * @param {number} deltaY - изменение по оси Y
     */
    move(deltaX, deltaY) {
        this.x += deltaX;
        this.y += deltaY;
        this.updateIsoCoords();
    }
    
    /**
     * Установка позиции персонажа
     * @param {number} x - новая X координата
     * @param {number} y - новая Y координата
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updateIsoCoords();
    }
    
    /**
     * Получение урона (физического или магического)
     * @param {number} damage - количество урона
     * @param {boolean} isCritical - является ли урон критическим
     * @param {string} damageType - тип урона ('physical' или 'magic')
     */
    takeDamage(damage, isCritical = false, damageType = 'physical') {
        // Урон применяется напрямую (без брони)
        const actualDamage = Math.max(1, Math.floor(damage));
        this.health -= actualDamage;

        // Вызываем эффект получения урона
        if (typeof game !== 'undefined' && game.combatEffects) {
            game.combatEffects.triggerDamage(this.x, this.y, actualDamage, isCritical);
        } else {
            console.warn('Боевая система эффектов не доступна при получении урона персонажем');
        }

        if (this.health <= 0) {
            this.health = 0;
            this.onDeath();
        }

        return actualDamage;
    }
    
    /**
     * Восстановление здоровья
     * @param {number} amount - количество восстанавливаемого здоровья
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    /**
     * Нанесение урона цели (физического или магического)
     * @param {Character|Enemy} target - цель для атаки
     * @param {string} damageType - тип урона ('physical' или 'magic')
     * @returns {number} - нанесённый урон
     */
    attack(target, damageType = 'physical') {
        // Вызываем эффект атаки
        if (typeof game !== 'undefined' && game.combatEffects) {
            game.combatEffects.triggerAttack(this.x, this.y, 'player');
        } else {
            console.warn('Боевая система эффектов не доступна при атаке персонажем');
        }

        // Получаем урон в зависимости от типа
        let baseDamage;
        if (damageType === 'magic') {
            baseDamage = this.getTotalStat('magicDamage');
        } else {
            baseDamage = this.getTotalStat('physicalDamage');
        }

        // Получаем шанс крита
        const criticalChance = Math.min(
            this.getTotalStat('criticalChance'),
            GAME_CONFIG.CHARACTER.MAX_CRITICAL_CHANCE
        );

        // Проверяем критический удар
        let isCritical = false;
        let damageMultiplier = 1.0;
        if (Math.random() <= criticalChance / 100) {
            isCritical = true;
            damageMultiplier = GAME_CONFIG.COMBAT.CRITICAL_DAMAGE_MULTIPLIER;
        }

        // Рассчитываем финальный урон с разбросом
        const damageVariation = GAME_CONFIG.COMBAT.DAMAGE_VARIATION_MIN +
            Math.random() * (GAME_CONFIG.COMBAT.DAMAGE_VARIATION_MAX - GAME_CONFIG.COMBAT.DAMAGE_VARIATION_MIN);
        let damage = Math.floor(baseDamage * damageVariation * damageMultiplier);
        damage = Math.max(GAME_CONFIG.COMBAT.MIN_DAMAGE, damage);

        // Передаём себя как атакующего для откидывания врага при критическом ударе
        return target.takeDamage(damage, isCritical, damageType, this);
    }
    
    /**
     * Получение общего значения характеристики с учётом экипировки и навыков
     * @param {string} statName - название характеристики
     * @returns {number} - общее значение характеристики
     */
    getTotalStat(statName) {
        let baseValue = 0;

        switch(statName) {
            // === ПЕРВИЧНЫЕ ХАРАКТЕРИСТИКИ ===
            case 'strength':
            case 'dexterity':
            case 'vitality':
            case 'energy':
            case 'intelligence':
                baseValue = this[statName] || 0;
                break;

            // === ЗДОРОВЬЕ И МАНА ===
            case 'health':
            case 'maxHealth':
                baseValue = this.vitality * GAME_CONFIG.CHARACTER.VITALITY_HP_MULTIPLIER;
                break;

            case 'mana':
            case 'maxMana':
                baseValue = (this.energy * GAME_CONFIG.CHARACTER.ENERGY_MANA_MULTIPLIER) +
                           (this.intelligence * GAME_CONFIG.CHARACTER.INTELLIGENCE_MANA_MULTIPLIER);
                break;

            // === УРОН ===
            case 'physicalDamage':
                // Физический урон от силы + бонусы от экипировки
                baseValue = this.strength * GAME_CONFIG.CHARACTER.STRENGTH_PHYSICAL_DAMAGE_MULTIPLIER;
                break;

            case 'magicDamage':
                // Магический урон от интеллекта + бонусы от экипировки
                baseValue = this.intelligence * GAME_CONFIG.CHARACTER.INTELLIGENCE_MAGIC_DAMAGE_MULTIPLIER;
                break;

            // === СКОРОСТЬ АТАКИ ===
            case 'attackSpeed':
                // Базовая скорость + бонус от ловкости
                baseValue = GAME_CONFIG.CHARACTER.BASE_ATTACK_SPEED +
                           (this.dexterity * GAME_CONFIG.CHARACTER.DEXTERITY_ATTACK_SPEED_MULTIPLIER);
                break;

            // === ШАНС КРИТА ===
            case 'criticalChance':
                // Шанс крита от ловкости
                baseValue = this.dexterity * GAME_CONFIG.CHARACTER.DEXTERITY_CRITICAL_MULTIPLIER;
                break;

            // === ВОССТАНОВЛЕНИЕ МАНЫ ===
            case 'manaRegen':
                // Регенерация маны в секунду
                baseValue = GAME_CONFIG.CHARACTER.BASE_MANA_REGEN +
                           (this.energy * GAME_CONFIG.CHARACTER.ENERGY_MANA_REGEN_MULTIPLIER) +
                           (this.intelligence * GAME_CONFIG.CHARACTER.INTELLIGENCE_MANA_REGEN_MULTIPLIER);
                break;

            // === УСТАРЕВШИЕ (для совместимости) ===
            case 'damage':
                // Возвращаем физический урон для обратной совместимости
                baseValue = this.strength * GAME_CONFIG.CHARACTER.STRENGTH_PHYSICAL_DAMAGE_MULTIPLIER;
                break;

            case 'armor':
            case 'accuracy':
            case 'dodge':
                // Убраны из игры
                baseValue = 0;
                break;

            default:
                baseValue = this[statName] || 0;
        }

        // Добавляем бонусы от экипировки
        for (const slot in this.equipment) {
            const item = this.equipment[slot];
            if (item && item.stats) {
                // Проверяем прямой стат
                if (item.stats[statName]) {
                    baseValue += item.stats[statName];
                }
                // Проверяем альтернативные названия статов
                if (statName === 'physicalDamage' && item.stats.damage) {
                    baseValue += item.stats.damage;
                }
                if (statName === 'criticalChance' && item.stats.critical) {
                    baseValue += item.stats.critical;
                }
            }
        }

        // Добавляем бонусы от навыков
        baseValue += this.getSkillsBonusForStat(statName);

        return Math.floor(baseValue * 10) / 10; // Округляем до 1 знака
    }
    
    /**
     * Получение опыта
     * @param {number} exp - количество опыта
     */
    gainExperience(exp) {
        this.experience += exp;

        // Проверяем, повысился ли уровень
        while (this.experience >= this.experienceForNextLevel) {
            this.levelUp();
        }

        // Обновляем UI, если есть доступ к игре
        if (window.game && window.game.uiStatsWindow && window.game.uiStatsWindow.isOpen) {
            window.game.uiStatsWindow.onStatsUpdate();
        }
        if (window.game && window.game.uiSkillBar) {
            window.game.uiSkillBar.update();
        }
    }
    
    /**
     * Повышение уровня
     */
    levelUp() {
        this.level++;
        this.experience -= this.experienceForNextLevel;
        this.experienceForNextLevel = Math.floor(this.experienceForNextLevel * GAME_CONFIG.CHARACTER.EXPERIENCE_MULTIPLIER);

        // Восстанавливаем здоровье и ману при повышении уровня
        this.maxHealth = this.getTotalStat('maxHealth');
        this.health = this.maxHealth;
        this.maxMana = this.getTotalStat('maxMana');
        this.mana = this.maxMana;

        // Характеристики НЕ увеличиваются от уровня (только от предметов)

        // Добавляем очко навыков за каждый уровень
        this.gainSkillPoint();

        // Обновляем UI
        if (window.game && window.game.uiStatsWindow) {
            window.game.uiStatsWindow.onStatsUpdate();
        }
        if (window.game && window.game.uiSkillBar) {
            window.game.uiSkillBar.update();
        }

        // Уведомляем об изменении уровня
        this.onLevelChanged && this.onLevelChanged(this.level, this.x, this.y);
    }
    
    /**
     * Получение очков навыков (при повышении уровня)
     */
    gainSkillPoint() {
        this.skillPoints++;
        console.log(`Получено очко навыков. Всего доступно: ${this.skillPoints}`);

        // Обновляем UI дерева навыков
        if (window.game && window.game.uiSkillTree) {
            window.game.uiSkillTree.onCharacterUpdate();
        }
    }
    
    /**
     * Обработка смерти персонажа
     */
    onDeath() {
        console.log('Персонаж умер!');

        // Воспроизводим звук смерти
        if (window.game && window.game.audioSystem) {
            window.game.audioSystem.playDeathSound();
        }

        // Показываем экран смерти через игру
        if (window.game && window.game.uiDeathScreen) {
            window.game.showDeathScreen();
        }
    }
    
    /**
     * Возрождение персонажа
     */
    respawn() {
        // Пересчитываем максимальные характеристики от текущих статов
        this.maxHealth = this.getTotalStat('maxHealth');
        this.maxMana = this.getTotalStat('maxMana');
        
        // Восстанавливаем здоровье и ману
        this.health = this.maxHealth;
        this.mana = this.maxMana;

        // Находим безопасное место для возрождения
        const safeSpawn = this.findSafeSpawnLocation();
        this.x = safeSpawn.x;
        this.y = safeSpawn.y;
        this.updateIsoCoords();

        console.log('Персонаж возрожден!', this.x, this.y);

        // Если есть игра, обновляем позицию
        if (window.game) {
            window.game.character.setPosition(this.x, this.y);
        }
    }

    /**
     * Поиск безопасного места для возрождения
     * @returns {{x: number, y: number}} - безопасные координаты
     */
    findSafeSpawnLocation() {
        // Пробуем найти безопасное место вокруг центра карты
        const centerX = 0;
        const centerY = 0;
        const maxRadius = 200;
        const step = 32;

        // Проверяем точки по спирали от центра
        for (let radius = 0; radius < maxRadius; radius += step) {
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;

                // Проверяем, проходимо ли это место
                if (this.isLocationPassable(x, y)) {
                    return { x: Math.floor(x), y: Math.floor(y) };
                }
            }
        }

        // Если не нашли безопасное место, возвращаем центр (на всякий случай)
        return { x: 0, y: 0 };
    }

    /**
     * Проверка, проходимо ли место
     * @param {number} x - координата X
     * @param {number} y - координата Y
     * @returns {boolean} - проходимо ли место
     */
    isLocationPassable(x, y) {
        // Если есть доступ к системе чанков, проверяем через неё
        if (window.game && window.game.chunkSystem) {
            // Преобразуем координаты в координаты тайлов
            const tileX = Math.floor(x / 64);
            const tileY = Math.floor(y / 32);
            return window.game.chunkSystem.isPassable(tileX, tileY);
        }

        // Если есть доступ к worldMap, проверяем через неё
        if (window.game && window.game.worldMap) {
            return window.game.worldMap.isPassable(x, y);
        }

        // Если ничего нет, считаем место проходимым
        return true;
    }
    
    /**
     * Попытка надеть предмет
     * @param {Item} item - предмет для экипировки
     * @returns {boolean} - успешно ли надет предмет
     */
    equipItem(item) {
        if (!item || !item.type) return false;
        
        // Проверяем, есть ли такой слот экипировки
        if (this.equipment.hasOwnProperty(item.type)) {
            // Снимаем текущий предмет, если есть
            const previousItem = this.equipment[item.type];
            if (previousItem) {
                this.addToInventory(previousItem);
            }
            
            // Надеваем новый предмет
            this.equipment[item.type] = item;
            
            // Обновляем UI
            this.updateInventoryUI();
            return true;
        }
        
        return false;
    }
    
    /**
     * Снятие предмета
     * @param {string} slot - тип слота (weapon, helmet и т.д.)
     * @returns {Item|null} - снятый предмет
     */
    unequipItem(slot) {
        if (this.equipment[slot]) {
            const item = this.equipment[slot];
            this.equipment[slot] = null;
            return item;
        }
        return null;
    }
    
    /**
     * Добавление предмета в инвентарь
     * @param {Item} item - предмет для добавления
     * @returns {boolean} - успешно ли добавлен предмет
     */
    addToInventory(item) {
        // Ищем свободный слот
        const emptySlotIndex = this.inventory.findIndex(slot => slot === null);
        
        if (emptySlotIndex !== -1) {
            this.inventory[emptySlotIndex] = item;
            this.updateInventoryUI();
            return true;
        }
        
        return false; // Нет места в инвентаре
    }
    
    /**
     * Удаление предмета из инвентаря
     * @param {number} index - индекс слота
     * @returns {Item|null} - удалённый предмет
     */
    removeFromInventory(index) {
        if (index >= 0 && index < this.inventory.length) {
            const item = this.inventory[index];
            this.inventory[index] = null;
            this.updateInventoryUI();
            return item;
        }
        return null;
    }
    
    /**
     * Обновление UI инвентаря
     */
    updateInventoryUI() {
        // В новой системе инвентарь обновляется в отдельном окне
        if (window.game && window.game.uiInventory) {
            window.game.uiInventory.onInventoryUpdate();
        }
    }

    /**
     * Повышение уровня навыка
     * @param {string} skillName - название навыка
     * @returns {boolean} - успешно ли прокачан навык
     */
    upgradeSkill(skillName) {
        const skill = this.skills[skillName];

        if (!skill) {
            console.error(`Навык ${skillName} не найден`);
            return false;
        }

        if (skill.level >= skill.maxLevel) {
            console.log(`Навык ${skill.name} уже достиг максимального уровня`);
            return false;
        }

        if (this.skillPoints < skill.cost) {
            console.log(`Недостаточно очков навыков для прокачки ${skill.name}`);
            return false;
        }

        // Повышаем уровень навыка
        skill.level++;
        this.skillPoints -= skill.cost;

        console.log(`Навык ${skill.name} прокачан до уровня ${skill.level}`);

        // Обновляем UI, если есть доступ к игре
        if (window.game && window.game.uiStatsWindow) {
            window.game.uiStatsWindow.onStatsUpdate();
        }

        // Обновляем отображение в дереве навыков, если оно открыто
        if (window.game && window.game.uiSkillTree) {
            window.game.uiSkillTree.onCharacterUpdate();
        }
        
        return true;
    }
    
    /**
     * Получение информации о навыке
     * @param {string} skillName - название навыка
     * @returns {Object} - информация о навыке
     */
    getSkillInfo(skillName) {
        const skill = this.skills[skillName];
        if (!skill) return null;
        
        return {
            name: skill.name,
            level: skill.level,
            maxLevel: skill.maxLevel,
            cost: skill.cost,
            description: skill.description,
            manaCost: this.getSkillManaCost(skillName)
        };
    }
    
    /**
     * Получение списка всех изученных навыков
     * @returns {Array} - список изученных навыков
     */
    getLearnedSkills() {
        const learnedSkills = [];
        for (const skillName in this.skills) {
            const skill = this.skills[skillName];
            if (skill.level > 0) {
                learnedSkills.push({
                    name: skill.name,
                    level: skill.level,
                    skillName: skillName
                });
            }
        }
        return learnedSkills;
    }
    
    /**
     * Получение бонуса от навыка
     * @param {string} skillName - название навыка
     * @returns {number} - значение бонуса
     */
    getSkillBonus(skillName) {
        const skill = this.skills[skillName];

        if (!skill || skill.level === 0) {
            return 0;
        }

        // Расчет бонуса в зависимости от типа навыка
        switch(skillName) {
            case 'melee_mastery':
                // +10% физического урона за уровень
                return this.getTotalStat('physicalDamage') * GAME_CONFIG.CHARACTER.MELEE_MASTERY_BONUS * skill.level;

            case 'critical_strike':
                // +3% шанса крита за уровень
                return skill.level * GAME_CONFIG.CHARACTER.CRITICAL_STRIKE_BONUS;

            case 'life_leech':
                // 2% похищения жизни за уровень
                return skill.level * GAME_CONFIG.CHARACTER.LIFE_LEECH_BONUS;

            case 'magic_mastery':
                // +10% магического урона за уровень
                return this.getTotalStat('magicDamage') * GAME_CONFIG.CHARACTER.MAGIC_MASTERY_BONUS * skill.level;

            case 'mana_efficiency':
                // 5% снижение стоимости маны за уровень
                return skill.level * GAME_CONFIG.CHARACTER.MANA_EFFICIENCY_BONUS;

            case 'fireball':
                // +10 магического урона за уровень
                return GAME_CONFIG.CHARACTER.FIREBALL_DAMAGE_BONUS * skill.level;

            case 'heal':
                // +5% лечения за уровень
                return this.maxHealth * GAME_CONFIG.CHARACTER.HEAL_PERCENT_BONUS * skill.level;

            default:
                return skill.level;
        }
    }
    
    /**
     * Получение общего бонуса от всех навыков для определенной характеристики
     * @param {string} statName - название характеристики
     * @returns {number} - общий бонус от навыков
     */
    getSkillsBonusForStat(statName) {
        let totalBonus = 0;

        for (const skillName in this.skills) {
            const skill = this.skills[skillName];
            if (skill.level > 0) {
                switch(statName) {
                    case 'physicalDamage':
                        if (skillName === 'melee_mastery') {
                            const baseDamage = this.strength * GAME_CONFIG.CHARACTER.STRENGTH_PHYSICAL_DAMAGE_MULTIPLIER;
                            totalBonus += baseDamage * GAME_CONFIG.CHARACTER.MELEE_MASTERY_BONUS * skill.level;
                        }
                        break;

                    case 'magicDamage':
                        if (skillName === 'magic_mastery') {
                            const baseMagicDamage = this.intelligence * GAME_CONFIG.CHARACTER.INTELLIGENCE_MAGIC_DAMAGE_MULTIPLIER;
                            totalBonus += baseMagicDamage * GAME_CONFIG.CHARACTER.MAGIC_MASTERY_BONUS * skill.level;
                        }
                        break;

                    case 'criticalChance':
                        if (skillName === 'critical_strike') {
                            totalBonus += skill.level * GAME_CONFIG.CHARACTER.CRITICAL_STRIKE_BONUS;
                        }
                        break;
                }
            }
        }

        return totalBonus;
    }
    
    /**
     * Применение навыка
     * @param {string} skillName - название навыка
     * @param {Character|Enemy} [target] - цель (если требуется)
     * @param {Object} [options] - дополнительные опции
     * @returns {number} - результат применения навыка
     */
    useSkill(skillName, target, options = {}) {
        const skill = this.skills[skillName];

        if (!skill || skill.level === 0) {
            console.error(`Навык ${skillName} не изучен`);
            return 0;
        }

        // Определяем стоимость маны для навыка (с учетом эффективности маны)
        let manaCost = this.getSkillManaCost(skillName);
        const manaEfficiencyBonus = this.getSkillBonus('mana_efficiency');
        manaCost = manaCost * (1 - manaEfficiencyBonus);
        manaCost = Math.max(1, Math.floor(manaCost));

        // Проверяем, достаточно ли маны
        if (!this.consumeMana(manaCost)) {
            console.log(`Недостаточно маны для использования навыка ${skill.name}`);
            return 0;
        }

        switch(skillName) {
            case 'fireball':
                if (!target) return 0;

                // Огненный шар: магический урон от интеллекта + бонус навыка
                const baseMagicDamage = this.getTotalStat('magicDamage');
                const magicMasteryBonus = this.getSkillBonus('magic_mastery');
                const fireDamage = baseMagicDamage + magicMasteryBonus + this.getSkillBonus(skillName);
                const actualDamage = target.takeDamage(fireDamage, false, 'magic');

                console.log(`Использован Огненный шар, нанесено магического урона: ${actualDamage}`);
                return actualDamage;

            case 'heal':
                // Лечение: процент от макс. здоровья + бонус от навыка
                const healPercent = 0.2 + this.getSkillBonus('heal') / this.maxHealth;
                const healAmount = this.maxHealth * healPercent;
                this.heal(healAmount);

                console.log(`Использовано Лечение, восстановлено здоровья: ${healAmount.toFixed(1)}`);
                return healAmount;

            default:
                console.log(`Навык ${skillName} не может быть использован напрямую`);
                return 0;
        }
    }
    
    /**
     * Обновление характеристик при изменении навыков
     */
    updateStatsFromSkills() {
        // Этот метод может быть вызван после изменения навыков
        // для пересчета всех зависимых характеристик
    }
    
    /**
     * Получение стоимости маны для навыка
     * @param {string} skillName - название навыка
     * @returns {number} - стоимость маны
     */
    getSkillManaCost(skillName) {
        const skill = this.skills[skillName];
        
        if (!skill) return 0;
        
        // Базовая стоимость в зависимости от типа навыка
        switch(skillName) {
            case 'fireball':
                return GAME_CONFIG.CHARACTER.SKILL_MANA_COST.fireball.base + (skill.level * GAME_CONFIG.CHARACTER.SKILL_MANA_COST.fireball.per_level); // 10 + 2 за уровень
            case 'heal':
                return GAME_CONFIG.CHARACTER.SKILL_MANA_COST.heal.base + (skill.level * GAME_CONFIG.CHARACTER.SKILL_MANA_COST.heal.per_level); // 8 + 1.5 за уровень
            default:
                return GAME_CONFIG.CHARACTER.SKILL_MANA_COST.default.base + skill.level; // 5 + 1 за уровень
        }
    }
    
    /**
     * Проверка коллизии с другим объектом
     * @param {Object} other - другой объект с x, y и hitboxRadius
     * @returns {boolean} - произошла ли коллизия
     */
    checkCollisionWith(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Коллизия происходит, если расстояние меньше суммы радиусов
        return distance < (this.hitboxRadius + other.hitboxRadius);
    }
    
    /**
     * Восстановление маны
     * @param {number} amount - количество восстанавливаемой маны
     */
    restoreMana(amount) {
        this.mana = Math.min(this.maxMana, this.mana + amount);
    }
    
    /**
     * Потребление маны
     * @param {number} amount - количество потребляемой маны
     * @returns {boolean} - успешно ли потрачена мана
     */
    consumeMana(amount) {
        if (this.mana >= amount) {
            this.mana -= amount;
            return true;
        }
        return false; // Недостаточно маны
    }
    
    /**
     * Получение общего значения восстановления маны в секунду
     * @returns {number} - значение восстановления маны
     */
    getManaRegenRate() {
        // Базовое восстановление + бонусы от энергии и интеллекта
        return this.getTotalStat('manaRegen');
    }

    /**
     * Восстановление маны с течением времени
     * @param {number} deltaTime - время с последнего обновления в мс
     */
    regenerateMana(deltaTime = 16.67) {
        // Восстанавливаем ману по чуть-чуть каждый кадр
        // BASE_MANA_REGEN теперь в мана в секунду, конвертируем в мана за deltaTime
        if (this.mana < this.maxMana) {
            const regenAmount = this.getManaRegenRate() * (deltaTime / 1000);
            this.restoreMana(regenAmount);
        }
    }
}
