import { api } from "@/services/api";
import { defineStore } from "pinia";

export const useChannelStore = defineStore("channel", {
  state: () => ({
    channels: [] as any[],
    currentChannel: null as any,
    messages: [] as any[],
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    channelList: (state) => state.channels,
    currentMessages: (state) => state.messages,
  },

  actions: {
    async fetchChannels(communityId: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const { data, error } = await api.api.channels({ communityId }).get();

        if (data) {
          this.channels = data.data;
        }
        if (error) {
          this.error = error.value || "failed to fetch channels";
        }
      } catch (err) {
        this.error = "failed to fetch channels";
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMessages(channelId: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const { data, error } = await api.api.messages({ channelId }).get();

        if (data) {
          this.messages = data.data;
        }
        if (error) {
          this.error = error.value || "failed to fetch messages";
        }
      } catch (err) {
        this.error = "failed to fetch messages";
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    async sendMessage(channelId: string, content: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const { data, error } = await api.api.messages({ channelId }).post({
          content,
        });

        if (error) {
          this.error = error.value || "failed to send message";
          return false;
        }

        if (data?.data) this.messages.push(data.data);
        return true;
      } catch (err) {
        this.error = "failed to send message";
        console.error(err);
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
