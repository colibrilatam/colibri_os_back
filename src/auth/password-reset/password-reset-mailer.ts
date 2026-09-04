import { Injectable, Logger } from '@nestjs/common';

/**
 * Punto de extensión para el envío real del email de reset. Hoy no hay
 * ningún proveedor de email configurado en el proyecto (no hay nodemailer,
 * Resend, SendGrid, SES, etc.), así que esta implementación solo loguea el
 * link — sirve para desarrollo/QA, pero NO ENVÍA NINGÚN EMAIL REAL.
 *
 * Para producción: reemplazar el cuerpo de `sendResetLink` por la llamada a
 * tu proveedor (ej. Resend, SendGrid, SES) y cablear las credenciales via
 * ConfigService, igual que se hace con Cloudinary en
 * `src/cloudinary/cloudinary.config.ts`.
 */
@Injectable()
export class PasswordResetMailer {
  private readonly logger = new Logger(PasswordResetMailer.name);

  async sendResetLink(email: string, resetUrl: string): Promise<void> {
    // TODO: integrar proveedor real de email antes de ir a producción.
    this.logger.warn(
      `[STUB] Envío de email de reset NO implementado. ` +
        `Se hubiera enviado a ${email}: ${resetUrl}`,
    );
  }
}