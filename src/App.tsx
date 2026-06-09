import { useEffect, useRef, useState } from "react";
import { RasterRenderer, LineAlg, hexToRGBA } from "./Lib/raster/RasterRender";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RasterRenderer | null>(null);
  const [alg, setAlg] = useState<LineAlg>("bresenham");

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // инициализация один раз
    if (!rendererRef.current) {
        rendererRef.current = new RasterRenderer(canvasRef.current);
    }

    const renderer = rendererRef.current;
    renderer.setLineAlgorithm(alg);

    let rafId: number;

    const renderLoop = () => {
      renderer.beginFrame();

      // масштабируем под DPR
      const dpr = renderer.dpr;

      // 1. прозрачный круг и квадрат (для проверки blendPixel)
      // красный круг
      renderer.fillCircle(200 * dpr, 200 * dpr, 100 * dpr, { r: 255, g: 0, b: 0, a: 150 });
      // синий квадрат поверх
      const rectPts = [
        { x: 150 * dpr, y: 150 * dpr },
        { x: 350 * dpr, y: 150 * dpr },
        { x: 350 * dpr, y: 350 * dpr },
        { x: 150 * dpr, y: 350 * dpr }
      ];
      renderer.fillPolygon(rectPts, { r: 0, g: 0, b: 255, a: 150 });

      // 2. многоугольник (проверка Scanline)
      const starPts = [
        { x: 500 * dpr, y: 100 * dpr },
        { x: 600 * dpr, y: 300 * dpr },
        { x: 400 * dpr, y: 300 * dpr }
      ];
      renderer.fillPolygon(starPts, hexToRGBA("#10b981", 255)); // зеленый треугольник

      // 3. толстая ломаная линия с круглыми стыками (проверка strokePolygon)
      const polyline = [
        { x: 100 * dpr, y: 500 * dpr },
        { x: 300 * dpr, y: 400 * dpr },
        { x: 500 * dpr, y: 600 * dpr },
        { x: 700 * dpr, y: 450 * dpr }
      ];
      renderer.strokePolygon(polyline, hexToRGBA("#f59e0b", 255), 30 * dpr); // Желтая толстая линия

      // 4. обычная линия для проверки лесенок (алгоритм Ву и Брезенхем)
      renderer.drawLine(50 * dpr, 50 * dpr, 700 * dpr, 150 * dpr, { r: 255, g: 255, b: 255, a: 255 });

      renderer.commit();
      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [alg]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", backgroundColor: "#111" }}>
      {/* интерфейс поверх Canvas */}
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10, background: "white", padding: 10, border: "1px solid black" }}>
        <p style={{ margin: "0 0 10px 0", color: "black", fontFamily: "sans-serif" }}>Алгоритм линий:</p>
        <select value={alg} onChange={(e) => setAlg(e.target.value as LineAlg)}>
          <option value="bresenham">Брезенхем (резкий)</option>
          <option value="wu">Алгоритм Ву (сглаженный)</option>
        </select>
      </div>

      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}