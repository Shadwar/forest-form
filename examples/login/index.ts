import 'regenerator-runtime/runtime'
import {using, h} from 'forest'
import {StyledRoot} from 'foliage'
import {formModel} from '../../src'
import {logic} from './logic'
import {init} from './init'
import {Root} from './styles'
import {Input, Button} from './fields'

/**
* -------------------------------------------------------------------------
* Форма логина
*/
export function App() {
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
