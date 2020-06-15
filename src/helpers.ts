import set from 'lodash/fp/set'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import has from 'lodash/has'
import {flatten} from 'flat'
import {GetHelpersParams, GetHelpersResult, CurPrev, Metas, Values} from './types'


/**
 * -------------------------------------------------------------------------
 * Возвращает хелпер проверки на наличие ошибок в форме
 */
function getHasErrors(metas: CurPrev<Metas>) {
  return function hasErrors(): boolean {
    const flatMeta = flatten<Metas, {[key: string]: any}>(metas.current)
    return Object.keys(flatMeta).some(key => /\.error$/.test(key) && flatMeta[key] !== undefined)
  }
}

/**
 * -------------------------------------------------------------------------
 * Возвращает хелпер для изменения значений в форме
 */
function getModify(values: CurPrev<Values>, metas: CurPrev<Metas>) {
  return function modify(params: {name: string; value?: any; meta?: any}) {
    const {name, value, meta} = params

    if (has(params, 'value')) {
      values.current = set(name, value, values.current)
    }

    if (has(params, 'meta')) {
      const currentMeta = get(metas.current, name) || {}
      metas.current = set(name, {...currentMeta, ...meta}, metas.current)
    }
  }
}

/**
 * -------------------------------------------------------------------------
 * Возвращает хелпер для изменения массива значений в форме
 */
function getModifiers(values: CurPrev<Values>, metas: CurPrev<Metas>) {
  const modify = getModify(values, metas)

  return function modifiers(params: Array<{name: string; value?: any; meta?: any}>) {
    params.forEach(field => modify(field))
  }
}

/**
 * -------------------------------------------------------------------------
 * Возвращает хелпер для проверки значения и установки ошибки
 */
function getCheck(values: CurPrev<Values>, metas: CurPrev<Metas>) {
  return function check(name: string, ...callbacks: Array<any>) {
    const currentValue = get(values.current, name);
    const previousValue = get(values.previous, name);
    const currentMeta = get(metas.current, name, {'÷': false});
    const previousMeta = get(metas.previous, name, {});

    if (currentValue !== previousValue || !isEqual(currentMeta, previousMeta) || !currentMeta['÷']) {
      const error = callbacks.reduce((res, cur) => res || cur(currentValue, previousValue, currentMeta, previousMeta), undefined)
      metas.current = set(name, {...currentMeta, '÷': true, error}, metas.current)
    }
  }
}

/**
* -------------------------------------------------------------------------
* Получение хелперов для логики формы
*/
export function getHelpers({values, metas}: GetHelpersParams): GetHelpersResult {

  return {
    check: getCheck(values, metas),
    hasErrors: getHasErrors(metas),
    modify: getModify(values, metas),
    modifiers: getModifiers(values, metas)
  }
}
