class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 30;
        this.height = 30;

        // Генерируем характеристики по типу врага
        const typeStats = this.getTypeStats(type);
        
        // Основные характеристики
        this.strength = typeStats.strength || 10;
        this.dexterity = typeStats.dexterity || 10;
        this.vitality = typeStats.vitality || 10;
        this.energy = typeStats.energy || 10;
        this.intelligence = typeStats.intelligence || 10;
        
        // Боевые параметры
        this.speed = typeStats.speed || 60;
        this.detectionRange = typeStats.detectionRange || 100;
        this.attackRange = typeStats.attackRange || 30;
        this.attackType = typeStats.attackType || 'physical';
        this.experienceValue = typeStats.experienceValue || 20;
        
        // Производные характеристики
        this.maxHealth = this.getTotalStat('maxHealth');
        this.health = this.maxHealth;
        this.maxMana = this.getTotalStat('maxMana');
        this.mana = this.maxMana;
        
        this.attackCooldown = 0;
        this.maxAttackCooldown = GAME_CONFIG.ENEMY.ATTACK_COOLDOWN;

        // Хитбокс
        this.hitboxRadius = GAME_CONFIG.ENEMY.HITBOX_RADIUS;

        // Состояние врага
        this.state = 'idle';
        this.target = null;

        // Параметры блуждания
        this.wanderTarget = null;
        this.wanderTimer = 0;
        this.wanderInterval = GAME_CONFIG.ENEMY.WANDER_INTERVAL_MIN + Math.random() * (GAME_CONFIG.ENEMY.WANDER_INTERVAL_MAX - GAME_CONFIG.ENEMY.WANDER_INTERVAL_MIN);
        this.idleAnimTimer = 0;
        this.lastX = x;
        this.lastY = y;
    }

    /**
     * Получение характеристик типа врага
     */
    getTypeStats(type) {
        const typeKey = type.toUpperCase();
        if (GAME_CONFIG.ENEMY.TYPES[typeKey]) {
            return GAME_CONFIG.ENEMY.TYPES[typeKey];
        }
        return GAME_CONFIG.ENEMY.TYPES.BASIC;
    }
    
    /**
     * Обновление состояния врага
     * @param {Character} player - игрок
     * @param {Array<Array<number>>} map - карта (может быть null для бесконечной генерации)
     * @param {ChunkSystem} chunkSystem - система чанков (опционально)
     * @param {number} deltaTime - время с последнего обновления в мс
     */
    update(player, map, chunkSystem = null, deltaTime = 16.67) {
        // Уменьшаем кулдаун атаки (теперь в миллисекундах)
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // Обновляем таймер анимации
        this.idleAnimTimer++;

        // Запоминаем последнюю позицию
        this.lastX = this.x;
        this.lastY = this.y;

        // Проверяем расстояние до игрока
        const distanceToPlayer = Math.sqrt(
            Math.pow(this.x - player.x, 2) +
            Math.pow(this.y - player.y, 2)
        );

        if (distanceToPlayer <= this.detectionRange) {
            // Игрок в зоне обнаружения - переходим в режим преследования
            this.state = 'chasing';
            this.target = player;
            this.wanderTimer = 0; // Сбрасываем таймер блуждания
            this.wanderTarget = null;

            // Двигаемся к игроку
            this.moveToTarget(player, map, chunkSystem, deltaTime);

            // Если в пределах атаки и кулдаун прошел
            if (distanceToPlayer <= this.attackRange && this.attackCooldown <= 0) {
                this.state = 'attacking';
                this.attack(player);
            }
        } else {
            // Игрок вне зоны обнаружения - имитируем жизнедеятельность
            this.target = null;
            this.performIdleBehavior(map, chunkSystem, deltaTime);
        }
    }
    
    /**
     * Имитация жизнедеятельности (блуждание)
     * @param {Array<Array<number>>} map - карта
     * @param {ChunkSystem} chunkSystem - система чанков
     * @param {number} deltaTime - время с последнего обновления в мс
     */
    performIdleBehavior(map, chunkSystem, deltaTime = 16.67) {
        this.wanderTimer += deltaTime;

        // Каждые 2-5 секунд выбираем новую цель для блуждания
        if (this.wanderTimer >= this.wanderInterval || !this.wanderTarget) {
            // Выбираем случайную точку для блуждания
            const wanderDistance = GAME_CONFIG.ENEMY.WANDER_DISTANCE_MIN + Math.random() * (GAME_CONFIG.ENEMY.WANDER_DISTANCE_MAX - GAME_CONFIG.ENEMY.WANDER_DISTANCE_MIN); // 30-100 пикселей
            const wanderAngle = Math.random() * Math.PI * 2;

            this.wanderTarget = {
                x: this.x + Math.cos(wanderAngle) * wanderDistance,
                y: this.y + Math.sin(wanderAngle) * wanderDistance
            };

            // Сбрасываем таймер и интервал
            this.wanderTimer = 0;
            this.wanderInterval = GAME_CONFIG.ENEMY.WANDER_INTERVAL_MIN + Math.random() * (GAME_CONFIG.ENEMY.WANDER_INTERVAL_MAX - GAME_CONFIG.ENEMY.WANDER_INTERVAL_MIN); // 2-5 секунд
        }

        // Если есть цель для блуждания, двигаемся к ней
        if (this.wanderTarget) {
            this.state = 'wandering';

            const dx = this.wanderTarget.x - this.x;
            const dy = this.wanderTarget.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Если достигли цели или близко к ней
            if (distance < 10) {
                this.wanderTarget = null;
                this.wanderTimer = 0;
            } else {
                // Двигаемся к цели блуждания (медленнее, чем к игроку)
                // speed теперь в пикселях в секунду, конвертируем в пиксели за deltaTime
                const wanderSpeed = (this.speed * GAME_CONFIG.ENEMY.WANDER_SPEED_MULTIPLIER) * (deltaTime / 1000);
                const moveX = (dx / distance) * wanderSpeed;
                const moveY = (dy / distance) * wanderSpeed;

                const newX = this.x + moveX;
                const newY = this.y + moveY;

                // Проверяем проходимость
                let tilePos;
                if (typeof getTileIndex !== 'undefined') {
                    tilePos = getTileIndex(newX, newY);
                } else {
                    tilePos = { tileX: Math.floor(newX / 64), tileY: Math.floor(newY / 32) };
                }

                let canMove = false;
                if (map) {
                    canMove = this.isPassable(tilePos.tileX, tilePos.tileY, map);
                } else if (chunkSystem) {
                    canMove = chunkSystem.isPassable(tilePos.tileX, tilePos.tileY);
                }

                if (canMove) {
                    this.x = newX;
                    this.y = newY;
                } else {
                    // Если не можем пройти, выбираем новую цель
                    this.wanderTarget = null;
                    this.wanderTimer = 0;
                }
            }
        } else {
            // Просто стоим и "дышим" (состояние idle)
            this.state = 'idle';
        }
    }
    
    /**
     * Движение к цели
     * @param {Character} target - цель для движения
     * @param {Array<Array<number>>} map - карта для проверки столкновений
     * @param {ChunkSystem} chunkSystem - система чанков (опционально)
     * @param {number} deltaTime - время с последнего обновления в мс
     */
    moveToTarget(target, map, chunkSystem = null, deltaTime = 16.67) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // speed теперь в пикселях в секунду, конвертируем в пиксели за deltaTime
            const moveSpeed = this.speed * (deltaTime / 1000);
            const moveX = (dx / distance) * moveSpeed;
            const moveY = (dy / distance) * moveSpeed;

            // Проверяем столкновения с препятствиями (упрощенная проверка)
            const newX = this.x + moveX;
            const newY = this.y + moveY;

            // Преобразуем координаты в координаты тайлов
            let tilePos;
            if (typeof getTileIndex !== 'undefined') {
                tilePos = getTileIndex(newX, newY);
            } else {
                // Резервный вариант, если функция недоступна
                tilePos = { tileX: Math.floor(newX / 64), tileY: Math.floor(newY / 32) };
            }

            // Проверяем, является ли тайл проходимым
            if (map) {
                // Используем старую логику с картой
                if (this.isPassable(tilePos.tileX, tilePos.tileY, map)) {
                    // Проверяем коллизию с целью перед движением
                    const tempPos = {
                        x: newX,
                        y: newY,
                        hitboxRadius: this.hitboxRadius,
                        checkCollisionWith: function(other) {
                            const dx = this.x - other.x;
                            const dy = this.y - other.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            // Коллизия происходит, если расстояние меньше суммы радиусов
                            return distance < (this.hitboxRadius + other.hitboxRadius);
                        }
                    };
                    if (!tempPos.checkCollisionWith(target)) {
                        this.x = newX;
                        this.y = newY;
                    }
                }
            } else if (chunkSystem) {
                // Используем систему чанков для проверки проходимости
                if (chunkSystem.isPassable(tilePos.tileX, tilePos.tileY)) {
                    // Проверяем коллизию с целью перед движением
                    const tempPos = {
                        x: newX,
                        y: newY,
                        hitboxRadius: this.hitboxRadius,
                        checkCollisionWith: function(other) {
                            const dx = this.x - other.x;
                            const dy = this.y - other.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            // Коллизия происходит, если расстояние меньше суммы радиусов
                            return distance < (this.hitboxRadius + other.hitboxRadius);
                        }
                    };
                    if (!tempPos.checkCollisionWith(target)) {
                        this.x = newX;
                        this.y = newY;
                    }
                }
            }
        }
    }
    
    /**
     * Проверка, можно ли пройти через тайл
     * @param {number} tileX - координата X тайла
     * @param {number} tileY - координата Y тайла
     * @param {Array<Array<number>>} map - карта
     * @returns {boolean} - проходимый ли тайл
     */
    isPassable(tileX, tileY, map) {
        // Проверяем, находится ли тайл внутри границ карты
        if (tileX < 0 || tileX >= map[0].length || tileY < 0 || tileY >= map.length) {
            return false;
        }
        
        // Проверяем тип тайла - проходимые: 0 (пол), 6 (лед), 7 (декорация)
        // Непроходимые: 1 (стена), 2 (колонна), 3 (дерево), 4 (скала), 5 (вода)
        const tileType = map[tileY][tileX];
        return tileType === 0 || tileType === 6 || tileType === 7;
    }
    
    /**
     * Атака цели
     * @param {Character} target - цель для атаки
     */
    attack(target) {
        if (this.attackCooldown === 0) {
            // Вызываем эффект атаки
            if (typeof game !== 'undefined' && game.combatEffects) {
                game.combatEffects.triggerAttack(this.x, this.y, 'enemy');
            } else {
                console.warn('Боевая система эффектов не доступна при атаке врагом');
            }

            // Получаем урон в зависимости от типа атаки
            let baseDamage;
            if (this.attackType === 'magic') {
                baseDamage = this.getTotalStat('magicDamage');
            } else {
                baseDamage = this.getTotalStat('physicalDamage');
            }

            // Получаем шанс крита врага
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

            // Наносим урон цели
            const actualDamage = target.takeDamage(damage, isCritical, this.attackType);
            console.log(`Враг атаковал игрока, нанесено урона: ${actualDamage}`);

            // Сбрасываем кулдаун атаки
            this.attackCooldown = this.maxAttackCooldown;

            return actualDamage;
        }

        return 0;
    }
    
    /**
     * Получение урона
     * @param {number} damage - количество урона
     * @param {boolean} isCritical - является ли урон критическим
     * @param {string} damageType - тип урона ('physical' или 'magic')
     * @param {Object} attacker - атакующий
     * @returns {number} - фактический полученный урон
     */
    takeDamage(damage, isCritical = false, damageType = 'physical', attacker = null) {
        // Урон применяется напрямую (без брони)
        const actualDamage = Math.max(1, Math.floor(damage));
        this.health -= actualDamage;

        // Вызываем эффект получения урона
        if (typeof game !== 'undefined' && game.combatEffects) {
            game.combatEffects.triggerDamage(this.x, this.y, actualDamage, isCritical);
        } else {
            console.warn('Боевая система эффектов не доступна при получении урона врагом');
        }

        // Обновляем полоску здоровья
        if (typeof game !== 'undefined' && game.renderer && game.renderer.updateEnemyHealthBar) {
            game.renderer.updateEnemyHealthBar(this, true);
        }

        // Откидывание при критическом ударе
        if (isCritical && attacker) {
            this.knockback(attacker.x, attacker.y, 50);
        }

        if (this.health <= 0) {
            this.health = 0;
        }

        return actualDamage;
    }
    
    /**
     * Откидывание врага от источника
     * @param {number} sourceX - X координата источника откидывания
     * @param {number} sourceY - Y координата источника откидывания
     * @param {number} force - сила откидывания (расстояние)
     */
    knockback(sourceX, sourceY, force = 50) {
        // Вычисляем направление откидывания (от источника)
        const dx = this.x - sourceX;
        const dy = this.y - sourceY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return; // Не откидываем, если расстояние 0
        
        // Нормализуем вектор направления
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Вычисляем новую позицию
        const newX = this.x + nx * force;
        const newY = this.y + ny * force;
        
        // Проверяем проходимость новой позиции
        if (this.canMoveTo(newX, newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            // Пробуем откинуть на меньшее расстояние
            for (let reducedForce = force * 0.75; reducedForce > 5; reducedForce *= 0.75) {
                const reducedX = this.x + nx * reducedForce;
                const reducedY = this.y + ny * reducedForce;
                if (this.canMoveTo(reducedX, reducedY)) {
                    this.x = reducedX;
                    this.y = reducedY;
                    break;
                }
            }
        }
    }
    
    /**
     * Проверка возможности перемещения в указанную позицию
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @returns {boolean} - можно ли переместиться
     */
    canMoveTo(x, y) {
        // Преобразуем координаты в координаты тайлов
        let tilePos;
        if (typeof getTileIndex !== 'undefined') {
            tilePos = getTileIndex(x, y);
        } else {
            tilePos = { tileX: Math.floor(x / 64), tileY: Math.floor(y / 32) };
        }
        
        // Проверяем через chunkSystem если доступна
        if (typeof game !== 'undefined' && game.chunkSystem) {
            return game.chunkSystem.isPassable(tilePos.tileX, tilePos.tileY);
        }
        
        // Резервный вариант - считаем все тайлы проходимыми
        return true;
    }
    
    /**
     * Получение общего значения характеристики
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
                baseValue = this.strength * GAME_CONFIG.CHARACTER.STRENGTH_PHYSICAL_DAMAGE_MULTIPLIER;
                break;

            case 'magicDamage':
                baseValue = this.intelligence * GAME_CONFIG.CHARACTER.INTELLIGENCE_MAGIC_DAMAGE_MULTIPLIER;
                break;

            // === СКОРОСТЬ АТАКИ ===
            case 'attackSpeed':
                baseValue = GAME_CONFIG.CHARACTER.BASE_ATTACK_SPEED +
                           (this.dexterity * GAME_CONFIG.CHARACTER.DEXTERITY_ATTACK_SPEED_MULTIPLIER);
                break;

            // === ШАНС КРИТА ===
            case 'criticalChance':
                baseValue = this.dexterity * GAME_CONFIG.CHARACTER.DEXTERITY_CRITICAL_MULTIPLIER;
                break;

            // === ВОССТАНОВЛЕНИЕ МАНЫ ===
            case 'manaRegen':
                baseValue = GAME_CONFIG.CHARACTER.BASE_MANA_REGEN +
                           (this.energy * GAME_CONFIG.CHARACTER.ENERGY_MANA_REGEN_MULTIPLIER) +
                           (this.intelligence * GAME_CONFIG.CHARACTER.INTELLIGENCE_MANA_REGEN_MULTIPLIER);
                break;

            // === УСТАРЕВШИЕ (для совместимости) ===
            case 'damage':
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

        return Math.floor(baseValue * 10) / 10;
    }
    
    /**
     * Проверка, жив ли враг
     * @returns {boolean} - жив ли враг
     */
    isAlive() {
        return this.health > 0;
    }
    
    /**
     * Проверка коллизии с другим объектом
     * @param {Object} other - другой объект с x, y и hitboxRadius
     * @returns {boolean} - произошла ли коллизия
     */
    checkCollisionWith(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distSq = dx * dx + dy * dy;
        const combinedRadius = this.hitboxRadius + other.hitboxRadius;
        
        // Коллизия происходит, если квадрат расстояния меньше квадрата суммы радиусов
        return distSq < combinedRadius * combinedRadius;
    }
    
}