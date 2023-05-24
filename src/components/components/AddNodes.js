import React from 'react';

const AddNodes = () => {

    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    }

  return (
    <div className='h-1/6 flex flex-col'>
        <div className="text-yellow-200 p-1">You can drag these nodes to the pane.</div>
        <div className='flex justify-evenly'>
            <div className="node bg-yellow-200" onDragStart={(event) => onDragStart(event, 'dependencyNode')} draggable>
            Node
            </div>
        </div>
    </div>
  )
}

export default AddNodes

