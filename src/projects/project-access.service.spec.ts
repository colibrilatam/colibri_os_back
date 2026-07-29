import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectAccessService } from './project-access.service';
import { UserRole } from '../users/entities/user.entity';

describe('ProjectAccessService', () => {
  const project = { id: 'project-1', ownerUserId: 'owner-1' };
  let projectRepository: { findOne: jest.Mock };
  let memberRepository: { findOne: jest.Mock };
  let service: ProjectAccessService;

  beforeEach(() => {
    projectRepository = { findOne: jest.fn().mockResolvedValue(project) };
    memberRepository = { findOne: jest.fn() };
    service = new ProjectAccessService(projectRepository as never, memberRepository as never);
  });

  it('allows the owner without consulting memberships', async () => {
    await expect(
      service.assertCanAccessProject(
        { userId: 'owner-1', role: UserRole.ENTREPRENEUR },
        'project-1',
      ),
    ).resolves.toEqual(project);
    expect(memberRepository.findOne).not.toHaveBeenCalled();
  });

  it('allows an active project member to read the project', async () => {
    memberRepository.findOne.mockResolvedValue({ isActive: true });

    await expect(
      service.assertCanAccessProject({ userId: 'member-1', role: UserRole.MENTOR }, 'project-1'),
    ).resolves.toEqual(project);
  });

  it('rejects a user without an active membership', async () => {
    memberRepository.findOne.mockResolvedValue(null);

    await expect(
      service.assertCanAccessProject({ userId: 'other-1', role: UserRole.EVALUATOR }, 'project-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires a primary operator, owner, or admin to manage a project', async () => {
    memberRepository.findOne.mockResolvedValue(null);

    await expect(
      service.assertCanManageProject(
        { userId: 'member-1', role: UserRole.ENTREPRENEUR },
        'project-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    memberRepository.findOne.mockResolvedValue({ isPrimaryOperator: true, isActive: true });
    await expect(
      service.assertCanManageProject(
        { userId: 'member-1', role: UserRole.ENTREPRENEUR },
        'project-1',
      ),
    ).resolves.toEqual(project);
  });

  it('fails closed when the project does not exist', async () => {
    projectRepository.findOne.mockResolvedValue(null);

    await expect(
      service.assertCanAccessProject({ userId: 'owner-1', role: UserRole.ADMIN }, 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
