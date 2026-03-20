import { UserRole, UserStatus } from "src/users/entities/user.entity";

export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole
    status: UserStatus
}