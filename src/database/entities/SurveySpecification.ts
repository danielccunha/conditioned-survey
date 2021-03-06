import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { Survey } from './Survey'

export enum SurveySpecificationType {
  A = 'Age',
  G = 'Gender'
}

@Entity({ name: 'survey_specifications' })
export class SurveySpecification {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  surveyId: string

  @Column()
  type: SurveySpecificationType

  @Column()
  value: string

  @Column()
  weight: number

  @ManyToOne(() => Survey, survey => survey.specifications)
  survey: Survey
}
