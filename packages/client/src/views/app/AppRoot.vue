<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "@/stores/authStore";
import { useChannelStore } from "@/stores/channelStore";
import { useCommunityStore } from "@/stores/communityStore";
import { computed } from "vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const communityStore = useCommunityStore();
const channelStore = useChannelStore();

const loading = ref(false);
const currentCommunityId = computed(
  () => (route.params.communityId as string) || null,
);
const currentChannelId = computed(
  () => (route.params.channelId as string) || null,
);

const currentCommunity = computed(() => {
  return communityStore.communities.find(
    (c) => c.id === currentCommunityId.value,
  );
});

const channelListWidth = ref(256);
const isDragging = ref(false);
const isChannelListVisible = ref(true);

onMounted(async () => {
  loading.value = true;
  await authStore.fetchCurrentUser();
  if (!authStore.isAuthenticated) router.push({ name: "login" });
  loading.value = false;

  if (authStore.isAuthenticated) {
    await communityStore.fetchMyCommunities();
    if (currentCommunityId.value)
      await channelStore.fetchChannels(currentCommunityId.value);
  }
});

function selectCommunity(communityId: string) {
  router.push({ name: "community", params: { communityId } });
}

function selectChannel(communityId: string, channelId: string) {
  router.push({ name: "channel", params: { communityId, channelId } });
}

function startDragging() {
  isDragging.value = true;
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDragging);
  document.addEventListener("mouseleave", stopDragging);
}

function drag(event: MouseEvent) {
  if (!isDragging.value) return;

  const communityList = document.querySelector(".community-list");
  if (!communityList) return;
  const communityListRect = communityList.getBoundingClientRect();

  if (!isChannelListVisible.value) {
    if (event.clientX > communityListRect.right + 50) {
      expandChannelList();
      channelListWidth.value = 100;
    }
    return;
  }

  let newWidth = event.clientX - communityListRect.right;
  const appContent = document.querySelector(".app-content");
  if (!appContent) return;
  const gap = Number.parseInt(getComputedStyle(appContent).gap);
  newWidth -= gap * 2;

  if (newWidth < 50) {
    collapseChannelList();
    return;
  }

  if (newWidth >= 300) newWidth = 300;
  else if (newWidth <= 100) newWidth = 100;

  channelListWidth.value = newWidth;
}

function stopDragging() {
  isDragging.value = false;
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDragging);
  document.removeEventListener("mouseleave", stopDragging);
}

function toggleChannelList() {
  if (isChannelListVisible.value) collapseChannelList();
  else expandChannelList();
}

function collapseChannelList() {
  isChannelListVisible.value = false;
}

function expandChannelList() {
  isChannelListVisible.value = true;
}
</script>

<template>
  <div class="app-container" v-if="!loading">
    <div class="app-header">
      <div class="app-header__section">
        <button
            @click="if (currentCommunityId) isChannelListVisible ? collapseChannelList() : expandChannelList();"
            class="show-channels-btn"
            :active="currentCommunityId !== null"
            title="Show channels">
            <svg v-if="!isChannelListVisible"
                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else
                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
        <p class="brand">aurabloom!</p>
      </div>
      <div class="app-header__section current-page">
        <template v-if="currentCommunity">
            <div class="icon">
                <img v-if="currentCommunity.icon" :src="currentCommunity?.icon" alt="Community Icon" />
            </div>
            <div class="name"><p>{{ currentCommunity.name }}</p></div>
        </template>
        <template v-else>
            <div class="icon"></div>
            <div class="name"><p>no community selected</p></div>
        </template>
      </div>
      <div class="app-header__section user">
        <div class="name"><p>{{ authStore.user?.username }}</p></div>
        <div class="icon">
            <img class="avatar" v-if="authStore.user?.avatarUrl" :src="authStore.user?.avatarUrl" alt="User Avatar" />
        </div>
      </div>
    </div>

    <div class="app-content">
      <div class="app-content__section community-list">
        <div
            v-for="community in communityStore.communities"
            :key="community.id"
            :class="{ active: community.id === currentCommunityId, 'community-item': true }"
            :title="community.name"
            @click="selectCommunity(community.id)"
        >
          <div class="icon">
            <img class="avatar" v-if="community.icon" :src="community.icon" alt="Community Avatar" />
          </div>
        </div>
      </div>

      <div
        v-show="isChannelListVisible && currentCommunityId && channelStore.channels.length > 0"
        class="app-content__section channel-list"
        :style="{ width: channelListWidth + 'px' }"
      >
        <div class="channel-list__item"
            v-for="channel in channelStore.channels"
            :key="channel.id"
            :class="{ active: channel.id === currentChannelId, 'channel-item': true }"
            :title="channel.name"
            v-if="currentCommunityId"
            @click="selectChannel(currentCommunityId, channel.id)"
        >
          <div class="prefix">#</div>
          <div class="name"><p>{{ channel.name }}</p></div>
        </div>
      </div>

      <div class="app-content__section chat">
        <div
          class="resize-divider"
          @mousedown="startDragging"
          @dblclick="toggleChannelList"></div>

          <div class="chat__content">
            <div class="chat__content-header" v-if="currentChannelId">
              <div class="chat__content-header__title">
                <p>{{ channelStore.channels.find(channel => channel.id === currentChannelId)?.name }}</p>
              </div>
            </div>
            <RouterView />
          </div>
      </div>
    </div>
  </div>
  <div :class="{ active: loading, 'loading-overlay': true }">
    <p class="loading-spinner">🌸</p>
    <h2>aurabloom!</h2>
    <p>loading...</p>
  </div>
