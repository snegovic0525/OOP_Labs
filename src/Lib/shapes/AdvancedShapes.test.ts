import { test, expect } from "vitest";
import { Triangle, QuadraticBezier } from "./AdvancedShapes";

test("Triangle hitTest (Sign method)", () => {
    // равносторонний треугольник
    const tri = new Triangle(0, -50, -50, 50, 50, 50);
    tri.x = 100; tri.y = 100;
    
    // центр треугольника
    expect(tri.hitTest(100, 100)).toBe(true);
    // далеко за пределами
    expect(tri.hitTest(0, 0)).toBe(false);
});

test("QuadraticBezier bounds approximation", () => {
    const qb = new QuadraticBezier({x: 0, y: 0}, {x: 50, y: 100}, {x: 100, y: 0});
    qb.x = 0; qb.y = 0;

    const bounds = qb.getBounds();
    // концы кривой на X: 0 и 100
    expect(bounds.minX).toBe(0);
    expect(bounds.maxX).toBe(100);
    // по Y кривая выгибается вверх до 50 (управляющая 100, но кривая дойдет только до середины)
    expect(bounds.maxY).toBeCloseTo(50, 0); 
});