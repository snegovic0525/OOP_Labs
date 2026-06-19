import { useEffect, useRef } from "react";
import { RasterRenderer } from "./lib/raster/RasterRender";
import { Rect, Oval, Line } from "./lib/shapes/Primitives";
import { Shape } from "./lib/shapes/Shape";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapesRef = useRef<Shape[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const renderer = new RasterRenderer(canvas);

    // Создаем тестовые фигуры (накидываем как попало)
    const rect = new Rect(150, 100);
    rect.x = 200; rect.y = 200; rect.rotation = 0.5; // повернули
    rect.fillStyle = { r: 50, g: 150, b: 200, a: 255 }; // Синий

    const oval = new Oval(80, 50);
    oval.x = 500; oval.y = 250; oval.scaleX = 1.5; // растянули
    oval.fillStyle = { r: 200, g: 100, b: 50, a: 255 }; // Оранжевый

    const line = new Line(100, -50);
    line.x = 300; line.y = 400;
    line.fillStyle = { r: 255, g: 255, b: 255, a: 255 }; // Белый

    shapesRef.current = [rect, oval, line];

    // Отрисовка
    const render = () => {
      renderer.beginFrame();
      shapesRef.current.forEach(shape => shape.drawRaster(renderer));
      renderer.commit();
      requestAnimationFrame(render);
    };
    render();

    // Обработка кликов (Hit Test)
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      // Физические координаты клика
      const mouseX = (e.clientX - rect.left) * dpr;
      const mouseY = (e.clientY - rect.top) * dpr;

      // Проверяем с конца (что сверху)
      let hitFound = false;
      for (let i = shapesRef.current.length - 1; i >= 0; i--) {
        const shape = shapesRef.current[i];
        if (shape.hitTest(mouseX, mouseY)) {
          alert(`Попадание в фигуру: ${shape.constructor.name}`);
          hitFound = true;
          break;
        }
      }
      if (!hitFound) console.log("Мимо");
    };

    canvas.addEventListener("click", handleClick);

    return () => {
      canvas.removeEventListener("click", handleClick);
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#222", margin: 0, overflow: "hidden" }}>
      <p style={{ position: "absolute", color: "white", padding: 10, fontFamily: "sans-serif" }}>
        Кликни по фигуре, чтобы проверить hitTest!
      </p>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}