import { useEffect, useState } from 'react';
import './App.css';
import ProjectThumbnail from './components/project-thumbs/projectThumbnail';
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { Project, ProjectData } from './scripts/ProjectData';


function App() {
    const [projects, setProjects] = useState<Project[]>([]);
    useEffect(() => {
        const fetchProjects = async () => {
            const fetchedProjects = await ProjectData.getProjects();
            setProjects(fetchedProjects);
            console.log(fetchedProjects);
        };

        fetchProjects();
    }, []);

    return (
        <>
            <div className="mainContainer">
                <header>
                    <h1>Thomas Wessel</h1>
                    <p className="introText">I make seemingly unrelated stuff that usually ends up being pretty neat</p>
                    <nav className="profileLinks" aria-label="Résumé and profiles">
                        <a href="https://docs.google.com/document/d/158I-peZDIZNFvw30WkYq4zKa8BadVcCwm4fJmsCpsjw/export?format=pdf" aria-label="Download my résumé">Résumé</a>
                        <a href="https://github.com/collectioncard">GitHub</a>
                    </nav>
                </header>
                <div className="projectHeader">
                    <p>Take a look at some of the projects that I've worked on</p>
                </div>
                <ResponsiveMasonry
                    columnsCountBreakPoints={{350: 1, 750: 2}}
                    className="masonry"
                >
                    <Masonry>
                        {projects.map((project) => (
                            <ProjectThumbnail
                                key={project.id}
                                {...project}
                                onClick={() => { window.location.href = '/projects/' + (project.assetFolder.startsWith('cms-') ? project.assetFolder.slice(4) : project.assetFolder); }}
                            />
                        ))}
                    </Masonry>
                </ResponsiveMasonry>
            </div>

        </>
    );
}

export default App;
