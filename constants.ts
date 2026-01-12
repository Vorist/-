import { Exercise, User, WorkoutLog, WorkoutSet } from './types';

export const MOCK_USER: User = {
  id: 'u-123',
  email: 'athlete@apexfit.com',
  name: 'Алексей',
  surname: 'Doe',
  dob: '1995-05-15',
  gender: 'male',
  height: 180,
  weight: 85,
  units: {
    weight: 'kg',
    height: 'cm'
  },
  fitness_level: 'advanced',
  goals: ['strength'],
  tracking_mode: 'advanced',
  created_at: Date.now(),
  updated_at: Date.now()
};

// ==================================================================================
// БАЗА ЗНАНИЙ УПРАЖНЕНИЙ (EXERCISE KNOWLEDGE BASE)
// Редактируйте этот массив, чтобы добавлять новые упражнения или изменять описания.
// ==================================================================================
export const EXERCISE_DB: Exercise[] = [
  { 
    id: 'bp_bb', 
    name: 'Жим лежа (Штанга)', 
    target_muscle_group: 'Грудь', 
    equipment_type: 'Штанга', 
    category: 'Strength',
    difficulty: 'Intermediate',
    mets_code: 5.0,
    description: 'Легендарное упражнение для развития силы и массы грудных мышц. Лягте на скамью, плотно прижав лопатки и ягодицы. Возьмите штангу хватом чуть шире плеч. На вдохе плавно опустите штангу на середину груди, на выдохе мощно выжмите вверх.',
    tips: 'Не отрывайте таз от скамьи. Локти держите под углом 45 градусов к корпусу, чтобы не перегружать плечи. Контролируйте штангу на всей амплитуде.',
    image_url: 'https://placehold.co/600x400/1e293b/primary?text=Bench+Press' 
  },
  { 
    id: 'sq_bb', 
    name: 'Приседания (Штанга)', 
    target_muscle_group: 'Ноги', 
    equipment_type: 'Штанга', 
    category: 'Strength',
    difficulty: 'Advanced',
    mets_code: 6.0,
    description: 'Базовое упражнение для всего тела с акцентом на квадрицепсы и ягодицы. Расположите штангу на трапециях. Ноги на ширине плеч. На вдохе отведите таз назад и согните колени, сохраняя спину прямой. Опуститесь до параллели или ниже, на выдохе встаньте.',
    tips: 'Колени должны смотреть в сторону носков. Не скругляйте спину в пояснице. Смотрите вперед или чуть вверх.',
    image_url: 'https://placehold.co/600x400/1e293b/primary?text=Squat'
  },
  { 
    id: 'dl_bb', 
    name: 'Становая тяга (Штанга)', 
    target_muscle_group: 'Спина', 
    equipment_type: 'Штанга', 
    category: 'Strength',
    difficulty: 'Advanced',
    mets_code: 6.0,
    description: 'Мощное тяговое движение. Подойдите к штанге вплотную. Наклонитесь и возьмитесь за гриф. Спина прямая, грудь вперед. Напрягите мышцы кора и, разгибая ноги и спину, поднимите штангу до полного выпрямления корпуса.',
    tips: 'Гриф должен скользить по ногам. Не дергайте штангу, движение должно быть плавным и мощным. В верхней точке не прогибайтесь назад.',
    image_url: 'https://placehold.co/600x400/1e293b/primary?text=Deadlift'
  },
  { 
    id: 'ohp_bb', 
    name: 'Армейский жим', 
    target_muscle_group: 'Плечи', 
    equipment_type: 'Штанга', 
    category: 'Strength',
    difficulty: 'Intermediate',
    mets_code: 4.5,
    description: 'Базовое упражнение на дельты. Стоя, держите штангу на груди. Напрягите пресс и ягодицы. На выдохе выжмите штангу строго вверх над головой, слегка подавая корпус вперед в верхней точке, чтобы штанга была над макушкой.',
    tips: 'Не помогайте себе ногами (это уже швунг). Не прогибайтесь сильно в пояснице. Локти смотрят немного вперед.',
    image_url: 'https://placehold.co/600x400/1e293b/primary?text=Overhead+Press'
  },
  { 
    id: 'pullup', 
    name: 'Подтягивания', 
    target_muscle_group: 'Спина', 
    equipment_type: 'Собственный вес', 
    category: 'Strength',
    difficulty: 'Intermediate',
    mets_code: 4.0,
    description: 'Классическое упражнение для ширины спины. Возьмитесь за перекладину хватом шире плеч. На выдохе подтянитесь грудью к перекладине, сводя лопатки. На вдохе подконтрольно опуститесь.',
    tips: 'Не раскачивайтесь. Тяните именно спиной, а не руками. Представьте, что вы тянете локти вниз к поясу.',
    image_url: 'https://placehold.co/600x400/1e293b/primary?text=Pullup'
  },
  { 
    id: 'db_curl', 
    name: 'Сгибания с гантелями', 
    target_muscle_group: 'Бицепс', 
    equipment_type: 'Гантели', 
    category: 'Strength',
    difficulty: 'Beginner',
    mets_code: 3.5,
    description: 'Изолированное упражнение на бицепс. Стоя или сидя, держите гантели в опущенных руках. Сгибайте руки в локтях, поднимая гантели к плечам. Можно делать супинацию (поворот кисти) в верхней точке.',
    tips: 'Локти должны быть прижаты к корпусу и оставаться неподвижными. Не закидывайте вес спиной.',
    image_url: 'https://placehold.co/600x400/1e293b/primary?text=Bicep+Curl'
  },
  { 
    id: 'tricep_ext', 
    name: 'Разгибания на трицепс', 
    target_muscle_group: 'Трицепс', 
    equipment_type: 'Блок', 
    category: 'Strength',
    difficulty: 'Beginner',
    mets_code: 3.5,
    description: 'Упражнение на блоке для проработки трехглавой мышцы плеча. Возьмитесь за рукоятку верхнего блока. Локти прижмите к корпусу. Разгибайте руки вниз до полного выпрямления.',
    tips: 'Плечи и локти должны быть зафиксированы. Движение происходит только в локтевом суставе.',
    image_url: 'https://placehold.co/600x400/1e293b/primary?text=Tricep+Extension'
  },
];

