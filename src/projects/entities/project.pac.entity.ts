import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Project } from "./project.entity";
import { Pac } from "src/pacs/entities/pac.entity";

export enum ProjectPacStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('project_pacs')
export class ProjectPac {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'pac_id' })
  pacId: string;

  @Column({
    type: 'enum',
    enum: ProjectPacStatus,
    default: ProjectPacStatus.PENDING,
  })
  status: ProjectPacStatus;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  progress: number; // opcional (0 - 100)

  @Column({ name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Project, (project) => project.projectPacs)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Pac)
  @JoinColumn({ name: 'pac_id' })
  pac: Pac;
}