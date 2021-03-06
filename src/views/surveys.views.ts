import omit from 'lodash/omit'

import { Survey } from '../database/entities/Survey'

export const single = (survey: Survey) => omit(survey, ['normalizedTitle', 'normalizedDescription'])

export const many = (surveys: Survey[]) => surveys.map(single)
