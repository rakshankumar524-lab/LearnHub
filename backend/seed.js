const crypto = require("node:crypto");
const { promisify } = require("node:util");
const User = require("./models/user");
const Course = require("./models/Course");
const Lesson = require("./models/Lesson");
const Enrollment = require("./models/Enrollment");
const CourseProgress = require("./models/CourseProgress");

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

const sampleCourses = [
  {
    title: "React for Beginners",
    instructor: "Maya Chen",
    category: "Web Development",
    duration: "4 weeks",
    description: "Learn the essentials of modern React, including components, state, props, and building reusable interfaces.",
    price: 49,
  },
  {
    title: "Python for Data Analysis",
    instructor: "Aarav Patel",
    category: "Data Science",
    duration: "6 weeks",
    description: "Explore Python workflows for cleaning, analyzing, and visualizing real-world data with practical projects.",
    price: 59,
  },
  {
    title: "UI/UX Design Fundamentals",
    instructor: "Priya Shah",
    category: "Design",
    duration: "3 weeks",
    description: "Understand the design process, wireframing, accessibility, and how to create user-centered products.",
    price: 39,
  },
  {
    title: "Digital Marketing Essentials",
    instructor: "Noah Garcia",
    category: "Marketing",
    duration: "5 weeks",
    description: "Build a practical marketing toolkit covering SEO, content strategy, campaigns, and performance tracking.",
    price: 45,
  },
  {
    title: "JavaScript Advanced Patterns",
    instructor: "Liam Brooks",
    category: "Web Development",
    duration: "5 weeks",
    description: "Deepen your JavaScript knowledge with closures, async patterns, modules, and scalable front-end architecture.",
    price: 69,
  },
  {
    title: "Excel for Business Analytics",
    instructor: "Sophia Nguyen",
    category: "Business",
    duration: "4 weeks",
    description: "Master spreadsheets for reporting, forecasting, dashboards, and data-driven business decision making.",
    price: 42,
  },
  {
    title: "Project Management Basics",
    instructor: "Benjamin Wilson",
    category: "Business",
    duration: "3 weeks",
    description: "Learn planning, prioritization, timelines, stakeholder communication, and practical project coordination.",
    price: 36,
  },
  {
    title: "Photography Masterclass",
    instructor: "Emma Lopez",
    category: "Creative",
    duration: "6 weeks",
    description: "Build camera confidence, composition skills, and post-processing workflows to tell stronger visual stories.",
    price: 55,
  },
];

const sampleLessonsByCourse = {
  "React for Beginners": [
    { title: "Intro to Components", description: "Understand what components are and how React apps are structured." },
    { title: "State and Props", description: "Learn how data flows through components and updates the UI." },
    { title: "Building a Small App", description: "Create a small app to apply the concepts in a real project." },
  ],
  "Python for Data Analysis": [
    { title: "Setting up Python", description: "Install tools and configure a clean data workflow." },
    { title: "Pandas Basics", description: "Manipulate tabular data and transform datasets efficiently." },
    { title: "Visualizing Insights", description: "Use charts to communicate trends and findings clearly." },
  ],
  "UI/UX Design Fundamentals": [
    { title: "Design Thinking", description: "Structure the problem and discover user needs before design work begins." },
    { title: "Wireframes and Flows", description: "Translate ideas into simple interaction flows and layouts." },
    { title: "Accessibility Basics", description: "Improve clarity, readability, and usability for all learners." },
  ],
  "Digital Marketing Essentials": [
    { title: "Marketing Foundations", description: "Review channels, strategy, and how brands plan digital campaigns." },
    { title: "Content Strategy", description: "Map content themes to customer journeys and campaign objectives." },
    { title: "Tracking Performance", description: "Measure impact with analytics and optimization practices." },
  ],
  "JavaScript Advanced Patterns": [
    { title: "Closures and Scope", description: "Understand how functions retain access to variables in complex applications." },
    { title: "Async Patterns", description: "Master promises, async/await, and error handling strategies." },
    { title: "Modular Architecture", description: "Break large apps into maintainable modules and scalable patterns." },
  ],
  "Excel for Business Analytics": [
    { title: "Data Cleaning", description: "Clean spreadsheets and prepare business data for meaningful analysis." },
    { title: "Formulas and Lookups", description: "Use formulas and lookup functions for smarter business reporting." },
    { title: "Dashboards", description: "Create dashboard views that highlight KPIs and trends at a glance." },
  ],
  "Project Management Basics": [
    { title: "Scoping Work", description: "Define work, stakeholder needs, and a realistic delivery plan." },
    { title: "Scheduling and Risks", description: "Build timelines and identify issues before they affect delivery." },
    { title: "Communication", description: "Keep teams aligned through clear communication and progress updates." },
  ],
  "Photography Masterclass": [
    { title: "Camera Basics", description: "Learn how exposure, aperture, and shutter speed shape your images." },
    { title: "Composition Techniques", description: "Frame better photos with balance, lines, and visual hierarchy." },
    { title: "Editing Workflow", description: "Polish results with a consistent color and tone editing process." },
  ],
};

