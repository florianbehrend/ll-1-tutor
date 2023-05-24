import { StepperProvider } from "../context/StepperContext";
import '../layout/Tutor.css';
import React, { useContext, useState } from "react";
import TutorStepPage from "./TutorStep";
import { StoredProvider } from "../context/StoredContext";

export default function TutorPage () {
    return (
        <StepperProvider>
            <StoredProvider>
                <TutorStepPage/>
            </StoredProvider>
        </StepperProvider>
    )
}