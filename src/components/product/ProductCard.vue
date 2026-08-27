<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Product } from '@/types/product'

const props = defineProps<{
  product: Product
}>()

const router = useRouter()

function viewDetails() {
  router.push(`/products/${props.product.partNumber}`)
}

function requestQuote() {
  router.push({
    path: '/request-quote',
    query: {
      product: props.product.partNumber,
    },
  })
}
</script>

<template>
  <article
    class="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
  >
    <!-- Manufacturer -->
    <div class="flex items-center justify-between">
      <span class="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
        {{ product.manufacturer }}
      </span>

      <span class="text-xs text-slate-400">
        {{ product.category }}
      </span>
    </div>

    <!-- Product -->
    <div class="mt-5">
      <h3
        class="text-lg font-bold tracking-tight text-slate-900 transition group-hover:text-blue-600"
      >
        {{ product.partNumber }}
      </h3>

      <p class="mt-2 text-sm font-medium text-slate-700">
        {{ product.title }}
      </p>

      <p v-if="product.package" class="mt-3 text-xs text-slate-500">
        Package:
        <span class="font-medium text-slate-700">
          {{ product.package }}
        </span>
      </p>
    </div>

    <!-- Description -->
    <p class="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-slate-500">
      {{ product.description }}
    </p>

    <!-- Actions -->
    <div class="mt-6 flex gap-3 border-t border-slate-100 pt-5">
      <button
        type="button"
        class="min-w-0 flex-1 whitespace-nowrap rounded-lg border border-slate-300 px-2.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
        @click="viewDetails"
      >
        {{ $t('productCard.viewDetails') }}
      </button>

      <button
        type="button"
        class="min-w-0 flex-1 whitespace-nowrap rounded-lg bg-blue-600 px-2.5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        @click="requestQuote"
      >
        {{ $t('productCard.requestQuote') }}
      </button>
    </div>
  </article>
</template>
