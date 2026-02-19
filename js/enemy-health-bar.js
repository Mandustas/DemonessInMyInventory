/**
 * Система полосок здоровья для врагов
 * Отображает изящные dark fantasy полоски над врагами при получении урона
 */
class EnemyHealthBarSystem {
    constructor(renderer) {
        this.renderer = renderer;
        this.healthBars = new Map(); // Map<enemy, HealthBar>
        this.fadeDuration = 300; // мс для fade in/out
        this.hideDelay = 2500; // мс перед скрытием после последнего урона
    }

    /**
     * Обновление или создание полоски здоровья для врага
     * @param {Enemy} enemy - враг
     * @param {number} health - текущее здоровье
     * @param {number} maxHealth - максимальное здоровье
     * @param {boolean} justHit - только что получил урон
     */
    update(enemy, health, maxHealth, justHit = false) {
        let healthBar = this.healthBars.get(enemy);

        if (!healthBar) {
            // Создаём новую полоску
            healthBar = this.createHealthBar(enemy);
            this.healthBars.set(enemy, healthBar);
        }

        // Обновляем данные
        healthBar.health = health;
        healthBar.maxHealth = maxHealth;
        healthBar.justHit = justHit;
        healthBar.lastHitTime = Date.now();
        healthBar.visible = true;
        healthBar.dying = false;

        // Временно отключаем fade in для диагностики - делаем полоску сразу видимой
        healthBar.fadeIn = false;
        healthBar.fadeOut = false;
        healthBar.alpha = 1; // Сразу полная видимость
        healthBar.container.visible = true;
        healthBar.container.alpha = 1;
        
        // Обновляем позицию и графику сразу при вызове update()
        healthBar.container.x = enemy.x;
        healthBar.container.y = enemy.y - 40;
        const fillPercent = healthBar.health / healthBar.maxHealth;
        this.updateHealthGraphics(healthBar, fillPercent);
        
    }

    /**
     * Создание визуальной полоски здоровья
     * @param {Enemy} enemy - враг
     * @returns {Object} - объект полоски здоровья
     */
    createHealthBar(enemy) {
        // Создаём контейнер для полоски здоровья
        const container = new PIXI.Container();
        
        // Параметры полоски
        const barWidth = 44;
        const barHeight = 6;
        const borderThickness = 2;
        const borderRadius = 3;

        // Тёмная рамка с золотым оттенком (dark fantasy стиль)
        const borderGraphics = new PIXI.Graphics();
        borderGraphics.lineStyle(borderThickness, 0x3d2817, 1); // Тёмно-коричневая обводка
        borderGraphics.drawRoundedRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, borderRadius);
        
        // Золотая/бронзовая окантовка (декоративная)
        const accentGraphics = new PIXI.Graphics();
        accentGraphics.lineStyle(1, 0xc9a961, 0.8); // Приглушённое золото
        accentGraphics.drawRoundedRect(-barWidth / 2 + 1, -barHeight / 2 + 1, barWidth - 2, barHeight - 2, borderRadius - 1);
        
        // Фон для здоровья (тёмный)
        const bgGraphics = new PIXI.Graphics();
        bgGraphics.beginFill(0x1a0a0a); // Очень тёмный, почти чёрный
        bgGraphics.drawRoundedRect(-barWidth / 2 + 2, -barHeight / 2 + 2, barWidth - 4, barHeight - 4, borderRadius - 2);
        bgGraphics.endFill();

        // Полоска здоровья
        const healthGraphics = new PIXI.Graphics();
        this.drawHealthBar(healthGraphics, barWidth - 4, barHeight - 4, 1); // 100% заполнение
        
        // Позиционируем всё относительно центра
        container.addChild(borderGraphics);
        container.addChild(bgGraphics);
        container.addChild(healthGraphics);
        container.addChild(accentGraphics);

        // Начальная позиция - над врагом
        container.x = enemy.x;
        container.y = enemy.y - 40; // Над головой врага
        container.alpha = 0; // Начинаем с невидимого для fade in
        container.visible = true; // Делаем видимым сразу

        // Добавляем в UI слой
        this.renderer.healthBarLayer.addChild(container);

