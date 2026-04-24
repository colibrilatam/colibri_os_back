import { DataSource } from 'typeorm';
import { Pac } from 'src/pacs/entities/pac.entity';
import { Category } from 'src/categories/entities/category.entity';

const PAC_TEMPLATES = {
  1: {
    1: { title: 'Conformar el equipo fundador',             objectiveLine: 'Definir roles y compromisos iniciales del equipo' },
    2: { title: 'Identificar el problema central',          objectiveLine: 'Detectar necesidades reales del usuario mediante contacto directo' },
    3: { title: 'Definir propuesta de valor inicial',       objectiveLine: 'Articular qué valor ofrece el proyecto y a quién' },
    4: { title: 'Estimar necesidades de capital iniciales', objectiveLine: 'Mapear los primeros costos y recursos mínimos necesarios' },
    5: { title: 'Explorar el contexto de mercado',          objectiveLine: 'Identificar señales del entorno que validen la oportunidad' },
    6: { title: 'Identificar restricciones del entorno',    objectiveLine: 'Detectar condiciones externas que puedan afectar el arranque' },
    7: { title: 'Definir métricas de arranque',             objectiveLine: 'Establecer los primeros indicadores de progreso del proyecto' },
  },
  2: {
    1: { title: 'Validar dinámica del equipo',              objectiveLine: 'Contrastar roles asumidos con capacidad real de ejecución' },
    2: { title: 'Validar hipótesis del problema',           objectiveLine: 'Contrastar si el problema es relevante y recurrente' },
    3: { title: 'Testear propuesta de valor con usuarios',  objectiveLine: 'Obtener reacción espontánea del segmento objetivo' },
    4: { title: 'Validar supuestos financieros básicos',    objectiveLine: 'Confirmar si los costos estimados son reales' },
    5: { title: 'Evaluar momento de entrada al mercado',    objectiveLine: 'Analizar si el timing es adecuado para la solución' },
    6: { title: 'Mapear riesgos externos iniciales',        objectiveLine: 'Identificar regulaciones o dependencias que afecten la validación' },
    7: { title: 'Medir primeras señales de interés',        objectiveLine: 'Obtener datos iniciales de adopción o intención de uso' },
  },
  3: {
    1: { title: 'Evaluar capacidad operativa del equipo',   objectiveLine: 'Validar ejecución bajo presión real' },
    2: { title: 'Validar profundidad del problema',         objectiveLine: 'Confirmar urgencia y recurrencia del problema' },
    3: { title: 'Testear modelo de negocio',                objectiveLine: 'Validar coherencia entre valor y captura' },
    4: { title: 'Estructurar necesidades financieras',      objectiveLine: 'Alinear capital con complejidad real del prototipo' },
    5: { title: 'Analizar timing de mercado',               objectiveLine: 'Evaluar ventana de oportunidad para el lanzamiento' },
    6: { title: 'Evaluar entorno externo',                  objectiveLine: 'Identificar riesgos regulatorios y contextuales' },
    7: { title: 'Medir tracción inicial',                   objectiveLine: 'Obtener señales reales de uso y crecimiento' },
  },
  4: {
    1: { title: 'Consolidar estructura del equipo',         objectiveLine: 'Formalizar roles y procesos de operación recurrente' },
    2: { title: 'Confirmar problem-solution fit',           objectiveLine: 'Verificar que el problema sigue siendo relevante en escala' },
    3: { title: 'Optimizar modelo de monetización',         objectiveLine: 'Validar el mecanismo de captura de valor con usuarios pagadores' },
    4: { title: 'Proyectar runway y necesidades de escala', objectiveLine: 'Estimar cuánto capital se necesita para sostener la tracción' },
    5: { title: 'Evaluar posicionamiento competitivo',      objectiveLine: 'Identificar diferencial sostenible frente a alternativas existentes' },
    6: { title: 'Monitorear riesgos externos activos',      objectiveLine: 'Revisar cambios regulatorios o de contexto que afecten la operación' },
    7: { title: 'Medir retención y crecimiento',            objectiveLine: 'Analizar métricas de retención, referidos y expansión de uso' },
  },
  5: {
    1: { title: 'Fortalecer liderazgo y cultura organizacional',      objectiveLine: 'Consolidar una cultura operativa que sostenga el crecimiento' },
    2: { title: 'Expandir validación a nuevos segmentos',             objectiveLine: 'Explorar si el problema tiene alcance en mercados adyacentes' },
    3: { title: 'Escalar el modelo de negocio',                       objectiveLine: 'Replicar el modelo con eficiencia operativa sostenida' },
    4: { title: 'Gestionar estructura financiera de crecimiento',     objectiveLine: 'Alinear ingresos, costos y capital para sostener la escala' },
    5: { title: 'Definir estrategia de expansión',                    objectiveLine: 'Trazar el plan de entrada a nuevos mercados o verticales' },
    6: { title: 'Gestionar alianzas y dependencias externas',         objectiveLine: 'Formalizar relaciones con actores clave del ecosistema' },
    7: { title: 'Consolidar métricas de producto y negocio',          objectiveLine: 'Establecer un dashboard de métricas operativas y de impacto' },
  },
  6: {
    1: { title: 'Desarrollar liderazgo de ecosistema',           objectiveLine: 'Posicionar al equipo como referente en su industria' },
    2: { title: 'Medir impacto del problema resuelto',           objectiveLine: 'Documentar y comunicar el cambio generado en usuarios y mercado' },
    3: { title: 'Evolucionar el modelo hacia impacto sistémico', objectiveLine: 'Adaptar el modelo de negocio para generar valor a escala social' },
    4: { title: 'Estructurar financiamiento de impacto',         objectiveLine: 'Explorar instrumentos financieros alineados con el impacto generado' },
    5: { title: 'Liderar narrativa de mercado',                  objectiveLine: 'Influir en la conversación del sector con datos y casos propios' },
    6: { title: 'Gestionar externalidades del crecimiento',      objectiveLine: 'Identificar y mitigar impactos negativos del crecimiento a escala' },
    7: { title: 'Publicar métricas de impacto verificable',      objectiveLine: 'Documentar y difundir evidencia del impacto generado' },
  },
};

