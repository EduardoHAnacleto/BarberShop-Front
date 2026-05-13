<script setup lang="ts">
// Root component. Delegates entirely to the active layout + page; the layout
// is selected by each page via definePageMeta({ layout: ... }).
</script>

<template>
  <!-- NuxtLayout wraps the active page in the layout selected by the route. -->
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
