import {isString} from 'lodash'

/**
* -------------------------------------------------------------------------
* Валидации
*/
export function req(value: any): string | undefined {
  if (value === undefined || value === null || (isString(value) && value === '')) {
    return 'Required'
  }
}

export function gte(length: number): (value: any) => string | undefined {
  function fn(value: any) {
    if (value === undefined || value === null || (isString(value) && value.length < length)) {
      return `Must be not less than ${length}`
    }
  }

  return fn
}