const EXECUTION_WINDOW = 5;
const IC_WEIGHT        = 0.14; // 7 PACs por tramo → peso uniforme (~1/7)
const MIN_THRESHOLD    = 65.00;

export async function seedPacs(dataSource: DataSource, categories: Category[]) {
  const repo = dataSource.getRepository(Pac);

  const pacsData: Partial<Pac>[] = [];

  for (const category of categories) {
    // CAT_3_2 → tramoIndex=3, catIndex=2
    const [, tramoStr, catStr] = category.code.split('_');
    const tramoIndex = parseInt(tramoStr, 10);
    const catIndex   = parseInt(catStr,   10);

    const template = PAC_TEMPLATES[tramoIndex]?.[catIndex];
    if (!template) {
      console.warn(`⚠️  Sin template para ${category.code}, se omite`);
      continue;
    }

    pacsData.push({
      categoryId:                 category.id,
      code:                       `PAC_${tramoIndex}_${catIndex}_1`,
      title:                      template.title,
      objectiveLine:              template.objectiveLine,
      sortOrder:                  catIndex,
      executionWindowDays:        EXECUTION_WINDOW,
      minimumCompletionThreshold: MIN_THRESHOLD,
      icWeight:                   IC_WEIGHT,
      closureRule:                `Completar las 3 micro acciones requeridas del PAC_${tramoIndex}_${catIndex}_1.`,
      templateVersion:            'v1.0',
      isActive:                   true,
    });
  }

  const pacs = repo.create(pacsData);
  const saved = await repo.save(pacs);
  console.log('✅ PACs creados:', saved.length); 
  return saved;
}