async function ensureUser({ name, email, password, role }) {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return existingUser;
  }

  const user = new User({
    name,
    email: email.toLowerCase(),
    password: await hashPassword(password),
    role,
  });

  await user.save();
  return user;
}

async function ensureCourses() {
  for (const course of sampleCourses) {
    const existing = await Course.findOne({ title: course.title });
    if (existing) {
      continue;
    }

    const created = new Course(course);
    await created.save();
  }
}

async function ensureLessons() {
  for (const [courseName, lessons] of Object.entries(sampleLessonsByCourse)) {
    const existingLessons = await Lesson.find({ courseName });
    if (existingLessons.length >= lessons.length) {
      continue;
    }

    for (const lesson of lessons) {
      const alreadyExists = await Lesson.findOne({ courseName, title: lesson.title });
      if (!alreadyExists) {
        await new Lesson({
          courseName,
          title: lesson.title,
          description: lesson.description,
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        }).save();
      }
    }
  }
}

async function ensureDemoEnrollments() {
  const student = await ensureUser({
    name: "Demo Student",
    email: "student@learnhub.com",
    password: "student123",
    role: "student",
  });

  const admin = await ensureUser({
    name: "LearnHub Admin",
    email: "admin@learnhub.com",
    password: "admin123",
    role: "admin",
  });

  const courses = await Course.find({ title: { $in: Object.keys(sampleLessonsByCourse) } }).lean();
  for (const course of courses) {
    const existingEnrollment = await Enrollment.findOne({ email: student.email, courseName: course.title });
    if (!existingEnrollment) {
      await new Enrollment({
        studentName: student.name,
        email: student.email,
        courseName: course.title,
        enrolledDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
      }).save();
    }
  }

  await Promise.all([
    admin,
    student,
  ]);
}

async function ensureDemoProgress() {
  const studentEmail = "student@learnhub.com";
  const courseNames = ["React for Beginners", "Python for Data Analysis"];

  for (const courseName of courseNames) {
    const course = await Course.findOne({ title: courseName });
    if (!course) continue;

    const lessons = await Lesson.find({ courseName }).select("_id").lean();
    if (!lessons.length) continue;

    const completedLessons = lessons.map((lesson) => lesson._id);
    const existingProgress = await CourseProgress.findOne({ studentEmail, courseName });

    if (!existingProgress) {
      await new CourseProgress({
        studentEmail,
        courseName,
        completedLessons,
        completedAt: new Date(),
      }).save();
    }
  }
}

async function seedDatabase() {
  await ensureCourses();
  await ensureLessons();
  await ensureDemoEnrollments();
  await ensureDemoProgress();
  console.log("Sample LearnHub data initialized.");
}

module.exports = { seedDatabase };

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
