import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('dim_time')
export class DimTime {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_date', type: 'date', unique: true })
  fullDate: Date;

  @Column()
  day: number;

  @Column()
  month: number;

  @Column({ name: 'month_name' })
  monthName: string;

  @Column()
  quarter: number;

  @Column()
  year: number;

  @Column({ name: 'week_of_year' })
  weekOfYear: number;

  @Column({ name: 'day_of_week' })
  dayOfWeek: number;

  @Column({ name: 'day_name' })
  dayName: string;
}