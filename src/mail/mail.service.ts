import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface MicroActionSubmittedMail {
  instanceId: string;
  microActionType: string | null;
  instructions: string | null;
  executionNotes: string | null;
  fileName: string | null;
  entrepreneurName: string | null;
  entrepreneurEmail: string | null;
  uploadedAt: Date;
  recipients: string[];
}

export class MailNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MailNotConfiguredError';
  }
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (c) => entities[c]);
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  /** Destinatarios por defecto: MAIL_TO (acepta varios separados por coma). */
  getDefaultRecipients(): string[] {
    return (this.config.get<string>('MAIL_TO') ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'MAIL_TO'];
    const missing = required.filter((key) => !this.config.get(key));
    if (missing.length > 0) {
      throw new MailNotConfiguredError(`Faltan variables SMTP: ${missing.join(', ')}`);
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: Number(this.config.get('SMTP_PORT')),
      secure: String(this.config.get('SMTP_SECURE') ?? 'false').toLowerCase() === 'true',
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    return this.transporter;
  }

  async sendMicroActionSubmitted(data: MicroActionSubmittedMail): Promise<void> {
    const transporter = this.getTransporter();

    const details = {
      instanceId: escapeHtml(data.instanceId),
      microActionType: escapeHtml(data.microActionType || 'No especificado'),
      instruction: escapeHtml(data.instructions || 'Sin instrucciones'),
      executionNotes: escapeHtml(data.executionNotes || 'Sin notas de ejecución'),
      fileName: escapeHtml(data.fileName || 'Sin archivo'),
      fullName: escapeHtml(data.entrepreneurName || 'No especificado'),
      userEmail: escapeHtml(data.entrepreneurEmail || 'No especificado'),
      uploadDate: data.uploadedAt.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
      }),
    };

    const row = (label: string, value: string) => `
          <tr>
            <td><strong>${label}</strong></td>
            <td>${value}</td>
          </tr>`;

    await transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM'),
      to: data.recipients,
      subject: `Nueva microacción cargada: ${details.microActionType}`,
      text: `
Se cargó una nueva versión de una microacción en Colibrí OS.

ID de instancia: ${details.instanceId}
Tipo: ${details.microActionType}
Instrucciones: ${details.instruction}
Notas de ejecución: ${details.executionNotes}
Archivo: ${details.fileName}
Usuario: ${details.fullName}
Correo: ${details.userEmail}
Fecha: ${details.uploadDate}
      `,
      html: `
        <h2>Nueva microacción cargada</h2>
        <p>Se guardó una nueva versión de una microacción en Colibrí OS.</p>
        <table cellpadding="8" cellspacing="0" border="1"
          style="border-collapse:collapse;border-color:#ddd;">${
            row('ID de instancia', details.instanceId) +
            row('Tipo', details.microActionType) +
            row('Instrucciones', details.instruction) +
            row('Notas de ejecución', details.executionNotes) +
            row('Archivo', details.fileName) +
            row('Usuario', details.fullName) +
            row('Correo', details.userEmail) +
            row('Fecha', details.uploadDate)
          }
        </table>
      `,
    });

    this.logger.log(`Correo de microacción enviado (instancia ${data.instanceId})`);
  }
}
