<script setup lang="ts">
import { useChannelStore } from '@/stores/channelStore';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const channelStore = useChannelStore();
const communityId = route.params.communityId as string;

onMounted(async () => {
  await channelStore.fetchChannels(communityId);
});
</script>

<template>
  <div class="community-view">
    <p>select a channel</p>
  </div>
</template>

<style lang="scss" scoped>
.community-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: hsl(var(--text));
}
</style>
