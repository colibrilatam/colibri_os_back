import { DataSource, DeepPartial } from 'typeorm';
import { Tramo } from 'src/tramos/entities/tramo.entity';
import { UncertaintyType, RiskType } from 'src/curriculum/entities/curriculum.enums';

export async function seedTramos(dataSource: DataSource) {
  const repo = dataSource.getRepository(Tramo);

  const tramosData: DeepPartial<Tramo>[] = [
    {
      code: 'T1',
      name: 'Fase Fundacional',
      description:
        'Tramo inicial donde el emprendimiento se configura como proyecto real mediante la definición explícita del problema, hipótesis centrales y conformación efectiva del equipo.',
      sortOrder: 1,
      executionWindowDays: 30,
      isActive: true,
      // En T1 la incertidumbre es alta sobre si el problema existe y vale la pena.
      uncertaintyType: UncertaintyType.MARKET,
      primaryRiskType: RiskType.DESIRABILITY,
      associatedRisks: [
        'Problema no validado con usuarios reales',
        'Hipótesis central sin evidencia primaria',
        'Equipo incompleto o sin roles definidos',
      ],
      icFloor: 0.00,
      eligibilityRule: 'El proyecto debe tener al menos una hipótesis de problema documentada.',
      publicThreshold: 30.00,
    },
    {
      code: 'T2',
      name: 'Validación Temprana',
      description:
        'Tramo en el que el equipo contrasta sus hipótesis con usuarios reales y obtiene retroalimentación directa del mercado.',
      sortOrder: 2,
      executionWindowDays: 60,
      isActive: true,
      uncertaintyType: UncertaintyType.OPERATIONAL,
      primaryRiskType: RiskType.DESIRABILITY,
      associatedRisks: [
        'Solución propuesta no resuelta el problema validado',
        'Segmento objetivo mal definido',
        'Falta de disposición a pagar detectada',
      ],
      icFloor: 20.00,
      eligibilityRule: 'El proyecto debe haber completado al menos 5 entrevistas de descubrimiento documentadas.',
      publicThreshold: 45.00,
    },
    {
      code: 'T3',
      name: 'Prototipo Vivo',
      description:
        'Tramo en el que la propuesta se materializa en un prototipo o versión funcional sometida a prueba e iteración.',
      sortOrder: 3,
      executionWindowDays: 90,
      isActive: true,
      uncertaintyType: UncertaintyType.OPERATIONAL,
      primaryRiskType: RiskType.FEASIBILITY,
      associatedRisks: [
        'Prototipo no representa la propuesta de valor central',
        'Iteración sin métricas de aprendizaje definidas',
        'Stack técnico inadecuado para el alcance del MVP',
      ],
      icFloor: 35.00,
      eligibilityRule: 'El proyecto debe contar con una propuesta de valor validada y un prototipo navegable.',
      publicThreshold: 55.00,
    },
    {
      code: 'T4',
      name: 'Tracción Temprana',
      description:
        'Tramo caracterizado por señales repetidas de adopción y uso consistente por parte del mercado.',
      sortOrder: 4,
      executionWindowDays: 120,
      isActive: true,
      uncertaintyType: UncertaintyType.MARKET,
      primaryRiskType: RiskType.VIABILITY,
      associatedRisks: [
        'Retención de usuarios por debajo del umbral mínimo',
        'Modelo de negocio sin validación de disposición a pagar',
        'Crecimiento orgánico insostenible sin estructura operativa',
      ],
      icFloor: 50.00,
      eligibilityRule: 'El proyecto debe demostrar uso recurrente por al menos 10 usuarios activos.',
      publicThreshold: 65.00,
    },
    {
      code: 'T5',
      name: 'Producto Vivo',
      description:
        'Tramo en el que el emprendimiento consolida estructura organizacional y capacidad operativa sostenible.',
      sortOrder: 5,
      executionWindowDays: 180,
      isActive: true,
      uncertaintyType: UncertaintyType.MARKET,
      primaryRiskType: RiskType.VIABILITY,
      associatedRisks: [
        'Estructura interna sin roles claros ni procesos definidos',
        'Dependencia de fundadores para operaciones críticas',
        'Financiamiento insuficiente para sostener la operación',
      ],
      icFloor: 65.00,
      eligibilityRule: 'El proyecto debe tener ingresos recurrentes y equipo operativo consolidado.',
      publicThreshold: 75.00,
    },
    {
      code: 'T6',
      name: 'Líder Transformador',
      description:
        'Tramo en el que el emprendimiento alcanza impacto verificable y ejerce influencia en su ecosistema.',
      sortOrder: 6,
      executionWindowDays: 120,
      isActive: true,
      uncertaintyType: UncertaintyType.OPERATIONAL,
      primaryRiskType: RiskType.FEASIBILITY,
      associatedRisks: [
        'Impacto no medido ni documentado con métricas verificables',
        'Ecosistema sin alianzas estratégicas activas',
        'Modelo no replicable en otros mercados o contextos',
      ],
      icFloor: 80.00,
      eligibilityRule: 'El proyecto debe demostrar impacto verificable y presencia activa en el ecosistema.',
      publicThreshold: 90.00,
    },
  ];

  const tramos = repo.create(tramosData);


  const saved = await repo.save(tramos);
  console.log('✅ Tramos creados:', saved.length);
  return saved;
}