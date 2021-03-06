import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { Survey } from './Survey'
import { User } from './User'

@Entity({ name: 'survey_answers' })
export class SurveyAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userId: string

  @Column()
  surveyId: string

  @Column()
  value: string

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => User, user => user.answers)
  user: User

  @ManyToOne(() => Survey, survey => survey.answers)
  survey: Survey
}
