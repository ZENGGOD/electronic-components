<script setup lang="ts">
import { reactive, ref } from 'vue'

const submitted = ref(false)

const form = reactive({
  name: '',
  company: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
})

function submitContact() {
  console.log('Contact Request:', {
    ...form,
  })

  submitted.value = true
}
</script>

<template>
  <main class="min-h-screen bg-slate-50">
    <!-- Hero -->
    <section class="bg-slate-950 text-white">
      <div class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
          {{ $t('contact.label') }}
        </p>

        <h1 class="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {{ $t('contact.title') }}
        </h1>

        <p class="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          {{ $t('contact.description') }}
        </p>
      </div>
    </section>

    <!-- Main -->
    <section class="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
      <div class="grid gap-10 lg:grid-cols-[360px_1fr]">
        <!-- Contact Information -->
        <aside>
          <h2 class="text-2xl font-bold text-slate-900">
            {{ $t('contact.getInTouch') }}
          </h2>

          <p class="mt-3 leading-7 text-slate-500">
            {{ $t('contact.contactDescription') }}
          </p>

          <div class="mt-8 space-y-6">
            <!-- Email -->
            <div class="rounded-xl border border-slate-200 bg-white p-5">
              <p class="text-xs font-semibold uppercase tracking-wider text-blue-600">
                {{ $t('contact.email') }}
              </p>

              <p class="mt-2 font-semibold text-slate-900">sales@example.com</p>
            </div>

            <!-- Phone -->
            <div class="rounded-xl border border-slate-200 bg-white p-5">
              <p class="text-xs font-semibold uppercase tracking-wider text-blue-600">
                {{ $t('contact.phone') }}
              </p>

              <p class="mt-2 font-semibold text-slate-900">+1 000 000 0000</p>
            </div>

            <!-- WhatsApp -->
            <div class="rounded-xl border border-slate-200 bg-white p-5">
              <p class="text-xs font-semibold uppercase tracking-wider text-blue-600">
                {{ $t('contact.whatsapp') }}
              </p>

              <p class="mt-2 font-semibold text-slate-900">+1 000 000 0000</p>
            </div>

            <!-- Business Hours -->
            <div class="rounded-xl border border-slate-200 bg-white p-5">
              <p class="text-xs font-semibold uppercase tracking-wider text-blue-600">
                {{ $t('contact.businessHours') }}
              </p>

              <p class="mt-2 font-semibold text-slate-900">
                {{ $t('contact.weekdays') }}
              </p>

              <p class="mt-1 text-sm text-slate-500">9:00 AM – 6:00 PM</p>
            </div>
          </div>
        </aside>

        <!-- Contact Form -->
        <div>
          <!-- Success -->
          <div v-if="submitted" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-10">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
            >
              ✓
            </div>

            <h2 class="mt-5 text-2xl font-bold text-slate-900">
              {{ $t('contact.messageSent') }}
            </h2>

            <p class="mt-3 max-w-xl text-slate-600">
              {{ $t('contact.messageSentDescription') }}
            </p>
          </div>

          <!-- Form -->
          <form
            v-else
            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            @submit.prevent="submitContact"
          >
            <h2 class="text-xl font-bold text-slate-900">
              {{ $t('contact.sendMessage') }}
            </h2>

            <p class="mt-2 text-sm text-slate-500">
              {{ $t('contact.formDescription') }}
            </p>

            <div class="mt-6 grid gap-6 sm:grid-cols-2">
              <!-- Name -->
              <div>
                <label for="name" class="text-sm font-semibold text-slate-700">
                  {{ $t('contact.name') }} *
                </label>

                <input
                  id="name"
                  v-model="form.name"
                  required
                  type="text"
                  :placeholder="$t('contact.namePlaceholder')"
                  class="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <!-- Company -->
              <div>
                <label for="company" class="text-sm font-semibold text-slate-700">
                  {{ $t('contact.company') }}
                </label>

                <input
                  id="company"
                  v-model="form.company"
                  type="text"
                  :placeholder="$t('contact.companyPlaceholder')"
                  class="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <!-- Email -->
              <div>
                <label for="email" class="text-sm font-semibold text-slate-700">
                  {{ $t('contact.businessEmail') }} *
                </label>

                <input
                  id="email"
                  v-model="form.email"
                  required
                  type="email"
                  placeholder="name@company.com"
                  class="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <!-- Phone -->
              <div>
                <label for="phone" class="text-sm font-semibold text-slate-700">
                  {{ $t('contact.phoneWhatsapp') }}
                </label>

                <input
                  id="phone"
                  v-model="form.phone"
                  type="text"
                  placeholder="+1 000 000 0000"
                  class="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <!-- Subject -->
              <div class="sm:col-span-2">
                <label for="subject" class="text-sm font-semibold text-slate-700">
                  {{ $t('contact.subject') }} *
                </label>

                <input
                  id="subject"
                  v-model="form.subject"
                  required
                  type="text"
                  :placeholder="$t('contact.subjectPlaceholder')"
                  class="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <!-- Message -->
              <div class="sm:col-span-2">
                <label for="message" class="text-sm font-semibold text-slate-700">
                  {{ $t('contact.message') }} *
                </label>

                <textarea
                  id="message"
                  v-model="form.message"
                  required
                  rows="7"
                  :placeholder="$t('contact.messagePlaceholder')"
                  class="mt-2 w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                ></textarea>
              </div>
            </div>

            <div class="mt-8 flex justify-end border-t border-slate-200 pt-6">
              <button
                type="submit"
                class="rounded-lg bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                {{ $t('contact.send') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  </main>
</template>
