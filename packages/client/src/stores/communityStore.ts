import type { App as AurabloomApp } from "@aurabloom/server";
import { treaty } from "@elysiajs/eden";
import { defineStore } from "pinia";

export const useCommunityStore = defineStore("community", {
  state: () => ({
    communities: [] as any[],
    currentCommunity: null as any,
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    communityList: (state) => state.communities,
  },

  actions: {
    async fetchPublicCommunities() {
      this.isLoading = true;
      this.error = null;

      const api = treaty<AurabloomApp>("http://localhost:3000", {
        fetch: {
          credentials: "include",
        },
      });

      try {
        const { data, error } = await api.api.communities.index.get();

        if (data) {
          this.communities = data.data;
        }
        if (error) {
          this.error = error.value || "failed to fetch communities";
        }
      } catch (err) {
        this.error = "failed to fetch communities";
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMyCommunities() {
      this.isLoading = true;
      this.error = null;

      const api = treaty<AurabloomApp>("http://localhost:3000", {
        fetch: {
          credentials: "include",
        },
      });

      try {
        const { data, error } = await api.api.communities.me.get();

        if (data) {
          this.communities = data.data;
        }
        if (error) {
          this.error = error.value || "failed to fetch your communities";
        }
      } catch (err) {
        this.error = "failed to fetch your communities";
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    async joinCommunity(communityId: string) {
      this.isLoading = true;
      this.error = null;

      const api = treaty<AurabloomApp>("http://localhost:3000", {
        fetch: {
          credentials: "include",
        },
      });

      try {
        const { error } = await api.api
          .communities({ id: communityId })
          .join.post();

        if (error) {
          this.error = error.value || "failed to join community";
          return false;
        }
        return true;
      } catch (err) {
        this.error = "failed to join community";
        console.error(err);
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
