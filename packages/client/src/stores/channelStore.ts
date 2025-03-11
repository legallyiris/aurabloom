import type {
  Channel,
  ChannelsError,
  Message,
  MessagesError,
  SendMessageError,
} from "@/apiTypes";
import { api } from "@/services/api";
import { defineStore } from "pinia";

export const useChannelStore = defineStore("channel", {
  state: () => ({
    channels: [] as Channel[],
    currentChannel: null as Channel | null,
    messages: [] as Message[],
    isLoading: false,
    error: null as
      | ChannelsError
      | MessagesError
      | SendMessageError
      | string
      | null,
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

        if (data) this.channels = data.data;
        if (error) this.error = error;
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
        const { data, error } = await api.api
          .messages({ channelId })
          .get({ query: {} });

        if (data) this.messages = data.data;
        if (error) this.error = error;
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
          this.error = error;
          return false;
        }

        if (data?.data) this.messages.push(data.data as unknown as Message);
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
