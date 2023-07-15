import Sidebar from "../components/Sidebar"
import Content from "../layout/js/Content"
import Header from "../layout/js/Header";
import '../layout/css/Tutor.css';
import React, { useContext } from "react";
import { StepperContext } from "../context/StepperContext";
import EnterGrammar from "../pages/EnterGrammar";
import FirstSet from '../pages/FirstSet';
import FollowSet from '../pages/FollowSet';
import LookUpTable from '../pages/LookUpTable';
import LLParser from '../pages/LLParser';
import DependencyGraph from '../pages/DependencyGraph';
import EmptySet from "./EmptySet";
import ReducedGrammar from "./ReducedGrammar";
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Create custom theme using MUI's createTheme function
const theme = createTheme({
  palette: {
    primary: {
      main: '#fde047',
    },
    secondary: {
      main: '#fde047',
    }
  },
  input: {
    color: '#fde047',
  }
});

// Function to handle rendering steps based on activeStep value
const handleSteps = (step) => {
  switch (step) {
    case 0:
      return <EnterGrammar />;
    case 1:
      return <ReducedGrammar />;
    case 2:
      return <EmptySet />
    case 3:
      return <DependencyGraph />;
    case 4:
      return <FirstSet />;
    case 5:
      return <FollowSet />;
    case 6:
      return <LookUpTable />;
    case 7:
      return <LLParser />;
    default:
      throw new Error("Unknown step");
  }
};

// TutorStepPage component
const TutorStepPage = () => {
  const { activeStep } = useContext(StepperContext);

  return (
    <div className="App">
      <Header className='h-1/10' />
      <Content className="flex justify-center min-h-full" containerClassName='bg-zinc-900 h-9/10'>
        <Sidebar className='bg-zinc-900 neumophism-shadow p-4 m-2 max-w-15' />
        <ThemeProvider theme={theme}>
          <div className='flex justify-center bg-zinc-900 w-5/6 neumophism-shadow m-container flex p-4'>
            {handleSteps(activeStep)}
          </div>
        </ThemeProvider>
      </Content>
    </div>
  )
}

export default TutorStepPage;