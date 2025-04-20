# Backend Documentation (AI Video Editor)

This directory contains the Node.js backend server application for the AI Video Editor.

## Technology Stack

*   **Framework:** [`@modular-rest/server`](https://www.npmjs.com/package/@modular-rest/server)
*   **Language:** JavaScript (Node.js)
*   **Environment Variables:** [dotenv](https://www.npmjs.com/package/dotenv)
*   **AI / ML:**
    *   [LangChain](https://js.langchain.com/) (`langchain`, `@langchain/google-genai`)
    *   [Google Cloud Speech](https://cloud.google.com/speech-to-text)
    *   [Google APIs Client Library](https://github.com/googleapis/google-api-nodejs-client)
    *   [OpenAI Node Library](https://github.com/openai/openai-node)
    *   [Groq SDK](https://github.com/groq/groq-node)
*   **Video Processing:** [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
*   **Data Validation:** [Zod](https://zod.dev/)

## Folder Structure

*   **`keys/`:** Contains sensitive key files (e.g., private keys). *(Ignored by Git)*
*   **`src/`:** Main source code directory.
    *   **`assets/`:** Static assets used by the server.
    *   **`chains/`:** Likely contains LangChain chains or sequences of AI operations.
    *   **`helpers/`:** Utility functions specific to the backend.
    *   **`modules/`:** Core application logic, organized by feature (e.g., `auth`, `profile`, `video_project`). Each module likely defines API routes and services.
    *   **`index.js`:** The main entry point for the server application (based on `package.json` scripts).
*   **`temp/`:** Temporary storage for files during processing (e.g., video segments, intermediate AI outputs). *(Ignored by Git)*
*   **`uploads/`:** Storage location for user-uploaded files (e.g., original videos). *(Ignored by Git)*
*   **`.env`:** Environment variables file (see Configuration). *(Ignored by Git)*
*   **`google-credentials.json`:** Service account key file for Google Cloud authentication. *(Ignored by Git)*

## Development

To run the backend development server (usually requires the frontend to be running as well for full functionality):

```bash
cd server
yarn dev
```

This command uses `nodemon` to automatically restart the server on file changes. Check the server logs for the port it's running on and any potential errors. Refer to the root `README.md` for instructions on running the full stack.

## Key Configurations

*   **`.env`:** Contains essential configuration and secrets. Since a `.env.sample` file is not provided, developers need to create this file manually or copy it from an existing setup. It likely contains API keys (Google Cloud, OpenAI, Groq), server port settings, potential database connection strings, and other environment-specific values. Refer to the code where `process.env` is used (especially during application startup or in module configurations) to determine the required variables. *(Ignored by Git)*
*   **`google-credentials.json`:** A Google Cloud service account key file required for authenticating Google Cloud API calls (like Speech-to-Text). Obtain this from your Google Cloud project console and place it in the `server/` directory. *(Ignored by Git)*
*   Module configurations within `src/modules/` or potentially a central configuration file within `src/` might exist for the `@modular-rest/server` framework.

## API Endpoints

The server exposes a RESTful API consumed by the frontend. The API routes are likely defined within the feature modules in `src/modules/`:

*   **`auth/`:** Handles user authentication (login, registration, sessions/tokens).
*   **`profile/`:** Manages user profile information.
*   **`video_project/`:** Handles operations related to video projects (uploading, processing, fetching project details, managing edits).

*(Further details on specific endpoints, request/response formats could be added here or in separate API documentation if needed)*

## AI Integration

The server leverages several AI services:

*   **Speech-to-Text:** Uses `@google-cloud/speech` for transcribing audio from videos.
*   **Generative AI:** Integrates with Google Generative AI models (via `@langchain/google-genai`), OpenAI models (via `openai`), and Groq models (via `groq-sdk`), likely orchestrated using LangChain (`langchain`) found in `src/chains/`. These are probably used for features like summarization, content analysis, or other AI-driven editing capabilities.

## Video Processing

Video manipulation is handled using `fluent-ffmpeg`, a wrapper around the FFmpeg library. This is likely used for:

*   Generating video previews (e.g., thumbnails, lower-resolution versions stored in `_low`, `_preview` subdirectories within `uploads/mp4/<project_id>/`).
*   Segmenting or modifying videos based on user edits or AI analysis.
*   Exporting final videos (potentially to `temp/exported_videos/`).

**Note:** FFmpeg must be installed on the machine running the server.

## Environment Variables

Configuration is primarily managed via the `.env` file in the `server/` directory, loaded using `dotenv`. Create a `.env` file and populate it with the following variables, adjusting values as needed for your environment:

```dotenv
# Runtime environment (e.g., development, production)
NODE_ENV=development

# Port the backend server listens on
PORT=8080

# Hostname the server binds to
HOST=localhost

# Base URL of the frontend application (used for CORS, redirects)
FRONT_END_URL=http://localhost:3000

# === Security ===
# (Required, Secret) Strong, unique secret for signing JWTs
JWT_SECRET_KEY=your_strong_secret_here
# How long JWTs are valid (e.g., 7d, 1h, 30m)
JWT_EXPIRES_IN=7d

# === Google Cloud ===
# (Required) Your Google Cloud Project ID
GOOGLE_PROJECT_ID=your-gcp-project-id
# (Required) Path to the Google Cloud service account key file
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# === External AI Services ===
# (Required) Your OpenAI API key
OPENAI_API_KEY=sk-your-openai-key-here
# (Required) Your Google Gemini API key
GEMINI_API_KEY=your-gemini-api-key-here
# (Required) Your Groq API key
GROQ_API_KEY=gsk_your-groq-key-here
```

**Important:** Ensure you create a `.env` file in the `server/` directory and populate it with the correct values for your setup. Do not commit the `.env` file to Git. 