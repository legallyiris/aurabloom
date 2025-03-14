import type { User } from "@/apiTypes";
import { api } from "@/services/api";
import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false,
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    loggedIn: (state) => state.isAuthenticated,
    username: (state) => state.user?.username || "",
  },

  actions: {
    async login(options: { username: string; password: string }) {
      this.isLoading = true;
      this.error = null;

      try {
        const { username, password } = options;
        const { data, error } = await api.api.auth.login.post({
          username,
          password,
        });

        if (data) {
          this.user = data.data;
          this.isAuthenticated = true;
        }
        if (error) {
          if (error.status === 422) {
            this.error = error.value.message || "validation failed";
            console.error(error);
          } else {
            this.error = error.value || "login failed";
          }
        }
      } catch (err) {
        this.error = "login failed";
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    async register(options: {
      username: string;
      displayName?: string;
      password: string;
    }) {
      this.isLoading = true;

      try {
        const { username, displayName, password } = options;
        const { error } = await api.api.users.users.post({
          username,
          displayName: displayName || username,
          password,
        });

        if (error) {
          if (error.status === 422) {
            this.error = error.value.message || "validation failed";
            console.error(error);
          } else {
            this.error = error.value || "registration failed";
          }
        } else {
          this.isAuthenticated = true;
        }
      } catch (err) {
        this.error = "registration failed";
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      this.isLoading = true;

      try {
        await api.api.auth.logout.post();
        this.user = null;
        this.isAuthenticated = false;
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchCurrentUser() {
      this.isLoading = true;
      try {
        const { data, error } = await api.api.users.me.get();

        if (data) {
          this.user = data.data;
          this.isAuthenticated = true;
        }

        if (error) this.error = error.value || "login failed";
      } catch (err) {
        this.user = null;
        this.isAuthenticated = false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
