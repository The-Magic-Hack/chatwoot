// Bloques del editor de reglas: lo mismo que valida el agente (agent/workflow_rules.py).
export const STAGES = [
  'Lead',
  'Contactado',
  'Respondió',
  'Engagement',
  'Win',
  'Lost',
];

export const TRIGGERS = [
  {
    type: 'stage',
    label: 'El lead entra a la etapa',
    input: 'stage',
    value: 'Engagement',
  },
  {
    type: 'no_reply',
    label: 'El lead lleva sin contestar (horas)',
    input: 'number',
    value: 24,
  },
  {
    type: 'label',
    label: 'La conversación tiene la etiqueta',
    input: 'label',
    value: '',
  },
  {
    type: 'keyword',
    label: 'El lead escribe la palabra',
    input: 'text',
    value: '',
  },
  {
    type: 'class_days',
    label: 'Faltan estos días para su clase',
    input: 'number',
    value: 3,
  },
];

export const CONDITIONS = [
  {
    type: 'stage_in',
    label: 'La etapa es una de',
    input: 'stages',
    value: ['Respondió'],
  },
  { type: 'origin', label: 'Vino de', input: 'origin', value: 'anuncio' },
  { type: 'has_label', label: 'Tiene la etiqueta', input: 'label', value: '' },
  {
    type: 'lacks_label',
    label: 'No tiene la etiqueta',
    input: 'label',
    value: '',
  },
  { type: 'lang', label: 'Escribe en', input: 'lang', value: 'es' },
];

export const ACTIONS = [
  {
    type: 'send_text',
    label: 'Enviarle este mensaje',
    input: 'texts',
    value: { es: '', en: '' },
  },
  {
    type: 'send_agent',
    label: 'Que el agente le escriba',
    input: 'none',
    value: null,
  },
  {
    type: 'set_stage',
    label: 'Pasar a la etapa',
    input: 'stage',
    value: 'Engagement',
  },
  { type: 'add_label', label: 'Poner la etiqueta', input: 'label', value: '' },
  { type: 'assign', label: 'Asignar a', input: 'agent', value: null },
  { type: 'note', label: 'Dejar una nota interna', input: 'text', value: '' },
];

const byType = list => Object.fromEntries(list.map(item => [item.type, item]));
export const TRIGGER_BY_TYPE = byType(TRIGGERS);
export const CONDITION_BY_TYPE = byType(CONDITIONS);
export const ACTION_BY_TYPE = byType(ACTIONS);

const copy = value => JSON.parse(JSON.stringify(value));

export const newStep = (catalog, type) => ({
  type,
  value: copy(catalog[type].value),
});

export const newRule = () => ({
  id: `regla-${Date.now().toString(36)}`,
  name: 'Nueva regla',
  enabled: false,
  trigger: newStep(TRIGGER_BY_TYPE, 'stage'),
  conditions: [],
  actions: [newStep(ACTION_BY_TYPE, 'add_label')],
});
