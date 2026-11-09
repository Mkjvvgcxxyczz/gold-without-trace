
const loginForm = document.querySelector("#loginForm");
const loginScreen = document.querySelector("#loginScreen");
const dashboard = document.querySelector("#dashboard");
const message = document.querySelector("#message");
const settingsMessage = document.querySelector("#settingsMessage");

const backgroundColor = document.querySelector("#backgroundColor");
const backgroundImage = document.querySelector("#backgroundImage");
const musicEnabled = document.querySelector("#musicEnabled");
const musicFile = document.querySelector("#musicFile");
const saveButton = document.querySelector("#saveSettings");
const logoutButton = document.querySelector("#logoutButton");

let currentSettings = {
  backgroundColor: "#090909",
  backgroundImage: "",
  musicEnabled: false,
  musicUrl: ""
};

function showLogin() {
  loginScreen.hidden = false;
  dashboard.hidden = true;
}

function showDashboard() {
  loginScreen.hidden = true;
  dashboard.hidden = false;
}

function openSection(sectionId) {
  document.querySelectorAll("#dashboard section").forEach(section => {
    section.hidden = section.id !== sectionId;
  });
}

document.querySelectorAll("[data-section]").forEach(button => {
  button.addEventListener("click", () => {
    openSection(button.dataset.section);
  });
});

async function loadSettings() {
  const response = await fetch("/api/settings");
  if (!response.ok) throw new Error("تعذر تحميل الإعدادات");

  currentSettings = await response.json();

  backgroundColor.value = currentSettings.backgroundColor || "#090909";
  musicEnabled.checked = currentSettings.musicEnabled === true;
}

async function uploadFile(file, type) {
  if (!file) return "";

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/upload/${type}`, {
    method: "POST",
    credentials: "same-origin",
    body: formData
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "فشل رفع الملف");
  }

  return data.url;
}

async function checkSession() {
  try {
    const response = await fetch("/api/session", {
      credentials: "same-origin"
    });

    const data = await response.json();

    if (data.isAdmin) {
      showDashboard();
      await loadSettings();
      openSection("design");
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  message.textContent = "جارٍ تسجيل الدخول...";

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: loginForm.elements.username.value,
        password: loginForm.elements.password.value
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "بيانات الدخول غير صحيحة");
    }

    loginForm.reset();
    message.textContent = "";
    showDashboard();
    await loadSettings();
    openSection("design");
  } catch (error) {
    message.textContent = error.message;
  }
});

saveButton.addEventListener("click", async () => {
  settingsMessage.textContent = "جارٍ الحفظ...";

  try {
    let imageUrl = currentSettings.backgroundImage || "";
    let musicUrl = currentSettings.musicUrl || "";

    if (backgroundImage.files[0]) {
      settingsMessage.textContent = "جارٍ رفع الصورة...";
      imageUrl = await uploadFile(backgroundImage.files[0], "image");
    }

    if (musicFile.files[0]) {
      settingsMessage.textContent = "جارٍ رفع الموسيقى...";
      musicUrl = await uploadFile(musicFile.files[0], "audio");
    }

    const settings = {
      backgroundColor: backgroundColor.value,
      backgroundImage: imageUrl,
      musicEnabled: musicEnabled.checked,
      musicUrl
    };

    const response = await fetch("/api/settings", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "تعذر حفظ الإعدادات");
    }

    currentSettings = data.settings;
    backgroundImage.value = "";
    musicFile.value = "";

    settingsMessage.textContent = "تم رفع الملفات وحفظ الإعدادات بنجاح";
  } catch (error) {
    settingsMessage.textContent = error.message;
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "same-origin"
    });
  } finally {
    showLogin();
  }
});

checkSession();

