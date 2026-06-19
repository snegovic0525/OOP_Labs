import { Shape } from './Shape';
import { mat3, Point2D } from '../math/mat3';
import { RasterRenderer } from '../raster/RasterRender';

//расстояние от точки до отрезка (нужна для hitTest кривых)
function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

// тРЕУГОЛЬНИК
export class Triangle extends Shape {
    // храним локальные смещения вершин от центра
    constructor(public dx1: number, public dy1: number,
                public dx2: number, public dy2: number,
                public dx3: number, public dy3: number) {
        super();
    }

    drawRaster(r: RasterRenderer) {
        const m = this.getLocalToDeviceMatrix();
        const pts = [
            mat3.transformPoint(m, this.dx1, this.dy1),
            mat3.transformPoint(m, this.dx2, this.dy2),
            mat3.transformPoint(m, this.dx3, this.dy3)
        ];
        r.fillPolygon(pts, this.fillStyle);
        r.strokePolygon(pts, { r: 255, g: 255, b: 255, a: 255 }, 2); // обводка
    }

    hitTest(px: number, py: number): boolean {
        const loc = this.transformPointToLocal(px, py);
        if (!loc) return false;
        
        // метод знаков (векторные произведения)
        const sign = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
            return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
        }
        
        const d1 = sign(loc.x, loc.y, this.dx1, this.dy1, this.dx2, this.dy2);
        const d2 = sign(loc.x, loc.y, this.dx2, this.dy2, this.dx3, this.dy3);
        const d3 = sign(loc.x, loc.y, this.dx3, this.dy3, this.dx1, this.dy1);
        
        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        
        return !(hasNeg && hasPos);
    }

    getBounds() {
        const m = this.getLocalToDeviceMatrix();
        const pts = [
            mat3.transformPoint(m, this.dx1, this.dy1),
            mat3.transformPoint(m, this.dx2, this.dy2),
            mat3.transformPoint(m, this.dx3, this.dy3)
        ];
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    }
}

//КВАДРАТИЧНАЯ КРИВАЯ БЕЗЬЕ
export class QuadraticBezier extends Shape {
    constructor(public p0: Point2D, public p1: Point2D, public p2: Point2D) {
        super();
    }

    // вычисление точки по формуле Безье
    evalLocal(t: number): Point2D {
        const t1 = 1 - t;
        return {
            x: t1 * t1 * this.p0.x + 2 * t1 * t * this.p1.x + t * t * this.p2.x,
            y: t1 * t1 * this.p0.y + 2 * t1 * t * this.p1.y + t * t * this.p2.y
        };
    }

    // аппроксимация (разбиваем на 20 отрезков)
    flattenDevicePoints(): Point2D[] {
        const m = this.getLocalToDeviceMatrix();
        const pts: Point2D[] = [];
        for (let i = 0; i <= 20; i++) {
            const locPt = this.evalLocal(i / 20);
            pts.push(mat3.transformPoint(m, locPt.x, locPt.y));
        }
        return pts;
    }

    drawRaster(r: RasterRenderer) {
        const pts = this.flattenDevicePoints();
        // рисуем ломаную без заливки (strokePolygon рисует контур)
        for (let i = 0; i < pts.length - 1; i++) {
            r.strokeLine(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, this.fillStyle, 3);
        }
    }

    hitTest(px: number, py: number): boolean {
        const pts = this.flattenDevicePoints();
        for (let i = 0; i < pts.length - 1; i++) {
            const dist = distToSegment(px, py, pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
            if (dist <= 5) return true; // Попали, если ближе 5 пикселей к линии
        }
        return false;
    }

    getBounds() {
        const pts = this.flattenDevicePoints();
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    }
}

//КУБИЧЕСКАЯ КРИВАЯ БЕЗЬЕ
export class CubicBezier extends Shape {
    constructor(public p0: Point2D, public p1: Point2D, public p2: Point2D, public p3: Point2D) {
        super();
    }

    evalLocal(t: number): Point2D {
        const t1 = 1 - t;
        return {
            x: t1*t1*t1 * this.p0.x + 3*t1*t1*t * this.p1.x + 3*t1*t*t * this.p2.x + t*t*t * this.p3.x,
            y: t1*t1*t1 * this.p0.y + 3*t1*t1*t * this.p1.y + 3*t1*t*t * this.p2.y + t*t*t * this.p3.y
        };
    }

    flattenDevicePoints(): Point2D[] {
        const m = this.getLocalToDeviceMatrix();
        const pts: Point2D[] = [];
        for (let i = 0; i <= 30; i++) { // Для кубической берем 30 точек
            const locPt = this.evalLocal(i / 30);
            pts.push(mat3.transformPoint(m, locPt.x, locPt.y));
        }
        return pts;
    }

    drawRaster(r: RasterRenderer) {
        const pts = this.flattenDevicePoints();
        for (let i = 0; i < pts.length - 1; i++) {
            r.strokeLine(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, this.fillStyle, 4);
        }
    }

    hitTest(px: number, py: number): boolean {
        const pts = this.flattenDevicePoints();
        for (let i = 0; i < pts.length - 1; i++) {
            if (distToSegment(px, py, pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y) <= 5) return true;
        }
        return false;
    }

    getBounds() {
        const pts = this.flattenDevicePoints();
        return { 
            minX: Math.min(...pts.map(p => p.x)), maxX: Math.max(...pts.map(p => p.x)), 
            minY: Math.min(...pts.map(p => p.y)), maxY: Math.max(...pts.map(p => p.y)) 
        };
    }
}

// PathBezier
export class PathBezier extends Shape {
    public mode: 'polyline' | 'bezier' = 'polyline';
    public closed: boolean = false;

    constructor(public points: Point2D[]) {
        super();
    }

    flattenDevicePoints(): Point2D[] {
        const m = this.getLocalToDeviceMatrix();
        const screenPts = this.points.map(p => mat3.transformPoint(m, p.x, p.y));
        
        if (this.mode === 'polyline') {
            if (this.closed && screenPts.length > 0) screenPts.push(screenPts[0]);
            return screenPts;
        } 
        
        // Режим bezier (просто рисуем ломаную, но с бОльшим сглаживанием, если бы писали Catmull-Rom)
        if (this.closed && screenPts.length > 0) screenPts.push(screenPts[0]);
        return screenPts;
    }

    drawRaster(r: RasterRenderer) {
        const pts = this.flattenDevicePoints();
        for (let i = 0; i < pts.length - 1; i++) {
            r.strokeLine(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, this.fillStyle, 3);
        }
    }

    hitTest(px: number, py: number): boolean {
        const pts = this.flattenDevicePoints();
        for (let i = 0; i < pts.length - 1; i++) {
            if (distToSegment(px, py, pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y) <= 5) return true;
        }
        return false;
    }

    getBounds() {
        const pts = this.flattenDevicePoints();
        return { 
            minX: Math.min(...pts.map(p => p.x)), maxX: Math.max(...pts.map(p => p.x)), 
            minY: Math.min(...pts.map(p => p.y)), maxY: Math.max(...pts.map(p => p.y)) 
        };
    }
}