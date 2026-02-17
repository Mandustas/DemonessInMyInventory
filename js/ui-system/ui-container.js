/**
 * UIContainer - контейнер для UI элементов
 * Поддерживает иерархическую структуру и автоматическое расположение элементов
 */
class UIContainer extends UIComponent {
    constructor(config = {}) {
        super(config);

        // Массив дочерних элементов
        this.children = [];

        // Тип раскладки
        this.layout = config.layout || 'none'; // 'none', 'grid', 'flex-horizontal', 'flex-vertical'

        // Настройки grid раскладки
        this.gridConfig = {
            columns: config.gridColumns || 1,
            rows: config.gridRows || 0,
            gap: config.gap || 0,
            cellWidth: config.cellWidth || 0,
            cellHeight: config.cellHeight || 0
        };

        // Настройки flex раскладки
        this.flexConfig = {
            gap: config.gap || 0,
            align: config.align || 'start', // 'start', 'center', 'end', 'stretch'
            justify: config.justify || 'start' // 'start', 'center', 'end', 'space-between', 'space-around'
        };

        // Padding внутри контейнера
        this.padding = config.padding || { top: 0, right: 0, bottom: 0, left: 0 };

        // Фоновые стили
        this.backgroundStyle = config.background || null;
        this.borderStyle = config.border || null;
        
        // Обработчик клика
        this.onClick = config.onClick || null;
    }
    
    /**
     * Хук инициализации
     */
    onInit() {
        this.updateLayout();
        
        // Настраиваем интерактивность если есть onClick
        if (this.onClick && this.container) {
            this.container.eventMode = 'static';
            this.container.cursor = 'pointer';
            this.container.on('pointerdown', (e) => {
                this.onClick(e, this);
            });
        }
    }
    
    /**
     * Добавление дочернего элемента
     * @param {UIComponent} child - дочерний элемент
     * @param {Object} config - дополнительная конфигурация
     */
    addChild(child, config = {}) {
        super.addChild(child);
        
        // Сохраняем конфигурацию элемента
        child.layoutConfig = config;
        
        // Обновляем раскладку
        this.updateLayout();
    }
    
    /**
     * Удаление дочернего элемента
     * @param {UIComponent} child - дочерний элемент
     */
    removeChild(child) {
        super.removeChild(child);
        this.updateLayout();
    }
    
    /**
     * Обновление раскладки элементов
     */
    updateLayout() {
        if (!this.container) return;
        
        const { columns, rows, gap, cellWidth, cellHeight } = this.gridConfig;
        const { gap: flexGap } = this.flexConfig;
        
        // Вычисляем доступную область с учетом padding
        const availableWidth = this.width - this.padding.left - this.padding.right;
        const availableHeight = this.height - this.padding.top - this.padding.bottom;
        
        // Позиция начала раскладки
        let startX = this.padding.left;
        let startY = this.padding.top;
        
        if (this.layout === 'grid') {
            // Grid раскладка
            const effectiveCellWidth = cellWidth || ((availableWidth - (columns - 1) * gap) / columns);
            const effectiveCellHeight = cellHeight || ((availableHeight - (rows - 1) * gap) / rows);
            
            let col = 0;
            let row = 0;
            
            for (const child of this.children) {
                const childCol = child.layoutConfig?.column ?? col;
                const childRow = child.layoutConfig?.row ?? row;
                
                // Позиция ячейки
                const x = startX + childCol * (effectiveCellWidth + gap);
                const y = startY + childRow * (effectiveCellHeight + gap);
                
                // Устанавливаем позицию и размер
                if (child.setPosition) {
                    child.setPosition(x, y);
                } else {
                    child.x = x;
                    child.y = y;
                }
                
                if (child.setSize) {
                    child.setSize(effectiveCellWidth, effectiveCellHeight);
                } else {
                    child.width = effectiveCellWidth;
                    child.height = effectiveCellHeight;
                }
                
                // Обновляем позицию контейнера ребенка
                child.updatePosition();
                
                // Переходим к следующей ячейке
                col++;
                if (col >= columns) {
                    col = 0;
                    row++;
                }
            }
            
        } else if (this.layout === 'flex-horizontal') {
            // Горизонтальная flex раскладка
            let currentX = startX;
            const alignY = this.getFlexAlignY(startY, flexGap);
            
            for (const child of this.children) {
                child.x = currentX;
                
                // Выравнивание по вертикали
                if (this.flexConfig.align === 'center') {
                    child.y = startY + (availableHeight - child.height) / 2;
                } else if (this.flexConfig.align === 'end') {
                    child.y = startY + availableHeight - child.height;
                } else {
                    child.y = startY;
                }
                
                child.updatePosition();
                currentX += child.width + flexGap;
            }
            
        } else if (this.layout === 'flex-vertical') {
            // Вертикальная flex раскладка
            let currentY = startY;
            
            for (const child of this.children) {
                child.y = currentY;
                
                // Выравнивание по горизонтали
                if (this.flexConfig.justify === 'center') {
                    child.x = startX + (availableWidth - child.width) / 2;
                } else if (this.flexConfig.justify === 'end') {
                    child.x = startX + availableWidth - child.width;
                } else {
                    child.x = startX;
                }
                
                child.updatePosition();
                currentY += child.height + flexGap;
            }
        }
        
        this.needsLayout = false;
        this.markForUpdate();
    }
    
