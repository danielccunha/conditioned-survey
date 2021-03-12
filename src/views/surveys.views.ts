import omit from 'lodash/omit'

import { Survey } from '../database/entities/Survey'

export const single = (survey: Survey) => omit(survey, ['normalizedTitle', 'normalizedDescription'])
