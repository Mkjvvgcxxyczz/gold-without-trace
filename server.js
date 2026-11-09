
import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import dotenv from "dotenv";
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const SETTINGS_FILE = path.resolve("data/settings.json");
const UPLOAD_DIR = path.resolve("public/uploads");

if (
  !process.env.ADMIN_USERNAME ||
  !process.env.ADMIN_PASSWORD ||
  !process.env.SESSION_SECRET
) {
  throw new Error("تحقق من إعدادات ملف .env");
}

const passwordHash = await bcrypt.hash(
  process.env.ADMIN_PASSWORD,
  12
);

await fs.mkdir(UPLOAD_DIR, { recursive: true });

async function readSettings() {
  try {
    return JSON.parse(await fs.readFile(SETTINGS_FILE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        backgroundColor: "#090909",
        backgroundImage: "",
        musicEnabled: false,
        musicUrl: ""
      };
    }
    throw error;
  }
}

async function saveSettings(settings) {
  await fs.mkdir(path.dirname(SETTINGS_FILE), {
    recursive: true
  });

  await fs.writeFile(
    SETTINGS_FILE,
    JSON.stringify(settings, null, 2),
    "utf8"
  );
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(express.json({ limit: "2mb" }));

app.use(session({
  name: "admin.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 60 * 60 * 1000
  }
}));

app.use(express.static(path.resolve("public")));

function requireAdmin(req, res, next) {
  if (req.session.isAdmin !== true) {
    return res.status(401).json({
      success: false,
      message: "يجب تسجيل دخول المدير"
    });
  }
  next();
}

// أنواع الملفات المسموحة
const allowedTypes = {
  image: {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
  },
  audio: {
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "audio/mp4": ".m4a",
    "audio/x-m4a": ".m4a",
    "audio/aac": ".aac"
  }
};

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const folder = req.uploadType === "image"
      ? "images"
      : "audio";

    callback(null, path.join(UPLOAD_DIR, folder));
  },

  filename(req, file, callback) {
    const extension =
      allowedTypes[req.uploadType][file.mimetype];

    callback(null, randomUUID() + extension);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1
  },
  fileFilter(req, file, callback) {
    const allowed = allowedTypes[req.uploadType];

    if (!allowed || !allowed[file.mimetype]) {
      return callback(
        new Error("نوع الملف غير مسموح")
      );
    }

    callback(null, true);
  }
});

function uploadHandler(type) {
  return (req, res, next) => {
    req.uploadType = type;

    upload.single("file")(req, res, error => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "لم يتم اختيار ملف"
        });
      }

      const folder = type === "image" ? "images" : "audio";

      res.json({
        success: true,
        url: `/uploads/${folder}/${req.file.filename}`
      });
    });
  };
}

// تسجيل الدخول
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};

  const validUsername =
    username === process.env.ADMIN_USERNAME;

  const validPassword =
    typeof password === "string" &&
    await bcrypt.compare(password, passwordHash);

  if (!validUsername || !validPassword) {
    return res.status(401).json({
      success: false,
      message: "بيانات الدخول غير صحيحة"
    });
  }

  req.session.regenerate(error => {
    if (error) {
      return res.status(500).json({
        success: false
      });
    }

    req.session.isAdmin = true;

    req.session.save(saveError => {
      if (saveError) {
        return res.status(500).json({
          success: false
        });
      }

      res.json({ success: true });
    });
  });
});

// فحص الجلسة
app.get("/api/session", (req, res) => {
  res.json({
    isAdmin: req.session.isAdmin === true
  });
});

// تسجيل الخروج
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("admin.sid");
    res.json({ success: true });
  });
});

// رفع صورة
app.post(
  "/api/upload/image",
  requireAdmin,
  uploadHandler("image")
);

// رفع صوت
app.post(
  "/api/upload/audio",
  requireAdmin,
  uploadHandler("audio")
);

// جلب الإعدادات
app.get("/api/settings", async (req, res) => {
  try {
    res.json(await readSettings());
  } catch {
    res.status(500).json({
      message: "تعذر قراءة الإعدادات"
    });
  }
});

// حفظ الإعدادات
app.put("/api/settings", requireAdmin, async (req, res) => {
  try {
    const {
      backgroundColor,
      backgroundImage,
      musicEnabled,
      musicUrl
    } = req.body || {};

    if (
      typeof backgroundColor !== "string" ||
      !/^#[0-9a-fA-F]{6}$/.test(backgroundColor) ||
      typeof backgroundImage !== "string" ||
      backgroundImage.length > 500 ||
      typeof musicEnabled !== "boolean" ||
      typeof musicUrl !== "string" ||
      musicUrl.length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "الإعدادات غير صالحة"
      });
    }

    const settings = {
      backgroundColor,
      backgroundImage,
      musicEnabled,
      musicUrl
    };

    await saveSettings(settings);

    res.json({
      success: true,
      settings
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "تعذر حفظ الإعدادات"
    });
  }
});

app.get("/", (req, res) => {
  res.send("Admin server is running");
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running on port ${PORT}`);
});

