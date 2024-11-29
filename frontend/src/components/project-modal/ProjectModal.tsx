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

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Project Details"
            overlayClassName="modalOverlay"
            className="modalContent"
        >
            <h2>{project.title}</h2>
            <h3>{project.subtitle}</h3>
            <p>{project.description_long}</p>
            <button onClick={onRequestClose}>Close</button>
        </Modal>
    );
};

export default ProjectModal;