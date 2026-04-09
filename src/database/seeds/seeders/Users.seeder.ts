import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AuthProvider, User, UserRole, UserStatus } from 'src/users/entities/user.entity';

export async function seedUsers(dataSource: DataSource) {
    const repo = dataSource.getRepository(User);

    const password = await bcrypt.hash('Test@1234', 10);

    const users = repo.create([
        // Entrepreneurs
        {
            email: 'lucas@colibri.com',
            password,
            fullName: 'Lucas Emprendedor',
            role: UserRole.ENTREPRENEUR,
            status: UserStatus.ACTIVE,
            provider: AuthProvider.LOCAL,
        },
        {
            email: 'ana@colibri.com',
            password,
            fullName: 'Ana Startup',
            role: UserRole.ENTREPRENEUR,
            status: UserStatus.ACTIVE,
            provider: AuthProvider.LOCAL,
        },
        {
            email: 'martin@colibri.com',
            password,
            fullName: 'Martin Founder',
            role: UserRole.ENTREPRENEUR,
            status: UserStatus.ACTIVE,
            provider: AuthProvider.LOCAL,
        },
        {
            email: 'sofia@colibri.com',
            password,
            fullName: 'Sofia Builder',
            role: UserRole.ENTREPRENEUR,
            status: UserStatus.ACTIVE,
            provider: AuthProvider.LOCAL,
        },

        // Mecenas
        {
            email: 'mecenas@colibri.com',
            password,
            fullName: 'Sofia Mecenas',
            role: UserRole.MECENAS_SEMILLA,
            status: UserStatus.ACTIVE,
            provider: AuthProvider.LOCAL,
        },

        // Mentor
        {
            email: 'mentor@colibri.com',
            password,
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