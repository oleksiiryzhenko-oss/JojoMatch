// Exercise types define which fields a set records
export const EXERCISE_TYPES = {
  weight: { key: 'weight', label: 'Peso + Repetições', fields: ['weight', 'reps'] },
  reps: { key: 'reps', label: 'Apenas Repetições', fields: ['reps'] },
  time: { key: 'time', label: 'Tempo', fields: ['time'] },
  distance: { key: 'distance', label: 'Distância + Tempo', fields: ['distance', 'time'] },
};

export const TYPE_KEYS = Object.keys(EXERCISE_TYPES);

export const FIELD_META = {
  weight: { label: 'Peso', unit: 'kg', keyboard: 'decimal-pad' },
  reps: { label: 'Repetições', unit: 'rep', keyboard: 'number-pad' },
  time: { label: 'Tempo', unit: 's', keyboard: 'number-pad' },
  distance: { label: 'Distância', unit: 'km', keyboard: 'decimal-pad' },
};

export const CATEGORIES = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen', 'Cardio', 'Corpo Todo', 'Alongamento', 'Outros'];

const ex = (id, name, category, type) => ({ id, name, category, type, notes: '', builtIn: true });

const DEFAULT_EXERCISES = [
  ex('bench_press', 'Supino Reto', 'Peito', 'weight'),
  ex('incline_db_press', 'Supino Inclinado com Halteres', 'Peito', 'weight'),
  ex('db_fly', 'Crucifixo com Halteres', 'Peito', 'weight'),
  ex('push_up', 'Flexão', 'Peito', 'reps'),

  ex('pull_up', 'Barra Fixa', 'Costas', 'reps'),
  ex('lat_pulldown', 'Pulley Frontal', 'Costas', 'weight'),
  ex('barbell_row', 'Remada com Barra', 'Costas', 'weight'),
  ex('seated_row', 'Remada Sentada', 'Costas', 'weight'),
  ex('deadlift', 'Levantamento Terra', 'Costas', 'weight'),

  ex('squat', 'Agachamento', 'Pernas', 'weight'),
  ex('leg_press', 'Leg Press', 'Pernas', 'weight'),
  ex('lunge', 'Avanço', 'Pernas', 'weight'),
  ex('rdl', 'Stiff', 'Pernas', 'weight'),
  ex('leg_curl', 'Mesa Flexora', 'Pernas', 'weight'),
  ex('calf_raise', 'Panturrilha', 'Pernas', 'weight'),
  ex('bw_squat', 'Agachamento Livre', 'Pernas', 'reps'),

  ex('ohp', 'Desenvolvimento', 'Ombros', 'weight'),
  ex('lateral_raise', 'Elevação Lateral', 'Ombros', 'weight'),
  ex('face_pull', 'Face Pull', 'Ombros', 'weight'),

  ex('biceps_curl', 'Rosca Bíceps', 'Braços', 'weight'),
  ex('hammer_curl', 'Rosca Martelo', 'Braços', 'weight'),
  ex('triceps_pushdown', 'Tríceps Pulley', 'Braços', 'weight'),
  ex('dips', 'Mergulho', 'Braços', 'reps'),

  ex('plank', 'Prancha', 'Abdômen', 'time'),
  ex('crunch', 'Abdominal', 'Abdômen', 'reps'),
  ex('leg_raise', 'Elevação de Pernas', 'Abdômen', 'reps'),
  ex('russian_twist', 'Rotação Russa', 'Abdômen', 'reps'),

  ex('run', 'Corrida', 'Cardio', 'distance'),
  ex('walk', 'Caminhada', 'Cardio', 'distance'),
  ex('cycling', 'Ciclismo', 'Cardio', 'distance'),
  ex('rowing', 'Remo Ergométrico', 'Cardio', 'distance'),
  ex('jump_rope', 'Pular Corda', 'Cardio', 'time'),

  ex('burpee', 'Burpee', 'Corpo Todo', 'reps'),
  ex('kb_swing', 'Kettlebell Swing', 'Corpo Todo', 'weight'),
  ex('mountain_climber', 'Mountain Climber', 'Corpo Todo', 'time'),

  ex('stretch', 'Alongamento', 'Alongamento', 'time'),
];

export default DEFAULT_EXERCISES;
