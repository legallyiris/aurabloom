<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  variant?: "default" | "accent" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  url?: string;
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const urlIsExternal = computed(() => props.url?.startsWith("http"));
</script>

<template>
  <Component
    :is="url ? urlIsExternal ? 'a' : 'router-link' : 'button'"
    :href="url"
    :to="url && !urlIsExternal ? url : undefined"
    :class="[
      'app-button',
      `variant-${variant || 'default'}`,
      `size-${size || 'md'}`,
      { disabled }
    ]"
    :disabled="disabled"
    :type="type || 'button'"
    @click="emit('click', $event)"
  >
    <slot></slot>
  </Component>
</template>

<style lang="scss" scoped>
.app-button {
  font-family: inherit;
  border-radius: 0.375rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;

  &.variant-default {
    background-color: hsl(var(--surface0));
    color: hsl(var(--text));

    &:hover:not(:disabled) {
      background-color: hsl(var(--surface1));
    }

    &:active:not(:disabled) {
      background-color: hsl(var(--surface2));
    }
  }

  &.variant-accent {
    background-color: hsl(var(--accent));
    color: hsl(var(--text-on-accent));

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:active:not(:disabled) {
      opacity: 0.8;
    }
  }

  &.variant-danger {
    background-color: hsl(var(--red));
    color: hsl(var(--crust));

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:active:not(:disabled) {
      opacity: 0.8;
    }
  }

  &.variant-ghost {
    background-color: transparent;
    color: hsl(var(--text));

    &:hover:not(:disabled) {
      background-color: hsla(var(--overlay0) / 0.2);
    }

    &:active:not(:disabled) {
      background-color: hsla(var(--overlay0) / 0.3);
    }
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--accent));
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.size-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }

  &.size-md {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }

  &.size-lg {
    padding: 0.75rem 1.5rem;
    font-size: 1.125rem;
  }
}

a {
    text-decoration: none;
}

</style>
