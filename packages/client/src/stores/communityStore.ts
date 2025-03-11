import type {
  JoinCommunityError,
  JoinedCommunitiesError,
  JoinedCommunity,
  PublicCommunity,
} from "@/apiTypes";
import { api } from "@/services/api";
import { defineStore } from "pinia";

export const useCommunityStore = defineStore("community", {
  state: () => ({
    communities: [] as JoinedCommunity[],
    currentCommunity: null as JoinedCommunity | null,
    isLoading: false,
    error: null as
      | JoinedCommunitiesError
      | PublicCommunity
      | JoinCommunityError
      | string
      | null,
  }),

  getters: {
    communityList: (state) => state.communities,
  },

  actions: {
    async fetchPublicCommunities() {
      this.isLoading = true;
      this.error = null;

      try {
        const { data, error } = await api.api.communities.index.get();

        if (data) return data.data;
        if (error) this.error = error;
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

      try {
        const { data, error } = await api.api.communities.me.get();
        if (data) this.communities = data.data;
        if (error) this.error = error;
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

      try {
        const { error } = await api.api
          .communities({ id: communityId })
          .join.post();

        if (error) {
          this.error = error;
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
