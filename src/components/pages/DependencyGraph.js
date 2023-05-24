import React, {useContext, useRef, useState, useCallback}  from 'react';
import Button from "../components/Button";
import { StepperContext } from "../context/StepperContext";
import {StoredContext} from '../context/StoredContext';
import ReactFlow, { Controls, Background, ReactFlowProvider, addEdge, useNodesState, useEdgesState} from 'reactflow';
import 'reactflow/dist/style.css';
import '../layout/DependencyGraph.css';
import AddNodes from '../components/AddNodes';
import DependencyNode from '../components/DependencyNode';
import SelfConnectingEdge from '../components/SelfConnectingEdge';

const initialNodes = [
  {
    id: '1',
    type: 'dependencyNode',
    data: { label: 'input node' },
    position: { x: 250, y: 5 },
  },
  {
    id: '2',
    type: 'dependencyNode',
    data: { label: 'input node' },
    position: { x: 100, y: 5 },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1',  target: '2', sourceHandle:"b", targetHandle:"a", label: 'this is an edge label' },
];

const nodeTypes = { dependencyNode: DependencyNode};

const edgeTypes = {
  selfconnecting: SelfConnectingEdge,
};

export default function DependencyGraph ({children, className, containerClassName,  ...props}) {

  const {activeStep, setActiveStep} = useContext(StepperContext);
  const {grammar, setGrammar} = useContext(StoredContext);

  let id = 0;
  const getId = () => `node_${id++}`;

  const handleNext = () => {    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const productionList = [...grammar.split("\n")];

  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  //TODO https://reactflow.dev/docs/examples/edges/custom-edge/
  //https://reactflow.dev/docs/api/nodes/handle/
  //https://reactflow.dev/docs/guides/custom-nodes/

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className='flex flex-col w-full h-full'>
         <div className='flex h-full'>
            <div className='w-1/3 border-2 border-solid rounded-lg border-color p-2 text-left overflow-scroll'>
                {productionList.map(item => (
                        <p>{item}</p>
                    ))}
            </div>
            <div className='w-2/3 border-2 border-solid rounded-lg border-color ml-2 h-full'>
              <ReactFlowProvider>
                <div className="reactflow-wrapper h-5/6" ref={reactFlowWrapper}>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    fitView
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                  >
                    <Controls />
                  </ReactFlow>
                </div>
              </ReactFlowProvider>
              <AddNodes/>
            </div>
         </div>
        <div>
            <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleBack}>
            Back
            </Button>
            <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleNext}>
            Next
            </Button>
        </div>
    </div>
  )
}