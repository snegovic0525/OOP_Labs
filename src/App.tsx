import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Импортируем созданные экраны
import Gallery from "./screens/Gallery";
import Editor from "./screens/Editor";

export default function App() {
  return (
    <BrowserRouter>
      {/* Темный фон для всего приложения */}
      <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-500/30">
        
        {/* Навигация (Header), которая видна только в Галерее */}
        <nav className="border-b border-slate-800 bg-slate-950 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">V</div>
            <span className="text-xl font-bold tracking-tight">VectorEngine</span>
          </div>
        </nav>

        {/* AnimatePresence нужен для отыгрывания анимации ПЕРЕД удалением компонента (стр. 15) */}
        <AnimatePresence mode="wait">
          {/* Routes - контейнер для наших путей */}
          <Routes>
            {/* Связываем пути с компонентами */}
            <Route path="/" element={<Gallery />} />
            <Route path="/editor/:id" element={<Editor />} />
          </Routes>
        </AnimatePresence>

      </div>
    </BrowserRouter>
  );
}