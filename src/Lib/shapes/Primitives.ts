import { Shape } from './Shape';
import { mat3 } from '../math/mat3';
import { RasterRenderer } from '../raster/RasterRender';

//ПРЯМОУГОЛЬНИК
export class Rect extends Shape {
    type = 'rect'; // Добавили это
    constructor(public w: number, public h: number) { super(); }
    
    toJSON() {
        return { ...super.toJSON(), w: this.w, h: this.h }; // Добавили это
    }

    drawRaster(r: RasterRenderer) {
        const m = this.getLocalToDeviceMatrix();
        // 4 угла в локальных координатах
        const pts = [
            { x: -this.w / 2, y: -this.h / 2 },
            { x: this.w / 2, y: -this.h / 2 },
            { x: this.w / 2, y: this.h / 2 },
            { x: -this.w / 2, y: this.h / 2 }
        ];
        // перевод углов в экранные координаты и рисуем полигон
        const screenPts = pts.map(p => mat3.transformPoint(m, p.x, p.y));
        r.fillPolygon(screenPts, this.fillStyle);
    }

    hitTest(px: number, py: number): boolean {
        const loc = this.transformPointToLocal(px, py);
        if (!loc) return false;
        // проверка попадания в коробку
        return loc.x >= -this.w / 2 && loc.x <= this.w / 2 &&
               loc.y >= -this.h / 2 && loc.y <= this.h / 2;
    }

    getBounds() {
        // упрощенный вариант: берем локальные углы, переводим в экранные и ищем min/max
        const m = this.getLocalToDeviceMatrix();
        const pts = [
            mat3.transformPoint(m, -this.w/2, -this.h/2),
            mat3.transformPoint(m, this.w/2, -this.h/2),
            mat3.transformPoint(m, this.w/2, this.h/2),
            mat3.transformPoint(m, -this.w/2, this.h/2)
        ];
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    }
}

//ОВАЛ
export class Oval extends Shape {
    type = 'oval';
    constructor(public rx: number, public ry: number) { super(); }
    toJSON() { return { ...super.toJSON(), rx: this.rx, ry: this.ry }; }
    

    drawRaster(r: RasterRenderer) {
        const m = this.getLocalToDeviceMatrix();
        const pts = [];
        // генерируем точки по кругу
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const lx = this.rx * Math.cos(angle);
            const ly = this.ry * Math.sin(angle);
            pts.push(mat3.transformPoint(m, lx, ly));
        }
        r.fillPolygon(pts, this.fillStyle);
    }

    hitTest(px: number, py: number): boolean {
        const loc = this.transformPointToLocal(px, py);
        if (!loc) return false;
        // формула эллипса
        const value = Math.pow(loc.x / this.rx, 2) + Math.pow(loc.y / this.ry, 2);
        return value <= 1;
    }

    getBounds() {
        const m = this.getLocalToDeviceMatrix();
        const c = mat3.transformPoint(m, 0, 0);
        // грубый расчет границ
        return { minX: c.x - this.rx * this.scaleX, maxX: c.x + this.rx * this.scaleX, 
                 minY: c.y - this.ry * this.scaleY, maxY: c.y + this.ry * this.scaleY };
    }
}

// ЛИНИЯ
export class Line extends Shape {
    type = 'line';
    constructor(public dx: number, public dy: number) { super(); }
    toJSON() { return { ...super.toJSON(), dx: this.dx, dy: this.dy }; }
    

    drawRaster(r: RasterRenderer) {
        const m = this.getLocalToDeviceMatrix();
        const p1 = mat3.transformPoint(m, -this.dx, -this.dy);
        const p2 = mat3.transformPoint(m, this.dx, this.dy);
        r.strokeLine(p1.x, p1.y, p2.x, p2.y, this.fillStyle, 5); // толщина 5 для наглядности
    }

    hitTest(px: number, py: number): boolean {
        const loc = this.transformPointToLocal(px, py);
        if (!loc) return false;
        // асстояние от точки до отрезка (упрощенно)
        const l2 = 4 * (this.dx * this.dx + this.dy * this.dy);
        if (l2 === 0) return false;
        const t = Math.max(0, Math.min(1, ((loc.x + this.dx) * (2 * this.dx) + (loc.y + this.dy) * (2 * this.dy)) / l2));
        const projX = -this.dx + t * (2 * this.dx);
        const projY = -this.dy + t * (2 * this.dy);
        const dist = Math.sqrt(Math.pow(loc.x - projX, 2) + Math.pow(loc.y - projY, 2));
        return dist <= 5; // попали, если ближе 5 пикселей
    }

    getBounds() {
        const m = this.getLocalToDeviceMatrix();
        const p1 = mat3.transformPoint(m, -this.dx, -this.dy);
        const p2 = mat3.transformPoint(m, this.dx, this.dy);
        return { minX: Math.min(p1.x, p2.x), maxX: Math.max(p1.x, p2.x), 
                 minY: Math.min(p1.y, p2.y), maxY: Math.max(p1.y, p2.y) };
    }
}