export interface EventStoryEpisode {
  id: number;
  eventStoryId: number;
  episodeNo: number;
  title: string;
  assetbundleName: string;
  scenarioId: string;
}

export interface EventStory {
  id: number;
  eventId: number;
  outline: string;
  bannerGameCharacterUnitId: number;
  assetbundleName: string;
  eventStoryEpisodes: EventStoryEpisode[];
}
