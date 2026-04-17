import { DataSource } from 'typeorm';
import { Rubric, RubricTargetEntity } from 'src/evaluation/entities/rubric.entity';

export async function seedRubrics(dataSource: DataSource) {
    const repo = dataSource.getRepository(Rubric);

    const rubrics = repo.create([
        {
            code: 'RUB-ENTREVISTAS-V1',
            name: 'Rúbrica de entrevistas de descubrimiento',
            description: 'Evalúa la calidad y profundidad de las entrevistas realizadas con usuarios potenciales.',
            targetEntity: RubricTargetEntity.EVIDENCE,
            version: 'v1.0',
            isActive: true,
            frameworkReference: 'Lean Startup - Customer Discovery',
            criteriaJson: {
                dimensions: [
                    { name: 'cantidad', weight: 0.33, criteria: 'Se realizaron al menos 5 entrevistas.' },
                    { name: 'profundidad', weight: 0.33, criteria: 'Las preguntas exploran causas raíz, no síntomas.' },
                    { name: 'documentación', weight: 0.34, criteria: 'Cada entrevista tiene registro escrito o grabación.' },
                ],
            },
            validFrom: null,
            validTo: null,
        },
        {
            code: 'RUB-HIPOTESIS-V1',
            name: 'Rúbrica de validación de hipótesis',
            description: 'Evalúa si la hipótesis del problema está correctamente formulada y respaldada por evidencia.',
            targetEntity: RubricTargetEntity.EVIDENCE,
            version: 'v1.0',
            isActive: true,
            frameworkReference: 'Jobs To Be Done',
            criteriaJson: {
                dimensions: [
                    { name: 'claridad', weight: 0.5, criteria: 'La hipótesis es específica, medible y falseable.' },
                    { name: 'respaldo', weight: 0.5, criteria: 'Está respaldada por al menos 3 fuentes primarias.' },
                ],
            },
            validFrom: null,
            validTo: null,
        },
        {
            code: 'RUB-PROPUESTA-VALOR-V1',
            name: 'Rúbrica de propuesta de valor',
            description: 'Evalúa la claridad y diferenciación de la propuesta de valor inicial del proyecto.',
            targetEntity: RubricTargetEntity.BOTH,
            version: 'v1.0',
            isActive: true,
            frameworkReference: 'Value Proposition Canvas',
            criteriaJson: {
                dimensions: [
                    { name: 'claridad', weight: 0.4, criteria: 'La propuesta se entiende en menos de 10 segundos.' },
                    { name: 'diferenciación', weight: 0.3, criteria: 'Identifica al menos un diferencial concreto.' },
                    { name: 'foco_en_usuario', weight: 0.3, criteria: 'Menciona explícitamente el segmento objetivo.' },
                ],
            },
            validFrom: null,
            validTo: null,
        },
        {
            code: 'RUB-MVP-ARQUITECTURA-V1',
            name: 'Rúbrica de arquitectura MVP',
            description: 'Evalúa la solidez técnica y viabilidad de la arquitectura propuesta para el MVP.',
            targetEntity: RubricTargetEntity.EVIDENCE,
            version: 'v1.0',
            isActive: true,
            frameworkReference: null,
            criteriaJson: {
                dimensions: [
                    { name: 'viabilidad_técnica', weight: 0.4, criteria: 'El stack es apropiado para el alcance del MVP.' },
                    { name: 'escalabilidad', weight: 0.3, criteria: 'La arquitectura permite crecer sin rediseño total.' },
                    { name: 'documentación', weight: 0.3, criteria: 'Existe un diagrama o descripción escrita de la arquitectura.' },
                ],
            },
            validFrom: null,
            validTo: null,
        },
        {
            code: 'RUB-OBSOLETA-V1',
            name: 'Rúbrica de prototipado (deprecada)',
            description: 'Versión anterior, reemplazada por RUB-MVP-ARQUITECTURA-V1.',
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