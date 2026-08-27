<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const socialLinks = [
  {
    name: 'Facebook',
    href: '#',
  },
  {
    name: 'WhatsApp',
    href: '#',
  },
  {
    name: 'TikTok',
    href: '#',
  },
  {
    name: 'Instagram',
    href: '#',
  },
]
</script>

<template>
  <footer class="border-t border-slate-800 bg-slate-950 text-slate-300">
    <div class="mx-auto max-w-7xl px-6 py-14 lg:px-8">
      <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <!-- Brand -->
        <div class="lg:col-span-2">
          <RouterLink to="/" class="inline-flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white"
            >
              EC
            </div>

            <div>
              <div class="text-lg font-bold tracking-tight text-white">Electronic Components</div>

              <div class="text-xs text-slate-500">Semiconductor Solutions</div>
            </div>
          </RouterLink>

          <p class="mt-5 max-w-xl text-sm leading-6 text-slate-400">
            {{ t('footer.description') }}
          </p>

          <!-- Social -->
          <div class="mt-6">
            <p class="text-sm font-semibold text-white">
              {{ t('footer.connectWithUs') }}
            </p>

            <div class="mt-4 flex flex-wrap gap-3">
              <a
                v-for="social in socialLinks"
                :key="social.name"
                :href="social.href"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:bg-blue-600 hover:text-white"
              >
                {{ social.name }}
              </a>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wider text-white">
            {{ t('footer.navigation') }}
          </h3>

          <div class="mt-5 space-y-3">
            <RouterLink
              to="/products"
              class="block text-sm text-slate-400 transition hover:text-blue-400"
            >
              {{ t('nav.products') }}
            </RouterLink>

            <RouterLink
              to="/manufacturers"
              class="block text-sm text-slate-400 transition hover:text-blue-400"
            >
              {{ t('nav.manufacturers') }}
            </RouterLink>

            <RouterLink
              to="/technical"
              class="block text-sm text-slate-400 transition hover:text-blue-400"
            >
              {{ t('nav.technical') }}
            </RouterLink>

            <RouterLink
              to="/about"
              class="block text-sm text-slate-400 transition hover:text-blue-400"
            >
              {{ t('nav.about') }}
            </RouterLink>

            <RouterLink
              to="/contact"
              class="block text-sm text-slate-400 transition hover:text-blue-400"
            >
              {{ t('nav.contact') }}
            </RouterLink>
          </div>
        </div>

        <!-- Business -->
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wider text-white">
            {{ t('footer.business') }}
          </h3>

          <div class="mt-5 space-y-3 text-sm text-slate-400">
            <p>{{ t('footer.componentSourcing') }}</p>
            <p>{{ t('footer.b2bQuotation') }}</p>
            <p>{{ t('footer.technicalSupport') }}</p>

            <RouterLink
              to="/request-quote"
              class="inline-block pt-2 font-semibold text-blue-400 transition hover:text-blue-300"
            >
              {{ t('footer.requestQuote') }} →
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Bottom -->
      <div
        class="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"
      >
        <p>
          © {{ new Date().getFullYear() }} Electronic Components.
          {{ t('footer.allRightsReserved') }}
        </p>

        <div class="flex gap-5">
          <RouterLink to="/about" class="transition hover:text-slate-300">
            {{ t('nav.about') }}
          </RouterLink>

          <RouterLink to="/contact" class="transition hover:text-slate-300">
            {{ t('nav.contact') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </footer>
</template>
