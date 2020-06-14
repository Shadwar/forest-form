import {Store, Event, createEvent, sample} from 'effector'
import {Values, ChangedParams} from '../../src'

/**
* -------------------------------------------------------------------------
* Асинхронная инициализация значений формы, метаданных с хендлерами и тп
*/
export async function init(state: {$values: Store<{current: Values}>; $metas: Store<{current: Values}>; changed: Event<ChangedParams>}) {
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
