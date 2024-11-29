import React from 'react';
import './projectThumbnail.css';
import { Project } from '../../scripts/ProjectData';

const ProjectThumbnail: React.FC<Project> = (projectData) => {
    return (
        <a href={projectData.url} className="projectThumbnailLink">
            <div className="projectThumbnail">
                <h3>{projectData.title}</h3>
                <img src={projectData.images[0]} alt={projectData.title} />
                <p>{projectData.description_short}</p>
            </div>
        </a>
    );
};

export default ProjectThumbnail;
