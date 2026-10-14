// Starter workouts so the app is useful right after onboarding. Users can edit or delete them.
const sets = (count, values) => Array.from({ length: count }, () => ({ ...values }));

const item = (id, exerciseId, count, values, restSeconds = 90) => ({
  id,
  exerciseId,
  restSeconds,
  note: '',
  sets: sets(count, values),
});

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl_full_a',
    name: 'Tüm Vücut A',
    color: '#FFC414',
    notes: 'Haftada 2–3 kez yapılabilecek temel antrenman.',
    exercises: [
      item('fa1', 'squat', 3, { weight: 40, reps: 10 }, 120),
      item('fa2', 'bench_press', 3, { weight: 30, reps: 10 }, 120),
      item('fa3', 'barbell_row', 3, { weight: 30, reps: 10 }),
      item('fa4', 'plank', 3, { time: 45 }, 60),
    ],
  },
  {
    id: 'tpl_upper',
    name: 'Üst Vücut',
    color: '#5CC8FF',
    notes: '',
    exercises: [
      item('up1', 'ohp', 3, { weight: 20, reps: 10 }),
      item('up2', 'lat_pulldown', 3, { weight: 35, reps: 12 }),
      item('up3', 'push_up', 3, { reps: 15 }, 60),
      item('up4', 'biceps_curl', 3, { weight: 8, reps: 12 }, 60),
      item('up5', 'triceps_pushdown', 3, { weight: 15, reps: 12 }, 60),
    ],
  },
  {
    id: 'tpl_cardio',
    name: 'Kardiyo & Karın',
    color: '#FF8A3D',
    notes: 'Hafif tempo, nabız kontrolü.',
    exercises: [
      item('ca1', 'run', 1, { distance: 3, time: 1200 }, 60),
      item('ca2', 'crunch', 3, { reps: 20 }, 45),
      item('ca3', 'leg_raise', 3, { reps: 12 }, 45),
      item('ca4', 'jump_rope', 3, { time: 60 }, 45),
    ],
  },
];

export default DEFAULT_TEMPLATES;
