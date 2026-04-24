import { DataSource } from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { Tramo } from 'src/tramos/entities/tramo.entity';

// Las 7 categorías son transversales a todos los tramos.
// Cada tramo tiene su propia instancia de cada categoría.

const CATEGORY_TEMPLATES = [
  {
    sortOrder: 1,
    name: 'Equipo emprendedor',
    description: 'Capacidad del equipo para ejecutar, adaptarse y sostener presión',
    executionWindowDays: 10,
  },
  {
    sortOrder: 2,
    name: 'Potencial del problema',
    description: 'Relevancia, urgencia y validación del problema en el mercado',
    executionWindowDays: 10,
  },
  {
    sortOrder: 3,
    name: 'Modelo de negocio',
    description: 'Coherencia y sostenibilidad del modelo de generación de valor',
    executionWindowDays: 10,
  },
  {
    sortOrder: 4,
    name: 'Finanzas',
    description: 'Estructura financiera y necesidades de capital',
    executionWindowDays: 10,
  },
  {
    sortOrder: 5,
    name: 'Timing y estrategia',
    description: 'Momento de mercado y posicionamiento estratégico',
    executionWindowDays: 10,
  },
  {
    sortOrder: 6,
    name: 'Factores exógenos',
    description: 'Condiciones externas que afectan la viabilidad del proyecto',
    executionWindowDays: 10,
  },
  {
    sortOrder: 7,
    name: 'Métricas y tracción',
    description: 'Indicadores reales de uso, crecimiento y validación',
    executionWindowDays: 10,
  },
];

export async function seedCategories(dataSource: DataSource, tramos: Tramo[]) {
  const repo = dataSource.getRepository(Category);

  const categoriesData: Partial<Category>[] = [];

  for (const tramo of tramos) {

    const tramoIndex = parseInt(tramo.code.replace('T', ''), 10);

    for (const template of CATEGORY_TEMPLATES) {
      categoriesData.push({
        tramoId:           tramo.id,
        code:              `CAT_${tramoIndex}_${template.sortOrder}`,
        name:              template.name,
        description:       template.description,
        sortOrder:         template.sortOrder,
        executionWindowDays: template.executionWindowDays,
        isActive:          true,
      });
    }
  }

  const categories = repo.create(categoriesData);
  const saved = await repo.save(categories);
  console.log('✅ Categories creadas:', saved.length); 
  return saved;
}