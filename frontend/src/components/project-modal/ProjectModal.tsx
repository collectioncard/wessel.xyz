import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { Project } from '../../scripts/ProjectData';
import MarkdownRenderer from '../markdown-renderer/MarkdownRenderer.tsx';
import './ProjectModal.css';

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
    const [markdownContent, setMarkdownContent] = useState<string>('');

    useEffect(() => {
        if (isOpen && project) {
            document.body.style.overflow = 'hidden';
            const filePath = `projects/${project.assetFolder}/writeup.md`;
            fetch(filePath)
                .then(response => response.text())
                .then(data => setMarkdownContent(data))
                .catch(err => {
                    console.error('Error fetching markdown file:', err);
                    setMarkdownContent('This page does not have a writeup');
                });
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [isOpen, project]);

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
            <h1 className={"centered"}>{project.title}</h1>
            <h3 className={"centered"}>{project.subtitle}</h3>
            <h6 className={"centered"}>Created by: {authors}</h6>
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
                            className={"showcaseImage"}
                            key={index}
                            src={
                                image.startsWith('http')
                                    ? image
                                    : `projects/${project.assetFolder}/img/${image}`

                            }
                            alt={`Slide ${index}`}
                        />
                    ))}
                </Carousel>
            </div>
            <div className="markdownContainer">
                <MarkdownRenderer content={markdownContent} />
            </div>
            <button onClick={onRequestClose}>Close</button>
        </Modal>
    );
};

export default ProjectModal;