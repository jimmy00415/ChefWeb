import { Router } from 'express';

const router = Router();

router.get('/packages', (req, res) => {
  return res.json({
    packages: [
      { id: 'essential', name: 'Essential', price: 65, childPrice: 43 },
      { id: 'signature', name: 'Signature', price: 75, childPrice: 50 },
      { id: 'premium', name: 'Premium', price: 95, childPrice: 63 }
    ]
  });
});

router.get('/addons', (req, res) => {
  return res.json({
    addons: [
      { id: 'fried-rice', name: 'Fried Rice Upgrade', price: 10 },
      { id: 'sake', name: 'Premium Sake', price: 25 },
      { id: 'extra-protein', name: 'Extra Protein', price: 15 }
    ]
  });
});

router.get('/service-areas', (req, res) => {
  return res.json({
    serviceAreas: [
      { state: 'CA', travelFeeStatus: 'included' },
      { state: 'NY', travelFeeStatus: 'included' },
      { state: 'TX', travelFeeStatus: 'estimated' },
      { state: 'FL', travelFeeStatus: 'estimated' },
      { state: 'IL', travelFeeStatus: 'estimated' },
      { state: 'PA', travelFeeStatus: 'estimated' },
      { state: 'OH', travelFeeStatus: 'estimated' },
      { state: 'GA', travelFeeStatus: 'estimated' },
      { state: 'NC', travelFeeStatus: 'estimated' },
      { state: 'MI', travelFeeStatus: 'estimated' }
    ]
  });
});

export default router;
