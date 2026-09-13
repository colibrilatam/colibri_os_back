Plan de Acción para Reducción de Riesgo Técnico y Deuda Técnica
Visión General
Este documento establece un plan priorizado para abordar los problemas técnicos identificados en el código base, ordenados por nivel de riesgo y impacto potencial. El enfoque se centra en mitigar riesgos críticos primero, seguido de mejoras de mantenibilidad y rendimiento.

Orden de Prioridad
🔴 Prioridad 1: Crítico (Abordar Inmediatamente - Semana 1)
Riesgo: Fallos directos en funcionalidad crítica que afectan a usuarios y podrían provocar pérdida de confianza o brechas de seguridad.

1. Flujo de Autenticación con Google (Condición de Carrera)
Problema: En src/auth/auth.service.ts, el método googleLogin retorna tempToken: undefined cuando falla la creación de usuario por condición de carrera, causando fallos en redirección frontend.
Acción:
// Reemplazar el bloque catch actual con:
catch(e){
  console.log('Error creating user during Google login:', e);
  // Reintentar búsqueda del usuario (posiblemente creado por otra solicitud)
  userFound = await this.userService.findByEmail(user.email);
  if (userFound && userFound.status === UserStatus.PENDING_PROFILE) {
    const tempToken = this.jwtService.sign(
      { sub: userFound.id, purpose: 'profile-completion' },
      { expiresIn: '1h' }
    );
    return { tempToken, requiresProfileCompletion: true };
  }
  throw new InternalServerErrorException('Error durante la autenticación con Google');
}
Esfuerzo: 2-4 horas
Validación: Pruebas de carga concurrentes simulando condiciones de carrera
2. Método createUser (169 aristas - Posible Cuello de Botella)
Problema: Método central altamente conectado que podría contener operaciones no transaccionales o pesadas.
Acción:
Revisar transaccionalidad (usar @Transaction() o equivalent)
Verificar ausencia de operaciones síncronas pesadas (hashing, llamadas externas)
Añadir logging de performance si se supera umbral (ej. >100ms)
Esfuerzo: 4-6 horas (revisión + posibles optimizaciones)
Validación: Benchmark antes/después con carga simulada
🟡 Prioridad 2: Alto (Semana 2-3)
Riesgo: Degradación de rendimiento, mantenibilidad o fiabilidad que podría acumularse y causar incidentes futuros.

3. Manejo Inconsistente de Errores y Logging
Problema: Bloques try-catch que solo registran errores y continúan (ej. console.log(e) sin rethrow o manejo apropiado), llevando a fallos silenciosos.
Acción:
Establecer estándar:
Nunca silenciar errores sin logging apropiado + contexto
Usar logger estructurado (winston/pino) con niveles apropiados
Siempre rethrow o transformar en excepción de dominio
Crear regla ESLint personalizada para detectar catch vacío o solo con console.log
Revisar y fixear los 10 casos más críticos (basados en impacto)
Esfuerzo: 8-12 horas (estándar + revisión inicial)
Validación: Auditoría de código + pruebas de inyección de fallos
4. Tests End-to-End Frágiles (project-authorization.e2e-spec.ts - 151 aristas)
Problema: Test E2E que toca demasiadas partes del sistema, lento y difícil de mantener.
Acción:
Descomponer en tests más pequeños y enfocados por funcionalidad
Aplicar patrón de Testing Trophy: más unitarios, menos E2E
Mockear servicios externos y dependencias de base de datos donde sea apropiado
Implementar estrategia de datos de prueba (fixtures/factories)
Esfuerzo: 6-10 horas (refactorización inicial)
Validación: Tiempo de ejecución de tests reducido en 50% + mayor estabilidad
🟢 Prioridad 3: Medio (Semana 4-6)
Riesgo: Deuda técnica que afecta velocidad de desarrollo y calidad a largo plazo.

5. Optimización de Métodos Altamente Conectados Adicionales
Problema: authHeader (148 aristas) y verifyOwnershipEvent (134 aristas) podrían tener ineficiencias.
Acción:
authHeader:
Verificar caché de datos de usuario (evitar DB hit por request)
Asegurar ausencia de efectos secundarios
verifyOwnershipEvent:
Implementar timeouts y circuit breaker para dependencias externas
Considerar procesamiento asíncrono para operaciones largas
Esfuerzo: 6-8 horas por método
Validación: Pruebas de carga y monitoreo de latencia
6. Revisión de Migraciones y Índices de Base de Datos
Problema: Posibles índices faltantes en columnas usadas en WHERE/JOIN/ORDER BY, migraciones largas sin manejo apropiado.
Acción:
Analizar slow queries log (si disponible) o usar EXPLAIN en consultas críticas
Añadir índices donde sea beneficioso (evitar sobre-indexación)
Revisar migraciones para:
Ejecución en lotes para grandes volúmenes
Validación de datos durante migración
Procedimientos de rollback testeados
Esfuerzo: 8-12 horas (DBA/dev colaborativo)
Validación: Mejora en tiempos de consulta + pruebas de migración en staging
7. Reducción de Duplicación de Código
Problema: DTOs similares, lógica de validación repetida, métodos de servicio con implementaciones similares.
Acción:
Extraer clases base o tipos mapeados para DTOs similares (create/update)
Mover lógica de validación a Pipes de NestJS (reutilizable)
Identificar y extraer servicios comunes entre módulos (ej. manejo de archivos, notificaciones)
Esfuerzo: 10-15 horas (refactorización incremental)
Validación: Cobertura de tests mantenida + reducción en líneas de código duplicado
🔵 Prioridad 4: Bajo (Mes 2+)
Riesgo: Mejores prácticas y higiene que previenen acumulación futura de deuda.

