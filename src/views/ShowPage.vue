<script setup lang="ts">
import { Star, Users, Swords, Lock, Ghost, Play, Sparkles, Music } from "lucide-vue-next";
import { useRouter } from "vue-router";
import ShowLayout from "@/components/layout/SubLayout.vue";

const router = useRouter();
</script>

<template>
  <ShowLayout watermarkText="SHOW">
    <div class="space-y-4">
      <!-- ═══════════════════════════════════ -->
      <!-- RHYTHM GAME Section                 -->
      <!-- ═══════════════════════════════════ -->
      <div>
        <div class="flex items-center gap-2 mb-2.5">
          <span class="text-xs font-black tracking-[0.2em] text-white/80 uppercase"
            >Rhythm Game</span
          >
        </div>

        <!-- Solo & Co-op Show -->
        <div class="grid grid-cols-2 gap-2.5 mb-2.5">
          <!-- SOLO SHOW -->
          <button
            class="group relative bg-gradient-to-br from-teal-300 to-cyan-400 rounded-2xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden min-h-[100px] flex flex-col items-center justify-center gap-2"
            @click="router.push('/music')"
          >
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-2xl"
            />
            <div
              class="relative w-10 h-10 rounded-full bg-white/25 flex items-center justify-center"
            >
              <Star class="h-6 w-6 text-white drop-shadow-md" :stroke-width="2.5" />
            </div>
            <span class="relative text-white font-black text-sm tracking-wide drop-shadow-md"
              >SOLO SHOW</span
            >
          </button>

          <!-- CO-OP SHOW -->
          <button
            class="group relative bg-gradient-to-br from-pink-300 to-rose-400 rounded-2xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden min-h-[100px] flex flex-col items-center justify-center gap-2"
            @click="router.push('/music')"
            >
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-2xl"
            />
            <div class="relative flex items-center gap-1">
              <Music class="h-5 w-5 text-white/80 drop-shadow-md" :stroke-width="2.5" />
              <Users class="h-6 w-6 text-white drop-shadow-md" :stroke-width="2.5" />
            </div>
            <span class="relative text-white font-black text-sm tracking-wide drop-shadow-md"
              >CO-OP SHOW</span
            >
          </button>
        </div>

        <!-- Challenge Show & Ranked Match (smaller cards) -->
        <div class="grid grid-cols-2 gap-2.5">
          <!-- CHALLENGE SHOW -->
          <button
            class="group relative bg-white/30 backdrop-blur-md rounded-2xl p-3 shadow-md hover:shadow-lg hover:bg-white/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-3 border border-white/20"
          >
            <div class="relative">
              <Swords class="h-6 w-6 text-white/80" :stroke-width="2" />
              <!-- Notification badge -->
              <div
                class="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
              >
                <span class="text-[7px] text-white font-bold">!</span>
              </div>
            </div>
            <span class="text-white/90 font-black text-xs tracking-wide leading-tight"
              >CHALLENGE SHOW</span
            >
          </button>

          <!-- RANKED MATCH -->
          <button
            class="group relative bg-white/20 backdrop-blur-md rounded-2xl p-3 shadow-md transition-all duration-200 flex items-center gap-3 border border-white/15 opacity-70"
          >
            <Lock class="h-6 w-6 text-white/50" :stroke-width="2" />
            <span class="text-white/60 font-black text-xs tracking-wide leading-tight"
              >WONDERHOY MATCH</span
            >
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════ -->
      <!-- VIRTUAL SHOW & MV & EVENT Section   -->
      <!-- ═══════════════════════════════════ -->
      <div class="grid grid-cols-[5fr_4fr] gap-x-3 gap-y-0 text-white pb-6">
        <!-- VIRTUAL SHOW (left, spans 2 rows) -->
        <div class="row-span-2 flex flex-col">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-black tracking-[0.2em] text-white/80 uppercase"
              >Virtual Show</span
            >
          </div>
          <button
            class="group relative w-full flex-1 bg-gradient-to-br from-violet-400/70 via-purple-300/60 to-fuchsia-500/70 backdrop-blur-md rounded-2xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 overflow-hidden min-h-[140px] flex flex-col items-center justify-center gap-2 border border-white/15"
          >
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent rounded-2xl"
            />
            <!-- Begins badge -->
            <div
              class="absolute top-2 right-2 bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md"
            >
              Begins in 1d
            </div>
            <div
              class="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            >
              <Ghost class="h-6 w-6 text-white drop-shadow-md" :stroke-width="2" />
            </div>
            <span class="relative text-white font-black text-sm tracking-wide drop-shadow-md"
              >VIRTUAL SHOW</span
            >
          </button>
        </div>

        <!-- MV section (right top) -->
        <div class="flex flex-col">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-black tracking-[0.15em] text-white/80 uppercase">MV</span>
          </div>
          <button
            class="group relative w-full bg-white/30 backdrop-blur-md rounded-2xl p-3 shadow-md hover:shadow-lg hover:bg-white/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex flex-col items-center justify-center gap-1.5 min-h-[65px] border border-white/20"
          >
            <Play class="h-5 w-5 text-white/80" :stroke-width="2.5" />
            <span
              class="text-white/80 font-black text-[9px] tracking-wide leading-tight text-center"
              >MUSIC<br />VIDEO<br />VIEWER</span
            >
          </button>
        </div>

        <!-- EVENT section (right bottom) -->
        <div class="flex flex-col">
          <div class="flex items-center gap-2 mb-2 mt-3">
            <span class="text-xs font-black tracking-[0.15em] text-white/80 uppercase">Event</span>
          </div>
          <button
            class="group relative w-full bg-gradient-to-br from-amber-400/50 to-orange-500/50 backdrop-blur-md rounded-2xl p-3 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex flex-col items-center justify-center gap-1 min-h-[65px] border border-amber-300/20 overflow-hidden"
          >
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-2xl"
            />
            <Sparkles class="relative h-5 w-5 text-amber-200" :stroke-width="2" />
            <span
              class="relative text-amber-100 font-black text-[9px] tracking-wide leading-tight text-center"
              >Yesteryear<br />Read-aloud</span
            >
          </button>
        </div>
      </div>
    </div>
  </ShowLayout>
</template>
