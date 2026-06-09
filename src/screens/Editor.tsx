import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, MousePointer2, Square, Circle } from "lucide-react";

export default function Editor() {
  const { id } = useParams(); // Получаем ID из URL
  const navigate = useNavigate(); // Для кнопки "Назад"

  const goBack = () => navigate(-1); // Возврат на прошлую страницу

  return (
    // Главный контейнер на всю высоту экрана (h-screen)
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="h-screen flex flex-col bg-slate-900 text-white overflow-hidden"
    >
      {/* 1. Верхняя панель (Toolbar) */}
      <header className="h-14 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-medium">Редактирование проекта №{id}</span>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-colors">
          <Save size={18} />
          Сохранить
        </button>
      </header>

      {/* Центральная часть */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* 2. Левая панель (Инструменты) */}
        <aside className="w-16 border-r border-slate-700 bg-slate-800 flex flex-col items-center py-4 gap-4">
          <button className="p-3 bg-slate-700 text-blue-400 rounded-xl"><MousePointer2 size={24} /></button>
          <button className="p-3 hover:bg-slate-700 rounded-xl transition-colors"><Square size={24} /></button>
          <button className="p-3 hover:bg-slate-700 rounded-xl transition-colors"><Circle size={24} /></button>
        </aside>

        {/* 3. Центральная зона (Холст) */}
        <main className="flex-1 bg-slate-950 p-8 flex justify-center items-center overflow-auto">
          {/* Имитация белого листа бумаги */}
          <div className="w-[800px] h-[600px] bg-white rounded shadow-2xl">
             {/* Тут позже будет графика */}
          </div>
        </main>

        {/* 4. Правая панель (Свойства) */}
        <aside className="w-64 border-l border-slate-700 bg-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Свойства</h3>
          <div className="text-sm text-slate-300">
            Здесь будут настройки выделенного объекта...
          </div>
        </aside>

      </div>
    </motion.div>
  );
}