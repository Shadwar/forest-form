import {createStore, createEvent, createEffect, createDomain, sample, clearNode, withRegion, forward, Store, Event} from 'effector'
import {node, h, DOMElement} from 'forest'
import {Values, Metas, ChangedParams, FormState, Value, Meta} from './types'
import {get, isEqual, has, identity, cloneDeep} from 'lodash'
import {set} from 'lodash/fp'
import {flatten} from 'flat'

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
* Получение хелперов для логики формы
*/
type GetHelpersParams = {values: {current: Values; previous: Values}; metas: {current: Metas; previous: Metas}};
type GetHelpersResult = {
  check: (name: string, ...callbacks: Array<any>) => void;
  modify: (params: {name: string, value?: any, meta?: any}) => void;
  hasErrors: () => boolean;
}

function getHelpers({values, metas}: GetHelpersParams): GetHelpersResult {
  function check(name: string, ...callbacks: Array<any>) {
    const currentValue = get(values.current, name);
    const previousValue = get(values.previous, name);
    const currentMeta = get(metas.current, name, {initialized: false});
    const previousMeta = get(metas.previous, name, {});

    if (currentValue !== previousValue || !isEqual(currentMeta, previousMeta) || !currentMeta.initialized) {
      const error = callbacks.reduce((res, cur) => res || cur(currentValue, previousValue, currentMeta, previousMeta), undefined)
      metas.current = set(name, {...currentMeta, initialized: true, error}, metas.current)
    }
  }

  function hasErrors(): boolean {
    const flatMeta = flatten<Metas, {[key: string]: any}>(metas.current)
    return Object.keys(flatMeta).some(key => /\.error$/.test(key) && flatMeta[key] !== undefined)
  }

  function modify(params: {name: string; value?: any; meta?: any}) {
    const {name, value, meta} = params

    if (has(params, 'value')) {
      values.current = set(name, value, values.current)
    }

    if (has(params, 'meta')) {
      const currentMeta = get(metas.current, name) || {}
      metas.current = set(name, {...currentMeta, ...meta}, metas.current)
    }
  }

  return {check, hasErrors, modify}
}

/**
* -------------------------------------------------------------------------
* Модель формы
*/
export type LogicParams = {
  helpers: GetHelpersResult;
}

type FormModelParams = {name: string, init: any, logic: (params: LogicParams) => void}
type FormModelResult = {
  Form: any;
  $values: Store<{current: Values; previous: Values}>;
  $metas: Store<{current: Metas; previous: Metas}>;
  changed: Event<{name?: string; value?: Value; values?: Values; meta?: Meta; metas?: Metas}>;
}

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
    node(n => {
      setFormState(name, state)
      n.setAttribute('formname', name)
    })

    callback()
  })

  setTimeout(() => init(state), 0)

  return {Form, $values, $metas, changed}
}
