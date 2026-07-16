import { DataSource } from 'typeorm';
import { Rubric, RubricTargetEntity } from 'src/evaluation/entities/rubric.entity';

export async function seedRubrics(dataSource: DataSource) {
    const repo = dataSource.getRepository(Rubric);

    const rubrics = repo.create([
        {
            code: 'RUB-ENTREVISTAS-V1',
            name_es: 'Rúbrica de entrevistas de descubrimiento',
            name_en: 'Discovery interview rubric',
            description_es: 'Evalúa la calidad y profundidad de las entrevistas realizadas con usuarios potenciales.',
            description_en: 'Evaluates the quality and depth of interviews conducted with potential users.',
            targetEntity: RubricTargetEntity.EVIDENCE,
            version: 'v1.0',
            isActive: true,
            frameworkReference: 'Lean Startup - Customer Discovery',
            criteriaJson: {
                dimensions: [
                    { name_es: 'cantidad', name_en: 'quantity', weight: 0.33, criteria_es: 'Se realizaron al menos 5 entrevistas.', criteria_en: 'At least 5 interviews were conducted.' },
                    { name_es: 'profundidad', name_en: 'depth', weight: 0.33, criteria_es: 'Las preguntas exploran causas raíz, no síntomas.', criteria_en: 'Questions explore root causes, not symptoms.' },
                    { name_es: 'documentación', name_en: 'documentation', weight: 0.34, criteria_es: 'Cada entrevista tiene registro escrito o grabación.', criteria_en: 'Each interview has a written record or recording.' },
                ],
            },
            validFrom: null,
            validTo: null,
        },
        {
            code: 'RUB-HIPOTESIS-V1',
            name_es: 'Rúbrica de validación de hipótesis',
            name_en: 'Hypothesis validation rubric',
            description_es: 'Evalúa si la hipótesis del problema está correctamente formulada y respaldada por evidencia.',
            description_en: 'Evaluates whether the problem hypothesis is correctly formulated and backed by evidence.',
            targetEntity: RubricTargetEntity.EVIDENCE,
            version: 'v1.0',
            isActive: true,
            frameworkReference: 'Jobs To Be Done',
            criteriaJson: {
                dimensions: [
                    { name_es: 'claridad', name_en: 'clarity', weight: 0.5, criteria_es: 'La hipótesis es específica, medible y falseable.', criteria_en: 'The hypothesis is specific, measurable and falsifiable.' },
                    { name_es: 'respaldo', name_en: 'support', weight: 0.5, criteria_es: 'Está respaldada por al menos 3 fuentes primarias.', criteria_en: 'It is backed by at least 3 primary sources.' },
                ],
            },
            validFrom: null,
            validTo: null,
        },
        {
            code: 'RUB-PROPUESTA-VALOR-V1',
            name_es: 'Rúbrica de propuesta de valor',
            name_en: 'Value proposition rubric',
            description_es: 'Evalúa la claridad y diferenciación de la propuesta de valor inicial del proyecto.',
            description_en: "Evaluates the clarity and differentiation of the project's initial value proposition.",
            targetEntity: RubricTargetEntity.BOTH,
            version: 'v1.0',
            isActive: true,
            frameworkReference: 'Value Proposition Canvas',
            criteriaJson: {
                dimensions: [
                    { name_es: 'claridad', name_en: 'clarity', weight: 0.4, criteria_es: 'La propuesta se entiende en menos de 10 segundos.', criteria_en: 'The proposition is understood in under 10 seconds.' },
                    { name_es: 'diferenciación', name_en: 'differentiation', weight: 0.3, criteria_es: 'Identifica al menos un diferencial concreto.', criteria_en: 'Identifies at least one concrete differentiator.' },
                    { name_es: 'foco_en_usuario', name_en: 'user_focus', weight: 0.3, criteria_es: 'Menciona explícitamente el segmento objetivo.', criteria_en: 'Explicitly mentions the target segment.' },
                ],
            },
            validFrom: null,
            validTo: null,
        },
        {
            code: 'RUB-MVP-ARQUITECTURA-V1',
            name_es: 'Rúbrica de arquitectura MVP',
            name_en: 'MVP architecture rubric',
            description_es: 'Evalúa la solidez técnica y viabilidad de la arquitectura propuesta para el MVP.',
            description_en: 'Evaluates the technical soundness and viability of the proposed MVP architecture.',
            targetEntity: RubricTargetEntity.EVIDENCE,
            version: 'v1.0',
            isActive: true,
            frameworkReference: null,
            criteriaJson: {
                dimensions: [
                    { name_es: 'viabilidad_técnica', name_en: 'technical_viability', weight: 0.4, criteria_es: 'El stack es apropiado para el alcance del MVP.', criteria_en: 'The stack is appropriate for the scope of the MVP.' },
                    { name_es: 'escalabilidad', name_en: 'scalability', weight: 0.3, criteria_es: 'La arquitectura permite crecer sin rediseño total.', criteria_en: 'The architecture allows growth without a full redesign.' },
                    { name_es: 'documentación', name_en: 'documentation', weight: 0.3, criteria_es: 'Existe un diagrama o descripción escrita de la arquitectura.', criteria_en: 'A diagram or written description of the architecture exists.' },
                ],
            },
            validFrom: null,
            validTo: null,
        },
        {
            code: 'RUB-OBSOLETA-V1',
            name_es: 'Rúbrica de prototipado (deprecada)',
            name_en: 'Prototyping rubric (deprecated)',
            description_es: 'Versión anterior, reemplazada por RUB-MVP-ARQUITECTURA-V1.',
            description_en: 'Previous version, replaced by RUB-MVP-ARQUITECTURA-V1.',
            targetEntity: RubricTargetEntity.MICRO_ACTION,
            version: 'v1.0',
            isActive: false,
            frameworkReference: null,
            criteriaJson: { dimensions: [] },
            validFrom: null,
            validTo: null,
        },
    ] as Partial<Rubric>[]);

    const saved = await repo.save(rubrics);
    console.log('✅ Rúbricas creadas:', saved.length);
    return saved;
}