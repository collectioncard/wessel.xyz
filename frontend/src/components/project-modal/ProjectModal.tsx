import React from 'react';
import Modal from 'react-modal';
import { Project } from '../../scripts/ProjectData';
import './ProjectModal.css';

interface ProjectModalProps {
    isOpen: boolean;
    onRequestClose: () => void;
    project: Project | null;
}

Modal.setAppElement('#root');

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onRequestClose, project }) => {
    if (!project) return null;

    //generate a string of every author in the authors array
    let authors2 = 'Created by: ';
    project.authors.forEach((author, index) => {
        authors2 += author.name;
        if (index !== project.authors.length - 1) {
            authors2 += ', ';
        }
    });

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
            <h6>{authors2}</h6>
            <p>{project.page_body}</p>
            <button onClick={onRequestClose}>Close</button>
        </Modal>
    );
};

export default ProjectModal;