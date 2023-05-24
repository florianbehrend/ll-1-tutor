import { Stepper, Step, StepLabel } from "@mui/material";
import React, { useContext, useState } from "react";
import { StepperContext } from "../context/StepperContext";
import '../layout/Sidebar.css';



// Step titles
const labels = ["Enter grammar",  "Nullable-Set", "Generate Dependency-Graph", "Generate First-Set", "Generate Follow-Set", "Generate Look-Up-Table", "Check if grammar is LL(1)", "LL(1) Parser Step-by-Step"];


export default function Sidebar ({className}) {
    const {activeStep, setActiveStep} = useContext(StepperContext);
    
      const handleReset = () => {
        setActiveStep(0);
      };

    return (
      <div className={className}>
        <Stepper activeStep={activeStep} orientation="vertical">
              {labels.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
        </Stepper>
        {/* <Stepper orientation="vertical">
          <Step>
            <StepLabel>Enter grammar</StepLabel>
          </Step>
          <Step>
            <StepLabel>Generate First-Set</StepLabel>
          </Step>
          <Step>
            <StepLabel>Generate Follow-Set</StepLabel>
          </Step>
          <Step>
            <StepLabel>Generate Look-Up-Table</StepLabel>
          </Step>
          <Step>
            <StepLabel>Check if grammar is LL(1)</StepLabel>
          </Step>
          <Step>
            <StepLabel>LL(1) Parser Step-by-Step</StepLabel>
          </Step>
        </Stepper> */}
      </div>
    );
  }