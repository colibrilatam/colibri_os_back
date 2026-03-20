import { AuthProvider } from "src/users/entities/user.entity";

export interface IGoogleUser{
    email: string,
    fullName: string,
    googleId: string,
    avatar: string,
    provider: AuthProvider
}