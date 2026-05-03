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
        'El proyecto aún busca forma. El equipo ajusta propósito, enfoque y definición del problema. La incertidumbre está en la coherencia inicial y en la claridad mínima necesaria para comenzar con dirección.',
      sortOrder: 1,
      executionWindowDays: 90,
      isActive: true,
      uncertaintyType: UncertaintyType.IDENTITARY_FORMULATION,
      primaryRiskType: RiskType.HUMANO,
      associatedRisks: [
        'Riesgo Humano',
        'Riesgo de irrelevancia',
        'Riesgo narrativo',
      ],
      icFloor: 0.00,
      eligibilityRule: 'El proyecto debe tener al menos una hipótesis de problema documentada.',
      publicThreshold: 30.00,
    },
    {
      code: 'T2',
      name: 'Validación Temprana',
      description:
        'El proyecto sale de la idea y se enfrenta a usuarios reales. La duda ya no es interna: está en la aceptación, el interés y las primeras señales de uso o disposición a pagar.',
      sortOrder: 2,
      executionWindowDays: 120,
      isActive: true,
      uncertaintyType: UncertaintyType.MARKET,
      primaryRiskType: RiskType.DEMANDA,
      associatedRisks: [
        'Riesgo de inexistencia de demanda',
        'Riesgo de sesgo de confirmación',
        'Riesgo de modelo débil',
      ],
      icFloor: 20.00,
      eligibilityRule: 'El proyecto debe haber completado al menos 5 entrevistas de descubrimiento documentadas.',
      publicThreshold: 45.00,
    },
    {
      code: 'T3',
      name: 'Prototipo Vivo',
      description:
        'La hipótesis ya fue contrastada, pero ahora debe convertirse en algo funcional. La incertidumbre se mueve hacia ejecución, tecnología y capacidad operativa real.',
      sortOrder: 3,
      executionWindowDays: 150,
      isActive: true,
      uncertaintyType: UncertaintyType.OPERATIONAL,
      primaryRiskType: RiskType.OPERATIVO,
      associatedRisks: [
        'Riesgo técnico',
        'Riesgo de ejecución',
        'Riesgo de sobreconstrucción',
      ],
      icFloor: 35.00,
      eligibilityRule: 'El proyecto debe contar con una propuesta de valor validada y un prototipo navegable.',
      publicThreshold: 55.00,
    },
    {
      code: 'T4',
      name: 'Tracción Temprana',
      description:
        'El producto ya funciona, pero la pregunta cambia: si puede crecer sin que los costos, la complejidad o la baja retención destruyan el valor creado.',
      sortOrder: 4,
      executionWindowDays: 180,
      isActive: true,
      uncertaintyType: UncertaintyType.SCALABILITY,
      primaryRiskType: RiskType.MONETIZACION,
      associatedRisks: [
        'Riesgo de ilusión estadística',
        'Riesgo de monetización insuficiente',
        'Riesgo de retención baja',
      ],
      icFloor: 50.00,
      eligibilityRule: 'El proyecto debe demostrar uso recurrente por al menos 10 usuarios activos.',
      publicThreshold: 65.00,
    },
    {
      code: 'T5',
      name: 'Producto Vivo',
      description:
        'La empresa ya no solo valida mercado. Ahora debe sostener crecimiento con procesos, estructura y decisiones más maduras. La duda está en absorber complejidad sin perder foco ni rentabilidad.',
      sortOrder: 5,
      executionWindowDays: 365,
      isActive: true,
      uncertaintyType: UncertaintyType.ORGANIZATIONAL,
      primaryRiskType: RiskType.OPERATIVO,
      associatedRisks: [
        'Riesgo operativo',
        'Riesgo financiero estructural',
        'Riesgo estratégico',
      ],
      icFloor: 65.00,
      eligibilityRule: 'El proyecto debe tener ingresos recurrentes y equipo operativo consolidado.',
      publicThreshold: 75.00,
    },
    {
      code: 'T6',
      name: 'Liderazgo Transformador',
      description:
        'La organización ya tiene madurez e impacto, pero ahora enfrenta una complejidad mayor: entorno, regulación, competencia y reputación. La prueba ya no es solo interna, sino sistémica.',
      sortOrder: 6,
      executionWindowDays: 730,
      isActive: true,
      uncertaintyType: UncertaintyType.MACRO_SYSTEMIC,
      primaryRiskType: RiskType.MACRO,
      associatedRisks: [
        'Riesgo macroeconómico',
        'Riesgo regulatorio',
        'Riesgo competitivo avanzado',
        'Riesgo reputacional'
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