import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

import { Survey, SurveyAnswer } from './Survey'

export enum Gender {
  Male = 'M',
  Female = 'F'
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  email: string

  @Column()
  password: string

  @Column()
  gender: Gender

  @Column()
  birthday: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => Survey, survey => survey.user)
  surveys: Survey[]

  @OneToMany(() => SurveyAnswer, answer => answer.user)
  answers: SurveyAnswer[]

  get age(): number {
    const diff = Date.now() - this.birthday.getTime()
    const ageDate = new Date(diff)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
  }
}
