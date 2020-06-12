import {Store, Event, createEvent, createStore, forward, sample} from 'effector'
import {remap, spec, handler, h} from 'forest'
import {InputView, Icon, ButtonView} from './styles'
import {Value, Meta, ChangedParams} from './types'
import {get, identity, noop} from 'lodash'
import {getFormState} from './form'

/**
* -------------------------------------------------------------------------
* Поле формы, получение значений и мета-данных из контекста
*/
type FieldCallback = ({$value, $meta, input, click}: {$value: Store<Value>; $meta: Store<Meta>; input: Event<any>, click: Event<MouseEvent>}) => void

function Field({name}: {name: string}, callback: FieldCallback) {
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
    parse: (meta: Meta) => meta.parse ?? identity,
  })

  /** Пример с click */
  const click = createEvent<MouseEvent>()

  sample({
    source: onclick,
    clock: click
  }).watch((fn: any) => fn())

  /** Пример с input, с поддержкой parse */
  const input = changed.prepend((e: any) => e.target.value)
  

  callback({$value, $meta, input, click})
}

/**
* -------------------------------------------------------------------------
* Реализация конкретных полей
*/
export function Input({name, label}: {name: string; label: string}) {
  Field({name}, ({$value, $meta, input}) => {
    const {disabled, error}: {disabled: Store<boolean>; error: Store<string|null>} = remap($meta, {
      disabled: (meta: Meta) => meta.disabled ?? false,
      error: (meta: Meta) => meta.error ?? null
    })

    InputView(() => {
      h('input', {attr: {placeholder: label, value: $value.map(value => value || ''), disabled}, handler: {input}})
      Icon({text: error, data: {error: true}, visible: error.map(Boolean)})
    })
  })
}

export function Button({name, label}: {name: string; label: string}) {
  Field({name}, ({$meta, click}) => {
    const {disabled} = remap($meta, {
      disabled: (meta: Meta) => meta.disabled ?? false,
    })

    ButtonView(() => {
      spec({text: label, attr: {disabled}})
      handler({prevent: true}, {click})
    })
  })
}
