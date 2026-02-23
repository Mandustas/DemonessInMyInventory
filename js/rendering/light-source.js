/**
 * Класс источника света
 * Представляет отдельный источник света в игровом мире
 */
class LightSource {
    /**
     * Конструктор источника света
     * @param {Object} config - конфигурация источника
     */
    constructor(config) {
        this.id = config.id || `light_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.radius = config.radius || 10;
        this.color = config.color || { R: 1.0, G: 0.85, B: 0.6 };
        this.intensity = config.intensity || 1.0;
        this.type = config.type || 'static'; // static, dynamic, player, projectile
        
        // Настройки мерцания (для факелов) - только визуальный эффект
        this.flicker = config.flicker || false;
        this.flickerSpeed = config.flickerSpeed || 5;
        this.flickerAmount = config.flickerAmount || 0.1;
        this.flickerPhase = Math.random() * Math.PI * 2;
        this.flickerOffset = 0;
        this.lastFlickerUpdate = 0;
        this.flickerUpdateInterval = 100; // Обновлять мерцание каждые 100мс для оптимизации
        
        // Время жизни (для временных источников, например, файрбол)
        this.lifetime = config.lifetime || -1; // -1 = бесконечно
        this.age = 0;
        
        // Активность источника
        this.active = true;
        
        // Высота источника света (для 3D эффекта)
        this.height = config.height || 64;
    }
    
    /**
     * Обновление состояния источника света
     * @param {number} deltaTime - время с последнего обновления в мс
     */
    update(deltaTime) {
        // Обновляем время жизни
        if (this.lifetime > 0) {
            this.age += deltaTime;
            if (this.age >= this.lifetime) {
                this.active = false;
                return;
            }
        }
        
        // Обновляем мерцание
        if (this.flicker) {
            this.flickerPhase += (deltaTime / 1000) * this.flickerSpeed;
            this.flickerOffset = Math.sin(this.flickerPhase) * this.flickerAmount;
            
            // Добавляем случайный шум для более естественного мерцания
            this.flickerOffset += (Math.random() - 0.5) * this.flickerAmount * 0.5;
        }
    }
    
    /**
     * Установка позиции источника
     * @param {number} x - X координата
     * @param {number} y - Y координата
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    /**
     * Получение эффективного радиуса с учётом мерцания
     * @returns {number} - эффективный радиус
     */
    getEffectiveRadius() {
        if (this.flicker) {
            return this.radius * (1 + this.flickerOffset);
        }
        return this.radius;
    }
    
    /**
     * Получение эффективной интенсивности с учётом мерцания и времени жизни
     * @returns {number} - эффективная интенсивность (0-1)
     */
    getEffectiveIntensity() {
        let intensity = this.intensity;
        
        // Применяем мерцание
        if (this.flicker) {
            intensity *= (1 + this.flickerOffset * 0.5);
        }
        
        // Затухание для временных источников
        if (this.lifetime > 0) {
            const lifeRatio = this.age / this.lifetime;
            if (lifeRatio > 0.8) {
                // Последние 20% времени жизни - затухание
                intensity *= 1 - ((lifeRatio - 0.8) / 0.2);
            }
        }
        
        return Math.max(0, Math.min(1, intensity));
    }
    
    /**
     * Получение эффективного цвета
     * @returns {Object} - цвет {R, G, B}
     */
    getEffectiveColor() {
        const intensity = this.getEffectiveIntensity();
        return {
            R: this.color.R * intensity,
            G: this.color.G * intensity,
            B: this.color.B * intensity
        };
    }
    
    /**
     * Проверка, находится ли точка в радиусе освещения
     * @param {number} worldX - X координата точки
     * @param {number} worldY - Y координата точки
     * @returns {boolean} - находится ли точка в радиусе
     */
    isInRange(worldX, worldY) {
        const dx = worldX - this.x;
        const dy = worldY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const tileSize = GAME_CONFIG.TILE.BASE_SIZE;
        return distance <= this.getEffectiveRadius() * tileSize;
    }
    
    /**
     * Вычисление интенсивности света в точке
     * @param {number} worldX - X координата точки
     * @param {number} worldY - Y координата точки
     * @returns {number} - интенсивность от 0 до 1
     */
    getIntensityAt(worldX, worldY) {
        const tileSize = GAME_CONFIG.TILE.BASE_SIZE;
        const dx = worldX - this.x;
        const dy = worldY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy) / tileSize;
        const radius = this.getEffectiveRadius();
        
        if (distance > radius) {
            return 0;
        }
        
        // Интенсивность с falloff
        const normalizedDistance = distance / radius;
        const falloff = GAME_CONFIG.LIGHTING.FALLOFF || 1.5;
        const distanceIntensity = Math.pow(1 - normalizedDistance, falloff);
        
        return distanceIntensity * this.getEffectiveIntensity();
    }
    
    /**
     * Вычисление направления от точки к источнику света
     * @param {number} worldX - X координата точки
     * @param {number} worldY - Y координата точки
     * @returns {Object} - нормализованный вектор направления
     */
    getLightDirection(worldX, worldY) {
        const dx = this.x - worldX;
        const dy = this.y - worldY;
        const dz = this.height; // Высота источника света
        
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (length === 0) return { x: 0, y: 0, z: 1 };
        
        return {
            x: dx / length,
            y: dy / length,
            z: dz / length
        };
    }
    
    /**
     * Сериализация источника света
     * @returns {Object} - данные для сохранения
     */
    serialize() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            radius: this.radius,
            color: this.color,
            intensity: this.intensity,
            type: this.type,
            flicker: this.flicker,
            flickerSpeed: this.flickerSpeed,
            flickerAmount: this.flickerAmount,
            lifetime: this.lifetime
        };
    }
    
    /**
     * Десериализация источника света
     * @param {Object} data - данные для восстановления
     * @returns {LightSource} - восстановленный источник
     */
    static deserialize(data) {
        return new LightSource(data);
    }
}