import React, {useEffect, useState} from 'react';
import Draggable from "react-draggable";
import io from 'socket.io-client';

import './StickyNote.css'

const socket = io('http://localhost:4000');

const StickyNote = () => {
    const [notes, setNotes] = useState([]);
    const fonts = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana', "Anonymous Pro"];
    const colors = ['beige', 'lightpink', 'lightblue', 'lightgreen', 'lavender', 'wheat'];

    const addNote = () => {
        const newStickyNote = {
            id: notes.length + 1,
            content: 'This is text that can be edited by YOU! Go ahead and try it out. You can also drag this note around the screen.',
            position: {x: 0, y: 0},
            fontIndex: 0,
            colorIndex: 0,
        };

        setNotes([...notes, newStickyNote]);
        socket.emit('addNote', newStickyNote);
    };

    const handleRemoveNote = (id) => {
        setNotes(notes.filter(note => note.id !== id));
        socket.emit('removeNote', id);
    }

    const handleFontChange = (id) => {
        setNotes(notes.map(note => {
            if (note.id === id) {
                const newFontIndex = (note.fontIndex + 1) % fonts.length;
                return { ...note, fontIndex: newFontIndex };
            }
            return note;
        }));
    };

    const handleColorChange = (id) => {
        setNotes(notes.map(note => {
            if (note.id === id) {
                const newColorIndex = (note.colorIndex + 1) % colors.length;
                return { ...note, colorIndex: newColorIndex };
            }
            return note;
        }));
    };

    useEffect(() => {
        // Listen for updates from the server
        socket.on('updateNotes', (updatedNotes) => {
            setNotes(updatedNotes);
        });

        return () => socket.off('updateNotes');
    }, []);

    return (
        <>
            <div className="stickyNotes">
                {notes.map(note => (
                    <Draggable
                        key={note.id}
                        handle={'.handle'}
                        defaultPosition={{ x: note.position.x, y: note.position.y }}
                        position={null}
                        scale={1}
                    >
                        <div className="note" style={{fontFamily: fonts[note.fontIndex], backgroundColor: colors[note.colorIndex]}}>
                            <div className="handle">
                                <button className="fontButton" onClick={() => handleFontChange(note.id)}>A</button>
                                <button className="colorButton" onClick={() => handleColorChange(note.id)}>🎨</button>
                                <span className="dragText">New Note</span>
                                <button className="closeButton" onClick={() => handleRemoveNote(note.id)}>X</button>
                            </div>

                            <p contentEditable="true" suppressContentEditableWarning={true}>
                                {note.content}
                            </p>

                        </div>
                    </Draggable>
                ))}
            </div>
            <button className="newNoteButton" onClick={addNote}>Leave me a note!</button>
        </>
    )
}


export default StickyNote;