import { type FileDocument } from "@modular-rest/client/dist/types/types";

export const USER_CONTENT = {
  DATABASE: "user_content",
  PROFILE_COLLECTION: "profile",
};

export interface ProfileType {
  _id: string;
  refId: string;
  name: string;
  gPicture: string;
  images: FileDocument[];
}
