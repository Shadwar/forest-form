import {Store} from 'effector'
import {remap, spec, handler, h} from 'forest'
import {InputView, Icon, ButtonView} from './styles'
import {Meta, Field} from '../../src'


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
