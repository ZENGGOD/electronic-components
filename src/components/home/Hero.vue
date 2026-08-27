<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const searchQuery = ref('')

function searchProducts() {
  const keyword = searchQuery.value.trim()

  if (!keyword) {
    router.push('/products')
    return
  }

  router.push({
    path: '/products',
    query: {
      search: keyword,
    },
  })
}

function searchPopular(keyword: string) {
  searchQuery.value = keyword
  searchProducts()
}
</script>

<template>
  <section class="relative overflow-hidden bg-slate-950 text-white">
    <!-- Background -->
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,rgba(37,99,235,0.22),transparent_35%)]"
    ></div>

    <div class="absolute right-0 top-0 h-full w-1/2 opacity-20">
      <div
        class="h-full w-full bg-[linear-gradient(90deg,transparent,rgba(59,130,246,0.3),transparent)]"
      ></div>
    </div>

    <!-- Content -->
    <div class="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
      <div class="max-w-4xl">
        <!-- Label -->
        <div class="mb-6 flex items-center gap-3">
          <span class="h-px w-10 bg-blue-500"></span>

          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            {{ $t('home.label') }}
          </span>
        </div>

        <!-- Title -->
        <h1 class="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-7xl">
          {{ $t('home.title') }}

          <span class="block text-blue-500">
            {{ $t('home.titleHighlight') }}
          </span>
        </h1>

        <!-- Description -->
        <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          {{ $t('home.description') }}
        </p>

        <!-- Buttons -->
        <div class="mt-8 flex flex-wrap gap-4">
          <RouterLink
            to="/products"
            class="rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            {{ $t('home.exploreProducts') }}
          </RouterLink>

          <RouterLink
            to="/request-quote"
            class="rounded-lg border border-slate-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-slate-400 hover:bg-white/5"
          >
            {{ $t('home.requestQuote') }}
          </RouterLink>
        </div>

        <!-- Search -->
        <div class="mt-12 max-w-3xl">
          <div class="flex overflow-hidden rounded-xl border border-slate-700 bg-white shadow-2xl">
            <div class="flex flex-1 items-center">
              <!-- Search Icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.8"
                stroke="currentColor"
                class="ml-5 h-5 w-5 shrink-0 text-slate-400"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                />
              </svg>

              <!-- Input -->
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="$t('home.searchPlaceholder')"
                class="w-full border-0 bg-transparent px-4 py-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                @keyup.enter="searchProducts"
              />
            </div>

            <!-- Search Button -->
            <button
              type="button"
              class="m-1 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-500"
              @click="searchProducts"
            >
              {{ $t('home.search') }}
            </button>
          </div>

          <!-- Popular -->
          <div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{{ $t('home.popular') }}:</span>

            <button
              type="button"
              class="text-slate-300 transition hover:text-blue-400"
              @click="searchPopular('STM32H743VIT6')"
            >
              STM32H743VIT6
            </button>

            <span>•</span>

            <button
              type="button"
              class="text-slate-300 transition hover:text-blue-400"
              @click="searchPopular('LM324DR')"
            >
              LM324DR
            </button>

            <span>•</span>

            <button
              type="button"
              class="text-slate-300 transition hover:text-blue-400"
              @click="searchPopular('SN65HVD230DR')"
            >
              SN65HVD230DR
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
