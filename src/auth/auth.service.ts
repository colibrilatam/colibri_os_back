import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { IGoogleUser } from './interfaces/googleUser.interface';
import { AuthProvider, User, UserRole, UserStatus } from 'src/users/entities/user.entity';
import { ILoginUser } from './interfaces/loginUser.interface';
import bcrypt from 'bcrypt';
import { IAuthCreate } from './interfaces/authCreate.interface';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { SessionsService } from './sessions/sessions.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
  ) {}

  private generateToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      sessionVersion: user.sessionVersion,
    };
    return this.jwtService.sign(payload);
  }

  /** Emite el par access token + refresh token para una sesión nueva. */
  private async issueSession(user: User) {
    const token = this.generateToken(user);
    const refreshToken = await this.sessionsService.issueRefreshToken(user);
    return { token, refreshToken };
  }

  private assertActive(user: User) {
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('La cuenta está inactiva o suspendida');
    }
  }

  /** Arma la respuesta pública (token + datos del usuario) para un usuario ya resuelto. */
  buildAuthResult(user: User) {
    return {
      token: this.generateToken(user),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      },
    };
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
      user: {
        id: userCreate.id,
        email: userCreate.email,
        fullName: userCreate.fullName,
        role: userCreate.role,
        status: userCreate.status,
      },
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
        message: 'Usuario logueado con éxito',
        token,
        user: {
          id: userFound.id,
          email: userFound.email,
          fullName: userFound.fullName,
          role: userFound.role,
          status: userFound.status,
        },
      };
    }
  }

  async googleLogin(user: IGoogleUser): Promise<{ user?: User; tempToken?: string; requiresProfileCompletion: boolean }> {
    
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
  return { user: userFound, requiresProfileCompletion: false };
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
    return { token, user: updatedUser };
  } catch {
    throw new UnauthorizedException('Token expirado o inválido');
  }
}

  /** Rota un refresh token válido y emite un nuevo par de tokens. */
  async refresh(rawRefreshToken: string) {
    const { user, refreshToken } = await this.sessionsService.rotateRefreshToken(rawRefreshToken);
    const token = this.generateToken(user);
    return { token, refreshToken };
  }

  /** Cierra la sesión actual revocando su refresh token. */
  async logout(rawRefreshToken: string) {
    await this.sessionsService.revokeRefreshToken(rawRefreshToken);
    return { message: 'Sesión cerrada correctamente' };
  }

}