import { DataSource } from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { Tramo } from 'src/tramos/entities/tramo.entity';

export async function seedCategories(dataSource: DataSource, tramos: Tramo[]) {
    const repo = dataSource.getRepository(Category);
    const [tramo1, tramo2] = tramos;

    const categories = repo.create([
        {
            tramoId: tramo1.id,
            code: 'CAT_1_1',
            name: 'Descubrimiento del problema',
            description: 'Identificación y validación del problema principal',
            sortOrder: 1,
            executionWindowDays: 10,
            isActive: true,
        },
        {
            tramoId: tramo1.id,
            code: 'CAT_1_2',
            name: 'Propuesta de valor',
            description: 'Definición de propuesta de valor inicial',
            sortOrder: 2,
            executionWindowDays: 20,
            isActive: true,
        },
        {
            tramoId: tramo2.id,
            code: 'CAT_2_1',
            name: 'Diseño del MVP',
            description: 'Diseño funcional y técnico del MVP',
            sortOrder: 1,
            executionWindowDays: 20,
            isActive: true,
        },
        {
            tramoId: tramo2.id,
            code: 'CAT_2_2',
            name: 'Validación técnica',
            description: 'Pruebas técnicas y validación de arquitectura',
            sortOrder: 2,
            executionWindowDays: 15,
            isActive: false,
        },
    ]);

    const saved = await repo.save(categories);
    console.log('✅ Categories creadas:', saved.length);
    return saved;
}