import { fileProvider, Types, functionProvider, dataProvider, authentication } from '@modular-rest/client';

import { defineStore } from 'pinia';
import { ref } from 'vue';

import {
    VIDEO_PROJECT_DATABASE,
    type GroupedSegment,
    type ProjectType,
    type TimelineGroupedSegmentType,
    type VideoMediaType,
    type VideoRevisionType,
} from '../types/project.type';
import { sleep } from '../helpers/promise';

export const useMediaManagerStore = defineStore('mediaManagerStore', () => {
    const projectId = ref<string>('');

    // The uploaded files for the project, Native cms files
    const projectFiles = ref<Types.FileDocument[]>([]);
    // The files are bing uploaded by the user
    const uploadList = ref<File[]>([]);
    // The Progress of the files being uploaded
    const uploadProgressList = ref<{ [key: string]: number }>({});

    // ProjectMedia Files
    // These are process content of cms files
    const processedVideoMediaList = ref<VideoMediaType[]>([]);

    const timeline = ref<TimelineGroupedSegmentType[]>([]);
    const timelinePreview = ref<{ fileId: string; isPending: boolean }>({
        fileId: '',
        isPending: false,
    });

    const activeVideoForPlayer = ref<string | null>(null);

    const videoRevisions = ref<VideoRevisionType[]>([]);

    function initialize(id: string) {
        projectId.value = id;

        console.log('Initializing Media Manager Store', id);

        fetchProjectTimeLine(id);
        fetchProjectFiles(id);
        fetchVideoMedias(id);
        fetchVideoRevisions(id);
    }

    function clear() {
        projectId.value = '';
        projectFiles.value = [];
        uploadList.value = [];
        uploadProgressList.value = {};
        processedVideoMediaList.value = [];
        timeline.value = [];
        timelinePreview.value = {
            fileId: '',
            isPending: false,
        };
        activeVideoForPlayer.value = null;
        videoRevisions.value = [];
    }

    function fetchProjectTimeLine(id: string) {
        timeline.value = [];
        timelinePreview.value = {
            fileId: '',
            isPending: false,
        };

        return dataProvider
            .findOne<ProjectType>({
                database: VIDEO_PROJECT_DATABASE.DATABASE,
                collection: VIDEO_PROJECT_DATABASE.PROJECT_COLLECTION,
                query: {
                    userId: authentication.user?.id,
                    _id: id,
                },
            })
            .then((project) => {
                timeline.value = project.timeline;

                timelinePreview.value = project.timelinePreview || {
                    fileId: '',
                    isPending: false,
                };

                if (timelinePreview.value.fileId && timelinePreview.value.fileId.length) {
                    fetchVideoLink(timelinePreview.value.fileId);
                }
            });
    }

    function fetchProjectFiles(projectId: string) {
        projectFiles.value = [];
        uploadList.value = [];
        uploadProgressList.value = {};

        return fileProvider
            .getFileDocsByTag(projectId, authentication.user?.id!)
            .then((files) => {
                projectFiles.value = files;
            })
            .catch((error) => {
                console.error('Error fetching project files:', error);
            });
    }

    function fetchVideoMedias(projectId: string) {
        processedVideoMediaList.value = [];

        return dataProvider
            .find<VideoMediaType>({
                database: VIDEO_PROJECT_DATABASE.DATABASE,
                collection: VIDEO_PROJECT_DATABASE.VIDEO_MEDIA,
                query: { projectId },
                options: { sort: { creation_time: 1 } },
            })
            .then((medias) => {
                processedVideoMediaList.value = medias;
            });
    }

    function fetchVideoRevisions(projectId: string) {
        videoRevisions.value = [];

        return dataProvider
            .find<VideoRevisionType>({
                database: VIDEO_PROJECT_DATABASE.DATABASE,
                collection: VIDEO_PROJECT_DATABASE.VIDEO_REVISION,
                query: { projectId, userId: authentication.user?.id },
            })
            .then((revisions) => {
                videoRevisions.value = revisions;
            });
    }

    function fetchVideoMediaByFileId(fileId: string) {
        return dataProvider
            .findOne<VideoMediaType>({
                database: VIDEO_PROJECT_DATABASE.DATABASE,
                collection: VIDEO_PROJECT_DATABASE.VIDEO_MEDIA,
                query: { fileId },
            })
            .then((media) => {
                if (!media) return null;

                const index = processedVideoMediaList.value.findIndex((media) => media.fileId === fileId);

                if (index !== -1) {
                    processedVideoMediaList.value[index] = media;
                } else {
                    processedVideoMediaList.value.push(media);
                }

                return media;
            });
    }

    function getUploadSessionId(file: File) {
        return file.name + file.size + file.lastModified;
    }

    function checkUploadProgress(file: File) {
        const sessionId = getUploadSessionId(file);
        return uploadProgressList.value[sessionId];
    }

    function startUploadSession(fileName: string, projectId: string) {
        let file = null;
        // iterate into the file list and upload each file
        if (uploadList.value) {
            for (let i = 0; i < uploadList.value.length; i++) {
                file = uploadList.value[i];
                if (file.name === fileName) break;
            }
        }

        if (!(file && file.name === fileName)) return Promise.reject('File not found');

        const sessionId = getUploadSessionId(file);

        if (checkUploadProgress(file)) return Promise.reject('File already in progress');

        return fileProvider
            .uploadFile(
                file,
                (event) => {
                    const percentage = Math.round((event.loaded / event.total) * 100);
                    uploadProgressList.value[sessionId] = percentage;
                },
                projectId
            )
            .then(async (fileDoc) => {
                projectFiles.value.push(fileDoc);
                delete uploadProgressList.value[sessionId];

                let fetched = false;
                while (!fetched) {
                    sleep(1000);
                    fetched = !!(await fetchVideoMediaByFileId(fileDoc._id));
                }

                uploadList.value = uploadList.value.filter((file) => file.name !== fileName);
            })
            .catch((error) => {
                delete uploadProgressList.value[sessionId];
                throw error;
            });
    }

    function removeProjectFile(fileId: string) {
        const videoMedia = processedVideoMediaList.value.find((media) => media.fileId === fileId);

        if (!videoMedia) return Promise.resolve();

        return dataProvider
            .removeOne({
                database: VIDEO_PROJECT_DATABASE.DATABASE,
                collection: VIDEO_PROJECT_DATABASE.VIDEO_MEDIA,
                query: {
                    _id: videoMedia?._id,
                    fileId,
                    lowQualityFileId: videoMedia.lowQualityFileId,
                },
            })
            .then(() => {
                processedVideoMediaList.value = processedVideoMediaList.value.filter((media) => media.fileId !== fileId);
                projectFiles.value = projectFiles.value.filter((file) => file._id !== fileId);
            });
    }

    function generateGroupedSegments(videoMediaId: string) {
        return functionProvider
            .run({
                name: 'generateGroupedSegments',
                args: {
                    videoMediaId,
                },
            })
            .then((res: any) => {
                // update the grouped segments in the store
                const index = processedVideoMediaList.value.findIndex((media) => media._id === videoMediaId);

                if (index !== -1) {
                    processedVideoMediaList.value[index].groupedSegments = res.groupedSegments;
                }
            });
    }

    function updateProjectTimeLine() {
        return dataProvider.updateOne({
            database: VIDEO_PROJECT_DATABASE.DATABASE,
            collection: VIDEO_PROJECT_DATABASE.PROJECT_COLLECTION,
            query: {
                userId: authentication.user?.id,
                _id: projectId.value,
            },
            update: {
                $set: {
                    timeline: timeline.value,
                },
            },
        });
    }

    function generateTimeline(prompt: string) {
        return functionProvider
            .run({
                name: 'generateTimeline',
                args: {
                    prompt,
                    userId: authentication.user?.id,
                    projectId: projectId.value,
                },
            })
            .then((res: any) => {
                timeline.value = res.timeline;
            });
    }

    function generateVideoRevision(context: { prompt: string }) {
        return functionProvider.run<VideoRevisionType>({
            name: 'generateVideoRevision',
            args: {
                prompt: context.prompt,
                projectId: projectId.value,
                userId: authentication.user?.id,
            },
        });
    }

    function generateTimelinePreview() {
        return functionProvider
            .run<void>({
                name: 'generateTimelinePreview',
                args: {
                    projectId: projectId.value,
                    userId: authentication.user?.id,
                },
            })
            .then(() => {
                return fetchProjectTimeLine(projectId.value);
            })
            .then(() => {
                if (timelinePreview.value.fileId && timelinePreview.value.fileId.length) {
                    return fetchVideoLink(timelinePreview.value.fileId);
                }
            });
    }

    async function fetchVideoLink(fileId: string) {
        const fileDoc = await fileProvider.getFileDoc(
            fileId,
            // @ts-ignore
            authentication.user?.id
        );

        if (!fileDoc) {
            activeVideoForPlayer.value = null;
            return;
        }

        activeVideoForPlayer.value = fileProvider
            // @ts-ignore
            .getFileLink(fileDoc);
    }

    async function removeVideoRevision(revisionId: string) {
        if (!window.confirm('Are you sure you want to delete this revision?')) return;

        const revision = videoRevisions.value.find((rev) => rev._id === revisionId);

        return dataProvider
            .removeOne({
                database: VIDEO_PROJECT_DATABASE.DATABASE,
                collection: VIDEO_PROJECT_DATABASE.VIDEO_REVISION,
                query: {
                    _id: revisionId,
                    userId: authentication.user?.id,
                    fileId: revision?.fileId,
                },
            })
            .then(() => {
                videoRevisions.value = videoRevisions.value.filter((rev) => rev._id !== revisionId);
            });
    }

    return {
        projectId,
        projectFiles,
        uploadList,
        processedVideoMediaList,
        timeline,
        videoRevisions,
        activeVideoForPlayer,
        initialize,
        clear,
        getUploadSessionId,
        startUploadSession,
        checkUploadProgress,
        fetchProjectFiles,
        removeProjectFile,
        fetchVideoRevisions,
        generateVideoRevision,
        generateTimelinePreview,
        fetchVideoMedias,
        fetchVideoMediaByFileId,
        generateGroupedSegments,
        updateProjectTimeLine,
        generateTimeline,
        fetchVideoLink,
        removeVideoRevision,
    };
});
