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

*   **`.env`:** Contains essential configuration and secrets, such as database connection strings (if any), API keys for external services (Google Cloud, OpenAI, Groq), and server settings (e.g., port). Copy from `.env.sample` and fill in the values.
*   **`google-credentials.json`:** A Google Cloud service account key file required for authenticating Google Cloud API calls (like Speech-to-Text). Obtain this from your Google Cloud project console and place it in the `server/` directory.
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

Configuration is primarily managed via the `.env` file, loaded using `dotenv`. Ensure all required variables specified in `.env.sample` are correctly set in your local `.env` file before running the server. 