<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const partNumber = computed(() => {
  const value = route.query.partNumber

  return typeof value === 'string' ? value : ''
})

const manufacturer = computed(() => {
  const value = route.query.manufacturer

  return typeof value === 'string' ? value : ''
})

const form = ref({
  partNumber: partNumber.value,
  manufacturer: manufacturer.value,
  quantity: '',
  company: '',
  name: '',
  email: '',
  phone: '',
  message: '',
})

const submitted = ref(false)

function submitQuote() {
  console.log('Quote Request:', form.value)

  submitted.value = true
}
</script>

<template>
  <main class="min-h-screen bg-slate-50">
    <!-- Header -->
    <section class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <p class="text-sm font-semibold uppercase tracking-widest text-blue-600">
          {{ $t('quote.label') }}
        </p>

        <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          {{ $t('quote.title') }}
        </h1>

        <p class="mt-4 max-w-2xl text-slate-500">
          {{ $t('quote.description') }}
        </p>
      </div>
    </section>

    <!-- Form -->
    <section class="mx-auto max-w-5xl px-6 py-12 lg:px-8">
      <div
        v-if="submitted"
        class="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
        >
          ✓
        </div>

        <h2 class="mt-5 text-2xl font-bold text-slate-900">
          {{ $t('quote.submitted') }}
        </h2>

        <p class="mx-auto mt-3 max-w-lg text-slate-600">
          {{ $t('quote.submittedDescription') }}
        </p>

        <RouterLink
          to="/products"
          class="mt-7 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
        >
          {{ $t('quote.continueBrowsing') }}
        </RouterLink>
      </div>

      <form
        v-else
        class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        @submit.prevent="submitQuote"
      >
        <!-- Product Information -->
        <div>
          <h2 class="text-xl font-bold text-slate-900">
            {{ $t('quote.productInformation') }}
          </h2>

          <p class="mt-2 text-sm text-slate-500">
            {{ $t('quote.productInformationDescription') }}
          </p>
        </div>

        <div class="mt-6 grid gap-6 sm:grid-cols-2">
          <!-- Part Number -->
          <div>
            <label for="partNumber" class="text-sm font-semibold text-slate-700">
              {{ $t('quote.partNumber') }}
            </label>

            <input
              id="partNumber"
              v-model="form.partNumber"
              type="text"
              required
              :placeholder="$t('quote.partNumberPlaceholder')"
              class="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <!-- Quantity -->
          <div>
            <label for="quantity" class="text-sm font-semibold text-slate-700">
              {{ $t('quote.quantity') }}
            </label>

            <input
              id="quantity"
              v-model="form.quantity"
              type="text"
              required
              :placeholder="$t('quote.quantityPlaceholder')"
              class="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <!-- Manufacturer -->
          <div>
            <label for="manufacturer" class="text-sm font-semibold text-slate-700">
              {{ $t('quote.manufacturer') }}
            </label>

            <input
              id="manufacturer"
              v-model="form.manufacturer"
              type="text"
              :placeholder="$t('quote.manufacturerPlaceholder')"
              class="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <!-- Company Information -->
        <div class="mt-10 border-t border-slate-200 pt-10">
          <h2 class="text-xl font-bold text-slate-900">
            {{ $t('quote.companyInformation') }}
          </h2>

          <p class="mt-2 text-sm text-slate-500">
            {{ $t('quote.companyInformationDescription') }}
          </p>

          <div class="mt-6 grid gap-6 sm:grid-cols-2">
            <!-- Company -->
            <div>
              <label for="company" class="text-sm font-semibold text-slate-700">
                {{ $t('quote.company') }}
              </label>

              <input
                id="company"
                v-model="form.company"
                type="text"
                required
                :placeholder="$t('quote.companyPlaceholder')"
                class="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <!-- Name -->
            <div>
              <label for="name" class="text-sm font-semibold text-slate-700">
                {{ $t('quote.contactName') }}
              </label>

              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                :placeholder="$t('quote.namePlaceholder')"
                class="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="text-sm font-semibold text-slate-700">
                {{ $t('quote.businessEmail') }}
              </label>

              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                :placeholder="$t('quote.emailPlaceholder')"
                class="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <!-- Phone -->
            <div>
              <label for="phone" class="text-sm font-semibold text-slate-700">
                {{ $t('quote.phone') }}
              </label>

              <input
                id="phone"
                v-model="form.phone"
                type="text"
                :placeholder="$t('quote.phonePlaceholder')"
                class="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        <!-- Message -->
        <div class="mt-10 border-t border-slate-200 pt-10">
          <label for="message" class="text-sm font-semibold text-slate-700">
            {{ $t('quote.requirements') }}
          </label>

          <textarea
            id="message"
            v-model="form.message"
            rows="6"
            :placeholder="$t('quote.requirementsPlaceholder')"
            class="mt-2 w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          ></textarea>
        </div>

        <!-- Submit -->
        <div
          class="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-xs leading-5 text-slate-400">
            {{ $t('quote.agreement') }}
          </p>

          <button
            type="submit"
            class="rounded-lg bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            {{ $t('quote.submit') }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
