import React from 'react';
import './projectThumbnail.css';
import { Project } from '../../scripts/ProjectData';

interface ProjectThumbnailProps extends Project {
    onClick: () => void;
}

const ProjectThumbnail: React.FC<ProjectThumbnailProps> = ({ title, description_short, images, url, onClick }) => {
    const handleClick = () => {
        if (url) {
            window.open(url);
        } else {
            onClick();
        }
    };

    return (
        <div className="projectThumbnail" onClick={handleClick}>
            <h3>{title}</h3>
            <img src={images[0]} alt={title}/>
            <p>
                {description_short}
                {url && (
                    <>
                        <br/>
                        (opens to other site)
                    </>
                )}
            </p>
        </div>
    );
};

export default ProjectThumbnail;