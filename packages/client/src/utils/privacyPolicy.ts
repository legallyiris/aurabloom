import { marked } from "marked";
import { ref } from "vue";

export const policyHtml = ref("");
export const error = ref(false);

export async function loadPrivacyPolicy() {
  try {
    const response = await fetch("/policies/privacy.md");
    const markdown = await response.text();
    if (markdown.startsWith("<!DOCTYPE html>")) {
      error.value = true;
      return false;
    }

    policyHtml.value = await marked(markdown);
    return true;
  } catch (err) {
    console.error("failed to load privacy policy:", err);
    error.value = true;
    return false;
  }
}
