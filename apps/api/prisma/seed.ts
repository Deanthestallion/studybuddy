import '../src/config/loadEnv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@studybuddy.app';
const DEMO_PASSWORD = 'Password123!';

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: 'Demo Student', passwordHash, xp: 1250, level: 3, streak: 4 },
  });

  // Clean prior demo data so the seed is idempotent.
  await prisma.$transaction([
    prisma.studySession.deleteMany({ where: { userId: user.id } }),
    prisma.quizAttempt.deleteMany({ where: { userId: user.id } }),
    prisma.quiz.deleteMany({ where: { userId: user.id } }),
    prisma.flashcardDeck.deleteMany({ where: { userId: user.id } }),
    prisma.note.deleteMany({ where: { userId: user.id } }),
    prisma.assignment.deleteMany({ where: { userId: user.id } }),
    prisma.subject.deleteMany({ where: { userId: user.id } }),
  ]);

  const subjectsData = [
    { name: 'Mathematics', color: '#3b82f6', goals: 5, completed: 3 },
    { name: 'Biology', color: '#10b981', goals: 8, completed: 6 },
    { name: 'Computer Science', color: '#8b5cf6', goals: 10, completed: 4 },
    { name: 'World History', color: '#f59e0b', goals: 4, completed: 1 },
  ];
  const subjects: Array<Awaited<ReturnType<typeof prisma.subject.create>>> = [];
  for (const s of subjectsData) {
    subjects.push(await prisma.subject.create({ data: { ...s, userId: user.id } }));
  }
  const byName = (n: string) => subjects.find((s) => s.name === n)!;

  await prisma.assignment.createMany({
    data: [
      { userId: user.id, subjectId: byName('Mathematics').id, title: 'Calculus Assignment 4', priority: 'HIGH', dueDate: new Date('2026-07-05') },
      { userId: user.id, subjectId: byName('Biology').id, title: 'Biology Lab Report', priority: 'MEDIUM', dueDate: new Date('2026-07-08'), completed: true, completedAt: new Date() },
      { userId: user.id, subjectId: byName('Computer Science').id, title: 'Algorithm Python Script', priority: 'HIGH', dueDate: new Date('2026-07-02') },
      { userId: user.id, subjectId: byName('World History').id, title: 'French Revolution Essay', priority: 'LOW', dueDate: new Date('2026-07-15') },
    ],
  });

  await prisma.note.createMany({
    data: [
      {
        userId: user.id,
        subjectId: byName('Biology').id,
        title: 'Mitosis Lecture Notes',
        folder: 'Biology',
        content:
          'Mitosis is a process of cell duplication.\n\nStages:\n1. Prophase\n2. Metaphase\n3. Anaphase\n4. Telophase',
      },
      {
        userId: user.id,
        subjectId: byName('Mathematics').id,
        title: 'Calculus Derivatives Sheet',
        folder: 'Mathematics',
        content: 'd/dx(x^n) = n*x^(n-1)\nd/dx(sin x) = cos x\nd/dx(e^x) = e^x',
      },
    ],
  });

  await prisma.flashcardDeck.create({
    data: {
      userId: user.id,
      subjectId: byName('Biology').id,
      title: 'Cellular Biology Basics',
      cards: {
        create: [
          { userId: user.id, front: 'Powerhouse of the cell?', back: 'Mitochondria.' },
          { userId: user.id, front: 'What is transcription?', back: 'Making an RNA copy of a DNA gene sequence.' },
          { userId: user.id, front: 'Function of ribosomes?', back: 'Site of protein synthesis (translation).' },
        ],
      },
    },
  });

  await prisma.quiz.create({
    data: {
      userId: user.id,
      subjectId: byName('Computer Science').id,
      title: 'Data Structures Quick Quiz',
      timeLimitSec: 120,
      questions: {
        create: [
          { order: 0, prompt: 'A Queue is…', options: JSON.stringify(['LIFO', 'FIFO', 'Random', 'Sorted']), correctIndex: 1 },
          { order: 1, prompt: 'Average hash map lookup?', options: JSON.stringify(['O(n)', 'O(log n)', 'O(1)', 'O(n^2)']), correctIndex: 2 },
        ],
      },
    },
  });

  // A week of study sessions to populate analytics.
  const today = new Date();
  const sessions = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    sessions.push({
      userId: user.id,
      subjectId: subjects[i % subjects.length]!.id,
      durationSec: (20 + (i % 4) * 10) * 60,
      startedAt: day,
    });
  }
  await prisma.studySession.createMany({ data: sessions });

  // eslint-disable-next-line no-console
  console.log(`✅ Seeded demo account → ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
