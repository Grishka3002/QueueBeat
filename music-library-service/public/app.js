const apiKeyInput = document.querySelector("#apiKeyInput");
const refreshButton = document.querySelector("#refreshButton");
const loadTracksButton = document.querySelector("#loadTracksButton");
const statusList = document.querySelector("#statusList");
const tracksBody = document.querySelector("#tracksBody");
const toast = document.querySelector("#toast");
const singleImportForm = document.querySelector("#singleImportForm");
const batchImportForm = document.querySelector("#batchImportForm");
const hitmosRunForm = document.querySelector("#hitmosRunForm");
const hitmosRunInfo = document.querySelector("#hitmosRunInfo");

apiKeyInput.value = localStorage.getItem("musicLibraryApiKey") || "dev-library-key";
apiKeyInput.addEventListener("input", () => {
  localStorage.setItem("musicLibraryApiKey", apiKeyInput.value);
});

refreshButton.addEventListener("click", () => void loadStatus());
loadTracksButton.addEventListener("click", () => void loadTracks());
singleImportForm.addEventListener("submit", (event) => void submitSingleImport(event));
batchImportForm.addEventListener("submit", (event) => void submitBatchImport(event));
hitmosRunForm.addEventListener("submit", (event) => void createHitmosRun(event));
tracksBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-stream-id]");
  if (!button) return;
  void downloadTrack(button.dataset.streamId, button.dataset.trackTitle || "track");
});

void loadStatus();

function headers() {
  return {
    "content-type": "application/json",
    "x-api-key": apiKeyInput.value,
  };
}

async function loadStatus() {
  try {
    const status = await requestJson("/v1/system/status", { auth: false });
    renderStatus(status);
  } catch (error) {
    statusList.innerHTML = statusCard(
      "bad",
      "UI работает, но status endpoint не ответил",
      formatError(error),
    );
  }
}

function renderStatus(status) {
  const items = [
    ["service", "Music Library API", status.service],
    ["database", "PostgreSQL", status.database],
    ["storage", "MinIO / S3", status.storage],
  ];

  statusList.innerHTML = items
    .map(([, title, check]) => {
      const tone = check.ok ? "ok" : "bad";
      const detail = check.details?.hint || check.message;
      return statusCard(tone, title, detail);
    })
    .join("");
}

function statusCard(tone, title, message) {
  return `
    <div class="statusItem ${tone}">
      <div class="dot"></div>
      <div>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(message || "")}</p>
      </div>
    </div>
  `;
}

async function submitSingleImport(event) {
  event.preventDefault();
  const data = new FormData(singleImportForm);
  const payload = {
    sourceUrl: String(data.get("sourceUrl") || "").trim(),
    title: String(data.get("title") || "").trim() || undefined,
    artist: String(data.get("artist") || "").trim() || undefined,
    license: {
      type: "OWNED",
      proofUrl: String(data.get("proofUrl") || "local-admin-import").trim(),
    },
  };

  try {
    const result = await requestJson("/v1/imports/url", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    showToast(result.status === "FAILED" ? result.reason : "Трек импортирован", result.status === "FAILED" ? "error" : "success");
    await loadTracks();
  } catch (error) {
    showToast(formatError(error), "error");
  }
}

async function submitBatchImport(event) {
  event.preventDefault();
  const data = new FormData(batchImportForm);
  const links = String(data.get("links") || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (links.length === 0) {
    showToast("Добавь хотя бы одну ссылку", "error");
    return;
  }

  const artist = String(data.get("artist") || "").trim();
  const payload = {
    license: {
      type: "OWNED",
      proofUrl: String(data.get("proofUrl") || "local-admin-import").trim(),
    },
    items: links.map((sourceUrl) => ({
      sourceUrl,
      artist: artist || undefined,
    })),
  };

  try {
    const result = await requestJson("/v1/imports/urls", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const completed = result.items.filter((item) => item.status === "COMPLETED").length;
    const failed = result.items.length - completed;
    showToast(`Импорт завершен: успешно ${completed}, с ошибками ${failed}`, failed ? "error" : "success");
    await loadTracks();
  } catch (error) {
    showToast(formatError(error), "error");
  }
}

async function createHitmosRun(event) {
  event.preventDefault();
  const data = new FormData(hitmosRunForm);
  const payload = {
    catalogRootUrl: String(data.get("catalogRootUrl") || "").trim(),
    agreementReference: String(data.get("agreementReference") || "").trim(),
    maxTracks: Number(data.get("maxTracks") || 1000000),
    licenseType: "DIRECT_CONTRACT",
    territory: "worldwide",
  };

  try {
    const run = await requestJson("/v1/providers/hitmos/runs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    localStorage.setItem("hitmosRunId", run.id);
    renderHitmosRun(run);
    showToast("Запуск Hitmos создан. Теперь авторизованный парсер может добавлять позиции очереди.", "success");
  } catch (error) {
    showToast(formatError(error), "error");
  }
}

function renderHitmosRun(run) {
  hitmosRunInfo.hidden = false;
  hitmosRunInfo.innerHTML = `
    <strong>Запуск создан</strong>
    <code>${escapeHtml(run.id)}</code>
    <span>Статус: ${escapeHtml(run.status)} · лимит: ${escapeHtml(run.maxTracks)}</span>
  `;
}

async function loadTracks() {
  tracksBody.innerHTML = `<tr><td colspan="5" class="empty">Загружаю треки...</td></tr>`;

  try {
    const result = await requestJson("/v1/tracks?limit=25");
    const tracks = result.items || [];
    if (tracks.length === 0) {
      tracksBody.innerHTML = `<tr><td colspan="5" class="empty">Пока нет треков в каталоге.</td></tr>`;
      return;
    }

    tracksBody.innerHTML = tracks
      .map((track) => {
        const asset = track.assets?.[0];
        return `
          <tr>
            <td>${escapeHtml(track.title)}</td>
            <td>${escapeHtml(track.artist)}</td>
            <td>${escapeHtml(asset?.storageProvider || "-")}</td>
            <td>${escapeHtml(formatBytes(asset?.byteSize))}</td>
            <td><button class="smallLink linkButton" type="button" data-stream-id="${track.id}" data-track-title="${escapeHtml(track.title)}">stream</button></td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    tracksBody.innerHTML = `<tr><td colspan="5" class="empty">${escapeHtml(formatError(error))}</td></tr>`;
  }
}

async function downloadTrack(trackId, title) {
  try {
    const response = await fetch(`/v1/tracks/${trackId}/stream?proxy=1`, {
      headers: { "x-api-key": apiKeyInput.value },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || response.statusText);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title || "track"}.mp3`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    showToast(formatError(error), "error");
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: options.auth === false ? undefined : headers(),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || data?.message || response.statusText);
  }

  return data;
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

function formatBytes(value) {
  if (!value) return "-";
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return String(value);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function showToast(message, tone = "") {
  toast.textContent = message;
  toast.className = `toast ${tone}`;
  toast.hidden = false;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.hidden = true;
  }, 5200);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
