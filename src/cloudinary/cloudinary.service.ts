import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as crypto from 'crypto';

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
}

export interface CloudinaryFileMetadata {
  publicId: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  bytes: number;
  originalFilename: string;
  version: string | null;
  providerChecksum: string | null;
}

// Tipos de recursos que acepta Cloudinary según el tipo de archivo
export const RESOURCE_TYPE_MAP: Record<string, 'image' | 'video' | 'raw'> = {
  // Imágenes
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  // Videos
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'video/x-msvideo': 'video',
  'video/webm': 'video',
  'video/mpeg': 'video',
  // Documentos y archivos (raw)
  'application/pdf': 'raw',
  'application/msword': 'raw',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'raw',
  'application/vnd.ms-powerpoint': 'raw',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'raw',
  'application/vnd.ms-excel': 'raw',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'raw',
  'text/plain': 'raw',
};

// Extensión real de archivo por MIME type — Cloudinary exige que el public_id
// de un recurso `raw` incluya la extensión (a diferencia de image/video, donde
// el formato se infiere aparte y no forma parte del public_id).
export const MIME_EXTENSION_MAP: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
};

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    this.initializeCloudinary();
  }

  // ─── Inicialización ───────────────────────────────────────────────────────────

  private initializeCloudinary(): void {
    const cloudName = this.configService.get<string>('cloudinary.cloudName');
    const apiKey = this.configService.get<string>('cloudinary.apiKey');
    const apiSecret = this.configService.get<string>('cloudinary.apiSecret');

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.logger.log('Cloudinary inicializado correctamente');
  }

  // ─── Generar firma para upload directo desde el frontend ──────────────────────
  // El frontend usa esta firma para subir directo a Cloudinary sin pasar por el backend
  // Más info: https://cloudinary.com/documentation/upload_images#signed_upload

  generateUploadSignature(
    projectId: string,
    evidenceId: string,
    mimeType: string,
  ): CloudinarySignature {
    this.validateMimeType(mimeType);

    const apiSecret = this.getRequiredConfig('cloudinary.apiSecret');
    const apiKey = this.getRequiredConfig('cloudinary.apiKey');
    const cloudName = this.getRequiredConfig('cloudinary.cloudName');

    const resourceType = this.getResourceType(mimeType);
    const timestamp = Math.round(Date.now() / 1000);
    const folder = `colibri/evidences/project_${projectId.slice(0, 8)}`;
    const basePublicId = `ev_${evidenceId.slice(0, 8)}_${timestamp}`;

    // Para recursos `raw`, la extensión real va incluida en el public_id
    // firmado; para image/video no corresponde (Cloudinary la infiere sola).
    const extension = resourceType === 'raw' ? MIME_EXTENSION_MAP[mimeType] : null;
    const publicId = extension ? `${basePublicId}.${extension}` : basePublicId;

    // Parámetros que se firman — deben coincidir exactamente con lo que el frontend envía
    const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;

    // Generamos la firma HMAC-SHA256
    const signature = crypto
      .createHash('sha256')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    this.logger.log(`Firma de upload generada para evidence ${evidenceId}`);

    return {
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder,
      publicId,
      resourceType,
    };
  }

  // ─── Verificar que un archivo subido realmente existe en Cloudinary ───────────

  async getFileMetadata(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'raw',
  ): Promise<CloudinaryFileMetadata> {
    try {
      const result = (await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      })) as {
        public_id: string;
        secure_url: string;
        format: string;
        resource_type: string;
        bytes: number;
        original_filename?: string;
        version?: number;
        etag?: string;
      };

      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
        originalFilename: result.original_filename ?? publicId,
        version: result.version ? String(result.version) : null,
        providerChecksum: result.etag ?? null,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo metadata del archivo ${publicId}`, error);
      throw new InternalServerErrorException('No se pudo verificar el archivo en Cloudinary');
    }
  }

  // ─── Eliminar archivo de Cloudinary ──────────────────────────────────────────

  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'raw',
  ): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      this.logger.log(`Archivo ${publicId} eliminado de Cloudinary`);
    } catch (error) {
      this.logger.error(`Error eliminando archivo ${publicId} de Cloudinary`, error);
      throw new InternalServerErrorException('No se pudo eliminar el archivo de Cloudinary');
    }
  }

  // ─── Obtener resourceType a partir del mimeType ───────────────────────────────

  getResourceType(mimeType: string): 'image' | 'video' | 'raw' {
    return RESOURCE_TYPE_MAP[mimeType] ?? 'raw';
  }

  // ─── Helper privado ───────────────────────────────────────────────────────────

  private validateMimeType(mimeType: string): void {
    if (!RESOURCE_TYPE_MAP[mimeType]) {
      throw new InternalServerErrorException(
        `Tipo de archivo no permitido: ${mimeType}. ` +
          `Tipos aceptados: ${Object.keys(RESOURCE_TYPE_MAP).join(', ')}`,
      );
    }
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new InternalServerErrorException(`Falta variable de configuración requerida: ${key}`);
    }
    return value;
  }

  async uploadImage(file: Express.Multer.File): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'colibri/projects' }, (error, result) => {
          if (error) {
            const rawMessage = (error as { message?: unknown }).message;
            const message =
              typeof rawMessage === 'string'
                ? rawMessage
                : 'Error desconocido al subir el archivo a Cloudinary';
            reject(new Error(message));
            return;
          }
          resolve(result as { secure_url: string });
        })
        .end(file.buffer);
    });
  }

  async uploadVersionFile(
    file: Express.Multer.File,
    instanceId: string,
  ): Promise<{ secure_url: string; public_id: string }> {
    const resourceType = this.getResourceType(file.mimetype);
    const timestamp = Date.now();
    const publicId = `ver_${instanceId.slice(0, 8)}_${timestamp}`;

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'colibri/versions',
            public_id: publicId,
            resource_type: resourceType,
          },
          (error, result) => {
            if (error) {
              const rawMessage = (error as { message?: unknown }).message;
              const message =
                typeof rawMessage === 'string'
                  ? rawMessage
                  : 'Error desconocido al subir el archivo a Cloudinary';
              reject(new Error(message));
              return;
            }
            resolve(result as { secure_url: string; public_id: string });
          },
        )
        .end(file.buffer);
    });
  }
}

