import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { Survey } from './Survey'

@Entity({ name: 'survey_options' })
export class SurveyOption {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  surveyId: string

  @Column()
  option: string

  @ManyToOne(() => Survey, survey => survey.options)
  survey: Survey

  constructor(option: string) {
    this.option = option
  }
}
