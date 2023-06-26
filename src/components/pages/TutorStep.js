import Sidebar from "../components/Sidebar"
import { StepperProvider } from "../context/StepperContext";
import Content from "../layout/Content"
import Header from "../layout/Header";
import '../layout/Tutor.css';
import React, { useContext, useState } from "react";
import { StepperContext } from "../context/StepperContext";
import EnterGrammar from "../pages/EnterGrammar";
import FirstSet from '../pages/FirstSet';
import FollowSet from '../pages/FollowSet';
import LookUpTable from '../pages/LookUpTable';
import LLParser from '../pages/LLParser';
import DependencyGraph from '../pages/DependencyGraph';
import EmptySet from "./EmptySet";
import {createTheme, ThemeProvider} from '@mui/material/styles';


const theme = createTheme({
  palette: {
    primary: {
      main: '#fde047',
    },
    secondary:{
      main: '#fde047',
    }
  },
  input: {
    color: '#fde047',
  }
});

const handleSteps = (step) => {
    switch (step) {
      case 0:
        return <EnterGrammar />;
      case 1:
        return <EmptySet/>
      case 2:
        return <DependencyGraph/>;
      case 3:
        return <FirstSet />;
      case 4:
        return <FollowSet />;
      case 5:
        return <LookUpTable />;
      case 6:
        return <LLParser />;
      default:
        throw new Error("Unknown step");
    }
  };

export default function TutorStepPage () {
    const {activeStep, setActiveStep} = useContext(StepperContext);

    return (
            <div className="App">
                <Header className='h-1/10'/>
                <Content className="flex justify-center min-h-full" containerClassName='bg-zinc-900 h-9/10'>
                        <Sidebar className='bg-zinc-900 neumophism-shadow p-4 m-2'/>
                        <ThemeProvider theme={theme}>
                          <div className='flex justify-center bg-zinc-900 w-5/6 neumophism-shadow m-container flex p-4'>
                              {handleSteps(activeStep)}
                          </div>
                        </ThemeProvider>
                </Content>
            </div>
    )
}