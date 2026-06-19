import { useEffect, useRef, useState } from "react";
import { RasterRenderer } from "./Lib/raster/RasterRender";
import { Rect, Oval } from "./Lib/shapes/Primitives";
import { Shape } from "./Lib/shapes/Shape";

// Типы режимов взаимодействия
type InteractionMode = 'idle' | 'drag' | 'rotate' | 'resize';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RasterRenderer | null>(null);
  
  // React-состояние для списка фигур и выбранного ID (чтобы обновлять UI кнопок)
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Хранилище взаимодействия (useRef, чтобы не тормозил React при движении мыши)
  const interact = useRef({
    mode: 'idle' as InteractionMode,
    startX: 0, 
    startY: 0,
    initX: 0, 
    initY: 0, 
    initRot: 0, 
    initScaleX: 1, 
    initScaleY: 1
  });

  // Получить выбранную фигуру
  const getSelectedShape = () => shapes.find(s => s.id === selectedId);

  // --- ИНИЦИАЛИЗАЦИЯ И РЕНДЕР-ЦИКЛ ---
  useEffect(() => {
    if (!canvasRef.current) return;
    if (!rendererRef.current) {
        rendererRef.current = new RasterRenderer(canvasRef.current);
    }
    const renderer = rendererRef.current;
    let rafId: number;

    const render = () => {
      renderer.beginFrame();

      // 1. Рисуем все фигуры (по порядку слоев: от нижних к верхним)
      shapes.forEach(shape => shape.drawRaster(renderer));

      // 2. Рисуем интерфейс выделения для выбранного объекта
      const selected = shapes.find(s => s.id === selectedId);
      if (selected) {
        const bounds = selected.getBounds();
        // Рамка выделения (зеленая)
        renderer.strokeLine(bounds.minX, bounds.minY, bounds.maxX, bounds.minY, {r:0, g:255, b:0, a:255});
        renderer.strokeLine(bounds.maxX, bounds.minY, bounds.maxX, bounds.maxY, {r:0, g:255, b:0, a:255});
        renderer.strokeLine(bounds.maxX, bounds.maxY, bounds.minX, bounds.maxY, {r:0, g:255, b:0, a:255});
        renderer.strokeLine(bounds.minX, bounds.maxY, bounds.minX, bounds.minY, {r:0, g:255, b:0, a:255});

        // Ручка вращения (сверху по центру)
        const cx = (bounds.minX + bounds.maxX) / 2;
        renderer.fillCircle(cx, bounds.minY - 20, 8, {r:255, g:100, b:100, a:255});
        renderer.strokeLine(cx, bounds.minY, cx, bounds.minY - 20, {r:0, g:255, b:0, a:255});

        // Ручка масштаба (правый нижний угол)
        renderer.fillCircle(bounds.maxX, bounds.maxY, 8, {r:100, g:100, b:255, a:255});
      }

      renderer.commit();
      rafId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(rafId);
  }, [shapes, selectedId]);


  // --- СОБЫТИЯ МЫШИ (Pointer Events) ---
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const px = (e.clientX - rect.left) * dpr;
    const py = (e.clientY - rect.top) * dpr;

    // Захват указателя, чтобы не слетало при выходе за экран
    e.currentTarget.setPointerCapture(e.pointerId);

    const selected = getSelectedShape();

    // 1. Проверяем клик по ручкам управления (если объект уже выбран)
    if (selected) {
      const b = selected.getBounds();
      const cx = (b.minX + b.maxX) / 2;
      
      // Клик по ручке вращения (красный кружок сверху)
      const distRot = Math.hypot(px - cx, py - (b.minY - 20));
      if (distRot < 15) {
        startInteraction('rotate', px, py, selected);
        return;
      }
      
      // Клик по ручке масштаба (синий кружок внизу справа)
      const distResize = Math.hypot(px - b.maxX, py - b.maxY);
      if (distResize < 15) {
        startInteraction('resize', px, py, selected);
        return;
      }
    }

    // 2. Проверяем клик по самим объектам (Идем с конца, чтобы выбирать верхние!)
    let hitFound = false;
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (shapes[i].hitTest(px, py)) {
        setSelectedId(shapes[i].id);
        startInteraction('drag', px, py, shapes[i]);
        hitFound = true;
        break;
      }
    }

    // 3. Если кликнули в пустоту — снимаем выделение
    if (!hitFound) {
      setSelectedId(null);
      interact.current.mode = 'idle';
    }
  };

  const startInteraction = (mode: InteractionMode, px: number, py: number, shape: Shape) => {
    interact.current = {
      mode,
      startX: px, startY: py,
      initX: shape.x, initY: shape.y,
      initRot: shape.rotation,
      initScaleX: shape.scaleX, initScaleY: shape.scaleY
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (interact.current.mode === 'idle' || !selectedId) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const px = (e.clientX - rect.left) * dpr;
    const py = (e.clientY - rect.top) * dpr;

    const shape = getSelectedShape();
    if (!shape) return;

    const state = interact.current;
    const dx = px - state.startX;
    const dy = py - state.startY;

    // ВАЖНО: Все изменения считаются от INITIAL состояния, чтобы не было рывков и накопления ошибки
    if (state.mode === 'drag') {
      shape.x = state.initX + dx;
      shape.y = state.initY + dy;
    } 
    else if (state.mode === 'rotate') {
      // Считаем угол от центра фигуры до мышки
      const angle = Math.atan2(py - shape.y, px - shape.x);
      const startAngle = Math.atan2(state.startY - shape.y, state.startX - shape.x);
      shape.rotation = state.initRot + (angle - startAngle);
    } 
    else if (state.mode === 'resize') {
      // Пропорциональное масштабирование
      const distStart = Math.hypot(state.startX - shape.x, state.startY - shape.y);
      const distNow = Math.hypot(px - shape.x, py - shape.y);
      const ratio = distNow / distStart;
      
      // Защита от отрицательного или нулевого масштаба
      shape.scaleX = Math.max(0.1, state.initScaleX * ratio);
      shape.scaleY = Math.max(0.1, state.initScaleY * ratio);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    interact.current.mode = 'idle';
    e.currentTarget.releasePointerCapture(e.pointerId);
  };


  // --- ФУНКЦИИ ИНТЕРФЕЙСА (UI) ---
  const addRect = () => {
    const r = new Rect(100, 80);
    r.x = 200; r.y = 200;
    r.fillStyle = { r: 50, g: 150, b: 200, a: 255 };
    setShapes([...shapes, r]);
  };

  const addOval = () => {
    const o = new Oval(60, 40);
    o.x = 300; o.y = 300;
    o.fillStyle = { r: 200, g: 100, b: 50, a: 255 };
    setShapes([...shapes, o]);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setShapes(shapes.filter(s => s.id !== selectedId));
    setSelectedId(null);
  };

  const moveLayerUp = () => {
    if (!selectedId) return;
    const idx = shapes.findIndex(s => s.id === selectedId);
    if (idx < shapes.length - 1) {
      const newShapes = [...shapes];
      [newShapes[idx], newShapes[idx + 1]] = [newShapes[idx + 1], newShapes[idx]];
      setShapes(newShapes);
    }
  };

  const moveLayerDown = () => {
    if (!selectedId) return;
    const idx = shapes.findIndex(s => s.id === selectedId);
    if (idx > 0) {
      const newShapes = [...shapes];
      [newShapes[idx - 1], newShapes[idx]] = [newShapes[idx], newShapes[idx - 1]];
      setShapes(newShapes);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1e1e1e' }}>
      
      {/* UI */}
      <div style={{ padding: '10px', background: '#333', color: 'white', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <strong>Редактор ЛР 7</strong>
        <button onClick={addRect}>+ Прямоугольник</button>
        <button onClick={addOval}>+ Овал</button>
        
        <div style={{ borderLeft: '1px solid #555', height: '20px', margin: '0 10px' }} />
        
        <button onClick={deleteSelected} disabled={!selectedId}>Удалить</button>
        <button onClick={moveLayerUp} disabled={!selectedId}>Слой Выше ↑</button>
        <button onClick={moveLayerDown} disabled={!selectedId}>Слой Ниже ↓</button>
        
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#aaa' }}>
          {selectedId ? `Выбран: ${selectedId}` : 'Ничего не выбрано'}
        </span>
      </div>

      {/* Рабочая область */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas 
          ref={canvasRef} 
          style={{ width: "100%", height: "100%", display: "block", cursor: interact.current.mode === 'idle' ? 'default' : 'grabbing' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    </div>
  );
}