export const MOCK_WORKOUT_PLAN = [
  { exercise_id: 'bp_bb', target_sets: 4, target_reps: 10, target_weight: 80, target_rest_sec: 90 },
  { exercise_id: 'sq_bb', target_sets: 4, target_reps: 8, target_weight: 100, target_rest_sec: 120 },
  { exercise_id: 'ohp_bb', target_sets: 3, target_reps: 10, target_weight: 50, target_rest_sec: 90 },
  { exercise_id: 'pullup', target_sets: 3, target_reps: 12, target_weight: 0, target_rest_sec: 90 },
  { exercise_id: 'db_curl', target_sets: 3, target_reps: 12, target_weight: 15, target_rest_sec: 60 },
  { exercise_id: 'tricep_ext', target_sets: 3, target_reps: 15, target_weight: 25, target_rest_sec: 60 },
];

export const MOCK_LOGS: WorkoutLog[] = [
  {
    id: 'w-1',
    user_id: 'u-123',
    name: 'Тяжелая Грудь + Трицепс',
    start_time: new Date(Date.now() - 86400000 * 1).toISOString(), // Yesterday
    duration_sec: 3600,
    sync_status: 'synced',
    status: 'finished',
    feeling_rpe: 8,
  },
  {
    id: 'w-2',
    user_id: 'u-123',
    name: 'Ноги и Плечи',
    start_time: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    duration_sec: 4200,
    sync_status: 'synced',
    status: 'finished',
    feeling_rpe: 7,
  },
  {
    id: 'w-3',
    user_id: 'u-123',
    name: 'Спина и Бицепс',
    start_time: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    duration_sec: 2800,
    sync_status: 'synced',
    status: 'finished',
    feeling_rpe: 9,
  },
];

// Mock sets for history viewer
export const MOCK_HISTORY_SETS: WorkoutSet[] = [
    // Sets for w-1 (Yesterday)
    { id: 's1-1', workout_log_id: 'w-1', exercise_id: 'bp_bb', set_order: 1, weight_kg: 80, reps: 10, type: 'normal', estimated_1rm: 106 },
    { id: 's1-2', workout_log_id: 'w-1', exercise_id: 'bp_bb', set_order: 2, weight_kg: 80, reps: 9, type: 'normal', estimated_1rm: 104 },
    { id: 's1-3', workout_log_id: 'w-1', exercise_id: 'sq_bb', set_order: 1, weight_kg: 100, reps: 8, type: 'normal', estimated_1rm: 126 },
    
    // Sets for w-2
    { id: 's2-1', workout_log_id: 'w-2', exercise_id: 'dl_bb', set_order: 1, weight_kg: 120, reps: 5, type: 'normal', estimated_1rm: 140 },
    { id: 's2-2', workout_log_id: 'w-2', exercise_id: 'pullup', set_order: 1, weight_kg: 0, reps: 15, type: 'normal', estimated_1rm: 0 },
];