import { useCallback } from 'react';
import { Handle, Position } from 'reactflow';

const handleStyle = { left: 10 };

function TextUpdaterNode({ data, isConnectable }) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  return (
    <div className="dependency-node">
      <div>
        <div id="text" name="text" onChange={onChange} className="nodrag" />
      </div>
      <Handle type="target" position={Position.Top} id="a" isConnectable={isConnectable} />
      <Handle type="target" position={Position.Bottom} id="b" isConnectable={isConnectable} />
      <Handle type="target" position={Position.Left} id="c" isConnectable={isConnectable} />
      <Handle type="target" position={Position.Right} id="d" isConnectable={isConnectable} />

      <Handle type="source" position={Position.Top} id="a" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} id="b" isConnectable={isConnectable}/>
      <Handle type="source" position={Position.Left} id="c" isConnectable={isConnectable}/>
      <Handle type="source" position={Position.Right} id="d" isConnectable={isConnectable}/>
    </div>
  );
}

export default TextUpdaterNode;
