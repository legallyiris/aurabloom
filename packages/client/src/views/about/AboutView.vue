<script setup lang="ts">
import AppButton from "@/components/AppButton.vue";
</script>

<template>
  <main>
    <div class="hero">
        <div class="hero-content">
            <span class="flower">🌸</span>
            <h1>aurabloom</h1>
            <p>free & open source chat</p>

            <div class="buttons">
                <AppButton url="/login">login</AppButton>
                <AppButton variant="accent" url="/register">register</AppButton>
            </div>
        </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
main {
    max-width: 1200px;
    margin: 0 auto;
}

.hero {
    width: 100%;
    height: 100dvh;
    padding: 2rem;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .hero-content {
        position: relative;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        width: 100%;
        max-width: 768px;

        .flower {
            font-size: 4rem;
            animation: spin 20s linear infinite;
        }

        h1 {
            font-size: 5rem;
            margin: 0.5rem 0;
            font-weight: 900;
            position: relative;
        }

        p {
            font-size: 1.25rem;
            color: hsla(var(--subtext0) / 1);
            font-weight: 500;
            margin-top: 0;
        }
    }
}

.buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
}


@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
