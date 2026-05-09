<script setup lang="ts">
import SubpageHeader from "../../components/layout/SubpageHeader.vue";
import LazyImage from "../../components/common/LazyImage.vue";

// Recommend Items Data
const recommendList = [
  {
    id: 1,
    title: "Wonderhoy",
    type: "Wonderhoy",
    image: "",
    bgColor: "bg-teal-400/20",
    borderColor: "border-teal-300",
    textColor: "text-teal-300",
  },
];
</script>

<template>
  <div
    class="relative w-full h-screen overflow-hidden flex flex-col bg-gradient-to-b from-[#789ED3] via-[#85A6D6] to-[#AA8EBA]"
  >
    <!-- Custom Dot Pattern Background -->
    <div
      class="absolute inset-0 pointer-events-none"
      style="
        background-image: radial-gradient(
          circle at 2px 2px,
          rgba(255, 255, 255, 0.15) 1px,
          transparent 0
        );
        background-size: 16px 16px;
      "
    ></div>

    <!-- Header -->
    <SubpageHeader />

    <!-- Main Content Area -->
    <div
      class="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-12 py-16 flex gap-6 lg:gap-10 h-full z-10 relative"
    >
      <!-- LEFT COLUMN: Main/Event & Side Stories -->
      <div class="flex-[3] flex flex-col gap-6 w-full h-full pb-8 pt-4 justify-center">
        <!-- Main / Event Story Block -->
        <RouterLink to="/story/event">
          <button
            class="relative w-full aspect-[21/9] bg-white rounded-3xl overflow-hidden shadow-2xl group hover:scale-[1.01] transition-transform duration-300 outline-none"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-teal-50/90 to-blue-50/90 z-0"></div>

            <!-- Background Text Deco -->
            <div
              class="absolute -bottom-8 -right-8 text-[120px] font-black text-black/5 leading-none select-none tracking-tighter"
            >
              EVENT STORY
            </div>

            <div class="relative z-10 p-8 h-full flex flex-col justify-center w-5/12">
              <h2
                class="text-4xl lg:text-5xl font-black text-gray-800 leading-tight flex flex-col items-start gap-2"
              >
                <span
                  class="bg-gray-800 text-white px-3 py-1 pb-2 shadow-lg tracking-wide whitespace-nowrap"
                  ><span class="text-teal-400">E</span>VENT</span
                >
                <span
                  class="bg-gray-800 text-white px-3 py-1 pb-2 shadow-lg tracking-widest whitespace-nowrap"
                  >STORY</span
                >
              </h2>
            </div>

            <!-- Collage of Event Layouts (Right side of button) -->
            <div
              class="absolute right-0 top-0 bottom-0 w-7/12 flex flex-col p-3 gap-2 origin-right scale-[1.1] rotate-[-2deg] mr-2"
            >
              <div class="flex-1 flex gap-2 w-full">
                <div class="flex-[2] bg-gray-200 rounded-lg overflow-hidden relative shadow-md">
                  <img
                    :src="'/storage/sekai-jp-assets/character/member/res009_no017/card_normal.webp'"
                    class="w-full h-full object-cover blur-[2px] opacity-70"
                    alt=""
                  />
                </div>
                <div class="flex-[1.5] bg-gray-300 rounded-lg overflow-hidden relative shadow-md">
                  <img
                    :src="'/storage/sekai-jp-assets/character/member/res002_no009/card_normal.webp'"
                    class="w-full h-full object-cover blur-[1px] opacity-80"
                    alt=""
                  />
                </div>
              </div>

              <div class="flex-[1.2] flex gap-2 w-full">
                <div class="flex-[1] bg-gray-400 rounded-lg overflow-hidden relative shadow-md">
                  <img
                    :src="'/storage/sekai-jp-assets/character/member/res014_no029/card_normal.webp'"
                    class="w-full h-full object-cover blur-[1px] opacity-60"
                    alt=""
                  />
                </div>
                <div class="flex-[2] bg-gray-300 rounded-lg overflow-hidden relative shadow-md">
                  <img
                    :src="'/storage/sekai-jp-assets/character/member/res021_no027/card_normal.webp'"
                    class="w-full h-full object-cover blur-[2px] opacity-90"
                    alt=""
                  />
                </div>
              </div>
            </div>
          </button>
        </RouterLink>

        <!-- Side Story Block -->
        <RouterLink to="/story/side">
          <button
            class="relative w-full aspect-[21/7] bg-[#f8f6f0] rounded-3xl overflow-hidden shadow-2xl group hover:scale-[1.01] transition-transform duration-300 outline-none"
          >
            <!-- Background Text Deco -->
            <div
              class="absolute -bottom-6 right-12 text-[100px] font-black text-black/5 leading-none select-none tracking-tighter"
            >
              SIDE STORY
            </div>

            <div class="relative z-10 p-8 h-full flex flex-col justify-center w-5/12">
              <h2
                class="text-4xl lg:text-5xl font-black text-gray-800 leading-tight flex flex-col items-start gap-2"
              >
                <span class="bg-gray-800 text-white px-3 py-1 pb-2 shadow-lg tracking-wide"
                  ><span class="text-yellow-400">S</span>IDE</span
                >
                <span class="bg-gray-800 text-white px-3 py-1 pb-2 shadow-lg tracking-widest"
                  >STORY</span
                >
              </h2>
            </div>

            <!-- Characters Lineup (Right side of button) -->
            <div class="absolute right-0 top-0 bottom-0 w-7/12 flex items-end justify-end pr-8">
              <!-- Placeholder gradient boxes for characters instead of real assets to keep layout intact -->
              <div class="flex h-[90%] w-full max-w-[90%] gap-1">
                <div class="flex-1 rounded-t-xl bg-gradient-to-t from-teal-400 to-teal-200"></div>
                <div class="flex-1 rounded-t-xl bg-gradient-to-t from-blue-500 to-blue-300"></div>
                <div
                  class="flex-1 rounded-t-xl bg-gradient-to-t from-orange-400 to-orange-200"
                ></div>
                <div class="flex-1 rounded-t-xl bg-gradient-to-t from-red-400 to-red-200"></div>
                <div
                  class="flex-1 rounded-t-xl bg-gradient-to-t from-purple-500 to-purple-300"
                ></div>
              </div>
            </div>
          </button>
        </RouterLink>
      </div>

      <!-- RIGHT COLUMN: Recommend -->
      <div class="flex-[1.2] flex flex-col gap-3 h-full pt-16 pr-2">
        <h3 class="text-white text-2xl font-black tracking-wider drop-shadow-md mb-2">RECOMMEND</h3>

        <div
          class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pb-8 pr-2 relative z-10 p-2"
        >
          <button
            v-for="item in recommendList"
            :key="item.id"
            class="relative w-full rounded-2xl bg-white/20 backdrop-blur-md border-[3px] border-white shadow-xl overflow-hidden group hover:scale-[1.02] transition-transform outline-none"
            :class="item.borderColor"
          >
            <!-- Type Badge -->
            <div
              class="absolute top-0 right-0 px-4 py-1 rounded-bl-[14px] bg-white text-[11px] font-black tracking-wider text-gray-800 z-20 shadow-[-2px_2px_4px_rgba(0,0,0,0.1)]"
            >
              {{ item.type }}
            </div>

            <!-- Content Wrapper -->
            <div class="relative w-full aspect-[22/9] bg-gray-800/50">
              <LazyImage
                :src="item.image"
                class="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-100"
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.4);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.6);
}
</style>
