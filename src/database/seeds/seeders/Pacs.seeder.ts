import { DataSource } from 'typeorm';
import { Pac } from 'src/pacs/entities/pac.entity';
import { Category } from 'src/categories/entities/category.entity';

const PAC_TEMPLATES = {
  1: {
    1: { title_es: 'Conformar el equipo fundador',             title_en: 'Form the founding team',                        objectiveLine_es: 'Definir roles y compromisos iniciales del equipo', objectiveLine_en: 'Define initial team roles and commitments' },
    2: { title_es: 'Identificar el problema central',          title_en: 'Identify the core problem',                     objectiveLine_es: 'Detectar necesidades reales del usuario mediante contacto directo', objectiveLine_en: 'Detect real user needs through direct contact' },
    3: { title_es: 'Definir propuesta de valor inicial',       title_en: 'Define the initial value proposition',          objectiveLine_es: 'Articular qué valor ofrece el proyecto y a quién', objectiveLine_en: 'Articulate what value the project offers and to whom' },
    4: { title_es: 'Estimar necesidades de capital iniciales', title_en: 'Estimate initial capital needs',                objectiveLine_es: 'Mapear los primeros costos y recursos mínimos necesarios', objectiveLine_en: 'Map the first costs and minimum required resources' },
    5: { title_es: 'Explorar el contexto de mercado',          title_en: 'Explore the market context',                    objectiveLine_es: 'Identificar señales del entorno que validen la oportunidad', objectiveLine_en: 'Identify environmental signals that validate the opportunity' },
    6: { title_es: 'Identificar restricciones del entorno',    title_en: 'Identify environmental constraints',            objectiveLine_es: 'Detectar condiciones externas que puedan afectar el arranque', objectiveLine_en: 'Detect external conditions that could affect the launch' },
    7: { title_es: 'Definir métricas de arranque',             title_en: 'Define launch metrics',                         objectiveLine_es: 'Establecer los primeros indicadores de progreso del proyecto', objectiveLine_en: "Establish the project's first progress indicators" },
  },
  2: {
    1: { title_es: 'Validar dinámica del equipo',              title_en: 'Validate team dynamics',                        objectiveLine_es: 'Contrastar roles asumidos con capacidad real de ejecución', objectiveLine_en: 'Compare assumed roles against real execution capacity' },
    2: { title_es: 'Validar hipótesis del problema',           title_en: 'Validate the problem hypothesis',               objectiveLine_es: 'Contrastar si el problema es relevante y recurrente', objectiveLine_en: 'Test whether the problem is relevant and recurring' },
    3: { title_es: 'Testear propuesta de valor con usuarios',  title_en: 'Test the value proposition with users',         objectiveLine_es: 'Obtener reacción espontánea del segmento objetivo', objectiveLine_en: 'Obtain spontaneous reaction from the target segment' },
    4: { title_es: 'Validar supuestos financieros básicos',    title_en: 'Validate basic financial assumptions',          objectiveLine_es: 'Confirmar si los costos estimados son reales', objectiveLine_en: 'Confirm whether estimated costs are real' },
    5: { title_es: 'Evaluar momento de entrada al mercado',    title_en: 'Evaluate market entry timing',                  objectiveLine_es: 'Analizar si el timing es adecuado para la solución', objectiveLine_en: 'Analyze whether the timing is right for the solution' },
    6: { title_es: 'Mapear riesgos externos iniciales',        title_en: 'Map initial external risks',                    objectiveLine_es: 'Identificar regulaciones o dependencias que afecten la validación', objectiveLine_en: 'Identify regulations or dependencies affecting validation' },
    7: { title_es: 'Medir primeras señales de interés',        title_en: 'Measure first signals of interest',             objectiveLine_es: 'Obtener datos iniciales de adopción o intención de uso', objectiveLine_en: 'Obtain initial data on adoption or intent to use' },
  },
  3: {
    1: { title_es: 'Evaluar capacidad operativa del equipo',   title_en: "Evaluate the team's operational capacity",      objectiveLine_es: 'Validar ejecución bajo presión real', objectiveLine_en: 'Validate execution under real pressure' },
    2: { title_es: 'Validar profundidad del problema',         title_en: 'Validate the depth of the problem',             objectiveLine_es: 'Confirmar urgencia y recurrencia del problema', objectiveLine_en: 'Confirm the urgency and recurrence of the problem' },
    3: { title_es: 'Testear modelo de negocio',                title_en: 'Test the business model',                       objectiveLine_es: 'Validar coherencia entre valor y captura', objectiveLine_en: 'Validate coherence between value and capture' },
    4: { title_es: 'Estructurar necesidades financieras',      title_en: 'Structure financial needs',                     objectiveLine_es: 'Alinear capital con complejidad real del prototipo', objectiveLine_en: "Align capital with the prototype's real complexity" },
    5: { title_es: 'Analizar timing de mercado',               title_en: 'Analyze market timing',                         objectiveLine_es: 'Evaluar ventana de oportunidad para el lanzamiento', objectiveLine_en: 'Evaluate the window of opportunity for launch' },
    6: { title_es: 'Evaluar entorno externo',                  title_en: 'Evaluate the external environment',             objectiveLine_es: 'Identificar riesgos regulatorios y contextuales', objectiveLine_en: 'Identify regulatory and contextual risks' },
    7: { title_es: 'Medir tracción inicial',                   title_en: 'Measure initial traction',                      objectiveLine_es: 'Obtener señales reales de uso y crecimiento', objectiveLine_en: 'Obtain real signals of usage and growth' },
  },
  4: {
    1: { title_es: 'Consolidar estructura del equipo',         title_en: 'Consolidate the team structure',                objectiveLine_es: 'Formalizar roles y procesos de operación recurrente', objectiveLine_en: 'Formalize roles and recurring operating processes' },
    2: { title_es: 'Confirmar problem-solution fit',           title_en: 'Confirm problem-solution fit',                  objectiveLine_es: 'Verificar que el problema sigue siendo relevante en escala', objectiveLine_en: 'Verify the problem remains relevant at scale' },
    3: { title_es: 'Optimizar modelo de monetización',         title_en: 'Optimize the monetization model',               objectiveLine_es: 'Validar el mecanismo de captura de valor con usuarios pagadores', objectiveLine_en: 'Validate the value capture mechanism with paying users' },
    4: { title_es: 'Proyectar runway y necesidades de escala', title_en: 'Project runway and scaling needs',              objectiveLine_es: 'Estimar cuánto capital se necesita para sostener la tracción', objectiveLine_en: 'Estimate how much capital is needed to sustain traction' },
    5: { title_es: 'Evaluar posicionamiento competitivo',      title_en: 'Evaluate competitive positioning',              objectiveLine_es: 'Identificar diferencial sostenible frente a alternativas existentes', objectiveLine_en: 'Identify a sustainable edge over existing alternatives' },
    6: { title_es: 'Monitorear riesgos externos activos',      title_en: 'Monitor active external risks',                 objectiveLine_es: 'Revisar cambios regulatorios o de contexto que afecten la operación', objectiveLine_en: 'Review regulatory or contextual changes affecting operations' },
    7: { title_es: 'Medir retención y crecimiento',            title_en: 'Measure retention and growth',                  objectiveLine_es: 'Analizar métricas de retención, referidos y expansión de uso', objectiveLine_en: 'Analyze retention, referral and usage expansion metrics' },
  },
  5: {
    1: { title_es: 'Fortalecer liderazgo y cultura organizacional',      title_en: 'Strengthen leadership and organizational culture',   objectiveLine_es: 'Consolidar una cultura operativa que sostenga el crecimiento', objectiveLine_en: 'Consolidate an operating culture that sustains growth' },
    2: { title_es: 'Expandir validación a nuevos segmentos',             title_en: 'Expand validation to new segments',                   objectiveLine_es: 'Explorar si el problema tiene alcance en mercados adyacentes', objectiveLine_en: 'Explore whether the problem reaches adjacent markets' },
    3: { title_es: 'Escalar el modelo de negocio',                       title_en: 'Scale the business model',                            objectiveLine_es: 'Replicar el modelo con eficiencia operativa sostenida', objectiveLine_en: 'Replicate the model with sustained operational efficiency' },
    4: { title_es: 'Gestionar estructura financiera de crecimiento',     title_en: 'Manage growth financial structure',                   objectiveLine_es: 'Alinear ingresos, costos y capital para sostener la escala', objectiveLine_en: 'Align revenue, costs and capital to sustain scale' },
    5: { title_es: 'Definir estrategia de expansión',                    title_en: 'Define expansion strategy',                           objectiveLine_es: 'Trazar el plan de entrada a nuevos mercados o verticales', objectiveLine_en: 'Chart the entry plan for new markets or verticals' },
    6: { title_es: 'Gestionar alianzas y dependencias externas',         title_en: 'Manage external alliances and dependencies',          objectiveLine_es: 'Formalizar relaciones con actores clave del ecosistema', objectiveLine_en: 'Formalize relationships with key ecosystem actors' },
    7: { title_es: 'Consolidar métricas de producto y negocio',          title_en: 'Consolidate product and business metrics',            objectiveLine_es: 'Establecer un dashboard de métricas operativas y de impacto', objectiveLine_en: 'Establish a dashboard of operational and impact metrics' },
  },
  6: {
    1: { title_es: 'Desarrollar liderazgo de ecosistema',           title_en: 'Develop ecosystem leadership',                  objectiveLine_es: 'Posicionar al equipo como referente en su industria', objectiveLine_en: 'Position the team as a benchmark in its industry' },
    2: { title_es: 'Medir impacto del problema resuelto',           title_en: 'Measure the impact of the solved problem',      objectiveLine_es: 'Documentar y comunicar el cambio generado en usuarios y mercado', objectiveLine_en: 'Document and communicate the change generated in users and market' },
    3: { title_es: 'Evolucionar el modelo hacia impacto sistémico', title_en: 'Evolve the model toward systemic impact',       objectiveLine_es: 'Adaptar el modelo de negocio para generar valor a escala social', objectiveLine_en: 'Adapt the business model to generate value at social scale' },
    4: { title_es: 'Estructurar financiamiento de impacto',         title_en: 'Structure impact financing',                    objectiveLine_es: 'Explorar instrumentos financieros alineados con el impacto generado', objectiveLine_en: 'Explore financial instruments aligned with the impact generated' },
    5: { title_es: 'Liderar narrativa de mercado',                  title_en: 'Lead the market narrative',                     objectiveLine_es: 'Influir en la conversación del sector con datos y casos propios', objectiveLine_en: "Influence the sector's conversation with own data and cases" },
    6: { title_es: 'Gestionar externalidades del crecimiento',      title_en: 'Manage growth externalities',                   objectiveLine_es: 'Identificar y mitigar impactos negativos del crecimiento a escala', objectiveLine_en: 'Identify and mitigate negative impacts of growth at scale' },
    7: { title_es: 'Publicar métricas de impacto verificable',      title_en: 'Publish verifiable impact metrics',             objectiveLine_es: 'Documentar y difundir evidencia del impacto generado', objectiveLine_en: 'Document and disseminate evidence of the impact generated' },
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
      title_es:                   template.title_es,
      title_en:                   template.title_en,
      objectiveLine_es:           template.objectiveLine_es,
      objectiveLine_en:           template.objectiveLine_en,
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