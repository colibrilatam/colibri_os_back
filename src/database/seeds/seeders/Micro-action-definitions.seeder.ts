import { DataSource } from 'typeorm';
import {
  MicroActionDefinition,
  MicroActionType,
  EvidenceType,
} from 'src/micro-action-definitions/entities/micro-action-definition.entity';
import { Pac } from 'src/pacs/entities/pac.entity';

type MadTemplate = {
  instruction: string;
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
      { instruction: 'Listar los integrantes del equipo y su rol principal', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Definir compromisos semanales de dedicación por integrante', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar habilidades faltantes en el equipo actual', microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    2: [
      { instruction: 'Mapear roles reales ejecutados en la última semana', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Registrar conflicto operativo reciente y su resolución', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Evaluar desempeño individual mediante autoevaluación', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
    ],
    3: [
      { instruction: 'Mapear roles reales ejecutados en la última semana', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Registrar conflicto operativo reciente y resolución', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Evaluar desempeño individual del equipo',             microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
    ],
    4: [
      { instruction: 'Documentar estructura de roles y responsabilidades formales', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Registrar métricas de productividad del equipo',              microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar necesidades de incorporación o reemplazo',        microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    5: [
      { instruction: 'Documentar estructura organizacional vigente',    microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Evaluar clima interno y motivación del equipo',   microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Definir plan de incorporación de talento clave',  microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    6: [
      { instruction: 'Documentar cultura organizacional y valores operativos',   microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Evaluar liderazgo del equipo en el ecosistema',            microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar mentores o asesores estratégicos incorporados', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
  },

  // ── CAT 2 — Potencial del problema ────────────────────────────────────────
  2: {
    1: [
      { instruction: 'Realizar 3 entrevistas de descubrimiento con usuarios potenciales', microActionType: MicroActionType.INTERVIEW,      isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Documentar el problema central en una frase clara',                 microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar quién sufre más el problema y con qué frecuencia',      microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    2: [
      { instruction: 'Recolectar feedback de usuarios reales sobre el problema', microActionType: MicroActionType.INTERVIEW,      isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Identificar patrón común en problemas reportados',         microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: true,  evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Validar urgencia del problema con usuarios',               microActionType: MicroActionType.VALIDATION,     isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    3: [
      { instruction: 'Recolectar feedback de usuarios reales sobre el problema', microActionType: MicroActionType.INTERVIEW,      isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Identificar patrón común en problemas reportados',         microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: true,  evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Validar urgencia del problema con usuarios',               microActionType: MicroActionType.VALIDATION,     isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    4: [
      { instruction: 'Documentar evolución del problema desde T1 a la fecha',  microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Confirmar que el problema persiste en el segmento objetivo', microActionType: MicroActionType.VALIDATION,  isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar nuevos sub-segmentos con el mismo problema',  microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    5: [
      { instruction: 'Evaluar si el problema escala a nuevos segmentos',         microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Documentar casos de uso emergentes no previstos',          microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Validar relevancia del problema en mercados adyacentes',   microActionType: MicroActionType.VALIDATION,     isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    6: [
      { instruction: 'Documentar el impacto medible generado en el problema',   microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Publicar caso de éxito con datos verificables',           microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
      { instruction: 'Evaluar replicabilidad de la solución en otros contextos', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
  },

  // ── CAT 3 — Modelo de negocio ──────────────────────────────────────────────
  3: {
    1: [
      { instruction: 'Describir cómo el proyecto generará valor para el usuario', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar al menos un mecanismo de captura de valor',     microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Comparar con modelos de negocio de referencia en la industria', microActionType: MicroActionType.RESEARCH,  isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    2: [
      { instruction: 'Describir el modelo de negocio usando el canvas',       microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Testear disposición a pago con usuarios potenciales',   microActionType: MicroActionType.VALIDATION,     isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar el principal supuesto de captura de valor', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    3: [
      { instruction: 'Definir propuesta de valor actual',   microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Testear disposición a pago',          microActionType: MicroActionType.VALIDATION,     isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
      { instruction: 'Comparar alternativas existentes',    microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    4: [
      { instruction: 'Documentar ingresos reales del último mes',         microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Validar precio con usuarios pagadores activos',      microActionType: MicroActionType.VALIDATION,     isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar oportunidad de expansión del modelo',    microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    5: [
      { instruction: 'Documentar modelo de negocio escalado y sus variantes', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Evaluar eficiencia operativa del modelo actual',        microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar nuevas fuentes de ingreso potenciales',     microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    6: [
      { instruction: 'Documentar impacto sistémico del modelo de negocio',     microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Evaluar sostenibilidad del modelo a 5 años',             microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar modelos de financiamiento de impacto',       microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
    ],
  },

  // ── CAT 4 — Finanzas ──────────────────────────────────────────────────────
  4: {
    1: [
      { instruction: 'Listar los costos mínimos para operar el proyecto', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Estimar recursos propios disponibles',               microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar necesidad de financiamiento externo',    microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    2: [
      { instruction: 'Listar costos actuales del prototipo',   microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Estimar runway financiero',              microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar necesidades de inversión',   microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    3: [
      { instruction: 'Listar costos actuales del prototipo',   microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Estimar runway financiero',              microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar necesidades de inversión',   microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    4: [
      { instruction: 'Documentar ingresos y egresos del último mes',    microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Proyectar flujo de caja a 3 meses',               microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Identificar fuentes de financiamiento exploradas', microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    5: [
      { instruction: 'Documentar estructura financiera actual de la empresa', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Proyectar necesidades de capital para escalar',          microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Identificar instrumentos financieros disponibles',       microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
    ],
    6: [
      { instruction: 'Documentar estructura de financiamiento de impacto',  microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Evaluar sostenibilidad financiera a largo plazo',      microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar inversores de impacto potenciales',        microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
    ],
  },

  // ── CAT 5 — Timing y estrategia ───────────────────────────────────────────
  5: {
    1: [
      { instruction: 'Identificar 3 tendencias relevantes en la industria',   microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Describir por qué este es el momento para el proyecto', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar 2 competidores o alternativas existentes',  microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    2: [
      { instruction: 'Analizar tendencias del mercado con fuentes actuales',  microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
      { instruction: 'Evaluar competidores actuales y su evolución',          microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Definir ventana de oportunidad',                        microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    3: [
      { instruction: 'Analizar tendencias del mercado',   microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
      { instruction: 'Evaluar competidores actuales',     microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Definir ventana de oportunidad',   microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    4: [
      { instruction: 'Documentar posicionamiento competitivo actual',          microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Evaluar barreras de entrada para nuevos competidores',   microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar alianzas estratégicas que refuercen el timing', microActionType: MicroActionType.OTHER,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    5: [
      { instruction: 'Documentar estrategia de expansión a nuevos mercados', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Evaluar riesgos estratégicos de la expansión',          microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar aliados estratégicos clave para la expansión', microActionType: MicroActionType.OTHER,        isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    6: [
      { instruction: 'Documentar narrativa pública del proyecto',                microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Evaluar influencia del proyecto en la conversación del sector', microActionType: MicroActionType.OTHER,    isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
      { instruction: 'Identificar oportunidades de liderazgo de pensamiento',    microActionType: MicroActionType.RESEARCH,       isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
  },

  // ── CAT 6 — Factores exógenos ─────────────────────────────────────────────
  6: {
    1: [
      { instruction: 'Identificar regulaciones que apliquen al proyecto',       microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Mapear actores externos clave (gobierno, gremios, etc.)', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Evaluar impacto del contexto económico en el arranque',   microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: false, expectedEvidenceType: undefined },
    ],
    2: [
      { instruction: 'Identificar regulaciones relevantes para la solución', microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Evaluar dependencias externas del prototipo',           microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: false, expectedEvidenceType: undefined },
      { instruction: 'Mapear riesgos externos críticos para la validación',   microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    3: [
      { instruction: 'Identificar regulaciones relevantes',   microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Evaluar dependencias externas',         microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: false, expectedEvidenceType: undefined },
      { instruction: 'Mapear riesgos externos críticos',      microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    4: [
      { instruction: 'Monitorear cambios regulatorios del último mes',          microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
      { instruction: 'Evaluar impacto de cambios de contexto en la operación',  microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Actualizar mapa de riesgos externos',                     microActionType: MicroActionType.DOCUMENTATION, isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
    ],
    5: [
      { instruction: 'Documentar alianzas con actores externos clave',          microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Evaluar cambios regulatorios que afecten la expansión',   microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar oportunidades generadas por el contexto',     microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    6: [
      { instruction: 'Documentar externalidades del crecimiento identificadas', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Evaluar impacto regulatorio a escala sistémica',          microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Proponer acciones para mitigar impactos negativos',       microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
  },

  // ── CAT 7 — Métricas y tracción ───────────────────────────────────────────
  7: {
    1: [
      { instruction: 'Definir 3 métricas clave que medirán el progreso inicial', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Establecer un método simple de seguimiento semanal',       microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Registrar estado actual de las métricas como baseline',    microActionType: MicroActionType.DOCUMENTATION, isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
    ],
    2: [
      { instruction: 'Registrar primeras señales de uso o interés del producto', microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Analizar frecuencia de uso entre primeros usuarios',       microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Documentar aprendizajes derivados de las métricas',        microActionType: MicroActionType.DOCUMENTATION, isRequired: false, isReusable: true,  evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    3: [
      { instruction: 'Medir usuarios activos del prototipo',    microActionType: MicroActionType.OTHER,          isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Analizar retención de usuarios',          microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Documentar crecimiento semanal',          microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
    ],
    4: [
      { instruction: 'Documentar métricas de retención del último mes', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Analizar fuentes de crecimiento orgánico',         microActionType: MicroActionType.RESEARCH,       isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
      { instruction: 'Identificar métricas que predigan churn',          microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    5: [
      { instruction: 'Documentar dashboard de métricas operativas y de producto', microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Evaluar evolución de métricas clave en los últimos 3 meses', microActionType: MicroActionType.RESEARCH,     isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Identificar métricas de impacto social o ambiental',         microActionType: MicroActionType.OTHER,        isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.TEXT },
    ],
    6: [
      { instruction: 'Publicar informe de métricas de impacto verificable',     microActionType: MicroActionType.DOCUMENTATION, isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
      { instruction: 'Evaluar alcance e influencia del proyecto en el ecosistema', microActionType: MicroActionType.RESEARCH,     isRequired: true,  isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.LINK },
      { instruction: 'Documentar crecimiento sostenido en los últimos 6 meses',  microActionType: MicroActionType.OTHER,          isRequired: false, isReusable: false, evidenceRequired: true,  expectedEvidenceType: EvidenceType.FILE },
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
        instruction: tpl.instruction,
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