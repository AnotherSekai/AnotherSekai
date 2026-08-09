import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomePage.vue"),
    },
    {
      path: "/show",
      name: "show",
      component: () => import("../views/show/ShowMain.vue"),
    },
    {
      path: "/show/virtual",
      name: "show-virtual",
      component: () => import("../views/show/ShowVirtual.vue"),
    },
    {
      path: "/music",
      name: "music",
      component: () => import("../views/MusicPage.vue"),
    },
    {
      path: "/characters",
      name: "characters",
      component: () => import("../views/characters/CharactersMain.vue"),
    },
    {
      path: "/characters/list",
      name: "characters-list",
      component: () => import("../views/characters/CharactersList.vue"),
    },
    {
      path: "/story",
      name: "story",
      component: () => import("../views/story/StoryMain.vue"),
    },
    {
      path: "/story/event",
      name: "story-event",
      component: () => import("../views/story/StoryEvent.vue"),
    },
    {
      path: "/worldmap",
      name: "worldmap",
      component: () => import("../views/WorldMap.vue"),
    },
    {
      path: "/mysekai",
      name: "mysekai",
      component: () => import("../views/MySekaiPage.vue"),
    },
    {
      path: "/gacha",
      name: "gacha",
      component: () => import("../views/GachaPage.vue"),
    },
  ],
});

export default router;
