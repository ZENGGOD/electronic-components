<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend data types
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface TechnicalTag {
  id: number
  name: string
  nameZh?: string
  nameEn?: string
  slug?: string
}

interface TechnicalProduct {
  id: number
  partNumber: string
  manufacturer?: string
  category?: string
}

interface TechnicalTopic {
  id: number
  slug: string
  category: string

  titleZh?: string
  titleEn?: string

  descriptionZh?: string
  descriptionEn?: string

  title?: string
  description?: string

  tags: TechnicalTag[]
  products: TechnicalProduct[]
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Backend API data types
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface TechnicalApiTag {
  id?: number
  name?: string

  name_zh?: string
  name_en?: string

  nameZh?: string
  nameEn?: string

  slug?: string
}

interface TechnicalApiProduct {
  id?: number

  part_number?: string
  partNumber?: string

  manufacturer?: string
  category?: string
}

interface TechnicalApiTopic {
  id?: number

  slug?: string
  categorySlug?: string
  category?: string

  title?: string

  title_zh?: string
  title_en?: string

  titleZh?: string
  titleEn?: string

  description?: string

  description_zh?: string
  description_en?: string

  descriptionZh?: string
  descriptionEn?: string

  tags?: TechnicalApiTag[]
  products?: TechnicalApiProduct[]
}

interface TechnicalApiData {
  topics?: TechnicalApiTopic[]
}

interface TechnicalApiResponse {
  success?: boolean
  message?: string

  data?:
    | TechnicalApiTopic[]
    | TechnicalApiData

