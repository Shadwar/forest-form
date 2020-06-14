import {req, gte, LogicParams} from '../../src'

/**
* -------------------------------------------------------------------------
* Асинхронная логика формы, валидации, расчеты
*/
export async function logic({helpers}: LogicParams) {
  const {check, hasErrors, modify} = helpers

  await new Promise(r => setTimeout(r, 100))

  check('user.name', req)
  check('user.password', req, gte(6))

  modify({name: 'submit', meta: {disabled: hasErrors()}})
}
