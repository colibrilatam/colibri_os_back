// src/config/seed.constants.ts
//
// OPS-002: valor canónico de confirmación para seeds destructivas.
//
// Vive en un módulo neutro para que tanto el script de seed (que exige esta
// confirmación antes de ejecutar TRUNCATE ... CASCADE) como la validación de
// entorno (que impide que este valor quede activo en producción) compartan la
// misma fuente de verdad y no vuelvan a divergir.

export const DESTRUCTIVE_SEED_CONFIRMATION = 'yes-destroy-data';
