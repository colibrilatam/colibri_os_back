import { DataSource } from 'typeorm';
import { Pac } from 'src/pacs/entities/pac.entity';
import { Category } from 'src/categories/entities/category.entity';

export async function seedPacs(dataSource: DataSource, categories: Category[]) {
    const repo = dataSource.getRepository(Pac);
    const [cat1_1, cat1_2, cat2_1, cat2_2] = categories;

    const pacs = repo.create([

        // ── TRAMO 1 — CAT 1: Descubrimiento del problema ─────────────────────────
        {
            categoryId: cat1_1.id,
            code: 'PAC_1_1_1',
            title: 'Identificar problema del usuario',
            objectiveLine: 'Detectar necesidades reales del usuario mediante contacto directo.',
            description:
                'El equipo debe salir a campo y obtener evidencia primaria sobre el problema que intenta resolver. ' +
                'Se priorizan entrevistas de descubrimiento sobre supuestos internos.',
            sortOrder: 1,
            executionWindowDays: 5,
            minimumCompletionThreshold: 60.00,
            icWeight: 0.25,
            closureRule: 'Mínimo 5 entrevistas documentadas con al menos 3 patrones de dolor identificados.',
            templateVersion: 'v1.0',
            isActive: true,
        },
        {
            categoryId: cat1_1.id,
            code: 'PAC_1_1_2',
            title: 'Validar hipótesis del problema',
            objectiveLine: 'Contrastar si el problema identificado es relevante y recurrente.',
            description:
                'Con los patrones obtenidos en el PAC anterior, el equipo redacta y valida formalmente ' +
                'la hipótesis central del problema usando fuentes primarias.',
            sortOrder: 2,
            executionWindowDays: 5,
            minimumCompletionThreshold: 70.00,
            icWeight: 0.25,
            closureRule: 'Hipótesis redactada en formato estándar y respaldada por al menos 3 fuentes primarias.',
            templateVersion: 'v1.0',
            isActive: true,
        },

        // ── TRAMO 1 — CAT 2: Propuesta de valor ──────────────────────────────────
        {
            categoryId: cat1_2.id,
            code: 'PAC_1_2_1',
            title: 'Definir propuesta de valor',
            objectiveLine: 'Articular una propuesta clara, diferenciada y centrada en el usuario.',
            description:
                'El equipo traduce los aprendizajes del descubrimiento en una propuesta de valor concisa ' +
                'que comunique el resultado esperado para el segmento objetivo.',
            sortOrder: 1,
            executionWindowDays: 10,
            minimumCompletionThreshold: 65.00,
            icWeight: 0.50,
            closureRule: 'Propuesta de valor en una frase validada con reacción espontánea de al menos 3 usuarios.',
            templateVersion: 'v1.0',
            isActive: true,
        },

        // ── TRAMO 2 — CAT 1: Diseño del MVP ──────────────────────────────────────
        {
            categoryId: cat2_1.id,
            code: 'PAC_2_1_1',
            title: 'Diseñar arquitectura MVP',
            objectiveLine: 'Definir la estructura técnica mínima viable del producto.',
            description:
                'El equipo diseña y documenta la arquitectura técnica del MVP, seleccionando el stack adecuado ' +
                'y validando las decisiones con un par experto o mentor técnico.',
            sortOrder: 1,
            executionWindowDays: 15,
            minimumCompletionThreshold: 70.00,
            icWeight: 0.60,
            closureRule: 'Diagrama de arquitectura entregado, decisiones técnicas documentadas y feedback de mentor registrado.',
            templateVersion: 'v1.0',
            isActive: true,
        },

        // ── TRAMO 2 — CAT 2: Validación técnica (inactiva) ───────────────────────
        {
            categoryId: cat2_2.id,
            code: 'PAC_2_2_1',
            title: 'Testear escalabilidad',
            objectiveLine: 'Evaluar la capacidad de crecimiento técnico del sistema.',
            description:
                'El equipo define criterios de escalabilidad para el primer año y los contrasta con ' +
                'la arquitectura actual. Esta categoría está temporalmente inactiva.',
            sortOrder: 1,
            executionWindowDays: 10,
            minimumCompletionThreshold: 50.00,
            icWeight: 0.40,
            closureRule: 'Criterios de escalabilidad definidos y documentados.',
            templateVersion: 'v1.0',
            isActive: true
        },
        {
            categoryId: cat1_1.id,
            code: 'PAC_3_1_1',
            title: 'Validación de prototipo',
            objectiveLine: 'Validar primeras iteraciones del producto con usuarios reales.',
            description: 'El equipo prueba el prototipo y recoge feedback estructurado.',
            sortOrder: 1,
            executionWindowDays: 10,
            minimumCompletionThreshold: 60,
            icWeight: 0.5,
            closureRule: 'Mínimo 5 tests de usuario con feedback documentado.',
            templateVersion: 'v1.0',
            isActive: true,
        },
        {
            categoryId: cat1_1.id,
            code: 'PAC_4_1_1',
            title: 'Validación de tracción inicial',
            objectiveLine: 'Medir adopción temprana y uso real del producto.',
            description: 'Se evalúa uso activo y repetición del producto en entornos reales.',
            sortOrder: 1,
            executionWindowDays: 15,
            minimumCompletionThreshold: 70,
            icWeight: 0.6,
            closureRule: 'Al menos 20 usuarios activos en periodo inicial.',
            templateVersion: 'v1.0',
            isActive: true,
        }
    ]);

    const saved = await repo.save(pacs);
    console.log('✅ PACs creados:', saved.length);
    return saved;
}