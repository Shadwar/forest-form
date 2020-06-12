import {Store, Event} from 'effector'

export type Value = any

export type Values = {[key: string]: Value}

export type Meta = {
  disabled?: boolean;
  error?: string;
  click?: any;
  parse?: any;
  initialized?: boolean;
}

export type Metas = {[key: string]: Meta}

export type ChangedParams = {name?: string; value?: Value; values?: Values; meta?: Meta; metas?: Metas}

export type FormState = {
  $values: Store<{current: Values; previous: Values}>;
  $metas: Store<{current: Metas; previous: Metas}>;
  changed: Event<ChangedParams>
}