import { Stepper, Step, StepLabel } from "@mui/material";
import React, { useContext } from "react";
import { StepperContext } from "../context/StepperContext";
import '../layout/css/Sidebar.css';

// Step titles
const labels = [
  "Enter grammar",
  "Check for non-productive and non-reachable productions",
  "Empty-Attribute",
  "Generate Dependency-Graph",
  "Generate First-Set",
  "Generate Follow-Set",
  "Generate Lookahead-Table",
  "LL(1) Parser Step-by-Step"
];


/**
 * The `Sidebar` component represents a vertical stepper sidebar.
 * @param {object} props - The properties passed to the component.
 * @param {string} props.className - The CSS classes for styling the sidebar div.
 * @returns {React.JSX.Element} - The JSX element representing the sidebar.
 */
const Sidebar = ({ className }) => {
  const { activeStep } = useContext(StepperContext);

  return (
    <div className={className}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {labels.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </div>
  );
}

export default Sidebar;