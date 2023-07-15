import { StepperProvider } from "../context/StepperContext";
import '../layout/css/Tutor.css';
import React from "react";
import TutorStepPage from "./TutorStep";
import { StoredProvider } from "../context/StoredContext";

// TutorPage component
const TutorPage = () => {
    return (
        <StepperProvider>
            <StoredProvider>
                <TutorStepPage />
            </StoredProvider>
        </StepperProvider>
    )
}

export default TutorPage;