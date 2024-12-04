interface Project {
    page_body: string;
    authors: {
        name: string;
        url: string
    }[];
    id: number;
    title: string;
    subtitle: string;
    tags: string[];
    assetFolder: string;
    images: string[];
    description_short: string;
    url: string;
    resources: {
        resource_title: string;
        resource_url: string;
    }[];
}

class ProjectData {
    static async getProjects(): Promise<Project[]> {
        const response = await fetch('/writeupData.json');
        const writeupData = await response.json() as {
            version: number;
            lastEditDate: string;
            writeups: Project[];
        };

        console.log(`JSON Version: ${writeupData.version}`);
        console.log(`Projects last updated: ${writeupData.lastEditDate}`);

        return writeupData.writeups.map((writeup, index) => ({
            id: index + 1,
            title: writeup.title,
            subtitle: writeup.subtitle,
            tags: writeup.tags,
            assetFolder: writeup.assetFolder,
            images: writeup.images,
            description_short: writeup.description_short,
            page_body: writeup.page_body,
            url: writeup.url,
            resources: writeup.resources,
            authors: writeup.authors || []
        }));
    }
}

export { ProjectData };
export type { Project };
