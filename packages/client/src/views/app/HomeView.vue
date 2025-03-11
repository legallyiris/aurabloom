<template>
  <div class="app-home">
    <h2>welcome to aurabloom</h2>
    <p>select a community to get started</p>
  </div>
</template>

<style lang="scss" scoped>
.app-home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
  color: hsl(var(--text));

  h2 {
    margin-bottom: 1rem;
  }

  p {
    color: hsl(var(--subtext0));
  }
}
</style>
