import React from 'react';
import './projectThumbnail.css';
import { Project } from '../../scripts/ProjectData';

interface ProjectThumbnailProps extends Project {
    onClick: () => void;
}

const ProjectThumbnail: React.FC<ProjectThumbnailProps> = ({ title, description_short, assetFolder, images, url, onClick }) => {
    const handleClick = () => {
        if (url) {
            window.open(url);
        } else {
            onClick();
        }
    };

    const thumbnail = images
        ? images[0].startsWith("http")
            ? images[0]
            : `projects/${assetFolder}/img/${images[0]}`
        : "https://placehold.co/600x400";

    return (
        <div className="projectThumbnail" onClick={handleClick}>
            <h3>{title ? title : "No Title Was Provided"}</h3>
            <img src={thumbnail} alt={title}/>
            <p>
                {description_short ? description_short : "No description was provided"}
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