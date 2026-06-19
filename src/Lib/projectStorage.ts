import { writeTextFile, readTextFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { Shape } from './shapes/Shape';
import { Rect, Oval, Line } from './shapes/Primitives';

// Функция восстановления фигуры из JSON объекта
export function shapeFromJSON(data: any): Shape | null {
    let shape: Shape;
    // Определяем класс по типу
    switch (data.type) {
        case 'rect': shape = new Rect(data.w, data.h); break;
        case 'oval': shape = new Oval(data.rx, data.ry); break;
        case 'line': shape = new Line(data.dx, data.dy); break;
        default: return null; // Неизвестная фигура
    }

    // Восстанавливаем базовые свойства
    shape.id = data.id;
    shape.x = data.x;
    shape.y = data.y;
    shape.rotation = data.rotation;
    shape.scaleX = data.scaleX;
    shape.scaleY = data.scaleY;
    shape.fillStyle = data.fillStyle;

    return shape;
}

export async function saveProject(projectId: string, shapes: Shape[]) {
    try {
        // Проверяем, есть ли папка VectorEngine в Документах, если нет - создаем
        const dirExists = await exists('VectorEngine', { baseDir: BaseDirectory.Document });
        if (!dirExists) {
            await mkdir('VectorEngine', { baseDir: BaseDirectory.Document });
        }

        // Собираем данные
        const projectData = {
            id: projectId,
            date: new Date().toISOString(),
            shapes: shapes.map(s => s.toJSON()) // Сериализуем все фигуры
        };

        // Записываем файл
        await writeTextFile(`VectorEngine/${projectId}.json`, JSON.stringify(projectData), { baseDir: BaseDirectory.Document });
        console.log("Сохранено!");
    } catch (e) {
        console.error("Ошибка сохранения:", e);
        alert("Ошибка сохранения проекта");
    }
}

export async function loadProject(projectId: string): Promise<Shape[]> {
    try {
        const fileExists = await exists(`VectorEngine/${projectId}.json`, { baseDir: BaseDirectory.Document });
        if (!fileExists) return []; // Возвращаем пустой массив, если проекта нет

        // Читаем текст
        const text = await readTextFile(`VectorEngine/${projectId}.json`, { baseDir: BaseDirectory.Document });
        const projectData = JSON.parse(text);

        // Превращаем текст обратно в классы
        const loadedShapes: Shape[] = [];
        for (const sData of projectData.shapes) {
            const shape = shapeFromJSON(sData);
            if (shape) loadedShapes.push(shape);
        }

        return loadedShapes;
    } catch (e) {
        console.error("Ошибка загрузки:", e);
        return [];
    }
}