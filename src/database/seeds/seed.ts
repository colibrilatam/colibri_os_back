import { AppDataSource } from '../data-source';
import { seedUsers } from './seeders/Users.seeder';
import { seedProjects } from './seeders/Projects.seeder';
import { seedNfts } from './seeders/Nfts.seeder';
import { seedProjectMembers } from './seeders/Project.members.seeder';
import { seedTramos } from './seeders/Tramos.seeder';
import { seedCategories } from './seeders/Categories.seeder';
import { seedPacs } from './seeders/Pacs.seeder';
import { seedRubrics } from './seeders/Rubrics.seeder';
import { seedMicroActionDefinitions } from './seeders/Micro-action-definitions.seeder';
import { seedLearningResources } from './seeders/Learning-resources.seeder';

async function seed() {
    await AppDataSource.initialize();
    console.log('📦 Conectado a la DB');

    try {
        await AppDataSource.query(`
            TRUNCATE TABLE
                "learning_resources",
                "micro_action_definitions",
                "pacs",
                "categories",
                "tramos",
                "nft_ownership_events",
                "project_members",
                "nft_actors",
                "mecenas_nft_portfolios",
                "nft_projects",
                "projects",
                "users",
                "rubrics"
            RESTART IDENTITY CASCADE;
        `);

        const users        = await seedUsers(AppDataSource);
        const tramos       = await seedTramos(AppDataSource);
        const projects     = await seedProjects(AppDataSource, users, tramos);
        await seedNfts(AppDataSource, users, projects);
        await seedProjectMembers(AppDataSource, users, projects);
        const categories   = await seedCategories(AppDataSource, tramos);
        const pacs         = await seedPacs(AppDataSource, categories);
        const rubrics      = await seedRubrics(AppDataSource);
        const microActionDefinitions = await seedMicroActionDefinitions(AppDataSource, pacs, rubrics);
        await seedLearningResources(AppDataSource, pacs, microActionDefinitions);

        console.log('\n🌱 Seed completado exitosamente');
    } catch (error) {
        console.error('❌ Error en seed:', error);
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
    }
}

seed();