import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Download extension as zip file
router.get('/download', (req, res) => {
  try {
    const extensionPath = path.join(__dirname, '../../extension');
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=safety-monitor-extension.zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);
    archive.directory(extensionPath, false);
    archive.finalize();
  } catch (error) {
    console.error('Error downloading extension:', error);
    res.status(500).json({ error: 'Failed to download extension' });
  }
});

export default router;