  topics?: TechnicalApiTopic[]
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * State
 * ─────────────────────────────────────────────────────────────────────────────
 */

const selectedCategory = ref('all')

const technicalTopics = ref<TechnicalTopic[]>([])

const loading = ref(false)

const error = ref('')

/**
 * 页面分类
 *
 * 注意：
 * 这里保持原来的分类值。
 *
 * 数据库 technical_topics.slug：
 *
 * mcu-selection
 * operational-amplifier-selection
 * dc-dc-power-management
 * can-bus-transceiver
 * dsp-dsc-selection
 * industrial-control-mcu
 *
 * 会通过 normalizeCategory() 转换。
 */

const categories = [
  'all',
  'mcu',
  'analogIC',
  'powerManagement',
  'can',
  'dsp',
  'industrial',
]

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Normalize category
 *
 * 数据库 slug → 前端分类
 * ─────────────────────────────────────────────────────────────────────────────
 */

function normalizeCategory(
  topic: TechnicalApiTopic,
): string {
  const slug = String(
    topic.categorySlug ||
      topic.category ||
      topic.slug ||
      '',
  ).toLowerCase()

  const categoryMap: Record<string, string> = {
    /**
     * 数据库 technical_topics.slug
     */

    'mcu-selection': 'mcu',

    'operational-amplifier-selection':
      'analogIC',

    'dc-dc-power-management':
      'powerManagement',

    'can-bus-transceiver': 'can',

    'dsp-dsc-selection': 'dsp',

    'industrial-control-mcu':
      'industrial',

    /**
     * 兼容前端分类
     */

    mcu: 'mcu',

    'analog-ic': 'analogIC',
    analogic: 'analogIC',

    'power-management':
      'powerManagement',

    'power-management-ic':
      'powerManagement',

    can: 'can',

    dsp: 'dsp',

    'dsp-dsc': 'dsp',

    industrial: 'industrial',

    'industrial-control':
      'industrial',
  }

  return categoryMap[slug] || slug
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Get topic title
 * ─────────────────────────────────────────────────────────────────────────────
 */

function getTopicTitle(
  topic: TechnicalTopic,
): string {
  const locale =
    localStorage.getItem('locale') || 'zh'

  if (locale === 'en') {
    return (
      topic.titleEn ||
      topic.title ||
      topic.titleZh ||
      ''
    )
  }

  return (
    topic.titleZh ||
    topic.title ||
    topic.titleEn ||
    ''
  )
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Get topic description
 * ─────────────────────────────────────────────────────────────────────────────
 */

function getTopicDescription(
  topic: TechnicalTopic,
): string {
  const locale =
    localStorage.getItem('locale') || 'zh'

  if (locale === 'en') {
    return (
      topic.descriptionEn ||
      topic.description ||
      topic.descriptionZh ||
      ''
    )
  }

  return (
    topic.descriptionZh ||
    topic.description ||
    topic.descriptionEn ||
    ''
  )
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Get tag name
 * ─────────────────────────────────────────────────────────────────────────────
 */

function getTagName(
  tag: TechnicalTag,
): string {
  const locale =
    localStorage.getItem('locale') || 'zh'

  if (locale === 'en') {
    return (
      tag.nameEn ||
      tag.name ||
      tag.nameZh ||
      ''
    )
  }

  return (
    tag.nameZh ||
    tag.name ||
    tag.nameEn ||
    ''
  )
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetch technical topics
 * ─────────────────────────────────────────────────────────────────────────────
 */

async function fetchTechnicalTopics() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(
      'http://localhost:3000/api/technical',
    )

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`,
      )
    }

    const result: TechnicalApiResponse =
      await response.json()

    /**
     * 后端明确返回失败
     */

    if (result.success === false) {
      throw new Error(
        result.message ||
          'Failed to fetch technical topics',
      )
    }

    /**
     * 获取 topics
     *
     * 支持：
     *
     * data: [...]
     *
     * data: {
     *   topics: [...]
     * }
     *
     * topics: [...]
     */

    let topics: TechnicalApiTopic[] = []

    if (Array.isArray(result.data)) {
      topics = result.data
    } else if (
      result.data &&
      Array.isArray(result.data.topics)
    ) {
      topics = result.data.topics
    } else if (
      Array.isArray(result.topics)
    ) {
      topics = result.topics
    }

    /**
     * 转换 API 数据
     */

    technicalTopics.value = topics.map(
      (
        topic: TechnicalApiTopic,
      ): TechnicalTopic => {
        /**
         * Products
         */

        const products: TechnicalProduct[] =
          (topic.products || [])
            .map(
              (
                product: TechnicalApiProduct,
              ): TechnicalProduct => ({
                id: Number(
                  product.id || 0,
                ),

                partNumber:
                  product.partNumber ||
                  product.part_number ||
                  '',

                manufacturer:
                  product.manufacturer ||
                  '',

                category:
                  product.category ||
                  '',
              }),
            )
            .filter(
              (
                product: TechnicalProduct,
              ) =>
                product.partNumber
                  .length > 0,
            )

        /**
         * Tags
         */

        const tags: TechnicalTag[] =
          (topic.tags || []).map(
            (
              tag: TechnicalApiTag,
            ): TechnicalTag => ({
              id: Number(
                tag.id || 0,
              ),

              name:
                tag.name ||
                tag.nameZh ||
                tag.nameEn ||
                tag.name_zh ||
                tag.name_en ||
                '',

              nameZh:
                tag.nameZh ||
                tag.name_zh ||
                '',

              nameEn:
                tag.nameEn ||
                tag.name_en ||
                '',

              slug:
                tag.slug || '',
            }),
          )

        /**
         * Topic
         */

        return {
          id: Number(
            topic.id || 0,
          ),

          slug:
            topic.slug || '',

          /**
           * 最关键：
           *
           * mcu-selection
           *       ↓
           * mcu
           */

          category:
            normalizeCategory(topic),

          titleZh:
            topic.titleZh ||
            topic.title_zh ||
            '',

          titleEn:
            topic.titleEn ||
            topic.title_en ||
            '',

          descriptionZh:
            topic.descriptionZh ||
            topic.description_zh ||
            '',

          descriptionEn:
            topic.descriptionEn ||
            topic.description_en ||
            '',

          title:
            topic.title || '',

          description:
            topic.description ||
            '',

          tags,

          products,
        }
      },
    )
  } catch (err: unknown) {
    console.error(
      'Failed to fetch technical topics:',
      err,
    )

    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value =
        'Failed to fetch technical topics'
    }

    technicalTopics.value = []
  } finally {
    loading.value = false
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Filter topics
 * ─────────────────────────────────────────────────────────────────────────────
 */

const filteredTopics = computed(
  () => {
    if (
      selectedCategory.value ===
      'all'
    ) {
      return technicalTopics.value
    }

    return technicalTopics.value.filter(
      (topic) =>
        topic.category ===
        selectedCategory.value,
    )
  },
)

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * View related products
 *
 *跳转到对应的详情页面
 * ─────────────────────────────────────────────────────────────────────────────
 */

function viewProducts(product: string) {
  router.push(`/products/${product}`)
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Initial loading
 * ─────────────────────────────────────────────────────────────────────────────
 */

onMounted(() => {
  fetchTechnicalTopics()
})
</script>

<template>
  <main class="min-h-screen bg-slate-50">
    <!-- Hero -->
    <section
      class="border-b border-slate-200 bg-white"
    >
      <div
        class="mx-auto max-w-7xl px-6 py-16 lg:px-8"
      >
        <p
          class="text-sm font-semibold uppercase tracking-widest text-blue-600"
        >
          {{ $t('technical.label') }}
        </p>

        <h1
          class="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
        >
          {{ $t('technical.title') }}
        </h1>

        <p
          class="mt-5 max-w-3xl text-lg leading-8 text-slate-500"
        >
          {{ $t('technical.description') }}
        </p>
      </div>
    </section>

    <!-- Technical Content -->
    <section
      class="mx-auto max-w-7xl px-6 py-12 lg:px-8"
    >
      <div
        class="grid gap-8 lg:grid-cols-[220px_1fr]"
      >
        <!-- Sidebar -->
        <aside>
          <h2
            class="text-sm font-semibold text-slate-900"
          >
            {{ $t('technical.categories') }}
          </h2>

          <div
            class="mt-4 space-y-1"
          >
            <button
              v-for="category in categories"
              :key="category"
              type="button"
              class="w-full rounded-lg px-3 py-2.5 text-left text-sm transition"
              :class="
                selectedCategory ===
                category
                  ? 'bg-blue-600 font-semibold text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              "
              @click="
                selectedCategory =
                  category
              "
            >
              {{
                $t(
                  `technical.categoryList.${category}`,
                )
              }}
            </button>
          </div>
        </aside>

        <!-- Topics -->
        <div>
          <!-- Loading -->
          <div
            v-if="loading"
            class="py-12 text-center text-sm text-slate-500"
          >
            Loading...
          </div>

          <!-- Error -->
          <div
            v-else-if="error"
            class="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600"
          >
            Failed to load technical
            topics.

            <button
              type="button"
              class="ml-2 font-semibold underline"
              @click="
                fetchTechnicalTopics
              "
            >
              Retry
            </button>
          </div>

          <!-- Empty -->
          <div
            v-else-if="
              filteredTopics.length ===
              0
            "
            class="py-12 text-center text-sm text-slate-500"
          >
            No technical topics
            found.
          </div>

          <!-- Topic Cards -->
          <div
            v-else
            class="grid gap-6 md:grid-cols-2"
          >
            <article
              v-for="topic in filteredTopics"
              :key="topic.id"
              class="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
            >
              <!-- Category -->
              <p
                class="text-xs font-semibold uppercase tracking-wider text-blue-600"
              >
                {{
                  $t(
                    `technical.categoryList.${topic.category}`,
                  )
                }}
              </p>

              <!-- Title -->
              <h2
                class="mt-3 text-xl font-bold text-slate-900 group-hover:text-blue-600"
              >
                {{
                  getTopicTitle(
                    topic,
                  )
                }}
              </h2>

              <!-- Description -->
              <p
                class="mt-3 text-sm leading-6 text-slate-500"
              >
                {{
                  getTopicDescription(
                    topic,
                  )
                }}
              </p>

              <!-- Tags -->
              <div
                v-if="
                  topic.tags.length
                "
                class="mt-5 flex flex-wrap gap-2"
              >
                <span
                  v-for="tag in topic.tags"
                  :key="tag.id"
                  class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {{
                    getTagName(tag)
                  }}
                </span>
              </div>

              <!-- Products -->
              <div
                v-if="
                  topic.products
                    .length
                "
                class="mt-6 border-t border-slate-100 pt-5"
              >
                <p
                  class="text-xs font-semibold text-slate-400"
                >
                  {{
                    $t(
                      'technical.relatedProducts',
                    )
                  }}
                </p>

                <div
                  class="mt-3 space-y-2"
                >
                  <button
                    v-for="product in topic.products"
                    :key="product.id"
                    type="button"
                    class="block text-sm font-medium text-blue-600 transition hover:text-blue-800"
                    @click="
                      viewProducts(
                        product.partNumber,
                      )
                    "
                  >
                    {{
                      product.partNumber
                    }}
                    →
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
