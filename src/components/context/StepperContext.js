import { createContext, useState } from 'react';

export const StepperContext = createContext();

export const StepperProvider = ({ children }) => {
    const [activeStep, setActiveStep] = useState(0);
    const value = { activeStep, setActiveStep };

    return (
        <StepperContext.Provider value={value}>
            {children}
        </StepperContext.Provider>
    );
}