import { AuthProvider, UserRole, UserStatus } from "../entities/user.entity";

export interface ICreateUser {
email: string;
fullName: string;
provider: AuthProvider
password?: string | null;
googleId?: string;
role?: UserRole
status?: UserStatus
linkedinId?: string;
cryptoWallet?: string;
credentialsWallet?: string;
adnHash?: string;
bio?: string;
avatar?: string;
}