        return {
            container: container,
            healthGraphics: healthGraphics,
            health: enemy.health,
            maxHealth: enemy.maxHealth,
            alpha: 0,
            visible: true, // Сразу видимый
            fadeIn: true, // Запускаем fade in
            fadeOut: false,
            dying: false,
            justHit: false,
            lastHitTime: Date.now(),
            barWidth: barWidth,
            barHeight: barHeight
        };
    }

    /**
     * Получение цвета полоски здоровья на основе процента здоровья
     * @param {number} fillPercent - процент заполнения (0-1)
     * @returns {number} - цвет в формате HEX
     */
    getHealthColor(fillPercent) {
        if (fillPercent > 0.6) {
            // Зелёный при высоком здоровье
            return 0x00ff00;
        } else if (fillPercent > 0.3) {
            // Жёлтый при среднем здоровье
            return 0xffff00;
        } else {
            // Красный при низком здоровье
            return 0xff0000;
        }
    }

    /**
     * Рисование полоски здоровья
     * @param {PIXI.Graphics} graphics - PIXI графика
     * @param {number} width - ширина внутренней области
     * @param {number} height - высота внутренней области
     * @param {number} fillPercent - процент заполнения (0-1)
     */
    drawHealthBar(graphics, width, height, fillPercent) {
        const filledWidth = Math.max(0, width * fillPercent);
        
        if (filledWidth <= 0) {
            return;
        }

        // Получаем цвет на основе процента здоровья
        const healthColor = this.getHealthColor(fillPercent);
        
        // Рисуем заполненную часть полоски
        graphics.beginFill(healthColor, 1.0);
        graphics.drawRoundedRect(-width / 2, -height / 2, filledWidth, height, 2);
        graphics.endFill();
    }

    /**
     * Обновление всех полосок здоровья (вызывается каждый кадр)
     * @param {number} deltaTime - время с последнего кадра в мс
     */
    updateAll(deltaTime = 16.67) {
        const now = Date.now();

        for (const [enemy, healthBar] of this.healthBars.entries()) {
            // Если враг мёртв - удаляем полоску
            if (!enemy.isAlive()) {
                this.remove(enemy);
                continue;
            }
            
            // Также проверяем если здоровье <= 0
            if (healthBar.health <= 0) {
                this.remove(enemy);
                continue;
            }в

            // Проверяем, нужно ли скрыть полоску (прошло ли время после последнего урона)
            if (healthBar.visible && !healthBar.dying && !healthBar.fadeIn) {
                if (now - healthBar.lastHitTime > this.hideDelay) {
                    healthBar.fadeOut = true;
                    healthBar.dying = true;
                }
            }

            // Обработка fade in
            if (healthBar.fadeIn) {
                healthBar.alpha += deltaTime / this.fadeDuration;
                if (healthBar.alpha >= 1) {
                    healthBar.alpha = 1;
                    healthBar.fadeIn = false; // Завершаем fade in
                }
                healthBar.container.alpha = healthBar.alpha;
                healthBar.container.visible = true;
            }
            // Обработка fade out
            else if (healthBar.fadeOut) {
                healthBar.alpha -= deltaTime / this.fadeDuration;
                if (healthBar.alpha <= 0) {
                    healthBar.alpha = 0;
                    healthBar.fadeOut = false;
                    healthBar.visible = false;
                    healthBar.container.visible = false;
                }
                healthBar.container.alpha = healthBar.alpha;
            } else {
                // Полоска полностью видима - просто обновляем позицию
                healthBar.container.alpha = 1;
                healthBar.container.visible = true;
            }

            // Обновляем позицию (следим за врагом) - всегда обновляем если контейнер существует
            if (healthBar.container) {
                healthBar.container.x = enemy.x;
                healthBar.container.y = enemy.y - 40;

                // Обновляем визуальное заполнение полоски
                const fillPercent = healthBar.health / healthBar.maxHealth;
                this.updateHealthGraphics(healthBar, fillPercent);
            }
        }
    }

    /**
     * Обновление графики полоски здоровья
     * @param {Object} healthBar - объект полоски
     * @param {number} fillPercent - процент заполнения
     */
    updateHealthGraphics(healthBar, fillPercent) {
        const { healthGraphics, barWidth, barHeight } = healthBar;
        
        // Очищаем старую графику
        healthGraphics.clear();
        
        // Рисуем новую полоску (используем внутренние размеры: barWidth - 4, barHeight - 4)
        this.drawHealthBar(healthGraphics, barWidth - 4, barHeight - 4, fillPercent);
    }

    /**
     * Удаление полоски здоровья для врага
     * @param {Enemy} enemy - враг
     */
    remove(enemy) {
        const healthBar = this.healthBars.get(enemy);
        if (healthBar) {
            // Удаляем из слоя
            if (healthBar.container.parent) {
                healthBar.container.parent.removeChild(healthBar.container);
            }
            
            // Удаляем из мапы
            this.healthBars.delete(enemy);
        }
    }

    /**
     * Полная очистка всех полосок
     */
    clear() {
        for (const [enemy, healthBar] of this.healthBars.entries()) {
            if (healthBar.container.parent) {
                healthBar.container.parent.removeChild(healthBar.container);
            }
        }
        this.healthBars.clear();
    }
}

// Экспортируем класс для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnemyHealthBarSystem;
} else if (typeof window !== 'undefined') {
    window.EnemyHealthBarSystem = EnemyHealthBarSystem;
}
