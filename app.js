/* ===== State ===== */
const state = {
  photos: [],
  videos: [],
  experiences: [],
  selectedExpId: null,
  nextPhotoId: 1,
  nextVideoId: 1,
  nextExpId: 1,
};

const MAX_ASSETS = 10;
const MAX_EXPS = 10;

/* ===== Helpers ===== */
function setStatus(msg) {
  document.getElementById("statusText").textContent = msg;
}

function updateCounts() {
  document.getElementById("expCount").textContent = `${state.experiences.length}/${MAX_EXPS}`;
  const canAdd = state.experiences.length < MAX_EXPS && state.photos.length > 0 && state.videos.length > 0;
  document.getElementById("btnAddExp").disabled = !canAdd;
  document.getElementById("btnExport").disabled = state.experiences.length === 0;
}

/* ===== Tabs ===== */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("tab" + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)).classList.add("active");
  });
});

/* ===== Upload helpers ===== */
function setupUploadZone(zoneId, inputId, type) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);

  zone.addEventListener("click", () => input.click());

  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("dragover");
  });

  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("dragover");
    handleFiles(e.dataTransfer.files, type);
  });

  input.addEventListener("change", () => {
    handleFiles(input.files, type);
    input.value = "";
  });
}

function handleFiles(fileList, type) {
  const files = Array.from(fileList);
  const list = type === "photo" ? state.photos : state.videos;
  const remaining = MAX_ASSETS - list.length;

  if (remaining <= 0) {
    setStatus(`Ai atins limita de ${MAX_ASSETS} ${type === "photo" ? "poze" : "video-uri"}.`);
    return;
  }

  const toAdd = files.slice(0, remaining);

  toAdd.forEach((file) => {
    const url = URL.createObjectURL(file);
    const item = {
      id: type === "photo" ? state.nextPhotoId++ : state.nextVideoId++,
      name: file.name,
      file,
      url,
    };
    list.push(item);
  });

  renderAssets();
  updateCounts();
  setStatus(`Adăugat ${toAdd.length} ${type === "photo" ? "poză/poze" : "video/video-uri"}.`);
}

function removeAsset(type, id) {
  const list = type === "photo" ? state.photos : state.videos;
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return;

  const used = state.experiences.some((e) =>
    type === "photo" ? e.photoId === id : e.videoId === id
  );
  if (used) {
    if (!confirm("Acest asset este folosit într-o experiență. Ștergi oricum?")) return;
    state.experiences.forEach((e) => {
      if (type === "photo" && e.photoId === id) e.photoId = null;
      if (type === "video" && e.videoId === id) e.videoId = null;
    });
    renderExperiences();
  }

  URL.revokeObjectURL(list[idx].url);
  list.splice(idx, 1);
  renderAssets();
  updateCounts();
  if (state.selectedExpId) populateEditor(state.selectedExpId);
}

function renderAssets() {
  const photoList = document.getElementById("photoList");
  const videoList = document.getElementById("videoList");

  photoList.innerHTML = state.photos
    .map(
      (p) => `
    <div class="asset-item">
      <img src="${p.url}" alt="${p.name}" />
      <span class="asset-label">#${p.id} ${p.name}</span>
      <button class="asset-remove" onclick="removeAsset('photo', ${p.id})" title="Șterge">×</button>
    </div>`
    )
    .join("");

  videoList.innerHTML = state.videos
    .map(
      (v) => `
    <div class="asset-item">
      <video src="${v.url}" muted></video>
      <span class="asset-label">#${v.id} ${v.name}</span>
      <button class="asset-remove" onclick="removeAsset('video', ${v.id})" title="Șterge">×</button>
    </div>`
    )
    .join("");
}

/* ===== Experiences ===== */
document.getElementById("btnAddExp").addEventListener("click", () => {
  if (state.experiences.length >= MAX_EXPS) return;

  const usedNumbers = new Set(state.experiences.map((e) => e.number));
  let num = 1;
  while (usedNumbers.has(num) && num <= MAX_EXPS) num++;

  const colors = [
    "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
    "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#64748b",
  ];

  const exp = {
    id: state.nextExpId++,
    name: `Experiență ${num}`,
    number: num,
    color: colors[(num - 1) % colors.length],
    photoId: state.photos[0]?.id || null,
    videoId: state.videos[0]?.id || null,
  };

  state.experiences.push(exp);
  renderExperiences();
  selectExperience(exp.id);
  updateCounts();
  setStatus(`Experiență #${num} adăugată.`);
});

