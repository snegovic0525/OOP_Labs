import { test, expect } from "vitest";
import { Rect } from "./Primitives";

test("Rect hitTest and bounds logic", () => {
    const rect = new Rect(100, 50); // Ширина 100, высота 50
    rect.x = 200; // Сдвинули в x=200
    rect.y = 100; // Сдвинули в y=100
    
    // Проверка границ
    const bounds = rect.getBounds();
    expect(bounds.minX).toBe(150); // 200 - 50
    expect(bounds.maxX).toBe(250); // 200 + 50
    expect(bounds.minY).toBe(75);  // 100 - 25
    expect(bounds.maxY).toBe(125); // 100 + 25

    // Проверка кликов (Hit Test)
    // Точно в центр
    expect(rect.hitTest(200, 100)).toBe(true);
    // В левый верхний край
    expect(rect.hitTest(150, 75)).toBe(true);
    // Мимо по X
    expect(rect.hitTest(100, 100)).toBe(false);
    // Мимо по Y
    expect(rect.hitTest(200, 150)).toBe(false);
});