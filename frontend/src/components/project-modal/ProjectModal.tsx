import React from 'react';
import Modal from 'react-modal';
import { Project } from '../../scripts/ProjectData';
import './ProjectModal.css';
import { Carousel } from 'nuka-carousel';

interface ProjectModalProps {
    isOpen: boolean;
    onRequestClose: () => void;
    project: Project | null;
}

Modal.setAppElement('#root');

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onRequestClose, project }) => {
    if (!project) return null;

    const authors = project.authors.map((author, index) => (
        <span key={index}>
            {author.url ? (
                <a href={author.url} target="_blank" rel="noopener noreferrer">{author.name}</a>
            ) : (
                author.name
            )}
            {index !== project.authors.length - 1 && ', '}
        </span>
    ));

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Project Details"
            overlayClassName="modalOverlay"
            className="modalContent"
        >
            <h1>{project.title}</h1>
            <h3>{project.subtitle}</h3>
            <h6>Created by: {authors}</h6>
            <Carousel showArrows showDots autoplay={true}>
                {project.images.map((image, index) => (
                    <img key={index} src={image.startsWith("http") ? image : `images/${project.assetFolder}/${image}`} alt={`Slide ${index}`} />
                ))}
            </Carousel>
            <p>{project.page_body}</p>
            <button onClick={onRequestClose}>Close</button>
        </Modal>
    );
};

export default ProjectModal;