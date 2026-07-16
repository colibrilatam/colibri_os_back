import { DataSource } from 'typeorm';
import {
  MicroActionDefinition,
  MicroActionType,
  EvidenceType,
} from 'src/micro-action-definitions/entities/micro-action-definition.entity';
import { Pac } from 'src/pacs/entities/pac.entity';

type MadTemplate = {
  instruction_es: string;
  instruction_en: string;
  microActionType: MicroActionType;
  isRequired: boolean;
  isReusable?: boolean;
  evidenceRequired: boolean;
  expectedEvidenceType: EvidenceType | undefined;
};

// 7 categorías × 6 tramos × 3 micro acciones = 126
const MAD_TEMPLATES: Record<number, Record<number, MadTemplate[]>> = {

  // ── CAT 1 — Equipo emprendedor ─────────────────────────────────────────────
  1: {
    1: [
      { instruction_es: 'Listar los integrantes del equipo y su rol principal', instruction_en: 'List team members and their primary role', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Definir compromisos semanales de dedicación por integrante', instruction_en: 'Define weekly dedication commitments per team member', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar habilidades faltantes en el equipo actual', instruction_en: 'Identify missing skills in the current team', microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    2: [
      { instruction_es: 'Mapear roles reales ejecutados en la última semana', instruction_en: 'Map actual roles executed in the last week', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Registrar conflicto operativo reciente y su resolución', instruction_en: 'Record a recent operational conflict and its resolution', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Evaluar desempeño individual mediante autoevaluación', instruction_en: 'Evaluate individual performance through self-assessment', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
    ],
    3: [
      { instruction_es: 'Mapear roles reales ejecutados en la última semana', instruction_en: 'Map actual roles executed in the last week', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Registrar conflicto operativo reciente y resolución', instruction_en: 'Record a recent operational conflict and resolution', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Evaluar desempeño individual del equipo',             instruction_en: "Evaluate the team's individual performance", microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
    ],
    4: [
      { instruction_es: 'Documentar estructura de roles y responsabilidades formales', instruction_en: 'Document the structure of formal roles and responsibilities', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Registrar métricas de productividad del equipo',              instruction_en: 'Record team productivity metrics', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar necesidades de incorporación o reemplazo',        instruction_en: 'Identify hiring or replacement needs', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    5: [
      { instruction_es: 'Documentar estructura organizacional vigente',    instruction_en: 'Document the current organizational structure', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Evaluar clima interno y motivación del equipo',   instruction_en: 'Evaluate internal climate and team motivation', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Definir plan de incorporación de talento clave',  instruction_en: 'Define a plan for onboarding key talent', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    6: [
      { instruction_es: 'Documentar cultura organizacional y valores operativos',   instruction_en: 'Document organizational culture and operating values', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Evaluar liderazgo del equipo en el ecosistema',            instruction_en: "Evaluate the team's leadership within the ecosystem", microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar mentores o asesores estratégicos incorporados', instruction_en: 'Identify mentors or strategic advisors brought on board', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
  },

  // ── CAT 2 — Potencial del problema ────────────────────────────────────────
  2: {
    1: [
      { instruction_es: 'Realizar 3 entrevistas de descubrimiento con usuarios potenciales', instruction_en: 'Conduct 3 discovery interviews with potential users', microActionType: MicroActionType.INTERVIEW,      isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Documentar el problema central en una frase clara',                 instruction_en: 'Document the core problem in a clear sentence', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar quién sufre más el problema y con qué frecuencia',      instruction_en: 'Identify who suffers the problem most and how often', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    2: [
      { instruction_es: 'Recolectar feedback de usuarios reales sobre el problema', instruction_en: 'Collect feedback from real users about the problem', microActionType: MicroActionType.INTERVIEW,      isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Identificar patrón común en problemas reportados',         instruction_en: 'Identify a common pattern in reported problems', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: true,  evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Validar urgencia del problema con usuarios',               instruction_en: 'Validate the urgency of the problem with users', microActionType: MicroActionType.VALIDATION,     isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    3: [
      { instruction_es: 'Recolectar feedback de usuarios reales sobre el problema', instruction_en: 'Collect feedback from real users about the problem', microActionType: MicroActionType.INTERVIEW,      isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Identificar patrón común en problemas reportados',         instruction_en: 'Identify a common pattern in reported problems', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: true,  evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Validar urgencia del problema con usuarios',               instruction_en: 'Validate the urgency of the problem with users', microActionType: MicroActionType.VALIDATION,     isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    4: [
      { instruction_es: 'Documentar evolución del problema desde T1 a la fecha',  instruction_en: 'Document the evolution of the problem from T1 to date', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Confirmar que el problema persiste en el segmento objetivo', instruction_en: 'Confirm the problem persists in the target segment', microActionType: MicroActionType.VALIDATION,  isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar nuevos sub-segmentos con el mismo problema',  instruction_en: 'Identify new sub-segments with the same problem', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    5: [
      { instruction_es: 'Evaluar si el problema escala a nuevos segmentos',         instruction_en: 'Evaluate whether the problem scales to new segments', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Documentar casos de uso emergentes no previstos',          instruction_en: 'Document emerging use cases not previously anticipated', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Validar relevancia del problema en mercados adyacentes',   instruction_en: 'Validate the relevance of the problem in adjacent markets', microActionType: MicroActionType.VALIDATION,     isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    6: [
      { instruction_es: 'Documentar el impacto medible generado en el problema',   instruction_en: 'Document the measurable impact generated on the problem', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Publicar caso de éxito con datos verificables',           instruction_en: 'Publish a success case with verifiable data', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
      { instruction_es: 'Evaluar replicabilidad de la solución en otros contextos', instruction_en: 'Evaluate the replicability of the solution in other contexts', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
  },

  // ── CAT 3 — Modelo de negocio ──────────────────────────────────────────────
  3: {
    1: [
      { instruction_es: 'Describir cómo el proyecto generará valor para el usuario', instruction_en: 'Describe how the project will generate value for the user', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar al menos un mecanismo de captura de valor',     instruction_en: 'Identify at least one value capture mechanism', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Comparar con modelos de negocio de referencia en la industria', instruction_en: 'Compare against reference business models in the industry', microActionType: MicroActionType.RESEARCH,  isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    2: [
      { instruction_es: 'Describir el modelo de negocio usando el canvas',       instruction_en: 'Describe the business model using the canvas', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Testear disposición a pago con usuarios potenciales',   instruction_en: 'Test willingness to pay with potential users', microActionType: MicroActionType.VALIDATION,     isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar el principal supuesto de captura de valor', instruction_en: 'Identify the main value capture assumption', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    3: [
      { instruction_es: 'Definir propuesta de valor actual',   instruction_en: 'Define the current value proposition', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Testear disposición a pago',          instruction_en: 'Test willingness to pay', microActionType: MicroActionType.VALIDATION,     isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
      { instruction_es: 'Comparar alternativas existentes',    instruction_en: 'Compare existing alternatives', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    4: [
      { instruction_es: 'Documentar ingresos reales del último mes',         instruction_en: 'Document actual revenue from the last month', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Validar precio con usuarios pagadores activos',      instruction_en: 'Validate pricing with active paying users', microActionType: MicroActionType.VALIDATION,     isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar oportunidad de expansión del modelo',    instruction_en: 'Identify an opportunity to expand the model', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    5: [
      { instruction_es: 'Documentar modelo de negocio escalado y sus variantes', instruction_en: 'Document the scaled business model and its variants', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Evaluar eficiencia operativa del modelo actual',        instruction_en: 'Evaluate the operational efficiency of the current model', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar nuevas fuentes de ingreso potenciales',     instruction_en: 'Identify potential new revenue sources', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    6: [
      { instruction_es: 'Documentar impacto sistémico del modelo de negocio',     instruction_en: 'Document the systemic impact of the business model', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Evaluar sostenibilidad del modelo a 5 años',             instruction_en: "Evaluate the model's sustainability over 5 years", microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar modelos de financiamiento de impacto',       instruction_en: 'Identify impact financing models', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
    ],
  },

  // ── CAT 4 — Finanzas ──────────────────────────────────────────────────────
  4: {
    1: [
      { instruction_es: 'Listar los costos mínimos para operar el proyecto', instruction_en: 'List the minimum costs to operate the project', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Estimar recursos propios disponibles',               instruction_en: 'Estimate available own resources', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar necesidad de financiamiento externo',    instruction_en: 'Identify the need for external financing', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    2: [
      { instruction_es: 'Listar costos actuales del prototipo',   instruction_en: 'List current prototype costs', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Estimar runway financiero',              instruction_en: 'Estimate financial runway', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar necesidades de inversión',   instruction_en: 'Identify investment needs', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    3: [
      { instruction_es: 'Listar costos actuales del prototipo',   instruction_en: 'List current prototype costs', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Estimar runway financiero',              instruction_en: 'Estimate financial runway', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar necesidades de inversión',   instruction_en: 'Identify investment needs', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    4: [
      { instruction_es: 'Documentar ingresos y egresos del último mes',    instruction_en: 'Document income and expenses from the last month', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Proyectar flujo de caja a 3 meses',               instruction_en: 'Project cash flow for 3 months', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Identificar fuentes de financiamiento exploradas', instruction_en: 'Identify financing sources explored', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    5: [
      { instruction_es: 'Documentar estructura financiera actual de la empresa', instruction_en: "Document the company's current financial structure", microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Proyectar necesidades de capital para escalar',          instruction_en: 'Project capital needs to scale', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Identificar instrumentos financieros disponibles',       instruction_en: 'Identify available financial instruments', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
    ],
    6: [
      { instruction_es: 'Documentar estructura de financiamiento de impacto',  instruction_en: 'Document the impact financing structure', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Evaluar sostenibilidad financiera a largo plazo',      instruction_en: 'Evaluate long-term financial sustainability', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar inversores de impacto potenciales',        instruction_en: 'Identify potential impact investors', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
    ],
  },

  // ── CAT 5 — Timing y estrategia ───────────────────────────────────────────
  5: {
    1: [
      { instruction_es: 'Identificar 3 tendencias relevantes en la industria',   instruction_en: 'Identify 3 relevant trends in the industry', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Describir por qué este es el momento para el proyecto', instruction_en: 'Describe why now is the right time for the project', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar 2 competidores o alternativas existentes',  instruction_en: 'Identify 2 existing competitors or alternatives', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    2: [
      { instruction_es: 'Analizar tendencias del mercado con fuentes actuales',  instruction_en: 'Analyze market trends using current sources', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
      { instruction_es: 'Evaluar competidores actuales y su evolución',          instruction_en: 'Evaluate current competitors and their evolution', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Definir ventana de oportunidad',                        instruction_en: 'Define the window of opportunity', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    3: [
      { instruction_es: 'Analizar tendencias del mercado',   instruction_en: 'Analyze market trends', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
      { instruction_es: 'Evaluar competidores actuales',     instruction_en: 'Evaluate current competitors', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Definir ventana de oportunidad',   instruction_en: 'Define the window of opportunity', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    4: [
      { instruction_es: 'Documentar posicionamiento competitivo actual',          instruction_en: 'Document current competitive positioning', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Evaluar barreras de entrada para nuevos competidores',   instruction_en: 'Evaluate entry barriers for new competitors', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar alianzas estratégicas que refuercen el timing', instruction_en: 'Identify strategic alliances that reinforce timing', microActionType: MicroActionType.OTHER,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    5: [
      { instruction_es: 'Documentar estrategia de expansión a nuevos mercados', instruction_en: 'Document the strategy for expansion into new markets', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Evaluar riesgos estratégicos de la expansión',          instruction_en: 'Evaluate strategic risks of the expansion', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar aliados estratégicos clave para la expansión', instruction_en: 'Identify key strategic allies for the expansion', microActionType: MicroActionType.OTHER,        isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    6: [
      { instruction_es: 'Documentar narrativa pública del proyecto',                instruction_en: "Document the project's public narrative", microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Evaluar influencia del proyecto en la conversación del sector', instruction_en: "Evaluate the project's influence on industry conversation", microActionType: MicroActionType.OTHER,    isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
      { instruction_es: 'Identificar oportunidades de liderazgo de pensamiento',    instruction_en: 'Identify thought leadership opportunities', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
  },

  // ── CAT 6 — Factores exógenos ─────────────────────────────────────────────
  6: {
    1: [
      { instruction_es: 'Identificar regulaciones que apliquen al proyecto',       instruction_en: 'Identify regulations that apply to the project', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Mapear actores externos clave (gobierno, gremios, etc.)', instruction_en: 'Map key external actors (government, associations, etc.)', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Evaluar impacto del contexto económico en el arranque',   instruction_en: 'Evaluate the impact of the economic context on the launch', microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: false, expectedEvidenceType: undefined },
    ],
    2: [
      { instruction_es: 'Identificar regulaciones relevantes para la solución', instruction_en: 'Identify regulations relevant to the solution', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Evaluar dependencias externas del prototipo',           instruction_en: 'Evaluate external dependencies of the prototype', microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: false, expectedEvidenceType: undefined },
      { instruction_es: 'Mapear riesgos externos críticos para la validación',   instruction_en: 'Map critical external risks for validation', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    3: [
      { instruction_es: 'Identificar regulaciones relevantes',   instruction_en: 'Identify relevant regulations', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Evaluar dependencias externas',         instruction_en: 'Evaluate external dependencies', microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: false, expectedEvidenceType: undefined },
      { instruction_es: 'Mapear riesgos externos críticos',      instruction_en: 'Map critical external risks', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    4: [
      { instruction_es: 'Monitorear cambios regulatorios del último mes',          instruction_en: 'Monitor regulatory changes from the last month', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
      { instruction_es: 'Evaluar impacto de cambios de contexto en la operación',  instruction_en: 'Evaluate the impact of contextual changes on operations', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Actualizar mapa de riesgos externos',                     instruction_en: 'Update the external risk map', microActionType: MicroActionType.DOCUMENTATION, isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
    ],
    5: [
      { instruction_es: 'Documentar alianzas con actores externos clave',          instruction_en: 'Document alliances with key external actors', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Evaluar cambios regulatorios que afecten la expansión',   instruction_en: 'Evaluate regulatory changes affecting expansion', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar oportunidades generadas por el contexto',     instruction_en: 'Identify opportunities generated by context', microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    6: [
      { instruction_es: 'Documentar externalidades del crecimiento identificadas', instruction_en: 'Document identified externalities of growth', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Evaluar impacto regulatorio a escala sistémica',          instruction_en: 'Evaluate regulatory impact at systemic scale', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Proponer acciones para mitigar impactos negativos',       instruction_en: 'Propose actions to mitigate negative impacts', microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
  },

  // ── CAT 7 — Métricas y tracción ───────────────────────────────────────────
  7: {
    1: [
      { instruction_es: 'Definir 3 métricas clave que medirán el progreso inicial', instruction_en: 'Define 3 key metrics to measure initial progress', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Establecer un método simple de seguimiento semanal',       instruction_en: 'Establish a simple weekly tracking method', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Registrar estado actual de las métricas como baseline',    instruction_en: 'Record the current state of metrics as a baseline', microActionType: MicroActionType.DOCUMENTATION, isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
    ],
    2: [
      { instruction_es: 'Registrar primeras señales de uso o interés del producto', instruction_en: 'Record first signals of product usage or interest', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Analizar frecuencia de uso entre primeros usuarios',       instruction_en: 'Analyze usage frequency among early users', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Documentar aprendizajes derivados de las métricas',        instruction_en: 'Document learnings derived from the metrics', microActionType: MicroActionType.DOCUMENTATION, isRequired: false, isReusable: true,  evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    3: [
      { instruction_es: 'Medir usuarios activos del prototipo',    instruction_en: 'Measure active users of the prototype', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Analizar retención de usuarios',          instruction_en: 'Analyze user retention', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Documentar crecimiento semanal',          instruction_en: 'Document weekly growth', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
    ],
    4: [
      { instruction_es: 'Documentar métricas de retención del último mes', instruction_en: 'Document retention metrics from the last month', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Analizar fuentes de crecimiento orgánico',         instruction_en: 'Analyze sources of organic growth', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction_es: 'Identificar métricas que predigan churn',          instruction_en: 'Identify metrics that predict churn', microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    5: [
      { instruction_es: 'Documentar dashboard de métricas operativas y de producto', instruction_en: 'Document a dashboard of operational and product metrics', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Evaluar evolución de métricas clave en los últimos 3 meses', instruction_en: 'Evaluate the evolution of key metrics over the last 3 months', microActionType: MicroActionType.RESEARCH,     isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Identificar métricas de impacto social o ambiental',         instruction_en: 'Identify social or environmental impact metrics', microActionType: MicroActionType.OTHER,        isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    6: [
      { instruction_es: 'Publicar informe de métricas de impacto verificable',     instruction_en: 'Publish a verifiable impact metrics report', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction_es: 'Evaluar alcance e influencia del proyecto en el ecosistema', instruction_en: "Evaluate the project's reach and influence in the ecosystem", microActionType: MicroActionType.RESEARCH,     isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
      { instruction_es: 'Documentar crecimiento sostenido en los últimos 6 meses',  instruction_en: 'Document sustained growth over the last 6 months', microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
    ],
  },
};

export async function seedMicroActionDefinitions(
  dataSource: DataSource,
  pacs: Pac[],
  rubrics: any[], // 👈 ahora sí recibe rubrics
) {
  const repo = dataSource.getRepository(MicroActionDefinition);

  const microActionsData: Partial<MicroActionDefinition>[] = [];

  for (const pac of pacs) {
    const parts = pac.code.split('_');

    if (parts.length < 3) {
      console.warn(`⚠️ Código inválido de PAC: ${pac.code}`);
      continue;
    }

    const tramoIndex = parseInt(parts[1], 10);
    const catIndex   = parseInt(parts[2], 10);

    const templates = MAD_TEMPLATES[catIndex]?.[tramoIndex];

    if (!templates) {
      console.warn(`⚠️ Sin templates de MAD para ${pac.code}`);
      continue;
    }

    // 👇 buscar la rúbrica correspondiente a este PAC
    let rubric = rubrics[0]; // fallback

    if (catIndex === 2) {
      rubric = rubrics.find(r => r.code === 'RUB-ENTREVISTAS-V1') || rubric;
    } else if (catIndex === 3) {
      rubric = rubrics.find(r => r.code === 'RUB-PROPUESTA-VALOR-V1') || rubric;
    } else if (catIndex === 1) {
      rubric = rubrics.find(r => r.code === 'RUB-HIPOTESIS-V1') || rubric;
    }

    templates.forEach((tpl, i) => {
      microActionsData.push({
        pacId: pac.id,
        rubricId: rubric?.id, // 👈 clave: ahora se asigna
        code: `MAD_${tramoIndex}_${catIndex}_${i + 1}`,
        instruction_es: tpl.instruction_es,
        instruction_en: tpl.instruction_en,
        sortOrder: i + 1,
        executionWindowDays: 2,
        microActionType: tpl.microActionType,
        isRequired: tpl.isRequired,
        isReusable: tpl.isReusable ?? false,
        evidenceRequired: tpl.evidenceRequired,
        expectedEvidenceType: tpl.expectedEvidenceType,
      });
    });
  }

  const microActions = repo.create(microActionsData);
  const saved = await repo.save(microActions);

  console.log('✅ MicroActionDefinitions creadas:', saved.length);
  return saved;
}