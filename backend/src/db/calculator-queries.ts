import { pool } from './connection';

// ============= Interfaces =============

export interface School {
  id: number;
  name: string;
  pattern_type: 'simple' | 'ratio';
  ratio_test: number;
  ratio_naishin: number;
  pass_rate_80: number | null;
  pass_rate_60: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserCalculatorData {
  id: number;
  user_id: number;

  // 내신 성적
  grade_japanese: number;
  grade_math: number;
  grade_english: number;
  grade_social: number;
  grade_science: number;
  grade_tech_home: number;
  grade_pe: number;
  grade_music: number;
  grade_art: number;

  // 학력검사 점수
  exam_japanese: number;
  exam_math: number;
  exam_english: number;
  exam_social: number;
  exam_science: number;

  // 가중치
  use_weights: boolean;
  weight_japanese: number;
  weight_math: number;
  weight_english: number;
  weight_social: number;
  weight_science: number;

  // 추가 점수
  use_interview: boolean;
  use_essay: boolean;
  use_practical: boolean;
  use_bonus: boolean;
  use_speaking: boolean;

  additional_interview: number;
  additional_essay: number;
  additional_practical: number;
  additional_bonus: number;
  additional_speaking: number;
  speaking_grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

  created_at: Date;
  updated_at: Date;
}

export interface UserSelectedSchool {
  id: number;
  user_id: number;
  school_id: number;
  display_order: number;
  created_at: Date;
}

export interface CreateSchoolInput {
  name: string;
  pattern_type: 'simple' | 'ratio';
  ratio_test?: number;
  ratio_naishin?: number;
  pass_rate_80?: number;
  pass_rate_60?: number;
  created_by: number;
}

export interface UpdateCalculatorDataInput {
  user_id: number;
  grade_japanese?: number;
  grade_math?: number;
  grade_english?: number;
  grade_social?: number;
  grade_science?: number;
  grade_tech_home?: number;
  grade_pe?: number;
  grade_music?: number;
  grade_art?: number;
  exam_japanese?: number;
  exam_math?: number;
  exam_english?: number;
  exam_social?: number;
  exam_science?: number;
  use_weights?: boolean;
  weight_japanese?: number;
  weight_math?: number;
  weight_english?: number;
  weight_social?: number;
  weight_science?: number;
  use_interview?: boolean;
  use_essay?: boolean;
  use_practical?: boolean;
  use_bonus?: boolean;
  use_speaking?: boolean;
  additional_interview?: number;
  additional_essay?: number;
  additional_practical?: number;
  additional_bonus?: number;
  additional_speaking?: number;
  speaking_grade?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

// ============= School CRUD =============

/**
 * Create a new school
 */
export async function createSchool(input: CreateSchoolInput): Promise<School> {
  const result = await pool.query(
    `INSERT INTO schools (name, pattern_type, ratio_test, ratio_naishin, pass_rate_80, pass_rate_60, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.name,
      input.pattern_type,
      input.ratio_test || 7,
      input.ratio_naishin || 3,
      input.pass_rate_80 || null,
      input.pass_rate_60 || null,
      input.created_by
    ]
  );
  return result.rows[0];
}

/**
 * Get all schools available to user (shared across all users)
 * Excludes schools that the user has marked as excluded
 */
export async function getSchoolsByUser(userId: number): Promise<School[]> {
  const result = await pool.query(
    `SELECT s.* FROM schools s
     WHERE s.id NOT IN (
       SELECT school_id FROM user_excluded_schools WHERE user_id = $1
     )
     ORDER BY s.created_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Get school by ID
 */
export async function getSchoolById(schoolId: number): Promise<School | null> {
  const result = await pool.query(
    'SELECT * FROM schools WHERE id = $1',
    [schoolId]
  );
  return result.rows[0] || null;
}

/**
 * Update school
 */
export async function updateSchool(
  schoolId: number,
  userId: number,
  updates: Partial<CreateSchoolInput>
): Promise<School | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.pattern_type !== undefined) {
    fields.push(`pattern_type = $${paramCount++}`);
    values.push(updates.pattern_type);
  }
  if (updates.ratio_test !== undefined) {
    fields.push(`ratio_test = $${paramCount++}`);
    values.push(updates.ratio_test);
  }
  if (updates.ratio_naishin !== undefined) {
    fields.push(`ratio_naishin = $${paramCount++}`);
    values.push(updates.ratio_naishin);
  }
  if (updates.pass_rate_80 !== undefined) {
    fields.push(`pass_rate_80 = $${paramCount++}`);
    values.push(updates.pass_rate_80);
  }
  if (updates.pass_rate_60 !== undefined) {
    fields.push(`pass_rate_60 = $${paramCount++}`);
    values.push(updates.pass_rate_60);
  }

  if (fields.length === 0) {
    return await getSchoolById(schoolId);
  }

  values.push(schoolId, userId);

  const result = await pool.query(
    `UPDATE schools
     SET ${fields.join(', ')}
     WHERE id = $${paramCount} AND created_by = $${paramCount + 1}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

/**
 * Delete school
 */
export async function deleteSchool(schoolId: number, userId: number): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM schools WHERE id = $1 AND created_by = $2',
    [schoolId, userId]
  );
  return result.rowCount ? result.rowCount > 0 : false;
}

// ============= User Calculator Data =============

/**
 * Get user calculator data
 */
export async function getUserCalculatorData(userId: number): Promise<UserCalculatorData | null> {
  const result = await pool.query(
    'SELECT * FROM user_calculator_data WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Create or update user calculator data
 */
export async function upsertUserCalculatorData(
  input: UpdateCalculatorDataInput
): Promise<UserCalculatorData> {
  const fields: string[] = [];
  const values: any[] = [input.user_id];
  let paramCount = 2;

  // Build field list dynamically
  const fieldMap: { [key: string]: any } = { ...input };
  delete fieldMap.user_id;

  Object.keys(fieldMap).forEach((key) => {
    if (fieldMap[key] !== undefined) {
      fields.push(`${key} = $${paramCount++}`);
      values.push(fieldMap[key]);
    }
  });

  const result = await pool.query(
    `INSERT INTO user_calculator_data (user_id, ${Object.keys(fieldMap).join(', ')})
     VALUES ($1, ${Object.keys(fieldMap).map((_, i) => `$${i + 2}`).join(', ')})
     ON CONFLICT (user_id)
     DO UPDATE SET ${fields.join(', ')}
     RETURNING *`,
    values
  );

  return result.rows[0];
}

// ============= User Selected Schools =============

/**
 * Add school to user's selected list
 */
export async function addUserSelectedSchool(
  userId: number,
  schoolId: number,
  displayOrder?: number
): Promise<UserSelectedSchool> {
  const result = await pool.query(
    `INSERT INTO user_selected_schools (user_id, school_id, display_order)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, school_id)
     DO UPDATE SET display_order = $3
     RETURNING *`,
    [userId, schoolId, displayOrder || 0]
  );
  return result.rows[0];
}

/**
 * Get user's selected schools with school details
 */
export async function getUserSelectedSchools(userId: number): Promise<(School & { display_order: number })[]> {
  const result = await pool.query(
    `SELECT s.*, uss.display_order
     FROM user_selected_schools uss
     JOIN schools s ON uss.school_id = s.id
     WHERE uss.user_id = $1
     ORDER BY uss.display_order ASC, uss.created_at ASC`,
    [userId]
  );
  return result.rows;
}

/**
 * Remove school from user's selected list
 */
export async function removeUserSelectedSchool(
  userId: number,
  schoolId: number
): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM user_selected_schools WHERE user_id = $1 AND school_id = $2',
    [userId, schoolId]
  );
  return result.rowCount ? result.rowCount > 0 : false;
}

/**
 * Clear all user selected schools
 */
export async function clearUserSelectedSchools(userId: number): Promise<void> {
  await pool.query(
    'DELETE FROM user_selected_schools WHERE user_id = $1',
    [userId]
  );
}

/**
 * Update display order for selected schools
 */
export async function updateSelectedSchoolsOrder(
  userId: number,
  schoolOrders: { school_id: number; display_order: number }[]
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const order of schoolOrders) {
      await client.query(
        'UPDATE user_selected_schools SET display_order = $1 WHERE user_id = $2 AND school_id = $3',
        [order.display_order, userId, order.school_id]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ============= User Excluded Schools =============

/**
 * Exclude a school from user's available list
 * Also removes it from selected schools if present
 */
export async function excludeSchool(
  userId: number,
  schoolId: number
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add to excluded schools
    await client.query(
      `INSERT INTO user_excluded_schools (user_id, school_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, school_id) DO NOTHING`,
      [userId, schoolId]
    );

    // Remove from selected schools if present
    await client.query(
      'DELETE FROM user_selected_schools WHERE user_id = $1 AND school_id = $2',
      [userId, schoolId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Include a school back to user's available list
 */
export async function includeSchool(
  userId: number,
  schoolId: number
): Promise<void> {
  await pool.query(
    'DELETE FROM user_excluded_schools WHERE user_id = $1 AND school_id = $2',
    [userId, schoolId]
  );
}

/**
 * Get user's excluded schools
 */
export async function getUserExcludedSchools(userId: number): Promise<School[]> {
  const result = await pool.query(
    `SELECT s.*
     FROM user_excluded_schools ues
     JOIN schools s ON ues.school_id = s.id
     WHERE ues.user_id = $1
     ORDER BY ues.excluded_at DESC`,
    [userId]
  );
  return result.rows;
}
