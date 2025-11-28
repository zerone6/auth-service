// @ts-nocheck
import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createSchool,
  getSchoolsByUser,
  getSchoolById,
  updateSchool,
  deleteSchool,
  getUserCalculatorData,
  upsertUserCalculatorData,
  addUserSelectedSchool,
  getUserSelectedSchools,
  removeUserSelectedSchool,
  clearUserSelectedSchools,
  updateSelectedSchoolsOrder,
  CreateSchoolInput,
  UpdateCalculatorDataInput
} from '../db/calculator-queries';

const router = express.Router();

// ============= School Routes =============

/**
 * GET /api/calculator/schools
 * Get all schools created by the current user
 */
router.get('/schools', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const schools = await getSchoolsByUser(userId);
    res.json({ schools });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

/**
 * GET /api/calculator/schools/:id
 * Get school by ID
 */
router.get('/schools/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(req.params.id);
    const school = await getSchoolById(schoolId);

    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.json({ school });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({ error: 'Failed to fetch school' });
  }
});

/**
 * POST /api/calculator/schools
 * Create a new school
 */
router.post('/schools', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const input: CreateSchoolInput = {
      ...req.body,
      created_by: userId
    };

    // Validate required fields
    if (!input.name || !input.pattern_type) {
      return res.status(400).json({ error: 'Name and pattern_type are required' });
    }

    const school = await createSchool(input);
    res.status(201).json({ school });
  } catch (error: any) {
    console.error('Error creating school:', error);
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({ error: 'School with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create school' });
  }
});

/**
 * PUT /api/calculator/schools/:id
 * Update school
 */
router.put('/schools/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const schoolId = parseInt(req.params.id);

    const school = await updateSchool(schoolId, userId, req.body);

    if (!school) {
      return res.status(404).json({ error: 'School not found or unauthorized' });
    }

    res.json({ school });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({ error: 'Failed to update school' });
  }
});

/**
 * DELETE /api/calculator/schools/:id
 * Delete school
 */
router.delete('/schools/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const schoolId = parseInt(req.params.id);

    const deleted = await deleteSchool(schoolId, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'School not found or unauthorized' });
    }

    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({ error: 'Failed to delete school' });
  }
});

// ============= Calculator Data Routes =============

/**
 * GET /api/calculator/data
 * Get user's calculator data
 */
router.get('/data', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const data = await getUserCalculatorData(userId);
    res.json({ data });
  } catch (error) {
    console.error('Error fetching calculator data:', error);
    res.status(500).json({ error: 'Failed to fetch calculator data' });
  }
});

/**
 * POST /api/calculator/data
 * Create or update user's calculator data
 */
router.post('/data', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const input: UpdateCalculatorDataInput = {
      ...req.body,
      user_id: userId
    };

    const data = await upsertUserCalculatorData(input);
    res.json({ data });
  } catch (error) {
    console.error('Error saving calculator data:', error);
    res.status(500).json({ error: 'Failed to save calculator data' });
  }
});

// ============= Selected Schools Routes =============

/**
 * GET /api/calculator/selected-schools
 * Get user's selected schools
 */
router.get('/selected-schools', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const schools = await getUserSelectedSchools(userId);
    res.json({ schools });
  } catch (error) {
    console.error('Error fetching selected schools:', error);
    res.status(500).json({ error: 'Failed to fetch selected schools' });
  }
});

/**
 * POST /api/calculator/selected-schools
 * Add school to user's selected list
 */
router.post('/selected-schools', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { school_id, display_order } = req.body;

    if (!school_id) {
      return res.status(400).json({ error: 'school_id is required' });
    }

    const selectedSchool = await addUserSelectedSchool(userId, school_id, display_order);
    res.status(201).json({ selectedSchool });
  } catch (error: any) {
    console.error('Error adding selected school:', error);
    if (error.code === '23503') {
      // Foreign key violation
      return res.status(404).json({ error: 'School not found' });
    }
    res.status(500).json({ error: 'Failed to add selected school' });
  }
});

/**
 * DELETE /api/calculator/selected-schools/:schoolId
 * Remove school from user's selected list
 */
router.delete('/selected-schools/:schoolId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const schoolId = parseInt(req.params.schoolId);

    const removed = await removeUserSelectedSchool(userId, schoolId);

    if (!removed) {
      return res.status(404).json({ error: 'Selected school not found' });
    }

    res.json({ message: 'School removed from selected list' });
  } catch (error) {
    console.error('Error removing selected school:', error);
    res.status(500).json({ error: 'Failed to remove selected school' });
  }
});

/**
 * DELETE /api/calculator/selected-schools
 * Clear all selected schools
 */
router.delete('/selected-schools', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    await clearUserSelectedSchools(userId);
    res.json({ message: 'All selected schools cleared' });
  } catch (error) {
    console.error('Error clearing selected schools:', error);
    res.status(500).json({ error: 'Failed to clear selected schools' });
  }
});

/**
 * PUT /api/calculator/selected-schools/order
 * Update display order for selected schools
 */
router.put('/selected-schools/order', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { schools } = req.body;

    if (!Array.isArray(schools)) {
      return res.status(400).json({ error: 'schools array is required' });
    }

    await updateSelectedSchoolsOrder(userId, schools);
    res.json({ message: 'Display order updated successfully' });
  } catch (error) {
    console.error('Error updating selected schools order:', error);
    res.status(500).json({ error: 'Failed to update display order' });
  }
});

export default router;
