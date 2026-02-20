/**
 * UIComponent - базовый класс для всех UI компонентов
 * Предоставляет основную функциональность для позиционирования, видимости и жизненного цикла
 */
class UIComponent {
    constructor(config = {}) {
        // Конфигурация
        this.config = config;
        
        // Позиционирование
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 0;
        this.height = config.height || 0;
        this.anchor = config.anchor || { x: 0, y: 0 };
        
        // Состояние
        this.visible = config.visible !== false;
        this.alpha = 1;
        this.isOpen = false;
        this.enabled = config.enabled !== false;
        
        // PIXI контейнер для рендеринга
        this.container = null;
        this.graphics = null;
        this.children = [];
        
        // Родительский компонент
        this.parent = null;
        
        // Z-индекс
        this.zIndex = config.zIndex || 0;
        
        // События
        this.events = {};
        
        // Данные для обновления
        this.needsUpdate = true;
        this.needsLayout = true;
    }
    
    /**
     * Инициализация компонента
     * @param {UIRenderer} renderer - UI рендерер
     * @param {PIXI.Container} parentContainer - родительский PIXI контейнер
     */
    init(renderer, parentContainer) {
        this.renderer = renderer;
        this.uiRenderer = renderer; // Псевдоним для удобства

        // Создаем основной контейнер
        this.container = new PIXI.Container();
        this.container.zIndex = this.zIndex;
        this.container.visible = this.visible;
        this.container.alpha = this.alpha;

        // Создаем графику для фона/границ
        this.graphics = new PIXI.Graphics();
        this.container.addChild(this.graphics);

        // Добавляем в родительский контейнер
        if (parentContainer) {
            parentContainer.addChild(this.container);
        }

        // Вызываем хук для подклассов
        this.onInit();

        // Обновляем позицию и размер
        this.updatePosition();
        this.render();
    }
    
    /**
     * Хук для инициализации в подклассах
     */
    onInit() {}
    
    /**
     * Обновление позиции контейнера
     */
    updatePosition() {
        if (!this.container) return;

        // Для центрирования с anchor нужно сместить координаты
        // anchor: {x: 0.5, y: 0.5} означает, что позиция - это центр компонента
        if (this.anchor) {
            this.container.x = this.x - this.width * this.anchor.x;
            this.container.y = this.y - this.height * this.anchor.y;
        } else {
            this.container.x = this.x;
            this.container.y = this.y;
        }
        
        this.container.alpha = this.alpha;
        this.container.visible = this.visible;
    }
    
    /**
     * Отрисовка компонента
     */
    render() {
        if (!this.graphics || !this.visible) return;
        
        this.graphics.clear();
        
        // Рисуем фон
        this.renderBackground();
        
        // Рисуем границу
        this.renderBorder();
        
        // Рисуем содержимое (переопределяется в подклассах)
        this.renderContent();
        
        this.needsUpdate = false;
    }
    
    /**
     * Отрисовка фона
     */
    renderBackground() {
        const bg = this.config.background;
        if (bg && bg.color) {
            this.graphics.beginFill(this.hexToDecimal(bg.color));
            this.graphics.drawRect(0, 0, this.width, this.height);
            this.graphics.endFill();
        }
    }
    
    /**
     * Отрисовка границы
     */
    renderBorder() {
        const border = this.config.border;
        if (border && border.color && border.width > 0) {
            this.graphics.lineStyle(border.width, this.hexToDecimal(border.color));
            this.graphics.drawRect(0, 0, this.width, this.height);
        }
    }
    
    /**
     * Отрисовка содержимого (переопределяется в подклассах)
     */
    renderContent() {}
    
    /**
     * Обновление компонента (вызывается каждый кадр)
     * @param {number} deltaTime - время с последнего кадра в мс
     */
    update(deltaTime = 16.67) {
        if (!this.visible) return;
        
        // Обновляем дочерние элементы
        for (const child of this.children) {
            if (child.update) {
                child.update(deltaTime);
            }
        }
        
        // Перерисовываем если нужно
        if (this.needsUpdate) {
            this.render();
        }
        
        // Хук для подклассов
        this.onUpdate(deltaTime);
    }
    
    /**
     * Хук для обновления в подклассах
     * @param {number} deltaTime - время с последнего кадра
     */
    onUpdate(deltaTime) {}
    
    /**
     * Открытие компонента
     */
    open() {
        this.isOpen = true;
        this.visible = true;
        this.updatePosition();
        this.render(); // Перерисовываем при открытии
        this.onOpen();
        this.emit('open');
    }
    
