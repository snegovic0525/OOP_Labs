import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion"; // Для анимаций
import { FolderPlus } from "lucide-react"; // Иконка

// Описываем, как выглядит проект (TypeScript)
type Project = {
  id: string;
  name: string;
  date: string;
};
// что такое айди нэйм и дата,зачем мы их создаем, как они потом будут использоваться.

export default function Gallery() {
  // Состояние: массив проектов
  const [projects, setProjects] = useState<Project[]>([]);

  // Функция добавления проекта
  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(), // Генерируем уникальный ID
      name: `Проект №${projects.length + 1}`,
      date: new Date().toLocaleDateString(),
    };
    // Добавляем новый проект к старым
    setProjects([...projects, newProject]);
  };

  return (
    // motion.div для плавного появления всего экрана (Fade-in)
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="p-8"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Мои проекты</h1>
        <button 
          onClick={addProject}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FolderPlus size={20} />
          Создать проект
        </button>
      </div>

      {/* Сетка карточек (Tailwind Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <p className="text-slate-400">У вас пока нет проектов. Создайте первый!</p>
        ) : (
          projects.map((project) => (
            // Карточка-ссылка, ведущая в редактор
            <Link key={project.id} to={`/editor/${project.id}`}>
              {/* motion.article для анимации при наведении (whileHover) */}
              <motion.article 
                whileHover={{ y: -5, scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
                className="bg-slate-800 p-6 rounded-xl border border-slate-700 cursor-pointer group"
              >
                <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                  {project.name}
                </h2>
                <p className="text-slate-400 text-sm">Создан: {project.date}</p>
                <p className="text-slate-500 mt-4 text-xs">ID: {project.id}</p>
              </motion.article>
            </Link>
          ))
        )}
      </div>
    </motion.div>
  );
}