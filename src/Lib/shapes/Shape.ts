import { mat3, Mat3, Point2D } from '../math/mat3';
import { RasterRenderer, RGBA } from '../raster/RasterRender';

export abstract class Shape {
    id: string = Math.random().toString(36).substring(2, 9);
    
    // Трансформации
    x = 0; 
    y = 0; 
    rotation = 0; 
    scaleX = 1; 
    scaleY = 1;

    // Стили
    fillStyle: RGBA = { r: 100, g: 100, b: 100, a: 255 };

    // 1. Получить матрицу (Локальные -> Экран)
    getLocalToDeviceMatrix(): Mat3 {
        return mat3.fromTransform(this.x, this.y, this.rotation, this.scaleX, this.scaleY);
    }

    // 2. Получить обратную матрицу (Экран -> Локальные)
    getDeviceToLocalMatrix(): Mat3 | null {
        return mat3.invert(this.getLocalToDeviceMatrix());
    }

    // 3. Перевод точки клика в локальные координаты фигуры
    transformPointToLocal(px: number, py: number): Point2D | null {
        const inv = this.getDeviceToLocalMatrix();
        if (!inv) return null;
        return mat3.transformPoint(inv, px, py);
    }

    // Абстрактные методы, которые обязаны написать наследники
    abstract drawRaster(r: RasterRenderer): void;
    abstract hitTest(px: number, py: number): boolean;
    abstract getBounds(): { minX: number; minY: number; maxX: number; maxY: number };
}