function renderExperiences() {
  const list = document.getElementById("experiencesList");
  const empty = document.getElementById("emptyState");

  if (state.experiences.length === 0) {
    list.innerHTML = "";
    list.appendChild(empty);
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  list.innerHTML = state.experiences
    .sort((a, b) => a.number - b.number)
    .map((e) => {
      const photo = state.photos.find((p) => p.id === e.photoId);
      const video = state.videos.find((v) => v.id === e.videoId);
      const complete = photo && video;
      return `
      <div class="exp-card ${state.selectedExpId === e.id ? "active" : ""}" onclick="selectExperience(${e.id})">
        <div class="exp-number" style="background:${e.color}">${e.number}</div>
        <div class="exp-info">
          <h3>${e.name}</h3>
          <p>${photo ? "📷 " + photo.name : "Fără poză"} · ${video ? "🎬 " + video.name : "Fără video"}</p>
        </div>
        <span class="exp-status ${complete ? "" : "incomplete"}">${complete ? "Gata" : "Incomplet"}</span>
      </div>`;
    })
    .join("");
}

function selectExperience(id) {
  state.selectedExpId = id;
  renderExperiences();
  populateEditor(id);

  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
  document.querySelector('.tab[data-tab="editor"]').classList.add("active");
  document.getElementById("tabEditor").classList.add("active");
}

function populateEditor(id) {
  const exp = state.experiences.find((e) => e.id === id);
  if (!exp) {
    document.getElementById("editorEmpty").style.display = "block";
    document.getElementById("editorForm").style.display = "none";
    return;
  }

  document.getElementById("editorEmpty").style.display = "none";
  document.getElementById("editorForm").style.display = "flex";

  document.getElementById("expName").value = exp.name;
  document.getElementById("expNumber").value = exp.number;
  document.getElementById("expColor").value = exp.color;

  const photoSelect = document.getElementById("expPhoto");
  photoSelect.innerHTML = state.photos
    .map((p) => `<option value="${p.id}" ${p.id === exp.photoId ? "selected" : ""}>#${p.id} — ${p.name}</option>`)
    .join("") || `<option value="">Nicio poză</option>`;

  const videoSelect = document.getElementById("expVideo");
  videoSelect.innerHTML = state.videos
    .map((v) => `<option value="${v.id}" ${v.id === exp.videoId ? "selected" : ""}>#${v.id} — ${v.name}</option>`)
    .join("") || `<option value="">Niciun video</option>`;

  generateQR(exp);
}

document.getElementById("btnSaveExp").addEventListener("click", () => {
  const exp = state.experiences.find((e) => e.id === state.selectedExpId);
  if (!exp) return;

  const newNumber = parseInt(document.getElementById("expNumber").value, 10);
  if (newNumber < 1 || newNumber > MAX_EXPS) {
    setStatus("Numărul trebuie să fie între 1 și 10.");
    return;
  }

  const conflict = state.experiences.find((e) => e.id !== exp.id && e.number === newNumber);
  if (conflict) {
    setStatus(`Numărul ${newNumber} este deja folosit de „${conflict.name}”.`);
    return;
  }

  exp.name = document.getElementById("expName").value.trim() || `Experiență ${newNumber}`;
  exp.number = newNumber;
  exp.color = document.getElementById("expColor").value;
  exp.photoId = parseInt(document.getElementById("expPhoto").value, 10) || null;
  exp.videoId = parseInt(document.getElementById("expVideo").value, 10) || null;

  renderExperiences();
  generateQR(exp);
  setStatus(`Experiența „${exp.name}” a fost salvată.`);
});

document.getElementById("btnDeleteExp").addEventListener("click", () => {
  const exp = state.experiences.find((e) => e.id === state.selectedExpId);
  if (!exp) return;
  if (!confirm(`Ștergi experiența „${exp.name}”?`)) return;

  state.experiences = state.experiences.filter((e) => e.id !== exp.id);
  state.selectedExpId = null;
  document.getElementById("editorEmpty").style.display = "block";
  document.getElementById("editorForm").style.display = "none";
  renderExperiences();
  updateCounts();
  setStatus("Experiență ștearsă.");
});

/* ===== QR Code ===== */
function generateQR(exp) {
  const container = document.getElementById("qrPreview");
  container.innerHTML = "";

  const url = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, "")}/experiences/exp-${exp.number}/index.html`;

  QRCode.toCanvas(url, { width: 140, margin: 1 }, (err, canvas) => {
    if (err) {
      container.textContent = "Eroare QR";
      return;
    }
    container.appendChild(canvas);
  });
}

document.getElementById("btnDownloadQR").addEventListener("click", () => {
  const exp = state.experiences.find((e) => e.id === state.selectedExpId);
  if (!exp) return;
  const canvas = document.querySelector("#qrPreview canvas");
  if (!canvas) return;

  canvas.toBlob((blob) => {
    saveAs(blob, `qr-exp-${exp.number}.png`);
  });
});

/* ===== Export ===== */
document.getElementById("btnExport").addEventListener("click", async () => {
  if (state.experiences.length === 0) return;

  setStatus("Se generează pachetul... te rog așteaptă.");
  document.getElementById("btnExport").disabled = true;

  try {
    const zip = new JSZip();
    const folder = zip.folder("ar-experiences");

    let indexHtml = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Experiențe AR</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; color: #111; }
    h1 { font-size: 22px; margin-bottom: 8px; }
    p { color: #666; margin-bottom: 24px; }
    .card { display: flex; align-items: center; gap: 14px; padding: 14px; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 10px; text-decoration: none; color: inherit; transition: border-color .15s; }
    .card:hover { border-color: #6366f1; }
    .num { width: 36px; height: 36px; border-radius: 8px; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .info h3 { font-size: 15px; margin: 0 0 2px; }
    .info span { font-size: 13px; color: #888; }
  </style>
</head>
<body>
  <h1>Experiențe AR</h1>
  <p>Alege o experiență pentru a o lansa.</p>
`;

    for (const exp of state.experiences.sort((a, b) => a.number - b.number)) {
      const photo = state.photos.find((p) => p.id === exp.photoId);
      const video = state.videos.find((v) => v.id === exp.videoId);

      if (!photo || !video) {
        setStatus(`Experiența #${exp.number} este incompletă — o sar.`);
        continue;
      }

      const expFolder = folder.folder(`exp-${exp.number}`);

      const photoBlob = await fetch(photo.url).then((r) => r.blob());
      const photoExt = photo.name.split(".").pop() || "jpg";
      expFolder.file(`target.${photoExt}`, photoBlob);

      const videoBlob = await fetch(video.url).then((r) => r.blob());
      const videoExt = video.name.split(".").pop() || "mp4";
      expFolder.file(`video.${videoExt}`, videoBlob);

      const arPage = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${exp.name}</title>
  <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"></script>
  <style>
    body { margin: 0; overflow: hidden; }
    .info {
      position: fixed; top: 12px; left: 12px; right: 12px;
      background: rgba(0,0,0,0.6); color: #fff; padding: 10px 14px;
      border-radius: 8px; font-family: system-ui, sans-serif; font-size: 14px;
      z-index: 10; text-align: center;
    }
  </style>
</head>
<body>
  <div class="info">Îndreaptă camera spre poza printată — ${exp.name}</div>
  <a-scene
    mindar-image="imageTargetSrc: ./targets.mind; autoStart: true;"
    vr-mode-ui="enabled: false"
    device-orientation-permission-ui="enabled: false"
    color-space="sRGB"
    renderer="colorManagement: true, physicallyCorrectLights"
  >
    <a-assets>
      <video id="vid" src="./video.${videoExt}" loop crossorigin="anonymous" playsinline></video>
    </a-assets>
    <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
    <a-entity mindar-image-target="targetIndex: 0">
      <a-video
        src="#vid"
        position="0 0 0"
        width="1"
        height="0.5625"
        rotation="0 0 0"
      ></a-video>
    </a-entity>
  </a-scene>
  <script>
    const video = document.querySelector("#vid");
    document.addEventListener("DOMContentLoaded", () => {
      const scene = document.querySelector("a-scene");
      scene.addEventListener("targetFound", () => {
        video.play().catch(() => {});
      });
      scene.addEventListener("targetLost", () => {
        video.pause();
      });
    });
  </script>
</body>
</html>`;

      expFolder.file("index.html", arPage);

      expFolder.file(
        "README.txt",
        `Experiența: ${exp.name}
Număr: ${exp.number}

IMPORTANT:
Fișierul targets.mind trebuie generat manual din poza target.${photoExt}
folosind compilatorul oficial MindAR:

https://hiukim.github.io/mind-ar-js-doc/tools/compile

1. Încarcă poza target.${photoExt}
2. Apasă Start
3. Descarcă targets.mind
4. Pune-l în acest folder (lângă index.html)
`
      );

      indexHtml += `
  <a class="card" href="exp-${exp.number}/index.html">
    <div class="num" style="background:${exp.color}">${exp.number}</div>
    <div class="info">
      <h3>${exp.name}</h3>
      <span>${photo.name} → ${video.name}</span>
    </div>
  </a>`;
    }

    indexHtml += `
</body>
</html>`;

    folder.file("index.html", indexHtml);

    folder.file(
      "CUM-FUNCTIONEAZA.txt",
      `AR Control Panel — Pachet exportat

1. Dezarhivează acest folder.
2. Pentru fiecare experiență (folder exp-X):
   - Generează targets.mind din poza target.* folosind:
     https://hiukim.github.io/mind-ar-js-doc/tools/compile
   - Pune targets.mind în folderul respectiv.
3. Urcă tot folderul pe GitHub Pages / Netlify / Vercel.
4. Distribuie link-urile sau QR-urile.
`
    );

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "ar-experiences.zip");
    setStatus("Pachetul a fost descărcat. Verifică folderul Downloads.");
  } catch (err) {
    console.error(err);
    setStatus("Eroare la export: " + err.message);
  } finally {
    document.getElementById("btnExport").disabled = false;
  }
});

/* ===== Init ===== */
setupUploadZone("photoZone", "photoInput", "photo");
setupUploadZone("videoZone", "videoInput", "video");
updateCounts();
setStatus("Gata — încarcă poze și video-uri pentru a începe.");
