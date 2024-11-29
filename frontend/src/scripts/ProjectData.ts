interface Project {
    id: number;
    title: string;
    subtitle: string;
    tags: string[];
    images: string[];
    description_short: string;
    description_long: string;
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
            images: writeup.images,
            description_short: writeup.description_short,
            description_long: writeup.description_long,
            url: writeup.url,
            resources: writeup.resources,
        }));
    }
}

export { ProjectData };
export type { Project };
