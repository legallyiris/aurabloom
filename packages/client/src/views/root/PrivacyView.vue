<template>
  <div class="privacy-container">
    <h1>privacy policy</h1>
    <div class="privacy-content" v-html="policyHtml" v-if="!error"></div>
    <div v-if="error">
      <p>
        failed to load privacy policy. you can try to reload the page or go
        to the markdown file directly.
      </p>

      <div class="buttons">
        <AppButton @click="reloadPage">reload Page</AppButton>
        <AppButton @click="goToMarkdown">go to markdown</AppButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import AppButton from "@/components/AppButton.vue";
import { error, loadPrivacyPolicy, policyHtml } from "@/utils/privacyPolicy";
import { onMounted } from "vue";

const reloadPage = () => {
  window.location.reload();
};

const goToMarkdown = () => {
  window.location.href = "/policies/privacy.md";
};

onMounted(async () => {
  if (!policyHtml.value && !error.value) {
    await loadPrivacyPolicy();
  }
});
</script>

<style scoped>
.privacy-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  line-height: 1.6;
}

.privacy-content:deep() {
  margin-top: 20px;
    a {
        color: hsl(var(--blue));
        text-decoration: none;
        &:hover {
            text-decoration: underline;
        }
    }


    h2 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
    }

    ul {
        padding-left: 1.5em;
    }
}

.buttons {
  display: flex;
  gap: 1rem;
}
</style>
