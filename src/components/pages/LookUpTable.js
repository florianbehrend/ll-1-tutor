import React, {useContext}  from 'react';
import Button from "@mui/material/Button";
import { StepperContext } from "../context/StepperContext";

export default function LookUpTable ({children, className, containerClassName,  ...props}) {

  const {activeStep, setActiveStep} = useContext(StepperContext);

  const handleNext = () => {    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <div>
        {children}
        <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleBack}>
          Back
        </Button>
        <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleNext}>
          Next
        </Button>
    </div>
  )
}