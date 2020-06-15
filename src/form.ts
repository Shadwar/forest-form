import {createStore, createEvent, createEffect, createDomain, sample, clearNode, withRegion, forward} from 'effector'
import {node, h, DOMElement, remap, spec} from 'forest'
import get from 'lodash/get'
import has from 'lodash/has'
import identity from 'lodash/identity'
import cloneDeep from 'lodash/cloneDeep'
import noop from 'lodash/noop'
import set from 'lodash/fp/set'
import {getHelpers} from './helpers'
import {Values, Metas, ChangedParams, FormState, Value, Meta, FieldCallback, FormModelParams, FormModelResult} from './types'

const formStates = new Map<string, FormState>()

/**
* -------------------------------------------------------------------------
* Пара вспомогательных функций
*/
function getFormName(element: DOMElement | null): string | null {
  if (!element) {
    return null
  }

  if (element.hasAttribute('formname')) {
    return element.getAttribute('formname')
  }
  
	return getFormName(element.parentElement)
}

/**
* -------------------------------------------------------------------------
* Состояние всех форм в приложении
*/
export function setFormState(name: string, value: FormState) {
  formStates.set(name, value)
}

export function getFormState() {
  const domain = createDomain()

  const $values = createStore<{current: Values; previous: Values}>({current: {}, previous: {}})
  const $metas = createStore<{current: Metas; previous: Metas}>({current: {}, previous: {}})
  const changed = createEvent<ChangedParams>()

  const $formName = createStore('');

  $formName.watch(formName => {
    clearNode(domain)
    const state = formStates.get(formName)

    if (!state) {
      return
    }

    withRegion(domain, () => {
      $values.on(state.$values, (_, values) => values)

      $metas.on(state.$metas, (_, metas) => metas)

      forward({
        from: changed,
        to: state.changed
      })
    })
  })
  
  node(n => {
    // @ts-ignore
    $formName.setState(getFormName(n))
  })

  return {$values, $metas, changed}
}

/**
* -------------------------------------------------------------------------
* Модель формы
*/
export function formModel({name, init, logic = identity}: FormModelParams): FormModelResult {
  /** Текущие значения формы */
  const $values = createStore<{current: Values; previous: Values}>({current: {}, previous: {}})

  /** Текущие метаданные формы */
  const $metas = createStore<{current: Metas; previous: Metas}>({current: {}, previous: {}})

  /** ID последнего вызова логики, для отбрасывания значений более ранних валидаций, если они пришли позже (асинхронщина) */
  const $lastCallId = createStore(0);

  /** Эффект логики формы, валидации, расчеты полей */
  const logicFx = createEffect<{id: number; values: {current: Values; previous: Values}; metas: {current: Metas; previous: Metas}}, void>()

  /** Событие произведенных расчетов логики */
  const calculated = createEvent<{id: number; values: Values; metas: Metas}>();

  /** Событие изменения значений формы */
  const changed = createEvent<{name?: string; value?: Value; values?: Values; meta?: Meta; metas?: Metas}>()

  /** Событие обновления значений формы после расчетов логики */
  const updated = sample({
    source: $lastCallId,
    clock: calculated,
    fn: (id, result) => ({id, result})
  }).filterMap(({id, result}) => id === result.id ? ({values: result.values, metas: result.metas}) : undefined)

  $lastCallId.on(changed, id => id + 1)

  let timeout: number

  logicFx.use(({id, values, metas}) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(async () => {
      const newValues = cloneDeep(values)
      const newMetas = cloneDeep(metas)

      const helpers = getHelpers({values: newValues, metas: newMetas})
      await logic({helpers})
      calculated({id, values: newValues.current, metas: newMetas.current})
    }, 200)
  })
  
  $values
    .on(updated, ({current}, {values}) => ({current: values, previous: current}))
    .on(changed, (values, field) => {
      if (field.values !== undefined) {
        return {current: field.values, previous: field.values}
      }

      if (field.name !== undefined && has(field, 'value')) {
        return set(`current.${field.name}`, field.value, values)
      }
    })

  $metas
    .on(updated, ({current}, {metas}) => ({current: metas, previous: current}))
    .on(changed, (metas, field) => {
      if (field.metas !== undefined) {
        return {current: field.metas, previous: field.metas}
      }

      if (field.name !== undefined && has(field, 'meta')) {
        return set(`current.${field.name}`, field.meta, metas)
      }
    })

  sample({
    source: [$lastCallId, $values, $metas],
    clock: changed,
    target: logicFx,
    fn: ([id, values, metas]) => ({id, values, metas})
  })

  const state = {$values, $metas, changed}

  const Form = (callback: () => void) => h('form', () => {
    spec({attr: {formname: name}})

    node(n => {
      setFormState(name, state)
    })

    callback()
  })

  setTimeout(() => init(state), 0)

  return {Form, $values, $metas, changed}
}

/**
* -------------------------------------------------------------------------
* Поле формы, получение значений и мета-данных из контекста
*/
export function Field({name}: {name: string}, callback: FieldCallback) {
  const state = getFormState()

  const $value = createStore<Value>(null)
    .on(state.$values, (_, values) => get(values.current, name) || null)

  const $meta = createStore<Meta>({})
    .on(state.$metas, (_, metas) => get(metas.current, name) || {})

  const changed = createEvent<ChangedParams>()

  forward({
    from: changed.map(value => ({name, value})),
    to: state.changed
  })

  /**
   * В метаданных могут храниться различные хендлеры, которые достаются с помощью remap
   */

  const {onclick} = remap($meta, {
    onclick: (meta: Meta) => meta.click ?? noop,
  })

  /** Пример с click */
  const click = createEvent<MouseEvent>()

  sample({
    source: onclick,
    clock: click
  }).watch((fn: any) => fn())

  /** input напрямую изменяет состояние через changed */
  const input = changed.prepend((e: any) => e.target.value)

  callback({$value, $meta, input, click})
}
