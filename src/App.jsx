import './App.css'
import ProjectThumbnail from "./projectThumbnail.jsx";
import StickyNote from "./StickyNote.jsx";
import {useState} from "react";

function App() {

    //placeholder project information - replace later
    const projects = getProjects();
    const [notes, setNotes] = useState([]);

    const addNote = () => {
        const newStickyNote = {
            id: notes.length + 1,
            content: 'This is text that can be edited by YOU! Go ahead and try it out. You can also drag this note around the screen.',
            position: {x: 0, y: 0},
        };

        setNotes([...notes, newStickyNote]);
    }

    return (
        <>
            <div className="mainContainer">
                <header>
                    <h1>Thomas Wessel</h1>
                    <h2>I make seemingly unrelated stuff that usually ends up being pretty neat</h2>
                </header>

                <section className="projectList">
                    <div className="projectHeader">
                        <p>Take a look at some of the projects that I've worked on</p>
                    </div>
                    <div className="projectItems">
                        {projects.map((project) => (
                            <ProjectThumbnail key={project.id} projectData={project}/>
                        ))}
                    </div>
                </section>
            </div>

            <div className="stickyNotes">
                {notes.map((note) => (
                    <StickyNote key={note.id} id={note.id} content={note.content} position={note.position}/>
                ))}
            </div>

            <button className="newNoteButton" onClick={addNote}>Leave me a note!</button>
        </>
    )
}

//TODO: Actually load my projects
function getProjects(){
    return [
        {
            id: 1,
            title: 'Example Project One',
            shortDesc: 'Not only is this an example, its the first one on the list!',
            imgURL: 'https://picsum.photos/300/200',
            url: "https://www.coolmathgames.com/0-papas-wingeria"
        },
        {
            id: 2,
            title: 'Example Project Two',
            shortDesc: 'But don\'t count out the second example, it\'s great too!',
            imgURL: 'https://picsum.photos/300/200',
            url: "https://github.com/collectioncard"
        },
        {
            id: 3,
            title: 'Example Project Three',
            shortDesc: 'Example three also exists.',
            imgURL: 'https://picsum.photos/300/200',
            url: "https://collectioncard.itch.io/"
        },
    ]
}

export default App
