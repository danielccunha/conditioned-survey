import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany
} from 'typeorm'

import { SurveyOption } from './SurveyOption'
import { User } from './User'

export enum SurveyType {
  Boolean = 'B',
  List = 'L'
}

@Entity({ name: 'surveys' })
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userId: string

  @Column()
  title: string

  @Column()
  description: string

  @Column()
  type: SurveyType

  @Column()
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => User, user => user.surveys)
  user: User

  @OneToMany(() => SurveyOption, option => option.survey)
  options: SurveyOption[]
}
