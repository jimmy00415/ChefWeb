import { Router } from 'express';

const router = Router();

router.get('/homepage', (req, res) => {
  return res.json({
    videoUrl: process.env.VIDEO_HOMEPAGE_URL || '',
    thumbnailUrl: process.env.VIDEO_HOMEPAGE_THUMBNAIL || '',
    title: 'ChefWeb Experience',
    videoId: 'homepage_video'
  });
});

router.post('/presign', (req, res) => {
  return res.json({
    uploadUrl: 'https://example.com/upload',
    fileUrl: 'https://cdn.example.com/video.mp4'
  });
});

export default router;
