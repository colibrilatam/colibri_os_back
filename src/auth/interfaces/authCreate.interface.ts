import { UserRole } from "src/users/entities/user.entity"

export interface IAuthCreate {
    email: string,
    fullName: string,
    password: string,
    confirmPassword:string
    role?:UserRole
}