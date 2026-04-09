import { DataSource } from 'typeorm';
import { Tramo } from 'src/tramos/entities/tramo.entity';

export async function seedTramos(dataSource: DataSource) {
    const repo = dataSource.getRepository(Tramo);

    const tramos = repo.create([
        {
            code: 'T1',
            name: 'Validación de Idea',
            description: 'Fase inicial donde se valida el problema y la solución',
            sortOrder: 1,
            executionWindowDays: 30,
            isActive: true,
            nftImageUrl: '/nfts/t1.png',
        },
        {
            code: 'T2',
            name: 'Construcción MVP',
            description: 'Construcción del producto mínimo viable',
            sortOrder: 2,
            executionWindowDays: 60,
            isActive: true,
            nftImageUrl: '/nfts/t2.png',
        },
        {
            code: 'T3',
            name: 'Tracción',
            description: 'Escalado, crecimiento y optimización',
            sortOrder: 3,
            executionWindowDays: 90,
            isActive: true,
            nftImageUrl: '/nfts/t3.png',
        },
        {
            code: 'T4',
            name: 'Escala',
            description: 'Expansión del negocio, optimización de métricas y consolidación en el mercado',
            sortOrder: 4,
            executionWindowDays: 120,
            isActive: true,
            nftImageUrl: '/nfts/t4.png',
        },
    ]);

    const saved = await repo.save(tramos);
    console.log('✅ Tramos creados:', saved.length);
    return saved;
}