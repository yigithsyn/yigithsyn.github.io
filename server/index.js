const express = require('express');
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.join(__dirname, '..');
const UPLOAD_DIR = path.join(ROOT, 'img', 'upload');
const PORT = process.env.PORT || 3000;
const MAX_SIZE = 30 * 1024 * 1024;
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.avif']);

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(path.join(__dirname, 'defter.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS uploads (
    id            TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    stored_name   TEXT NOT NULL,
    path          TEXT NOT NULL,
    mime_type     TEXT NOT NULL,
    size          INTEGER NOT NULL,
    file_modified TEXT,
    uploaded_at   TEXT NOT NULL,
    ip            TEXT
  )
`);
const insert = db.prepare(`
  INSERT INTO uploads (id, original_name, stored_name, path, mime_type, size, file_modified, uploaded_at, ip)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const getById = db.prepare('SELECT * FROM uploads WHERE id = ?');
const remove = db.prepare('DELETE FROM uploads WHERE id = ?');
const list = db.prepare('SELECT * FROM uploads ORDER BY uploaded_at DESC');

const safeName = (name) =>
  path.basename(Buffer.from(name, 'latin1').toString('utf8'))
    .replace(/[^\p{L}\p{N}._-]+/gu, '_')
    .slice(-100);

// Dosya önce çalışma alanı dışına yazılır; aksi halde Live Preview gibi izleyiciler
// yükleme sürerken sayfayı yenileyip isteği keser.
const STAGING_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'defter-upload-'));

const moveFile = (from, to) => {
  try {
    fs.renameSync(from, to);
  } catch (err) {
    if (err.code !== 'EXDEV') throw err;
    fs.copyFileSync(from, to);
    fs.unlinkSync(from);
  }
};

const storage = multer.diskStorage({
  destination: STAGING_DIR,
  filename(req, file, cb) {
    file.uid = crypto.randomUUID();
    file.cleanName = safeName(file.originalname);
    cb(null, `${file.uid}-${file.cleanName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!file.mimetype.startsWith('image/') || !IMAGE_EXTS.has(ext)) {
      return cb(new Error('Sadece görsel dosyaları yüklenebilir.'));
    }
    cb(null, true);
  },
});

const app = express();

// Arayüz farklı bir kaynaktan (ör. Live Server) açıldığında da API'ye erişilebilsin.
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/img/upload', express.static(UPLOAD_DIR));

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "'image' alanında dosya gerekli." });
  const f = req.file;
  const relPath = `img/upload/${f.filename}`;
  const lastModified = Number(req.body.lastModified);
  const record = {
    id: f.uid,
    original_name: f.cleanName,
    stored_name: f.filename,
    path: relPath,
    mime_type: f.mimetype,
    size: f.size,
    file_modified: Number.isFinite(lastModified) && lastModified > 0 ? new Date(lastModified).toISOString() : null,
    uploaded_at: new Date().toISOString(),
    ip: req.ip,
  };
  const finalPath = path.join(UPLOAD_DIR, f.filename);
  try {
    moveFile(f.path, finalPath);
    insert.run(...Object.values(record));
  } catch (err) {
    fs.unlink(f.path, () => {});
    fs.unlink(finalPath, () => {});
    throw err;
  }
  res.status(201).json({ ...record, url: `/${relPath}` });
});

app.get('/api/uploads', (req, res) => res.json(list.all()));
app.get('/api/uploads/:id', (req, res) => {
  const row = getById.get(req.params.id);
  row ? res.json(row) : res.status(404).json({ error: 'Bulunamadı.' });
});

// Yalnızca veritabanı kaydı silinir; dosya diskte kalır.
app.delete('/api/uploads/:id', (req, res) => {
  const result = remove.run(req.params.id);
  result.changes ? res.status(204).end() : res.status(404).json({ error: 'Bulunamadı.' });
});

app.use((err, req, res, next) => {
  if (req.aborted || res.destroyed) return;
  if (req.file) fs.unlink(req.file.path, () => {});
  const status = err instanceof multer.MulterError ? (err.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
    : err.message?.startsWith('Sadece') ? 400 : 500;
  res.status(status).json({ error: status === 500 ? 'Sunucu hatası.' : err.message });
  if (status === 500) console.error(err);
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
