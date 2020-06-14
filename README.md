# forest-form

Form state with Forest and Effector.

Install:
```
yarn add forest-form
```

Run example: 
```
yarn start
```

Create your own fields:
```JS
import {h, remap, spec, handler} from 'forest'
import {Field} from 'forest-form'

function Input({name}) {
  Field({name}, ({$value, input}) => {
    h('input', {
      attr: {value: $value.map(value => value || '')},
      handler: {input}
    })
  })
}

function Button({name, label}) {
  Field({name}, ({$meta, click}) => {
    const {disabled} = remap($meta, {
      disabled: meta => meta.disabled ?? false,
    })

    h('button', () => {
      spec({text: label, attr: {disabled}})
      handler({prevent: true}, {click})
    })
  })
}

```

Create your logic and initialization:
```JS
import {createEvent} from 'effector'

function init(state) {
  const submit = createEvent()
  sample(state.$values, submit).watch(values => alert(JSON.stringify(values.current)))

  const values = {
    user: {name: 'ivan'}
  }

  const metas = {
    submit: {disabled: true, click: submit},
    cancel: {click: () => console.log('cancel button clicked')}
  }

  state.changed({values, metas})
}

function logic({helpers}) {
  const {check, hasErrors, modify} = helpers

  check('user.name', req)
  check('user.password', req, gte(6))

  modify({name: 'submit', meta: {disabled: hasErrors()}})
}
```

Create your form, from simple to the most complex, with any nesting:
```JS
import {formModel} from 'forest-form'

function App() {
  const {Form} = formModel({name: 'loginform', init, logic})

  Form(() => {
    Input({name: 'user.name'})
    Input({name: 'user.password'})

    Commands()
  })
}

function Commands() {
  Button({name: 'cancel'})
  Button({name: 'submit'})
}
```
