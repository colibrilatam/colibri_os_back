import { DataSource } from 'typeorm';
import { Tramo } from 'src/tramos/entities/tramo.entity';

export async function seedTramos(dataSource: DataSource) {
    const repo = dataSource.getRepository(Tramo);

    const tramos = repo.create([
        {
            code: 'TRAMO_1',
            name: 'Validación de Idea',
            description: 'Fase inicial donde se valida el problema y la solución',
            sortOrder: 1,
            executionWindowDays: 30,
            isActive: true,
        },
        {
            code: 'TRAMO_2',
            name: 'Construcción MVP',
            description: 'Construcción del producto mínimo viable',
            sortOrder: 2,
            executionWindowDays: 60,
            isActive: true,
        },
    ]);

    const saved = await repo.save(tramos);
    console.log('✅ Tramos creados:', saved.length);
    return saved;
}