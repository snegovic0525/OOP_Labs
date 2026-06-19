// src/lib/raster/RasterRenderer.ts

export type RGBA = { r: number; g: number; b: number; a: number };
export type LineAlg = 'bresenham' | 'wu';

// ограничитель чтобы цвет не вылез за 0-255
export function clampByte(v: number): number {
    if (v < 0) return 0;
    if (v > 255) return 255;
    return Math.floor(v);
}

// парсер цвета :)
export function hexToRGBA(hex: string, alpha = 255): RGBA {
    hex = hex.replace('#', '');
    return {
        r: parseInt(hex.substring(0, 2), 16) || 0,
        g: parseInt(hex.substring(2, 4), 16) || 0,
        b: parseInt(hex.substring(4, 6), 16) || 0,
        a: alpha
    };
}

export class RasterRenderer {
    private ctx: CanvasRenderingContext2D;
    private imageData: ImageData | null = null;
    private buf!: Uint8ClampedArray;
    
    width = 0; 
    height = 0; 
    dpr = 1;
    
    private canvas: HTMLCanvasElement;
    private _onWindowResize: () => void;
    private lineAlg: LineAlg = 'bresenham';

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('No 2D context');
        this.ctx = ctx;
        
        this._onWindowResize = () => this.resize();
        window.addEventListener('resize', this._onWindowResize);
        this.resize();
    }

    dispose() {
        window.removeEventListener('resize', this._onWindowResize);
    }

    setLineAlgorithm(a: LineAlg) {
        this.lineAlg = a;
    }

    // 1.1 индекс в одномерном массиве
    private idx(x: number, y: number): number {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        // Проверка выхода за границы экрана
        if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) return -1;
        return (iy * this.width + ix) * 4;
    }

    // жесткая установка пикселя (без прозрачности)
    setPixel(x: number, y: number, color: RGBA) {
        const i = this.idx(x, y);
        if (i < 0) return;
        this.buf[i] = color.r;
        this.buf[i + 1] = color.g;
        this.buf[i + 2] = color.b;
        this.buf[i + 3] = color.a;
    }

    // 1.4 альфа блендинг (смешивание цветов по формуле)
    private blendPixel(x: number, y: number, color: RGBA, alphaFactor = 1) {
        const i = this.idx(x, y);
        if (i < 0) return;

        // переводим в 0..1 для формул
        const aSrc = (color.a / 255) * alphaFactor;
        const aDst = this.buf[i + 3] / 255;

        // формула прозрачности
        const aOut = aSrc + aDst * (1 - aSrc);
        if (aOut === 0) return;

        // формула цвета
        const r = (color.r * aSrc + this.buf[i] * aDst * (1 - aSrc)) / aOut;
        const g = (color.g * aSrc + this.buf[i + 1] * aDst * (1 - aSrc)) / aOut;
        const b = (color.b * aSrc + this.buf[i + 2] * aDst * (1 - aSrc)) / aOut;

        this.buf[i] = clampByte(r);
        this.buf[i + 1] = clampByte(g);
        this.buf[i + 2] = clampByte(b);
        this.buf[i + 3] = clampByte(aOut * 255);
    }

    // 2.1 жизненный цикл
    resize() {
        this.dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.width = Math.floor(rect.width * this.dpr);
        this.height = Math.floor(rect.height * this.dpr);
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.imageData = this.ctx.createImageData(this.width, this.height);
        this.buf = this.imageData.data;
    }

    beginFrame(clear = true) {
        if (clear && this.buf) {
            this.buf.fill(0); // очищаем черным прозрачным
        }
    }

    commit() {
        if (this.imageData) {
            this.ctx.putImageData(this.imageData, 0, 0);
        }
    }

    // горизонтальная линия для заливок (бистрая)
    private drawHSpan(y: number, x0: number, x1: number, color: RGBA) {
        const start = Math.min(x0, x1);
        const end = Math.max(x0, x1);
        for (let x = start; x <= end; x++) {
            this.blendPixel(x, y, color);
        }
    }

    // 1.5 алгоритм Безенхема (только целые числа)
    drawLineBrassenham(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
        x0 = Math.floor(x0); y0 = Math.floor(y0);
        x1 = Math.floor(x1); y1 = Math.floor(y1);

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            this.blendPixel(x0, y0, color);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    // 1.6 плгоритм Ву (сглаживание)
    drawLineWu(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
        const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
        if (steep) {
            [x0, y0] = [y0, x0];
            [x1, y1] = [y1, x1];
        }
        if (x0 > x1) {
            [x0, x1] = [x1, x0];
            [y0, y1] = [y1, y0];
        }

        const dx = x1 - x0;
        const dy = y1 - y0;
        const gradient = dx === 0 ? 1 : dy / dx;

        let intery = y0;
        for (let x = x0; x <= x1; x++) {
            const y = Math.floor(intery);
            const fpart = intery - y;
            const rfpart = 1 - fpart;

            if (steep) {
                this.blendPixel(y, x, color, rfpart);
                this.blendPixel(y + 1, x, color, fpart);
            } else {
                this.blendPixel(x, y, color, rfpart);
                this.blendPixel(x, y + 1, color, fpart);
            }
            intery += gradient;
        }
    }

    // метод-обертка
    drawLine(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
        if (this.lineAlg === 'wu') {
            this.drawLineWu(x0, y0, x1, y1, color);
        } else {
            this.drawLineBrassenham(x0, y0, x1, y1, color);
        }
    }

    // 2.3 окружность
    fillCircle(cx: number, cy: number, radius: number, color: RGBA) {
        for (let y = cy - radius; y <= cy + radius; y++) {
            const dy = y - cy;
            const dx = Math.sqrt(radius * radius - dy * dy);
            this.drawHSpan(y, cx - dx, cx + dx, color);
        }
    }

    // 2.3 многоугольник (Scanline + Even-Odd)
    fillPolygon(points: { x: number; y: number }[], color: RGBA) {
        if (points.length < 3) return;

        let minY = points[0].y, maxY = points[0].y;
        for (const p of points) {
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }

        for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
            const intersections: number[] = [];
            const scanY = y + 0.5; // по центру пикселя

            for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];

                // Пересекает ли линия p1-p2 нашу скан-линию?
                if ((p1.y <= scanY && p2.y > scanY) || (p2.y <= scanY && p1.y > scanY)) {
                    const t = (scanY - p1.y) / (p2.y - p1.y);
                    const crossX = p1.x + t * (p2.x - p1.x);
                    intersections.push(crossX);
                }
            }

            intersections.sort((a, b) => a - b);
            
            // соединяем парами (правило четности)
            for (let i = 0; i < intersections.length; i += 2) {
                if (i + 1 < intersections.length) {
                    this.drawHSpan(y, intersections[i], intersections[i + 1], color);
                }
            }
        }
    }

    // 2.5 толстая линия
    strokeLine(x0: number, y0: number, x1: number, y1: number, color: RGBA, width = 1) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return;

        // нормаль
        const nx = -dy / length;
        const ny = dx / length;
        const half = width / 2;

        const pts = [
            { x: x0 + nx * half, y: y0 + ny * half },
            { x: x0 - nx * half, y: y0 - ny * half },
            { x: x1 - nx * half, y: y1 - ny * half },
            { x: x1 + nx * half, y: y1 + ny * half }
        ];

        this.fillPolygon(pts, color);
    }

    // 2.5 контур (полигон из толстых линий со стыками)
    strokePolygon(points: { x: number; y: number }[], color: RGBA, width = 1) {
        for (let i = 0; i < points.length; i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            
            // Рисуем саму палку
            this.strokeLine(a.x, a.y, b.x, b.y, color, width);
            // Заглушка (круглый стык)
            this.fillCircle(a.x, a.y, width / 2, color);
        }
    }
}