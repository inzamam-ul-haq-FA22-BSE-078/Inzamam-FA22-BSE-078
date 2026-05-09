const mongoose = require('mongoose');
const Category = require('./models/Category');
const Subcategory = require('./models/Subcategory');
const Tag = require('./models/Tag');
require('dotenv').config();

const categoriesData = [
  {
    name: 'Development & Tech',
    subcategories: [
      {
        name: 'Frontend Development',
        tags: ['React.js', 'Next.js', 'JavaScript', 'TypeScript', 'Vue.js', 'Angular', 'HTML', 'CSS', 'SASS', 'Tailwind CSS'],
      },
      {
        name: 'Backend Development',
        tags: ['Node.js', 'Express.js', 'Python', 'Django', 'Flask', 'PHP', 'Laravel', 'Java', 'Spring Boot', 'C#', '.NET'],
      },
      {
        name: 'Full Stack Development',
        tags: ['MERN Stack', 'MEAN Stack', 'Ruby on Rails', 'Django', 'Laravel', 'ASP.NET'],
      },
      {
        name: 'Mobile App Development',
        tags: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Ionic', 'Xamarin', 'Cordova'],
      },
      {
        name: 'Database Management',
        tags: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'SQLite', 'Oracle'],
      },
      {
        name: 'DevOps & Cloud',
        tags: ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'Terraform'],
      },
    ],
  },
  {
    name: 'Design & Creative',
    subcategories: [
      {
        name: 'UI/UX Design',
        tags: ['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Prototyping', 'Wireframing', 'User Research', 'Usability Testing'],
      },
      {
        name: 'Graphic Design',
        tags: ['Photoshop', 'Illustrator', 'InDesign', 'Canva', 'Branding', 'Logo Design', 'Print Design'],
      },
      {
        name: 'Web Design',
        tags: ['HTML', 'CSS', 'JavaScript', 'WordPress', 'Squarespace', 'Webflow', 'Responsive Design'],
      },
      {
        name: 'Motion Graphics',
        tags: ['After Effects', 'Premiere Pro', 'Cinema 4D', 'Blender', 'Motion Design', 'Animation'],
      },
    ],
  },
  {
    name: 'Teaching & Mentorship',
    subcategories: [
      {
        name: 'Programming Tutoring',
        tags: ['JavaScript', 'Python', 'Java', 'C++', 'Web Development', 'Data Structures', 'Algorithms'],
      },
      {
        name: 'Design Mentorship',
        tags: ['UI/UX Design', 'Graphic Design', 'Branding', 'Portfolio Review', 'Career Guidance'],
      },
      {
        name: 'Language Teaching',
        tags: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'ESL', 'Business English'],
      },
      {
        name: 'Academic Tutoring',
        tags: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Literature', 'Test Prep'],
      },
    ],
  },
  {
    name: 'Content & Digital Marketing',
    subcategories: [
      {
        name: 'SEO Optimization',
        tags: ['On-Page SEO', 'Off-Page SEO', 'Keyword Research', 'Technical SEO', 'Local SEO'],
      },
      {
        name: 'Social Media Marketing',
        tags: ['Facebook Marketing', 'Instagram Marketing', 'Twitter Marketing', 'LinkedIn Marketing', 'TikTok Marketing'],
      },
      {
        name: 'Content Writing',
        tags: ['Blog Writing', 'Copywriting', 'Technical Writing', 'Creative Writing', 'SEO Content'],
      },
      {
        name: 'Email Marketing',
        tags: ['Mailchimp', 'Sendinblue', 'Klaviyo', 'Email Campaigns', 'Newsletter Design'],
      },
    ],
  },
  {
    name: 'Video & Animation',
    subcategories: [
      {
        name: 'Video Editing',
        tags: ['Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve', 'After Effects', 'Video Production'],
      },
      {
        name: '2D Animation',
        tags: ['Toon Boom', 'TVPaint', 'Adobe Animate', '2D Animation', 'Character Animation'],
      },
      {
        name: '3D Animation',
        tags: ['Maya', '3ds Max', 'Blender', 'Cinema 4D', 'Houdini', 'ZBrush'],
      },
      {
        name: 'Motion Graphics',
        tags: ['After Effects', 'Cinema 4D', 'Motion Design', 'Visual Effects', 'Title Design'],
      },
    ],
  },
  {
    name: 'AI & Automation',
    subcategories: [
      {
        name: 'AI Prompt Engineering',
        tags: ['ChatGPT', 'GPT-4', 'DALL-E', 'Midjourney', 'Stable Diffusion', 'AI Art'],
      },
      {
        name: 'Automation Scripts',
        tags: ['Python Automation', 'JavaScript Automation', 'Zapier', 'Make.com', 'IFTTT'],
      },
      {
        name: 'Chatbot Development',
        tags: ['Dialogflow', 'Rasa', 'Microsoft Bot Framework', 'Chatbot Design', 'NLP'],
      },
      {
        name: 'Machine Learning',
        tags: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Data Science', 'Deep Learning'],
      },
    ],
  },
  {
    name: 'Business & Freelancing Skills',
    subcategories: [
      {
        name: 'Project Management',
        tags: ['Agile', 'Scrum', 'Kanban', 'Jira', 'Trello', 'Asana', 'Project Planning'],
      },
      {
        name: 'Business Strategy',
        tags: ['Business Planning', 'Market Research', 'Competitive Analysis', 'SWOT Analysis'],
      },
      {
        name: 'Freelancing',
        tags: ['Client Acquisition', 'Proposal Writing', 'Contract Negotiation', 'Time Management', 'Pricing Strategy'],
      },
      {
        name: 'Consulting',
        tags: ['Business Consulting', 'Strategy Consulting', 'Management Consulting', 'Industry Expertise'],
      },
    ],
  },
  {
    name: 'Art & Illustration',
    subcategories: [
      {
        name: 'Digital Art',
        tags: ['Digital Painting', 'Concept Art', 'Digital Illustration', 'Procreate', 'Photoshop Art'],
      },
      {
        name: 'Traditional Art',
        tags: ['Oil Painting', 'Watercolor', 'Acrylic Painting', 'Drawing', 'Sketching'],
      },
      {
        name: 'Character Design',
        tags: ['Character Design', 'Anatomy', 'Costume Design', 'Creature Design', 'Style Development'],
      },
      {
        name: 'NFT Art',
        tags: ['NFT Creation', 'Crypto Art', 'Digital Collectibles', 'Blockchain Art', 'Generative Art'],
      },
    ],
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillbridge');

    console.log('Connected to MongoDB');

    // Clear existing data
    await Tag.deleteMany({});
    await Subcategory.deleteMany({});
    await Category.deleteMany({});

    console.log('Cleared existing data');

    for (const catData of categoriesData) {
      const category = new Category({
        name: catData.name,
        description: `${catData.name} skills and services`,
      });
      await category.save();

      console.log(`Created category: ${category.name}`);

      for (const subData of catData.subcategories) {
        const subcategory = new Subcategory({
          name: subData.name,
          category: category._id,
          description: `${subData.name} within ${category.name}`,
        });
        await subcategory.save();

        console.log(`Created subcategory: ${subcategory.name}`);

        for (const tagName of subData.tags) {
          const tag = new Tag({
            name: tagName,
            subcategory: subcategory._id,
            description: `${tagName} skill`,
          });
          await tag.save();
        }

        console.log(`Created ${subData.tags.length} tags for ${subcategory.name}`);
      }
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedDatabase();