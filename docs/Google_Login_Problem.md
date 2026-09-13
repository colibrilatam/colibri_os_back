# Informe de Problema: Login con Google - Token Undefined

```script
Input
google login
Result
Found 10 matches grouped by process:

NO PROCESS (10 matches)
[1] File: auth.controller.ts [score: 12.12]
    ID: 
    File: src/auth/auth.controller.ts
    Cluster: Unclustered
    Found by: hybrid
[2] File: google-exchange.dto.ts [score: 12.11]
    ID: 
    File: src/auth/dto/google-exchange.dto.ts
    Cluster: Unclustered
    Found by: hybrid
[3] File: env.validation.ts [score: 8.36]
    ID: 
    File: src/config/env.validation.ts
    Cluster: Unclustered
    Found by: hybrid
[4] File: google.strategy.ts [score: 7.73]
    ID: 
    File: src/auth/google/google.strategy.ts
    Cluster: Unclustered
    Found by: hybrid
[5] File: auth.service.ts [score: 7.32]
    ID: 
    File: src/auth/auth.service.ts
    Cluster: Unclustered
    Found by: hybrid
[6] File: oauth-exchange-code.entity.ts [score: 7.21]
    ID: 
    File: src/auth/oauth/oauth-exchange-code.entity.ts
    Cluster: Unclustered
    Found by: hybrid
[7] File: refresh-token.dto.ts [score: 7.05]
    ID: 
    File: src/auth/dto/refresh-token.dto.ts
    Cluster: Unclustered
    Found by: hybrid
[8] File: oauth-state.store.ts [score: 4.17]
    ID: 
    File: src/auth/google/oauth-state.store.ts
    Cluster: Unclustered
    Found by: hybrid
[9] File: README.md [score: 3.79]
    ID: 
    File: test/QA/README.md
    Cluster: Unclustered
    Found by: hybrid
[10] File: user.entity.ts [score: 3.16]
    ID: 
    File: src/users/entities/user.entity.ts
    Cluster: Unclustered
    Found by: hybrid
Input
{
  "filePath": "src/auth/google/google.strategy.ts"
}

---
Result
File: src/auth/google/google.strategy.ts (32 lines)

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthProvider } from 'src/users/entities/user.entity';
import type { IGoogleUser } from '../interfaces/googleUser.interface';
import { OAuthStateStore } from './oauth-state.store';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['profile', 'email'],
      // OAUTH-001: state anti-CSRF sin depender de express-session.
      state: true,
      store: new OAuthStateStore(),
    });
  }

  validate(accessToken: string, refreshToken: string, profile: Profile): IGoogleUser {
    return {
      email: profile.emails![0].value,
      fullName: profile.displayName,
      googleId: profile.id,
      avatar: profile.photos![0].value,
      provider: AuthProvider.GOOGLE,
    };
  }
}
Input
{
  "filePath": "src/auth/auth.controller.ts"
}
Result
File: src/auth/auth.controller.ts (127 lines)

import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleExchangeDto } from './dto/google-exchange.dto';
import { clearAuthCookie, setAuthCookie } from './cookie.helper';
import type { Request, Response } from 'express';
import type { IGoogleUser } from './interfaces/googleUser.interface';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { OAuthExchangeService } from './oauth/oauth-exchange.service';
import { Throttle } from '@nestjs/throttler';
import { Ip } from '@nestjs/common';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetService } from './password-reset/password-reset.service';

type GoogleAuthenticatedRequest = Request & { user: IGoogleUser };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthExchangeService: OAuthExchangeService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @UseGuards(AuthGuard('google'))
  @Get('google')
  async getGoogle() {}

  /**
   * OAUTH-001: ya no emite el JWT acá. El guard de passport valida el
   * `state` (ver OAuthStateStore) antes de llegar a este handler. Si es
   * válido, resolvemos el usuario y solo redirigimos con un código opaco
   * de un solo uso; el JWT se emite recién cuando el frontend lo canjea
   * en POST /auth/google/exchange.
   */
  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async getGoogleCallback(@Req() req: GoogleAuthenticatedRequest, @Res() res: Response) {
  
  const result = await this.authService.googleLogin(req.user);
  const isProduction = process.env.NODE_ENV === 'production';

  if (result.requiresProfileCompletion) {
    const redirectUrl = `${process.env.FRONTEND_URL}/login/google-callback?tempToken=${result.tempToken}`;
    return res.redirect(redirectUrl);
  }
  res.cookie('colibri_access_token', result.token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: Number(process.env.AUTH_COOKIE_MAX_AGE_MS ?? 3_600_000),
    path: '/',
  });

  return res.redirect(`${process.env.FRONTEND_URL}/login/google-callback?role=${result.role}`);
}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('google/exchange')
  @HttpCode(200)
  async exchangeGoogleCode(
    @Body() dto: GoogleExchangeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.oauthExchangeService.consume(dto.code);
    const result = this.authService.buildAuthResult(user);
    setAuthCookie(res, result.token);
    ret

... (truncated)
Input
googleLogin
Result
Found 2 matches grouped by process:

NO PROCESS (2 matches)
[1] File: auth.service.ts [score: 4.88]
    ID: 
    File: src/auth/auth.service.ts
    Cluster: Unclustered
    Found by: hybrid
[2] File: auth.controller.ts [score: 4.47]
    ID: 
    File: src/auth/auth.controller.ts
    Cluster: Unclustered
    Found by: hybrid

---

Input
{
  "filePath": "src/auth/auth.service.ts"
}
Result
File: src/auth/auth.service.ts (185 lines)

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
      throw new Unau

... (truncated)
```

