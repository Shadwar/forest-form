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

export type FieldCallback = ({$value, $meta, input, click}: {$value: Store<Value>; $meta: Store<Meta>; input: Event<any>, click: Event<MouseEvent>}) => void

export type LogicParams = {
  helpers: GetHelpersResult;
}

export type FormModelParams = {name: string, init: any, logic: (params: LogicParams) => void}
export type FormModelResult = {
  Form: any;
  $values: Store<{current: Values; previous: Values}>;
  $metas: Store<{current: Metas; previous: Metas}>;
  changed: Event<{name?: string; value?: Value; values?: Values; meta?: Meta; metas?: Metas}>;
}

export type GetHelpersParams = {values: {current: Values; previous: Values}; metas: {current: Metas; previous: Metas}};
export type GetHelpersResult = {
  check: (name: string, ...callbacks: Array<any>) => void;
  modify: (params: {name: string, value?: any, meta?: any}) => void;
  hasErrors: () => boolean;
}