</template>

<style lang="scss" scoped>

.app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
}

.app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: hsl(var(--subtext0));
    padding: 0.25rem;
    font-size: 0.75rem;

    p {
        margin: 0;
    }

    &__section {
        display: flex;
        align-items: center;
        .brand {
            font-weight: 900;
        }
        &.current-page, &.user {
            gap: 0.5rem;
            .icon {
                aspect-ratio: 1;
                background-color: hsl(var(--subtext0));
                width: 1.5rem;
                height: 1.5rem;
                border-radius: 50%;

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }
        }
    }
}

.show-channels-btn {
    background: none;
    border: none;
    color: hsl(var(--subtext0));
    cursor: pointer;
    padding: 0.25rem;
    margin-right: 0.5rem;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;

    &[active = false] {
        filter: brightness(0.8);
        cursor: not-allowed;
    }

    &:hover {
        background-color: hsla(var(--overlay0) / 0.3);
    }

    svg {
        width: 16px;
        height: 16px;
    }
}

.app-content {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  padding: 0.25rem;
  flex-grow: 1;
  height: calc(100% - 2rem);
  overflow: hidden;

    &__section {
        display: flex;
        flex-direction: column;

        &.community-list {
            display: flex;
            flex-direction: column;

            .community-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;

                .icon {
                    aspect-ratio: 1;
                    border: 1px solid hsla(var(--subtext0) / 0);
                    background-color: hsl(var(--subtext0));
                    overflow: hidden;
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: 50%;
                    transition: 0.2s ease-in-out;

                    img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                }

                &.active .icon {
                    background-color: hsl(var(--subtext0));
                    border: 1px solid hsla(var(--subtext0) / 0.2);
                    color: hsl(var(--background));
                    border-radius: 0.25rem;
                }

                &:hover .icon {
                    border-radius: 0.25rem;
                }
            }
        }

        &.channel-list {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            .channel-list__item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.2rem 0.5rem;
                cursor: pointer;
                font-size: 0.75rem;
                font-weight: 500;
                color: hsl(var(--text));
                background-color: hsla(var(--accent) / 0);
                border: 1px solid hsla(var(--subtext0) / 0);
                border-radius: 0.5rem;

                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

                .prefix {
                    font-size: 1rem;
                    font-weight: 900;
                    color: hsla(var(--subtext0) / 0.7);
                }

                &:hover {
                    background-color: hsla(var(--accent) / 0.05);
                    color: hsl(var(--background));
                }

                &.active {
                    background-color: hsla(var(--accent) / 0.1);
                    color: hsl(var(--background));
                }

                &:active {
                    background-color: hsla(var(--accent) / 0.2);
                    border: 1px solid hsla(var(--accent) / 0.05);
                    color: hsl(var(--background));
                }
                p {
                    margin: 0;
                    font-weight: 500;
                    color: hsl(var(--text));
                }
            }
        }

        &.chat {
            position: relative;
            flex-grow: 1;
            background: hsl(var(--crust));
            border: 1px solid hsla(var(--subtext1) / 0.2);
            border-radius: 1rem 0.5rem 0.5rem 0.5rem;
            overflow: hidden;
            height: 100%;
            display: flex;
            flex-direction: column;

            .chat__content {
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                height: 100%;
                max-height: 100%;
            }

            .chat__content-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.5rem;
                border-bottom: 1px solid hsla(var(--subtext1) / 0.2);
                background-color: hsla(var(--mantle) / 0.9);

                .chat__content-header__title {
                    flex-grow: 1;
                    font-size: 1rem;
                    font-weight: 900;
                    color: hsl(var(--text));
                    p {
                        margin: 0;
                    }
                }
            }
        }
    }
}

.resize-divider {
    position: absolute;
    left: -2px;
    top: 0;
    height: 100%;
    width: 4px;
    border-radius: 1rem;
    cursor: ew-resize;
    background-color: transparent;
    transition: background-color 0.2s;

    &:hover {
        background-color: hsla(var(--surface2) / 0.5);
    }
}

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: hsla(var(--base) / 0);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    z-index: 9999;
    pointer-events: none;
    transition: 0.3s ease-in-out;

    * {
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    }

    &.active {
        background-color: hsla(var(--base) / 1);
        backdrop-filter: blur(1rem);
        * {
            opacity: 1;
        }
    }

    p, h2 {
        margin: 0;
        color: hsl(var(--text));
    }

    .loading-spinner {
        font-size: 4rem;
        animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;

        @keyframes spin {
            0% {
            transform: rotate(0deg);
            }
            100% {
            transform: rotate(360deg);
            }
        }
    }

    p {
        margin-top: 0.5rem;
        color: hsl(var(--subtext0));
    }
}

</style>
