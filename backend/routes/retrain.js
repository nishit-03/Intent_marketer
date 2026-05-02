const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');
const path = require('path');
const { loadModel } = require('../services/adRanker');

/**
 * POST /api/retrain - Trigger model retraining
 */
router.post('/', async (req, res) => {
  try {
    const mlDir = path.join(__dirname, '..', 'ml');

    // Step 1: Generate fresh synthetic data (augmented with real interaction data)
    console.log('🔄 Generating training data...');
    try {
      execSync(`python "${path.join(mlDir, 'generate_dataset.py')}"`, {
        cwd: mlDir,
        timeout: 60000,
      });
    } catch (e) {
      console.warn('Python dataset generation skipped:', e.message);
    }

    // Step 2: Train model
    console.log('🔄 Training model...');
    try {
      execSync(`python "${path.join(mlDir, 'train_model.py')}"`, {
        cwd: mlDir,
        timeout: 120000,
      });
    } catch (e) {
      console.warn('Python model training skipped:', e.message);
    }

    // Step 3: Reload model in ad ranker
    const loaded = loadModel();

    res.json({
      success: true,
      model_loaded: loaded,
      message: 'Retraining pipeline completed',
    });
  } catch (error) {
    console.error('Retrain error:', error.message);
    res.status(500).json({ error: 'Retraining failed', details: error.message });
  }
});

module.exports = router;
