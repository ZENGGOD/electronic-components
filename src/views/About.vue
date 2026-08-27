<script setup lang="ts">
import { RouterLink } from 'vue-router'

const capabilities = [
  {
    title: 'semiconductorComponents',
    description: 'semiconductorComponentsDescription',
  },
  {
    title: 'componentSourcing',
    description: 'componentSourcingDescription',
  },
  {
    title: 'technicalSupport',
    description: 'technicalSupportDescription',
  },
  {
    title: 'b2bSupply',
    description: 'b2bSupplyDescription',
  },
]

const categories = [
  'mcu',
  'analogIc',
  'powerManagement',
  'communicationIc',
  'dspDsc',
  'industrialControl',
]

const advantages = [
  'wideRange',
  'partNumberSearch',
  'technicalInformation',
  'b2bQuotation',
  'flexibleSourcing',
  'professionalCommunication',
]
</script>

<template>
  <main class="min-h-screen bg-slate-50">
    <!-- Hero -->
    <section class="bg-slate-950 text-white">
      <div class="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
          {{ $t('about.label') }}
        </p>

        <h1 class="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          {{ $t('about.heroTitle') }}
          <span class="text-blue-500"> {{ $t('about.heroTitleHighlight') }} </span>
        </h1>

        <p class="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
          {{ $t('about.description') }}
        </p>
      </div>
    </section>

    <!-- Who We Are -->
    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div class="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p class="text-sm font-semibold uppercase tracking-widest text-blue-600">
              {{ $t('about.whoWeAre') }}
            </p>

            <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {{ $t('about.whoWeAreTitle') }}
            </h2>

            <p class="mt-5 leading-7 text-slate-600">
              {{ $t('about.whoWeAreDescription1') }}
            </p>

            <p class="mt-4 leading-7 text-slate-600">
              {{ $t('about.whoWeAreDescription2') }}
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-8">
            <div class="grid gap-6 sm:grid-cols-2">
              <div>
                <p class="text-3xl font-bold text-blue-600">100+</p>

                <p class="mt-2 text-sm text-slate-500">
                  {{ $t('about.componentModels') }}
                </p>
              </div>

              <div>
                <p class="text-3xl font-bold text-blue-600">B2B</p>

                <p class="mt-2 text-sm text-slate-500">
                  {{ $t('about.businessFocus') }}
                </p>
              </div>

              <div>
                <p class="text-3xl font-bold text-blue-600">Global</p>

                <p class="mt-2 text-sm text-slate-500">
                  {{ $t('about.globalSupport') }}
                </p>
              </div>

              <div>
                <p class="text-3xl font-bold text-blue-600">Technical</p>

                <p class="mt-2 text-sm text-slate-500">
                  {{ $t('about.productResources') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- What We Provide -->
    <section class="bg-slate-50">
      <div class="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div class="max-w-3xl">
          <p class="text-sm font-semibold uppercase tracking-widest text-blue-600">
            {{ $t('about.whatWeProvide') }}
          </p>

          <h2 class="mt-3 text-3xl font-bold text-slate-900">
            {{ $t('about.sourcingSolutions') }}
          </h2>

          <p class="mt-4 text-slate-500">
            {{ $t('about.sourcingSolutionsDescription') }}
          </p>
        </div>

        <div class="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <article
            v-for="item in capabilities"
            :key="item.title"
            class="rounded-xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
            >
              ✓
            </div>

            <h3 class="mt-5 font-bold text-slate-900">
              {{ $t(`about.capabilities.${item.title}`) }}
            </h3>

            <p class="mt-3 text-sm leading-6 text-slate-500">
              {{ $t(`about.capabilities.${item.description}`) }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- Product Categories -->
    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div class="text-center">
          <p class="text-sm font-semibold uppercase tracking-widest text-blue-600">
            {{ $t('about.productCategories') }}
          </p>

          <h2 class="mt-3 text-3xl font-bold text-slate-900">
            {{ $t('about.componentsWeSupport') }}
          </h2>
        </div>

        <div class="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="category in categories"
            :key="category"
            class="rounded-xl border border-slate-200 p-5 text-center transition hover:border-blue-300 hover:bg-blue-50"
          >
            <span class="text-sm font-semibold text-slate-700">
              {{ $t(`about.categories.${category}`) }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Choose Us -->
    <section class="bg-slate-950 text-white">
      <div class="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div class="grid gap-12 lg:grid-cols-2">
          <div>
            <p class="text-sm font-semibold uppercase tracking-widest text-blue-400">
              {{ $t('about.whyChooseUs') }}
            </p>

            <h2 class="mt-3 text-3xl font-bold">
              {{ $t('about.builtForTeams') }}
            </h2>

            <p class="mt-5 leading-7 text-slate-300">
              {{ $t('about.whyChooseDescription') }}
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div
              v-for="advantage in advantages"
              :key="advantage"
              class="rounded-lg border border-slate-800 bg-slate-900 p-4"
            >
              <div class="flex gap-3">
                <span class="text-blue-400">✓</span>

                <span class="text-sm text-slate-300">
                  {{ $t(`about.advantages.${advantage}`) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-white">
      <div class="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 class="text-3xl font-bold text-slate-900">
          {{ $t('about.ctaTitle') }}
        </h2>

        <p class="mx-auto mt-4 max-w-2xl text-slate-500">
          {{ $t('about.ctaDescription') }}
        </p>

        <div class="mt-8 flex flex-wrap justify-center gap-4">
          <RouterLink
            to="/products"
            class="rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            {{ $t('about.exploreProducts') }}
          </RouterLink>

          <RouterLink
            to="/request-quote"
            class="rounded-lg border border-slate-300 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {{ $t('about.requestQuote') }}
          </RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>