    /**
     * Вычисление Y позиции для flex выравнивания
     * @param {number} startY - начальная Y координата
     * @param {number} gap - отступ между элементами
     */
    getFlexAlignY(startY, gap) {
        const { align } = this.flexConfig;
        const availableHeight = this.height - this.padding.top - this.padding.bottom;

        if (align === 'center') {
            const totalHeight = this.children.reduce((sum, child) => sum + child.height, 0);
            const gapsHeight = (this.children.length - 1) * gap;
            return startY + (availableHeight - totalHeight - gapsHeight) / 2;
        } else if (align === 'end') {
            const totalHeight = this.children.reduce((sum, child) => sum + child.height, 0);
            const gapsHeight = (this.children.length - 1) * gap;
            return startY + availableHeight - totalHeight - gapsHeight;
        }
        return startY;
    }
    
    /**
     * Отрисовка фона
     */
    renderBackground() {
        if (!this.graphics) return;
        
        if (this.backgroundStyle) {
            const { color, gradient } = this.backgroundStyle;
            
            if (gradient) {
                // Градиентный фон
                this.renderGradientBackground(gradient);
            } else if (color) {
                // Сплошной фон
                this.graphics.beginFill(this.hexToDecimal(color));
                this.graphics.drawRect(0, 0, this.width, this.height);
                this.graphics.endFill();
            }
        }
    }
    
    /**
     * Отрисовка градиентного фона
     * Плавный градиент через интерполяцию цветов
     */
    renderGradientBackground(gradient) {
        const { type, colors } = gradient;

        if (type === 'vertical') {
            // Вертикальный градиент с плавной интерполяцией
            for (let i = 0; i < this.height; i++) {
                const t = i / (this.height - 1);
                
                // Интерполяция между цветами
                let r, g, b;
                if (colors.length >= 3) {
                    // Трехцветный градиент
                    const r1 = parseInt(colors[0].slice(1, 3), 16);
                    const g1 = parseInt(colors[0].slice(3, 5), 16);
                    const b1 = parseInt(colors[0].slice(5, 7), 16);
                    const r2 = parseInt(colors[1].slice(1, 3), 16);
                    const g2 = parseInt(colors[1].slice(3, 5), 16);
                    const b2 = parseInt(colors[1].slice(5, 7), 16);
                    const r3 = parseInt(colors[2].slice(1, 3), 16);
                    const g3 = parseInt(colors[2].slice(3, 5), 16);
                    const b3 = parseInt(colors[2].slice(5, 7), 16);
                    
                    if (t < 0.5) {
                        const localT = t * 2;
                        r = Math.round(r1 + (r2 - r1) * localT);
                        g = Math.round(g1 + (g2 - g1) * localT);
                        b = Math.round(b1 + (b2 - b1) * localT);
                    } else {
                        const localT = (t - 0.5) * 2;
                        r = Math.round(r2 + (r3 - r2) * localT);
                        g = Math.round(g2 + (g3 - g2) * localT);
                        b = Math.round(b2 + (b3 - b2) * localT);
                    }
                } else if (colors.length === 2) {
                    // Двухцветный градиент
                    const r1 = parseInt(colors[0].slice(1, 3), 16);
                    const g1 = parseInt(colors[0].slice(3, 5), 16);
                    const b1 = parseInt(colors[0].slice(5, 7), 16);
                    const r2 = parseInt(colors[1].slice(1, 3), 16);
                    const g2 = parseInt(colors[1].slice(3, 5), 16);
                    const b2 = parseInt(colors[1].slice(5, 7), 16);
                    r = Math.round(r1 + (r2 - r1) * t);
                    g = Math.round(g1 + (g2 - g1) * t);
                    b = Math.round(b1 + (b2 - b1) * t);
                } else {
                    const color = this.hexToDecimal(colors[0]);
                    r = (color >> 16) & 0xFF;
                    g = (color >> 8) & 0xFF;
                    b = color & 0xFF;
                }
                
                const color = (r << 16) + (g << 8) + b;
                this.graphics.beginFill(color);
                this.graphics.drawRect(0, i, this.width, 1);
                this.graphics.endFill();
            }
        }
    }
    
    /**
     * Отрисовка границы
     */
    renderBorder() {
        if (!this.borderStyle || !this.borderStyle.color || !this.borderStyle.width) return;
        
        const { color, width, radius } = this.borderStyle;

        if (radius && radius > 0) {
            // Скругленная граница
            this.graphics.lineStyle(width, this.hexToDecimal(color));
            this.graphics.drawRoundedRect(0, 0, this.width, this.height, radius);
        } else {
            // Прямоугольная граница
            this.graphics.lineStyle(width, this.hexToDecimal(color));
            this.graphics.drawRect(0, 0, this.width, this.height);
        }
    }
    
    /**
     * Обработка ввода
     */
    onInput(type, data) {
        // Контейнер может обрабатывать клики на пустой области
        if (this.config.onClick && type === 'mousedown') {
            this.config.onClick(data);
            return true;
        }
        return false;
    }
    
    /**
     * Установка размеров
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.markForLayout();
        this.markForUpdate();
    }
    
    /**
     * Установка позиции
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updatePosition();
    }
}

// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIContainer;
} else if (typeof window !== 'undefined') {
    window.UIContainer = UIContainer;
}
