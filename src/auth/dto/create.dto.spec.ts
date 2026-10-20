import { validate } from 'class-validator';
import { CreateUserDto } from './create.dto';
import { UserRole } from '../../users/entities/user.entity';

describe('CreateUserDto — role whitelist', () => {
  const baseDto = {
    email: 'test@colibri.com',
    password: 'Abcdef1!',
    confirmPassword: 'Abcdef1!',
    fullName: 'Test User',
  };

  it('role ausente → válido (default entrepreneur)', async () => {
    const dto = Object.assign(new CreateUserDto(), baseDto);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('role: entrepreneur → válido', async () => {
    const dto = Object.assign(new CreateUserDto(), { ...baseDto, role: UserRole.ENTREPRENEUR });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('role: evaluator → válido', async () => {
    const dto = Object.assign(new CreateUserDto(), { ...baseDto, role: UserRole.EVALUATOR });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('role: admin → error con mensaje del @IsIn', async () => {
    const dto = Object.assign(new CreateUserDto(), { ...baseDto, role: UserRole.ADMIN });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const roleError = errors.find((e) => e.property === 'role');
    expect(roleError).toBeDefined();
    expect(roleError!.constraints?.isIn).toContain('entrepreneur');
    expect(roleError!.constraints?.isIn).toContain('evaluator');
  });

  it('role: mentor → error', async () => {
    const dto = Object.assign(new CreateUserDto(), { ...baseDto, role: UserRole.MENTOR });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const roleError = errors.find((e) => e.property === 'role');
    expect(roleError).toBeDefined();
  });

  it('role: mecenas_semilla → error', async () => {
    const dto = Object.assign(new CreateUserDto(), { ...baseDto, role: UserRole.MECENAS_SEMILLA });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('role: cualquier-cosa → error', async () => {
    const dto = Object.assign(new CreateUserDto(), { ...baseDto, role: 'cualquier-cosa' as any });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});