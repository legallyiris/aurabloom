<script setup lang="ts">
import AppButton from "@/components/AppButton.vue";
import { useAuthStore } from "@/stores/authStore";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const displayName = ref("");
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const isRegistration = computed(() => route.path === "/register");
const pageTitle = computed(() =>
  isRegistration.value ? "create account" : "welcome back!",
);
const pageSubtitle = computed(() =>
  isRegistration.value ? "join aurabloom today!" : "sign in to aurabloom",
);
const buttonText = computed(() =>
  isRegistration.value ? "register" : "sign in",
);
const loadingText = computed(() =>
  isRegistration.value ? "creating account..." : "signing in...",
);
const altActionText = computed(() =>
  isRegistration.value ? "already have an account?" : "don't have an account?",
);
const altActionLink = computed(() =>
  isRegistration.value ? "/login" : "/register",
);
const altActionLinkText = computed(() =>
  isRegistration.value ? "log in" : "register",
);

const validationError = ref("");
const isSubmitting = ref(false);

const validateForm = () => {
  if (isRegistration.value) {
    if (password.value !== confirmPassword.value) {
      validationError.value = "passwords don't match";
      return false;
    }

    if (password.value.length < 8) {
      validationError.value = "password must be at least 8 characters";
      return false;
    }
  }

  validationError.value = "";
  return true;
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  if (!validateForm()) return;

  isSubmitting.value = true;

  if (isRegistration.value) {
    await authStore.register({
      username: username.value,
      password: password.value,
    });
  } else {
    await authStore.login({
      username: username.value,
      password: password.value,
    });
  }

  isSubmitting.value = false;
  if (authStore.isAuthenticated) redirectToApp();
};

const redirectToApp = () => {
  router.push("/app");
};
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <div class="logo">🌸</div>
        <h1>{{ pageTitle }}</h1>
        <p>{{ pageSubtitle }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div>
          <div class="form-group">
            <label for="username">username</label>
            <input id="username" v-model="username" type="text" required autocomplete="username" />
          </div>

          <div class="form-group" v-if="isRegistration">
            <label for="display-name">display name</label>
            <input id="display-name" v-model="displayName" type="text" required autocomplete="name" />
          </div>

          <div class="form-group">
            <label for="password">password</label>
            <input id="password" v-model="password" type="password" required
              :autocomplete="isRegistration ? 'new-password' : 'current-password'" />
        </div>

        <div class="form-group" v-if="isRegistration">
            <label for="confirm-password">confirm password</label>
            <input id="confirm-password" v-model="confirmPassword" type="password" required
                autocomplete="new-password" />
        </div>

        <div class="error" v-if="validationError">
        {{ validationError }}
        </div>

          <div class="error" v-if="authStore.error">
            {{ authStore.error }}
          </div>

          <div class="form-actions">
            <AppButton type="submit" variant="accent"
              :disabled="isSubmitting || !username || !password || (isRegistration && !confirmPassword)">
              {{ isSubmitting ? loadingText : buttonText }}
            </AppButton>
          </div>
        </div>

        <div>
          <div class="alt-action-link">
            {{ altActionText }} <RouterLink :to="altActionLink">{{ altActionLinkText }}</RouterLink>
          </div>

          <div class="privacy-link">
            by continuing, you agree to our <RouterLink to="/privacy">privacy policy</RouterLink>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  min-height: 600px;
  padding: 2rem;
  background-color: hsl(var(--base));
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px hsla(var(--crust) / 0.1);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;

  .logo {
    font-size: 3rem;
  }

  h1 {
    margin: 0.5rem 0 0;
    font-size: 1.75rem;
    color: hsl(var(--text));
  }

  p {
    margin: 0.5rem 0 0;
    color: hsl(var(--subtext0));
  }
}

.auth-form {
  .form-group {
    margin-bottom: 1.25rem;
    justify-content: space-between;
    flex: 1;

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: hsl(var(--subtext1));
    }

    input {
      width: 100%;
      padding: 0.75rem;
      background-color: hsl(var(--surface0));
      border: 1px solid hsla(var(--overlay0) / 0.5);
      border-radius: 0.375rem;
      color: hsl(var(--text));

      &:focus {
        outline: none;
        border-color: hsl(var(--accent));
        box-shadow: 0 0 0 2px hsla(var(--accent) / 0.2);
      }
    }
  }

  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    .remember-me {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      input {
        accent-color: hsl(var(--accent));
      }

      label {
        font-size: 0.875rem;
        color: hsl(var(--subtext0));
      }
    }

    .forgot-link {
      font-size: 0.875rem;
      color: hsl(var(--blue));
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .error {
    padding: 0.75rem;
    margin-bottom: 1rem;
    background-color: hsla(var(--red) / 0.1);
    border: 1px solid hsla(var(--red) / 0.3);
    border-radius: 0.375rem;
    color: hsl(var(--red));
    font-size: 0.875rem;
  }

  .form-actions {
    margin-bottom: 1.5rem;

    button {
      width: 100%;
      justify-content: center;
    }
  }

  .alt-action-link,
  .privacy-link {
    text-align: center;
    font-size: 0.875rem;
    color: hsl(var(--subtext0));

    a {
      color: hsl(var(--blue));
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .privacy-link {
    font-size: 0.75rem;
    margin-top: 1rem;

    a {
      color: hsl(var(--blue));
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}


@media (max-width: 480px) {
  .auth-page {
    background-color: hsl(var(--mantle));
    padding: 0;
  }

  .auth-container {
    max-width: 100%;
    width: 100%;
    height: 100vh;
    border-radius: 0;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .auth-form {
    .form-group input {
      font-size: 1rem;
      padding: 0.875rem;
    }

    .form-actions button {
      padding: 0.75rem;
      font-size: 1rem;
    }
  }
}

@media (min-width: 968px) {
  .auth-page {
    padding: 0;
  }

  .auth-container {
    max-width: 900px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 0;
    overflow: hidden;
  }

  .auth-header {
    position: relative;
    margin: 0.5rem;
    border-radius: 1rem;
    overflow: hidden;
    text-align: left;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    z-index: 1;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: hsl(var(--crust));
      z-index: -1;
    }

    .logo {
      font-size: 5rem;
      margin: 0;
    }

    h1 {
      font-size: 2.5rem;
      margin: 0;
    }

    p {
      margin: 0;
      font-size: 1.2rem;
      font-weight: bold;
    }
  }

  .auth-form {
    padding: 3rem 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
}
</style>
