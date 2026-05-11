import { PrismaClient, UserRole, UserStatus, TenantStatus, CourseStatus, LessonType, QuestionType, EnrollmentType } from '@prisma/client';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

async function hashPassword(password: string): Promise<string> {
  const peppered = password + (process.env.ARGON2_PEPPER ?? 'cyberapex-dev-pepper-2026');
  return argon2.hash(peppered, ARGON2_OPTIONS);
}

async function main() {
  console.log('🌱 Seeding database...');

  // Set RLS context for seed script to bypass policies
  await prisma.$executeRaw`SELECT set_config('app.current_role', 'super_admin', false)`;
  await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', '00000000-0000-0000-0000-000000000000', false)`;

  // 1. Super Admin
  const adminPassword = await hashPassword('Admin1234!');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@sa-lms.dev' },
    update: {
      passwordHash: adminPassword,
    },
    create: {
      email:           'admin@sa-lms.dev',
      passwordHash:    adminPassword,
      firstName:       'Super',
      lastName:        'Admin',
      role:            UserRole.super_admin,
      status:          UserStatus.active,
      emailVerified:   true,
    },
  });
  console.log('✅ Created Super Admin');

  // 2. Compliance Frameworks
  const frameworks = [
    { name: 'CRF (Cybersecurity Resilience Framework)', code: 'CRF', version: '1.0' },
    { name: 'ISO 27001', code: 'ISO27001', version: '2022' },
    { name: 'NESA (National Electronic Security Authority)', code: 'NESA', version: '2.0' },
    { name: 'SAMA (Saudi Arabian Monetary Authority)', code: 'SAMA', version: '1.0' },
  ];

  for (const fw of frameworks) {
    await prisma.complianceFramework.upsert({
      where: { code: fw.code },
      update: {},
      create: {
        name:     fw.name,
        code:     fw.code,
        version:  fw.version,
        isActive: true,
      },
    });
  }
  console.log('✅ Created Compliance Frameworks');

  // 3. Certificate Template
  const defaultTemplate = await prisma.certificateTemplate.findFirst({ where: { isDefault: true } }) 
    || await prisma.certificateTemplate.create({
    data: {
      name: 'Default Modern Template',
      isDefault: true,
      htmlTemplate: `
        <div style="width: 100%; height: 100%; padding: 40px; border: 10px solid #0891b2; box-sizing: border-box; font-family: sans-serif; background: #f8fafc; text-align: center;">
          <div style="margin-top: 50px;">
            <img src="{{logo_url}}" style="max-height: 80px; margin-bottom: 20px;" alt="{{org_name}}">
            <h1 style="color: #0f172a; font-size: 50px; margin-bottom: 10px;">CERTIFICATE</h1>
            <h2 style="color: #64748b; font-size: 24px; letter-spacing: 5px; margin-bottom: 50px;">OF COMPLETION</h2>
          </div>
          <div style="margin-bottom: 50px;">
            <p style="color: #64748b; font-size: 18px;">This is to certify that</p>
            <h3 style="color: #0891b2; font-size: 36px; margin: 20px 0;">{{student_name}}</h3>
            <p style="color: #64748b; font-size: 18px;">has successfully completed the course</p>
            <h4 style="color: #0f172a; font-size: 28px; margin: 15px 0;">{{course_title}}</h4>
          </div>
          <div style="margin-top: 80px; display: flex; justify-content: space-around; text-align: left;">
            <div>
              <p style="color: #64748b; margin-bottom: 5px;">Score: <strong style="color: #0f172a;">{{score}}%</strong></p>
              <p style="color: #64748b; margin-bottom: 5px;">Issue Date: <strong style="color: #0f172a;">{{issue_date}}</strong></p>
            </div>
            <div style="text-align: right;">
              <p style="color: #64748b; margin-bottom: 5px;">Certificate No: <strong style="color: #0f172a;">{{cert_number}}</strong></p>
              <p style="color: #64748b; margin-bottom: 5px;">Verify at: <a href="{{verify_url}}" style="color: #0891b2;">{{verify_url}}</a></p>
            </div>
          </div>
        </div>
      `,
    },
  });
  console.log('✅ Created Default Certificate Template');

  // 4. Sample Tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-corp' },
    update: {},
    create: {
      name:             'Demo Corp',
      slug:             'demo-corp',
      status:           TenantStatus.active,
      subscriptionPlan: 'professional',
    },
  });
  console.log('✅ Created Demo Tenant');

  // 5. Sample Courses
  const courseData = [
    { title: 'Cybersecurity Fundamentals', slug: 'cyber-fundamentals', description: 'Basic security principles for all employees.' },
    { title: 'Phishing Awareness', slug: 'phishing-awareness', description: 'Learn how to spot and report phishing emails.' },
    { title: 'Data Protection & GDPR', slug: 'data-protection', description: 'Understanding personal data handling and privacy laws.' },
  ];

  for (const c of courseData) {
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        title:                 c.title,
        slug:                  c.slug,
        description:           c.description,
        status:                CourseStatus.published,
        passingScore:          80,
        createdBy:             superAdmin.id,
        certificateTemplateId: defaultTemplate.id,
      },
    });

    // Add a Module (using upsert or checking existence to avoid duplicates on re-seed)
    const existingModule = await prisma.module.findFirst({ where: { courseId: course.id, orderIndex: 1 } });
    const module = existingModule || await prisma.module.create({
      data: {
        courseId:   course.id,
        title:      'Introduction to ' + c.title,
        orderIndex: 1,
      },
    });

    // Add a Video Lesson
    const existingVideo = await prisma.lesson.findFirst({ where: { moduleId: module.id, orderIndex: 1 } });
    if (!existingVideo) {
      await prisma.lesson.create({
        data: {
          moduleId:      module.id,
          title:         'Introduction Video',
          type:          LessonType.video,
          orderIndex:    1,
          videoUrl:      'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          videoDuration: 120,
        },
      });
    }

    // Add a Quiz Lesson
    const existingQuizLesson = await prisma.lesson.findFirst({ where: { moduleId: module.id, orderIndex: 2 } });
    if (!existingQuizLesson) {
      const quizLesson = await prisma.lesson.create({
        data: {
          moduleId:   module.id,
          title:      'Final Assessment',
          type:       LessonType.assessment,
          orderIndex: 2,
        },
      });

      const quiz = await prisma.quiz.create({
        data: {
          lessonId:     quizLesson.id,
          title:        c.title + ' Quiz',
          passingScore: 80,
        },
      });

      const question = await prisma.quizQuestion.create({
        data: {
          quizId:     quiz.id,
          text:       'Is cybersecurity important?',
          type:       QuestionType.true_false,
          orderIndex: 1,
        },
      });

      await prisma.quizAnswer.createMany({
        data: [
          { questionId: question.id, text: 'Yes', isCorrect: true,  orderIndex: 1 },
          { questionId: question.id, text: 'No',  isCorrect: false, orderIndex: 2 },
        ],
      });
    }
  }
  console.log('✅ Created Sample Courses with Lessons and Quizzes');

  // 6. Sample Students, Tenant Admin and Employee
  const studentPassword = await hashPassword('Student1234!');
  const tenantAdminPassword = await hashPassword('TenantAdmin1234!');
  const employeePassword = await hashPassword('Employee1234!');

  // Create Tenant Admin
  await prisma.user.upsert({
    where: { email: 'tenantadmin@democorp.com' },
    update: { passwordHash: tenantAdminPassword },
    create: {
      email:           'tenantadmin@democorp.com',
      passwordHash:    tenantAdminPassword,
      firstName:       'Tenant',
      lastName:        'Admin',
      role:            UserRole.tenant_admin,
      status:          UserStatus.active,
      tenantId:        demoTenant.id,
    },
  });

  // Create Employee
  await prisma.user.upsert({
    where: { email: 'employee@democorp.com' },
    update: { passwordHash: employeePassword },
    create: {
      email:           'employee@democorp.com',
      passwordHash:    employeePassword,
      firstName:       'Generic',
      lastName:        'Employee',
      role:            UserRole.student,
      status:          UserStatus.active,
      tenantId:        demoTenant.id,
    },
  });

  for (let i = 1; i <= 5; i++) {
    const email = `student${i}@democorp.com`;
    await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: studentPassword,
      },
      create: {
        email:           email,
        passwordHash:    studentPassword,
        firstName:       'Student',
        lastName:        String(i),
        role:            UserRole.student,
        status:          UserStatus.active,
        tenantId:        demoTenant.id,
      },
    });
  }
  console.log('✅ Created 5 Sample Students, 1 Tenant Admin, 1 Employee for Demo Corp');

  console.log('🏁 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
