import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  applyAiSecretPreservation,
  getPublicAiConfig,
  loadAiConfig,
  saveAiConfig,
} from '../aiConfig.js';
import {
  extractDocumentFields,
  listOpenRouterModels,
  testOpenRouterConfig,
} from '../services/documentAiService.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/config', async (req, res) => {
  try {
    const config = loadAiConfig();
    res.json(getPublicAiConfig(config));
  } catch (error) {
    console.error('Error fetching AI config:', error);
    res.status(500).json({ error: 'Failed to fetch AI configuration' });
  }
});

router.put('/config', async (req, res) => {
  try {
    const current = loadAiConfig();
    const next = applyAiSecretPreservation(current, req.body || {});
    const saved = saveAiConfig(next);
    res.json({
      success: true,
      config: getPublicAiConfig(saved),
    });
  } catch (error) {
    console.error('Error updating AI config:', error);
    res.status(400).json({ error: error.message || 'Failed to update AI configuration' });
  }
});

router.post('/test', async (req, res) => {
  try {
    const current = loadAiConfig();
    const candidate = applyAiSecretPreservation(current, req.body || {});
    const result = await testOpenRouterConfig(candidate);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error testing AI config:', error);
    res.status(400).json({ error: error.message || 'Failed to test AI configuration' });
  }
});

router.get('/models', async (req, res) => {
  try {
    const models = await listOpenRouterModels({
      q: req.query.q || '',
    });
    res.json({ data: models });
  } catch (error) {
    console.error('Error fetching AI models:', error);
    res.status(400).json({ error: error.message || 'Failed to fetch AI models' });
  }
});

router.post('/extract/company', async (req, res) => {
  try {
    const result = await extractDocumentFields({
      target: 'company',
      file: req.body?.file,
    });
    res.json(result);
  } catch (error) {
    console.error('Error extracting company details:', error);
    res.status(400).json({ error: error.message || 'Failed to extract company details' });
  }
});

router.post('/extract/client', async (req, res) => {
  try {
    const result = await extractDocumentFields({
      target: 'client',
      file: req.body?.file,
    });
    res.json(result);
  } catch (error) {
    console.error('Error extracting client details:', error);
    res.status(400).json({ error: error.message || 'Failed to extract client details' });
  }
});

router.post('/extract/invoice', async (req, res) => {
  try {
    const result = await extractDocumentFields({
      target: 'invoice',
      file: req.body?.file,
    });
    res.json(result);
  } catch (error) {
    console.error('Error extracting invoice details:', error);
    res.status(400).json({ error: error.message || 'Failed to extract invoice details' });
  }
});

export default router;
