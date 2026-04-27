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
import { seedAlgorithmVersions } from './seeders/Algorithm-versions.seeder';

async function seed() {
    await AppDataSource.initialize();
    console.log('📦 Conectado a la DB');

    try {
        await AppDataSource.query(`
      TRUNCATE TABLE
        "learning_resources",
        "micro_action_definitions",
        "project_pacs",
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
        "rubrics",
        "ic_algorithm_versions"
      RESTART IDENTITY CASCADE;
    `);

        const users = await seedUsers(AppDataSource);
        const tramos = await seedTramos(AppDataSource);
        const categories = await seedCategories(AppDataSource, tramos);
        const pacs = await seedPacs(AppDataSource, categories);

        // seedProjects ahora recibe pacs para asignar currentPacId y crear ProjectPacs
        const projects = await seedProjects(AppDataSource, users, tramos, pacs);

        await seedNfts(AppDataSource, users, projects);
        await seedProjectMembers(AppDataSource, users, projects);

        const rubrics = await seedRubrics(AppDataSource);
        const microActionDefs = await seedMicroActionDefinitions(AppDataSource, pacs, rubrics);
        await seedLearningResources(AppDataSource, pacs, microActionDefs);

        await seedAlgorithmVersions(AppDataSource);

        console.log('\n🌱 Seed completado exitosamente');
    } catch (error) {
        console.error('❌ Error en seed:', error);
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
    }
}

seed();