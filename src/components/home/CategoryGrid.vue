<template>
  <section class="bg-white py-20">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <!-- Section Header -->
      <div class="mb-12 flex items-end justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Product Categories
          </p>

          <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Explore Our Components
          </h2>

          <p class="mt-4 max-w-2xl text-slate-500">
            Browse electronic components by product category and quickly find the right solution for
            your application.
          </p>
        </div>

        <RouterLink
          to="/products"
          class="hidden text-sm font-semibold text-blue-600 hover:text-blue-700 sm:block"
        >
          View All Products →
        </RouterLink>
      </div>

      <!-- Categories -->
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <!-- MCU -->
        <RouterLink
          to="/products?category=mcu"
          class="group rounded-xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
          >
            <span class="text-xl font-bold">MCU</span>
          </div>

          <h3 class="mt-5 font-semibold text-slate-900">MCU / Microcontrollers</h3>

          <p class="mt-2 text-sm leading-6 text-slate-500">
            32-bit and 8-bit microcontrollers for embedded systems.
          </p>

          <div class="mt-5 text-sm font-medium text-blue-600 transition group-hover:translate-x-1">
            Explore →
          </div>
        </RouterLink>

        <!-- Analog -->
        <RouterLink
          to="/products?category=analog"
          class="group rounded-xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
          >
            <span class="text-xl font-bold">A</span>
          </div>

          <h3 class="mt-5 font-semibold text-slate-900">Analog IC</h3>

          <p class="mt-2 text-sm leading-6 text-slate-500">
            Operational amplifiers and analog signal processing ICs.
          </p>

          <div class="mt-5 text-sm font-medium text-blue-600 transition group-hover:translate-x-1">
            Explore →
          </div>
        </RouterLink>

        <!-- Power -->
        <RouterLink
          to="/products?category=power"
          class="group rounded-xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
          >
            <span class="text-xl font-bold">PWR</span>
          </div>

          <h3 class="mt-5 font-semibold text-slate-900">Power Management</h3>

          <p class="mt-2 text-sm leading-6 text-slate-500">
            DC-DC converters and power management solutions.
          </p>

          <div class="mt-5 text-sm font-medium text-blue-600 transition group-hover:translate-x-1">
            Explore →
          </div>
        </RouterLink>

        <!-- Communication -->
        <RouterLink
          to="/products?category=communication"
          class="group rounded-xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
          >
            <span class="text-xl font-bold">CAN</span>
          </div>

          <h3 class="mt-5 font-semibold text-slate-900">Communication IC</h3>

          <p class="mt-2 text-sm leading-6 text-slate-500">
            CAN transceivers and industrial communication interfaces.
          </p>

          <div class="mt-5 text-sm font-medium text-blue-600 transition group-hover:translate-x-1">
            Explore →
          </div>
        </RouterLink>

        <!-- DSP -->
        <RouterLink
          to="/products?category=dsp"
          class="group rounded-xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
          >
            <span class="text-xl font-bold">DSP</span>
          </div>

          <h3 class="mt-5 text-base font-semibold text-slate-900">DSP / DSC</h3>

          <p class="mt-2 text-sm leading-6 text-slate-500">
            Digital signal controllers for industrial applications.
          </p>

          <div class="mt-5 text-sm font-medium text-blue-600 transition group-hover:translate-x-1">
            Explore →
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
