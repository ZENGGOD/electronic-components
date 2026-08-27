<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const mobileMenuOpen = ref(false)

function changeLanguage(language: 'en' | 'zh') {
  locale.value = language
  localStorage.setItem('locale', language)
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div class="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-3" @click="closeMobileMenu">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white"
        >
          EC
        </div>

        <div>
          <div class="text-lg font-bold tracking-tight text-slate-900">Electronic Components</div>

          <div class="text-xs text-slate-500">Semiconductor Solutions</div>
        </div>
      </RouterLink>

      <!-- Desktop Navigation -->
      <nav class="hidden items-center gap-7 lg:flex">
        <RouterLink
          to="/products"
          class="text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          {{ $t('nav.products') }}
        </RouterLink>

        <RouterLink
          to="/manufacturers"
          class="text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          {{ $t('nav.manufacturers') }}
        </RouterLink>

        <RouterLink
          to="/technical"
          class="text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          {{ $t('nav.technical') }}
        </RouterLink>

        <RouterLink
          to="/about"
          class="text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          {{ $t('nav.about') }}
        </RouterLink>

        <RouterLink
          to="/contact"
          class="text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          {{ $t('nav.contact') }}
        </RouterLink>
      </nav>

      <!-- Right Actions -->
      <div class="hidden items-center gap-3 lg:flex">
        <!-- Language Switch -->
        <div class="flex items-center rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-semibold transition"
            :class="
              locale === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            "
            @click="changeLanguage('en')"
          >
            EN
          </button>

          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-semibold transition"
            :class="
              locale === 'zh' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            "
            @click="changeLanguage('zh')"
          >
            中文
          </button>
        </div>

        <!-- Quote Button -->
        <RouterLink
          to="/request-quote"
          class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {{ $t('nav.requestQuote') }}
        </RouterLink>
      </div>

      <!-- Mobile Actions -->
      <div class="flex items-center gap-2 lg:hidden">
        <!-- Mobile Language -->
        <div class="flex items-center rounded-lg border border-slate-200 p-1">
          <button
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-semibold transition"
            :class="
              locale === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            "
            @click="changeLanguage('en')"
          >
            EN
          </button>

          <button
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-semibold transition"
            :class="
              locale === 'zh' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            "
            @click="changeLanguage('zh')"
          >
            中
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <button
          type="button"
          class="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100"
          aria-label="Open menu"
          :aria-expanded="mobileMenuOpen"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg
            v-if="!mobileMenuOpen"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.8"
            stroke="currentColor"
            class="h-6 w-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>

          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.8"
            stroke="currentColor"
            class="h-6 w-6"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-if="mobileMenuOpen" class="border-t border-slate-200 bg-white lg:hidden">
      <nav class="mx-auto max-w-7xl px-6 py-5">
        <div class="flex flex-col gap-1">
          <RouterLink
            to="/products"
            class="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
            @click="closeMobileMenu"
          >
            {{ $t('nav.products') }}
          </RouterLink>

          <RouterLink
            to="/manufacturers"
            class="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
            @click="closeMobileMenu"
          >
            {{ $t('nav.manufacturers') }}
          </RouterLink>

          <RouterLink
            to="/technical"
            class="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
            @click="closeMobileMenu"
          >
            {{ $t('nav.technical') }}
          </RouterLink>

          <RouterLink
            to="/about"
            class="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
            @click="closeMobileMenu"
          >
            {{ $t('nav.about') }}
          </RouterLink>

          <RouterLink
            to="/contact"
            class="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
            @click="closeMobileMenu"
          >
            {{ $t('nav.contact') }}
          </RouterLink>

          <RouterLink
            to="/request-quote"
            class="mt-3 rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500"
            @click="closeMobileMenu"
          >
            {{ $t('nav.requestQuote') }}
          </RouterLink>
        </div>
      </nav>
    </div>
  </header>
</template>
