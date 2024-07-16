import React from 'react';
import './projectThumbnail.css';

const ProjectThumbnail = ({projectData}) => {
    return (
        <a href={projectData.url} className="projectThumbnailLink">
            <div className="projectThumbnail">
                <h3>{projectData.title}</h3>
                <img src={projectData.imgURL} alt={projectData.title}/>
                <p>{projectData.shortDesc}</p>
            </div>
        </a>
    );
};

export default ProjectThumbnail;