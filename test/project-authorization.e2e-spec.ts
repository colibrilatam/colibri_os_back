// test/project-authorization.e2e-spec.ts

import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from './e2e-setup';
import { Fixtures } from './fixtures';
import { UserRole } from 'src/users/entities/user.entity';
import { ProjectPacStatus } from 'src/projects/entities/project.pac.entity';

describe('Projects & ProjectPac — SEC-006B (IDOR / ownership) (e2e)', () => {
  let ctx: E2eContext;
  let fixtures: Fixtures;
  const server = () => ctx.app.getHttpServer();

  beforeAll(async () => {
    ctx = await createTestApp();
    fixtures = new Fixtures(ctx.app);
  });

  afterEach(async () => {
    await cleanDatabase(ctx.dataSource);
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  describe('PATCH /api/v1/projects/:id — modificar un proyecto ajeno usando su UUID', () => {
    it('403 cuando un usuario ajeno intenta modificar el proyecto', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const attacker = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(owner.id);

      await request(server())
        .patch(`/api/v1/projects/${project.id}`)
        .set(fixtures.authHeader(attacker))
        .send({ tagline: 'hackeado' })
        .expect(403);
    });

    it('403 cuando un miembro no-operador-primario intenta modificar el proyecto', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const member = await fixtures.createUser(UserRole.MENTOR);
      const project = await fixtures.createProject(owner.id);
      await fixtures.addProjectMember(project.id, member.id, { isPrimaryOperator: false });

      await request(server())
        .patch(`/api/v1/projects/${project.id}`)
        .set(fixtures.authHeader(member))
        .send({ tagline: 'no deberia poder' })
        .expect(403);
    });

    it('200 cuando el dueño modifica su propio proyecto', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(owner.id);

      await request(server())
        .patch(`/api/v1/projects/${project.id}`)
        .set(fixtures.authHeader(owner))
        .send({ tagline: 'actualizado por el dueno' })
        .expect(200);
    });

    it('200 cuando un miembro operador primario modifica el proyecto', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const operator = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(owner.id);
      await fixtures.addProjectMember(project.id, operator.id, { isPrimaryOperator: true });

      await request(server())
        .patch(`/api/v1/projects/${project.id}`)
        .set(fixtures.authHeader(operator))
        .send({ tagline: 'actualizado por operador primario' })
        .expect(200);
    });

    it('200 cuando ADMIN modifica un proyecto ajeno', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const admin = await fixtures.createUser(UserRole.ADMIN);
      const project = await fixtures.createProject(owner.id);

      await request(server())
        .patch(`/api/v1/projects/${project.id}`)
        .set(fixtures.authHeader(admin))
        .send({ tagline: 'actualizado por admin' })
        .expect(200);
    });
  });

  describe('DELETE /api/v1/projects/:id — eliminar un proyecto ajeno', () => {
    it('403 cuando un usuario ajeno intenta eliminar el proyecto', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const attacker = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(owner.id);

      await request(server())
        .delete(`/api/v1/projects/${project.id}`)
        .set(fixtures.authHeader(attacker))
        .expect(403);
    });

    it('200 y queda auditado cuando el dueño elimina su propio proyecto', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(owner.id);

      await request(server())
        .delete(`/api/v1/projects/${project.id}`)
        .set(fixtures.authHeader(owner))
        .expect(200);

      const audits: Array<{ action: string; performed_by_user_id: string }> =
        await ctx.dataSource.query(
          `SELECT action, performed_by_user_id FROM project_resource_audits WHERE project_id = $1`,
          [project.id],
        );

      expect(audits).toHaveLength(1);
      expect(audits[0].action).toBe('delete');
      expect(audits[0].performed_by_user_id).toBe(owner.id);
    });
  });

  describe('PAC de proyecto — mover / modificar PAC de otro proyecto (2 tenants)', () => {
    it('403 al actualizar el estado de un PAC de un proyecto ajeno usando su UUID', async () => {
      const ownerA = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const projectA = await fixtures.createProject(ownerA.id);
      const tramo = await fixtures.createTramo();
      const category = await fixtures.createCategory(tramo.id);
      const pac = await fixtures.createPac(category.id);
      const projectPacA = await fixtures.createProjectPac(projectA.id, pac.id);

      const ownerB = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const projectB = await fixtures.createProject(ownerB.id);
      // El atacante es dueño de SU propio proyecto (projectB), pero intenta
      // tocar el PAC del proyecto A pasando el UUID del PAC ajeno.
      void projectB;

      await request(server())
        .patch(`/api/v1/projects/pac/${projectPacA.id}`)
        .set(fixtures.authHeader(ownerB))
        .send({ status: ProjectPacStatus.COMPLETED })
        .expect(403);
    });

    it('403 al eliminar un PAC de otro proyecto', async () => {
      const ownerA = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const projectA = await fixtures.createProject(ownerA.id);
      const tramo = await fixtures.createTramo();
      const category = await fixtures.createCategory(tramo.id);
      const pac = await fixtures.createPac(category.id);
      const projectPacA = await fixtures.createProjectPac(projectA.id, pac.id);

      const outsider = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .delete(`/api/v1/projects/pac/${projectPacA.id}`)
        .set(fixtures.authHeader(outsider))
        .expect(403);

      // El PAC sigue existiendo: el intento ajeno no tuvo ningún efecto.
      const stillExists = await ctx.dataSource.query(
        `SELECT id FROM project_pacs WHERE id = $1`,
        [projectPacA.id],
      );
      expect(stillExists).toHaveLength(1);
    });

    it('403 al intentar crear un ProjectPac en un proyecto ajeno', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(owner.id);
      const tramo = await fixtures.createTramo();
      const category = await fixtures.createCategory(tramo.id);
      const pac = await fixtures.createPac(category.id);

      const outsider = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .post(`/api/v1/projects/${project.id}/pac/${pac.id}`)
        .set(fixtures.authHeader(outsider))
        .expect(403);
    });

    it('200 y queda auditado cuando el dueño actualiza el estado de su propio PAC', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(owner.id);
      const tramo = await fixtures.createTramo();
      const category = await fixtures.createCategory(tramo.id);
      const pac = await fixtures.createPac(category.id);
      const projectPac = await fixtures.createProjectPac(project.id, pac.id);

      await request(server())
        .patch(`/api/v1/projects/pac/${projectPac.id}`)
        .set(fixtures.authHeader(owner))
        .send({ status: ProjectPacStatus.IN_PROGRESS })
        .expect(200);

      const audits: Array<{ action: string }> = await ctx.dataSource.query(
        `SELECT action FROM project_resource_audits WHERE resource_id = $1`,
        [projectPac.id],
      );
      expect(audits).toHaveLength(1);
      expect(audits[0].action).toBe('pac_status_change');
    });
  });

  describe('Consultas privadas filtran por visibilidad (assertCanAccessProject)', () => {
    it('403 cuando un usuario ajeno consulta el perfil privado de un proyecto', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(owner.id);
      const outsider = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .get(`/api/v1/projects/${project.id}/profile`)
        .set(fixtures.authHeader(outsider))
        .expect(403);
    });

    it('403 cuando un miembro del proyecto B consulta el perfil del proyecto A', async () => {
      const ownerA = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const projectA = await fixtures.createProject(ownerA.id);

      const ownerB = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const projectB = await fixtures.createProject(ownerB.id);
      const memberOfB = await fixtures.createUser(UserRole.MENTOR);
      await fixtures.addProjectMember(projectB.id, memberOfB.id);

      await request(server())
        .get(`/api/v1/projects/${projectA.id}/profile`)
        .set(fixtures.authHeader(memberOfB))
        .expect(403);
    });
  });
});