---

# Informe de Problema: Login con Google - Token Undefined

## Resumen
Durante el flujo de autenticación con Google, cuando ocurre una condición de carrera al crear un nuevo usuario (por ejemplo, dos solicitudes simultáneas intentan crear el mismo usuario), el método `googleLogin` en `src/auth/auth.service.ts` retorna un `tempToken` indefinido cuando se requiere completar el perfil. Esto causa que el controlador de autenticación construya una URL de redirección con `tempToken=undefined`, lo que probablemente falle en el frontend.

## Ubicación
- **Archivo**: `src/auth/auth.service.ts`
- **Método**: `googleLogin`
- **Líneas aproximadas**: 70-85 (bloque try-catch interno)

## Causa Raíz
En el método `googleLogin`, cuando no se encuentra un usuario existente (`!userFound`), se intenta crear uno nuevo dentro de un bloque `try`. Si esta creación falla (por ejemplo, por error de duplicado único en la base de datos debido a una condición de carrera), el bloque `catch` registra el error y luego retorna:
```typescript
return { requiresProfileCompletion: true, tempToken: undefined };
```
Este `tempToken` indefinido se propaga al controlador, que intenta usarlo en una URL de redirección.

## Impacto
- El frontend recibe una URL de redirección como `/login/google-callback?tempToken=undefined`
- Esto probablemente cause errores al intentar procesar el token en el cliente (por ejemplo, fallos en la validación de JWT, comportamiento inesperado)
- Los usuarios pueden quedar atrapados en un bucle de redirección o ver errores de autenticación

## Código Problemático
```typescript
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
  return { requiresProfileCompletion: true, tempToken: undefined }; // <-- PROBLEMA AQUÍ
}
```

## Solución Sugerida
En lugar de retornar inmediatamente un `tempToken` indefinido en el `catch`, debemos:
1. Registrar el error (como se hace actualmente)
2. **Reintentar la búsqueda del usuario** por email (por si fue creado por otra solicitud entre el fallo de creación y el catch)
3. Si el usuario ahora existe y está en estado `PENDING_PROFILE`, generar un `tempToken` válido
4. Si persiste algún otro error, manejarlo apropiadamente (por ejemplo, lanzar una excepción)

### Código Corregido (Propuesta)
```typescript
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
      console.log('Error creating user during Google login:', e);
      // En caso de error (ej. duplicado), buscar nuevamente el usuario
      userFound = await this.userService.findByEmail(user.email);
      if (userFound && userFound.status === UserStatus.PENDING_PROFILE) {
        const tempToken = this.jwtService.sign(
          { sub: userFound.id, purpose: 'profile-completion' },
          { expiresIn: '1h' }
        );
        return { tempToken, requiresProfileCompletion: true };
      }
      // Si aún no se encuentra o no está pendiente, lanzar error
      throw new InternalServerErrorException('Error durante la autenticación con Google');
    }
}
```

## Pruebas Recomendadas
1. Simular una condición de carrera mediante pruebas de carga concurrentes en el endpoint de login de Google
2. Verificar que en caso de error de creación, se genere correctamente un `tempToken` válido
3. Confirmar que el flujo de completación de perfil funciona tras el retry
4. Asegurar que otros errores (ej. problemas de JWT) aún sean manejados apropiadamente

## Notas Adicionales
- Este patrón de "retry después de fallo de creación" es común en sistemas distribuidos para manejar condiciones de carrera
- Considere agregar un identificador único tentativo (como un UUID basado en el email de Google) antes de la creación para evitar completamente la condición de carrera, aunque el retry es una solución más inmediata
- El bloque `catch` actual solo registraba el error y continuaba, lo que llevaba al retorno indefinido. Ahora manejamos activamente el caso de duplicado.

--- 
**TL;DR**: El método `googleLogin` en `src/auth/auth.service.ts` retorna `tempToken: undefined` cuando falla la creación de usuario por condición de carrera. Solución: tras el error, buscar nuevamente el usuario y generar un token válido si existe y está pendiente.
