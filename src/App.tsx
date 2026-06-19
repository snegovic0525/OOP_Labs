import { useEffect, useRef } from "react";
import { RasterRenderer } from "./Lib/raster/RasterRender";
import { Shape } from "./Lib/shapes/Shape";
import { Triangle, QuadraticBezier, CubicBezier, PathBezier } from "./Lib/shapes/AdvancedShapes";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapesRef = useRef<Shape[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const renderer = new RasterRenderer(canvas);

    // 1. Треугольник
    const triangle = new Triangle(0, -50, -50, 50, 50, 50);
    triangle.x = 200; triangle.y = 200; triangle.scaleX = 1.5; triangle.scaleY = 1.5;
    triangle.fillStyle = { r: 100, g: 200, b: 100, a: 255 };

    // 2. Квадратичная кривая
    const qBezier = new QuadraticBezier({x: -100, y: 0}, {x: 0, y: -100}, {x: 100, y: 0});
    qBezier.x = 500; qBezier.y = 200;
    qBezier.fillStyle = { r: 255, g: 100, b: 100, a: 255 }; // Красная линия

    // 3. Кубическая кривая (S-образная)
    const cBezier = new CubicBezier({x: -100, y: 50}, {x: -50, y: -100}, {x: 50, y: 150}, {x: 100, y: -50});
    cBezier.x = 300; cBezier.y = 400;
    cBezier.fillStyle = { r: 100, g: 100, b: 255, a: 255 }; // Синяя линия

    // 4. PathBezier (Замкнутый контур)
    const path = new PathBezier([{x: -50, y: -50}, {x: 50, y: -80}, {x: 80, y: 50}, {x: -20, y: 80}]);
    path.x = 600; path.y = 400;
    path.closed = true;
    path.fillStyle = { r: 255, g: 255, b: 0, a: 255 }; // Желтая

    shapesRef.current = [triangle, qBezier, cBezier, path];

    const render = () => {
      renderer.beginFrame();
      shapesRef.current.forEach(shape => shape.drawRaster(renderer));
      renderer.commit();
      requestAnimationFrame(render);
    };
    render();

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const mouseX = (e.clientX - rect.left) * dpr;
      const mouseY = (e.clientY - rect.top) * dpr;

      let hitFound = false;
      for (let i = shapesRef.current.length - 1; i >= 0; i--) {
        const shape = shapesRef.current[i];
        if (shape.hitTest(mouseX, mouseY)) {
          alert(`Попадание в: ${shape.constructor.name}`);
          hitFound = true;
          break;
        }
      }
    };

    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("click", handleClick);
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a1a", margin: 0, overflow: "hidden" }}>
      <p style={{ position: "absolute", color: "white", padding: 10, fontFamily: "sans-serif" }}>
        ЛР 6: Треугольник и Кривые. Кликай по линиям!
      </p>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}