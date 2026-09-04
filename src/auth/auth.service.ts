import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { IGoogleUser } from './interfaces/googleUser.interface';
import { AuthProvider, User, UserRole } from 'src/users/entities/user.entity';
import { ILoginUser } from './interfaces/loginUser.interface';
import bcrypt from 'bcrypt';
import { IAuthCreate } from './interfaces/authCreate.interface';
import { UserStatus } from  '../users/entities/user.entity';
import { CompleteProfileDto } from './dto/complete-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private generateToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    return this.jwtService.sign(payload);
  }

  async createUser(user: IAuthCreate) {
    if (user.password !== user.confirmPassword) {
      throw new BadRequestException('Las contraseñas deben ser iguales');
    }
    const passwordHash = await bcrypt.hash(user.password, 10);
    const userCreate = await this.userService.create({
      email: user.email,
      password: passwordHash,
      fullName: user.fullName,
      provider: AuthProvider.LOCAL,
      role: UserRole.ENTREPRENEUR,
    });
    return {
      message: 'Usuario registrado con éxito',
      token: this.generateToken(userCreate),
    };
  }

  async loginUser(credentials: ILoginUser) {
    const userFound = await this.userService.findByEmail(credentials.email);
    if (!userFound) {
      throw new UnauthorizedException('El email o la contraseña son incorrectos');
    } else if (userFound.provider === AuthProvider.GOOGLE) {
      throw new UnauthorizedException('usá Google para iniciar sesión');
    } else if (
      !userFound.password ||
      !(await bcrypt.compare(credentials.password, userFound.password))
    ) {
      throw new UnauthorizedException('El email o la contraseña son incorrectos');
    } else {
      const token = this.generateToken(userFound);
      return {
        Message: 'Usuario logueado con éxito',
        token,
      };
    }
  }

  async googleLogin(user: IGoogleUser): Promise<{ token?: string; tempToken?: string; requiresProfileCompletion: boolean, role?: UserRole | null }> {
    
  let userFound = await this.userService.findByEmail(user.email);
  

  if (!userFound) {
    // Crear usuario pendiente
    try{
      userFound = await this.userService.create({
      email: user.email,
      fullName: user.fullName,
      googleId: user.googleId,
      password: null,
      avatar: user.avatar,
      provider: AuthProvider.GOOGLE,
      role: null,
      status: UserStatus.PENDING_PROFILE,
    });
    console.log(userFound)
    const tempToken = this.jwtService.sign(
      { sub: userFound.id, purpose: 'profile-completion' },
      { expiresIn: '1h' }
    );
    return { tempToken, requiresProfileCompletion: true };
    }
    catch(e){
      console.log(e)
      }
    return { requiresProfileCompletion: true, tempToken: undefined };
  }

  if (userFound.status === UserStatus.PENDING_PROFILE) {
    const tempToken = this.jwtService.sign(
      { sub: userFound.id, purpose: 'profile-completion' },
      { expiresIn: '1h' }
    );
    return { tempToken, requiresProfileCompletion: true };
  }

  // Usuario activo → login normal
  const token = this.generateToken(userFound);
  return { token, requiresProfileCompletion: false, role:userFound.role };
}

async completeProfile(dto: CompleteProfileDto) {
  try {
    const payload = this.jwtService.verify(dto.tempToken);
    if (payload.purpose !== 'profile-completion') {
      throw new UnauthorizedException('Token inválido');
    }
    const updatedUser = await this.userService.completeProfile(
      payload.sub,
      dto.role,
      dto.gender,
    );
    const token = this.generateToken(updatedUser);
    return { token };
  } catch {
    throw new UnauthorizedException('Token expirado o inválido');
  }
}
}