8. Revisión de Seguridad
Problema: Posibles gaps en rate limiting, manejo de datos sensibles, headers de seguridad.
Acción:
Implementar rate limiting en endpoints de autenticación (usando @Throttle o middleware)
Auditar logs para asegurar ausencia de datos sensibles (passwords, tokens)
Verificar implementation de headers de seguridad (CSP, HSTS, X-Frame-Options)
Revisar uso adecuado de sanitization y validation en todos los endpoints de entrada
Esfuerzo: 6-8 horas
Validación: Pentest interno o uso de herramientas como OWASP ZAP
9. Auditoría y Actualización de Dependencias
Problema: Vulnerabilidades conocidas, paquetes desactualizados, dependencias no utilizadas.
Acción:
Ejecutar npm audit y fixear vulnerabilidades críticas
Revisar package.json para actualizaciones menores/seguras
Eliminar dependencias no utilizadas (usando depcheck o similar)
Considerar implementar Dependabot para monitoreo continuo
Esfuerzo: 4-6 horas (inicial) + mantenimiento continuo
Validación: Informe de auditoría limpio + build exitoso con versiones actualizadas
10. Mejora de Arquitectura y Dependencias
Problema: Posibles dependencias circulares, separación de capas imperfecta.
Acción:
Usar herramienta como madge para detectar dependencias circulares
Revisar adherence a patrón Controlador → Servicio → Repositorio
Verificar inyección de dependencias para testabilidad
Considerar introducción de capas de aplicación (use cases) para lógica de negocio compleja
Esfuerzo: 8-12 horas (análisis + refactorización dirigida)
Validación: Gráfico de dependencias limpio + tests unitarios más fáciles de escribir
Métricas de Éxito
Corto plazo (1 mes):
0 incidentes de producción relacionados con login de Google
Reducción del 30% en tiempo de ejecución del suite de tests
Cobertura de tests unitarios >80% en servicios críticos (auth, user, nft)
Medio plazo (3 meses):
Latencia p95 de APIs críticas < 200ms
0 hallazgos críticos en auditorías de seguridad internas
Tiempo promedio para merge de PR < 24 horas (indicando menor complejidad)
Largo plazo (6+ meses):
Índice de deuda técnica (medido por herramientas como SonarQube) reducido en 40%
Satisfacción del equipo de desarrollo > 4/5 en encuestas de mantenibilidad
Aproximación de Esfuerzo Total
Prioridad	Esfuerzo Estimado
Prioridad 1 (Crítico)	6-10 horas
Prioridad 2 (Alto)	14-22 horas
Prioridad 3 (Medio)	20-35 horas
Prioridad 4 (Bajo)	18-26 horas
Total estimado	58-93 horas (aprox. 1.5-2.5 semanas de esfuerzo dedicado)
Recomendaciones de Implementación
Enfoque Incremental: Abordar un issue de alta prioridad por sprint, mezclado con trabajo de features
Pair Programming: Para issues complejos (como el fix de login) para asegurar calidad y conocimiento compartido
Definition of Done Actualizada: Incluir revisión de deuda técnica relacionada en cada ticket
Métricas Visibles: Mostrar progreso en burndown de deuda técnica en reuniones de equipo
Retrospectivas Enfocadas: Dedicar tiempo en retrospectivas para discutir hallazgos de deuda técnica
Conclusión
Este plan aborda los riesgos más críticos primero (autenticación y puntos de fallo potencial) mientras establece las bases para mejoras sostenibles de mantenibilidad y rendimiento. Al seguir este orden de prioridad, el equipo reducirá significativamente el riesgo de incidentes graves mientras mejora gradualmente la salud general del código base.

TL;DR: Enfóquese primero en arreglar el flujo de login de Google (crítico), luego los métodos altamente conectados y el manejo de errores (alto riesgo), seguido de optimizaciones de tests y base de datos (medio), y finalmente mejoras de seguridad, dependencias y arquitectura (bajo). El esfuerzo total estimado es de 2-3 semanas de trabajo dedicado.
