<script setup lang="ts">
// Public About page — shop story, contact details and location map.
definePageMeta({ layout: 'default' })
</script>

<template>
  <div class="min-h-screen">
    <!-- Sticky navigation. -->
    <LayoutPublicNavbar />

    <div class="max-w-3xl mx-auto px-4 py-16 space-y-12">
      <!-- Page header. -->
      <div class="text-center space-y-3">
        <!-- Decorative gold "B" medallion. -->
        <div
          class="w-16 h-16 rounded-xl bg-gold-500/20 border border-gold-500/30
                 flex items-center justify-center mx-auto mb-6"
        >
          <span class="font-display font-bold text-gold-400 text-2xl">B</span>
        </div>
        <h1 class="font-display text-4xl text-primary">About Us</h1>
        <p class="text-secondary text-lg max-w-xl mx-auto">
          Premium grooming services in the heart of the city.
          We believe a great haircut changes everything.
        </p>
      </div>

      <!-- Divider. -->
      <div class="divider" />

      <!-- Shop story. -->
      <section class="space-y-4">
        <h2 class="font-display text-2xl text-primary">Our Story</h2>
        <p class="text-secondary leading-relaxed">
          Founded with a passion for the craft, BarberShop was built to bring old-world barbering
          tradition into the modern age. Every cut, every shave, every trim is performed with
          precision and care by our team of experienced professionals.
        </p>
        <p class="text-secondary leading-relaxed">
          We take pride in creating an experience — not just a haircut. From the moment you walk
          through our doors to the moment you leave, your satisfaction is our top priority.
        </p>
      </section>

      <!-- Divider. -->
      <div class="divider" />

      <!-- Location & contact — full-size map. -->
      <section>
        <h2 class="font-display text-2xl text-primary mb-6">Location &amp; Contact</h2>
        <ShopLocationCard :compact="false" />
      </section>
    </div>
  </div>
</template>
