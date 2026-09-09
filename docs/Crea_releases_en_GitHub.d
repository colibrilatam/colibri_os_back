## Crear releases en GitHub para versionar tu app

Aquí tienes el flujo completo, desde tags hasta releases automatizados.

### 1. Versionado semántico (SemVer)

Usa el formato `vMAJOR.MINOR.PATCH` (ej. `v1.2.0`):
- **MAJOR**: cambios incompatibles / breaking changes
- **MINOR**: nuevas funcionalidades compatibles hacia atrás
- **PATCH**: bugfixes

### 2. Crear un tag y pushearlo

```bash
# Asegúrate de estar en el commit que quieres liberar
git tag -a v1.0.0 -m "Release v1.0.0: initial stable release"
git push origin v1.0.0

# Para pushear todos los tags de una vez
git push origin --tags
```

### 3. Crear el release desde GitHub CLI (recomendado)

```bash
# Instalar gh si no lo tienes
# https://cli.github.com/

gh auth login

# Crear release desde un tag existente
gh release create v1.0.0 \
  --title "v1.0.0" \
  --notes "Primera versión estable. Incluye X, Y, Z."

# Con changelog autogenerado
gh release create v1.0.0 --generate-notes

# Adjuntando binarios/artefactos
gh release create v1.0.0 dist/app-linux dist/app-windows.exe \
  --title "v1.0.0" \
  --generate-notes
```

### 4. Crear el release desde la interfaz web

1. Ve a tu repo → **Releases** (columna derecha, o `github.com/user/repo/releases`)
2. Click en **"Draft a new release"**
3. Click en **"Choose a tag"** → escribe el nombre (ej. `v1.0.0`) → **"Create new tag"**
4. Completa título y descripción (puedes usar **"Generate release notes"** para autogenerar changelog desde los PRs/commits mergeados)
5. Sube binarios/artefactos si aplica (arrastrar archivos)
6. Marca **"Set as a pre-release"** si es beta/RC, o **"Set as the latest release"**
7. **Publish release**

### 5. Automatizar con GitHub Actions

Esto es lo más útil si vas a hacer releases frecuentes — se dispara al pushear un tag `v*`:

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: |
          # tus comandos de build aquí
          npm install
          npm run build

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
          files: |
            dist/*
```

Con esto, cada `git tag vX.Y.Z && git push origin vX.Y.Z` dispara el build y publica el release automáticamente con los artefactos adjuntos.

### Tip práctico
Si quieres changelogs limpios automáticos, usa **Conventional Commits** (`feat:`, `fix:`, `chore:`) — GitHub's "Generate release notes" y herramientas como `release-please` los aprovechan para categorizar el changelog.

¿Es para norug.es/SWAT específicamente? Si me dices si despliegas como binario, Docker image, o npm package, te afino el workflow de Actions.
