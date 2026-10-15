<script setup>
// Una regla como bloques: CUANDO (un disparador) · SI (condiciones) · ENTONCES (acciones).
import Button from 'dashboard/components-next/button/Button.vue';
import Switch from 'dashboard/components-next/switch/Switch.vue';
import StepValue from './StepValue.vue';
import {
  ACTIONS,
  ACTION_BY_TYPE,
  CONDITIONS,
  CONDITION_BY_TYPE,
  TRIGGERS,
  TRIGGER_BY_TYPE,
  newStep,
} from '../workflowBlocks';

const props = defineProps({
  agents: { type: Array, default: () => [] },
});
const emit = defineEmits(['remove']);
const rule = defineModel({ type: Object, required: true });

const changeType = (step, catalog, type) => {
  Object.assign(step, newStep(catalog, type));
};
const addCondition = () => {
  rule.value.conditions.push(newStep(CONDITION_BY_TYPE, 'origin'));
};
const addAction = () => {
  rule.value.actions.push(newStep(ACTION_BY_TYPE, 'note'));
};
const SELECT = 'h-8 px-2 mb-0 text-sm rounded-lg w-auto';
</script>

<template>
  <article
    class="flex flex-col gap-3 p-4 rounded-xl outline outline-1 outline-n-weak bg-n-solid-1"
  >
    <div class="flex items-center gap-3">
      <input
        v-model="rule.name"
        type="text"
        maxlength="80"
        class="flex-1 h-8 px-2 mb-0 text-base font-medium rounded-lg"
      />
      <Switch v-model="rule.enabled" />
      <Button
        icon="i-lucide-trash-2"
        size="xs"
        slate
        ghost
        @click="emit('remove')"
      />
    </div>

    <div class="flex flex-col gap-2 pl-3 border-l-2 border-n-brand">
      <span class="text-xs font-medium tracking-wide text-n-brand">CUANDO</span>
      <div class="flex flex-wrap items-center gap-2">
        <select
          :value="rule.trigger.type"
          :class="SELECT"
          @change="changeType(rule.trigger, TRIGGER_BY_TYPE, $event.target.value)"
        >
          <option v-for="item in TRIGGERS" :key="item.type" :value="item.type">
            {{ item.label }}
          </option>
        </select>
        <StepValue
          v-model="rule.trigger.value"
          :input="TRIGGER_BY_TYPE[rule.trigger.type].input"
          :agents="props.agents"
        />
      </div>
    </div>

    <div class="flex flex-col gap-2 pl-3 border-l-2 border-n-amber-9">
      <span class="text-xs font-medium tracking-wide text-n-amber-11">
        SI (opcional)
      </span>
      <div
        v-for="(condition, index) in rule.conditions"
        :key="`c-${index}`"
        class="flex flex-wrap items-center gap-2"
      >
        <select
          :value="condition.type"
          :class="SELECT"
          @change="changeType(condition, CONDITION_BY_TYPE, $event.target.value)"
        >
          <option v-for="item in CONDITIONS" :key="item.type" :value="item.type">
            {{ item.label }}
          </option>
        </select>
        <StepValue
          v-model="condition.value"
          :input="CONDITION_BY_TYPE[condition.type].input"
        />
        <Button
          icon="i-lucide-x"
          size="xs"
          slate
          ghost
          @click="rule.conditions.splice(index, 1)"
        />
      </div>
      <Button
        label="Agregar condición"
        icon="i-lucide-plus"
        size="xs"
        slate
        faded
        class="self-start"
        @click="addCondition"
      />
    </div>

    <div class="flex flex-col gap-2 pl-3 border-l-2 border-n-teal-9">
      <span class="text-xs font-medium tracking-wide text-n-teal-11">
        ENTONCES
      </span>
      <div
        v-for="(action, index) in rule.actions"
        :key="`a-${index}`"
        class="flex flex-wrap items-start gap-2"
      >
        <select
          :value="action.type"
          :class="SELECT"
          @change="changeType(action, ACTION_BY_TYPE, $event.target.value)"
        >
          <option v-for="item in ACTIONS" :key="item.type" :value="item.type">
            {{ item.label }}
          </option>
        </select>
        <StepValue
          v-if="ACTION_BY_TYPE[action.type].input !== 'none'"
          v-model="action.value"
          :input="ACTION_BY_TYPE[action.type].input"
          :agents="props.agents"
        />
        <span
          v-else
          class="text-xs text-n-slate-11 self-center"
        >
          Con el prompt y las ofertas del agente; si el saneador lo bloquearía,
          no se envía.
        </span>
        <Button
          v-if="rule.actions.length > 1"
          icon="i-lucide-x"
          size="xs"
          slate
          ghost
          @click="rule.actions.splice(index, 1)"
        />
      </div>
      <Button
        label="Agregar acción"
        icon="i-lucide-plus"
        size="xs"
        slate
        faded
        class="self-start"
        @click="addAction"
      />
    </div>
  </article>
</template>
