// Exercise types define which fields a set records
export const EXERCISE_TYPES = {
  weight: { key: 'weight', label: 'Ağırlık + Tekrar', fields: ['weight', 'reps'] },
  reps: { key: 'reps', label: 'Sadece Tekrar', fields: ['reps'] },
  time: { key: 'time', label: 'Süre', fields: ['time'] },
  distance: { key: 'distance', label: 'Mesafe + Süre', fields: ['distance', 'time'] },
};

export const TYPE_KEYS = Object.keys(EXERCISE_TYPES);

export const FIELD_META = {
  weight: { label: 'Ağırlık', unit: 'kg', keyboard: 'decimal-pad' },
  reps: { label: 'Tekrar', unit: 'tkr', keyboard: 'number-pad' },
  time: { label: 'Süre', unit: 'sn', keyboard: 'number-pad' },
  distance: { label: 'Mesafe', unit: 'km', keyboard: 'decimal-pad' },
};

export const CATEGORIES = ['Göğüs', 'Sırt', 'Bacak', 'Omuz', 'Kol', 'Karın', 'Kardiyo', 'Tüm Vücut', 'Esneme', 'Diğer'];

const ex = (id, name, category, type) => ({ id, name, category, type, notes: '', builtIn: true });

const DEFAULT_EXERCISES = [
  ex('bench_press', 'Bench Press', 'Göğüs', 'weight'),
  ex('incline_db_press', 'Eğimli Dumbbell Press', 'Göğüs', 'weight'),
  ex('db_fly', 'Dumbbell Fly', 'Göğüs', 'weight'),
  ex('push_up', 'Şınav', 'Göğüs', 'reps'),

  ex('pull_up', 'Barfiks', 'Sırt', 'reps'),
  ex('lat_pulldown', 'Lat Pulldown', 'Sırt', 'weight'),
  ex('barbell_row', 'Barbell Row', 'Sırt', 'weight'),
  ex('seated_row', 'Oturarak Kablo Row', 'Sırt', 'weight'),
  ex('deadlift', 'Deadlift', 'Sırt', 'weight'),

  ex('squat', 'Squat', 'Bacak', 'weight'),
  ex('leg_press', 'Leg Press', 'Bacak', 'weight'),
  ex('lunge', 'Lunge', 'Bacak', 'weight'),
  ex('rdl', 'Romanian Deadlift', 'Bacak', 'weight'),
  ex('leg_curl', 'Leg Curl', 'Bacak', 'weight'),
  ex('calf_raise', 'Calf Raise', 'Bacak', 'weight'),
  ex('bw_squat', 'Vücut Ağırlığı Squat', 'Bacak', 'reps'),

  ex('ohp', 'Overhead Press', 'Omuz', 'weight'),
  ex('lateral_raise', 'Yana Açış (Lateral Raise)', 'Omuz', 'weight'),
  ex('face_pull', 'Face Pull', 'Omuz', 'weight'),

  ex('biceps_curl', 'Biceps Curl', 'Kol', 'weight'),
  ex('hammer_curl', 'Hammer Curl', 'Kol', 'weight'),
  ex('triceps_pushdown', 'Triceps Pushdown', 'Kol', 'weight'),
  ex('dips', 'Dips', 'Kol', 'reps'),

  ex('plank', 'Plank', 'Karın', 'time'),
  ex('crunch', 'Mekik', 'Karın', 'reps'),
  ex('leg_raise', 'Bacak Kaldırma', 'Karın', 'reps'),
  ex('russian_twist', 'Russian Twist', 'Karın', 'reps'),

  ex('run', 'Koşu', 'Kardiyo', 'distance'),
  ex('walk', 'Tempolu Yürüyüş', 'Kardiyo', 'distance'),
  ex('cycling', 'Bisiklet', 'Kardiyo', 'distance'),
  ex('rowing', 'Kürek Makinesi', 'Kardiyo', 'distance'),
  ex('jump_rope', 'İp Atlama', 'Kardiyo', 'time'),

  ex('burpee', 'Burpee', 'Tüm Vücut', 'reps'),
  ex('kb_swing', 'Kettlebell Swing', 'Tüm Vücut', 'weight'),
  ex('mountain_climber', 'Mountain Climber', 'Tüm Vücut', 'time'),

  ex('stretch', 'Esneme Rutini', 'Esneme', 'time'),
];

export default DEFAULT_EXERCISES;
