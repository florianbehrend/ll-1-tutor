import { useCallback, useState, useContext } from 'react';
import { Handle, Position } from 'reactflow';
import {StoredContext} from '../context/StoredContext';
import { useEffect } from 'react';

const handleStyle = { left: 10 };

function DependencyNode({ data, isConnectable }) {
  const [active, setActive] = useState(false);

  const onChange = useCallback((evt) => {
    //console.log(evt.target.value);
    //data.textInput = evt.target.value;
  }, []);

const setSize = (text) => {    
  const size = 35 - 5*Math.log(5.4*text.length+44);
  return size;
};

const clickHandler = (event) => {
  if(event.detail == 2){
    setActive(!active); //for refresh
    data.active = !data.active;
  }
}

  return (
    <StoredContext.Consumer>
      {val => (<div className={"dependency-node flex justify-center items-center overflow-hidden" + (data.active ? " dependency-node-active" : "")} onClick={clickHandler}>
        <div id="text" name="text" onChange={onChange} className="flex flex-col justify-center items-center">
          <label className='dependency-label' htmlFor="text" style={{fontSize: setSize(data.label) + 'px'}}>{data.label}</label>
          <input className='max-w-3 focus:outline-none' type="text" rows={1} ref={data.ref}/>
        </div>
        <Handle type="target" position={Position.Top} id="a" isConnectable={isConnectable} />
        <Handle type="target" position={Position.Left} id="c" isConnectable={isConnectable} />
        <Handle type="target" position={Position.Right} id="d" isConnectable={isConnectable} />
        <Handle type="source" position={Position.Top} id="a" isConnectable={isConnectable} />
        <Handle type="source" position={Position.Left} id="c" isConnectable={isConnectable}/>
        <Handle type="source" position={Position.Right} id="d" isConnectable={isConnectable}/>
      </div>)}
    </StoredContext.Consumer>
  );
}

export default DependencyNode;
