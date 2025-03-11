<script setup lang="ts">
import { useChannelStore } from "@/stores/channelStore";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const channelStore = useChannelStore();
const channelId = route.params.channelId as string;
const newMessage = ref("");

onMounted(async () => {
  await channelStore.fetchMessages(channelId);
});

const sendMessage = async () => {
  if (!newMessage.value.trim()) return;

  const success = await channelStore.sendMessage(channelId, newMessage.value);
  if (success) {
    newMessage.value = "";
  }
};
</script>

<template>
  <div class="channel-view">
    <div class="messages">
      <div v-for="message in channelStore.messages" :key="message.id" class="message">
        <div class="message-header">
          <span class="username">{{ message.author?.username }}</span>
          <span class="timestamp">{{ new Date(message.createdAt).toLocaleTimeString() }}</span>
        </div>
        <div class="message-content">{{ message.content }}</div>
      </div>
    </div>
    <div class="message-input">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        placeholder="type a message..." />
      <button @click="sendMessage">send</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.channel-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .message {
    margin-bottom: 0.5rem;

    &-header {
      display: flex;
      gap: 0.5rem;
      align-items: baseline;

      .username {
        font-weight: 500;
      }

      .timestamp {
        font-size: 0.75rem;
        color: hsl(var(--subtext0));
      }
    }

    &-content {
      margin-top: 0.25rem;
    }
  }

  .message-input {
    display: flex;
    padding: 0.75rem;
    background: hsl(var(--mantle));
    border-top: 1px solid hsla(var(--subtext1) / 0.2);
    gap: 0.5rem;

    input {
      flex: 1;
      padding: 0.5rem;
      border-radius: 0.25rem;
      border: 1px solid hsla(var(--overlay0) / 0.5);
      background: hsl(var(--surface0));
      color: hsl(var(--text));
    }

    button {
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      background: hsl(var(--accent));
      color: hsl(var(--text-on-accent));
      border: none;
      cursor: pointer;

      &:hover {
        opacity: 0.9;
      }
    }
  }
}
</style>
