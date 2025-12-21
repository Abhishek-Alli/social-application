# SRJ Enterprise Portal - Social Application

<div align="center">
<img width="1200" height="475" alt="SRJ Enterprise Portal" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

A comprehensive enterprise social application with task management, team collaboration, messaging, and more. Built with React, TypeScript, and Supabase PostgreSQL.

## 🚀 Features

- **🔐 Authentication & Authorization** - Role-based access (Admin, Management, HOD, Employee)
- **📋 Task Management** - Create, assign, and track tasks with priorities and due dates
- **👥 Team Management** - Hierarchical team structure with project scoping
- **💬 Real-time Messaging** - Direct messages and group chats
- **📧 Internal Email System** - Send emails with CC/BCC support
- **📱 Social Feed** - Post updates, images, videos with likes and comments
- **📝 Notes & Memos** - Quick notes with color coding
- **📊 Analytics Dashboard** - Visual insights into tasks and team
- **🔔 Notifications** - Real-time notifications for important updates
- **📞 Voice/Video Calls** - Integrated call functionality
- **📮 Complaints System** - Submit and track complaints

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Backend:** Supabase (PostgreSQL)
- **UI:** Tailwind CSS, Lucide Icons
- **Charts:** Recharts
- **AI:** Google Gemini API

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (free tier works)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd SOCIAL-APPLICATION
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini API (Optional - for AI features)
GEMINI_API_KEY=your-gemini-api-key-here
```

**Note:** If you don't create `.env`, the app will use fallback values from `supabase.config.ts` (for development only).

### 4. Database Setup

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Open SQL Editor
3. Copy and paste the entire content from `supabase-setup.sql`
4. Click "Run" to create all tables and seed the admin user

**Or use the verification queries:**
- Run queries from `verify-credentials.sql` to check if setup is correct

### 5. Default Admin Credentials

After running the SQL setup:

- **Username:** `admin-abhishek`
- **Password:** `admin@123`
- **Email:** `admin@srj.com`

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
SOCIAL-APPLICATION/
├── components/          # React components
│   ├── AuthView.tsx    # Authentication UI
│   ├── TaskCard.tsx    # Task display component
│   ├── ChatView.tsx    # Messaging interface
│   └── ...
├── services/           # Service layer
│   ├── supabaseService.ts  # Supabase database operations
│   └── geminiService.ts    # AI integration
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
├── supabase.config.ts  # Supabase configuration
├── supabase-setup.sql  # Database schema and setup
└── verify-credentials.sql  # Database verification queries
```

## 🔐 Authentication

The app supports:
- Username/Password login
- Two-step verification (optional)
- Role-based access control
- Project-scoped users

## 📊 Database Schema

The application uses the following main tables:
- `users` - User accounts and profiles
- `projects` - Project/organization nodes
- `tasks` - Task management
- `notes` - Quick notes
- `posts` - Social feed posts
- `messages` - Direct and group messages
- `emails` - Internal email system
- `complaints` - Complaint tracking
- `notifications` - User notifications
- `groups` - Chat groups

See `supabase-setup.sql` for complete schema.

## 🌐 Deployment

### GitHub

The app is ready to push to GitHub. The database will connect automatically because:
- Supabase credentials are configured in `supabase.config.ts`
- `.env` file is in `.gitignore` (won't be pushed)
- Environment variables take priority if set

### Production Deployment (Vercel/Netlify)

1. **Connect your GitHub repository**
2. **Add Environment Variables:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (optional)
3. **Deploy!**

See `DEPLOYMENT.md` for detailed deployment instructions.

## 🔒 Security Notes

- **Anon Key:** Safe to expose (public key, protected by RLS)
- **Service Role Key:** NEVER expose (server-side only)
- **Row Level Security:** Currently disabled for testing. Enable RLS in production!
- **Environment Variables:** Use `.env` for local development
- **Credentials:** Never commit `.env` file to git

## 📚 Documentation

- **`SUPABASE_SETUP.md`** - Complete Supabase setup guide
- **`DEPLOYMENT.md`** - Deployment instructions
- **`verify-credentials.sql`** - Database verification queries

## 🐛 Troubleshooting

### Login Issues

1. **"Invalid credentials" error:**
   - Check if admin user exists in Supabase: Run `verify-credentials.sql`
   - Clear browser localStorage: `localStorage.clear()` in console
   - Verify credentials match: `admin-abhishek` / `admin@123`

2. **Database connection issues:**
   - Verify Supabase URL and key in `.env`
   - Check Supabase dashboard for connection status
   - Review browser console for errors

3. **Tables not found:**
   - Run `supabase-setup.sql` in Supabase SQL Editor
   - Verify all tables were created successfully

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is private and proprietary.

## 👤 Author

SRJ Enterprise

## 🔗 Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

---

**Note:** This is an enterprise application. Ensure proper security measures are in place before deploying to production.
