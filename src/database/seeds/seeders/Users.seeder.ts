import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AuthProvider, User, UserRole, UserStatus } from 'src/users/entities/user.entity';

export async function seedUsers(dataSource: DataSource) {
    const repo = dataSource.getRepository(User);

    const users = repo.create([
        {
            email: 'entrepreneur@colibri.com',
            password: await bcrypt.hash('Test@1234', 10),
            fullName: 'Lucas Emprendedor',
            role: UserRole.ENTREPRENEUR,
            status: UserStatus.ACTIVE,
            provider: AuthProvider.LOCAL,
        },
        {
            email: 'mecenas@colibri.com',
            password: await bcrypt.hash('Test@1234', 10),
            fullName: 'Sofia Mecenas',
            role: UserRole.MECENAS_SEMILLA,
            status: UserStatus.ACTIVE,
            provider: AuthProvider.LOCAL,
        },
        {
            email: 'mentor@colibri.com',
            password: await bcrypt.hash('Test@1234', 10),
            fullName: 'Carlos Mentor',
            role: UserRole.MENTOR,
            status: UserStatus.ACTIVE,
            provider: AuthProvider.LOCAL,
        },
    ]);

    const saved = await repo.save(users);
    console.log('✅ Usuarios creados:', saved.length);
    return saved;
}