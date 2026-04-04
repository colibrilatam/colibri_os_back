// src/google-drive/google-drive.service.ts

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3 } from 'googleapis';
import { JWT } from 'google-auth-library';

export interface ResumableUploadSession {
  uploadUrl: string;
  driveFileName: string;
  folderId: string;
}

export interface DriveFileMetadata {
  fileId: string;
  webViewLink: string | null | undefined;
  webContentLink: string | null | undefined;
  mimeType: string | null | undefined;
  size: string | null | undefined;
  name: string | null | undefined;
}

// MIME types permitidos para evidencias
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  // Documentos
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  // Imágenes
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  // Videos
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/webm': 'webm',
  // Presentaciones
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  // Hojas de cálculo
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private driveClient: drive_v3.Drive;

  constructor(private readonly configService: ConfigService) {
    this.initializeDriveClient();
  }

  // ─── Inicialización ───────────────────────────────────────────────────────────

  private initializeDriveClient(): void {
    try {
      const clientEmail = this.configService.get<string>(
        'googleDrive.clientEmail',
      );
      const privateKey = this.configService.get<string>(
        'googleDrive.privateKey',
      );

      const auth = new JWT({
        email: clientEmail,
        key: privateKey,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
        ],
      });

      this.driveClient = google.drive({ version: 'v3', auth });
      this.logger.log('Google Drive client inicializado correctamente');
    } catch (error) {
      this.logger.error('Error al inicializar Google Drive client', error);
      throw new InternalServerErrorException(
        'Error al inicializar Google Drive',
      );
    }
  }

  // ─── Generar URL de subida resumable ─────────────────────────────────────────
  // El backend genera la URL → el frontend sube directo a Drive sin pasar por el backend
  // Esto es más eficiente para archivos grandes (videos, PDFs pesados, etc.)

  async generateResumableUploadUrl(
    fileName: string,
    mimeType: string,
    projectId: string,
    evidenceId: string,
  ): Promise<ResumableUploadSession> {
    this.validateMimeType(mimeType);

    // FIX: garantizamos que folderId sea string (nunca undefined)
    const folderId = this.configService.get<string>(
      'googleDrive.evidenceFolderId',
    ) ?? '';

    // Nombre estructurado para trazabilidad en Drive
    const driveFileName = this.buildFileName(
      fileName,
      projectId,
      evidenceId,
    );

    try {
      // FIX: casteamos a 'any' para que TypeScript no se confunda con los
      // overloads de files.create() — el tipo de retorno concreto lo manejamos abajo
      const res = await (this.driveClient.files.create(
        {
          requestBody: {
            name: driveFileName,
            parents: [folderId],
            // Metadata extra para trazabilidad
            description: `Evidence: ${evidenceId} | Project: ${projectId}`,
            appProperties: {
              evidenceId,
              projectId,
            },
          },
          media: {
            mimeType,
          },
          // uploadType resumable devuelve una URL de sesión
          uploadType: 'resumable',
          fields: 'id, name, webViewLink, webContentLink',
        },
        {
          // Esto activa el upload resumable y devuelve la Location header
          headers: {
            'X-Upload-Content-Type': mimeType,
          },
        },
      ) as any);

      // La URL de la sesión viene en el header Location de la respuesta
      const uploadUrl =
        (res.headers as Record<string, string>)['location'] ?? '';

      if (!uploadUrl) {
        throw new InternalServerErrorException(
          'Google Drive no devolvió una URL de upload',
        );
      }

      this.logger.log(
        `URL de upload generada para evidence ${evidenceId}`,
      );

      return {
        uploadUrl,
        driveFileName,
        folderId,
      };
    } catch (error) {
      this.logger.error(
        `Error generando URL de upload para evidence ${evidenceId}`,
        error,
      );
      throw new InternalServerErrorException(
        'No se pudo generar la URL de subida a Google Drive',
      );
    }
  }

  // ─── Obtener metadata de un archivo ya subido ─────────────────────────────────

  async getFileMetadata(fileId: string): Promise<DriveFileMetadata> {
    try {
      const res = await this.driveClient.files.get({
        fileId,
        fields: 'id, name, webViewLink, webContentLink, mimeType, size',
      });

      return {
        // FIX: res.data.id puede ser null | undefined, garantizamos string con ?? ''
        fileId: res.data.id ?? '',
        webViewLink: res.data.webViewLink,
        webContentLink: res.data.webContentLink,
        mimeType: res.data.mimeType,
        size: res.data.size,
        name: res.data.name,
      };
    } catch (error) {
      this.logger.error(
        `Error obteniendo metadata del archivo ${fileId}`,
        error,
      );
      throw new InternalServerErrorException(
        'No se pudo obtener la información del archivo de Google Drive',
      );
    }
  }

  // ─── Hacer el archivo accesible (compartir con cualquiera que tenga el link) ──

  async makeFileAccessible(fileId: string): Promise<void> {
    try {
      await this.driveClient.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      this.logger.log(`Archivo ${fileId} accesible via link`);
    } catch (error) {
      this.logger.error(
        `Error configurando permisos del archivo ${fileId}`,
        error,
      );
      throw new InternalServerErrorException(
        'No se pudo configurar el acceso al archivo',
      );
    }
  }

  // ─── Revocar acceso público (cuando se cambia privacidad) ─────────────────────

  async revokePublicAccess(fileId: string): Promise<void> {
    try {
      // Buscamos el permiso "anyone"
      const permissions = await this.driveClient.permissions.list({
        fileId,
        fields: 'permissions(id, type)',
      });

      const anyonePermission = permissions.data.permissions?.find(
        (p) => p.type === 'anyone',
      );

      if (anyonePermission?.id) {
        await this.driveClient.permissions.delete({
          fileId,
          permissionId: anyonePermission.id,
        });
      }
    } catch (error) {
      this.logger.error(
        `Error revocando acceso del archivo ${fileId}`,
        error,
      );
      throw new InternalServerErrorException(
        'No se pudo revocar el acceso al archivo',
      );
    }
  }

  // ─── Eliminar archivo de Drive ────────────────────────────────────────────────

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.driveClient.files.delete({ fileId });
      this.logger.log(`Archivo ${fileId} eliminado de Drive`);
    } catch (error) {
      this.logger.error(
        `Error eliminando archivo ${fileId} de Drive`,
        error,
      );
      throw new InternalServerErrorException(
        'No se pudo eliminar el archivo de Google Drive',
      );
    }
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────────

  private validateMimeType(mimeType: string): void {
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      throw new InternalServerErrorException(
        `Tipo de archivo no permitido: ${mimeType}. ` +
          `Tipos aceptados: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`,
      );
    }
  }

  private buildFileName(
    originalName: string,
    projectId: string,
    evidenceId: string,
  ): string {
    const timestamp = Date.now();
    const sanitized = originalName
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .toLowerCase();

    // Formato: proj_{shortId}_ev_{shortId}_{timestamp}_{nombre}
    return `proj_${projectId.slice(0, 8)}_ev_${evidenceId.slice(0, 8)}_${timestamp}_${sanitized}`;
  }
}