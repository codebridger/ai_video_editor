import { Types } from "@modular-rest/client";

export const VIDEO_PROJECT_DATABASE = {
  DATABASE: "video_project",
  PROJECT_COLLECTION: "project",
};

export type ProjectType = {
  _id: string;
  title: string;
  userId: string;
};
