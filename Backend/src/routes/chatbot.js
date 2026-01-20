import { Router } from 'express';

const router = Router();

router.post('/message', (req, res) => {
  const message = (req.body?.message || '').toLowerCase();
  let response = "I can help with pricing, packages, and booking details. What would you like to know?";

  if (message.includes('price') || message.includes('cost')) {
    response = 'Packages start at $65 (Essential), $75 (Signature), and $95 (Premium). Minimum spend is $500.';
  } else if (message.includes('area') || message.includes('serve')) {
    response = 'We serve CA, NY, TX, FL, IL, PA, OH, GA, NC, and MI.';
  } else if (message.includes('package')) {
    response = 'We offer Essential, Signature, and Premium packages. Signature is most popular.';
  }

  return res.json({ response, intent: 'general_question', confidence: 0.7, quickReplies: ['Book now', 'See packages'] });
});

export default router;
