const price = 900;

const tracks = [
  { id: "t1", title: "Blinding Lights", artist: "The Weeknd", duration: "3:20", mark: "B" },
  { id: "t2", title: "As It Was", artist: "Harry Styles", duration: "2:47", mark: "A" },
  { id: "t3", title: "Levitating", artist: "Dua Lipa", duration: "3:23", mark: "L" },
  { id: "t4", title: "Midnight City", artist: "M83", duration: "4:04", mark: "M" },
  { id: "t5", title: "Get Lucky", artist: "Daft Punk", duration: "4:08", mark: "G" },
  { id: "t6", title: "Feel It Still", artist: "Portugal. The Man", duration: "2:43", mark: "F" },
  { id: "t7", title: "Starboy", artist: "The Weeknd, Daft Punk", duration: "3:50", mark: "S" },
  { id: "t8", title: "Seven Nation Army", artist: "The White Stripes", duration: "3:52", mark: "7" }
];

let selectedTrack = null;
let queue = [tracks[3], tracks[4]];

const trackList = document.querySelector("#track-list");
const queueList = document.querySelector("#queue-list");
const queueCount = document.querySelector("#queue-count");
const trackCount = document.querySelector("#track-count");
const selectedTitle = document.querySelector("#selected-title");
const payButton = document.querySelector("#pay-button");
const search = document.querySelector("#search");
const toast = document.querySelector("#toast");
const queueToggle = document.querySelector("#queue-toggle");

function trackWord(count) {
  if (count % 10 === 1 && count % 100 !== 11) return "трек";
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return "трека";
  return "треков";
}

function renderTracks() {
  const query = search.value.trim().toLowerCase();
  const filtered = tracks.filter((track) => `${track.title} ${track.artist}`.toLowerCase().includes(query));
  trackCount.textContent = `${filtered.length} ${trackWord(filtered.length)}`;

  if (filtered.length === 0) {
    trackList.innerHTML = '<div class="empty">Ничего не нашли. Попробуйте другое название.</div>';
    return;
  }

  trackList.innerHTML = filtered
    .map((track) => {
      const selected = selectedTrack?.id === track.id ? " is-selected" : "";
      return `
        <button class="track${selected}" type="button" data-track-id="${track.id}">
          <span class="cover" aria-hidden="true">${track.mark}</span>
          <span class="track-text">
            <strong>${track.title}</strong>
            <small>${track.artist}</small>
          </span>
          <span class="duration">${track.duration}</span>
        </button>
      `;
    })
    .join("");
}

function renderQueue() {
  queueCount.textContent = String(queue.length);
  queueList.innerHTML = queue
    .map(
      (track, index) => `
        <div class="queue-row">
          <span class="queue-number">${index + 1}</span>
          <span class="queue-text">
            <strong>${track.title}</strong>
            <small>${track.artist}</small>
          </span>
          <span class="duration">${track.duration}</span>
        </div>
      `
    )
    .join("");
}

function selectTrack(trackId) {
  selectedTrack = tracks.find((track) => track.id === trackId) ?? null;
  selectedTitle.textContent = selectedTrack ? selectedTrack.title : "Песня не выбрана";
  payButton.disabled = !selectedTrack;
  payButton.textContent = selectedTrack ? `Оплатить ${price} ₽` : "Оплатить";
  renderTracks();
}

function showToast() {
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

trackList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-track-id]");
  if (!button) return;
  selectTrack(button.dataset.trackId);
});

search.addEventListener("input", renderTracks);

payButton.addEventListener("click", () => {
  if (!selectedTrack) return;
  queue = [selectedTrack, ...queue];
  renderQueue();
  queueToggle.setAttribute("aria-expanded", "true");
  queueList.hidden = false;
  showToast();
});

queueToggle.addEventListener("click", () => {
  const isOpen = queueToggle.getAttribute("aria-expanded") === "true";
  queueToggle.setAttribute("aria-expanded", String(!isOpen));
  queueList.hidden = isOpen;
});

renderTracks();
renderQueue();
