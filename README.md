# Emerald Notes

A modern, feature-rich note-taking application built with Next.js, featuring a rich text editor, tag management, and local SQLite storage.

![Emerald Notes](https://img.shields.io/badge/Next.js-15.4.6-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

- **Rich Text Editor**: Advanced text editing with formatting options
- **Tag Management**: Organize notes with custom tags
- **Local Storage**: SQLite database for reliable data persistence
- **Real-time Updates**: Auto-save functionality as you type
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Search & Filter**: Find notes quickly with built-in search
- **Archive System**: Archive notes instead of deleting them

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd emerald-notes
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Initialize the database:
```bash
npm run dev
```
The database will be automatically initialized when you first run the application.

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   │   ├── init-db/    # Database initialization
│   │   └── notes/      # Notes CRUD operations
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main application page
├── components/          # React components
│   ├── DualEditor.tsx  # Rich text editor
│   └── TagInput.tsx    # Tag input component
└── lib/
    └── database.ts     # SQLite database configuration
```

## 📝 Usage

### Creating Notes
- Click the "+ New Note" button to create a new note
- Notes are automatically saved as you type

### Editing Notes
- Use the rich text editor for formatting
- Notes are displayed in a clean, readable format

### Managing Tags
- Add tags to organize your notes
- Tags are displayed as colored badges
- Filter notes by tags (coming soon)



## 🗄️ Database

The application uses SQLite with the following schema:

- **notes**: Main notes table with title, content, tags, and timestamps
- **tags**: Tag management table
- **note_tags**: Junction table for many-to-many relationships

The database file (`notes.db`) is created automatically in the project root.

## 🛡️ API Endpoints

- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create a new note
- `PUT /api/notes/[id]` - Update a note
- `DELETE /api/notes/[id]` - Delete a note
- `GET /api/init-db` - Initialize database (auto-called)

## 🎨 Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Editor**: TipTap (rich text editor)
- **Database**: SQLite with better-sqlite3
- **Development**: ESLint, Turbopack

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Rich text editing powered by [TipTap](https://tiptap.dev/)
- Database management with [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
