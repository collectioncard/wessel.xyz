import React from 'react';

const ProjectThumbnail = ({projectData}) => {
    return (
        <div className="project-thumbnail">
            <h3>{projectData.title}</h3>
            <img src={projectData.imgURL} alt={projectData.title} />
            <p>{projectData.shortDesc}</p>
        </div>
    );
};

export default ProjectThumbnail;