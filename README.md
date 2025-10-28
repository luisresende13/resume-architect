<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Resume Architect

Resume Architect is an intelligent, AI-powered application designed to streamline the resume creation process. It empowers users to build a comprehensive "Master Profile" from their existing career documents and then leverage that profile to generate perfectly tailored resumes for specific job opportunities.

## Key Features

- **AI-Powered Master Profile**: Upload your existing resumes, cover letters, and other documents, and let the AI extract and consolidate all your professional information into a single, editable Master Profile.
- **Opportunity-Specific Resumes**: Paste a job description to create a new "Opportunity," and the AI will generate a tailored resume, highlighting the most relevant skills and experiences from your Master Profile.
- **Advanced Resume Editor**: A full-featured Markdown editor with a live preview, allowing you to manually refine and perfect your generated resumes.
- **Dynamic AI Refinement**: Use natural language instructions to refine your resume on the fly (e.g., "Make it more concise," "Emphasize my leadership skills").
- **Secure User Authentication**: Full authentication flow powered by Supabase, including email/password, Google, and LinkedIn OAuth.
- **Centralized Document Management**: Easily upload, view, and manage all your source career documents in one place.

## Tech Stack

- **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI**: [Google Gemini API](https://ai.google.dev/)
- **Backend & Database**: [Supabase](https://supabase.io/) (Authentication, PostgreSQL, Storage)
- **UI**: Custom components, [react-hot-toast](https://react-hot-toast.com/) for notifications, and [react-markdown](https://github.com/remarkjs/react-markdown) for rendering.

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/) (recommended package manager)
- A [Google AI Studio API Key](https://ai.studio.google.com/) for Gemini.
- A [Supabase](https://supabase.io/) project for database, authentication, and storage.

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/resume-architect.git
    cd resume-architect
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following variables. You can get these from your Supabase project settings and Google AI Studio.

    ```env
    VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
    VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```

4.  **Set up Supabase database:**
    You will need to run the SQL schema to set up the necessary tables in your Supabase project. The schema can be found in `supabase/schema.sql`.

5.  **Run the development server:**
    ```bash
    pnpm run dev
    ```
    The application should now be running on `http://localhost:3000`.

## Project Structure

The codebase is organized to separate concerns and make navigation intuitive.

```
/
├── public/               # Static assets
├── src/
│   ├── components/       # Reusable React components (Modal, Header, etc.)
│   ├── contexts/         # React Context providers (AuthContext)
│   ├── screens/          # Top-level view components (LoginScreen, ResumeEditor, etc.)
│   ├── services/         # API service modules (apiService, geminiService)
│   ├── types.ts          # Core TypeScript type definitions
│   ├── App.tsx           # Main application component with routing logic
│   └── index.tsx         # Application entry point
├── .env                  # Environment variables (gitignored)
├── package.json          # Project dependencies and scripts
└── vite.config.ts        # Vite configuration
```

## How It Works

1.  **Authentication**: User authentication is handled by `AuthContext.tsx`, which interacts with Supabase Auth.
2.  **Data Fetching**: The `services/apiService.ts` module contains all functions for interacting with the Supabase database (CRUD operations for documents, profiles, opportunities, etc.).
3.  **AI Interaction**: The `services/geminiService.ts` module manages all communication with the Google Gemini API, including generating profile sections and tailoring resumes. It uses streaming to provide a real-time "thinking" UI to the user.
4.  **State Management**: The main `App.tsx` component acts as a router, controlling which "screen" is visible and passing down necessary state and navigation functions.

## Available Scripts

In the project directory, you can run:

- `pnpm run dev`: Runs the app in development mode.
- `pnpm run build`: Builds the app for production.
- `pnpm run preview`: Serves the production build locally.
