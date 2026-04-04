// src/google-drive/google-drive.config.ts

export interface GoogleDriveConfig {
  clientEmail: string;
  privateKey: string;
  evidenceFolderId: string;
}

export const googleDriveConfig = (): { googleDrive: GoogleDriveConfig } => ({
  googleDrive: {
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? '',
    privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
    evidenceFolderId: process.env.GOOGLE_DRIVE_EVIDENCE_FOLDER_ID ?? '',
  },
});