import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IcAlgorithmVersion } from '../../reputation/entities/ic-algorithm-version.entity';

@Entity('dim_algorithm_versions')
export class DimAlgorithmVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'algorithm_version_id' })
  algorithmVersionId: string;

  @Column()
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'effective_from' })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', nullable: true })
  effectiveTo: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Relaciones
  @OneToOne(() => IcAlgorithmVersion)
  @JoinColumn({ name: 'algorithm_version_id' })
  algorithmVersion: IcAlgorithmVersion;
}