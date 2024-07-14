import './StickyNote.css'

import Draggable from "react-draggable";
import {useState} from "react";



const StickyNote = ({ id, content, position }) => {

    const [StickyNotes, setStickyNotes] = useState([])

    return (
        <Draggable
            key={id}
            handle={".handle"}
            defaultPosition={{x: position.x, y: position.y}}
            position={null}
            scale={1}
            >

            <div className="note">
                <div className="handle">Drag the note from here</div>
                <p contentEditable="true">
                    {content}
                </p>
            </div>
        </Draggable>
    )
}



export default StickyNote;