    /**
     * Закрытие компонента
     */
    close() {
        this.isOpen = false;
        this.visible = false;
        this.updatePosition();
        this.onClose();
        this.emit('close');
    }
    
    /**
     * Переключение видимости
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    /**
     * Хук при открытии
     */
    onOpen() {}
    
    /**
     * Хук при закрытии
     */
    onClose() {}
    
    /**
     * Обработка ввода
     * @param {string} type - тип события ('mousedown', 'mousemove', 'mouseup', 'keydown', 'keyup')
     * @param {Object} data - данные события
     * @returns {boolean} - обработано ли событие
     */
    handleInput(type, data) {
        if (!this.visible || !this.enabled) return false;
        
        // Проверяем попадание в область компонента
        const hit = this.hitTest(data.x, data.y);
        
        if (hit) {
            // Обрабатываем событие в компоненте
            const handled = this.onInput(type, data);
            if (handled) return true;
        }
        
        // Передаем дочерним элементам
        for (const child of this.children) {
            if (child.handleInput) {
                const childData = { ...data, x: data.x - this.x, y: data.y - this.y };
                if (child.handleInput(type, childData)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Проверка попадания точки в компонент
     * @param {number} x - координата X
     * @param {number} y - координата Y
     * @returns {boolean}
     */
    hitTest(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
    
    /**
     * Обработка ввода в компоненте (переопределяется в подклассах)
     * @param {string} type - тип события
     * @param {Object} data - данные события
     * @returns {boolean}
     */
    onInput(type, data) {
        return false;
    }
    
    /**
     * Добавление дочернего компонента
     * @param {UIComponent} child - дочерний компонент
     */
    addChild(child) {
        child.parent = this;
        this.children.push(child);

        // Если дочерний элемент ещё не инициализирован, инициализируем его
        if (!child.container && this.renderer) {
            child.init(this.renderer, this.container);
        } else if (child.container && this.container) {
            // Если уже инициализирован, просто добавляем контейнер
            this.container.addChild(child.container);
        }

        this.needsLayout = true;
    }

    /**
     * Удаление дочернего компонента
     * @param {UIComponent} child - дочерний компонент
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
            
            if (this.container && child.container) {
                this.container.removeChild(child.container);
            }
        }
        
        this.needsLayout = true;
    }
    
    /**
     * Уничтожение компонента
     */
    destroy() {
        // Уничтожаем дочерние элементы
        for (const child of this.children) {
            child.destroy();
        }
        this.children = [];
        
        // Удаляем из родителя
        if (this.parent) {
            this.parent.removeChild(this);
        }
        
        // Уничтожаем PIXI объекты
        if (this.container) {
            this.container.removeChildren();
            if (this.container.parent) {
                this.container.parent.removeChild(this.container);
            }
            this.container.destroy({ children: false });
        }
        
        if (this.graphics) {
            this.graphics.destroy();
        }
        
        // Очищаем события
        this.events = {};
        
        this.onDestroy();
    }
    
    /**
     * Хук при уничтожении
     */
    onDestroy() {}
    
    /**
     * Подписка на событие
     * @param {string} event - имя события
     * @param {Function} callback - функция обратного вызова
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    /**
     * Отписка от события
     * @param {string} event - имя события
     * @param {Function} callback - функция обратного вызова
     */
    off(event, callback) {
        if (!this.events[event]) return;
        
        if (callback) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        } else {
            this.events[event] = [];
        }
    }
    
    /**
     * Испускание события
     * @param {string} event - имя события
     * @param {Object} data - данные события
     */
    emit(event, data) {
        if (!this.events[event]) return;
        
        for (const callback of this.events[event]) {
            callback(data);
        }
    }
    
    /**
     * Преобразование HEX цвета в десятичное число
     * @param {string} hex - HEX цвет
     * @returns {number}
     */
    hexToDecimal(hex) {
        if (typeof hex === 'number') return hex;
        return parseInt(hex.replace('#', '0x'));
    }
    
    /**
     * Пометка компонента как требующего обновления
     */
    markForUpdate() {
        this.needsUpdate = true;
    }

    /**
     * Пометка компонента как требующего перераскладки
     */
    markForLayout() {
        this.needsLayout = true;
    }

    /**
     * Установка размеров
     * @param {number} width - ширина
     * @param {number} height - высота
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.markForUpdate();
        this.markForLayout();
    }

    /**
     * Установка позиции
     * @param {number} x - координата X
     * @param {number} y - координата Y
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updatePosition();
    }
}

// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIComponent;
} else if (typeof window !== 'undefined') {
    window.UIComponent = UIComponent;
}
