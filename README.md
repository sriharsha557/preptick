# PrepTick - Exam Preparation Platform

> Syllabus-aligned mock tests for CBSE and Cambridge students

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sriharsha557/preptick)

## 🎯 Overview

PrepTick is a comprehensive exam preparation platform that helps students practice with syllabus-aligned mock tests. Generate custom question papers, track performance, and improve with focused feedback.

### Key Features

- ✅ **Syllabus-Aligned Tests** - Questions mapped to CBSE and Cambridge curriculum
- ✅ **Multiple Formats** - Printable PDFs or in-app practice
- ✅ **Performance Tracking** - Detailed feedback and weak area identification
- ✅ **Unlimited Tests** - Generate as many mock tests as needed
- ✅ **Answer Keys** - Clear explanations and solutions
- ✅ **Grades 1-10** - Support for all primary and secondary grades

## 🚀 Live Demo

- **Frontend**: [https://preptick.vercel.app](https://preptick.vercel.app)
- **Sample Paper**: [View Sample](https://preptick.vercel.app/sample-paper)

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime
- **Fastify** - Web framework
- **Prisma** - ORM
- **PostgreSQL** - Database (Supabase)
- **TypeScript** - Type safety

### Services
- **Supabase** - Database and authentication
- **GROQ** - LLM for question generation
- **Formspree** - Contact form handling

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Clone Repository

```bash
git clone https://github.com/sriharsha557/preptick.git
cd preptick
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Vite (Frontend)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# GROQ API
GROQ_API_KEY="your-groq-api-key"

# JWT
JWT_SECRET="your-secret-key"

# Server
PORT=3000
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database
npm run seed
```

### Run Development Servers

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npm run dev:frontend
```

Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 🚀 Deployment

### Deploy to Vercel (Frontend)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sriharsha557/preptick)

Or manually:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables on Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📁 Project Structure

```
preptick/
├── src/
│   ├── pages/              # React pages
│   │   ├── LandingPage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── FAQPage.tsx
│   │   ├── SamplePaperPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── DashboardPage.tsx
│   ├── components/         # React components
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── services/          # Backend services
│   │   ├── auth.ts
│   │   ├── syllabus.ts
│   │   ├── vectorStore.ts
│   │   └── ragRetriever.ts
│   ├── lib/               # Utilities
│   │   ├── supabase.ts
│   │   └── supabaseClient.ts
│   └── types/             # TypeScript types
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── public/                # Static assets
├── documents/             # Sample papers
├── .env                   # Environment variables
├── package.json
├── vite.config.ts
└── vercel.json           # Vercel configuration
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 Documentation

- [Setup Guide](./SETUP.md)
- [Frontend Setup](./FRONTEND_SETUP.md)
- [Supabase Setup](./SUPABASE_SETUP.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [PDF Watermark Guide](./PDF_WATERMARK_GUIDE.md)

## 🎨 Design System

### Colors
- Primary Blue: `#64B5F6`
- Secondary Orange: `#FF9E80`
- Text Dark: `#333333`
- Text Light: `#666666`
- Background: `#FFFFFF`

### Typography
- Font Family: System fonts (sans-serif)
- Headings: Bold, large sizes
- Body: Regular weight, readable sizes

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Rahul & Harsha** - Founders
- Built by parents, for students

## 🙏 Acknowledgments

- CBSE and Cambridge for curriculum standards
- Supabase for database and authentication
- GROQ for LLM capabilities
- All contributors and testers

## 📞 Contact

- **Website**: [preptick.com](https://preptick.com)
- **Email**: support@preptick.com
- **GitHub**: [@sriharsha557](https://github.com/sriharsha557)

## 🔗 Links

- [Live Demo](https://preptick.vercel.app)
- [Documentation](./SETUP.md)
- [Issue Tracker](https://github.com/sriharsha557/preptick/issues)

---

Made with ❤️ by Rahul & Harsha
