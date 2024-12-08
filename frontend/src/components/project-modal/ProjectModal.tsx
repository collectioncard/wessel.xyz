import React, { useEffect } from 'react';
import Modal from 'react-modal';
import { Project } from '../../scripts/ProjectData';
import './ProjectModal.css';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

interface ProjectModalProps {
    isOpen: boolean;
    onRequestClose: () => void;
    project: Project | null;
}

Modal.setAppElement('#root');

const responsive = {
    all: {
        breakpoint: { max: 4000, min: 0 },
        items: 1
    }
};

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onRequestClose, project }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [isOpen]);

    if (!project) return null;

    const authors = project.authors.map((author, index) => (
        <span key={index}>
            {author.url ? (
                <a href={author.url} target="_blank" rel="noopener noreferrer">
                    {author.name}
                </a>
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
            <div className="carouselContainer">
                <Carousel
                    responsive={responsive}
                    infinite={true}
                    autoPlay={false}
                    showDots={true}
                    arrows={true}
                >
                    {project.images.map((image, index) => (
                        <img
                            key={index}
                            src={
                                image.startsWith("http")
                                    ? image
                                    : `images/${project.assetFolder}/${image}`
                            }
                            alt={`Slide ${index}`}
                        />
                    ))}
                </Carousel>
            </div>
            <p>{project.page_body}</p>
            <button onClick={onRequestClose}>Close</button>
        </Modal>
    );
};

export default ProjectModal;