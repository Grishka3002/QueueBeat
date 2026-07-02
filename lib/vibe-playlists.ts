type VibeTrack = {
  id: string;
  title: string;
  artist: string;
  durationSec: number;
};

type VibeProfile = {
  id: string;
  label: string;
  keywords: string[];
  strongMatches: string[];
  softMatches: string[];
};

const profiles: VibeProfile[] = [
  {
    id: "lounge",
    label: "lounge / коктейльный вечер",
    keywords: ["lounge", "лаунж", "бар", "коктейль", "ужин", "спокой", "чилл", "chill", "rooftop", "вечер"],
    strongMatches: ["m83", "kygo", "disclosure", "clean bandit", "coldplay", "rema"],
    softMatches: ["midnight", "rather be", "latch", "firestone", "calm down", "adventure"]
  },
  {
    id: "club",
    label: "club / танцевальный пик",
    keywords: ["club", "клуб", "танцы", "dance", "вечерин", "пятница", "ночь", "энерг", "диджей", "party"],
    strongMatches: ["daft punk", "david guetta", "avicii", "calvin harris", "gala", "snap", "dua lipa"],
    softMatches: ["one more time", "titanium", "levels", "summer", "freed from desire", "dance the night", "physical"]
  },
  {
    id: "pop",
    label: "pop / знакомые хиты",
    keywords: ["pop", "поп", "хиты", "популяр", "гости", "девушки", "караоке", "mainstream", "радио"],
    strongMatches: ["the weeknd", "dua lipa", "miley cyrus", "harry styles", "billie eilish"],
    softMatches: ["blinding lights", "levitating", "flowers", "as it was", "starboy", "bad guy", "houdini"]
  },
  {
    id: "work",
    label: "work / фон без перегруза",
    keywords: ["work", "работ", "фон", "кофе", "день", "не отвлек", "спокойно", "relax", "focus"],
    strongMatches: ["m83", "clean bandit", "coldplay", "kygo", "eurythmics"],
    softMatches: ["midnight", "rather be", "sweet dreams", "feel it still", "adventure", "firestone"]
  }
];

function normalize(value: string) {
  return value.toLowerCase().replaceAll("ё", "е");
}

function stableTrackNoise(track: VibeTrack, seed: string) {
  const value = `${track.id}:${seed}`;
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 997;
  }

  return hash / 997;
}

function scoreProfile(profile: VibeProfile, prompt: string) {
  return profile.keywords.reduce((score, keyword) => {
    return prompt.includes(normalize(keyword)) ? score + 1 : score;
  }, 0);
}

function scoreTrack(track: VibeTrack, activeProfiles: VibeProfile[], prompt: string) {
  const haystack = normalize(`${track.artist} ${track.title}`);
  const durationFit = track.durationSec >= 150 && track.durationSec <= 280 ? 0.3 : 0;
  const promptEcho = prompt
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .some((word) => haystack.includes(word))
    ? 1
    : 0;

  const profileScore = activeProfiles.reduce((score, profile) => {
    const strong = profile.strongMatches.some((match) => haystack.includes(normalize(match))) ? 4 : 0;
    const soft = profile.softMatches.some((match) => haystack.includes(normalize(match))) ? 2 : 0;
    return score + strong + soft;
  }, 0);

  return profileScore + promptEcho + durationFit + stableTrackNoise(track, prompt);
}

export function buildVibePlaylist({
  prompt,
  tracks,
  count
}: {
  prompt: string;
  tracks: VibeTrack[];
  count: number;
}) {
  const normalizedPrompt = normalize(prompt);
  const scoredProfiles = profiles
    .map((profile) => ({
      profile,
      score: scoreProfile(profile, normalizedPrompt)
    }))
    .sort((left, right) => right.score - left.score);

  const activeProfiles =
    scoredProfiles.some((item) => item.score > 0)
      ? scoredProfiles.filter((item) => item.score > 0).slice(0, 2).map((item) => item.profile)
      : [profiles[0], profiles[2]];

  const selectedTracks = tracks
    .map((track) => ({
      track,
      score: scoreTrack(track, activeProfiles, normalizedPrompt)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, count)
    .map((item) => item.track);

  return {
    tracks: selectedTracks,
    profileLabels: activeProfiles.map((profile) => profile.label),
    reason:
      activeProfiles.length === 1
        ? `Подобрали треки под профиль «${activeProfiles[0]?.label}».`
        : `Смешали профили: ${activeProfiles.map((profile) => `«${profile.label}»`).join(" + ")}.`
  };
}
