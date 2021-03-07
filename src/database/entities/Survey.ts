import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany
} from 'typeorm'

import { SurveyAnswer } from './SurveyAnswer'
import { SurveyOption } from './SurveyOption'
import { SurveySpecification } from './SurveySpecification'
import { User } from './User'

export enum SurveyType {
  Boolean = 'B',
  List = 'L'
}

export enum SurveyStatus {
  Draft = 'D',
  Published = 'P',
  Closed = 'C'
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
  status: SurveyStatus

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => User, user => user.surveys)
  user: User

  @OneToMany(() => SurveyAnswer, answers => answers.survey)
  answers: SurveyAnswer[]

  @OneToMany(() => SurveyOption, option => option.survey)
  options: SurveyOption[]

  @OneToMany(() => SurveySpecification, spec => spec.survey)
  specifications: SurveySpecification[]
}

export * from './SurveyAnswer'
export * from './SurveyOption'
export * from './SurveySpecification'
