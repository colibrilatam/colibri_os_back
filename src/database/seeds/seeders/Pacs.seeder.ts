import { DataSource } from 'typeorm';
import { Pac } from 'src/pacs/entities/pac.entity';
import { Category } from 'src/categories/entities/category.entity';

export async function seedPacs(dataSource: DataSource, categories: Category[]) {
    const repo = dataSource.getRepository(Pac);
    const [cat1_1, cat1_2, cat2_1, cat2_2] = categories;

    const pacs = repo.create([
        // TRAMO 1 — CAT 1
        {
            categoryId: cat1_1.id,
            code: 'PAC_1_1_1',
            title: 'Identificar problema del usuario',
            objectiveLine: 'Detectar necesidades reales del usuario',
            sortOrder: 1,
            executionWindowDays: 5,
            isActive: true,
        },
        {
            categoryId: cat1_1.id,
            code: 'PAC_1_1_2',
            title: 'Validar hipótesis del problema',
            objectiveLine: 'Validar si el problema es relevante',
            sortOrder: 2,
            executionWindowDays: 5,
            isActive: true,
        },
        // TRAMO 1 — CAT 2
        {
            categoryId: cat1_2.id,
            code: 'PAC_1_2_1',
            title: 'Definir propuesta de valor',
            objectiveLine: 'Crear propuesta clara y diferenciadora',
            sortOrder: 1,
            executionWindowDays: 10,
            isActive: true,
        },
        // TRAMO 2 — CAT 1
        {
            categoryId: cat2_1.id,
            code: 'PAC_2_1_1',
            title: 'Diseñar arquitectura MVP',
            objectiveLine: 'Definir estructura técnica del producto',
            sortOrder: 1,
            executionWindowDays: 15,
            isActive: true,
        },
        // TRAMO 2 — CAT 2 (categoría inactiva)
        {
            categoryId: cat2_2.id,
            code: 'PAC_2_2_1',
            title: 'Testear escalabilidad',
            objectiveLine: 'Evaluar capacidad de crecimiento del sistema',
            sortOrder: 1,
            executionWindowDays: 10,
            isActive: true,
        },
    ]);

    const saved = await repo.save(pacs);
    console.log('✅ PACs creados:', saved.length);
    return saved;
}