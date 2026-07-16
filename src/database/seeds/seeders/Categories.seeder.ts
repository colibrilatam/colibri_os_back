import { DataSource } from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { Tramo } from 'src/tramos/entities/tramo.entity';

// Las 7 categorías son transversales a todos los tramos.
// Cada tramo tiene su propia instancia de cada categoría.

const CATEGORY_TEMPLATES = [
  {
    sortOrder: 1,
    name_es: 'Equipo emprendedor',
    name_en: 'Founding team',
    description_es: 'Capacidad del equipo para ejecutar, adaptarse y sostener presión',
    description_en: 'Team capacity to execute, adapt and withstand pressure',
    executionWindowDays: 10,
  },
  {
    sortOrder: 2,
    name_es: 'Potencial del problema',
    name_en: 'Problem potential',
    description_es: 'Relevancia, urgencia y validación del problema en el mercado',
    description_en: 'Relevance, urgency and validation of the problem in the market',
    executionWindowDays: 10,
  },
  {
    sortOrder: 3,
    name_es: 'Modelo de negocio',
    name_en: 'Business model',
    description_es: 'Coherencia y sostenibilidad del modelo de generación de valor',
    description_en: 'Coherence and sustainability of the value generation model',
    executionWindowDays: 10,
  },
  {
    sortOrder: 4,
    name_es: 'Finanzas',
    name_en: 'Finance',
    description_es: 'Estructura financiera y necesidades de capital',
    description_en: 'Financial structure and capital needs',
    executionWindowDays: 10,
  },
  {
    sortOrder: 5,
    name_es: 'Timing y estrategia',
    name_en: 'Timing and strategy',
    description_es: 'Momento de mercado y posicionamiento estratégico',
    description_en: 'Market timing and strategic positioning',
    executionWindowDays: 10,
  },
  {
    sortOrder: 6,
    name_es: 'Factores exógenos',
    name_en: 'Exogenous factors',
    description_es: 'Condiciones externas que afectan la viabilidad del proyecto',
    description_en: 'External conditions affecting project viability',
    executionWindowDays: 10,
  },
  {
    sortOrder: 7,
    name_es: 'Métricas y tracción',
    name_en: 'Metrics and traction',
    description_es: 'Indicadores reales de uso, crecimiento y validación',
    description_en: 'Real indicators of usage, growth and validation',
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
        tramoId: tramo.id,
        code: `CAT_${tramoIndex}_${template.sortOrder}`,
        name_es: template.name_es,
        name_en: template.name_en,
        description_es: template.description_es,
        description_en: template.description_en,
        sortOrder: template.sortOrder,
        executionWindowDays: template.executionWindowDays,
        isActive: true,
      });
    }
  }

  const categories = repo.create(categoriesData);
  const saved = await repo.save(categories);
  console.log('✅ Categories creadas:', saved.length);
  return saved;
}