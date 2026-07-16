import { DataSource, DeepPartial } from 'typeorm';
import { Tramo } from 'src/tramos/entities/tramo.entity';
import { UncertaintyType, RiskType } from 'src/curriculum/entities/curriculum.enums';

export async function seedTramos(dataSource: DataSource) {
  const repo = dataSource.getRepository(Tramo);

  const tramosData: DeepPartial<Tramo>[] = [
    {
      code: 'T1',
      name_es: 'Fase Fundacional',
      name_en: 'Foundational Phase',
      description_es:
        'El proyecto aún busca forma. El equipo ajusta propósito, enfoque y definición del problema. La incertidumbre está en la coherencia inicial y en la claridad mínima necesaria para comenzar con dirección.',
      description_en:
        'The project is still taking shape. The team adjusts purpose, focus and problem definition. Uncertainty lies in initial coherence and the minimum clarity needed to move forward with direction.',
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
      eligibilityRule_es: 'El proyecto debe tener al menos una hipótesis de problema documentada.',
      eligibilityRule_en: 'The project must have at least one documented problem hypothesis.',
      publicThreshold: 30.00,
    },
    {
      code: 'T2',
      name_es: 'Validación Temprana',
      name_en: 'Early Validation',
      description_es:
        'El proyecto sale de la idea y se enfrenta a usuarios reales. La duda ya no es interna: está en la aceptación, el interés y las primeras señales de uso o disposición a pagar.',
      description_en:
        'The project moves beyond the idea stage and faces real users. Doubt is no longer internal: it lies in acceptance, interest, and early signals of usage or willingness to pay.',
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
      eligibilityRule_es: 'El proyecto debe haber completado al menos 5 entrevistas de descubrimiento documentadas.',
      eligibilityRule_en: 'The project must have completed at least 5 documented discovery interviews.',
      publicThreshold: 45.00,
    },
    {
      code: 'T3',
      name_es: 'Prototipo Vivo',
      name_en: 'Living Prototype',
      description_es:
        'La hipótesis ya fue contrastada, pero ahora debe convertirse en algo funcional. La incertidumbre se mueve hacia ejecución, tecnología y capacidad operativa real.',
      description_en:
        'The hypothesis has already been tested, but now it must become something functional. Uncertainty shifts toward execution, technology and real operational capacity.',
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
      eligibilityRule_es: 'El proyecto debe contar con una propuesta de valor validada y un prototipo navegable.',
      eligibilityRule_en: 'The project must have a validated value proposition and a navigable prototype.',
      publicThreshold: 55.00,
    },
    {
      code: 'T4',
      name_es: 'Tracción Temprana',
      name_en: 'Early Traction',
      description_es:
        'El producto ya funciona, pero la pregunta cambia: si puede crecer sin que los costos, la complejidad o la baja retención destruyan el valor creado.',
      description_en:
        'The product already works, but the question changes: whether it can grow without costs, complexity or low retention destroying the value created.',
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
      eligibilityRule_es: 'El proyecto debe demostrar uso recurrente por al menos 10 usuarios activos.',
      eligibilityRule_en: 'The project must demonstrate recurring usage by at least 10 active users.',
      publicThreshold: 65.00,
    },
    {
      code: 'T5',
      name_es: 'Producto Vivo',
      name_en: 'Living Product',
      description_es:
        'La empresa ya no solo valida mercado. Ahora debe sostener crecimiento con procesos, estructura y decisiones más maduras. La duda está en absorber complejidad sin perder foco ni rentabilidad.',
      description_en:
        'The company is no longer just validating the market. It must now sustain growth with more mature processes, structure and decisions. The doubt lies in absorbing complexity without losing focus or profitability.',
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
      eligibilityRule_es: 'El proyecto debe tener ingresos recurrentes y equipo operativo consolidado.',
      eligibilityRule_en: 'The project must have recurring revenue and a consolidated operating team.',
      publicThreshold: 75.00,
    },
    {
      code: 'T6',
      name_es: 'Liderazgo Transformador',
      name_en: 'Transformational Leadership',
      description_es:
        'La organización ya tiene madurez e impacto, pero ahora enfrenta una complejidad mayor: entorno, regulación, competencia y reputación. La prueba ya no es solo interna, sino sistémica.',
      description_en:
        'The organization already has maturity and impact, but now faces greater complexity: environment, regulation, competition and reputation. The test is no longer just internal, but systemic.',
      sortOrder: 6,
      executionWindowDays: 730,
      isActive: true,
      uncertaintyType: UncertaintyType.MACRO_SYSTEMIC,
      primaryRiskType: RiskType.MACRO,
      associatedRisks: [
        'Riesgo macroeconómico',
        'Riesgo regulatorio',
        'Riesgo competitivo avanzado',
        'Riesgo reputacional',
      ],
      icFloor: 80.00,
      eligibilityRule_es: 'El proyecto debe demostrar impacto verificable y presencia activa en el ecosistema.',
      eligibilityRule_en: 'The project must demonstrate verifiable impact and active presence in the ecosystem.',
      publicThreshold: 90.00,
    },
  ];

  const tramos = repo.create(tramosData);

  const saved = await repo.save(tramos);
  console.log('✅ Tramos creados:', saved.length);
  return saved;
}