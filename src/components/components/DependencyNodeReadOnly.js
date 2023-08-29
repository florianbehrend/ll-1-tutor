import { Handle, Position } from 'reactflow';
import { StoredContext } from '../context/StoredContext';
import '../layout/css/DependencyNode.css';

/**
 * The `DependencyNode` component renders a node with handles for connecting to other nodes and includes functionality for toggling the active state of the node.
 * @param {object} data - The data object representing the node's properties.
 * @param {boolean} isConnectable - Determines if the node handles are connectable.
 * @returns {React.JSX.Element} - The JSX element representing the DependencyNode.
 */
function DependencyNode({ data, isConnectable }) {

  /**
   * Calculates the size of a text based on its length.
   * @param {string} text - The text for which the size is calculated.
   * @returns {number} - The calculated size value.
   */
  const setSize = (text) => {
    const size = 35 - 5 * Math.log(5.4 * text.length + 44);
    return size;
  };

  return (
    <StoredContext.Consumer>
      {() => (<div className={"dependency-node flex justify-center items-center overflow-hidden" + (data.active ? " dependency-node-active" : "") + (data.stepActive ? " dependency-node-stepactive" : "") + (data.stepDone ? " dependency-node-stepdone" : "")}>
        <div id="text" name="text" className="flex flex-col justify-center items-center">
          <label className='dependency-label' htmlFor="text" style={{ fontSize: setSize(data.label) + 'px' }}>{data.label}</label>
          <div className="max-w-3 focus:outline-none !overflow-hidden">
            <p className="scroll-text" ref={data.ref} style={{ minHeight: setSize(data.label) + 'px' }}>{data.text}</p>
          </div>
          {/* <input className='max-w-3 focus:outline-none scroll-text' type="text" rows={1} ref={data.ref} /> */}
        </div>
        <Handle type="target" position={Position.Top} id="a" isConnectable={isConnectable} />
        <Handle type="target" position={Position.Left} id="c" isConnectable={isConnectable} />
        <Handle type="target" position={Position.Right} id="d" isConnectable={isConnectable} />
        <Handle type="source" position={Position.Top} id="a" isConnectable={isConnectable} />
        <Handle type="source" position={Position.Left} id="c" isConnectable={isConnectable} />
        <Handle type="source" position={Position.Right} id="d" isConnectable={isConnectable} />
      </div>)}
    </StoredContext.Consumer>
  );
}

export default DependencyNode;
