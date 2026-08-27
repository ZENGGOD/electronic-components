```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const selectedCategory = ref('all')

const categories = ['all', 'mcu', 'analogIC', 'powerManagement', 'can', 'dsp', 'industrial']

const technicalTopics = [
  {
    id: 1,
    category: 'mcu',
    title: 'MCU & Microcontrollers',
    description:
      'Learn about microcontroller architectures, peripherals, memory, interfaces and industrial embedded applications.',
    products: ['STM32H743VIT6', 'STM32F407VET6', 'STM8S003F3P6TR'],
    tags: ['STM32', 'STM8', 'MCU', 'Embedded'],
  },

  {
    id: 2,
    category: 'analogIC',
    title: 'Operational Amplifiers',
    description:
      'Understand operational amplifier fundamentals, signal amplification, voltage followers, comparators and common analog applications.',
    products: ['LM324DR', 'LM358DR'],
    tags: ['Op-Amp', 'Analog', 'Signal'],
  },

  {
    id: 3,
    category: 'powerManagement',
    title: 'DC-DC Power Management',
    description:
      'Explore buck converters, switching regulators, power modules, efficiency and power supply design considerations.',
    products: ['TPS54302DDCR', 'TPS82130SILR'],
    tags: ['DC-DC', 'Buck', 'Power'],
  },

  {
    id: 4,
    category: 'can',
    title: 'CAN Bus Communication',
    description:
      'Technical introduction to CAN bus communication, transceivers, differential signaling and industrial communication.',
    products: ['SN65HVD230DR', 'ISO1050DUBR'],
    tags: ['CAN', 'Transceiver', 'Industrial'],
  },

  {
    id: 5,
    category: 'dsp',
    title: 'DSP & Digital Signal Controllers',
    description:
      'Learn about digital signal controllers, real-time processing, control algorithms and embedded industrial applications.',
    products: ['TMS320F28335PGFAL'],
    tags: ['DSP', 'DSC', 'Real-Time'],
  },

  {
    id: 6,
    category: 'industrial',
    title: 'Industrial Control Solutions',
    description:
      'Explore semiconductor components commonly used in industrial automation, motor control, embedded systems and communication.',
    products: ['TMS570LS3137', 'TMS320F28335PGFAL', 'SN65HVD230DR'],
    tags: ['Industrial', 'Automation', 'Control'],
  },
]

const filteredTopics = computed(() => {
  if (selectedCategory.value === 'all') {
    return technicalTopics
  }

  return technicalTopics.filter((topic) => topic.category === selectedCategory.value)
})

function viewProducts(product: string) {
  router.push({
    path: '/products',
    query: {
      search: product,
    },
  })
}
</script>

<template>
  <main class="min-h-screen bg-slate-50">
    <!-- Hero -->
    <section class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <p class="text-sm font-semibold uppercase tracking-widest text-blue-600">
          {{ $t('technical.label') }}
        </p>

        <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {{ $t('technical.title') }}
        </h1>

        <p class="mt-5 max-w-3xl text-lg leading-8 text-slate-500">
          {{ $t('technical.description') }}
        </p>
      </div>
    </section>

    <!-- Technical Content -->
    <section class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div class="grid gap-8 lg:grid-cols-[220px_1fr]">
        <!-- Sidebar -->
        <aside>
          <h2 class="text-sm font-semibold text-slate-900">
            {{ $t('technical.categories') }}
          </h2>

          <div class="mt-4 space-y-1">
            <button
              v-for="category in categories"
              :key="category"
              type="button"
              class="w-full rounded-lg px-3 py-2.5 text-left text-sm transition"
              :class="
                selectedCategory === category
                  ? 'bg-blue-600 font-semibold text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              "
              @click="selectedCategory = category"
            >
              {{ $t(`technical.categoryList.${category}`) }}
            </button>
          </div>
        </aside>

        <!-- Topics -->
        <div>
          <div class="grid gap-6 md:grid-cols-2">
            <article
              v-for="topic in filteredTopics"
              :key="topic.id"
              class="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
            >
              <!-- Category -->
              <p class="text-xs font-semibold uppercase tracking-wider text-blue-600">
                {{ $t(`technical.categoryList.${topic.category}`) }}
              </p>

              <!-- Title -->
              <h2 class="mt-3 text-xl font-bold text-slate-900 group-hover:text-blue-600">
                {{ $t(`technical.topics.${topic.category}.title`) }}
              </h2>

              <!-- Description -->
              <p class="mt-3 text-sm leading-6 text-slate-500">
                {{ $t(`technical.topics.${topic.category}.description`) }}
              </p>

              <!-- Tags -->
              <div class="mt-5 flex flex-wrap gap-2">
                <span
                  v-for="tag in topic.tags"
                  :key="tag"
                  class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {{ tag }}
                </span>
              </div>

              <!-- Products -->
              <div class="mt-6 border-t border-slate-100 pt-5">
                <p class="text-xs font-semibold text-slate-400">
                  {{ $t('technical.relatedProducts') }}
                </p>

                <div class="mt-3 space-y-2">
                  <button
                    v-for="product in topic.products"
                    :key="product"
                    type="button"
                    class="block text-sm font-medium text-blue-600 transition hover:text-blue-800"
                    @click="viewProducts(product)"
                  >
                    {{ product }} →
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
```
