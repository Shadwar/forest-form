import {using, h} from 'forest'
import {StyledRoot} from 'foliage'
import {Event, Store, createEvent, sample} from 'effector'
import {Root} from './styles'
import {ChangedParams, Values} from './types'
import {formModel, LogicParams} from './form'
import {Input, Button} from './fields'
import {req, gte} from './validations'

/**
* -------------------------------------------------------------------------
* Форма логина
*/
function App() {
  const {Form, $values, $metas} = formModel({name: 'loginform', init, logic})

  Form(() => {
    Root(() => {
      Input({name: 'user.name', label: 'Username'})
      Input({name: 'user.password', label: 'Password'})
      Button({name: 'submit', label: 'LOGIN'})
    })

    // @ts-ignore
    h('pre', {text: $values.map(JSON.stringify)})
    // @ts-ignore
    h('pre', {text: $metas.map(JSON.stringify)})
  })
}

using(document.body, App)
using(document.head, StyledRoot)

/**
* -------------------------------------------------------------------------
* Асинхронная инициализация значений формы, метаданных с хендлерами и тп
*/
async function init(state: {$values: Store<{current: Values}>; $metas: Store<{current: Values}>; changed: Event<ChangedParams>}) {
  const submit = createEvent()

  sample(state.$values, submit).watch(values => alert(JSON.stringify(values.current)))

  const values = {
    user: {
      name: 'ivan'
    }
  }

  const metas = {
    submit: {
      disabled: true,
      click: submit
    }
  }

  await new Promise(r => setTimeout(r, 100))

  state.changed({values, metas})
}

/**
* -------------------------------------------------------------------------
* Асинхронная логика формы, валидации, расчеты
*/
async function logic({helpers}: LogicParams) {
  const {check, hasErrors, modify} = helpers

  await new Promise(r => setTimeout(r, 100))

  check('user.name', req)
  check('user.password', req, gte(6))

  modify({name: 'submit', meta: {disabled: hasErrors()}})
}
