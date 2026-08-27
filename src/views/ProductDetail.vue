<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import products from '@/data/products'

const route = useRoute()

const partNumber = computed(() => {
  return typeof route.params.partNumber === 'string' ? route.params.partNumber : ''
})

const product = computed(() => {
  const keyword = partNumber.value.trim().toLowerCase()

  return products.find((item) => item.partNumber.toLowerCase() === keyword)
})

function requestQuote() {
  if (!product.value) return

  window.location.href = `/request-quote?product=${encodeURIComponent(product.value.partNumber)}`
}
</script>

<template>
  <main class="min-h-screen bg-slate-50">
    <!-- =========================================================
         Product Not Found
    ========================================================== -->
    <section
      v-if="!product"
      class="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6"
    >
      <div class="text-center">
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-400"
        >
          ?
        </div>

        <h1 class="mt-6 text-3xl font-bold text-slate-900">Product Not Found</h1>

        <p class="mt-3 text-slate-500">The requested electronic component could not be found.</p>

        <RouterLink
          to="/products"
          class="mt-7 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Back to Products
        </RouterLink>
      </div>
    </section>

    <!-- =========================================================
         Product Detail
    ========================================================== -->
    <template v-else>
      <!-- Breadcrumb -->
      <section class="border-b border-slate-200 bg-white">
        <div class="mx-auto max-w-7xl px-6 py-5 lg:px-8">
          <div class="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <RouterLink to="/products" class="transition hover:text-blue-600">
              Products
            </RouterLink>

            <span>/</span>

            <span>
              {{ product.category }}
            </span>

            <span>/</span>

            <span class="font-medium text-slate-900">
              {{ product.partNumber }}
            </span>
          </div>
        </div>
      </section>

      <!-- =====================================================
           Product Hero
      ====================================================== -->
      <section class="border-b border-slate-200 bg-white">
        <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div class="grid gap-12 lg:grid-cols-[1fr_360px]">
            <!-- Product Main Info -->
            <div>
              <div class="flex flex-wrap items-center gap-3">
                <span class="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {{ product.category }}
                </span>

                <span
                  class="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  {{ product.manufacturer }}
                </span>
              </div>

              <h1 class="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                {{ product.partNumber }}
              </h1>

              <p class="mt-4 text-xl font-medium text-slate-600">
                {{ product.title }}
              </p>

              <p class="mt-6 max-w-3xl text-base leading-8 text-slate-500">
                {{ product.description }}
              </p>

              <!-- Product Tags -->
              <div class="mt-7 flex flex-wrap gap-3">
                <span
                  class="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600"
                >
                  Original Components
                </span>

                <span
                  class="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600"
                >
                  B2B Supply
                </span>

                <span
                  class="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600"
                >
                  Technical Support
                </span>
              </div>
            </div>

            <!-- Inquiry Card -->
            <aside>
              <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  B2B Inquiry
                </p>

                <h2 class="mt-3 text-2xl font-bold text-slate-900">Need this component?</h2>

                <p class="mt-3 text-sm leading-6 text-slate-500">
                  Request pricing, stock availability and lead time from our sales team.
                </p>

                <button
                  type="button"
                  class="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                  @click="requestQuote"
                >
                  Request a Quote
                </button>

                <RouterLink
                  to="/contact"
                  class="mt-3 block w-full rounded-lg border border-slate-300 px-5 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
                >
                  Contact Sales
                </RouterLink>

                <p class="mt-5 text-center text-xs leading-5 text-slate-400">
                  Part Number:
                  <span class="font-medium text-slate-600">
                    {{ product.partNumber }}
                  </span>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <!-- =====================================================
           Main Product Information
      ====================================================== -->
      <section class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div class="grid gap-8 lg:grid-cols-[1fr_300px]">
          <!-- Main -->
          <div class="space-y-8">
            <!-- Specifications -->
            <section class="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div class="border-b border-slate-200 px-6 py-5 sm:px-8">
                <h2 class="text-xl font-bold text-slate-900">Specifications</h2>

                <p class="mt-1 text-sm text-slate-500">Basic product information</p>
              </div>

              <div class="divide-y divide-slate-100">
                <div class="grid gap-2 px-6 py-4 sm:grid-cols-[220px_1fr] sm:px-8">
                  <span class="text-sm text-slate-500"> Part Number </span>

                  <span class="text-sm font-semibold text-slate-900">
                    {{ product.partNumber }}
                  </span>
                </div>

                <div class="grid gap-2 px-6 py-4 sm:grid-cols-[220px_1fr] sm:px-8">
                  <span class="text-sm text-slate-500"> Manufacturer </span>

                  <span class="text-sm font-semibold text-slate-900">
                    {{ product.manufacturer }}
                  </span>
                </div>

                <div class="grid gap-2 px-6 py-4 sm:grid-cols-[220px_1fr] sm:px-8">
                  <span class="text-sm text-slate-500"> Category </span>

                  <span class="text-sm font-semibold text-slate-900">
                    {{ product.category }}
                  </span>
                </div>

                <div
                  v-if="product.package"
                  class="grid gap-2 px-6 py-4 sm:grid-cols-[220px_1fr] sm:px-8"
                >
                  <span class="text-sm text-slate-500"> Package </span>

                  <span class="text-sm font-semibold text-slate-900">
                    {{ product.package }}
                  </span>
                </div>
              </div>
            </section>

            <!-- Technical Parameters -->
            <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <h2 class="text-xl font-bold text-slate-900">Technical Parameters</h2>

                <p class="mt-2 text-sm text-slate-500">
                  Key technical information for engineering evaluation.
                </p>
              </div>

              <div class="mt-6 grid gap-4 sm:grid-cols-2">
                <div class="rounded-xl border border-slate-100 bg-slate-50 p-5">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Device Type
                  </p>

                  <p class="mt-2 font-semibold text-slate-900">
                    {{ product.category }}
                  </p>
                </div>

                <div class="rounded-xl border border-slate-100 bg-slate-50 p-5">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Package
                  </p>

                  <p class="mt-2 font-semibold text-slate-900">
                    {{ product.package || 'Contact Sales' }}
                  </p>
                </div>

                <div class="rounded-xl border border-slate-100 bg-slate-50 p-5">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Manufacturer
                  </p>

                  <p class="mt-2 font-semibold text-slate-900">
                    {{ product.manufacturer }}
                  </p>
                </div>

                <div class="rounded-xl border border-slate-100 bg-slate-50 p-5">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Product Status
                  </p>

                  <p class="mt-2 font-semibold text-emerald-600">Available for Inquiry</p>
                </div>
              </div>
            </section>

            <!-- Product Description -->
            <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 class="text-xl font-bold text-slate-900">Product Description</h2>

              <p class="mt-5 leading-8 text-slate-600">
                {{ product.description }}
              </p>
            </section>

            <!-- Applications -->
            <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 class="text-xl font-bold text-slate-900">Applications</h2>

              <p class="mt-2 text-sm text-slate-500">
                Typical applications for this component category.
              </p>

              <div class="mt-6 grid gap-4 sm:grid-cols-2">
                <div class="flex gap-3 rounded-xl bg-slate-50 p-4">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600"
                  >
                    01
                  </div>

                  <div>
                    <h3 class="font-semibold text-slate-900">Industrial Equipment</h3>

                    <p class="mt-1 text-sm leading-6 text-slate-500">
                      Industrial control and automation systems.
                    </p>
                  </div>
                </div>

                <div class="flex gap-3 rounded-xl bg-slate-50 p-4">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600"
                  >
                    02
                  </div>

                  <div>
                    <h3 class="font-semibold text-slate-900">Embedded Systems</h3>

                    <p class="mt-1 text-sm leading-6 text-slate-500">
                      Embedded controllers and electronic devices.
                    </p>
                  </div>
                </div>

                <div class="flex gap-3 rounded-xl bg-slate-50 p-4">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600"
                  >
                    03
                  </div>

                  <div>
                    <h3 class="font-semibold text-slate-900">Communication</h3>

                    <p class="mt-1 text-sm leading-6 text-slate-500">
                      Communication interfaces and networking equipment.
                    </p>
                  </div>
                </div>

                <div class="flex gap-3 rounded-xl bg-slate-50 p-4">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600"
                  >
                    04
                  </div>

                  <div>
                    <h3 class="font-semibold text-slate-900">Power Electronics</h3>

                    <p class="mt-1 text-sm leading-6 text-slate-500">
                      Power management and electronic control applications.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Datasheet -->
            <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="text-xl font-bold text-slate-900">Datasheet</h2>

                  <p class="mt-2 text-sm leading-6 text-slate-500">
                    Technical documentation and manufacturer datasheet.
                  </p>
                </div>

                <button
                  type="button"
                  class="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
                  @click="requestQuote"
                >
                  Request Datasheet
                </button>
              </div>

              <div class="mt-6 flex items-center gap-4 rounded-xl bg-slate-50 p-5">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 font-bold text-red-600"
                >
                  PDF
                </div>

                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-slate-900">{{ product.partNumber }} Datasheet</p>

                  <p class="mt-1 text-sm text-slate-500">Manufacturer technical documentation</p>
                </div>

                <button
                  type="button"
                  class="hidden rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 sm:block"
                  @click="requestQuote"
                >
                  Get Datasheet
                </button>
              </div>
            </section>
          </div>

          <!-- ===================================================
               Right Sidebar
          ==================================================== -->
          <aside class="lg:sticky lg:top-28 lg:h-fit">
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 class="font-bold text-slate-900">Interested in this component?</h2>

              <p class="mt-3 text-sm leading-6 text-slate-500">
                Send us your required quantity and delivery requirements.
              </p>

              <button
                type="button"
                class="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                @click="requestQuote"
              >
                Request a Quote
              </button>

              <div class="mt-6 border-t border-slate-100 pt-6">
                <div class="flex justify-between gap-4 text-sm">
                  <span class="text-slate-500"> Part Number </span>

                  <span class="text-right font-semibold text-slate-900">
                    {{ product.partNumber }}
                  </span>
                </div>

                <div class="mt-4 flex justify-between gap-4 text-sm">
                  <span class="text-slate-500"> Manufacturer </span>

                  <span class="text-right font-semibold text-slate-900">
                    {{ product.manufacturer }}
                  </span>
                </div>

                <div class="mt-4 flex justify-between gap-4 text-sm">
                  <span class="text-slate-500"> Category </span>

                  <span class="text-right font-semibold text-slate-900">
                    {{ product.category }}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <!-- Bottom CTA -->
      <section class="border-t border-slate-200 bg-slate-950 text-white">
        <div class="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-wider text-blue-400">
                B2B Component Sourcing
              </p>

              <h2 class="mt-2 text-2xl font-bold">Need pricing or availability?</h2>

              <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Contact our sales team for quantity pricing, availability, lead time and sourcing
                support.
              </p>
            </div>

            <button
              type="button"
              class="shrink-0 rounded-lg bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              @click="requestQuote"
            >
              Request a Quote
            </button>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>
