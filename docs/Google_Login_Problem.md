```JavaScript
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
