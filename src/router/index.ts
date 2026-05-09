import { createRouter, createWebHashHistory } from "vue-router";
import HomePage from "../views/HomePage.vue";
import ShowPage from "../views/ShowPage.vue";
import MusicPage from "../views/MusicPage.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomePage,
    },
    {
      path: "/show",
      name: "show",
      component: ShowPage,
    },
    {
      path: "/music",
      name: "music",
      component: MusicPage,
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
    }
  ],
});

export default router;
